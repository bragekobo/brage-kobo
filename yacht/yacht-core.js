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
      ★ ★役の 名前・35点ボーナス・ふり直し2回・つよさ3段 は、
        ★ ★★ぜんぶ そこで 決まって います。★私は 1つも 変えて いません。

   ★★★ この ファイルが ぜったいに しない こと（★ルル §5-4・§18）★★★
      ★ ★★「どの 目を のこすと 得か」「どの 役に 書くと 得か」を **外に 出す 口を 作らない**。
        ★ ★ロボットの 打ち手（`decideKeep` / `decideWrite`）は
          ★ ★★**ロボット自身の 手番でしか 呼ばれません**。★人の 手番では 1度も 通りません。
        ★ ★→ ★★見張り（verify.js）が、★人の 手番で これらが 呼ばれて いない ことを 数えます。
   ============================================================ */

(function (root) {

  /* ============================================================
     ★ 1. 12の 役（★T226・★社長の ご指摘 ②）
     ------------------------------------------------------------
       ★ col … ★0＝左の 列（1〜6の目）／1＝右の 列（のこり 6つ）
       ★ ★表は **2列×7行**。★左の 列の 7つ目が「◯／63」（★役では ない）／★右の 7つ目は 空き

       ★★★ T226 で 変わった ところ（★社長の お決め・2026-09-04）★★★
         ★ ①★★役の 名前を **正式名称**に しました（★社長の ご指摘②）。
           ★ ★なんでも→チョイス／同じ目4つ→フォーダイス／3つと2つ→フルハウス
             ★ ／4つ並び→S.ストレート／5つ並び→B.ストレート。★★点は 1つも 変えて いません。
           ★ ★★設計図 §9.6 の 例外リストに 足す ―― ★★ポーカーの 役10個と 同じ 裁定です。
         ★ ②★★`k3`（同じ目3つ ＝ スリーダイス）を **消しました**（★社長の お決め②）。
           ★ ★★本物の「ヨット」は 12役【ルル T225 §2・出典4件】。★★13役は ヤッツィーの ほう。
           ★ ★深さの 代金は **−0.15**（★ばらつき ±0.13 の きわ ＝ ★ルル T225 §9-2：誤差の 中）。
         ★ ③★★`desc` を 1行ずつ 足しました（★社長の ご指摘⑥）。
           ★ ★★画面の「役の 説明」は **この データから 作ります** ―― ★手書きの 表を 作らない
             ★ ★（★お手本：`office/games/poker-core.js:35〜44`）。
     ============================================================ */
  var CATS = [
    { id: 'n1', col: 0, row: 0, name: '1の目',       kind: 'num',   n: 1 },
    { id: 'n2', col: 0, row: 1, name: '2の目',       kind: 'num',   n: 2 },
    { id: 'n3', col: 0, row: 2, name: '3の目',       kind: 'num',   n: 3 },
    { id: 'n4', col: 0, row: 3, name: '4の目',       kind: 'num',   n: 4 },
    { id: 'n5', col: 0, row: 4, name: '5の目',       kind: 'num',   n: 5 },
    { id: 'n6', col: 0, row: 5, name: '6の目',       kind: 'num',   n: 6 },
    { id: 'ch', col: 1, row: 0, name: 'チョイス',    kind: 'chance',
      desc: 'サイコロ 5個の 目を ぜんぶ 足した 数', ptLabel: '合計' },
    { id: 'k4', col: 1, row: 1, name: 'フォーダイス', kind: 'kind',  n: 4,
      desc: '同じ 目が 4個 いじょう', ptLabel: '5個 ぜんぶの 合計' },
    { id: 'fh', col: 1, row: 2, name: 'フルハウス',  kind: 'full',   pt: 25,
      desc: '同じ 目が 3個と、べつの 同じ 目が 2個', ptLabel: '25点' },
    { id: 's4', col: 1, row: 3, name: 'S.ストレート', kind: 'run',   n: 4, pt: 30,
      desc: '目が 4個 つづく（2・3・4・5 など）', ptLabel: '30点' },
    { id: 's5', col: 1, row: 4, name: 'B.ストレート', kind: 'run',   n: 5, pt: 40,
      desc: '目が 5個 つづく（1〜5 か 2〜6）', ptLabel: '40点' },
    { id: 'yt', col: 1, row: 5, name: 'ヨット',       kind: 'yacht', pt: 50,
      desc: '5個 ぜんぶ 同じ 目', ptLabel: '50点' }
  ];
  var NCAT = CATS.length;         /* ★★ 12（★数を 手で 書かない ―― ★2か所に 書くと ずれます）*/
  var TURNS = NCAT;               /* ★ 手番は かならず 12回（★ばらつき 0）*/
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
  /* ★★ T226 ―― ★`bonusNeed` / `bonusPt` を ここに 足しました
     ★ ★理由：★★見張り ⑫（★63点で ＋35点・★★62点では 付かない）を、
       ★ ★★**わざと 壊して 鳴らせる ように する** ため（★型の ④）。
       ★ ★★`reroll` と まったく 同じ 置き方です ―― ★遊びの 中では 1度も 動きません。
     ⚠️★ ★ロボットの 打ち手（`writeValue` / `fvTable`）は **`BONUS_NEED` の まま**に して あります。
        ★ ★★あそこの 数字は「★ボーナスを どれくらい 追うか」の 手加減 なので、
          ★ ★決まりの 側を 壊した ときに いっしょに 動くと、★★何が 鳴ったのか 分からなく なります。 */
  var NDICE = 5;
  var BONUS_NEED = 63, BONUS_PT = 35;
  var CFG = { reroll: REROLL, bonusNeed: BONUS_NEED, bonusPt: BONUS_PT };
  /* ★★★ T226・★社長の ご指摘① ―― ★★1対1（★あなた と ロボット 1体）★★★
     ★ ★★これは ⑤（ロボットの ふり方を 見せる）の **代金を 払う ため**でも あります
       ★ ★【ルル T225 §7-4】：★1試合を 140秒 以内に 収めると すると ――
         ★ ★★2人 … ★ロボットの 手番は 12回。★1手番 **3,140ms** まで 使えます（★A案は 2,410ms）
         ★ ★★4人 … ★ロボットの 手番は 36回。★1手番 **1,048ms** しか なく、
           ★ ★★ふる 動きだけで 490×2.85 ＝ 1,394ms ―― ★★★どうしても 入りません。
       ★ ★★＝ ★①と ⑤は セット です。★★4人に 戻すと ⑤が 死にます。
     ★ ★代金【ルル T225 §4-2・計算 各40000試合】：★深さが 天井比 97.9% → 89.4%（−8.5）。
       ★ ★かわりに ★★はじめての人が 191試合に 1回 → **19試合に 1回** 勝てる ように なります。 */
  var NP = 2;

  /* ★ 役の「ねうち」＝ ★上手い 人が その 役で 平均 何点 取るか
     ★ ★出どころ：★★ルル T192 §2-1 の 表【ルルの 数え上げ】。★私が 作った 数では ありません。
     ★ ★これを 引き算に 使うと「先を 見て 書く」に なります（★ルル §3-1：−12.07ポイントの 部品）。 */
  /* ⚠️★★ `k3`（スリーダイス）の 22.72 は **消しました**（★T226・役ごと 無く なった ため）。
     ★ ★のこりの 12個は 1つも 動かして いません。 */
  var WORTH = { n1: 1.87, n2: 4.75, n3: 7.61, n4: 10.98, n5: 14.26, n6: 17.77,
                k4: 18.87, fh: 24.11, s4: 29.96, s5: 36.58, yt: 9.33, ch: 23.17 };

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
  /* ★ 表（sheet）＝ NCAT マス（★12）。★まだ 書いて いない ところは null */
  function newSheet() { var a = [], i; for (i = 0; i < NCAT; i++) a.push(null); return a; }
  function upperSum(sh) { var s = 0, i; for (i = 0; i < 6; i++) if (sh[i] != null) s += sh[i]; return s; }
  function bonusOf(sh) { return upperSum(sh) >= CFG.bonusNeed ? CFG.bonusPt : 0; }
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

  /* ★★ 12の 役 × 252の 出目 ＝ ★3024マスの 点の 表（★読みこみの ときに 1回 だけ）★★
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
    /* ⚠️★★★ T226 で 足した 1行 ―― ★★ここに 「ならび順で 答えが 変わる」わなが ありました ★★★
       ★ ★上の for は `d` を **並んで いる 順**に 読みます。★だから 同じ 5個でも
         ★ ★★置き場所が ちがうと、★★この list の 順番が 変わります。
       ★ ★`decideKeep` の 'ev' は `e > bv` で えらぶ ので、★★見こみが **ぴったり 同点**の とき
         ★ ★★先に 出た ほうが 勝ちます ―― ★★★＝ ならび順で 手が 変わって いました。
       ★ ★★【実測】★T226 で 私が botTurn の ふり直しを「場所を そのまま」に 直した とき、
         ★ ★48000手番の うち **138手番** が 前と ちがう 手に なりました（★0.29%）。
         ★ ★★中身を 見たら ぜんぶ 同点の えらび。★★どちらが 正しい でも ない ―― ★★★決まって いなかった。
       ★ ★→ ★★`ki`（★のこし方 462とおりの 通し番号）で そろえます。
         ★ ★★これで `d` の ならび順に よらず、★同点の ときは いつも 同じ 手を えらびます。
       ★ ★★代金【実測・T225 の 13役 の 中身で 各40000試合】：
         ★ ★はじめて 144.9096 → **144.9096**（★0.0000）／ふつう 192.6613 → **192.6613**（★0.0000）
         ★ ★★つよい 232.4211 → **232.4352**（★**＋0.0141**。★ばらつき ±0.13 の 中）*/
    list.sort(function (x, y) { return x.ki - y.ki; });
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

  /* ★ NCAT マスの うち 空いて いる ところから、★いちばん 良い 1つを えらぶ */
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

  /* ★★ 「のこす 目」（★値の ならび）を、★いま 手元に ある 5個の **どの 場所か** に 直す
     ★ ★同じ 目が 2個 ある ときは、★前から 1個ずつ 当てて いきます。 */
  function keepMask(d, keep) {
    var mask = [], used = keep.slice(), i, j;
    for (i = 0; i < d.length; i++) mask.push(false);
    for (j = 0; j < used.length; j++) {
      for (i = 0; i < d.length; i++) {
        if (!mask[i] && d[i] === used[j]) { mask[i] = true; break; }
      }
    }
    return mask;
  }

  /* ★★★ ロボットの 1手番 ★★★
     ------------------------------------------------------------
       ★ `trace` を 渡すと、★★1回ふる ごとに `{ dice, keep }` を 積みます
         ―― ★★これが 社長の ご指摘⑤（★ロボットの ふり方を 見せる）の 材料 です。
       ★★ ⚠️ `trace` は **見せる ため だけ**。★★打ち手は 1行も 変わりません
         ―― ★★`trace` を 渡しても 渡さなくても、★出る 点は **1点も 同じ**（★下の 数で 確かめました）。

     ⚠️★★★ T226 で 1つだけ 中を 直しました（★★見せる ために 必要 だった もの）★★★
       ★ ★もとは `d = keep.concat(rollDice(のこり))` ―― ★★のこした 目が **先頭へ 寄って** いました。
         ★ ★数える だけなら これで 良い（★点は ならび順を 見ない）。
         ★ ★★でも 画面に 出すと、★★のこした サイコロが 毎回 場所を 変えて 見えます。
       ★ ★→ ★★**場所を そのままに して、ふり直す ぶん だけ 上書き** します。
         ★ ★★ふる 回数も、★rnd() を 引く 回数も、★出る 目の 組み合わせも まったく 同じ
           ―― ★★点は ならび順を 見ない ので、★★数は 1つも 動きません
             ★（★`logs/T226_計測どうぐ/T226_基準.cjs` で 手を 入れる 前と 突き合わせました）。 */
  function botTurn(sh, o, rnd, trace) {
    var d = rollDice(NDICE, rnd), fv = null, r, keep, mask, i;
    if (o.keep === 'ev') fv = fvTable(sh, o);
    if (trace) trace.push({ dice: d.slice(), keep: [false, false, false, false, false] });
    for (r = 0; r < CFG.reroll; r++) {
      keep = decideKeep(sh, d, o, fv, rnd);
      mask = keepMask(d, keep);
      if (trace) trace[trace.length - 1].keep = mask.slice();
      if (keep.length >= NDICE) break;                   /* ★ 5個 のこす ＝ ここで やめる */
      for (i = 0; i < NDICE; i++) if (!mask[i]) d[i] = 1 + Math.floor(rnd() * 6);
      if (trace) trace.push({ dice: d.slice(), keep: mask.slice() });
    }
    var ci = decideWrite(sh, d, o, rnd);
    /* ⚠️★★ 空きマスが 1つも 無い とき ―― ★★`decideWrite` は −1 を 返します。
       ★ ★★ふつうの 遊びでは ここに 来ません（★席ごとに ちょうど TURNS 回 しか 書かない）。
       ★ ★★でも 見張りや 道具が 手番を 動かすと 来ます ―― ★★★T226 で 1回 来て、
         ★ ★★`CATS[-1].kind` で **画面ごと 止まりました**（★私が 手で `g.cur = 1` に した とき）。
       ★ ★→ ★★止めずに、★★「反則 1件」として 返します（★見張りの ③が 数えます）。 */
    if (ci < 0) return { ci: -1, pt: 0, bad: 1, dice: d };
    var pt = scoreOf(CATS[ci], d);
    sh[ci] = pt;
    for (i = 0; i < d.length; i++) if (d[i] < 1 || d[i] > 6) return { ci: ci, pt: pt, bad: 1 };
    return { ci: ci, pt: pt, bad: 0, dice: d };
  }

  /* ★ 1人ぶん TURNS 手番（★12回）まるごと */
  function playOne(o, rnd) {
    var sh = newSheet(), t, bad = 0, yacht = 0, zero = 0;
    for (t = 0; t < TURNS; t++) {
      var r = botTurn(sh, o, rnd);
      bad += r.bad;
      if (r.pt === 0) zero++;
      if (r.ci >= 0 && CATS[r.ci].id === 'yt' && r.pt > 0) yacht = 1;
    }
    return { sheet: sh, total: totalOf(sh), turns: TURNS, bad: bad + (filled(sh) === NCAT ? 0 : 1),
             upper: upperSum(sh), bonus: bonusOf(sh) ? 1 : 0, yacht: yacht, zero: zero };
  }

  /* ★ NP人（★T226 から 2人。★席0が 人の 模型。★相手の 手は 自分に 1つも ひびきません ―― ルル 検算7）*/
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
       ★ ★NP人の うち 1人が 人、★のこりが 同じ ロボット。★同点は 山分け：
         ★ ★★P ＝ Σ[人の点 s] p(s) × Σ[k=0..m] C(m,k)・B(s)^k・A(s)^(m−k) ／ (k+1)　（★m ＝ NP−1）
         ★ ★（A ＝ ロボットが s より 下 ／ B ＝ ロボットが ちょうど s）
       ★ ★★これで、★同じ 試合数でも 勝率の ぶれが うんと 小さく なります
         ★ ★（★人数ぶん 走らせる 必要も なくなる ので、★その ぶん 速い）。
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
  /* ★ 人 1人 vs 同じ ロボット (NP−1)体。★返すのは 0〜1
     ⚠️★★ T226 まで、ここは **C(3,k) ＝ 1,3,3,1 の 決め打ち** でした（★4人 固定 だった ため）。
        ★ ★★1対1に すると、★★★決め打ちの ままでは 勝率が 4人の 式で 出て しまいます
          ―― ★★数字が だまって まちがう（★いちばん こわい 形）。
        ★ ★→ ★★人数から C(m,k) を その場で 作ります（★数を 2か所に 書かない）。 */
  function winRateFrom(hh, hb, np) {
    var m = ((np == null ? NP : np) | 0) - 1, cm = [1], k;
    if (m < 0) m = 0;
    for (k = 1; k <= m; k++) cm.push(cm[k - 1] * (m - k + 1) / k);
    var A = 0, p = 0, s;
    for (s = 0; s <= SCORE_MAX; s++) {
      var B = hb[s], ph = hh[s];
      if (ph > 0) {
        var t = 0;
        for (k = 0; k <= m; k++) t += cm[k] * Math.pow(B, k) * Math.pow(A, m - k) / (k + 1);
        p += ph * t;
      }
      A += B;
    }
    return p;
  }
  /* ★ 同じ 腕どうしなら 何%か（★1／人数）―― ★画面に 出す「五分」の 数字 */
  function evenPct() { return 100 / NP; }

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

  /* ★ 長さ【見立て】の もと（★トライが 測るまで 確定させません）
     ★ ★perTurnMs … ★ロボット 1体の 1手番（★T226 の A案 ＝ 2410ms。★画面の 側が 渡します）*/
  function machineMs(perTurnMs) {
    return (perTurnMs == null ? 2410 : perTurnMs) * (NP - 1) * TURNS;
  }

  var API = {
    CATS: CATS, NCAT: NCAT, TURNS: TURNS, REROLL: REROLL, NDICE: NDICE, NP: NP,
    BONUS_NEED: BONUS_NEED, BONUS_PT: BONUS_PT, WORTH: WORTH, CFG: CFG,
    LEVELS: LEVELS, LEVEL_START: LEVEL_START, HUMANS: HUMANS, P: P,
    MS: MS, MSI: MSI, MSP: MSP, KEEPS: KEEPS, KEEPI: KEEPI,
    counts: counts, sum5: sum5, scoreOf: scoreOf, newSheet: newSheet, SCORE: SCORE, msIndex: msIndex,
    upperSum: upperSum, bonusOf: bonusOf, totalOf: totalOf, filled: filled,
    keepOptions: keepOptions, fvTable: fvTable, keepMask: keepMask,
    decideKeep: decideKeep, decideWrite: decideWrite, botTurn: botTurn,
    rollDice: rollDice, playOne: playOne, simMatch: simMatch, runMany: runMany,
    scoreHist: scoreHist, winRateFrom: winRateFrom, evenPct: evenPct, SCORE_MAX: SCORE_MAX,
    rng: rng, pct: pct, machineMs: machineMs
  };

  root.YACHT_CORE = API;
  if (typeof module === 'object' && module.exports) module.exports = API;

})(typeof globalThis !== 'undefined' ? globalThis : this);
