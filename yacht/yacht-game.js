'use strict';
/* ============================================================
   ヨット（20本目）―― ★画面（T193 ／ 💻 コーダ）
   ------------------------------------------------------------
   ★★ 決まりは 1つも 持って いません。★ぜんぶ `yacht-core.js` を 通ります。
      ★ ★★＝ ★決まりを 2か所に 書かない（★写しの エンジンを 作らない）。

   ★★★ この ファイルの 生命線（★ルル T192 §5-4・§18 コーダ①〜⑨）★★★
     ------------------------------------------------------------
     ★★ やって よい こと ―― ★これは ぜんぶ「見えて いる 事実」か「機械の 算数」です：
        ★ ① 13マスに「いま 書いたら 何点か」を **数字で** 出す（★追記②の 表に 名指し）
        ★ ② ふり直しの のこり 回数を ボタンの 中に 書く（★これで 説明が 0行に なります）
        ★ ③ 人が 押した サイコロに 青わく（★★強調は これ 1種類だけ）
        ★ ④ 1〜6の 合計を「◯／63」と 数える（★ボーナスの 説明が 0行に なります）
        ★ ⑤ 同じ 役に 2回 書けない ように する（★書いた マスを 押せなく する）
     ★★★ ぜったいに やらない こと：
        ★ ①★★のこすと よい サイコロを 光らせる（★−19.85ポイント。★この 1本で いちばん 重い 罪）
        ★ ②★★いちばん 点が 高い マスを 光らせる・色を 変える・上に 動かす（★−12.07）
        ★ ③★★0点に なる マスを 先に 暗くする（★あきらめの えらびを 奪います）
        ★ ④★★ふり直しを 自動で やる／自動で 止める（★9手番に 1回、やめる ほうが 得）
        ★ ⑤★★ハッピーに 手を 教えさせる（★「ヨットまで あと 1個！」は 1文字も 出しません）
     ⚠️★★ ★セブンブリッジの「追記②の 例外」を ここに 広げない こと。
        ★ ★★ヨットには 広げようが ありません ―― ★光らせる 対象が 画面に ありません。

   ★★ 外に 出す 口（★トライ・アト・見張り 用）：
      ★ `YACHT.now()` `autoPlay()` `verify()` `seed()` `geo()` `fitTest()` `rates()`
   ============================================================ */

(function (root) {

  var C = root.YACHT_CORE;
  var $ = function (id) { return document.getElementById(id); };

  /* ============================================================
     ★ 0. ならび（★ぜったいに 動かさない）
     ------------------------------------------------------------
       ★★ 2列×6行 ＋ ボーナスの 行 ＝ 13マス（★T230）。★CSS の grid は **行ごとに 左→右** に 入れて いく ので、
          ★ ★DOM の 順番は 「左0・右0・左1・右1 …」に なります。
       ⚠️★★ ★★点の 高い 順に 並べかえるのは 追記② 違反 です。
          ★ ★★見張り（verify ⑬）が、★毎回 この 表と DOM の 順番を 突き合わせて います。
     ============================================================ */
  /* ★★ T226 ―― ★`k3`（同じ目3つ ＝ スリーダイス）が 消えました（★社長の お決め②）★★
     ★ ★右の 列が 7つ → **6つ** に なりました。
     ★ ★★T226 では、★あいた 7行目に 空きマス（`@blank`）を 置いて かたちを 守って いました
       ★ ★―― ★★★T230 で 消えて います（★下を 読んで ください）。 */
  /* ★★★ T230 ―― ★★空きマス（`@blank`）が **消えました**（★社長の ご指摘③）★★★
     ★ ★T226 では、★右の 列の 7行目を 空きマスに して かたちを 守って いました。
     ★ ★★T230 で ボーナスの 行が **2列 ぶち抜き**に なりました（★どういう 条件で 何点 入るか を
       ★ ★書く ため。★★1列では 14px の 字で 6文字しか 入りません【実測】）。
     ★ ★★→ ★空きマスの 役目（★★「◯／63」と ヨットを 同じ 行に そろえる）が 無くなりました。
       ★ ★★★見えない のに 押せない マスを 置いたままに しません ―― ★消します。
     ★ ★★行の 数は **7行の まま**（★12の 役 6行 ＋ ボーナス 1行）。★1マスの たけは 1pxも 変わりません。 */
  var LEFT  = ['n1', 'n2', 'n3', 'n4', 'n5', 'n6', '@bonus'];
  var RIGHT = ['ch', 'k4', 'fh', 's4', 's5', 'yt'];
  var GRID = (function () {
    var a = [], r;
    for (r = 0; r < LEFT.length; r++) { a.push(LEFT[r]); if (RIGHT[r]) a.push(RIGHT[r]); }
    return a;
  })();
  function catIndex(id) { for (var i = 0; i < C.CATS.length; i++) if (C.CATS[i].id === id) return i; return -1; }

  /* ★ サイコロの 目 ＝ 3×3の ますの どこに 丸を 置くか（★ルル §6-1）*/
  var FACE = {
    1: [[2, 2]],
    2: [[1, 1], [3, 3]],
    3: [[1, 1], [2, 2], [3, 3]],
    4: [[1, 1], [1, 3], [3, 1], [3, 3]],
    5: [[1, 1], [1, 3], [2, 2], [3, 1], [3, 3]],
    6: [[1, 1], [2, 1], [3, 1], [1, 3], [2, 3], [3, 3]]
  };

  /* ★★ T226・★社長の ご指摘① ―― ★★1対1（★`C.NP` ＝ 2）★★ */
  var SEATS = ['あなた', 'ロボット'];

  /* ============================================================
     ★★★ T230・★社長の ご指摘③ ―― ★★ボーナスの 決まりを **文で 書く** ★★★
     ------------------------------------------------------------
       ★ ★社長の 言葉：「★★ボーナスの `0/63` は ★どういう 条件で 何点 入るか 記載して ほしい」
       ★ ★★決まりは もとから 動いて います（★T193 から。★★1文字も 作り直して いません）――
         ★ ★★足りなかったのは **決まりが 字に なって いない** ことでした。
       ★ ★★なぜ 1か所に 持つか：★★★この 字は 3か所に 出ます
         ★ ★①表の 行　②役の 説明（★あそびかたの 中）　③見張りの 見本
         ★ ★→ ★★数を 2か所に 書かない（★私の 失敗⑧ で 学んだ こと）。
       ⚠️★ ★★`C.BONUS_NEED`・`C.BONUS_PT` から 作ります ―― ★決まりを 直したら 字も いっしょに 直る。
       ⚠️★ ★★§9.6：★合（小4）計（小2）以（小4）上（小1）点（小2）―― ★ぜんぶ 小6までの 漢字。
     ============================================================ */
  var BONUS_TEXT = '1〜6の 合計が ' + C.BONUS_NEED + '点 以上で ＋' + C.BONUS_PT + '点';

  /* ============================================================
     ★★★ T226・★社長の ご指摘⑤ ―― ★ロボットの ふり方を 見せる（★ルル T225 §7-3 A案）★★★
     ------------------------------------------------------------
       ★ ★★もとは `BOT_MS = 600` の 1本 だけ ―― ★★結果だけ 0.6秒 で 終わって いました。
         ★ ★★何が 出て、何回 ふり直して、どこに 書いたのか ―― ★1つも 見えません でした。
       ★ ★★いまは 1手番を **こま切れ**に して 見せます：
         ★ ①ふる（★人と 同じ 転がり）→ ②のこす サイコロに 青わく → ③くり返し → ④書いた 役を 帯に 出す

       ★★★ 秒の 天井（★ルル T225 §7-4 の 数字を そのまま 守ります）★★★
         ★ ★1試合を **140秒 以内**に 収める ―― ★まとめサイトの「1試合 2分ほど」を 守る ため。
         ★ ★★1対1なら ロボットの 手番は 12回。★★1手番に 使えるのは **3,140ms** まで。
         ★ ★★いちばん 長い 場合（★3回 ふる）＝ 600×3 ＋ 700 ＝ ★**2,500ms**。★640ms の 余り。
         ★ ★★ふつうは 2.838回 ふる【計算・20000試合】＝ ★**2,403ms**。
         ★ ★→ ★★見張り ⑭ が、★★★本物の 時計で 1手番を 測って 3,140ms を こえたら 鳴らします
           ★ ★（★上の 線）。★★そして 800ms を 下回っても 鳴らします（★下の 線 ―― ★見せて いない）。
     ============================================================ */
  /* ★★ 1か所に まとめて 持ちます（★`yacht-core.js` の `CFG` と 同じ 置き方）★★
     ★ ★遊びの 中では 1度も 動きません。★★見張りが **わざと 壊して 鳴らす** ときだけ 動かします。 */
  var BOT = {
    roll:  600,                     /* ★ ロボットが 1回 ふって、目が 読める まで */
    write: 700,                     /* ★ 書いた 役を 帯に 出して いる 間 */
    cap:   3140,                    /* ★★ 上の 線（★ルル T225 §7-4：1試合 140秒）*/
    min:   800                      /* ★★ 下の 線 ―― ★これを 割ったら「見せて いない」*/
  };
  var BOT_MS = BOT.roll;            /* ★ 前の 名前（★トライの 紙が 見て います）*/
  /* ★★ 転がりの 長さは **`yacht.css` が 持ち主** です（★🎨アトの もの）★★
     ⚠️★★ ★ここに 320 と 書いて いました【★私の 失敗⑧・T193 追記】――
        ★ ★★アトが 270ms に した あとも、★私の 数字は 320 の まま でした。
          ★ ★★＝ ★同じ 数を 2か所に 書いて いた（★★写しの 台帳）。
        ★ ★→ ★★いまは `animationend`（★★CSS が 終わりを 教えて くれる）で 外します。
          ★ ★下の 数は **もしもの 天井** です ―― ★アトが 何msに しても 正しく 動きます。 */
  var ROLL_CEIL = 1200;             /* ★ もしもの 天井（★animationend が 来なかった とき だけ）*/
  /* ============================================================
     ★★★ しまう ところの 鍵 ―― ★T226 で **名前を 変えました**（★理由が あります）★★★
     ------------------------------------------------------------
       ★ ★T225 まで：★13役・13手番。★★ぜんぶ 気づいた人の 点は **232点**。
       ★ ★T226 から：★12役・12手番。★★同じ 人でも **206点**（★−26点）。
         ★ ★★＝ ★**点の ものさしが 変わりました**。
       ★ ★★もし 古い さいこう点（★232点）を そのまま 持ちこむと ――
         ★ ★★前に 遊んだ 人は、★★★もう 二度と さいこう点を こえられません。
         ★ ★★「まえの 記録が 破れない」を、★何の 説明も なく 押しつける ことに なります。
       ★ ★★＝ ★★ハーツ T168 の 🔴-1（★古い 保存を そのまま 読んだ）と 同じ 穴 です。

       ★★ どう したか（★はっきり 決めました）
         ★ ①★★鍵の 名前を `-v2` に 変える（★12役の 記録は、12役の 中だけで くらべる）
         ★ ②★★古い 鍵は **消す**（★読みこみの ときに 1回だけ）
           ★ ★理由：★のこすと 見張り ⑥（★しまう ものは 1つ だけ）が 鳴ります。
             ★ ★★そして のこして おいても、★★もう 二度と 使いません。
         ★ ③★★点は **持ちこみません**（★ものさしが ちがう ので、くらべたら うそに なります）
       ★ ★★代金：★★前に 遊んだ 人の さいこう点は、★★★1回だけ 0に もどります。
         ★ ★★正直に 書いて おきます ―― ★★これは 私が えらんだ 代金 です。
     ============================================================ */
  var BEST_KEY = 'brage-yacht-best-v2';
  var BEST_KEY_OLD = 'brage-yacht-best';        /* ★ 13役 の ころの 鍵（★消します）*/

  /* ============================================================
     ★ 1. いまの じょうたい
     ============================================================ */
  var g = null;                     /* ★ 1試合ぶん */
  var level = C.LEVEL_START;
  var busy = false, over = false;
  var geo = null, built = false;
  var seedFixed = 0, rand = Math.random;
  var timers = [];
  var sayTimer = 0, sayKey = '';
  var rollTimer = 0;                /* ★ 転がりの 後片づけ（★もしもの 天井）―― ★★1本だけ 持ちます */
  var cellEl = {}, dieEl = [], botEl = [];

  var titleScreen, playScreen, stageEl, paneA, paneB, sheetEl, diceRow, botBand,
      btnRoll, mePt, botPt, meTurn, meTurnL, sayEl, happyMid, resultWrap, resultBox, meBand;

  /* ★ 時計は **root.setTimeout** を 通します ―― ★見張りが 借りて 早送りに できる ように */
  function later(f, ms) { var id = root.setTimeout(f, ms); timers.push(id); return id; }
  function clearTimers() { for (var i = 0; i < timers.length; i++) root.clearTimeout(timers[i]); timers.length = 0; }

  /* ★ 測る あいだ だけ 動きを 止める（★会社で 4回 かかった わな）*/
  function still(fn) {
    var had = document.body.classList.contains('measuring');
    document.body.classList.add('measuring');
    try { return fn(); } finally { if (!had) document.body.classList.remove('measuring'); }
  }

  function newRand() { return seedFixed ? C.rng(seedFixed) : function () { return Math.random(); }; }

  /* ============================================================
     ★ 2. さいこう点（★1つ だけ おぼえる。★ルル §8-3・§18 コーダ⑨）
     ------------------------------------------------------------
       ★★ 1人あそびは 作りません ―― ★4人で 遊びながら、これが そのまま のびます。
       ⚠️★ しまえない ところ（★見に くる 人の せってい）でも **遊びを 止めません**。
     ============================================================ */
  function bestGet() {
    try { var v = root.localStorage.getItem(BEST_KEY); return v == null ? 0 : (parseInt(v, 10) || 0); }
    catch (e) { return 0; }
  }
  function bestPut(n) {
    try { root.localStorage.setItem(BEST_KEY, String(n | 0)); } catch (e) {}
  }
  /* ★ 13役の ころの 鍵を 片づける（★読みこみの ときに 1回だけ。★遊びは 止めません）*/
  function bestSweepOld() {
    try { if (root.localStorage.getItem(BEST_KEY_OLD) != null) root.localStorage.removeItem(BEST_KEY_OLD); }
    catch (e) {}
  }
  function showBest() {
    var b = bestGet(), el = $('bestLine');
    if (!el) return;
    if (b > 0) { el.textContent = 'いまの さいこう点 '; el.innerHTML = 'いまの さいこう点 <b>' + b + '</b> 点'; el.classList.remove('hidden'); }
    else el.classList.add('hidden');
  }

  /* ============================================================
     ★ 3. 画面を 組み立てる
     ============================================================ */
  function build() {
    if (built) return;
    built = true;
    var i, r, id, el;

    /* ★★★ 12の 役 ＋「1〜6の 合計」＝ 13マス（★2列×6行 ＋ 2列ぶち抜き 1行）★★★
       ★ ★★T230・★社長の ご指摘① ―― ★1マスに 数字が **2つ** 入ります：
         ★ ★`.cell-pt` … ★★**あなたの 点**（★書いた 点／まだなら「いま 書いたら 何点か」）
         ★ ★`.cell-bp` … ★★**ロボットの 点**（★書いて いなければ 「―」）
       ★ ★★社長の 言葉：「★フォーダイス 28点が プレイヤーが とった 28点だと 分かるように、
         ★ ★★その となりに ロボットの点（★点を 入れて ないなら ー）を 記載して ほしい」
       ⚠️★★ ★★ならびは **あなた → ロボット**。★上の 帯（`.me-band`）の ならびと 同じです
         ★ ★（★★どちらが どちらかを、★★★ならびが 言って います ―― ★説明は 0行）。
       ⚠️★★ ★★ロボットの 点は **すでに 起きた 事実** だけ です（★追記②の 線の 手前）。
         ★ ★★「ここが おすすめ」「ロボットは ここを 空けて いる」は 1文字も 出しません。 */
    sheetEl.textContent = '';
    for (i = 0; i < GRID.length; i++) {
      id = GRID[i];
      el = document.createElement('button');
      el.type = 'button';
      el.className = 'cell';
      el.dataset.cat = id;
      var nm = document.createElement('span'); nm.className = 'cell-name';
      var pt = document.createElement('span'); pt.className = 'cell-pt';
      var bp = document.createElement('span'); bp.className = 'cell-bp';
      el.appendChild(nm); el.appendChild(pt); el.appendChild(bp);
      if (id === '@bonus') { el.classList.add('is-bonus'); el.disabled = true; }
      else {
        el.addEventListener('click', (function (cid) {
          return function () { onCell(cid); };
        })(id));
      }
      sheetEl.appendChild(el);
      cellEl[id] = el;
    }

    /* ★ サイコロ 5個 */
    diceRow.textContent = '';
    dieEl.length = 0;
    for (i = 0; i < C.NDICE; i++) {
      el = document.createElement('button');
      el.type = 'button';
      el.className = 'die';
      el.dataset.die = String(i);
      el.style.setProperty('--roll-i', String(i));
      el.setAttribute('aria-label', 'サイコロ' + (i + 1));
      el.addEventListener('click', (function (k) { return function () { onDie(k); }; })(i));
      /* ★★ 転がりが 終わったら、★その 1個 だけ しるしを 外す（★★CSS が 終わりを 教えて くれる）★★
         ★ ★これで「何ms 動くか」を JS が 知らなくて よく なります（★アトの 数を 写さない）。
         ★ ★`dieRoll` と `dieRollQuiet`（★動きを へらす せってい）の どちらも 拾います。 */
      el.addEventListener('animationend', function (ev) {
        if (ev.animationName && ev.animationName.indexOf('dieRoll') === 0) this.classList.remove('is-roll');
      });
      diceRow.appendChild(el);
      dieEl.push(el);
    }

    /* ★★ ロボットの 帯（★T226 から **1体**）★★
       ★ ★空いた ところに 「★何を 書いたか」が 入ります（★社長の ご指摘⑤の 後半）。
       ⚠️★★ ★★ここに 出すのは **すでに 起きた 事実** だけ です
          ★ ★（★ロボットが どこに 書いたか）。★★「あなたは ここが おすすめ」は 1文字も 出しません。 */
    /* ★★★ T230・★社長の ご指摘② ―― ★★ロボットの 合計点は **上の 帯へ 引っ越し** ました ★★★
       ★ ★社長の 言葉：「★ロボットの合計点は、★プレイヤーの合計点の隣に 記載してほしい。
         ★ ★★『あなた 28点』の 右（★チョイスの 上あたり）に…」
       ★ ★★＝ ★★合計点は `.me-band` が 持ちます（★あなた ｜ ロボット ｜ 何回目）。
       ★ ★★★同じ 数を 2か所に 出しません（★★はば 320px で 同じ「24」が 2つ 出るのは 迷いの もと）。
       ★ ★★この 帯に のこすのは ―― ★①だれの 番か（★金色。★アトの ⑱）★②何を 書いたか（★0.7秒）。 */
    botBand.textContent = '';
    botEl.length = 0;
    for (i = 1; i < C.NP; i++) {
      el = document.createElement('div');
      el.className = 'bot-cell';
      var bn = document.createElement('span'); bn.className = 'bot-name'; bn.textContent = SEATS[i];
      var bm = document.createElement('span'); bm.className = 'bot-move'; bm.textContent = '';
      el.appendChild(bn); el.appendChild(bm);
      botBand.appendChild(el);
      botEl.push({ el: el, move: bm });
    }
    void r;
  }

  /* ★ サイコロ 1個を 描く（★丸を 置くだけ）*/
  function drawDie(el, v) {
    el.textContent = '';
    var pos = FACE[v] || [], i;
    for (i = 0; i < pos.length; i++) {
      var p = document.createElement('i');
      p.className = 'pip';
      p.style.gridRow = String(pos[i][0]);
      p.style.gridColumn = String(pos[i][1]);
      el.appendChild(p);
    }
    el.dataset.v = String(v);
  }

  /* ============================================================
     ★ 4. 大きさを 決める（★320×568 から PC まで）
     ------------------------------------------------------------
       ★ たての 画面 … 上から 縦に。★横向きの 画面 … 左右に（★CSS の @media が 決めます）。
       ★ ★どちらでも **本物を 測って** から 決めます（★式だけで 決めない）。
     ============================================================ */
  function layout() {
    if (!built || playScreen.classList.contains('hidden')) return geo;
    var s = document.documentElement.style;
    var W = stageEl.clientWidth, H = stageEl.clientHeight;
    var gapD = 6;

    /* ★ ① サイコロ ―― ★まず よこはばで 決める（★44px の 会社の 線を 守る）
       ★★★ T226 で 見つけた 穴（★★追記⑥ の 9画面を 数えて 出て きました）★★★
         ★ ★**568×320**（★iPhone SE 初代 の 横向き）で ★★サイコロが **42px**。★44px を 割って いました。
           ★ ★★T225 の 控えでも 同じ 42px【実測】―― ★★私が こわしたのでは なく、
             ★ ★★**その たてを 誰も 開いて いなかった** だけ です（★アトが ハーツで 書いた とおり）。
         ★ ★中身：★横向きでは `.pane-b` が はばの 44%。★568px だと 約 240px。
           ★ ★5個 × 44px ＝ 220px。★すきま 6px × 4 ＝ 24px。★★足すと 248px ―― ★8px 足りません。
         ★ ★→ ★★**すきまを 静かに 詰めます**（★設計図 追記③ の 順番：★①静かに 詰める → ②見切れる）。
           ★ ★★6px で 44px に とどく 画面は、★1pxも 変わりません（★下の while が 走りません）。
           ★ ★★568×320 だけ 6→4px に なり、★★サイコロが 42 → **44px** に なります【実測】。 */
    var wb = paneB.clientWidth || W;
    var die = Math.floor((wb - (C.NDICE - 1) * gapD - 4) / C.NDICE);
    while (die < 44 && gapD > 3) {
      gapD--;
      die = Math.floor((wb - (C.NDICE - 1) * gapD - 4) / C.NDICE);
    }
    die = Math.max(38, Math.min(78, die));
    s.setProperty('--die', die + 'px');
    s.setProperty('--die-gap', gapD + 'px');

    /* ★ ② 表の 1マス ―― ★★本物の pane-a を 測って から 決める
       ★ ★入りきらなければ サイコロを 1pxずつ 小さく して やり直す（★8回まで）

       ★★★ T227（★🎨アトの 判じ）―― ★★横向きでは、サイコロを 削っても 表は 1pxも 広がりません ★★★
         ★ ★`.stage` が `flex-direction:row` の とき、★pane-a と pane-b は **左右に** 並びます。
           ★ ★★＝ ★pane-a の たけは 画面の たけ そのもの。★サイコロは そこに 入って いません。
         ★ ★★そのまま だと 568×272（★実在の 底）で サイコロが 44 → **38px** に 落ち、
           ★ ★★T122 の 会社の 線（★指の 的 44px）を 割ります ―― ★★何も 買わずに。
         ★ ★★【★アト実測・T227】★9画面は 1pxも 変わりません／★底だけ 38 → 44px。
           ★ ★★表の 1マスは 底でも **23px の まま**（★★＝ 削った 6px は 何も 買って いなかった）。
         ★ ★★これは 設計図 追記③（★まれな 最悪ケース）では ありません ―― ★★引きかえが 0 だから です。
           ★ ★★引きかえが ある とき（★たての 画面）は、★ループは いままで どおり 走ります
             ★ ★（★320×568 で pane-a が 288 → 301px ―― ★ちゃんと 買って います）。 */
    var wideNow = getComputedStyle(stageEl).flexDirection === 'row';
    var cellH = 32, k, avail = 0;
    for (k = 0; k < 10; k++) {
      var ha = paneA.clientHeight, meH = meBand.getBoundingClientRect().height;
      avail = ha - meH - 4 - 6 * 2;                  /* ★ すきま 2px × 6 */
      cellH = Math.floor(avail / 7);
      if (cellH >= 24 || die <= 38 || wideNow) break;
      die--; s.setProperty('--die', die + 'px');
    }
    /* ★★ PC では 2列×7行の まま **1マスを 大きく** します（★ルル §10-2）★★
       ⚠️★ ★★天井を 46px に して いました【★私の 失敗⑥】―― ★800×760 の 画面で
          ★ ★★表の 下に **200px の 何も ない ところ** が できて いました。
          ★ ★列を 増やしたり 説明を 足したり せず、★★マスを 大きく するのが 正 です。 */
    cellH = Math.max(20, Math.min(64, cellH));
    s.setProperty('--cell-h', cellH + 'px');
    /* ★ 字は マスの たけに ついて いく（★CSS に 決め打ちを 置かない ―― ★ハーツ T166 §7-2 の 元の 原因）*/
    s.setProperty('--cell-f', Math.max(10, Math.min(19, Math.round(cellH * 0.40))) + 'px');
    s.setProperty('--cell-n', Math.max(11, Math.min(23, Math.round(cellH * 0.46))) + 'px');

    geo = { W: W, H: H, die: die, cellH: cellH, sheetH: cellH * 7 + 12,
            paneA: paneA.clientHeight, paneB: paneB.clientHeight,
            wide: getComputedStyle(stageEl).flexDirection === 'row' };
    return geo;
  }

  /* ============================================================
     ★ 5. 1試合
     ============================================================ */
  function startGame() {
    clearTimers();
    rand = newRand();
    g = { sheets: [], turn: 0, cur: 0, dice: null, keep: [], rolls: 0, over: false, botMove: '' };
    for (var i = 0; i < C.NP; i++) g.sheets.push(C.newSheet());
    busy = false; over = false;
    titleScreen.classList.add('hidden');
    playScreen.classList.remove('hidden');
    resultWrap.classList.add('hidden');
    build(); layout();
    /* ★★ T230 ―― ★はじめの ひとことは `beginTurn()` が 言います（★★毎手番 言う ように なった ため）。
       ★ ★ここで 言うと **2回** 言う ことに なります（★同じ ことを 2か所に 書かない）。 */
    saidTurn = {};
    beginTurn();
  }

  /* ★★★ T226・★社長の ご指摘④ ―― ★★はじめの 1ふりを、機械が 横取りしない ★★★
     ------------------------------------------------------------
       ★ ★社長の 言葉：「★ゲームを開始したら サイコロが 振られている状態に なっていて、
         ★ ★★サイコロを振る楽しみが 1回分 なくなっている」
       ★ ★★T225 まで：★`beginTurn()` が 自分で `throwDice(true)` を 呼んで いました。
         ★ ★★＝ ★1手番に つき 1回、★★ふる 楽しみを 機械が 先に 食べて いました（★1試合で 12回）。
       ★ ★★いまは ―― ★★★サイコロを **1つも 出しません**。★人が ボタンを 押したら、はじめて ふります。
       ★ ★★ことばの 導き：★★ボタンの 文字が「サイコロを ふる」と 言います（★あそびかたは 0行 増えません）。
         ★ ★★＋ 手番の はじめに ハッピーが「サイコロを ふろう！」（★★決まりの 案内。
           ★ ★★「どの 目を のこせ」は 1文字も 言いません ―― ★★追記②の 線の 手前 です）。 */
  function beginTurn() {
    if (!g) return;
    if (g.turn >= C.TURNS) { finish(); return; }
    if (g.cur === 0) {
      /* ★ 人の 手番 ―― ★★サイコロは 出しません。★ふるのは 人 です。 */
      g.dice = null; g.keep = [];
      for (var i = 0; i < C.NDICE; i++) g.keep.push(false);
      g.rolls = 0;
      g.botMove = '';
      /* ★★★ T230・★社長の ご指摘④ ―― ★★手番の はじめに ハッピーが 言う（★★★毎手番）
         ★ ★T226 まで、★これは 1試合に 1回だけ でした ―― ★★2回目の 手番から だまって いました。
         ★ ★★「あなたの 番だよ」の しるしを、★ことばが 引きうけます（★新しい 部品は 0個）。 */
      saidTurn = {};
      sayOrder('start');
    } else {
      botStep();
    }
    render();
  }

  /* ★★ ふる ―― ★★ここは **人が 押した ときにしか 通りません**（★自動で ふり直さない）★★
     ★ first ＝ 手番の はじめの 1回目。★あとは のこして いない ぶん だけ。 */
  function throwDice(first) {
    var i, n = 0;
    /* ★ T226 ―― ★★手番の はじめは `g.dice` が **null**（★まだ 1つも 出て いない）*/
    if (!g.dice) { g.dice = []; for (i = 0; i < C.NDICE; i++) g.dice.push(1); }
    if (!g.keep || !g.keep.length) { g.keep = []; for (i = 0; i < C.NDICE; i++) g.keep.push(false); }
    for (i = 0; i < C.NDICE; i++) {
      if (first || !g.keep[i]) {
        g.dice[i] = 1 + Math.floor(rand() * 6);
        if (g.dice[i] < 1) g.dice[i] = 1;
        if (g.dice[i] > 6) g.dice[i] = 6;
        n++;
      }
    }
    g.rolls++;
    if (first) for (i = 0; i < C.NDICE; i++) g.keep[i] = false;
    /* ★★★ 転がり（★ふり直した ぶん だけ。★のこした ぶんは 動かしません ―― ★ルル §6-2②）★★★
       ------------------------------------------------------------
       ⚠️★★★★ ここで 連打が こわれて いました【★私の 失敗⑨・★トライ 🟡-1】★★★★
          ★ ★★前の ふりの **後片づけタイマーが 1本 生きた まま** でした。
            ★ ★620ms後に「ぜんぶの `.is-roll` を 外す」が 走ります ―― ★★次の ふりの 分まで。
          ★ ★★【実測】★300msで 2回目を 押すと、★★t=690ms で 転がりが 消えました
            ★ ★（★2回目は t=790ms まで 動く はず。★★100ms 分が 切られる）。
            ★ ★★おそい サイコロ（`--roll-i` が 大きい もの）ほど 多く 食べられます。
          ★ ★★トライの【実測】：★連打する 人（★子ども）は **35.9%の ふりで 消えます**。
       ★ ★★直し方は 2つ 重ねます：
          ★ ①★★前の 後片づけタイマーを **かならず 消して から** 新しく 張る（★これが 芯）
          ★ ②★★`animationend` で 1個ずつ 外す（★★CSS が 終わりを 教えて くれる）
            ★ ★→ ★アトが 転がりを 何msに しても 正しく 動きます（★数を 2か所に 書かない）
       ★ ★★`yacht.css` は 1文字も 触って いません（★アトの 持ち物）。 */
    rollAnim(first ? null : g.keep);
    return n;
  }

  /* ★★ 転がりを 見せる ―― ★`held[i]` が true の サイコロは 動かしません
     ★ ★★人の ふり直し でも、★T226 から ロボットの ふり直し でも、★★ここ 1本を 通ります
       ★ ★（★同じ 動きを 2か所に 書かない ―― ★見た目が ずれる もと）。 */
  function rollAnim(held) {
    var i;
    if (rollTimer) { root.clearTimeout(rollTimer); rollTimer = 0; }
    for (i = 0; i < C.NDICE; i++) {
      dieEl[i].classList.remove('is-roll');
      if (!held || !held[i]) {
        /* ★ 一度 外して から 付け直す（★同じ 動きを 2回 見せる ため）*/
        void dieEl[i].offsetWidth;
        dieEl[i].classList.add('is-roll');
      }
    }
    rollTimer = later(function () {
      rollTimer = 0;
      for (var j = 0; j < C.NDICE; j++) dieEl[j].classList.remove('is-roll');
    }, ROLL_CEIL);
  }

  /* ★★ T226 ―― ★2つに 分けました（★④の ため）★★
     ★ `myTurn()`  … ★★自分の 番か（★★まだ 1回も ふって いなくても はい）―― ★ふる ボタンは これ
     ★ `canAct()`  … ★★もう ふった あとか（★のこす・書く は これ）
       ★ ★★これが 1つの ままだと、★★「サイコロを ふる」ボタンが 押せません でした。 */
  function isMyTurn() { return !!g && !over && !busy && g.cur === 0; }
  function rerollLeft() {
    if (!g) return 0;
    if (g.rolls === 0) return C.CFG.reroll;         /* ★ まだ ふって いない ＝ ふり直しは まるまる のこって います */
    return Math.max(0, C.CFG.reroll - (g.rolls - 1));
  }
  function canAct() { return isMyTurn() && g.rolls > 0; }

  /* ★ サイコロを タップ ＝「のこす」（★青わくが つく）*/
  function onDie(i) {
    if (!canAct() || rerollLeft() <= 0) return;   /* ★ もう ふれない なら 色も 変えません */
    g.keep[i] = !g.keep[i];
    render();
  }

  /* ★★ ふり直す ―― ★★自動で やらない・自動で 止めない（★ルル §5-2：9手番に 1回 やめる ほうが 得）*/
  function onRoll() {
    if (!isMyTurn()) return;
    if (g.rolls === 0) {
      throwDice(true);                                          /* ★ T226・④ ―― ★1回目 */
      /* ★★★ ふった 瞬間に「サイコロを ふろう！」は 役目が 終わります ―― ★★消します ★★★
         ★ ★★【★写真で 見つけました・T230】★4手番目 いこう（★のこす の ことばを 引っこめた あと）、
           ★ ★★ふった あとも「サイコロを ふろう！」が 2.6秒 出た まま でした。
           ★ ★★★嘘では ありません（★まだ ふり直せます）が、★★もう 済んだ ことを すすめて います。
         ★ ★★★声は 1つも 足して いません ―― ★★消す だけ です（★T227-2 の 線の まま）。 */
      hushOrder();
      /* ★★★ T230・★社長の ご指摘④ ―― ★★「変えたくない サイコロを おすと のこせるよ！」
         ★ ★★★目が 出た **その あと** でしか 意味を 持たない ことば なので、ここで 言います。
         ★ ★★どの 目を のこすかは 1文字も 言いません（★★追記②の 線の 手前）。
         ★ ★★ふり直しが のこって いない ときは 言いません（★★できない ことを すすめない ―― ★私の 失敗⑩）。 */
      if (rerollLeft() > 0) sayOrder('keep');
      render(); return;
    }
    if (rerollLeft() <= 0) return;
    throwDice(false);
    render();
  }

  /* ★★ 役の マスを タップ ＝「書く」。★★押した 瞬間が「ふり直しを やめた 瞬間」です
     ―― ★だから「やめる」ボタンが 要りません（★ルル §5-3。★決まりが 1つ 減ります）。 */
  function onCell(id) {
    if (!canAct()) return;
    var ci = catIndex(id);
    if (ci < 0 || g.sheets[0][ci] != null) return;    /* ★ 同じ 役は 1回だけ（★決まり5）*/
    var pt = C.scoreOf(C.CATS[ci], g.dice);
    var beforeBonus = C.bonusOf(g.sheets[0]);
    g.sheets[0][ci] = pt;
    /* ★★ ハッピーが しゃべる 場面（★ルル §14。★★手は 1文字も 教えません）*/
    if (C.CATS[ci].id === 'yt' && pt > 0) { say('ヨットが 出た！ 50点！'); jump(); }
    else if (!beforeBonus && C.bonusOf(g.sheets[0])) { say('1〜6の 合計が 63に とどいた！ ＋35点！'); jump(); }
    busy = true;
    /* ★★★ T228 ―― ★★指図を 消すのは「席が 変わった とき」では なく
       ★★★**人が 押せなく なった とき** です（★🧪トライの 実測：★★ここが 267ms 空いて いました）★★★
       ★ ★★`busy = true` から `nextSeat()` まで 260ms あり、★その 間 `g.cur` は まだ **0**。
         ★ ★★★＝ ★もう 押せない のに「サイコロを ふろう！」が 出た まま でした。
       ★ ★★T227 では `botStep()` の はじめに 置きました ―― ★★★1こま 遅かった。
         ★ ★★`busy = true` の すぐ 下が、★「人の 手番が 終わった」いちばん 早い こま です。
       ★ ★★声は 1つも 足して いません（★T227-2 §T2-2 の 分け方の まま ―― ★消す だけ）。
         ★ ★★上の `say('ヨットが 出た！')` は key なし ＝ ★事実の 知らせ なので 消えません。 */
    if (HUSH.onWrite) hushOrder();
    g.dice = null; g.keep = [];
    render();
    later(nextSeat, 260);
  }

  function nextSeat() {
    busy = false;
    g.cur++;
    if (g.cur >= C.NP) { g.cur = 0; g.turn++; }
    beginTurn();
  }

  /* ============================================================
     ★★★ ロボットの 手番 ―― ★T226・★社長の ご指摘⑤（★ルル T225 §7-3 A案）★★★
     ------------------------------------------------------------
       ★ ★社長の 言葉：「★ロボットも サイコロを振って、何が出て、何回振りなおして、
         ★ ★★どれを選んだのか 分かるようにして。」
       ★★ 見せる 順番（★人の サイコロと **同じ ところ** で ふります）：
         ★ ①ころがる（★人と 同じ 動き。★のこした ぶんは 動きません）
         ★ ②のこす サイコロに **青わく**（★★人と まったく 同じ 見た目 ―― ★別の 色を 作らない）
         ★ ③ ①②を、★ロボットが ふり直した 回数だけ くり返す（★2.838回【計算】・★多くて 3回）
         ★ ④ ★★書いた 役を 帯に 出す（「フルハウス 25点」）

       ★★★ やって いない こと（★ルル T225 §7-5 の 表・★★ここが いちばん こわい ところ）★★★
         ★ ★★★「ロボットは 6を のこしました」と **文字で 言う** … ★書いて いません
         ★ ★★★人の 表の マスを 光らせる・色を 変える … ★★1マスも 触って いません
           ★ ★★（★ルルの A案 ④に「書いた 役の マスが 一瞬 光り」と ありましたが、
             ★ ★★★**採りません でした** ―― ★表は **人の 表**です。★そこが 光ると、
               ★ ★★★人が 次に「どこに 書こう」と 考える ところを 先に 指す ことに なります。
               ★ ★★★→ ★帯に 文字で 出す だけに しました。★ルル §7-5 の 表と 合います。）
         ★ ★★★「あと1個で ヨット」の たぐい … ★1文字も ありません

       ★★ 秒（★上の 線と 下の 線 ―― ★★見張り ⑭ が 本物の 時計で 数えます）
         ★ ★ふつう 2.838 × 600 ＋ 700 ＝ ★**2,403ms**／★いちばん 長くて 3 × 600 ＋ 700 ＝ ★**2,500ms**
         ★ ★上の 線 3,140ms（★1試合 140秒）／★下の 線 800ms（★これを 割ったら 見せて いない）
     ============================================================ */
  var botLedger = { rolls: 0, shown: 0, wrote: 0 };
  function botStep() {
    busy = true;
    /* ★★★ T227 ―― ★★人への 指図を、★ロボットの 手番に 持ちこまない（★→ `hushOrder()`）*/
    hushOrder();
    var seat = g.cur, myG = g;
    var trace = [];
    var before = C.totalOf(g.sheets[seat]);
    /* ⚠️★★★★ 【★私の 失敗・T230 ―― ★★見張り ㉑-2 が 見つけました】★★★★
       ★ ★★`C.botTurn()` は **中で 表に 書きこみます**。
         ★ ★★はじめ 私は 写しを **その あと** に 取って いました ――
           ★ ★★★写した ときには もう 書きこみ済み で、★★止めた つもりの 表が
             ★ ★★★「ロボットが ふって いる 最中に もう 答えが 出て いる」姿 でした。
       ★ ★★T226 の 合計点（`before`）は **前に** 数えて いた ので 無事 でした ――
         ★ ★★★私は それを 見て「同じ ように なる はず」と 思いこみました。★数えて いません でした。
       ★ ★→ ★★**書きこむ 前に 写します。** */
    var freezeSheet = g.sheets[seat].slice();
    var r = C.botTurn(g.sheets[seat], C.LEVELS[level].o, rand, trace);
    /* ★★ 見張り ⑭ が「★ふった 回数」と「★画面に 出した 回数」を 突き合わせる ため の 台帳 ★★
       ⚠️★★ ★★出目の **中身**で 数えては いけません【★T226・私の 失敗】――
          ★ ★★4個 のこして 1個 ふり直すと、★★同じ 目に なる ことが 6回に 1回 あります。
            ★ ★★★出目で 数えると「3回 ふったのに 2回しか 見せて いない」に 見えました。
          ★ ★→ ★★**ふった 回数**と **見せた 回数**を、それぞれ 数えます。 */
    botLedger = { rolls: trace.length, shown: 0, wrote: 0 };
    /* ★★ 点は **書いた ところで** 出します ―― ★ころがって いる 間に 点が 先に 動くと、
       ★ ★★「もう 終わって いる ものを 見せられて いる」ように 見えます。 */
    /* ★★ T230 ―― ★★表の 中の ロボットの 点も 止める ので、★★★表そのものを 写して 持ちます
       ★ ★（★点だけ 止めて 表が 先に 動くと、★★1マスだけ 未来を 見せる ことに なります）*/
    g.botFreeze = { seat: seat, pt: before, sheet: freezeSheet };
    g.botMove = '';
    var step = 0;
    function showStep() {
      if (!g || g !== myG || over) return;               /* ★ 新しい 試合が 始まって いたら 何も しない */
      if (step < trace.length) {
        g.dice = trace[step].dice.slice();
        g.keep = trace[step].keep.slice();
        rollAnim(step === 0 ? null : trace[step - 1].keep);
        step++;
        botLedger.shown++;
        render();
        later(showStep, BOT.roll);
        return;
      }
      /* ★ 書いた ―― ★★ここで はじめて 点が 動きます */
      g.botFreeze = null;
      g.botMove = (r.ci >= 0) ? (C.CATS[r.ci].name + ' ' + r.pt + '点') : '';
      botLedger.wrote++;
      render();
      later(function () {
        if (!g || g !== myG || over) return;
        g.botMove = ''; g.botFreeze = null;
        g.dice = null; g.keep = [];
        busy = false;
        nextSeat();
      }, BOT.write);
    }
    showStep();
  }

  function finish() {
    over = true; g.over = true;
    var tot = [], i;
    for (i = 0; i < C.NP; i++) tot.push(C.totalOf(g.sheets[i]));
    var hi = Math.max.apply(null, tot), nw = 0;
    for (i = 0; i < C.NP; i++) if (tot[i] === hi) nw++;
    var meWin = tot[0] === hi;
    var best = bestGet(), newBest = tot[0] > best;
    if (newBest) bestPut(tot[0]);

    $('resultTitle').textContent = meWin ? (nw > 1 ? '引き分け！' : '勝ち！') : 'まけ…';
    $('resultTitle').classList.toggle('is-quiet', !meWin);
    $('resultSay').textContent = newBest ? 'さいこう点を こえた！' : (meWin ? 'よく できました！' : 'つぎ がんばろ！');

    /* ★ 点の 一覧（★見えて いる 事実だけ）*/
    var box = $('resultScore'); box.textContent = '';
    /* ★ T226 ―― ★★[0,1,2,3] の 決め打ちを やめました（★人数を 変えると こわれます）*/
    var ord = []; for (i = 0; i < C.NP; i++) ord.push(i);
    ord.sort(function (a, b) { return tot[b] - tot[a]; });
    for (i = 0; i < ord.length; i++) {
      var row = document.createElement('div');
      row.className = 'rs-row' + (ord[i] === 0 ? ' rs-me' : '');
      row.style.display = 'contents';
      var n = document.createElement('span'); n.className = 'rs-name';
      n.textContent = (i + 1) + '位　' + SEATS[ord[i]];
      var p = document.createElement('span'); p.className = 'rs-pt';
      p.textContent = tot[ord[i]] + ' 点';
      if (ord[i] === 0) { n.style.color = 'var(--pink-dark)'; p.style.color = 'var(--pink-dark)'; }
      box.appendChild(n); box.appendChild(p);
    }
    var b = document.createElement('span');
    b.className = 'rs-best';
    b.textContent = 'あなたの さいこう点 ' + bestGet() + ' 点';
    box.appendChild(b);

    fillLevelSelect($('levelResult'));
    resultWrap.classList.remove('hidden');
    render();
  }

  /* ============================================================
     ★ 6. 描く
     ============================================================ */
  function render() {
    if (!g || !built) return;
    var i, ci, id, el, acting = canAct(), mine = isMyTurn();

    /* ★★★ T230・★社長の ご指摘② ―― ★上の 帯：★あなた ｜ ロボット ｜ 何回目 ★★★
       ★ ★★ロボットの 点は、★★ころがって いる 間は **前の 点の まま**（`botFreeze`）。
         ★ ★★★表の 中の ロボットの 点も 同じ 見方を します ―― ★2か所が 食いちがいません。 */
    mePt.textContent = String(C.totalOf(g.sheets[0]));
    if (botPt) botPt.textContent = String(botTotalShown(1));
    /* ★★★ T238 ―― ★「◯回目 / ◯回」は **左右 とも** 同じ 字に する ★★★
       ★ ★★🎨アトの 名ざしの お願い（T236-2 §7-1）：
         ★ ★「★器だけ 入れて 測ったら、★★右が『12回目』の 横で 左が『1回目』の まま でした。
         ★ ★★★出ないより 悪い です」
       ★ ★★左（`#meTurnL`）は 広い 画面でしか **見えません** が、★字は いつも そろえます
         ★ ★（★★見えて いない ときに ずれて いると、★広く した 瞬間に 古い 字が 出ます）。
       ★ ★★`if (meTurnL)` に して あるのは、★★★器の 無い 日にも こわれない ため です。 */
    var turnTxt = Math.min(C.TURNS, g.turn + 1) + '回目 / ' + C.TURNS + '回';
    meTurn.textContent = turnTxt;
    if (meTurnL) meTurnL.textContent = turnTxt;

    /* ★★ 13マス（★12の 役 ＋ ボーナスの 行）★★ */
    for (i = 0; i < GRID.length; i++) {
      id = GRID[i]; el = cellEl[id];
      var nm = el.firstChild, pt = el.children[1], bp = el.children[2];
      if (id === '@bonus') {
        /* ★★★ T230・★社長の ご指摘③ ―― ★★「どういう 条件で 何点 入るか」を **行に 書く** ★★★
           ★ ★社長の 言葉：「★ボーナスの 0/63 は どういう条件で 何点入るか 記載してほしい」
           ★ ★★T226 まで：★名前が「0 / 63」・点が「+35」だけ ―― ★★★条件も 点も 字に なって いません
             ★ ★（★見て 分かる 人には 分かる、★★★はじめての 人には 分からない）。
           ★ ★★いまは：★名前が **決まりの 文**、★数字は **あなたと ロボットの 合計**。
             ★ ★★★63 という 数は 決まりの 文の 中に あります ―― ★「◯／63」の 役目は そこへ 移りました。
           ⚠️★ ★★§9.6：★合・計・以・上・点 は ぜんぶ **小6までに 習う 漢字**です。
           ★ ★★はば：★2列 ぶち抜きに して あります（★1列では 6文字しか 入りません【★9画面 実測】）。 */
        var u = C.upperSum(g.sheets[0]);
        var got = u >= C.BONUS_NEED;
        nm.textContent = BONUS_TEXT;
        pt.textContent = String(u);
        bp.textContent = String(C.upperSum(botSheetShown(1)));
        el.classList.toggle('is-got', got);
        continue;
      }
      ci = catIndex(id);
      nm.textContent = C.CATS[ci].name;
      if (g.sheets[0][ci] != null) {
        el.classList.add('is-done'); el.classList.remove('is-open');
        el.disabled = true;
        pt.textContent = String(g.sheets[0][ci]);
      } else {
        el.classList.add('is-open'); el.classList.remove('is-done');
        el.disabled = !acting;
        /* ★★ ここが「点数の 計算」―― ★★機械の 仕事（★追記②の 表に 名指しで あります）★★
           ★ ★★0点でも そのまま 0 と 出します。★★暗くも しません・目立たせも しません。 */
        pt.textContent = (acting && g.dice) ? String(C.scoreOf(C.CATS[ci], g.dice)) : '―';
      }
      /* ★★★ T230・★社長の ご指摘① ―― ★となりに ロボットの 点 ★★★
         ★ ★★書いて いなければ 「―」（★社長：「点を 入れて ないなら ー」）。
         ★ ★★★ころがって いる 間は 出しません ―― ★★書いた その こまで はじめて 出ます
           ★ ★（★上の 帯の 点と まったく 同じ 見方。★★2か所が 食いちがいません）。
         ⚠️★★ ★★これは **すでに 起きた 事実** です。★★★人の えらびを 1文字も 指して いません。 */
      bp.textContent = botCellText(1, ci);
    }

    /* ★★ サイコロ ★★ */
    var canKeep = acting && rerollLeft() > 0;
    for (i = 0; i < C.NDICE; i++) {
      el = dieEl[i];
      if (g.dice) { drawDie(el, g.dice[i]); el.classList.remove('is-blank'); }
      else { el.textContent = ''; el.dataset.v = ''; }
      /* ⚠️★★ 青わくは **人が 押した ぶん だけ**。★機械が「のこすと よい」を つけては いけません。 */
      el.classList.toggle('is-keep', !!g.keep[i]);
      el.classList.toggle('is-quiet', !canKeep);
      el.disabled = !canKeep;
    }

    /* ★★ ふる ボタン ―― ★★文字が ぜんぶ 言います（★あそびかたは 0行 増えません）★★
       ★ ★T226・④：★★まだ 1回も ふって いない ときは「サイコロを ふる」。
         ★ ★★はじめて 来た 人は、★★★何も 出て いない 画面で この ボタンだけを 見ます。
         ★ ★★＝ ★押す ところが 1つしか 無い ので、迷いようが ありません（★§5.5「迷いを 消す」）。 */
    var left = rerollLeft();
    if (mine && g.rolls === 0) {
      btnRoll.classList.remove('hidden');
      btnRoll.disabled = false;
      btnRoll.textContent = 'サイコロを ふる';
    } else if (acting && left > 0) {
      btnRoll.classList.remove('hidden');
      btnRoll.disabled = false;
      btnRoll.textContent = 'ふり直す（あと' + left + '回）';
    } else {
      /* ★ 0回に なったら 消えます（★ルル §5-3）。
         ★ ★入れものの たけは 決め打ちなので、★★表は 1pxも 動きません。 */
      btnRoll.classList.add('hidden');
      btnRoll.disabled = true;
    }
    /* ★★★ ふり直せなく なった のに、ハッピーが まだ「ふり直そう！」と 言って いたら 言いかえる ★★★
       ★ ★★【★私の 失敗⑩・★トライ 🟡-2】
         ★ ★★はじめの ひとことは 2.6秒 出ます。★★その あいだに ふり直しを 2回 使いきると、
           ★ ★★ボタンは 消えて いるのに ふきだしは「ふり直そう！」の まま でした。
         ★ ★★＝ ★★画面が、★もう できない ことを すすめて いた。
       ★ ★★`sayKey === 'start'` の ときだけ 言いかえます ―― ★★だから **1試合に 多くて 1回**。
         ★ ★ルル §14「しゃべる 場面は 5つまで」を 1つも 増やして いません（★場面①の 2つ目の 声）。
       ⚠️★★ ★★「どれかの」です ―― ★★**どの 役かは 1文字も 言いません**（★追記②）。
         ★ ★★これは 決まり4・6（★13の 役の どれか 1つに 書く／点が つかなくても どこかに 書く）
           ★ ★そのもの であって、★★得な 手では ありません。★見張り ①-4 も 鳴りません。 */
    /* ★★ T230 ―― ★見る 目を `sayKey === 'start'` から **1手番に 1回**（`saidTurn`）に 変えました。
       ★ ★★理由：★★はじめの ことばの あとに「のこせるよ！」が 入る ように なった ので、
         ★ ★★`sayKey` は もう `'start'` とは かぎりません ―― ★★★そのままだと この 声が 死にます。
       ★ ★★出る 回数は 増えて いません（★`sayOrder` が 1手番 1回・はじめの 3手番 だけ に しぼります）。 */
    if (acting && left === 0) sayOrder('write');

    /* ★★ ロボットの 帯（★T230 から **合計点は 上の 帯へ**。★ここは 番の しるしと 書いた 役）★★
       ★ ★★何を 書いたか … ★書いた 直後の 0.7秒 だけ 出ます（★すでに 起きた 事実 だけ）*/
    for (i = 0; i < botEl.length; i++) {
      var seat = i + 1;
      botEl[i].move.textContent = (!over && g.cur === seat && g.botMove) ? g.botMove : '';
      botEl[i].el.classList.toggle('is-turn', !over && g.cur === seat);
      botEl[i].el.classList.toggle('has-move', !!botEl[i].move.textContent);
    }
  }

  /* ============================================================
     ★★★ T230 ―― ★ロボットの 点を 出す ときの **1つの 見方**（★2か所が 食いちがわない ため）
     ------------------------------------------------------------
       ★ ★ロボットが サイコロを ころがして いる 間は、★★**まだ 書いて いません**。
         ★ ★★だから 点は 動かしません（★T226 から あった `botFreeze` を そのまま 使います）。
       ★ ★★上の 帯（合計）と、★表の 中（1マスずつ）が ★★★同じ 関数を 通ります
         ★ ★―― ★片方だけ 先に 動いて 見えるのを、★★はじめから 作れなく して います。
     ============================================================ */
  /* ★ T230 ―― ★★見張り ㉑-2 が、★★★この 止めを **わざと 外して** 鳴らす ための 口。
     ★ ★0 に すると、★★ロボットが まだ 書いて いない のに 表に 点が 出ます
       ★ ★（★★＝ ★社長の ご指摘⑤「★ロボットの ふり方を 見せる」を 内がわから 壊す 形）。 */
  var FREEZE = { botSheet: 1 };
  function botSheetShown(seat) {
    if (!g) return null;
    return (FREEZE.botSheet && g.botFreeze && g.botFreeze.seat === seat && g.botFreeze.sheet)
           ? g.botFreeze.sheet : g.sheets[seat];
  }
  function botTotalShown(seat) {
    var sh = botSheetShown(seat);
    return sh ? C.totalOf(sh) : 0;
  }
  /* ★ 1マスぶん ―― ★★書いて いなければ 「―」（★社長：「点を 入れて ないなら ー」）*/
  function botCellText(seat, ci) {
    var sh = botSheetShown(seat);
    if (!sh || ci < 0) return '―';
    return sh[ci] == null ? '―' : String(sh[ci]);
  }

  /* ★ ハッピーの ひとこと（★5場面だけ・ルル §14）
     ★ ★key … ★いま 何を 言って いるか（★★言いかえて よいか の 見わけに 使います）*/
  function say(t, key) {
    if (!sayEl) return;
    sayEl.textContent = t;
    sayKey = key || '';
    sayEl.classList.remove('hidden');
    if (sayTimer) { root.clearTimeout(sayTimer); sayTimer = 0; }
    sayTimer = later(function () { sayEl.classList.add('hidden'); sayKey = ''; sayTimer = 0; }, 2600);
  }

  /* ★★★ T227 ―― ★★手番が 変わったら、★★★前の 手番の ことばは 消す ★★★
     ------------------------------------------------------------
       ★ ★★【★🎨アトが 写真で 見つけた もの・T227 §9-3】
         ★ ★「★ハッピーが『サイコロを ふろう！』と 言った まま ロボットの 手番に 入る ことが ある」
       ★ ★★中身：★`say()` の 2600ms は **人の 手番の はじめ**から 数えます。
         ★ ★★人が 2.6秒 より 速く 書くと（★★連打する 子は ふつうに 速い）、
           ★ ★★ロボットが ふって いる 最中に「サイコロを ふろう！」が 残ります。
           ★ ★★★＝ ★画面が、★★いま できない ことを すすめて いる。
       ★ ★★私の 失敗⑩（★ふり直せない のに「ふろう」）と **まったく 同じ 形** です。
         ★ ★★あちらは「★ボタンが 消えた のに ことばが 残る」、★こちらは「★手番が 変わった のに 残る」。
       ★ ★★直し方：★★**声は 1つも 足しません**（★ルル §14 の 5場面を 増やさない）。
         ★ ★★★消す だけ です。
       ⚠️★ ★★消すのは **人への 指図**だけ（★下の `ORDER`）。
         ★ ★★「ヨットが 出た！」「63に とどいた！」は ★★★もう 起きた 事実の 知らせ なので
           ★ ★★ロボットの 手番に 残って いても 嘘に なりません ―― ★消しません。
         ★ ★★（★これを 混ぜて 全部 消すと、★★人が 書いた 直後の よろこびが 260ms で 消えます）*/
  var SAY_ORDER = { start: 1, keep: 1, write: 1 };   /* ★ 人への 指図 ＝ ★人の 手番でしか 正しく ない ことば */

  /* ============================================================
     ★★★★ T230・★社長の ご指摘④ ―― ★★ハッピーが しゃべる ★★★★
     ------------------------------------------------------------
       ★ ★社長の 言葉：「★★ハッピー なにか しゃべるようにして。
         ★ ★『ボタンを押して サイコロを振ろう。』とか
         ★ ★★『変えたくないサイコロを クリックして ホールドしよう。』とか」

       ★★★ 何が いけなかったか（★正直に）★★★
         ★ ★T226 まで、★★ハッピーが 指図を 言うのは **1試合に 1回だけ** でした
           ★ ★（`startGame()` で 1回。★あとは 2回目の 手番から ずっと だまって います）。
         ★ ★★＝ ★社長の おっしゃる とおり、★★★しゃべって いません でした。

       ★★★ 線（★★ここを 間違えたら、この 直しは 追記② 違反に なります）★★★
       | ★言って よい | ★言っては いけない |
       |---|---|
       | ★★**どう さわるか**（★押す・のこす・書く）| ★★★**何を えらぶか**（★どの 目・どの 役）|
       | 「サイコロを ふろう！」 | ★★★「6を のこすと いい」 |
       | 「変えたくない サイコロを おすと のこせるよ！」 | ★★★「ここは あきらめよう」「あと1個で ヨット」 |
       | 「どれかの 役に 書こう！」（★★どの 役かは 言いません）| ★★★「フルハウスに 書こう」 |
         ★ ★★下の 3つは ぜんぶ **決まりそのもの**です（★決まり3・決まり4）。
           ★ ★★★得な 手は 1文字も ありません ―― ★見張り ①-4 も ⑲ も 鳴りません。

       ★★★ 「ホールド」を 使わない 理由（★★アイの お問い）★★★
         ★ ★★設計図 §9.6 の 例外リストに ありません（★ポーカーの 役10個・ヨットの 役6つ だけ）。
         ★ ★★この ゲームは もとから 「**のこす**」で 通して います（★青わく・ルル §5-2）。
           ★ ★→ ★★「のこす」に そろえます。★★★新しい 言葉を 1つも 増やして いません。
         ⚠️★ ★★§9.6：★変（小4）は 漢字。★★押す・残す は 中学 なので ひらがな。

       ★★★ しゃべりすぎない ための 決まり（★★アイの お問い）★★★
         ★ ①★★**1手番に、指図は 多くて 1回**（`saidTurn`）
         ★ ②★★**教える ことばは はじめの 3手番 だけ**（`turns`）――
           ★ ★★「のこす」「書く」は **1回 おぼえたら もう 要らない** ので 引っこめます。
           ★ ★★のこすのは「サイコロを ふろう！」＝ **あなたの 番だよ** の しるし（★毎手番）。
         ★ ③★★**2.6秒 で 消える**（`say()` の もとからの 時計）
         ★ ④★★★**押せなく なったら その場で 消える**（`hushOrder()`・T227／T228）
           ★ ★→ ★★出しっぱなしに なりません。★★★見張り ⑲ が 数えて います。
     ============================================================ */
  var SAY_PLAN = {
    /* ★ text … ★言う ことば　／　turns … ★★はじめの 何手番まで 言うか */
    start: { text: 'サイコロを ふろう！',                     turns: 99 },
    keep:  { text: '変えたくない サイコロを おすと のこせるよ！', turns: 3 },
    write: { text: 'どれかの 役に 書こう！',                   turns: 3 }
  };
  var saidTurn = {};                 /* ★ この 手番で もう 言った か（★1手番 1回）*/
  function sayOrder(key) {
    var p = SAY_PLAN[key];
    if (!p || !g || over) return;
    if (g.cur !== 0) return;                    /* ★★ 人の 手番でしか 言いません */
    if (g.turn >= p.turns) return;              /* ★★ はじめの n手番 だけ */
    if (saidTurn[key]) return;                  /* ★★ 1手番に 1回だけ */
    saidTurn[key] = 1;
    say(p.text, key);
  }
  /* ★ T228 ―― ★★消す 場面の スイッチ（★★見張り ㉕ が「書いた 瞬間」だけを 外します）*/
  var HUSH = { onWrite: 1 };
  function hushOrder() {
    if (!sayEl) return;
    if (!SAY_ORDER[sayKey]) return;
    sayEl.classList.add('hidden');
    sayKey = '';
    if (sayTimer) { root.clearTimeout(sayTimer); sayTimer = 0; }
  }
  function jump() {
    if (!happyMid) return;
    happyMid.classList.remove('is-jump');
    void happyMid.offsetWidth;
    happyMid.classList.add('is-jump');
  }

  /* ============================================================
     ★★★ 役の 説明（★T226・★社長の ご指摘⑥）★★★
     ------------------------------------------------------------
       ★ ★★中身は `yacht-core.js` の `CATS[].desc` から 作ります ―― ★★手書きの 表を 作りません
         ★ ★（★役を 直したら、説明も いっしょに 直る。★★2か所に 書かない）。
       ★★ 行数は **8行**：
         ★ ①1の目〜6の目（★6つを **1行に まとめました**）　②ボーナス
         ★ ③〜⑧ ★★社長が 挙げられた 6つ（★チョイス・フォーダイス・フルハウス・
           ★ ★S.ストレート・B.ストレート・ヨット）
         ★ ★★ルルの 納品文（T225 §8-3）は 1の目〜6の目を 1行ずつ 書いて 13行 でしたが、
           ★ ★★社長の ⑥は「★★6つの役が 何なのか」―― ★★★下の 段の 6つ の こと です。
           ★ ★★上の 6つは 決まりが 同じ なので 1行に まとめました（★13行 → **8行**）。
       ⚠️★★ ★★「どう 打つか」は 1文字も ありません（★追記②）。
     ============================================================ */
  function buildCatHelp() {
    var ul = $('catList');
    if (!ul) return 0;
    ul.textContent = '';
    var rows = [
      /* ⚠️★ 320×454 で 行が 2つに 折れて 読みにくかった ので 短く しました【★実測・T226】*/
      { name: '1の目 〜 6の目', desc: '出た 数だけ 点に なる（3が 3個なら 9点）', pt: '' },
      { name: 'ボーナス',
        desc: '1〜6の目の 合計が ' + C.BONUS_NEED + '点 いじょう',
        pt: '＋' + C.BONUS_PT + '点' }
    ], i;
    for (i = 0; i < C.CATS.length; i++) {
      if (!C.CATS[i].desc) continue;                 /* ★ 1〜6の目は 上で 1行に まとめました */
      rows.push({ name: C.CATS[i].name, desc: C.CATS[i].desc, pt: C.CATS[i].ptLabel || '' });
    }
    for (i = 0; i < rows.length; i++) {
      var li = document.createElement('li');
      var b = document.createElement('b'); b.className = 'cat-nm'; b.textContent = rows[i].name;
      var d = document.createElement('span'); d.className = 'cat-ds'; d.textContent = rows[i].desc;
      li.appendChild(b); li.appendChild(d);
      if (rows[i].pt) {
        var p = document.createElement('i'); p.className = 'cat-pt'; p.textContent = rows[i].pt;
        li.appendChild(p);
      }
      ul.appendChild(li);
    }
    return rows.length;
  }

  function fillLevelSelect(sel) {
    if (!sel) return;
    if (sel.options.length !== C.LEVELS.length) {
      sel.textContent = '';
      for (var i = 0; i < C.LEVELS.length; i++) {
        var o = document.createElement('option');
        o.value = String(i); o.textContent = C.LEVELS[i].label;
        sel.appendChild(o);
      }
    }
    sel.value = String(level);
  }

  /* ============================================================
     ★ 7. 外に 出す 口（★トライ・アト・見張り 用）
     ============================================================ */
  function now() {
    return {
      '★つよさ': C.LEVELS[level].label,
      '★何回目': g ? (Math.min(C.TURNS, g.turn + 1) + '回目 / ' + C.TURNS + '回') : '―',
      '★手番': g ? (over ? '終わり' : SEATS[g.cur]) : '―',
      '★いま 押せるか': canAct() ? 'はい' : 'いいえ',
      '★サイコロ': g && g.dice ? g.dice.join(' ') : '（★まだ 1つも 出て いません）',
      '★★ロボットが 何を 書いたか': g && g.botMove ? g.botMove : '（いま 出て いません）',
      '★のこして いる': g && g.dice ? (function () {
        var a = [], i; for (i = 0; i < C.NDICE; i++) if (g.keep[i]) a.push(g.dice[i]);
        return a.length ? a.join(' ') : '（なし）';
      })() : '―',
      '★ふり直し のこり': g ? rerollLeft() + '回' : '―',
      '★★ボタンの 文字': btnRoll ? (btnRoll.classList.contains('hidden') ? '（消えて います）' : btnRoll.textContent) : '―',
      '★じぶんの 点': g ? C.totalOf(g.sheets[0]) : '―',
      '★1〜6の 合計': g ? (C.upperSum(g.sheets[0]) + ' / ' + C.BONUS_NEED +
                          (C.bonusOf(g.sheets[0]) ? '（＋35点 ついて います）' : '')) : '―',
      '★書いた マス': g ? (C.filled(g.sheets[0]) + ' / ' + C.NCAT) : '―',
      /* ★ T226 ―― ★★ここも 決め打ちの [0,1,2,3] でした（★ルル T225 §11-1 の ⑰）*/
      '★みんなの 点': g ? (function () {
        var a = [], i; for (i = 0; i < C.NP; i++) a.push(C.totalOf(g.sheets[i]));
        return a.join(' / ');
      })() : '―',
      '★さいこう点': bestGet(),
      '★1マス': geo ? (geo.cellH + 'px') : '―',
      '★サイコロ 1個': geo ? (geo.die + 'px（★44pxに 対して ' + Math.round(geo.die / 44 * 100) + '%）') : '―'
    };
  }

  function seed(n) {
    seedFixed = (n | 0) || 0;
    return { '★種': seedFixed || '（毎回 ちがう）', '★次の 1回から 効きます': true };
  }

  function geoInfo() {
    return still(function () {
      layout();
      var r = stageEl.getBoundingClientRect();
      return {
        '画面': window.innerWidth + '×' + window.innerHeight,
        '器の中身': geo.W + '×' + geo.H,
        '★★ならび': geo.wide ? '横（左右に 分ける）' : 'たて',
        '★表の 1マス': stageEl ? (Math.round(cellEl.n1.getBoundingClientRect().width) + '×' + geo.cellH + 'px') : '―',
        '★表 ぜんたい': geo.sheetH + 'px（★7行 × ' + geo.cellH + 'px ＋ すきま 12px）',
        '★サイコロ 1個': geo.die + 'px（★44pxに 対して ' + Math.round(geo.die / 44 * 100) + '%）',
        '★サイコロ 5個 よこ': (geo.die * 5 + 24) + 'px',
        '★ボタンの 入れもの': Math.round($('btnRoll').parentNode.getBoundingClientRect().height) + 'px（★決め打ち）',
        '★役の 名前の 字': getComputedStyle(document.documentElement).getPropertyValue('--cell-f').trim(),
        '★点の 字': getComputedStyle(document.documentElement).getPropertyValue('--cell-n').trim(),
        'pane-a': geo.paneA + 'px ／ pane-b ' + geo.paneB + 'px',
        'ページ縦スクロール': document.documentElement.scrollHeight > window.innerHeight,
        'ページ横スクロール': document.documentElement.scrollWidth > window.innerWidth,
        'stage': Math.round(r.width) + '×' + Math.round(r.height)
      };
    });
  }

  /* ★ 走らせる（★遊ぶ 側と 同じ core を 通ります）*/
  function autoPlay(n, opt) {
    n = n || 3000; opt = opt || {};
    var lv = C.LEVELS[opt.level == null ? level : opt.level];
    var hu = C.HUMANS[opt.human == null ? 2 : opt.human];
    var t0 = Date.now();
    var hh = C.scoreHist(n, opt.seed || 4649, hu.o);
    var hb = C.scoreHist(n, (opt.seed || 4649) + 1, lv.o);
    var wr = C.winRateFrom(hh.h, hb.h) * 100;
    /* ★ T226 ―― ★★ロボットの 1手番は ふる 回数で 変わります（★A案）。
       ★ ★いちばん ありそうな 2.838回 で 見積もります（★★上の 線は 見張り ⑭ が 本物の 時計で 数えます）*/
    var botTurnMs = 2.838 * BOT.roll + BOT.write;
    var one = C.machineMs(botTurnMs) / 1000;
    var out = {
      '回数': n,
      '★ロボットの つよさ': lv.label, '★人の 打ち手': hu.label,
      '★★反則（同じ 役に 2回・12マス 埋まらない・目が 1〜6の 外）': hh.bad + hb.bad + '件',
      '★人が 勝つ': wr.toFixed(2) + '%（★五分 ' + C.evenPct().toFixed(2) + '%）',
      '★自分の 点': hh.avg.toFixed(2),
      '★点の ちらばり': '下 ' + C.pct(hh.list, 0) + '／4分の1 ' + C.pct(hh.list, .25) +
                        '／まん中 ' + C.pct(hh.list, .5) + '／上位1割 ' + C.pct(hh.list, .9) +
                        '／上 ' + C.pct(hh.list, 1),
      '★1〜6の 合計': hh.upper.toFixed(1) + ' / 63',
      '★35点ボーナスが つく': (hh.bonus * 100).toFixed(1) + '%',
      '★ヨットが 出る': (hh.yacht * 100).toFixed(1) + '%',
      '★0点を 書く': hh.zero.toFixed(2) + '回 / ' + C.TURNS + '回',
      '★手番': C.TURNS + '回（★かならず。★ばらつき 0）',
      '★★長さ【見立て】': '★人 ' + C.TURNS + '手番 × 6.0秒 ＋ ふる 動き ＋ ロボット ' + one.toFixed(1) +
                          '秒（★1手番 ' + Math.round(botTurnMs) + 'ms）＋ おわりの 画面 4.0秒 ＝ 約 ' +
                          ((C.TURNS * 6.0 + C.TURNS * 1.0 + one + 4)).toFixed(0) + '秒（★★トライが 測るまで 確定させません）',
      'かかった 時間': (Date.now() - t0) + 'ms'
    };
    console.log('[ヨット] autoPlay', out);
    return out;
  }

  /* ★ つよさ 3段 × 人の 分かり具合（★ルル §7-3 の 表を 本物の core で）
     ★ ★勝率は 走らせずに **たし算で** 出します（★ルル 検算7・core の winRateFrom）*/
  function rates(n) {
    n = n || 4000;
    var t0 = Date.now();
    var lh = [], i, out = { '回数': n + '（各 1人ぶん）', '数えかた': '★点の ちらばりから たし算（★誤差の もとは ちらばり だけ）' };
    for (i = 0; i < C.LEVELS.length; i++) lh.push(C.scoreHist(n, 11 + i, C.LEVELS[i].o));
    for (i = 0; i < 3; i++) {
      var hh = C.scoreHist(n, 21 + i, C.HUMANS[i].o), row = [];
      for (var l = 0; l < C.LEVELS.length; l++) {
        row.push(C.LEVELS[l].label + ' ' + (C.winRateFrom(hh.h, lh[l].h) * 100).toFixed(2) + '%');
      }
      out[C.HUMANS[i].label] = row.join('　');
    }
    out['かかった 時間'] = (Date.now() - t0) + 'ms';
    console.log('[ヨット] rates', out);
    return out;
  }

  /* ============================================================
     ★ 8. はみ出し・指の 的を 測る
     ------------------------------------------------------------
       ⚠️★★ ★★これは **いまの 画面の 大きさ** で 測ります。
          ★ ★320×568／320×480／812×375 は、★★本当に 窓を その 大きさに して から
            ★ ★これを 呼びます（★式で 決めない ―― ★ルル §16 失敗2 と 同じ 罠）。
     ============================================================ */
  var TOUCH_SEL = '.topbar .back,.howto,.start-button,.dialog-ok,.close-dialog,.roll-btn,.level-select,.die,.cell:not(:disabled)';
  function measureOnce() {
    var r = stageEl.getBoundingClientRect();
    var out = { over: 0, off: 0, offName: [], small: 0, smallName: [],
                scrollX: document.documentElement.scrollWidth > window.innerWidth,
                scrollY: document.documentElement.scrollHeight > window.innerHeight };
    var all = stageEl.querySelectorAll('.cell,.die,.roll-btn,.bot-cell'), i, q, d;
    for (i = 0; i < all.length; i++) {
      if (all[i].classList.contains('hidden')) continue;
      q = all[i].getBoundingClientRect();
      if (!q.width || !q.height) continue;
      d = Math.max(Math.round(r.left - q.left), Math.round(r.top - q.top),
                   Math.round(q.right - r.right), Math.round(q.bottom - r.bottom));
      if (d > out.over) out.over = d;
    }
    out.over = Math.max(0, out.over);
    var list = document.querySelectorAll(TOUCH_SEL);
    for (i = 0; i < list.length; i++) {
      var el = list[i];
      if (!el.offsetParent && el.tagName !== 'BODY') continue;
      var q2 = el.getBoundingClientRect();
      if (q2.width === 0 || q2.height === 0) continue;
      if (q2.left < -0.5 || q2.top < -0.5 || q2.right > window.innerWidth + 0.5 || q2.bottom > window.innerHeight + 0.5) {
        out.off++; out.offName.push(el.className || el.tagName);
      }
      /* ★ 表の 1マスは 44px を 割ります（★13マス 出す ため）。★数えて 記録だけ します。 */
      if (q2.width < 43.5 || q2.height < 43.5) { out.small++; out.smallName.push(el.className.split(' ')[0]); }
    }
    return out;
  }

  function fitTest(n) {
    n = n || 120;
    var kTitle = titleScreen.classList.contains('hidden');
    var kPlay = playScreen.classList.contains('hidden');
    var kg = g, kb = busy, ko = over;
    titleScreen.classList.add('hidden');
    playScreen.classList.remove('hidden');
    if (!g) {
      /* ★ T226 ―― ★★4枚 決め打ちを やめて `C.NP` から 作ります */
      var sh0 = [], q; for (q = 0; q < C.NP; q++) sh0.push(C.newSheet());
      g = { sheets: sh0, turn: 0, cur: 0, dice: [1, 1, 1, 1, 1],
            keep: [false, false, false, false, false], rolls: 1, over: false, botMove: '' };
    }
    build(); layout();
    var worst = 0, off = 0, small = 0, sx = 0, sy = 0, names = {}, sm = {};
    var rd = C.rng(90909);
    still(function () {
      for (var k = 0; k < n; k++) {
        /* ★ いろいろな 場面：★書いた マスの 数・出目・のこし方・のこり 回数 */
        var sh = C.newSheet(), i;
        var fillN = k % (C.NCAT + 1);
        var order = [];
        for (i = 0; i < C.NCAT; i++) order.push(i);
        for (i = 0; i < fillN; i++) {
          var j = i + Math.floor(rd() * (C.NCAT - i)), t = order[i]; order[i] = order[j]; order[j] = t;
          sh[order[i]] = Math.floor(rd() * 40);
        }
        g.sheets[0] = sh;
        for (i = 1; i < C.NP; i++) g.sheets[i][0] = [30, 6, 18][(i - 1) % 3];
        g.dice = C.rollDice(C.NDICE, rd);
        for (i = 0; i < C.NDICE; i++) g.keep[i] = rd() < 0.4;
        g.rolls = 1 + (k % 3);
        g.turn = fillN; g.cur = 0; over = false; busy = false;
        render(); layout();
        var m = measureOnce();
        if (m.over > worst) worst = m.over;
        off += m.off; small += m.small; if (m.scrollX) sx++; if (m.scrollY) sy++;
        for (i = 0; i < m.offName.length; i++) names[m.offName[i]] = 1;
        for (i = 0; i < m.smallName.length; i++) sm[m.smallName[i]] = (sm[m.smallName[i]] || 0) + 1;
      }
    });
    g = kg; busy = kb; over = ko;
    if (kTitle) titleScreen.classList.add('hidden'); else titleScreen.classList.remove('hidden');
    if (kPlay) playScreen.classList.add('hidden'); else playScreen.classList.remove('hidden');
    layout(); render();
    var out = {
      '★★画面': window.innerWidth + '×' + window.innerHeight,
      '調べた 場面': n,
      '★1マス': geo.cellH + 'px ／ ★サイコロ ' + geo.die + 'px',
      '★表 ぜんたい': geo.sheetH + 'px',
      '★はみ出し（一番 大きい）': worst + 'px',
      '★★押す ところが 画面外': off,
      '★44pxより 小さい もの': small,
      '横スクロールが 出た 場面': sx, '縦スクロールが 出た 場面': sy
    };
    if (off) out['画面外に 出た もの'] = Object.keys(names);
    if (small) out['44pxを 割った もの'] = sm;
    console.log('[ヨット] fitTest', out);
    return out;
  }

  /* ============================================================
     ★ 9. 見張りが 中を のぞく ための 口（★verify.js 用）
     ------------------------------------------------------------
       ⚠️★★ ★★これは 遊びの 中では 1度も 通りません。
          ★ ★★とくに `_probe.bestKeep` は **わざと 置いて いません** ――
            ★ ★★「のこすと よい サイコロ」を 画面が 知れる 口を 作らない ため です。
     ============================================================ */
  var probe = {
    /* ★ 中身（★見るだけ）*/
    state: function () {
      return { turn: g ? g.turn : -1, cur: g ? g.cur : -1, rolls: g ? g.rolls : 0,
               left: rerollLeft(), dice: g && g.dice ? g.dice.slice() : null,
               keep: g ? g.keep.slice() : [], over: over, busy: busy,
               sheet: g ? g.sheets[0].slice() : null, act: canAct(),
               /* ★ T226 ―― ★★「自分の 番だが、まだ 1回も ふって いない」を 見分ける ため */
               mine: isMyTurn(), botMove: g ? (g.botMove || '') : '',
               /* ★ T230 ―― ★★見張り ㉑ が「★中の 本当の 数」と 画面を 突き合わせる ための 口。
                  ★ ★★★出す ための 関数（botCellText）では なく、★★★中の 表 そのもの を 渡します
                    ★ ★（★出す 関数と くらべたら、★★同じ ものを 2回 見て いる だけ に なります）。 */
               botSheet: g ? g.sheets[1].slice() : null,
               bots: g ? (function () { var a = [], i; for (i = 1; i < C.NP; i++) a.push(C.totalOf(g.sheets[i])); return a; })() : [] };
    },
    /* ★ 出目を 仕こむ（★見張りが 同じ 場面を 何度でも 出す ため）*/
    setDice: function (a, rolls) {
      if (!g) return null;
      g.dice = a.slice(); g.rolls = rolls == null ? 1 : rolls;
      g.keep = [false, false, false, false, false];
      g.cur = 0; over = false; busy = false;
      render(); return g.dice.slice();
    },
    setSheet: function (a) { if (g) { g.sheets[0] = a.slice(); render(); } return g ? g.sheets[0].slice() : null; },
    /* ★ T226 ―― ★★「まだ 1つも ふって いない」に 戻す（★手番の はじめ そのもの）*/
    blankDice: function () {
      if (!g) return null;
      g.dice = null; g.rolls = 0; g.botMove = ''; g.botFreeze = null;
      g.keep = [false, false, false, false, false];
      over = false; busy = false;
      render(); return true;
    },
    setTurn: function (t, cur) { if (!g) return; g.turn = t; g.cur = cur == null ? 0 : cur; render(); },
    /* ★ 画面の 上の ならび（★DOM の 順番を そのまま）*/
    order: function () {
      var a = [], k = sheetEl.querySelectorAll('.cell'), i;
      for (i = 0; i < k.length; i++) a.push(k[i].dataset.cat);
      return a;
    },
    /* ★ 13マスの 見た目（★1マスずつ・★測る あいだ 動きを 止める）*/
    cellLook: function () {
      return still(function () {
        var out = [], k = sheetEl.querySelectorAll('.cell'), i;
        for (i = 0; i < k.length; i++) {
          var e = k[i], cs = getComputedStyle(e), q = e.getBoundingClientRect();
          /* ⚠️★★★ T230 ―― ★★ここは `lastChild` でした。★★★1マスの 中身が 3つに なった ので、
             ★ ★`lastChild` は **ロボットの 点** に なって います。
             ★ ★★名ざしで 取らないと、★★★見張り ⑬（「まだ ふって いない ときは ぜんぶ ―」）が
               ★ ★★★だまって 別の ものを 見に 行きます。★**名ざしに 直しました。** */
          var ptEl = e.querySelector('.cell-pt'), bpEl = e.querySelector('.cell-bp');
          out.push({ cat: e.dataset.cat, cls: e.className,
                     pt: ptEl ? ptEl.textContent : '',
                     bp: bpEl ? bpEl.textContent : '',      /* ★ T230 ―― ★ロボットの 点 */
                     look: [cs.backgroundColor, cs.color, cs.opacity, cs.boxShadow, cs.outlineWidth,
                            cs.borderWidth, cs.transform, cs.filter, cs.fontWeight,
                            ptEl ? getComputedStyle(ptEl).color : '',
                            ptEl ? getComputedStyle(ptEl).fontSize : '',
                            bpEl ? getComputedStyle(bpEl).color : '',
                            bpEl ? getComputedStyle(bpEl).fontSize : '',
                            getComputedStyle(e.firstChild).color].join('｜'),
                     w: Math.round(q.width), h: Math.round(q.height),
                     x: Math.round(q.left), y: Math.round(q.top) });
        }
        return out;
      });
    },
    /* ★ サイコロの 見た目 */
    dieLook: function () {
      return still(function () {
        var out = [], i;
        for (i = 0; i < C.NDICE; i++) {
          var e = dieEl[i], cs = getComputedStyle(e), q = e.getBoundingClientRect();
          out.push({ i: i, v: e.dataset.v, keep: e.classList.contains('is-keep'), cls: e.className,
                     pips: e.querySelectorAll('.pip').length,
                     look: [cs.backgroundColor, cs.boxShadow, cs.outlineWidth, cs.transform, cs.filter].join('｜'),
                     w: Math.round(q.width), h: Math.round(q.height) });
        }
        return out;
      });
    },
    /* ★ 本物の 指（★まん中を さして、その ものが 返るか）*/
    hitAt: function (x, y) {
      if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) return null;
      var e = document.elementFromPoint(x, y);
      if (!e) return null;
      return e.closest ? (e.closest('.cell,.die,button,a[href],[data-close]') || e) : e;
    },
    el: { die: dieEl, cell: cellEl, roll: function () { return btnRoll; }, sheet: function () { return sheetEl; },
          bot: function () { return botEl; }, band: function () { return botBand; } },
    layout: layout, render: render, still: still,
    startGame: startGame, beginTurn: beginTurn, throwDice: function (f) { return throwDice(f); },
    onDie: onDie, onRoll: onRoll, onCell: onCell, finish: finish,
    setLevel: function (n) { level = n | 0; return C.LEVELS[level].label; },
    level: function () { return level; },
    clearTimers: clearTimers, timers: function () { return timers.length; },
    buildCatHelp: buildCatHelp,
    BEST_KEY: BEST_KEY, BEST_KEY_OLD: BEST_KEY_OLD, GRID: GRID, SEATS: SEATS, ROLL_CEIL: ROLL_CEIL,
    BOT_MS: BOT_MS, BOT: BOT,
    /* ★ T226 ―― ★★見張り ⑭ が ロボットの 手番を 見る ための 口 */
    isMyTurn: isMyTurn,
    botMove: function () { return g ? (g.botMove || '') : ''; },
    botMoveShown: function () {
      var b = botEl[0]; return b ? b.move.textContent : '';
    },
    /* ★ T226 ―― ★★ロボットが「何回 ふって」「何回 画面に 出して」「何回 書いたか」の 台帳 */
    botLedger: function () { return { rolls: botLedger.rolls, shown: botLedger.shown, wrote: botLedger.wrote }; },
    /* ★ 転がりの 本当の 長さは **CSS が 持ち主**。★ここでは 聞くだけ（★数を 写さない）*/
    rollMs: function () {
      var cs = getComputedStyle(dieEl[0]);
      return { 'animation-duration': cs.animationDuration, 'animation-delay': cs.animationDelay };
    },
    sayNow: function () { return { text: sayEl.classList.contains('hidden') ? '' : sayEl.textContent, key: sayKey }; },
    /* ★ T227 ―― ★★見張り ⑲ が、★★★この 直しを **わざと 外して** 鳴らす ための 口。
       ★ ★★中身を 空に すると `hushOrder()` が 何も しなく なり、★T226 の 姿に 戻ります
         ★ ★（★★＝ ★見た目を 作りものに するのでは なく、★★★直しそのものを 外して 試せます）。 */
    SAY_ORDER: SAY_ORDER,
    /* ★ T228 ―― ★★見張り ⑲ が、★★★「書いた 瞬間の 消し」だけを 外して 鳴らす ための 口。
       ★ ★★`onWrite` を 0 に すると、★★席が 変わる ときの 消し（`botStep`）は 生きた まま
         ★ ★★★T228 の 姿（★書いた 直後 267ms だけ 残る）に そのまま 戻ります。
       ★ ★★★＝ ★これが「★トライが 実測した 病気」を もう一度 起こす ための 口 です
         ★ ★（★`SAY_ORDER` を 空に する ㉓ は T226 の 姿＝2.4秒 に 戻す もの ―― ★別の 病気）。 */
    HUSH: HUSH,
    /* ★ T230 ―― ★★見張り ㉑ が「★何を・何回 しゃべるか」を 数える ための 口。
       ★ ★★`turns` を 0 に すると その ことばが 出なく なります（★★わざと 壊す ため）。 */
    SAY_PLAN: SAY_PLAN,
    FREEZE: FREEZE,
    BONUS_TEXT: BONUS_TEXT,
    botCellText: botCellText, botTotalShown: botTotalShown,
    rollTimer: function () { return rollTimer; }
  };

  /* ============================================================
     ★ 10. つなぐ
     ============================================================ */
  function boot() {
    titleScreen = $('titleScreen'); playScreen = $('playScreen');
    stageEl = $('stage'); paneA = $('paneA'); paneB = $('paneB');
    sheetEl = $('sheet'); diceRow = $('diceRow'); botBand = $('botBand');
    btnRoll = $('btnRoll'); mePt = $('mePt'); meTurn = $('meTurn');
    meTurnL = $('meTurnL');         /* ★ T238 ―― ★左の 回数（★広い 画面だけ 見えます）*/
    botPt = $('botPt');             /* ★ T230・★社長の ご指摘② ―― ★ロボットの 合計点 */
    sayEl = $('say'); happyMid = $('happyMid'); meBand = $('meBand');
    resultWrap = $('resultWrap'); resultBox = $('resultBox');
    void resultBox;

    bestSweepOld();                 /* ★ T226 ―― ★13役の ころの 鍵を 片づける（★1回だけ）*/
    buildCatHelp();                 /* ★ T226・⑥ ―― ★役の 説明を データから 作る */
    fillLevelSelect($('levelTitle'));
    showBest();

    $('levelTitle').addEventListener('change', function () { level = parseInt(this.value, 10) || 0; });
    $('levelResult').addEventListener('change', function () { level = parseInt(this.value, 10) || 0; });
    $('btnStart').addEventListener('click', startGame);
    $('btnAgain').addEventListener('click', function () { resultWrap.classList.add('hidden'); startGame(); });
    $('btnRoll').addEventListener('click', onRoll);
    $('btnHowto').addEventListener('click', function () { $('helpDialog').showModal(); });
    var cl = document.querySelectorAll('[data-close]'), i;
    for (i = 0; i < cl.length; i++) {
      cl[i].addEventListener('click', (function (b) {
        return function () { $(b.dataset.close).close(); };
      })(cl[i]));
    }
    root.addEventListener('resize', function () { layout(); render(); });
    if (root.visualViewport) root.visualViewport.addEventListener('resize', function () { layout(); render(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  root.YACHT = {
    now: now, autoPlay: autoPlay, seed: seed, geo: geoInfo, fitTest: fitTest, rates: rates,
    /* ★ verify は 別の ファイル（verify.js）が ここに 差しこみます */
    verify: function () {
      return { '★NG': 1, '中身': ['★見張り（verify.js）が 読みこまれて いません'] };
    },
    _core: C, _probe: probe, _g: function () { return g; }
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
