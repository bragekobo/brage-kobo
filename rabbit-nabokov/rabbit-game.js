/* ============================================================
   オリジナルラビット・ナボコフ ― 画面と 進み方（T307・コーダ／★T310 で 社長の 新しい 決まりに）
   ------------------------------------------------------------
   ★ 決まりは rabbit-core.js（★ここでは 1つも 決めない ―― newMatch/place/bet/play/next を 呼ぶだけ）。
   ★★ 守って いる こと
     ・★差が 2 の 札を ★出す 前に 光らせない（★追記②）。★「差 2！」は 出した **あと** だけ。
     ・★特別な 札（A・2・ジョーカー）が 表に なった 瞬間だけ、★ハッピーが 決まりを 1行 言う（★札は 指さない）。
     ・★親の ときに「安全な 札」を 教えない。
     ・★ロボットは ★自分の 手札と 表に なった 札 しか 見ない（★rabbit-core.js の viewFor）。
     ・★ロボットの 待ち時間は 選ばせず、速い 側に 固定（★追記①）。
     ・★ハッピーの 言葉・遊び方の 文・ボタンの 字は ★ぜんぶ うちの 言葉（★作中の 台詞・掛け声・役の 名前は 0）。
   ★ 見張りは いちばん 下の verify()（★window.RN.verify()）。
   ============================================================ */
(function () {
  'use strict';

  var C = window.RNCore;
  var HUMAN = C.HUMAN, ROBOT = C.ROBOT;

  /* ★★ たて置き／横置きを 分ける 線は この 1本だけ（★CSS の @media と 同じ 字。★verify ⑭ が そろって いるか 数える） */
  var WIDE_MQ = '(min-aspect-ratio: 5/4)';

  /* ★ 待ち時間（★選ばせない・速い 側に 固定 ―― 追記①） */
  var TUNE = {
    ROBOT_THINK: 520,   /* ロボットが ふせる／かける／出す まで */
    AFTER_FLIP: 420,    /* めくって から 次へ */
    HOLD: 1500,         /* 1回の 結果を 見せる 時間 */
    HOLD_BIG: 2300,     /* 特別な 倍率の ときは 少し 長く */
    RESULT_LOCK: 600    /* 終わりの 箱が 出た 直後は 押せない（★指の すべり よけ） */
  };
  var CARD_DIR = '../cards/';
  var BACK = 'トランプ裏赤';
  /* ★★ T310：★決まりが 変わった（★28枚・14回・かけ金 1〜100）ので ★しまう 名前を 変えた。
     ★ 前の 決まりで しまった つづき（v1）は ★読まずに 消す（★53枚の 試合を 28枚の 決まりで 動かすと 壊れる） */
  var SAVE_KEY = 'bragekobo.rabbit-nabokov.resume.v2';
  var OLD_KEYS = ['bragekobo.rabbit-nabokov.resume.v1'];

  /* ============================================================
     ★★ ハッピーの 言葉（★ぜんぶ ここ 1か所。★verify ⑤⑯ が 1行ずつ 数える）★★
     ★ 作中の 台詞・掛け声・役の 名前は 使わない（★社長の お決め：道1・③）。
     ★ 特別な 札の 行は「決まりの 説明」だけ。★どの 手札で 勝てるかは 言わない（★§5.5-③・追記②）。
     ============================================================ */
  var LINES = {
    title:       '数の 差が ちょうど 2 なら 子の 勝ち！',
    robotPlace:  'ロボットが 親。札を ふせるよ',
    bet:         '何枚 かける？ まん中の ボタンで 決定',
    humanPlace:  'あなたが 親！ どの 札を ふせる？',
    robotBet:    'ロボットが かけるよ…',
    robotBetDone:'ロボットは {n}枚 かけた！',
    humanPlay:   'どの 札で 勝負する？',
    robotPlay:   'ロボットが 札を 出すよ…',
    flipA:       'A だ！ A でしか 勝てない（10倍）',
    flip2:       '2 だ！ ジョーカーだけ 勝てる（50倍）。2 は 大そん！',
    flipJ:       'ジョーカー！ ハートの 2 でだけ 勝てる（100倍）',
    flipK:       'K だ！ 絵札か A を 出せば 勝ち。無いと 10倍 はらう',
    noK:         'K には 絵札（J・Q・K）か A しか 出せないよ',
    /* ★ あなたが 子の とき */
    cHit:        '差 2！ やったね！',
    cSuit:       'マークも 同じ！ 2倍だよ！',
    cX10:        'A と A！ 10倍！',
    cX50:        'すごーい！ 50倍だよ！',
    cX100:       '100倍！ 大当たり！',
    cTrap:       'あっ… 2 に 2 は 10倍 はらう',
    cKpen:       'K に 出せる 札が 無い… 10倍 はらう',
    cKwin:       'K に 勝った！',
    cKsuit:      'K に 勝った！ マークも 同じで 2倍！',
    cMiss:       'おしい！ つぎ がんばろ！',
    /* ★ あなたが 親の とき */
    pHit:        'ロボットに 当てられた…',
    pBig:        'ロボットの 大当たり… つぎ いこう！',
    pTrap:       'ロボットが わなに かかった！',
    pKpen:       'K が 決まった！ ロボットが 10倍 はらう',
    pMiss:       'ふせた 札が 守った！',
    /* ★ 試合の おわり */
    endWin:      'あなたの 勝ち！ すごい！',
    endLose:     'ロボットの 勝ち… また 遊ぼう！',
    endDraw:     '引き分け！ いい 勝負！'
  };

  /* ── 画面の 部品 ───────────────────────────── */
  function $(id) { return document.getElementById(id); }
  var app = $('app'), topbar = $('topbar'), titleScreen = $('titleScreen'), playScreen = $('playScreen');
  var btnStart = $('btnStart'), btnQuit = $('btnQuitGame'), topbarPad = $('topbarPad');
  var levelTitle = $('levelTitle'), levelResult = $('levelResult');
  var coinsRobotEl = $('coinsRobot'), coinsMeEl = $('coinsMe');
  var robotHandEl = $('robotHand'), tableArea = $('tableArea'), handArea = $('handArea'), handEl = $('hand');
  var chipRobot = $('chipRobot'), chipMe = $('chipMe'), cardRobot = $('cardRobot'), cardMe = $('cardMe');
  var midEl = $('mid'), midResult = $('midResult'), deckImg = $('deckImg'), deckCount = $('deckCount'), discardImg = $('discardImg');
  var betRow = $('betRow'), btnPlace = $('btnPlace'), btnPlay = $('btnPlay');
  var happyWrap = $('happyWrap'), bubble = $('happyBubble'), btnHowto = $('btnHowto');
  var resultWrap = $('resultWrap'), resultBox = $('resultBox'), resultTitle = $('resultTitle');
  var resultMe = $('resultMe'), resultRobot = $('resultRobot'), btnAgain = $('btnAgain');
  var helpDialog = $('helpDialog');

  /* ── 状態 ───────────────────────────────── */
  var st = null;          /* rabbit-core の 試合 */
  var level = 'weak';     /* ★初期値は よわい（★§5.5-②・ルル §4-3） */
  var phase = 'title';    /* title / robot-place / bet / robot-bet / human-play / robot-play / human-place / result / over */
  var lifted = -1;        /* 持ち上げた 手札の 番号（★1枚だけ） */
  var token = 0;          /* ★やめた とき、待って いる 動きを まとめて 止める 合い言葉 */
  var timers = [];
  var knownHand = {};     /* ★新しく 引いた 札だけ「ふわっ」と 出す ため */
  var flipNext = null;    /* ★次の 描きで めくる 札の 場所 */
  var dropNext = null;
  var rnd = Math.random;  /* ★ロボットの さいころ（★配りは newMatch の 中で 同じ rnd を 使う） */
  /* ★★ T310：あなたの かけ金（★はじめは 10枚。★1試合の 中では 前の 回の 枚数を 覚えて おく ―― ★毎回 押し直さなくて よい） */
  var myBet = C.BET_START;

  /* ★ コインの 字（★0枚より 少ない ときは「−35」。★「借金」の 字は 出さない ―― 秘書の お決め④）。
     ★ 1,000 から 上は ★3けたごとに「,」（★100倍 × 100枚 ＝ 10,000 まで 動く） */
  function fmt(n) {
    var a = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (n < 0 ? '−' : '') + a;
  }
  function unfmt(t) { t = String(t).replace(/,/g, ''); return t.charAt(0) === '−' ? -(+t.slice(1)) : +t; }

  function levelL() {
    for (var i = 0; i < C.LEVELS.length; i++) if (C.LEVELS[i].id === level) return C.LEVELS[i].L;
    return 1;
  }
  function after(ms, fn) {
    var my = token;
    var t = setTimeout(function () { timers.splice(timers.indexOf(t), 1); if (my === token) fn(); }, ms);
    timers.push(t);
  }
  function stopAll() { token++; while (timers.length) clearTimeout(timers.pop()); }

  /* ============================================================
     ★ 札の 絵（§9）―― ★使う 札（52枚＋JOKER1＋裏）を ★4本ずつ 先に 読む（T120 の 型）
     ★ 「読み込み中」の 字は 出さない（§5.5）。
     ============================================================ */
  function srcOf(name) { return CARD_DIR + encodeURIComponent(name) + '.png'; }
  function cardSrc(c) { return srcOf(C.fileName(c)); }
  var loadQ = [], loading = 0, loaded = {};
  function pump() {
    while (loading < 4 && loadQ.length) {
      var n = loadQ.shift();
      if (loaded[n]) continue;
      loaded[n] = 'wait'; loading++;
      (function (name) {
        var im = new Image();
        im.onload = im.onerror = function () { loaded[name] = 'ok'; loading--; pump(); };
        im.src = srcOf(name);
      })(n);
    }
  }
  function want(names, front) {
    for (var i = 0; i < names.length; i++) {
      if (loaded[names[i]]) continue;
      var at = loadQ.indexOf(names[i]); if (at >= 0) loadQ.splice(at, 1);
      if (front) loadQ.unshift(names[i]); else loadQ.push(names[i]);
    }
    pump();
  }
  function preloadAll() {
    var all = [BACK];
    C.makeDeck().forEach(function (c) { all.push(C.fileName(c)); });
    want(all, false);
  }

  /* ============================================================
     ★ ハッピー
     ============================================================ */
  function say(text, mood) {
    bubble.textContent = text;
    happyWrap.dataset.mood = mood || 'normal';
  }

  /* ============================================================
     ★ 描く
     ============================================================ */
  function imgEl(src, alt) {
    var im = document.createElement('img');
    im.src = src; im.alt = alt || ''; im.draggable = false; im.decoding = 'async';
    return im;
  }
  function setSlot(box, card, faceUp, anim) {
    box.textContent = '';
    box.classList.remove('has-card', 'is-flip', 'is-drop');
    if (!card) return;
    box.classList.add('has-card');
    box.appendChild(imgEl(faceUp ? cardSrc(card) : srcOf(BACK), faceUp ? C.speak(card) : 'ふせた 札'));
    if (anim) { void box.offsetWidth; box.classList.add(anim); }
  }
  function chipText(who) {
    if (st.parent === who) return '親';
    return st.bet ? '子・' + st.bet + '枚' : '子';
  }
  function bump(el) {
    var box = el.parentNode;
    box.classList.remove('is-bump'); void box.offsetWidth; box.classList.add('is-bump');
  }

  function render() {
    if (!st) return;
    /* コイン */
    if (coinsMeEl.textContent !== fmt(st.coins[HUMAN])) { coinsMeEl.textContent = fmt(st.coins[HUMAN]); bump(coinsMeEl); }
    if (coinsRobotEl.textContent !== fmt(st.coins[ROBOT])) { coinsRobotEl.textContent = fmt(st.coins[ROBOT]); bump(coinsRobotEl); }
    coinsMeEl.parentNode.classList.toggle('is-minus', st.coins[HUMAN] < 0);      /* ★ 0枚より 少ない ときだけ 字の 色（★アトが 仕上げ） */
    coinsRobotEl.parentNode.classList.toggle('is-minus', st.coins[ROBOT] < 0);
    /* 親・子 */
    chipRobot.textContent = chipText(ROBOT); chipRobot.classList.toggle('is-parent', st.parent === ROBOT);
    chipMe.textContent = chipText(HUMAN);    chipMe.classList.toggle('is-parent', st.parent === HUMAN);
    /* ロボットの 手札（★裏だけ） */
    var nR = st.hands[ROBOT].length;
    if (robotHandEl.children.length !== nR) {
      robotHandEl.textContent = '';
      for (var i = 0; i < nR; i++) robotHandEl.appendChild(imgEl(srcOf(BACK), ''));
      robotHandEl.setAttribute('aria-label', 'ロボットの 手札 ' + nR + '枚');
    }
    /* 場の 2枚 */
    var pCard = st.down, kCard = st.childCard;
    var robotCard = st.parent === ROBOT ? pCard : kCard;
    var myCard    = st.parent === HUMAN ? pCard : kCard;
    var robotUp = st.parent === ROBOT ? st.faceUp : true;
    var myUp    = st.parent === HUMAN ? st.faceUp : true;
    setSlot(cardRobot, robotCard, robotUp, flipNext === 'robot' ? 'is-flip' : (dropNext === 'robot' ? 'is-drop' : null));
    setSlot(cardMe, myCard, myUp, flipNext === 'me' ? 'is-flip' : (dropNext === 'me' ? 'is-drop' : null));
    flipNext = null; dropNext = null;
    /* 山・捨て札（★捨て札は いちばん 上だけ） */
    deckCount.textContent = st.deck.length;
    if (!deckImg.getAttribute('src')) deckImg.src = srcOf(BACK);
    var top = st.discard.length ? st.discard[st.discard.length - 1] : null;
    if (top) { discardImg.src = cardSrc(top); discardImg.alt = '捨て札 ' + C.speak(top); discardImg.classList.remove('is-empty'); }
    else { discardImg.removeAttribute('src'); discardImg.alt = ''; discardImg.classList.add('is-empty'); }
    renderHand();
    renderActions();
  }

  /* ★★ 手札 ―― ★ここで 札の 値打ちを 1つも 数えない（★judge を 呼ばない・verify ④）★★
     ★★ T310：★K の 決まりで「出せない 札」だけ ★暗くする（★ハーツ T 決まり7・8 と 同じ 型 ―― ★引き算。光らせない）。
        ★ 暗く するのは 4つ とも 当てはまる ときだけ：①あなたが 子で 出す とき ②親の 札が K
        ③手札に J・Q・K・A が ある ④その 札が J・Q・K・A で ない。
        ★★ 社長の 訂正で「K に J・Q・K・A なら 勝ち」＝ ★出せる 札は みんな 勝つ。★★それでも 暗く して よい わけ：
        ★ ★決まりで「出さなければ ならない」札 なので、★勝つ 札を さがす 仕事が もともと 無い（★気づく ものが 残って いない）。
        ★ ★残る 考えどころ ―― ★どの 絵札・A を 使い、どれを 次の K の ために 残すか・★マークを 合わせて 2倍に するか ―― は ★1つも 光らせない。 */
  function dimSet() {
    var d = {};
    if (phase !== 'human-play' || !st || !st.down) return d;
    var h = st.hands[HUMAN], L = C.legalIdx(h, st.down);
    if (L.length === h.length) return d;
    for (var i = 0; i < h.length; i++) if (L.indexOf(i) < 0) d[i] = 1;
    return d;
  }
  function renderHand() {
    var h = st.hands[HUMAN];
    var canPick = (phase === 'human-place' || phase === 'human-play');
    var seenNow = {}, dim = dimSet();
    handEl.textContent = '';
    for (var i = 0; i < h.length; i++) {
      var c = h[i], k = C.key(c);
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'hcard' + (i === lifted ? ' is-lift' : '') + (knownHand[k] ? '' : ' is-new') + (dim[i] ? ' is-dim' : '');
      b.dataset.i = i;
      b.disabled = !canPick;
      b.setAttribute('aria-label', C.speak(c));
      b.setAttribute('aria-pressed', i === lifted ? 'true' : 'false');
      b.appendChild(imgEl(cardSrc(c), ''));
      handEl.appendChild(b);
      seenNow[k] = 1;
    }
    knownHand = seenNow;
  }
  function renderActions() {
    betRow.classList.toggle('hidden', phase !== 'bet');
    btnPlace.classList.toggle('hidden', phase !== 'human-place');
    btnPlay.classList.toggle('hidden', phase !== 'human-play');
    btnPlace.disabled = lifted < 0;
    btnPlay.disabled = lifted < 0;
    if (phase === 'bet') { renderBet(); if (fitBet()) fitSoon(); }
  }
  /* ★★ T310 ―― かけ金の ボタン（★社長の 形）★★
       [−10] [−1] [かけ金：10枚] [+1] [+10]
     ★ まん中を 押すと ★その 枚数で かける（★決定）。★1 より 下・100 より 上には ならない（★はみ出す 分は 端で 止める）。
     ★ 押せない ときは 灰色（★1枚で −10・−1、★100枚で ＋1・＋10）。
     ★ 5つとも 44px 以上（★verify ⑧・⑲）。★1行に 入らない 画面では ★2段（★まん中が 上の 段・verify ⑲）。 */
  var STEPS = [-10, -1, 0, 1, 10];
  function goLabel(n) { return '<span class="bg-l">かけ金：</span><span class="bg-n"><b>' + n + '</b><small>枚</small></span>'; }
  function renderBet() {
    if (betRow.children.length !== STEPS.length) {
      betRow.textContent = '';
      STEPS.forEach(function (d) {
        var b = document.createElement('button');
        b.type = 'button';
        if (d === 0) { b.className = 'bet-btn bet-go'; b.id = 'btnBetGo'; }
        else { b.className = 'bet-btn bet-step'; b.dataset.step = d; b.textContent = (d > 0 ? '+' : '−') + Math.abs(d); b.setAttribute('aria-label', 'かけ金を ' + Math.abs(d) + (d > 0 ? ' ふやす' : ' へらす')); }
        betRow.appendChild(b);
      });
    }
    [].forEach.call(betRow.children, function (b) {
      var d = +(b.dataset.step || 0);
      if (!d) { b.innerHTML = goLabel(myBet); b.disabled = false; return; }
      b.disabled = d < 0 ? myBet <= C.BET_MIN : myBet >= C.BET_MAX;
    });
  }

  /* ============================================================
     ★★ 大きさ ―― ★札の はばを 器の 実寸から 決める（★たての 線は 引かない）
     ★ たて置きは「場」と「手札」の 2段が のびちぢみ する。★2段の たけの 分け方も ここで 決める。
     ============================================================ */
  var R = 424 / 280;
  var LIFT = 0.2;                 /* ★手札の 上の あそび（★持ち上げ 0.18 ＋ 少し） */
  function px(el, p) { return parseFloat(getComputedStyle(el)[p]) || 0; }
  function innerBox(el) {
    var cs = getComputedStyle(el);
    return {
      w: el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight),
      h: el.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)
    };
  }
  function isWide() { return window.matchMedia(WIDE_MQ).matches; }
  /* ★★ T310 ―― ★題「オリジナルラビット・ナボコフ」（★14文字）★★
     ★ まず 1行で 置いて ★入らなければ 2行（★上に 小さく「オリジナル」・下に「ラビット・ナボコフ」）。
     ★ それでも 入らなければ ★字を 小さく。★点々（…）には しない（★ホールデムの 10文字で 点々に なった 形を 避ける）。
     ★ 字の 形は 端末の 字体で 変わる ので ★線（px）を 決め打ち せず ★いま 描いた 実寸で 決める。 */
  var brandEl = $('brand'), brandName = $('brandName');
  function brandFits() {
    var cat = brandEl.querySelector('.brand-cat');
    var need = brandName.getBoundingClientRect().width + (cat ? cat.getBoundingClientRect().width + px(brandEl, 'columnGap') : 0);
    return need <= brandEl.clientWidth + 0.5;
  }
  function fitBrand() {
    /* ★ はじめの 画面でも ★「やめる」が ある ときの はばで 決める（★はじめ 1行・遊ぶと 2行 に ならない ように）。
       ★ 見えない あいだに 入れかえて 測って すぐ 戻す（★1こまの 間なので 画面には 出ない） */
    var swap = btnQuit.classList.contains('hidden');
    if (swap) { btnQuit.classList.remove('hidden'); topbarPad.classList.add('hidden'); }
    brandEl.classList.remove('is-2line', 'is-small');
    if (!brandFits()) {
      brandEl.classList.add('is-2line');
      if (!brandFits()) brandEl.classList.add('is-small');
    }
    if (swap) { btnQuit.classList.add('hidden'); topbarPad.classList.remove('hidden'); }
  }
  /* ★ かけ金の 5つ ―― ★いつも 1行に 5つ（★社長の 形）。★まん中の 字が 入らない せまい 画面では
     ★ ①まん中の 中身だけ 2行（★上に 小さく「かけ金：」・下に「100枚」）＝ .is-tight
     ★ ②それでも 入らなければ ★2段（★まん中が 上の 段）＝ .is-2row（★13画面では 出ない【実測】）
     ★ いちばん はばを 食う「100」で 先に 測る ＝ ★押して いる 途中で 形が 変わらない。 */
  function fitBet() {
    if (betRow.classList.contains('hidden') || !betRow.children.length) return false;
    var was = betRow.className, go = $('btnBetGo');
    if (!go) return false;
    var keep = go.innerHTML;
    go.innerHTML = goLabel(C.BET_MAX);
    function over() { return betRow.scrollWidth > betRow.clientWidth + 0.5 || go.scrollWidth > go.clientWidth + 0.5; }
    betRow.classList.remove('is-tight', 'is-2row');
    if (over()) { betRow.classList.add('is-tight'); if (over()) betRow.classList.add('is-2row'); }
    go.innerHTML = keep;
    return was !== betRow.className;
  }
  function fit() {
    fitBrand();
    if (phase === 'title' || !st) return;
    fitBet();
    var wide = isWide();
    var s = app.style;
    var gapT = px(tableArea, 'columnGap') || 8;
    var chip = chipRobot.offsetHeight + 4;
    var HMAX = wide ? 118 : 112, TMAX = wide ? 128 : 150, HMIN = 46, TMIN = 34;   /* ★ たての 長い 画面は 場の 札を 大きく（★追記③ ふだんを 最大に） */
    if (!wide) { s.setProperty('--tf', '1fr'); s.setProperty('--hf', '1fr'); }
    else { s.removeProperty('--tf'); s.removeProperty('--hf'); }
    var tb = innerBox(tableArea), hb = innerBox(handArea);
    var pw = Math.max(22, Math.min(40, Math.round(tb.w * 0.09)));
    s.setProperty('--pw', pw + 'px');
    var midW = Math.max(2 * pw + 6, midResult.offsetWidth, 62);
    var slotW = (tb.w - midW - 2 * gapT) / 2;
    var hgap = px(handEl, 'columnGap') || 5;
    var handW = (hb.w - 4 * hgap) / 5;
    var hwW = Math.min(handW, HMAX), twW = Math.min(slotW, TMAX);
    if (!wide) {
      /* ★ 2段の たけを 分ける：★手札を まず 欲しい だけ、★のこりを 場へ。★足りなければ 両方を 同じ 割合で 縮める */
      var tOut = tableArea.offsetHeight, hOut = handArea.offsetHeight, F = tOut + hOut;
      var tExtra = tOut - tb.h, hExtra = hOut - hb.h;
      var dt = tExtra + chip + twW * R, dh = hExtra + hwW * (R + LIFT);
      var hh, th;
      /* ★ 足りない ときの 順番：★①手札は 指の的 46px（★44＋ゆとり）・場は 34px を まず 取る
         ★ ②のこりを 2段に 同じ 割合で 配る。★場の 札が 手札より 先に 44px を 割る ことは あるが、場は 押さない */
      var dhMin = hExtra + Math.min(hwW, HMIN) * (R + LIFT), dtMin = tExtra + chip + Math.min(twW, TMIN) * R;
      if (dt + dh <= F) { hh = dh; th = F - dh; }
      else if (F <= dhMin + dtMin) { hh = dhMin; th = Math.max(0, F - dhMin); }
      else { var k = (F - dhMin - dtMin) / ((dh - dhMin) + (dt - dtMin)); hh = dhMin + (dh - dhMin) * k; th = dtMin + (dt - dtMin) * k; }
      s.setProperty('--tf', th.toFixed(2) + 'fr');
      s.setProperty('--hf', hh.toFixed(2) + 'fr');
      tb = innerBox(tableArea); hb = innerBox(handArea);
    }
    var hw = Math.floor(Math.min(hwW, hb.h / (R + LIFT)));
    var tw = Math.floor(Math.min(twW, (tb.h - chip) / R));
    s.setProperty('--hw', Math.max(30, hw) + 'px');
    s.setProperty('--tw', Math.max(30, tw) + 'px');
    s.setProperty('--rw', Math.max(16, Math.min(22, Math.round(hw * 0.32))) + 'px');
  }
  var fitTimer = 0;
  function fitSoon() { cancelAnimationFrame(fitTimer); fitTimer = requestAnimationFrame(fit); }
  window.addEventListener('resize', fitSoon);
  window.addEventListener('orientationchange', fitSoon);

  /* ============================================================
     ★ 画面の 切りかえ
     ============================================================ */
  function showTitle() {
    stopAll();
    phase = 'title'; st = null; lifted = -1;
    app.classList.add('is-title'); app.classList.remove('is-play');
    titleScreen.classList.remove('hidden'); playScreen.classList.add('hidden');
    btnQuit.classList.add('hidden'); topbarPad.classList.remove('hidden');
    resultWrap.classList.add('hidden');
    say(LINES.title);
    fitBrand();
  }
  function showPlay() {
    app.classList.remove('is-title'); app.classList.add('is-play');
    titleScreen.classList.add('hidden'); playScreen.classList.remove('hidden');
    btnQuit.classList.remove('hidden'); topbarPad.classList.add('hidden');
    resultWrap.classList.add('hidden');
  }

  function startMatch() {
    stopAll();
    clearSave();
    var seed = (window.RN_SEED !== undefined) ? window.RN_SEED : null;   /* ★測る ときだけ 種を 決める */
    var dealRnd = seed === null ? Math.random : C.rng(seed);
    rnd = seed === null ? Math.random : C.rng(seed + 7);
    st = C.newMatch(dealRnd);
    knownHand = {}; st.hands[HUMAN].forEach(function (c) { knownHand[C.key(c)] = 1; });
    lifted = -1;
    myBet = C.BET_START;                                   /* ★ T310：1試合の はじめは 10枚 */
    showPlay();
    midResult.textContent = '';
    want(st.hands[HUMAN].map(C.fileName).concat([BACK]), true);
    phase = 'robot-place';
    render(); fit();
    beginRound();
  }

  /* ★ 1回の はじめ（★ここで 保存する ―― ブラックジャックと 同じ「1回の 頭まで」） */
  function beginRound() {
    save();
    lifted = -1;
    midResult.textContent = '';
    midResult.className = 'mid-result'; tableArea.classList.remove('is-big');   /* ★ T308 アト：「ぽん！」を 次の 回に 持ちこさない */
    if (st.parent === ROBOT) {
      phase = 'robot-place';
      say(LINES.robotPlace);
      render();
      after(TUNE.ROBOT_THINK, robotPlace);
    } else {
      phase = 'human-place';
      say(LINES.humanPlace);
      render();
    }
  }

  /* ★★ ロボットの 3つの 手 ―― ★渡すのは C.viewFor（自分の 手札・表に なった 札・コイン）だけ ★★ */
  function robotPlace() {
    var i = C.pickParent(levelL(), C.viewFor(st, ROBOT), rnd);
    C.place(st, ROBOT, i);
    dropNext = 'robot';
    phase = 'bet';
    say(LINES.bet);
    render();
  }
  function robotBet() {
    var n = C.chooseBet(levelL(), C.viewFor(st, ROBOT), rnd);
    C.bet(st, ROBOT, n);
    flipNext = 'me';
    phase = 'robot-play';
    render();
    var line = flipLine(st.down);
    say(line || LINES.robotBetDone.replace('{n}', n));
    after(line ? TUNE.AFTER_FLIP + 900 : TUNE.AFTER_FLIP + 200, function () {
      if (!line) say(LINES.robotPlay);
      after(TUNE.ROBOT_THINK, robotPlay);
    });
  }
  function robotPlay() {
    var k = C.choosePlay(levelL(), C.viewFor(st, ROBOT), st.down, rnd);
    var r = C.play(st, ROBOT, k);
    dropNext = 'robot';
    showRoundResult(r);
  }

  /* ★ 特別な 札が 表に なった ときの 1行（★決まりの 説明だけ。★札を 指さない） */
  function flipLine(p) {
    if (C.isJoker(p)) return LINES.flipJ;
    if (p.r === 1) return LINES.flipA;
    if (p.r === 2) return LINES.flip2;
    if (C.isKing(p)) return LINES.flipK;                    /* ★ T310：K の 決まり（★オリジナルルール）を 1行 */
    return '';
  }

  /* ── 人の 手 ───────────────────────────── */
  function onBet() {
    if (phase !== 'bet') return;
    C.bet(st, HUMAN, myBet);
    flipNext = 'robot';
    phase = 'human-play';
    lifted = -1;
    render();
    say(flipLine(st.down) || LINES.humanPlay);
  }
  function onPlace() {
    if (phase !== 'human-place' || lifted < 0) return;
    C.place(st, HUMAN, lifted);
    lifted = -1;
    dropNext = 'me';
    phase = 'robot-bet';
    say(LINES.robotBet);
    render();
    after(TUNE.ROBOT_THINK, robotBet);
  }
  function onPlay() {
    if (phase !== 'human-play' || lifted < 0) return;
    var r = C.play(st, HUMAN, lifted);
    lifted = -1;
    dropNext = 'me';
    showRoundResult(r);
  }
  function onStep(d) {
    if (phase !== 'bet') return;
    myBet = C.clampBet(myBet + d);                         /* ★ 1 より 下・100 より 上には ならない（★端で 止める） */
    renderBet();
  }
  function onCard(i) {
    if (phase !== 'human-place' && phase !== 'human-play') return;
    /* ★ T310：K の 決まりで 出せない 札（★暗い 札）は ★持ち上がらない。★わけを ハッピーが 1行 */
    if (dimSet()[i]) {
      var t = handEl.children[i];
      if (t) { t.classList.remove('is-no'); void t.offsetWidth; t.classList.add('is-no'); }
      say(LINES.noK);
      return;
    }
    lifted = (lifted === i) ? -1 : i;
    renderHand();
    renderActions();
  }

  /* ★★ T312（★トライの 検品 A・社長裁定）―― 場の まん中の 字は ★いつも「あなたから 見た」字 ★★
     ★ 前は ★いつも「子から 見た」字だった。★あなたが 親の とき ★逆に 見えた：
       ★ あなたの K に ロボットが Q →「勝ち！ −10枚」（★負けたのに 勝ち）／
       ★ ロボットが K に 出せない・わなを 踏む → 金の「−10倍 ＋100枚」（★もらったのに −）。
     ★ 下の 枚数の 行と アトの「ぽん」（★ピンク・金の 丸）は ★もともと あなたから 見て いた（gain）。★上の 字だけ ずれて いた。
     ★ 決まり：★あなたが 得を した ときは「！」の つく 字・★損を した ときは「−」か 静かな 字。
       ┌ あなたが 子 ┬ 差 2！／差 5／10倍！・50倍！・100倍！／−10倍（わな・K で 出せない）／勝ち！・2倍！（K）／はずれ
       └ あなたが 親 ┴ 差 2／差 5／−10倍・−50倍・−100倍（★当てられた）／10倍！（★ロボが わな・K で 出せない）／負け・−2倍（K を 返された）／勝ち！
     ★ 字の はばは「−100倍」が いちばん 長い（★「100倍！」と 同じ くらい）。★見張り ㉓ が ぜんぶの 場合を 数える。 */
  function midTop(kind, diff, mult, meChild) {
    if (meChild) {
      if (diff !== null) return '差 ' + diff + (diff === 2 ? '！' : '');
      if (kind === 'x10' || kind === 'x50' || kind === 'x100') return Math.abs(mult) + '倍！';
      /* ★ T308 アト：★前は「10倍 はらう」（★101px）。★場の まん中に 入らず ★2枚の 札の 上に 字が 乗り、
         ★ 右の 札を 場の 外へ 押し出して いた（★320×568・568×320・667×375・736×414【実測・直す 前の 控えで】）。
         ★ →「−10倍」（★勝った ときの「10倍！」と 同じ 形）。★下の「−100枚」と ハッピーの 1行が 中身を 言う */
      if (kind === 'trap') return '−10倍';
      /* ★ T310：K に 出せる 札が 無かった ときも ★アトの「−10倍」と 同じ 形（★同じ はばに 収まる） */
      if (kind === 'kpen') return '−10倍';
      /* ★ T310：K に J・Q・K・A で 勝った（★差は 使わない ので「差 1」とは 出さない） */
      if (kind === 'kwin') return '勝ち！';
      if (kind === 'ksuit') return '2倍！';
      return 'はずれ';
    }
    /* ★ あなたが 親（★子の 字を 裏返す） */
    if (diff !== null) return '差 ' + diff;                                     /* ★差 2 ＝ 当てられた（★「！」を 付けない） */
    if (kind === 'x10' || kind === 'x50' || kind === 'x100') return '−' + Math.abs(mult) + '倍';
    if (kind === 'trap' || kind === 'kpen') return '10倍！';                    /* ★ロボが はらう ＝ あなたの 大当たり（★金の 丸） */
    if (kind === 'kwin') return '負け';
    if (kind === 'ksuit') return '−2倍';
    return '勝ち！';                                                           /* ★ふせた 札が 守った */
  }

  /* ★★ 1回の 結果 ―― ★ここで はじめて 差を 見せる（★出した あと・追記②）★★ */
  function showRoundResult(r) {
    phase = 'result';
    render();
    var gain = (r.child === HUMAN) ? r.move : -r.move;   /* ★あなたから 見た コインの 動き */
    var top = midTop(r.kind, r.diff, r.mult, r.child === HUMAN);
    midResult.innerHTML = '';
    /* ★ T308 アト：★あなたが もらえた ときだけ「ぽん！」（★色と 動きだけ・字は 同じ）。★大当たりは 金色＋場の ふち */
    var bigWin = gain > 0 && Math.abs(r.mult) >= 10;
    midResult.className = 'mid-result' + (gain > 0 ? ' is-win' : '') + (bigWin ? ' is-big' : '');
    tableArea.classList.toggle('is-big', bigWin);
    var a = document.createElement('span'); a.className = 'mr-big'; a.textContent = top;
    var b = document.createElement('span');
    b.className = gain > 0 ? 'mr-plus' : (gain < 0 ? 'mr-minus' : '');
    b.textContent = (gain > 0 ? '+' : (gain < 0 ? '−' : '±')) + fmt(Math.abs(gain)) + '枚';
    /* ★ T310：かけ金 100枚 × 100倍 ＝ 10,000枚 まで 動く。★4けた 以上は ★字を 小さく（★場の まん中を 太らせない ―― 追記③：ふだんの 札を 小さく しない） */
    if (Math.abs(gain) >= 1000) b.className += ' is-long';
    midResult.appendChild(a); midResult.appendChild(b);

    var line, mood = gain > 0 ? 'win' : (gain < 0 ? 'sad' : 'normal');
    if (r.child === HUMAN) {
      line = { hit: LINES.cHit, suit: LINES.cSuit, x10: LINES.cX10, x50: LINES.cX50, x100: LINES.cX100, trap: LINES.cTrap, kpen: LINES.cKpen, kwin: LINES.cKwin, ksuit: LINES.cKsuit, miss: LINES.cMiss }[r.kind];
    } else {
      line = { hit: LINES.pHit, suit: LINES.pHit, x10: LINES.pBig, x50: LINES.pBig, x100: LINES.pBig, trap: LINES.pTrap, kpen: LINES.pKpen, kwin: LINES.pHit, ksuit: LINES.pHit, miss: LINES.pMiss }[r.kind];
    }
    say(line, mood);
    var big = Math.abs(r.mult) >= 10;
    after(big ? TUNE.HOLD_BIG : TUNE.HOLD, function () {
      C.next(st);
      if (st.phase === 'over') { render(); showFinal(); return; }
      want(st.hands[HUMAN].map(C.fileName), true);
      beginRound();
    });
  }

  function showFinal() {
    phase = 'over';
    clearSave();
    btnPlace.classList.add('hidden'); btnPlay.classList.add('hidden'); betRow.classList.add('hidden');
    var w = C.winner(st);
    resultTitle.textContent = w === HUMAN ? 'あなたの 勝ち！' : (w === ROBOT ? 'ロボットの 勝ち' : '引き分け');
    resultTitle.classList.toggle('is-quiet', w !== HUMAN);
    resultMe.textContent = fmt(st.coins[HUMAN]);
    resultRobot.textContent = fmt(st.coins[ROBOT]);
    /* ★ T308-2 アト：★結果の 箱でも 0枚より 少ない 数は ★遊ぶ 画面と 同じ ピンク（★前は 金茶で 遊ぶ 画面と 色が ちがった） */
    resultMe.classList.toggle('is-minus', st.coins[HUMAN] < 0); resultRobot.classList.toggle('is-minus', st.coins[ROBOT] < 0);
    levelResult.value = level;
    say(w === HUMAN ? LINES.endWin : (w === ROBOT ? LINES.endLose : LINES.endDraw), w === HUMAN ? 'win' : 'normal');
    resultWrap.classList.remove('hidden');
    resultBox.classList.add('is-locked');
    after(TUNE.RESULT_LOCK, function () { resultBox.classList.remove('is-locked'); });
  }

  /* ============================================================
     ★ とちゅうの つづき（★sessionStorage・★1回の 頭まで ―― ブラックジャック T17 と 同じ 考え）
     ★ 読み直しで 2分の 試合が 消えない。★おわった／やめた ときは 消す。
     ============================================================ */
  var store = null;
  try { sessionStorage.setItem('__rn_t', '1'); sessionStorage.removeItem('__rn_t'); store = sessionStorage; } catch (e) { store = null; }
  function save() {
    if (!store || !st || st.phase !== 'place') return;
    try { store.setItem(SAVE_KEY, JSON.stringify({ v: 2, level: level, bet: myBet, st: st })); } catch (e) { /* 遊びは 止めない */ }
  }
  function clearSave() { if (store) try { store.removeItem(SAVE_KEY); } catch (e) {} }
  function loadSave() {
    if (!store) return null;
    /* ★ 前の 決まり（★53枚）で しまった つづきは ★読まずに 消す */
    OLD_KEYS.forEach(function (k) { try { store.removeItem(k); } catch (e) {} });
    var s = null;
    try { s = JSON.parse(store.getItem(SAVE_KEY) || 'null'); } catch (e) { s = null; }
    if (!s) return null;
    var ok = false;
    try { ok = s.v === 2 && levelOk(s.level) && C.betOk(s.bet) && goodState(s.st); } catch (e) { ok = false; }
    if (!ok) { clearSave(); return null; }
    return s;
  }
  function levelOk(id) { return C.LEVELS.some(function (x) { return x.id === id; }); }
  /* ★ 保存の 中身が 決まりどおりか（★T310：28枚が 1枚ずつ・コインの 合計 200（★0枚より 少なくても よい）・
     ★ 手札は 2人 同じ 数で「5枚、山が 無く なって からは 1枚ずつ 減る」・山は 18 → 0） */
  function handAt(round) { return Math.min(C.HAND_N, C.ROUNDS + 1 - round); }
  function goodState(x) {
    if (!x || x.phase !== 'place' || (x.parent !== 0 && x.parent !== 1)) return false;
    if (!(x.round >= 1 && x.round <= C.ROUNDS && x.round % 1 === 0)) return false;
    if (!(x.coins[0] % 1 === 0 && x.coins[1] % 1 === 0 && x.coins[0] + x.coins[1] === 2 * C.START_COINS)) return false;
    if (x.hands[0].length !== handAt(x.round) || x.hands[1].length !== handAt(x.round)) return false;
    if (x.deck.length !== Math.max(0, C.DECK_N - 2 * C.HAND_N - 2 * (x.round - 1))) return false;
    if (x.parent !== ((x.round & 1) ? C.HUMAN : C.ROBOT)) return false;   /* ★ 1回目の 親は あなた */
    if (x.down || x.childCard) return false;
    var all = x.deck.concat(x.hands[0], x.hands[1], x.discard), seen = {};
    if (all.length !== C.DECK_N) return false;
    for (var i = 0; i < all.length; i++) {
      var c = all[i];
      if (!c || !(c.r === 0 ? (c.s === -1 || c.s === -2) : (c.r >= 1 && c.r <= 13 && (c.s === 0 || c.s === 1)))) return false;
      if (seen[C.key(c)]) return false; seen[C.key(c)] = 1;
    }
    return true;
  }
  function resume(s) {
    level = s.level; levelTitle.value = level;
    myBet = s.bet;
    st = s.st;
    knownHand = {}; st.hands[HUMAN].forEach(function (c) { knownHand[C.key(c)] = 1; });
    showPlay();
    phase = 'robot-place';
    want(st.hands[HUMAN].map(C.fileName).concat([BACK]), true);
    render(); fit();
    beginRound();
  }

  /* ============================================================
     ★ 押す ところ
     ============================================================ */
  function fillLevels(sel) {
    sel.textContent = '';
    C.LEVELS.forEach(function (x) { var o = document.createElement('option'); o.value = x.id; o.textContent = x.name; sel.appendChild(o); });
    sel.value = level;
  }
  fillLevels(levelTitle); fillLevels(levelResult);
  levelTitle.addEventListener('change', function () { level = levelTitle.value; });
  levelResult.addEventListener('change', function () { level = levelResult.value; levelTitle.value = level; });
  btnStart.addEventListener('click', function () { level = levelTitle.value; startMatch(); });
  btnAgain.addEventListener('click', function () { if (resultBox.classList.contains('is-locked')) return; level = levelResult.value; levelTitle.value = level; startMatch(); });
  /* ★★ ↻ やめる ―― ★聞かずに はじめの 画面へ（★追記⑩ ②）★★ */
  btnQuit.addEventListener('click', function () { clearSave(); showTitle(); });
  handEl.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.hcard') : null;
    if (!b || b.disabled) return;
    onCard(+b.dataset.i);
  });
  betRow.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.bet-btn') : null;
    if (!b || b.disabled) return;
    if (b.dataset.step) onStep(+b.dataset.step); else onBet();
  });
  btnPlace.addEventListener('click', onPlace);
  btnPlay.addEventListener('click', onPlay);
  /* ★ 遊び方 ―― ★必ず showModal()（★overflow:auto が 効くのは この ときだけ・T291） */
  function openHelp() {
    if (typeof helpDialog.showModal === 'function') { if (!helpDialog.open) helpDialog.showModal(); }
    else helpDialog.setAttribute('open', '');
    helpDialog.scrollTop = 0;
  }
  btnHowto.addEventListener('click', openHelp);
  $('btnHowtoTop').addEventListener('click', openHelp);
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-close]') : null;
    if (!t) return;
    var d = $(t.getAttribute('data-close'));
    if (d && d.close) d.close(); else if (d) d.removeAttribute('open');
  });

  /* ── はじめ ── */
  preloadAll();
  var saved = loadSave();
  if (saved) resume(saved); else showTitle();

  /* ============================================================
     ★★★ 見張り（verify）★★★
     ------------------------------------------------------------
     ★ いま 開いて いる 画面で 数えます（★12画面で 測るのは 外の 道具 t307_10）。
     ★ 番号の 中身：
       ① 決まり … ルルが 手で 数えた 判定 15件＋★T310 の K・ジョーカー 2枚 11件＋
                  ★手で 数えた 手札 2つ（★28枚：108/23・9/23 と 89/23・14/23）＋★28枚
       ② 試合 … 90試合を 本物の 5つの 手（place/bet/play/next）で 走らせ、★毎手 数える
                （コインの 合計 200・28枚が 1枚ずつ・★14回で 2人とも 手札 0・山 0・親 7回ずつ・
                  ★K に J・Q・K・A を 出して いる／無い ときだけ −10倍・★0枚より 少なく なっても 続く）
       ③ ロボットが のぞかない … view の 中身は 5つだけ／★ロボットの 手は view だけから 呼ぶ
       ④ 光らせない（追記②）… 手札の 見た目は「持ち上げ」だけ・★同時に 1枚まで・:hover の 決まり 0・
                               ★手札を 描く 所で 札の 値打ちを 数えて いない
       ⑤ ハッピー … 絵・しっぽ・名札・ふきだしが 見える／★どの 言葉も この はばで 2行まで
       ⑥ ↻ やめる … 帯の 右はし・44×44・うすみどり・SVG 16px・遊んで いる 間だけ
       ⑦ 結果の 箱 … 「やめる」の 字が 無い・「◀ ゲームを選ぶ」は ../ へ
       ⑧ 指の的 44px … 見えて いる ボタン・リンク・選ぶ箱 ぜんぶ。★まん中を 押すと 自分に 当たる
       ⑨ 重ならない・はみ出さない … 行どうし・よこ すべり 0・手札が 画面の 中
       ⑩ 帯の sticky … position:sticky・★親に overflow が 無い
       ⑪ 題が 切れない … ★「オリジナルラビット・ナボコフ」1行 か ★2行（★上が「オリジナル」）・点々 なし・◀／やめる／？に かからない
       ⑫ 非公式の 文 … 2か所 1文字も 同じ・見える／★title・説明・og・h1・帯に 作品名が 無い
       ⑬ h1・canonical … h1 が 1つ・字が 帯と 同じ・canonical ＝ og:url
       ⑭ 分ける 線 … JS の WIDE_MQ と CSS の --wide が 同じ
       ⑮ 外部通信 0 … 読んだ ものが ぜんぶ この 場所から
       ⑯ 役の 名前を 出さない（お決め③）… ゲーム名の 字が h1・帯 以外の 画面の 字に 無い
       ⑰ 札の 絵（§9）… 支給の 絵だけ・JOKER2 を 使わない・比 280:424
       ⑱ コインの 字 … 画面の 2つの 数 ＝ 試合の 数・合計 200
       ⑲ かける ボタン … ★[−10][−1][かけ金：N枚][+1][+10]・N は 1〜100・★端で 灰色・重ならない
       ⑳ 差は 出した あと … 子が 選んで いる 間、場の まん中は 空
       ㉑ K の 決まり（画面）… ★暗い 札 ＝ 決まりで 出せない 札 だけ・★暗い 札は 持ち上がらない
       ㉒ かけ金 1〜100 … 0・101・1.5 を 決まりが 止める／★ロボット 6段が 1〜100 しか 出さない
     ============================================================ */
  function vis(e) {
    if (!e) return false;
    var r = e.getBoundingClientRect(), cs = getComputedStyle(e);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
  }
  function lineCount(el) {
    var rg = document.createRange(); rg.selectNodeContents(el);
    var rs = rg.getClientRects(), tops = [];
    for (var i = 0; i < rs.length; i++) {
      if (rs[i].width < 1) continue;
      var t = Math.round(rs[i].top);
      if (!tops.some(function (x) { return Math.abs(x - t) < 4; })) tops.push(t);
    }
    return tops.length;
  }
  function ruleCases() {
    var S = { sp: 0, h: 1, d: 2, cl: 3 }, c = function (r, s) { return { r: r, s: S[s] }; }, JK = { r: 0, s: -1 };
    return [
      ['親♠7 子♠5', c(7, 'sp'), c(5, 'sp'), 2], ['親♠7 子♥9', c(7, 'sp'), c(9, 'h'), 1],
      ['親♠7 子♥8', c(7, 'sp'), c(8, 'h'), -1], ['親♠7 子♥J', c(7, 'sp'), c(11, 'h'), -1],
      ['親♦A 子♦3', c(1, 'd'), c(3, 'd'), -1], ['親♦A 子♣A', c(1, 'd'), c(1, 'cl'), 10],
      ['親♣2 子♣4', c(2, 'cl'), c(4, 'cl'), -1], ['親♣2 子JK', c(2, 'cl'), JK, 50],
      ['親♣2 子♥2', c(2, 'cl'), c(2, 'h'), -10], ['親JK 子♥2', JK, c(2, 'h'), 100],
      ['親JK 子♦2', JK, c(2, 'd'), -1], ['親♠K 子♥J', c(13, 'sp'), c(11, 'h'), 1],
      ['親♠3 子♥A', c(3, 'sp'), c(1, 'h'), 1], ['親♠4 子♠2', c(4, 'sp'), c(2, 'sp'), 2],
      ['親♠5 子JK', c(5, 'sp'), JK, -1]
    ];
  }
  var minusGoOn = 0;      /* ★ 0枚より 少なく なった あとも 続いた 試合の 数（★verify ② の メモ） */
  function checkMatch(Lh, Lr, seed, bad) {
    var r2 = C.rng(seed), s = C.newMatch(r2), Ls = [Lh, Lr], n = 0, par = [0, 0], wentMinus = false;
    function inv(where) {
      var all = s.deck.concat(s.hands[0], s.hands[1], s.discard, s.down ? [s.down] : [], s.childCard ? [s.childCard] : []);
      var ks = {}, dup = 0;
      all.forEach(function (x) { var k = C.key(x); if (ks[k]) dup++; ks[k] = 1; });
      if (all.length !== C.DECK_N || dup) bad.push('②札が 28枚 1枚ずつ で ない（' + where + '：' + all.length + '枚・重なり ' + dup + '）');
      if (s.coins[0] + s.coins[1] !== 200) bad.push('②コインの 合計が ' + (s.coins[0] + s.coins[1]) + '（' + where + '）');
    }
    while (s.phase !== 'over') {
      if (++n > C.ROUNDS) { bad.push('②14回で おわらない（種 ' + seed + '）'); break; }
      var o = s.parent, c = 1 - o, want = handAt(s.round);
      if (s.round !== n) bad.push('②回の 数が ずれた（' + s.round + '／' + n + '）');
      if (s.hands[0].length !== want || s.hands[1].length !== want) bad.push('②' + s.round + '回目の 頭で 手札が ' + s.hands[0].length + '・' + s.hands[1].length + '枚（正は ' + want + '）');
      if (o !== ((s.round & 1) ? HUMAN : ROBOT)) bad.push('②親が 交代して いない／1回目の 親が あなたで ない（' + s.round + '回目）');
      par[o]++;
      /* ★ T310：決まりが 例外で 止まったら ★見張りも 止まらず ★NG に して この 試合を やめる（★壊して 見つけた 穴） */
      try { C.place(s, o, C.pickParent(Ls[o], C.viewFor(s, o), r2)); } catch (e) { bad.push('②' + e.message); break; }
      inv('ふせた あと');
      var bt = C.chooseBet(Ls[c], C.viewFor(s, c), r2);
      if (!C.betOk(bt)) bad.push('②段' + Ls[c] + ' の かけ金が ' + bt);
      try { C.bet(s, c, bt); } catch (e) { bad.push('②' + e.message); break; }
      inv('かけた あと');
      var before = s.hands[c].slice(), had = before.some(C.isFaceOrA), isK = !C.isJoker(s.down) && C.isKing(s.down);
      var ci = C.choosePlay(Ls[c], C.viewFor(s, c), s.down, r2), r;
      try { r = C.play(s, c, ci); } catch (e) { bad.push('②' + e.message + '（段' + Ls[c] + '）'); break; }
      inv('出した あと');
      if (isK && had && !C.isFaceOrA(r.k)) bad.push('②K に J・Q・K・A 以外を 出した（' + C.speak(r.k) + '）');
      if ((r.kind === 'kpen') !== (isK && !had)) bad.push('②K の 10倍が ' + (r.kind === 'kpen' ? '出せる 札が ある のに 付いた' : '出せる 札が 無い のに 付かない'));
      if (isK && had && !(r.mult === 1 || r.mult === 2)) bad.push('②K に ' + C.speak(r.k) + ' を 出したのに 子の 勝ちで ない（' + r.mult + '倍）');
      if (isK && had && (r.mult === 2) !== (r.k.s === r.p.s)) bad.push('②K の 2倍が マークと 合わない');
      if (r.move !== r.mult * r.bet) bad.push('②はらいが ' + r.move + '（正は ' + r.mult + '×' + r.bet + '）');
      if (s.coins[0] < 0 || s.coins[1] < 0) wentMinus = true;
      try { C.next(s); } catch (e) { bad.push('②' + e.message); break; }
      inv('次へ');
      if (wentMinus && s.phase !== 'over') wentMinus = 'go';
    }
    if (s.round !== C.ROUNDS) bad.push('②' + s.round + '回で おわった（正は 14回）');
    if (s.hands[0].length || s.hands[1].length || s.deck.length) bad.push('②おわりに 手札 ' + s.hands[0].length + '・' + s.hands[1].length + '・山 ' + s.deck.length + '（正は 0・0・0）');
    if (s.discard.length !== C.DECK_N) bad.push('②捨て札が ' + s.discard.length + '枚');
    if (par[0] !== 7 || par[1] !== 7) bad.push('②親の 回数 ' + par.join('・') + '（正は 7・7）');
    if (wentMinus === 'go') minusGoOn++;
    return s;
  }

  function verify() {
    var ng = [], note = {};
    function put(no, arr, info) { for (var i = 0; i < arr.length; i++) ng.push(no + ' ' + arr[i]); note[no] = arr.length ? ('NG ' + arr.length) : ('OK' + (info ? '（' + info + '）' : '')); }

    /* ① 決まり */
    var b1 = [];
    ruleCases().forEach(function (x) { var g = C.judge(x[1], x[2]); if (g !== x[3]) b1.push(x[0] + ' → ' + g + '（正は ' + x[3] + '）'); });
    /* ★ T310：K の 決まり・ジョーカー 2枚（★手札ごと 見る ので payOf ／ legalIdx で 数える） */
    var cc = function (r, s) { return { r: r, s: s }; }, J1 = cc(0, -1), J2 = cc(0, -2), nK = 0;
    [
      ['親♠K 手[♥J,♠5] ♥J', cc(13, 0), [cc(11, 1), cc(5, 0)], 0, 1],
      ['親♠K 手[♠J,♥5] ♠J', cc(13, 0), [cc(11, 0), cc(5, 1)], 0, 2],
      ['親♠K 手[♥Q,♠5] ♥Q（★K に Q は 勝ち）', cc(13, 0), [cc(12, 1), cc(5, 0)], 0, 1],
      ['親♠K 手[♠Q,♥5] ♠Q（★マークも 同じ 2倍）', cc(13, 0), [cc(12, 0), cc(5, 1)], 0, 2],
      ['親♠K 手[♥K,♠5] ♥K（★K に K は 勝ち）', cc(13, 0), [cc(13, 1), cc(5, 0)], 0, 1],
      ['親♠K 手[♥A,♠5] ♥A（★K に A は 勝ち）', cc(13, 0), [cc(1, 1), cc(5, 0)], 0, 1],
      ['親♥K 手[♥A,JK] ♥A', cc(13, 1), [cc(1, 1), J1], 0, 2],
      ['親♠K 手[♥5,♠7] ♥5（J・Q・K・A 無し）', cc(13, 0), [cc(5, 1), cc(7, 0)], 0, -10],
      ['親♠K 手[JK,♠7] JK（ジョーカーは 絵札で ない）', cc(13, 0), [J1, cc(7, 0)], 0, -10],
      ['親JK1 手[JK2] JK2（★ジョーカーに ジョーカーは 子の 負け）', J1, [J2], 0, -1],
      ['親JK1 手[♥2,JK2] ♥2', J1, [cc(2, 1), J2], 0, 100],
      ['親♠2 手[JK2] JK2', cc(2, 0), [J2], 0, 50],
      ['親JK2 手[♥2] ♥2', J2, [cc(2, 1)], 0, 100],
      ['親♥J 手[♠K] ♠K（K は 子の ときは ふつう）', cc(11, 1), [cc(13, 0)], 0, 1]
    ].forEach(function (x) { nK++; var g = C.payOf(x[1], x[2][x[3]], x[2]); if (g !== x[4]) b1.push(x[0] + ' → ' + g + '（正は ' + x[4] + '）'); });
    var lg = C.legalIdx([cc(5, 0), cc(11, 1), cc(7, 1), cc(1, 0)], cc(13, 1)).join(',');
    if (lg !== '1,3') b1.push('K に 出せる 札が ' + lg + '（正は 1,3）');
    try {
      var tK = C.newMatch(C.rng(5)); tK.parent = ROBOT; tK.hands[1][0] = cc(13, 0); tK.hands[0] = [cc(5, 0), cc(11, 1), cc(7, 1), cc(1, 0), cc(9, 0)];
      C.place(tK, 1, 0); C.bet(tK, 0, 10);
      var threw = false; try { C.play(tK, 0, 0); } catch (e) { threw = true; }
      if (!threw) b1.push('K に 出せる 札が ある のに ♠5 を 出せた');
    } catch (e) { b1.push('K の 場面が 動かない：' + e.message); }
    /* ★ 手で 数えた 手札 2つ（★1枚ずつ 数えた 表は logs/T310 の メモ）*/
    var hA = [cc(5, 0), cc(9, 1), cc(13, 0), cc(1, 1), J1], eA = C.handEV(hA, C.unseenOf(hA, [], false));
    if (Math.abs(eA.ev - 111 / 23) > 1e-12 || Math.abs(eA.pw - 10 / 23) > 1e-12) b1.push('手札A の 期待値 ' + eA.ev + '・確率 ' + eA.pw + '（正は 111/23・10/23）');
    var hB = [cc(5, 0), cc(6, 1), cc(7, 0), cc(8, 1), J1], eB = C.handEV(hB, C.unseenOf(hB, [], false));
    if (Math.abs(eB.ev - 89 / 23) > 1e-12 || Math.abs(eB.pw - 14 / 23) > 1e-12) b1.push('手札B（K で −10）の 期待値 ' + eB.ev + '・確率 ' + eB.pw + '（正は 89/23・14/23）');
    var dk = C.makeDeck(), dks = {};
    dk.forEach(function (x) { dks[C.key(x)] = 1; });
    if (dk.length !== 28 || Object.keys(dks).length !== 28) b1.push('札が ' + dk.length + '枚（★正は スペード 13・ハート 13・ジョーカー 2 の 28枚）');
    if (dk.some(function (x) { return x.s === 2 || x.s === 3; })) b1.push('ダイヤ／クローバーが 入って いる');
    if (C.newMatch(C.rng(9)).parent !== HUMAN) b1.push('1回目の 親が あなたで ない（★社長の お決め）');
    if (C.fileName(J1) !== 'JOKER1' || C.fileName(J2) !== 'JOKER2') b1.push('ジョーカーの 絵が ' + C.fileName(J1) + '・' + C.fileName(J2));
    put('①', b1, (15 + nK + 5) + '件');

    /* ② 試合 */
    var b2 = [], nm = 0;
    minusGoOn = 0;
    [1, 3, 5].forEach(function (Lr) { for (var Lh = 0; Lh <= 5; Lh++) for (var g = 0; g < 5; g++) { checkMatch(Lh, Lr, 700 + Lh * 31 + Lr * 7 + g, b2); nm++; } });
    /* ★ T310：★0枚より 少なく なっても おわらない ことを ★決めた 場面で 1つ（★K に 出せる 札 無し × 100枚 ＝ −1,000） */
    try {
      var tN = C.newMatch(C.rng(11)), cn = function (r, s2) { return { r: r, s: s2 }; }; tN.parent = ROBOT;
      tN.hands[1][0] = cn(13, 0); tN.hands[0] = [cn(3, 0), cn(4, 1), cn(5, 0), cn(6, 1), cn(7, 0)];
      C.place(tN, ROBOT, 0); C.bet(tN, HUMAN, 100); C.play(tN, HUMAN, 0);
      if (tN.coins[HUMAN] !== -900 || tN.coins[ROBOT] !== 1100) b2.push('K で 100枚 × 10倍 → ' + tN.coins.join('・') + '（正は −900・1100）');
      C.next(tN);
      if (tN.phase !== 'place' || tN.round !== 2) b2.push('0枚より 少なく なって おわった（' + tN.phase + '）');
    } catch (e) { b2.push('0枚より 少ない 場面が 動かない：' + e.message); }
    put('②', b2.slice(0, 6), nm + '試合・★0枚より 少なく なって 続いた 試合 ' + minusGoOn);

    /* ③ ロボットが のぞかない */
    var b3 = [];
    var tst = C.newMatch(C.rng(3)), v = C.viewFor(tst, ROBOT), ks = Object.keys(v).sort().join(',');
    if (ks !== 'coins,deckN,hand,oppCoins,seen') b3.push('ロボットに 渡す 中身が ' + ks);
    if (JSON.stringify(v.hand) !== JSON.stringify(tst.hands[ROBOT])) b3.push('view の 手札が ロボットの 手札と ちがう');
    var roboSrc = String(robotPlace) + String(robotBet) + String(robotPlay);
    if (/st\.hands|st\.deck|hands\[HUMAN\]/.test(roboSrc)) b3.push('ロボットの 手の 中で 手札・山を じかに 見て いる');
    if ((roboSrc.match(/C\.viewFor\(st, ROBOT\)/g) || []).length !== 3) b3.push('ロボットの 3つの 手が view を 通って いない');
    var coreSrc = String(C.pickParent) + String(C.chooseBet) + String(C.choosePlay);
    /* ★ T310：view.deckN（★山の 枚数 ＝ 画面の「山 18」と 同じ 見える 数）は よい。★山そのもの（.deck）・手札（.hands）は だめ */
    if (/\.deck(?!N)|\.hands|st\./.test(coreSrc)) b3.push('ロボットの 考え方の 中に 山・手札の 字が ある');
    put('③', b3);

    /* ④ 光らせない */
    var b4 = [], cards = handEl.querySelectorAll('.hcard'), nLift = 0;
    for (var i = 0; i < cards.length; i++) {
      var cl = cards[i].className.split(/\s+/).filter(function (x) { return x && x !== 'hcard' && x !== 'is-lift' && x !== 'is-new' && x !== 'is-dim' && x !== 'is-no'; });   /* ★ is-dim・is-no は ㉑ が 数える */
      if (cl.length) b4.push('手札に 余計な しるし：' + cl.join(','));
      if (cards[i].classList.contains('is-lift')) nLift++;
      if (cards[i].style.cssText) b4.push('手札に じかの 見た目：' + cards[i].style.cssText);
    }
    if (nLift > 1) b4.push('持ち上げが ' + nLift + '枚');
    var uiSrc = String(renderHand) + String(render) + String(onCard) + String(renderActions) + String(setSlot);
    if (/judge|kindOf|handEV|diffOf|unseenOf|pickParent|choosePlay/.test(uiSrc)) b4.push('手札・場を 描く 所で 札の 値打ちを 数えて いる');
    try {
      for (var sI = 0; sI < document.styleSheets.length; sI++) {
        var rules = document.styleSheets[sI].cssRules || [];
        (function walk(list) {
          for (var q = 0; q < list.length; q++) {
            if (list[q].cssRules) walk(list[q].cssRules);
            var sel = list[q].selectorText || '';
            if (/\.hcard[^,{]*:(hover|active)|\.slot-card[^,{]*:hover/.test(sel)) b4.push('札に :hover／:active の 決まり：' + sel);
          }
        })(rules);
      }
    } catch (e) {
      /* ★ file:// で 開いた ときは Chrome が CSS の 中身を 見せない ―― ★「通った」とは 書かない */
      if (location.protocol === 'file:') note['④ :hover の 決まり'] = '★測れていません（file:// では CSS を 読めない。★http で 開いて 数える）';
      else b4.push('CSS を 読めない：' + e.message);
    }
    put('④', b4, '手札 ' + cards.length + '枚・持ち上げ ' + nLift);

    /* ⑤ ハッピー */
    var b5 = [], cat = $('happyCat');
    if (!vis(cat)) b5.push('ハッピーの 絵が 見えない');
    else { var cr = cat.getBoundingClientRect(); if (cr.width < 30 || cr.height < 30) b5.push('ハッピーが 小さすぎ ' + Math.round(cr.width) + '×' + Math.round(cr.height)); }
    if (!cat || !cat.querySelector('.cat-tail')) b5.push('しっぽが 無い');
    if (!cat || !cat.querySelector('.cat-eyes')) b5.push('まばたきの 目が 無い');
    if (!vis(bubble) || !bubble.textContent.trim()) b5.push('ふきだしが 見えない／空');
    if ((($('happyWrap').textContent || '') + (cat ? cat.getAttribute('aria-label') : '')).indexOf('ハッピー') < 0) b5.push('名前「ハッピー」が 無い');
    var lcNow = vis(bubble) ? lineCount(bubble) : 0;
    if (lcNow > 2) b5.push('いまの ふきだしが ' + lcNow + '行');
    if (vis(bubble)) {
      var keep = bubble.textContent, worst = 0, worstK = '';
      Object.keys(LINES).forEach(function (k) {
        bubble.textContent = LINES[k].replace('{n}', '20');
        var n = lineCount(bubble); if (n > worst) { worst = n; worstK = k; }
        if (n > 2) b5.push('「' + k + '」が ' + n + '行');
      });
      bubble.textContent = keep;
      note['⑤ いちばん 長い 言葉'] = worstK + ' ' + worst + '行';
    }
    put('⑤', b5);

    /* ⑥ ↻ やめる */
    var b6 = [], q = btnQuit, playing = phase !== 'title';
    if (!q || q.parentNode !== topbar) b6.push('やめる が 上の帯に 無い');
    else {
      var kids = [].filter.call(topbar.children, vis);
      if (playing) {
        if (!vis(q)) b6.push('遊んで いる のに やめる が 見えない');
        else {
          if (kids[kids.length - 1] !== q) b6.push('やめる が 帯の 右はしで ない');
          var qr = q.getBoundingClientRect(), qs = getComputedStyle(q);
          if (qr.width < 44 || qr.height < 44) b6.push('やめる が ' + qr.width.toFixed(1) + '×' + qr.height.toFixed(1));
          if (qs.backgroundColor !== 'rgb(183, 237, 201)') b6.push('地の 色 ' + qs.backgroundColor);
          if (qs.borderTopColor !== 'rgb(47, 125, 76)' || qs.borderTopWidth !== '3px') b6.push('わく ' + qs.borderTopColor + ' ' + qs.borderTopWidth);
          if (qs.color !== 'rgb(34, 99, 63)') b6.push('字の 色 ' + qs.color);
          if (qs.position !== 'relative' || qs.zIndex !== '2') b6.push('position/z-index ' + qs.position + '/' + qs.zIndex);
          var sv = q.querySelector('svg.quit-icon');
          if (!sv) b6.push('↻ の SVG が 無い');
          else if (window.innerWidth >= 375) { var svr = sv.getBoundingClientRect(); if (Math.round(svr.width) !== 16 || Math.round(svr.height) !== 16) b6.push('↻ が ' + svr.width + '×' + svr.height); }
          if ((q.textContent || '').trim() !== 'やめる') b6.push('字が「' + q.textContent.trim() + '」');
          if (q.querySelector('small')) b6.push('小さい字の 注意が ある（★この本は 付けない 決め）');
        }
      } else if (vis(q)) b6.push('はじめの 画面で やめる が 出て いる');
    }
    put('⑥', b6);

    /* ⑦ 結果の 箱 */
    var b7 = [], home = $('btnResultHome');
    if ((resultWrap.textContent || '').indexOf('やめる') >= 0) b7.push('結果の 箱に「やめる」の 字');
    if (!home || home.getAttribute('href') !== '../') b7.push('◀ ゲームを選ぶ の 行き先が ../ で ない');
    if (!home || home.textContent.replace(/\s+/g, '') !== '◀ゲームを選ぶ') b7.push('字が「' + (home ? home.textContent : '') + '」');
    if ((btnAgain.textContent || '').indexOf('もう1回') < 0) b7.push('もう1回 が 無い');
    if (vis(resultBox)) {
      [btnAgain, home].forEach(function (e) { if (vis(e) && lineCount(e) > 1) b7.push(e.id + ' が ' + lineCount(e) + '行に 折れた'); });
      var rb = resultBox.getBoundingClientRect();
      if (rb.top < -0.5 || rb.bottom > window.innerHeight + 0.5) b7.push('箱が 画面から 出た（' + Math.round(rb.top) + '〜' + Math.round(rb.bottom) + '）');
    }
    put('⑦', b7);

    /* ⑧ 指の的 44px */
    var b8 = [], nT = 0, dlgOpen = helpDialog.open;
    var tgt = document.querySelectorAll('a[href], button, select');
    for (var t = 0; t < tgt.length; t++) {
      var el = tgt[t];
      if (!vis(el)) continue;
      if (!dlgOpen && helpDialog.contains(el)) continue;
      if (dlgOpen && !helpDialog.contains(el)) continue;
      if (!resultWrap.classList.contains('hidden') && !resultWrap.contains(el) && !dlgOpen) continue;
      var r8 = el.getBoundingClientRect();
      if (r8.bottom < 0 || r8.top > window.innerHeight) continue;
      /* ★ T310：遊び方の 箱の 中で ★すべらせないと 見えない 所に ある もの（★中心が 箱の 見える 所の 外）は まだ 指の的では ない。
         ★ 画面の 外の ものを 数えない のと 同じ 決まり（★K の 説明が 増えて 390×844 で「分かった！」が 箱の ふちに かかった）。
         ★ 中心が 見える 所に あれば 前と 同じく ★まん中を 押して 自分に 当たるか 数える。 */
      if (dlgOpen) { var dr8 = helpDialog.getBoundingClientRect(), cy8 = r8.top + r8.height / 2; if (cy8 < dr8.top || cy8 > dr8.top + helpDialog.clientHeight) continue; }
      nT++;
      var nm8 = el.id || el.className || el.tagName;
      if (r8.width < 43.5 || r8.height < 43.5) b8.push(nm8 + ' ' + r8.width.toFixed(1) + '×' + r8.height.toFixed(1));
      var cx = r8.left + r8.width / 2, cy = r8.top + r8.height / 2;
      if (cx >= 0 && cy >= 0 && cx < window.innerWidth && cy < window.innerHeight) {
        var hit = document.elementFromPoint(cx, cy);
        if (hit && hit !== el && !el.contains(hit)) b8.push(nm8 + ' の まん中を ' + (hit.id || hit.className || hit.tagName) + ' が 取る');
      }
    }
    put('⑧', b8, nT + '個');

    /* ⑨ 重ならない・はみ出さない */
    var b9 = [], blocks = [topbar, titleScreen, $('robotRow'), tableArea, $('logRow'), $('meRow'), handArea, $('actionRow')].filter(vis);
    for (var x = 0; x < blocks.length; x++) for (var y = x + 1; y < blocks.length; y++) {
      var A = blocks[x].getBoundingClientRect(), B = blocks[y].getBoundingClientRect();
      var ow = Math.min(A.right, B.right) - Math.max(A.left, B.left), oh = Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top);
      if (ow > 0.5 && oh > 0.5) b9.push(blocks[x].id + ' と ' + blocks[y].id + ' が ' + ow.toFixed(1) + '×' + oh.toFixed(1) + ' 重なる');
    }
    /* ★★ T307 で 見張りが 1度 黙った ところ ★★
       ★ スマホは 中身が はみ出すと ★画面ごと 縮めて 見せる（★innerWidth が 568 → 2011 に 伸びる）。
       ★ ★innerWidth と くらべると ★はみ出した 分だけ ものさしも 伸びて ★鳴かない【★568×272 で 実測】。
       ★ → ★端末の 画面の 長い 辺で ふたを する（★iPhone は 横でも screen.width が たての はば なので 長い 辺）。 */
    var sw = document.documentElement.scrollWidth;
    var vw9 = Math.min(window.innerWidth, Math.max(screen.width || 0, screen.height || 0) || window.innerWidth);
    if (sw > vw9 + 0.5) b9.push('よこに すべる（' + sw + ' > ' + vw9 + '）');
    if (phase !== 'title') {
      var ha = handArea.getBoundingClientRect(), mr = $('meRow').getBoundingClientRect();
      [].forEach.call(handEl.querySelectorAll('.hcard'), function (e, i2) {
        var r9 = e.getBoundingClientRect();
        if (r9.left < -0.5 || r9.right > window.innerWidth + 0.5) b9.push('手札 ' + i2 + ' が 画面の よこから 出る');
        if (r9.bottom > ha.bottom + 0.5) b9.push('手札 ' + i2 + ' が 下に はみ出す ' + (r9.bottom - ha.bottom).toFixed(1));
        if (!isWide() && r9.top < mr.bottom - 0.5) b9.push('持ち上げた 手札 ' + i2 + ' が「あなた」の 行に かかる');
      });
      [cardRobot, cardMe].forEach(function (e) {
        var r9 = e.getBoundingClientRect(), tr = tableArea.getBoundingClientRect();
        if (r9.top < tr.top - 0.5 || r9.bottom > tr.bottom + 0.5 || r9.left < tr.left - 0.5 || r9.right > tr.right + 0.5) b9.push(e.id + ' が 場から はみ出す');
      });
      var mb = midEl.getBoundingClientRect(), sr = $('slotRobot').getBoundingClientRect(), sm = $('slotMe').getBoundingClientRect();
      if (mb.left < sr.right - 0.5 || mb.right > sm.left + 0.5) b9.push('場の まん中が 札に かかる');
    }
    put('⑨', b9);

    /* ⑩ 帯の sticky */
    var b10 = [], tcs = getComputedStyle(topbar);
    if (tcs.position !== 'sticky') b10.push('帯が ' + tcs.position);
    for (var an = topbar.parentElement; an && an !== document.body; an = an.parentElement) {
      var acs = getComputedStyle(an);
      if (acs.overflowX !== 'visible' || acs.overflowY !== 'visible') b10.push((an.id || an.tagName) + ' に overflow ' + acs.overflowX + '/' + acs.overflowY);
    }
    var bcs = getComputedStyle(document.body);
    if (bcs.overflowY !== 'visible' && bcs.overflowY !== 'auto') b10.push('body の overflow-y ' + bcs.overflowY);
    var tr10 = topbar.getBoundingClientRect();
    if (tr10.top < -1) b10.push('帯が 画面の 上へ 出た（' + tr10.top.toFixed(1) + '）');
    put('⑩', b10);

    /* ⑪ 題が 折れない */
    var b11 = [], bn = $('brandName'), TITLE = 'オリジナルラビット・ナボコフ';
    if (!bn || bn.textContent !== TITLE) b11.push('題の 字が「' + (bn ? bn.textContent : '') + '」');
    else if (!vis(bn)) b11.push('題が 見えない');
    else {
      /* ★ T310：★1行 か ★2行（★2行の ときは 上が「オリジナル」・下が「ラビット・ナボコフ」で 各1行） */
      var two = brandEl.classList.contains('is-2line'), lc11 = lineCount(bn);
      var sub = bn.querySelector('.bn-sub'), mainT = bn.querySelector('.bn-main');
      if (!sub || !mainT || sub.textContent !== 'オリジナル' || mainT.textContent !== 'ラビット・ナボコフ') b11.push('題の 部品が ちがう');
      else if (two) {
        if (lc11 !== 2 || lineCount(sub) !== 1 || lineCount(mainT) !== 1) b11.push('2行の 題が ' + lc11 + '行（上 ' + lineCount(sub) + '・下 ' + lineCount(mainT) + '）');
        if (sub.getBoundingClientRect().bottom > mainT.getBoundingClientRect().top + 1) b11.push('2行の 題の 上と 下が 重なる');
      } else if (lc11 !== 1) b11.push('題が ' + lc11 + '行');
      if (!brandFits()) b11.push('題が 帯の はばに 入らない');
      var tbr = topbar.getBoundingClientRect(), bnr = bn.getBoundingClientRect();
      if (bnr.top < tbr.top - 0.5 || bnr.bottom > tbr.bottom + 0.5) b11.push('題が 帯の 上下に はみ出す');
      if (bn.scrollWidth > bn.clientWidth + 1) b11.push('題が 切れる（' + bn.scrollWidth + ' > ' + bn.clientWidth + '）');
      var br = bn.getBoundingClientRect(), bk = $('btnBack').getBoundingClientRect();
      if (br.left < bk.right - 0.5) b11.push('題が ◀ に かかる');
      if (vis(btnQuit)) { var qb = btnQuit.getBoundingClientRect(); if (br.right > qb.left + 0.5) b11.push('題が やめる に かかる'); }
      var ht = $('btnHowtoTop');
      if (vis(ht)) { var hr = ht.getBoundingClientRect(); if (br.right > hr.left + 0.5) b11.push('題が 帯の ？遊び方 に かかる'); }
      if (vis(ht) && vis($('btnHowto'))) b11.push('？遊び方 が 2つ 同時に 見える');
      [bn, sub, mainT, brandEl].forEach(function (e) { if (e && getComputedStyle(e).textOverflow === 'ellipsis') b11.push('題が 点々'); });
      note['⑪ 題の はば'] = Math.round(br.width) + 'px・' + (two ? '2行' : '1行') + (brandEl.classList.contains('is-small') ? '・小さい字' : '');
    }
    put('⑪', b11);

    /* ⑫ 非公式の 文 */
    var b12 = [], UO = '『20世紀少年』に登場する架空のギャンブルを非公式にゲーム化。原作者・出版社とは関係ありません。';
    var u1 = $('unofficialTitle'), u2 = $('unofficialHelp');
    if (!u1 || u1.textContent !== UO) b12.push('はじめの 画面の 文が ちがう');
    if (!u2 || u2.textContent !== UO) b12.push('遊び方の 文が ちがう');
    if (u2) { var first = helpDialog.querySelector('.help-sec'); if (!first || !first.contains(u2) || helpDialog.querySelector('.help-list').compareDocumentPosition(u2) !== Node.DOCUMENT_POSITION_PRECEDING) b12.push('遊び方の 一番 上に ない'); }
    if (u1 && titleScreen.lastElementChild !== u1) b12.push('はじめの 画面の 一番 下に ない');
    if (phase === 'title' && u1) {
      if (!vis(u1)) b12.push('はじめの 画面で 見えない');
      else {
        var ur = u1.getBoundingClientRect(), ts = titleScreen.getBoundingClientRect();
        if (ur.bottom > ts.bottom + 0.5 || ur.top < ts.top - 0.5) b12.push('はじめの 画面の 箱から はみ出す');
        if (parseFloat(getComputedStyle(u1).fontSize) < 11) b12.push('字が 11px より 小さい');
        note['⑫ 画面の 中で 見えるか'] = (ur.bottom <= window.innerHeight + 0.5) ? 'すべらせず 見える' : ('★' + Math.round(ur.bottom - window.innerHeight) + 'px すべらせると 見える');
      }
    }
    var WORK = /世紀少年|非公式|浦沢|小学館/;
    function meta(sel) { var m = document.querySelector(sel); return m ? (m.getAttribute('content') || '') : ''; }
    var forb = { title: document.title, description: meta('meta[name="description"]'), 'og:title': meta('meta[property="og:title"]'),
      'og:description': meta('meta[property="og:description"]'), 'twitter:title': meta('meta[name="twitter:title"]'),
      'twitter:description': meta('meta[name="twitter:description"]'), 'og:image': meta('meta[property="og:image"]'),
      h1: (document.querySelector('h1') || {}).textContent || '', '帯の 題': bn ? bn.textContent : '' };
    Object.keys(forb).forEach(function (k) { if (WORK.test(forb[k])) b12.push(k + ' に 作品名／非公式の 字'); });
    put('⑫', b12);

    /* ⑬ h1・canonical */
    var b13 = [], h1s = document.querySelectorAll('h1');
    if (h1s.length !== 1) b13.push('h1 が ' + h1s.length + '個');
    else if (h1s[0].textContent !== (bn ? bn.textContent : '')) b13.push('h1 の 字が 帯と ちがう');
    var can = document.querySelector('link[rel="canonical"]'), ogu = meta('meta[property="og:url"]');
    if (!can || can.getAttribute('href') !== ogu) b13.push('canonical と og:url が ちがう');
    if (ogu !== 'https://bragekobo.com/rabbit-nabokov/') b13.push('og:url が ' + ogu);
    put('⑬', b13);

    /* ⑭ 分ける 線 */
    var b14 = [], cssWide = getComputedStyle(document.documentElement).getPropertyValue('--wide').trim();
    if ((cssWide === '1') !== isWide()) b14.push('JS は ' + isWide() + '・CSS は --wide=' + cssWide);
    put('⑭', b14, isWide() ? '横置き' : 'たて置き');

    /* ⑮ 外部通信 0 */
    var b15 = [], here = location.protocol === 'file:' ? 'file:' : location.origin, nR = 0;
    (performance.getEntriesByType('resource') || []).forEach(function (e) {
      nR++;
      if (e.name.indexOf('data:') === 0) return;
      if (here === 'file:' ? e.name.indexOf('file:') !== 0 : e.name.indexOf(here) !== 0) b15.push('外へ：' + e.name);
    });
    [].forEach.call(document.querySelectorAll('[src],link[rel="stylesheet"],link[rel="preload"]'), function (e) {
      var u = e.getAttribute('src') || e.getAttribute('href') || '';
      if (/^(https?:)?\/\//i.test(u)) b15.push('外を 指す 部品：' + u);
    });
    put('⑮', b15, '読んだ もの ' + nR);

    /* ⑯ 役の 名前を 出さない */
    var b16 = [], NAME = /ナボコフ|ラビット/;
    Object.keys(LINES).forEach(function (k) { if (NAME.test(LINES[k])) b16.push('ハッピーの「' + k + '」に ゲーム名'); });
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null), node, where = [];
    while ((node = walker.nextNode())) {
      if (!NAME.test(node.nodeValue)) continue;
      var host = node.parentNode;
      if ((host && bn && bn.contains(host)) || (host && host.tagName === 'H1')) continue;   /* ★ T310：題は 2つの span（★オリジナル／ラビット・ナボコフ） */
      if (host && (host.tagName === 'SCRIPT' || host.tagName === 'STYLE')) continue;
      where.push((host && (host.id || host.className || host.tagName)) || '?');
    }
    if (where.length) b16.push('画面の 字に ゲーム名：' + where.join('・'));
    put('⑯', b16);

    /* ⑰ 札の 絵 */
    var b17 = [], okNames = {}, nImg = 0;
    C.makeDeck().forEach(function (c) { okNames[C.fileName(c)] = 1; }); okNames[BACK] = 1;
    [].forEach.call(document.querySelectorAll('img'), function (im) {
      var s = im.getAttribute('src'); if (!s) return;
      nImg++;
      if (s.indexOf(CARD_DIR) !== 0) { b17.push('札の 置き場 以外の 絵：' + s); return; }
      var name = decodeURIComponent(s.slice(CARD_DIR.length).replace(/\.png$/, ''));
      if (!okNames[name]) b17.push('使わない 絵：' + name);
      if (s !== srcOf(name)) b17.push('URL が encodeURIComponent を 通って いない：' + s);
      if (vis(im)) { var ir = im.getBoundingClientRect(), ratio = ir.height / ir.width; if (Math.abs(ratio - R) > 0.03 + 1.5 / ir.width) b17.push('比が ' + ratio.toFixed(3) + '（' + name + '）'); }
    });
    put('⑰', b17, nImg + '枚');

    /* ⑱ コインの 字 */
    var b18 = [];
    if (st) {
      var cm = unfmt(coinsMeEl.textContent), crb = unfmt(coinsRobotEl.textContent);
      if (coinsMeEl.textContent !== fmt(st.coins[HUMAN]) || coinsRobotEl.textContent !== fmt(st.coins[ROBOT])) b18.push('字の 形が ちがう（' + coinsMeEl.textContent + '／' + coinsRobotEl.textContent + '）');
      if (/借金/.test(document.body.textContent)) b18.push('「借金」の 字が 出て いる');
      if (cm !== st.coins[HUMAN] || crb !== st.coins[ROBOT]) b18.push('画面 ' + cm + '/' + crb + '・試合 ' + st.coins.join('/'));
      if (cm + crb !== 200) b18.push('画面の 合計が ' + (cm + crb));
    }
    put('⑱', b18);

    /* ⑲ かける ボタン（★T310：社長の 形 [−10][−1][かけ金：N枚][+1][+10]） */
    var b19 = [];
    if (phase === 'bet' && st) {
      var bb = [].slice.call(betRow.querySelectorAll('.bet-btn'));
      var want19 = ['−10', '−1', 'かけ金：' + myBet + '枚', '+1', '+10'];
      if (bb.length !== 5) b19.push('ボタンが ' + bb.length + '個');
      else {
        bb.forEach(function (b, i) { if (b.textContent.replace(/\s+/g, '') !== want19[i]) b19.push((i + 1) + '番目の 字が「' + b.textContent + '」（正は「' + want19[i] + '」）'); });
        if (!C.betOk(myBet)) b19.push('かけ金が ' + myBet + '（★1〜100）');
        var shouldOff = [myBet <= C.BET_MIN, myBet <= C.BET_MIN, false, myBet >= C.BET_MAX, myBet >= C.BET_MAX];
        bb.forEach(function (b, i) { if (b.disabled !== shouldOff[i]) b19.push(want19[i] + ' が ' + (b.disabled ? '押せない' : '押せる')); });
        /* ★ 押せない ボタンは ★押せる ±の ボタンと 地の 色が ちがう（★灰色） */
        var en19 = bb.filter(function (b, i) { return i !== 2 && !b.disabled; })[0];
        bb.forEach(function (b, i) {
          if (b.disabled && en19 && getComputedStyle(b).backgroundColor === getComputedStyle(en19).backgroundColor) b19.push(want19[i] + ' が 押せないのに 色が 同じ');
          var r = b.getBoundingClientRect();
          if (r.left < -0.5 || r.right > window.innerWidth + 0.5) b19.push(want19[i] + ' が 画面の よこから 出る');
          for (var j = i + 1; j < bb.length; j++) {
            var q2 = bb[j].getBoundingClientRect();
            if (Math.min(r.right, q2.right) - Math.max(r.left, q2.left) > 0.5 && Math.min(r.bottom, q2.bottom) - Math.max(r.top, q2.top) > 0.5) b19.push(want19[i] + ' と ' + want19[j] + ' が 重なる');
          }
        });
        if (bb[2].scrollWidth > bb[2].clientWidth + 0.5) b19.push('まん中の 字が はみ出す');
        var tops = bb.map(function (b) { return Math.round(b.getBoundingClientRect().top); });
        var rows19 = tops.filter(function (t, i) { return tops.indexOf(t) === i; }).length;
        if (rows19 > 2) b19.push(rows19 + '段に なった');
        note['⑲ かけ金の 段'] = rows19 + '段';
      }
    }
    put('⑲', b19);

    /* ⑳ 差は 出した あと */
    var b20 = [];
    if ((phase === 'human-play' || phase === 'human-place' || phase === 'bet' || phase === 'robot-place') && midResult.textContent.trim()) b20.push('選ぶ 前に 場の まん中に「' + midResult.textContent + '」');
    put('⑳', b20);

    /* ㉑ K の 決まり（画面）★暗い 札 ＝ 決まりで 出せない 札 だけ／暗い 札は 持ち上がらない */
    var b21 = [], dimNow = [].map.call(handEl.querySelectorAll('.hcard'), function (e) { return e.classList.contains('is-dim'); });
    var shouldDim = {};
    if (phase === 'human-play' && st && st.down) {
      var L21 = C.legalIdx(st.hands[HUMAN], st.down);
      if (L21.length !== st.hands[HUMAN].length) for (var i21 = 0; i21 < st.hands[HUMAN].length; i21++) if (L21.indexOf(i21) < 0) shouldDim[i21] = 1;
    }
    dimNow.forEach(function (d, i) { if (d !== !!shouldDim[i]) b21.push('手札 ' + i + ' が ' + (d ? '暗い（出せる のに）' : '暗く ない（出せない のに）')); });
    var nDim = dimNow.filter(Boolean).length;
    if (nDim && phase === 'human-play') {
      var di = dimNow.indexOf(true), keepL = lifted, keepB = bubble.textContent, keepM = happyWrap.dataset.mood;
      handEl.children[di].click();                       /* ★ 本物の クリックの 道（★押す 所の 決まりごと 数える） */
      if (lifted !== keepL || handEl.querySelectorAll('.hcard.is-dim.is-lift').length) b21.push('暗い 札が 持ち上がった');
      if (bubble.textContent !== LINES.noK) b21.push('暗い 札を 押しても ハッピーが わけを 言わない');
      lifted = keepL; say(keepB, keepM); renderHand(); renderActions();
    }
    put('㉑', b21, '暗い 札 ' + nDim + '枚');

    /* ㉒ かけ金 1〜100（★決まりが 止める／★ロボット 6段が 外へ 出さない） */
    var b22 = [];
    [0, 101, 1.5, -5, '10'].forEach(function (x) {
      var tb = C.newMatch(C.rng(21)); tb.parent = ROBOT; C.place(tb, ROBOT, 0);
      var th = false; try { C.bet(tb, HUMAN, x); } catch (e) { th = true; }
      if (!th) b22.push(JSON.stringify(x) + ' 枚を かけられた');
    });
    [1, 100].forEach(function (x) { var tb = C.newMatch(C.rng(22)); tb.parent = ROBOT; C.place(tb, ROBOT, 0); try { C.bet(tb, HUMAN, x); } catch (e) { b22.push(x + ' 枚が かけられない'); } });
    if (C.clampBet(5 - 10) !== 1 || C.clampBet(95 + 10) !== 100) b22.push('端で 止まらない');
    for (var L22 = 0; L22 <= 5; L22++) for (var g22 = 0; g22 < 40; g22++) {
      var sb = C.newMatch(C.rng(300 + g22)); sb.parent = ROBOT; C.place(sb, ROBOT, 0);
      var v22 = C.chooseBet(L22, C.viewFor(sb, HUMAN), C.rng(900 + g22));
      if (!C.betOk(v22)) { b22.push('段' + L22 + ' が ' + v22 + '枚'); break; }
    }
    put('㉒', b22);

    /* ㉓ 場の まん中の 字は あなたから 見た 字（★T312 A）
       ★ ぜんぶの 場合（★子・親 × 結果 11通り）を 数える：★得 → 「−」で 始まらない・「はずれ」「負け」で ない／
         ★損 → 「！」が 無い・「勝ち」が 無い。★いま 出て いる 字と 丸（is-win）も あなたの 得と そろって いるか。 */
    var b23 = [], nC = 0;
    [['hit', 3, 1], ['hit', 2, 1], ['suit', 2, 2], ['miss', 5, -1], ['miss', null, -1], ['x10', null, 10], ['x50', null, 50], ['x100', null, 100],
     ['trap', null, -10], ['kpen', null, -10], ['kwin', null, 1], ['ksuit', null, 2]].forEach(function (x) {
      var kind = x[0], diff = x[1], mult = x[2];
      if (kind === 'hit' && diff !== 2) { kind = 'miss'; mult = -1; }
      [true, false].forEach(function (meChild) {
        nC++;
        var g = meChild ? mult : -mult, t = midTop(kind, diff, mult, meChild), tag = (meChild ? '子' : '親') + '・' + kind + (diff !== null ? '差' + diff : '');
        if (g > 0 && (/^−/.test(t) || /はずれ|負け/.test(t))) b23.push(tag + '：得 なのに「' + t + '」');
        if (g < 0 && (/！/.test(t) || /勝ち/.test(t))) b23.push(tag + '：損 なのに「' + t + '」');
      });
    });
    if (phase === 'result' && st && st.last) {
      var L23 = st.last, g23 = L23.child === HUMAN ? L23.move : -L23.move, big23 = midResult.querySelector('.mr-big');
      if (!big23 || big23.textContent !== midTop(L23.kind, L23.diff, L23.mult, L23.child === HUMAN)) b23.push('いまの まん中の 字が ちがう');
      if (midResult.classList.contains('is-win') !== (g23 > 0)) b23.push('ぽんの 丸が あなたの 得と ちがう');
    }
    put('㉓', b23, nC + '通り');

    return { '★NG': ng.length, '中身': ng.length ? ng : 'OK', '場面': phase, '画面': window.innerWidth + '×' + window.innerHeight, '数えた': note };
  }

  /* ★ 外の 道具が 使う 入口（★ゲームの 進み方は 変えない） */
  window.RN = {
    verify: verify,
    phase: function () { return phase; },
    bet: function () { return myBet; },
    state: function () { return st; },
    lines: LINES,
    fit: fit,
    tune: TUNE,
    /* ★ 測る 道具が「試合の おわり」を すぐ 見る ための 近道（★決まりの 手だけで 最後まで 進める） */
    _finishNow: function () {
      if (!st) return false;
      stopAll();
      while (st.phase !== 'over') {
        var o = st.parent, c = 1 - o;
        if (st.phase === 'place') C.place(st, o, 0);
        if (st.phase === 'bet') C.bet(st, c, C.BET_START);
        if (st.phase === 'play') C.play(st, c, C.legalIdx(st.hands[c], st.down)[0]);
        if (st.phase === 'done') C.next(st);
      }
      render(); showFinal(); return true;
    }
  };
})();
