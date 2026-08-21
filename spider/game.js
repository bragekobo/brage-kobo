/* ============================================================
   スパイダーソリティア（8本目）― T71・コーダ
   ------------------------------------------------------------
   仕様は logs/T70_スパイダー_仕様_ルル.md ＋ 社長の裁定（2026-08-20）が 正。

   社長の裁定（4つ・厳守）：
     1  ★作る（ルルの推しと 逆。社長の 判断）
     1b スマホも 捨てない。両方 出す。「パソコン向け」の 印は アイが つける
        → ★ゲームの 中に「スマホだと 小さいよ」の 言い訳は 1文字も 書かない
     3  難しさ 3段階を えらばせる。**初期値は やさしい（♠ だけ）**
     4  ★「この配り、ちゃんと クリアできるよ」は **言わない**
        → 保証を 作らないので、言ったら うそに なる（仕様 §6-5）
        → 「まだ いけるよ！」も だめ。★ハッピーの せりふ 5つは §8-3 のまま

   ★ ソリティア（7本目）から 何を 持ってきたか ―― **切り出さずに 写した**
     ------------------------------------------------------------
     理由：共通部品に できる 中身が ほとんど 無い。
       ・つまんで 運ぶ 200行は「どの札が つかめるか」「どこへ 置けるか」で
         できていて、その 2つが **ルールそのもの**（クロンダイクと スパイダーで 別物）。
         残る「指を 追いかける 20行」だけを 外に 出しても、両方から 呼ぶには
         公開ずみの solitaire/game.js を 書きかえる ことに なる ―― それは 禁止。
       ・本当に 中身が 同じなのは mulberry32（15行・世に 出ている 決まった 式）と
         札の 絵の 読み込み（2行）だけ。この 2つの ために 3本目の ファイルを
         作ると、置き場所が 増える ぶん かえって 追いにくく なる。
     → だから ここで 写したのは **コードでは なく 作り（かたち）**：
       ①「中身（CORE）と 画面（UI）を 分ける」
       ②「札を 動かす 入口は applyMove ただ1つ」
       ③「寸法は 大きい方から 1pxずつ 下げて さがす」
       ④「結果の 箱の 連打よけ」⑤「札が 降る」⑥「難しさの プルダウン」
       中身は スパイダーの ルールで 書き直して ある。
     ★ 2重管理に なるのは mulberry32 だけ。これは 式が 変わらない ので、
       ズレようが ない（変えたら 配りが 変わる ＝ 変える 理由が 無い）。

   ★ 札を 動かす 入口は applyMove() ただ1つ（ソリティアの 一番の 資産）
     列→列・山札から 配る ―― 全部 ここを 通る。そろった 13枚を 消すのも ここ。
     だから「もどす」は 1つの 逆手順だけで 効く。入口を 増やさない こと。

   ⚠️ poker-core.js は 使わない。外部の ライブラリ・フォント・画像は 0。外への 通信も 0。
   ============================================================ */
(function (root) {
  'use strict';

  /* ============================================================
     ★ 数字（TUNE）― 調整する 数字は ここ 1か所だけ
     ============================================================ */
  var TUNE = {
    /* 見た目の 時間 */
    MOVE:        180,   // 札が すべって 動く 時間
    CLEAR_WAIT:  240,   // 13枚 そろって から 上へ 飛ぶまでの 間

    /* つまんで 運ぶ（T67・T69 の 決めごとを そのまま） */
    DRAG_SLOP:     7,   // これだけ 動いたら「運んでいる」
    LIFT:         30,   // つかんだ 札を 指より 上へ ずらす 量

    /* 札が 降る 演出（104枚 なので 1枚あたりの 間かくは ソリティアの 半分） */
    FALL_WAIT:   300,
    FALL_STEP:    20,
    FALL_MAX:   6000,   // 6秒で かってに 止まる（誰も 閉じこめない）

    /* 結果の 箱の 連打よけ（T62の 事故を くり返さない） */
    RESULT_LOCK: 600,
    RESULT_QUIET: 250,

    /* ★★ 寸法（仕様 §1）★★ ―― ばらまかない こと
       MAX_COL … 1列の 枚数の 見こみ。★ここが パソコンの 札の 大きさを 決める。
                 ここを 下げると 札は 大きく なり、上げると 小さく なる。
                 ★T72・かつみ社長の 裁定（社長の 言葉を そのまま 残す。後から 消さない こと）：
                   「ありえないくらい トランプを 重ねられたら 画面から 見切れちゃって いいよ。
                     見切れる＝上限 って ことで いいと 思う。
                     そして それは いちいち プレイヤーに 伝える 必要は ないです。」
                 → だから **30枚が 入るように 全員の 札を 小さくするのは やめた**。
                   見こみを 24枚に して、札を 大きく する（30→24 で 札は 約1.25倍）。
                 → 24枚を こえた ときの 受け止め方は 2段がまえ。★順番が 大事：
                   ① まず その列 **だけ** 重なりを つめて 吸収する（render() の colStep）。
                      静かに おさまる ので、社長の「伝えなくて いい」を いちばん きれいに 満たす。
                      他の 列は 1mmも 変わらない。★この しくみを 消さない こと。
                   ② つめきれなく なったら（重なりが 最小 2px に なったら）、そこから先は
                      **上から 見切れる**。★見切れるのは 必ず「上」―― 列の 一番下は
                      いつでも 画面に 残す。理由：スパイダーで 人が さわるのは 一番下の 札。
                      下が 見切れたら その列は 一生 さわれず ゲームが 止まる（＝詰み）。
                      上は もう 重なって 埋まって いる 側なので、切れても 遊びは 1手も 止まらない。
                   ★ ①②とも 画面には 何も 出さない（注意書き・印・メッセージを 1つも 足さない）。
                   ★ ページに スクロールは ぜったいに 出さない（社長の 一番の 要望）。
                      「見切れる」＝ 盤の 外に 隠れる ことで あって、スクロールバーが 出る ことでは ない。
       ★ 実際に 数えた 値（自動プレイ・手番ごと）：
           中央値 19〜21枚 ／ 95% 24〜28枚 ／ 99% 28〜32枚 ／ 最大 40枚 */
    MAX_COL:      24,
    CARD_MAX:     85,   // 札の はばの 上限
    OVER_UP:    0.25,   // 表向きの 重なり（★最小。隅の 数字が 見える 最小）
    OVER_UP_MAX: 0.40,  // ★たてが 余る 画面（375px）では ここまで 帯を 広げる（仕様 §1-2）
    OVER_DOWN:  0.12,   // 裏向きの 重なり
    RATIO: 635 / 419    // 支給画像 419×635 の ひりつ。★ぜったいに くずさない
  };

  /* ============================================================
     カード（設計図 §9・厳守）
     ------------------------------------------------------------
     ★ 札の 見分けは「絵」では なく **通し番号 0〜103**（仕様 §4）。
       スパイダーは 同じ 絵の 札を 2枚（やさしいなら 8枚）使う。
       絵が 同じ 2枚を、プログラムは 必ず 別物として 扱う。
     ★ 絵は 難しさで 決まる：
         rank = c % 13                       （0 が A、12 が K）
         suit = そのレベルの ♠♥♦♣ を 順ぐりに
       やさしい  … ♠ だけ         → 13種類の 絵を 8枚ずつ
       ふつう    … ♠♥           → 26種類の 絵を 4枚ずつ
       むずかしい… ♠♥♦♣         → 52種類の 絵を 2枚ずつ（本物）
     ★ 同じ 絵が 2枚 ならんで 見える 場面は 必ず 起きる。**それが 正しい 姿**。
       バグでは ないので 直さない こと（仕様 §4）。
     ============================================================ */
  var SUITS = ['スペード', 'ハート', 'ダイヤ', 'クローバー'];
  var MARKS = ['♠', '♥', '♦', '♣'];
  var RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  /* 難しさ 3段階（仕様 §5-2）。画面には 数字も 専門用語も 出さない。 */
  var LEVELS = [
    { label: 'やさしい',   suits: [0] },
    { label: 'ふつう',     suits: [0, 1] },
    { label: 'むずかしい', suits: [0, 1, 2, 3] }
  ];

  function rankOf(c) { return c % 13; }
  function suitOf(g, c) { var s = LEVELS[g.lv].suits; return s[((c / 13) | 0) % s.length]; }
  function faceOf(g, c) { return suitOf(g, c) * 13 + rankOf(c); }   // 絵（同じ絵は 同じ数）
  function nameOf(g, c) { return SUITS[suitOf(g, c)] + RANKS[rankOf(c)]; }

  /* ============================================================
     ★ 種から 動く 乱数（mulberry32）
     ------------------------------------------------------------
     ソリティアと **同じ式**（世に 出ている 決まった 式）。
     番号から 同じ 配りを 作れる ので、たしかめ・数える 道具が 成り立つ。
     ============================================================ */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ★ 配る（仕様 §7-1）
     場札 10列。左の 4列が 6枚、右の 6列が 5枚 ＝ 54枚。各列の 一番上だけ 表向き。
     残り 50枚が 山札 ―― 5回に 分けて、全列に 1枚ずつ 配る。 */
  function makeDeal(seed, lv) {
    lv = (lv >= 0 && lv < LEVELS.length) ? lv : 0;
    var rnd = mulberry32(seed >>> 0);
    var deck = [], i, j, t;
    for (i = 0; i < 104; i++) deck.push(i);
    for (i = 103; i > 0; i--) {                 // Fisher–Yates（向き・回数を 変えない）
      j = Math.floor(rnd() * (i + 1));
      t = deck[i]; deck[i] = deck[j]; deck[j] = t;
    }
    var g = {
      seed: seed >>> 0, lv: lv,
      tab: [], stock: [], found: [], dealsLeft: 5,
      hist: [], moves: 0, over: false, won: false
    };
    for (i = 0; i < 10; i++) g.tab.push({ down: [], up: [] });
    var p = 0;
    for (i = 0; i < 10; i++) {
      var cnt = i < 4 ? 6 : 5;
      for (j = 0; j < cnt; j++) g.tab[i].down.push(deck[p++]);
    }
    for (i = 0; i < 10; i++) g.tab[i].up.push(g.tab[i].down.pop());
    g.stock = deck.slice(54);                   // 50枚
    return g;
  }

  /* ============================================================
     ★ ルール（仕様 §7-4 の 9個。1つも 削らない）
     ------------------------------------------------------------
       1 数字が 1つ小さければ ♠♥♦♣ に 関係なく 重ねられる  → canStack
       2 ★まとめて 動かせるのは ♠♥♦♣ が 同じで 続く 並びだけ → runLen
       3 空いた列には どの札・どの並びでも 置ける           → legalMoves
       4 同じ ♠♥♦♣ で K→A の 13枚が そろうと 自動で 消える  → takeSet
       5 山札は 全列に 1枚ずつ・5回だけ                     → applyMove の 'D'
       6 ★空の列が あるときは 配れない                      → canDeal
       7 裏向きの札は 上が 空いたら 自動で 表に なる         → flipUp
       8 消えた組は 戻せない                                 → found に 入れたら 出さない
       9 もどす 無制限                                       → undoMove
     ============================================================ */
  function canStack(card, onto) { return rankOf(card) === rankOf(onto) - 1; }

  /* ★ 列の 一番下から 何枚が「まとめて 動かせる 並び」か
     （♠♥♦♣ が 同じ ＋ 数字が 1つずつ 小さい）*/
  function runLen(g, col) {
    var u = col.up, n = u.length;
    if (!n) return 0;
    var r = 1;
    while (r < n) {
      var a = u[n - r - 1], b = u[n - r];
      if (rankOf(a) === rankOf(b) + 1 && suitOf(g, a) === suitOf(g, b)) r++;
      else break;
    }
    return r;
  }

  function flipUp(col) {
    if (col.up.length === 0 && col.down.length) { col.up.push(col.down.pop()); return true; }
    return false;
  }
  function downCount(g) {
    var n = 0; for (var i = 0; i < 10; i++) n += g.tab[i].down.length; return n;
  }
  function hasEmpty(g) {
    for (var i = 0; i < 10; i++) if (!g.tab[i].up.length) return true;
    return false;
  }
  /* ★ ルール6：空の列が 1つでも あると 配れない */
  function canDeal(g) { return g.dealsLeft > 0 && !hasEmpty(g); }
  function isWin(g) { return g.found.length === 8; }

  /* ★ 札は いつでも 104枚（たしかめ用）*/
  function countAll(g) {
    var n = g.stock.length + g.found.length * 13;
    for (var i = 0; i < 10; i++) n += g.tab[i].down.length + g.tab[i].up.length;
    return n;
  }
  function maxColLen(g) {
    var m = 0;
    for (var i = 0; i < 10; i++) {
      var L = g.tab[i].down.length + g.tab[i].up.length;
      if (L > m) m = L;
    }
    return m;
  }

  /* ============================================================
     ★ 手（move）― 札を 動かす 入口は applyMove ただ1つ
     ------------------------------------------------------------
       {k:'TT', from, n, to}   場札 → 場札（n枚 まとめて）
       {k:'D'}                 山札を おす（全列に 1枚ずつ）
     そろった 13枚を 消すのも、裏を 表に するのも、全部 この 中で 起きる。
     ============================================================ */

  /* そろった 13枚を 見つけて 消す（ルール4）。消えた ことは rec に 残す。*/
  function takeSet(g, rec, j) {
    var col = g.tab[j], u = col.up, L = u.length;
    if (L < 13) return false;
    var head = u[L - 13];
    if (rankOf(head) !== 12) return false;                 // 一番下が K でなければ ちがう
    var s = suitOf(g, head), k;
    for (k = 1; k < 13; k++) {
      var a = u[L - 13 + k];
      if (rankOf(a) !== 12 - k || suitOf(g, a) !== s) return false;
    }
    var cards = u.splice(L - 13, 13);
    var f = flipUp(col);
    g.found.push({ suit: s, cards: cards, col: j });
    rec.done.push({ col: j, cards: cards, flip: f });
    return true;
  }
  /* 1つの 列で 2組 そろう ことも ありうる ので、無くなるまで まわす。 */
  function collect(g, rec, cols) {
    var again = true;
    while (again) {
      again = false;
      for (var i = 0; i < cols.length; i++) if (takeSet(g, rec, cols[i])) again = true;
    }
  }

  function applyMove(g, mv, opt) {
    var rec = { k: mv.k, mv: mv, flip: -1, done: [] };
    var col, to, i, moved;
    switch (mv.k) {
      case 'TT':
        col = g.tab[mv.from]; to = g.tab[mv.to];
        moved = col.up.splice(col.up.length - mv.n, mv.n);
        for (i = 0; i < moved.length; i++) to.up.push(moved[i]);
        if (flipUp(col)) rec.flip = mv.from;
        /* ★ 消えるかを 見るのは 置いた先 だけで よい。
           取り去った 側は 新しく そろわない ―― A（いちばん 小さい）の 上には
           何も 置けない ので、K→A の 13枚は 必ず 列の 一番下に あり、
           そろった 瞬間に ここで 消える。うまって いる ことが ありえない。 */
        collect(g, rec, [mv.to]);
        break;
      case 'D':
        for (i = 0; i < 10; i++) g.tab[i].up.push(g.stock.pop());
        g.dealsLeft--;
        collect(g, rec, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        break;
    }
    g.moves++;
    if (!opt || opt.hist !== false) g.hist.push(rec);
    return rec;
  }

  /* ★ もどす（無制限・ルール9）。逆の 手順を 1つだけ 書く。
     消えた 組を 先に 戻して から、元の 手を 戻す（順番が 命）。 */
  function undoMove(g) {
    var rec = g.hist.pop();
    if (!rec) return false;
    var mv = rec.mv, col, to, i, k, d, back;

    for (i = rec.done.length - 1; i >= 0; i--) {
      d = rec.done[i]; col = g.tab[d.col];
      if (d.flip) col.down.push(col.up.pop());
      for (k = 0; k < 13; k++) col.up.push(d.cards[k]);
      g.found.pop();
    }
    switch (rec.k) {
      case 'TT':
        col = g.tab[mv.from]; to = g.tab[mv.to];
        if (rec.flip >= 0) col.down.push(col.up.pop());
        back = to.up.splice(to.up.length - mv.n, mv.n);
        for (i = 0; i < back.length; i++) col.up.push(back[i]);
        break;
      case 'D':
        for (i = 9; i >= 0; i--) g.stock.push(g.tab[i].up.pop());   // 配った 逆順に 戻す
        g.dealsLeft++;
        break;
    }
    g.moves--;
    return true;
  }
  function doMove(g, mv, opt) { return applyMove(g, mv, opt); }

  /* ============================================================
     ★ 出せる手を 全部 数える
       o.draw === false … 山札を おす 手を 入れない（詰み判定・解く道具で 使う）
     ============================================================ */
  function legalMoves(g, o) {
    o = o || {};
    var out = [], i, j, m, col, t, c, L, R;
    for (i = 0; i < 10; i++) {
      col = g.tab[i]; L = col.up.length;
      if (!L) continue;
      R = runLen(g, col);
      for (m = 1; m <= R; m++) {
        c = col.up[L - m];                                  // 動かす かたまりの 頭
        for (j = 0; j < 10; j++) {
          if (j === i) continue;
          t = g.tab[j];
          if (t.up.length) {
            if (canStack(c, t.up[t.up.length - 1])) out.push({ k: 'TT', from: i, n: m, to: j });
          } else {
            /* 空の列（up が 空 ＝ down も 空。裏は 自動で 表に なる ため）*/
            if (m === L && col.down.length === 0) continue;  // 列まるごと → 空の列 は 何も 変わらない
            out.push({ k: 'TT', from: i, n: m, to: j });
          }
        }
      }
    }
    if (o.draw !== false && canDeal(g)) out.push({ k: 'D' });
    return out;
  }

  function hasPlay(g) { return legalMoves(g, { draw: false }).length > 0; }

  /* ============================================================
     ★ 詰みの 判定（仕様 §7-5）
     ------------------------------------------------------------
       ① 場札どうしで 動かせる手が 1つもない
       ② 山札が 0回、または ★空の列が あって 配れない
     ⚠️ 「空の列が あって 配れない」だけでは 詰みでは ない。
        空の列を 埋めれば 配れる ので、①に「空の列に 何かを 置く手」が
        残っていれば 詰みでは ない ―― ①が 先に 効くので、この 順で 正しい。
     ⚠️ ゲームは「もう 勝てない」とは ぜったいに 言わない。
        言うのは「1手も ない」ときだけ。見こみの 判断は 人に まかせる。
     ============================================================ */
  function isStuck(g) {
    if (isWin(g)) return false;
    if (hasPlay(g)) return false;
    return !canDeal(g);
  }

  function cloneState(g) {
    var t = {
      seed: g.seed, lv: g.lv, tab: [], stock: g.stock.slice(),
      found: g.found.slice(), dealsLeft: g.dealsLeft,
      hist: [], moves: g.moves, over: false, won: false
    };
    for (var i = 0; i < 10; i++) t.tab.push({ down: g.tab[i].down.slice(), up: g.tab[i].up.slice() });
    return t;
  }

  /* ★ 同じ 場面か どうかの 見分け
     ・列の 並び順は 意味が 無い ので そろえて から つなぐ
     ・裏向きの札は 一度も 並べかえられない ので 枚数だけで よい
     ・★ 同じ 絵の 札は 入れかえても 同じ 場面 ―― 番号では なく **絵**で 数える
       （ここを 番号で 見ると、同じ 場面を 何度も 調べて 解く道具が 止まらない）*/
  function stateKey(g) {
    var a = [], i, u, k, s;
    for (i = 0; i < 10; i++) {
      u = g.tab[i].up; s = '';
      for (k = 0; k < u.length; k++) s += (k ? ',' : '') + faceOf(g, u[k]);
      a.push(g.tab[i].down.length + '.' + s);
    }
    a.sort();
    return a.join('|') + '#' + g.dealsLeft + '#' + g.found.length;
  }

  /* ============================================================
     ★★ 解く道具（solver）― 仕様 §6 / §9-1 の 1番
     ------------------------------------------------------------
     ★ 何のために 作ったか（ここが ソリティアと ちがう）
       ソリティアでは「必ず クリアできる 配りだけを 配る」ために 使った。
       スパイダーでは **社長の 裁定4で 保証を あきらめた** ので、
       これは **§6 の 見立てを 数字で 裏取りする ため だけ**の 道具。
       ＝ 遊ぶ ときは 1回も 動かない。ゲームは これに 寄りかかって いない。
     ============================================================ */
  function solve(g, opts) {
    opts = opts || {};
    var limitMs = opts.ms == null ? 2000 : opts.ms;
    var maxNodes = opts.nodes == null ? 400000 : opts.nodes;
    /* ★ 深さの 上限（ソリティアには 要らなかった もの）
       スパイダーの 手順は 何百手にも なる ので、上限を つけないと
       ブラウザ・Node の 呼び出しの 深さを こえて その場で 落ちる（実際に 落ちた）。
       ★これ自体が §6「けた違いに 重い」の 証拠の 1つ。 */
    var maxDepth = opts.depth == null ? 1200 : opts.depth;
    var t0 = Date.now(), nodes = 0, cut = false, deep = false, depth = 0;
    var seen = new Set();
    var st = cloneState(g), path = [];

    function score(s, m) {
      var from = s.tab[m.from], to = s.tab[m.to];
      var head = from.up[from.up.length - m.n];
      var sc = 10;
      if (!to.up.length) sc = 20;                                    // 空の列は 使いすぎない
      else {
        var top = to.up[to.up.length - 1];
        sc = (suitOf(s, top) === suitOf(s, head)) ? 70 : 30;         // 同じ ♠♥♦♣ に つなぐ ほうが 得
      }
      if (m.n === from.up.length) sc += from.down.length ? 60 : 25;  // 裏を めくる／列を 空ける
      return sc;
    }

    function dfs() {
      if (nodes >= maxNodes || Date.now() - t0 > limitMs) { cut = true; return false; }
      nodes++;
      if (isWin(st)) return true;
      /* ★ 深さの 打ち切りは **その枝だけ** ―― 全体を 止めない
         （止めると 1本 もぐった だけで 探索が 終わって しまう。実際に そうなった）*/
      if (depth >= maxDepth) { deep = true; return false; }
      var key = stateKey(st);
      if (seen.has(key)) return false;
      seen.add(key);

      var mvs = legalMoves(st, { draw: false }), kids = [], i;
      for (i = 0; i < mvs.length; i++) kids.push({ m: mvs[i], sc: score(st, mvs[i]) });
      kids.sort(function (a, b) { return b.sc - a.sc; });
      if (canDeal(st)) kids.push({ m: { k: 'D' }, sc: 0 });          // 配るのは 最後の 手段

      for (i = 0; i < kids.length; i++) {
        doMove(st, kids[i].m); path.push(kids[i].m); depth++;
        var got = dfs();
        depth--;
        if (got) return true;
        undoMove(st); path.pop();
        if (cut) break;
      }
      return false;
    }

    var won = dfs();
    return {
      ok: won, unknown: !won && (cut || deep),
      moves: won ? path.slice() : null,
      nodes: nodes, ms: Date.now() - t0, cut: cut, deep: deep
    };
  }

  /* ★ 見つけた 手順を 本当に ゲームに 流しこんで 勝てるか たしかめる */
  function replay(seed, lv, moves) {
    var g = makeDeal(seed, lv);
    for (var i = 0; i < moves.length; i++) {
      var legal = legalMoves(g), ok = false, m = moves[i], j;
      for (j = 0; j < legal.length; j++) {
        var L = legal[j];
        if (L.k !== m.k) continue;
        if (m.k === 'TT' && (L.from !== m.from || L.n !== m.n || L.to !== m.to)) continue;
        ok = true; break;
      }
      if (!ok) return { ok: false, at: i, why: '合法でない手' };
      doMove(g, m);
      if (countAll(g) !== 104) return { ok: false, at: i, why: '札が104枚でない' };
    }
    return { ok: isWin(g), at: moves.length, why: isWin(g) ? '' : '勝てていない' };
  }

  /* ============================================================
     ★ 自動プレイ（数える 道具・仕様 §9-1）
     ------------------------------------------------------------
     人らしい 打ち方（先を 読まない・目の前の 得だけ 取る）で 1試合を まわす。
     ★ここで 出た 数字だけを 報告に 書く ―― 形容詞で 片づけない（§9-0の 反省）。
     ============================================================ */
  function scoredMoves(g) {
    var mvs = legalMoves(g, { draw: false }), out = [], i;
    for (i = 0; i < mvs.length; i++) {
      var m = mvs[i], sc = 0;
      var from = g.tab[m.from], to = g.tab[m.to];
      var head = from.up[from.up.length - m.n];
      var whole = (m.n === from.up.length);

      if (!to.up.length) {
        /* 空の列へ ―― かたまりが 大きいほど 得（ばらけた 札を 片づける）*/
        sc = whole && !from.down.length ? 5 : 20 + m.n;
      } else {
        var top = to.up[to.up.length - 1];
        sc = (suitOf(g, top) === suitOf(g, head)) ? 60 + m.n : 25 + m.n;
      }
      if (whole && from.down.length) sc += 60;      // 裏を めくれる ―― いちばん 得
      else if (whole && !from.down.length) sc += 15;// 列を 空けられる
      out.push({ m: m, sc: sc });
    }
    out.sort(function (a, b) { return b.sc - a.sc; });
    return out;
  }

  /* ★ 1試合 まわして 数える。
     ⚠️ 同じ 場面に 戻る 手は 打たない（seen）。これが 無いと
        「A列を B列へ、B列を A列へ」を 一生 くり返して 数が 取れない。 */
  function playOne(seed, lv, cap, absorb) {
    cap = cap || 3000;
    /* ★T72で 数える もの：
         overPos … その手番で 1列でも MAX_COL（24枚）を こえて いた 回数（＝①が 働く 場面）
         clipPos … その手番で 1列でも「つめきれない」長さ（absorb枚）を こえて いた 回数
                   （＝②の 見切れが 実際に 起きる 場面）
       ★「試合あたり」では なく「手番あたり」で 数える（社長の 指示）。 */
    absorb = absorb || 9999;
    var g = makeDeal(seed, lv), i, err = null, maxCol = maxColLen(g);
    var start = legalMoves(g, { draw: false }).length === 0;
    var firstSet = -1, blockedPos = 0, blockedDead = 0, positions = 0;
    var overPos = 0, clipPos = 0;
    var seen = new Set(); seen.add(stateKey(g));

    for (i = 0; i < cap; i++) {
      if (isWin(g)) break;
      positions++;
      var mcNow = maxColLen(g);
      if (mcNow > TUNE.MAX_COL) overPos++;
      if (mcNow > absorb) clipPos++;
      /* ★数える⑦：いま 山札を おしても 配れない 場面か
         （山札は 残っているのに、空の列が あるので 配れない）*/
      if (g.dealsLeft > 0 && hasEmpty(g)) blockedPos++;

      var cand = scoredMoves(g), acted = false;
      for (var ci = 0; ci < cand.length; ci++) {
        doMove(g, cand[ci].m);
        var key = stateKey(g);
        if (seen.has(key)) { undoMove(g); continue; }
        seen.add(key); acted = true;
        break;
      }
      if (!acted) {
        if (!canDeal(g)) {
          if (g.dealsLeft > 0) blockedDead++;      // ★手も無い・空の列で 配れない
          break;
        }
        doMove(g, { k: 'D' });
        var k2 = stateKey(g);
        if (seen.has(k2)) break;
        seen.add(k2);
      }
      if (firstSet < 0 && g.found.length > 0) firstSet = g.moves;
      if (countAll(g) !== 104) { err = '札が104枚でない（' + countAll(g) + '枚）'; break; }
      var mc = maxColLen(g); if (mc > maxCol) maxCol = mc;
    }
    return {
      seed: seed, lv: lv, won: isWin(g), stuck: !isWin(g) && isStuck(g),
      moves: g.moves, sets: g.found.length, maxCol: maxCol, err: err,
      capped: i >= cap, firstSet: firstSet, deadStart: start,
      blockedPos: blockedPos, blockedDead: blockedDead, positions: positions,
      overPos: overPos, clipPos: clipPos
    };
  }

  /* ============================================================
     CORE を 外に 出す（Node からも ブラウザからも 同じ 中身）
     ============================================================ */
  var CORE = {
    TUNE: TUNE, SUITS: SUITS, MARKS: MARKS, RANKS: RANKS, LEVELS: LEVELS,
    rankOf: rankOf, suitOf: suitOf, faceOf: faceOf, nameOf: nameOf,
    mulberry32: mulberry32, makeDeal: makeDeal,
    canStack: canStack, runLen: runLen, canDeal: canDeal, hasEmpty: hasEmpty,
    legalMoves: legalMoves, applyMove: applyMove, doMove: doMove, undoMove: undoMove,
    isWin: isWin, isStuck: isStuck, hasPlay: hasPlay, downCount: downCount,
    countAll: countAll, maxColLen: maxColLen, cloneState: cloneState, stateKey: stateKey,
    solve: solve, replay: replay, playOne: playOne
  };
  root.SPIDER_CORE = CORE;
  if (typeof module === 'object' && module.exports) module.exports = CORE;

  /* ★ Node（画面が ない ところ）では ここで おしまい。
     ここから下は 1行も 動かない ―― だから 数える 道具と ゲームは ズレようが ない。 */
  if (typeof document === 'undefined') return;

  /* ============================================================
     ★★ ここから 画面（UI）★★
     ============================================================ */
  var $ = function (id) { return document.getElementById(id); };

  /* ── カードの 絵（設計図 §9・厳守）──────────────────
     ・画像は office/games/cards/ の 支給画像。CSSや 絵文字で 自作しない。
     ・ファイル名が 日本語なので encodeURIComponent を 必ず 通す。
     ・★先読みしない ―― 表に なった 札だけ 読む。
       やさしい なら 絵は 13種類＋裏1枚 ＝ 14個 しか 読まない（ソリティアより 軽い）。 */
  var CARD_DIR = '../cards/';
  function cardSrc(name) { return CARD_DIR + encodeURIComponent(name) + '.png'; }
  var BACK_SRC = cardSrc('トランプ裏赤');

  /* ── 難しさ（社長裁定3）──────────────────────────
     初期値は 0＝やさしい（♠ だけ）。えらんだ ものは 覚えておく。
     ★ 遊んでいる 最中の 画面には 置かない（設計図 §5.5）。 */
  var STORE_KEY = 'bragekobo.spider.level';
  var level = 0;
  (function () {
    try {
      var v = localStorage.getItem(STORE_KEY);
      if (v !== null) { var n = parseInt(v, 10); if (n >= 0 && n < LEVELS.length) level = n; }
    } catch (e) {}
  })();

  /* ── 部品 ─────────────────────────────────── */
  var G = null, boardEl = null, boardIn = null, cardEl = [], spotEl = {}, built = false;
  var busy = false, autoTimer = 0, fallStop = null, squeezed = 0, squeezedEver = 0;
  var clipped = 0, clippedEver = 0;    // ★②見切れ（上から）が 効いている 列の 数
  var geo = { cw: 33, ch: 50, gap: 2, ovUp: 13, ovDn: 6, rowGap: 8, x0: 0, lift: 30, colH: 0 };

  function say(t) { $('happyBubble').textContent = t; }

  /* ============================================================
     ★★ 寸法（仕様 §1）★★
     ------------------------------------------------------------
     ★ 375px は「横」で 決まる（10列が 入る はば）。
       たてが 余る ので、その 余りを **つかむ 帯**に 配る（仕様 §1-2）。
       25% の まま だと 帯は 13px。40% まで 広げると 20px に なり、
       会社が 一度 受け入れた 下限（320px の ソリティア）と 同じ 的に 戻る。
     ★ 1000×900 は「たて」で 決まる（ソリティアと 同じ 構図）。
       たてが 余らない ので 帯は 25% の まま ―― 画面ごとに 自動で 変わる。
     ★ MAX_COL 枚が 入る はばを、大きい方から 1pxずつ 下げて さがす。
       ⚠️ MAX_COL は「証明された 上限」では ない（ルル §9-2）。だから
         render() に **こえても はみ出さない しぼり込み**を 入れて ある。
     ============================================================ */
  function fit(W, H, gap) {
    var ovUpMax = TUNE.OVER_UP_MAX, N = TUNE.MAX_COL;
    for (var w = TUNE.CARD_MAX; w >= 20; w--) {
      if (w * 10 + gap * 9 > W) continue;                    // 横に 10列 入るか
      var h = Math.round(w * TUNE.RATIO);
      var ovDn = Math.max(3, Math.round(h * TUNE.OVER_DOWN));
      var ovUp = Math.max(4, Math.round(h * TUNE.OVER_UP));
      var rowGap = Math.max(8, Math.round(h * 0.11));
      var body = H - (h + rowGap);                           // 上の段を のぞいた 場札の たて
      var need = 5 * ovDn + (N - 6) * ovUp + h;              // 裏は 最大5枚（増えない）
      if (need > body) continue;
      /* ★ たてが 余ったら 帯を 広げる（375px で 13px → 20px）*/
      var grow = Math.floor((body - need) / (N - 6));
      if (grow > 0) ovUp = Math.min(Math.round(h * ovUpMax), ovUp + grow);
      var colH = 5 * ovDn + (N - 6) * ovUp + h;
      return { cw: w, ch: h, ovUp: ovUp, ovDn: ovDn, rowGap: rowGap, gap: gap, colH: colH };
    }
    var h2 = Math.round(20 * TUNE.RATIO);
    return { cw: 20, ch: h2, ovUp: Math.max(4, Math.round(h2 * .25)), ovDn: Math.max(3, Math.round(h2 * .12)), rowGap: 8, gap: gap, colH: 0 };
  }

  function layout() {
    if (!boardIn) return;
    cancelDrag();                       // ★ 大きさが 変わる 前に 手を はなす
    var W = boardIn.clientWidth, H = boardIn.clientHeight;
    if (!W || !H) return;
    var gp = W >= 620 ? 12 : (W >= 360 ? 2 : 2);
    var got = fit(W, H, gp);
    if (got.cw < 44 && gp > 1) { var alt = fit(W, H, 1); if (alt.cw > got.cw) got = alt; }
    geo = got;
    geo.x0 = Math.max(0, Math.round((W - (geo.cw * 10 + geo.gap * 9)) / 2));
    geo.lift = Math.round(Math.min(TUNE.LIFT, geo.ch * 0.45));
    var r = document.documentElement.style;
    r.setProperty('--cw', geo.cw + 'px');
    r.setProperty('--ch', geo.ch + 'px');
    r.setProperty('--radius', Math.max(3, Math.round(geo.cw * 0.075)) + 'px');
    placeSpots();
    if (G) render(true);
  }

  function colX(i) { return geo.x0 + i * (geo.cw + geo.gap); }
  function tabY() { return geo.ch + geo.rowGap; }

  /* ★ 山札の「厚み」1段ぶんの ずれ（仕様 §8-4）
     ------------------------------------------------------------
     よこ … 札の はばの 14%。ただし 4段ぶんが **となりの 1列ぶん**に
            おさまる ところまで（＝ 上の段の 空いている 2列目を こえない）。
     たて … 上の段と 場札の すきま（rowGap）に 4段ぶんが おさまる ところまで。
     ★どちらも 画面の 大きさから 自動で 出る ので、
       375px でも 1000×900 でも 同じ 見え方に なる。 */
  function stockStep() {
    var x = Math.max(2, Math.min(Math.round(geo.cw * 0.14), Math.floor((geo.cw + geo.gap) / 4)));
    var y = Math.max(1, Math.min(3, Math.floor(geo.rowGap / 4)));
    return { x: x, y: y };
  }
  /* 山札の 見た目の 大きさ（たしかめ用。画面には 1文字も 出さない）*/
  function stockBox() {
    var s = stockStep();
    var lay = !G || !G.stock.length ? 0 : (G.dealsLeft > 0 ? G.dealsLeft : 1);
    if (!lay) return { layers: 0, w: 0, h: 0, sx: s.x, sy: s.y };
    return { layers: lay, w: geo.cw + (lay - 1) * s.x, h: geo.ch + (lay - 1) * s.y, sx: s.x, sy: s.y };
  }

  /* ── 置き場（山札1・そろった組8・場札10）と 104枚の 札を 1回だけ 作る ── */
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
    for (var s = 0; s < 8; s++) spot('f' + s, 'is-found');
    for (var i = 0; i < 10; i++) spot('c' + i);

    for (var c = 0; c < 104; c++) {
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

    /* ★ 操作は Pointer Events だけ（T67・社長指示）
       HTML5 の draggable / dragstart / drop は 1つも 使わない（スマホで 動かない）。
       ⚠️ ここに click は 足さない こと。足した 瞬間に
          「おしたら 勝手に 動く」が 生き返る。 */
    boardIn.addEventListener('pointerdown', onDown);
    boardIn.addEventListener('pointermove', onMove);
    boardIn.addEventListener('pointerup', onUp);
    boardIn.addEventListener('pointercancel', onCancel);
    boardIn.addEventListener('lostpointercapture', onCancel);
    boardIn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    boardIn.addEventListener('dragstart', function (e) { e.preventDefault(); });
    /* ゆれが 終わったら 印を 外す（付けっぱなしだと その札の すべる 動きが 止まる）*/
    boardIn.addEventListener('animationend', clearShake);
  }

  function fallback(c, inn) {
    if (inn.querySelector('.fallback')) return;
    if (!G) return;
    var s = suitOf(G, c);
    var d = document.createElement('div');
    d.className = 'fallback ' + (s === 1 || s === 2 ? 'red' : 'black');
    d.textContent = MARKS[s] + RANKS[rankOf(c)];
    inn.appendChild(d);
  }

  function placeSpots() {
    function put(el, x, y) {
      el.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      el.style.width = geo.cw + 'px'; el.style.height = geo.ch + 'px';
    }
    put(spotEl.stock, colX(0), 0);
    for (var s = 0; s < 8; s++) put(spotEl['f' + s], colX(2 + s), 0);
    for (var i = 0; i < 10; i++) put(spotEl['c' + i], colX(i), tabY());
  }

  /* ★ すべっている 札は おせない（T69・🔴1 の 直しを そのまま） */
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

  var lastXY = [];                                      // ★ 今 その札が どこに いるか（ゆれの 中心に つかう）
  function place(c, x, y, z, up) {
    var el = cardEl[c];
    lastXY[c] = [x, y];
    var tf = 'translate(' + x + 'px,' + y + 'px)';
    /* ⚠️ 「動いたか」は 自分で 覚えた 文字と くらべる（el.style.transform は
       ブラウザが 書き直す ので いつでも「ちがう」に なる）。*/
    if (lastTf[c] !== tf) {
      lastTf[c] = tf;
      el.style.transform = tf;
      if (!boardEl.classList.contains('no-anim') && !el.classList.contains('is-drag')) flyMark(c, el);
    }
    el.style.zIndex = String(z);
    el.classList.remove('as-stock');
    el.classList.remove('is-clip');                     // ★ 見切れから 戻った 札を 画面に 返す
    if (up) {
      var f = el.firstChild.firstChild;
      if (!f.getAttribute('src')) f.src = cardSrc(nameOf(G, c));   // ★ 今つかう札だけ 読む
      el.classList.remove('is-down');
    } else {
      el.classList.add('is-down');
    }
  }

  /* ★★ 長すぎる 列の 受け止め（★順番が 大事。①→② の 順に しか 動かない）★★
     ------------------------------------------------------------
     MAX_COL は 数えた 値であって「証明された 上限」では ない。
     こえた ときに はみ出すと スクロールが 出る ―― 社長の 一番の 要望に 反する。

     ① しぼり込み（tight）… その列 **だけ** 重なりを つめて、器の 中に おさめる。
        他の 列は 1mmも 変わらない。静かに おさまる ので 何も 伝えなくて いい。
        ★これを 消さない こと。社長の「いちいち 伝える 必要は ない」を
          いちばん きれいに 満たして いるのは この しくみ。

     ② 上から 見切れる（hide）… つめきれなく なったら（重なりが 最小 2px）、
        そこから先は 列の **上の 札から** 画面の 外に 出す。
        ★かつみ社長（T72）：「見切れる＝上限 って ことで いいと 思う。
          そして それは いちいち プレイヤーに 伝える 必要は ないです。」
        ★向きは ぜったいに「上」から。理由：スパイダーで 人が さわるのは
          列の 一番下の 札。下が 見切れたら その列は 一生 さわれず ゲームが 止まる
          （＝それは 見切れでは なく 詰み）。上は もう 重なって 埋まって いる 側なので、
          切れても 遊びは 1手も 止まらない。
        ★ここで 隠れる 札は、必ず 下端から 14枚より 深い ところに ある。
          そろえて 運べる 列は 最長でも 13枚（K〜A）なので、
          隠れた 札が「つかむ 起点」に なる ことは 起こらない。

     起きた 回数は SPIDER.now() で 見られる（画面には 1文字も 出さない）。 */
  function colStep(nd, nu, avail) {
    var room = Math.max(0, avail - geo.ch);
    function squeeze(a, b) {                          // a枚の裏・b枚の表を 器に つめた ときの 重なり
      var d = geo.ovDn, u = geo.ovUp;
      var base = a * d + (b > 0 ? (b - 1) * u : 0);
      if (base + geo.ch <= avail) return { d: d, u: u, tight: false };
      var k = base > 0 ? room / base : 1;
      return { d: Math.max(2, Math.floor(d * k)), u: Math.max(2, Math.floor(u * k)), tight: true };
    }
    function span(a, b, s) { return a * s.d + (b > 0 ? (b - 1) * s.u : 0) + geo.ch; }

    /* ① まず つめる（ここで おさまれば 何も 起きない ―― いちばん 多い 道） */
    var st = squeeze(nd, nu);
    if (span(nd, nu, st) <= avail) return { d: st.d, u: st.u, tight: st.tight, hide: 0 };

    /* ② つめきれない ぶんだけ、**上から** 減らす（下は 必ず 残す） */
    var over = span(nd, nu, st) - avail, hide = 0, nd2 = nd, nu2 = nu;
    while (over > 0 && (nd2 + nu2) > 1) {
      if (nd2 > 0) { nd2--; over -= st.d; } else { nu2--; over -= st.u; }
      hide++;
    }
    /* 残った 札で もう一度 つめ直す ―― 見えて いる ぶんが 器を きちんと 使う */
    var st2 = squeeze(nd2, nu2);
    if (span(nd2, nu2, st2) > avail) st2 = { d: st.d, u: st.u };   // 念のための 安全弁
    return { d: st2.d, u: st2.u, tight: true, hide: hide };
  }

  /* ★ ①の しぼり込みだけで 吸収できる 上限は 何枚か（今の 画面の 大きさで）。
     ここを こえた ぶんが ②の 見切れに なる。数える 道具（autoPlay）が 使う。
     裏向きは 最大5枚（増えない）ので、いちばん 苦しい nd=5 で 見る。 */
  function absorbMax(nd) {
    if (nd == null) nd = 5;
    if (!boardIn || !boardIn.clientHeight) return 0;
    var avail = Math.max(geo.ch, boardIn.clientHeight - tabY()), best = 0;
    for (var n = nd + 1; n <= 104; n++) {
      if (colStep(nd, n - nd, avail).hide === 0) best = n; else break;
    }
    return best;
  }

  /* ★ 見切れた 札 ―― 画面から 消すだけ。中身（G.tab）は 1枚も 減らさない。 */
  function clipCard(c) {
    var el = cardEl[c];
    el.classList.add('is-clip');
    el.classList.remove('as-stock');
    el.style.zIndex = '0';
  }

  function render(instant) {
    if (!G) return;
    if (instant) { boardEl.classList.add('no-anim'); flyClear(); }
    var z = 1, i, k, col, y, st;

    /* ★★ 山札の 残りは「厚み」で 見せる（仕様 §8-4・数字は 1つも 出さない）★★
       ------------------------------------------------------------
       あと 何回 配れるかが、スパイダーで いちばん 大事な 作戦の 材料。
       それを **札を ずらして 重ねた 厚み** だけで 伝える。
       ・あと5回＝5段の 厚い 山 ／ あと1回＝ぺったんこの 1枚
       ・★一番上の 札は いつでも 置き場所（colX(0),0）の まま。
         ずれるのは **下の 段だけ** ―― だから ゆれ（pressStock）の 中心も 動かない。
       ・ずらす 先は 右下。★上の段の 2列目は 空いて いる
         （山札＝0列目、そろった組＝2〜9列目）ので、はみ出す 相手が いない。
       ・たては 上の段と 場札の すきま（rowGap）に おさまる ぶんだけ。
       ★ 光らせない・色も 変えない・文字も 出さない（設計図 §5.5）。 */
    var sk = stockStep(), sn = G.stock.length;
    var batch = G.dealsLeft > 0 ? Math.ceil(sn / G.dealsLeft) : sn;   // ふつう 10枚＝1回ぶん
    for (i = 0; i < sn; i++) {
      var lay = batch > 0 ? Math.floor((sn - 1 - i) / batch) : 0;      // 0＝一番上の 段
      place(G.stock[i], colX(0) + lay * sk.x, lay * sk.y, z++, false);
      cardEl[G.stock[i]].classList.add('as-stock');
    }
    /* そろった 組は 上の 8つへ。K が 一番 手前に 見えるように 積む。 */
    for (i = 0; i < G.found.length; i++) {
      var cards = G.found[i].cards;
      for (k = 0; k < 13; k++) place(cards[k], colX(2 + i), 0, z + (12 - k), true);
      z += 13;
    }
    var top = tabY(), avail = Math.max(geo.ch, boardIn.clientHeight - top);
    squeezed = 0; clipped = 0;                         // ★ 今この瞬間の 数（描き直すたびに 数え直す）
    for (i = 0; i < 10; i++) {
      col = G.tab[i]; y = top;
      st = colStep(col.down.length, col.up.length, avail);
      if (st.tight) { squeezed++; squeezedEver++; }
      if (st.hide) { clipped++; clippedEver++; }
      /* ★ 上から st.hide 枚は 画面の 外（＝見切れ）。下は 必ず 残る。 */
      var idx = 0;
      for (k = 0; k < col.down.length; k++, idx++) {
        if (idx < st.hide) { clipCard(col.down[k]); continue; }
        place(col.down[k], colX(i), y, z++, false); y += st.d;
      }
      for (k = 0; k < col.up.length; k++, idx++) {
        if (idx < st.hide) { clipCard(col.up[k]); continue; }
        place(col.up[k], colX(i), y, z++, true); y += st.u;
      }
      colStepCache[i] = st;
    }
    /* 山札の 残りは「厚み」で 見せる（数字は 出さない・仕様 §8-4）*/
    spotEl.stock.classList.toggle('is-empty', G.stock.length === 0);
    for (i = 0; i < 8; i++) spotEl['f' + i].classList.toggle('is-filled', i < G.found.length);

    if (instant) { void boardEl.offsetWidth; boardEl.classList.remove('no-anim'); }
  }
  var colStepCache = [];

  /* ============================================================
     ★★ 操作 ★★
     ------------------------------------------------------------
       つまんで 運ぶ … **札の 移動は 全部 これ**（列→列）。例外なし。
       山札を おす   … 全列に 1枚ずつ 配る。★空の列が あると 配れない
       2回 続けて おす … ★スパイダーには 組札が 無い ので **作らない**。
                        送り先が どこにも 無いので、あっても 何も 起きない。
                        そろった 13枚は 自動で 消える（仕様 §7-3の2）ので、
                        「そろった 組を 片づける」用にも 要らない。
       ★ 置ける ところは 光らせない（T67で 社長が 決めた 線）。
         見せ方は「置けなければ 元に すっと 戻る」の 1つだけ。
     ============================================================ */

  /* ── ① どの札を つかんだか ─────────────────────
     ★ ブラウザに 任せるのが 正解 ―― 上に ある札ほど z-index が 大きい ので、
       e.target から いちばん 近い .card を たどれば
       「画面で いちばん 手前に 見えている 札」が そのまま 取れる。
     ★ つかめない ものは null（＝ 何も 起きない。裏向きの札と 同じ 手ざわり）：
       ・裏向きの札
       ・下に つづく 札と「♠♥♦♣ が 同じで 1つずつ 小さい 並び」に なっていない 札
         → これが スパイダーの ルール2 そのもの。まとめて 動かせない ものは 持てない。 */
  function grabAt(c) {
    for (var i = 0; i < 10; i++) {
      var col = G.tab[i], k = col.up.indexOf(c);
      if (k >= 0) {
        var L = col.up.length, R = runLen(G, col);
        if (k < L - R) return null;                    // 並びに なっていない → 持てない
        return { i: i, k: k, card: c, cards: col.up.slice(k) };
      }
      if (col.down.indexOf(c) >= 0) return null;       // 裏向き → 持てない
    }
    return null;                                        // 山札・そろった組 → 持てない
  }

  /* ── ② 落とした 先を さがす ────────────────────
     指の 位置では なく **運んでいる 札の 四角**で 見る。
     いちばん 大きく 重なった 列を 選ぶ。どこにも かからなければ null。
     ★ 上の「そろった組」は 落とし先に しない（消えた組は 戻せない・ルール8）。 */
  function dropZone(x, y) {
    var best = null, bestA = 0, j, a;
    var cw = geo.cw, ch = geo.ch;
    function over(zx, zy, zw, zh) {
      var w = Math.min(x + cw, zx + zw) - Math.max(x, zx);
      var h = Math.min(y + ch, zy + zh) - Math.max(y, zy);
      return (w > 0 && h > 0) ? w * h : 0;
    }
    var top = tabY(), colH = Math.max(ch, boardIn.clientHeight - top);
    for (j = 0; j < 10; j++) {
      a = over(colX(j), top, cw, colH);
      if (a > bestA) { bestA = a; best = j; }
    }
    return best;
  }

  /* ── ③ その 置きかたは ルール上 通るか（通らなければ null）────
     ⚠️ ここは「置けるか どうか」を 見るだけ。行き先を **探さない**。 */
  function moveFor(g0, j) {
    if (!g0 || j == null) return null;
    if (j === g0.i) return null;
    var t = G.tab[j], c = g0.card;
    if (t.up.length) {
      if (!canStack(c, t.up[t.up.length - 1])) return null;
    } else {
      /* 空の列。列まるごと（裏0枚）→ 空の列 は 何も 変わらない ので 手に しない */
      if (g0.k === 0 && G.tab[g0.i].down.length === 0) return null;
    }
    return { k: 'TT', from: g0.i, n: g0.cards.length, to: j };
  }

  /* ============================================================
     ★ 運ぶ 本体（1本の 指だけ・setPointerCapture つき）
     ============================================================ */
  var drag = null;

  function lift(d) {
    d.live = true;
    d.oy -= geo.lift;                                  // 指より 上へ ずらす（判定も 一緒に 上がる）
    for (var i = 0; i < d.src.cards.length; i++) {
      var el = cardEl[d.src.cards[i]];
      el.classList.add('is-drag');
      el.style.zIndex = String(900 + i);
    }
  }
  function follow(d) {
    var step = colStepCache[d.src.i] ? colStepCache[d.src.i].u : geo.ovUp;
    for (var i = 0; i < d.src.cards.length; i++) {
      var c = d.src.cards[i];
      var tf = 'translate(' + d.x + 'px,' + (d.y + i * step) + 'px)';
      lastTf[c] = tf;                                   // ★ place() の 控えも 一緒に 書きかえる
      cardEl[c].style.transform = tf;
    }
  }
  function unlift(d) {
    for (var i = 0; i < d.src.cards.length; i++) cardEl[d.src.cards[i]].classList.remove('is-drag');
    void boardIn.offsetWidth;
  }

  function onDown(e) {
    if (!G || G.over || busy) return;
    if (drag) return;                                  // ★ 2本目の 指は 見ない
    if (e.isPrimary === false) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    var t = e.target;
    var cEl = t.closest ? t.closest('.card') : null;
    var sp = t.closest ? t.closest('.spot') : null;
    var g0 = null, stock = false;

    if (cEl) {
      var id = parseInt(cEl.dataset.id, 10);
      if (G.stock.indexOf(id) >= 0) stock = true;      // 山札の 札を おした ＝ 配る
      else {
        g0 = grabAt(id);
        /* ★★ 持てない 札を つまんだ ―― その札 だけ 同じ ゆれを 1回（T73・🟡4）★★
           表向きの 札の 約70% は 並びに なって いない ので 持ち上がらない。
           ★押した 返事だけ 返す。**どこなら 持てるかは 1つも 教えない**。
           ★音は 鳴らさない（T67の 線）―― ためす たびに 音で とがめない。
           ★裏向きの 札は そのまま 黙って いる（見た目で もう 分かる）。 */
        if (!g0) {
          if (!cEl.classList.contains('is-down') && lastXY[id]) shakeNo(cEl, lastXY[id][0], lastXY[id][1]);
          return;
        }
      }
    } else if (sp && sp.dataset.spot === 'stock') {
      stock = true;
    } else return;

    e.preventDefault();
    var r = boardIn.getBoundingClientRect();
    var d = {
      id: e.pointerId, src: g0, stock: stock, live: false, moved: false,
      sx: e.clientX - r.left, sy: e.clientY - r.top,
      rl: r.left, rt: r.top, ox: 0, oy: 0, x: 0, y: 0
    };
    if (g0) {
      var er = cardEl[g0.card].getBoundingClientRect();
      d.x = er.left - r.left; d.y = er.top - r.top;
      d.ox = d.x - d.sx; d.oy = d.y - d.sy;
    }
    drag = d;
    try { boardIn.setPointerCapture(e.pointerId); } catch (err) {}
  }

  function onMove(e) {
    var d = drag;
    if (!d || e.pointerId !== d.id) return;
    var x = e.clientX - d.rl, y = e.clientY - d.rt;
    if (!d.live) {
      var dx = x - d.sx, dy = y - d.sy;
      if (dx * dx + dy * dy < TUNE.DRAG_SLOP * TUNE.DRAG_SLOP) return;
      d.moved = true;
      if (!d.src) return;                              // 山札は 運べない
      lift(d);
    }
    e.preventDefault();
    d.x = x + d.ox; d.y = y + d.oy;
    follow(d);
  }

  function onUp(e) {
    var d = drag;
    if (!d || e.pointerId !== d.id) return;
    drag = null;
    try { boardIn.releasePointerCapture(e.pointerId); } catch (err) {}

    if (d.live) {                                      // 運んで いた → 落とす
      var mv = moveFor(d.src, dropZone(d.x, d.y));
      unlift(d);
      if (mv) { play(mv); return; }
      /* 置けない → 元の 場所へ すっと 戻る。それだけ（音は 鳴らさない）。*/
      render();
      return;
    }
    if (d.moved) return;
    if (d.stock) { pressStock(); return; }
    /* ★ 札を 1回 おした ―― 何も 起きない。
       2回おしも 作らない（送り先が 無い ので、作っても 何も 起きない）。 */
  }

  function onCancel(e) {
    var d = drag;
    if (!d || e.pointerId !== d.id) return;
    drag = null;
    try { boardIn.releasePointerCapture(e.pointerId); } catch (err) {}
    if (d.live) { unlift(d); render(); }
  }
  function cancelDrag() {
    var d = drag;
    if (!d) return;
    drag = null;
    if (d.live) unlift(d);
  }

  /* ── 小さい音（外部ファイルは 使わない）─────────────── */
  var actx = null;
  function beep() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!actx) actx = new AC();
      if (actx.state === 'suspended') actx.resume();
      var o = actx.createOscillator(), gn = actx.createGain(), t = actx.currentTime;
      o.type = 'sine'; o.frequency.setValueAtTime(196, t);
      gn.gain.setValueAtTime(0.0001, t);
      gn.gain.exponentialRampToValueAtTime(0.05, t + 0.012);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
      o.connect(gn); gn.connect(actx.destination);
      o.start(t); o.stop(t + 0.13);
    } catch (e) {}
  }

  /* ★ 山札を おした（仕様 §7-4 の 6番）
     ------------------------------------------------------------
     空の列が あると 配れない ―― これは 本物の ルール。削らない。
     ただし **押しても 何も 起きない** は T68 の 🟡3（壊れてる？）と 同じ 形なので、
     押した ことは 必ず 伝える ―― 山札が ぷるっと ゆれる ＋ 小さい音。
     ★ どこが 空いているかは 光らせない。「何かが だめだった」だけを 伝える。 */
  /* ★ 「それは だめ」の ゆれ ―― 画面に ある たった 1種類の 強調（設計図 §5.5）。
     置き場所は transform で 決めて いるので、ゆらす 前に その 場所を
     --sx / --sy に 入れて おく（入れないと 左上に 飛ぶ）。 */
  function shakeNo(el, x, y) {
    if (!el) return;
    el.style.setProperty('--sx', x + 'px');
    el.style.setProperty('--sy', y + 'px');
    el.classList.remove('is-no');
    void el.offsetWidth;                                 // ★ 連続で おしても 毎回 ゆれる
    el.classList.add('is-no');
  }

  function pressStock() {
    if (canDeal(G)) { play({ k: 'D' }); return; }
    /* ★ ゆらすのは **人が 見ている もの** ―― 山札に 札が あるなら
       下じきは 札に かくれて 見えない ので、一番上の 札を ゆらす。 */
    var el = G.stock.length ? cardEl[G.stock[G.stock.length - 1]] : spotEl.stock;
    shakeNo(el, colX(0), 0);
    /* ★★ 空の 列の 下じきも、同じ ゆれを 1回（T73・🟡5）★★
       ------------------------------------------------------------
       押しても 配れない のは 手番の 34%。いま 山札だけが ゆれても
       「なぜ だめか」は つながらない ―― 空の列は 何手も 前に できて いて、
       場所も 盤の 反対がわ だから。
       ★空の列は もともと 画面に 見えて いる。隠れて いた ことを 1つも 見せて いない
         （＝答えを 先に 見せる、には ならない）。
       ★足すのは 文字 0・音 0・光り 0。すでに ある ゆれを もう 1か所で 使うだけ。 */
    for (var i = 0; i < 10; i++) {
      if (G.tab[i].down.length === 0 && G.tab[i].up.length === 0) shakeNo(spotEl['c' + i], colX(i), tabY());
    }
    beep();
  }
  function clearShake(e) { if (e.animationName === 'shakeNo') e.target.classList.remove('is-no'); }

  /* ── 1手 打つ（★人の 手は かならず ここを 通る）───────── */
  function play(mv) {
    var before = G.found.length;
    doMove(G, mv);
    render();
    updateTools();
    if (G.found.length > before && !isWin(G)) say('1組 消えた！　いい ちょうし！');
    if (isWin(G)) { finish(); return; }
    if (isStuck(G)) showResult('stop');
  }

  function updateTools() {
    $('btnUndo').disabled = !G || !G.hist.length || busy;
  }

  /* ── 勝ち ────────────────────────────────── */
  function finish() {
    busy = true; G.over = true; G.won = true;
    updateTools(); render();
    say('やったー！　8組 ぜんぶ 消えたね！');
    $('happyCat').classList.add('is-jump');
    autoTimer = setTimeout(startFall, TUNE.FALL_WAIT);
  }

  /* ============================================================
     ★ 札が 降る 演出（仕様 §8-2）
     ------------------------------------------------------------
     7本かけて 見つけた 当たり（トライ「7本で 一番いい 瞬間」）を そのまま 使う。
     104枚 なので 1枚あたりの 間かくを ソリティアの 半分に して、
     降っている 時間は 同じ ―― タップで 飛ばせる ／ 6秒で かってに 止まる。
     ============================================================ */
  function startFall() {
    var cv = $('fallCanvas');
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var Wp = window.innerWidth, Hp = window.innerHeight;
    cv.width = Math.round(Wp * dpr); cv.height = Math.round(Hp * dpr);
    cv.classList.remove('hidden');
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var src = [], i;
    for (i = 0; i < 8; i++) src.push(spotEl['f' + i].getBoundingClientRect());
    var order = [], r, s;
    for (r = 0; r < 13; r++) for (s = 0; s < 8; s++) order.push({ c: G.found[s].cards[r], s: s });

    var live = [], next = 0, t0 = performance.now(), raf = 0, done = false;
    var cw = src[0].width, ch = src[0].height;

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
        var o = order[next], b = src[o.s];
        var img = cardEl[o.c].firstChild.firstChild;
        var dir = Math.random() < .5 ? -1 : 1;
        live.push({
          img: img, x: b.left, y: b.top, w: cw, h: ch,
          vx: dir * (1.6 + Math.random() * 4.2), vy: -(1 + Math.random() * 5)
        });
        next++;
      }
      for (var i2 = live.length - 1; i2 >= 0; i2--) {
        var p = live[i2];
        p.x += p.vx; p.y += p.vy; p.vy += 0.62;
        if (p.y + p.h > Hp) {
          p.y = Hp - p.h;
          p.vy = -p.vy * 0.80;
          if (p.vy > -3) p.vy = -(3 + Math.random() * 3);
        }
        if (p.img.complete && p.img.naturalWidth) {
          try { ctx.drawImage(p.img, p.x, p.y, p.w, p.h); } catch (e) {}
        }
        if (p.x + p.w < -20 || p.x > Wp + 20) live.splice(i2, 1);
      }
      if (next >= order.length && live.length === 0) { stop(); return; }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
  }

  /* ============================================================
     ★ 結果の 箱 ＋ 連打よけ（T62の 事故を くり返さない）
       ① 箱が 出てから RESULT_LOCK ミリ秒 たっている
       ② かつ 最後に さわってから RESULT_QUIET ミリ秒 さわっていない
     ============================================================ */
  var locked = false, lockTimer = 0, lockAt = 0;
  function armUnlock(ms) { clearTimeout(lockTimer); lockTimer = setTimeout(unlockResult, ms); }
  function lockResult() {
    locked = true; lockAt = performance.now();
    $('resultBox').classList.add('is-locked');
    $('btnMain').disabled = true; $('btnSub').disabled = true;
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
    $('btnMain').disabled = false; $('btnSub').disabled = false;
    $('levelResult').disabled = false;
    $('btnQuit').removeAttribute('aria-disabled'); $('btnQuit').removeAttribute('tabindex');
  }

  /* ★★ ハッピーは うそを つかない（社長裁定4・仕様 §6-5・§8-3）★★
     ------------------------------------------------------------
     クリアできる 配りの 保証を **作っていない**。だから：
       ❌「この配り、ちゃんと クリアできるよ！」  … うそに なる
       ❌「まだ クリアできるよ！」「まだ いけるよ！」… うそに なる
     詰んだ ときに 言えるのは、起きた ことだけ。 */
  function showResult(kind) {
    G.over = true; busy = true; updateTools();
    var win = kind === 'win';
    $('resultTitle').textContent = win ? '8組 ぜんぶ 消えた！' : 'うーん、止まった';
    $('resultTitle').classList.toggle('is-stop', !win);
    var line = win ? 'やったー！　8組 ぜんぶ 消えたね！' : 'うーん、止まった。もどってみる？';
    $('resultSay').textContent = line;
    say(line);
    if (win) {
      $('btnMain').innerHTML = '新しく 配る <b>▶</b>';
      $('btnMain').dataset.act = 'new';
      $('btnSub').classList.add('hidden');
      $('btnQuit').classList.remove('hidden');
    } else {
      $('btnMain').textContent = 'もどす';
      $('btnMain').dataset.act = 'undo';
      $('btnSub').classList.remove('hidden');
      $('btnQuit').classList.add('hidden');
    }
    lockResult();
    $('resultWrap').classList.remove('hidden');
  }
  function hideResult() { $('resultWrap').classList.add('hidden'); unlockResult(); }

  /* ── 難しさの プルダウン（ソリティアでは なく スピード T64 の 形）──── */
  var lvSelects = [];
  function buildLevelSelects() {
    var opts = '', i;
    for (i = 0; i < LEVELS.length; i++) opts += '<option value="' + i + '">' + LEVELS[i].label + '</option>';
    lvSelects = [$('levelTitle'), $('levelResult')];
    for (i = 0; i < lvSelects.length; i++) {
      var s = lvSelects[i];
      if (!s) continue;
      s.innerHTML = opts;
      s.value = String(level);
      s.addEventListener('change', function (e) { setLevel(+e.target.value); });
    }
  }
  function setLevel(i) {
    if (!(i >= 0 && i < LEVELS.length)) return level;
    level = i;
    try { localStorage.setItem(STORE_KEY, String(i)); } catch (e) {}
    for (var k = 0; k < lvSelects.length; k++) {
      if (lvSelects[k] && lvSelects[k].value !== String(level)) lvSelects[k].value = String(level);
    }
    syncHelp();
    return level;
  }
  /* ★ あそびかたの 1行だけ、えらんだ 難しさに 合わせる（遊ぶ 前の 画面なので §5.5 に 反しない）*/
  function syncHelp() {
    var el = $('helpSuit');
    if (!el) return;
    el.textContent = level === 0
      ? '♠ だけ。数字が つづいて いれば まとめて 動かせる。'
      /* ★ まとめて 動かせる 条件は **2つ**（①♠♥♦♣ が 同じ ②数字が つづいて いる）。
         むずかしい ほうで ②が 抜けて いた（T73・🟡3）―― 一番 むずかしい ところで
         一番 説明が 少ない のは 逆。仕様の 言葉に 戻す。 */
      : (level === 1
        ? '♠ と ♥。♠♥ が 同じで、数字が つづいて いれば まとめて 動かせる。'
        : '♠♥♦♣ ぜんぶ。♠♥♦♣ が 同じで、数字が つづいて いれば まとめて 動かせる。');
  }

  /* ── 試合の 出し入れ ──────────────────────────── */
  function cancelAll() {
    cancelDrag();
    clearTimeout(autoTimer);
    if (fallStop) fallStop();
    $('fallCanvas').classList.add('hidden');
    $('happyCat').classList.remove('is-jump');
    spotEl.stock.classList.remove('is-no');
    for (var j = 0; j < 10; j++) spotEl['c' + j].classList.remove('is-no');
    for (var i = 0; i < cardEl.length; i++) cardEl[i].classList.remove('is-no');
    hideResult();
    busy = false;
  }

  function startGame(seed) {
    cancelAll();
    squeezed = 0; squeezedEver = 0;
    for (var i = 0; i < 104; i++) {                    // 難しさが 変わると 絵も 変わる
      cardEl[i].firstChild.firstChild.removeAttribute('src');
      var fb = cardEl[i].querySelector('.fallback');
      if (fb) fb.remove();
    }
    G = makeDeal(seed == null ? (Math.random() * 2147483000) >>> 0 : (seed >>> 0), level);
    $('titleScreen').classList.add('hidden');
    $('playScreen').classList.remove('hidden');
    $('tools').classList.remove('hidden');
    layout();
    render(true);
    updateTools();
    say('10列 ぜんぶ 見わたして、どこから くずす？');
  }
  function newDeal() { startGame(null); }
  function newDealFromResult() { say('おしい！　つぎの配りで がんばろ！'); startGame(null); }

  /* ★ T69・🟡6 と 同じ 順番（箱を 閉じるのも 止まったを 解くのも 必ず ここを 通る）*/
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
    buildLevelSelects();
    syncHelp();
    $('btnStart').addEventListener('click', newDeal);
    $('btnNew').addEventListener('click', newDeal);
    $('btnUndo').addEventListener('click', undoOne);
    $('btnHowto').addEventListener('click', function () { $('helpDialog').showModal(); });
    var closers = document.querySelectorAll('[data-close]');
    for (var i = 0; i < closers.length; i++) {
      closers[i].addEventListener('click', function () { $(this.dataset.close).close(); });
    }
    $('btnMain').addEventListener('click', function () {
      if (locked) return;
      if (this.dataset.act === 'undo') undoOne();
      else newDealFromResult();
    });
    $('btnSub').addEventListener('click', function () { if (!locked) newDealFromResult(); });
    $('resultWrap').addEventListener('pointerdown', bumpLock, true);
    window.addEventListener('resize', layout);
    window.addEventListener('orientationchange', function () { setTimeout(layout, 120); });
    layout();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* ============================================================
     ★ たしかめ用の 窓口（window.SPIDER）
     ------------------------------------------------------------
     画面には 1つも 出さない（お客さんに 見せる 物では ない）。
     ============================================================ */
  function median(a) { if (!a.length) return 0; var b = a.slice().sort(function (x, y) { return x - y; }); return b[b.length >> 1]; }

  function autoPlay(n, lv) {
    n = n || 100;
    lv = lv == null ? level : lv;
    var t0 = Date.now(), moves = [], cols = [], first = [], errs = [];
    var w = 0, st = 0, dead = 0, bad = 0, capped = 0, sets = 0;
    var bPos = 0, bAll = 0, bDead = 0, over = 0;
    var absorb = absorbMax(), overP = 0, clipP = 0;    // ★T72：手番ごとに 数える
    for (var i = 0; i < n; i++) {
      var r = playOne(i + 1, lv, 3000, absorb);
      overP += r.overPos; clipP += r.clipPos;
      if (r.capped) capped++;
      if (r.err) { errs.push('種 ' + r.seed + '：' + r.err); if (r.err.indexOf('104枚') >= 0) bad++; }
      if (r.won) w++;
      if (r.stuck) st++;
      if (r.deadStart) dead++;
      if (r.maxCol > TUNE.MAX_COL) over++;
      if (r.firstSet > 0) first.push(r.firstSet);
      sets += r.sets;
      bPos += r.blockedPos; bAll += r.positions; bDead += r.blockedDead;
      moves.push(r.moves); cols.push(r.maxCol);
    }
    var out = {
      '試合数': n,
      '難しさ': LEVELS[lv].label,
      '★エラー': errs.length,
      '★札が104枚でなかった試合': bad,
      '①〜②勝ち（先を読まない打ち方）': w + ' (' + (w / n * 100).toFixed(1) + '%)',
      '　1試合の平均そろい数': (sets / n).toFixed(2) + '組 ／ 8組',
      '③詰み': st + ' (' + (st / n * 100).toFixed(1) + '%)',
      '④手数（中央値／最大）': median(moves) + '手 ／ ' + Math.max.apply(null, moves) + '手',
      '⑤1組そろうまでの手数（中央値／最大）': first.length ? (median(first) + '手 ／ ' + Math.max.apply(null, first) + '手') : '1組も そろわず',
      '　1組もそろわなかった試合': (n - first.length) + ' (' + ((n - first.length) / n * 100).toFixed(1) + '%)',
      '★⑥1列の最大の枚数': Math.max.apply(null, cols) + '枚（作りの見こみ ' + TUNE.MAX_COL + '枚）',
      '　見こみを超えた試合': over,
      /* ★★T72で 社長に 出す 数（手番ごと）★★ */
      '★⑥-a 見こみ超え（①つめ込みが効く）': overP + '回 / ' + bAll + '手番（' + (bAll ? (overP / bAll * 100).toFixed(2) : '0') + '%）',
      '★⑥-b ①で吸収できる上限': absorb + '枚（今の画面。札 ' + geo.cw + '×' + geo.ch + 'px）',
      '★⑥-c 見切れが実際に起きる（②）': clipP + '回 / ' + bAll + '手番（' + (bAll ? (clipP / bAll * 100).toFixed(2) : '0') + '%）'
        + '　／ ⑥-aのうち ' + (overP ? (clipP / overP * 100).toFixed(2) + '%' : '―'),
      '★⑦配れない場面の割合': (bPos / bAll * 100).toFixed(1) + '%（手番 ' + bAll + '回のうち ' + bPos + '回）',
      '　空の列のせいで終わった試合': bDead + ' (' + (bDead / n * 100).toFixed(1) + '%)',
      '⑧最初に手が1つもない': dead + ' (' + (dead / n * 100).toFixed(1) + '%)',
      '手数の上限で打ち切り': capped,
      'かかった時間': ((Date.now() - t0) / 1000).toFixed(1) + '秒'
    };
    if (errs.length) out['エラーの中身'] = errs.slice(0, 5);
    console.log('[SPIDER] autoPlay', out);
    return out;
  }

  /* ★ 中身が こわれていないか（applyMove ↔ undoMove が ぴったり 逆か）
     ―― ソリティアで「16,000手 ずれ0」を 出した 資産の スパイダー版。 */
  function verify(n) {
    n = n || 30;
    var ok = 0, ng = [], steps = 0, t0 = Date.now();
    for (var i = 0; i < n; i++) {
      var lv = i % 3, g = makeDeal(i + 1, lv), keys = [], bad = null, k;
      for (k = 0; k < 200; k++) {
        if (isWin(g)) break;
        var mvs = legalMoves(g);
        if (!mvs.length) break;
        keys.push(stateKey(g) + '/' + countAll(g));
        doMove(g, mvs[(k * 7 + 3) % mvs.length]);
        if (countAll(g) !== 104) { bad = k + '手目で 札が ' + countAll(g) + '枚'; break; }
        steps++;
      }
      if (!bad) {
        for (k = keys.length - 1; k >= 0; k--) {
          undoMove(g);
          if (stateKey(g) + '/' + countAll(g) !== keys[k]) { bad = (k + 1) + '手目に もどせなかった'; break; }
        }
        if (!bad && g.hist.length) bad = 'もどしきれなかった（' + g.hist.length + '手 のこり）';
      }
      if (bad) ng.push('種' + (i + 1) + '：' + bad); else ok++;
    }
    var out = {
      '調べた試合': n, '★ぴったり戻った': ok, '★ずれた': ng.length,
      '打って戻した手': steps * 2, 'かかった時間': ((Date.now() - t0) / 1000).toFixed(1) + '秒'
    };
    if (ng.length) out['中身'] = ng;
    console.log('[SPIDER] verify', out);
    return out;
  }

  function solveTest(n, lv, ms) {
    n = n || 10; lv = lv == null ? 0 : lv; ms = ms || 2000;
    var ok = 0, unk = 0, no = 0, times = [], t0 = Date.now();
    for (var i = 0; i < n; i++) {
      var r = solve(makeDeal(i + 1, lv), { ms: ms, nodes: 400000 });
      times.push(r.ms);
      if (r.ok) ok++; else if (r.unknown) unk++; else no++;
    }
    var out = {
      '難しさ': LEVELS[lv].label, '調べた配り': n, '1つの上限': ms + 'ms',
      'クリアできた': ok, '★不明（時間切れ）': unk, 'できないと分かった': no,
      '1つにかかった時間（中央値／最大）': median(times) + 'ms ／ ' + Math.max.apply(null, times) + 'ms',
      'ぜんぶで': ((Date.now() - t0) / 1000).toFixed(1) + '秒'
    };
    console.log('[SPIDER] solveTest', out);
    return out;
  }

  function showBoard() {
    $('titleScreen').classList.add('hidden');
    $('playScreen').classList.remove('hidden');
    $('tools').classList.remove('hidden');
    layout(); render(true); updateTools();
  }
  function measure() {
    var inb = boardIn.getBoundingClientRect(), lowest = 0, right = 0, i, b;
    var hi = 1e9;                                   // ★ いちばん 上に ある「見えている」札の 上端
    for (i = 0; i < 104; i++) {
      if (cardEl[i].classList.contains('is-clip')) continue;   // 見切れた 札は 数えない
      b = cardEl[i].getBoundingClientRect();
      if (b.bottom > lowest) lowest = b.bottom;
      if (b.right > right) right = b.right;
      if (b.top < hi) hi = b.top;
    }
    /* ★ 列の 一番下の 札が 画面に 見えて いるか（ここが 消えたら 詰み）*/
    var bottomOK = true;
    if (G) for (i = 0; i < 10; i++) {
      var col = G.tab[i], last = col.up.length ? col.up[col.up.length - 1]
        : (col.down.length ? col.down[col.down.length - 1] : -1);
      if (last >= 0 && cardEl[last].classList.contains('is-clip')) bottomOK = false;
    }
    return {
      札: geo.cw + '×' + geo.ch + 'px',
      つかむ帯: geo.ovUp + 'px',
      '★列の一番下がぜんぶ見えている': bottomOK,
      '見切れている列': clipped + '列',
      'たての上へのはみ出し': Math.round(inb.top - hi) + 'px（0以下なら OK）',
      場札エリアの下端: Math.round(inb.bottom) + 'px',
      いちばん下の札の下端: Math.round(lowest) + 'px',
      たてのはみ出し: Math.round(lowest - inb.bottom) + 'px（0以下なら OK）',
      よこのはみ出し: Math.round(right - inb.right) + 'px（0以下なら OK）',
      ページ縦スクロール: document.documentElement.scrollHeight > window.innerHeight,
      ページ横スクロール: document.documentElement.scrollWidth > window.innerWidth,
      画面: window.innerWidth + '×' + window.innerHeight
    };
  }

  window.SPIDER = {
    now: function () {
      if (!G) return { 場面: 'まだ 始めていない', 難しさ: LEVELS[level].label };
      var cols = [], i;
      for (i = 0; i < 10; i++) {
        cols.push('列' + (i + 1) + '：裏' + G.tab[i].down.length + '／表[' +
          G.tab[i].up.map(function (c) { return nameOf(G, c); }).join(' ') + ']');
      }
      return {
        配りの番号: G.seed,
        難しさ: LEVELS[G.lv].label,
        場札: cols,
        そろった組: G.found.length + '組 ／ 8組',
        山札: G.stock.length + '枚（あと ' + G.dealsLeft + '回 配れる）',
        '★山札の厚み': (function () {
          var b = stockBox();
          return b.layers ? b.layers + '段 ＝ 見た目 ' + b.w + '×' + b.h + 'px（1段 ' + b.sx + '×' + b.sy + 'px）'
            : '山札なし（消えている）';
        })(),
        いま配れるか: canDeal(G) ? '配れる' : (G.dealsLeft === 0 ? '山札が もう ない' : '★空の列が あるので 配れない'),
        裏向きの札: downCount(G) + '枚',
        手数: G.moves + '手',
        もどせる回数: G.hist.length + '回',
        札の合計: countAll(G) + '枚',
        '1列の最大': maxColLen(G) + '枚',
        勝敗: isWin(G) ? '勝ち' : (isStuck(G) ? '止まった' : '進行中'),
        札の大きさ: geo.cw + '×' + geo.ch + 'px（つかむ帯 ' + geo.ovUp + 'px）',
        しぼり込みが効いている列: squeezed + '列（この試合で のべ ' + squeezedEver + '回）',
        '★見切れている列（上から）': clipped + '列（この試合で のべ ' + clippedEver + '回）',
        '①で吸収できる上限': absorbMax() + '枚'
      };
    },
    autoPlay: autoPlay,
    verify: verify,
    solveTest: solveTest,
    measure: measure,
    geo: function () { return geo; },
    stockBox: stockBox,
    absorbMax: absorbMax,
    level: function (i) {
      if (i == null) return { 番号: level, 名前: LEVELS[level].label };
      setLevel(i);
      return { 番号: level, 名前: LEVELS[level].label };
    },
    seed: function (n, lv) {
      if (n == null) return G ? G.seed : null;
      if (lv != null) setLevel(lv);
      startGame(n);
      return G.seed;
    },

    /* ★ 1列を n枚 まで のばした 場面を そのまま 出す ―― たしかめ 専用。
       トライへ：1000×900・375px・320px で スクロールが 出ない ことを
       ここで 見てください（数えた 最大 ＋ 余ゆう を 入れて あります）。 */
    worst: function (n) {
      /* ★T72：見切れ（②）まで 見たい ので 上限を 95枚 まで 上げた
         （10列目に n枚、のこり 9列に 1枚ずつ ＝ n の 上限は 95）。 */
      n = n == null ? TUNE.MAX_COL : Math.max(6, Math.min(95, n));
      cancelAll();
      G = makeDeal((Math.random() * 2147483000) >>> 0, level);
      var i, k, pool = [];
      for (i = 0; i < 104; i++) pool.push(i);
      for (i = 0; i < 10; i++) { G.tab[i].down = []; G.tab[i].up = []; }
      G.stock = []; G.found = []; G.hist = []; G.moves = 0; G.dealsLeft = 0;
      var p = 0;
      for (k = 0; k < 5; k++) G.tab[9].down.push(pool[p++]);      // 裏は 最大5枚
      for (k = 5; k < n; k++) G.tab[9].up.push(pool[p++]);
      for (i = 0; i < 9; i++) G.tab[i].up.push(pool[p++]);
      G.stock = pool.slice(p);
      showBoard();
      say('たしかめ用：1列 ' + n + '枚');
      var out = measure();
      out['1列の枚数'] = n + '枚';
      console.log('[SPIDER] worst', out);
      return out;
    },

    /* ★ 勝つ 直前（7組 そろって、10列目に 8組目の 13枚が ばらけて いる）を 出す。
       トライへ：ここから「札が 降る →結果の 箱」まで 一気に 見られます。 */
    nearWin: function (n) {
      n = n == null ? 1 : Math.max(1, Math.min(6, n));
      cancelAll();
      G = makeDeal((Math.random() * 2147483000) >>> 0, level);
      var i, k, s, used = {}, need = [];
      for (i = 0; i < 10; i++) { G.tab[i].down = []; G.tab[i].up = []; }
      G.stock = []; G.found = []; G.hist = []; G.moves = 0; G.dealsLeft = 0;
      /* 絵ごとに 番号を あつめる（同じ 絵の 札が 何枚も ある ので、絵から 引く）*/
      var byFace = {};
      for (i = 0; i < 104; i++) {
        var f = faceOf(G, i);
        (byFace[f] = byFace[f] || []).push(i);
      }
      function take(suit, rank) { var a = byFace[suit * 13 + rank]; return a.pop(); }
      var suits = LEVELS[G.lv].suits, si = 0;
      for (s = 0; s < 7; s++) {                                   // 7組は もう 消えている
        var su = suits[si % suits.length]; si++;
        var cards = [];
        for (k = 12; k >= 0; k--) cards.push(take(su, k));
        G.found.push({ suit: su, cards: cards, col: 0 });
      }
      var su2 = suits[si % suits.length];
      for (k = 12; k >= 0; k--) need.push(take(su2, k));          // 8組目 K→A
      /* 最後の n枚だけ 別の列に 置く ―― n=1 なら A を 1枚 運べば 勝ち */
      for (k = 0; k < 13 - n; k++) G.tab[9].up.push(need[k]);
      for (k = 13 - n; k < 13; k++) G.tab[8].up.push(need[k]);
      var rest = [];
      for (i = 0; i < 104; i++) { used[i] = 0; }
      for (i = 0; i < 10; i++) { for (k = 0; k < G.tab[i].up.length; k++) used[G.tab[i].up[k]] = 1; }
      for (s = 0; s < G.found.length; s++) for (k = 0; k < 13; k++) used[G.found[s].cards[k]] = 1;
      for (i = 0; i < 104; i++) if (!used[i]) rest.push(i);
      for (i = 0; i < 8; i++) if (!G.tab[i].up.length && rest.length) G.tab[i].up.push(rest.pop());
      G.stock = rest;
      showBoard();
      say('たしかめ用：あと ' + n + '枚 運べば 8組め');
      return { そろった組: G.found.length + '組', 残り: n + '枚' };
    },

    /* ★ 空の列が あって 配れない 場面を そのまま 出す ―― たしかめ 専用。
       ルル §9-1 の 7番（「めったに」と 書きたく なった ところ）の 見どころ。
       ★数えた 結果：やさしいで **手番の 33%** が この 場面（めったに では ない）。
       トライへ：ここで 山札を おして、
         ①「ぷるっと ゆれる ＋ 小さい音」で 押した ことが 伝わるか
         ② 何も 光らない のに「どうすれば いいか」に たどりつけるか
       を 見てください（仕様 §9-3 の 4番）。 */
    blockedDemo: function () {
      cancelAll();
      G = makeDeal((Math.random() * 2147483000) >>> 0, level);
      /* ★ どけた 5枚は 山札の 一番下へ 戻す（T73・🟡8）。
         捨てると 札が 104枚 でなく なり、次の テスト担当が
         「バグだ」と 誤報を 上げるか、逆に 本物の 不具合を 見のがす。 */
      G.stock = G.tab[4].down.concat(G.tab[4].up, G.stock);
      G.tab[4].down = []; G.tab[4].up = [];          // 5列目を 空に する
      showBoard();
      say('10列 ぜんぶ 見わたして、どこから くずす？');
      return {
        空の列: '5列目',
        山札: G.stock.length + '枚（あと ' + G.dealsLeft + '回）',
        配れるか: canDeal(G) ? '配れる' : '★配れない（正しい）',
        詰みか: isStuck(G)
      };
    },

    /* ★ 本当に 1手も ない 場面を 出す ―― たしかめ 専用（仕様 §7-5）。
       ------------------------------------------------------------
       ・8列の 一番上を **K** に する（K より 大きい 数字は 無い ので、
         K は 空の列に しか 動けない ―― その 空の列も 作らない）
       ・のこり 2列の 一番上を **A** に する（A が 動ける 先は「2」の 上だけ。
         2 は どの列の 上にも 出さない）
       ・どの 一番上の 下にも、並びに ならない 札を 1枚 かませる
         → まとめて 動かす 手も 消える
       ・山札は 0回
       ＝ ①「動かせる手が 1つもない」②「配れない」が そろう。
       ⚠️ どの 難しさでも 同じ 数（1つの 数字に 8枚）で 作れる ように、
          ♠♥♦♣ では なく **数字**で 札を えらんで いる。
          （やさしい では ♠A は 8枚 しか 無い ので、10列 ぜんぶを A に は できない）
       トライへ：ここで「うーん、止まった」の 箱と、大きい「もどす」を 見てください。 */
    stuckDemo: function () {
      cancelAll();
      G = makeDeal((Math.random() * 2147483000) >>> 0, level);
      var i, k, byRank = [], tops = [], unders = [], rest = [];
      for (k = 0; k < 13; k++) byRank.push([]);
      for (i = 0; i < 104; i++) byRank[rankOf(i)].push(i);
      for (i = 0; i < 10; i++) { G.tab[i].down = []; G.tab[i].up = []; }
      G.stock = []; G.found = []; G.hist = []; G.moves = 0; G.dealsLeft = 0;

      for (i = 0; i < 8; i++) tops.push(byRank[12].pop());      // K を 8枚
      for (i = 0; i < 2; i++) tops.push(byRank[0].pop());       // A を 2枚
      /* 下じきは「5」と「7」―― K の 下でも A の 下でも 並びに ならない */
      for (i = 0; i < 8; i++) unders.push(byRank[4].pop());
      for (i = 0; i < 2; i++) unders.push(byRank[6].pop());
      for (i = 0; i < 10; i++) { G.tab[i].up.push(unders[i]); G.tab[i].up.push(tops[i]); }

      var used = {};
      for (i = 0; i < 10; i++) for (k = 0; k < G.tab[i].up.length; k++) used[G.tab[i].up[k]] = 1;
      for (i = 0; i < 104; i++) if (!used[i]) rest.push(i);
      G.stock = rest;                                            // 山札は 見えるが 配れない（0回）
      showBoard();
      var stuck = isStuck(G);
      if (stuck) showResult('stop');
      return { 詰みと判定した: stuck, 場に手がある: hasPlay(G), 配れるか: canDeal(G) };
    },

    core: CORE
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
