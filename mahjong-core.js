/* =====================================================================
   mahjong-core.js ― 17歩の 中身（役・飜・満貫・待ち・点棒）／ T327・コーダ
   ---------------------------------------------------------------------
   仕様の 正：設計図 追記⑭ ＋ logs/T326_17歩仕様書_ルル.md

   ★ このファイルは 画面を 1つも 知らない。
       ・DOM に さわらない
       ・画面に 出す 文を 組み立てない（役の 名前・印◎△× は データとして 返すだけ）
   ★ Node からも ブラウザからも 同じ 1本を 読む（勝ち負けを 数える 側と
     遊ぶ 側が 同じ コード。分けると 必ず ずれる）。外部ライブラリ 0・通信 0。
   ★ 牌の 書き方は mahjong-tiles.js と 同じ '2s' 形：
       m＝萬子 p＝筒子 s＝索子 z＝字牌（1z東 2z南 3z西 4z北 5z白 6z發 7z中）
     手は '123m456p11z' の 文字列でも ['1m','2m',…] の 配列でも 渡せる。

   ■ 17歩の 決まり（この ファイルが 守っているもの）
     ・4飜で 満貫。符は 数えない（追記⑭ ①）
     ・満貫の 判定：表ドラ・一発・河底撈魚は 入れる／裏ドラは 入れない（点にだけ 足す）
     ・立直は いつも 付く（2人とも 立直あつかい・1飜）
     ・点：満貫8000・跳満12000・倍満16000・三倍満24000・役満32000（子）。親は 1.5倍
     ・役満は 重なった 数だけ 倍（役満1つに つき 1倍。例：大三元＋字一色＋四暗刻単騎＝3倍＝子96000）
     ・四暗刻単騎・国士無双十三面は 17歩の 特別ルールで ふつうの 役満（1倍）
     ・純正九蓮宝燈・大四喜は ダブル役満（2倍）。ほかの 役満と 重なれば さらに 足す
     ・点は 役満の 倍の 数 × 子32000／親48000（4倍 以上も 同じ 式で 伸ばす）
     ・13飜 以上は 数え役満
     ・シャンポンの ロンで できた 刻子は 明刻（三暗刻・四暗刻に 数えない）
     ・自分が 4枚 持っている 牌は 待ちに ならない／七対子に 同じ牌 4枚は 使えない
     ・子の 自風は 西（向かい合わせ）。親は 東

   ■ 山の ことは 何も 計算しない（追記⑭ ⑥）
     待ちの 印 waitMarks() は「いま 選んでいる 13枚」と「場の 決まり」だけで 決まる。
     34枚・山を 受け取る 関数は 配る deal() だけ。

   ■ 使い方（抜粋）
     MJCore.waits('23m234p234s567s99p')                    // ['1m','4m']
     MJCore.judge('23m234p234s567s99p', '4m', { dealer:false, roundWind:'1z',
                   doraIndicators:['8p'], uraIndicators:[] })  // 役・飜・満貫・点
     MJCore.waitMarks(hand13, ctx)                        // 待ちごとに ◎／△／×
     CPU から 速く 呼ぶ ときは MJCore.fast.*（34個の 数の 配列で やりとり）
   ===================================================================== */
(function (global) {
  'use strict';

  /* ───────── 牌の 番号 ─────────
     0-8 萬子 / 9-17 筒子 / 18-26 索子 / 27東 28南 29西 30北 31白 32發 33中 */
  var SUIT_CH = 'mpsz';
  var CODES = [];
  for (var s0 = 0; s0 < 4; s0++) for (var n0 = 1; n0 <= (s0 === 3 ? 7 : 9); n0++) CODES.push(n0 + SUIT_CH[s0]);

  function isHonor(i) { return i >= 27; }
  function isTerm(i) { return i < 27 && (i % 9 === 0 || i % 9 === 8); }
  function isYao(i) { return i >= 27 || i % 9 === 0 || i % 9 === 8; }
  function suitOf(i) { return i < 27 ? (i / 9) | 0 : 3; }
  function isDragon(i) { return i >= 31; }
  function isWind(i) { return i >= 27 && i <= 30; }
  var YAOCHU = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];
  var GREEN = { 19: 1, 20: 1, 21: 1, 23: 1, 25: 1, 32: 1 };   // 2s3s4s6s8s發

  /* ───────── 決まりの 数（ここ 1か所） ───────── */
  var RULES = {
    startPoints: 35000,      // 持ち点（追記⑭）
    riichiStick: 1000,       // 立直棒
    honbaPoints: 300,        // 1本場
    childPay: 8000,          // 子の 満貫
    dealerPay: 12000,        // 親の 満貫（1.5倍）
    manganHan: 4,            // 4飜で 満貫
    turns: 17,               // 1人 17回 切る
    dealerSeat: '1z',        // 親の 自風
    childSeat: '3z'          // 子の 自風（西＝向かい合わせ・仕様書 §2-2 ★）
  };

  /* ───────── 役の 表（名前は 漢字・追記⑭ ④） ───────── */
  var YAKU = {
    riichi:   { name: '立直',       han: 1 },
    ippatsu:  { name: '一発',       han: 1 },
    houtei:   { name: '河底撈魚',   han: 1 },
    pinfu:    { name: '平和',       han: 1 },
    tanyao:   { name: '断么九',     han: 1 },
    iipeikou: { name: '一盃口',     han: 1 },
    haku:     { name: '役牌 白',    han: 1 },
    hatsu:    { name: '役牌 發',    han: 1 },
    chun:     { name: '役牌 中',    han: 1 },
    bakaze:   { name: '場風',       han: 1 },
    jikaze:   { name: '自風',       han: 1 },
    chiitoi:  { name: '七対子',     han: 2 },
    sanshoku: { name: '三色同順',   han: 2 },
    ittsu:    { name: '一気通貫',   han: 2 },
    chanta:   { name: '混全帯么九', han: 2 },
    toitoi:   { name: '対々和',     han: 2 },
    sanankou: { name: '三暗刻',     han: 2 },
    sanshokudoukou: { name: '三色同刻', han: 2 },
    shousangen: { name: '小三元',   han: 2 },
    honroutou: { name: '混老頭',    han: 2 },
    junchan:  { name: '純全帯么九', han: 3 },
    ryanpeikou: { name: '二盃口',   han: 3 },
    honitsu:  { name: '混一色',     han: 3 },
    chinitsu: { name: '清一色',     han: 6 },
    dora:     { name: 'ドラ',       han: 0 },   // 枚数ぶん
    ura:      { name: '裏ドラ',     han: 0 },   // 枚数ぶん（点だけ）
    kokushi:  { name: '国士無双',   yakuman: 1 },
    suuankou: { name: '四暗刻',     yakuman: 1 },
    daisangen: { name: '大三元',    yakuman: 1 },
    shousuushii: { name: '小四喜',  yakuman: 1 },
    daisuushii: { name: '大四喜',   yakuman: 2 },   // ダブル役満
    tsuuiisou: { name: '字一色',    yakuman: 1 },
    ryuuiisou: { name: '緑一色',    yakuman: 1 },
    chinroutou: { name: '清老頭',   yakuman: 1 },
    chuuren:  { name: '九蓮宝燈',   yakuman: 1 },
    junseichuuren: { name: '純正九蓮宝燈', yakuman: 2 }   // 9面待ち・ダブル役満
  };
  var YAKU_ORDER = ['riichi', 'ippatsu', 'houtei', 'pinfu', 'tanyao', 'iipeikou', 'haku', 'hatsu', 'chun',
    'bakaze', 'jikaze', 'chiitoi', 'sanshoku', 'ittsu', 'chanta', 'toitoi', 'sanankou', 'sanshokudoukou',
    'shousangen', 'honroutou', 'junchan', 'ryanpeikou', 'honitsu', 'chinitsu',
    'kokushi', 'suuankou', 'daisangen', 'shousuushii', 'daisuushii', 'tsuuiisou', 'ryuuiisou', 'chinroutou', 'chuuren', 'junseichuuren'];
  var WIND_NAME = { 27: '東', 28: '南', 29: '西', 30: '北' };

  function Y(id, han, extra) {
    var d = YAKU[id];
    var e = { id: id, name: d.name + (extra ? ' ' + extra : '') };
    if (d.yakuman) e.yakuman = d.yakuman; else e.han = (han != null ? han : d.han);   // 役満は 倍の 数
    return e;
  }

  /* ───────── 入力を 34個の 数に ───────── */
  function toIndex(code) {
    if (typeof code !== 'string' || code.length !== 2) throw new Error('mahjong-core: 牌の 書き方が ちがう: ' + code);
    var n = code.charCodeAt(0) - 48, s = SUIT_CH.indexOf(code[1]);
    if (s < 0 || !(n >= 1 && n <= (s === 3 ? 7 : 9))) throw new Error('mahjong-core: 牌の 書き方が ちがう: ' + code);
    return s * 9 + n - 1;
  }
  function toCode(i) { return CODES[i]; }

  function toCounts(input) {
    var c = new Array(34).fill(0), i;
    if (typeof input === 'string') {
      var buf = [], str = input.replace(/[\s,]/g, '');
      for (i = 0; i < str.length; i++) {
        var ch = str[i];
        if (ch >= '0' && ch <= '9') { buf.push(ch); continue; }
        if (SUIT_CH.indexOf(ch) < 0 || !buf.length) throw new Error('mahjong-core: 読めない 手: ' + input);
        for (var k = 0; k < buf.length; k++) c[toIndex(buf[k] + ch)]++;
        buf = [];
      }
      if (buf.length) throw new Error('mahjong-core: 読めない 手: ' + input);
    } else if (Array.isArray(input)) {
      if (input.length === 34 && typeof input[0] === 'number') {
        for (i = 0; i < 34; i++) c[i] = input[i] | 0;
      } else {
        for (i = 0; i < input.length; i++) c[toIndex(input[i])]++;
      }
    } else {
      throw new Error('mahjong-core: 手が ありません');
    }
    for (i = 0; i < 34; i++) if (c[i] < 0 || c[i] > 4) throw new Error('mahjong-core: 同じ牌が 5枚 以上: ' + CODES[i]);
    return c;
  }
  function countsToString(c) {
    var out = '';
    for (var s = 0; s < 4; s++) {
      var part = '';
      for (var n = 0; n < (s === 3 ? 7 : 9); n++) for (var k = 0; k < c[s * 9 + n]; k++) part += (n + 1);
      if (part) out += part + SUIT_CH[s];
    }
    return out;
  }
  function countsToList(c) {
    var out = [];
    for (var i = 0; i < 34; i++) for (var k = 0; k < c[i]; k++) out.push(CODES[i]);
    return out;
  }
  function sum(c) { var t = 0; for (var i = 0; i < 34; i++) t += c[i]; return t; }

  /* ───────── ドラ：表示牌の 次（9→1・北→東・中→白 に 回る） ───────── */
  function doraIdx(ind) {
    if (ind < 27) return suitOf(ind) * 9 + (ind % 9 + 1) % 9;
    if (ind <= 30) return 27 + (ind - 27 + 1) % 4;
    return 31 + (ind - 31 + 1) % 3;
  }
  function doraFromIndicator(code) { return CODES[doraIdx(toIndex(code))]; }

  /* ───────── 和了の 形 ───────── */
  // 雀頭を 抜いた あと、ぜんぶ 面子に なるか（早い 版）
  function meldsOk(c, i) {
    while (i < 34 && c[i] === 0) i++;
    if (i === 34) return true;
    var ok;
    if (c[i] >= 3) { c[i] -= 3; ok = meldsOk(c, i); c[i] += 3; if (ok) return true; }
    if (i < 27 && i % 9 <= 6 && c[i + 1] > 0 && c[i + 2] > 0) {
      c[i]--; c[i + 1]--; c[i + 2]--; ok = meldsOk(c, i); c[i]++; c[i + 1]++; c[i + 2]++;
      if (ok) return true;
    }
    return false;
  }
  function isKokushi(c) {
    var t = 0;
    for (var k = 0; k < YAOCHU.length; k++) { if (c[YAOCHU[k]] < 1) return false; t += c[YAOCHU[k]]; }
    return t === 14 && sum(c) === 14;
  }
  function isChiitoi(c) {
    var pairs = 0;
    for (var i = 0; i < 34; i++) { if (c[i] === 2) pairs++; else if (c[i] !== 0) return false; }
    return pairs === 7;   // 同じ牌 4枚は 2対に ならない
  }
  function isAgariIdx(c) {
    if (sum(c) !== 14) return false;
    for (var i = 0; i < 34; i++) if (c[i] > 4) return false;
    if (isKokushi(c) || isChiitoi(c)) return true;
    for (var p = 0; p < 34; p++) {
      if (c[p] < 2) continue;
      c[p] -= 2; var ok = meldsOk(c, 0); c[p] += 2;
      if (ok) return true;
    }
    return false;
  }

  // 雀頭＋4面子 の 分け方を ぜんぶ
  function decompositions(c) {
    var res = [];
    for (var p = 0; p < 34; p++) {
      if (c[p] < 2) continue;
      c[p] -= 2;
      var melds = [];
      (function rec(i) {
        while (i < 34 && c[i] === 0) i++;
        if (i === 34) { res.push({ pair: p, melds: melds.slice() }); return; }
        if (c[i] >= 3) { c[i] -= 3; melds.push({ t: 'k', i: i }); rec(i); melds.pop(); c[i] += 3; }
        if (i < 27 && i % 9 <= 6 && c[i + 1] > 0 && c[i + 2] > 0) {
          c[i]--; c[i + 1]--; c[i + 2]--; melds.push({ t: 's', i: i }); rec(i);
          melds.pop(); c[i]++; c[i + 1]++; c[i + 2]++;
        }
      })(0);
      c[p] += 2;
    }
    return res;
  }

  /* ───────── 待ち（13枚 → 待ち牌） ───────── */
  function waitsIdx(c13) {
    var w = [];
    if (sum(c13) !== 13) return w;
    for (var t = 0; t < 34; t++) {
      if (c13[t] >= 4) continue;            // 自分が 4枚 持っている 牌は 待てない
      c13[t]++;
      if (isAgariIdx(c13)) w.push(t);
      c13[t]--;
    }
    return w;
  }

  /* ───────── 場の 決まりを そろえる ─────────
     ctx = { dealer, roundWind:'1z'|'2z', seatWind, doraIndicators:[], uraIndicators:[],
             ippatsu, houtei, riichi(ふだん true) } */
  function normCtx(ctx) {
    ctx = ctx || {};
    var dealer = !!ctx.dealer;
    var round = toIndex(ctx.roundWind || '1z');
    var seat = toIndex(ctx.seatWind || (dealer ? RULES.dealerSeat : RULES.childSeat));
    if (!isWind(round) || !isWind(seat)) throw new Error('mahjong-core: 風が ちがう');
    return {
      dealer: dealer, round: round, seat: seat,
      dora: (ctx.doraIndicators || []).map(function (x) { return doraIdx(toIndex(x)); }),
      ura: (ctx.uraIndicators || []).map(function (x) { return doraIdx(toIndex(x)); }),
      ippatsu: !!ctx.ippatsu, houtei: !!ctx.houtei,
      riichi: ctx.riichi !== false
    };
  }

  /* ───────── 飜 → 満貫・跳満…（符なし） ───────── */
  function rankOf(han, yakuman) {
    if (yakuman > 0) {
      return { id: yakuman === 1 ? 'yakuman' : 'yakuman' + yakuman,
        name: yakuman === 1 ? '役満' : yakuman === 2 ? 'ダブル役満' : yakuman === 3 ? 'トリプル役満' : yakuman + '倍役満',
        mult: 4 * yakuman };
    }
    if (han >= 13) return { id: 'kazoe', name: '役満', mult: 4 };   // 数え役満
    if (han >= 11) return { id: 'sanbaiman', name: '三倍満', mult: 3 };
    if (han >= 8) return { id: 'baiman', name: '倍満', mult: 2 };
    if (han >= 6) return { id: 'haneman', name: '跳満', mult: 1.5 };
    if (han >= RULES.manganHan) return { id: 'mangan', name: '満貫', mult: 1 };
    return null;
  }
  function basePay(isDealer, rank) {
    if (!rank) return 0;
    return (isDealer ? RULES.dealerPay : RULES.childPay) * rank.mult;
  }

  // 役満の 倍の 数（重なった 役満を ぜんぶ 足す。純正九蓮・大四喜は 1つで 2）
  function ymTimes(list) { var t = 0; for (var i = 0; i < list.length; i++) t += list[i].yakuman; return t; }

  /* ───────── 役の 判定（14枚・和了牌つき） ───────── */
  function judgeIdx(c14, win, cx) {
    if (!(win >= 0 && win < 34) || c14[win] < 1) return null;
    var i, tiles = [];
    for (i = 0; i < 34; i++) { if (c14[i] > 4) return null; for (var k = 0; k < c14[i]; k++) tiles.push(i); }
    if (tiles.length !== 14) return null;

    var allSimple = true, allHonor = true, allYao = true, allTerm = true, allGreen = true, hasHonor = false;
    var suitSeen = [false, false, false];
    for (i = 0; i < 14; i++) {
      var t = tiles[i];
      if (isYao(t)) allSimple = false; else allYao = false;
      if (isHonor(t)) hasHonor = true; else { allHonor = false; suitSeen[suitOf(t)] = true; }
      if (!isTerm(t)) allTerm = false;
      if (!GREEN[t]) allGreen = false;
    }
    var nSuits = (suitSeen[0] ? 1 : 0) + (suitSeen[1] ? 1 : 0) + (suitSeen[2] ? 1 : 0);
    var flush = nSuits === 1 ? (hasHonor ? 'honitsu' : 'chinitsu') : null;

    var cands = [];

    // 国士無双（十三面も 1倍 ―― 17歩の 特別ルール）
    if (isKokushi(c14)) cands.push({ form: 'kokushi', wait: 'kokushi', yaku: [], ym: [Y('kokushi')] });

    // 七対子
    if (isChiitoi(c14)) {
      var y7 = [Y('chiitoi')];
      if (allSimple) y7.push(Y('tanyao'));
      if (allYao && hasHonor && !allHonor) y7.push(Y('honroutou'));
      if (flush) y7.push(Y(flush));
      cands.push({ form: 'chiitoi', wait: 'tanki', yaku: y7, ym: allHonor ? [Y('tsuuiisou')] : [] });
    }

    // 九蓮宝燈（清一色で 1112345678999＋1）。0 なし／1 九蓮宝燈／2 純正（和了牌を 抜くと ちょうど 1112345678999）
    var chuuren = 0;
    if (flush === 'chinitsu') {
      var b = suitOf(tiles[0]) * 9, need = [3, 1, 1, 1, 1, 1, 1, 1, 3];
      if (need.every(function (nd, j) { return c14[b + j] >= nd; })) {
        chuuren = need.every(function (nd, j) { return c14[b + j] - (b + j === win ? 1 : 0) === nd; }) ? 2 : 1;
      }
    }

    // ふつうの 形：分け方 × 和了牌の 置き場所 を ぜんぶ
    var decs = decompositions(c14);
    for (var di = 0; di < decs.length; di++) {
      var d = decs[di], places = [];
      if (d.pair === win) places.push('tanki');
      for (var mi = 0; mi < d.melds.length; mi++) {
        var m = d.melds[mi];
        if (m.t === 'k' && m.i === win) places.push('shanpon');
        if (m.t === 's' && win >= m.i && win <= m.i + 2) {
          var pos = win - m.i, st = m.i % 9, kind;
          if (pos === 1) kind = 'kanchan';
          else if ((pos === 2 && st === 0) || (pos === 0 && st === 6)) kind = 'penchan';
          else kind = 'ryanmen';
          places.push(kind);
        }
      }
      for (var pi = 0; pi < places.length; pi++) {
        cands.push(evalStd(d, places[pi], win, cx, {
          allSimple: allSimple, allHonor: allHonor, allYao: allYao, allTerm: allTerm,
          allGreen: allGreen, hasHonor: hasHonor, flush: flush, chuuren: chuuren }));
      }
    }
    if (!cands.length) return null;

    // 場の 役（立直・一発・河底）と ドラ
    var common = [];
    if (cx.riichi) common.push(Y('riichi'));
    if (cx.ippatsu) common.push(Y('ippatsu'));
    if (cx.houtei) common.push(Y('houtei'));
    var dora = 0, ura = 0;
    for (i = 0; i < cx.dora.length; i++) dora += c14[cx.dora[i]];
    for (i = 0; i < cx.ura.length; i++) ura += c14[cx.ura[i]];

    // いちばん 高い 読み方を 取る（役満の 倍の 数 → 飜）
    var best = null;
    for (i = 0; i < cands.length; i++) {
      var cd = cands[i], han = 0, list;
      if (cd.ym.length) {
        list = cd.ym.slice();
      } else {
        list = common.concat(cd.yaku);
        if (dora) list.push(Y('dora', dora));
        for (var j = 0; j < list.length; j++) han += list[j].han;
      }
      var sc = { cand: cd, list: list, han: han, ym: ymTimes(cd.ym) };
      if (!best || sc.ym > best.ym || (sc.ym === best.ym && sc.han > best.han)) best = sc;
    }

    var ymN = best.ym;
    var judgedHan = ymN ? 0 : best.han;
    var uraHan = ymN ? 0 : ura;
    var totalHan = judgedHan + uraHan;
    var yakuList = best.list.slice();
    if (uraHan) yakuList.push(Y('ura', uraHan));
    var mangan = ymN > 0 || judgedHan >= RULES.manganHan;     // 裏ドラは 入れない
    var rank = mangan ? rankOf(totalHan, ymN) : null;          // 点は 裏ドラ込み
    return {
      win: CODES[win], form: best.cand.form, wait: best.cand.wait,
      yaku: yakuList, yakuman: ymN,
      han: judgedHan,          // 満貫の 判定に 使う 飜（裏ドラ 抜き）
      dora: ymN ? 0 : dora, ura: uraHan,
      totalHan: totalHan,      // 点に 使う 飜（裏ドラ 込み）
      mangan: mangan,
      rank: rank,
      dealer: cx.dealer,
      pay: basePay(cx.dealer, rank)
    };
  }

  function evalStd(d, place, win, cx, f) {
    var seqs = [], trips = [], pair = d.pair, i;
    for (i = 0; i < d.melds.length; i++) (d.melds[i].t === 's' ? seqs : trips).push(d.melds[i].i);
    // ロンで できた 刻子は 明刻
    var openTrip = place === 'shanpon' ? win : -1;
    var concealed = 0;
    for (i = 0; i < trips.length; i++) if (trips[i] !== openTrip) concealed++;
    var dragT = 0, windT = 0;
    for (i = 0; i < trips.length; i++) { if (isDragon(trips[i])) dragT++; if (isWind(trips[i])) windT++; }

    var ym = [];
    if (concealed === 4) ym.push(Y('suuankou'));
    if (dragT === 3) ym.push(Y('daisangen'));
    if (windT === 4) ym.push(Y('daisuushii'));
    else if (windT === 3 && isWind(pair)) ym.push(Y('shousuushii'));
    if (f.allHonor) ym.push(Y('tsuuiisou'));
    if (f.allGreen) ym.push(Y('ryuuiisou'));
    if (f.allTerm) ym.push(Y('chinroutou'));
    if (f.chuuren) ym.push(Y(f.chuuren === 2 ? 'junseichuuren' : 'chuuren'));

    var yaku = [];
    var yakuhaiPair = isDragon(pair) || pair === cx.seat || pair === cx.round;
    if (seqs.length === 4 && !yakuhaiPair && place === 'ryanmen') yaku.push(Y('pinfu'));
    if (f.allSimple) yaku.push(Y('tanyao'));

    var same = {}, peko = 0;
    for (i = 0; i < seqs.length; i++) same[seqs[i]] = (same[seqs[i]] || 0) + 1;
    for (var key in same) peko += (same[key] / 2) | 0;
    if (peko >= 2) yaku.push(Y('ryanpeikou')); else if (peko === 1) yaku.push(Y('iipeikou'));

    for (i = 0; i < trips.length; i++) {
      var t = trips[i];
      if (t === 31) yaku.push(Y('haku'));
      if (t === 32) yaku.push(Y('hatsu'));
      if (t === 33) yaku.push(Y('chun'));
      if (t === cx.round) yaku.push(Y('bakaze', null, WIND_NAME[t]));
      if (t === cx.seat) yaku.push(Y('jikaze', null, WIND_NAME[t]));
    }

    var has = function (x) { return seqs.indexOf(x) >= 0; };
    for (var n = 0; n < 7; n++) if (has(n) && has(9 + n) && has(18 + n)) { yaku.push(Y('sanshoku')); break; }
    for (var b = 0; b < 27; b += 9) if (has(b) && has(b + 3) && has(b + 6)) { yaku.push(Y('ittsu')); break; }

    if (seqs.length > 0) {
      var groupsYao = isYao(pair);
      for (i = 0; i < trips.length; i++) if (!isYao(trips[i])) groupsYao = false;
      for (i = 0; i < seqs.length; i++) if (!(seqs[i] % 9 === 0 || seqs[i] % 9 === 6)) groupsYao = false;
      if (groupsYao) yaku.push(Y(f.hasHonor ? 'chanta' : 'junchan'));
    } else if (f.allYao && f.hasHonor && !f.allHonor) {
      yaku.push(Y('honroutou'));
    }

    if (trips.length === 4) yaku.push(Y('toitoi'));
    if (concealed === 3) yaku.push(Y('sanankou'));
    for (var q = 0; q < 9; q++) {
      if (trips.indexOf(q) >= 0 && trips.indexOf(9 + q) >= 0 && trips.indexOf(18 + q) >= 0) { yaku.push(Y('sanshokudoukou')); break; }
    }
    if (dragT === 2 && isDragon(pair)) yaku.push(Y('shousangen'));
    if (f.flush) yaku.push(Y(f.flush));

    return { form: 'std', wait: place, yaku: yaku, ym: ym };
  }

  /* ───────── 待ちごとの 印（◎ 満貫／△ 一発・河底なら 満貫／× とどかない） ─────────
     chances：これから 付く かもしれない もの。省くと 局の はじめ（親：一発と 河底／子：一発）。
     裏ドラ・一発・河底は 入れずに 数え、3飜 で あと 一発か 河底が 付く 見込みが あれば △。 */
  function defaultChances(dealer) { return { ippatsu: true, houtei: !!dealer }; }

  function marksIdx(c13, cx, chances) {
    var n = sum(c13), out = { tiles: n, tenpai: false, waits: [] };
    if (n !== 13) return out;
    chances = chances || defaultChances(cx.dealer);
    var base = { dealer: cx.dealer, round: cx.round, seat: cx.seat, dora: cx.dora, ura: [],
      ippatsu: false, houtei: false, riichi: cx.riichi };
    var w = waitsIdx(c13);
    for (var k = 0; k < w.length; k++) {
      var t = w[k];
      c13[t]++; var r = judgeIdx(c13, t, base); c13[t]--;
      var mark = '×', via = [];
      if (r.mangan) mark = '◎';
      else if (!r.yakuman && r.han === RULES.manganHan - 1 && (chances.ippatsu || chances.houtei)) {
        mark = '△';
        if (chances.ippatsu) via.push('ippatsu');
        if (chances.houtei) via.push('houtei');
      }
      out.waits.push({ tile: CODES[t], mark: mark, via: via, han: r.han, yakuman: r.yakuman });
    }
    out.tenpai = w.length > 0;
    return out;
  }

  /* ───────── 一発・河底の 範囲（仕様書 §3） ─────────
     親：子の 1打目で 一発・子の 17打目（最後の 1打）で 河底
     子：親の 1打目と 2打目で 一発・河底は 無し
     discardNo：ロンする 牌が 相手の 何打目か（1〜17） */
  function ronBonus(isDealer, discardNo) {
    if (isDealer) return { ippatsu: discardNo === 1, houtei: discardNo === RULES.turns };
    return { ippatsu: discardNo <= 2, houtei: false };
  }
  // これから 相手が 切る 牌（nextDiscardNo 打目 以降）で まだ 付く かもしれない もの
  function remainingChances(isDealer, nextDiscardNo) {
    if (isDealer) return { ippatsu: nextDiscardNo <= 1, houtei: nextDiscardNo <= RULES.turns };
    return { ippatsu: nextDiscardNo <= 2, houtei: false };
  }

  /* ───────── 外向けの 形（コードの 書き方で） ───────── */
  function waits(hand13) { return waitsIdx(toCounts(hand13)).map(toCode); }
  function isAgari(tiles14) { return isAgariIdx(toCounts(tiles14)); }
  function judge(hand13, winTile, ctx) {
    var c = toCounts(hand13);
    if (sum(c) !== 13) throw new Error('mahjong-core: 手は 13枚');
    var w = toIndex(winTile);
    c[w]++;
    if (c[w] > 4) return null;                   // 5枚目は ありえない
    if (!isAgariIdx(c)) return null;
    return judgeIdx(c, w, normCtx(ctx));
  }
  // 満貫 以上の ときだけ 結果を 返す（ロンの ボタンを 出してよいか）。フリテンは 見ない
  function ronCheck(hand13, tile, ctx) {
    var r = judge(hand13, tile, ctx);
    return r && r.mangan ? r : null;
  }
  function waitMarks(hand13, ctx) {
    ctx = ctx || {};
    return marksIdx(toCounts(hand13), normCtx(ctx), ctx.chances);
  }
  // 自分の 捨て牌に 待ち牌（◎△× を 問わず）が あれば フリテン
  function isFuriten(hand13, ownDiscards) {
    var w = waitsIdx(toCounts(hand13));
    for (var i = 0; i < (ownDiscards || []).length; i++) if (w.indexOf(toIndex(ownDiscards[i])) >= 0) return true;
    return false;
  }
  function ronPayment(result, honba, kyotaku) {
    var base = basePay(result.dealer, result.rank);
    var hb = RULES.honbaPoints * (honba || 0);
    return { base: base, honba: hb, kyotaku: kyotaku || 0,
      winnerGets: base + hb + (kyotaku || 0), loserPays: base + hb };
  }

  /* ───────── 試合（点棒）─────────
     決まり（追記⑭・仕様書 §2 ★）：
       ・東風戦＝東1・東2／半荘戦＝東1・東2・南1・南2。親は 局ごとに 入れかわる
       ・親の 和了は 1.5倍。親が 和了るか 流局なら 親が 続く（本場＋1）。子が 和了ると 親が 移り 本場0
       ・毎局 2人とも 立直棒 1000点（1000点 未満なら 出さない）。流局は 供託 持ち越し
       ・持ち点 35000・0点 未満で トビ（すぐ 終わり）
       ・オーラスで 親が 和了るか 流局し、親が トップなら 終わり
       ・終わった ときの 供託は トップへ（同点は 半分ずつ）
     関数は 状態を 書きかえず、新しい 状態を 返す（そのまま JSON で 保存できる）。 */
  var KYOKU = [{ wind: '1z', no: 1 }, { wind: '1z', no: 2 }, { wind: '2z', no: 1 }, { wind: '2z', no: 2 }];
  var LENGTH = { tonpu: 2, hanchan: 4 };

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function createMatch(opt) {
    opt = opt || {};
    if (!LENGTH[opt.length]) throw new Error('mahjong-core: 局数は tonpu か hanchan');
    var fd = opt.firstDealer === 1 ? 1 : 0;
    var sp = opt.startPoints != null ? opt.startPoints : RULES.startPoints;
    return { v: 1, length: opt.length, total: LENGTH[opt.length], kyoku: 0, firstDealer: fd,
      honba: 0, kyotaku: 0, start: sp, points: [sp, sp], sticks: [false, false],
      inHand: false, over: false, endReason: null, winner: null, history: [] };
  }
  function dealerOf(m) { return (m.firstDealer + m.kyoku) % 2; }
  function handInfo(m) {
    var k = KYOKU[m.kyoku], d = dealerOf(m), sw = [];
    sw[d] = RULES.dealerSeat; sw[1 - d] = RULES.childSeat;
    return { roundWind: k.wind, kyokuNo: k.no, dealer: d, seatWinds: sw,
      honba: m.honba, kyotaku: m.kyotaku, isAllLast: m.kyoku === m.total - 1 };
  }
  // その 局で player の 判定に 渡す ctx
  function ctxFor(m, player, extra) {
    var h = handInfo(m), c = { dealer: player === h.dealer, roundWind: h.roundWind, seatWind: h.seatWinds[player] };
    for (var k in (extra || {})) c[k] = extra[k];
    return c;
  }
  // 局の はじめ：立直棒を 出す
  function startHand(m) {
    if (m.over) throw new Error('mahjong-core: 試合は 終わっている');
    if (m.inHand) throw new Error('mahjong-core: 局は もう 始まっている');
    var n = clone(m);
    for (var p = 0; p < 2; p++) {
      n.sticks[p] = n.points[p] >= RULES.riichiStick;
      if (n.sticks[p]) { n.points[p] -= RULES.riichiStick; n.kyotaku += RULES.riichiStick; }
    }
    n.inHand = true;
    return n;
  }
  // 局の おわり：outcome = { type:'ron', winner:0|1, result:judge の 結果 } ／ { type:'draw' }
  function settleHand(m, outcome) {
    if (!m.inHand) throw new Error('mahjong-core: 局が 始まっていない');
    var n = clone(m), d = dealerOf(n), stay, rec = { kyoku: n.kyoku, honba: n.honba, dealer: d, type: outcome.type };
    if (outcome.type === 'ron') {
      var w = outcome.winner, r = outcome.result;
      if (w !== 0 && w !== 1) throw new Error('mahjong-core: winner は 0 か 1');
      if (!r || !r.mangan) throw new Error('mahjong-core: 満貫に とどかない 手で ロンは できない');
      var base = basePay(w === d, r.rank), hb = RULES.honbaPoints * n.honba;
      n.points[w] += base + hb + n.kyotaku;
      n.points[1 - w] -= base + hb;
      rec.winner = w; rec.rank = r.rank.id; rec.gain = base + hb + n.kyotaku; rec.loss = base + hb;
      n.kyotaku = 0;
      stay = (w === d);
    } else if (outcome.type === 'draw') {
      stay = true;
    } else {
      throw new Error('mahjong-core: outcome.type は ron か draw');
    }
    n.inHand = false; n.sticks = [false, false];
    rec.points = n.points.slice();
    n.history.push(rec);

    var wasAllLast = n.kyoku === n.total - 1;
    if (stay) n.honba++; else { n.honba = 0; }
    if (n.points[0] < 0 || n.points[1] < 0) return closeMatch(n, 'tobi');
    if (!stay) {
      if (wasAllLast) return closeMatch(n, 'last');
      n.kyoku++;
      return n;
    }
    if (wasAllLast && n.points[d] > n.points[1 - d]) return closeMatch(n, 'agariyame');
    return n;
  }
  // 試合を 閉じる：残った 供託は トップへ（同点は 半分ずつ）
  function closeMatch(m, reason) {
    var n = clone(m);
    if (n.kyotaku > 0) {
      if (n.points[0] > n.points[1]) n.points[0] += n.kyotaku;
      else if (n.points[1] > n.points[0]) n.points[1] += n.kyotaku;
      else { n.points[0] += n.kyotaku / 2; n.points[1] += n.kyotaku / 2; }
      n.kyotaku = 0;
    }
    n.over = true; n.inHand = false; n.endReason = reason || n.endReason || 'end';
    n.winner = n.points[0] > n.points[1] ? 0 : n.points[1] > n.points[0] ? 1 : null;
    return n;
  }

  /* ───────── 配る（種つき。同じ 種なら 同じ 34枚 ＝ 読み直しで 引き直せない） ───────── */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function makeWall(seed) {
    var w = [], i;
    for (i = 0; i < 34; i++) for (var k = 0; k < 4; k++) w.push(CODES[i]);
    var r = rng(seed);
    for (i = w.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var tmp = w[i]; w[i] = w[j]; w[j] = tmp; }
    return w;
  }
  function deal(seed) {
    var w = makeWall(seed);
    return { seed: seed >>> 0, hands: [w.slice(0, 34), w.slice(34, 68)], rest: w.slice(68) };
  }

  var MJCore = {
    CODES: CODES.slice(), RULES: RULES, YAKU: YAKU, YAKU_ORDER: YAKU_ORDER,
    toIndex: toIndex, toCode: toCode, toCounts: toCounts,
    toString: function (x) { return countsToString(toCounts(x)); },
    toList: function (x) { return countsToList(toCounts(x)); },
    doraFromIndicator: doraFromIndicator,
    isAgari: isAgari, waits: waits, judge: judge, ronCheck: ronCheck, waitMarks: waitMarks,
    isFuriten: isFuriten, ronBonus: ronBonus, remainingChances: remainingChances,
    rankOf: rankOf, basePay: basePay, ronPayment: ronPayment,
    createMatch: createMatch, dealerOf: dealerOf, handInfo: handInfo, ctxFor: ctxFor,
    startHand: startHand, settleHand: settleHand, closeMatch: closeMatch,
    rng: rng, makeWall: makeWall, deal: deal,
    // CPU 用（34個の 数の 配列で。文字の 変換を しない ぶん 速い）
    fast: { toCounts: toCounts, normCtx: normCtx, waitsIdx: waitsIdx, isAgariIdx: isAgariIdx,
      judgeIdx: judgeIdx, marksIdx: marksIdx, decompositions: decompositions, doraIdx: doraIdx }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = MJCore;
  if (global) global.MJCore = MJCore;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
