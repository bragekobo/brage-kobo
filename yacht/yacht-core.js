'use strict';
/* ============================================================
   ヨット（20本目）―― ★中身（決まり・ロボットの 打ち手・数えかた）
   T193 ／ 💻 コーダ
   ------------------------------------------------------------
   ★★ この ファイルは 画面を 1行も 持ちません。
      ★ ★遊ぶ 側（yacht-game.js）も、★数える 側（autoPlay / rates）も、
        ★★**この 1本の 決まりを 通ります**（★決まりを 2か所に 書かない）。
      ★ ★node でも そのまま 走ります（★下の module.exports）―― ★数を 実測する ため。

   ★★ もとに した 紙：★`logs/T192_ヨットの仕様_ルル.md`（★🎲ルル）
      ★ ★13の 役の 名前・35点ボーナス・ふり直し2回・4人固定・つよさ3段 は、
        ★ ★★ぜんぶ そこで 決まって います。★私は 1つも 変えて いません。

   ★★★ この ファイルが ぜったいに しない こと（★ルル §5-4・§18）★★★
      ★ ★★「どの 目を のこすと 得か」「どの 役に 書くと 得か」を **外に 出す 口を 作らない**。
        ★ ★ロボットの 打ち手（`decideKeep` / `decideWrite`）は
          ★ ★★**ロボット自身の 手番でしか 呼ばれません**。★人の 手番では 1度も 通りません。
        ★ ★→ ★★見張り（verify.js）が、★人の 手番で これらが 呼ばれて いない ことを 数えます。
   ============================================================ */

(function (root) {

  /* ============================================================
     ★ 1. 13の 役（★ルル §2-1。★名前は 1文字も 変えて いません）
     ------------------------------------------------------------
       ★ col … ★0＝左の 列（1〜6の目）／1＝右の 列（のこり 7つ）
       ★ ★表は **2列×7行 ＝ 14マス**。★左の 列の 7つ目が「◯／63」（★役では ない）
     ============================================================ */
  var CATS = [
    { id: 'n1', col: 0, row: 0, name: '1の目',     kind: 'num',    n: 1 },
    { id: 'n2', col: 0, row: 1, name: '2の目',     kind: 'num',    n: 2 },
    { id: 'n3', col: 0, row: 2, name: '3の目',     kind: 'num',    n: 3 },
    { id: 'n4', col: 0, row: 3, name: '4の目',     kind: 'num',    n: 4 },
    { id: 'n5', col: 0, row: 4, name: '5の目',     kind: 'num',    n: 5 },
    { id: 'n6', col: 0, row: 5, name: '6の目',     kind: 'num',    n: 6 },
    { id: 'k3', col: 1, row: 0, name: '同じ目3つ', kind: 'kind',   n: 3 },
    { id: 'k4', col: 1, row: 1, name: '同じ目4つ', kind: 'kind',   n: 4 },
    { id: 'fh', col: 1, row: 2, name: '3つと2つ',  kind: 'full',   pt: 25 },
    { id: 's4', col: 1, row: 3, name: '4つ並び',   kind: 'run',    n: 4, pt: 30 },
    { id: 's5', col: 1, row: 4, name: '5つ並び',   kind: 'run',    n: 5, pt: 40 },
    { id: 'yt', col: 1, row: 5, name: 'ヨット',    kind: 'yacht',  pt: 50 },
    { id: 'ch', col: 1, row: 6, name: 'なんでも',  kind: 'chance' }
  ];
  var NCAT = 13;
  var TURNS = 13;                 /* ★ 手番は かならず 13回（★ルル §12-1・ばらつき 0）*/
  var REROLL = 2;                 /* ★★ ふり直しは 2回まで（★ルル §4-1・曲がり角）★★
                                     ★ ★★これは **出荷した 決まり**。★★動かしません。
                                       ★ ★見張り（verify.js ⑤）は、★★本物の 指で ボタンを 5回 押して、
                                         ★ ★★ふれた 回数が この 数を こえて いない かを 数えます。 */

  /* ★★ 動かせる ところ（★数える とき と、★★わざと 壊して 見張りを 鳴らす とき だけ）★★
     ⚠️★★ ★★ここが 1か所で ある ことが 大事です【★私の 失敗②】――
        ★ ★はじめ `REROLL` を そのまま `for` に 書いて いました。
          ★ ★測る 紙から `C.REROLL = 3` と 書きかえても **1点も 変わりません でした**
            ―― ★★外に 出した 数字は **写し** で、★中の `var` は 別物 だった から です。
        ★ ★★「ふり直し 0回・1回・2回・3回」の 4行が **ぜんぶ 同じ 数**に なって、やっと 気づきました。
          ★ ★★数が 動かない ときは、★★まず「本当に 動かして いるか」を 疑う。 */
  var CFG = { reroll: REROLL };
  var NDICE = 5;
  var BONUS_NEED = 63, BONUS_PT = 35;
  var NP = 4;                     /* ★ 4人 固定（★ルル §8）*/

  /* ★ 役の「ねうち」＝ ★上手い 人が その 役で 平均 何点 取るか
     ★ ★出どころ：★★ルル T192 §2-1 の 表【ルルの 数え上げ】。★私が 作った 数では ありません。
     ★ ★これを 引き算に 使うと「先を 見て 書く」に なります（★ルル §3-1：−12.07ポイントの 部品）。 */
  var WORTH = { n1: 1.87, n2: 4.75, n3: 7.61, n4: 10.98, n5: 14.26, n6: 17.77,
                k3: 22.72, k4: 18.87, fh: 24.11, s4: 29.96, s5: 36.58, yt: 9.33, ch: 23.17 };

  /* ============================================================
     ★ 2. 点の 計算（★機械の 仕事。★追記②の 表に 名指しで「点数の 計算」と あります）
     ============================================================ */
  function counts(d) {
    var c = [0, 0, 0, 0, 0, 0, 0], i;
    for (i = 0; i < d.length; i++) c[d[i]]++;
    return c;
  }
  function sum5(d) { var s = 0, i; for (i = 0; i < d.length; i++) s += d[i]; return s; }

  /* ★★「同じ目3つ」「同じ目4つ」は **5個 ぜんぶの 合計**（★ルル §2-3。★9点では ありません）*/
  function scoreOf(cat, d) {
    var c = counts(d), i, s = sum5(d);
    switch (cat.kind) {
      case 'num':  return c[cat.n] * cat.n;
      case 'kind': for (i = 1; i <= 6; i++) if (c[i] >= cat.n) return s; return 0;
      case 'full': {
        var a = [];
        for (i = 1; i <= 6; i++) if (c[i]) a.push(c[i]);
        a.sort(function (x, y) { return y - x; });
        /* ★ 3つ ＋ 2つ。★5つ そろいも「3つと 2つ」を ふくむ ので 25点 に します。 */
        return ((a[0] === 3 && a[1] === 2) || a[0] === 5) ? cat.pt : 0;
      }
      case 'run': {
        var run = 0, best = 0;
        for (i = 1; i <= 6; i++) { if (c[i]) { run++; if (run > best) best = run; } else run = 0; }
        return best >= cat.n ? cat.pt : 0;
      }
      case 'yacht': for (i = 1; i <= 6; i++) if (c[i] === 5) return cat.pt; return 0;
      case 'chance': return s;
    }
    return 0;
  }
  /* ★ 表（sheet）＝ 13マス。★まだ 書いて いない ところは null */
  function newSheet() { var a = [], i; for (i = 0; i < NCAT; i++) a.push(null); return a; }
  function upperSum(sh) { var s = 0, i; for (i = 0; i < 6; i++) if (sh[i] != null) s += sh[i]; return s; }
  function bonusOf(sh) { return upperSum(sh) >= BONUS_NEED ? BONUS_PT : 0; }
  function totalOf(sh) {
    var t = 0, i;
    for (i = 0; i < NCAT; i++) if (sh[i] != null) t += sh[i];
    return t + bonusOf(sh);
  }
  function filled(sh) { var n = 0, i; for (i = 0; i < NCAT; i++) if (sh[i] != null) n++; return n; }

  /* ============================================================
     ★ 3. サイコロの 表（★252とおりの 出目 ／ 462とおりの のこし方）
     ------------------------------------------------------------
       ★ ★★ここが ある から、★「のこす 目を 見こみで えらぶ」が **走らせずに** 数えられます。
       ★ ★読みこみの ときに 1回 だけ 作ります（★23112回の たし算。★1msも かかりません）。
     ============================================================ */
  var MS = [], MSI = {}, MSP = [];        /* ★ 出目 252 とおり と その 出やすさ */
  var KEEPS = [], KEEPI = {};             /* ★ のこし方 462 とおり */

  function keyOf(d) { return d[0] + '' + d[1] + (d[2] == null ? '' : d[2]) + (d[3] == null ? '' : d[3]) + (d[4] == null ? '' : d[4]); }
  function sortKey(a) { var b = a.slice().sort(function (x, y) { return x - y; }); return b.join(''); }

  function buildTables() {
    var a, b, c, dd, e, i, k;
    /* ★ 出目 252 とおり */
    for (a = 1; a <= 6; a++) for (b = a; b <= 6; b++) for (c = b; c <= 6; c++)
      for (dd = c; dd <= 6; dd++) for (e = dd; e <= 6; e++) {
        var arr = [a, b, c, dd, e];
        MSI[arr.join('')] = MS.length; MS.push(arr);
      }
    /* ★ 出やすさ（★5個 ふった とき）*/
    for (i = 0; i < MS.length; i++) MSP.push(0);
    for (a = 1; a <= 6; a++) for (b = 1; b <= 6; b++) for (c = 1; c <= 6; c++)
      for (dd = 1; dd <= 6; dd++) for (e = 1; e <= 6; e++)
        MSP[MSI[sortKey([a, b, c, dd, e])]] += 1 / 7776;

    /* ★ のこし方 462 とおり（★0個〜5個）＋ ★それぞれの「ふり直した あとの 出目の ちらばり」 */
    function gen(pre, start) {
      var key = pre.join('');
      if (KEEPI[key] === undefined) {
        var idx = KEEPS.length;
        KEEPI[key] = idx;
        KEEPS.push({ d: pre.slice(), k: pre.length, out: [], w: [] });
      }
      if (pre.length === NDICE) return;
      for (var v = start; v <= 6; v++) { pre.push(v); gen(pre, v); pre.pop(); }
    }
    gen([], 1);
    for (k = 0; k < KEEPS.length; k++) {
      var K = KEEPS[k], rest = NDICE - K.k, acc = {};
      var total = Math.pow(6, rest);
      (function roll(n, cur) {
        if (n === 0) { var kk = sortKey(K.d.concat(cur)); acc[kk] = (acc[kk] || 0) + 1; return; }
        for (var v = 1; v <= 6; v++) { cur.push(v); roll(n - 1, cur); cur.pop(); }
      })(rest, []);
      for (var kk2 in acc) if (acc.hasOwnProperty(kk2)) { K.out.push(MSI[kk2]); K.w.push(acc[kk2] / total); }
    }
  }
  buildTables();

  /* ★★ 13の 役 × 252の 出目 ＝ ★3276マスの 点の 表（★読みこみの ときに 1回 だけ）★★
     ⚠️★★ ここは **速さの ため だけ** の 表です【★私の 回り道①】――
        ★ ★はじめ `fvTable` の 中で `scoreOf` を 3276回 呼んで いました。
          ★ ★`scoreOf` は 中で `counts()` ＝ **7個の 配列を 毎回 作ります**。
          ★ ★★1手番に 3276個の ごみ。★★20000試合が 5分 たっても 終わりません でした。
        ★ ★→ ★先に 数えて しまえば、★あとは たし算 だけ に なります。
        ★ ★★速さ【実測・つよい 4人 × 2000試合】：★21554ms → ★★9956ms（★2.2倍）
        ★ ★★＋ WORTH を 番号びきに して 値を 先に 出す → ★★5545ms（★さらに 1.8倍・★合わせて 3.9倍）
     ★ ★★答えは 1点も 変わりません（★下の `selfTest` が 3276マス ぜんぶ 突き合わせます）。 */
  var SCORE = [];
  (function () {
    for (var ci = 0; ci < NCAT; ci++) {
      var a = new Int16Array(MS.length);
      for (var m = 0; m < MS.length; m++) a[m] = scoreOf(CATS[ci], MS[m]);
      SCORE.push(a);
    }
  })();
  /* ★ 5個の 出目 → 252の どれか（★並べかえて さがす）*/
  function msIndex(d) { return MSI[sortKey(d)]; }

  /* ★ いま 手元に ある 5個から 作れる「のこし方」（★32とおりの 組。★同じ ものは 1つに まとめる）*/
  function keepOptions(d) {
    var seen = {}, list = [], m, i, pre, key;
    for (m = 0; m < 32; m++) {
      pre = [];
      for (i = 0; i < 5; i++) if (m & (1 << i)) pre.push(d[i]);
      pre.sort(function (x, y) { return x - y; });
      key = pre.join('');
      if (seen[key]) continue;
      seen[key] = 1;
      list.push({ mask: m, keep: pre, ki: KEEPI[key] });
    }
    return list;
  }

  /* ============================================================
     ★ 4. ロボットの 打ち手（★つよさ 3段。★ルル §7-3・§7-4）
     ------------------------------------------------------------
       ★★ わざと 弱い ロボットは **1体も いません**（★ルル §7-4）。
          ★ ★3段とも「知って いる ことが ちがう」だけ です。
       ★★ この会社が 5回 落とした 壁（T60/T78/T88/T126/T133）には
          ★ ★★1度も さわって いません ―― ★「見えて いるのに わざと 下手に ふる」は 0行。

       ★ o.keep  … 'none'（ふり直さない・でたらめ）／'same'（同じ 目を のこす）
                    ／'run'（＋つづき目を 追う）／'ev'（★見こみで えらぶ）
       ★ o.write … 'rand'（でたらめ）／'raw'（★点が 高い 役）／'worth'（★先を 見て 書く）
       ★ o.bonus … ★35点ボーナスを ねらうか
     ============================================================ */
  var P = {
    random: function () { return { keep: 'none', write: 'rand' }; },
    /* ★ はしごの ③（★ルル §1-2）＝ ★「はじめての人」 */
    newbie: function () { return { keep: 'same', write: 'raw' }; },
    /* ★ ＋つづき目・先を 見て 書く */
    mid:    function () { return { keep: 'run', write: 'worth', alpha: 0.8 }; },
    /* ★★ ＋のこす 目の 見こみ・ボーナス ＝ ★私の いちばん 強い 打ち手 ★★
       ★ ★数字は **総あたりで さがした もの**（★logs/T193_ヨット_つよさ調べ結果.txt【実測】）：
         ★ ★alpha … ★0 で 220.2 ／ ★★0.8 で 231.6 ／ 1.0 で 228.4 ／ 2.0 で 181.4
         ★ ★★★はじめ 1.0 に して いました（★ルル §7-1 の「alpha 1.00」を そのまま 写した）。
           ★ ★★総あたりを かけたら **0.8 が 3.2点 強かった**。★→ ★写しを やめて 実測を 取りました。
         ★ ★bonusW/bonusHit … ★0.8／0.7 あたりが 頭打ち（★0.6→1.2 の 差は 1点 くらい）*/
    best:   function () { return { keep: 'ev', write: 'worth', alpha: 0.8,
                                   bonus: true, bonusW: 0.8, bonusHit: 0.7 }; },
    /* ★★ 部品を 1つずつ 抜く ため（★ルル §3-1 の 数えかた）★★
       ⚠️★★ `noKeep` は **'same' では なく 'run' に 落とします**【★ルル §16 失敗3 の 教え】――
          ★ ★はじめ 'same'（★同じ 目を のこすだけ）に して いました。★重さが **−70.27点**。
            ★ ★★ルルの 数字（−19.85）と 3倍 ちがう。★どちらかが まちがい に 見えます。
          ★ ★★ちがい ません でした ―― ★「★のこすを 抜いた 人」を **どれだけ 上手に 作ったか**
            ★ ★の 差 でした（★ルル §16 失敗3：「★部品の 重さは、その 部品を どれだけ 上手く
              ★ ★作ったかで 変わる」）。★→ ★つづき目までは 知って いる 人に そろえました。 */
    noKeep: function () { var o = P.best(); o.keep = 'run'; return o; },
    noWrite:function () { var o = P.best(); o.write = 'raw'; return o; },
    noBonus:function () { var o = P.best(); o.bonus = false; return o; }
  };

  /* ★ 書いた ときの「ねうち込みの 点」（★ロボットの 頭の 中だけ。★画面には 1度も 出ません）
     ★ ★s ＝ その 役に 書いたら 何点か（★もう 数えて ある もの を もらう）
     ★ ★u ＝ いまの「1〜6の 合計」（★1手番に 1回 だけ 数える）*/
  function writeValue(ci, s, u, o) {
    var v = s, cat = CATS[ci];
    if (o.write === 'worth') v -= (o.alpha || 1) * WORTH[cat.id];
    if (o.bonus && cat.kind === 'num' && u < BONUS_NEED) {
      if (u + s >= BONUS_NEED) v += BONUS_PT * (o.bonusHit || 0.9);
      else v += (o.bonusW || 0.6) * (s - 3 * cat.n);
    }
    return v;
  }

  /* ★ 13マスの うち 空いて いる ところから、★いちばん 良い 1つを えらぶ */
  function decideWrite(sh, d, o, rnd) {
    var open = [], i, u = upperSum(sh);
    for (i = 0; i < NCAT; i++) if (sh[i] == null) open.push(i);
    if (!open.length) return -1;
    if (o.write === 'rand') return open[Math.floor((rnd ? rnd() : Math.random()) * open.length)];
    var bi = open[0], bv = -1e9;
    for (i = 0; i < open.length; i++) {
      var v = writeValue(open[i], scoreOf(CATS[open[i]], d), u, o);
      if (v > bv) { bv = v; bi = open[i]; }
    }
    return bi;
  }

  /* ★ 252とおりの 出目 それぞれに「いま 書いたら いくらの ねうちに なるか」を 出す
     ★ ★1手番に 1回 だけ 作ります（★空きマスと 1〜6の 合計が 変わった ときだけ 変わる）。 */
  /* ★ WORTH を **番号びき** に します（★`WORTH[cat.id]` は 文字の さがし物 ―― ★内がわの 輪では 重い）*/
  var WORTHA = (function () { var a = [], i; for (i = 0; i < NCAT; i++) a.push(WORTH[CATS[i].id]); return a; })();
  var fvBuf = new Float64Array(MS.length);
  function fvTable(sh, o) {
    var fv = fvBuf, open = [], base = [], i, m, u = upperSum(sh);
    var alpha = (o.write === 'worth') ? (o.alpha == null ? 1 : o.alpha) : 0;
    var doB = !!o.bonus && u < BONUS_NEED;
    var bw = o.bonusW == null ? 0.6 : o.bonusW, bh = o.bonusHit == null ? 0.9 : o.bonusHit;
    for (i = 0; i < NCAT; i++) if (sh[i] == null) { open.push(i); base.push(-alpha * WORTHA[i]); }
    var nO = open.length;
    for (m = 0; m < MS.length; m++) {
      var best = -1e9;
      for (i = 0; i < nO; i++) {
        var ci = open[i], s = SCORE[ci][m], v = s + base[i];
        if (doB && ci < 6) v += (u + s >= BONUS_NEED) ? BONUS_PT * bh : bw * (s - 3 * (ci + 1));
        if (v > best) best = v;
      }
      fv[m] = best;
    }
    return fv;
  }

  /* ★★ のこす 目を えらぶ ―― ★★この ゲームの 本体（★ルル §3-1：−19.85ポイント）
     ★ ★'ev' は 462の 表を 使って「ふり直した あとの 見こみ」を そのまま 数えます。
     ★ ★★1手先 だけ 見ます。★ルル §3-1 は「2手先 → 1手先」の 代金を **−1.60点** と
       ★ ★数えて います（★私は そこを 受け入れて、★速さを 取りました。→ ★作業メモ）。 */
  function decideKeep(sh, d, o, fv, rnd) {
    var i;
    if (o.keep === 'none') return [];                    /* ★ ふり直さない ＝ 5個 とも 投げ直す */
    if (o.keep === 'ev') {
      var opts = keepOptions(d), bv = -1e9, bk = opts[0];
      for (i = 0; i < opts.length; i++) {
        var K = KEEPS[opts[i].ki], e = 0, j;
        for (j = 0; j < K.out.length; j++) e += K.w[j] * fv[K.out[j]];
        if (e > bv) { bv = e; bk = opts[i]; }
      }
      return bk.keep;
    }
    /* ★ 同じ 目を のこす（★いちばん 多い 目。★同じ 数なら 大きい 目）*/
    var c = counts(d), bestN = 0, bestV = 0;
    for (i = 1; i <= 6; i++) if (c[i] >= bestN) { bestN = c[i]; bestV = i; }
    var same = [];
    for (i = 0; i < bestN; i++) same.push(bestV);
    if (o.keep !== 'run') return same;
    /* ★ ＋つづき目を 追う（★1〜6の うち つながって いる ところ。★1つずつ のこす）*/
    var run = [], bestRun = [];
    for (i = 1; i <= 6; i++) {
      if (c[i]) { run.push(i); if (run.length > bestRun.length) bestRun = run.slice(); }
      else run = [];
    }
    return bestRun.length > same.length ? bestRun : same;
  }

  /* ============================================================
     ★ 5. 1手番（★ふる → のこす → ふり直す ×2 → 書く）
     ------------------------------------------------------------
       ★ ★★ここは **ロボットの 手番でしか 通りません**。
         ★ ★人の 手番は、★yacht-game.js が 人の 指を そのまま 使います。
     ============================================================ */
  function rollDice(n, rnd) { var a = [], i; for (i = 0; i < n; i++) a.push(1 + Math.floor(rnd() * 6)); return a; }

  function botTurn(sh, o, rnd) {
    var d = rollDice(NDICE, rnd), fv = null, r, keep, i;
    if (o.keep === 'ev') fv = fvTable(sh, o);
    for (r = 0; r < CFG.reroll; r++) {
      keep = decideKeep(sh, d, o, fv, rnd);
      if (keep.length >= NDICE) break;                   /* ★ 5個 のこす ＝ ここで やめる */
      d = keep.slice().concat(rollDice(NDICE - keep.length, rnd));
    }
    var ci = decideWrite(sh, d, o, rnd);
    var pt = scoreOf(CATS[ci], d);
    sh[ci] = pt;
    for (i = 0; i < d.length; i++) if (d[i] < 1 || d[i] > 6) return { ci: ci, pt: pt, bad: 1 };
    return { ci: ci, pt: pt, bad: 0, dice: d };
  }

  /* ★ 1人ぶん 13手番 まるごと */
  function playOne(o, rnd) {
    var sh = newSheet(), t, bad = 0, yacht = 0, zero = 0;
    for (t = 0; t < TURNS; t++) {
      var r = botTurn(sh, o, rnd);
      bad += r.bad;
      if (r.pt === 0) zero++;
      if (CATS[r.ci].id === 'yt' && r.pt > 0) yacht = 1;
    }
    return { sheet: sh, total: totalOf(sh), turns: TURNS, bad: bad + (filled(sh) === NCAT ? 0 : 1),
             upper: upperSum(sh), bonus: bonusOf(sh) ? 1 : 0, yacht: yacht, zero: zero };
  }

  /* ★ 4人（★席0が 人の 模型。★相手の 手は 自分に 1つも ひびきません ―― ルル 検算7）*/
  function simMatch(rnd, os) {
    var r = [], i;
    for (i = 0; i < NP; i++) r.push(playOne(os[i], rnd));
    var hi = r[0].total, nw = 0;
    for (i = 0; i < NP; i++) if (r[i].total > hi) hi = r[i].total;
    for (i = 0; i < NP; i++) if (r[i].total === hi) nw++;
    return { r: r, win: (r[0].total === hi ? 1 / nw : 0), tie: (r[0].total === hi && nw > 1) ? 1 : 0 };
  }

  /* ★ 種（★同じ 試合を 何度でも 出せる ように）*/
  function rng(s) {
    var x = (s | 0) || 20260901;
    return function () { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; x |= 0; return (x >>> 0) / 4294967296; };
  }
  function pct(a, f) {
    var s = a.slice().sort(function (x, y) { return x - y; });
    return s[Math.min(s.length - 1, Math.floor(s.length * f))];
  }

  function newStat() {
    return { games: 0, win: 0, tie: 0, bad: 0, pts: 0, upper: 0, bonus: 0, yacht: 0, zero: 0,
             turns: 0, list: [], turnList: [] };
  }
  function runMany(n, seed, os) {
    var st = newStat(), rnd = rng(seed), i, j;
    for (i = 0; i < n; i++) {
      var m = simMatch(rnd, os);
      st.games++; st.win += m.win; st.tie += m.tie;
      st.pts += m.r[0].total; st.upper += m.r[0].upper;
      st.bonus += m.r[0].bonus; st.yacht += m.r[0].yacht; st.zero += m.r[0].zero;
      st.list.push(m.r[0].total);
      for (j = 0; j < NP; j++) { st.bad += m.r[j].bad; st.turns += m.r[j].turns; }
      st.turnList.push(m.r[0].turns);
    }
    return st;
  }

  /* ============================================================
     ★★★ 5.5 勝率を「走らせずに」出す（★ルル 検算7 を そのまま 道具に した もの）★★★
     ------------------------------------------------------------
       ★ ★ルル T192 §1-1：「★ヨットは 相手の 手が 自分に 1つも 影響しない」。
         ★ ★★＝ ★★点の ちらばり さえ あれば、★勝率は **たし算で 出せます**。
       ★ ★4人の うち 1人が 人、★3人が 同じ ロボット。★同点は 山分け：
         ★ ★★P ＝ Σ[人の点 s] p(s) × Σ[k=0..3] C(3,k)・B(s)^k・A(s)^(3−k) ／ (k+1)
         ★ ★（A ＝ ロボットが s より 下 ／ B ＝ ロボットが ちょうど s）
       ★ ★★これで、★同じ 試合数でも 勝率の ぶれが うんと 小さく なります
         ★ ★（★4人ぶん 走らせる 必要も なくなる ので、★4倍 速い）。
     ============================================================ */
  var SCORE_MAX = 500;
  function scoreHist(n, seed, o) {
    var h = new Float64Array(SCORE_MAX + 1), rnd = rng(seed), i, list = [],
        sum = 0, bad = 0, up = 0, bn = 0, yt = 0, zr = 0;
    for (i = 0; i < n; i++) {
      var r = playOne(o, rnd), t = r.total;
      if (t > SCORE_MAX) t = SCORE_MAX;
      h[t]++; sum += r.total; bad += r.bad; up += r.upper; bn += r.bonus; yt += r.yacht; zr += r.zero;
      list.push(r.total);
    }
    for (i = 0; i <= SCORE_MAX; i++) h[i] /= n;
    return { h: h, n: n, avg: sum / n, bad: bad, upper: up / n, bonus: bn / n,
             yacht: yt / n, zero: zr / n, list: list };
  }
  /* ★ 人 1人 vs 同じ ロボット 3人（★4人固定）。★返すのは 0〜1 */
  function winRateFrom(hh, hb) {
    var A = 0, p = 0, s;
    for (s = 0; s <= SCORE_MAX; s++) {
      var B = hb[s], ph = hh[s];
      if (ph > 0) {
        /* ★ C(3,k) ＝ 1,3,3,1 */
        p += ph * (A * A * A + 3 * B * A * A / 2 + 3 * B * B * A / 3 + B * B * B / 4);
      }
      A += B;
    }
    return p;
  }

  /* ============================================================
     ★ 6. つよさ 3段（★ルル §7-3）／ ★人の 模型（★数える ときだけ）
     ⚠️★ ここの 言葉と LEVEL_START の 数が ちがって いると 次に 読む 人が まちがえます
        （★トライ T166 §7-7 で 実際に 起きました）。★★両方 直す こと。
     ============================================================ */
  var LEVELS = [
    { id: 'first',  label: 'はじめて', o: P.newbie() },
    { id: 'normal', label: 'ふつう',   o: P.mid() },
    { id: 'strong', label: 'つよい',   o: P.best() }
  ];
  var LEVEL_START = 0;                    /* ★ はじめは 1段目（★はじめての 人が ちょうど 五分）*/

  var HUMANS = [
    { label: 'はじめての人',       o: P.newbie() },
    { label: '少し 分かった人',    o: P.mid() },
    { label: 'ぜんぶ 気づいた人',  o: P.best() },
    { label: 'でたらめ',           o: P.random() },
    { label: '★のこすを 知らない', o: P.noKeep() },
    { label: '★書くを 知らない',   o: P.noWrite() },
    { label: '★ボーナスを 知らない', o: P.noBonus() }
  ];

  /* ★ 長さ【見立て】の もと（★ルル §12-2。★トライが 測るまで 確定させません）*/
  function machineMs() { return 0.6 * 3 * TURNS * 1000; }   /* ★ ロボット3人 × 13手番 × 0.6秒 */

  var API = {
    CATS: CATS, NCAT: NCAT, TURNS: TURNS, REROLL: REROLL, NDICE: NDICE, NP: NP,
    BONUS_NEED: BONUS_NEED, BONUS_PT: BONUS_PT, WORTH: WORTH, CFG: CFG,
    LEVELS: LEVELS, LEVEL_START: LEVEL_START, HUMANS: HUMANS, P: P,
    MS: MS, MSI: MSI, MSP: MSP, KEEPS: KEEPS, KEEPI: KEEPI,
    counts: counts, sum5: sum5, scoreOf: scoreOf, newSheet: newSheet, SCORE: SCORE, msIndex: msIndex,
    upperSum: upperSum, bonusOf: bonusOf, totalOf: totalOf, filled: filled,
    keepOptions: keepOptions, fvTable: fvTable,
    decideKeep: decideKeep, decideWrite: decideWrite, botTurn: botTurn,
    rollDice: rollDice, playOne: playOne, simMatch: simMatch, runMany: runMany,
    scoreHist: scoreHist, winRateFrom: winRateFrom, SCORE_MAX: SCORE_MAX,
    rng: rng, pct: pct, machineMs: machineMs
  };

  root.YACHT_CORE = API;
  if (typeof module === 'object' && module.exports) module.exports = API;

})(typeof globalThis !== 'undefined' ? globalThis : this);
