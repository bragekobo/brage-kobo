/* ============================================================
   神経衰弱（10本目）― T79・コーダ
   ------------------------------------------------------------
   仕様は logs/T78_神経衰弱_仕様_ルル.md ＋ 社長裁定（T79）が 正。

   ★★ 社長裁定（5つ・厳守）★★
     1. ★枚数は **52枚のまま**（ルルの推し 36枚とは 逆。社長の判断）
     2. もの覚えを **4段階で 選ばせる**
     3. 初期値は **ふつう**
     4. 見せる時間 **そろわなかった 1.2秒 ／ そろった 0.6秒。人も ロボットも 同じ**
     5. ★**青わくは 作らない。強調ゼロ**

   ★ 52枚に なった ことで 変わった ところ（数え直した ＝ logs/T79_神経衰弱_52枚_見積り.cjs）
     ------------------------------------------------------------
     ・並べ方 … ★**7列×8段（56枠）。最後の段だけ 3枚（まん中の 3列）**
                375px で 49×74px（44pxの 111%）。★52枚が 入る 24通りを 全部 数えた 結果、
                375px で 44px を 守れる 形は これと 6列×9段（45px）の 2つだけ で、
                320px まで 見ると これが 一番 良い。
     ・4段階 … ★**2 ／ 4 ／ 6 ／ ぜんぶ のまま**（52枚でも 初期値「ふつう」は
                はじめての人（4枚 覚える）の 勝率 **43.6%**。動かす 理由が 無い）
     ・1試合 … ★**見立て 4〜5分**（36枚の 2分から 伸びた。手数 74.7回・実測）

   ★ ファイルの かたち（ソリティア T66 → ピラミッド T76 と 同じ）
     ------------------------------------------------------------
     「中身（CORE）」と「画面（UI）」を きっぱり 分けてある。
     CORE は document を 1回も さわらない ので、**Node からも そのまま 動く**。
     ★ 勝率を 数える 側と、実際に 遊ぶ 側の ロボットは **同じ 1本の コード**。
       分けると 必ず ずれる（ルル §7-3 の 名指し）。

   ★★ ロボットが ずるを しない ことの 保証（ルル §7-2 の 4番）★★
     ------------------------------------------------------------
     ロボットの 手を 決める 4つの 関数（firstPick / secondPick / knownPair /
     knownMatch / pickUnknown）には、**配り（G.card）を 1度も 渡していない。**
     渡しているのは
       ① 自分の 覚え（mem.seen ＝ 自分が 見た 場所 → 数字）
       ② gone（その 場所の 札が もう 取られたか。★これは 画面を 見れば 誰でも 分かる）
       ③ 直前に めくれた 札の 数字（★人も 同じ 画面で 見ている）
     の 3つだけ。**MEMORY.verify() が、この 5つの 関数の 中に
     「card」という 字が 1つも 無い ことを 毎回 走査して たしかめる。**

   ⚠️ poker-core.js は 使わない（役の判定が 1つも 要らない ゲーム）。
   ⚠️ 外部の ライブラリ・フォント・画像は 0。外への 通信も 0。
   ============================================================ */
(function (root) {
  'use strict';

  /* ============================================================
     ★ 数字（TUNE）― 調整する 数字は ここ 1か所だけ
     ============================================================ */
  var TUNE = {
    /* ★★ 並べ方（社長裁定1 ＝ 52枚 を 受けて 数え直した）★★
       ------------------------------------------------------------
       52枚が のる 四角を 24通り 全部 数えた（logs/T79_神経衰弱_52枚_見積り.cjs の A）。
         7列×8段 … 375px 49×74px（111%）／320px 33×50px／1000×900 57×86px
         6列×9段 … 375px 45×68px（102%）／320px 30×45px
         8列×7段 … 375px 42×64px（ 95%）／320px 36×55px
       ★ 375px で 44px を 守れるのは 上の 2つだけ。その中で 320px が 一番 大きい 7列×8段。
       ★ 56枠に 52枚 ＝ 4枠 あまる → **最後の段だけ 3枚（まん中の 3列）**。
         穴を 4つ 空けない 理由：このゲームでは **空いた 枠 ＝ もう 取られた 場所**。
         はじめから 穴が 4つ あると「4組 もう 取られている」に 見える（うそに なる）。
       ⚠️ 画面に「あまり」の 説明は 1文字も 出さない（社長指示）。 */
    COLS: 7, ROWS: 8,
    ROW_LEN: [7, 7, 7, 7, 7, 7, 7, 3],
    ROW_OFF: [0, 0, 0, 0, 0, 0, 0, 2],   // 最後の段は まん中（3列目〜5列目）

    /* ★ 横向きスマホ だけの 例外（ルル §1-3 と 同じ 考え方）
       たてが 225px しか 無い 画面では 7列×8段 は 16px に なる（＝ 遊べない）。
       13列×4段 なら 32px 出る。★切りかえの 線は 下の GRID_MIN 1つだけ。 */
    LAND_COLS: 13, LAND_ROWS: 4,
    GRID_MIN: 30,       // 7列×8段 の はばが これ未満 なら 13列×4段（320px は 33px なので 切りかわらない）

    /* ★★ 見せる時間（社長裁定4）★★ 人も ロボットも 同じ。試合の 中で 変わらない。 */
    SHOW_MISS: 1200,    // そろわなかった 2枚
    SHOW_HIT:   600,    // そろった 2枚（★場から 消えるので 覚える 必要が 無い）

    /* ★ ロボットの 間（ルル §3-5。手加減では ない ＝ 人が 画面から 読む ぶん）*/
    BOT_FIRST:  600,    // 手番が 移ってから 1枚めを めくるまで
    BOT_GAP:    900,    // ★1枚めと 2枚めの あいだ（どの段階でも 同じ）

    /* 見た目の 時間（★見せる時間には 含めない・ルル ✅表 4/5）*/
    FLIP:       200,    // 裏 → 表 の 動き
    FLY:        300,    // 取った 2枚が 帯へ 飛ぶ

    TAP_SLOP:    14,    // おした所から これ以上 ずれたら その1回は 数えない

    /* 結果の 箱の 連打よけ（T62・T63 の 事故を くり返さない）*/
    RESULT_LOCK: 600,
    RESULT_QUIET: 250,

    /* ★ 寸法（ルル §1-0 の 内わけ・9本と 同じ 探し方）*/
    CARD_MAX:   100,
    GAP_RATE:  0.04,    // 列の間 ＝ はばの 4%（最小 2px・たてよこ 同じ）
    BAND_RATE: 0.32,    // 取った札の帯 ＝ 札の 高さの 32%（★下げない）
    BAND_GAP:     8,    // 盤と 帯の すきま
    RATIO: 635 / 419,   // 支給画像 419×635 の ひりつ。★ぜったいに くずさない

    /* ★★ もの覚えの 4段階（社長裁定2・3）★★
       ------------------------------------------------------------
       ★「覚えている枚数（新しい順・古いものから 忘れる）」で 表す（ルル §2-1）。
         ★確率で 忘れさせない ―― さっき 見た札を 外す ロボットは 間ぬけに 見える。
       ★ 52枚で 測り直した 勝率（4,000〜6,000試合ずつ）
           はじめての人（4枚 覚える）から 見て
             わすれんぼう(2) … 99.9%
             ★ふつう(4)      … ★43.6%  ← 初期値。36枚のときの 43% と ほぼ 同じ
             もの覚えがいい(6)… 2.9%
             ぜんぶ           … 0.1%
       ★ 名前は 変えない（社長指示）。中身の 枚数も、測った 結果 変える 必要が 無かった。
       ★ 画面に 数字（枚数・%・秒）は 1つも 出さない。 */
    LEVELS: [
      { label: 'わすれんぼう',     cap: 2 },
      { label: 'ふつう',           cap: 4 },   // ★ はじめは これ
      { label: 'もの覚えが いい',  cap: 6 },
      { label: 'ぜんぶ おぼえてる', cap: 52 }
    ],
    LEVEL_START: 1
  };

  /* ============================================================
     カード（設計図 §9・厳守）
     ------------------------------------------------------------
     0〜51 の 数字 1つで 1枚を あらわす。
       すーと = (c/13)|0   … 0 スペード / 1 ハート / 2 ダイヤ / 3 クローバー
       数字   = c % 13     … 0 が A、12 が K
     ★ 神経衰弱は ♠♥♦♣ を 1回も 読まない（同じ 数字か どうかを 見るだけ）。
     ============================================================ */
  var SUITS = ['スペード', 'ハート', 'ダイヤ', 'クローバー'];
  var RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  var N = 52;

  function suitOf(c) { return (c / 13) | 0; }
  function rankOf(c) { return c % 13; }
  function isRed(c)  { var s = suitOf(c); return s === 1 || s === 2; }
  function nameOf(c) { return SUITS[suitOf(c)] + RANKS[rankOf(c)]; }

  /* ★ 種から 動く 乱数（mulberry32）― ソリティア T66 から そのまま */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ★ 配る（ルル §7-1）
     ------------------------------------------------------------
     52枚を まぜて、上の段から 左→右 に 置く。全部 裏向き。
     ★ 配りの 保証は 要らない ―― 詰みが 存在しない（場に 札が あれば 必ず めくれる）。
     ★ card[p] … その 場所の 札。gone[p] … もう 取られたか。 */
  function makeDeal(seed) {
    var rnd = mulberry32(seed >>> 0), deck = [], i, j, t;
    for (i = 0; i < N; i++) deck.push(i);
    for (i = N - 1; i > 0; i--) {
      j = Math.floor(rnd() * (i + 1));
      t = deck[i]; deck[i] = deck[j]; deck[j] = t;
    }
    var gone = [];
    for (i = 0; i < N; i++) gone.push(false);
    return { seed: seed >>> 0, card: deck, gone: gone, score: [0, 0], left: N, turn: 0, rnd: rnd };
  }

  /* ============================================================
     ★★ もの覚え（ルル §2-1）★★
     ------------------------------------------------------------
     ・seen … 場所 → そこで 見た 数字
     ・order … 見た 順（★古いものが 先頭。あふれたら 先頭から 忘れる）
     ★ 確率で 忘れない。だから「直前に めくられた 2枚」は どの段階でも 必ず 覚えている。
     ============================================================ */
  function newMem(cap) { return { cap: cap, order: [], seen: {} }; }

  function memSee(m, pos, rank) {
    if (m.seen[pos] !== undefined) m.order.splice(m.order.indexOf(pos), 1);
    m.seen[pos] = rank;
    m.order.push(pos);
    while (m.order.length > m.cap) delete m.seen[m.order.shift()];
  }
  function memDrop(m, pos) {
    if (m.seen[pos] === undefined) return;
    delete m.seen[pos];
    m.order.splice(m.order.indexOf(pos), 1);
  }

  /* ============================================================
     ★★ ロボットの 頭（★配りを 1度も 受け取らない）★★
     ------------------------------------------------------------
     受け取るのは
       m    … 自分の 覚え
       gone … その 場所が もう 空か（画面を 見れば 誰でも 分かる）
       rank … 直前に めくれた 札の 数字（★人も 同じ 画面で 見ている）
     ★ 「card」という 字は この 下の 5つの 関数に 1つも 出てこない。
       MEMORY.verify() が 毎回 走査する。 */
  function knownPair(m, gone) {          // 覚えている 中に そろう 2枚が あるか
    var by = {}, i, p, r;
    for (i = 0; i < m.order.length; i++) {
      p = m.order[i];
      if (gone[p]) continue;
      r = m.seen[p];
      if (by[r] !== undefined) return [by[r], p];
      by[r] = p;
    }
    return null;
  }
  function knownMatch(m, gone, rank, notPos) {   // その数字を、覚えている 中から 探す
    for (var i = 0; i < m.order.length; i++) {
      var p = m.order[i];
      if (p !== notPos && !gone[p] && m.seen[p] === rank) return p;
    }
    return -1;
  }
  function pickUnknown(m, gone, exclude, rnd) {  // まだ 見ていない 札を 1枚（無ければ 何でも）
    var c = [], p;
    for (p = 0; p < N; p++) if (!gone[p] && p !== exclude && m.seen[p] === undefined) c.push(p);
    if (c.length) return c[Math.floor(rnd() * c.length)];
    var c2 = [];
    for (p = 0; p < N; p++) if (!gone[p] && p !== exclude) c2.push(p);
    return c2.length ? c2[Math.floor(rnd() * c2.length)] : -1;
  }
  /* 1枚め。b >= 0 なら「覚えていた 2枚を 取りに行く」*/
  function firstPick(m, gone, rnd) {
    var kp = knownPair(m, gone);
    if (kp) return { a: kp[0], b: kp[1] };
    return { a: pickUnknown(m, gone, -1, rnd), b: -1 };
  }
  /* 2枚め。★1枚めの 数字を 見てから 決める（人と 同じ 順番）*/
  function secondPick(m, gone, a, rank, rnd) {
    var km = knownMatch(m, gone, rank, a);
    if (km >= 0) return km;
    return pickUnknown(m, gone, a, rnd);
  }

  /* ============================================================
     ★ 中身だけで 1試合 走らせる（＝ 勝率を 数える 道具）
     ------------------------------------------------------------
     ★ 上の firstPick / secondPick を そのまま 使う。
       画面の ロボットと **同じ 1本の コード**（ルル §7-3 の 名指し）。
     ★ 人の側も 同じ 打ち方（覚えている枚数だけ 違う）＝ ルルの 見積り道具と 同じ。
     ============================================================ */
  function simGame(seed, humanCap, botCap, stat) {
    var g = makeDeal(seed), rnd = g.rnd;
    var mem = [newMem(humanCap), newMem(botCap)];
    var hit = 0, miss = 0, guard = 0, takeVia = [0, 0], luck = [0, 0];

    function see(p) {
      var r = rankOf(g.card[p]);
      memSee(mem[0], p, r); memSee(mem[1], p, r);
    }
    function take(a, b, who) {
      g.gone[a] = true; g.gone[b] = true; g.left -= 2; g.score[who] += 2;
      memDrop(mem[0], a); memDrop(mem[0], b); memDrop(mem[1], a); memDrop(mem[1], b);
    }

    while (g.left > 0 && guard++ < 8000) {
      var m = mem[g.turn], again = true;
      while (again && g.left > 0) {
        again = false;
        var f = firstPick(m, g.gone, rnd);
        if (f.a < 0) break;
        if (f.b >= 0) {                                   // 覚えていた 2枚
          see(f.a); see(f.b); hit++; takeVia[g.turn]++;
          take(f.a, f.b, g.turn); again = true; continue;
        }
        var wasUnknown = m.seen[f.a] === undefined;
        var r1 = rankOf(g.card[f.a]); see(f.a);
        var p2 = secondPick(m, g.gone, f.a, r1, rnd);
        if (p2 < 0) break;
        /* ★ p2 が 自分の 覚えの 中に あった ＝「覚えていて 取りに行った」
           （＝ 押し間違いが 一番 痛い 場面。ルル §1-1）*/
        var known2 = m.seen[p2] !== undefined;
        var r2 = rankOf(g.card[p2]); see(p2);
        if (r1 === r2) {
          hit++;
          if (known2) takeVia[g.turn]++;
          else if (wasUnknown) luck[g.turn]++;
          take(f.a, p2, g.turn); again = true;
        } else miss++;
      }
      g.turn = 1 - g.turn;
    }
    if (stat) {
      stat.hit += hit; stat.miss += miss;
      stat.takeVia0 += takeVia[0]; stat.luck0 += luck[0];
      stat.score += g.score[0] + g.score[1];
      if (g.score[0] + g.score[1] !== N) stat.badScore++;
      if (guard >= 8000) stat.capped++;
    }
    return { r: g.score[0] > g.score[1] ? 1 : (g.score[0] < g.score[1] ? -1 : 0), me: g.score[0], bot: g.score[1] };
  }

  function runMany(humanCap, botCap, n, seed0) {
    var w = 0, l = 0, d = 0, i;
    var stat = { hit: 0, miss: 0, takeVia0: 0, luck0: 0, score: 0, badScore: 0, capped: 0 };
    for (i = 0; i < n; i++) {
      var r = simGame((seed0 == null ? (i * 2654435761) : (seed0 + i)) >>> 0, humanCap, botCap, stat);
      if (r.r > 0) w++; else if (r.r < 0) l++; else d++;
    }
    return {
      win: w / n, lose: l / n, draw: d / n,
      hit: stat.hit / n, miss: stat.miss / n, turns: (stat.hit + stat.miss) / n,
      takeVia0: stat.takeVia0 / n, luck0: stat.luck0 / n,
      badScore: stat.badScore, capped: stat.capped
    };
  }

  /* 札が いつも 52枚・同じ数字が 4枚ずつ（たしかめ用）*/
  function countAll(g) {
    var seen = {}, byRank = [], i, c;
    for (i = 0; i < 13; i++) byRank.push(0);
    for (i = 0; i < N; i++) {
      c = g.card[i];
      if (c < 0 || c >= N || seen[c]) return -1;
      seen[c] = 1; byRank[rankOf(c)]++;
    }
    for (i = 0; i < 13; i++) if (byRank[i] !== 4) return -1;
    return N;
  }

  /* ============================================================
     CORE を 外に 出す（Node からも ブラウザからも 同じ 中身）
     ============================================================ */
  var CORE = {
    TUNE: TUNE, SUITS: SUITS, RANKS: RANKS, N: N,
    suitOf: suitOf, rankOf: rankOf, isRed: isRed, nameOf: nameOf,
    mulberry32: mulberry32, makeDeal: makeDeal, countAll: countAll,
    newMem: newMem, memSee: memSee, memDrop: memDrop,
    knownPair: knownPair, knownMatch: knownMatch, pickUnknown: pickUnknown,
    firstPick: firstPick, secondPick: secondPick,
    simGame: simGame, runMany: runMany
  };
  root.MEMORY_CORE = CORE;
  if (typeof module === 'object' && module.exports) module.exports = CORE;

  /* ★ Node（画面が ない ところ）では ここで おしまい。
     ここから下は 1行も 動かない ―― だから 数える 側と 遊ぶ 側は ズレようが ない。 */
  if (typeof document === 'undefined') return;

  /* ============================================================
     ★★ ここから 画面（UI）★★
     ============================================================ */
  var $ = function (id) { return document.getElementById(id); };

  /* ── カードの 絵（設計図 §9・厳守）──────────────────
     ・画像は office/games/cards/ の 支給画像。CSSや 絵文字で 自作しない。
     ・ファイル名が 日本語なので encodeURIComponent を 必ず 通す。
     ・全55枚で 約11MB なので 先読みしない ―― 表に なった 札だけ 読む。 */
  var CARD_DIR = '../cards/';
  function cardSrc(name) { return CARD_DIR + encodeURIComponent(name) + '.png'; }
  var BACK_SRC = cardSrc('トランプ裏赤');

  var STORE_KEY = 'bragekobo.memory.level';

  /* ── 部品 ─────────────────────────────────── */
  var G = null, botMem = null, boardEl = null, boardIn = null, cardEl = [], built = false;
  var busy = false, timers = [], sel1 = -1, streak = 0, over = false;
  var bandIdx = [0, 0];       // 帯に 積んだ 枚数（0＝自分・1＝ロボット）
  var bandOf = [];            // 場所 → {side, i}
  var faceUp = [];            // 場所 → 表向きか
  var geo = { cw: 49, ch: 74, gap: 2, C: 7, R: 8 };

  var state = { level: TUNE.LEVEL_START };
  try {
    var saved = localStorage.getItem(STORE_KEY);
    if (saved !== null && saved !== '') {
      var nv = +saved;
      if (nv === Math.floor(nv) && nv >= 0 && nv < TUNE.LEVELS.length) state.level = nv;
    }
  } catch (e) {}
  function levelCap() { return TUNE.LEVELS[state.level].cap; }

  function later(fn, ms) { var id = setTimeout(fn, ms); timers.push(id); return id; }
  function clearTimers() { for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]); timers = []; }
  function say(t) { $('happyBubble').textContent = t; }

  /* ============================================================
     ★★ 寸法 ★★
     ------------------------------------------------------------
     ★ 出てくる 答え（logs/T79_神経衰弱_52枚_見積り.cjs の A と 合うこと）
       1000×900 → 57×86px ／ 375px → 49×74px ／ 320px → 33×50px
       横向き 812×375 → 13列×4段 で 32×48px
     ★ ここが 違ったら、どこかが 間違っている。
     ============================================================ */
  function fitGrid(W, H, C, R) {
    for (var w = TUNE.CARD_MAX; w >= 8; w--) {
      var g = Math.max(2, Math.round(w * TUNE.GAP_RATE));
      if (C * w + (C - 1) * g > W) continue;
      var h = Math.round(w * TUNE.RATIO);
      var band = Math.round(h * TUNE.BAND_RATE);
      var gridH = R * h + (R - 1) * g;
      if (gridH + TUNE.BAND_GAP + band > H) continue;
      return { cw: w, ch: h, gap: g, band: band, gridW: C * w + (C - 1) * g, gridH: gridH,
               need: gridH + TUNE.BAND_GAP + band };
    }
    return null;
  }

  /* ★ 並べ方は 1つだけ（7列×8段）。
     ★ ただ1つの 例外 ―― 7列×8段が GRID_MIN(30px) を 下回る 画面（＝ 横向きスマホ）。
       そこだけ 13列×4段。★320px は 33px なので 切りかわらない。 */
  function chooseGrid(W, H) {
    var a = fitGrid(W, H, TUNE.COLS, TUNE.ROWS);
    if (a && a.cw >= TUNE.GRID_MIN) {
      a.C = TUNE.COLS; a.R = TUNE.ROWS; a.rowLen = TUNE.ROW_LEN; a.rowOff = TUNE.ROW_OFF;
      return a;
    }
    var b = fitGrid(W, H, TUNE.LAND_COLS, TUNE.LAND_ROWS);
    if (b && (!a || b.cw > a.cw)) {
      b.C = TUNE.LAND_COLS; b.R = TUNE.LAND_ROWS;
      b.rowLen = [13, 13, 13, 13]; b.rowOff = [0, 0, 0, 0];
      return b;
    }
    if (a) { a.C = TUNE.COLS; a.R = TUNE.ROWS; a.rowLen = TUNE.ROW_LEN; a.rowOff = TUNE.ROW_OFF; return a; }
    var h2 = Math.round(8 * TUNE.RATIO);
    return { cw: 8, ch: h2, gap: 2, band: Math.round(h2 * TUNE.BAND_RATE),
             gridW: 8 * 7 + 12, gridH: 8 * h2 + 14, need: 8 * h2 + 14 + 8,
             C: TUNE.COLS, R: TUNE.ROWS, rowLen: TUNE.ROW_LEN, rowOff: TUNE.ROW_OFF };
  }

  /* 場所 → 段・列（★ 場所の 番号は 並べ方が 変わっても 同じ 札を さす）*/
  function cellOf(p) {
    var r = 0, i, n = 0;
    for (i = 0; i < geo.R; i++) {
      if (p < n + geo.rowLen[i]) { r = i; break; }
      n += geo.rowLen[i];
    }
    return { row: r, col: geo.rowOff[r] + (p - n) };
  }
  function slotX(p) { return geo.x0 + cellOf(p).col * (geo.cw + geo.gap); }
  function slotY(p) { return geo.y0 + cellOf(p).row * (geo.ch + geo.gap); }

  function layout() {
    if (!boardIn) return;
    cancelPress();
    var W = boardIn.clientWidth, H = boardIn.clientHeight;
    if (!W || !H) return;
    geo = chooseGrid(W, H);
    geo.W = W; geo.H = H;
    geo.x0 = Math.max(0, Math.round((W - geo.gridW) / 2));
    geo.y0 = Math.max(0, Math.floor((H - geo.need) / 2));   // ★余りは 上下 半分ずつ
    geo.bandY = geo.y0 + geo.gridH + TUNE.BAND_GAP;

    /* ★★ 押し間違いへの 手当て（★ただ1つ・文字は 1つも 足さない）★★
       ------------------------------------------------------------
       押せる 範囲を、**盤の ふちの 余白ぶんだけ 外へ** 広げる。
       ★ となりに 札が ある 側には **1pxも 広げない**。
         理由：このゲームは 押し間違いが 取り消せない。
               札と札の すきま(2px)まで 押せるように すると、そこに 落ちた 指は
               「一番 近い札」を めくって しまう ―― ★ねらった 札の となりの ことも ある。
               今は そこは 死んだ 場所なので **何も 起きない ＝ もう一度 押せる**。
               「何も 起きない」は、このゲームで 一番 安い 失敗。だから 残す。
       ★ 外側（盤の ふち）には となりの 札が いないので、広げても
         別の 札を 取り違える ことが **理屈で ありえない**。だから そこだけ 広げる。
       ★ 広げる 上限は 札の 半分まで（それ以上 離れた 指は、その札を ねらっていない）。 */
    geo.padX = Math.min(Math.floor(geo.cw / 2), geo.x0);
    geo.padT = Math.min(Math.floor(geo.ch / 2), geo.y0);
    geo.padB = Math.min(Math.floor(geo.ch / 2), TUNE.BAND_GAP);

    /* ★ 取った札の 帯（ルル §1-6）。片側 最大 26枚 ＝ 25回 ずらす。 */
    geo.bandScale = TUNE.BAND_RATE;
    geo.bandW = Math.round(geo.cw * TUNE.BAND_RATE);
    geo.bandStep = Math.max(1, Math.floor((W / 2 - geo.bandW) / 25));

    var r = document.documentElement.style;
    r.setProperty('--cw', geo.cw + 'px');
    r.setProperty('--ch', geo.ch + 'px');
    r.setProperty('--radius', Math.max(3, Math.round(geo.cw * 0.075)) + 'px');
    if (G) render(true);
  }

  /* ── 52枚の 札を 1回だけ 作る ───────────────────────
     ★ 取られた 場所に 下じきは 置かない（ルル §4-5）。
       わくが 残ると「まだ 何か ある」と 見える ―― 引き算。
     ★ 札は **場所**で 持つ（cardEl[p] ＝ その 場所の 札）。
       52枠の 場所は 最後まで 動かない ので、これで ぴったり 合う。 */
  function build() {
    if (built) return;
    built = true;
    boardEl = $('board');
    boardIn = document.createElement('div');
    boardIn.className = 'board-in';
    boardEl.appendChild(boardIn);

    for (var p = 0; p < N; p++) {
      var d = document.createElement('div');
      d.className = 'card is-down';
      d.dataset.pos = String(p);
      var inn = document.createElement('div');
      inn.className = 'card-in';
      var f = document.createElement('img'); f.className = 'cf'; f.alt = ''; f.draggable = false;
      var b = document.createElement('img'); b.className = 'cb'; b.alt = ''; b.draggable = false; b.src = BACK_SRC;
      f.onerror = (function (pp, el) { return function () { fallback(pp, el); }; })(p, inn);
      inn.appendChild(f); inn.appendChild(b);
      d.appendChild(inn);
      boardIn.appendChild(d);
      cardEl.push(d);
    }

    /* ★ 操作は Pointer Events だけ（9本で 共通）。
       ⚠️ click は 足さない ―― スマホで 遅れる・取りこぼす。
       ★ ここが「おして えらぶ」の 入口（ピラミッド T77 と 同じ 作法）。 */
    boardIn.addEventListener('pointerdown', onDown);
    boardIn.addEventListener('pointermove', onMove);
    boardIn.addEventListener('pointerup', onUp);
    boardIn.addEventListener('pointercancel', onCancel);
    boardIn.addEventListener('lostpointercapture', onCancel);
    boardIn.addEventListener('animationend', clearShake);
    boardIn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    boardIn.addEventListener('dragstart', function (e) { e.preventDefault(); });
  }

  /* 画像が 届かなかった ときだけ（ふだんは 一度も 通らない）*/
  function fallback(p, inn) {
    if (!G || inn.querySelector('.fallback')) return;
    var c = G.card[p];
    var d = document.createElement('div');
    d.className = 'fallback ' + (isRed(c) ? 'red' : 'black');
    d.textContent = (isRed(c) ? (suitOf(c) === 1 ? '♥' : '♦') : (suitOf(c) === 0 ? '♠' : '♣')) + RANKS[rankOf(c)];
    inn.appendChild(d);
  }

  /* ── 並べる ───────────────────────────────── */
  var lastTf = [];
  function place(p, x, y, z, up, scale) {
    var el = cardEl[p];
    var tf = 'translate(' + x + 'px,' + y + 'px)' + (scale === 1 ? '' : ' scale(' + scale + ')');
    if (lastTf[p] !== tf) { lastTf[p] = tf; el.style.transform = tf; }
    el.style.zIndex = String(z);
    if (up) {
      var f = el.firstChild.firstChild;
      if (!f.getAttribute('src')) f.src = cardSrc(nameOf(G.card[p]));   // ★今つかう札だけ 読む
      el.classList.remove('is-down');
    } else {
      el.classList.add('is-down');
    }
  }

  function render(instant) {
    if (!G) return;
    if (instant) { boardEl.classList.add('no-anim'); }
    for (var p = 0; p < N; p++) {
      if (G.gone[p]) {
        var b = bandOf[p];
        if (!b) { cardEl[p].style.display = 'none'; continue; }
        cardEl[p].style.display = '';
        var x = (b.side === 0) ? (b.i * geo.bandStep)
                               : (geo.W - geo.bandW - b.i * geo.bandStep);
        /* ★ 自分の 山は 表向き、ロボットの 山は 裏向き（ルル §1-6）。
           名札も 点数の 数字も 要らない ―― 帯の 長さが そのまま 点数。 */
        place(p, x, geo.bandY, 200 + b.i, b.side === 0, geo.bandScale);
      } else {
        cardEl[p].style.display = '';
        place(p, slotX(p), slotY(p), 10, !!faceUp[p], 1);
      }
    }
    if (instant) { void boardEl.offsetWidth; boardEl.classList.remove('no-anim'); }
  }

  /* ★「それは だめ」の ゆれ ―― 画面に ある たった 1種類の 返し（ルル §4-4）。
     ★ 光でも 色でも ない ので、★強調は ゼロの まま（社長裁定5）。 */
  function shakeNo(p) {
    var el = cardEl[p];
    if (!el) return;
    el.style.setProperty('--sx', slotX(p) + 'px');
    el.style.setProperty('--sy', slotY(p) + 'px');
    el.classList.remove('is-no');
    void el.offsetWidth;
    el.classList.add('is-no');
  }
  function clearShake(e) { if (e.animationName === 'shakeNo') e.target.classList.remove('is-no'); }

  /* ============================================================
     ★★ 操作（ピラミッドの「おして えらぶ」を そのまま）★★
     ------------------------------------------------------------
       1枚めを おす → ★その札が めくれる（＝ これが「えらんだ」の 合図。青わくは 無い）
       2枚めを おす → 同じ 数字なら もらえる（帯へ 飛ぶ）→ もう1回 めくれる
                      ちがえば 1.2秒 見せて、2枚とも 裏へ 戻る
       ★「もう一度 おして 取り消す」は 無い ―― もう 見えて しまっている（ルル §4-3）。
     ============================================================ */

  /* ★ どの 場所を おしたか（★座標から 決める）
     ★ 上の layout() の 手当て どおり、ふちの 余白ぶんだけ 押せる 範囲を 外へ 広げる。
       となりに 札が ある 側は 1pxも 広げない。 */
  function hitAt(x, y) {
    var best = -1, bestD = Infinity, p;
    for (p = 0; p < N; p++) {
      if (G.gone[p]) continue;
      var c = cellOf(p);
      var X = slotX(p), Y = slotY(p);
      var l = (c.col === 0) ? geo.padX : 0;
      var r = (c.col === geo.C - 1) ? geo.padX : 0;
      var t = (c.row === 0) ? geo.padT : 0;
      var b = (c.row === geo.R - 1) ? geo.padB : 0;
      if (x < X - l || x > X + geo.cw + r) continue;
      if (y < Y - t || y > Y + geo.ch + b) continue;
      var dx = x - (X + geo.cw / 2), dy = y - (Y + geo.ch / 2), d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = p; }
    }
    return best;
  }

  var press = null;
  function onDown(e) {
    /* ★ 見せている あいだ・ロボットの 手番は 盤ぜんぶが 効かない。
       ★ そして その あいだの おしは **ためない**（ルル §3-6・T62 の 事故）。
         ここで press を 作らない ＝ あとから まとめて 効く ことが 無い。 */
    if (!G || over || busy || G.turn !== 0) return;
    if (press) return;
    if (e.isPrimary === false) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    var r = boardIn.getBoundingClientRect();
    var x = e.clientX - r.left, y = e.clientY - r.top;
    var p = hitAt(x, y);
    if (p < 0) return;
    e.preventDefault();
    press = { id: e.pointerId, pos: p, out: false, sx: x, sy: y, rl: r.left, rt: r.top };
    try { boardIn.setPointerCapture(e.pointerId); } catch (err) {}
  }
  function onMove(e) {
    var d = press;
    if (!d || e.pointerId !== d.id) return;
    var dx = e.clientX - d.rl - d.sx, dy = e.clientY - d.rt - d.sy;
    if (dx * dx + dy * dy > TUNE.TAP_SLOP * TUNE.TAP_SLOP) d.out = true;
  }
  function onUp(e) {
    var d = press;
    if (!d || e.pointerId !== d.id) return;
    press = null;
    try { boardIn.releasePointerCapture(e.pointerId); } catch (err) {}
    if (d.out) return;
    if (!G || over || busy || G.turn !== 0) return;
    tapPos(d.pos);
  }
  function onCancel(e) {
    var d = press;
    if (!d || e.pointerId !== d.id) return;
    press = null;
    try { boardIn.releasePointerCapture(e.pointerId); } catch (err) {}
  }
  function cancelPress() { press = null; }

  /* ── 札を 1回 おした（★順番が そのまま ルール）───────── */
  function tapPos(p) {
    if (G.gone[p]) return;                 // ★取られた 場所には 何も 無い
    if (p === sel1) { shakeNo(p); return; } // ★すでに めくれている 1枚め → ぷるっと ゆれる
    reveal(p);
    if (sel1 < 0) { sel1 = p; return; }     // 1枚め ―― めくれる こと自体が「えらんだ」
    var a = sel1; sel1 = -1;
    judge(a, p, 0);                         // 2枚め ―― 判定
  }

  /* ★ めくる（★人が めくっても、ロボットも 同じ 画面を 見ている）*/
  function reveal(p) {
    faceUp[p] = true;
    place(p, slotX(p), slotY(p), 20, true, 1);
    memSee(botMem, p, rankOf(G.card[p]));   // ★ロボットが 知るのは「見た札」だけ
  }
  function hide(p) {
    faceUp[p] = false;
    place(p, slotX(p), slotY(p), 10, false, 1);
  }

  /* ── 2枚の 判定（★見せる時間は 人も ロボットも 同じ）───── */
  function judge(a, b, who) {
    busy = true;
    var same = rankOf(G.card[a]) === rankOf(G.card[b]);
    var wait = TUNE.FLIP + (same ? TUNE.SHOW_HIT : TUNE.SHOW_MISS);
    later(function () {
      if (!G || over) return;
      if (same) {
        takePair(a, b, who);
        if (G.left === 0) { finish(); return; }
        if (who === 1) { later(botStep, TUNE.FLY); }
        else {
          streak++;
          /* ★ 当たりは 1試合に 26回 起きる。26回 出る 文は 背景に なる ので、
             ★2つ 続けて 取った ときだけ しゃべる（ルル §6-2）。 */
          if (streak >= 2) say('そろった！　もう1回 めくれるよ！');
          busy = false;
        }
      } else {
        hide(a); hide(b);
        if (who === 0) streak = 0;
        G.turn = 1 - G.turn;
        if (G.turn === 1) later(botTurn, TUNE.FLIP);
        else busy = false;
      }
    }, wait);
  }

  function takePair(a, b, who) {
    G.gone[a] = true; G.gone[b] = true; G.left -= 2; G.score[who] += 2;
    memDrop(botMem, a); memDrop(botMem, b);
    faceUp[a] = false; faceUp[b] = false;
    bandOf[a] = { side: who, i: bandIdx[who]++ };
    bandOf[b] = { side: who, i: bandIdx[who]++ };
    render();
  }

  /* ── ロボットの 手番 ─────────────────────────
     ★ 中身は CORE の firstPick / secondPick そのもの。
       ★配り（G.card）は 1度も 渡していない。 */
  function botTurn() {
    if (!G || over) return;
    busy = true;
    later(botStep, TUNE.BOT_FIRST);
  }
  function botStep() {
    if (!G || over) return;
    if (G.left === 0) { finish(); return; }
    busy = true;
    var f = firstPick(botMem, G.gone, G.rnd);
    if (f.a < 0) { G.turn = 0; busy = false; return; }
    reveal(f.a);
    later(function () {
      if (!G || over) return;
      var p2 = (f.b >= 0) ? f.b
             : secondPick(botMem, G.gone, f.a, rankOf(G.card[f.a]), G.rnd);
      if (p2 < 0) { G.turn = 0; busy = false; return; }
      reveal(p2);
      judge(f.a, p2, 1);
    }, TUNE.FLIP + TUNE.BOT_GAP);
  }

  /* ── 決着 ─────────────────────────────────
     ★ 勝ち／負け／★引き分け の 3つ。引き分けは 52枚でも 7〜15% 出る（実測）。 */
  function finish() {
    over = true; busy = true;
    var me = G.score[0], bot = G.score[1];
    var kind = me > bot ? 'win' : (me < bot ? 'lose' : 'draw');
    var title = kind === 'win' ? '勝ち！' : (kind === 'lose' ? '負け…' : '引き分け');
    var line = kind === 'win' ? 'やったー！　おぼえるの じょうずだね！'
             : (kind === 'lose' ? 'おしい！　もう1回 やろ？' : '引き分け！　いい しょうぶ だったね');
    $('resultTitle').textContent = title;
    $('resultTitle').className = 'result-title' + (kind === 'win' ? '' : ' is-quiet');
    $('resultSay').textContent = line;
    say(line);
    if (kind === 'win') $('happyCat').classList.add('is-jump');
    later(function () { lockResult(); $('resultWrap').classList.remove('hidden'); }, 500);
  }

  /* ============================================================
     ★ 結果の 箱 ＋ 連打よけ（T62・T63 の 事故を くり返さない）
     ============================================================ */
  var locked = false, lockTimer = 0, lockAt = 0;
  function armUnlock(ms) { clearTimeout(lockTimer); lockTimer = setTimeout(unlockResult, ms); }
  function lockResult() {
    locked = true; lockAt = performance.now();
    $('resultBox').classList.add('is-locked');
    $('btnAgain').disabled = true;
    $('levelResult').disabled = true;
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
    $('btnAgain').disabled = false;
    $('levelResult').disabled = false;
    $('btnQuit').removeAttribute('aria-disabled'); $('btnQuit').removeAttribute('tabindex');
  }
  function hideResult() { $('resultWrap').classList.add('hidden'); unlockResult(); }

  /* ============================================================
     ★ もの覚えの プルダウン（社長裁定2）
     ------------------------------------------------------------
     ★ 置き場は **2か所だけ**（最初の画面 と 終わりの画面）。スピード T64 の 作法と 同じ。
     ★ 遊んでいる 最中の 画面には 置かない（設計図 §5.5 の 線引き）。
     ★ えらんだ ものは そのまま 続く ―― 勝ち負けで かってに 変わらない。
     ============================================================ */
  var levelSelects = [];
  function buildLevelSelects() {
    var opts = '', i;
    for (i = 0; i < TUNE.LEVELS.length; i++) {
      opts += '<option value="' + i + '">' + TUNE.LEVELS[i].label + '</option>';
    }
    levelSelects = [$('levelTitle'), $('levelResult')];
    for (var k = 0; k < levelSelects.length; k++) {
      var s = levelSelects[k];
      if (!s) continue;
      s.innerHTML = opts;
      s.value = String(state.level);
      s.addEventListener('change', function (e) { setLevel(+e.target.value); });
    }
  }
  function syncLevelSelects() {
    for (var k = 0; k < levelSelects.length; k++) {
      var s = levelSelects[k];
      if (s && s.value !== String(state.level)) s.value = String(state.level);
    }
  }
  function setLevel(i) {
    if (!(i >= 0 && i < TUNE.LEVELS.length)) return state.level;
    state.level = i;
    try { localStorage.setItem(STORE_KEY, String(i)); } catch (e) {}
    syncLevelSelects();
    return state.level;
  }

  /* ── 試合の 出し入れ ──────────────────────────── */
  function cancelAll() {
    cancelPress(); clearTimers();
    $('happyCat').classList.remove('is-jump');
    hideResult();
    busy = false; over = false; sel1 = -1; streak = 0;
  }

  function newGame(again, seed) {
    cancelAll();
    G = makeDeal(seed == null ? ((Math.random() * 2147483000) >>> 0) : (seed >>> 0));
    botMem = newMem(levelCap());
    bandIdx = [0, 0]; bandOf = []; faceUp = []; lastTf = [];
    for (var p = 0; p < N; p++) {
      var f = cardEl[p].firstChild.firstChild;
      f.removeAttribute('src');                      // ★配り直したら 絵を 読み直す
      var fb = cardEl[p].querySelector('.fallback');
      if (fb) fb.parentNode.removeChild(fb);
      cardEl[p].classList.remove('is-no');
      cardEl[p].style.display = '';
    }
    $('titleScreen').classList.add('hidden');
    $('playScreen').classList.remove('hidden');
    layout(); render(true);
    say(again ? 'つぎは 何枚 おぼえられるかな？' : '同じ 数字を 2枚。ロボットより たくさん 取ろう！');
  }

  /* ── つなぐ ─────────────────────────────────── */
  function boot() {
    build();
    buildLevelSelects();
    $('btnStart').addEventListener('click', function () { newGame(false); });
    $('btnAgain').addEventListener('click', function () { if (!locked) newGame(true); });
    $('btnHowto').addEventListener('click', function () { $('helpDialog').showModal(); });
    var closers = document.querySelectorAll('[data-close]');
    for (var i = 0; i < closers.length; i++) {
      closers[i].addEventListener('click', function () { $(this.dataset.close).close(); });
    }
    $('resultWrap').addEventListener('pointerdown', bumpLock, true);
    /* ★ 指を はなした ことを 取りこぼさない ための 保険（★大事）
       ------------------------------------------------------------
       盤の 外で 指を はなす・端末が 指の 追跡を 落とす、といった ときに
       pointerup が 盤に 届かない ことが ある。すると press が 残り、
       ★そこから 先の おしが 全部 効かなくなる（盤が 死ぬ）。
       ★ 神経衰弱は 1試合に 150回 前後 おす ゲーム。ここを 落とすと 試合が 終わる。
       window でも 受けて おけば、必ず どちらかで 拾える。
       （onUp は はじめに press を 空に する ので、2回 呼ばれても 二重に 効かない）*/
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    window.addEventListener('resize', layout);
    window.addEventListener('orientationchange', function () { setTimeout(layout, 120); });
    layout();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* ============================================================
     ★ たしかめ用の 窓口（window.MEMORY）― 既存9本と 同じ 作法
     ------------------------------------------------------------
     画面には 1つも 出さない（お客さんに 見せる 物では ない）。
     ============================================================ */
  function median(a) { if (!a.length) return 0; var b = a.slice().sort(function (x, y) { return x - y; }); return b[b.length >> 1]; }

  /* ★ autoPlay(n, {humanMemory: 8, botMemory: 52})
     ★ 人の もの覚えを 指定できる ―― 勝率の 測定に 要る（社長指示）。 */
  function autoPlay(n, opt) {
    n = n || 100; opt = opt || {};
    var hc = opt.humanMemory == null ? 4 : opt.humanMemory;
    var bc = opt.botMemory == null ? levelCap() : opt.botMemory;
    var t0 = Date.now(), errs = [], w = 0, l = 0, d = 0, mv = [], bad52 = 0, badScore = 0;
    for (var i = 0; i < n; i++) {
      var seed = ((opt.seed == null ? 1 : opt.seed) + i * 2654435761) >>> 0;
      var g = makeDeal(seed);
      if (countAll(g) !== 52) { bad52++; errs.push('seed ' + seed + '：札が52枚でない'); }
      var stat = { hit: 0, miss: 0, takeVia0: 0, luck0: 0, score: 0, badScore: 0, capped: 0 };
      var r;
      try { r = simGame(seed, hc, bc, stat); }
      catch (e) { errs.push('seed ' + seed + '：' + e.message); continue; }
      if (stat.badScore) { badScore++; errs.push('seed ' + seed + '：取った札の合計が52枚でない'); }
      if (stat.capped) errs.push('seed ' + seed + '：手数が 上限に 当たった');
      if (r.r > 0) w++; else if (r.r < 0) l++; else d++;
      mv.push(stat.hit + stat.miss);
    }
    var out = {
      '試合数': n,
      '人の もの覚え': (hc >= 52 ? 'ぜんぶ' : hc + '枚'),
      'ロボットの もの覚え': (bc >= 52 ? 'ぜんぶ' : bc + '枚'),
      '★エラー': errs.length,
      '★札が52枚でなかった試合': bad52,
      '★取った札の合計が52枚でなかった試合': badScore,
      '人の勝ち': w + ' (' + (w / n * 100).toFixed(1) + '%)',
      '引き分け': d + ' (' + (d / n * 100).toFixed(1) + '%)',
      '負け': l + ' (' + (l / n * 100).toFixed(1) + '%)',
      '2枚めくりの回数（中央値／最大）': median(mv) + '回 ／ ' + Math.max.apply(null, mv) + '回',
      'かかった時間': ((Date.now() - t0) / 1000).toFixed(1) + '秒'
    };
    if (errs.length) out['エラーの中身'] = errs.slice(0, 5);
    console.log('[MEMORY] autoPlay', out);
    return out;
  }

  /* ★ 4段階 × 人の もの覚え の 表（勝率の 測定・トライへ）*/
  function rates(n) {
    n = n || 2000;
    var out = {}, i, h;
    var HUM = [2, 4, 6, 8, 10, 12, 16];
    for (i = 0; i < HUM.length; i++) {
      h = HUM[i];
      var row = [];
      for (var k = 0; k < TUNE.LEVELS.length; k++) {
        var r = runMany(h, TUNE.LEVELS[k].cap, n, 12345 + i * 977 + k * 31);
        row.push(TUNE.LEVELS[k].label + ' ' + (r.win * 100).toFixed(1) + '%（分け ' + (r.draw * 100).toFixed(1) + '%・手数 ' + r.turns.toFixed(1) + '）');
      }
      out['人 ' + h + '枚'] = row;
    }
    console.log('[MEMORY] rates', out);
    return out;
  }

  /* ★★ たしかめ ★★
     ① 札は いつも 52枚・同じ数字が 4枚ずつ
     ② 取った札の 合計は いつも 52枚（26組 ちょうど）
     ③ ★ロボットの 頭に「配り」が 1度も 渡っていない（関数の 中身を 走査）
     ④ 並べ方が 52枚 ぴったり（枠の 数と 場所が だぶらない） */
  function verify(n) {
    n = n || 200;
    var i, ng = [], t0 = Date.now();
    var stat = { hit: 0, miss: 0, takeVia0: 0, luck0: 0, score: 0, badScore: 0, capped: 0 };
    for (i = 0; i < n; i++) {
      var seed = (777 + i * 2654435761) >>> 0;
      var g = makeDeal(seed);
      if (countAll(g) !== 52) ng.push('seed ' + seed + '：札が52枚でない');
      simGame(seed, 8, 8, stat);
    }
    if (stat.badScore) ng.push('取った札の合計が52枚でない試合が ' + stat.badScore + '件');
    if (stat.capped) ng.push('手数が 上限に 当たった試合が ' + stat.capped + '件');

    /* ★③ ロボットの 頭に 配りが 渡っていない ことの 走査。
       ★ 配りは G.card ／ makeDeal の card。下の 5つに「card」の 字が 1つでも
         あれば、その ロボットは 場の 中身を のぞける ことに なる。 */
    var brain = [firstPick, secondPick, knownPair, knownMatch, pickUnknown];
    var brainNames = ['firstPick', 'secondPick', 'knownPair', 'knownMatch', 'pickUnknown'];
    var peek = [];
    for (i = 0; i < brain.length; i++) {
      if (/card|rankOf|nameOf|deal/.test(String(brain[i]))) peek.push(brainNames[i]);
    }
    if (peek.length) ng.push('★ロボットが 場の中身を 見ている おそれ：' + peek.join('・'));

    /* ★④ 並べ方（枠が 52・場所が だぶらない）*/
    var slots = {}, dup = 0, total = 0;
    for (i = 0; i < geo.R; i++) total += geo.rowLen[i];
    for (i = 0; i < N; i++) {
      var c = cellOf(i), key = c.row + ',' + c.col;
      if (slots[key]) dup++;
      slots[key] = 1;
      if (c.col < 0 || c.col >= geo.C || c.row < 0 || c.row >= geo.R) ng.push('場所 ' + i + ' が 枠の 外');
    }
    if (total !== 52) ng.push('枠の 数が 52でない（' + total + '）');
    if (dup) ng.push('同じ 場所に 2枚（' + dup + '件）');

    var out = {
      '調べた試合': n,
      '★だめだったもの': ng.length,
      '札は いつも52枚・同じ数字4枚ずつ': ng.length === 0 ? 'OK' : '―',
      '取った札の合計': (stat.score / n).toFixed(1) + '枚／試合（52なら OK）',
      '★ロボットに 配りを 渡していない': peek.length === 0 ? 'OK（5つの関数すべて）' : 'だめ',
      '並べ方': geo.C + '列×' + geo.R + '段（' + geo.rowLen.join('/') + '）・枠 ' + total + '・重なり ' + dup,
      '札の大きさ': geo.cw + '×' + geo.ch + 'px',
      'かかった時間': ((Date.now() - t0) / 1000).toFixed(1) + '秒'
    };
    if (ng.length) out['中身'] = ng.slice(0, 10);
    console.log('[MEMORY] verify', out);
    return out;
  }

  function screenInfo() {
    var inb = boardIn.getBoundingClientRect(), lowest = 0, rightmost = 0, i, b;
    for (i = 0; i < N; i++) {
      if (cardEl[i].style.display === 'none') continue;
      b = cardEl[i].getBoundingClientRect();
      if (b.bottom > lowest) lowest = b.bottom;
      if (b.right > rightmost) rightmost = b.right;
    }
    var numPx = geo.ch * (64.5 / 635);
    return {
      画面: window.innerWidth + '×' + window.innerHeight,
      器の中身: Math.round(inb.width) + '×' + Math.round(inb.height),
      並べ方: geo.C + '列×' + geo.R + '段（最後の段 ' + geo.rowLen[geo.R - 1] + '枚）',
      札: geo.cw + '×' + geo.ch + 'px',
      '44pxに対して': (geo.cw / 44 * 100).toFixed(0) + '%',
      列の間: geo.gap + 'px',
      盤: geo.gridW + '×' + geo.gridH + 'px',
      帯の高さ: geo.band + 'px（1枚 ' + geo.bandW + 'px・ずらし ' + geo.bandStep + 'px）',
      隅の数字: numPx.toFixed(1) + 'px',
      押し間違いの余裕: '±' + ((geo.cw + geo.gap) / 2).toFixed(1) + 'px',
      '押せる範囲を広げた分（ふちだけ）': '左右 ' + geo.padX + 'px ／ 上 ' + geo.padT + 'px ／ 下 ' + geo.padB + 'px',
      たての余り: (geo.H - geo.need) + 'px',
      はみ出し下: Math.round(lowest - inb.bottom) + 'px（0以下ならOK）',
      はみ出し右: Math.round(rightmost - inb.right) + 'px（0以下ならOK）',
      ページ縦スクロール: document.documentElement.scrollHeight > window.innerHeight,
      ページ横スクロール: document.documentElement.scrollWidth > window.innerWidth
    };
  }

  window.MEMORY = {
    now: function () {
      if (!G) return { 場面: 'まだ 始めていない', もの覚え: TUNE.LEVELS[state.level].label };
      var rows = [], p = 0, r, i, line;
      for (r = 0; r < geo.R; r++) {
        line = [];
        for (i = 0; i < geo.rowLen[r]; i++, p++) {
          line.push(G.gone[p] ? '・' : (faceUp[p] ? RANKS[rankOf(G.card[p])] : '□'));
        }
        rows.push((r + 1) + '段：' + line.join(' '));
      }
      return {
        配りの番号: G.seed,
        盤: rows,
        '（□は 裏・・は 取られた）': G.left + '枚 のこり',
        自分: G.score[0] + '枚', ロボット: G.score[1] + '枚',
        手番: G.turn === 0 ? '自分' : 'ロボット',
        めくっている1枚め: sel1 < 0 ? 'なし' : (sel1 + '（' + RANKS[rankOf(G.card[sel1])] + '）'),
        'ロボットの もの覚え': TUNE.LEVELS[state.level].label + '（' + (levelCap() >= 52 ? 'ぜんぶ' : levelCap() + '枚') + '）',
        'ロボットが いま 覚えている': botMem ? botMem.order.length + '枚' : '―',
        札の合計: countAll(G) + '枚',
        勝敗: over ? (G.score[0] > G.score[1] ? '勝ち' : (G.score[0] < G.score[1] ? '負け' : '引き分け')) : '進行中',
        札の大きさ: geo.cw + '×' + geo.ch + 'px'
      };
    },
    autoPlay: autoPlay,
    rates: rates,
    verify: verify,
    screen: screenInfo,
    geo: function () { return geo; },
    seed: function (n) {
      if (n == null) return G ? G.seed : null;
      newGame(false, n >>> 0);
      return G.seed;
    },
    level: function (i) {
      if (i == null) return { 番号: state.level, 名前: TUNE.LEVELS[state.level].label, 覚える枚数: levelCap() };
      setLevel(i);
      return { 番号: state.level, 名前: TUNE.LEVELS[state.level].label, 覚える枚数: levelCap() };
    },
    /* ★ 決着の 直前を 出す ―― たしかめ 専用（引き分けの 画面を 見る ため）*/
    nearEnd: function (leftPairs) {
      leftPairs = leftPairs == null ? 1 : Math.max(1, Math.min(26, leftPairs));
      if (!G) newGame(false);
      cancelAll();
      var guard = 0;
      while (G.left > leftPairs * 2 && guard++ < 200) {
        var a = -1, b = -1, i, j;
        for (i = 0; i < N && a < 0; i++) if (!G.gone[i]) a = i;
        for (j = a + 1; j < N && b < 0; j++) if (!G.gone[j] && rankOf(G.card[j]) === rankOf(G.card[a])) b = j;
        if (b < 0) { for (j = a + 1; j < N && b < 0; j++) if (!G.gone[j]) b = j; }
        if (b < 0) break;
        var who = (G.score[0] <= G.score[1]) ? 0 : 1;
        takePair(a, b, who);
      }
      G.turn = 0; busy = false; over = false;
      render(true);
      say('たしかめ用：あと ' + (G.left / 2) + '組');
      return { 場に残り: G.left + '枚', 自分: G.score[0] + '枚', ロボット: G.score[1] + '枚' };
    },
    core: CORE
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
