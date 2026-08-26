/* ============================================================
   五目並べ ― 中身（CORE）／ T134・コーダ
   ------------------------------------------------------------
   仕様は logs/T133_五目並べ_仕様_ルル.md ＋ 社長の裁定4つ が 正。

   ★★ 社長の裁定（4つ・厳守）★★
     判断1 ★★ 指を 置いた 所より **14mm 上**に ねらい（白い 輪）が 出る。
              ★ すべらせて 直せる。★はなした 所に 置かれる。★マウスは ずらさない
     判断2 ★ 盤は **15路 × 15路**（320pxで 1目 20px）
     判断3 ★ **最後の 1手に 赤い丸**（★1つだけ・手の 番号は 付けない）
     判断4 ★ 初期値は **2段「ふつう」**

   ★★ ルルが 自分で 決めた こと（そのまま 守る）★★
     ★ 禁じ手（連珠）は 入れない ／ ★人が 先手（黒）で 固定 ／ ★もどすは 作らない
     ★「あなたの番です。」の 文字は 出さない ／ ★碁盤の 星を 5つ 描く

   ★★ この ファイルの 役目 ★★
     ------------------------------------------------------------
     ルール・ロボット・寸法の 計算が **ぜんぶ ここ 1本**に 入っている。
     document を 1回も さわらない ので、**Node からも そのまま 動く**
     （＝ 勝率を 数える 側と、実際に 遊ぶ 側の ロボットが 同じ 1本の コード。
        ★分けると 必ず ずれる ―― ルル §9-4 の 名指し）。

   ★★ 盤の 大きさは 定数 1つ（LINES）だけ（ルル §9-1）★★
     ------------------------------------------------------------
     ★ この ファイルには 路の 数も 225 も 1つも 書いていない。
       makeCore(lines) に 渡された 1つから、
         5つの まどの 一覧・星の 場所・盤の px・石の 大きさ ―― 全部が 計算で 出る。
     ★ 数字を 書いてよいのは index.html の 1行だけ。

   ★★ 置く前に「5つ 並ぶか」を 出す 経路は 1本も 無い（ルル §9-2 の 3番）★★
     ------------------------------------------------------------
     ★ 画面に 渡すのは「どの 交点が 空いているか」と「最後に 置いた 場所」だけ。
       5つ 続いたかを 見る winsAt() / winPoints() は、**石が 置かれた あと**と
       **ロボットの 読みの 中**でしか 呼ばれない。
     ★ GOMOKU.verify() が 画面側の 関数を 毎回 走査して たしかめる。

   ★★ ロボットが ずるを しない ことの 保証（ルル §6-8）★★
     ------------------------------------------------------------
     盤は 両方に 見えている ので、ずるの 形は 1つだけ ―― **人の 次の手を 先に 知ること**。
     ロボットの 関数（search / pick）に 渡しているのは
       ① いまの 盤 ② 自分の 色 ③ 段 ④ さいころ ⑤ 待てる 時間
     の 5つだけ。★人の 打ち方（humans）を 1度も 渡していない。

   ⚠️ 外部の ライブラリ・フォント・画像は 0。外への 通信も 0。
   ⚠️ トランプを 1枚も 使わない ので、設計図 §9（絵札の ルール）は かかりません。
   ============================================================ */
(function (root) {
  'use strict';

  /* ★ 何個 続いたら 勝ちか。★ゲームの 名前 そのもの なので ここ 1か所に 置く。
     ★ 5つ **以上** 続けば 勝ち（★6つ・7つも 勝ち ―― 自由五目。ルル §7-2）。 */
  var NEED = 5;

  /* ★ 見る 向き（よこ・たて・ななめ2つ）。★5つの まどを 作る ためだけ。 */
  var DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];

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
     ★★ 寸法の 決めごと（ルル §1-3 の【計算】。★ここ 1か所だけ）★★
     ------------------------------------------------------------
     ★ 石は **線と 線の 交わる 所**に 置く（★マスでは ない）。
       ★ 外がわの 交点にも 置く ので、上下左右に 半目ずつの ふちが 要る。
         → ★★盤ぜんたい ＝ 1目 × 路（★「1目 ×（路−1）＋ 1目」と 同じ）

       ★ 1目 = min( floor(器のはば ÷ 路),
                     floor((器のたて − 帯24 − すきま8) ÷ 路),
                     CELL_MAX )

     ★ 割り算 2回。★四目並べと 同じ 形。★ちがうのは「1目 × 路」に なる ところだけ。
     ★ 盤の ふち（FRAME）は 引きません ―― ★青い わくの 内がわが すでに「器の中身」です。

     ★ 横向きの 低い 画面（たてが 足りない）だけ、帯を 右よこに 置く
       ―― たてを 食わせない ため（ルル §2-5）。切りかえの 線は SIDE_BAR_H ただ1つ。
     ============================================================ */
  var DIM = {
    BAR:   24,   // ★ 次の 石の 帯（たて向き＝高さ／横向き＝はば）。★盤の 取り分は いつも これで 計算
    GAP:    8,   // 盤と 帯の すきま
    SIDE_BAR_H: 320,   // 器の たてが これ未満 なら 帯を 右よこへ（横向き 812×375 は 225px）
    CELL_MIN: 10,      // これ以下には しない（保険）

    /* ★★ T130 の 教訓を 先に 入れる（ルル §9-3）★★
       ★ 上限を 置かないと 1512×945 で 1目 49px・盤 735×735 ＝ 画面の たての 78%。
         ★ T130 で 社長は「盤が デカすぎる」と 言われ、アトが 82% → 66% に 落とした。
       ★ 41px なら 盤 615×615 ＝ 1512×945 の たての **65%**（★T130 の 66% と 同じ 高さ）。
       ⚠️★ 決めるのは 🎨アト。★動かすのは この 1つ だけ（T130 §7 の 申し送り）。 */
    CELL_MAX: 41,

    STONE_RATE: 0.86,  // 石の 直径 ＝ 1目 × 0.86（★320px・1目20px → 17px。ルル §7-5 の【計算】と 同じ）
    AIM_RATE:   0.92,  // ★ねらいの 輪の 直径 ＝ 1目 × 0.92
    STAR_RATE:  0.16,  // ★碁盤の 星 ＝ 1目 × 0.16（★320pxで 3px。★石 17px と 見まちがえない）

    /* ★★★ 判断1 ―― ねらいを 指の 何mm 上に 出すか ★★★
       ------------------------------------------------------------
       ★★ この 数字は ここ 1か所 だけ です。★ほかの 場所に 14 も 86 も 89 も 書きません。
       ★ 実寸（mm）で 決める 理由：★指の 大きさは 路数でも 画面の 大きさでも 変わらないから。

       ★★ 12 → 14 に した 理由（T135・トライの 実測と 社長の 裁定）★★
         ★ 12mm の とき、輪の 下ふち（74 − 9 ＝ 65px ＝ 10.5mm）と
           ★「見えない はんい」（半径 8mm ＝ 49px）の すきまが **2.6mm しか ない**。
         ★ 14mm なら 輪の 下ふち ＝ 86 − 9 ＝ 77px ＝ 12.5mm。★指先が 12mm 隠す 人でも 外に 出る。
         ⚠️★ **15mm 以上は パソコンの verify ⑬ が 割れます**（トライ実測）。★14 が 上限 です。
       ★ 直すのは ここ 1か所 だけ。★合わなければ 12 に 戻せます。 */
    AIM_LIFT_MM: 14,

    /* ★ 1pxの 実寸（T68 §3-2・会社の 実測）。★14mm を pxに 直す ために だけ 使う。
       ★ 320pt … 0.162mm ／ 375pt以上 … 0.157mm
       → ★14 ÷ 0.162 ＝ **86px**（320px）／ 14 ÷ 0.157 ＝ **89px**（375px 以上）
       （★12mm の ときは 74px ／ 76px でした ―― ルル §3-3 の 表）
       ⚠️★ さわれる パソコン・タブレットの 1pxの 実寸は 持って いません（T134 §3-6）。
          ★ そこでは 0.157 を 使う ので、★実寸より 少し 大きめに ずらします（安全側）。 */
    MM_PER_PX_SMALL: 0.162,
    MM_PER_PX:       0.157,
    SMALL_W: 340
  };

  /* ★ 画面の はばから「1pxが 何mmか」を 出す（T68 §3-2 の 2つの 実測値だけ）*/
  function mmPerPx(vw) { return (vw <= DIM.SMALL_W) ? DIM.MM_PER_PX_SMALL : DIM.MM_PER_PX; }
  /* ★★ 14mm が 何px に なるか（★ここ だけが AIM_LIFT_MM を 読む）*/
  function liftPx(vw) { return Math.round(DIM.AIM_LIFT_MM / mmPerPx(vw)); }

  /* ★★ 盤の 下ふちより **下**に 何px 要るか（★受け皿の 深さ）★★
     ------------------------------------------------------------
     ★ 一番 下の 行（15行目）の 交点は、盤の 下ふちから 半目 上に あります。
     ★ そこを ねらう 指は その ずらしぶん 下 ―― ★＝ 盤の 外に (ずらし − 半目) だけ 出ます。
     ★ だから 要る 受け皿は「ずらし ぜんぶ」では なく「ずらし − 半目」です。 */
  function trayNeed(cell, lift) { return Math.max(0, Math.ceil(lift - cell / 2)); }

  /* 器の 中身（W×H）から 1目を 出す。★路 いがいの 数字は 上の DIM から しか 来ない。

     ★★★ T137 ―― 第4引数 lift（★指の ずらし px。★マウスだけの 端末は 0）★★★
     ------------------------------------------------------------
     ★ T135 で トライが 見つけた 事故：
       ★ たてで 1目が 決まる 画面（タブレット 横向き・窓の 低い パソコン）では、
         ★盤が たてを 使いきり、★余りは 帯（BAR）が 食べ、★★受け皿が 0 に なる。
       → ★ ずらしが 黙って 10〜14px に 縮み、★輪が 指の 下に 出る。
     ★ 直し：★**受け皿ぶんも たての 予算に 入れてから 1目を 決める。**
       ★ 入らなければ 1目を 1pxずつ 下げる（★盤が 少し 小さくなる）。
       ⚠️★ **lift が 0 の とき（＝ マウスだけの 端末・横向き）は 1pxも 変わりません。**
          ★ マウスは ずらさない ので、★盤を 小さくする 理由が ありません（T135 §3-6）。 */
  function fitBoard(W, H, lines, lift) {
    var side = H < DIM.SIDE_BAR_H;
    lift = side ? 0 : Math.max(0, lift | 0);          /* ★ 横向きは ずらさない（ルル §3-5）*/
    var availW = side ? (W - DIM.BAR - DIM.GAP) : W;
    var availH = side ? H : (H - DIM.BAR - DIM.GAP);
    var byW = Math.floor(availW / lines);
    var byH = Math.floor(availH / lines);
    /* ★ 上限（CELL_MAX）を かけてから 下限（CELL_MIN）で 受ける。★上限が 先（T130 と 同じ 作法）。 */
    var cell = Math.max(DIM.CELL_MIN, Math.min(byW, byH, DIM.CELL_MAX));

    /* ★★ 受け皿が 取れるまで 1目を 下げる（★lift が 0 なら 1度も 回りません）★★
       ★ 帯は いちばん 太くなった とき（石の 大きさ）で 見ます ―― ★甘く 見積もらない ため。 */
    var shrunk = 0;
    if (lift > 0) {
      while (cell > DIM.CELL_MIN) {
        var barMax = Math.max(Math.round(cell * DIM.STONE_RATE), 16);
        if (barMax + DIM.GAP + cell * lines + trayNeed(cell, lift) <= H) break;
        cell--; shrunk++;
      }
    }

    var bw = cell * lines, bh = cell * lines;
    var stone = Math.round(cell * DIM.STONE_RATE);

    /* ★ 盤が 使わなかった 余りを、帯に まわす（★盤は 1pxも やせない・設計図 追記③）
       ⚠️★ ただし **受け皿ぶんは 先に よけて おく** ―― ★帯に 食べられると 事故が 戻ります。 */
    var need = trayNeed(cell, lift);
    var used = DIM.BAR + DIM.GAP + (side ? bw : bh);
    var slack = Math.max(0, (side ? W : H) - used - (side ? 0 : need));
    var bar = Math.min(Math.max(stone, 16), DIM.BAR + slack);

    return {
      cell: cell, boardW: bw, boardH: bh,
      stone: stone,
      aim:  Math.round(cell * DIM.AIM_RATE),
      star: Math.max(3, Math.round(cell * DIM.STAR_RATE)),
      bar: bar, gap: DIM.GAP, side: side, slack: slack,
      lift: lift, trayNeed: need, shrunk: shrunk,
      needW: side ? (bw + DIM.GAP + bar) : bw,
      needH: side ? bh : (bh + DIM.GAP + bar + need)
    };
  }

  /* ============================================================
     ★ 盤（路×路・0＝空 1＝人（黒・先手） 2＝ロボット（白・後手））
     ------------------------------------------------------------
     ★ ならびは p = たて × 路 + よこ。★左上が 0。
     ★ 重力は ありません（四目並べと ちがう ところ）。★空いていれば どこでも 置ける。
     ============================================================ */
  function makeCore(lines) {
    var N = lines * lines;
    var NEAR = 2;                       // ★ 打てる 場所 ＝ 石から 2目 以内（ルルの 道具と 同じ）

    /* ★ 5つの まどを ぜんぶ 先に 作る（毎回 数えない）
       ★ 15路 なら 572本（よこ165・たて165・ななめ121＋121）*/
    var WINS = [];
    for (var y = 0; y < lines; y++) for (var x = 0; x < lines; x++) {
      for (var d = 0; d < DIRS.length; d++) {
        var dx = DIRS[d][0], dy = DIRS[d][1];
        var ex = x + dx * (NEED - 1), ey = y + dy * (NEED - 1);
        if (ex < 0 || ex >= lines || ey < 0 || ey >= lines) continue;
        var w = [];
        for (var k = 0; k < NEED; k++) w.push((y + dy * k) * lines + (x + dx * k));
        WINS.push(w);
      }
    }
    var WN = WINS.length;

    /* ★ その 交点を 通る まどだけ 引ける ように しておく */
    var byPoint = new Array(N);
    for (var i = 0; i < N; i++) byPoint[i] = [];
    for (var wi = 0; wi < WN; wi++) for (var t = 0; t < NEED; t++) byPoint[WINS[wi][t]].push(wi);

    /* ★★ 碁盤の 星（ルル §7-5：5つ・世の中の 15路盤と 同じ 場所）★★
       ★ 15路 … 4目め と まん中（0から 数えて 3・7・11）。
       ★ 路数から 計算で 出す（★数字を 手で 書かない）。 */
    var STARS = [];
    if (lines >= 9) {
      var mid = (lines - 1) >> 1;
      var edge = (lines >= 13) ? 3 : 2;
      var far = lines - 1 - edge;
      STARS = [edge * lines + edge, edge * lines + far, mid * lines + mid,
               far * lines + edge, far * lines + far];
    }

    /* ★ 1つの まどの ねうち（★自分だけ 入っている まど だけ 数える）
       ★ 相手の 石が 1つでも 入った まどは、もう 使えない ので 0。 */
    var VAL = [0, 1, 12, 120, 1200];
    function winVal(a, b) { return (b ? 0 : VAL[a]) - (a ? 0 : VAL[b]); }

    function newBoard() {
      return {
        bd: new Int8Array(N), n: 0,
        a: new Int16Array(WN),          // まどの 中の 黒の 数
        b: new Int16Array(WN),          // まどの 中の 白の 数
        sc: 0,                          // ★黒 から 見た 点（＋が 黒 有利）
        near: new Int16Array(N),        // ★その 交点の まわり2目に 石が 何個 あるか（打てる 場所さがし用）
        hist: [], last: -1
      };
    }

    /* ★ near（まわりに 石が あるか）を 1つぶん 動かす */
    function bump(g, p, s) {
      var x0 = p % lines, y0 = (p / lines) | 0;
      var yl = Math.max(0, y0 - NEAR), yh = Math.min(lines - 1, y0 + NEAR);
      var xl = Math.max(0, x0 - NEAR), xh = Math.min(lines - 1, x0 + NEAR);
      for (var yy = yl; yy <= yh; yy++) {
        var base = yy * lines;
        for (var xx = xl; xx <= xh; xx++) g.near[base + xx] += s;
      }
    }

    function put(g, p, c) {
      var ws = byPoint[p];
      for (var i = 0; i < ws.length; i++) {
        var w = ws[i];
        g.sc -= winVal(g.a[w], g.b[w]);
        if (c === 1) g.a[w]++; else g.b[w]++;
        g.sc += winVal(g.a[w], g.b[w]);
      }
      g.bd[p] = c; g.n++; g.hist.push(p); g.last = p;
      bump(g, p, 1);
      return p;
    }
    function undo(g) {
      var p = g.hist.pop(), c = g.bd[p];
      var ws = byPoint[p];
      for (var i = 0; i < ws.length; i++) {
        var w = ws[i];
        g.sc -= winVal(g.a[w], g.b[w]);
        if (c === 1) g.a[w]--; else g.b[w]--;
        g.sc += winVal(g.a[w], g.b[w]);
      }
      g.bd[p] = 0; g.n--; g.last = g.hist.length ? g.hist[g.hist.length - 1] : -1;
      bump(g, p, -1);
      return p;
    }

    /* ★ そこに 置いた 石で 5つ **以上** 続いたか（★置いた あとにしか 呼ばない）*/
    function winsAt(g, p, c) {
      var bd = g.bd, x0 = p % lines, y0 = (p / lines) | 0;
      for (var d = 0; d < DIRS.length; d++) {
        var dx = DIRS[d][0], dy = DIRS[d][1], cnt = 1;
        for (var s = -1; s <= 1; s += 2) {
          var x = x0 + dx * s, y = y0 + dy * s;
          while (x >= 0 && x < lines && y >= 0 && y < lines && bd[y * lines + x] === c) {
            cnt++; x += dx * s; y += dy * s;
          }
        }
        if (cnt >= NEED) return true;
      }
      return false;
    }

    /* ★ c が「次の 1手で 5つに できる」交点を 全部 返す */
    function winPoints(g, c, cand) {
      var out = [], list = cand || candidates(g);
      for (var i = 0; i < list.length; i++) {
        var p = list[i];
        if (g.bd[p]) continue;
        g.bd[p] = c;
        var w = winsAt(g, p, c);
        g.bd[p] = 0;
        if (w) out.push(p);
      }
      return out;
    }

    /* ★ 打てる 場所（★石から 2目 以内。★1手目は まん中 1つ）
       ⚠️ ここは「どこが 空いているか」だけ。★良い手かどうかは 1ビットも 出ていない。 */
    function candidates(g) {
      if (g.n === 0) { var m = (lines - 1) >> 1; return [m * lines + m]; }
      var out = [];
      for (var p = 0; p < N; p++) if (!g.bd[p] && g.near[p]) out.push(p);
      return out;
    }

    /* ★ 空いている 交点 ぜんぶ（★盤が 満杯かを 見る ためだけ）*/
    function emptyCount(g) { return N - g.n; }

    /* ★ 1つの 交点の ねうち（★並べかえ用。★置いてみて 点の 差を 見る）*/
    function gain(g, p, c) {
      var ws = byPoint[p], dsum = 0;
      for (var i = 0; i < ws.length; i++) {
        var w = ws[i], before = winVal(g.a[w], g.b[w]);
        var a = g.a[w], b = g.b[w];
        if (c === 1) a++; else b++;
        dsum += winVal(a, b) - before;
      }
      return c === 1 ? dsum : -dsum;
    }

    /* ============================================================
       ★★ 勝った 並びを **全部** 数える（★5つ 見つけて 止めない ―― ルル §7-2）★★
       ★ 自由五目では 6つ・7つ 続いても 勝ち。★続いている ぶん 全部 光らせる。
       ★ 並びが 2つ 同時に できる ことも ある（★わなが 決まった とき）。
       ============================================================ */
    function winLines(g) {
      var bd = g.bd, who = 0, out = [];
      for (var y = 0; y < lines; y++) for (var x = 0; x < lines; x++) {
        var p = y * lines + x, v = bd[p];
        if (!v) continue;
        for (var d = 0; d < DIRS.length; d++) {
          var dx = DIRS[d][0], dy = DIRS[d][1];
          /* ★ 続きの 途中なら 数えない（★並びの 先頭だけ 数える）*/
          var px = x - dx, py = y - dy;
          if (px >= 0 && px < lines && py >= 0 && py < lines && bd[py * lines + px] === v) continue;
          var run = [], cx = x, cy = y;
          while (cx >= 0 && cx < lines && cy >= 0 && cy < lines && bd[cy * lines + cx] === v) {
            run.push(cy * lines + cx); cx += dx; cy += dy;
          }
          if (run.length >= NEED) { who = v; out.push(run); }
        }
      }
      return { who: who, lines: out };
    }

    function clone(g) {
      var o = newBoard();
      o.bd.set(g.bd); o.a.set(g.a); o.b.set(g.b); o.near.set(g.near);
      o.n = g.n; o.sc = g.sc; o.last = g.last; o.hist = g.hist.slice();
      return o;
    }

    return {
      lines: lines, N: N, NEED: NEED, WINS: WINS, byPoint: byPoint, STARS: STARS,
      newBoard: newBoard, put: put, undo: undo,
      winsAt: winsAt, winPoints: winPoints, candidates: candidates,
      emptyCount: emptyCount, gain: gain, winLines: winLines, clone: clone
    };
  }

  /* ============================================================
     ★★ ロボットの 強さ ―― 5段（ルル §6-3）★★
     ------------------------------------------------------------
     ★ 中身は「何手 先まで 読むか」ただ 1つ。
       ★ わざと まちがえる ロボットは 作りません
         （★T60・T78・T88・T126 で 4回 落としたもの。★5回目も 落とします）。
     ★ 画面には 手数の 数字を 1つも 出しません。言葉だけ。
       そのかわり「何手 読むか」の ちがいは **2つの ことに そのまま 出ます**（ルル §6-3）：
         ★ 1段 → 2段 「あ、四つを 止めてきた」（23.5% → 100.0%）
         ★ 2段 → 3段 「あ、三の うちに つぶしてきた」（0.0% → 85.2%）
     ★ 言葉づかい：弱・強・最 は すべて 小6まで（設計図 §9.6）。

     ★★ 初期値は **2段「ふつう」**（★社長裁定 判断4 ＝ ①）★★

     ★★ K ＝「見る手」の 数（★ルル §6-5 の 【実測】）★★
       ★ 深さ6・K8 … 最大 283.8ms ❌（★出せない）
       ★ 深さ6・K5 … 最大 122.9ms ⚠️（★これに する）
       ★ 深さ6・K4 … 最大  30.6ms ✅（★実機で 0.6秒を 超えたら ここへ 下げる）
       ⚠️★ 動かすのは 下の LEVELS[4].K **1つ だけ**。★深さは 6の まま。★段の 名前も 変えない。
     ============================================================ */
  var LEVELS = [
    { label: '弱い',       depth: 0, K: 1 },
    { label: 'ふつう',     depth: 1, K: 8 },   /* ★ ここが 初期値（社長裁定 判断4 ＝ ①）*/
    { label: '強い',       depth: 2, K: 8 },
    { label: 'とても 強い', depth: 4, K: 8 },
    { label: '最強',       depth: 6, K: 5 }    /* ★★ 見る手 5（ルル §6-5）*/
  ];
  var LEVEL_START = 1;

  function makeRobot(G) {
    var INF = 1e9;
    var nowMs = (typeof performance !== 'undefined' && performance.now)
      ? function () { return performance.now(); }
      : function () { return Date.now(); };

    /* ★★ 安全弁（ルル §6-5・★これは 必ず 入れる）★★
       ------------------------------------------------------------
       ★ 手番の はじめに 時計を 見て、しめきり（deadline）を 決める。
       ★ しめきりを 過ぎたら 読みを その場で 止め、★**そこまでに 読み終えた いちばん 深い
         読みの 答え**を そのまま 打つ。
       ★★ ＝ 浅く 読むだけ です。★うそは 1つも つきません
          （★§6-2 の「わざと まちがえる」とは まったく ちがう）。
       ★ 途中で 止めた 読みの 答えは **捨てます**（★中途はんぱな 数字を 使わない）。 */
    var deadline = 0, aborted = false, nodes = 0, lastCut = false, lastDepth = 0;

    function search(g, depth, alpha, beta, c, K) {
      if (deadline && ((++nodes & 63) === 0) && nowMs() > deadline) { aborted = true; return { sc: 0, mv: -1 }; }
      var opp = 3 - c;
      var cand = G.candidates(g);
      /* ① 自分が いま 置けば 5つに なる → ★そこで 終わり */
      var myWin = G.winPoints(g, c, cand);
      if (myWin.length) return { sc: INF - g.n, mv: myWin[0] };
      /* ② 相手が 次に 5つに できる → ★ふさぐ しかない（枝が 1本に なる）*/
      var opWin = G.winPoints(g, opp, cand);
      var list;
      if (opWin.length) list = [opWin[0]];
      else {
        var scored = [];
        for (var i = 0; i < cand.length; i++) {
          var p = cand[i];
          scored.push({ p: p, v: G.gain(g, p, c) + G.gain(g, p, opp) * 0.9 });
        }
        scored.sort(function (x, y) { return y.v - x.v; });
        list = [];
        for (var k = 0; k < scored.length && k < K; k++) list.push(scored[k].p);
      }
      if (depth <= 0 || !list.length) {
        return { sc: (c === 1 ? g.sc : -g.sc), mv: list.length ? list[0] : -1 };
      }
      var best = -INF, bmv = list[0];
      for (var j = 0; j < list.length; j++) {
        var q = list[j];
        G.put(g, q, c);
        var r = -search(g, depth - 1, -beta, -alpha, opp, K).sc;
        G.undo(g);
        if (aborted) return { sc: 0, mv: -1 };
        if (r > best) { best = r; bmv = q; }
        if (best > alpha) alpha = best;
        if (alpha >= beta) break;
      }
      return { sc: best, mv: bmv };
    }

    /* ★★ pick(盤, 自分の色, 段, さいころ, 待てる時間ms)
       ------------------------------------------------------------
       ★ 浅い方から 2手ずつ 深くする（★深さの 偶数・奇数を そろえる ため）。
         ★ 深さ1 → [1]／深さ2 → [2]／深さ4 → [2,4]／深さ6 → [2,4,6]
       ★ しめきりに かかったら、★最後に **読み終えた** 深さの 答えを 打つ。
       ⚠️ 人の 打ち方は 1つも 渡していない（★verify ② が 文字列で 見張る）。 */
    function pick(g, c, level, rand, budget) {
      /* ★ level は 段の 番号（0〜4）。★{depth,K} を 直に 渡す ことも できる
         ―― ★人の 模型（N手 読む 人）が 同じ 読みを 使う ため だけ。★遊ぶ 画面からは 番号しか 来ない。 */
      var L = (level && typeof level === 'object') ? level : (LEVELS[level] || LEVELS[LEVEL_START]);
      var cand = G.candidates(g);
      lastCut = false; lastDepth = 0;
      if (!cand.length) return -1;
      if (g.n === 0) return cand[0];

      /* ★ 1段（弱い）は 読みません ―― ★自分の 形しか 見ない。
         ★ わざと 見のがして いるのでは なく、**相手が 見えていない** のです（ルル §6-3）。 */
      if (L.depth === 0) {
        var my = G.winPoints(g, c, cand);
        if (my.length) return my[0];
        var b0 = -INF, p0 = cand[0];
        for (var i = 0; i < cand.length; i++) {
          var v0 = G.gain(g, cand[i], c) + (rand ? rand() * 3 : 0);
          if (v0 > b0) { b0 = v0; p0 = cand[i]; }
        }
        return p0;
      }

      var t0 = nowMs();
      deadline = (budget > 0) ? (t0 + budget) : 0;
      var res = null;
      for (var d = (L.depth % 2 === 1) ? 1 : 2; d <= L.depth; d += 2) {
        aborted = false; nodes = 0;
        var r = search(g, d, -INF, INF, c, L.K);
        if (aborted) { lastCut = true; break; }
        res = r; lastDepth = d;
        if (deadline && d < L.depth && nowMs() >= deadline) { lastCut = true; break; }
      }
      deadline = 0; aborted = false;
      if (!res || res.mv == null || res.mv < 0 || g.bd[res.mv]) {
        /* ★ 保険：いちばん 浅い 読みすら 間に合わなかった とき（★起きない はず）*/
        var b1 = -INF, p1 = cand[0];
        for (var j = 0; j < cand.length; j++) {
          var v1 = G.gain(g, cand[j], c) + G.gain(g, cand[j], 3 - c) * 0.9;
          if (v1 > b1) { b1 = v1; p1 = cand[j]; }
        }
        return p1;
      }
      return res.mv;
    }

    /* ★ たしかめ用に 外へ 出す（★画面からは 1度も 呼ばない）*/
    pick.src = function () { return String(search) + String(pick); };
    pick.cut = function () { return lastCut; };          // ★ 安全弁が 効いたか
    pick.depthUsed = function () { return lastDepth; };  // ★ どの 深さまで 読み終えたか
    return pick;
  }

  /* ============================================================
     ★ 人の 模型（★勝率を 数える ためだけ。★遊ぶ 画面では 1度も 使わない）
     ------------------------------------------------------------
     ⚠️ ここで 使う 知識は、★画面に 1文字も 出しません。
     ============================================================ */
  function makeHumans(G) {
    /* 知識だけの 人（読まない）
       0 … 近くに 置くだけ
       1 … ＋ 自分が 5つに できるなら する
       2 … ＋ 相手の 5つを 止める */
    function mk(k) {
      return function (g, c, rand) {
        var cand = G.candidates(g), opp = 3 - c;
        if (k >= 1) { var m = G.winPoints(g, c, cand); if (m.length) return m[0]; }
        if (k >= 2) { var o = G.winPoints(g, opp, cand); if (o.length) return o[0]; }
        var best = -1e18, bp = cand[0];
        for (var i = 0; i < cand.length; i++) {
          var v = G.gain(g, cand[i], c) + rand() * 8;
          if (v > best) { best = v; bp = cand[i]; }
        }
        return bp;
      };
    }
    /* ★ N手 読む 人（★ロボットと 同じ 読みを 使う。★見のがし率 miss で たまに 外す）*/
    function reader(robotSearch, look, miss) {
      return function (g, c, rand) {
        var cand = G.candidates(g), opp = 3 - c;
        var my = G.winPoints(g, c, cand);
        if (my.length && rand() > miss) return my[0];
        var op = G.winPoints(g, opp, cand);
        if (op.length && rand() > miss) return op[0];
        if (rand() < miss) return cand[(rand() * cand.length) | 0];
        return robotSearch(g, c, look, rand);
      };
    }
    return {
      list: {
        'でたらめ':     mk(0),
        '自分の 5つ':   mk(1),
        '＋ 止める':    mk(2)
      },
      reader: reader
    };
  }

  /* ============================================================
     ★ 1試合 まるごと 走らせる（画面ぬき）
     ------------------------------------------------------------
     ★ 人は いつも 先手（黒）。★固定（ルル §4-5）。
     戻り値 { r: 1勝ち/0引き分け/-1負け, plies }
     ============================================================ */
  function simGame(G, robot, humanFn, level, rand, stat, openRandom) {
    var g = G.newBoard(), c = 1, plies = 0, over = 0;
    var open = openRandom || 0;
    while (g.n < G.N) {
      var opp = 3 - c;
      var cand = G.candidates(g);
      var before = G.winPoints(g, opp, cand);
      if (stat && before.length) { stat.reach[c - 1]++; if (before.length >= 2) stat.reach2[c - 1]++; }
      var p;
      if (g.n < open) p = cand[(rand() * cand.length) | 0];
      else p = (c === 1) ? humanFn(g, c, rand) : robot(g, c, level, rand, 0);
      if (p == null || p < 0 || g.bd[p]) {
        if (stat) stat.illegal++;
        p = cand[(rand() * cand.length) | 0];
        if (p == null || g.bd[p]) break;
      }
      if (stat && before.length) {
        stat.blockChance[c - 1]++;
        for (var q = 0; q < before.length; q++) if (before[q] === p) { stat.blocked[c - 1]++; break; }
      }
      G.put(g, p, c);
      plies++;
      if (G.winsAt(g, p, c)) { over = c; break; }
      if (stat) {
        var after = G.winPoints(g, c, G.candidates(g));
        if (after.length >= 2) stat.traps[c - 1]++;
      }
      c = opp;
    }
    var wl = G.winLines(g);
    if (stat) {
      stat.games++; stat.plies += plies;
      if (wl.lines.length >= 2) stat.twoLines++;
      if (wl.lines.length > stat.maxLines) stat.maxLines = wl.lines.length;
      for (var li = 0; li < wl.lines.length; li++) if (wl.lines[li].length > stat.maxRun) stat.maxRun = wl.lines[li].length;
      if (!over && g.n >= G.N) stat.draws++;
      if (!over && g.n < G.N) stat.stall++;
    }
    return { r: over === 1 ? 1 : (over === 2 ? -1 : 0), plies: plies, g: g, lines: wl.lines.length };
  }

  function newStat() {
    return { games: 0, plies: 0, illegal: 0, stall: 0, draws: 0, twoLines: 0, maxLines: 0, maxRun: 0,
             blockChance: [0, 0], blocked: [0, 0], traps: [0, 0], reach: [0, 0], reach2: [0, 0] };
  }

  function runMany(G, robot, humanFn, level, games, seed, openRandom) {
    var w = 0, d = 0, l = 0, st = newStat();
    for (var i = 0; i < games; i++) {
      var rand = rng((seed >>> 0) + i * 77);
      var r = simGame(G, robot, humanFn, level, rand, st, openRandom);
      if (r.r > 0) w++; else if (r.r < 0) l++; else d++;
    }
    return {
      games: games, win: w / games, draw: d / games, lose: l / games,
      plies: st.plies / games, illegal: st.illegal, stall: st.stall, draws: st.draws,
      twoLines: st.twoLines, maxLines: st.maxLines, maxRun: st.maxRun,
      blockChance: st.blockChance[1], blockRate: st.blockChance[1] ? st.blocked[1] / st.blockChance[1] : 0,
      traps: st.traps[1] / games,
      reachPerGame: st.reach[0] / games, doublePerGame: st.reach2[0] / games
    };
  }

  root.GOMOKU_CORE = {
    NEED: NEED, DIM: DIM, LEVELS: LEVELS, LEVEL_START: LEVEL_START,
    rng: rng, fitBoard: fitBoard, mmPerPx: mmPerPx, liftPx: liftPx, trayNeed: trayNeed,
    makeCore: makeCore, makeRobot: makeRobot, makeHumans: makeHumans,
    simGame: simGame, runMany: runMany, newStat: newStat
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
