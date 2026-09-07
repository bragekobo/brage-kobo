'use strict';
/* ============================================================
   ヨット ―― ★★見張り（verify）★★   T193 ／ 💻 コーダ
   ------------------------------------------------------------
   ★★ このファイルは 遊びの 中身を 1行も 持ちません。
      ★ ★中を のぞく 口は、`yacht-game.js` が 持って いる `window.YACHT._probe` を 通します。

   ★★★ なぜ **別ファイル** に したか（★社長への おこたえ）★★★
      ★ 大富豪（T184）は「★もう 公開ずみ の 本に 傷を つけない ため」に 別ファイルに しました。
        ★ ★ヨットは 私が いま 書いた ばかり なので、その 理由は ありません。★★でも 別に します：
      ★ ① ★★見張りが 遊びを 壊せない ―― ★時計を 借りる／返す 仕掛けが 本体と 同じ ファイルに あると、
          ★ ★★こわれた とき「ゲームが こわれて いる」ように 見えます（★T188 の 失敗⑪⑬ が まさに これ）。
      ★ ② ★★出荷の とき この 1行（`<script src="verify.js">`）を 消せば、★遊びは そのまま 動く。
      ★ ③ ★★`yacht-game.js` を 1文字も 触らずに 目を 足せる。
      ★ ★★代金：★中を のぞくのに `_probe` を 通す ぶん、★見張りの 書き方が 少し まわりくどい。

   ============================================================
   ★★★ 型の 9行（★この会社が 見張りで 学んだ こと。★大富豪 T184 → T188 から 写しました）★★★
   ============================================================
     ★① computed style を 信じない ―― ★★本物の 当たり（elementFromPoint）で 数える【T180】
     ★② ★★鳴らない ときに 黙って いる 方が 難しい ―― ★線が 引けない ものは
         ★ ★「鳴らす」のを やめて「読むための 数字」に 格下げする【T182 アト】
     ★③ ★★その 画面を 回さないと 鳴らない 見張りを 作らない ―― ★壊し方は
         ★ ★どの 大きさでも 鳴る 形に する【T181 トライ・T182 アト】
     ★④ ★★`★NG` は「数」であること・★わざと 壊して 鳴る ことを 見せる【T162・T163】
     ★⑤ ★★見張りは 見るだけ ―― ★さわった ものは 1つ 残らず 戻す【T144 §7-5】
     ★⑥ ★★数える 前に 後片づけを しない【T184 失敗⑥】
         ★ ★（★片づけて から 数えると、★数えたい ものが もう 消えて います）
     ★⑦ ★★入れ子に なるなら 積み木に する【T188 失敗⑬】
         ★ ★（★借りものの 箱を 1つだけ 持つと、★内がわが 外がわの 箱を 消します）
     ★⑧ ★★借りた ものは 必ず 綱に つなぐ【T188 失敗⑪】
         ★ ★（★打ち切られても 返る ように。★返し忘れると **次に 遊んだ 人**が こけます）
     ★⑨ ★★人に 見えるかを 数える 目は、必ず **画面が 描かれて いる とき** に 数える【T184 失敗⑨】

   ★★ ヨットでは ⑥〜⑨ を 踏まずに 済むはず ですが、★★⑧ だけは 張って あります ――
      ★ ★この 見張りは **時計を 借ります**（★ロボットの 0.6秒を 待たずに 13手番 走らせる ため）。

   ============================================================
   ★★★ この 1本に 要る 目（★ルル T192 §18 コーダ①〜⑩）★★★
   ============================================================
     ★★① ★★★「どの 役に 書くと 得か」を 教えて いないか（★★いちばん 大事な 目）
     ★★② サイコロの 目が 1〜6 に 収まって いるか・★5個 あるか
     ★★③ 13手番で 必ず 終わるか・★点の 合計が 合うか
     ★★④ ふり直しが 2回を こえて いないか
     ★★⑤ 320×568 に 入るか
   ============================================================ */

(function (root) {

  if (!root.YACHT || !root.YACHT._probe) return;      /* ★ 遊びを 止めない */
  var Y = root.YACHT, P = Y._probe, C = Y._core;
  var $ = function (id) { return document.getElementById(id); };

  /* ============================================================
     ★ 0. どうぐ箱
     ============================================================ */

  /* ★★ ⑧ 借りた ものを 返す 綱 ―― ★打ち切られても 60秒で ひとりでに 返る ★★ */
  var realSetTimeout = root.setTimeout, realClearTimeout = root.clearTimeout;
  var busyRun = null, runDepth = 0;

  function beginGuard() {
    if (busyRun) busyRun.release();
    var undo = [], watchdog = 0;
    var api = {
      add: function (f) { undo.push(f); },
      release: function () {
        if (watchdog) { realClearTimeout.call(root, watchdog); watchdog = 0; }
        while (undo.length) { try { undo.pop()(); } catch (e) {} }
        if (busyRun === api) busyRun = null;
      }
    };
    busyRun = api;
    watchdog = realSetTimeout.call(root, function () {
      if (root.console) console.warn('[ヨット] ★見張りが 途中で 止まりました。★借りた ものを 返します。');
      api.release();
    }, 60000);
    return api;
  }
  function guarded(fn) {
    if (runDepth > 0 && busyRun) return fn(busyRun);
    var api = beginGuard();
    runDepth++;
    try { return fn(api); } finally { runDepth--; api.release(); }
  }
  function wrap(fn) {
    return function () { var a = arguments, me = this; return guarded(function () { return fn.apply(me, a); }); };
  }

  /* ★★ ⑦ 時計の 箱は **借りる たびに 1つ**（★積み木に する）★★ */
  var clocks = [];
  function clockOn() {
    var realS = realSetTimeout, realC = realClearTimeout;
    var box = { q: [], seq: 0, now: 0 };
    clocks.push(box);
    var mine = function (f, ms) {
      var top = clocks.length ? clocks[clocks.length - 1] : null;
      if (!top) { if (root.setTimeout === mine) root.setTimeout = realS; return realS.call(root, f, ms); }
      var id = ++top.seq;
      top.q.push({ id: id, f: f, t: top.now + (ms || 0), s: top.seq });
      return id;
    };
    root.setTimeout = mine;
    root.clearTimeout = function (id) {
      var top = clocks.length ? clocks[clocks.length - 1] : null;
      if (!top) return realC.call(root, id);
      for (var i = 0; i < top.q.length; i++) if (top.q[i].id === id) { top.q.splice(i, 1); return; }
      return realC.call(root, id);
    };
    var done = false;
    var off = function () {
      if (done) return;
      done = true;
      var at = clocks.indexOf(box);
      if (at >= 0) clocks.splice(at, 1);
      if (!clocks.length) { if (root.setTimeout === mine) root.setTimeout = realS; root.clearTimeout = realC; }
    };
    if (busyRun) busyRun.add(off);
    return off;
  }
  /* ★★ T226 ―― ★★時計を **1こま だけ** 進める（★ロボットの 手番を こま送りで 見る ため）★★
     ★ ★★これが 無いと `pump()` が 一気に 全部 走らせて しまい、
       ★ ★★「ロボットが 何を 見せたか」を 1こまも 数えられません。 */
  function pumpOne() {
    var box = clocks.length ? clocks[clocks.length - 1] : null;
    if (!box || !box.q.length) return false;
    var b = 0;
    for (var i = 1; i < box.q.length; i++) {
      if (box.q[i].t < box.q[b].t || (box.q[i].t === box.q[b].t && box.q[i].s < box.q[b].s)) b = i;
    }
    var job = box.q.splice(b, 1)[0];
    box.now = job.t;
    try { job.f(); } catch (e) { vErr.push(String(e && e.message || e)); }
    return true;
  }
  function clockNow() {
    var box = clocks.length ? clocks[clocks.length - 1] : null;
    return box ? box.now : 0;
  }
  function pump(limit) {
    var n = 0;
    if (!clocks.length) return 0;
    while (n++ < (limit || 4000)) { if (!pumpOne()) break; }
    return n;
  }
  var vErr = [];

  /* ★ 種を 借りる（★終わったら 返す）*/
  function withRandom(s, fn) {
    var keep = Math.random, r = C.rng(s);
    Math.random = r;
    if (busyRun) busyRun.add(function () { if (Math.random === r) Math.random = keep; });
    try { return fn(); } finally { if (Math.random === r) Math.random = keep; }
  }

  /* ★ 本物の 指（★pointerdown → pointerup → click）*/
  function realTap(el) {
    if (!el) return false;
    var q = el.getBoundingClientRect();
    var x = q.left + q.width / 2, y = q.top + q.height / 2;
    var opt = { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, isPrimary: true };
    try {
      if (root.PointerEvent) {
        el.dispatchEvent(new PointerEvent('pointerdown', opt));
        el.dispatchEvent(new PointerEvent('pointerup', opt));
      }
      el.dispatchEvent(new MouseEvent('click', opt));
      return true;
    } catch (e) { return false; }
  }

  /* ★ 遊ぶ 画面を 出して おく（★測る ため。★あとで 戻します）*/
  function onStage(api) {
    var t = $('titleScreen'), p = $('playScreen'), r = $('resultWrap');
    var kt = t.classList.contains('hidden'), kp = p.classList.contains('hidden'),
        kr = r.classList.contains('hidden');
    api.add(function () {
      if (kt) t.classList.add('hidden'); else t.classList.remove('hidden');
      if (kp) p.classList.add('hidden'); else p.classList.remove('hidden');
      if (kr) r.classList.add('hidden'); else r.classList.remove('hidden');
      try { P.layout(); P.render(); } catch (e) {}
    });
    t.classList.add('hidden'); p.classList.remove('hidden'); r.classList.add('hidden');
  }

  /* ★ 1試合 まるごと 走らせる（★時計を 借りて 早送り。★本物の 決まりの まま）*/
  function runOneGame(seed, tapper) {
    var off = clockOn();
    var log = { turns: 0, writes: 0, rollsMax: 0, badDie: 0, dieN: [], doubleWrite: 0,
                autoRoll: 0, autoStop: 0, err: [], firstRollTaps: 0, stuck: 0 };
    try {
      Y.seed(seed);
      P.startGame();
      pump(200);
      var guard = 0;
      while (guard++ < 400) {
        var st = P.state();
        if (st.over) break;
        /* ★★ T226・④ ―― ★★手番の はじめは サイコロが 1つも 出て いません。
           ★ ★★人が「サイコロを ふる」を 押す ところ から 始まります
             ―― ★★これを 忘れると、★★★見張りが ここで 止まります（★私は 1回 止めました）。 */
        if (st.mine && st.rolls === 0) {
          log.firstRollTaps++;
          realTap(P.el.roll());
          if (P.state().rolls === 0) { log.stuck++; break; }
          continue;
        }
        if (!st.act) { if (!pump(200)) break; continue; }
        /* ★ 人の 手番 ―― ★★ふり直しの 回数を ここで 数えます */
        var before = st.rolls;
        if (st.dice) {
          log.dieN.push(st.dice.length);
          for (var d = 0; d < st.dice.length; d++) if (st.dice[d] < 1 || st.dice[d] > 6) log.badDie++;
        }
        if (tapper) tapper(st, log);
        st = P.state();
        if (st.rolls > log.rollsMax) log.rollsMax = st.rolls;
        /* ★★ 自動で ふり直して いないか ―― ★人が 何も しなければ 1つも 進まない はず */
        void before;
        /* ★ 書く（★空いて いる いちばん 上の マスへ。★★中身を 見て えらんで いません）*/
        var sh = st.sheet, wrote = false;
        for (var i = 0; i < C.NCAT; i++) {
          if (sh[i] == null) {
            var el = P.el.cell[C.CATS[i].id];
            if (el && !el.disabled) { realTap(el); wrote = true; log.writes++; }
            break;
          }
        }
        if (!wrote) break;
        pump(400);
      }
      pump(1200);
      var fin = P.state();
      log.turns = fin.turn;
      log.filled = fin.sheet ? C.filled(fin.sheet) : -1;
      log.total = fin.sheet ? C.totalOf(fin.sheet) : -1;
      log.over = fin.over;
    } catch (e) { log.err.push(String(e && e.message || e)); }
    off();
    Y.seed(0);
    /* ⚠️★★★ 1試合 走らせると **おわりの 画面が 出たまま** に なります【★私の 失敗⑤・T193】★★★
       ★ ★これは `position:fixed; inset:0` ―― ★★画面 ぜんたいを おおう 1枚 です。
       ★ ★★そのせいで、次の ⑤-3（本物の 指）が **19個 とも 当たらない** と 鳴りました。
         ★ ★★当たって いたのは この おおいの ほう でした ―― ★盤は 何も こわれて いません。
       ★ ★★＝ ★型の ⑤「さわった ものは 1つ 残らず 戻す」を、★私が ここで 落として いました。
         ★ ★★見張りが 自分で 作った ごみで、自分が 鳴って いた。★★いちばん たちが 悪い 形 です。 */
    $('resultWrap').classList.add('hidden');
    return log;
  }

  /* ============================================================
     ★★★ 1. verify 本体 ★★★
     ============================================================ */
  function verify(n) {
    return guarded(function (api) { return runVerify(n, api); });
  }

  function runVerify(n, api) {
    n = n || 60;
    var t0 = Date.now(), ng = [], note = {}, i, j;
    vErr = [];

    /* ============================================================
       ★★★ 帯の 字の 床 ―― ★★1か所に まとめました（★T241・💻コーダ・2026-09-06）
       ------------------------------------------------------------
       ★ ★★社長の お決め（★2026-09-06 その2）で、★上の 帯の 字の 床が
         ★ ★★**10.5px → 8px** に 下がりました（★🎨アト T240-2）。
       ⚠️★ ★★★なぜ「1か所」に するか ―― ★★今回 まさに その 事故が 起きた から です：
         ★ ★★同じ「上の 帯の 字の 床」なのに、★★★㉒ は **11**・㉙-2 は **10.5** と
           ★ ★★別々に 書いて ありました。★★社長の お決めで 片方だけ 直すと、
             ★ ★★★もう 片方が 黙って 古い まま に なります。
         ★ ★★→ ★決め打ちの 数は **1つ**。★★見る 場所は 3つ（★㉒・㉙-2・㉛-2）。
       ★ ★★★決め打ちの ままです（★会社の 決まり「見張りの 見本は 決め打ちに する」）――
         ★ ★★CSS から 読んで いません。★★★読んだら「見張って いる ふり」に なります。
       ============================================================ */
    var OBI_YUKA = 8;

    /* ★ もとの じょうたいを ぜんぶ おぼえる（★⑤ 見張りは 見るだけ）*/
    var kSheet = null, kState = P.state();
    if (Y._g()) kSheet = kState.sheet ? kState.sheet.slice() : null;
    /* ★★★ T232 で 足しました ―― ★★★ロボットの 表（`sheets[1]`）★★★
       ★ ★★ここに 穴が ありました【★T232・💻コーダ・★★私の しくじり】：
         ★ ★★下の 戻しは `P.setSheet` しか 使って いません ―― ★★それは **人の 表だけ** を 戻します
           ★ ★（★`yacht-game.js`：`setSheet: function (a) { g.sheets[0] = a.slice(); … }`）。
         ★ ★★見張りの 中では `P.startGame()` を **14回** 呼びます。★★★そのたびに 両方の 表が 空に なり、
           ★ ★★おわりに 戻るのは 人の 表だけ ―― ★★★ロボットの 点が **消えた まま** でした。
       ★ ★★実測【★T232・10画面 とも】：★見張りの 前 `[1,null,6,4,null,0,…]` → ★★後 ぜんぶ null。
         ★ ★★上の 帯も「ロボット 11」→「ロボット 0」に なって いました。
       ⚠️★ ★★★これは ㉕ を 貼った せいでは ありません ―― ★★貼る 前の 控えでも 同じ でした
         ★ ★（★`logs/T232_計測どうぐ_コーダ/out_b_maeato.txt`。★★先に 自分を 疑いました）。
       ★ ★★戻し口が 無いので、★`Y._g()` の 中の 表へ **じかに** 書きます
         ★ ★（★★`yacht-game.js` は 1バイトも 触って いません）。 */
    var kBotSheet = (Y._g() && kState.botSheet) ? kState.botSheet.slice() : null;
    var RESTORE_BOT = 1;              /* ★ ㊻ が これを 0 に して、★㉖ が 鳴る ことを 見せます */
    var kLevel = P.level();
    function restoreAll() {
      try {
        /* ★★★ T226 で 足しました ―― ★★見張りの あと、遊びが そのまま つづく ように ★★★
           ★ ★★ハーツで 7度 起きた こと：★★★見張りを 足すと、その 見張りが 遊びを 止める。
           ★ ★①★★積み のこった 時計を 落とす（★★★ロボットの 手番の 途中で 止めた ものが
             ★ ★★あとから 走ると、★人の 手番に ロボットの サイコロが 出ます）
           ★ ②★★つよさを 戻す（★⑭ が「つよい」に して います）
           ★ ③★★開けた ダイアログを 閉じる（★⑮ が 開けます）
           ★ ④★中身を もとの ところへ 戻す */
        P.clearTimers();
        P.setLevel(kLevel);
        try { if ($('helpDialog').open) $('helpDialog').close(); } catch (e2) {}
        if (Y._g() && kSheet) {
          P.setSheet(kSheet);
          /* ⚠️★★★ ここに わなが ありました【★T226・私の 失敗】――
             ★ ★もとは `P.setDice(kState.dice || [1,1,1,1,1], kState.rolls || 1)` でした。
             ★ ★★T226 から、手番の はじめは `dice === null`・`rolls === 0` です。
               ★ ★★`|| 1` が それを **「もう 1回 ふった」に すりかえて** しまいます
                 ―― ★★★見張りを かけた だけで、★ふる 楽しみが 1回 消える。
             ★ ★→ ★★出て いなかった なら、出て いない ままに 戻します。 */
          if (kState.dice) P.setDice(kState.dice, kState.rolls);
          else P.blankDice();
          /* ★★★ T232 ―― ★ロボットの 表を 戻す（★★戻し口が 無いので 中へ じかに）★★★ */
          if (RESTORE_BOT && kBotSheet) {
            var gg = Y._g();
            if (gg && gg.sheets && gg.sheets[1]) gg.sheets[1] = kBotSheet.slice();
          }
          P.setTurn(kState.turn, kState.cur);
          /* ★ ロボットの 手番の 途中だった なら、その 手番を やり直します（★止めたまま に しない）*/
          if (kState.cur !== 0 && !kState.over) P.beginTurn();
        }
        P.layout(); P.render();
      } catch (e) {}
    }
    /* ============================================================
       ⚠️★★★★ あそびかたが 開いた まま だと、★★見張りが **うそ**を つきます
       ------------------------------------------------------------
       ★ ★★🧪トライ T239 🟡-1【★12画面 とも 再現・★私の 手もとでも 再現しました】：
         ★ ★★「？ 遊び方」を 開いた まま `verify()` を 呼ぶと ―― ★★★NG が **4件** 増える。
           ★ ★★・「まん中を さしても 当たらない ものが あります：サイコロ1〜5・n1・…・@bonus」
           ★ ★★・「はじめの 画面：『サイコロを ふる』に 指が 0/5点 しか 当たりません」
           ★ ★★・「はじめる が 押せない：指が 当たる 帯が 0px」
           ★ ★★・「つよさの えらびに 指が 当たる 帯が 0px」
       ★ ★★わけ ―― ★★★`showModal()` の ダイアログは **いちばん 上の 段**に 出ます。
         ★ ★★`document.elementFromPoint()` は そこで 止まる ので、★★下の ボタンには
           ★ ★★★1つも 当たりません。★＝ ★★画面は 壊れて いません。★★★測り方が 塞がれて いました。
       ★ ★★★重い のは ―― ★★次に 走らせる 人が **おばけを 追いかける** から です。
         ★ ★★トライは 実際に 追いかけ、★「連打で 壊れた」と 一度 書きかけました（★T239 §6-2）。
       ★ ★→ ★★**測る あいだ だけ 閉じ、★★★おわりに 開き直します**（★型の ⑤「さわった ものは 戻す」）。
         ★ ★★「その4つを 数えない」に しなかった わけ：★★★数えない ＝ 目が 4つ 減る こと です。
           ★ ★★閉じて 測れば、★4つの 目は **生きた まま** 正しい 答えを 出します。
       ⚠️★ ★★戻しの 順番（★積み木は **後入れ先出し**）：
         ★ ★★ここで 先に 積む → ★`restoreAll`（★ここでも 閉じます）→ ★`onStage` の 順に 積む
           ★ ★★＝ ★戻る ときは ★onStage → restoreAll → ★★★いちばん 最後に この 開き直し。
           ★ ★★★先に 積まないと、★restoreAll が あとから 閉じて しまいます。
       ============================================================ */
    var kHelpOpen = false;
    api.add(function () {
      try {
        if (kHelpOpen) { var hd1 = $('helpDialog'); if (hd1 && !hd1.open) hd1.showModal(); }
      } catch (e) {}
    });
    try {
      var hd0 = $('helpDialog');
      if (hd0 && hd0.open) { kHelpOpen = true; hd0.close(); }
    } catch (e) {}
    if (kHelpOpen) note['★あそびかた'] =
      '★開いて いたので、★★測る あいだ 閉じました（★★★おわりに 開き直します）';

    api.add(restoreAll);
    onStage(api);

    /* ★ 遊べる じょうたいを 1つ 作る（★まだ 走らせて いない ときの ため）*/
    if (!Y._g()) { withRandom(11111, function () { P.startGame(); }); }
    P.layout();

    /* ============================================================
       ★★★★★ ① いちばん 大事な 目 ★★★★★
       ★★★「どの 役に 書くと 得か」を 教えて いないか
       ------------------------------------------------------------
       ★ ★ルル §5-4：★★「のこす 目を 光らせたら、★残るのは『ふる』だけ です」。
       ★ ★★文字あわせでは 数えません（★ハーツ T168 で 3通り すり抜けた やり方）――
         ★ ★★**画素で くらべます**：★空いて いる 13マスの 見た目が
           ★ ★★点が 0 でも 50 でも **1文字も ちがわない** ことを 数えます。
       ============================================================ */
    var t1 = { pairs: 0, diff: [], zeroN: 0, hiN: 0 };
    (function () {
      /* ★ わざと「0点の マス」と「高い 点の マス」が 同時に 出る 出目を 作る
         ★ ★1,1,1,1,1 … ★1の目 5点／ヨット 50点／2の目〜6の目 ぜんぶ 0点 */
      var scenes = [[1, 1, 1, 1, 1], [2, 3, 4, 5, 6], [6, 6, 6, 6, 1], [1, 2, 2, 3, 3], [5, 5, 5, 2, 2]];
      var seen = {};
      for (var s = 0; s < scenes.length; s++) {
        P.setSheet(C.newSheet());
        P.setDice(scenes[s], 1);
        var look = P.cellLook();
        var base = null;
        for (var k = 0; k < look.length; k++) {
          var L = look[k];
          if (L.cat === '@bonus') continue;
          if (L.cls.indexOf('is-open') < 0) continue;
          var pt = parseInt(L.pt, 10);
          if (pt === 0) t1.zeroN++; else if (pt >= 25) t1.hiN++;
          if (base === null) { base = L; continue; }
          t1.pairs++;
          if (L.look !== base.look) {
            var key = L.cat + '/' + base.cat;
            if (!seen[key]) {
              seen[key] = 1;
              t1.diff.push('出目 ' + scenes[s].join('') + '：' + base.cat + '(' + base.pt + '点) と ' +
                           L.cat + '(' + L.pt + '点) の 見た目が ちがう');
            }
          }
          /* ★ 大きさ・置き場所も ちがっては いけません（★上に 動かす・大きく する も 教えです）*/
          if (L.h !== base.h || L.w !== base.w) {
            t1.diff.push('出目 ' + scenes[s].join('') + '：' + L.cat + ' だけ 大きさが ちがう（' +
                         L.w + '×' + L.h + ' ／ ' + base.w + '×' + base.h + '）');
          }
        }
      }
    })();
    for (i = 0; i < t1.diff.length; i++) {
      ng.push('★★★★ 空いて いる マスの 見た目が 点で 変わって います：' + t1.diff[i] +
              '（★★これが 追記②「気づくことを 先に 奪う」そのもの です・★−12.07ポイント）');
    }
    if (t1.zeroN < 5 || t1.hiN < 3) {
      ng.push('★★見張りが 死んで います：★0点の マス ' + t1.zeroN + '個・高い マス ' + t1.hiN +
              '個 しか 出て いません（★どちらも 何個か 要ります）');
    }
    note['① ★★★点で 見た目が 変わらないか'] = '★くらべた 組 ' + t1.pairs + '／★ちがい ' + t1.diff.length +
      '件（★0点の マス ' + t1.zeroN + '回・25点以上の マス ' + t1.hiN + '回 を ふくむ）';

    /* ★ ①-2 サイコロも 同じ ―― ★人が 押した ぶん だけ 青わく */
    var t12 = { on: 0, why: [] };
    (function () {
      P.setDice([6, 6, 1, 2, 3], 1);
      var look = P.dieLook(), k;
      for (k = 0; k < look.length; k++) if (look[k].keep) t12.on++;
      if (t12.on !== 0) t12.why.push('★★★だれも 押して いないのに ' + t12.on + '個 光って います（★★−19.85ポイントの 遊び）');
      /* ★ 見た目が ぜんぶ 同じ か（★「のこすと よい 6」だけ ちがう、が 起きて いない か）*/
      var base = look[0].look;
      for (k = 1; k < look.length; k++) {
        if (look[k].look !== base) t12.why.push('★★★押されて いない サイコロの 見た目が ちがう（' + k + '個目）');
      }
      /* ★ 本物の 指で 1個 押したら、★その 1個 だけ 光る か */
      realTap(P.el.die[0]);
      look = P.dieLook();
      var on = [], k2;
      for (k2 = 0; k2 < look.length; k2++) if (look[k2].keep) on.push(k2);
      if (on.length !== 1 || on[0] !== 0) t12.why.push('★★指で 1個 押したのに 光ったのは ' + on.length + '個（' + on.join(',') + '）');
      realTap(P.el.die[0]);                       /* ★ 戻す */
      look = P.dieLook();
      for (k2 = 0; k2 < look.length; k2++) if (look[k2].keep) t12.why.push('★もう一度 押しても 消えません（' + k2 + '個目）');
    })();
    for (i = 0; i < t12.why.length; i++) ng.push(t12.why[i]);
    note['①-2 ★★青わくは 人の 指の ぶん だけ'] = t12.why.length ? '★★' + t12.why.length + '件' : '○ 押した 1個だけ 光り、もう一度 押すと 消える';

    /* ★ ①-3 ならびが 動いて いないか（★点の 高い 順に 並べかえるのも 教えです）*/
    var order = P.order(), want = P.GRID.join(','), got = order.join(',');
    if (want !== got) ng.push('★★★役の ならびが 変わって います（★点の 高い 順に 並べかえるのは 追記② 違反）：' + got);
    note['①-3 ★ならび'] = got === want ? '○ 2列×6行 ＋ ボーナスの 行（★13マス・T230）' : '★★' + got;

    /* ★ ①-4 画面と 遊び方に「手を 教える 言葉」が 無いか
       ★ ★★ハーツ T168 の 教え：★言い回しを 並べる やり方では、言い回しの 数だけ すきまが できる。
         ★ ★→ ★★「①のこす／書く／ねらう と いう 動詞」＋「②勧め・断定の 言い方」の **組**で 見ます。 */
    var t14 = { hits: [] };
    (function () {
      var texts = [];
      var pick = document.querySelectorAll('#helpDialog, .talk .banner, .mascot .bubble, .start-card, .result-box, .me-band, .bot-band');
      for (var k = 0; k < pick.length; k++) texts.push(pick[k].textContent || '');
      /* ★ ハッピーが 言う ことばは JS の 中にも あります ―― ★出て いる ぶん だけ 見ます */
      var verb = /(のこ|残|えらん|えらび|ねら|狙|書い|書こ|そろえ|あきらめ|捨て|すて)/;
      var push = /(と いい|といい|ほうが|方が|しよう|しましょ|おすすめ|オススメ|ここが|ここに|あと ?[0-9１-９]|あと1|するべき|べきです|正かい|正解)/;
      for (k = 0; k < texts.length; k++) {
        var t = texts[k].replace(/\s+/g, ' ');
        var sent = t.split(/[。！!？?\n]/);
        for (var s = 0; s < sent.length; s++) {
          if (verb.test(sent[s]) && push.test(sent[s])) t14.hits.push(sent[s].slice(0, 40));
        }
      }
    })();
    for (i = 0; i < t14.hits.length; i++) {
      ng.push('★★★手を 教える 文が 画面に あります：「' + t14.hits[i] + '」（★追記②）');
    }
    note['①-4 ★手を 教える 文'] = t14.hits.length ? '★★' + t14.hits.length + '件' : '○ 0件';

    /* ============================================================
       ★★ ② サイコロの 目が 1〜6 に 収まって いるか・5個 あるか
       ============================================================ */
    var t2 = { n: 0, bad: 0, pipBad: 0, seen: [0, 0, 0, 0, 0, 0, 0] };
    withRandom(24680, function () {
      for (var k = 0; k < 400; k++) {
        P.throwDice(true);
        var st = P.state();
        if (!st.dice || st.dice.length !== C.NDICE) { t2.bad++; continue; }
        for (var d = 0; d < st.dice.length; d++) {
          t2.n++;
          if (st.dice[d] < 1 || st.dice[d] > 6 || st.dice[d] !== Math.floor(st.dice[d])) t2.bad++;
          else t2.seen[st.dice[d]]++;
        }
        if (k % 40 === 0) {
          P.render();
          var look = P.dieLook();
          for (d = 0; d < look.length; d++) if (look[d].pips !== parseInt(look[d].v, 10)) t2.pipBad++;
        }
      }
    });
    if (t2.bad) ng.push('★★★サイコロの 目が 1〜6の 外、または 5個 ありません（' + t2.bad + '件）');
    if (t2.pipBad) ng.push('★★★サイコロの 丸の 数と 目の 数が 合いません（' + t2.pipBad + '件）');
    for (i = 1; i <= 6; i++) if (!t2.seen[i]) ng.push('★★' + i + 'の 目が 1度も 出ません（★2000回 ふって）');
    note['② ★サイコロ'] = t2.n + '個 ふって 外れ ' + t2.bad + '件／丸の 数 ちがい ' + t2.pipBad +
      '件／出た 数 ' + t2.seen.slice(1).join('・');

    /* ============================================================
       ★★ ③ 13手番で 必ず 終わるか・点の 合計が 合うか
       ★  ④ ふり直しが 2回を こえて いないか
       ------------------------------------------------------------
       ★ ★★本物の 画面を、★★本物の 指で、★時計だけ 早送りに して 走らせます
         ―― ★★写しの エンジンを 作りません（★決まりを 2か所に 書かない）。
       ============================================================ */
    var t3 = { games: 0, badTurn: 0, badFill: 0, badTotal: 0, overRoll: 0, maxRoll: 0, err: [] };
    var t4 = { pressed: 0, rolled: 0 };
    (function () {
      for (var k = 0; k < 4; k++) {
        var log = runOneGame(70001 + k, function (st, lg) {
          /* ★★ ふり直す ボタンを **5回** 押します（★2回までしか きかない はず）*/
          var btn = P.el.roll();
          for (var q = 0; q < 5; q++) {
            t4.pressed++;
            var was = P.state().rolls;
            realTap(btn);
            if (P.state().rolls > was) t4.rolled++;
          }
          void lg;
        });
        t3.games++;
        if (log.turns !== C.TURNS) t3.badTurn++;
        if (log.filled !== C.NCAT) t3.badFill++;
        if (log.rollsMax > C.REROLL + 1) { t3.overRoll++; }
        if (log.rollsMax > t3.maxRoll) t3.maxRoll = log.rollsMax;
        for (var e = 0; e < log.err.length; e++) t3.err.push(log.err[e]);
        /* ★ 点の 合計 ―― ★★13マスの 合計 ＋ ボーナス と 合うか */
        var sh = P.state().sheet;
        if (sh) {
          var s = 0;
          for (var i2 = 0; i2 < C.NCAT; i2++) if (sh[i2] != null) s += sh[i2];
          var want = s + (C.upperSum(sh) >= C.BONUS_NEED ? C.BONUS_PT : 0);
          if (want !== C.totalOf(sh)) t3.badTotal++;
          var shown = parseInt(($('mePt').textContent || '0'), 10);
          if (shown !== want) { t3.badTotal++; t3.err.push('画面の 点 ' + shown + ' ／ 中の 点 ' + want); }
        }
      }
    })();
    if (t3.badTurn) ng.push('★★★' + C.TURNS + '手番で 終わって いません（' + t3.badTurn + ' / ' + t3.games + '試合）');
    if (t3.badFill) ng.push('★★★' + C.NCAT + 'マスが 埋まって いません（' + t3.badFill + ' / ' + t3.games + '試合）＝ 同じ 役に 2回 書けて いる か、書き のこし');
    if (t3.badTotal) ng.push('★★★点の 合計が 合いません（' + t3.badTotal + '件）' + (t3.err.length ? '：' + t3.err[0] : ''));
    if (t3.overRoll) ng.push('★★★★ふり直しが ' + C.REROLL + '回を こえて います（★ふった 回数 ' + t3.maxRoll + '回・★1回目 ＋ ふり直し ' + C.REROLL + '回 ＝ ' + (C.REROLL + 1) + '回 が 上限）');
    note['③ ★' + C.TURNS + '手番・点の 合計'] = t3.games + '試合 ／ 手番ちがい ' + t3.badTurn + '・マスちがい ' + t3.badFill +
      '・点ちがい ' + t3.badTotal + '件';
    note['④ ★★ふり直し 2回'] = '★ボタンを ' + t4.pressed + '回 押して、★★ふれたのは ' + t4.rolled +
      '回／★1手番で ふった 最大 ' + t3.maxRoll + '回（★上限 ' + (C.REROLL + 1) + '回）';
    if (vErr.length) note['③-2 ★中で こけた'] = vErr.slice(0, 3).join(' ／ ');

    /* ★★ ④-2 自動で ふり直して いない・自動で 止めて いない
       ★ ★★人が 何も しなければ、★★1つも 進まない はず（★ルル §5-2：9手番に 1回 やめる ほうが 得）*/
    var t42 = { moved: 0 };
    (function () {
      var off = clockOn();
      P.setDice([1, 2, 3, 4, 5], 1);
      var a = P.state();
      pump(3000);                                  /* ★ 時間だけ どんどん 進める */
      var b = P.state();
      if (a.rolls !== b.rolls) t42.moved++;
      if (a.keep.join() !== b.keep.join()) t42.moved++;
      if (a.sheet.join() !== b.sheet.join()) t42.moved++;
      off();
    })();
    if (t42.moved) ng.push('★★★★人が 何も して いないのに 手番が 進みました（★自動で ふり直す／自動で 止める・★ルル §18 コーダ⑤）');
    note['④-2 ★★自動で 動かない'] = t42.moved ? '★★' + t42.moved + '件 動いた' : '○ 時間を 3秒 進めても 1つも 動かない';

    /* ★★ ④-3 ボタンの 文字が「あと◯回」と 言って いるか（★これが 説明 0行の 前提）*/
    var t43 = { seen: [] };
    (function () {
      /* ★★ T226・④ ―― ★★「まだ 1回も ふって いない」ところ から 数えます */
      P.setDice([1, 2, 3, 4, 5], 0);
      for (var q = 0; q <= C.REROLL + 1; q++) {
        var btn = P.el.roll();
        t43.seen.push(btn.classList.contains('hidden') ? '（消えた）' : btn.textContent);
        realTap(btn);
      }
    })();
    (function () {
      var want = ['サイコロを ふる'], q;                /* ★ T226・④ ―― ★1つ目は これ */
      for (q = C.REROLL; q >= 1; q--) want.push('ふり直す（あと' + q + '回）');
      want.push('（消えた）');
      for (q = 0; q < want.length; q++) {
        if (t43.seen[q] !== want[q]) {
          ng.push('★★★ふり直す ボタンの 文字が ちがいます（★' + (q + 1) + '回目：「' + t43.seen[q] +
                  '」／「' + want[q] + '」の はず）―― ★★これが 説明を 0行に して いる ところ です');
          break;
        }
      }
    })();
    note['④-3 ★ボタンの 文字'] = t43.seen.join(' → ');

    /* ★★ ④-4 ボタンが 消えても 表が 動かない（★入れものの たけは 決め打ち）*/
    var t44 = P.still(function () {
      P.setDice([1, 2, 3, 4, 5], 1); P.render(); P.layout();
      var a = P.el.sheet().getBoundingClientRect();
      var y1 = Math.round(a.top), h1 = Math.round(a.height);
      P.setDice([1, 2, 3, 4, 5], C.REROLL + 1); P.render(); P.layout();
      var b = P.el.sheet().getBoundingClientRect();
      return { d: Math.abs(Math.round(b.top) - y1) + Math.abs(Math.round(b.height) - h1), y1: y1, h1: h1 };
    });
    if (t44.d > 1) ng.push('★★ふり直す ボタンが 消えると 表が ' + t44.d + 'px 動きます（★入れものの たけを 決め打ちに して ください）');
    note['④-4 ★ボタンが 消えても 表が 動かない'] = 'ずれ ' + t44.d + 'px';

    /* ============================================================
       ★★ ⑤ 320×568 に 入るか（★★いまの 画面の 大きさで 測ります）
       ★  ★大きさを 変えた ときの 数は、★★本当に 窓を その 大きさに して から
       ★  ★もう一度 これを 呼んで ください（★ルル §16 失敗2：足してから 言う）
       ============================================================ */
    var t5 = Y.fitTest(90);
    if (t5['★はみ出し（一番 大きい）'] !== '0px') {
      ng.push('★★★盤から はみ出して います（' + t5['★はみ出し（一番 大きい）'] + '）');
    }
    if (t5['★★押す ところが 画面外'] !== 0) {
      ng.push('★★★★押す ところが 画面の 外に 出て います（' + t5['★★押す ところが 画面外'] +
              '件）―― ★これは 見切れでは なく 故障 です（★追記③）');
    }
    if (t5['横スクロールが 出た 場面'] !== 0) ng.push('★★横スクロールが 出ます（' + t5['横スクロールが 出た 場面'] + '場面）');
    if (t5['縦スクロールが 出た 場面'] !== 0) ng.push('★★縦スクロールが 出ます（' + t5['縦スクロールが 出た 場面'] + '場面）');
    note['⑤ ★★画面に 入るか'] = t5['★★画面'] + '／はみ出し ' + t5['★はみ出し（一番 大きい）'] +
      '／画面外 ' + t5['★★押す ところが 画面外'] + '件／1マス ' + t5['★1マス'];

    /* ★★ ⑤-2 指の 的 44px（★ルル §18 コーダ・T122 の 会社の 線）
       ★ ★★表の 1マスは 44px を **割ります**（★13マス 出す ため）。
         ★ ★→ ★★これは 鳴らしません。★「読むための 数字」に 格下げします（★型の ②）。
         ★ ★★いつも 押す もの（★はじめる・ふり直す・サイコロ）は **鳴らします**。 */
    var t52 = P.still(function () {
      var out = { small: [], die: 0, roll: 0 };
      /* ★ ふり直す ボタンが 出て いる 場面で 測る（★消えて いる ときの 0px を 測っても 意味が ない）*/
      P.setDice([1, 2, 3, 4, 5], 1);
      P.layout(); P.render();
      var must = [$('btnRoll'), $('btnHowto'), document.querySelector('.topbar .back')];
      for (var k = 0; k < C.NDICE; k++) must.push(P.el.die[k]);
      for (k = 0; k < must.length; k++) {
        var e = must[k];
        if (!e || e.classList.contains('hidden')) continue;
        var q = e.getBoundingClientRect();
        if (!q.width || !q.height) continue;
        if (q.width < 43.5 || q.height < 43.5) {
          out.small.push((e.className || e.tagName).split(' ')[0] + ' ' + Math.round(q.width) + '×' + Math.round(q.height));
        }
      }
      out.die = Math.round(P.el.die[0].getBoundingClientRect().width);
      out.roll = Math.round($('btnRoll').getBoundingClientRect().height);
      var c = P.el.cell.n1.getBoundingClientRect();
      out.cell = Math.round(c.width) + '×' + Math.round(c.height);
      return out;
    });
    for (i = 0; i < t52.small.length; i++) {
      ng.push('★★いつも 押す ものが 44pxを 割って います：' + t52.small[i] + '（★T122 の 会社の 線）');
    }
    note['⑤-2 ★44pxの 指の 的'] = 'サイコロ ' + t52.die + 'px／ふり直す ' + t52.roll +
      'px／★表の 1マス ' + t52.cell + '（★★13マス 出す ため 44pxを 割ります ―― ★鳴らさず 記録だけ）';

    /* ★★ ⑤-3 本物の 指で 当たるか（★型の ① computed style を 信じない）*/
    var t53 = P.still(function () {
      var out = { n: 0, ok: 0, bad: [] };
      P.setDice([1, 2, 3, 4, 5], 1); P.render();
      var k, e, q, got;
      for (k = 0; k < C.NDICE; k++) {
        e = P.el.die[k]; q = e.getBoundingClientRect();
        out.n++;
        got = P.hitAt(q.left + q.width / 2, q.top + q.height / 2);
        if (got === e) out.ok++; else out.bad.push('サイコロ' + (k + 1));
      }
      for (k = 0; k < P.GRID.length; k++) {
        e = P.el.cell[P.GRID[k]]; q = e.getBoundingClientRect();
        got = P.hitAt(q.left + q.width / 2, q.top + q.height / 2);
        /* ⚠️★★★ T230 ―― ★★ここに あった 空きマス（`@blank`）の 枝を **消しました** ★★★
           ★ ★T226 では 右の 列の 7行目が 空きマス で、★「★当たらない ことを」数えて いました。
           ★ ★★T230 で ボーナスの 行が 2列 ぶち抜きに なり、★★★空きマスは 無く なりました。
           ★ ★★枝を のこすと、★★★**1度も 通らない のに 見張って いる ように 見える** 行に なります
             ★ ★（★会社の「見張って いる ふり」7つの 形）。★→ ★消しました。 */
        out.n++;
        if (got === e) out.ok++; else out.bad.push(P.GRID[k]);
      }
      return out;
    });
    if (t53.ok !== t53.n) ng.push('★★★まん中を さしても 当たらない ものが あります：' + t53.bad.join('・'));
    note['⑤-3 ★本物の 指'] = t53.ok + ' / ' + t53.n + '個 当たる';

    /* ============================================================
       ★ ⑥ しまう もの（★さいこう点 1つ だけ）
       ★  ★★＋ わざと 書きこんで 鳴らす（★型の ④）
       ============================================================ */
    var t6 = (function () {
      var out = { writes: 0, keys: [], mine: 0 };
      try {
        var real = root.localStorage.setItem, hit = 0;
        root.localStorage.setItem = function (k, v) { hit++; return real.call(root.localStorage, k, v); };
        api.add(function () { root.localStorage.setItem = real; });
        P.render(); P.layout();
        out.writes = hit;
        root.localStorage.setItem = real;
        for (var k = 0; k < root.localStorage.length; k++) {
          var key = root.localStorage.key(k);
          if (/yacht/i.test(key)) { out.keys.push(key); out.mine++; }
        }
      } catch (e) { out.err = String(e); }
      return out;
    })();
    if (t6.mine > 1) ng.push('★★しまって いる ものが ' + t6.mine + '件 あります（★さいこう点 1つ だけ の はず）：' + t6.keys.join('・'));
    note['⑥ ★しまう もの'] = '描くだけで 書きこみ ' + t6.writes + '回（★0回が 正）／いま しまって いる 鍵 ' +
      t6.mine + '件 ' + (t6.keys.length ? '（' + t6.keys.join('・') + '）' : '');

    /* ============================================================
       ★ ⑦ 言葉づかい（★設計図 §9.6）
       ★  ★★カタカナ英語は「サイコロ」「ヨット」「ハッピー」「ロボット」だけ の はず
       ============================================================ */
    var t7 = { bad: [] };
    (function () {
      var body = document.body.textContent || '';
      /* ★★★ T226 ―― ★★この 表から 4語を 外しました（★★社長の お決め①・2026-09-04）★★★
         ★ ★外した もの：★**フルハウス／ストレート／ダイス／ボーナス**
         ★ ★★理由：★社長が「役は 正式名称で 書いて ほしい」と 決められ、
           ★ ★★設計図 §9.6 の 例外リストに ヨットの 役の 名前が 足されました
             ―― ★★ポーカーの 役10個（2026-08-17 裁定）と まったく 同じ 扱い です。
         ★ ★★★順番を 逆に して いません：★設計図が 先、★この コードが あと。
         ⚠️★★ ★★外した ぶんの 穴は、★下の ⑪ が 埋めます ――
            ★ ★★★「12の 役の 名前が **ぜんぶ そろって いる**」＋「★消した 名前が 1つも 残って いない」
              ★ ★を 数えます。★★ゆるめる ときこそ、下の 線が 要ります。 */
      var banned = ['スリーカード', 'フォーカード', 'スコア',
                    'ターン', 'リロール', 'チャンス', 'カード', 'ヨットゲーム', 'キープ', 'プレイヤー'];
      for (var k = 0; k < banned.length; k++) if (body.indexOf(banned[k]) >= 0) t7.bad.push(banned[k]);
    })();
    for (i = 0; i < t7.bad.length; i++) {
      ng.push('★★画面に カタカナ英語が 出て います：「' + t7.bad[i] + '」（★設計図 §9.6。★例外リストに ありません）');
    }
    note['⑦ ★言葉づかい'] = t7.bad.length ? '★★' + t7.bad.join('・') : '○ カタカナは サイコロ・ヨット・ハッピー・ロボット だけ';

    /* ★ ⑦-2 あそびかたの 行数（★ルル：3行）*/
    var helpN = document.querySelectorAll('#helpDialog .help-list li').length;
    if (helpN !== 3) ng.push('★あそびかたが ' + helpN + '行 あります（★ルル T192 §0-2：★3行）');
    note['⑦-2 ★あそびかた'] = helpN + '行（★3行 が 正）';

    /* ★ ⑦-3 入口（設定）の 数 ―― ★えらばせるのは つよさ 1つ だけ */
    var sel = document.querySelectorAll('select').length;
    var selName = {}, ss = document.querySelectorAll('select');
    for (i = 0; i < ss.length; i++) selName[ss[i].id] = ss[i].options.length;
    if (sel > 2) ng.push('★★えらばせる ところが ' + sel + 'か所 あります（★はじめの 画面と 終わった あとの つよさ ＝ 2か所 だけ・★設計図 追記①）');
    note['⑦-3 ★えらばせる もの'] = 'つよさ ' + C.LEVELS.length + '段 × ' + sel + 'か所（' +
      JSON.stringify(selName) + '）／★ほかの 入口 0個';

    /* ============================================================
       ★★ ⑨ 連打しても 転がりが 途中で 消えないか（★★トライ 🟡-1・2026-09-02）
       ------------------------------------------------------------
       ★ ★★こわれて いた 形：★前の ふりの **後片づけタイマーが 生きた まま** 残り、
         ★ ★620ms後に「ぜんぶの `.is-roll` を 外す」が 走って、★★次の ふりを 途中で 切って いました。
       ★ ★★時間で 測ると 見張りが おそく なる ので、★★**積まれて いる 後片づけの 数**で 見ます。
         ★ ★★2回 ふったら、後片づけは **1本だけ** の はず（★2本 あったら 前の が 生き残って いる）。
       ★ ★★これなら 一瞬で 終わり、★どの 画面の 大きさでも 鳴ります（★型の ③）。
       ============================================================ */
    function cleanupCount(inject) {
      var off = clockOn(), out = 0;
      try {
        P.setDice([1, 2, 3, 4, 5], 1);
        var box = clocks[clocks.length - 1], base = box.q.length;
        P.throwDice(true);
        if (inject) inject();                      /* ★ わざと 前の タイマーを 生かす */
        P.throwDice(false);
        out = box.q.length - base;
      } catch (e) { out = -1; }
      off();
      return out;
    }
    var t9 = cleanupCount(null);
    if (t9 !== 1) {
      ng.push('★★★★ふり直しを 連打すると 転がりが 途中で 消えます（★後片づけタイマーが ' + t9 +
              '本 積まれて います。★★1本 が 正）―― ★★前の ふりの 後片づけが、次の ふりを 切ります');
    }
    note['⑨ ★★連打しても 転がりが 消えない'] = '2回 ふって 後片づけタイマー ' + t9 + '本（★1本 が 正）';

    /* ============================================================
       ★★ ⑩ ふり直せなく なったのに「ふり直そう」と 言って いないか（★★トライ 🟡-2）
       ------------------------------------------------------------
       ★ ★★画面が、★もう できない ことを すすめては いけません。
       ============================================================ */
    var t10 = (function () {
      var out = { text: '', ok: true, why: '' };
      try {
        withRandom(31337, function () { P.startGame(); });
        P.setDice([1, 2, 3, 4, 5], C.REROLL + 1);   /* ★ ふり直し のこり 0回 */
        P.render();
        var s = P.sayNow();
        out.text = s.text;
        if (s.text && /ふり直|ふろう/.test(s.text)) {
          out.ok = false;
          out.why = '★★★ふり直せない のに ふきだしが「' + s.text + '」と 言って います';
        }
        /* ★ ついでに ―― ★★どの 役かを 名ざしして いないか（★追記②）*/
        for (var k = 0; k < C.CATS.length; k++) {
          if (s.text && s.text.indexOf(C.CATS[k].name) >= 0) {
            out.ok = false;
            out.why = '★★★★ふきだしが 役を 名ざしして います：「' + s.text + '」（★追記②）';
          }
        }
      } catch (e) { out.why = String(e && e.message || e); out.ok = false; }
      return out;
    })();
    if (!t10.ok) ng.push(t10.why);
    note['⑩ ★★ふり直せない ときの ふきだし'] = '「' + (t10.text || '（出て いない）') +
      '」（★ふり直しを すすめて いない・★役を 名ざししていない）';

    /* ════════════════════════════════════════════════════════════
       ★★★★ T226 ―― ★社長の ご指摘 6つ の 見張り（⑪〜⑮）★★★★
       ════════════════════════════════════════════════════════════ */

    /* ============================================================
       ★★ ⑪ ②＋② ―― ★12の 役が **ぜんぶ 表に 出て いて**、★消した 名前が **1つも 残って いない**
       ------------------------------------------------------------
       ★ ★★これは ⑦（言葉づかい）から 4語を 外した ぶんの **下の 線** です。
         ★ ★★ゆるめる ときこそ、下の 線が 要る ―― ★★でないと「何を 書いても 通る」に なります。
       ★ ★★決め打ちの 見本に します（★12個の 名前を ここに 書きます）。
         ★ ★★`C.CATS` から 作ると、★★★中身が こわれても 見張りも 一緒に こわれます。
       ============================================================ */
    /* ★★ 関数に して あります ―― ★★下の ⑧（わざと 壊す）から **同じ 目を もう一度** 呼ぶ ため。
       ★ ★★別の 写しを 書いて 鳴らすのは「見張って いる ふり」です。★★本物を 呼びます。 */
    function names11() {
      var t11 = { miss: [], ghost: [], names: [] };
      /* ★★ 社長の ご指摘② の 6つ ＋ 1〜6の目 ＝ ★12（★決め打ち。★これが 正）*/
      var must = ['1の目', '2の目', '3の目', '4の目', '5の目', '6の目',
                  'チョイス', 'フォーダイス', 'フルハウス', 'S.ストレート', 'B.ストレート', 'ヨット'];
      /* ★★ T225 まで 使って いた 名前 ＋ 消した 役（★★残りかす が 無いか）*/
      var gone = ['同じ目3つ', '同じ目4つ', '3つと2つ', '4つ並び', '5つ並び', 'なんでも',
                  'スリーダイス', 'k3'];
      var k, txt;
      /* ★ ①中の 決まり（core）*/
      if (C.NCAT !== 12) t11.miss.push('★役の 数が ' + C.NCAT + '（★12 が 正）');
      if (C.TURNS !== 12) t11.miss.push('★手番が ' + C.TURNS + '回（★12回 が 正）');
      for (k = 0; k < C.CATS.length; k++) t11.names.push(C.CATS[k].name);
      for (k = 0; k < must.length; k++) if (t11.names.indexOf(must[k]) < 0) t11.miss.push('★core に 「' + must[k] + '」が ありません');
      for (k = 0; k < C.CATS.length; k++) if (gone.indexOf(C.CATS[k].id) >= 0) t11.ghost.push('core の id 「' + C.CATS[k].id + '」');
      if (C.WORTH.k3 != null) t11.ghost.push('WORTH に k3 が のこって います');
      /* ★ ②画面（★本当に 出て いるか ―― ★★表の マスの 字を 読みます）*/
      P.setSheet(C.newSheet()); P.setDice([1, 2, 3, 4, 5], 1);
      var look = P.cellLook(), shown = [];
      for (k = 0; k < look.length; k++) {
        var el = P.el.cell[look[k].cat];
        if (look[k].cat === '@bonus' || look[k].cat === '@blank') continue;
        shown.push(el.firstChild.textContent);
      }
      for (k = 0; k < must.length; k++) if (shown.indexOf(must[k]) < 0) t11.miss.push('★画面の 表に 「' + must[k] + '」が 出て いません');
      if (shown.length !== 12) t11.miss.push('★画面の 表の 役が ' + shown.length + '個（★12 が 正）');
      /* ★ ③ページ ぜんたい に 古い 名前が のこって いないか（★あそびかた・meta も 見ます）*/
      txt = (document.body.textContent || '') + ' ' + (document.title || '');
      var head = document.querySelectorAll('meta[name="description"],meta[property="og:description"],meta[name="twitter:description"]');
      for (k = 0; k < head.length; k++) txt += ' ' + (head[k].getAttribute('content') || '');
      for (k = 0; k < gone.length; k++) {
        if (gone[k] !== 'k3' && txt.indexOf(gone[k]) >= 0) t11.ghost.push('画面に 「' + gone[k] + '」が のこって います');
      }
      if (/13の 役|13回で|13マス/.test(txt)) t11.ghost.push('画面に 「13の 役／13回」が のこって います');
      if (/ロボット ?[23]人|ロボット3体/.test(txt)) t11.ghost.push('画面に 「ロボット3人」が のこって います');
      return t11;
    }
    var t11 = names11();
    for (i = 0; i < t11.miss.length; i++) ng.push('★★★★ 役が そろって いません：' + t11.miss[i] + '（★T226・社長の ご指摘②）');
    for (i = 0; i < t11.ghost.length; i++) ng.push('★★★ 消した はずの ものが のこって います：' + t11.ghost[i] + '（★T226・社長の お決め②）');
    note['⑪ ★★12の 役（★正式名称）'] = t11.names.join('・') +
      '　／★足りない ' + t11.miss.length + '件・★残りかす ' + t11.ghost.length + '件';

    /* ============================================================
       ★★ ⑫ ③ボーナス ―― ★★63点で ＋35点。★★★62点では 付かない
       ------------------------------------------------------------
       ★ ★★上の 線（★とどいたら 付く）と 下の 線（★とどかなければ 付かない）を **両方** 引きます。
         ★ ★★片側だけ だと「いつも 付ける」でも 通って しまいます。
       ★ ★★中の 算数 と 画面の 字 の **両方** を 数えます。
       ============================================================ */
    /* ★★★ T230 ―― ★ボーナスの 行の 決め打ちの 見本（★社長の ご指摘③）★★★
       ★ ★★ここに 書いた 字が、★★★画面と 1文字でも ちがえば 鳴ります。 */
    var BONUS_TEXT19 = '1〜6の 合計が 63点 以上で ＋35点';
    function check12() {
      var t12b = { why: [], rows: [] };
      /* ★ 1〜6の目 だけ 書いた 表を 作って、合計を 62／63／64 に する */
      function sheetWithUpper(u) {
        /* ★ 1の目=3, 2の目=6, 3の目=9, 4の目=12, 5の目=15 ＝ 45。★のこりを 6の目に 入れる */
        var sh = C.newSheet(), base = 0, k;
        for (k = 0; k < 5; k++) { sh[k] = 3 * (k + 1); base += 3 * (k + 1); }
        sh[5] = u - base;
        return sh;
      }
      var cases = [{ u: 62, want: 0 }, { u: 63, want: C.BONUS_PT }, { u: 64, want: C.BONUS_PT }];
      for (var k = 0; k < cases.length; k++) {
        var sh = sheetWithUpper(cases[k].u);
        var got = C.bonusOf(sh);
        var wantTotal = cases[k].u + cases[k].want;
        if (got !== cases[k].want) t12b.why.push('1〜6の 合計 ' + cases[k].u + ' で ボーナスが ' + got + '点（★' + cases[k].want + '点 が 正）');
        if (C.totalOf(sh) !== wantTotal) t12b.why.push('1〜6の 合計 ' + cases[k].u + ' で 点の 合計が ' + C.totalOf(sh) + '（★' + wantTotal + ' が 正）');
        /* ★★★ T230 ―― ★★ボーナスの 行が **書きかわりました**（★社長の ご指摘③）★★★
           ★ ★T226 まで：★名前「62 / 63」・点「+35」。★★★決まりが 字に なって いません でした。
           ★ ★T230 から：★名前 ＝ **決まりの 文**（★下の 見本）・点 ＝ あなたの 合計。
           ⚠️★★ ★★見本は **決め打ち** です（★`P.BONUS_TEXT` を 見に 行きません）――
              ★ ★★JS を 見に 行くと、★JS を 直した 日に この 見張りは だまって ○ を 出します。
              ★ ★★★決まり（63点・35点）を 直したら、★ここも 鳴ります。★それが 正しい。 */
        P.setSheet(sh); P.setDice([1, 2, 3, 4, 5], 1);
        var cell = P.el.cell['@bonus'];
        var nm = cell.querySelector('.cell-name').textContent;
        var pt = cell.querySelector('.cell-pt').textContent;
        var got12 = cell.classList.contains('is-got');
        var shownPt = parseInt($('mePt').textContent || '0', 10);
        t12b.rows.push(cases[k].u + '→「' + nm + '」「' + pt + '」' + (got12 ? '★とどいた' : '★まだ') + '・点 ' + shownPt);
        if (nm !== BONUS_TEXT19) t12b.why.push('ボーナスの 行の 字が 「' + nm + '」（★「' + BONUS_TEXT19 + '」 が 正 ―― ★★どういう 条件で 何点 入るか）');
        if (pt !== String(cases[k].u)) t12b.why.push('ボーナスの 行の 点が 「' + pt + '」（★「' + cases[k].u + '」 が 正）');
        if (got12 !== !!cases[k].want) t12b.why.push('1〜6の 合計 ' + cases[k].u + ' で 「とどいた」しるしが ' + got12 + '（★' + !!cases[k].want + ' が 正）');
        if (shownPt !== wantTotal) t12b.why.push('1〜6の 合計 ' + cases[k].u + ' で 画面の 点が ' + shownPt + '（★' + wantTotal + ' が 正）');
      }
      return t12b;
    }
    var t12b = check12();
    for (i = 0; i < t12b.why.length; i++) ng.push('★★★★ 35点ボーナスが おかしい です：' + t12b.why[i] + '（★T226・社長の ご指摘③）');
    note['⑫ ★★ボーナス 63点で ＋35点'] = t12b.rows.join('　／　') + '（★62点では 付かない ＝ 下の 線）';

    /* ============================================================
       ★★ ⑬ ④ ―― ★★はじめの 画面で サイコロが **1つも 出て いない**
       ------------------------------------------------------------
       ★ ★社長：「★最初は サイコロは 何も表示されず、『サイコロを振る』ボタンを おしたら 一回目を 振ってほしい」
       ★ ★★中（`g.dice`）だけでは 足りません ―― ★★**丸が 1つも 描かれて いない** ことを 数えます
         ★ ★（★「印は 見て いるが 出た 絵は 見て いない」＝ 見張って いる ふり の 6つ目）。
       ============================================================ */
    /* ★★ ここも 関数に して あります（★同じ 理由）。
       ★ `prep` … ★★はじめの 1ふりの あとに **わざと 何かを する** ため の 口（★下の ⑧ が 使います）*/
    function check13(prep) {
      var t13 = { why: [], pips: -1, btn: '', pipsAfter: -1 };
      var off = clockOn();
      try {
        withRandom(51515, function () { P.startGame(); });
        pump(50);
        if (prep) prep();
        var st = P.state();
        if (st.dice !== null) t13.why.push('★中の サイコロが 出て います（' + st.dice + '）');
        if (st.rolls !== 0) t13.why.push('★ふった 回数が ' + st.rolls + '（★0 が 正）');
        if (st.act) t13.why.push('★まだ ふって いないのに 役の マスが 押せます');
        var look = P.dieLook(), k, pips = 0, keep = 0;
        for (k = 0; k < look.length; k++) { pips += look[k].pips; if (look[k].keep) keep++; }
        t13.pips = pips;
        if (pips !== 0) t13.why.push('★★サイコロの 丸が ' + pips + '個 描かれて います（★0個 が 正）');
        if (keep !== 0) t13.why.push('★だれも 押して いないのに 青わくが ' + keep + '個');
        /* ★ 役の マスは ぜんぶ「―」の はず */
        var look2 = P.cellLook(), bad = 0;
        for (k = 0; k < look2.length; k++) {
          if (look2[k].cat === '@bonus' || look2[k].cat === '@blank') continue;
          if (look2[k].pt !== '―') bad++;
        }
        if (bad) t13.why.push('★まだ ふって いないのに ' + bad + 'マスに 点が 出て います');
        /* ★ ボタンの 文字と 大きさ（★44px の 会社の 線）*/
        t13.btn = P.el.roll().classList.contains('hidden') ? '（消えて います）' : P.el.roll().textContent;
        if (t13.btn !== 'サイコロを ふる') t13.why.push('★ボタンの 文字が 「' + t13.btn + '」（★「サイコロを ふる」 が 正）');
        var q = P.still(function () { P.layout(); return P.el.roll().getBoundingClientRect(); });
        if (q.height < 43.5) t13.why.push('★「サイコロを ふる」ボタンが ' + Math.round(q.height) + 'px（★44px の 会社の 線）');
        /* ★★ 押したら 1回目が ふれる か（★★本物の 指で）*/
        realTap(P.el.roll());
        var st2 = P.state();
        if (!st2.dice || st2.rolls !== 1) t13.why.push('★★ボタンを 押しても 1回目が ふれません');
        var look3 = P.dieLook(); t13.pipsAfter = 0;
        for (k = 0; k < look3.length; k++) t13.pipsAfter += look3[k].pips;
        if (t13.pipsAfter === 0) t13.why.push('★★押した のに サイコロの 丸が 1つも 描かれません');
      } catch (e) { t13.why.push(String(e && e.message || e)); }
      off();
      return t13;
    }
    var t13 = check13(null);
    for (i = 0; i < t13.why.length; i++) ng.push('★★★★ はじめの ふりが おかしい です：' + t13.why[i] + '（★T226・社長の ご指摘④）');
    note['⑬ ★★はじめは サイコロ 0個'] = '押す 前 丸 ' + t13.pips + '個・ボタン「' + t13.btn +
      '」／押した あと 丸 ' + t13.pipsAfter + '個';

    /* ============================================================
       ★★★ ⑭ ⑤ ―― ★ロボットの ふり方が **見えて いる** ＋ ★★1手番が 天井を こえない
       ------------------------------------------------------------
       ★ ★社長：「★ロボットも サイコロを振って、何が出て、何回振りなおして、どれを選んだのか 分かるように」
       ★★ 数える もの（★★上の 線と 下の 線を 両方）：
         ★ ①★★見えて いるか … ★★**ふった 回数 と 画面に 出した 回数が 合って いるか**（★1こま送りで）
         ★ ②★★のこした しるし … ★ロボットの 手番に 青わくが ついた 手番が あるか
         ★ ③★★何を 書いたか … ★帯に 文字が 出た か
         ★ ④★★上の 線 … ★1手番が `BOT.cap`（3140ms）を こえて いない か
         ★ ⑤★★下の 線 … ★1手番が `BOT.min`（800ms）を 下回って いない か
           ★ ★★（★下の 線が 無いと「0msで 一瞬」でも 通って しまいます ―― ★T225 まで が それ）
         ★ ⑥★★★人の 手番に **青わくが 1つも 残って いない** か
           ★ ★★（★ロボットの しるしが 人の 手番へ もれると、★★−19.85ポイントの 罪に なります）
       ============================================================ */
    function watch14() {
    var t14b = { turns: 0, ms: [], frames: [], keepTurns: 0, moves: [], why: [], leak: 0, moveShown: 0 };
    (function () {
      var off = clockOn(), keepLevel = P.level ? P.level() : null;
      try {
        P.setLevel(2);                               /* ★ つよい（★いちばん ふり直す）*/
        withRandom(80808, function () { P.startGame(); });
        pump(60);
        var guard = 0;
        while (guard++ < 400 && t14b.turns < 5) {
          var st = P.state();
          if (st.over) break;
          if (st.mine) {
            /* ★ 人の 手番に 入った ところ ―― ★★青わくが のこって いないか */
            var dl = P.dieLook(), k, on = 0;
            for (k = 0; k < dl.length; k++) if (dl[k].keep) on++;
            if (on) t14b.leak++;
            if (st.rolls === 0) { realTap(P.el.roll()); continue; }
            var sh = st.sheet, wrote = false;
            for (k = 0; k < C.NCAT; k++) {
              if (sh[k] == null) {
                var el = P.el.cell[C.CATS[k].id];
                if (el && !el.disabled) { realTap(el); wrote = true; }
                break;
              }
            }
            if (!wrote) break;
            /* ★★ ここから ロボットの 手番を **1こま ずつ** 見ます */
            var seenKeep = 0, seenMove = '', t0 = -1, t1 = -1, safety = 0, sawDice = 0;
            while (safety++ < 60) {
              if (!pumpOne()) break;
              var s2 = P.state();
              if (s2.cur === 1 && !s2.over) {
                if (t0 < 0) t0 = clockNow();
                t1 = clockNow();
                if (s2.dice && s2.dice.length === C.NDICE) sawDice = 1;
                for (k = 0; k < s2.keep.length; k++) if (s2.keep[k]) { seenKeep = 1; break; }
                if (s2.botMove) { seenMove = s2.botMove; if (P.botMoveShown()) t14b.moveShown++; }
              }
              if (t0 >= 0 && s2.cur !== 1) break;    /* ★ ロボットの 手番が 終わった */
            }
            if (t0 >= 0) {
              var led = P.botLedger();
              t14b.turns++;
              t14b.ms.push(t1 - t0);
              /* ★★ ふった 回数 と 画面に 出した 回数 を そのまま くらべます */
              t14b.frames.push(led.shown + '/' + led.rolls);
              if (led.shown !== led.rolls) t14b.why.push('★★' + led.rolls + '回 ふったのに 画面に 出したのは ' + led.shown + '回');
              if (led.rolls < 1) t14b.why.push('★★ふった 回数が 0');
              if (led.wrote !== 1) t14b.why.push('★★書いた ところを ' + led.wrote + '回 出しました（★1回 が 正）');
              if (!sawDice) t14b.why.push('★★ロボットの 手番に サイコロが 1度も 出ません');
              if (seenKeep) t14b.keepTurns++;
              t14b.moves.push(seenMove || '（出て いません）');
            }
            continue;
          }
          if (!pump(200)) break;
        }
      } catch (e) { t14b.why.push(String(e && e.message || e)); }
      if (keepLevel != null) P.setLevel(keepLevel);   /* ★ 型の ⑤：★さわった ものは 戻す */
      off();
    })();
    (function () {
      var k, cap = P.BOT.cap, min = P.BOT.min, maxMs = 0, minMs = 1e9, fMin = 99, noMove = 0;
      if (t14b.turns < 3) { t14b.why.push('★ロボットの 手番を ' + t14b.turns + '回 しか 見られません でした（★3回 以上 要ります ―― ★見張りが 死んで います）'); return; }
      for (k = 0; k < t14b.ms.length; k++) {
        if (t14b.ms[k] > maxMs) maxMs = t14b.ms[k];
        if (t14b.ms[k] < minMs) minMs = t14b.ms[k];
        if (t14b.moves[k] === '（出て いません）') noMove++;
      }
      fMin = 1;
      if (maxMs > cap) t14b.why.push('★★1手番が ' + maxMs + 'ms（★上の 線 ' + cap + 'ms ―― ★1試合が 140秒を こえます）');
      if (minMs < min) t14b.why.push('★★1手番が ' + minMs + 'ms（★下の 線 ' + min + 'ms ―― ★★見せて いません）');
      void fMin;
      if (!t14b.keepTurns) t14b.why.push('★★ロボットが のこした サイコロに 青わくが 1度も つきません');
      if (noMove) t14b.why.push('★★何を 書いたかが ' + noMove + '手番 出ません');
      if (!t14b.moveShown) t14b.why.push('★★帯に 何を 書いたかの 文字が 1度も 出ません（★中には あるが 画面に 出て いない）');
      if (t14b.leak) t14b.why.push('★★★★人の 手番に 青わくが ' + t14b.leak + '回 のこって います（★★−19.85ポイントの 罪への 道）');
    })();
    return t14b;
    }
    var t14b = watch14();
    for (i = 0; i < t14b.why.length; i++) ng.push('★★★★ ロボットの 見せ方：' + t14b.why[i] + '（★T226・社長の ご指摘⑤）');
    note['⑭ ★★★ロボットの ふり方が 見える'] = '見た 手番 ' + t14b.turns + '回／★1手番 ' + t14b.ms.join('・') +
      'ms（★上の 線 ' + P.BOT.cap + '・下の 線 ' + P.BOT.min + '）／★出た 目の とおり数 ' +
      t14b.frames.join('・') + '（★出した／ふった）／★青わくが ついた 手番 ' + t14b.keepTurns + '／★書いた 役 ' +
      t14b.moves.join('・') + '／★人の 手番への もれ ' + t14b.leak + '件';

    /* ============================================================
       ★★ ⑮ ⑥ ―― ★役の 説明が 出て いて、★★読める 大きさ か
       ------------------------------------------------------------
       ★ ★★「並んで いるが 見えて いない」「切れては いないが 重なって 読めない」を つぶします
         ★ ★（★見張って いる ふり の 4つ目・7つ目）。
       ★ ★★あそびかた（3行）とは **別に** 数えます ―― ★⑦-2 は 3行の まま。
       ============================================================ */
    function check15() {
      var t15 = { n: 0, why: [], sizes: [], names: [] };
      var dlg = $('helpDialog'), det = $('catHelp'), ul = $('catList');
      if (!det || !ul) { t15.why.push('★役の 説明が ありません'); return t15; }
      var wasOpen = dlg.open, wasDet = det.open;
      try {
        if (!wasOpen) dlg.showModal();
        det.open = true;
        P.still(function () {
          var li = ul.querySelectorAll('li'), k;
          t15.n = li.length;
          /* ★★ 社長が 挙げられた 6つが ぜんぶ ある か（★決め打ちの 見本）*/
          var must = ['チョイス', 'フォーダイス', 'フルハウス', 'S.ストレート', 'B.ストレート', 'ヨット'];
          var txt = ul.textContent || '';
          for (k = 0; k < must.length; k++) if (txt.indexOf(must[k]) < 0) t15.why.push('「' + must[k] + '」の 説明が ありません');
          if (t15.n < 7) t15.why.push('説明が ' + t15.n + '行 しか ありません（★6つの 役 ＋ 1〜6の目 ＋ ボーナス ＝ 8行）');
          for (k = 0; k < li.length; k++) {
            var q = li[k].getBoundingClientRect(), cs = getComputedStyle(li[k]);
            var fs = parseFloat(cs.fontSize);
            t15.names.push((li[k].firstChild.textContent || '').slice(0, 8));
            t15.sizes.push(Math.round(q.width) + '×' + Math.round(q.height) + '/' + fs.toFixed(0) + 'px');
            if (q.width < 1 || q.height < 1) t15.why.push((k + 1) + '行目が 見えません（' + Math.round(q.width) + '×' + Math.round(q.height) + '）');
            if (fs < 10.5) t15.why.push((k + 1) + '行目の 字が ' + fs.toFixed(1) + 'px（★10.5px より 小さい ＝ 読めません）');
            /* ★ 上下が 重なって いないか（★1つ前の 行の 下より 上に 来て いない か）*/
            if (k > 0) {
              var pq = li[k - 1].getBoundingClientRect();
              if (q.top < pq.bottom - 1) t15.why.push((k + 1) + '行目が 前の 行に 重なって います');
            }
          }
        });
      } catch (e) { t15.why.push(String(e && e.message || e)); }
      det.open = wasDet;
      if (!wasOpen && dlg.open) dlg.close();
      return t15;
    }
    var t15 = check15();
    for (i = 0; i < t15.why.length; i++) ng.push('★★★ 役の 説明：' + t15.why[i] + '（★T226・社長の ご指摘⑥）');
    note['⑮ ★★役の 説明'] = t15.n + '行（★' + t15.names.join('・') + '）／★大きさ ' + t15.sizes.join('・');

    /* ============================================================
       ★★ ⑯ ―― ★★12の 役の 名前が、★★★**読める 大きさで・切れずに** 出て いる
       ------------------------------------------------------------
       ★ ★★⑪ は「名前が **合って いるか**」を 見ます。★★⑯ は「★**読めるか**」を 見ます。
         ★ ★★2つは 別 です ―― ★★「S.ストレート」が 正しく 入って いても、
           ★ ★★★三点リーダで「S.スト…」に なって いたら、★遊ぶ 人には 別の 役 です。
       ★ ★★きっかけ：★T226 で 役名が カタカナに なりました（★社長の ご指摘②）。
         ★ ★★カタカナは かなより 幅を 食います ―― ★★はば 320px の 表で 切れる 心配が ありました。
       ★ ★★数えたら 切れて いません でした【★9画面 実測】。★★でも ―― ★★★字が **10px** でした
         ★ ★（★320×480・320×454 の 2画面。★`layout()` の `Math.max(10, …)` の 床）。
         ★ ★→ ★★アトが CSS の 側で 11px まで 押し上げました（`max(11px, var(--cell-f))`）。
       ★ ★★この 見張りは、★★その 11px を **決め打ちの 見本**として 持ちます。
       ============================================================ */
    function check16() {
      var t16 = { why: [], min: 999, max: 0, cut: 0, n: 0, rows: [] };
      var off = clockOn();
      try {
        withRandom(31313, function () { P.startGame(); });
        pump(50);
        realTap(P.el.roll());                 /* ★ 1回 ふって、点も 出た すがたで 数えます */
        P.still(function () {
          P.layout();
          var k = document.querySelectorAll('#sheet .cell'), i;
          for (i = 0; i < k.length; i++) {
            var e = k[i];
            if (e.dataset.cat === '@blank') continue;      /* ★ 空きマスは 字を 持ちません */
            var nm = e.querySelector('.cell-name'), pt = e.querySelector('.cell-pt');
            if (!nm) { t16.why.push((i + 1) + 'マス目に 役名の 入れものが ありません'); continue; }
            var q = nm.getBoundingClientRect();
            var fs = Math.round(parseFloat(getComputedStyle(nm).fontSize) * 10) / 10;
            var txt = nm.textContent || '';
            t16.n++;
            t16.rows.push(txt + '/' + fs + 'px');
            if (!txt) t16.why.push((i + 1) + 'マス目の 役名が 空です');
            if (q.width < 1 || q.height < 1) {
              t16.why.push('「' + txt + '」が 見えません（' + Math.round(q.width) + '×' + Math.round(q.height) + '）');
            }
            /* ★★ 上の 線 ―― ★★三点リーダで 切れて いないか（★★「並んで いるが 読めない」）*/
            if (nm.scrollWidth > nm.clientWidth + 0.5) {
              t16.cut++;
              t16.why.push('「' + txt + '」が 切れて います（★要 ' + nm.scrollWidth + 'px ／ 有 ' + nm.clientWidth + 'px）');
            }
            if (pt && pt.scrollWidth > pt.clientWidth + 0.5) {
              t16.why.push('「' + txt + '」の 点が 切れて います（★要 ' + pt.scrollWidth + 'px ／ 有 ' + pt.clientWidth + 'px）');
            }
            if (fs < t16.min) t16.min = fs;
            if (fs > t16.max) t16.max = fs;
          }
        });
      } catch (e) { t16.why.push(String(e && e.message || e)); }
      off();
      /* ★★★ 下の 線 ―― ★★★数えられなかった ときも 鳴る（★だまって ○ を 出さない）★★★ */
      if (t16.n !== 13) {
        t16.why.push('★★数えた マスが ' + t16.n + '（★12の 役 ＋「◯／63」＝ ★13 が 正 ―― ★見張りが 死んで います）');
      }
      if (t16.min === 999) {
        t16.why.push('★★1マスも 数えられません でした（★★見張りが 死んで います）');
      } else if (t16.min < 11) {
        /* ★ 見本：★★11px は **決め打ち**。★CSS を 見に 行きません */
        t16.why.push('★★役名の 字が ' + t16.min + 'px（★★11px の 床を 割って います ―― ★私には 読めません）');
      }
      return t16;
    }
    var t16 = check16();
    for (i = 0; i < t16.why.length; i++) ng.push('★★★★ 役名が 読めません：' + t16.why[i] + '（★T227・🎨アト）');
    note['⑯ ★★役名が 読める（★切れ ' + t16.cut + '件）'] = t16.n + 'マス／★字 ' + t16.min + '〜' + t16.max +
      'px（★床 11px）／' + t16.rows.join('・');

    /* ============================================================
       ★★★ ⑰ ―― ★★はじめの 画面で、★★★押せる ところは **1つだけ**
       ------------------------------------------------------------
       ★ ★社長の ご指摘④：「★最初は サイコロを 出さず、『サイコロを振る』を 押してから」。
       ★ ★★⑬ は「★サイコロの 丸が 0個か」を 数えます（★出て いない こと）。
         ★ ★★⑰ は「★★★では 人は 何を すれば よいか」を 数えます（★★迷いようが ない こと）。
         ★ ★★★設計図 §5.5：「★迷ったら 消す。★難しさは 説明を 増やす ことでは なく、★迷いを 消す こと」。
       ★ ★★盤（`#stage`）の 中で 押せる ものを 数えて、★★★ちょうど 1つ ―― ★それが ふる ボタン。
         ★ ★★2つに なったら 鳴る（★上の 線）／★★0個 でも 鳴る（★下の 線）。
       ★ ★★もう 1つ：★★★ふる 前の サイコロと、★ふった あとの サイコロが **見分けられるか**。
         ★ ★★同じ 見た目 だと「もう ふった のかな？」に なります ―― ★これも 迷い です。
       ============================================================ */
    function check17() {
      var t17 = { why: [], n: -1, live: [], btn: null, look0: '', look1: '' };
      var off = clockOn();
      try {
        withRandom(41414, function () { P.startGame(); });
        pump(50);
        P.still(function () {
          P.layout();
          var stage = document.getElementById('stage');
          if (!stage) { t17.why.push('盤（#stage）が ありません'); return; }
          var all = stage.querySelectorAll('button,a[href],select,input,textarea,[tabindex]');
          var live = [], i;
          for (i = 0; i < all.length; i++) {
            var e = all[i], q = e.getBoundingClientRect(), cs = getComputedStyle(e);
            if (e.disabled) continue;
            if (e.getAttribute && e.getAttribute('tabindex') === '-1') continue;
            if (q.width < 1 || q.height < 1) continue;
            if (cs.display === 'none' || cs.visibility === 'hidden' || cs.pointerEvents === 'none') continue;
            live.push(e);
            t17.live.push((e.className || e.tagName) + ' ' + Math.round(q.width) + '×' + Math.round(q.height));
          }
          t17.n = live.length;
          /* ★★ その 1つは ふる ボタン か・44px か・画面の 中か・★★本物の 指で 当たるか */
          var btn = P.el.roll(), bq = btn.getBoundingClientRect();
          var ok = 0, pts = [[bq.left + bq.width / 2, bq.top + bq.height / 2],
                             [bq.left + bq.width / 2, bq.top + 3], [bq.left + bq.width / 2, bq.bottom - 3],
                             [bq.left + 3, bq.top + bq.height / 2], [bq.right - 3, bq.top + bq.height / 2]];
          for (i = 0; i < pts.length; i++) {
            var h = document.elementFromPoint(pts[i][0], pts[i][1]);
            if (h && (h === btn || btn.contains(h))) ok++;
          }
          t17.btn = { w: Math.round(bq.width), h: Math.round(bq.height * 10) / 10, ok: ok,
                      inVp: (bq.top >= -0.5 && bq.bottom <= window.innerHeight + 0.5) };
          if (live.length !== 1 || live[0] !== btn) {
            t17.why.push('盤の 中で 押せる ものが ' + live.length + '個（★1つ ＝「サイコロを ふる」だけ が 正）：' + t17.live.join('・'));
          }
          if (ok < 5) t17.why.push('「サイコロを ふる」に 指が ' + ok + '/5点 しか 当たりません');
          if (bq.height < 43.5) t17.why.push('「サイコロを ふる」が ' + Math.round(bq.height) + 'px（★44px の 会社の 線）');
          if (!t17.btn.inVp) t17.why.push('「サイコロを ふる」が 画面の 外に います');
          /* ★★ ふる 前 と ふった あとで、★サイコロの 見た目が 変わるか（★★見分けが つくか）*/
          var d0 = document.querySelector('.die'), cs0 = getComputedStyle(d0);
          t17.look0 = cs0.backgroundColor + '｜' + cs0.boxShadow;
        });
        /* ★ ふった あと */
        realTap(P.el.roll());
        P.still(function () {
          var d0 = document.querySelector('.die'), cs1 = getComputedStyle(d0);
          t17.look1 = cs1.backgroundColor + '｜' + cs1.boxShadow;
          if (t17.look0 && t17.look0 === t17.look1) {
            t17.why.push('★★ふる 前と ふった あとで サイコロの 見た目が まったく 同じ です（★「もう ふった？」に なります）');
          }
        });
      } catch (e) { t17.why.push(String(e && e.message || e)); }
      off();
      /* ★★★ 下の 線 ―― ★★数えられなかった ときも 鳴る ★★★ */
      if (t17.n < 0) t17.why.push('★★盤の 中を 1つも 数えられません でした（★★見張りが 死んで います）');
      if (t17.n === 0) t17.why.push('★★盤の 中に 押せる ものが 1つも ありません（★★遊びが 始められません）');
      if (!t17.look0) t17.why.push('★★ふる 前の サイコロを 数えられません でした（★★見張りが 死んで います）');
      return t17;
    }
    var t17 = check17();
    for (i = 0; i < t17.why.length; i++) ng.push('★★★★ はじめの 画面：' + t17.why[i] + '（★T227・🎨アト）');
    note['⑰ ★★はじめは 押せる ところが 1つ'] = '押せる もの ' + t17.n + '個（' + t17.live.join('・') + '）／★指 ' +
      (t17.btn ? t17.btn.ok + '/5点・' + t17.btn.w + '×' + t17.btn.h : '―') +
      '／★見分け ' + (t17.look0 === t17.look1 ? '★つきません' : 'つきます');

    /* ============================================================
       ★★★★ ⑳ ―― ★★★はじめの 画面の「はじめる」が、★★巻かずに 指で 押せる
       ------------------------------------------------------------
       ★ ★★⑰ と の ちがい（★重ねて いません）：
         ★ ★★⑰ … ★**遊びの 画面**（`#stage`）で、★押せる ものが 1つ か
         ★ ★★⑳ … ★★**はじめの 画面**（`#titleScreen`）で、★★★そもそも 遊びを 始められる か
       ★ ★★★＝ ★⑰ が ○ でも ⑳ は × に なりえます（★★568×272 が まさに それ でした）。

       ★ ★★★いちばん 大事な ところ：★★**巻かずに（スクロールせず）押せるか**
         ★ ★はじめて 来た 人は 巻きません。★★`.title-screen` の 巻きを **0 に 戻して から** 測ります。
         ★ ★★「巻けば 届く」は ここでは ○ に しません ―― ★設計図 追記③：
           ★ ★★★「触る ところが 画面の 外に 出たら、★それは 見切れでは なく **故障**」。
       ============================================================ */
    function check20() {
      var t20 = { why: [], band: -1, h: -1, from: -1, to: -1, scroll: -1, id: '', selBand: -1 };
      var FLOOR = 44;                     /* ★★ 見本：★会社の 線（★T122）―― ★決め打ち */
      var ID = 'btnStart';                /* ★★ 見本：★この ボタンで なければ 意味が ありません */
      var ts = document.getElementById('titleScreen');
      var ps = document.getElementById('playScreen');
      if (!ts || !ps) {
        t20.why.push('★★はじめの 画面（#titleScreen）が ありません（★★見張りが 死んで います）');
        return t20;
      }
      /* ★ いまの 姿を おぼえる（★型⑤：さわった ものは 1つ 残らず 戻す）*/
      var kT = ts.classList.contains('hidden');
      var kP = ps.classList.contains('hidden');
      var kScroll = ts.scrollTop;

      /* ★★★ 本物の 指で たてに 1px ずつ さす ―― ★★当たった 帯を 数える
         ★ ★（★★「切る もの」を たどる 計算を しません。★★★実測 なので 数え忘れが 起きません）*/
      function fingerBand(el) {
        var q = el.getBoundingClientRect(), vh = window.innerHeight, vw = window.innerWidth;
        var cx = Math.min(Math.max((q.left + q.right) / 2, 1), vw - 1);
        var y0 = Math.max(0, Math.floor(q.top)), y1 = Math.min(vh - 1, Math.ceil(q.bottom));
        var n = 0, from = -1, to = -1;
        for (var y = y0; y <= y1; y++) {
          var h = document.elementFromPoint(cx, y);
          if (h && (h === el || el.contains(h))) { if (from < 0) from = y; to = y; n++; }
        }
        return { n: n, from: from, to: to, q: q };
      }

      try {
        ts.classList.remove('hidden');
        ps.classList.add('hidden');
        P.layout();
        P.still(function () {
          /* ★★★ はじめて 来た 人と 同じ ところから 見る ―― ★★巻きを 0 に 戻す */
          ts.scrollTop = 0;
          void ts.offsetHeight;
          t20.scroll = Math.round(ts.scrollHeight - ts.clientHeight);

          var b = document.getElementById(ID);
          if (!b) { t20.why.push('「はじめる」（id="' + ID + '"）が ありません'); return; }
          t20.id = b.id;
          var f = fingerBand(b);
          t20.h = Math.round(f.q.height * 10) / 10;
          t20.band = f.n; t20.from = f.from; t20.to = f.to;

          /* ★★★ ① 上の 線 ★★★ */
          if (t20.band < FLOOR) {
            t20.why.push('「はじめる」に 指が 当たる 帯が ' + t20.band + 'px しか ありません（★★見本 ' +
                         FLOOR + 'px・★ボタン自体は ' + t20.h + 'px）' +
                         (t20.band === 0 ? ' ―― ★★★遊びを 始められません' : ''));
          }
          if (t20.h < FLOOR - 0.5) {
            t20.why.push('「はじめる」の たけが ' + t20.h + 'px（★★44px の 会社の 線）');
          }
          /* ★★ 横は はみ出して いないか（★たてと 別の 目）*/
          var vw = window.innerWidth;
          if (f.q.left < -0.5 || f.q.right > vw + 0.5) {
            t20.why.push('「はじめる」が 横に はみ出して います（' +
                         Math.round(f.q.left) + '〜' + Math.round(f.q.right) + ' ／ はば ' + vw + '）');
          }
          /* ★★ つよさの えらび（★1つだけの えらび・設計図 追記①）も 押せるか */
          var sel = document.getElementById('levelTitle');
          if (!sel) { t20.why.push('つよさの えらび（#levelTitle）が ありません'); }
          else {
            var fs = fingerBand(sel);
            t20.selBand = fs.n;
            if (fs.n < FLOOR) {
              t20.why.push('つよさの えらびに 指が 当たる 帯が ' + fs.n + 'px しか ありません（★★見本 ' + FLOOR + 'px）');
            }
          }
        });
      } catch (e) { t20.why.push(String(e && e.message || e)); }

      /* ★ 戻す（★★1つ 残らず）*/
      try {
        ts.scrollTop = kScroll;
        if (kT) ts.classList.add('hidden'); else ts.classList.remove('hidden');
        if (kP) ps.classList.add('hidden'); else ps.classList.remove('hidden');
        P.layout(); P.render();
      } catch (e2) {}

      /* ★★★ ② 下の 線 ―― ★★測れなかった ときも 鳴る ★★★ */
      if (t20.band < 0) {
        t20.why.push('★★「はじめる」を 1つも 数えられません でした（★★★見張りが 死んで います）');
      }
      if (t20.selBand < 0 && t20.band >= 0) {
        t20.why.push('★★つよさの えらびを 1つも 数えられません でした（★★★見張りが 死んで います）');
      }
      if (t20.id !== ID && t20.band >= 0) {
        t20.why.push('★★見て いた ものが id="' + ID + '" では ありません（★★見本と ちがう ものを 測って います）');
      }
      return t20;
    }
    var t20 = check20();
    for (i = 0; i < t20.why.length; i++) ng.push('★★★★ はじめる が 押せない：' + t20.why[i] + '（★T227-2・🎨アト）');
    note['⑳ ★★★はじめる が 巻かずに 押せる'] = '指の 帯 ' + t20.band + 'px（★見本 44px・★ボタン ' + t20.h + 'px）' +
      '／★つよさ ' + t20.selBand + 'px／★巻ける ' + t20.scroll + 'px';

    /* ============================================================
       ★★★★ ⑱ ―― ★★★ロボットの 見せ方が **読める**（★社長の ご指摘⑤の 見た目の がわ）
       ------------------------------------------------------------
       ★ ★★⑭ は「★見せて いるか」を 数えます（★回数・秒の 上下の 線）。
         ★ ★★⑱ は「★★★見せて いる ものが **読めるか**」を 数えます。★2つは 別 です。
       ★ ★★私が 写真で 見つけた こと【★T227・前_320x568_C1.png】：
         ★ ★★★ロボットが ふって いる 最中の 画面が、★人の 手番と **ほとんど 同じ 絵** でした。
           ★ ★★サイコロは 同じ 場所、青わくも 同じ 色 ―― ★★はじめての 人には
             ★ ★★★「自分が 押したの？」に 見えます。
       ★★ 数える もの：
         ★ ①★★★「いま ロボットの 番」が **絵で** 分かる（★人の 手番と 見た目が ちがう）
           ★ ★★★2段に して あります ―― ★**帯**（★どの 見る道具でも 出ます）と
             ★ ★**サイコロの 台**（`:has()`。★古い 見る道具では 落ちます）。
             ★ ★★どちらも 同じ なら 鳴る ＝ ★★**下の 段が 生きて いれば 通る**。
         ★ ②★★書いた 役が 切れずに 読める（★三点リーダ 0・字 11px 以上）
         ★ ③★★だれが 書いたか（「ロボット」）が 消えて いない
         ★ ④★★★字が 空の とき、★丸わくが **浮いて いない**（★★これは 私の 失敗です ―― ★下 参照）
       ⚠️★★★ ④の いわれ：★私は 丸わくを `.bot-cell .bot-move` に 書きました。
          ★ ★★字が 空でも 内よはくが 残り、★★★白い 丸が 1つ 点の 右に 浮いて いました。
          ★ ★★★大きさの 数字でも、字の 中身でも 出ません ―― ★**写真だけ**が 教えました。
            ★ ★★＝ ★「印は 見て いるが 出た 絵は 見て いない」。★★この 見張りは その 穴を ふさぎます。
       ============================================================ */
    function watch18() {
      var t18 = { why: [], sawBot: 0, sawMove: 0, band: ['', ''], tray: ['', ''],
                  move: '', moveW: 0, cut: 0, font: 0, nameW: -1, emptyW: -1, over: 0 };
      var off = clockOn(), keepLevel = P.level ? P.level() : null;
      try {
        P.setLevel(2);
        withRandom(90909, function () { P.startGame(); });
        pump(60);
        var band = document.querySelector('#botBand .bot-cell');
        var row = document.getElementById('diceRow');
        var guard = 0;
        while (guard++ < 400) {
          var st = P.state();
          if (st.over) break;
          if (st.mine) {
            if (st.rolls === 0) { realTap(P.el.roll()); continue; }
            /* ★★ 人の 手番の 見た目を 先に 取って おく（★くらべる 相手）*/
            P.still(function () {
              var cb = getComputedStyle(band), cr = getComputedStyle(row);
              t18.band[0] = cb.backgroundColor + '｜' + cb.boxShadow;
              t18.tray[0] = cr.backgroundColor + '｜' + cr.boxShadow;
            });
            var sh = st.sheet, wrote = false, k;
            for (k = 0; k < C.NCAT; k++) {
              if (sh[k] == null) {
                var el = P.el.cell[C.CATS[k].id];
                if (el && !el.disabled) { realTap(el); wrote = true; }
                break;
              }
            }
            if (!wrote) break;
            /* ★★ ロボットの 手番を 1こま ずつ 見ます */
            var safety = 0;
            while (safety++ < 60) {
              if (!pumpOne()) break;
              var s2 = P.state();
              if (s2.cur === 1 && !s2.over) {
                t18.sawBot++;
                P.still(function () {
                  var cb2 = getComputedStyle(band), cr2 = getComputedStyle(row);
                  t18.band[1] = cb2.backgroundColor + '｜' + cb2.boxShadow;
                  t18.tray[1] = cr2.backgroundColor + '｜' + cr2.boxShadow;
                  var mv = band.querySelector('.bot-move'), bn = band.querySelector('.bot-name');
                  var mq = mv.getBoundingClientRect();
                  if (!s2.botMove) {
                    /* ★★★ ④ ―― ★字が 空の とき、★丸わくが 浮いて いないか */
                    if (mq.width > t18.emptyW) t18.emptyW = Math.round(mq.width * 10) / 10;
                  } else {
                    t18.sawMove++;
                    t18.move = mv.textContent || '';
                    t18.moveW = Math.round(mq.width);
                    t18.font = Math.round(parseFloat(getComputedStyle(mv).fontSize) * 10) / 10;
                    if (mv.scrollWidth > mv.clientWidth + 0.5) t18.cut++;
                    if (band.scrollWidth > band.clientWidth + 0.5) t18.over++;
                    var nq = bn.getBoundingClientRect();
                    t18.nameW = Math.round(nq.width);
                  }
                });
              }
              if (t18.sawBot && s2.cur !== 1) break;
            }
            if (t18.sawBot && t18.sawMove) break;
            continue;
          }
          if (!pump(200)) break;
        }
      } catch (e) { t18.why.push(String(e && e.message || e)); }
      if (keepLevel != null) P.setLevel(keepLevel);
      off();

      /* ★★★ 下の 線 ―― ★★場面が 作れなかった ときも 鳴る ★★★ */
      if (!t18.sawBot) { t18.why.push('★★ロボットの 手番を 1こまも 見られません でした（★★見張りが 死んで います）'); return t18; }
      if (!t18.sawMove) t18.why.push('★★ロボットが 書いた ところを 1回も 見られません でした');
      if (!t18.band[0] || !t18.band[1]) t18.why.push('★★帯の 見た目を くらべられません でした（★★見張りが 死んで います）');

      /* ★ ① ★★「いま ロボットの 番」が 絵で 分かるか（★2段の どちらかで よい）*/
      var bandDiff = t18.band[0] && t18.band[1] && t18.band[0] !== t18.band[1];
      var trayDiff = t18.tray[0] && t18.tray[1] && t18.tray[0] !== t18.tray[1];
      if (!bandDiff && !trayDiff) {
        t18.why.push('★★★ロボットの 手番と 人の 手番で、★帯も サイコロの 台も **まったく 同じ 見た目** です' +
                     '（★★はじめての 人には「自分が 押したの？」に 見えます）');
      }
      t18.step = (bandDiff ? '帯○' : '帯×') + '／' + (trayDiff ? '台○' : '台×（★`:has()` が 無い かも）');

      /* ★ ② ★書いた 役が 読める か */
      if (t18.sawMove) {
        if (t18.cut) t18.why.push('★★書いた 役が 切れて います（「' + t18.move + '」）');
        if (t18.over) t18.why.push('★★帯から 中身が あふれて います（「' + t18.move + '」）');
        if (t18.font && t18.font < 11) t18.why.push('★★書いた 役の 字が ' + t18.font + 'px（★11px の 床）');
        if (t18.moveW < 1) t18.why.push('★★書いた 役が 見えません（はば ' + t18.moveW + 'px）');
        /* ★ ③ ★だれが 書いたか が 消えて いないか */
        if (t18.nameW < 1) t18.why.push('★★「ロボット」の 名前が 消えて います（★だれが 書いたか 分かりません）');
      }
      /* ★ ④ ★空の 丸わくが 浮いて いないか（★★私の 失敗①）*/
      if (t18.emptyW > 2) {
        t18.why.push('★★字が 無いのに 丸わくが ' + t18.emptyW + 'px 浮いて います（★★点の 右の 白い 丸）');
      }
      return t18;
    }
    var t18 = watch18();
    for (i = 0; i < t18.why.length; i++) ng.push('★★★★ ロボットの 見せ方（見た目）：' + t18.why[i] + '（★T227・🎨アト）');
    note['⑱ ★★★ロボットの 見せ方が 読める'] = '見た こま ' + t18.sawBot + '／★番の しるし ' + (t18.step || '―') +
      '／★書いた 役「' + t18.move + '」' + t18.moveW + 'px・字 ' + t18.font + 'px・切れ ' + t18.cut +
      '／★名前 ' + t18.nameW + 'px／★空の 丸わく ' + t18.emptyW + 'px';

    /* ============================================================
       ★★★★ ⑲ ―― ★★★ロボットの 手番の あいだ、★ハッピーが **人に 指図して いない**
       ------------------------------------------------------------
       ★ ★★【★🎨アトが 写真で 見つけた もの・T227 §9-3】
         ★ ★「★ハッピーが『サイコロを ふろう！』と 言った まま ロボットの 手番に 入る ことが ある」
       ★ ★★中身：★`say()` の 2600ms は **人の 手番の はじめ**から 数えます。
         ★ ★★人が 2.6秒 より 速く 書くと、★ロボットが ふって いる 最中に ことばが 残ります。
         ★ ★★★＝ ★画面が、★★いま できない ことを すすめて いる（★私の 失敗⑩と 同じ 形）。
       ★★ ⑭ ⑱ との ちがい（★重ねて いません）：
         ★ ★★⑭ … ★ロボットの ふり方が **見えて いるか**（★回数・秒）
         ★ ★★⑱ … ★見せて いる ものが **読めるか**（★字・色・切れ）
         ★ ★★⑲ … ★★★そのとき **ことばが 合って いるか**（★★誰に 向かって 言って いるか）
       ★★ 数える もの：
         ★ ①★★2とおりの 速さで 作る … ★「1回 ふって すぐ 書く」と「3回 ふって すぐ 書く」
           ★ ★★（★★★時計を 1こまも 進めずに 書きます ＝ ★2.6秒 より 速い 人）
         ★ ②★★ロボットの 手番の こま ごとに、★ふきだしの 字を 見る
         ★ ③★★★見本の ことば（★下の ORDERS）が 出て いたら 鳴る（★★上の 線）
       ★★ 下の 線（★測れなかった ときも 鳴る）：
         ★ ・★書く 前に 見本の ことばが **出て いない** … ★★見本が 古い ＝ 見張りが 死んで います
         ★ ・★ロボットの 手番を 1こまも 見られなかった … ★★同上
       ★ ★★見本は **決め打ち** です（★CSS も JS も 見に 行きません）。
         ★ ★★ことばを 変えた ときは、★★ここも 直す ―― ★それを 下の 線が 教えます。

       ★★★★ T228 ―― ★★★目を **1段 手前**に 広げました（★🧪トライの お知らせ）★★★★
       ------------------------------------------------------------
       ★ ★★T227 の 私は `if (s2.cur === 1)` の こま **だけ** 見て いました。
         ★ ★★ところが `onCell()` は `busy = true` の あと **260ms** おいて `nextSeat()` を 呼びます。
           ★ ★★★その 間 `g.cur` は まだ **0** ―― ★★私の 目の **外** でした。
       ★ ★★トライの 実測：★のこった 267ms の うち ★★目の 中 **0ms**／★★★目の 外 **267ms**。
         ★ ★★★＝ ★病気は 目の 前に あるのに、★★私の ⑲ は だまって ○ を 出して いました。
           ★ ★★会社の「見張って いる ふり」7つの 形の 5つ目 ―― ★★★その場面を そもそも 作って いない。
       ★ ★★直した 見方：★★★`s2.cur === 1`（席） → ★★`!P.isMyTurn()`（★★★人が 押せない）。
         ★ ★★「指図が 嘘に なる」のは 席が 変わった ときでは なく、★**押せなく なった** ときです。
       ⚠️★ ★★席1 の こまを **数えるのは やめて いません**（★★ゆるめる ときこそ 下の 線が 要る）。
         ★ ★★広げた 目（`sawBot`）と、★席1 の こま（`sawSeat1`）を ★★**両方**数え、
           ★ ★★★どちらかが 0こま なら 鳴らします ―― ★★でないと「広げた だけで 何も 見て いない」に なります。
       ============================================================ */
    /* ★★★ T230 ―― ★★見本が **3つ**に なりました（★社長の ご指摘④）★★★
       ★ ★足したのは 「変えたくない サイコロを おすと のこせるよ！」（★1回 ふった あとの 指図）。
       ★ ★★これも `SAY_ORDER` に 入って いる ので、★★★押せなく なったら 消える はず です。
         ★ ★★＝ ★★声を 足したら、★見本も いっしょに 足す ―― ★でないと 新しい 声だけ 見張られません。 */
    var ORDERS19 = ['サイコロを ふろう！', '変えたくない サイコロを おすと のこせるよ！', 'どれかの 役に 書こう！'];
    function check19() {
      var t19 = { why: [], rows: [], bad: 0, sawBot: 0, sawSeat1: 0, sawOrder: 0 };
      function once(taps, tag) {
        var r = { tag: tag, order: '', sawBot: 0, sawSeat1: 0, bad: 0, worst: '', err: '' };
        var off = clockOn();
        try {
          withRandom(70707 + taps, function () { P.startGame(); });
          /* ★★ 時計を 1こまも 進めません ―― ★★★これが「2.6秒 より 速い 人」です */
          var i, k;
          for (i = 0; i < taps; i++) realTap(P.el.roll());
          r.order = P.sayNow().text || '';
          var st = P.state(), sh = st.sheet, wrote = false;
          for (k = 0; k < C.NCAT; k++) {
            if (sh[k] == null) {
              var el = P.el.cell[C.CATS[k].id];
              if (el && !el.disabled) { realTap(el); wrote = true; }
              break;
            }
          }
          if (!wrote) { r.err = '空きマスに 書けません でした'; off(); return r; }
          /* ★★ ここから「★★★人が 押せなく なった あと」を **1こま ずつ** 見ます
             ★ ★★★書いた 直後（★席は まだ 0・busy だけ 立って いる）から 数えはじめます ――
               ★ ★★★T228 で 広げた ぶんが、まさに ここ です。

             ⚠️★★★【★★私の 失敗・T228】★★★はじめ 私は `pumpOne()` を **先に** 呼んで いました。
               ★ ★★`onCell()` の `later(nextSeat, 260)` は 時計に 積まれた 1本 なので、
                 ★ ★★★1回 pump した 時点で もう 席が 1 に なって います ――
                 ★ ★★★＝ ★見たい 260ms の こまが、★★★1こまも 作られて いませんでした。
               ★ ★★★目を 広げたのに、★見る 前に 通りすぎて いた（★★「その場面を そもそも 作って いない」）。
               ★ ★→ ★★★**先に 見て、あとで 進める**。★★これで 書いた 直後の こまが 1こま目に なります。 */
          var safety = 0;
          while (safety++ < 80) {
            var s2 = P.state();
            if (s2.cur === 1) r.sawSeat1++;                 /* ★ 下の 線 ―― ★席1 の こまも 数えつづけます */
            if (!P.isMyTurn() && !s2.over) {                /* ★★★ 広げた 目：★人が 押せない こま */
              r.sawBot++;
              var txt = P.sayNow().text || '';
              for (k = 0; k < ORDERS19.length; k++) {
                if (txt === ORDERS19[k]) { r.bad++; r.worst = txt; }
              }
            }
            if (r.sawSeat1 && s2.cur !== 1) break;          /* ★ ロボットの 手番が 終わったら やめる */
            if (!pumpOne()) break;
          }
        } catch (e) { r.err = String(e && e.message || e); }
        off();
        return r;
      }
      var cases = [once(1, '1回 ふって すぐ 書く'), once(3, '3回 ふって すぐ 書く')], j;
      for (j = 0; j < cases.length; j++) {
        var c = cases[j];
        t19.sawBot += c.sawBot; t19.bad += c.bad; t19.sawSeat1 += c.sawSeat1;
        t19.rows.push(c.tag + '：★ふきだし「' + (c.order || '―') + '」／★押せない こま ' + c.sawBot +
                      '（★うち 席1 ' + c.sawSeat1 + '）／★指図が 残った こま ' + c.bad);
        if (c.err) t19.why.push(c.tag + '：' + c.err);
        /* ★★★ 下の 線 ―― ★★見本が 出て いない なら、★この 見張りは 何も 見て いません ★★★ */
        var isOrder = 0, k2;
        for (k2 = 0; k2 < ORDERS19.length; k2++) if (c.order === ORDERS19[k2]) isOrder = 1;
        if (isOrder) t19.sawOrder++;
        else t19.why.push(c.tag + '：★★書く 前の ふきだしが「' + (c.order || '（出て いません）') +
                          '」で、★見本の ことばで は ありません（★★見本が 古い ＝ ★★★見張りが 死んで います）');
        if (!c.sawBot) t19.why.push(c.tag + '：★★人が 押せない こまを 1つも 見られません でした（★★見張りが 死んで います）');
        /* ★★★ 下の 線 ②―― ★★広げた 目 だけで 済ませない（★★★ゆるめる ときこそ 下の 線が 要る）★★★
           ★ ★★席1（★ロボットが ふって いる 最中）の こまを 1つも 見て いない なら、
             ★ ★★T227 で 見て いた ところを 見失って います ＝ ★★★見張りが 死んで います。 */
        if (!c.sawSeat1) t19.why.push(c.tag + '：★★ロボットの 手番（★席1）の こまを 1つも 見られません でした（★★見張りが 死んで います）');
        /* ★★★ 上の 線 ―― ★★人への 指図が ロボットの 手番に 残って いる ★★★ */
        if (c.bad) t19.why.push(c.tag + '：★★★人は もう 押せない のに ハッピーが「' + c.worst +
                                '」と 人に 言って います（★' + c.bad + 'こま）');
      }
      return t19;
    }
    var t19 = check19();
    for (i = 0; i < t19.why.length; i++) ng.push('★★★★ 押せない のに 指図が 残る：' + t19.why[i] + '（★T227 🎨アト／★★T228 🧪トライ）');
    note['⑲ ★★★人が 押せなく なったら 指図を 消す'] = t19.rows.join('　★') +
      '／★見本 ' + ORDERS19.join('・') + '（★出た ' + t19.sawOrder + '/2）';

    /* ============================================================
       ★★★★ ㉑ ―― ★★1マスに **人の点 と ロボットの点が 両方** 出て いる（★社長の ご指摘①）
       ------------------------------------------------------------
       ★ ★社長の 言葉：「★ヨットは ロボットが 何の役で 点を 取ったのかが 分からない。
         ★ ★★フォーダイス 28点が プレイヤーが とった 28点だと 分かるように 記載して、
         ★ ★★★その となりに ロボットの点（★点を 入れて ないなら ー）を 記載して ほしい」
       ★★ 数える もの（★★本物の 試合を 途中まで 進めて から 見ます）：
         ★ ①★★12の 役 ぜんぶに 数字が **2つ** ある（★★1つでも 欠けたら 鳴る）
         ★ ②★★ロボットの 点が **中の 表と 合って いる**（★書いて いなければ 「―」）
         ★ ③★★読める（★見えて いる・切れて いない・11px 以上）
       ★★ 下の 線（★★測れなかった ときも 鳴る）：
         ★ ・数えた マスが 12で ない … ★★見張りが 死んで います
         ★ ・ロボットが 1マスも 書いて いない 場面しか 見られなかった …
           ★ ★★「―」しか 見て いない ＝ ★★★数字が 合って いるかを 1度も 試して いません
       ⚠️★★ ★★ここで 見るのは **すでに 起きた 事実** だけ です。
          ★ ★★「ロボットが 空けて いる 役」を 光らせて いないかは、★もとから ① が 数えて います
            ★ ★（★見た目が 1マスも 変わらない こと）。★★重ねて いません。
       ============================================================ */
    /* ★★★ へだたり（★T123・T139・T215・T218 と 同じ ものさし）★★★
       ⚠️★★ ★★これを 足した いわれ ―― ★★★私は ロボットの 点を **読めない 色**で 出しました。
          ★ ★★はじめの 色（#9aa7b3）の へだたりは **2.46／2.13**。★会社の 線は **4.5**。
          ★ ★★私の ㉑ は 字の 大きさは 数えて いました ―― ★★★色は 数えて いません でした。
            ★ ★★大きさが 正しくても 読めない ことが ある（★★アトの「絵が おかしい」の 3つ目）。 */
    function lum(c) {
      var m = String(c).match(/[\d.]+/g) || [0, 0, 0, 1];
      var a = m.length > 3 ? parseFloat(m[3]) : 1;
      var v = [0, 1, 2].map(function (i) {
        var x = parseFloat(m[i]) / 255;
        x = a >= 1 ? x : x * a + 1 * (1 - a);
        return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
    }
    function bgOf(el) {
      for (var e = el; e && e !== document.documentElement; e = e.parentElement) {
        var c = getComputedStyle(e).backgroundColor;
        var m = String(c).match(/[\d.]+/g);
        if (m && (m.length < 4 || parseFloat(m[3]) > 0.5)) return c;
      }
      return 'rgb(255,255,255)';
    }
    function ratio(el) {
      var a = lum(getComputedStyle(el).color), b = lum(bgOf(el));
      var hi = Math.max(a, b), lo = Math.min(a, b);
      return Math.round((hi + 0.05) / (lo + 0.05) * 100) / 100;
    }
    var CONTRAST_MIN = 4.5;          /* ★ 決め打ちの 線（★CSS を 見に 行きません）*/
    function check21() {
      var t21 = { why: [], n: 0, wrote: 0, dash: 0, rows: [], font: 0, cut: 0, minW: 1e9, con: 99 };
      var off = clockOn(), keepLevel = P.level ? P.level() : null;
      try {
        P.setLevel(2);
        withRandom(60606, function () { P.startGame(); });
        pump(50);
        /* ★★ ロボットが 何マスか 書くまで 進めます（★★「―」だけ 見て 終わらない ため）*/
        var guard = 0;
        while (guard++ < 200) {
          var st = P.state();
          if (st.over) break;
          if (st.mine) {
            if (st.rolls === 0) { realTap(P.el.roll()); continue; }
            var sh = st.sheet, wrote = false, k;
            for (k = 0; k < C.NCAT; k++) {
              if (sh[k] == null) {
                var el = P.el.cell[C.CATS[k].id];
                if (el && !el.disabled) { realTap(el); wrote = true; }
                break;
              }
            }
            if (!wrote) break;
            continue;
          }
          if (!pump(400)) break;
          /* ★ ロボットが 3マス 書いたら 数えはじめます（★★数字と「―」が 両方 出る 場面）*/
          var bots = P.state().bots;
          void bots;
          var filled = 0, gg = P._gSheet ? P._gSheet(1) : null;
          void gg; void filled;
          if (guard > 6) break;
        }
        /* ★ 人の 手番で・目が 出て いる 姿に そろえて から 数えます */
        P.setDice([5, 5, 5, 5, 5], 1);
        var truth = P.state().botSheet;               /* ★★ 中の 本当の 表（★出す 関数では なく）*/
        if (!truth) t21.why.push('★★中の ロボットの 表が 見られません でした（★★見張りが 死んで います）');
        P.still(function () {
          P.layout();
          var look = P.cellLook(), k;
          for (k = 0; k < look.length; k++) {
            if (look[k].cat === '@bonus') continue;
            var e = P.el.cell[look[k].cat];
            var ci = -1, q;
            for (q = 0; q < C.CATS.length; q++) if (C.CATS[q].id === look[k].cat) ci = q;
            var bpEl = e.querySelector('.cell-bp'), ptEl = e.querySelector('.cell-pt');
            t21.n++;
            if (!bpEl) { t21.why.push(look[k].cat + ' に ロボットの 点の 入れものが ありません'); continue; }
            if (!ptEl) { t21.why.push(look[k].cat + ' に あなたの 点の 入れものが ありません'); continue; }
            var got = bpEl.textContent;
            /* ⚠️★★★ ★★見本は **中の 表** です（★`P.botCellText()` では ありません）★★★
               ★ ★★出す ための 関数と くらべたら、★★同じ ものを 2回 見て いる だけ ――
                 ★ ★★★関数を まちがえた 日に、★この 見張りは だまって ○ を 出します。 */
            var want = (!truth || truth[ci] == null) ? '―' : String(truth[ci]);
            t21.rows.push(C.CATS[ci].name + ' ' + ptEl.textContent + '／' + got);
            if (got === '―') t21.dash++; else t21.wrote++;
            if (got !== want) t21.why.push(C.CATS[ci].name + ' の ロボットの 点が 「' + got + '」（★中の 表は 「' + want + '」）');
            if (!ptEl.textContent) t21.why.push(C.CATS[ci].name + ' の あなたの 点が 空です');
            /* ★★ ③ 読めるか（★★あなたの 点も、ロボットの 点も ―― ★★★どちらが 消えても 鳴ります）*/
            var pq = ptEl.getBoundingClientRect();
            if (pq.width < 1 || pq.height < 1) t21.why.push(C.CATS[ci].name + ' の ★あなたの 点が 見えません（' + Math.round(pq.width) + '×' + Math.round(pq.height) + '）');
            if (ptEl.scrollWidth > ptEl.clientWidth + 0.5) { t21.cut++; t21.why.push(C.CATS[ci].name + ' の あなたの 点が 切れて います'); }
            var bq = bpEl.getBoundingClientRect();
            if (bq.width < 1 || bq.height < 1) t21.why.push(C.CATS[ci].name + ' の ロボットの 点が 見えません（' + Math.round(bq.width) + '×' + Math.round(bq.height) + '）');
            if (bq.width < t21.minW) t21.minW = Math.round(bq.width * 10) / 10;
            if (bpEl.scrollWidth > bpEl.clientWidth + 0.5) { t21.cut++; t21.why.push(C.CATS[ci].name + ' の ロボットの 点が 切れて います'); }
            var fs = Math.round(parseFloat(getComputedStyle(bpEl).fontSize) * 10) / 10;
            if (!t21.font || fs < t21.font) t21.font = fs;
            /* ★★★ へだたり ―― ★★大きさが 正しくても、★★★色が うすければ 読めません */
            var rr = ratio(bpEl);
            if (rr < t21.con) t21.con = rr;
            if (rr < CONTRAST_MIN) {
              t21.why.push(C.CATS[ci].name + ' の ロボットの 点の へだたりが ' + rr + '（★' + CONTRAST_MIN + ' の 線 ―― ★★うすくて 読めません）');
            }
            /* ★ 2つが 重なって いないか（★★「数字は 静かでも、絵が おかしい」―― ★アトが 2度 証明）*/
            if (pq.right > bq.left + 0.5 && bq.right > pq.left + 0.5) {
              t21.why.push(C.CATS[ci].name + ' の 2つの 点が 重なって います');
            }
          }
        });
      } catch (e) { t21.why.push(String(e && e.message || e)); }
      if (keepLevel != null) P.setLevel(keepLevel);
      off();
      /* ★★★ 下の 線 ★★★ */
      if (t21.n !== 12) t21.why.push('★★数えた マスが ' + t21.n + '（★12 が 正 ―― ★★見張りが 死んで います）');
      if (!t21.wrote) t21.why.push('★★ロボットが 書いた マスを 1つも 見られません でした（★「―」しか 見て いません ＝ ★★★数字が 合って いるかを 1度も 試して いません）');
      if (!t21.dash) t21.why.push('★★まだ 書いて いない マス（★「―」）を 1つも 見られません でした（★★★下の 線）');
      if (t21.font && t21.font < 11) t21.why.push('★★ロボットの 点の 字が ' + t21.font + 'px（★11px の 床）');
      return t21;
    }
    var t21 = check21();
    for (i = 0; i < t21.why.length; i++) ng.push('★★★★ ロボットの 点が 表に 出て いません：' + t21.why[i] + '（★T230・社長の ご指摘①）');
    note['㉑ ★★★1マスに 人の点 と ロボットの点'] = t21.n + 'マス（★書いた ' + t21.wrote + '・★「―」' + t21.dash +
      '）／★字 ' + t21.font + 'px・★★へだたり ' + t21.con + '（★線 ' + CONTRAST_MIN + '）・切れ ' + t21.cut +
      '・いちばん せまい ' + t21.minW + 'px／' + t21.rows.join('・');

    /* ============================================================
       ★★★★ ㉑-2 ―― ★★ロボットの 点が、★★★**書く 前に** 出て いない
       ------------------------------------------------------------
       ★ ★★これは 社長の ご指摘① と ⑤（★T226：ロボットの ふり方を 見せる）の **つなぎ目** です。
         ★ ★★ロボットの 手番は こま切れに して あります（★ふる → のこす → くり返す → 書く）。
           ★ ★★★もし 表の 中の 数だけ 先に 動くと、★★「まだ ふって いる 最中に、
             ★ ★★もう 何を 書いたか 分かって しまう」―― ★★★見せる ことの 意味が 消えます。
       ★ ★★T226 は **合計点**だけを 止めて いました（`botFreeze`）。
         ★ ★★T230 で 表の 中にも 数が 出た ので、★★★止める ものを 表 ぜんぶに 広げました。
       ★★ 数える もの：★ロボットが ふって いる こまで、★★埋まって いる マスの 数が
         ★ ★**手番の はじめから 増えて いない** こと。★★書いた その こまで はじめて 増える こと。
       ★★ 下の 線：★ふって いる こまを 1つも 見られなかった／★書いた こまを 見られなかった ときも 鳴る。
       ============================================================ */
    function check21b() {
      var t = { why: [], base: -1, whileRoll: [], afterWrite: -1, sawRoll: 0, sawWrite: 0 };
      var off = clockOn(), keepLevel = P.level ? P.level() : null;
      function filled() {
        var k = document.querySelectorAll('#sheet .cell'), i, n = 0;
        for (i = 0; i < k.length; i++) {
          if (k[i].dataset.cat === '@bonus') continue;
          var b = k[i].querySelector('.cell-bp');
          if (b && b.textContent && b.textContent !== '―') n++;
        }
        return n;
      }
      try {
        P.setLevel(2);
        withRandom(21212, function () { P.startGame(); });
        /* ★ 人が 1回 ふって 書く → ★ロボットの 手番へ */
        realTap(P.el.roll());
        var st = P.state(), sh = st.sheet, k, wrote = false;
        for (k = 0; k < C.NCAT; k++) {
          if (sh[k] == null) { var el = P.el.cell[C.CATS[k].id]; if (el && !el.disabled) { realTap(el); wrote = true; } break; }
        }
        if (!wrote) { t.why.push('空きマスに 書けません でした'); off(); return t; }
        t.base = filled();
        var safety = 0;
        while (safety++ < 80) {
          var s2 = P.state();
          if (s2.cur === 1 && !s2.over) {
            if (!s2.botMove) { t.sawRoll++; t.whileRoll.push(filled()); }   /* ★ まだ ふって いる こま */
            else if (t.afterWrite < 0) { t.sawWrite++; t.afterWrite = filled(); }
          }
          if (t.sawRoll && s2.cur !== 1) break;
          if (!pumpOne()) break;
        }
      } catch (e) { t.why.push(String(e && e.message || e)); }
      if (keepLevel != null) P.setLevel(keepLevel);
      off();
      /* ★★★ 下の 線 ★★★ */
      if (!t.sawRoll)  { t.why.push('★★ロボットが ふって いる こまを 1つも 見られません でした（★★見張りが 死んで います）'); return t; }
      if (!t.sawWrite) t.why.push('★★ロボットが 書いた こまを 見られません でした（★★見張りが 死んで います）');
      /* ★★★ 上の 線 ―― ★ふって いる 間に 増えて いないか ★★★ */
      var j;
      for (j = 0; j < t.whileRoll.length; j++) {
        if (t.whileRoll[j] > t.base) {
          t.why.push('★★★ロボットが まだ ふって いる のに、★表の 点が ' + t.base + ' → ' + t.whileRoll[j] +
                     'マスに 増えて います（★★書く 前に 答えが 出て います）');
          break;
        }
      }
      /* ★ そして 書いた こまでは ちゃんと 増える（★★止めっぱなしでは ない）*/
      if (t.sawWrite && t.afterWrite <= t.base) {
        t.why.push('★★ロボットが 書いた のに 表の 点が 増えません（' + t.base + ' → ' + t.afterWrite + 'マス）');
      }
      return t;
    }
    var t21b = check21b();
    for (i = 0; i < t21b.why.length; i++) ng.push('★★★★ ロボットの 点が 書く 前に 出て います：' + t21b.why[i] + '（★T230・社長の ご指摘①⑤）');
    note['㉑-2 ★★★書く 前に 出さない'] = 'はじめ ' + t21b.base + 'マス → ふって いる 間 ' +
      (t21b.whileRoll.join('・') || '―') + ' → 書いた あと ' + t21b.afterWrite + 'マス（★見た こま ふり ' +
      t21b.sawRoll + '・書き ' + t21b.sawWrite + '）';

    /* ============================================================
       ★★★★ ㉒ ―― ★★合計点が **2つ** 出て いる（★社長の ご指摘②）
       ------------------------------------------------------------
       ★ ★社長の 言葉：「★ロボットの合計点は、★プレイヤーの合計点の隣に 記載してほしい。
         ★ ★★『あなた 28点』の 右（★チョイスの 上あたり）に『★★ 24点』みたいな」
       ★★ 数える もの：
         ★ ①★★2つ とも 出て いる・★2つ とも 中の 数と 合って いる
         ★ ②★★2つ とも 見える（★はば 1px 以上・字 11px 以上・切れ 0）
         ★ ③★★帯から あふれて いない（★★はば 320px でも）
         ★ ④★★★帯の たけが 増えて いない（★★見本 **決め打ち 30px**）
           ★ ★★★ここが いちばん こわい ところ です ―― ★★帯が 高く なると、
             ★ ★★その ぶん **表の 1マスが 削れます**（★私は 測る 道具で 実際に やりました：
               ★ ★★★帯 30→50px で 1マスが 34→31px に 落ちました【実測】）。
       ★★ 下の 線：★2つ とも 見つからない／数えられない ときも 鳴る。
       ============================================================ */
    function check22() {
      var t22 = { why: [], me: '', bot: '', h: -1, over: -1, font: [0, 0], w: [0, 0] };
      var off = clockOn(), keepLevel = P.level ? P.level() : null;
      try {
        P.setLevel(2);
        withRandom(80808, function () { P.startGame(); });
        pump(50);
        var guard = 0;
        while (guard++ < 40) {                       /* ★ 数回 手番を 進めて、点が 0で ない 姿に */
          var st = P.state();
          if (st.over) break;
          if (st.mine) {
            if (st.rolls === 0) { realTap(P.el.roll()); continue; }
            var sh = st.sheet, wrote = false, k;
            for (k = 0; k < C.NCAT; k++) {
              if (sh[k] == null) { var el = P.el.cell[C.CATS[k].id]; if (el && !el.disabled) { realTap(el); wrote = true; } break; }
            }
            if (!wrote) break;
            if (guard > 8) break;
            continue;
          }
          if (!pump(400)) break;
        }
        P.still(function () {
          P.layout();
          var band = document.getElementById('meBand');
          var meEl = $('mePt'), boEl = $('botPt');
          if (!meEl) { t22.why.push('★★あなたの 点の 入れものが ありません'); return; }
          if (!boEl) { t22.why.push('★★★ロボットの 合計点の 入れものが ありません（★社長の ご指摘②）'); return; }
          t22.me = meEl.textContent; t22.bot = boEl.textContent;
          var s = P.state();
          var wantMe = String(C.totalOf(s.sheet));
          var wantBot = String(P.botTotalShown(1));
          if (t22.me !== wantMe) t22.why.push('あなたの 点が 「' + t22.me + '」（★中は 「' + wantMe + '」）');
          if (t22.bot !== wantBot) t22.why.push('ロボットの 点が 「' + t22.bot + '」（★中は 「' + wantBot + '」）');
          if (t22.me === '0' && t22.bot === '0') t22.why.push('★★2つ とも 0点の 場面しか 見られません でした（★★★下の 線 ―― ★数が 動くか 試して いません）');
          var q1 = meEl.getBoundingClientRect(), q2 = boEl.getBoundingClientRect();
          t22.w = [Math.round(q1.width), Math.round(q2.width)];
          t22.font = [Math.round(parseFloat(getComputedStyle(meEl).fontSize)),
                      Math.round(parseFloat(getComputedStyle(boEl).fontSize))];
          if (q1.width < 1 || q1.height < 1) t22.why.push('★★あなたの 点が 見えません');
          if (q2.width < 1 || q2.height < 1) t22.why.push('★★★ロボットの 点が 見えません');
          if (meEl.scrollWidth > meEl.clientWidth + 0.5) t22.why.push('★★あなたの 点が 切れて います');
          if (boEl.scrollWidth > boEl.clientWidth + 0.5) t22.why.push('★★★ロボットの 点が 切れて います');
          /* ⚠️★★★ ここは もとは `< 11` の 決め打ちでした【★T241・💻コーダ・★直した わけを 残します】
             ★ ★★11px は **表の マス**の 床 です ―― ★★★上の 帯の 床では ありません。
             ★ ★★社長の お決め（2026-09-06 その2）で 帯の 床は **8px** に なりました（★🎨アト T240-2）。
             ★ ★→ ★★同じ 帯を 見る ㉙-2・㉛-2 と **同じ 数**（`OBI_YUKA`）を 使います。 */
          if (t22.font[1] < OBI_YUKA) t22.why.push('★★ロボットの 点の 字が ' + t22.font[1] + 'px（★' + OBI_YUKA + 'px の 床）');
          /* ★ ③ 帯から あふれて いないか */
          t22.over = band.scrollWidth - band.clientWidth;
          if (t22.over > 0) t22.why.push('★★上の 帯から 中身が ' + t22.over + 'px あふれて います');
          /* ★★★ ④ 帯の たけ（★★決め打ちの 見本 30px）★★★ */
          t22.h = Math.round(band.getBoundingClientRect().height);
          if (t22.h > 30) {
            t22.why.push('★★★上の 帯が ' + t22.h + 'px（★見本 30px ―― ★★高く なった ぶん、表の 1マスが 削れます）');
          }
          /* ★ 2つが 重なって いないか（★★アトの「数字は 静かでも 絵が おかしい」）*/
          if (q1.right > q2.left + 0.5 && q2.right > q1.left + 0.5) {
            t22.why.push('★★★2つの 点が 重なって います（あなた ' + Math.round(q1.left) + '〜' + Math.round(q1.right) +
                         '／ロボット ' + Math.round(q2.left) + '〜' + Math.round(q2.right) + '）');
          }
          /* ★ ならびは ★あなた → ロボット（★表の 中の ならびと そろえる）*/
          if (q1.left > q2.left) t22.why.push('★★ならびが 逆です（★あなた → ロボット が 正 ―― ★表の 中の ならびと そろえます）');
        });
      } catch (e) { t22.why.push(String(e && e.message || e)); }
      if (keepLevel != null) P.setLevel(keepLevel);
      off();
      return t22;
    }
    var t22 = check22();
    for (i = 0; i < t22.why.length; i++) ng.push('★★★★ 合計点が 2つ 出て いません：' + t22.why[i] + '（★T230・社長の ご指摘②）');
    note['㉒ ★★★合計点が 2つ'] = 'あなた ' + t22.me + '／ロボット ' + t22.bot + '（★はば ' + t22.w.join('・') +
      'px・字 ' + t22.font.join('・') + 'px）／★帯 ' + t22.h + 'px（★見本 30px）・あふれ ' + t22.over + 'px';

    /* ============================================================
       ★★★★ ㉓ ―― ★★ボーナスの 決まりが **読める 大きさで** 出て いる（★社長の ご指摘③）
       ------------------------------------------------------------
       ★ ★社長の 言葉：「★ボーナスの 0/63 は どういう条件で 何点入るか 記載してほしい」
       ★ ★★字が **合って いるか** は ⑫ が 見ます（★決め打ちの 見本）。
         ★ ★★★㉓ は「★では **読めるか**」を 見ます ―― ★★⑪ と ⑯ の 関係と 同じ 分け方 です。
       ★★ 数える もの：★①切れて いない ②11px 以上 ③見えて いる ④行から あふれて いない
       ★ ★★下の 線：★行そのものが 見つからない ときも 鳴る。
       ============================================================ */
    function check23() {
      var t23 = { why: [], txt: '', font: 0, w: 0, cut: 0, over: 0, cols: 0 };
      try {
        P.still(function () {
          P.layout();
          var cell = P.el.cell['@bonus'];
          if (!cell) { t23.why.push('★★ボーナスの 行が ありません'); return; }
          var nm = cell.querySelector('.cell-name');
          if (!nm) { t23.why.push('★★ボーナスの 行に 字の 入れものが ありません'); return; }
          t23.txt = nm.textContent || '';
          var q = nm.getBoundingClientRect();
          t23.w = Math.round(q.width);
          t23.font = Math.round(parseFloat(getComputedStyle(nm).fontSize) * 10) / 10;
          if (!t23.txt) t23.why.push('★★ボーナスの 行の 字が 空です');
          if (q.width < 1 || q.height < 1) t23.why.push('★★ボーナスの 決まりが 見えません');
          if (nm.scrollWidth > nm.clientWidth + 0.5) {
            t23.cut++;
            t23.why.push('★★★決まりの 文が 切れて います（「' + t23.txt + '」★要 ' + nm.scrollWidth + 'px ／ 有 ' + nm.clientWidth + 'px）');
          }
          if (t23.font < 11) t23.why.push('★★決まりの 文が ' + t23.font + 'px（★11px の 床）');
          t23.over = cell.scrollWidth - cell.clientWidth;
          if (t23.over > 0) t23.why.push('★★ボーナスの 行から 中身が ' + t23.over + 'px あふれて います');
          /* ★★ 2列 ぶち抜きに なって いるか（★1列だと 6文字しか 入りません【実測】）*/
          var other = P.el.cell['n1'];
          t23.cols = Math.round(cell.getBoundingClientRect().width / Math.max(1, other.getBoundingClientRect().width) * 10) / 10;
          if (cell.getBoundingClientRect().width < other.getBoundingClientRect().width * 1.5) {
            t23.why.push('★★ボーナスの 行が 2列 ぶち抜きに なって いません（★' + t23.cols + '列 ぶん）');
          }
        });
      } catch (e) { t23.why.push(String(e && e.message || e)); }
      return t23;
    }
    var t23 = check23();
    for (i = 0; i < t23.why.length; i++) ng.push('★★★★ ボーナスの 決まりが 読めません：' + t23.why[i] + '（★T230・社長の ご指摘③）');
    note['㉓ ★★ボーナスの 決まりが 読める'] = '「' + t23.txt + '」' + t23.w + 'px・字 ' + t23.font +
      'px・切れ ' + t23.cut + '・あふれ ' + t23.over + '／★' + t23.cols + '列 ぶん';

    /* ============================================================
       ★★★★ ㉔ ―― ★★ハッピーが **手番に 合った ことばを 言う**（★社長の ご指摘④）
       ------------------------------------------------------------
       ★ ★社長の 言葉：「★★ハッピー なにか しゃべるようにして。
         ★ ★『ボタンを押して サイコロを振ろう。』とか『変えたくないサイコロを…』とか」
       ★★ ⑲ との ちがい（★★重ねて いません）：
         ★ ★★⑲ … ★★**言っては いけない とき に 言って いないか**（★押せない のに 指図）
         ★ ★★㉔ … ★★★**言う べき とき に 言って いるか**（★★T226 は 1試合に 1回だけ でした）
       ★★ 数える もの（★★本物の 指で 3手番 遊びます）：
         ★ ①★★手番の はじめ … ★「サイコロを ふろう！」（★★毎手番）
         ★ ②★★1回 ふった あと … ★「変えたくない サイコロを おすと のこせるよ！」
         ★ ③★★ふり直しが 0回 … ★「どれかの 役に 書こう！」
         ★ ④★★★2.6秒 で 消える（★出しっぱなしに ならない）
       ★★ 上の 線（★★しゃべりすぎ）：★1手番に 出た 指図が **3回を こえたら** 鳴る。
       ★★ 下の 線（★★しゃべって いない）：★1つでも 出なかったら 鳴る。
       ⚠️★★★ ★★見本は **決め打ち**です。★★★「どの 目を のこせ」「どの 役に 書け」が
          ★ ★★1文字でも まざったら、★もとから ある ①-4（手を 教える 文）が 鳴ります。
          ★ ★★★ここでも 念のため、★★役の 名前が ふきだしに 出て いないかを 数えます。
       ============================================================ */
    var SAYS24 = {
      start: 'サイコロを ふろう！',
      keep:  '変えたくない サイコロを おすと のこせるよ！',
      write: 'どれかの 役に 書こう！'
    };
    /* ⚠️★★★★ 【★私の 失敗・T230】★★`pump(n)` の n は **ミリ秒では ありません** ★★★★
       ★ ★★n は「★★積まれた 時計を **何本 走らせるか**」です（★上の `pump()` を 読めば 書いて あります）。
       ★ ★★私は `pump(50)`＝「50ms 進める」の つもりで 書きました ―― ★★★50本 走らせて いました。
         ★ ★★その 中に ふきだしを 消す 2600ms の 1本が 入って いて、
           ★ ★★★手番の はじめの ことばが、★見る 前に 消えて いました。
         ★ ★★＝ ★★★「その場面を そもそも 作って いない」（★見張って いる ふり の 5つ目）。
           ★ ★★T228 で 私が やった 失敗と **まったく 同じ 形** です。★★2度目 です。
       ★ ★→ ★★**人の 手番に なった ところで 止める** 道具を 作りました（★下の `pumpToMine`）。
         ★ ★★これなら ふきだしを 消す 1本を 走らせずに、★★手番の はじめの こまを 見られます。 */
    function pumpToMine(max) {
      var n = 0;
      while (n++ < (max || 400)) {
        if (P.isMyTurn()) return true;
        if (!pumpOne()) return P.isMyTurn();
      }
      return P.isMyTurn();
    }
    function check24() {
      var t24 = { why: [], saw: { start: 0, keep: 0, write: 0 }, rows: [], gone: -1, most: 0, name: 0 };
      var off = clockOn();
      try {
        withRandom(24242, function () { P.startGame(); });
        var turn;
        for (turn = 0; turn < 3; turn++) {
          var per = 0, seen = [];
          /* ★ ① 手番の はじめ（★★まだ ふって いない）*/
          var s0 = P.sayNow();
          if (s0.text) { per++; seen.push(s0.text); }
          if (s0.text === SAYS24.start) t24.saw.start++;
          else t24.why.push((turn + 1) + '手番目：★手番の はじめの ふきだしが 「' + (s0.text || '（出て いません）') +
                            '」（★「' + SAYS24.start + '」 が 正 ―― ★★★T226 は 1試合に 1回しか 言いません でした）');
          /* ★ ② 1回 ふった あと */
          realTap(P.el.roll());
          var s1 = P.sayNow();
          if (s1.text && seen.indexOf(s1.text) < 0) { per++; seen.push(s1.text); }
          if (s1.text === SAYS24.keep) t24.saw.keep++;
          else if (turn < 3) t24.why.push((turn + 1) + '手番目：★1回 ふった あとの ふきだしが 「' + (s1.text || '（出て いません）') +
                                          '」（★「' + SAYS24.keep + '」 が 正）');
          /* ★ ③ ふり直しを 使いきる */
          realTap(P.el.roll()); realTap(P.el.roll());
          var s2 = P.sayNow();
          if (s2.text && seen.indexOf(s2.text) < 0) { per++; seen.push(s2.text); }
          if (s2.text === SAYS24.write) t24.saw.write++;
          else t24.why.push((turn + 1) + '手番目：★ふり直しが 0回に なった ときの ふきだしが 「' + (s2.text || '（出て いません）') +
                            '」（★「' + SAYS24.write + '」 が 正）');
          if (per > t24.most) t24.most = per;
          t24.rows.push((turn + 1) + '手番目 ' + per + '回：' + seen.join('／'));
          /* ★★ 役の 名前が ふきだしに まざって いないか（★★追記②の 線）*/
          var k24;
          for (k24 = 0; k24 < C.CATS.length; k24++) {
            if (seen.join(' ').indexOf(C.CATS[k24].name) >= 0) {
              t24.name++;
              t24.why.push('★★★ふきだしに 役の 名前 「' + C.CATS[k24].name + '」が 出て います（★追記②：★何を えらぶかは 言いません）');
            }
          }
          /* ★ 書いて 次の 手番へ */
          var st = P.state(), sh = st.sheet, wrote = false, k;
          for (k = 0; k < C.NCAT; k++) {
            if (sh[k] == null) { var el = P.el.cell[C.CATS[k].id]; if (el && !el.disabled) { realTap(el); wrote = true; } break; }
          }
          if (!wrote) { t24.why.push((turn + 1) + '手番目：空きマスに 書けません でした'); break; }
          /* ★★ ロボットの 手番を 通して、★★★人の 手番に なった **その こま** で 止めます
             ★ ★（★★drain して しまうと、★次の 手番の ことばも 消えて しまいます ―― ★私の 失敗）*/
          if (!pumpToMine(400)) { t24.why.push((turn + 1) + '手番目：★次の 手番に 戻れません でした'); break; }
        }
        /* ★★★ ④ 出しっぱなしに ならない ―― ★時計を ぜんぶ 走らせたら 消える ★★★ */
        withRandom(24243, function () { P.startGame(); });
        var before24 = P.sayNow().text;
        pump();                                       /* ★ 積まれた 時計を ぜんぶ 走らせる */
        t24.gone = P.sayNow().text ? 1 : 0;
        if (!before24) t24.why.push('★★消える かを 試す 場面が 作れません でした（★★★下の 線）');
        if (t24.gone) t24.why.push('★★★2.6秒 たっても ふきだしが 消えません（「' + P.sayNow().text + '」★出しっぱなし）');
      } catch (e) { t24.why.push(String(e && e.message || e)); }
      off();
      /* ★★★ 下の 線 ★★★ */
      if (!t24.saw.start) t24.why.push('★★「' + SAYS24.start + '」を 1回も 見られません でした（★★見張りが 死んで います）');
      if (!t24.saw.keep)  t24.why.push('★★「' + SAYS24.keep + '」を 1回も 見られません でした（★★★社長の ご指摘④ そのもの）');
      if (!t24.saw.write) t24.why.push('★★「' + SAYS24.write + '」を 1回も 見られません でした');
      /* ★★★ 上の 線 ―― ★しゃべりすぎ ★★★ */
      if (t24.most > 3) t24.why.push('★★1手番に ' + t24.most + '回 しゃべって います（★★3回 まで）');
      return t24;
    }
    var t24 = check24();
    for (i = 0; i < t24.why.length; i++) ng.push('★★★★ ハッピーの ことば：' + t24.why[i] + '（★T230・社長の ご指摘④）');
    note['㉔ ★★★ハッピーが 手番に 合った ことばを 言う'] = t24.rows.join('　★') +
      '／★出た はじめ ' + t24.saw.start + '・のこす ' + t24.saw.keep + '・書く ' + t24.saw.write +
      '／★1手番の 最大 ' + t24.most + '回（★3回まで）／★2.6秒で 消える ' + (t24.gone === 0 ? '○' : '★★×') +
      '／★役の 名前が まざった ' + t24.name + '件';

    /* ============================================================
       ★★★ ㉕ ―― ★★1マスの 2つの 数字が 見分けられる（★T231・🎨アト）★★★
       ------------------------------------------------------------
       ★ ★★病気の 名前は「★★★すきまが そろって いない」でした【★T231 実測】：
         ★ ★ ★ロボットの 点が 1けた … すきま 17.4〜23.4px
         ★ ★ ★ロボットの 点が 2けた … ★★すきま **7.4px**（★3分の1）
         ★ ★ ★ボーナスの 行 ………… ★★**4.9〜5.6px**
         ★ ★ ＝ ★目が「18px 空いたら 別の 数字」と 覚えた ところへ 7.4px が 来て、
         ★ ★ ★★★「8 12」が **「812」**に 読めて いました（★写真・`zoom_mae.png`）。
       ★ ★★だから ここでは **「線が どこに あるか」を 数えます** ――
         ★ ★★★すきまが いくつでも、★切れ目が 同じ 場所に あれば 読み まちがえません。

       ★★ 見本（★決め打ち・★★CSS を 見に 行きません）
         ★ ・マスの 数 …………………… 13
         ★ ・線の はば ………………… 1.5px（★0.8px を 割ったら 鳴る）
         ★ ・線と 字の すきま ………… 1.5px いじょう
         ★ ・2つの 数字の すきま …… 6px いじょう（★★いまの 実測は 8px）
         ★ ・同じ 列の 中の 場所ずれ 0.6px まで
         ★ ・上の 帯の 線 ……………… 1本
       ============================================================ */
    var T25 = { cells: 13, wMin: 0.8, inkMin: 1.5, gapMin: 6, zureMax: 0.6 };

    function inkBox25(el) {
      var r = document.createRange(); r.selectNodeContents(el);
      var b = r.getBoundingClientRect();
      try { r.detach(); } catch (e) {}
      return b;
    }

    function check25() {
      var t = { why: [], rows: [], n: 0, wMin: 999, inkMin: 999, gapMin: 999,
                zure: 0, band: 0, ratio: 999, twoDigit: 0 };
      try {
        /* ★ ★★2けた どうしが いちばん せまい ので、★人の 表を 2けたに して 測ります
           ★ ★（★★点の つけ方は 触りません ―― ★見るのは **ならび** だけ）。 */
        var sh = C.newSheet(), q;
        for (q = 0; q < 12; q++) sh[q] = null;
        P.setSheet(sh);
        P.setDice([4, 4, 4, 4, 4], 1);         /* ★ 2けたに なる 目（★4の目 ＝ 20点）*/

        var cells = document.querySelectorAll('#sheet .cell');
        t.n = cells.length;
        if (!t.n) { t.why.push('★★1マスも 数えられません でした（★★★下の 線）'); return t; }
        if (t.n !== T25.cells) t.why.push('★マスの 数が ' + t.n + '（★見本 ' + T25.cells + '）');

        /* ★ 2けたの 字の はば（★人の 点から 借ります ―― ★2つの 器は 同じ 字・同じ 大きさ）*/
        var wide = 0, k, e, pt, bp, cs, w, x, box, a;
        var xs = {};
        for (k = 0; k < cells.length; k++) {
          e = cells[k];
          pt = e.querySelector('.cell-pt'); bp = e.querySelector('.cell-bp');
          if (!pt || !bp) { t.why.push('★★点の 器が 見つかりません でした（★★★下の 線）'); return t; }
          a = inkBox25(pt);
          if (/^[0-9][0-9]/.test(pt.textContent.trim())) { t.twoDigit++; if (a.width > wide) wide = a.width; }
        }
        if (!wide) { t.why.push('★★2けたの 数字を 1つも 見られません でした（★★★下の 線 ―― ★いちばん せまい 場面を 作れて いません）'); return t; }

        for (k = 0; k < cells.length; k++) {
          e = cells[k];
          pt = e.querySelector('.cell-pt'); bp = e.querySelector('.cell-bp');
          box = e.getBoundingClientRect();
          cs = getComputedStyle(e, '::after');
          w = parseFloat(cs.width) || 0;
          /* ⚠️★★★ ★はば だけを 見ては いけません ★★★
             ★ ★★私は 1度 それで 落ちました：★★★`display:none` に しても、
               ★ ★★`getComputedStyle` の `width` は **1.5px の まま** 返って きます。
             ★ ★★★＝ ★線を 消した のに、★見張りが「1.5px あります」と 言って いました
               ★ ★（★★私の 壊し方 ㊲㊷ が、★★★この 穴を 見つけました）。
             ★ ★→ ★★出て いない 形を **3つ とも** 見ます：display・content・visibility。 */
          if (cs.display === 'none' || cs.content === 'none' || cs.visibility === 'hidden') w = 0;
          var rt = parseFloat(cs.right); if (rt !== rt) rt = 0;
          x = box.right - rt - w;                    /* ★ 線の 左はし */
          if (w < t.wMin) t.wMin = w;
          if (w < T25.wMin) t.why.push('★★★' + e.querySelector('.cell-name').textContent +
            '：★線が 出て いません（はば ' + Math.round(w * 100) / 100 + 'px・display ' + cs.display +
            '・content ' + cs.content + ' ／ 見本 ' + T25.wMin + 'px）');
          /* ★ 線が 地と 同じ 色に なって いないか */
          var rr = ratio25(cs.backgroundColor, bgOf25(e));
          if (rr < t.ratio) t.ratio = rr;

          /* ★ 線と 字の すきま（★★★左は 人の 字、右は ロボットの 器 ＋ 2けたの あそび）*/
          a = inkBox25(pt);
          var bq = bp.getBoundingClientRect();
          var dl = x - a.right;
          var dr = (bq.right - wide) - (x + w);      /* ★ 2けたの ときの ロボットの 字の 左はし */
          if (dl < t.inkMin) t.inkMin = dl;
          if (dr < t.inkMin) t.inkMin = dr;
          var gap = (bq.right - wide) - a.right;     /* ★ 2つの 数字の すきま（★2けた どうし）*/
          if (gap < t.gapMin) t.gapMin = gap;

          /* ★ 同じ 列（★左／右）の 中で 線の 場所が そろって いるか */
          var col = (box.left < (document.getElementById('sheet').getBoundingClientRect().left +
                     document.getElementById('sheet').getBoundingClientRect().width / 2 - 1)) ? 'L' : 'R';
          if (e.classList.contains('is-bonus')) col = 'R';   /* ★ ぶち抜きの 行は 右の 列と 同じ 右はし */
          (xs[col] = xs[col] || []).push(x);
          t.rows.push(e.querySelector('.cell-name').textContent + ' 線' + Math.round(x) +
                      '/' + Math.round(w * 10) / 10 + 'px');
        }
        for (var c in xs) {
          var v = xs[c], z = Math.max.apply(null, v) - Math.min.apply(null, v);
          if (z > t.zure) t.zure = z;
        }
        if (t.zure > T25.zureMax)
          t.why.push('★★★線の 場所が そろって いません（★同じ 列の 中で ' +
            Math.round(t.zure * 10) / 10 + 'px ずれ ／ 見本 ' + T25.zureMax + 'px まで）');
        if (t.inkMin < T25.inkMin)
          t.why.push('★★★線が 数字に くっついて います（' + Math.round(t.inkMin * 10) / 10 +
            'px ／ 見本 ' + T25.inkMin + 'px いじょう）');
        if (t.gapMin < T25.gapMin)
          t.why.push('★★★2つの 数字の すきまが せますぎます（' + Math.round(t.gapMin * 10) / 10 +
            'px ／ 見本 ' + T25.gapMin + 'px いじょう）★★★「812」に 読めます');
        if (t.ratio < 1.15)
          t.why.push('★★★線が 地と 同じ 色です（へだたり ' + t.ratio + ' ／ 見本 1.15 いじょう）');

        /* ★★ 上の 帯にも 同じ 線が あるか（★★★これが「見出し」の 代わり です）*/
        var bn = document.querySelector('.me-band .me-name.bot');
        if (!bn) { t.why.push('★★上の 帯の ロボットが 見つかりません でした（★★★下の 線）'); }
        else {
          var bcs = getComputedStyle(bn, '::before');
          t.band = (parseFloat(bcs.width) || 0);
          if (bcs.display === 'none' || bcs.content === 'none' || bcs.visibility === 'hidden') t.band = 0;
          if (t.band < T25.wMin)
            t.why.push('★★★上の 帯に 線が ありません（はば ' + Math.round(t.band * 100) / 100 +
              'px）―― ★★表の 13本の 線が「何の 線か」を 言う ものが 無く なります');
        }
        if (t.wMin !== t.wMin || t.inkMin !== t.inkMin || t.gapMin !== t.gapMin)
          t.why.push('★★測った 値が 数に なりません でした（★★★下の 線）');
      } catch (e2) {
        t.why.push('★★測れません でした：' + String(e2 && e2.message || e2) + '（★★★下の 線）');
      }
      return t;
    }

    /* ★ ★へだたりの 道具（★★T227 と 同じ ものさし。★★ここで 閉じて 持ちます）*/
    function lum25(c) {
      var m = String(c).match(/[\d.]+/g) || [0, 0, 0, 1];
      var al = m.length > 3 ? parseFloat(m[3]) : 1;
      var v = [0, 1, 2].map(function (i) {
        var x = parseFloat(m[i]) / 255;
        x = al >= 1 ? x : x * al + 1 * (1 - al);
        return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
    }
    function ratio25(fg, bg) {
      var a = lum25(fg), b = lum25(bg), hi = Math.max(a, b), lo = Math.min(a, b);
      return Math.round((hi + 0.05) / (lo + 0.05) * 100) / 100;
    }
    function bgOf25(el) {
      for (var e = el; e && e !== document.documentElement; e = e.parentElement) {
        var c = getComputedStyle(e).backgroundColor;
        var m = String(c).match(/[\d.]+/g);
        if (m && (m.length < 4 || parseFloat(m[3]) > 0.5)) return c;
      }
      return 'rgb(255,255,255)';
    }

    /* ============================================================
       ★★★ ㉕-2 ―― ★★へだたりの 数が **嘘に なる 形**を 見つける（★T231・🎨アト）★★★
       ------------------------------------------------------------
       ★ ★★★これは 💻コーダの 3度目の 失敗（★T230 §6-1）から 作りました。
         ★ ★★彼の ㉑ は 字の **大きさ**を 数えて いましたが、★★★色は 数えて いません でした。
         ★ ★★★彼は そのあと へだたりの 目を 足しました ―― ★★でも まだ 穴が あります：
       ★ ★★★`bgOf` は「★とうめい度 0.5 いかの 地は とばして 上へ さがす」形です。
         ★ ★★★＝ ★★字の すぐ うしろに **うすい 板**（★とうめい度 0.1）を 敷くと、
           ★ ★★★★板を **とばして** 数えます ―― ★★★数は ○ を 出し、★絵は 読みにくく なります。
       ★ ★★★これは 見立てでは ありません。★★★私が T231 で 実際に 試した 形 です
         ★ ★（★★コーダの 案①「ロボットの 点に うすい 台」＝ ★写真 `zoom_kouho_B_css.png`）。
       ★ ★★だから ここでは「へだたりの **数を 信じて よい 形か**」を 数えます。
         ★ ★★見つけたら 鳴らします ―― ★★★「読めない」では なく「★★数えられない」で。
       ============================================================ */
    function check25b() {
      var t = { why: [], n: 0, list: [] };
      try {
        var els = document.querySelectorAll('#sheet .cell-pt, #sheet .cell-bp, .me-band .me-pt');
        t.n = els.length;
        if (!t.n) { t.why.push('★★1つも 数えられません でした（★★★下の 線）'); return t; }
        for (var i = 0; i < els.length; i++) {
          var el = els[i], nm = (el.parentElement.querySelector('.cell-name') || {}).textContent || '帯';
          var cls = el.className;
          /* ★ ① 字から 上へ ―― ★数を 嘘に する 形が ないか */
          for (var e = el; e && e !== document.body; e = e.parentElement) {
            var s = getComputedStyle(e);
            if (parseFloat(s.opacity) < 1 && e !== el.closest('.cell'))
              t.why.push('★★' + nm + '（' + cls + '）：★うすめ（opacity ' + s.opacity +
                '）が かかって います ―― ★★★へだたりの 数が 嘘に なります');
            if (s.filter && s.filter !== 'none')
              t.why.push('★★' + nm + '：★filter（' + s.filter + '）が かかって います ―― ★★★同上');
            if (s.mixBlendMode && s.mixBlendMode !== 'normal')
              t.why.push('★★' + nm + '：★mix-blend-mode（' + s.mixBlendMode + '）―― ★★★同上');
            /* ★ ② ★★字と 地の あいだに **うすい 板**が はさまって いないか */
            var bc = String(s.backgroundColor).match(/[\d.]+/g);
            if (bc && bc.length > 3) {
              var al = parseFloat(bc[3]);
              if (al > 0.01 && al <= 0.5)
                t.why.push('★★★' + nm + '（' + cls + '）：★字と 地の あいだに うすい 板が あります' +
                  '（とうめい度 ' + al + '）―― ★★★`bgOf` は これを **とばして** 数えます');
            }
            if (getComputedStyle(e).backgroundColor &&
                (String(getComputedStyle(e).backgroundColor).match(/[\d.]+/g) || []).length < 4) break;
          }
          /* ★ ③ ★★字そのものに 板を 敷く もう1つの 形（★::before / ::after の 地）*/
          var pb = getComputedStyle(el, '::before'), pa = getComputedStyle(el, '::after');
          [pb, pa].forEach(function (ps, j) {
            var m = String(ps.backgroundColor).match(/[\d.]+/g);
            var wpx = parseFloat(ps.width) || 0;
            if (m && wpx > 0 && (m.length < 4 || parseFloat(m[3]) > 0.01))
              t.why.push('★★★' + nm + '：★字の ' + (j ? '::after' : '::before') +
                'に 地が 敷かれて います ―― ★★★へだたりの 数が 嘘に なります');
          });
        }
      } catch (e3) {
        t.why.push('★★数えられません でした：' + String(e3 && e3.message || e3) + '（★★★下の 線）');
      }
      return t;
    }

    var t25 = check25();
    for (i = 0; i < t25.why.length; i++)
      ng.push('★★★★ 1マスの 2つの 数字：' + t25.why[i] + '（★T231・🎨アト）');
    note['㉕ ★★★1マスの 2つの 数字が 見分けられる'] =
      t25.n + 'マス／★線 ' + Math.round(t25.wMin * 10) / 10 + 'px（★見本 1.5px）' +
      '／★線と 字 ' + Math.round(t25.inkMin * 10) / 10 + 'px（★見本 ' + T25.inkMin + 'px）' +
      '／★2つの 数字の すきま ' + Math.round(t25.gapMin * 10) / 10 + 'px（★見本 ' + T25.gapMin + 'px）' +
      '／★列の 中の ずれ ' + Math.round(t25.zure * 100) / 100 + 'px' +
      '／★線と 地の へだたり ' + t25.ratio +
      '／★上の 帯の 線 ' + Math.round(t25.band * 10) / 10 + 'px' +
      '／★2けたを 見た ' + t25.twoDigit + 'マス';

    var t25b = check25b();
    for (i = 0; i < t25b.why.length; i++)
      ng.push('★★★★ へだたりが 数えられません：' + t25b.why[i] + '（★T231・🎨アト）');
    note['㉕-2 ★★へだたりの 数を 信じて よい 形か'] =
      t25b.n + 'つ 見て、★嘘に なる 形 ' + t25b.why.length + '件' +
      '（★うすめ・filter・blend・うすい板・字の 地 ―― ★★★どれも コーダの 3度目の 失敗の 型）';

    /* ============================================================
       ★★★ ㉖ ―― ★★見張りの あと、★★★ロボットの 点が 消えて いない（★T232・💻コーダ）★★★
       ------------------------------------------------------------
       ★ ★★★これは 私の しくじりの 下の 線 です【★T232 実測・10画面 とも】：
         ★ ★見張りの 前 `sheets[1] = [1,null,6,4,null,0,…]` → ★★後 **ぜんぶ null**。
         ★ ★★上の 帯も「ロボット 11」→「ロボット 0」に なって いました。
         ★ ★わけ：★戻しは `P.setSheet` しか 使わず、★★それは **人の 表だけ** を 戻します。
           ★ ★★見張りの 中で `P.startGame()` を 14回 呼ぶ ので、★ロボットの 表は 空の まま。
       ★ ★★★ここで 数えるのは「★★本物の 戻し（`restoreAll`）を 走らせて、
         ★ ★★★ロボットの 表が 見本の とおりに 返って くるか」だけ です ――
           ★ ★★写しを 作って いません（★★★写しを 見張ると「見張って いる ふり」に なります）。
       ★ ★★見本は 決め打ち（★1の目 4点・3の目 9点・いちばん 下 50点。★どれも ありえる 点）。
       ============================================================ */
    function check26() {
      var t = { why: [], want: '', got: '', ran: 0 };
      var g0 = Y._g();
      if (!g0 || !g0.sheets || !g0.sheets[1]) {
        t.why.push('★★ロボットの 表が 見つかりません でした（★★★下の 線）'); return t;
      }
      var saveK = kSheet, saveB = kBotSheet;
      var saveS0 = g0.sheets[0].slice(), saveS1 = g0.sheets[1].slice();
      try {
        var mihon = C.newSheet();
        mihon[0] = 4; mihon[2] = 9; mihon[mihon.length - 1] = 50;
        kBotSheet = mihon.slice();
        if (!kSheet) kSheet = g0.sheets[0].slice();   /* ★ 戻しの 入口を 開ける（★遊びが 無い まま 呼ばれた とき）*/
        g0.sheets[1] = C.newSheet();                  /* ★★ `startGame` の あとの 姿（★空）に する */
        restoreAll();                                 /* ★★★ 本物の 戻しを 走らせる */
        P.clearTimers();
        t.ran = 1;
        t.want = JSON.stringify(mihon);
        t.got = JSON.stringify(Y._g().sheets[1]);
        if (t.want !== t.got)
          t.why.push('★★★見張りの あと、ロボットの 点が 消えて います（★見本 ' + t.want +
            ' ／ 出た ' + t.got + '）―― ★★遊びの 途中で 見張りを かけると、ロボットの 点が 0に なります');
      } catch (e26) {
        t.why.push('★★測れません でした：' + String(e26 && e26.message || e26) + '（★★★下の 線）');
      }
      /* ★ 片づけ（★★型の ⑤：さわった ものは 1つ 残らず 戻す）*/
      try {
        kBotSheet = saveB; kSheet = saveK;
        g0.sheets[0] = saveS0; g0.sheets[1] = saveS1;
        P.clearTimers(); P.render();
      } catch (e27) {}
      if (!t.ran) t.why.push('★★1回も 戻しを 走らせられません でした（★★★下の 線）');
      return t;
    }
    var t26 = check26();
    for (i = 0; i < t26.why.length; i++)
      ng.push('★★★★ 見張りの あと ロボットの 点：' + t26.why[i] + '（★T232・💻コーダ）');
    note['㉖ ★★★見張りの あと ロボットの 点が 消えて いない'] =
      '★戻しを 走らせた ' + (t26.ran ? '○' : '★★×') + '／★見本 ' + (t26.want || '―') +
      '／★出た ' + (t26.got || '―');


    /* ============================================================
       ★★★ ㉗ ―― ★★役の 名前が、★どの はばでも 切れない（★T233・🎨アト）★★★
       ------------------------------------------------------------
       ★ ★★病気の 名前は「★★★字の 大きさが、たけ からしか 決まって いない」でした。
         ★ ★`layout()`：`--cell-f = min(19, cellH×0.40)` ／ `--cell-n = min(23, cellH×0.46)`
         ★ ★★たて向きの スマメは たけ 844px ―― ★1マスが 64px（天井）に なり、
           ★ ★字も 19/23px（天井）に なります。★★★はばを 1回も 見て いません。
       ★ ★★【★実測・T233】★いままで 測った 10画面の 1マスは **たけの 4.59倍 いじょう 横長**。
         ★ ★★新しい 2画面（390×844・375×812）だけ **2.8倍** ―― ★かたちが ちがいました。

       ★★ 見本（★決め打ち・★★CSS を 見に 行きません）
         ★ ・はばは **294 〜 1000px** まで 通す（★★下の TESTW）
         ★ ・切れ ……………………… 0マス
         ★ ・いちばん せまい あまり … **1.0px いじょう**（★★実測 2.8px＠294px）
         ★ ・はばを 半分に したら 字も 小さく なる（★★★天井が 生きて いる しるし）
         ★ ・いちばん 長い 3つの 名前（フォーダイス／S.ストレート／B.ストレート）と
         ★   ボーナスの 文が、★★ちゃんと 表の 中に 出て いる
       ============================================================ */
    var T27 = {
      wMin: 294, wMax: 1000,
      amariMin: 1.0,
      /* ★ JS の 天井（`yacht-game.js` の layout()）―― ★いちばん 字が 太る 姿 */
      fCeil: 19, nCeil: 23,
      /* ★ ★★ここに 出て いなければ「測れて いない」（★下の 線）*/
      mustHave: ['フォーダイス', 'S.ストレート', 'B.ストレート'],
      mustHaveBonus: '63点'
    };

    /* ★ 測る はば（★せまい ところは こまかく・★広い ところは あらく）*/
    function widths27() {
      var a = [], w;
      for (w = T27.wMin; w <= 520; w += 2) a.push(w);
      for (w = 540; w <= T27.wMax; w += 20) a.push(w);
      /* ★★ 11画面＋底 の 表の はば（★実測値）―― ★★★ここは 必ず 通します */
      [306.9, 314, 362.3, 363, 378, 401, 443.5, 461.4, 507.4].forEach(function (x) { a.push(x); });
      return a;
    }

    function inkBox27(el) {
      var r = document.createRange(); r.selectNodeContents(el);
      var b = r.getBoundingClientRect();
      try { r.detach(); } catch (e) {}
      return b;
    }

    function check27() {
      var t = { why: [], n: 0, widths: 0, cut: 0, amari: 99999, amariW: 0, amariNm: '',
                fWide: 0, fNarrow: 0, names: '' };
      var st = null;
      try {
        var sheet = document.getElementById('sheet') || document.querySelector('.sheet');
        if (!sheet) { t.why.push('★★表が 見つかりません でした（★★★下の 線）'); return t; }

        /* ★ ★★いちばん 長い 名前が 本当に 出て いるか（★★下の 線）
           ★ ★★★ここを 見ないと、★★空の 表を 137回 測って「ぜんぶ OK」に なります。 */
        var cells = document.querySelectorAll('#sheet .cell');
        t.n = cells.length;
        if (!t.n) { t.why.push('★★1マスも 数えられません でした（★★★下の 線）'); return t; }
        var names = [], i2;
        for (i2 = 0; i2 < cells.length; i2++) {
          var n2 = cells[i2].querySelector('.cell-name');
          if (!n2) { t.why.push('★★名前の 器が 見つかりません でした（★★★下の 線）'); return t; }
          names.push(n2.textContent);
        }
        t.names = names.join('／');
        for (i2 = 0; i2 < T27.mustHave.length; i2++)
          if (t.names.indexOf(T27.mustHave[i2]) < 0)
            t.why.push('★★「' + T27.mustHave[i2] + '」が 表に 出て いません ―― ★★★いちばん 長い 名前を 測れて いません（★★★下の 線）');
        if (t.names.indexOf(T27.mustHaveBonus) < 0)
          t.why.push('★★ボーナスの 文が 表に 出て いません ―― ★★★いちばん 長い 文を 測れて いません（★★★下の 線）');
        if (t.why.length) return t;

        /* ★ ★★はばを 決め打ちし、★字を JS の 天井に 固定する */
        st = document.createElement('style');
        st.setAttribute('data-t27', '1');
        document.head.appendChild(st);
        function setW(w) {
          st.textContent =
            ':root{ --cell-f:' + T27.fCeil + 'px !important; --cell-n:' + T27.nCeil + 'px !important; }' +
            '#sheet{ width:' + w + 'px !important; max-width:' + w + 'px !important;' +
            '        min-width:' + w + 'px !important; flex:0 0 auto !important; }';
          return sheet.getBoundingClientRect().width;
        }

        var list = widths27(), w, got, k, e, nm, cut = 0;
        for (var wi = 0; wi < list.length; wi++) {
          w = list[wi];
          got = setW(w);
          /* ⚠️★★★ ★★下の 線 ③ ―― ★★★「はばを 変えた つもりが、変わって いなかった」
             ★ ★★これを 見ないと、★同じ 姿を 137回 測って「ぜんぶ OK」に なります。 */
          if (Math.abs(got - w) > 1) {
            t.why.push('★★表の はばを ' + w + 'px に できません でした（★実際 ' +
              Math.round(got * 10) / 10 + 'px）―― ★★★測れて いません（★★★下の 線）');
            return t;
          }
          t.widths++;
          for (k = 0; k < cells.length; k++) {
            e = cells[k]; nm = e.querySelector('.cell-name');
            var need = nm.scrollWidth, have = nm.clientWidth;
            var am = have - inkBox27(nm).width;
            if (need > have + 0.5) { cut++; am = -(need - have); }
            if (am < t.amari) { t.amari = Math.round(am * 10) / 10; t.amariW = w; t.amariNm = nm.textContent; }
          }
          /* ★ ★★天井が 生きて いる しるし（★せまい ほうが 字も 小さい）*/
          if (Math.abs(w - 300) < 4) t.fNarrow = parseFloat(getComputedStyle(cells[0].querySelector('.cell-name')).fontSize);
          if (Math.abs(w - 900) < 11) t.fWide = parseFloat(getComputedStyle(cells[0].querySelector('.cell-name')).fontSize);
        }
        t.cut = cut;

        if (!t.widths) { t.why.push('★★はばを 1つも 測れません でした（★★★下の 線）'); return t; }
        if (t.widths < 100) t.why.push('★★測った はばが ' + t.widths + '通りしか ありません（★見本 100通り いじょう）（★★★下の 線）');
        if (t.amari !== t.amari || t.fNarrow !== t.fNarrow)
          { t.why.push('★★測った 値が 数に なりません でした（★★★下の 線）'); return t; }

        if (cut > 0)
          t.why.push('★★★役の 名前が 切れます（★' + cut + 'マス ／ ★いちばん ひどいのは はば ' +
            t.amariW + 'px の「' + t.amariNm + '」で ' + (-t.amari) + 'px はみ出し）');
        else if (t.amari < T27.amariMin)
          t.why.push('★★★切れる 一歩 手前です（★はば ' + t.amariW + 'px の「' + t.amariNm +
            '」で あまり ' + t.amari + 'px ／ 見本 ' + T27.amariMin + 'px いじょう）');

        /* ★★★ 天井が そもそも 効いて いるか（★★★構えを 直に 見ます）
           ★ ★★これが 無いと ―― ★★はばを 変えても 字が 19px の まま ＝ T233 を 入れる 前の 姿。 */
        if (!(t.fNarrow < t.fWide - 0.5))
          t.why.push('★★★字の 大きさが「はば」から 決まって いません（★はば300で ' + t.fNarrow +
            'px ／ はば900で ' + t.fWide + 'px）―― ★★★たけ だけで 決めて います（★T233 の 病気）');

      } catch (e2) {
        t.why.push('★★測れません でした：' + String(e2 && e2.message || e2) + '（★★★下の 線）');
      } finally {
        if (st && st.parentNode) st.parentNode.removeChild(st);
        try { P.layout(); P.render(); } catch (e3) {}
      }
      return t;
    }

    /* ============================================================
       ★★★ ㉗-2 ―― ★★T231 の 線が「本当に 出て いる 字」に ついて いるか（★T233・🎨アト）★★★
       ------------------------------------------------------------
       ★ ★★これは 私が T233 で **実際に 落ちた** ところ から 作りました。
         ★ ★T231 の 線は `right: 9.35px + 1.5 × var(--cell-n)` で 置いて あります。
         ★ ★★★私は はじめ 字にだけ 天井を かけました ―― ★器は 縮み、★★線だけ 元の 場所に 残り、
           ★ ★★★T231 の「★列の 中の ずれ 0px」が **7.7px** に なりました【★実測】。
       ★ ★★＝ ★★★「字を 変えたら、線も いっしょに 変える」を **数で** 縛ります。
         ★ ★★見るのは `--cell-n` では なく ★★★**本当に 出て いる 字の 大きさ**（getComputedStyle）。
           ★ ★★★変数を 見に 行くと、★変数が 正しい まま 字だけ ちがう 形を 見のがします。
       ============================================================ */
    function check27b() {
      var t = { why: [], n: 0, maxDiff: 0, zure: 0 };
      try {
        var cells = document.querySelectorAll('#sheet .cell');
        t.n = cells.length;
        if (!t.n) { t.why.push('★★1マスも 数えられません でした（★★★下の 線）'); return t; }
        var xs = {}, seen = 0;
        for (var k = 0; k < cells.length; k++) {
          var e = cells[k], pt = e.querySelector('.cell-pt');
          if (!pt) { t.why.push('★★点の 器が 見つかりません でした（★★★下の 線）'); return t; }
          var cs = getComputedStyle(e, '::after');
          var w = parseFloat(cs.width) || 0;
          if (cs.display === 'none' || cs.content === 'none' || cs.visibility === 'hidden') continue;
          if (!(w > 0)) continue;
          seen++;
          var rt = parseFloat(cs.right); if (rt !== rt) rt = 0;
          var nreal = parseFloat(getComputedStyle(pt).fontSize);
          if (nreal !== nreal) { t.why.push('★★点の 字の 大きさが 数に なりません でした（★★★下の 線）'); return t; }
          var want = 9.35 + 1.5 * nreal;
          var d = Math.abs(rt - want);
          if (d > t.maxDiff) t.maxDiff = Math.round(d * 100) / 100;
          if (d > 0.6)
            t.why.push('★★★' + e.querySelector('.cell-name').textContent +
              '：★線の 場所が 字に ついて いって いません（★線 ' + Math.round(rt * 10) / 10 +
              'px ／ 字 ' + nreal + 'px から すると ' + Math.round(want * 10) / 10 + 'px）');
          var box = e.getBoundingClientRect();
          var col = e.classList.contains('is-bonus') ? 'R' :
            (box.left < document.getElementById('sheet').getBoundingClientRect().left +
              document.getElementById('sheet').getBoundingClientRect().width / 2 - 1 ? 'L' : 'R');
          (xs[col] = xs[col] || []).push(box.right - rt);
        }
        if (!seen) { t.why.push('★★線を 1本も 見られません でした（★★★下の 線）'); return t; }
        for (var c in xs) {
          var v = xs[c]; if (v.length < 2) continue;
          var z = Math.max.apply(null, v) - Math.min.apply(null, v);
          if (z > t.zure) t.zure = Math.round(z * 100) / 100;
        }
        if (t.zure > 0.6)
          t.why.push('★★★線の 場所が そろって いません（★同じ 列の 中で ' + t.zure + 'px ずれ）');
      } catch (e4) {
        t.why.push('★★数えられません でした：' + String(e4 && e4.message || e4) + '（★★★下の 線）');
      }
      return t;
    }

    var t27 = check27();
    for (i = 0; i < t27.why.length; i++)
      ng.push('★★★★ 役名が どの はばでも 読める：' + t27.why[i] + '（★T233・🎨アト）');
    note['㉗ ★★★役の 名前が、どの はばでも 切れない'] =
      t27.widths + '通りの はば（' + T27.wMin + '〜' + T27.wMax + 'px）を 通して、★切れ ' + t27.cut + 'マス' +
      '／★いちばん せまい あまり ' + t27.amari + 'px（★はば ' + t27.amariW + 'px の「' + t27.amariNm + '」' +
      '／★見本 ' + T27.amariMin + 'px）' +
      '／★字は はば300で ' + t27.fNarrow + 'px・はば900で ' + t27.fWide + 'px' +
      '（★★★2つが 同じなら、たけ だけで 決めて います）';

    var t27b = check27b();
    for (i = 0; i < t27b.why.length; i++)
      ng.push('★★★★ 線が 字に ついて いる：' + t27b.why[i] + '（★T233・🎨アト）');
    note['㉗-2 ★★線が「本当に 出て いる 字」に ついて いるか'] =
      t27b.n + 'マス／★線と 字の 食いちがい 多くて ' + t27b.maxDiff + 'px（★見本 0.6px まで）' +
      '／★列の 中の ずれ ' + t27b.zure + 'px';


    /* ============================================================
       ★★★ ㉘ ―― ★★上の 帯が、★どの はばでも 中身を 入れきる（★T235・💻コーダ）★★★
       ------------------------------------------------------------
       ★ ★★これは 🧪トライが T234 §1 で 見つけた 切れ から 作りました。
         ★ ★★「◯回目 / 12回」の **「回」が 消えます**（★せまい 5画面・★71.25%の 試合）。
         ★ ★★★見張り 41個は 1つも 鳴りません でした ―― ★見つけたのは **写真** です
           ★ ★（★追記⑦「★私たちの 見張りは 数字を 見て いる。★絵は いまも 人しか 見て いない」の 3度目）。

       ⚠️★★★ なぜ ㉒ が 鳴らなかったか ―― ★★★これが この 目の 中心 です【★私の しくじり】
         ★ ★㉒ は `band.scrollWidth - band.clientWidth` を **すでに 見て いました**（★上の 線は あった）。
         ★ ★★でも ㉒ は 本物の 試合を **8手番だけ** 進めて 測ります ―― ★★そこの 点は まだ **1〜2けた**。
         ★ ★★★＝ ★見て いる ものは 正しく、★★★見せて いる 場面が **いちばん 軽い もの**でした。
         ★ ★★「いちばん 重い 中身」を **自分で 作らない** 見張りは、
           ★ ★★★軽い 場面を 何百回 測っても だまって います（★★これが 8つ目の「見張って いる ふり」）。
         ★ ★→ ★★★🧪トライの お願い（T234 §12-3）そのもの：
           ★ ★★「★1マスの 数字を **いちばん 大きい 値**に 差しかえて から 測る」。

       ★★★ この 目の 3本の 線
         ★ ★①★**上の 線** … ★306〜1000px の どの はばでも、★帯から 中身が あふれない
         ★ ★②★**下の 線** … ★★測れて いない ときも 鳴る
           ★ ★・帯／中の 器が 見つからない　・中身が 5個で ない
           ★ ・★★いちばん 大きい 中身を **入れられなかった**（★入って いないのに 測ると 全部 ○ に なる）
           ★ ・★★はばを 決めた つもりが **決まって いない**（★★★㉗ で 私が 落ちた 形）
           ★ ・測った はばが 100通り 未満　・数が 数に ならない
         ★ ★③★**見本（★決め打ち）** … ★★下の T28
           ★ ★★あわせて「★★★その 見本が いまも 本当か」を **核から 数え直して** 突き合わせます
             ★ ★（★点の 天井 345点 ／ ★「◯回目 / ◯回」の 書きかた）。★ずれたら 鳴ります
             ★ ★★＝ ★★★見本が 古く なった ことに、★人より 先に 気づく ため。

       ⚠️★★ ★★★「1マスに 入る 数は 多くて 2けた」は **役の マス だけ** の 話 です
          ★ ★（★いちばん 大きい 役 ＝ ヨットの 50点）。★★★上の 帯は ちがいます ――
          ★ ★★合計点は **3けた**に なります（★★天井 345点）。★★1〜6の 合計も **126点**まで あります。
          ★ ★★★T230 §1-2 の 私の 覚え書きは、★そこを ひとまとめに して いました（★T234 §2-3・🧪トライ）。
       ============================================================ */
    var T28 = {
      /* ★★ 実在の いちばん せまい 帯は **306.89px**（★568×320・568×272）【★T235 実測】。
         ★ ★★見本は その 下 ―― ★306px から 1000px まで 通します。
         ★ ★（★★11画面＋底 の 帯の 外はば：306.89／314／362.33／363／378／400.97／443.52／461.44／507.36）*/
      wMin: 306, wMax: 1000,
      realW: [306.89, 314, 362.33, 363, 378, 400.97, 443.52, 461.44, 507.36],
      /* ★★ 点の 天井 ＝ **345点**（★決め打ち。★下で 核から 数え直して 突き合わせます）
         ★ ★1〜6の目 5+10+15+20+25+30 ＝ 105 ／ ボーナス 35 ／ チョイス 30 ／ フォーダイス 30
         ★ ／ フルハウス 25 ／ S.ストレート 30 ／ B.ストレート 40 ／ ヨット 50 ―― ★★合わせて 345 */
      maxTotal: 345,
      turnText: '12回目 / 12回',
      /* ⚠️★★★ T238 ―― ★★5個 → **6個**（★★★`#meTurnL`＝ 左の 回数が 入りました）
         ★ ★★見本は 決め打ちの まま です（★会社の 決まり）。★★★数を 1つ 上げた だけ。
         ★ ★★これを 5の まま に すると ―― ★★器を 足した その日から ㉘ が 鳴りっぱなしに なり、
           ★ ★★★本当の 切れが その 音に まぎれます。 */
      kids: 6,
      minWidths: 100
    };

    /* ★ ★★核から 点の 天井を 数え直す（★★12の 役は それぞれ 別の 手番 ＝ 同時に 天井を 取れます）
       ★ ★★7,776通り × 12の 役 を 数えます ―― ★★1回 数えたら 覚えて おきます
         ★ ★（★★★わざと 壊す ところで ㉘ を 7回 呼ぶ ので、★7回 数えると 遊びが 止まります）。 */
    var mt28 = null;
    function maxTotal28() {
      if (mt28 !== null) return mt28;
      var mx = [], k;
      for (k = 0; k < C.NCAT; k++) mx.push(0);
      for (var a = 1; a <= 6; a++) for (var b = 1; b <= 6; b++) for (var c2 = 1; c2 <= 6; c2++)
        for (var d2 = 1; d2 <= 6; d2++) for (var e2 = 1; e2 <= 6; e2++) {
          var r = [a, b, c2, d2, e2];
          for (k = 0; k < C.NCAT; k++) { var s = C.scoreOf(C.CATS[k], r); if (s > mx[k]) mx[k] = s; }
        }
      var all = 0, up = 0;
      for (k = 0; k < C.NCAT; k++) { all += mx[k]; if (k < 6) up += mx[k]; }
      mt28 = all + (up >= C.CFG.bonusNeed ? C.CFG.bonusPt : 0);
      return mt28;
    }

    /* ★ ★★あふれを 2通りで 測って、★大きい ほうを 取ります
       ★ ★①`scrollWidth - clientWidth`（★★★器の 外に 出る 字 ―― ★「点」の ような ::after も 数えます）
       ★ ★②さいごの 字（Range）の 右はし − 中身の 右はし（★★小数まで 見えます）*/
    function overflow28(el) {
      var cs = getComputedStyle(el), q = el.getBoundingClientRect();
      var inR = q.right - parseFloat(cs.paddingRight || 0) - parseFloat(cs.borderRightWidth || 0);
      var last = el.children[el.children.length - 1];
      var c1 = el.scrollWidth - el.clientWidth, c2 = -99;
      if (last) {
        var rg = document.createRange(); rg.selectNodeContents(last);
        c2 = rg.getBoundingClientRect().right - inR;
        try { rg.detach(); } catch (e) {}
      }
      return Math.max(c1, c2);
    }

    function check28() {
      var t = { why: [], widths: 0, cut: 0, worstW: 0, worstOv: 0, needW: 0,
                kids: 0, maxTotal: 0, turn: '', naka: '' };
      var st = null, keep = null, me = null, bo = null, tu = null, tuL = null;
      try {
        var band = document.getElementById('meBand');
        if (!band) { t.why.push('★★上の 帯が 見つかりません でした（★★★下の 線）'); return t; }
        me = $('mePt'); bo = $('botPt'); tu = $('meTurn');
        tuL = $('meTurnL');           /* ★ T238 ―― ★左の 回数（★広い 画面だけ 見えます）*/
        if (!me || !bo || !tu || !tuL) { t.why.push('★★帯の 中の 器が そろって いません（★あなたの点／ロボットの点／◯回目 ／ ★★左の ◯回目）（★★★下の 線）'); return t; }
        t.kids = band.children.length;
        if (t.kids !== T28.kids)
          t.why.push('★★帯の 中身が ' + t.kids + '個 です（★見本 ' + T28.kids +
            '個）―― ★★★見本が 古く なって います（★★下の 線）');

        /* ★★★ 見本が いまも 本当か（★①点の 天井 ②「◯回目 / ◯回」の 書きかた）★★★ */
        t.maxTotal = maxTotal28();
        if (t.maxTotal !== T28.maxTotal)
          t.why.push('★★★点の 天井が ' + t.maxTotal + '点 に なりました（★見本 ' + T28.maxTotal +
            '点）―― ★★見本が 古く なって います（★★★下の 線）');
        t.turn = C.TURNS + '回目 / ' + C.TURNS + '回';
        if (t.turn !== T28.turnText)
          t.why.push('★★★「◯回目 / ◯回」の 書きかたが 変わりました（★いま「' + t.turn +
            '」／★見本「' + T28.turnText + '」）―― ★★見本が 古く なって います（★★★下の 線）');

        var big = String(Math.max(t.maxTotal, T28.maxTotal));
        var turn = t.turn.length > T28.turnText.length ? t.turn : T28.turnText;
        keep = { me: me.textContent, bo: bo.textContent, tu: tu.textContent, tuL: tuL.textContent };
        /* ⚠️★★★ T238 ―― ★★左の 回数（`#meTurnL`）にも **同じ 字**を 入れる ★★★
           ★ ★★🎨アトが T237 で 踏んだ わな そのもの です：★器だけ 入れて 測ると、
             ★ ★★左は「1回目 / 12回」の まま ＝ **1字 短い**。
             ★ ★★★広い はば（★線 428px の 上）では 左も 場所を 取る ので、
               ★ ★★入る はばを **小さく 見つもり**、★★★あふれを 見のがします。 */
        function dress() { me.textContent = big; bo.textContent = big; tu.textContent = turn; tuL.textContent = turn; }

        /* ★★ 下の 線 ―― ★★★差しかえが 本当に 入ったか（★入って いないのに 測ると 全部 ○）*/
        dress();
        if (me.textContent !== big || bo.textContent !== big || tu.textContent !== turn || tuL.textContent !== turn) {
          t.why.push('★★いちばん 大きい 中身（' + big + '点 × 2 ＋「' + turn +
            '」）を 入れられません でした（★★★下の 線）'); return t;
        }
        t.naka = band.textContent.trim().replace(/\s+/g, ' ');

        st = document.createElement('style');
        st.setAttribute('data-t28', '1');
        document.head.appendChild(st);
        function setW(w) {
          st.textContent =
            '#meBand{ width:' + w + 'px !important; max-width:' + w + 'px !important;' +
            '         min-width:' + w + 'px !important; flex:0 0 auto !important;' +
            '         align-self:flex-start !important; }';
          return band.getBoundingClientRect().width;
        }

        /* ★ 測る はば（★せまい ところは こまかく・★広い ところは あらく）★＋ 実在の 9通り */
        var list = [], w;
        for (w = T28.wMin; w <= 520; w += 2) list.push(w);
        for (w = 540; w <= T28.wMax; w += 20) list.push(w);
        for (var q2 = 0; q2 < T28.realW.length; q2++) list.push(T28.realW[q2]);
        list.sort(function (x, y) { return x - y; });

        for (var wi = 0; wi < list.length; wi++) {
          w = list[wi];
          dress();                       /* ★ 毎回 入れ直す（★何かが 描き直しても 消えない ように）*/
          var got = setW(w);
          /* ⚠️★★★ 下の 線 ―― ★「はばを 変えた つもりが、変わって いなかった」
             ★ ★★★㉗ で 私が 実際に 落ちた 形 です（★★同じ 姿を 144回 測って「ぜんぶ OK」）。 */
          if (Math.abs(got - w) > 1) {
            t.why.push('★★帯の はばを ' + w + 'px に できません でした（★実際 ' +
              Math.round(got * 10) / 10 + 'px）―― ★★★測れて いません（★★★下の 線）');
            return t;
          }
          t.widths++;
          var ov = overflow28(band);
          if (ov !== ov) { t.why.push('★★測った 値が 数に なりません でした（★★★下の 線）'); return t; }
          if (ov > 0.5) {
            t.cut++;
            if (ov > t.worstOv) { t.worstOv = Math.round(ov * 100) / 100; t.worstW = w; }
          } else if (!t.needW) { t.needW = w; }
        }

        if (t.widths < T28.minWidths)
          t.why.push('★★測った はばが ' + t.widths + '通りしか ありません（★見本 ' +
            T28.minWidths + '通り いじょう）（★★★下の 線）');

        if (t.cut > 0)
          t.why.push('★★★上の 帯から 中身が あふれます（★' + t.cut + ' / ' + t.widths +
            '通りの はば ／ ★いちばん ひどいのは はば ' + t.worstW + 'px で ' + t.worstOv +
            'px はみ出し ／ ★★入る ように なるのは はば ' + (t.needW || '―') +
            'px から ―― ★★★実在の いちばん せまい 帯は 306.89px です）');

      } catch (e5) {
        t.why.push('★★測れません でした：' + String(e5 && e5.message || e5) + '（★★★下の 線）');
      } finally {
        if (st && st.parentNode) st.parentNode.removeChild(st);
        try {
          if (keep && me && bo && tu) {
            me.textContent = keep.me; bo.textContent = keep.bo; tu.textContent = keep.tu;
            if (tuL) tuL.textContent = keep.tuL;
          }
          P.layout(); P.render();
        } catch (e6) {}
      }
      return t;
    }

    var t28 = check28();
    for (i = 0; i < t28.why.length; i++)
      ng.push('★★★★ 上の 帯が どの はばでも 中身を 入れきる：' + t28.why[i] + '（★T235・💻コーダ）');
    note['㉘ ★★★上の 帯が、どの はばでも 中身を 入れきる'] =
      t28.widths + '通りの はば（' + T28.wMin + '〜' + T28.wMax + 'px）を 通して、★あふれ ' + t28.cut + '通り' +
      '／★いちばん ひどい はみ出し ' + t28.worstOv + 'px（はば ' + t28.worstW + 'px）' +
      '／★入る ように なる はば ' + (t28.needW || '―') + 'px（★実在の いちばん せまい 帯 306.89px）' +
      '／★中身「' + t28.naka + '」（★点の 天井 ' + t28.maxTotal + '点・★見本 ' + T28.maxTotal + '点）';


    /* ============================================================
       ★★★ ㉙-2 ―― ★★帯の 字が、★★★読める 大きさの まま 入って いるか（★T236-2・🎨アト）★★★
       ------------------------------------------------------------
       ★ ★★これは 🎨アトが 書いて、★私（💻コーダ）が 貼りました
         ★ ★（★`logs/T237_見張り29-2_ヨット_アト.js`。★★形は そのまま、★つなぎ方だけ 直して います ――
         ★ ★★点の 天井は ㉘ の `maxTotal28()` を 借ります。★★★7,776通りを 2回 数えると 遊びが 止まる ため）。

       ★★★ ㉘ と 何が ちがうか（★★これが この 目の 存在理由）
         ★ ★★㉘ は「★切れて いないか」だけ を 見ます ―― ★★★字を 3px に すれば ㉘ は **黙り ます**。
         ★ ★★㉙ は「★切れて いない ＋ ★★読める 大きさ」を **対で** 見ます。
         ★ ★★★アトが 実際に 当てて 数えて います【★T237-M】：★★床だけ 外すと ――
           ★ ★あふれ **0**（★㉘ 黙る）／★「点」**9.667px**（★★★㉙ だけが 鳴る）。

       ⚠️★★★ アトの しくじり が そのまま この 目に 入って います（★★8つ目の 形の 9番目）
          ★ ★★T236 の ㉙ は `.me-name` `.me-pt` `.me-turn` の **3つしか** 聞いて いません でした。
          ★ ★★★「点」は `.me-pt::after` ―― ★★`getComputedStyle(el)` には **出ません**
            ★ ★（★`(el, '::after')` と 書かないと 1文字も 返って きません）。
          ★ ★★＝ ★★★「ぜんぶの 字を 数えて いる つもり」で、★1つ 数える先に 入って いなかった。
          ★ ★→ ★★この ㉙-2 は `::after` を **2つ とも** 数えます（★あなたの 点・★ロボットの 点）。

       ★★ 3本の 線
         ★ ★①★**上の 線** … ★306〜1000px の どの はばでも ①切れず ②床 8px を 割らない
           ★ ★★＋ ★社長の 絵（左の 回数）が 線 428px の とおりに 出る
         ★ ★②★**下の 線** … ★帯／器が 無い・★中身が 5個でも 6個でも ない・
           ★ ★★★**帯が まだ 画面に 出て いない**（★はば 0px ＝ 遊びを 始めずに 測った）・
           ★ ★はばを 決めた つもりが 決まって いない・★字が 数に ならない・★100通り 未満
         ★ ★③★**見本（決め打ち）** … ★床 8px（★社長の お決め・2026-09-06 その2）／★線 428px
           ★ ★★／★点の 天井 345点（★核から 数え直して 突き合わせ）
       ============================================================ */
    var T29 = {
      /* ⚠️★★★ もとは `10.5`（★社長の お決め・2026-09-06 その1）でした【★T241・💻コーダ】。
         ★ ★★社長は そのあと「★★字を 下げてよい」と お決めに なり（★2026-09-06 その2）、
           ★ ★★🎨アトが せまい 10画面の 字を **8.00px** まで 下げて 赤線を 1本に しました。
         ★ ★★★数は 上の `OBI_YUKA` 1か所 だけに 置いて います（★★㉒・㉛-2 と 同じ 数）。 */
      yuka: OBI_YUKA,    /* ★ 字の 床（★★社長の お決め・2026-09-06 その2 ―― ★8px）*/
      lo: 306, hi: 1000, kizami: 5,
      sen: 428,          /* ★ 社長の 絵に 切りかわる 線（★帯の 中身の はこ）*/
      yohaku: 24,        /* ★ 帯の よこの よはく（12 ＋ 12）*/
      minWidths: 100
    };

    function check29() {
      var t = { why: [], kazu: 0, kire: 0, hosoi: 0, semaiKire: null, semaiHosoi: null,
                dareGa: '', chiisai: 999, chiisaiW: 0, wake: 0, kids: 0 };
      var st29 = null, oku = null, me = null, bo = null, tu = null, tuL = null;
      try {
        var band = document.getElementById('meBand');
        if (!band) { t.why.push('★★上の 帯（#meBand）が ありません（★★★下の 線）'); return t; }
        var kids = band.querySelectorAll('.me-name, .me-pt, .me-turn');
        t.kids = kids.length;
        /* ★★ 5個（★器の 無い 日）か 6個（★器が 入った あと）の どちらか */
        if (kids.length !== 5 && kids.length !== 6) {
          t.why.push('★★帯の 中身が 5個 でも 6個 でも ありません（' + kids.length + '個）（★★★下の 線）'); return t;
        }

        /* ⚠️★★★ 下の 線 ―― ★★「帯が まだ 画面に 出て いない」を、★はっきり 分けて 言う ★★★
           ★ ★★ヨットは はじめの 画面では 盤が 出て いません ―― ★★帯の はばは **0px**。
             ★ ★★★そこで 何を 測っても「切れて いない」に なります。
           ★ ★★🎨アトは T236 で 実際に ここで 落ち、★この 目に 止めて もらいました
             ★ ★（★会社の 決まり「★★遊びを 始めて から 測る」）。 */
        if (!(band.getBoundingClientRect().width > 1)) {
          t.why.push('★★上の 帯が 画面に 出て いません（はば 0px）―― ★★★遊びを 始めて から 測って ください（★★下の 線）');
          return t;
        }

        me = $('mePt'); bo = $('botPt'); tu = $('meTurn'); tuL = $('meTurnL');
        if (!me || !bo || !tu) { t.why.push('★★帯の 器（mePt／botPt／meTurn）が ありません（★★★下の 線）'); return t; }

        /* ★★ いちばん 重い 中身を **自分で 作って から** 測る（★T235 §3-1 ―― ★8つ目の 形）*/
        var tenjo = maxTotal28();
        if (tenjo !== T28.maxTotal)
          t.why.push('★★★点の 天井が 見本と ちがいます（★核 ' + tenjo + '点 ／ ★見本 ' + T28.maxTotal +
            '点）―― ★★見本が 古く なって います（★★★下の 線）');
        var omoi = C.TURNS + '回目 / ' + C.TURNS + '回';
        oku = { me: me.textContent, bo: bo.textContent, tu: tu.textContent, tuL: tuL ? tuL.textContent : null };
        me.textContent = String(tenjo); bo.textContent = String(tenjo); tu.textContent = omoi;
        /* ⚠️★★★ 左の 回数も **右と 同じ 字**に する（★アトが T237 で 踏んだ わな）★★★ */
        if (tuL) tuL.textContent = omoi;
        if (me.textContent !== String(tenjo) || tu.textContent !== omoi) {
          t.why.push('★★いちばん 重い 中身を 入れられません でした（★★★下の 線）'); return t;
        }

        /* ★★ 字を 読む ―― ★★★`::after`（「点」）を 忘れない こと */
        function jiTachi() {
          var out = [], q;
          for (q = 0; q < kids.length; q++)
            out.push({ nm: kids[q].className, fs: parseFloat(getComputedStyle(kids[q]).fontSize) });
          /* ★★★ ここが T236 の ㉙ に 無かった 2行 です */
          out.push({ nm: 'me-pt::after（「点」）', fs: parseFloat(getComputedStyle(me, '::after').fontSize) });
          out.push({ nm: 'me-pt.bot::after（「点」）', fs: parseFloat(getComputedStyle(bo, '::after').fontSize) });
          return out;
        }

        st29 = document.createElement('style');
        st29.setAttribute('data-t29', '1');
        document.head.appendChild(st29);

        for (var W = T29.lo; W <= T29.hi; W += T29.kizami) {
          st29.textContent = 'html body #meBand{ width:' + W + 'px !important; max-width:none !important;' +
                             ' min-width:0 !important; flex:0 0 auto !important; align-self:flex-start !important; }';
          void band.offsetWidth;
          var got = band.getBoundingClientRect().width;
          if (Math.abs(got - W) > 1) {
            t.why.push('★★帯の はばを ' + W + 'px に できません でした（★実際 ' +
              Math.round(got * 10) / 10 + 'px）―― ★★★測れて いません（★★★下の 線）'); break;
          }
          t.kazu++;

          var ham = band.scrollWidth - band.clientWidth, j;
          for (j = 0; j < kids.length; j++) ham = Math.max(ham, kids[j].scrollWidth - kids[j].clientWidth);
          if (ham !== ham) { t.why.push('★★測った 値が 数に なりません でした（★★★下の 線）'); break; }
          if (ham > 0.5) { t.kire++; if (t.semaiKire == null) t.semaiKire = W; }

          var ji = jiTachi(), chiisai = 999, who = '', warui = false;
          for (j = 0; j < ji.length; j++) {
            if (!(ji[j].fs > 0)) { t.why.push('★★字の 大きさが 数に なりません（' + ji[j].nm + '）（★★★下の 線）'); warui = true; break; }
            if (ji[j].fs < chiisai) { chiisai = ji[j].fs; who = ji[j].nm; }
          }
          if (warui) break;
          if (chiisai < t.chiisai) { t.chiisai = Math.round(chiisai * 1000) / 1000; t.chiisaiW = W; t.dareGa = who; }
          if (chiisai < T29.yuka - 0.001) {
            t.hosoi++;
            if (t.semaiHosoi == null) { t.semaiHosoi = W; t.dareGa = who; }
          }

          /* ★★★ 社長の 絵（左の 回数）が 線 428px の とおりに 出て いるか（★器が ある ときだけ）*/
          if (tuL) {
            var deteru = tuL.getBoundingClientRect().width > 0.5;
            var hazu = (W - T29.yohaku) >= T29.sen;
            if (deteru !== hazu) t.wake++;
          }
        }

        if (t.kazu < T29.minWidths)
          t.why.push('★★はばを ' + t.kazu + '通りしか 測れて いません（★見本 ' + T29.minWidths +
            '通り いじょう）（★★★下の 線）');
        if (t.kire)
          t.why.push('★★★上の 帯の ことばが 切れます（★' + t.kire + '通りの はば ／ ★いちばん せまいのは ' +
            t.semaiKire + 'px ／ ★中身「あなた ' + tenjo + ' ロボット ' + tenjo + ' ' + omoi + '」）');
        if (t.hosoi)
          t.why.push('★★★上の 帯の 字が 床 ' + T29.yuka + 'px を 割ります（★' + t.hosoi +
            '通りの はば ／ ★はじめて 割るのは はば ' + t.semaiHosoi + 'px の ' + t.dareGa +
            '（' + t.chiisai + 'px））');
        if (t.wake)
          t.why.push('★★★社長の 絵（★左の 回数）が 線 ' + T29.sen + 'px の とおりに 出て いません（★' +
            t.wake + '通りの はば）');

      } catch (e29) {
        t.why.push('★★測れません でした：' + String(e29 && e29.message || e29) + '（★★★下の 線）');
      } finally {
        if (st29 && st29.parentNode) st29.parentNode.removeChild(st29);
        try {
          if (oku && me && bo && tu) {
            me.textContent = oku.me; bo.textContent = oku.bo; tu.textContent = oku.tu;
            if (tuL && oku.tuL != null) tuL.textContent = oku.tuL;
          }
          P.layout(); P.render();
        } catch (e30) {}
      }
      return t;
    }

    var t29 = check29();
    for (i = 0; i < t29.why.length; i++)
      ng.push('★★★★ 帯の 字が 読める 大きさで 入って いる：' + t29.why[i] + '（★T236-2・🎨アト）');
    note['㉙ ★★★帯の 字が、読める 大きさの まま 入って いるか'] =
      t29.kazu + '通りの はば（' + T29.lo + '〜' + T29.hi + 'px）を 通して、★切れ ' + t29.kire + '通り' +
      '／★床（' + T29.yuka + 'px）割れ ' + t29.hosoi + '通り' +
      '／★いちばん 小さい 字 ' + (t29.chiisai === 999 ? '―' : t29.chiisai + 'px（' + t29.dareGa +
      '・はば ' + t29.chiisaiW + 'px）') +
      '／★社長の 絵の 食いちがい ' + t29.wake + '通り（★線 ' + T29.sen + 'px）' +
      '／★中身 ' + t29.kids + '個';


    /* ============================================================
       ★★★ ㉚ ―― ★★「◯回目 / ◯回」が **左右 とも** 同じ 字か（★T238・💻コーダ）★★★
       ------------------------------------------------------------
       ★ ★★これは 🎨アトから 名ざしで 頼まれた 目 です（★T236-2 §6 の さいご）：
         ★ ★「★★㉙-2 は 測る 前に 左右を そろえて しまう ので、★★★『左の 回数だけ 古い 字の まま』は
         ★ ★★見えません。★★→ ★💻コーダの 目（★JS が 左右 とも 書きかえて いるか）が 要ります」

       ★★★ なぜ 要るか ―― ★★アトが 実際に 踏んだ から です
         ★ ★★器（`#meTurnL`）だけ 入れて JS を 直さないと、★★★右が「12回目 / 12回」の 横で
           ★ ★左が「1回目 / 12回」の まま 出ます。★★アトの 言葉：「★★★出ないより 悪い です」。
         ★ ★★★しかも ―― ★㉘ も ㉙ も **鳴りません**。★どちらも 測る 前に 自分で 左右を そろえる ので、
           ★ ★★「JS が そろえて いるか」は ★★★どちらの 目にも 入って いません。
         ★ ★★＝ ★「見張って いる ふり」の 8つ目の 形（★数える先に 入って いない）が、
           ★ ★★★器を 足した その日に もう 1つ できる ところ でした。

       ★★ この 目の やり方（★★★見るだけ では 足りない ので、**わざと ずらして 戻るか** を 見ます）
         ★ ★①★いま 左右が 同じ 字か
         ★ ★②★★左を わざと ちがう 字に して `render()` を 呼び、★★★右と 同じ 字に 戻るか
         ★ ★③★★手番を 1・6・12回目 に 動かして、★★★3回とも 左右が そろい、
           ★ ★★かつ「◯回目 / ◯回」の 形に なって いるか
       ★★ 下の 線 … ★帯／器が 無い・★`render` が 無い・★★★わざと ずらした のに ずれなかった
         ★ ★（★★＝ 私の 壊し方が 効いて いない ＝ この 目は 何も 見て いない）
       ★★ さわった ものは 1つ 残らず 戻します（★型の ⑤）。
       ============================================================ */
    var T30 = { turns: [0, 5, 11], uso: '★ずれた 字★' };

    function check30() {
      var t = { why: [], n: 0, ok: 0, mita: [] };
      var keepT = null, keepC = null, tuL = $('meTurnL'), tu = $('meTurn');
      try {
        if (!$('meBand')) { t.why.push('★★上の 帯（#meBand）が ありません（★★★下の 線）'); return t; }
        if (!tu) { t.why.push('★★右の 回数（#meTurn）が ありません（★★★下の 線）'); return t; }
        if (!tuL) {
          t.why.push('★★★左の 回数（#meTurnL）が ありません ―― ★★器が 抜けて います（★★★下の 線）');
          return t;
        }
        if (!P.render || !P.setTurn || !P.state) {
          t.why.push('★★中を のぞく 口（render／setTurn／state）が ありません（★★★下の 線）'); return t;
        }

        var st0 = P.state();
        keepT = st0.turn; keepC = st0.cur;

        /* ★★ ② わざと ずらして、`render()` が 戻すか ―― ★★★これが この 目の 芯 */
        tuL.textContent = T30.uso;
        if (tuL.textContent !== T30.uso) {
          t.why.push('★★左の 回数を わざと ずらせません でした（★★★下の 線 ―― ★私の 壊し方が 効いて いません）');
          return t;
        }
        P.render();
        if (tuL.textContent !== tu.textContent) {
          t.why.push('★★★`render()` が 左の 回数を 書きかえて いません（★左「' + tuL.textContent +
            '」／★右「' + tu.textContent + '」）―― ★★器だけ あって 字が 入って いません');
        }

        /* ★★ ③ 手番を 動かして、★3回とも 左右が そろうか ＋ 形が 合って いるか */
        for (var k = 0; k < T30.turns.length; k++) {
          var tn = T30.turns[k];
          P.setTurn(tn, 0);
          t.n++;
          var hazu = Math.min(C.TURNS, tn + 1) + '回目 / ' + C.TURNS + '回';
          var l = tuL.textContent, r = tu.textContent;
          t.mita.push((tn + 1) + '回目→左「' + l + '」右「' + r + '」');
          if (l !== r)
            t.why.push('★★★' + (tn + 1) + '回目 で 左右が ちがいます（★左「' + l + '」／★右「' + r + '」）');
          else if (r !== hazu)
            t.why.push('★★' + (tn + 1) + '回目 の 字が 見本と ちがいます（★いま「' + r +
              '」／★見本「' + hazu + '」）（★★★下の 線 ―― ★見本が 古く なって います）');
          else t.ok++;
        }

      } catch (e31) {
        t.why.push('★★測れません でした：' + String(e31 && e31.message || e31) + '（★★★下の 線）');
      } finally {
        try {
          if (keepT != null && keepT >= 0) P.setTurn(keepT, keepC);
          P.layout(); P.render();
        } catch (e32) {}
      }
      return t;
    }

    var t30 = check30();
    for (i = 0; i < t30.why.length; i++)
      ng.push('★★★★ 「◯回目 / ◯回」が 左右 とも 同じ 字：' + t30.why[i] + '（★T238・💻コーダ）');
    note['㉚ ★★★「◯回目 / ◯回」が 左右 とも 同じ 字か'] =
      t30.ok + ' / ' + t30.n + ' 回の 手番で そろって いました　★' + t30.mita.join('　★');

/* ============================================================================
   ★★★★ 見張り ㉛-2 ―― ★★帯の 分かれ目と、★表の 分かれ目が **どの はばでも 同じ x**
   ★★★★            （★T240-2・🎨アト・2026-09-06 ／ ★★社長の 赤線 その2）
   ----------------------------------------------------------------------------
   ★ ★★🎨アトの 貼り紙を、★★💻コーダが 貼りました（★T241・2026-09-06）。
     ★ ★★貼った ところ … ★本体は ㉚ の すぐ 下／★わざと壊す (70)〜(80) は (69) の すぐ 下。
     ★ ★★★`$` `C` `P` `ng` `note` `one` `killN` `killOk` は ㉙／㉚ が すでに 使う もの です。

   ⚠️★★★ ★あとから 読む 人へ ―― ★★「㉛ の 置きかえ」と 書いて ありますが、
      ★ ★★★この verify.js に **㉛ が 入って いた ことは ありません**。
      ★ ★★T240 の ㉛ は 私（コーダ）が 受け取った だけ で、★貼る 前に アトが 穴を 見つけ、
        ★ ★★★㉛-2 に 書き直して くれました。★★だから ここに あるのは **はじめから ㉛-2** です。
      ★ ★★★番号が 1つ 飛んで 見えるのは その ため です（★消した のでは ありません）。

   ★★★ 字の 床（`yuka`）は ★★★上の `OBI_YUKA` **1か所** に まとめました（★T241）。
      ★ ★★㉒・㉙-2・㉛-2 は どれも「★上の 帯の 字の 床」を 見て います ―― ★★同じ 数 です。
      ★ ★★★分けて 置いた 日、★片方だけ 古く なりました（★㉒ が 11・㉙-2 が 10.5）。
      ★ ★★`T29.sen = 428` は ★★★そのまま（★アトは 428px を 1文字も 触って いません）。

   ============================================================================
   ★★★ ㉛ から 何が 変わったか（★2つ だけ）
   ----------------------------------------------------------------------------
   ★ ★①★★★**せまい 画面も NG に する**（★★㉛ では 数を 出すだけ でした）
     ★ ★★㉛ の 中に、★私は こう 書いて いました：
       ★ ★★「★1本の ならびの とき ―― ★★NG には しません（★数だけ 出します）」
     ★ ★★★そこが 穴 でした。★★実測【T240-2 B】：★せまい 10画面では
       ★ ★★線は 表の 分かれ目から **45.7〜101.7px** ずれ、★点の けたで **26〜30px 動いて** いました。
       ★ ★★★㉛ は それを **1件も NG に して いません**（★★見て いたのに、鳴らさない 作りでした）。
     ★ ★→ ★★いまは **306〜1000px の ぜんぶ**で 同じ ものさしを 当てます。

   ★ ★②★★★**字の 床と、回数の 器**を 見る（★★★T240-2 で 私が 足した ところ）
     ★ ★★・★字の 床 ＝ **8px**（★★社長の お決め）。★★「点」（`::after`）を 2つ とも 数えます。
     ★ ★★・★★回数の 器：★せまい 画面では 左に「回数 ＋ すきま」ぶんの 場所を あけて います。
       ★ ★★★あけた 場所 ＝ 回数の 器 ＋ すきま で ない と、★線が ずれます。
       ★ ★★★→ ★★そこを **直に** 見ます（★★★書体が 太くて 器から あふれた 日に 鳴ります ――
         ★ ★★MS Gothic は「12回目 / 12回」が 1px あたり **7.3333**（★8px では 7.75）で、
         ★ ★★★私が 取った **7.15** を こえます。★★スタックには 入って いませんが、鳴らせます）。

   ============================================================================
   ★★★ 3本の 線
   ----------------------------------------------------------------------------
   ★ ★①★**上の 線** … ★306〜1000px の どの はばでも
     ★ ★★・★表の 分かれ目が 帯の まん中に ある（★ゆるし 0.05px）
     ★ ★★・★★★帯の 線が 表の 分かれ目に ある（★★★せまい 画面も 広い 画面も）
     ★ ★★・★点の けた（0／5／345）が 変わっても 線が 動かない
     ★ ★★・★★字が 床 8px を 割らない（★「点」も 数える）
     ★ ★★・★★あけた 場所 ＝ 回数の 器 ＋ すきま（★1本の ならびの とき）
   ★ ★②★**下の 線** … ★器が 無い・★★盤が まだ 出て いない（はば 0px）・
     ★ ★★はばを 決めた つもりが 決まって いない・★表の 1行目が 2マス ない・
     ★ ★★数に ならない・★100通り 未満
   ★ ★③★**見本（決め打ち）** … ★ゆるし **0.05px**／★床 **8px**／★はば 306〜1000px
     ★ ★★★線の 428px も、1fr 1fr も **書いて いません** ―― ★★どちらも 画面から 測ります。
   ============================================================================ */

    var T31 = {
      /* ⚠️★★★ `kizami` は ㉙ の **5** では なく **7** です（★★理由は 下の `ketas` と 同じ ―― ★時間）。
         ★ ★★306〜1000px を 7px おきで **100通り**。★★★見本の 100通りを 満たします。 */
      lo: 306, hi: 1000, kizami: 7,
      yurushi: 0.05,      /* ★ ゆるし（px）―― ★★1画素の 20分の1 */
      /* ⚠️★★★ ここは アトの 貼り紙では `8` の 決め打ちでした【★T241・💻コーダが 1か所に まとめました】
         ★ ★★㉒・㉙-2 と **同じ 床**（★上の 帯の 字）を 見て いる ので、★数は 1つに します。
         ★ ★★★2つに 分けて 置いた 日、★片方だけ 古く なりました（★★㉒ が 11・㉙-2 が 10.5）。 */
      yuka: OBI_YUKA,     /* ★★ 字の 床（★★★社長の お決め・2026-09-06 その2 ―― ★8px）*/
      minWidths: 100,
      /* ⚠️★★★ 点の けた ―― ★★T240 の ㉛ は **3通り**（0／5／345）でした。★★★2通りに 減らして います。
         ★ ★★わけ：★★★verify() 1回に かかる 時間 です【★実測・T240-2 K・★320×568】：
           ★ ★★・いまの まま（★㉛-2 なし）………………………… **12.2〜13.0秒**（★わざと壊す 73通り）
           ★ ★★・㉛-2 を 足して ★5px おき × 3通り ………… ★★**21.4秒**（★同 84通り）
           ★ ★★・㉛-2 を 足して ★5px おき × 2通り ………… ★**20.2秒**（★同 84通り）
           ★ ★★・㉛-2 を 足して ★★7px おき × 2通り ……… ★★★**18.2秒**（★同 84通り）★← ★これ
         ★ ★★T215 の **共有の** 道具は「★30秒 返事が 来なければ 音を 立てる」作り です
           ★ ★（★私の ものでは ないので 触りません）。★★★のこりを **11.8秒** 残しました。
         ★ ★★2通りでも 見る ものは 変わりません：★★★端と 端 を 入れかえて（0,345）と（345,0）を 作るので、
           ★ ★★左右の 差は **いちばん 大きい ところ**で 出ます。 */
      ketas: [0, 345]
    };

    function check31() {
      var t = { why: [], kazu: 0, zureNG: 0, midNG: 0, ugoki: 0, yukaNG: 0, utsuwaNG: 0,
                saidaiZure: 0, saidaiZureW: 0, saidaiMid: 0, saidaiUgoki: 0,
                chiisai: 999, chiisaiW: 0, dareGa: '',
                saidaiUtsuwa: 0, saidaiUtsuwaW: 0,
                eNum: 0, ichiNum: 0, ichiZure: 0 };
      var st31 = null, oku = null;
      var pane = null, band = null, sheet = null, me = null, bo = null, tu = null, tuL = null;
      try {
        pane  = document.getElementById('paneA');
        band  = document.getElementById('meBand');
        sheet = document.getElementById('sheet');
        if (!pane || !band || !sheet) {
          t.why.push('★★盤の 器（paneA／meBand／sheet）が ありません（★★★下の 線）'); return t;
        }
        /* ⚠️★★ ★★遊びを 始めて から 測る（★★★T236 で 🎨アトが 落ちた ところ）*/
        if (!(band.getBoundingClientRect().width > 1)) {
          t.why.push('★★上の 帯が 画面に 出て いません（はば 0px）―― ★★★遊びを 始めて から 測って ください（★★下の 線）');
          return t;
        }
        var bot = band.querySelector('.me-name.bot');
        me = $('mePt'); bo = $('botPt'); tu = $('meTurn'); tuL = $('meTurnL');
        if (!bot || !me || !bo || !tu) {
          t.why.push('★★帯の 器（.me-name.bot／mePt／botPt／meTurn）が ありません（★★★下の 線）'); return t;
        }

        /* ★★ 表の 1行目が 2マス あるか（★★★これが 無いと「分かれ目」が ありません）*/
        function hyoNoSakai() {
          var all = sheet.children, arr = [], k;
          for (k = 0; k < all.length; k++) {
            var q = all[k].getBoundingClientRect();
            if (q.width > 0.5 && all[k].className.indexOf('is-bonus') < 0) arr.push(all[k]);
          }
          if (arr.length < 2) return null;
          var y0 = arr[0].getBoundingClientRect().top, row = [];
          for (k = 0; k < arr.length; k++) {
            var r = arr[k].getBoundingClientRect();
            if (Math.abs(r.top - y0) < 1) row.push(r);
          }
          if (row.length < 2) return null;
          return (row[0].right + row[1].left) / 2;   /* ★ すきまの まん中 */
        }
        if (hyoNoSakai() == null) {
          t.why.push('★★表の 1行目に マスが 2つ ありません ―― ★★★測れて いません（★★下の 線）'); return t;
        }

        /* ★★ 帯の 線の まん中（★★★1.5px の ものを「はし」で 測らない ―― ★トライ T239 §2-2）*/
        function obiNoSen() {
          var pcs = getComputedStyle(bot, '::before');
          var w = parseFloat(pcs.width), l = parseFloat(pcs.left);
          if (!(w > 0) || l !== l) return null;
          return bot.getBoundingClientRect().left + l + w / 2;
        }
        function obiNoMannaka() {
          var q = band.getBoundingClientRect(), cs = getComputedStyle(band);
          var pl = parseFloat(cs.paddingLeft), pr = parseFloat(cs.paddingRight);
          return q.left + pl + (q.width - pl - pr) / 2;
        }
        /* ★★★ 字を ぜんぶ 読む ―― ★★「点」（`::after`）を 2つ とも 忘れない
           ★ ★（★★T236 で 私が 落とした ところ。★`getComputedStyle(el)` には 出ません）*/
        function jiTachi() {
          var out = [], q, k = band.querySelectorAll('.me-name, .me-pt, .me-turn');
          for (q = 0; q < k.length; q++) {
            if (k[q].getBoundingClientRect().width < 0.5) continue;   /* ★ 出て いない 器は 数えない */
            out.push({ nm: k[q].className, fs: parseFloat(getComputedStyle(k[q]).fontSize) });
          }
          out.push({ nm: 'me-pt::after（「点」）', fs: parseFloat(getComputedStyle(me, '::after').fontSize) });
          out.push({ nm: 'me-pt.bot::after（「点」）', fs: parseFloat(getComputedStyle(bo, '::after').fontSize) });
          return out;
        }

        oku = { me: me.textContent, bo: bo.textContent, tu: tu.textContent, tuL: tuL ? tuL.textContent : null };
        var omoi = C.TURNS + '回目 / ' + C.TURNS + '回';

        st31 = document.createElement('style');
        st31.setAttribute('data-t31', '1');
        document.head.appendChild(st31);

        for (var W = T31.lo; W <= T31.hi; W += T31.kizami) {
          /* ⚠️★★ ★★★帯だけでは なく **盤ごと**（`#paneA`）はばを 決めます ★★★
             ★ ★★㉙ のように 帯だけを 決めると、★★★帯と 表の はばが 別々に なり、
               ★ ★★「そろって いるか」を 測る 意味が 無くなります。 */
          st31.textContent = 'html body #paneA{ width:' + W + 'px !important; max-width:none !important;' +
                             ' min-width:0 !important; flex:0 0 auto !important; align-self:flex-start !important; }';
          void pane.offsetWidth;
          var got = pane.getBoundingClientRect().width;
          if (Math.abs(got - W) > 1) {
            t.why.push('★★盤の はばを ' + W + 'px に できません でした（★実際 ' +
              Math.round(got * 10) / 10 + 'px）―― ★★★測れて いません（★★★下の 線）'); break;
          }
          t.kazu++;

          /* ★★ ① 表の 分かれ目 ＝ 帯の まん中 か（★★どの はばでも）*/
          me.textContent = '345'; bo.textContent = '345';
          tu.textContent = omoi; if (tuL) tuL.textContent = omoi;
          void band.offsetWidth;
          var hx = hyoNoSakai(), mid = obiNoMannaka();
          if (hx == null || hx !== hx || mid !== mid) {
            t.why.push('★★測った 値が 数に なりません でした（★★★下の 線）'); break;
          }
          var dMid = Math.abs(hx - mid);
          if (dMid > t.saidaiMid) { t.saidaiMid = Math.round(dMid * 1000) / 1000; }
          if (dMid > T31.yurushi) { t.midNG++; }

          /* ★★ ②-1 字の 床（★★8px・★「点」も 数える）*/
          var ji = jiTachi(), chi = 999, who = '', warui = 0;
          for (var q = 0; q < ji.length; q++) {
            if (!(ji[q].fs > 0)) { t.why.push('★★字の 大きさが 数に なりません（' + ji[q].nm + '）（★★★下の 線）'); warui = 1; break; }
            if (ji[q].fs < chi) { chi = ji[q].fs; who = ji[q].nm; }
          }
          if (warui) break;
          if (chi < t.chiisai) { t.chiisai = Math.round(chi * 1000) / 1000; t.chiisaiW = W; t.dareGa = who; }
          if (chi < T31.yuka - 0.001) t.yukaNG++;

          /* ★★ ②-2 あけた 場所 ＝ 回数の 器 ＋ すきま（★★★1本の ならびの ときだけ）
             ★ ★★せまい 画面では `#meTurnL` が 出ません。★★そのぶん、左の 点の 右に
               ★ ★★「回数の 器 ＋ すきま 1つ」を あけて、★★★左右の 半分を そろえて います。
             ★ ★★★書体が 太くて 回数が 器から あふれると、★ここが 合わなく なります。 */
          var deteru = tuL ? (tuL.getBoundingClientRect().width > 0.5) : false;
          if (!deteru) {
            var gap = parseFloat(getComputedStyle(band).columnGap || getComputedStyle(band).gap) || 0;
            var ake = parseFloat(getComputedStyle(me).marginRight) || 0;
            var utsuwa = tu.getBoundingClientRect().width;
            var dU = Math.abs(ake - (utsuwa + gap));
            if (dU > t.saidaiUtsuwa) { t.saidaiUtsuwa = Math.round(dU * 1000) / 1000; t.saidaiUtsuwaW = W; }
            if (dU > T31.yurushi) t.utsuwaNG++;
          }

          /* ★★ ③ 帯の 線 ＝ 表の 分かれ目 か（★★★点の けたを 3通り 入れかえて）
             ⚠️★ ★★★㉛ では ここを「社長の 絵の ときだけ」に して いました ―― ★★それが 穴 でした。 */
          var xs = [], j, hazure = 0;
          for (j = 0; j < T31.ketas.length; j++) {
            me.textContent = String(T31.ketas[j]);
            bo.textContent = String(T31.ketas[T31.ketas.length - 1 - j]);
            void band.offsetWidth;
            var sx = obiNoSen(), hx2 = hyoNoSakai();
            if (sx == null || hx2 == null || sx !== sx) { hazure = 1; break; }
            xs.push({ sen: sx, hyo: hx2 });
          }
          if (hazure) { t.why.push('★★帯の 線が 見つかりません でした（★★★下の 線）'); break; }

          if (deteru) t.eNum++; else t.ichiNum++;
          var lo = Math.min.apply(null, xs.map(function (o) { return o.sen; }));
          var hi = Math.max.apply(null, xs.map(function (o) { return o.sen; }));
          var ug = hi - lo;
          if (ug > t.saidaiUgoki) t.saidaiUgoki = Math.round(ug * 1000) / 1000;
          if (ug > T31.yurushi) t.ugoki++;
          for (j = 0; j < xs.length; j++) {
            var d = Math.abs(xs[j].sen - xs[j].hyo);
            if (d > t.saidaiZure) { t.saidaiZure = Math.round(d * 1000) / 1000; t.saidaiZureW = W; }
            if (d > T31.yurushi) { t.zureNG++; break; }
          }
        }

        if (t.kazu < T31.minWidths)
          t.why.push('★★はばを ' + t.kazu + '通りしか 測れて いません（★見本 ' + T31.minWidths +
            '通り いじょう）（★★★下の 線）');
        if (t.midNG)
          t.why.push('★★★表の 分かれ目が、★帯の まん中に ありません（★' + t.midNG +
            '通りの はば ／ ★いちばん 大きい ずれ ' + t.saidaiMid + 'px ／ ★ゆるし ' + T31.yurushi +
            'px）―― ★★表の 列（1fr 1fr）か、★表・帯の よはくが 変わって います');
        if (t.zureNG)
          t.why.push('★★★帯の たての 線が、★表の 分かれ目と 同じ x に ありません（★' + t.zureNG +
            '通りの はば ／ ★いちばん 大きい ずれ ' + t.saidaiZure + 'px（はば ' + t.saidaiZureW +
            'px）／ ★ゆるし ' + T31.yurushi + 'px）―― ★★社長の 赤線（2026-09-06）');
        if (t.ugoki)
          t.why.push('★★★帯の たての 線が、★点の けたで 動きます（★' + t.ugoki +
            '通りの はば ／ ★いちばん 大きい 動き ' + t.saidaiUgoki + 'px）―― ★★左右の 半分が 同じ はばで ありません');
        if (t.yukaNG)
          t.why.push('★★★帯の 字が 床 ' + T31.yuka + 'px を 割ります（★' + t.yukaNG +
            '通りの はば ／ ★いちばん 小さいのは はば ' + t.chiisaiW + 'px の ' + t.dareGa +
            '（' + t.chiisai + 'px））―― ★★社長の お決め（2026-09-06 その2）');
        if (t.utsuwaNG)
          t.why.push('★★★左に あけた 場所が、★回数の 器 ＋ すきま と 合いません（★' + t.utsuwaNG +
            '通りの はば ／ ★いちばん 大きい ちがい ' + t.saidaiUtsuwa + 'px（はば ' + t.saidaiUtsuwaW +
            'px））―― ★★回数が 器から あふれて いる か（★★★書体が 太い）、★あけ方が 変わって います');

      } catch (e31) {
        t.why.push('★★測れません でした：' + String(e31 && e31.message || e31) + '（★★★下の 線）');
      } finally {
        if (st31 && st31.parentNode) st31.parentNode.removeChild(st31);
        try {
          if (oku && me && bo && tu) {
            me.textContent = oku.me; bo.textContent = oku.bo; tu.textContent = oku.tu;
            if (tuL && oku.tuL != null) tuL.textContent = oku.tuL;
          }
          P.layout(); P.render();
        } catch (e32) {}
      }
      return t;
    }

    var t31 = check31();
    for (i = 0; i < t31.why.length; i++)
      ng.push('★★★★ 帯の 分かれ目と 表の 分かれ目が 同じ x：' + t31.why[i] + '（★T240-2・🎨アト）');
    note['㉛-2 ★★★帯の 分かれ目と、表の 分かれ目が どの はばでも 同じ x か'] =
      t31.kazu + '通りの はば（' + T31.lo + '〜' + T31.hi + 'px）を 通して、' +
      '★表の 分かれ目 ＝ 帯の まん中：ずれ 最大 ' + t31.saidaiMid + 'px（★NG ' + t31.midNG + '通り）' +
      '／★★線と 表の ずれ 最大 ' + t31.saidaiZure + 'px（★NG ' + t31.zureNG + '通り）' +
      '／★点の けたで 動く量 最大 ' + t31.saidaiUgoki + 'px（★NG ' + t31.ugoki + '通り）' +
      '／★字の 床 ' + T31.yuka + 'px：いちばん 小さい 字 ' +
      (t31.chiisai === 999 ? '―' : t31.chiisai + 'px（' + t31.dareGa + '・はば ' + t31.chiisaiW + 'px）') +
      '（★NG ' + t31.yukaNG + '通り）' +
      '／★あけた 場所 ＝ 回数の 器 ＋ すきま：ちがい 最大 ' + t31.saidaiUtsuwa + 'px（★NG ' + t31.utsuwaNG + '通り）' +
      '／★社長の 絵 ' + t31.eNum + '通り・1本の ならび ' + t31.ichiNum + '通り' +
      '／★ゆるし ' + T31.yurushi + 'px';

    /* ============================================================
       ★★★★ ㉜ ―― ★★サイコロの 上の 帯の 名前 ＝ **いま 手番の 主**（★T243・社長の ご指摘）
       ------------------------------------------------------------
       ★ ★社長の 言葉：「★ヨットの 自分の番の時、★★ロボットじゃなくて『あなた』とかにして」
         ★ ★★写真：★人の 手番 なのに、★サイコロ 5個の 上の 帯に「ロボット」。
       ★ ★★T243 まで：★帯の 名前は 作った ときに 1回 「ロボット」を 入れた きり でした。
         ★ ★★金色（`is-turn`）は 手番で 動くのに、★★★名前は 動かない ―― ★色と 字が 別の ことを 言って いた。
       ★★ 数える もの（★★こま ごとに・★人の 手番も ロボットの 手番も）：
         ★ ①★★席が 0 なら 帯は「あなた」、★席が 1 なら「ロボット」（★★見本は 決め打ち）
         ★ ②★★`is-turn` は 席1 の ときだけ
         ★ ③★★★金色の わくは「ロボット」の ときだけ（★「あなた」に 金色／「ロボット」に 金色なし → 鳴る）
           ★ ★★＝ ★🎨アトの T227「ロボットの 手番は 金色」を、★★名前と 食いちがわせない
         ★ ④★★名前が 消えて いない・切れて いない
         ★ ⑤★★★手番が 変わった **その こま** で 見る（★T228 の「267ms 残った」穴を、名前で 作らせない）
           ★ ★★人→ロボット は `nextSeat` の こま、★ロボット→人 は 書いた あとの こま。★両方 見ます。
       ★★ 下の 線（★測れなかった ときも 鳴る）：
         ★ ・人の こま／ロボットの こま を 3つずつ 見て いない … ★★見張りが 死んで います
         ★ ・切りかえの こまを 2回（両向き）見て いない … ★★同上
         ★ ・「あなた」の わくと「ロボット」の わくが 同じ … ★★色が 番を 言って いません（★⑱ と 別の 目）
       ★ ★★⑱ との ちがい：★⑱ は「ロボットの 番が 絵で 分かるか」（★帯 or 台の どちらか）。
         ★ ★★㉜ は「★★★字と 色が 同じ ことを 言って いるか」を、★人の 手番 まで ふくめて こま ごとに 見ます。
       ★ ★★金色は 決め打ち（`--gold` ＝ #F1A426 ＝ rgb(241, 164, 38)）。★アトが 色を 変えたら ここも 直す
         ★ ★（★下の 線が「ロボットの わくに 金色が ありません」と 教えます）。
       ============================================================ */
    var T32 = { hito: 'あなた', robo: 'ロボット', kin: 'rgb(241, 164, 38)', koma: 3, kirikae: 2 };
    function check32() {
      var t = { why: [], bad: [], koma: 0, hitoKoma: 0, roboKoma: 0, kirikae: 0, kieta: 0, kire: 0,
                ringHito: {}, ringRobo: {}, turns: 0, mita: {} };
      var off = clockOn(), keepLevel = P.level ? P.level() : null;
      /* ★ ふきだしは 見た あとで 元に 戻す ―― ★★この 見張りは 人の 手番で 終わる ので、
         ★ ★★戻さないと「サイコロを ふろう！」が（★消す 時計を 失った まま）出っぱなしに なります【★実測・T243-B】。 */
      var kSay32 = $('say') ? $('say').textContent : '', kHid32 = $('say') ? $('say').classList.contains('hidden') : true;
      try {
        P.setLevel(2);
        withRandom(24243, function () { P.startGame(); });
        pump(60);
        var cell = document.querySelector('#botBand .bot-cell');
        var nm = cell ? cell.querySelector('.bot-name') : null;
        if (!cell || !nm) { t.why.push('★★サイコロの 上の 帯（.bot-cell / .bot-name）が 見つかりません（★★★下の 線）'); off(); return t; }
        /* ★ 1こま 見る ―― ★★中の 席（g.cur）と、★帯の 字・印・色を 突き合わせる */
        function look(tag) {
          var st = P.state();
          if (st.over) return st;
          var want = (st.cur === 1) ? T32.robo : T32.hito;
          var got = nm.textContent || '';
          var isTurn = cell.classList.contains('is-turn');
          /* ★ 動きは 外の still() が 1回 だけ 止めて います（★こま ごとに 止めると 遅い ―― ★下 参照）*/
          var ring = getComputedStyle(cell).boxShadow, q = nm.getBoundingClientRect();
          var cut = nm.scrollWidth > nm.clientWidth + 0.5;
          var gold = ring.indexOf(T32.kin) >= 0;
          t.koma++;
          if (st.cur === 1) t.roboKoma++; else t.hitoKoma++;
          t.mita[got] = (t.mita[got] || 0) + 1;
          if (got !== want) t.bad.push(tag + '：席' + st.cur + '（' + want + 'の 番）なのに 帯が「' + got + '」');
          if (isTurn !== (st.cur === 1)) t.bad.push(tag + '：席' + st.cur + ' なのに is-turn が ' + (isTurn ? 'ついて' : '外れて') + ' います');
          if (gold !== (got === T32.robo)) t.bad.push(tag + '：帯が「' + got + '」なのに 金色の わくが ' + (gold ? 'ついて' : '無く') + ' なって います');
          if (!q || q.width < 1 || q.height < 1) t.kieta++;
          if (cut) t.kire++;
          (got === T32.robo ? t.ringRobo : t.ringHito)[ring] = 1;
          return st;
        }
        /* ⚠️★ ★★still() は **この 1回** だけ ―― ★こま ごとに 止める と 320×480 で 通しが 31.2秒 に なり、
           ★ ★★★30秒の 線を 越えました【★実測・T243-D】。★1回に すると 動きを 止めた まま こまを 見られます。 */
        var guard = 0;
        P.still(function () {
        while (guard++ < 400 && t.turns < T32.koma) {
          var st = look('人の こま');
          if (st.over) break;
          if (st.mine) {
            if (st.rolls === 0) { realTap(P.el.roll()); look('ふった 直後'); continue; }
            var sh = st.sheet, wrote = false, k;
            for (k = 0; k < C.NCAT; k++) {
              if (sh[k] == null) {
                var el = P.el.cell[C.CATS[k].id];
                if (el && !el.disabled) { realTap(el); wrote = true; }
                break;
              }
            }
            if (!wrote) break;
            look('書いた 直後');                       /* ★ 席は まだ 0・busy だけ（260ms）*/
            /* ★★ ロボットの 手番を 1こま ずつ ―― ★★★人に 戻った その こま まで 見ます */
            var safety = 0, sawRobo = 0;
            while (safety++ < 80) {
              var before = P.state().cur;
              if (!pumpOne()) break;
              var s2 = look('こま' + safety);
              if (s2.over) break;
              if (s2.cur === 1) sawRobo++;
              if (before !== s2.cur) t.kirikae++;       /* ★ ⑤ 切りかえの こま（★look が もう 見ました）*/
              if (sawRobo && s2.cur === 0) break;
            }
            t.turns++;
            continue;
          }
          if (!pumpOne()) break;
        }
        });
      } catch (e) { t.why.push(String(e && e.message || e)); }
      if (keepLevel != null) P.setLevel(keepLevel);
      off();
      if ($('say')) { $('say').textContent = kSay32; if (kHid32) $('say').classList.add('hidden'); else $('say').classList.remove('hidden'); }

      /* ★★★ 下の 線 ★★★ */
      if (t.hitoKoma < T32.koma) t.why.push('★★人の 手番の こまを ' + t.hitoKoma + ' しか 見られません でした（★★見張りが 死んで います）');
      if (t.roboKoma < T32.koma) t.why.push('★★ロボットの 手番の こまを ' + t.roboKoma + ' しか 見られません でした（★★見張りが 死んで います）');
      if (t.kirikae < T32.kirikae) t.why.push('★★手番の 切りかえの こまを ' + t.kirikae + ' 回 しか 見られません でした（★人→ロボット・ロボット→人 の 両方が 要ります ―― ★★見張りが 死んで います）');
      var rh = Object.keys(t.ringHito), rr = Object.keys(t.ringRobo);
      if (rh.length > 1) t.why.push('★★「' + T32.hito + '」の こまで わくが ' + rh.length + ' 通り あります（★同じ 名前なら 同じ 色の はず）');
      if (rr.length > 1) t.why.push('★★「' + T32.robo + '」の こまで わくが ' + rr.length + ' 通り あります（★同じ 名前なら 同じ 色の はず）');
      if (rh.length && rr.length && rh[0] === rr[0]) t.why.push('★★★「' + T32.hito + '」と「' + T32.robo + '」で 帯の わくが 同じ です（★色が 番を 言って いません）');
      if (t.kieta) t.why.push('★★帯の 名前が 見えない こまが ' + t.kieta + ' あります');
      if (t.kire) t.why.push('★★帯の 名前が 切れて いる こまが ' + t.kire + ' あります');
      /* ★★★ 上の 線 ―― ★★字・印・色の 食いちがい ★★★ */
      if (t.bad.length) {
        t.why.push('★★★名前・印・色が 合って いない こまが ' + t.bad.length + '／' + t.koma + '：' +
                   t.bad.slice(0, 3).join('／') + (t.bad.length > 3 ? '／…' : ''));
      }
      return t;
    }
    var t32 = check32();
    for (i = 0; i < t32.why.length; i++)
      ng.push('★★★★ 帯の 名前 ＝ 手番の 主：' + t32.why[i] + '（★T243・社長の ご指摘・💻コーダ）');
    note['㉜ ★★★サイコロの 上の 帯の 名前 ＝ いま 手番の 主'] =
      '見た こま ' + t32.koma + '（★人 ' + t32.hitoKoma + '・ロボット ' + t32.roboKoma + '・切りかえ ' + t32.kirikae + '回・' + t32.turns + '手番）' +
      '／★出た 名前 ' + Object.keys(t32.mita).map(function (k) { return '「' + k + '」' + t32.mita[k]; }).join('・') +
      '／★食いちがい ' + t32.bad.length + '／★消え ' + t32.kieta + '・切れ ' + t32.kire +
      '／★わく：あなた ' + Object.keys(t32.ringHito).length + '通り・ロボット ' + Object.keys(t32.ringRobo).length + '通り（★金 ' + T32.kin + '）';





    /* ============================================================
       ★★★ ⑧ わざと 壊して、鳴る ことを 見せる（★型の ④）★★★
       ------------------------------------------------------------
       ★ ★★どの 大きさの 画面でも 鳴る 形に して あります（★型の ③）。
       ★ ★★さわった ものは 1つ 残らず 戻します（★型の ⑤）。
       ============================================================ */
    var kill = [], injected = 1;
    function one(name, what, doIt, undoIt) {
      var rang = false;
      try { doIt(); rang = what(); } catch (e) { rang = false; }
      try { undoIt(); } catch (e) {}
      kill.push(name + ' … ' + (rang ? '○ 鳴った' : '★★鳴らない'));
      return rang;
    }
    var killOk = 0, killN = 0;

    /* ★ ①「0点の マスを 先に 暗くする」を 足して みる → ★①が 鳴る はず */
    killN++;
    var st1 = document.createElement('style');
    if (one('①0点の マスを 暗くする', function () {
      P.setSheet(C.newSheet()); P.setDice([1, 1, 1, 1, 1], 1);
      var look = P.cellLook(), base = null, diff = 0;
      for (var k = 0; k < look.length; k++) {
        if (look[k].cat === '@bonus' || look[k].cls.indexOf('is-open') < 0) continue;
        if (base === null) { base = look[k]; continue; }
        if (look[k].look !== base.look) diff++;
      }
      return diff > 0;
    }, function () {
      st1.textContent = '.cell.is-open[data-cat="n2"],.cell.is-open[data-cat="n3"]{opacity:.4;}';
      document.head.appendChild(st1);
    }, function () { if (st1.parentNode) st1.parentNode.removeChild(st1); })) killOk++;

    /* ★ ②「のこすと よい サイコロを 光らせる」を 足して みる → ★①-2 が 鳴る はず */
    killN++;
    var st2 = document.createElement('style');
    if (one('②のこすと よい サイコロを 光らせる', function () {
      P.setDice([6, 6, 1, 2, 3], 1);
      var look = P.dieLook(), base = look[2].look, diff = 0;
      for (var k = 0; k < look.length; k++) if (look[k].look !== base) diff++;
      return diff > 0;
    }, function () {
      st2.textContent = '.die[data-v="6"]{outline:4px solid gold;}';
      document.head.appendChild(st2);
    }, function () { if (st2.parentNode) st2.parentNode.removeChild(st2); })) killOk++;

    /* ★ ③「ふり直しを 3回に する」→ ★④ が 鳴る はず */
    killN++;
    if (one('③ふり直しを 3回に する', function () {
      var log = runOneGame(4242, function () {
        var btn = P.el.roll();
        for (var q = 0; q < 5; q++) realTap(btn);
      });
      return log.rollsMax > C.REROLL + 1;
    }, function () { C.CFG.reroll = 5; }, function () { C.CFG.reroll = C.REROLL; })) killOk++;

    /* ★ ④「ならびを 点の 高い 順に する」→ ★①-3 が 鳴る はず */
    killN++;
    if (one('④ならびを 入れかえる', function () {
      return P.order().join(',') !== P.GRID.join(',');
    }, function () {
      var sh = P.el.sheet();
      sh.insertBefore(sh.children[sh.children.length - 1], sh.firstChild);
    }, function () {
      var sh = P.el.sheet(), k;
      /* ★ ならべ直す（★GRID の 順に 入れ直すだけ）*/
      for (k = 0; k < P.GRID.length; k++) sh.appendChild(P.el.cell[P.GRID[k]]);
    })) killOk++;

    /* ★ ⑤「手を 教える 文を 足す」→ ★①-4 が 鳴る はず */
    killN++;
    var kSay = $('say').textContent, kHid = $('say').classList.contains('hidden');
    if (one('⑤手を 教える 文を 足す', function () {
      var verb = /(のこ|残|えらん|ねら|書い|そろえ|あきらめ)/, push = /(と いい|ほうが|しよう|おすすめ|ここが|あと ?[0-9])/;
      var t = document.querySelector('.talk .banner').textContent;
      return verb.test(t) && push.test(t);
    }, function () {
      $('say').textContent = '6を のこした ほうが いいよ';
      $('say').classList.remove('hidden');
    }, function () {
      $('say').textContent = kSay;
      if (kHid) $('say').classList.add('hidden'); else $('say').classList.remove('hidden');
    })) killOk++;

    /* ★ ⑥「ふり直す ボタンを 画面の 外へ 追い出す」→ ★⑤ が 鳴る はず */
    killN++;
    var st6b = document.createElement('style');
    if (one('⑥ふり直す ボタンを 画面の 外へ', function () {
      P.setDice([1, 2, 3, 4, 5], 1); P.render();
      var q = $('btnRoll').getBoundingClientRect();
      return q.left < -0.5 || q.right > window.innerWidth + 0.5 || q.top < -0.5 || q.bottom > window.innerHeight + 0.5;
    }, function () {
      st6b.textContent = '.roll-btn{position:fixed !important;left:-300px !important;top:10px !important;}';
      document.head.appendChild(st6b);
    }, function () { if (st6b.parentNode) st6b.parentNode.removeChild(st6b); })) killOk++;

    /* ★ ⑦「サイコロを 44pxより 小さく する」→ ★⑤-2 が 鳴る はず */
    killN++;
    var st7 = document.createElement('style');
    if (one('⑦サイコロを 44pxより 小さく する', function () {
      P.render();
      return P.el.die[0].getBoundingClientRect().width < 43.5;
    }, function () {
      st7.textContent = '.die{width:30px !important;height:30px !important;}';
      document.head.appendChild(st7);
    }, function () { if (st7.parentNode) st7.parentNode.removeChild(st7); })) killOk++;

    /* ★★ ⑧「前の ふりの 後片づけを 生かした まま」に する → ★★⑨ が 鳴る はず
       ★ ★★＝ ★2026-09-02 に トライが 見つけた こわれ方 そのものを、★もう一度 作ります。 */
    killN++;
    if (one('⑧前の ふりの 後片づけを 生かす（★トライ 🟡-1）', function () {
      return injected !== 1;
    }, function () {
      injected = cleanupCount(function () {
        /* ★ 古い やり方（★消さずに もう 1本 積む）を まねる */
        root.setTimeout(function () {
          for (var j = 0; j < C.NDICE; j++) P.el.die[j].classList.remove('is-roll');
        }, 620);
      });
    }, function () { injected = 1; })) killOk++;

    /* ★★ ⑨「ふり直せない のに ふり直しを すすめる」→ ★★⑩ が 鳴る はず */
    killN++;
    var kSay2 = $('say').textContent, kHid2 = $('say').classList.contains('hidden');
    if (one('⑨ふり直せない のに「ふろう」と 言わせる（★トライ 🟡-2）', function () {
      var s = P.sayNow();
      return !!(s.text && /ふり直|ふろう/.test(s.text));
    }, function () {
      P.setDice([1, 2, 3, 4, 5], C.REROLL + 1);
      $('say').textContent = 'サイコロを ふろう！';
      $('say').classList.remove('hidden');
    }, function () {
      $('say').textContent = kSay2;
      if (kHid2) $('say').classList.add('hidden'); else $('say').classList.remove('hidden');
    })) killOk++;

    /* ══════════════════════════════════════════════════════════
       ★★★★ T226 ―― ★新しい 見張り ⑪〜⑮ も、★★わざと 壊して 鳴らします ★★★★
       ★ ★★見張りを 足したら、★★★その 見張りが 本当に 鳴る ことを 見せる まで が 仕事 です。
       ══════════════════════════════════════════════════════════ */

    /* ★ ⑩「消した はずの スリーダイスを 表に 戻す」→ ★★⑪ が 鳴る はず */
    /* ⚠️★★★ ここで 1回 しくじりました【★T226・私の 失敗】――
       ★ ★はじめ `P.el.cell.ch.firstChild.textContent = '同じ目3つ'` と、★**画面の 字だけ** を 書きかえました。
         ★ ★★鳴りません でした。★★★`names11()` の 中で `P.setSheet()` が `render()` を 呼び、
           ★ ★★私の 書きかえを **その場で 上書き** して いた から です。
       ★ ★★＝ ★★「壊した つもりで、何も 壊れて いなかった」。
         ★ ★★見張りを 疑う 前に、★★★自分の 壊し方を 疑う ―― ★会社の 決まり どおり でした。
       ★ ★→ ★★**もとの データ（`C.CATS`）の 名前**を 変えます。★これは render を 通っても のこります。 */
    killN++;
    var kName = null, kIdx = -1;
    if (one('⑩スリーダイスを 表に 戻す（★T226）', function () {
      var r = names11();
      return r.miss.length > 0 || r.ghost.length > 0;
    }, function () {
      for (var k = 0; k < C.CATS.length; k++) if (C.CATS[k].id === 'ch') { kIdx = k; break; }
      kName = C.CATS[kIdx].name;
      C.CATS[kIdx].name = '同じ目3つ';
    }, function () {
      if (kIdx >= 0 && kName != null) { C.CATS[kIdx].name = kName; kName = null; kIdx = -1; }
      P.render();
    })) killOk++;

    /* ★★ ⑪「ボーナスを 62点でも 付ける」→ ★★⑫ が 鳴る はず（★★下の 線 を 壊す）
       ★ ★★上の 線（63点で 付く）だけ だと、★★「いつも 付ける」でも 通って しまいます。
         ★ ★★★ここが 鳴る ことが、★下の 線が 生きて いる しるし です。 */
    killN++;
    if (one('⑪ボーナスを 62点でも 付ける（★T226・下の 線）', function () {
      return check12().why.length > 0;
    }, function () { C.CFG.bonusNeed = 62; },
       function () { C.CFG.bonusNeed = C.BONUS_NEED; })) killOk++;

    /* ★★ ⑫「はじめから ふって ある ように する」→ ★★⑬ が 鳴る はず
       ★ ★★＝ ★★T225 まで の こわれ方（★社長の ご指摘④）を、★もう一度 作ります。 */
    killN++;
    if (one('⑫はじめから ふって ある ように する（★T226・社長の ご指摘④）', function () {
      return check13(function () { P.throwDice(true); }).why.length > 0;
    }, function () {}, function () {})) killOk++;

    /* ★★ ⑬「ロボットを 一瞬で 終わらせる」→ ★★⑭ が 鳴る はず（★★下の 線）
       ★ ★★＝ ★★T225 まで の 見え方（★結果だけ）に 戻す ―― ★★社長の ご指摘⑤ そのもの。 */
    killN++;
    var kBot = { roll: P.BOT.roll, write: P.BOT.write };
    if (one('⑬ロボットを 一瞬で 終わらせる（★T226・社長の ご指摘⑤・下の 線）', function () {
      var r = watch14();
      for (var k = 0; k < r.why.length; k++) if (r.why[k].indexOf('下の 線') >= 0) return true;
      return r.why.length > 0;
    }, function () { P.BOT.roll = 1; P.BOT.write = 1; },
       function () { P.BOT.roll = kBot.roll; P.BOT.write = kBot.write; })) killOk++;

    /* ★★ ⑭「ロボットを うんと ゆっくりに する」→ ★★⑭ が 鳴る はず（★★上の 線）
       ★ ★★片側だけ 引いた 線は、線では ありません。★両方 鳴る ことを 見せます。 */
    killN++;
    if (one('⑭ロボットを ゆっくりに する（★T226・上の 線）', function () {
      var r = watch14();
      for (var k = 0; k < r.why.length; k++) if (r.why[k].indexOf('上の 線') >= 0) return true;
      return false;
    }, function () { P.BOT.roll = 1500; P.BOT.write = 1500; },
       function () { P.BOT.roll = kBot.roll; P.BOT.write = kBot.write; })) killOk++;

    /* ★★ ⑮「役の 説明の 字を 小さく する」→ ★★⑮ が 鳴る はず
       ★ ★★「並んで いるが 読めない」は、★★無いのと 同じ です（★見張って いる ふり の 7つ目）。 */
    killN++;
    var st15 = document.createElement('style');
    if (one('⑮役の 説明の 字を 6pxに する（★T226・社長の ご指摘⑥）', function () {
      return check15().why.length > 0;
    }, function () {
      st15.textContent = '.cat-list li{font-size:6px !important;}';
      document.head.appendChild(st15);
    }, function () { if (st15.parentNode) st15.parentNode.removeChild(st15); })) killOk++;

    /* ★★ ⑯「役名の 字を 8pxに する」→ ★★⑯ が 鳴る はず（★★床 11px を 割る）*/
    killN++;
    var st16a = document.createElement('style');
    if (one('⑯役名の 字を 8pxに する（★T227・🎨アト）', function () {
      return check16().why.length > 0;
    }, function () {
      st16a.textContent = '.cell-name{font-size:8px !important;}';
      document.head.appendChild(st16a);
    }, function () { if (st16a.parentNode) st16a.parentNode.removeChild(st16a); })) killOk++;

    /* ★★ ⑰「役名の はばを 10pxに する」→ ★★⑯ が 鳴る はず（★★三点リーダで 切れる）
       ★ ★★字の 大きさ とは 別の 道 です ―― ★★「読める 大きさ だが 切れて いる」を つぶします。 */
    killN++;
    var st16b = document.createElement('style');
    if (one('⑯役名の はばを 10pxに して 切る（★T227・🎨アト）', function () {
      return check16().why.length > 0;
    }, function () {
      st16b.textContent = '.cell-name{max-width:10px !important; flex:0 0 10px !important;}';
      document.head.appendChild(st16b);
    }, function () { if (st16b.parentNode) st16b.parentNode.removeChild(st16b); })) killOk++;

    /* ★★ ⑱「はじめの 画面に ボタンを もう 1つ 置く」→ ★★⑰ が 鳴る はず（★★上の 線）*/
    killN++;
    var extraBtn = document.createElement('button');
    extraBtn.type = 'button'; extraBtn.textContent = 'よけいな ボタン';
    extraBtn.style.cssText = 'min-height:44px;min-width:44px;';
    if (one('⑰はじめの 画面に ボタンを もう 1つ 置く（★T227・🎨アト）', function () {
      return check17().why.length > 0;
    }, function () {
      document.querySelector('.btn-row').appendChild(extraBtn);
    }, function () { if (extraBtn.parentNode) extraBtn.parentNode.removeChild(extraBtn); })) killOk++;

    /* ★★★ ⑲「ふる ボタンを 消す」→ ★★⑰ が 鳴る はず（★★★下の 線 ―― ★押せる ものが 0個）
       ★ ★★上の 線だけ だと「1つも 押せない 画面」でも 通って しまいます。 */
    killN++;
    var st17 = document.createElement('style');
    if (one('⑰ふる ボタンを 消す（★★下の 線・T227・🎨アト）', function () {
      return check17().why.length > 0;
    }, function () {
      st17.textContent = '.roll-btn{display:none !important;}';
      document.head.appendChild(st17);
    }, function () { if (st17.parentNode) st17.parentNode.removeChild(st17); })) killOk++;

    /* ★★★ ㉖「はじめの 画面を わざと 高くして、ボタンを 下に 押し出す」→ ★★⑳ が 鳴る はず
       ★ ★★★これが **568×272 で 実際に 起きて いた こと** そのもの です
       ★ ★（★囲いが 縮まず、★「はじめる」が 画面の 下に 押し出される）
       ★ ★★⚠️ ★★★アトは はじめ `padding-bottom` で 壊しました ―― ★★8画面で **鳴りません でした**。
       ★ ★★★下の 内よはくは ボタンを **下に 押しません**（★ボタンの あと に 付く ので）。
       ★ ★★★★見張りを 疑う 前に、★自分の 壊し方を 疑う ―― ★★`padding-top` が 正しい 壊し方 です。*/
    killN++;
    var st20a = document.createElement('style');
    if (one('⑳はじめの 画面を 高くして ボタンを 押し出す（★★★T228 の 🔴 そのもの・T227-2・🎨アト）', function () {
      return check20().why.length > 0;
    }, function () {
      st20a.textContent = '.start-card{padding-top:900px !important;}';
      document.head.appendChild(st20a);
    }, function () { if (st20a.parentNode) st20a.parentNode.removeChild(st20a); })) killOk++;

    /* ★★★ ㉗「はじめる を 44px より 小さくする」→ ★★⑳ が 鳴る はず（★★見本 44px）*/
    killN++;
    var st20b = document.createElement('style');
    if (one('⑳はじめる を 20px に する（★★見本 44px・T227-2・🎨アト）', function () {
      return check20().why.length > 0;
    }, function () {
      st20b.textContent = '.start-button{min-height:20px !important;padding:0 !important;}' +
                          '.start-button small{display:none !important;}';
      document.head.appendChild(st20b);
    }, function () { if (st20b.parentNode) st20b.parentNode.removeChild(st20b); })) killOk++;

    /* ★★★ ㉘「はじめる の 上に 何かを 乗せる」→ ★★⑳ が 鳴る はず（★★指の 帯 ＝ 0px）
       ★ ★★★大きさは **1pxも 正しい まま** です ―― ★★はば・たけ では 絶対に 出ません。
       ★ ★★★＝ ★「切れては いないが 押せない」を 数える 目 です
       ★ ★（★★アトが ハーツ T220 と ヨット T227 で 2度 踏んだ「絵にしか 出ない 病気」の 形）*/
    killN++;
    var st20c = document.createElement('style');
    if (one('⑳はじめる の 上に 何かを 乗せる（★★大きさは 正しい まま・T227-2・🎨アト）', function () {
      return check20().why.length > 0;
    }, function () {
      st20c.textContent = '.start-card::after{content:"";position:absolute;inset:0;z-index:9;}';
      document.head.appendChild(st20c);
    }, function () { if (st20c.parentNode) st20c.parentNode.removeChild(st20c); })) killOk++;

    /* ★★★ ㉙「はじめる を 消す」→ ★★⑳ が 鳴る はず（★★★下の 線 ―― ★★測る ものが ない）*/
    killN++;
    var st20d = document.createElement('style');
    if (one('⑳はじめる を 消す（★★★下の 線・T227-2・🎨アト）', function () {
      return check20().why.length > 0;
    }, function () {
      st20d.textContent = '#btnStart{display:none !important;}';
      document.head.appendChild(st20d);
    }, function () { if (st20d.parentNode) st20d.parentNode.removeChild(st20d); })) killOk++;

    /* ★★★ ⑳「ロボットの 番の しるしを、2段 とも 消す」→ ★★⑱ が 鳴る はず
       ★ ★★帯（どの 見る道具でも 出る）と 台（`:has()`）の **両方**を 人の 手番と 同じ 色に します。
       ★ ★★片方だけ 消しても 鳴りません ―― ★★それが 2段に した 意味 です。 */
    killN++;
    var st18a = document.createElement('style');
    if (one('⑱ロボットの 番の しるしを 2段 とも 消す（★T227・🎨アト）', function () {
      return watch18().why.length > 0;
    }, function () {
      st18a.textContent =
        '.bot-cell.is-turn{background:rgba(255,255,255,.72) !important;box-shadow:none !important;color:#5a7a8c !important;}' +
        '.bot-band:has(.bot-cell.is-turn) + .dice-row{background:none !important;box-shadow:none !important;}';
      document.head.appendChild(st18a);
    }, function () { if (st18a.parentNode) st18a.parentNode.removeChild(st18a); })) killOk++;

    /* ★★ ㉑「書いた とき『ロボット』の 名前を 引っこめる」→ ★★⑱ が 鳴る はず
       ★ ★★T226 まで 実際に こう なって いました（★はばが 足りない と 思って いた ため）。
       ★ ★★数えたら 足りて いた ので 出す ことに しました ―― ★★戻らない ように 線を 引きます。 */
    killN++;
    var st18b = document.createElement('style');
    if (one('⑱書いた とき 名前を 引っこめる（★T227・🎨アト）', function () {
      return watch18().why.length > 0;
    }, function () {
      st18b.textContent = '.bot-cell.has-move .bot-name{display:none !important;}';
      document.head.appendChild(st18b);
    }, function () { if (st18b.parentNode) st18b.parentNode.removeChild(st18b); })) killOk++;

    /* ★★★ ㉒「字が 空の 丸わくを 浮かせる」→ ★★⑱ が 鳴る はず
       ★ ★★★これは **私が 実際に やった 失敗** です（★T227・後_320x568_C1.png）。
         ★ ★★大きさの 数字でも 字の 中身でも 出ず、★写真だけが 教えました。
         ★ ★★→ ★★もう 一度 やったら、★今度は 見張りが 教えます。 */
    killN++;
    var st18c = document.createElement('style');
    if (one('⑱字が 空でも 丸わくを 浮かせる（★★私の 失敗・T227・🎨アト）', function () {
      return watch18().why.length > 0;
    }, function () {
      st18c.textContent = '.bot-cell .bot-move{padding:1px 9px 2px !important;background:#fff !important;border-radius:999px !important;}';
      document.head.appendChild(st18c);
    }, function () { if (st18c.parentNode) st18c.parentNode.removeChild(st18c); })) killOk++;
    /* ★★★ ㉓「手番が 変わっても ことばを 消さない」→ ★★⑲ が 鳴る はず（★★上の 線）
       ★ ★★★これは **直しそのものを 外して** います（★見た目を 作りものに して いません）。
         ★ ★`P.SAY_ORDER` を 空に すると `hushOrder()` が 何も しなく なり、
           ★ ★★★T226 の 姿（★アトが 写真で 見つけた 姿）に そのまま 戻ります。
       ★ ★★★2とおり（1回ふり・3回ふり）の どちらでも 鳴ります【★実測・T227】。 */
    killN++;
    var kOrder = { start: P.SAY_ORDER.start, write: P.SAY_ORDER.write };
    if (one('⑲手番が 変わっても ことばを 消さない（★T227・💻コーダ）', function () {
      return check19().why.length > 0;
    }, function () {
      delete P.SAY_ORDER.start; delete P.SAY_ORDER.write;
    }, function () {
      P.SAY_ORDER.start = kOrder.start; P.SAY_ORDER.write = kOrder.write;
    })) killOk++;

    /* ★★ ㉔「見本の ことばを 1つ 書きかえる」→ ★★⑲ が 鳴る はず（★★★下の 線）
       ★ ★★上の 線だけ だと、★★★ことばを 変えた 日に 見張りが **だまって ○** を 出します
         ★ ★（★会社の「見張って いる ふり」7つの 形の 1つ目 ―― ★名前が あるかだけ 見る）。
       ★ ★★見本と 画面が ずれた ことを、★★見張り 自身が 鳴らせる かを 試します。 */
    /* ⚠️★★★★ T230 ―― ★★この 壊し方は、★★★見本を 1つ 足した その日に **死にました** ★★★★
       ★ ★★T227 の 私は `ORDERS19[0]` **1つだけ** を 書きかえて いました。
         ★ ★★T230 で 見本が 2つ → **3つ**に なった ところ、★★★2つの 場面が のこりの 見本を
           ★ ★★拾って しまい、★★★この 壊し方は **だまって ○ を 出しました**【★実測・29通り中 1つ 鳴らず】。
       ★ ★★★＝ ★声を 足した ことで、★★声を 見張る 下の 線が ゆるみました。
         ★ ★★会社の「見張って いる ふり」7つの 形の 1つ目（★名前が あるかだけ 見る）に 落ちて いました。
       ★ ★→ ★★**見本を ぜんぶ 書きかえます**（★★これなら 見本が また 増えても 鳴ります）。 */
    killN++;
    var kOrders19 = ORDERS19.slice();
    if (one('⑲見本の ことばを ぜんぶ 書きかえる（★★下の 線・T227・💻コーダ／★★★T230 で 直しました）', function () {
      return check19().why.length > 0;
    }, function () {
      for (var q19 = 0; q19 < ORDERS19.length; q19++) ORDERS19[q19] = 'ぜんぜん ちがう ことば' + q19;
    }, function () {
      for (var r19 = 0; r19 < kOrders19.length; r19++) ORDERS19[r19] = kOrders19[r19];
    })) killOk++;

    /* ★★★★ ㉕「★★書いた 瞬間の 消しだけ 外す」→ ★★★広げた ⑲ が 鳴る はず（★T228・🧪トライの 実測）★★★★
       ★ ★★これが この 直しの **本命の 壊し方** です。
         ★ ★★㉓（`SAY_ORDER` を 空に する）は ★T226 の 姿（★2.4秒 まるまる 残る）に 戻します ――
           ★ ★★★T227 の 狭い 目でも 鳴りました。
         ★ ★★★㉕ は `HUSH.onWrite` だけ 0 に します。★席が 変わる ときの 消しは **生きた まま** なので、
           ★ ★★★のこるのは 書いた 直後の **267ms** だけ ―― ★★トライが 実測した 姿 そのもの です。
       ★ ★★★T227 の 狭い 目（`s2.cur === 1`）だと、★★これは **だまって ○** に なります
         ★ ★（★★実測：★のこり 267ms の うち 席1 の こまは **0ms**）。
       ★ ★★★＝ ★「広げた ことに 意味が あった」ことを、★★この 1通りが 証明します。 */
    killN++;
    var kHushWrite = P.HUSH.onWrite;
    if (one('⑲書いた 瞬間の 消しだけ 外す（★★★267msの のこり・T228・🧪トライ）', function () {
      return check19().why.length > 0;
    }, function () {
      P.HUSH.onWrite = 0;
    }, function () {
      P.HUSH.onWrite = kHushWrite;
    })) killOk++;

    /* ════════════════════════════════════════════════════════════
       ★★★★ T230 ―― ★社長の ご指摘 ①②③④ を わざと 壊す（★10通り）★★★★
       ★ ★★どれも「見た目を 作りものに する」壊し方では ありません ――
         ★ ★★★①〜④ を 入れる 前の 姿（★★出て いない・読めない・しゃべらない）に 戻します。
       ════════════════════════════════════════════════════════════ */

    /* ★ ㉖ ロボットの 点の 列を 消す → ★★㉑ が 鳴る はず（★★①を 入れる 前の 姿）*/
    killN++;
    var st21a = document.createElement('style');
    if (one('㉑ロボットの 点の 列を 消す（★★★①を 入れる 前の 姿・T230・社長の ご指摘①）', function () {
      return check21().why.length > 0;
    }, function () {
      st21a.textContent = '.cell-bp{display:none !important;}';
      document.head.appendChild(st21a);
    }, function () { if (st21a.parentNode) st21a.parentNode.removeChild(st21a); })) killOk++;

    /* ★ ㉗ あなたの 点の 列を 消す → ★★㉑ が 鳴る はず（★★★下の 線 ―― ★片方だけ 見て いない こと）*/
    killN++;
    var st21b = document.createElement('style');
    if (one('㉑あなたの 点の 列を 消す（★★下の 線・T230・社長の ご指摘①）', function () {
      return check21().why.length > 0;
    }, function () {
      st21b.textContent = '#sheet .cell-pt{display:none !important;}';
      document.head.appendChild(st21b);
    }, function () { if (st21b.parentNode) st21b.parentNode.removeChild(st21b); })) killOk++;

    /* ★★★ ㊱ ロボットの 点を **うすい 色**に する → ★★㉑ の へだたりが 鳴る はず ★★★
       ★ ★★★これは 私が 実際に 出しかけた 色 です（#9aa7b3・へだたり 2.46／2.13）。
         ★ ★★大きさは 正しい まま・字も 正しい まま ―― ★★★色だけ で 読めなく なります。 */
    killN++;
    var st21e = document.createElement('style');
    if (one('㉑ロボットの 点を うすい 色に する（★★★私が 出しかけた 色・T230）', function () {
      return check21().why.length > 0;
    }, function () {
      st21e.textContent = '.cell-bp{color:#9aa7b3 !important;}';
      document.head.appendChild(st21e);
    }, function () { if (st21e.parentNode) st21e.parentNode.removeChild(st21e); })) killOk++;

    /* ★ ㉘ ロボットの 点の 字を 6px に する → ★★㉑ の 11px の 床が 鳴る はず */
    killN++;
    var st21c = document.createElement('style');
    if (one('㉑ロボットの 点を 6px に する（★★11px の 床・T230）', function () {
      return check21().why.length > 0;
    }, function () {
      st21c.textContent = '.cell-bp{font-size:6px !important;}';
      document.head.appendChild(st21c);
    }, function () { if (st21c.parentNode) st21c.parentNode.removeChild(st21c); })) killOk++;

    /* ★ ㉙ ロボットの 点の はばを 6px に して 切る → ★★㉑ の「切れて いる」が 鳴る はず
       ★ ★★大きさは 正しい まま で、★★★中身だけ 読めなく なる 形 です。 */
    killN++;
    var st21d = document.createElement('style');
    if (one('㉑ロボットの 点の はばを 6px に して 切る（★T230）', function () {
      return check21().why.length > 0;
    }, function () {
      st21d.textContent = '.cell-bp{min-width:0 !important;max-width:6px !important;flex:0 0 6px !important;overflow:hidden !important;}';
      document.head.appendChild(st21d);
    }, function () { if (st21d.parentNode) st21d.parentNode.removeChild(st21d); })) killOk++;

    /* ★★★ ㉚ 表の 止めを 外す → ★★㉑-2 が 鳴る はず（★★★書く 前に 答えが 出る）★★★
       ★ ★★これは 見た目の 細工では ありません ―― ★★★`FREEZE.botSheet` を 0 に すると、
         ★ ★★ロボットが ふって いる 最中に 表の 点が 先に 動きます（★T226 の 合計点と 同じ 病気）。 */
    killN++;
    var kFreeze = P.FREEZE.botSheet;
    if (one('㉑-2 表の 止めを 外す（★★★書く 前に 点が 出る・T230・社長の ご指摘①⑤）', function () {
      return check21b().why.length > 0;
    }, function () {
      P.FREEZE.botSheet = 0;
    }, function () { P.FREEZE.botSheet = kFreeze; })) killOk++;

    /* ★ ㉛ ロボットの 合計点を 消す → ★★㉒ が 鳴る はず（★★②を 入れる 前の 姿）*/
    killN++;
    var st22a = document.createElement('style');
    if (one('㉒ロボットの 合計点を 消す（★★★②を 入れる 前の 姿・T230・社長の ご指摘②）', function () {
      return check22().why.length > 0;
    }, function () {
      st22a.textContent = '#botPt{display:none !important;}';
      document.head.appendChild(st22a);
    }, function () { if (st22a.parentNode) st22a.parentNode.removeChild(st22a); })) killOk++;

    /* ★★★ ㉜ 上の 帯を 高く する → ★★㉒ が 鳴る はず（★★★私が 実際に やって しまった もの）★★★
       ★ ★★測る 道具の 中で、★私は 帯を 30 → 50px に して しまい、
         ★ ★★★表の 1マスが 34 → 31px に 落ちて いました【★T230・実測】。
         ★ ★★数字は どこにも 出ません ―― ★★この 見張りが 無ければ 気づけません。 */
    killN++;
    var st22b = document.createElement('style');
    if (one('㉒上の 帯を 高く する（★★★表の 1マスが 削れる・T230）', function () {
      return check22().why.length > 0;
    }, function () {
      st22b.textContent = '.me-band{min-height:56px !important;}';
      document.head.appendChild(st22b);
    }, function () { if (st22b.parentNode) st22b.parentNode.removeChild(st22b); })) killOk++;

    /* ★ ㉝ ボーナスの 行を 1列に 戻す → ★★㉓ が 鳴る はず（★★決まりの 文が 切れます）*/
    killN++;
    var st23a = document.createElement('style');
    if (one('㉓ボーナスの 行を 1列に 戻す（★★決まりの 文が 切れる・T230・社長の ご指摘③）', function () {
      return check23().why.length > 0;
    }, function () {
      st23a.textContent = '.cell.is-bonus{grid-column:auto !important;}';
      document.head.appendChild(st23a);
    }, function () { if (st23a.parentNode) st23a.parentNode.removeChild(st23a); })) killOk++;

    /* ★★★ ㉞ ハッピーを だまらせる → ★★㉔ が 鳴る はず（★★★T226 の 姿 そのもの）★★★
       ★ ★★`turns` を 0 に すると、★手番の はじめの ことばが 出なく なります ――
         ★ ★★★社長が ご指摘に なった「しゃべらない」姿に そのまま 戻ります。 */
    killN++;
    var kPlan = { s: P.SAY_PLAN.start.turns, k: P.SAY_PLAN.keep.turns };
    if (one('㉔ハッピーを だまらせる（★★★T226 の 姿・T230・社長の ご指摘④）', function () {
      return check24().why.length > 0;
    }, function () {
      P.SAY_PLAN.start.turns = 0; P.SAY_PLAN.keep.turns = 0;
    }, function () {
      P.SAY_PLAN.start.turns = kPlan.s; P.SAY_PLAN.keep.turns = kPlan.k;
    })) killOk++;

    /* ★★★★ ㉟ ハッピーに **手を 教えさせる** → ★★★㉔ と ①-4 が 鳴る はず ★★★★
       ★ ★★これが この 仕事で いちばん こわい 壊れ方 です（★設計図 追記②）。
         ★ ★★「どう さわるか」を 言う ことばに、★★★「何を えらぶか」が まざる ――
           ★ ★★★社長の ご指摘④ を 入れる ときに、★いちばん すべりやすい ところ です。
       ★ ★★見本を 決め打ちに して あるので、★★1文字でも ずれたら 鳴ります。 */
    killN++;
    var kKeepText = P.SAY_PLAN.keep.text;
    if (one('㉔ハッピーに 手を 教えさせる（★★★追記②の 線・T230・社長の ご指摘④）', function () {
      return check24().why.length > 0;
    }, function () {
      P.SAY_PLAN.keep.text = '6を のこすと フォーダイスに なるよ！';
    }, function () { P.SAY_PLAN.keep.text = kKeepText; })) killOk++;

    /* ★★★ ㊻ ―― ★ロボットの 表の 戻しを 外す → ★★㉖ が 鳴る はず（★T232・💻コーダ）★★★
       ★ ★★これは 「見た目を 作りものに する」壊し方では ありません ――
         ★ ★★★T232 を 入れる **前の 姿** そのもの（★★人の 表だけ 戻して、ロボットは 空の まま）に 戻します。 */
    killN++;
    if (one('㉖ロボットの 表の 戻しを 外す（★★★T232 を 入れる 前の 姿・💻コーダ）', function () {
      return check26().why.length > 0;
    }, function () {
      RESTORE_BOT = 0;
    }, function () { RESTORE_BOT = 1; })) killOk++;

    /* ★★★ ㊲〜㊺ ―― ★T231・🎨アト（★9通り）★★★
       ★ ★★どれも「見た目を 作りものに する」壊し方では ありません ――
         ★ ★★★T231 を 入れる **前の 姿**（★線が 無い・すきまが 7.4px）に 戻す ものです。 */
    var s25 = document.createElement('style');
    function br25(name, css, want) {
      killN++;
      if (one(name, function () {
        var r = want();
        return r;
      }, function () {
        s25.textContent = css; document.head.appendChild(s25);
      }, function () { if (s25.parentNode) s25.parentNode.removeChild(s25); })) killOk++;
    }
    function ng25()  { return check25().why.length > 0; }
    function ng25b() { return check25b().why.length > 0; }

    br25('㊲線を 消す（★T231 を 入れる 前の 姿）',
         '#sheet .cell::after{ display:none !important; }', ng25);
    br25('㊳線を とうめいに する（★★はばは 正しい まま ―― ★大きさでは 出ない 病気）',
         '#sheet .cell::after{ background:transparent !important; }', ng25);
    br25('㊴線を 左の 数字に くっつける',
         '#sheet .cell::after{ right:calc(0.2px + 1.5 * var(--cell-n)) !important; }', ng25);
    br25('㊵線の 場所を マスごとに ばらす（★★そろって いない）',
         '#sheet .cell:nth-child(2n)::after{ right:calc(20px + 1.5 * var(--cell-n)) !important; }', ng25);
    br25('㊶すきまを 0に 戻す（★★★T230 の 7.4px そのもの）',
         '#sheet .cell-bp{ margin-left:0 !important; } #sheet .cell-pt,#sheet .cell-bp{ min-width:1.6em !important; }' +
         '#sheet .cell::after{ display:none !important; }', ng25);
    br25('㊷上の 帯の 線を 消す（★★表の 13本が 何の 線か 言えなく なる）',
         '.me-band .me-name.bot::before{ display:none !important; }', ng25);
    br25('㊸★★ロボットの 点に うすい 台を 敷く（★★★コーダの 案①・★私が 落とした 形）',
         '#sheet .cell-bp{ background:rgba(107,100,114,.10) !important; }', ng25b);
    br25('㊹★字に うすめ（opacity）を かける（★★へだたりの 数が 嘘に なる）',
         '#sheet .cell-bp{ opacity:.5 !important; }', ng25b);
    br25('㊺★★下の 線：表を 空に する（★1マスも 数えられない）',
         '#sheet{ display:none !important; } #sheet .cell{ display:none !important; }', ng25);



    /* ★★★ (47)〜(52) ―― ★T233・🎨アト（★6通り）★★★
       ★ ★★どれも「見た目を 作りものに する」壊し方では ありません ――
         ★ ★★★T233 を 入れる **前の 姿**（★＝ ★★2026-09-06 に 出荷ずみだった 姿）に 戻す ものです。
       ⚠️★ ★★(49) だけは ちがいます ―― ★★★あれは 私が T233 の 途中で **実際に 作った** 形です。 */
    var s27 = document.createElement('style');
    function br27(name, css, want) {
      killN++;
      if (one(name, want, function () {
        s27.textContent = css; document.head.appendChild(s27);
      }, function () { if (s27.parentNode) s27.parentNode.removeChild(s27); })) killOk++;
    }
    function ng27()  { return check27().why.length > 0; }
    function ng27b() { return check27b().why.length > 0; }

    br27('(47)★★入れものを やめる（★★★cqw が 効かない ＝ T233 を 入れる 前の 姿）',
         '#sheet{ container-type:normal !important; }', ng27);
    br27('(48)★★はばの 天井を 外す（★★★たけ だけで 決める、もとの 式）',
         '#sheet .cell{ --f2:max(11px, var(--cell-f)) !important; --n2:var(--cell-n) !important; }', ng27);
    /* ⚠️★★★ ★はじめ これを ★`#sheet .cell::after{ right:calc(9.35px + 1.5 * var(--cell-n)) }` と
       ★ ★書いて いました。★★★9画面では **鳴りません でした**（★390×844 だけ 鳴った）――
         ★ ★★天井が 効いて いない 画面では `--n2` と `--cell-n` が **同じ 値**だから です。
       ★ ★★★＝ ★★「その 画面でしか 鳴らない 壊し方」＝ ★『たまに鳴るは 壊れて いるのと 同じ』。
       ★ ★→ ★★★天井を **必ず 効く 大きさ**（8px ―― ★★字の 床 11px より 下）に して から、線だけ 置き去りに します。 */
    br27('(49)★★★字だけ 天井を かけ、線を 置き去りに する（★★★私が T233 で 落ちた 形）',
         '#sheet .cell{ --n2:min(var(--cell-n), 8px) !important; }' +
         '#sheet .cell::after{ right:calc(9.35px + 1.5 * var(--cell-n)) !important; }', ng27b);
    br27('(50)★天井を ゆるめる（★4.55 → 5.2cqw）',
         '#sheet .cell{ --f2:max(11px, min(var(--cell-f), 5.2cqw)) !important; }', ng27);
    br27('(51)★★線を 1本だけ ずらす（★列の 中で そろわなく なる）',
         '#sheet .cell:nth-child(3)::after{ right:calc(24px + 1.5 * var(--n2)) !important; }', ng27b);
    /* ⚠️★★★ ★はじめ これを ★`#sheet{ width:auto !important }` と 書いて いました ―― ★★鳴りません。
       ★ ★★わけ：★★★㉗ 自身が あとから `#sheet{ width:Wpx !important }` を 足すので、
         ★ ★★同じ 強さ・同じ !important なら **あとの ほうが 勝ちます**。
       ★ ★★★＝ ★私の 壊し方が、★私の 見張りに 負けて いました（★★見張りは 正しく 働いて います）。
       ★ ★→ ★★強さを 1つ 上げます（`html body #sheet`）。★★★下の 線が 本当に 鳴る ことを 見せます。 */
    br27('(52)★★下の 線：表の はばを 変えさせない（★★★測れて いないのに ○ を 出す 形）',
         'html body #sheet{ width:auto !important; max-width:none !important; min-width:0 !important; }', ng27);


    /* ============================================================
       ★★★ (53)〜(58) ―― ★T235・💻コーダ（★★上の 帯・★6通り）★★★
       ------------------------------------------------------------
       ⚠️★★★ ★ここは ほかの 壊し方と **手順が ちがいます**。★理由を 書きます。
         ★ ★★いま ㉘ は **本当に 鳴って います**（★★出荷ずみの 帯が 306.89px の 画面で 32px あふれる）。
         ★ ★★★鳴って いる ものを 壊して「鳴りました」と 言っても、★何も 見せた ことに なりません
           ★ ★（★★★これが「見張って いる ふり」の 8つ目の 形 です ―― ★★私が 今日 見つけました）。
         ★ ★→ ★★★まず **なおして 黙らせて から**、★その 上に 1つずつ 壊して 鳴らします：
           ★ ★★(53) なおす → ★★★黙る（★★これ 自体が「上の 線は 生きて いる」の 証拠 です）
           ★ ★★(54)〜(58) なおした 上に 壊す → ★★鳴る

       ★★ (53) の なおし（★★`yacht.css` の 話 なので、★私は **ここでしか** 使いません）：
         ★ ★gap 8→4px ／ よこの よはく 12→8px ／ 名前 12.5→11px ／ 点の 数字 20→18px
         ★ ★★【★T235-D 実測】★いまのまま 339px から 入る → ★★このなおしで **296px** から 入る
           ★ ★（★★実在の いちばん せまい 帯 306.89px に 対して ★10.89px の あまり）。
         ★ ★★★なおしを 決めるのは 🎨アト です。★ここに あるのは「見張りが 生きて いる」を
           ★ ★見せる ための 台 であって、★★出荷する 形では ありません。 */
    var s28 = document.createElement('style');
    var HEAL28 =
      '.me-band{ gap:4px !important; padding-left:8px !important; padding-right:8px !important; }' +
      '.me-band .me-name{ font-size:11px !important; }' +
      '.me-band .me-pt{ font-size:18px !important; }' +
      /* ⚠️★★★ ここに 2行 足しました【★T241・💻コーダ ―― ★🎨アト T240-2 §5 の ③】
         ★ ★★T240-2 で、★せまい 画面の 帯は 左に「回数の 器 ＋ すきま 1つ」を **あけて** います
           ★ ★（★★それで 左右の 半分が 同じ はばに なり、★★★線が 表の 分かれ目に そろいます）。
         ★ ★★この なおしの 台は「★★帯が 296px から あふれない 形」を 見せる ため の もの で、
           ★ ★★★出荷する 形では ありません。★あけた 場所を 残した ままだと 296px に 入らず、
             ★ ★★(53) が **黙りません**（★★★実測：★私の 手もとで 13画面 とも 鳴りっぱなし でした）。
         ★ ★→ ★★この 台の 中だけ、★あけ場所を 外します（★★出荷の CSS は 1バイトも 触って いません）。 */
      '.me-band .me-turn{ min-width:0 !important; }' +
      '.me-band .me-pt:not(.bot){ margin-right:0 !important; }';
    function put28(css) { s28.textContent = css; if (!s28.parentNode) document.head.appendChild(s28); }
    function off28()    { if (s28.parentNode) s28.parentNode.removeChild(s28); }
    function ng28()     { return check28().why.length > 0; }

    /* ★ (53) だけは「★★黙る ことを 見せる」形（★ほかは「鳴る ことを 見せる」）*/
    killN++;
    (function () {
      var quiet = false;
      try { put28(HEAL28); quiet = !ng28(); } catch (e) { quiet = false; }
      try { off28(); } catch (e) {}
      kill.push('(53)★★★なおしを 入れる（★gap4／よはく8／名前11／点18）… ' +
        (quiet ? '○ ★★黙った（★★★上の 線が 生きて いる 証拠）' : '★★黙らない'));
      if (quiet) killOk++;
    })();

    /* ★ (57)〜(59) ―― ★なおした 上に 1つずつ 壊す（★★どれも 鳴る はず）*/
    function br28(name, css) {
      killN++;
      if (one(name, ng28, function () { put28(HEAL28 + css); }, off28)) killOk++;
    }

    /* ⚠️★★★★ T238 ―― ★★(54)(55)(56) を **書きかえました**（★★★🎨アトの 貼り紙・T236-2 §7-2）★★★★
       ------------------------------------------------------------
       ★ ★★★何が 起きて いたか【★アト 実測 ―― ★私も 自分の 手で 数え直しました（T238）】：
         ★ ★★★**60 / 63 通り**。★鳴らなく なった 3つが、★ちょうど 下の 3つ でした。
       ★ ★★もとの (54)(55)(56) は、★★★どれも「★私の 案B（HEAL28）を 壊す」形 でした ――
         ★ ★★ところが 🎨アトが 出した なおしは **案B では ありません**（★はばからの 天井 ＝ cqw）。
         ★ ★★★案B は もう 使われて いない ので、★外しても 何も 起きません。★★当たり前 です。
         ★ ★★**見張りが 鈍く なったのでは ありません** ―― ★★★壊す 相手が いなく なった のです。
       ★ ★→ ★★★いま 効いて いる なおし（`yacht.css` 末尾の cqw）を 壊す 形に 書きかえます。
         ★ ★★だから この 3つは HEAL28 を **重ねません**（★`br28n` ＝ なおしを 敷かない）。
       ⚠️★ ★★`html body` を 付けて いるのは、★★★(52)(58) で 私が 見つけた わな を 避ける ため：
          ★ ★★㉘ 自身が あとから `#meBand{width:… !important}` を 足すので、
            ★ ★★★同じ 強さなら **あとの ほうが 勝ちます**。
       ★ ★★3つとも、★★★私の 手で 当てて 鳴る ことを 数えて あります（★T238-C）。 */
    function br28n(name, css) {
      killN++;
      if (one(name, ng28, function () { put28(css); }, off28)) killOk++;
    }

    /* ★★★ (54) ―― ★★入れものを やめる（★`container-type` を 外す）
       ★ ★★★はばが 見えなく なる ＝ `cqw` が 効かなく なり、★字が もとの 大きさに 戻ります。
       ★ ★★「見た目を 作りものに する」壊し方では ありません ―― ★★★T237 の なおしの **土台** です。 */
    br28n('(54)★★★入れものを やめる（★container-type を 外す ―― ★★はばが 見えなく なる）',
          'html body .me-band{ container-type:normal !important; }');

    /* ★★ (55) ―― ★はばの 天井を 外す（★★字を T236 より 前の 大きさに 戻す）
       ★ ★★「点」（`::after`）も 忘れずに 戻します ―― ★★★ここが いちばん 見落とされる 字 です。 */
    br28n('(55)★★はばの 天井を 外す（★字を もとの 大きさに 戻す ―― ★「点」も 入れて 4つ）',
          'html body .me-band .me-name{ font-size:12.5px !important; }' +
          'html body .me-band .me-pt{ font-size:20px !important; }' +
          'html body .me-band .me-pt::after{ font-size:11px !important; }' +
          'html body .me-band .me-turn{ font-size:12px !important; }');

    /* ★★ (56) ―― ★★わり算の もとを ゆるめる（★330 → 430 ＝ 字が 大きく なる）
       ★ ★★★床（`max(10.5px, …)`）は 残した まま です ―― ★★ゆるめたのは **上**だけ。
       ★ ★★★＝「ゆるめる ときこそ 下の 線が 要る」の、★逆から の たしかめ に なって います。 */
    br28n('(56)★★わり算の もとを ゆるめる（★330 → 430 ＝ ★字が 大きく なる）',
          'html body .me-band .me-name{ font-size:max(10.5px, min(12.5px, 4.9cqw)) !important; }' +
          'html body .me-band .me-pt{ font-size:max(10.5px, min(20px, 7.9cqw)) !important; }' +
          'html body .me-band .me-pt::after{ font-size:max(10.5px, min(11px, 4.3cqw)) !important; }' +
          'html body .me-band .me-turn{ font-size:max(10.5px, min(12px, 4.7cqw)) !important; }');

    /* ⚠️★★★ ★ここで 1度 しくじりました【★T235・私の 失敗①・★残します】
       ★ ★はじめ (54) を「★名前を 12.5px に 戻す」に して いました ―― ★★**鳴りません でした**。
       ★ ★★わけ：★なおし（HEAL28）は 296px から 入ります。★見本の いちばん せまい はばは 306px。
         ★ ★★★あまりが **10px** ある ので、★名前を 戻して 足される 9.87px では **こえません**。
       ★ ★★★＝ ★見張りが 鈍いのでは なく、★★★私の 壊し方が 1つぶん 弱かった。
         ★ ★（★会社の 決まり：「★★見張りを 疑う 前に、自分の 壊し方を 疑う」―― ★その とおりでした）
       ★ ★→ ★★10px を こえる ものだけを 壊し方に します。
       ★ ★★★T238 で もう 1度 同じ ことが 起きました ―― ★今度は「壊す 相手が いなかった」形 です。 */
    br28('(57)★★「点」の 字を のばす（★★★Range では 見えない ―― ★器の 外に 出る 字を 数えて いる 証拠）',
         '.me-band .me-pt::after{ content:"点点点点" !important; }');
    /* ⚠️★★ ★★★㉗ の (52) と 同じ わな：★★㉘ 自身が あとから `#meBand{width:Wpx !important}` を
       ★ ★足すので、★同じ 強さ・同じ !important なら **あとの ほうが 勝ちます**。
       ★ ★→ ★★強さを 1つ 上げます（`html body #meBand`）。 */
    br28('(58)★★下の 線：帯の はばを 変えさせない（★★★測れて いないのに ○ を 出す 形）',
         'html body #meBand{ width:auto !important; max-width:none !important; min-width:0 !important; }');

    /* ★★ (58) ―― ★★★中身が 5個 そろって いない 形（★CSS では 作れません）
       ★ ★★「◯回目 / 12回」を **抜いて**、★見張りが それに 気づくかを 見ます（★もちろん 戻します）。
       ★ ★★抜かれた ものは `getElementById` から 消える ので、★★「中の 器が そろって いない」で 鳴ります。 */
    killN++;
    (function () {
      var band = document.getElementById('meBand');
      var moved = null;
      if (one('(59)★★下の 線：「◯回目 / 12回」を 抜く（★★★中の 器が そろって いない）', ng28, function () {
        put28(HEAL28);
        moved = band.lastElementChild;          /* ★「◯回目 / 12回」―― ★さいごの 子 */
        band.removeChild(moved);
      }, function () {
        try { if (moved && !moved.parentNode) band.appendChild(moved); } catch (e) {}
        off28();
      })) killOk++;
    })();


    /* ============================================================
       ★★★ (60)〜(66) ―― ★T236-2・🎨アト（★★㉙-2 が 本当に 鳴るか・★7通り）★★★
       ------------------------------------------------------------
       ★ ★★アトの 書いた 7通りを そのまま 貼りました（★アトの 紙の 中の 一覧・7つ）。
       ★ ★★会社の 決まり：「★★★見張りを 疑う 前に、自分の 壊し方を 疑う」――
         ★ ★★だから 7つとも **10px を こえる 大きさ**に して あります（★私の T235 §5-1）。
       ★ ★★★いちばん 大事なのは **(62)「床だけ 外す」** です：
         ★ ★★㉘ は **黙り**、★★★㉙ だけが 鳴ります ＝「切れて いない」と「読める」は 別の 話。
       ============================================================ */
    var s29 = document.createElement('style');
    s29.setAttribute('data-w29', '1');
    function put29(css) { s29.textContent = css; if (!s29.parentNode) document.head.appendChild(s29); }
    function off29() { if (s29.parentNode) s29.parentNode.removeChild(s29); }
    function ng29() { return check29().why.length > 0; }
    function br29(name, css) {
      killN++;
      if (one(name, ng29, function () { put29(css); }, off29)) killOk++;
    }

    br29('(60)★はばの 天井を 外す（★T237 の 直しを 入れる 前の 姿）',
         'html body .me-band .me-name{ font-size:12.5px !important; }' +
         'html body .me-band .me-pt{ font-size:20px !important; }' +
         'html body .me-band .me-turn{ font-size:12px !important; }');
    br29('(61)★入れものを やめる（★container-type を 外す ―― ★はばが 見えなく なる）',
         'html body .me-band{ container-type:normal !important; }');
    /* ⚠️★★★ (62) が この かたまりの 芯 です ―― ★★★㉘ は 黙り、★㉙ だけが 鳴ります。
       ★ ★★アトの 実測【T237-M】：★あふれ **0**／★「点」**9.667px**。
       ★ ★★★＝ ★字を 小さく すれば 切れは 消えます。★★でも 読めなく なります。
         ★ ★★「切れて いない」だけを 見て いた ら、★★★この 病気は 一生 見つかりません。 */
    /* ⚠️★★★ (62)(63) の 数を 下げました【★T241・💻コーダ ―― ★🎨アト T240-2 §5 の ④⑤】
       ★ ★★床が 10.5 → 8px に 下がった ので、★★★前の 壊し方では **もう 床を 割りません**：
         ★ ★★(62) `3.3333cqw` … ★はば 306px の 帯で **9.4px** ―― ★10.5px は 割るが 8px は 割らない
         ★ ★★(63) `8px`        … ★★8px は もう **床 そのもの**（★`< 8` なので 鳴らない）
       ★ ★★★ねらいは 1文字も 変えて いません ―― ★どちらも「★★切れは しない。★でも 読めなく なる」。 */
    br29('(62)★★★床だけ 外す（★★切れは しない ―― ★★★㉘ は 黙り、㉙ だけが 鳴る）',
         'html body .me-band .me-pt::after{ font-size:min(11px, 2.4cqw) !important; }');
    br29('(63)★回数の 字を 床の 下（7px）に 落とす',
         'html body .me-band .me-turn{ font-size:7px !important; }');
    /* ⚠️★★★★ ★ここで また 同じ わなに 落ちました【★T238・私の 失敗①・★残します】★★★★
       ★ ★アトの 貼り紙の まま `html body #meBand{width:auto !important}` と 書いたら ―― ★★鳴りません。
       ★ ★★わけ：★★★㉙ 自身が **あとから** `html body #meBand{width:Wpx !important}` を 足します。
         ★ ★★同じ 強さ・同じ !important なら **あとの ほうが 勝つ**。
       ★ ★★★＝ ★★私の 壊し方が、★私の 見張りに 負けて いました（★見張りは 正しく 働いて います）。
       ★ ★★これで **3度目** です（★(52)・★(58)・★ここ）。★★アトの ㉘ は `html body` で 足りましたが、
         ★ ★★★㉙ は はじめから `html body` で 書いて ある ので、★もう 1つ 上が 要ります。
       ★ ★→ ★★id を **2回** 書いて 強さを 上げます（`#meBand#meBand`）。★★★下の 線が 本当に 鳴ります。
       ★ ★★会社の 決まり：「★★見張りを 疑う 前に、自分の 壊し方を 疑う」―― ★3度とも その とおりでした。 */
    br29('(64)★★下の 線：帯の はばを 変えさせない（★★★測れて いないのに ○ を 出す 形）',
         'html body #meBand#meBand{ width:auto !important; max-width:none !important; min-width:0 !important; }');
    br29('(66)★★下の 線：帯を 画面から 消す（★★遊びが 始まって いない ときの 姿）',
         'html body .me-band{ display:none !important; }');

    /* ★★ (65) ―― ★★★中身を 4個に する（★CSS では 作れません。★もちろん 戻します）*/
    killN++;
    (function () {
      var band = document.getElementById('meBand');
      var moved = null, next = null;
      if (one('(65)★★下の 線：帯の 中身を 4個に する（★★★5個でも 6個でも ない）', ng29, function () {
        moved = document.getElementById('meTurn');
        next = moved.nextSibling;
        band.removeChild(moved);
      }, function () {
        try { if (moved && !moved.parentNode) band.insertBefore(moved, next); } catch (e) {}
      })) killOk++;
    })();


    /* ============================================================
       ★★★ (67) ―― ★T238・💻コーダ（★★㉚ が 本当に 鳴るか・★3通り）★★★
       ------------------------------------------------------------
       ★ ★★★これが 🎨アトの 言って いた「★CSS では 作れない 1つ」です：
         ★ ★「★左の 回数だけ 古い 字の まま に する」。
       ★ ★★JS が `#meTurnL` を **見つけられなく する** ことで 作ります
         ★ ★（★★id を 1文字 変える ＝ ★★★器を 足した のに JS を 直さなかった 日 そのもの）。
       ============================================================ */
    killN++;
    (function () {
      var el = document.getElementById('meTurnL');
      var keepTxt = el ? el.textContent : null;
      if (one('(67)★★★JS から 左の 回数を 見えなく する（★★器だけ 足して 字を 入れなかった 日）',
        function () { return check30().why.length > 0; },
        function () {
          if (!el) return;
          el.id = 'meTurnL__wazato';   /* ★ JS も ㉚ も 見つけられなく なる */
          el.textContent = '1回目 / 12回';
        },
        function () {
          try { if (el) { el.id = 'meTurnL'; el.textContent = keepTxt; P.render(); } } catch (e) {}
        })) killOk++;
    })();

    /* ★★ (68) ―― ★★★左の 字を ずらして、`render()` が 戻す ことを 見せる
       ★ ★（★★上の (67) の 対。★★★こちらは「なおって いる」の 証拠 ―― ★★黙る はず です）*/
    killN++;
    (function () {
      var el = document.getElementById('meTurnL'), quiet = false;
      try {
        if (el) {
          el.textContent = '★ずれた 字★';
          P.render();
          quiet = (el.textContent === document.getElementById('meTurn').textContent);
        }
      } catch (e) { quiet = false; }
      try { P.render(); } catch (e) {}
      kill.push('(68)★★★左の 字を ずらして `render()` を 呼ぶ … ' +
        (quiet ? '○ ★★右と 同じ 字に 戻った（★★★JS が 左右 とも 書いて いる 証拠）' : '★★戻らない'));
      if (quiet) killOk++;
    })();

    /* ★★ (69) ―― ★★★下の 線：`#meTurnL` を まるごと 抜く（★★㉘ も ㉚ も 鳴る はず）*/
    killN++;
    (function () {
      var band = document.getElementById('meBand');
      var moved = null, next = null;
      if (one('(69)★★下の 線：左の 回数の 器を まるごと 抜く（★★★中身が 5個に なる）',
        function () { return check28().why.length > 0 && check30().why.length > 0; },
        function () {
          moved = document.getElementById('meTurnL');
          if (moved) { next = moved.nextSibling; band.removeChild(moved); }
        },
        function () {
          try { if (moved && !moved.parentNode) { band.insertBefore(moved, next); P.render(); } } catch (e) {}
        })) killOk++;
    })();

/* ============================================================================
   ★★★ わざと 壊す ―― ★(70)〜(80)（★★(67)〜(69) の すぐ 下に 貼って ください）
   ----------------------------------------------------------------------------
   ★ ★★会社の 決まり：「★★★見張りを 疑う 前に、★自分の 壊し方を 疑う」。
     ★ ★★★11通り とも **0.05px の ゆるしを 大きく こえる** 壊し方に して あります。
   ⚠️★ ★★★(74)(75) は 私が T240 で 実際に 落ちた わなの 形 です：
      ★ ★★㉛ 自身が あとから `html body #paneA{width:Wpx !important}` を 足すので、
        ★ ★★★同じ 強さでは **あとの ほうが 勝ちます**。★→ ★id を 2回 書いて 強さを 上げます。
   ★ ★★★(77)〜(80) は T240-2 で 足した 4通り（★★せまい 画面の 直しを 1つずつ 外す 形）。
   ============================================================================ */

    var s31 = document.createElement('style');
    s31.setAttribute('data-w31', '1');
    function put31(css) { s31.textContent = css; if (!s31.parentNode) document.head.appendChild(s31); }
    function off31() { if (s31.parentNode) s31.parentNode.removeChild(s31); }
    function ng31() { return check31().why.length > 0; }
    function br31(name, css) {
      killN++;
      if (one(name, ng31, function () { put31(css); }, off31)) killOk++;
    }

    /* ⚠️★★★ (70) が この かたまりの 芯 です ―― ★★T240 の 直しを 1行だけ 外す 形。
       ★ ★★実測【T240-D】：★★★ずれ −3.641px（★★社長が 目で 見つけた 量 そのもの）。 */
    br31('(70)★★★名前の はばを そろえるのを やめる（★★T240 の 直しを 入れる 前の 姿）',
         'html body .me-band .me-name{ min-width:0 !important; }');
    br31('(71)★★点の 器が のこりを 取らない（★★★点の けたで 線が 動く 姿・実測 22.797px）',
         'html body .me-band .me-pt{ flex:0 0 auto !important; }' +
         'html body .me-band .me-turn{ flex:1 1 auto !important; }');
    /* ⚠️★★★ ここで 私は T240 で 1度 こけました【★残します】★★★
       ★ ★はじめ こう 書きました：`.me-band .me-name{ min-width:5em !important }`
       ★ ★★→ ★★★**鳴りません でした**。★わけ：★★2つ とも 5em に なる ので、
         ★ ★★左右の 半分は やっぱり **同じ はば** ―― ★線は まん中の まま でした。
       ★ ★★★＝ ★私の 壊し方が、★★何も 壊して いません でした（★見張りは 正しい）。 */
    br31('(72)★★★ロボットの 名前だけ 広げる（★★片がわ だけ ―― ★線が 左へ ずれる）',
         'html body .me-band .me-name.bot{ min-width:6em !important; }');
    br31('(73)★★★表の 列を 1fr 1fr では なく する（★★表の 分かれ目が 動く）',
         'html body #sheet{ grid-template-columns:1fr 1.2fr !important; }');
    br31('(74)★★表に 左だけ よはくを 足す（★★★表の 分かれ目が 帯の まん中から ずれる）',
         'html body #sheet#sheet{ padding-left:20px !important; }');
    br31('(75)★★下の 線：盤の はばを 変えさせない（★★★測れて いないのに ○ を 出す 形）',
         'html body #paneA#paneA{ width:auto !important; max-width:none !important; min-width:0 !important; }');
    br31('(76)★★下の 線：帯を 画面から 消す（★★遊びが 始まって いない ときの 姿）',
         'html body .me-band{ display:none !important; }');
    /* ★★★ ここから T240-2（★せまい 画面の 直し）★★★ */
    br31('(77)★★★左の あけ場所を 消す（★★T240-2 を 入れる 前の 姿 ―― ★せまい 画面で 線が 左へ）',
         'html body .me-band .me-pt:not(.bot){ margin-right:0 !important; }');
    br31('(78)★★★回数の 器の 決めを 外す（★★★回数が 1回目／12回目 で 線が 動く 姿）',
         'html body .me-band .me-turn{ min-width:0 !important; }');
    br31('(79)★★★回数の 器を 小さくする（★★書体が 太くて 器から あふれた 日 と 同じ 姿）',
         'html body .me-band .me-turn{ min-width:1em !important; }');
    br31('(80)★★★字の 床（8px）を 割る（★★「点」だけ ―― ★はばは 1pxも 動きません）',
         'html body .me-band .me-pt::after{ font-size:7px !important; }');

    /* ★★★★ ここから T243 ―― ★★㉜（★帯の 名前 ＝ 手番の 主）を わざと 壊す (81)〜(87) ★★★★
       ★ ★★(81) だけは **直しそのものを 外す**（★`BAND_NAME.follow = 0` ＝ 社長の 写真の 姿）。
       ★ ★★(82)(83) は 名前を すり替える、★(84) は **267ms 遅らせる**（★T228 の 穴の 形）、
       ★ ★★(85)(86) は 色だけ 食いちがわせる（★🎨アトの 金色を 守る 線）、★(87) は 名前を 消す。 */
    function ng32() { return check32().why.length > 0; }
    function br32(name, doIt, undoIt) {
      killN++;
      if (one(name, ng32, doIt, undoIt)) killOk++;
    }
    var kFollow = P.BAND_NAME.follow;
    br32('(81)★★★直しそのものを 外す（★BAND_NAME.follow=0 ＝ ★★人の 手番でも「ロボット」―― ★社長の 写真の 姿）',
         function () { P.BAND_NAME.follow = 0; }, function () { P.BAND_NAME.follow = kFollow; });
    var kSeat0 = P.SEATS[0], kSeat1 = P.SEATS[1];
    br32('(82)★★★人の 席の 名前を「ロボット」に する（★★人の 手番の 帯に「ロボット」）',
         function () { P.SEATS[0] = 'ロボット'; }, function () { P.SEATS[0] = kSeat0; });
    br32('(83)★★★ロボットの 席の 名前を「あなた」に する（★★ロボットの 手番の 帯に「あなた」―― ★逆）',
         function () { P.SEATS[1] = 'あなた'; }, function () { P.SEATS[1] = kSeat1; });
    /* ★★ (84) ―― ★★名前の 書きかえ だけを 267ms 遅らせる（★★★色は その こまに 変わる・字は 1こま 遅れる）
       ★ ★★この 帯の 字 1つ だけ、`textContent` の 書き手を 遅らせる 形に すり替えます（★中身は 触りません）。
       ★ ★★遅らせる 267ms は、★T228 で 🧪トライが 実測した「指図が 残った 時間」と 同じ 数 です。 */
    var nm84 = document.querySelector('#botBand .bot-cell .bot-name');
    var desc84 = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent');
    br32('(84)★★★名前の 切りかえを 267ms 遅らせる（★★色は 変わった のに 字が 前の まま ―― ★T228 の 穴の 形）',
         function () {
           if (!nm84 || !desc84) throw new Error('帯なし');
           Object.defineProperty(nm84, 'textContent', {
             configurable: true,
             get: function () { return desc84.get.call(this); },
             set: function (v) { var self = this; root.setTimeout(function () { desc84.set.call(self, v); }, 267); }
           });
         },
         function () { if (nm84) delete nm84.textContent; });
    var st85 = document.createElement('style');
    br32('(85)★★★ロボットの 手番の 金色を 外す（★★「ロボット」なのに 金色なし ―― ★色と 名前の 食いちがい）',
         function () { st85.textContent = 'html body .bot-cell.is-turn{ box-shadow:none !important; }'; document.head.appendChild(st85); },
         function () { if (st85.parentNode) st85.parentNode.removeChild(st85); });
    var st86 = document.createElement('style');
    br32('(86)★★★人の 手番にも 金色を つける（★★「あなた」なのに 金色 ―― ★色と 名前の 食いちがい）',
         function () { st86.textContent = 'html body .bot-cell:not(.is-turn){ box-shadow:inset 0 0 0 2px #F1A426 !important; }'; document.head.appendChild(st86); },
         function () { if (st86.parentNode) st86.parentNode.removeChild(st86); });
    var st87 = document.createElement('style');
    br32('(87)★★帯の 名前を 消す（★★★下の 線 ―― ★名前が 見えない）',
         function () { st87.textContent = 'html body .bot-cell .bot-name{ display:none !important; }'; document.head.appendChild(st87); },
         function () { if (st87.parentNode) st87.parentNode.removeChild(st87); });

    if (killOk !== killN) {
      ng.push('★★★★見張りが 死んで います：★わざと 壊しても ' + (killN - killOk) + ' / ' + killN + ' 通りが 鳴りません');
    }
    note['⑧ ★★わざと 壊して 鳴らす'] = killOk + ' / ' + killN + ' 通り 鳴りました　★' + kill.join('　★');

    /* ★ 後片づけ（★⑥：数え おわって から。★⑤：さわった ものは 戻す）*/
    P.layout(); P.render();

    var out = {
      '★NG': ng.length,
      '中身': ng.length ? ng : 'ぜんぶ OK ✅',
      '画面': window.innerWidth + '×' + window.innerHeight,
      'かかった 時間': (Date.now() - t0) + 'ms'
    };
    for (var kk in note) if (note.hasOwnProperty(kk)) out[kk] = note[kk];
    console.log('[ヨット] verify', out);
    return out;
  }

  Y.verify = wrap(verify);
  Y._verifyReady = true;

})(typeof globalThis !== 'undefined' ? globalThis : this);
