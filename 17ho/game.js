/* ============================================================
   17歩 ― T330・💻コーダ（2026-09-28）
   ------------------------------------------------------------
   ★ 仕様の 正：設計図 追記⑭ ＋ logs/T326_17歩仕様書_ルル.md
   ★ 判定（役・飜・満貫・待ち・点棒）は ../mahjong-core.js（MJCore・T327）。★ここでは 1つも 数え直さない。
   ★ 牌の 絵は ../mahjong-tiles.js（MJ・アト T318）。★1バイトも 変えない。
   ★ お手本：四川省（牌の 使い方・画面の 作り・見張り）／ラビット・ナボコフ（点の 出し方・試合の 流れ）

   ★ ファイルの かたち（四川省と 同じ）
     「中身（ENGINE・CPU）」と「画面（UI）」を 分けて ある。★ENGINE と CPU は document を 1回も さわらない。
     ★ Node でも 同じ 1本を 読んで CPU どうしの 試合を 回せる（★見張り ② と 計測どうぐ が 使う）。

   ★ 社長の お決め（追記⑭・厳守）
     ① 満貫＝5飜／4飜30符 以上／3飜60符 以上（符を 数える・切り上げ満貫あり ―― ★T362 追記⑭ 訂正 2026-10-01）→ MJCore
     ② 手助けは「満貫に 届くか 確かめる 表示」だけ   → checkLine()（★いま 選んでいる 13枚 だけ で 決まる）
     ③ 点棒（35,000点・トビ・親1.5倍・流局は 親が 続く・本場・供託）→ MJCore の 試合の 関数
     ④ 役の 名前は 漢字                              → MJCore.YAKU
     ⑤ 手作りの 時間は 制限なし                       → タイマーを 置かない
     ⑥ 満貫に 届かない 13枚でも「決定」できる。★山 全体で 満貫が 作れるかは 計算も 表示も しない。
        ★ CPU の 13枚を 組む 計算（Builder）は ★CPU の 34枚に だけ 使う（★見張り ④ が 数える）。
     ★ CPU は「弱い」1つ（★T339 社長：つねに 弱い）。★見て よいのは 自分の 34枚・両方の 捨て牌・ドラ表示牌 だけ（★cpuView・見張り ③）。

   ★ T332（💻コーダ・2026-09-28）：社長の 決め（追記⑭「画面と 終わり方」）
     ① 牌は 盤そのもの（44px の 外）。★牌 以外の ボタンは 44px 以上            → 見張り ⑥
     ② 幅 320 の たて だけ 17巡の 間 上下に 動かせる                            → layout()・見張り ⑱
     ③ 最後の 局は 流局したら そこで 終わり。同点なら 引き分け                   → endDraw()・見張り ②⑰
     ④ 途中の 状態は タブを 閉じたら 消える（sessionStorage のまま）
     ★ 画面は アトの 画面案（logs/T331_17歩画面案_アト.md）の 見本に 合わせた。

   ⚠️ 外部の ライブラリ・フォント・画像は 0。外への 通信も 0。
   ============================================================ */
(function (root) {
  'use strict';

  var C = root.MJCore || (typeof require === 'function' ? require('../mahjong-core.js') : null);
  if (!C) throw new Error('17歩：MJCore（../mahjong-core.js）が ありません');

  /* ============================================================
     ★ 数字（TUNE）― 調整する 数字は ここ 1か所だけ
     ============================================================ */
  var TUNE = {
    /* 待ち時間は 遊びの 中身では ない（§5.5 追記①）―― 短く 固定 */
    CPU_WAIT:    450,       // あいてが 1枚 切るまで
    CPU_RON:     450,       // あいての ロンを 見せるまで
    SLICE_MS:      8,       // ★CPU の 13枚 組み：1回に 計算して よい 時間（★これを 過ぎたら 画面に 返す）
    EVAL_CHUNK:   24,       //   1回の 中で 続けて 見る 形の 数（★時計を 見る 回数を 減らす）

    /* 結果の 箱の 連打よけ（T62）／箱を 閉じた 直後の 2つめの 指（T316）*/
    RESULT_LOCK: 600,
    RESULT_QUIET: 250,
    AFTER_BOX:   450,

    /* 寸法（★T332：アトの 見本の 数。★牌の 大きさは layout() の fit() が 箱の 実寸から 数える。
       ★牌は 盤そのもの ―― 44px の 決まりの 外（★社長の 決め①・四川省と 同じ）。★牌 以外の ボタンは 44px 以上）*/
    PAD:           4,       // 牌の まわりの すき間（セル − 牌）
    RAISE:      0.22,       // ★選んだ 牌が 上がる 高さ（牌の たけ × この 数）
    RATIO: 88 / 64,         // 牌の 絵（viewBox 64×88）の ひりつ。★ぜったいに くずさない
    BRK_MIN:      26,       // ★山の「1種類 1行」を 折り返して よいのは 牌が これより 小さく なる ときだけ
    CAP_POOL:     62,       // 山 34枚（手作り）・伏せた 山 68枚 の 牌の はばの 上限
    CAP_REST:     64,       // 切れる 21枚
    CAP_PICK_TATE: 34, CAP_PICK_YOKO: 52,      // 手作りの「あなたの 手」13枚
    CAP_RIVER_TATE: 27, CAP_RIVER_YOKO: 44,    // 河（★見るだけ）
    CAP_HAND_TATE: 30, CAP_HAND_YOKO: 52, CAP_HAND_LOW: 21,   // 17巡の「あなたの 手」13枚
    SCROLL_COLS:   7,       // ★幅 320 の たて（上下に 動かす）：切れる 21枚を 7列×3行
    SCROLL_MIN_TW: 30,      // ★そのとき 切れる 牌は これより 大きい（★見張り ⑱）
    STRICT_MAX:   11,       // ★T339：山で「いちばん 多い 種類だけ 折る」のは その 種類が この 枚数 以下の 配りだけ（★12枚 以上は 前の 折り方）
    CPU_LEVEL: 'weak',      // ★T339（社長）：CPU は つねに「弱い」（★トライ T325 の 2段の 下の 段）。★'normal' は 計測どうぐの 比べ 用に 残す
    TILE_MIN:      6,
    TITLE_MIN_W: 300        // はじめの 画面の 白い 箱の いちばん せまい はば（★これより せまく なる なら ハッピーは 下）
  };

  /* ============================================================
     ★ 小さな 道具
     ============================================================ */
  var CODES = C.CODES;
  function idx(code) { return C.toIndex(code); }
  function sortCodes(a) { return a.slice().sort(function (x, y) { return idx(x) - idx(y); }); }
  function counts(list) { var c = new Array(34).fill(0); for (var i = 0; i < list.length; i++) c[idx(list[i])]++; return c; }
  function mix(a, b) {                                   // ★種を まぜる（★同じ 試合・同じ 局なら 同じ 種）
    var h = (a ^ Math.imul(b + 0x9E3779B9, 0x85EBCA6B)) >>> 0;
    h = Math.imul(h ^ (h >>> 16), 0x7FEB352D) >>> 0;
    h = Math.imul(h ^ (h >>> 15), 0x846CA68B) >>> 0;
    return (h ^ (h >>> 16)) >>> 0;
  }
  var now = (typeof performance !== 'undefined' && performance.now) ? function () { return performance.now(); } : function () { return Date.now(); };

  /* ============================================================
     ★★ ENGINE ― 1試合・1局の 進み方 ★★
     ------------------------------------------------------------
     S（★この 形の まま JSON で しまえる ＝ 読み直しで 同じ 局・同じ 34枚に 戻る）
       { v, len:'tonpu'|'hanchan', mseed, match（MJCore の 試合）, h（いまの 局）}
     h（1局）
       { no, seed, hands:[34枚,34枚]（並べた 字）, rest:68枚,
         doraAt, dora, ura, phase:'dora'|'build'|'play'|'end',
         pick:[人が 選んでいる 牌の 番号（hands[0] の 中の 何枚目）],
         h13:[人の 13枚, CPU の 13枚], w:[待ち, 待ち],
         river:[[],[]], cnt:[0,0], turn, furiten:[false,false], offer, sel, out }
     ★ 人＝0・CPU＝1。★親から 切る。★親の 1打目 → 子の 1打目 → … → 子の 17打目 で 流局。
     ============================================================ */
  var HUMAN = 0, CPU = 1;

  function newMatch(len, mseed, firstDealer) {
    var S = { v: 1, len: len, mseed: mseed >>> 0, match: C.createMatch({ length: len, firstDealer: firstDealer }), h: null };
    newHand(S);
    return S;
  }
  function dealerOf(S) { return C.dealerOf(S.match); }

  /* ★ 局の はじめ：配る・立直棒を 出す（★MJCore.startHand）*/
  function newHand(S) {
    var n = S.match.history.length, seed = mix(S.mseed, n + 1), d = C.deal(seed);
    S.match = C.startHand(S.match);
    var hi = C.handInfo(S.match);
    S.h = {
      no: n, seed: seed,
      lab: { wind: hi.roundWind, no: hi.kyokuNo, honba: hi.honba, dealer: hi.dealer },   // ★局の 名前（★終わった あとも 同じ 名前で 見せる）
      hands: [sortCodes(d.hands[0]), sortCodes(d.hands[1])],
      rest: d.rest,
      doraAt: -1, dora: null, ura: null,
      phase: 'dora', pick: [],
      h13: [null, null], w: [[], []],
      river: [[], []], cnt: [0, 0], turn: dealerOf(S),
      furiten: [false, false], offer: null, sel: null, out: null
    };
    return S.h;
  }

  /* ★ ドラ表示牌：親が 伏せた 山（68枚）から 1枚。★裏ドラは その となり（★局の おわりまで 見せない）*/
  function setDora(S, i) {
    var h = S.h;
    if (h.phase !== 'dora') throw new Error('17歩：いまは ドラを めくる 時では ない');
    if (!(i >= 0 && i < h.rest.length)) throw new Error('17歩：山に その 牌は 無い');
    h.doraAt = i; h.dora = h.rest[i]; h.ura = h.rest[(i + 1) % h.rest.length];
    h.phase = 'build';
  }
  /* ★ CPU が 親の ときの めくる 場所（★種から 決まる ―― 読み直しても 同じ）*/
  function cpuDoraAt(h) { return Math.floor(C.rng(mix(h.seed, 77))() * h.rest.length); }

  function ctxOf(S, p, extra) {
    var e = { doraIndicators: [S.h.dora] };
    for (var k in (extra || {})) if (extra.hasOwnProperty(k)) e[k] = extra[k];
    return C.ctxFor(S.match, p, e);
  }

  /* ★ 13枚を 決める（★その 人の 34枚の 中から ちょうど 13枚）*/
  function decide(S, p, list13) {
    var h = S.h;
    if (h.phase !== 'build') throw new Error('17歩：いまは 決める 時では ない');
    if (h.h13[p]) throw new Error('17歩：もう 決めて ある');
    if (!list13 || list13.length !== 13) throw new Error('17歩：13枚 では ない');
    var have = counts(h.hands[p]), use = counts(list13);
    for (var i = 0; i < 34; i++) if (use[i] > have[i]) throw new Error('17歩：34枚に 無い 牌 ' + CODES[i]);
    h.h13[p] = sortCodes(list13);
    h.w[p] = C.waits(h.h13[p]);
    if (h.h13[0] && h.h13[1]) { h.phase = 'play'; h.turn = dealerOf(S); }
  }

  /* ★ まだ 切って いない 牌（21枚 から 捨て牌を 引いた もの）*/
  function restCounts(h, p) {
    var c = counts(h.hands[p]), u = counts(h.h13[p] || []), r = counts(h.river[p]);
    for (var i = 0; i < 34; i++) c[i] -= u[i] + r[i];
    return c;
  }
  function restList(h, p) {
    var c = restCounts(h, p), out = [];
    for (var i = 0; i < 34; i++) for (var k = 0; k < c[i]; k++) out.push(CODES[i]);
    return out;
  }

  /* ★ 1枚 切る（★人も CPU も ここ 1か所を 通る）
     ・自分の 待ち牌（◎△× を 問わず）を 切ったら フリテン（追記⑭）
     ・相手の 待ち牌で：フリテンなら 何も 起きない／満貫に 届けば ロンできる／届かなければ 見のがし → フリテン
     ・返り値 { ron: 人 or null }。★人の ロンは h.offer に 置いて ★押すまで 待つ（見のがす ボタンは 無い）。 */
  function discard(S, p, code) {
    var h = S.h;
    if (h.phase !== 'play' || h.offer) throw new Error('17歩：いまは 切れない');
    if (h.turn !== p) throw new Error('17歩：' + p + ' の 番では ない');
    if (h.cnt[p] >= C.RULES.turns) throw new Error('17歩：もう 17回 切った');
    var t = idx(code);
    if (restCounts(h, p)[t] < 1) throw new Error('17歩：その 牌は 残って いない ' + code);
    h.river[p].push(code); h.cnt[p]++; h.sel = null;
    if (h.w[p].indexOf(code) >= 0) h.furiten[p] = true;
    var q = 1 - p;
    if (h.w[q].indexOf(code) >= 0 && !h.furiten[q]) {
      var r = ronResult(S, q, code, h.cnt[p]);
      if (r && r.mangan) { h.offer = { p: q, tile: code, no: h.cnt[p] }; return { ron: q }; }
      h.furiten[q] = true;                                // ★満貫に 届かない 牌を 見のがした → この 局 ずっと フリテン
    }
    h.turn = q;
    if (h.cnt[0] >= C.RULES.turns && h.cnt[1] >= C.RULES.turns) endDraw(S);
    return { ron: null };
  }
  /* ★ その 牌で ロンした ときの 結果（★一発・河底は 仕様書 §3 の はんい。★裏ドラ込み ―― ★満貫の 判定は 裏ドラ抜き＝MJCore）*/
  function ronResult(S, q, code, discardNo) {
    var h = S.h, b = C.ronBonus(q === dealerOf(S), discardNo);
    return C.judge(h.h13[q], code, ctxOf(S, q, { ippatsu: b.ippatsu, houtei: b.houtei, uraIndicators: [h.ura] }));
  }
  function ron(S, q) {
    var h = S.h, o = h.offer;
    if (!o || o.p !== q) throw new Error('17歩：ロンできない');
    if (h.furiten[q]) throw new Error('17歩：フリテン中の ロン');
    var r = ronResult(S, q, o.tile, o.no);
    if (!r || !r.mangan) throw new Error('17歩：満貫に とどかない ロン');
    var pay = C.ronPayment(r, S.match.honba, S.match.kyotaku);
    var before = S.match.points.slice();
    S.match = C.settleHand(S.match, { type: 'ron', winner: q, result: r });
    h.out = { type: 'ron', winner: q, tile: o.tile, no: o.no, result: r, pay: pay, before: before, after: S.match.points.slice(),
              honba: S.match.history[S.match.history.length - 1].honba };
    h.offer = null; h.phase = 'end';
    return h.out;
  }
  /* ★ 流局（★T332・社長の 決め：★最後の 局は 流局したら そこで 試合を 終える ―― 親が トップで なくても 続けない）
       ★ MJCore は「親が トップで なければ 続く」なので、★ここで C.closeMatch を 呼ぶ（★MJCore は 1文字も 変えない）。
       ★ 終わった ときの 供託は MJCore の 決まりどおり トップへ・★同点は 半分ずつ → ★同点なら winner＝null（引き分け）。 */
  function endDraw(S) {
    var h = S.h, before = S.match.points.slice(), honba = S.match.honba, kyo = S.match.kyotaku;
    var wasLast = C.handInfo(S.match).isAllLast;
    S.match = C.settleHand(S.match, { type: 'draw' });
    if (wasLast && !S.match.over) S.match = C.closeMatch(S.match, 'lastdraw');
    h.out = { type: 'draw', before: before, after: S.match.points.slice(), honba: honba, kyotaku: kyo, last: wasLast };
    h.phase = 'end';
  }
  /* ★ 次の 局へ（★試合が 終わって いれば 何も しない）*/
  function nextHand(S) {
    if (S.h && S.h.phase !== 'end') throw new Error('17歩：局が まだ 終わって いない');
    if (S.match.over) return null;
    return newHand(S);
  }

  /* ============================================================
     ★★ 確かめ表示（追記⑭ ②・仕様書 R2）★★
     ------------------------------------------------------------
     ★ 受け取るのは「いま 選んでいる 13枚」と「場の 決まり（ctx）」だけ。★34枚も 山も 受け取らない。
       → ★同じ 13枚なら ★どんな 山でも 1文字も ちがわない 文が 出る（★見張り ④ が 数える）。
     返り値 { kind:'short'|'noten'|'waits', n, waits:[{tile, mark:'◎'|'△'|'×', via:[]}] , text }
     ============================================================ */
  var MARK_WORD = { '◎': '満貫', '×': 'とどかない' };
  function triWord(via) {
    var a = via.indexOf('ippatsu') >= 0, b = via.indexOf('houtei') >= 0;
    return (a && b) ? '一発か 河底なら 満貫' : a ? '一発なら 満貫' : '河底なら 満貫';
  }
  function markWord(w) { return w.mark === '△' ? triWord(w.via) : MARK_WORD[w.mark]; }
  function checkLine(list, ctx) {
    var n = list.length;
    if (n < 13) return { kind: 'short', n: 13 - n, waits: [], text: 'あと ' + (13 - n) + '枚' };
    var m = C.waitMarks(list, ctx);
    if (!m.tenpai) return { kind: 'noten', waits: [], text: '聴牌していません' };
    var ws = m.waits.map(function (w) { return { tile: w.tile, mark: w.mark, via: w.via.slice() }; });
    return { kind: 'waits', waits: ws,
      text: '待ち：' + ws.map(function (w) { return w.tile + ' ' + w.mark + markWord(w); }).join('　') };
  }
  /* ★ いまの 自分の 13枚の 確かめ（★17回の 間：一発の はんいが 過ぎたら △ が × に 変わる）
     ★T334：★ロンの 出番の 間（h.offer が 自分）は ★いま 出た 打目（h.offer.no）で 数える ―― ★その 1打で 付く 一発・河底 だけ（ronBonus）。
       ★前は いつも「相手の つぎの 打目」で 数えて いたので、★出番の 瞬間に 1打 先へ 進み、★河底なのに ×・子の 一発で ぜんぶ × に なって いた（トライ T333 ②）。*/
  function chancesFor(S, p) {
    var h = S.h, q = 1 - p, dealer = p === dealerOf(S);
    if (h.phase === 'build') return null;
    if (h.offer && h.offer.p === p) return C.ronBonus(dealer, h.offer.no);
    return C.remainingChances(dealer, h.cnt[q] + 1);
  }
  function myCheck(S, p) {
    var chances = chancesFor(S, p);
    var ctx = ctxOf(S, p, chances ? { chances: chances } : null);
    return checkLine(S.h.h13[p] || [], ctx);
  }

  /* ============================================================
     ★★ CPU「ふつう」／★T339 から ゲームは「弱い」（weakValue・cpuDiscard の weak）★★（トライ T325 の 試作を もとに。★満貫の 線は MJCore の ◎△× の まま ―― ★T362 で 符・切り上げ満貫に なっても ここは 1文字も 数え直さない）
     ------------------------------------------------------------
     ★ 13枚の 組み（Builder）
       ・34枚＋「山に 無い 牌を 1枚だけ 借りて よい」完成形（14枚）を ぜんぶ 出し、借りた 牌を 抜いた 13枚を 聴牌の 形に する
         （★トライの 確かめ：120万回の ランダムな 13枚で もれ 0件）。七対子・国士は 別に 出す。
       ・形ごとに MJCore の ◎△× を 数え、★◎ の 待ちが 相手に 残って いそうな 枚数 が 多い 形を 取る。
         ★× の 待ちが まじる 形は 減点（★出たら 見のがし → フリテン）。
       ・◎ が 1つも 無い（★満貫に 届かない 34枚）なら ★いちばん 危ない 牌を 手に しまう 13枚（守りの 手）。
       ★ 画面を 止めない ために ★少しずつ 区切って 進む（step(ms)）。★Node では 最後まで 一気に（run()）。
     ★ 捨て方：危なさの 点数が 低い 牌から。★自分の 待ち牌は 切らない（切ると フリテン）。
     ★ 見て よい もの（★cpuView が 作る）：自分の 34枚・13枚・残り・待ち、両方の 捨て牌、ドラ表示牌 だけ。
     ============================================================ */
  var MELDS = [];
  (function () {
    for (var i = 0; i < 34; i++) MELDS.push([i, i, i]);
    for (var j = 0; j < 27; j++) if (j % 9 <= 6) MELDS.push([j, j + 1, j + 2]);
  })();
  var YAO = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];

  /* ★ 同じ 34枚なら 同じ 答え（★読み直しても 同じ 13枚・同じ 捨て牌 ―― ★種は CPU に 見えて いる もの だけから 作る）*/
  function hashList(a, s0) { var h = s0 >>> 0; for (var i = 0; i < a.length; i++) h = mix(h, a[i] + 1); return h; }
  function Builder(pool, ctx, level) {
    this.level = level || TUNE.CPU_LEVEL;     // ★'weak'（★ゲーム）／'normal'（★比べ 用）
    this.rnd = C.rng(hashList(pool, 0x5EED17 + (ctx.doraIndicators && ctx.doraIndicators[0] ? idx(ctx.doraIndicators[0]) : 99)));
    this.pool = pool.slice();                 // ★34個の 数（★CPU 自身の 34枚）
    this.cx = C.fast.normCtx(ctx);            // ★場の 決まり（★ドラ表示牌を ふくむ）
    this.dora = ctx.doraIndicators && ctx.doraIndicators[0] ? idx(ctx.doraIndicators[0]) : -1;
    this.stage = 0; this.p = 0; this.m0 = 0; this.m1 = 0; this.i = 0; this.q0 = 0; this.q1 = 1; this.q2 = 2;
    this.c = pool.slice(); this.use = new Array(34).fill(0);   // ★1回ぶんの 作業台（★毎回 元に 戻して 返す）
    this.pairs = null;
    this.seen = {}; this.list = [];
    this.best = null; this.bestV = -1e18;
    this.done = false; this.result = null;
    this.stats = { cands: 0, mangan: 0, ms: 0, steps: 0 };
  }
  Builder.prototype.add = function (h) {
    var k = h.join(',');
    if (this.seen[k]) return;
    this.seen[k] = 1; this.list.push(h);
  };
  /* ★ 1回ぶん ＝ 雀頭 p・1つめの 面子 m0・2つめの 面子 m1 を 決めた ところ から 残り 2面子
     （★スマホで 1回が 長く ならない ように 小さく 切る。★借りるのは ぜんぶで 1枚まで）*/
  Builder.prototype.enumUnit = function (p, m0, m1) {
    var self = this, c = this.c, use = this.use;
    function need(tiles, borrow) {
      var b = borrow, a = tiles[0], x, lack;
      if (tiles[1] === a) {                              // 刻子（3枚 同じ）
        lack = 3 - c[a];
        if (lack > 0) { if (lack > 1 || b !== -1) return null; b = a; }
        return b;
      }
      for (x = 0; x < 3; x++) {                          // 順子（3枚 ちがう）
        if (c[tiles[x]] < 1) { if (b !== -1) return null; b = tiles[x]; }
      }
      return b;
    }
    function apply(tiles, sg) { for (var x = 0; x < tiles.length; x++) { c[tiles[x]] -= sg; use[tiles[x]] += sg; } }
    function record(b) {
      var t;
      if (b !== -1) { use[b]--; self.add(use.slice()); use[b]++; }
      else for (t = 0; t < 34; t++) if (use[t]) { use[t]--; self.add(use.slice()); use[t]++; }
    }
    var lackP = 2 - c[p];
    if (lackP > 1) return;
    var b0 = lackP > 0 ? p : -1;
    apply([p, p], 1);
    var b1 = need(MELDS[m0], b0), b2 = null;
    if (b1 !== null) {
      apply(MELDS[m0], 1);
      b2 = need(MELDS[m1], b1);
      if (b2 !== null) {
        apply(MELDS[m1], 1);
        (function rec(k, from, b) {
          if (k === 4) { record(b); return; }
          for (var m = from; m < MELDS.length; m++) {
            var nb = need(MELDS[m], b);
            if (nb === null) continue;
            apply(MELDS[m], 1); rec(k + 1, m, nb); apply(MELDS[m], -1);
          }
        })(2, m1, b2);
        apply(MELDS[m1], -1);
      }
      apply(MELDS[m0], -1);
    }
    apply([p, p], -1);
  };
  /* ★ 七対子：6対子＋1枚（★同じ 牌 4枚は 2対に しない）―― ★1回ぶん ＝ はじめの 3対（q0, q1, q2）を 決めた ところから */
  Builder.prototype.enumChiitoi = function (q0, q1, q2) {
    var pool = this.pool, pairs = this.pairs, self = this;
    (function comb(start, chosen) {
      if (chosen.length === 6) {
        for (var s = 0; s < 34; s++) {
          if (chosen.indexOf(s) >= 0 || pool[s] < 1) continue;
          var h = new Array(34).fill(0);
          for (var q = 0; q < 6; q++) h[chosen[q]] = 2;
          h[s] = 1; self.add(h);
        }
        return;
      }
      for (var i = start; i < pairs.length; i++) comb(i + 1, chosen.concat(pairs[i]));
    })(q2 + 1, [pairs[q0], pairs[q1], pairs[q2]]);
  };
  /* ★ 国士 */
  Builder.prototype.enumKokushi = function () {
    var pool = this.pool, self = this, have = 0, t;
    for (t = 0; t < YAO.length; t++) if (pool[YAO[t]] >= 1) have++;
    if (have < 12) return;
    var ok = function (h) { for (var i = 0; i < 34; i++) if (h[i] > pool[i]) return false; return true; };
    var all = new Array(34).fill(0);
    YAO.forEach(function (y) { all[y] = 1; });
    if (ok(all)) self.add(all);
    YAO.forEach(function (miss) {
      YAO.forEach(function (dup) {
        if (dup === miss) return;
        var h = all.slice(); h[miss] = 0; h[dup] = 2;
        if (ok(h)) self.add(h);
      });
    });
  };
  /* ★ 1つの 形の 値打ち（★大きい ほど よい。◎ が 無ければ null）*/
  Builder.prototype.value = function (h) {
    var m = C.fast.marksIdx(h, this.cx, null), pool = this.pool, dora = this.dora;
    var good = 0, tri = 0, bad = 0, top = 0;
    function live(t) { return Math.max(0, 4 - pool[t] - (t === dora ? 1 : 0)); }
    for (var k = 0; k < m.waits.length; k++) {
      var w = m.waits[k], t = idx(w.tile);
      if (w.mark === '◎') { good += live(t); top = Math.max(top, w.yakuman ? 13 * w.yakuman : w.han); }
      else if (w.mark === '△') tri += live(t);
      else bad += live(t);
    }
    if (!m.waits.length || top === 0 || good === 0) return null;   // ★◎ が 無い／◎ の 牌が もう 1枚も 残って いない
    return good * 10 + tri * 2 - bad * 6 + Math.log(1 + top) / Math.LN2;
  };
  /* ★★T339「弱い」（★トライ T325 の weak と 同じ 考え）：★満貫に 届く 待ちが 1つでも ある 形 から ★てきとうに 1つ ★★
       ★（★× の 待ちが まじって いても かまわない・★相手に 残って いる 枚数も 見ない ―― ★だから 見のがし→フリテン が 起きやすい）*/
  Builder.prototype.weakValue = function (h) {
    var m = C.fast.marksIdx(h, this.cx, null);
    for (var k = 0; k < m.waits.length; k++) if (m.waits[k].mark === '◎') return this.rnd();
    return null;
  };
  /* ★ 守りの 手：危ない 牌（★まん中の 数牌）から 13枚 しまう */
  function staticDanger(t) {
    if (t >= 27) return 0;
    var n = t % 9;
    return n === 0 || n === 8 ? 1 : (n === 1 || n === 7) ? 2 : 3;
  }
  Builder.prototype.defend = function () {
    var order = [], t, k;
    for (t = 0; t < 34; t++) for (k = 0; k < this.pool[t]; k++) order.push(t);
    order.sort(function (a, b) { return staticDanger(b) - staticDanger(a) || a - b; });
    var h = new Array(34).fill(0);
    for (k = 0; k < 13; k++) h[order[k]]++;
    return h;
  };
  /* ★ 少しずつ 進む（★ms を 使ったら 返す）。★終われば true */
  Builder.prototype.step = function (ms) {
    var t0 = now(), n;
    this.stats.steps++;
    while (!this.done) {
      if (this.stage === 0) {                               // 雀頭 × 1つめ × 2つめの 面子 ごと
        if (this.pool[this.p] + 1 < 2) { this.p++; this.m0 = 0; this.m1 = 0; }   // ★雀頭に できない 牌は とばす
        else {
          this.enumUnit(this.p, this.m0, this.m1);
          if (++this.m1 >= MELDS.length) { if (++this.m0 >= MELDS.length) { this.m0 = 0; this.p++; } this.m1 = this.m0; }
        }
        if (this.p >= 34) {
          this.stage = 1; this.pairs = [];
          for (var pp = 0; pp < 34; pp++) if (this.pool[pp] >= 2) this.pairs.push(pp);
        }
      } else if (this.stage === 1) {                        // 七対子（はじめの 3対 ごと）→ 国士
        if (this.q2 < this.pairs.length) {
          this.enumChiitoi(this.q0, this.q1, this.q2);
          if (++this.q2 >= this.pairs.length) {
            if (++this.q1 >= this.pairs.length - 1) { this.q0++; this.q1 = this.q0 + 1; }
            this.q2 = this.q1 + 1;
          }
        } else {
          this.enumKokushi();
          this.stage = 2; this.stats.cands = this.list.length;
        }
      } else if (this.stage === 2) {                        // 形ごとの 値打ち
        for (n = 0; n < TUNE.EVAL_CHUNK && this.i < this.list.length; n++, this.i++) {
          var v = this.level === 'weak' ? this.weakValue(this.list[this.i]) : this.value(this.list[this.i]);
          if (v === null) continue;
          this.stats.mangan++;
          if (v > this.bestV) { this.bestV = v; this.best = this.list[this.i]; }
        }
        if (this.i >= this.list.length) this.stage = 3;
      } else {
        var h = this.best ? this.best : this.defend();
        var out = [];
        for (var t = 0; t < 34; t++) for (var k = 0; k < h[t]; k++) out.push(CODES[t]);
        this.result = { hand: out, defend: !this.best };
        this.list = null; this.seen = null;
        this.done = true;
      }
      if (ms != null && now() - t0 >= ms) break;
    }
    this.stats.ms += now() - t0;
    return this.done;
  };
  Builder.prototype.run = function () { this.step(null); return this.result; };

  /* ★ CPU に 見せる もの（★人の 13枚・人の 34枚・人の 残りは 入れない ―― 見張り ③）*/
  function cpuView(S, p) {
    var h = S.h;
    return {
      p: p, dealer: p === dealerOf(S),
      pool: h.hands[p].slice(),
      h13: h.h13[p] ? h.h13[p].slice() : null,
      waits: h.w[p].slice(),
      rest: restList(h, p),
      myRiver: h.river[p].slice(),
      oppRiver: h.river[1 - p].slice(),
      dora: h.dora
    };
  }
  function danger(t, v, seen) {
    var my = v.myRiverIdx, op = v.oppRiverIdx;
    if (op.indexOf(t) >= 0 || my.indexOf(t) >= 0) return 0;          // ★通った 牌（★17歩は 相手の 手が 変わらない）
    var d = t >= 27 ? 0.35 : (t % 9 === 0 || t % 9 === 8) ? 0.6 : (t % 9 === 1 || t % 9 === 7) ? 0.8 : 1.0;
    if (t < 27) {
      var n = t % 9, safe = function (x) { return op.indexOf(x) >= 0 || my.indexOf(x) >= 0; };
      var lo = n >= 3 ? safe(t - 3) : true, hi = n <= 5 ? safe(t + 3) : true;
      if (lo && hi) d *= 0.55; else if (lo || hi) d *= 0.8;           // 筋
      var gone = function (x) { return seen[x] >= 4; };
      if ((n <= 6 && gone(t + 1)) && (n >= 2 ? gone(t - 1) : true)) d *= 0.6;   // 壁
    } else if (seen[t] >= 3) d *= 0.3;
    return d;
  }
  function cpuDiscard(v, level) {
    level = level || TUNE.CPU_LEVEL;
    if (level === 'weak') {
      /* ★★T339「弱い」：★自分の 待ち牌 だけは 切らない（★切ると フリテン）・★あとは てきとう（★危なさを 見ない）★★
           ★種は CPU に 見えて いる もの（★自分の 34枚・両方の 捨て牌）だけ ―― ★人の 手を 変えても 同じ 牌（見張り ③）*/
      var ws0 = v.waits.map(idx), op0 = [], sT = {}, j;
      for (j = 0; j < v.rest.length; j++) { var t0 = idx(v.rest[j]); if (!sT[t0]) { sT[t0] = 1; op0.push(t0); } }
      var cd0 = op0.filter(function (t) { return ws0.indexOf(t) < 0; });
      if (!cd0.length) cd0 = op0;
      var r0 = C.rng(hashList(counts(v.pool).concat(v.myRiver.map(idx), [99], v.oppRiver.map(idx)), 0xC0DA))();
      return CODES[cd0[Math.floor(r0 * cd0.length) % cd0.length]];
    }
    var seen = counts(v.pool), i;
    if (v.dora) seen[idx(v.dora)]++;
    for (i = 0; i < v.oppRiver.length; i++) seen[idx(v.oppRiver[i])]++;
    v.myRiverIdx = v.myRiver.map(idx); v.oppRiverIdx = v.oppRiver.map(idx);
    var opts = [], seenT = {};
    for (i = 0; i < v.rest.length; i++) { var t = idx(v.rest[i]); if (!seenT[t]) { seenT[t] = 1; opts.push(t); } }
    var ws = v.waits.map(idx);
    var cand = opts.filter(function (t) { return ws.indexOf(t) < 0; });
    if (!cand.length) cand = opts;                                     // ★待ちしか 残って いない（★まず 起きない）
    var best = cand[0], bv = 1e9;
    for (i = 0; i < cand.length; i++) {
      var dv = danger(cand[i], v, seen);
      if (dv < bv - 1e-9) { bv = dv; best = cand[i]; }
    }
    return CODES[best];
  }
  function cpuBuilder(S, p, level) {
    var b = new Builder(counts(S.h.hands[p]), ctxOf(S, p), level);
    b.who = p;
    return b;
  }

  /* ============================================================
     ★ CPU どうしで 1試合（★見張り ② と 計測どうぐ が 使う。★画面は 通らない）
       ★ 毎手 数える：点の 合計（持ち点＋供託＝70,000）・ロンは 満貫 以上・フリテン中の ロン 0
     ============================================================ */
  /* ★ その 局が 最後の 局か（★東風戦＝東2局・半荘戦＝南2局。★局の 名前から ―― ★MJCore の 中を 見ない 数え直し）*/
  function isLastLab(S, lab) { return lab.no === 2 && lab.wind === (S.len === 'tonpu' ? '1z' : '2z'); }
  function simMatch(len, mseed, fd, log, levels) {
    levels = levels || [TUNE.CPU_LEVEL, TUNE.CPU_LEVEL];
    var X = ENGINE;                                        // ★ENGINE を 通して 呼ぶ（★見張りを 壊す 試しが 効く ように）
    var S = X.newMatch(len, mseed, fd), bad = [], hands = 0, rons = 0, draws = 0, defends = 0, buildMs = [];
    var total = 2 * C.RULES.startPoints;
    function chk(where) {
      var t = S.match.points[0] + S.match.points[1] + S.match.kyotaku;
      if (Math.abs(t - total) > 1e-9) bad.push(where + '：点の 合計が ' + t);
    }
    while (!S.match.over && hands < 40) {
      var h = S.h; hands++;
      chk('局の はじめ');
      X.setDora(S, X.cpuDoraAt(h));
      for (var p = 0; p < 2; p++) {
        var b = X.cpuBuilder(S, p, levels[p]), r = b.run();
        buildMs.push(b.stats.ms);
        if (r.defend) defends++;
        X.decide(S, p, r.hand);
      }
      /* ★ フリテンと 満貫を ★ENGINE とは 別に 数え直す（★MJCore を じかに）*/
      var ws = [C.waits(h.h13[0]), C.waits(h.h13[1])], tf = [false, false], guard = 0;
      while (h.phase === 'play' && guard++ < 40) {
        var me = h.turn, q = 1 - me, code = X.cpuDiscard(X.cpuView(S, me), levels[me]);
        var pts0 = S.match.points.slice(), hb0 = S.match.honba, kt0 = S.match.kyotaku;
        var res = X.discard(S, me, code);
        if (ws[me].indexOf(code) >= 0) tf[me] = true;
        var ok = false;
        if (ws[q].indexOf(code) >= 0 && !tf[q]) {
          var bo = C.ronBonus(q === h.lab.dealer, h.cnt[me]);
          var jr = C.judge(h.h13[q], code, C.ctxFor(S.match, q, { doraIndicators: [h.dora], uraIndicators: [h.ura], ippatsu: bo.ippatsu, houtei: bo.houtei }));
          ok = !!(jr && jr.mangan && jr.rank && (jr.yakuman || C.isManganHF(jr.han, jr.fu)));   // ★T362：符つきの 満貫の 線（裏ドラ 抜き）
        }
        if (res.ron != null) {
          if (res.ron !== q) bad.push('ロンの 人が ちがう');
          if (tf[q]) bad.push('★フリテン中の ロン');
          if (!ok) bad.push('★満貫 未満（または 待ちで ない）の ロン');
          var out = X.ron(S, res.ron);
          var want = C.ronPayment(out.result, hb0, kt0);
          if (S.match.points[q] - pts0[q] !== want.winnerGets) bad.push('ロンの 点が ' + (S.match.points[q] - pts0[q]) + '（正は ' + want.winnerGets + '）');
          if (pts0[me] - S.match.points[me] !== want.loserPays) bad.push('ふりこみの 点が ' + (pts0[me] - S.match.points[me]));
          rons++;
        } else {
          if (ok) bad.push('★満貫の ロンを 出さなかった');
          if (ws[q].indexOf(code) >= 0) tf[q] = true;
        }
        if (h.cnt[me] > C.RULES.turns) bad.push('18回 切った');
      }
      if (h.phase !== 'end') bad.push('局が 終わらない');
      if (h.out && h.out.type === 'draw') {
        draws++; if (h.cnt[0] !== 17 || h.cnt[1] !== 17) bad.push('17回 前に 流局');
        /* ★T332：★最後の 局の 流局は そこで 終わり／★最後で ない 局の 流局では 終わらない（★トビは 別）*/
        if (isLastLab(S, h.lab) && !S.match.over) bad.push('★最後の 局の 流局で 試合が 終わらない');
        if (S.match.over && S.match.endReason !== 'tobi' && !isLastLab(S, h.lab)) bad.push('★最後で ない 局の 流局で 試合が 終わった');
      }
      if (S.match.over && ((S.match.points[0] === S.match.points[1]) !== (S.match.winner === null))) bad.push('★同点と 引き分けが 合わない（' + S.match.points.join(',') + '・' + S.match.winner + '）');
      chk('局の おわり');
      if (!S.match.over) X.nextHand(S);
    }
    if (!S.match.over) bad.push('試合が 終わらない');
    var fin = S.match.points[0] + S.match.points[1];
    if (Math.abs(fin - total) > 1e-9) bad.push('終わりの 点の 合計が ' + fin);
    if (log) log({ hands: hands, rons: rons, draws: draws, defends: defends, reason: S.match.endReason, points: S.match.points });
    return { bad: bad, hands: hands, rons: rons, draws: draws, defends: defends, buildMs: buildMs, reason: S.match.endReason, winner: S.match.winner, points: S.match.points.slice() };
  }

  /* ============================================================
     ★ 決まった 場面の 試し（★見張り ② ―― CPU どうしの 試合では めったに 起きない 場面を 手で 作る）
       人＝親（東）・東1局・ドラ表示 東（★ドラ 南）。★答えは コーダが 手で 出した もの。
       A 満貫に とどかない 待ち（1索 ×）を 見のがす → フリテン → あとで ◎（4索）が 出ても ロンできない
       B ◎ の 4索が 子の 1打目で 出る → ロンできる。立直・一発・平和・断么九・三色同順＝6飜 跳満 18,000＋供託 2,000
       C 自分の 待ち（1索）を 切る → フリテン → ◎ が 出ても ロンできない
       D ★T362：3飜40符（立直・断么九・一盃口・嵌張 7索 △）：子の 1打目で 出る → 一発で 4飜40符 満貫 12,000
         （★前は 3飜の 七対子 ―― 符を 数える ように なって 七対子 3飜は ×）
       D2 同じ 手で 子の 2打目 → 一発なし → ロンできない・フリテン
       I1 ★T362：3飜の 七対子（立直・七対子 25符・3筒）は × ―― 一発が 付いても 4飜25符 → ロンの 出番なし・フリテン
       I2 ★T362：4飜の 七対子（立直・七対子・断么九 25符・3筒）は △ ―― 一発で 5飜 満貫 12,000
       E 子（CPU）の 七対子・混老頭（7z）：親の 1打目で 出る → CPU の ロン（一発つき）
     ============================================================ */
  function selfTest() {
    var X = ENGINE, bad = [];
    var FILL = ['9m', '9m', '9m', '1s', '1z', '1z', '1z', '2z', '2z', '2z', '5z', '5z', '5z', '6z', '6z', '6z', '7z', '7z', '7z', '9p', '9p'];
    var CPU13 = '1199m1199p1199s7z';
    var CREST = ['1s', '4s', '4s', '3p', '7s', '2m', '2m', '2m', '6m', '6m', '6m', '7p', '7p', '7p', '5s', '5s', '5s', '8s', '8s', '8s', '3m'];
    function mk(h13) {
      var S = X.newMatch('tonpu', 12345, 0), h = S.h;
      h.hands[0] = sortCodes(C.toList(h13).concat(FILL));
      h.hands[1] = sortCodes(C.toList(CPU13).concat(CREST));
      h.doraAt = 0; h.dora = '1z'; h.ura = '1z'; h.phase = 'build';
      X.decide(S, 0, C.toList(h13)); X.decide(S, 1, C.toList(CPU13));
      return S;
    }
    function run(name, fn) { try { fn(); } catch (e) { bad.push(name + '：★止まった（' + e.message + '）'); } }
    var H13 = '234m234p23456s88p', T13 = '223344m456p55s68s', C7A = '5588m113p4477s33z', C7B = '5588m223p446677s';
    run('A', function () {
      var S = mk(H13), r;
      X.discard(S, 0, '9m'); r = X.discard(S, 1, '1s');
      if (r.ron != null) bad.push('A：★× の 牌で ロンの 出番');
      if (!S.h.furiten[0]) bad.push('A：× を 見のがしても フリテンに ならない');
      X.discard(S, 0, '9m'); r = X.discard(S, 1, '4s');
      if (r.ron != null) bad.push('A：★フリテン中に ロンの 出番');
    });
    run('B', function () {
      var S = mk(H13), r, o;
      X.discard(S, 0, '9m'); r = X.discard(S, 1, '4s');
      if (r.ron !== 0) { bad.push('B：★◎ の 牌で ロンの 出番が 無い'); return; }
      o = X.ron(S, 0);
      if (o.result.han !== 6 || o.result.rank.id !== 'haneman') bad.push('B：飜が ' + o.result.han + '・' + o.result.rank.id + '（正は 6飜 跳満）');
      if (o.pay.base !== 18000 || S.match.points[0] !== 54000 || S.match.points[1] !== 16000) bad.push('B：点が ' + o.pay.base + '／' + S.match.points.join(','));
    });
    run('C', function () {
      var S = mk(H13), r;
      X.discard(S, 0, '1s');
      if (!S.h.furiten[0]) bad.push('C：自分の 待ちを 切っても フリテンに ならない');
      r = X.discard(S, 1, '4s');
      if (r.ron != null) bad.push('C：★フリテン中に ロンの 出番');
    });
    run('D', function () {
      var S = mk(T13), r, o;
      var ck = X.checkLine(C.toList(T13), X.ctxOf(S, 0)).text;
      if (ck !== '待ち：7s △一発か 河底なら 満貫') bad.push('D：確かめ表示が「' + ck + '」');
      X.discard(S, 0, '9m'); r = X.discard(S, 1, '7s');
      if (r.ron !== 0) { bad.push('D：★一発の △ で ロンの 出番が 無い'); return; }
      o = X.ron(S, 0);
      if (o.result.han !== 4 || o.result.fu !== 40 || o.result.kiriage || o.pay.base !== 12000) bad.push('D：' + o.result.han + '飜' + o.result.fu + '符 ' + o.pay.base + '点（正は 4飜40符 12,000）');
    });
    run('D2', function () {
      var S = mk(T13), r;
      X.discard(S, 0, '9m'); X.discard(S, 1, '2m'); X.discard(S, 0, '9m'); r = X.discard(S, 1, '7s');
      if (r.ron != null) bad.push('D2：★一発の 外の △ で ロンの 出番');
      if (!S.h.furiten[0]) bad.push('D2：見のがしても フリテンに ならない');
      var ck = X.myCheck(S, 0).text;
      if (ck !== '待ち：7s △河底なら 満貫') bad.push('D2：17回の 間の 確かめ表示が「' + ck + '」');
    });
    run('I1', function () {
      var S = mk(C7A), r;
      var ck = X.checkLine(C.toList(C7A), X.ctxOf(S, 0)).text;
      if (ck !== '待ち：3p ×とどかない') bad.push('I1：★3飜の 七対子の 確かめ表示が「' + ck + '」（正は ×）');
      X.discard(S, 0, '9m'); r = X.discard(S, 1, '3p');
      if (r.ron != null) bad.push('I1：★4飜25符（一発つき 七対子）で ロンの 出番');
      if (!S.h.furiten[0]) bad.push('I1：× を 見のがしても フリテンに ならない');
    });
    run('I2', function () {
      var S = mk(C7B), r, o;
      var ck = X.checkLine(C.toList(C7B), X.ctxOf(S, 0)).text;
      if (ck !== '待ち：3p △一発か 河底なら 満貫') bad.push('I2：★4飜の 七対子の 確かめ表示が「' + ck + '」（正は △）');
      X.discard(S, 0, '9m'); r = X.discard(S, 1, '3p');
      if (r.ron !== 0) { bad.push('I2：★一発で 5飜の 七対子に ロンの 出番が 無い'); return; }
      o = X.ron(S, 0);
      if (o.result.han !== 5 || o.result.fu !== 25 || o.pay.base !== 12000) bad.push('I2：' + o.result.han + '飜' + o.result.fu + '符 ' + o.pay.base + '点（正は 5飜25符 12,000）');
    });
    run('E', function () {
      var S = mk(H13), r;
      r = X.discard(S, 0, '7z');
      if (r.ron !== 1) { bad.push('E：★CPU の ロンの 出番が 無い'); return; }
      var o = X.ron(S, 1);
      if (!o.result.mangan || S.match.points[1] - 34000 !== o.pay.winnerGets) bad.push('E：CPU の ロンの 点が ちがう');
    });
    /* ★ T332：F 最後の 局（東風戦の 東2局）で 流局 → ★そこで 終わり・同点なら 引き分け（winner＝null）
               F2 最後の 局で 流局・点に 差 → 終わり・点の 多い 方の 勝ち（供託も そちらへ）
               G 最後で ない 局（東1局）の 流局 → 終わらない・親が 続く */
    function atKyoku(k, pts) {
      var m = C.createMatch({ length: 'tonpu', firstDealer: 0 }); m.kyoku = k; if (pts) m.points = pts.slice();
      var S = { v: 1, len: 'tonpu', mseed: 7, match: m, h: null };
      X.newHand(S); S.h.phase = 'play'; S.h.cnt = [17, 17];
      return S;
    }
    run('F', function () {
      var S = atKyoku(1); X.endDraw(S);
      if (!S.match.over) { bad.push('F：★最後の 局の 流局で 終わらない'); return; }
      if (S.match.winner !== null) bad.push('F：★同点なのに 引き分けで ない（' + S.match.winner + '）');
      if (S.match.points[0] !== 35000 || S.match.points[1] !== 35000) bad.push('F：点が ' + S.match.points.join(','));
    });
    run('F2', function () {
      var S = atKyoku(1, [41000, 29000]); X.endDraw(S);   // ★親（あいて）が 2位 ―― MJCore だけなら 続く 場面
      if (!S.match.over) { bad.push('F2：★最後の 局の 流局で 終わらない（親が 2位）'); return; }
      if (S.match.winner !== 0 || S.match.points[0] !== 42000 || S.match.points[1] !== 28000) bad.push('F2：' + S.match.winner + '・' + S.match.points.join(','));
    });
    run('G', function () {
      var S = atKyoku(0); X.endDraw(S);
      if (S.match.over) bad.push('G：★最後で ない 局の 流局で 終わった');
      if (S.match.kyoku !== 0 || S.match.honba !== 1) bad.push('G：親が 続かない');
    });
    /* ★ T334：ロンの 出番の 瞬間の 確かめ表示（★いま 出た 打目で 数える ―― トライ T333 ②）
         H1 人＝親・3飜40符（7索 ★T362 で 七対子から 差しかえ）：子の 1打目で 出る → 「△一発なら 満貫」（★前は「△河底」）
         H2 人＝親・同じ 手：子の 17打目で 出る → 「△河底なら 満貫」（★前は ×）
         H3 人＝子・同じ 手：親の 2打目で 出る → 「△一発なら 満貫」（★前は ×）
         ★ ついでに ★巡目（★出番の 間は いま 出た 打目 ―― T333 ③ は 画面側の roundNo が 数える）*/
    function tri13(dealerHuman) {
      var S = X.newMatch('tonpu', 12345, dealerHuman ? 0 : 1), h = S.h;
      h.hands[0] = sortCodes(C.toList(T13).concat(FILL));
      h.hands[1] = sortCodes(C.toList(CPU13).concat(CREST));
      h.doraAt = 0; h.dora = '1z'; h.ura = '1z'; h.phase = 'build';
      X.decide(S, 0, C.toList(T13)); X.decide(S, 1, C.toList(CPU13));
      return S;
    }
    var HCUT = ['9m', '9m', '9m', '1s', '1z', '1z', '1z', '2z', '2z', '2z', '5z', '5z', '5z', '6z', '6z', '6z', '9p'];
    var CCUT = ['1s', '4s', '4s', '2m', '2m', '2m', '6m', '6m', '6m', '7p', '7p', '7p', '5s', '5s', '5s', '8s'];
    run('H1', function () {
      var S = tri13(true), r;
      X.discard(S, 0, '9m'); r = X.discard(S, 1, '7s');
      if (r.ron !== 0) { bad.push('H1：★一発の △ で ロンの 出番が 無い'); return; }
      var ck = X.myCheck(S, 0).text;
      if (ck !== '待ち：7s △一発なら 満貫') bad.push('H1：★ロンの 出番の 確かめ表示が「' + ck + '」（正は △一発なら 満貫）');
    });
    run('H2', function () {
      var S = tri13(true), r = null, k;
      for (k = 0; k < 16; k++) { X.discard(S, 0, HCUT[k]); r = X.discard(S, 1, CCUT[k]); if (r.ron != null) { bad.push('H2：' + (k + 1) + '打目で ★早い ロンの 出番'); return; } }
      X.discard(S, 0, HCUT[16]); r = X.discard(S, 1, '7s');
      if (r.ron !== 0) { bad.push('H2：★河底の △ で ロンの 出番が 無い'); return; }
      if (S.h.offer.no !== 17) bad.push('H2：打目が ' + S.h.offer.no);
      var ck = X.myCheck(S, 0).text;
      if (ck !== '待ち：7s △河底なら 満貫') bad.push('H2：★河底の ロンの 出番の 確かめ表示が「' + ck + '」（正は △河底なら 満貫）');
      var o = X.ron(S, 0);
      if (o.result.han !== 4 || o.result.fu !== 40) bad.push('H2：河底で ' + o.result.han + '飜' + o.result.fu + '符');
    });
    run('H3', function () {
      var S = tri13(false), r;
      X.discard(S, 1, '1s'); X.discard(S, 0, '9m'); r = X.discard(S, 1, '7s');
      if (r.ron !== 0) { bad.push('H3：★子の 一発（親の 2打目）で ロンの 出番が 無い'); return; }
      var ck = X.myCheck(S, 0).text;
      if (ck !== '待ち：7s △一発なら 満貫') bad.push('H3：★子の 一発の ロンの 出番の 確かめ表示が「' + ck + '」（正は △一発なら 満貫）');
    });
    return bad;
  }

  var ENGINE = {
    TUNE: TUNE, HUMAN: HUMAN, CPU: CPU, core: C,
    newMatch: newMatch, newHand: newHand, nextHand: nextHand, endDraw: endDraw, isLastLab: isLastLab, setDora: setDora, cpuDoraAt: cpuDoraAt,
    decide: decide, discard: discard, ron: ron, ronResult: ronResult,
    restCounts: restCounts, restList: restList, ctxOf: ctxOf, dealerOf: dealerOf,
    checkLine: checkLine, myCheck: myCheck, chancesFor: chancesFor, markWord: markWord,
    Builder: Builder, cpuBuilder: cpuBuilder, cpuView: cpuView, cpuDiscard: cpuDiscard,
    simMatch: simMatch, selfTest: selfTest, mix: mix, sortCodes: sortCodes, counts: counts
  };
  root.JUNANAHO_ENGINE = ENGINE;
  if (typeof module === 'object' && module.exports) module.exports = ENGINE;

  /* ★ Node（画面が ない ところ）では ここで おしまい。★ここから下は 1行も 動かない。 */
  if (typeof document === 'undefined') return;

  /* ============================================================
     ★★ ここから 画面（UI）★★
     ★ T332：アトの 画面案（logs/T331_17歩画面案_アト.md・見本 mihon.html の layout()／fit()）に 合わせて 作り直した。
       ・押す 場所に 先に 面積を 配って、残りで 読む 場所を 描く（★手作り＝山 34枚／17巡＝切れる 21枚）
       ・牌は 盤そのもの（★44px の 外・社長の 決め①）。★牌 以外の ボタンは 全画面 44px 以上（見張り ⑥）
       ・幅 320 の たて だけ 17巡の 間 上下に 動かせる（社長の 決め②・見張り ⑱）
     ============================================================ */
  var $ = function (id) { return document.getElementById(id); };
  var MJ = root.MJ;                                   // ★アトの 部品（../mahjong-tiles.js）
  var E = ENGINE;
  /* ★T365：符あり（T362）で しまう 中身が 変わった（★result に fu・kiriage／★ロンの 出番の 決まり）ので 名前を v2 に 上げる。
     ★前の 版（v1）の 中身は 読まない・見つけたら 消す（★読むと ×の 牌で ロンの ボタン・「undefined符」―― トライ T364 F1・F2）*/
  var SAVE_KEY = 'bragekobo-17ho-v2', OLD_KEYS = ['bragekobo-17ho-v1'];
  var R = TUNE.RATIO;

  /* ★★ たての 線 ―― ★JS の 名前つき 数 だけ（★CSS に 同じ 数を 書かない・追記⑥ 決まり2）★★
       LOW_H   340 … よこの 低い 画面：手作りの「手の 列」を 省く・切る 牌は 上げない（★わく＋線）
                     （★9画面＋底の よこの たて 272・320 と 375〜428 の あいだ。★どれも またがない）
       TIGHT_H 700 … たての せまい 画面：手作りの「手の 列」を 省く・ハッピーを 小さく
                     （★たての 454・480・568 と 812・844 の あいだ）
       ROOMY_H 560 … よこで たけが ある（★パソコン）：ハッピーを 大きく（★よこの 9画面は 428 まで）
     ★ はばの 線：SCROLL_W 340 … ★幅 320 の たて だけ 17巡の 間 上下に 動かせる（★320 と 375 の あいだ）*/
  var LOW_H = 340, TIGHT_H = 700, ROOMY_H = 560, SCROLL_W = 340;
  /* ★★T338（社長）：★PC の 大きい 画面も スマホたてと 同じ 並べ方 ★★
       TATE_H 560 … ★たけが これ 以上 なら ★よこ長でも「たて並び」（★まん中に たての 列）。
                    ★スマホよこ（9画面＋底：272・320・375・390・414・428）は ★どれも これより 低い ―― よこの 並べ方の まま。
                    ★パソコン（1280×800・1366×768・1024×768…）と タブレットの よこ（768〜）は たて並び。
       ★この 線は ★JS だけ（★CSS に 同じ 数を 書かない ―― 追記⑥ 決まり2）*/
  var TATE_H = 560;

  /* ============================================================
     ★ ハッピーの ことば（★画面の 言葉は ここ 1か所だけ ―― 見張り ⑤ が 全部 はかる）
     ★ {t} は 牌の 名前（★見張りは いちばん 長い「九萬」で はかる）
     ============================================================ */
  var LINES = {
    title:      '34枚から 13枚、満貫の 手を 作ろう！',
    youOya:     'あなたが 親！　山から 1枚 めくってね。',
    cpuOya:     'あいてが 親。ドラ表示牌を 見てね。',
    build:      '13枚 えらんで「決定」！',
    tooMany:    '13枚まで だよ。',
    wait:       'あいてが 考えているよ…',
    defend:     'この局は 守りきろう！',
    myTurn:     '切る 牌を 2回 おしてね。',
    myTurnPick: '{t}？ もう1回 おすと 切るよ',
    cpuTurn:    'あいての 番だよ。',
    ronChance:  '{t}が 出た！ ロン できるよ！',
    passLow:    'とどかない 牌…もう ロンできないよ',
    selfFuriten:'待ち牌を 切ったので フリテン。',
    youRon:     'やったー！　ロン！',
    cpuRon:     'ロンされちゃった…つぎ がんばろ！',
    draw:       '流局！　供託は つぎの 局へ。',
    lastDraw:   '最後の 局が 流局で おしまい！',
    winMatch:   'あなたの 勝ち！　やったね！',
    loseMatch:  'あいての 勝ち…つぎ がんばろ！',
    tieMatch:   '引き分け！　いい 勝負だったね。'
  };
  var SAMPLE_T = '九萬';
  function line(k, t) { return LINES[k].replace('{t}', t || SAMPLE_T); }
  function say(t) { $('happyBubble').textContent = t; }
  /* ★ 牌の 名前（★ハッピーと ロンの ボタン 用。★麻雀の 書き方 ―― 追記⑭）*/
  var KANSUJI = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  var SUIT = { m: '萬', p: '筒', s: '索' }, JIHAI = ['', '東', '南', '西', '北', '白', '發', '中'];
  function tileName(c) { return c[1] === 'z' ? JIHAI[+c[0]] : KANSUJI[+c[0]] + SUIT[c[1]]; }

  /* ── 部品 ─────────────────────────────────── */
  var S = null;                     // ★いまの 試合（★この まま sessionStorage に しまう）
  var lenSel = 'tonpu';             // はじめの 画面で 選んだ 局数
  var builder = null, builderTimer = 0, builtFor = [], maxSlice = 0;
  var timers = [], gen = 0, busy = false, flipAt = -1, special = null;
  var guardUntil = 0;
  var resultKind = null;            // 'hand' | 'final'
  var geo = { scene: 'title', t: {} };

  function later(fn, ms) {
    var my = gen, id = setTimeout(function () {
      var k = timers.indexOf(id); if (k >= 0) timers.splice(k, 1);
      if (my === gen) fn();
    }, ms);
    timers.push(id);
    return id;
  }
  function fmt(n) { var s = String(Math.abs(Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ','); return (n < 0 ? '-' : '') + s; }
  function sgn(n) { return (n > 0 ? '+' : n < 0 ? '-' : '±') + fmt(Math.abs(n)); }
  var KYOKU_NAME = ['東1局', '東2局', '南1局', '南2局'];
  function kyokuName(lab) { return (lab.wind === '1z' ? '東' : '南') + lab.no + '局'; }
  var RANK_NAME = { mangan: '満貫', haneman: '跳満', baiman: '倍満', sanbaiman: '三倍満', kazoe: '役満', yakuman: '役満', yakuman2: 'ダブル役満', yakuman3: 'トリプル役満' };
  /* ★T334：★4倍 から 上は「四倍役満」「五倍役満」…（★仕様書 §2-3 の 表の 字。★MJCore の 名前は「4倍役満」―― ★MJCore は 変えない）
     ★前は 4倍 以上が RANK_NAME に 無く、★試合の おわりの 記録で 位が 空に なって いた（トライ T333 ④）。 */
  /* ★T362：局の 結果の 位の 1行 ――「4飜 30符 → 満貫（切り上げ）」（★役満は 位だけ）。★数えるのは MJCore（★ここは 字を 並べる だけ）*/
  function rankLine(r) {
    if (r.yakuman) return rankName(r.rank.id);
    return '<span class="nw">' + r.totalHan + '飜 ' + r.fu + '符</span> → <span class="nw">' + rankName(r.rank.id) + (r.kiriage ? '（切り上げ）' : '') + '</span>';
  }
  function rankName(id) {
    if (RANK_NAME[id]) return RANK_NAME[id];
    var m = /^yakuman(\d+)$/.exec(id || '');
    if (m && +m[1] >= 4) return (+m[1] <= 9 ? KANSUJI[+m[1]] : m[1]) + '倍役満';
    return '';
  }

  /* ============================================================
     ★ とちゅうの つづき（★sessionStorage ―― ラビット・ナボコフ・ブラックジャックと 同じ 考え）
     ★ 読み直しても ★同じ 局・同じ 34枚に 戻る（★引き直しに 使えない ＝ T-15・T-26）。
     ★ やめた ときは 消す。★タブを 閉じれば 消える（★社長の 決め④ ―― いまの まま）。
     ============================================================ */
  var store = null;
  try { sessionStorage.setItem('__17ho_t', '1'); sessionStorage.removeItem('__17ho_t'); store = sessionStorage; } catch (e) { store = null; }
  function save() { if (!store || !S) return; try { store.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* 遊びは 止めない */ } }
  function clearSave() { if (store) try { store.removeItem(SAVE_KEY); } catch (e) {} }
  function loadSave() {
    if (!store) return null;
    OLD_KEYS.forEach(function (k) { try { store.removeItem(k); } catch (e) {} });   // ★T365：前の 版の 中身は 読まずに 消す
    var s = null;
    try { s = JSON.parse(store.getItem(SAVE_KEY) || 'null'); } catch (e) { s = null; }
    if (!s) return null;
    var ok = false;
    try { ok = goodState(s); } catch (e) { ok = false; }
    if (!ok) { clearSave(); return null; }
    return s;
  }
  /* ★ しまった 中身が 決まりどおりか（★136枚・1種類 4枚・13枚は 34枚の 中・捨て牌の 数・点の 合計・★切った 場所）*/
  function goodState(s) {
    if (!s || s.v !== 1 || (s.len !== 'tonpu' && s.len !== 'hanchan') || !s.match || !s.h) return false;
    var m = s.match, h = s.h, i, k;
    if (m.over && h.phase !== 'end') return false;
    if (Math.abs(m.points[0] + m.points[1] + m.kyotaku - 2 * C.RULES.startPoints) > 1e-9) return false;
    if (!h.hands || h.hands[0].length !== 34 || h.hands[1].length !== 34 || h.rest.length !== 68) return false;
    var all = E.counts(h.hands[0].concat(h.hands[1], h.rest));
    for (i = 0; i < 34; i++) if (all[i] !== 4) return false;
    if (['dora', 'build', 'play', 'end'].indexOf(h.phase) < 0) return false;
    if (h.phase !== 'dora' && (h.doraAt < 0 || h.dora !== h.rest[h.doraAt])) return false;
    for (k = 0; k < 2; k++) {
      if (h.h13[k]) {
        var have = E.counts(h.hands[k]), use = E.counts(h.h13[k]), riv = E.counts(h.river[k]);
        if (h.h13[k].length !== 13) return false;
        for (i = 0; i < 34; i++) if (use[i] + riv[i] > have[i]) return false;
        h.w[k] = C.waits(h.h13[k]);                 // ★待ちは しまった 字を 信じず 数え直す
      } else if (h.river[k].length) return false;
      if (h.cnt[k] !== h.river[k].length || h.cnt[k] > C.RULES.turns) return false;
    }
    if ((h.phase === 'play' || h.phase === 'end') && !(h.h13[0] && h.h13[1])) return false;
    if (h.pick.some(function (x) { return !(x >= 0 && x < 34); })) return false;
    /* ★T332：切った 場所（21枚の 何枚目）。★無ければ 捨て牌から 数え直す */
    if (h.gone != null) {
      if (!Array.isArray(h.gone) || h.gone.length !== h.river[HUMAN].length || !h.h13[HUMAN]) return false;
      var sl = slots21(h), seen = {};
      for (i = 0; i < h.gone.length; i++) { var g = h.gone[i]; if (!(g >= 0 && g < 21) || seen[g] || sl[g] !== h.river[HUMAN][i]) return false; seen[g] = 1; }
    }
    if (h.selAt != null && !(h.selAt >= 0 && h.selAt < 21)) return false;
    return true;
  }

  /* ============================================================
     ★ 切れる 21枚（★34枚 から 13枚を 引いた もの。★並びは 決めた ときから 変わらない ―― 切った 場所は 点線の わく）
     ============================================================ */
  function slots21(h) {
    var c = E.counts(h.hands[HUMAN]), u = E.counts(h.h13[HUMAN] || []), out = [];
    for (var i = 0; i < 34; i++) for (var k = 0; k < c[i] - u[i]; k++) out.push(CODES[i]);
    return out;
  }
  function goneOf(h) {
    var rv = h.river[HUMAN];
    if (h.gone && h.gone.length === rv.length) return h.gone;
    var sl = slots21(h), g = [];                    // ★古い しまい方：前から 数えて 決める
    rv.forEach(function (c) { for (var i = 0; i < sl.length; i++) if (sl[i] === c && g.indexOf(i) < 0) { g.push(i); return; } });
    return g;
  }

  /* ============================================================
     ★ 牌を 並べる（★.tl ＝ 指の 的の セル。★中の 牌の 絵は --tw・セルは --cw）
     ============================================================ */
  function tileHTML(code, i, cls) {
    return '<div class="tl' + (cls ? ' ' + cls : '') + '" data-i="' + i + '">' + (code === '_' || !MJ ? '' : MJ.tile(code, 64)) + '</div>';
  }
  /* ★ 同じ 並びなら 作り直さず class だけ 付けかえる（★上がる 動きが なめらかに 見える）*/
  function setTiles(el, codes, clsOf) {
    var key = codes.join(',');
    if (el.dataset.codes !== key) {
      var html = '';
      for (var i = 0; i < codes.length; i++) html += tileHTML(codes[i], i, clsOf ? clsOf(i) : '');
      el.innerHTML = html;
      el.dataset.codes = key;
      return;
    }
    var ch = el.children;
    for (var j = 0; j < ch.length; j++) {
      var c = clsOf ? clsOf(j) : '', want = 'tl' + (c ? ' ' + c : '');
      if (ch[j].className !== want) ch[j].className = want;
    }
  }
  function setHTML(el, html) { if (el.dataset.html !== html) { el.innerHTML = html; el.dataset.html = html; } }
  function clearTiles(el) { if (el.dataset.codes) { el.innerHTML = ''; el.dataset.codes = ''; } }
  function pad17(a) { var o = a.slice(); while (o.length < 17) o.push('_'); return o; }

  /* ★★ 牌の 大きさ（★アトの 見本の fit() と 同じ 数え方）★★
     ★ W×H の 箱に list を 並べる。★列の 数を ぜんぶ 試して ★牌が いちばん 大きく なる ものを 取る。
       o.lift … 選んだ 牌が 上がる 分（牌の たけ × TUNE.RAISE）を セルに 取っておく
       o.tap  … 押す 牌：★はばに ゆとりが あれば 指の 的（セル）を 44px まで 広げる（★牌の すき間が 少し 開くだけ）
       o.brk  … 1種類 1行（★牌が TUNE.BRK_MIN px を 切る ときだけ 折り返しを 許す）
       o.cols … 列の 数を 決め打ち ／ o.cmin・o.cmax … 試す 列の 数 ／ o.cap … 牌の はばの 上限 */
  function rowsFor(list, c, brk) {
    if (!brk) return Math.ceil(list.length / c);
    var g = {}, n = 0;
    list.forEach(function (x) { g[x[1]] = (g[x[1]] || 0) + 1; });
    for (var k in g) if (g.hasOwnProperty(k)) n += Math.ceil(g[k] / c);
    return n;
  }
  function fit(el, list, W, H, o) {
    var L = o.lift ? TUNE.RAISE : 0, cap = o.cap || 60, pad = TUNE.PAD;
    /* ★T334：★箱の 寸法が 0・NaN でも こけない（★回転の とちゅうで 箱が まだ 0 の ことが ある ―― トライ T333 ①）*/
    if (!(W > 1)) W = 1;
    if (!(H > 1)) H = 1;
    if (!list.length) list = ['_'];
    function tryC(c) { var r = rowsFor(list, c, o.brk); return { c: c, r: r, tw: Math.min(cap, W / c - pad, (H / r - pad - 1) / (R + L)) }; }
    var cmin = o.cols || o.cmin || 1, cmax = o.cols || o.cmax || list.length;
    var free = false;
    if (o.brk && !o.cols) {
      var g = {}, mx = 0;
      list.forEach(function (x) { g[x[1]] = (g[x[1]] || 0) + 1; });
      for (var k in g) if (g.hasOwnProperty(k)) mx = Math.max(mx, g[k]);
      /* ★★T335（社長の 決め）：★スマホ たての 手作りは ★いちばん 多い 種類 だけ 2行に 折って よい（o.fold）★★
           列を ★2番目に 多い 種類の 枚数 以上に して おけば、★折れるのは いちばん 多い 種類 だけ（★ほかは 1種類 1行の まま）。
           ★折らない 並べ方（列＝いちばん 多い 枚数）も 候補に 残す ―― ★今より 小さく ならない。 */
      /* ★いちばん 多い 種類が 2つ 以上 同じ 枚数（★例 萬10・索10）の ときは ★その 2つとも「いちばん 多い 種類」として 折って よい
           （★1つ だけに すると 列が へらせず 1ミリも 大きく ならない ―― T335 の 数え：390×844 で 150山中 33山）*/
      var sec = 0;
      for (var k2 in g) if (g.hasOwnProperty(k2) && g[k2] < mx) sec = Math.max(sec, g[k2]);
      /* ★前からの 決まり：1種類 1行（列＝one）で 牌が BRK_MIN 以上なら それだけ／BRK_MIN を 切るなら 自由に 折る（free）。
         ★T335：たては そこに「いちばん 多い 種類 だけ 折る」列（lo〜one）を 足す ―― ★候補を 足す だけ なので 前より 小さく ならない */
      var one = Math.max(cmin, mx), lo = o.fold ? Math.min(one, Math.max(Math.ceil(mx / 2), sec, 1)) : one;
      /* ★★T339（社長「2」）：★いちばん 多い 種類が 12枚 以上の 配りだけ ★前の 折り方（★free：ほかの 種類も 折って 牌を 大きく）★★
           ★「いちばん 多い 種類だけ 折る」（strict）は ★11枚 以下の 配りだけ（★T338 で 12枚 以上が 中央 46.5→35.5px に なった 代金を 戻す）*/
      if (o.strict && mx <= TUNE.STRICT_MAX) {
        /* ★★T338（社長「1」）：★どの 山でも 折るのは いちばん 多い 種類 だけ（★ほかの 種類は かならず 1行）★★
             ★列は ★2番目に 多い 枚数 以上。★まず 2行（列 ≧ 半分）で さがし、★BRK_MIN に とどかない ときだけ 3行 以上も 見る。
             ★前の「free（自由に 折る）」は ★使わない ―― ★12枚 以上の 山で ほかの 種類まで 折れて いた（トライ T336 ②）*/
        var bestLo = -1e9, cf;
        for (cf = lo; cf <= one; cf++) bestLo = Math.max(bestLo, tryC(cf).tw);
        cmin = bestLo >= TUNE.BRK_MIN ? lo : Math.max(sec, 1);
        cmax = one;
      } else {
        free = !(tryC(one).tw >= TUNE.BRK_MIN);
        cmin = free ? Math.min(cmin, lo) : lo;
        cmax = Math.min(cmax, one);                     // ★1行に その種類より 多い 列は 要らない
      }
    }
    var all = [], c, top = -1e9;
    for (c = cmin; c <= cmax; c++) { var t = tryC(c); all.push(t); top = Math.max(top, t.tw); }
    /* ★同じ 大きさに なる 並べ方が いくつか あるとき（★上限に 当たった とき）は ★箱の 形に いちばん 近い もの */
    var ar = W / H, best = null, bf = Infinity;
    all.forEach(function (x) {
      if (x.tw < top - 0.5) return;
      var f = Math.abs(Math.log((x.c * (x.tw + pad)) / (x.r * (x.tw * (R + L) + pad)) / ar)) + 0.5 * ((x.c * x.r - list.length) / x.c);
      if (!isFinite(f)) f = 1e9;                        // ★牌が 0 より 小さい 形は ★比べられないが ★捨てない
      if (!best || f < bf) { bf = f; best = x; }
    });
    if (!best) best = all[0] || tryC(cmin);
    fitCalls++;
    var tw = Math.max(TUNE.TILE_MIN, Math.floor(best.tw * 2) / 2);
    var lift = Math.round(tw * L);
    var cw = o.tap ? Math.floor(Math.max(tw + pad, Math.min(44, W / best.c)) * 2) / 2 : tw + pad;
    el.style.setProperty('--tw', tw + 'px');
    el.style.setProperty('--lift', lift + 'px');
    el.style.setProperty('--cw', cw + 'px');
    el.style.gridTemplateColumns = 'repeat(' + best.c + ', ' + cw + 'px)';
    return { cols: best.c, rows: best.r, tw: tw, cw: cw, ch: +(tw * R + lift + pad).toFixed(1), free: free };
  }
  function box(el) { return el.getBoundingClientRect(); }
  /* ★T335：山 34枚の 並べ方（★たて だけ いちばん 多い 種類を 2行に 折って よい）。★見張り ㉒ が 同じ 箱で 折らない 形と くらべる */
  function poolOpt(fold, strict) { return { lift: true, tap: true, brk: true, fold: fold, strict: !!strict, cmin: 6, cmax: 17, cap: TUNE.CAP_POOL }; }
  var poolIn = null;
  function slots21Sample() { var a = []; for (var i = 0; i < 21; i++) a.push(CODES[i]); return a; }
  var pageErrors = [];
  var usedLevels = [];                             // ★T339：画面で CPU が 使った 強さ（★組み／'d:'＝捨て）―― 見張り ㉗                             // ★T334：★読み込んで から 出た 画面の エラー（★見張り ⑳）
  function inner(el) {
    var r = el.getBoundingClientRect(), s = getComputedStyle(el);
    return { w: r.width - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight) - parseFloat(s.borderLeftWidth) - parseFloat(s.borderRightWidth),
             h: r.height - parseFloat(s.paddingTop) - parseFloat(s.paddingBottom) - parseFloat(s.borderTopWidth) - parseFloat(s.borderBottomWidth) };
  }

  /* ★ いまの 場面：はじめ／手作り（★ドラを めくる 間も）／17巡（★局の おわりの 箱の うしろも）*/
  function sceneOf() { if (!S) return 'title'; var p = S.h.phase; return (p === 'dora' || p === 'build' || flipAt >= 0) ? 'make' : 'play'; }
  function scrollOn() { return sceneOf() === 'play' && window.innerWidth <= window.innerHeight && window.innerWidth < SCROLL_W; }

  /* ★★ 並べ方（★この 画面の 心臓）★★
     ★ よこ（はば＞たけ）：左に 盤・右に 柱（★帯と ハッピーも 柱へ）。★たて：上から 帯 → 場面の 格子。
     ★ 押す 場所（山 34枚／切れる 21枚）に 先に 面積を 配って、残りで 読む 場所（河・手）を 描く。 */
  /* ★★ T334：★その 場で 回すと ★1回目の 並べ方が ★回す 前の 中身の はばで 数えられる（★トライ T333 ①）★★
     ★ スマホは 中身が 画面より 広いと ★画面の はば（innerWidth）を 中身に 合わせて 広げる。
       ★よこ（568）の 中身の まま たて（320）に 戻すと ★1回目は innerWidth が 367 に なり、★幅 320 の 上下に 動かす 形に ならない。
     → ★並べた あとで 画面の 大きさを もう一度 読み、★変わって いれば 並べ直す（★3回まで ―― ★見張り ⑳ が 数える）。 */
  var layoutPasses = 0, fitCalls = 0;
  function layout() {
    var W0, H0, k = 0;
    do { W0 = window.innerWidth; H0 = window.innerHeight; layoutOnce(); k++; }
    while (k < 3 && (window.innerWidth !== W0 || window.innerHeight !== H0));
    layoutPasses = k;
    /* ★T343（トライ T340）：★ロンの 出番の 最中に 回すと ★ロンの ボタンが 画面の 下に かくれた（320×568）。
         ★並べ直した あとにも ★ロンまで 動かす（showRon）を もう一度 かける。★ボタンが 画面の 中に 来たかを geo に 残す（★見張り ㉙）*/
    if (S && S.h.phase === 'play' && S.h.offer && S.h.offer.p === HUMAN) {
      showRon();
      var rb = $('btnRon').getBoundingClientRect();
      geo.ronIn = rb.top >= -0.5 && rb.bottom <= window.innerHeight + 0.5;
    }
  }
  function layoutOnce() {
    var app = $('app'), W = window.innerWidth, H = window.innerHeight, sc = sceneOf();
    var tb = $('topbar'), lr = $('logRow'), scroll = scrollOn();
    document.documentElement.classList.toggle('is-scroll', scroll);
    app.classList.toggle('is-scroll', scroll);
    if (!scroll && (window.scrollY || document.documentElement.scrollTop)) window.scrollTo(0, 0);
    app.classList.toggle('in-scene', sc !== 'title');
    $('titleScreen').classList.toggle('hidden', sc !== 'title');
    $('make').classList.toggle('hidden', sc !== 'make');
    $('play').classList.toggle('hidden', sc !== 'play');
    $('btnQuitGame').classList.toggle('hidden', sc === 'title');
    if (sc === 'title') {
      app.dataset.mode = ''; app.dataset.low = app.dataset.tight = app.dataset.roomy = '0';
      if (tb.parentElement !== app) app.insertBefore(tb, app.firstChild);
      if (lr.parentElement !== app) app.appendChild(lr);
      titleLayout();
      fitBrand();
      geo = { scene: 'title', mode: app.classList.contains('is-side') ? 'side' : 'stack', t: {}, W: W, H: H };
      fitResult();
      return;
    }
    app.classList.remove('is-side');
    var yoko = W > H && H < TATE_H, low = yoko && H < LOW_H, tight = !yoko && H < TIGHT_H, roomy = yoko && H >= ROOMY_H;
    /* ★たて並びで 画面が よこ長（PC）の ときは ★まん中に たての 列（★はば＝たけ × 0.66・420〜640）*/
    var colw = (!yoko && W > H) ? Math.round(Math.min(W, Math.max(420, Math.min(640, H * 0.66)) + 16)) : 0;
    if (colw) app.style.setProperty('--colw', colw + 'px'); else app.style.removeProperty('--colw');
    app.dataset.wide = colw ? '1' : '0';
    app.dataset.mode = yoko ? 'yoko' : 'tate';
    app.dataset.low = low ? '1' : '0'; app.dataset.tight = tight ? '1' : '0'; app.dataset.roomy = roomy ? '1' : '0';
    var aw = Math.min(W, 1100) - 16;
    var side = !yoko ? 0 : sc === 'make' ? Math.round(Math.max(236, Math.min(260, aw * 0.29))) : Math.round(Math.min(230, Math.max(172, aw * 0.25)));
    app.style.setProperty('--side', side + 'px');
    app.dataset.narrow = side >= 250 ? '0' : side >= 200 ? '1' : '2';
    var sideEl = $(sc === 'make' ? 'makeSide' : 'playSide');
    if (yoko) { if (tb.parentElement !== sideEl) sideEl.insertBefore(tb, sideEl.firstChild); }
    else if (tb.parentElement !== app) app.insertBefore(tb, app.firstChild);
    /* ★★T338（社長）：★ハッピーは いちばん 上 ―― ★局の 帯の すぐ 下（★よこの 柱でも 帯 → 局の 帯 → ハッピー）★★ */
    var infoEl = $(sc === 'make' ? 'makeInfo' : 'playInfo');
    if (lr.parentElement !== sideEl || lr.previousElementSibling !== infoEl) sideEl.insertBefore(lr, infoEl.nextSibling);
    var t = {};
    /* ★PC の たて並び：列が ひろい ぶん 河・手の 牌の 上限を 少し 上げる（★スマホ たては 1倍 ―― 何も 変わらない）*/
    var kw = yoko ? 1 : Math.max(1, Math.min(1.5, (Math.min(W, colw || W) - 16) / 400));
    if (sc === 'make') {
      var h = S.h, dora = h.phase === 'dora' || flipAt >= 0, pc = $('pileCard');
      $('make').classList.toggle('is-dora', dora);
      pc.classList.remove('snug');
      if (!low && !tight && !dora) {
        t.pick = fit($('pickRow'), fill68().slice(0, 13), inner($('pickCard')).w, 999,
          { cols: 13, cap: yoko ? Math.min(TUNE.CAP_PICK_YOKO, (H - 12) * 0.14 / R) : TUNE.CAP_PICK_TATE * kw });
      }
      void app.offsetWidth;
      var pb = box($('pileBox'));
      if (dora) t.wall = fit($('wall'), fill68(), pb.width, pb.height, { tap: true, cmin: 1, cmax: 68, cap: TUNE.CAP_POOL });
      else {
        /* ★幅 320 の たて（★SCROLL_W 未満）は ★たけが 足りないので 前の まま 自由に 折る（★社長「320 は 今のまま」）*/
        var strict = !yoko && W >= SCROLL_W;
        t.pool = fit($('pool'), h.hands[HUMAN], pb.width, pb.height, poolOpt(!yoko, strict)); poolIn = { w: pb.width, h: pb.height, fold: !yoko, strict: strict };
      }
      void app.offsetWidth;
      var tl = $(dora ? 'wall' : 'pool');
      if (!yoko && box(tl).height < pb.height - 24) pc.classList.add('snug');
    } else {
      var ri = inner($('riverCard'));
      var rcols = yoko ? 17 : 9, rcap = yoko ? Math.min(TUNE.CAP_RIVER_YOKO, (H - 12) * 0.105 / R) : TUNE.CAP_RIVER_TATE * kw;
      t.ropp = fit($('riverOpp'), pad17(S.h.river[CPU]), ri.w, 999, { cols: rcols, cap: rcap });
      t.rme = fit($('riverMe'), pad17(S.h.river[HUMAN]), ri.w, 999, { cols: rcols, cap: rcap });
      t.hand = fit($('hand13'), S.h.h13[HUMAN], inner($('handCard')).w, 999,
        { cols: 13, cap: low ? TUNE.CAP_HAND_LOW : yoko ? Math.min(TUNE.CAP_HAND_YOKO, (H - 12) * 0.12 / R) : TUNE.CAP_HAND_TATE * kw });
      var oi = inner($('oppRow'));
      /* ★T362：点の 字の はばを 測って 残りに 裏13枚（★ダブル役満 以上で「-126,000」の ように 桁が 増えても はみ出さない）*/
      var osc = $('oppRow').querySelector('.sc'), oscw = osc ? osc.getBoundingClientRect().width : 0;
      $('oppRow').style.setProperty('--bw', Math.max(8, Math.min(16, (oi.w - Math.max(130, oscw + 12)) / 13 - 1)) + 'px');
      void app.offsetWidth;
      var rb = box($('restBox'));
      /* ★幅 320 の たて：★たけは 気に しない（★上下に 動かす）―― 7列×3行で はば いっぱい */
      t.rest = fit($('rest'), slots21(S.h), rb.width, scroll ? 99999 : rb.height, scroll ? { lift: true, tap: true, cols: TUNE.SCROLL_COLS, cap: TUNE.CAP_REST }
        : { lift: !low, tap: true, cmin: 3, cmax: 21, cap: TUNE.CAP_REST });
    }
    /* ★ 待ちの 札が 入らない とき（★◎△× が 3種類・十三面待ち など）だけ ★出して みて 詰める（★たての 線は 引かない）
       ck 1：「聴牌 待ち」の 字を 省く ／ ck 2：札の 牌を 小さく（★低い よこは 牌を 上・字を 下）／ ck 3：よこの 局の 帯を 2行に */
    [$('pileTag'), $('restTag')].forEach(function (tg) {
      tg.classList.remove('is-short');
      if (tg.querySelector('.t-short') && vis(tg) && tg.scrollWidth > tg.clientWidth + 0.5) tg.classList.add('is-short');
    });
    fitBrand();
    app.dataset.ck = '0';
    for (var lv = 1; lv <= 3 && waitsOver(sc, yoko ? sideEl : null); lv++) app.dataset.ck = String(lv);
    geo = { scene: sc, mode: app.dataset.mode, low: low, tight: tight, roomy: roomy, scroll: scroll, side: side, ck: +app.dataset.ck, t: t, W: W, H: H };
    fitResult();
  }
  function waitsOver(sc, sideEl) {
    var els = sc === 'make' ? [$('check')] : [$('meRow'), $('playWaits')], bad = false;
    els.forEach(function (el) { if (vis(el) && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)) bad = true; });
    var ch = document.querySelectorAll('#' + sc + ' .chips');
    for (var i = 0; i < ch.length; i++) if (vis(ch[i]) && ch[i].children.length > 1 && ch[i].lastElementChild.offsetTop > ch[i].firstElementChild.offsetTop + 2) bad = true;   // ★札が 2段に 折れた
    if (sideEl && sideEl.scrollHeight > sideEl.clientHeight + 0.5) bad = true;
    return bad;
  }
  /* ★T335：題が「麻雀17歩」に のびた ―― ★帯に 入らない ときだけ 字を 小さく → それでも 入らなければ 字を 出さない（★ねこの かおは 残る）
       ★入らないと 題が 左右に はみ出して「◀」の 指の 的に かぶる（★926×428・1280×800 の よこの 柱で 37px ―― 見張り ⑥⑦）*/
  function fitBrand() {
    var b = $('brand');
    b.classList.remove('is-cut', 'is-cut2');
    if (!vis(b)) return;
    if (b.scrollWidth > b.clientWidth + 0.5) b.classList.add('is-cut');
    if (b.scrollWidth > b.clientWidth + 0.5) b.classList.add('is-cut2');
  }
  function fill68() { var a = []; for (var i = 0; i < 68; i++) a.push('back'); return a; }
  /* ★ はじめの 画面：ハッピーを 下（stack）／右（side）―― ★出して みて 入る 方（★たての 線は 引かない）*/
  function titleLayout() {
    var app = $('app'), ts = $('titleScreen'), cands = [];
    ['stack', 'side'].forEach(function (mode) {
      app.classList.toggle('is-side', mode === 'side');
      fitTitle();
      var fits = ts.scrollHeight <= ts.clientHeight + 0.5 && ts.clientWidth >= TUNE.TITLE_MIN_W;
      cands.push({ mode: mode, sc: (fits ? 10 : 0) + (mode === 'stack' ? 1 : 0) - (ts.classList.contains('is-tight') ? 0.5 : 0) });
    });
    var best = cands[0].sc >= cands[1].sc ? cands[0] : cands[1];
    app.classList.toggle('is-side', best.mode === 'side');
    fitTitle();
  }
  /* ★ はじめの 画面が 箱に 入らない とき（★出して みて 詰める ―― たての 線は 引かない）*/
  function fitTitle() {
    var ts = $('titleScreen');
    ts.classList.remove('is-tight', 'is-tighter');
    if (ts.scrollHeight > ts.clientHeight + 0.5) ts.classList.add('is-tight');
    if (ts.scrollHeight > ts.clientHeight + 0.5) ts.classList.add('is-tighter');
  }

  /* ============================================================
     ★ 画面を 作る
     ============================================================ */
  function badge(p) { var d = S.h.lab.dealer === p; return '<span class="oya' + (d ? '' : ' ko') + '">' + (d ? '親' : '子') + '</span>'; }
  function scoreHTML(p) { return '<span class="sc">' + (p === HUMAN ? 'あなた' : 'あいて') + badge(p) + '<b data-pts="' + p + '">' + fmt(S.match.points[p]) + '</b></span>'; }
  function kyokuHTML() { var lab = S.h.lab; return '<div class="kyoku"><b>' + kyokuName(lab) + '</b><small>' + lab.honba + '本場</small></div>'; }
  function doraHTML() {
    var dc = (S.h.phase === 'dora' && flipAt < 0) || !S.h.dora ? 'back' : S.h.dora;
    return '<div class="dora"><span class="lbl">ドラ<br>表示</span><span class="dora-tile" data-code="' + dc + '">' + (MJ ? MJ.tile(dc, 24) : '') + '</span></div>';
  }
  function kyotakuHTML() {
    var k = S.match.kyotaku, n = Math.min(3, Math.floor(k / 1000)), st = '';
    for (var i = 0; i < n; i++) st += '<i class="stick"></i>';
    return '<div class="kyotaku">' + (n ? '<span class="sticks">' + st + '</span>' : '') + '<span class="lbl">供託<br><span data-kyotaku="1">' + fmt(k) + '</span></span></div>';
  }
  function junHTML() { return '<div class="jun"><span class="lbl">巡目</span><b>' + roundNo() + '<small>／' + C.RULES.turns + '</small></b></div>'; }
  /* ★ 待ちの ◎△×（★記号と 字の 両方。★同じ 印・同じ ことばの 待ちは 1つの 札に まとめる ―― 十三面待ちでも 札は 1〜3枚）*/
  function chipWord(w) {
    if (w.mark === '◎') return '◎満貫';
    if (w.mark === '×') return '×';
    var a = w.via.indexOf('ippatsu') >= 0, b = w.via.indexOf('houtei') >= 0;
    return '△' + (a && b ? '一発・河底' : a ? '一発' : '河底');
  }
  /* ★T334：★フリテンの 間は ★待ちの 牌を ぜんぶ 1つの 灰色の 札に まとめて「フリテン」（★◎の 緑が「まだ ロンできる」に 見えない ように ―― トライ T333 ⑧）
       ★字は ハッピーの「待ち牌を 切ったので フリテン。」と そろえる */
  function chipsHTML(ck, furi) {
    var groups = [], at = {};
    ck.waits.forEach(function (w) {
      var k = furi ? 'フリテン' : chipWord(w);
      if (!at[k]) { at[k] = { mark: w.mark, word: k, tiles: [] }; groups.push(at[k]); }
      at[k].tiles.push(w.tile);
    });
    return '<div class="chips">' + groups.map(function (g) {
      /* ★T335：フリテンの 札には .furi（★T333 までの フリテンの 印の 名前）も 付ける ―― ★トライの 道具が この 名前で 読む */
      var cl = furi ? 'c-furi furi' : g.mark === '◎' ? 'c-ok' : g.mark === '△' ? 'c-mid' : 'c-no';
      return '<span class="chip ' + cl + '"><span class="ts">' + g.tiles.map(function (t) { return MJ ? MJ.tile(t, 22) : t; }).join('') + '</span><i>' + g.word + '</i></span>';
    }).join('') + '</div>';
  }
  /* ★ 確かめ表示 ―― ★文は E.checkLine／E.myCheck（★13枚と 場の 決まり だけ）から。★ここで 1文字も 足さない */
  /* ★T334：★名札の 長い 字と 短い 字（★入らない ときだけ 短い 方 ―― layoutOnce() が 出して みて 決める）
       ★その 場で 回すと 480×320・454×320 を 通る。★そこで 名札が「…」に 切れて いた（★前から・★13画面の 外）*/
  function tagHTML(full, short) { return '<span class="t-full">' + full + '</span><span class="t-short">' + short + '</span>'; }
  function stHTML(ck) {
    if (ck.kind === 'short') return '<p class="st">あと <b>' + ck.n + '</b>枚</p>';
    if (ck.kind === 'noten') return '<p class="st">聴牌して<br>いません</p>';
    return '<p class="st">聴牌<br>待ち</p>';
  }
  function renderMake() {
    var h = S.h, dora = h.phase === 'dora' || flipAt >= 0;
    /* ★T334：★手作りの 間も 供託を 出す（★仕様書 §1-2「帯：東1局 0本場・親・持ち点・供託」―― トライ T333 ⑤）*/
    setHTML($('makeInfo'), '<div class="row">' + kyokuHTML() + doraHTML() + kyotakuHTML() + '</div><div class="row"><div class="scores">' + scoreHTML(HUMAN) + scoreHTML(CPU) + '</div></div>');
    if (dora) {
      var wc = fill68(); if (flipAt >= 0) wc[flipAt] = h.rest[flipAt];
      setTiles($('wall'), wc, function (i) { return i === flipAt ? 'is-flip' : ''; });
      $('wall').classList.toggle('pick', E.dealerOf(S) === HUMAN && flipAt < 0);
      $('wall').classList.remove('hidden'); $('pool').classList.add('hidden'); clearTiles($('pool'));
      setHTML($('pileTag'), tagHTML('山（ふせた 68枚）', '山'));
    } else {
      $('wall').classList.add('hidden'); clearTiles($('wall')); $('pool').classList.remove('hidden');
      var up = {}, codes = h.hands[HUMAN];
      h.pick.forEach(function (x) { up[x] = 1; });
      setTiles($('pool'), codes, function (i) { return ((up[i] ? 'is-up' : '') + (i > 0 && codes[i][1] !== codes[i - 1][1] ? ' brk' : '')).trim(); });
      $('pool').classList.toggle('pick', !h.h13[HUMAN]);
      setHTML($('pileTag'), tagHTML('あなたの 34枚 ― タップで 13枚 選ぶ', 'あなたの 34枚'));
    }
    /* ★★T338（社長：「気づかなかった」）：★めくる ことを 板の 上に 大きな 字で（★ハッピーの ことばとは 別に）★★ */
    $('doraCall').classList.toggle('hidden', !(dora && E.dealerOf(S) === HUMAN && flipAt < 0));
    var pl = h.h13[HUMAN] || pickList(), pr = pl.slice();
    while (pr.length < 13) pr.push('_');
    setTiles($('pickRow'), pr, function (i) { return pr[i] === '_' ? 'empty' : ''; });
    $('pickN').textContent = String(pl.length);
    var ck = dora ? { kind: 'short', n: 13, waits: [], text: 'あと 13枚' } : E.checkLine(pl, E.ctxOf(S, HUMAN));
    var el = $('check');
    el.dataset.text = ck.text;
    setHTML(el, stHTML(ck) + (ck.kind === 'waits' ? chipsHTML(ck) : ''));
    $('btnDecide').disabled = dora || h.pick.length !== 13 || !!h.h13[HUMAN];
  }
  function renderPlay() {
    var h = S.h, m = S.match;
    setHTML($('playInfo'), '<div class="row">' + kyokuHTML() + junHTML() + '</div><div class="row">' + doraHTML() + kyotakuHTML() + '</div>' +
      '<div class="row yoko-only"><div class="scores">' + scoreHTML(CPU) + scoreHTML(HUMAN) + '</div></div>');
    var backs = ''; for (var i = 0; i < 13; i++) backs += MJ ? MJ.tile('back', 16) : '';
    setHTML($('oppRow'), scoreHTML(CPU) + '<span class="backs">' + backs + '</span>');
    var ro = pad17(h.river[CPU]), rm = pad17(h.river[HUMAN]), last = h.river[CPU].length - 1;
    setTiles($('riverOpp'), ro, function (i) { return ro[i] === '_' ? 'empty' : i === last ? 'new' : ''; });
    setTiles($('riverMe'), rm, function (i) { return rm[i] === '_' ? 'empty' : ''; });
    setTiles($('hand13'), h.h13[HUMAN], null);
    var sl = slots21(h), g = goneOf(h), gs = {};
    g.forEach(function (x) { gs[x] = 1; });
    var sel = (h.sel && h.selAt != null && !gs[h.selAt] && sl[h.selAt] === h.sel) ? h.selAt : -1;
    setTiles($('rest'), sl, function (i) { return gs[i] ? 'gone' : i === sel ? 'is-up' : ''; });
    var canCut = h.phase === 'play' && h.turn === HUMAN && !h.offer && !busy;
    $('rest').classList.toggle('pick', canCut);
    var ck = E.myCheck(S, HUMAN), isF = !!h.furiten[HUMAN];
    $('meRow').dataset.text = ck.text; $('playWaits').dataset.text = ck.text;
    var chips = ck.kind === 'waits' ? chipsHTML(ck, isF) : stHTML(ck);
    setHTML($('meRow'), scoreHTML(HUMAN) + chips);
    setHTML($('playWaits'), '<span class="tag">あなたの 待ち' + (h.furiten[HUMAN] ? '・<b>フリテン</b>' : '') + '</span>' + chips);
    var offer = h.phase === 'play' && h.offer && h.offer.p === HUMAN;
    $('ronCover').classList.toggle('hidden', !offer);
    if (offer) {
      $('ronSub').textContent = tileName(h.offer.tile) + 'で 和了る';
      setHTML($('restTag'), 'あいてが ' + tileName(h.offer.tile) + 'を 切った');   // ★T334：setHTML に そろえた（★textContent だと 次の 局で 同じ 字の とき 書き直されない）
    } else {
      var left = C.RULES.turns - h.cnt[HUMAN];
      setHTML($('restTag'), tagHTML('切れる 牌 ― <span class="yoko-only"><b>' + roundNo() + '</b>巡目・</span>あと <b>' + left + '</b>回（おして、もう1回で 切る）', '切れる 牌 ― あと <b>' + left + '</b>回'));
    }
  }
  function pickList() { var h = S.h; return h.pick.map(function (i) { return h.hands[HUMAN][i]; }); }
  /* ★ 巡目。★T334：★ロンの 出番の 間と ロンで 終わった あとは ★いま 出た 牌の 打目（★discard() は 出番で h.turn を 進めずに 返る ので、
       ★前は 親の 番と みて 1つ 多く 数えて いた ―― トライ T333 ③）*/
  function roundNo() {
    var h = S.h, d = h.lab.dealer, c = 1 - d;
    if (h.offer) return h.offer.no;
    if (h.out && h.out.type === 'ron') return h.out.no;
    var n = h.turn === d ? h.cnt[d] + 1 : h.cnt[c] + 1;
    return Math.max(1, Math.min(C.RULES.turns, n));
  }
  function render() {
    if (!S) { layout(); return; }
    if (sceneOf() === 'make') { renderMake(); clearTiles($('rest')); } else { renderPlay(); clearTiles($('pool')); clearTiles($('wall')); }
    layout();
  }

  /* ============================================================
     ★ 試合の 流れ
     ============================================================ */
  function randomSeed() {
    try { var a = new Uint32Array(1); root.crypto.getRandomValues(a); return a[0]; } catch (e) { return (Math.random() * 4294967296) >>> 0; }
  }
  function cancelAll() {
    gen++;
    timers.forEach(clearTimeout); timers = [];
    clearTimeout(builderTimer); builder = null;
    busy = false; flipAt = -1; special = null;
    $('happyCat').classList.remove('is-jump');
    hideResult();
  }
  function showTitle() {
    cancelAll();
    S = null;
    say(line('title'));
    layout();
  }
  function startMatch(len, mseed, firstDealer) {
    cancelAll();
    var ms = mseed == null ? randomSeed() : mseed >>> 0;
    var fd = firstDealer == null ? (mix(ms, 5) & 1) : (firstDealer ? 1 : 0);   // ★起家は ランダム（★種から）
    S = E.newMatch(len, ms, fd);
    save();
    enterHand();
  }
  function enterHand() {
    var h = S.h;
    if (h.phase === 'dora') {
      if (E.dealerOf(S) === CPU) {
        E.setDora(S, E.cpuDoraAt(h)); save();
        say(line('cpuOya'));
        enterBuild(true);
        later(function () { if (S && S.h.phase === 'build' && !S.h.pick.length) say(line('build')); }, 1800);
        return;
      }
      say(line('youOya'));
      render();
      return;
    }
    if (h.phase === 'build') { enterBuild(false); return; }
    if (h.phase === 'play') { enterPlay(true); return; }
    render(); showHandResult();
  }
  function enterBuild(keepSay) {
    if (!keepSay) say(S.h.h13[HUMAN] ? line('wait') : line('build'));
    render();
    startCpuBuild();
  }
  /* ★★ CPU の 13枚（★人が 組んで いる 間に 裏で ―― ★TUNE.SLICE_MS ずつ 区切って 画面を 止めない）★★
     ★ 組むのは ★CPU の 34枚 だけ（★人の 34枚には 1回も 使わない ―― builtFor を 見張り ④ が 数える）。 */
  function startCpuBuild() {
    var h = S.h;
    if (h.h13[CPU] || builder) return;
    builder = E.cpuBuilder(S, CPU, TUNE.CPU_LEVEL);
    builtFor.push(builder.who); usedLevels.push(builder.level);
    var my = gen, b = builder;
    (function tick() {
      if (my !== gen || builder !== b) return;
      var t0 = performance.now(), done = b.step(TUNE.SLICE_MS);
      maxSlice = Math.max(maxSlice, performance.now() - t0);
      if (!done) { builderTimer = setTimeout(tick, 0); return; }
      builder = null;
      E.decide(S, CPU, b.result.hand);
      save();
      if (S.h.phase === 'play') enterPlay(false);
    })();
  }
  function onDecide() {
    var h = S.h;
    if (!h || h.phase !== 'build' || h.h13[HUMAN] || h.pick.length !== 13 || busy) return;
    E.decide(S, HUMAN, pickList());
    h.pick = [];
    save();
    if (h.phase === 'play') { enterPlay(false); return; }
    say(line('wait'));
    render();
  }
  function enterPlay(resumed) {
    var h = S.h;
    if (!h.gone || h.gone.length !== h.river[HUMAN].length) { h.gone = goneOf(h).slice(); save(); }
    render();
    if (!resumed && h.cnt[0] === 0 && h.cnt[1] === 0) {
      /* ★ 守りの 局：◎ も △ も 1つも ない 手で 決めた とき だけ（★文は 13枚 だけで 決まる ―― 山とは 関係ない）*/
      var ck = E.checkLine(h.h13[HUMAN], E.ctxOf(S, HUMAN));
      var any = ck.waits.some(function (w) { return w.mark !== '×'; });
      if (!any) { special = 'defend'; say(line('defend')); }
    }
    loop();
  }
  function sayTurn() {
    if (special) { say(line(special)); special = null; return; }
    var h = S.h;
    say(h.sel && h.selAt != null ? line('myTurnPick', tileName(h.sel)) : line('myTurn'));
  }
  function loop() {
    if (!S || S.h.phase !== 'play') return;
    var h = S.h;
    if (h.offer) {
      if (h.offer.p === HUMAN) { say(line('ronChance', tileName(h.offer.tile))); render(); showRon(); return; }
      busy = true; render();
      later(cpuRon, TUNE.CPU_RON);
      return;
    }
    if (h.turn === CPU) {
      busy = true; render();
      if (!special) say(line('cpuTurn'));
      later(cpuMove, TUNE.CPU_WAIT);
      return;
    }
    busy = false; render();
    sayTurn();
  }
  function cpuMove() {
    var h = S.h;
    if (h.phase !== 'play' || h.turn !== CPU || h.offer) { busy = false; return; }
    var wasF = h.furiten[HUMAN];
    var code = E.cpuDiscard(E.cpuView(S, CPU), TUNE.CPU_LEVEL);
    usedLevels.push('d:' + TUNE.CPU_LEVEL);
    var res = E.discard(S, CPU, code);
    busy = false; save();
    if (res.ron === HUMAN) { render(); say(line('ronChance', tileName(code))); showRon(); return; }   // ★押すまで 待つ
    if (!wasF && h.furiten[HUMAN]) special = 'passLow';
    if (h.phase === 'end') { render(); showHandResult(); return; }
    loop();
  }
  /* ★ 幅 320 の たて（上下に 動かす 画面）：ロンの ボタンが 画面の 外なら 見える ところまで 動かす */
  function showRon() {
    if (!scrollOn()) return;
    var r = $('btnRon').getBoundingClientRect();
    if (r.top < 0 || r.bottom > window.innerHeight) $('restCard').scrollIntoView({ block: 'end' });
  }
  function cpuRon() {
    busy = false;
    if (!S || !S.h.offer || S.h.offer.p !== CPU) return;
    E.ron(S, CPU); save();
    render(); showHandResult();
  }
  function humanDiscard(code, slot) {
    var h = S.h, wasF = h.furiten[HUMAN];
    h.gone = goneOf(h).concat([slot]); h.selAt = null;
    var res = E.discard(S, HUMAN, code);
    save();
    if (res.ron === CPU) { busy = true; render(); later(cpuRon, TUNE.CPU_RON); return; }
    if (!wasF && h.furiten[HUMAN]) special = 'selfFuriten';
    if (h.phase === 'end') { render(); showHandResult(); return; }
    loop();
  }
  function onRon() {
    var h = S && S.h;
    if (!h || h.phase !== 'play' || !h.offer || h.offer.p !== HUMAN) return;
    E.ron(S, HUMAN); save();
    render(); showHandResult();
  }

  /* ── 牌を おす（★Pointer Events。★おした 牌と はなした 牌が 同じ ときだけ）── */
  var downTl = null;
  function tlAt(e) { var t = document.elementFromPoint(e.clientX, e.clientY); return t && t.closest ? t.closest('.tl') : null; }
  function onTilesDown(e) {
    if (performance.now() < guardUntil) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    downTl = e.target.closest ? e.target.closest('.tl') : null;
  }
  function onTilesUp(e) {
    var t = tlAt(e), d = downTl; downTl = null;
    if (!t || t !== d || !S) return;
    var i = +t.dataset.i, box2 = t.parentElement.id;
    if (box2 === 'wall') onWall(i);
    else if (box2 === 'pool') onPool(i);
    else if (box2 === 'rest') onRest(i);
  }
  function onWall(i) {
    var h = S.h;
    if (h.phase !== 'dora' || E.dealerOf(S) !== HUMAN || flipAt >= 0) return;
    E.setDora(S, i); save();
    flipAt = i;                              // ★めくった 牌を 少し 見せる あいだ だけ（★しまった 中身は build）
    render();
    later(function () { flipAt = -1; enterBuild(false); }, 650);
  }
  function onPool(i) {
    var h = S.h;
    if (h.phase !== 'build' || h.h13[HUMAN]) return;
    var k = h.pick.indexOf(i);
    if (k >= 0) h.pick.splice(k, 1);
    else if (h.pick.length >= 13) { say(line('tooMany')); return; }
    else h.pick.push(i);
    h.pick.sort(function (a, b) { return a - b; });
    say(line('build'));
    save(); render();
  }
  /* ★ 切る：★1回目で 上がる（＋ハッピー「◯◯？ もう1回…」）→ ★同じ 牌を もう1回で 切る（★2段タップ・ルル §8）*/
  function onRest(i) {
    var h = S.h;
    if (h.phase !== 'play' || h.turn !== HUMAN || h.offer || busy) return;
    var sl = slots21(h), g = goneOf(h);
    if (!sl[i] || g.indexOf(i) >= 0) return;
    var code = sl[i];
    if (h.selAt === i && h.sel === code) { humanDiscard(code, i); return; }
    h.sel = code; h.selAt = i; save();
    render(); say(line('myTurnPick', tileName(code)));
  }

  /* ============================================================
     ★ 局の おわり／試合の おわり の 箱
     ============================================================ */
  function handRow(codes, win) {
    var s = '<div class="rs-hand">';
    for (var i = 0; i < codes.length; i++) s += '<span class="rs-t">' + MJ.tile(codes[i], 64) + '</span>';
    if (win) s += '<span class="rs-t rs-win">' + MJ.tile(win, 64) + '</span>';
    return s + '</div>';
  }
  function ptsRow(before, after) {
    function one(nm, p) {
      var d = after[p] - before[p];
      return '<span>' + nm + ' <b>' + fmt(after[p]) + '</b>' + (d ? ' <small class="' + (d < 0 ? 'dn' : '') + '">(' + sgn(d) + ')</small>' : '') + '</span>';
    }
    return '<div class="rs-pts">' + one('あなた', HUMAN) + one('あいて', CPU) + '</div>';
  }
  /* ★★T338（社長）：★局の 結果に ★お互いの 待ち（★待ち牌を 並べる・聴牌で なければ「ノーテン」）★★
       ★◎△× は 付けない（★局が 終わった あとは 一発・河底の 見込みが もう 無い ―― 牌だけの 方が 見やすい）*/
  function waitRow(p) {
    var w = C.waits(S.h.h13[p]);
    return '<span class="rs-w" data-wait-of="' + p + '">' + (w.length ? '待ち' + w.map(function (x) { return '<span class="rs-wt">' + MJ.tile(x, 64) + '</span>'; }).join('') : 'ノーテン') + '</span>';
  }
  function showHandResult() {
    var h = S.h, o = h.out, a = '', b = '', title, cls = '';
    if (!o) return;
    resultKind = 'hand';
    if (o.type === 'ron') {
      var r = o.result, me = o.winner === HUMAN;
      title = me ? 'ロン！' : 'あいての ロン';
      cls = me ? '' : 'is-lose';
      a += '<p class="rs-label">' + (me ? 'あなたの 手' : 'あいての 手') + waitRow(o.winner) + '</p>' + handRow(h.h13[o.winner], o.tile);
      a += '<p class="rs-label">' + (me ? 'あいての 手' : 'あなたの 手') + waitRow(1 - o.winner) + '</p>';
      a += '<div class="rs-dora"><span>ドラ表示 ' + MJ.tile(h.dora, 64) + '</span><span>裏ドラ表示 ' + MJ.tile(h.ura, 64) + '</span></div>';
      b += '<ul class="rs-yaku">' + r.yaku.map(function (y) {
        var hv = y.yakuman ? (y.yakuman === 2 ? 'ダブル役満' : '役満') : y.han + '飜';
        return '<li><span>' + y.name + '</span><i>' + hv + '</i></li>';
      }).join('') + '</ul>';
      b += '<p class="rs-rank">' + rankLine(r) + '</p>';
      var pay = o.pay;
      b += '<p class="rs-pay">' + fmt(pay.base) + '点' + (pay.honba ? '　＋ ' + fmt(pay.honba) + '点（' + o.honba + '本場）' : '') + (pay.kyotaku ? '　＋ 供託 ' + fmt(pay.kyotaku) + '点' : '') + '</p>';
      say(line(me ? 'youRon' : 'cpuRon'));
      if (me) $('happyCat').classList.add('is-jump');
    } else {
      title = '流局';
      cls = 'is-draw';
      a += '<p class="rs-label">あなたの 手' + waitRow(HUMAN) + '</p>' + handRow(h.h13[HUMAN]);
      a += '<p class="rs-label">あいての 手' + waitRow(CPU) + '</p>' + handRow(h.h13[CPU]);
      if (S.match.over) {
        /* ★T332：最後の 局の 流局 ―― ★そこで 終わり（★供託は 点の 多い 方へ・同点は 半分ずつ）*/
        b += '<p class="rs-pay">だれも ロンできなかった。<br>最後の 局なので ここで 終わり。' + (o.kyotaku ? '<br>供託 ' + fmt(o.kyotaku) + '点は 点の 多い 方へ（同点なら 半分ずつ）。' : '') + '</p>';
        say(line('lastDraw'));
      } else {
        b += '<p class="rs-pay">だれも ロンできなかった。<br>親が 続く。供託 ' + fmt(S.match.kyotaku) + '点は つぎの 局へ。</p>';
        say(line('draw'));
      }
    }
    b += ptsRow(o.before, o.after);
    openResult(title, cls, '<div class="rs-a">' + a + '</div><div class="rs-b">' + b + '</div>', S.match.over ? '結果を 見る' : 'つぎの 局へ', false);
  }
  function showFinal() {
    var m = S.match, title, cls = '', a = '', b = '';
    resultKind = 'final';
    if (m.winner === HUMAN) { title = 'あなたの 勝ち！'; say(line('winMatch')); $('happyCat').classList.add('is-jump'); }
    else if (m.winner === CPU) { title = 'あいての 勝ち'; cls = 'is-lose'; say(line('loseMatch')); }
    else { title = '引き分け'; cls = 'is-draw'; say(line('tieMatch')); }
    var why = { tobi: 'トビで 終わり', agariyame: 'オーラスの 親が トップで 終わり', last: 'ぜんぶの 局が 終わり', lastdraw: '最後の 局が 流局で 終わり' }[m.endReason] || '';
    a += '<p class="rs-pay">' + (S.len === 'tonpu' ? '東風戦' : '半荘戦') + '　' + why + '</p>';
    if (m.winner == null) a += '<p class="rs-tie">同点で 引き分け</p>';
    a += '<div class="rs-pts"><span>あなた <b>' + fmt(m.points[HUMAN]) + '</b></span><span>あいて <b>' + fmt(m.points[CPU]) + '</b></span></div>';
    b += '<ul class="rs-log">' + m.history.map(function (rec) {
      var what = rec.type === 'draw' ? '流局' : (rec.winner === HUMAN ? 'あなたの ロン ' : 'あいての ロン ') + rankName(rec.rank);
      return '<li>' + KYOKU_NAME[rec.kyoku] + ' ' + rec.honba + '本場　' + what + '</li>';
    }).join('') + '</ul>';
    openResult(title, cls, '<div class="rs-a">' + a + '</div><div class="rs-b">' + b + '</div>', 'もう1回', true);
  }
  function openResult(title, cls, body, next, fin) {
    var t = $('resultTitle');
    t.textContent = title;
    t.className = 'result-title' + (cls ? ' ' + cls : '');
    $('resultBody').innerHTML = body;
    $('btnNext').innerHTML = next + ' <b>▶</b>';
    $('btnToTitle').classList.toggle('hidden', !fin);
    $('btnQuit').classList.toggle('hidden', !fin);
    lockResult();
    $('resultWrap').classList.remove('hidden');
    fitResult();
  }
  function hideResult() { $('resultWrap').classList.add('hidden'); unlockResult(); resultKind = null; }
  /* ★ 箱が 画面の たけに 入らない とき（★出して みて 詰める ―― たての 線は 引かない）
     ① is-tight … 字と すき間を 小さく・ボタンを よこ 1列に
     ② is-cols  … ★画面が よこに 広い ときだけ：手（左）と 役・点（右）の 2列
     ③ is-tighter … 役の 名前を 2列に */
  function fitResult() {
    var bx = $('resultBox');
    bx.classList.remove('is-tight', 'is-cols', 'is-tighter');
    if ($('resultWrap').classList.contains('hidden')) return;
    function over() { return bx.scrollHeight > bx.clientHeight + 0.5; }
    function rtFor(cols) { var inn = (cols ? bx.clientWidth / 2 - 24 : bx.clientWidth - 36); return Math.max(13, Math.min(26, Math.floor((inn - 8 - 13 * 2) / 14))); }
    bx.style.setProperty('--rt', rtFor(false) + 'px');
    if (over()) bx.classList.add('is-tight');
    if (over() && window.innerWidth > window.innerHeight * 1.3) { bx.classList.add('is-cols'); bx.style.setProperty('--rt', rtFor(true) + 'px'); }
    if (over()) bx.classList.add('is-tighter');
    if (over()) bx.style.setProperty('--rt', Math.max(12, parseFloat(bx.style.getPropertyValue('--rt')) - 5) + 'px');
  }
  var locked = false, lockTimer = 0, lockAt = 0;
  function armUnlock(ms) { clearTimeout(lockTimer); lockTimer = setTimeout(unlockResult, ms); }
  function lockResult() {
    locked = true; lockAt = performance.now();
    $('resultBox').classList.add('is-locked');
    $('btnNext').disabled = true; $('btnToTitle').disabled = true;
    $('btnQuit').setAttribute('aria-disabled', 'true'); $('btnQuit').setAttribute('tabindex', '-1');
    armUnlock(TUNE.RESULT_LOCK);
  }
  function bumpLock() {
    if (!locked) return;
    var left = TUNE.RESULT_LOCK - (performance.now() - lockAt);
    armUnlock(Math.max(TUNE.RESULT_QUIET, left));
  }
  function unlockResult() {
    clearTimeout(lockTimer); locked = false;
    $('resultBox').classList.remove('is-locked');
    $('btnNext').disabled = false; $('btnToTitle').disabled = false;
    $('btnQuit').removeAttribute('aria-disabled'); $('btnQuit').removeAttribute('tabindex');
  }
  function onNext() {
    if (locked) return;
    armGuard();
    var kind = resultKind;
    hideResult();
    $('happyCat').classList.remove('is-jump');
    if (kind === 'hand') {
      if (S.match.over) { showFinal(); return; }
      E.nextHand(S); save();
      enterHand();
    } else if (kind === 'final') {
      startMatch(S.len);
    }
  }

  /* ★★ 箱を 閉じた 直後の 2つめの 指（★T316）★★ */
  function armGuard() { guardUntil = performance.now() + TUNE.AFTER_BOX; }
  function guardEv(e) {
    if (performance.now() >= guardUntil) return;
    var t = e.target;
    if (t && t.closest && t.closest('#app')) { e.preventDefault(); e.stopPropagation(); }
  }

  function openHelp(secId) {
    var d = $('helpDialog');
    if (typeof d.showModal === 'function') { if (!d.open) d.showModal(); } else d.setAttribute('open', '');
    d.scrollTop = 0;
    if (secId) { var s = $(secId); if (s) d.scrollTop = Math.max(0, s.offsetTop - 12); }
  }
  function setLen(len) {
    lenSel = len;
    [['btnTonpu', 'tonpu'], ['btnHanchan', 'hanchan']].forEach(function (x) {
      var b = $(x[0]), on = x[1] === len;
      b.classList.toggle('is-on', on); b.setAttribute('aria-checked', on ? 'true' : 'false');
    });
  }

  /* ── つなぐ ─────────────────────────────────── */
  function boot() {
    if (MJ) MJ.install(document);                 // ★34種類＋裏 を <symbol> で 1回 置く（★アトの 部品）
    window.addEventListener('pointerdown', guardEv, true);
    window.addEventListener('click', guardEv, true);
    ['wall', 'pool', 'rest'].forEach(function (id) {
      var el = $(id);
      el.addEventListener('pointerdown', onTilesDown);
      el.addEventListener('pointerup', onTilesUp);
      el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    });
    $('btnTonpu').addEventListener('click', function () { setLen('tonpu'); });
    $('btnHanchan').addEventListener('click', function () { setLen('hanchan'); });
    $('btnStart').addEventListener('click', function () { startMatch(lenSel); });
    $('btnRules').addEventListener('click', function () { openHelp('helpRules'); });
    $('btnYaku').addEventListener('click', function () { openHelp('helpYaku'); });
    $('btnHowto').addEventListener('click', function () { openHelp(null); });
    $('btnHowtoTop').addEventListener('click', function () { openHelp(null); });
    /* ★★ ↻ やめる ―― ★聞かずに はじめの 画面へ（★追記⑩ ②）★★ */
    $('btnQuitGame').addEventListener('click', function () { clearSave(); showTitle(); });
    $('btnDecide').addEventListener('click', onDecide);
    $('btnRon').addEventListener('click', onRon);
    $('btnNext').addEventListener('click', onNext);
    $('btnToTitle').addEventListener('click', function () { if (locked) return; armGuard(); clearSave(); showTitle(); });
    $('resultWrap').addEventListener('pointerdown', bumpLock, true);
    var closers = document.querySelectorAll('[data-close]');
    for (var i = 0; i < closers.length; i++) closers[i].addEventListener('click', function () { $(this.dataset.close).close(); armGuard(); });
    $('helpDialog').addEventListener('cancel', armGuard);
    window.addEventListener('error', function (e) { pageErrors.push(String(e.message || e.type)); });
    window.addEventListener('resize', layout);
    window.addEventListener('orientationchange', function () { setTimeout(layout, 120); });
    var saved = loadSave();
    if (saved) { S = saved; enterHand(); }                  // ★読み直し：同じ 局・同じ 34枚から つづき
    else showTitle();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* ============================================================
     ★★ 見張り（window.JUNANAHO.verify）★★
     ------------------------------------------------------------
     ★ 画面には 1つも 出さない。★いま 開いて いる 画面・場面で 数える（★13画面で 回すのは 外の 道具 t332_03）。
     ★ 見るもの（★鳴いたら 番号から 始まる 1行）：
       ① 決まり     … MJCore が ある・35,000点・★満貫の 線（5飜／4飜30符／3飜60符・七対子 4飜は 届かない ―― T362）・一発／河底の はんい・親 1.5倍・ドラが 回る・★ダブル役満
       ② 試合       … CPU どうしで n 試合（★本物の ENGINE の 手で）：止まらない・ロンは 満貫 以上・フリテン中の ロン 0・点の 合計 一定
                      ★T332：最後の 局の 流局で 終わる・最後で ない 局の 流局では 終わらない・同点＝引き分け（決まった 場面 F・F2・G も）
       ③ CPU の 目   … 人の 13枚・34枚を 入れかえても CPU に 見せる もの・切る 牌が 1文字も 変わらない（T-14）
       ④ ばらさない … 山を 数えない（★組む 計算は CPU の 34枚 だけ）・確かめ表示の 文は 13枚と 場の 決まり だけで 決まる（T-1）・
                      強調は 1種類（上がる 牌の 数）・ヒントの しるし 0・:hover 0・★ロンの ボタンは ◎／条件つき △ だけ
       ⑤ ハッピー   … 絵・しっぽ・まばたき・名前・ふきだし・★どの ことばも 切れない・折れすぎない
       ⑥ 指の 的    … ★牌 以外の ボタン ぜんぶ 44×44（★1pxずつ つついて 数える・社長の 決め①）
       ⑦ はみ出し   … よこに すべらない・帯が sticky・親に overflow 無し・★板どうしが 重ならない・板の 中身が あふれない・
                      ★牌が 板と 画面の 中・名札が 切れない／ほかの 板に かぶらない・牌の ひりつ
       ⑧ 家へ 帰る道 … 試合の おわりの 箱に「◀ ゲームを選ぶ」（../）・「やめる」の 字は 帯の 1か所 だけ
       ⑩ 題         … h1 1つ・帯と 同じ 字・canonical＝og:url
       ⑪ 外への 通信 … performance の 記録に よその 住所 0
       ⑫ 牌の 絵    … アトの 部品・symbol 35・★並んだ 牌が いまの 中身と 同じ（34枚・13枚・切れる 21枚と 切った 場所・河）
       ⑬ 点         … 持ち点＋供託＝70,000・帯の 数字が 中身と 同じ
       ⑭ しまう     … sessionStorage の 中身が いまの 試合と 同じ・しまって 読むと 元どおり（T-26）
       ⑮ 2連打の 止め … 箱を 閉じた 直後の 指が 帯の ボタンに 届かない
       ⑯ ことば     … 中学の 漢字の まちがいやすい 字 0（★麻雀の ことば「巡目」だけ 通す ―― 追記⑭）・★使わない 書き文字 0（★表は \u の 形）
       ⑰ 箱         … 局の おわりの 箱の 中身が 切れない・★試合の おわり：同点なら「引き分け」・勝ち負けの 字が 点と 合う
       ⑱ 上下に 動く … ★幅 320 の たての 17巡 だけ 上下に 動かせる（★ほかは 1画面）・動かせる ときは 下まで 届く（社長の 決め②）
       ⑲ 字の 床    … 見えて いる 字は ぜんぶ 11px 以上（★ハッピーの 名札も ―― アトの 気づき）
     ============================================================ */
  function vis(el) {
    if (!el) return false;
    var r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    for (var e = el; e && e.nodeType === 1; e = e.parentElement) {
      var cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false;
    }
    return true;
  }
  function lineCount(el) {
    var rg = document.createRange(); rg.selectNodeContents(el);
    var rs = rg.getClientRects(), tops = {}, cnt = 0;
    for (var i = 0; i < rs.length; i++) {
      if (rs[i].width <= 0 && rs[i].height <= 0) continue;
      var k = Math.round(rs[i].top / 3);
      if (!tops[k]) { tops[k] = 1; cnt++; }
    }
    return cnt;
  }
  function hakoNoSoto(el, atatta) {
    var ds = document.querySelectorAll('dialog[open]'), i;
    for (i = 0; i < ds.length; i++) {
      var modal = true; try { modal = ds[i].matches(':modal'); } catch (e) {}
      if (!modal) continue;
      if (el && ds[i].contains(el)) return false;
      if (atatta && (atatta === ds[i] || ds[i].contains(atatta))) return true;
    }
    return false;
  }
  function matoOf(el) {
    var r = el.getBoundingClientRect(), cx = Math.round(r.left + r.width / 2), cy = Math.round(r.top + r.height / 2);
    function hit(x, y) { var e = document.elementFromPoint(x, y); return !!(e && (e === el || el.contains(e))); }
    if (cy < 0 || cy >= window.innerHeight || cx < 0 || cx >= window.innerWidth) return { off: true };   // ★上下に 動かす 画面で いま 見えて いない
    var at = document.elementFromPoint(cx, cy);
    if (hakoNoSoto(el, at)) return { skip: true };
    var rw = $('resultWrap');
    if (!rw.classList.contains('hidden') && !rw.contains(el) && at && rw.contains(at)) return { skip: true };
    if (!hit(cx, cy)) return { w: 0, h: 0, why: 'まん中が 押せない' };
    var up = 0, dn = 0, lf = 0, rt = 0, i;
    for (i = 1; i <= 80; i++) { if (hit(cx, cy - i)) up = i; else break; }
    for (i = 1; i <= 80; i++) { if (hit(cx, cy + i)) dn = i; else break; }
    for (i = 1; i <= 240; i++) { if (hit(cx - i, cy)) lf = i; else break; }
    for (i = 1; i <= 240; i++) { if (hit(cx + i, cy)) rt = i; else break; }
    return { w: lf + rt + 1, h: up + dn + 1 };
  }
  function codesOf(el) { var out = []; for (var i = 0; i < el.children.length; i++) { var u = el.children[i].querySelector('use'); out.push(u ? u.getAttribute('href').replace('#mj-', '') : '_'); } return out; }
  function over(a, b) { return Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0.5 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0.5; }
  /* ★ 場面の 板（★display:contents と よこの 柱・.wd は ほどいて 中身を 1枚ずつ）*/
  function partsOf(scene) {
    var out = [];
    (function flat(el) {
      for (var i = 0; i < el.children.length; i++) {
        var k = el.children[i];
        if (k.classList.contains('bg-deco')) continue;
        var ds = getComputedStyle(k).display;
        if (ds === 'none') continue;
        if (ds === 'contents' || k.classList.contains('side') || k.classList.contains('wd')) flat(k);   // ★display:contents は 箱が 0 ―― vis() より 先に ほどく
        else if (vis(k)) out.push(k);
      }
    })(scene);
    return out;
  }
  var TITLE_NAME = '麻雀17歩', TITLE_FULL = '麻雀17歩 ― ブラウザですぐ遊べる｜ブラゲ工房';   // ★T335
  var BANNED = '押揃枠詰繋盤賭嵌棄択匹粒濃淡隣繰謎挑壁巡互';
  var MJ_WORDS = ['巡目'];                         // ★麻雀の ことば（★追記⑭：ふだんの 書き方）―― ★この 言葉の 中の 字だけ 通す
  var MANGA = ['\u3056\u308f', '\u30b6\u30ef'];   // ★使わない 書き文字（★T337：この ファイルに その 字を そのまま 書かない ため \u の 形）

  function verify(n) {
    n = n == null ? 1 : n;
    var ng = [], note = {}, t0 = Date.now();
    function put(no, arr, info) { for (var i = 0; i < arr.length; i++) ng.push(no + ' ' + arr[i]); note[no] = arr.length ? ('NG ' + arr.length) : ('OK' + (info ? '（' + info + '）' : '')); }
    var h = S && S.h, sc = sceneOf(), inMatch = sc !== 'title', W = window.innerWidth, H = window.innerHeight;
    var de = document.documentElement, scroll = de.classList.contains('is-scroll'), sy = window.scrollY || de.scrollTop || 0;
    var docH = Math.max(de.scrollHeight, H);

    /* ① 決まり */
    var b1 = [];
    if (!C || !C.judge) b1.push('MJCore が 無い');
    else {
      if (C.RULES.startPoints !== 35000) b1.push('持ち点が ' + C.RULES.startPoints);
      if (C.RULES.manganHan !== 5 || C.RULES.kiriage4 !== 30 || C.RULES.kiriage3 !== 60) b1.push('満貫の 線が ' + C.RULES.manganHan + '飜・' + C.RULES.kiriage4 + '符・' + C.RULES.kiriage3 + '符');
      if (C.RULES.turns !== 17) b1.push('切る 回数が ' + C.RULES.turns);
      var rb = [C.ronBonus(true, 1).ippatsu, C.ronBonus(true, 2).ippatsu, C.ronBonus(true, 17).houtei, C.ronBonus(false, 2).ippatsu, C.ronBonus(false, 3).ippatsu, C.ronBonus(false, 17).houtei];
      if (rb.join() !== 'true,false,true,true,false,false') b1.push('一発・河底の はんいが ' + rb.join());
      if (C.basePay(true, C.rankOf(4, 0, 30)) !== 12000 || C.basePay(false, C.rankOf(6, 0, 25)) !== 12000) b1.push('親 1.5倍・跳満 の 点');
      if (C.rankOf(3, 0, 50) !== null || C.rankOf(4, 0, 25) !== null) b1.push('3飜50符か 4飜25符で 満貫に なった');
      if (!C.rankOf(3, 0, 60) || !C.isKiriage(3, 60) || !C.isKiriage(4, 30) || C.isKiriage(4, 40)) b1.push('切り上げ満貫が ちがう');
      var j1 = C.judge('22m44m66m33p55p77s8s', '8s', { dealer: false, roundWind: '1z' });
      if (!j1 || j1.mangan || j1.fu !== 25) b1.push('七対子 4飜が 満貫に なった（' + (j1 && j1.fu) + '符）');
      var j2 = C.judge('19m19p19s1234567z', '1m', { dealer: false, roundWind: '1z' }), j3 = C.judge('222m555m444p666s8s', '8s', { dealer: false, roundWind: '1z' });
      if (!j2 || j2.yakuman !== 2 || !j3 || j3.yakuman !== 2) b1.push('国士十三面・四暗刻単騎が ダブル役満で ない');
      if (C.doraFromIndicator('9m') !== '1m' || C.doraFromIndicator('4z') !== '1z' || C.doraFromIndicator('7z') !== '5z') b1.push('ドラが 回らない');
      var w1 = C.waits('23m234p234s567s99p').join();
      if (w1 !== '1m,4m') b1.push('待ちが ' + w1);
    }
    put('①', b1);

    /* ② 試合（CPU どうし・本物の ENGINE）*/
    var b2 = [], sum2 = { 局: 0, ロン: 0, 流局: 0 };
    for (var i2 = 0; i2 < n; i2++) {
      var r2;
      try { r2 = E.simMatch(i2 % 2 ? 'hanchan' : 'tonpu', 4242 + i2, i2 % 2); }
      catch (e2) { b2.push('試合' + i2 + '：★止まった（' + e2.message + '）'); continue; }
      r2.bad.forEach(function (x) { b2.push('試合' + i2 + '：' + x); });
      sum2.局 += r2.hands; sum2.ロン += r2.rons; sum2.流局 += r2.draws;
    }
    var st2 = [];
    try { st2 = E.selfTest(); } catch (e2) { st2 = ['★決まった 場面の 試しが 止まった（' + e2.message + '）']; }
    st2.forEach(function (x) { b2.push('場面' + x); });
    put('②', b2, '決まった 場面 12・' + n + '試合・局 ' + sum2.局 + '・ロン ' + sum2.ロン + '・流局 ' + sum2.流局);

    /* ③ CPU の 目（T-14）*/
    var b3 = [];
    try { (function () {
      var T = E.newMatch('tonpu', 777, 0);
      E.setDora(T, E.cpuDoraAt(T.h));
      var cb = E.cpuBuilder(T, CPU).run();
      E.decide(T, CPU, cb.hand);
      var hb = T.h.hands[HUMAN].slice(0, 13);
      E.decide(T, HUMAN, hb);
      E.discard(T, HUMAN, E.restList(T.h, HUMAN)[0]);
      if (T.h.phase !== 'play' || T.h.turn !== CPU) return;
      var v1 = JSON.stringify(E.cpuView(T, CPU)), d1 = E.cpuDiscard(E.cpuView(T, CPU));
      /* ★ 人の 13枚を 別の 13枚に ★人の 34枚の 残りも 入れかえる（★捨て牌は 同じ まま）*/
      var U = JSON.parse(JSON.stringify(T));
      U.h.h13[HUMAN] = T.h.hands[HUMAN].slice(20, 33);
      U.h.w[HUMAN] = C.waits(U.h.h13[HUMAN]);
      U.h.hands[HUMAN] = U.h.hands[HUMAN].slice().reverse();
      var v2 = JSON.stringify(E.cpuView(U, CPU)), d2 = E.cpuDiscard(E.cpuView(U, CPU));
      if (v1 !== v2) b3.push('★人の 手を 変えたら CPU に 見せる ものが 変わった');
      if (d1 !== d2) b3.push('★人の 手を 変えたら CPU の 切る 牌が 変わった（' + d1 + '→' + d2 + '）');
      var keys = Object.keys(E.cpuView(T, CPU)).join(',');
      if (keys !== 'p,dealer,pool,h13,waits,rest,myRiver,oppRiver,dora') b3.push('CPU に 見せる ものが 決まりと ちがう：' + keys);
      if (v1.indexOf(JSON.stringify(T.h.h13[HUMAN]).slice(1, -1)) >= 0) b3.push('★人の 13枚が そのまま CPU に 見えて いる');
    })(); } catch (e3) { b3.push('★CPU の 試しが 止まった（' + e3.message + '）'); }
    put('③', b3);

    /* ④ ばらさない・光らせない */
    var b4 = [];
    builtFor.forEach(function (w) { if (w !== CPU) b4.push('★人の 34枚で 組む 計算を した'); });
    var uiSrc = String(render) + String(renderMake) + String(renderPlay) + String(onPool) + String(onDecide) + String(enterPlay) + String(layout);
    if (/Builder|cpuBuilder|simMatch/.test(uiSrc)) b4.push('★画面の 側で 組む 計算を 呼んで いる');
    if (!/cpuBuilder\(S, CPU[,)]/.test(String(startCpuBuild)))   // ★T339：強さを 渡す 形（cpuBuilder(S, CPU, 強さ)）も 通す b4.push('★組む 計算が CPU の 34枚 では ない');
    var ckSrc = String(E.checkLine);
    if (E.checkLine.length !== 2 || /hands|rest|pool|Builder/.test(ckSrc)) b4.push('★確かめ表示が 13枚と 場の 決まり 以外を 見て いる');
    /* ★ 同じ 13枚なら どんな 山でも 同じ 文（★別の 試合・別の 山で 同じ 13枚を 数え直す）*/
    if (h && h.dora && flipAt < 0) {
      var list4 = h.phase === 'build' ? (h.h13[HUMAN] || pickList()) : h.h13[HUMAN];
      /* ★T334：★ロンの 出番の 間は いま 出た 打目（★その 1打で 付く もの）・★ほかは 相手の つぎの 打目から */
      var dl4 = E.dealerOf(S) === HUMAN, of4 = h.offer && h.offer.p === HUMAN;
      var ch4 = h.phase === 'build' ? null : { chances: of4 ? C.ronBonus(dl4, h.offer.no) : C.remainingChances(dl4, h.cnt[CPU] + 1) };
      var Z = JSON.parse(JSON.stringify(S)); Z.h.hands = [Z.h.hands[1], Z.h.hands[0]]; Z.h.rest = Z.h.rest.slice().reverse(); Z.h.rest[Z.h.doraAt] = h.dora;
      var tA = E.checkLine(list4, E.ctxOf(S, HUMAN, ch4)).text, tB = E.checkLine(list4, E.ctxOf(Z, HUMAN, ch4)).text;
      if (tA !== tB) b4.push('★山が ちがうと 確かめ表示の 文が 変わる');
      ['check', 'meRow', 'playWaits'].forEach(function (id) {
        var el = $(id);
        if ((h.phase === 'build' || h.phase === 'play') && vis(el) && (el.dataset.text || '') !== tA) b4.push(id + ' の 確かめ表示が 中身と ちがう（' + el.dataset.text + ' ／ ' + tA + '）');
      });
    }
    if (h && h.phase === 'build' && flipAt < 0) {
      var upB = document.querySelectorAll('#pool .is-up').length;
      if (upB !== h.pick.length) b4.push('上がった 牌が ' + upB + '枚（選んだ のは ' + h.pick.length + '枚）');
    }
    if (h && (h.phase === 'play' || h.phase === 'end') && document.querySelectorAll('#play .is-up').length > 1) b4.push('上がった 牌が ' + document.querySelectorAll('#play .is-up').length + '枚');
    if (document.querySelectorAll('.scene .is-hint,.scene .is-good,.scene .is-safe,.scene .is-match,.scene .is-wait').length) b4.push('ヒントの しるしが ある');
    try {
      for (var sI = 0; sI < document.styleSheets.length; sI++) {
        (function walk(list) {
          for (var q = 0; q < list.length; q++) {
            if (list[q].cssRules) walk(list[q].cssRules);
            var s4 = list[q].selectorText || '';
            if (/\.tl[^,{]*:(hover|focus)/.test(s4)) b4.push('牌に :hover の 決まり：' + s4);
          }
        })(document.styleSheets[sI].cssRules || []);
      }
    } catch (e) {
      if (location.protocol === 'file:') note['④ :hover'] = '★測れていません（file:// では CSS を 読めない）';
      else b4.push('CSS を 読めない：' + e.message);
    }
    /* ★ ロンの ボタン：出て いる ＝ 人の 番の 牌で 満貫（★◎ か 条件を 満たした △）・フリテン で ない */
    var ronOn = vis($('btnRon'));
    if (h && h.phase === 'play') {
      var want = !!(h.offer && h.offer.p === HUMAN);
      if (ronOn !== want) b4.push('ロンの ボタンが ' + (ronOn ? '出て いる' : '出て いない') + '（正は ' + want + '）');
      if (want) {
        var rr = E.ronResult(S, HUMAN, h.offer.tile, h.offer.no);
        if (!rr || !rr.mangan) b4.push('★満貫に とどかない 牌で ロンの ボタン');
        if (h.furiten[HUMAN]) b4.push('★フリテン なのに ロンの ボタン');
        /* ★T334：★ロンの 出番の 瞬間、★出た 牌の 札は ◎ か △（★× では ない）・△ なら その 1打で 付く 一発／河底（トライ T333 ②）*/
        var bo4 = C.ronBonus(E.dealerOf(S) === HUMAN, h.offer.no), want4 = null;
        C.waitMarks(h.h13[HUMAN], E.ctxOf(S, HUMAN, { chances: bo4 })).waits.forEach(function (w) { if (w.tile === h.offer.tile) want4 = w; });
        ['meRow', 'playWaits'].forEach(function (id) {
          var el = $(id); if (!vis(el)) return;
          var chip = null;
          el.querySelectorAll('.chip').forEach(function (cp) { if (cp.querySelector('use[href="#mj-' + h.offer.tile + '"]')) chip = cp; });
          if (!chip) { b4.push(id + '：★ロンの 牌の 札が 無い'); return; }
          var word = chip.querySelector('i').textContent;
          if (chip.classList.contains('c-no') || word === '×') b4.push(id + '：★ロンの 出番なのに 出た 牌の 札が ×');
          if (!want4 || want4.mark === '×') b4.push(id + '：★ロンの 出番なのに 数え直すと ×（' + (want4 && want4.mark) + '）');
          else if (want4.mark === '◎' && word !== '◎満貫') b4.push(id + '：★ロンの 牌の 札が「' + word + '」（正は ◎満貫）');
          else if (want4.mark === '△' && word !== '△' + (bo4.ippatsu ? '一発' : '河底')) b4.push(id + '：★ロンの 牌の 札が「' + word + '」（正は △' + (bo4.ippatsu ? '一発' : '河底') + '）');
        });
      }
    } else if (ronOn) b4.push('17巡の 外で ロンの ボタン');
    /* ★T335：★札の 色（class）が 札の 字と 合う（◎→c-ok・△→c-mid・×→c-no・フリテン→c-furi）
         ★（★T335 の とちゅうで コーダが 1行の コメントで ◎△× の 色分けを 消して しまい、★どの 見張りも 鳴らなかった ―― その 穴ふさぎ）*/
    ['check', 'meRow', 'playWaits'].forEach(function (id) {
      var el = $(id); if (!vis(el)) return;
      el.querySelectorAll('.chip').forEach(function (cp) {
        var w = (cp.querySelector('i') || {}).textContent || '', want = w === 'フリテン' ? 'c-furi' : w.charAt(0) === '◎' ? 'c-ok' : w.charAt(0) === '△' ? 'c-mid' : w === '×' ? 'c-no' : '?';
        if (!cp.classList.contains(want)) b4.push(id + '：★札「' + w + '」の 色が ちがう（' + cp.className + '）');
      });
    });
    /* ★T334：★フリテンの 間は 札が ぜんぶ 灰色の「フリテン」・★フリテンで ない 間は 1つも 出ない（トライ T333 ⑧）*/
    if (h && (h.phase === 'play' || h.phase === 'end') && h.h13[HUMAN]) {
      ['meRow', 'playWaits'].forEach(function (id) {
        var el = $(id); if (!vis(el)) return;
        var cs4 = el.querySelectorAll('.chip'), fN = el.querySelectorAll('.chip.c-furi').length;
        if (h.furiten[HUMAN]) {
          if (cs4.length && fN !== cs4.length) b4.push(id + '：★フリテン なのに ◎△× の 札が 出て いる');
          if (cs4.length && el.textContent.indexOf('フリテン') < 0) b4.push(id + '：★フリテン なのに「フリテン」の 字が 無い');
        } else if (fN) b4.push(id + '：★フリテンで ない のに「フリテン」の 札');
      });
    }
    put('④', b4, '組んだ 計算 ' + builtFor.length + '回（ぜんぶ CPU）');

    /* ⑤ ハッピー */
    var b5 = [], cat = $('happyCat'), bub = $('happyBubble'), row = $('logRow');
    if (!vis(cat)) b5.push('ハッピーの 絵が 見えない');
    else { var cr = cat.getBoundingClientRect(); if (cr.width < 26 || cr.height < 26) b5.push('ハッピーが 小さい ' + Math.round(cr.width) + '×' + Math.round(cr.height)); }
    if (!cat || !cat.querySelector('.cat-tail')) b5.push('しっぽが 無い');
    if (!cat || !cat.querySelector('.cat-eyes')) b5.push('まばたきの 目が 無い');
    if ((($('happyWrap').textContent || '') + (cat ? cat.getAttribute('aria-label') : '')).indexOf('ハッピー') < 0) b5.push('名前「ハッピー」が 無い');
    if (!vis(bub) || !bub.textContent.trim()) b5.push('ふきだしが 見えない／空');
    if (vis(row)) {
      var rr5 = row.getBoundingClientRect();
      if (rr5.bottom + sy > docH + 0.5 || rr5.right > W + 0.5 || rr5.left < -0.5) b5.push('ハッピーの 行が 画面から 出た');
      var keep = bub.textContent, worst = 0, worstK = '';
      var maxL = sc === 'title' ? ($('app').classList.contains('is-side') ? 7 : 2) : geo.mode === 'yoko' ? (geo.low ? 2 : 3) : 2;
      Object.keys(LINES).forEach(function (k5) {
        bub.textContent = line(k5);
        var nL = lineCount(bub), br5 = bub.getBoundingClientRect(), rw5 = row.getBoundingClientRect();
        if (nL > worst) { worst = nL; worstK = k5; }
        if (nL > maxL) b5.push('「' + k5 + '」が ' + nL + '行（' + maxL + '行 まで）');
        if (br5.bottom > rw5.bottom + 0.5 || br5.top < rw5.top - 0.5 || rw5.bottom + sy > docH + 0.5) b5.push('「' + k5 + '」が 切れる');
      });
      bub.textContent = keep;
      note['⑤ いちばん 長い ことば'] = worstK + ' ' + worst + '行';
    }
    put('⑤', b5);

    /* ⑥ 指の 的 44×44（★牌は 盤そのもの ―― 数えない・社長の 決め①）*/
    var b6 = [], seen6 = [], off6 = 0;
    ['btnBack', 'btnQuitGame', 'btnHowto', 'btnHowtoTop', 'btnTonpu', 'btnHanchan', 'btnStart', 'btnRules', 'btnYaku', 'btnDecide', 'btnRon', 'btnNext', 'btnToTitle', 'btnQuit'].forEach(function (id) {
      var e6 = $(id);
      if (!vis(e6)) return;
      var m = matoOf(e6);
      if (m.skip) return;
      if (m.off) { off6++; var rr6 = e6.getBoundingClientRect(); if (rr6.width < 44 || rr6.height < 44) b6.push(id + ' が ' + Math.round(rr6.width) + '×' + Math.round(rr6.height) + '（画面の 外で 箱だけ）'); return; }
      seen6.push(id);
      if (m.why) b6.push(id + ' ' + m.why);
      else if (m.w < 44 || m.h < 44) b6.push(id + ' が ' + m.w + '×' + m.h);
    });
    var hd = $('helpDialog');
    if (hd.open) ['.close-dialog', '.dialog-ok'].forEach(function (sq) {
      var e6 = hd.querySelector(sq);
      if (!vis(e6)) return;
      var rr6 = e6.getBoundingClientRect(), dr6 = hd.getBoundingClientRect();
      if (rr6.top < dr6.top - 0.5 || rr6.bottom > dr6.bottom + 0.5) return;
      var m = matoOf(e6); seen6.push(sq);
      if (m.why) b6.push(sq + ' ' + m.why); else if (m.w < 44 || m.h < 44) b6.push(sq + ' が ' + m.w + '×' + m.h);
    });
    put('⑥', b6, seen6.length + 'か所' + (off6 ? '・画面の 外 ' + off6 : ''));

    /* ⑦ はみ出し */
    var b7 = [], tb = $('topbar'), appEl = $('app');
    if (de.scrollWidth > W + 0.5) b7.push('よこに すべる（' + de.scrollWidth + '）');
    if (document.body.scrollWidth > W + 0.5) b7.push('中身が よこに はみ出した（' + document.body.scrollWidth + '）');
    if (appEl.scrollWidth > appEl.clientWidth + 0.5) b7.push('器の 中身が よこに はみ出した（' + appEl.scrollWidth + '＞' + appEl.clientWidth + '）');
    if (!scroll && appEl.scrollHeight > appEl.clientHeight + 0.5) b7.push('器の 中身が たてに はみ出した（' + appEl.scrollHeight + '＞' + appEl.clientHeight + '）');
    if (getComputedStyle(tb).position !== 'sticky') b7.push('帯が sticky で ない');
    for (var pe = tb.parentElement; pe && pe !== document.body; pe = pe.parentElement) {
      var cs7 = getComputedStyle(pe);
      if (cs7.overflowX !== 'visible' || cs7.overflowY !== 'visible') b7.push('帯の 親に overflow（' + (pe.id || pe.className) + '）');
    }
    var tr7 = tb.getBoundingClientRect();
    if (tr7.top < -0.5) b7.push('帯が 画面の 上に 出た');
    if (sc === 'title') {
      var st7 = $('stage').getBoundingClientRect(), lr7 = $('logRow').getBoundingClientRect(), ts7 = $('titleScreen');
      if (over(tr7, st7)) b7.push('帯と まん中が 重なった');
      if (over(lr7, st7)) b7.push('ハッピーと まん中が 重なった');
      if (over(tr7, lr7)) b7.push('帯と ハッピーが 重なった');
      if (st7.bottom > H + 0.5 || st7.right > W + 0.5) b7.push('まん中の 箱が 画面から 出た');
      var tsr = ts7.getBoundingClientRect();
      if (tsr.right > st7.right + 0.5 || tsr.left < st7.left - 0.5 || tsr.bottom > st7.bottom + 0.5) b7.push('はじめの 箱が まん中の 箱から はみ出した');
      if (ts7.scrollHeight > ts7.clientHeight + 0.5) b7.push('はじめの 箱の 中身が 切れた（' + ts7.scrollHeight + '＞' + ts7.clientHeight + '）');
    } else {
      var scn = $(sc), parts = partsOf(scn);
      if (tb.parentElement === appEl && vis(tb)) parts.unshift(tb);
      var rs7 = parts.map(function (p) { return { p: p, r: p.getBoundingClientRect(), n: p.id || p.className.split(' ')[0] }; });
      rs7.forEach(function (a) {
        if (a.r.left < -0.5 || a.r.right > W + 0.5 || a.r.top + sy < -0.5 || a.r.bottom + sy > docH + 0.5) b7.push(a.n + ' が 画面から 出た');
        if (!scroll && a.r.bottom > H + 0.5) b7.push(a.n + ' が 画面の 下から 出た');
      });
      for (var a7 = 0; a7 < rs7.length; a7++) for (var c7 = a7 + 1; c7 < rs7.length; c7++) {
        if (scroll && sy > 0.5 && (rs7[a7].p === tb || rs7[c7].p === tb)) continue;   // ★上下に 動かした あとは 帯が 上に 重なって よい（sticky）
        if (over(rs7[a7].r, rs7[c7].r)) b7.push(rs7[a7].n + ' と ' + rs7[c7].n + ' が 重なった');
      }
      /* ★ 板の 中身が あふれない・中身が 板から 出ない（★名札は ふちの 上に 9px まで）*/
      rs7.forEach(function (a) {
        var el = a.p;
        if (el === tb || el.id === 'btnDecide') return;
        if (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1) b7.push(a.n + ' の 中身が あふれた（' + el.scrollWidth + '×' + el.scrollHeight + '＞' + el.clientWidth + '×' + el.clientHeight + '）');
        var inside = el.querySelectorAll('.chip,.happy-bubble,.lbl,.sc,.howto,.stick,.dora,.kyoku,.jun,.backs,.ron,.tag,.st,.happy-cat,.furi,.divider span');
        for (var k7 = 0; k7 < inside.length; k7++) {
          var e7 = inside[k7]; if (!vis(e7)) continue;
          var q = e7.getBoundingClientRect(), upT = e7.classList.contains('tag') ? 9.5 : 0.5;
          if (q.left < a.r.left - 0.5 || q.right > a.r.right + 0.5 || q.top < a.r.top - upT || q.bottom > a.r.bottom + 0.5) b7.push((e7.className.baseVal != null ? e7.className.baseVal : e7.className).split(' ')[0] + ' が ' + a.n + ' から 出た');
        }
      });
      /* ★ 名札：切れない（…に ならない）・ほかの 板に かぶらない */
      scn.querySelectorAll('.tag').forEach(function (tg) {
        if (!vis(tg)) return;
        if (tg.scrollWidth > tg.clientWidth + 0.5) b7.push('名札が 切れた：' + tg.textContent.slice(0, 10));
        var r = tg.getBoundingClientRect();
        rs7.forEach(function (a) { if (scroll && sy > 0.5 && a.p === tb) return; if (!a.p.contains(tg) && over(r, a.r)) b7.push('名札が ' + a.n + ' に かぶる：' + tg.textContent.slice(0, 8)); });
      });
      /* ★ 牌：板と 画面の 中・ひりつ・重ならない（★上がった 牌は 自分の セルの 中）*/
      scn.querySelectorAll('.tiles').forEach(function (tl) {
        if (!vis(tl)) return;
        var card = tl.closest('.card,.table'), cr7 = card.getBoundingClientRect(), outN = 0, svgs = [];
        tl.querySelectorAll('.tl').forEach(function (cell) {
          var sv = cell.querySelector('svg.mj'); if (!sv || getComputedStyle(sv).visibility === 'hidden') return;
          var q = sv.getBoundingClientRect(), cq = cell.getBoundingClientRect();
          if (q.left < cr7.left - 0.5 || q.right > cr7.right + 0.5 || q.top < cr7.top - 0.5 || q.bottom > cr7.bottom + 0.5) outN++;
          if (q.right > W + 0.5 || q.left < -0.5 || q.top + sy < -0.5 || q.bottom + sy > docH + 0.5 || (!scroll && q.bottom > H + 0.5)) outN++;
          if (q.top < cq.top - 0.5 || q.bottom > cq.bottom + 0.5 || q.left < cq.left - 0.5 || q.right > cq.right + 0.5) outN++;
          if (Math.abs(q.height / q.width - R) > 0.03) b7.push(tl.id + ' の 牌の ひりつが ' + (q.height / q.width).toFixed(3));
          svgs.push(q);
        });
        if (outN) b7.push(tl.id + ' の 牌が 箱から 出た ' + outN + 'か所');
        var ov = 0;
        for (var i7 = 0; i7 < svgs.length; i7++) for (var j7 = i7 + 1; j7 < svgs.length; j7++) if (over(svgs[i7], svgs[j7])) ov++;
        if (ov) b7.push(tl.id + ' の 牌が ' + ov + '組 重なった');
      });
      note['⑦ 牌'] = Object.keys(geo.t || {}).map(function (k) { return k + ' ' + geo.t[k].tw + '（的 ' + geo.t[k].cw + '×' + geo.t[k].ch + '）'; }).join('・') + '・' + geo.mode + (geo.low ? '・低い' : '') + (geo.tight ? '・せまい' : '') + (geo.scroll ? '・上下に 動く' : '');
    }
    var bn = $('brandName');
    if (bn && vis(bn) && lineCount(bn) > 1) b7.push('題が 折れた');
    var brd = $('brand');   // ★T335：題が 帯の 中に 入って いる（★はみ出して ◀ に かぶらない）
    if (vis(brd) && brd.scrollWidth > brd.clientWidth + 0.5) b7.push('★題が 帯から はみ出した（' + brd.scrollWidth + '＞' + brd.clientWidth + '）');
    put('⑦', b7);

    /* ⑧ 家へ 帰る道 */
    var b8 = [], q8 = $('btnQuit'), yame = 0;
    if (!q8 || q8.textContent.replace(/\s+/g, '') !== '◀ゲームを選ぶ') b8.push('試合の おわりの 箱の 字が ちがう');
    if (!q8 || q8.getAttribute('href') !== '../') b8.push('家への 道が ちがう');
    if ($('btnBack').getAttribute('href') !== '../') b8.push('帯の ◀ の 道が ちがう');
    (function walk(nd) {
      if (nd.nodeType === 3) { if (nd.nodeValue.indexOf('やめる') >= 0) yame++; return; }
      if (nd.nodeType !== 1) return;
      var tg = nd.tagName.toLowerCase(); if (tg === 'script' || tg === 'style') return;
      for (var i8 = 0; i8 < nd.childNodes.length; i8++) walk(nd.childNodes[i8]);
    })(document.body);
    if (yame !== 1) b8.push('「やめる」の 字が ' + yame + 'か所（★帯の 1か所 だけ）');
    if (inMatch && !vis($('btnQuitGame'))) b8.push('試合 中に「↻ やめる」が 見えない');
    if (!inMatch && vis($('btnQuitGame'))) b8.push('はじめの 画面で「↻ やめる」が 出て いる');
    put('⑧', b8);

    /* ⑩ 題 */
    var b10 = [], h1s = document.querySelectorAll('h1'), cano = document.querySelector('link[rel="canonical"]'), ogu = document.querySelector('meta[property="og:url"]');
    if (h1s.length !== 1) b10.push('h1 が ' + h1s.length + '個');
    else if (h1s[0].textContent.trim() !== ($('brandName').textContent || '').trim()) b10.push('h1 と 帯の 題が ちがう');
    /* ★T335：題は「麻雀17歩」（社長の 決め）。★title は 1文字も 決まりどおり・og:title／twitter:title と 同じ・description にも 題 */
    if (($('brandName').textContent || '').trim() !== TITLE_NAME) b10.push('帯の 題が「' + $('brandName').textContent + '」');
    if (document.title !== TITLE_FULL) b10.push('★title が「' + document.title + '」（正は ' + TITLE_FULL + '）');
    ['meta[property="og:title"]', 'meta[name="twitter:title"]'].forEach(function (q) { var m = document.querySelector(q); if (!m || m.getAttribute('content') !== TITLE_FULL) b10.push(q + ' が 題と ちがう'); });
    ['meta[name="description"]', 'meta[property="og:description"]'].forEach(function (q) { var m = document.querySelector(q); if (!m || m.getAttribute('content').indexOf(TITLE_NAME) !== 0) b10.push(q + ' が 題で はじまらない'); });
    if (!cano || !ogu || cano.getAttribute('href') !== ogu.getAttribute('content')) b10.push('canonical と og:url が ちがう');
    else if (cano.getAttribute('href') !== 'https://bragekobo.com/17ho/') b10.push('canonical が ' + cano.getAttribute('href'));

    put('⑩', b10);

    /* ⑪ 外への 通信 */
    var b11 = [];
    try {
      performance.getEntriesByType('resource').forEach(function (en) {
        var u = en.name;
        if (/^data:|^blob:/.test(u)) return;
        try { if (new URL(u, location.href).origin !== location.origin) b11.push('よそへ：' + u); } catch (e) { b11.push('読めない 住所：' + u); }
      });
    } catch (e) { b11.push('performance を 読めない'); }
    put('⑪', b11);

    /* ⑫ 牌の 絵 */
    var b12 = [];
    if (!MJ || !MJ.tile || !MJ.install) b12.push('★アトの 部品（window.MJ）が 無い');
    else {
      var sp = document.getElementById('mj-sprite');
      if (!sp) b12.push('部品の symbol が 置かれて いない');
      else if (sp.querySelectorAll('symbol').length !== 35) b12.push('symbol が ' + sp.querySelectorAll('symbol').length + '個（正は 35）');
    }
    if (h && inMatch) {
      var same = function (id, want) { var el = $(id); if (!vis(el)) return; var got = codesOf(el).join(','); if (got !== want.join(',')) b12.push(id + ' の 絵が 中身と ちがう'); };
      if (h.phase === 'build' && flipAt < 0) {
        same('pool', h.hands[HUMAN]);
        var pl12 = (h.h13[HUMAN] || pickList()).slice(); while (pl12.length < 13) pl12.push('_');
        same('pickRow', pl12);
      }
      if (h.phase === 'dora' && flipAt < 0) { var wc = codesOf($('wall')); if (wc.length !== 68 || wc.some(function (x) { return x !== 'back'; })) b12.push('伏せた 山が 68枚の 裏で ない'); }
      if (h.phase === 'play' || h.phase === 'end') {
        same('hand13', h.h13[HUMAN]); same('riverOpp', pad17(h.river[CPU])); same('riverMe', pad17(h.river[HUMAN]));
        var sl12 = slots21(h); same('rest', sl12);
        /* ★ 点線の わく（切った 場所）＝ 自分の 捨て牌（★数も 牌も）・★まだ 切って いない 牌は 残りと 同じ */
        var goneC = [], liveC = [];
        $('rest').querySelectorAll('.tl').forEach(function (cell, i) { (cell.classList.contains('gone') ? goneC : liveC).push(sl12[i]); });
        if (E.sortCodes(goneC).join() !== E.sortCodes(h.river[HUMAN]).join()) b12.push('★切った 場所の わくが 捨て牌と ちがう（' + goneC.length + '／' + h.river[HUMAN].length + '）');
        if (liveC.join() !== E.restList(h, HUMAN).join()) b12.push('★切れる 牌が 残りと ちがう');
      }
      document.querySelectorAll('.scene:not(.hidden) .dora-tile').forEach(function (dt) {
        if (!vis(dt) || !h.dora || flipAt >= 0) return;
        var u = dt.querySelector('use'); if (!u || u.getAttribute('href') !== '#mj-' + (h.phase === 'dora' ? 'back' : h.dora)) b12.push('ドラ表示牌の 絵が ちがう');
      });
    }
    /* ★T334：河の 空きわくは ★白い 面を 持たない（★白（無地）の 牌と 見分ける ―― トライ T333 ⑪）*/
    var emp = document.querySelector('#play:not(.hidden) .river .tl.empty');
    if (emp && vis(emp)) {
      var bg12 = getComputedStyle(emp, '::before').backgroundColor;
      if (!bg12 || bg12 === 'rgba(0, 0, 0, 0)' || bg12 === 'transparent' || /^rgba?[(]255, 255, 255/.test(bg12)) b12.push('★河の 空きわくに 色が 無い（' + bg12 + '）―― 白の 牌と まぎれる');
    }
    put('⑫', b12);

    /* ⑬ 点 */
    var b13 = [];
    if (S) {
      var tot = S.match.points[0] + S.match.points[1] + S.match.kyotaku;
      if (Math.abs(tot - 70000) > 1e-9) b13.push('★持ち点＋供託が ' + tot);
      document.querySelectorAll('.scene:not(.hidden) [data-pts]').forEach(function (b) {
        if (vis(b) && b.textContent !== fmt(S.match.points[+b.dataset.pts])) b13.push('帯の 点が 中身と ちがう（' + b.textContent + '）');
      });
      document.querySelectorAll('.scene:not(.hidden) [data-kyotaku]').forEach(function (b) {
        if (vis(b) && b.textContent !== fmt(S.match.kyotaku)) b13.push('供託の 数が ちがう');
      });
      if (h && h.out && h.out.type === 'ron') {
        var o13 = h.out, gain = o13.after[o13.winner] - o13.before[o13.winner], loss = o13.before[1 - o13.winner] - o13.after[1 - o13.winner];
        if (gain !== o13.pay.winnerGets || loss !== o13.pay.loserPays) b13.push('ロンの 点の 動きが ちがう（' + gain + '／' + loss + '）');
      }
    }
    put('⑬', b13);

    /* ⑭ しまう */
    var b14 = [];
    if (S && store) {
      var raw = null; try { raw = store.getItem(SAVE_KEY); } catch (e) {}
      if (raw !== JSON.stringify(S)) b14.push('★しまった 中身が いまの 試合と ちがう');
      var back = null; try { back = JSON.parse(JSON.stringify(S)); } catch (e) {}
      if (!back || !goodState(back)) b14.push('★しまった 中身を 読むと 決まりに 合わない');
      else if (JSON.stringify(back) !== JSON.stringify(S)) b14.push('★読み直すと 中身が 変わる');
    } else if (!S && store) { var raw2 = null; try { raw2 = store.getItem(SAVE_KEY); } catch (e) {} if (raw2) b14.push('はじめの 画面 なのに 試合が しまって ある'); }
    else note['⑭ しまう'] = 'sessionStorage が 使えない';
    /* ★T365：前の 版（v1）の 中身は 残さない・しまう 名前は 前の 版と ちがう（トライ T364 F1・F2）*/
    if (OLD_KEYS.indexOf(SAVE_KEY) >= 0 || SAVE_KEY === 'bragekobo-17ho-v1') b14.push('★しまう 名前が 前の 版と 同じ（' + SAVE_KEY + '）');
    if (store) OLD_KEYS.forEach(function (k) { var o = null; try { o = store.getItem(k); } catch (e) {} if (o) b14.push('★前の 版の 中身が 残って いる（' + k + '）'); });
    /* ★T365：ロンの 出番は いまの 決まりで 満貫に 届く 牌 だけ（★届かない 出番が 残ると 押して 止まる ―― F1）*/
    if (h && h.offer) { var ro14 = null; try { ro14 = ronResult(S, h.offer.p, h.offer.tile, h.offer.no); } catch (e) {} if (!ro14 || !ro14.mangan) b14.push('★ロンの 出番が 満貫に とどかない 牌（' + h.offer.tile + '）'); }
    if (h && h.out && h.out.type === 'ron' && h.out.result && !h.out.result.yakuman && typeof h.out.result.fu !== 'number') b14.push('★ロンの 結果に 符が 無い');
    put('⑭', b14);

    /* ⑮ 2連打の 止め */
    var b15 = [], keepG = guardUntil, fired = 0, tgt = $('btnHowto');
    var spy = function () { fired++; };
    tgt.addEventListener('click', spy);
    guardUntil = performance.now() + 5000;
    var dlgOpen = hd.open;
    tgt.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    if (!dlgOpen && hd.open) hd.close();
    if (fired) b15.push('止めて いる 間に ボタンが 動いた');
    guardUntil = 0; fired = 0;
    tgt.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    if (!dlgOpen && hd.open) hd.close();
    if (!fired) b15.push('止めて いない のに ボタンが 動かない（★見張りの ものさしが おかしい）');
    tgt.removeEventListener('click', spy);
    guardUntil = keepG;
    put('⑮', b15);

    /* ⑯ ことば */
    var b16 = [], txt = '';
    (function walk(nd) {
      if (nd.nodeType === 3) { txt += nd.nodeValue; return; }
      if (nd.nodeType !== 1) return;
      var tg = nd.tagName.toLowerCase(); if (tg === 'script' || tg === 'style') return;
      for (var i = 0; i < nd.childNodes.length; i++) walk(nd.childNodes[i]);
    })(document.body);
    txt += ' ' + document.title + ' ' + ((document.querySelector('meta[name="description"]') || {}).content || '');
    var txtAll = txt + Object.keys(LINES).map(function (k) { return line(k); }).join(' ');
    MJ_WORDS.forEach(function (w) { txtAll = txtAll.split(w).join(''); });
    for (var i16 = 0; i16 < BANNED.length; i16++) if (txtAll.indexOf(BANNED[i16]) >= 0) b16.push('「' + BANNED[i16] + '」の 字が ある');
    MANGA.forEach(function (w) { if (txtAll.indexOf(w) >= 0) b16.push('★使わない 書き文字が ある（' + MANGA.indexOf(w) + '番）'); });
    put('⑯', b16);

    /* ⑰ 箱 */
    var b17 = [], rw17 = $('resultWrap');
    if (!rw17.classList.contains('hidden')) {
      var bx = $('resultBox');
      if (bx.scrollHeight > bx.clientHeight + 0.5) b17.push('箱の 中身が 切れた（' + bx.scrollHeight + '＞' + bx.clientHeight + '）');
      var br17 = bx.getBoundingClientRect();
      if (br17.bottom > H + 0.5 || br17.right > W + 0.5 || br17.top < -0.5) b17.push('箱が 画面から 出た');
      if (resultKind === 'final') {
        if (!vis($('btnQuit')) || !vis($('btnToTitle'))) b17.push('試合の おわりに 家への 道が 無い');
        /* ★T332：同点なら 引き分け（★勝ち負けの 字が 点と 合う）*/
        var p17 = S.match.points, tie = p17[0] === p17[1], ttl = $('resultTitle').textContent;
        if (tie !== (S.match.winner == null)) b17.push('★同点と 引き分けが 合わない（' + p17.join(',') + '）');
        if (tie && (ttl !== '引き分け' || $('resultBody').textContent.indexOf('引き分け') < 0)) b17.push('★同点 なのに「引き分け」と 出て いない（' + ttl + '）');
        if (!tie && ttl !== (p17[0] > p17[1] ? 'あなたの 勝ち！' : 'あいての 勝ち')) b17.push('★勝ち負けの 字が 点と 合わない（' + ttl + '）');
        if (S.match.endReason === 'lastdraw' && $('resultBody').textContent.indexOf('流局で 終わり') < 0) b17.push('最後の 局の 流局で 終わった ことが 書いて いない');
      }
    }
    put('⑰', b17, rw17.classList.contains('hidden') ? '箱なし' : resultKind);

    /* ⑱ 上下に 動く（★社長の 決め②：幅 320 の たての 17巡 だけ）*/
    var b18 = [], wantS = scrollOn(), oy = getComputedStyle(document.body).overflowY;
    if (wantS !== scroll) b18.push('★上下に 動く 印が ' + scroll + '（正は ' + wantS + '）');
    if (wantS) {
      if (oy !== 'auto' && oy !== 'scroll') b18.push('★幅 320 の たてで 上下に 動かせない（overflow-y:' + oy + '）');
      var lowest = 0;
      partsOf($('play')).forEach(function (p) { lowest = Math.max(lowest, p.getBoundingClientRect().bottom + sy); });
      if (lowest > de.scrollHeight + 0.5) b18.push('★下まで 届かない（' + Math.round(lowest) + '＞' + de.scrollHeight + '）');
      if (geo.t.rest && geo.t.rest.tw < TUNE.SCROLL_MIN_TW) b18.push('★上下に 動かすのに 切れる 牌が ' + geo.t.rest.tw + 'px');
    } else {
      if (oy !== 'hidden') b18.push('★幅 320 の たての 17巡 では ないのに 上下に 動く（overflow-y:' + oy + '）');
      if (de.scrollHeight > H + 0.5) b18.push('たてに すべる（' + de.scrollHeight + '）');
    }
    put('⑱', b18, wantS ? '上下に 動く（ページの たけ ' + de.scrollHeight + '）' : '1画面');

    /* ⑲ 字の 床（11px）*/
    var b19 = [], small = {};
    var hn = document.querySelector('.happy-name');
    if (!hn || parseFloat(getComputedStyle(hn).fontSize) < 11) b19.push('★ハッピーの 名札が ' + (hn ? getComputedStyle(hn).fontSize : '無い'));
    document.querySelectorAll('body *').forEach(function (e19) {
      var tg = e19.tagName.toLowerCase(); if (tg === 'script' || tg === 'style' || tg === 'svg' || e19.closest('svg')) return;
      var has = false; for (var k = 0; k < e19.childNodes.length; k++) if (e19.childNodes[k].nodeType === 3 && e19.childNodes[k].nodeValue.trim()) { has = true; break; }
      if (!has || !vis(e19)) return;
      var fs = parseFloat(getComputedStyle(e19).fontSize);
      if (fs < 11 - 1e-6) small[fs + 'px「' + e19.textContent.trim().slice(0, 6) + '」'] = 1;
    });
    Object.keys(small).forEach(function (k) { b19.push('字が 小さい ' + k); });
    put('⑲', b19);

    /* ⑳ 並べ直し（★T334：★その 場で 回しても こけない ―― トライ T333 ①）
         ・★並べ方は いまの 画面の 大きさで 数えた もの（★回す 前の はばの まま 残って いない）
         ・★画面の エラー 0（★読み込んで から ずっと 数えて いる）
         ・★fit() は 箱が 0・NaN・マイナスでも こけない（★その 場で 小さな 箱に 入れて 試す）*/
    var b20 = [];
    if (geo.W !== W || geo.H !== H) b20.push('★並べ方が ' + geo.W + '×' + geo.H + ' の まま（画面は ' + W + '×' + H + '）');
    if (pageErrors.length) b20.push('★画面の エラー ' + pageErrors.length + '回：' + pageErrors[0]);
    [[0, 0], [NaN, NaN], [-5, 300], [300, -5], [286, 0], [0, 99999]].forEach(function (wh) {
      var d20 = document.createElement('div'), r20 = null;
      try { r20 = fit(d20, slots21Sample(), wh[0], wh[1], { lift: true, tap: true, cmin: 3, cmax: 21, cap: TUNE.CAP_REST }); }
      catch (e) { b20.push('★fit(' + wh.join('×') + ') が こけた：' + e.message); return; }
      if (!r20 || !(r20.tw >= TUNE.TILE_MIN) || !(r20.cols >= 1) || !isFinite(r20.cw)) b20.push('★fit(' + wh.join('×') + ') の 答えが おかしい ' + JSON.stringify(r20));
    });
    if (scroll !== scrollOn()) b20.push('★上下に 動く 印が いまの 画面と ちがう');
    put('⑳', b20, '並べた 回数 ' + layoutPasses + '（最後の 並べ直し）');

    /* ㉑ 巡目・位・遊び方（★T334：トライ T333 ③④⑤⑨）
         ・巡目 ＝ ★切った 数の 合計から 数え直す（★ロンの 出番と ロンの あとは いま 出た 牌の 打目）
         ・位の 名前：役満 1〜9倍 ぜんぶ 名前が ある・3倍＝トリプル役満・4倍＝四倍役満（★仕様書 §2-3）・試合の 記録の ロンに 位が ある
         ・手作りの 帯に 供託 ・ 遊び方に「◎△×」と「最後の 局で 親が トップなら 終わり」 */
    var b21 = [];
    if (h && (h.phase === 'play' || h.phase === 'end') && h.h13[HUMAN]) {
      var T21 = h.cnt[0] + h.cnt[1], justOut = !!h.offer || !!(h.out && h.out.type === 'ron');
      var jun21 = Math.min(C.RULES.turns, Math.ceil((justOut ? T21 : T21 + 1) / 2));
      document.querySelectorAll('#play .jun b, #restTag .yoko-only b').forEach(function (jb) {   // ★よこは 名札の 中の 巡目
        if (!vis(jb)) return;
        var got = parseInt(jb.firstChild.nodeValue, 10);
        if (got !== jun21) b21.push('★巡目が ' + got + '（正は ' + jun21 + '）');
      });
    }
    for (var y21 = 1; y21 <= 9; y21++) { var rk = C.rankOf(0, y21); if (!rankName(rk.id)) b21.push('★役満 ' + y21 + '倍の 名前が 無い'); }
    if (rankName(C.rankOf(0, 3).id) !== 'トリプル役満') b21.push('3倍が「' + rankName(C.rankOf(0, 3).id) + '」');
    if (rankName(C.rankOf(0, 4).id) !== '四倍役満') b21.push('4倍が「' + rankName(C.rankOf(0, 4).id) + '」');
    ['mangan', 'haneman', 'baiman', 'sanbaiman', 'kazoe', 'yakuman', 'yakuman2'].forEach(function (id) { if (!rankName(id)) b21.push('★' + id + ' の 名前が 無い'); });
    if (resultKind === 'final' && S) {
      var lis = $('resultBody').querySelectorAll('.rs-log li');
      S.match.history.forEach(function (rec, i) { if (rec.type === 'ron' && lis[i] && lis[i].textContent.trim().slice(-1) === 'ン') b21.push('★試合の 記録の ' + (i + 1) + '局目に 位が 無い'); });
    }
    if (resultKind === 'hand' && /[0-9]倍役満/.test($('resultBody').textContent)) b21.push('★局の 箱に「数字＋倍役満」（正は 漢数字）');
    /* ★T362：局の 箱の 位の 1行 ＝ MJCore の 答えと 同じ（★飜・符・位・切り上げ）。役満は 位だけ */
    if (resultKind === 'hand' && S && S.h && S.h.out && S.h.out.type === 'ron') {
      var rr21 = S.h.out.result, rkEl = $('resultBody').querySelector('.rs-rank'), rkT = rkEl ? rkEl.textContent : '';
      var want21 = rr21.yakuman ? rankName(rr21.rank.id) : rr21.totalHan + '飜 ' + rr21.fu + '符 → ' + rankName(rr21.rank.id) + (rr21.kiriage ? '（切り上げ）' : '');
      if (rkT !== want21) b21.push('★局の 箱の 位が「' + rkT + '」（正は「' + want21 + '」）');
      if (!rr21.yakuman && !(rr21.fu === 25 || (rr21.fu >= 30 && rr21.fu % 10 === 0))) b21.push('★符が ' + rr21.fu);
      if (rkEl && vis(rkEl) && lineCount(rkEl) > 2) b21.push('★位の 1行が ' + lineCount(rkEl) + '行に 折れた');
    }
    if (sc === 'make' && S) {
      var kv = null; $('makeInfo').querySelectorAll('[data-kyotaku]').forEach(function (e) { if (vis(e)) kv = e; });
      if (!kv) b21.push('★手作りの 帯に 供託が 無い');
    }
    var hdT = $('helpDialog').textContent;
    ['◎満貫', '△一発', '△河底', 'とどかない', '親が ロンして トップ', '符', '切り上げ', '4飜30符', '3飜60符', 'ダブル役満', '四暗刻単騎', '国士無双十三面'].forEach(function (w) { if (hdT.indexOf(w) < 0) b21.push('遊び方に「' + w + '」が 無い'); });
    /* ★T365：点の 表（トライ T364 F3）―― 満貫の 行に 4飜30符〜・3飜60符〜（切り上げ）・役満は 2倍〜5倍の 行（点は MJCore と 同じ）・表が 箱から はみ出さない */
    var pt21 = document.querySelector('#helpDialog .pt-table');
    if (!pt21) b21.push('★遊び方に 点の 表が 無い');
    else {
      var mr21 = pt21.querySelector('.pt-mangan'), mt21 = mr21 ? mr21.textContent : '';
      ['満貫', '4飜30符', '3飜60符', '切り上げ', '8,000', '12,000'].forEach(function (w) { if (mt21.indexOf(w) < 0) b21.push('★点の 表の 満貫の 行に「' + w + '」が 無い'); });
      var ym21 = pt21.querySelectorAll('.pt-ym');
      if (ym21.length !== 4) b21.push('★点の 表の 2倍〜5倍の 行が ' + ym21.length + '行');
      for (var yi = 0; yi < ym21.length; yi++) {
        var nn = yi + 2, rk21 = C.rankOf(0, nn), cells21 = ym21[yi].cells;
        var wantRow = [nn + '倍', rankName(rk21.id), fmt(C.basePay(false, rk21)), fmt(C.basePay(true, rk21))].join('|');
        var gotRow = Array.prototype.map.call(cells21, function (c) { return c.textContent; }).join('|');
        if (gotRow !== wantRow) b21.push('★点の 表の ' + nn + '倍の 行が「' + gotRow + '」（正は「' + wantRow + '」）');
      }
      if (vis(pt21)) {
        var sec21 = pt21.parentElement.getBoundingClientRect(), tb21 = pt21.getBoundingClientRect();
        if (tb21.right > sec21.right + 0.5 || tb21.left < sec21.left - 0.5 || pt21.scrollWidth > Math.ceil(tb21.width) + 1) b21.push('★点の 表が 箱から はみ出した（' + Math.round(tb21.width) + '＞' + Math.round(sec21.width) + '）');
      }
    }
    ['符は 数えない', '1倍）', '満貫（4飜）'].forEach(function (w) { if (hdT.indexOf(w) >= 0) b21.push('★遊び方に 前の 決め「' + w + '」が 残って いる'); });   // ★T362
    put('㉑', b21);

    /* ㉒ 山の 折り方（★T335・★T338 社長「1」：★たての 手作りは ★どの 山でも 折るのは いちばん 多い 種類 だけ）
         ・★ほかの 種類は かならず 1行（★12枚 以上の 山でも ―― 前の「自由に 折る」は 使わない）
         ・★いちばん 多い 種類（★同じ 枚数で ならぶ ときは その 全部）は 2行 まで（★2行で 牌が BRK_MIN に とどかない 山だけ 3行 以上）
         ・★たては 決まりの 中で いちばん 大きい 牌（★同じ 箱で 数え直す）／★折らない 形で BRK_MIN 以上 とどく 山は それより 小さく ならない
         ・★よこ・PC の よこ 並びは 折らない 並べ方と 同じ（★PC は T338 から たて 並び）
         ・★幅 320 の たて（★SCROLL_W 未満）は たけが 足りないので 前の まま 自由に 折って よい（★社長「320 は 今のまま」）*/
    var b22 = [], info22 = '';
    if (sc === 'make' && h && h.phase === 'build' && flipAt < 0 && geo.t.pool && poolIn && vis($('pool'))) {
      var one22 = fit(document.createElement('div'), h.hands[HUMAN], poolIn.w, poolIn.h, poolOpt(false)), tw22 = geo.t.pool.tw;
      var strictOpt = geo.mode === 'tate' && W >= SCROLL_W;
      if (geo.mode === 'yoko' && (tw22 !== one22.tw || geo.t.pool.cols !== one22.cols)) b22.push('★よこで 山の 並べ方が 変わった（' + tw22 + '・' + geo.t.pool.cols + '列／' + one22.tw + '・' + one22.cols + '列）');
      if (geo.mode === 'yoko' && poolIn.fold) b22.push('★よこで 折って いる');
      if (geo.mode === 'tate' && poolIn.strict !== strictOpt) b22.push('★たての 折り方の 決まりが ちがう（strict ' + poolIn.strict + '）');
      var g0 = {}, mx0 = 0; h.hands[HUMAN].forEach(function (c) { g0[c[1]] = (g0[c[1]] || 0) + 1; }); for (var k0 in g0) mx0 = Math.max(mx0, g0[k0]);
      var strict22 = strictOpt && mx0 <= 11;   // ★T339：「いちばん 多い 種類だけ」は 11枚 以下の 配り だけ（★見張りは TUNE を 読まずに 11 を 自分で もつ）
      if (TUNE.STRICT_MAX !== 11) b22.push('★折り方の 線が ' + TUNE.STRICT_MAX + '枚（正は 11枚）');
      /* ★12枚 以上（★前の 折り方）は ★折らない 形より 小さく ならない こと だけ を 見る */
      if (geo.mode === 'tate' && (!one22.free || (strictOpt && !strict22)) && tw22 < one22.tw - 0.01) b22.push('★折って 牌が 小さく なった（' + tw22 + '＜' + one22.tw + '）');
      var fo22 = fit(document.createElement('div'), h.hands[HUMAN], poolIn.w, poolIn.h, poolOpt(true, strictOpt));
      if (geo.mode === 'tate' && tw22 < fo22.tw - 0.01) b22.push('★たてで 折れば ' + fo22.tw + 'px に なるのに ' + tw22 + 'px の まま');
      var g22 = {}, tops = {}, mx22 = 0, sec22 = 0;
      h.hands[HUMAN].forEach(function (c) { g22[c[1]] = (g22[c[1]] || 0) + 1; });
      Object.keys(g22).forEach(function (k) { mx22 = Math.max(mx22, g22[k]); });
      Object.keys(g22).forEach(function (k) { if (g22[k] < mx22) sec22 = Math.max(sec22, g22[k]); });
      $('pool').querySelectorAll('.tl').forEach(function (cell, i) { var su = h.hands[HUMAN][i][1]; (tops[su] = tops[su] || {})[Math.round(cell.getBoundingClientRect().top)] = 1; });
      /* ★2行で 牌が BRK_MIN に とどく か（★とどけば いちばん 多い 種類も 2行 まで）*/
      var two22 = Math.max(Math.ceil(mx22 / 2), sec22, 1), cw22 = geo.t.pool.cols;
      var only = strict22 || (!strictOpt && !one22.free);   // ★12枚 以上（strictOpt で strict22 で ない）は 行を 数えない
      if (only) Object.keys(g22).forEach(function (k) {
        var nr = Object.keys(tops[k] || {}).length, big = geo.mode === 'tate' && g22[k] === mx22;
        var lim = !big ? 1 : (cw22 >= two22 ? 2 : 99);
        if (nr > lim) b22.push('★' + k + '（' + g22[k] + '枚）が ' + nr + '行に 折れた（' + (big ? (lim === 2 ? '2行 まで' : 'いちばん 多い 種類') : 'ほかの 種類は 1行') + '）');
      });
      if (strict22 && cw22 < sec22) b22.push('★列（' + cw22 + '）が 2番目に 多い 種類（' + sec22 + '枚）より 少ない');
      info22 = '牌 ' + tw22 + '（折らないと ' + one22.tw + '）・いちばん 多い ' + mx22 + '枚・' + cw22 + '列' + (strict22 ? '' : strictOpt ? '・12枚 以上＝前の 折り方' : geo.mode === 'tate' ? '・幅320＝前の まま 自由' : '');
    }
    put('㉒', b22, info22);

    /* ㉓〜㉖（★T338：社長が 遊んで みての 直し）*/
    /* ㉓ ドラを めくる 字：★親が あなたで めくる 前は ★板の 上に 大きな 字（★16px 以上・名札の 1.4倍 以上・まん中が 押せる 所に 見えて いる）／それ 以外は 出ない */
    var b23 = [], dc = $('doraCall'), wantDc = !!(sc === 'make' && h && h.phase === 'dora' && E.dealerOf(S) === HUMAN && flipAt < 0);
    if (wantDc !== vis(dc)) b23.push('★めくる 字が ' + (vis(dc) ? '出て いる' : '出て いない') + '（正は ' + wantDc + '）');
    if (wantDc && vis(dc)) {
      var fs23 = parseFloat(getComputedStyle(dc).fontSize), ft23 = parseFloat(getComputedStyle($('pileTag')).fontSize);
      if (fs23 < 16) b23.push('★めくる 字が ' + fs23 + 'px（16px 以上）');
      if (fs23 < ft23 * 1.4) b23.push('★めくる 字が 名札（' + ft23 + 'px）と 同じ くらい（' + fs23 + 'px）');
      if (dc.textContent.indexOf('めくって') < 0) b23.push('★めくる 字に「めくって」が 無い');
      var r23 = dc.getBoundingClientRect(), at23 = document.elementFromPoint(r23.left + r23.width / 2, r23.top + r23.height / 2);
      var cover23 = hakoNoSoto(dc, at23) || !$('resultWrap').classList.contains('hidden');   // ★遊び方の 箱・結果の 箱の うしろは 数えない
      if (r23.top < -0.5 || r23.bottom > H + 0.5 || (!cover23 && (!at23 || !(at23 === dc || dc.contains(at23))))) b23.push('★めくる 字が 見えて いない（かくれて いる／画面の 外）');
      var wl23 = $('wall').getBoundingClientRect();
      if (r23.bottom > wl23.top + 0.5) b23.push('★めくる 字が 山の 上に ない（山に かぶる）');
    }
    put('㉓', b23, wantDc ? 'めくる 字 ' + getComputedStyle(dc).fontSize : '');

    /* ㉔ ハッピーは いちばん 上：★たて＝帯（上の 帯・局の 帯）の すぐ 下で ★場面の どの 板よりも 上。★よこ＝柱の 中で 上の 帯 → 局の 帯 → ハッピー。★はじめ＝まん中の 箱より 上（右に いる ときは 同じ 高さ）*/
    var b24 = [], lr24 = $('logRow'), q24 = lr24.getBoundingClientRect();
    if (sc === 'title') {
      var st24 = $('stage').getBoundingClientRect();
      if (q24.top > st24.top + 1) b24.push('★はじめの 画面で ハッピーが まん中の 箱より 下（' + Math.round(q24.top) + '＞' + Math.round(st24.top) + '）');
    } else {
      var inf24 = $(sc === 'make' ? 'makeInfo' : 'playInfo');
      if (geo.mode === 'yoko') {
        var sd24 = lr24.parentElement, ch24 = Array.prototype.filter.call(sd24.children, function (e) { return vis(e); });
        var i24 = ch24.indexOf(lr24);
        if (i24 < 0 || ch24[i24 - 1] !== inf24) b24.push('★よこの 柱で ハッピーが 局の 帯の すぐ 下に ない');
        if (i24 >= 0 && ch24.slice(0, i24).some(function (e) { return e !== inf24 && e !== $('topbar'); })) b24.push('★よこの 柱で ハッピーより 上に ほかの 板');
      } else {
        partsOf($(sc)).forEach(function (p) {
          if (p === lr24 || p === inf24 || p === $('topbar')) return;
          if (p.getBoundingClientRect().top < q24.top - 0.5) b24.push('★ハッピーより 上に ' + (p.id || p.className.split(' ')[0]));
        });
        if (q24.top < inf24.getBoundingClientRect().bottom - 0.5) b24.push('★ハッピーが 局の 帯に かぶる');
      }
    }
    put('㉔', b24);

    /* ㉕ 局の 結果に お互いの 待ち：★2人とも（★ロンも 流局も）・★牌が C.waits と 同じ・★聴牌で なければ「ノーテン」*/
    var b25 = [];
    if (resultKind === 'hand' && !$('resultWrap').classList.contains('hidden') && h && h.out) {
      [HUMAN, CPU].forEach(function (p) {
        var el = $('resultBody').querySelector('[data-wait-of="' + p + '"]'), want = C.waits(h.h13[p]);
        if (!el || !vis(el)) { b25.push('★' + (p === HUMAN ? 'あなた' : 'あいて') + 'の 待ちが 結果に 無い'); return; }
        var got = codesOf({ children: el.querySelectorAll('.rs-wt') }).join(',');
        if (want.length ? got !== want.join(',') : el.textContent.indexOf('ノーテン') < 0 || got) b25.push('★' + (p === HUMAN ? 'あなた' : 'あいて') + 'の 待ちが ちがう（' + (got || el.textContent) + '／' + (want.join(',') || 'ノーテン') + '）');
      });
    }
    put('㉕', b25);

    /* ㉖ PC も たて並び：★たけ TATE_H 以上は よこ長でも たて並び・★その とき あいての 裏13枚の 行・★列は 画面の まん中 */
    var b26 = [];
    if (sc !== 'title') {
      var wantMode = (W > H && H < TATE_H) ? 'yoko' : 'tate';
      if (geo.mode !== wantMode) b26.push('★並べ方が ' + geo.mode + '（正は ' + wantMode + '）');
      if (sc === 'play' && geo.mode === 'tate') {
        var or26 = $('oppRow');
        if (!vis(or26)) b26.push('★あいての 裏13枚の 行が 見えない');
        else if (or26.querySelectorAll('.backs svg').length !== 13) b26.push('★あいての 裏が ' + or26.querySelectorAll('.backs svg').length + '枚');
      }
      if (geo.mode === 'tate' && W > H) {
        var ap26 = $('app').getBoundingClientRect();
        if (Math.abs(ap26.left - (W - ap26.right)) > 2) b26.push('★たての 列が まん中に ない（左 ' + Math.round(ap26.left) + '・右 ' + Math.round(W - ap26.right) + '）');
        if (ap26.width > 660) b26.push('★たての 列が 広すぎる（' + Math.round(ap26.width) + '）');
      }
    }
    /* ㉘ めくる 字は ことばの 途中で 行を 変えない（★T343・トライ T340）：★字は ぜんぶ かたまり（.nw）の 中・★かたまりの 字は 1行に */
    var b28 = [], dc28 = $('doraCall');
    Array.prototype.forEach.call(dc28.childNodes, function (nd) { if (nd.nodeType === 3 && nd.nodeValue.trim()) b28.push('★めくる 字に かたまりの 外の 字「' + nd.nodeValue.trim() + '」'); if (nd.nodeType === 1 && !nd.classList.contains('nw')) b28.push('★めくる 字に かたまりの 外の 部品'); });
    if (dc28.querySelectorAll('.nw').length < 2) b28.push('★めくる 字の かたまりが ' + dc28.querySelectorAll('.nw').length + 'つ');
    if (vis(dc28)) dc28.querySelectorAll('.nw').forEach(function (sp) {
      var rg = document.createRange(); rg.selectNodeContents(sp);
      var tops = {}; Array.prototype.forEach.call(rg.getClientRects(), function (q) { if (q.width > 0.5) tops[Math.round(q.top / 6)] = 1; });
      var rs = Array.prototype.map.call(rg.getClientRects(), function (q) { return q.top; }), lo = Math.min.apply(null, rs), hi = Math.max.apply(null, rs);
      if (hi - lo > parseFloat(getComputedStyle(dc28).fontSize) * 0.6) b28.push('★めくる 字が ことばの 途中で 折れた（「' + sp.textContent + '」）');
    });
    put('㉘', b28);

    /* ㉙ ロンの 出番で 並べ直した あと ★ロンの ボタンは 画面の 中（★T343・トライ T340：320×568 で 回して 戻すと 下に かくれた）*/
    var b29 = [];
    if (h && h.phase === 'play' && h.offer && h.offer.p === HUMAN && geo.scene === 'play' && geo.ronIn === false) b29.push('★並べ直した あと ロンの ボタンが 画面の 外');
    put('㉙', b29);

    /* ㉗ CPU は つねに「弱い」（★T339 社長）：★決まりの 数・★画面で 組んだ／切った ときの 強さ ぜんぶ・★「弱い」の 組みと 捨ては「ふつう」と 同じ 関数を 通らない */
    var b27 = [];
    if (TUNE.CPU_LEVEL !== 'weak') b27.push('★CPU の 強さが「' + TUNE.CPU_LEVEL + '」');
    usedLevels.forEach(function (lv) { if (lv !== 'weak' && lv !== 'd:weak') b27.push('★画面の CPU が「' + lv + '」で 動いた'); });
    if (!/cpuBuilder\(S, CPU, TUNE\.CPU_LEVEL\)/.test(String(startCpuBuild)) || !/cpuDiscard\(E\.cpuView\(S, CPU\), TUNE\.CPU_LEVEL\)/.test(String(cpuMove))) b27.push('★画面の CPU が 強さを 決まりから 読んで いない');
    try {
      var T27 = E.newMatch('tonpu', 4711, 1); E.setDora(T27, E.cpuDoraAt(T27.h));
      var bw = E.cpuBuilder(T27, CPU), bn = E.cpuBuilder(T27, CPU, 'normal');
      if (bw.level !== 'weak') b27.push('★cpuBuilder の ふだんが「' + bw.level + '」');
      var hw = bw.run(), hn = bn.run();
      if (!hw.defend && !C.waitMarks(hw.hand, E.ctxOf(T27, CPU)).waits.some(function (w) { return w.mark === '◎'; })) b27.push('★「弱い」の 13枚に ◎ が 無い（満貫に 届かない）');
      if (!/weakValue/.test(String(Builder.prototype.step))) b27.push('★組みが「弱い」の 値打ちを 使って いない');
    } catch (e27) { b27.push('★「弱い」の 試しが 止まった（' + e27.message + '）'); }
    put('㉗', b27, 'CPU ' + TUNE.CPU_LEVEL + '・画面で ' + usedLevels.length + '回');

    put('㉖', b26, sc === 'title' ? '' : geo.mode + (W > H && geo.mode === 'tate' ? '・まん中の 列' : ''));


    var out = { '★NG': ng.length, '中身': ng.length ? ng : 'ぜんぶ OK ✅', '画面': W + '×' + H, '場面': S ? S.h.phase : 'はじめ', 'かかった': (Date.now() - t0) + 'ms' };
    for (var kk in note) if (note.hasOwnProperty(kk)) out[kk] = note[kk];
    return out;
  }

  /* ============================================================
     ★ たしかめ用の 窓口（window.JUNANAHO）― ★画面には 1つも 出さない
     ★ 人の 34枚で 組む 道具は ★置かない（★山を 数える 処理を ページに 入れない ―― T-1）。
       ★写真の 道具は Node の 側で 同じ ENGINE を 使って 13枚を 決め、★本物の 指で 押す。
     ============================================================ */
  window.JUNANAHO = {
    verify: verify,
    lines: LINES,
    engine: E,
    state: function () { return S ? JSON.parse(JSON.stringify(S)) : null; },
    now: function () {
      if (!S) return { 場面: 'はじめの 画面', 局数: lenSel };
      var h = S.h;
      return { 場面: h.phase, 局: kyokuName(h.lab) + ' ' + h.lab.honba + '本場', 親: h.lab.dealer === HUMAN ? 'あなた' : 'あいて',
        点: S.match.points.slice(), 供託: S.match.kyotaku, 選んだ: h.pick.length, 番: h.turn === HUMAN ? 'あなた' : 'あいて',
        切った: h.cnt.slice(), フリテン: h.furiten[HUMAN], ロン待ち: !!h.offer, CPU: h.h13[CPU] ? '決めた' : (builder ? '考え中' : 'まだ'),
        組む計算の最長の1回: maxSlice.toFixed(1) + 'ms', 並べ方: geo };
    },
    /* ★ 場面への 近道（★写真の 道具 だけ）：種と 親を 決めて 試合を はじめる */
    start: function (len, mseed, firstDealer) { startMatch(len || 'tonpu', mseed == null ? 1 : mseed, firstDealer == null ? 0 : firstDealer); return JUNANAHO.now(); },
    /* ★ 牌の 場所（★本物の 指で 押す 道具が 使う。★見えて いなければ 先に 画面を 動かす ―― 幅 320 の たて）*/
    where: function (box3, i) {
      var el = $(box3) && $(box3).children[i];
      if (!el) return null;
      var r = el.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight) { el.scrollIntoView({ block: 'center' }); r = el.getBoundingClientRect(); }
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
    },
    /* ★ 切れる 21枚の 何枚目に その 牌が あるか（★まだ 切って いない ところ）*/
    restSlot: function (code) { if (!S) return -1; var sl = slots21(S.h), g = goneOf(S.h); for (var i = 0; i < sl.length; i++) if (sl[i] === code && g.indexOf(i) < 0) return i; return -1; },
    /* ★ 見張りを わざと 壊す 試し 用 */
    _noGuard: function () { window.removeEventListener('pointerdown', guardEv, true); window.removeEventListener('click', guardEv, true); return 1; },
    _builtFor: builtFor
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
