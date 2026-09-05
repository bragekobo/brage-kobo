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

    /* ★ もとの じょうたいを ぜんぶ おぼえる（★⑤ 見張りは 見るだけ）*/
    var kSheet = null, kState = P.state();
    if (Y._g()) kSheet = kState.sheet ? kState.sheet.slice() : null;
    var kLevel = P.level();
    api.add(function () {
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
          P.setTurn(kState.turn, kState.cur);
          /* ★ ロボットの 手番の 途中だった なら、その 手番を やり直します（★止めたまま に しない）*/
          if (kState.cur !== 0 && !kState.over) P.beginTurn();
        }
        P.layout(); P.render();
      } catch (e) {}
    });
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
         ★ ★★**画素で くらべます**：★空いて いる 14マスの 見た目が
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
    note['①-3 ★ならび'] = got === want ? '○ 2列×7行の まま（14マス）' : '★★' + got;

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
       ★ ★★表の 1マスは 44px を **割ります**（★14マス 出す ため）。
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
      'px／★表の 1マス ' + t52.cell + '（★★14マス 出す ため 44pxを 割ります ―― ★鳴らさず 記録だけ）';

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
        /* ★★ T226 ―― ★★空きマス（`@blank`）は **わざと 当たらない** ように して あります
           ★ ★（★`pointer-events:none`。★★指が すべって 押しても 何も 起きない ため）。
           ★ ★★だから 「当たる」では なく **「当たらない」ことを** 数えます
             ―― ★★ここを ただ とばすと、★★★見張りが 1マス ぶん 目を つぶる ことに なります。 */
        if (P.GRID[k] === '@blank') {
          out.n++;
          if (got !== e) out.ok++; else out.bad.push('@blank（★★押せて しまいます）');
          continue;
        }
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
        /* ★ 画面の 14マス目（★「◯ / 63」）と、じぶんの 点 */
        P.setSheet(sh); P.setDice([1, 2, 3, 4, 5], 1);
        var cell = P.el.cell['@bonus'];
        var nm = cell.firstChild.textContent, pt = cell.lastChild.textContent;
        var shownPt = parseInt($('mePt').textContent || '0', 10);
        t12b.rows.push(cases[k].u + '→「' + nm + '」「' + pt + '」点 ' + shownPt);
        if (nm !== cases[k].u + ' / ' + C.BONUS_NEED) t12b.why.push('14マス目の 字が 「' + nm + '」（★「' + cases[k].u + ' / ' + C.BONUS_NEED + '」 が 正）');
        if (pt !== (cases[k].want ? '+' + C.BONUS_PT : '')) t12b.why.push('1〜6の 合計 ' + cases[k].u + ' で 14マス目の 点が 「' + pt + '」');
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
    var ORDERS19 = ['サイコロを ふろう！', 'どれかの 役に 書こう！'];   /* ★ 人への 指図（★決め打ちの 見本）*/
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
    killN++;
    var kOrders19 = ORDERS19.slice();
    if (one('⑲見本の ことばを 書きかえる（★★下の 線・T227・💻コーダ）', function () {
      return check19().why.length > 0;
    }, function () {
      ORDERS19[0] = 'ぜんぜん ちがう ことば';
    }, function () {
      ORDERS19[0] = kOrders19[0]; ORDERS19[1] = kOrders19[1];
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
