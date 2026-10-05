/* ============================================================
   花札 ― T351・💻コーダ（2026-09-30）
   ------------------------------------------------------------
   ★ 仕様の 正：設計図 追記⑮（★「こいこい の 形」「仕様書と 画面案の 決め」）
                ＋ logs/T349_花札こいこい仕様書_ルル.md ＋ logs/T350_花札画面案_アト.md
   ★ 役・点・倍・こいこいの 後の 勝負・手役・取り方は ./hanafuda-core.js（HanaCore）。★ここでは 1つも 数え直さない。
   ★ 札の 絵は ./sprite.svg（Alt版48枚を 1つに まとめた もの・見た目の 変更 なし）。裏は CSS の 朱。

   ★ ファイルの かたち（17歩と 同じ）
     「中身（ENGINE・ロボット）」と「画面（UI）」を 分けて ある。★ENGINE と ロボットは document を 1回も さわらない。
     ★ Node でも 同じ 1本を 読んで ロボットどうしの 試合・勝率を 回せる（★見張り ② と 計測どうぐ が 使う）。

   ★ 社長の お決め（追記⑮・厳守）
     ① ルールは 本物どおり。札の 下に 月の 数字（案A 白い 帯）。取った 札には 付けない
        ★T358（社長が 遊んで みての 直し）：★今 取れる 場の 札を 赤い 枠で 囲む（★前の「光らせない」を 社長が 上書き）→ canIds()・見張り ㉘
     ② 花見で一杯・月見で一杯 あり／雨で 流れない／三光5／7点 以上 ×2／こいこい返し ×2（重なれば ×4）／手役 あり／流れは 0点で 親交代 → HanaCore
     ③ 最初の 画面で 選ぶのは 月数（3・6・12か月）だけ
     ④ ロボットは「ふつう」に うっかり10% 入り（★TUNE.MISTAKE の 数字 1つで 変えられる）
     ⑤ 役・札の 名前は 漢字の まま
     ⑥ 題は「花札」。<title>・h1・帯に「こいこい」は 入れない（★説明文には 入れる）
     ★ 親決めは 伏せた 札 2枚から 1枚 めくる。★320×454 は 詰めて 1画面。★横向きの 場は 12の 席を 1列。
     ★ ロボットが 見て よいのは 自分の 手札・場・2人の 取り札・こいこい中か どうか だけ（★cpuView・見張り ③）。

   ⚠️ 外部の ライブラリ・フォント・画像は 0。外への 通信も 0（★絵の 出どころの リンクは 押したら 外へ 行くだけ）。
   ============================================================ */
(function (root) {
  'use strict';

  var HC = root.HanaCore || (typeof require === 'function' ? require('./hanafuda-core.js') : null);
  if (!HC) throw new Error('花札：HanaCore（./hanafuda-core.js）が ありません');

  /* ============================================================
     ★ 数字（TUNE）― 調整する 数字は ここ 1か所だけ
     ============================================================ */
  var TUNE = {
    MISTAKE:     0.10,      // ★ロボットの うっかり（1手ごとに この 割合で 考えずに 手札から 1枚）。★弱める ときは ここ 1行
    CPU_WAIT:     800,      // ロボットが 1枚 出すまで（★速い 側に 固定 ―― 七並べの 裁定）
    SHOW_PLAY:    450,      // 出した 札が 場の 札に 重なって 見える 間
    SHOW_FLIP:    550,      // 山から めくった 札が 見える 間
    SHOW_TAKE:    420,      // めくった 札が 場の 札に 重なって 見える 間
    OYA_SHOW:    1900,      // 親決めの 2枚を 見せる 間
    RESULT_LOCK:  600,      // 箱が 出てから おせない 間（T62）
    AFTER_BOX:    450,      // 箱を 閉じた 直後の 2つめの 指を 止める 間（T316）
    SPREAD_GUARD: 300,      // ★T357（トライ T356 ②）：ならべ窓を 開いた 直後の 2つめの 指を 止める 間
    NUM_H:         14,      // ★月の 数字の 帯（案A）の たけ（13px＋すき間 1px）
    LIFT:           8,      // 選んだ 手札が 上がる 高さ
    RATIO: 1600 / 976       // 札の 絵（viewBox 976×1600）の ひりつ。★ぜったいに くずさない
  };

  var HUMAN = 0, CPU = 1;
  var SEATS = 12;
  var M = HC.month, CARDS = HC.CARDS;

  /* ============================================================
     ★ 試合と 1か月（★S を そのまま sessionStorage に しまう）
     S = { v, months, seed, phase:'oya'|'play'|'result'|'final', no, oya, pts[2], log[], oyagime, h }
     h = { seed, tries, deck[], seats[12][], hands[2][], dealt[2][], got[2][], koi[2], last[2], turn, step, flip, moves, res }
       step：'play'（手札を 出す）→ 'draw'（山を めくる）→［'pick'（めくった 札で 2枚から 選ぶ）］→［'koi'（勝負か こいこいか）］→ 次の 番
     ============================================================ */
  function newMatch(months, seed) {
    seed = seed >>> 0;
    var S = { v: 1, months: months, seed: seed, phase: 'oya', no: 0, oya: -1, pts: [0, 0], log: [], oyagime: null, h: null };
    /* ★親決め：月の ちがう 2枚（★同じ月だと 決まらない ―― 仕様書 §8）*/
    var d = HC.shuffled(HC.mix(seed, 999)), a = d[0], b = -1;
    for (var i = 1; i < d.length; i++) if (M(d[i]) !== M(a)) { b = d[i]; break; }
    S.oyagime = { cards: [a, b], pick: -1 };
    return S;
  }
  /* ★人が 伏せた 札の i枚目を めくる → 人＝その 札・ロボット＝もう1枚。★月の 早い 方が 親 */
  function chooseOya(S, i) {
    var o = S.oyagime;
    if (S.phase !== 'oya' || o.pick >= 0 || (i !== 0 && i !== 1)) return false;
    o.pick = i;
    var mine = o.cards[i], his = o.cards[1 - i];
    S.oya = M(mine) < M(his) ? HUMAN : CPU;
    return true;
  }
  function fieldIds(h) { var out = []; for (var i = 0; i < h.seats.length; i++) for (var k = 0; k < h.seats[i].length; k++) out.push(h.seats[i][k]); return out; }
  function seatOf(h, id) { for (var i = 0; i < h.seats.length; i++) if (h.seats[i].indexOf(id) >= 0) return i; return -1; }
  function emptySeat(h) { for (var i = 0; i < h.seats.length; i++) if (!h.seats[i].length) return i; return -1; }
  /* ★席が ぜんぶ ふさがって いる ときだけ（★13枚目・0.02%）：同じ月が 2つの 席に ある ところを 1つの 席に 重ねて 席を あける
       ★同じ 種類の 2枚を 先に 重ねる（★選ぶ 場面で どちらを 取っても 同じ に なる ように）*/
  function freeSeat(h) {
    var e = emptySeat(h); if (e >= 0) return e;
    var best = null;
    for (var i = 0; i < h.seats.length; i++) for (var j = 0; j < h.seats.length; j++) {
      if (i === j || !h.seats[i].length || !h.seats[j].length) continue;
      if (M(h.seats[i][0]) !== M(h.seats[j][0])) continue;
      var same = HC.type(h.seats[i][0]) === HC.type(h.seats[j][0]) ? 1 : 0;
      if (!best || same > best.same) best = { from: i, to: j, same: same };
    }
    if (!best) return -1;
    h.seats[best.to] = h.seats[best.to].concat(h.seats[best.from]);
    h.seats[best.from] = [];
    return best.from;
  }
  function removeFromField(h, id) { var s = seatOf(h, id); if (s >= 0) h.seats[s].splice(h.seats[s].indexOf(id), 1); }

  /* ★配る。★forced（★確かめ用）＝ 48枚の 並びの 配列を 順に 使う */
  function orderOf(S, tries, forced) {
    if (forced && forced.length) return forced.shift().slice();
    return HC.shuffled(HC.mix(HC.mix(S.seed, S.no + 1), tries));
  }
  function startRound(S, forced) {
    var tries = 0, d, hands, field, extra = 0;
    for (;;) {
      tries++;
      d = orderOf(S, tries, forced);
      hands = [d.slice(0, 8), d.slice(8, 16)]; field = d.slice(16, 24); d = d.slice(24);
      var four = HC.fieldFour(field);
      if (four) {
        if (tries < HC.RULES.redealMax) continue;
        /* ★100回目も 4枚：4枚の うち 1枚を 山の いちばん 下と 入れかえて 始める（★壊れない ことだけは 保証）*/
        var k = -1; for (var q = field.length - 1; q >= 0; q--) if (M(field[q]) === four) { k = q; break; }
        var tmp = field[k]; field[k] = d[d.length - 1]; d[d.length - 1] = tmp;
        extra = 1;
      }
      var ty = [HC.teyaku(hands[0]), HC.teyaku(hands[1])];
      if (ty[0] && ty[1]) { if (tries < 1000) continue; }      // ★2人とも 手役：0点で 配り直し（親は そのまま・だまって）
      break;
    }
    var seats = []; for (var i = 0; i < SEATS; i++) seats.push(i < field.length ? [field[i]] : []);
    var h = { seed: HC.mix(S.seed, 5000 + S.no), tries: tries, swapped: extra, deck: d, seats: seats,
      hands: [hands[0].slice(), hands[1].slice()], dealt: [hands[0].slice(), hands[1].slice()],
      got: [[], []], koi: [0, 0], last: [0, 0], turn: S.oya, step: 'play', flip: -1, moves: 0, res: null };
    S.h = h; S.phase = 'play';
    var t0 = HC.teyaku(h.hands[0]), t1 = HC.teyaku(h.hands[1]);
    if (t0 && !t1) finish(S, 0, 'teyaku', t0);
    else if (t1 && !t0) finish(S, 1, 'teyaku', t1);
    return S;
  }

  /* ★手札から 出す。pick：取る 場の 札の id（★2枚から 選ぶ ときは 必ず）／seat：置く 席（★同じ月が 無い ときだけ。-1 なら 左上から）
       ★取れる 札が あるのに 席を 指したら 何も しない（T-16）。★取れない のに 場の 札を 指したら 何も しない */
  function playCard(S, p, card, pick, seat) {
    var h = S.h;
    if (S.phase !== 'play' || h.step !== 'play' || h.turn !== p) return null;
    var hi = h.hands[p].indexOf(card); if (hi < 0) return null;
    var op = HC.captureOptions(card, fieldIds(h)), took = [], at = -1;
    var hasPick = pick != null && pick >= 0, hasSeat = seat != null && seat >= 0;
    if (op.kind === 'place') {
      if (hasPick) return null;
      if (hasSeat && seat < h.seats.length && !h.seats[seat].length) at = seat;
      else if (hasSeat && emptySeat(h) >= 0) return null;                 // ★ふさがった 席には 置けない
      else at = freeSeat(h);                                               // ★-1／席が ぜんぶ ふさがった ときは 左上から（★重ねて あける）
      if (at < 0) return null;
    } else {
      if (hasSeat) return null;
      if (hasPick && op.cands.indexOf(pick) < 0) return null;
      if (op.kind === 'choose') { if (!hasPick) return null; took = [pick]; }
      else took = op.cands.slice();
    }
    h.hands[p].splice(hi, 1);
    var ev = { p: p, from: 'hand', card: card, kind: op.kind, took: took.slice(), seat: at, seatOfTook: took.length ? seatOf(h, took[0]) : -1 };
    if (took.length) { took.forEach(function (x) { removeFromField(h, x); }); h.got[p].push(card); took.forEach(function (x) { h.got[p].push(x); }); }
    else h.seats[at].push(card);
    h.step = 'draw';
    return ev;
  }
  /* ★山から めくる（★2枚が 種類ちがい なら step＝'pick' で 止まる）*/
  function drawCard(S) {
    var h = S.h;
    if (S.phase !== 'play' || h.step !== 'draw') return null;
    var p = h.turn, d = h.deck.shift();
    h.flip = d;
    var op = HC.captureOptions(d, fieldIds(h)), ev = { p: p, from: 'deck', card: d, kind: op.kind, took: [], seat: -1, cands: op.cands.slice() };
    if (op.kind === 'choose' && !op.same) { h.step = 'pick'; ev.wait = true; return ev; }
    var took = op.kind === 'place' ? [] : op.kind === 'choose' ? [op.cands[0]] : op.cands.slice();
    ev.took = took; ev.seatOfTook = took.length ? seatOf(h, took[0]) : -1;
    if (took.length) { took.forEach(function (x) { removeFromField(h, x); }); h.got[p].push(d); took.forEach(function (x) { h.got[p].push(x); }); }
    else { ev.seat = freeSeat(h); h.seats[ev.seat].push(d); }
    h.flip = -1;
    afterTurn(S, p, ev);
    return ev;
  }
  function pickCard(S, p, target) {
    var h = S.h;
    if (S.phase !== 'play' || h.step !== 'pick' || h.turn !== p) return null;
    var op = HC.captureOptions(h.flip, fieldIds(h));
    if (op.cands.indexOf(target) < 0) return null;
    var ev = { p: p, from: 'deck', card: h.flip, kind: 'choose', took: [target], seatOfTook: seatOf(h, target), seat: -1 };
    removeFromField(h, target); h.got[p].push(h.flip); h.got[p].push(target);
    h.flip = -1;
    afterTurn(S, p, ev);
    return ev;
  }
  /* ★1手（手札＋山）が 終わった：点が ふえたら 勝負か こいこいか（★手札 0枚なら 自動で 勝負）*/
  function afterTurn(S, p, ev) {
    var h = S.h;
    h.moves++;
    var sc = HC.total(h.got[p]);
    if (HC.improved(h.last[p], sc)) {
      if (HC.mustShobu(h.hands[p].length)) { finish(S, p, 'auto'); if (ev) ev.auto = true; return; }
      h.step = 'koi';
      if (ev) ev.ask = true;
      return;
    }
    nextTurn(S);
  }
  function nextTurn(S) {
    var h = S.h;
    if (!h.hands[0].length && !h.hands[1].length) { finish(S, -1, 'nagare'); return; }
    h.turn = 1 - h.turn; h.step = 'play';
  }
  function decide(S, p, koi) {
    var h = S.h;
    if (S.phase !== 'play' || h.step !== 'koi' || h.turn !== p) return false;
    if (!koi) { finish(S, p, 'shobu'); return true; }
    h.koi[p]++;
    h.last[p] = HC.total(h.got[p]);
    nextTurn(S);
    return true;
  }
  /* ★1か月の おわり（★点は ぜんぶ HanaCore の pay から）*/
  function finish(S, w, kind, ty) {
    var h = S.h, res = { w: w, kind: kind, pts: 0, raw: 0, yaku: [], x7: false, xKoi: false, oppKoi: 0 };
    if (kind === 'teyaku') {
      res.raw = ty.pts; res.yaku = [{ key: ty.key, name: ty.name, pts: ty.pts, cards: h.dealt[w].slice() }];
      res.pts = HC.pay(ty.pts, false).pts; res.hand = h.dealt[w].slice();
    } else if (w >= 0) {
      var j = HC.judge(h.got[w]), pay = HC.pay(j.total, h.koi[1 - w] > 0);
      res.raw = j.total; res.yaku = j.yaku; res.x7 = pay.x7; res.xKoi = pay.xKoi; res.pts = pay.pts; res.oppKoi = h.koi[1 - w];
    }
    res.koi = h.koi.slice();
    h.res = res; h.step = 'end';
    if (w >= 0) S.pts[w] += res.pts;
    S.log.push({ no: S.no + 1, w: w, kind: kind, pts: res.pts, names: res.yaku.map(function (y) { return y.name; }) });
    S.oya = w >= 0 ? w : 1 - S.oya;             // ★勝った 人が 次の 親・流れは 親交代
    S.phase = 'result';
  }
  function nextRound(S, forced) {
    if (S.phase !== 'result') return false;
    S.no++;
    if (S.no >= S.months) { S.phase = 'final'; return true; }
    startRound(S, forced);
    return true;
  }
  function matchWinner(S) { return S.pts[0] > S.pts[1] ? 0 : S.pts[1] > S.pts[0] ? 1 : -1; }

  /* ============================================================
     ★ ロボット「ふつう」（★ルル T349 §4-1・トライ T348 の ふつうが 土台）＋ うっかり（TUNE.MISTAKE）
     ★ 見て よいのは cpuView の 中身 だけ（★人の 手札と 山の 順は 渡さない ―― T-26・見張り ③）
     ============================================================ */
  function cpuView(S, p) {
    var h = S.h;
    return { hand: h.hands[p].slice(), field: fieldIds(h), mine: h.got[p].slice(), opp: h.got[1 - p].slice(),
      koiMine: h.koi[p], koiOpp: h.koi[1 - p], empty: emptySeat(h) };
  }
  var BASE = { hikari: 20, tane: 8, tan: 6, kasu: 1 };
  function count(list, f) { var n = 0; for (var i = 0; i < list.length; i++) if (f(CARDS[list[i]])) n++; return n; }
  function cardValue(i, mine) {
    var c = CARDS[i], v = BASE[c.type];
    if (c.sake) v += 12;
    if (c.isc) v += 4 + 4 * count(mine, function (x) { return x.isc; });
    if (c.aka) v += 3 + 5 * count(mine, function (x) { return x.aka; });
    if (c.ao) v += 3 + 5 * count(mine, function (x) { return x.ao; });
    if (c.type === 'hikari') v += 6 * count(mine, function (x) { return x.type === 'hikari'; });
    return v;
  }
  /* ★まだ 見えて いない 同じ月の 札の 数（★自分の 目で 見える もの だけで 数える）*/
  function unseen(v, card) {
    var seen = {}, n = 0;
    v.field.concat(v.mine, v.opp, v.hand).forEach(function (x) { seen[x] = 1; });
    for (var i = 0; i < 48; i++) if (M(i) === M(card) && i !== card && !seen[i]) n++;
    return n;
  }
  function cpuPick(v, two) { return two.slice().sort(function (a, b) { return cardValue(b, v.mine) - cardValue(a, v.mine); })[0]; }
  function capOf(card, field, v) {
    var op = HC.captureOptions(card, field);
    if (op.kind === 'place') return [];
    if (op.kind === 'choose') return [card, cpuPick(v, op.cands)];
    return [card].concat(op.cands);
  }
  function cpuThink(v) {
    var best = null, bs = -1e9, base = HC.total(v.mine);
    for (var i = 0; i < v.hand.length; i++) {
      var hcard = v.hand[i], cap = capOf(hcard, v.field, v), s = 0;
      if (cap.length) {
        for (var k = 0; k < cap.length; k++) s += cardValue(cap[k], v.mine);
        s += (HC.total(v.mine.concat(cap)) - base) * 15;
      } else s -= cardValue(hcard, v.opp) * (unseen(v, hcard) > 0 ? 1.0 : 0.3);
      if (s > bs) { bs = s; best = hcard; }
    }
    return best;
  }
  /* ★1手：{ card, target, oops（うっかり だったか）}。r は 種つきの でたらめ */
  function cpuMove(v, r, mistake) {
    var mk = mistake == null ? TUNE.MISTAKE : mistake, oops = r() < mk;
    var card = oops ? v.hand[Math.floor(r() * v.hand.length)] : cpuThink(v);
    var op = HC.captureOptions(card, v.field), target = -1;
    if (op.kind === 'choose') target = cpuPick(v, op.cands);
    return { card: card, target: target, oops: oops };
  }
  function oppNear(opp) {
    return HC.total(opp) > 0 || count(opp, function (c) { return c.type === 'hikari'; }) >= 2 || count(opp, function (c) { return c.isc; }) >= 2 ||
      count(opp, function (c) { return c.aka; }) >= 2 || count(opp, function (c) { return c.ao; }) >= 2 ||
      count(opp, function (c) { return c.sake || c.sakura || c.moon; }) > 0;
  }
  /* ★こいこい するのは：手札 3枚 以上・いまの 点 6 以下・相手の 取り札が 役に 遠い とき */
  function cpuKoi(v) {
    if (v.hand.length < 3) return false;
    if (HC.total(v.mine) >= 7) return false;
    return !oppNear(v.opp);
  }
  function cpuRng(S, salt) { return HC.rng(HC.mix(S.h.seed, 7000 + S.h.moves * 8 + (salt || 0))); }

  /* ★ロボットの 番を 1歩 進める（★画面も 試合の 道具も これ 1つ）*/
  function cpuStep(S, p, mistake) {
    var h = S.h;
    if (h.step === 'play') { var mv = cpuMove(cpuView(S, p), cpuRng(S, 1), mistake); return playCard(S, p, mv.card, mv.target, -1); }
    if (h.step === 'draw') return drawCard(S);
    if (h.step === 'pick') { var op = HC.captureOptions(h.flip, fieldIds(h)); return pickCard(S, p, cpuPick(cpuView(S, p), op.cands)); }
    if (h.step === 'koi') { var k = cpuKoi(cpuView(S, p)); decide(S, p, k); return { koi: k }; }
    return null;
  }

  /* ============================================================
     ★ 試合を まるごと 回す（★見張り ② と 計測どうぐ）。bots[p]＝null なら この ロボット
     ★ 1か月ごとに 決まりを 数える：16手で 必ず 終わる・山は 8枚 のこる・48枚が そろう・点が 合う
     ============================================================ */
  function checkRound(S, bad, tag) {
    var h = S.h, all = fieldIds(h).concat(h.deck, h.hands[0], h.hands[1], h.got[0], h.got[1]);
    if (h.flip >= 0 && all.indexOf(h.flip) < 0) all.push(h.flip);
    var seen = {};
    all.forEach(function (x) { seen[x] = (seen[x] || 0) + 1; });
    for (var i = 0; i < 48; i++) if (seen[i] !== 1) { bad.push(tag + '札 ' + i + ' が ' + (seen[i] || 0) + '枚'); break; }
    if (all.length !== 48) bad.push(tag + '札が ' + all.length + '枚');
  }
  function simMatch(months, seed, bots, opt) {
    opt = opt || {};
    var S = newMatch(months, seed), bad = [], st = { rounds: 0, nagare: 0, teyaku: 0, koi: 0, decide: 0, moves: 0, early: 0, oops: 0 };
    chooseOya(S, seed & 1);
    startRound(S);
    var guard = 0;
    while (S.phase !== 'final' && guard++ < 5000) {
      if (S.phase === 'result') {
        var h0 = S.h, r0 = h0.res;
        st.rounds++;
        if (r0.kind === 'nagare') { st.nagare++; if (h0.moves !== 16) bad.push(S.no + 1 + 'か月目：流れ なのに ' + h0.moves + '手'); if (h0.deck.length !== 8) bad.push(S.no + 1 + 'か月目：流れで 山が ' + h0.deck.length + '枚'); if (r0.pts !== 0) bad.push('流れで 点'); }
        if (r0.kind === 'teyaku') st.teyaku++;
        else st.moves += h0.moves;
        if ((r0.kind === 'shobu' || r0.kind === 'auto') && h0.moves <= 2) st.early++;
        if (r0.kind !== 'teyaku' && h0.deck.length !== 24 - h0.moves) bad.push(S.no + 1 + 'か月目：山の 枚数が 合わない');
        if (r0.w >= 0 && r0.kind !== 'teyaku') {
          var pj = HC.pay(HC.total(h0.got[r0.w]), h0.koi[1 - r0.w] > 0).pts;
          if (pj !== r0.pts) bad.push(S.no + 1 + 'か月目：点が 部品と ちがう');
          if (r0.pts <= 0) bad.push(S.no + 1 + 'か月目：勝ったのに 0点');
        }
        checkRound(S, bad, S.no + 1 + 'か月目：');
        if (opt.onRound) opt.onRound(S);
        nextRound(S);
        continue;
      }
      var h = S.h, p = h.turn, bot = bots && bots[p];
      if (h.step === 'koi') st.decide++;
      if (bot) {
        if (h.step === 'play') { var mv = bot.choose(cpuView(S, p)); if (!playCard(S, p, mv.card, mv.target, -1)) { bad.push('人の まねが 出せない 手'); break; } }
        else if (h.step === 'draw') drawCard(S);
        else if (h.step === 'pick') pickCard(S, p, bot.pick(cpuView(S, p), HC.captureOptions(h.flip, fieldIds(h)).cands));
        else if (h.step === 'koi') { var kk = bot.koi(cpuView(S, p)); if (kk) st.koi++; decide(S, p, kk); }
      } else {
        if (h.step === 'play') {
          var v = cpuView(S, p), r = cpuRng(S, 1), mv2 = cpuMove(v, r, opt.mistake);
          if (mv2.oops) st.oops++;
          if (!playCard(S, p, mv2.card, mv2.target, -1)) { bad.push('ロボットが 出せない 手'); break; }
        } else {
          var was = h.step, res = cpuStep(S, p, opt.mistake);
          if (was === 'koi' && res && res.koi) st.koi++;
          if (!res) { bad.push('ロボットが 止まった（' + was + '）'); break; }
        }
      }
      if (S.h.moves > 16) { bad.push('16手を こえた'); break; }
    }
    if (S.phase !== 'final') bad.push('試合が 終わらない');
    if (S.log.length !== months) bad.push('月の 数が ' + S.log.length);
    var sum = [0, 0]; S.log.forEach(function (l) { if (l.w >= 0) sum[l.w] += l.pts; });
    if (sum[0] !== S.pts[0] || sum[1] !== S.pts[1]) bad.push('合計が 記録と 合わない');
    return { S: S, bad: bad, st: st, winner: matchWinner(S) };
  }

  /* ============================================================
     ★ 決まった 場面の 試し（★仕様書 §7 T-9〜T-17・見張り ② が 画面の 中でも 回す）
     ============================================================ */
  function orderFrom(h0, h1, field, deckHead) {
    var used = {}, out = [];
    h0.concat(h1, field, deckHead || []).forEach(function (x) { if (used[x]) throw new Error('orderFrom：札 ' + x + ' が 2回'); used[x] = 1; });
    out = h0.concat(h1, field, deckHead || []);
    for (var i = 0; i < 48; i++) if (!used[i]) out.push(i);
    return out;
  }
  function fixed(order, oya, months) {
    var S = newMatch(months || 3, 1); S.oya = oya == null ? HUMAN : oya; S.phase = 'play';
    startRound(S, [order]);
    return S;
  }
  /* ★場面を 手で 組む（★48枚が そろわなくても よい 小さな 試し 用）*/
  function scene(o) {
    var S = fixed(orderFrom([4, 8, 12, 16, 20, 24, 28, 32], [36, 40, 44, 5, 9, 13, 17, 21], [0, 1, 2, 6, 10, 14, 18, 22], []), o.turn == null ? HUMAN : o.turn);
    var h = S.h;
    h.hands = [o.h0.slice(), o.h1.slice()]; h.got = [(o.g0 || []).slice(), (o.g1 || []).slice()];
    h.seats = []; for (var i = 0; i < SEATS; i++) h.seats.push(o.field && i < o.field.length ? [o.field[i]] : []);
    h.deck = (o.deck || []).slice(); h.koi = (o.koi || [0, 0]).slice(); h.last = (o.last || [0, 0]).slice();
    h.turn = o.turn == null ? HUMAN : o.turn; h.step = 'play'; h.moves = o.moves || 0;
    return S;
  }
  function selfTest() {
    var bad = [];
    function ok(c, msg) { if (!c) bad.push(msg); }
    var S, ev;
    /* T-11 場に 同じ月 3枚：手札から 4枚目 → 4枚 ぜんぶ（★3枚の どれを 指しても 同じ）*/
    [0, 1, 2].forEach(function (tap) {
      var Sx = fixed(orderFrom([3, 44, 45, 20, 24, 28, 32, 36], [4, 8, 12, 16, 21, 25, 29, 33], [0, 1, 2, 5, 9, 13, 17, 40], [37]), HUMAN);
      var e = playCard(Sx, HUMAN, 3, tap, -1);
      ok(e && e.took.length === 3 && Sx.h.got[0].length === 4, 'T-11：手札から 4枚目（' + tap + 'を 指す）で 4枚 取れない');
    });
    /* T-11 山から 4枚目 */
    S = fixed(orderFrom([44, 45, 46, 20, 24, 28, 32, 36], [4, 8, 12, 16, 21, 25, 29, 33], [0, 1, 2, 5, 9, 13, 17, 40], [3]), HUMAN);
    playCard(S, HUMAN, 44, -1, -1); ev = drawCard(S);
    ok(ev && ev.took.length === 3 && S.h.got[0].indexOf(3) >= 0 && S.h.got[0].length === 4, 'T-11：山から 4枚目で 4枚 取れない');
    /* T-12 場に 2枚（種類ちがい）：手札から → えらんだ 方 */
    S = fixed(orderFrom([0, 44, 45, 20, 24, 28, 32, 36], [4, 8, 12, 16, 21, 25, 29, 33], [1, 2, 5, 9, 13, 17, 40, 41], [37]), HUMAN);
    ok(playCard(S, HUMAN, 0, 5, -1) === null, 'T-12：ちがう 月の 札を 取れた');
    ok(playCard(S, HUMAN, 0, -1, -1) === null, 'T-12：2枚の どちらも 指さずに 取れた');
    ev = playCard(S, HUMAN, 0, 2, -1);
    ok(ev && ev.took[0] === 2 && S.h.got[0].join() === '0,2' && fieldIds(S.h).indexOf(1) >= 0, 'T-12：手札から えらんだ 方を 取れない');
    /* T-12 山から（種類ちがい）→ 止まる／同じ 種類 → 自動 */
    S = fixed(orderFrom([44, 45, 46, 20, 24, 28, 32, 36], [4, 8, 12, 16, 21, 25, 29, 33], [1, 2, 5, 9, 13, 17, 40, 41], [0]), HUMAN);
    playCard(S, HUMAN, 44, -1, -1); ev = drawCard(S);
    ok(ev && ev.wait && S.h.step === 'pick' && S.h.flip === 0, 'T-12：山から 2枚（種類ちがい）で 止まらない');
    ok(drawCard(S) === null && playCard(S, HUMAN, 45, -1, -1) === null, 'T-12：選ぶ 場面で ほかの 手が 通った');
    ok(pickCard(S, HUMAN, 5) === null && pickCard(S, CPU, 1) === null, 'T-12：選ぶ 場面で ちがう 札・ちがう 人が 取れた');
    ok(pickCard(S, HUMAN, 1) && S.h.got[0].join() === '0,1' && pickCard(S, HUMAN, 2) === null && fieldIds(S.h).indexOf(2) >= 0, 'T-12：選ぶ 場面で 2枚 取れた／取れない');
    S = fixed(orderFrom([44, 45, 46, 20, 24, 28, 32, 36], [4, 8, 12, 16, 21, 25, 29, 33], [2, 3, 5, 9, 13, 17, 40, 41], [1]), HUMAN);
    playCard(S, HUMAN, 44, -1, -1); ev = drawCard(S);
    ok(ev && !ev.wait && S.h.got[0].length === 2 && S.h.step !== 'pick', 'T-12：同じ 種類の 2枚で 止まった');
    /* T-16 取れる 札が あるのに 空いた 席 → 何も 起きない／ふさがった 席にも 置けない */
    S = fixed(orderFrom([0, 44, 45, 20, 24, 28, 32, 36], [4, 8, 12, 16, 21, 25, 29, 33], [1, 5, 9, 13, 17, 40, 41, 37], [38]), HUMAN);
    ok(playCard(S, HUMAN, 0, -1, 10) === null && S.h.hands[0].length === 8, 'T-16：取れるのに 空いた 席に 置けた');
    ok(playCard(S, HUMAN, 44, 1, -1) === null, 'T-16：取れない 札で 場の 札を 取れた');
    ok(playCard(S, HUMAN, 44, -1, 3) === null, 'T-16：ふさがった 席に 置けた');
    ev = playCard(S, HUMAN, 44, -1, 9);
    ok(ev && S.h.seats[9][0] === 44, 'T-16：空いた 席に 置けない');
    /* T-10 場に 同じ月 4枚：配り直し（★100回 続けても 100回目で 入れかえて 始まる）*/
    var four = orderFrom([4, 8, 12, 16, 20, 24, 28, 32], [36, 40, 44, 5, 9, 13, 17, 21], [0, 1, 2, 3, 6, 10, 14, 18], []);
    var normal = orderFrom([4, 8, 12, 16, 20, 24, 28, 32], [36, 40, 44, 5, 9, 13, 17, 21], [0, 1, 2, 6, 10, 14, 18, 22], []);
    S = newMatch(3, 1); S.oya = CPU; S.phase = 'play'; startRound(S, [four, normal]);
    ok(S.h.tries === 2 && S.oya === CPU && S.h.turn === CPU && !HC.fieldFour(fieldIds(S.h)), 'T-10：4枚の 配り直しが 1回で すまない／親が 変わった');
    var many = []; for (var q = 0; q < 101; q++) many.push(four.slice());
    S = newMatch(3, 1); S.oya = HUMAN; S.phase = 'play'; startRound(S, many);
    ok(S.h.tries === 100 && S.h.swapped === 1 && !HC.fieldFour(fieldIds(S.h)) && S.h.deck.length === 24, 'T-10：100回 続けて 4枚でも 始まらない（' + S.h.tries + '）');
    checkRound(S, bad, 'T-10：');
    /* T-13 手役：人だけ／ロボットだけ／2人とも／場の 4枚と 同時 */
    S = fixed(orderFrom([0, 1, 2, 3, 4, 8, 12, 16], [5, 9, 13, 17, 20, 24, 28, 32], [6, 10, 14, 18, 21, 25, 29, 33], []), CPU);
    ok(S.phase === 'result' && S.h.res.w === HUMAN && S.h.res.pts === 6 && S.oya === HUMAN && S.pts[0] === 6, 'T-13：人の 手四が 6点・次の 親に ならない');
    S = fixed(orderFrom([5, 10, 14, 17, 20, 24, 28, 32], [0, 1, 4, 6, 8, 9, 12, 13], [7, 11, 15, 18, 21, 25, 29, 33], []), HUMAN);
    ok(S.phase === 'result' && S.h.res.w === CPU && S.h.res.yaku[0].key === 'kuttsuki' && S.h.res.hand.length === 8 && S.oya === CPU, 'T-13：ロボットの くっつき（手を 開く・次の 親）');
    var both = orderFrom([0, 1, 2, 3, 4, 8, 12, 16], [20, 21, 22, 23, 24, 28, 32, 36], [5, 9, 13, 17, 25, 29, 33, 37], []);
    S = newMatch(3, 1); S.oya = HUMAN; S.phase = 'play'; startRound(S, [both, normal]);
    ok(S.phase === 'play' && S.h.tries === 2 && S.pts.join() === '0,0' && S.oya === HUMAN, 'T-13：2人とも 手役で 配り直さない');
    var fourTey = orderFrom([4, 5, 6, 7, 8, 12, 16, 20], [24, 28, 32, 36, 40, 44, 9, 13], [0, 1, 2, 3, 10, 14, 17, 21], []);
    S = newMatch(3, 1); S.oya = HUMAN; S.phase = 'play'; startRound(S, [fourTey, normal]);
    ok(S.phase === 'play' && S.h.tries === 2, 'T-13：場の 4枚が 手役より 先に ならない');
    /* T-14 最後の 1枚で 役：自動で 勝負（★親の 8手目＝子に 1枚 のこる／子の 8手目）*/
    S = scene({ h0: [8], h1: [47], g0: [32], field: [9], deck: [36], moves: 14 });
    playCard(S, HUMAN, 8, 9, -1); drawCard(S);
    ok(S.phase === 'result' && S.h.res.kind === 'auto' && S.h.res.w === HUMAN && S.pts[0] === 5, 'T-14：親の 8手目の 役で 自動の 勝負に ならない');
    S = scene({ h0: [8], h1: [], g0: [32], field: [9], deck: [36], moves: 15 });
    playCard(S, HUMAN, 8, 9, -1); drawCard(S);
    ok(S.phase === 'result' && S.h.res.kind === 'auto', 'T-14：子の 8手目の 役で 自動の 勝負に ならない');
    /* T-7 こいこいの 後：自分 → 相手 → 自分（★点が 同じなら 選ばない・ふえたら また 選ぶ）*/
    S = scene({ h0: [3, 45], h1: [4, 20], g0: [8, 32], field: [2, 46], deck: [36, 37, 5] });
    playCard(S, HUMAN, 3, 2, -1); drawCard(S);
    ok(S.h.step === 'koi', 'T-7：花見が できたのに 選ばない');
    decide(S, HUMAN, true);
    ok(S.h.last[0] === 5 && S.h.koi[0] === 1 && S.h.turn === CPU, 'T-7：こいこいの 点が のこらない');
    playCard(S, CPU, 4, -1, -1); drawCard(S);
    ok(S.h.turn === HUMAN && S.h.step === 'play', 'T-7：相手の 手番の あとが おかしい');
    playCard(S, HUMAN, 45, 46, -1); drawCard(S);
    ok(S.h.step === 'play' && S.h.turn === CPU, 'T-7：点が 同じ（5）なのに また 選ばせた');
    S = scene({ h0: [28, 45], h1: [4, 20], g0: [8, 32, 3, 2], field: [29], deck: [36], koi: [1, 0], last: [5, 0] });
    playCard(S, HUMAN, 28, 29, -1); drawCard(S);
    ok(S.h.step === 'koi' && HC.total(S.h.got[0]) === 10, 'T-7：点が ふえた（5→10）のに 選ばない');
    decide(S, HUMAN, true);
    ok(S.h.koi[0] === 2 && S.h.last[0] === 10, 'T-8：2回目の こいこいで くらべる 点が 新しく ならない');
    /* T-6 T-8：倍 ―― 相手が こいこい中 ×2・7点 以上 ×2・重なって ×4・自分の こいこいでは 倍に ならない */
    S = scene({ h0: [0], h1: [4], g0: [8, 32], koi: [2, 3] }); finish(S, 0, 'shobu');
    ok(S.h.res.pts === 10 && S.h.res.xKoi && !S.h.res.x7, 'T-8：こいこい返しの 倍が ちがう（' + S.h.res.pts + '）');
    S = scene({ h0: [0], h1: [4], g0: [8, 28, 32], koi: [1, 0] }); finish(S, 0, 'shobu');
    ok(S.h.res.pts === 20 && S.h.res.x7 && !S.h.res.xKoi, 'T-8：自分の こいこいで 倍に なった（' + S.h.res.pts + '）');
    S = scene({ h0: [0], h1: [4], g0: [8, 28, 32], koi: [0, 1] }); finish(S, 0, 'shobu');
    ok(S.h.res.pts === 40, 'T-6：×4 に ならない（' + S.h.res.pts + '）');
    /* T-15 T-17：流れ（★こいこいした 人が いても）0点・親交代／月数で 終わる／同点は 引き分け */
    S = scene({ h0: [], h1: [], koi: [1, 0], turn: CPU }); S.oya = CPU; finish(S, -1, 'nagare');
    ok(S.oya === HUMAN && S.pts.join() === '0,0' && S.h.res.pts === 0, 'T-15：こいこいの ある 流れで 点／親が かわらない');
    var seenAuto = 0, seenImprove = 0, seenX4 = 0, seenKoiNagare = 0;
    for (var s = 1; s <= 300; s++) {
      var r = simMatch([3, 6, 12][s % 3], 9000 + s, null, { mistake: 0.1, onRound: function (Sr) {
        var rr = Sr.h.res;
        if (rr.kind === 'auto') seenAuto++;
        if (rr.w >= 0 && rr.koi[rr.w] > 0) seenImprove++;
        if (rr.xKoi && rr.x7) seenX4++;
        if (rr.kind === 'nagare' && (rr.koi[0] || rr.koi[1])) seenKoiNagare++;
      } });
      r.bad.forEach(function (x) { bad.push('試合' + s + '：' + x); });
      if (r.S.log.length !== r.S.months) bad.push('T-17：' + r.S.months + 'か月で 終わらない');
    }
    ok(seenAuto > 0 && seenImprove > 0, 'T-7／T-14：自動の 勝負・こいこいの 後の 勝負が 1回も 出ない');
    S = newMatch(3, 5); S.pts = [7, 7]; ok(matchWinner(S) === -1, 'T-17：同点が 引き分けに ならない');
    return { bad: bad, seen: { auto: seenAuto, improve: seenImprove, x4: seenX4, koiNagare: seenKoiNagare } };
  }

  var ENGINE = {
    TUNE: TUNE, HUMAN: HUMAN, CPU: CPU, SEATS: SEATS, core: HC,
    newMatch: newMatch, chooseOya: chooseOya, startRound: startRound, playCard: playCard, drawCard: drawCard, pickCard: pickCard,
    decide: decide, finish: finish, nextRound: nextRound, matchWinner: matchWinner,
    fieldIds: fieldIds, seatOf: seatOf, emptySeat: emptySeat,
    cpuView: cpuView, cpuMove: cpuMove, cpuThink: cpuThink, cpuPick: cpuPick, cpuKoi: cpuKoi, cpuStep: cpuStep, cpuRng: cpuRng, cardValue: cardValue,
    simMatch: simMatch, selfTest: selfTest, orderFrom: orderFrom, checkRound: checkRound, scene: scene
  };
  root.HANAFUDA_ENGINE = ENGINE;
  if (typeof module === 'object' && module.exports) module.exports = ENGINE;

  /* ★ Node（画面が ない ところ）では ここで おしまい。★ここから下は 1行も 動かない。 */
  if (typeof document === 'undefined') return;

  /* ============================================================
     ★★ ここから 画面（UI）★★
     ★ アトの 画面案（logs/T350_花札画面案_アト.md・見本 mihon.js の planTate／planYoko）を 型に した。
       ・組む → 測る → はみ出た 分だけ 低い 画面として 組み直す（最大 4回）
       ・札は 盤そのもの（★44px の 外・追記⑭）。★札 以外の ボタンは 全画面 44px 以上（見張り ⑥）
     ============================================================ */
  var $ = function (id) { return document.getElementById(id); };
  var E = ENGINE;
  var SAVE_KEY = 'bragekobo-hanafuda-v1';
  var R = TUNE.RATIO, NH = TUNE.NUM_H;

  /* ★★ 線 ―― ★JS の 名前つき 数 だけ（★CSS に 同じ 数を 書かない・追記⑥ 決まり2）★★
       TATE_H  560 … ★たけが これ 以上 なら ★よこ長でも「たて並び」（★PC も スマホたてと 同じ ―― 追記⑭）。
                     ★スマホよこ（9画面＋底：272・320・375・390・414・428）は どれも これより 低い ―― よこの 並べ方。
       LOW_H   320 … よこで これより 低い（★568×272 の 底）：帯を 細く・字を 小さく（★320 は またがない：320 は「低い」に 入らない）
       PC_W    900 … たてで はばが これ 以上（★パソコン）：まん中の 列（★はばは 札から 決める）・ハッピーを 大きく
       NARROW_W 360 … はば 320 の たて：左右の すき間を 6px に（★320 と 375 の あいだ） */
  var TATE_H = 560, LOW_H = 320, PC_W = 900, NARROW_W = 360, MIN_W = 320;
  var TAG_W = 148;
  var ROW_TAG_W = 172;   // ★T353：せまい よこを 詰める たての 1列の 場に した とき の 名札の 列（★「◯か月目」も 入る はば）       // ★よこ：名札の 列の はば（★CSS の --tagw に JS から 入れる）

  /* ============================================================
     ★ ハッピーの ことば（★画面の 言葉は ここ 1か所だけ ―― 見張り ⑤ が 全部 はかる）
     ============================================================ */
  var LINES = {
    title:     '同じ 月の 札を 合わせて 取ろう！',
    oyaPick:   'ふせた 札を 1枚 めくってね。',
    youOya:    'あなたが 親！ 先に 出すよ。',
    cpuOya:    'ロボットが 親。先に 出すよ。',
    myTurn:    '手札を 1枚 えらんでね。',
    mySel:     '同じ 月の 札を タップ。無ければ 空いた 席へ',
    pick:      'めくった 札と 同じ 月の 札を 1枚 えらんでね',
    kasane:    '重なった 札から 1枚 えらんでね',
    cpuTurn:   'ロボットの 番だよ。',
    koiAsk:    '役が できた！ どうする？',
    youKoi:    'こいこい！ もっと 大きな 役を ねらおう',
    cpuKoi:    'ロボットが こいこい！',
    cpuShobu:  'ロボットが 勝負！',
    autoShobu: '手札が ないので 勝負！',
    teyaku:    '手役！ 配られた 手札で 6点',
    win:       'やったね！',
    lose:      'つぎ がんばろ！',
    nagare:    '流れ！ 0点で 親が かわるよ。',
    winMatch:  'あなたの 勝ち！ やったね！',
    loseMatch: 'ロボットの 勝ち…つぎ がんばろ！',
    tieMatch:  '引き分け！ いい 勝負だったね。'
  };
  function say(k) { $('happyBubble').textContent = LINES[k] || k; $('happyBubble').dataset.k = k; }

  /* ── 部品 ─────────────────────────────────── */
  var S = null;                     // ★いまの 試合（★この まま sessionStorage に しまう）
  var monthsSel = 3;                // はじめの 画面で 選んだ 月数
  var sel = -1;                     // ★いま 選んで いる 手札（★強調は これ 1種類）
  var hold = null;                  // ★札が 動いて 見える 間の 見せ方（★中身は もう 進んで いる）
  var busy = false;                 // ★札が 動いて いる 間・ロボットの 番は 手札を 受け付けない（T-19）
  var timers = [], gen = 0, guardUntil = 0, lockTimer = 0, resultKind = null;
  var geo = { mode: 'tate' };
  var pageErrors = [];
  window.addEventListener('error', function (e) { pageErrors.push(String(e.message || e)); });

  function later(fn, ms) {
    var my = gen, id = setTimeout(function () {
      var k = timers.indexOf(id); if (k >= 0) timers.splice(k, 1);
      if (my === gen) fn();
    }, ms);
    timers.push(id);
    return id;
  }
  function cancelAll() { gen++; timers.forEach(clearTimeout); timers = []; hold = null; busy = false; if ($('kasaneWrap')) closeSpread(); }
  function randomSeed() { var a = new Uint32Array(1); try { crypto.getRandomValues(a); return a[0] >>> 0; } catch (e) { return (Math.random() * 4294967296) >>> 0; } }

  /* ============================================================
     ★ とちゅうの つづき（★sessionStorage ―― 17歩と 同じ。★タブを 閉じたら 消える）
     ★ 読み直しても ★同じ 配り・同じ 山の 順に 戻る（★引き直しに 使えない ―― T-18）
     ============================================================ */
  var store = null;
  try { sessionStorage.setItem('__hf_t', '1'); sessionStorage.removeItem('__hf_t'); store = sessionStorage; } catch (e) { store = null; }
  function save() { if (!store || !S) return; try { store.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* 遊びは 止めない */ } }
  function clearSave() { if (store) try { store.removeItem(SAVE_KEY); } catch (e) {} }
  function loadSave() {
    if (!store) return null;
    var s = null;
    try { s = JSON.parse(store.getItem(SAVE_KEY) || 'null'); } catch (e) { s = null; }
    if (!s) return null;
    var ok = false;
    try { ok = goodState(s); } catch (e) { ok = false; }
    if (!ok) { clearSave(); return null; }
    return s;
  }
  /* ★ しまった 中身が 決まりどおりか（★48枚が 1枚ずつ・手札と 山の 数・点の 合計・場面）*/
  function goodState(s) {
    if (!s || s.v !== 1 || HC.RULES.months.indexOf(s.months) < 0) return false;
    if (['oya', 'play', 'result', 'final'].indexOf(s.phase) < 0) return false;
    if (!Array.isArray(s.pts) || !Array.isArray(s.log) || !(s.no >= 0 && s.no <= s.months)) return false;
    var sum = [0, 0]; s.log.forEach(function (l) { if (l.w === 0 || l.w === 1) sum[l.w] += l.pts; });
    if (sum[0] !== s.pts[0] || sum[1] !== s.pts[1]) return false;
    if (s.phase === 'oya') return !!(s.oyagime && s.oyagime.cards && s.oyagime.cards.length === 2);
    if (s.phase === 'final') return s.log.length === s.months;
    var h = s.h; if (!h || !h.seats || h.seats.length !== SEATS) return false;
    var bad = []; E.checkRound(s, bad, ''); if (bad.length) return false;
    if (['play', 'draw', 'pick', 'koi', 'end'].indexOf(h.step) < 0 || (h.turn !== 0 && h.turn !== 1)) return false;
    if (s.phase === 'play' && h.step === 'end') return false;
    if (s.phase === 'result' && !h.res) return false;
    if (h.hands[0].length > 8 || h.hands[1].length > 8 || h.deck.length !== 24 - h.moves - (h.step === 'pick' ? 1 : 0)) return false;
    if (h.step === 'pick' && !(h.flip >= 0)) return false;
    return true;
  }

  /* ============================================================
     ★ 札の 部品
     ============================================================ */
  function cardHTML(id, o) {
    o = o || {};
    var c = CARDS[id];
    return '<div class="hc' + (o.num === false ? ' nonum' : '') + (o.cls ? ' ' + o.cls : '') + '" data-id="' + id + '" role="img" aria-label="' + c.month + '月 ' + c.name + '">' +
      '<svg class="face" viewBox="0 0 976 1600" aria-hidden="true" focusable="false"><use href="sprite.svg#hf' + id + '"/></svg>' +
      (o.num === false ? '' : '<span class="mn">' + c.month + '</span>') + '</div>';
  }
  function backHTML() { return '<span class="bk"></span>'; }
  function setHTML(el, html) { if (el.dataset.html !== html) { el.innerHTML = html; el.dataset.html = html; } }

  /* ★いまの 見え方（★中身＋動いて 見える 間の 上書き）*/
  function viewOf() {
    var h = S.h, v = { seats: h.seats.map(function (s) { return s.slice(); }), got: [h.got[0].slice(), h.got[1].slice()], flip: h.flip, top: -1,
      hand: h.hands[HUMAN].slice(), oppN: h.hands[CPU].length };
    if (hold) {
      if (hold.seats) v.seats = hold.seats.map(function (s) { return s.slice(); });
      if (hold.flip !== undefined) v.flip = hold.flip;
      if (hold.top != null) v.top = hold.top;
      if (hold.hide) [0, 1].forEach(function (p) { v.got[p] = v.got[p].filter(function (x) { return hold.hide.indexOf(x) < 0; }); });
    }
    return v;
  }
  var GRP = [['hikari', '光'], ['tane', 'タネ'], ['tan', '短冊'], ['kasu', 'カス']];
  function capHTML(ids) {
    return GRP.map(function (g) {
      var cs = ids.filter(function (i) { return CARDS[i].type === g[0]; });
      var grow = cs.length > 1 ? (cs.length - 1) * 0.62 + 0.3 : 0.3;
      return '<div class="grp" data-g="' + g[0] + '" style="flex:' + grow.toFixed(2) + ' 1 calc(29px + var(--cw))"><span class="gl">' + g[1] + '<b>' + cs.length + '</b></span><div class="pile">' +
        (cs.length ? cs.map(function (i) { return cardHTML(i, { num: false }); }).join('') : '<span class="empty"></span>') + '</div></div>';
    }).join('');
  }
  function oyaChip(p) { var o = S.oya === p; return '<span class="chip ' + (o ? 'oya' : 'ko') + '">' + (o ? '親' : '子') + '</span>'; }
  function totHTML(p) { return '<span class="tot"><small>合計</small><b data-pts="' + p + '">' + S.pts[p] + '</b>点</span>'; }
  /* ★「いま ◯点」。★こいこい中は その 札に 入れる（★こいこい中の いまの 点 ＝ こいこいと 言った ときの 点 ―― ふえたら また 選ぶ ので）*/
  function nowHTML(p, v, short) {
    var t = HC.total(v.got[p]);
    if (S.h.koi[p]) return '<span class="chip koi now" data-now="' + p + '">こいこい中 <b>' + t + '</b>点</span>';
    /* ★T357（トライ T356 ④）：前は「この月 いま ◯点」。★勝負の 箱の「いま 勝負すれば ◯点」（★倍の あと）と 同時に 出て 迷う ので、★名札は 倍の 前の「役 ◯点」*/
    return '<span class="now" data-now="' + p + '">役 <b>' + t + '</b>点</span>';
  }
  function roundHTML(short) { return '<b>' + Math.min(S.no + 1, S.months) + '</b>か月目／' + S.months + (short ? '' : 'か月'); }
  function deckHTML(v, w) {
    var fl = v.flip >= 0 ? cardHTML(v.flip) : '<div class="slot"></div>';
    return '<div class="stack"><span class="bk"></span><span class="dn">山</span></div><div class="flip" id="flipSlot">' + fl + '</div>';
  }

  /* ★T358（社長）：今 取れる 場の 札（★赤い 枠で 囲む）
       ・手札を 選んで いる とき：その 札と 同じ 月の 場の 札（★1〜3枚）
       ・山から めくった 札で 2枚から 選ぶ 場面：選べる 2枚
       ★人の 番 だけ・★札が 動いて 見える 間（hold）は 付けない */
  function canIds() {
    if (!S || S.phase !== 'play' || !S.h || hold) return [];
    var h = S.h;
    if (h.turn !== HUMAN) return [];
    if (h.step === 'play' && sel >= 0 && h.hands[HUMAN].indexOf(sel) >= 0) return HC.captureOptions(sel, E.fieldIds(h)).cands.slice();
    if (h.step === 'pick' && h.flip >= 0) return HC.captureOptions(h.flip, E.fieldIds(h)).cands.slice();
    return [];
  }
  function canCls(id, can, base) { return (base ? base + ' ' : '') + (can.indexOf(id) >= 0 ? 'is-can' : ''); }
  function renderBoard() {
    if (!S || !S.h) return;
    var v = viewOf(), yoko = geo.mode === 'yoko', c = geo.c, d = geo.d, can = canIds();
    /* 相手 */
    var inl = !!geo.inl && (yoko || d === 2);
    $('oppStrip').classList.toggle('inl', inl); $('meStrip').classList.toggle('inl', inl);
    var oppHand = c || yoko ? '<span class="hcount">手札 ' + v.oppN + '枚</span>' : '<div class="backs" id="oppBacks" aria-label="相手の 手札 ' + v.oppN + '枚">' + new Array(v.oppN + 1).join(backHTML()) + '</div>';
    if (inl) {
      /* ★よこ：1行目＝名前・合計／2行目＝親・いま（★ロボットが こいこい中の 間は 手札の 数を 出さない ―― 名札の 列に 入らない。★あなたの 手札と 同じか 1枚 少ない）*/
      setHTML($('oppTag'), '<div class="tl"><b class="nm">ロボット</b>' + totHTML(CPU) + '</div><div class="tl">' + oyaChip(CPU) + nowHTML(CPU, v, 1) + (S.h.koi[CPU] ? '' : oppHand) + '</div>');
      setHTML($('meTag'), '<div class="tl"><b class="nm">あなた</b>' + totHTML(HUMAN) + '</div><div class="tl">' + oyaChip(HUMAN) + nowHTML(HUMAN, v, 1) + (!yoko && !S.h.koi[HUMAN] ? '<span class="round" id="roundMe">' + roundHTML(1) + '</span>' : '') + '</div>');
    } else {
      setHTML($('oppTag'), '<div class="tag"><b class="nm">ロボット</b>' + oyaChip(CPU) + totHTML(CPU) + '</div>' + nowHTML(CPU, v, c) + oppHand);
      setHTML($('meTag'), '<div class="tag"><b class="nm">あなた</b>' + oyaChip(HUMAN) + totHTML(HUMAN) + '</div>' + (c && !yoko && !S.h.koi[HUMAN] ? '<span class="round" id="roundMe">' + roundHTML(1) + '</span>' : '') + nowHTML(HUMAN, v, c));
      /* ★詰める 形（はば 320）で あなたが こいこい中の 間だけ「◯か月目」の 札は 出さない（★「こいこい中」を 先に。★字が 入らない ―― 12か月目・3けたの 合計で 実測）*/
    }
    setHTML($('oppCap'), capHTML(v.got[CPU]));
    setHTML($('meCap'), capHTML(v.got[HUMAN]));
    /* 帯・柱の「◯か月目」*/
    setHTML($('roundTop'), roundHTML());
    $('roundTop').classList.toggle('hidden', yoko || c);
    if ($('roundSide')) setHTML($('roundSide'), roundHTML());
    /* 山（★7列目 の ときは 場の 中）*/
    setHTML($('deck'), d ? '' : deckHTML(v));
    /* 場 */
    var cells = [], i;
    /* ★T353（トライ T352 A）：前は 席の 並べ方の style を 後から 2つめの style として 足して いて、★重ねた 席の --k が 消えて 札が 7px に なって いた。
         ★style は 1つに まとめて 渡す。★重ねた 席は ふつうの 札の 8割の 大きさで 少し ずらして 重ねる（★席の どこを 押しても 上の 札が 取れる・下の 札は ずれた 所を 押す）*/
    function seatHTML(k, pos) {
      var ids = v.seats[k], st = pos ? ' style="' + pos + '"' : '';
      if (!ids.length) return '<div class="seat empty" data-seat="' + k + '"' + st + '></div>';
      if (v.top >= 0 && ids.indexOf(v.top) >= 0) {
        var base = ids.filter(function (x) { return x !== v.top; });
        return '<div class="seat" data-seat="' + k + '"' + st + '>' + base.map(function (x, j) { return cardHTML(x, { cls: 'under' + (j ? ' on-top2' : '') }); }).join('') + cardHTML(v.top, { cls: 'on-top' }) + '</div>';
      }
      if (ids.length > 1) return '<div class="seat kasane k' + Math.min(ids.length, 3) + '" data-seat="' + k + '"' + st + '>' + ids.map(function (x, j) { return cardHTML(x, { cls: canCls(x, can, 's' + Math.min(j, 2)) }); }).join('') + '</div>';
      return '<div class="seat" data-seat="' + k + '"' + st + '>' + cardHTML(ids[0], { cls: canCls(ids[0], can) }) + '</div>';
    }
    var deckCell = '<div class="stack"><span class="bk"></span><span class="dn">山</span></div>', flipCell = '<div class="flip" id="flipSlot">' + (v.flip >= 0 ? cardHTML(v.flip) : '<div class="slot"></div>') + '</div>';
    if (yoko) { for (i = 0; i < SEATS; i++) cells.push(seatHTML(i)); }
    else if (d === 2) {
      /* ★T353（トライ T352 E）：せまい よこ（480×320 など）は 場を 1列（12の 席＋山＋めくった 札）*/
      for (i = 0; i < SEATS; i++) cells.push(seatHTML(i, 'grid-column:' + (i + 1) + ';grid-row:1'));
      cells.push('<div class="seat deckcell" style="grid-column:13;grid-row:1">' + deckCell + '</div>');
      cells.push('<div class="seat deckcell" style="grid-column:14;grid-row:1">' + flipCell + '</div>');
    } else {
      for (i = 0; i < SEATS; i++) cells.push(seatHTML(i, 'grid-column:' + ((i % 6) + 1) + ';grid-row:' + (Math.floor(i / 6) + 1)));
      if (d) {
        cells.push('<div class="seat deckcell" style="grid-column:7;grid-row:1">' + deckCell + '</div>');
        cells.push('<div class="seat deckcell" style="grid-column:7;grid-row:2">' + flipCell + '</div>');
      }
    }
    setHTML($('field'), cells.join(''));
    /* 手札（★選んだ 札だけ 上がる）*/
    setHTML($('hand'), v.hand.map(function (x) { return cardHTML(x, { cls: x === sel ? 'is-sel' : '' }); }).join(''));
    layoutPiles();
    fitBrand();
  }
  /* ★題が 帯に 入らない ときだけ（★12か月目／12か月 の 札が 広い とき ―― はば 375 で 実測）：花と ねこを 消す → 題の 字を 小さく */
  function fitBrand() {
    var b = $('brand'); b.classList.remove('is-cut', 'is-cut2');
    if (b.scrollWidth > b.clientWidth + 0.5) b.classList.add('is-cut');
    if (b.scrollWidth > b.clientWidth + 0.5) b.classList.add('is-cut2');
  }
  /* ★束の 中の 重ね方（★アト layoutPiles：束の はばを 枚数で 配る → 札の 間を 詰める。★いちばん 新しい 札は いちばん 右・上）*/
  function layoutPiles() {
    var list = document.querySelectorAll('.pile');
    for (var q = 0; q < list.length; q++) {
      var p = list[q], cs = p.querySelectorAll('.hc');
      if (!cs.length) continue;
      var cw = parseFloat(getComputedStyle(p.closest('.cap')).getPropertyValue('--cw')) || 20;
      var room = p.clientWidth - cw;
      /* ★入らない ときは 古い 札から 下に かくれる（★枚数の 数字と いちばん 新しい 札は かならず 見える ―― 仕様書 T-21・追記③）*/
      var step = cs.length > 1 ? Math.max(0, Math.min(cw * 0.62, room / (cs.length - 1))) : 0;
      for (var i = 0; i < cs.length; i++) cs[i].style.left = (i * step).toFixed(2) + 'px';
    }
  }

  /* ============================================================
     ★★ 並べ方（★この 画面の 心臓）★★
     ============================================================ */
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function sceneOf() { if (!S) return 'title'; if (S.phase === 'oya') return 'oya'; return 'board'; }
  function placeChrome(yoko, c) {
    var app = $('app'), tb = $('topbar'), lr = $('logRow'), side = $('side'), st = $('stage');
    if (yoko) {
      if (tb.parentElement !== side) side.insertBefore(tb, side.firstChild);
      if (lr.parentElement !== side) side.insertBefore(lr, tb.nextSibling);
      var db = $('deckBox');
      if (!db) { db = document.createElement('div'); db.className = 'deckbox'; db.id = 'deckBox'; db.innerHTML = '<span class="round" id="roundSide"></span>'; }
      if (db.parentElement !== side) side.appendChild(db);
      if ($('deck').parentElement !== db) db.appendChild($('deck'));
    } else {
      if (tb.parentElement !== app) app.insertBefore(tb, app.firstChild);
      if (c) { if (lr.parentElement !== tb) tb.insertBefore(lr, $('brand')); }
      else if (lr.parentElement !== app) app.insertBefore(lr, st);
      if ($('deck').parentElement !== $('deckRow')) $('deckRow').insertBefore($('deck'), $('flipCap'));
    }
  }
  function measureChrome() { return { top: $('topbar').getBoundingClientRect().height, happy: $('logRow').parentElement === $('app') ? $('logRow').getBoundingClientRect().height : 0 }; }
  function tateMetrics(W, c, d, ch0) {
    var pc = W >= PC_W, padx = W <= NARROW_W ? 6 : 8;
    var IW = Math.min(W, pc ? 760 : W) - 2 * padx;
    var cols = d ? 7 : 6, fp = c ? 4 : 6, sg = c ? 3 : 4;
    var fwLim = Math.min(120, (IW - 2 * fp - (cols - 1) * sg) / cols);
    var hg = pc ? 6 : 3, hwLim = (IW - 7 * hg) / 8, g = c ? 4 : 6, padY = 6;
    function f(fw, boost) {
      var fh = fw * R, hw = Math.min(hwLim, Math.max(fw * 0.85, Math.min(44, hwLim))), hh = hw * R;
      var cw = c ? clamp(fw * 0.45, 16, 22) : Math.min(40, clamp(fw * 0.5, 20, 40) + (boost || 0));
      cw = Math.min(cw, (IW - (c ? 16 : 22) - 3 * (c ? 4 : 6)) / 4 - (c ? 27 : 29) - 4);   // ★4つの 束が 帯の はばに 入る まで
      var ch = cw * R;
      var stripH = c ? (20 + 2 + ch + 10) : (24 + 4 + ch + 15);
      var dw = clamp(fw * 0.6, 26, 52), dh = dw * R, deckH = d ? 0 : dh + 17;
      var fieldH = 2 * (fh + NH) + sg + 2 * fp, handH = hh + NH + TUNE.LIFT + 4;
      var nb = 2 + (d ? 0 : 1) + 2;
      var total = 2 * padY + ch0.top + (c ? 0 : g + ch0.happy) + g + stripH * 2 + deckH + fieldH + handH + (nb - 1) * g;
      return { fw: fw, fh: fh, hw: hw, hh: hh, cw: cw, ch: ch, dw: dw, dh: dh, stripH: stripH, deckH: deckH, fieldH: fieldH, handH: handH, total: total, nb: nb, g: g, padx: padx, cols: cols, fp: fp, sg: sg, hg: hg, IW: IW, pc: pc };
    }
    return { f: f, fwLim: fwLim };
  }
  function planTate(W, H, ch0, chC) {
    function tryC(c) {
      var cands = [], ch = c ? chC : ch0;
      [0, 1].forEach(function (d) {
        var t = tateMetrics(W, c, d, ch);
        for (var fw = Math.floor(t.fwLim * 2) / 2; fw >= (c ? 26 : 40); fw -= 0.5) {
          var m = t.f(fw); if (m.total <= H) { cands.push({ c: c, d: d, m: m }); break; }
        }
      });
      if (!cands.length) return null;
      cands.sort(function (a, b) { return (b.m.fw - (b.d ? 1 : 0)) - (a.m.fw - (a.d ? 1 : 0)); });
      var best = cands[0];
      if (!c) {   // ★たけが 余ったら 取り札を 大きく（★相手の 役を 読む 材料）。★少しは 空の 色を 残す
        var t2 = tateMetrics(W, c, best.d, ch);
        for (var b = 0.5; b <= 20; b += 0.5) { var m2 = t2.f(best.m.fw, b); if (m2.total > H - 40) break; best.m = m2; }
      }
      return best;
    }
    var p = tryC(0) || tryC(1);
    if (!p) { var t = tateMetrics(W, 1, 1, chC); p = { c: 1, d: 1, m: t.f(26), over: true }; }
    return p;
  }
  function planYoko(W, H, low) {
    var padx = 8, padY = 6, g = low ? 4 : 5;
    var sidew = clamp(Math.round(W * 0.22), 146, 210);
    var MW = W - 2 * padx - sidew - 8;
    var fp = 5, sg = 4, hg = 4, lift = 6;
    var fwLim = Math.min(90, (MW - 2 * fp - 11 * sg) / 12);
    var hwLim = (MW - 7 * hg) / 8;
    var Hm = H - 2 * padY - 3 * g, m = null;
    var cwW = (MW - TAG_W - 8 - 16 - 6 - 3 * 6) / 4 - (26 + 3) - 4;   // ★束の はば（★名札の 列 TAG_W の 残りを 4つに）
    /* ★左の 列が せまい よこ（★480×320 など ―― 320×480 を 回した 形）：名札は 束の 上の 1行（★詰める 形の 帯）*/
    var inl = cwW >= 16;
    if (!inl) cwW = (MW - 12 - 4 - 3 * 4) / 4 - (24 + 3) - 4;
    function strip(cw) { return inl ? Math.max(cw * R, low ? 34 : 40) + (low ? 8 : 12) : 20 + 2 + cw * R + 10; }
    for (var fw = Math.floor(fwLim * 2) / 2; fw >= 16; fw -= 0.5) {
      var cw = Math.min(clamp(fw * 0.55, 16, 30), cwW);
      var fieldH = fw * R + NH + 2 * fp;
      var rem = Hm - 2 * strip(cw) - fieldH - (NH + lift + 4);
      var hw = Math.min(hwLim, fw * 1.4, rem / R);
      var extra = rem - hw * R;
      if (extra > 0) cw = Math.min(40, cw + extra / 2 / R);
      cw = Math.min(cw, cwW);                                 // ★4つの 束が 名札の 右に 入る はば まで（★束に 札が 1枚は 入る）
      var rem2 = Hm - 2 * strip(cw) - fieldH - (NH + lift + 4);
      hw = Math.min(hw, rem2 / R);
      m = { fw: fw, fh: fw * R, hw: hw, hh: hw * R, cw: cw, ch: cw * R, stripH: strip(cw), fieldH: fieldH, g: g, padx: padx, sidew: sidew, MW: MW, fp: fp, sg: sg, hg: hg, lift: lift, cols: 12, low: low, inl: inl };
      if (hw >= fw * 0.95) break;
    }
    return { c: inl ? 0 : 1, d: 0, m: m, sidew: sidew };
  }
  function planRow(W, H, chC) {
    var padx = 8, IW = W - 2 * padx, fp = 4, sg = 3, cols = SEATS + 2, hg = 3, g = 4, padY = 6, m = null;
    var fwLim = (IW - 2 * fp - (cols - 1) * sg) / cols, hwLim = (IW - 7 * hg) / 8;
    for (var fw = Math.floor(fwLim * 2) / 2; fw >= 14; fw -= 0.5) {
      var cw = clamp(fw * 0.5, 14, 20), ch = cw * R, stripH = Math.max(ch, 34) + 8;   // ★名札は 束の 左（★よこと 同じ 細い 帯）
      var hw = Math.min(hwLim, fw * 1.1), hh = hw * R;
      var fieldH = fw * R + NH + 2 * fp, handH = hh + NH + TUNE.LIFT + 4;
      var total = 2 * padY + chC.top + g + 2 * stripH + fieldH + handH + 3 * g;
      m = { fw: fw, fh: fw * R, hw: hw, hh: hh, cw: cw, ch: ch, dw: fw, stripH: stripH, deckH: 0, fieldH: fieldH, handH: handH, total: total, nb: 4, g: g, padx: padx, cols: cols, fp: fp, sg: sg, hg: hg, IW: IW, pc: false, low: true, inl: true, tagw: ROW_TAG_W };
      if (total <= H) break;
    }
    return { c: 1, d: 2, m: m };
  }
  var layoutPasses = 0, planTries = 0;
  function layout() {
    var W0, H0, k = 0, app0 = $('app');
    /* ★先に 中身を 小さく して から 画面の はばを 読む（★前の 大きい 並べ方の 中身で 画面の はばが 広がらない ように）*/
    ['--fw', '--hw', '--cw', '--dw'].forEach(function (k2) { app0.style.setProperty(k2, '8px'); });
    app0.style.setProperty('--colw', '300px'); void app0.offsetWidth;
    do { W0 = screenW(); H0 = window.innerHeight; layoutOnce(); k++; }
    while (k < 3 && (screenW() !== W0 || window.innerHeight !== H0));
    layoutPasses = k;
    geo.W = screenW(); geo.H = window.innerHeight;
    if ($('koiWrap') && !$('koiWrap').classList.contains('hidden')) placeKoi();
    if (spreadSeat >= 0) placeSpread();
    if (!$('resultWrap').classList.contains('hidden')) fitResult();
    /* ★回した 直後は 画面の はばが あとから 変わる ことが ある（★スマホは 中身が 広いと 画面の はばを 中身に 合わせる ―― 17歩 T334）。
         ★並べた あと もう一度 はかり、★ちがって いたら 並べ直す（★見張り ⑦ が「並べ方の 画面の 大きさ」を 数える）*/
    clearTimeout(recheckTimer);
    recheckTimer = setTimeout(recheck, 160);
  }
  var recheckTimer = 0;
  function recheck() { if (screenW() !== geo.W || window.innerHeight !== geo.H) layout(); }
  /* ★画面の はば：★中身が 広く なって 画面（layout viewport）が 広がって も、★見えて いる はば（visualViewport × 拡大率）で 並べる */
  /* ★ただし サイトの いちばん せまい はば MIN_W（★body の min-width と 同じ 320）より せまくは 並べない（★568×272 を 回した 272×568 ―― 17歩と 同じ）*/
  function screenW() { var vv = window.visualViewport, w = window.innerWidth; if (vv && vv.width > 0) w = Math.min(w, Math.round(vv.width * (vv.scale || 1))); return Math.max(MIN_W, w); }
  function applyPlan(P, W, H, spare) {
    var app = $('app'), m = P.m, st = app.style;
    app.dataset.compact = P.c ? '1' : '0';
    app.dataset.deck7 = P.d ? '1' : '0';
    app.dataset.low = m.low ? '1' : '0';
    app.dataset.pc = m.pc ? '1' : '0';
    app.dataset.narrow = W <= NARROW_W ? '1' : '0';
    st.setProperty('--padx', m.padx + 'px');
    st.setProperty('--g', (m.g + (spare || 0)).toFixed(1) + 'px');
    st.setProperty('--fw', m.fw.toFixed(2) + 'px');
    st.setProperty('--hw', m.hw.toFixed(2) + 'px');
    st.setProperty('--cw', m.cw.toFixed(2) + 'px');
    st.setProperty('--dw', (m.dw || m.fw).toFixed(2) + 'px');
    st.setProperty('--hg', m.hg + 'px');
    st.setProperty('--sg', m.sg + 'px');
    st.setProperty('--fp', m.fp + 'px');
    st.setProperty('--lift', (m.lift || TUNE.LIFT) + 'px');
    st.setProperty('--cols', m.cols);
    st.setProperty('--bw', clamp(m.cw * 0.55, 12, 20).toFixed(1) + 'px');
    if (P.sidew) st.setProperty('--sidew', P.sidew + 'px');
    st.setProperty('--tagw', (m.tagw || TAG_W) + 'px');
    var colw = geo.mode === 'yoko' ? 0 : (m.pc ? Math.max(420, Math.ceil(Math.max(6 * m.fw + 5 * m.sg + 2 * m.fp + (P.d ? m.fw + m.sg : 0), 8 * m.hw + 7 * m.hg) + 2 * m.padx + 48)) : W);
    st.setProperty('--colw', colw ? colw + 'px' : 'none');
  }
  function layoutOnce() {
    var app = $('app'), W = screenW(), H = window.innerHeight, sc = sceneOf();
    /* ★たけは 器（100svh）の 実寸も 見る（★Safari の 帯が 出て いる とき・画面が はば 320 より せまく 縮めて 見せる とき は 器の 方が 低い）*/
    if (app.clientHeight > 100) H = Math.min(H, app.clientHeight);
    var inBoard = sc === 'board', yoko = inBoard && W > H && H < TATE_H, rowMode = false;
    /* ★T353（トライ T352 E）：せまい よこ（★名札を 束の 左に 置けない ―― 480×320 など）は ★柱を やめて 詰める たての 形・場は 1列（14列）。
         ★取り札の 段を 細く して 場の 札を 大きく（★前は 場 21px・取り札 30px）*/
    if (yoko && !planYoko(W, H, H < LOW_H).m.inl) { yoko = false; rowMode = true; }
    geo.mode = yoko ? 'yoko' : 'tate';
    app.dataset.mode = geo.mode;
    app.classList.toggle('in-board', inBoard);
    $('btnQuitGame').classList.toggle('hidden', sc === 'title');
    if (!inBoard) {
      placeChrome(false, false);
      app.dataset.compact = '0'; app.dataset.deck7 = '0'; app.dataset.low = '0';
      app.dataset.pc = W >= PC_W ? '1' : '0'; app.dataset.narrow = W <= NARROW_W ? '1' : '0';
      app.style.setProperty('--padx', (W <= NARROW_W ? 6 : 8) + 'px'); app.style.setProperty('--g', '6px');
      app.style.setProperty('--colw', (W >= PC_W ? 560 : W) + 'px');
      $('roundTop').classList.add('hidden');
      if (sc === 'title') fitTitle(); else fitOya();
      return;
    }
    $('roundTop').classList.toggle('hidden', yoko);
    if (yoko) {
      placeChrome(true, false);
      var low = H < LOW_H;
      var P = planYoko(W, H, low);
      geo.c = P.c; geo.d = 0; geo.low = low; geo.inl = P.m.inl;
      P.m.dw = Math.max(24, Math.min((P.sidew - 20) / 2, 56));
      applyPlan(P, W, H, 0);
      renderBoard();
      /* ★柱の 山：残りの たけで 大きさを 決める */
      var side = $('side'), used = 0;
      [$('topbar'), $('logRow'), $('roundSide')].forEach(function (e) { if (e) used += e.getBoundingClientRect().height; });
      var dw = Math.max(20, Math.min((P.sidew - 28) / 2, 56, (H - 12 - used - 6 * 3 - 12 - 6 - NH - 18) / R));
      app.style.setProperty('--dw', dw.toFixed(2) + 'px');
      geo.m = P.m; geo.dw = dw;
      layoutPiles();
      return;
    }
    /* たて：まず ふつうの 帯で 測り、★詰める 形（ハッピーを 帯の 中）でも 測る */
    placeChrome(false, false); app.dataset.compact = '0';
    var ch0 = measureChrome();
    placeChrome(false, true); app.dataset.compact = '1';
    var chC = measureChrome();
    var Hfit = H, P2 = null;
    for (var k = 0; k < 4; k++) {
      P2 = rowMode ? planRow(W, Hfit, chC) : planTate(W, Hfit, ch0, chC);
      geo.c = P2.c; geo.d = P2.d; geo.low = P2.m.low ? 1 : 0; geo.inl = !!P2.m.inl;
      placeChrome(false, !!P2.c);
      var spare = P2.over ? 0 : Math.max(0, Hfit - P2.m.total);
      var useFl = spare > 44 && !P2.c;
      var gAdd = Math.min(4, Math.max(0, spare - (useFl ? 40 : 0)) / (P2.m.nb + 2));
      applyPlan(P2, W, H, gAdd);
      renderBoard();
      $('spacer').classList.toggle('hidden', !useFl);
      var bottom = $('hand').getBoundingClientRect().bottom;
      var over = bottom + 6 - H;
      planTries = k + 1;
      if (over <= 0.5) break;
      Hfit -= Math.ceil(over);
    }
    geo.m = P2.m; geo.dw = P2.m.dw;
  }
  /* ★T353（トライ T352 B）：まん中 寄せの 箱は はみ出しが 上下に 分かれ、★scrollHeight にも 出ない（★実測：812×375 で 中身 249px・箱 203px でも 同じ 数）。
       ★測る 間だけ 上 寄せに して、★いちばん 下の 子の 下はし が 箱の 中に あるかで はかる */
  function overDown(el) {
    el.style.justifyContent = 'flex-start'; el.style.alignContent = 'flex-start';
    var r = el.getBoundingClientRect(), cs = getComputedStyle(el), bottom = r.top;
    for (var i = 0; i < el.children.length; i++) {
      var ch = el.children[i], cc = getComputedStyle(ch);
      if (cc.display === 'none' || cc.position === 'absolute') continue;
      bottom = Math.max(bottom, ch.getBoundingClientRect().bottom);
    }
    var inner = r.bottom - parseFloat(cs.borderBottomWidth) - parseFloat(cs.paddingBottom);
    el.style.justifyContent = ''; el.style.alignContent = '';
    return bottom - inner;
  }
  function fitTitle() {
    var ts = $('titleScreen');
    ts.classList.remove('is-tight', 'is-tighter');
    if (overDown(ts) > 0.5) ts.classList.add('is-tight');
    if (overDown(ts) > 0.5) ts.classList.add('is-tighter');
  }
  function fitOya() {
    var os = $('oyaScreen');
    var ow = 90;
    os.classList.remove('is-tight');
    os.style.setProperty('--ow', ow + 'px');
    for (var k = 0; k < 30 && overDown(os) > 0.5 && ow > 48; k++) { ow -= 4; os.style.setProperty('--ow', ow + 'px'); }
    if (overDown(os) > 0.5) os.classList.add('is-tight');   // ★低い 画面：題を わざと 消して 字を 1行に（★ハッピーの ことばが ある）
    for (k = 0; k < 30 && overDown(os) > 0.5 && ow > 34; k++) { ow -= 2; os.style.setProperty('--ow', ow + 'px'); }
    geo.ow = ow;
  }

  /* ============================================================
     ★ 場面
     ============================================================ */
  function showOnly(id) {
    ['titleScreen', 'oyaScreen', 'board'].forEach(function (k) { $(k).classList.toggle('hidden', k !== id); });
  }
  function showTitle() {
    cancelAll(); S = null; sel = -1; clearSave();
    hideKoi(); hideResult();
    showOnly('titleScreen');
    say('title');
    layout();
  }
  function setLen(n) {
    monthsSel = n;
    ['btnM3', 'btnM6', 'btnM12'].forEach(function (id) {
      var on = +$(id).dataset.len === n;
      $(id).classList.toggle('is-on', on); $(id).setAttribute('aria-checked', on ? 'true' : 'false');
    });
  }
  function startMatch(months, seed) {
    cancelAll(); hideKoi(); hideResult(); sel = -1;
    S = E.newMatch(months, seed == null ? randomSeed() : seed);
    save();
    showOya();
  }
  function oyaCardHTML(i) {
    var o = S.oyagime;
    if (o.pick < 0) return backHTML();
    var mine = o.cards[o.pick], his = o.cards[1 - o.pick], id = i === o.pick ? mine : his;
    return cardHTML(id) + '<span class="who">' + (i === o.pick ? 'あなた' : 'ロボット') + '</span>';
  }
  function showOya() {
    showOnly('oyaScreen');
    var o = S.oyagime;
    [0, 1].forEach(function (i) { var b = $('btnOya' + i); b.innerHTML = oyaCardHTML(i); b.disabled = o.pick >= 0; });
    if (o.pick < 0) { $('oyaMsg').textContent = ''; say('oyaPick'); }
    else {
      $('oyaMsg').textContent = S.oya === HUMAN ? 'あなたが 親です！' : 'ロボットが 親です。';
      say(S.oya === HUMAN ? 'youOya' : 'cpuOya');
      busy = true;
      later(function () { busy = false; E.startRound(S); save(); enterBoard(); }, TUNE.OYA_SHOW);
    }
    layout();
  }
  function onOya(i) {
    if (!S || S.phase !== 'oya' || S.oyagime.pick >= 0 || busy) return;
    if (!E.chooseOya(S, i)) return;
    save();
    showOya();
  }
  function enterBoard() {
    showOnly('board'); sel = -1; hold = null;
    layout();
    if (S.phase === 'result') {
      if (S.h.res.kind === 'teyaku') { say('teyaku'); busy = true; later(showResult, 900); }
      else showResult();
      return;
    }
    if (S.phase === 'final') { showFinal(); return; }
    next();
  }
  /* ★次に 何を するか（★中身の 状態 だけで 決める ―― 読み直しても 同じ）*/
  function next() {
    if (!S) return;
    if (S.phase === 'result') { showResult(); return; }
    if (S.phase === 'final') { showFinal(); return; }
    var h = S.h;
    renderBoard();
    if (h.step === 'draw') { busy = true; later(doDraw, 250); return; }
    if (h.turn === CPU) {
      if (h.step === 'play') cpuTurn();
      else if (h.step === 'pick') { busy = true; later(function () { var pre = preSeats(), e = E.cpuStep(S, CPU); save(); showTake(e, pre); }, 450); }
      else afterTurnUI(null);                                        // ★'koi'（★読み直した とき）
      return;
    }
    if (h.step === 'koi') { busy = true; showKoi(); return; }
    busy = false;
    if (h.step === 'pick') { say('pick'); return; }
    say(sel >= 0 ? 'mySel' : 'myTurn');
  }
  function preSeats() { return S.h.seats.map(function (s) { return s.slice(); }); }
  function withTop(seats, targetId, top) {
    var out = seats.map(function (s) { return s.slice(); });
    for (var i = 0; i < out.length; i++) if (out[i].indexOf(targetId) >= 0) { out[i].push(top); break; }
    return out;
  }
  /* ★手札から 出した あと（★取った ときは 場の 札に 重ねて 見せる）*/
  function afterPlay(ev, pre) {
    if (ev.took.length) {
      hold = { seats: withTop(pre, ev.took[0], ev.card), top: ev.card, hide: [ev.card].concat(ev.took) };
      renderBoard();
      later(function () { hold = null; renderBoard(); doDraw(); }, TUNE.SHOW_PLAY);
    } else { renderBoard(); later(doDraw, 200); }
  }
  function doDraw() {
    if (!S || S.phase !== 'play' || S.h.step !== 'draw') { next(); return; }
    busy = true;
    var pre = preSeats(), ev = E.drawCard(S);
    save();
    hold = { seats: pre, flip: ev.card, hide: [ev.card].concat(ev.took) };
    renderBoard();
    later(function () {
      if (ev.wait) {
        hold = null; renderBoard();
        if (ev.p === CPU) later(function () { var pre2 = preSeats(), e2 = E.cpuStep(S, CPU); save(); showTake(e2, pre2); }, 450);
        else { busy = false; say('pick'); }
        return;
      }
      showTake(ev, pre);
    }, TUNE.SHOW_FLIP);
  }
  /* ★めくった 札が 場の 札に 重なって 見える → 束へ */
  function showTake(ev, pre) {
    if (ev && ev.took && ev.took.length) {
      hold = { seats: withTop(pre, ev.took[0], ev.card), top: ev.card, flip: -1, hide: [ev.card].concat(ev.took) };
      renderBoard();
      later(function () { hold = null; afterTurnUI(ev); }, TUNE.SHOW_TAKE);
    } else { hold = null; afterTurnUI(ev); }
  }
  function afterTurnUI(ev) {
    renderBoard();
    if (S.phase === 'result') {
      var r = S.h.res;
      if (r.kind === 'auto') say(r.w === HUMAN ? 'autoShobu' : 'cpuShobu');
      busy = true; later(showResult, 700);
      return;
    }
    if (S.h.step === 'koi' && S.h.turn === CPU) {
      busy = true;
      later(function () {
        var r2 = E.cpuStep(S, CPU); save();
        if (S.phase === 'result') { say('cpuShobu'); renderBoard(); later(showResult, 800); }
        else { say(r2 && r2.koi ? 'cpuKoi' : 'cpuTurn'); renderBoard(); later(next, 900); }
      }, 600);
      return;
    }
    next();
  }
  function cpuTurn() {
    busy = true; say('cpuTurn');
    later(function () {
      if (!S || S.phase !== 'play' || S.h.turn !== CPU || S.h.step !== 'play') { next(); return; }
      var pre = preSeats(), ev = E.cpuStep(S, CPU);
      save();
      afterPlay(ev, pre);
    }, TUNE.CPU_WAIT);
  }

  /* ── 人の 指 ── */
  function now() { return performance.now(); }
  function onHand(e) {
    var el = e.target.closest ? e.target.closest('.hc') : null;
    if (!el || !S || S.phase !== 'play' || busy || now() < guardUntil) return;
    var h = S.h; if (h.turn !== HUMAN || h.step !== 'play') return;
    var id = +el.dataset.id; if (h.hands[HUMAN].indexOf(id) < 0) return;
    /* ★T358：選んで いる 札を もう一度 押すと 選びを やめる（★赤い 枠も 消える）*/
    if (id === sel) { sel = -1; say('myTurn'); renderBoard(); return; }
    sel = id;
    say('mySel');
    renderBoard();
  }
  function onField(e) {
    if (!S || S.phase !== 'play' || busy || now() < guardUntil) return;
    var h = S.h; if (h.turn !== HUMAN) return;
    var cardEl = e.target.closest ? e.target.closest('.hc') : null, seatEl = e.target.closest ? e.target.closest('.seat') : null;
    if (seatEl && seatEl.classList.contains('deckcell')) return;
    /* ★T355（社長「①1」）：重なった 席を 押したら ★選ぶ 必要が ある とき だけ 2〜3枚を 横に 並べて 選ばせる（★ならべ窓）。
         ★選ぶ 必要が ない とき（★3枚 ぜんぶ 取る・月が ちがう）は ふつうの 席と 同じ（★どこを 押しても 上の 札）*/
    if (seatEl && seatEl.classList.contains('kasane')) {
      var sIds = h.seats[+seatEl.dataset.seat] || [], base = h.step === 'pick' ? h.flip : sel;
      if ((h.step === 'pick' || (h.step === 'play' && sel >= 0)) && base >= 0) {
        var opK = HC.captureOptions(base, E.fieldIds(h));
        if (opK.kind === 'choose' && sIds.indexOf(opK.cands[0]) >= 0 && sIds.indexOf(opK.cands[1]) >= 0) { openSpread(+seatEl.dataset.seat); return; }
      }
      if (!cardEl) cardEl = seatEl.lastElementChild;
    }
    var pick = cardEl && seatEl ? +cardEl.dataset.id : -1, seat = seatEl && seatEl.classList.contains('empty') ? +seatEl.dataset.seat : -1;
    takeWith(pick, seat, seatEl);
  }
  /* ★場の 札（または 空いた 席）で 取る・置く ―― ★ならべ窓で 選んだ ときも ここ */
  function takeWith(pick, seat, seatEl) {
    if (!S || S.phase !== 'play' || busy) return;
    var h = S.h; if (h.turn !== HUMAN) return;
    if (h.step === 'pick') {
      if (pick < 0) return;
      var pre = preSeats(), ev = E.pickCard(S, HUMAN, pick);
      if (!ev) return;                                             // ★ちがう 月の 札 → 何も 起きない
      busy = true; save(); showTake(ev, pre);
      return;
    }
    if (h.step !== 'play' || sel < 0) return;
    /* ★席が ぜんぶ ふさがって いて 置く しか ない とき（★0.02%）：どの 席を 指しても 左上から */
    var op = HC.captureOptions(sel, E.fieldIds(h));
    if (op.kind === 'place' && E.emptySeat(h) < 0 && seatEl) { seat = -1; pick = -1; }
    else if (op.kind === 'place' && seat < 0) return;
    var pre2 = preSeats(), card = sel;
    var ev2 = op.kind === 'place' ? E.playCard(S, HUMAN, card, -1, E.emptySeat(h) < 0 ? -1 : seat) : E.playCard(S, HUMAN, card, pick, -1);
    if (!ev2) return;                                              // ★取れる のに 空いた 席／ちがう 月 → 何も 起きない（T-16）
    sel = -1; busy = true; save();
    afterPlay(ev2, pre2);
  }

  /* ============================================================
     ★ ならべ窓（★T355）：重なった 席の 札を 横に 並べて 選ぶ。★中身は 変えない（★画面だけ）。
       ★読み直し・やめる で 消える（★選ぶ 前の 形に 戻る）。★回すと 並べ直す。★まわりを 押すと 閉じる。
     ============================================================ */
  var spreadSeat = -1;
  var spreadAt = 0;
  function openSpread(k) {
    spreadSeat = k;
    /* ★T357：窓は 席の 上に 出るので、★2回 続けて 押すと 2打目が 窓の 札に 当たって 選ぶ 前に 取って いた。★開いて 0.3秒は 押せない */
    spreadAt = now(); guardUntil = Math.max(guardUntil, spreadAt + TUNE.SPREAD_GUARD);
    var ids = S.h.seats[k], w = $('kasaneWrap');
    var can = canIds();
    $('kasaneCards').innerHTML = ids.map(function (x) { return cardHTML(x, { cls: canCls(x, can) }); }).join('');   // ★T358：選べる 札は 赤い 枠
    w.classList.remove('hidden');
    say('kasane');
    placeSpread();
  }
  function closeSpread() { if (spreadSeat < 0 && $('kasaneWrap').classList.contains('hidden')) return; spreadSeat = -1; $('kasaneWrap').classList.add('hidden'); }
  function placeSpread() {
    if (spreadSeat < 0) return;
    var seatEl = $('field').querySelector('[data-seat="' + spreadSeat + '"]'), box = $('kasaneBox');
    if (!seatEl || !S || !S.h.seats[spreadSeat] || S.h.seats[spreadSeat].length < 2) { closeSpread(); return; }
    var n = S.h.seats[spreadSeat].length, W = window.innerWidth, H = window.innerHeight, fw = geo.m ? geo.m.fw : 40;
    /* ★札の はば：場の 札の 1.2倍（★56px まで）。★画面の はばに 入らない ときは 入る 大きさ に */
    var ksw = Math.min(Math.max(fw * 1.2, fw), 56, (W - 16 - 24 - (n - 1) * 10) / n);
    ksw = Math.min(ksw, (H - 16 - 24 - 20 - NH) / R);
    box.style.setProperty('--ksw', ksw.toFixed(1) + 'px');
    var sr = seatEl.getBoundingClientRect(), br = box.getBoundingClientRect();
    var left = Math.max(8, Math.min(W - 8 - br.width, sr.left + sr.width / 2 - br.width / 2));
    var top = Math.max(8, Math.min(H - 8 - br.height, sr.top + sr.height / 2 - br.height / 2));
    box.style.left = left.toFixed(1) + 'px'; box.style.top = top.toFixed(1) + 'px';
  }
  function onSpread(e) {
    var c = e.target.closest ? e.target.closest('#kasaneCards .hc') : null, k = spreadSeat;
    closeSpread();
    if (!c || k < 0 || !S || S.phase !== 'play') { if (S && S.phase === 'play') say(S.h.step === 'pick' ? 'pick' : (sel >= 0 ? 'mySel' : 'myTurn')); return; }
    takeWith(+c.dataset.id, -1, $('field').querySelector('[data-seat="' + k + '"]'));
  }

  /* ============================================================
     ★ 勝負か こいこいか（★場から 下に だけ まく・相手の 束は 見えた まま）
     ============================================================ */
  function payNow(p) { var h = S.h; return HC.pay(HC.judge(h.got[p]), h.koi[1 - p] > 0); }
  function yakuLI(y, mw) {
    var named = ['tane', 'tan', 'kasu'].indexOf(y.key) < 0;
    var cs = named ? '<span class="mini" style="--mw:' + mw + 'px">' + y.cards.map(function (x) { return cardHTML(x, { num: false }); }).join('') + '</span>' : '<small>' + y.cards.length + '枚</small>';
    /* ★T353（トライ T352 C・仕様書 §3-1）：カスの 役に 菊に盃が 入って いる ときだけ 1回 添える（★取り札の カスの 束の 数と ちがう わけ）*/
    var note = y.key === 'kasu' && y.cards.indexOf(HC.ID.SAKE) >= 0 ? '<small class="sake-note">（菊に盃を ふくむ）</small>' : '';
    return '<li><span>' + y.name + '</span>' + cs + note + '<i>' + y.pts + '点</i></li>';
  }
  function multHTML(pay, tag) {
    var out = [];
    if (pay.x7) out.push('<' + tag + '>7点 以上なので <b>×2</b></' + tag + '>');
    if (pay.xKoi) out.push('<' + tag + '>相手が こいこい中なので <b>×2</b></' + tag + '>');
    return out.join('');
  }
  function showKoi() {
    var h = S.h, j = HC.judge(h.got[HUMAN]), pay = payNow(HUMAN);
    $('koiYaku').innerHTML = j.yaku.map(function (y) { return yakuLI(y, 20); }).join('');
    $('koiMult').innerHTML = multHTML(pay, 'p');
    $('koiPts').textContent = pay.pts + '点';
    $('koiPts').dataset.pts = pay.pts;
    $('koiWrap').classList.remove('hidden');
    say('koiAsk');
    placeKoi();
    lockKoi();
  }
  function lockKoi() { var b = [$('btnShobu'), $('btnKoi')]; b.forEach(function (x) { x.disabled = true; }); later(function () { b.forEach(function (x) { x.disabled = false; }); }, 350); }
  function hideKoi() { $('koiWrap').classList.add('hidden'); }
  function placeKoi() {
    var kw = $('koiWrap'); if (kw.classList.contains('hidden')) return;
    var f = $('field').getBoundingClientRect(), hd = $('hand').getBoundingClientRect(), mc = $('mainCol').getBoundingClientRect();
    var top = f.top - 2, bottom = Math.min(window.innerHeight, hd.bottom + 2);
    var left = mc.left - 2, right = mc.right + 2;
    kw.style.cssText = 'top:' + top + 'px;left:' + Math.max(0, left) + 'px;width:' + (Math.min(window.innerWidth, right) - Math.max(0, left)) + 'px;height:' + (bottom - top) + 'px';
    kw.classList.remove('is-low', 'is-lower', 'is-cols');
    var bx = $('koiBox');
    [0, 1, 2, 3].forEach(function (k) {
      if (bx.scrollHeight <= bx.clientHeight + 0.5 && bx.scrollWidth <= bx.clientWidth + 0.5) return;
      if (k === 0) kw.classList.add('is-low');
      if (k === 1) kw.classList.add('is-lower');
      if (k === 2 && (right - left) > 460) kw.classList.add('is-cols');
    });
    bx.querySelectorAll('.mini').forEach(function (m) { m.style.setProperty('--mw', kw.classList.contains('is-low') ? '16px' : '20px'); });
  }
  function onDecide(koi) {
    if (!S || S.phase !== 'play' || S.h.step !== 'koi' || S.h.turn !== HUMAN) return;
    E.decide(S, HUMAN, koi); save();
    hideKoi(); armGuard();
    if (S.phase === 'result') { showResult(); return; }
    say('youKoi'); renderBoard();
    busy = true; later(next, 700);
  }

  /* ============================================================
     ★ 月の おわり／試合の おわり の 箱
     ============================================================ */
  function openResult(title, cls, sub, body, nextLabel, fin) {
    hideKoi();
    $('resultSub').textContent = sub;
    $('resultTitle').textContent = title;
    $('resultTitle').className = 'result-title' + (cls ? ' ' + cls : '');
    $('resultBody').innerHTML = body;
    $('btnNext').innerHTML = nextLabel;
    $('btnToTitle').classList.toggle('hidden', !fin);
    $('btnQuit').classList.toggle('hidden', !fin);
    $('resultWrap').classList.remove('hidden');
    fitResult();
    lockResult();
  }
  function showResult() {
    if (!S || S.phase !== 'result') return;
    busy = true; resultKind = 'round';
    renderBoard();                                   // ★帯の 合計を 先に 新しく（★箱の うしろも 同じ 数）
    var h = S.h, r = h.res, no = S.no + 1, body = '', title, cls = '';
    var last = S.no + 1 >= S.months;
    if (r.w < 0) {
      title = '流れ'; cls = 'is-draw';
      body = '<p class="rs-nagare">流れ ― 0点。親が かわります</p>';
      say('nagare');
    } else {
      title = r.w === HUMAN ? 'あなたの 勝ち！' : 'ロボットの 勝ち'; cls = r.w === HUMAN ? '' : 'is-lose';
      if (r.kind === 'teyaku') body += '<div class="rs-hand" style="--mw:26px">' + r.hand.map(function (x) { return cardHTML(x); }).join('') + '</div>';
      body += '<ul class="rs-yaku">' + r.yaku.map(function (y) { return r.kind === 'teyaku' ? '<li><span>' + y.name + '</span><i>' + y.pts + '点</i></li>' : yakuLI(y, 22); }).join('') + '</ul>';
      if (r.x7) body += '<p class="rs-line"><span>7点 以上</span><span>×2</span></p>';
      if (r.xKoi) body += '<p class="rs-line"><span>' + (r.w === HUMAN ? '相手' : 'あなた') + 'が こいこい中</span><span>×2</span></p>';
      body += '<p class="rs-sum"><span>この月の 点</span><b data-pts="' + r.pts + '">' + r.pts + '点</b></p>';
      say(r.w === HUMAN ? 'win' : 'lose');
      if (r.w === HUMAN) { var cat = $('happyCat'); cat.classList.remove('is-jump'); void cat.getBoundingClientRect(); cat.classList.add('is-jump'); }
    }
    body = '<div class="rs-col">' + body + '</div><div class="rs-col">';   // ★よこに 広い 画面では 左＝役と 点・右＝合計（fitResult の is-cols）
    body += '<div class="rs-pts"><span>あなた <b data-tot="0">' + S.pts[0] + '点</b>' + (r.w === HUMAN ? ' <span class="up">＋' + r.pts + '</span>' : '') + '</span>' +
      '<span>ロボット <b data-tot="1">' + S.pts[1] + '点</b>' + (r.w === CPU ? ' <span class="up">＋' + r.pts + '</span>' : '') + '</span></div>';
    body += '<p class="rs-left">' + (last ? '次で 試合の 結果' : '残り ' + (S.months - no) + 'か月 ・ 次の 親は ' + (S.oya === HUMAN ? 'あなた' : 'ロボット')) + '</p></div>';
    openResult(title, cls, no + 'か月目の 結果', body, last ? '結果を 見る <b>▶</b>' : '次の 月へ <b>▶</b>', false);
  }
  function showFinal() {
    if (!S) return;
    busy = true; resultKind = 'final';
    if (S.h) renderBoard();
    var w = E.matchWinner(S);
    var title = w === HUMAN ? 'あなたの 勝ち！' : w === CPU ? 'ロボットの 勝ち' : '引き分け';
    var body = '<div class="rs-col"><div class="rs-pts"><span>あなた <b data-tot="0">' + S.pts[0] + '点</b></span><span>ロボット <b data-tot="1">' + S.pts[1] + '点</b></span></div></div>';
    body += '<div class="rs-col"><ul class="rs-log">' + S.log.map(function (l) {
      var who = l.w === HUMAN ? 'あなた' : l.w === CPU ? 'ロボット' : '';
      return '<li><span>' + l.no + 'か月目：' + (l.w < 0 ? '流れ' : (l.names.join('・') || '') ) + '</span><span>' + (l.w < 0 ? '0点' : who + ' ' + l.pts + '点') + '</span></li>';
    }).join('') + '</ul></div>';
    say(w === HUMAN ? 'winMatch' : w === CPU ? 'loseMatch' : 'tieMatch');
    openResult(title, w === HUMAN ? '' : w === CPU ? 'is-lose' : 'is-draw', S.months + 'か月の 結果', body, 'もう1回 <b>▶</b>', true);
  }
  function hideResult() { $('resultWrap').classList.add('hidden'); unlockResult(); resultKind = null; }
  function fitResult() {
    var rb = $('resultBox'), W = window.innerWidth, H = window.innerHeight;
    rb.classList.remove('is-tight', 'is-cols', 'is-tighter');
    rb.style.setProperty('--x', 0);
    if (rb.scrollHeight > rb.clientHeight + 0.5) rb.classList.add('is-tight');
    if (rb.scrollHeight > rb.clientHeight + 0.5 && W > H) rb.classList.add('is-cols');
    if (rb.scrollHeight > rb.clientHeight + 0.5) rb.classList.add('is-tighter');
  }
  function lockResult() { var rb = $('resultBox'); rb.classList.add('is-locked'); $('btnNext').disabled = true; clearTimeout(lockTimer); lockTimer = setTimeout(unlockResult, TUNE.RESULT_LOCK); }
  function unlockResult() { $('resultBox').classList.remove('is-locked'); $('btnNext').disabled = false; }
  function onNext() {
    if (!S || $('resultBox').classList.contains('is-locked')) return;
    if (resultKind === 'final') { hideResult(); armGuard(); startMatch(S.months); return; }
    if (S.phase !== 'result') return;
    E.nextRound(S); save();
    hideResult(); armGuard();
    busy = false;
    if (S.phase === 'final') { showFinal(); return; }
    enterBoard();
  }
  function armGuard() { guardUntil = now() + TUNE.AFTER_BOX; }
  function guardEv(e) {
    if (now() < guardUntil && !(e.target.closest && e.target.closest('#resultWrap,#helpDialog,#koiWrap'))) { e.preventDefault(); e.stopPropagation(); }   // ★ならべ窓（#kasaneWrap）は 止める 側（T357）
  }

  /* ── 遊び方 ── */
  var tableBuilt = false;
  function buildCardTable() {
    if (tableBuilt) return; tableBuilt = true;
    var html = '';
    for (var m = 1; m <= 12; m++) {
      html += '<span class="ct-m">' + m + '月<br>' + HC.FLOWER[m - 1] + '</span>';
      for (var k = 0; k < 4; k++) {
        var id = (m - 1) * 4 + k, c = CARDS[id], t = { hikari: '光', tane: 'タネ', tan: '短冊', kasu: 'カス' }[c.type];
        html += '<span class="ct-c">' + cardHTML(id) + '<span class="ct-n">' + t + '</span></span>';
      }
    }
    $('cardTable').innerHTML = html;
  }
  function openHelp(secId) {
    buildCardTable();
    var d = $('helpDialog');
    try { d.showModal(); } catch (e) { d.setAttribute('open', ''); }
    var sec = secId && $(secId);
    d.scrollTop = sec ? Math.max(0, sec.offsetTop - 50) : 0;
  }

  function boot() {
    /* はじめの 画面の 絵（★松に鶴・桜に幕・芒に月）*/
    $('titleArt').innerHTML = [0, 8, 28].map(function (x) { return cardHTML(x); }).join('');
    var sp = document.createElement('div'); sp.className = 'spacer hidden'; sp.id = 'spacer'; sp.setAttribute('aria-hidden', 'true');
    sp.innerHTML = '<svg class="fl" style="position:absolute;left:8%;top:20%;width:22px;height:22px" viewBox="0 0 40 40"><use href="#t351-flower"/></svg><svg class="fl" style="position:absolute;right:10%;top:45%;width:16px;height:16px" viewBox="0 0 40 40"><use href="#t351-flower"/></svg><span style="position:absolute;left:48%;top:22%;font-size:14px">✨</span>';
    $('mainCol').insertBefore(sp, $('mainCol').firstChild);
    ['btnM3', 'btnM6', 'btnM12'].forEach(function (id) { $(id).addEventListener('click', function () { setLen(+$(id).dataset.len); }); });
    $('btnStart').addEventListener('click', function () { startMatch(monthsSel); });
    $('btnRules').addEventListener('click', function () { openHelp('helpRules'); });
    $('btnYaku').addEventListener('click', function () { openHelp('helpYaku'); });
    $('btnHowto').addEventListener('click', function () { openHelp(); });
    $('btnHowtoTop').addEventListener('click', function () { openHelp(); });
    $('btnQuitGame').addEventListener('click', function () { showTitle(); });
    $('btnOya0').addEventListener('click', function () { onOya(0); });
    $('btnOya1').addEventListener('click', function () { onOya(1); });
    $('hand').addEventListener('click', onHand);
    $('field').addEventListener('click', onField);
    $('kasaneWrap').addEventListener('click', onSpread);
    $('btnShobu').addEventListener('click', function () { onDecide(false); });
    $('btnKoi').addEventListener('click', function () { onDecide(true); });
    $('btnNext').addEventListener('click', onNext);
    $('btnToTitle').addEventListener('click', function () { hideResult(); armGuard(); showTitle(); });
    document.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', function () { var d = $(b.dataset.close); try { d.close(); } catch (e) { d.removeAttribute('open'); } }); });
    window.addEventListener('pointerdown', guardEv, true);
    window.addEventListener('click', guardEv, true);
    window.addEventListener('resize', layout);
    window.addEventListener('orientationchange', function () { setTimeout(layout, 120); });
    if (window.visualViewport) window.visualViewport.addEventListener('resize', recheck);
    /* ★回した あと 画面の はばが「resize なしで」あとから 変わる ことが ある（★パソコンの 大きさ → スマホ で 実測）。
         ★0.4秒ごとに はばと たけだけ 見て、★並べた ときと ちがえば 並べ直す（★見るだけ なので 軽い）*/
    setInterval(recheck, 400);
    var saved = loadSave();
    if (saved) {
      S = saved;
      if (S.phase === 'oya') showOya();
      else enterBoard();
    } else showTitle();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* ============================================================
     ★★ 見張り（window.HANAFUDA.verify）★★
     ------------------------------------------------------------
     ★ 画面には 1つも 出さない。★いま 開いて いる 画面・場面で 数える（★13画面で 回すのは 外の 道具 t351_03）。
     ★ 見るもの（★鳴いたら 番号から 始まる 1行）：
       ① 決まり     … HanaCore が ある・札 48枚（光5・タネ9・短冊10・カス24）・点の 例 9つ・倍の 順番
       ② 試合       … ロボットどうしで n 試合（★本物の ENGINE）：止まらない・16手で 終わる・山は 8枚・点が 部品と 合う
                      ＋ 決まった 場面の 試し（★仕様書 §7 T-7〜T-17）
       ③ ロボットの 目 … 人の 手札・山の 順を 入れかえても ロボットに 見せる もの・出す 札が 1つも 変わらない（T-26）
       ④ 光らせない … 強調は 選んだ 手札の 1枚 だけ・場の 札に しるし 0・:hover 0・★月の 数字は 手札・場・めくった 札に だけ（取った 札には 付けない）
       ⑤ ハッピー   … 絵・しっぽ・まばたき・名前・ふきだし・★どの ことばも 切れない・折れすぎない
       ⑥ 指の 的    … ★札 以外の ボタン ぜんぶ 44×44（★1pxずつ つついて 数える）
       ⑦ はみ出し   … よこに すべらない・帯が sticky・親に overflow 無し・板どうしが 重ならない・板の 中身が あふれない・
                      札が 板と 画面の 中・札の ひりつ・場の 札が 重ならない・束の いちばん 新しい 札が 見える
       ⑧ 家へ 帰る道 … 試合の おわりの 箱に「◀ ゲームを選ぶ」（../）・「やめる」の 字は 帯の 1か所 だけ
       ⑩ 題         … h1 1つ「花札」・帯と 同じ 字・★<title>・og・twitter・h1 に「こいこい」が 無い・説明文に「こいこいで 遊べる」・canonical＝og:url
       ⑪ 外への 通信 … performance の 記録に よその 住所 0
       ⑫ 札の 絵    … sprite.svg の hf0〜47・★並んだ 札が いまの 中身と 同じ（手札・場・取り札・めくった 札・相手の 手札の 数）
       ⑬ 点         … 帯の 合計・「いま ◯点」・勝負の 箱・月の 結果の 点が ぜんぶ HanaCore の 数と 同じ
       ⑭ しまう     … sessionStorage の 中身が いまの 試合と 同じ・しまって 読むと 元どおり（T-18）
       ⑮ 2連打の 止め … 箱を 閉じた 直後の 指が 帯の ボタンに 届かない
       ⑯ ことば     … 中学の 漢字の まちがいやすい 字 0・使わない 書き文字 0
       ⑰ 箱         … 箱の 中身が 切れない・試合の おわり：同点なら「引き分け」・勝ち負けの 字が 点と 合う
       ⑲ 字の 床    … 見えて いる 字は ぜんぶ 11px 以上
       ⑳ エラー     … 読み込んで から 出た 画面の エラー 0
       ㉑ ハッピーは いちばん 上 … たて：帯の すぐ 下（★詰める 形は 帯の 中）／よこ：柱の 帯の すぐ 下（追記⑭）
       ㉒ 山の 数   … 山の 残りの 枚数を どこにも 出して いない（仕様書 §1-2）
       ㉓ こいこい中 … 名札の「こいこい中」が 中身と 同じ・★勝負の 箱が 相手の 取り札を かくさない
       ㉔ うっかり   … TUNE.MISTAKE が 0〜1 の 数 1つ・ロボットの 手が それを 読む
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
  function modalOpen() { var d = $('helpDialog'); return d.open; }
  function matoOf(el) {
    var r = el.getBoundingClientRect(), cx = Math.round(r.left + r.width / 2), cy = Math.round(r.top + r.height / 2);
    function hit(x, y) { var e = document.elementFromPoint(x, y); return !!(e && (e === el || el.contains(e))); }
    if (cy < 0 || cy >= window.innerHeight || cx < 0 || cx >= window.innerWidth) return { off: true };
    var at = document.elementFromPoint(cx, cy);
    var hd = $('helpDialog');
    if (hd.open && !hd.contains(el)) return { skip: true };
    var rw = $('resultWrap');
    if (!rw.classList.contains('hidden') && !rw.contains(el) && at && rw.contains(at)) return { skip: true };
    var kw = $('koiWrap');
    if (!kw.classList.contains('hidden') && !kw.contains(el) && at && kw.contains(at)) return { skip: true };
    var sw = $('kasaneWrap');
    if (!sw.classList.contains('hidden') && !sw.contains(el) && at && sw.contains(at)) return { skip: true };
    if (!hit(cx, cy)) return { w: 0, h: 0, why: 'まん中が 押せない' };
    var up = 0, dn = 0, lf = 0, rt = 0, i;
    for (i = 1; i <= 80; i++) { if (hit(cx, cy - i)) up = i; else break; }
    for (i = 1; i <= 80; i++) { if (hit(cx, cy + i)) dn = i; else break; }
    for (i = 1; i <= 240; i++) { if (hit(cx - i, cy)) lf = i; else break; }
    for (i = 1; i <= 240; i++) { if (hit(cx + i, cy)) rt = i; else break; }
    return { w: lf + rt + 1, h: up + dn + 1 };
  }
  function over(a, b) { return Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0.5 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0.5; }
  function idsIn(el) { var out = []; if (!el) return out; el.querySelectorAll('.hc').forEach(function (c) { out.push(+c.dataset.id); }); return out; }
  var TITLE_NAME = '花札', TITLE_FULL = '花札 ― ブラウザですぐ遊べる｜ブラゲ工房';
  var BANNED = '押揃枠詰繋盤賭嵌棄択匹粒濃淡隣繰謎挑壁巡互伏違替';
  var MANGA = ['\u3056\u308f', '\u30b6\u30ef'];   // ★使わない 書き文字（★この ファイルに その 字を そのまま 書かない ため \u の 形）
  var EXAMPLES = [   // ★仕様書 §2-3 の 表（★ルルの 表を そのまま 書き写した 数）：[札, 役の 点, もらう 点, 相手が こいこい中]
    [[8, 32], 5, 5, 10], [[8, 28, 32], 10, 20, 40], [[0, 8, 28, 32], 15, 30, 60], [[40, 0, 8], 0, 0, 0],
    [[24, 36, 20, 4, 12], 6, 6, 12], [[2, 3, 6, 7, 10, 11, 14, 15, 18, 32], 1, 1, 2], [[1, 5, 9, 21, 33, 37], 12, 24, 48],
    [[40, 0, 8, 28], 7, 14, 28], [[24, 36, 20, 32, 4], 6, 6, 12]
  ];

  function verify(n) {
    n = n == null ? 1 : n;
    var ng = [], note = {}, t0 = Date.now();
    function put(no, arr, info) { for (var i = 0; i < arr.length; i++) ng.push(no + ' ' + arr[i]); note[no] = arr.length ? ('NG ' + arr.length) : ('OK' + (info ? '（' + info + '）' : '')); }
    var sc = sceneOf(), inMatch = sc !== 'title', W = screenW(), H = window.innerHeight;
    var de = document.documentElement, h = S && S.h, onBoard = sc === 'board' && !!h;
    var yoko = geo.mode === 'yoko' && onBoard;

    /* ① 決まり */
    var b1 = [];
    if (!HC || !HC.judge) b1.push('HanaCore が 無い');
    else {
      var cnt = { hikari: 0, tane: 0, tan: 0, kasu: 0 }; CARDS.forEach(function (c) { cnt[c.type]++; });
      if (CARDS.length !== 48 || cnt.hikari !== 5 || cnt.tane !== 9 || cnt.tan !== 10 || cnt.kasu !== 24) b1.push('札の 数が ' + JSON.stringify(cnt));
      EXAMPLES.forEach(function (x, i) {
        var j = HC.judge(x[0]).total, a = j ? HC.pay(j, false).pts : 0, b = j ? HC.pay(j, true).pts : 0;
        if (j !== x[1] || a !== x[2] || b !== x[3]) b1.push('点の 例' + (i + 1) + '：' + [j, a, b].join('／') + '（正は ' + x.slice(1).join('／') + '）');
      });
      if (!HC.improved(5, 6) || HC.improved(5, 5)) b1.push('こいこいの 後の 勝負の 決まり');
      /* ★社長の お決め（追記⑮②）：雨で 流れない・加点 なし・盃は カスにも・光の 役は 1つ */
      if (HC.judge([40, 8, 32]).total !== 5 || HC.judge([40, 28, 32]).total !== 5) b1.push('雨で 花見・月見が 流れた');
      if (HC.judge([24, 36, 20, 4]).total !== 5 || HC.judge([1, 5, 9, 13]).total !== 5 || HC.judge([21, 33, 37, 13]).total !== 5) b1.push('猪鹿蝶・赤短・青短に 加点が ついた');
      if (HC.judge([0, 8, 28, 40, 44]).yaku.length !== 1) b1.push('光の 役が 2つ');
      if (HC.pay(6, true).pts !== 12 || HC.pay(7, false).pts !== 14 || HC.pay(7, true).pts !== 28) b1.push('倍の 順番');
      if (HC.RULES.months.join() !== '3,6,12') b1.push('月数が ' + HC.RULES.months.join());
    }
    put('①', b1);

    /* ② 試合（ロボットどうし・本物の ENGINE）＋ 決まった 場面 */
    var b2 = [], sum2 = { 月: 0, 流れ: 0, 手役: 0, こいこい: 0 };
    for (var i2 = 0; i2 < n; i2++) {
      var r2;
      try { r2 = E.simMatch([3, 6, 12][i2 % 3], 4242 + i2, null, {}); }
      catch (e2) { b2.push('試合' + i2 + '：★止まった（' + e2.message + '）'); continue; }
      r2.bad.forEach(function (x) { b2.push('試合' + i2 + '：' + x); });
      sum2.月 += r2.st.rounds; sum2.流れ += r2.st.nagare; sum2.手役 += r2.st.teyaku; sum2.こいこい += r2.st.koi;
    }
    var st2 = null;
    try { st2 = E.selfTest(); st2.bad.forEach(function (x) { b2.push('場面 ' + x); }); } catch (e2) { b2.push('★決まった 場面の 試しが 止まった（' + e2.message + '）'); }
    put('②', b2, n + '試合・月 ' + sum2.月 + '・流れ ' + sum2.流れ + '・手役 ' + sum2.手役 + '・こいこい ' + sum2.こいこい + (st2 ? '・場面の 試しで 自動の 勝負 ' + st2.seen.auto + '・×4 ' + st2.seen.x4 : ''));

    /* ③ ロボットの 目（T-26）*/
    var b3 = [];
    try { (function () {
      var T = E.newMatch(3, 777); E.chooseOya(T, 0); T.oya = CPU; E.startRound(T); T.h.turn = CPU; T.h.step = 'play';
      if (T.phase !== 'play') return;
      var v1 = JSON.stringify(E.cpuView(T, CPU)), m1 = JSON.stringify(E.cpuMove(E.cpuView(T, CPU), E.cpuRng(T, 1)));
      var U = JSON.parse(JSON.stringify(T)), pool = U.h.hands[HUMAN].concat(U.h.deck);
      pool.reverse();
      U.h.hands[HUMAN] = pool.slice(0, U.h.hands[HUMAN].length); U.h.deck = pool.slice(U.h.hands[HUMAN].length);
      var v2 = JSON.stringify(E.cpuView(U, CPU)), m2 = JSON.stringify(E.cpuMove(E.cpuView(U, CPU), E.cpuRng(U, 1)));
      if (v1 !== v2) b3.push('★人の 手札・山を 変えたら ロボットに 見せる ものが 変わった');
      if (m1 !== m2) b3.push('★人の 手札・山を 変えたら ロボットの 手が 変わった');
      var keys = Object.keys(E.cpuView(T, CPU)).join(',');
      if (keys !== 'hand,field,mine,opp,koiMine,koiOpp,empty') b3.push('ロボットに 見せる ものが 決まりと ちがう：' + keys);
      var src = String(E.cpuThink) + String(E.cpuMove) + String(E.cpuKoi) + String(E.cpuPick) + String(E.cardValue);
      if (/hands|deck|\.h\b/.test(src)) b3.push('★ロボットの 考えが 手札・山を 読んで いる');
    })(); } catch (e3) { b3.push('★ロボットの 試しが 止まった（' + e3.message + '）'); }
    put('③', b3);

    /* ④ 光らせない・月の 数字 */
    var b4 = [];
    var up = document.querySelectorAll('.is-sel');
    if (up.length > 1) b4.push('上がった 札が ' + up.length + '枚');
    up.forEach(function (u) { if (!$('hand').contains(u)) b4.push('手札 以外の 札が 上がった'); });
    if (onBoard && h.step === 'play' && h.turn === HUMAN && sel >= 0 && up.length !== 1) b4.push('選んだ 手札が 上がって いない');
    if (onBoard && sel < 0 && up.length) b4.push('選んで いない のに 上がった 札');
    if (document.querySelectorAll('.is-hint,.is-match,.is-good,.is-cand,.glow').length) b4.push('ヒントの しるしが ある');   // ★is-can（取れる 札の 赤い 枠）は T358 で 社長が 入れた ―― ㉘ が 数える
    $('field').querySelectorAll('.hc').forEach(function (c) {
      var extra = c.className.split(/\s+/).filter(function (k) { return ['hc', 'under', 'on-top', 'on-top2', 's0', 's1', 's2', 'is-can'].indexOf(k) < 0; });
      if (extra.length) b4.push('場の 札に しるし：' + extra.join(' '));
      var cs = getComputedStyle(c);
      if (!c.classList.contains('is-can') && cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) b4.push('取れない 場の 札に 枠');
      if (!c.classList.contains('is-can') && cs.boxShadow !== 'none') b4.push('取れない 場の 札に 影の 枠');
    });
    try {
      for (var sI = 0; sI < document.styleSheets.length; sI++) {
        (function walk(list) {
          for (var q = 0; q < list.length; q++) {
            if (list[q].cssRules) walk(list[q].cssRules);
            var s4 = list[q].selectorText || '';
            if (/(\.hc|\.seat|\.field|\.face)[^,{]*:(hover|focus)/.test(s4)) b4.push('札に :hover の 決まり：' + s4);
          }
        })(document.styleSheets[sI].cssRules || []);
      }
    } catch (e) {
      if (location.protocol === 'file:') note['④ :hover'] = '★測れていません（file:// では CSS を 読めない）';
      else b4.push('CSS を 読めない：' + e.message);
    }
    /* 月の 数字（案A）：手札・場・めくった 札・親決め・はじめの 絵 には ある（★数字＝その 札の 月）／取り札・箱の 小さい 札 には 無い */
    var numOK = 0;
    document.querySelectorAll('#hand .hc, #field .hc, #flipSlot .hc, #oyaCards .hc, #titleArt .hc').forEach(function (c) {
      if (!vis(c)) return;
      var mn = c.querySelector('.mn');
      if (!mn) { b4.push('月の 数字が 無い 札 ' + c.dataset.id); return; }
      if (mn.textContent !== String(CARDS[+c.dataset.id].month)) b4.push('札 ' + c.dataset.id + ' の 月の 数字が ' + mn.textContent);
      if (!c.classList.contains('under') && vis(mn)) {
        var fr = c.querySelector('.face').getBoundingClientRect(), mr = mn.getBoundingClientRect();
        if (mr.top < fr.bottom - 0.5) b4.push('月の 数字が 絵に 重なった ' + c.dataset.id);
        if (parseFloat(getComputedStyle(mn).fontSize) < 11) b4.push('月の 数字が 小さい');
      }
      numOK++;
    });
    if (document.querySelectorAll('.pile .mn, .mini .mn').length) b4.push('取った 札に 月の 数字が 付いた');
    put('④', b4, '月の 数字 ' + numOK + '枚');

    /* ⑤ ハッピー */
    var b5 = [], cat = $('happyCat'), bub = $('happyBubble'), row = $('logRow');
    if (!vis(cat)) b5.push('ハッピーの 絵が 見えない');
    else { var cr = cat.getBoundingClientRect(); if (cr.width < 24 || cr.height < 24) b5.push('ハッピーが 小さい ' + Math.round(cr.width) + '×' + Math.round(cr.height)); }
    if (!cat || !cat.querySelector('.cat-tail')) b5.push('しっぽが 無い');
    if (!cat || !cat.querySelector('.cat-eyes')) b5.push('まばたきの 目が 無い');
    if ((($('happyWrap').textContent || '') + (cat ? cat.getAttribute('aria-label') : '')).indexOf('ハッピー') < 0) b5.push('名前「ハッピー」が 無い');
    if (!vis(bub) || !bub.textContent.trim()) b5.push('ふきだしが 見えない／空');
    if (vis(row)) {
      var keep = bub.textContent, keepK = bub.dataset.k, worst = 0, worstK = '';
      var maxL = onBoard ? (geo.c || yoko ? 3 : 2) : 2;
      Object.keys(LINES).forEach(function (k5) {
        bub.textContent = LINES[k5];
        var nL = lineCount(bub), br5 = bub.getBoundingClientRect(), rw5 = row.getBoundingClientRect();
        if (nL > worst) { worst = nL; worstK = k5; }
        if (nL > maxL) b5.push('「' + k5 + '」が ' + nL + '行（' + maxL + '行 まで）');
        if (br5.bottom > rw5.bottom + 0.5 || br5.top < rw5.top - 0.5 || br5.right > rw5.right + 0.5) b5.push('「' + k5 + '」が 切れる');
      });
      bub.textContent = keep; bub.dataset.k = keepK || '';
      note['⑤ いちばん 長い ことば'] = worstK + ' ' + worst + '行';
      var rr5 = row.getBoundingClientRect();
      if (rr5.bottom > H + 0.5 || rr5.right > W + 0.5 || rr5.left < -0.5 || rr5.top < -0.5) b5.push('ハッピーの 行が 画面から 出た');
    }
    put('⑤', b5);

    /* ⑥ 指の 的 44×44（★札は 盤そのもの ―― 数えない）*/
    var b6 = [], seen6 = [];
    ['btnBack', 'btnQuitGame', 'btnHowto', 'btnHowtoTop', 'btnM3', 'btnM6', 'btnM12', 'btnStart', 'btnRules', 'btnYaku', 'btnOya0', 'btnOya1', 'btnShobu', 'btnKoi', 'btnNext', 'btnToTitle', 'btnQuit'].forEach(function (id) {
      var e6 = $(id);
      if (!vis(e6)) return;
      var m = matoOf(e6);
      if (m.skip) return;
      if (m.off) { b6.push(id + ' が 画面の 外'); return; }
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
    put('⑥', b6, seen6.length + 'か所');

    /* ⑦ はみ出し */
    var b7 = [], tb = $('topbar'), appEl = $('app');
    if (geo.W !== W || geo.H !== H) b7.push('★並べ方が いまの 画面の 大きさで ない（' + geo.W + '×' + geo.H + '）');
    if (window.innerWidth > W + 0.5) b7.push('★中身が 広くて 画面が よこに 広がった（' + window.innerWidth + '＞' + W + '）');
    if (de.scrollWidth > W + 0.5) b7.push('よこに すべる（' + de.scrollWidth + '）');
    if (de.scrollHeight > H + 0.5) b7.push('たてに すべる（' + de.scrollHeight + '）');
    if (document.body.scrollWidth > W + 0.5) b7.push('中身が よこに はみ出した（' + document.body.scrollWidth + '）');
    if (appEl.scrollHeight > appEl.clientHeight + 0.5) b7.push('器の 中身が たてに はみ出した（' + appEl.scrollHeight + '＞' + appEl.clientHeight + '）');
    if (getComputedStyle(tb).position !== 'sticky') b7.push('帯が sticky で ない');
    for (var pe = tb.parentElement; pe && pe !== document.body; pe = pe.parentElement) {
      var cs7 = getComputedStyle(pe);
      if (cs7.overflowX !== 'visible' || cs7.overflowY !== 'visible') b7.push('帯の 親に overflow（' + (pe.id || pe.className) + '）');
    }
    var parts = [];
    function addPart(el, nm) { if (el && vis(el)) parts.push({ p: el, r: el.getBoundingClientRect(), n: nm || el.id }); }
    addPart(tb, 'topbar');
    if ($('logRow').parentElement !== tb) addPart($('logRow'), 'logRow');
    if (sc === 'title') addPart($('titleScreen'));
    else if (sc === 'oya') addPart($('oyaScreen'));
    else { ['oppStrip', 'deckRow', 'field', 'meStrip', 'hand', 'deckBox'].forEach(function (id) { addPart($(id)); }); }
    parts.forEach(function (a) {
      if (a.r.left < -0.5 || a.r.right > W + 0.5 || a.r.top < -0.5 || a.r.bottom > H + 0.5) b7.push(a.n + ' が 画面から 出た（' + Math.round(a.r.left) + ',' + Math.round(a.r.top) + '〜' + Math.round(a.r.right) + ',' + Math.round(a.r.bottom) + '）');
    });
    for (var a7 = 0; a7 < parts.length; a7++) for (var c7 = a7 + 1; c7 < parts.length; c7++) {
      if (parts[a7].p.contains(parts[c7].p) || parts[c7].p.contains(parts[a7].p)) continue;
      if (over(parts[a7].r, parts[c7].r)) b7.push(parts[a7].n + ' と ' + parts[c7].n + ' が 重なった');
    }
    parts.forEach(function (a) {
      var el = a.p; if (el === tb) return;
      if (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1) b7.push(a.n + ' の 中身が あふれた（' + el.scrollWidth + '×' + el.scrollHeight + '＞' + el.clientWidth + '×' + el.clientHeight + '）');
    });
    var ts7 = $('titleScreen');
    if (sc === 'title' && ts7.scrollHeight > ts7.clientHeight + 0.5) b7.push('はじめの 箱の 中身が 切れた');
    /* ★名札・帯の 字が 切れない */
    document.querySelectorAll('.tagline, .tag, .tl, .round, .now, .hcount, .gl, .flipcap, .brand').forEach(function (e7) {
      if (!vis(e7)) return;
      if (e7.scrollWidth > e7.clientWidth + 1) b7.push('字が 切れた：' + (e7.id || e7.className) + '「' + e7.textContent.slice(0, 12) + '」');
      var host = e7.closest('.strip, .topbar, .deckbox, .deckrow');
      if (host) { var q = e7.getBoundingClientRect(), hr = host.getBoundingClientRect(); if (q.left < hr.left - 0.5 || q.right > hr.right + 0.5 || q.top < hr.top - 0.5 || q.bottom > hr.bottom + 0.5) b7.push((e7.className || e7.id) + ' が ' + (host.id || host.className) + ' から 出た'); }
    });
    if (onBoard) {
      /* 札：板と 画面の 中・ひりつ・場の 札が 重ならない */
      var faces = [], outN = 0;
      document.querySelectorAll('#board .hc').forEach(function (c) {
        if (!vis(c)) return;
        var f = c.querySelector('.face'), q = f.getBoundingClientRect();
        if (Math.abs(q.height / q.width - R) > 0.02) b7.push('札 ' + c.dataset.id + ' の ひりつが ' + (q.height / q.width).toFixed(3));
        var host = c.closest('.strip, .field, .hand, .deckrow, .deckbox'), hr = host.getBoundingClientRect(), cq = c.getBoundingClientRect();
        if (cq.left < hr.left - 0.5 || cq.right > hr.right + 0.5 || cq.top < hr.top - 0.5 || cq.bottom > hr.bottom + 0.5) { outN++; if (outN < 4) b7.push('札 ' + c.dataset.id + ' が ' + (host.id || host.className) + ' から 出た'); }
        if (cq.right > W + 0.5 || cq.left < -0.5 || cq.bottom > H + 0.5 || cq.top < -0.5) b7.push('札 ' + c.dataset.id + ' が 画面から 出た');
        if (host.id === 'field' || host.id === 'hand') faces.push({ r: cq, c: c });
      });
      var ov = 0;
      for (var i7 = 0; i7 < faces.length; i7++) for (var j7 = i7 + 1; j7 < faces.length; j7++) {
        var A = faces[i7].c, B = faces[j7].c;
        if (A.parentElement === B.parentElement && (/under|on-top/.test(A.className) || /under|on-top/.test(B.className) || A.parentElement.classList.contains('kasane'))) continue;   // ★出した 札が 重なって 見える 間・★重ねた 席
        if (over(faces[i7].r, faces[j7].r)) ov++;
      }
      if (ov) b7.push('場・手札の 札が ' + ov + '組 重なった');
      /* 束：いちばん 新しい 札が 見える（★右の はしが 束の 中）*/
      document.querySelectorAll('.pile').forEach(function (p) {
        var cs = p.querySelectorAll('.hc'); if (!cs.length) return;
        var last = cs[cs.length - 1].getBoundingClientRect(), pr = p.getBoundingClientRect();
        if (last.right > pr.right + 0.5) b7.push('束の いちばん 新しい 札が 見えない（' + p.parentElement.dataset.g + ' ' + cs.length + '枚）');
      });
      note['⑦ 札'] = geo.mode + (geo.c ? '・詰める' : '') + (geo.d ? '・山は 7列目' : '') + (geo.low ? '・低い' : '') + '・場 ' + (geo.m ? geo.m.fw.toFixed(1) : '') + '・手札 ' + (geo.m ? geo.m.hw.toFixed(1) : '') + '・取り札 ' + (geo.m ? geo.m.cw.toFixed(1) : '') + '・組み直し ' + planTries;
    }
    put('⑦', b7);

    /* ㉕ T353：直した 所の 見張り（トライ T352 A〜F）*/
    var b25 = [];
    /* A：重ねた 席の 札は ふつうの 札の 7割5分 以上・★席の まん中を 押すと その 席の 札に 当たる */
    document.querySelectorAll('#field .seat.kasane').forEach(function (st) {
      var fwNow = geo.m ? geo.m.fw : 0, sr = st.getBoundingClientRect();
      st.querySelectorAll('.hc').forEach(function (c) { var w25 = c.querySelector('.face').getBoundingClientRect().width; if (w25 < fwNow * 0.75 - 0.5) b25.push('A：重ねた 席の 札が 小さい（' + w25.toFixed(1) + '／' + fwNow + '）'); });
      var at25 = document.elementFromPoint(sr.left + sr.width / 2, sr.top + sr.height / 2);
      if ($('koiWrap').classList.contains('hidden') && $('resultWrap').classList.contains('hidden') && $('kasaneWrap').classList.contains('hidden') && !$('helpDialog').open && !(at25 && st.contains(at25) && at25.closest('.hc'))) b25.push('A：重ねた 席の まん中が 札に 当たらない');
    });
    /* C：カスの 役に 菊に盃が 入る ときだけ「（菊に盃を ふくむ）」を 1回 */
    ['koiYaku', 'resultBody'].forEach(function (id) {
      var el = $(id); if (!vis(el)) return;
      el.querySelectorAll('li').forEach(function (li) {
        var isKasu = li.firstChild && li.firstChild.textContent === 'カス', notes = (li.textContent.match(/（菊に盃を ふくむ）/g) || []).length;
        var wantN = 0;
        if (isKasu && S && S.h) { var who = id === 'koiYaku' ? HUMAN : (S.h.res ? S.h.res.w : -1); if (who >= 0 && S.h.got[who].indexOf(HC.ID.SAKE) >= 0) wantN = 1; }
        if (isKasu && notes !== wantN) b25.push('C：カスの 行の「（菊に盃を ふくむ）」が ' + notes + '回（正は ' + wantN + '回）');
        if (!isKasu && notes) b25.push('C：カス 以外の 行に「（菊に盃を ふくむ）」');
      });
    });
    /* B：はじめ・親決めの 箱の 中身が 箱の 中（★まん中 寄せで 上に はみ出して いない）*/
    ['titleScreen', 'oyaScreen'].forEach(function (id) {
      var sec = $(id); if (!vis(sec)) return;
      var r0 = sec.getBoundingClientRect();
      for (var q = 0; q < sec.children.length; q++) {
        var ch25 = sec.children[q]; if (!vis(ch25) || ch25.classList.contains('t-deco') || ch25.classList.contains('t-twinkle')) continue;
        var r1 = ch25.getBoundingClientRect();
        if (r1.top < r0.top - 0.5 || r1.bottom > r0.bottom + 0.5) b25.push('B：' + id + ' の「' + (ch25.textContent || ch25.className).trim().slice(0, 8) + '」が 箱から 出た');
      }
    });
    /* D：手札が 0枚でも 手札の 段の たけが のこる */
    if (onBoard && geo.m) {
      var want25 = geo.m.hw * R + NH + (geo.m.lift || TUNE.LIFT) + 4, hh25 = $('hand').getBoundingClientRect().height;
      if (hh25 < want25 - 1) b25.push('D：手札の 段が ' + hh25.toFixed(1) + 'px（正は ' + want25.toFixed(1) + '）―― 手札が 減ると 盤が 動く');
    }
    /* E：場の 札が 取り札より 小さく ならない */
    if (onBoard && geo.m && geo.m.fw + 0.01 < geo.m.cw) b25.push('E：場の 札（' + geo.m.fw + '）が 取り札（' + geo.m.cw.toFixed(1) + '）より 小さい');
    /* F：絵の 出どころの 文 */
    var cr25 = ($('helpCredit') && $('helpCredit').textContent) || '';
    if (cr25.indexOf('ファイルを 1つに まとめ、中の 名前を 付けかえました（見た目は 変えて いません）') < 0) b25.push('F：出どころの 文が ちがう');
    put('㉕', b25);

    /* ㉖ T355：ならべ窓（★重なった 席を 押したら 横に 並べて 選ぶ ―― 社長「①1」）*/
    var b26 = [], swEl = $('kasaneWrap'), swOpen = !swEl.classList.contains('hidden');
    if (swOpen !== (spreadSeat >= 0)) b26.push('ならべ窓の 見え方と 中身が 合わない');
    if (swOpen && spreadSeat >= 0 && onBoard) {
      var sids = h.seats[spreadSeat] || [], shown = idsIn($('kasaneCards'));
      if (shown.join() !== sids.join() || sids.length < 2) b26.push('ならべ窓の 札が 席の 札と ちがう（' + shown.join() + '／' + sids.join() + '）');
      var base26 = h.step === 'pick' ? h.flip : sel, op26 = base26 >= 0 ? HC.captureOptions(base26, E.fieldIds(h)) : null;
      if (!op26 || op26.kind !== 'choose' || sids.indexOf(op26.cands[0]) < 0 || sids.indexOf(op26.cands[1]) < 0) b26.push('選ぶ 場面で ない のに ならべ窓');
      var rs26 = [];
      $('kasaneCards').querySelectorAll('.hc').forEach(function (c) {
        var fr = c.querySelector('.face').getBoundingClientRect(), cr26 = c.getBoundingClientRect();
        if (geo.m && fr.width < Math.min(geo.m.fw, 40) - 0.5) b26.push('ならべ窓の 札が 小さい（' + fr.width.toFixed(1) + '）');
        if (Math.abs(fr.height / fr.width - R) > 0.02) b26.push('ならべ窓の 札の ひりつ');
        if (!c.querySelector('.mn') || c.querySelector('.mn').textContent !== String(CARDS[+c.dataset.id].month)) b26.push('ならべ窓の 札の 月の 数字');
        if (cr26.left < -0.5 || cr26.right > W + 0.5 || cr26.top < -0.5 || cr26.bottom > H + 0.5) b26.push('ならべ窓の 札が 画面から 出た');
        var hit26 = document.elementFromPoint(cr26.left + cr26.width / 2, cr26.top + Math.min(cr26.height / 2, fr.height / 2));
        if (!hit26 || !c.contains(hit26)) b26.push('ならべ窓の 札の まん中が 押せない');
        rs26.push(cr26);
      });
      for (var i26 = 0; i26 < rs26.length; i26++) for (var j26 = i26 + 1; j26 < rs26.length; j26++) if (over(rs26[i26], rs26[j26])) b26.push('ならべ窓の 札が 重なった');
      var bx26 = $('kasaneBox'); if (bx26.scrollWidth > bx26.clientWidth + 1 || bx26.scrollHeight > bx26.clientHeight + 1) b26.push('ならべ窓の 中身が あふれた');
    }
    put('㉖', b26);

    /* ㉗ T357（トライ T356 ②④）*/
    var b27 = [];
    /* ②：ならべ窓が 開いて いる 間、★開いた 時から TUNE.SPREAD_GUARD は 指を 止める */
    if (spreadSeat >= 0 && !(typeof TUNE.SPREAD_GUARD === 'number' && TUNE.SPREAD_GUARD >= 250)) b27.push('②：ならべ窓の 止める 間が ' + TUNE.SPREAD_GUARD);
    if (spreadSeat >= 0 && guardUntil < spreadAt + (TUNE.SPREAD_GUARD || 0) - 1) b27.push('②：ならべ窓を 開いた のに 指を 止めて いない');
    if (!/guardUntil\s*=\s*Math\.max\(guardUntil,\s*spreadAt\s*\+\s*TUNE\.SPREAD_GUARD\)/.test(String(openSpread))) b27.push('②：ならべ窓を 開く ときに 指を 止める 決まりが 無い');
    /* ④：名札の 点は「役 ◯点」（★こいこい中は「こいこい中 ◯点」）・★「いま」の 字は 勝負の 箱 だけ */
    document.querySelectorAll('[data-now]').forEach(function (e) {
      if (!vis(e)) return;
      var tx = e.textContent.replace(/\s+/g, ' ').trim();
      if (!/^(役 \d+点|こいこい中 \d+点)$/.test(tx)) b27.push('④：名札の 点の 字が「' + tx + '」');
    });
    ['oppTag', 'meTag'].forEach(function (id) { if (vis($(id)) && $(id).textContent.indexOf('いま') >= 0) b27.push('④：' + id + ' に「いま」の 字'); });
    put('㉗', b27);

    /* ㉘ T358（社長）：取れる 場の 札 ＝ 赤い 枠の 札（★いつも 同じ・取れない 札には 付かない・選びを やめたら 消える）*/
    /* ★取れる 札は canIds() を 使わず ここで 数え直す（★canIds が 壊れても 鳴る ように ―― 見張りの ものさしを 見張られる 側から 作らない）*/
    var want28 = [];
    if (onBoard && !hold && S.phase === 'play' && h.turn === HUMAN) {
      var f28 = E.fieldIds(h);
      if (h.step === 'pick' && h.flip >= 0) want28 = f28.filter(function (x) { return CARDS[x].month === CARDS[h.flip].month; });
      else if (h.step === 'play' && sel >= 0) want28 = f28.filter(function (x) { return CARDS[x].month === CARDS[sel].month; });
    }
    want28.sort(function (a, b) { return a - b; });
    var b28 = [];
    var got28 = [].map.call(document.querySelectorAll('#field .hc.is-can'), function (e) { return +e.dataset.id; }).sort(function (a, b) { return a - b; });
    if (onBoard && want28.join() !== got28.join()) b28.push('赤い 枠の 札（' + got28.join() + '）が 取れる 札（' + want28.join() + '）と ちがう');
    if (onBoard && !hold && S.phase === 'play' && h.turn === HUMAN && h.step === 'play' && sel < 0 && got28.length) b28.push('手札を 選んで いない のに 赤い 枠');
    if (document.querySelectorAll('.is-can:not(#field .hc):not(#kasaneCards .hc)').length) b28.push('場 と ならべ窓 の 外に 赤い 枠');
    if (spreadSeat >= 0) {
      var sw28 = [].map.call(document.querySelectorAll('#kasaneCards .hc.is-can'), function (e) { return +e.dataset.id; }).sort(function (a, b) { return a - b; });
      var sx28 = (h.seats[spreadSeat] || []).filter(function (x) { return want28.indexOf(x) >= 0; }).sort(function (a, b) { return a - b; });
      if (sw28.join() !== sx28.join()) b28.push('ならべ窓の 赤い 枠（' + sw28.join() + '）が 選べる 札（' + sx28.join() + '）と ちがう');
    }
    /* ★見え方：札の 外側に 太い 赤（★3px 以上）＋ 白い すき間（★絵の 赤と まぎれない）*/
    document.querySelectorAll('.hc.is-can').forEach(function (e) {
      if (!vis(e)) return;
      var cs28 = getComputedStyle(e), col = (cs28.outlineColor.match(/\d+/g) || []).map(Number);
      if (cs28.outlineStyle === 'none' || parseFloat(cs28.outlineWidth) < 3) b28.push('赤い 枠が 細い／無い（' + cs28.outlineWidth + '）');
      else if (!(col[0] >= 180 && col[1] <= 80 && col[2] <= 80)) b28.push('枠の 色が 赤で ない（' + cs28.outlineColor + '）');
      if (parseFloat(cs28.outlineOffset) < 1) b28.push('赤い 枠が 札に くっついて いる（すき間 ' + cs28.outlineOffset + '）');
      if (cs28.boxShadow === 'none') b28.push('赤い 枠の 内側の 白い 輪が 無い');
      var r28 = e.getBoundingClientRect(), o28 = parseFloat(cs28.outlineWidth) + parseFloat(cs28.outlineOffset);
      if (r28.left - o28 < -0.5 || r28.right + o28 > W + 0.5 || r28.top - o28 < -0.5 || r28.bottom + o28 > H + 0.5) b28.push('赤い 枠が 画面から 出た');
    });
    put('㉘', b28, '赤い 枠 ' + got28.length + '枚');

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
    var b10 = [], h1s = document.querySelectorAll('h1');
    if (h1s.length !== 1 || h1s[0].textContent.trim() !== TITLE_NAME) b10.push('h1 が ' + h1s.length + 'つ／「' + (h1s[0] && h1s[0].textContent) + '」');
    if ($('brandName').textContent.trim() !== TITLE_NAME) b10.push('帯の 題が「' + $('brandName').textContent + '」');
    if (document.title !== TITLE_FULL) b10.push('title が「' + document.title + '」');
    function meta(sel) { var m = document.querySelector(sel); return m ? (m.getAttribute('content') || m.getAttribute('href') || '') : null; }
    var heads = [document.title, meta('meta[property="og:title"]'), meta('meta[name="twitter:title"]'), h1s[0] && h1s[0].textContent, $('brandName').textContent];
    heads.forEach(function (t) { if (t == null) b10.push('題の 札が 足りない'); else if (/こいこい|コイコイ/.test(t)) b10.push('★題に「こいこい」：' + t); });
    if (meta('meta[property="og:title"]') !== TITLE_FULL || meta('meta[name="twitter:title"]') !== TITLE_FULL) b10.push('og:title／twitter:title が title と ちがう');
    if ((meta('meta[name="description"]') || '').indexOf('こいこいで 遊べる') < 0) b10.push('説明文に「こいこいで 遊べる」が 無い');
    if (meta('link[rel="canonical"]') !== meta('meta[property="og:url"]')) b10.push('canonical と og:url が ちがう');
    put('⑩', b10);

    /* ⑪ 外への 通信 */
    var b11 = [];
    try { performance.getEntriesByType('resource').forEach(function (en) { if (en.name.indexOf(location.origin) !== 0 && !/^(data|blob):/.test(en.name)) b11.push('よそへ：' + en.name.slice(0, 80)); }); } catch (e) {}
    put('⑪', b11);

    /* ⑫ 札の 絵 ＝ いまの 中身 */
    var b12 = [], uses = 0, drawn = 0;
    document.querySelectorAll('.hc').forEach(function (c) {
      var u = c.querySelector('use'), href = u && u.getAttribute('href'), mm = /^sprite\.svg#hf(\d+)$/.exec(href || '');
      if (!mm || +mm[1] !== +c.dataset.id) b12.push('札の 絵の 行き先が ちがう：' + href + '（' + c.dataset.id + '）');
      uses++;
      if (vis(c) && u.getBoundingClientRect().width > 1) drawn++;
    });
    if (uses && document.querySelectorAll('.hc').length && !drawn && location.protocol !== 'file:') {
      var anyVis = false; document.querySelectorAll('.hc').forEach(function (c) { if (vis(c)) anyVis = true; });
      if (anyVis) b12.push('★札の 絵が 1枚も 描かれて いない（sprite.svg が 読めない？）');
    }
    if (onBoard && !hold) {
      var hv = idsIn($('hand')).join(), hs = h.hands[HUMAN].join();
      if (hv !== hs) b12.push('手札が 中身と ちがう（' + hv + '／' + hs + '）');
      var fv = [].map.call(document.querySelectorAll('#field .seat:not(.deckcell) .hc'), function (c) { return +c.dataset.id; }).sort(function (a, b) { return a - b; }).join(), fs = E.fieldIds(h).sort(function (a, b) { return a - b; }).join();
      if (fv !== fs) b12.push('場が 中身と ちがう');
      for (var s12 = 0; s12 < SEATS; s12++) {
        var seatEl = $('field').querySelector('[data-seat="' + s12 + '"]');
        if (!seatEl) { b12.push('席 ' + s12 + ' が 無い'); continue; }
        if (idsIn(seatEl).join() !== h.seats[s12].join()) b12.push('席 ' + s12 + ' の 札が 中身と ちがう');
      }
      if (idsIn($('oppCap')).sort().join() !== h.got[CPU].slice().sort().join()) b12.push('ロボットの 取り札が 中身と ちがう');
      if (idsIn($('meCap')).sort().join() !== h.got[HUMAN].slice().sort().join()) b12.push('あなたの 取り札が 中身と ちがう');
      var fl = idsIn($('flipSlot'));
      if ((h.flip >= 0 ? String(h.flip) : '') !== fl.join()) b12.push('めくった 札が 中身と ちがう');
      var bk = $('oppBacks');
      if (bk && vis(bk) && bk.querySelectorAll('.bk').length !== h.hands[CPU].length) b12.push('ロボットの 手札の 裏が ' + bk.querySelectorAll('.bk').length + '枚');
      /* 盃は タネの 束 */
      document.querySelectorAll('.grp').forEach(function (g) { g.querySelectorAll('.hc').forEach(function (c) { if (CARDS[+c.dataset.id].type !== g.dataset.g) b12.push('札 ' + c.dataset.id + ' が ' + g.dataset.g + ' の 束'); }); });
    }
    put('⑫', b12, uses + '枚');

    /* ⑬ 点 ＝ HanaCore */
    var b13 = [];
    if (S && S.pts) {
      document.querySelectorAll('[data-pts="0"],[data-pts="1"]').forEach(function (e) { if (e.tagName === 'B' && e.closest('.tot') && +e.textContent !== S.pts[+e.dataset.pts]) b13.push('帯の 合計が ちがう'); });
      document.querySelectorAll('[data-tot]').forEach(function (e) { if (vis(e) && parseInt(e.textContent, 10) !== S.pts[+e.dataset.tot]) b13.push('箱の 合計が ちがう'); });
    }
    if (onBoard && !hold) {
      document.querySelectorAll('[data-now]').forEach(function (e) { var p = +e.dataset.now; if (+e.querySelector('b').textContent !== HC.total(h.got[p])) b13.push('「いま ◯点」が 部品と ちがう'); });
    }
    if (onBoard && !$('koiWrap').classList.contains('hidden')) {
      var pay13 = HC.pay(HC.judge(h.got[HUMAN]), h.koi[CPU] > 0).pts;
      if (+$('koiPts').dataset.pts !== pay13 || parseInt($('koiPts').textContent, 10) !== pay13) b13.push('★勝負の 箱の 点が 部品と ちがう（' + $('koiPts').textContent + '／' + pay13 + '）');
      if (h.step !== 'koi' || h.turn !== HUMAN) b13.push('勝負の 箱が 出る 場面で ない');
    }
    if (S && S.phase === 'result' && !$('resultWrap').classList.contains('hidden') && resultKind === 'round') {
      var r13 = h.res, want13 = r13.w < 0 ? 0 : r13.kind === 'teyaku' ? 6 : HC.pay(HC.judge(h.got[r13.w]), h.koi[1 - r13.w] > 0).pts;
      if (r13.pts !== want13) b13.push('★月の 点が 部品と ちがう（' + r13.pts + '／' + want13 + '）');
      var sumEl = $('resultBody').querySelector('.rs-sum b');
      if (r13.w >= 0 && (!sumEl || parseInt(sumEl.textContent, 10) !== r13.pts)) b13.push('★月の 結果の 点の 字が ちがう');
    }
    put('⑬', b13);

    /* ⑭ しまう */
    var b14 = [];
    if (S && store) {
      var raw = store.getItem(SAVE_KEY);
      if (raw !== JSON.stringify(S)) b14.push('しまった 中身が いまの 試合と ちがう');
      try { if (!goodState(JSON.parse(raw))) b14.push('しまった 中身が 決まりに 合わない'); } catch (e) { b14.push('しまった 中身が 読めない'); }
    }
    if (!S && store && store.getItem(SAVE_KEY)) b14.push('はじめの 画面なのに 試合が のこって いる');
    put('⑭', b14);

    /* ⑮ 2連打の 止め */
    var b15 = [];
    (function () {
      var keep = guardUntil; guardUntil = now() + 300;
      var ev = new MouseEvent('click', { bubbles: true, cancelable: true });
      var hit = false, fn = function () { hit = true; };
      $('btnHowto').addEventListener('click', fn);
      $('btnHowto').dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true }));
      var ok = !$('btnHowto').dispatchEvent(ev);
      $('btnHowto').removeEventListener('click', fn);
      guardUntil = keep;
      if (!ok || hit) b15.push('箱を 閉じた 直後の 指が 帯の ボタンに 届いた');
      if (modalOpen() && !hd.dataset.keep) { /* 何も しない */ }
    })();
    put('⑮', b15);

    /* ⑯ ことば */
    var b16 = [], texts = [];
    (function walk(nd) {
      if (nd.nodeType === 3) { texts.push(nd.nodeValue); return; }
      if (nd.nodeType !== 1) return;
      var tg = nd.tagName.toLowerCase(); if (tg === 'script' || tg === 'style') return;
      if (nd.getAttribute('aria-label')) texts.push(nd.getAttribute('aria-label'));
      for (var i16 = 0; i16 < nd.childNodes.length; i16++) walk(nd.childNodes[i16]);
    })(document.body);
    Object.keys(LINES).forEach(function (k) { texts.push(LINES[k]); });
    CARDS.forEach(function (c) { texts.push(c.name); });
    var all16 = texts.join('\n') + document.title + (meta('meta[name="description"]') || '');
    for (var b = 0; b < BANNED.length; b++) if (all16.indexOf(BANNED[b]) >= 0) b16.push('中学の 字「' + BANNED[b] + '」');
    MANGA.forEach(function (w) { if (all16.indexOf(w) >= 0) b16.push('使わない 書き文字'); });
    put('⑯', b16);

    /* ⑰ 箱 */
    var b17 = [], rw = $('resultWrap'), rbx = $('resultBox');
    if (!rw.classList.contains('hidden')) {
      if (rbx.scrollHeight > rbx.clientHeight + 1) b17.push('箱の 中身が 切れた（' + rbx.scrollHeight + '＞' + rbx.clientHeight + '）');
      var br = rbx.getBoundingClientRect(); if (br.top < -0.5 || br.bottom > H + 0.5 || br.left < -0.5 || br.right > W + 0.5) b17.push('箱が 画面から 出た');
      var tt = $('resultTitle').textContent;
      if (resultKind === 'final') {
        var wn = E.matchWinner(S);
        if ((wn === -1) !== (tt.indexOf('引き分け') >= 0)) b17.push('★試合の おわりの「引き分け」が 点と 合わない');
        if (wn === HUMAN && tt.indexOf('あなたの 勝ち') < 0) b17.push('★勝ったのに「' + tt + '」');
        if (wn === CPU && tt.indexOf('ロボットの 勝ち') < 0) b17.push('★負けたのに「' + tt + '」');
        if ($('resultBody').querySelectorAll('.rs-log li').length !== S.months) b17.push('月の 記録が ' + S.months + 'つで ない');
      } else if (S && S.h && S.h.res) {
        var r17 = S.h.res;
        if (r17.w < 0 && tt !== '流れ') b17.push('流れ なのに「' + tt + '」');
        if (r17.w === HUMAN && tt.indexOf('あなたの 勝ち') < 0) b17.push('月の 勝ちの 字が ちがう');
        if (r17.w === CPU && tt.indexOf('ロボットの 勝ち') < 0) b17.push('月の 負けの 字が ちがう');
      }
    }
    var kw = $('koiWrap');
    if (!kw.classList.contains('hidden')) {
      var kb = $('koiBox');
      if (kb.scrollHeight > kb.clientHeight + 1 || kb.scrollWidth > kb.clientWidth + 1) b17.push('勝負の 箱の 中身が 切れた（' + kb.scrollHeight + '＞' + kb.clientHeight + '）');
      var kr = kw.getBoundingClientRect(); if (kr.top < -0.5 || kr.bottom > H + 0.5 || kr.left < -0.5 || kr.right > W + 0.5) b17.push('勝負の 箱が 画面から 出た');
      ['btnShobu', 'btnKoi'].forEach(function (id) { var e = $(id), q = e.getBoundingClientRect(), qb = kb.getBoundingClientRect(); if (q.bottom > qb.bottom + 0.5 || q.right > qb.right + 0.5) b17.push(id + ' が 箱から 出た'); });
    }
    put('⑰', b17);

    /* ⑲ 字の 床 */
    var b19 = [], small = 99;
    var tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (tw.nextNode()) {
      var t = tw.currentNode; if (!t.nodeValue.trim()) continue;
      var el = t.parentElement; if (!el || el.closest('svg') || el.closest('h1')) continue;
      if (!vis(el)) continue;
      var fs19 = parseFloat(getComputedStyle(el).fontSize); if (fs19 < small) small = fs19;
      if (fs19 < 11) b19.push('字が 小さい ' + fs19 + 'px「' + t.nodeValue.trim().slice(0, 10) + '」');
    }
    put('⑲', b19, 'いちばん 小さい 字 ' + small + 'px');

    /* ⑳ エラー */
    put('⑳', pageErrors.slice(0, 5));

    /* ㉑ ハッピーは いちばん 上 */
    var b21 = [], lrEl = $('logRow');
    if (onBoard) {
      if (yoko) {
        if (lrEl.parentElement !== $('side') || lrEl.previousElementSibling !== tb) b21.push('よこで ハッピーが 柱の 帯の すぐ 下に ない');
      } else if (geo.c) {
        if (lrEl.parentElement !== tb) b21.push('詰める 形で ハッピーが 帯の 中に ない');
      } else {
        if (lrEl.parentElement !== $('app') || lrEl.previousElementSibling !== tb) b21.push('ハッピーが 帯の すぐ 下に ない');
        var lb = lrEl.getBoundingClientRect().bottom;
        ['oppStrip', 'field', 'hand'].forEach(function (id) { if ($(id).getBoundingClientRect().top < lb - 0.5) b21.push('ハッピーより 上に ' + id); });
      }
    } else if (lrEl.previousElementSibling !== tb) b21.push('はじめの 画面で ハッピーが 帯の すぐ 下に ない');
    put('㉑', b21);

    /* ㉒ 山の 残りの 枚数を 出さない */
    var b22 = [];
    document.querySelectorAll('.stack .dn').forEach(function (e) { if (e.textContent !== '山') b22.push('山の 字が「' + e.textContent + '」'); });
    if (/山[ 　]*\d|山の 残り|残り[ 　]*\d+[ 　]*枚/.test(document.body.innerText)) b22.push('★山の 残りの 数が 出て いる');
    put('㉒', b22);

    /* ㉓ こいこい中 と 相手の 取り札 */
    var b23 = [];
    if (onBoard) {
      var oc = $('oppTag').textContent.indexOf('こいこい中') >= 0, mc = $('meTag').textContent.indexOf('こいこい中') >= 0;
      if (oc !== (h.koi[CPU] > 0)) b23.push('ロボットの「こいこい中」が 中身と ちがう');
      if (mc !== (h.koi[HUMAN] > 0)) b23.push('あなたの「こいこい中」が 中身と ちがう');
      if (!kw.classList.contains('hidden') && over(kw.getBoundingClientRect(), $('oppStrip').getBoundingClientRect())) b23.push('★勝負の 箱が 相手の 取り札を かくした');
    }
    put('㉓', b23);

    /* ㉔ うっかり */
    var b24 = [];
    if (typeof TUNE.MISTAKE !== 'number' || !(TUNE.MISTAKE >= 0 && TUNE.MISTAKE <= 1)) b24.push('TUNE.MISTAKE が ' + TUNE.MISTAKE);
    if (!/TUNE\.MISTAKE/.test(String(E.cpuMove))) b24.push('★ロボットの 手が TUNE.MISTAKE を 読んで いない');
    put('㉔', b24, 'うっかり ' + Math.round(TUNE.MISTAKE * 100) + '%');

    /* ㉙ あそびかたの 箱：× が 字に かからない（★T366・🎨アト）
       ★ × は sticky の まま。★題（h2）を 白い 帯に して ×の 下に 敷き、★中身は 帯の 下に もぐる。
       ★ 数え方：箱を 12px ずつ いちばん 下まで 送り、★×の 丸の 中で「×が 無ければ 見える 字」を 4px ごとに 数える
         ★（★字の たけ 13px＋× 44px ＝ 1回 かかると 57px 以上 送る あいだ 続く ので、12px 送りで 見のがさない。★細かく 測る 道具は T366_計測どうぐ_アト の t366_probe.cjs ＝ 8px 送り・2px ごと）
         ★（★字の 場所は 送り0で 1回 測り、送った ぶんを 引く。★帯の 中の 字だけ 毎回 測る）。
         ★ あわせて：★いちばん 上で 帯の 下に かくれて 二度と 見えない 字／★× が 帯の 下に もぐって いないか／★× は 44px 以上。
       ★ わざと 壊す（★使い捨ての <style> 1枚・貼り紙は 使わない）：
         ★ 甲＝帯を 流れに 戻す／乙＝帯を すける 色に／丙＝帯を 低く／丁＝× の z-index を 外す ―― ★どれも 鳴る こと。
         ★ 送れる はばが 帯の たけ（52px）より 小さい 画面では 甲〜丙は 試せない（★中身が ×の 下まで 来ない ことが ある・★ラビット 1280×800 は 13px）。
       ★ 閉じた 箱は 開いて 数え、★送り位置と 開け閉めを 元に 戻す。 */
    var bX = [], infoX = '';
    (function () {
      var dlg = document.getElementById('helpDialog'), xb = dlg && dlg.querySelector('.close-dialog'), band = xb && xb.nextElementSibling;
      if (!dlg || !xb || !band) { bX.push('★あそびかたの 箱・×・題の 帯の どれかが 無い'); return; }
      var was = dlg.open, keep = dlg.scrollTop, sabo = null;
      function kowasu(css) { if (!sabo) { sabo = document.createElement('style'); document.head.appendChild(sabo); } sabo.textContent = css; void dlg.offsetHeight; }
      function modosu() { if (sabo) { if (sabo.parentNode) sabo.parentNode.removeChild(sabo); sabo = null; void dlg.offsetHeight; } }
      function rects(n) { var rg = document.createRange(); rg.selectNodeContents(n); return Array.prototype.filter.call(rg.getClientRects(), function (q) { return q.width > 0.5 && q.height > 0.5; }).map(function (q) { return { l: q.left, r: q.right, t: q.top, b: q.bottom }; }); }
      function kazoeru() {
        var max = Math.max(0, dlg.scrollHeight - dlg.clientHeight), tw = document.createTreeWalker(dlg, NodeFilter.SHOW_TEXT, null), t, ns = [];
        dlg.scrollTop = 0; void dlg.offsetHeight;
        while ((t = tw.nextNode())) if (t.nodeValue.trim() && !xb.contains(t)) ns.push({ n: t, live: band.contains(t), q: band.contains(t) ? null : rects(t) });
        var cs = getComputedStyle(band), stick = cs.position === 'sticky', bg = cs.backgroundColor;
        var see = !stick || bg === 'transparent' || /,\s*0(\.\d+)?\)$/.test(bg);
        var r = { pts: 0, worst: 0, at: 0, who: {}, lost: 0, under: 0, max: max, small: '' };
        for (var s = 0; ; s = Math.min(s + 12, max)) {
          dlg.scrollTop = s; void dlg.offsetHeight;
          var real = dlg.scrollTop, xr = xb.getBoundingClientRect(), cx = (xr.left + xr.right) / 2, cy = (xr.top + xr.bottom) / 2, rr = Math.min(xr.width, xr.height) / 2, here = 0;
          if (xr.width < 43.5 || xr.height < 43.5) r.small = Math.round(xr.width) + '×' + Math.round(xr.height);
          var c0 = document.elementFromPoint(cx, cy);
          if (c0 && c0 !== xb && !xb.contains(c0)) r.under++;
          for (var i = 0; i < ns.length; i++) {
            var o = ns[i], pe = o.n.parentElement, qs = o.live ? rects(o.n) : o.q;
            for (var j = 0; j < qs.length; j++) {
              var q = qs[j], dy = o.live ? 0 : real;
              var x1 = Math.max(q.l, xr.left), x2 = Math.min(q.r, xr.right), y1 = Math.max(q.t - dy, xr.top), y2 = Math.min(q.b - dy, xr.bottom);
              if (x2 - x1 < 0.5 || y2 - y1 < 0.5) continue;
              for (var y = y1 + 1; y < y2; y += 4) for (var x = x1 + 1; x < x2; x += 4) {
                if ((x - cx) * (x - cx) + (y - cy) * (y - cy) > rr * rr) continue;
                var st = document.elementsFromPoint(x, y), top = null;
                for (var k = 0; k < st.length; k++) { if (st[k] !== xb && !xb.contains(st[k])) { top = st[k]; break; } }
                if (top && (top === pe || pe.contains(top) || top.contains(pe) || (see && top === band))) { here++; r.who[o.n.nodeValue.trim().slice(0, 8)] = 1; }
              }
            }
          }
          r.pts += here; if (here > r.worst) { r.worst = here; r.at = real; }
          if (s >= max) break;
        }
        dlg.scrollTop = 0; void dlg.offsetHeight;
        if (stick) {
          var bb = band.getBoundingClientRect().bottom, vt = dlg.getBoundingClientRect().top + dlg.clientTop;
          ns.forEach(function (o) { if (o.live) return; o.q.forEach(function (q) { if (q.t < bb - 0.5 && q.b > vt + 0.5) r.lost++; }); });
        }
        return r;
      }
      try {
        if (!was) { try { dlg.showModal(); } catch (e0) {} }
        if (!dlg.open) { infoX = '★箱を 開けなかった（★数えて いない）'; return; }
        var r = kazoeru();
        if (r.small) bX.push('★× が ' + r.small + 'px（★44px の 床）');
        if (r.pts) bX.push('★× が 字に かかった：約' + r.pts * 16 + 'px²（★いちばん 多い 送り ' + r.at + 'px・「' + Object.keys(r.who).slice(0, 3).join('」「') + '」）');
        if (r.lost) bX.push('★題の 帯の 下に かくれて 二度と 見えない 字 ' + r.lost + 'か所');
        if (r.under) bX.push('★× が 帯の 下に もぐった（' + r.under + 'こま）');
        var kill = [], shiken = [['丁 ×の z-index を 外す', '#helpDialog .close-dialog { z-index:auto !important; }']];
        if (r.max >= 52) shiken = [['甲 帯を 流れに 戻す', 'position:static !important;'], ['乙 帯を すける 色に', 'background:transparent !important;'], ['丙 帯を 低く', 'min-height:0 !important; padding-top:0 !important; line-height:1.2 !important;']]
          .map(function (k) { return [k[0], '#helpDialog .close-dialog + * { ' + k[1] + ' }']; }).concat(shiken);
        else kill.push('送れる はば ' + r.max + 'px ＜ 帯の たけ 52px ―― 甲〜丙は 試せない');
        shiken.forEach(function (k) {
          kowasu(k[1]); var rk = kazoeru(); modosu();
          var nk = rk.pts + rk.lost + rk.under;
          kill.push(k[0] + (nk ? ' 鳴る' : ' ★空うち'));
          if (!nk) bX.push('★見張りが 空うち（' + k[0] + '）');
        });
        infoX = '送れる はば ' + r.max + 'px・× ' + Math.round(xb.getBoundingClientRect().width) + 'px・' + kill.join('／');
      } finally {
        modosu();
        dlg.scrollTop = was ? keep : 0;
        if (!was && dlg.open) dlg.close();
      }
    })();
    put('㉙', bX, infoX);

    var out = { '★NG': ng.length, '中身': ng.length ? ng : 'ぜんぶ OK ✅', '画面': W + '×' + H, '場面': !S ? 'はじめ' : S.phase + (S.h ? '・' + S.h.step : ''), 'かかった': (Date.now() - t0) + 'ms' };
    for (var kk in note) if (note.hasOwnProperty(kk)) out[kk] = note[kk];
    return out;
  }

  /* ============================================================
     ★ たしかめ用の 窓口（window.HANAFUDA）― ★画面には 1つも 出さない
     ============================================================ */
  window.HANAFUDA = {
    verify: verify,
    lines: LINES,
    engine: E,
    state: function () { return S ? JSON.parse(JSON.stringify(S)) : null; },
    now: function () { return { 場面: sceneOf(), 選んだ: sel, うごき中: busy, 並べ方: { mode: geo.mode, c: geo.c, d: geo.d, low: geo.low, 場: geo.m && +geo.m.fw.toFixed(1), 手札: geo.m && +geo.m.hw.toFixed(1), 取り札: geo.m && +geo.m.cw.toFixed(1), 組み直し: planTries } }; },
    /* ★ 場面への 近道（★写真の 道具 だけ）：種を 決めて 試合を はじめる */
    start: function (months, seed) { startMatch(months || 3, seed == null ? 1 : seed); return HANAFUDA.now(); },
    /* ★ 札・席の 場所（★本物の 指で 押す 道具が 使う）*/
    where: function (kind, x) {
      var el = null;
      if (kind === 'hand' || kind === 'field') el = $(kind).querySelector('.hc[data-id="' + x + '"]');
      else if (kind === 'seat') el = $('field').querySelector('[data-seat="' + x + '"]');
      else if (kind === 'oya') el = $('btnOya' + x);
      if (!el) return null;
      var r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + Math.min(r.height / 2, r.width * R / 2), w: r.width, h: r.height };
    },
    busy: function () { return busy; },
    /* ★ 見張りを わざと 壊す 試し 用 */
    _noGuard: function () { window.removeEventListener('pointerdown', guardEv, true); window.removeEventListener('click', guardEv, true); return 1; },
    _tune: TUNE
  };


})(typeof globalThis !== 'undefined' ? globalThis : this);
