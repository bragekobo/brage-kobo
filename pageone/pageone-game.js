/* ============================================================
   ページワン ― 画面（T152・コーダ）
   ------------------------------------------------------------
   ★ ルールと ロボットは pageone-core.js に あります。
     ★ ここには ルールが 1行も ありません（★勝ち負けの 決め方も core が 返します）。
     ★ ＝ 数える 側（Node）と 遊ぶ 側（画面）が ズレようが ない。

   ★★★ この 1本で いちばん 気を つけた 3つ ★★★
     ------------------------------------------------------------
     ① ★★8を 出した あとの マーク選びは **絶対に 自動化しない**（設計図 追記②）
        ★ この ファイルには、★**人の 番で マークを 決める 行が 1行も ありません。**
        ★ 人が 4つの ボタンから 押した 数を、そのまま core へ 渡すだけ。
        ★ ★verify ③ が、1行ずつ 走査して 見張ります。
     ② ★★強調は 1種類だけ ―― ★**出せない 札を 暗くする**（設計図 §5.5）
        ★ 光らせません。★わくも 付けません。★引き算 だけ です。
        ★ ★verify ④⑤ が、CSS と 本物の refreshDim を 通して 見張ります。
     ③ ★★勝手に 引かない（設計図 追記④）
        ★ 人が 引くのは ★**山札を 押した とき だけ**。
        ★ ★verify ⑥ が、doDraw を 呼ぶ 行を 走査します。

   ★★ 測る ときの 決まり（★会社で 4回 かかった わな）★★
     ★ 動いて いる 途中を 測らない。★測る ときは .measuring を 付けて
       ★うつり変わりと 動きを 止めてから 測る。★札の 場所は style.left/top（＝ 行き先）を 見る。
   ============================================================ */
(function (root) {
  'use strict';

  var C = root.PAGEONE_CORE;
  var T = C.TUNE;

  /* ★ Node（画面が ない ところ）では ここで おしまい。
     ★ ここから 下は 1行も 動かない ―― だから 数える 側と 遊ぶ 側は ズレようが ない。 */
  if (typeof document === 'undefined') return;

  var $ = function (id) { return document.getElementById(id); };

  /* ── カードの 絵（設計図 §9・厳守）──────────────────
     ・画像は office/games/cards/ の 支給画像。★CSSや 絵文字で 自作しない。
     ・ファイル名が 日本語なので encodeURIComponent を 必ず 通す。
     ・★絵そのもの（cards/）は 1バイトも さわらない ―― 11本が 同じ 絵を 使って いる。 */
  var CARD_DIR = '../cards/';
  function cardSrc(name) { return CARD_DIR + encodeURIComponent(name) + '.png'; }

  /* ★★ ハッピーの ひとこと（ルル §11 の 6場面。★見出しは ルル、文は ここ）★★
     ⚠️★ **手を 教えては いけません**（ルル §11）。
        ★ 「その 8は 取って おいたら？」の たぐいは ★★1文字も 書きません。
        ★ ここに あるのは「いま 何を する 番か」だけ です。 */
  var SAY = {
    start: '同じ マークか 同じ 数字を 出そう！',
    eight: 'マークを 選ぼう！',
    draw:  '出せる 札が ないね。山札を おして 引こう',
    take:  '引かされちゃった！ 山札を おしてね',
    one:   'ページワン！',
    oneMe: 'ページワン！ あと 1枚！'
  };
  var SAY_WIN  = '🐱 やったー！　先に 0枚に なったね！';
  var SAY_LOSE = '🐱 くやしい！　もう1回 やろ？';
  var SAY_SHORT = '🐱 山札が なくなったよ！　手札が いちばん 少ない 人の 勝ち！';

  /* ============================================================
     ★★ 絵の 先読み（設計図 §9・2026-08-26 の 行）★★
     ------------------------------------------------------------
     ★ この 1本で 使う札 ＝ **53個**（52枚 ＋ トランプ裏赤）。★JOKER は 読みません。
     ★★ 裏面（トランプ裏赤）は ―― ★ロボット3人の 手札と 山札 ぜんぶ。★いちばん 先に 読みます。
     ★ 裏で **4本ずつ** 流す（★52本 まとめて 出すと、細い 線では 1枚も 出そろわない）。
     ★ ★いま 画面に 要る 札は 待ち行列の **先頭へ 入れ替える**（大富豪 T120 の 直し）。
     ★ ★「読み込み中」の 文字は 出しません（設計図 §5.5）。
     ============================================================ */
  var WARM_PAR = 4;
  var warmImg = {}, warmQueue = [], warmRun = 0, warmDone = 0, warmErr = 0, warmGo = false;
  var ALL_NAMES = C.allNames();               /* ★ 53個。★先頭が 裏面 */
  var BACK_SRC = cardSrc(C.BACK_NAME);

  function warmNext() {
    while (warmRun < WARM_PAR && warmQueue.length) {
      (function (name) {
        var im = warmImg[name];
        if (im && im.complete && im.naturalWidth) { warmNext(); return; }
        im = new Image();
        warmImg[name] = im;
        try { im.fetchPriority = 'low'; } catch (e) {}
        warmRun++;
        im.onload = function () { warmRun--; warmDone++; handFace(name); warmNext(); };
        im.onerror = function () { warmRun--; warmErr++; warmNext(); };
        im.src = cardSrc(name);
      })(warmQueue.shift());
    }
  }
  function warmFirst(names) {
    for (var i = names.length - 1; i >= 0; i--) {
      var k = warmQueue.indexOf(names[i]);
      if (k > 0) { warmQueue.splice(k, 1); warmQueue.unshift(names[i]); }
    }
    warmNext();
  }
  function warmReady(name) {
    var im = warmImg[name];
    return !!(im && im.complete && im.naturalWidth > 0);
  }
  function warmStart() {
    warmQueue = ALL_NAMES.slice(1);            /* ★ 裏面いがいの 52個 */
    var back = new Image();
    warmImg[C.BACK_NAME] = back;
    function go() { if (warmGo) return; warmGo = true; warmNext(); }
    back.onload = function () { warmDone++; go(); };
    back.onerror = function () { warmErr++; go(); };
    back.src = BACK_SRC;
    setTimeout(go, 1200);
  }
  /* ★ 読めた その 瞬間に、盤の img へ src を 入れる（★神経衰弱 T80 と 同じ 作法）*/
  function handFace(name) {
    for (var id in cardEl) {
      if (!cardEl.hasOwnProperty(id)) continue;
      var e = cardEl[id];
      if (e.cardName !== name) continue;
      var f = e.faceImg;
      if (f && !f.getAttribute('src')) f.src = cardSrc(name);
    }
  }

  /* ============================================================
     ★ 部品
     ============================================================ */
  var titleScreen, playScreen, stageEl, cardsEl, zoneBots, zoneMe, middleEl;
  var suitPick, suitNow, suitNowMark, sayEl, happySpot, happyMid;
  var resultWrap, resultBox, resultTitle, resultSay, btnAgain;
  var botEl = [];

  var g = null, cardEl = {}, geo = null, built = false;
  var busy = true, over = false, takeLeft = 0, pressId = 0, waitSuit = -1;
  /* ★★ 山札の 場所に ずっと 置いて おく「空の わく」（T155・🔴-1）★★ 下の ensureDeckSlot を 見て ください */
  var deckSlot = null;
  var DECK_SLOT_ID = 'deckslot';
  var rules = C.defaultRules();
  var rand = C.rng((Date.now() ^ 0x5bd1) >>> 0);
  var seedFixed = 0;
  var timers = [], sayTimer = 0;

  function later(ms, fn) { var t = setTimeout(fn, ms); timers.push(t); return t; }
  function clearTimers() { for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]); timers = []; }

  /* ============================================================
     ★★ 寸法 ―― core の pickLayout を 呼ぶ（★式は 1か所だけ）★★
     ------------------------------------------------------------
     ★ 上から：ロボット3人 ／ まん中（山札・場札・ハッピー）／ 自分の 手札。
     ★★ 設計図 追記③：★**ふだんの 見え方を 最大に する。**
        ★ 自分の 手札の 枠は 7枚ぶん。★8枚を こえたら 静かに 重ねます。
        ★ ★重ねても 札は ぜんぶ 器の 中に 残ります（★触る 所は 画面の 外に 出しません）。
     ============================================================ */
  function measure() {
    var r = stageEl.getBoundingClientRect();
    var W = Math.max(60, Math.round(r.width) - 8);
    var H = Math.max(60, Math.round(r.height));
    var lay = C.pickLayout(W, H);
    var need = lay.botH + C.FIT.PAD + lay.mid + C.FIT.PAD + lay.h;
    var slack = Math.max(0, H - need);
    var padTop = Math.min(8, Math.floor(slack / 2));
    geo = {
      W: W, H: H,
      cw: lay.w, ch: lay.h, gap: lay.g, bw: lay.bw, bh: lay.bh,
      botTop: padTop, botH: lay.botH,
      midTop: padTop + lay.botH + C.FIT.PAD,
      midH: lay.mid + slack - padTop * 2,
      slack: slack, padTop: padTop, tight: !!lay.tight
    };
    geo.meTop = geo.midTop + geo.midH + C.FIT.PAD;
    geo.meH = lay.h;
    geo.colW = Math.floor(W / 3);
    /* ★★ 山札 と 場札 は まん中の 帯の **下ぞろえ** ―― ★自分の 手札の すぐ 上に 置きます ★★
       ------------------------------------------------------------
       ★ はじめは 帯の まん中に 置いて いました。★でも たての 余りは
         ★★たての ながい 画面では 500px を こえます【実測・375×812 で 520px】。
       ★ ★まん中に 置くと、★山札と 場札が 何もない ところに ぽつんと 浮きました。
       ★ ★下ぞろえに して、★空いた 上を ハッピーに わたします（設計図 §9.5：さびしい 画面に しない）。 */
    var pairW = geo.cw * 2 + geo.gap * 4;
    geo.deckX = Math.round(4 + (W - pairW) / 2);
    geo.pileX = geo.deckX + geo.cw + geo.gap * 4;
    geo.midY = Math.round(geo.midTop + geo.midH - geo.ch);
    /* ★ ハッピーの 場所（★山札の 上・まん中）*/
    geo.happyBoxTop = geo.midTop + 22;                       /* ★ 22 ＝ ひとことの 帯 */
    geo.happyBoxH = Math.max(24, geo.midY - geo.happyBoxTop - 6);
    /* ★ 大きい 画面で ハッピーだけが 育ちすぎない ように 180px で 止めます（★あとは 🎨アト）*/
    geo.happyH = Math.max(26, Math.min(geo.happyBoxH, Math.round(geo.ch * 1.7), 180));
    return geo;
  }

  function layout() {
    measure();
    var s = document.documentElement.style;
    s.setProperty('--cw', geo.cw + 'px');
    s.setProperty('--ch', geo.ch + 'px');
    s.setProperty('--bw', geo.bw + 'px');
    s.setProperty('--bh', geo.bh + 'px');
    s.setProperty('--gap', geo.gap + 'px');
    /* ★ ハッピーの 大きさ ―― ★空いた ところを 埋める ように（設計図 §9.5）。
       ★★ 寸法の 計算には 使いません ―― ★手札も 山札も 1pxも 動きません。 */
    s.setProperty('--happy', geo.happyH + 'px');
    /* ★ 結果の 箱の たけの 天井 ―― ★手札に かぶらせない（五目並べ T133 の 教訓）*/
    s.setProperty('--result-max', Math.max(60, Math.min(100, geo.midH + C.FIT.PAD * 2 - 8)) + 'px');

    zoneBots.style.top = geo.botTop + 'px';
    zoneBots.style.height = geo.botH + 'px';
    middleEl.style.top = geo.midTop + 'px';
    middleEl.style.height = geo.midH + 'px';
    zoneMe.style.top = geo.meTop + 'px';
    zoneMe.style.height = geo.meH + 'px';
    for (var i = 0; i < 3; i++) {
      botEl[i].style.left = (4 + geo.colW * i) + 'px';
      botEl[i].style.width = geo.colW + 'px';
    }
    happySpot.style.top = Math.round(geo.happyBoxTop - geo.midTop + (geo.happyBoxH - geo.happyH) / 2) + 'px';
    /* ★ 8で 決めた マークの しるし ―― ★場札の 右上に 1つ（ルル §9）
       ⚠️★ この しるしは `.middle` の 中に います。★★top は **帯の 中の 座標**で 書く こと
          ―― ★私は ここで 器ぜんたいの 座標（geo.midY）を そのまま 入れて しまい、
          ★★しるしが 帯の 下に 落ちて **1度も 見えませんでした**【T152・私の 失敗】。 */
    suitNow.style.left = (geo.pileX + geo.cw - Math.round(geo.cw * 0.42)) + 'px';
    suitNow.style.top = (geo.midY - geo.midTop - Math.round(geo.cw * 0.14)) + 'px';
    suitNow.style.width = Math.round(geo.cw * 0.56) + 'px';
    suitNow.style.height = Math.round(geo.cw * 0.56) + 'px';
    resultSpot();
    if (g) placeAll(true);
    /* ★★ T155・🔴-2 ―― ★マーク板が 出て いる 間に 画面が 変わったら、★置き直す。★1行です。 */
    if (waitSuit >= 0 && !suitPick.classList.contains('hidden')) placeSuitPick();
  }

  /* ★ 結果の 箱を「まん中の 帯」に そろえる（★手札に かぶらせない）*/
  function resultSpot() {
    var r = stageEl.getBoundingClientRect();
    var mc = r.top + geo.midTop + geo.midH / 2;
    var VH = window.innerHeight;
    resultWrap.style.paddingTop = '10px';
    resultWrap.style.paddingBottom = '10px';
    if (mc >= VH / 2) resultWrap.style.paddingTop = Math.round(2 * mc - VH) + 'px';
    else resultWrap.style.paddingBottom = Math.round(VH - 2 * mc) + 'px';
  }

  /* ============================================================
     ★★ 場所の 決め方 ★★
     ------------------------------------------------------------
     ★ where … 'me' ／ 'bot0'〜'bot2' ／ 'deck' ／ 'pile'
     ★ 手札は 帯の まん中に ならべます。
     ★★ 枠（7枚）を こえたら **重ねて つめます**（設計図 追記③）
        ★ ―― 札は 1pxも 小さく しません。★重なるだけ です。
        ★ ★いちばん 右（＝ さいごに 来た 札）は いつも まるごと 見えます。
     ============================================================ */
  function spotOf(where, i, n) {
    if (where === 'deck') return { x: geo.deckX, y: geo.midY };
    if (where === 'pile') return { x: geo.pileX, y: geo.midY };
    var cw, top, W, left;
    if (where === 'me') {
      cw = geo.cw; top = geo.meTop; W = geo.W; left = 4;
    } else {
      var k = +where.charAt(3);
      cw = geo.bw; top = geo.botTop; W = geo.colW - 6; left = 4 + geo.colW * k + 3;
    }
    var full = cw + (where === 'me' ? geo.gap : 2);
    var pitch = (n > 1) ? Math.min(full, (W - cw) / (n - 1)) : full;
    var rowW = (n - 1) * pitch + cw;
    return { x: Math.round(left + (W - rowW) / 2 + i * pitch), y: top };
  }

  /* ============================================================
     ★★★ 山札の 場所は、★札が 0枚でも 押せる ★★★（T155・🔴-1）
     ------------------------------------------------------------
     ⚠️★★ ここは T153 で トライが 見つけた **いちばん 大きい 穴** の 直しです。
        ★ 人が 引くのは ―― ★★**山札の 札を 押した とき だけ**（onUp → where==='deck' → doDraw）。
          ★ ★これは 設計図 追記④（勝手に 引かない）の 線 で、★正しい 作り です。
        ★ ところが 札を 置いて いたのは placeAll の
            for (i = 0; i < g.deck.length; i++) putAt(…, 'deck', …)
          ―― ★★**g.deck.length が 0 に なると、山札の 場所に 札が 1枚も 無く なります。**
        ★ ＝ ★★押す ものが 無い ＝ doDraw に たどりつけない ＝ ★まぜ直しにも 行けない。
          ★★ エラーは 0件。★verify も NG 0。★★**ただ 静かに 止まります**（★6試合に 1回）。
     ★ ★まぜ直しの しかけは すでに core の drawOne の 中に あります。
       ★★ 足りなかったのは「★そこへ 行く 道」だけ でした。
     ★ → ★★**山札の 場所に、札とは 別に「空の わく」を 1つ、ずっと 置いて おきます。**
       ★ ★where は 'deck'。★slotId も 付ける ので、★★onUp は 1文字も 変えずに 通ります。
       ★ ★z は 0（★札は 1以上）。★★山札に 札が ある ときは 札の 下に かくれて います。
       ★ ★★決まり（core）は 1行も 変わりません。★引くのは いまも「人が 押した とき」だけ です。
     ============================================================ */
  function ensureDeckSlot() {
    if (deckSlot && deckSlot.parentNode) return deckSlot;
    var e = document.createElement('div');
    /* ★ class に 'card' を 入れる ―― ★onDown / onUp の 「.card まで さかのぼる」に そのまま 乗る ため。
       ★ ★中身（.card-in・絵）は 入れません。★★は cardEl にも 入れません
         （★cardEl は「52枚の 札」の 台帳。★ここに 混ぜると 先読みの 数え方が 狂います）。 */
    e.className = 'card is-slot';
    e.slotId = DECK_SLOT_ID;
    e.where = 'deck';
    e.setAttribute('aria-hidden', 'true');
    cardsEl.appendChild(e);
    deckSlot = e;
    return e;
  }
  function placeDeckSlot() {
    if (!geo) return;
    var e = ensureDeckSlot();
    var p = spotOf('deck', 0, 1);
    e.style.left = p.x + 'px';
    e.style.top = p.y + 'px';
    e.style.zIndex = '0';
    e.spot = p;
    e.where = 'deck';
    /* ★ 目に 見えるのは「山札が 空に なった とき」だけ。
       ★★ ただし ―― ★★**押せるのは いつでも** です（★opacity 0 でも 指は 当たります）。
       ★ ★札が ある ときは 札が 上に 乗って いる ので、どちらでも 同じ ところに 当たります。 */
    if (g && g.deck.length === 0) e.classList.add('is-empty');
    else e.classList.remove('is-empty');
  }

  function placeAll(instant) {
    if (!g) return;
    if (instant) cardsEl.classList.add('no-move');
    var i, p;
    placeDeckSlot();
    for (p = 1; p < g.nP; p++) {
      for (i = 0; i < g.hands[p].length; i++) putAt(g.hands[p][i].id, 'bot' + (p - 1), i, g.hands[p].length, i);
    }
    for (i = 0; i < g.hands[0].length; i++) putAt(g.hands[0][i].id, 'me', i, g.hands[0].length, i);
    for (i = 0; i < g.deck.length; i++) putAt(g.deck[i].id, 'deck', 0, 1, i);
    for (i = 0; i < g.pile.length; i++) putAt(g.pile[i].id, 'pile', 0, 1, i);
    if (instant) { void cardsEl.offsetWidth; cardsEl.classList.remove('no-move'); }
    paintSuitNow();
    refreshDim();
  }
  function putAt(id, where, i, n, z) {
    var e = cardEl[id];
    if (!e) return;
    var p = spotOf(where, i, n);
    e.style.left = p.x + 'px';
    e.style.top = p.y + 'px';
    e.style.zIndex = String(z + 1);
    e.className = e.className.replace(/\s*is-bot\b/, '');
    if (where.indexOf('bot') === 0) e.className += ' is-bot';
    e.where = where;
    e.spot = p;
  }

  /* ============================================================
     ★ 札を 作る（★支給画像。★裏 と 表の 2枚を 重ねる）
     ============================================================ */
  function makeCard(slot, up) {
    var e = document.createElement('div');
    e.className = 'card' + (up ? '' : ' is-down');
    var inn = document.createElement('div');
    inn.className = 'card-in';
    var back = document.createElement('img');
    back.className = 'back'; back.alt = ''; back.decoding = 'async';
    back.src = BACK_SRC;
    var face = document.createElement('img');
    face.className = 'face'; face.alt = ''; face.decoding = 'async';
    var name = C.nameOf(slot.c);
    if (warmReady(name)) face.src = cardSrc(name);
    face.addEventListener('error', function () { fallback(e, slot.c); });
    inn.appendChild(back); inn.appendChild(face);
    e.appendChild(inn);
    e.cardName = name; e.faceImg = face; e.slotId = slot.id;
    cardsEl.appendChild(e);
    cardEl[slot.id] = e;
    return e;
  }
  /* ★ 絵が 届かなかった ときだけ（★ふだんは 一度も 通らない）*/
  function fallback(e, c) {
    if (e.querySelector('.fallback')) return;
    var d = document.createElement('div');
    d.className = 'fallback' + ((C.suitOf(c) === 1 || C.suitOf(c) === 2) ? ' red' : '');
    d.textContent = C.MARKS[C.suitOf(c)] + C.RANKS[C.rankOf(c)];
    e.firstChild.appendChild(d);
  }
  function faceUp(id, up) {
    var e = cardEl[id];
    if (!e) return;
    if (up) {
      var f = e.faceImg;
      if (!f.getAttribute('src')) {
        try { f.fetchPriority = 'high'; } catch (er) {}
        f.src = cardSrc(e.cardName);
      }
      e.classList.remove('is-down');
    } else e.classList.add('is-down');
  }
  function dropCards() {
    clearTimers();
    for (var id in cardEl) if (cardEl.hasOwnProperty(id)) {
      if (cardEl[id].parentNode) cardEl[id].parentNode.removeChild(cardEl[id]);
    }
    cardEl = {};
  }

  /* ============================================================
     ★★★ 出せない 札を 暗くする（★この 画面で ただ 1つの 強調）★★★
     ------------------------------------------------------------
     ★ ルル §8-a の 判定：
       ★ ソリティアで 奪われたのは「★どこに 置けるかを **さがす**」―― ★盤 じゅうを 見わたす 仕事。
       ★ ページワンで 見るのは「★場札 1枚 と 自分の 札 1枚」―― ★**見くらべる** だけ。
       ★★ そして 遊びの 中身は そこには ありません。★遊びは「★出せる 2枚の うち、8を 使うか」。
     ★ だから ―― ★**教えて よい。★ただし「暗くする」形で。**
       ★ 光らせると 設計図 §5.5「強調は 1種類まで」に すぐ ぶつかります。★暗くするのは 引き算 です。

     ★★ 暗く するのは 3つ とも 当てはまる ときだけ ★★
        ① ★自分の 番（★ロボットの 番には 1枚も 暗く しない）
        ② ★自分の 手札（★ロボットの 手札・山札・場札には 付けない）
        ③ ★その 札が 出せない
     ★ ★verify ⑤ が、この 関数を **本物で 通して** 見張ります。
     ============================================================ */
  function refreshDim() {
    var all = cardsEl.querySelectorAll('.card.is-dim'), i;
    for (i = 0; i < all.length; i++) all[i].classList.remove('is-dim');
    if (!g || g.over || busy || g.cur !== 0) return;
    if (takeLeft > 0) return;                     /* ★ 引かされて いる 間は 出す 札が ない */
    var ok = {}, l = C.legalIdx(g, 0);
    for (i = 0; i < l.length; i++) ok[l[i]] = 1;
    for (i = 0; i < g.hands[0].length; i++) {
      if (ok[i]) continue;
      var e = cardEl[g.hands[0][i].id];
      if (e) e.classList.add('is-dim');
    }
  }

  /* ★ 8で 決めた マークの しるし ―― ★場札が 8の ときだけ 出す（ルル §9）*/
  function paintSuitNow() {
    if (!g) return;
    if (C.topIsEight(g)) {
      suitNowMark.textContent = C.MARKS[g.suit];
      suitNow.className = 'suit-now m' + g.suit;
    } else {
      suitNow.className = 'suit-now hidden';
    }
  }

  /* ★ ハッピーの ひとこと（★出しっぱなしに しない）*/
  function say(text, hold) {
    if (sayTimer) { clearTimeout(sayTimer); sayTimer = 0; }
    if (!text) { sayEl.classList.add('hidden'); sayEl.textContent = ''; return; }
    sayEl.textContent = text;
    sayEl.classList.remove('hidden');
    if (hold !== 0) sayTimer = setTimeout(function () { sayEl.classList.add('hidden'); }, hold || T.SAY_HOLD);
  }

  /* ============================================================
     ★ 新しい 試合
     ============================================================ */
  function newGame() {
    clearTimers();
    dropCards();
    over = false; busy = true; takeLeft = 0; waitSuit = -1;
    suitPick.classList.add('hidden');
    resultWrap.classList.add('hidden');
    var r = seedFixed ? C.rng(seedFixed) : rand;
    g = C.makeGame(r, { rules: rules, players: 4, hand: 7 });

    /* ★ いま 要る 札を 先読みの 先頭へ（★自分の 手札 ＋ 場札の 1枚目）*/
    var need = [], i, p;
    for (i = 0; i < g.hands[0].length; i++) need.push(C.nameOf(g.hands[0][i].c));
    need.push(C.nameOf(C.topOf(g).c));
    warmFirst(need);

    for (p = 1; p < g.nP; p++) for (i = 0; i < g.hands[p].length; i++) makeCard(g.hands[p][i], false);
    for (i = 0; i < g.hands[0].length; i++) makeCard(g.hands[0][i], true);
    for (i = 0; i < g.deck.length; i++) makeCard(g.deck[i], false);
    for (i = 0; i < g.pile.length; i++) makeCard(g.pile[i], true);
    placeAll(true);
    say(SAY.start);
    busy = false;
    turnStart();
  }

  /* ============================================================
     ★★ 手番の はじまり ★★
     ------------------------------------------------------------
     ★ 人（席0）の ときは ―― ★★何も しません。★指を 待つ だけ。
       ★ 設計図 追記④：★**勝手に 引かない。**★山札を 押されて はじめて 引きます。
     ★ ロボットの ときは、少し 待ってから 1手 動きます。
     ============================================================ */
  function turnStart() {
    if (!g || g.over) { finish(); return; }
    if (g.cur === 0) {
      busy = false;
      /* ★ 2が かさなって いて 返せない ―― ★引かされる 枚数を 覚えて おく */
      if (g.pending > 0 && !C.canPlay(g, 0)) {
        takeLeft = g.pending; g.pending = 0;
        say(SAY.take, 0);
      } else if (!C.canPlay(g, 0)) {
        takeLeft = 0;
        say(SAY.draw, 0);
      } else {
        takeLeft = 0;
        say('');
      }
      refreshDim();
    } else {
      busy = true;
      refreshDim();
      later(T.BOT_THINK, botStep);
    }
  }

  /* ★★ ロボットの 1手 ★★ */
  function botStep() {
    if (!g || g.over) { finish(); return; }
    var seat = g.cur;
    if (seat === 0) { turnStart(); return; }

    /* ★ 2が かさなって いて 返せない ―― まとめて 引いて 番は 終わり */
    if (g.pending > 0 && !C.canPlay(g, seat)) {
      var n = g.pending;
      C.takePending(g, seat);
      rebuild();
      if (g.over) { finish(); return; }
      later(T.BOT_DRAW, function () { afterTurn(0, false); });
      return;
    }
    /* ★ 出せる 札が 来るまで 1枚ずつ 引く（社長裁定・ルル (c)）*/
    if (!C.canPlay(g, seat)) {
      var d = C.drawOne(g, seat);
      rebuild();
      if (!d.ok || g.over) { finish(); return; }
      later(T.BOT_DRAW, botStep);
      return;
    }
    /* ★ 出す ―― ★ロボットは 自分で マークを 決めます（★人は 画面が 聞きます）*/
    var ch = C.botChoose(g, seat, 3);
    var r = C.playCard(g, seat, ch.idx, ch.suit);
    if (!r.ok) { finish(); return; }
    faceUp(r.id, true);
    placeAll(false);
    var wait = T.PLAY_MOVE + (r.effect === 'eight' ? T.BOT_SUIT : 0);
    if (r.effect && r.effect !== 'eight') wait += T.SKIP_SHOW;
    shout(seat);
    later(wait, function () {
      if (r.over) { finish(); return; }
      afterTurn(r.skip, r.extra);
    });
  }

  /* ★ 「ページワン！」―― ★残り1枚に なった 瞬間（ルル §5-4）
     ★ ボタンも 罰も ありません。★★この 1本の 名前の 瞬間 です。 */
  function shout(seat) {
    if (!g || g.over) return;
    if (g.hands[seat].length !== 1) return;
    say(seat === 0 ? SAY.oneMe : (botName(seat) + ' が ' + SAY.one), 1800);
    happyMid.classList.remove('is-jump');
    void happyMid.offsetWidth;
    happyMid.classList.add('is-jump');
  }
  function botName(seat) { return 'ロボット' + seat; }

  function afterTurn(skip, extra) {
    if (!g || g.over) { finish(); return; }
    C.nextTurn(g, skip, extra);
    turnStart();
  }

  /* ★ 手札の 数が 変わったら DOM を 作り直す（★引いた 札の 分だけ 足す）*/
  function rebuild() {
    var p, i;
    for (p = 0; p < g.nP; p++) {
      for (i = 0; i < g.hands[p].length; i++) {
        var s = g.hands[p][i];
        if (!cardEl[s.id]) makeCard(s, p === 0);
        else if (p === 0) faceUp(s.id, true);
      }
    }
    for (i = 0; i < g.deck.length; i++) if (!cardEl[g.deck[i].id]) makeCard(g.deck[i], false);
    for (i = 0; i < g.pile.length; i++) if (!cardEl[g.pile[i].id]) makeCard(g.pile[i], true);
    /* ★ まぜ直しで 場札 → 山札 に もどった 札は 裏に する */
    for (i = 0; i < g.deck.length; i++) faceUp(g.deck[i].id, false);
    for (i = 0; i < g.pile.length; i++) faceUp(g.pile[i].id, true);
    placeAll(false);
  }

  /* ============================================================
     ★★★ 人の 操作 ★★★
     ------------------------------------------------------------
     ★ 追記④：★**探すのは 人、たしかめるのが 機械。**
       ・★どの 札を 出すか … ★人が 決める（★1回 押すだけ。★行き先は 場札 1か所しか ない）
       ・★8の あと どの マークに するか … ★★人が 決める（★自動化 しない）
       ・★引く … ★★山札を 押した ときだけ（★勝手に 引かない）
       ・★出せるか どうかの 判定・数える・まぜ直す … ★機械が やる（★肩代わりして よい 側）
     ★ 指を 置いた だけでは 決まりません。★**はなした ときに** 決まります。

     ⚠️★★★ T157・🟡 の 直し ―― ★**はなした 所は、e.target では 分かりません** ★★★
        ★ 指（touch）の ポインタは、★★**押した ものに くっつきます**
          （★ブラウザの 決まり・implicit pointer capture）。
        ★ ★＝ となりの 札の 上で はなしても、★pointerup の **e.target は 押した 札の まま**。
          ★★ だから 下の「押した 札と はなした 札が ちがう」が **指では 1度も 効きません** でした。
        ★ ★マウスは くっつかない ので、★PCでは ちゃんと 止まって いました
          ―― ★★**指と マウスで 手ざわりが ちがう**、これが 正体です。
        ★ ★実測（T157・375×812・本物の 指と 本物の マウス・10回ずつ）：
          ★★ 指で すべらせて はなす … ★**10/10 で 何かが 起き、★7/10 で 札が 本当に 出た**
          ★★ マウスで 同じ こと    … ★**0/10**（★1度も 起きない）
        ★ → ★★**はなした 点の 座標から 引き直します**（`hitAt`）。★これで 指も マウスも 同じ 動きに。
        ★ ★`hitAt` は ⑯（見張り）と ⑭ も 同じ ものを 使います ―― ★★目を 1つに して おきます。

     ⚠️★★ **なぜ「はなした 所の 札が 出る」に しなかったか**（★もう 1つの 道でした）
        ★ ★ババ抜き・五目並べ・四目ならべは「はなした 所」で 決めて います。★★でも あの 3本は
          ★★ **すべって いる 間、どれが 選ばれて いるかが 画面に 見えて います**
          （★ババ抜きの 浮き・★五目の 輪・★四目の 飛ぶ コマ）。
        ★ ★ページワンには その 見え方が ありません。★見えない まま、はなした 所の 札が 出るのは
          ★★ **「気づいて いない 予期せぬ 行動」** ―― ★★設計図 追記② そのもの です。
        ★ ★★だから ページワンは「★すべったら 何も 起きない」。★ババ抜きの
          ★「引く札は、指をはなすまで決まりません。」とは 食いちがいません ――
          ★★ **どちらも「決まるのは はなした とき」。★ちがうのは、選び直せる かどうか だけ** です。
     ============================================================ */
  /* ★ 押した／はなした 点 → ★本当に そこに ある もの → ★.card まで さかのぼる
     ★★ onUp（本体）と ⑭⑯（見張り）が 使う、★この ゲームで ただ 1つの「目」。
     ★ 画面の 外を さされたら null（★はなす 場所が 盤の 外 ＝ 何も 起きない）。 */
  function hitAt(x, y) {
    if (!(x >= 0) || !(y >= 0) || x > window.innerWidth || y > window.innerHeight) return null;
    var t = document.elementFromPoint(Math.round(x), Math.round(y));
    while (t && t !== cardsEl && !(t.classList && t.classList.contains('card'))) t = t.parentNode;
    return (t && t !== cardsEl && t.classList && t.classList.contains('card')) ? t : null;
  }
  function onDown(e) {
    if (busy || over || !g || g.over) return;
    var t = e.target;
    while (t && t !== cardsEl && !t.classList.contains('card')) t = t.parentNode;
    if (!t || t === cardsEl) { pressId = 0; return; }
    pressId = t.slotId || 0;
  }
  /* ============================================================
     ★★★ T160 ―― ★すべって 出なかった とき、★「ぷるっ」と 返事を する ★★★
     ------------------------------------------------------------
     ⚠️★ トライが T159 §4-5 で 見つけた もの：
        ★ ★T157 の 直しで「★すべったら 何も 起きない」に なりました（★これは 正しい）。
        ★ ★★でも ―― ★★**画面が 1文字も・1回も 返事を しません**【実測・意地悪④で `.card.is-no` 0個】。
        ★ ＝ ★遊ぶ人からは「★★壊れた」と「★わざと 出さなかった」の 見分けが つきません。
     ★ ★★社長の 決め：★★**ぷるっと 返す。**★（★どう 返すかは 私が 決めました → 下）
     ------------------------------------------------------------
     ★★ 私の 決め ①：★★**「出せない 札」と 同じ「ぷるっ」を 使い回します**（★新しい 見た目は 0）
        ★ ★理由1：★設計図 §5.5「★1画面に 強調は 1種類まで」。★いま 走って いるのは
          ★★「出せない 札を 暗くする」（is-dim）1つ だけ ―― ★★**ここに 2つ目を 増やせません。**
          ★ ★`is-no`（ぷるっ）は **もとから ある 動き** で、★強調（ずっと 出て いる 印）では
          ★ ありません ―― ★0.16秒の 返事 です。★★増えるのは 0種類 です。
        ★ ★理由2：★追記②（気づくを 奪わない）に 照らすと、★これは
          ★★「遊びの 情報」では なく「★★操作の 返事」。★★返して よい 側 です。
     ★★ 私の 決め ②：★★**「出せない 札を 押した」と「すべって 外した」は 同じ 返し方に します。**
        ★ ★分けた 方が いい と 思える 理由も 考えました（★「この 札は 出せない」と
          ★ ★「押し方が 外れた」は ちがう 話だから）。★★でも 分けませんでした：
          ★ ★(1) 分けると **2つ目の 動き**を 作る ことに なります（→ §5.5 に ぶつかる）
          ★ ★(2) ★★**もう 分かれて 見えて います** ―― ★出せない 札は `is-dim` で **暗い**。
              ★★暗い 札が ゆれた ＝「この 札は 出せない」／★★明るい 札が ゆれた ＝「押し方が 外れた」。
              ★★**印を 足さずに、★すでに 見分けが ついて います。**
          ★ ★(3) どちらも 遊ぶ人が 次に する ことは 同じ（★もう 一度 押す）。★1回 押せば 通ります。
     ★★ 私が やらなかった こと（★濁さず 書きます・追記⑤）：
        ★ ★**押した 札を 浮かせる（トライの 3案）は しません。**★★それは「★すべって いる 間に
          ★ 選び直せる」形に 近づき、★T157 §2 で 追記② を 理由に 外した 道 です。
        ★ ★**「出せる ときに 山札を 押した」（doDraw の 空ぶり）には 手を 入れて いません。**
          ★ ★★ここは 今回の 決めの 外 です（→ 作業メモ §5 に 数字を 出して あります）。
     ============================================================ */
  /* ★ slotId から、いま 画面に ある その 札（★山札の 空わくも 含む）を 引く */
  function elOfSlot(id) {
    if (!id) return null;
    if (id === DECK_SLOT_ID) return (deckSlot && deckSlot.parentNode) ? deckSlot : null;
    var e = cardEl[id];
    return (e && e.parentNode) ? e : null;
  }
  function onUp(e) {
    var id = pressId; pressId = 0;
    if (!id || busy || over || !g || g.over) return;
    if (waitSuit >= 0) return;                    /* ★ マークを 選んで いる 途中 */
    var t = hitAt(e.clientX, e.clientY);          /* ★★ e.target では ありません（★上の ⚠️）*/
    if (!t || t.slotId !== id) {                  /* ★ 押した 札と はなした 札が ちがう */
      var slipped = elOfSlot(id);                 /* ★★ T160：★押した 札に「ぷるっ」と 返事 */
      if (slipped) nope(slipped);
      return;
    }
    var where = t.where;
    /* ★★ T161：★山札を まっすぐ 押した のに 引けなかった とき ―― ★「ぷるっ」と 返します
       ★ ★doDraw は「引けたか」を 返します（★false ＝ 何も 起きなかった）。→ 下の ⚠️ T161 */
    if (where === 'deck') { if (!doDraw()) nope(t); return; }
    if (where !== 'me') { nope(t); return; }
    if (g.cur !== 0) { nope(t); return; }
    if (takeLeft > 0) { nope(t); return; }
    var idx = handIndexOf(id);
    if (idx < 0) return;
    var l = C.legalIdx(g, 0);
    if (l.indexOf(idx) < 0) { nope(t); return; }
    playHuman(idx);
  }
  function onCancel() { pressId = 0; }
  function nope(t) {
    t.classList.remove('is-no'); void t.offsetWidth; t.classList.add('is-no');
  }
  function handIndexOf(id) {
    for (var i = 0; i < g.hands[0].length; i++) if (g.hands[0][i].id === id) return i;
    return -1;
  }

  /* ============================================================
     ★★★ ⚠️ T161 ―― ★山札を まっすぐ 押した ときの 返事 ★★★
     ------------------------------------------------------------
     ★ ★T160 で 私が 数えて、★社長に 上げた 1件です【実測・T160 §5-1】：
       ★ ★★「出せる とき に 山札を まっすぐ 押す」と ―― ★★**画面が 1文字も 返しません**
         （★T161 で 3サイズ 60回 押し直しても ★★**返事 0回**。★引けては いません ＝ 正しい）。
     ★ ★★社長の 決め：★★**返す。**★（★どう 返すかは 私が 決めました → 下）
     ------------------------------------------------------------
     ★★ 私の 決め ―― ★★**手札と まったく 同じ「ぷるっ」を 使い回します**（★新しい CSS 0行・新しい 印 0種類）
       ★ ★T160 §2-2 と 同じ 考え方 です。★`is-no` は 0.16秒の 返事 で、
         ★★**強調（ずっと 出て いる 印）では ありません** ―― ★★§5.5「強調は 1種類まで」を こえません。
     ------------------------------------------------------------
     ★★★ ここが この 直しの ぜんぶ ―― ★★**線を こえて いないか** ★★★
       ★ ★社長の 線：★★「★出せる 札が あるよ と 教えたら、★★それは 遊びの 情報。★こえるな」
       ★ ★★山札が ゆれるのは ―― ★★**自分の 番・引かされて いない・出せる 札が ある** とき だけ です
         （★doDraw の 2つの return が それ）。★★＝ ★理屈の 上では
         ★★「出せる 札が ある」と 言って いる ことに なります。
       ★ ★★**それでも こえて いません。★理由は 1つ だけ：**
         ★★ **その ことは、★押す 前から すでに 画面に 出て いる** から です。
         ★ ★`refreshDim` は 自分の 番の あいだ ずっと ―― ★★出せない 札を 暗くして います。
           ★★ ＝ ★★**明るい 札が 1枚でも あれば「出せる 札が ある」** ―― ★★指を 触れる 前に 見えて います。
         ★ ★★山札の ぷるっが 新しく 言う ことは ★★**1つも ありません。**
           ★ ★言って いるのは ★★「★いま の 押しは 届いた。★でも 何も 起きなかった」―― ★★操作の 返事 です。
       ★ ★★**言わない ことも 決めました**（★ここを こえたら 追記② 違反 です）：
         ★ ★★どの 札を 出せば いいかは 言いません（★山札は 手札を 1枚も 指しません）
         ★ ★★ひとことも 出しません（★`say()` を 呼びません ―― ★★文字で 教えたら それは 説明の 追加）
         ★ ★★手札の 明るさを 1枚も 変えません（★→ ⑲ が 毎回 数えます）
     ------------------------------------------------------------
     ★★ 私が **やらなかった** こと（★濁さず 書きます・追記⑤ → 作業メモ §5）：
       ★ ★★ロボットの 番・動いて いる 間（`busy`）は 返しません。★onDown が そもそも 受けません。
         ★ ＝ ★★**盤ぜんたいが 眠って いる** ので、★1枚だけ ゆらすと 逆に おかしく なります。
       ★ ★★マーク板を 出して いる 間（`waitSuit`）も 返しません。★同じ 理由（★busy）です。
     ============================================================ */
  /* ★★ 山札を 押した ―― 1枚 引く（★人が 押した ときだけ 通ります）★★
     ★★ 返り値：★引けた（＝ 何かが 起きた）なら true ／ ★何も 起きなかったら false */
  function doDraw() {
    if (busy || over || !g || g.over || g.cur !== 0) return false;
    if (takeLeft === 0 && C.canPlay(g, 0)) return false;   /* ★ 出せる ときは 引けません */
    var d = C.drawOne(g, 0);
    rebuild();
    if (!d.ok) { finish(); return true; }
    if (takeLeft > 0) {
      takeLeft--;
      if (takeLeft === 0) { say(''); busy = true; later(T.DRAW_MOVE, function () { afterTurn(0, false); }); }
      return true;
    }
    if (C.canPlay(g, 0)) { say(''); refreshDim(); }
    return true;
  }

  /* ★★★ 人が 1枚 出す ★★★
     ★ 8だった ときは ―― ★★ここで 止めて、★マークを 4つから 選んで もらいます。
       ★★ この 関数には「よさそうな マーク」を 決める 行が **1行も ありません**。
          ★ ＝ 設計図 追記②（気づく ことを 先に 奪わない）の 線です。 */
  function playHuman(idx) {
    var s = g.hands[0][idx];
    if (g.rules.eight && C.rankOf(s.c) === C.R_EIGHT) {
      waitSuit = idx;
      busy = true;
      refreshDim();
      /* ★ ひとことは 出しません ―― ★この 板の 見出しが その ひとこと そのもの だから。
         ★ 2か所に 同じ ことを 書くのは 設計図 §5.5「説明は 足すより 減らす」に かかります。 */
      say('');
      suitPick.classList.remove('hidden');
      placeSuitPick();
      return;
    }
    finishPlay(idx, -1);
  }
  /* ★ マーク選びの 板は「山札の すぐ 上」に 出す ―― ★ハッピーの かおを かくさない
     ⚠️★★ T155・🔴-2：★ここは **画面を まわしたら 呼び直さないと いけません**。
        ★ 前は 出した ときの 1回しか 呼んで いなかった ので、★たてで 8を 出して → よこに すると
        ★★ ♠ボタンが y=598 の まま ―― ★★**よこの 画面（たて 375px）の 223px 下**に 出て いました。
        ★ ★マークを 選ぶまで 手札も 山札も 効かない ので（onUp が waitSuit で 止まる）、
          ★★ **何も できなく なります**（★トライの 実測：よこの まま 18回 押して 手札 7→7枚）。
        ★ → ★★layout() の おわりで 呼び直します。★★直しは この 1行だけ です。
     ⚠️★★ 私の 回り道：★はじめ ここに「下ばしが 器から 出ない ように しばる」1行も 足しました。
        ★ 280×200 〜 1600×1100 を **18,758通り** 計算した ところ ―― ★★**1通りも 効きません**でした。
        ★★ ＝ ★1度も 通らない 行 ＝ ★★**わざと 壊しても 鳴らない 行**。★外しました。
        ★ ★画面の 外に 出て いないかは、★verify ⑮ が **毎回 本物で 測って** います。 */
  function placeSuitPick() {
    if (!geo) return;
    var h = suitPick.getBoundingClientRect().height || 110;
    suitPick.style.top = Math.round(Math.max(geo.midTop + 2, geo.midY - 8 - h)) + 'px';
  }

  /* ★ 人が マークの ボタンを 押した（★0〜3 が そのまま core へ 行きます）*/
  function onSuitPick(suit) {
    if (waitSuit < 0) return;
    var idx = waitSuit;
    waitSuit = -1;
    suitPick.classList.add('hidden');
    say('');
    busy = false;
    finishPlay(idx, suit);
  }
  function finishPlay(idx, suit) {
    var r = C.playCard(g, 0, idx, suit);
    if (!r.ok) { refreshDim(); return; }
    busy = true;
    faceUp(r.id, true);
    placeAll(false);
    shout(0);
    var wait = T.PLAY_MOVE + ((r.effect && r.effect !== 'eight') ? T.SKIP_SHOW : 0);
    later(wait, function () {
      if (r.over) { finish(); return; }
      afterTurn(r.skip, r.extra);
    });
  }

  /* ============================================================
     ★ 結果
     ============================================================ */
  function finish() {
    if (over) return;
    if (!g || !g.over) return;
    over = true; busy = true;
    say('');
    suitPick.classList.add('hidden');
    refreshDim();
    var win = (g.winner === 0);
    later(T.RESULT_WAIT, function () {
      resultTitle.textContent = win ? '勝ち！' : (g.winner < 0 ? 'おわり' : '負け…');
      resultTitle.className = 'result-title' + (win ? '' : ' is-quiet');
      resultSay.textContent = g.byShort ? SAY_SHORT : (win ? SAY_WIN : SAY_LOSE);
      resultWrap.classList.remove('hidden');
      resultBox.classList.add('is-locked');
      if (win) { happyMid.classList.remove('is-jump'); void happyMid.offsetWidth; happyMid.classList.add('is-jump'); }
      later(T.RESULT_LOCK, function () { resultBox.classList.remove('is-locked'); });
    });
  }

  /* ============================================================
     ★★ 特別な 札の ○✕（★2本目の 例外・社長裁定 2026-08-28）★★
     ------------------------------------------------------------
     ★ 1つずつの ○✕ **だけ**。★まとめ選び（かんたん／ふつう／ぜんぶ）は 作りません。
     ★ 初期値は「8だけ ON」。★これが いちばん 深くて いちばん 短い 形（設計図 §5.5）。
     ============================================================ */
  function renderRules() {
    var html = '', i;
    for (i = 0; i < C.RULES.length; i++) {
      var r = C.RULES[i];
      html += '<label class="rule-row">' +
              '<input type="checkbox" data-rule="' + r.id + '"' + (rules[r.id] ? ' checked' : '') + '>' +
              '<span class="rule-name">' + r.name + '</span>' +
              '<span class="rule-desc">' + r.desc + '</span></label>';
    }
    $('ruleList').innerHTML = html;
    $('ruleCount').textContent = '（今 ' + C.ruleCount(rules) + ' / ' + C.RULES.length + '個）';
    renderHelpRules();
  }
  /* ★ あそびかたには ★**ON の 決まりだけ** を 出します（★OFF の 説明は 1文字も 出さない・大富豪 T140 と 同じ）*/
  function renderHelpRules() {
    var a = [], i;
    for (i = 0; i < C.RULES.length; i++) if (rules[C.RULES[i].id]) a.push('<b>' + C.RULES[i].name + '</b>… ' + C.RULES[i].desc);
    $('helpRules').innerHTML = a.length ? a.join('<br>') : '特別な 札は 入って いません。';
  }

  /* ============================================================
     ★ 立ち上げ
     ============================================================ */
  function build() {
    if (built) return;
    built = true;
    cardsEl.addEventListener('pointerdown', onDown);
    cardsEl.addEventListener('pointerup', onUp);
    cardsEl.addEventListener('pointercancel', onCancel);
    cardsEl.addEventListener('lostpointercapture', onCancel);
    stageEl.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    stageEl.addEventListener('dragstart', function (e) { e.preventDefault(); });
    var b = suitPick.querySelectorAll('.suit-btn');
    for (var i = 0; i < b.length; i++) {
      b[i].addEventListener('click', function (e) {
        onSuitPick(+e.currentTarget.getAttribute('data-suit'));
      });
    }
  }

  function start() {
    titleScreen.classList.add('hidden');
    playScreen.classList.remove('hidden');
    build();
    layout();
    newGame();
  }
  function backToTitle() {
    resultWrap.classList.add('hidden');
    playScreen.classList.add('hidden');
    titleScreen.classList.remove('hidden');
    clearTimers(); dropCards(); g = null; over = false; busy = true;
    renderRules();
  }

  function boot() {
    titleScreen = $('titleScreen'); playScreen = $('playScreen');
    stageEl = $('stage'); cardsEl = $('cards');
    zoneBots = $('zoneBots'); zoneMe = $('zoneMe'); middleEl = $('middle');
    suitPick = $('suitPick'); suitNow = $('suitNow'); suitNowMark = $('suitNowMark');
    sayEl = $('say'); happySpot = $('happySpot'); happyMid = $('happyMid');
    resultWrap = $('resultWrap'); resultBox = $('resultBox');
    resultTitle = $('resultTitle'); resultSay = $('resultSay'); btnAgain = $('btnAgain');
    botEl = [$('bot1'), $('bot2'), $('bot3')];

    /* ★ 板の 見出しは SAY.eight が もと（★同じ 言葉を 2か所に 書かない）*/
    suitPick.querySelector('.suit-pick-lead').textContent = SAY.eight;

    renderRules();
    $('ruleList').addEventListener('change', function (e) {
      var id = e.target.getAttribute && e.target.getAttribute('data-rule');
      if (!id) return;
      rules[id] = !!e.target.checked;
      $('ruleCount').textContent = '（今 ' + C.ruleCount(rules) + ' / ' + C.RULES.length + '個）';
      renderHelpRules();
    });

    $('btnStart').addEventListener('click', start);
    btnAgain.addEventListener('click', function () { resultWrap.classList.add('hidden'); newGame(); });
    $('btnBackTitle').addEventListener('click', backToTitle);
    $('btnHowto').addEventListener('click', function () { $('helpDialog').showModal(); });
    var cl = document.querySelectorAll('[data-close]');
    for (var i = 0; i < cl.length; i++) {
      cl[i].addEventListener('click', function (e) { $(e.currentTarget.getAttribute('data-close')).close(); });
    }
    window.addEventListener('resize', function () { if (geo) layout(); });
    window.addEventListener('orientationchange', function () { if (geo) layout(); });
    warmStart();
    stageEl.style.visibility = 'hidden';
    build(); measure();
    stageEl.style.visibility = '';
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* ============================================================
     ★★ たしかめの 窓口（既存16本と 同じ 作法。★画面には 1つも 出ない）★★
     ============================================================ */

  /* ★ 測る ときは 動きを 止める（★会社で 4回 かかった わな。★アトの 申し送り）*/
  function still(fn) {
    document.body.classList.add('measuring');
    void document.body.offsetWidth;
    var r;
    try { r = fn(); } finally { document.body.classList.remove('measuring'); }
    return r;
  }

  function ruleText(R) {
    R = R || rules;
    var a = [];
    for (var i = 0; i < C.RULES.length; i++) if (R[C.RULES[i].id]) a.push(C.RULES[i].name);
    return a.length ? a.join('／') : '（なし）';
  }

  function now() {
    return {
      '★入れて いる 特別な 札': ruleText(),
      '★自分の 手札': g ? handText(g.hands[0]) : '―',
      '★出せる 札': g ? okText() : '―',
      '★場札': g ? (C.nameOf(C.topOf(g).c) + (C.topIsEight(g) ? '（→ ' + C.MARKS[g.suit] + '）' : '')) : '―',
      '★山札': g ? (g.deck.length + '枚') : '―',
      '★ロボットの 手札': g ? (g.hands[1].length + ' / ' + g.hands[2].length + ' / ' + g.hands[3].length + '枚') : '―',
      '★手番': g ? (g.over ? '終わり' : (g.cur === 0 ? 'あなた' : botName(g.cur))) : '―',
      '★引かされ のこり': takeLeft,
      '★マークを 待って いる': waitSuit >= 0 ? ('手札の ' + waitSuit + '番目') : 'いいえ',
      '★まぜ直した 回数': g ? g.mixes : 0,
      '★暗い 札': cardsEl ? cardsEl.querySelectorAll('.card.is-dim').length + '枚' : '―',
      '★札': geo ? (geo.cw + '×' + geo.ch + 'px ／ ロボット ' + geo.bw + '×' + geo.bh + 'px') : '―',
      '★読めた 絵': warmDone + ' / ' + ALL_NAMES.length + (warmErr ? ('（読めず ' + warmErr + '）') : '')
    };
  }
  function handText(hand) {
    var a = [];
    for (var i = 0; i < hand.length; i++) a.push(C.nameOf(hand[i].c));
    return a.join(' ');
  }
  function okText() {
    var l = C.legalIdx(g, 0), a = [];
    for (var i = 0; i < l.length; i++) a.push(C.nameOf(g.hands[0][l[i]].c));
    return a.length ? a.join(' ') : '（なし ―― 山札を おして 引く）';
  }

  /* ★ 種を 固定する（★同じ 試合を 何度でも）*/
  function seed(n) {
    seedFixed = (n >>> 0) || 0;
    return { '★種': seedFixed || '（毎回 ちがう）', '★次の「もう1回」から 効きます': true };
  }

  function geoInfo() {
    return still(function () {
      var r = stageEl.getBoundingClientRect();
      return {
        '画面': window.innerWidth + '×' + window.innerHeight,
        '器の中身': geo.W + '×' + geo.H,
        '★自分の 札': geo.cw + '×' + geo.ch + 'px',
        '★ロボットの 札': geo.bw + '×' + geo.bh + 'px',
        '★44pxに 対して': (geo.cw / 44 * 100).toFixed(0) + '%',
        '★手札の 枠': C.FIT.HAND_BASE + '枚（★これを こえたら 静かに 重ねる）',
        'ロボットの 帯': geo.botH + 'px（上 ' + geo.botTop + 'px）',
        'まん中の 帯': geo.midH + 'px（上 ' + geo.midTop + 'px）',
        '自分の 帯': geo.meH + 'px（上 ' + geo.meTop + 'px）',
        '上下の 余り': geo.slack + 'px',
        '★結果の 箱の 天井': getComputedStyle(document.documentElement).getPropertyValue('--result-max').trim(),
        'ページ縦スクロール': document.documentElement.scrollHeight > window.innerHeight,
        'ページ横スクロール': document.documentElement.scrollWidth > window.innerWidth,
        'stage': Math.round(r.width) + '×' + Math.round(r.height)
      };
    });
  }

  /* ★ 試合を まわす（★遊ぶ 側と 同じ core を 通ります）*/
  function autoPlay(n, opt) {
    n = n || 20000; opt = opt || {};
    var t0 = Date.now();
    var R = opt.rules || rules;
    var st = C.runMany(n, opt.seed || 4649, { rules: R, levels: opt.levels || [3, 3, 3, 3],
                                              players: 4, hand: 7 });
    var out = {
      '試合数': st.games,
      '★入れて いる 特別な 札': ruleText(R),
      '★★終わらない 試合': st.nofin + '件',
      '★★まぜ直しで 詰まった': st.stuck + '件',
      '★反則の 手': st.illegal + '件',
      '★札の 数が 52枚で ない 試合': st.cardsBad + '件',
      '★人が 勝つ': (st.win / st.games * 100).toFixed(1) + '%（★五分 25.0%）',
      '手番 まん中': C.pct(st.plies, 0.5),
      '手番 9割': C.pct(st.plies, 0.9),
      '★手札の 最大': st.anyMax + '枚（★自分 9割 ' + C.pct(st.myMaxes, 0.9) + '枚）',
      '★2枚以上 選べる 手番': (st.opt2 / st.games * 100).toFixed(1) + '%',
      '★まぜ直しが 起きた 試合': (st.mixGames / st.games * 100).toFixed(2) + '%',
      '★★山切れで 終わった 試合': (st.mixCap / st.games * 100).toFixed(2) + '%',
      'かかった 時間': (Date.now() - t0) + 'ms'
    };
    console.log('[ページワン] autoPlay', out);
    return out;
  }

  /* ★ 気づく人 と 気づかない人（★ルル §1-1 の 表）*/
  function rates(n) {
    n = n || 20000;
    var out = {}, sets = [
      ['素の 決まり（ぜんぶ OFF）', { eight: 0, jack: 0, two: 0, queen: 0, ace: 0 }, '+0.9'],
      ['★8だけ（初期値）', { eight: 1, jack: 0, two: 0, queen: 0, ace: 0 }, '★+6.8'],
      ['8 ＋ J', { eight: 1, jack: 1, two: 0, queen: 0, ace: 0 }, '+6.1'],
      ['★ぜんぶ ON', { eight: 1, jack: 1, two: 1, queen: 1, ace: 1 }, '+4.3']
    ];
    sets.forEach(function (a) {
      var lo = C.runMany(n, 5150001, { rules: a[1], levels: [1, 3, 3, 3] });
      var hi = C.runMany(n, 5150001, { rules: a[1], levels: [3, 3, 3, 3] });
      out[a[0]] = '気づかない ' + (lo.win / n * 100).toFixed(1) + '% → 気づく ' +
                  (hi.win / n * 100).toFixed(1) + '%　＝ ★+' +
                  ((hi.win - lo.win) / n * 100).toFixed(1) + '（ルル ' + a[2] + '）';
    });
    console.log('[ページワン] rates（★各 ' + n + '試合）', out);
    return out;
  }

  /* ============================================================
     ★ はみ出し・画面外を 測る
     ============================================================ */
  /* ⚠️★ `.back` を そのまま 入れては いけません ―― ★札の うら面の 絵も `img.back` です。
     ★ ★.topbar で しぼります（★これで 60件の 誤りが 消えました。★→ pageone.css の 長い 注）。 */
  var TOUCH_SEL = '.topbar .back,.howto,.start-button,.dialog-ok,.close-dialog,.suit-btn';
  function measureOnce() {
    var r = stageEl.getBoundingClientRect();
    var out = { over: 0, off: 0, offName: [], small: 0,
                scrollX: document.documentElement.scrollWidth > window.innerWidth,
                scrollY: document.documentElement.scrollHeight > window.innerHeight };
    /* ⚠️★★ 札の はみ出しは **本当に 描かれた 大きさ** で 測ります ★★
       ★ はじめは style.left/top ＋ geo.cw/ch（＝ 計算の 上の 大きさ）で 測って いました。
         ★★ わざと CSS で 札を 260px に して みたのに **鳴りませんでした**【T152・私の 失敗】。
         ★ ★計算だけ 見て いると、CSS で こわれた ときに 気づけません。
       ★ → ★getBoundingClientRect（＝ 画面に 出て いる 姿）で 測ります。
         ★ ★測る 前に .measuring で 動きを 止めて いる ので、途中の 姿は 拾いません。 */
    for (var id in cardEl) {
      if (!cardEl.hasOwnProperty(id)) continue;
      var e = cardEl[id];
      if (!e.parentNode) continue;
      var q = e.getBoundingClientRect();
      out.over = Math.max(out.over,
        Math.round(r.left - q.left), Math.round(r.top - q.top),
        Math.round(q.right - r.right), Math.round(q.bottom - r.bottom));
    }
    out.over = Math.max(0, out.over);
    var list = document.querySelectorAll(TOUCH_SEL);
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (!el.offsetParent && el.tagName !== 'BODY') continue;
      var q = el.getBoundingClientRect();
      if (q.width === 0 || q.height === 0) continue;
      if (q.left < -0.5 || q.top < -0.5 || q.right > window.innerWidth + 0.5 || q.bottom > window.innerHeight + 0.5) {
        out.off++; out.offName.push(el.className || el.tagName);
      }
      if (q.width < 43.5 || q.height < 43.5) out.small++;
    }
    return out;
  }

  /* ★★ はみ出し しらべ（設計図 追記③）★★
     ★ ふだんの 7枚 だけで なく、★★手札が 28枚に なった 場面も 必ず 混ぜます
       （★ルル §1-5：★(c) 出せるまで 引く は 手札が 28枚に なる）。 */
  function fitTest(n) {
    n = n || 250;
    var rd = C.rng(90909), worst = 0, offTotal = 0, smallTotal = 0, names = {}, sx = 0, sy = 0;
    var keepG = g, keepBusy = busy, keepOver = over;
    titleScreen.classList.add('hidden');
    playScreen.classList.remove('hidden');
    build(); layout();
    still(function () {
      for (var k = 0; k < n; k++) {
        dropCards();
        g = C.makeGame(rd, { rules: rules, players: 4, hand: 7 });
        /* ★ 3回に 1回は「手札が ふくらんだ」場面を 作る（★7 → 最大 28枚）*/
        var extra = (k % 3 === 0) ? (2 + (k % 22)) : 0;
        var p, i;
        for (p = 0; p < g.nP; p++) {
          for (i = 0; i < extra; i++) {
            if (!g.deck.length) break;
            g.hands[p].push(g.deck.pop());
          }
        }
        for (p = 1; p < g.nP; p++) for (i = 0; i < g.hands[p].length; i++) makeCard(g.hands[p][i], false);
        for (i = 0; i < g.hands[0].length; i++) makeCard(g.hands[0][i], true);
        for (i = 0; i < g.deck.length; i++) makeCard(g.deck[i], false);
        for (i = 0; i < g.pile.length; i++) makeCard(g.pile[i], true);
        placeAll(true);
        var m = measureOnce();
        if (m.over > worst) worst = m.over;
        offTotal += m.off; smallTotal += m.small;
        for (var q = 0; q < m.offName.length; q++) names[m.offName[q]] = 1;
        if (m.scrollX) sx++;
        if (m.scrollY) sy++;
      }
    });
    dropCards();
    g = keepG; busy = keepBusy; over = keepOver;
    if (g) { rebuild(); placeAll(true); }
    var out = {
      '画面': window.innerWidth + '×' + window.innerHeight,
      '★札': geo.cw + '×' + geo.ch + 'px',
      '調べた場面': n + '（★うち 3分の1 は 手札が ふくらんだ 場面）',
      '★はみ出し（一番 大きい）': worst + 'px',
      '★押す ところが 画面外': offTotal + '件',
      '★44pxより 小さい ボタン': smallTotal + '件',
      '横スクロールが 出た場面': sx, '縦スクロールが 出た場面': sy
    };
    if (offTotal) out['画面外に 出た もの'] = Object.keys(names);
    console.log('[ページワン] fitTest', out);
    return out;
  }

  /* ★ 画面の 文字（★手札の 上の 文字は 0文字で なければ ならない）*/
  function readableText(rootEl) {
    if (!rootEl) return '';
    var out = '', w = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, null, false), t;
    while ((t = w.nextNode())) {
      var p = t.parentNode, skip = false;
      while (p && p !== rootEl) {
        var tn = (p.tagName || '').toLowerCase();
        if (tn === 'script' || tn === 'style' || tn === 'svg') { skip = true; break; }
        p = p.parentNode;
      }
      if (!skip) out += t.nodeValue;
    }
    return out.replace(/\s+/g, ' ').trim();
  }

  /* ============================================================
     ★★ CSS の 決まりを ぜんぶ 集める ★★
     ------------------------------------------------------------
     ⚠️★★ ここで 1つ、★**見張りが 丸ごと 死んで いた** のを 見つけました【T152・私の 失敗】。
        ★ 前の 書き方は こうでした：
            if (r.cssRules) { walk(r.cssRules); continue; }   ← ★これ
            if (r.selectorText) out.push(…);
        ★ ★いまの Chrome は 「入れ子の CSS」に 対応した ので、
          ★★**ふつうの 決まり（.card など）にも 空の cssRules が 付いて います。**
          ★ 空でも「物」なので if は 通り、★★中身は 1つも 集まりませんでした。
        ★ ★＝ 「札に 光りを 足す」を わざと やっても、★★見張りは 1度も 鳴りませんでした。
        ★ ★目では 分かりません。★★わざと 壊して みて はじめて 分かりました。
     ★ → ★**まず 拾い、それから（中身が ある ときだけ）もぐる** ように 直しました。
     ⚠️★ 同じ 書き方が **ババ抜き T145 の babanuki-game.js にも あります**（→ 申し送り）。
     ============================================================ */
  function cssRuleList() {
    var out = [];
    function walk(rs) {
      for (var j = 0; j < rs.length; j++) {
        var r = rs[j];
        if (r.selectorText) out.push({ sel: r.selectorText, text: r.cssText });
        if (r.cssRules && r.cssRules.length) walk(r.cssRules);
      }
    }
    for (var i = 0; i < document.styleSheets.length; i++) {
      try { walk(document.styleSheets[i].cssRules); } catch (e) {}
    }
    return out;
  }
  function cssRulesText() {
    var s = '';
    for (var i = 0; i < document.styleSheets.length; i++) {
      try {
        var rs = document.styleSheets[i].cssRules;
        for (var j = 0; j < rs.length; j++) s += rs[j].cssText + '\n';
      } catch (e) {}
    }
    return s;
  }

  /* ============================================================
     ★★★ 暗くする しかけを 本物で 通して 測る ★★★
     ------------------------------------------------------------
     ★ 数字を 書き写しません。★★本物の refreshDim を そのまま 通します。
     ★ 測り終わったら 状態を 1つ 残らず 元に 戻します
       （★T144 §7-5 の 失敗 ―― ★見張りが 自分で 場面を こわして 誤って 鳴った）。
     ============================================================ */
  function dimProbe() {
    var out = { onMe: 0, wrong: 0, botTurn: 0, busyOn: 0, overOn: 0, notMe: 0, none: 0, worked: 0 };
    if (!g || !cardsEl) return out;
    var keepBusy = busy, keepOver = over, keepCur = g.cur, keepTake = takeLeft;
    still(function () {
      var i;
      /* ★ ① 自分の 番 ―― ★出せない 札 だけが 暗い か */
      busy = false; over = false; g.cur = 0; takeLeft = 0;
      refreshDim();
      var ok = {}, l = C.legalIdx(g, 0);
      for (i = 0; i < l.length; i++) ok[l[i]] = 1;
      for (i = 0; i < g.hands[0].length; i++) {
        var e = cardEl[g.hands[0][i].id];
        if (!e) continue;
        var dim = e.classList.contains('is-dim');
        if (dim) out.onMe++;
        if (dim === !!ok[i]) out.wrong++;                 /* ★ 出せる のに 暗い／出せない のに 明るい */
      }
      if (out.onMe > 0) out.worked = 1;
      /* ★ 自分の 手札 いがいに 付いて いないか */
      var all = cardsEl.querySelectorAll('.card.is-dim');
      for (i = 0; i < all.length; i++) {
        var w = all[i].where;
        if (w !== 'me') out.notMe++;
      }
      /* ★ ② ロボットの 番 ―― ★1枚も 暗く しない */
      g.cur = 1; refreshDim();
      out.botTurn = cardsEl.querySelectorAll('.card.is-dim').length;
      /* ★ ③ 動いて いる 途中 ―― ★1枚も 暗く しない */
      g.cur = 0; busy = true; refreshDim();
      out.busyOn = cardsEl.querySelectorAll('.card.is-dim').length;
      /* ★ ④ 終わった あと ―― ★1枚も 暗く しない */
      busy = false; over = true; g.over = true; refreshDim();
      out.overOn = cardsEl.querySelectorAll('.card.is-dim').length;
      g.over = false;
    });
    busy = keepBusy; over = keepOver; g.cur = keepCur; takeLeft = keepTake;
    refreshDim();
    return out;
  }

  /* ★★ 8を 出した とき、★本当に「マークを 聞く」で 止まるか（★本物の playHuman を 通す）★★ */
  function eightProbe() {
    var out = { asked: 0, autoSuit: 0, played: 0 };
    if (!g) return out;
    var keepG = g, keepBusy = busy, keepWait = waitSuit;
    var rd = C.rng(31415);
    still(function () {
      /* ★ 8を 手札に 持って いる 場面を 作る */
      var gg = C.makeGame(rd, { rules: { eight: 1, jack: 0, two: 0, queen: 0, ace: 0 }, players: 4, hand: 7 });
      var found = -1, i;
      for (i = 0; i < gg.deck.length; i++) {
        if (C.rankOf(gg.deck[i].c) === C.R_EIGHT) { found = i; break; }
      }
      if (found < 0) return;
      gg.hands[0].push(gg.deck.splice(found, 1)[0]);
      g = gg; g.cur = 0; busy = false; waitSuit = -1;
      var idx = g.hands[0].length - 1;
      var before = g.suit, hand0 = g.hands[0].length;
      playHuman(idx);
      if (waitSuit === idx) out.asked = 1;
      if (g.hands[0].length !== hand0) out.played = 1;     /* ★ 聞かずに 出して いたら NG */
      if (g.suit !== before) out.autoSuit = 1;             /* ★ 勝手に マークが 変わって いたら NG */
      waitSuit = -1;
    });
    g = keepG; busy = keepBusy; waitSuit = keepWait;
    suitPick.classList.add('hidden');
    return out;
  }

  /* ============================================================
     ★★★ ⑭ 人が さわれるか ―― T155 で 足した 見張り ★★★
     ------------------------------------------------------------
     ⚠️★★ ここは「見張りの 穴」の 直しです。★★T152 の 12万試合は 1つも まちがって いません。
        ★★ ただ ―― ★★**数えたのは core。★★止まったのは 画面 でした**（トライ T153 §1-4）。
        ★ ★runMany / autoPlay の 中では、★人の 番も **C.drawOne を 直に 呼びます**（★押す 必要が ない）。
        ★ ★本物の 画面では、★★**人の 番は 押されるまで 1枚も 引きません。**
        ★ ★★＝ 12万試合は「人が 山札を 押す 道」を **1度も 通って いません。**
        ★ ★T152 で わざと 壊した 14通りも、★ぜんぶ「画面の 見た目」と「core の 決まり」でした。
          ★★ **「人が さわれるか」を 壊した ものは 0通り** ―― ★そこが 穴 でした。
     ★ ★★ここでは ―― ★**本物の 指と 同じ 道**（pointerdown → pointerup）を 通して、
       ★★ 「★人の 番・★出せる 札が 1枚も ない・★山札 0枚」の 画面を 本当に 作り、
       ★★ **盤の 押せる ところを ぜんぶ 押して、1つも 動かなければ 鳴らします。**
     ★ ★状態は 1つ 残らず 元に 戻します（★T144 §7-5：見張りが 自分で 場面を こわす 事故）。
     ============================================================ */
  /* ⚠️★★ T157：★**座標を 付けずに 送っては いけません。**
     ★ onUp は はなした 点（e.clientX / e.clientY）で 札を 引き直す ように なりました。
     ★★ 座標なしで 送ると、★どの 札を 押しても「(0,0) の 下」を 見に 行く ―― ★★見張りが
     ★★ 自分で 誤って 鳴ります（★私は T155 でも 座標の 取りちがえで 1度 やって います）。
     ★ ★x / y は **画面の 座標**（getBoundingClientRect の まま）を 渡します。 */
  function tapDom(el, x, y) {
    if (!el) return false;
    function mk(type, px, py) {
      var o = { bubbles: true, cancelable: true, clientX: px, clientY: py,
                pointerId: 1, isPrimary: true, pointerType: 'touch' };
      try { return new PointerEvent(type, o); }
      catch (e) {
        var ev = document.createEvent('Event'); ev.initEvent(type, true, true);
        ev.clientX = px; ev.clientY = py; ev.pointerType = 'touch'; return ev;
      }
    }
    var r = el.getBoundingClientRect();
    var ax = (x === undefined) ? r.left + r.width / 2 : x;
    var ay = (y === undefined) ? r.top + r.height / 2 : y;
    el.dispatchEvent(mk('pointerdown', ax, ay));
    el.dispatchEvent(mk('pointerup', ax, ay));
    return true;
  }
  /* ★ hitAt は 上の「人の 操作」へ 引っこして あります（T157）。
     ★★ ⑭ も onUp も **同じ 目**で 見ます ―― ★見張りと 本体が ずれない ように。 */
  function snapG() {
    var s = { hands: [], deck: g.deck.slice(), pile: g.pile.slice() }, p;
    for (p = 0; p < g.nP; p++) s.hands.push(g.hands[p].slice());
    ['suit', 'rank', 'cur', 'dir', 'pending', 'over', 'winner', 'byShort',
     'plays', 'draws', 'mixes', 'stuck'].forEach(function (k) { s[k] = g[k]; });
    return s;
  }
  function restoreG(s) {
    var p;
    for (p = 0; p < g.nP; p++) g.hands[p] = s.hands[p].slice();
    g.deck = s.deck.slice(); g.pile = s.pile.slice();
    ['suit', 'rank', 'cur', 'dir', 'pending', 'over', 'winner', 'byShort',
     'plays', 'draws', 'mixes', 'stuck'].forEach(function (k) { g[k] = s[k]; });
  }
  /* ★ 「人の 番・出せる 札が 1枚も ない」場面を、★いまの 52枚を 動かして 作る
     ★ （★札は 1枚も 増やしません。★★52枚 きっちり 保ちます）*/
  function makeNoPlay(deckLeft, pileLeft) {
    /* ⚠️★ はじめは「いまの 手札は そのままで、★合わない 場札を さがす」書き方に して いました。
       ★★ 手札 7枚が 4つの マークを ぜんぶ 持って いると **1枚も 見つかりません**
          ―― ★★8サイズの うち 4サイズで「1場面も 作れなかった」と 自分で 鳴りました【T155・私の 失敗】。
       ★ → ★★**先に 場札を 決めて、それに 合わない 札を 手札に 配る** 向きに 直しました。 */
    var pool = g.deck.concat(g.pile).concat(g.hands[0]), i;
    g.deck = []; g.pile = []; g.hands[0] = [];
    /* ★ 場の 1番上 ―― ★ふつうの 札（★特殊札から 始めない・makeGame と 同じ 作法）*/
    var topAt = -1;
    for (i = 0; i < pool.length; i++) {
      if (g.rules.eight && C.rankOf(pool[i].c) === C.R_EIGHT) continue;
      topAt = i; break;
    }
    if (topAt < 0) return false;
    var top = pool.splice(topAt, 1)[0];
    var ts = C.suitOf(top.c), tr = C.rankOf(top.c);
    /* ★ 人の 手札 ―― ★1枚も 出せない 札だけ 7枚（★マークも ちがう・数字も ちがう・8でも ない）*/
    var rest = [];
    for (i = 0; i < pool.length; i++) {
      var c = pool[i].c;
      var no = (C.suitOf(c) !== ts && C.rankOf(c) !== tr &&
                !(g.rules.eight && C.rankOf(c) === C.R_EIGHT));
      if (no && g.hands[0].length < 7) g.hands[0].push(pool[i]);
      else rest.push(pool[i]);
    }
    if (g.hands[0].length < 3) return false;
    /* ★ のこりを 山と 場に 分ける（★あふれたぶんは ロボット3の 手札へ ―― ★52枚 きっちり 守る）*/
    var deckPart = rest.splice(0, deckLeft);
    var pilePart = rest.splice(0, Math.max(0, pileLeft - 1));
    for (i = 0; i < rest.length; i++) g.hands[g.nP - 1].push(rest[i]);
    g.deck = deckPart;
    g.pile = pilePart.concat([top]);
    g.suit = ts; g.rank = tr;
    g.cur = 0; g.pending = 0; g.over = false; g.winner = -1; g.byShort = false; g.stuck = false;
    return !C.canPlay(g, 0);
  }
  function reachProbe() {
    var out = { cases: 0, dead: 0, why: [], detail: [] };
    if (!g || !cardsEl || !geo || !built) return out;
    var snap = snapG();
    var kBusy = busy, kOver = over, kTake = takeLeft, kWait = waitSuit, kMix = g.mixes;
    var kResult = resultWrap.classList.contains('hidden');
    var tMark = timers.length;

    /* ★ ① 山札 0枚・場に たくさん … ★★これが T153 の 🔴-1 そのもの（★まぜ直して 引ける はず）
       ★ ② 山札 0枚・場が 1枚 … ★まぜ直せない → ★その場で 試合が 終わる はず
       ★ ③ 山札 0枚・まぜ直し 24回 使い切り → ★★同じく 終わる はず
       ★ ④ 山札 5枚（ふつう）… ★これまでも 通って いた 道（★見張りの 効き目 くらべ）*/
    var CASES = [
      ['★山札 0枚・場に たくさん（🔴-1）', 0, 30, 0],
      ['★山札 0枚・場が 1枚だけ', 0, 1, 0],
      ['★山札 0枚・まぜ直し 使い切り', 0, 30, C.LIM.MIX],
      ['★山札 5枚（ふつう）', 5, 10, 0]
    ];
    still(function () {
      CASES.forEach(function (cs) {
        restoreG(snap);
        busy = false; over = false; takeLeft = 0; waitSuit = -1;
        resultWrap.classList.add('hidden');
        if (!makeNoPlay(cs[1], cs[2])) return;          /* ★ 作れない 手札は 数えません */
        g.mixes = cs[3];
        rebuild(); placeAll(true); refreshDim();
        out.cases++;
        var was = { h: g.hands[0].length, d: g.deck.length, p: g.pile.length,
                    over: g.over, wait: waitSuit, mix: g.mixes };
        /* ★★ 盤の 押せる ところを ぜんぶ 押す（★山札の 場所・場札の 場所・自分の 手札・盤ぜんたい）★★
           ⚠️★ ここは **画面の 座標**（getBoundingClientRect）で 取ります。
              ★★ geo.deckX / geo.midY は **器の 中の 座標** です ―― ★私は はじめ それを
              ★★ そのまま elementFromPoint に 渡して、★見張りが 自分で 誤って 鳴りました【T155・私の 失敗】。 */
        var pts = [], i, q;
        if (deckSlot) { q = deckSlot.getBoundingClientRect(); pts.push([q.left + q.width / 2, q.top + q.height / 2]); }
        if (g.pile.length && cardEl[g.pile[g.pile.length - 1].id]) {
          q = cardEl[g.pile[g.pile.length - 1].id].getBoundingClientRect();
          pts.push([q.left + q.width / 2, q.top + q.height / 2]);
        }
        for (i = 0; i < g.hands[0].length; i++) {
          var he = cardEl[g.hands[0][i].id];
          if (!he) continue;
          q = he.getBoundingClientRect();
          pts.push([q.left + q.width / 2, q.top + q.height / 2]);
        }
        var st = stageEl.getBoundingClientRect();
        for (i = 0; i < 24; i++) pts.push([st.left + st.width * ((i % 4) + 0.5) / 4,
                                           st.top + st.height * (Math.floor(i / 4) + 0.5) / 6]);
        var moved = 0, hitDeck = 0;
        for (i = 0; i < pts.length; i++) {
          var el = hitAt(pts[i][0], pts[i][1]);
          if (!el) continue;
          if (el.where === 'deck') hitDeck++;
          tapDom(el, pts[i][0], pts[i][1]);      /* ★★ T157：★座標を 付けて 送る（★上の ⚠️）*/
          if (g.hands[0].length !== was.h || g.deck.length !== was.d || g.pile.length !== was.p ||
              g.over !== was.over || waitSuit !== was.wait || g.mixes !== was.mix) { moved = 1; break; }
        }
        out.detail.push(cs[0] + '：押せた 所 ' + pts.length + '／山札の 場所 ' + hitDeck +
                        '／' + (moved ? '★動いた ○' : '★★1ミリも 動かない ✕'));
        if (!hitDeck) { out.dead++; out.why.push(cs[0] + ' ―― ★★山札の 場所に 押す ものが 1つも ない'); }
        else if (!moved) { out.dead++; out.why.push(cs[0] + ' ―― ★★盤ぜんたいを 押しても 1ミリも 動かない'); }
      });
    });
    /* ★ 片づけ ―― ★この 見張りが 作った 待ち時間だけ 消して、★元の 試合に もどします */
    for (var t = timers.length - 1; t >= tMark; t--) { clearTimeout(timers[t]); timers.splice(t, 1); }
    restoreG(snap);
    g.mixes = kMix;
    busy = kBusy; over = kOver; takeLeft = kTake; waitSuit = kWait;
    if (kResult) resultWrap.classList.add('hidden'); else resultWrap.classList.remove('hidden');
    rebuild(); placeAll(true); refreshDim();
    return out;
  }

  /* ============================================================
     ★★★ ⑮ マーク板を 出した ままの 画面を 測る ―― T155 で 足した 見張り ★★★
     ------------------------------------------------------------
     ⚠️★★ これまでの verify は、★中で eightProbe を 通る ときに
        ★★ **自分で マーク板を 閉じて から** fitTest を 走らせて いました。
        ★ ＝ ★★**板が 出て いる 画面を、1度も 測って いません**（トライ T153 §2-2）。
        ★ ★だから ―― ★たてで 8を 出して よこに すると ♠ボタンが 画面の 223px 下に 出て いても、
          ★★ verify は NG 0 と 言いました（★fitTest 単体は ちゃんと 160件 と 言って いました）。
     ★ → ★★**板を 出した まま 測ります。**★4つの ボタンが 1つでも 画面の 外なら 鳴ります。
     ============================================================ */
  function pickFitProbe() {
    var out = { off: 0, names: [], top: 0, bottom: 0, VH: window.innerHeight, btnOff: 0, relaid: 0 };
    var keepHidden = suitPick.classList.contains('hidden');
    var keepWait = waitSuit, keepTop = suitPick.style.top;
    still(function () {
      waitSuit = 0;                                   /* ★ 8を 出して マークを 待って いる ふり */
      suitPick.classList.remove('hidden');
      placeSuitPick();
      /* ★★ ここが この 見張りの 中心です ★★
         ★ 「画面が 変わった」を 本物と 同じ 形で 起こします ――
           ★★ ①板の 位置を わざと 古いまま（画面の 外）に する
           ★★ ②layout() を 呼ぶ（★まわした とき 本当に 呼ばれるのは これ 1つ です）
         ★ ★layout() が 板を 置き直して いれば、★板は 画面の 中に もどって いる はず。
           ★★ 置き直して いなければ ―― ★★**古い ままの 場所** ＝ 画面の 外 です（＝ T153 🔴-2）。 */
      suitPick.style.top = '-9999px';
      layout();
      var r = suitPick.getBoundingClientRect();
      out.relaid = (r.top > -999) ? 1 : 0;
      out.top = Math.round(r.top); out.bottom = Math.round(r.bottom);
      var b = suitPick.querySelectorAll('.suit-btn');
      for (var i = 0; i < b.length; i++) {
        var q = b[i].getBoundingClientRect();
        if (q.top < -0.5 || q.left < -0.5 ||
            q.bottom > window.innerHeight + 0.5 || q.right > window.innerWidth + 0.5) out.btnOff++;
      }
      /* ★ 板を 出した ままの 画面で、★押す ところが ぜんぶ 画面の 中か（★fitTest と 同じ ものさし）*/
      var m = measureOnce();
      out.off = m.off; out.names = m.offName;
    });
    waitSuit = keepWait;
    if (keepHidden) { suitPick.classList.add('hidden'); suitPick.style.top = keepTop; }
    else placeSuitPick();
    return out;
  }

  /* ============================================================
     ★★★ ⑯ 押して・すべらせて・はなす ―― T157 で 足した 見張り ★★★
     ------------------------------------------------------------
     ⚠️★★ ⑭ は「★押して 動くか」までしか 見て いませんでした。
        ★ ★★**押した 所と はなした 所が ちがう とき**を、★1度も 通して いません。
        ★ ★そこに 🟡 が 隠れて いました（T155 §7・T157）：
          ★★ 指の ポインタは 押した ものに くっつく ので、★e.target は いつまでも「押した 札」。
          ★★ ＝ ★となりへ すべらせて はなしても、★★**押した 方の 札が 出て しまう。**
     ★ ★★ここでは ―― ★**その くっつきを、そのまま 作って 通します**：
       ```
       ★ ①A（出せる 札）に pointerdown を 送る … ★座標は A の まん中
       ★ ②★★A に pointerup を 送る … ★★★座標だけ B（となりの 札）の まん中
            ★★ ＝ ★これが 指の くっつき そのもの（implicit pointer capture）
       ★ ③手札が 減って いたら ―― ★★鳴らす
       ```
     ★ ★くらべを 2つ 置きます（★片方だけ だと「いつも 動かない」でも 通って しまう）：
       ★ ★**まっすぐ**（A に down → A に up・座標も A）… ★★減らなければ 鳴らす（＝ 測り方が おかしい）
       ★ ★**マウス**  （A に down → B に up・座標も B）… ★減ったら 鳴らす
     ★ ★もう 1つの 目：★onUp の 中に `hitAt(` が 無い／`e.target` が ある なら 鳴らす（★③④と 同じ 作法）
     ★ ★状態は 1つ 残らず 元に もどします（★52枚 きっちり 保った まま）。
     ============================================================ */
  /* ★ 「人の 番・出せる 札が 1枚 ある・手札が 2枚 以上」の 場面を、★いまの 52枚を 動かして 作る */
  function makeCanPlay() {
    var pool = g.deck.concat(g.pile).concat(g.hands[0]), i;
    g.deck = []; g.pile = []; g.hands[0] = [];
    var topAt = -1;
    for (i = 0; i < pool.length; i++) {
      if (g.rules.eight && C.rankOf(pool[i].c) === C.R_EIGHT) continue;
      topAt = i; break;
    }
    if (topAt < 0) return false;
    var top = pool.splice(topAt, 1)[0];
    var ts = C.suitOf(top.c), tr = C.rankOf(top.c);
    /* ★ ①出せる 札を 1枚（★同じ マーク・★8では ない ＝ マーク板を 出さない）*/
    var okAt = -1;
    for (i = 0; i < pool.length; i++) {
      var c0 = pool[i].c;
      if (C.suitOf(c0) === ts && !(g.rules.eight && C.rankOf(c0) === C.R_EIGHT)) { okAt = i; break; }
    }
    if (okAt < 0) return false;
    g.hands[0].push(pool.splice(okAt, 1)[0]);
    /* ★ ②出せない 札を 3枚（★となりに 置く 相手）*/
    var rest = [];
    for (i = 0; i < pool.length; i++) {
      var c1 = pool[i].c;
      var no = (C.suitOf(c1) !== ts && C.rankOf(c1) !== tr &&
                !(g.rules.eight && C.rankOf(c1) === C.R_EIGHT));
      if (no && g.hands[0].length < 4) g.hands[0].push(pool[i]); else rest.push(pool[i]);
    }
    if (g.hands[0].length < 2) return false;
    g.deck = rest.splice(0, 5);
    g.pile = rest.splice(0, 3).concat([top]);
    for (i = 0; i < rest.length; i++) g.hands[g.nP - 1].push(rest[i]);   /* ★ 52枚 きっちり */
    g.suit = ts; g.rank = tr;
    g.cur = 0; g.pending = 0; g.over = false; g.winner = -1; g.byShort = false; g.stuck = false;
    return C.canPlay(g, 0);
  }
  /* ★ A に down → （x,y）で up を 送る。★upEl を 変えると「くっつき」の 有り／無しを 作り分けられる */
  function pressRelease(downEl, upEl, x, y) {
    function mk(type, px, py) {
      var o = { bubbles: true, cancelable: true, clientX: px, clientY: py,
                pointerId: 1, isPrimary: true, pointerType: 'touch' };
      try { return new PointerEvent(type, o); }
      catch (e) {
        var ev = document.createEvent('Event'); ev.initEvent(type, true, true);
        ev.clientX = px; ev.clientY = py; ev.pointerType = 'touch'; return ev;
      }
    }
    var r = downEl.getBoundingClientRect();
    downEl.dispatchEvent(mk('pointerdown', r.left + r.width / 2, r.top + r.height / 2));
    upEl.dispatchEvent(mk('pointerup', x, y));
  }
  function slideProbe() {
    var out = { ok: 0, straight: '―', stuck: '―', mouse: '―',
                sayStraight: '―', say: '―', sayMouse: '―', why: [] };
    if (!g || !cardsEl || !geo || !built) { out.why.push('★場面を 作れない（★立ち上がって いない）'); return out; }
    var snap = snapG();
    var kBusy = busy, kOver = over, kTake = takeLeft, kWait = waitSuit, kMix = g.mixes;
    var kResult = resultWrap.classList.contains('hidden');
    var tMark = timers.length;

    function scene() {
      restoreG(snap);
      busy = false; over = false; takeLeft = 0; waitSuit = -1;
      resultWrap.classList.add('hidden');
      if (!makeCanPlay()) return null;
      rebuild(); placeAll(true); refreshDim();
      var A = cardEl[g.hands[0][0].id];
      if (!A) return null;
      /* ★ B ＝ ★「その まん中を さすと **A では ない 札**が 返る」札。
         ★★ 重なりで B の まん中が A に なる ことが ある ので、★本当に 引いて 確かめます。 */
      for (var i = 1; i < g.hands[0].length; i++) {
        var e2 = cardEl[g.hands[0][i].id];
        if (!e2) continue;
        var r2 = e2.getBoundingClientRect();
        var bx = r2.left + r2.width / 2, by = r2.top + r2.height / 2;
        var got = hitAt(bx, by);
        if (got && got !== A && got.slotId !== A.slotId) return { A: A, x: bx, y: by, n: g.hands[0].length };
      }
      return null;
    }

    still(function () {
      /* ★ (a) まっすぐ 押して はなす ―― ★★これが 通らなければ 測り方が おかしい */
      var s = scene();
      if (!s) { out.why.push('★★試し方が おかしい：★「出せる 札 ＋ となりの 札」の 場面を 作れなかった'); return; }
      var rA = s.A.getBoundingClientRect();
      s.A.classList.remove('is-no');
      pressRelease(s.A, s.A, rA.left + rA.width / 2, rA.top + rA.height / 2);
      out.straight = (g.hands[0].length < s.n) ? '○ 出た' : '★✕ 出ない';
      if (g.hands[0].length >= s.n) out.why.push('★★試し方が おかしい：★まっすぐ 押しても 札が 出ない');
      /* ★★ T160 の くらべ ―― ★★**まっすぐ 押して 通った ときは ゆれない**
         ★ ★これが 無いと「★いつも ゆれて いる」でも 下の (b)(c) が 通って しまいます。 */
      out.sayStraight = s.A.classList.contains('is-no') ? '★★✕ ゆれて しまう' : '○ ゆれない';
      if (s.A.classList.contains('is-no')) {
        out.why.push('★★まっすぐ 押して 出た のに ゆれた（★★いつも ゆれて いる ＝ 返事に なって いません）');
      }

      /* ★ (b) ★★指の くっつき ―― ★A に down、★★A に up（座標だけ B）*/
      s = scene();
      if (!s) { out.why.push('★★試し方が おかしい：★2回目の 場面を 作れなかった'); return; }
      s.A.classList.remove('is-no');                 /* ★ 前の 回の 名残を 消して から 測る */
      if (s.A.classList.contains('is-no')) { out.why.push('★★試し方が おかしい：★is-no を 消せない'); return; }
      pressRelease(s.A, s.A, s.x, s.y);
      var slid = (g.hands[0].length < s.n);
      out.stuck = slid ? '★★✕ 出て しまう' : '○ 出ない';
      if (slid) out.why.push('★★★指で となりへ すべらせて はなしたのに、★押した 方の 札が 出た');
      /* ★★ T160 ―― ★★出さなかった なら、★★**返事は して いるか**（→ 上の ⚠️ T160）
         ★ ★出て しまった とき（slid）は、この 問いは 立ちません（★別の NG が すでに 出て います）。*/
      out.say = slid ? '―' : (s.A.classList.contains('is-no') ? '○ ぷるっと 返した' : '★★✕ 何も 返さない');
      if (!slid && !s.A.classList.contains('is-no')) {
        out.why.push('★★★すべって 出なかった のに、★押した 札が 1回も ゆれない（★遊ぶ人には 壊れたと 見分けが つきません）');
      }

      /* ★ (c) くらべ：マウス ―― ★A に down、★B に up（座標も B）*/
      s = scene();
      if (!s) { out.why.push('★★試し方が おかしい：★3回目の 場面を 作れなかった'); return; }
      s.A.classList.remove('is-no');
      var upEl = hitAt(s.x, s.y) || s.A;
      pressRelease(s.A, upEl, s.x, s.y);
      var m = (g.hands[0].length < s.n);
      out.mouse = m ? '★✕ 出て しまう' : '○ 出ない';
      if (m) out.why.push('★★マウスで すべらせても 押した 方の 札が 出た');
      /* ★★ T160 ―― ★★指と マウスで **返事も そろって いるか**（★片方だけ 黙るのは ばらつき）*/
      out.sayMouse = m ? '―' : (s.A.classList.contains('is-no') ? '○ ぷるっと 返した' : '★★✕ 何も 返さない');
      if (!m && !s.A.classList.contains('is-no')) {
        out.why.push('★★マウスで すべった ときだけ 返事が ない（★指と そろって いません）');
      }

      out.ok = 1;
    });

    /* ★ 片づけ ―― ★この 見張りが 作った 待ち時間だけ 消して、★元の 試合に もどします */
    for (var t = timers.length - 1; t >= tMark; t--) { clearTimeout(timers[t]); timers.splice(t, 1); }
    restoreG(snap);
    g.mixes = kMix;
    busy = kBusy; over = kOver; takeLeft = kTake; waitSuit = kWait;
    if (kResult) resultWrap.classList.add('hidden'); else resultWrap.classList.remove('hidden');
    rebuild(); placeAll(true); refreshDim();
    return out;
  }

  /* ============================================================
     ★★★ ⑲ ★山札を まっすぐ 押した ときの 返事（T161）★★★
     ------------------------------------------------------------
     ★★ 数えるのでは なく ―― ★★**本物の 道（onDown → onUp → doDraw）を 3通り 通します。**
       ★ ★(a) ★★出せる とき に 山札を 押す … ★★引けない（追記④）＋ ★★ぷるっと 返す
       ★ ★(b) ★★くらべ：出せない とき に 押す … ★★引ける ＋ ★★**1枚も ゆれない**
             ―― ★★これが 無いと「★いつも ゆれる」でも (a) は 通って しまいます（★T160 §6-③ の わな）
       ★ ★(c) ★★山札 0枚（空の わく）＋ 出せる とき … ★★まぜ直しも 起きない ＋ ぷるっ
             ―― ★★ここが いちばん あぶない：★引いたら core が 場札を まぜ直して しまいます
     ★★ そして ―― ★★**線を こえて いないか を 毎回 数えます**（→ doDraw の 上の ⚠️ T161）：
       ★ ★★手札の 暗い／明るいが **1枚も 変わって いない**（★遊びの 情報を 足して いない）
       ★ ★★ゆれる 前から **明るい 札が 1枚以上 見えて いる**（★★新しい ことを 何も 言って いない）
       ★ ★★ひとことを 出して いない（★`sayEl` が かくれた まま）
     ★ ★状態は 1つ 残らず 元に もどします（★52枚 きっちり 保った まま）。
     ============================================================ */
  /* ★ 手札の「暗い／明るい」を 1本の 文字列に する（★1 ＝ 暗い・0 ＝ 明るい）*/
  function dimMap() {
    var m = '', i, e;
    for (i = 0; i < g.hands[0].length; i++) {
      e = cardEl[g.hands[0][i].id];
      m += e ? (e.classList.contains('is-dim') ? '1' : '0') : '?';
    }
    return m;
  }
  function deckProbe() {
    var out = { ok: 0, can: '―', canSay: '―', shakes: '―', see: '―',
                no: '―', noSay: '―', empty: '―', emptySay: '―',
                bright: 0, dimSame: '―', said: '―', why: [] };
    if (!g || !cardsEl || !geo || !built) { out.why.push('★場面を 作れない（★立ち上がって いない）'); return out; }
    var snap = snapG();
    var kBusy = busy, kOver = over, kTake = takeLeft, kWait = waitSuit, kMix = g.mixes;
    var kResult = resultWrap.classList.contains('hidden');
    var kSay = sayEl.classList.contains('hidden');
    var tMark = timers.length;

    function reset() {
      restoreG(snap);
      busy = false; over = false; takeLeft = 0; waitSuit = -1;
      resultWrap.classList.add('hidden');
      sayEl.classList.add('hidden');
      var a = cardsEl.querySelectorAll('.card.is-no'), i;   /* ★ 前の 回の 名残を 消して から 測る */
      for (i = 0; i < a.length; i++) a[i].classList.remove('is-no');
    }
    /* ★ 山札の 場所に「いま 本当に ある もの」を、★★onUp と 同じ 目（hitAt）で 引く */
    function deckEl() {
      if (!deckSlot || !deckSlot.parentNode) return null;
      var q = deckSlot.getBoundingClientRect();
      return hitAt(q.left + q.width / 2, q.top + q.height / 2);
    }
    function pressDeck() {
      var e = deckEl();
      if (!e) return null;
      var q = e.getBoundingClientRect();
      pressRelease(e, e, q.left + q.width / 2, q.top + q.height / 2);
      return e;
    }
    function shaken() { return cardsEl.querySelectorAll('.card.is-no').length; }

    still(function () {
      /* ★ (a) ★★出せる とき に 山札を まっすぐ 押す */
      reset();
      if (!makeCanPlay()) { out.why.push('★★試し方が おかしい：★「出せる 札が ある」場面を 作れなかった'); return; }
      rebuild(); placeAll(true); refreshDim();
      var d0 = g.deck.length, h0 = g.hands[0].length, m0 = g.mixes, p0 = g.pile.length;
      var dim0 = dimMap();
      out.bright = dim0.split('0').length - 1;
      if (out.bright < 1) { out.why.push('★★試し方が おかしい：★出せる 場面な のに 明るい 札が 0枚'); return; }
      if (shaken()) { out.why.push('★★試し方が おかしい：★押す 前から ゆれて いる'); return; }
      var e = pressDeck();
      if (!e) { out.why.push('★★試し方が おかしい：★山札の 場所に 押す ものが 無い'); return; }
      out.can = (g.deck.length === d0 && g.hands[0].length === h0 &&
                 g.mixes === m0 && g.pile.length === p0) ? '○ 引けない' : '★★✕ 引けて しまう';
      if (out.can !== '○ 引けない') {
        out.why.push('★★★出せる のに 山札から 引けて しまった（★設計図 追記④「勝手に 引かない」）');
      }
      var got = e.classList.contains('is-no');
      out.canSay = got ? '○ ぷるっと 返した' : '★★✕ 何も 返さない';
      if (!got) {
        out.why.push('★★★出せる ときに 山札を まっすぐ 押しても、★画面が 1つも 返事を しない' +
                     '（★遊ぶ人には 壊れたと 見分けが つきません）');
      }
      out.shakes = shaken() + '枚';
      if (shaken() !== 1) out.why.push('★★山札を 押して ゆれた ものが ' + shaken() + '枚（★1枚 の はず）');
      /* ★ 目に 見える 大きさか（★T160 の 意地悪と 同じ ものさし）*/
      var q = e.getBoundingClientRect(), op = parseFloat(getComputedStyle(e).opacity);
      out.see = Math.round(q.width) + '×' + Math.round(q.height) + 'px・すきとおり ' + (isNaN(op) ? '―' : op.toFixed(2));
      if (q.width < 24 || q.height < 24 || !(op > 0.05)) {
        out.why.push('★★★ゆれた ものが 目に 見えない（' + out.see + '）');
      }
      /* ★★ 線 ―― ★手札の 明るさを 1枚も 変えて いない／★ひとことも 出して いない */
      out.dimSame = (dimMap() === dim0) ? '○ 1枚も 変わらない' : '★★✕ 明るさが 変わった';
      if (dimMap() !== dim0) {
        out.why.push('★★★山札の 返事で 手札の 明るさが 変わった（★★遊びの 情報を 足して います）');
      }
      out.said = sayEl.classList.contains('hidden') ? '○ 出して いない' : '★★✕ ひとことを 出した';
      if (!sayEl.classList.contains('hidden')) {
        out.why.push('★★★山札の 返事で ひとことを 出した（★★文字で 教えるのは 説明の 追加 ―― §5.5）');
      }

      /* ★ (b) ★★くらべ：出せない とき ―― ★引ける・★★1枚も ゆれない */
      reset();
      if (!makeNoPlay(5, 3)) { out.why.push('★★試し方が おかしい：★「1枚も 出せない」場面を 作れなかった'); return; }
      rebuild(); placeAll(true); refreshDim();
      var h1 = g.hands[0].length;
      if (!pressDeck()) { out.why.push('★★試し方が おかしい：★（くらべ）山札に 押す ものが 無い'); return; }
      out.no = (g.hands[0].length > h1) ? '○ 引けた' : '★★✕ 引けない';
      if (g.hands[0].length <= h1) out.why.push('★★試し方が おかしい：★出せない のに 山札から 引けない');
      out.noSay = shaken() ? '★★✕ ゆれて しまう' : '○ ゆれない';
      if (shaken()) {
        out.why.push('★★★引けた のに ゆれた（★★いつも ゆれて いる ＝ 返事に なって いません）');
      }

      /* ★ (c) ★★山札 0枚（空の わく）＋ 出せる とき ―― ★まぜ直しも 起きない */
      reset();
      if (!makeCanPlay()) { out.why.push('★★試し方が おかしい：★（空の わく）場面を 作れなかった'); return; }
      g.hands[g.nP - 1] = g.hands[g.nP - 1].concat(g.deck);   /* ★ 52枚 きっちり 保った まま 山を 空に する */
      g.deck = [];
      rebuild(); placeAll(true); refreshDim();
      var m2 = g.mixes, p2 = g.pile.length, h2 = g.hands[0].length;
      var e3 = pressDeck();
      if (!e3) { out.why.push('★★試し方が おかしい：★空の わくに 押す ものが 無い'); return; }
      out.empty = (g.mixes === m2 && g.pile.length === p2 && g.hands[0].length === h2 && !g.deck.length)
                  ? '○ 引けない・まぜ直し 0' : '★★✕ 動いた';
      if (out.empty !== '○ 引けない・まぜ直し 0') {
        out.why.push('★★★山札 0枚で 押したら、★出せる のに まぜ直し／引きが 起きた（★追記④）');
      }
      out.emptySay = e3.classList.contains('is-no') ? '○ ぷるっと 返した' : '★★✕ 何も 返さない';
      if (!e3.classList.contains('is-no')) {
        out.why.push('★★★山札 0枚の「空の わく」を 押しても、★画面が 1つも 返事を しない');
      }
      if (!e3.classList.contains('is-slot')) {
        out.why.push('★★試し方が おかしい：★空の わくを 押せて いない（★札を 押して います）');
      }
      out.ok = 1;
    });

    /* ★ 片づけ ―― ★この 見張りが 作った 待ち時間だけ 消して、★元の 試合に もどします */
    for (var t = timers.length - 1; t >= tMark; t--) { clearTimeout(timers[t]); timers.splice(t, 1); }
    var a2 = cardsEl.querySelectorAll('.card.is-no');
    for (var i2 = 0; i2 < a2.length; i2++) a2[i2].classList.remove('is-no');
    restoreG(snap);
    g.mixes = kMix;
    busy = kBusy; over = kOver; takeLeft = kTake; waitSuit = kWait;
    if (kResult) resultWrap.classList.add('hidden'); else resultWrap.classList.remove('hidden');
    if (kSay) sayEl.classList.add('hidden'); else sayEl.classList.remove('hidden');
    rebuild(); placeAll(true); refreshDim();
    return out;
  }

  /* ============================================================
     ★★★ verify ―― この 1本ならではの 見張り ★★★
     ------------------------------------------------------------
       ①  ルールの 通り（反則0・詰まり0・★★終わらない 0件・札が 52枚 きっちり）
       ②  ★★止まらない 試合の 直しが **生きて いる**（★わざと 外したら 出る ことも 見る）
       ③  ★★8の マーク選びを 自動化して いない（★本物の playHuman ＋ 1行ずつ 走査）
       ④  ★★強調は 1種類 ―― ★光り 0個／★暗くする 決まりが CSS に 1行 ある
       ⑤  ★★暗くするのは「自分の 番・自分の 手札・出せない 札」だけ（★本物の refreshDim）
       ⑥  ★★勝手に 引かない（★doDraw を 呼ぶ 行を 走査）
       ⑦  ★★設定 ―― ★<select> 0個／○✕ 5個／初期値は 8だけ ON／まとめ選び 0個
       ⑧  ★寸法が 表どおり（★320×568 を 必ず 含む）
       ⑨  ★先読み 53枚・白い 札 0枚・JOKER を 読まない・裏面が 先頭
       ⑩  ★操作は pointer（click では ない）＋ はなすまで 決まらない
       ⑪  ★結果の 箱が 手札に かぶらない
       ⑫  ★言っては いけない 言葉が 無い
       ⑬  ★手札の 枠が 7枚ぶん ある・28枚でも 器から 出ない
       ⑭  ★★★人が さわれるか（T155）―― ★★「押す ものが 1つも ない」画面が 作れないか
       ⑮  ★★★マーク板を 出した ままの 画面（T155）―― ★4つの ボタンが 画面の 中に あるか
       ⑯  ★★★押して・すべらせて・はなす（T157）―― ★★指の くっつきを 本物の 道で 通す
       ⑰  ★★★出なかった ときの 返事（T160）―― ★★すべって 外したら「ぷるっ」と 返すか
           ★ ★くらべ：★まっすぐ 押して 通った ときは **ゆれない**（★いつも ゆれる のは 返事では ない）
       ⑱  ★★★○✕ の 5行が ぜんぶ 押せるか（T160）―― ★★320×568・横向きを 含む
       ⑲  ★★★山札を まっすぐ 押した ときの 返事（T161）―― ★★引かずに「ぷるっ」と 返すか
           ★ ★くらべ：★出せない ときは **引けて・ゆれない**（★いつも ゆれる のは 返事では ない）
           ★ ★線：★★手札の 明るさを 1枚も 変えない・★ひとことも 出さない（★遊びの 情報を 足さない）
     ============================================================ */
  function verify(n) {
    n = n || 3000;
    var ng = [], t0 = Date.now(), note = {};
    var R8 = { eight: 1, jack: 0, two: 0, queen: 0, ace: 0 };
    var RALL = { eight: 1, jack: 1, two: 1, queen: 1, ace: 1 };
    var RNONE = { eight: 0, jack: 0, two: 0, queen: 0, ace: 0 };

    /* ① ルールの 通り（★3つの 形 ぜんぶ）*/
    var tot = { nofin: 0, stuck: 0, illegal: 0, cardsBad: 0 }, txt = [];
    [['8だけ', R8], ['ぜんぶ OFF', RNONE], ['ぜんぶ ON', RALL]].forEach(function (a) {
      var st = C.runMany(n, 31337, { rules: a[1], levels: [3, 3, 3, 3] });
      tot.nofin += st.nofin; tot.stuck += st.stuck; tot.illegal += st.illegal; tot.cardsBad += st.cardsBad;
      txt.push(a[0] + ' 終わらない ' + st.nofin + '／山切れ ' + (st.mixCap / n * 100).toFixed(2) + '%');
    });
    if (tot.illegal) ng.push('反則の 手が ' + tot.illegal + '件');
    if (tot.stuck) ng.push('★★引く 札が 無くて 詰まった 試合が ' + tot.stuck + '件');
    if (tot.nofin) ng.push('★★★終わらない 試合が ' + tot.nofin + '件（★0件で なければ なりません）');
    if (tot.cardsBad) ng.push('★札が 52枚で ない 試合が ' + tot.cardsBad + '件');
    note['① ' + (n * 3) + '試合'] = txt.join('／');

    /* ============================================================
       ② ★★★止まらない 試合の 直しが 生きて いるか ★★★
       ------------------------------------------------------------
       ⚠️★ ① だけだと ―― ★★直しを まるごと 外しても、★たまたま 出なければ 通ります。
          ★★T144 §7-4 と 同じ わな（★「無い こと」を 数えるだけの 見張り）。
       ★ だから ★**わざと 外して、★ちゃんと 出る ことも 見ます。**
       ★ ★LIM.LOW を 0 に すると「まぜ直しても 山が 空に 近い」で 止められなく なります。
       ============================================================ */
    var keepMix = C.LIM.MIX, keepPly = C.LIM.PLY;
    C.LIM.MIX = 1e9; C.LIM.PLY = 600;
    var broke = C.runMany(8000, 4649, { rules: R8, levels: [3, 3, 3, 3] });
    C.LIM.MIX = keepMix; C.LIM.PLY = keepPly;
    if (!broke.nofin) {
      ng.push('★★直しを 外しても 終わらない 試合が 出なかった ―― ★試し方が おかしい か、直しが 別の 所に ある');
    }
    var fixed = C.runMany(8000, 4649, { rules: R8, levels: [3, 3, 3, 3] });
    if (fixed.nofin) ng.push('★★同じ 種で、直した はずの 側に 終わらない 試合が ' + fixed.nofin + '件');
    if (C.LIM.MIX !== 24) ng.push('★まぜ直しの 上限が ' + C.LIM.MIX + '回（★24回 の はず）');
    note['② 止まらない 試合'] = '直しを 外すと ' + broke.nofin + '件 → ★直すと ' + fixed.nofin + '件（各8000試合・同じ 種）';

    /* ============================================================
       ③ ★★★8の マーク選びを 自動化して いない ★★★
       ------------------------------------------------------------
       ★ ルル §1-3：★「8を ためる」+5.2 と「マークを 選ぶ」+0.8 は **かけ算**（+7.6）。
         ★★ ここを 機械が やったら、★★この 1本の 遊びは 半分 消えます。
       ★ 2つの 目で 見ます ―― ★①本物を 通す ②1行ずつ 走査する。
       ============================================================ */
    var ep = eightProbe();
    if (!ep.asked) ng.push('★★★8を 出したのに「マークを 選ぶ」で 止まらなかった');
    if (ep.played) ng.push('★★★8を、マークを 聞かずに 出して しまった');
    if (ep.autoSuit) ng.push('★★★8の マークが 勝手に 決まった');
    /* ★ 1行ずつ 走査 ―― ★人の 番の 道すじに、★マークを 決める 行が 1つも 無いか */
    var humanSrc = String(playHuman) + '\n' + String(finishPlay) + '\n' + String(onSuitPick) + '\n' + String(onUp);
    var peek = humanSrc.match(/bestSuit|suitAfter|botChoose/g);
    if (peek) ng.push('★★★人の 番で マークを 決めて いる：' + peek.join('・'));
    /* ★ core 側 ―― ★playCard が 自分で マークを 決めて いないか */
    var coreSrc = String(C.playCard);
    if (/bestSuit|suitAfter|botChoose/.test(coreSrc)) {
      ng.push('★★★core の playCard が 自分で マークを 決めて いる');
    }
    if (coreSrc.indexOf('suit') < 0) ng.push('★core の playCard が マークを 受け取って いない');
    /* ★ 4つの ボタンは 本当に 4つ か */
    var sb = suitPick.querySelectorAll('.suit-btn');
    if (sb.length !== 4) ng.push('★マークの ボタンが ' + sb.length + '個（★4つ の はず）');
    note['③ 8の マーク'] = '本物を 通して 止まった ' + (ep.asked ? '○' : '✕') + '／ボタン ' + sb.length + '個';

    /* ============================================================
       ④ ★★強調は 1種類まで（設計図 §5.5）★★
       ------------------------------------------------------------
       ★ ページワンの 強調は ★**「出せない 札を 暗くする」1種類だけ**（ルル §8-a）。
       ★ ★光り（ぼかしの 影・わく・色の 反転）は 1つも 作りません。
       ★ ★そして ―― ★**暗くする 決まりが CSS から 消えても 鳴る** ように 逆も 見ます。
       ============================================================ */
    var css = cssRulesText();
    var lit = document.querySelectorAll('.is-win,.is-hint,.is-glow,.is-here,.is-ok,.is-edge');
    if (lit.length) ng.push('★光って いる ものが ' + lit.length + '個 ある');
    var litSrc = String(placeAll) + '\n' + String(putAt) + '\n' + String(refreshDim) + '\n' +
                 String(makeCard) + '\n' + String(faceUp) + '\n' + String(botStep) + '\n' +
                 String(finishPlay) + '\n' + String(doDraw) + '\n' + String(turnStart) + '\n' +
                 String(paintSuitNow) + '\n' + String(layout);
    var litAdd = litSrc.match(/is-win|is-hint|is-glow|is-here|is-ok|is-edge/g);
    if (litAdd) ng.push('★★遊びの 情報を 出す 光りを 付ける 行が ある：' + litAdd.join('・'));
    var litCss = css.match(/\.is-(win|hint|glow|here|ok|edge)\b/g);
    if (litCss) ng.push('★★遊びの 情報を 出す 光りの 決まりが CSS に ある：' + litCss.join('・'));
    /* ★★ 札に「ぼかしの 影」＝ 光り を 書いて いないか ★★
       ⚠️★ はじめ、ここは 文字の かたちで 見て いました（`/0px 0px \d+px [1-9]/` など）。
          ★★ わざと 光りを 足したのに **鳴りませんでした**【T152・私の 失敗】。
          ★ 原因：★ブラウザは box-shadow を 書きなおして 返します ――
            ★ 書いたのは `0 0 12px 4px #ff0`、★返って きたのは `rgb(255,255,0) 0px 0px 12px 4px`。
            ★★**色が 先頭に 来る**ので、文字の かたち では 当たりませんでした。
       ★ → ★**長さ（px）だけを 取り出して 数で 見る** ように 直しました。★順番が 変わっても 効きます。
         ★ box-shadow ＝ よこ・たて・ぼかし・広がり の 4つ。
         ★ ★ぼかし 6px 以上／広がり 2px 以上 は「光り」と 見なします。
         ★ ★ふつうの 影（0 1px 2px ／ 0 2px 0）は そのまま 通ります。 */
    var glowSel = [];
    cssRuleList().forEach(function (r) {
      if (!/\.card/.test(r.sel)) return;
      var m = r.text.match(/box-shadow:([^;}]*)/);
      if (!m) return;
      /* ★ 色（rgb()/rgba()）を 先に 取りのぞく ―― ★中の カンマで 切れない ように（T155 で 足しました）*/
      m[1].replace(/\b(?:rgba?|hsla?)\([^)]*\)/g, ' ').split(',').forEach(function (one) {
        if (/inset/.test(one)) return;
        var nums = (one.match(/-?\d+(?:\.\d+)?px/g) || []).map(parseFloat);
        if (nums.length < 3) return;
        if (nums[2] >= 6 || (nums.length >= 4 && nums[3] >= 2)) glowSel.push(r.sel);
      });
    });
    if (glowSel.length) ng.push('★★札に 光りが ある：' + glowSel.join('・'));
    /* ★ 逆の 見張り ―― ★暗くする 決まりが CSS に 無い なら 鳴らす */
    if (!/\.card\.is-dim(?![\w-])/.test(css)) ng.push('★★「出せない 札を 暗くする」決まりが CSS に 1行も 無い');
    /* ★ 札に 指を 置いたら 変わる 決まりは 作らない（★指の 端末では こびりつく）*/
    var bad4 = css.match(/\.(card|cards|zone)[^{,]*:hover/g);
    if (bad4) ng.push('★札の 部品に 指を 置くと 変わる 決まりが ある：' + bad4.join('・'));

    /* ⑤ ★★暗くするのは「自分の 番・自分の 手札・出せない 札」だけ ★★ */
    var dp = dimProbe();
    if (!dp.worked) ng.push('★★「暗くする」が 1枚も 効いて いない（★試し方が おかしい／★機能が 死んで いる）');
    if (dp.wrong) ng.push('★★暗い／明るいが 逆の 札が ' + dp.wrong + '枚 ある');
    if (dp.notMe) ng.push('★★自分の 手札 いがいが ' + dp.notMe + '枚 暗く なって いる');
    if (dp.botTurn) ng.push('★★ロボットの 番なのに ' + dp.botTurn + '枚 暗い');
    if (dp.busyOn) ng.push('★★動いて いる 途中なのに ' + dp.busyOn + '枚 暗い');
    if (dp.overOn) ng.push('★★終わった あとなのに ' + dp.overOn + '枚 暗い');
    note['④⑤ 強調'] = '光り ' + lit.length + '個／★暗い 札 ' + dp.onMe + '枚（ロボットの 番 ' + dp.botTurn +
                       '・動作中 ' + dp.busyOn + '・自分の 手札の 外 ' + dp.notMe + '）';

    /* ============================================================
       ⑥ ★★勝手に 引かない（設計図 追記④）★★
       ★ doDraw を 呼ぶ 所が「山札を はなした とき」だけ か。
       ★ ★ロボットの 番の 引きは core の drawOne を 直に 呼ぶ ので、ここには 出ません。
       ============================================================ */
    var drawCallers = [];
    [['onUp', onUp], ['onDown', onDown], ['turnStart', turnStart], ['newGame', newGame],
     ['placeAll', placeAll], ['refreshDim', refreshDim], ['botStep', botStep],
     ['finishPlay', finishPlay], ['afterTurn', afterTurn], ['layout', layout]].forEach(function (a) {
      if (String(a[1]).indexOf('doDraw(') >= 0) drawCallers.push(a[0]);
    });
    if (drawCallers.length !== 1 || drawCallers[0] !== 'onUp') {
      ng.push('★★doDraw を 呼んで いる 所が ' + (drawCallers.join('・') || 'どこにも ない') + '（★onUp だけ の はず）');
    }
    if (String(onDown).indexOf('doDraw') >= 0) ng.push('★★指を 置いた 時点で 引いて いる（★はなすまで 決まらない はず）');
    if (String(doDraw).indexOf('canPlay') < 0) ng.push('★出せる ときでも 引けて しまう');
    note['⑥ 引く'] = 'doDraw を 呼ぶ 所 … ' + drawCallers.join('・');

    /* ⑦ ★★設定（★2本目の 例外・ただし まとめ選びは 作らない）★★ */
    var sel = document.querySelectorAll('select');
    if (sel.length) ng.push('★★<select> が ' + sel.length + '個 ある（★つよさも 速さも 選ばせません）');
    var boxes = titleScreen.querySelectorAll('input[type="checkbox"][data-rule]');
    if (boxes.length !== 5) ng.push('★特別な 札の ○✕ が ' + boxes.length + '個（★5つ の はず）');
    var pre = titleScreen.querySelectorAll('.preset,[data-preset]');
    if (pre.length) ng.push('★★まとめ選び（かんたん／ふつう／ぜんぶ）が ' + pre.length + '個 ある（★大富豪だけの もの）');
    var d0 = C.defaultRules();
    if (!(d0.eight && !d0.jack && !d0.two && !d0.queen && !d0.ace)) {
      ng.push('★★初期値が「8だけ ON」に なって いない');
    }
    var onNow = 0;
    for (var b1 = 0; b1 < boxes.length; b1++) if (boxes[b1].checked) onNow++;
    note['⑦ 設定'] = '<select> ' + sel.length + '個／○✕ ' + boxes.length + '個（今 ' + onNow +
                     '個 ON）／まとめ選び ' + pre.length + '個';

    /* ============================================================
       ⑱ ★★★○✕ の 5行が **ぜんぶ 押せるか**（T160・トライ T153 🟡-2 / T159 判断4）★★★
       ------------------------------------------------------------
       ⚠️★ ⑦ は「★○✕ が 5つ ある」までしか 見て いませんでした。
          ★ ★★**その 5つに 指が 届くか**を、★1度も 見て いません。
          ★ ★T153・T159 の 実測：★320×568 で 5行目「A＝もう1回」が **押せない**
            （★白い 箱の 下ばしで 切れ、★★スクロールでも 届かない）。★横向きでは 4行が 届かない。
       ★ ★ここでは 数えるのでは なく ―― ★★**1行ずつ 実際に さして 確かめます**：
         ★ ①その 行を 見える ところへ 送る（scrollIntoView）
         ★ ②まん中の 点が **画面の 中**に あるか
         ★ ③その 点を さすと ★★**本当に その 行が 返るか**（elementFromPoint）
         ★ ④たてが **44px 以上**か（★この 会社の 決まり）
       ★ ★見て いる 間だけ はじめの 画面を 出し、★★状態は 1つ 残らず 元に もどします。
       ============================================================ */
    var rf = document.getElementById('ruleFold');
    var r18 = { rows: 0, ok: 0, ng: [], small: 0 };
    if (rf) {
      var kTitleHid = titleScreen.classList.contains('hidden');
      var kPlayHid = playScreen.classList.contains('hidden');
      var kOpen = rf.open, kTop = titleScreen.scrollTop;
      titleScreen.classList.remove('hidden');
      playScreen.classList.add('hidden');
      rf.open = true;
      void titleScreen.offsetWidth;
      var rrs = titleScreen.querySelectorAll('.rule-row');
      r18.rows = rrs.length;
      /* ⚠️★★★ ここは **`scrollIntoView` を 使っては いけません**（★T160 で 私が やらかした ところ）
         ★ ★`scrollIntoView` は「★動かせる 入れ物」を **上から ぜんぶ** 動かします。
         ★ ★★`.rule-fold` は 角丸の ために `overflow:hidden` ―― ★★**人は 指で 動かせません。**
           ★ ★でも 中身は 動かせて しまう ので、★★**人が 届かない 行を「届いた」と 数えます。**
         ★ ★★実測（T160・わざと 壊した ④⑤⑥）：★scrollIntoView だと **3通りとも 鳴りませんでした。**
         ★ ★→ ★★**人が 本当に 動かせる 入れ物（`.title-screen`）だけ**を 動かして 測ります。 */
      var tsBox = titleScreen.getBoundingClientRect();
      var maxTop = Math.max(0, titleScreen.scrollHeight - titleScreen.clientHeight);
      for (var i18 = 0; i18 < rrs.length; i18++) {
        var rr = rrs[i18];
        rf.scrollTop = 0;                            /* ★ 人が 動かせない ところは 0 の まま */
        var rl18 = rf.querySelector('.rule-list'); if (rl18) rl18.scrollTop = 0;
        var b0 = rr.getBoundingClientRect();
        var mid = (b0.top - tsBox.top) + titleScreen.scrollTop + b0.height / 2;   /* ★ 中身の 中での 位置 */
        var want = mid - titleScreen.clientHeight / 2;
        titleScreen.scrollTop = Math.max(0, Math.min(maxTop, want));
        var bb = rr.getBoundingClientRect();
        var cx18 = Math.round(bb.left + bb.width / 2), cy18 = Math.round(bb.top + bb.height / 2);
        var nm18 = ((rr.querySelector('.rule-name') || {}).textContent || ('' + (i18 + 1) + '行目')).trim();
        var inV = (cy18 >= 0 && cy18 <= window.innerHeight && cx18 >= 0 && cx18 <= window.innerWidth);
        var hit18 = inV ? document.elementFromPoint(cx18, cy18) : null;
        var mine = !!(hit18 && hit18.closest && hit18.closest('.rule-row') === rr);
        if (inV && mine) r18.ok++; else r18.ng.push(nm18);
        if (bb.height < 44) r18.small++;
      }
      /* ⚠️★★ もう 1つの 目 ―― ★★**はみ出しが「上」に 出て いないか**
         ★ ★行が 5つとも 押せても、★★`justify-content:center` の ままだと
           ★ ★はみ出しは **上下に 半分ずつ** 出ます。★★上に 出た ぶんは scrollTop を
           ★ ★マイナスに できない ので、★★**どうやっても 届きません**（★ハッピーが 消えます）。
         ★ ★→ ★★いちばん 上まで 送って「上が 切れて いないか」、
           ★ ★★いちばん 下まで 送って「下が 切れて いないか」を 見ます。 */
      titleScreen.scrollTop = 0;
      var tsA = titleScreen.getBoundingClientRect();
      var f18 = titleScreen.firstElementChild, l18 = titleScreen.lastElementChild;
      r18.cutTop = f18 ? Math.round(tsA.top - f18.getBoundingClientRect().top) : 0;
      titleScreen.scrollTop = Math.max(0, titleScreen.scrollHeight - titleScreen.clientHeight);
      var tsB = titleScreen.getBoundingClientRect();
      r18.cutBottom = l18 ? Math.round(l18.getBoundingClientRect().bottom - tsB.bottom) : 0;

      titleScreen.scrollTop = kTop;
      rf.open = kOpen;
      if (kTitleHid) titleScreen.classList.add('hidden');
      if (!kPlayHid) playScreen.classList.remove('hidden');
      void document.body.offsetWidth;              /* ★ 元の 形に もどして から 次の 見張りへ */
    }
    if (!rf) ng.push('★特別な 札の ○✕ の 箱（#ruleFold）が ない');
    else if (r18.ng.length) {
      ng.push('★★★○✕ の 中に 押せない 行が ' + r18.ng.length + '行 ある：' + r18.ng.join('・') +
              '（★★スクロールしても 届きません）');
    }
    if (r18.small) ng.push('★○✕ の 行が 44px より 低い：' + r18.small + '行');
    if (r18.cutTop > 1) {
      ng.push('★★はじめの 画面の **上が ' + r18.cutTop + 'px 切れて、★どうやっても 届かない**' +
              '（★いちばん 上まで 送っても 出て きません）');
    }
    if (r18.cutBottom > 1) {
      ng.push('★★はじめの 画面の **下が ' + r18.cutBottom + 'px 切れて、★どうやっても 届かない**');
    }
    note['⑱ ★○✕ の 5行'] = '押せた ' + r18.ok + ' / ' + r18.rows + '行' +
                            (r18.ng.length ? '（★届かない：' + r18.ng.join('・') + '）' : '') +
                            '／44px 割れ ' + r18.small + '行' +
                            '／届かない 上 ' + (r18.cutTop > 0 ? r18.cutTop : 0) + 'px・下 ' +
                            (r18.cutBottom > 0 ? r18.cutBottom : 0) + 'px';

    /* ⑧ ★寸法 */
    var want = [[1504, 901, 100, '1512×945'], [992, 856, 100, '1000×900'], [367, 623, 49, '375×667'],
                [312, 524, 42, '★320×568'], [804, 331, 72, '横向き 812×375']];
    var sizeTxt = [];
    for (var i8 = 0; i8 < want.length; i8++) {
      var f = C.pickLayout(want[i8][0], want[i8][1]);
      sizeTxt.push(want[i8][3] + ' ' + f.w + 'px');
      if (f.w !== want[i8][2]) ng.push('★寸法が ちがう（' + want[i8][3] + '：' + f.w + 'px ／ 表 ' + want[i8][2] + 'px）');
    }
    note['⑧ 寸法'] = sizeTxt.join('／');

    /* ⑨ ★先読み */
    var white = 0, faceShown = 0;
    for (var id in cardEl) {
      if (!cardEl.hasOwnProperty(id)) continue;
      var e = cardEl[id];
      if (!e.parentNode || e.classList.contains('is-down')) continue;
      faceShown++;
      var fi = e.faceImg;
      if (!(fi.complete && fi.naturalWidth > 0) && !e.querySelector('.fallback')) white++;
    }
    if (white) ng.push('★★表向きなのに 絵が 出て いない 札が ' + white + '枚（★大富豪 T120 の 2段階表示）');
    if (warmDone + warmErr < ALL_NAMES.length && !warmQueue.length && !warmRun) {
      ng.push('★★先読みが 動いて いない（読めた ' + warmDone + ' / ' + ALL_NAMES.length + '・待ち 0）');
    }
    if (warmErr) ng.push('★読めなかった 絵が ' + warmErr + '個 ある');
    if (ALL_NAMES.length !== 53) ng.push('★読む 絵が ' + ALL_NAMES.length + '個（★53個 の はず）');
    if (ALL_NAMES.join(' ').indexOf('JOKER') >= 0) ng.push('★使わない JOKER を 読んで いる');
    if (ALL_NAMES[0] !== C.BACK_NAME) ng.push('★裏面を いちばん 先に 読んで いない');
    note['⑨ 先読み'] = '読めた ' + warmDone + '/' + ALL_NAMES.length + '／表向き ' + faceShown + '枚 中 白い 札 ' + white + '枚';

    /* ⑩ ★操作は pointer・はなすまで 決まらない */
    if (String(build).indexOf("'click'") >= 0 && String(build).indexOf('suit-btn') < 0) {
      ng.push('★手札を click で 受けて いる（★pointer で 受けること）');
    }
    if (String(build).indexOf('pointerdown') < 0 || String(build).indexOf('pointerup') < 0) {
      ng.push('★pointer で 受けて いない');
    }
    if (String(onUp).indexOf('pressId') < 0) ng.push('★押した 札と はなした 札を くらべて いない');

    /* ⑪ ★結果の 箱 */
    var bx = resultProbe();
    if (bx.tall) ng.push('★結果の 箱が ' + bx.tall + 'px（★100px 以下に すること）');
    if (bx.over) ng.push('★★結果の 箱が 手札に かぶって いる（' + bx.over + 'px）');
    note['⑪ 結果の 箱'] = bx.h + 'px（天井 ' + bx.max + 'px）／手札との かぶり ' + (bx.over || 0) + 'px';

    /* ⑫ ★言葉（設計図 §9.6）*/
    var text = readableText(document.querySelector('.app-shell')) + ' ' +
               readableText(resultWrap) + ' ' + readableText($('helpDialog')) + ' ' + document.title;
    var NGW = ['スート', 'ワイルド', 'シャッフル', 'カード', 'ドロー', 'パス', 'ターン', 'レベル',
               'つよさ', 'むずかしさ', 'ジョーカー', 'JOKER', 'ms', 'ポイント', '％'];
    var hitW = [];
    for (var i12 = 0; i12 < NGW.length; i12++) if (text.indexOf(NGW[i12]) >= 0) hitW.push(NGW[i12]);
    if (hitW.length) ng.push('★言っては いけない 言葉が ある：' + hitW.join('・'));
    /* ★★ 手を 教えて いないか ―― ★ハッピーが 言う ことば ぜんぶ を 見る（ルル §11）★★ */
    var sayAll = [];
    for (var k1 in SAY) if (SAY.hasOwnProperty(k1)) sayAll.push(SAY[k1]);
    sayAll.push(SAY_WIN, SAY_LOSE, SAY_SHORT);
    var teach = sayAll.join(' ').match(/取って おこう|ためて|残して おこう|おすすめ|この 札を|8は 最後/g);
    if (teach) ng.push('★★★ハッピーが 手を 教えて いる：' + teach.join('・'));
    var helpTeach = readableText($('helpDialog')).match(/取って おこう|ためて|8は 最後|おすすめ/g);
    if (helpTeach) ng.push('★★★あそびかたが 手を 教えて いる：' + helpTeach.join('・'));
    if (readableText(cardsEl).length) ng.push('★手札の 上に 文字が ある（' + readableText(cardsEl).length + '文字）');
    note['⑫ 言葉'] = text.length + '文字／★手を 教える 言葉 ' + ((teach || []).length + (helpTeach || []).length) + '件';

    /* ⑬ ★手札の 枠・はみ出し */
    var lay = C.pickLayout(geo.W, geo.H);
    var needW = C.FIT.HAND_BASE * lay.w + (C.FIT.HAND_BASE - 1) * lay.g;
    if (needW > geo.W) ng.push('★7枚 ならべると よこに ' + (needW - geo.W) + 'px はみ出す');
    var ft = fitTest(60);
    if (ft['★はみ出し（一番 大きい）'] !== '0px') ng.push('★★札が 器から ' + ft['★はみ出し（一番 大きい）'] + ' はみ出した');
    if (ft['★押す ところが 画面外'] !== '0件') ng.push('★★押す ところが 画面の 外に 出た：' + ft['★押す ところが 画面外']);
    if (ft['横スクロールが 出た場面']) ng.push('★横スクロールが ' + ft['横スクロールが 出た場面'] + '場面で 出た');
    if (ft['縦スクロールが 出た場面']) ng.push('★縦スクロールが ' + ft['縦スクロールが 出た場面'] + '場面で 出た');
    note['⑬ 手札の 枠'] = C.FIT.HAND_BASE + '枚ぶん ＝ よこ ' + needW + 'px（器 ' + geo.W + 'px）／はみ出し ' +
                          ft['★はみ出し（一番 大きい）'];

    /* ============================================================
       ⑭ ★★★人が さわれるか（T155・🔴-1 の 見張り）★★★
       ★ ★ここだけは 数えるのでは なく ―― ★★**本物の 指の 道を 通して** 見ます。
       ============================================================ */
    var rp = reachProbe();
    if (!rp.cases) {
      ng.push('★★「人が さわれるか」を 1場面も 作れなかった（★試し方が おかしい）');
    }
    for (var i14 = 0; i14 < rp.why.length; i14++) {
      ng.push('★★★人の 番なのに 進めない：' + rp.why[i14]);
    }
    note['⑭ ★人が さわれるか'] = rp.cases + '場面 中 ★止まった ' + rp.dead + '場面／' + rp.detail.join('　');

    /* ⑮ ★★マーク板を 出した ままの 画面（T155・🔴-2 の 見張り）★★ */
    var pf = pickFitProbe();
    if (String(layout).indexOf('placeSuitPick') < 0) {
      ng.push('★★★画面が 変わっても マーク板を 置き直して いない（★layout の 中に placeSuitPick が ない）');
    }
    if (!pf.relaid) {
      ng.push('★★★マーク板が 画面の 外に 置き去りに なった（★画面が 変わっても 置き直して いない）');
    }
    if (pf.btnOff) {
      ng.push('★★★マーク板を 出した まま だと、マークの ボタンが ' + pf.btnOff +
              '個 画面の 外（板の 下ばし ' + pf.bottom + 'px ／ 画面の たて ' + pf.VH + 'px）');
    }
    if (pf.off) {
      ng.push('★★マーク板を 出した ままの 画面で、押す ところが ' + pf.off + '件 画面の 外');
    }
    note['⑮ ★マーク板を 出した まま'] = '板 ' + pf.top + '〜' + pf.bottom + 'px（画面の たて ' + pf.VH +
                                        'px）／置き直した ' + (pf.relaid ? '○' : '★✕') +
                                        '／画面外の ボタン ' + pf.btnOff + '個・押す ところ ' + pf.off + '件';

    /* ============================================================
       ⑯ ★★★押して・すべらせて・はなす（T157・🟡 の 見張り）★★★
       ★ ★ここも 数えるのでは なく ―― ★★**指の くっつきを そのまま 作って 通します。**
       ============================================================ */
    var sp = slideProbe();
    for (var i16 = 0; i16 < sp.why.length; i16++) ng.push(sp.why[i16]);
    /* ★ 2つ目の 目 ―― ★onUp が「はなした 点」で 引き直して いるか（★行を 走査）*/
    if (String(onUp).indexOf('hitAt(') < 0) {
      ng.push('★★★onUp が はなした 点で 札を 引き直して いない（★hitAt が ない）');
    }
    if (/var\s+t\s*=\s*e\.target/.test(String(onUp))) {
      ng.push('★★★onUp が e.target を 見て いる（★指では 押した 札の まま に なります）');
    }
    /* ★★ ⑰ の 3つ目の 目（T160）―― ★onUp が「ちがう 札だった とき」に 返事を 呼んで いるか。
       ★ ★動きの 測り（sp.say）だけでも 見つかりますが、★★行でも 見て おきます
         （★★2つの 目で 見る ―― ★T157 §4 と 同じ 作法）。 */
    var upSrc = String(onUp), upCut = upSrc.indexOf('var where');
    if (upCut < 0 || !/nope\s*\(/.test(upSrc.slice(0, upCut))) {
      ng.push('★★★onUp の「すべって 外した」ところに 返事が ない（★nope を 呼んで いません）');
    }
    note['⑯ ★すべらせて はなす'] = 'まっすぐ ' + sp.straight + '／★指で すべらせる ' + sp.stuck +
                                    '／マウスで すべらせる ' + sp.mouse;
    note['⑰ ★★出なかった ときの 返事'] = 'まっすぐ 出た とき ' + sp.sayStraight +
                                    '／★★指で すべった とき ' + sp.say +
                                    '／マウスで すべった とき ' + sp.sayMouse;

    /* ============================================================
       ⑲ ★★★山札を まっすぐ 押した ときの 返事（T161）★★★
       ★ ★動きの 目（本物の 道を 3通り 通す）＋ ★行の 目（2つ）―― ★T157 §4 と 同じ 作法。
       ============================================================ */
    var dp = deckProbe();
    for (var i19 = 0; i19 < dp.why.length; i19++) ng.push(dp.why[i19]);
    /* ★ 行の 目 ① ―― ★onUp の 山札の ところが「引けなかった とき」に 返事を 呼んで いるか */
    var upSrc2 = String(onUp);
    if (!/where\s*===\s*'deck'[\s\S]{0,80}?nope\s*\(/.test(upSrc2)) {
      ng.push('★★★onUp の 山札の ところに 返事が ない（★nope を 呼んで いません）');
    }
    /* ★ 行の 目 ② ―― ★doDraw が「引けたか」を 返して いるか（★返さないと onUp が 見分けられない）*/
    var drawSrc = String(doDraw);
    if (!/return\s+false\s*;/.test(drawSrc) || !/return\s+true\s*;/.test(drawSrc)) {
      ng.push('★★★doDraw が「引けたか」を 返して いない（★true／false の どちらかが ありません）');
    }
    note['⑲ ★★山札の 返事'] = '★出せる とき ' + dp.can + '・' + dp.canSay + '（ゆれた ' + dp.shakes + '／' + dp.see + '）' +
                              '／★くらべ 出せない とき ' + dp.no + '・' + dp.noSay +
                              '／★空の わく ' + dp.empty + '・' + dp.emptySay +
                              '／★★線：明るさ ' + dp.dimSame + '（明るい 札 ' + dp.bright + '枚）・ひとこと ' + dp.said;

    var out = {
      '★NG': ng.length, '中身': ng.length ? ng : 'ぜんぶ OK ✅',
      '画面': window.innerWidth + '×' + window.innerHeight,
      'かかった 時間': (Date.now() - t0) + 'ms'
    };
    for (var k in note) if (note.hasOwnProperty(k)) out[k] = note[k];
    console.log('[ページワン] verify', out);
    return out;
  }

  function resultProbe() {
    return still(function () {
      var keep = resultWrap.classList.contains('hidden');
      resultWrap.classList.remove('hidden');
      var box = resultBox.getBoundingClientRect();
      var st = stageEl.getBoundingClientRect();
      var meTop = st.top + geo.meTop;
      var over = Math.max(0, Math.round(box.bottom - meTop));
      var max = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--result-max'), 10) || 0;
      if (keep) resultWrap.classList.add('hidden');
      return { h: Math.round(box.height), max: max,
               tall: box.height > 100.5 ? Math.round(box.height) : 0,
               over: over };
    });
  }

  root.PAGEONE = {
    now: now, autoPlay: autoPlay, verify: verify, seed: seed, geo: geoInfo,
    fitTest: fitTest, rates: rates,
    /* ★ 中を のぞく ため（★トライ・アト用）*/
    _g: function () { return g; }, _core: C, _rules: function () { return rules; }
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
