/* ============================================================
   ピラミッド（9本目）― T76・コーダ
   ------------------------------------------------------------
   仕様は logs/T75_ピラミッド_仕様_ルル.md ＋ 社長裁定（2026-08-20）が 正。

   社長裁定（4つ・厳守）：
     1. ★「この配り、ちゃんと クリアできるよ！」を 言えるように する
        → 必ず クリアできる 配りだけを 配る（下の DEALS）
     2. ★山札は 3周（TUNE.PASSES = 3）
     3. ★難しさは 選ばせない（設定は 1つも 作らない）
     4. ★詰みの 箱は「もどす」を 主役に する（ソリティア・スパイダーとは 逆）

   ★ このゲームは「ソリティアの 弟」。作りは スパイダーでは なく
     ソリティア（office/games/solitaire/）に そろえてある。

   ★ ファイルの かたち（ソリティア T66 と 同じ）
     ------------------------------------------------------------
     「中身（CORE）」と「画面（UI）」を きっぱり 分けてある。
     CORE は document を 1回も さわらない ので、**Node からも そのまま 動く**。
     クリアできる 配りの 一覧（DEALS）は、この CORE を Node で まわして 作った。
     ★ つまり「解く道具の側」と「ゲームの側」は **同じ 1本の コード**。
       仕様 §4-4 の いちばんの 落とし穴（両者が ズレると 一覧が 全部ゴミ）を、
       ズレようが ない 作りに して つぶしてある。

   ★★ 操作は「おして えらぶ」（T77・社長指示・2026-08-21）★★
     ------------------------------------------------------------
     1枚めを おす → **青わく**で かこむ。2枚めを おす → 合わせて 13なら 2枚とも 消える。
     13で なければ **何も 起きない**（青わくは 残る）。青わくの 札を もう一度 おすと 外れる。
     ★ ドラッグは 1行も 残さず 消した ―― ソリティア・スパイダーは「札を 運ぶ」
       ゲームだった ので 運ぶ先が あった。ピラミッドには 運ぶ先が 無い。
     ★ K は おした その場で 取れる（1枚で 取れる 札なので、えらぶ 意味が 無い）。
     ★ 2枚とも 人が えらぶ。プログラムが するのは「13か」の 判定だけ ――
       探すのは 人、たしかめるのが 機械（設計図 追記②）。

   ★ 札を 動かす 入口は applyMove() ただ1つ（仕様 §7-3）
     2枚を 取る・K を 1枚で 取る・めくる・山札を まわす ―― 全部 ここを 通る。
     だから「もどす」は 1つの 逆手順だけで 効く。入口を 増やさない こと。

   ★★ 絶対に 壊しては いけない 一点（仕様 §2-5・アイの 申し送り）★★
     **「下が 2枚とも 空いた 札しか 取れない」＝ 取れる札は いつも 全部 見えている。**
     だから 同じ段の 札は **重ねない**（S ＝ はば ＋ すきま）。
     段の 落差 V ＝ 高さ ÷ 2（切りすて）。
     ここを 動かすと、文字なしで ルールを 教える 唯一の 手段が 消える。
     ★「重ねれば もっと 大きく できそう」と 思っても、採らない こと。

   ⚠️ poker-core.js は 使わない（役の判定が 1つも 要らない ゲーム）。
   ⚠️ 外部の ライブラリ・フォント・画像は 0。外への 通信も 0。
   ============================================================ */
(function (root) {
  'use strict';

  /* ============================================================
     ★ 数字（TUNE）― 調整する 数字は ここ 1か所だけ
     ============================================================ */
  var TUNE = {
    /* ★★ 山札の 周回（社長裁定2）★★
       3周 ＝ なくなったら 2回 もどせる。
       ★ ここを 変えたら DEALS（クリアできる 配りの 一覧）を 作り直す こと。
         3周用の 一覧なので、ほかの 数では 保証が うそに なる。 */
    PASSES: 3,

    /* 見た目の 時間 */
    MOVE:        180,   // 札が すべって 動く 時間
    VANISH:      260,   // ★取った 2枚が 小さくなって 消える 時間

    /* ★★ おして えらぶ（T77・社長指示）★★
       ------------------------------------------------------------
       ピラミッドは「2枚を えらんで 組む」ゲームで、運ぶ先が 無い。
       動かない ものを 運ばせて いたのが そもそも 無理だった ので、
       **運ぶ を やめて、おして えらぶ**に 作り直した（T77）。
       ★ TAP_SLOP … おした所から この px 以上 指が ずれたら、その1回は 数えない
         （札は 一番 小さい 端末でも 42px。14px なら 同じ札の 中に 収まる）。 */
    TAP_SLOP:     14,

    /* 札が 降る 演出（仕様 §6-2・ソリティアと 同じ・52枚）*/
    FALL_WAIT:   300,
    FALL_STEP:    40,
    FALL_MAX:   6000,

    /* 結果の 箱の 連打よけ（T62の 事故を くり返さない）*/
    RESULT_LOCK: 600,
    RESULT_QUIET: 250,

    /* ★★ 寸法（仕様 §1-1／§1-3。ここが この ゲームの 心臓）★★
       CARD_MAX … ★85 → 100 に 上げた（仕様 §1-3）。ピラミッドは
                  9本で 初めて 上限に 当たる（1000×900 で 96px まで 入る）。
       GAP_RATE … 列の 間 ＝ はばの 4%（最小 2px）
       ★ 段の 落差 V ＝ 高さ ÷ 2（切りすて）は 下の fit() の 中。動かさない。 */
    CARD_MAX:    100,
    GAP_RATE:   0.04,
    RATIO: 635 / 419    // 支給画像 419×635 の ひりつ。★ぜったいに くずさない
  };

  /* ============================================================
     カード（設計図 §9・厳守）
     ------------------------------------------------------------
     0〜51 の 数字 1つで 1枚を あらわす。
       すーと = (c/13)|0   … 0 スペード / 1 ハート / 2 ダイヤ / 3 クローバー
       数字   = c % 13     … 0 が A、12 が K
     ★ ピラミッドは ♠♥♦♣ を 1回も 読まない（仕様 §1-4）。
       使うのは 下の val()（A=1 … K=13）だけ。
     ============================================================ */
  var SUITS = ['スペード', 'ハート', 'ダイヤ', 'クローバー'];
  var RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  function suitOf(c) { return (c / 13) | 0; }
  function rankOf(c) { return c % 13; }
  function isRed(c)  { var s = suitOf(c); return s === 1 || s === 2; }
  function nameOf(c) { return SUITS[suitOf(c)] + RANKS[rankOf(c)]; }
  /* ★ この ゲームで 唯一 使う 札の 値（A=1・J=11・Q=12・K=13）*/
  function val(c) { return (c % 13) + 1; }

  /* ============================================================
     ★ ピラミッドの かたち（7段・28枚）
     ------------------------------------------------------------
       段 r（0〜6）の i 番目 → k = r*(r+1)/2 + i
       子（下の 2枚） → k + r + 1 と k + r + 2
     ★「下の 2枚が どちらも 消えた 札だけ 取れる」＝ このゲームの 心臓。
     ============================================================ */
  var ROW = [], POS = [], CHILD = [];
  (function () {
    for (var r = 0; r < 7; r++) {
      for (var i = 0; i <= r; i++) {
        var k = r * (r + 1) / 2 + i;
        ROW[k] = r; POS[k] = i;
        CHILD[k] = (r === 6) ? null : [k + r + 1, k + r + 2];
      }
    }
  })();

  /* ============================================================
     ★ 種から 動く 乱数（mulberry32）― ソリティア T66 から そのまま
     ------------------------------------------------------------
     ここが 1ミリでも ズレると、クリアできる 配りの 一覧が 全部 ゴミに なる。
     ============================================================ */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ★ 配る（仕様 §7-2）
     ------------------------------------------------------------
       1. 種から mulberry32 ＋ Fisher–Yates で 52枚を まぜる
       2. 先頭 28枚 → ピラミッド（上の段から 左→右）
       3. のこり 24枚 → 山札
     ★ ソリティアの makeDeal と 1文字も 違わない 手順（向き・回数も 同じ）。

     ★ 山札の 持ちかた（ここが 分かれば 全部 分かる）
       stock … 24枚を 配った 順に ならべた 固定の 配列（並べかえない）
       p     … いま この 周で どこまで めくったか（0〜24）
       alive … まだ 場に 残っている 山札の 札（24ビット）
         → めくった札の 一番上 ＝ p より 小さい alive の うち 一番 大きい所
         → 山札の 次の 1枚   ＝ p 以上の alive の うち 一番 小さい所
       ★ この かたちなら「まわす（もどす）」は p を 0 に するだけ。
         札を 裏返して 積み直す のと 同じ 順番に なる。
       ★ めくる と 死んだ 場所は 飛ばす ので、
         **山札は おせば 必ず 1枚 めくれる**（仕様 §2-3）。 */
  function makeDeal(seed) {
    var rnd = mulberry32(seed >>> 0), deck = [], i, j, t;
    for (i = 0; i < 52; i++) deck.push(i);
    for (i = 51; i > 0; i--) {                 // Fisher–Yates（向き・回数を 変えない）
      j = Math.floor(rnd() * (i + 1));
      t = deck[i]; deck[i] = deck[j]; deck[j] = t;
    }
    return {
      seed: seed >>> 0,
      pyr: deck.slice(0, 28),
      mask: (1 << 28) - 1,          // ピラミッドに 残っている 札
      stock: deck.slice(28, 52),
      alive: (1 << 24) - 1,         // 山札＋めくった札に 残っている 札
      p: 0, pass: 0,
      hist: [], moves: 0, over: false, won: false
    };
  }

  function cloneState(g) {
    return {
      seed: g.seed, pyr: g.pyr, stock: g.stock,      // 中身は 変わらない（読むだけ）
      mask: g.mask, alive: g.alive, p: g.p, pass: g.pass,
      hist: [], moves: g.moves, over: false, won: false
    };
  }

  /* ============================================================
     ★ ルール（仕様 §2-6 の 10個。1つも 削らない）
     ============================================================ */
  function isFree(g, k) {                        // ルール3：下の 2枚が 消えた 札だけ
    if (!(g.mask & (1 << k))) return false;
    var c = CHILD[k];
    return c === null || (!(g.mask & (1 << c[0])) && !(g.mask & (1 << c[1])));
  }
  function freeList(g) {
    var out = [];
    for (var k = 0; k < 28; k++) if (isFree(g, k)) out.push(k);
    return out;
  }
  function wasteTop(g) {                          // めくった札の 一番上
    for (var i = g.p - 1; i >= 0; i--) if (g.alive & (1 << i)) return i;
    return -1;
  }
  function stockNext(g) {                         // 山札の 次の 1枚
    for (var i = g.p; i < 24; i++) if (g.alive & (1 << i)) return i;
    return -1;
  }
  function canDeal(g) { return stockNext(g) >= 0; }
  function canRecycle(g) {                        // ルール5：3周（2回 もどせる）
    return stockNext(g) < 0 && g.pass + 1 < TUNE.PASSES && g.alive !== 0;
  }
  function isWin(g) { return g.mask === 0; }      // ★山札が 残っていても 勝ち

  function pyrLeft(g) {
    var n = 0, m = g.mask;
    while (m) { n += m & 1; m >>>= 1; }
    return n;
  }
  function stockLeft(g) { var n = 0, i; for (i = g.p; i < 24; i++) if (g.alive & (1 << i)) n++; return n; }
  function wasteLeft(g) { var n = 0, i; for (i = 0; i < g.p; i++) if (g.alive & (1 << i)) n++; return n; }

  /* ★ 札は いつでも 52枚（たしかめ用。同じ札が 2枚あっても 見つかる）*/
  function countAll(g) {
    var seen = {}, n = 0, i;
    for (i = 0; i < 28; i++) { if (seen[g.pyr[i]]) return -1; seen[g.pyr[i]] = 1; n++; }
    for (i = 0; i < 24; i++) { if (seen[g.stock[i]]) return -1; seen[g.stock[i]] = 1; n++; }
    return n;
  }

  /* ============================================================
     ★ 手（move）― 札を 動かす 入口は applyMove ただ1つ
     ------------------------------------------------------------
       {k:'P2', a, b}   場の 2枚（合わせて 13）
       {k:'PW', a, w}   場の 1枚 ＋ めくった札（合わせて 13）
       {k:'PK', a}      場の K を 1枚で
       {k:'WK', w}      めくった札の K を 1枚で
       {k:'D',  np}     山札を 1枚 めくる
       {k:'R'}          山札を まわす（めくった札を 戻す）
     ★ w（めくった札の 場所）と np（めくった あとの p）は tag() が 入れる。
       もどす ときに 要る ―― 入口を 1つに するための 下ごしらえ。
     ============================================================ */
  function tag(g, mv) {
    if (mv.k === 'PW' || mv.k === 'WK') { if (mv.w == null) mv.w = wasteTop(g); }
    else if (mv.k === 'D') { if (mv.np == null) mv.np = stockNext(g) + 1; }
    return mv;
  }

  function applyMove(g, mv, opt) {
    var rec = { k: mv.k, mv: mv, p: g.p, pass: g.pass };
    switch (mv.k) {
      case 'P2': g.mask &= ~(1 << mv.a); g.mask &= ~(1 << mv.b); break;
      case 'PW': g.mask &= ~(1 << mv.a); g.alive &= ~(1 << mv.w); break;
      case 'PK': g.mask &= ~(1 << mv.a); break;
      case 'WK': g.alive &= ~(1 << mv.w); break;
      case 'D':  g.p = mv.np; break;
      case 'R':  g.p = 0; g.pass++; break;
    }
    g.moves++;
    if (!opt || opt.hist !== false) g.hist.push(rec);
    return rec;
  }

  /* ★ もどす（無制限・仕様 §7-3）。逆の 手順を 1つだけ 書く。
     ★ p と pass は 手の 前の 値を そのまま 覚えてある ので、
       どの 手でも 同じ 1行で 戻る（まわす の 周回数も 戻る）。 */
  function undoMove(g) {
    var rec = g.hist.pop();
    if (!rec) return false;
    var mv = rec.mv;
    switch (rec.k) {
      case 'P2': g.mask |= (1 << mv.a) | (1 << mv.b); break;
      case 'PW': g.mask |= (1 << mv.a); g.alive |= (1 << mv.w); break;
      case 'PK': g.mask |= (1 << mv.a); break;
      case 'WK': g.alive |= (1 << mv.w); break;
    }
    g.p = rec.p; g.pass = rec.pass;
    g.moves--;
    return true;
  }
  function doMove(g, mv, opt) { return applyMove(g, tag(g, mv), opt); }

  /* ============================================================
     ★ 出せる手を 全部 数える
       o.draw === false … 山札を さわる 手を 入れない（詰み判定で 使う）
     ============================================================ */
  function legalMoves(g, o) {
    o = o || {};
    var out = [], free = freeList(g), wt = wasteTop(g), i, j;

    for (i = 0; i < free.length; i++) if (val(g.pyr[free[i]]) === 13) out.push({ k: 'PK', a: free[i] });
    if (wt >= 0 && val(g.stock[wt]) === 13) out.push({ k: 'WK', w: wt });

    for (i = 0; i < free.length; i++) {
      for (j = i + 1; j < free.length; j++) {
        if (val(g.pyr[free[i]]) + val(g.pyr[free[j]]) === 13) out.push({ k: 'P2', a: free[i], b: free[j] });
      }
    }
    if (wt >= 0) {
      for (i = 0; i < free.length; i++) {
        if (val(g.pyr[free[i]]) + val(g.stock[wt]) === 13) out.push({ k: 'PW', a: free[i], w: wt });
      }
    }
    if (o.draw !== false) {
      var nx = stockNext(g);
      if (nx >= 0) out.push({ k: 'D', np: nx + 1 });
      else if (g.pass + 1 < TUNE.PASSES && g.alive !== 0) out.push({ k: 'R' });
    }
    return out;
  }

  /* ★ 詰み（仕様 §6-3）
     ------------------------------------------------------------
       ① 取れる札の 中に K が 1枚も ない
       ② 取れる札どうし・取れる札 × めくった札 で 13の組が 1つも ない
       ③ 山札が 空で、もう まわせない（3周 使い切った）
     ★ 山札に 札が 残っている 間は 詰みでは ない（おせば 必ず めくれる）。
       だから 判定は「出せる手が 0」だけで 済む ―― 9本で 一番 かんたん。
     ⚠️ ゲームは「もう 勝てない」とは ぜったいに 言わない。
        言うのは「1手も ない」ときだけ。 */
  function hasPlay(g) { return legalMoves(g, { draw: false }).length > 0; }
  function isStuck(g) { return !isWin(g) && legalMoves(g).length === 0; }

  /* ============================================================
     ★★ 解く道具（solver）― 仕様 §4
     ------------------------------------------------------------
     この 配りが クリアできるか を 調べて、できるなら **本当の 手順**を 返す。
     ・見つけた手順は 全部 ゲームの 合法手（applyMove を 通る 手）なので、
       そのまま 流しこめば 本当に 勝てる。★これが 保証の 中身。
     ・K は 見つけたら だまって 取る（強制手）。
       K は 1枚で 消える だけ ―― 取って 損する ことが 理屈で ありえない。
       場の K は 上の札の じゃまを 外し、めくった札の K は 下の札への 道を 開ける。
     ・場の 残り方は 1,430通り しか ない（仕様 §4-3）ので、
       同じ 場面（mask・alive・p・pass）を 2度 調べない だけで ぐっと 速く なる。
     ・時間切れ・数え切れは「不明」＝ 捨てる。失敗しても 誰も 困らない。
     ============================================================ */
  function solve(g0, opts) {
    opts = opts || {};
    var limitMs = opts.ms == null ? 2000 : opts.ms;
    var maxNodes = opts.nodes == null ? 300000 : opts.nodes;
    var t0 = Date.now(), nodes = 0, cut = false;
    var seen = new Set();
    var st = cloneState(g0), path = [];

    function step(mv) {                       // 1手 打って 潜る
      doMove(st, mv); path.push(mv);
      if (dfs()) return true;
      undoMove(st); path.pop();
      return false;
    }

    function dfs() {
      if (st.mask === 0) return true;
      if (nodes >= maxNodes) { cut = true; return false; }
      if ((nodes & 511) === 0 && Date.now() - t0 > limitMs) { cut = true; return false; }
      nodes++;

      var key = st.mask + ':' + st.alive + ':' + st.p + ':' + st.pass;
      if (seen.has(key)) return false;
      seen.add(key);

      var free = freeList(st), wt = wasteTop(st), i, j;

      /* ★ 強制手：K は 見つけたら 必ず 取る（分岐を 作らない）*/
      for (i = 0; i < free.length; i++) {
        if (val(st.pyr[free[i]]) === 13) return step({ k: 'PK', a: free[i] });
      }
      if (wt >= 0 && val(st.stock[wt]) === 13) return step({ k: 'WK', w: wt });

      /* 場どうしの 組 ―― 下の段（k が 大きい）から。深い所を 先に ほる */
      for (i = free.length - 1; i >= 0; i--) {
        for (j = i - 1; j >= 0; j--) {
          if (val(st.pyr[free[i]]) + val(st.pyr[free[j]]) !== 13) continue;
          if (step({ k: 'P2', a: free[j], b: free[i] })) return true;
          if (cut) return false;
        }
      }
      /* 場 × めくった札 */
      if (wt >= 0) {
        for (i = free.length - 1; i >= 0; i--) {
          if (val(st.pyr[free[i]]) + val(st.stock[wt]) !== 13) continue;
          if (step({ k: 'PW', a: free[i], w: wt })) return true;
          if (cut) return false;
        }
      }
      /* めくる ／ まわす */
      var nx = stockNext(st);
      if (nx >= 0) { if (step({ k: 'D', np: nx + 1 })) return true; if (cut) return false; }
      else if (st.pass + 1 < TUNE.PASSES && st.alive !== 0) {
        if (step({ k: 'R' })) return true; if (cut) return false;
      }
      return false;
    }

    var won = dfs();
    return {
      ok: won, unknown: !won && cut,
      moves: won ? path.slice() : null,
      nodes: nodes, ms: Date.now() - t0
    };
  }

  /* ★ 見つけた 手順を 本当に ゲームに 流しこんで 勝てるか たしかめる
     （仕様 §4-4 の「これを 最初に やること」）
     ⚠️ 手が 合法手の 中に あるか まで 見る ―― 通ったふり を させない。 */
  function replay(seed, moves) {
    var g = makeDeal(seed), i, j;
    for (i = 0; i < moves.length; i++) {
      var legal = legalMoves(g), ok = false, m = moves[i];
      for (j = 0; j < legal.length; j++) {
        var L = legal[j];
        if (L.k !== m.k) continue;
        if (m.k === 'P2' && (L.a !== m.a || L.b !== m.b)) continue;
        if (m.k === 'PW' && (L.a !== m.a || L.w !== m.w)) continue;
        if (m.k === 'PK' && L.a !== m.a) continue;
        if (m.k === 'WK' && L.w !== m.w) continue;
        if (m.k === 'D' && L.np !== m.np) continue;
        ok = true; break;
      }
      if (!ok) return { ok: false, at: i, why: '合法でない手（' + m.k + '）' };
      doMove(g, m);
      if (countAll(g) !== 52) return { ok: false, at: i, why: '札が52枚でない' };
    }
    return { ok: isWin(g), at: moves.length, why: isWin(g) ? '' : '勝てていない' };
  }

  /* ============================================================
     ★ 先を 読まない 打ち方（仕様 §4-5・§6-1 の 数字を 出す 道具）
     ------------------------------------------------------------
     人の 下手な 打ち方に 近い ―― 目の前で 取れる 組を、深い所から 取る。
     ここで 出た 数字だけを 報告に 書く（形容詞で 片づけない）。
     ============================================================ */
  function greedyMove(g) {
    var free = freeList(g), wt = wasteTop(g), i, j;
    for (i = 0; i < free.length; i++) if (val(g.pyr[free[i]]) === 13) return { k: 'PK', a: free[i] };
    if (wt >= 0 && val(g.stock[wt]) === 13) return { k: 'WK', w: wt };
    for (i = free.length - 1; i >= 0; i--) {
      for (j = i - 1; j >= 0; j--) {
        if (val(g.pyr[free[i]]) + val(g.pyr[free[j]]) === 13) return { k: 'P2', a: free[j], b: free[i] };
      }
    }
    if (wt >= 0) {
      for (i = free.length - 1; i >= 0; i--) {
        if (val(g.pyr[free[i]]) + val(g.stock[wt]) === 13) return { k: 'PW', a: free[i], w: wt };
      }
    }
    var nx = stockNext(g);
    if (nx >= 0) return { k: 'D', np: nx + 1 };
    if (g.pass + 1 < TUNE.PASSES && g.alive !== 0) return { k: 'R' };
    return null;
  }

  function playOne(seed, cap) {
    cap = cap || 400;
    var g = makeDeal(seed), i, err = null, takes = 0, deals = 0, kings = 0, recy = 0;
    for (i = 0; i < cap; i++) {
      if (isWin(g)) break;
      var m = greedyMove(g);
      if (!m) break;                                  // 1手も ない ＝ 詰み
      if (m.k === 'D') deals++;
      else if (m.k === 'R') recy++;
      else { takes++; if (m.k === 'PK' || m.k === 'WK') kings++; }
      doMove(g, m);
      if (countAll(g) !== 52) { err = '札が52枚でない'; break; }
      if (pyrLeft(g) + stockLeft(g) + wasteLeft(g) > 52) { err = '札が増えた'; break; }
    }
    return {
      seed: seed, won: isWin(g), stuck: isStuck(g), moves: g.moves,
      takes: takes, deals: deals, kings: kings, recycles: recy,
      left: pyrLeft(g), err: err, capped: i >= cap
    };
  }

  /* ============================================================
     CORE を 外に 出す（Node からも ブラウザからも 同じ 中身）
     ============================================================ */
  var CORE = {
    TUNE: TUNE, SUITS: SUITS, RANKS: RANKS, ROW: ROW, POS: POS, CHILD: CHILD,
    suitOf: suitOf, rankOf: rankOf, isRed: isRed, nameOf: nameOf, val: val,
    mulberry32: mulberry32, makeDeal: makeDeal, cloneState: cloneState,
    isFree: isFree, freeList: freeList, wasteTop: wasteTop, stockNext: stockNext,
    canDeal: canDeal, canRecycle: canRecycle,
    legalMoves: legalMoves, applyMove: applyMove, doMove: doMove, undoMove: undoMove, tag: tag,
    isWin: isWin, isStuck: isStuck, hasPlay: hasPlay,
    pyrLeft: pyrLeft, stockLeft: stockLeft, wasteLeft: wasteLeft, countAll: countAll,
    solve: solve, replay: replay, playOne: playOne, greedyMove: greedyMove
  };
  root.PYRAMID_CORE = CORE;
  if (typeof module === 'object' && module.exports) module.exports = CORE;

  /* ★ Node（画面が ない ところ）では ここで おしまい。
     ここから下は 1行も 動かない ―― だから 解く道具と ゲームは ズレようが ない。 */
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

  /* ============================================================
     ★★ クリアできる 配りの 一覧（社長裁定1・仕様 §4）★★
     ------------------------------------------------------------
     36進数 6文字ずつ で 種（配りの 番号）が ならんでいる。
     作りかた ―― logs/T76_ピラミッド_配り作り.cjs を Node で 走らせた。
       ① 種から 配る（makeDeal）
       ② 上の CORE の solve() に かける
       ③ ★見つけた 手順を replay() で **本当に ゲームに 流しこんで 勝てるか**
          たしかめる（1つでも 通らなければ その場で 中止する 作り）
       ④ 通った 種だけ ここに 足す
     ★ ①〜③は 全部 この ファイルの CORE を 使っている ＝ ズレようが ない。
     ★ 遊ぶ ときは この 中から 1つ えらぶ だけ。ブラウザは 1回も 解かない。
     ============================================================ */
  /* ↓ ここは logs/T76_ピラミッド_配り作り.cjs が 書きこむ（手で さわらない）*/
  var DEALS =
    '00000100000300000600000800000c00000d00000e00000g00000j00000k00000l00000o00000r00000s00000t' +
    '00000w00000x00000y00000z00001000001100001300001500001600001700001b00001c00001f00001g00001h' +
    '00001i00001j00001k00001l00001n00001o00001p00001q00001s00001v00001x00001y00001z000020000021' +
    '00002200002400002500002600002700002900002b00002c00002e00002f00002h00002j00002k00002l00002m' +
    '00002q00002s00002t00002u00002v00002w00002y00003000003200003600003800003g00003h00003m00003n' +
    '00003o00003p00003q00003r00003u00003v00003w00003x00003y00003z000040000043000044000045000046' +
    '00004800004a00004b00004c00004g00004h00004i00004k00004o00004p00004q00004r00004s00004u00004w' +
    '00004x00005000005300005500005700005900005b00005e00005f00005g00005i00005j00005k00005l00005n' +
    '00005s00005t00005u00005v00005x00005z00006000006100006200006300006500006600006700006900006b' +
    '00006c00006d00006e00006g00006h00006i00006l00006o00006q00006s00006t00006u00006w00006x00006z' +
    '00007000007100007200007300007400007500007600007700007900007a00007b00007d00007e00007f00007g' +
    '00007i00007j00007k00007l00007p00007q00007t00007u00007v00007w00007y00007z000081000082000083' +
    '00008400008500008600008800008a00008b00008d00008f00008g00008h00008i00008j00008l00008p00008u' +
    '00008v00008w00008x00009000009500009600009700009800009900009a00009b00009c00009d00009g00009h' +
    '00009i00009j00009k00009l00009m00009n00009o00009p00009q00009r00009s00009u00009v00009x00009z' +
    '0000a10000a20000a30000a50000a80000a90000aa0000ad0000ae0000af0000ah0000ai0000ak0000an0000ao' +
    '0000ap0000aq0000au0000av0000ax0000ay0000b10000b20000b40000b50000b70000b90000ba0000bb0000bd' +
    '0000bf0000bg0000bj0000bk0000bl0000bn0000bo0000bp0000bq0000bs0000bt0000bu0000bv0000bx0000by' +
    '0000bz0000c00000c40000c50000c60000c80000ca0000cc0000cd0000ce0000cg0000ch0000ci0000cj0000ck' +
    '0000cl0000cm0000cq0000cr0000cs0000cu0000cv0000cw0000cx0000cy0000cz0000d00000d10000d30000d5' +
    '0000d70000d90000dc0000de0000dg0000dh0000di0000dm0000dp0000dr0000dt0000dv0000dy0000dz0000e0' +
    '0000e10000e30000e40000e60000e70000e90000ea0000ed0000ee0000ei0000el0000eo0000es0000eu0000ev' +
    '0000ez0000f00000f10000f20000f40000f50000f80000f90000fb0000fc0000fd0000fe0000ff0000fg0000fk' +
    '0000fl0000fp0000fq0000fr0000fs0000ft0000fu0000fv0000fw0000fx0000fy0000fz0000g00000g10000g2' +
    '0000g40000g60000g70000gc0000gg0000gj0000gk0000gl0000gm0000go0000gt0000gv0000gw0000gy0000h0' +
    '0000h20000h30000h40000h60000h80000h90000ha0000hb0000hc0000he0000hg0000hi0000hl0000hm0000hn' +
    '0000ho0000hp0000hq0000hr0000ht0000hu0000hv0000hw0000hy0000i20000i30000i70000i80000i90000ib' +
    '0000id0000ie0000if0000ig0000ih0000ii0000ij0000ik0000il0000io0000ip0000is0000it0000iy0000j2' +
    '0000j40000j60000j80000ja0000jd0000jf0000jg0000jh0000jj0000jo0000jp0000jr0000js0000jt0000ju' +
    '0000jv0000jx0000k10000k20000k40000k50000k60000k70000k80000k90000ka0000kb0000kc0000kd0000ke' +
    '0000kf0000kg0000kh0000kk0000kl0000kn0000ko0000kp0000kq0000kt0000kv0000kx0000ky0000l10000l3' +
    '0000l40000l60000l70000l90000la0000lb0000lc0000li0000ll0000lm0000ln0000lo0000lq0000lr0000ls' +
    '0000lt0000lv0000lw0000m10000m20000m30000m50000m90000ma0000mc0000md0000mf0000mh0000mj0000mk' +
    '0000ml0000mm0000mn0000mo0000mp0000ms0000mu0000mx0000mz0000n00000n20000n30000n40000n70000n8' +
    '0000na0000nb0000nc0000nd0000ne0000nf0000ng0000nh0000ni0000nl0000nm0000nn0000no0000np0000nq' +
    '0000ns0000nt0000nu0000nv0000nw0000ny0000o00000o10000o20000o40000o50000o60000o80000o90000oa' +
    '0000oc0000od0000of0000oi0000oj0000ol0000om0000oo0000oq0000ot0000ov0000ow0000oy0000oz0000p1' +
    '0000p20000p30000p40000p50000p60000p70000pa0000pb0000pc0000pd0000pf0000pj0000pk0000pn0000pp' +
    '0000pq0000pr0000ps0000pt0000pu0000pv0000pw0000pz0000q00000q10000q30000q50000q60000q80000q9' +
    '0000qa0000qc0000qe0000qh0000qi0000qk0000qm0000qo0000qp0000qr0000qs0000qt0000qu0000qv0000qw' +
    '0000qz0000r00000r10000r50000r60000r70000r80000r90000ra0000rb0000rd0000re0000rf0000rg0000rh' +
    '0000ri0000rl0000rn0000rp0000rq0000rr0000ru0000rv0000rw0000rx0000rz0000s00000s40000s50000s7' +
    '0000s80000s90000sa0000sc0000sg0000sh0000sj0000sk0000sm0000so0000sp0000sq0000sr0000st0000sv' +
    '0000sw0000sz0000t00000t10000t20000t40000t50000t80000t90000tc0000td0000te0000th0000ti0000tn' +
    '0000tq0000tt0000tu0000tv0000tw0000u00000u30000u40000u50000u70000u90000ub0000uc0000ud0000ue' +
    '0000uf0000ug0000ui0000uk0000ul0000up0000uq0000ur0000ut0000uw0000uz0000v00000v10000v20000v3' +
    '0000v40000v50000v70000v90000vb0000vc0000vd0000ve0000vi0000vj0000vk0000vm0000vn0000vp0000vr' +
    '0000vt0000vu0000vw0000vx0000vy0000w10000w20000w30000w40000w50000w60000w80000w90000wb0000we' +
    '0000wh0000wi0000wk0000wm0000wn0000wo0000wp0000wq0000wr0000ws0000wt0000wu0000wv0000ww0000wx' +
    '0000wz0000x00000x20000x30000x40000x70000x90000xb0000xd0000xe0000xf0000xg0000xk0000xl0000xm' +
    '0000xn0000xo0000xr0000xt0000xu0000xx0000xy0000y00000y40000y50000y60000y70000yb0000yc0000yd' +
    '0000yf0000yh0000yi0000yk0000yn0000yp0000yr0000yt0000yu0000yw0000yx0000yz0000z00000z20000z4' +
    '0000z70000z80000z90000za0000zc0000zd0000zf0000zh0000zi0000zj0000zk0000zn0000zo0000zp0000zq' +
    '0000zr0000zt0000zv0000zx0000zz00010000010100010200010300010400010500010600010a00010b00010c' +
    '00010e00010g00010h00010i00010l00010n00010p00010q00010s00010t00010u00010v000111000113000114' +
    '00011500011600011700011800011900011f00011g00011h00011i00011l00011n00011o00011p00011q00011s' +
    '00011u00011v00011w00011x00011z00012000012100012300012500012600012800012900012b00012g00012i' +
    '00012k00012l00012n00012p00012q00012s00012y00012z000130000131000132000133000135000136000138' +
    '00013a00013b00013d00013e00013f00013g00013i00013j00013m00013n00013p00013q00013r00013s00013w' +
    '00014000014100014200014500014600014700014800014900014a00014d00014f00014g00014i00014j00014k' +
    '00014m00014n00014o00014p00014q00014r00014s00014t00014u00014w00014x00014z000150000151000153' +
    '00015500015600015700015800015900015a00015b00015d00015e00015g00015h00015l00015o00015p00015s' +
    '00015t00015u00015v00015w00015x00015y00016000016200016400016500016700016a00016b00016d00016e' +
    '00016f00016g00016h00016i00016j00016k00016m00016o00016p00016q00016s00016u00016v00016x00016y' +
    '00017000017100017700017800017a00017c00017g00017i00017n00017o00017p00017q00017r00017s00017v' +
    '00017x00017z00018000018200018300018400018800018900018a00018d00018f00018g00018h00018j00018k' +
    '00018n00018o00018p00018q00018r00018s00018w00018y00018z000190';
  var DEAL_LIST = [];
  (function () {
    for (var i = 0; i + 6 <= DEALS.length; i += 6) DEAL_LIST.push(parseInt(DEALS.substr(i, 6), 36));
  })();

  var bag = [];
  function pickSeed() {
    if (!DEAL_LIST.length) return (Math.random() * 2147483000) >>> 0;   // 保険（ふつう 通らない）
    if (!bag.length) {
      bag = DEAL_LIST.slice();
      for (var i = bag.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1)), t = bag[i]; bag[i] = bag[j]; bag[j] = t;
      }
    }
    return bag.pop();
  }

  /* ── 部品 ─────────────────────────────────── */
  var G = null, boardEl = null, boardIn = null, cardEl = [], spotEl = {}, built = false;
  var busy = false, timer = 0, fallStop = null, half = false;
  var whereP = [], whereS = [];      // 札の 番号 → ピラミッドの 場所 ／ 山札の 場所
  var geo = { cw: 49, ch: 74, gap: 2, v: 37, rowGap: 8 };

  function say(t) { $('happyBubble').textContent = t; }

  /* ============================================================
     ★★ 寸法（仕様 §1-1・§1-3。ルルが 計算した 数字を 再現する）★★
     ------------------------------------------------------------
     決めごとは 2つだけ：
       S（同じ段の となりとの 間かく）= 札のはば ＋ すきま  ★重ねない
       V（段と段の たての 落差）      = 札の高さ ÷ 2（切りすて）
     ★ この 2つは 工夫の 余地が ない（仕様 §1-6 の ❌表）。
       S を つめると「完全に 見えている ＝ 取れる」が 壊れ、
       V を 動かすと 3段 かぶる（うそ）か、合図が 弱る。
     ★ 余った たては 帯に 配らない ―― ピラミッドの 的は 札まるごと なので、
       帯を 広げても 1pxも 得しない（仕様 §1-6 の ⚠️）。上下に 半分ずつ 残す。

     ★ 出てくる 答え（ルルの 表・仕様 §1-3）
       1000×900 → 96px ／ 375px → 49×74px ／ 320px → 42px
       ここが 違ったら、どこかが 間違っている。
     ============================================================ */
  function fit(W, H) {
    for (var w = TUNE.CARD_MAX; w >= 20; w--) {
      var g = Math.max(2, Math.round(w * TUNE.GAP_RATE));   // 列の 間 ＝ はばの 4%
      if (7 * w + 6 * g > W) continue;                      // よこ：一番下の 7枚が 入るか
      var h = Math.round(w * TUNE.RATIO);
      var v = Math.floor(h / 2);                            // ★段の 落差
      var rowGap = Math.max(8, Math.round(h * 0.11));
      var pyrH = 6 * v + h;
      if (pyrH + rowGap + h > H) continue;                  // たて：＋すきま＋山札の 行
      return { cw: w, ch: h, gap: g, v: v, rowGap: rowGap, pyrH: pyrH, pyrW: 7 * w + 6 * g, need: pyrH + rowGap + h };
    }
    var h2 = Math.round(20 * TUNE.RATIO), v2 = Math.floor(h2 / 2);
    return { cw: 20, ch: h2, gap: 2, v: v2, rowGap: 8, pyrH: 6 * v2 + h2, pyrW: 152, need: 6 * v2 + h2 + 8 + h2 };
  }

  function layout() {
    if (!boardIn) return;
    cancelPress();                      // ★ 大きさが 変わる 前に 指を はなす（えらんだ札は そのまま）
    var W = boardIn.clientWidth, H = boardIn.clientHeight;
    if (!W || !H) return;
    geo = fit(W, H);
    geo.x0 = Math.max(0, Math.round((W - geo.pyrW) / 2));
    geo.y0 = Math.max(0, Math.floor((H - geo.need) / 2));   // ★余りは 上下 半分ずつ
    geo.rowY = geo.y0 + geo.pyrH + geo.rowGap;
    /* ★ 青わくの 太さ ＝ 札の はばの 6%（3px より 細く しない）。
       札が 小さい 端末でも 見え、大きい 端末でも 太すぎない。 */
    geo.pick = Math.max(3, Math.round(geo.cw * 0.06));

    /* ★ 山札の 厚み ＝ あと 何回 まわせるか（仕様 §6-4・スパイダー T74 の stockStep）
       数字は 1つも 出さない。厚みだけで 伝える。 */
    geo.sx = Math.max(2, Math.min(Math.round(geo.cw * 0.14), Math.floor((geo.cw + geo.gap) / 4)));
    var below = H - (geo.rowY + geo.ch);
    geo.sy = Math.max(0, Math.min(3, Math.floor(below / 3)));
    /* ★ めくった札の 厚み ＝ この まわりで 何枚 めくったか（一番上は 動かない）*/
    geo.wsp = Math.round(geo.cw * 0.5);

    var stockW = geo.cw + 2 * geo.sx;
    var mid = Math.max(geo.gap * 2, Math.round(geo.cw * 0.30));
    var rowW = stockW + mid + geo.wsp + geo.cw;
    var sx0 = Math.max(0, Math.round((W - rowW) / 2));
    geo.stockX = sx0;
    geo.wasteX = sx0 + stockW + mid + geo.wsp;

    var r = document.documentElement.style;
    r.setProperty('--cw', geo.cw + 'px');
    r.setProperty('--ch', geo.ch + 'px');
    r.setProperty('--radius', Math.max(3, Math.round(geo.cw * 0.075)) + 'px');
    r.setProperty('--pick', geo.pick + 'px');
    placeSpots();
    if (G) render(true);
  }

  /* ピラミッドの 置き場所（★同じ段は 重ねない。段の 落差は V）*/
  function slotX(k) { return geo.x0 + Math.round((geo.cw + geo.gap) * ((6 - ROW[k]) / 2 + POS[k])); }
  function slotY(k) { return geo.y0 + ROW[k] * geo.v; }

  /* ── 置き場（山札・めくった札 の 2つ）と 52枚の 札を 1回だけ 作る ─────
     ★ ピラミッドの 28か所には 下じきを 置かない。
       消えた 所に わくが 残ると「まだ 何か ある」と 見える ―― 引き算（§5-3）。 */
  function build() {
    if (built) return;
    built = true;
    boardEl = $('board');
    boardIn = document.createElement('div');
    boardIn.className = 'board-in';
    boardEl.appendChild(boardIn);

    function spot(key, cls) {
      var d = document.createElement('div');
      d.className = 'spot' + (cls ? ' ' + cls : '');
      d.dataset.spot = key;
      boardIn.appendChild(d);
      spotEl[key] = d;
      return d;
    }
    spot('stock', 'is-stock');
    spot('waste');

    for (var c = 0; c < 52; c++) {
      var d = document.createElement('div');
      d.className = 'card is-down';
      d.dataset.id = String(c);
      var inn = document.createElement('div');
      inn.className = 'card-in';
      var f = document.createElement('img'); f.className = 'cf'; f.alt = ''; f.draggable = false;
      var b = document.createElement('img'); b.className = 'cb'; b.alt = ''; b.draggable = false; b.src = BACK_SRC;
      f.onerror = (function (cc, el) { return function () { fallback(cc, el); }; })(c, inn);
      inn.appendChild(f); inn.appendChild(b);
      d.appendChild(inn);
      boardIn.appendChild(d);
      cardEl.push(d);
    }

    /* ★ 操作は Pointer Events だけ（8本で 共通）
       HTML5 の draggable / dragstart / drop は 1つも 使わない（スマホで 動かない）。
       ⚠️ ここに click は 足さない こと。
       ★ T77 で 運ぶのを やめた あとも pointerdown/pointerup の ままに して ある
         ―― スマホの click は 遅れる・取りこぼす ので、おした 返事が にぶる。
         pointermove は「指が よそへ ずれた か」を 見るだけ に なった。 */
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
  function fallback(c, inn) {
    if (inn.querySelector('.fallback')) return;
    var d = document.createElement('div');
    d.className = 'fallback ' + (isRed(c) ? 'red' : 'black');
    d.textContent = (isRed(c) ? (suitOf(c) === 1 ? '♥' : '♦') : (suitOf(c) === 0 ? '♠' : '♣')) + RANKS[rankOf(c)];
    inn.appendChild(d);
  }

  function placeSpots() {
    function put(el, x, y) {
      el.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      el.style.width = geo.cw + 'px'; el.style.height = geo.ch + 'px';
    }
    put(spotEl.stock, geo.stockX, geo.rowY);
    put(spotEl.waste, geo.wasteX, geo.rowY);
    spotEl.stock.style.fontSize = Math.round(geo.cw * 0.5) + 'px';
  }

  /* ★ すべっている 札は おせない（T69・🔴1 と 同じ 事故よけ）
     山札を おす 手は 1試合 62回。ここが 抜けると 連打が 消える。 */
  var flyTimer = [], lastTf = [];
  function flyMark(c, el) {
    el.classList.add('is-fly');
    clearTimeout(flyTimer[c]);
    flyTimer[c] = setTimeout(function () { el.classList.remove('is-fly'); }, TUNE.MOVE + 40);
  }
  function flyClear() {
    for (var i = 0; i < cardEl.length; i++) {
      clearTimeout(flyTimer[i]);
      if (cardEl[i]) cardEl[i].classList.remove('is-fly');
    }
  }

  /* ── 並べる ───────────────────────────────── */
  function place(c, x, y, z, up, out) {
    var el = cardEl[c];
    var tf = 'translate(' + x + 'px,' + y + 'px)';
    if (lastTf[c] !== tf) {
      lastTf[c] = tf;
      el.style.transform = tf;
      if (!boardEl.classList.contains('no-anim')) flyMark(c, el);
    }
    el.style.zIndex = String(z);
    el.classList.remove('as-stock');
    el.classList.toggle('is-out', !!out);          // ★取られた 札は 小さくなって 消える
    if (up) {
      var f = el.firstChild.firstChild;
      if (!f.getAttribute('src')) f.src = cardSrc(nameOf(c));   // ★今つかう札だけ 読む
      el.classList.remove('is-down');
    } else {
      el.classList.add('is-down');
    }
  }

  function render(instant) {
    if (!G) return;
    if (instant) { boardEl.classList.add('no-anim'); flyClear(); }
    var i, k, z;

    /* ピラミッド（下の段ほど 手前）*/
    for (k = 0; k < 28; k++) {
      var live = !!(G.mask & (1 << k));
      place(G.pyr[k], slotX(k), slotY(k), live ? (10 + ROW[k]) : 400, true, !live);
    }

    /* 山札（★厚み ＝ あと 何回 まわせるか。次の 1枚が 一番 手前）*/
    var st = [], wa = [];
    for (i = 0; i < 24; i++) {
      if (!(G.alive & (1 << i))) continue;
      if (i >= G.p) st.push(i); else wa.push(i);
    }
    var layers = Math.max(1, TUNE.PASSES - G.pass);
    var batch = st.length ? Math.ceil(st.length / layers) : 1;
    z = 30;
    for (i = st.length - 1; i >= 0; i--) {                 // 奥から 描く
      var lay = Math.min(layers - 1, Math.floor(i / batch));
      place(G.stock[st[i]], geo.stockX + lay * geo.sx, geo.rowY + lay * geo.sy, z + (st.length - 1 - i), false);
      cardEl[G.stock[st[i]]].classList.add('as-stock');
    }
    /* めくった札（★一番上は いつでも 同じ 場所。下の 段だけ 左へ ずれる）*/
    z = 100;
    for (i = 0; i < wa.length; i++) {
      var depth = wa.length - 1 - i;
      var off = Math.round(Math.min(depth, 23) / 23 * geo.wsp);
      place(G.stock[wa[i]], geo.wasteX - off, geo.rowY, z + i, true);
    }
    /* 取られた 山札の 札は、めくった札の 場所で 消える */
    for (i = 0; i < 24; i++) {
      if (G.alive & (1 << i)) continue;
      place(G.stock[i], geo.wasteX, geo.rowY, 400, true, true);
    }

    /* 山札が 空の ときだけ「まわせるよ」の 目じるし（文字は 1つも 足さない）*/
    spotEl.stock.classList.toggle('no-recycle', st.length > 0 || !canRecycle(G));

    /* ★ えらんだ 札は 一番 手前に する ―― 青わくが となりの 札に かからない ように。
       place() が z-index を 書きもどす ので、ここで 上書きする（順番が 大事）。 */
    if (sel && cardEl[sel.card]) cardEl[sel.card].style.zIndex = '500';

    if (instant) { void boardEl.offsetWidth; boardEl.classList.remove('no-anim'); }
  }

  /* ============================================================
     ★★ 操作（T77・社長指示で 作り直し）★★
     ------------------------------------------------------------
       1枚めを おす … その札を **青わく**で かこむ（＝ えらんだ）
       2枚めを おす … 合わせて 13 なら 2枚とも 消える／13で なければ 何も 起きない
       青わくを おす … えらびを やめる
       K を おす    … その場で 取れる（1枚で 取れる 札なので えらぶ 意味が 無い）
       山札を おす  … 1枚 めくる（★必ず めくれる）／ 空なら まわす

     ★★ 画面で 光る／色が 変わる ものは 青わく ただ1つ（設計図 §5.5）★★
       ★ 青わくが 言うのは「**えらんだ**」だけ。「ここに 置ける」は 言わない
         ―― 言った 瞬間に 設計図 追記② が 禁じた 仕組みが 戻ってくる。
       ★ 置ける場所は 1つも 光らせない。ヒントも 作らない。
       ★ 取れない 札を おすと、その札だけ ぷるっと ゆれる（音は 鳴らさない）。
         ゆれは 光でも 色でも ない ので、強調は 青わく 1種類の まま。
     ============================================================ */

  function buildWhere() {
    var i;
    whereP = []; whereS = [];
    for (i = 0; i < 52; i++) { whereP[i] = -1; whereS[i] = -1; }
    for (i = 0; i < 28; i++) whereP[G.pyr[i]] = i;
    for (i = 0; i < 24; i++) whereS[G.stock[i]] = i;
  }

  /* ── ① どの札を おしたか ──────────────────────
     ★ 上に ある札ほど z-index が 大きい ので、e.target から 一番 近い .card を
       たどれば「画面で いちばん 手前に 見えている 札」が そのまま 取れる。
     戻り値：
       {kind:'pyr', k}    取れる 場の札
       {kind:'waste'}     めくった札の 一番上
       {kind:'stock'}     山札（えらべない・おすだけ）
       {kind:'no', el}    ★取れない 札（えらべない → ゆれる） */
  function grabAt(c) {
    var k = whereP[c];
    if (k >= 0) {
      if (!(G.mask & (1 << k))) return null;                 // もう 消えている
      if (isFree(G, k)) return { kind: 'pyr', k: k, card: c, v: val(c) };
      return { kind: 'no', card: c };                        // ★下が 空いていない
    }
    var i = whereS[c];
    if (i < 0 || !(G.alive & (1 << i))) return null;
    if (i >= G.p) return { kind: 'stock' };
    if (i !== wasteTop(G)) return { kind: 'no', card: c };    // めくった札の 下の 方
    return { kind: 'waste', card: c, w: i, v: val(c) };
  }

  /* ── ② えらんだ 2枚は ルール上 組めるか（組めなければ null）────
     ⚠️ ここは「合わせて 13 か」を 見るだけ。相手を **探さない**。
        探した 瞬間に、設計図 追記② が 禁じた 仕組みが 戻ってくる。
     ★ 2枚とも 人が おした 札。この 関数は たしかめるだけ。 */
  function moveFor(src, tgt) {
    if (!src || !tgt) return null;
    var sv = src.kind === 'pyr' ? val(G.pyr[src.k]) : val(G.stock[src.w]);
    var tv = tgt.kind === 'pyr' ? val(G.pyr[tgt.k]) : val(G.stock[tgt.w]);
    if (sv + tv !== 13) return null;
    if (src.kind === 'pyr' && tgt.kind === 'pyr') {
      return { k: 'P2', a: Math.min(src.k, tgt.k), b: Math.max(src.k, tgt.k) };
    }
    if (src.kind === 'pyr') return { k: 'PW', a: src.k, w: tgt.w };
    return { k: 'PW', a: tgt.k, w: src.w };
  }

  /* ── ③「K を 1枚で 取る」（★T77：おした その場で 取れる）───────
     ★ K は 13。ほかの どの札と 足しても 13 を こえる ＝ **組む相手が 1枚も 無い**。
       つまり K を えらぶ 意味が そもそも 無い。
     ★ むかしは「2回 おす」に して いたが、T77 で 1回目＝えらぶ・
       2回目＝えらびを やめる に なった ので、2回おしでは K が 永久に 取れない。
       同じ 場所で 2つの 意味を 争わせない ため、K だけ その場で 取る 形に した。
     ★ K を 取って 損する ことは 理屈で ありえない（1枚で 消えて、上の 札の
       じゃまが 外れる だけ）。うっかり おしても「もどす」で 戻る。
     ★ これは「プログラムが 探した」では ない ―― K を おしたのは 人。 */
  function toKing(src) {
    if (!src) return null;
    if (src.kind === 'pyr' && val(G.pyr[src.k]) === 13) return { k: 'PK', a: src.k };
    if (src.kind === 'waste' && val(G.stock[src.w]) === 13) return { k: 'WK', w: src.w };
    return null;
  }

  /* ★「それは だめ」の ゆれ ―― 画面に ある たった 1種類の 強調（設計図 §5.5）。
     置き場所は transform で 決めて いるので、ゆらす 前に その 場所を
     --sx / --sy に 入れて おく（入れないと 左上に 飛ぶ）。 */
  function shakeNo(el, x, y) {
    if (!el) return;
    el.style.setProperty('--sx', x + 'px');
    el.style.setProperty('--sy', y + 'px');
    el.classList.remove('is-no');
    void el.offsetWidth;
    el.classList.add('is-no');
  }
  function clearShake(e) { if (e.animationName === 'shakeNo') e.target.classList.remove('is-no'); }

  function shakeCard(c) {
    var k = whereP[c];
    if (k >= 0) { shakeNo(cardEl[c], slotX(k), slotY(k)); return; }
    var i = whereS[c];
    if (i < 0) return;
    var wa = [], j;
    for (j = 0; j < G.p; j++) if (G.alive & (1 << j)) wa.push(j);
    var idx = wa.indexOf(i);
    if (idx < 0) return;
    var depth = wa.length - 1 - idx;
    shakeNo(cardEl[c], geo.wasteX - Math.round(Math.min(depth, 23) / 23 * geo.wsp), geo.rowY);
  }

  /* ============================================================
     ★★ おして えらぶ 本体（T77）★★
     ------------------------------------------------------------
     ★ 覚えて おく のは たった 1つ ―― sel（いま えらんでいる 札）だけ。
       sel === null なら 何も えらんで いない。
     ★ sel に K が 入る ことは 無い（K は おした その場で 取れる ので）。
       これで「えらんだ K が 取れない」たぐいの ややこしさが 丸ごと 消える。
     ============================================================ */
  var sel = null;                 // {kind:'pyr'|'waste', card, k|w}
  var press = null;               // いま おさえている 指（1本だけ）

  function clearSel() {
    if (!sel) return;
    var c = sel.card;
    sel = null;
    if (cardEl[c]) cardEl[c].classList.remove('is-pick');
    render();                     // ★ z-index を もとの 段の 順番に もどす
  }
  function setSel(g0) {
    if (sel) { if (cardEl[sel.card]) cardEl[sel.card].classList.remove('is-pick'); }
    sel = g0;
    cardEl[g0.card].classList.add('is-pick');
    render();                     // ★ えらんだ 札を 一番 手前へ（青わくが 欠けない）
  }

  /* ★ 場が 動いた あと、えらんだ 札が まだ「取れる 札」か たしかめる。
     ------------------------------------------------------------
     ・その札が 取られた → 外す
     ・山札を めくった → めくった札の 一番上が 変わる ので、
       めくった札を えらんで いた ときは 外れる（grabAt が 'no' を 返す）
     ★ 場の 札を えらんだ まま 山札を おす のは よく ある 手
       （「7 を えらんで、6 が 出るまで めくる」）ので、そこは 外さない。 */
  function checkSel() {
    if (!sel) return;
    var g0 = grabAt(sel.card);
    if (!g0 || (g0.kind !== 'pyr' && g0.kind !== 'waste')) {
      var c = sel.card;
      sel = null;
      if (cardEl[c]) cardEl[c].classList.remove('is-pick');
      return;
    }
    sel = g0;                     // 場所（k・w）を いまの ものに 入れ直す
  }

  /* ── 札を 1回 おした ────────────────────────────
     ★★ 順番が そのまま ルール。上から 読めば 全部 分かる。★★ */
  function tapCard(c) {
    var g0 = grabAt(c);
    if (!g0) return;                                   // もう 消えている 札

    if (g0.kind === 'stock') { pressStock(); return; } // 山札は おすと めくれる

    if (g0.kind === 'no') {
      /* ★ 取れない 札（下の 2枚が まだ 消えていない／めくった札の 下の 方）。
         その札だけ ぷるっと ゆれる。音は 鳴らさない。
         どこなら 取れるかは 1つも 教えない（設計図 追記②）。
         ★ えらんでいる 札は そのまま ―― おし間ちがいで 消えたら じゃま。 */
      shakeCard(g0.card);
      return;
    }

    /* ★ K は おした その場で 取れる（組む 相手が 1枚も 無い 札）。
       えらんでいる 札が あっても、それは そのまま 残す。 */
    var kk = toKing(g0);
    if (kk) { play(kk); return; }

    /* ★ 青わくの 札を もう一度 おした → えらびを やめる */
    if (sel && sel.card === c) { clearSel(); return; }

    if (sel) {
      var mv = moveFor(sel, g0);
      if (mv) { clearSel(); play(mv); return; }        // ★合わせて 13 → 2枚とも 消える
      /* ★★ 13で なければ 何も 起きない（社長の 言葉の まま）★★
         1枚めの 青わくは **残す**。
         理由：この ゲームの 遊び方は「7 を えらんだ。さあ 6 は どこだ」。
               えらんだ 札は "問い"、おす 札は "答え合わせ"。
               外した たびに 問いが 消えると、毎回 えらび直しに なる。
         ★ 気が 変わった ときは 青わくを もう一度 おせば 外れる。 */
      return;
    }

    setSel(g0);                                        // ★1枚め → 青わくで かこむ
  }

  /* ── 指の 出入り（Pointer Events だけ・1本の 指だけ）─────────
     ★ click では なく pointerdown/pointerup で 取る ―― スマホの
       click は 300ms 遅れたり 取りこぼしたり する（8本で 共通の 作法）。
     ★ おした所から TAP_SLOP 以上 ずれたら、その1回は 数えない。 */
  function onDown(e) {
    if (!G || G.over || busy) return;
    if (press) return;                                // ★ 2本目の 指は 見ない
    if (e.isPrimary === false) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    var t = e.target;
    var cEl = t.closest ? t.closest('.card') : null;
    var sp = t.closest ? t.closest('.spot') : null;
    var id = -1, stock = false;

    if (cEl) id = parseInt(cEl.dataset.id, 10);
    else if (sp && sp.dataset.spot === 'stock') stock = true;   // 山札が 空の とき（まわす）
    else return;

    e.preventDefault();
    var r = boardIn.getBoundingClientRect();
    press = {
      id: e.pointerId, card: id, stock: stock, out: false,
      sx: e.clientX - r.left, sy: e.clientY - r.top, rl: r.left, rt: r.top
    };
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
    if (d.out) return;                                // 指が よそへ ずれた
    if (!G || G.over || busy) return;
    if (d.stock) { pressStock(); return; }
    if (d.card >= 0) tapCard(d.card);
  }

  function onCancel(e) {
    var d = press;
    if (!d || e.pointerId !== d.id) return;
    press = null;
    try { boardIn.releasePointerCapture(e.pointerId); } catch (err) {}
  }
  /* ★ 指だけ はなす（えらんだ 札は そのまま）―― 画面の 大きさが 変わった ときに 使う */
  function cancelPress() { press = null; }

  /* ★ 山札を おした（仕様 §3-5）
     ・札が あれば 必ず 1枚 めくれる
     ・空で、まだ まわせるなら まわす（2回まで）
     ・3周 使い切って いたら ―― その ときだけ ゆれる */
  function pressStock() {
    if (canDeal(G)) { play({ k: 'D' }); return; }
    if (canRecycle(G)) { play({ k: 'R' }); return; }
    shakeNo(spotEl.stock, geo.stockX, geo.rowY);
  }

  /* ── 1手 打つ（★人の 手は かならず ここを 通る）───────── */
  function play(mv) {
    doMove(G, mv);
    checkSel();                   // ★ えらんだ 札が まだ 取れるか（場が 動いた ので）
    render();
    updateTools();
    if (isWin(G)) { finish(); return; }
    /* ★ 半分（14枚）消えた（仕様 §6-5）。数字は 言わない。 */
    if (!half && pyrLeft(G) <= 14) { half = true; say('半分 消えた！　いい ちょうし！'); }
    if (isStuck(G)) showResult('stop');
  }

  function updateTools() {
    $('btnUndo').disabled = !G || !G.hist.length || busy;
  }

  /* ── 勝ち ────────────────────────────────── */
  function finish() {
    busy = true; G.over = true; G.won = true;
    updateTools(); render();
    say('やったー！　ピラミッドが ぜんぶ 消えたね！');
    $('happyCat').classList.add('is-jump');
    timer = setTimeout(startFall, TUNE.FALL_WAIT);
  }

  /* ============================================================
     ★ 札が 降る 演出（仕様 §6-2・ソリティアと まったく 同じ 52枚）
     ------------------------------------------------------------
     ・タップで 飛ばせる
     ・TUNE.FALL_MAX（6秒）で かってに 止まる ―― 誰も 閉じこめない
     ★ ピラミッドが あった 所から こぼれ落ちる。
     ============================================================ */
  function startFall() {
    var cv = $('fallCanvas');
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var Wp = window.innerWidth, Hp = window.innerHeight;
    cv.width = Math.round(Wp * dpr); cv.height = Math.round(Hp * dpr);
    cv.classList.remove('hidden');
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var br = boardIn.getBoundingClientRect();
    var order = [], k;
    for (k = 27; k >= 0; k--) order.push({ c: G.pyr[k], x: br.left + slotX(k), y: br.top + slotY(k) });
    for (k = 23; k >= 0; k--) order.push({ c: G.stock[k], x: br.left + geo.wasteX, y: br.top + geo.rowY });

    var live = [], next = 0, t0 = performance.now(), raf = 0, done = false;
    var cw = geo.cw, ch = geo.ch;

    function stop() {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf);
      cv.removeEventListener('pointerdown', stop);
      ctx.clearRect(0, 0, Wp, Hp);
      cv.classList.add('hidden');
      fallStop = null;
      showResult('win');
    }
    fallStop = stop;
    cv.addEventListener('pointerdown', stop);

    function tick(now) {
      var el = now - t0;
      if (el > TUNE.FALL_MAX) { stop(); return; }
      while (next < order.length && el > next * TUNE.FALL_STEP) {
        var o = order[next];
        var img = cardEl[o.c].firstChild.firstChild;
        if (!img.getAttribute('src')) img.src = cardSrc(nameOf(o.c));
        var dir = Math.random() < .5 ? -1 : 1;
        live.push({
          img: img, x: o.x, y: o.y, w: cw, h: ch,
          vx: dir * (1.6 + Math.random() * 4.2), vy: -(1 + Math.random() * 5)
        });
        next++;
      }
      for (var i = live.length - 1; i >= 0; i--) {
        var p = live[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.62;
        if (p.y + p.h > Hp) {
          p.y = Hp - p.h;
          p.vy = -p.vy * 0.80;
          if (p.vy > -3) p.vy = -(3 + Math.random() * 3);
        }
        if (p.img.complete && p.img.naturalWidth) {
          try { ctx.drawImage(p.img, p.x, p.y, p.w, p.h); } catch (e) {}
        }
        if (p.x + p.w < -20 || p.x > Wp + 20) live.splice(i, 1);
      }
      if (next >= order.length && live.length === 0) { stop(); return; }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
  }

  /* ============================================================
     ★ 結果の 箱 ＋ 連打よけ（T62の 事故を くり返さない）
     ============================================================ */
  var locked = false, lockTimer = 0, lockAt = 0;
  function armUnlock(ms) { clearTimeout(lockTimer); lockTimer = setTimeout(unlockResult, ms); }
  function lockResult() {
    locked = true; lockAt = performance.now();
    $('resultBox').classList.add('is-locked');
    $('btnMain').disabled = true; $('btnSub').disabled = true;
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
    $('btnMain').disabled = false; $('btnSub').disabled = false;
    $('btnQuit').removeAttribute('aria-disabled'); $('btnQuit').removeAttribute('tabindex');
  }

  /* ★★ 詰みの 箱（社長裁定4）★★
     ------------------------------------------------------------
     ソリティア・スパイダーは「新しく 配る」が 主役だった。
     ★ピラミッドは 逆 ―― **「もどす」を 一番 大きく 出す。**
     理由：配りは 必ず クリアできる ので、正しい 次の 一手は
           「配り直す」では なく「もどす」。
     ★ ボタンの 大きさで 言える ので、画面の 文字は 1文字も 増やさない。 */
  function showResult(kind) {
    G.over = true; busy = true; updateTools();
    var win = kind === 'win';
    $('resultTitle').textContent = win ? 'ピラミッドが ぜんぶ 消えた！' : 'うーん、止まった';
    $('resultTitle').classList.toggle('is-stop', !win);
    var line = win ? 'やったー！　ピラミッドが ぜんぶ 消えたね！' : 'まだ クリアできるよ！　もどってみる？';
    $('resultSay').textContent = line;
    say(line);
    if (win) {
      $('btnMain').innerHTML = '新しく 配る <b>▶</b>';
      $('btnMain').dataset.act = 'new';
      $('btnSub').classList.add('hidden');
    } else {
      $('btnMain').innerHTML = 'もどす <b>▶</b>';       // ★一番 大きい ボタン
      $('btnMain').dataset.act = 'undo';
      $('btnSub').classList.remove('hidden');
    }
    $('btnQuit').classList.remove('hidden');
    lockResult();
    $('resultWrap').classList.remove('hidden');
  }
  function hideResult() { $('resultWrap').classList.add('hidden'); unlockResult(); }

  /* ── 試合の 出し入れ ──────────────────────────── */
  function cancelAll() {
    cancelPress();
    /* ★ えらびは ここで 外す（配り直し・もどす・結果の 箱）。
       render() を 呼ぶ 前に 消す だけ ―― clearSel() は 使わない
       （G を 入れかえる 途中で render() が 走ると 中身が ずれる）。 */
    if (sel) { if (cardEl[sel.card]) cardEl[sel.card].classList.remove('is-pick'); sel = null; }
    clearTimeout(timer);
    if (fallStop) fallStop();
    $('fallCanvas').classList.add('hidden');
    $('happyCat').classList.remove('is-jump');
    hideResult();
    busy = false;
  }

  function showBoard() {
    $('titleScreen').classList.add('hidden');
    $('playScreen').classList.remove('hidden');
    $('tools').classList.remove('hidden');
    buildWhere();
    layout(); render(true); updateTools();
  }

  function newDeal(again) {
    cancelAll();
    G = makeDeal(pickSeed());
    half = false;
    showBoard();
    /* ★ 保証が ある からこそ 言える ひとこと（仕様 §6-5）。
       配りは 必ず クリアできる ので、これは うそに ならない。 */
    if (again) {
      say('つぎの配りで がんばろ！');
      timer = setTimeout(function () { if (G && !G.over) say('この配り、ちゃんと クリアできるよ！'); }, 1600);
    } else {
      say('この配り、ちゃんと クリアできるよ！');
    }
  }

  /* ★ もどす と 箱の 閉じかたの 順番（T69・🟡6 と 同じ 直し）
     箱を 先に 閉じると、もどせる 手が 無い ときに G.over が true の まま 残り、
     盤面が 固まる。閉じるのも 止まったを 解くのも 必ず ここを 通す。 */
  function undoOne() {
    if (!G) return;
    cancelAll();
    G.over = false; G.won = false;
    if (G.hist.length) undoMove(G);
    render();
    updateTools();
  }

  /* ── つなぐ ─────────────────────────────────── */
  function boot() {
    build();
    $('btnStart').addEventListener('click', function () { newDeal(false); });
    $('btnNew').addEventListener('click', function () { newDeal(true); });
    $('btnUndo').addEventListener('click', undoOne);
    $('btnHowto').addEventListener('click', function () { $('helpDialog').showModal(); });
    var closers = document.querySelectorAll('[data-close]');
    for (var i = 0; i < closers.length; i++) {
      closers[i].addEventListener('click', function () { $(this.dataset.close).close(); });
    }
    $('btnMain').addEventListener('click', function () {
      if (locked) return;
      if (this.dataset.act === 'undo') undoOne();
      else newDeal(true);
    });
    $('btnSub').addEventListener('click', function () { if (!locked) newDeal(true); });
    $('resultWrap').addEventListener('pointerdown', bumpLock, true);
    window.addEventListener('resize', layout);
    window.addEventListener('orientationchange', function () { setTimeout(layout, 120); });
    layout();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* ============================================================
     ★ たしかめ用の 窓口（window.PYRAMID）― 既存8本と 同じ 作法
     ------------------------------------------------------------
     画面には 1つも 出さない（お客さんに 見せる 物では ない）。
     ============================================================ */
  function median(a) { if (!a.length) return 0; var b = a.slice().sort(function (x, y) { return x - y; }); return b[b.length >> 1]; }

  function autoPlay(n) {
    n = n || 100;
    var t0 = Date.now(), mv = [], tk = [], errs = [], w = 0, st = 0, capped = 0, bad52 = 0, left = [];
    for (var i = 0; i < n; i++) {
      var seed = DEAL_LIST.length ? DEAL_LIST[i % DEAL_LIST.length] : (i + 1);
      var r = playOne(seed, 400);
      if (r.err) { errs.push('seed ' + seed + '：' + r.err); if (r.err.indexOf('52枚') >= 0) bad52++; }
      if (r.won) w++;
      if (r.stuck) st++;
      if (r.capped) capped++;
      mv.push(r.moves); tk.push(r.takes); left.push(r.left);
    }
    var out = {
      '試合数': n,
      '★エラー': errs.length,
      '★札が52枚でなかった試合': bad52,
      '★詰み（1手もない所まで行った）': st + ' (' + (st / n * 100).toFixed(1) + '%)',
      '先を読まない打ち方での勝ち': w + ' (' + (w / n * 100).toFixed(1) + '%)',
      '手数（中央値／最大）': median(mv) + '手 ／ ' + Math.max.apply(null, mv) + '手',
      '　うち 札を取る手（中央値）': median(tk) + '回',
      '残った場の札（中央値）': median(left) + '枚',
      '手数の上限で打ち切り': capped,
      'かかった時間': ((Date.now() - t0) / 1000).toFixed(1) + '秒'
    };
    if (errs.length) out['エラーの中身'] = errs.slice(0, 5);
    console.log('[PYRAMID] autoPlay', out);
    return out;
  }

  /* 一覧の 配りが 本当に クリアできるか、その場で 解いて 流しこんで たしかめる */
  function verify(n) {
    n = n || 20;
    var ok = 0, ng = [], t0 = Date.now(), lens = [];
    for (var i = 0; i < n && i < DEAL_LIST.length; i++) {
      var seed = DEAL_LIST[i], r = solve(makeDeal(seed), { ms: 4000, nodes: 300000 });
      if (!r.ok) { ng.push(seed + '（解けなかった）'); continue; }
      var v = replay(seed, r.moves);
      if (v.ok) { ok++; lens.push(r.moves.length); } else ng.push(seed + '（' + v.why + '）');
    }
    var out = {
      '調べた': Math.min(n, DEAL_LIST.length), '★クリアできた': ok, '★できなかった': ng.length,
      '勝ち筋の手数（中央値）': median(lens) + '手',
      'かかった時間': ((Date.now() - t0) / 1000).toFixed(1) + '秒'
    };
    if (ng.length) out['中身'] = ng.slice(0, 10);
    console.log('[PYRAMID] verify', out);
    return out;
  }

  /* ★★ 検証6：取れる札が いつも 全部 見えているか ★★
     ------------------------------------------------------------
     ★確かめ方：n 試合を 先を読まない 打ち方で 通し、**1手ごとに**
       「取れる札の 四角」と「その札より 手前に 描かれる ほかの札の 四角」の
       重なりを 全部 数える。1pxでも 重なったら 違反。
     ★ 同じ段は 重ねない（S ＝ はば＋すきま）ので 横は 必ず すきま 2px 空く。
       下の段は V ＝ 高さ÷2 だけ 下だが、取れる札の 子は 消えている。
       → 理屈では 0。それを 実際の 座標で 数え直す。 */
  function visible(n) {
    n = n || 200;
    var bad = 0, checks = 0, states = 0, worst = 0, i, j, k;
    function rect(g, kk) { return { x: slotX(kk), y: slotY(kk) }; }
    for (i = 0; i < n; i++) {
      var seed = DEAL_LIST.length ? DEAL_LIST[i % DEAL_LIST.length] : (i + 1);
      var g = makeDeal(seed);
      for (var t = 0; t < 400; t++) {
        states++;
        var free = freeList(g);
        for (j = 0; j < free.length; j++) {
          var a = rect(g, free[j]), az = ROW[free[j]];
          for (k = 0; k < 28; k++) {
            if (k === free[j] || !(g.mask & (1 << k))) continue;
            if (ROW[k] <= az) continue;                     // 手前に 描かれるのは 下の段だけ
            var b = rect(g, k);
            var ow = Math.min(a.x + geo.cw, b.x + geo.cw) - Math.max(a.x, b.x);
            var oh = Math.min(a.y + geo.ch, b.y + geo.ch) - Math.max(a.y, b.y);
            checks++;
            if (ow > 0 && oh > 0) { bad++; if (ow * oh > worst) worst = ow * oh; }
          }
        }
        if (isWin(g)) break;
        var m = greedyMove(g);
        if (!m) break;
        doMove(g, m);
      }
    }
    var out = {
      '調べた試合': n, '調べた場面': states, '調べた組み合わせ': checks,
      '★取れる札が 隠れていた回数': bad,
      '一番大きかった 重なり': worst + 'px²',
      '札の大きさ': geo.cw + '×' + geo.ch + 'px（列の間 ' + geo.gap + '／段の落差 ' + geo.v + '）'
    };
    console.log('[PYRAMID] visible', out);
    return out;
  }

  function screenInfo() {
    var inb = boardIn.getBoundingClientRect(), lowest = 0, rightmost = 0, i, b;
    for (i = 0; i < 52; i++) {
      b = cardEl[i].getBoundingClientRect();
      if (cardEl[i].classList.contains('is-out')) continue;
      if (b.bottom > lowest) lowest = b.bottom;
      if (b.right > rightmost) rightmost = b.right;
    }
    return {
      画面: window.innerWidth + '×' + window.innerHeight,
      器の中身: Math.round(inb.width) + '×' + Math.round(inb.height),
      札: geo.cw + '×' + geo.ch + 'px',
      列の間: geo.gap + 'px', 段の落差: geo.v + 'px',
      ピラミッド: geo.pyrW + '×' + geo.pyrH + 'px',
      つかむ的: (geo.cw * geo.ch).toLocaleString() + 'px²',
      落とす先: '±' + ((geo.cw + geo.gap) / 2).toFixed(1) + 'px',
      はみ出し下: Math.round(lowest - inb.bottom) + 'px（0以下ならOK）',
      はみ出し右: Math.round(rightmost - inb.right) + 'px（0以下ならOK）',
      ページ縦スクロール: document.documentElement.scrollHeight > window.innerHeight,
      ページ横スクロール: document.documentElement.scrollWidth > window.innerWidth
    };
  }

  window.PYRAMID = {
    now: function () {
      if (!G) return { 場面: 'まだ 始めていない', クリアできる配りの数: DEAL_LIST.length };
      var rows = [], k = 0, r, i, line;
      for (r = 0; r < 7; r++) {
        line = [];
        for (i = 0; i <= r; i++, k++) {
          line.push((G.mask & (1 << k)) ? (RANKS[rankOf(G.pyr[k])] + (isFree(G, k) ? '*' : '')) : '・');
        }
        rows.push((r + 1) + '段：' + line.join(' '));
      }
      var wt = wasteTop(G);
      return {
        配りの番号: G.seed,
        ピラミッド: rows,
        '（*は 取れる札）': pyrLeft(G) + '枚 のこり',
        山札: stockLeft(G) + '枚（' + (TUNE.PASSES - G.pass) + '周 使える）',
        めくった札: wasteLeft(G) + '枚' + (wt >= 0 ? '（一番上 ' + nameOf(G.stock[wt]) + '）' : ''),
        手数: G.hist.length + '手',
        もどせる回数: G.hist.length + '回',
        札の合計: countAll(G) + '枚',
        勝敗: isWin(G) ? '勝ち' : (isStuck(G) ? '止まった' : '進行中'),
        札の大きさ: geo.cw + '×' + geo.ch + 'px'
      };
    },
    autoPlay: autoPlay,
    verify: verify,
    visible: visible,
    screen: screenInfo,
    seed: function (n) {
      if (n == null) return G ? G.seed : null;
      cancelAll();
      G = makeDeal(n >>> 0); half = false;
      showBoard();
      say('この配り、ちゃんと クリアできるよ！');
      return G.seed;
    },
    solve: function (ms) {
      if (!G) return null;
      var r = solve(makeDeal(G.seed), { ms: ms || 4000, nodes: 300000 });
      var out = { 配りの番号: G.seed, クリアできる: r.ok, 不明: r.unknown, 手数: r.ok ? r.moves.length : null, 調べた数: r.nodes, 時間: r.ms + 'ms' };
      if (r.ok) out['流しこんで勝てるか'] = replay(G.seed, r.moves).ok;
      console.log('[PYRAMID] solve', out);
      return out;
    },
    deals: function () { return { 数: DEAL_LIST.length, 先頭10: DEAL_LIST.slice(0, 10) }; },
    geo: function () { return geo; },

    /* ★ 勝つ 直前（場に あと left枚）を 出す ―― たしかめ 専用。
       ★ 本物の 配りの 勝ち筋を 途中まで 流しこむ ので、
         出てくる 場面は 本当の 遊びで 起きる 場面。 */
    nearWin: function (left) {
      left = left == null ? 2 : Math.max(1, Math.min(28, left));
      var seed = DEAL_LIST.length ? DEAL_LIST[0] : 1;
      var r = solve(makeDeal(seed), { ms: 4000, nodes: 300000 });
      if (!r.ok) return { だめ: '解けなかった' };
      cancelAll();
      G = makeDeal(seed); half = true;
      for (var i = 0; i < r.moves.length; i++) {
        if (pyrLeft(G) <= left) break;
        doMove(G, r.moves[i]);
      }
      showBoard();
      say('たしかめ用：あと ' + pyrLeft(G) + '枚');
      return { 配りの番号: seed, 場に残り: pyrLeft(G) + '枚', 手数: G.hist.length + '手', のこりの手順: r.moves.length - G.hist.length + '手' };
    },

    /* ★ 本当に 1手も ない 場面（詰み）を 出す ―― たしかめ 専用。
       ★ 先を読まない 打ち方で 実際に 詰んだ 試合を そのまま 再現する
         （作り物では ない ―― 48.3% で 出る 本物の 場面）。 */
    stuckDemo: function () {
      var seed = 0, found = false, i;
      for (i = 0; i < DEAL_LIST.length && i < 300; i++) {
        var t = makeDeal(DEAL_LIST[i]);
        for (var s = 0; s < 400; s++) {
          if (isWin(t)) break;
          var m = greedyMove(t);
          if (!m) break;
          doMove(t, m);
        }
        if (isStuck(t)) { seed = DEAL_LIST[i]; found = true; break; }
      }
      if (!found) return { だめ: '詰む配りが 見つからなかった' };
      cancelAll();
      G = makeDeal(seed); half = true;
      for (var s2 = 0; s2 < 400; s2++) {
        if (isWin(G)) break;
        var m2 = greedyMove(G);
        if (!m2) break;
        doMove(G, m2);
      }
      showBoard();
      var stuck = isStuck(G);
      if (stuck) showResult('stop');
      return { 配りの番号: seed, 詰みと判定した: stuck, 場に残り: pyrLeft(G) + '枚', もどせる回数: G.hist.length + '回' };
    },
    core: CORE
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
