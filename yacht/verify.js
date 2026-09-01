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
  function pump(limit) {
    var n = 0, box = clocks.length ? clocks[clocks.length - 1] : null;
    if (!box) return 0;
    while (box.q.length && n++ < (limit || 4000)) {
      var b = 0;
      for (var i = 1; i < box.q.length; i++) {
        if (box.q[i].t < box.q[b].t || (box.q[i].t === box.q[b].t && box.q[i].s < box.q[b].s)) b = i;
      }
      var job = box.q.splice(b, 1)[0];
      box.now = job.t;
      try { job.f(); } catch (e) { vErr.push(String(e && e.message || e)); }
    }
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
                autoRoll: 0, autoStop: 0, err: [] };
    try {
      Y.seed(seed);
      P.startGame();
      pump(200);
      var guard = 0;
      while (guard++ < 300) {
        var st = P.state();
        if (st.over) break;
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
    api.add(function () {
      try {
        if (Y._g() && kSheet) { P.setSheet(kSheet); P.setDice(kState.dice || [1, 1, 1, 1, 1], kState.rolls || 1); P.setTurn(kState.turn, kState.cur); }
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
    if (t3.badTurn) ng.push('★★★13手番で 終わって いません（' + t3.badTurn + ' / ' + t3.games + '試合）');
    if (t3.badFill) ng.push('★★★13マスが 埋まって いません（' + t3.badFill + ' / ' + t3.games + '試合）＝ 同じ 役に 2回 書けて いる か、書き のこし');
    if (t3.badTotal) ng.push('★★★点の 合計が 合いません（' + t3.badTotal + '件）' + (t3.err.length ? '：' + t3.err[0] : ''));
    if (t3.overRoll) ng.push('★★★★ふり直しが ' + C.REROLL + '回を こえて います（★ふった 回数 ' + t3.maxRoll + '回・★1回目 ＋ ふり直し ' + C.REROLL + '回 ＝ ' + (C.REROLL + 1) + '回 が 上限）');
    note['③ ★13手番・点の 合計'] = t3.games + '試合 ／ 手番ちがい ' + t3.badTurn + '・マスちがい ' + t3.badFill +
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
      P.setDice([1, 2, 3, 4, 5], 1);
      for (var q = 0; q <= C.REROLL + 1; q++) {
        var btn = P.el.roll();
        t43.seen.push(btn.classList.contains('hidden') ? '（消えた）' : btn.textContent);
        realTap(btn);
      }
    })();
    (function () {
      var want = [], q;
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
        out.n++;
        got = P.hitAt(q.left + q.width / 2, q.top + q.height / 2);
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
      var banned = ['スリーカード', 'フォーカード', 'フルハウス', 'ストレート', 'ダイス', 'スコア',
                    'ボーナス', 'ターン', 'リロール', 'チャンス', 'カード', 'ヨットゲーム', 'キープ', 'プレイヤー'];
      /* ★ 「ボーナス」は ハッピーの ひとことに 出ます ―― ★★§9.6 の 例外に 入って いません。
         ★ ★★だから ここで 鳴らして、★私が 気づける ように して あります。 */
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
