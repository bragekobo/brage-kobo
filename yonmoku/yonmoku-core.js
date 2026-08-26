/* ============================================================
   四目ならべ ― 中身（CORE）／ T127・コーダ
   ------------------------------------------------------------
   仕様は logs/T126_四目ならべ_仕様_ルル.md ＋ 社長の裁定4つ が 正。

   ★★ 社長の裁定（4つ・厳守）★★
     判断1 ★ 初期値は **2段「ふつう」**（★ルルの推し「弱い」では ない）
     判断2 ★ 指を 置く → その列の 上に コマが 出る → すべらせて 直せる → はなした 列に 落ちる
     判断3 ★ リーチを 見せない。★盤の 上の 強調は **ゼロ**
     判断4 ★ 下の トレイ（余った コマ）は 描かない

   ★★ この ファイルの 役目 ★★
     ------------------------------------------------------------
     ルール・ロボット・寸法の 計算が **ぜんぶ ここ 1本**に 入っている。
     document を 1回も さわらない ので、**Node からも そのまま 動く**
     （＝ 勝率を 数える 側と、実際に 遊ぶ 側の ロボットが 同じ 1本の コード。
        ★分けると 必ず ずれる ―― ルル §10-3 の 名指し）。

   ★★ 盤の 大きさは 定数 2つ（COLS・ROWS）だけ（ルル §10-1）★★
     ------------------------------------------------------------
     ★ この ファイルには 列の数も 段の数も 1つも 書いていない。
       makeCore(cols, rows) に 渡された 2つから、
         4つ 続く 並びの 一覧・見る 順番・盤の px・コマの 大きさ ―― 全部が 計算で 出る。
     ★ 数字を 書いてよいのは index.html の 2行だけ。
     ★ 将来「6列版」を 出す ときは、その 1行を 変えれば すむ。

   ★★ 置く前に「4つ 並ぶか」を 出す 経路は 1本も 無い（ルル §10-2 の 3番）★★
     ------------------------------------------------------------
     ★ 画面に 渡すのは「どの 列が 空いているか」だけ（openCols）。
       4つ 並んだかを 見る winAt() は、**コマが 落ちた あと**と
       **ロボットの 読みの 中**でしか 呼ばれない。
     ★ YONMOKU.verify() が 画面側の 関数を 毎回 走査して たしかめる。

   ★★ ロボットが ずるを しない ことの 保証（ルル §10-2 の 4番）★★
     ------------------------------------------------------------
     盤は 両方に 見えている ので、ずるの 形は 1つだけ ―― **人の 次の手を 先に 知ること**。
     ロボットの 3つの 関数（negamax / solve / pick）に 渡しているのは
       ① いまの 盤 ② 積み上がり ③ 自分の 色 ④ 深さ ⑤ 読みきりの 線 ⑥ さいころ
     の 6つだけ。★人の 打ち方（humans）を 1度も 渡していない。

   ⚠️ 外部の ライブラリ・フォント・画像は 0。外への 通信も 0。
   ⚠️ トランプを 1枚も 使わない ので、設計図 §9（絵札の ルール）は かかりません。
   ============================================================ */
(function (root) {
  'use strict';

  /* ★ 何個 続いたら 勝ちか。★ゲームの 名前 そのもの なので ここ 1か所に 置く。 */
  var NEED = 4;

  /* ★ 見る 向き（よこ・たて・ななめ2つ）。★4つ 続く 並びを 作る ためだけ。 */
  var DIRS = [[0, 1], [1, 0], [1, 1], [1, -1]];

  /* ── さいころ（同じ 数字を 入れれば いつも 同じ 目）───── */
  function rng(seed) {
    var s = (seed >>> 0) || 1;
    return function () {
      s ^= s << 13; s >>>= 0;
      s ^= s >> 17;
      s ^= s << 5;  s >>>= 0;
      return s / 4294967296;
    };
  }

  /* ============================================================
     ★ 寸法の 決めごと（ルル §1-3 の【計算】。★ここ 1か所だけ）
     ------------------------------------------------------------
       盤は 横長（列 : 段）。ますの 線は マスの 中に 描く（＝ 場所を 食わない）。
       盤の ふちだけ 1px。
         1マス = min( floor((器のはば − ふち2) / 列),
                      floor((器のたて − 帯 − すきま − ふち2) / 段) )
       ★ 割り算 2回。★トランプの fit()（1pxずつ 下げて 探す）は 要らない。

     ★ 横向きの 低い 画面（たてが 足りない）だけ、帯を 右よこに 置く
       ―― たてを 食わせない ため（ルル §1-4）。切りかえの 線は SIDE_BAR_H ただ1つ。

     ★★ 帯（次の コマ）の 太さに ついて ★★
       ------------------------------------------------------------
       ★ 盤の 取り分を 決める ときは いつも BAR（24px）で 計算する
         ―― ここを 動かすと ルルの 寸法表（119/50/43/37px）が まるごと ずれる。
       ★ そのうえで、**盤が 使わなかった 余り**が あれば、その ぶんだけ 帯を 太くする。
         ★ 盤は 1pxも やせない。★余りを 使うだけ（設計図 追記③ の 精神）。
         パソコン … 余り 2px → 帯 26px（コマは 小さい 丸に なる）
         375px　 … 余り 340px → 帯 41px ＝ コマと 同じ 大きさ
         320px　 … 余り 154px → 帯 35px ＝ コマと 同じ 大きさ
       ★ つまり **スマホでは 実物大の コマが 列の 上に 出る**。そこが 大事な ところ。
     ============================================================ */
  var DIM = {
    BAR:   24,   // ★ 次の コマの 帯（たて向き＝高さ／横向き＝はば）。★盤の 取り分は いつも これで 計算
    GAP:    8,   // 盤と 帯の すきま
    FRAME:  1,   // 盤の ふち（片側）
    SIDE_BAR_H: 320,   // 器の たてが これ未満 なら 帯を 右よこへ（横向き 812×375 は 225px）
    CELL_MIN: 14,      // これ以下には しない（保険）
    PIECE_RATE: 0.82,  // コマの 直径 ＝ マス × 0.82
    HOLE_RATE:  0.88   // 穴の 直径 ＝ マス × 0.88（★コマより 少し 大きい）
  };

  /* 器の 中身（W×H）から 1マスを 出す。★列と 段 いがいの 数字は 上の DIM から しか 来ない。 */
  function fitBoard(W, H, cols, rows) {
    var side = H < DIM.SIDE_BAR_H;
    var availW = side ? (W - DIM.BAR - DIM.GAP) : W;
    var availH = side ? H : (H - DIM.BAR - DIM.GAP);
    var byW = Math.floor((availW - DIM.FRAME * 2) / cols);
    var byH = Math.floor((availH - DIM.FRAME * 2) / rows);
    var cell = Math.max(DIM.CELL_MIN, Math.min(byW, byH));
    var bw = cell * cols + DIM.FRAME * 2;
    var bh = cell * rows + DIM.FRAME * 2;
    var piece = Math.round(cell * DIM.PIECE_RATE);

    /* ★ 盤が 使わなかった 余りを、帯に まわす（盤は やせない）*/
    var used = DIM.BAR + DIM.GAP + (side ? bw : bh);
    var slack = Math.max(0, (side ? W : H) - used);
    var bar = Math.min(piece, DIM.BAR + slack);

    return {
      cell: cell, boardW: bw, boardH: bh,
      piece: piece,
      hole: Math.round(cell * DIM.HOLE_RATE),
      bar: bar, gap: DIM.GAP, frame: DIM.FRAME,
      side: side,
      colW: cell,                       // ★ 1列の はば（＝ 指で 押す ところの はば）
      colH: cell * rows,                // ★ 1列の たて（★上から 下まで 全部 押せる）
      needW: side ? (bw + DIM.GAP + bar) : bw,
      needH: side ? bh : (bh + DIM.GAP + bar)
    };
  }

  /* ============================================================
     ★ 盤（列×段・0＝空 1＝人（赤・先手） 2＝ロボット（黄・後手））
     ------------------------------------------------------------
     ★ ならびは i = 段 × 列数 + 列。★段0 が 一番 上。
     ★ h[列] ＝ その 列に 積んである 数。落ちる 先は 段 = 段数 − 1 − h[列]。
     ============================================================ */
  function makeCore(cols, rows) {
    var N = cols * rows;

    /* ★ 4つ 続く 並びを ぜんぶ 先に 作る（毎回 数えない）
       7列×6段 なら 69本（よこ24・たて21・ななめ12＋12）*/
    var LINES = [];
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      for (var d = 0; d < DIRS.length; d++) {
        var dr = DIRS[d][0], dc = DIRS[d][1];
        var er = r + dr * (NEED - 1), ec = c + dc * (NEED - 1);
        if (er < 0 || er >= rows || ec < 0 || ec >= cols) continue;
        var L = [];
        for (var t = 0; t < NEED; t++) L.push((r + dr * t) * cols + (c + dc * t));
        LINES.push(L);
      }
    }
    var LN = LINES.length;

    /* ★ その マスを 通る 並びだけ 引ける ように しておく
       （★コマが 落ちた あと、その 1マスの まわりだけ 見れば すむ）*/
    var linesAt = new Array(N);
    for (var i = 0; i < N; i++) linesAt[i] = [];
    for (var k = 0; k < LN; k++) for (var t2 = 0; t2 < NEED; t2++) linesAt[LINES[k][t2]].push(LINES[k]);

    /* ★ 列を 見る 順番（★読みを 速く する ためだけ・列数から 出す）
       ------------------------------------------------------------
       ★ これは「評価」では ない。良さそうな 列を 先に 見ると 枝が 早く 切れて 速く なる、それだけ。
       ★ 出てくる 答えは 並べかえても 1つも 変わらない。
       ★★ そして この 順番は 画面に 1ミリも 出ない（★どの 列が 良いかは 教えない・ルル §6-4 の 3番）。 */
    var ORDER = [];
    for (var c2 = 0; c2 < cols; c2++) ORDER.push(c2);
    ORDER.sort(function (a, b2) {
      var mid = (cols - 1) / 2;
      return Math.abs(a - mid) - Math.abs(b2 - mid);
    });

    function start()   { var b = new Int8Array(N); return b; }
    function heights() { return new Int8Array(cols); }

    function canDrop(h, c) { return h[c] < rows; }
    function landRow(h, c) { return rows - 1 - h[c]; }

    /* 実際に 落とす。落ちた 場所を 返す。 */
    function drop(b, h, c, me) {
      var i = (rows - 1 - h[c]) * cols + c;
      b[i] = me; h[c]++;
      return i;
    }
    function undrop(b, h, c) {
      h[c]--;
      var i = (rows - 1 - h[c]) * cols + c;
      b[i] = 0;
      return i;
    }

    /* ★ そこに 落ちた コマで 4つ 続いたか（★落ちた あとにしか 呼ばない）*/
    function winAt(b, i, me) {
      var ls = linesAt[i];
      for (var k2 = 0; k2 < ls.length; k2++) {
        var L = ls[k2], ok = true;
        for (var t3 = 0; t3 < NEED; t3++) if (b[L[t3]] !== me) { ok = false; break; }
        if (ok) return true;
      }
      return false;
    }

    /* ★ 4つの 並びを **全部** 数える（★1つ 見つけて 止めない ―― ルル §8-2 の ⚠️）
       ★ わなが 決まった とき、最後の 1手で 並びが 2つ できる ことが ある。 */
    function winLines(b) {
      var who = 0, out = [];
      for (var k3 = 0; k3 < LN; k3++) {
        var L = LINES[k3], v = b[L[0]];
        if (!v) continue;
        var ok = true;
        for (var t4 = 1; t4 < NEED; t4++) if (b[L[t4]] !== v) { ok = false; break; }
        if (ok) { who = v; out.push(L); }
      }
      return { who: who, lines: out };
    }

    /* ★ 空いている 列（★画面に 渡すのは これ だけ）*/
    function openCols(h) {
      var o = [];
      for (var c3 = 0; c3 < cols; c3++) if (h[c3] < rows) o.push(c3);
      return o;
    }
    function filled(h) { var n = 0; for (var c4 = 0; c4 < cols; c4++) n += h[c4]; return n; }

    /* ★ 目じるし ―― 「自分の 4つが 何本 作れそうか」だけ
       ------------------------------------------------------------
       ★ ここが この ロボットの 中身です。★相手の ことは 1つも 見ていません。
         相手を 止めるのは、**読み**（negamax の ひっくり返し）から ひとりでに 出てきます。
       ★ だから 一番下の 段（深さ0）は、相手の リーチを 1回も 止めません
         ―― ★わざと 見のがして いるのでは なく、**見えていない** のです（ルル §4-3 の ⚠️）。 */
    var W = [0, 1, 10, 80, 100000];
    function own(b, me) {
      var opp = 3 - me, s = 0;
      for (var k4 = 0; k4 < LN; k4++) {
        var L = LINES[k4], m = 0, o = 0, v;
        v = b[L[0]]; if (v === me) m++; else if (v === opp) o++;
        v = b[L[1]]; if (v === me) m++; else if (v === opp) o++;
        v = b[L[2]]; if (v === me) m++; else if (v === opp) o++;
        v = b[L[3]]; if (v === me) m++; else if (v === opp) o++;
        if (o === 0 && m) s += W[m];
      }
      return s;
    }
    /* ★ 読みの 中の 目じるし ＝ 自分の 見こみ − 相手の 見こみ */
    function evalDiff(b, me) { return own(b, me) - own(b, 3 - me); }

    /* ★ 落ちたら 4つ 並ぶ 列（★ロボットの 読みと、勝率を 数える 側でだけ 使う）
       ⚠️ 画面には 1度も 渡さない（社長裁定 判断3・ルル §6-4 の 1番）。 */
    function threatCols(b, h, me) {
      var o = [];
      for (var c5 = 0; c5 < cols; c5++) {
        if (h[c5] >= rows) continue;
        var i2 = drop(b, h, c5, me);
        if (winAt(b, i2, me)) o.push(c5);
        undrop(b, h, c5);
      }
      return o;
    }

    function clone(b) { var o = new Int8Array(N); o.set(b); return o; }
    function cloneH(h) { var o = new Int8Array(cols); o.set(h); return o; }

    return {
      cols: cols, rows: rows, N: N, NEED: NEED,
      LINES: LINES, linesAt: linesAt, ORDER: ORDER,
      start: start, heights: heights,
      canDrop: canDrop, landRow: landRow, drop: drop, undrop: undrop,
      winAt: winAt, winLines: winLines,
      openCols: openCols, filled: filled,
      own: own, evalDiff: evalDiff, threatCols: threatCols,
      clone: clone, cloneH: cloneH
    };
  }

  /* ============================================================
     ★★ ロボットの 強さ ―― 5段（ルル §4-3）★★
     ------------------------------------------------------------
     ★ 中身は「何手 先まで 読むか」ただ 1つ。
       ★ わざと まちがえる ロボットは 作りません（ルル §4-3。★T60・T78・T88 で 3回 落としたもの）。
     ★ 画面には 手数の 数字を 1つも 出しません。言葉だけ。
       そのかわり「何手 読むか」の ちがいは **2つの ことに そのまま 出ます**（ルル §4-4）：
         ★ 弱い（0手）… 相手の リーチを 1回も 止めない
         ★ 上の 段　  … 止めてくる ＋ わなを かけてくる
     ★ 言葉づかい：弱・強・最 は すべて 小6まで（設計図 §9.6）。

     ★★ 初期値は **2段「ふつう」**（★社長裁定 判断1 の ②）★★
       ★ ルルは ①「弱い」を 推しましたが、社長は ②を 選ばれました。
       ★ 逃げ道は「つよさを 下げられる」こと ―― だから えらぶ 所を
         **はじめの 画面 と 負けた あとの 画面の 両方**に 置きます。
     ============================================================ */
  var LEVELS = [
    { label: '弱い',       depth: 0, exact: 0  },
    { label: 'ふつう',     depth: 1, exact: 0  },   /* ★ ここが 初期値（社長裁定 判断1 ＝ ②）*/
    { label: '強い',       depth: 2, exact: 0  },
    { label: 'とても 強い', depth: 4, exact: 0  },
    /* ★ exact ＝ 残り 何マスに なったら 終わりまで 読みきるか（ルル §4-7 の【実測】＝ 16マス）*/
    { label: '最強',       depth: 6, exact: 16 }
  ];
  var LEVEL_START = 1;   /* ★ 2段「ふつう」（★社長裁定 判断1 ＝ ②）*/

  function makeRobot(G) {
    var cols = G.cols, rows = G.rows, ORDER = G.ORDER;
    var drop = G.drop, undrop = G.undrop, winAt = G.winAt, evalDiff = G.evalDiff, own = G.own;
    var INF = 1e9, WIN = 100000;
    var nowMs = (typeof Date !== 'undefined') ? function () { return Date.now(); } : function () { return 0; };

    /* ★★ 先に「もう 決まっている こと」を 3つ 見る（★答えは 1つも 変わらない・速く なるだけ）★★
       ------------------------------------------------------------
       ① 自分が いま 落とせば 4つ 並ぶ 列が ある → ★そこで 終わり（読む 必要が ない）
       ② 相手が 次に 4つ 並べられる 列が **2つ 以上** → ★どちらか 1つしか ふさげない ＝ 負け
       ③ 相手が 次に 4つ 並べられる 列が **1つだけ** → ★そこしか 打てない（枝が 1本に なる）
       ★ ①②③は どれも「読めば 必ず そうなる」ことを 先に 出しているだけ。
         ★ 手加減でも 手ぬきでも ありません。★同じ 答えに、ずっと 速く たどりつきます。
       戻り値：0＝ふつうに 読む ／ 1〜＝この 列 1本だけ 読む ／ −1＝勝ち ／ −2＝負け */
    var force = new Int32Array(1);
    function shortcut(b, h, me) {
      var opp = 3 - me, c, i;
      for (c = 0; c < cols; c++) {
        if (h[c] >= rows) continue;
        i = drop(b, h, c, me);
        var w = winAt(b, i, me);
        undrop(b, h, c);
        if (w) { force[0] = c; return -1; }
      }
      var cnt = 0, only = -1;
      for (c = 0; c < cols; c++) {
        if (h[c] >= rows) continue;
        i = drop(b, h, c, opp);
        var w2 = winAt(b, i, opp);
        undrop(b, h, c);
        if (w2) { cnt++; only = c; }
      }
      if (cnt >= 2) return -2;
      if (cnt === 1) { force[0] = only; return 1; }
      return 0;
    }

    /* ふつうの 読み（depth手 先まで）
       ★ 4つ 並んだ その 場で 止める。★早く 勝てる 手を 良し とする（WIN − 手数）。 */
    function negamax(b, h, me, depth, alpha, beta, ply) {
      if (depth <= 0) {
        /* ★ ここでは もう 読まない。★ただし「この 1手で 4つ 並ぶ」だけは 見る。 */
        for (var k0 = 0; k0 < cols; k0++) {
          var c0 = ORDER[k0];
          if (h[c0] >= rows) continue;
          var i0 = drop(b, h, c0, me), w0 = winAt(b, i0, me);
          undrop(b, h, c0);
          if (w0) return WIN - ply;
        }
        return evalDiff(b, me);
      }
      var sc = shortcut(b, h, me);
      if (sc === -1) return WIN - ply;
      if (sc === -2) return -(WIN - ply - 1);
      var one = (sc === 1) ? force[0] : -1;

      var best = -INF, any = false;
      for (var k = 0; k < cols; k++) {
        var c = (one >= 0) ? one : ORDER[k];
        if (h[c] >= rows) { if (one >= 0) break; continue; }
        any = true;
        drop(b, h, c, me);
        var v = -negamax(b, h, 3 - me, depth - 1, -beta, -alpha, ply + 1);
        undrop(b, h, c);
        if (v > best) best = v;
        if (best > alpha) alpha = best;
        if (alpha >= beta) break;
        if (one >= 0) break;
      }
      return any ? best : 0;      /* ★ 落とせる 列が 1つも 無い ＝ 引き分け */
    }

    /* ★ 終わりまで 読みきる（★勝ち・負け・引き分け しか 返さない）*/
    function solve(b, h, me, alpha, beta, ply) {
      var sc = shortcut(b, h, me);
      if (sc === -1) return WIN - ply;
      if (sc === -2) return -(WIN - ply - 1);
      var one = (sc === 1) ? force[0] : -1;

      var best = -INF, any = false;
      for (var k = 0; k < cols; k++) {
        var c = (one >= 0) ? one : ORDER[k];
        if (h[c] >= rows) { if (one >= 0) break; continue; }
        any = true;
        drop(b, h, c, me);
        var v = -solve(b, h, 3 - me, -beta, -alpha, ply + 1);
        undrop(b, h, c);
        if (v > best) best = v;
        if (best > alpha) alpha = best;
        if (alpha >= beta) break;
        if (one >= 0) break;
      }
      return any ? best : 0;
    }

    /* 根っこで 深さ d を 読む。同じ 値の 手は ぜんぶ 返す（★選ぶのは さいころ）
       ★ d が 0 の とき（一番下の 段）は 読まない ―― ★自分の 4つ しか 見ない。 */
    function rootAt(b, h, me, list, d) {
      var best = -INF, top = [], vals = [];
      for (var k = 0; k < list.length; k++) {
        var c = list[k];
        if (h[c] >= rows) continue;
        var i = drop(b, h, c, me), v;
        if (winAt(b, i, me)) v = WIN - 1;
        else if (d <= 0) v = own(b, me);
        else v = -negamax(b, h, 3 - me, d - 1, -INF, INF, 2);
        undrop(b, h, c);
        vals.push({ c: c, v: v });
        if (v > best) { best = v; top = [c]; } else if (v === best) top.push(c);
      }
      vals.sort(function (x, y) { return y.v - x.v; });
      var ordered = [];
      for (var t = 0; t < vals.length; t++) ordered.push(vals[t].c);
      return { top: top, ordered: ordered };
    }

    /* ★★ pick(盤, 積み, 自分の色, 深さ, 読みきりの線, さいころ, 待てる時間ms)
       ------------------------------------------------------------
       ⚠️★ 読みきりへの 切りかえは、**手番の はじめ 1回だけ**（ルル §4-8）。
          読みの 中の どの ふしでも 切りかえると、6手読みの 途中に
          16マスの ふしが 何千個も 出てきて ★止まらない。
          ★ T88（リバーシ）で ルルが 実際に 落ちた 穴。★2回 落ちない。 */
    function pick(b, h, me, depth, exact, rand, budget) {
      var ms = [];
      for (var c = 0; c < cols; c++) if (h[c] < rows) ms.push(c);
      if (!ms.length) return -1;

      if (exact > 0 && (G.N - G.filled(h)) <= exact) {
        var best = -INF, top = [];
        for (var k = 0; k < ms.length; k++) {
          var c2 = ms[k], i = drop(b, h, c2, me), v;
          if (winAt(b, i, me)) v = WIN - 1;
          else v = -solve(b, h, 3 - me, -INF, INF, 2);
          undrop(b, h, c2);
          if (v > best) { best = v; top = [c2]; } else if (v === best) top.push(c2);
        }
        return top[Math.floor(rand() * top.length) % top.length];
      }

      /* ★ 中盤：浅い方から 順に 深くする（前の 深さの 結果で 良い列から 見る ＝ 速い）。
         ★ 待てる 時間を 超えそうなら そこで 止める ―― おそい 端末でも 待たされない。
         ★ 速い 端末では 必ず 最後の 深さまで 届く（＝ 勝率は 表の とおり）。 */
      var t0 = nowMs(), cur = ms, res = null, d0 = Math.max(0, depth - 2);
      for (var d = d0; d <= depth; d++) {
        res = rootAt(b, h, me, cur, d);
        cur = res.ordered;
        if (d < depth && budget > 0 && (nowMs() - t0) * 4 > budget) break;
      }
      return res.top[Math.floor(rand() * res.top.length) % res.top.length];
    }

    /* ★ たしかめ用に 外へ 出す（★画面からは 1度も 呼ばない）*/
    pick.src = function () { return String(negamax) + String(solve) + String(rootAt) + String(pick); };
    return pick;
  }

  /* ============================================================
     ★ 人の 模型（★勝率を 数える ためだけ。★遊ぶ 画面では 1度も 使わない）
     ------------------------------------------------------------
     ★ ルル §4-2 の 5つ（覚えることの 数 0〜4個）＋「N手 読む 人」。
     ⚠️ ここで 使う 知識（内がわの 列が 良い 等）は、★画面に 1文字も 出さない。
     ============================================================ */
  function makeHumans(G) {
    var cols = G.cols, rows = G.rows;

    function bestOf(list, score, rand) {
      var best = -1e18, top = [];
      for (var k = 0; k < list.length; k++) {
        var v = score(list[k]);
        if (v > best) { best = v; top = [list[k]]; } else if (v === best) top.push(list[k]);
      }
      return top[Math.floor(rand() * top.length) % top.length];
    }
    function openList(h) { var o = []; for (var c = 0; c < cols; c++) if (h[c] < rows) o.push(c); return o; }

    /* ① 自分が 4つ 並べられるなら 並べる */
    function myWin(b, h, me) { return G.threatCols(b, h, me); }
    /* ② 相手が 4つ 並べられる 所を ふさぐ */
    function block(b, h, me) { return G.threatCols(b, h, 3 - me); }
    /* ③ 内がわの 列を 好む（★覚えることの 3つめ）*/
    function inner(c) { return -Math.abs(c - (cols - 1) / 2); }
    /* ④ そこに 落とすと、すぐ 上を 相手に 取られる 列を さける */
    function givesTop(b, h, me, c) {
      if (h[c] + 1 >= rows) return false;
      var i = G.drop(b, h, c, me);
      var j = G.drop(b, h, c, 3 - me);
      var bad = G.winAt(b, j, 3 - me);
      G.undrop(b, h, c); G.undrop(b, h, c);
      return bad;
    }

    function mk(level) {
      return function (b, h, me, rand) {
        var ms = openList(h);
        if (level >= 1) { var w = myWin(b, h, me); if (w.length) return w[Math.floor(rand() * w.length) % w.length]; }
        if (level >= 2) { var d = block(b, h, me); if (d.length) return d[Math.floor(rand() * d.length) % d.length]; }
        if (level >= 4) {
          var safe = [];
          for (var k = 0; k < ms.length; k++) if (!givesTop(b, h, me, ms[k])) safe.push(ms[k]);
          if (safe.length) ms = safe;
        }
        if (level >= 3) return bestOf(ms, inner, rand);
        return ms[Math.floor(rand() * ms.length) % ms.length];
      };
    }

    /* ★ N手 読む 人（★ロボットと 同じ 読みを 使う。★見落とし率 miss で たまに 外す）*/
    function reader(robot, depth, miss) {
      return function (b, h, me, rand) {
        var ms = openList(h);
        if (miss > 0 && rand() < miss) return ms[Math.floor(rand() * ms.length) % ms.length];
        return robot(b, h, me, depth, 0, rand, 0);
      };
    }

    return {
      list: {
        'でたらめ':            mk(0),
        '自分の 4つ':          mk(1),
        '＋ 止める':           mk(2),
        '＋ 内がわ':           mk(3),
        '＋ 上を 見る':        mk(4)
      },
      reader: reader
    };
  }

  /* ============================================================
     ★ 1試合 まるごと 走らせる（画面ぬき）
     ------------------------------------------------------------
     ★ 人は いつも 先手（赤）。★固定（ルル §3-4）。
     戻り値 { r: 1勝ち/0引き分け/-1負け, plies, lines }
     ============================================================ */
  function simGame(G, robot, humanFn, level, rand, stat) {
    var b = G.start(), h = G.heights(), me = 1, plies = 0, guard = 0, over = 0;
    var ef = level.exact || 0;
    while (guard++ <= G.N) {
      if (G.filled(h) >= G.N) break;                     /* 引き分け（ぜんぶ 埋まった）*/
      var open = G.openCols(h);

      if (stat && me === 1) {
        /* ★ 人の 番に、相手（ロボット）の リーチが あったか（ルル §6-3）*/
        var th = G.threatCols(b, h, 2);
        if (th.length) { stat.reachSeen++; if (th.length >= 2) stat.reachDouble++; }
      }
      if (stat && me === 2) {
        /* ★ 人が リーチを かけていた とき、ロボットは 止めたか（ルル §4-4）*/
        var need = G.threatCols(b, h, 1);
        var mine = G.threatCols(b, h, 2);
        if (need.length && !mine.length) {
          stat.blockChance++;
          var pick0 = robot(b, h, me, level.depth, ef, rand, 0);
          var stopped = false;
          for (var q = 0; q < need.length; q++) if (need[q] === pick0) stopped = true;
          if (stopped) stat.blocked++;
          var i0 = G.drop(b, h, pick0, me);
          if (G.winAt(b, i0, me)) { over = me; plies++; break; }
          plies++;
          /* ★ わな ＝ ロボットが 落とした あと、4つ 並べられる 列が 2つ 同時に できた */
          if (G.threatCols(b, h, 2).length >= 2) stat.traps++;
          me = 1; continue;
        }
      }

      var c = (me === 1) ? humanFn(b, h, me, rand) : robot(b, h, me, level.depth, ef, rand, 0);
      var ok = false;
      for (var k = 0; k < open.length; k++) if (open[k] === c) ok = true;
      if (!ok) { if (stat) stat.illegal++; break; }
      var i = G.drop(b, h, c, me);
      plies++;
      if (G.winAt(b, i, me)) { over = me; break; }
      if (me === 2 && stat && G.threatCols(b, h, 2).length >= 2) stat.traps++;
      me = 3 - me;
    }
    if (guard > G.N && !over && G.filled(h) < G.N) { if (stat) stat.stall++; }
    var wl = G.winLines(b);
    if (stat) {
      stat.games++; stat.plies += plies;
      if (wl.lines.length >= 2) stat.twoLines++;
      if (wl.lines.length > stat.maxLines) stat.maxLines = wl.lines.length;
      if (!over && G.filled(h) >= G.N) stat.draws++;
    }
    return { r: over === 1 ? 1 : (over === 2 ? -1 : 0), plies: plies, lines: wl.lines.length, b: b, h: h };
  }

  function newStat() {
    return { games: 0, plies: 0, illegal: 0, stall: 0, draws: 0, twoLines: 0, maxLines: 0,
             blockChance: 0, blocked: 0, traps: 0, reachSeen: 0, reachDouble: 0 };
  }

  function runMany(G, robot, humanFn, level, games, seed) {
    var rand = rng(seed), w = 0, d = 0, l = 0, st = newStat();
    for (var g = 0; g < games; g++) {
      var r = simGame(G, robot, humanFn, level, rand, st);
      if (r.r > 0) w++; else if (r.r < 0) l++; else d++;
    }
    return {
      games: games, win: w / games, draw: d / games, lose: l / games,
      plies: st.plies / games, illegal: st.illegal, stall: st.stall,
      twoLines: st.twoLines, maxLines: st.maxLines,
      blockRate: st.blockChance ? st.blocked / st.blockChance : 0,
      blockChance: st.blockChance,
      traps: st.traps / games,
      reachRate: st.plies ? st.reachSeen / (st.plies / 2) : 0,
      reachPerGame: st.reachSeen / games,
      doublePerGame: st.reachDouble / games
    };
  }

  root.YONMOKU_CORE = {
    NEED: NEED, DIM: DIM, LEVELS: LEVELS, LEVEL_START: LEVEL_START,
    rng: rng, fitBoard: fitBoard, makeCore: makeCore,
    makeRobot: makeRobot, makeHumans: makeHumans,
    simGame: simGame, runMany: runMany, newStat: newStat
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
