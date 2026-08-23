/* ============================================================
   リバーシ ― 中身（CORE）／ T89・コーダ
   ------------------------------------------------------------
   仕様は logs/T88_リバーシ_仕様_ルル.md ＋ 社長の裁定（末尾）が 正。

   ★★ この ファイルの 役目 ★★
     ルール・ロボット・寸法の 計算が **ぜんぶ ここ 1本**に 入っている。
     document を 1回も さわらない ので、**Node からも そのまま 動く**
     （＝ 勝率を 数える 側と、実際に 遊ぶ 側の ロボットが 同じ 1本の コード。
        分けると 必ず ずれる ―― ルル §10-3 の 名指し）。

   ★★ 盤の 大きさは 定数 SIZE ただ1つ（ルル §2-3・社長のご指摘）★★
     ------------------------------------------------------------
     この ファイルには 8 も 6 も 1つも 書いていない。
     makeCore(n) に 渡された n から、
       盤の 一辺・はじめの 4つの石の 場所・角の 4か所・1マスの px・
       石の 大きさ・光りの 大きさ ―― **全部が 計算で 出る**。
     ★ 8 を 書いてよいのは index.html の window.REVERSI_SIZE ただ1行だけ。
     ★ 6×6（13本目）は、その 1行を 6 に して この ファイルを そのまま 使う。

   ★★ ロボットが ずるを しない ことの 保証（ルル §10-2 の 4番）★★
     ------------------------------------------------------------
     リバーシは 隠し情報が 1つも 無い（盤は 両方に 見えている）。
     だから ずるの 形は 1つだけ ―― **人の 次の手を 先に 知ること**。
     ロボットの 3つの 関数（search / solve / pick）に 渡しているのは
       ① いまの 盤 ② 自分の 色 ③ 深さ ④ 読みきりの 線 ⑤ さいころ
     の 5つだけ。人の 打ち方（humans）を 1度も 渡していない。
     ★ REVERSI.verify() が、この 3つの 関数の 中身を 毎回 走査して たしかめる。

   ★★ 置く前に「何枚 ひっくり返るか」を 出す 経路は 1本も 無い（ルル §5-6 の 2番）★★
     ------------------------------------------------------------
     画面に 渡すのは moveList()（＝ 置ける 場所の 一覧）だけ。
     枚数を 返す gain() は、盤を 実際に 動かす ときと ロボットの 読みの 中でしか
     呼ばれない。★ REVERSI.verify() が 画面側の 光りの 関数を 走査して たしかめる。

   ⚠️ 外部の ライブラリ・フォント・画像は 0。外への 通信も 0。
   ============================================================ */
(function (root) {
  'use strict';

  /* ── 8つの 向き（たて・よこ・ななめ）───────────────── */
  var DIRS = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

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
     ★ 寸法の 決めごと（ルル §1-3・§1-6。★ここ 1か所だけ）
     ------------------------------------------------------------
       盤は 正方形。ますの 線は **マスの 中に** 描く（＝ 場所を 食わない）。
       盤の ふちだけ 1px。
         盤の 一辺 = min( 器のはば , 器のたて − 帯 − すきま )
         1マス     = floor( (盤の一辺 − ふち×2) / n )
       ★ トランプの fit()（1pxずつ 下げて 探す）は 要らない。割り算 1回。

     ★ 横向きの 低い 画面（たてが 足りない）だけ、帯を 右よこに 置く
       ―― たてを 食わせない ため（ルル §1-4）。切りかえの 線は
       SIDE_BAND_H ただ1つ。
     ============================================================ */
  var DIM = {
    BAR:   24,   // 石の数の 帯（たて向き＝高さ／横向き＝はば）
    GAP:    8,   // 盤と 帯の すきま
    FRAME:  1,   // 盤の ふち（片側）
    SIDE_BAND_H: 320,  // 器の たてが これ未満 なら 帯を 右よこへ（横向き 812×375 は 225px）
    CELL_MIN: 14,      // これ以下には しない（保険）
    STONE_RATE: 0.82,  // 石の 直径 ＝ マス × 0.82
    HINT_RATE:  0.28   // 置ける所の 光り ＝ マス × 0.28（★石と 見まちがえない 大きさ）
  };

  /* 器の 中身（W×H）から 1マスを 出す。★n 以外の 数字は 上の DIM から しか 来ない。 */
  function fitBoard(W, H, n) {
    var sideBand = H < DIM.SIDE_BAND_H;
    var availW = sideBand ? (W - DIM.BAR - DIM.GAP) : W;
    var availH = sideBand ? H : (H - DIM.BAR - DIM.GAP);
    var side = Math.min(availW, availH);
    var cell = Math.max(DIM.CELL_MIN, Math.floor((side - DIM.FRAME * 2) / n));
    var board = cell * n + DIM.FRAME * 2;
    return {
      cell: cell,
      board: board,
      stone: Math.round(cell * DIM.STONE_RATE),
      hint:  Math.round(cell * DIM.HINT_RATE),
      bar:   DIM.BAR,
      gap:   DIM.GAP,
      frame: DIM.FRAME,
      sideBand: sideBand,
      needW: sideBand ? (board + DIM.GAP + DIM.BAR) : board,
      needH: sideBand ? board : (board + DIM.GAP + DIM.BAR)
    };
  }

  /* ============================================================
     ★ 盤（n×n・0＝空 1＝先手（人） 2＝後手（ロボット））
     ------------------------------------------------------------
     ★ はじめの 4つの石も、角の 4か所も、n から 計算する（手で 書かない）。
     ============================================================ */
  function makeCore(n) {
    var N = n * n;

    /* 各マスから 8方向へ 伸びる 道を 先に 作っておく（毎回 数えない）*/
    var rays = new Array(N);
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) {
      var i = r * n + c, list = [];
      for (var d = 0; d < DIRS.length; d++) {
        var path = [], rr = r + DIRS[d][0], cc = c + DIRS[d][1];
        while (rr >= 0 && rr < n && cc >= 0 && cc < n) { path.push(rr * n + cc); rr += DIRS[d][0]; cc += DIRS[d][1]; }
        if (path.length >= 2) list.push(path);   // 2マス無い 向きは はさめない
      }
      rays[i] = list;
    }

    /* ★ となりの マス（8方向）。★置ける所は 必ず「相手の 石の となり」なので、
       ここで ふるいに かけると gain() を 呼ぶ 回数が ぐっと 減る（＝ 読みが 速く なる）。
       ★ 結果は 1つも 変わらない ―― ただの 早い ふるい。 */
    var nbr = new Array(N);
    for (var r2 = 0; r2 < n; r2++) for (var c2 = 0; c2 < n; c2++) {
      var i2 = r2 * n + c2, nl = [];
      for (var d2 = 0; d2 < DIRS.length; d2++) {
        var rr2 = r2 + DIRS[d2][0], cc2 = c2 + DIRS[d2][1];
        if (rr2 >= 0 && rr2 < n && cc2 >= 0 && cc2 < n) nl.push(rr2 * n + cc2);
      }
      nbr[i2] = nl;
    }
    function touchesOpp(b, i, opp) {
      var nl = nbr[i];
      for (var k = 0; k < nl.length; k++) if (b[nl[k]] === opp) return true;
      return false;
    }

    /* ★ はじめの 形（まん中の 4マス）― n から 出す */
    var MID = n / 2;
    function start() {
      var b = (typeof Int8Array !== 'undefined') ? new Int8Array(N) : new Array(N);
      if (!(b instanceof Object) || b.length !== N) { b = new Array(N); }
      for (var k = 0; k < N; k++) b[k] = 0;
      b[(MID - 1) * n + (MID - 1)] = 2;
      b[(MID - 1) * n + MID]       = 1;
      b[MID * n + (MID - 1)]       = 1;
      b[MID * n + MID]             = 2;
      return b;
    }

    /* ★ 見る 順番の 目安（★読みを 速く する ためだけ・n から 出す）
       ------------------------------------------------------------
       ★ これは「評価」では ない。評価は 最後まで **石の数の 差** ただ1つ。
         良さそうな 手を 先に 見ると 枝が 早く 切れて 速く なる、それだけ。
         ★ 出てくる 答えは 並べかえても 1つも 変わらない。
       ★ そして この 表は 画面に 1ミリも 出ない（どこが 良い所かは 教えない）。 */
    var sqOrder = new Array(N);
    for (var r3 = 0; r3 < n; r3++) for (var c3 = 0; c3 < n; c3++) {
      var dr = Math.min(r3, n - 1 - r3), dc = Math.min(c3, n - 1 - c3);
      var lo = Math.min(dr, dc), hi = Math.max(dr, dc), v;
      if (lo === 0 && hi === 0) v = 0;
      else if (lo === 0 && hi >= 2) v = 2;
      else if (lo >= 2) v = 3;
      else if (lo === 1 && hi >= 2) v = 5;
      else if (lo === 0 && hi === 1) v = 6;
      else v = 7;
      sqOrder[r3 * n + c3] = v;
    }

    /* ★ 角の 4か所 ― n から 出す（★画面には 1つも 教えない。人の 模型でだけ 使う）*/
    var CORNERS = [0, n - 1, n * (n - 1), N - 1];
    function isCorner(i) { return i === CORNERS[0] || i === CORNERS[1] || i === CORNERS[2] || i === CORNERS[3]; }

    /* ★ ひっくり返る 枚数（0なら 置けない）
       ⚠️ これを 画面に 渡す 経路は 1本も 無い（ルル §5-6 の 2番）。 */
    function gain(b, i, me) {
      if (b[i] !== 0) return 0;
      var opp = 3 - me, list = rays[i], tot = 0;
      for (var k = 0; k < list.length; k++) {
        var p = list[k], j = 0;
        while (j < p.length && b[p[j]] === opp) j++;
        if (j > 0 && j < p.length && b[p[j]] === me) tot += j;
      }
      return tot;
    }

    /* 実際に 置く。ひっくり返った 場所の 一覧を 返す（★動きを 付ける ために 要る）*/
    function play(b, i, me) {
      var opp = 3 - me, fl = [], list = rays[i];
      for (var k = 0; k < list.length; k++) {
        var p = list[k], j = 0;
        while (j < p.length && b[p[j]] === opp) j++;
        if (j > 0 && j < p.length && b[p[j]] === me) for (var t = 0; t < j; t++) { b[p[t]] = me; fl.push(p[t]); }
      }
      b[i] = me;
      return fl;
    }
    function unplay(b, i, fl, me) {
      var opp = 3 - me;
      for (var t = 0; t < fl.length; t++) b[fl[t]] = opp;
      b[i] = 0;
    }

    function moveList(b, me) {
      var o = [], opp = 3 - me;
      for (var i = 0; i < N; i++) if (b[i] === 0 && touchesOpp(b, i, opp) && gain(b, i, me) > 0) o.push(i);
      return o;
    }
    function moveCount(b, me) {
      var c = 0, opp = 3 - me;
      for (var i = 0; i < N; i++) if (b[i] === 0 && touchesOpp(b, i, opp) && gain(b, i, me) > 0) c++;
      return c;
    }
    function empties(b) { var e = 0; for (var i = 0; i < N; i++) if (b[i] === 0) e++; return e; }
    function count(b, me) { var c = 0; for (var i = 0; i < N; i++) if (b[i] === me) c++; return c; }
    function diff(b, me) { var a = 0, w = 0; for (var i = 0; i < N; i++) { if (b[i] === 1) a++; else if (b[i] === 2) w++; } return me === 1 ? a - w : w - a; }
    function clone(b) { var o = start(); for (var i = 0; i < N; i++) o[i] = b[i]; return o; }

    return { n: n, N: N, MID: MID, CORNERS: CORNERS, isCorner: isCorner, sqOrder: sqOrder,
             rays: rays, nbr: nbr,
             start: start, gain: gain, play: play, unplay: unplay,
             moveList: moveList, moveCount: moveCount, empties: empties,
             count: count, diff: diff, clone: clone };
  }

  /* ============================================================
     ★★ ロボットの 強さ ―― 5段（社長裁定2）★★
     ------------------------------------------------------------
     ★ 名前は「つよさ」で 分ける（社長指示）。中身は ルルの案の まま。
     ★ 画面に 手数の 数字は 1つも 出さない（ルル §3-2）。
       そのかわり「何手 読むか」の ちがいは **帯の 伸び方** に そのまま 出る：
         弱い（1手）   … いちばん 多く 取れる 所に 置く
                        → 中盤で 帯が ロボット側に ぐんぐん 伸びて、終盤で ひっくり返る
         最強（読みきり）… 今 少なく 取っても あとで 取り返せる 所に 置く
                        → 帯は ずっと 人の側に 伸びたまま、終盤で ごっそり 返される
       ★「たくさん 取っても 勝てない」を、説明ゼロで ロボットが 実演する。
     ★ 言葉づかい：弱・強・最 は すべて 小6まで（設計図 §9.6）。
     ============================================================ */
  var LEVELS = [
    { label: '弱い',      depth: 1, exact: 0  },   // ★ はじめは これ（社長裁定3）
    { label: 'ふつう',    depth: 3, exact: 0  },
    { label: '強い',      depth: 5, exact: 0  },
    { label: 'とても 強い', depth: 7, exact: 0 },
    /* ★ exact ＝ 残り 何マスに なったら 終わりまで 読みきるか
       ★ exactAt ＝ その 数字を 測った ときの マスの数（★盤の 大きさでは なく「測った 条件」） */
    { label: '最強',      depth: 7, exact: 12, exactAt: 64 }
  ];
  var LEVEL_START = 0;   // ★ 一番下（社長裁定3）

  /* ★ 読みきりの 線 ―― ルル §3-7 の 実測から
       マスが 64個の 盤 … 残り12マスから（ルルのパソコンで 32ms）
       マスが 36個の 盤 … 残り14マスから（108ms）
     ★ マスが 少ない 盤ほど 枝が 少ない ので、その ぶん 深く 読める。
       上の 2点を 結んで「マスが 14個 減るごとに 1マス 深く」と 置いた。
     ⚠️ 13本目（6×6）を 出す ときは、必ず 実機で 測り直して この 値を 見直すこと
        （★線は「1手 0.6秒」―― ルル §3-7）。 */
  function exactFromFor(n, lv) {
    if (!lv || !lv.exact) return 0;
    return lv.exact + Math.round(((lv.exactAt || n * n) - n * n) / 14);
  }

  function makeRobot(G) {
    var N = G.N, rays = G.rays, nbr = G.nbr, sqOrder = G.sqOrder, empties = G.empties;

    /* ★★ 読みの 中だけで 使う「速い 盤操作」★★
       ------------------------------------------------------------
       中身は G.play / G.moveList と まったく 同じ ルール。ちがうのは
       **毎回 新しい 入れものを 作らない** ことだけ（作ると ごみ集めで おそくなる）。
       ★ 深さごとに 入れものを 先に 1つずつ 用意して、使い回す。
       ⚠️ ルル §3-7 の「1手 0.6秒」を 守る ために ここが 要る
          （素直に 書くと 8×8・7手読みの 最悪が 772ms ＝ スマホで 2〜4秒）。 */
    var MAXD = N + 8;
    var mvBuf = [], flBuf = [], keyBuf = [];
    for (var q = 0; q < MAXD; q++) {
      mvBuf.push(new Int32Array(N));
      flBuf.push(new Int32Array(N));
      keyBuf.push(new Int32Array(N));
    }

    function gainQ(b, i, me) {
      var opp = 3 - me, list = rays[i], tot = 0;
      for (var k = 0; k < list.length; k++) {
        var p = list[k], j = 0, L = p.length;
        while (j < L && b[p[j]] === opp) j++;
        if (j > 0 && j < L && b[p[j]] === me) tot += j;
      }
      return tot;
    }
    /* 置ける所を buf に 入れて 個数を 返す（★新しい 配列を 作らない）*/
    function movesInto(b, me, buf) {
      var opp = 3 - me, cnt = 0;
      for (var i = 0; i < N; i++) {
        if (b[i] !== 0) continue;
        var nl = nbr[i], touch = false;
        for (var t = 0; t < nl.length; t++) if (b[nl[t]] === opp) { touch = true; break; }
        if (!touch) continue;
        if (gainQ(b, i, me) > 0) buf[cnt++] = i;
      }
      return cnt;
    }
    function countMoves(b, me) {
      var opp = 3 - me, cnt = 0;
      for (var i = 0; i < N; i++) {
        if (b[i] !== 0) continue;
        var nl = nbr[i], touch = false;
        for (var t = 0; t < nl.length; t++) if (b[nl[t]] === opp) { touch = true; break; }
        if (touch && gainQ(b, i, me) > 0) cnt++;
      }
      return cnt;
    }
    function playQ(b, i, me, out) {
      var opp = 3 - me, list = rays[i], m = 0;
      for (var k = 0; k < list.length; k++) {
        var p = list[k], j = 0, L = p.length;
        while (j < L && b[p[j]] === opp) j++;
        if (j > 0 && j < L && b[p[j]] === me) for (var t = 0; t < j; t++) { b[p[t]] = me; out[m++] = p[t]; }
      }
      b[i] = me;
      return m;
    }
    function unplayQ(b, i, out, m, me) {
      var opp = 3 - me;
      for (var t = 0; t < m; t++) b[out[t]] = opp;
      b[i] = 0;
    }
    /* ★ 目じるし ＝ 石の数の 差。★最後まで これ ただ1つ（位置の 点数は 足さない）*/
    function diffQ(b, me) {
      var a = 0, w = 0;
      for (var i = 0; i < N; i++) { if (b[i] === 1) a++; else if (b[i] === 2) w++; }
      return me === 1 ? a - w : w - a;
    }

    /* ★ 手の 並べかえ（★読みを 速く する ためだけ。答えは 1つも 変わらない）
         深い ふし … 実際に 置いて「相手の 置ける所」を 数えて 少ない順
         浅い ふし … 表びき（sqOrder）だけ。ほぼ ただ
       ⚠️ この 並べかえは 画面に 1ミリも 出ない（どこが 良い所かは 教えない）。 */
    function sortMoves(b, me, buf, cnt, key, deep) {
      if (cnt < 2) return;
      var k, fl = flBuf[0], m;
      for (k = 0; k < cnt; k++) {
        if (deep) { m = playQ(b, buf[k], me, fl); key[k] = countMoves(b, 3 - me); unplayQ(b, buf[k], fl, m, me); }
        else key[k] = sqOrder[buf[k]];
      }
      for (k = 1; k < cnt; k++) {          // 数が 少ない ので 素直な 挿入ならべかえ
        var kv = key[k], bv = buf[k], j = k - 1;
        while (j >= 0 && key[j] > kv) { key[j + 1] = key[j]; buf[j + 1] = buf[j]; j--; }
        key[j + 1] = kv; buf[j + 1] = bv;
      }
    }

    /* ふつうの 読み（depth手 先まで・目じるし ＝ 石の数の 差）*/
    function search(b, me, depth, alpha, beta, passed, ply) {
      if (depth <= 0) return diffQ(b, me);
      var buf = mvBuf[ply], cnt = movesInto(b, me, buf);
      if (!cnt) {
        if (passed) return diffQ(b, me);
        return -search(b, 3 - me, depth, -beta, -alpha, true, ply + 1);
      }
      if (depth >= 2) sortMoves(b, me, buf, cnt, keyBuf[ply], depth >= 5);
      var best = -9999, fl = flBuf[ply + 1];
      for (var k = 0; k < cnt; k++) {
        var i = buf[k], m = playQ(b, i, me, fl);
        var v = -search(b, 3 - me, depth - 1, -beta, -alpha, false, ply + 1);
        unplayQ(b, i, fl, m, me);
        if (v > best) best = v;
        if (best > alpha) alpha = best;
        if (alpha >= beta) break;
      }
      return best;
    }

    /* ★ 終わりまで 読みきる（順番づけ：相手の 置ける所が 少ない 手から）*/
    function solve(b, me, alpha, beta, passed, ply) {
      var buf = mvBuf[ply], cnt = movesInto(b, me, buf);
      if (!cnt) {
        if (passed) return diffQ(b, me);
        return -solve(b, 3 - me, -beta, -alpha, true, ply + 1);
      }
      sortMoves(b, me, buf, cnt, keyBuf[ply], true);
      var best = -9999, fl = flBuf[ply + 1];
      for (var k = 0; k < cnt; k++) {
        var i = buf[k], m = playQ(b, i, me, fl);
        var v = -solve(b, 3 - me, -beta, -alpha, false, ply + 1);
        unplayQ(b, i, fl, m, me);
        if (v > best) best = v;
        if (best > alpha) alpha = best;
        if (alpha >= beta) break;
      }
      return best;
    }

    /* ★★ 段の 切りかえは「手番の はじめ 1回だけ」★★
       ------------------------------------------------------------
       ⚠️ ルル §3-8 で ルルが 実際に 落ちた 穴：
         読みの 中の どの ふしでも「残り12マス以下なら 読みきる」と 書くと、
         7手読みの 途中に 12マスの ふしが 何千個も 出てきて、その 1つ1つで
         完全読みが 走る ―― ★止まらない。
       ★ だから ここ（手番の はじめ）で 1回だけ 決める。 */
    var nowMs = (typeof Date !== 'undefined') ? function () { return Date.now(); } : function () { return 0; };

    /* 根っこで 深さ d を 読む。同じ 値の 手は ぜんぶ 返す（★選ぶのは さいころ）*/
    function rootAt(b, me, ms, d) {
      var best = -99999, list = [], vals = [], fl = flBuf[1];
      for (var k = 0; k < ms.length; k++) {
        var i = ms[k], m = playQ(b, i, me, fl);
        var v = -search(b, 3 - me, d - 1, -9999, 9999, false, 2);
        unplayQ(b, i, fl, m, me);
        vals.push({ i: i, v: v });
        if (v > best) { best = v; list = [i]; } else if (v === best) list.push(i);
      }
      vals.sort(function (x, y) { return y.v - x.v; });     // ★ 次の 深さで 良い手から 見る ため
      var ordered = [];
      for (var t = 0; t < vals.length; t++) ordered.push(vals[t].i);
      return { list: list, ordered: ordered };
    }

    /* ★ pick(盤, 自分の色, 置ける所, 深さ, 読みきりの線, さいころ, 待てる時間ms)
       ★ budget を 省くと 時間で 打ち切らない（＝ 勝率を 数える ときは いつも 全部 読む）。 */
    function pick(b, me, ms, depth, exactFrom, rand, budget) {
      if (exactFrom > 0 && empties(b) <= exactFrom) {
        /* ★ 終わりまで 読みきる。★切りかえは ここ（手番の はじめ）1回だけ
             ―― 読みの 中で 切りかえると 節が 爆発して 止まらない（ルル §3-8）。 */
        var best = -99999, list = [], fl = flBuf[1];
        for (var k = 0; k < ms.length; k++) {
          var i = ms[k], m = playQ(b, i, me, fl);
          var v = -solve(b, 3 - me, -9999, 9999, false, 2);
          unplayQ(b, i, fl, m, me);
          if (v > best) { best = v; list = [i]; } else if (v === best) list.push(i);
        }
        return list[Math.floor(rand() * list.length) % list.length];
      }
      /* ★ 中盤：浅い方から 順に 深くする（前の 深さの 結果で 良い手から 見る ＝ 速い）。
         ★ そして 待てる時間を 超えそうなら、そこで 止める
           ―― おそい 端末でも「1手 ずっと 待たされる」を 起こさない。
           ★ 速い 端末では 必ず 最後の 深さまで 届く（＝ 表の 勝率は そのまま）。 */
      var t0 = nowMs(), cur = ms, res = null, d0 = Math.max(1, depth - 2);
      for (var d = d0; d <= depth; d++) {
        res = rootAt(b, me, cur, d);
        cur = res.ordered;
        if (d < depth && budget > 0 && (nowMs() - t0) * 4 > budget) break;
      }
      return res.list[Math.floor(rand() * res.list.length) % res.list.length];
    }

    /* ★ たしかめ用に 外へ 出す（★画面からは 1度も 呼ばない）*/
    pick.search = search;
    pick.solve = solve;
    pick.src = function () { return String(search) + String(solve) + String(pick) + String(sortMoves); };
    return pick;
  }

  /* ============================================================
     ★ 人の 模型（★勝率を 数える ためだけ。★遊ぶ 画面では 1度も 使わない）
     ------------------------------------------------------------
     ★ 本物の 人は 7手先を 読んでいない。「知っていること」で 打っている。
       だから 4つとも **先を 1手も 読まない**（ルル §3-6）。
         でたらめ       … 覚えることの 数 0個
         たくさん とる  … 1個
         角を 知っている … 2個（★この 2つで 勝率が 1.0% → 50.5% に 跳ねる）
         手を 減らす    … 3個
     ⚠️ 「角」は 画面に 1文字も 出さない。ここは 数を 測る ための 模型。
     ============================================================ */
  function makeHumans(G) {
    var n = G.n, gain = G.gain, play = G.play, unplay = G.unplay, moveCount = G.moveCount;
    var cornerRC = [[0, 0], [0, n - 1], [n - 1, 0], [n - 1, n - 1]];

    function nearCornerPenalty(b, i) {
      var r = (i / n) | 0, c = i % n, pen = 0;
      for (var k = 0; k < cornerRC.length; k++) {
        var cr = cornerRC[k][0], cc = cornerRC[k][1];
        if (b[cr * n + cc] !== 0) continue;             // 角が すでに 埋まっていれば こわくない
        var dr = Math.abs(r - cr), dc = Math.abs(c - cc);
        if (dr <= 1 && dc <= 1 && !(dr === 0 && dc === 0)) pen += (dr === 1 && dc === 1) ? 50 : 20;
      }
      return pen;
    }
    function bestOf(ms, score, rand) {
      var best = -1e9, list = [];
      for (var k = 0; k < ms.length; k++) {
        var v = score(ms[k]);
        if (v > best) { best = v; list = [ms[k]]; } else if (v === best) list.push(ms[k]);
      }
      return list[Math.floor(rand() * list.length) % list.length];
    }

    return {
      'でたらめ': function (b, me, ms, rand) { return ms[Math.floor(rand() * ms.length) % ms.length]; },
      'たくさん とる': function (b, me, ms, rand) { return bestOf(ms, function (i) { return gain(b, i, me); }, rand); },
      '角を 知っている': function (b, me, ms, rand) {
        return bestOf(ms, function (i) {
          var v = gain(b, i, me);
          if (G.isCorner(i)) v += 100;
          return v - nearCornerPenalty(b, i);
        }, rand);
      },
      '手を 減らす': function (b, me, ms, rand) {
        return bestOf(ms, function (i) {
          var v = 0;
          if (G.isCorner(i)) v += 100;
          v -= nearCornerPenalty(b, i);
          var fl = play(b, i, me);
          v -= moveCount(b, 3 - me) * 5;
          unplay(b, i, fl, me);
          return v;
        }, rand);
      }
    };
  }

  /* ============================================================
     ★ 1試合 まるごと 走らせる（画面ぬき）
     ------------------------------------------------------------
     戻り値 { r: 1勝ち/0引き分け/-1負け, my, op, plies, passes, filled }
     ★ stat に ためた 数字が、そのまま 検証の 材料に なる。
     ============================================================ */
  function simGame(G, robot, humanFn, level, humanBlack, rand, stat) {
    var b = G.start(), me = 1, passed = false, plies = 0, passes = 0, guard = 0;
    var ef = exactFromFor(G.n, level);
    while (guard++ < G.N * 4) {
      var ms = G.moveList(b, me);
      if (!ms.length) {
        if (passed) break;
        passed = true; passes++; me = 3 - me; continue;
      }
      passed = false;
      var isHuman = ((me === 1) === humanBlack);
      var i = isHuman ? humanFn(b, me, ms, rand) : robot(b, me, ms, level.depth, ef, rand);
      if (b[i] !== 0 || G.gain(b, i, me) === 0) { if (stat) stat.illegal++; break; }
      G.play(b, i, me);
      plies++;
      me = 3 - me;
    }
    var hc = humanBlack ? 1 : 2;
    var my = G.count(b, hc), op = G.count(b, 3 - hc);
    if (stat) {
      stat.plies += plies; stat.passes += passes; stat.games++;
      stat.stones += my + op;
      if (my + op !== G.N) stat.notFull++;
      if (my + op > G.N) stat.badCount++;
    }
    return { r: my > op ? 1 : (my < op ? -1 : 0), my: my, op: op, plies: plies, passes: passes, filled: my + op === G.N };
  }

  /* 何試合も 走らせて 勝率を 出す（人は 先手 半分／後手 半分）*/
  function runMany(G, robot, humanFn, level, games, seed) {
    var rand = rng(seed), w = 0, d = 0, l = 0;
    var stat = { plies: 0, passes: 0, games: 0, stones: 0, notFull: 0, badCount: 0, illegal: 0 };
    for (var g = 0; g < games; g++) {
      var r = simGame(G, robot, humanFn, level, g % 2 === 0, rand, stat);
      if (r.r > 0) w++; else if (r.r < 0) l++; else d++;
    }
    return {
      games: games, win: w / games, draw: d / games, lose: l / games,
      plies: stat.plies / games, passes: stat.passes / games,
      notFull: stat.notFull / games, badCount: stat.badCount, illegal: stat.illegal
    };
  }

  root.REVERSI_CORE = {
    DIRS: DIRS, DIM: DIM, LEVELS: LEVELS, LEVEL_START: LEVEL_START,
    rng: rng, fitBoard: fitBoard, makeCore: makeCore,
    makeRobot: makeRobot, makeHumans: makeHumans,
    exactFromFor: exactFromFor, simGame: simGame, runMany: runMany
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
