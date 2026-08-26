/* ============================================================
   五目並べ（15本目）― 画面（UI）／ T134・コーダ
   ------------------------------------------------------------
   仕様は logs/T133_五目並べ_仕様_ルル.md ＋ 社長の裁定4つ が 正。

   ★★ 社長の裁定（4つ・厳守）★★
     判断1 ★★ 指を 置いた 所より **12mm 上**に ねらい（白い 輪）が 出る。
              ★ すべらせて 直せる。★はなした 所に 置かれる。★マウスは ずらさない
     判断2 ★ 盤は **15路 × 15路**（320pxで 1目 20px）
     判断3 ★ **最後の 1手に 赤い丸**（★1つだけ・手の 番号は 付けない）
     判断4 ★ 初期値は **2段「ふつう」**

   ★★ この ファイルは「画面」だけ ★★
     ルール・ロボット・寸法の 計算は ぜんぶ gomoku-core.js に あります
     （＝ 勝率を 数える 側と 遊ぶ 側の ロボットが 同じ 1本の コード・ルル §9-4）。
     ★ 盤の 大きさは index.html の 1行（GOMOKU_LINES）だけ。

   ★★★ この 1本で いちばん 新しい ところ ＝ 12mm ずらし（判断1）★★★
     ------------------------------------------------------------
     ★ 320px・15路の 1目は **20px**（★44pxの 45%）。★15本で いちばん 小さい。
     ★ 1回 おす 形なら 68.0% が ちがう 交点に 置かれます【ルル §3-1 の 計算】。
     ★ 四目並べの「浮かせて すべらせる」だけでは 足りません ――
       ★★ 四目並べは 浮いた コマが **盤の 外**に 出るから 見えた。
       ★★ 五目並べは **指の 真下**。★指の 下に 交点が およそ 35個 入ります【見立て】。
       ★ ＝「はなす 前に 直せる」が 動かない。★直す ための 目が ない。
     ★ だから ―― ★★ねらいを 指の **12mm 上**に ずらします（★15本で 初めて）。
       ① 盤に 指を 置く → ② 12mm 上の 交点に 白い 輪（★指の 外なので 見える）
       → ③ すべらせる と 輪も ついてくる（ずれ幅は ずっと 12mm）
       → ④ 指を はなす → その 交点に 石が 置かれる
     ★ マウスは ずらしません（★やじるしは 何も 隠さない・T131 と 同じ 分け方）。
     ★ 横向きは ずらしません（★盤が たて いっぱいで、下に 12mmの 受け皿が 取れない・ルル §3-5）。
     ⚠️ 12mm の 数字は gomoku-core.js の DIM.AIM_LIFT_MM ただ 1つ です。
        ★ トライが 実物の 指で 8mm でも 16mm でも 直せます。

   ⚠️ 外部の ライブラリ・フォント・画像は 0。外への 通信も 0。
   ============================================================ */
(function (root) {
  'use strict';

  var C = root.GOMOKU_CORE;
  if (!C) { console.error('[五目並べ] gomoku-core.js が 読めていません'); return; }

  /* ★★★ 盤の 大きさは index.html の 1行 だけ ★★★ */
  var LINES = root.GOMOKU_LINES | 0;

  var G = C.makeCore(LINES);
  var robot = C.makeRobot(G);
  var humans = C.makeHumans(G);   // ★ 勝率を 数える ときだけ 使う（遊ぶ 画面では 1度も 呼ばない）

  var ME = 1, BOT = 2;            // ★ 人が 先手（黒）。固定（ルル §4-5）

  /* ============================================================
     ★ 数字（TUNE）― 調整する 数字は ここ 1か所だけ
     ============================================================ */
  var TUNE = {
    /* ★ ロボットの 番の 長さ（★手加減では ない ―― 人が 盤を 読む ぶん）。
       ★ 考える 時間が 短くても 長くても、★手番の 長さは いつも これに そろえます。 */
    BOT_TURN: 600,
    /* ★ 考えはじめるまでの 間（★人の 石が 置かれる 動き 150ms を 見せてから 考える）*/
    BOT_LEAD: 120,

    /* ★★★ 安全弁（ルル §6-5・★必須）★★★
       ★ 1手に これ以上 かかりそうなら、★そこまでに 読み終えた いちばん 深い 読みで 打つ。
       ⚠️ 私の パソコンでの【実測】：弱い 0.03ms／ふつう 0.27／強い 0.82／
          とても 強い 11.65（最悪 38.5）／★最強 29.61ms（最悪 86.0ms）。
          ★ スマホは 3〜5倍 おそいと 見て 最悪 258〜430ms ―― ★この 450ms の 中。
       ★ BOT_LEAD 120 ＋ 450 ＝ 570ms ＜ BOT_TURN 600ms なので、
         ★★手番の 長さは どんな 端末でも 0.6秒の まま です。 */
    BOT_BUDGET: 450,

    /* ★ 石が 置かれる 動き（ルル §7-2）*/
    PUT_MS: 150,
    /* ★ 勝ったときの 5つ（ルル §7-2）：1つ 120ms ずつ → 0.6秒 たって 結果の 箱 */
    WIN_STEP: 120, WIN_HOLD: 600,

    RESULT_LOCK: 600    // 結果の 箱の 連打よけ（T62・T63 の 事故）
  };

  /* ============================================================
     ★ 画面に 出す 言葉 ―― ★ここ 1か所だけ（設計図 §9.6・ルル §8-1）
     ------------------------------------------------------------
     ★★ ハッピーは 遊んでいる 最中、1文字も しゃべりません（ルル §7-7）。
        ★ 相手の 三・四のとき「あぶない！」も 言いません（★§5-4 違反・遊びを 20ポイント 取り上げる）。
        ★ 自分が 三を 作ったとき「あと 2つ！」も 言いません。
        ★★「三を 作って 四に しよう」は、★この ゲームで 最悪の 一言 です（★遊びの 中身 そのもの）。
     ★ 手数・%・秒 の 数字も 1つも 出しません。
     ★★「並べ」は 漢字（★「並」は 小6・設計図 §9.6）。
     ============================================================ */
  var SAY = {
    title: 'たて よこ ななめ、5つ 並べよう！',
    win:   'やったー！　5つ 並んだね！',
    lose:  'おしい！　もう1回 やろ？',
    draw:  '引き分け！　いい しょうぶ だったね'
  };
  var RESULT_TITLE = { win: '勝ち！', lose: '負け…', draw: '引き分け' };

  /* ============================================================
     ★ 画面の 部品
     ============================================================ */
  var $ = function (id) { return document.getElementById(id); };
  var titleScreen, playScreen, stageEl, holdEl, nextRow, nextStone, frameEl, boardEl,
      gridEl, starsEl, aimEl, stonesEl, lastEl, resultWrap, resultBox;

  var stoneEl = [];                 // 交点 → 石の span（無ければ null）
  var g = null;                     // 盤（gomoku-core の いれもの）
  var turn = ME, over = false, busy = true, built = false;
  var held = null;                  // ★ いま ねらっている 交点（判断1）
  /* ★ マウスの 位置（T131 と 同じ）。★マウスの ときだけ 入れる（★指では null の まま）。 */
  var hoverX = null, hoverY = null;
  var timers = [];
  var rand = C.rng(20260826);
  var geo = { cell: 20, stone: 17, aim: 18, star: 3, bar: 17, gap: 8, side: false,
              W: 0, H: 0, boardW: 0, boardH: 0, topPad: 0, slack: 0,
              lift: 0, liftWant: 0, below: 0 };
  var inRect = null;                // 盤の 実位置（交点を 決める ものさし）
  var stat = { plies: 0, botWorst: 0, botTotal: 0, botMoves: 0, cuts: 0, winLines: 0, maxRun: 0 };

  var STORE_KEY = 'bragekobo.gomoku.level';
  var state = { level: C.LEVEL_START };

  function later(fn, ms) { var id = setTimeout(fn, ms); timers.push(id); return id; }
  function clearTimers() { for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]); timers = []; }
  function say(t) { $('happyBubble').textContent = t; }
  function levelNow() { return C.LEVELS[state.level]; }

  /* ============================================================
     ★ つよさ（5段）― プルダウン 2か所
     ------------------------------------------------------------
     ★ はじめの 画面 と、★終わった あとの 画面。
       ★ 初期値が「ふつう」なので、負けた その場で 下げられる ことが
         はじめての人の 逃げ道です。
     ★ 遊んでいる 最中の 画面には 置きません（設計図 §5.5 の 線引き）。
     ★ 中身（何手 読むか）は 1つも 出しません。言葉だけ。
     ============================================================ */
  function fillLevelSelect(sel) {
    sel.innerHTML = '';
    for (var i = 0; i < C.LEVELS.length; i++) {
      var o = document.createElement('option');
      o.value = String(i);
      o.textContent = C.LEVELS[i].label;
      sel.appendChild(o);
    }
    sel.value = String(state.level);
  }
  function setLevel(i) {
    i = Math.max(0, Math.min(C.LEVELS.length - 1, i | 0));
    state.level = i;
    try { localStorage.setItem(STORE_KEY, String(i)); } catch (e) {}
    $('levelTitle').value = String(i);
    $('levelResult').value = String(i);
  }
  function loadLevel() {
    try {
      var v = localStorage.getItem(STORE_KEY);
      if (v != null && C.LEVELS[v | 0]) state.level = v | 0;
    } catch (e) {}
  }

  /* ============================================================
     ★ 寸法（ルル §1-3）― 割り算 2回
     ------------------------------------------------------------
     ★ 数字は gomoku-core.js の DIM と fitBoard() から しか 来ない。
       ここで px を 手で 書かない こと。
     ★★ そして ここが 判断1 の 土台です ――
        ★ 盤の **下**に 12mm ぶんの 受け皿を 残します（★盤は 1pxも やせません）。
        ★ 余りが 12mm の 2倍 以上 ある ときは、上下 まん中に 置きます（375px・パソコン）。
        ★ 余りが 足りない ときだけ、盤を 上に 寄せます（★320px：余り 100px → 上 26・下 74）。
     ============================================================ */
  function layout() {
    if (!built) return;
    var r = stageEl.getBoundingClientRect();
    var fs = getComputedStyle(frameEl);
    var insetX = parseFloat(fs.paddingLeft) + parseFloat(fs.paddingRight) +
                 parseFloat(fs.borderLeftWidth) + parseFloat(fs.borderRightWidth);
    var insetY = parseFloat(fs.paddingTop) + parseFloat(fs.paddingBottom) +
                 parseFloat(fs.borderTopWidth) + parseFloat(fs.borderBottomWidth);
    var W = Math.floor(r.width - insetX), H = Math.floor(r.height - insetY);

    var f = C.fitBoard(W, H, LINES);
    geo.W = W; geo.H = H;
    geo.cell = f.cell; geo.stone = f.stone; geo.aim = f.aim; geo.star = f.star;
    geo.bar = f.bar; geo.gap = f.gap; geo.side = f.side;
    geo.boardW = f.boardW; geo.boardH = f.boardH;

    var css = document.documentElement.style;
    css.setProperty('--cell',  f.cell + 'px');
    css.setProperty('--half',  (f.cell / 2) + 'px');
    css.setProperty('--span',  ((LINES - 1) * f.cell + 1) + 'px');
    css.setProperty('--stone', f.stone + 'px');
    css.setProperty('--aim',   f.aim + 'px');
    css.setProperty('--star',  f.star + 'px');
    css.setProperty('--bar',   f.bar + 'px');
    css.setProperty('--gap',   f.gap + 'px');
    css.setProperty('--lasts', Math.round(f.cell * 0.95) + 'px');
    css.setProperty('--lastw', Math.max(1.5, f.cell * 0.09) + 'px');

    holdEl.classList.toggle('is-side', f.side);
    boardEl.style.width  = f.boardW + 'px';
    boardEl.style.height = f.boardH + 'px';

    /* ★★ 盤の 下に 12mm の 受け皿を 残す（★判断1 の ため）★★ */
    stageEl.style.paddingTop = '0px';
    stageEl.style.alignItems = f.side ? 'center' : 'flex-start';
    var holdH = holdEl.getBoundingClientRect().height;
    var slack = Math.max(0, Math.round(r.height - holdH));
    geo.liftWant = f.side ? 0 : C.liftPx(window.innerWidth || document.documentElement.clientWidth);
    var topPad = f.side ? 0 : Math.max(0, Math.min(Math.floor(slack / 2), slack - geo.liftWant));
    stageEl.style.paddingTop = topPad + 'px';
    geo.topPad = topPad; geo.slack = slack;

    /* ★ 実際に 使える ずらし幅（★受け皿より 大きくは しない ―― でないと 一番下の 交点に 届かない）*/
    inRect = boardEl.getBoundingClientRect();
    var sr = stageEl.getBoundingClientRect();
    geo.below = Math.max(0, Math.round(sr.bottom - inRect.bottom));
    geo.lift = Math.min(geo.liftWant, geo.below);

    /* ★ 結果の 箱の たけの 天井 ＝ 盤の 上ふちより 上（★光った 5つに かぶらせない）*/
    css.setProperty('--result-max', Math.max(60, Math.round(inRect.top - 16)) + 'px');

    buildStars();
    for (var p = 0; p < G.N; p++) if (stoneEl[p]) placeAt(stoneEl[p], p, geo.stone);
    setAim(held);
    setLast(g ? g.last : -1);
  }

  /* ============================================================
     ★ 盤を 作る（1回だけ）
     ------------------------------------------------------------
     ★ 盤の 上に 文字は 1つも 置きません。
     ★ 交点の div も 作りません ―― 225個 作ると スマホで 重くなる。
       ★ 指の 座標から 計算で 交点を 出します（→ hitAt）。
     ============================================================ */
  function build() {
    stonesEl.innerHTML = '';
    stoneEl = new Array(G.N);
    for (var p = 0; p < G.N; p++) stoneEl[p] = null;
    built = true;
  }

  /* ★ 碁盤の 星（ルル §7-5：5つ）。★場所は core が 路数から 計算して 持っている。 */
  function buildStars() {
    if (!starsEl) return;
    starsEl.innerHTML = '';
    for (var i = 0; i < G.STARS.length; i++) {
      var el = document.createElement('span');
      el.className = 'star';
      placeAt(el, G.STARS[i], geo.star);
      starsEl.appendChild(el);
    }
  }

  /* ★ 交点 p の まん中に、大きさ size の ものを 置く
     ★ 盤ぜんたい ＝ 1目 × 路。★交点 k の まん中は k × 1目 ＋ 1目/2（ルル §1-3）。 */
  function placeAt(el, p, size) {
    var c = p % LINES, r = (p / LINES) | 0;
    el.style.left = (c * geo.cell + (geo.cell - size) / 2) + 'px';
    el.style.top  = (r * geo.cell + (geo.cell - size) / 2) + 'px';
  }
  function makeStone(p, who, fresh) {
    var el = document.createElement('span');
    el.className = 'stone ' + (who === ME ? 'me' : 'bot') + (fresh ? ' is-new' : '');
    placeAt(el, p, geo.stone);
    stonesEl.appendChild(el);
    stoneEl[p] = el;
    return el;
  }
  function paintAll() {
    stonesEl.innerHTML = '';
    for (var p = 0; p < G.N; p++) { stoneEl[p] = null; if (g.bd[p]) makeStone(p, g.bd[p], false); }
  }

  /* ============================================================
     ★★★ ねらいの 白い 輪（社長裁定 判断1）★★★
     ------------------------------------------------------------
     ⚠️★★ 判断3 を 破っていないか（★ここが いちばん 大事な ところ）★★
        ★ ここで 見ているのは ★★**指の 座標** と「その 交点が 空いているか」だけ です。
        ★ ★`winsAt` も `winPoints` も `gain` も、この 関数からは 1度も 呼びません
          （★verify ③ が ここを 文字列で 見張ります）。
        ★ ★つまり「そこに 置くと 勝てるか」は 1ビットも 出ていません。
        ★ 遊ぶ人が 考えるのは「どの 交点に 置くか」。★その 答えは 1つも 先取りしていません。

     ★ 出さない とき（＝ 輪は 0個）：
       ・ねらっている 交点が 無い（指を はなした・マウスが 盤の 外）
       ・★もう 石が ある 交点（★置けない ので 輪は 出ない ―― ルル §3-6 の 6番）
       ・ロボットの 番・石が 置かれている あいだ
       ・試合が 終わった あと（★そこからは「勝った 5つ」の 光りの 時間）
     ============================================================ */
  function setAim(p) {
    if (!aimEl) return;
    var on = (p != null) && g && !over && !busy && turn === ME && !g.bd[p];
    if (!on) { aimEl.classList.remove('is-on'); return; }
    placeAt(aimEl, p, geo.aim);
    aimEl.classList.add('is-on');
  }

  /* ============================================================
     ★★★ 最後の 1手の 赤い 輪（社長裁定 判断3）★★★
     ------------------------------------------------------------
     ★ 見ているのは「最後に 置いた 場所」という ただの 1つの 数字だけ です。
       ★ 盤を 1つも 数えていません（★verify ③・④ が 見張ります）。
     ★ 1つ だけ。★手の 番号は 付けません。★2手前の 石にも 付けません（ルル §5-3）。
     ★ 試合が 終わったら 消します（★1画面に 強調は 1種類まで・設計図 §5.5）。
     ============================================================ */
  function setLast(p) {
    if (!lastEl) return;
    if (p == null || p < 0 || over || !g || !g.bd[p]) { lastEl.classList.remove('is-on'); return; }
    var size = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--lasts')) || geo.stone;
    placeAt(lastEl, p, size);
    lastEl.classList.add('is-on');
  }

  /* ★ ねらう 交点を 1か所で 決める（★指も マウスも 必ず ここを 通る）*/
  function aimAt(p) {
    held = p;
    setAim(p);
  }

  /* ★★ マウスを 乗せただけの とき（T131 と 同じ）★★ */
  function applyHover() {
    if (press) return;
    if (hoverX == null) { aimAt(null); return; }
    if (!g || over || busy || turn !== ME) { aimAt(null); return; }
    inRect = boardEl.getBoundingClientRect();
    if (!inZone(hoverX, hoverY, 'mouse')) { aimAt(null); return; }
    aimAt(hitAt(hoverX, hoverY, 'mouse'));
  }

  /* ★ 置けない 所を さわった とき ―― 盤が ぷるっと ゆれるだけ（ルル §3-6 の 6番）
     ★ 光でも 色でも ない ので 強調は 増えない。★文字は 1つも 出さない。 */
  function shakeNo() {
    frameEl.classList.remove('is-no');
    void frameEl.offsetWidth;
    frameEl.classList.add('is-no');
  }

  /* ============================================================
     ★ 1手 置く（人も ロボットも ここを 通る）
     ============================================================ */
  function playAt(p, who) {
    busy = true;
    held = null;
    setAim(null);
    G.put(g, p, who);
    stat.plies++;
    makeStone(p, who, true);
    setLast(p);                       // ★ 赤い 輪は「置いた その 石」へ 移る
    turn = 3 - who;
    paintNext();
    later(function () { afterPut(p, who); }, TUNE.PUT_MS);
  }

  /* ★ 置いた **あと** に、はじめて 5つ 続いたかを 見る
     ⚠️ ここより 前に、5つ 並ぶかを 出す 経路は 1本も ありません（ルル §9-2 の 3番）。 */
  function afterPut(p, who) {
    if (G.winsAt(g, p, who)) { finish(who); return; }
    if (g.n >= G.N) { finish(0); return; }
    step();
  }

  /* ★ 次の 石（＝ 手番の しるし）*/
  function paintNext() {
    if (!nextStone) return;
    nextStone.classList.toggle('me',  turn === ME);
    nextStone.classList.toggle('bot', turn === BOT);
    nextStone.classList.toggle('is-off', over);
  }

  /* ============================================================
     ★ 手番を 進める
     ============================================================ */
  function step() {
    if (over) return;
    if (turn === ME) { busy = false; paintNext(); applyHover(); }
    else { busy = true; setAim(null); paintNext(); later(botMove, TUNE.BOT_LEAD); }
  }

  /* ★ ロボットの 1手
     ⚠️ 渡すのは「いまの 盤・自分の 色・段・さいころ・待てる 時間」だけ。
        ★人の 次の手も、人の 打ち方も、1つも 渡していません（ルル §6-8）。
     ★★ 安全弁：BOT_BUDGET(450ms) を 過ぎたら、そこまでに 読み終えた 深さで 打ちます。
     ★ 手番の 長さは いつも BOT_TURN(0.6秒)。★速い 端末でも 遅い 端末でも 同じ。 */
  function botMove() {
    if (over || !g) return;
    var t0 = Date.now();
    var p = robot(g, BOT, state.level, rand, TUNE.BOT_BUDGET);
    var dt = Date.now() - t0;
    stat.botTotal += dt; stat.botMoves++;
    if (dt > stat.botWorst) stat.botWorst = dt;
    if (robot.cut()) stat.cuts++;
    if (p == null || p < 0 || g.bd[p]) { finish(0); return; }
    var wait = Math.max(0, TUNE.BOT_TURN - TUNE.BOT_LEAD - dt);
    later(function () { if (!over && g) playAt(p, BOT); }, wait);
  }

  /* ============================================================
     ★ 決着
     ------------------------------------------------------------
     ★ 5つ **以上** 続いた 並びを **全部** 数えて、**全部** 光らせます（ルル §7-2）。
       ★ 6つ・7つ（長連）も 勝ち。★「5つ 見つけたら 止める」に しない こと。
       ★ 並びが 2つ 同時に できる ことも あります。
     ★ 端から 順に 1つずつ（120ms ずつ）。★同時に 光ると かたまりに 見えない。
     ★ ほかの 石は うすくする ―― ★足すのでは なく 引いて 目立たせる。
     ★★ ここで 白い 輪も 赤い 輪も 消します。★1画面に 強調は 1種類まで（設計図 §5.5）。
     ============================================================ */
  function finish(who) {
    over = true; busy = true; held = null;
    setAim(null);
    setLast(-1);
    paintNext();
    var wl = G.winLines(g);
    stat.winLines = wl.lines.length;
    stat.maxRun = 0;
    for (var q = 0; q < wl.lines.length; q++) if (wl.lines[q].length > stat.maxRun) stat.maxRun = wl.lines[q].length;

    var when = {};
    for (var k = 0; k < wl.lines.length; k++) {
      var L = wl.lines[k];
      for (var t = 0; t < L.length; t++) {
        var p = L[t];
        if (when[p] == null || t * TUNE.WIN_STEP < when[p]) when[p] = t * TUNE.WIN_STEP;
      }
    }
    var last = 0;
    for (var p2 = 0; p2 < G.N; p2++) {
      if (!stoneEl[p2]) continue;
      if (when[p2] != null) {
        (function (el, ms) { later(function () { el.classList.add('is-win'); }, ms); })(stoneEl[p2], when[p2]);
        if (when[p2] > last) last = when[p2];
      } else if (wl.lines.length) {
        stoneEl[p2].classList.add('is-dim');
      }
    }

    var kind = who === ME ? 'win' : (who === BOT ? 'lose' : 'draw');
    later(function () {
      $('resultTitle').textContent = RESULT_TITLE[kind];
      $('resultTitle').classList.toggle('is-quiet', kind !== 'win');
      say(SAY[kind]);
      if (kind === 'win') {
        var cat = $('happyCat');
        cat.classList.remove('is-jump'); void cat.offsetWidth; cat.classList.add('is-jump');
      }
      fillLevelSelect($('levelResult'));
      resultWrap.classList.remove('hidden');
      resultBox.classList.add('is-locked');
      later(function () { resultBox.classList.remove('is-locked'); }, TUNE.RESULT_LOCK);
    }, last + TUNE.WIN_HOLD);
  }

  /* ============================================================
     ★ 新しい 試合（★「配り」が 存在しない ―― はじめは からっぽ）
     ============================================================ */
  function newGame() {
    clearTimers();
    resultWrap.classList.add('hidden');
    g = G.newBoard();
    turn = ME; over = false; busy = false; held = null;
    stat = { plies: 0, botWorst: 0, botTotal: 0, botMoves: 0, cuts: 0, winLines: 0, maxRun: 0 };
    if (!built) build();
    layout();
    paintAll();
    paintNext();
    setLast(-1);
    say(SAY.title);
    step();
  }

  /* ============================================================
     ★★★ 操作 ―― 判断1 の 本体 ★★★
     ------------------------------------------------------------
     ★ 1. 盤（や その まわり）に 指を 置く → ★12mm 上の 交点に 白い 輪が 出る
     ★ 2. 指を すべらせる → 輪も ついてくる（★何度でも 直せる）
     ★ 3. 指を はなす → ★その 交点に 石が 置かれる
     ★ 指を 置いて すぐ はなせば「1回 おす」と 同じ 手数。★遅くしません。
     ⚠️ ドラッグでは ありません（設計図 追記④）。★「交点を 選び直せる」だけ。
     ⚠️ ロボットの 番・石が 置かれている あいだは 盤ぜんぶが 効かない。
        ★そして その あいだの おしは **ためない**（T62 §2-A の 事故。
          ★1試合に 最大 24回 この 待ちが 入ります）。
     ============================================================ */
  /* ★★ ずらす 量（★マウスは 0・指は 12mm）★★
     ★ 12 という 数字は ここには 書きません。★core の DIM.AIM_LIFT_MM 1か所だけ。 */
  function liftFor(type) { return (type === 'mouse') ? 0 : geo.lift; }

  /* ★★ 指を 受ける ところ（★盤 ＋ そのまわり 1目 ＋ ★下は 12mm の 受け皿）★★
     ------------------------------------------------------------
     ⚠️★ .stage は のこり ぜんぶ なので、パソコンでは 盤の 左右に 170px ほど 余ります。
        ★ そこを おしても 石が 置かれると、★遊ぶ人の つもりと ちがう 手に なります
          （★実際に 遊んで 気づきました ―― T134 §つまずき）。
     ★ だから「受ける ところ」を 盤の まわりに かぎります。
       ★ ★下だけ 12mm ぶん 広い ―― ★そこが 一番下の 交点への 入口 だからです。
     ★ ⚠️ここは「どの 交点か」を 1つも 見ません。★ただの 四角の 内か 外かだけ。 */
  function inZone(x, y, type) {
    if (!inRect) return false;
    var e = geo.cell;
    return x >= inRect.left - e && x <= inRect.right + e &&
           y >= inRect.top - e && y <= inRect.bottom + liftFor(type) + e;
  }

  /* ★ どの 交点を さわっているか
     ★ 盤の 外へ 出たら いちばん 近い 交点に つく（ルル §3-6 の 5番）
       ―― ★盤の 下 12mm も 受け皿。★そこが 一番下の 交点への 入口 です。 */
  function hitAt(clientX, clientY, type) {
    if (!inRect) return 0;
    var cx = Math.floor((clientX - inRect.left) / geo.cell);
    var cy = Math.floor((clientY - liftFor(type) - inRect.top) / geo.cell);
    if (cx < 0) cx = 0; else if (cx >= LINES) cx = LINES - 1;
    if (cy < 0) cy = 0; else if (cy >= LINES) cy = LINES - 1;
    return cy * LINES + cx;
  }

  var press = null;
  function onDown(e) {
    if (e.pointerType === 'mouse') { hoverX = e.clientX; hoverY = e.clientY; }
    if (!g || over || busy || turn !== ME) return;   // ★ ここで press を 作らない ＝ おしを ためない
    if (press) return;
    if (e.isPrimary === false) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    inRect = boardEl.getBoundingClientRect();
    if (!inZone(e.clientX, e.clientY, e.pointerType)) return;   // ★ 盤から うんと 離れた 所は 受けない
    e.preventDefault();
    press = { id: e.pointerId, type: e.pointerType };
    /* ★★ ここが 判断1 の 入口 ―― ★指の 12mm 上に 輪が 出る（★まだ 置かれない）★★ */
    aimAt(hitAt(e.clientX, e.clientY, e.pointerType));
    try { stageEl.setPointerCapture(e.pointerId); } catch (err) {}
  }
  function onMove(e) {
    if (!press) {
      if (e.pointerType !== 'mouse') return;
      hoverX = e.clientX; hoverY = e.clientY;
      if (!g || over || busy || turn !== ME) return;
      if (!inZone(e.clientX, e.clientY, 'mouse')) { if (held != null) aimAt(null); return; }
      var hp = hitAt(e.clientX, e.clientY, 'mouse');
      if (hp !== held) aimAt(hp);
      return;
    }
    if (e.pointerId !== press.id) return;
    e.preventDefault();
    var p = hitAt(e.clientX, e.clientY, press.type);
    if (p !== held) aimAt(p);
  }
  function onUp(e) {
    if (e.pointerType === 'mouse') { hoverX = e.clientX; hoverY = e.clientY; }
    if (!press || e.pointerId !== press.id) return;
    press = null;
    try { stageEl.releasePointerCapture(e.pointerId); } catch (err) {}
    var p = held;
    held = null;
    if (!g || over || busy || turn !== ME || p == null) { setAim(null); applyHover(); return; }
    /* ★ もう 石が ある 交点 ―― ★ゆれるだけ。★輪は そもそも 出ていません（setAim が 断っている）*/
    if (g.bd[p]) { shakeNo(); setAim(null); applyHover(); return; }
    playAt(p, ME);
  }
  function onCancel(e) {
    if (!press || e.pointerId !== press.id) return;
    press = null; held = null;
    try { stageEl.releasePointerCapture(e.pointerId); } catch (err) {}
    setAim(null);
    applyHover();
  }
  function onLeave(e) {
    if (e && e.pointerType && e.pointerType !== 'mouse') return;
    if (press) return;                 // ★ 押したまま 外へ 出るのは「いちばん 近い 交点」
    hoverX = null; hoverY = null;
    aimAt(null);
  }

  /* ============================================================
     ★ たしかめ（★画面には 1つも 出ない・トライと 社長へ）
     ============================================================ */

  /* ★ 人の 模型（★勝率を 数える ためだけ。★遊ぶ 画面では 1度も 呼ばない）*/
  function humanFns() {
    var o = {};
    for (var k in humans.list) if (humans.list.hasOwnProperty(k)) o[k] = humans.list[k];
    var reads = [2, 3, 4];
    for (var i = 0; i < reads.length; i++) {
      (function (look) {
        o[look + '手 読む'] = humans.reader(function (gg, c, _l, rd) {
          return robot(gg, c, { depth: look, K: 8 }, rd, 0);
        }, look, 0.06);
      })(reads[i]);
    }
    return o;
  }

  function autoPlay(n, opt) {
    n = n || 100; opt = opt || {};
    var HL = humanFns();
    var hn = opt.human || '2手 読む';
    var hf = HL[hn];
    if (!hf) { console.error('[五目並べ] 人の 打ち方が ちがいます：' + hn + '（' + Object.keys(HL).join(' / ') + '）'); return null; }
    var li = opt.level == null ? state.level : Math.max(0, Math.min(C.LEVELS.length - 1, opt.level | 0));
    var lv = C.LEVELS[li];
    var t0 = Date.now();
    var err = 0, r = null;
    try { r = C.runMany(G, robot, hf, li, n, opt.seed == null ? 31337 : (opt.seed >>> 0), opt.open == null ? 4 : opt.open); }
    catch (ex) { err++; console.error('[五目並べ] autoPlay で エラー', ex); }
    if (!r) return { '★エラー': err };
    var out = {
      '盤': LINES + '路 × ' + LINES + '路',
      '試合数': n,
      '人の 打ち方': hn,
      'ロボットの つよさ': lv.label,
      '★エラー': err,
      '★反則（きまりを 破った手）': r.illegal,
      '★途中で 止まった 試合': r.stall,
      '人の勝ち': (r.win * 100).toFixed(1) + '%',
      '引き分け': (r.draw * 100).toFixed(1) + '%',
      '負け': (r.lose * 100).toFixed(1) + '%',
      '手数（両方あわせて）': r.plies.toFixed(1) + '手',
      '★5つ以上の 並びが 2つ以上 できた 試合': (r.twoLines / n * 100).toFixed(1) + '%（' + r.twoLines + '件・最大 ' + r.maxLines + '本）',
      '★いちばん 長かった 並び': r.maxRun + '個',
      '★人の 四つを 止めた 割合': (r.blockRate * 100).toFixed(1) + '%（' + r.blockChance + '回 中）',
      '★わなを かけた 回数／試合': r.traps.toFixed(2) + '回',
      'かかった時間': ((Date.now() - t0) / 1000).toFixed(1) + '秒'
    };
    console.log('[五目並べ] autoPlay', out);
    return out;
  }

  /* ★ 5段 × 人の 打ち方 の 表 */
  function rates(games) {
    games = games || 40;
    var HL = humanFns(), HN = ['＋ 止める', '2手 読む', '3手 読む'], out = {};
    for (var i = 0; i < HN.length; i++) {
      var row = [];
      for (var k = 0; k < C.LEVELS.length; k++) {
        var n = (k >= 3) ? Math.min(games, 20) : games;
        var r = C.runMany(G, robot, HL[HN[i]], k, n, 606 + i * 131 + k * 17, 4);
        row.push(C.LEVELS[k].label + ' ' + ((r.win + r.draw * 0.5) * 100).toFixed(1) + '%');
      }
      out[HN[i]] = row;
    }
    console.log('[五目並べ] rates', out);
    return out;
  }

  /* ★★ 1手に かかる 時間（★実機で 測る・ルル §9-2 の 2番）★★
       ★ budget を 入れると 安全弁つきの 数字、0なら 素の 速さ。 */
  function speed(games, budget) {
    games = games || 6;
    budget = (budget == null) ? TUNE.BOT_BUDGET : budget;
    var out = {};
    for (var li = 0; li < C.LEVELS.length; li++) {
      var lv = C.LEVELS[li], rd = C.rng(555 + li), tot = 0, worst = 0, moves = 0, cuts = 0;
      var hf = humans.list['＋ 止める'];
      for (var gm = 0; gm < games; gm++) {
        var bb = G.newBoard(), me = 1;
        while (bb.n < G.N) {
          var p, t0 = (performance && performance.now) ? performance.now() : Date.now();
          if (me === 2) {
            p = robot(bb, me, li, rd, budget);
            var dt = ((performance && performance.now) ? performance.now() : Date.now()) - t0;
            tot += dt; moves++; if (dt > worst) worst = dt;
            if (robot.cut()) cuts++;
          } else p = hf(bb, me, rd);
          if (p == null || p < 0 || bb.bd[p]) break;
          G.put(bb, p, me);
          if (G.winsAt(bb, p, me)) break;
          me = 3 - me;
        }
      }
      out[lv.label] = '平均 ' + (tot / Math.max(1, moves)).toFixed(2) + 'ms ／ ★最大 ' +
                      worst.toFixed(1) + 'ms（' + moves + '手・★安全弁が 効いた手 ' + cuts + '）';
    }
    out['★安全弁'] = budget ? (budget + 'ms') : 'なし（素の 速さ）';
    console.log('[五目並べ] speed（★実測・' + games + '試合ずつ）', out);
    return out;
  }

  /* ★ 画面の 実寸（★1目が 何px か ―― ルル §9-2 の 1番）*/
  function screenInfo() {
    var r = stageEl.getBoundingClientRect();
    var br = boardEl.getBoundingClientRect();
    return {
      '画面': window.innerWidth + '×' + window.innerHeight,
      '器の中身': geo.W + '×' + geo.H + '（わくの 内がわ ＝ ルル §1-2 の ものさし）',
      '盤': geo.boardW + '×' + geo.boardH + 'px',
      '★1目': geo.cell + 'px',
      '★44pxに対して': (geo.cell / 44 * 100).toFixed(0) + '%',
      '石': geo.stone + 'px', '星': geo.star + 'px',
      '★12mm ずらし（したい）': geo.liftWant + 'px',
      '★12mm ずらし（実際）': geo.lift + 'px' + (geo.side ? '（★横向きは ずらさない）' : ''),
      '★盤の 下の 受け皿': geo.below + 'px',
      '盤の 上の あそび': geo.topPad + 'px（余り ' + geo.slack + 'px）',
      '次の石（帯）': geo.bar + 'px' + (geo.side ? '・右よこ' : '・盤の 上'),
      '★結果の箱の 天井': getComputedStyle(document.documentElement).getPropertyValue('--result-max').trim(),
      'はみ出し下': Math.round(br.bottom - r.bottom) + 'px（0以下ならOK）',
      'はみ出し右': Math.round(br.right - r.right) + 'px（0以下ならOK）',
      'はみ出し上': Math.round(r.top - br.top) + 'px（0以下ならOK）',
      'ページ縦スクロール': document.documentElement.scrollHeight > window.innerHeight,
      'ページ横スクロール': document.documentElement.scrollWidth > window.innerWidth
    };
  }

  /* ★ はみ出し・画面外を 測る（1場面ぶん）*/
  var TOUCH_SEL = '.back,.howto,.level-select,.start-button,.dialog-ok,.close-dialog,.stage';
  function measureOnce() {
    var r = stageEl.getBoundingClientRect();
    var br = boardEl.getBoundingClientRect();
    var out = {
      over: Math.max(0, Math.round(br.bottom - r.bottom), Math.round(br.right - r.right),
                     Math.round(r.top - br.top), Math.round(r.left - br.left)),
      off: 0, offName: [],
      scrollX: document.documentElement.scrollWidth > window.innerWidth,
      scrollY: document.documentElement.scrollHeight > window.innerHeight
    };
    var list = document.querySelectorAll(TOUCH_SEL);
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (!el.offsetParent && el.tagName !== 'BODY') continue;
      var q = el.getBoundingClientRect();
      if (q.width === 0 || q.height === 0) continue;
      if (q.left < -0.5 || q.top < -0.5 || q.right > window.innerWidth + 0.5 || q.bottom > window.innerHeight + 0.5) {
        out.off++; out.offName.push(el.className || el.tagName);
      }
    }
    return out;
  }

  /* ★★ はみ出し しらべ（★250場面 以上・設計図 追記③）★★ */
  function fitTest(n) {
    n = n || 250;
    var rd = C.rng(70707), worstOver = 0, offTotal = 0, names = {}, sx = 0, sy = 0;
    var keepG = g, keepOver = over, keepTurn = turn, keepBusy = busy;
    titleScreen.classList.add('hidden');
    playScreen.classList.remove('hidden');
    if (!built) build();
    for (var gm = 0; gm < n; gm++) {
      g = G.newBoard();
      var many = Math.floor(rd() * (G.N + 1)), me = 1;
      for (var t = 0; t < many; t++) {
        var cand = G.candidates(g);
        if (!cand.length) break;
        G.put(g, cand[Math.floor(rd() * cand.length) % cand.length], me);
        me = 3 - me;
      }
      over = false; busy = false; turn = (gm % 2) ? ME : BOT;
      layout(); paintAll();
      held = (gm % 3 === 0) ? (gm % G.N) : null;
      setAim(held);
      var m = measureOnce();
      if (m.over > worstOver) worstOver = m.over;
      offTotal += m.off;
      for (var k = 0; k < m.offName.length; k++) names[m.offName[k]] = 1;
      if (m.scrollX) sx++;
      if (m.scrollY) sy++;
    }
    held = null;
    g = keepG; over = keepOver; turn = keepTurn; busy = keepBusy;
    if (g) { layout(); paintAll(); setAim(null); setLast(g.last); }
    var out = {
      '画面': window.innerWidth + '×' + window.innerHeight,
      '★1目': geo.cell + 'px',
      '調べた場面': n,
      '★はみ出し（一番 大きい）': worstOver + 'px',
      '★押すボタンが 画面外': offTotal + '件',
      '横スクロールが 出た場面': sx, '縦スクロールが 出た場面': sy
    };
    if (offTotal) out['画面外に 出た もの'] = Object.keys(names);
    console.log('[五目並べ] fitTest', out);
    return out;
  }

  /* ★ 画面に 出る 言葉を ぜんぶ 集める
     ⚠️★ のぞく もの 2つ ―― どちらも「人が 読む 文字」では ないから です：
        ① URL（住所）　② <script> の 中身（★プログラム。★index.html の GOMOKU_LINES など） */
  function readableText() {
    var el = document.body.cloneNode(true);
    var junk = el.querySelectorAll('script,style,svg');
    for (var i = 0; i < junk.length; i++) junk[i].parentNode.removeChild(junk[i]);
    return el.textContent || '';
  }
  function allWords() {
    var s = [];
    for (var k in SAY) if (SAY.hasOwnProperty(k)) s.push(SAY[k]);
    for (var k2 in RESULT_TITLE) if (RESULT_TITLE.hasOwnProperty(k2)) s.push(RESULT_TITLE[k2]);
    for (var i = 0; i < C.LEVELS.length; i++) s.push(C.LEVELS[i].label);
    s.push(readableText());
    s.push(document.title || '');
    var m = document.querySelectorAll('meta[name],meta[property]');
    for (var j = 0; j < m.length; j++) s.push(m[j].getAttribute('content') || '');
    return s.join('\n').replace(/https?:\/\/\S+/g, ' ');
  }
  /* ★ 画面に 出る 文字の 数（★遊ぶ 画面 ＋ はじめの 画面 ＋ 結果 ＋ 遊び方）*/
  function wordCount() {
    function n(s) { return (s || '').replace(/\s/g, '').length; }
    var body = document.body.textContent || '';
    return {
      '本文（今 見えている もの ぜんぶ）': n(body) + '文字',
      'ハッピーの せりふ 4つ': n(SAY.title + SAY.win + SAY.lose + SAY.draw) + '文字',
      '結果の 言葉 3つ': n(RESULT_TITLE.win + RESULT_TITLE.lose + RESULT_TITLE.draw) + '文字',
      '★盤の 上の 文字': n(boardEl ? boardEl.textContent : '') + '文字'
    };
  }

  /* ============================================================
     ★★ たしかめ ★★
       ① 反則0・途中で 止まる0・石の 上に 石が 無い
       ② ★ロボットに「人の 打ち方」が 1度も 渡っていない
       ③ ★置く 前に「5つ 並ぶか」を 出す 経路が 1本も 無い（社長裁定 判断3・ルル §5-4）
       ④ ★★盤で 光るのは「ねらいの 輪 1つ」と「最後の 1手の 赤い 輪 1つ」だけ
       ⑤ ★画面に 手数・%・秒 の 数字が 1つも 無い
       ⑥ ★言っては いけない 言葉が 1つも 無い
       ⑦ ★盤の 大きさは 定数 1つ から しか 出ていない
       ⑧ ★寸法が ルルの 表と 合っている（49／47／23／20／15px）
       ⑨ ★盤に さわる 手は pointer で 作られている（click では ない）
       ⑩ ★5つ 以上の 並びは 全部 数えている（★長連も・1つ 見つけて 止めていない）
       ⑪ ★しるしが 盤の 外・画面の 外に 出ていない
       ⑫ ★★結果の 箱が 盤に 1pxも かぶらない（★光った 5つを 隠さない）
       ⑬ ★★12mm ずらしが 効いている ＆ 一番下の 交点に 指が 届く
     ============================================================ */
  function verify(n) {
    n = n || 200;
    var ng = [], t0 = Date.now();

    // ① ルールの 通り
    var r1 = C.runMany(G, robot, humans.list['＋ 止める'], state.level, n, 777, 4);
    if (r1.illegal) ng.push('反則の 手が ' + r1.illegal + '件');
    if (r1.stall) ng.push('途中で 止まった 試合が ' + r1.stall + '件');
    var dup = 'OK';
    if (g) {
      var cnt = 0;
      for (var q0 = 0; q0 < G.N; q0++) if (g.bd[q0]) cnt++;
      if (cnt !== g.n) { dup = 'NG'; ng.push('★盤の 石の 数が 合わない（' + cnt + ' / ' + g.n + '）'); }
    }

    // ② ロボットに 人の 打ち方が 渡っていないか
    var robotSrc = robot.src();
    var HN = Object.keys(humanFns()), leak = [];
    for (var i = 0; i < HN.length; i++) if (robotSrc.indexOf(HN[i]) >= 0) leak.push(HN[i]);
    if (robotSrc.indexOf('human') >= 0 || robotSrc.indexOf('HUMAN') >= 0) leak.push('human');
    if (leak.length) ng.push('★ロボットの 中に 人の 打ち方が 入っている：' + leak.join('・'));

    /* ③ ★置く 前の 経路に「5つ 並ぶか」が 混じっていないか（社長裁定 判断3）
       ★ 白い 輪（setAim / aimAt / hitAt / applyHover / onLeave）と
         ★赤い 輪（setLast）が、★盤を 1つも 数えて いない ことを 文字列で 見張る。 */
    var uiSrc = String(onDown) + String(onMove) + String(onUp) + String(onLeave) + String(onCancel) +
                String(setAim) + String(setLast) + String(aimAt) + String(applyHover) +
                String(hitAt) + String(liftFor) + String(inZone) + String(layout) + String(step) +
                String(paintAll) + String(placeAt) + String(buildStars) + String(paintNext);
    var bad3 = uiSrc.match(/winsAt|winPoints|winLines|gain|candidates|\bsearch\b|robot\(/g);
    if (bad3) ng.push('★置く 前の 経路に ' + bad3.join('・') + ' が ある');

    /* ============================================================
       ④ ★★盤で 光るのは「ねらいの 輪 1つ」と「最後の 1手 1つ」だけ ★★
         ④-a ★試合の 途中に .is-win / .is-dim が 1つも 無い
         ④-b ★ねらいの 輪は 同時に 1つまで
         ④-c ★★輪の 場所が「指の 12mm 上の 交点」と 1pxも ちがわない（★本物の hitAt を 通す）
         ④-d ★もう 石が ある 交点を ねらった とき、輪は 0個
         ④-e ★ロボットの 番・置いている 最中・試合の あとに 0個
         ④-f ★盤の 部品に :hover / :active の 決まりが 1つも 無い
         ④-g ★赤い 輪は 同時に 1つまで・★最後に 置いた 石と 1pxも ちがわない
         ④-h ★試合が 終わったら、白い 輪も 赤い 輪も 0個
       ★ ④-b〜④-e は ★**本物の setAim() / hitAt() を 通して** 試します
         （★式を 書き写すと、中身が 変わった ときに 気づけない ―― T131 と 同じ 作法）。
       ============================================================ */
    var lit = 0, litCSS = [], bad4 = [];
    var lst = stonesEl ? stonesEl.querySelectorAll('.is-win,.is-dim') : [];
    if (!over) lit = lst.length;                                      // ④-a
    if (lit) ng.push('★試合の 途中なのに 光っている 石が ' + lit + '個 ある');

    if (aimEl && lastEl && g && boardEl && playScreen && !playScreen.classList.contains('hidden')) {
      var keepHeld = held, keepBusy = busy, keepTurn = turn, keepOver = over, keepPress = press;
      press = null;
      var aimN  = function () { return document.querySelectorAll('.aim.is-on').length; };
      var lastN = function () { return document.querySelectorAll('.last-mark.is-on').length; };
      busy = false; over = false; turn = ME;
      inRect = boardEl.getBoundingClientRect();

      /* ④-b・④-c・④-d ―― 225の 交点 ぜんぶを、★指の 座標から 通す */
      var lift = geo.lift, missAim = 0, offAim = 0;
      for (var p4 = 0; p4 < G.N; p4++) {
        var cc = p4 % LINES, rr = (p4 / LINES) | 0;
        /* ★ その 交点の まん中を ねらう 指の 位置 ＝ 交点の 12mm 下 */
        var fx = inRect.left + cc * geo.cell + geo.cell / 2;
        var fy = inRect.top + rr * geo.cell + geo.cell / 2 + lift;
        var got = hitAt(fx, fy, 'touch');
        if (got !== p4) missAim++;
        setAim(got);
        var na = aimN();
        if (na > 1) bad4.push('交点で 輪が ' + na + '個');                       // ④-b
        if (g.bd[p4]) { if (na !== 0) bad4.push('★石が ある 交点が 光っている'); }  // ④-d
        else if (na !== 1) bad4.push('★空いた 交点で 輪が ' + na + '個');
        else {
          var wantL = Math.round(cc * geo.cell + (geo.cell - geo.aim) / 2);
          var wantT = Math.round(rr * geo.cell + (geo.cell - geo.aim) / 2);
          var gotL = Math.round(parseFloat(aimEl.style.left));
          var gotT = Math.round(parseFloat(aimEl.style.top));
          if (gotL !== wantL || gotT !== wantT) offAim++;                        // ④-c
        }
      }
      if (missAim) bad4.push('★★指の 12mm 上の 交点と ちがう 所を ねらった：' + missAim + '個');
      if (offAim)  bad4.push('★★輪の 場所が 交点と ちがう：' + offAim + '個');

      /* ④-e ―― ロボットの 番・置いている 最中・試合の あと */
      var someEmpty = -1;
      for (var pe = 0; pe < G.N; pe++) if (!g.bd[pe]) { someEmpty = pe; break; }
      if (someEmpty >= 0) {
        turn = BOT; setAim(someEmpty); if (aimN() !== 0) bad4.push('★ロボットの 番に 光っている');
        turn = ME; busy = true; setAim(someEmpty); if (aimN() !== 0) bad4.push('★置いている 最中に 光っている');
        busy = false; over = true; setAim(someEmpty); if (aimN() !== 0) bad4.push('★試合が 終わった あとに 光っている');
        over = false;
      }

      /* ④-g ―― 赤い 輪は 1つ・最後に 置いた 石と 1pxも ちがわない */
      if (g.last >= 0 && g.bd[g.last]) {
        setLast(g.last);
        var nl = lastN();
        if (nl !== 1) bad4.push('★赤い 輪が ' + nl + '個');
        else {
          var ls = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--lasts'));
          var lc = g.last % LINES, lr = (g.last / LINES) | 0;
          var wL = Math.round(lc * geo.cell + (geo.cell - ls) / 2);
          var wT = Math.round(lr * geo.cell + (geo.cell - ls) / 2);
          if (Math.round(parseFloat(lastEl.style.left)) !== wL ||
              Math.round(parseFloat(lastEl.style.top))  !== wT) bad4.push('★赤い 輪が 最後の 石と ちがう 所に ある');
        }
        /* ④-h ―― 試合が 終わったら 消える */
        over = true; setLast(g.last);
        if (lastN() !== 0) bad4.push('★試合が 終わった あとに 赤い 輪が 出ている');
        over = false;
      }

      held = keepHeld; busy = keepBusy; turn = keepTurn; over = keepOver; press = keepPress;
      setAim(held); setLast(g.last);
    }
    if (bad4.length) {
      var uniq = {}, list4 = [];
      for (var b4 = 0; b4 < bad4.length; b4++) if (!uniq[bad4[b4]]) { uniq[bad4[b4]] = 1; list4.push(bad4[b4]); }
      ng.push('★しるしが おかしい：' + list4.join('／'));
    }

    try {
      for (var s = 0; s < document.styleSheets.length; s++) {
        var rules = document.styleSheets[s].cssRules || [];
        for (var qq = 0; qq < rules.length; qq++) {
          var sel = rules[qq].selectorText || '';
          /* ⚠️ 「.back」は 上の帯の「◀ ゲームを選ぶ」です。★盤の 部品では ありません。 */
          if (/:hover|:active/.test(sel) && /\.(stone|stones|board|board-wood|board-grid|board-stars|star|aim|last-mark)\b/.test(sel)) litCSS.push(sel);
        }
      }
    } catch (e) {}
    if (litCSS.length) ng.push('★盤の 部品に 指を 置くと 変わる 決まりが ある：' + litCSS.join('・'));

    // ⑤ 手数・%・秒 の 数字
    var words = allWords();
    var badNum = words.match(/\d+\s*手|\d+\s*%|\d+\s*秒|\d+\s*ms|\d+\s*路/g);
    if (badNum) ng.push('★画面に 数字が 出ている：' + badNum.join('・'));

    // ⑥ ★言っては いけない 言葉（ルル §8-2）
    var badWord = words.match(/連珠|三三|四四|長連|四三|定石|リーチ|ゴモク|Gomoku|Renju|まん中|中央/gi);
    if (badWord) ng.push('★画面の 言葉に「' + badWord.join('・') + '」が ある');
    // ★「並べ」は 漢字（設計図 §9.6）。★ひらがなの「ならべ」が 混じっていないか
    var kanaBad = words.match(/[一二三四五六七八九十]目ならべ|ならべよう|ならべ！/g);
    if (kanaBad) ng.push('★「並べ」が ひらがなに なっている：' + kanaBad.join('・'));

    // ⑦ 盤の 大きさ
    if (G.lines !== LINES) ng.push('盤の 大きさが 定数と ちがう');

    /* ⑧ 寸法（ルル §2-2 の 表）
       ★ 上限（CELL_MAX）を 外した 素の 値で くらべる ―― ★あれは アトの 持ち場 なので。 */
    var want = [[1440, 780, 49], [960, 750, 47], [355, 674, 23], [306, 446, 20], [772, 225, 15]], dimNG = [];
    var saveMax = C.DIM.CELL_MAX; C.DIM.CELL_MAX = 9999;
    for (var d = 0; d < want.length; d++) {
      var f8 = C.fitBoard(want[d][0], want[d][1], LINES);
      if (f8.cell !== want[d][2]) dimNG.push(want[d][0] + '×' + want[d][1] + ' → ' + f8.cell + 'px（表は ' + want[d][2] + '）');
    }
    C.DIM.CELL_MAX = saveMax;
    if (dimNG.length) ng.push('★寸法が 表と ちがう：' + dimNG.join('／'));

    // ⑨ 盤に さわる 手は pointer か
    var bootSrc = String(boot);
    var ptr = /pointerdown/.test(bootSrc) && /pointermove/.test(bootSrc) && /pointerup/.test(bootSrc);
    if (!ptr) ng.push('★盤の 操作が pointer で 作られていない');
    if (/stageEl\.addEventListener\('click'/.test(bootSrc)) ng.push('★盤に click が つながっている');

    /* ⑩ 5つ 以上の 並びを 全部 数えているか（★長連も・1つ 見つけて 止めない）
       ★ わざと 6つ 並んだ 盤を 作って 通す（★式を 読むのでは なく、通して たしかめる）。 */
    var lineOK = 'OK';
    /* ⑩-a ★長連（6つ）… 1本・6個 に なるか（★5つで 切らない）*/
    var t10 = G.newBoard();
    for (var x10 = 0; x10 < 6 && x10 < LINES; x10++) G.put(t10, 0 * LINES + x10, 1);
    var wl10 = G.winLines(t10);
    var run10 = wl10.lines.length ? wl10.lines[0].length : 0;
    if (wl10.lines.length !== 1 || run10 !== 6) { lineOK = 'NG'; ng.push('★6つ 続いた 並びが 全部 数えられていない（' + wl10.lines.length + '本・' + run10 + '個）'); }
    /* ⑩-b ★並びが 2つ 同時に できた とき… 2本 とも 数えるか（★1つ 見つけて 止めない）*/
    var t10b = G.newBoard(), mid10 = (LINES - 1) >> 1;
    for (var k10 = 0; k10 < 5; k10++) { G.put(t10b, mid10 * LINES + (mid10 - 2 + k10), 1); if (k10 !== 2) G.put(t10b, (mid10 - 2 + k10) * LINES + mid10, 1); }
    var wl10b = G.winLines(t10b);
    if (wl10b.lines.length !== 2) { lineOK = 'NG'; ng.push('★並びが 2つ できたのに ' + wl10b.lines.length + '本 しか 数えていない'); }

    /* ⑪ しるしが 盤の 外・画面の 外に 出ていないか */
    var outMark = [];
    if (playScreen && !playScreen.classList.contains('hidden') && aimEl) {
      var bdR = boardEl.getBoundingClientRect();
      var VW = document.documentElement.clientWidth, VH = document.documentElement.clientHeight;
      var keep11 = held, keepO11 = over, keepB11 = busy, keepT11 = turn;
      over = false; busy = false; turn = ME;
      var corners = [0, LINES - 1, (LINES - 1) * LINES, G.N - 1, ((LINES - 1) >> 1) * LINES + ((LINES - 1) >> 1)];
      for (var m11 = 0; m11 < corners.length; m11++) {
        if (g && g.bd[corners[m11]]) continue;
        setAim(corners[m11]);
        var aR = aimEl.getBoundingClientRect();
        if (aR.left < bdR.left - 0.5 || aR.top < bdR.top - 0.5 ||
            aR.right > bdR.right + 0.5 || aR.bottom > bdR.bottom + 0.5) outMark.push('輪が 盤から はみ出た');
        if (aR.left < 0 || aR.top < 0 || aR.right > VW || aR.bottom > VH) outMark.push('輪が 画面の 外に 出た');
      }
      held = keep11; over = keepO11; busy = keepB11; turn = keepT11; setAim(held);
      if (outMark.length) ng.push('★' + outMark.join('・'));
    }

    /* ⑫ ★★結果の 箱が 盤に かぶらないか（★光った 5つを 隠さない）★★
       ★ 本物の 箱を 一度 出して 測る。 */
    var boxNG = '';
    if (resultWrap && playScreen && !playScreen.classList.contains('hidden')) {
      var wasHidden = resultWrap.classList.contains('hidden');
      if (wasHidden) resultWrap.classList.remove('hidden');
      var bxR = resultBox.getBoundingClientRect(), bdR2 = boardEl.getBoundingClientRect();
      var ovl = (bxR.right > bdR2.left + 0.5 && bxR.left < bdR2.right - 0.5 &&
                 bxR.bottom > bdR2.top + 0.5 && bxR.top < bdR2.bottom - 0.5);
      var offBox = (bxR.top < -0.5 || bxR.bottom > document.documentElement.clientHeight + 0.5);
      if (wasHidden) resultWrap.classList.add('hidden');
      if (ovl) { boxNG = 'NG'; ng.push('★結果の 箱が 盤に かぶっている（箱 ' + Math.round(bxR.top) + '〜' + Math.round(bxR.bottom) + ' ／ 盤 ' + Math.round(bdR2.top) + '〜' + Math.round(bdR2.bottom) + '）'); }
      if (offBox) { boxNG = 'NG'; ng.push('★結果の 箱が 画面から はみ出している'); }
    }

    /* ⑬ ★★12mm ずらし ―― ★指と マウスで 分かれているか・一番下の 交点に 届くか ★★ */
    var liftNG = [];
    if (playScreen && !playScreen.classList.contains('hidden')) {
      if (!geo.side) {
        if (geo.lift <= 0) liftNG.push('★指の ずらしが 0px に なっている');
        if (geo.lift !== geo.liftWant) liftNG.push('★受け皿が 足りず ずらしが ' + geo.lift + 'px に 削られた（したい ' + geo.liftWant + 'px）');
      }
      if (liftFor('mouse') !== 0) liftNG.push('★マウスまで ずらしている');
      if (!geo.side && liftFor('touch') !== geo.lift) liftNG.push('★指が ずれていない');
      /* ★ 一番下・一番上の 交点に、★画面の 中の 指で 届くか */
      inRect = boardEl.getBoundingClientRect();
      var sr13 = stageEl.getBoundingClientRect();
      var midX = inRect.left + geo.cell / 2;
      var lowY = inRect.top + (LINES - 1) * geo.cell + geo.cell / 2 + geo.lift;
      var topY = inRect.top + geo.cell / 2 + geo.lift;
      if (lowY > sr13.bottom + 0.5) liftNG.push('★一番 下の 交点に 指が 届かない（要る ' + Math.round(lowY) + ' ／ 受け皿の 下ふち ' + Math.round(sr13.bottom) + '）');
      if (topY < sr13.top - 0.5) liftNG.push('★一番 上の 交点に 指が 届かない');
      if (hitAt(midX, lowY, 'touch') !== (LINES - 1) * LINES) liftNG.push('★一番 下の 交点を ねらえない');
      if (hitAt(midX, topY, 'touch') !== 0) liftNG.push('★一番 上の 交点を ねらえない');
      /* ★ 受ける ところ ―― ★盤の まわりだけ。★うんと 離れた 所は 受けない */
      if (!inZone(midX, lowY, 'touch')) liftNG.push('★一番 下の 交点への 入口が 受け皿の 外');
      if (!inZone(midX, topY, 'touch')) liftNG.push('★一番 上の 交点への 入口が 受け皿の 外');
      if (inZone(inRect.left - geo.cell * 3, inRect.top + 10, 'touch')) liftNG.push('★盤から うんと 左に 離れた 所を 受けている');
      if (inZone(inRect.right + geo.cell * 3, inRect.top + 10, 'touch')) liftNG.push('★盤から うんと 右に 離れた 所を 受けている');
      if (inZone(midX, inRect.bottom + geo.lift + geo.cell * 3, 'touch')) liftNG.push('★受け皿より ずっと 下を 受けている');
    }
    if (liftNG.length) ng.push('★12mm ずらし：' + liftNG.join('／'));

    var out = {
      '盤': LINES + '路 × ' + LINES + '路（1目 ' + geo.cell + 'px）',
      '調べた試合': n,
      '★NG': ng.length,
      '①反則0・詰まり0・石の数': (r1.illegal === 0 && r1.stall === 0 && dup === 'OK') ? 'OK' : 'NG',
      '②ロボットは 人の 打ち方を 知らない': leak.length ? 'NG' : 'OK',
      '③★置く 前に 5つを 出す 経路が 無い': bad3 ? 'NG' : 'OK',
      '④★盤の しるしは 輪 1つ ＋ 赤い 輪 1つ だけ':
        (lit || bad4.length || litCSS.length) ? 'NG' : 'OK（225の 交点 ぜんぶ 通した）',
      '⑤画面に 手数・%・秒 が 無い': badNum ? 'NG' : 'OK',
      '⑥★言っては いけない 言葉が 無い': (badWord || kanaBad) ? 'NG' : 'OK（「並べ」は 漢字）',
      '⑦盤の 大きさは 定数 1つ': (G.lines === LINES) ? 'OK' : 'NG',
      '⑧★寸法が 表どおり': dimNG.length ? 'NG' : 'OK（49 / 47 / 23 / 20 / 15px）',
      '⑨★操作は pointer': ptr ? 'OK' : 'NG',
      '⑩★5つ 以上の 並びは 全部 数える': lineOK,
      '⑪★しるしが 盤・画面から はみ出さない': outMark.length ? 'NG' : 'OK',
      '⑫★結果の 箱が 盤に かぶらない': boxNG ? 'NG' : 'OK',
      '⑬★12mm ずらし': liftNG.length ? 'NG' : ('OK（指 ' + geo.lift + 'px ／ マウス 0px' + (geo.side ? '・横向きは ずらさない' : '') + '）'),
      '★5つ以上の 並びが 2つ以上 できた 試合': (r1.twoLines / n * 100).toFixed(1) + '%（最大 ' + r1.maxLines + '本・いちばん 長い 並び ' + r1.maxRun + '個）',
      'かかった時間': ((Date.now() - t0) / 1000).toFixed(1) + '秒'
    };
    if (ng.length) out['NGの中身'] = ng;
    console.log('[五目並べ] verify', out);
    return out;
  }

  /* ★ いまの 盤（★たしかめ 専用）*/
  function now() {
    if (!g) return { '場面': 'まだ 始めていない', 'ロボットの つよさ': levelNow().label };
    var lines = [];
    for (var r = 0; r < LINES; r++) {
      var line = [];
      for (var c = 0; c < LINES; c++) {
        var v = g.bd[r * LINES + c];
        line.push(v === ME ? '●' : (v === BOT ? '○' : '・'));
      }
      lines.push(line.join(''));
    }
    return {
      '盤': lines,
      '（●が 自分＝黒・○が ロボット＝白）': '',
      '置いた 石': g.n + ' / ' + G.N,
      '手番': turn === ME ? '自分（黒）' : 'ロボット（白）',
      '★最後の 1手（赤い 輪）': g.last < 0 ? '―' : ((g.last % LINES + 1) + '列目・' + (((g.last / LINES) | 0) + 1) + '行目'),
      '★いま ねらっている 交点': held == null ? '―' : ((held % LINES + 1) + '列目・' + (((held / LINES) | 0) + 1) + '行目'),
      'ロボットの つよさ': levelNow().label,
      '打った手': stat.plies,
      '★ロボットの 1手（平均／最悪）': stat.botMoves
        ? (stat.botTotal / stat.botMoves).toFixed(0) + 'ms ／ ' + stat.botWorst + 'ms'
        : '―',
      '★安全弁が 効いた 手': stat.cuts,
      '勝敗': over ? (G.winLines(g).who === ME ? '勝ち' : (G.winLines(g).who === BOT ? '負け' : '引き分け')) : '進行中',
      '★5つ以上の 並び': over ? (stat.winLines + '本・いちばん 長い ' + stat.maxRun + '個') : '―',
      '★1目': geo.cell + 'px（★12mm ずらし ' + geo.lift + 'px）'
    };
  }

  /* ★ 盤を 直に 置く（★たしかめ 専用・画面からは 呼べない）
       list … 路の 数だけの 文字列。●＝自分 ○＝ロボット ・＝空
       who  … 1＝自分から 2＝ロボットから */
  function set(list, who) {
    titleScreen.classList.add('hidden');
    playScreen.classList.remove('hidden');
    if (!built) build();
    clearTimers();
    g = G.newBoard();
    for (var r = 0; r < LINES; r++) {
      var line = (list[r] || '').replace(/\s/g, '');
      for (var c = 0; c < LINES; c++) {
        var ch = line.charAt(c);
        if (ch === '●') G.put(g, r * LINES + c, ME);
        else if (ch === '○') G.put(g, r * LINES + c, BOT);
      }
    }
    turn = who === 2 ? BOT : ME;
    over = false; busy = false; held = null;
    resultWrap.classList.add('hidden');
    layout(); paintAll(); paintNext(); setLast(g.last);
    step();
    return now();
  }

  /* ★★ もどす ―― ★作りません（ルル §7-6）★★
     ------------------------------------------------------------
     ★ 四目並べの もどすは「7回 押し直せば 総当たり」でした。
     ★★ 五目並べは もっと 悪い ―― ★★1回で 足ります。
       ★ この ゲームは「わな」で 決まります。★自分の 手が わなに かかったか どうかは、
         ★★ロボットの 次の 1手を 見れば 分かります。★もどせば それを 見てから 打ち直せる。
       ★ ＝「気づく 遊び」を、まるごと 買い戻せる ボタン です。
     ★ そして 判断1 の 形（★はなすまで 置かれない）で、★指の すべりは すでに 直せます。
     ★ だから この ゲームには undo を 1つも 置きません（★たしかめ用にも 作りません）。
     ============================================================ */

  /* ============================================================
     ★ 立ち上げ
     ============================================================ */
  function boot() {
    titleScreen = $('titleScreen'); playScreen = $('playScreen');
    stageEl = $('stage'); holdEl = $('hold'); nextRow = $('nextRow'); nextStone = $('nextStone');
    frameEl = $('boardFrame'); boardEl = $('board');
    gridEl = $('boardGrid'); starsEl = $('boardStars');
    aimEl = $('aim'); stonesEl = $('stones'); lastEl = $('lastMark');
    resultWrap = $('resultWrap'); resultBox = $('resultBox');

    loadLevel();
    fillLevelSelect($('levelTitle'));
    fillLevelSelect($('levelResult'));
    say(SAY.title);

    $('levelTitle').addEventListener('change', function () { setLevel(this.value | 0); });
    $('levelResult').addEventListener('change', function () { setLevel(this.value | 0); });

    $('btnStart').addEventListener('click', function () {
      titleScreen.classList.add('hidden');
      playScreen.classList.remove('hidden');
      newGame();
    });
    $('btnAgain').addEventListener('click', function () {
      if (resultBox.classList.contains('is-locked')) return;
      newGame();
    });
    $('btnHowto').addEventListener('click', function () { $('helpDialog').showModal(); });
    var closers = document.querySelectorAll('[data-close]');
    for (var i = 0; i < closers.length; i++) {
      closers[i].addEventListener('click', function () { $(this.getAttribute('data-close')).close(); });
    }

    /* ★★ 指を 受けるのは .stage（★盤 だけでは ない）★★
       ★ 判断1 の ため、★盤の 下 12mm も 受け皿に します（ルル §3-6 の 5番）。
       ★ pointerdown / pointermove / pointerup で 作る。★click は 使わない（14本の 作法）。 */
    stageEl.addEventListener('pointerdown', onDown);
    stageEl.addEventListener('pointermove', onMove);
    stageEl.addEventListener('pointerup', onUp);
    stageEl.addEventListener('pointercancel', onCancel);
    stageEl.addEventListener('pointerleave', onLeave);
    stageEl.addEventListener('pointerover', onMove);

    window.addEventListener('resize', function () { layout(); });
    window.addEventListener('orientationchange', function () { later(layout, 120); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* ============================================================
     ★ たしかめの 窓口（既存14本と 同じ 作法。★画面には 1つも 出ない）
     ============================================================ */
  root.GOMOKU = {
    now: now,
    autoPlay: autoPlay,
    rates: rates,
    speed: speed,
    verify: verify,
    screen: screenInfo,
    fitTest: fitTest,
    words: wordCount,
    geo: function () { return geo; },
    level: function (i) {
      if (i == null) return { 番号: state.level, 名前: levelNow().label };
      setLevel(i);
      return { 番号: state.level, 名前: levelNow().label };
    },
    seed: function (v) { if (v == null) return null; rand = C.rng(v >>> 0); return v >>> 0; },
    set: set,
    newGame: function () { newGame(); },
    humans: function () { return Object.keys(humanFns()); },
    levels: function () { var o = []; for (var i = 0; i < C.LEVELS.length; i++) o.push(C.LEVELS[i].label); return o; },
    size: function () { return { 路: LINES, 交点: G.N }; },
    core: C
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
