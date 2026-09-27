/* ============================================================
   四川省（22本目）― T320・💻コーダ（2026-09-27）
   ------------------------------------------------------------
   ★ 下調べ：logs/T319_四川省の下調べ_トライ.md
   ★ 牌の 絵：../mahjong-tiles.js（★アト T318 の 部品を 1バイトも 変えずに 置いた。★md5 一致）
   ★ お手本：ピラミッド（office/games/pyramid/）―― ★同じ 1人遊びの 家族

   社長の お決め（★設計図 追記⑬・2026-09-27・厳守）：
     ① ★136枚（8×17）で 固定。★牌は「盤そのもの」として 44px の 決まりの 外。
        ★★「今後 やっぱり 変えて が あるかも」→ ★盤の 大きさは TUNE.R／TUNE.C の 2つだけで 決まる。
          ★ 並べ方（layout）・線の 道・配り・解く道具は ★ぜんぶ R と C から 数えて いる。
          ★ 配りの 一覧（DEAL_SETS）は 大きさごとに 持つ。★一覧が 無い 大きさでは
            ★その場で 解いて たしかめてから 配る（★保証は 消えない。★少し 待つだけ）。
     ② ★ヒント 無し（★追記②）。★消せる 組も・同じ 牌も 光らせない。
        ★ 光るのは「おした 牌の 青わく」ただ1つ（★§5.5 強調は 1種類）。
     ③ ★136枚（★アトの 34種類 × 4）
     ④ ★重力などの 変わり種は 入れない
     ⑤ ★「牌」「麻雀」は 漢字の まま（§9.6 例外）
     ★ 名前：題は「四川省」。★説明文に「二角取り」。★★「上海」の 字は 1文字も 使わない（★verify ⑨ が 数える）。

   ★ 遊び方（★トライの 下調べ・4か所で 一致）
     同じ 牌を 2つ 選んで、★曲がり 2回まで（★まっすぐの 線 3本まで）の 線で つながれば 消える。
     線は 牌の 上を 通れない。★盤の 外（まわり）は 通って よい。★線は 機械が 引いて 見せる。

   ★ ファイルの かたち（ピラミッド T76 と 同じ）
     「中身（CORE）」と「画面（UI）」を きっぱり 分けて ある。★CORE は document を 1回も さわらない。
     ★ 配りの 一覧は この CORE を Node で まわして 作った（★T320_計測どうぐ_コーダ/t320_01_kubari.cjs）。
     ★ 解く道具と ゲームは 同じ 1本の コード ―― ★ズレようが ない。

   ⚠️ 外部の ライブラリ・フォント・画像は 0。外への 通信も 0。
   ============================================================ */
(function (root) {
  'use strict';

  /* ============================================================
     ★ 数字（TUNE）― 調整する 数字は ここ 1か所だけ
     ============================================================ */
  var TUNE = {
    /* ★★ 盤の 大きさ（社長お決め①）★★
       ★ ここを 変えれば 盤が 変わる。★R×C は 4の 倍数 で、★136 以下（34種類 × 4枚）。
       ★ 変えたら ★t320_01_kubari.cjs で その 大きさの 一覧を 作って DEAL_SETS に 足す
         （★足さなくても 動く ―― ★その場で 解いてから 配る）。 */
    R: 8,
    C: 17,
    COPIES: 4,                // ★1種類 4枚（ふつうの 麻雀と 同じ）

    /* 見た目の 時間（★待ち時間は 遊びの 中身では ない ―― 短く・§5.5 追記①） */
    LINE_SHOW:   260,         // 線が 出て いる 時間
    LINE_FADE:   160,         // 線が 消える 時間
    VANISH:      200,         // 牌が 小さく なって 消える 時間
    STOP_WAIT:   520,         // ★止まった 箱は 最後の 線を 見せてから 出す

    /* 結果の 箱の 連打よけ（T62 の 事故を くり返さない）*/
    RESULT_LOCK: 600,
    RESULT_QUIET: 250,
    /* ★★ 箱を 閉じた 直後の 2つめの 指（★T316 の 学び）★★
       ★ 箱を 閉じた しゅんかんから この ms は、盤・上の帯の ボタンへの 指を 受けつけない。 */
    AFTER_BOX:   450,

    /* 牌が 降る 演出（★ピラミッドと 同じ 考え・タップで 飛ばせる・止まる）*/
    FALL_WAIT:   250,
    FALL_STEP:    45,
    FALL_N:       44,
    FALL_MAX:   5000,

    /* ★ 寸法（★ここが 盤の 心臓 ―― layout() が 使う）
       TILE_MAX … 牌の はばの 上限（★パソコンで 大きく なりすぎない）
       CELL_XW  … 指の 的（マス）の はばを 牌の 何倍まで 広げるか（★となりを 押しにくく する すき間）
       CELL_XH  … 同じく たて
       LANE     … 盤の まわりの「外の 道」（★線が 回る すき間）。★指の 的では ない ので 細くて よい
       ★★ T321（🎨アト・社長の ご指示「★すき間が ない ように ぎゅっと」）★★
         ・CELL_XW／CELL_XH を 1.45／1.20 → ★1.0（★牌と 牌の すき間 0。★指の 的 ＝ 牌 そのもの）。
           ★となりの 押し まちがいは「大きく 見せる 牌」（★はなす 前に ずらして 直せる）で 受ける。
         ・SIDE … 牌の「厚み」（★右と 下に 見える 側面）。★牌の はば × この 数（★0 で 厚み なし）。
           ★★ 社長の お決め（2026-09-27）：★B「厚み なし」＋★指の 的は 牌と 同じ 大きさで よい。
           ★牌の 絵（mahjong-tiles.js）は 1本も 変えない ―― ★厚みは style.css の .tile-in::before。
         ・TW_STEP … 牌の はばを この 細かさで 切り下げる（★1 → 0.25。★整数に そろえて 捨てて いた すき間を 牌に 回す）。 */
    TILE_MAX:     60,
    CELL_XW:    1.0,
    CELL_XH:    1.0,
    SIDE:       0,       // ★社長の お決め（2026-09-27）：B 厚み なし。★厚み ありに 戻すなら 0.10
    TW_STEP:    0.25,
    LANE_MIN:      7,
    LANE_MAX:     13,     // ★T321（アト）：12 → 13。★盤を 牌に ぴったりに したら パソコン（牌 56px）で 線（白い ふち込み 13px）が 道 12px から 0.5px はみ出した

    /* ★★ おしている 間の「大きく 見せる 牌」（★アトの 案・T318）★★
       ★ 牌が この はばより 小さい ときだけ、★指で おしている 牌を 指の 上に 大きく 出す。
       ★ 指を ずらせば となりに 移り、★はなした ところの 牌が えらばれる（★キーボードの 形）。 */
    LENS_UNDER:   40,
    LENS_W:       58,

    /* ★ T321（アト）：★はじめの 画面の 白い 箱の いちばん せまい はば（★これより せまく なる なら ハッピーは 下）*/
    TITLE_MIN_W: 300,

    RATIO: 88 / 64            // 牌の 絵（viewBox 64×88）の ひりつ。★ぜったいに くずさない
  };

  /* ============================================================
     ★ 乱数（mulberry32）― ピラミッド・ソリティアから そのまま
     ★ ここが 1ミリでも ズレると 配りの 一覧が 全部 ゴミに なる。
     ============================================================ */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ============================================================
     ★ 盤の 持ちかた
     ------------------------------------------------------------
     ★ まわりに 1マスずつ「外の 道」を 足した 表（W＝C+2・H＝R+2）で 持つ。
       ・pad(r, c) … 盤の r 行 c 列（0 はじまり）→ 表の 番号
       ・外の 道は いつも 空（-1）。★だから「盤の 外を 通る 線」は 何も 特別な ことを しなくても 数えられる。
     ★ grid[p] … 牌の 種類（0〜33 ＝ mahjong-tiles.js の MJ.CODES の 順）／空は -1
     ★ kpos[k] … その 種類の 牌が 残って いる 場所（表の 番号）
     ============================================================ */
  function sizeOf(R, C) { return { R: R, C: C, W: C + 2, H: R + 2, N: R * C }; }
  function kindsFor(R, C) { return (R * C) / TUNE.COPIES; }

  function makeDeal(seed, R, C) {
    R = R || TUNE.R; C = C || TUNE.C;
    var s = sizeOf(R, C), K = kindsFor(R, C), rnd = mulberry32(seed >>> 0), i, j, t;
    if (K !== (K | 0) || K > 34 || K < 1) throw new Error('盤の 大きさが だめ：' + R + '×' + C);
    var tiles = [];
    for (var k = 0; k < K; k++) for (i = 0; i < TUNE.COPIES; i++) tiles.push(k);
    for (i = tiles.length - 1; i > 0; i--) {               // Fisher–Yates（向き・回数を 変えない）
      j = Math.floor(rnd() * (i + 1));
      t = tiles[i]; tiles[i] = tiles[j]; tiles[j] = t;
    }
    var grid = new Int8Array(s.W * s.H).fill(-1), kpos = [];
    for (k = 0; k < K; k++) kpos.push([]);
    for (i = 0; i < s.N; i++) {
      var p = pad(s, (i / C) | 0, i % C);
      grid[p] = tiles[i];
      kpos[tiles[i]].push(p);
    }
    return {
      seed: seed >>> 0, R: R, C: C, W: s.W, H: s.H, K: K,
      grid: grid, kpos: kpos, left: s.N,
      hist: [], over: false, won: false
    };
  }
  function pad(s, r, c) { return (r + 1) * s.W + (c + 1); }
  function rowOf(g, p) { return ((p / g.W) | 0) - 1; }   // 外の 道は -1 か R
  function colOf(g, p) { return (p % g.W) - 1; }         // 外の 道は -1 か C

  function cloneState(g) {
    var kp = [];
    for (var k = 0; k < g.kpos.length; k++) kp.push(g.kpos[k].slice());
    return { seed: g.seed, R: g.R, C: g.C, W: g.W, H: g.H, K: g.K,
             grid: new Int8Array(g.grid), kpos: kp, left: g.left, hist: [], over: false, won: false };
  }

  /* ============================================================
     ★★ つながるか（★この ゲームの 心臓）★★
     ------------------------------------------------------------
     ★ 曲がり 2回まで の 線は、★必ず 次の 2つの 形の どちらか（★長さ 0 の 辺も ある）：
        ・よこ → たて → よこ （★a の 行を よこに 進み、ある 列 x で たてに、b の 行で よこに）
        ・たて → よこ → たて （★ある 行 y で よこに）
     ★ a から よこに 空いて いる はんい [aL..aR] と、b の [bL..bR] の ★重なる 列 x だけ 見れば よい
       （★その 間の たての 線が 空いて いれば つながる）。たても 同じ。
     ★ 外の 道（表の いちばん 外の 行・列）も 空の マスとして そのまま 数える ―― ★「盤の 外を 通って よい」。
     ★ want が true なら ★いちばん 短い 線の かど（表の 番号の 列）を 返す。★false なら true／false だけ。
     ============================================================ */
  function connect(g, a, b, want) {
    if (a === b) return null;
    var grid = g.grid, W = g.W, H = g.H;
    var ka = grid[a], kb = grid[b];
    if (ka < 0 || ka !== kb) return null;
    grid[a] = -1; grid[b] = -1;                             // ★2枚の 自分の マスは 通れる 扱い（あとで 戻す）
    var ar = (a / W) | 0, ac = a % W, br = (b / W) | 0, bc = b % W;
    var best = null, bestLen = 1e9, x, y, r, c, ok, lo, hi, len;

    /* よこ → たて → よこ */
    var aL = ac, aR = ac, bL = bc, bR = bc;
    while (aL > 0 && grid[ar * W + aL - 1] < 0) aL--;
    while (aR < W - 1 && grid[ar * W + aR + 1] < 0) aR++;
    while (bL > 0 && grid[br * W + bL - 1] < 0) bL--;
    while (bR < W - 1 && grid[br * W + bR + 1] < 0) bR++;
    lo = Math.max(aL, bL); hi = Math.min(aR, bR);
    for (x = lo; x <= hi; x++) {
      ok = true;
      for (r = Math.min(ar, br) + 1; r < Math.max(ar, br); r++) if (grid[r * W + x] >= 0) { ok = false; break; }
      if (!ok) continue;
      if (!want) { grid[a] = ka; grid[b] = kb; return true; }
      len = Math.abs(ac - x) + Math.abs(ar - br) + Math.abs(x - bc);
      if (len < bestLen) { bestLen = len; best = [a, ar * W + x, br * W + x, b]; }
    }

    /* たて → よこ → たて */
    var aU = ar, aD = ar, bU = br, bD = br;
    while (aU > 0 && grid[(aU - 1) * W + ac] < 0) aU--;
    while (aD < H - 1 && grid[(aD + 1) * W + ac] < 0) aD++;
    while (bU > 0 && grid[(bU - 1) * W + bc] < 0) bU--;
    while (bD < H - 1 && grid[(bD + 1) * W + bc] < 0) bD++;
    lo = Math.max(aU, bU); hi = Math.min(aD, bD);
    for (y = lo; y <= hi; y++) {
      ok = true;
      for (c = Math.min(ac, bc) + 1; c < Math.max(ac, bc); c++) if (grid[y * W + c] >= 0) { ok = false; break; }
      if (!ok) continue;
      if (!want) { grid[a] = ka; grid[b] = kb; return true; }
      len = Math.abs(ar - y) + Math.abs(ac - bc) + Math.abs(y - br);
      if (len < bestLen) { bestLen = len; best = [a, y * W + ac, y * W + bc, b]; }
    }

    grid[a] = ka; grid[b] = kb;
    if (!best) return want ? null : false;
    /* ★ 同じ 点が 続く ところを 1つに（★曲がりの 数を 正しく 数える ため）*/
    var out = [best[0]];
    for (var i = 1; i < best.length; i++) if (best[i] !== out[out.length - 1]) out.push(best[i]);
    /* ★ まっすぐ 続く 点も 1つに（a→x→b が 一直線の とき）*/
    var out2 = [out[0]];
    for (i = 1; i < out.length; i++) {
      if (i < out.length - 1) {
        var p0 = out2[out2.length - 1], p1 = out[i], p2 = out[i + 1];
        var sameRow = ((p0 / W) | 0) === ((p1 / W) | 0) && ((p1 / W) | 0) === ((p2 / W) | 0);
        var sameCol = (p0 % W) === (p1 % W) && (p1 % W) === (p2 % W);
        if (sameRow || sameCol) continue;
      }
      out2.push(out[i]);
    }
    return out2;
  }
  /* ★ 曲がりの 数（★たしかめ用：かどの 数 − 2）*/
  function turnsOf(path) { return path ? path.length - 2 : -1; }

  /* ============================================================
     ★ 手（move）― 牌を 動かす 入口は applyMove ただ1つ
       {a, b}  … 表の 番号 2つ（★同じ 種類・★つながる）
     ★ だから「もどす」は 1つの 逆手順だけで 効く。入口を 増やさない こと。
     ============================================================ */
  function removeFrom(list, p) { var i = list.indexOf(p); if (i >= 0) list.splice(i, 1); }
  function applyMove(g, mv, opt) {
    var k = g.grid[mv.a];
    g.grid[mv.a] = -1; g.grid[mv.b] = -1;
    removeFrom(g.kpos[k], mv.a); removeFrom(g.kpos[k], mv.b);
    g.left -= 2;
    var rec = { a: mv.a, b: mv.b, k: k };
    if (!opt || opt.hist !== false) g.hist.push(rec);
    return rec;
  }
  function unapply(g, rec) {
    g.grid[rec.a] = rec.k; g.grid[rec.b] = rec.k;
    g.kpos[rec.k].push(rec.a, rec.b);
    g.left += 2;
  }
  /* ★ もどす（無制限）*/
  function undoMove(g) {
    var rec = g.hist.pop();
    if (!rec) return null;
    unapply(g, rec);
    return rec;
  }
  function isWin(g) { return g.left === 0; }

  /* ★ 人が おした 2枚は 消せるか（★たしかめる だけ。★相手を 探さない ―― 追記②・追記④）*/
  function canTake(g, a, b) {
    if (a === b || g.grid[a] < 0 || g.grid[a] !== g.grid[b]) return null;
    return connect(g, a, b, true);
  }

  /* ★ 消せる 組を ぜんぶ（★詰みの 判定・解く道具・数える 道具 だけが 使う。★画面には 1つも 出さない）*/
  function legalPairs(g, firstOnly) {
    var out = [];
    for (var k = 0; k < g.kpos.length; k++) {
      var L = g.kpos[k];
      for (var i = 0; i < L.length; i++) for (var j = i + 1; j < L.length; j++) {
        if (connect(g, L[i], L[j], false)) { out.push({ a: L[i], b: L[j] }); if (firstOnly) return out; }
      }
    }
    return out;
  }
  function hasMove(g) { return legalPairs(g, true).length > 0; }
  /* ★ 詰み ＝ 牌が 残って いて ★消せる 組が 1つも ない。
     ⚠️ ゲームは「もう 勝てない」とは ぜったいに 言わない。★言うのは「1組も ない」ときだけ（★ピラミッドと 同じ）。 */
  function isStuck(g) { return !isWin(g) && !hasMove(g); }

  /* 牌は いつでも 各種類 4枚ずつ（★たしかめ用）*/
  function countAll(g) {
    var n = 0, per = {}, p, k;
    for (p = 0; p < g.grid.length; p++) {
      var r = rowOf(g, p), c = colOf(g, p);
      var out = r < 0 || r >= g.R || c < 0 || c >= g.C;
      if (out && g.grid[p] >= 0) return { ok: false, why: '外の 道に 牌が ある' };
      if (g.grid[p] >= 0) { n++; per[g.grid[p]] = (per[g.grid[p]] || 0) + 1; }
    }
    for (k = 0; k < g.kpos.length; k++) {
      if ((per[k] || 0) !== g.kpos[k].length) return { ok: false, why: '種類 ' + k + ' の 数が 合わない' };
      if (g.kpos[k].length % 2) return { ok: false, why: '種類 ' + k + ' が 奇数' };
    }
    if (n !== g.left) return { ok: false, why: '残りの 数が 合わない' };
    return { ok: true, n: n };
  }

  /* ============================================================
     ★★ 解く道具（solver）★★
     ------------------------------------------------------------
     ★ 盤が 解けるか 決めるのは 本来 とても 重い 問題（★NP完全・トライの 下調べ）。
       ★それでも 次の 2つの「損しない 手」で ほとんどの 盤は すぐ 解ける：
       ① ★その 種類が あと 2枚 だけ で、つながる → ★必ず 取る
          （★牌を 消すと 道が 空く だけ。★ほかの 種類は 困らない。★同じ 種類の 残りも 無い）
       ② ★その 種類の 4枚を ★いま 2組とも 消せる → ★必ず 取る（★同じ 理由）
       ★ 分かれ道は ★「4枚 残って いる 種類で、どの 2枚を 組に するか」だけ。
     ★ 同じ 場面は 2度 調べない。★時間切れ・数え切れは「不明」＝ 一覧に 入れない。
     ★ 見つけた 手順は 全部 applyMove を 通る 本当の 手 ―― ★replay() で 流しこんで 確かめる。
     ============================================================ */
  function solve(g0, opts) {
    opts = opts || {};
    var limitMs = opts.ms == null ? 3000 : opts.ms;
    var maxNodes = opts.nodes == null ? 200000 : opts.nodes;
    var t0 = Date.now(), nodes = 0, cut = false, seen = new Set();
    var st = cloneState(g0), path = [];

    function key() {
      var s = '';
      for (var p = 0; p < st.grid.length; p++) s += st.grid[p] < 0 ? '.' : String.fromCharCode(65 + st.grid[p]);
      return s;
    }
    function take(a, b) { var r = applyMove(st, { a: a, b: b }, { hist: false }); path.push({ a: a, b: b }); return r; }
    function back(rec) { unapply(st, rec); path.pop(); }

    /* ★ 損しない 手を 取れる だけ 取る（★取った 分を 返す ―― 戻す ため）*/
    function forced() {
      var done = [], again = true, k, L;
      while (again) {
        again = false;
        for (k = 0; k < st.kpos.length; k++) {
          L = st.kpos[k];
          if (L.length === 2) {
            if (connect(st, L[0], L[1], false)) { done.push(take(L[0], L[1])); again = true; }
          } else if (L.length === 4) {
            var P = [[0, 1, 2, 3], [0, 2, 1, 3], [0, 3, 1, 2]], q = L.slice();
            for (var i = 0; i < 3; i++) {
              var a = q[P[i][0]], b = q[P[i][1]], c = q[P[i][2]], d = q[P[i][3]];
              if (!connect(st, a, b, false)) continue;
              var r1 = take(a, b);
              if (connect(st, c, d, false)) { done.push(r1); done.push(take(c, d)); again = true; break; }
              back(r1);
            }
          }
        }
      }
      return done;
    }

    function dfs() {
      if (st.left === 0) return true;
      if (nodes >= maxNodes) { cut = true; return false; }
      if ((nodes & 127) === 0 && Date.now() - t0 > limitMs) { cut = true; return false; }
      nodes++;
      var done = forced();
      if (st.left === 0) return true;
      var ky = key();
      if (!seen.has(ky)) {
        seen.add(ky);
        var moves = legalPairs(st, false);
        for (var i = 0; i < moves.length; i++) {
          var rec = take(moves[i].a, moves[i].b);
          if (dfs()) return true;
          back(rec);
          if (cut) break;
        }
      }
      for (var j = done.length - 1; j >= 0; j--) back(done[j]);
      return false;
    }

    var won = dfs();
    return { ok: won, unknown: !won && cut, moves: won ? path.slice() : null, nodes: nodes, ms: Date.now() - t0 };
  }

  /* ★ 見つけた 手順を 本当に ゲームに 流しこんで 勝てるか たしかめる
     ⚠️ 1手ごとに「同じ 種類か」「つながるか（★曲がり 2回まで）」を ★canTake で 見る ―― 通ったふり を させない。 */
  function replay(seed, moves, R, C) {
    var g = makeDeal(seed, R, C);
    for (var i = 0; i < moves.length; i++) {
      var m = moves[i], path = canTake(g, m.a, m.b);
      if (!path) return { ok: false, at: i, why: '消せない 手' };
      if (turnsOf(path) > 2) return { ok: false, at: i, why: '曲がりが ' + turnsOf(path) + '回' };
      applyMove(g, m);
      var cnt = countAll(g);
      if (!cnt.ok) return { ok: false, at: i, why: cnt.why };
    }
    return { ok: isWin(g), at: moves.length, why: isWin(g) ? '' : '勝てて いない' };
  }

  /* ============================================================
     ★ 先を 読まない 打ち方（★人の 下手な 打ち方に 近い ―― 数字を 出す 道具）
       ★ 見つけた 順に 消す。★詰み（1組も ない）まで 行くか 数える。
     ============================================================ */
  function playOne(seed, R, C) {
    var g = makeDeal(seed, R, C), n = 0;
    while (!isWin(g)) {
      var m = legalPairs(g, true);
      if (!m.length) break;
      applyMove(g, m[0]); n++;
    }
    return { seed: seed, won: isWin(g), stuck: isStuck(g), moves: n, left: g.left };
  }

  /* ★ 盤を 90度 回す（★たしかめ用：回しても つながる／つながらないは 変わらない ―― トライの 下調べ 1-3）*/
  function rotated(g) {
    var R2 = g.C, C2 = g.R, s = sizeOf(R2, C2);
    var h = { seed: g.seed, R: R2, C: C2, W: s.W, H: s.H, K: g.K, grid: new Int8Array(s.W * s.H).fill(-1), kpos: [], left: g.left, hist: [] };
    for (var k = 0; k < g.K; k++) h.kpos.push([]);
    var map = {};
    for (var r = 0; r < g.R; r++) for (var c = 0; c < g.C; c++) {
      var p = pad(g, r, c), q = pad(s, c, g.R - 1 - r);   // ★(r,c) → (c, R-1-r)
      map[p] = q;
      h.grid[q] = g.grid[p];
      if (g.grid[p] >= 0) h.kpos[g.grid[p]].push(q);
    }
    return { g: h, map: map };
  }

  var CORE = {
    TUNE: TUNE, mulberry32: mulberry32, sizeOf: sizeOf, kindsFor: kindsFor, pad: pad, rowOf: rowOf, colOf: colOf,
    makeDeal: makeDeal, cloneState: cloneState, connect: connect, turnsOf: turnsOf, canTake: canTake,
    applyMove: applyMove, undoMove: undoMove, isWin: isWin, legalPairs: legalPairs, hasMove: hasMove,
    isStuck: isStuck, countAll: countAll, solve: solve, replay: replay, playOne: playOne, rotated: rotated
  };
  root.SHISEN_CORE = CORE;
  if (typeof module === 'object' && module.exports) module.exports = CORE;

  /* ★ Node（画面が ない ところ）では ここで おしまい。★ここから下は 1行も 動かない。 */
  if (typeof document === 'undefined') return;

    /* ============================================================
     ★★ ここから 画面（UI）★★
     ============================================================ */
  var $ = function (id) { return document.getElementById(id); };
  var MJ = root.MJ;                                   // ★アトの 部品（../mahjong-tiles.js）
  var CODES = MJ ? MJ.CODES : [];

  /* ============================================================
     ★★ 必ず クリアできる 配りの 一覧（★大きさごと）★★
     ------------------------------------------------------------
     36進数 6文字ずつ で 種（配りの 番号）が ならんでいる。
     作りかた ―― 会社の 計測どうぐ t320_01_kubari.cjs を Node で 走らせた。
       ① 種から 配る（makeDeal）
       ② 上の CORE の solve() に かける
       ③ ★見つけた 手順を replay() で **本当に ゲームに 流しこんで 勝てるか** たしかめる
       ④ 通った 種だけ ここに 足す
     ★ ①〜③は 全部 この ファイルの CORE ＝ ズレようが ない。★遊ぶ ときは この 中から 1つ えらぶ だけ。
     ★★ 盤の 大きさ（TUNE.R×TUNE.C）の 一覧が 無い ときは ★その場で 解いて たしかめて から 配る（pickSeed）。
     ============================================================ */
  /* ↓ ここは t320_01_kubari.cjs が 書きこむ（手で さわらない）*/
  var DEAL_SETS = {
    '8x17': '00000100000200000300000400000500000600000700000800000a00000b00000c00000d00000e00000f00000g00000h00000i00000j00000l00000m00000n00000o00000p00000q00000r00000s00000t00000v00000w00000x00000y00000z00001000001100001200001300001400001500001600001700001800001900001a00001b00001c00001d00001e00001f00001h00001i00001j00001k00001l00001m00001n00001o00001q00001r00001s00001t00001u00001v00001w00001x00001z00002000002200002300002400002500002600002700002800002900002a00002b00002c00002d00002e00002f00002g00002h00002j00002l00002m00002n00002o00002p00002q00002s00002t00002v00002w00002x00002y00002z00003000003300003400003500003600003700003900003a00003b00003c00003d00003e00003f00003g00003h00003i00003j00003k00003l00003o00003p00003q00003r00003s00003t00003u00003v00003w00003x00003y00003z00004100004200004300004400004500004600004700004800004900004a00004b00004c00004d00004e00004g00004h00004j00004k00004l00004m00004n00004o00004p00004r00004s00004u00004v00004w00004x00004y00004z00005000005100005200005300005400005500005700005800005900005a00005b00005c00005d00005e00005f00005g00005i00005j00005k00005l00005m00005n00005o00005p00005q00005r00005s00005t00005u00005v00005w00005x00005y00005z00006000006100006200006300006400006500006600006700006800006900006a00006b00006c00006d00006e00006f00006g00006i00006j00006k00006l00006m00006n00006o00006p00006q00006r00006s00006t00006u00006v00006w00006x00006y00006z00007000007100007200007300007400007500007600007700007800007900007a00007b00007c00007d00007e00007f00007g00007h00007j00007l00007m00007n00007o00007p00007q00007r00007s00007t00007u00007v00007w00007x00007y00007z00008000008100008200008300008400008500008600008700008800008900008a00008b00008c00008d00008e00008f00008g00008h00008i00008j00008k00008l00008m00008n00008o00008q00008r00008s00008t00008u00008v00008w00008x00008y00008z00009000009100009200009300009400009500009600009700009800009900009a00009b00009c00009d00009e00009f00009g00009h00009i00009j00009k00009l00009m00009n00009o00009p00009q00009r00009s00009t00009u00009v00009w00009x00009y00009z0000a00000a10000a20000a30000a40000a50000a60000a80000aa0000ab0000ac0000ad0000ae0000af0000ag0000ah0000aj0000ak0000al0000am0000an0000ao0000ap0000aq0000ar0000as0000at0000av0000aw0000ax0000ay0000az0000b00000b10000b20000b30000b40000b50000b60000b70000b80000b90000ba0000bb0000bc0000bd0000be0000bf0000bg0000bh0000bi0000bj0000bk0000bl0000bm0000bn0000bo0000bp0000bq0000br0000bs0000bt0000bu0000bv0000bw0000bx0000by0000bz0000c00000c10000c20000c30000c40000c50000c70000c80000c90000ca0000cc0000cd0000ce0000cg0000ci0000cj0000ck0000cl0000cm0000cn0000co0000cp0000cq0000cs0000ct0000cu0000cv0000cw0000cx0000cy0000cz0000d00000d10000d20000d40000d50000d70000d80000d90000da0000db0000dc0000dd0000de0000df0000dg0000dh0000di0000dj0000dk0000dl0000dm0000dn0000do0000dp0000dq0000ds0000dt0000du0000dv0000dw0000dx0000dy0000dz0000e00000e10000e20000e30000e40000e60000e70000e80000e90000ea0000eb0000ed0000ee0000ef0000eg0000eh0000ej0000ek0000el0000em0000en0000eo0000ep0000eq0000er0000es0000et0000eu0000ew0000ex0000ey0000ez0000f00000f10000f20000f30000f40000f50000f60000f70000f80000f90000fa0000fb0000fc0000fd0000fe0000ff0000fg0000fh0000fi0000fj0000fk0000fl0000fm0000fn0000fo0000fp0000fr0000fs0000ft0000fv0000fw0000fx0000fz0000g00000g10000g20000g30000g40000g50000g60000g70000g80000g90000ga0000gb0000gc0000gd0000ge0000gf0000gg0000gh0000gi0000gj0000gk0000gl0000gm0000gn0000go0000gp0000gq0000gr0000gs0000gt0000gu0000gv0000gw0000gx0000gy0000gz0000h00000h10000h20000h30000h40000h50000h60000h70000h80000h90000ha0000hc0000hd0000he0000hf0000hg0000hh0000hi0000hj0000hk0000hl0000hm0000hn0000hp0000hq0000hr0000hs0000ht0000hu0000hv0000hx0000hy0000hz0000i00000i10000i20000i30000i50000i60000i70000i80000i90000ia0000ib0000ic0000id0000ie0000if0000ig0000ih0000ii0000ij0000ik0000il0000im0000in0000io0000ip0000iq0000ir0000is0000it0000iu0000iv0000iw0000ix0000iy0000iz0000j00000j20000j30000j40000j50000j60000j70000j80000j90000ja0000jb0000jc0000jd0000je0000jf0000jh0000ji0000jj0000jk0000jl0000jn0000jo0000jp0000jr0000js0000jt0000ju0000jv0000jw0000jx0000jy0000jz0000k00000k10000k20000k30000k40000k50000k60000k70000k80000k90000kb0000kc0000kd0000ke0000kf0000kg0000kh0000kj0000kk0000km0000kn0000ko0000kp0000kq0000kr0000ks0000kt0000ku0000kv0000kw0000kx0000ky0000kz0000l00000l10000l20000l30000l40000l50000l60000l70000l90000la0000lb0000lc0000ld0000le0000lf0000lg0000lh0000li0000lj0000lk0000ll0000lm0000ln0000lo0000lp0000lq0000lr0000ls0000lt0000lu0000lv0000lw0000lx0000ly0000lz0000m00000m10000m20000m30000m40000m50000m60000m70000m80000m90000ma0000mb0000mc0000md0000me0000mg0000mh0000mj0000mk0000ml0000mm0000mn0000mo0000mp0000mq0000mr0000ms0000mt0000mu0000mv0000mw0000mx0000my0000mz0000n00000n10000n20000n30000n40000n60000n70000n80000n90000na0000nb0000nc0000nd0000ne0000nf0000ng0000nh0000ni0000nj0000nk0000nm0000nn0000no0000np0000nq0000nr0000ns0000nt0000nu0000nv0000nw0000nx0000ny0000o00000o10000o20000o30000o40000o50000o60000o70000o80000o90000oa0000ob0000oc0000oe0000of0000og0000oh0000oi0000oj0000ok0000ol0000om0000on0000oo0000or0000os0000ot0000ou0000ov0000ow0000ox0000oy0000oz0000p00000p10000p20000p30000p40000p50000p60000p70000p80000p90000pa0000pb0000pc0000pd0000pe0000pg0000ph0000pi0000pj0000pk0000pl0000pm0000pn0000po0000pp0000pq0000pr0000ps0000pu0000pv0000pw0000px0000py0000pz0000q00000q10000q20000q30000q40000q50000q60000q70000q80000q90000qa0000qb0000qc0000qd0000qe0000qf0000qg0000qi0000qj0000ql0000qm0000qn0000qo0000qp0000qq0000qr0000qs0000qt0000qu0000qv0000qw0000qx0000qy0000qz0000r00000r10000r20000r30000r50000r70000r80000r90000ra0000rb0000rc0000rd0000re0000rf0000rg0000rh0000ri0000rj0000rk0000rl0000rn0000ro0000rp0000rq0000rr0000rs0000rt0000ru0000rv0000rw0000rx0000ry0000rz0000s00000s10000s20000s30000s40000s50000s60000s70000s80000s90000sa0000sb0000sc0000sd0000se0000sf0000sg0000sh0000si0000sj0000sk0000sl0000sm0000sn0000so0000sp0000sq0000sr0000ss0000st0000su0000sv0000sw0000sx0000sy0000sz0000t00000t10000t30000t40000t50000t60000t70000t80000t90000ta0000tb0000tc0000te0000tf0000tg0000th0000ti0000tj0000tk0000tl0000tm0000tn0000to0000tp0000tq0000tr0000ts0000tt0000tu0000tv' /*@@DEALS_8x17@@*/
  };
  function sizeKey() { return TUNE.R + 'x' + TUNE.C; }
  var DEAL_LIST = [];
  (function () {
    var s = DEAL_SETS[sizeKey()] || '';
    for (var i = 0; i + 6 <= s.length; i += 6) DEAL_LIST.push(parseInt(s.substr(i, 6), 36));
  })();

  var bag = [];
  function pickSeed() {
    if (DEAL_LIST.length) {
      if (!bag.length) {
        bag = DEAL_LIST.slice();
        for (var i = bag.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1)), t = bag[i]; bag[i] = bag[j]; bag[j] = t;
        }
      }
      return bag.pop();
    }
    /* ★ 一覧が 無い 大きさ（★社長が 盤の 大きさを 変えた 直後など）：★その場で 解いて たしかめる */
    for (var n = 0; n < 40; n++) {
      var s = (Math.random() * 2147483000) >>> 0;
      var r = solve(makeDeal(s), { ms: 1500, nodes: 150000 });
      if (r.ok && replay(s, r.moves).ok) return s;
    }
    return (Math.random() * 2147483000) >>> 0;            // 保険（ふつう 通らない）
  }

  /* ============================================================
     ★ ハッピーの ことば（★画面の 言葉は ここ 1か所だけ ―― ★verify ⑤ が 全部 はかる）
     ============================================================ */
  var LINES = {
    title:   '同じ 牌を 2つ、線で つなげて 消そう！',
    titleBest: 'いちばん 速い クリアは {t}！',
    deal:    'この配り、ちゃんと クリアできるよ！',
    again:   'つぎの配りで がんばろ！',
    half:    '半分 消えた！　いい ちょうし！',
    win:     'やったー！　{t}で ぜんぶ 消えたね！',
    winBest: '新記録！　{t}で ぜんぶ 消えたね！',
    stop:    'まだ クリアできるよ！　もどってみる？',
    /* ★T323（アト・社長の お決め）：止まった 箱から「もどす」した あとは ★stop を 言い続けない。★どこを 見れば よいかは 言わない（追記②） */
    back:    'もどったよ！　ゆっくり さがそうね。'
  };
  function line(k, t) { return LINES[k].replace('{t}', t || ''); }
  function say(t) { $('happyBubble').textContent = t; }

  /* ============================================================
     ★★ 1人で 記録を のばす（★ルル T304 の「まだ 0本」の 穴）★★
     ------------------------------------------------------------
     ★ クリアまでの 時間を はかり、★いちばん 速い 記録を 残す（★この 端末の 中だけ・localStorage）。
     ★ 遊んで いる 間は 時計を 画面に 出さない（★§5.5 部品を 増やさない・★急がせない）。
       ★ 見せるのは ★クリアした ときの 箱と ★ハッピーの ことば だけ。
     ★ 画面が 見えて いない 間（★べつの タブ）・止まった 箱の 間は ★時計を 止める。
     ★ もどすを 何回 使っても 記録に なる（★もどすは この 遊びの 主役 ―― 罰に しない）。
     ============================================================ */
  var BEST_KEY = 'bragekobo-shisensho-best-' + sizeKey();
  function loadBest() { try { var v = parseInt(localStorage.getItem(BEST_KEY), 10); return v > 0 ? v : 0; } catch (e) { return 0; } }
  function saveBest(ms) { try { localStorage.setItem(BEST_KEY, String(Math.round(ms))); return true; } catch (e) { return false; } }
  function fmtTime(ms) {
    var s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    s = s % 60;
    if (h) return h + '時間' + m + '分' + s + '秒';
    if (m) return m + '分' + s + '秒';
    return s + '秒';
  }
  var clk = { acc: 0, t: 0, on: false };
  function clkReset() { clk.acc = 0; clk.on = false; }
  function clkResume() { if (clk.on || document.hidden || !G || G.over) return; clk.on = true; clk.t = performance.now(); }
  function clkPause() { if (!clk.on) return; clk.acc += performance.now() - clk.t; clk.on = false; }
  function clkMs() { return clk.acc + (clk.on ? performance.now() - clk.t : 0); }

  /* ── 部品 ─────────────────────────────────── */
  var G = null, boardEl = null, boardIn = null, pathSvg = null, lensEl = null, built = false;
  var tileEl = {};                      // 表の 番号 → .tile
  var sel = -1;                         // ★いま えらんで いる 牌（表の 番号）。★-1 なら 無し
  var press = null;                     // いま おさえて いる 指（1本だけ）
  var busy = false, timer = 0, stopTimer = 0, pathT1 = 0, pathT2 = 0, fallStop = null, half = false;
  var guardUntil = 0;                   // ★箱を 閉じた 直後の 2つめの 指よけ（★T316）
  var geo = { rot: false, nx: TUNE.C, ny: TUNE.R, tw: 28, th: 38.5, cw: 40, ch: 40, lane: 8, ox: 8, oy: 8, mode: 'stack' };

  /* ============================================================
     ★★ 寸法（★この 画面の 心臓）★★
     ------------------------------------------------------------
     ★ まん中の 箱（.stage）の 実寸から、★4つの 並べ方を 全部 数えて ★牌が いちばん 大きく なる ものを 取る：
        ・ハッピーを 下（stack）／右（side）
        ・盤を よこ（17列×8行）／たて（8列×17行・★90度 回す）
       ★ 回しても 消せる／消せないは 1つも 変わらない（★線は たて・よこ だけ ―― ★verify ② が 毎回 たしかめる）。
     ★ 牌の はば tw は ★マスの はば・たけ（★外の 道を 引いた 残り）に 入る いちばん 大きい 数。
       ★ 牌の たけ th ＝ tw × 88/64（★絵の ひりつ。★くずさない）。
     ★ マス（★指の 的）は ★牌より 少し 大きく して よい（★CELL_XW・CELL_XH）―― ★となりを 押しにくく なる。
     ★★ 社長お決め①：★牌は「盤そのもの」として 44px の 決まりの 外（★スパイダーの 札と 同じ）。
     ============================================================ */
  function planFor(W, H) {
    var R = G ? G.R : TUNE.R, C = G ? G.C : TUNE.C, best = null;
    [false, true].forEach(function (rot) {
      var nx = rot ? R : C, ny = rot ? C : R, lane = TUNE.LANE_MIN, tw = 0, it, cwA, chA, side = 0;
      /* ★ T321（アト）：★牌の 厚み side を 右と 下に 1回ぶん とる。★はばは TW_STEP で 切り下げ（★整数 だけ だと 最大 1px×列 が すき間に 消えて いた） */
      function sideOf(t) { return TUNE.SIDE > 0 ? Math.max(2, Math.round(t * TUNE.SIDE)) : 0; }
      function cut(v) { var s = TUNE.TW_STEP || 1; return Math.floor(v / s + 1e-6) * s; }
      for (it = 0; it < 3; it++) {
        cwA = (W - 2 * lane - side) / nx; chA = (H - 2 * lane - side) / ny;
        tw = Math.max(8, cut(Math.min(cwA, chA / TUNE.RATIO, TUNE.TILE_MAX)));
        lane = Math.max(TUNE.LANE_MIN, Math.min(TUNE.LANE_MAX, Math.round(tw * 0.4)));
        side = sideOf(tw);
      }
      cwA = (W - 2 * lane - side) / nx; chA = (H - 2 * lane - side) / ny;
      tw = Math.max(8, cut(Math.min(cwA, chA / TUNE.RATIO, TUNE.TILE_MAX)));
      var th = tw * TUNE.RATIO;
      var cw = Math.max(tw, Math.min(cwA, tw * TUNE.CELL_XW));
      var ch = Math.max(th, Math.min(chA, th * TUNE.CELL_XH));
      var p = { rot: rot, nx: nx, ny: ny, tw: tw, th: th, cw: cw, ch: ch, lane: lane, side: side, W: W, H: H };
      if (!best || p.tw > best.tw || (p.tw === best.tw && p.cw * p.ch > best.cw * best.ch)) best = p;
    });
    return best;
  }
  function frameOf() {
    var cs = getComputedStyle(boardEl);
    function n(v) { return parseFloat(v) || 0; }
    return {
      x: n(cs.borderLeftWidth) + n(cs.borderRightWidth) + n(cs.paddingLeft) + n(cs.paddingRight),
      y: n(cs.borderTopWidth) + n(cs.borderBottomWidth) + n(cs.paddingTop) + n(cs.paddingBottom)
    };
  }
  /* ★ 4つの 並べ方を 数える（★verify ③ も 同じ 関数で「いちばん 大きいか」を 数え直す）*/
  function planAll() {
    var app = $('app'), stage = $('stage'), fr = frameOf(), was = app.classList.contains('is-side'), out = [];
    ['stack', 'side'].forEach(function (mode) {
      app.classList.toggle('is-side', mode === 'side');
      var p = planFor(stage.clientWidth - fr.x, stage.clientHeight - fr.y);
      p.mode = mode; out.push(p);
    });
    app.classList.toggle('is-side', was);
    return out;
  }
  function layout() {
    if (!built) return;
    cancelPress();
    var all = planAll(), best = all[0];
    if (all[1].tw > best.tw) best = all[1];              // ★同じ なら ハッピーは 下（★20本と 同じ 形）
    /* ★ T321（アト）：★はじめの 画面では 盤が まだ 無い。★ハッピーを 右に すると 白い 箱が TITLE_MIN_W より せまく なる なら ★下に 置く。
       ★（T320 の 320×568 で ★白い 箱が ハッピーの 下に もぐって いた ―― ★はじめる ボタンの 右が かくれて いた） */
    if (best.mode === 'side' && !$('titleScreen').classList.contains('hidden') && all[1].W < TUNE.TITLE_MIN_W) best = all[0];
    $('app').classList.toggle('is-side', best.mode === 'side');
    geo = best;
    /* ★★ T321（アト）：★緑の 盤を 牌に ぴったり 合わせる（★すき間 0 に したら ★盤の 中に 空き地が 残る ため）。
       ★ 盤の 中身 ＝ 外の 道 ＋ 牌 ＋ 厚み ＋ 外の 道。★整数に 切り上げて ★外の 道が 0.5px も 欠けない ように。 */
    var st = boardEl.style, fr0 = frameOf();
    st.setProperty('--bw', (Math.ceil(geo.nx * geo.cw + geo.side + 2 * geo.lane) + fr0.x) + 'px');
    st.setProperty('--bh', (Math.ceil(geo.ny * geo.ch + geo.side + 2 * geo.lane) + fr0.y) + 'px');
    st.setProperty('--side', geo.side + 'px');
    boardEl.classList.toggle('has-side', geo.side > 0);
    /* ★ 実際の 盤の 中身の 大きさで まん中に 置く（★測れる ときは 測った 数）*/
    var W = boardIn && boardIn.clientWidth ? boardIn.clientWidth : best.W;
    var H = boardIn && boardIn.clientHeight ? boardIn.clientHeight : best.H;
    geo.W = W; geo.H = H;
    geo.ox = (W - geo.nx * geo.cw - geo.side) / 2;
    geo.oy = (H - geo.ny * geo.ch - geo.side) / 2;
    geo.pick = Math.max(2, Math.round(geo.tw * 0.09));
    st.setProperty('--tw', geo.tw + 'px');
    st.setProperty('--th', geo.th.toFixed(2) + 'px');
    st.setProperty('--cw', geo.cw.toFixed(2) + 'px');
    st.setProperty('--chh', geo.ch.toFixed(2) + 'px');
    st.setProperty('--pick', geo.pick + 'px');
    clearPath();
    if (G) placeTiles();
    fitResult();
  }

  /* ★ 盤の r 行 c 列 → 画面の 何列目・何行目（★たての ときは 90度 回す：(r,c) → (R-1-r, c)）*/
  function toD(r, c) { return geo.rot ? { dx: G.R - 1 - r, dy: c } : { dx: c, dy: r }; }
  function fromD(dx, dy) { return geo.rot ? { r: G.R - 1 - dx, c: dy } : { r: dy, c: dx }; }
  function cellLeft(dx) { return geo.ox + dx * geo.cw; }
  function cellTop(dy) { return geo.oy + dy * geo.ch; }
  /* ★ 線の 点（★外の 道も ふくむ）：盤の 中は マスの まん中、外の 道は 盤の ふちから lane の 半分 */
  function pointXY(p) {
    var d = toD(rowOf(G, p), colOf(G, p)), x, y;
    if (d.dx < 0) x = geo.ox - geo.lane / 2;
    else if (d.dx >= geo.nx) x = geo.ox + geo.nx * geo.cw + (geo.side || 0) + geo.lane / 2;   // ★T321：厚みの 外を 通す
    else x = geo.ox + (d.dx + 0.5) * geo.cw;
    if (d.dy < 0) y = geo.oy - geo.lane / 2;
    else if (d.dy >= geo.ny) y = geo.oy + geo.ny * geo.ch + (geo.side || 0) + geo.lane / 2;
    else y = geo.oy + (d.dy + 0.5) * geo.ch;
    return { x: x, y: y };
  }
  /* ★ 指の 座標 → 牌（★マスまるごとが 的。★空の マス・盤の 外は -1）*/
  function cellAt(cx, cy) {
    if (!G || !boardIn) return -1;
    var r0 = boardIn.getBoundingClientRect();
    var dx = Math.floor((cx - r0.left - geo.ox) / geo.cw), dy = Math.floor((cy - r0.top - geo.oy) / geo.ch);
    if (dx < 0 || dy < 0 || dx >= geo.nx || dy >= geo.ny) return -1;
    var rc = fromD(dx, dy), p = pad(G, rc.r, rc.c);
    return G.grid[p] >= 0 ? p : -1;
  }

  /* ── 盤と 牌を 1回だけ 作る ───────────────────── */
  function build() {
    if (built) return;
    built = true;
    if (MJ) MJ.install(document);                       // ★34種類＋裏 を <symbol> で 1回 置く（★アトの 部品）
    boardEl = $('board');
    boardIn = document.createElement('div');
    boardIn.className = 'board-in';
    boardIn.id = 'boardIn';
    boardEl.appendChild(boardIn);
    var s = sizeOf(TUNE.R, TUNE.C);
    for (var r = 0; r < TUNE.R; r++) for (var c = 0; c < TUNE.C; c++) {
      var d = document.createElement('div'), inn = document.createElement('div');
      var p = pad(s, r, c);
      d.className = 'tile is-out';
      d.dataset.p = String(p);
      inn.className = 'tile-in';
      d.appendChild(inn);
      boardIn.appendChild(d);
      tileEl[p] = d;
    }
    var NS = 'http://www.w3.org/2000/svg';
    pathSvg = document.createElementNS(NS, 'svg');
    pathSvg.setAttribute('class', 'path-layer');
    pathSvg.setAttribute('aria-hidden', 'true');
    ['pl-under', 'pl-top'].forEach(function (cl) {
      var pl = document.createElementNS(NS, 'polyline');
      pl.setAttribute('class', cl);
      pathSvg.appendChild(pl);
    });
    boardIn.appendChild(pathSvg);
    lensEl = document.createElement('div');
    lensEl.className = 'lens hidden';
    lensEl.id = 'lens';
    lensEl.setAttribute('aria-hidden', 'true');
    document.body.appendChild(lensEl);

    /* ★ 操作は Pointer Events だけ（★20本で 共通）。★click は 足さない（スマホで 遅れる・取りこぼす）。 */
    boardIn.addEventListener('pointerdown', onDown);
    boardIn.addEventListener('pointermove', onMove);
    boardIn.addEventListener('pointerup', onUp);
    boardIn.addEventListener('pointercancel', onCancel);
    boardIn.addEventListener('lostpointercapture', onCancel);
    boardIn.addEventListener('animationend', function (e) {
      if (e.animationName === 'shakeNo') { var t = e.target.closest('.tile'); if (t) t.classList.remove('is-no'); }
    });
    boardIn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    boardIn.addEventListener('dragstart', function (e) { e.preventDefault(); });
  }

  /* ★ 配った 牌を 絵に する（★アトの MJ.tile ―― <svg><use href="#mj-2s"/></svg>）*/
  function setKinds() {
    for (var key in tileEl) {
      if (!tileEl.hasOwnProperty(key)) continue;
      var p = +key, el = tileEl[p], k = G.grid[p];
      el.className = 'tile' + (k < 0 ? ' is-out' : '');
      el.firstChild.innerHTML = k >= 0 && MJ ? MJ.tile(CODES[k], 64) : '';
      el.dataset.k = String(k);
    }
  }
  function placeTiles() {
    boardEl.classList.add('no-anim');
    for (var key in tileEl) {
      if (!tileEl.hasOwnProperty(key)) continue;
      var p = +key, d = toD(rowOf(G, p), colOf(G, p));
      /* ★ T321（アト）：★すき間 0 なので 四捨五入しない（★丸めると 1px 重なったり 緑の 線が 出たり する）。
         ★ --z ＝ 画面の 左上から 右下へ 大きく（★右と 下の 牌が 上 ―― ★となりの 厚みを かくす。★盤を 回しても 同じ）。 */
      tileEl[p].style.transform = 'translate(' + cellLeft(d.dx).toFixed(2) + 'px,' + cellTop(d.dy).toFixed(2) + 'px)';
      /* ★ T323（アト）：★重なり順が 要るのは 厚み ありの ときだけ（★厚み なしの 牌は 重ならない）。★B では 付けない（★z-index は 20本と 同じ 小さな 数の まま）*/
      if (geo.side > 0) tileEl[p].style.setProperty('--z', String(1 + d.dy * geo.nx + d.dx));
      else tileEl[p].style.removeProperty('--z');
    }
    void boardEl.offsetWidth;
    boardEl.classList.remove('no-anim');
  }
  function markOut(p, out) {
    if (!tileEl[p]) return;
    if (!out) setArt(p);                 // ★戻る 牌の 絵を たしかめる（★途中から 配った 場面でも 絵が 空に ならない）
    tileEl[p].classList.toggle('is-out', !!out);
  }
  function setArt(p) {
    var el = tileEl[p], k = G.grid[p], u = el.querySelector('use');
    if (k < 0 || !MJ) return;
    if (!u || u.getAttribute('href') !== '#mj-' + CODES[k]) el.firstChild.innerHTML = MJ.tile(CODES[k], 64);
    el.dataset.k = String(k);
  }

  /* ── 線（★機械が 引いて 見せる）──────────────── */
  function showPath(path) {
    clearPath();
    var pts = path.map(function (p) { var q = pointXY(p); return q.x.toFixed(1) + ',' + q.y.toFixed(1); }).join(' ');
    var w = Math.max(3, Math.round(geo.tw * 0.16));
    var ls = pathSvg.querySelectorAll('polyline');
    ls[0].setAttribute('points', pts); ls[0].setAttribute('stroke-width', String(w + 4));
    ls[1].setAttribute('points', pts); ls[1].setAttribute('stroke-width', String(w));
    pathSvg.classList.remove('is-fade');
    pathT1 = setTimeout(function () {
      pathSvg.classList.add('is-fade');
      pathT2 = setTimeout(clearPath, TUNE.LINE_FADE);
    }, TUNE.LINE_SHOW);
  }
  function clearPath() {
    clearTimeout(pathT1); clearTimeout(pathT2);
    if (!pathSvg) return;
    var ls = pathSvg.querySelectorAll('polyline');
    for (var i = 0; i < ls.length; i++) ls[i].setAttribute('points', '');
    pathSvg.classList.remove('is-fade');
  }

  /* ============================================================
     ★★ おして えらぶ（★ピラミッドの 形・追記④「2枚を 選んで 組む」）★★
     ------------------------------------------------------------
       1枚めを おす       … その 牌を ★青わく で かこむ（＝ えらんだ）
       同じ 牌を おす     … ★つながれば 線が 出て 2枚とも 消える
                            ★つながらなければ その 牌が ぷるっと ゆれる（★青わくは 残す）
       ちがう 牌を おす   … ★えらび直し（★その 牌に 青わくが 移る）
       青わくを おす      … えらびを やめる
     ★★ 探すのは 人、たしかめるのが 機械（★追記④）★★
       ★ 2枚とも 人が おす。★プログラムが するのは「同じ 牌か・つながるか」の 判定だけ。
       ★ 相手を 探さない・光らせない（★社長お決め② ヒント 無し）。
     ============================================================ */
  function clearSel() {
    if (sel >= 0 && tileEl[sel]) tileEl[sel].classList.remove('is-pick');
    sel = -1;
  }
  function setSel(p) {
    clearSel();
    sel = p;
    tileEl[p].classList.add('is-pick');
  }
  function shakeTile(p) {
    var el = tileEl[p];
    if (!el) return;
    el.classList.remove('is-no');
    void el.offsetWidth;
    el.classList.add('is-no');
  }

  function tapTile(p) {
    if (!G || G.over || busy || p < 0 || G.grid[p] < 0) return;
    if (sel < 0) { setSel(p); return; }
    if (sel === p) { clearSel(); return; }
    if (G.grid[p] !== G.grid[sel]) { setSel(p); return; }          // ★ちがう 牌 → えらび直し
    var path = CORE.canTake(G, sel, p);
    if (!path) { shakeTile(p); return; }                            // ★同じ 牌でも つながらない → ゆれる だけ
    play(sel, p, path);
  }

  /* ── 指の 出入り（★1本の 指だけ）──────────────────
     ★ 当たりは ★指の 座標から マスを 数える（cellAt）。★はなした ところの 牌が えらばれる。
     ★ おして いる 間は ★「大きく 見せる 牌」が 指の 上に 出る（★牌が 小さい 画面で・指の とき だけ）。
       ★ 指を となりへ ずらすと 見せる 牌も 移る ―― ★はなす 前に 確かめられる。 */
  function onDown(e) {
    if (!G || G.over || busy) return;
    if (performance.now() < guardUntil) return;
    if (press) return;
    if (e.isPrimary === false) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    press = { id: e.pointerId, p: cellAt(e.clientX, e.clientY), touch: e.pointerType !== 'mouse' };
    try { boardIn.setPointerCapture(e.pointerId); } catch (err) {}
    updateLens();
  }
  function onMove(e) {
    if (!press || e.pointerId !== press.id) return;
    var p = cellAt(e.clientX, e.clientY);
    if (p !== press.p) { press.p = p; updateLens(); }
  }
  function onUp(e) {
    if (!press || e.pointerId !== press.id) return;
    var p = cellAt(e.clientX, e.clientY);
    press = null;
    hideLens();
    try { boardIn.releasePointerCapture(e.pointerId); } catch (err) {}
    if (!G || G.over || busy) return;
    if (p >= 0) tapTile(p);
  }
  function onCancel(e) {
    if (!press || (e && e.pointerId !== press.id)) return;
    press = null; hideLens();
  }
  function cancelPress() { press = null; hideLens(); }

  /* ★★ 大きく 見せる 牌（★アトの 案）★★ */
  function updateLens() {
    if (!press || !press.touch || geo.tw >= TUNE.LENS_UNDER || press.p < 0 || !MJ) { hideLens(); return; }
    var p = press.p, d = toD(rowOf(G, p), colOf(G, p)), r0 = boardIn.getBoundingClientRect();
    var lw = TUNE.LENS_W, lh = lw * TUNE.RATIO, pad8 = 16;
    var cx = r0.left + cellLeft(d.dx) + geo.cw / 2, top = r0.top + cellTop(d.dy), bot = top + geo.ch;
    var x = Math.max(4, Math.min(window.innerWidth - lw - pad8 - 4, cx - (lw + pad8) / 2));
    var y = top - (lh + pad8) - 14;
    if (y < 4) y = Math.min(window.innerHeight - lh - pad8 - 4, bot + 14);
    lensEl.innerHTML = MJ.tile(CODES[G.grid[p]], lw);
    lensEl.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(y) + 'px)';
    lensEl.classList.remove('hidden');
  }
  function hideLens() { if (lensEl) lensEl.classList.add('hidden'); }

  /* ── 1組 消す（★人の 手は かならず ここを 通る）───────── */
  function play(a, b, path) {
    clearSel();
    applyMove(G, { a: a, b: b });
    markOut(a, true); markOut(b, true);
    showPath(path);
    updateTools();
    if (isWin(G)) { finish(); return; }
    /* ★ 半分 消えた（★数字は 言わない）*/
    if (!half && G.left <= G.R * G.C / 2) { half = true; say(line('half')); }
    /* ★ 1組も 消せなく なった ときだけ 箱を 出す（★最後の 線を 見せてから）*/
    if (isStuck(G)) {
      G.over = true; clkPause(); updateTools();
      stopTimer = setTimeout(function () { stopTimer = 0; showResult('stop'); }, TUNE.STOP_WAIT);
    }
  }

  function updateTools() {
    $('btnUndo').disabled = !G || !G.hist.length || busy;
  }

  /* ── 勝ち ────────────────────────────────── */
  var lastClear = null;
  function finish() {
    busy = true; G.over = true; G.won = true;
    clkPause();
    var ms = clkMs(), before = loadBest(), isNew = !before || ms < before;
    if (isNew) saveBest(ms);
    lastClear = { ms: ms, best: isNew ? ms : before, isNew: isNew };
    updateTools();
    say(line(isNew ? 'winBest' : 'win', fmtTime(ms)));
    $('happyCat').classList.add('is-jump');
    timer = setTimeout(startFall, TUNE.FALL_WAIT);
  }

  /* ★ 牌が 降る 演出（★勝った ときだけ）―― ★アトの 牌を data: の 絵に して 描く（★外の 通信 0）*/
  var fallImg = {};
  function tileImg(k) {
    if (!fallImg[k] && MJ) {
      var im = new Image();
      im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(MJ.tileSVG(CODES[k], 64));
      fallImg[k] = im;
    }
    return fallImg[k];
  }
  function startFall() {
    var cv = $('fallCanvas');
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var Wp = window.innerWidth, Hp = window.innerHeight;
    cv.width = Math.round(Wp * dpr); cv.height = Math.round(Hp * dpr);
    cv.classList.remove('hidden');
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var br = boardIn.getBoundingClientRect(), tw = Math.max(20, geo.tw), th = tw * TUNE.RATIO;
    var live = [], next = 0, t0 = performance.now(), raf = 0, done = false, rnd = Math.random;
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
      while (next < TUNE.FALL_N && el > next * TUNE.FALL_STEP) {
        var dir = rnd() < 0.5 ? -1 : 1;
        live.push({ img: tileImg((rnd() * CODES.length) | 0), x: br.left + rnd() * Math.max(1, br.width - tw), y: br.top + rnd() * br.height * 0.4,
                    vx: dir * (1.4 + rnd() * 3.6), vy: -(1 + rnd() * 4.5) });
        next++;
      }
      for (var i = live.length - 1; i >= 0; i--) {
        var p = live[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.55;
        if (p.y + th > Hp) { p.y = Hp - th; p.vy = -p.vy * 0.78; if (p.vy > -3) p.vy = -(3 + rnd() * 3); }
        if (p.img && p.img.complete && p.img.naturalWidth) { try { ctx.drawImage(p.img, p.x, p.y, tw, th); } catch (e) {} }
        if (p.x + tw < -20 || p.x > Wp + 20) live.splice(i, 1);
      }
      if (next >= TUNE.FALL_N && live.length === 0) { stop(); return; }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
  }

  /* ============================================================
     ★ 結果の 箱 ＋ 連打よけ（T62 の 事故を くり返さない）
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
  /* ★★ 止まった 箱（★ピラミッドと 同じ）★★ ―― ★「もどす」を 一番 大きく 出す。★文字は 足さない。 */
  function showResult(kind) {
    G.over = true; busy = true; updateTools();
    var win = kind === 'win';
    $('resultTitle').textContent = win ? 'ぜんぶ 消えた！' : 'うーん、止まった';
    $('resultTitle').classList.toggle('is-stop', !win);
    var ln = win ? line(lastClear && lastClear.isNew ? 'winBest' : 'win', fmtTime(lastClear ? lastClear.ms : 0)) : line('stop');
    $('resultSay').textContent = ln;
    say(ln);
    $('resultTime').classList.toggle('hidden', !win);
    if (win && lastClear) {
      $('timeNow').textContent = fmtTime(lastClear.ms);
      $('timeBestRow').innerHTML = lastClear.isNew ? '<b>いままでで いちばん 速い！</b>' : 'いちばん 速い 記録 <b id="timeBest">' + fmtTime(lastClear.best) + '</b>';
    }
    if (win) {
      $('btnMain').innerHTML = '新しく 配る <b>▶</b>';
      $('btnMain').dataset.act = 'new';
      $('btnSub').classList.add('hidden');
    } else {
      $('btnMain').innerHTML = 'もどす <b>▶</b>';           // ★一番 大きい ボタン
      $('btnMain').dataset.act = 'undo';
      $('btnSub').classList.remove('hidden');
    }
    lockResult();
    $('resultWrap').classList.remove('hidden');
    fitResult();
  }
  function hideResult() { $('resultWrap').classList.add('hidden'); unlockResult(); }
  /* ★★ 箱が 画面の たけに 入らない とき（★568×272 など）★★
     ★ CSS の たての 線は 引かない（★追記⑥ 決まり2）。★出して みて ★中身が 切れて いたら 詰める：
       ① is-tight … 字と すき間を 小さく・★ボタンを よこ 1列に
       ② is-tighter … ★箱の 中の ひとことを 消す（★同じ ことばを ハッピーが ふきだしで 言って いる）
     ★ 画面の 大きさが 変わったら（回した など）やり直す（layout から）。 */
  function fitResult() {
    var box = $('resultBox');
    box.classList.remove('is-tight', 'is-tighter');
    if ($('resultWrap').classList.contains('hidden')) return;
    if (box.scrollHeight > box.clientHeight + 0.5) box.classList.add('is-tight');
    if (box.scrollHeight > box.clientHeight + 0.5) box.classList.add('is-tighter');
  }

  /* ★★ 箱を 閉じた 直後の 2つめの 指（★T316 の 学び）★★
     ★ 箱の ボタン／「分かった！」を 押した しゅんかんから TUNE.AFTER_BOX ms は、
       ★盤・上の帯・ハッピーの 行（#app の 中）への 指を ★window の いちばん はじめで 止める。 */
  function armGuard() { guardUntil = performance.now() + TUNE.AFTER_BOX; }
  function guardEv(e) {
    if (performance.now() >= guardUntil) return;
    var t = e.target;
    if (t && t.closest && t.closest('#app')) { e.preventDefault(); e.stopPropagation(); }
  }

  /* ── 試合の 出し入れ ──────────────────────────── */
  function cancelAll() {
    cancelPress();
    clearSel();
    clearTimeout(timer); clearTimeout(stopTimer); stopTimer = 0;
    if (fallStop) fallStop();
    $('fallCanvas').classList.add('hidden');
    $('happyCat').classList.remove('is-jump');
    hideResult();
    clearPath();
    busy = false;
  }
  function showBoard() {
    $('titleScreen').classList.add('hidden');
    $('playScreen').classList.remove('hidden');
    $('tools').classList.remove('hidden');
    setKinds();
    layout();
    updateTools();
  }
  function newDeal(again) {
    cancelAll();
    G = makeDeal(pickSeed());
    half = false; lastClear = null;
    showBoard();
    clkReset(); clkResume();
    /* ★ 保証が ある からこそ 言える ひとこと（★ピラミッドと 同じ）*/
    if (again) {
      say(line('again'));
      timer = setTimeout(function () { if (G && !G.over) say(line('deal')); }, 1600);
    } else {
      say(line('deal'));
    }
  }
  /* ★ もどす（★無制限）。★止まった 箱を 閉じるのも ここを 通す（★ピラミッド T69 と 同じ 順番）*/
  function undoOne() {
    if (!G) return;
    cancelAll();
    G.over = false; G.won = false;
    var rec = undoMove(G);
    if (rec) { markOut(rec.a, false); markOut(rec.b, false); }
    if ($('happyBubble').textContent === line('stop')) say(line('back'));   // ★T323：止まった ときの ことばを 言い続けない
    updateTools();
    clkResume();
  }

  /* ── つなぐ ─────────────────────────────────── */
  function boot() {
    build();
    window.addEventListener('pointerdown', guardEv, true);
    window.addEventListener('click', guardEv, true);
    $('btnStart').addEventListener('click', function () { newDeal(false); });
    $('btnNew').addEventListener('click', function () { newDeal(true); });
    $('btnUndo').addEventListener('click', undoOne);
    $('btnHowto').addEventListener('click', function () { cancelPress(); $('helpDialog').showModal(); });
    var closers = document.querySelectorAll('[data-close]');
    for (var i = 0; i < closers.length; i++) {
      closers[i].addEventListener('click', function () { $(this.dataset.close).close(); armGuard(); });
    }
    $('helpDialog').addEventListener('cancel', armGuard);
    $('btnMain').addEventListener('click', function () {
      if (locked) return;
      armGuard();
      if (this.dataset.act === 'undo') undoOne();
      else newDeal(true);
    });
    $('btnSub').addEventListener('click', function () { if (locked) return; armGuard(); newDeal(true); });
    $('resultWrap').addEventListener('pointerdown', bumpLock, true);
    window.addEventListener('resize', layout);
    window.addEventListener('orientationchange', function () { setTimeout(layout, 120); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) clkPause(); else clkResume(); });
    var b = loadBest();
    say(b ? line('titleBest', fmtTime(b)) : line('title'));
    layout();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

    /* ============================================================
     ★★ 見張り（window.SHISEN.verify）★★
     ------------------------------------------------------------
     ★ 画面には 1つも 出さない（★お客さんに 見せる 物では ない）。
     ★ 見るもの（★鳴いたら 番号から 始まる 1行）：
       ① 配り       … 一覧が ある・★先頭 n 個を 解いて 流しこんで 勝てる・★136枚＝34種類×4
       ② 決まり     … 小さい 盤で ○×（★曲がり 3回は ×・★外の 道は ○）・★回した 盤で 同じ・★線が 空の マスだけ 通る
       ③ 盤の 寸法  … 牌が 盤と 画面の 中・ひりつ 88/64・重ならない・外の 道が ある・★4つの 並べ方で いちばん 大きい
       ④ 光らせない … 青わく ≦ 1・★ほかの しるし 0・★:hover 0・★画面の 側で 消せる 組を 数えて いない
       ⑤ ハッピー   … 絵・しっぽ・まばたき・名前・ふきだし・★どの ことばも 切れない・折れすぎない
       ⑥ 指の 的    … ボタン ぜんぶ 44×44（★1pxずつ つついて 数える）
       ⑦ はみ出し   … よこ・たて に すべらない・★帯が sticky・親に overflow が 無い・帯／盤／ハッピーが 重ならない
       ⑧ 家へ 帰る道 … 結果の 箱に「◀ ゲームを選ぶ」（../）・★「やめる」の 字が 0
       ⑨ 名前       … ★「上海」の 字が 頭にも 体にも 0
       ⑩ 題         … h1 1つ・帯と 同じ 字・canonical＝og:url
       ⑪ 外への 通信 … performance の 記録に よその 住所 0
       ⑫ 牌の 絵    … アトの 部品・★symbol 35・★どの 牌も 盤の 中身と 同じ 絵
       ⑬ 箱         … 止まった ときは「もどす」が 一番 大きい・勝った ときは「新しく 配る」
       ⑭ 記録       … 時間の 書き方
       ⑮ 2連打の 止め … 箱を 閉じた 直後の 指が 帯の ボタンに 届かない
       ⑯ ことば     … 中学の 漢字の まちがいやすい 字（押・揃・枠・詰・繋・盤 …）が 0
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
  /* ★ 箱（showModal の dialog）が 開いて いて、その 外の ボタン なら 見送る（★T295 の 型・ピラミッドと 同じ）*/
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
    var at = document.elementFromPoint(cx, cy);
    if (hakoNoSoto(el, at)) return { skip: true };
    /* ★ 結果の 箱（★画面 いっぱいの 幕）が 出て いる あいだ、★幕の 外の ボタンは 押せなくて 正しい ―― 見送る。
       ★ 見送るのは ★指の 先が その 幕 だった ときだけ（★ほかの ものが かぶって いたら これまで どおり 鳴く）。 */
    var rw = $('resultWrap');
    if (!rw.classList.contains('hidden') && !rw.contains(el) && at && rw.contains(at)) return { skip: true };
    if (!hit(cx, cy)) return { w: 0, h: 0, why: 'まん中が 押せない' };
    var up = 0, dn = 0, lf = 0, rt = 0, i;
    for (i = 1; i <= 80; i++) { if (hit(cx, cy - i)) up = i; else break; }
    for (i = 1; i <= 80; i++) { if (hit(cx, cy + i)) dn = i; else break; }
    for (i = 1; i <= 200; i++) { if (hit(cx - i, cy)) lf = i; else break; }
    for (i = 1; i <= 200; i++) { if (hit(cx + i, cy)) rt = i; else break; }
    return { w: lf + rt + 1, h: up + dn + 1 };
  }
  /* ★ 小さい 盤を 文字で 作る（★'.' 空・'A' 'B' … 種類）―― ★決まりの 見張り 用 */
  function boardOf(rows) {
    var R = rows.length, C = rows[0].length, s = sizeOf(R, C);
    var g = { R: R, C: C, W: s.W, H: s.H, K: 26, grid: new Int8Array(s.W * s.H).fill(-1), kpos: [], left: 0, hist: [] }, at = {};
    for (var k = 0; k < 26; k++) g.kpos.push([]);
    rows.forEach(function (row, r) {
      for (var c = 0; c < row.length; c++) {
        var ch = row[c]; if (ch === '.') continue;
        var kk = ch.charCodeAt(0) - 65, p = pad(s, r, c);
        g.grid[p] = kk; g.kpos[kk].push(p); g.left++;
        (at[ch] = at[ch] || []).push(p);
      }
    });
    return { g: g, at: at };
  }
  /* ★ 線が 本当に 空の マスだけを 通るか（★connect とは 別の 書き方で 数え直す）*/
  function walkOK(g, path) {
    if (!path || path.length < 2) return false;
    var W = g.W;
    for (var i = 1; i < path.length; i++) {
      var a = path[i - 1], b = path[i], ar = (a / W) | 0, ac = a % W, br = (b / W) | 0, bc = b % W;
      if (ar !== br && ac !== bc) return false;                 // ななめ
      var dr = Math.sign(br - ar), dc = Math.sign(bc - ac), r = ar, c = ac;
      while (r !== br || c !== bc) {
        r += dr; c += dc;
        var q = r * W + c;
        if (q === path[path.length - 1]) continue;
        if (g.grid[q] >= 0) return false;
      }
    }
    return true;
  }
  var BANNED = '押揃枠詰繋盤賭嵌棄択匹粒濃淡隣繰謎挑壁';

  function verify(n) {
    n = n == null ? 3 : n;
    var ng = [], note = {}, t0 = Date.now();
    function put(no, arr, info) { for (var i = 0; i < arr.length; i++) ng.push(no + ' ' + arr[i]); note[no] = arr.length ? ('NG ' + arr.length) : ('OK' + (info ? '（' + info + '）' : '')); }

    /* ① 配り */
    var b1 = [], solved = 0;
    if (!DEAL_LIST.length) b1.push('★' + sizeKey() + ' の 配りの 一覧が 無い（★その場で 解く 保険で 動いて いる）');
    for (var i = 0; i < n && i < DEAL_LIST.length; i++) {
      var sd = DEAL_LIST[i], r = CORE.solve(CORE.makeDeal(sd), { ms: 4000, nodes: 300000 });
      if (!r.ok) { b1.push('種 ' + sd + ' が 解けない'); continue; }
      var v = CORE.replay(sd, r.moves);
      if (!v.ok) b1.push('種 ' + sd + ' を 流しこむと ' + v.why); else solved++;
    }
    var g1 = CORE.makeDeal(DEAL_LIST[0] || 1), per = {};
    for (var k1 = 0; k1 < g1.kpos.length; k1++) per[g1.kpos[k1].length] = (per[g1.kpos[k1].length] || 0) + 1;
    if (g1.left !== TUNE.R * TUNE.C) b1.push('牌が ' + g1.left + '枚');
    if (TUNE.R * TUNE.C === 136 && (g1.kpos.length !== 34 || per[4] !== 34)) b1.push('34種類×4枚 に なって いない');
    if (G) { var cc = CORE.countAll(G); if (!cc.ok) b1.push('いまの 盤：' + cc.why); if (DEAL_LIST.length && DEAL_LIST.indexOf(G.seed) < 0 && !G.test) b1.push('いまの 配り ' + G.seed + ' が 一覧に 無い'); }
    put('①', b1, '一覧 ' + DEAL_LIST.length + '・解いて 流しこんだ ' + solved);

    /* ② 決まり */
    var b2 = [], cases = [
      ['となり', ['AA'], true, 0],
      ['まっすぐ（間が 空き）', ['A.A'], true, 0],
      ['間に 牌 → 外の 道を 回る', ['ABA', 'CDC'], true, 2],
      ['1回 曲がる', ['A.', '.A'], true, 1],
      ['2回 曲がる', ['A..', 'BBB', '.A.'], true, 2],
      ['★3回 曲がらないと つながらない', ['BBBBB', 'BA.BB', 'BB..B', 'BBBAB', 'BBBBB'], false, -1],
      ['囲まれて いる', ['BBBB', 'BABB', 'BBAB', 'BBBB'], false, -1],
      ['★左の 外の 道を 通る', ['AB', 'CD', 'AE'], true, 2]
    ];
    cases.forEach(function (cs) {
      var bb = boardOf(cs[1]), a = bb.at.A[0], b = bb.at.A[1], p = CORE.canTake(bb.g, a, b);
      if (!!p !== cs[2]) b2.push(cs[0] + ' → ' + (!!p) + '（正は ' + cs[2] + '）');
      else if (p && (turnsOf(p) !== cs[3] || !walkOK(bb.g, p))) b2.push(cs[0] + ' の 線が おかしい（曲がり ' + turnsOf(p) + '）');
    });
    var bd = boardOf(['AB']);
    if (CORE.canTake(bd.g, bd.at.A[0], bd.at.B[0])) b2.push('ちがう 牌が 消せた');
    /* ★ 回しても 同じ か ―― ★いまの 盤 と ★途中まで 消した 盤（★道が 空いて 消せる 組が 多い）の 2つで 数える */
    var boards2 = [G || CORE.makeDeal(DEAL_LIST[0] || 1)], diff = 0, cnt = 0, bad = 0, moved = 0;
    (function () {
      var sd2 = DEAL_LIST[0] || 1, r2 = CORE.solve(CORE.makeDeal(sd2), { ms: 3000, nodes: 200000 });
      if (!r2.ok) return;
      var g2 = CORE.makeDeal(sd2);
      for (var i2 = 0; i2 < 30 && i2 < r2.moves.length; i2++) CORE.applyMove(g2, r2.moves[i2]);
      boards2.push(g2);
    })();
    boards2.forEach(function (gR) {
      var rt = CORE.rotated(gR);
      for (var p2 in rt.map) if (rt.map.hasOwnProperty(p2) && rt.g.grid[rt.map[p2]] !== gR.grid[+p2]) moved++;
      for (var k2 = 0; k2 < gR.kpos.length; k2++) {
        var L = gR.kpos[k2];
        for (var x = 0; x < L.length; x++) for (var y = x + 1; y < L.length; y++) {
          cnt++;
          var pA = CORE.connect(gR, L[x], L[y], true), pB = CORE.connect(rt.g, rt.map[L[x]], rt.map[L[y]], false);
          if (!!pA !== !!pB) diff++;
          if (pA && (turnsOf(pA) > 2 || !walkOK(gR, pA))) bad++;
        }
      }
    });
    if (moved) b2.push('★回した 盤で 牌が ' + moved + 'マス 入れかわった');
    if (diff) b2.push('★回した 盤で ' + diff + '組 ちがった');
    if (bad) b2.push('★線が 牌を 通る／曲がり 3回 ' + bad + '本');
    put('②', b2, cases.length + 1 + '件・回した 盤 ' + cnt + '組');

    /* ③ 盤の 寸法（★遊ぶ 画面の とき だけ）*/
    var b3 = [], playing = G && !$('playScreen').classList.contains('hidden');
    if (playing) {
      var bi = boardIn.getBoundingClientRect(), W = window.innerWidth, H = window.innerHeight, rects = [], nT = 0;
      for (var key in tileEl) {
        if (!tileEl.hasOwnProperty(key)) continue;
        var el = tileEl[key], inn = el.firstChild;
        nT++;
        if (el.classList.contains('is-out')) continue;
        var ir = inn.getBoundingClientRect();
        if (el.classList.contains('is-pick')) continue;         // ★青わくで 1px 持ち上がる ―― 重なりは 下で 数える
        if (ir.left < bi.left - 0.5 || ir.right > bi.right + 0.5 || ir.top < bi.top - 0.5 || ir.bottom > bi.bottom + 0.5) b3.push('牌が 盤から 出た（' + key + '）');
        if (ir.left < -0.5 || ir.right > W + 0.5 || ir.top < -0.5 || ir.bottom > H + 0.5) b3.push('牌が 画面から 出た（' + key + '）');
        if (Math.abs(ir.height / ir.width - TUNE.RATIO) > 0.02) b3.push('牌の ひりつが ' + (ir.height / ir.width).toFixed(3));
        rects.push(ir);
      }
      if (nT !== G.R * G.C) b3.push('牌の 箱が ' + nT + '個');
      /* ★ 線の 点（pointXY）が ★牌の まん中に 来るか（★線が 別の 牌から 出て いない か）―― ★ぜんぶの マスで 数える */
      var off = 0, worstOff = 0;
      for (var key3 in tileEl) {
        if (!tileEl.hasOwnProperty(key3)) continue;
        var tr3 = tileEl[key3].getBoundingClientRect(), pt = pointXY(+key3);
        var dxy = Math.max(Math.abs(bi.left + pt.x - (tr3.left + tr3.width / 2)), Math.abs(bi.top + pt.y - (tr3.top + tr3.height / 2)));
        if (dxy > worstOff) worstOff = dxy;
        if (dxy > 1.01) off++;
      }
      if (off) b3.push('★線の 点が 牌の まん中から ずれた ' + off + 'マス（最大 ' + worstOff.toFixed(1) + 'px）');
      if (geo.cw < geo.tw - 0.01 || geo.ch < geo.th - 0.01) b3.push('マスが 牌より 小さい');
      var ov = 0;
      for (var i3 = 0; i3 < rects.length; i3++) for (var j3 = i3 + 1; j3 < rects.length; j3++) {
        var A = rects[i3], B = rects[j3];
        if (Math.min(A.right, B.right) - Math.max(A.left, B.left) > 0.6 && Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top) > 0.6) ov++;
      }
      if (ov) b3.push('牌が ' + ov + '組 重なった');
      if (geo.ox < geo.lane - 0.5 || geo.oy < geo.lane - 0.5) b3.push('外の 道が 足りない（' + geo.ox.toFixed(1) + '／' + geo.oy.toFixed(1) + '／道 ' + geo.lane + '）');
      /* ★ T321（アト）★社長の お決め：★すき間 0・★厚み なし（B）★
         ★ ここで 数える もの（★どれも 実物：牌の 絵の 箱 getBoundingClientRect ／ 盤の class ／ 牌の --z）
           ・★右と 下にも 外の 道が 残るか（★上の 行は 左と 上 だけ。★厚み ありなら 厚みの 外で 数える）
           ・★すき間 0 か：となりどうしの 牌の 絵の 間が 0.6px より 空いて いたら 鳴く（★社長の ご指示 そのもの）
           ・★厚み なし（TUNE.SIDE＝0）なのに 厚みの 板（.has-side）が 出て いたら 鳴く
           ・★厚み あり の ときだけ：右・下の 牌ほど 上か（★厚みを となりが かくす 順）。★厚み なしでは 意味が 無い ので 数えない */
      var sd3 = geo.side || 0;
      if (geo.W - (geo.ox + geo.nx * geo.cw + sd3) < geo.lane - 0.5 || geo.H - (geo.oy + geo.ny * geo.ch + sd3) < geo.lane - 0.5) b3.push('★右・下の 外の 道が 足りない（厚み ' + sd3 + '）');
      var gapN = 0, gapW = 0;
      for (var ig = 0; ig < rects.length; ig++) for (var jg = 0; jg < rects.length; jg++) {
        var ga = rects[ig], gb = rects[jg], gg = -1;
        if (Math.abs(gb.top - ga.top) < 0.5 && gb.left > ga.left + 0.5 && gb.left < ga.left + ga.width * 1.5) gg = gb.left - ga.right;       // 右どなり
        else if (Math.abs(gb.left - ga.left) < 0.5 && gb.top > ga.top + 0.5 && gb.top < ga.top + ga.height * 1.5) gg = gb.top - ga.bottom; // 下どなり
        if (gg > 0.6) { gapN++; if (gg > gapW) gapW = gg; }
      }
      if (gapN) b3.push('★牌と 牌の 間に すき間 ' + gapN + 'か所（最大 ' + gapW.toFixed(1) + 'px）');
      if (!(TUNE.SIDE > 0) && boardEl.classList.contains('has-side')) b3.push('★厚み なし の はず なのに 厚みの 板が 出て いる');
      if (sd3 > 0) {
        var zBad = 0, zs = [];
        for (var key3z in tileEl) {
          if (!tileEl.hasOwnProperty(key3z)) continue;
          var trz = tileEl[key3z].getBoundingClientRect();
          zs.push({ x: trz.left, y: trz.top, z: +tileEl[key3z].style.getPropertyValue('--z') || 0 });
        }
        for (var iz = 0; iz < zs.length; iz++) for (var jz = 0; jz < zs.length; jz++) {
          var za = zs[iz], zb = zs[jz];
          var below = zb.y > za.y + geo.ch * 0.5, right = Math.abs(zb.y - za.y) < geo.ch * 0.5 && zb.x > za.x + geo.cw * 0.5;
          if ((below || right) && zb.z <= za.z) zBad++;
        }
        if (zBad) b3.push('★右・下の 牌が 上に なって いない ' + zBad + '組（★厚みが となりの 牌に かぶる）');
      }
      note['③ 厚み'] = sd3 > 0 ? ('あり ' + sd3 + 'px') : 'なし（★重なりの 順は 数えない）';
      var all = planAll(), mx = Math.max(all[0].tw, all[1].tw);
      if (geo.tw < mx) b3.push('★もっと 大きく できる 並べ方が ある（' + geo.tw + ' ＜ ' + mx + '）');
      note['③ 牌'] = geo.tw + '×' + geo.th.toFixed(1) + 'px・マス ' + geo.cw.toFixed(1) + '×' + geo.ch.toFixed(1) + '・' + (geo.rot ? 'たて' : 'よこ') + '・ハッピー' + (geo.mode === 'side' ? '右' : '下');
    }
    put('③', b3, playing ? '' : 'はじめの 画面');

    /* ④ 光らせない */
    var b4 = [], picks = boardIn ? boardIn.querySelectorAll('.is-pick') : [];
    if (picks.length > 1) b4.push('青わくが ' + picks.length + '個');
    if (picks.length === 1 && +picks[0].dataset.p !== sel) b4.push('青わくが えらんだ 牌と ちがう');
    for (var key4 in tileEl) {
      if (!tileEl.hasOwnProperty(key4)) continue;
      var cl = tileEl[key4].className.split(/\s+/).filter(function (x) { return x && x !== 'tile' && x !== 'is-out' && x !== 'is-pick' && x !== 'is-no'; });
      if (cl.length) { b4.push('牌に 余計な しるし：' + cl.join(',')); break; }
      if (tileEl[key4].firstChild.style.cssText) { b4.push('牌に じかの 見た目'); break; }
    }
    if (boardIn && boardIn.querySelectorAll('.hint,.is-hint,.is-good,.is-match').length) b4.push('ヒントの しるしが ある');
    try {
      for (var sI = 0; sI < document.styleSheets.length; sI++) {
        (function walk(list) {
          for (var q = 0; q < list.length; q++) {
            if (list[q].cssRules) walk(list[q].cssRules);
            var s4 = list[q].selectorText || '';
            if (/\.tile[^,{]*:(hover|focus)/.test(s4)) b4.push('牌に :hover の 決まり：' + s4);
          }
        })(document.styleSheets[sI].cssRules || []);
      }
    } catch (e) {
      if (location.protocol === 'file:') note['④ :hover'] = '★測れていません（file:// では CSS を 読めない）';
      else b4.push('CSS を 読めない：' + e.message);
    }
    var uiSrc = String(tapTile) + String(setSel) + String(onDown) + String(onUp) + String(updateLens) + String(placeTiles) + String(setKinds);
    if (/legalPairs|hasMove|solve\(/.test(uiSrc)) b4.push('★画面の 側で 消せる 組を 数えて いる');
    put('④', b4, '青わく ' + picks.length);

    /* ⑤ ハッピー */
    var b5 = [], cat = $('happyCat'), bub = $('happyBubble'), row = $('logRow');
    if (!vis(cat)) b5.push('ハッピーの 絵が 見えない');
    else { var cr = cat.getBoundingClientRect(); if (cr.width < 30 || cr.height < 30) b5.push('ハッピーが 小さい ' + Math.round(cr.width) + '×' + Math.round(cr.height)); }
    if (!cat || !cat.querySelector('.cat-tail')) b5.push('しっぽが 無い');
    if (!cat || !cat.querySelector('.cat-eyes')) b5.push('まばたきの 目が 無い');
    if ((($('happyWrap').textContent || '') + (cat ? cat.getAttribute('aria-label') : '')).indexOf('ハッピー') < 0) b5.push('名前「ハッピー」が 無い');
    if (!vis(bub) || !bub.textContent.trim()) b5.push('ふきだしが 見えない／空');
    if (vis(row)) {
      var rr = row.getBoundingClientRect();
      if (rr.bottom > window.innerHeight + 0.5 || rr.right > window.innerWidth + 0.5 || rr.left < -0.5) b5.push('ハッピーの 行が 画面から 出た');
      var keep = bub.textContent, worst = 0, worstK = '', side = $('app').classList.contains('is-side'), maxL = side ? 6 : 2;
      Object.keys(LINES).forEach(function (k5) {
        bub.textContent = line(k5, '12分34秒');
        var nL = lineCount(bub), br5 = bub.getBoundingClientRect(), rw5 = row.getBoundingClientRect();
        if (nL > worst) { worst = nL; worstK = k5; }
        if (nL > maxL) b5.push('「' + k5 + '」が ' + nL + '行');
        if (br5.bottom > rw5.bottom + 0.5 || br5.top < rw5.top - 0.5 || rw5.bottom > window.innerHeight + 0.5) b5.push('「' + k5 + '」が 切れる');
      });
      bub.textContent = keep;
      note['⑤ いちばん 長い ことば'] = worstK + ' ' + worst + '行';
    }
    put('⑤', b5);

    /* ⑥ 指の 的 44×44 */
    var b6 = [], seen6 = [];
    ['btnBack', 'btnUndo', 'btnNew', 'btnHowto', 'btnStart', 'btnMain', 'btnSub', 'btnQuit'].forEach(function (id) {
      var e6 = $(id);
      if (!vis(e6)) return;
      if ((id === 'btnUndo') && e6.disabled) return;           // ★灰色は 押せない（★見た目も 44px ある）
      var m = matoOf(e6);
      if (m.skip) return;
      seen6.push(id);
      if (m.why) b6.push(id + ' ' + m.why);
      else if (m.w < 44 || m.h < 44) b6.push(id + ' が ' + m.w + '×' + m.h);
    });
    var hd = $('helpDialog');
    if (hd.open) ['.close-dialog', '.dialog-ok'].forEach(function (sq) {
      var e6 = hd.querySelector(sq);
      if (!vis(e6)) return;
      var rr6 = e6.getBoundingClientRect(), dr6 = hd.getBoundingClientRect();
      if (rr6.top < dr6.top - 0.5 || rr6.bottom > dr6.bottom + 0.5) return;   // ★すべらせれば 出る ―― 数えない
      var m = matoOf(e6); seen6.push(sq);
      if (m.why) b6.push(sq + ' ' + m.why); else if (m.w < 44 || m.h < 44) b6.push(sq + ' が ' + m.w + '×' + m.h);
    });
    put('⑥', b6, seen6.length + 'か所');

    /* ⑦ はみ出し・帯 */
    var b7 = [], de = document.documentElement, tb = $('topbar');
    if (de.scrollWidth > window.innerWidth + 0.5) b7.push('よこに すべる（' + de.scrollWidth + '）');
    /* ★ body は overflow:hidden ―― ★すべらない かわりに ★はみ出した ものは 見えなく なる。★だから 中身の 幅も 数える */
    var appEl = $('app');
    if (document.body.scrollWidth > window.innerWidth + 0.5) b7.push('中身が よこに はみ出した（' + document.body.scrollWidth + '）');
    if (appEl.scrollWidth > appEl.clientWidth + 0.5) b7.push('器の 中身が よこに はみ出した（' + appEl.scrollWidth + '＞' + appEl.clientWidth + '）');
    if (appEl.scrollHeight > appEl.clientHeight + 0.5) b7.push('器の 中身が たてに はみ出した（' + appEl.scrollHeight + '＞' + appEl.clientHeight + '）');
    if (de.scrollHeight > window.innerHeight + 0.5) b7.push('たてに すべる（' + de.scrollHeight + '）');
    if (getComputedStyle(tb).position !== 'sticky') b7.push('帯が sticky で ない');
    for (var pe = tb.parentElement; pe && pe !== document.body; pe = pe.parentElement) {
      var cs7 = getComputedStyle(pe);
      if (cs7.overflowX !== 'visible' || cs7.overflowY !== 'visible') b7.push('帯の 親に overflow（' + (pe.id || pe.className) + '）');
    }
    var tr7 = tb.getBoundingClientRect(), st7 = $('stage').getBoundingClientRect(), lr7 = $('logRow').getBoundingClientRect();
    if (tr7.top < -0.5) b7.push('帯が 画面の 上に 出た');
    function over(a, b) { return Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0.5 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0.5; }
    if (over(tr7, st7)) b7.push('帯と 盤が 重なった');
    if (over(lr7, st7)) b7.push('ハッピーと 盤が 重なった');
    if (over(tr7, lr7)) b7.push('帯と ハッピーが 重なった');
    /* ★ T321（アト）：★はじめの 画面の 白い 箱が まん中の 箱から はみ出して いないか（★T320 の 320×568 で もぐって いた）*/
    var ts7 = $('titleScreen');
    if (vis(ts7)) {
      var tsr = ts7.getBoundingClientRect();
      if (tsr.right > st7.right + 0.5 || tsr.left < st7.left - 0.5 || tsr.bottom > st7.bottom + 0.5) b7.push('★はじめの 箱が まん中の 箱から はみ出した（' + Math.round(tsr.width) + '＞' + Math.round(st7.width) + '）');
      if (over(tsr, lr7)) b7.push('★はじめの 箱と ハッピーが 重なった');
    }
    if (st7.bottom > window.innerHeight + 0.5 || st7.right > window.innerWidth + 0.5) b7.push('盤の 箱が 画面から 出た');
    var bn = $('brandName');
    if (bn && lineCount(bn) > 1) b7.push('題が 折れた');
    if (bn && bn.scrollWidth > bn.clientWidth + 0.5) b7.push('題が 切れた');
    put('⑦', b7);

    /* ⑧ 家へ 帰る道 */
    var b8 = [], q8 = $('btnQuit'), yame = 0;
    if (!q8 || q8.textContent.replace(/\s+/g, '') !== '◀ゲームを選ぶ') b8.push('結果の 箱の 字が ちがう');
    if (!q8 || q8.getAttribute('href') !== '../') b8.push('家への 道が ちがう');
    if ($('btnBack').getAttribute('href') !== '../') b8.push('帯の ◀ の 道が ちがう');
    (function walk(nd) {
      if (nd.nodeType === 3) { if (nd.nodeValue.indexOf('やめる') >= 0) yame++; return; }
      if (nd.nodeType !== 1) return;
      var tg = nd.tagName.toLowerCase(); if (tg === 'script' || tg === 'style') return;
      for (var i8 = 0; i8 < nd.childNodes.length; i8++) walk(nd.childNodes[i8]);
    })(document.body);
    if (yame) b8.push('「やめる」の 字が ' + yame + 'か所（★追記⑩ ④ ―― ★この 本は「新しく 配る」）');
    put('⑧', b8);

    /* ⑨ 名前（★「上海」を 使わない）*/
    var b9 = [], whole = document.documentElement.outerHTML + ' ' + document.title;
    ['上海', 'シャンハイ', 'Shanghai', 'SHANGHAI'].forEach(function (w9) { if (whole.indexOf(w9) >= 0) b9.push('「' + w9 + '」の 字が ある'); });
    put('⑨', b9);

    /* ⑩ 題 */
    var b10 = [], h1s = document.querySelectorAll('h1'), cano = document.querySelector('link[rel="canonical"]'), ogu = document.querySelector('meta[property="og:url"]');
    if (h1s.length !== 1) b10.push('h1 が ' + h1s.length + '個');
    else if (h1s[0].textContent.trim() !== ($('brandName').textContent || '').trim()) b10.push('h1 と 帯の 題が ちがう');
    if (($('brandName').textContent || '').trim() !== '四川省') b10.push('帯の 題が「' + $('brandName').textContent + '」');
    if (!cano || !ogu || cano.getAttribute('href') !== ogu.getAttribute('content')) b10.push('canonical と og:url が ちがう');
    else if (cano.getAttribute('href') !== 'https://bragekobo.com/shisensho/') b10.push('canonical が ' + cano.getAttribute('href'));
    if (document.title.indexOf('四川省') !== 0) b10.push('title が「' + document.title + '」');
    var desc = document.querySelector('meta[name="description"]');
    if (!desc || desc.getAttribute('content').indexOf('二角取り') < 0) b10.push('説明文に「二角取り」が 無い');
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

    /* ⑫ 牌の 絵（★アトの 部品）*/
    var b12 = [];
    if (!MJ || !MJ.tile || !MJ.install) b12.push('★アトの 部品（window.MJ）が 無い');
    else {
      var sp = document.getElementById('mj-sprite');
      if (!sp) b12.push('部品の symbol が 置かれて いない');
      else if (sp.querySelectorAll('symbol').length !== 35) b12.push('symbol が ' + sp.querySelectorAll('symbol').length + '個（正は 34種類＋裏 ＝ 35）');
      if (CODES.length !== 34) b12.push('種類が ' + CODES.length);
      if (G) {
        var wrong = 0;
        for (var key12 in tileEl) {
          if (!tileEl.hasOwnProperty(key12)) continue;
          var k12 = G.grid[+key12], u12 = tileEl[key12].querySelector('use');
          if (k12 < 0) continue;
          if (!u12 || u12.getAttribute('href') !== '#mj-' + CODES[k12]) wrong++;
        }
        if (wrong) b12.push('絵と 中身が ちがう 牌 ' + wrong + '枚');
      }
    }
    put('⑫', b12);

    /* ⑬ 箱 */
    var b13 = [], rw = $('resultWrap');
    if (!rw.classList.contains('hidden')) {
      var mainB = $('btnMain'), act = mainB.dataset.act, stopKind = $('resultTitle').classList.contains('is-stop');
      if (stopKind && act !== 'undo') b13.push('止まった のに 主役が「もどす」で ない');
      if (!stopKind && act !== 'new') b13.push('勝った のに 主役が「新しく 配る」で ない');
      var mh = mainB.getBoundingClientRect().height;
      ['btnSub', 'btnQuit'].forEach(function (id) { var e13 = $(id); if (vis(e13) && e13.getBoundingClientRect().height > mh + 0.5) b13.push(id + ' が 主役より 大きい'); });
      var bx = $('resultBox');
      if (bx.scrollHeight > bx.clientHeight + 0.5) b13.push('箱の 中身が 切れた（' + bx.scrollHeight + '＞' + bx.clientHeight + '）');
    }
    put('⑬', b13, rw.classList.contains('hidden') ? '箱なし' : '');

    /* ⑭ 記録 */
    var b14 = [];
    [[192000, '3分12秒'], [42000, '42秒'], [3725000, '1時間2分5秒'], [59999, '59秒']].forEach(function (tc) { if (window.SHISEN.fmt(tc[0]) !== tc[1]) b14.push(tc[0] + 'ms → ' + window.SHISEN.fmt(tc[0])); });
    put('⑭', b14);

    /* ⑮ 2連打の 止め（★箱を 閉じた 直後の 指が 帯の ボタンに 届かない）*/
    var b15 = [], keepG = guardUntil, fired = 0, tgt = $('btnHowto');
    function spy() { fired++; }
    tgt.addEventListener('click', spy);
    guardUntil = performance.now() + 5000;
    var ev = new MouseEvent('click', { bubbles: true, cancelable: true });
    var dlgOpen = hd.open;
    tgt.dispatchEvent(ev);
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
    /* ★ 閉じた 箱（遊び方・結果）の 字も 数える ―― ★innerText は 見えない 字を 飛ばす ので textContent で */
    var b16 = [], txt = '';
    (function walk(nd) {
      if (nd.nodeType === 3) { txt += nd.nodeValue; return; }
      if (nd.nodeType !== 1) return;
      var tg = nd.tagName.toLowerCase(); if (tg === 'script' || tg === 'style') return;
      for (var i = 0; i < nd.childNodes.length; i++) walk(nd.childNodes[i]);
    })(document.body);
    txt += ' ' + document.title + ' ' + ((document.querySelector('meta[name="description"]') || {}).content || '');
    for (var i16 = 0; i16 < BANNED.length; i16++) if (txt.indexOf(BANNED[i16]) >= 0) b16.push('「' + BANNED[i16] + '」の 字が ある');
    Object.keys(LINES).forEach(function (k16) { for (var j = 0; j < BANNED.length; j++) if (LINES[k16].indexOf(BANNED[j]) >= 0) b16.push('ハッピーの「' + k16 + '」に「' + BANNED[j] + '」'); });
    put('⑯', b16);

    /* ⑰ かぶり（★T323 トライの 見つけ・T323 の 直し アト）
       ★ 牌が ★詰みや 勝ちの 箱の 幕の 上・★大きく 見せる 牌の 上に 描かれて いないか。
       ★ 牌も 大きく 見せる 牌も ふだんは 指を 通す（pointer-events:none）ので ★elementFromPoint が 素通り して 気づけない
         → ★数える 間だけ 指を 受ける 形に して「★その 点で いちばん 上に ある もの」を 本当に 聞く（★computed style では 決めない）。 */
    var b17 = [], ov17 = document.createElement('style'), onB17 = function (e) { return !!(e && boardIn && boardIn.contains(e)); };
    ov17.textContent = '.tile,.tile *,.lens,.lens *{pointer-events:auto!important}';
    var keepPress = press, keepLU = TUNE.LENS_UNDER, lensN = 0;
    try {
      document.head.appendChild(ov17);
      var rw17 = $('resultWrap');
      if (boardIn && playing && !rw17.classList.contains('hidden')) {
        var bb17 = boardIn.getBoundingClientRect(), bad17 = 0, n17 = 0;
        for (var y17 = 0; y17 <= 24; y17++) for (var x17 = 0; x17 <= 24; x17++) {
          var px17 = Math.min(window.innerWidth - 1, Math.max(0, bb17.left + bb17.width * x17 / 24));
          var py17 = Math.min(window.innerHeight - 1, Math.max(0, bb17.top + bb17.height * y17 / 24));
          n17++; if (onB17(document.elementFromPoint(px17, py17))) bad17++;
        }
        if (bad17) b17.push('★箱の 幕の 上に 牌が 出て いる（' + bad17 + '/' + n17 + '点）');
      }
      if (boardIn && playing && G && lensEl && MJ && rw17.classList.contains('hidden') && !hd.open) {
        /* ★ 残って いる 牌 ぜんぶ で、★その 牌を おさえた ときの 大きく 見せる 牌を 本当に 出して 数える（★画面の 大きさに よらず 出す）*/
        TUNE.LENS_UNDER = 1e9;
        var lensBad = 0, worst17 = 0;
        for (var key17 in tileEl) {
          if (!tileEl.hasOwnProperty(key17) || G.grid[+key17] < 0) continue;
          press = { touch: true, p: +key17 }; updateLens(); lensN++;
          var lr17 = lensEl.getBoundingClientRect(), hid = 0, all17 = 0;
          for (var yl = 1; yl <= 5; yl++) for (var xl = 1; xl <= 5; xl++) {
            var e17 = document.elementFromPoint(lr17.left + lr17.width * xl / 6, lr17.top + lr17.height * yl / 6);
            all17++; if (!(e17 && (e17 === lensEl || lensEl.contains(e17)))) hid++;
          }
          if (hid) { lensBad++; if (hid / all17 > worst17) worst17 = hid / all17; }
        }
        if (lensBad) b17.push('★大きく 見せる 牌が かくれる ' + lensBad + '/' + lensN + 'か所（いちばん 悪い 所 ' + Math.round(worst17 * 100) + '%）');
      }
    } finally {
      press = keepPress; TUNE.LENS_UNDER = keepLU; hideLens();
      if (ov17.parentNode) ov17.parentNode.removeChild(ov17);
    }
    put('⑰', b17, lensN ? '大きく 見せる 牌 ' + lensN + 'か所' : '');

    var out = { '★NG': ng.length, '中身': ng.length ? ng : 'ぜんぶ OK ✅', '画面': window.innerWidth + '×' + window.innerHeight, 'かかった': (Date.now() - t0) + 'ms' };
    for (var kk in note) if (note.hasOwnProperty(kk)) out[kk] = note[kk];
    return out;
  }

  /* ============================================================
     ★ たしかめ用の 窓口（window.SHISEN）― ★画面には 1つも 出さない
     ============================================================ */
  function median(a) { if (!a.length) return 0; var b = a.slice().sort(function (x, y) { return x - y; }); return b[b.length >> 1]; }
  window.SHISEN = {
    now: function () {
      if (!G) return { 場面: 'はじめの 画面', 配りの数: DEAL_LIST.length, いちばん速い: loadBest() ? fmtTime(loadBest()) : 'なし' };
      return {
        配りの番号: G.seed, 残り: G.left + '枚', 消した組: G.hist.length, 止まった: isStuck(G), 勝ち: isWin(G),
        えらんだ牌: sel >= 0 ? CODES[G.grid[sel]] : 'なし', 時間: fmtTime(clkMs()),
        牌: geo.tw + '×' + geo.th.toFixed(1) + 'px', マス: geo.cw.toFixed(1) + '×' + geo.ch.toFixed(1), 向き: geo.rot ? 'たて' : 'よこ', ハッピー: geo.mode === 'side' ? '右' : '下'
      };
    },
    verify: verify,
    lines: LINES,
    fmt: fmtTime,
    geo: function () { return geo; },
    deals: function () { return { 大きさ: sizeKey(), 数: DEAL_LIST.length, 先頭10: DEAL_LIST.slice(0, 10) }; },
    seed: function (sd) {
      if (sd == null) return G ? G.seed : null;
      cancelAll();
      G = makeDeal(sd >>> 0); half = false; lastClear = null;
      showBoard(); clkReset(); clkResume();
      say(line('deal'));
      return G.seed;
    },
    /* ★ 牌の 場所（★画面の 座標）―― ★本物の 指で 押す 道具が 使う */
    where: function (p) {
      if (!G || !tileEl[p]) return null;
      var r0 = tileEl[p].getBoundingClientRect();
      return { x: r0.left + r0.width / 2, y: r0.top + r0.height / 2, w: r0.width, h: r0.height, k: G.grid[p] >= 0 ? CODES[G.grid[p]] : null };
    },
    /* ★ 次に 消せる 組（★たしかめる 道具 だけが 使う。★画面には 出さない）*/
    pairs: function () { return G ? legalPairs(G, false) : []; },
    solveNow: function () { if (!G) return null; var r = solve(G, { ms: 4000, nodes: 300000 }); return { ok: r.ok, 手: r.ok ? r.moves : null, ms: r.ms }; },
    sel: function () { return sel; },
    /* ★ 勝つ 直前（★場に あと left枚）を 出す ―― ★本物の 配りの 勝ち筋を 途中まで 流しこむ */
    nearWin: function (left) {
      left = left == null ? 2 : left;
      var sd = DEAL_LIST[0] || 1, r = solve(makeDeal(sd), { ms: 4000, nodes: 300000 });
      if (!r.ok) return { だめ: '解けなかった' };
      cancelAll();
      G = makeDeal(sd); half = true; lastClear = null;
      for (var i = 0; i < r.moves.length && G.left > left; i++) applyMove(G, r.moves[i]);
      showBoard(); clkReset(); clkResume();
      return { 配りの番号: sd, 残り: G.left, のこりの手: r.moves.slice(G.hist.length) };
    },
    /* ★ 本当に 1組も ない 場面（★先を読まない 打ち方で 実際に 詰んだ 試合を そのまま）*/
    stuckDemo: function () {
      for (var i = 0; i < DEAL_LIST.length && i < 200; i++) {
        var t = makeDeal(DEAL_LIST[i]);
        while (!isWin(t)) { var m = legalPairs(t, true); if (!m.length) break; applyMove(t, m[0]); }
        if (!isStuck(t)) continue;
        cancelAll();
        G = makeDeal(DEAL_LIST[i]); half = true; lastClear = null;
        var last = null;
        while (!isWin(G)) { var m2 = legalPairs(G, true); if (!m2.length) break; last = m2[0]; applyMove(G, m2[0]); }
        showBoard(); clkReset();
        G.over = true;
        showResult('stop');
        return { 配りの番号: G.seed, 残り: G.left, もどせる: G.hist.length };
      }
      return { だめ: '詰む 配りが 見つからない' };
    },
    autoPlay: function (n) {
      n = n || 100;
      var st = 0, w = 0, mv = [], t0 = Date.now();
      for (var i = 0; i < n; i++) {
        var r = playOne(DEAL_LIST.length ? DEAL_LIST[i % DEAL_LIST.length] : i + 1);
        if (r.stuck) st++; if (r.won) w++; mv.push(r.moves);
      }
      return { 試合: n, '先を読まない 打ち方で 止まった': st + '（' + (st / n * 100).toFixed(1) + '%）', 勝ち: w, '消した組（中央値）': median(mv), 時間: (Date.now() - t0) + 'ms' };
    },
    /* ★ 写真 用：時計を 進める（★本物の 時間を 待たずに「3分12秒」の 箱を 撮る ため。★遊びには 使わない）*/
    _clockAdd: function (ms) { clk.acc += ms; return fmtTime(clkMs()); },
    /* ★ 見張りを わざと 壊す 試し 用：2連打の 止めを 外す（★⑮ が 鳴くか）*/
    _noGuard: function () { window.removeEventListener('pointerdown', guardEv, true); window.removeEventListener('click', guardEv, true); return 1; },
    core: CORE
  };


})(typeof globalThis !== 'undefined' ? globalThis : this);
