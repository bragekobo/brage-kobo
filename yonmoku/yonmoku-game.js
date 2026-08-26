/* ============================================================
   四目並べ（14本目）― 画面（UI）／ T127・コーダ
   ------------------------------------------------------------
   仕様は logs/T126_四目並べ_仕様_ルル.md ＋ 社長の裁定4つ が 正。

   ★★ 社長の裁定（4つ・厳守）★★
     判断1 ★ 初期値は **2段「ふつう」**（★ルルの推し「弱い」では ない）
     判断2 ★ 指を 置く → その列の 上に コマが 出る → すべらせて 直せる → はなした 列に 落ちる
     判断3 ★ リーチを 見せない。★盤の 上の 強調は **ゼロ**
     判断4 ★ 下の トレイ（余った コマ）は 描かない

   ★★ この ファイルは「画面」だけ ★★
     ------------------------------------------------------------
     ルール・ロボット・寸法の 計算は ぜんぶ yonmoku-core.js に あります
     （＝ 勝率を 数える 側と 遊ぶ 側の ロボットが 同じ 1本の コード）。
     ★ 盤の 大きさは index.html の 2行（COLS・ROWS）だけ。
       この ファイルにも 列の数も 段の数も 1つも 書いていません。

   ★★ この 1本で いちばん 新しい ところ ＝ 操作（判断2）★★
     ------------------------------------------------------------
     ★ pointerdown → その 列の 上に コマが 出る（★まだ 落ちない）
     ★ pointermove → コマが 列から 列へ 移る（★何度でも 直せる）
     ★ pointerup   → はなした 列に 落ちる
     ★ 指を 置いて すぐ はなせば、1回 おすのと **同じ 手数**。★遅くしない。
     ⚠️ これは ドラッグでは ありません（設計図 追記④）。
        ★「持ち上げて 運ぶ」のでは なく「★列を 選び直せる」だけ です。
     ⚠️ HTML5 の draggable は スマホで 効きません。★Pointer Events で 作ります（13本の 作法）。

   ⚠️ 外部の ライブラリ・フォント・画像は 0。外への 通信も 0。
   ============================================================ */
(function (root) {
  'use strict';

  var C = root.YONMOKU_CORE;
  if (!C) { console.error('[四目並べ] yonmoku-core.js が 読めていません'); return; }

  /* ★★★ 盤の 大きさは index.html の 2行 だけ ★★★ */
  var COLS = root.YONMOKU_COLS | 0;
  var ROWS = root.YONMOKU_ROWS | 0;

  var G = C.makeCore(COLS, ROWS);
  var robot = C.makeRobot(G);
  var humans = C.makeHumans(G);   // ★ 勝率を 数える ときだけ 使う（遊ぶ 画面では 1度も 呼ばない）

  var ME = 1, BOT = 2;            // ★ 人が 先手（赤）。固定（ルル §3-4）

  /* ============================================================
     ★ 数字（TUNE）― 調整する 数字は ここ 1か所だけ
     ============================================================ */
  var TUNE = {
    /* ★ ロボットが 考える 間（ルル §8-1）。★手加減では ない ―― 人が 盤を 読む ぶん。
       ★ どの 段でも 同じ（弱い ロボットだけ 速い、に しない）。 */
    BOT_THINK: 600,

    /* ★ 1手に これ以上 かかりそうなら 1つ 浅い 読みで 返す（おそい 端末むけ）。
       ⚠️ この パソコンでの【実測】：弱い 0.5ms ／ ふつう 0.6ms ／ 強い 0.4ms ／
          とても 強い 4.7ms ／ ★最強 47.3ms（最悪値）。平均は 最強でも 13.4ms。
          ★ スマホは 3〜5倍 おそいと 見て 最悪 240ms ―― ルルの「1手 0.6秒」に 収まる。 */
    BOT_BUDGET: 500,

    /* ★ 落ちる 動き（ルル §5-3）：1段 40ms・上限 240ms ＋ 着地 50ms ＝ 0.29秒 */
    FALL_STEP: 40, FALL_CAP: 240, LAND_MS: 50,

    /* ★ 勝ったときの 4つ（ルル §8-2）：1つ 120ms ずつ → 0.6秒 たって 結果の 箱 */
    WIN_STEP: 120, WIN_HOLD: 600,

    RESULT_LOCK: 600    // 結果の 箱の 連打よけ（T62・T63 の 事故）
  };

  /* ============================================================
     ★ 画面に 出す 言葉 ―― ★ここ 1か所だけ（設計図 §9.6・ルル §9-1）
     ------------------------------------------------------------
     ★★ ハッピーは 遊んでいる 最中、1文字も しゃべりません（ルル §8-4）。
        ★ リーチのとき「あぶない！」も 言いません（★遊びの 半分以上を 取り上げる）。
        ★ 3つ 並んだとき「あと 1つ！」も 言いません。
        ★ 「まん中が いいよ」も 言いません（★先手必勝の 知識を そのまま 渡す ことに なる）。
     ★ 手数・%・秒 の 数字も 1つも 出しません。
     ============================================================ */
  var SAY = {
    title: 'たて よこ ななめ、4つ そろえよう！',
    win:   'やったー！　4つ そろったね！',
    lose:  'おしい！　もう1回 やろ？',
    draw:  '引き分け！　いい しょうぶ だったね'
  };
  var RESULT_TITLE = { win: '勝ち！', lose: '負け…', draw: '引き分け' };

  /* ============================================================
     ★ 画面の 部品
     ============================================================ */
  var $ = function (id) { return document.getElementById(id); };
  var titleScreen, playScreen, stageEl, holdEl, nextRow, frameEl, boardEl,
      backEl, piecesEl, gridEl, flierEl, landEl, resultWrap, resultBox,
      brandEl, padEl;

  var pieceEl = [];                 // 場所 → コマの span（無ければ null）
  var b = null, h = null;           // 盤（0＝空 1＝人 2＝ロボット）／ 積み上がり
  var turn = ME, over = false, busy = true, built = false;
  var held = null;                  // ★ いま 指で 持っている 列（判断2）
  /* ★★ マウスの 位置（T131・社長の ご指示①）★★
     ★ 「押さなくても、マウスを 乗せただけで コマが 動く」ため に 覚えておく 1つの 数字。
     ★ ★マウスの ときだけ 入れます（★指では null の まま ―― 指は 触れた ときだけ 動かす）。
     ★ 覚えておく 理由：★ロボットの 番が 終わって 自分の 番に 戻った とき、
       ★ マウスは 動いていないので pointermove が 1つも 来ません。
       ★ そのままだと コマが 待ち場所に 戻ったきり、カーソルの 下に 帰って きません。 */
  var hoverX = null;
  var timers = [];
  var rand = C.rng(20260826);
  var geo = { cell: 44, piece: 36, hole: 39, bar: 24, gap: 8, side: false,
              W: 0, H: 0, inX: 0, inY: 0, boardW: 0, boardH: 0,
              frameY: 0, holdTop: 0 };
  var inRect = null;                // 格子の 実位置（列を 決める ものさし）
  var stat = { plies: 0, botWorst: 0, botTotal: 0, botMoves: 0, budgetHits: 0, winLines: 0 };

  var STORE_KEY = 'bragekobo.yonmoku' + COLS + '.level';
  var state = { level: C.LEVEL_START };

  function later(fn, ms) { var id = setTimeout(fn, ms); timers.push(id); return id; }
  function clearTimers() { for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]); timers = []; }
  function say(t) { $('happyBubble').textContent = t; }
  function levelNow() { return C.LEVELS[state.level]; }

  /* ============================================================
     ★ つよさ（5段）― プルダウン 2か所
     ------------------------------------------------------------
     ★ はじめの 画面 と、★負けた あとの 画面（★アイの 指示・スピード T60 の 社長の言葉）。
       ★ 初期値が「ふつう」なので、負けた その場で 下げられる ことが
         はじめての人の 唯一の 逃げ道です。
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
     ★ 寸法（ルル §1-3）― 割り算 2回。トランプの fit() は 要らない
     ------------------------------------------------------------
     ★ 数字は yonmoku-core.js の DIM と fitBoard() から しか 来ない。
       ここで px を 手で 書かない こと。
     ============================================================ */
  function layout() {
    if (!built) return;
    /* ★「器の中身」＝ 青い わくの 内がわ（ルル §1-2 の 実測値と 同じ ものさし）。
       ★ わくの 太さは 画面の 大きさで 変わる ので、CSS から 読んで 引く
         （★px を JS に 手で 書かない ―― 書くと 2か所に 同じ 数字が 生まれる）。 */
    var r = stageEl.getBoundingClientRect();
    var fs = getComputedStyle(frameEl);
    var insetX = parseFloat(fs.paddingLeft) + parseFloat(fs.paddingRight) +
                 parseFloat(fs.borderLeftWidth) + parseFloat(fs.borderRightWidth);
    var insetY = parseFloat(fs.paddingTop) + parseFloat(fs.paddingBottom) +
                 parseFloat(fs.borderTopWidth) + parseFloat(fs.borderBottomWidth);
    var W = Math.floor(r.width - insetX), H = Math.floor(r.height - insetY);

    var f = C.fitBoard(W, H, COLS, ROWS);
    geo.W = W; geo.H = H;
    geo.cell = f.cell; geo.piece = f.piece; geo.hole = f.hole;
    geo.bar = f.bar; geo.gap = f.gap; geo.frame = f.frame; geo.side = f.side;
    geo.boardW = f.boardW; geo.boardH = f.boardH;
    geo.colW = f.colW; geo.colH = f.colH;

    var css = document.documentElement.style;
    css.setProperty('--cell',  f.cell + 'px');
    css.setProperty('--piece', f.piece + 'px');
    css.setProperty('--hole',  f.hole + 'px');
    css.setProperty('--bar',   f.bar + 'px');
    css.setProperty('--gap',   f.gap + 'px');

    holdEl.classList.toggle('is-side', f.side);
    /* ★★ 横向きの ときだけ、上の帯の 名前を 右はしへ どかす（T129）★★
       ★ 横向きは 持っている コマが 上の帯と 同じ 高さを 通ります（→ overLine）。
         ★ まん中に 名前が あると、4〜6列目を 持った ときに 文字と 重なります
           【実測 812×375：名前 x393〜472／5列目の コマ x410〜444 ＝ まるかぶり】。
       ★ 名前は **消しません。どかすだけ**（★文字は 1つも 減っていません）。
         ★どかす 先は 盤の 右がわの 空き【実測：812px で x585〜804・667px で x513〜659】。
       ⚠️★ たて向き・パソコンでは 何も しません（'' に 戻す）。
       ⚠️★ CSS の ファイルは 1文字も さわりません ―― ★同じ 時間に 🎨アトが
          結果の 箱の CSS を さわる ので、ぶつからない よう JS 側で 済ませます。 */
    if (brandEl) brandEl.style.justifyContent = f.side ? 'flex-end' : '';
    if (padEl)   padEl.style.width            = f.side ? '0px' : '';
    boardEl.style.width = f.boardW + 'px';
    boardEl.style.height = f.boardH + 'px';
    boardEl.style.borderWidth = f.frame + 'px';

    /* ★ 格子の 位置を 覚える（★列を 決める ものさし・flier の 置き場）*/
    var hr = holdEl.getBoundingClientRect();
    inRect = piecesEl.getBoundingClientRect();
    geo.inX = inRect.left - hr.left;
    geo.inY = inRect.top - hr.top;
    geo.frameY = frameEl.getBoundingClientRect().top - hr.top;   // ★ 青い わくの 上ふち
    geo.holdTop = hr.top;                                        // ★ 画面の 上ふちから ここまで
    var nr = nextRow.getBoundingClientRect();
    geo.restX = nr.left - hr.left + (nr.width - f.bar) / 2;
    geo.restY = nr.top - hr.top + (nr.height - f.bar) / 2;
    /* ★★ 横向き（帯が 右よこ）の ときは、待ち場所も 下の overLine() に そろえる ★★
       ★ そろえないと、待ち場所（右の まん中）から 列の 上へ 動く 線が
         ★★盤の 中を ななめに 横切ります（0.12秒 だけ 盤の 上に コマが 出る）。
       ★ 同じ 高さに そろえて おけば、動きは いつも 盤の 外の 横1本の 線の 上だけ。 */
    if (f.side) geo.restY = overLine();

    for (var p = 0; p < G.N; p++) if (pieceEl[p]) placeAt(pieceEl[p], p);
    setFlier(held, true);
    setLanding(held);   // ★ T131：画面の 大きさが 変わっても、光りは 同じ 穴の 上に 乗り直す
  }

  /* ============================================================
     ★ 盤を 作る（1回だけ）
     ------------------------------------------------------------
     ★ 盤の 上に 文字は 1つも 置きません。
     ★ マスの div も 作りません ―― 押すのは「マス」では なく「列」だから
       （★列は 上から 下まで ぜんぶ 押せる ＝ たては 258〜714px）。
     ============================================================ */
  function build() {
    piecesEl.innerHTML = '';
    pieceEl = new Array(G.N);
    for (var p = 0; p < G.N; p++) pieceEl[p] = null;
    built = true;
  }

  function placeAt(el, p) {
    var c = p % COLS, r = (p / COLS) | 0, off = (geo.cell - geo.piece) / 2;
    el.style.left = (c * geo.cell + off) + 'px';
    el.style.top  = (r * geo.cell + off) + 'px';
  }
  function makePiece(p, who) {
    var el = document.createElement('span');
    el.className = 'piece ' + (who === ME ? 'me' : 'bot');
    placeAt(el, p);
    piecesEl.appendChild(el);
    pieceEl[p] = el;
    return el;
  }
  function paintAll() {
    piecesEl.innerHTML = '';
    for (var p = 0; p < G.N; p++) { pieceEl[p] = null; if (b[p]) makePiece(p, b[p]); }
  }

  /* ============================================================
     ★★ 次の コマ（＝ 手番の しるし ＝ 指で 持つ コマ）★★
     ------------------------------------------------------------
     ★ col が null … 盤の まん中の 上（ふだんの 待ち場所）
     ★ col が 数字 … その 列の 上（★指で 持っている あいだ）
     ⚠️★ ここが 出すのは「今 この 列を ねらっています」だけ です。
        ★ どこに 落ちるかは 見れば 分かる（いちばん 下の 空き）。
        ★★ 勝てるか どうかは 1つも 出しません（社長裁定 判断3・ルル §6-4）。
        ★ 盤の 上の 光る／色が 変わる ものは、やはり **ゼロ**の ままです。
     ============================================================ */
  /* ★★ 横向きの ときに、持っている コマを 置く たての 位置（T129）★★
     ------------------------------------------------------------
     ⚠️★ ここが T129 の 直しです。前は
          `geo.inY + (geo.cell - geo.bar) / 2` ＝ **一番上の マスの ど真ん中**、
          つまり **盤の 中** に 出していました。
        ★ 遊ぶ人には「もう 置いた コマ」に 見え、★満杯の 列では 本物の コマと
          1pxも ちがわず 重なりました（🧪トライ T128 の 🔴-1）。
        ★★ 社長裁定 判断3「盤の 上の 強調は ゼロ」が、横向きでだけ 破れていた ところ です。

     ★ 直し方：★たて向きと 同じで、**盤の 外（上）** に 出す。
       ★ 横向きは たてが 258pxしか なく、盤の 上に 場所が ありません。
       ★ そこで **盤の 外の 上（＝ 上の帯と 同じ 高さ）** を 使います。
         ―― ★盤を 1pxも 小さくせず（設計図 追記③）、★盤の 中には 1pxも 入りません。
     ★ 数字は 2つの 決まりだけ：
       ① ふだんは 青い わくの 上ふちから すきま（gap）だけ 上（★たて向きと 同じ 見え方）
       ② 画面の 上ふちから 4px は 空ける。★足りなければ わくに ぴったり 付くまで 下げる
          ―― ★★それでも 盤の 中には 絶対に 入らない（下の Math.min が 保証）。 */
  var SKY_EDGE = 4;   // ★ 画面の 上ふちから 空ける px
  function overLine() {
    var top = geo.frameY - geo.gap - geo.bar;     // ① わくの 上に すきま
    var min = SKY_EDGE - geo.holdTop;             // ② 画面の 上ふちから 4px
    if (top < min) top = Math.min(min, geo.frameY - geo.bar);
    return top;
  }

  function setFlier(col, instant) {
    if (!flierEl) return;
    if (instant) flierEl.classList.add('no-anim');
    flierEl.classList.toggle('me',  turn === ME);
    flierEl.classList.toggle('bot', turn === BOT);
    flierEl.classList.toggle('is-off', over);
    var x, y;
    if (col == null) { x = geo.restX; y = geo.restY; }
    else {
      x = geo.inX + col * geo.cell + (geo.cell - geo.bar) / 2;
      y = geo.side ? overLine() : 0;
    }
    flierEl.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    if (instant) { void flierEl.offsetWidth; flierEl.classList.remove('no-anim'); }
  }

  /* ============================================================
     ★★★ 落ちる 穴の 光り（T131・社長の ご指示②）★★★
     ------------------------------------------------------------
     ★ いま ねらっている 列の「いちばん 下の 空き」を 1つだけ 光らせます。
     ★ 列を 変えれば 光りも 移り、盤から 出れば 消えます。

     ⚠️★★ 社長裁定 判断3 を 破っていないか（★ここが いちばん 大事な ところ）★★
        ★ ここで 見ているのは `G.landRow()` ―― ★★**重力だけ** です。
          （★h ＝ 各列に 何個 積んであるか。★その 上に 1つ 乗る、それだけ）
        ★ ★`winAt` も `winLines` も `own` も、この 関数からは 1度も 呼びません
          （★verify ③が ここを 文字列で 見張ります）。
        ★ ★つまり「そこに 落とすと 勝てるか」は 1ビットも 出ていません。
        ★ 遊ぶ人が 考えるのは「どの 列に 落とすか」。★その 答えは 1つも 先取りしていません。

     ★ 光らせない とき（＝ 光りは 0個）：
       ・ねらっている 列が 無い（指を はなした・マウスが 盤の 外）
       ・★満杯の 列（★落ちる 穴が そもそも 無い ―― ルル §6-4 の 4番「満杯の 列も 光らせない」）
       ・ロボットの 番・コマが 落ちている あいだ（★ルル §6-4 の 5番）
       ・試合が 終わった あと（★そこからは 勝った 4つの 光りの 時間）
     ============================================================ */
  function setLanding(col) {
    if (!landEl) return;
    var on = (col != null) && b && !over && !busy && turn === ME && G.canDrop(h, col);
    if (!on) { landEl.classList.remove('is-on'); return; }
    var row = G.landRow(h, col);                     // ★ 重力だけ。★これ以外 何も 見ない
    var off = (geo.cell - geo.hole) / 2;
    landEl.style.left = (col * geo.cell + off) + 'px';
    landEl.style.top  = (row * geo.cell + off) + 'px';
    landEl.classList.add('is-on');
  }

  /* ★ ねらっている 列を 1か所で 決める（★指も マウスも ここを 通る）*/
  function aimAt(col) {
    held = col;
    setFlier(col);
    setLanding(col);
  }

  /* ★★ マウスを 乗せただけの とき（T131・社長の ご指示①）★★
     ★ 押していない ときだけ 効きます（★押している あいだは press が 正）。
     ★ 自分の 番で ないと 何も しません（★ロボットの 番に 動く／光るのは ルル §6-4 の 5番 違反）。 */
  function applyHover() {
    if (press) return;
    if (hoverX == null) { aimAt(null); return; }
    if (!b || over || busy || turn !== ME) { aimAt(null); return; }
    inRect = piecesEl.getBoundingClientRect();
    aimAt(hitCol(hoverX));
  }

  /* ★ 落とせない 列を さわった とき ―― 盤が ぷるっと ゆれるだけ（ルル §7-3）
     ★ 光でも 色でも ない ので 強調は 増えない。★文字は 1つも 出さない。 */
  function shakeNo() {
    frameEl.classList.remove('is-no');
    void frameEl.offsetWidth;
    frameEl.classList.add('is-no');
  }

  /* ============================================================
     ★ コマを 落とす（★見た目）
     ------------------------------------------------------------
     ★ 盤の 上（見えない ところ）から、いちばん 下の 空きまで 落ちる。
     ★ 1段 40ms・だんだん 速く（重力）・上限 240ms ＋ 着地 50ms（ルル §5-3）。
     ============================================================ */
  function dropPiece(c, who, done) {
    var r = G.landRow(h, c), i = G.drop(b, h, c, who);
    stat.plies++;
    var el = makePiece(i, who);
    var dist = r + 1;
    var ms = Math.min(TUNE.FALL_CAP, TUNE.FALL_STEP * dist);
    el.style.transform = 'translateY(' + (-dist * geo.cell) + 'px)';
    void el.offsetWidth;
    el.style.transitionDuration = ms + 'ms';
    el.classList.add('is-fall');
    el.style.transform = 'translateY(0)';
    later(function () {
      el.classList.remove('is-fall');
      el.style.transform = '';
      el.classList.add('is-land');
      later(function () { el.classList.remove('is-land'); }, TUNE.LAND_MS + 20);
      done(i);
    }, ms);
    return i;
  }

  /* ★ 1手 打つ（人も ロボットも ここを 通る）*/
  function playCol(c, who) {
    busy = true;
    held = null;
    setLanding(null);        // ★ T131：落ちはじめたら 光りは 消す（★落ちる 先は もう コマが 言っている）
    dropPiece(c, who, function (i) { afterDrop(i, who); });
    turn = 3 - who;
    setFlier(null);
  }

  /* ★ 落ちた **あと** に、はじめて 4つ 続いたかを 見る
     ⚠️ ここより 前に、4つ 並ぶかを 出す 経路は 1本も ありません（ルル §10-2 の 3番）。 */
  function afterDrop(i, who) {
    if (G.winAt(b, i, who)) { finish(who); return; }
    if (G.filled(h) >= G.N) { finish(0); return; }
    step();
  }

  /* ============================================================
     ★ 手番を 進める
     ============================================================ */
  function step() {
    if (over) return;
    /* ★★ T131：自分の 番に 戻ったら、★マウスが 乗っている 列へ コマを 帰す ★★
       ★ マウスは 動いていない ので pointermove が 1つも 来ません。
         ★ applyHover() を ここで 呼ばないと、コマは 待ち場所に 戻ったきりで、
           ★ 遊ぶ人は「1回 マウスを ゆらす」まで 追従が 死んで 見えます。
       ★ 指（タップ）では hoverX が null なので、★今までどおり 待ち場所に 戻ります。 */
    if (turn === ME) { busy = false; setFlier(null); setLanding(null); applyHover(); }
    else { busy = true; setFlier(null); setLanding(null); later(botMove, TUNE.BOT_THINK); }
  }

  /* ★ ロボットの 1手
     ⚠️ 渡すのは「いまの 盤・積み・自分の 色・深さ・読みきりの 線・さいころ・待てる 時間」だけ。
        ★人の 次の手も、人の 打ち方も、1つも 渡していません（ルル §10-2 の 4番）。 */
  function botMove() {
    if (over || !b) return;
    var lv = levelNow();
    var t0 = Date.now();
    var c = robot(b, h, BOT, lv.depth, lv.exact, rand, TUNE.BOT_BUDGET);
    var dt = Date.now() - t0;
    stat.botTotal += dt; stat.botMoves++;
    if (dt > stat.botWorst) stat.botWorst = dt;
    if (dt * 4 > TUNE.BOT_BUDGET) stat.budgetHits++;
    if (c < 0) { finish(0); return; }
    playCol(c, BOT);
  }

  /* ============================================================
     ★ 決着
     ------------------------------------------------------------
     ★ 4つの 並びを **全部** 数えて、**全部** 光らせます（ルル §8-2 の ⚠️）。
       ★ わなが 決まった とき、最後の 1手で 並びが 2つ できる ことが あります。
     ★ 端から 順に 1つずつ（120ms ずつ）。★同時に 光ると 4つの かたまりに 見えない。
     ★ ほかの コマは うすくする ―― ★足すのでは なく 引いて 目立たせる。
     ★★ これが この ゲームで ただ 1つの 光りです。★試合が 終わってから 出ます。
     ============================================================ */
  function finish(who) {
    over = true; busy = true; held = null;
    setFlier(null);
    setLanding(null);   // ★ T131：ここから 先は「勝った 4つ」の 光りの 時間。★2種類 出さない
    var wl = G.winLines(b);
    stat.winLines = wl.lines.length;

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
      if (!pieceEl[p2]) continue;
      if (when[p2] != null) {
        (function (el, ms) { later(function () { el.classList.add('is-win'); }, ms); })(pieceEl[p2], when[p2]);
        if (when[p2] > last) last = when[p2];
      } else if (wl.lines.length) {
        pieceEl[p2].classList.add('is-dim');
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
    b = G.start(); h = G.heights();
    turn = ME; over = false; busy = false; held = null;
    stat = { plies: 0, botWorst: 0, botTotal: 0, botMoves: 0, budgetHits: 0, winLines: 0 };
    if (!built) build();
    layout();
    paintAll();
    say(SAY.title);
    step();
  }

  /* ============================================================
     ★★★ 操作 ―― 判断2 の 本体 ★★★
     ------------------------------------------------------------
     ★ 1. 盤（または 上の コマ）に 指を 置く → その 列の 上に コマが 出る
     ★ 2. 指を すべらせる → コマが 列から 列へ 移る（★何度でも 直せる）
     ★ 3. 指を はなす → はなした 列に 落ちる
     ★ 指を 置いて すぐ はなせば「1回 おす」と 同じ 手数。★遅くしません。
     ⚠️ ドラッグでは ありません。「持ち上げて 運ぶ」のでは なく「★列を 選び直せる」だけ。
     ⚠️ ロボットの 番・コマが 落ちている あいだは 盤ぜんぶが 効かない。
        ★そして その あいだの おしは **ためない**（T62 §2-A の 事故。
          ★1試合に 最大 21回 この 待ちが 入ります）。
     ============================================================ */
  /* ★ どの 列を さわっているか
     ★ 指が 盤の 外へ 出たら、いちばん 近い 列に つく（ルル §7-5 の 3番）
       ―― ★指を 上に 出しても、下に 出しても 落とせます。 */
  function hitCol(clientX) {
    if (!inRect) return 0;
    var c = Math.floor((clientX - inRect.left) / geo.cell);
    if (c < 0) c = 0; else if (c >= COLS) c = COLS - 1;
    return c;
  }
  var press = null;
  function onDown(e) {
    if (e.pointerType === 'mouse') hoverX = e.clientX;
    if (!b || over || busy || turn !== ME) return;   // ★ ここで press を 作らない ＝ おしを ためない
    if (press) return;
    if (e.isPrimary === false) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    inRect = piecesEl.getBoundingClientRect();
    press = { id: e.pointerId };
    /* ★★ スマホ：ここが 社長の ご指示の「タップしたら 光る」★★
       ★ 指を 置いた その 瞬間に、コマが 列の 上へ 出て、落ちる 穴が 光ります。
       ★ ★まだ 落ちません。★指を すべらせれば 両方 ついてきます（判断2・そのまま）。 */
    aimAt(hitCol(e.clientX));
    try { holdEl.setPointerCapture(e.pointerId); } catch (err) {}
  }
  /* ★★ 動いた とき ―― 2つの 場合が あります（T131）★★
       ① 押している（press あり）… 今までどおり。★指も マウスも。★はなした 列に 落ちる
       ② ★押していない（press なし）… ★★マウスだけ。★乗せただけで コマが ついてくる
     ⚠️★ ②を 指にも 効かせては いけません。★指は「触れている あいだ」しか pointermove を
        出さない ので 実害は 出ませんが、★ペン等で 浮かせた ときに 動くのを 止める ため、
        ★pointerType を 見て マウスの ときだけ hoverX を 覚えます。 */
  function onMove(e) {
    if (!press) {
      if (e.pointerType !== 'mouse') return;
      hoverX = e.clientX;
      if (!b || over || busy || turn !== ME) return;
      var hc = hitCol(e.clientX);
      if (hc !== held) aimAt(hc);
      return;
    }
    if (e.pointerId !== press.id) return;
    e.preventDefault();
    var c = hitCol(e.clientX);
    if (c !== held) aimAt(c);
  }
  function onUp(e) {
    if (e.pointerType === 'mouse') hoverX = e.clientX;
    if (!press || e.pointerId !== press.id) return;
    press = null;
    try { holdEl.releasePointerCapture(e.pointerId); } catch (err) {}
    var c = held;
    held = null;
    if (!b || over || busy || turn !== ME || c == null) { setFlier(null); setLanding(null); applyHover(); return; }
    /* ★ 満杯の 列 ―― ★ゆれるだけ。★光りは そもそも 出ていません（setLanding が 断っている）*/
    if (!G.canDrop(h, c)) { shakeNo(); setFlier(null); setLanding(null); applyHover(); return; }
    playCol(c, ME);
  }
  function onCancel(e) {
    if (!press || e.pointerId !== press.id) return;
    press = null;
    held = null;
    try { holdEl.releasePointerCapture(e.pointerId); } catch (err) {}
    setFlier(null);
    setLanding(null);
    applyHover();          // ★ マウスなら カーソルの 下に 戻る／指なら 待ち場所へ
  }
  /* ★★ マウスが 盤から 出た とき（T131）★★
     ★ 社長の ご指示：「盤から 外れたら、コマは 待ち場所へ 戻り、光りも 消える」。
     ⚠️★ 指では 呼ばれても 害が ありません（hoverX は もともと null）。 */
  function onLeave(e) {
    if (e && e.pointerType && e.pointerType !== 'mouse') return;
    if (press) return;                 // ★ 押したまま 外へ 出るのは 判断2 の「いちばん 近い 列」
    hoverX = null;
    aimAt(null);
  }

  /* ============================================================
     ★ たしかめ（★画面には 1つも 出ない・トライと 社長へ）
     ============================================================ */

  /* ★ 何試合も 走らせて、エラー・反則・詰まりを 数える
       opt = { human: '＋ 止める' 等, level: 0〜4, seed: 数字 } */
  function autoPlay(n, opt) {
    n = n || 100; opt = opt || {};
    var hn = opt.human || '＋ 止める';
    var hf = humans.list[hn];
    if (!hf) { console.error('[四目並べ] 人の 打ち方が ちがいます：' + hn + '（' + Object.keys(humans.list).join(' / ') + '）'); return null; }
    var li = opt.level == null ? state.level : Math.max(0, Math.min(C.LEVELS.length - 1, opt.level | 0));
    var lv = C.LEVELS[li];
    var t0 = Date.now();
    var err = 0, r = null;
    try { r = C.runMany(G, robot, hf, lv, n, opt.seed == null ? 31337 : (opt.seed >>> 0)); }
    catch (ex) { err++; console.error('[四目並べ] autoPlay で エラー', ex); }
    if (!r) return { '★エラー': err };
    var out = {
      '盤': COLS + '列 × ' + ROWS + '段',
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
      '★4つの 並びが 2つ以上 できた 試合': (r.twoLines / n * 100).toFixed(1) + '%（' + r.twoLines + '件・最大 ' + r.maxLines + '本）',
      '★人の リーチを 止めた 割合': (r.blockRate * 100).toFixed(1) + '%（' + r.blockChance + '回 中）',
      '★わなを かけた 回数／試合': r.traps.toFixed(2) + '回',
      '★人の 番に 相手の リーチが ある／試合': r.reachPerGame.toFixed(1) + '回（うち 2つ同時 ' + r.doublePerGame.toFixed(2) + '回）',
      'かかった時間': ((Date.now() - t0) / 1000).toFixed(1) + '秒'
    };
    console.log('[四目並べ] autoPlay', out);
    return out;
  }

  /* ★ 5段 × 人の 打ち方5つ の 表（ルルの §4-2 が 再現できるか）*/
  function rates(games) {
    games = games || 200;
    var HN = Object.keys(humans.list), out = {};
    for (var i = 0; i < HN.length; i++) {
      var row = [];
      for (var k = 0; k < C.LEVELS.length; k++) {
        var r = C.runMany(G, robot, humans.list[HN[i]], C.LEVELS[k], games, 31337 + i * 131 + k * 17);
        row.push(C.LEVELS[k].label + ' ' + (r.win * 100).toFixed(1) + '%');
      }
      out[HN[i]] = row;
    }
    console.log('[四目並べ] rates（' + games + '試合ずつ）', out);
    return out;
  }

  /* ★ 1手に かかる 時間（★実機で 測る・ルル §10-2 の 7番）*/
  function speed(games) {
    games = games || 30;
    var out = {};
    for (var li = 0; li < C.LEVELS.length; li++) {
      var lv = C.LEVELS[li], rd = C.rng(555 + li), tot = 0, worst = 0, moves = 0;
      for (var g = 0; g < games; g++) {
        var bb = G.start(), hh = G.heights(), me = 1, guard = 0;
        while (guard++ < G.N && G.filled(hh) < G.N) {
          var c;
          if (me === 2) {
            var t0 = (performance && performance.now) ? performance.now() : Date.now();
            c = robot(bb, hh, me, lv.depth, lv.exact, rd, 0);
            var dt = ((performance && performance.now) ? performance.now() : Date.now()) - t0;
            tot += dt; moves++; if (dt > worst) worst = dt;
          } else c = humans.list['＋ 止める'](bb, hh, me, rd);
          var i = G.drop(bb, hh, c, me);
          if (G.winAt(bb, i, me)) break;
          me = 3 - me;
        }
      }
      out[lv.label] = '平均 ' + (tot / moves).toFixed(2) + 'ms ／ ★最大 ' + worst.toFixed(1) + 'ms（' + moves + '手）';
    }
    console.log('[四目並べ] speed（★実測・' + games + '試合ずつ）', out);
    return out;
  }

  /* ★ 画面の 実寸（★1列が 何px か ―― ルル §10-2 の 1番）*/
  function screenInfo() {
    var r = stageEl.getBoundingClientRect();
    var br = boardEl.getBoundingClientRect();
    return {
      '画面': window.innerWidth + '×' + window.innerHeight,
      '器の中身': geo.W + '×' + geo.H + '（青いわくの 内がわ ＝ ルル §1-2 の ものさし）',
      '青いわくの外がわ': Math.round(r.width) + '×' + Math.round(r.height),
      '盤': geo.boardW + '×' + geo.boardH + 'px',
      '★1マス': geo.cell + 'px',
      '★1列（はば × たて）': geo.colW + ' × ' + geo.colH + 'px',
      '★44pxに対して（はば）': (geo.colW / 44 * 100).toFixed(0) + '%',
      '★押す ところの 面積': (geo.colW * geo.colH).toLocaleString() + 'px²',
      'コマ': geo.piece + 'px', '穴': geo.hole + 'px',
      '次のコマ（帯）': geo.bar + 'px' + (geo.side ? '・右よこ' : '・盤の 上'),
      'はみ出し下': Math.round(br.bottom - r.bottom) + 'px（0以下ならOK）',
      'はみ出し右': Math.round(br.right - r.right) + 'px（0以下ならOK）',
      'はみ出し上': Math.round(r.top - br.top) + 'px（0以下ならOK）',
      'ページ縦スクロール': document.documentElement.scrollHeight > window.innerHeight,
      'ページ横スクロール': document.documentElement.scrollWidth > window.innerWidth
    };
  }

  /* ★ はみ出し・画面外を 測る（1場面ぶん）*/
  var TOUCH_SEL = '.back,.howto,.level-select,.start-button,.dialog-ok,.close-dialog,.hold';
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
      if (!el.offsetParent && el.tagName !== 'BODY') continue;      // 出ていない ものは 見ない
      var q = el.getBoundingClientRect();
      if (q.width === 0 || q.height === 0) continue;
      if (q.left < -0.5 || q.top < -0.5 || q.right > window.innerWidth + 0.5 || q.bottom > window.innerHeight + 0.5) {
        out.off++; out.offName.push(el.className || el.tagName);
      }
    }
    return out;
  }

  /* ★★ 4サイズの はみ出し しらべ（★250場面 以上・設計図 追記③）★★
     ★ 盤を いろいろな 埋まり具合に して、そのつど 測る。 */
  function fitTest(n) {
    n = n || 250;
    var rd = C.rng(70707), worstOver = 0, offTotal = 0, names = {}, sx = 0, sy = 0;
    var keepB = b, keepH = h, keepOver = over, keepTurn = turn;
    titleScreen.classList.add('hidden');
    playScreen.classList.remove('hidden');
    if (!built) build();
    for (var g = 0; g < n; g++) {
      b = G.start(); h = G.heights();
      var many = Math.floor(rd() * (G.N + 1)), me = 1;
      for (var t = 0; t < many; t++) {
        var op = G.openCols(h);
        if (!op.length) break;
        G.drop(b, h, op[Math.floor(rd() * op.length) % op.length], me);
        me = 3 - me;
      }
      over = false; turn = (g % 2) ? ME : BOT;
      layout(); paintAll();
      held = (g % 3 === 0) ? (g % COLS) : null;     // ★ 指で 持っている 場面も 混ぜる
      setFlier(held, true);
      var m = measureOnce();
      if (m.over > worstOver) worstOver = m.over;
      offTotal += m.off;
      for (var k = 0; k < m.offName.length; k++) names[m.offName[k]] = 1;
      if (m.scrollX) sx++;
      if (m.scrollY) sy++;
    }
    held = null;
    b = keepB; h = keepH; over = keepOver; turn = keepTurn;
    if (b) { layout(); paintAll(); setFlier(null, true); }
    var out = {
      '画面': window.innerWidth + '×' + window.innerHeight,
      '★1列': geo.colW + ' × ' + geo.colH + 'px',
      '調べた場面': n,
      '★はみ出し（一番 大きい）': worstOver + 'px',
      '★押すボタンが 画面外': offTotal + '件',
      '横スクロールが 出た場面': sx, '縦スクロールが 出た場面': sy
    };
    if (offTotal) out['画面外に 出た もの'] = Object.keys(names);
    console.log('[四目並べ] fitTest', out);
    return out;
  }

  /* ★ 画面に 出る 言葉を ぜんぶ 集める */
  function allWords() {
    var s = [];
    for (var k in SAY) if (SAY.hasOwnProperty(k)) s.push(SAY[k]);
    for (var k2 in RESULT_TITLE) if (RESULT_TITLE.hasOwnProperty(k2)) s.push(RESULT_TITLE[k2]);
    for (var i = 0; i < C.LEVELS.length; i++) s.push(C.LEVELS[i].label);
    s.push(document.body.textContent || '');
    s.push(document.title || '');
    var m = document.querySelectorAll('meta[name],meta[property]');
    for (var j = 0; j < m.length; j++) s.push(m[j].getAttribute('content') || '');
    return s.join('\n');
  }

  /* ★★ たしかめ ★★
       ① 反則0・途中で 止まる0・重力が 守られている
       ② ★ロボットに「人の 打ち方」が 1度も 渡っていない
       ③ ★指を はなす 前に「4つ 並ぶか」を 出す 経路が 1本も 無い（社長裁定 判断3）
       ④ ★★盤の 上で 光るのは「落ちる 穴 1つ」だけ（T131 で 書き直し・中身は 6つ）
       ⑤ ★画面に 手数・%・秒 の 数字が 1つも 無い
       ⑥ ★言っては いけない 言葉が 1つも 無い（商品名・リーチ・まん中・角）
       ⑦ ★盤の 大きさは 定数 2つ から しか 出ていない
       ⑧ ★寸法が ルルの 表と 合っている
       ⑨ ★盤に さわる 手は pointer で 作られている（click では ない）
       ⑩ ★4つの 並びは 全部 数えている（1つ 見つけて 止めていない）
       ⑪ ★★持っている コマが 盤の 中に 1pxも 入っていない（T129・横向きの 故障よけ） */
  function verify(n) {
    n = n || 200;
    var ng = [], t0 = Date.now();

    // ① ルールの 通り
    var r1 = C.runMany(G, robot, humans.list['＋ 止める'], C.LEVELS[state.level], n, 777);
    if (r1.illegal) ng.push('反則の 手が ' + r1.illegal + '件');
    if (r1.stall) ng.push('途中で 止まった 試合が ' + r1.stall + '件');
    // 重力（コマの 下は 必ず うまっている）
    var grav = 'OK';
    if (b) {
      for (var c0 = 0; c0 < COLS; c0++) {
        var seen = false;
        for (var r0 = 0; r0 < ROWS; r0++) {
          var v = b[r0 * COLS + c0];
          if (v) seen = true;
          else if (seen) { grav = 'NG'; ng.push('★浮いている コマが ある（列 ' + (c0 + 1) + '）'); break; }
        }
      }
    }

    // ② ロボットに 人の 打ち方が 渡っていないか
    var robotSrc = robot.src();
    var HN = Object.keys(humans.list), leak = [];
    for (var i = 0; i < HN.length; i++) if (robotSrc.indexOf(HN[i]) >= 0) leak.push(HN[i]);
    if (robotSrc.indexOf('human') >= 0 || robotSrc.indexOf('HUMAN') >= 0) leak.push('human');
    if (leak.length) ng.push('★ロボットの 中に 人の 打ち方が 入っている：' + leak.join('・'));

    // ③ ★指を はなす 前の 経路に「4つ 並ぶか」が 混じっていないか（社長裁定 判断3）
    /* ★ T131：★新しく できた 4つ（setLanding / aimAt / applyHover / onLeave）も ここに 入れます。
       ★★ 落ちる 穴の 光りが「4つ 並ぶか」を 1ビットも 見ていない ことを、★文字列で 見張ります。 */
    var uiSrc = String(onDown) + String(onMove) + String(onUp) + String(setFlier) +
                String(hitCol) + String(layout) + String(step) + String(paintAll) + String(placeAt) +
                String(setLanding) + String(aimAt) + String(applyHover) + String(onLeave);
    var bad3 = uiSrc.match(/winAt|winLines|threatCols|evalDiff|\bown\b|negamax|solve|LINES/g);
    if (bad3) ng.push('★指を はなす 前の 経路に ' + bad3.join('・') + ' が ある');

    /* ============================================================
       ④ ★★★ 盤の 上に 光っている ものは「落ちる 穴 1つ」だけ（T131 で 書き直し）★★★
       ------------------------------------------------------------
       ⚠️★ T130 までの ④は「盤の 上に 光っている ものが **1つも** 無い」でした。
          ★ T131 で 社長が「次に 置かれる 穴を 光らせて」と 決められた ので、
            ★★ 見張りを **甘くする のでは なく、正しい 形に 書き直します**。
       ★ 新しい ④が 見る のは 6つ：
         ④-a ★試合の 途中に .is-win / .is-dim が 1つも 無い（★勝った 4つは 試合後だけ）
         ④-b ★光っている 穴は **同時に 1つまで**（★2つ 光ったら 強調が 2種類 ＝ §5.5 違反）
         ④-c ★★その 光りの 場所が「重力どおりの 穴」と **1pxも ちがわない**
              （★★ちがったら、それは 重力 以外の 何かを 教えて いる ＝ 判断3 違反）
         ④-d ★満杯の 列を ねらった とき、光りは **0個**（ルル §6-4 の 4番）
         ④-e ★ロボットの 番に 光りが **0個**（ルル §6-4 の 5番）
         ④-f ★盤の 部品に :hover / :active の 決まりが 1つも 無い
              （★どの 列を ねらっているかは JS が 決める。★CSS に させると スマホで 誤発光する）
       ★ ④-b〜④-d は、★**本物の setLanding() を 通して** 7列 ぜんぶ 試します
         （★式を 書き写すと、setLanding が 変わった ときに 気づけない ―― ⑪番と 同じ 作法）。
       ============================================================ */
    var lit = 0, litCSS = [], lit4 = [];
    var lst = piecesEl ? piecesEl.querySelectorAll('.is-win,.is-dim') : [];
    if (!over) lit = lst.length;                                      // ④-a
    if (lit) ng.push('★試合の 途中なのに 光っている コマが ' + lit + '個 ある');

    if (landEl && b && piecesEl) {
      var keep4 = held, keepBusy = busy, keepTurn = turn, keepOver = over;
      var glowN = function () { return document.querySelectorAll('.landing.is-on').length; };
      /* ④-b・④-c・④-d ―― 7列 ぜんぶ */
      busy = false; over = false; turn = ME;
      for (var lc = 0; lc < COLS; lc++) {
        setLanding(lc);
        var n4 = glowN();
        if (n4 > 1) lit4.push((lc + 1) + '列目で 光りが ' + n4 + '個');           // ④-b
        if (!G.canDrop(h, lc)) {
          if (n4 !== 0) lit4.push('★満杯の ' + (lc + 1) + '列目が 光っている');   // ④-d
        } else {
          if (n4 !== 1) lit4.push((lc + 1) + '列目で 光りが ' + n4 + '個');
          else {
            var wantR = G.landRow(h, lc);
            var offL = (geo.cell - geo.hole) / 2;
            var gotL = Math.round(parseFloat(landEl.style.left));
            var gotT = Math.round(parseFloat(landEl.style.top));
            var wantL = Math.round(lc * geo.cell + offL);
            var wantT = Math.round(wantR * geo.cell + offL);
            if (gotL !== wantL || gotT !== wantT) {                               // ④-c
              lit4.push('★' + (lc + 1) + '列目の 光りが 重力の 穴と ちがう（' +
                        gotL + ',' + gotT + ' ／ 重力どおりは ' + wantL + ',' + wantT + '）');
            }
          }
        }
      }
      /* ④-e ―― ロボットの 番・落ちている 最中・試合の あと */
      turn = BOT; setLanding(0); if (glowN() !== 0) lit4.push('★ロボットの 番に 光っている');
      turn = ME; busy = true; setLanding(0); if (glowN() !== 0) lit4.push('★落ちている 最中に 光っている');
      busy = false; over = true; setLanding(0); if (glowN() !== 0) lit4.push('★試合が 終わった あとに 光っている');
      /* ★ 元に 戻す */
      held = keep4; busy = keepBusy; turn = keepTurn; over = keepOver;
      setLanding(held);
    }
    if (lit4.length) ng.push('★落ちる 穴の 光りが おかしい：' + lit4.join('／'));

    try {
      for (var s = 0; s < document.styleSheets.length; s++) {
        var rules = document.styleSheets[s].cssRules || [];
        for (var q = 0; q < rules.length; q++) {
          var sel = rules[q].selectorText || '';
          /* ⚠️ 「.back」は 上の帯の「◀ ゲームを選ぶ」です。★盤の 部品では ありません。
                だから ここでは 盤の 部品の 名前だけを 見ます
                （board-back / piece / hole / grid / flier ／ ★T131 で landing を 足した）。 */
          if (/:hover|:active/.test(sel) && /\.(piece|hole|grid|board|cell|flier|board-back|landing)\b/.test(sel)) litCSS.push(sel);
        }
      }
    } catch (e) {}
    if (litCSS.length) ng.push('★盤の 部品に 指を 置くと 変わる 決まりが ある：' + litCSS.join('・'));

    // ⑤ 手数・%・秒 の 数字
    var words = allWords();
    var badNum = words.match(/\d+\s*手|\d+\s*%|\d+\s*秒|\d+\s*ms/g);
    if (badNum) ng.push('★画面に 数字が 出ている：' + badNum.join('・'));

    // ⑥ ★言っては いけない 言葉（ルル §9-2）
    var badWord = words.match(/コネクトフォー|コネクト4|connect4|リーチ|三連|まん中|中央|定石|角/gi);
    if (badWord) ng.push('★画面の 言葉に「' + badWord.join('・') + '」が ある');

    // ⑦ 盤の 大きさ
    if (G.cols !== COLS || G.rows !== ROWS) ng.push('盤の 大きさが 定数と ちがう');

    /* ⑧ 寸法（ルル §1-3 の 表）
       ★★ T130：パソコンだけ 119 → **101px** に 下げました（社長「盤が デカすぎる」）。
          ★ 上限は yonmoku-core.js の DIM.CELL_MAX（＝ コマ 83px ＝ 大富豪の PC札の はば）。
          ★★ スマホ 3つ（50／43／37px）は **1pxも 動いていません** ―― あちらは はばで 決まる ため。 */
    var want = [[960, 750, 101], [355, 674, 50], [306, 446, 43], [772, 225, 37]], dimNG = [];
    for (var d = 0; d < want.length; d++) {
      var f = C.fitBoard(want[d][0], want[d][1], COLS, ROWS);
      if (f.cell !== want[d][2]) dimNG.push(want[d][0] + '×' + want[d][1] + ' → ' + f.cell + 'px（表は ' + want[d][2] + '）');
    }
    if (dimNG.length) ng.push('★寸法が 表と ちがう：' + dimNG.join('／'));

    // ⑨ 盤に さわる 手は pointer か
    var bootSrc = String(boot);
    var ptr = /pointerdown/.test(bootSrc) && /pointermove/.test(bootSrc) && /pointerup/.test(bootSrc);
    if (!ptr) ng.push('★盤の 操作が pointer で 作られていない');
    if (/holdEl\.addEventListener\('click'/.test(bootSrc)) ng.push('★盤に click が つながっている');

    // ⑩ 4つの 並びを 全部 数えているか
    var allLines = !/return[^;]*true/.test(String(G.winLines)) && /out\.push/.test(String(G.winLines));

    /* ⑪ ★★ 持っている コマが、盤の 中に 1pxも 入っていないか（T129）★★
       ★ 🧪トライ T128 の 🔴-1 が、二度と 戻らない ように ここで 見張ります。
       ★ 7列 ぜんぶ ＋ 待ち場所の 8か所を、★本物の setFlier() を 通して 測ります
         （★式を ここに 書き写すと、setFlier が 変わった ときに 気づけない）。 */
    var inside = [], offscr = [];
    if (playScreen && !playScreen.classList.contains('hidden') && flierEl) {
      var bdR = boardEl.getBoundingClientRect();
      var keep = held;
      var VW = document.documentElement.clientWidth, VH = document.documentElement.clientHeight;
      for (var fc = -1; fc < COLS; fc++) {
        setFlier(fc < 0 ? null : fc, true);
        var fR = flierEl.getBoundingClientRect();
        var name = fc < 0 ? '待ち場所' : (fc + 1) + '列目';
        if (fR.right > bdR.left + 0.5 && fR.left < bdR.right - 0.5 &&
            fR.bottom > bdR.top + 0.5 && fR.top < bdR.bottom - 0.5) inside.push(name);
        if (fR.top < 0 || fR.left < 0 || fR.right > VW || fR.bottom > VH) offscr.push(name);
      }
      setFlier(keep, true);
      if (inside.length) ng.push('★持っている コマが 盤の 中に 出ている：' + inside.join('・'));
      if (offscr.length) ng.push('★持っている コマが 画面の 外に 出ている：' + offscr.join('・'));
    }

    var out = {
      '盤': COLS + '列 × ' + ROWS + '段',
      '調べた試合': n,
      '★NG': ng.length,
      '①反則0・詰まり0・重力': (r1.illegal === 0 && r1.stall === 0 && grav === 'OK') ? 'OK' : 'NG',
      '②ロボットは 人の 打ち方を 知らない': leak.length ? 'NG' : 'OK',
      '③★はなす 前に 4つを 出す 経路が 無い': bad3 ? 'NG' : 'OK',
      /* ★ T131：意味が 変わりました ―― 「1つも 無い」→「落ちる 穴 1つ だけ」。
         ★ 見張りを 甘くしたのでは なく、★★中身は 6つに 増えて います（→ ④の 注意書き）。 */
      '④★盤で 光るのは 落ちる 穴 1つ だけ':
        (lit || lit4.length || litCSS.length) ? 'NG' : 'OK（穴 1つ・重力どおり・満杯は 0個）',
      '⑤画面に 手数・%・秒 が 無い': badNum ? 'NG' : 'OK',
      '⑥★言っては いけない 言葉が 無い': badWord ? 'NG' : 'OK',
      '⑦盤の 大きさは 定数 2つ': (G.cols === COLS && G.rows === ROWS) ? 'OK' : 'NG',
      /* ★ T130：パソコンだけ 119 → 101px（社長「盤が デカすぎる」）。スマホ 3つは そのまま。 */
      '⑧★寸法が 表どおり': dimNG.length ? 'NG' : 'OK（101 / 50 / 43 / 37px）',
      '⑨★操作は pointer': ptr ? 'OK' : 'NG',
      '⑩★4つの 並びは 全部 数える': allLines ? 'OK' : 'NG',
      '⑪★持っている コマが 盤の 中に 入っていない':
        (playScreen && !playScreen.classList.contains('hidden'))
          ? ((inside.length || offscr.length) ? 'NG' : 'OK（7列 ＋ 待ち場所）')
          : '―（遊ぶ 画面で 見てください）',
      '★4つの 並びが 2つ以上 できた 試合': (r1.twoLines / n * 100).toFixed(1) + '%（最大 ' + r1.maxLines + '本）',
      'かかった時間': ((Date.now() - t0) / 1000).toFixed(1) + '秒'
    };
    if (ng.length) out['NGの中身'] = ng;
    console.log('[四目並べ] verify', out);
    return out;
  }

  /* ★ いまの 盤（★たしかめ 専用）*/
  function now() {
    if (!b) return { '場面': 'まだ 始めていない', 'ロボットの つよさ': levelNow().label };
    var lines = [];
    for (var r = 0; r < ROWS; r++) {
      var line = [];
      for (var c = 0; c < COLS; c++) {
        var v = b[r * COLS + c];
        line.push(v === ME ? '●' : (v === BOT ? '○' : '・'));
      }
      lines.push(line.join(' '));
    }
    var open = G.openCols(h), on = [];
    for (var k = 0; k < open.length; k++) on.push(open[k] + 1);
    return {
      '盤': lines,
      '（●が 自分＝赤・○が ロボット＝黄色）': '',
      '落ちた コマ': G.filled(h) + ' / ' + G.N,
      '手番': turn === ME ? '自分（赤）' : 'ロボット（黄色）',
      '落とせる 列': on.join('・'),
      '★指で 持っている 列': held == null ? '―' : (held + 1),
      'ロボットの つよさ': levelNow().label,
      '打った手': stat.plies,
      '★ロボットの 1手（平均／最悪）': stat.botMoves
        ? (stat.botTotal / stat.botMoves).toFixed(0) + 'ms ／ ' + stat.botWorst + 'ms'
        : '―',
      '★待てる時間を 超えた 手': stat.budgetHits,
      '勝敗': over ? (G.winLines(b).who === ME ? '勝ち' : (G.winLines(b).who === BOT ? '負け' : '引き分け')) : '進行中',
      '★4つの 並び': over ? stat.winLines + '本' : '―',
      '★1列': geo.colW + ' × ' + geo.colH + 'px'
    };
  }

  /* ★ 盤を 直に 置く（★たしかめ 専用・画面からは 呼べない）
       rows … ROWS本の 文字列。●＝自分 ○＝ロボット ・＝空
       who  … 1＝自分から 2＝ロボットから */
  function set(list, who) {
    titleScreen.classList.add('hidden');
    playScreen.classList.remove('hidden');
    if (!built) build();
    clearTimers();
    b = G.start(); h = G.heights();
    for (var c = 0; c < COLS; c++) {
      var cnt = 0;
      for (var r = ROWS - 1; r >= 0; r--) {
        var line = (list[r] || '').replace(/\s/g, '');
        var ch = line.charAt(c);
        if (ch === '●' || ch === '○') { b[r * COLS + c] = (ch === '●') ? ME : BOT; cnt++; }
      }
      h[c] = cnt;
    }
    turn = who === 2 ? BOT : ME;
    over = false; busy = false; held = null;
    resultWrap.classList.add('hidden');
    layout(); paintAll(); setFlier(null, true);
    step();
    return now();
  }

  /* ★★ もどす ―― ★作りません（ルル §7-4）★★
     ------------------------------------------------------------
     ★ 四目並べの もどすは「必ず ずる」です。
       ★ 落とせる 列は ほぼ いつも 7列。★7回 押し直せば **必ず 全部 試せます**。
       ★ それは 遊びでは なく 総当たりです。
     ★ そして 判断2 の 操作に すると、もどす 必要が ほとんど 消えます
       ―― ★押し間違いは 指を はなす 前に 直せるからです。
     ★ だから この ゲームには undo を 1つも 置きません（★たしかめ用にも 作りません）。
     ============================================================ */

  /* ============================================================
     ★ 立ち上げ
     ============================================================ */
  function boot() {
    titleScreen = $('titleScreen'); playScreen = $('playScreen');
    stageEl = $('stage'); holdEl = $('hold'); nextRow = $('nextRow');
    frameEl = $('boardFrame'); boardEl = $('board');
    backEl = $('boardBack'); piecesEl = $('pieces'); gridEl = $('boardGrid');
    flierEl = $('flier'); landEl = $('landing');
    resultWrap = $('resultWrap'); resultBox = $('resultBox');
    brandEl = document.querySelector('.brand');
    padEl   = document.querySelector('.topbar-pad');

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

    /* ★★ 指を 受けるのは .hold（次の コマ ＋ 盤）★★
       ★ ルル §7-5 の 1番：pointerdown / pointermove / pointerup で 作る。
         ★ click は 使わない ―― スマホで 遅れる・取りこぼす（13本の 作法）。 */
    holdEl.addEventListener('pointerdown', onDown);
    holdEl.addEventListener('pointermove', onMove);
    holdEl.addEventListener('pointerup', onUp);
    holdEl.addEventListener('pointercancel', onCancel);
    /* ★★ T131：マウスを 乗せただけで コマが 追いてくる ―― その 出口 ★★
       ★ pointerleave は 中の 部品から あがって こない ので、.hold ぜんぶから 出た ときだけ 鳴ります。
       ★ ★CSS の :hover では 作りません（★スマホで 指を 置いた だけで 光って しまう）。 */
    holdEl.addEventListener('pointerleave', onLeave);
    /* ★★ T131：結果の 箱が 消えた あと の ため ★★
       ★ 「もう1回」を おすと、箱が 消えて、★カーソルの 下が いきなり 盤に なります。
         ★ マウスは 動いていない ので pointermove は 来ません。
         ★ ★pointerover は「下に ある ものが 変わった」ときに 鳴る ので、ここで 拾えます。
       ⚠️★ 指では 鳴っても onMove が すぐ 返します（★マウス以外は 見ない）。 */
    holdEl.addEventListener('pointerover', onMove);

    window.addEventListener('resize', function () { layout(); });
    window.addEventListener('orientationchange', function () { later(layout, 120); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* ============================================================
     ★ たしかめの 窓口（既存13本と 同じ 作法。★画面には 1つも 出ない）
     ------------------------------------------------------------
     ★ 名前は YONMOKU。★よその 会社の 商品名は 1文字も 使いません
       （ルル §9-2：画面・紹介文・タグ・フォルダ名 すべて）。
     ============================================================ */
  root.YONMOKU = {
    now: now,
    autoPlay: autoPlay,
    rates: rates,
    speed: speed,
    verify: verify,
    screen: screenInfo,
    fitTest: fitTest,
    geo: function () { return geo; },
    level: function (i) {
      if (i == null) return { 番号: state.level, 名前: levelNow().label };
      setLevel(i);
      return { 番号: state.level, 名前: levelNow().label };
    },
    seed: function (v) { if (v == null) return null; rand = C.rng(v >>> 0); return v >>> 0; },
    set: set,
    newGame: function () { newGame(); },
    humans: function () { return Object.keys(humans.list); },
    levels: function () { var o = []; for (var i = 0; i < C.LEVELS.length; i++) o.push(C.LEVELS[i].label); return o; },
    size: function () { return { 列: COLS, 段: ROWS }; },
    core: C
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
