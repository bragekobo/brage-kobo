/* ============================================================
   フリーセル（11本目）― T84・コーダ
   ------------------------------------------------------------
   仕様は logs/T82_フリーセル_仕様_ルル.md ＋ 社長裁定（2026-08-21）が 正。

   社長裁定（4つ・全部 ルルの推しどおり・厳守）：
     1. 絵の軽量化を 先に やる … ★ T83で 完了ずみ（55枚 280×424px・2.01MB）
     2. 運べない 枚数を つかんだら … ★ 持ち上がらず、その かたまりが ゆれる（§4-4 案A）
     3. 難しさは 選ばせない       … ★ §5.5の 例外1枠は この1本では 使わない
     4. PCの 札は 74×112px        … ★ 1列19枚が いつでも 入る。見切れも しぼり込みも 作らない

   ★ この ファイルの かたち（ソリティア T66 と 同じ・ここが いちばん 大事）
     ------------------------------------------------------------
     「中身（CORE）」と「画面（UI）」を きっぱり 分けてある。
     CORE は document を 1回も さわらない ので、**Node からも そのまま 動く**。
     クリアできる 配りの 一覧（DEALS）は、この CORE を Node で まわして 作った
     （logs/T84_フリーセル_配り作り.cjs）。
     ★ つまり「解く道具の側」と「ゲームの側」は **同じ 1本の コード**。
       仕様 §2-2 の いちばんの 落とし穴 ―― 両者が 決まりを 1つでも 取りちがえたら
       保証が うそに なる ―― を、**ズレようが ない 作り**に して つぶしてある。
       ★とくに §4「いちど運べる枚数」の 式は maxMove() ただ 1か所。

   ★ 札を 動かす 入口は applyMove() ただ1つ（ソリティアと 同じ）
     列→列・列→空き場・空き場→列・組札へ・組札から もどす ―― 全部 ここを 通る。
     だから「もどす」は 1つの 逆手順だけで 効く。入口を 増やさない こと。

   ⚠️ poker-core.js は 使わない（役の判定が 1つも 要らない ゲーム）。
   ⚠️ 外部の ライブラリ・フォント・画像は 0。外への 通信も 0。
   ============================================================ */
(function (root) {
  'use strict';

  /* ============================================================
     ★ 数字（TUNE）― 調整する 数字は ここ 1か所だけ
     ============================================================ */
  var TUNE = {
    /* ★★ 1列の 上限（仕様 §1-4・★証明ずみ）★★
       はじめから そこに あった札（最大7枚・並べかえ 不可）
       ＋ その一番下から 下へ 続く 並び（K→A の 12枚）＝ 19枚。
       ★ 20枚目は 理屈の うえで 存在しない ので、19枚が 入る 大きさに すれば
         **見切れも しぼり込みも 一生 要らない**（社長裁定4）。 */
    MAX_COL: 19,

    /* 見た目の 時間 */
    MOVE:        150,   // 札が すべって 動く 時間

    /* ★★ 空き場を 通っていく 動き（仕様 §4-5）★★
       まとめて 運ぶのは「人が 1枚ずつ 手で やれる ことを 1回に まとめた」だけ。
       だから **本当に 空き場を 経由して いる**のを そのまま 見せる。
       ★ルルの 注文は「何枚でも 0.25秒以内」。3手に 2手が ここを 通る。
         RELAY + 最後の ずらし（3枚ぶん）で 200 + 30 = 230ms。 */
    RELAY:       200,   // 1枚が 出発 → 空き場 → 行き先 まで
    RELAY_STAG:   10,   // 1枚ごとの ずらし（3枚ぶんまで）

    /* ★★ つまんで 運ぶ（T67の 作りを そのまま）★★ */
    DRAG_SLOP:     7,
    DOUBLE_MS:   340,
    DOUBLE_SLOP:  26,

    /* つかんだ 札を 指より 上へ ずらす（T69・仕様 §6-4）
       ★ 帯が 29px と 広い フリーセルでも、指(44px)は 札の 上 42%を 覆う。
         入れる 理由は「外したら すぐ 気づける」ことなので 帯の 広さとは 別の話。 */
    LIFT:         30,

    /* 「どの列も 下ほど 小さい」→ 自動で 全部 上げ（仕様 §5-5・★証明ずみ）*/
    AUTO_WAIT:   400,   // 「あ」と 気づく 間
    AUTO_STEP:    60,   // 1枚ごと

    /* 札が 降る 演出（仕様 §7-3。ソリティア・スパイダーと 同じ もの）*/
    FALL_WAIT:   300,
    FALL_STEP:    40,
    FALL_MAX:   6000,

    /* 結果の 箱の 連打よけ（T62の 事故を くり返さない・仕様 §7-3）*/
    RESULT_LOCK: 600,
    RESULT_QUIET: 250,

    /* ★★ 絵の 先読み（T103）★★
       裏で 一度に 流す 本数。★神経衰弱（T81）と 同じ 4本。
       ★まとめて 52本 出しては いけない ―― 細い線では 52枚とも
         「同時に 少しずつ」進み、★終わりまで 1枚も 出そろわない。
         4本ずつ なら 1枚ずつ 順に 届く ＝ 盤が 上から 埋まっていく。
       ★ブラウザが 同じ 相手に 開ける 線は 6本。2本 空けておく。 */
    WARM_PAR:      4,

    /* 寸法（仕様 §1-5。★1か所に まとめる ―― ばらまかない こと）*/
    CARD_MAX:     96,   // 札の はばの 上限
    OVER_UP:    0.25,   // つかむ帯の **下限**（隅の 数字と マークが 見える 最小・T68実測）
    OVER_UP_MAX:0.45,   // つかむ帯の **上限**（375pxで 29px ＝ 札の45%・仕様 §1-2）
    RATIO: 635 / 419    // 支給画像の ひりつ。★ぜったいに くずさない
  };

  /* ============================================================
     カード（設計図 §9・厳守）― ソリティアと 同じ 番号のふり方
       すーと = (c/13)|0   … 0 スペード / 1 ハート / 2 ダイヤ / 3 クローバー
       数字   = c % 13     … 0 が A、12 が K
     赤は ハートと ダイヤ（1・2）。黒は スペードと クローバー（0・3）。
     ============================================================ */
  var SUITS = ['スペード', 'ハート', 'ダイヤ', 'クローバー'];
  var RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  function suitOf(c) { return (c / 13) | 0; }
  function rankOf(c) { return c % 13; }
  function isRed(c)  { var s = suitOf(c); return s === 1 || s === 2; }
  function nameOf(c) { return SUITS[suitOf(c)] + RANKS[rankOf(c)]; }

  /* ============================================================
     ★ 種から 動く 乱数（mulberry32・T66 ソリティアと 同じ もの）
     ------------------------------------------------------------
     Math.random() では 番号から 同じ 配りを 作れない。
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

  /* ★ 配る（仕様 §5-1）
     場札 8列に 左から 順ぐりに 1枚ずつ ＝ 左の4列が7枚・右の4列が6枚。
     ★ 裏向きは 1枚も ない。山札も ない。 */
  function makeDeal(seed) {
    var rnd = mulberry32(seed >>> 0);
    var deck = [], i, j, t;
    for (i = 0; i < 52; i++) deck.push(i);
    for (i = 51; i > 0; i--) {                 // Fisher–Yates（向き・回数を 変えない）
      j = Math.floor(rnd() * (i + 1));
      t = deck[i]; deck[i] = deck[j]; deck[j] = t;
    }
    var g = {
      seed: seed >>> 0,
      cols: [], free: [-1, -1, -1, -1], found: [0, 0, 0, 0],
      hist: [], moves: 0, over: false, won: false
    };
    for (i = 0; i < 8; i++) g.cols.push([]);
    for (i = 0; i < 52; i++) g.cols[i % 8].push(deck[i]);
    return g;
  }

  /* ============================================================
     ★ ルール（仕様 §5-4 の 10個。1つも 削らない）
     ------------------------------------------------------------
       1  場札は 色が かわりばんこ・数字が 1つ小さい 順       → canStack
       2  並びに なっている札は まとめて 動かせる             → runLen
       3 ★いちど運べる枚数に 上限が ある                      → maxMove ★§4
       4  組札は マークごと・A から順                          → canToFound
       5 ★組札から 場札へ 戻せる（ゲームだけ。解く道具には 無い）→ legalMoves の 'FT'
       6  空き場は 4つ。1つに 1枚だけ                          → free[4]
       7 ★空いた列には どの札でも 置ける（ソリティアと ちがう）→ legalMoves
       8  山札は 無い ／ 9 裏向きは 無い
       10 もどす 無制限                                        → undoMove
     ============================================================ */
  function canStack(card, onto) {
    return rankOf(card) === rankOf(onto) - 1 && isRed(card) !== isRed(onto);
  }
  function canToFound(g, card) {
    return g.found[suitOf(card)] === rankOf(card);
  }
  function isWin(g) {
    return g.found[0] + g.found[1] + g.found[2] + g.found[3] === 52;
  }
  /* ★ 札は いつでも 52枚（たしかめ用）*/
  function countAll(g) {
    var n = g.found[0] + g.found[1] + g.found[2] + g.found[3], i;
    for (i = 0; i < 4; i++) if (g.free[i] >= 0) n++;
    for (i = 0; i < 8; i++) n += g.cols[i].length;
    return n;
  }

  /* ★ その列の 一番下から 上へ、まとめて 動かせる 並びの 長さ
     （色が かわりばんこ・1つずつ 大きく なる ところまで）*/
  function runLen(col) {
    if (!col.length) return 0;
    var n = 1;
    for (var i = col.length - 1; i > 0; i--) {
      if (canStack(col[i], col[i - 1])) n++; else break;
    }
    return n;
  }
  /* ★ その列の k番目から 下が、正しい 並びに なっているか（つかめるか）*/
  function isRun(col, k) {
    for (var i = k; i < col.length - 1; i++) if (!canStack(col[i + 1], col[i])) return false;
    return true;
  }

  function freeCount(g) { var n = 0; for (var i = 0; i < 4; i++) if (g.free[i] < 0) n++; return n; }
  function emptyCount(g) { var n = 0; for (var i = 0; i < 8; i++) if (!g.cols[i].length) n++; return n; }

  /* ============================================================
     ★★★ いちど運べる枚数（仕様 §4-1）★★★
     ------------------------------------------------------------
         （空いている 空き場の数 ＋ 1） × 2の（空いた列の数）乗
         ★空いた列へ 運ぶ ときは、その列を 数えない

     ★★ この 式は この 会社に **ここ 1か所しか ない。** ★★
        解く道具（logs/T84_…_配り作り.cjs）も 画面も、全部 この 関数を 呼ぶ。
        仕様 §2-2「ここが ゲームと ズレたら 保証は うそに なる」への 答えが これ。
        ⚠️ 別の場所に 同じ 式を 書き写さない こと。写した 瞬間に ズレる。
     ============================================================ */
  function maxMove(g, toCol) {
    var e = emptyCount(g);
    if (toCol != null && g.cols[toCol] && g.cols[toCol].length === 0) e--;
    if (e < 0) e = 0;
    return (freeCount(g) + 1) * Math.pow(2, e);
  }

  /* ============================================================
     ★ 手（move）― 札を 動かす 入口は applyMove ただ1つ
     ------------------------------------------------------------
       {k:'TT', from, n, to}   場札 → 場札（n枚 まとめて）
       {k:'TF', from}          場札 → 組札
       {k:'TC', from, to}      場札 → 空き場（to ＝ 0〜3）
       {k:'CT', from, to}      空き場 → 場札
       {k:'CF', from}          空き場 → 組札
       {k:'FT', s, to}         組札 → 場札（ルール5・ゲームだけ）
     ============================================================ */
  function applyMove(g, mv, opt) {
    var rec = { k: mv.k, mv: mv }, c, i, moved;
    switch (mv.k) {
      case 'TT':
        moved = g.cols[mv.from].splice(g.cols[mv.from].length - mv.n, mv.n);
        for (i = 0; i < moved.length; i++) g.cols[mv.to].push(moved[i]);
        break;
      case 'TF':
        c = g.cols[mv.from].pop(); g.found[suitOf(c)]++; break;
      case 'TC':
        c = g.cols[mv.from].pop(); g.free[mv.to] = c; break;
      case 'CT':
        c = g.free[mv.from]; g.free[mv.from] = -1; g.cols[mv.to].push(c); break;
      case 'CF':
        c = g.free[mv.from]; g.free[mv.from] = -1; g.found[suitOf(c)]++; break;
      case 'FT':
        c = mv.s * 13 + (g.found[mv.s] - 1); g.found[mv.s]--; g.cols[mv.to].push(c); break;
    }
    g.moves++;
    if (!opt || opt.hist !== false) g.hist.push(rec);
    return rec;
  }

  /* ★ もどす（無制限・ルール10）。逆の 手順を 1つだけ 書く。 */
  function undoMove(g) {
    var rec = g.hist.pop();
    if (!rec) return false;
    var mv = rec.mv, c, i, back;
    switch (rec.k) {
      case 'TT':
        back = g.cols[mv.to].splice(g.cols[mv.to].length - mv.n, mv.n);
        for (i = 0; i < back.length; i++) g.cols[mv.from].push(back[i]);
        break;
      case 'TF':
        c = mv._c; g.found[suitOf(c)]--; g.cols[mv.from].push(c); break;
      case 'TC':
        c = g.free[mv.to]; g.free[mv.to] = -1; g.cols[mv.from].push(c); break;
      case 'CT':
        c = g.cols[mv.to].pop(); g.free[mv.from] = c; break;
      case 'CF':
        c = mv._c; g.found[suitOf(c)]--; g.free[mv.from] = c; break;
      case 'FT':
        c = g.cols[mv.to].pop(); g.found[suitOf(c)]++; break;
    }
    g.moves--;
    return true;
  }

  /* ★ 手が どの札を 動かすのかを 手の 中に 入れておく（もどす ときに 要る）。
     applyMove の 前に 必ず 通す ―― 入口を 1つに するための 下ごしらえ。 */
  function tagMove(g, mv) {
    if (mv.k === 'TF') mv._c = g.cols[mv.from][g.cols[mv.from].length - 1];
    else if (mv.k === 'CF') mv._c = g.free[mv.from];
    return mv;
  }
  function doMove(g, mv, opt) { return applyMove(g, tagMove(g, mv), opt); }

  /* ============================================================
     ★ 出せる手を 全部 数える
       o.found === false … 組札→場札（ルール5）を 入れない
                           （詰み判定・解く道具で 使う）
     ⚠️ 同じ 意味の 手を 何本も 出さない ように します：
        ・空き場へ 逃がすのは **いちばん 手前の 空きスロット 1つだけ**
        ・空いた列へ 運ぶのは **いちばん 左の 空き列 1つだけ**
        どれも 中身は 同じ なので、増やすと 解く道具が 何倍も 遅く なる だけ。
     ============================================================ */
  function legalMoves(g, o) {
    o = o || {};
    var out = [], i, j, k, col, t, c, n, mm, mme;
    var slot = g.free.indexOf(-1);
    var emptyCol = -1;
    for (i = 0; i < 8; i++) if (!g.cols[i].length) { emptyCol = i; break; }

    /* ① 組札へ 上げる（空き場から・列から）*/
    for (i = 0; i < 4; i++) {
      c = g.free[i];
      if (c >= 0 && canToFound(g, c)) out.push({ k: 'CF', from: i });
    }
    for (i = 0; i < 8; i++) {
      col = g.cols[i];
      if (col.length && canToFound(g, col[col.length - 1])) out.push({ k: 'TF', from: i });
    }

    /* ② 空き場 → 列 */
    for (i = 0; i < 4; i++) {
      c = g.free[i]; if (c < 0) continue;
      for (j = 0; j < 8; j++) {
        t = g.cols[j];
        if (t.length) { if (canStack(c, t[t.length - 1])) out.push({ k: 'CT', from: i, to: j }); }
      }
      if (emptyCol >= 0) out.push({ k: 'CT', from: i, to: emptyCol });
    }

    /* ③ 列 → 空き場（★1枚だけ・空きスロットの 先頭へ）*/
    if (slot >= 0) {
      for (i = 0; i < 8; i++) {
        col = g.cols[i]; if (!col.length) continue;
        /* 1枚しか ない列を 空き場へ ＝ ただ 列を 空けるだけ。
           空いた列が すでに ある なら 中身が 変わらない ので 手に しない。 */
        if (col.length === 1 && emptyCol >= 0) continue;
        out.push({ k: 'TC', from: i, to: slot });
      }
    }

    /* ④ 列 → 列（★ここに §4 の 上限が かかる）*/
    mm = maxMove(g, null);
    for (j = 0; j < 8; j++) {
      t = g.cols[j]; if (!t.length) continue;
      c = t[t.length - 1];
      if (rankOf(c) === 0) continue;                    // A の 上には 何も 乗らない
      for (i = 0; i < 8; i++) {
        if (i === j) continue;
        col = g.cols[i]; if (!col.length) continue;
        n = runLen(col);
        for (k = 1; k <= n; k++) {
          var head = col[col.length - k];
          if (canStack(head, c)) {                      // 置ける 枚数は 1通りしか ない
            if (k <= mm) out.push({ k: 'TT', from: i, n: k, to: j });
            break;
          }
        }
      }
    }
    /* ⑤ 列 → 空いた列（★その列は 数えない ＝ maxMove(g, 空き列)）*/
    if (emptyCol >= 0) {
      mme = maxMove(g, emptyCol);
      for (i = 0; i < 8; i++) {
        col = g.cols[i]; if (!col.length) continue;
        n = Math.min(runLen(col), mme);
        for (k = 1; k <= n; k++) {
          /* 列 まるごと → 空いた列 は 何も 変わらない ので 手に しない */
          if (k === col.length) continue;
          out.push({ k: 'TT', from: i, n: k, to: emptyCol });
        }
      }
    }

    /* ⑥ 組札 → 場札（ルール5・立て直しの 手）*/
    if (o.found !== false) {
      for (var s = 0; s < 4; s++) {
        if (!g.found[s]) continue;
        c = s * 13 + (g.found[s] - 1);
        for (j = 0; j < 8; j++) {
          t = g.cols[j];
          if (t.length) { if (canStack(c, t[t.length - 1])) out.push({ k: 'FT', s: s, to: j }); }
        }
        if (emptyCol >= 0) out.push({ k: 'FT', s: s, to: emptyCol });
      }
    }
    return out;
  }

  /* ============================================================
     ★ 詰みの 判定（仕様 §5-6・ソリティアより 1つ 簡単）
     ------------------------------------------------------------
       ① 列どうしで 動かせる手が 1つもない
       ② 空き場へ 逃がせる札が 1つもない（＝ 4つとも 埋まっている）
       ③ 空き場から 列へ 戻せる札が 1つもない
       ④ 組札へ 上げられる札が 1つもない
     ★ ソリティアの「山札を 1周 だまって めくる」は 要らない（山札が 無い）。
     ⚠️ ゲームは「もう 勝てない」とは ぜったいに 言わない。
        言うのは「1手も ない」ときだけ。★保証が あるので、詰み ＝ 自分の手 が 悪かった。

     ★★ ⑤ 組札から 引っぱって もどす 手（ルール5）も 数える（T86・T85 §5-6）★★
        T84 では これを まるごと 数えて いなかった。理由は
        「入れると 組札に 1枚でも あれば ほぼ 必ず 手が あることに なり、詰みが 一生 出ない」。
        ★ところが あそびかたには「右上に 上げた札は、引っぱって もどせる。」と 書いてある。
        ★書いて ある 手が まだ 使えるのに「1手も ない」と 言うのは、画面が うそを つくこと。
        → そこで 数える。ただし **数え方を 決めて** 甘く なりすぎない ように する（下）。
     ============================================================ */
  function hasPlay(g) { return legalMoves(g, { found: false }).length > 0; }

  /* ============================================================
     ★★★ 何を もって「手が ある」と するか（T86・ここが 全部）★★★
     ------------------------------------------------------------
       組札から 1枚 下ろして みる。★その1手を 打った あとに
       ★「いま 下ろした その札を もう一度 動かす」以外の 手が 1つでも 生まれたら
       ―― その ときだけ「手が ある」と 数える。

     ★ なぜ この 線引きか（＝ なぜ 甘く なりすぎないか）
       ・詰み ＝「この場面から **前に 進む** 手が ない」。★下ろして 上げ直す、
         下ろして 別の列へ ずらす ―― これは 進んで いない（堂々めぐり）。
         だから 下ろした その札を さわる だけ の 手は、手として 数えない。
       ・数えるのは ★下ろした札が「置き場」に なって、★ほかの札が 動けるように
         なった とき だけ。それは 本当に 場面が 変わって いる。
       ・★先読みは 1手だけ。生まれた 手を さらに 打って みたり しない。
         だから「いつまでも 詰まない」に ならない（実測は logs/T86 に）。
       ・空き場が 1つでも 空いて いる 場面は そもそも hasPlay で 手が あるので、
         ここへは 来ない。ここへ 来るのは 本当に 行きづまった 場面だけ。

     ⚠️ 本物の 場面（G）は 1ミリも さわらない ―― かならず 写し（cloneState）で 試す。
        T84 の 🔴2（下見の 関数が 札を 消した）と 同じ 事故を 二度と 起こさない ため。
     ============================================================ */
  function ftRevives(g) {
    var mvs = legalMoves(g), i, j, mv, sim, after, m;
    for (i = 0; i < mvs.length; i++) {
      mv = mvs[i];
      if (mv.k !== 'FT') continue;
      sim = cloneState(g);                              // ★写しの うえで 1手 打つ
      doMove(sim, mv, { hist: false });
      after = legalMoves(sim, { found: false });        // ★さらに 下ろす 手は 見ない（1手だけ）
      for (j = 0; j < after.length; j++) {
        m = after[j];
        /* いま 下ろした 札を もう一度 動かす だけ の 手（上げ直す・別の列へ ずらす・
           空き場へ 逃がす）は 数えない。★from が 空き場の 手（CT・CF）は 別物なので 除く。 */
        if ((m.k === 'TT' || m.k === 'TF' || m.k === 'TC') && m.from === mv.to) continue;
        return true;                                    // ★ほかの札が 動ける ＝ 前に 進める
      }
    }
    return false;
  }
  function isStuck(g) { return !isWin(g) && !hasPlay(g) && !ftRevives(g); }

  /* ============================================================
     ★★ 自動で 全部 上げて よい 条件（仕様 §5-5・★証明つき）★★
     ------------------------------------------------------------
     どの列も、上から 下へ 数字が 小さく なっている
     （＝ その列の 一番下が その列で いちばん 小さく、しかも 取っても そのまま）。
     この 瞬間、勝ちは **確定** している：
       まだ 上がっていない 札の うち いちばん 小さい 数字を r と すると、
       r より 小さい札は 全部 組札に 乗っている ＝ 4つの 組札は どれも r-1 以上。
       だから r は どのマークでも 上げられる。
       その r は 空き場に あるか、列の 一番下に ある（一番下でないなら
       その下に もっと 小さい札が ある ＝ もう 上がっている はず で 矛盾）。
       → 必ず 取れる。取った あとも 条件は 崩れない → 52枚 全部 上がる。
     ★ 判定は 1回の 走査だけ。確率も 上限も 要らない。
     ============================================================ */
  function allSorted(g) {
    for (var i = 0; i < 8; i++) {
      var col = g.cols[i];
      for (var k = 0; k + 1 < col.length; k++) if (rankOf(col[k]) < rankOf(col[k + 1])) return false;
    }
    return true;
  }
  /* 自動上げの 1手（上げられる 札を 1枚 さがす）*/
  function foundMove(g) {
    for (var i = 0; i < 8; i++) {
      var col = g.cols[i];
      if (col.length && canToFound(g, col[col.length - 1])) return { k: 'TF', from: i };
    }
    for (var j = 0; j < 4; j++) {
      if (g.free[j] >= 0 && canToFound(g, g.free[j])) return { k: 'CF', from: j };
    }
    return null;
  }

  function cloneState(g) {
    var t = {
      seed: g.seed, cols: [], free: g.free.slice(), found: g.found.slice(),
      hist: [], moves: g.moves, over: false, won: false
    };
    for (var i = 0; i < 8; i++) t.cols.push(g.cols[i].slice());
    return t;
  }

  /* ============================================================
     ★★ 解く道具（solver）― 仕様 §2-2 / §9-3④
     ------------------------------------------------------------
     この 配りが クリアできるか 調べて、できるなら **本当の 手順**を 返す。
     ・手は 全部 legalMoves から 出る ＝ そのまま 流しこめば 本当に 勝てる。
       ★これが 保証の 中身。
     ・組札→場札（ルール5）は 使わない ―― 使わなくても 勝てる 手順だけ 探す。
       ゲームの 手は これより **広い** ので、見つかった 手順は 必ず 通る（安全側）。
       ⚠️ 逆向き（ゲームの方が 手が 少ない）に すると 保証が うそに なる。
     ・「上げても 損しない 札」は だまって 上げる（safeUp）。
       フリーセルで 昔から 知られている 決まり ―― 損を しない ことが
       言い切れる ので、探す 木が ぐっと 小さく なる。
     ・時間切れ・数え切れは「不明」＝ 捨てる。一覧に 入れなければ いいだけ。
     ============================================================ */
  function safeCard(g, c) {
    var r = rankOf(c);                                  // 0 が A
    if (!canToFound(g, c)) return false;
    if (r <= 1) return true;                            // A・2 は いつでも 安全
    var opp = isRed(c) ? [0, 3] : [1, 2];               // 反対の色 2つ
    var same = isRed(c) ? (suitOf(c) === 1 ? 2 : 1) : (suitOf(c) === 0 ? 3 : 0);
    if (g.found[opp[0]] < r || g.found[opp[1]] < r) return false;
    if (g.found[same] < r - 1) return false;
    return true;
  }
  function safeUp(g) {
    for (var i = 0; i < 4; i++) if (g.free[i] >= 0 && safeCard(g, g.free[i])) return { k: 'CF', from: i };
    for (var j = 0; j < 8; j++) {
      var col = g.cols[j];
      if (col.length && safeCard(g, col[col.length - 1])) return { k: 'TF', from: j };
    }
    return null;
  }

  /* 場面の 名札。列の 並べかえと 空き場の 並べかえは 同じ 場面 なので そろえる。 */
  function stateKey(g) {
    var a = [], i;
    for (i = 0; i < 8; i++) a.push(g.cols[i].join(','));
    a.sort();
    var f = [];
    for (i = 0; i < 4; i++) if (g.free[i] >= 0) f.push(g.free[i]);
    f.sort(function (x, y) { return x - y; });
    return a.join('|') + '#' + f.join(',') + '#' + g.found.join(',');
  }

  /* 見立て（小さいほど よい）― T82 ルルの 解く道具と 同じ 中身 */
  function heuristic(g) {
    var h = (52 - (g.found[0] + g.found[1] + g.found[2] + g.found[3])) * 2, s, i, idx;
    for (s = 0; s < 4; s++) {
      var need = g.found[s];                            // つぎに 要る札の 数字（0 が A）
      if (need > 12) continue;
      var card = s * 13 + need;
      for (i = 0; i < 8; i++) {
        idx = g.cols[i].indexOf(card);
        if (idx >= 0) { h += (g.cols[i].length - 1 - idx) * 2; break; }
      }
    }
    h += (4 - freeCount(g)) - emptyCount(g) * 3;
    return h;
  }

  function solve(g, opts) {
    opts = opts || {};
    var limitMs = opts.ms == null ? 4000 : opts.ms;
    /* ★ 一覧（DEALS）を 作った ときと 同じ 上限に して おく こと。
       下げると、作った ときは 解けた 配りが 解けなく なり、
       たしかめ直した ときに「解けなかった」が 出て 混乱する。 */
    var maxNodes = opts.nodes == null ? 150000 : opts.nodes;
    /* ★ 深さの 上限（これが 無いと 呼び出しが 積み上がって 落ちる ―― 実際に 落ちた）。
       1手 ＝ 1段。実測で 600段だと 57/60、1500段で 59/60（しかも 速い）。
       深く 掘れる ほうが 早く 底に つく ので、時間も 減った。 */
    var maxDepth = opts.depth == null ? 1500 : opts.depth;
    var t0 = Date.now(), nodes = 0, cut = false, deep = false;
    var seen = new Set();
    var st = cloneState(g), path = [], maxCol = 0;
    var i0;
    for (i0 = 0; i0 < 8; i0++) if (st.cols[i0].length > maxCol) maxCol = st.cols[i0].length;

    function children() {
      var mvs = legalMoves(st, { found: false }), out = [], i;
      for (i = 0; i < mvs.length; i++) {
        var m = mvs[i];
        doMove(st, m, { hist: false });
        out.push({ m: m, h: heuristic(st) });
        for (var q = 0; q < 8; q++) if (st.cols[q].length > maxCol) maxCol = st.cols[q].length;
        /* doMove は hist:false なので、逆手順を 手で 戻す */
        undoDirect(st, m);
      }
      out.sort(function (a, b) { return a.h - b.h; });
      return out;
    }
    /* hist を 使わずに 1手 だけ 戻す（children の 下見 用）*/
    function undoDirect(s, m) { s.hist.push({ k: m.k, mv: m }); undoMove(s); }

    function dfs(depth) {
      if (nodes >= maxNodes || Date.now() - t0 > limitMs) { cut = true; return false; }
      nodes++;
      var autos = 0, m;
      while ((m = safeUp(st))) { doMove(st, m); path.push(m); autos++; }
      if (isWin(st)) return true;
      var key = stateKey(st);
      if (depth < maxDepth && !seen.has(key)) {
        seen.add(key);
        var kids = children();
        for (var i = 0; i < kids.length; i++) {
          doMove(st, kids[i].m); path.push(kids[i].m);
          if (dfs(depth + 1)) return true;
          undoMove(st); path.pop();
          if (cut) break;
        }
      } else if (depth >= maxDepth) { deep = true; }   /* ★ 深すぎた 枝を 1本 あきらめた だけ。
                                                          探索 全体は 止めない（cut に しない）。 */
      for (var a = 0; a < autos; a++) { undoMove(st); path.pop(); }
      return false;
    }

    var won = dfs(0);
    return {
      /* ★「不明」＝ 打ち切りに ぶつかった／深すぎる 枝を あきらめた。
         ★「解けない（確定）」＝ 手を ぜんぶ 出し切って 勝てる道が 1本も 無かった。
         この 2つを 混ぜない こと（ルル §2-3 の 大事な 区別）。 */
      ok: won, unknown: !won && (cut || deep),
      moves: won ? path.slice() : null,
      nodes: nodes, ms: Date.now() - t0, maxCol: maxCol
    };
  }

  /* ★ 見つけた 手順を 本当に ゲームに 流しこんで 勝てるか たしかめる
     （仕様 §2-4「必ず 最初に やること」・§8-1の 2番）
     ⚠️ 一致を 見るのは legalMoves ―― つまり **遊ぶ人が 出せる 手**と
        同じ ものさし。ここを 通れば 保証は うそに ならない。 */
  function replay(seed, moves) {
    var g = makeDeal(seed);
    for (var i = 0; i < moves.length; i++) {
      var legal = legalMoves(g), ok = false, m = moves[i];
      for (var j = 0; j < legal.length; j++) {
        var L = legal[j];
        if (L.k !== m.k) continue;
        if (m.k === 'TT' && (L.from !== m.from || L.n !== m.n || L.to !== m.to)) continue;
        if (m.k === 'TF' && L.from !== m.from) continue;
        if (m.k === 'TC' && L.from !== m.from) continue;
        if (m.k === 'CT' && (L.from !== m.from || L.to !== m.to)) continue;
        if (m.k === 'CF' && L.from !== m.from) continue;
        if (m.k === 'FT' && (L.s !== m.s || L.to !== m.to)) continue;
        ok = true; break;
      }
      if (!ok) return { ok: false, at: i, why: '合法でない手（' + m.k + '）' };
      doMove(g, m);
      if (countAll(g) !== 52) return { ok: false, at: i, why: '札が52枚でない' };
    }
    return { ok: isWin(g), at: moves.length, why: isWin(g) ? '' : '勝てていない' };
  }

  /* ============================================================
     ★ 自動プレイ（仕様 §8-1・数える 道具）
     ------------------------------------------------------------
     人らしい 打ち方（先を 読まない・目の前の 得だけ 取る）で 1試合を まわす。
     ここで 出た 数字だけを 報告に 書く ―― 形容詞で 片づけない。
     ★ ⑦「いちど運べる枚数で 止まった 割合」も ここで 数える。
     ============================================================ */
  /* 打ちたい 順に ならべる。
     ★ 点数表を 手で 書くと ロボットが すぐ 詰んで、出てくる 数字が 何の 役にも
       立たない（最初に そう なった ―― 中央値 28手・詰み 24%）。
       そこで **1手 先だけ 見て、いちばん 良く なる 手を 打つ**（heuristic）。
       先は 読まない ので「人らしい 打ち方」の ままで、腕だけ 上がる。
     ★ 空き場へ 逃がす（TC）と 空いた列へ ただ 移す だけの 手は、
       ほかに 手が あるなら 後回し ―― 人も そう 打つ。 */
  function scoredMoves(g) {
    var mvs = legalMoves(g, { found: false }), out = [], i;
    for (i = 0; i < mvs.length; i++) {
      var m = mvs[i], pen = 0;
      if (m.k === 'TC') pen = 4;                        // 空き場を 1つ 使う
      else if (m.k === 'TT' && !g.cols[m.to].length) pen = 2;   // 空いた列を 1つ 使う
      else if (m.k === 'TF' || m.k === 'CF') {
        var c = m.k === 'CF' ? g.free[m.from] : g.cols[m.from][g.cols[m.from].length - 1];
        if (!safeCard(g, c)) pen = 3;                   // 上げすぎは 損に なり やすい
      }
      doMove(g, m, { hist: false });
      var h = heuristic(g) + pen;
      undoBack(g, m);
      out.push({ m: m, sc: -h });
    }
    out.sort(function (a, b) { return b.sc - a.sc; });
    return out;
  }
  /* hist を 使わずに 1手だけ 戻す（下見 用）
     ⚠️ 名前を undoOne に しない こと ―― 画面側の「もどす」ボタンと 同じ 名前に なり、
        巻き上げで **あとの ほうが 勝つ**。実際に そう なって、ロボットの 札が
        1試合で 7枚 消えた。同じ 中かっこの 中では 名前を かぶらせない。 */
  function undoBack(g, m) { g.hist.push({ k: m.k, mv: m }); undoMove(g); }

  /* ★ §4-3 の 検算：いま「並びとしては 置けるのに、枚数が 足りなくて 運べない」手が
     いくつ あるか。★ここだけは maxMove を 使わずに 数える（上限を 外して 数える）。 */
  function blockedCount(g) {
    var blocked = 0, all = 0, i, j, k, col, t, c, n;
    var mm = maxMove(g, null), emptyCol = -1;
    for (i = 0; i < 8; i++) if (!g.cols[i].length) { emptyCol = i; break; }
    for (j = 0; j < 8; j++) {
      t = g.cols[j]; if (!t.length) continue;
      c = t[t.length - 1];
      for (i = 0; i < 8; i++) {
        if (i === j) continue;
        col = g.cols[i]; if (!col.length) continue;
        n = runLen(col);
        for (k = 1; k <= n; k++) {
          if (canStack(col[col.length - k], c)) { all++; if (k > mm) blocked++; break; }
        }
      }
    }
    if (emptyCol >= 0) {
      var mme = maxMove(g, emptyCol);
      for (i = 0; i < 8; i++) {
        col = g.cols[i]; if (!col.length) continue;
        n = runLen(col);
        for (k = 1; k <= n; k++) { if (k === col.length) continue; all++; if (k > mme) blocked++; }
      }
    }
    return { all: all, blocked: blocked };
  }

  function playOne(seed, cap) {
    cap = cap || 600;
    var g = makeDeal(seed), i, err = null, maxCol = 0;
    var seen = new Set(); seen.add(stateKey(g));
    var blockAll = 0, blockNo = 0, spots = 0, spotsWithBlock = 0, autoAt = -1;

    for (i = 0; i < 8; i++) if (g.cols[i].length > maxCol) maxCol = g.cols[i].length;

    for (i = 0; i < cap; i++) {
      if (isWin(g)) break;
      if (allSorted(g)) {                               // ★ 勝ち確定（仕様 §5-5）
        if (autoAt < 0) autoAt = 52 - (g.found[0] + g.found[1] + g.found[2] + g.found[3]);
        var guard = 0, f;
        while (!isWin(g) && guard++ < 200 && (f = foundMove(g))) doMove(g, f);
        break;
      }
      var b = blockedCount(g);
      spots++; blockAll += b.all; blockNo += b.blocked;
      if (b.blocked > 0) spotsWithBlock++;

      var cand = scoredMoves(g), acted = false;
      for (var ci = 0; ci < cand.length; ci++) {
        doMove(g, cand[ci].m);
        if (seen.has(stateKey(g))) { undoMove(g); continue; }   // 同じ 場面に 戻る 手は 打たない
        seen.add(stateKey(g)); acted = true; break;
      }
      if (!acted) break;                                 // 打つ手が 無い（詰み）

      if (countAll(g) !== 52) { err = '札が52枚でない（' + countAll(g) + '枚）'; break; }
      for (var q = 0; q < 8; q++) if (g.cols[q].length > maxCol) maxCol = g.cols[q].length;
    }
    return {
      seed: seed, won: isWin(g), stuck: isStuck(g), moves: g.moves, maxCol: maxCol,
      end: g,                                            // ★終わった 場面（T86 の 検算で 使う）
      err: err, capped: i >= cap,
      blockAll: blockAll, blockNo: blockNo, spots: spots, spotsWithBlock: spotsWithBlock,
      autoAt: autoAt
    };
  }

  /* ============================================================
     CORE を 外に 出す（Node からも ブラウザからも 同じ 中身）
     ============================================================ */
  var CORE = {
    TUNE: TUNE, SUITS: SUITS, RANKS: RANKS,
    suitOf: suitOf, rankOf: rankOf, isRed: isRed, nameOf: nameOf,
    mulberry32: mulberry32, makeDeal: makeDeal,
    canStack: canStack, canToFound: canToFound, runLen: runLen, isRun: isRun,
    freeCount: freeCount, emptyCount: emptyCount, maxMove: maxMove,
    legalMoves: legalMoves, applyMove: applyMove, doMove: doMove, undoMove: undoMove,
    isWin: isWin, isStuck: isStuck, hasPlay: hasPlay, ftRevives: ftRevives, countAll: countAll,
    allSorted: allSorted, foundMove: foundMove, cloneState: cloneState, stateKey: stateKey,
    solve: solve, replay: replay, playOne: playOne, safeUp: safeUp, safeCard: safeCard,
    blockedCount: blockedCount
  };
  root.FREECELL_CORE = CORE;
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
     ・★ T83で 55枚 280×424px・2.01MB に 軽く なった。
       それでも フリーセルは **配った瞬間に 52枚 ぜんぶ** 要る ので、
       絵は「表に なった 札だけ」ではなく 52枚 まとめて 要る（仕様 §3-2）。
     ・★ 裏面（トランプ裏赤）は **1枚も 使わない**。10本で 唯一。 */
  var CARD_DIR = '../cards/';
  function cardSrc(name) { return CARD_DIR + encodeURIComponent(name) + '.png'; }

  /* ============================================================
     ★★ クリアできる 配りの 一覧（仕様 §2）★★
     ------------------------------------------------------------
     36進数 6文字ずつ で 種（配りの 番号）が ならんでいる。
     作りかた ―― logs/T84_フリーセル_配り作り.cjs を Node で 走らせた。
       ① 種から 配る（makeDeal）
       ② 上の CORE の solve() に かける
       ③ ★見つけた 手順を replay() で **本当に ゲームに 流しこんで 勝てるか**
          たしかめる（1つでも 通らなければ その場で 中止する 作り）
       ④ 通った 種だけ ここに 足す
     ★ ①〜③は 全部 この ファイルの CORE を 使っている ＝ ズレようが ない。
     ★ 遊ぶ ときは この 中から 1つ えらぶ だけ。ブラウザは 1回も 解かない。
     ============================================================ */
  var DEALS =
    '00000100000200000300000400000500000600000700000900000a00000b00000c00000d00000e00000f00000g' +
    '00000h00000i00000j00000k00000l00000m00000n00000o00000p00000q00000r00000s00000t00000u00000v' +
    '00000w00000x00000y00000z00001000001100001200001300001400001500001600001700001800001900001a' +
    '00001b00001c00001d00001e00001f00001g00001h00001i00001j00001k00001l00001m00001n00001o00001q' +
    '00001r00001s00001t00001u00001v00001w00001x00001y00001z000021000022000023000024000025000026' +
    '00002700002800002900002a00002b00002c00002d00002e00002f00002g00002h00002i00002j00002k00002l' +
    '00002m00002n00002o00002p00002q00002r00002s00002t00002u00002v00002w00002x00002y00002z000030' +
    '00003100003200003300003400003500003600003700003800003900003a00003b00003c00003d00003e00003f' +
    '00003g00003h00003i00003j00003k00003l00003m00003n00003o00003p00003q00003r00003s00003u00003v' +
    '00003w00003x00003y00003z00004000004100004200004300004400004500004600004700004800004a00004b' +
    '00004c00004d00004e00004f00004g00004h00004i00004j00004k00004l00004m00004n00004o00004p00004q' +
    '00004r00004s00004t00004u00004w00004x00004y000050000051000052000053000054000055000056000057' +
    '00005800005900005a00005b00005c00005d00005e00005f00005h00005i00005j00005k00005l00005m00005n' +
    '00005o00005p00005q00005s00005t00005u00005v00005w00005x00005y00005z000060000061000062000063' +
    '00006400006500006600006700006800006900006a00006b00006c00006d00006e00006f00006g00006h00006i' +
    '00006j00006k00006l00006m00006n00006o00006p00006q00006r00006s00006t00006u00006v00006w00006x' +
    '00006y00006z00007000007100007200007300007400007500007600007700007800007900007a00007b00007c' +
    '00007d00007e00007f00007g00007h00007i00007j00007k00007l00007m00007n00007o00007p00007q00007r' +
    '00007s00007t00007u00007v00007w00007x00007y00007z000080000081000082000083000084000085000086' +
    '00008700008800008900008a00008b00008c00008d00008e00008f00008g00008h00008i00008j00008k00008l' +
    '00008m00008n00008o00008p00008q00008r00008s00008t00008u00008v00008w00008x00008y00008z000090' +
    '00009100009200009300009400009500009600009700009800009900009a00009b00009c00009d00009e00009f' +
    '00009g00009h00009i00009j00009k00009l00009m00009n00009o00009p00009q00009r00009s00009t00009u' +
    '00009v00009w00009x00009y00009z0000a00000a10000a20000a30000a40000a50000a60000a70000a80000a9' +
    '0000aa0000ab0000ac0000ad0000ae0000af0000ag0000ah0000ai0000aj0000ak0000al0000am0000ao0000ap' +
    '0000aq0000ar0000as0000at0000au0000av0000aw0000ax0000ay0000az0000b00000b10000b20000b30000b4' +
    '0000b50000b60000b70000b80000b90000ba0000bb0000bd0000be0000bf0000bg0000bh0000bi0000bj0000bl' +
    '0000bm0000bn0000bo0000bp0000bq0000br0000bs0000bt0000bu0000bv0000bw0000bx0000by0000bz0000c0' +
    '0000c10000c20000c40000c50000c60000c70000c80000c90000ca0000cb0000cc0000cd0000ce0000cf0000cg' +
    '0000ch0000ci0000cj0000ck0000cl0000cm0000cn0000co0000cp0000cr0000cs0000ct0000cu0000cv0000cw' +
    '0000cx0000cy0000cz0000d00000d10000d20000d30000d40000d50000d60000d70000d80000d90000da0000db' +
    '0000dc0000dd0000de0000df0000dg0000dh0000di0000dj0000dk0000dl0000dm0000dn0000dp0000dq0000dr' +
    '0000ds0000dt0000du0000dv0000dw0000dx0000dy0000dz0000e00000e10000e20000e30000e40000e50000e6' +
    '0000e70000e80000e90000ea0000eb0000ec0000ed0000ee0000ef0000eg0000eh0000ei0000ej0000ek0000el' +
    '0000em0000en0000eo0000ep0000eq0000er0000es0000et0000eu0000ev0000ew0000ex0000ez0000f00000f1' +
    '0000f20000f30000f40000f60000f90000fa0000fb0000fc0000fd0000ff0000fg0000fh0000fi0000fj0000fk' +
    '0000fl0000fm0000fn0000fo0000fp0000fq0000fr0000fs0000ft0000fu0000fv0000fw0000fx0000fy0000fz' +
    '0000g00000g10000g20000g30000g40000g50000g60000g70000g80000g90000ga0000gb0000gc0000gd0000ge' +
    '0000gf0000gg0000gh0000gi0000gj0000gk0000gl0000gm0000gn0000go0000gp0000gq0000gr0000gt0000gu' +
    '0000gv0000gw0000gx0000gy0000gz0000h00000h10000h20000h30000h40000h50000h60000h70000h80000h9' +
    '0000ha0000hb0000hc0000hd0000he0000hg0000hh0000hi0000hj0000hk0000hl0000hm0000hn0000ho0000hp' +
    '0000hq0000hr0000hs0000hu0000hv0000hw0000hx0000hy0000hz0000i00000i10000i20000i30000i40000i5' +
    '0000i60000i70000i80000i90000ia0000ib0000ic0000id0000ie0000if0000ig0000ih0000ii0000ij0000ik' +
    '0000il0000im0000in0000io0000ip0000iq0000ir0000is0000it0000iu0000iv0000iw0000ix0000iy0000iz' +
    '0000j00000j10000j20000j30000j40000j50000j60000j70000j80000j90000ja0000jb0000jc0000jd0000je' +
    '0000jf0000jg0000jh0000ji0000jk0000jl0000jm0000jn0000jo0000jp0000jq0000jr0000jt0000ju0000jv' +
    '0000jw0000jx0000jy0000jz0000k00000k10000k20000k30000k40000k50000k60000k70000k80000k90000ka' +
    '0000kb0000kc0000kd0000kf0000kg0000kh0000ki0000kj0000kk0000kl0000km0000kn0000ko0000kp0000kq' +
    '0000kr0000ks0000kt0000ku0000kw0000kx0000ky0000kz0000l00000l10000l20000l30000l40000l50000l6' +
    '0000l70000l80000l90000la0000lb0000lc0000ld0000lf0000lg0000lh0000li0000lj0000lk0000ll0000ln' +
    '0000lo0000lp0000lq0000lr0000ls0000lt0000lu0000lv0000lw0000lx0000ly0000lz0000m00000m10000m2' +
    '0000m30000m40000m50000m60000m70000m80000m90000ma0000mb0000mc0000md0000me0000mf0000mg0000mh' +
    '0000mi0000mj0000mk0000ml0000mm0000mn0000mo0000mp0000mq0000mr0000ms0000mt0000mu0000mv0000mw' +
    '0000mx0000my0000mz0000n00000n10000n20000n30000n40000n50000n60000n70000n80000n90000na0000nb' +
    '0000nc0000nd0000ne0000nf0000ng0000nh0000ni0000nj0000nk0000nl0000nm0000nn0000no0000np0000nq' +
    '0000nr0000ns0000nt0000nu0000nv0000nw0000nx0000ny0000nz0000o10000o20000o30000o40000o50000o6' +
    '0000o70000o80000o90000oa0000ob0000oc0000od0000oe0000of0000og0000oh0000oi0000oj0000ok0000ol' +
    '0000om0000on0000oo0000op0000oq0000os0000ot0000ou0000ov0000ow0000ox0000oy0000oz0000p00000p1' +
    '0000p20000p30000p40000p50000p70000p80000p90000pa0000pb0000pc0000pd0000pe0000pf0000pg0000ph' +
    '0000pi0000pj0000pk0000pl0000pm0000pn0000po0000pp0000pq0000pr0000pt0000pu0000pv0000pw0000px' +
    '0000py0000pz0000q00000q10000q20000q30000q40000q50000q60000q70000q80000q90000qa0000qb0000qc' +
    '0000qd0000qe0000qf0000qg0000qh0000qi0000qj0000qk0000qm0000qn0000qo0000qp0000qq0000qr0000qs' +
    '0000qt0000qu0000qv0000qw0000qx0000qy0000qz0000r00000r10000r20000r30000r40000r50000r60000r7' +
    '0000r80000r90000ra0000rb0000rc0000rd0000re0000rf0000rg0000rh0000ri0000rj0000rk0000rl0000rm' +
    '0000rn0000ro0000rp0000rq0000rr0000rs0000rt0000ru0000rv0000rw0000rx0000ry0000rz0000s00000s1' +
    '0000s20000s30000s40000s50000s60000s70000s90000sa0000sb0000sc0000sd0000se0000sf0000sg0000sh' +
    '0000si0000sj0000sk0000sl0000sm0000sn0000so0000sp0000sq0000sr';
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
  var busy = false, autoTimer = 0, fallStop = null, shakeTimer = 0;
  var geo = { cw: 43, ch: 65, gap: 1, ovUp: 29, rowGap: 8, x0: 0, lift: 30, colH: 0 };

  function say(t) { $('happyBubble').textContent = t; }

  /* ============================================================
     ★★ 寸法（仕様 §1-5）★★
     ------------------------------------------------------------
     ここが この ゲームの 心臓。★決めているのは 画面に よって ちがう：
       375px・320px … **横**（8列 入るか）
       1000×900     … **たて**（1列19枚 入るか）
     どちらでも「19枚が 入る」を 満たす 大きさ しか 返さない。
     → ★見切れも しぼり込みも 一生 要らない（社長裁定4・仕様 §1-4）。

     ★ たてが 余ったら、余りを まるごと「つかむ帯」に 配る（スパイダー T72 の 形）。
       フリーセルは 裏向きが 1枚も 無い ので、たての 予算が まるごと 帯に 回る
       ―― これが 375pxで 29px（会社で いちばん 広い 帯）に なる 理由。
     ============================================================ */
  function fit(W, H, gap) {
    var N = TUNE.MAX_COL;
    for (var w = TUNE.CARD_MAX; w >= 20; w--) {
      if (w * 8 + gap * 7 > W) continue;                  // 横に 8列 入るか
      var h = Math.round(w * TUNE.RATIO);
      var ovUp = Math.max(4, Math.round(h * TUNE.OVER_UP));
      var rowGap = Math.max(8, Math.round(h * 0.11));
      var body = H - (h + rowGap);                        // 上の段を のぞいた 場札の たて
      var need = (N - 1) * ovUp + h;                      // ★ 1列19枚（裏向きは 0枚）
      if (need > body) continue;
      /* ★ 余った たてを まるごと 帯に 配る（上限は 札の 45%）*/
      var grow = Math.floor((body - need) / (N - 1));
      if (grow > 0) ovUp = Math.min(Math.round(h * TUNE.OVER_UP_MAX), ovUp + grow);
      return { cw: w, ch: h, ovUp: ovUp, rowGap: rowGap, gap: gap, colH: (N - 1) * ovUp + h };
    }
    var h2 = Math.round(20 * TUNE.RATIO);
    return { cw: 20, ch: h2, ovUp: Math.max(4, Math.round(h2 * .25)), rowGap: 8, gap: gap, colH: 0 };
  }

  function layout() {
    if (!boardIn) return;
    cancelDrag();                       // ★ 大きさが 変わる 前に 手を はなす
    var W = boardIn.clientWidth, H = boardIn.clientHeight;
    if (!W || !H) return;
    /* ★ 列の 間を 決め打ちしない（ルル §1-1 の 反省を そのまま 借りる）。
       いくつか 試して、札が いちばん 大きく なる ものを 取る。
       同じ 大きさなら 広い すきまを 選ぶ（PCは たてで 決まるので すきまが 余る）。 */
    var gaps = W >= 620 ? [16, 12, 8, 4] : [4, 3, 2, 1];
    var got = null;
    for (var i = 0; i < gaps.length; i++) {
      var t = fit(W, H, gaps[i]);
      if (!got || t.cw > got.cw) got = t;
    }
    geo = got;
    geo.x0 = Math.max(0, Math.round((W - (geo.cw * 8 + geo.gap * 7)) / 2));
    geo.lift = Math.round(Math.min(TUNE.LIFT, geo.ch * 0.45));
    var r = document.documentElement.style;
    r.setProperty('--cw', geo.cw + 'px');
    r.setProperty('--ch', geo.ch + 'px');
    r.setProperty('--radius', Math.max(4, Math.round(geo.cw * 0.075)) + 'px');
    placeSpots();
    if (G) render(true);
  }

  function colX(i) { return geo.x0 + i * (geo.cw + geo.gap); }
  function tabY() { return geo.ch + geo.rowGap; }

  /* ── 置き場（4＋4＋8 ＝ 16か所）と 52枚の 札を 1回だけ 作る ───── */
  function build() {
    if (built) return;
    built = true;
    boardEl = $('board');
    boardIn = document.createElement('div');
    boardIn.className = 'board-in';
    boardEl.appendChild(boardIn);

    function spot(key, cls, label) {
      var d = document.createElement('div');
      d.className = 'spot' + (cls ? ' ' + cls : '');
      d.dataset.spot = key;
      if (label) d.textContent = label;
      boardIn.appendChild(d);
      spotEl[key] = d;
      return d;
    }
    /* ★ 上の段は 8枠。下の 8列の **真上に そのまま** そろえる（仕様 §1-3）。
       空き場と 組札の 間に すきまは 入れない ―― 入れると 上の段だけ 札が
       小さく なって、たての 線が そろわなく なる。
       区切りは「わくの 見た目」で つける（空き場＝空っぽの わく／組札＝うすいマーク）。 */
    for (var i = 0; i < 4; i++) spot('e' + i, 'is-cell');
    var MARK = ['♠', '♥', '♦', '♣'];
    for (var s = 0; s < 4; s++) spot('f' + s, 'is-found', MARK[s]);
    for (var j = 0; j < 8; j++) spot('c' + j, 'is-col');

    for (var c = 0; c < 52; c++) {
      var d = document.createElement('div');
      d.className = 'card';
      d.dataset.id = String(c);
      var inn = document.createElement('div');
      inn.className = 'card-in';
      var f = document.createElement('img'); f.className = 'cf'; f.alt = ''; f.draggable = false;
      f.onerror = (function (cc, el) { return function () { fallback(cc, el); }; })(c, inn);
      inn.appendChild(f);
      /* ★★ 文字の 札を **最初から** かぶせて おく（T103）★★
         ------------------------------------------------------------
         ★ フリーセルは 配った 瞬間に 52枚 ぜんぶ 表 ―― 絵が 届くまで 待つ
           という 逃げ道が 無い（神経衰弱は 1枚ずつ めくるので 待てた）。
         ★ だから **待たせない**。絵が 来る 前でも、その札が 何の札かは
           これが 見せている ＝ 盤は 1msも 白く ならず、★そのまま 遊べる。
         ★ 絵の **上に** かぶせる（下に 敷かない）。理由は 2つ：
           ① ブラウザは 絵を「届いた ぶんだけ」描く ことが ある
              → 上半分だけ 絵・下半分は 白、という 札を 見せない
           ② ★絵を opacity 0 で 消すと、**持ち上がった かげも 消える**
              （かげは 絵に かかって いる ―― `.card.is-drag img`）。
              ★かげは この ゲームで たった 1つの 手ごたえ なので、消しては いけない。
              かぶせる 形なら 絵は 出たまま ＝ ★かげは ちゃんと 出る。
         ★ 絵が そろったら この 札を **外す**（faceOn）。
           ★外した あとの 盤は、直す 前と まったく 同じ 中身に なる。
         ★ 新しい 部品は 作っていない ―― 元から あった
           「絵が 届かなかった ときの 下じき」を **先に 出しておく** だけ。 */
      fallback(c, inn);
      d.appendChild(inn);
      boardIn.appendChild(d);
      cardEl.push(d);
    }

    /* ★ 操作は Pointer Events だけ（T67・社長指示）
       HTML5 の draggable / dragstart / drop は 1つも 使わない ―― スマホで 動かない。
       ⚠️ ここに click は 足さない こと。足した 瞬間に
          「おしたら 勝手に 動く」が 生き返る。 */
    boardIn.addEventListener('pointerdown', onDown);
    boardIn.addEventListener('pointermove', onMove);
    boardIn.addEventListener('pointerup', onUp);
    boardIn.addEventListener('pointercancel', onCancel);
    boardIn.addEventListener('lostpointercapture', onCancel);
    boardIn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    boardIn.addEventListener('dragstart', function (e) { e.preventDefault(); });
    /* ★ ゆれ・空き場を 通る 動きが 終わったら 印を 外す（T62の 不具合を くり返さない）*/
    boardIn.addEventListener('animationend', onAnimEnd);
  }

  /* ★ 文字の 下じき。★T103から build() が **最初に 1回** 敷く（絵の 下）。
     絵が 読めなかった ときの onerror も ここへ 来るが、もう 敷いて あるので
     その ときは 何も しない（＝ 白い札に ならない のは 同じ）。 */
  function fallback(c, inn) {
    if (inn.querySelector('.fallback')) return;
    var d = document.createElement('div');
    d.className = 'fallback ' + (isRed(c) ? 'red' : 'black');
    d.textContent = (isRed(c) ? (suitOf(c) === 1 ? '♥' : '♦') : (suitOf(c) === 0 ? '♠' : '♣')) + RANKS[rankOf(c)];
    inn.appendChild(d);
  }

  /* ============================================================
     ★★ 絵の 先読み（T103・裏で こっそり）★★
     ------------------------------------------------------------
     ★ トライ T85 §🟢5 ―― 電波の 弱い所で「はじめる」を おすと、そこから
       52枚（1.83MB）を まとめて 読みに 行き、盤が 白いまま だった。
     ★ 直し方は 神経衰弱（T81）と 同じ **B（先読み）＋ A（絵が 来てから 出す）**。
       ただし A の 中身が ちがう ―― フリーセルには「めくる」瞬間が 無く、
       ★配った 瞬間に 52枚 ぜんぶ 要る ので「来るまで 待つ」が できない。
       ★だから A の 代わりに **下じきを 先に 出しておく**（build を 見る）。
       ★時計と 競争しない ぶん、フリーセルの ほうが 素直に 直せる。

     ★ ここで やる ことは 3つ だけ：
       ① はじめの画面が 出た 瞬間から 裏で 読み始める（「はじめる」を 待たない）
       ② ★4本ずつ しか 流さない ―― まとめて 52本 出すと、細い線では
          ★52枚とも 終わりに ならないと 1枚も 出そろわない（全部 同時に 少しずつ 進む）。
          4本ずつ なら **1枚ずつ 順に 出てくる** ＝ 盤が 上から 埋まっていく。
       ③ 配りが 決まったら、残りを ★盤の 読む順（上の段から 下へ）に ならべ直す
     ★ 「読み込み中」の 文字は 1つも 出さない（設計図 §5.5）。
       ★進み具合の 棒も 出さない。★出るのは 盤が 埋まっていく 動きだけ。
     ============================================================ */
  var warmQueue = [], warmRun = 0, warmDone = 0, warmFail = 0, warmT0 = 0, warmT1 = 0;
  var warmSent = {};                 // 読み始めた 札（重ねて 出さない ため）

  /* ★絵が **ぜんぶ 届いてから** 文字の 札を 外す（＝ 絵が 出る）。
     ★薄く 出す 動き（transition）には しない ―― 動きは 走らない ことが ある
       （画面が 裏に まわると 止まる）。★止まったら 絵が 出ない ままに なる。
       ★外すのは 1行なので **必ず 効く**。
     ★これで 絵が そろった 後の 盤は、直す 前と **まったく 同じ 中身**に なる。
     ★絵が 読めなかった 札（onerror）には ここが 来ない ので 文字の 札が 残る
       ―― 白い札に ならない のは 前と 同じ。
     ★速い回線では 盤を 開く 前に 終わって いる ので 1度も 目に 入らない。 */
  function faceOn(c) {
    var inn = cardEl[c] && cardEl[c].firstChild;
    if (!inn) return;
    var fb = inn.querySelector('.fallback');
    if (fb) inn.removeChild(fb);
  }

  function warmNext() {
    while (warmRun < TUNE.WARM_PAR && warmQueue.length) {
      (function (c) {
        var f = cardEl[c].firstChild.querySelector('img');
        if (warmSent[c]) { return; }
        warmSent[c] = 1; warmRun++;
        f.addEventListener('load', function () {
          warmRun--; warmDone++; faceOn(c);
          if (!warmQueue.length && !warmRun) warmT1 = Date.now();
          warmNext();
        });
        f.addEventListener('error', function () {
          warmRun--; warmFail++;
          if (!warmQueue.length && !warmRun) warmT1 = Date.now();
          warmNext();
        });
        f.src = cardSrc(nameOf(c));
      })(warmQueue.shift());
    }
  }
  function warmStart() {
    warmT0 = Date.now();
    for (var c = 0; c < 52; c++) warmQueue.push(c);
    warmNext();
  }
  /* 配りが 決まった とき ―― まだ 来ていない 札を「盤の 読む順」に ならべ直す。
     ★上の 段から 下へ、左から 右へ。★人の 目が なぞる 順に 埋まる ので、
       「まだ 来ている 途中」だと ひとめで 分かる（★文字は 1つも 使わない）。
     ★すでに 読み始めた 札は そのまま（読み直しは 1回も しない）。 */
  function warmOrder() {
    if (!G || !warmQueue.length) return;
    var want = [], i, k, seen = {};
    for (i = 0; i < 4; i++) if (G.free[i] >= 0) want.push(G.free[i]);
    for (k = 0; k < TUNE.MAX_COL; k++) {
      for (i = 0; i < 8; i++) if (G.cols[i].length > k) want.push(G.cols[i][k]);
    }
    for (i = 0; i < want.length; i++) seen[want[i]] = 1;
    var rest = warmQueue.filter(function (c) { return !seen[c]; });
    warmQueue = want.filter(function (c) { return warmQueue.indexOf(c) >= 0; }).concat(rest);
  }

  function placeSpots() {
    function put(el, x, y) {
      el.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      el.style.width = geo.cw + 'px'; el.style.height = geo.ch + 'px';
    }
    for (var i = 0; i < 4; i++) put(spotEl['e' + i], colX(i), 0);
    for (var s = 0; s < 4; s++) {
      put(spotEl['f' + s], colX(4 + s), 0);
      spotEl['f' + s].style.fontSize = Math.round(geo.cw * 0.55) + 'px';
    }
    for (var j = 0; j < 8; j++) put(spotEl['c' + j], colX(j), tabY());
  }

  /* ── 並べる ─────────────────────────────────
     置き場所は transform だけで 決める ので、変わった ぶんが
     そのまま すべる 動きに なる（別に 飛ばす 仕組みを 作らない）。 */
  var lastTf = [], lastPos = [], flyTimer = [], relayTimer = [];
  function flyMark(c, el) {
    el.classList.add('is-fly');
    clearTimeout(flyTimer[c]);
    flyTimer[c] = setTimeout(function () { el.classList.remove('is-fly'); }, TUNE.MOVE + 40);
  }
  function flyClear() {
    for (var i = 0; i < cardEl.length; i++) {
      clearTimeout(flyTimer[i]); clearTimeout(relayTimer[i]);
      if (cardEl[i]) { cardEl[i].classList.remove('is-fly'); cardEl[i].classList.remove('is-relay'); }
    }
  }

  function place(c, x, y, z) {
    var el = cardEl[c];
    var tf = 'translate(' + x + 'px,' + y + 'px)';
    /* ⚠️ 「動いたか」を el.style.transform と くらべて 見ては いけない
       （ブラウザが 文字を 書き直す ので いつでも「ちがう」に なる）。
       ここで 入れた 文字を 自分で 覚えて おいて くらべる。 */
    if (lastTf[c] !== tf) {
      lastTf[c] = tf;
      el.style.transform = tf;
      if (!boardEl.classList.contains('no-anim') && !el.classList.contains('is-drag')) flyMark(c, el);
    }
    lastPos[c] = [x, y];
    el.style.zIndex = String(z);
    /* ★T103：絵は 先読み（warmStart）が 面倒を 見る。
       ここで 52枚 まとめて src を 入れると、せっかくの 4本ずつが 崩れる。
       ★念のための 保険 ―― 何かの 拍子に 列から 落ちていたら 積み直すだけ。 */
    if (!warmSent[c] && warmQueue.indexOf(c) < 0) { warmQueue.push(c); warmNext(); }
  }

  function render(instant) {
    if (!G) return;
    if (instant) { boardEl.classList.add('no-anim'); flyClear(); }
    var z = 1, i, s, r, y, col, k;

    for (i = 0; i < 4; i++) {
      if (G.free[i] >= 0) place(G.free[i], colX(i), 0, z++);
      spotEl['e' + i].classList.toggle('is-filled', G.free[i] >= 0);
    }
    for (s = 0; s < 4; s++) {
      for (r = 0; r < G.found[s]; r++) place(s * 13 + r, colX(4 + s), 0, z++);
      spotEl['f' + s].classList.toggle('is-filled', G.found[s] > 0);
    }
    for (i = 0; i < 8; i++) {
      col = G.cols[i]; y = tabY();
      for (k = 0; k < col.length; k++) { place(col[k], colX(i), y, z++); y += geo.ovUp; }
    }
    if (instant) { void boardEl.offsetWidth; boardEl.classList.remove('no-anim'); }
  }

  /* ============================================================
     ★★ 操作 ★★
     ------------------------------------------------------------
       つまんで 運ぶ … **札の 移動は 全部 これ**（設計図 追記④）
       2回 続けて おす … 右上（組札）へ 上げる。送り先が 1つに 決まる から
                        ★空き場へ 逃がすのは 割り当てない（4つの どれか が 決まらない）
                        ★上げられない ときは **何も 起きない**（仕様 §6-2）
     ★ 置ける場所は 光らせない（設計図 追記②）。どこに 置くかは 必ず 人が 決める。
     ============================================================ */
  function findCard(c) {
    for (var i = 0; i < 4; i++) if (G.free[i] === c) return { z: 'cell', i: i };
    var s = suitOf(c);
    if (rankOf(c) < G.found[s]) return { z: 'found', s: s, top: rankOf(c) === G.found[s] - 1 };
    for (var j = 0; j < 8; j++) {
      var k = G.cols[j].indexOf(c);
      if (k >= 0) return { z: 'col', i: j, k: k };
    }
    return { z: '?' };
  }

  /* ── ① どの札を つかんだか ──────────────────────
     ★ フリーセルの 列は「正しい 並び」に なっているとは かぎらない
       （はじめの 配りが そのまま 残っている ため）。
       だから ソリティアと ちがい、**つかめるか どうかの 判定が 要る**。
     返り値の no は「つかめない 理由」―― 画面の 返事を 分ける ために 使う：
       'run'   … その下が 正しい 並びに なっていない → **その札 1枚**が ゆれる
       'count' … ★§4 の 決まりで 枚数が 足りない    → **つかんだ かたまり**が ゆれる
     ★ ゆれの かたちが そのまま「何が だめか」を 指す。文字は 1つも 足さない。 */
  function grabAt(c) {
    var p = findCard(c);
    if (p.z === 'cell') return { kind: 'cell', i: p.i, card: c, cards: [c] };
    if (p.z === 'found') return p.top ? { kind: 'found', s: p.s, card: c, cards: [c] } : null;
    if (p.z === 'col') {
      var col = G.cols[p.i];
      if (!isRun(col, p.k)) return { no: 'run', card: c };
      var cards = col.slice(p.k);
      /* ★★ §4 の 決まり（社長裁定2）★★
         いちばん 良い 場合（行き先が 空いていない 列）でも 運べない 枚数なら、
         **持ち上がらない**。つかんだ かたまりが ぷるっと ゆれる だけ。
         → 断られる 場所が「行き先」ではなく「手元」に なる ので、
           目が 手元（列と、その 上の 空き場）に 向く。 */
      if (cards.length > maxMove(G, null)) return { no: 'count', i: p.i, k: p.k, cards: cards };
      return { kind: 'col', i: p.i, k: p.k, card: c, cards: cards };
    }
    return null;
  }

  /* ── ② 落とした 先を さがす ────────────────────
     指の 位置では なく **運んでいる 札の 四角**で 見る。
     いちばん 大きく 重なった 置き場を 選ぶ。どこにも かからなければ null。 */
  function dropZone(x, y) {
    var best = null, bestA = 0, i, a;
    var cw = geo.cw, ch = geo.ch;
    function over(zx, zy, zw, zh) {
      var w = Math.min(x + cw, zx + zw) - Math.max(x, zx);
      var h = Math.min(y + ch, zy + zh) - Math.max(y, zy);
      return (w > 0 && h > 0) ? w * h : 0;
    }
    for (i = 0; i < 4; i++) { a = over(colX(i), 0, cw, ch); if (a > bestA) { bestA = a; best = { t: 'e', i: i }; } }
    for (i = 0; i < 4; i++) { a = over(colX(4 + i), 0, cw, ch); if (a > bestA) { bestA = a; best = { t: 'f', s: i }; } }
    /* 場札の 列は **下まで まるごと** 受ける ―― 長い列の どこに 落としても 入る */
    var top = tabY(), colH = Math.max(ch, boardIn.clientHeight - top);
    for (i = 0; i < 8; i++) { a = over(colX(i), top, cw, colH); if (a > bestA) { bestA = a; best = { t: 'c', j: i }; } }
    return best;
  }

  /* ── ③ その 置きかたは ルール上 通るか（通らなければ null）────
     ⚠️ ここは「置けるか どうか」を 見るだけ。行き先を **探さない**。 */
  function moveFor(g0, z) {
    if (!g0 || !z) return null;
    var c = g0.card, n = g0.cards.length;
    if (z.t === 'e') {                                   // 空き場へ
      if (n !== 1) return null;                          // 1つに 1枚だけ（ルール6）
      if (G.free[z.i] >= 0) return null;
      if (g0.kind === 'cell') return null;               // 空き場 → 空き場 は 手では ない
      if (g0.kind === 'found') return null;              // 組札から 空き場へは 戻せない
      return { k: 'TC', from: g0.i, to: z.i };
    }
    if (z.t === 'f') {                                   // 組札へ
      if (g0.kind === 'found') return null;
      if (n !== 1) return null;
      if (suitOf(c) !== z.s || !canToFound(G, c)) return null;
      return g0.kind === 'cell' ? { k: 'CF', from: g0.i } : { k: 'TF', from: g0.i };
    }
    var j = z.j, t = G.cols[j];                          // 下の 8列へ
    if (g0.kind === 'col' && j === g0.i) return null;    // 同じ列に 戻すのは 手では ない
    if (t.length) { if (!canStack(c, t[t.length - 1])) return null; }
    /* ★ 空いた列には どの札でも 置ける（ルール7・ソリティアと ちがう ところ）*/
    if (g0.kind === 'col') {
      if (!t.length && n === G.cols[g0.i].length) return null;   // 列 まるごと → 空いた列 は 何も 変わらない
      /* ★★ §4 の 決まり その2 ★★
         空いた列へ 運ぶ ときは、その列を 数えない ＝ 運べる枚数が 半分に なる。
         つかむ ときには「行き先が 空いていない」前提で 通した ので、
         ここで 初めて 足りなく なる ことが ある。
         → 置けない ので 元に 戻る。★そのあと 同じ ゆれを 1回 出す
           （ゆれ ＝「枚数が 足りない」という 意味を 1つに そろえる ため）。 */
      if (n > maxMove(G, j)) return { no: 'count', i: g0.i, k: g0.k };
      return { k: 'TT', from: g0.i, n: n, to: j };
    }
    if (g0.kind === 'cell') return { k: 'CT', from: g0.i, to: j };
    return { k: 'FT', s: g0.s, to: j };                  // 組札 → 場札（ルール5）
  }

  /* ── ④ 2回 続けて おした ときだけ 使う「右上へ」（仕様 §6-2）──── */
  function toFoundation(g0) {
    if (!g0 || g0.no || g0.kind === 'found') return null;
    if (g0.cards.length !== 1) return null;
    if (!canToFound(G, g0.card)) return null;
    return g0.kind === 'cell' ? { k: 'CF', from: g0.i } : { k: 'TF', from: g0.i };
  }

  /* ============================================================
     ★ 「それは だめ」の ゆれ（スパイダー T73 の 形を そのまま）
     ------------------------------------------------------------
     置き場所は transform で 決めて いるので、ゆらす 前に その 場所を
     --sx / --sy に 入れて おく（入れないと 左上に 飛ぶ）。
     ★ 画面に ある 強調は これ 1種類だけ（設計図 §5.5）。
     ★★ ゆれの 意味を **1つに そろえる** ★★
        ゆれる ＝「その札／その枚数は 持てない」（手元の 問題）
        だまって 元に 戻る ＝「そこには 置けない」（行き先の 問題）
        ★ルル §4-4 の いちばんの ねらい ―― 2つの ちがう 失敗を
          同じ 見え方に しない ―― は、この 区別で 守っている。
     ============================================================ */
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
  function shakeOne(c) {
    var el = cardEl[c], p = lastPos[c];
    if (!el || !p) return;
    el.style.setProperty('--sx', p[0] + 'px');
    el.style.setProperty('--sy', p[1] + 'px');
    el.classList.remove('is-no');
    void el.offsetWidth;                                 // ★ 連続で おしても 毎回 ゆれる
    el.classList.add('is-no');
  }
  /* ★ 運べない 枚数を つかんだ ―― **その かたまり 全部**が ゆれる。
     ゆれる かたまりの 大きさが、そのまま「この 枚数が だめ」を 指す。 */
  var shakeCount = 0;
  function shakeRun(cards) {
    for (var i = 0; i < cards.length; i++) shakeOne(cards[i]);
    shakeCount++;
    beep();
  }
  function onAnimEnd(e) {
    if (e.animationName === 'shakeNo') e.target.classList.remove('is-no');
    else if (e.animationName === 'relayHop') e.target.classList.remove('is-relay');
  }

  /* ============================================================
     ★★ 空き場を 通っていく 動き（仕様 §4-5・裁定2の 伝え方②）★★
     ------------------------------------------------------------
     ★ これは 演出では ありません。**本当に そうやって 運んで いる** のです。
       「まとめて 運ぶ」は 新しい ルールでは なく、人が 1枚ずつ 手で やれる ことを
       1回の 引っぱりで まとめただけ ―― だから 空き場を 使う ぶんしか 運べない。
       その 理由が、説明では なく **そのもの** として 目に 見える。
     ★ 文字は 1文字も 増えません。光りません（追記②を 守ったまま）。

     作り：札には すでに render() が **行き先**の transform を 入れてある。
       その上に「出発 → 空き場 → 行き先」の 3点を 通る アニメを 1回だけ かける。
       終われば 消えるので、置き場所は 何も ずれない。
     ⚠️ 動いて いる あいだ その札は おせない（is-relay ＝ pointer-events:none）。
        ★盤の ほかの ところは 動かせる まま ―― 待たせない。
     ============================================================ */
  function relay(cards, startPos) {
    /* 空いている 空き場を 手前から。運ぶ 札の うち **下の ほう**（＝ 先に
       どかす 札）が 空き場を 通る。一番 上の 札は そのまま 行き先へ 乗る。 */
    var slots = [];
    for (var i = 0; i < 4; i++) if (G.free[i] < 0) slots.push(i);
    var k = Math.min(cards.length - 1, slots.length);
    if (k <= 0) return;
    for (var n = 1; n <= k; n++) {
      var c = cards[n], el = cardEl[c], s0 = startPos[n], s2 = lastPos[c], sx = colX(slots[n - 1]);
      if (!el || !s0 || !s2) continue;
      el.style.setProperty('--rx0', s0[0] + 'px');
      el.style.setProperty('--ry0', s0[1] + 'px');
      el.style.setProperty('--rx1', sx + 'px');
      el.style.setProperty('--ry1', '0px');
      el.style.setProperty('--rx2', s2[0] + 'px');   // ★ 行き先（render() が 入れた 場所）
      el.style.setProperty('--ry2', s2[1] + 'px');
      el.style.animationDelay = Math.min(3, n - 1) * TUNE.RELAY_STAG + 'ms';
      el.classList.remove('is-relay');
      void el.offsetWidth;
      el.classList.add('is-relay');
      /* ★ 保険：animationend が 来なかった ときでも 必ず 印を 外す。
         is-relay は pointer-events:none なので、付けっぱなしに なると
         その札が **二度と おせなく なる**（T69 で ソリティアが 同じ 穴に 落ちた
         ―― あちらは transitionend を 待って いた）。時間なら 何が あっても もどる。 */
      clearTimeout(relayTimer[c]);
      relayTimer[c] = setTimeout((function (e2) {
        return function () { e2.classList.remove('is-relay'); };
      })(el), TUNE.RELAY + TUNE.RELAY_STAG * 3 + 60);
    }
  }

  /* ============================================================
     ★ 運ぶ 本体（1本の 指だけ・setPointerCapture つき）
     ============================================================ */
  var drag = null;
  var lastTap = { c: -1, t: 0, x: 0, y: 0 };

  function lift(d) {
    d.live = true;
    d.oy -= geo.lift;                                    // ★ 指より 上へ ずらす（判定も 一緒に）
    for (var i = 0; i < d.src.cards.length; i++) {
      var el = cardEl[d.src.cards[i]];
      el.classList.add('is-drag');
      el.style.zIndex = String(900 + i);
    }
  }
  function follow(d) {
    for (var i = 0; i < d.src.cards.length; i++) {
      var c = d.src.cards[i];
      var tf = 'translate(' + d.x + 'px,' + (d.y + i * geo.ovUp) + 'px)';
      lastTf[c] = tf;                                    // ★ place() の 控えも 書きかえる
      lastPos[c] = [d.x, d.y + i * geo.ovUp];
      cardEl[c].style.transform = tf;
    }
  }
  function unlift(d) {
    for (var i = 0; i < d.src.cards.length; i++) cardEl[d.src.cards[i]].classList.remove('is-drag');
    void boardIn.offsetWidth;
  }

  function onDown(e) {
    if (!G || G.over || busy) return;
    if (drag) return;                                    // ★ 2本目の 指は 見ない
    if (e.isPrimary === false) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    var t = e.target;
    var cEl = t.closest ? t.closest('.card') : null;
    if (!cEl) return;
    var g0 = grabAt(parseInt(cEl.dataset.id, 10));
    if (!g0) return;
    e.preventDefault();                                  // ★ ページを 動かさない

    /* ★ つかめない ―― 持ち上げない。ゆれるだけ（社長裁定2）*/
    if (g0.no) {
      if (g0.no === 'count') shakeRun(g0.cards);
      else shakeOne(g0.card);
      return;
    }

    var r = boardIn.getBoundingClientRect();
    var er = cardEl[g0.card].getBoundingClientRect();
    var d = {
      id: e.pointerId, src: g0, live: false, moved: false,
      sx: e.clientX - r.left, sy: e.clientY - r.top,
      rl: r.left, rt: r.top, ox: 0, oy: 0, x: 0, y: 0, card: g0.card
    };
    d.x = er.left - r.left; d.y = er.top - r.top;
    d.ox = d.x - d.sx; d.oy = d.y - d.sy;
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

    if (d.live) {                                        // 運んで いた → 落とす
      var mv = moveFor(d.src, dropZone(d.x, d.y));
      unlift(d);
      if (mv && !mv.no) { play(mv, d.src); return; }
      render();
      /* ★ 空いた列へ 運ぼうとして 枚数が 足りなかった ときだけ、
         元に 戻った あとで 同じ ゆれを 1回（ゆれ ＝ 枚数、で そろえる）。 */
      if (mv && mv.no === 'count') {
        var run = G.cols[mv.i].slice(mv.k);
        clearTimeout(shakeTimer);
        shakeTimer = setTimeout(function () { shakeRun(run); }, TUNE.MOVE + 20);
      }
      return;
    }
    if (d.moved) return;
    if (d.card < 0) return;

    /* 2回おし の 判定（1回だけ おしても 何も 起きない）*/
    var now = e.timeStamp || Date.now();
    var near = Math.abs(d.sx - lastTap.x) <= TUNE.DOUBLE_SLOP &&
               Math.abs(d.sy - lastTap.y) <= TUNE.DOUBLE_SLOP;
    if (lastTap.c === d.card && near && now - lastTap.t <= TUNE.DOUBLE_MS) {
      lastTap.c = -1;
      var up = toFoundation(d.src);
      if (up) play(up, d.src);                           // ★ 上げられない ときは 何も 起きない
      return;
    }
    lastTap = { c: d.card, t: now, x: d.sx, y: d.sy };
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

  /* ── 1手 打つ（★人の 手は かならず ここを 通る）───────── */
  function play(mv, g0) {
    /* まとめて 運ぶ ときは、出発の 場所を 先に 覚えて おく（空き場を 通る 動き 用）*/
    var relayCards = null, startPos = null;
    if (mv.k === 'TT' && mv.n >= 2) {
      relayCards = G.cols[mv.from].slice(G.cols[mv.from].length - mv.n);
      startPos = [];
      for (var i = 0; i < relayCards.length; i++) {
        var p = lastPos[relayCards[i]];
        startPos.push(p ? [p[0], p[1]] : null);
      }
    }
    doMove(G, mv);
    render();
    if (relayCards) relay(relayCards, startPos);
    updateTools();
    if (isWin(G)) { finish(); return; }
    if (allSorted(G)) { startAuto(); return; }           // ★ 勝ち確定（仕様 §5-5）
    if (isStuck(G)) showResult('stop');
  }

  function updateTools() {
    $('btnUndo').disabled = !G || !G.hist.length || busy;
  }

  /* ============================================================
     ★ 「どの列も 下ほど 小さい」に なった 瞬間、残り 全部が 勝手に 飛んでいく
        （仕様 §5-5・★証明ずみ）
     ------------------------------------------------------------
     ボタンは 作らない。文字も 出さない。人が 何かを おす 必要も ない。
     ★ 遊んでいる 最中に プログラムが 勝手に 札を 上げる ことは 一度も ない
       （設計図 追記②。ソリティアが T67 で 直した 形を そのまま 守る）。
     ============================================================ */
  function startAuto() {
    busy = true; updateTools();
    say('ぜんぶ そろう ところまで きたよ！　あとは まかせて！');
    autoTimer = setTimeout(autoStep, TUNE.AUTO_WAIT);
  }
  function autoStep() {
    if (isWin(G)) { busy = false; finish(); return; }
    var f = foundMove(G);
    if (!f) { busy = false; updateTools(); return; }     // 念のための 出口（理屈では 通らない）
    doMove(G, f, { hist: false });
    render();
    autoTimer = setTimeout(autoStep, TUNE.AUTO_STEP);
  }

  /* ── 勝ち ────────────────────────────────── */
  function finish() {
    busy = true; G.over = true; G.won = true;
    updateTools(); render();
    say('やったー！　52枚 ぜんぶ そろったね！');
    $('happyCat').classList.add('is-jump');
    autoTimer = setTimeout(startFall, TUNE.FALL_WAIT);
  }

  /* ★ 札が 降る 演出（仕様 §7-3。ソリティア・スパイダーと 同じ もの）*/
  function startFall() {
    var cv = $('fallCanvas');
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var Wp = window.innerWidth, Hp = window.innerHeight;
    cv.width = Math.round(Wp * dpr); cv.height = Math.round(Hp * dpr);
    cv.classList.remove('hidden');
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var src = [];
    for (var s = 0; s < 4; s++) src.push(spotEl['f' + s].getBoundingClientRect());
    var order = [], r, s2;
    for (r = 12; r >= 0; r--) for (s2 = 0; s2 < 4; s2++) order.push(s2 * 13 + r);

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
        var c = order[next], b = src[suitOf(c)];
        var img = cardEl[c].firstChild.firstChild;
        var dir = Math.random() < .5 ? -1 : 1;
        live.push({
          img: img, x: b.left, y: b.top, w: cw, h: ch,
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

  /* ★ 結果の 箱 ＋ 連打よけ（T62の 事故を くり返さない・仕様 §7-3）*/
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

  function showResult(kind) {
    G.over = true; busy = true; updateTools();
    var win = kind === 'win';
    $('resultTitle').textContent = win ? 'ぜんぶ そろった！' : 'うーん、止まった';
    $('resultTitle').classList.toggle('is-stop', !win);
    /* ★ 保証が ある からこそ 言える ひとこと（仕様 §2-5・§7-4）。
       配りは 必ず クリアできる ので、これは うそに ならない。 */
    var line = win ? 'やったー！　52枚 ぜんぶ そろったね！' : 'まだ クリアできるよ！　もどってみる？';
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

  /* ── 試合の 出し入れ ──────────────────────────── */
  function cancelAll() {
    cancelDrag();
    lastTap.c = -1;
    clearTimeout(autoTimer);
    clearTimeout(shakeTimer);
    if (fallStop) fallStop();
    $('fallCanvas').classList.add('hidden');
    $('happyCat').classList.remove('is-jump');
    hideResult();
    busy = false;
  }

  function openBoard() {
    $('titleScreen').classList.add('hidden');
    $('playScreen').classList.remove('hidden');
    $('tools').classList.remove('hidden');
    layout(); render(true); updateTools();
  }

  function newDeal() {
    cancelAll();
    G = makeDeal(pickSeed());
    warmOrder();                       // ★まだ 来ていない 絵を「盤の 読む順」に ならべ直す（T103）
    openBoard();
    say('この配り、ちゃんと クリアできるよ！');
  }

  function undoOne() {
    if (!G) return;
    cancelAll();                       // ← 箱を 閉じる・止まったを 解く のは ここ
    G.over = false; G.won = false;
    if (G.hist.length) undoMove(G);
    render();
    updateTools();
  }

  /* ── つなぐ ─────────────────────────────────── */
  function boot() {
    build();
    warmStart();          // ★はじめの画面が 出た その 瞬間から、裏で 52枚を 読み始める（T103）
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
      else newDeal();
    });
    $('btnSub').addEventListener('click', function () { if (!locked) newDeal(); });
    $('resultWrap').addEventListener('pointerdown', bumpLock, true);
    window.addEventListener('resize', layout);
    window.addEventListener('orientationchange', function () { setTimeout(layout, 120); });
    layout();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* ============================================================
     ★ たしかめ用の 窓口（window.FREECELL）
     ------------------------------------------------------------
     画面には 1つも 出さない（お客さんに 見せる 物では ない）。
     ============================================================ */
  function median(a) { if (!a.length) return 0; var b = a.slice().sort(function (x, y) { return x - y; }); return b[b.length >> 1]; }

  function autoPlay(n) {
    n = n || 100;
    var t0 = Date.now(), moves = [], cols = [], errs = [], autos = [];
    var w = 0, st = 0, over15 = 0, bad52 = 0, capped = 0, over19 = 0;
    var bAll = 0, bNo = 0, spots = 0, spotsB = 0;
    for (var i = 0; i < n; i++) {
      var seed = DEAL_LIST.length ? DEAL_LIST[i % DEAL_LIST.length] : (i + 1);
      var r = playOne(seed, 1200);
      if (r.capped) capped++;
      if (r.err) { errs.push('seed ' + seed + '：' + r.err); if (r.err.indexOf('52枚') >= 0) bad52++; }
      if (r.won) w++;
      if (r.stuck) st++;
      if (r.maxCol > 15) over15++;
      if (r.maxCol > 19) over19++;
      if (r.autoAt >= 0) autos.push(r.autoAt);
      bAll += r.blockAll; bNo += r.blockNo; spots += r.spots; spotsB += r.spotsWithBlock;
      moves.push(r.moves); cols.push(r.maxCol);
    }
    var out = {
      '試合数': n,
      '★エラー': errs.length,
      '★札が52枚でなかった試合': bad52,
      '★1列が19枚を超えた試合': over19 + '（作りの上限 19枚・0でなければ 作りが こわれている）',
      '　1列の最大': Math.max.apply(null, cols) + '枚',
      '　1列が15枚を超えた試合': over15 + ' (' + (over15 / n * 100).toFixed(1) + '%)',
      '④手数（中央値／最大）': median(moves) + '手 ／ ' + Math.max.apply(null, moves) + '手',
      '⑦運べる枚数で止まった手': bAll ? (bNo / bAll * 100).toFixed(2) + '%（' + bNo + '/' + bAll + '）' : '―',
      '　その手が1つでもある場面': spots ? (spotsB / spots * 100).toFixed(2) + '%' : '―',
      '③自動上げが始まったときの残り': autos.length ? median(autos) + '枚（中央値・' + autos.length + '試合）' : '―',
      '（参考）先を読まない打ち方での勝ち': w + ' (' + (w / n * 100).toFixed(1) + '%)',
      '（参考）④詰み': st + ' (' + (st / n * 100).toFixed(1) + '%)',
      '（参考）手数の上限で打ち切り': capped,
      'かかった時間': ((Date.now() - t0) / 1000).toFixed(1) + '秒'
    };
    if (errs.length) out['エラーの中身'] = errs.slice(0, 5);
    console.log('[FREECELL] autoPlay', out);
    return out;
  }

  /* 一覧の 配りが 本当に クリアできるか、その場で 解いて 流しこんで たしかめる */
  function verify(n) {
    n = n || 20;
    var ok = 0, ng = [], t0 = Date.now();
    for (var i = 0; i < n && i < DEAL_LIST.length; i++) {
      var seed = DEAL_LIST[i], r = solve(makeDeal(seed), { ms: 8000, nodes: 150000 });
      if (!r.ok) { ng.push(seed + '（解けなかった）'); continue; }
      var v = replay(seed, r.moves);
      if (v.ok) ok++; else ng.push(seed + '（' + v.why + '）');
    }
    var out = {
      '調べた': Math.min(n, DEAL_LIST.length), '★クリアできた': ok, '★できなかった': ng.length,
      'かかった時間': ((Date.now() - t0) / 1000).toFixed(1) + '秒'
    };
    if (ng.length) out['中身'] = ng.slice(0, 10);
    console.log('[FREECELL] verify', out);
    return out;
  }

  /* ★ つかむ帯を 1pxずつ 走査して 実測する（T68・T73 と 同じ やり方）
     いちばん 長い列の 上から 下へ 1pxずつ 見て、
     「この札が 手前に 出ている px」を 数える。 */
  function band() {
    if (!G) return { エラー: 'まず はじめて ください' };
    var best = 0, bi = 0, i;
    for (i = 0; i < 8; i++) if (G.cols[i].length > best) { best = G.cols[i].length; bi = i; }
    var col = G.cols[bi], r = boardIn.getBoundingClientRect();
    var x = Math.round(r.left + colX(bi) + geo.cw / 2);
    var y0 = Math.round(r.top + tabY()), y1 = Math.round(r.top + tabY() + geo.colH + 4);
    var hit = {}, order = [];
    for (var y = y0; y <= y1; y++) {
      var el = document.elementFromPoint(x, y);
      var cd = el && el.closest ? el.closest('.card') : null;
      if (!cd) continue;
      var id = parseInt(cd.dataset.id, 10);
      if (hit[id] == null) { hit[id] = 0; order.push(id); }
      hit[id]++;
    }
    var each = order.map(function (id) { return nameOf(id) + ':' + hit[id] + 'px'; });
    var vals = order.map(function (id) { return hit[id]; });
    var band = vals.length > 1 ? Math.min.apply(null, vals.slice(0, vals.length - 1)) : 0;
    return {
      調べた列: '列' + (bi + 1) + '（' + col.length + '枚）',
      '★つかむ帯の実測（一番下以外の最小）': band + 'px',
      計算値: geo.ovUp + 'px',
      札: geo.cw + '×' + geo.ch + 'px',
      札に対する帯: (band / geo.ch * 100).toFixed(0) + '%',
      内訳: each
    };
  }

  window.FREECELL = {
    now: function () {
      if (!G) return { 場面: 'まだ 始めていない', クリアできる配りの数: DEAL_LIST.length };
      var cols = [];
      for (var i = 0; i < 8; i++) {
        cols.push('列' + (i + 1) + '（' + G.cols[i].length + '枚）[' + G.cols[i].map(nameOf).join(' ') + ']');
      }
      var fr = [];
      for (var j = 0; j < 4; j++) fr.push(G.free[j] < 0 ? '空' : nameOf(G.free[j]));
      return {
        配りの番号: G.seed,
        場札: cols,
        空き場: fr.join(' ／ '),
        組札: ['♠' + G.found[0], '♥' + G.found[1], '♦' + G.found[2], '♣' + G.found[3]].join(' ') +
              '（合計 ' + (G.found[0] + G.found[1] + G.found[2] + G.found[3]) + '枚）',
        '★いちど運べる枚数': maxMove(G, null) + '枚（空いた列へは ' +
              (emptyCount(G) ? maxMove(G, G.cols.findIndex(function (c) { return !c.length; })) : maxMove(G, null)) + '枚）',
        手数: G.hist.length + '手',
        もどせる回数: G.hist.length + '回',
        札の合計: countAll(G) + '枚',
        ゆれた回数: shakeCount + '回',
        勝敗: isWin(G) ? '勝ち' : (isStuck(G) ? '止まった' : '進行中'),
        札の大きさ: geo.cw + '×' + geo.ch + 'px（帯 ' + geo.ovUp + 'px・1列19枚のとき ' + geo.colH + 'px）'
      };
    },
    autoPlay: autoPlay,
    verify: verify,
    band: band,

    /* ★ 絵が どこまで 届いているか（T103・画面には 1つも 出ない）*/
    images: function () {
      var on = 0, blank = 0, i, f;
      for (i = 0; i < cardEl.length; i++) {
        f = cardEl[i].firstChild.querySelector('img');
        if (f.complete && f.naturalWidth > 0) on++;
        else if (!cardEl[i].firstChild.querySelector('.fallback')) blank++;
      }
      return {
        '★出せる絵': on + ' / 52',
        '★白い札（下じきも 絵も 無い）': blank,
        '読み終えた': warmDone, '読めなかった': warmFail,
        'いま流している': warmRun, '待っている': warmQueue.length,
        'かかった時間': warmT1 ? (warmT1 - warmT0) + 'ms' : (Date.now() - warmT0) + 'ms（まだ 途中）',
        '一度に流す本数': TUNE.WARM_PAR
      };
    },
    seed: function (n) {
      if (n == null) return G ? G.seed : null;
      cancelAll();
      G = makeDeal(n >>> 0);
      warmOrder();
      openBoard();
      say('この配り、ちゃんと クリアできるよ！');
      return G.seed;
    },
    solve: function (ms) {
      if (!G) return null;
      var r = solve(makeDeal(G.seed), { ms: ms || 8000 });
      var out = {
        配りの番号: G.seed, クリアできる: r.ok, 不明: r.unknown,
        手数: r.ok ? r.moves.length : null, 調べた数: r.nodes, 時間: r.ms + 'ms',
        '1列の最大': r.maxCol + '枚'
      };
      if (r.ok) out['流しこんで勝てるか'] = replay(G.seed, r.moves).ok;
      console.log('[FREECELL] solve', out);
      return out;
    },
    deals: function () { return { 数: DEAL_LIST.length, 先頭10: DEAL_LIST.slice(0, 10) }; },
    geo: function () { return geo; },

    /* ★ 本当に 1手も ない 場面を 出す ―― たしかめ 専用（仕様 §5-6）。
       空き場 4つとも 埋まり、列の 一番下は どれも 置き場が なく、A も 出ていない。 */
    stuckDemo: function () {
      cancelAll();
      G = makeDeal(pickSeed());
      var i, used = {}, c;
      for (i = 0; i < 8; i++) G.cols[i] = [];
      G.free = [-1, -1, -1, -1]; G.found = [0, 0, 0, 0]; G.hist = []; G.moves = 0;
      /* 空き場に K を 4枚（どこにも 置けない・上げられない）*/
      for (i = 0; i < 4; i++) { c = i * 13 + 12; G.free[i] = c; used[c] = 1; }
      /* 8列の 一番下を すべて 2 に する（1つ小さいのは A ＝ すぐ 上がるので 使わない）。
         2 の 上に 置けるのは A だけ。A は 8列の 一番上（動かせない ところ）に かくす。 */
      var bottoms = [1, 14, 27, 40, 1, 14, 27, 40];      // ♠2 ♥2 ♦2 ♣2 …（重複は 下で 直す）
      var pool = [];
      for (c = 0; c < 52; c++) if (!used[c]) pool.push(c);
      /* 4列に 2 を、残り 4列に 3 を 置く（3 の 上に 置けるのは 2 だが、
         2 は 一番下に あって 動かせる ―― なので 3 は 使わず、全部 2 と 同じ形に する）*/
      var twos = [1, 14, 27, 40], aces = [0, 13, 26, 39];
      for (i = 0; i < 8; i++) G.cols[i] = [];
      for (i = 0; i < 4; i++) {
        G.cols[i].push(aces[i]);                          // A は 一番上（下に 2 が あるので 出せない）
        G.cols[i].push(twos[i]);                          // 一番下 ＝ 2（A が 出ていないので 上げられない）
      }
      var rest = [];
      for (c = 0; c < 52; c++) {
        if (c % 13 === 12) continue;                      // K は 空き場
        if (twos.indexOf(c) >= 0 || aces.indexOf(c) >= 0) continue;
        rest.push(c);
      }
      /* 残り 4列は 数字が 下ほど 大きく なる ように 積む（置き場が 生まれない）*/
      rest.sort(function (a, b) { return rankOf(a) - rankOf(b); });
      for (i = 0; i < rest.length; i++) G.cols[4 + (i % 4)].push(rest[i]);
      for (i = 4; i < 8; i++) G.cols[i].sort(function (a, b) { return rankOf(a) - rankOf(b); });
      openBoard();
      var stuck = isStuck(G);
      if (stuck) showResult('stop');
      return { 詰みと判定した: stuck, 場に手がある: hasPlay(G), 札の合計: countAll(G) + '枚' };
    },

    /* ★ T86：トライが 言った 場面を そのまま 出す ―― たしかめ 専用。
       「列や 空き場では 1手も ない。でも 組札から 引っぱって もどせば まだ 続く」場面。
       ★直す前は ここで 詰みの 箱が 出て いた。いまは 出ない（＝ 盤が 生きている）。
       配りは ロボットに 行きづまる まで 打たせて 取った 本物の 場面（54・75・94・135・219）。 */
    stuckFT: function (seed) {
      seed = seed == null ? 54 : seed;
      cancelAll();
      var r = playOne(seed, 1200);
      G = r.end;
      openBoard();
      var stuck = isStuck(G);
      if (stuck) showResult('stop');
      return {
        配り: seed,
        '列や空き場での手': legalMoves(G, { found: false }).length + '手（0なら 直す前は 詰み）',
        '組札から もどす手': legalMoves(G).filter(function (m) { return m.k === 'FT'; }).length + '手',
        '★手が あると 数えたか': ftRevives(G),
        '★詰みの箱を 出したか': stuck,
        札の合計: countAll(G) + '枚'
      };
    },

    /* ★ 勝つ 直前（「どの列も 下ほど 小さい」・あと left枚）を そのまま 出す。
       ここから「自動で 全部 上げ →札が 降る →結果の 箱」まで 一気に 見られる。 */
    nearWin: function (left) {
      left = left == null ? 12 : Math.max(1, Math.min(52, left));
      cancelAll();
      G = makeDeal(pickSeed());
      var i, s, k = 0, back = [];
      for (i = 0; i < 8; i++) G.cols[i] = [];
      G.free = [-1, -1, -1, -1]; G.found = [13, 13, 13, 13]; G.hist = []; G.moves = 0;
      while (back.length < left) {
        s = k % 4; k++;
        if (G.found[s] > 0) { G.found[s]--; back.push(s * 13 + G.found[s]); }
      }
      back.sort(function (a, b) { return rankOf(b) - rankOf(a); });   // 上ほど 大きい ＝ 条件を みたす
      for (i = 0; i < back.length; i++) G.cols[i % 8].push(back[i]);
      openBoard();
      startAuto();
      return { 残り: left + '枚', 条件をみたした: allSorted(G), 札の合計: countAll(G) + '枚' };
    },

    /* ★★ §4「いちど運べる枚数」を 手で さわって 確かめる ための 場面 ―― たしかめ 専用 ★★
       ------------------------------------------------------------
       1列目：空っぽ
       2列目：♦K ♣4 ＋ ♠J ♥10 ♠9 ♥8 ♠7 ♥6 ♠5 ―― 下の **7枚が つづきの 並び**
       3列目の 一番下：♥Q（♠J が 乗る 行き先）
       空き場：4つとも 空き
       → いちど運べる枚数 ＝ (4+1) × 2の1乗 ＝ **10枚**
       → ★ただし **空いた1列目へ 運ぶ ときは その列を 数えない** ので **5枚**
       トライへ（§8-3 の 1番）：
         ① ♠J を つかんで 3列目（♥Q）へ → 7枚 運べる（★空き場を 通る 動きが 見える）
         ② 同じ 7枚を **空っぽの 1列目**へ → 置けずに 戻り、そのあと かたまりが ゆれる
         ③ 空き場を 3つ 埋めてから ①を やり直す → そもそも つかめない（ゆれる）
       ★ 画面に 文字は 1つも 出ません。分かるかどうかが、この1本の 賭けです。 */
    moveDemo: function () {
      cancelAll();
      G = makeDeal(pickSeed());
      var i, r, s, c, used = {};
      for (i = 0; i < 8; i++) G.cols[i] = [];
      G.free = [-1, -1, -1, -1]; G.found = [0, 0, 0, 0]; G.hist = []; G.moves = 0;

      var run = [];
      for (r = 10; r >= 4; r--) { s = (r % 2 === 0) ? 0 : 1; run.push(s * 13 + r); }   // ♠J〜♠5 の 7枚
      var hQ = 13 + 11;                                   // ♥Q（①の 行き先）
      var top2 = [2 * 13 + 12, 3 * 13 + 3];               // ♦K ♣4 ―― つづきを ここで 切る
      var pick = run.concat([hQ], top2);
      for (i = 0; i < pick.length; i++) used[pick[i]] = 1;

      for (i = 0; i < top2.length; i++) G.cols[1].push(top2[i]);
      for (i = 0; i < run.length; i++) G.cols[1].push(run[i]);

      var rest = [];
      for (c = 0; c < 52; c++) if (!used[c]) rest.push(c);
      for (i = 0; i < rest.length; i++) G.cols[2 + (i % 6)].push(rest[i]);
      G.cols[2].push(hQ);                                 // ★ 3列目の 一番下に する

      openBoard();
      say('たしかめ用：いちど運べる枚数（1列目は 空っぽ）');
      var em = G.cols.findIndex(function (x) { return !x.length; });
      return {
        '★いちど運べる枚数（ふつうの列へ）': maxMove(G, null) + '枚',
        '★空いた列へ': maxMove(G, em) + '枚',
        '2列目': G.cols[1].map(nameOf).join(' ') + '（下の ' + runLen(G.cols[1]) + '枚が つづき）',
        '3列目の一番下': nameOf(G.cols[2][G.cols[2].length - 1]),
        札の合計: countAll(G) + '枚',
        '★同じ札が2枚ない': (function () { var m = {}, n = 0, q, k; for (q = 0; q < 8; q++) for (k = 0; k < G.cols[q].length; k++) { if (m[G.cols[q][k]]) n++; m[G.cols[q][k]] = 1; } return n === 0; })()
      };
    },

    /* ★ いちばん のびた 場面（1列19枚 ＝ 元の7枚 ＋ K→A の12枚）を そのまま 出す。
       仕様 §1-4 で「絶対に これ以上 ない」と 証明ずみの 上限。
       トライへ：1000×900・375px・320px で スクロールが 出ない ことを ここで 見てください。 */
    worst: function () {
      cancelAll();
      G = makeDeal(pickSeed());
      var used = {}, i, r, s, c;
      for (i = 0; i < 8; i++) G.cols[i] = [];
      G.free = [-1, -1, -1, -1]; G.found = [0, 0, 0, 0]; G.hist = []; G.moves = 0;
      /* 8列目：はじめから あった 6枚（並びは ばらばら）＋ ♠K から A まで 色ちがいで 13枚 ＝ 19枚 */
      var filler = [1, 3, 5, 7, 9, 11];                  // ♠2 ♠4 ♠6 ♠8 ♠10 ♠Q
      for (i = 0; i < 6; i++) { G.cols[7].push(filler[i]); used[filler[i]] = 1; }
      for (r = 12; r >= 0; r--) {
        s = (r % 2 === 0) ? 3 : 1;                       // ♣（黒）と ♥（赤）を かわりばんこ
        c = s * 13 + r;
        if (used[c]) { s = (s === 3) ? 0 : 2; c = s * 13 + r; }
        G.cols[7].push(c); used[c] = 1;
      }
      var rest = [];
      for (c = 0; c < 52; c++) if (!used[c]) rest.push(c);
      for (i = 0; i < rest.length; i++) G.cols[i % 7].push(rest[i]);
      openBoard();
      say('たしかめ用：1列19枚（いちばん のびた 形）');
      var inb = boardIn.getBoundingClientRect(), lowest = 0;
      for (i = 0; i < 52; i++) { var b = cardEl[i].getBoundingClientRect(); if (b.bottom > lowest) lowest = b.bottom; }
      return {
        '★1列の枚数': G.cols[7].length + '枚',
        札: geo.cw + '×' + geo.ch + 'px',
        つかむ帯: geo.ovUp + 'px',
        場札エリアの下端: Math.round(inb.bottom) + 'px',
        いちばん下の札の下端: Math.round(lowest) + 'px',
        'はみ出し': Math.round(lowest - inb.bottom) + 'px（0以下なら OK）',
        ページ縦スクロール: document.documentElement.scrollHeight > window.innerHeight,
        ページ横スクロール: document.documentElement.scrollWidth > window.innerWidth,
        札の合計: countAll(G) + '枚'
      };
    },
    core: CORE
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
