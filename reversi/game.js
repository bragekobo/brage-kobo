/* ============================================================
   リバーシ（12本目）― 画面（UI）／ T89・コーダ
   ------------------------------------------------------------
   仕様は logs/T88_リバーシ_仕様_ルル.md ＋ 社長の裁定（5つ）が 正。

   ★★ 社長の裁定（5つ・厳守）★★
     1. ★6×6は 別の 1本（13本目）。★今回は 8×8だけ
     2. ★つよさ 5段。名前は「弱い／ふつう／強い／とても 強い／最強」
     3. ★初期値は 一番下の 段（弱い）
     4. ★置ける所を 光らせる。★ひっくり返る 枚数は 1つも 見せない
     5. ★ハッピーは 角の ことを 1文字も 言わない（★遊んだ あとも 言わない）

   ★★ この ファイルは「画面」だけ ★★
     ------------------------------------------------------------
     ルール・ロボット・寸法の 計算は ぜんぶ reversi-core.js に あります
     （＝ 勝率を 数える 側と 遊ぶ 側の ロボットが 同じ 1本の コード）。
     ★ 盤の 大きさは index.html の window.REVERSI_SIZE ただ1つ。
       この ファイルにも 8 や 6 は 1つも 書いていません。

   ★★ 帯（石の数）が この ゲームの 心臓です（社長の 申し送り）★★
     ------------------------------------------------------------
     ハッピーが 角の ことを 言わない ぶん、
     「たくさん 取っても 勝てない」は **帯が 実演** します。
       ★ 弱い（1手）ロボット … 中盤で 帯が ロボット側に ぐんぐん 伸びて、終盤で ひっくり返る
       ★ 最強（読みきり）　　 … 帯は ずっと 人の側に 伸びたまま、終盤で ごっそり 返される
     ★ だから 帯は「置いた その手で」動きます ―― ひっくり返る 石と 同じ 時間で。
       ここを 遅らせたり まとめたり すると、この ゲームの 一番 大事な ものが 消えます。

   ⚠️ 外部の ライブラリ・フォント・画像は 0。外への 通信も 0。
   ⚠️ 読む 画像も 0（12本で 初めて。設計図 §9 は この1本には かかりません）。
   ============================================================ */
(function (root) {
  'use strict';

  var C = root.REVERSI_CORE;
  if (!C) { console.error('[REVERSI] reversi-core.js が 読めていません'); return; }

  /* ★★★ 盤の 大きさは これ ただ1つ ★★★ */
  var SIZE = root.REVERSI_SIZE || 8;

  var G = C.makeCore(SIZE);
  var robot = C.makeRobot(G);
  var humans = C.makeHumans(G);     // ★ 勝率を 数える ときだけ 使う（遊ぶ 画面では 1度も 呼ばない）

  var ME = 1, BOT = 2;              // ★ 人が 先手（黒）。固定（ルル §4-4）

  /* ============================================================
     ★ 数字（TUNE）― 調整する 数字は ここ 1か所だけ
     ============================================================ */
  var TUNE = {
    /* ★ ロボットが 考える 間（ルル §8-1）。★手加減では ない ―― 人が 画面から 読む ぶん。
       ★ どの 段でも 同じ（弱い ロボットだけ 速い、に しない）。 */
    BOT_THINK: 600,

    /* ★ 1手に これ以上 かかりそうなら、1つ 浅い 読みで 返す（おそい 端末むけ）。
       ★ 速い 端末では 1度も 効かない ＝ 勝率表の とおりの 強さ。
       ⚠️ このパソコンでの 実測（logs/T89_リバーシ_検証.cjs speed）：
            弱い 1ms ／ ふつう 1ms ／ 強い 20ms ／ とても 強い 393ms ／ 最強 360ms（最悪値）
          平均は どの 段でも 65ms 以下。スマホは 3〜5倍 おそいと 見る。 */
    BOT_BUDGET: 500,

    /* ★ パス：番が 相手に うつる のを 見せる 時間（ルル §6-2。文字は 1文字も 出さない）*/
    PASS_MS: 900,

    /* ★ ひっくり返る 動き（ルル §1-6）
       置いた 所から 近い順に FLIP_STEP ずつ 遅らせて、1枚 FLIP_MS で 返す。
       ★ 全体で FLIP_CAP（0.4秒）を 超えない。
       ★ 実測（400試合）：1手で ひっくり返るのは 平均 2.25枚／★最大 14枚。
         14枚でも 200 + 15.4×13 ＝ 400ms ちょうどに 収まる（きざみを 自動で 詰める）。 */
    FLIP_MS: 200, FLIP_STEP: 30, FLIP_CAP: 400,

    TAP_SLOP: 14,       // おした所から これ以上 ずれたら その1回は 数えない
    RESULT_LOCK: 600    // 結果の 箱の 連打よけ（T62・T63 の 事故）
  };

  /* ============================================================
     ★ 画面に 出す 言葉 ―― ★ここ 1か所だけ（設計図 §9.6）
     ------------------------------------------------------------
     ★★ 社長裁定5：ハッピーは 角の ことを 1文字も 言いません。
        ★遊んだ あとも 言いません。★REVERSI.verify() が 毎回 走査して たしかめます。
     ★ 手数・%・秒 の 数字も 1つも 出しません。
     ============================================================ */
  var SAY = {
    title:  'はさんで ひっくり返そう！　多く とった方の 勝ちだよ',
    start:  'いくよー！　光った 所に 置いてね',
    win:    'やったー！　うまく はさんだね！',
    lose:   'おしい！　もう1回 やろ？',
    draw:   '引き分け！　いい しょうぶ だったね',
    again:  'いくよー！　はさんで ひっくり返そう！'
  };
  var RESULT_TITLE = { win: '勝ち！', lose: '負け…', draw: '引き分け' };

  /* ============================================================
     ★ 画面の 部品
     ============================================================ */
  var $ = function (id) { return document.getElementById(id); };
  var titleScreen, playScreen, stageEl, frameEl, boardEl, boardIn, bandEl,
      bandTrack, bandMe, bandBot, bandDot, resultWrap, resultBox,
      tallyEl, tallyMe, tallyBot;
  var tallyRAF = 0, tallyEnd = 0;   // ★ 数字を 帯に つれて 動かす あいだの コマ送り（＋ 保険の 時計）

  var cellEl = [];                  // 場所 → マスの div
  var discEl = [];                  // 場所 → 石（くるっと 返る ところ）
  var b = null;                     // 盤（0＝空 1＝自分 2＝ロボット）
  var turn = ME, over = false, busy = true, built = false;
  var hints = [];                   // ★ 光っている 場所（＝ 置ける所。★枚数は 1つも 持たない）
  var hist = [];                    // ★ 打った 手（★たしかめ 専用。画面には もどす ボタンを 出さない）
  var timers = [];
  var rand = C.rng(20260823);
  var geo = { cell: 44, board: 354, stone: 36, hint: 12, sideBand: false, W: 0, H: 0 };
  var stat = { passes: 0, plies: 0, botWorst: 0, botTotal: 0, botMoves: 0, budgetHits: 0 };

  var STORE_KEY = 'bragekobo.reversi' + SIZE + '.level';
  var state = { level: C.LEVEL_START };

  function later(fn, ms) { var id = setTimeout(fn, ms); timers.push(id); return id; }
  function clearTimers() { for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]); timers = []; }
  function say(t) { $('happyBubble').textContent = t; }
  function levelNow() { return C.LEVELS[state.level]; }

  /* ============================================================
     ★ つよさ（5段）― プルダウン 2か所（はじめの 画面・終わりの 画面）
     ------------------------------------------------------------
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
     ★ 寸法（ルル §1-3）― 割り算 1回。トランプの fit() は 要らない
     ------------------------------------------------------------
     ★ 数字は reversi-core.js の DIM と fitBoard() から しか 来ない。
       ここで px を 手で 書かない こと。
     ============================================================ */
  function layout() {
    if (!built) return;
    /* ★「器の中身」＝ 緑の わくの 内がわ（ルル §1-2 の 実測値と 同じ ものさし）。
       ★ わくの 太さは 画面の 大きさで 変わる ので、CSS から 読んで 引く
         （px を JS に 手で 書かない ―― 書くと 2か所に 同じ 数字が 生まれる）。 */
    var r = stageEl.getBoundingClientRect();
    var fs = getComputedStyle(frameEl);
    var insetX = parseFloat(fs.paddingLeft) + parseFloat(fs.paddingRight) +
                 parseFloat(fs.borderLeftWidth) + parseFloat(fs.borderRightWidth);
    var insetY = parseFloat(fs.paddingTop) + parseFloat(fs.paddingBottom) +
                 parseFloat(fs.borderTopWidth) + parseFloat(fs.borderBottomWidth);
    var W = Math.floor(r.width - insetX), H = Math.floor(r.height - insetY);

    /* ★★ 石の数の 1行ぶんを、先に 盤の 取り分から 引く（T91）★★
       ------------------------------------------------------------
       ★ px を 手で 書かない ―― 実際に 出ている 行を 測って 引く
         （字の 大きさが 変わっても ひとりでに 合う）。
       ★ たて向き … 高さを 引く ／ 横向き（帯が 右よこ）… はばを 引く。
       ★ これを やらないと 盤が 1行ぶん はみ出す（＝ スクロールが 出る）。 */
    var side0 = C.fitBoard(W, H, SIZE).sideBand;
    stageEl.classList.toggle('is-side', side0);   // ★ 測る 前に 置き方を そろえる（横向きでは たてに 積む）
    var tal = tallyNeed();
    var f = C.fitBoard(side0 ? (W - tal.w) : W, side0 ? H : (H - tal.h), SIZE);
    /* ★ 引いた せいで たて／よこの 置き方が 変わる ことが ある（H が 320px の きわ）。
         その ときは 新しい 置き方で もう一度 だけ 計算し直す。 */
    if (f.sideBand !== side0) {
      side0 = f.sideBand;
      f = C.fitBoard(side0 ? (W - tal.w) : W, side0 ? H : (H - tal.h), SIZE);
    }
    geo.W = W; geo.H = H; geo.tallyW = tal.w; geo.tallyH = tal.h;
    /* ★ 一番外の マスだけ、緑の わくの 余白ぶん 押せる 範囲を 広げる（→ hitAt）*/
    geo.pad = Math.min(parseFloat(fs.paddingLeft), parseFloat(fs.paddingTop)) || 0;
    geo.cell = f.cell; geo.board = f.board; geo.stone = f.stone; geo.hint = f.hint;
    geo.bar = f.bar; geo.gap = f.gap; geo.frame = f.frame; geo.sideBand = f.sideBand;

    var css = document.documentElement.style;
    css.setProperty('--cell',  f.cell + 'px');
    css.setProperty('--stone', f.stone + 'px');
    css.setProperty('--hint',  f.hint + 'px');
    css.setProperty('--bar',   f.bar + 'px');   // ★ 帯の 太さ。線も 手番の 丸も ここから 割り出す

    boardEl.style.width = f.board + 'px';
    boardEl.style.height = f.board + 'px';
    boardEl.style.borderWidth = f.frame + 'px';

    stageEl.classList.toggle('is-side', f.sideBand);
    /* ★ 帯：たて向きは 盤の 下に よこ長 ／ 横向きの 低い 画面では 盤の 右に たて長
         （たてを 食わせない ため・ルル §1-4） */
    if (f.sideBand) {
      bandEl.style.width = f.bar + 'px';
      bandEl.style.height = f.board + 'px';
      bandEl.style.marginLeft = f.gap + 'px';
      bandEl.style.marginTop = '0';
    } else {
      bandEl.style.width = f.board + 'px';
      bandEl.style.height = f.bar + 'px';
      bandEl.style.marginLeft = '0';
      bandEl.style.marginTop = f.gap + 'px';
    }

    for (var p = 0; p < G.N; p++) {
      var e = cellEl[p];
      e.style.left = ((p % SIZE) * f.cell) + 'px';
      e.style.top  = (((p / SIZE) | 0) * f.cell) + 'px';
    }
    paintBand(true);
  }

  /* ============================================================
     ★ 盤を 作る（1回だけ）
     ------------------------------------------------------------
     マス1つ ＝ <div class="cell"><i class="hint"></i><span class="pop"><span class="disc">…
       ★ ますの 線は マスの 中（内がわの 影）に 描く ＝ 場所を 食わない。
       ★ 盤の 上に 文字は 1つも 置かない（12本で 初めて）。
     ============================================================ */
  function build() {
    boardIn.innerHTML = '';
    cellEl = []; discEl = [];
    for (var p = 0; p < G.N; p++) {
      var e = document.createElement('div');
      e.className = 'cell';
      e.innerHTML = '<i class="hint"></i><span class="pop"><span class="disc">' +
                    '<i class="f me"></i><i class="f bot"></i></span></span>';
      boardIn.appendChild(e);
      cellEl.push(e);
      discEl.push(e.querySelector('.disc'));
    }
    built = true;
  }

  /* ============================================================
     ★ 描く
     ============================================================ */
  function paintCell(p, instant) {
    var e = cellEl[p], v = b[p], d = discEl[p];
    if (instant) { e.classList.add('no-anim'); d.style.transitionDelay = '0ms'; }
    if (v === 0) { e.classList.remove('on'); e.classList.remove('w'); }
    else { e.classList.add('on'); e.classList.toggle('w', v === BOT); }
    if (instant) { void e.offsetWidth; e.classList.remove('no-anim'); }
  }
  function paintAll(instant) { for (var p = 0; p < G.N; p++) paintCell(p, instant); }

  /* ★★ 光り（置ける所）★★
     ------------------------------------------------------------
     ⚠️ ここには「何枚 ひっくり返るか」を 出す 経路が 1本も ありません（社長裁定4・ルル §5-6）。
        受け取るのは **場所の 一覧** だけ。gain() を 1度も 呼びません。
        ★ REVERSI.verify() が この 関数の 中身を 走査して たしかめます。
     ⚠️ 光るのは 自分の 番だけ。ロボットの 番は 1つも 光りません。
     ⚠️ 点滅させません（「まだ 決まっていない」を 表す ものなので 動かさない）。 */
  function paintHints(list) {
    for (var p = 0; p < G.N; p++) cellEl[p].classList.remove('hi');
    if (!list) return;
    for (var k = 0; k < list.length; k++) cellEl[list[k]].classList.add('hi');
  }

  /* ★★ 帯（石の数の つな引き）★★
     ------------------------------------------------------------
     ★ 自分は 左から 右へ、ロボットは 右から 左へ 伸びる（横向きの 画面では 下から／上から）。
     ★ 長さは 石の数 ÷ マスの数。★盤が 埋まるまで 真ん中は 空いたまま。
     ★ まん中の 線は 引きません（盤が 埋まらずに 終わる ことが ある ―― ルル §1-5）。
     ★ 点数の 数字も 1つも 出しません。★帯の 長さが そのまま 点数。
     ★ 帯の 上の 小さい 丸が「いま 打つ人」。★これが パスを 文字ゼロで 伝えます。 */
  function paintBand(instant) {
    if (!b) return;
    var mine = G.count(b, ME), bot = G.count(b, BOT);
    var len = geo.board;                          // ★ 帯の 長さ ＝ 盤の 一辺
    var pm = (mine / G.N) * len, pb = (bot / G.N) * len;
    if (instant) bandEl.classList.add('no-anim');
    if (geo.sideBand) {
      bandMe.style.width = ''; bandBot.style.width = '';
      bandMe.style.height = pm + 'px';
      bandBot.style.height = pb + 'px';
      bandDot.style.transform = 'translateY(' + (turn === ME ? (len - geo.bar) : 0) + 'px)';
    } else {
      bandMe.style.height = ''; bandBot.style.height = '';
      bandMe.style.width = pm + 'px';
      bandBot.style.width = pb + 'px';
      bandDot.style.transform = 'translateX(' + (turn === ME ? 0 : (len - geo.bar)) + 'px)';
    }
    bandDot.classList.toggle('is-bot', turn === BOT);
    if (instant) { void bandEl.offsetWidth; bandEl.classList.remove('no-anim'); }
    syncTally(instant);                       // ★ 数字も 同じ 1か所から 出す（T91）
  }

  /* ★★ 石の数（帯の すぐ下の 1行）★★ ―― T91・社長指示
     ------------------------------------------------------------
     社長の 言葉：「ゲージの下に 石の数ってのが 分かるように
                   『石の数』の 文字と 数字を 入れて」
     ★★ 数字は 帯と **同じ 時間で** 動きます ★★
       ―― ずるい やり方に 見えて、これが 一番 確実：
          数字を べつに 動かすのでは なく、**伸びている 帯の 実寸を 毎コマ 読んで**
          「帯の 長さ ÷ 盤の 一辺 × マスの数」を 出す。
          ★ 帯と 数字は 同じ 1つの 動きを 見ている ので、ずれようが ない。
          ★ 帯の 速さ（--band-ms ＝ 石が ひっくり返る 時間）を 変えても、
            数字は だまって ついてくる ―― 直す 場所が 2か所に 増えない。
     ⚠️ 出すのは 石の数 だけ。手数も、読みの 深さも、
        どちらが 勝ちそうかの 評価値も、1つも 足さない こと。 */
  function setTally(mine, bot) {
    if (!tallyMe) return;
    var a = String(mine), c = String(bot);
    if (tallyMe.textContent !== a) tallyMe.textContent = a;
    if (tallyBot.textContent !== c) tallyBot.textContent = c;
  }
  /* いま 画面に 出ている 帯の 長さ → 石の数 に 直す */
  function tallyFromBand() {
    var len = geo.board || 1;
    var rm = bandMe.getBoundingClientRect(), rb = bandBot.getBoundingClientRect();
    var lm = geo.sideBand ? rm.height : rm.width;
    var lb = geo.sideBand ? rb.height : rb.width;
    setTally(Math.round(lm / len * G.N), Math.round(lb / len * G.N));
  }
  function syncTally(instant) {
    if (!b || !tallyMe) return;
    if (tallyRAF) { cancelAnimationFrame(tallyRAF); tallyRAF = 0; }
    if (tallyEnd) { clearTimeout(tallyEnd); tallyEnd = 0; }
    var mine = G.count(b, ME), bot = G.count(b, BOT);
    /* ★ ほかの タブに 行っている あいだは、ブラウザが 帯の 動きも コマ送りも 止める。
         見えていない ものを 動かす 意味は ない ので、その ときは すぐ 正しい 数を 入れる
         ―― ★これで「動いていない ときの 数字は、いつも 盤と 同じ」が いつでも 成り立つ。 */
    if (instant || document.hidden || !root.requestAnimationFrame) { setTally(mine, bot); return; }
    /* ★ 動く 時間は 帯と 同じ ところ（--band-ms）から 読む。★ここでも 数字を 書かない。 */
    var ms = parseFloat(bandEl.style.getPropertyValue('--band-ms')) ||
             parseFloat(getComputedStyle(bandEl).getPropertyValue('--band-ms')) || TUNE.FLIP_MS;
    var t0 = Date.now();
    var tick = function () {
      if (Date.now() - t0 >= ms) { setTally(mine, bot); tallyRAF = 0; return; }
      tallyFromBand();
      tallyRAF = requestAnimationFrame(tick);
    };
    tallyRAF = requestAnimationFrame(tick);
    /* ★ 保険：ほかの タブに 行っている あいだ、ブラウザは コマ送りを 止める。
         その ときでも 数字が 途中の まま 残らない ように、時計でも 締める。
         ★ ふだんは 上の コマ送りが 先に 終わっている ので、ここは 同じ 数を 入れ直すだけ。 */
    tallyEnd = setTimeout(function () {
      tallyEnd = 0;
      if (tallyRAF) { cancelAnimationFrame(tallyRAF); tallyRAF = 0; }
      setTally(mine, bot);
    }, ms + 60);
  }
  /* ★ 行の 大きさ（＋ 帯との すきま）。★盤の 取り分から 引く ため に 測る。
       ★ px を 手で 書かない ―― CSS の 値が 変われば ここも ひとりでに 変わる。 */
  function tallyNeed() {
    if (!tallyEl) return { w: 0, h: 0 };
    var r = tallyEl.getBoundingClientRect();
    if (!r.width && !r.height) return { w: 0, h: 0 };
    var cs = getComputedStyle(tallyEl);
    return {
      w: Math.ceil(r.width  + (parseFloat(cs.marginLeft) || 0)),
      h: Math.ceil(r.height + (parseFloat(cs.marginTop)  || 0))
    };
  }

  /* ★ 押しても 効かない ところ ―― ぷるっと ゆれる
       （ピラミッド・神経衰弱と 同じ 部品・同じ 意味。★光でも 色でも ないので 強調は 増えない）*/
  function shakeNo(p) {
    var e = cellEl[p];
    e.classList.remove('is-no'); void e.offsetWidth; e.classList.add('is-no');
  }

  /* ============================================================
     ★ 石を 置く ―― ★1回の おしで 完結（青わくは 作らない・ルル §7-2）
     ============================================================ */
  function flipPlan(p, fl) {
    /* 置いた 所から 近い順。★全体で FLIP_CAP を 超えない ように きざみを 詰める。 */
    var pr = (p / SIZE) | 0, pc = p % SIZE;
    var arr = fl.slice().sort(function (x, y) {
      var dx = Math.max(Math.abs(((x / SIZE) | 0) - pr), Math.abs((x % SIZE) - pc));
      var dy = Math.max(Math.abs(((y / SIZE) | 0) - pr), Math.abs((y % SIZE) - pc));
      return dx - dy;
    });
    var k = arr.length;
    var step = k <= 1 ? 0 : Math.min(TUNE.FLIP_STEP, (TUNE.FLIP_CAP - TUNE.FLIP_MS) / (k - 1));
    return { arr: arr, step: step, total: TUNE.FLIP_MS + step * Math.max(0, k - 1) };
  }

  function placeStone(p, who) {
    var fl = G.play(b, p, who);
    hist.push({ p: p, who: who, fl: fl });
    stat.plies++;

    hints = []; paintHints(null);
    busy = true;

    /* 置いた 石（ふくらんで 出る）*/
    discEl[p].style.transitionDelay = '0ms';
    paintCell(p, false);

    /* ひっくり返る 石（近い順に 少しずつ 遅らせて）*/
    var plan = flipPlan(p, fl);
    for (var k = 0; k < plan.arr.length; k++) {
      var q = plan.arr[k];
      discEl[q].style.transitionDelay = Math.round(plan.step * k) + 'ms';
      paintCell(q, false);
    }

    /* ★ 帯は 石が 返るのと 同じ 時間で 動く（★ここが この ゲームの 心臓）*/
    bandEl.style.setProperty('--band-ms', Math.round(plan.total) + 'ms');
    paintBand(false);

    later(function () {
      for (var k2 = 0; k2 < plan.arr.length; k2++) discEl[plan.arr[k2]].style.transitionDelay = '0ms';
      turn = 3 - who;
      paintBand(false);
      step(false);
    }, Math.round(plan.total) + 20);
  }

  /* ============================================================
     ★★ 手番を 進める ―― パスも ここ 1か所で 起きる
     ------------------------------------------------------------
     ★ パスの 見せ方（ルル §6-2・★文字は 1文字も 出さない）：
        ① 置ける所が 1つも 光らない　← §5 の 光りが そのまま 引き受ける
        ② 手番の 石（帯の 上の 小さい 丸）が、すっと 相手側へ すべる
        ③ 0.9秒 待って、つぎの人が 打つ
     ============================================================ */
  function step(quick) {
    if (over) return;
    var ms = G.moveList(b, turn);
    if (!ms.length) {
      if (!G.moveList(b, 3 - turn).length) { finish(); return; }
      /* ★ パス ―― 石が すべる だけ。「パス」も「置けません」も 出さない。 */
      stat.passes++;
      turn = 3 - turn;
      paintHints(null);
      paintBand(false);
      busy = true;
      later(function () { step(true); }, TUNE.PASS_MS);
      return;
    }
    if (turn === ME) {
      busy = false;
      hints = ms;
      paintHints(hints);          // ★ 場所だけ。枚数は 1つも 渡していない
    } else {
      busy = true;
      paintHints(null);
      later(botMove, quick ? 60 : TUNE.BOT_THINK);
    }
  }

  /* ★ ロボットの 1手
     ⚠️ 渡すのは「いまの 盤・自分の 色・置ける所・深さ・読みきりの 線・さいころ・待てる時間」だけ。
        ★人の 次の手も、人の 打ち方も、1つも 渡していません（ルル §10-2 の 4番）。 */
  function botMove() {
    if (over || !b) return;
    var ms = G.moveList(b, BOT);
    if (!ms.length) { step(false); return; }
    var lv = levelNow();
    var t0 = Date.now();
    var p = robot(b, BOT, ms, lv.depth, C.exactFromFor(SIZE, lv), rand, TUNE.BOT_BUDGET);
    var dt = Date.now() - t0;
    stat.botTotal += dt; stat.botMoves++;
    if (dt > stat.botWorst) stat.botWorst = dt;
    if (dt * 4 > TUNE.BOT_BUDGET) stat.budgetHits++;
    placeStone(p, BOT);
  }

  /* ============================================================
     ★ 決着（★両方が 打てなく なったら。盤が 埋まっていなくても）
     ------------------------------------------------------------
     ★ 長い方の 勝ち。同じ 長さなら 引き分け。それだけ（ルル §8-2）。
     ============================================================ */
  function finish() {
    over = true; busy = true;
    hints = []; paintHints(null);
    var mine = G.count(b, ME), bot = G.count(b, BOT);
    var kind = mine > bot ? 'win' : (mine < bot ? 'lose' : 'draw');
    $('resultTitle').textContent = RESULT_TITLE[kind];
    $('resultTitle').classList.toggle('is-quiet', kind !== 'win');
    /* ★ 結果の 箱に 出す 文字は「勝ち！／負け…／引き分け」だけ。
       ★ 石の 数も、何枚 差かも 書かない ―― 帯を 見れば 分かる（ルル §8-3）。
       ★ そして ここでも 角の ことは 1文字も 言わない（社長裁定5）。 */
    $('resultSay').textContent = '';
    $('resultSay').classList.add('hidden');
    say(SAY[kind]);
    if (kind === 'win') {
      var cat = $('happyCat');
      cat.classList.remove('is-jump'); void cat.offsetWidth; cat.classList.add('is-jump');
    }
    fillLevelSelect($('levelResult'));
    resultWrap.classList.remove('hidden');
    resultBox.classList.add('is-locked');
    later(function () { resultBox.classList.remove('is-locked'); }, TUNE.RESULT_LOCK);
  }

  /* ============================================================
     ★ 新しい 試合（★「配り」が 存在しない ―― はじめの 形は いつも 同じ）
     ============================================================ */
  function newGame(fromAgain) {
    clearTimers();
    resultWrap.classList.add('hidden');
    b = G.start();
    turn = ME; over = false; busy = false; hints = []; hist = [];
    stat = { passes: 0, plies: 0, botWorst: 0, botTotal: 0, botMoves: 0, budgetHits: 0 };
    if (!built) build();
    layout();
    paintAll(true);
    paintBand(true);
    say(fromAgain ? SAY.again : SAY.start);
    step(false);
  }

  /* ============================================================
     ★ 操作（ピラミッド・神経衰弱の「おして えらぶ」を そのまま）
     ------------------------------------------------------------
     ★ 1回 おす → そこに 石が 置かれ、はさんだ 石が ひっくり返る。★ドラッグでは ない。
     ★ 青わくは 作らない（おした 瞬間に 画面で 一番 大きい 変化が 起きる ―― ルル §7-2）。
     ⚠️ ロボットの 番・石が ひっくり返っている あいだは 盤ぜんぶが 効かない。
        ★そして その あいだの おしは **ためない**（T62 §2-A の 事故）。
     ============================================================ */
  /* ★ どの マスを おしたか
     ★ 盤の ふち（緑の わくの 余白）ぶんだけ、外がわに 押せる 範囲を 広げる
       ―― 一番外の マス（64マス中 28マス）が 指の 端で 外れない ように。
       ★ となりに マスが ある 側は 1pxも 広げない（＝ 誤爆は 増えない）。
       ★ 既存11本の 作法（神経衰弱の padX / padT / padB）と 同じ 考え方。 */
  function hitAt(x, y) {
    var side = geo.cell * SIZE, pad = geo.pad || 0;
    if (x < -pad || x > side + pad || y < -pad || y > side + pad) return -1;
    var c = Math.floor(x / geo.cell), r = Math.floor(y / geo.cell);
    if (c < 0) c = 0; else if (c >= SIZE) c = SIZE - 1;
    if (r < 0) r = 0; else if (r >= SIZE) r = SIZE - 1;
    return r * SIZE + c;
  }
  var press = null;
  function onDown(e) {
    if (!b || over || busy || turn !== ME) return;   // ★ ここで press を 作らない ＝ おしを ためない
    if (press) return;
    if (e.isPrimary === false) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    var r = boardIn.getBoundingClientRect();
    var x = e.clientX - r.left, y = e.clientY - r.top;
    var p = hitAt(x, y);
    if (p < 0) return;
    e.preventDefault();
    press = { id: e.pointerId, pos: p, out: false, sx: x, sy: y, rl: r.left, rt: r.top };
    try { frameEl.setPointerCapture(e.pointerId); } catch (err) {}
  }
  function onMove(e) {
    var d = press; if (!d || e.pointerId !== d.id) return;
    var dx = e.clientX - d.rl - d.sx, dy = e.clientY - d.rt - d.sy;
    if (dx * dx + dy * dy > TUNE.TAP_SLOP * TUNE.TAP_SLOP) d.out = true;
  }
  function onUp(e) {
    var d = press; if (!d || e.pointerId !== d.id) return;
    press = null;
    try { frameEl.releasePointerCapture(e.pointerId); } catch (err) {}
    if (d.out) return;
    if (!b || over || busy || turn !== ME) return;
    tapCell(d.pos);
  }
  function onCancel(e) {
    var d = press; if (!d || e.pointerId !== d.id) return;
    press = null;
    try { frameEl.releasePointerCapture(e.pointerId); } catch (err) {}
  }

  function tapCell(p) {
    for (var k = 0; k < hints.length; k++) if (hints[k] === p) { placeStone(p, ME); return; }
    shakeNo(p);            // ★ 置けない 所 ―― ぷるっと ゆれるだけ。取り返しの つく 失敗
  }

  /* ============================================================
     ★ たしかめ（★画面には 1つも 出ない・トライと 社長へ）
     ============================================================ */

  /* ★ 何試合も 走らせて 勝率と 石の数を 数える
       opt = { human: '角を 知っている' 等, level: 0〜4, seed: 数字 } */
  function autoPlay(n, opt) {
    n = n || 100; opt = opt || {};
    var hn = opt.human || 'たくさん とる';
    var hf = humans[hn];
    if (!hf) { console.error('[REVERSI] 人の 打ち方が ちがいます：' + hn + '（' + Object.keys(humans).join(' / ') + '）'); return null; }
    var li = opt.level == null ? state.level : Math.max(0, Math.min(C.LEVELS.length - 1, opt.level | 0));
    var lv = C.LEVELS[li];
    var t0 = Date.now();
    var r = C.runMany(G, robot, hf, lv, n, opt.seed == null ? 31337 : (opt.seed >>> 0));
    var out = {
      '盤': SIZE + '×' + SIZE,
      '試合数': n,
      '人の 打ち方': hn,
      'ロボットの つよさ': lv.label,
      '★エラー（きまりを 破った手）': r.illegal,
      '★石の合計が おかしい試合': r.badCount,
      '人の勝ち': (r.win * 100).toFixed(1) + '%',
      '引き分け': (r.draw * 100).toFixed(1) + '%',
      '負け': (r.lose * 100).toFixed(1) + '%',
      '手数（両方あわせて）': r.plies.toFixed(1) + '手',
      '★パス／試合': r.passes.toFixed(2) + '回',
      '盤が 埋まらずに 終わった': (r.notFull * 100).toFixed(1) + '%',
      'かかった時間': ((Date.now() - t0) / 1000).toFixed(1) + '秒'
    };
    console.log('[REVERSI] autoPlay', out);
    return out;
  }

  /* ★ 5段 × 人の 打ち方4つ の 表（ルルの §3-6 が 再現できるか）*/
  function rates(games) {
    games = games || 100;
    var HN = Object.keys(humans), out = {};
    for (var h = 0; h < HN.length; h++) {
      var row = [];
      for (var k = 0; k < C.LEVELS.length; k++) {
        var r = C.runMany(G, robot, humans[HN[h]], C.LEVELS[k], games, 31337 + h * 131 + k * 17);
        row.push(C.LEVELS[k].label + ' ' + (r.win * 100).toFixed(1) + '%');
      }
      out[HN[h]] = row;
    }
    console.log('[REVERSI] rates（' + SIZE + '×' + SIZE + '・' + games + '試合ずつ）', out);
    return out;
  }

  /* ★ 画面の 実寸 */
  function screenInfo() {
    var r = stageEl.getBoundingClientRect();
    var br = boardEl.getBoundingClientRect();
    return {
      '画面': window.innerWidth + '×' + window.innerHeight,
      '器の中身': geo.W + '×' + geo.H + '（緑のわくの 内がわ ＝ ルル §1-2 の ものさし）',
      '緑のわくの外がわ': Math.round(r.width) + '×' + Math.round(r.height),
      '盤': geo.board + '×' + geo.board + 'px',
      '★1マス': geo.cell + 'px',
      '★44pxに対して': (geo.cell / 44 * 100).toFixed(0) + '%',
      '石': geo.stone + 'px', '光りの丸': geo.hint + 'px',
      '帯': geo.sideBand ? ('たて長・右よこ ' + geo.bar + 'px') : ('よこ長・下 ' + geo.bar + 'px'),
      '★石の数の行': geo.sideBand
        ? ('右よこ ' + geo.tallyW + 'px（たてを 1pxも 食わない）')
        : ('帯の 下 ' + geo.tallyH + 'px（すきま こみ）'),
      '★石の数の 表示': (tallyMe ? tallyMe.textContent : '―') + ' ／ ' + (tallyBot ? tallyBot.textContent : '―'),
      '押し間違いの余裕': '±' + (geo.cell / 2).toFixed(1) + 'px',
      'はみ出し下': Math.round(br.bottom - r.bottom) + 'px（0以下ならOK）',
      'はみ出し右': Math.round(br.right - r.right) + 'px（0以下ならOK）',
      'ページ縦スクロール': document.documentElement.scrollHeight > window.innerHeight,
      'ページ横スクロール': document.documentElement.scrollWidth > window.innerWidth
    };
  }

  /* ★ 画面に 出る 言葉を ぜんぶ 集める（せりふ・ボタン・遊び方・段の名前・いま 出ている もの）*/
  function allWords() {
    var s = [];
    for (var k in SAY) if (SAY.hasOwnProperty(k)) s.push(SAY[k]);
    for (var k2 in RESULT_TITLE) if (RESULT_TITLE.hasOwnProperty(k2)) s.push(RESULT_TITLE[k2]);
    for (var i = 0; i < C.LEVELS.length; i++) s.push(C.LEVELS[i].label);
    s.push(document.body.textContent || '');
    s.push(document.title || '');
    return s.join('\n');
  }

  /* ★★ たしかめ ★★
       ① 石の 合計が いつも 正しい・きまりを 破った 手が 0
       ② ★ロボットに「人の 打ち方」が 1度も 渡っていない
       ③ ★光りの 関数に「ひっくり返る 枚数」を 出す 経路が 1本も 無い
       ④ ★ハッピー（と 画面ぜんぶ）が 角の ことを 1文字も 言っていない（社長裁定5）
       ⑤ ★画面に 手数・%・秒 の 数字が 1つも 出ていない
       ⑥ ★盤の 大きさが 定数 SIZE から しか 出ていない
       ⑦ ★石の数の 表示が 盤の 石と 合っている（T91）
       ⑧ ★数字が 帯と 同じ 1つの 動きから 出ている（T91・時間が ずれない）
       ⑨ ★石の数の 行に 石の数 いがいの 数字・言葉が 無い（T91） */
  function verify(n) {
    n = n || 200;
    var ng = [], t0 = Date.now();

    // ① ルールの 通り
    var r1 = C.runMany(G, robot, humans['たくさん とる'], C.LEVELS[0], n, 777);
    if (r1.illegal) ng.push('きまりを 破った 手が ' + r1.illegal + '件');
    if (r1.badCount) ng.push('石の 合計が マスの数を 超えた 試合が ' + r1.badCount + '件');

    // ② ロボットに 人の 打ち方が 渡っていないか
    var robotSrc = robot.src();
    var HN = Object.keys(humans), leak = [];
    for (var i = 0; i < HN.length; i++) if (robotSrc.indexOf(HN[i]) >= 0) leak.push(HN[i]);
    if (robotSrc.indexOf('human') >= 0 || robotSrc.indexOf('HUMAN') >= 0) leak.push('human');
    if (leak.length) ng.push('★ロボットの 中に 人の 打ち方が 入っている：' + leak.join('・'));

    // ③ 光りに 枚数が 混じっていないか（社長裁定4・ルル §5-6 の 2番）
    var hintSrc = String(paintHints) + String(tapCell) + String(step);
    if (/\bgain\b/.test(hintSrc)) ng.push('★光りの 経路に gain（ひっくり返る 枚数）が ある');

    // ④ ★角の ことを 1文字も 言っていないか（社長裁定5）
    var words = allWords();
    var badWord = words.match(/角|隅|すみ|コーナー/g);
    if (badWord) ng.push('★画面の 言葉に「' + badWord.join('・') + '」が ある（社長裁定5 ちがい）');

    // ⑤ 手数・%・秒 の 数字
    var badNum = words.match(/\d+\s*手|\d+\s*%|\d+\s*秒|\d+\s*ms/g);
    if (badNum) ng.push('★画面に 数字が 出ている：' + badNum.join('・'));

    // ⑥ 盤の 大きさ
    if (G.n !== SIZE) ng.push('盤の 大きさが SIZE と ちがう');
    if (cellEl.length && cellEl.length !== SIZE * SIZE) ng.push('マスの数が ' + cellEl.length + '（SIZE×SIZE で ない）');
    var f = C.fitBoard(355, 674, SIZE);
    if (f.board !== f.cell * SIZE + 2) ng.push('盤の 一辺が 1マス×SIZE＋ふち に なっていない');

    /* ⑦ ★ 石の数の 表示が、盤の 実際の 石と 合っているか（T91）
          ★ 動いている あいだ（tallyRAF）は わざと ずれている ので 見ない。 */
    var tallyOK = 'OK';
    if (b && tallyMe && !tallyRAF) {
      var shown = tallyMe.textContent + '／' + tallyBot.textContent;
      var real  = G.count(b, ME) + '／' + G.count(b, BOT);
      if (shown !== real) { tallyOK = 'NG'; ng.push('★石の数の 表示 ' + shown + ' が 盤 ' + real + ' と ちがう'); }
    }

    /* ⑧ ★ 帯と 数字が、同じ 1つの 動きから 出ているか（T91）
          ★ 数字を べつの 時間で 動かす コードが 混ざったら ここで 落とす。 */
    var syncSrc = String(syncTally) + String(tallyFromBand);
    var syncOK = /band-ms/.test(syncSrc) && /getBoundingClientRect/.test(syncSrc);
    if (!syncOK) ng.push('★数字が 帯の 動きから 出ていない（時間が ずれる）');

    /* ⑨ ★ 石の数の 行に、石の数 いがいの 数字が 混ざっていないか（T91）
          ★ 手数・読みの 深さ・勝ちそうかの 評価値 ―― 1つも 出さない。 */
    var tallyWords = tallyEl ? (tallyEl.textContent || '') : '';
    var tallyBad = tallyWords.replace(/石の数|[0-9\s]/g, '');
    if (tallyBad) ng.push('★石の数の 行に よけいな 言葉が ある：' + tallyBad);

    var out = {
      '盤': SIZE + '×' + SIZE,
      '調べた試合': n,
      '★NG': ng.length,
      '①きまり': r1.illegal === 0 && r1.badCount === 0 ? 'OK' : 'NG',
      '②ロボットは 人の 打ち方を 知らない': leak.length ? 'NG' : 'OK',
      '③光りに 枚数が 混じっていない': /\bgain\b/.test(hintSrc) ? 'NG' : 'OK',
      '④★角の ことを 1文字も 言っていない': badWord ? 'NG' : 'OK',
      '⑤画面に 手数・%・秒 が 無い': badNum ? 'NG' : 'OK',
      '⑥盤の 大きさは SIZE ただ1つ': (G.n === SIZE) ? 'OK' : 'NG',
      '⑦★石の数が 盤と 合っている': tallyOK,
      '⑧★数字は 帯と 同じ 動きから 出ている': syncOK ? 'OK' : 'NG',
      '⑨★石の数の 行は 石の数 だけ': tallyBad ? 'NG' : 'OK',
      'かかった時間': ((Date.now() - t0) / 1000).toFixed(1) + '秒'
    };
    if (ng.length) out['NGの中身'] = ng;
    console.log('[REVERSI] verify', out);
    return out;
  }

  /* ★ いまの 盤（★たしかめ 専用）*/
  function now() {
    if (!b) return { '場面': 'まだ 始めていない', 'ロボットの つよさ': levelNow().label };
    var rows = [];
    for (var r = 0; r < SIZE; r++) {
      var line = [];
      for (var c = 0; c < SIZE; c++) {
        var v = b[r * SIZE + c];
        line.push(v === ME ? '●' : (v === BOT ? '○' : '・'));
      }
      rows.push(line.join(' '));
    }
    var mine = G.count(b, ME), bot = G.count(b, BOT);
    return {
      '盤': rows,
      '（●が 自分・○が ロボット）': '',
      '自分': mine, 'ロボット': bot, '空き': G.N - mine - bot,
      '★石の合計': (mine + bot) + ' / ' + G.N,
      '★石の数の 表示（帯の 下）': tallyMe
        ? (tallyMe.textContent + '／' + tallyBot.textContent +
           (tallyRAF ? '（いま 動いている 途中）'
                     : ((tallyMe.textContent | 0) === mine && (tallyBot.textContent | 0) === bot ? '（盤と 一致）' : '★ちがう')))
        : '―',
      '手番': turn === ME ? '自分' : 'ロボット',
      '光っている所': hints.length + 'か所',
      'ロボットの つよさ': levelNow().label,
      '打った手': stat.plies, '★パスの回数': stat.passes,
      '★ロボットの 1手（平均／最悪）': stat.botMoves
        ? (stat.botTotal / stat.botMoves).toFixed(0) + 'ms ／ ' + stat.botWorst + 'ms'
        : '―',
      '★待てる時間を 超えた 手': stat.budgetHits,
      '勝敗': over ? (mine > bot ? '勝ち' : (mine < bot ? '負け' : '引き分け')) : '進行中',
      '1マス': geo.cell + 'px'
    };
  }

  /* ★★ もどす ―― ★画面には 出しません（ルル §7-3）★★
     ------------------------------------------------------------
     ★ 対戦ゲームで もどせると、ロボットの 返しを 見てから 自分の手を 決められます。
       ★ 置ける所は 平均 7.3個。もどせるなら 7.3手先を ただで 読める ＝ ずる。
     ★ だから ボタンは 作りません（対戦の 6本と そろえる）。
     ★ ただし たしかめ用の 窓口には 置きます（トライが 盤を 戻して 見られる ように）。
       ⚠️ ここを 画面の ボタンに つなぐ ときは、必ず 社長に 確認する こと。 */
  function undo(times) {
    times = times || 1;
    var done = 0;
    for (var t = 0; t < times; t++) {
      if (!hist.length) break;
      var h = hist.pop();
      for (var k = 0; k < h.fl.length; k++) b[h.fl[k]] = 3 - h.who;
      b[h.p] = 0;
      turn = h.who; done++;
    }
    clearTimers();
    over = false; busy = false;
    resultWrap.classList.add('hidden');
    paintAll(true); paintBand(true);
    step(false);
    return { 'もどした手': done, '手番': turn === ME ? '自分' : 'ロボット' };
  }

  /* ★ 盤を 直に 置く（★たしかめ 専用・画面からは 呼べない）
       rows … SIZE本の 文字列。●＝自分 ○＝ロボット ・＝空
       who  … 1＝自分から 2＝ロボットから
     ★ パスの 場面や 決着の 直前を 出して 見る ため（神経衰弱の nearEnd と 同じ 役目）。 */
  function set(rows, who) {
    titleScreen.classList.add('hidden');
    playScreen.classList.remove('hidden');
    if (!built) { build(); }
    clearTimers();
    b = G.start();
    for (var r = 0; r < SIZE; r++) {
      var line = (rows[r] || '').replace(/\s/g, '');
      for (var c = 0; c < SIZE; c++) {
        var ch = line.charAt(c);
        b[r * SIZE + c] = ch === '●' ? ME : (ch === '○' ? BOT : 0);
      }
    }
    turn = who === 2 ? BOT : ME;
    over = false; busy = false; hints = []; hist = [];
    resultWrap.classList.add('hidden');
    layout(); paintAll(true); paintBand(true);
    step(false);
    return now();
  }

  /* ============================================================
     ★ 立ち上げ
     ============================================================ */
  function boot() {
    titleScreen = $('titleScreen'); playScreen = $('playScreen');
    stageEl = $('stage'); frameEl = $('boardFrame'); boardEl = $('board'); boardIn = $('boardIn');
    bandEl = $('band'); bandTrack = $('bandTrack');
    bandMe = $('bandMe'); bandBot = $('bandBot'); bandDot = $('bandDot');
    tallyEl = $('tally'); tallyMe = $('tallyMe'); tallyBot = $('tallyBot');   // ★ 石の数（T91）
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
      newGame(false);
    });
    $('btnAgain').addEventListener('click', function () {
      if (resultBox.classList.contains('is-locked')) return;
      newGame(true);
    });
    $('btnHowto').addEventListener('click', function () { $('helpDialog').showModal(); });
    var closers = document.querySelectorAll('[data-close]');
    for (var i = 0; i < closers.length; i++) {
      closers[i].addEventListener('click', function () { $(this.getAttribute('data-close')).close(); });
    }

    /* ★ 指を 受けるのは 緑の わく（＝ ふちの 余白ぶんも 拾える）。
       ★ どの マスかは boardIn（＝ 格子）を 基準に 計算する（→ hitAt）。 */
    frameEl.addEventListener('pointerdown', onDown);
    frameEl.addEventListener('pointermove', onMove);
    frameEl.addEventListener('pointerup', onUp);
    frameEl.addEventListener('pointercancel', onCancel);

    /* ★ ほかの タブへ 行った／戻ってきた とき、石の数を その場で 正しい 数に そろえる
         （動いている 途中の 数字が とり残されない ように・T91）*/
    document.addEventListener('visibilitychange', function () { syncTally(true); });

    window.addEventListener('resize', function () { layout(); });
    window.addEventListener('orientationchange', function () { later(layout, 120); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* ============================================================
     ★ たしかめの 窓口（既存11本と 同じ 作法。★画面には 1つも 出ない）
     ============================================================ */
  root.REVERSI = {
    now: now,
    autoPlay: autoPlay,
    rates: rates,
    verify: verify,
    screen: screenInfo,
    geo: function () { return geo; },
    level: function (i) {
      if (i == null) return { 番号: state.level, 名前: levelNow().label };
      setLevel(i);
      return { 番号: state.level, 名前: levelNow().label };
    },
    seed: function (v) { if (v == null) return null; rand = C.rng(v >>> 0); return v >>> 0; },
    undo: undo,
    set: set,
    newGame: function () { newGame(false); },
    humans: function () { return Object.keys(humans); },
    levels: function () { var o = []; for (var i = 0; i < C.LEVELS.length; i++) o.push(C.LEVELS[i].label); return o; },
    size: function () { return SIZE; },
    core: C
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
