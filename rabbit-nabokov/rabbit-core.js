/* ============================================================
   オリジナルラビット・ナボコフ ― 決まりと ロボット（T307・コーダ／★T310 で 社長の 新しい 決まりに）
   ------------------------------------------------------------
   ★ 画面を 1つも 触りません。★ブラウザでも Node でも 同じ ファイルが 動きます
     （★Node で はしごを 測る 道具が、★ゲームと 1文字も 同じ 決まりを 使う ため）。
   ★ 仕様の 正：ルルの T306 §4（★案C）＋ ★★T310 社長の 決まり（2026-09-25）
     ・1対1。★親は 手札から 1枚 ふせて 出す → 子が かける → めくる → 子が 1枚 出す
     ・数の 差が ちょうど 2 なら 子の 勝ち（★同じ マークなら 2倍）
     ・特別：親 A → A でだけ 10倍／親 2 → ジョーカーでだけ 50倍（★2 を 出すと −10倍）／
             親 ジョーカー → ハートの 2 でだけ 100倍（★倍率は この まま）
     ・A は 1・J は 11・Q は 12・K は 13
   ★★ T310 で 変わった こと（★社長の 言葉 どおり）
     ・★札は ★スペードと ハートの 13枚ずつ ＋ ★ジョーカー 2枚 ＝ ★28枚
     ・★手札 5枚ずつ。★1回ごとに 親から 1枚ずつ 引く。★山が なくなっても 続け、
       ★★2人の 手札が なくなったら おわり（★28枚 → ★ちょうど 14回・★親は 7回ずつ）
     ・★★（オリジナルルール）親が K → ★子は J・Q・K・A の どれかを 必ず 出す ＝ ★★子の 勝ち
       （★倍率は ふつう ＝ 1倍・★マークも 同じなら 2倍。★★K の ときは 差 2 の 決まりを 使わない）。
       ★1枚も 無い ときは（★★ジョーカーも だめ）好きな 札を 1枚 出して ★かけた 枚数の 10倍を 親に はらう
       ★★（★社長の 訂正 2026-09-25：「K に 勝てるのは J、Q、K、A」）
     ・★コインが 0枚より 少なく なっても おわらない（★払えない 分を 切らない ―― ★全部 はらう）
     ・★かけ金は ★1〜100枚（★コインが 何枚でも ―― ★前の「少ない 方まで」「あるだけ」は なくした）
   ★★ 札の 形：{ r:1..13, s:0..1 }（★s … 0 スペード／1 ハート）
              ジョーカー { r:0, s:-1 }（★JOKER1）と { r:0, s:-2 }（★JOKER2）。
   ★★ この ファイルの 言葉・名前は ぜんぶ うちの もの（★作中の 台詞・掛け声・役の 名前は 0）。
   ============================================================ */
(function (root) {
  'use strict';

  var HUMAN = 0, ROBOT = 1;
  var START_COINS = 100;
  var HAND_N = 5;
  var DECK_N = 28;                 /* ★ スペード 13 ＋ ハート 13 ＋ ジョーカー 2 */
  var ROUNDS = 14;                 /* ★ 28枚 ÷ 1回 2枚 ＝ 14回（★親は 7回ずつ） */
  var BET_MIN = 1, BET_MAX = 100, BET_START = 10;
  /* ★ 倍率（★10倍・50倍・100倍・わな −10倍 の まま ＋ ★K の −10倍） */
  var PAY = { normal: 1, suit: 2, aa: 10, joker2: 50, heart2joker: 100, trap2: -10, kpen: -10, lose: -1 };

  var SUIT_NAME = ['スペード', 'ハート', 'ダイヤ', 'クローバー'];
  var RANK_NAME = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  function makeDeck() {
    var d = [];
    for (var s = 0; s < 2; s++) for (var r = 1; r <= 13; r++) d.push({ r: r, s: s });
    d.push({ r: 0, s: -1 });
    d.push({ r: 0, s: -2 });
    return d;
  }
  function isJoker(c) { return c.r === 0; }
  function isHeart2(c) { return c.r === 2 && c.s === 1; }
  function isKing(c) { return c.r === 13; }
  /* ★ K に 出せる 札：★絵札（J・Q・K）と A（★ジョーカーは 絵札では ない ―― T310 で 決めた） */
  function isFaceOrA(c) { return c.r === 1 || c.r >= 11; }
  function key(c) { return c.r + ':' + c.s; }
  function fileName(c) { return isJoker(c) ? (c.s === -2 ? 'JOKER2' : 'JOKER1') : SUIT_NAME[c.s] + RANK_NAME[c.r]; }
  function speak(c) { return isJoker(c) ? 'ジョーカー' : SUIT_NAME[c.s] + 'の ' + RANK_NAME[c.r]; }
  function rankText(c) { return isJoker(c) ? 'ジョーカー' : RANK_NAME[c.r]; }

  /* ★★ 子の 札 k を 親の 札 p に 出した ときの 倍率（★2枚だけで 決まる 分）★★
     ★ K の 決まり（★手札を 見ないと 決まらない 分）は ★下の payOf。 */
  function judge(p, k) {
    if (isJoker(p)) return isHeart2(k) ? PAY.heart2joker : PAY.lose;   /* ★ジョーカーに ジョーカー ＝ 子の 負け（★社長：ハートの 2 だけで 勝てる） */
    /* ★★ T310（オリジナルルール・★社長の 訂正）：親が K → ★J・Q・K・A なら 子の 勝ち（★マークも 同じなら 2倍）。
       ★ それ 以外（★ジョーカーも）を 出せるのは ★J・Q・K・A を 1枚も 持って いない とき だけ ＝ ★いつも −10倍 */
    if (isKing(p)) return isFaceOrA(k) ? (p.s === k.s ? PAY.suit : PAY.normal) : PAY.kpen;
    if (p.r === 1) return k.r === 1 ? PAY.aa : PAY.lose;
    if (p.r === 2) {
      if (isJoker(k)) return PAY.joker2;
      if (k.r === 2) return PAY.trap2;
      return PAY.lose;
    }
    if (isJoker(k)) return PAY.lose;
    if (Math.abs(p.r - k.r) === 2) return p.s === k.s ? PAY.suit : PAY.normal;
    return PAY.lose;
  }
  /* ★★ K の 決まり（★オリジナルルール）★★
     ★ 親が K で、★子の 手札に J・Q・K・A が あれば ★その 中からしか 出せない。
     ★ 1枚も 無ければ ★どれでも 出せる（★そのかわり −10倍）。 */
  function kPenalty(p, hand) {
    return !!p && !isJoker(p) && isKing(p) && !hand.some(isFaceOrA);
  }
  function legalIdx(hand, p) {
    var all = [], face = [], i;
    for (i = 0; i < hand.length; i++) { all.push(i); if (isFaceOrA(hand[i])) face.push(i); }
    if (p && !isJoker(p) && isKing(p) && face.length) return face;
    return all;
  }
  /* ★ 手札 hand から k を 出した ときの 倍率（★K の 決まりも 入れた 本当の 値） */
  function payOf(p, k, hand) {
    return kPenalty(p, hand) ? PAY.kpen : judge(p, k);
  }
  /* ★ 結果の 名前（★画面と ハッピーが 使う。★作中の 役の 名前は 使わない） */
  function kindOfMult(m, pen, kWin) {
    if (pen) return 'kpen';
    if (kWin) return m === PAY.suit ? 'ksuit' : 'kwin';     /* ★ K に J・Q・K・A で 勝った（★差 2 では ない ので 名前を 分ける） */
    if (m === PAY.heart2joker) return 'x100';
    if (m === PAY.joker2) return 'x50';
    if (m === PAY.aa) return 'x10';
    if (m === PAY.trap2) return 'trap';
    if (m === PAY.suit) return 'suit';
    if (m === PAY.normal) return 'hit';
    return 'miss';
  }
  function kindOf(p, k) { var m = judge(p, k), K = !isJoker(p) && isKing(p); return kindOfMult(m, K && m === PAY.kpen, K && m > 0); }
  /* ★ 数の 差（★出した あとに「差 3」と 見せる ため。★特別な 札の ときは null） */
  function diffOf(p, k) {
    if (isJoker(p) || isJoker(k) || p.r <= 2 || isKing(p)) return null;     /* ★ K の ときは 差を 使わない（★社長の 訂正） */
    return Math.abs(p.r - k.r);
  }

  function shuffle(a, rnd) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  /* ★ 種から 同じ 並びを 出す（★測る ときだけ 使う。★ふだんの 配りは Math.random） */
  function rng(seed) {
    var x = (seed >>> 0) || 1;
    return function () { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };
  }

  /* ★★ かけ金（★T310：★いつでも 1〜100枚。★コインが 0枚より 少なくても 同じ）★★ */
  function betOk(n) { return typeof n === 'number' && n % 1 === 0 && n >= BET_MIN && n <= BET_MAX; }
  function clampBet(n) { return Math.max(BET_MIN, Math.min(BET_MAX, Math.round(n))); }

  /* ============================================================
     ★★ 1試合の 進み方（★画面も 測る 道具も、★この 5つだけを 通る）★★
       newMatch → place（親）→ bet（子）→ play（子）→ next → place …
     ★ 決まりに 合わない 手は ★例外で 止めます（★黙って 進めない）。
     ============================================================ */
  function newMatch(rnd) {
    var deck = shuffle(makeDeck(), rnd);
    return {
      deck: deck,
      hands: [deck.splice(0, HAND_N), deck.splice(0, HAND_N)],
      coins: [START_COINS, START_COINS],
      parent: HUMAN,            /* ★★ T310：1回目の 親は ★いつも あなた（★社長の お決め）。
                                   ★ 数える 人どうしだと ★14回目の 子（＝1回目の 親）が 71% 勝つ（ルル T311）→ ★得を する 側に 人を 置く */
      round: 1,
      phase: 'place',           /* place → bet → play → done →（next）→ place … → over */
      down: null,               /* 親の ふせた 札 */
      faceUp: false,
      bet: 0,
      childCard: null,
      last: null,               /* 最後の 1回の 結果 */
      discard: [],              /* 捨て札（★表向きで 重ねる。★見えるのは いちばん 上だけ） */
      seen: []                  /* ★2人とも 見た 札（★表に なった 札だけ）。ロボットが 数えるのは ここだけ */
    };
  }
  function childOf(st) { return 1 - st.parent; }
  function fail(t) { throw new Error('★決まりに 合わない：' + t); }

  function place(st, who, idx) {
    if (st.phase !== 'place') fail('いまは 親が ふせる 時では ない（' + st.phase + '）');
    if (who !== st.parent) fail('親では ない 人が ふせた');
    var h = st.hands[who];
    if (!(idx >= 0 && idx < h.length)) fail('手札に ない 札');
    st.down = h.splice(idx, 1)[0];
    st.faceUp = false;
    st.phase = 'bet';
    return st.down;
  }
  function bet(st, who, amount) {
    if (st.phase !== 'bet') fail('いまは かける 時では ない（' + st.phase + '）');
    if (who !== childOf(st)) fail('子では ない 人が かけた');
    if (!betOk(amount)) fail('かけられない 枚数：' + amount + '（★1〜100枚）');
    st.bet = amount;
    st.faceUp = true;                /* ★ かけたら すぐ めくる（★ルル §4-2 の 2） */
    st.seen.push(key(st.down));
    st.phase = 'play';
    return st.down;
  }
  function play(st, who, idx) {
    if (st.phase !== 'play') fail('いまは 子が 出す 時では ない（' + st.phase + '）');
    if (who !== childOf(st)) fail('子では ない 人が 出した');
    var h = st.hands[who], p = st.down;
    if (!(idx >= 0 && idx < h.length)) fail('手札に ない 札');
    if (legalIdx(h, p).indexOf(idx) < 0) fail('親が K なのに J・Q・K・A を 出さなかった（★出せる 札が ある）');
    var pen = kPenalty(p, h);
    var k = h.splice(idx, 1)[0], c = who, o = st.parent;
    var mult = pen ? PAY.kpen : judge(p, k);
    var m = mult * st.bet;                                   /* ★ T310：★払えない 分を 切らない（★0枚より 少なく なる） */
    st.coins[c] += m; st.coins[o] -= m;
    st.childCard = k;
    st.seen.push(key(k));
    st.last = { parent: o, child: c, p: p, k: k, bet: st.bet, mult: mult, move: m,
                kind: kindOfMult(mult, pen, !isJoker(p) && isKing(p) && mult > 0), diff: pen ? null : diffOf(p, k), round: st.round };
    st.phase = 'done';
    return st.last;
  }
  function isOverAfter(st) {
    return st.hands[0].length === 0 && st.hands[1].length === 0 && st.deck.length === 0;
  }
  function next(st) {
    if (st.phase !== 'done') fail('まだ 1回が 終わって いない（' + st.phase + '）');
    st.discard.push(st.down, st.childCard);
    st.down = null; st.childCard = null; st.faceUp = false; st.bet = 0;
    var p = st.parent;
    /* ★ 山が あれば 親から 1枚ずつ 引く（★山は いつも 偶数 ―― 1枚だけ 残る ことは ない） */
    if (st.deck.length >= 2) {
      st.hands[p].push(st.deck.shift());
      st.hands[1 - p].push(st.deck.shift());
    } else if (st.deck.length === 1) fail('山が 1枚だけ 残った');
    /* ★★ T310：★おわりは「2人の 手札が なくなったら」だけ（★コインが 0枚より 少なくても 続ける） */
    if (st.hands[0].length === 0 && st.hands[1].length === 0) { st.phase = 'over'; return st; }
    if (st.hands[0].length !== st.hands[1].length) fail('2人の 手札の 数が ちがう');
    st.parent = 1 - p;                                      /* ★ 親と 子を 交代 */
    st.round++;
    st.phase = 'place';
    return st;
  }
  function winner(st) {
    if (st.coins[0] > st.coins[1]) return HUMAN;
    if (st.coins[0] < st.coins[1]) return ROBOT;
    return -1;
  }

  /* ============================================================
     ★★★ ロボット（★ルル T306 の 段 0〜5 ＋ ★T310 の K と かけ金）★★★
     ------------------------------------------------------------
     ★ 画面の つよさ：よわい＝段1／ふつう＝段3／つよい＝段5。
     ★ 段0・2・4 は ★「人の 打ち方の ものさし」として はしごを 測る ときだけ 使います。
     ★★ ロボットに 渡すのは「自分の 手札・表に なった 札・コイン 2つ・山の 枚数」だけ（view）。
        ★相手の 手札も 山の 順番も ★渡しません（★見張り verify ③ が 数えます）。
     ★★ 段ごとの K と かけ金
        段0 … K でも 出せる 札から でたらめ／かけ金 でたらめ（1〜100）
        段1 … 差 2 を 見つける（★K では 出せる 札の 中から）／かけ金 いつも 10         ← ★よわい
        段2 … ＋わな・マーク（★出せる 札の 中で いちばん 良い）／かけ金 いつも 10
        段3 … ＋残す札・ふせる札 ―― ★親で K を 出すのは 賭け（★相手が J・Q・K・A を 持って いれば 負け）・
               ★子で J・Q・K・A を 残す（★K の 勝ちと 10倍を 数に 入れる）
               ／かけ金 ★いつも 100                                                 ← ★ふつう
        段4 … ＋かけ金を 手札で「悪ければ 1・ほかは 100」
        段5 … ＋数える（★表に なった 札を 引いて 考える。★山が 0 なら 相手の 手札が 全部 わかる）   ← ★つよい
     ★★ かけ方は ★ルル T311 §5 の 数え（★「1 か 100」が いちばん・★「いつも 100」は 答えに ならない）に そろえた。
     ============================================================ */
  var LAMBDA = 2;
  function comb(n, k) { if (k < 0 || k > n) return 0; var r = 1; for (var i = 0; i < k; i++) r = r * (n - i) / (i + 1); return r; }
  /* ★ まだ 見ていない 札（★count が true なら 表に なった 札も 引く ＝ 段5 の「数える」） */
  function unseenOf(hand, seen, count) {
    var ban = {};
    for (var i = 0; i < hand.length; i++) ban[key(hand[i])] = 1;
    if (count) for (var j = 0; j < seen.length; j++) ban[seen[j]] = 1;
    return makeDeck().filter(function (x) { return !ban[key(x)]; });
  }
  /* ★ 手札 hand で 親の 札 p に 出せる いちばん 良い 倍率（★K の 決まりも 入れる） */
  function bestPay(p, hand) {
    if (!hand.length) return 0;
    var L = legalIdx(hand, p), b = -Infinity;
    for (var i = 0; i < L.length; i++) { var v = payOf(p, hand[L[i]], hand); if (v > b) b = v; }
    return b;
  }
  /* ★ 手札 hand で、親の 札が unseen から 一様に 出る ときの「いちばん 良い 札を 出した」倍率の 平均 */
  function handEV(hand, unseen) {
    if (!unseen.length || !hand.length) return { ev: 0, pw: 0 };
    var s = 0, w = 0;
    for (var i = 0; i < unseen.length; i++) {
      var b = bestPay(unseen[i], hand);
      s += b; if (b > 0) w++;
    }
    return { ev: s / unseen.length, pw: w / unseen.length };
  }
  /* ★ 親が x を ふせた とき、★子（手札 h枚を U から 引いた 人）が 取る 倍率の 平均
     ★ 1枚ごとの 値 v を 決めて「手札の 中の いちばん 大きい v」の 平均を ★組み合わせで 数える。
     ★ K の ときは ★J・Q・K・A 以外を −10 と 置く ＝「1枚も 無ければ −10・あれば その 中の いちばん 良い」と 同じ。 */
  function childGain(x, U, h) {
    var n = U.length; if (!n || h <= 0) return 0;
    if (h > n) h = n;
    var kRule = !isJoker(x) && isKing(x);
    var vals = U.map(function (c) { return (kRule && !isFaceOrA(c)) ? PAY.kpen : judge(x, c); });
    var lv = vals.slice().sort(function (a, b) { return a - b; }).filter(function (v, i, a) { return !i || a[i - 1] !== v; });
    var tot = comb(n, h), e = 0, prev = 0;
    for (var i = 0; i < lv.length; i++) {
      var le = vals.filter(function (v) { return v <= lv[i]; }).length;
      var cdf = comb(le, h) / tot;                          /* ★ いちばん 大きい v が lv[i] 以下 */
      e += lv[i] * (cdf - prev); prev = cdf;
    }
    return e;
  }
  /* ★★ T310：★残す 手札の 値打ち（★段3 から 上）★★
     ★ 山が 0 に なったら ★残った 札は 全部 使い切る ＝ ★この 先 親で 出させられる 札が ある。
     ★ 自分が この 先 親に なる 回の 分だけ ★「親で ふせた ときの 損」を 入れる。
     ★ ★入れる 前は ★2・ジョーカーを 最後まで かかえて ★14回目の 親が 100倍・50倍を 取られていた
       （★段3どうしで 1回目の 親が 86.8% 勝つ → 入れて 51.6%【計算・t310_18・t310_20】）。
     ★ 社長の「リスク札を どこで 使うかが カギ」を ★ロボも 考える。 */
  function restValue(rest, U, nowParent, deckN) {
    if (!rest.length) return 0;
    var ch = handEV(rest, U).ev;
    if (deckN !== 0) return ch;
    var n = rest.length, par = nowParent ? Math.floor(n / 2) : Math.ceil(n / 2), share = par / n;
    if (!share) return ch;
    var pv = 0;
    for (var i = 0; i < n; i++) pv += -childGain(rest[i], U, n);
    return (1 - share) * ch + share * pv / n;
  }
  function pickParent(L, view, rnd) {
    var hand = view.hand;
    if (L <= 2) return Math.floor(rnd() * hand.length);        /* ★ 親の 選びは 考えない（段0〜2） */
    var U = unseenOf(hand, view.seen, L >= 5);
    var bi = 0, bs = -Infinity;
    for (var i = 0; i < hand.length; i++) {
      var rest = hand.filter(function (_, j) { return j !== i; });
      var s = -childGain(hand[i], U, hand.length) + LAMBDA * 0.5 * restValue(rest, U, true, view.deckN);
      if (s > bs) { bs = s; bi = i; }
    }
    return bi;
  }
  function chooseBet(L, view, rnd) {
    if (L === 0) return BET_MIN + Math.floor(rnd() * BET_MAX);
    if (L < 3) return BET_START;                                     /* ★ いつも 10 */
    if (L === 3) return BET_MAX;                                     /* ★ いつも 100 */
    var U = unseenOf(view.hand, view.seen, L >= 5), ev;
    if (L >= 5 && view.deckN === 0) {
      /* ★ 山が 0 ＝ 見ていない 札は ★親の 手札（＋ふせた 1枚）だけ。★いちばん 悪い 札が 来ても 勝てる ときだけ 100 */
      ev = Infinity;
      for (var i = 0; i < U.length; i++) ev = Math.min(ev, bestPay(U[i], view.hand));
      if (!U.length) ev = 0;
    } else ev = handEV(view.hand, U).ev;
    return ev > 0 ? BET_MAX : BET_MIN;                               /* ★ 悪ければ 1・ほかは 100 */
  }
  function choosePlay(L, view, p, rnd) {
    var hand = view.hand, idx = legalIdx(hand, p), i;
    if (L === 0) return idx[Math.floor(rnd() * idx.length)];
    var pays = hand.map(function (k) { return payOf(p, k, hand); });
    if (L === 1) {
      var w1 = idx.filter(function (j) { return pays[j] > 0; });
      if (w1.length) return w1[Math.floor(rnd() * w1.length)];
      return idx[Math.floor(rnd() * idx.length)];
    }
    if (L === 2) {
      var best = Math.max.apply(null, idx.map(function (j) { return pays[j]; }));
      var w2 = idx.filter(function (j) { return pays[j] === best; });
      return w2[Math.floor(rnd() * w2.length)];
    }
    var seen2 = view.seen.concat([key(p)]);
    var u = unseenOf(hand, seen2, L >= 5).filter(function (x) { return key(x) !== key(p); });
    var bi = idx[0], bs = -Infinity;
    for (var q = 0; q < idx.length; q++) {
      i = idx[q];
      var rest = hand.filter(function (_, j) { return j !== i; });
      var s = pays[i] + LAMBDA * restValue(rest, u, false, view.deckN);
      if (s > bs) { bs = s; bi = i; }
    }
    return bi;
  }
  /* ★★ ロボットに 渡す 見え方（★これ 以外は 渡さない）★★ */
  function viewFor(st, who) {
    return { hand: st.hands[who].slice(), seen: st.seen.slice(), coins: st.coins[who], oppCoins: st.coins[1 - who], deckN: st.deck.length };
  }
  var LEVELS = [
    { id: 'weak',   name: 'よわい', L: 1 },
    { id: 'normal', name: 'ふつう', L: 3 },
    { id: 'strong', name: 'つよい', L: 5 }
  ];

  /* ============================================================
     ★ 1試合を 最後まで 走らせる（★測る 道具と verify が 使う。★画面は 通らない）
       Lh … 人の 側の 段（0〜5）／Lr … ロボットの 段／first … 1回目の 親（既定 HUMAN ＝ ゲームと 同じ）
     ============================================================ */
  function runMatch(Lh, Lr, seed, first) {
    var rnd = rng(seed);
    var st = newMatch(rnd);
    if (first === ROBOT) st.parent = ROBOT;                 /* ★ 測る ときだけ（★ゲームは いつも 人が 先に 親） */
    var Ls = [Lh, Lr], big = 0, guard = 0, minus = 0;
    while (st.phase !== 'over') {
      if (++guard > ROUNDS + 1) fail('終わらない 試合');
      var o = st.parent, c = 1 - o;
      place(st, o, pickParent(Ls[o], viewFor(st, o), rnd));
      bet(st, c, chooseBet(Ls[c], viewFor(st, c), rnd));
      var r = play(st, c, choosePlay(Ls[c], viewFor(st, c), st.down, rnd));
      if (Math.abs(r.mult) >= 10) big++;
      if (st.coins[0] < 0 || st.coins[1] < 0) minus = 1;
      next(st);
    }
    return { h: st.coins[0], r: st.coins[1], rounds: st.round, big: big, minus: minus, st: st };
  }

  var RN = {
    HUMAN: HUMAN, ROBOT: ROBOT, START_COINS: START_COINS, HAND_N: HAND_N, DECK_N: DECK_N, ROUNDS: ROUNDS,
    BET_MIN: BET_MIN, BET_MAX: BET_MAX, BET_START: BET_START, PAY: PAY,
    SUIT_NAME: SUIT_NAME, RANK_NAME: RANK_NAME, LEVELS: LEVELS,
    makeDeck: makeDeck, isJoker: isJoker, isHeart2: isHeart2, isKing: isKing, isFaceOrA: isFaceOrA,
    key: key, fileName: fileName, speak: speak, rankText: rankText,
    judge: judge, kPenalty: kPenalty, legalIdx: legalIdx, payOf: payOf, kindOf: kindOf, diffOf: diffOf,
    shuffle: shuffle, rng: rng, betOk: betOk, clampBet: clampBet,
    newMatch: newMatch, childOf: childOf, place: place, bet: bet, play: play, next: next,
    isOverAfter: isOverAfter, winner: winner,
    unseenOf: unseenOf, bestPay: bestPay, restValue: restValue, handEV: handEV, childGain: childGain,
    pickParent: pickParent, chooseBet: chooseBet, choosePlay: choosePlay,
    viewFor: viewFor, runMatch: runMatch
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = RN;
  else root.RNCore = RN;
})(this);
