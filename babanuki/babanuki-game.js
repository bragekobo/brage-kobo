/* ============================================================
   ババ抜き ― 画面（T144・コーダ）
   ------------------------------------------------------------
   ★ ルールと ロボットは babanuki-core.js に あります。
     ★ ここには ルールが 1行も ありません（★勝ち負けの 決め方も core が 返します）。
     ★ ＝ 数える 側（Node）と 遊ぶ 側（画面）が ズレようが ない。

   ★★★ この 1本の 命 ―― 「追える形」を 画面で どう 作ったか ★★★
     ------------------------------------------------------------
     ★ 札は ぜんぶ **1つの 板（.cards）の 上**に います。
       ★ 手札から 手札へ 移る ときも、★★同じ 1枚が 場所を 変える だけ です。
       ★ 場所は CSS の うつり変わり（transition）で 動く ので、
         ★★「さっき 取られた 札が いま どこに あるか」が 目で 追えます。
     ★ ロボットの 手札に 入る 札は、★★いつも **右はし** に 飛びます（core の push）。
     ★ 組が 消えて つめる ときも、★残りの 順番は 1つも 入れかわりません。
     ★★ そして ―― ★**光らせません。**★色も 変えません。★★「ここだよ」とは 言いません。
        ★ 追記②：★遊ぶ人が 気づく ことを、機械が 先に 言っては いけない。
        ★ ルルの 判断2は「見ていれば 追える」であって「教える」では ありません。

   ★★ 選ばせる ものは ゼロ です（社長裁定 判断4）★★
     ★ <select> は 1つも 作りません。★最初の 画面には「はじめる ▶」だけ。
     ★ 保存も しません（★覚えて おく ものが ない）。

   ★★ 測る ときの 決まり（★会社で 4回 かかった わな）★★
     ★ 動いて いる 途中を 測らない。★測る ときは .measuring を 付けて
       ★うつり変わりと 動きを 止めてから 測る。★札の 場所は style.left/top（＝ 行き先）を 見る。
   ============================================================ */
(function (root) {
  'use strict';

  var C = root.BABANUKI_CORE;
  var T = C.TUNE;
  var JOKER = C.JOKER;

  /* ★ Node（画面が ない ところ）では ここで おしまい。
     ★ ここから 下は 1行も 動かない ―― だから 数える 側と 遊ぶ 側は ズレようが ない。 */
  if (typeof document === 'undefined') return;

  var $ = function (id) { return document.getElementById(id); };

  /* ── カードの 絵（設計図 §9・厳守）──────────────────
     ・画像は office/games/cards/ の 支給画像。★CSSや 絵文字で 自作しない。
     ・ファイル名が 日本語なので encodeURIComponent を 必ず 通す。
     ・★絵そのもの（cards/）は 1バイトも さわらない ―― 10本が 同じ 絵を 使っている。 */
  /* ★ ハッピーの ひとこと（ルル §7-5）。★遊んで いる 最中は 1文字も しゃべりません。
     ★ ここ 2つ だけ（★勝ち・負け）。★はじめの 画面の ひとことは index.html に あります。 */
  var SAY_WIN  = '🐱 やったー！　ばば、にげきったね！';
  var SAY_LOSE = '🐱 あー、ばば つかまっちゃった！　もう1回 やろ？';

  var CARD_DIR = '../cards/';
  function cardSrc(name) { return CARD_DIR + encodeURIComponent(name) + '.png'; }

  /* ============================================================
     ★★ 絵の 先読み（設計図 §9・2026-08-26 の 行）★★
     ------------------------------------------------------------
     ★ 「そのゲームで 使う札だけを 読む。★使う札は 遊ぶ前に まとめて 読んでおいてよい」
     ★ この 1本で 使う札 ＝ **54個**（52枚 ＋ JOKER1 ＋ トランプ裏赤）。
       ★ JOKER2 は 読みません（★使わない ので）。
     ★★ 裏面（トランプ裏赤）は **この 1本の 主役**です ―― ★ロボットの 手札 ぜんぶ が 裏。
        ★ だから いちばん 先に 読みます（★大富豪 T120 は 裏面を 1枚も 読んで いませんでした）。
     ★ 裏で **4本ずつ** 流す（★52本 まとめて 出すと、細い 線では 1枚も 出そろわない）。
     ★ ★いま 画面に 要る 札は 待ち行列の **先頭へ 入れ替える**（大富豪 T120）。
     ★ ★「読み込み中」の 文字は 出しません（設計図 §5.5）。
       ★ かわりに ―― ★★**配った 札は 裏向きから 始まります。**
         ★ 絵が そろってから 表に 返す ので、★★白い 札は 1枚も 出ません。
         ★ これは 待たせている ように 見えません（★本物の 配りと 同じ 形）。
     ============================================================ */
  var WARM_PAR = 4;
  var warmImg = {}, warmQueue = [], warmRun = 0, warmDone = 0, warmErr = 0, warmGo = false;
  var ALL_NAMES = C.allNames();               /* ★ 54個。★先頭が 裏面 */
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
  /* ★ いま 要る 札を 待ち行列の 先頭へ（大富豪 T120 の 直し）*/
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
    warmQueue = ALL_NAMES.slice(1);            /* ★ 裏面いがいの 53個 */
    var back = new Image();
    warmImg[C.BACK_NAME] = back;
    function go() { if (warmGo) return; warmGo = true; warmNext(); }
    back.onload = function () { warmDone++; go(); };
    back.onerror = function () { warmErr++; go(); };
    back.src = BACK_SRC;                       /* ★ 裏面が 先。★同じ URL なので 読み直しに ならない */
    setTimeout(go, 1200);                      /* ★ 念のため（裏面が 来なくても 先へ 進む）*/
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
  var titleScreen, playScreen, stageEl, cardsEl, zoneBot, zoneMe, middleEl, fingerEl;
  var resultWrap, resultBox, resultTitle, resultSay, btnAgain, happyResult;

  var g = null, cardEl = {}, geo = null, built = false;
  var busy = true, over = false, held = 0, press = null, pressKind = '';
  var rand = C.rng((Date.now() ^ 0x5bd1) >>> 0);
  var timers = [], stepLog = [], lastPlan = null;

  function later(ms, fn) { var t = setTimeout(fn, ms); timers.push(t); return t; }
  function clearTimers() { for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]); timers = []; }

  /* ============================================================
     ★★ 寸法 ―― ルルの fit() を core から 呼ぶ（★式は 1か所だけ）★★
     ============================================================ */
  /* ============================================================
     ★★ まん中の 帯を これより 細く しては いけない 線（T175）★★
     ------------------------------------------------------------
     ★★ 見立てでは ありません。★★2つ とも 見張りが **実際に 鳴って** 見つけた 式です
        （★1回目に 92px で 作り、★320×568 と 1280×900 で NG が 出ました → 作業メモ §3）。

     ★ ① ★結果の 箱が 手札に かぶらない こと
          ★ 箱の 天井は 100px。★resultSpot() は 反対がわに 10px を 残す ので、
            ★★箱の 中心は まん中の 中心から **5px** ずれます【実測・→ 作業メモ §3-①】。
          ★ 50（箱の 半分）＋ 5（ずれ）≦ まん中の 半分 ＋ 8（すきま）
            → ★★まん中 ≧ 94px

     ★ ② ★ロボットの 手札の 当たり判定が、まん中の **まん中**まで 届かない こと
          ★ botZone() は 手札の 下へ **札の たけ × 0.4** のびて います（★指の ため）。
          ★ 0.4 × 札のたけ − 8（すきま）< まん中の 半分
            → ★★まん中 > 0.8 × 札のたけ − 16
          ★ ★ここを 割ると、★verify ⑤-c（「手札の 外に カーソルが あるのに 光って いる」）が
            ★鳴ります ―― ★★見張りが 見て いる「外の 点」が まん中の 中心 だから です。

     ★ ★どちらにも **8px の 余裕**を 足した ものを 下限に します。 */
  function midMinOf(ch) { return Math.max(102, Math.ceil(ch * 0.8) - 8); }

  function measure() {
    var r = stageEl.getBoundingClientRect();
    var W = Math.max(60, Math.round(r.width) - 8);      /* ★ .stage の 左右 4px ずつ */
    var H = Math.max(60, Math.round(r.height));
    var lay = C.pickLayout(W, H);
    geo = {
      W: W, H: H,
      cw: lay.w, ch: lay.h, gap: lay.g,
      perRow: lay.perRow, rows: lay.rows,
      handH: lay.handH, happy: lay.happy,
      handW: lay.perRow * lay.w + (lay.perRow - 1) * lay.g,
      lift: Math.max(8, Math.round(lay.h * 0.16)),
      tight: !!lay.tight
    };
    /* ★★ たての 余りは **上・まん中・下の 3つに 同じだけ** 配る ★★
       ------------------------------------------------------------
       ★ T144：はじめは 上下 半分ずつ でした。★それだと 320×568 で
         ★★結果の 箱が ロボットの 手札に 33px かぶりました【実測・T144 の 失敗】。
         ★ → ★余りを **ぜんぶ まん中**に 集めました。
       ★ ★T169：★まん中に いた ハッピーが 上の 帯へ 出て 行き、
         ★★まん中が 空に なりました（★375×812 で 363px）。
       ★★ T175（社長の 決め）：★★「2つの 手札を 近づけて、まん中を 小さくする」。
         ★ ★飾りも 言葉も 足しません ―― ★★**元から ある 余りを 配り直す だけ** です
           （★T163 で ページワンに やった「穴を すきまに 変える」と 同じ 考え）。

       ★ 配り方（★手札は 1pxも やせて いません・設計図 追記③）：
           上の よはく ／ まん中 ／ 下の よはく ＝ ★**同じ たけ**（inner ÷ 3）
       ★ ただし 2つ しばりが あります：
         ① ★まん中は **midMinOf()（★上の 式）を 下回らない**。
            ★ ★結果の 箱と、ロボットの 手札の 当たり判定から 出る 線です。
         ② ★まん中を **今より 大きくしない**（midOld を 上限に する）。
            ★ たての せまい 画面（320×480・812×375 よこ）で、★①が まん中を
              ★★逆に 太らせて しまわない ように する ため です。 */
    var slack = Math.max(0, H - (geo.handH * 2 + geo.happy + C.FIT.PAD * 2));
    geo.slack = slack;
    var inner = Math.max(0, H - geo.handH * 2 - C.FIT.PAD * 2);   /* ★ 手札の 外に 残る たて ぜんぶ */
    var padOld = Math.min(8, Math.floor(slack / 2));              /* ★ T174 までの 配り方 */
    var midOld = inner - padOld * 2;                              /* ★ ＝ 今までの まん中 */
    var mid = Math.min(midOld, Math.max(midMinOf(geo.ch), Math.round(inner / 3)));
    geo.padTop = Math.max(0, Math.floor((inner - mid) / 2));
    geo.midH = inner - geo.padTop * 2;                            /* ★ 端数は まん中へ */
    return geo;
  }

  function layout() {
    measure();
    var s = document.documentElement.style;
    s.setProperty('--cw', geo.cw + 'px');
    s.setProperty('--ch', geo.ch + 'px');
    s.setProperty('--gap', geo.gap + 'px');
    s.setProperty('--handh', geo.handH + 'px');
    /* ★★ T169：★`--happy`（★盤の まん中の ネコの 大きさ）は もう 要りません ―― ★ネコは
       ★ ★盤の 外（`.talk`）に いて、★大きさは CSS が 決めます（★48／64px ＝ 大富豪と 同じ）。
       ⚠️★ ★`geo.happy`（★core が 決める 札の 1.1倍）は **そのまま 残します** ――
          ★ ★あれは「まん中の 帯の たけ」の 計算に 使われて いて、★結果の 箱の 場所を
            ★決めて います（★T144 の 直し）。★★寸法の 式は 1文字も さわって いません。 */
    s.setProperty('--handw', geo.handW + 'px');
    s.setProperty('--lift', geo.lift + 'px');
    /* ★ 結果の 箱の たけの 天井 ―― ★手札に かぶらせない（ルル §7-2 の ⚠️・五目並べ T133 の 教訓）
       ★ 手札の 外に 残る たて ＝ まん中の 帯 ＋ その 上下の すきま。★100px を 上限に する。 */
    var room = geo.midH + C.FIT.PAD * 2;
    s.setProperty('--result-max', Math.max(60, Math.min(100, room - 8)) + 'px');

    zoneBot.style.top = geo.padTop + 'px';
    zoneBot.style.height = geo.handH + 'px';
    zoneMe.style.bottom = geo.padTop + 'px';
    zoneMe.style.height = geo.handH + 'px';
    middleEl.style.top = (geo.padTop + geo.handH + C.FIT.PAD) + 'px';
    middleEl.style.height = geo.midH + 'px';
    /* ★★ ロボットの 指を 器の 中へ 置き直す（★T145 で 見つけた 前からの 不具合）★★
       ★ 指は 隠れて いる ときも、★前に 止まった 場所に 置きっぱなしに なります。
       ★ ★画面を 小さく すると、★★その 座標が 器の そとに はみ出しました
         【実測・320×568：指が 618〜643px ＝ 画面の 下 75px 分 はみ出し、
          ★fitTest の「縦スクロール」が 120場面 ぜんぶで 立ちました】。
       ★ body は overflow:hidden なので 遊ぶ人は 動かせませんが、★★見張りが 鳴る 形です。
       ⚠️★ 0.6秒 にも、★指の 出かたにも、★手札の 大きさにも 1つも さわって いません
          ―― ★動かすのは「隠れて いる ときの 置き場」だけ です。 */
    if (fingerEl && !fingerEl.classList.contains('is-on')) {
      fingerEl.style.transition = 'none';
      fingerEl.style.left = Math.round(4 + geo.W / 2) + 'px';
      fingerEl.style.top = Math.round(geo.padTop + geo.handH + C.FIT.PAD + geo.midH / 2) + 'px';
      void fingerEl.offsetWidth;
      fingerEl.style.transition = '';
    }
    resultSpot();
    placeAll(true);
  }

  /* ★★ 結果の 箱を「2つの 手札の あいだ」に 出す ★★
     ★ 画面の まん中に 出すと、★上の 手札に かぶります（★320×568 で 33px かぶりました）。
     ★ まん中の 帯の 中心に そろえる ため、外わくの 上下の あそびで 位置を 作ります。 */
  function resultSpot() {
    var r = stageEl.getBoundingClientRect();
    var mc = r.top + geo.padTop + geo.handH + C.FIT.PAD + geo.midH / 2;   /* ★ まん中の 帯の 中心 */
    var VH = window.innerHeight;
    resultWrap.style.paddingTop = '10px';
    resultWrap.style.paddingBottom = '10px';
    if (mc >= VH / 2) resultWrap.style.paddingTop = Math.round(2 * mc - VH) + 'px';
    else resultWrap.style.paddingBottom = Math.round(VH - 2 * mc) + 'px';
  }

  /* ★★ 場所の 決め方 ★★
     ------------------------------------------------------------
     ★ i 番目の 札 → 行 ＝ floor(i / 1段の 枚数)、列 ＝ i % 1段の 枚数。
     ★ 手札は 帯の まん中に 置きます（よこも たても）。
     ★★ 枚数が 減ると 手札 ぜんたいが **そろって** 動きます ―― ★1枚も 順番が 入れかわりません。
        ★ ここが 判断2 の 見え方です：★動くのは「かたまり ぜんぶ」なので、
          ★★どの 札が どこへ 行ったかは 目で 追えます（★入れかわりが ゼロ だから）。
        ★ 光らせません。★色も 変えません。★★「ここだよ」とは 言いません。
     ★ 14枚を こえる とき（★配った 直後の 27枚 だけ）は **静かに つめます**
       （設計図 追記③：★まれな 最悪ケースの ために、いつもの 画面を 小さくしない）。
     ★ 14枚は 式で 決まる 上限（★数字13しゅるい ＋ ばば1枚）。★枠は いつも 14枚ぶん あります。 */
  function spotOf(where, i, n) {
    var per = geo.perRow, rows = geo.rows, cap = per * rows;
    var row, inRow, cnt, pitch, used;
    if (n <= cap) {
      row = Math.min(rows - 1, Math.floor(i / per));
      inRow = i - row * per;
      cnt = Math.min(per, n - row * per);
      pitch = geo.cw + geo.gap;
      used = Math.max(1, Math.ceil(n / per));
    } else {
      var base = Math.ceil(n / rows);
      row = Math.min(rows - 1, Math.floor(i / base));
      inRow = i - row * base;
      cnt = Math.min(base, n - row * base);
      pitch = (cnt > 1) ? Math.min(geo.cw + geo.gap, (geo.W - geo.cw) / (cnt - 1)) : (geo.cw + geo.gap);
      used = rows;
    }
    var rowW = (cnt - 1) * pitch + geo.cw;
    var x = 4 + (geo.W - rowW) / 2 + inRow * pitch;
    var top = (where === 'bot') ? geo.padTop : (geo.padTop + geo.handH + C.FIT.PAD + geo.midH + C.FIT.PAD);
    var blockH = used * geo.ch + (used - 1) * geo.gap;
    var y = top + (geo.handH - blockH) / 2 + row * (geo.ch + geo.gap);
    return { x: Math.round(x), y: Math.round(y) };
  }

  function placeAll(instant) {
    if (!g) return;
    if (instant) cardsEl.classList.add('no-move');
    var i;
    for (i = 0; i < g.bot.length; i++) putAt(g.bot[i].id, 'bot', i, g.bot.length);
    for (i = 0; i < g.me.length; i++) putAt(g.me[i].id, 'me', i, g.me.length);
    if (instant) {
      void cardsEl.offsetWidth;
      cardsEl.classList.remove('no-move');
    }
    /* ★ 札が 動いた ＝ カーソルの 下の 札が 変わった かもしれない */
    refreshEdge();
  }
  function putAt(id, where, i, n) {
    var e = cardEl[id];
    if (!e) return;
    var p = spotOf(where, i, n);
    e.style.left = p.x + 'px';
    e.style.top = p.y + 'px';
    e.spot = p;
  }

  /* ============================================================
     ★ 札を 作る（★支給画像。★裏 と 表の 2枚を 重ねる）
     ============================================================ */
  function makeCard(slot, faceUp) {
    var e = document.createElement('div');
    e.className = 'card' + (faceUp ? '' : ' is-down');
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
    d.textContent = (c === JOKER) ? '★' : (['♠', '♥', '♦', '♣'][C.suitOf(c)] + C.RANKS[C.rankOf(c)]);
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
     ★ 新しい 試合
     ============================================================ */
  function newGame() {
    clearTimers(); dropCards();
    over = false; busy = true; held = 0; press = null; stepLog = [];
    edgeOff();
    fingerEl.classList.remove('is-on');
    resultWrap.classList.add('hidden');

    g = C.makeGame(rand);

    /* ★ 使う 54個を 待ち行列の 先頭へ（★どのみち ぜんぶ 読みます）*/
    warmFirst(ALL_NAMES);

    /* ★ 配り ―― ★配った 直後の 手札（組を すてる 前）を まず 出す
       ★ 2人だと 27枚・26枚。★14枚の 枠には 入らない ので、★**静かに つめます**（追記③）。 */
    var i, e;
    for (i = 0; i < g.preBot.length; i++) makeCard(g.preBot[i], false);
    for (i = 0; i < g.preMe.length; i++) makeCard(g.preMe[i], false);

    /* ★ まん中から 飛ばす（★配って いる ことが 文字なしで 分かる）*/
    var cx = Math.round(geo.W / 2 - geo.cw / 2) + 4;
    var cy = Math.round(geo.padTop + geo.handH + C.FIT.PAD + geo.midH / 2 - geo.ch / 2);
    cardsEl.classList.add('no-move');
    for (var id in cardEl) if (cardEl.hasOwnProperty(id)) {
      e = cardEl[id]; e.style.left = cx + 'px'; e.style.top = cy + 'px';
    }
    void cardsEl.offsetWidth;
    cardsEl.classList.remove('no-move');

    /* ★ それぞれの 場所へ（★1枚ずつ わずかに ずらして 出す）*/
    var order = [];
    for (i = 0; i < g.preBot.length; i++) order.push(['bot', i, g.preBot[i].id, g.preBot.length]);
    for (i = 0; i < g.preMe.length; i++) order.push(['me', i, g.preMe[i].id, g.preMe.length]);
    for (i = 0; i < order.length; i++) {
      (function (o, k) {
        var el = cardEl[o[2]];
        el.style.transitionDelay = Math.min(360, k * 7) + 'ms';
        var p = spotOf(o[0], o[1], o[3]);
        el.style.left = p.x + 'px'; el.style.top = p.y + 'px'; el.spot = p;
      })(order[i], i);
    }
    later(520, function () {
      for (var id2 in cardEl) if (cardEl.hasOwnProperty(id2)) cardEl[id2].style.transitionDelay = '';
    });

    /* ★ 自分の 手札を 表に する（★配ってから。★絵は もう 手元に ある）*/
    later(500, function () {
      for (var k = 0; k < g.preMe.length; k++) faceUp(g.preMe[k].id, true);
    });

    /* ★★ はじめの 組すて ―― まとめて ぱっと 消す（ルル §7-1）★★
       ★ 2人だと 平均 10組 消えます。★1組ずつ 見せると 3秒 かかって だれる。 */
    later(850, function () {
      for (var k = 0; k < g.goneIds.length; k++) {
        var e2 = cardEl[g.goneIds[k]];
        if (!e2) continue;
        faceUp(g.goneIds[k], true);
        e2.classList.add('is-gone');
      }
    });
    later(1150, function () {
      for (var k = 0; k < g.goneIds.length; k++) {
        var e3 = cardEl[g.goneIds[k]];
        if (e3 && e3.parentNode) e3.parentNode.removeChild(e3);
        delete cardEl[g.goneIds[k]];
      }
      placeAll(false);
    });
    later(T.FIRST_DISCARD, function () { step(); });
  }

  /* ============================================================
     ★ 手番を 進める
     ============================================================ */
  function step() {
    if (!g) return;
    if (g.over) { finish(); return; }
    if (g.turn === 1) { botTurn(); return; }
    busy = false;                 /* ★ ここで はじめて 人の 指を 受ける */
    refreshEdge();                /* ★ 人の 番に なった ―― カーソルの 下の 札が また 光る */
  }

  /* ============================================================
     ★★★ ロボットの 番 ―― 「指」（ルル §2-4）★★★
     ------------------------------------------------------------
       1. ロボットの 指（○の しるし）が、★自分の 手札の 上を すべって いく（0.5秒）
       2. ★引く 札の 上で ★★0.6秒 止まる
       3. ★その札を 抜く
     ★★ 自分の 手札は 表向きです。★だから その 0.6秒の あいだ、遊ぶ人には 見えて います。
     ★★ 情報は 1ミリも 増えて いません ―― ★0.6秒 早く 分かる だけ（ルル §2-4 の 証明）。
     ⚠️★ **この 0.6秒を うっかり 縮めたり 飛ばしたり しない こと。**
        ★ この 1本の「顔」は これ だけ です。★直すのは TUNE.FINGER_HOLD 1か所。
     ★ ロボットは 画面を 見て いません ―― ★指は「本当に 引く 札」の 上で 必ず 止まります
       （★うそを つく 余地が ありません）。
     ============================================================ */
  function botPlan() {
    /* ★ 手番の 時計（★verify が この まま 読みます。★数字を 書き写しません）*/
    var p = [];
    p.push({ name: 'finger-on',   t: 0 });
    p.push({ name: 'finger-move', t: 30 });                                   /* ★ すべりはじめ */
    p.push({ name: 'finger-stop', t: 30 + T.FINGER_SLIDE });                  /* ★ 止まった */
    p.push({ name: 'take',        t: 30 + T.FINGER_SLIDE + T.FINGER_HOLD });  /* ★★ 0.6秒 後 */
    return p;
  }

  function fingerTo(index, n) {
    var p = spotOf('me', index, n);
    fingerEl.style.left = (p.x + geo.cw / 2) + 'px';
    fingerEl.style.top = (p.y + geo.ch * 0.3) + 'px';
  }

  function botTurn() {
    busy = true; held = 0; press = null; paintLift();
    refreshEdge();                      /* ★★ ロボットの 番 ―― ふちの 光りは 0個 */
    var ids = C.idsOf(g.me);
    var id = g.robot.pick(ids, rand);
    var at = C.indexOfId(g.me, id);
    var plan = botPlan();
    lastPlan = plan;

    /* ★ 出発点 ―― 端から すべって くる（★中身を 1つも 見て いません）*/
    var from = (at > g.me.length / 2) ? 0 : (g.me.length - 1);
    later(plan[0].t, function () {
      mark('finger-on');
      fingerEl.style.transition = 'none';
      fingerTo(from, g.me.length);
      void fingerEl.offsetWidth;
      fingerEl.style.transition = '';
      fingerEl.classList.add('is-on');
    });
    later(plan[1].t, function () { mark('finger-move'); fingerTo(at, g.me.length); });
    later(plan[2].t, function () { mark('finger-stop'); });   /* ★ ここから 0.6秒 止まる */
    later(plan[3].t, function () {
      mark('take');
      fingerEl.classList.remove('is-on');
      doDraw(1, id);
    });
  }
  function mark(name) { stepLog.push({ name: name, at: (root.performance && performance.now) ? performance.now() : Date.now() }); }

  /* ============================================================
     ★ 1回 引く（★人でも ロボットでも 同じ 道を 通ります）
     ------------------------------------------------------------
     ★ 組が できた とき も、★ばばを 引いた とき も ―― ★★同じ 0.6秒 見せます。
       ★ **時間で 中身を 教えない**（ルル §7-1。★短ければ「当たり」だと 分かって しまう）。
     ============================================================ */
  function doDraw(who, id) {
    busy = true;
    refreshEdge();                      /* ★ 引いて いる 間は 0個 */
    var e = cardEl[id];
    var beforeBot = C.idsOf(g.bot);
    var r = C.drawOnce(g, who, id);
    if (!r.ok) { busy = false; return r; }
    /* ★★ まぜ直して いない ことを、遊んで いる 最中も 毎回 見張る（★この 1本の 命）★★ */
    if (!C.orderKept(beforeBot, C.idsOf(g.bot))) mixNG++;

    /* ★ ロボット・人 の「見ている」を 更新（★中身を のぞく 行は ありません）*/
    if (who === 1) g.robot.took(r.card);
    else g.robot.gave(r.card, r.id);

    if (e) e.classList.add('is-fly');
    faceUp(id, true);                       /* ★ 引いた 札が 表に なる */

    if (r.pair) {
      /* ★ 組に なった ―― 手札の 中の 相手が ぴょこっと 上がる */
      var mate = cardEl[r.pairId];
      later(T.PAIR_POP, function () {
        if (mate) { faceUp(r.pairId, true); mate.classList.add('is-pop'); }
      });
      /* ★ 引いた 札は 相手の となりへ 寄せる（★2枚が 並んで 見える）*/
      var mSpot = mate ? mate.spot : null;
      if (e && mSpot) {
        e.style.left = mSpot.x + 'px';
        e.style.top = (mSpot.y - geo.lift * 2) + 'px';
      }
      later(T.PAIR_POP + T.SHOW, function () {
        if (e) e.classList.add('is-gone');
        if (mate) { mate.classList.remove('is-pop'); mate.classList.add('is-gone'); }
      });
      later(T.PAIR_POP + T.SHOW + T.PAIR_VANISH, function () {
        if (e && e.parentNode) e.parentNode.removeChild(e);
        if (mate && mate.parentNode) mate.parentNode.removeChild(mate);
        delete cardEl[id]; delete cardEl[r.pairId];
        if (e) e.classList.remove('is-fly');
        placeAll(false);
        later(60, step);
      });
    } else {
      /* ★★ ばば ―― 組に なりません。★手札に 入ります ★★
         ★ 人が 引いた とき … ★表の まま、でたらめな 場所へ
         ★ ロボットが 引いた とき … ★★右はしへ 飛んで、裏に 返る
            ★★ここが 判断2 の 見せ場です。★★でも 光らせません。
            ★ 遊ぶ人は「飛んで いく 先」を 目で 追える ―― ★それ だけ。 */
      later(T.SHOW, function () {
        if (e) e.classList.remove('is-fly');
        placeAll(false);
        if (who === 1) later(T.DRAW_FLIP, function () { faceUp(id, false); });
        later(320, step);
      });
    }
    return r;
  }

  /* ============================================================
     ★ 引く 操作（社長裁定 ―― 四目並べ・五目並べと 同じ 形・ルル §6）
     ------------------------------------------------------------
       1. ★ロボットの 手札の 上に 指を 置く → ★その札が 1枚分 上に 浮く（裏の まま）
       2. ★左右に すべらせる → ★浮く 札が 変わる
       3. ★指を はなす → ★★その札を 引く（★ここで 初めて 決まる）
     ★★ 「はなすまで 決まらない」が 要る 理由：★引くのは 取り消せない から（ルル §6-2）。
        ★ 16本で いちばん 重い 1タップ です（★1試合に 4回 しか ない）。
     ★ ずらしは 要りません ―― ★浮いた 札は 指の 上に 出ます（ルル §6-3）。
     ============================================================ */
  function botZone() {
    return { x0: 4, x1: 4 + geo.W, y0: geo.padTop - geo.ch * 0.4, y1: geo.padTop + geo.handH + geo.ch * 0.4 };
  }
  function meZone() {
    var t = geo.padTop + geo.handH + C.FIT.PAD + geo.midH + C.FIT.PAD;
    return { x0: 4, x1: 4 + geo.W, y0: t - geo.ch * 0.2, y1: t + geo.handH + geo.ch * 0.4 };
  }
  function inBox(b, x, y) { return x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1; }

  /* ★ いちばん 近い 札（★盤の 外へ すべっても いちばん 近い 札に つく ―― 四目並べと 同じ）*/
  function hitAt(x, y) {
    if (!g || !g.bot.length) return 0;
    var best = 0, bd = Infinity;
    for (var i = 0; i < g.bot.length; i++) {
      var p = spotOf('bot', i, g.bot.length);
      var dx = x - (p.x + geo.cw / 2), dy = y - (p.y + geo.ch / 2);
      var d = dx * dx + dy * dy * 0.55;         /* ★ たての ずれは ゆるく 見る（2段の とき 迷わない）*/
      if (d < bd) { bd = d; best = g.bot[i].id; }
    }
    return best;
  }
  function localXY(e) {
    var r = stageEl.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function paintLift() {
    for (var id in cardEl) if (cardEl.hasOwnProperty(id)) {
      cardEl[id].classList.toggle('is-lift', (+id) === held);
    }
  }

  /* ============================================================
     ★★★ ふちの 光り（T145・社長の ご指示・★パソコンだけ）★★★
     ------------------------------------------------------------
     ★ 社長の 言葉：「カーソルが 当たって いる トランプの ふちを 光らせて ほしい。
       　　　　　　　 クリックする 前の 段階ね。★PC版だけでOK」

     ★★ これは 追記② を 破りません（★四目並べ T131 と 同じ 線）：
       ★「どの 札が ばばか」「引かれた 札の 行き先」 … ★★遊びの 情報 → 見せない
       ★「いま 指して いるのは この 札だ」　　　　 … ★★操作の 返事 → 見せてよい
       ★ ＝ ★どれを 指して いるかは、★★遊ぶ人が 自分で 決めた こと です。

     ★★ 守って いる 線 4つ（★verify ⑤ が ぜんぶ 見張ります）★★
       1. ★★光るのは 同時に **1枚だけ**（★複数は ぜったいに 出しません）
       2. ★★**指の 端末では 0個**（★pointerType が 'mouse' の ときだけ）
          ⚠️★ CSS の :hover では ここが 守れません ―― ★指で さわった 所に 残ります。
       3. ★★ロボットの 番・動いて いる 間・結果の 箱が 出て いる 間は **0個**
       4. ★★光るのは **ふち だけ**（★中身の 明るさは 1も 変わりません → CSS）

     ★★ どの 札かを 決めるのは ―― ★★hitAt()。★引く ときと **まったく 同じ 関数** です。
        → ★★「光った 札」と「はなしたら 引かれる 札」が ずれる ことが ありえません。
        → ★★そして hitAt() は **座標しか 見ません** ―― ★札の 中身（.c）を 1度も 読みません。
           ★ ＝ ばばだから 光る／当たりだから 光る、という ことは 起こりようが ない。
     ============================================================ */
  var edgeId = 0;      /* ★ いま ふちが 光って いる 札の id（0 ＝ なし）*/
  var lastPt = null;   /* ★ さいごに カーソルが あった 所。★★座標と 端末の 種類 だけ 持ちます */

  function paintEdge() {
    for (var id in cardEl) if (cardEl.hasOwnProperty(id)) {
      cardEl[id].classList.toggle('is-edge', (+id) === edgeId);
    }
  }
  /* ★ いま 光らせて よいか（★中身は 1つも 見て いません）*/
  function edgeAllowed() {
    if (!lastPt || lastPt.kind !== 'mouse') return false;   /* ★★ 指の 端末では ここで 終わり */
    if (!g || !geo || over || busy || g.turn !== 0) return false;
    if (resultWrap && !resultWrap.classList.contains('hidden')) return false;
    if (press !== null) return false;                       /* ★ 押して いる 間は 浮きの 番（強調は 1種類まで）*/
    return true;
  }
  /* ★ 画面の 状態が 動いたら いつでも 呼べる（★手番・配りなおし・札の 移動・画面の 大きさ）*/
  function refreshEdge() {
    var want = 0;
    if (edgeAllowed() && inBox(botZone(), lastPt.x, lastPt.y)) want = hitAt(lastPt.x, lastPt.y);
    if (want !== edgeId) { edgeId = want; paintEdge(); }
  }
  function onHover(e) {
    var q = localXY(e);
    lastPt = { x: q.x, y: q.y, kind: e.pointerType || '' };
    refreshEdge();
  }
  function edgeOff() {
    lastPt = null;
    if (edgeId) { edgeId = 0; paintEdge(); }
  }

  function onDown(e) {
    if (!g || over) return;
    var q = localXY(e);
    /* ★★ ロボットの 番・組を 見せている あいだは 効かない。★★おしを ためない（T62 §2-A）★★ */
    if (busy || g.turn !== 0) {
      if (inBox(meZone(), q.x, q.y) || inBox(botZone(), q.x, q.y)) shake();
      return;
    }
    if (inBox(meZone(), q.x, q.y)) { shake(); return; }   /* ★「そこは 引く 所では ありません」*/
    if (!inBox(botZone(), q.x, q.y)) return;
    press = e.pointerId; pressKind = e.pointerType || '';
    held = hitAt(q.x, q.y);
    paintLift();
    refreshEdge();          /* ★ 押した ら ふちの 光りは 消える（★強調は 1種類まで）*/
    try { stageEl.setPointerCapture(e.pointerId); } catch (er) {}
    e.preventDefault();
  }
  function onMove(e) {
    if (press === null || e.pointerId !== press) return;
    var q = localXY(e);
    var id = hitAt(q.x, q.y);
    if (id !== held) { held = id; paintLift(); }
    e.preventDefault();
  }
  function onUp(e) {
    if (press === null || e.pointerId !== press) return;
    var id = held;
    press = null; held = 0; paintLift();
    refreshEdge();
    try { stageEl.releasePointerCapture(e.pointerId); } catch (er) {}
    if (!id || busy || over || g.turn !== 0) return;
    doDraw(0, id);
    e.preventDefault();
  }
  function onCancel() {
    if (press === null) return;
    press = null; held = 0; paintLift();
    refreshEdge();
  }
  function shake() {
    zoneMe.classList.remove('is-no');
    void zoneMe.offsetWidth;
    zoneMe.classList.add('is-no');
  }

  /* ============================================================
     ★ 勝ち・負け（★引き分けは ありません ―― 0%・ルル §7-2）
     ------------------------------------------------------------
     ★ 負けた とき、★手札に ばばが 1枚 だけ 残ります。
       ★ その 1枚が すこし 大きく なる ―― ★★「なぜ 負けたか」が 札 1枚で 出ます。
       ★ 文字は 1つも 要りません。
     ============================================================ */
  function finish() {
    over = true; busy = true; held = 0; press = null; paintLift();
    edgeOff();                          /* ★ 終わったら ふちの 光りは 消える */
    fingerEl.classList.remove('is-on');
    var win = (g.winner > 0);
    if (!win && g.me.length === 1) {
      var e = cardEl[g.me[0].id];
      if (e) e.classList.add('is-last');
    }
    later(win ? T.RESULT_WAIT : T.LOSE_ZOOM + T.RESULT_WAIT, function () {
      resultTitle.textContent = win ? '勝ち！' : '負け…';
      resultTitle.classList.toggle('is-quiet', !win);
      resultSay.textContent = win ? SAY_WIN : SAY_LOSE;
      resultWrap.classList.remove('hidden');
      resultBox.classList.add('is-locked');
      if (win && happyResult) { happyResult.classList.remove('is-jump'); void happyResult.offsetWidth; happyResult.classList.add('is-jump'); }
      later(T.RESULT_LOCK, function () { resultBox.classList.remove('is-locked'); });
    });
  }

  /* ============================================================
     ★ 立ち上げ
     ============================================================ */
  var mixNG = 0;

  function build() {
    if (built) return;
    built = true;
    stageEl.addEventListener('pointerdown', onDown);
    stageEl.addEventListener('pointermove', onMove);
    stageEl.addEventListener('pointerup', onUp);
    stageEl.addEventListener('pointercancel', onCancel);
    stageEl.addEventListener('lostpointercapture', onCancel);
    /* ★★ ふちの 光り（T145）★★
       ★ onMove とは 別に 受けます ―― ★onMove は 押して いる 間しか 動かない から。
       ★ 出て いく とき（pointerleave）と 窓から 外れた とき（blur）は 消す。 */
    stageEl.addEventListener('pointermove', onHover);
    stageEl.addEventListener('pointerover', onHover);
    stageEl.addEventListener('pointerleave', edgeOff);
    stageEl.addEventListener('pointercancel', edgeOff);
    root.addEventListener('blur', edgeOff);
    stageEl.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    stageEl.addEventListener('dragstart', function (e) { e.preventDefault(); });
  }

  function start() {
    titleScreen.classList.add('hidden');
    playScreen.classList.remove('hidden');
    build();
    layout();
    newGame();
  }

  function boot() {
    titleScreen = $('titleScreen'); playScreen = $('playScreen');
    stageEl = $('stage'); cardsEl = $('cards');
    zoneBot = $('zoneBot'); zoneMe = $('zoneMe'); middleEl = $('middle'); fingerEl = $('finger');
    resultWrap = $('resultWrap'); resultBox = $('resultBox');
    resultTitle = $('resultTitle'); resultSay = $('resultSay');
    btnAgain = $('btnAgain'); happyResult = $('happyMid');

    $('btnStart').addEventListener('click', start);
    btnAgain.addEventListener('click', function () { resultWrap.classList.add('hidden'); newGame(); });
    $('btnHowto').addEventListener('click', function () { $('helpDialog').showModal(); });
    var cl = document.querySelectorAll('[data-close]');
    for (var i = 0; i < cl.length; i++) {
      cl[i].addEventListener('click', function (e) { $(e.currentTarget.getAttribute('data-close')).close(); });
    }
    window.addEventListener('resize', function () { if (g) layout(); });
    window.addEventListener('orientationchange', function () { if (g) layout(); });
    warmStart();
    measure();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* ============================================================
     ★★ たしかめの 窓口（既存15本と 同じ 作法。★画面には 1つも 出ない）★★
     ============================================================ */

  /* ★ 測る ときは 動きを 止める（★会社で 4回 かかった わな。★アトの 申し送り）*/
  function still(fn) {
    document.body.classList.add('measuring');
    void document.body.offsetWidth;
    var r;
    try { r = fn(); } finally { document.body.classList.remove('measuring'); }
    return r;
  }

  function now() {
    return {
      '★自分の 手札': g ? handText(g.me, true) : '―',
      '★ロボットの 手札（枚数だけ）': g ? g.bot.length : '―',
      '★手番': g ? (g.over ? '終わり' : (g.turn ? 'ロボット' : 'あなた')) : '―',
      '★浮いている 札': held ? ('id ' + held) : 'なし',
      '★ふちが 光って いる 札': edgeId ? ('id ' + edgeId) : 'なし',
      '★カーソル': lastPt ? (lastPt.kind + '（' + Math.round(lastPt.x) + ',' + Math.round(lastPt.y) + '）') : 'なし',
      '★ロボットが 覚えている': g ? (g.robot.known() ? ('人の 手札の id ' + g.robot.known()) : 'なし') : '―',
      '★ばばは どちらに': g ? (C.hasJoker(g.me) ? 'あなた' : 'ロボット') : '―',
      '引いた 回数': g ? g.draws : 0,
      '★まぜ直しの NG': mixNG,
      '★札': geo ? (geo.cw + '×' + geo.ch + 'px（' + (geo.rows === 1 ? '1段' + geo.perRow + '枚' : geo.perRow + '枚×' + geo.rows + '段') + '）') : '―',
      '★読めた 絵': warmDone + ' / ' + ALL_NAMES.length + (warmErr ? ('（読めず ' + warmErr + '）') : '')
    };
  }
  function handText(hand, showFace) {
    var a = [];
    for (var i = 0; i < hand.length; i++) a.push(showFace ? C.nameOf(hand[i].c) : '裏');
    return a.join(' ');
  }

  /* ★ 試合を まわす（★遊ぶ 側と 同じ core を 通ります）*/
  function autoPlay(n, opt) {
    n = n || 300; opt = opt || {};
    var t0 = Date.now();
    var o = C.runMany(n, opt.seed || 4649, { watch: (opt.watch !== false), blind: !!opt.blind, first: opt.first });
    var out = {
      '試合数': o.games,
      '★エラー': 0, '★反則': o.illegal, '★詰まり': o.stall,
      '★まぜ直し': o.shuffled, '★式やぶり（ルル §1-1）': o.invariant,
      '★人が 負ける': (o.lose * 100).toFixed(1) + '%',
      '★引き分け': (o.tie * 100).toFixed(1) + '%（★0% で 正しい）',
      '引く 回数': o.draws.toFixed(1) + '（人 ' + o.myDraws.toFixed(1) + '）',
      '★いちばん 多かった 手札': o.maxHand + '枚',
      '人が 知っていた 手番': (o.myKnew * 100).toFixed(1) + '%',
      'かかった 時間': (Date.now() - t0) + 'ms'
    };
    console.log('[ババ抜き] autoPlay', out);
    return out;
  }

  /* ★ 見ている人 と 見ていない人（★ルル §1-3 の 表）*/
  function rates(n) {
    n = n || 20000;
    var out = {};
    [['ロボットが 見ていない × 人が 見ていない', true, false, '50.4%'],
     ['ロボットが 見ていない × 人が 見ている', true, true, '★29.8%'],
     ['★ロボットが 見ている × 人が 見ていない（★本番の ロボット）', false, false, '71.0%'],
     ['★ロボットが 見ている × 人が 見ている（★本番の ロボット）', false, true, '50.8%']
    ].forEach(function (a) {
      var o = C.runMany(n, 1234, { blind: a[1], watch: a[2] });
      out[a[0]] = '人が 負ける ' + (o.lose * 100).toFixed(1) + '%（ルル ' + a[3] + '）';
    });
    console.log('[ババ抜き] rates（★各 ' + n + '試合）', out);
    return out;
  }

  function screenInfo() {
    return still(function () {
      var r = stageEl.getBoundingClientRect();
      var box = resultBox.getBoundingClientRect();
      return {
        '画面': window.innerWidth + '×' + window.innerHeight,
        '器の中身': geo.W + '×' + geo.H,
        '★札': geo.cw + '×' + geo.ch + 'px',
        '★44pxに対して': (geo.cw / 44 * 100).toFixed(0) + '%',
        '★並べ方': (geo.rows === 1 ? '1段' + geo.perRow + '枚' : geo.perRow + '枚×' + geo.rows + '段'),
        '手札 1つ分': geo.handW + '×' + geo.handH + 'px',
        'ハッピーの 帯': geo.happy + 'px',
        '上下の 余り': geo.slack + 'px',
        '★結果の 箱の 天井': getComputedStyle(document.documentElement).getPropertyValue('--result-max').trim(),
        '★結果の 箱（いまの たけ）': resultWrap.classList.contains('hidden') ? '（出ていない）' : Math.round(box.height) + 'px',
        'ページ縦スクロール': document.documentElement.scrollHeight > window.innerHeight,
        'ページ横スクロール': document.documentElement.scrollWidth > window.innerWidth,
        'stage': Math.round(r.width) + '×' + Math.round(r.height)
      };
    });
  }

  /* ★ はみ出し・画面外を 測る（1場面ぶん）*/
  var TOUCH_SEL = '.back,.howto,.start-button,.dialog-ok,.close-dialog,.stage';
  function measureOnce() {
    var r = stageEl.getBoundingClientRect();
    var out = { over: 0, off: 0, offName: [],
                scrollX: document.documentElement.scrollWidth > window.innerWidth,
                scrollY: document.documentElement.scrollHeight > window.innerHeight };
    for (var id in cardEl) {
      if (!cardEl.hasOwnProperty(id)) continue;
      var e = cardEl[id];
      if (!e.parentNode) continue;
      var L = parseFloat(e.style.left) || 0, Tp = parseFloat(e.style.top) || 0;
      out.over = Math.max(out.over,
        Math.round(-L), Math.round(-Tp),
        Math.round(L + geo.cw - r.width), Math.round(Tp + geo.ch - r.height));
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
    }
    return out;
  }

  /* ★★ はみ出し しらべ（★250場面 以上・設計図 追記③）★★
     ★ 14枚（式の 上限）と 27枚（配った 直後）を かならず 混ぜます。 */
  function fitTest(n) {
    n = n || 250;
    var rd = C.rng(90909), worst = 0, offTotal = 0, names = {}, sx = 0, sy = 0;
    var keepG = g, keepBusy = busy, keepOver = over;
    titleScreen.classList.add('hidden');
    playScreen.classList.remove('hidden');
    build(); layout();
    still(function () {
      for (var k = 0; k < n; k++) {
        dropCards();
        g = C.makeGame(rd);
        /* ★ 3回に 1回は「配った 直後」（★27枚。★14枚の 枠を こえる 場面）*/
        var pre = (k % 3 === 0);
        var mine = pre ? g.preMe : g.me, theirs = pre ? g.preBot : g.bot;
        var i;
        for (i = 0; i < theirs.length; i++) makeCard(theirs[i], false);
        for (i = 0; i < mine.length; i++) makeCard(mine[i], true);
        for (i = 0; i < theirs.length; i++) putAt(theirs[i].id, 'bot', i, theirs.length);
        for (i = 0; i < mine.length; i++) putAt(mine[i].id, 'me', i, mine.length);
        held = (k % 4 === 0 && g.bot.length) ? g.bot[k % g.bot.length].id : 0;
        paintLift();
        var m = measureOnce();
        if (m.over > worst) worst = m.over;
        offTotal += m.off;
        for (var q = 0; q < m.offName.length; q++) names[m.offName[q]] = 1;
        if (m.scrollX) sx++;
        if (m.scrollY) sy++;
      }
    });
    dropCards();
    held = 0; g = keepG; busy = keepBusy; over = keepOver;
    if (g) { rebuildCards(); placeAll(true); }
    var out = {
      '画面': window.innerWidth + '×' + window.innerHeight,
      '★札': geo.cw + '×' + geo.ch + 'px',
      '調べた場面': n + '（★うち 3分の1 は 配った 直後の 27枚）',
      '★はみ出し（一番 大きい）': worst + 'px',
      '★押すボタンが 画面外': offTotal + '件',
      '横スクロールが 出た場面': sx, '縦スクロールが 出た場面': sy
    };
    if (offTotal) out['画面外に 出た もの'] = Object.keys(names);
    console.log('[ババ抜き] fitTest', out);
    return out;
  }
  function rebuildCards() {
    dropCards();
    var i;
    for (i = 0; i < g.bot.length; i++) makeCard(g.bot[i], false);
    for (i = 0; i < g.me.length; i++) makeCard(g.me[i], true);
  }

  /* ★ 画面の 文字数（★手札の 上の 文字は 0文字で なければ ならない）*/
  function readableText(rootEl) {
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
  function wordCount() {
    var shell = readableText(document.querySelector('.app-shell'));
    var box = resultWrap ? readableText(resultWrap) : '';
    var help = readableText($('helpDialog'));
    var onCards = readableText(cardsEl);
    return {
      '★手札の 上の 文字': onCards.length + '文字（★0で なければ おかしい）',
      '遊ぶ 画面': shell.length + '文字',
      '結果の 箱': box.length + '文字',
      'あそびかた': help.length + '文字',
      '★合計': (shell.length + box.length + help.length) + '文字',
      '中身': shell
    };
  }

  /* ============================================================
     ★★★ verify ―― この 1本ならではの 見張り ★★★
     ------------------------------------------------------------
       ①  ルールの 通り（反則0・詰まり0・★引き分け 0%・札の 数が 合う）
       ②  ★★引かれた 札が まぜ直されて いない（★ならびを 前後で 並べて 見る・毎手番）
       ③  ★★ロボットの 手札を 並べ直す 行が 1本も 無い（★文字列で 走査）
       ④  ★★ロボットが 人の 手札の 中身を 見る 行が 1本も 無い（★文字列で 走査）
       ⑤  ★★光り ―― ★★T145 で 書き直しました（★詳しくは ⑤ の 所の 長い 注）
           ★ ★遊びの 情報を 出す 光りは **0個**（★「ここだよ」と 教えて いない）
           ★ ★ふちの 光りは「同時に 1枚・★マウスだけ・★人の 番だけ・★ふちだけ」
       ⑥  ★★ロボットの 指が 0.6秒 止まる（★本物の 時計の 表を 読む）
       ⑦  ★★最初の 画面に <select> が 1つも 無い（社長裁定 判断4）
       ⑧  ★寸法が ルルの 表どおり（97／89／48／41／37px）
       ⑨  ★操作は pointer（click では ない）＋ はなすまで 引かれない
       ⑩  ★結果の 箱が 100px 以下・★手札に 1pxも かぶらない
       ⑪  ★★先読みが 効いて いる（★白い 札 ＝ 0枚・★2段階表示なし）
       ⑫  ★言っては いけない 言葉が 無い・★画面に 数字が 無い
       ⑬  ★手札の 枠が 14枚 まで 入る（★式で 決まる 上限）
     ============================================================ */
  function verify(n) {
    n = n || 500;
    var ng = [], t0 = Date.now(), note = {};

    /* ① ルールの 通り */
    var r1 = C.runMany(n, 31337, { watch: true, blind: false });
    if (r1.illegal) ng.push('反則の 手が ' + r1.illegal + '件');
    if (r1.stall) ng.push('途中で 止まった 試合が ' + r1.stall + '件');
    if (r1.tie > 0) ng.push('★引き分けが 出た（' + (r1.tie * 100).toFixed(2) + '%）―― ★ババ抜きに 引き分けは ありません');
    if (r1.invariant) ng.push('★ルル §1-1 の 式が やぶれた（' + r1.invariant + '件）');
    note['① ' + n + '試合'] = '反則 ' + r1.illegal + '／詰まり ' + r1.stall + '／引き分け ' + (r1.tie * 100).toFixed(1) + '%';

    /* ② ★★まぜ直して いない（★ならびを 前後で 並べて 見る）★★ */
    if (r1.shuffled) ng.push('★★引かれた 札が まぜ直されて いる（' + r1.shuffled + '手番）');
    if (mixNG) ng.push('★★遊んで いる 最中に まぜ直しが 起きた（' + mixNG + '回）');
    /* ★ 本物の 手を 通した 検算（★core を 直に 走らせる）*/
    var mix = orderProbe(120);
    if (mix.bad) ng.push('★★まぜ直しの 検算で NG ' + mix.bad + '件');
    if (!mix.grew) ng.push('★まぜ直しの 検算で「札が 足された 手番」が 1度も 無かった（★試し方が おかしい）');
    if (mix.notEnd) ng.push('★★足された 札が 右はし いがいに 入った（' + mix.notEnd + '回）');
    note['② まぜ直し'] = 'NG ' + (r1.shuffled + mixNG + mix.bad) + '／札が 足された 手番 ' + mix.grew + '（★ぜんぶ 右はし）';

    /* ③ ★★ロボットの 手札を 並べ直す 行が 1本も 無いか（★1行ずつ 見ます）★★
       ★ ゆるして いるのは たった 1行 ―― ★`mine.sort(…)`（★配った ときの **自分の** 手札）。
         ★ 自分の 手札を 数字の 順に そろえるのは ルル §5-3 で 決まって います。
       ★ それ いがいの 並べかえ、★とくに `bot` の 出て くる 行は ★★ぜんぶ NG です。 */
    var coreSrc = String(C.drawOnce) + '\n' + String(C.makeGame) + '\n' + String(C.idsOf);
    var uiSrc = String(placeAll) + '\n' + String(spotOf) + '\n' + String(putAt) + '\n' + String(doDraw) +
                '\n' + String(botTurn) + '\n' + String(onDown) + '\n' + String(onMove) + '\n' +
                String(onUp) + '\n' + String(hitAt);
    var bad3 = [], lines3 = (coreSrc + '\n' + uiSrc).split('\n');
    for (var i3 = 0; i3 < lines3.length; i3++) {
      var L3 = lines3[i3].trim();
      if (!/\.sort\(|\.reverse\(|randomize|mix\(/.test(L3)) continue;
      if (/bot/i.test(L3)) bad3.push(L3);
      else if (L3.indexOf('mine.sort(') !== 0) bad3.push(L3);
    }
    if (bad3.length) ng.push('★★手札を 並べ直す 行が ある：' + bad3.join(' ／ '));

    /* ④ ★ロボットが 人の 手札の 中身を 見ていないか */
    var rsrc = C.makeRobot({}).src();
    var bad4 = rsrc.match(/\.c\b|card|JOKER|rankOf|suitOf|\.me\b|\.bot\b|hand/g);
    if (bad4) ng.push('★★ロボットが 人の 手札の 中身を 見て いる：' + bad4.join('・'));
    if (String(botTurn).indexOf('g.me[') >= 0 && String(botTurn).indexOf('.c') >= 0) {
      ng.push('★ロボットの 番の 中で 人の 札の 中身に さわって いる');
    }

    /* ============================================================
       ⑤ ★★★光り ―― ★★T145 で 中身を 書き直しました ★★★
       ------------------------------------------------------------
       ★★T144 まで、この ⑤ は こう でした：
          「★光って いる もの **0個**／★札の 部品に :hover **0件**／★光りの box-shadow **0件**」

       ★★T145 で 社長が こう 言われました：
          「★カーソルが 当たって いる トランプの ふちを 光らせて ほしい。★PC版だけでOK」

       ★★＝ この 見張りは、直した とたん NG を 出します。★★それが 正しい 動きでした。
       ★★だから ―― ★★甘くせず（＝ 消さず・ゆるめず）、★★正しい 形に 書き直します。

       ⚠️★ 甘くする（⑤ を 消す・条件を ゆるめる）のは かんたんです。★でも それを すると、
          ★★「ばばの 札を 光らせる」も **同じ 穴から** 入って きます。
          ★★＝ 見張りの 意味が 消えます。★だから 穴を 開けずに 作り直しました。

       ★★見分けの 線（★四目並べ T131 で 通した もの）★★
         | | ★見せない（＝ 遊びを 取り上げる）| ★見せてよい（＝ 操作の 返事）|
         |---|---|---|
         | 例 | ★どの 札が ばばか／引かれた 札の 行き先 | ★いま 指して いるのは この 札だ |
         | 遊びに 効くか | ★この1本の **20.8ポイント そのもの** | ★**1ミリも 効かない** |

       ★★新しい ⑤ は 8つ 見ます（a〜h）★★
         a ★★遊びの 情報を 出す 光りは **0個**（★T144 の まま。★1つも ゆるめて いません）
         b ★★ふちの 光りは 同時に **1枚まで**（★2枚 光ったら NG）
         c ★★カーソルが どこにも 無い ときは **0個**
         d ★★**指・ペンの 端末では 0個**（★本物の onHover に その 場面を 通して 測る）
         e ★★ロボットの 番・動いて いる 間・結果の 箱・終わった あと は **0個**
         f ★★光るのは **ふち だけ** ―― ★中身の 見え方が 光る 前と 後で **1も 変わらない**（実測）
         g ★★どの 札を 光らせるかを 決める 行が、★札の **中身を 1度も 読んで いない**（1行ずつ 走査）
         h ★★強調は 1種類まで（§5.5）―― ★浮き・ロボットの 指・ふちの 光りが **同時に 出ない**
       ============================================================ */

    /* ⑤-a ★★遊びの 情報を 出す 光りは 0個（★ここは 1つも ゆるめて いません）★★
       ★ .is-edge は ここに 入れません ―― ★あれは 遊びの 情報では なく 操作の 返事 だから。
       ★ かわりに、★★b〜h で もっと きつく 見張ります。 */
    var css = cssRulesText();
    var lit = document.querySelectorAll('.is-win,.is-hint,.is-glow,.is-here,.is-mark');
    if (lit.length) ng.push('★光って いる ものが ' + lit.length + '個 ある');

    /* ★★★ 上の 1行は「いま この 瞬間」しか 見て いません ★★★
       ⚠️★ T145 で わざと 壊して 気づきました【→ §6-4】：
          ★★「ばばを 引いた ときだけ .is-glow を 付ける」を 入れたら、★★NG 0 で 通りました。
          ★ 理由：★verify を 走らせた その 瞬間、まだ 誰も ばばを 引いて いなかった から。
          ★★＝ T144 §7-4 と まったく 同じ わな（★「無い こと」を 数えるだけの 見張り）。
       ★ → ★★だから「付ける 行が 1つでも 書いて あるか」を、★1行ずつ 走査します。
            ★★これなら、★どんな 場面で しか 出ない 光でも 見つかります。 */
    var litSrc = String(doDraw) + '\n' + String(botTurn) + '\n' + String(step) + '\n' +
                 String(finish) + '\n' + String(newGame) + '\n' + String(placeAll) + '\n' +
                 String(putAt) + '\n' + String(makeCard) + '\n' + String(faceUp) + '\n' +
                 String(paintLift) + '\n' + String(paintEdge) + '\n' + String(refreshEdge) + '\n' +
                 String(onDown) + '\n' + String(onMove) + '\n' + String(onUp) + '\n' +
                 String(onHover) + '\n' + String(layout) + '\n' + String(fingerTo);
    var litAdd = litSrc.match(/is-win|is-hint|is-glow|is-here|is-mark/g);
    if (litAdd) ng.push('★★遊びの 情報を 出す 光りを 付ける 行が ある：' + litAdd.join('・'));
    /* ★ CSS 側にも 決まりを 置いて いないか（★あちらから 光らせる 手も あります）*/
    var litCss = css.match(/\.is-(win|hint|glow|here|mark)\b/g);
    if (litCss) ng.push('★★遊びの 情報を 出す 光りの 決まりが CSS に ある：' + litCss.join('・'));

    /* ★★:hover / :active は これからも 0件 ★★
       ⚠️★ ここを ゆるめる のが、★T145 で いちばん やりたく なった 手 でした。
          ★ でも :hover は ★★指の 端末でも 鳴ります（さわった 所に 残る「こびりつき hover」）。
          ★ 社長は「★PC版だけでOK」と 言われました → ★★:hover では 守れません。
          ★ だから JS で pointerType==='mouse' を 見ます。★この 行は そのまま 残します。 */
    var bad5 = css.match(/\.(card|zone|cards|finger)[^{,]*:(hover|active)/g);
    if (bad5) ng.push('★札の 部品に 指を 置くと 変わる 決まりが ある：' + bad5.join('・'));

    /* ★★光りの box-shadow を 書いて よいのは ―― ★★.card.is-edge の 1つ だけ ★★
       ★ T144 は「札に ぼかしの 影が あったら NG」でした。★いまは 1つ だけ ゆるします。
       ★ ★ゆるす 先を **名指し** して いるので、★ほかの 所に 光を 足したら 鳴ります。 */
    /* ⚠️★★ 見つけ方も 直しました（T155）★★
       ★ 前は **文字の かたち**で 見て いました（/\d+px\s+\d+px\s+[1-9]/ など）。
         ★ ブラウザは box-shadow を 書きなおして 返します ――
           ★ 書いたのは `0 0 12px 4px #ff0`、★返って くるのは `rgb(255,255,0) 0px 0px 12px 4px`。
         ★★ しかも ふつうの 影 `0 1px 2px` も「0px 1px 2」で 当たって しまい、
            ★★**上の cssRuleList を 直した とたん、★.card-in の ふつうの 影で 誤って 鳴りました**
            【T155・私の 回り道】。
       ★ → ★★**長さ（px）だけを 数で 見ます**（★ぼかし 6px 以上／広がり 2px 以上 ＝ 光り）。
         ★ ★色（rgb()/rgba()）は 先に 取りのぞきます ―― ★中の カンマで 切れない ように。
         ★ ★ふつうの 影（0 1px 2px）は そのまま 通ります【実測・両方 確認ずみ】。 */
    var glowSel = [];
    cssRuleList().forEach(function (r) {
      if (!/\.card/.test(r.sel)) return;
      if (r.sel.indexOf('.is-edge') >= 0) return;      /* ★ ここ だけ ゆるす */
      var m = r.text.match(/box-shadow:([^;}]*)/);
      if (!m) return;
      m[1].replace(/\b(?:rgba?|hsla?)\([^)]*\)/g, ' ').split(',').forEach(function (one) {
        if (/inset/.test(one)) return;
        var nums = (one.match(/-?\d+(?:\.\d+)?px/g) || []).map(parseFloat);
        if (nums.length < 3) return;
        if (nums[2] >= 6 || (nums.length >= 4 && nums[3] >= 2)) glowSel.push(r.sel);
      });
    });
    if (glowSel.length) ng.push('★★ふちの 光り いがいの 所に 光りが ある：' + glowSel.join('・'));
    /* ★ 逆の 見張り ―― ★ふちの 光りが **そもそも 書かれて いない** ときも 鳴らす
       （★T144 §7-4 の 教訓：★見張りが「無い こと」だけ 見て いると、機能ごと 消えても 通る）*/
    /* ⚠️★ はじめ この 行は /\.card\.is-edge/ でした。★★それだと `.card.is-edgeXX` にも
          当たって しまい、★★決まりを 名前ごと 消しても 鳴りませんでした
          【T145・わざと 壊して 見つけた 私の 失敗・→ §6-3】。★うしろを 見るように 直しました。 */
    if (!/\.card\.is-edge(?![\w-])/.test(css)) ng.push('★★ふちの 光りの 決まりが CSS に 1行も 無い');
    if (css.indexOf('--edge:') < 0) ng.push('★ふちの 光りの 色（--edge）が 決まって いない');

    /* ⑤-b〜h ★★本物の onHover / refreshEdge / hitAt を 通して 測る ★★ */
    var eg = edgeProbe();
    if (eg.many > 1) ng.push('★★ふちが 同時に ' + eg.many + '枚 光った（★1枚まで）');
    if (!eg.on) ng.push('★★マウスを 乗せても 1枚も 光らなかった（★試し方が おかしい／★機能が 死んで いる）');
    if (eg.off) ng.push('★マウスを 乗せたのに 光らなかった 札が ' + eg.off + '枚 ある');
    if (eg.wrong) ng.push('★★光った 札と、はなしたら 引かれる 札が ちがう（' + eg.wrong + '枚）');
    if (eg.idle) ng.push('★カーソルが どこにも 無いのに ' + eg.idle + '枚 光って いる');
    if (eg.outside) ng.push('★ロボットの 手札の 外に カーソルが あるのに ' + eg.outside + '枚 光って いる');
    if (eg.touch) ng.push('★★指・ペンの 端末で ' + eg.touch + '枚 光った（★0枚 で なければ なりません）');
    if (eg.myHand) ng.push('★★自分の 手札が ' + eg.myHand + '枚 光った（★引く 所では ありません）');
    if (eg.botTurn) ng.push('★★ロボットの 番なのに ふちが ' + eg.botTurn + '枚 光った');
    if (eg.busyOn) ng.push('★★動いて いる 途中なのに ふちが ' + eg.busyOn + '枚 光った');
    if (eg.resultOn) ng.push('★★結果の 箱が 出て いるのに ふちが ' + eg.resultOn + '枚 光った');
    if (eg.overOn) ng.push('★★試合が 終わったのに ふちが ' + eg.overOn + '枚 光った');
    if (eg.withLift) ng.push('★★浮いた 札と ふちの 光りが 同時に 出た（設計図 §5.5：強調は 1種類まで）');
    if (eg.withFinger) ng.push('★★ロボットの 指と ふちの 光りが 同時に 出た（§5.5：強調は 1種類まで）');
    if (eg.inside) ng.push('★★★ふち だけの はずが 中身まで 変わった：' + eg.inside);
    if (eg.dark) ng.push('★★ふちの 光りが そもそも 出て いない（★影が 光る 前と 同じ）');
    if (eg.inset) ng.push('★★ふちの 光りが 内向き（inset）に なって いる ―― ★中身に かぶります');
    if (eg.grew) ng.push('★ふちが 光ると 札の 大きさ／場所が 変わる（' + eg.grew + '）');
    if (eg.peek) ng.push('★★どの 札を 光らせるかを 決める 所が 札の 中身を 見て いる：' + eg.peek);

    /* ★ 浮く 札は 同時に 1つまで・★ロボットの 番には 0個（★T144 から そのまま）*/
    var stateOK = liftProbe();
    if (stateOK.many) ng.push('★浮いた 札が 同時に ' + stateOK.many + '個 出た');
    if (stateOK.botTurn) ng.push('★★ロボットの 番なのに 札が 浮いた（' + stateOK.botTurn + '回）');
    if (stateOK.both) ng.push('★指と 浮いた 札が 同時に 出た（設計図 §5.5：強調は 1種類まで）');
    /* ★ ロボットの 番の あいだ、手札を 効かなく して いるか（★おしを ためない・T62 §2-A）*/
    if (String(botTurn).indexOf('busy = true') < 0) ng.push('★ロボットの 番に 手札を 止めて いない');
    if (String(onDown).indexOf('busy') < 0) ng.push('★動いて いる 途中でも 指を 受けて いる');
    note['⑤ 光り'] = '★遊びの 情報の 光り ' + lit.length + '個／★ふちの 光り マウス ' + eg.on + '枚 中 同時に ' +
                     (eg.many || 0) + '枚まで・指の 端末 ' + eg.touch + '枚・ロボットの 番 ' + eg.botTurn +
                     '枚・中身の 変化 ' + (eg.inside ? eg.inside : 'なし') + '／浮く 札 同時に ' + (stateOK.many || 1) + 'つまで';

    /* ⑥ ★★ロボットの 指が 0.6秒 止まる ★★ */
    var plan = botPlan();
    var tStop = -1, tTake = -1;
    for (var i6 = 0; i6 < plan.length; i6++) {
      if (plan[i6].name === 'finger-stop') tStop = plan[i6].t;
      if (plan[i6].name === 'take') tTake = plan[i6].t;
    }
    if (tStop < 0 || tTake < 0) ng.push('★ロボットの 番の 時計に「止まる」が 無い');
    else if (tTake - tStop !== 600) ng.push('★★ロボットの 指が 止まるのが ' + (tTake - tStop) + 'ms（★600ms で なければ なりません）');
    if (T.FINGER_HOLD !== 600) ng.push('★FINGER_HOLD が ' + T.FINGER_HOLD + 'ms（★600 で なければ なりません）');
    if (T.SHOW !== T.FINGER_HOLD) ng.push('★見せる 時間と 指の 時間が ちがう（★時間で 中身を 教えない）');
    note['⑥ 指'] = 'すべる ' + T.FINGER_SLIDE + 'ms → ★止まる ' + (tTake - tStop) + 'ms → 引く';

    /* ⑦ ★★最初の 画面に <select> が 1つも 無い（社長裁定 判断4）★★ */
    var sel = document.querySelectorAll('select');
    if (sel.length) ng.push('★★<select> が ' + sel.length + '個 ある（★この1本は 選ばせません）');
    var selTitle = titleScreen.querySelectorAll('select,input,[role="listbox"]');
    if (selTitle.length) ng.push('★最初の 画面に えらぶ 部品が ' + selTitle.length + '個 ある');
    var btns = titleScreen.querySelectorAll('button,a');
    if (btns.length !== 1) ng.push('★最初の 画面の ボタンが ' + btns.length + '個（★「はじめる ▶」1つ だけ）');
    note['⑦ えらぶ もの'] = '<select> ' + sel.length + '個／最初の 画面の ボタン ' + btns.length + '個';

    /* ⑧ ★寸法が ルルの 表どおり */
    var want = [[1440, 780, 97, '1512×945'], [960, 750, 89, '1000×900'], [355, 674, 48, '375px'],
                [306, 446, 41, '★320px'], [772, 225, 37, '横向き']];
    var sizeTxt = [];
    for (var i8 = 0; i8 < want.length; i8++) {
      var f = C.fitRuru(want[i8][0], want[i8][1]);
      sizeTxt.push(want[i8][3] + ' ' + f.w + 'px');
      if (f.w !== want[i8][2]) ng.push('★寸法が ちがう（' + want[i8][3] + '：' + f.w + 'px ／ ルル ' + want[i8][2] + 'px）');
    }
    note['⑧ 寸法'] = sizeTxt.join('／');

    /* ⑨ ★操作は pointer・はなすまで 引かれない */
    if (String(build).indexOf('click') >= 0) ng.push('★手札を click で 受けて いる（★pointer で 受けること）');
    if (String(onDown).indexOf('doDraw') >= 0) ng.push('★★指を 置いた 時点で 引いて いる（★はなすまで 決まらない はず）');
    if (String(onUp).indexOf('doDraw') < 0) ng.push('★指を はなした ときに 引いて いない');
    if (String(onCancel).indexOf('doDraw') >= 0) ng.push('★途中で やめた のに 引いて いる');

    /* ⑩ ★結果の 箱 */
    var boxNG = resultProbe();
    if (boxNG.tall) ng.push('★結果の 箱が ' + boxNG.tall + 'px（★100px 以下に すること）');
    if (boxNG.over) ng.push('★★結果の 箱が 手札に かぶって いる（' + boxNG.over + 'px）');
    if (boxNG.clip) ng.push('★結果の 箱の 中身が ' + boxNG.clip + 'px 切れて いる');
    note['⑩ 結果の 箱'] = boxNG.h + 'px（天井 ' + boxNG.max + 'px）／手札との かぶり ' + (boxNG.over || 0) +
                          'px／切れ ' + (boxNG.clip || 0) + 'px';

    /* ⑪ ★★先読み（★白い 札 ＝ 0枚）★★ */
    var white = 0, faceShown = 0;
    for (var id in cardEl) {
      if (!cardEl.hasOwnProperty(id)) continue;
      var e = cardEl[id];
      if (!e.parentNode || e.classList.contains('is-down')) continue;
      faceShown++;
      var f = e.faceImg;
      if (!(f.complete && f.naturalWidth > 0) && !e.querySelector('.fallback')) white++;
    }
    if (white) ng.push('★★表向きなのに 絵が 出て いない 札が ' + white + '枚（★大富豪 T120 の 2段階表示）');
    /* ★★ 先読みが **そもそも 動いて いない** ときも 鳴らす ★★
       ⚠️★ はじめ、この 見張りは「表向きの 札の 中に 白い 札が あるか」だけ でした。
          ★ それだと ―― ★★先読みを まるごと 止めても、★表向きの 札が 0枚の 瞬間には
            NG 0 で 通って しまいます【T144・わざと 壊して 見つけた 私の 失敗】。
       ★ だから「読み終えても いない のに 待ち行列が からっぽ」も NG に します。 */
    if (warmDone + warmErr < ALL_NAMES.length && !warmQueue.length && !warmRun) {
      ng.push('★★先読みが 動いて いない（読めた ' + warmDone + ' / ' + ALL_NAMES.length + '・待ち 0）');
    }
    if (warmErr) ng.push('★読めなかった 絵が ' + warmErr + '個 ある');
    if (ALL_NAMES.length !== 54) ng.push('★読む 絵が ' + ALL_NAMES.length + '個（★54個 の はず）');
    if (ALL_NAMES.indexOf('JOKER2') >= 0) ng.push('★使わない JOKER2 を 読んで いる');
    if (ALL_NAMES[0] !== C.BACK_NAME) ng.push('★裏面を いちばん 先に 読んで いない（★この1本は 裏面が 主役）');
    note['⑪ 先読み'] = '読めた ' + warmDone + '/' + ALL_NAMES.length + '／表向き ' + faceShown + '枚 中 白い 札 ' + white + '枚';

    /* ⑫ ★言葉・数字 */
    var w = wordCount();
    var text = readableText(document.querySelector('.app-shell')) + ' ' +
               readableText(resultWrap) + ' ' + readableText($('helpDialog')) + ' ' + document.title;
    /* ⚠️★ 「ババ抜き」は **固有の 呼び名**なので そのまま 出します（ルル §8-2）。
       ★ 見張るのは ★★ジョーカーの こと を「ばば」以外で 呼んで いないか です。 */
    var NGW = ['ジョーカー', 'JOKER', 'つよさ', 'もの覚え', '記憶', 'レベル', 'むずかしさ',
               'マーク', 'スート', 'シャッフル', 'カード', '%', 'ms', 'ポイント', '秒'];
    var hitW = [];
    for (var i12 = 0; i12 < NGW.length; i12++) if (text.indexOf(NGW[i12]) >= 0) hitW.push(NGW[i12]);
    if (hitW.length) ng.push('★言っては いけない 言葉が ある：' + hitW.join('・'));
    if (text.indexOf('ばば') < 0) ng.push('★「ばば」（ひらがな）が 画面に 1度も 出て いない');
    if (text.replace(/ババ抜き/g, '').indexOf('ババ') >= 0) ng.push('★「ババ」が 名前 いがいの 所に 出て いる');
    if (readableText(cardsEl).length) ng.push('★手札の 上に 文字が ある（' + readableText(cardsEl).length + '文字）');
    var num = text.replace(/[０-９]/g, '0').match(/\d+/g);
    var badNum = [];
    if (num) for (var i13 = 0; i13 < num.length; i13++) if (['1', '2', '3'].indexOf(num[i13]) < 0) badNum.push(num[i13]);
    if (badNum.length) ng.push('★画面に 数字が ある：' + badNum.join('・') + '（★あそびかたの 1.2.3. と「1枚」だけ）');
    note['⑫ 文字'] = w['★合計'] + '（★手札の 上 ' + w['★手札の 上の 文字'] + '）';

    /* ⑬ ★手札の 枠が 14枚 まで 入る */
    var full = C.pickLayout(geo.W, geo.H);
    if (full.perRow * full.rows < 14) ng.push('★手札の 枠が ' + (full.perRow * full.rows) + '枚 しか ない（★14枚 要ります）');
    var needW = full.perRow * full.w + (full.perRow - 1) * full.g;
    if (needW > geo.W) ng.push('★14枚 ならべると よこに ' + (needW - geo.W) + 'px はみ出す');
    note['⑬ 14枚'] = full.perRow + '×' + full.rows + ' ＝ ' + (full.perRow * full.rows) + '枚／よこ ' + needW + 'px（器 ' + geo.W + 'px）';

    var out = {
      '★NG': ng.length, '中身': ng.length ? ng : 'ぜんぶ OK ✅',
      '画面': window.innerWidth + '×' + window.innerHeight,
      'かかった 時間': (Date.now() - t0) + 'ms'
    };
    for (var k in note) if (note.hasOwnProperty(k)) out[k] = note[k];
    console.log('[ババ抜き] verify', out);
    return out;
  }

  /* ★ CSS を「選択子 ＋ 中身」の 組で 返す（★T145：光りを **名指しで** ゆるす ため）*/
  /* ⚠️★★★ ここは 見張りが **丸ごと 死んで いました**（★T152 で ページワンで 見つけ、
        ★★T153 で トライと アイが ババ抜きでも 確かめた もの。★直したのは T155）★★★
     ★ 前の 書き方：
         if (r.cssRules) { walk(r.cssRules); continue; }   ← ★これ
         if (r.selectorText) out.push(…);
     ★ ★いまの Chrome は「入れ子の CSS」に 対応した ので、
       ★★**ふつうの 決まり（.card など）にも 空の cssRules が 付いて います。**
       ★ 空の CSSRuleList も if では「真」―― ★★だから 毎回 空へ もぐって continue し、
       ★★**1個も 集まって いませんでした**（★実測：この 書き方 0個／直した 書き方 96〜97個）。
     ★ ＝ ★★**ババ抜きの 札に 光りを 足しても、verify は 1度も 鳴りませんでした。**
       ★ ★遊びは 壊れて いません。★★見張りだけが 死んで いました。
     ★ → ★★**まず 拾い、それから（★中身が ある ときだけ）もぐる。** */
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

  /* ★★ まぜ直しの 検算 ―― ★core を 直に 走らせて、★1手ごとに ならびを 見る ★★
     ★ 見るのは「写しとった id の ならび」だけ。★中の 動かし方を 1行も 知りません。 */
  function orderProbe(games) {
    var bad = 0, grew = 0, notEnd = 0;
    for (var k = 0; k < games; k++) {
      var rd = C.rng(20250827 + k);
      var gg = C.makeGame(rd);
      /* ★ わざと「見ていない 人」に します ―― ★その方が ばばが 何度も 行き来する ので、
         ★★「足された 札が 右はしに 入る」場面を たくさん 見られます。 */
      var human = C.makeHuman({ watch: false }), robot = C.makeRobot({ blind: true });
      var guard = 0;
      while (!gg.over && guard++ < 400) {
        var before = C.idsOf(gg.bot);
        var r;
        if (gg.turn === 0) {
          r = C.drawOnce(gg, 0, human.pick(C.idsOf(gg.bot), rd));
          human.took(r.card); robot.gave(r.card, r.id);
        } else {
          r = C.drawOnce(gg, 1, robot.pick(C.idsOf(gg.me), rd));
          robot.took(r.card); human.gave(r.card, r.id);
        }
        var after = C.idsOf(gg.bot);
        if (!C.orderKept(before, after)) bad++;
        if (after.length > before.length) {
          grew++;
          if (after[after.length - 1] !== r.id) notEnd++;   /* ★ 右はし いがいに 入った */
        }
      }
    }
    return { bad: bad, grew: grew, notEnd: notEnd };
  }

  /* ============================================================
     ★★★ ふちの 光りの 見張り（T145）★★★
     ------------------------------------------------------------
     ★★ 大事：★★本物の onHover / refreshEdge / hitAt を そのまま 通します。
        ★ 数字を 書き写しません。★中の 作りを 変えたら、ここが 必ず 鳴ります。
     ★★ 測り終わったら、状態を 1つ 残らず 元に 戻します
        （★T144 §7-5 の 失敗 ―― ★見張りが 自分で 場面を こわして 誤って 鳴った）。
     ============================================================ */
  function edgeProbe() {
    var out = { many: 0, on: 0, off: 0, wrong: 0, idle: 0, outside: 0, touch: 0, myHand: 0,
                botTurn: 0, busyOn: 0, resultOn: 0, overOn: 0, withLift: 0, withFinger: 0,
                inside: '', inset: 0, dark: 0, grew: '', peek: '' };
    if (!g || !cardsEl || !geo || !g.bot.length) return out;

    /* ★ g … ★どの 札を 光らせるかを 決める 所が、★札の 中身を 1度も 読んで いないか（1行ずつ）*/
    var src = String(onHover) + '\n' + String(refreshEdge) + '\n' + String(edgeAllowed) + '\n' +
              String(paintEdge) + '\n' + String(edgeOff) + '\n' + String(hitAt) + '\n' +
              String(botZone) + '\n' + String(localXY) + '\n' + String(inBox);
    var peek = src.match(/\.c\b|JOKER|rankOf|suitOf|nameOf|cardName|hasJoker|known|\.face|isJoker/g);
    if (peek) out.peek = peek.join('・');

    var keepHeld = held, keepBusy = busy, keepTurn = g.turn, keepPress = press, keepOver = over;
    var keepEdge = edgeId, keepPt = lastPt;
    var keepFinger = fingerEl.classList.contains('is-on');
    var keepHidden = resultWrap.classList.contains('hidden');

    function nLit() { return document.querySelectorAll('.card.is-edge').length; }
    function hoverCard(where, i, kind) {
      var r = stageEl.getBoundingClientRect();
      var n = (where === 'bot') ? g.bot.length : g.me.length;
      var sp = spotOf(where, i, n);
      onHover({ pointerType: kind, clientX: r.left + sp.x + geo.cw / 2, clientY: r.top + sp.y + geo.ch / 2 });
    }
    /* ★ 中身の 見え方（★光る 前 と 後で くらべる）*/
    function skinOf(el) {
      var inn = el.querySelector('.card-in'), im = el.querySelector('img.back');
      var a = getComputedStyle(inn), b = getComputedStyle(im), r = im.getBoundingClientRect();
      return {
        inn: [a.filter, a.opacity, a.backgroundColor, a.backgroundImage, a.borderTopWidth,
              a.borderTopColor, a.transform, a.mixBlendMode, a.borderTopLeftRadius].join('|'),
        img: [b.filter, b.opacity, b.backgroundColor, b.mixBlendMode, b.objectFit,
              Math.round(r.width * 100), Math.round(r.height * 100)].join('|'),
        shadow: a.boxShadow,
        box: (function () { var q = el.getBoundingClientRect();
          return [Math.round(q.left * 100), Math.round(q.top * 100),
                  Math.round(q.width * 100), Math.round(q.height * 100)].join(','); })()
      };
    }

    still(function () {
      fingerEl.classList.remove('is-on');
      resultWrap.classList.add('hidden');
      over = false; busy = false; g.turn = 0; press = null; held = 0; paintLift();

      /* ── c … カーソルが どこにも 無い ときは 0個 ───────────── */
      edgeOff();
      out.idle = nLit();

      /* ── f … 中身が 変わって いないか（★光る 前を 先に 写しとる）───── */
      var el0 = cardEl[g.bot[0].id];
      var before = el0 ? skinOf(el0) : null;

      /* ── b・光った 札が 引かれる 札と 同じか（マウス）───────── */
      for (var i = 0; i < g.bot.length; i++) {
        hoverCard('bot', i, 'mouse');
        var n = nLit();
        if (n > out.many) out.many = n;
        if (n === 1) {
          out.on++;
          /* ★★ 光った 札 ＝ hitAt が 返す 札 ＝ はなしたら 引かれる 札 */
          if (g.bot[i].id !== edgeId) out.wrong++;
          if (!cardEl[edgeId] || !cardEl[edgeId].classList.contains('is-edge')) out.wrong++;
        } else if (n === 0) out.off++;
      }

      /* ── f … 光って いる 今 と、光る 前 を くらべる ────────── */
      if (before && el0) {
        hoverCard('bot', 0, 'mouse');
        if (el0.classList.contains('is-edge')) {
          var after = skinOf(el0);
          if (after.inn !== before.inn) out.inside = '札の 中（' + before.inn + ' → ' + after.inn + '）';
          else if (after.img !== before.img) out.inside = '絵（' + before.img + ' → ' + after.img + '）';
          if (after.box !== before.box) out.grew = before.box + ' → ' + after.box;
          if (/inset/.test(after.shadow)) out.inset = 1;
          /* ★★ 逆の 見張り ―― ★光りが **そもそも 出て いない** ときも 鳴らす
             （★T144 §7-4 と 同じ わな：★「無い こと」だけ 見て いると、機能ごと 消えても 通る）
             ⚠️★ はじめ ここは out.inside に まぜて いました。★「中身が 変わった」という
                まちがった 名前で 鳴って いたので、★別の 名前に 分けました【T145・→ §6-3】。 */
          if (after.shadow === before.shadow) out.dark = 1;
        }
      }

      /* ── ロボットの 手札の 外（★まん中の ハッピーの 所）── */
      edgeOff();
      (function () {
        var r = stageEl.getBoundingClientRect();
        var y = geo.padTop + geo.handH + C.FIT.PAD + geo.midH / 2;
        onHover({ pointerType: 'mouse', clientX: r.left + geo.W / 2, clientY: r.top + y });
        out.outside = nLit();
      })();

      /* ── 自分の 手札の 上（★引く 所では ありません）── */
      edgeOff();
      if (g.me.length) { hoverCard('me', 0, 'mouse'); out.myHand = nLit(); }

      /* ── d … ★★指・ペンの 端末では 0個 ★★ ─────────────── */
      var KINDS = ['touch', 'pen', ''];
      for (var k = 0; k < KINDS.length; k++) {
        edgeOff();
        for (var j = 0; j < g.bot.length; j++) { hoverCard('bot', j, KINDS[k]); out.touch += nLit(); }
      }

      /* ── h … 浮きと 同時に 出ない（★押した 瞬間）───────────── */
      edgeOff();
      hoverCard('bot', 0, 'mouse');
      (function () {
        var r = stageEl.getBoundingClientRect();
        var sp = spotOf('bot', 0, g.bot.length);
        onDown({ pointerId: 992, pointerType: 'mouse', clientX: r.left + sp.x + geo.cw / 2,
                 clientY: r.top + sp.y + geo.ch / 2, preventDefault: function () {} });
        if (document.querySelectorAll('.card.is-lift').length && nLit()) out.withLift++;
        press = null; held = 0; paintLift();
      })();

      /* ── e … ロボットの 番／動いて いる 間／結果の 箱／終わった あと ── */
      edgeOff(); busy = false; g.turn = 1;
      fingerEl.classList.add('is-on');
      for (var a = 0; a < g.bot.length; a++) { hoverCard('bot', a, 'mouse'); out.botTurn += nLit(); }
      if (out.botTurn) out.withFinger++;              /* ★ 指が 出て いる 間に 光った */
      fingerEl.classList.remove('is-on');

      edgeOff(); g.turn = 0; busy = true;
      for (var b = 0; b < g.bot.length; b++) { hoverCard('bot', b, 'mouse'); out.busyOn += nLit(); }

      edgeOff(); busy = false;
      resultWrap.classList.remove('hidden');
      for (var c = 0; c < g.bot.length; c++) { hoverCard('bot', c, 'mouse'); out.resultOn += nLit(); }
      resultWrap.classList.add('hidden');

      edgeOff(); over = true;
      for (var d = 0; d < g.bot.length; d++) { hoverCard('bot', d, 'mouse'); out.overOn += nLit(); }

      edgeOff();
    });

    /* ★ ぜんぶ 元に 戻す（★T144 §7-5 の 失敗を くり返さない）*/
    held = keepHeld; busy = keepBusy; g.turn = keepTurn; press = keepPress; over = keepOver;
    lastPt = keepPt; edgeId = keepEdge;
    if (keepFinger) fingerEl.classList.add('is-on');
    if (!keepHidden) resultWrap.classList.remove('hidden');
    paintLift(); paintEdge();
    return out;
  }

  /* ★ 浮く 札・指の 決まりを たしかめる（★本物の onDown / paintLift を 通す）*/
  function liftProbe() {
    var out = { many: 0, botTurn: 0, both: 0 };
    if (!g || !cardsEl) return out;
    var keepHeld = held, keepBusy = busy, keepTurn = g.turn, keepPress = press, keepOver = over;
    var keepFinger = fingerEl.classList.contains('is-on');
    still(function () {
      /* ★ 人の 番 ―― 1枚ずつ 浮かせて、同時に 2枚 出ないか
         ⚠️★ ここは「人の 番の ふり」を させる ので、★指は いったん しまいます
            （★しまわないと、★ロボットの 番の 途中に 調べた とき、
              ★★起こりえない「指 ＋ 浮いた 札」を 自分で 作って NG を 出します
              ―― ★T144 で 実際に 誤って 鳴らしました）。 */
      fingerEl.classList.remove('is-on');
      over = false; busy = false; g.turn = 0; press = null;
      for (var i = 0; i < g.bot.length; i++) {
        held = g.bot[i].id; paintLift();
        var nl = document.querySelectorAll('.card.is-lift').length;
        if (nl > 1) out.many = Math.max(out.many, nl);
      }
      /* ★★ ロボットの 番 ―― ★押しても 浮かない・★おしを ためない（T62 §2-A の 事故）★★
         ★ 指を 出した まま 押して みる ―― ★★これが 本番で 起きる 形 です。 */
      held = 0; paintLift();
      busy = true; g.turn = 1;
      fingerEl.classList.add('is-on');
      var r = stageEl.getBoundingClientRect();
      var sp = spotOf('bot', 0, g.bot.length);
      onDown({ pointerId: 991, pointerType: 'touch', clientX: r.left + sp.x + geo.cw / 2,
               clientY: r.top + sp.y + geo.ch / 2, preventDefault: function () {} });
      var nl2 = document.querySelectorAll('.card.is-lift').length;
      if (nl2) { out.botTurn++; out.both++; }    /* ★ 指と 浮いた 札が 同時に 出た */
      if (press !== null) out.botTurn++;         /* ★ おしを ためて いる */
      press = null; held = 0; paintLift();
      fingerEl.classList.remove('is-on');
    });
    held = keepHeld; busy = keepBusy; g.turn = keepTurn; press = keepPress; over = keepOver;
    if (keepFinger) fingerEl.classList.add('is-on');
    paintLift(); refreshEdge();
    return out;
  }

  /* ★ 結果の 箱（★たけ・手札との かぶり）*/
  function resultProbe() {
    var wasHidden = resultWrap.classList.contains('hidden');
    var keepSay = resultSay.textContent, keepTitle = resultTitle.textContent;
    var out = { h: 0, max: 0, tall: 0, over: 0, clip: 0 };
    still(function () {
      /* ★ いちばん 長い ひとことで 測る（★短い 方だけ 測ると、切れに 気づけません）*/
      resultTitle.textContent = '負け…';
      resultSay.textContent = SAY_LOSE;
      resultWrap.classList.remove('hidden');
      var b = resultBox.getBoundingClientRect();
      var s = stageEl.getBoundingClientRect();
      out.h = Math.round(b.height);
      out.max = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--result-max'), 10) || 0;
      if (out.h > 100) out.tall = out.h;
      /* ★ 中身が 箱から はみ出して 切れて いないか（★ハッピーの ひとことが 切れる 事故）*/
      out.clip = Math.max(0, resultBox.scrollHeight - resultBox.clientHeight);
      /* ★ 手札の 帯（2つ）と かぶって いないか */
      var z1 = zoneBot.getBoundingClientRect(), z2 = zoneMe.getBoundingClientRect();
      [z1, z2].forEach(function (z) {
        var ov = Math.min(b.bottom, z.bottom) - Math.max(b.top, z.top);
        if (ov > 0 && b.right > z.left && b.left < z.right) out.over = Math.max(out.over, Math.round(ov));
      });
      if (wasHidden) resultWrap.classList.add('hidden');
      resultSay.textContent = keepSay; resultTitle.textContent = keepTitle;
    });
    return out;
  }

  /* ★★ ロボットの 指が 本当に 0.6秒 止まるか（★実測・時計を 動かす）★★
     ★ 使い方： BABANUKI.fingerTest(function(r){ console.log(r); }) */
  function fingerTest(cb) {
    stepLog = [];
    var t0 = Date.now();
    var iv = setInterval(function () {
      var stop = null, take = null;
      for (var i = 0; i < stepLog.length; i++) {
        if (stepLog[i].name === 'finger-stop') stop = stepLog[i].at;
        if (stepLog[i].name === 'take' && stop !== null) take = stepLog[i].at;
      }
      if (take !== null) {
        clearInterval(iv);
        var ms = Math.round(take - stop);
        var out = { '★指が 止まって いた 時間（実測）': ms + 'ms', '★きめた 数字': T.FINGER_HOLD + 'ms',
                    '★ずれ': (ms - T.FINGER_HOLD) + 'ms' };
        console.log('[ババ抜き] fingerTest', out);
        if (cb) cb(out);
      } else if (Date.now() - t0 > 30000) {
        clearInterval(iv);
        if (cb) cb({ '★測れませんでした': 'ロボットの 番が 30秒 来ませんでした' });
      }
    }, 50);
    return '★ロボットの 番を 待って います…（★指が 止まったら 出ます）';
  }

  root.BABANUKI = {
    now: now,
    autoPlay: autoPlay,
    rates: rates,
    verify: verify,
    fitTest: fitTest,
    fingerTest: fingerTest,
    /* ★ ふちの 光り（T145）だけを 単体で 測る */
    edgeTest: function () { var o = edgeProbe(); console.log('[ババ抜き] edgeTest', o); return o; },
    screen: screenInfo,
    words: wordCount,
    geo: function () { return geo; },
    seed: function (v) { if (v == null) return null; rand = C.rng(v >>> 0); return v >>> 0; },
    newGame: function () { if (titleScreen.classList.contains('hidden')) newGame(); else start(); },
    start: start,
    warm: function () { return { '読めた': warmDone, '読めず': warmErr, '待ち': warmQueue.length, '合計': ALL_NAMES.length }; },
    /* ★ たしかめ 専用 ―― 盤を 直に 置く（★遊ぶ 側からは 1度も 通りません）*/
    set: function (mine, theirs) {
      if (!g) return null;
      dropCards();
      g.me = []; g.bot = [];
      var nid = 9001, i;
      for (i = 0; i < mine.length; i++) g.me.push({ id: nid++, c: mine[i] });
      for (i = 0; i < theirs.length; i++) g.bot.push({ id: nid++, c: theirs[i] });
      for (i = 0; i < g.bot.length; i++) makeCard(g.bot[i], false);
      for (i = 0; i < g.me.length; i++) makeCard(g.me[i], true);
      g.over = false; over = false; busy = false; g.turn = 0;
      placeAll(true);
      return now();
    },
    core: C
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
