/* ============================================================
   セブンブリッジ ― 画面（T174・コーダ）
   ------------------------------------------------------------
   ★ 決まりと ロボットは sevenbridge-core.js に あります。
     ★ ここには 決まりが 1行も ありません（★点の 数え方も core が 返します）。
     ★ ＝ 数える 側（Node）と 遊ぶ 側（画面）が ズレようが ない。

   ★★★★★ 2026-08-31・T180 ―― ★★この ファイルの いちばん 大事な 線が 動きました ★★★★★
     ------------------------------------------------------------
     ★ ★→ ★★設計図 §5.5「⚠️★★ 追記②の 例外：**セブンブリッジだけ『出せる組を さがして 光らせる』**」
         （★2026-08-31・社長裁定）を ★★**必ず 先に 読んで ください**。
     ★ ★★下に ある「①組・並びを 光らせない」は、★★この 1本だけ **外されました**。
         ★ ★★`enumMelds` を 呼ぶ 行が 画面側に **あります**。★★それが 正しい 姿 です。
     ⚠️★★★ **決まり違反だと 思って 直しに 来ないで ください。**
         ★ ★社長は 代金（★遊びの 深さ **24.4 → 2.8ポイント**）を 読んだ うえで 決めて います。
         ★ ★★この 例外は **セブンブリッジ 1本だけ**。★ほかの 18本に 広げない こと。

   ★★ T180 で 社長から 来た 5つ ★★
     ① ★★山からは **自動で** 引く（★人は 押さない）
        ★ ★★ただし ―― ★★すて札が **すぐ つかえる** ときは **止まって 2択を 出します**（＝④）。
        ★ ★★これが 無いと「すて札を もらう」が 丸ごと 消え、★勝率が **68.51% → 46.48%**
          ★ ★（★−22.03ポイント）まで 落ちます【★実測・T180・6000試合・作業メモ §2】。
        ★ ★★逆に「すぐ つかえる ときだけ」に しぼると **71.58%** ―― ★★代金は **0**（むしろ 上）。
     ② ★★いま 出せる 札を **出せる しるし**で 囲う（`.card.is-play`）
     ③ ★★2つの ボタン（★場に出す／すてる）。★ドラッグも **残して あります**
     ④ ★★すて札が つかえる ときは 止まって「もらう／そのまま」の 2択
     ⑤ ★★押せない ボタンは **消さず 灰色**に する（★大富豪の「出す・パスする」が 手本）

   ★★ この 1本で いちばん 気を つけた こと（★ルル T173 §18「コーダへ」から 生きて いる ぶん）★★
     ★ ★★「上がれます！」「7は のこそう」は **いまも 出しません**
        ―― ★T180 の 例外で ゆるされたのは「★★いま 出せるか どうか」だけ。★**得か 損かでは ありません**。
     ★ ★★札の すみに 点を 書く（★7＝0／A＝20／絵札＝10／JOKER＝50。★ルル §2-2）
     ★ ★★54枚を 遊ぶ前に まとめて 読む（★52枚 ＋ JOKER1 ＋ うら面。★足す絵 0枚）

   ★★ 強調は **2種類**（★T180 で 1種類 増えました）★★
     ★ ★.card.is-play … ★★出せる しるし ＝「いま 場に 出せる」（★機械が さがして 出します）
     ★ ★.card.is-pick … ★えらんだ しるし ＋ 持ち上げ ＝「人が 押して えらんだ」
   ⚠️★★★★ ★★.card.is-pick を 直す 人へ ―― ★★先に これを 読んで ください ★★★★
     ★ ★★いま .card.is-pick の わくは **1本も 描かれて いません**（★アトの 実測・T205-3）。
       ★ ★computed style は「3px solid rgb(233,79,138)」と 答えるのに、★★写りません。
       ★ ★理由：★outline-offset が **マイナス**で、★.card-in（白い 地・inset:0）が 上から ぬって います。
     ★ ★★これを 直すと ―― ★★その場で「出せる しるし」と ぶつかります。
       ★ ★2つ とも ピンク です：★出せる #C43A73 ／ えらんだ #E94F8A ―― ★★ΔRGB は **48.4** しか ありません。
       ★ ★（★青だった ころは 217.6 ありました）
     ★ ★★だから ―― ★★**直す 前に 見張り ㉗ を 見て ください。**
       ★ ★★㉗ は「えらんだ しるしが 描かれて いるなら、色が ΔRGB 100 以上 離れて いる こと」を 見ます。
       ★ ★★いまは 描かれて いない ので 鳴りません。★★直した 瞬間に 鳴ります。
       ★ ★★色を どうするかは **アトと 社長の お決め** です（★色は アトの 持ちもの）。
     ★ ★★色だけで 分けて いません（★出せる しるしは 平ら・えらんだ しるしは 持ち上がる）。
     ★ ★★しるしが 出るのは 1手番 あたり **0.51枚**、★**77.7% の 手番は 0枚**【実測・3000試合】――
        ★ ★＝ ★ふだんの 画面は うるさく なって いません（★設計図 §5.5 の 心配ごと）。
     ★ ★（★`.is-no`＝ぷるっ・`.is-drag`＝運んで いる・`.is-new`＝いま 引いた は
        ★ ★**人の 指の 返事／出来事の 印**なので、★色を 足して いません）

   ★★ 測る ときの 決まり（★会社で 4回 かかった わな）★★
     ★ 動いて いる 途中を 測らない。★測る ときは .measuring を 付けて
       ★うつり変わりと 動きを 止めてから 測る。★札の 場所は getBoundingClientRect で 見る。
   ============================================================ */
(function (root) {
  'use strict';

  var C = root.SEVENBRIDGE_CORE;
  var T = C.TUNE;

  /* ★ Node（画面が ない ところ）では ここで おしまい。 */
  if (typeof document === 'undefined') return;

  var $ = function (id) { return document.getElementById(id); };

  /* ── カードの 絵（設計図 §9・厳守）──────────────────
     ・画像は office/games/cards/ の 支給画像。★CSSや 絵文字で 自作しない。
     ・ファイル名が 日本語なので encodeURIComponent を 必ず 通す。 */
  var CARD_DIR = '../cards/';
  function cardSrc(name) { return CARD_DIR + encodeURIComponent(name) + '.png'; }

  /* ★★ ハッピーの ひとこと（★ルル §14-2 の 6場面。★見出しは ルル、文は ここ）★★
     ⚠️★ **手を 教えては いけません**（ルル §14-1）。
        ★ 「その 3枚 そろうよ」「7は のこそう」の たぐいは ★★1文字も 書きません。
        ★ ここに あるのは「★いま 何を する 番か」と「★何が 起きたか」だけ です。
     ★ ★★場面2（そろった）と 場面3（付け札）は **起きた あと** に 出ます ――
        ★ ★★先に 言ったら、それは「教える」に なります。 */
  var SAY = {
    draw:    '山か すて札から 1枚 引こう！',
    offer:   'すて札を もらう？ そのまま すすむ？',   /* ★ T180・④ の 2択（★どちらが 得かは 言いません）*/
    drew:    '山から 1枚 引いたよ！',                /* ★ T180・① 自動で 引いた */
    mark:    'ピンクの わくの 札が 出せるよ！',           /* ★ T180・②⑤ ―― ★どれを 出すかは 人が 決めます */
    pick1:   'どの 組に 足す？ 組を おしてね',        /* ★ 足せる 先が 2つ 以上 ある とき */
    play:    'さいごに 1枚 すてて、番を おわろう！',
    meld1:   'そろった！ やったね！',
    lay1:    '人の 組にも 足せたね！',
    /* ★★★ T203 ―― ★★2つの 道が ある ことを 言うだけ の 1行 ★★★
       ⚠️★ ★★「どちらが 得か」は 1文字も 入って いません（★設計図 追記②）。
          ★ ★★札の 名前（7・A・絵札…）も 入れて いません ―― ★verify ⑫ の 線に 触れない ため。 */
    both:    '組に 足す？ 1枚で 出す？ 組を おすと 足せるよ',
    outMe:   '上がり！ この回は 0点！',
    outBot:  '{名前}が 上がった！',
    /* ★★★ T198-2 ―― ★★ここに あった ハッピーの ひとこと 2つ（★7で 上がった！ 点が 2倍！）は
       ★ ★★決まりごと 消しました（2026-09-02・社長裁定）。
       ⚠️★ ★★書き置き：★足し直さないで ください ―― ★★もう 起きない 場面 です。 */
    /* ★★★ T208 ―― ★ポン（★ルル T207 §2-5）★★★
       ★ ★★聞き方は「もらう／そのまま」の 2択を **そのまま 使い回します**（★部品ゼロ増）。
       ★ ★★「ポンできますよ」の お知らせ・光りは 出しません ―― ★★ボタンが 出る ことが お知らせ。
       ⚠️★ ★★手札の 中身は 1文字も 言いません（★「同じ 数字が 2まい あるよ」は 追記② の 側）。 */
    ponAsk:  'ポンする？ そのまま すすむ？',
    pon1:    '同じ 数字を もらって、場に 出したよ！',   /* ★ 1試合に 1回だけ（★SAY.lay1 と 同じ 作法）*/
    dry:     '山が なくなった。この回は ここまで！',
    /* ============================================================
       ★★★★ T205-6 ―― ★★「なぜ 出せないか」を ひとこと（★社長のお決め「1」）★★★★
       ★ ★トライ：「ピンクを 全部 えらぶと 両ボタンが 灰色。★押しても ゆれも ことばも 出ず、
         ★ ★★出口を 画面が 教えません」
       ⚠️★ ★★線（設計図 追記②）：★★「その えらび方では ならない」まで。
          ★ ★★「どれを えらべば よいか」は 1文字も 言いません ―― ★言ったら「出せ」に なります。
       ★ ★★だから ―― ★どれも **人が えらんだ 札の 話** だけ です（★手札の 話は しません）。
       ★ ★★言い分けます（★ぜんぶ 同じ 文だと、遊ぶ人は 何も 分かりません）。 */
    noPick:  '札を おしてから ボタンを おしてね',
    noKeep:  'ぜんぶは 出せないよ。1枚は 手に のこるよ',
    no1:     'その 1枚では 組に ならないよ',
    no2:     'その 2枚では 組に ならないよ',
    noRun:   '同じ マークだけど、数字が つづいて いないよ',
    noMix:   '数字も マークも バラバラだよ',
    noMany:  '同じ 数字は 4まいまでだよ',
    noSet:   'その えらび方では 組に ならないよ',
    noDrop:  'すてるのは 1まいだけだよ'
  };
  var SAY_DEAL_ME = '🐱 この回は あなたが いちばん 少なかった！';
  var SAY_DEAL_OT = '🐱 まだ つづくよ。つぎの 回で 取り返そう！';
  var SAY_WIN  = '🐱 やったー！　{名前}の 勝ち！';
  var SAY_LOSE = '🐱 {名前}の 勝ち！　もう1回 やろ？';

  /* ============================================================
     ★★ 絵の 先読み（設計図 §9・2026-08-26 の 行）★★
     ------------------------------------------------------------
     ★ この 1本で 使う札 ＝ **54個**（52枚 ＋ JOKER1 ＋ トランプ裏赤）。★足す絵 0枚。
     ★★ 裏面は ―― ★ロボット3人の 手札 ぜんぶ ＋ 山。★いちばん 先に 読みます。
     ★ 裏で **4本ずつ** 流す。★いま 要る 札は 待ち行列の **先頭へ 入れ替える**（大富豪 T120）。
     ★ ★「読み込み中」の 文字は 出しません（設計図 §5.5）。
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
  var titleScreen, playScreen, stageEl, cardsEl, zoneBots, scoreBand, feltTable;
  var spotStock, spotDiscard, btnGo, btnPass, sayEl;
  var resultWrap, resultBox, resultTitle, resultSay, resultScore, levelPickResult, btnNext;
  var botEl = [];

  var g = null, match = null, cardEl = {}, geo = null, built = false;
  var tblPos = [], pack = null;
  var busy = true, over = false, pressId = null, drag = null;
  var picks = {};                              /* ★ 人が 押して えらんだ 札 */
  /* ★★ T180 ―― ★機械が さがした「いま 出せる 札」（★設計図 追記②の 例外・2026-08-31）★★ */
  var playSet = {};                            /* ★ 出せる しるしを 付ける 手札 */
  var fitSet = [];                             /* ★ えらんだ 1枚を 足せる 場の 組の 番号 */
  var newCard = -1;                            /* ★ いま 自動で 引いた 1枚（★人が 次に 何か したら 外れる）*/
  var offerOn = false;                         /* ★ ④ の 2択が 出て いる */
  var ponOn = false;                           /* ★★ T208：★ポンの 2択が 出て いる */
  /* ★★★ T198 ―― ★★見張り（⑯-2）が **わざと 7の 決まりを 外す** ための 1つの 札 ★★★
     ★ ★ふだんは いつも false ＝ ★★本物の 決まり（7は 1枚でも 出せる）が 入って います。
     ★ ★★verify だけが 一瞬 true に して、★「7が 1枚で 出せなく なったら 鳴る」ことを その場で 見せます。
     ★ ★★㉕-2（出せる しるしを 剥がして 鳴らす）と 同じ 形 です。 */
  var killSeven = false;
  /* ★★★ T205 ―― ★★見張り（㉖）が わざと「拾える 条件」を 外す ための 1つの 札 ★★★
     ★ ★ふだんは いつも false ＝ ★★ポン／チーの 条件が 入って います。 */
  var killTake = false;
  var rules = C.defaultRules();
  var rand = C.rng((Date.now() ^ 0x5bd1) | 0);
  var seedFixed = 0;
  var timers = [], sayTimer = 0;
  var toldMeld = false, toldLay = false;       /* ★ 場面2・3 は 1試合に 1回だけ */
  var toldBoth = false;                        /* ★★ T203：★「足す」も「1枚で 出す」も できる 場面（1回だけ）*/
  var toldPon = false;                         /* ★★ T208：★ポンが 起きた（★1試合に 1回だけ）*/
  /* ★★ T180・① ―― ★人の 番が 始まってから 自動で 引くまでの 間【★数字は ここ 1か所】★★
     ★ ★★`sevenbridge-core.js` の TUNE は **1文字も さわって いません**（★決まりの ファイル だから）。
     ★ ★★380ms ＝ ★「番が 回って きた」と 分かる ぎりぎり。★★手番は 1つも 増えて いません
       ―― ★★前は ここで 人が **押して いた** ので、★時間は むしろ 減ります。 */
  var AUTO_DRAW_MS = 380;
  var STORE = 'brage-sevenbridge-v1';
  var LV_STORE = 'brage-sevenbridge-lv';
  /* ★★ T201 ―― ★何回戦に するかの えらび（★つよさと 同じ 形で 別に しまいます）★★ */
  var DL_STORE = 'brage-sevenbridge-dl';

  function later(ms, fn) { var t = setTimeout(fn, ms); timers.push(t); return t; }
  function clearTimers() { for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]); timers = []; }
  /* ⚠️★ おかしい つよさが 入っても ここで 止まらない ように まるめます（★ハーツ T168・🟡-4 の 直し）*/
  function levelNow() {
    var i = match ? match.level : C.LEVEL_START;
    if (!(i >= 0 && i < C.LEVELS.length)) i = C.LEVEL_START;
    return C.LEVELS[i];
  }
  function botName(seat) { return 'ロボット' + seat; }
  function seatName(seat) { return seat === 0 ? 'あなた' : botName(seat); }
  function pickList() {
    var a = [];
    for (var k in picks) if (picks.hasOwnProperty(k)) a.push(+k);
    return a;
  }
  function pickCount() { return pickList().length; }

  /* ============================================================
     ★★ 寸法 ―― ★core の pickLayout を 呼ぶ（★式は 1か所だけ）★★
     ------------------------------------------------------------
     ★ 上から：ロボット3人 ／ 点の 帯 ／ ★★場の 台 ／ 山・すて札 ／ 自分の 手札。
     ★ ★余った たては ―― ★①台を 上限まで 太らせる → ★②のこりを **6つの すきまに 均等に**。
     ★ ★★台が いちばん 大きく なります ―― ★この 1本の 遊びは 場に あるから です。
     ============================================================ */
  /* ★★ たての わりふり（★数だけ。★画面を 1度も さわりません）★★
     ★ ★★見張り（verify ⑬）も **この 同じ 関数**を 通します ―― ★★式を 2か所に 書くと
       ★ ★片方だけ 直して 気づけなく なります（★ハーツ T165 の 注意書き）。 */
  function budget(W, H) {
    var F = C.FIT;
    var lay = C.pickLayout(W, H);
    /* ★ 点の 帯 ―― ★余って いる ぶんだけ 太らせる（★ハーツ T171 と 同じ 考え方）
       ★ ★台を 下ばり（tblBase）より やせさせない ところで 止めます。 */
    var scoreRoom = H - lay.botH - lay.tblBase - lay.ph - lay.h - F.NGAP * F.PADMIN;
    var scoreH = Math.max(F.SCORE_MIN, Math.min(F.SCORE_WANT, scoreRoom));
    var fixed = lay.botH + scoreH + lay.ph + lay.h;
    var room = H - fixed - F.NGAP * F.PADMIN;
    var tblH = Math.max(Math.min(lay.tblCap, room), Math.min(lay.tblBase, room));
    if (!(tblH > 20)) tblH = Math.max(20, room);
    var pad = Math.max(F.PADMIN, Math.floor((H - fixed - tblH) / F.NGAP));
    var edge = F.EDGE;
    if (tblH < 80) edge = Math.max(3, Math.round(tblH * 0.16));
    return { lay: lay, scoreH: scoreH, scoreRoom: scoreRoom, tblH: tblH, pad: pad, edge: edge,
             innerW: W - edge * 2, innerH: tblH - edge * 2 };
  }

  function measure() {
    var r = stageEl.getBoundingClientRect();
    var W = Math.max(60, Math.round(r.width) - 8);
    var H = Math.max(60, Math.round(r.height));
    var F = C.FIT;
    var B = budget(W, H);
    var lay = B.lay, scoreH = B.scoreH, scoreRoom = B.scoreRoom, tblH = B.tblH, pad = B.pad;

    var y = pad;
    var botTop = y; y += lay.botH + pad;
    var scoreTop = y; y += scoreH + pad;
    var feltTop = y; y += tblH + pad;
    var pileTop = y; y += lay.ph + pad;
    var meTop = y;

    /* ★ 台の わく（★大富豪の わりふり：木4／内よはく7／みどり2 ＝ 13px）*/
    var edge = B.edge;
    var bd = Math.max(1, Math.round(edge * 4 / F.EDGE));
    var pd = Math.max(1, Math.round(edge * 7 / F.EDGE));

    /* ★ ロボット3人 ―― ★よこに 3つ ならべる */
    var colW = Math.floor(W / 3);
    var botX = [];
    for (var k = 0; k < 3; k++) botX.push(4 + colW * k + Math.round((colW - lay.botOne) / 2));

    /* ★ 山 と すて札 ―― ★まん中に 2つ */
    /* ★ 2つの あいだ ―― ★★広げた 当たり（±10px）どうしが かさならない 22px を 下ばりに します */
    var gapP = Math.max(22, Math.round(lay.pw * 0.5));
    var pileLeft = 4 + Math.round((W - (lay.pw * 2 + gapP)) / 2);

    geo = {
      W: W, H: H, pad: pad, nGap: F.NGAP,
      cw: lay.w, ch: lay.h, gap: lay.g, pitch: lay.pitch,
      bw: lay.bw, bh: lay.bh, bstep: lay.bstep, botOne: lay.botOne,
      pw: lay.pw, ph: lay.ph,
      tw: lay.tw, th: lay.th, tblBase: lay.tblBase, tblCap: lay.tblCap,
      botTop: botTop, botH: lay.botH, botX: botX, colW: colW,
      scoreTop: scoreTop, scoreH: scoreH, scoreRoom: scoreRoom,
      scoreMin: F.SCORE_MIN, scoreWant: F.SCORE_WANT,
      feltTop: feltTop, feltH: tblH, feltLeft: 4, feltW: W,
      edge: edge, feltBd: bd, feltPad: pd, feltIn: Math.max(1, edge - bd - pd),
      innerW: W - edge * 2, innerH: tblH - edge * 2,
      pileTop: pileTop, pileLeft: pileLeft, pileGap: gapP,
      stockX: pileLeft, discardX: pileLeft + lay.pw + gapP,
      meTop: meTop, meH: lay.h, tight: !!lay.tight
    };
    return geo;
  }

  /* ============================================================
     ★★★ 場の 組を たたむ（★core の packTable を 呼ぶ だけ）★★★
     ------------------------------------------------------------
     ★ ★ふだんの 形（★5組・19枚）を いちばん 大きく。★まれな ★★10組・25枚は 静かに 詰める。
     ★ ★★戻って くるのは **座標だけ** です ―― ★「どこに 足せるか」は 1文字も 返りません。
     ============================================================ */
  function layoutTable() {
    tblPos = [];
    if (!g || !g.table.length) {
      pack = null;
      setVar('--tw', geo.tw + 'px'); setVar('--th', geo.th + 'px');
      return;
    }
    var counts = [], i;
    for (i = 0; i < g.table.length; i++) counts.push(C.meldLen(g.table[i]));
    pack = C.packTable(counts, geo.innerW, geo.innerH, geo.tw);
    setVar('--tw', pack.tw + 'px'); setVar('--th', pack.th + 'px');
    var used = pack.h;
    var y0 = geo.feltTop + geo.edge + Math.max(0, Math.floor((geo.innerH - used) / 2));
    for (var ri = 0; ri < pack.rows.length; ri++) {
      var yy = y0 + ri * (pack.th + pack.rowGap);
      for (var j = 0; j < pack.rows[ri].length; j++) {
        var e = pack.rows[ri][j];
        tblPos[e.i] = { x: geo.feltLeft + geo.edge + e.x, y: yy, step: e.step,
                        w: e.w, h: pack.th, row: ri };
      }
    }
  }

  function setVar(k, v) { document.documentElement.style.setProperty(k, v); }

  function layout() {
    measure();
    setVar('--cw', geo.cw + 'px');
    setVar('--ch', geo.ch + 'px');
    setVar('--bw', geo.bw + 'px');
    setVar('--bh', geo.bh + 'px');
    setVar('--pw', geo.pw + 'px');
    setVar('--ph', geo.ph + 'px');
    setVar('--gap', geo.gap + 'px');
    setVar('--felt-bd', geo.feltBd + 'px');
    setVar('--felt-pad', geo.feltPad + 'px');
    setVar('--felt-in', geo.feltIn + 'px');
    /* ★ 結果の 箱の たけの 天井 ―― ★手札に かぶらせない（五目並べ T133 の 教訓）*/
    setVar('--result-max', Math.max(90, Math.min(300, geo.feltH + geo.scoreH + geo.pad * 2)) + 'px');

    /* ★ 点の 帯の 字 ―― ★帯の たけから 出します（★CSS の 決め打ちを しない・ハーツ T171）*/
    var numF = Math.max(11, Math.min(17, Math.round((geo.scoreH - 8) / 2.45)));
    var nameF = Math.max(9, Math.min(13, Math.round(numF * 0.78)));
    setVar('--sb-num', numF + 'px');
    setVar('--sb-name', nameF + 'px');
    geo.sbNum = numF; geo.sbName = nameF;

    zoneBots.style.top = geo.botTop + 'px';
    zoneBots.style.height = geo.botH + 'px';
    for (var k = 0; k < 3; k++) {
      botEl[k].style.left = geo.botX[k] + 'px';
      botEl[k].style.width = geo.botOne + 'px';
      botEl[k].style.top = '0px';
      botEl[k].style.height = geo.botH + 'px';
      botEl[k].querySelector('.bot-name').style.top = geo.bh + 'px';
    }
    scoreBand.style.top = geo.scoreTop + 'px';
    scoreBand.style.height = geo.scoreH + 'px';

    feltTable.style.left = geo.feltLeft + 'px';
    feltTable.style.width = geo.feltW + 'px';
    feltTable.style.top = geo.feltTop + 'px';
    feltTable.style.height = geo.feltH + 'px';

    spotStock.style.left = geo.stockX + 'px';
    spotStock.style.top = geo.pileTop + 'px';
    spotDiscard.style.left = geo.discardX + 'px';
    spotDiscard.style.top = geo.pileTop + 'px';

    /* ★★ 2つの ボタン ―― ★山・すて札の 左右（★T180）★★
       ★ ★★台の 上にも 手札の 上にも 置きません ―― ★かぶると verify ⑬ の
         ★ ★「場の 組に 指が 届かない」／「手札の まん中を さして 当たらない」が 鳴ります。 */
    layoutAct();

    /* ★★ たての 低い 画面（★横向き）は ハッピーの 帯を 出しません ――
       ★ ★ひとことだけを 台の 上ばしに 浮かべます（★ハーツ T167 と 同じ 形）。 */
    var flat = window.matchMedia && window.matchMedia('(max-height:420px)').matches;
    if (sayEl) sayEl.style.top = flat ? geo.feltTop + 'px' : '';

    layoutTable();
    resultSpot();
    if (g) placeAll(true);
  }

  /* ★ 結果の 箱を 台に そろえる（★手札に かぶらせない）*/
  function resultSpot() {
    var r = stageEl.getBoundingClientRect();
    var mc = r.top + geo.feltTop + geo.feltH / 2;
    var VH = window.innerHeight;
    resultWrap.style.paddingTop = '10px';
    resultWrap.style.paddingBottom = '10px';
    if (mc >= VH / 2) resultWrap.style.paddingTop = Math.round(2 * mc - VH) + 'px';
    else resultWrap.style.paddingBottom = Math.round(VH - 2 * mc) + 'px';
  }

  /* ============================================================
     ★★ 場所の 決め方 ★★
     ------------------------------------------------------------
     ★ where … 'me' ／ 'bot1'〜'bot3' ／ 'stock' ／ 'discard' ／ 'tbl'
     ★ ★場の 札は **左から 右へ**、★あとの 札が 上に 重なります
       ―― ★★だから どの 札も **左上の 角（数字と マーク）が 必ず 見えます**。
     ============================================================ */
  function spotOf(where, i, n) {
    if (where === 'me') {
      var left = 4 + (geo.W - ((n - 1) * geo.pitch + geo.cw)) / 2;
      return { x: Math.round(left + i * geo.pitch), y: geo.meTop };
    }
    if (where === 'stock')   return { x: geo.stockX, y: geo.pileTop };
    if (where === 'discard') return { x: geo.discardX, y: geo.pileTop };
    if (where === 'tbl') {
      var p = tblPos[i];
      if (!p) return { x: geo.feltLeft + geo.edge, y: geo.feltTop + geo.edge };
      return { x: p.x + n * p.step, y: p.y };
    }
    var k = +where.charAt(3) - 1;
    return { x: geo.botX[k] + i * geo.bstep, y: geo.botTop };
  }

  function placeAll(instant) {
    if (!g) return;
    if (instant) cardsEl.classList.add('no-move');
    var i, p, mi, k;
    /* ★ 山（★ぜんぶ 同じ 場所に 重ねる ＝ 見た目は 1つの 山）*/
    for (i = 0; i < g.stock.length; i++) putAt(g.stock[i], 'stock', 0, 0, i);
    /* ★ すて札（★一番上の 1枚だけ 見えます ―― ★25枚 重なっても 見た目は 1枚・ルル §8-2）*/
    for (i = 0; i < g.discard.length; i++) putAt(g.discard[i], 'discard', 0, 0, 60 + i);
    /* ★ 場の 組 */
    for (mi = 0; mi < g.table.length; mi++) {
      for (k = 0; k < g.table[mi].cards.length; k++) putAt(g.table[mi].cards[k], 'tbl', mi, k, 200 + mi * 20 + k);
    }
    /* ★ ロボット3人（★裏向き）*/
    for (p = 1; p < 4; p++) {
      for (i = 0; i < g.hands[p].length; i++) putAt(g.hands[p][i], 'bot' + p, i, g.hands[p].length, 400 + i);
    }
    /* ★ 自分の 手札 */
    for (i = 0; i < g.hands[0].length; i++) putAt(g.hands[0][i], 'me', i, g.hands[0].length, 500 + i);
    if (instant) { void cardsEl.offsetWidth; cardsEl.classList.remove('no-move'); }
    refreshPick();
    refreshPlay();
    refreshGo();
  }
  function putAt(c, where, i, n, z) {
    var e = cardEl[c];
    if (!e) return;
    e.where = where; e.wi = i; e.wn = n;
    if (drag && drag.live && drag.card === c) return;   /* ★ 指の 下の 札は 動かさない */
    var p = spotOf(where, i, n);
    e.style.left = p.x + 'px';
    e.style.top = p.y + 'px';
    e.style.zIndex = String(z + 1);
    e.className = e.className.replace(/\s*is-(bot|pile|tbl)\b/g, '');
    if (where.indexOf('bot') === 0) e.className += ' is-bot';
    else if (where === 'stock' || where === 'discard') e.className += ' is-pile';
    else if (where === 'tbl') e.className += ' is-tbl';
    e.spot = p;
  }

  /* ============================================================
     ★ 札を 作る（★支給画像。★裏 と 表の 2枚を 重ねる ＋ ★★すみの 点）
     ------------------------------------------------------------
     ★★ 点の 数字（★ルル §2-2）―― ★これで あそびかたが 4行 減りました。
       ★ ★7 には「0」。★A は 20。★J・Q・K は 10。★ジョーカーは 50。
       ★ ★★出て いるのは **事実 だけ** です ―― ★「のこそう」「すてよう」は 1文字も ありません。
       ★ ★★見せるのは ★自分の 手札 と ★すて札の 一番上 だけ
         ―― ★点は「手元に のこったら つく」もの。★場に 出た 札は もう 点に なりません。
     ============================================================ */
  function makeCard(c, up) {
    var e = document.createElement('div');
    e.className = 'card' + (up ? '' : ' is-down');
    var inn = document.createElement('div');
    inn.className = 'card-in';
    var back = document.createElement('img');
    back.className = 'back'; back.alt = ''; back.decoding = 'async';
    back.src = BACK_SRC;
    var face = document.createElement('img');
    face.className = 'face'; face.alt = ''; face.decoding = 'async';
    var name = C.nameOf(c);
    if (warmReady(name)) face.src = cardSrc(name);
    face.addEventListener('error', function () { fallback(e, c); });
    var pt = document.createElement('span');
    pt.className = 'pt';
    pt.textContent = String(C.penOf(c));
    inn.appendChild(back); inn.appendChild(face); inn.appendChild(pt);
    e.appendChild(inn);
    e.cardName = name; e.faceImg = face; e.ptEl = pt; e.card = c;
    cardsEl.appendChild(e);
    cardEl[c] = e;
    return e;
  }
  /* ★ 絵が 届かなかった ときだけ（★ふだんは 一度も 通らない）*/
  function fallback(e, c) {
    if (e.querySelector('.fallback')) return;
    var d = document.createElement('div');
    d.className = 'fallback' + (C.isRed(c) ? ' red' : '');
    d.textContent = C.isJk(c) ? '☆' : (C.markOf(c) + C.RANKS[C.rankOf(c)]);
    e.firstChild.appendChild(d);
  }
  function faceUp(c, up) {
    var e = cardEl[c];
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
    for (var id in cardEl) if (cardEl.hasOwnProperty(id)) {
      if (cardEl[id].parentNode) cardEl[id].parentNode.removeChild(cardEl[id]);
    }
    cardEl = {};
  }
  /* ★ 札の 表・裏を そろえ直す（★DOM は 53枚 ぜんぶ 先に 作って あります）*/
  function rebuild() {
    if (!g) return;
    var i, p, mi, k;
    for (i = 0; i < g.stock.length; i++) faceUp(g.stock[i], false);
    for (i = 0; i < g.discard.length; i++) faceUp(g.discard[i], true);
    for (mi = 0; mi < g.table.length; mi++) {
      for (k = 0; k < g.table[mi].cards.length; k++) faceUp(g.table[mi].cards[k], true);
    }
    for (p = 1; p < 4; p++) for (i = 0; i < g.hands[p].length; i++) faceUp(g.hands[p][i], false);
    for (i = 0; i < g.hands[0].length; i++) faceUp(g.hands[0][i], true);
    layoutTable();
    placeAll(false);
  }

  /* ============================================================
     ★★★★ T180 ―― ★★「いま 場に 出せる 札」を **さがす** ★★★★
     ------------------------------------------------------------
     ★ ★→ ★★設計図 §5.5「追記②の 例外」（2026-08-31・社長裁定）。
       ★ ★★ここが、★ちょうど 1つ前の 形で **禁じられて いた** 場所 です。
       ★ ★★`enumMelds` を 呼んで います。★★これで 合って います。★消さないで ください。

     ★★ 「出せる」の 決め方 ―― ★★組みあわせ だけ で 決めます（★ロボットの 頭は 使いません）★★
       ★ ★① 手札だけで 3枚以上の 組が 作れて、★すてる 1枚が のこる → ★その 組の 札 ぜんぶ
       ★ ★② 場に 出て いる 組に 足せる（★手札が 2枚以上 ある とき）→ ★その 札
     ⚠️★★ ★**「どれを 出すと 得か」は 1つも 返しません。**
        ★ ★★ルルの 数え方（`planPlay`・`usefulness`）は ★★呼びません ―― ★それは「腕」であって
          ★ ★「できる／できない」では ない から です。★★ここが 例外の **はし** です。
     ============================================================ */
  function playableSet() {
    var out = {};
    if (!g || over || g.cur !== 0 || g.phase !== 'play') return out;
    var hand = g.hands[0], i, k;
    /* ★ ① 手札だけで 作れる 組（★T198：★7は 1枚・2枚 でも 組 に なります）*/
    var ms = C.enumMelds(hand, killSeven);
    for (i = 0; i < ms.length; i++) {
      if (!C.enumOk(ms[i])) continue;                 /* ★ T198：★3枚以上 か、★7の 1〜2枚 */
      if (hand.length - ms[i].cnt < 1) continue;      /* ★ すてる 1枚が 要る（★決まり7）*/
      for (k = 0; k < hand.length; k++) if (ms[i].mask & (1 << k)) out[hand[k]] = 1;
    }
    /* ★ ② 場の 組に 足せる 札 */
    if (hand.length >= 2) {
      for (i = 0; i < g.table.length; i++) {
        for (k = 0; k < hand.length; k++) if (C.tableFits(g.table[i], hand[k])) out[hand[k]] = 1;
      }
    }
    return out;
  }
  /* ★ その 1枚を 足せる 場の 組は どれか（★番号の ならび）*/
  function fitMelds(card) {
    var a = [];
    if (!g || g.hands[0].length < 2) return a;
    for (var i = 0; i < g.table.length; i++) if (C.tableFits(g.table[i], card)) a.push(i);
    return a;
  }
  /* ★★ ④ ―― ★すて札の 一番上を もらったら、★★その 1枚が **すぐ つかえる** か ★★
     ★ ★これが true の ときだけ 手が 止まり、★2択が 出ます。
     ★ ★★false の ときは 山から 自動で 引きます（★社長指示①）。
     ★ ★★止まる 回数【実測・T180・3000試合】：★引く 場面の **9.7%** ＝ ★1試合 **3.88回**。 */
  function discardOffer() {
    if (!g || over || g.cur !== 0 || g.phase !== 'draw') return false;
    /* ★★★★ T205 ―― ★★決まりは core の takeOk **1つ だけ** です ★★★★
       ★ ★前は ここに 画面用の 写しが ありました（★①場の 組に 足せる ②組が できる）。
         ★ ★★写しが あると、★決まりを 変えた ときに 片方だけ 直して ずれます。
       ★ ★★いまは ―― ★画面も ロボットも 引く 道も、★★同じ takeOk を 通ります。
       ★ ★★止まるのは「★もらえば ポン／チーの 形に なる」ときだけ です。 */
    return C.takeOk(g, killTake);
  }

  /* ============================================================
     ★★ 出せる しるしを 盤に 付ける（★T180・社長指示②）★★
     ★ ★手札 …「いま 出せる 札」／★場の 組 …「えらんだ 1枚を 足せる 組」
     ★ ★すて札 …「もらえば すぐ つかえる 1枚」（★④ の とき だけ）
     ============================================================ */
  function refreshPlay() {
    var all = cardsEl.querySelectorAll('.card.is-play'), i;
    for (i = 0; i < all.length; i++) all[i].classList.remove('is-play');
    spotDiscard.classList.remove('is-play');
    playSet = {}; fitSet = [];
    if (!g || over || busy) return;
    if (g.cur !== 0) return;
    if (g.phase === 'draw') {
      if (offerOn) {
        spotDiscard.classList.add('is-play');
        var top = g.discard[g.discard.length - 1];
        if (cardEl[top]) cardEl[top].classList.add('is-play');
      }
      return;
    }
    playSet = playableSet();
    for (var k in playSet) if (playSet.hasOwnProperty(k)) {
      var e = cardEl[+k];
      if (e && e.where === 'me') e.classList.add('is-play');
    }
    /* ★ 1枚だけ えらんで いる ―― ★足せる 先の 組に しるしを 付ける */
    var list = pickList();
    if (list.length === 1) {
      fitSet = fitMelds(list[0]);
      for (i = 0; i < fitSet.length; i++) {
        var m = g.table[fitSet[i]];
        for (var j = 0; j < m.cards.length; j++) {
          var te = cardEl[m.cards[j]];
          if (te) te.classList.add('is-play');
        }
      }
    }
  }

  /* ★ 「いま 引いた 1枚」の 持ち上げを 外す（★人が 次に 何か した 瞬間）*/
  function clearNew() {
    if (newCard < 0) return;
    var e = cardEl[newCard];
    if (e) e.classList.remove('is-new');
    newCard = -1;
  }

  /* ============================================================
     ★★ 人が 押して えらんだ 札の しるし★★
     ★ 設計図 追記④：★ピラミッドの「選ぶ → わく → 押す」と 同じ 形。
     ★ ★`picks` に 入るのは **人が 押した 札 だけ** です（★機械は 1枚も 入れません）。
     ============================================================ */
  function refreshPick() {
    var all = cardsEl.querySelectorAll('.card.is-pick'), i;
    for (i = 0; i < all.length; i++) all[i].classList.remove('is-pick');
    if (!g || over) return;
    var list = pickList();
    for (i = 0; i < list.length; i++) {
      var e = cardEl[list[i]];
      if (e && e.where === 'me') e.classList.add('is-pick');
    }
  }
  /* ============================================================
     ★★★ 2つの ボタン（★T180・社長指示③④⑤）★★★
     ------------------------------------------------------------
     | ★いつ | ★左（すてる・btnPass） | ★右（場に出す・btnGo） |
     |---|---|---|
     | ★すて札が つかえる（④）| そのまま | ★もらう |
     | ★出す 番 | すてる | ★場に出す |
     ★ ★★押せない ときも **消しません** ―― ★灰色に して「いま 押せない」と 見せます（★社長指示⑤）。
       ★ ★★これが 大富豪の「出す・パスする」と 同じ 形 です（★T116）。
     ★ ★★「場に出す」が 押せる 条件は 2つ だけ：
       ★ ★① えらんだ 札が **組に なって いる**（★`makeMeld` が たしかめる）
       ★ ★② えらんだ **1枚** が 場の 組に **足せる**（★`tableFits` が たしかめる）
     ============================================================ */
  /* ============================================================
     ★★★ T203 ―― ★★手札を いつも マーク順・数字順に そろえる（★社長ご指示）★★★
     ------------------------------------------------------------
     ★ ★社長：「手札は 並び替えて ★★マークと 数字ごとに 自動で ソートして ほしいです」

     ★★ これは 追記② の「して よい」側 です ★★
       ★ ★ルル T173 §2-3：「★手札を 人が 並べかえられる ＝『札を きれいに 並べる』は
         ★ ★★肩代わりして よい 側」。
       ⚠️★ ★★して いけないのは「★★組が できる 順に 並べかえる」―― ★★これは 別 です。
          ★ ★★マーク順・数字順は、★★どの 札が どこに 来るかが **中身に よらず 決まって います** ――
            ★ ★★「そこに 組が ある」ことを 1文字も 教えません。
          ★ ★★見張りが それを 数えます（★★同じ 数字 3枚を 入れて、★となり合わない ことを 見る）。

     ★★ ならび ―― ★★クローバー → ダイヤ → ハート → スペード、★その 中で A→K。★ジョーカーは いちばん 右。
       ★ ★★ newDeal が 配りはじめに 使って いた **同じ 式** です（★T174 から あります）。
       ★ ★★変えたのは「★配りはじめだけ」→「★★引く たびに」に した ところ だけ です。
     ============================================================ */
  function sortMyHand() {
    if (!g || !g.hands || !g.hands[0]) return;
    g.hands[0].sort(function (a, b) {
      if (C.isJk(a) !== C.isJk(b)) return C.isJk(a) ? 1 : -1;
      if (C.suitOf(a) !== C.suitOf(b)) return C.suitOf(a) - C.suitOf(b);
      return C.rankOf(a) - C.rankOf(b);
    });
  }

  function goKind() {
    if (!g || over || busy || g.cur !== 0) return null;
    if (g.phase === 'draw') return offerOn ? { k: 'take' } : null;
    if (g.phase !== 'play') return null;
    var list = pickList();
    /* ★★★★ T203 ―― ★★「足す」か「1枚で 出す」かを **人が えらべる** ように しました ★★★★
       ------------------------------------------------------------
       ★ ★社長：「場に ハートの7が 出て いて、★自分が スペードの7を 置く とき、
         ★ ★★ハートの7に つける ことしか できないです。★★本来で あれば、つけるか、
         ★ ★★単体で 出せるかを 選べる べきです」
       ★ ★★T198 の 私は「足せる 先が ある なら 足す」と **勝手に 決めて** いました。
         ★ ★★＝ ★★人から えらぶ 手を 1つ 取りあげて いました。★社長の ご指摘の とおり です。

       ★★ どう えらばせるか ―― ★★新しい 部品を 1つも 足して いません ★★
         ★ ★① ★★右の ボタン …… ★★「1枚で 出す」（★ボタンの 字が 変わります）
         ★ ★② ★★出せる 組を おす／運ぶ …… ★★「足す」（★T180 から ある 道。★そのまま）
         ★ ★★＝ ★2つの 道が、★★それぞれ ちがう 名前で 画面に 出て います。

       ⚠️★ ★★どちらが 得かは 1文字も 言いません（★設計図 追記②）。
          ★ ★★言うのは「できる」ことだけ です ―― ★★ハッピーも 同じ（★1試合に 1回だけ）。
       ★ ★★7 いがいの 札は 何も 変わりません（★1枚では 組に ならない ので、★これまで どおり「足す」）。 */
    if (list.length === 1) {
      var f = fitMelds(list[0]);
      var solo = (g.hands[0].length - 1 >= 1) && !!C.makeMeld(list, 0, killSeven);
      if (f.length && solo) return { k: 'meld', both: true, at: f };   /* ★★ 両方 できる */
      if (f.length) return { k: 'lay', at: f };
      if (solo) return { k: 'meld' };
      return null;
    }
    if (list.length >= 1 && g.hands[0].length - list.length >= 1 &&
        C.makeMeld(list, 0, killSeven)) return { k: 'meld' };
    return null;
  }
  /* ============================================================
     ★★★ T205-6 ―― ★★「なぜ 出せないか」を 1つ えらぶ ★★★
     ★ ★★見て いるのは **人が えらんだ 札** だけ です。★手札の のこりは 見ません。
     ★ ★★＝ ★「その 組み合わせでは ならない」まで。★「どれを えらべ」は 言いません。
     ============================================================ */
  function whyNoGo() {
    if (!g || over || g.cur !== 0 || g.phase !== 'play') return '';
    var list = pickList(), i;
    if (!list.length) return SAY.noPick;
    if (g.hands[0].length - list.length < 1) return SAY.noKeep;
    if (C.makeMeld(list, 0, killSeven)) return '';       /* ★ 本当は 出せます */
    if (list.length === 1) return (fitMelds(list[0]).length ? '' : SAY.no1);
    if (list.length === 2) return SAY.no2;
    /* ★ 3枚以上 ―― ★えらんだ 札の 形で 言い分ける */
    var jk = 0, real = [];
    for (i = 0; i < list.length; i++) { if (C.isJk(list[i])) jk++; else real.push(list[i]); }
    if (!real.length) return SAY.noSet;
    var sameRank = true, sameSuit = true;
    for (i = 1; i < real.length; i++) {
      if (C.rankOf(real[i]) !== C.rankOf(real[0])) sameRank = false;
      if (C.suitOf(real[i]) !== C.suitOf(real[0])) sameSuit = false;
    }
    if (sameRank) return SAY.noMany;                     /* ★ 同じ 数字なのに 通らない ＝ 多すぎ */
    if (sameSuit) return SAY.noRun;                      /* ★ 同じ マークなのに 通らない ＝ とぎれ */
    return SAY.noMix;
  }
  function whyNoPass() {
    if (!g || over || g.cur !== 0 || g.phase !== 'play') return '';
    return (pickCount() === 1) ? '' : SAY.noDrop;
  }
  /* ★★ 押せない ボタンを 押した ときの 手ごたえ ―― ★ことば ＋ ★えらんだ 札を ゆらす ★★
     ★ ★★押せない ボタンは click を 出しません（★ブラウザの 決まり）。
       ★ ★★でも pointerup は 届きます【★実測・T205-6：★本物の 指の 道で 数えました】。
     ★ ★★ゆらすのは **えらんだ 札** です（★ボタンの ゆれは CSS に ない ―― ★アトの 持ちもの）。 */
  function pressedDead(which) {
    if (!g || over || busy || g.cur !== 0) return;
    var msg = (which === 'go') ? whyNoGo() : whyNoPass();
    if (!msg) return;
    say(msg);
    var list = pickList(), i;
    for (i = 0; i < list.length; i++) nope(cardEl[list[i]]);
  }

  function refreshGo() {
    var show = !!(g && !over && !busy && (ponOn || (g.cur === 0 && (g.phase === 'play' || offerOn))));
    btnGo.classList.toggle('hidden', !show);
    btnPass.classList.toggle('hidden', !show);
    if (!show) return;
    if (g.phase === 'draw') {
      btnGo.textContent = 'もらう';
      btnPass.textContent = 'そのまま';
      btnGo.disabled = false;
      btnPass.disabled = false;
      return;
    }
    /* ★★ T208 ―― ★ポンの 2択（★言葉だけ ちがう。★部品は 同じ）★★ */
    if (ponOn) {
      btnGo.textContent = 'ポン';
      btnPass.textContent = 'そのまま';
      btnGo.disabled = false;
      btnPass.disabled = false;
      return;
    }
    var gk = goKind();
    /* ★★ T203 ―― ★★「両方 できる」ときだけ、★ボタンの 字を **「1枚で 出す」**に します。
       ★ ★★これで ―― ★ボタン ＝ 1枚で 出す ／ ★出せる 組を おす ＝ 足す。★2つの 道に 名前が つきます。 */
    /* ⚠️★★ 字の あいだに すきまを 入れると **320px で 切れます**【★私の 失敗・実測 77px > 74px】。
       ★ ★★「場に出す」と 同じ **4〜5字・すきま なし** に そろえます（★設計図 §9.6：
         ★ ★★漢字が 読点の かわりに なる ところは 分かち書きを 外して よい）。
       ★ ★★見張り（⑯-3）が「ボタンの 字が はみ出して いないか」を 毎回 数えます。 */
    btnGo.textContent = (gk && gk.both) ? '1枚で出す' : '場に出す';
    btnPass.textContent = 'すてる';
    btnGo.disabled = !gk;
    btnPass.disabled = !(pickCount() === 1);
    /* ★ 1試合に 1回だけ ―― ★★2つの 道が ある ことを 言います（★どちらが 得かは 言いません）*/
    if (gk && gk.both && !toldBoth) { toldBoth = true; say(SAY.both); }
  }
  /* ★ ボタンの 置き場 ―― ★山・すて札の 左右（★台にも 手札にも かぶりません）*/
  function layoutAct() {
    var side = Math.max(0, geo.stockX - 4);                  /* ★ 左に あいて いる はば */
    var w = Math.max(64, Math.min(150, side - 14));
    var f = w >= 96 ? 15 : (w >= 78 ? 14 : 12.5);
    setVar('--act-w', w + 'px');
    setVar('--act-f', f + 'px');
    setVar('--act-x', (geo.stockX - 14 - w) + 'px');          /* ★ 左（すてる がわ）*/
    setVar('--act-x2', (geo.discardX + geo.pw + 14) + 'px');  /* ★ 右（場に出す がわ）*/
    setVar('--act-y', Math.round(geo.pileTop + (geo.ph - 46) / 2) + 'px');
    geo.actW = w; geo.actF = f;
  }

  /* ★ ハッピーの ひとこと（★出しっぱなしに しない）*/
  /* ★★ T208-3 ―― ★★その 文を 読むのに いる 時間（★字数 × 160ms）★★
     ★ ★★{名前} を 入れかえた **あとの 文**が ここに 来ます ―― ★長い 名前でも 正しく のびます。
     ★ ★★連打しても ちらつきません：★下の say() が 先に 前の 時計を 止めます。 */
  function holdFor(text) {
    var n = String(text || '').length;
    var ms = n * T.SAY_MS_PER_CHAR;
    if (ms < T.SAY_MS_MIN) ms = T.SAY_MS_MIN;
    if (ms > T.SAY_MS_MAX) ms = T.SAY_MS_MAX;
    return ms;
  }
  function say(text, hold) {
    if (sayTimer) { clearTimeout(sayTimer); sayTimer = 0; }
    if (!text) { sayEl.classList.add('hidden'); sayEl.textContent = ''; return; }
    sayEl.textContent = text;
    sayEl.classList.remove('hidden');
    if (hold !== 0) sayTimer = setTimeout(sayIdle, hold || holdFor(text));
  }
  /* ★ 知らせが 消えた あと ―― ★人の 番なら「いま 何を する 番か」に 戻します
     ★ ★（★帯を 空に すると 壊れて 見えます。★ロボットの 番なら 消したまま）*/
  /* ★★ T180・⑤ ―― ★「いま 何が できるか」を 1行で 出す ★★
     ★ ★★出せる 札が ある ときだけ「出せる しるし」と 言います（★無い ときに 言うと うそに なる）。
     ★ ★★どれを 出すと 得かは 1文字も 言いません（★例外の はしは「できる／できない」まで）。 */
  function sayPlay() {
    if (g && g.phase === 'play' && g.cur === 0) {
      for (var k in playSet) if (playSet.hasOwnProperty(k)) return SAY.mark;
    }
    return SAY.play;
  }
  function sayIdle() {
    if (g && !g.over && !over && g.cur === 0) {
      sayEl.textContent = (g.phase === 'draw') ? (offerOn ? SAY.offer : SAY.draw) : sayPlay();
      sayEl.classList.remove('hidden');
      return;
    }
    sayEl.classList.add('hidden');
  }

  /* ============================================================
     ★★ 点の 帯（★何回目 ／ 合計 ―― ★4人ぶん）★★
     ★ ルル §14-1：★「合計」も「だれが 何枚 持って いるか」も **見えて いる 事実**。
     ⚠️★ ここは **数と 名前だけ** です。★「あぶない」「気をつけて」の たぐいは 1文字も 出しません。
     ============================================================ */
  function scoreRows(tot, dealNo, deals) {
    var h = '<b>' + Math.min(deals, dealNo + 1) + '回目</b>', i;
    for (i = 0; i < 4; i++) h += '<span class="sb-name' + (i === 0 ? ' sb-me' : '') + '">' + seatName(i) + '</span>';
    h += '<b>合計</b>';
    for (i = 0; i < 4; i++) h += '<i>' + tot[i] + '</i>';
    return h;
  }
  function renderScore() {
    if (!match) return;
    scoreBand.innerHTML = scoreRows(match.total, match.dealNo, match.deals);
  }
  /* ★ 勝った 人の 名前（★同じ 点の 人が いたら 2人 とも）
     ★★ ここは「誰が」だけ。★点数を 1文字も 入れません（★入れたら 表の 言い直し ＝ §5.5 違反）。 */
  function winnerText() {
    if (!match || !match.winners.length) return '';
    var a = [], i;
    for (i = 0; i < match.winners.length; i++) a.push(seatName(match.winners[i]));
    return a.join('と ');
  }

  /* ============================================================
     ★★ しまう ／ 続きから ★★
     ------------------------------------------------------------
     ★ 1試合は【見立て】3分51秒（ルル §7-2）。★★1回 配り終わる ごとに 合計を しまいます。
     ★★ 正直に 書きます（設計図 追記⑤）：★★**しまうのは 1回 配り終わった ところ だけ** です。
        ★ ★配って いる 途中で 閉じると、★その 回の はじめから やり直しに なります（★1回 ＝ 約58秒）。
        ★ ★理由は ハーツ T165 と 同じ ―― ★途中の 状態（4人の 手札・場の 組・山・すて札）を
          ★ しまう ことも できますが、★開き直す 道が 1本 増え、★そこは 見張りが 薄く なります。
     ============================================================ */
  function save() {
    if (!match) return;
    try {
      if (match.over) { localStorage.removeItem(STORE); return; }
      if (!(match.dealNo > 0)) return;          /* ★ まだ 1回も 配って いない 勝負は しまわない */
      localStorage.setItem(STORE, JSON.stringify({ t: match.total, d: match.dealNo, lv: match.level,
                                                    dl: match.deals }));   /* ★ T201：★何回戦かも 一緒に */
    } catch (e) {}
  }
  /* ★★ つよさ だけを 書きかえる（★★合計と 回数は 1文字も さわりません）★★
     ★ ★ハーツ T168・🔴-1 の 直し ―― ★はじめの 画面で つよさを さわると 続きが 消えた 事故。 */
  function saveLevelOnly() {
    try {
      var o = load();
      if (!o) return;
      o.lv = (match ? match.level : C.LEVEL_START);
      /* ★ T201：★`o.dl` は load() が まるめた 値の まま。★★合計・回数と 同じく さわりません。 */
      localStorage.setItem(STORE, JSON.stringify(o));
    } catch (e) {}
  }
  function load() {
    try {
      var o = JSON.parse(localStorage.getItem(STORE) || 'null');
      if (!o || !o.t || o.t.length !== 4) return null;
      for (var i = 0; i < 4; i++) {
        if (typeof o.t[i] !== 'number' || !isFinite(o.t[i]) || o.t[i] < 0) return null;
      }
      /* ★★ T201 ―― ★何回戦かを 先に 決めます（★一覧に 無い 数は **4に まるめる**。★捨てません）
         ★ ★★T188 で 私が `lv` に やったのと 同じ 形 です。
         ★ ★★古い しまいもの（★dl が 無い）も ここで 4に なります ―― ★★読み捨てません。 */
      o.dl = C.dealsOk(o.dl) ? (o.dl | 0) : C.DEALS_START;
      if (!(o.d > 0) || o.d >= o.dl) return null;      /* ★ もう 終わって いる 勝負は 続きが ありません */
      if (!(o.lv >= 0 && o.lv < C.LEVELS.length)) o.lv = C.LEVEL_START;   /* ★ まるめる（★捨てない）*/
      o.lv = o.lv | 0;
      o.d = o.d | 0;
      return o;
    } catch (e) { return null; }
  }
  function clearSave() { try { localStorage.removeItem(STORE); } catch (e) {} }

  /* ============================================================
     ★ 新しい 1回（★7枚ずつ 配る）
     ★★ 親は 1人ずつ ずれます（★4回 ＝ 4人 ＝「1人 1回ずつ 親を やる」・ルル §3-3）
        ★ ★これが 無いと 先手の 得が **5.15ポイント** 残ります【★私の 実測・作業メモ §3】。
     ============================================================ */
  function newDeal() {
    clearTimers();
    over = false; busy = true; picks = {};
    toldMeld = false; toldLay = false; toldBoth = false; toldPon = false;
    ponOn = false;
    offerOn = false; newCard = -1; playSet = {}; fitSet = [];
    btnGo.classList.add('hidden'); btnPass.classList.add('hidden');
    resultWrap.classList.add('hidden');
    var r = seedFixed ? C.rng((seedFixed + match.dealNo * 7919) | 0) : rand;
    g = C.makeGame(r, { rules: rules, dealNo: match.dealNo, startP: match.dealNo % 4 });

    /* ★★ 手札は いつも マーク順・数字順（★T203・社長ご指示。★★式は sortMyHand に 1つ だけ）★★
       ⚠️★ ★★「組が できる 順」では ありません ―― ★同じ 数字は マークで バラけます。
          ★ ★★引いた 札は「いちばん 右」では なく **自分の 場所**に 入ります。
          ★ ★★どれが 引いた 札かは ★持ち上げ（is-new）で 見えて います（★T180・①）。 */
    sortMyHand();

    /* ★ いま 要る 札を 先読みの 先頭へ（★自分の 手札 ＋ すて札の 1枚）*/
    var need = [], i;
    for (i = 0; i < g.hands[0].length; i++) need.push(C.nameOf(g.hands[0][i]));
    need.push(C.nameOf(g.discard[g.discard.length - 1]));
    warmFirst(need);

    dropCards();
    for (i = 0; i < 53; i++) makeCard(i, false);
    rebuild();
    placeAll(true);
    renderScore();
    busy = false;
    turnStart();
  }

  /* ============================================================
     ★★ 手番 ★★
     ★ 人（席0）の ときは ―― ★★何も しません。★指を 待つ だけ。
     ============================================================ */
  /* ============================================================
     ★★★★ T208 ―― ★★ポンの 窓（★ルル T207 §5-3：★手番を 進める 直前）★★★★
     ★ ★★候補が ロボット …… ★黙って ポンします（★§3-3：★いつも ポン）
     ★ ★★候補が 人（席0）… ★2択を 出して **押されるまで 待ちます**（★案A。★タイマーは 入れません）
     ⚠️★ ★★同時に 2人は 起きません【★ルル：47,109回中 0件／★私の 実測 も 0件】――
        ★ ★★だから 優先順位は 書いて いません。★★先頭を そのまま 使います。
     ============================================================ */
  function ponStep() {
    if (!g || g.phase !== 'pon') return;
    var pc = g.ponCands[0];
    if (pc !== 0) {                              /* ★ ロボットの ポン */
      busy = true; ponOn = false; refreshGo();
      later(T.BOT_THINK, function () {
        if (!g || g.phase !== 'pon') return;
        var r = C.doPon(g, pc);
        if (!r.ok) { C.ponPass(g); later(T.TURN_GAP, turnStart); return; }
        rebuild();
        if (!toldPon) { toldPon = true; say(SAY.pon1); }
        later(T.MELD_MOVE, function () { if (g) botFinishTurn(levelNow().o); });
      });
      return;
    }
    /* ★ 人に 聞く ―― ★押されるまで 待ちます */
    busy = false; ponOn = true;
    say(SAY.ponAsk, 0);
    refreshPlay();
    refreshGo();
  }
  function humanPon() {
    if (!g || over || g.phase !== 'pon') return;
    ponOn = false;
    var r = C.doPon(g, 0);
    if (!r.ok) { humanPonPass(); return; }
    busy = true; clearNew(); picks = {};
    btnGo.classList.add('hidden'); btnPass.classList.add('hidden');
    rebuild();
    var said = false;
    if (!toldPon) { toldPon = true; say(SAY.pon1); said = true; }
    /* ⚠️★★ ここで turnStart() を 呼ぶと ―― ★★280ms 後に sayPlay() が 上に かぶさり、
       ★ ★★SAY.pon1 が **読む 前に 消えます**【★私の 実測・T208】。
       ★ ★★ポンの あとは かならず「自分の 番・出す 場面」なので、★turnStart を 通さず
         ★ ★中身（★言葉・青いわく・ボタン）だけ そろえます。
       ★ ★★1回目だけは pon1 を そのまま 残します（★字数ぶんの 時間で 自分で 消えます）。 */
    later(T.MELD_MOVE, function () {
      if (!g) return;
      busy = false;
      if (!said) say(sayPlay(), 0);
      refreshPlay();
      refreshGo();
    });
  }
  function humanPonPass() {
    if (!g || over || g.phase !== 'pon') return;
    ponOn = false;
    C.ponPass(g);
    busy = true;
    btnGo.classList.add('hidden'); btnPass.classList.add('hidden');
    refreshGo();
    later(T.TURN_GAP, turnStart);
  }

  function turnStart() {
    if (!g) return;
    if (g.over) { finishDeal(); return; }
    if (g.phase === 'pon') { ponStep(); return; }   /* ★★ T208 */
    ponOn = false;
    if (g.cur === 0) {
      busy = false;
      /* ★★★ T180・① ―― ★★山からは **自動で** 引きます ★★★
         ★ ★★ただし ―― ★すて札が **すぐ つかえる** ときは 止まって 2択（④）。
         ★ ★★「止まる 側」を 作らないと、★すて札を もらう 道が 丸ごと 消えて
           ★ ★勝率が 68.51% → 46.48% に 落ちます【★実測・T180・6000試合】。 */
      if (g.phase === 'draw') {
        offerOn = discardOffer();
        if (offerOn) {
          say(SAY.offer, 0);
          refreshPlay();
          refreshGo();
        } else {
          refreshGo();
          later(AUTO_DRAW_MS, function () { if (g && g.cur === 0 && g.phase === 'draw' && !over) autoDraw(); });
        }
        return;
      }
      say(sayPlay(), 0);
      refreshPlay();
      refreshGo();
    } else {
      busy = true;
      refreshGo();
      later(T.BOT_THINK, botStep);
    }
  }

  /* ★★ ロボットの 1手番 ―― ★①引く ②出す・付け札 ③すてる ★★
     ★ ★どれも core の 関数を そのまま 呼びます（★数える 側と 同じ 道）。 */
  function botStep() {
    if (!g || g.over) { finishDeal(); return; }
    var seat = g.cur;
    if (seat === 0) { turnStart(); return; }
    var o = levelNow().o;
    var from = C.botDraw(g, o);
    var dr = C.doDraw(g, from);
    if (!dr.ok) { if (dr.dry) say(SAY.dry, 0); finishDeal(); return; }
    rebuild();
    later(T.DRAW_MOVE, function () { if (g) botFinishTurn(o); });
  }
  /* ★★ T208 ―― ★★ロボットの 手番の のこり（★出す・付け足す → すてる）★★
     ★ ★★引いた あと でも、★★ポンで もらった あと でも、★ここから 先は 同じ です。
       ★ ★（★ポンは「引く」の かわり ―― ★ルル §3-1 ①）
     ★ ★★2か所に 書くと ずれる ので、★1つに して あります。 */
  function botFinishTurn(o) {
    if (!g) return;
    var steps = C.botPlay(g, o);
    if (steps.length) rebuild();
    later(steps.length ? T.MELD_MOVE : 0, function () {
      if (!g) return;
      var dc = C.botDiscard(g, o);
      var rr = C.doDiscard(g, dc);
      rebuild();
      if (!rr.ok) { finishDeal(); return; }
      later(T.DISCARD_MOVE, function () {
        if (!g) return;
        if (g.over) {
          if (g.winner >= 0) say(SAY.outBot.replace('{名前}', botName(g.winner)), 0);
          finishDeal();
          return;
        }
        later(T.TURN_GAP, turnStart);
      });
    });
  }

  /* ============================================================
     ★★★ 人の 手番 ★★★
     ------------------------------------------------------------
     ★ 設計図 追記④：★★**探すのは 人、たしかめるのが 機械。**
       ・★引く … ★★人が 山か すて札を えらぶ（★おすすめは 出しません・ルル §4-1「引き方」14.9ポイント）
       ・★組を 作る … ★★人が 札を えらぶ → ★機械は 組か どうか たしかめる だけ
       ・★付け札 … ★★人が 運ぶ（ドラッグ）→ ★合えば 乗り、合わなければ 戻る
       ・★すてる … ★★人が すて札へ 運ぶ
     ★ ★★機械が 肩代わりして よい 側：★点を 数える・配る・山を 混ぜ直す・上がりの 判定。
     ============================================================ */
  function humanDraw(from, auto) {
    if (!g || busy || over || g.cur !== 0 || g.phase !== 'draw') return false;
    if (from === 'discard' && !g.discard.length) return false;
    var r = C.doDraw(g, from, killTake);
    if (!r.ok) {
      if (r.dry) { say(SAY.dry, 0); finishDeal(); }
      return false;
    }
    busy = true;
    offerOn = false;
    /* ★★ T180・① ―― ★★引いた 1枚が 何だったかを **はっきり 見せます** ★★
       ★ ★アイの ご注文：「★一瞬で 消さない」。
       ★ ★★時間で 消さず、★★人が 次に 何か した 瞬間に 外します（★`clearNew`）。
       ★ ★色は 足しません ―― ★**持ち上げる だけ**（★強調の 色を 3つに しない ため）。 */
    clearNew();
    newCard = r.card;
    sortMyHand();                    /* ★★ T203：★引いた 1枚も その場所へ（★右はし では ない）*/
    rebuild();
    if (cardEl[newCard]) cardEl[newCard].classList.add('is-new');
    warmFirst([C.nameOf(r.card)]);
    later(T.DRAW_MOVE, function () {
      busy = false;
      refreshPlay();
      /* ★ 自動で 引いた ときは「引いたよ」を 1秒 見せてから、★いつもの 1行に 戻します */
      if (auto) say(SAY.drew, 1000); else say(sayPlay(), 0);
      refreshGo();
    });
    return true;
  }
  /* ★★★ T180・① ―― ★★山から 自動で 1枚 引く ★★★
     ★ ★★設計図 追記④「勝手に 引かない」を **社長指示で 上書き** した ところ です
       （★設計図 §5.5「追記②の 例外」・2026-08-31）。
     ★ ★★呼ばれるのは「★すて札が すぐ つかえない」ときだけ ＝ ★引く 場面の 90.3%【実測】。 */
  function autoDraw() {
    if (!g || over || g.cur !== 0 || g.phase !== 'draw') return;
    busy = false;                                /* ★ humanDraw の 入口を 通す */
    humanDraw('stock', true);
  }
  function humanMeld() {
    if (!g || busy || over || g.cur !== 0 || g.phase !== 'play') return;
    clearNew();
    var list = pickList();
    var r = C.doMeld(g, list);
    if (!r.ok) { refreshGo(); return; }
    picks = {};
    busy = true;
    btnGo.classList.add('hidden'); btnPass.classList.add('hidden');
    rebuild();
    if (!toldMeld) { toldMeld = true; say(SAY.meld1); }     /* ★ 場面2 ―― ★起きた あとで よろこぶ */
    later(T.MELD_MOVE, function () { busy = false; refreshPlay(); refreshGo(); });
  }
  /* ★★★ T180・③ ―― ★「場に出す」ボタンが 押された ★★★
     ★ ★① えらんだ 札が 組 → ★場へ 出す
     ★ ★② えらんだ 1枚が 場の 組に 足せる → ★足す（★足せる 先が 2つ以上 なら 組を 押して もらう）
     ★ ★★どちらに するかを 決めて いるのは **人が えらんだ 札** です（★機械は 場所を 探しません）。 */
  function onGo() {
    if (!g || busy || over) return;
    if (ponOn) { humanPon(); return; }            /* ★★ T208 */
    if (g.cur !== 0) return;
    if (g.phase === 'draw') {                    /* ★ ④ すて札を もらう */
      if (!offerOn) return;
      clearNew();
      if (!humanDraw('discard')) nope(btnGo);
      return;
    }
    var k = goKind();
    if (!k) return;
    if (k.k === 'meld') { humanMeld(); return; }
    if (k.k === 'lay') {
      if (k.at.length === 1) { humanLayoff(pickList()[0], k.at[0]); return; }
      /* ★ 足せる 先が 2つ 以上 ―― ★★どこに 足すかは **人が 決めます**（★出せる 組を 押す）*/
      say(SAY.pick1);
    }
  }
  /* ★ 左の ボタン ―― ★「そのまま すすむ」／「すてる」 */
  function onPass() {
    if (!g || busy || over) return;
    if (ponOn) { humanPonPass(); return; }        /* ★★ T208 */
    if (g.cur !== 0) return;
    clearNew();
    if (g.phase === 'draw') {                    /* ★ ④ そのまま すすむ ＝ 山から 引く */
      if (!offerOn) return;
      offerOn = false;
      refreshPlay(); refreshGo();
      humanDraw('stock', true);
      return;
    }
    var list = pickList();
    if (list.length !== 1) return;
    if (!humanDiscard(list[0])) nope(btnPass);
  }
  function humanLayoff(card, mi) {
    if (!g || busy || over || g.cur !== 0 || g.phase !== 'play') return false;
    var r = C.doLayoff(g, card, mi);
    if (!r.ok) return false;
    clearNew();
    delete picks[card];
    busy = true;
    rebuild();
    if (!toldLay) { toldLay = true; say(SAY.lay1); }        /* ★ 場面3 ―― ★★この 動作に 気づく 唯一の 場面 */
    later(T.LAY_MOVE, function () { busy = false; refreshPlay(); refreshGo(); });
    return true;
  }
  function humanDiscard(card) {
    if (!g || busy || over || g.cur !== 0 || g.phase !== 'play') return false;
    var r = C.doDiscard(g, card);
    if (!r.ok) return false;
    clearNew();
    picks = {};
    busy = true;
    offerOn = false;
    btnGo.classList.add('hidden'); btnPass.classList.add('hidden');
    rebuild();
    later(T.DISCARD_MOVE, function () {
      if (!g) return;
      if (g.over) {
        if (g.winner === 0) say(SAY.outMe, 0);
        finishDeal();
        return;
      }
      later(T.TURN_GAP, turnStart);
    });
    return true;
  }
  /* ★ 押した ―― ★えらぶ／えらびを 外す（★ピラミッド式）*/
  function togglePick(c, el) {
    if (!g || busy || over || g.cur !== 0) { nope(el); return; }
    if (g.phase !== 'play') { nope(el); return; }          /* ★ まだ 引いて いない */
    clearNew();
    if (picks[c]) delete picks[c];
    else picks[c] = 1;
    refreshPick();
    refreshPlay();
    refreshGo();
  }

  /* ============================================================
     ★ 1回 おわり ―― ★合計に 足して、点の 画面を 出す
     ============================================================ */
  function finishDeal() {
    if (over) return;
    if (!g || !g.over) return;
    over = true; busy = true;
    picks = {}; offerOn = false;
    clearNew(); refreshPick(); refreshPlay(); refreshGo();
    var pts = g.pts.slice();
    var before = match.total.slice();
    C.addDeal(match, pts);
    save();
    renderScore();
    later(T.RESULT_WAIT, function () { showResult(pts, before); });
  }

  function showResult(pts, before) {
    var fin = match.over;
    var lo = Math.min(pts[0], pts[1], pts[2], pts[3]);
    resultTitle.className = 'result-title';
    /* ★★ つよさは **1回 おわりの 画面にも** 出します（★ハーツ T168・🟡-1 の 直しを 引きつぐ）
       ★ ★設計図 §5.5 の 線引き：★1回 おわりの 画面は「遊んで いる 最中」では ありません。 */
    levelPickResult.classList.remove('hidden');
    if (fin) {
      var iWin = match.winners.indexOf(0) >= 0;
      resultTitle.textContent = iWin ? '勝ち！' : '負け…';
      if (!iWin) resultTitle.className = 'result-title is-quiet';
      /* ★★ 誰が 勝ったか だけ。★なぜ 勝ったかは 言いません（★合計の 表に 数字が 出て います）*/
      resultSay.textContent = (iWin ? SAY_WIN : SAY_LOSE).replace('{名前}', winnerText());
      btnNext.innerHTML = 'もう1回 <b>▶</b>';
    } else {
      resultTitle.textContent = match.dealNo + '回目 おわり';
      resultSay.textContent = (pts[0] === lo) ? SAY_DEAL_ME : SAY_DEAL_OT;
      btnNext.innerHTML = 'つぎへ <b>▶</b>';
    }
    resultScore.innerHTML = resultRows(pts, match.total, g ? g.winner : -1);
    resultWrap.classList.remove('hidden');
    resultBox.classList.add('is-locked');
    later(T.RESULT_LOCK, function () { resultBox.classList.remove('is-locked'); });
  }
  /* ★ 点の 表（★この回 と 合計）
     ★★ T198-2 ―― ★★前は ここに「この回 ×2」の 見出しが ありました。★決まりごと 消しました。 */
  function resultRows(pts, tot, winner) {
    var i, head = '<b></b>';
    for (i = 0; i < 4; i++) head += '<span class="sb-name' + (i === 0 ? ' sb-me' : '') + '">' + seatName(i) + '</span>';
    var row1 = '<b>この回</b>';
    for (i = 0; i < 4; i++) row1 += '<i' + (i === winner ? ' class="sb-out"' : '') + '>' + pts[i] + '</i>';
    var row2 = '<b>合計</b>';
    for (i = 0; i < 4; i++) row2 += '<i>' + tot[i] + '</i>';
    return head + row1 + row2;
  }

  function onNext() {
    resultWrap.classList.add('hidden');
    if (match.over) {
      clearSave();
      match = C.newMatch(match.level, match.deals);   /* ★ T201：★もう1回も 同じ 回戦数で */
    }
    newDeal();
  }

  /* ============================================================
     ★★★ 指の 道 ★★★
     ------------------------------------------------------------
     ★ 設計図 追記④「操作の 形は、そのゲームが 何を する 遊びかで 変わる」：
       | ★遊びの 中身 | ★形 | ★この 1本では |
       |---|---|---|
       | ★2枚以上を **えらんで 組む**（行き先が ない）| ★押して えらぶ | ★★組を 作る |
       | ★札を **運ぶ**（行き先が ある）| ★★ドラッグ | ★★付け札・すてる |
     ★ ★★ソリティア・スパイダーと 同じ 運び方 です（★ルル §2-2 の 3番）。
     ★ ★★ここが この 1本の うまい ところ ―― ★**すてるのが ドラッグ**なので、
        ★ ★毎手番 かならず 1回 運びます。★★その 手が そのまま 付け札の 練習に なって います
          （★ルル §1-4：★付け札に 気づけるかが **12.2ポイント**）。

     ⚠️★★ 指の ポインタは 押した ものに くっつきます（implicit pointer capture）――
        ★ ★だから **はなした 点の 座標から 引き直します**（`hitAt`）。★ページワン T157 の 直し。
     ⚠️★★ 運んで いる 間、★★**落とせる 組を 1つも 光らせません**
        ★ ★（★七並べ 2026-08-24 裁定・ルル §14-1。★★verify ⑬ が 数えます）。
     ============================================================ */
  function hitAt(x, y) {
    if (!(x >= 0) || !(y >= 0) || x > window.innerWidth || y > window.innerHeight) return null;
    var t = document.elementFromPoint(Math.round(x), Math.round(y));
    while (t && t !== stageEl && !(t.classList && (t.classList.contains('card') || t.classList.contains('spot')))) {
      t = t.parentNode;
    }
    return (t && t !== stageEl && t.classList &&
            (t.classList.contains('card') || t.classList.contains('spot'))) ? t : null;
  }
  function nope(t) {
    if (!t) return;
    t.classList.remove('is-no'); void t.offsetWidth; t.classList.add('is-no');
  }
  /* ★ 落とし先を 決める（★場の 組 ／ すて札 ／ どこでも ない）
     ★ ★ここは **落とした あと**に 1回だけ 呼ばれます ―― ★運んで いる 間は 呼びません
       （★呼んで 光らせたら、それが「足せる 札を 光らせる」に なります）。 */
  function dropZone(x, y) {
    var r = stageEl.getBoundingClientRect();
    var px = x - r.left, py = y - r.top;
    var dR = { x: geo.discardX, y: geo.pileTop, w: geo.pw, h: geo.ph };
    var M = 14;
    if (px >= dR.x - M && px <= dR.x + dR.w + M && py >= dR.y - M && py <= dR.y + dR.h + M) {
      return { kind: 'discard' };
    }
    var bestI = -1, bestD = 1e9;
    for (var i = 0; i < tblPos.length; i++) {
      var p = tblPos[i];
      if (!p) continue;
      var L = p.x - 8, R = p.x + p.w + 8, Tp = p.y - 8, B = p.y + p.h + 8;
      if (px < L || px > R || py < Tp || py > B) continue;
      var cx = p.x + p.w / 2, cy = p.y + p.h / 2;
      var d = (px - cx) * (px - cx) + (py - cy) * (py - cy);
      if (d < bestD) { bestD = d; bestI = i; }
    }
    if (bestI >= 0) return { kind: 'meld', at: bestI };
    return null;
  }

  function onDown(e) {
    if (busy || over || !g) return;
    if (e.isPrimary === false) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (drag) return;
    var t = hitAt(e.clientX, e.clientY);
    pressId = null;
    if (!t) return;
    if (t.classList.contains('spot')) { pressId = { spot: t.getAttribute('data-spot'), el: t }; return; }
    var c = t.card;
    if (c === undefined) return;
    pressId = { card: c, el: t, where: t.where };
    /* ★ 自分の 手札 ＋ 出す 番 ―― ★運べます */
    if (t.where === 'me' && g.cur === 0 && g.phase === 'play') {
      var r = stageEl.getBoundingClientRect();
      var q = t.getBoundingClientRect();
      drag = { card: c, el: t, id: e.pointerId, live: false, moved: false,
               sx: e.clientX, sy: e.clientY, rl: r.left, rt: r.top,
               ox: q.left - e.clientX, oy: q.top - e.clientY };
      try { stageEl.setPointerCapture(e.pointerId); } catch (err) {}
    }
  }
  function onMove(e) {
    var d = drag;
    if (!d || e.pointerId !== d.id) return;
    if (!d.live) {
      var dx = e.clientX - d.sx, dy = e.clientY - d.sy;
      if (dx * dx + dy * dy < T.DRAG_SLOP * T.DRAG_SLOP) return;
      d.live = true; d.moved = true;
      d.el.classList.add('is-drag');
    }
    e.preventDefault();
    d.el.style.left = Math.round(e.clientX + d.ox - d.rl) + 'px';
    d.el.style.top = Math.round(e.clientY + d.oy - d.rt) + 'px';
  }
  function onUp(e) {
    var d = drag, pid = pressId;
    pressId = null;
    if (d && e.pointerId === d.id) {
      drag = null;
      try { stageEl.releasePointerCapture(e.pointerId); } catch (err) {}
      if (d.live) {
        d.el.classList.remove('is-drag');
        var z = dropZone(e.clientX, e.clientY);
        var done = false;
        if (z && z.kind === 'discard') done = humanDiscard(d.card);
        else if (z && z.kind === 'meld') done = humanLayoff(d.card, z.at);
        if (!done) {
          /* ★ 置けなかった ―― ★元の 場所へ 戻る ＋ ぷるっと 返す（★「そこは ちがうよ」）
             ★ ★★どこなら 置けるかは 1文字も 教えません（★スパイダー T73 と 同じ 線）。 */
          placeAll(false);
          nope(d.el);
        }
        return;
      }
    }
    if (!pid || busy || over || !g) return;
    var t = hitAt(e.clientX, e.clientY);
    if (!t) { if (pid.el) nope(pid.el); return; }
    /* ★ 山 ／ すて札 を 押した（★札を 押しても 同じ ―― ★山の 札は 山の 一部 です）*/
    var spot = t.classList.contains('spot') ? t.getAttribute('data-spot')
             : (t.where === 'stock' ? 'stock' : (t.where === 'discard' ? 'discard' : null));
    var wantSpot = pid.spot || (pid.where === 'stock' ? 'stock' : (pid.where === 'discard' ? 'discard' : null));
    if (spot && wantSpot === spot) {
      if (g.cur !== 0) { nope(t); return; }
      if (g.phase !== 'draw') { nope(t); return; }
      if (!humanDraw(spot)) nope(t);
      return;
    }
    if (pid.card === undefined) { nope(pid.el); return; }
    if (t.card !== pid.card) { if (pid.el && pid.el.parentNode) nope(pid.el); return; }
    /* ★★ T180 ―― ★1枚 えらんで いる ときに **出せる 組**を 押したら 足す ★★
       ★ ★★足せる 先が 2つ 以上 ある ときの 決め手 です（★どこに 足すかは 人が 決めます）。
       ★ ★★ドラッグでも 同じ ことが できます（★残して あります）。 */
    if (t.where === 'tbl') {
      var one = pickList();
      if (one.length === 1) {
        for (var mi = 0; mi < g.table.length; mi++) {
          if (g.table[mi].cards.indexOf(t.card) < 0) continue;
          if (humanLayoff(one[0], mi)) return;
          break;
        }
      }
      nope(t); return;
    }
    if (t.where !== 'me') { nope(t); return; }
    togglePick(pid.card, t);
  }
  function onCancel(e) {
    if (drag && (!e || e.pointerId === drag.id)) {
      drag.el.classList.remove('is-drag');
      drag = null;
      placeAll(false);
    }
    pressId = null;
  }

  /* ============================================================
     ★ つよさ（★3段・プルダウン 2か所）
     ★ はじめの 画面 と、★1回 おわり／終わった あとの 画面。
     ★ ★★負けた その場で 下げられる ことが、はじめての 人の 逃げ道です。
     ★ 遊んで いる 最中の 画面には 置きません（設計図 §5.5 の 線引き）。
     ============================================================ */
  function fillLevelSelect(sel) {
    sel.innerHTML = '';
    for (var i = 0; i < C.LEVELS.length; i++) {
      var o = document.createElement('option');
      o.value = String(i);
      o.textContent = C.LEVELS[i].label;
      sel.appendChild(o);
    }
    sel.value = String(match ? match.level : C.LEVEL_START);
  }
  /* ============================================================
     ★★★ T201 ―― ★何回戦に するか（★4・8・12・16。★初期値 4）★★★
     ★ ★★入口は **はじめの 画面だけ** です（★試合の 途中で 変えると 合計点の 意味が 壊れます）。
     ★ ★★つよさ（setLevel）と ちがい、★結果の 画面には 出しません。
     ============================================================ */
  function fillDealsSelect(sel) {
    sel.innerHTML = '';
    for (var i = 0; i < C.DEALS_LIST.length; i++) {
      var o = document.createElement('option');
      o.value = String(C.DEALS_LIST[i]);
      o.textContent = C.DEALS_LIST[i] + '回';
      sel.appendChild(o);
    }
    sel.value = String(match ? match.deals : C.DEALS_START);
  }
  function loadDeals() {
    try {
      var v = localStorage.getItem(DL_STORE);
      if (v != null && C.dealsOk(v | 0)) return v | 0;
    } catch (e) {}
    return C.DEALS_START;
  }
  /* ★ 画面の 数字（★はじめるボタンの 小さい 字・★あそびかた ⑥）を そろえます。
     ★ ★★どちらも **数字が 差しかわる だけ** です ―― ★行は 1つも 増えません（★あそびかた 6行の まま）。 */
  function showDeals(d) {
    var a = $('startDeals'), b = $('helpDeals');
    if (a) a.textContent = String(d);
    if (b) b.textContent = d + '回';
  }
  function setDeals(d) {
    d = C.dealsOk(d) ? (d | 0) : C.DEALS_START;      /* ★ 一覧に 無い 数は 4に まるめる */
    /* ⚠️★★ 試合の 途中では 変えません ―― ★入口は はじめの 画面だけ ですが、
       ★ ★★念のため ここでも 止めます（★合計点の 意味が 壊れる ため・ルル）。 */
    if (match && !match.over && match.dealNo > 0) { $('dealsTitle').value = String(match.deals); return; }
    if (match) match.deals = d;
    try { localStorage.setItem(DL_STORE, String(d)); } catch (e) {}
    $('dealsTitle').value = String(d);
    showDeals(d);
  }
  function setLevel(i) {
    i = Math.max(0, Math.min(C.LEVELS.length - 1, i | 0));
    if (match) match.level = i;
    try { localStorage.setItem(LV_STORE, String(i)); } catch (e) {}
    $('levelTitle').value = String(i);
    $('levelResult').value = String(i);
    saveLevelOnly();          /* ★★ つよさだけ。★合計と 回数は さわりません（★ハーツ T168・🔴-1）*/
    refreshResume();
  }
  function loadLevel() {
    try {
      var v = localStorage.getItem(LV_STORE);
      if (v != null && C.LEVELS[v | 0]) return v | 0;
    } catch (e) {}
    return C.LEVEL_START;
  }

  /* ============================================================
     ★ 立ち上げ
     ============================================================ */
  function build() {
    if (built) return;
    built = true;
    stageEl.addEventListener('pointerdown', onDown);
    stageEl.addEventListener('pointermove', onMove);
    stageEl.addEventListener('pointerup', onUp);
    stageEl.addEventListener('pointercancel', onCancel);
    stageEl.addEventListener('lostpointercapture', onCancel);
    stageEl.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    stageEl.addEventListener('dragstart', function (e) { e.preventDefault(); });
    btnGo.addEventListener('click', onGo);
    btnPass.addEventListener('click', onPass);
    /* ★★ T205-6 ―― ★押せない ボタンを 押した ときの 手ごたえ（★click は 来ないので pointerup）★★ */
    btnGo.addEventListener('pointerup', function () { if (btnGo.disabled) pressedDead('go'); });
    btnPass.addEventListener('pointerup', function () { if (btnPass.disabled) pressedDead('pass'); });
  }
  function start(resume) {
    var lv = match ? match.level : loadLevel();
    if (resume) {
      /* ★★ T201 ―― ★★続きは **しまって ある 回戦数** で 続けます（★いま 選んで いる 数では ない）
         ★ ★★途中で 回戦数が 変わると 合計点の 意味が 壊れる ため（★ルル）。 */
      var o = load();
      match = C.newMatch(o ? o.lv : lv, o ? o.dl : loadDeals());
      if (o) { match.total = o.t.slice(); match.dealNo = o.d; }
    } else {
      clearSave();
      match = C.newMatch(lv, loadDeals());
    }
    showDeals(match.deals);
    titleScreen.classList.add('hidden');
    playScreen.classList.remove('hidden');
    build();
    layout();
    newDeal();
  }
  function backToTitle() {
    resultWrap.classList.add('hidden');
    playScreen.classList.add('hidden');
    titleScreen.classList.remove('hidden');
    clearTimers(); dropCards(); g = null; over = false; busy = true;
    refreshResume();
  }
  function refreshResume() {
    var o = load();
    var btn = $('btnResume');
    if (o) {
      btn.classList.remove('hidden');
      $('resumeAt').textContent = o.d + ' / ' + o.dl + '回 おわり ／ あなた ' + o.t[0] + '点';
    } else btn.classList.add('hidden');
  }

  function boot() {
    titleScreen = $('titleScreen'); playScreen = $('playScreen');
    stageEl = $('stage'); cardsEl = $('cards');
    zoneBots = $('zoneBots'); scoreBand = $('scoreBand'); feltTable = $('feltTable');
    spotStock = $('spotStock'); spotDiscard = $('spotDiscard');
    btnGo = $('btnGo'); btnPass = $('btnPass'); sayEl = $('say');
    resultWrap = $('resultWrap'); resultBox = $('resultBox');
    resultTitle = $('resultTitle'); resultSay = $('resultSay'); resultScore = $('resultScore');
    levelPickResult = $('levelPickResult'); btnNext = $('btnNext');
    botEl = [$('bot1'), $('bot2'), $('bot3')];

    match = C.newMatch(loadLevel(), loadDeals());
    fillLevelSelect($('levelTitle'));
    fillLevelSelect($('levelResult'));
    fillDealsSelect($('dealsTitle'));                 /* ★ T201：★はじめの 画面だけ */
    showDeals(match.deals);
    $('levelTitle').addEventListener('change', function () { setLevel(this.value | 0); });
    $('levelResult').addEventListener('change', function () { setLevel(this.value | 0); });
    $('dealsTitle').addEventListener('change', function () { setDeals(this.value | 0); });
    $('btnStart').addEventListener('click', function () { start(false); });
    $('btnResume').addEventListener('click', function () { start(true); });
    btnNext.addEventListener('click', onNext);
    $('btnHowto').addEventListener('click', function () { $('helpDialog').showModal(); });
    var cl = document.querySelectorAll('[data-close]');
    for (var i = 0; i < cl.length; i++) {
      cl[i].addEventListener('click', function (e) { $(e.currentTarget.getAttribute('data-close')).close(); });
    }
    window.addEventListener('resize', function () { if (geo) layout(); });
    window.addEventListener('orientationchange', function () { if (geo) layout(); });
    warmStart();
    refreshResume();
    stageEl.style.visibility = 'hidden';
    build(); measure(); layout();
    stageEl.style.visibility = '';
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* ============================================================
     ★★ たしかめの 窓口（既存18本と 同じ 作法。★画面には 1つも 出ない）★★
     ============================================================ */

  /* ★ 測る ときは 動きを 止める（★会社で 4回 かかった わな）*/
  function still(fn) {
    document.body.classList.add('measuring');
    void document.body.offsetWidth;
    var r;
    try { r = fn(); } finally { document.body.classList.remove('measuring'); }
    return r;
  }
  function handText(hand) {
    var a = [];
    for (var i = 0; i < hand.length; i++) a.push(C.nameOf(hand[i]));
    return a.join(' ');
  }
  function meldText(m) {
    var a = [];
    for (var i = 0; i < m.cards.length; i++) a.push(C.nameOf(m.cards[i]));
    return (m.t === 's' ? '組' : '並び') + '[' + a.join(' ') + ']';
  }
  function tableText() {
    if (!g || !g.table.length) return '（なし）';
    var a = [];
    for (var i = 0; i < g.table.length; i++) a.push(meldText(g.table[i]));
    return a.join(' ／ ');
  }

  function now() {
    var list = pickList(), a = [], i;
    for (i = 0; i < list.length; i++) a.push(C.nameOf(list[i]));
    return {
      '★つよさ': levelNow().label,
      '★何回目': match ? (Math.min(match.deals, match.dealNo + 1) + '回目 / ' + match.deals + '回') : '―',
      '★いま': g ? (g.over ? '1回 おわり' : (g.phase === 'draw' ? '引く' : '出す・すてる')) : '―',
      '★手番': g ? (g.over ? '終わり' : seatName(g.cur)) : '―',
      '★いま 押せるか': (g && !g.over && !over && !busy && g.cur === 0) ? 'はい' : 'いいえ',
      '★自分の 手札': g ? handText(g.hands[0]) : '―',
      '★えらんで いる 札': a.length ? a.join(' ') : '（なし）',
      '★★「出す」が 押せるか': (btnGo && !btnGo.disabled) ? 'はい' : 'いいえ',
      '★場の 組': tableText(),
      '★場の 大きさ': g ? (g.table.length + '組 / ' + (function () {
        var n = 0; for (var k = 0; k < g.table.length; k++) n += C.meldLen(g.table[k]); return n;
      })() + '枚') : '―',
      '★山': g ? g.stock.length + '枚' : '―',
      '★すて札': g ? (g.discard.length + '枚（上 ' + (g.discard.length ? C.nameOf(g.discard[g.discard.length - 1]) : '―') + '）') : '―',
      '★みんなの 手札': g ? (g.hands[0].length + ' / ' + g.hands[1].length + ' / ' + g.hands[2].length + ' / ' + g.hands[3].length) : '―',
      '★合計': match ? match.total.join(' / ') : '―',
      '★混ぜ直した 回数': g ? g.st.reshuffles : '―',
      '★わくの 札': cardsEl ? cardsEl.querySelectorAll('.card.is-pick').length + '枚' : '―',
      '★札': geo ? (geo.cw + '×' + geo.ch + 'px ／ 場 ' + (pack ? pack.tw : geo.tw) + 'px') : '―',
      '★読めた 絵': warmDone + ' / ' + ALL_NAMES.length + (warmErr ? ('（読めず ' + warmErr + '）') : '')
    };
  }

  /* ★ 種を 固定する（★同じ 試合を 何度でも）*/
  function seed(n) {
    seedFixed = (n | 0) || 0;
    return { '★種': seedFixed || '（毎回 ちがう）', '★次の 1回から 効きます': true };
  }

  function geoInfo() {
    return still(function () {
      var r = stageEl.getBoundingClientRect();
      return {
        '画面': window.innerWidth + '×' + window.innerHeight,
        '器の中身': geo.W + '×' + geo.H,
        '★自分の 札': geo.cw + '×' + geo.ch + 'px',
        '★★手札 8枚の 見えて いる はば': geo.pitch.toFixed(1) + 'px（★札の ' + (geo.pitch / geo.cw * 100).toFixed(0) + '%）',
        '★44pxに 対して': (geo.cw / 44 * 100).toFixed(0) + '%',
        '★ロボットの 札': geo.bw + '×' + geo.bh + 'px（ずらし ' + geo.bstep + 'px・1人 ' + geo.botOne + 'px）',
        '★山・すて札': geo.pw + '×' + geo.ph + 'px（★44pxに 対して ' + (geo.pw / 44 * 100).toFixed(0) + '%）',
        '★★場の 台': geo.feltH + 'px（内 ' + geo.innerW + '×' + geo.innerH + '）',
        '★★場の 札': (pack ? pack.tw : geo.tw) + 'px（★ふだんの 上限 ' + geo.tw + 'px）' +
                      (pack ? '／' + pack.rows.length + '行・ずらし ' + pack.step + 'px' + (pack.tight ? '★詰め' : '') : '／（場は 空）'),
        '★点の 帯': geo.scoreH + 'px（字 ' + geo.sbNum + 'px／名前 ' + geo.sbName + 'px）',
        'ロボットの 帯': geo.botH + 'px（上 ' + geo.botTop + 'px）',
        '自分の 帯': geo.meH + 'px（上 ' + geo.meTop + 'px）',
        '★すきま': geo.pad + 'px × ' + geo.nGap + 'つ',
        '★結果の 箱の 天井': getComputedStyle(document.documentElement).getPropertyValue('--result-max').trim(),
        'ページ縦スクロール': document.documentElement.scrollHeight > window.innerHeight,
        'ページ横スクロール': document.documentElement.scrollWidth > window.innerWidth,
        'stage': Math.round(r.width) + '×' + Math.round(r.height)
      };
    });
  }

  /* ★ 走らせる（★遊ぶ 側と 同じ core を 通ります）
     ★ opt.mode … 'match'（★4回 配って 合計点・初期値）／ 'deal'（★1回 配る ぶん）*/
  function autoPlay(n, opt) {
    n = n || 1000; opt = opt || {};
    var mode = opt.mode || 'match';
    var lv = C.LEVELS[opt.level == null ? (match ? match.level : C.LEVEL_START) : opt.level];
    var hu = C.HUMANS[opt.human == null ? 3 : opt.human];
    var t0 = Date.now();
    var st = C.runMany(n, opt.seed || 4649, [hu.o, lv.o, lv.o, lv.o], opt.rules || rules, mode, opt.deals);
    /* ⚠️★★ ここも 空回りして いました【★トライが 見つけました・T205-4】――
       ★ ★★machineMs() に **手番を 渡して いません** でした。
       ★ ★★＝ ★いつも 決め打ちの 25.4手番 で 計算し、★★前も 後も 同じ 分数を 返して いました。
       ★ ★★（★「3.6分 → 3.2分」は 別の 道具で 出した 数字 なので 正しい ですが、
         ★ ★★この 口で 測ろうと した 人は だまされます）*/
    var dealsN = (mode === 'match') ? (opt.deals || (match ? match.deals : C.LIM.DEALS)) : 1;
    var turnsPerDeal = st.games ? (st.turns / st.games / dealsN) : 25.4;
    var one = C.machineMs(turnsPerDeal) / 1000;
    var out = {
      '数えかた': (mode === 'match' ? ('★' + (opt.deals || C.LIM.DEALS) + '回 配って 合計点') : '1回 配る ぶん'),
      '回数': st.games,
      '★ロボットの つよさ': lv.label, '★人の 打ち手': hu.label,
      '★★反則・札の 数ちがい': st.illegal + '件',
      '★流れ（誰も 上がれない）': (st.nofin / st.games * 100).toFixed(2) + '%',
      '★人が 勝つ': (st.win / st.games * 100).toFixed(2) + '%（★五分 25.0%）',
      '★自分の 点': (st.pts / st.games).toFixed(1),
      '★手番 まん中': C.pct(st.turnList, 0.5) + '／9割 ' + C.pct(st.turnList, 0.9) + '／99% ' + C.pct(st.turnList, 0.99),
      '★★手札の 最大': st.handMax + '枚',
      '★★場の 大きさ（組）': 'まん中 ' + C.pct(st.meldList, 0.5) + '／9割 ' + C.pct(st.meldList, 0.9) + '／最大 ' + st.melds,
      '★★場の 大きさ（枚）': 'まん中 ' + C.pct(st.cardList, 0.5) + '／9割 ' + C.pct(st.cardList, 0.9) + '／最大 ' + st.tblCards,
      '★いちばん 長い 組': st.widest + '枚',
      '★★長さ【見立て】': '1回 ' + (one + 33.1).toFixed(1) + '秒（★機械 ' + one.toFixed(1) +
        '秒 ＋ 人 6.4手×4.0秒 ＋ 点の 画面 2.5秒）／★1試合 ' +
        (((one + 33.1) * dealsN) / 60).toFixed(1) + '分（★1回 ' + turnsPerDeal.toFixed(1) + '手番 で 計算）',
      'かかった 時間': (Date.now() - t0) + 'ms'
    };
    console.log('[セブンブリッジ] autoPlay', out);
    return out;
  }

  /* ★ つよさ 3段 × 人の 分かり具合（★ルル T173 §12-1 の 表を 本物の core で）*/
  function rates(n, mode) {
    n = n || 800; mode = mode || 'match';
    var out = { '数えかた': (mode === 'match' ? '★4回 配って 合計点' : '1回 配る ぶん'), '回数': n + '（各マス）' };
    for (var hi = 0; hi < 4; hi++) {
      var row = [];
      for (var li = 0; li < C.LEVELS.length; li++) {
        var st = C.runMany(n, 246810, [C.HUMANS[hi].o, C.LEVELS[li].o, C.LEVELS[li].o, C.LEVELS[li].o], null, mode);
        row.push(C.LEVELS[li].label + ' ' + (st.win / st.games * 100).toFixed(2) + '%');
      }
      out[C.HUMANS[hi].label] = row.join('　');
    }
    console.log('[セブンブリッジ] rates', out);
    return out;
  }

  /* ============================================================
     ★ はみ出し・画面外を 測る
     ============================================================ */
  /* ⚠️★ `.back` は **かならず .topbar で しぼる** こと ―― ★札の うら面の 絵も `img.back` です
     （★ページワン T152 で 60件の 誤りの もとに なりました）。 */
  var TOUCH_SEL = '.topbar .back,.howto,.start-button,.sub-button,.dialog-ok,.close-dialog,.act-btn,.level-select';
  function measureOnce() {
    var r = stageEl.getBoundingClientRect();
    var out = { over: 0, off: 0, offName: [], small: 0, outName: [],
                scrollX: document.documentElement.scrollWidth > window.innerWidth,
                scrollY: document.documentElement.scrollHeight > window.innerHeight };
    for (var id in cardEl) {
      if (!cardEl.hasOwnProperty(id)) continue;
      var e = cardEl[id];
      if (!e.parentNode) continue;
      var q = e.getBoundingClientRect();
      var d = Math.max(Math.round(r.left - q.left), Math.round(r.top - q.top),
                       Math.round(q.right - r.right), Math.round(q.bottom - r.bottom));
      if (d > out.over) { out.over = d; out.outName = [e.where + ':' + e.cardName]; }
    }
    out.over = Math.max(0, out.over);
    var list = document.querySelectorAll(TOUCH_SEL);
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (!el.offsetParent && el.tagName !== 'BODY') continue;
      var q2 = el.getBoundingClientRect();
      if (q2.width === 0 || q2.height === 0) continue;
      if (q2.left < -0.5 || q2.top < -0.5 || q2.right > window.innerWidth + 0.5 || q2.bottom > window.innerHeight + 0.5) {
        out.off++; out.offName.push(el.className || el.tagName);
      }
      if (q2.width < 43.5 || q2.height < 43.5) out.small++;
    }
    return out;
  }

  /* ★★★ 手札 8枚 ―― ★1枚ずつ **まん中を さして、その 札が 返るか** ★★★
     ★ ★トライ T153 🟡-1【実測】：★見えて いる はばが 札の 半分を 切ると まん中が かくれる。
     ★ ★式では なく **本物で** 数えます。 */
  function handHit() {
    var okN = 0, n = g ? g.hands[0].length : 0, i, bad = [];
    for (i = 0; i < n; i++) {
      var e = cardEl[g.hands[0][i]];
      if (!e) { bad.push(i); continue; }
      var q = e.getBoundingClientRect();
      var got = hitAt(q.left + q.width / 2, q.top + q.height / 2);
      if (got === e) okN++; else bad.push(i);
    }
    return { n: n, ok: okN, bad: bad };
  }
  /* ★★★ 場の 組 ―― ★1組ずつ **いちばん 左の 札の まん中を さして 当たるか** ★★★
     ★ ★★これが「触る ところが 画面に 残って いるか」の 本物の ものさし です（★追記③）。 */
  function meldHit() {
    var okN = 0, n = g ? g.table.length : 0, i, bad = [];
    for (i = 0; i < n; i++) {
      var c = g.table[i].cards[0];
      var e = cardEl[c];
      if (!e) { bad.push(i); continue; }
      var q = e.getBoundingClientRect();
      var st = stageEl.getBoundingClientRect();
      var inStage = (q.left >= st.left - 0.5 && q.right <= st.right + 0.5 &&
                     q.top >= st.top - 0.5 && q.bottom <= st.bottom + 0.5);
      var z = dropZone(q.left + Math.min(q.width, 10) / 2 + 2, q.top + q.height / 2);
      if (inStage && z && z.kind === 'meld') okN++; else bad.push(i);
    }
    return { n: n, ok: okN, bad: bad };
  }

  /* ============================================================
     ★★★ 山・すて札の「指の 的」を 本物の 指で 測る（★44px は 会社の 決まり）★★★
     ★ ★見た目の 大きさでは なく ―― ★★**まん中から 外へ 何px まで 当たるか** を 数えます。
       ★ ★★横向きでは 絵が 29px しか ありません。★当たりだけ 広げて あります（CSS の .spot::after）。
     ============================================================ */
  function spotProbe() {
    var out = { rows: [], why: [] };
    still(function () {
      [['山', spotStock], ['すて札', spotDiscard]].forEach(function (sp) {
        var el = sp[1], q = el.getBoundingClientRect();
        var cx = q.left + q.width / 2, cy = q.top + q.height / 2;
        function reach(dx, dy) {
          var d = 0;
          for (var s = 1; s <= 40; s++) {
            var hx = cx + dx * s, hy = cy + dy * s;
            if (hx < 0 || hy < 0 || hx > window.innerWidth || hy > window.innerHeight) break;
            /* ⚠️★ `document.elementFromPoint` を そのまま 見ては いけません ――
               ★ ★返って くるのは 札の **中身**（.card-in や img）です【★私の 失敗⑧】。
               ★ ★★遊ぶ 側と 同じ `hitAt` を 通します（★目を 1つに して おく）。 */
            var t = hitAt(hx, hy);
            var want = (el === spotStock ? 'stock' : 'discard');
            var ok = !!(t && (t === el ||
                        (t.getAttribute && t.getAttribute('data-spot') === want) ||
                        (t.classList && t.classList.contains('card') && t.where === want)));
            if (!ok) break;
            d = s;
          }
          return d;
        }
        var w = reach(-1, 0) + reach(1, 0), h = reach(0, -1) + reach(0, 1);
        out.rows.push(sp[0] + ' 絵 ' + Math.round(q.width) + '×' + Math.round(q.height) +
                      'px ／ ★当たり ' + w + '×' + h + 'px');
        if (w < 43.5 || h < 43.5) {
          out.why.push('★★★' + sp[0] + ' の 指の 的が ' + w + '×' + h +
                       'px（★44px 以上 の はず ―― ★★山は 毎手番 押す ところ です）');
        }
      });
    });
    return out;
  }

  /* ★★ 場面を 作る どうぐ ―― ★組を 何個・何枚 でも 並べた 場を 作ります ★★
     ★ ★53枚は 1枚も 増やさず・減らさず 保ちます。 */
  function fakeTable(counts, rd) {
    var used = {}, table = [], i, k;
    function take(c) { if (used[c]) return false; used[c] = 1; return true; }
    var rank = 1, suit = 0, lo = 2;
    for (i = 0; i < counts.length; i++) {
      var n = Math.max(3, Math.min(13, counts[i]));
      var m = null, cards = [], ok = true;
      if (n <= 4) {                                  /* ★ 組（同じ 数字）*/
        while (rank <= 13) {
          cards = []; ok = true;
          for (k = 0; k < n; k++) { var c = k * 13 + (rank - 1); if (used[c]) { ok = false; break; } cards.push(c); }
          if (ok) break;
          rank++;
        }
        if (!ok || rank > 13) continue;
        for (k = 0; k < cards.length; k++) take(cards[k]);
        var su = [false, false, false, false];
        for (k = 0; k < cards.length; k++) su[C.suitOf(cards[k])] = true;
        m = { t: 's', rank: rank, suits: su, jk: 0, n: n, owner: 1, cards: cards };
        rank++;
      } else {                                       /* ★ 並び（同じ マークの つづいた 数字）*/
        var tryN = 0;
        while (tryN++ < 60) {
          cards = []; ok = true;
          if (lo + n - 1 > 13) { lo = 2; suit = (suit + 1) % 4; }
          for (k = 0; k < n; k++) { var c2 = suit * 13 + (lo + k - 1); if (used[c2]) { ok = false; break; } cards.push(c2); }
          if (ok) break;
          lo += 1;
          if (lo + n - 1 > 13) { lo = 2; suit = (suit + 1) % 4; }
        }
        if (!ok) continue;
        for (k = 0; k < cards.length; k++) take(cards[k]);
        m = { t: 'r', suit: suit, lo: lo, hi: lo + n - 1, jk: 0, owner: 1, cards: cards };
        lo += n + 1;
      }
      if (m) table.push(m);
    }
    /* ★ のこりを 山・すて札・手札に 配り直す（★53枚 きっちり）*/
    var rest = [];
    for (i = 0; i < 53; i++) if (!used[i]) rest.push(i);
    for (i = rest.length - 1; i > 0; i--) {
      var j = (rd() * (i + 1)) | 0, t = rest[i]; rest[i] = rest[j]; rest[j] = t;
    }
    return { table: table, rest: rest };
  }
  /* ★★ その 札を 自分の 手札へ 入れかえる（★53枚は 1枚も 増やさず・減らさず 保ちます）★★
     ⚠️★★ はじめ「★山の 中だけ」から さがして いました ―― ★★見つからない ことが あり、
        ★ ★★見張りが「試し方が おかしい」と 鳴りました【★私の 失敗④・作業メモ §5】。
        ★ ★★機能は 生きて いたのに、★試し方の せいで 鳴って いた ―― ★★書き分けが 効いた 例 です。 */
  function bringToHand(c) {
    if (!g) return false;
    if (g.hands[0].indexOf(c) >= 0) return true;
    if (!g.hands[0].length) return false;
    var back = g.hands[0].pop(), k, p;
    k = g.stock.indexOf(c);
    if (k >= 0) { g.stock.splice(k, 1, back); g.hands[0].push(c); return true; }
    k = g.discard.indexOf(c);
    if (k >= 0) { g.discard.splice(k, 1, back); g.hands[0].push(c); return true; }
    for (p = 1; p < 4; p++) {
      k = g.hands[p].indexOf(c);
      if (k >= 0) { g.hands[p].splice(k, 1, back); g.hands[0].push(c); return true; }
    }
    g.hands[0].push(back);
    return false;
  }
  /* ★ 場の mi番目の 組に 合う 札を 1枚 見つけて、★自分の 手札へ 入れかえる */
  function bringFitFor(mi) {
    if (!g || !g.table[mi]) return -1;
    var m = g.table[mi], i, j;
    for (i = 0; i < 53; i++) {
      if (!C.tableFits(m, i)) continue;
      var inTbl = false;
      for (j = 0; j < g.table.length; j++) if (g.table[j].cards.indexOf(i) >= 0) inTbl = true;
      if (inTbl) continue;
      if (bringToHand(i)) return i;
    }
    return -1;
  }
  function makeScene(counts, handN, rd) {
    if (!g) return false;
    var f = fakeTable(counts, rd || C.rng(31337));
    g.table = f.table;
    var rest = f.rest.slice();
    g.hands[0] = rest.splice(0, Math.min(handN || 8, rest.length));
    for (var p = 1; p < 4; p++) g.hands[p] = rest.splice(0, Math.min(7, rest.length));
    g.discard = rest.splice(0, Math.min(3, rest.length));
    g.stock = rest;
    g.cur = 0; g.phase = 'play'; g.over = false;
    var n = g.stock.length + g.discard.length, i;
    for (i = 0; i < 4; i++) n += g.hands[i].length;
    for (i = 0; i < g.table.length; i++) n += C.meldLen(g.table[i]);
    if (built && geo) rebuild();          /* ★ 表・裏も そろえる（★手で 呼ぶ ときの ため）*/
    return n === 53;
  }

  /* ★★ はみ出し しらべ（設計図 追記③）★★
     ★ ★★ふだんの 形（5組・19枚）から まれな 形（★★10組・25枚・1組14枚）まで まぜて 測ります。 */
  var SCENES = [
    { n: '★5組19枚（ふだんの形）', c: [3, 4, 3, 5, 4] },
    { n: '3組11枚',               c: [3, 4, 4] },
    { n: '6組23枚',               c: [3, 4, 3, 5, 4, 4] },
    { n: '7組25枚',               c: [3, 4, 3, 5, 4, 3, 3] },
    { n: '★8組25枚（99%の外）',   c: [3, 3, 3, 3, 3, 3, 3, 4] },
    /* ★★★ T198 ―― ★7が 1枚でも 出せる ように なって、★★場の 組が 増えました ★★★
       ★ ★【実測・4万回 配る】：★組 4.7 → **5.6**（★99% 7 → **8**・★いちばん 多い 8 → **10**）。
       ★ ★★下の 2つは **本当に 出た 形** です（★私が 手で 作った 形 では ありません）：
         ★ ★・10組25枚 …… [1,3,3,1,1,3,4,3,3,3]（★1枚の 7の 組が 3つ）＝ ★4万回に 8回（0.02%）
         ★ ★・1組14枚 …… [14,4]（★A から K ＋ 上の A）
       ★ ★★札の 枚数は 25枚の まま です ―― ★★増えたのは「組の 数」だけ。 */
    { n: '★★10組25枚（T198・いちばん多い）', c: [1, 3, 3, 1, 1, 3, 4, 3, 3, 3] },
    { n: '★1組14枚（いちばん長い）', c: [14, 4] },
    { n: '空っぽ',                c: [] }
  ];
  function fitTest(n) {
    n = n || 140;
    var rd = C.rng(90909), worst = 0, worstAt = '', offTotal = 0, smallTotal = 0, names = {}, sx = 0, sy = 0;
    var hitBad = 0, hitTot = 0, mBad = 0, mTot = 0, tightN = 0;
    var keepG = g, keepBusy = busy, keepOver = over, keepPicks = picks;
    var kTitleHid = titleScreen.classList.contains('hidden');
    var kPlayHid = playScreen.classList.contains('hidden');
    titleScreen.classList.add('hidden');
    playScreen.classList.remove('hidden');
    if (!match) match = C.newMatch(C.LEVEL_START);
    build(); layout();
    still(function () {
      for (var k = 0; k < n; k++) {
        dropCards();
        picks = {};
        g = C.makeGame(rd, { rules: rules, dealNo: k % 4, startP: k % 4 });
        for (var i = 0; i < 53; i++) makeCard(i, false);
        var sc = SCENES[k % SCENES.length];
        makeScene(sc.c, 8, rd);
        /* ★★★ T180 ―― ★★2つの ボタンを **出したまま** 測ります ★★★
           ★ ★★ボタンは いつも 出て いる ように なりました（★社長指示⑤）。
             ★ ★★かくして 測ったら、★「ボタンが 場の 組を かくして いる」を 1度も 見つけられません。
           ★ ★★これが 会社で 5回 やった わな です（★T155・T168・T171・T174・ここ）。 */
        busy = false; over = false;
        g.cur = 0; g.phase = 'play'; g.over = false;
        if (k % 3 === 0 && g.hands[0].length >= 3) {
          picks[g.hands[0][0]] = 1; picks[g.hands[0][1]] = 1; picks[g.hands[0][2]] = 1;
        }
        rebuild();
        placeAll(true);
        refreshGo();
        if (pack && pack.tight) tightN++;
        var m = measureOnce();
        if (m.over > worst) { worst = m.over; worstAt = sc.n + '：' + (m.outName[0] || ''); }
        offTotal += m.off; smallTotal += m.small;
        for (var q = 0; q < m.offName.length; q++) names[m.offName[q]] = 1;
        if (m.scrollX) sx++;
        if (m.scrollY) sy++;
        var hh = handHit(); hitTot += hh.n; hitBad += (hh.n - hh.ok);
        var mh = meldHit(); mTot += mh.n; mBad += (mh.n - mh.ok);
      }
    });
    dropCards();
    picks = keepPicks; g = keepG; busy = keepBusy; over = keepOver;
    if (kTitleHid) titleScreen.classList.add('hidden'); else titleScreen.classList.remove('hidden');
    if (kPlayHid) playScreen.classList.add('hidden'); else playScreen.classList.remove('hidden');
    if (g) { for (var z = 0; z < 53; z++) if (!cardEl[z]) makeCard(z, false); rebuild(); placeAll(true); }
    var out = {
      '画面': window.innerWidth + '×' + window.innerHeight,
      '★札': geo.cw + '×' + geo.ch + 'px（★見えて いる はば ' + geo.pitch.toFixed(1) + 'px）',
      '調べた場面': n + '（★5組19枚〜★★10組25枚・1組14枚・空っぽ）',
      '★はみ出し（一番 大きい）': worst + 'px' + (worst ? '（' + worstAt + '）' : ''),
      '★押す ところが 画面外': offTotal + '件',
      '★44pxより 小さい ボタン': smallTotal + '件',
      '★★手札の まん中を さして 当たらなかった': hitBad + ' / ' + hitTot + '枚',
      '★★場の 組を さして 当たらなかった': mBad + ' / ' + mTot + '組',
      '★静かに 詰めた 場面': tightN + ' / ' + n,
      '横スクロールが 出た場面': sx, '縦スクロールが 出た場面': sy
    };
    if (offTotal) out['画面外に 出た もの'] = Object.keys(names);
    console.log('[セブンブリッジ] fitTest', out);
    return out;
  }

  /* ============================================================
     ★★★ 手を 教えて いないか（★ハーツ T168 の 見かたを 引きつぐ）★★★
     ------------------------------------------------------------
     ★ 手を 教える 文は かならず ★★**①札を 名ざしして ②どう しろと 言う**。
       ★ ★どちらか 片方だけ なら 教えて いません：
         ★ ★「山か すて札から 1枚 引こう」…… ★札を 名ざして いない（★決まりの 言い方）→ ○
         ★ ★「7は 0点」……………………………… ★名ざして いるが「どう しろ」が 無い → ○
         ★ ★★「7は のこそう」………………………… ★★両方 ある → ✕
     ★ ★空白・句読点・「！」を ぜんぶ 取ってから くらべます（★「！」1文字で すり抜けた T166 の 直し）。
     ============================================================ */
  function flatText(s) { return String(s).replace(/[\s　。、,.!?！？…‥・「」『』（）()]/g, ''); }
  /* ⚠️★★ 「数字なら 何でも 札の 名ざし」に したら、★★自分の 見張りが 空うちしました
        ―― ★「1回 おわる ごとに **やめ**られる」の「1」＋「やめ」で 鳴りました【★私の 失敗②】。
     ★ → ★★**札の 数字だけ**（7・10・絵札・A）に しぼり、★★数え言葉（枚・回・人・点…）が
       ★ 後ろに 来る ものは 外します。★これで「7は のこそう」は 鳴り、「1回」は 鳴りません。 */
  var NUM_NG = '(?![枚回人点組行番位つ本目段度])';
  var TEACH_CARD = 'スペード|ハート|ダイヤ|クローバー|[♠♥♦♣]|クイーン|キング|エース|ジャック' +
                   '|ジョーカー|この札|その札|この1枚|その1枚|点の札|高い札|低い札|大きい札|小さい札' +
                   '|[QKAJ]' + NUM_NG + '|7' + NUM_NG + '|10' + NUM_NG;
  var TEACH_ADVICE = 'ほうがい|ほうがよ|のこそ|のこして|残そ|残して|ためて|とっておこ|取っておこ' +
                     '|すてよう|すてた|捨てよう|えらぼ|選ぼ|ねらお|狙お|つかお|使お|だそう|出そう' +
                     '|ださない|出さない|すてない|やめ|気をつけ|きをつけ|注意|ちゅうい|あぶな|危な' +
                     '|しないで|だめ|いらない|要らない|そろうよ|そろえよ|足せる|たせる';
  var TEACH_ALONE = ['おすすめ', 'オススメ', 'すすめ', 'ヒント', 'コツ', 'あと1枚', '上がれます', '上がれるよ', 'そろうよ'];
  /* ★★ ルル T173 §14-1 の 表の 文 そのもの（★★これが 通ったら 見張りは 死んで います）*/
  var TEACH_RULU = ['その3枚がそろうよ', '7は残しておこう', 'Aは早く捨てよう', 'この札を捨てるといいよ',
                    'すて札を取ったほうが得', '上がれます'];
  function teachHit(s) {
    var f = flatText(s), out = [], i, m;
    var re = new RegExp('(' + TEACH_CARD + ')[^]{0,14}?(' + TEACH_ADVICE + ')', 'g');
    while ((m = re.exec(f))) { out.push(m[0]); if (re.lastIndex <= m.index) re.lastIndex = m.index + 1; }
    for (i = 0; i < TEACH_ALONE.length; i++) if (f.indexOf(TEACH_ALONE[i]) >= 0) out.push(TEACH_ALONE[i]);
    for (i = 0; i < TEACH_RULU.length; i++) if (f.indexOf(TEACH_RULU[i]) >= 0) out.push('★ルルの 禁句：' + TEACH_RULU[i]);
    return out;
  }
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
  /* ★ 札の 上の 文字（★点の 数字は 別に 数えます）*/
  function cardWords(el) {
    var out = '', list = el.querySelectorAll('.card'), i;
    for (i = 0; i < list.length; i++) {
      var c = list[i].cloneNode(true);
      var pt = c.querySelectorAll('.pt');
      for (var j = 0; j < pt.length; j++) pt[j].parentNode.removeChild(pt[j]);
      out += readableText(c);
    }
    return out;
  }

  /* ============================================================
     ★★ CSS の 決まりを ぜんぶ 集める ★★
     ⚠️★★ **まず 拾い、それから（中身が ある ときだけ）もぐる** こと。
        ★ `if (r.cssRules) { walk(...); continue; }` と 書くと **1つも 集まりません**
          ―― ★★見張りが 丸ごと 死にます（★ページワン T152 で 実際に 起きた）。
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
     ★ 場面を 作る／もどす どうぐ
     ============================================================ */
  function snapG() {
    if (!g) return null;
    var s = { hands: [], table: C.cloneTable(g.table), stock: g.stock.slice(), discard: g.discard.slice() }, p;
    for (p = 0; p < 4; p++) s.hands.push(g.hands[p].slice());
    ['phase', 'cur', 'over', 'winner', 'turn', 'lastDiscard', 'drawGame'].forEach(function (k) { s[k] = g[k]; });
    s.pts = g.pts ? g.pts.slice() : null;
    return s;
  }
  function restoreG(s) {
    if (!g || !s) return;
    for (var p = 0; p < 4; p++) g.hands[p] = s.hands[p].slice();
    g.table = C.cloneTable(s.table);
    g.stock = s.stock.slice(); g.discard = s.discard.slice();
    ['phase', 'cur', 'over', 'winner', 'turn', 'lastDiscard', 'drawGame'].forEach(function (k) { g[k] = s[k]; });
    g.pts = s.pts ? s.pts.slice() : null;
  }
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
  /* ★★ 押して・運んで・はなす（★本物の 3つの できごとを そのまま 通す）★★ */
  function dragDom(el, fromX, fromY, toX, toY) {
    function mk(type, px, py) {
      var o = { bubbles: true, cancelable: true, clientX: px, clientY: py,
                pointerId: 2, isPrimary: true, pointerType: 'touch' };
      try { return new PointerEvent(type, o); }
      catch (e) {
        var ev = document.createEvent('Event'); ev.initEvent(type, true, true);
        ev.clientX = px; ev.clientY = py; ev.pointerType = 'touch'; return ev;
      }
    }
    el.dispatchEvent(mk('pointerdown', fromX, fromY));
    stageEl.dispatchEvent(mk('pointermove', (fromX + toX) / 2, (fromY + toY) / 2));
    stageEl.dispatchEvent(mk('pointermove', toX, toY));
    stageEl.dispatchEvent(mk('pointerup', toX, toY));
  }

  /* ============================================================
     ★★★ ⑬ 線を こえて いないか ―― ★この 1本の いちばん 大事な 見張り ★★★
     ------------------------------------------------------------
     ★ ルル §14-1 の 表：
       | ★画面が やって よい | ★★やっては いけない |
       | 選んだ 札が 組か たしかめる | ★★「そろう 3枚」を さがして 見せる・光らせる |
       | 付け札が 合って いるか 判定する | ★★足せる 札を 光らせる |
       | 札の すみに 点を 書く | ★★「7は のこそう」 |
       | 手札を 人が 並べかえられる | ★★組が できる 順に 勝手に 並べかえる |
       | 点を 数える・配る・混ぜ直す | ★★上がれる ことを 先に 教える |
     ★ ★3つの 目で 見ます：
       ★ ★① ★★**本物の 場面**で 印を 数える（★そろう 3枚を 手札に 仕込んでも 0印）
       ★ ★② ★★**運んで いる 最中**に 印を 数える（★落とせる 組を 光らせて いないか）
       ★ ★③ ★★**行を 走査**する（★画面側の 関数が `enumMelds` を 呼んで いないか）
     ============================================================ */
  function lineProbe() {
    var out = { idleMarks: -1, dragMarks: -1, killMarks: -1, backMarks: -1, killRings: '―',
                words: '―', sorted: '―', ok: 0, why: [] };
    if (!g || !cardsEl || !geo || !built) { out.why.push('★立ち上がって いない'); return out; }
    var snap = snapG();
    var kBusy = busy, kOver = over, kPicks = picks;
    var kSay = sayEl.classList.contains('hidden');
    still(function () {
      /* ★ ① ★★そろう 3枚（クローバー3・ダイヤ3・ハート3）と、
             ★★場の 組に ぴったり 足せる 1枚を **わざと 手札に 入れます**。
         ★ ★★それでも 印は 0個 で なければ なりません。 */
      busy = false; over = false; picks = {};
      g.phase = 'play'; g.cur = 0; g.over = false;
      sayEl.classList.add('hidden');
      if (!makeScene([3, 4, 3, 5, 4], 8, C.rng(24680))) { out.why.push('★★試し方が おかしい：場面を 作れない'); return; }
      /* ★ 場の 1組目に 足せる 札を 1枚 手札へ（★53枚は 保った まま 入れかえ）*/
      var fit = bringFitFor(0);
      if (fit < 0) { out.why.push('★★試し方が おかしい：★足せる 札を 手札に 入れられなかった'); return; }
      g.phase = 'play'; g.cur = 0;
      rebuild(); placeAll(true);
      /* ★★★★ T180 ―― ★★ここは **向きが 逆に なりました** ★★★★
         ★ ★前は「印が 0個 で ない と 鳴る」。★★いまは「★★0個 だったら 鳴る」。
         ★ ★★場面には ★足せる 1枚（`fit`）を わざと 入れて あるので、★出せる しるしは
           ★ ★★**必ず 1枚 以上** 出なければ なりません。 */
      out.idleMarks = cardsEl.querySelectorAll('.card.is-play').length;
      if (out.idleMarks < 1) {
        out.why.push('★★★★足せる 1枚を わざと 手札に 入れたのに、★★出せる しるしが 1つも 出ません ' +
                     '（★社長指示②・設計図 §5.5「追記②の 例外」2026-08-31 ―― ★★消さないで ください）');
      }
      /* ★ ★「えらんで いないのに えらんだ しるし」は いまも 出ては いけません */
      var wrongPick = cardsEl.querySelectorAll('.card.is-pick').length;
      if (wrongPick !== 0) {
        out.why.push('★★★人が 1枚も 押して いない のに えらんだ しるしが ' + wrongPick + '個 付いて います');
      }
      /* ★★ わざと 消して 鳴る ことを 見せる（★アイの ご注文・T180）★★ */
      var kill = cardsEl.querySelectorAll('.card.is-play'), ki;
      for (ki = 0; ki < kill.length; ki++) kill[ki].classList.remove('is-play');
      out.killMarks = cardsEl.querySelectorAll('.card.is-play').length;
      out.killRings = (out.killMarks === 0) ? '○ 剥がしたら 0個 ＝ 見張りは 鳴ります' : '★★✕ 剥がせない';
      refreshPlay();
      out.backMarks = cardsEl.querySelectorAll('.card.is-play').length;
      if (out.backMarks < 1) out.why.push('★★★出せる しるしを 剥がしたら 戻って きません（★試し方が おかしい）');
      out.words = cardWords(cardsEl);
      if (out.words) out.why.push('★★札の 上に（点の 数字 いがいの）文字が ある：' + out.words);
      /* ============================================================
         ★★★ T203 ―― ★★手札の ならびは「決まった 順」か。★★「組が できる 順」では ないか ★★★
         ------------------------------------------------------------
         ★ ★T202 まで ここは「★引いた 札が いちばん 右に 来て いるか」を 見て いました。
           ★ ★★社長ご指示で **いつも マーク順・数字順に そろえる** ように なった ので、
             ★ ★★引いた 札は 右はしに 来ません。★★この 目は 作り直しました。
         ★ ★★見るのは 2つ ―― ★どちらも「無い ことを 数える」形に して いません：
           ★ ★① ★★中身に よらない **決まった 順**に なって いるか
             ★ ★（★クローバー→ダイヤ→ハート→スペード、その 中で A→K、ジョーカーは 右はし）
           ★ ★② ★★**同じ 数字 3枚を わざと 入れて、★となり合わない ことを 見る**
             ★ ★★＝ ★「組が できる 順」に なって いたら、3枚は くっつきます。★★離れて いれば 別 です。
         ============================================================ */
      var kHand = g.hands[0].slice();
      /* ★ ① ★★わざと ばらばらに して、★★決まった 順に なる ことを 見る（★空うちで ない ことも 一緒に）*/
      var mix = [3 * 13 + 12, 0 * 13 + 0, 2 * 13 + 6, 52, 1 * 13 + 4, 0 * 13 + 9, 3 * 13 + 1];
      /* ★ ♣A(0) ♣10(9) ♦5(17) ♥7(32) ♠2(40) ♠K(51) JOKER(52) の 順（★決まって います）
         ⚠️★★ ここの 数を 私は 1つ 書きまちがえました（★♠K を 45 と 書いた ―― ★45 は ♠7）。
            ★ ★★見張りが その場で 鳴らして くれました【★私の 失敗・作業メモ §5】。
            ★ ★★手で 計算した 数を 見張りに 書く ときは、★★必ず 1回 走らせて 確かめる こと。 */
      var mixWant = '0,9,17,32,40,51,52';
      g.hands[0] = mix.slice();
      sortMyHand();
      var got = g.hands[0].join(',');
      var moved = (got !== mix.join(','));
      var inOrder = (got === mixWant);
      /* ★ ② ★同じ 数字 3枚（★クローバー3・ダイヤ3・ハート3）を わざと 入れて、★となり合わない ことを 見る */
      var set3 = [0 * 13 + 2, 1 * 13 + 2, 2 * 13 + 2];
      var pool = [], z;
      for (z = 0; z < 53; z++) if (set3.indexOf(z) < 0) pool.push(z);
      g.hands[0] = set3.concat(pool.slice(0, 5));
      sortMyHand();
      var at = set3.map(function (c) { return g.hands[0].indexOf(c); }).sort(function (a, b) { return a - b; });
      var glued = (at[0] >= 0 && at[2] >= 0 && at[2] - at[0] === 2);   /* ★ 3枚が ぴったり つづく ＝ 組の 順 */
      g.hands[0] = kHand;
      /* ★ ③ ★★引く 道が 本当に 並べ直しを 通って いるか（★行を 走査。★humanLayoff/doLayoff と 同じ 手）*/
      var wired = String(humanDraw).indexOf('sortMyHand') >= 0;
      out.sorted = (inOrder ? '○ 決まった 順' : '★★✕ 決まった 順で ない（' + got + '）') +
                   '／' + (moved ? '○ ばらばらを 直した（★空うちで ない）' : '★★✕ 動いて いない') +
                   '／' + (glued ? '★★✕ 同じ 数字 3枚が となり合う（★組が できる 順）'
                                 : '○ 同じ 数字 3枚は 離れる ' + at.join('・') + '（★組の 順では ない）') +
                   '／' + (wired ? '○ 引く 道が 通って いる' : '★★✕ 引く 道が 通って いない');
      if (!inOrder) {
        out.why.push('★★★手札が 決まった 順（マーク→数字）に なりません' +
                     '（★出た ' + got + ' ／ ★決まった 順 ' + mixWant + '）');
      }
      if (!moved) {
        out.why.push('★★★並べ直しが 空うちして います（★ばらばらを 入れても 1枚も 動きません）');
      }
      if (glued) {
        out.why.push('★★★★同じ 数字 3枚が となり合って います ―― ★★「組が できる 順に 並べかえる」' +
                     '＝ 設計図 追記② 違反 です（★★この 1本で いちばん 重い 21.6ポイントを 奪います）');
      }
      if (!wired) {
        out.why.push('★★★引いた あとに 並べ直して いません（★humanDraw が sortMyHand を 呼んで いません）');
      }

      /* ★ ② ★★運んで いる 最中 ―― ★落とせる 組を 光らせて いないか */
      if (fit >= 0) {
        var el = cardEl[fit];
        var q = el.getBoundingClientRect();
        var tp = tblPos[0];
        var st = stageEl.getBoundingClientRect();
        var tx = st.left + tp.x + 8, ty = st.top + tp.y + tp.h / 2;
        function mk(type, px, py) {
          var o = { bubbles: true, cancelable: true, clientX: px, clientY: py,
                    pointerId: 3, isPrimary: true, pointerType: 'touch' };
          try { return new PointerEvent(type, o); } catch (e2) {
            var ev = document.createEvent('Event'); ev.initEvent(type, true, true);
            ev.clientX = px; ev.clientY = py; ev.pointerType = 'touch'; return ev;
          }
        }
        el.dispatchEvent(mk('pointerdown', q.left + q.width / 2, q.top + q.height / 2));
        stageEl.dispatchEvent(mk('pointermove', tx, ty));
        /* ★ 運んで いる 最中に **新しく** 光る ものが 出て いないか
           ★ ★（★出せる しるしは 運ぶ 前から 出て います ―― ★ここで 数えるのは それ 以外）*/
        out.dragMarks = cardsEl.querySelectorAll('.is-hint,.is-glow,.is-ok,.is-fit,.is-here,.is-can,.is-target').length +
                        stageEl.querySelectorAll('.spot.is-hint,.spot.is-ok,.spot.is-can').length;
        if (out.dragMarks !== 0) {
          out.why.push('★★★運んで いる 最中に 新しい 印が ' + out.dragMarks +
                       '個 出て います（★運びの 途中は 前と 同じ 線の まま です）');
        }
        stageEl.dispatchEvent(mk('pointercancel', tx, ty));
        onCancel({ pointerId: 3 });
      }
      out.ok = 1;
    });
    picks = kPicks;
    restoreG(snap);
    busy = kBusy; over = kOver;
    if (kSay) sayEl.classList.add('hidden'); else sayEl.classList.remove('hidden');
    if (g) { rebuild(); placeAll(true); }
    return out;
  }

  /* ============================================================
     ★★★ ⑭ 人が さわれるか（★ルル §18 コーダ⑥）★★★
     ------------------------------------------------------------
     ★ ★「人の 番なのに、押せる ものが 1つも 無い」場面を 作れないか。
     ★ ★★「起きない はず」を そのまま 出しません ―― ★★本物の 指の 道で 通します。
     ★ ★見る 場面は 3つ：★引く 場面／★出す 場面／★★山も すて札も 空に なりかけた 場面。
     ============================================================ */
  function reachProbe() {
    var out = { cases: 0, dead: 0, why: [], detail: [] };
    if (!g || !cardsEl || !geo || !built) { out.why.push('★立ち上がって いない'); return out; }
    var snap = snapG();
    var kBusy = busy, kOver = over, kPicks = picks;
    var kResult = resultWrap.classList.contains('hidden');
    var tMark = timers.length;

    var CASES = [
      ['★引く 場面', function () { g.phase = 'draw'; g.cur = 0; g.over = false; }],
      ['★出す 場面', function () { g.phase = 'play'; g.cur = 0; g.over = false; }],
      ['★★山が 1枚（引いたら 混ぜ直す）', function () {
        g.phase = 'draw'; g.cur = 0; g.over = false;
        while (g.stock.length > 1) g.discard.push(g.stock.pop());
      }],
      ['★★すて札が 1枚だけ', function () {
        g.phase = 'draw'; g.cur = 0; g.over = false;
        while (g.discard.length > 1) g.stock.push(g.discard.pop());
      }]
    ];
    still(function () {
      CASES.forEach(function (cs) {
        restoreG(snap);
        busy = false; over = false; picks = {};
        resultWrap.classList.add('hidden');
        cs[1]();
        rebuild(); placeAll(true);
        out.cases++;
        var was = { h: g.hands[0].length, ph: g.phase, d: g.discard.length, pk: pickCount() };
        var pts = [], i, q, e;
        for (i = 0; i < g.hands[0].length; i++) {
          e = cardEl[g.hands[0][i]];
          if (!e) continue;
          q = e.getBoundingClientRect();
          pts.push([q.left + q.width / 2, q.top + q.height / 2]);
        }
        q = spotStock.getBoundingClientRect(); pts.push([q.left + q.width / 2, q.top + q.height / 2]);
        q = spotDiscard.getBoundingClientRect(); pts.push([q.left + q.width / 2, q.top + q.height / 2]);
        var moved = 0;
        for (i = 0; i < pts.length; i++) {
          var el = hitAt(pts[i][0], pts[i][1]);
          if (!el) continue;
          tapDom(el, pts[i][0], pts[i][1]);
          if (g.hands[0].length !== was.h || g.phase !== was.ph || pickCount() !== was.pk) { moved = 1; break; }
        }
        out.detail.push(cs[0] + '：さわれた 所 ' + pts.length + '／' + (moved ? '★動いた ○' : '★★1ミリも 動かない ✕'));
        if (!pts.length) { out.dead++; out.why.push(cs[0] + ' ―― ★★押す ものが 1つも ない'); }
        else if (!moved) { out.dead++; out.why.push(cs[0] + ' ―― ★★ぜんぶ 押しても 1ミリも 動かない'); }
      });
    });
    for (var t = timers.length - 1; t >= tMark; t--) { clearTimeout(timers[t]); timers.splice(t, 1); }
    picks = kPicks;
    restoreG(snap);
    busy = kBusy; over = kOver;
    if (kResult) resultWrap.classList.add('hidden'); else resultWrap.classList.remove('hidden');
    if (g) { rebuild(); placeAll(true); }
    return out;
  }

  /* ============================================================
     ★★★ ⑮ 運ぶ（付け札・すてる）が 本物の 指で 通るか ★★★
     ★ ★① 合う 組へ 落とす → ★乗る
     ★ ★② 合わない 組へ 落とす → ★★乗らない ＋ ぷるっと 返す
     ★ ★③ すて札へ 落とす → ★手番が おわる
     ★ ★④ 何も ない ところへ 落とす → ★戻る ＋ ぷるっと 返す
     ============================================================ */
  function dragProbe() {
    var out = { fit: '―', unfit: '―', discard: '―', nowhere: '―', why: [] };
    if (!g || !cardsEl || !geo || !built) { out.why.push('★立ち上がって いない'); return out; }
    var snap = snapG();
    var kBusy = busy, kOver = over, kPicks = picks;
    var tMark = timers.length;
    var st = stageEl.getBoundingClientRect();

    function scene() {
      restoreG(snap);
      busy = false; over = false; picks = {};
      if (!makeScene([3, 4, 3, 5, 4], 8, C.rng(1357))) return null;
      /* ★ 場の 1組目に 合う 札を 1枚 手札へ */
      var fit = bringFitFor(0);
      if (fit < 0) return null;
      /* ★ 合わない 札も 1枚 見つける */
      var m0 = g.table[0], unfit = -1, i;
      for (i = 0; i < g.hands[0].length; i++) if (!C.tableFits(m0, g.hands[0][i])) { unfit = g.hands[0][i]; break; }
      rebuild(); placeAll(true);
      return { fit: fit, unfit: unfit };
    }
    function meldXY(mi) {
      var p = tblPos[mi];
      return [st.left + p.x + Math.min(p.w, 12) / 2, st.top + p.y + p.h / 2];
    }
    function cardXY(c) {
      var q = cardEl[c].getBoundingClientRect();
      return [q.left + q.width / 2, q.top + q.height / 2];
    }
    still(function () {
      /* ★ ① 合う 組へ */
      var s = scene();
      if (!s) { out.why.push('★★試し方が おかしい：★合う 札の 場面を 作れなかった'); return; }
      var n0 = C.meldLen(g.table[0]), h0 = g.hands[0].length;
      var a = cardXY(s.fit), b = meldXY(0);
      dragDom(cardEl[s.fit], a[0], a[1], b[0], b[1]);
      out.fit = (C.meldLen(g.table[0]) === n0 + 1 && g.hands[0].length === h0 - 1) ? '○ 乗った' : '★★✕ 乗らない';
      if (out.fit !== '○ 乗った') out.why.push('★★★合う 札を 場の 組に 落としたのに 乗りません（★付け札が 効いて いません）');

      /* ★ ② 合わない 組へ ―― ★乗らない ＋ ぷるっ */
      s = scene();
      if (!s || s.unfit < 0) { out.why.push('★★試し方が おかしい：★合わない 札を 見つけられなかった'); return; }
      n0 = C.meldLen(g.table[0]); h0 = g.hands[0].length;
      cardEl[s.unfit].classList.remove('is-no');
      a = cardXY(s.unfit); b = meldXY(0);
      dragDom(cardEl[s.unfit], a[0], a[1], b[0], b[1]);
      var stay = (C.meldLen(g.table[0]) === n0 && g.hands[0].length === h0);
      out.unfit = stay ? (cardEl[s.unfit].classList.contains('is-no') ? '○ 戻って ぷるっ' : '★✕ 返事が ない') : '★★✕ 乗って しまう';
      if (!stay) out.why.push('★★★合わない 札が 場の 組に 乗って しまいました（★決まりが 効いて いません）');
      else if (!cardEl[s.unfit].classList.contains('is-no')) {
        out.why.push('★★合わない 札を 落としても 1回も ゆれません（★遊ぶ人には 壊れたと 見分けが つきません）');
      }

      /* ★ ③ すて札へ ―― ★手番が おわる */
      s = scene();
      if (!s) { out.why.push('★★試し方が おかしい：★3回目の 場面を 作れなかった'); return; }
      h0 = g.hands[0].length;
      var dn = g.discard.length;
      a = cardXY(s.fit);
      var dq = spotDiscard.getBoundingClientRect();
      dragDom(cardEl[s.fit], a[0], a[1], dq.left + dq.width / 2, dq.top + dq.height / 2);
      out.discard = (g.hands[0].length === h0 - 1 && g.discard.length === dn + 1 && (g.cur !== 0 || g.over))
        ? '○ すてて 手番が おわった' : '★★✕ すてられない';
      if (out.discard !== '○ すてて 手番が おわった') {
        out.why.push('★★★すて札へ 落としても すてられません（★★手番が おわりません ＝ 遊びが 止まります）');
      }

      /* ★ ④ 何も ない ところ ―― ★戻る ＋ ぷるっ */
      s = scene();
      if (!s) { out.why.push('★★試し方が おかしい：★4回目の 場面を 作れなかった'); return; }
      h0 = g.hands[0].length;
      cardEl[s.fit].classList.remove('is-no');
      a = cardXY(s.fit);
      dragDom(cardEl[s.fit], a[0], a[1], st.left + 6, st.top + geo.scoreTop + 2);
      out.nowhere = (g.hands[0].length === h0)
        ? (cardEl[s.fit].classList.contains('is-no') ? '○ 戻って ぷるっ' : '★✕ 返事が ない')
        : '★★✕ 消えた';
      if (g.hands[0].length !== h0) out.why.push('★★★何も ない ところに 落としたら 札が 消えました');
    });
    for (var t = timers.length - 1; t >= tMark; t--) { clearTimeout(timers[t]); timers.splice(t, 1); }
    var a2 = cardsEl.querySelectorAll('.card.is-no,.card.is-drag');
    for (var i2 = 0; i2 < a2.length; i2++) a2[i2].classList.remove('is-no', 'is-drag');
    picks = kPicks;
    restoreG(snap);
    busy = kBusy; over = kOver;
    if (g) { rebuild(); placeAll(true); }
    return out;
  }

  /* ============================================================
     ★★★ ⑯ 「出す」ボタン ―― ★組の ときだけ 押せるか ★★★
     ★ ★① そろって いない 3枚 → ★出ない
     ★ ★② そろった 3枚（同じ 数字）→ ★出る
     ★ ★③ そろった 3枚（同じ マークの つづいた 数字）→ ★出る
     ★ ★④ ★★手札 ぜんぶ を えらんだ → ★出ない（★すてる 1枚が なくなる）
     ============================================================ */
  function goProbe() {
    var out = { bad: '―', set: '―', run: '―', all: '―', played: '―', why: [],
                bothBtn: '―', bothLay: '―', bothGo: '―', bothKill: '―', bothCut: '―' };
    if (!g || !geo || !built) { out.why.push('★立ち上がって いない'); return out; }
    var snap = snapG();
    var kBusy = busy, kOver = over, kPicks = picks;
    var tMark = timers.length;
    still(function () {
      restoreG(snap);
      busy = false; over = false;
      g.phase = 'play'; g.cur = 0; g.over = false;
      /* ★ 手札を わざと 作ります（★53枚は 保った まま 入れかえ）*/
      var set3 = [0 * 13 + 2, 1 * 13 + 2, 2 * 13 + 2];          /* ★ 3が 3枚 */
      var run3 = [3 * 13 + 5, 3 * 13 + 6, 3 * 13 + 7];          /* ★ スペードの 6・7・8 */
      var other = [1 * 13 + 12, 2 * 13 + 9];
      var want = set3.concat(run3).concat(other);
      var rest = [], i;
      for (i = 0; i < 53; i++) if (want.indexOf(i) < 0) rest.push(i);
      g.hands[0] = want.slice();
      g.table = [];
      g.hands[1] = rest.splice(0, 7); g.hands[2] = rest.splice(0, 7); g.hands[3] = rest.splice(0, 7);
      g.discard = rest.splice(0, 2);
      g.stock = rest;
      rebuild(); placeAll(true);

      picks = {}; picks[set3[0]] = 1; picks[run3[0]] = 1; picks[other[0]] = 1;
      refreshGo();
      out.bad = btnGo.disabled ? '○ 出ない' : '★★✕ 出て しまう';
      if (!btnGo.disabled) {
        out.why.push('★★★そろって いない 3枚で「出す」が 押せます（★決まりが 効いて いません）');
      }
      picks = {}; picks[set3[0]] = 1; picks[set3[1]] = 1; picks[set3[2]] = 1;
      refreshGo();
      out.set = btnGo.disabled ? '★★✕ 出ない' : '○ 出る';
      if (btnGo.disabled) out.why.push('★★★同じ 数字 3枚で「出す」が 出ません');
      picks = {}; picks[run3[0]] = 1; picks[run3[1]] = 1; picks[run3[2]] = 1;
      refreshGo();
      out.run = btnGo.disabled ? '★★✕ 出ない' : '○ 出る';
      if (btnGo.disabled) out.why.push('★★★同じ マークの つづいた 数字 3枚で「出す」が 出ません');

      /* ============================================================
         ★★★ ⑯-2 ―― ★★T198：★7は 1枚でも 出せるか ★★★
         ------------------------------------------------------------
         ★ 本物の 決まり（任天堂 ④）：「1枚だけでも公開することができます」
           ★ ★「7と6、7と8、このように7があれば、2枚だけでもシークエンスとして公開できます」
         ★ ★★社長の ご指摘で 見つかった 落としもの です（★ルル T197 §14 失敗1）。
         ★ ★見るのは 5つ：
           ★ ★① 7が 1枚 → ★出る　② 7＋6 → ★出る　③ 7＋8 → ★出る
           ★ ★④ ★7いがいの 1枚 → ★出ない　⑤ ★7が ない 2枚 → ★出ない
         ★ ★★そして ―― ★★わざと 決まりを 外して、★「7が 1枚で 出せなく なる」ことを その場で 見せます。
         ============================================================ */
      var s7 = run3[1], s6 = run3[0], s8 = run3[2];         /* ★ スペードの 7・6・8 */
      function goTry(cs) {
        picks = {};
        for (var q = 0; q < cs.length; q++) picks[cs[q]] = 1;
        refreshGo();
        return !btnGo.disabled;
      }
      out.seven1 = goTry([s7]) ? '○ 出る' : '★★✕ 出ない';
      if (btnGo.disabled) {
        out.why.push('★★★★7が 1枚で「出す」が 押せません（★本物の 決まり・T198・社長の ご指摘 ' +
                     '―― ★★「1枚だけでも公開することができます」）');
      }
      out.seven67 = goTry([s6, s7]) ? '○ 出る' : '★★✕ 出ない';
      if (btnGo.disabled) out.why.push('★★★7＋6 の 2枚で「出す」が 押せません（★T198）');
      out.seven78 = goTry([s7, s8]) ? '○ 出る' : '★★✕ 出ない';
      if (btnGo.disabled) out.why.push('★★★7＋8 の 2枚で「出す」が 押せません（★T198）');
      out.one = goTry([set3[0]]) ? '★★✕ 出て しまう' : '○ 出ない';
      if (!btnGo.disabled) out.why.push('★★★7 いがいの 札 1枚で「出す」が 押せて しまいます（★T198）');
      out.two = goTry([set3[0], set3[1]]) ? '★★✕ 出て しまう' : '○ 出ない';
      if (!btnGo.disabled) out.why.push('★★★7を ふくまない 2枚で「出す」が 押せて しまいます（★T198）');
      /* ★★ わざと 決まりを 外して 鳴る ことを 見せる（★㉕-2 と 同じ 形）★★ */
      killSeven = true;
      var killOff = !goTry([s7]);
      killSeven = false;
      var killBack = goTry([s7]);
      out.sevenKill = (killOff && killBack)
        ? '○ 決まりを 外すと 出なく なる ＝ 見張りは 鳴ります（★戻すと また 出る）'
        : '★★✕ 外しても 変わらない（★★この 見張りは 空うちして います）';
      if (!killOff || !killBack) {
        out.why.push('★★★「7は 1枚でも 出せる」の 見張りが 空うちして います ' +
                     '（★決まりを 外しても 同じ 返事 ―― ★★見張りとしては 死んで います）');
      }
      /* ============================================================
         ★★★★ ⑯-3 ―― ★★T203：★「足す」も「1枚で 出す」も **両方 えらべる**か ★★★★
         ------------------------------------------------------------
         ★ ★社長の ご指摘の 場面を そのまま 作ります ――
           ★ ★★場に **ハートの7 が 1枚だけ** 出て いる ／ ★手札に **スペードの7**
         ★ ★見るのは 3つ：
           ★ ★① ★★ボタンが 押せて、★字が **「1枚で 出す」**に なって いる（★足すのと 別の 名前）
           ★ ★② ★★出せる しるしが ハートの7に 付いて いる（★★押せば 足せる ＝ もう 1つの 道）
           ★ ★③ ★★ボタンを 押したら **新しい 組**が できる（★ハートの7に 乗らない）
         ★ ★★そして ―― ★★わざと 片方を 殺して、★鳴る ことを その場で 見せます。
         ============================================================ */
      var h7 = 2 * 13 + 6, s7b = 3 * 13 + 6;        /* ★ ハートの7 ／ スペードの7 */
      (function () {
        var w2 = [s7b, set3[0], set3[1], other[0]], rest3 = [], q;
        for (q = 0; q < 53; q++) if (w2.indexOf(q) < 0 && q !== h7) rest3.push(q);
        g.hands[0] = w2.slice();
        g.hands[1] = rest3.splice(0, 7); g.hands[2] = rest3.splice(0, 7); g.hands[3] = rest3.splice(0, 7);
        g.discard = rest3.splice(0, 2); g.stock = rest3;
        g.table = [C.makeMeld([h7], 1)];            /* ★ ハートの7 が 1枚で 場に 出て いる */
        sortMyHand();
        picks = {}; picks[s7b] = 1;
        rebuild(); placeAll(true); refreshPlay(); refreshGo();
        /* ★★ ボタンの 字が わくから はみ出して いないか（★はみ出すと「1枚で…」と 切れます）★★
           ★ ★★4つ ぜんぶ 見ます ―― ★1枚で出す／場に出す／すてる／もらう。 */
        var cut = [], lbl;
        var kTxt = btnGo.textContent, kTxt2 = btnPass.textContent;
        ['1枚で出す', '場に出す', 'もらう'].forEach(function (t) {
          btnGo.textContent = t;
          if (btnGo.scrollWidth > btnGo.clientWidth + 0.5) cut.push(t + '(' + btnGo.scrollWidth + '>' + btnGo.clientWidth + ')');
        });
        ['すてる', 'そのまま'].forEach(function (t) {
          btnPass.textContent = t;
          if (btnPass.scrollWidth > btnPass.clientWidth + 0.5) cut.push(t + '(' + btnPass.scrollWidth + '>' + btnPass.clientWidth + ')');
        });
        btnGo.textContent = kTxt; btnPass.textContent = kTxt2;
        out.bothCut = cut.length ? '★★✕ 字が 切れる：' + cut.join('・') : '○ 5つとも 切れない';
        if (cut.length) {
          out.why.push('★★★ボタンの 字が わくから はみ出して います：' + cut.join('・') +
                       '（★★遊ぶ人には「1枚で…」と 切れて 見えます）');
        }
        out.bothBtn = (!btnGo.disabled && btnGo.textContent.indexOf('1枚') >= 0)
          ? '○ 「' + btnGo.textContent + '」' : '★★✕ ' + (btnGo.disabled ? '押せない' : btnGo.textContent);
        if (btnGo.disabled) {
          out.why.push('★★★★場の 7に「足す」しか できません ―― ★★1枚で 出す 道が ありません（★社長ご指摘・T203）');
        } else if (btnGo.textContent.indexOf('1枚') < 0) {
          out.why.push('★★★2つ 道が あるのに ボタンの 字が「' + btnGo.textContent +
                       '」の まま です（★どちらを するか 分かりません）');
        }
        var lit = cardEl[h7] && cardEl[h7].classList.contains('is-play');
        out.bothLay = lit ? '○ 場の 7に 出せる しるし（★押せば 足せる）' : '★★✕ 出せる しるしが 出ない';
        if (!lit) {
          out.why.push('★★★★場の 7に 出せる しるしが 出ません ―― ★★「足す」道が 見えません（★T203）');
        }
        /* ★ ③ ★ボタンを 押す → ★★新しい 組が できる（★場の 組が 1 → 2）*/
        var t0b = g.table.length;
        btnGo.click();
        out.bothGo = (g.table.length === t0b + 1 && C.meldLen(g.table[t0b]) === 1)
          ? '○ 新しい 組に なった' : '★★✕ ' + (g.table.length === t0b ? '出ない' : '足されて しまった');
        if (g.table.length !== t0b + 1) {
          out.why.push('★★★「1枚で 出す」を 押したのに 新しい 組に なりません（★足されて います・T203）');
        }
        busy = false;
        btnGo.classList.remove('hidden'); btnPass.classList.remove('hidden');
        /* ★★ わざと 片方を 殺す ―― ★「足す 先」を 見つけない ように して、★字が 戻る ことを 見る ★★ */
        g.hands[0] = w2.slice(); g.table = [C.makeMeld([h7], 1)];
        sortMyHand(); picks = {}; picks[s7b] = 1;
        rebuild(); placeAll(true);
        var keepFits = fitMelds;
        try {
          fitMelds = function () { return []; };     /* ★★ 「足せる 先」を 殺す */
          refreshGo();
          var killed = btnGo.textContent;
          fitMelds = keepFits;
          refreshGo();
          out.bothKill = (killed.indexOf('1枚') < 0 && btnGo.textContent.indexOf('1枚') >= 0)
            ? '○ 「足す」道を 殺すと 字が「' + killed + '」に 戻る ＝ 見張りは 鳴ります'
            : '★★✕ 殺しても 字が 変わらない（' + killed + '）';
          if (!(killed.indexOf('1枚') < 0 && btnGo.textContent.indexOf('1枚') >= 0)) {
            out.why.push('★★★「両方 えらべる」の 目が 空うちして います（★片方を 殺しても 同じ 返事）');
          }
        } catch (e) { fitMelds = keepFits; out.bothKill = '★★✕ ' + e.message; }
        picks = {};
      })();

      /* ★ ★本物の ボタンで 7を 1枚 出して、★★本当に 場へ 出るか */
      picks = {}; picks[s7] = 1;
      var t7 = g.table.length, h7 = g.hands[0].length;
      refreshGo();
      btnGo.click();
      out.sevenPlayed = (g.table.length === t7 + 1 && g.hands[0].length === h7 - 1 &&
                         C.meldLen(g.table[t7]) === 1)
        ? '○ 7が 1枚で 場に 出た' : '★★✕ 出ない';
      if (g.table.length !== t7 + 1) out.why.push('★★★7を 1枚 えらんで 押しても 場に 出ません（★T198）');
      /* ★ 場を 元に もどす（★見張りは 見るだけ・★T144 §7-5）
         ★ ★★`btnGo.click()` は 中で `busy = true` に します ―― ★ここで 戻さないと
           ★ ★★この 下の 試しが ぜんぶ「押せない」に なり、★★見張りが 空うちします。 */
      g.hands[0] = want.slice();
      g.table = [];
      picks = {};
      busy = false;
      btnGo.classList.remove('hidden'); btnPass.classList.remove('hidden');
      rebuild(); placeAll(true);

      /* ★ ④ 手札 ぜんぶ（★すてる 1枚が なくなる 出し方）*/
      g.hands[0] = set3.slice();
      picks = {}; picks[set3[0]] = 1; picks[set3[1]] = 1; picks[set3[2]] = 1;
      rebuild(); placeAll(true); refreshGo();
      out.all = btnGo.disabled ? '○ 出ない' : '★★✕ 出て しまう';
      if (!btnGo.disabled) {
        out.why.push('★★★手札 ぜんぶを 出せて しまいます（★すてる 1枚が なくなり、手番が おわりません）');
      }
      /* ★ 本物の ボタンを 押して、★本当に 場へ 出るか */
      g.hands[0] = want.slice();
      g.table = [];
      picks = {}; picks[set3[0]] = 1; picks[set3[1]] = 1; picks[set3[2]] = 1;
      rebuild(); placeAll(true); refreshGo();
      var t0 = g.table.length;
      btnGo.click();
      out.played = (g.table.length === t0 + 1 && g.hands[0].length === want.length - 3)
        ? '○ 場に 出た' : '★★✕ 出ない';
      if (g.table.length !== t0 + 1) out.why.push('★★★「出す」を 押しても 場に 出ません');
    });
    for (var t = timers.length - 1; t >= tMark; t--) { clearTimeout(timers[t]); timers.splice(t, 1); }
    picks = kPicks;
    restoreG(snap);
    busy = kBusy; over = kOver;
    if (g) { rebuild(); placeAll(true); refreshGo(); }
    return out;
  }

  /* ★★ 結果の 箱・つよさの えらび（★ハーツ T165／T168 と 同じ 形）★★ */
  function resultProbe() {
    /* ⚠️★★ **札を 並べてから** 測ります【★私の 失敗⑥ の 直しの 直し】★★
       ★ ★はじめ ここは 配りたての 場面（★場が 空・手札は 下）で 測って いました ――
         ★ ★★だから「箱が 札の 下に かくれる」を わざと 作っても **鳴りませんでした**。
       ★ ★★かくれるのは「★場に 組が 並んで いる とき」です。★その 場面を 先に 作ります。 */
    var snap = snapG();
    var kBusy = busy, kOver = over, kPicks = picks;
    if (g) {
      still(function () {
        busy = false; over = false; picks = {};
        makeScene([3, 4, 3, 5, 4], 8, C.rng(51515));
        if (g.hands[0].length >= 3) { picks[g.hands[0][0]] = 1; picks[g.hands[0][1]] = 1; picks[g.hands[0][2]] = 1; }
        rebuild(); placeAll(true);
      });
    }
    var r = still(function () {
      var keep = resultWrap.classList.contains('hidden');
      var keepScore = resultScore.innerHTML, keepSay = resultSay.textContent;
      resultSay.textContent = SAY_LOSE.replace('{名前}', 'ロボット1と ロボット3');
      resultScore.innerHTML = resultRows([26, 0, 13, 26], [99, 52, 41, 66], 1);
      levelPickResult.classList.remove('hidden');
      resultWrap.classList.remove('hidden');
      var box = resultBox.getBoundingClientRect();
      var st = stageEl.getBoundingClientRect();
      var meTop = st.top + geo.meTop;
      var ov = Math.max(0, Math.round(box.bottom - meTop));
      var max = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--result-max'), 10) || 0;
      var m = measureOnce();
      /* ★★★ 箱が 本当に **前に 出て いるか**（★T174・私の 失敗⑥）★★★
         ★ ★大きさだけ 見て いると 気づけません ―― ★★札の かさなり順が 箱を 追い越して いても
           ★ ★数字の 上では ぴったり 収まって 見えます。★★指で さして たしかめます。 */
      var pts = [[box.left + box.width / 2, box.top + 6],
                 [box.left + box.width / 2, box.top + box.height / 2],
                 [box.left + 8, box.bottom - 8],
                 [box.right - 8, box.top + 8]];
      var hidden = 0, hitName = [];
      for (var i = 0; i < pts.length; i++) {
        var el = document.elementFromPoint(Math.round(pts[i][0]), Math.round(pts[i][1]));
        if (!el || !resultBox.contains(el)) {
          hidden++;
          hitName.push(el ? (el.className || el.tagName) : '（なし）');
        }
      }
      if (keep) resultWrap.classList.add('hidden');
      levelPickResult.classList.add('hidden');
      resultScore.innerHTML = keepScore;
      resultSay.textContent = keepSay;
      return { h: Math.round(box.height), max: max, over: ov, off: m.off, small: m.small,
               offName: m.offName, hidden: hidden, hitName: hitName };
    });
    picks = kPicks;
    restoreG(snap);
    busy = kBusy; over = kOver;
    if (g) { rebuild(); placeAll(true); }
    return r;
  }
  function levelProbe() {
    var out = { rows: 0, ok: 0, ng: [], small: 0 };
    var kTitleHid = titleScreen.classList.contains('hidden');
    var kPlayHid = playScreen.classList.contains('hidden');
    var kResult = resultWrap.classList.contains('hidden');
    var kLv = levelPickResult.classList.contains('hidden');
    var kTop = titleScreen.scrollTop;
    still(function () {
      var spots = [['はじめの 画面', $('levelTitle'), function () {
        titleScreen.classList.remove('hidden'); playScreen.classList.add('hidden');
        resultWrap.classList.add('hidden');
      }], ['1回 おわり／終わった あとの 画面', $('levelResult'), function () {
        titleScreen.classList.add('hidden'); playScreen.classList.remove('hidden');
        levelPickResult.classList.remove('hidden'); resultWrap.classList.remove('hidden');
      }]];
      spots.forEach(function (sp) {
        sp[2]();
        void document.body.offsetWidth;
        var el = sp[1];
        out.rows++;
        if (sp[0].indexOf('はじめ') === 0) {
          var b0 = el.getBoundingClientRect(), tsBox = titleScreen.getBoundingClientRect();
          var mid = (b0.top - tsBox.top) + titleScreen.scrollTop + b0.height / 2;
          var maxTop = Math.max(0, titleScreen.scrollHeight - titleScreen.clientHeight);
          titleScreen.scrollTop = Math.max(0, Math.min(maxTop, mid - titleScreen.clientHeight / 2));
        }
        var b = el.getBoundingClientRect();
        var cx = Math.round(b.left + b.width / 2), cy = Math.round(b.top + b.height / 2);
        var inV = (cy >= 0 && cy <= window.innerHeight && cx >= 0 && cx <= window.innerWidth);
        var hit = inV ? document.elementFromPoint(cx, cy) : null;
        var mine = !!(hit && (hit === el || (hit.closest && hit.closest('.level-pick') === el.closest('.level-pick'))));
        if (inV && mine) out.ok++; else out.ng.push(sp[0]);
        if (b.height < 43.5) out.small++;
      });
    });
    titleScreen.scrollTop = kTop;
    if (kTitleHid) titleScreen.classList.add('hidden'); else titleScreen.classList.remove('hidden');
    if (kPlayHid) playScreen.classList.add('hidden'); else playScreen.classList.remove('hidden');
    if (kResult) resultWrap.classList.add('hidden'); else resultWrap.classList.remove('hidden');
    if (kLv) levelPickResult.classList.add('hidden'); else levelPickResult.classList.remove('hidden');
    return out;
  }
  /* ★★ 勝ち負けの 画面が「誰が 勝ったか」を 言うか（★本物の showResult を 4通り）★★ */
  function winProbe() {
    var out = { cases: [], mid: '―', lvFin: 0, lvMid: 0, why: [] };
    if (!match || !g) { out.why.push('★立ち上がって いない'); return out; }
    var kTotal = match.total.slice(), kDeal = match.dealNo, kOver = match.over, kWin = match.winners.slice();
    var kHidden = resultWrap.classList.contains('hidden');
    var kTitle = resultTitle.textContent, kCls = resultTitle.className, kSay = resultSay.textContent;
    var kScore = resultScore.innerHTML, kNext = btnNext.innerHTML;
    var kLv = levelPickResult.classList.contains('hidden');
    var kLock = resultBox.classList.contains('is-locked');
    var tMark = timers.length;
    var NOWHY = /少なかった|少ない|多かった|多い|\d+\s*点/;
    var CASES = [
      ['★あなたが 勝つ',                 [0],    '勝ち！', ['あなた']],
      ['★ロボットが 勝つ',               [2],    '負け…', ['ロボット2']],
      ['★あなたと ロボット1が 同じ 点',   [0, 1], '勝ち！', ['あなた', 'ロボット1']],
      ['★ロボット1と ロボット3が 同じ 点', [1, 3], '負け…', ['ロボット1', 'ロボット3']]
    ];
    still(function () {
      CASES.forEach(function (cs) {
        match.over = true; match.winners = cs[1].slice();
        match.total = [30, 30, 50, 30]; match.dealNo = 4;
        showResult([3, 4, 5, 14], [27, 26, 45, 16]);
        out.lvFin = levelPickResult.classList.contains('hidden') ? 0 : 1;
        var ti = resultTitle.textContent, sa = resultSay.textContent;
        var miss = [], i;
        for (i = 0; i < cs[3].length; i++) if (sa.indexOf(cs[3][i]) < 0) miss.push(cs[3][i]);
        var why = NOWHY.test(sa);
        out.cases.push(cs[0] + '「' + ti + '／' + sa + '」' + (miss.length ? ' ★✕' : ' ○') + (why ? ' ★★✕なぜ' : ''));
        if (ti !== cs[2]) out.why.push('★' + cs[0] + ' の 見出しが「' + ti + '」（★「' + cs[2] + '」の はず）');
        if (miss.length) {
          out.why.push('★★★' + cs[0] + ' で 勝った 人の 名前が ありません：' + miss.join('・') + '（★出て いる 文「' + sa + '」）');
        }
        if (why) {
          out.why.push('★★★' + cs[0] + ' で「なぜ 勝ったか」を 言って います（★合計の 表に すでに 数字が 出て います）：「' + sa + '」');
        }
      });
      match.over = false; match.winners = [];
      match.dealNo = 2;
      showResult([3, 4, 5, 14], [27, 26, 45, 16]);
      out.lvMid = levelPickResult.classList.contains('hidden') ? 0 : 1;
      out.mid = resultTitle.textContent + '／' + resultSay.textContent;
      if (/勝ち/.test(resultSay.textContent)) {
        out.why.push('★★1回 おわりの 画面で「勝ち」と 言って います（★まだ 勝負は ついて いません）：「' + resultSay.textContent + '」');
      }
    });
    for (var t = timers.length - 1; t >= tMark; t--) { clearTimeout(timers[t]); timers.splice(t, 1); }
    match.total = kTotal; match.dealNo = kDeal; match.over = kOver; match.winners = kWin;
    resultTitle.textContent = kTitle; resultTitle.className = kCls; resultSay.textContent = kSay;
    resultScore.innerHTML = kScore; btnNext.innerHTML = kNext;
    if (kLv) levelPickResult.classList.add('hidden'); else levelPickResult.classList.remove('hidden');
    if (kLock) resultBox.classList.add('is-locked'); else resultBox.classList.remove('is-locked');
    if (kHidden) resultWrap.classList.add('hidden'); else resultWrap.classList.remove('hidden');
    return out;
  }
  /* ★★★ T179（🎨アト）★★ 点の まるが「となりの 札に かくれて いないか」を **面で** 数える ★★★
     ------------------------------------------------------------
     ★ ★★なぜ 足したか：★T178 まで、★⑰ は 3つしか 見て いませんでした ――
       ★ ★①数字が あるか ②消えて いないか ③その 札 **自身の** すみに 収まって いるか。
       ★ ★★どれも「★となりの 札に かぶられて いないか」を 見て いません。
       ★ ★★＝ ★verify から 見ると 8枚 ぜんぶ「ある」。★でも 人の 目には 1枚しか 見えない
         ★ ★（★T178 §3【実測】375×812 で 読める 1/8。★★ジョーカーの「50」は 0%）。
       ★ ★★コーダの 失敗⑥ と 同じ 形 ―― ★★写真でしか 見つからない 穴 でした。
     ★ ★**数え方**：★点の まるの 四角に **9×7 ＝ 63点**の 網を かけ、★1点ずつ
       ★ `elementFromPoint` に「いちばん 上に いるのは 誰か」を 聞きます。
       ★ ★**ほかの 札**だったら「かくれて いる」。★★札 以外（ふきだし・ボタン）は 数えません
         ―― ★ここで 見たいのは 「★となりの 札」だから です。
     ★ ★**鳴る 線**：★1枚でも **10%以上** かくれたら NG。
       ★ ★（★正しい 置き方なら 10サイズ とも **0%**。★10% は まるめの ゆとり）
     ★ ★**戻すと 鳴る ことを 確かめて あります**（→ `logs/T179_点のまるを左下へ_アト.md` §4）。 */
  function hideProbe(e, box) {
    var NX = 9, NY = 7, tot = 0, cov = 0, ix, iy, x, y, el, ow;
    for (iy = 0; iy < NY; iy++) {
      for (ix = 0; ix < NX; ix++) {
        x = box.left + 1 + (box.width  - 2) * (ix / (NX - 1));
        y = box.top  + 1 + (box.height - 2) * (iy / (NY - 1));
        tot++;
        el = document.elementFromPoint(x, y);
        ow = (el && el.closest) ? el.closest('.card') : null;
        if (ow && ow !== e) cov++;          /* ★ ほかの 札に かぶられた */
      }
    }
    return tot ? Math.round(cov / tot * 100) : 0;
  }

  /* ★★ 点の 数字が 札の すみに あるか（★ルル §2-2・★この 1本の 説明を 4行 減らした もの）★★ */
  function ptProbe() {
    var out = { hand: 0, ok: 0, corner: 0, small: 0, tbl: 0, seven: '―', ace: '―',
                hideMax: 0, hidden: 0, hideList: [], why: [] };
    if (!g || !cardsEl) { out.why.push('★立ち上がって いない'); return out; }
    still(function () {
      var i, e, q, p, pr;
      for (i = 0; i < g.hands[0].length; i++) {
        e = cardEl[g.hands[0][i]];
        if (!e) continue;
        out.hand++;
        p = e.querySelector('.pt');
        if (!p) continue;
        if (p.textContent !== String(C.penOf(g.hands[0][i]))) continue;
        var cs = getComputedStyle(p);
        if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
        out.ok++;
        q = e.getBoundingClientRect(); pr = p.getBoundingClientRect();
        /* ★ すみに ある か（★札の 4分の1 より 小さい ところに 収まって いる か）*/
        if (pr.width <= q.width * 0.62 && pr.height <= q.height * 0.42 &&
            pr.left >= q.left - 1 && pr.right <= q.right + 1 &&
            pr.top >= q.top - 1 && pr.bottom <= q.bottom + 1) out.corner++;
        if (parseFloat(cs.fontSize) < q.width * 0.42) out.small++;
        /* ★★ T179 ―― ★となりの 札に かくれて いないか（★面で 数える）*/
        var hd = hideProbe(e, pr);
        out.hideList.push(hd);
        if (hd > out.hideMax) out.hideMax = hd;
        if (hd >= 10) out.hidden++;
      }
      /* ★ 場の 札には 出さない（★点に ならない 札 だから）*/
      for (i = 0; i < g.table.length; i++) {
        for (var k = 0; k < g.table[i].cards.length; k++) {
          e = cardEl[g.table[i].cards[k]];
          if (!e) continue;
          p = e.querySelector('.pt');
          if (p && getComputedStyle(p).display !== 'none') out.tbl++;
        }
      }
      /* ★ 7 は 0点・A は 20点（★この 1本の 名前 です）*/
      var sevenEl = cardEl[3 * 13 + 6], aceEl = cardEl[3 * 13 + 0];
      out.seven = (sevenEl && sevenEl.querySelector('.pt').textContent === '0') ? '○ 7は 0' : '★★✕ ちがう';
      out.ace = (aceEl && aceEl.querySelector('.pt').textContent === '20') ? '○ Aは 20' : '★★✕ ちがう';
    });
    if (out.hand && out.ok < out.hand) {
      out.why.push('★★★手札 ' + out.hand + '枚 のうち ' + (out.hand - out.ok) + '枚に 点の 数字が 出て いません（★ルル §2-2）');
    }
    if (out.ok && out.corner < out.ok) {
      out.why.push('★★点の 数字が 札の すみに 収まって いない ものが ' + (out.ok - out.corner) + '枚（★絵を かくして います）');
    }
    /* ★★★ T179 ―― ★この 1行が、★T178 で 写真でしか 見つからなかった ものを 鳴らします ★★★ */
    if (out.hidden) {
      out.why.push('★★★点の まるが となりの 札に かくれて います：' + out.hidden + '/' + out.hand +
                   '枚（★いちばん 深い もので ' + out.hideMax + '%・★' + out.hideList.join(',') + '%）' +
                   ' ―― ★手札は 左から 右へ 重なる ので、★点は **左下** に 置きます（★T179）');
    }
    if (out.tbl) out.why.push('★場の 札にも 点が 出て います（' + out.tbl + '枚）―― ★場の 札は 点に なりません');
    if (out.seven.indexOf('✕') >= 0) out.why.push('★★★7の 点が 0で ありません（★★これが この ゲームの 名前 です）');
    if (out.ace.indexOf('✕') >= 0) out.why.push('★★Aの 点が 20で ありません');
    return out;
  }

  /* ★★★ T182（🎨アト）★★ 出せる しるしが 札の「字」を 食べて いないか ★★★
     ------------------------------------------------------------
     ★ ★★なぜ 足したか【★T181 §4・トライ】：★★横向き スマホ（812×375・667×375）で、
       ★ ★★出せる しるしが 札の 左上の **J・Q・K・10 の 字**を 上ぬり して 消して いました。
       ★ ★★verify 28項目は **1つも 鳴りません でした** ―― ★どれも わくが「出て いるか」しか
         ★ 見て いなかった から です。★★「出て いる」と「じゃま を して いない」は 別の こと でした。
     ★ ★★組を 作るには 数字を 読む 必要が あります**（★J♠+J♥+J♦）。★横向きでは 札が
       ★ 39px しか なく、★★左上の すみの 字が 唯一の 読み口 です ――
       ★ ★★つまり 消えて いたのは 「★これから 使う 1枚」の 名前 でした。
     ★ ★**2つの 目で 見ます**（★どちらか 1つでも こえたら 鳴る）：
       ★ ★① ★★**わくの 太さ ÷ 札の はば ≦ 8%**（★設計は `--cw * .075` ＝ **7.5%**）
         ★ ★★下限（`max(◯px, …)`）が 効いた ときだけ ここを こえます ―― ★つまり **原因**を 見ます。
       ★ ★② ★★**札の 絵を 本当に 読んで**、★左上の 墨が わくの 下に 何% 入ったか ≦ 33%
         ★ ★★canvas に 絵を 描いて 画素を 数えます ―― ★★computed style は 見ません
           ★ ★（★コーダは 2回、★私は 1回、★トライは 1回、★★「computed style は 正しいのに
             ★ 写真に 写らない／消えて いる」で 転んで います。★★絵を 読むのが いちばん 確か）。
     ★ ★**3か所 ぜんぶ 見ます**：★手札（`--cw`）・★★場の札（`--tw`）・★すて札（`--pw`）。
       ★ ★★T181 は 手札しか 見て いません でした。★★実際は **場の札が いちばん ひどく**（65.2%）、
         ★ ★★すて札（★④の 2択で 読む 1枚）も 36.2% 食べられて いました【★実測・T182】。
     ★ ★**戻すと 鳴る ことを 確かめて あります**（→ `logs/T182_出せる しるしの太さ_アト.md` §5）――
       ★ ★★`max(4px` に 戻すと、★★320×480・320×568・667×375・812×375 で 鳴ります。
     ⚠️★ ★絵が まだ 届いて いない 札は **数えません**（★空うち しない ため）。
        ★ ★★1枚も 読めなかった ときは「読めません」と 書くだけ で、★★鳴らしません。 */
  function eatProbe(face, cw, ch, bw, vis) {
    var W = Math.max(2, Math.round(cw)), H = Math.max(2, Math.round(ch));
    var cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    var cx = cv.getContext('2d', { willReadFrequently: true });
    if (!cx) return null;
    try { cx.drawImage(face, 0, 0, W, H); } catch (e) { return null; }
    /* ★ 左上の「字」の 箱 ―― ★見えて いる はば を こえない ように 切ります
       ★ （★場の 札は 重なって 並ぶ ので、★見えて いるのは 左の ひとすじ だけ）*/
    var bx = Math.max(2, Math.round(Math.min(vis || W, W * 0.34)));
    var by = Math.max(2, Math.round(H * 0.24));
    var d;
    try { d = cx.getImageData(0, 0, bx, by).data; } catch (e) { return null; }  /* ★ 絵が 別の 家から 来て いたら 読めません */
    var tot = 0, eat = 0, x, y, i;
    for (y = 0; y < by; y++) {
      for (x = 0; x < bx; x++) {
        i = (y * bx + x) * 4;
        if (d[i + 3] < 30) continue;                                 /* ★ すきとおって いる */
        if (d[i] > 210 && d[i + 1] > 210 && d[i + 2] > 210) continue; /* ★ 白い 紙 */
        tot++;
        if (x < bw || y < bw) eat++;                                  /* ★ わくの 下に 入った 墨 */
      }
    }
    return { tot: tot, eat: eat, pct: tot ? Math.round(eat / tot * 1000) / 10 : 0 };
  }

  function wakuProbe() {
    var out = { rows: [], ratioMax: 0, why: [] };
    if (!cardsEl) { out.why.push('★立ち上がって いない'); return out; }
    var RATIO_NG = 8.0;
    still(function () {
      var kinds = [['手札', '', 'me'], ['場の札', ' is-tbl', 'tbl'], ['すて札', ' is-pile', 'discard']];
      var all = [].slice.call(cardsEl.querySelectorAll('.card'));
      for (var t = 0; t < kinds.length; t++) {
        /* ★★ ① わくの 太さ ÷ 札の はば ―― ★★使い捨ての 札を 1枚 立てて 測る
           ★ ★★なぜ 本物の 札を 使わない か【★私の 回り道①・T182】：
             ★ ★はじめ 本物の 札から 測って いました。★★ところが verify は 配った 直後に 走る ので、
               ★ ★★場には 組が 1つも 出て いません ―― ★★`場の札 ―― 読める 札が ありません` が
                 ★ ★10サイズ とも 出て、★★場の札の わくを **1度も 見て いません でした**。
             ★ ★★（★それは 見張りでは なく、★★見張って いる ふり です）
           ★ ★→ ★画面の 外（left:-9999px）に 1枚 立てて、★CSS に 直に 聞きます。
             ★ ★★盤が どんな 場面でも、★★かならず 3か所 とも 測れます。 */
        var pr = document.createElement('div');
        pr.className = 'card is-play' + kinds[t][1];
        pr.style.cssText = 'left:-9999px;top:0;visibility:hidden;';
        pr.innerHTML = '<div class="card-in"></div>';
        cardsEl.appendChild(pr);
        var w = pr.getBoundingClientRect().width;
        var bw = parseFloat(getComputedStyle(pr.firstChild, '::after').borderTopWidth) || 0;
        pr.parentNode.removeChild(pr);
        if (!w) { out.rows.push(kinds[t][0] + ' ―― ★はばが 0'); continue; }
        var ratio = Math.round(bw / w * 1000) / 10;
        if (ratio > out.ratioMax) out.ratioMax = ratio;

        /* ★★ ② 本物の 絵を 読んで、★左上の 墨が わくの 下に 何% 入ったか（★数字を 出すだけ）
           ⚠️★★ ここは **鳴らしません**【★私の 回り道②・T182】――
             ★ ★★はじめ「33% を こえたら NG」に して いました。★★きれいな ファイルで
               ★ ★★10サイズ中 3サイズが 鳴りました（★空うち）。
             ★ ★理由：★★この 数字は **どの 札が そこに あるか** で 大きく 動きます
               ★ ★（★「10」の 字は「A」より はば が 広い。★同じ 375×812・同じ 太さ で
                 ★ ★★21.4% と 34.3% の 両方が 出ました【★実測】）。
             ★ ★★＝ ★★線を 引ける ほど 落ちついた 数字では ありません。
           ★ ★★でも 消しません ―― ★①が 見て いるのは「太さ」で、★★こちらは
             ★ ★★**本当に 字が 消えて いるか** そのもの です。★人が 読む ための 数字 として 残します。 */
        var list = [], j;
        for (j = 0; j < all.length; j++) if (all[j].where === kinds[t][2]) list.push(all[j]);
        list.sort(function (a, b) { return a.getBoundingClientRect().left - b.getBoundingClientRect().left; });
        var sum = 0, cnt = 0;
        for (j = 0; j < list.length; j++) {
          var e = list[j], f = e.faceImg;
          if (!f || !f.complete || !f.naturalWidth || e.classList.contains('is-down')) continue;
          var b = e.getBoundingClientRect();
          if (!b.width) continue;
          var vis = b.width, nx = list[j + 1];
          if (nx) {
            var q = nx.getBoundingClientRect();
            if (Math.abs(q.top - b.top) < 2 && q.left > b.left) vis = Math.min(vis, q.left - b.left);
          }
          var ea = eatProbe(f, b.width, b.height, bw, vis);
          if (ea && ea.tot >= 8) { sum += ea.pct; cnt++; }
        }
        out.rows.push(kinds[t][0] + ' ' + Math.round(w) + 'px → わく ' + (Math.round(bw * 10) / 10) +
                      'px＝' + ratio + '%' +
                      (cnt ? '・字が わくの 下 ' + (Math.round(sum / cnt * 10) / 10) + '%（' + cnt + '枚の 平均）'
                           : '・（絵が まだ 出て いません）'));
        if (ratio > RATIO_NG) {
          out.why.push('★★★出せる しるしが 太すぎます ―― ★' + kinds[t][0] + 'で 札の はばの ' + ratio +
                       '%（★設計は ' + (kinds[t][1] ? (kinds[t][1] === ' is-tbl' ? '--tw' : '--pw') : '--cw') +
                       ' × .075 ＝ **7.5%**）。★★下限（`max(◯px, …)`）が 効いて います ―― ' +
                       '★★札の 左上の 字（J・Q・K・10）を 上ぬり して 消します' +
                       '【★T181 §4 で トライが 写真で 見つけ、★T182 で 数え直した もの】。' +
                       '★→ ★`sevenbridge.css` の わくの 下限を **2px** に 戻して ください' +
                       '（★★44px の 的は 1pxも 動きません。★`pointer-events:none` の 飾り です）');
        }
      }
    });
    return out;
  }

  /* ============================================================
     ★★★ verify ―― この 1本ならではの 見張り（27項目）★★★
     ------------------------------------------------------------
       ①  決まりの 通り（★反則0・★札が いつも 53枚・★終わらない 0）
       ②  ★★★4回 配りの 直しが 生きて いる（★★わざと 1回配りに 戻して 鳴らす）
       ③  ★★つよさ 3段が はしごに なって いる（★わざと 弱い ものが 1つも ない）
       ④  ★★強調は **1種類だけ**（★光り 0個・★札に ぼかしの 影 0）
       ⑤  ★★★★T180 ―― ★★出せる しるしが **出て いるか**（★★向きが 逆に なりました）
       ⑥  ★★勝手に **出さない**（★引くのは 自動に なりました。★すて札は 人が えらぶ）
       ⑦  ★選ばせるのは **つよさ 1つだけ**（★入口 0個・ルル §6-2）
       ⑧  ★寸法が 表どおり（★320×568 を 必ず 含む）
       ⑨  ★先読み 54枚・白い 札 0枚・JOKER2 を 読まない・裏面が 先頭
       ⑩  ★操作は pointer（click では ない）＋ はなすまで 決まらない
       ⑪  ★結果の 箱が 手札に かぶらない・中の 押す ところが 44px 以上
       ⑫  ★言葉（§9.6）＋ ★★ハッピーが 手を 教えて いない
       ⑬  ★★★場が 19枚でも はみ出さないか（★★8組25枚・1組13枚 も）
       ⑭  ★★人が さわれるか（★「押せる ものが 1つも ない」場面が 作れないか）
       ⑮  ★★運ぶ ―― ★合えば 乗り、合わなければ 戻り、すて札で 手番が おわる
       ⑯  ★★「出す」は 組の ときだけ 押せる（★そろって いない 3枚では 出ない）
       ⑯-2 ★★★T198 ―― ★★7は **1枚でも** 出せる（★7＋6・7＋8 の 2枚も）
       ⑯-3 ★★★★T203 ―― ★★場の 7に「足す」も「1枚で 出す」も **両方 えらべる**
            ★（★★わざと 片方を 殺して、★ボタンの 字が 戻る ことも 見せます）
            ★（★7いがいの 1枚・7の ない 2枚では 出ない。★★わざと 決まりを 外して 鳴る ことも 見せます）
       ⑰  ★★★点の 数字が 札の すみに あるか（★7＝0・A＝20）
       ⑰-2 ★★T179 ―― ★点の まるが **となりの 札**に かくれて いないか（★面で 数える）
       ⑰-3 ★★★T182 ―― ★★出せる しるしが **札の 字**を 食べて いないか
            ★（★★鳴るのは ①わく ≦ 札の はばの 8.0%。★★手札・場の札・すて札 の 3か所 ぜんぶ
            ★ ★②絵の 画素を 直に 読んだ「字が わくの 下 ◯%」は **数字を 出すだけ**・鳴りません）
       ⑱  ★しまう／続きから が 本当に 効くか
       ⑱-2 ★★★T201 ―― ★★回戦数（4・8・12・16）を しまう／★一覧に 無い 数は 4に まるめる
            ★（★★わざと 外して、まるめが 効いて いる ことも その場で 見せます）
       ⑲  ★つよさの えらびが 2か所とも 押せる（★1回 おわりにも 出る）
       ⑳  ★勝ち負けの 画面が「誰が 勝ったか」を 言う（★「なぜ」は 言わない）
       ㉑  ★点の 帯 ―― ★字が 画面に つれて 大きく なる／名前が 切れない
       ㉒  ★★★山も すて札も 空に なる 場面（★ルル §18 コーダ⑥ の ご注文）
       ㉓  ★★4回目が 終わるまで 合計を しまう（★ルル §18 コーダ⑦）
       ㉔  ★★手札は 8枚から 増えない（★決まりの 上で 増えようが ない ことを 数で 見る）
       ㉕  ★★★★T180 の 5つが 出て いるか（★①自動で 引く ②出せる しるし ③2つの ボタン ④2択 ⑤灰色）
       ㉕-2 ★★★わざと 出せる しるしを 剥がして、★見張りが 鳴る ことを その場で 見せる
       ㉖  ★★★★T205 ―― ★★場の 7（1枚）に 同じ マークの 6・8 が 付けられるか
       ㉖-2 ★★★★T205 ―― ★★すて札を 拾えるのは **ポン／チーの ときだけ** か
       ㉗  ★★★★T205-3 ―― ★★2つの しるし（出せる／えらんだ）の 色が ぶつかって いないか
       ㉙  ★★★★T205-6 ―― ★★出せない えらび方を 押したら 理由が 出るか（★言い分けて いるかも）
       ㉛  ★★★★T208-3 ―― ★★ハッピーの ことばが 読み切れる 長さ 出て いるか
            ★（★字数 × 150ms/字 が 線。★★わざと 下げて 鳴らして 見せます）
       ㉚  ★★★★T208 ―― ★★ポンの 割り込み（★ルル T207 §5-4：★53枚・3枚以上・同時0件・
            ★すてる1枚・聞く回数）／★★㉚-4 ロボットの ポンを 切ると 鳴る
       ㉘  ★★★★T204-4（🎨アト）―― ★★出せる しるしが **本当に 描かれて いるか**
            ★（★塗る気・濃さ・重ね順・太さ を 見え方で 測る。★★名前は 1文字も 見ません）
            ★（★★いまは 片方が 描かれて いない ので 鳴りません ―― ★★直した 瞬間に 鳴る わな）
            ★（★★どちらも わざと 壊して、鳴る ことを その場で 見せます）
     ★★★ ＋ ★★「この 結果は 読めるか」（★T198-3・★★鳴りません・★読み だけ）★★★
        ★ ★盤が 何かに おおわれて いると、★「指で さす」目が ぜんぶ 壊れて 見えます。
        ★ ★★NG は 増やさず、★★「いま おおわれて いるので 読めません」と 1行 言います。
     ============================================================ */
  /* ============================================================
     ★★★ T198-3 ―― ★★「盤が おおわれて いませんか」★★★
     ------------------------------------------------------------
     ★ ★見張りは **指で さして** たしかめます（`document.elementFromPoint`）。
       ★ ★★だから ―― ★★盤の 上に 何かが かぶさって いると、★指が ぜんぶ そこに 当たり、
         ★ ★「山が 無い」「札が 返らない」「すてられない」と 出ます ―― ★★壊れて いなくても です。
     ★ ★★私は それで 1度 転びました（★1回おわりの 箱を 開いた まま 走らせて **6件**）。
       ★ ★★トライは 透明な 板を 1枚 かぶせて **12件** 鳴らしました。
       ★ ★★★12件 鳴った のを 見た 人は、★★公開を 止める 側に 倒れます。★だから 要ります。

     ⚠️★★★ ★★これは **鳴る 見張りでは ありません**（★★NG を 1つも 増やしません）★★★
        ★ ★アトの 言葉：「★鳴る 見張りより、★★鳴らない ときに 黙って いる 見張りの ほうが 難しい」。
        ★ ★★だから ―― ★★**「いま おおわれて いるので、この 結果は 読めません」と 言うだけ** です。
        ★ ★★「無い ことを 数える 目」も 足して いません ―― ★★指が 届いた 数を 数えて います。
     ============================================================ */
  function coverProbe() {
    if (!g || !built || !geo || playScreen.classList.contains('hidden')) {
      return { read: false, txt: '★★盤が まだ 出て いません（★はじめの 画面）―― ★「指で さす」目は 読めません' };
    }
    var pts = [], i, e;
    for (i = 0; i < g.hands[0].length; i++) {
      e = cardEl[g.hands[0][i]];
      if (e) pts.push(e.getBoundingClientRect());
    }
    if (spotStock) pts.push(spotStock.getBoundingClientRect());
    if (spotDiscard) pts.push(spotDiscard.getBoundingClientRect());
    var n = 0, bad = 0, by = {};
    for (i = 0; i < pts.length; i++) {
      var q = pts[i];
      if (q.width < 2 || q.height < 2) continue;
      n++;
      var x = Math.round(q.left + q.width / 2), y = Math.round(q.top + q.height / 2);
      if (hitAt(x, y)) continue;                       /* ★ 指が 札か 山に 届いた */
      bad++;
      var top = document.elementFromPoint(x, y);
      var nm = '（なし）';
      if (top) {
        nm = top.id ? ('#' + top.id) : '';
        if (top.className && top.className.split) nm += '.' + top.className.split(/\s+/).join('.');
        if (!nm) nm = top.tagName;
      }
      by[nm] = (by[nm] || 0) + 1;
    }
    if (!n) return { read: false, txt: '★★さす ところが ありません ―― ★「指で さす」目は 読めません' };
    if (!bad) return { read: true, txt: '○ 盤は 見えて います（★' + n + 'か所 ぜんぶ 指が 届きました）' };
    return { read: false,
             txt: '★★★盤が おおわれて います（★' + bad + ' / ' + n + 'か所で 指が 届きません：' +
                  Object.keys(by).join('・') + '）★★→ ★★この 結果の うち「指で さす」目は 読めません。' +
                  '★★1回おわりの 箱・遊びかたの 窓を **閉じてから** もう 一度 走らせて ください' };
  }

  /* ============================================================
     ★★★★ ㉘ ―― ★★「出せる札の わく」が 本当に 描かれて いるか（🎨アトの 下書き・T204-4）★★★★
     ------------------------------------------------------------
     ★ ★★中身は `logs/T204-4_計測どうぐ/t2044_mihari.js` を **機械で 取り出して そのまま** 入れました。
       ★ ★★手で 写して いません（★写しまちがいが 起きない ように）。
     ★ ★★アトが わざと 6通り 壊して 確かめた もの ―― ★★いまの 見張り 40個は そのうち
       ★ ★★**3通りを 素通り**させて いました（★display:none ／ 色の アルファ0 ／ 絵の 下に 沈める）。
       ★ ★★その 1つ（★絵の 下に 沈める）は、★この 本で **5回** 起きて いる T180 の 形 です。

     ⚠️★★ ★★私（コーダ）が 足した もの ―― ★★`z-index` が **マイナス**の とき ★★
        ★ ★アトの ③は「わくの z が 絵の z より 下か」を 見ます。
        ★ ★★でも ―― ★★わくを `z-index:-1` に すると、★絵より 下では なく
          ★ ★★**札の 地（.card-in の 白い 背景）より 下**に 沈みます。★絵が 無くても 消えます。
        ★ ★★これも 鳴る ように 1行 足しました（★7通り目。★§13-4 で 鳴る ことを 見せて います）。
     ============================================================ */
  function wakuMihari(cardsEl) {
    var out = { why: [], note: '', arm: '' };
    var MIN_DELTA = 60;      /* ★ わくの 色 ↔ 札の 地（白）の へだたり */
    var MAX_RATIO = 8;       /* ★ 札の はばに 対する 太さの 上限 %（★⑰-3 と 同じ 線）*/

    function rgba(str) {
      var m = String(str).match(/[0-9.]+/g);
      if (!m || m.length < 3) return null;
      return { c: [+m[0], +m[1], +m[2]], a: (m.length >= 4 ? +m[3] : 1) };
    }
    function dRGB(a, b) {
      if (!a || !b) return -1;
      var r = a[0] - b[0], g = a[1] - b[1], u = a[2] - b[2];
      return Math.sqrt(r * r + g * g + u * u);
    }
    function zOf(el) {
      var z = getComputedStyle(el).zIndex;
      return (z === 'auto' || z === '') ? 0 : (parseInt(z, 10) || 0);
    }

    /* ★★ 手札の 札を 1枚 借りて、★★土台を "card is-play" に 固定する ★★
       ⚠️★ ★★その 札の いまの class を 使っては いけません ―― ★★コーダが T205-4 で
          ★ ★踏んだ 空砲（★たまたま is-pick が 付いて いて 別の わくを 拾う）と 同じ 形に なります。 */
    var host = null, all = cardsEl ? cardsEl.querySelectorAll('.card') : [];
    for (var i = 0; i < all.length; i++) if (all[i].where === 'me') { host = all[i]; break; }
    if (!host) { out.note = '★試し方が おかしい（★手札の 札が ありません）'; return out; }
    var keepCls = host.className;
    host.className = 'card is-play';

    try {
      var inn = host.querySelector('.card-in');
      if (!inn) {
        out.why.push('★★★★出せる札の わくを 引く 相手（.card-in）が ありません');
        out.note = '★.card-in が ない';
        return out;
      }
      var pc = getComputedStyle(inn, '::after');
      var bw = parseFloat(pc.borderTopWidth) || 0;
      var col = rgba(pc.borderTopColor);
      var w = host.getBoundingClientRect().width || 1;
      var ratio = bw / w * 100;

      /* ── ① 塗る 気が あるか ─────────────────── */
      var dead = [];
      if (pc.content === 'none') dead.push('content:none');
      if (bw <= 0) dead.push('太さ 0');
      if (pc.display === 'none') dead.push('display:none');
      if (pc.visibility === 'hidden') dead.push('visibility:hidden');
      /* ⚠️★★★★ ここで 1つ すり抜けて いました【★トライが 見つけました・T208-2】★★★★
         ★ ★前は `(parseFloat(pc.opacity) || 1)` ―― ★★opacity が **0** の とき
           ★ ★★JavaScript の `||` が 0 を「無い」と 見て、★★1 に 化けて いました。
           ★ ★★＝ ★★いちばん 消えて いる 形（opacity:0）だけ 素通り。
         ★ ★★数の ときは `||` を 使わない ―― ★★読めなかった ときだけ 1 に します。 */
      var op = parseFloat(pc.opacity);
      if (!(op >= 0)) op = 1;                      /* ★ 読めなかった ときだけ 1 */
      if (op <= 0.05) dead.push('opacity ' + pc.opacity);
      if (col && col.a <= 0.05) dead.push('色が すきとおって いる（アルファ ' + col.a + '）');
      if (pc.borderTopStyle === 'none' || pc.borderTopStyle === 'hidden') dead.push('border-style:' + pc.borderTopStyle);

      /* ── ② 見える 濃さか（★札の 地 ＝ .card-in の 背景。ふつうは 白）── */
      var bg = rgba(getComputedStyle(inn).backgroundColor);
      var 地 = (bg && bg.a > 0.5) ? bg.c : [255, 255, 255];
      var delta = (col && col.a > 0.05) ? dRGB(col.c, 地) : -1;

      /* ── ③ 上から 消されて いないか ──────────────
         ★ ★わくは `.card-in::after`。★札の 絵（.face）は `.card-in` の 子。
         ★ ★★わくの z-index が 絵より 下だと、★★絵が わくを ぬりつぶします
           ★ ★（★T180 で コーダが 2回 踏んだ 形。★`.card.is-pick` は いまも これ）。 */
      var zAfter = (function () { var z = pc.zIndex; return (z === 'auto' || z === '') ? 0 : (parseInt(z, 10) || 0); })();
      var face = inn.querySelector('.face');
      var zFace = face ? zOf(face) : 0;
      var かくれ = !!face && (zAfter < zFace) && getComputedStyle(face).position !== 'static';
      /* ★★ コーダが 足した 7通り目 ―― ★z が マイナス ＝ 札の 地より 下に 沈む */
      var しずみ = (zAfter < 0);

      /* ── 鳴らす ─────────────────────────── */
      if (dead.length) {
        out.why.push('★★★★出せる札の わくが 描かれて いません（' + dead.join('・') + '）' +
                     ' ―― ★★設計図 §5.5「追記②の 例外」（2026-08-31 社長裁定）で 足した ものです。' +
                     '★★深さを 21.6ポイント 払って 買った しるし です。★消さないで ください');
      } else {
        if (delta >= 0 && delta < MIN_DELTA) {
          out.why.push('★★★★出せる札の わくが 札の 地に 溶けて います（★ΔRGB ' + delta.toFixed(1) +
                       '／★線は ' + MIN_DELTA + '）―― ★★描いて いても 見えません');
        }
        if (ratio <= 0 || ratio > MAX_RATIO) {
          out.why.push('★★★★出せる札の わくの 太さが おかしい（★札の はばの ' + ratio.toFixed(1) +
                       '%／★線は 0% 〜 ' + MAX_RATIO + '%）');
        }
        if (しずみ) {
          out.why.push('★★★★出せる札の わくが 札の 地より 下に 沈んで います（★わく z-index ' + zAfter +
                       '）―― ★★白い 地に ぬりつぶされて 写りません');
        }
        if (かくれ) {
          out.why.push('★★★★出せる札の わくが 札の 絵の **下**に あります（★わく z-index ' + zAfter +
                       '／絵 ' + zFace + '）―― ★★T180 で 2回 起きた 形 です。★★computed style は 正しくても 写りません');
        }
      }

      out.note = (dead.length ? '★★✕ 描かれて いません（' + dead.join('・') + '）'
                              : '○ 描かれて います') +
                 '／★色と 地の へだたり ' + (delta >= 0 ? delta.toFixed(1) : '―') + '（線 ' + MIN_DELTA + '）' +
                 '／★太さ ' + bw.toFixed(1) + 'px ＝ 札の ' + ratio.toFixed(1) + '%（線 0〜' + MAX_RATIO + '%）' +
                 '／★重ね順 わく ' + zAfter + '・絵 ' + zFace +
                 (かくれ ? '（★★絵の 下）' : (しずみ ? '（★★地の 下）' : ''));

      /* ── ★★ 空うちして いない ことを その場で 見せる（★㉕-2 と 同じ 形）── */
      var probe = document.createElement('style');
      probe.textContent = '.card.is-play .card-in::after{border-width:0!important}';
      document.head.appendChild(probe);
      var bw2 = parseFloat(getComputedStyle(inn, '::after').borderTopWidth) || 0;
      probe.parentNode.removeChild(probe);
      var bw3 = parseFloat(getComputedStyle(inn, '::after').borderTopWidth) || 0;
      out.arm = 'わくを 0px に すると ' + bw2.toFixed(1) + 'px（★ここで 鳴ります）→ 戻すと ' + bw3.toFixed(1) + 'px';
      if (!(bw2 === 0 && bw3 > 0)) {
        out.why.push('★★★見張り ㉘ が 空うちして います（★わくを 消しても／戻しても 太さが 変わりません）');
      }
    } finally {
      host.className = keepCls;      /* ★ 見張りは 見るだけ。★かならず 戻す（★T144 §7-5）*/
    }
    return out;
  }

  function verify(n) {
    n = n || 600;
    var ng = [], t0 = Date.now(), note = {};
    var L = C.LEVELS, i, k;
    /* ★★ T198-3 ―― ★★走らせる **前** に、★盤が 見えて いるかを 読みます（★鳴りません）★★ */
    var cover = coverProbe();
    /* ⚠️★★ 見張りは 見るだけ ―― ★さわった ものは 1つ 残らず 戻します（★T144 §7-5）★★
       ★ ★★ここを 足す 前は、★verify の あと ハッピーが「そろった！ やったね！」と
         ★ 言った ままに なって いました（★⑯ が 本物の「出す」を 押す ので）。
       ★ ★★小さい ですが、★これも「★見張りが 場面を こわす」の 仲間 です（★私の 失敗⑧ と 同じ 形）。 */
    var kSayTxt = sayEl.textContent, kSayHid = sayEl.classList.contains('hidden');
    var kToldM = toldMeld, kToldL = toldLay, kToldB = toldBoth, kToldP = toldPon, kPonOn = ponOn;

    /* ① 決まりの 通り（★3段 ぜんぶ）*/
    var tot = { illegal: 0, nofin: 0, handMax: 0 }, txt = [];
    for (i = 0; i < L.length; i++) {
      var st = C.runMany(n, 31337, [L[i].o, L[i].o, L[i].o, L[i].o], null, 'match');
      tot.illegal += st.illegal;
      tot.nofin += st.nofin;
      if (st.handMax > tot.handMax) tot.handMax = st.handMax;
      /* ★★ T198-2 ―― ★前は ここで「7上がり ○%」を 出して いました。★決まりを 消した ので
         ★ ★★数える ものが ありません。★★かわりに「誰も 上がれない 回」を 出します（★①の 本来の 目）。 */
      txt.push(L[i].label + ' 上がれない ' + (st.nofin / st.games / C.LIM.DEALS * 100).toFixed(2) + '%');
    }
    if (tot.illegal) ng.push('★★★反則・札の 数ちがいが ' + tot.illegal + '件（★53枚 きっちり 保てて いません）');
    note['① ' + (n * 3) + '試合'] = txt.join('／') + '／★反則 ' + tot.illegal + '件／★手札の 最大 ' + tot.handMax + '枚';

    /* ============================================================
       ② ★★★4回 配りの 直しが 生きて いるか ★★★
       ★ ★①だけだと ―― ★直しを まるごと 外しても、たまたま 出なければ 通ります（T144 §7-4）。
       ★ ★★だから ★**わざと 1回配りに 戻して、ちゃんと 壊れる ことも 見ます。**
       ★ ★ルル §3-1【計算】：★1回配りだと「ためる人」が 31.93% で いちばん 強く なる。
         ★ ★★＝ ★付け札（17.4ポイント）と「7は 0点」が 丸ごと 死にます。
       ============================================================ */
    var bot = L[2].o, m2 = Math.max(400, Math.round(n * 0.6));
    var a4 = C.runMany(m2, 20250830, [C.P.bot5(), bot, bot, bot], null, 'match', 4);
    var h4 = C.runMany(m2, 20250830, [C.P.hold(), bot, bot, bot], null, 'match', 4);
    var a1 = C.runMany(m2, 20250830, [C.P.bot5(), bot, bot, bot], null, 'match', 1);
    var h1 = C.runMany(m2, 20250830, [C.P.hold(), bot, bot, bot], null, 'match', 1);
    var p4 = a4.win / a4.games * 100, q4 = h4.win / h4.games * 100;
    var p1 = a1.win / a1.games * 100, q1 = h1.win / h1.games * 100;
    /* ★★★ T201 ―― ★ここは 作り直しました（★前は「4回 固定か」を 見て いました）★★★
       ★ ★いまは 4・8・12・16 から えらべます。★★見るのは 2つ：
         ★ ★① ★★えらべる 数が **ぜんぶ 4の倍数** か（★4人 なので、★全員が 同じ 回数 親を やる）
         ★ ★② ★初期値が 一覧の 中に あるか（★4回）
       ★ ★★①が 崩れると、★席の ゆがみが 戻って きます（★ルル §3-3：★親の ずらしが 効かなく なる）。 */
    var dlBad = [];
    for (k = 0; k < C.DEALS_LIST.length; k++) {
      if (!(C.DEALS_LIST[k] > 0) || C.DEALS_LIST[k] % 4 !== 0) dlBad.push(C.DEALS_LIST[k]);
    }
    if (dlBad.length) {
      ng.push('★★★えらべる 回戦数に 4の倍数で ない ものが あります：' + dlBad.join('・') +
              '（★★4人 なので、4の倍数で ないと 親の 回数が そろわず 席が ゆがみます・ルル §3-3）');
    }
    if (!C.dealsOk(C.DEALS_START)) {
      ng.push('★★★初期値の 回戦数（' + C.DEALS_START + '回）が 一覧に ありません');
    }
    if (C.DEALS_START !== 4) ng.push('★★初期値の 回戦数が ' + C.DEALS_START + '回（★4回 の はず）');
    if (!(q4 < p4 - 8)) {
      ng.push('★★★4回 配りなのに「ためる人」が 弱く なって いません（★ふつう ' + p4.toFixed(2) +
              '% ／ ためる ' + q4.toFixed(2) + '%）―― ★★付け札が 死にます');
    }
    if (!(q1 > p1)) {
      ng.push('★★★くらべが 効いて いません：★1回配りに 戻しても「ためる人」が 強く なりません' +
              '（★ふつう ' + p1.toFixed(2) + '% ／ ためる ' + q1.toFixed(2) + '%）―― ' +
              '★★試し方が おかしい か、★4回 という 直しが 別の 所に あります');
    }
    note['② ★★4回 配りの 直し'] = '★えらべる 回戦数 ' + C.DEALS_LIST.join('・') + '（★ぜんぶ 4の倍数 ' +
      (dlBad.length ? '★★✕' : '○') + '・初期値 ' + C.DEALS_START + '回）／★4回：ふつう ' + p4.toFixed(2) + '% ／ ためる ' + q4.toFixed(2) +
      '%　★★1回に 戻すと：ふつう ' + p1.toFixed(2) + '% ／ ためる ' + q1.toFixed(2) + '%（各' + m2 + '試合・同じ 種）';

    /* ③ ★★つよさ 3段が はしごに なって いるか */
    var ladder = [];
    for (k = 0; k < L.length; k++) {
      var s3 = C.runMany(Math.max(400, Math.round(n * 0.6)), 555001,
                         [C.HUMANS[3].o, L[k].o, L[k].o, L[k].o], null, 'match');
      ladder.push(s3.win / s3.games * 100);
    }
    for (k = 1; k < ladder.length; k++) {
      if (!(ladder[k] < ladder[k - 1] - 1)) {
        ng.push('★★つよさが はしごに なって いない：' + L[k - 1].label + ' ' + ladder[k - 1].toFixed(1) +
                '% → ' + L[k].label + ' ' + ladder[k].toFixed(1) + '%');
      }
    }
    var lvSrc = JSON.stringify(C.LEVELS);
    if (/waste|throw|blunder|worse|handicap|weaken|dumb/i.test(lvSrc)) {
      ng.push('★★つよさの 中に「わざと 弱くする」らしい 名前が ある：' + lvSrc);
    }
    if (/Math\.random/.test(String(C.planPlay) + String(C.botDiscard) + String(C.botDraw))) {
      ng.push('★core が 種の 無い さいころを 使って いる');
    }
    note['③ つよさ 3段'] = L.map(function (x, j) { return x.label + ' ' + ladder[j].toFixed(1) + '%'; }).join('　') +
                           '（★ぜんぶ 気づいた人から 見た 勝率。★下がって いれば はしご）';

    /* ============================================================
       ④ ★★強調は 2種類まで（★T180 で 1つ 増えました）★★
       ★ ★`.card.is-play`（★★出せる しるし ＝ いま 出せる）と `.card.is-pick`（★えらんだ）の 2つ だけ。
       ★ ★★3つ目を 足したら 鳴ります（★設計図 §5.5「1画面に 強調は 1種類まで」の 名残りの 線）。
       ============================================================ */
    var css = cssRulesText();
    var lit = document.querySelectorAll('.is-win,.is-hint,.is-glow,.is-here,.is-ok,.is-fit,.is-can,.is-lead');
    if (lit.length) ng.push('★光って いる ものが ' + lit.length + '個 ある');
    var litCss = css.match(/\.is-(win|hint|glow|here|ok|fit|can|lead)\b/g);
    if (litCss) ng.push('★★遊びの 情報を 出す 光りの 決まりが CSS に ある：' + litCss.join('・'));
    /* ★★ 札に「ぼかしの 影」＝ 光り を 書いて いないか
       ⚠️★ 文字あわせでは 見ません（★ブラウザが box-shadow を 書きなおすので、★色が 先頭に 来る）。
          ★ → ★長さ（px）だけを 取り出して 数で 見ます。★ぼかし 6px 以上／広がり 2px 以上 ＝ 光り。 */
    var glowSel = [];
    cssRuleList().forEach(function (r) {
      if (!/\.card/.test(r.sel)) return;
      var mm = r.text.match(/box-shadow:([^;}]*)/);
      if (!mm) return;
      mm[1].replace(/\b(?:rgba?|hsla?)\([^)]*\)/g, ' ').split(',').forEach(function (one) {
        if (/inset/.test(one)) return;
        var nums = (one.match(/-?\d+(?:\.\d+)?px/g) || []).map(parseFloat);
        if (nums.length < 3) return;
        if (nums[2] >= 6 || (nums.length >= 4 && nums[3] >= 2)) glowSel.push(r.sel);
      });
    });
    if (glowSel.length) ng.push('★★札に 光りが ある：' + glowSel.join('・'));
    if (!/\.card\.is-pick(?![\w-])/.test(css)) ng.push('★★「えらんだ 札に わく」決まりが CSS に 1行も 無い');
    /* ★★★ T180 ―― ★★出せる しるしの 決まりが **ある** ことを 見張ります（★★前と 逆）★★★ */
    if (!/\.card\.is-play(?![\w-])/.test(css)) {
      ng.push('★★★★「出せる 札に 出せる しるし」の 決まりが CSS に 1行も ありません ' +
              '（★設計図 §5.5「追記②の 例外」2026-08-31・社長指示② ―― ★消さないで ください）');
    }
    /* ★ 出せる しるしに transform が 付いて いないか（★重なりが 変わると ⑰-2 が こわれます）*/
    cssRuleList().forEach(function (r) {
      if (!/\.card\.is-play(?![\w-])/.test(r.sel)) return;
      if (/transform:/.test(r.text)) {
        ng.push('★★★`.card.is-play` に transform が あります（★となりの 札との 重なりが 変わり、' +
                '★★点の まるが かくれます ―― ★verify ⑰-2）：' + r.sel);
      }
    });
    if (/\.card\.is-dim(?![\w-])/.test(css)) {
      ng.push('★★「暗くする」決まりが CSS に あります ―― ★★この 1本の 強調は わく 2種類だけ です');
    }
    var bad4 = css.match(/\.(card|cards|spot|felt-table)[^{,]*:hover/g);
    if (bad4) ng.push('★札の 部品に 指を 置くと 変わる 決まりが ある：' + bad4.join('・'));
    note['④ 強調'] = '光り ' + lit.length + '個／★えらんだ わく（is-pick）' + (/\.card\.is-pick/.test(css) ? '○' : '★✕') +
                     '／★★出せる 出せる しるし（is-play）' + (/\.card\.is-play/.test(css) ? '○' : '★✕') +
                     '／★ぼかしの 影 ' + glowSel.length + '件';

    /* ============================================================
       ⑤ ★★★★ 出せる しるしが **出て いるか** ―― ★★T180 で **向きが 逆に なりました** ★★★★
       ------------------------------------------------------------
       ★ ★→ ★★設計図 §5.5「追記②の 例外」（2026-08-31・社長裁定）。
       ★ ★★前（T174）は「★光らせて いないか」を 数えて いました。★★いまは 逆 です ――
         ★ ★★**光って いなかったら 鳴ります。**
       ★ ★★アイの ご注文：「★わざと 消して 鳴る ことを 示して ください」。
         ★ ★→ ★下の ㉕ が、★**本物の 出せる しるしを 剥がして 鳴る ことを その場で 見せます**。
       ★ ★★ただし ―― ★★「どれを 出すと **得か**」は いまも 出しません（★例外の はし）。
         ★ ★`planPlay`・`usefulness`・`botPlan` は 画面側から 1度も 呼びません。
       ============================================================ */
    var lnp = lineProbe();
    for (i = 0; i < lnp.why.length; i++) ng.push(lnp.why[i]);
    /* ★★ 行の 目① ―― ★★「腕」を のぞく 道具は いまも 禁止 ★★
       ★ ★`enumMelds`／`tableFits` は「できる／できない」を 数えあげる だけ ＝ ★★ゆるされた 側。
       ★ ★`planPlay`／`usefulness`／`botPlan` は「どれが 得か」を 返す ＝ ★★禁じられた 側。 */
    var drawSrc = String(refreshPick) + '\n' + String(refreshPlay) + '\n' + String(playableSet) + '\n' +
                  String(fitMelds) + '\n' + String(discardOffer) + '\n' + String(refreshGo) + '\n' +
                  String(goKind) + '\n' + String(sayPlay) + '\n' + String(placeAll) + '\n' +
                  String(putAt) + '\n' + String(makeCard) + '\n' + String(layoutTable) + '\n' +
                  String(spotOf) + '\n' + String(layout) + '\n' + String(rebuild) + '\n' + String(onMove);
    var hunt = drawSrc.match(/planPlay|botPlan|usefulness|botDraw|botDiscard|botPlay/g);
    if (hunt) {
      ng.push('★★★★画面が「どれが **得か**」を のぞいて います：' + hunt.join('・') +
              '（★★T180 の 例外で ゆるされたのは「出せるか どうか」だけ です ―― ★得か 損かでは ありません）');
    }
    /* ★★ 行の 目② ―― ★★「さがす」道具が **ちゃんと 呼ばれて いるか**（★★前と 逆）★★ */
    if (String(playableSet).indexOf('enumMelds') < 0 || String(playableSet).indexOf('tableFits') < 0) {
      ng.push('★★★★`playableSet` が 出せる 札を さがして いません（★enumMelds／tableFits が 無い）' +
              ' ―― ★★社長指示② が 消えて います');
    }
    if (String(refreshPlay).indexOf('is-play') < 0) {
      ng.push('★★★★`refreshPlay` が 出せる しるしを 付けて いません');
    }
    /* ★ ★運んで いる 最中に 落とし先を 調べて いないか（★ドラッグは 前の 形の まま 残して あります）*/
    if (/dropZone|tableFits/.test(String(onMove))) {
      ng.push('★★★運んで いる 最中に 落とし先を 調べて います（★★運びの 途中は 前と 同じ 線の まま です）');
    }
    /* ★ ★「たしかめる」側は ちゃんと 通って いるか（★これが 無いと 見張りが 空うちに なる）*/
    if (String(goKind).indexOf('makeMeld') < 0) {
      ng.push('★★「出す」が 組を たしかめて いません（★試し方が おかしい か、機能が ありません）');
    }
    note['⑤ ★★★出せる しるし'] = '★そろう 3枚＋足せる 1枚を わざと 入れた 場面の 出せる しるし ' + lnp.idleMarks + '個' +
                       '（★★0個 だったら 鳴ります）／★運んで いる 最中の 印 ' + lnp.dragMarks +
                       '個／★得を のぞく 行 ' + ((hunt || []).length) + '件／' + lnp.sorted;

    /* ============================================================
       ⑥ ★★勝手に **出さない**（★T180 で「勝手に 引かない」だけ 外れました）★★
       ------------------------------------------------------------
       ★ ★★引く …… ★★自動に なりました（★社長指示①）。★★ただし **山からだけ** です。
         ★ ★★「すて札を もらう」を 機械が 決めたら ―― ★★そこは 勝率 22.03ポイントの 判断 です
           【★実測・T180・6000試合】。★★下の 見張りが それを 止めます。
       ★ ★★出す・足す・すてる …… ★いまも **人だけ** です（★1つも 自動化して いません）。
       ============================================================ */
    var humanSrc = String(onDown) + '\n' + String(onUp) + '\n' + String(togglePick) + '\n' +
                   String(humanMeld) + '\n' + String(humanLayoff) + '\n' + String(humanDiscard) + '\n' +
                   String(humanDraw) + '\n' + String(onGo) + '\n' + String(onPass);
    var peek = humanSrc.match(/planPlay|botPlan|botDraw|botDiscard|botPlay|usefulness/g);
    if (peek) ng.push('★★★人の 手番で ロボットの 頭を 使って います：' + peek.join('・'));
    var auto = [];
    [['turnStart', turnStart], ['botStep', botStep], ['newDeal', newDeal], ['placeAll', placeAll],
     ['rebuild', rebuild], ['autoDraw', autoDraw]].forEach(function (a) {
      if (/humanMeld\s*\(|humanLayoff\s*\(|humanDiscard\s*\(/.test(String(a[1]))) auto.push(a[0]);
    });
    if (auto.length) ng.push('★★★人の ぶん（出す・足す・すてる）を 勝手に 動かして いる 所が ある：' + auto.join('・'));
    /* ★★★ 自動で 引くのは **山からだけ**（★すて札を 機械が 勝手に もらったら 鳴ります）★★★ */
    if (!/humanDraw\('stock'/.test(String(autoDraw))) {
      ng.push('★★★自動で 引く ところが 山から 引いて いません（★試し方が おかしい）');
    }
    if (/humanDraw\(\s*'discard'/.test(String(autoDraw)) || /humanDraw\(\s*'discard'/.test(String(turnStart))) {
      ng.push('★★★★機械が すて札を 勝手に もらって います ―― ★★これは 勝率 22.03ポイントの 判断 です' +
              '（★実測・T180）。★★人に えらばせて ください（★社長指示④）');
    }
    /* ★★★ ④ の 止まりが 生きて いるか（★これが 死ぬと ①が「すて札を 消す」に 化けます）★★★ */
    if (String(turnStart).indexOf('discardOffer') < 0) {
      ng.push('★★★★人の 番に「すて札を もらうか」を 聞く ところが ありません（★社長指示④）' +
              ' ―― ★★勝率が 68.51% → 46.48% に 落ちます【実測・T180】');
    }
    /* ★★ T205 ―― ★★ここも 直しました。★前は「tableFits と enumMelds を 呼んで いるか」を 見て いました。
       ★ ★★いまは 決まりが core の takeOk **1つ**に まとまって いる ので、★そこを 見ます。
       ★ ★（★写しが 残って いたら、★決まりを 変えた ときに 片方だけ 直して ずれます）*/
    if (String(discardOffer).indexOf('takeOk') < 0) {
      ng.push('★★★「すて札が つかえるか」を たしかめて いません（★core の takeOk を 通って いません）');
    }
    if (String(humanMeld).indexOf('pickList') < 0) ng.push('★★humanMeld が 人の えらんだ 札を 使って いない');
    if (String(humanLayoff).indexOf('doLayoff') < 0) ng.push('★humanLayoff が core を 通って いない');
    /* ★★ 付け札は **人が 運ぶ**（★設計図 追記④・ルル §2-2 の 3番）*/
    if (String(onUp).indexOf('humanLayoff') < 0 || String(onUp).indexOf('dropZone') < 0) {
      ng.push('★★★付け札が ドラッグに なって いません（★★ソリティア・スパイダーと 同じ 形の はず）');
    }
    note['⑥ 勝手に しない'] = 'ロボットの 頭を のぞく 行 ' + ((peek || []).length) + '件／勝手に 動かす 所 ' + auto.length + '件';

    /* ⑦ ★選ばせるのは つよさ 1つだけ（★入口 0個）*/
    /* ★★★ T201 ―― ★ここも 作り直しました ★★★
       ★ ★前は「★<select> は 2個（つよさ 2か所）だけ」でした。
       ★ ★★社長ご指示で **回戦数の えらび**が 1つ 増えました（★はじめの 画面だけ）。
         ★ ★＝ ★設計図 追記①「選ばせるのは 1つまで」は、★この 1本だけ 2つに なりました。
       ★ ★★見るのは「数が 増えて いないか」―― ★★3個 ちょうど です。 */
    var selLv = [$('levelTitle'), $('levelResult')];
    var selDl = $('dealsTitle');
    var sel = document.querySelectorAll('select');
    if (sel.length !== 3) {
      ng.push('★<select> が ' + sel.length + '個（★★つよさ 2か所 ＋ 回戦数 1か所 ＝ 3個 の はず）');
    }
    if (!selDl) ng.push('★★★回戦数の えらびが ありません（★社長ご指示・T201）');
    var kinds = {};
    for (i = 0; i < selLv.length; i++) {
      if (selLv[i]) kinds[selLv[i].options.length + ':' + (selLv[i].options[0] || {}).text] = 1;
    }
    if (Object.keys(kinds).length !== 1) ng.push('★★2つの つよさの プルダウンの 中身が ちがう');
    if (selLv[0] && selLv[0].options.length !== 3) ng.push('★つよさが ' + selLv[0].options.length + '段（★3段 の はず）');
    /* ★★ 回戦数の えらび ―― ★中身が 一覧と ぴったり 同じか（★勝手に 増えて いないか）*/
    if (selDl) {
      var dlOpt = [];
      for (i = 0; i < selDl.options.length; i++) dlOpt.push(selDl.options[i].value | 0);
      if (dlOpt.join(',') !== C.DEALS_LIST.join(',')) {
        ng.push('★★★回戦数の えらびの 中身が ちがう（★画面 ' + dlOpt.join('・') +
                ' ／ 決まり ' + C.DEALS_LIST.join('・') + '）');
      }
      if (selDl.closest('#titleScreen') === null) {
        ng.push('★★★回戦数の えらびが はじめの 画面の 外に あります ―― ' +
                '★★試合の 途中で 変えられると 合計点の 意味が 壊れます（★ルル）');
      }
    }
    var boxes = document.querySelectorAll('input[type="checkbox"],input[type="radio"],.preset,[data-preset]');
    if (boxes.length) ng.push('★★★決まりの 入口が ' + boxes.length + '個 ある（★★ルル §6-2：★入口は 0個）');
    if (C.LEVEL_START < 0 || C.LEVEL_START >= C.LEVELS.length) ng.push('★初期値の つよさが おかしい');
    if (C.LEVELS[C.LEVEL_START].label !== 'はじめて') {
      ng.push('★★初期値の つよさが「' + C.LEVELS[C.LEVEL_START].label + '」―― ★「はじめて」の はず（ルル §13-4）');
    }
    note['⑦ えらび'] = '<select> ' + sel.length + '個（★つよさ2＋回戦数1）／★回戦数 ' +
                       C.DEALS_LIST.join('・') + '回（初期値 ' + C.DEALS_START + '回）／つよさ ' + C.LEVELS.length + '段／初期値「' +
                       C.LEVELS[C.LEVEL_START].label + '」／★決まりの 入口 ' + boxes.length + '個';

    /* ⑧ ★寸法（★表の 数は【実測】。★ここを 直さずに 寸法を いじると すぐ 鳴ります）*/
    var want = [[980, 777, 100, '1000×900（★左右に 余白）'], [355, 544, 72, '375×667'],
                [300, 445, 60, '★320×568'], [792, 309, 39, '横向き 812×375']];
    var sizeTxt = [];
    for (i = 0; i < want.length; i++) {
      var fl = C.pickLayout(want[i][0], want[i][1]);
      sizeTxt.push(want[i][3] + ' 手札' + fl.w + 'px（見え ' + fl.pitch.toFixed(1) + '／場 ' + fl.tw + '）');
      if (fl.w !== want[i][2]) ng.push('★寸法が ちがう（' + want[i][3] + '：' + fl.w + 'px ／ 表 ' + want[i][2] + 'px）');
      if (fl.pitch < C.FIT.PITCH_MIN - 0.05) ng.push('★★' + want[i][3] + ' で 見えて いる はばが ' + fl.pitch.toFixed(1) + 'px（★21px 以上 の はず）');
      if (fl.pitch < fl.w * 0.5) ng.push('★★★' + want[i][3] + ' で 札の まん中が かくれる（見え ' + fl.pitch.toFixed(1) + 'px ／ 札 ' + fl.w + 'px）');
      /* ★★ いちばん 長い 組（★T198【実測】14枚）が 1行に 入るか */
      var pk = C.packRows([C.FIT.WIDEST], want[i][0] - C.FIT.EDGE * 2, fl.tw, fl.step);
      if (pk.length !== 1) ng.push('★★★' + want[i][3] + ' で ' + C.FIT.WIDEST + '枚の 組が 1行に 入りません（★端が 切れます）');
    }
    note['⑧ 寸法'] = sizeTxt.join('／');

    /* ⑨ ★先読み */
    var white = 0, faceShown = 0;
    for (var id9 in cardEl) {
      if (!cardEl.hasOwnProperty(id9)) continue;
      var e9 = cardEl[id9];
      if (!e9.parentNode || e9.classList.contains('is-down')) continue;
      faceShown++;
      var fi = e9.faceImg;
      if (!(fi.complete && fi.naturalWidth > 0) && !e9.querySelector('.fallback')) white++;
    }
    if (white) ng.push('★★表向きなのに 絵が 出て いない 札が ' + white + '枚（★大富豪 T120 の 2段階表示）');
    if (warmDone + warmErr < ALL_NAMES.length && !warmQueue.length && !warmRun) {
      ng.push('★★先読みが 動いて いない（読めた ' + warmDone + ' / ' + ALL_NAMES.length + '・待ち 0）');
    }
    if (warmErr) ng.push('★読めなかった 絵が ' + warmErr + '個 ある');
    if (ALL_NAMES.length !== 54) ng.push('★読む 絵が ' + ALL_NAMES.length + '個（★54個 の はず ―― ★52枚＋JOKER1＋うら面）');
    if (ALL_NAMES.join(' ').indexOf('JOKER2') >= 0) ng.push('★★使わない JOKER2 を 読んで いる（★ジョーカーは 1枚・ルル §4-4）');
    if (ALL_NAMES.indexOf('JOKER1') < 0) ng.push('★★ジョーカー（JOKER1）を 読んで いない');
    if (ALL_NAMES[0] !== C.BACK_NAME) ng.push('★裏面を いちばん 先に 読んで いない');
    note['⑨ 先読み'] = '読めた ' + warmDone + '/' + ALL_NAMES.length + '／表向き ' + faceShown + '枚 中 白い 札 ' + white + '枚';

    /* ⑩ ★操作は pointer・はなすまで 決まらない */
    if (String(build).indexOf('pointerdown') < 0 || String(build).indexOf('pointerup') < 0 ||
        String(build).indexOf('pointermove') < 0) {
      ng.push('★pointer で 受けて いない（★運ぶには pointermove が 要ります）');
    }
    if (String(onUp).indexOf('hitAt(') < 0) ng.push('★★★onUp が はなした 点で 引き直して いない（★hitAt が ない ―― ★指では 押した 札の まま に なります）');
    if (/var\s+t\s*=\s*e\.target/.test(String(onUp))) ng.push('★★★onUp が e.target を 見て いる');
    if (String(onDown).indexOf('togglePick') >= 0 || String(onDown).indexOf('humanDraw') >= 0) {
      ng.push('★★指を 置いた 時点で 決まって いる（★はなすまで 決まらない はず）');
    }
    /* ⑩-2 ★★山・すて札の 指の 的（★44px。★★横向きで 29px でした・T174） */
    var spq = spotProbe();
    for (i = 0; i < spq.why.length; i++) ng.push(spq.why[i]);
    note['⑩ 指の 的'] = spq.rows.join('／');

    /* ⑪ ★結果の 箱 */
    var bx = resultProbe();
    if (bx.over) ng.push('★★結果の 箱が 手札に かぶって いる（' + bx.over + 'px）');
    if (bx.h > bx.max + 0.5) ng.push('★結果の 箱が 天井を こえて いる（' + bx.h + 'px ／ 天井 ' + bx.max + 'px）');
    if (bx.off) ng.push('★★結果の 箱の 中の 押す ところが ' + bx.off + '件 画面の 外：' + (bx.offName || []).join('・'));
    if (bx.small) ng.push('★★★結果の 箱の 中に 44pxより 小さい 押す ところが ' + bx.small + '件 ある（★会社の 決まり）');
    if (bx.hidden) {
      ng.push('★★★★結果の 箱が 札の 下に かくれて います（★' + bx.hidden + '/4か所で 前に 出て いない：' +
              (bx.hitName || []).join('・') + '）―― ★★点の 表が 読めません');
    }
    note['⑪ 結果の 箱'] = bx.h + 'px（天井 ' + bx.max + 'px）／手札との かぶり ' + bx.over + 'px／画面外 ' + bx.off +
                          '件／★44px割れ ' + bx.small + '件／★★前に 出て いない ' + bx.hidden + '/4か所';

    /* ⑫ ★言葉（設計図 §9.6）＋ ★★手を 教えて いないか */
    var text = readableText(document.querySelector('.app-shell')) + ' ' +
               readableText(resultWrap) + ' ' + readableText($('helpDialog')) + ' ' + document.title;
    var NGW = ['セット', 'ラン', 'メルド', 'レイオフ', 'ストック', 'ディスカード', 'ドロー', 'ターン',
               'カード', 'スート', 'レベル', 'ワイルド', 'ポイント', '連番', '罰点', '捨', '累計', 'ms', '％'];
    /* ⚠️★★ 「ラン」を そのまま さがすと ―― ★★「ト**ラン**プ」で 鳴ります【★私の 失敗③】。
       ★ ★★使って よい 言葉（トランプ・ジョーカー）を **先に 取り除いてから** くらべます。 */
    var flat12 = text.replace(/トランプ/g, '').replace(/ジョーカー/g, '');
    var hitW = [];
    for (i = 0; i < NGW.length; i++) if (flat12.indexOf(NGW[i]) >= 0) hitW.push(NGW[i]);
    if (hitW.length) ng.push('★言っては いけない 言葉が ある：' + hitW.join('・'));
    var sayAll = [];
    for (var k1 in SAY) if (SAY.hasOwnProperty(k1)) sayAll.push(SAY[k1]);
    sayAll.push(SAY_WIN, SAY_LOSE, SAY_DEAL_ME, SAY_DEAL_OT);
    var teach = teachHit(sayAll.join(' '));
    if (teach.length) ng.push('★★★ハッピーが 手を 教えて いる：' + teach.join('・'));
    var helpTeach = teachHit(readableText($('helpDialog')));
    if (helpTeach.length) ng.push('★★★あそびかたが 手を 教えて いる：' + helpTeach.join('・'));
    var cw = cardWords(cardsEl);
    if (cw) ng.push('★札の 上に（点の 数字 いがいの）文字が ある：' + cw);
    /* ★ あそびかたは 6行（★ルル §0-3。★増えたら §5.5 に ぶつかります）*/
    var helpN = $('helpDialog').querySelectorAll('.help-list li').length;
    /* ★★ T208 ―― ★★6行 → 7行 に なりました（★社長の お決め・ルル T207 §7 の 案「甲」）
       ★ ★足したのは ポンの 1行 だけ です。★★これ以上 増やさない ための 線 です。 */
    if (helpN !== 7) ng.push('★あそびかたが ' + helpN + '行（★★7行 の はず・T208 社長の お決め）');
    note['⑫ 言葉'] = text.length + '文字／★あそびかた ' + helpN + '行／★手を 教える 言葉 ' +
                     (teach.length + helpTeach.length) + '件';

    /* ============================================================
       ⑬ ★★★場が 19枚でも はみ出さないか（★★ルル §8-2・設計図 追記③）★★★
       ============================================================ */
    var ft = fitTest(70);
    if (ft['★はみ出し（一番 大きい）'] !== '0px') ng.push('★★★札が 器から はみ出した：' + ft['★はみ出し（一番 大きい）']);
    if (ft['★押す ところが 画面外'] !== '0件') ng.push('★★押す ところが 画面の 外に 出た：' + ft['★押す ところが 画面外']);
    if (ft['横スクロールが 出た場面']) ng.push('★横スクロールが ' + ft['横スクロールが 出た場面'] + '場面で 出た');
    if (ft['縦スクロールが 出た場面']) ng.push('★縦スクロールが ' + ft['縦スクロールが 出た場面'] + '場面で 出た');
    if (ft['★44pxより 小さい ボタン'] !== '0件') {
      ng.push('★★★44pxより 小さい 押す ところが ある：' + ft['★44pxより 小さい ボタン'] + '（★会社の 決まり）');
    }
    var hitTxt = ft['★★手札の まん中を さして 当たらなかった'];
    if (hitTxt && hitTxt.indexOf('0 /') !== 0) {
      ng.push('★★★手札の まん中を さして その 札が 返らなかった：' + hitTxt + '（★トライ T153 🟡-1 と 同じ こわれ方）');
    }
    var mTxt = ft['★★場の 組を さして 当たらなかった'];
    if (mTxt && mTxt.indexOf('0 /') !== 0) {
      ng.push('★★★★場の 組に 指が 届かない ものが ある：' + mTxt +
              '（★★これは 見切れでは なく **故障** です・設計図 追記③）');
    }
    /* ============================================================
       ★★★ ⑬-2 ―― ★★**4つの 画面 ぜんぶ**で 場が 入るか（★320×568 を 必ず 含む）★★★
       ------------------------------------------------------------
       ⚠️★★ ここは **私の 見張りの 穴** でした【★私の 失敗⑤・作業メモ §5】。
          ★ ★はじめ ⑬は `fitTest`（＝ **いま 開いて いる 画面**）しか 見て いませんでした。
          ★ ★★「静かに 詰める」を わざと 止めて 試したら ―― ★★NG 0（★鳴らない）。
            ★ ★理由：★961×914 では 詰めなくても 入って しまう から です。
            ★ ★★＝ ★★詰める しくみが 消えても、★大きい 画面で 試す かぎり 誰も 気づけません。
          ★ ★★これで 会社では 4回目 です（★T155・T168・T171・今回）――
            ★ ★★どれも 同じ 形：★★**「直した」だけで「見張って いない」。**
       ★ ★下は 画面を 開き直さずに、★**measure() と 同じ 式（budget）**で 4つの 画面を 数えます。
       ============================================================ */
    var tblTxt = [];
    for (i = 0; i < want.length; i++) {
      var B = budget(want[i][0], want[i][1]);
      var worstRow = 0, worstName = '';
      for (k = 0; k < SCENES.length; k++) {
        if (!SCENES[k].c.length) continue;
        var pk2 = C.packTable(SCENES[k].c, B.innerW, B.innerH, B.lay.tw);
        if (pk2.h > B.innerH) {
          ng.push('★★★' + want[i][3] + ' で「' + SCENES[k].n + '」が 台から はみ出します（★' +
                  pk2.h + 'px ／ 台の 中 ' + B.innerH + 'px）―― ★★触る ところが 切れます（設計図 追記③）');
        }
        /* ★ どの 組も 1行に 収まり、★横にも はみ出さないか */
        var rows2 = pk2.rows;
        for (var r2 = 0; r2 < rows2.length; r2++) {
          var last2 = rows2[r2][rows2[r2].length - 1];
          if (last2.x + last2.w > B.innerW + 0.5) {
            ng.push('★★★' + want[i][3] + ' で「' + SCENES[k].n + '」が 台の 右から はみ出します（★' +
                    (last2.x + last2.w) + 'px ／ ' + B.innerW + 'px）');
          }
        }
        if (pk2.h > worstRow) { worstRow = pk2.h; worstName = SCENES[k].n + ' ' + pk2.tw + 'px/' + rows2.length + '行'; }
      }
      var pk1 = C.packTable([3, 4, 3, 5, 4], B.innerW, B.innerH, B.lay.tw);
      tblTxt.push(want[i][3] + '：★ふだんの形 ' + pk1.tw + 'px/' + pk1.rows.length + '行（台の中 ' +
                  B.innerH + 'px）／いちばん 高い のは ' + worstName + ' ＝ ' + worstRow + 'px');
    }
    note['⑬-2 ★★4つの 画面で 場が 入るか'] = tblTxt.join('　／　');
    note['⑬ ★★場の 大きさ'] = '★場札 ' + (pack ? pack.tw : geo.tw) + 'px／' + ft['調べた場面'] +
                              '／はみ出し ' + ft['★はみ出し（一番 大きい）'] + '／手札 ' + hitTxt +
                              '／★場の 組 ' + mTxt + '／' + ft['★静かに 詰めた 場面'] + ' 詰めました';

    /* ⑭ ★★人が さわれるか */
    var rp = reachProbe();
    if (!rp.cases) ng.push('★★「人が さわれるか」を 1場面も 作れなかった（★試し方が おかしい）');
    for (i = 0; i < rp.why.length; i++) ng.push('★★★人の 番なのに 進めない：' + rp.why[i]);
    note['⑭ ★人が さわれるか'] = rp.cases + '場面 中 ★止まった ' + rp.dead + '場面／' + rp.detail.join('　');

    /* ⑮ ★★運ぶ（付け札・すてる）*/
    var dp = dragProbe();
    for (i = 0; i < dp.why.length; i++) ng.push(dp.why[i]);
    note['⑮ ★★運ぶ'] = '合う 組へ ' + dp.fit + '／合わない 組へ ' + dp.unfit + '／すて札へ ' + dp.discard +
                        '／何も ない ところへ ' + dp.nowhere;

    /* ⑯ ★★「出す」は 組の ときだけ */
    var gp = goProbe();
    for (i = 0; i < gp.why.length; i++) ng.push(gp.why[i]);
    note['⑯ ★「場に出す」'] = 'そろって いない 3枚 ' + gp.bad + '／同じ 数字 ' + gp.set + '／つづいた 数字 ' + gp.run +
                          '／手札 ぜんぶ ' + gp.all + '／押したら ' + gp.played;
    /* ★★★ ⑯-2 ―― ★T198：★7は 1枚でも 出せるか（★本物の 決まり・社長の ご指摘）★★★ */
    note['⑯-3 ★★★足すか 1枚で 出すか えらべる（T203）'] =
        '★ボタン ' + gp.bothBtn + '／★字の はみ出し ' + gp.bothCut + '／★場の 7に 出せる しるし ' + gp.bothLay +
        '／★押したら ' + gp.bothGo + '／★★' + gp.bothKill;
    note['⑯-2 ★★7は 1枚でも 出せる'] =
        '7が 1枚 ' + gp.seven1 + '／7＋6 ' + gp.seven67 + '／7＋8 ' + gp.seven78 +
        '／★7いがい 1枚 ' + gp.one + '／★7の ない 2枚 ' + gp.two +
        '／押したら ' + gp.sevenPlayed + '／★★' + gp.sevenKill;

    /* ⑰ ★★★点の 数字が 札の すみに あるか */
    var pp = ptProbe();
    for (i = 0; i < pp.why.length; i++) ng.push(pp.why[i]);
    note['⑰ ★★点の 数字'] = '手札 ' + pp.ok + '/' + pp.hand + '枚に 出て いる（★すみに ' + pp.corner +
                            '枚・小さい 字 ' + pp.small + '枚）／' + pp.seven + '・' + pp.ace +
                            '／★場の 札に 出て いる ' + pp.tbl + '枚';
    /* ⑰-2 ★★★T179 ―― ★となりの 札に かくれて いないか（★★写真でしか 見つからなかった もの）*/
    note['⑰-2 ★★となりに かくれて いないか'] =
        'かくれて いる ' + pp.hidden + '/' + pp.hand + '枚（★いちばん 深い もので ' + pp.hideMax + '%）' +
        (pp.hand ? '／★1枚ずつ ' + pp.hideList.join(',') + '%' : '');

    /* ⑰-3 ★★★T182 ―― ★★出せる しるしが 札の「字」を 食べて いないか（★手札・場の札・すて札）
       ★ ★★⑰-2 と 対に なって います：★⑰-2 は「となりの 札」に かくれて いないか、
         ★ ★★⑰-3 は「★自分の 上に のった 出せる しるし」に 消されて いないか。 */
    var wk = wakuProbe();
    for (i = 0; i < wk.why.length; i++) ng.push(wk.why[i]);
    note['⑰-3 ★★わくが 字を 食べて いないか'] =
        wk.rows.join('／') + '（★鳴る 線：★★わく ≦ 札の はばの 8.0%。' +
        '★「字が わくの 下 ◯%」は **読む ための 数字**で、★鳴りません ―― ★どの 札が そこに あるかで 動く ため）';

    /* ⑱ ★しまう／続きから */
    /* ⚠️★★ 見張りが 遊ぶ人の 設定を 書きかえて いました【★私の 失敗⑦】★★
       ★ ★⑱ は 本物の `setLevel` を 通します ―― ★★それは つよさを **しまいます**。
       ★ ★★verify を 1回 走らせたら、★「はじめて」で 遊んで いた 人が「ふつう」に なって いました。
         ★ ★（★私の 手あそびで 実際に そう なり、★now() の 1行で 気づきました）
       ★ ★★見張りは 見るだけ。★★さわった ものは 1つ 残らず 戻します（★T144 §7-5）。 */
    var kSave = null, kLv = null;
    try { kSave = localStorage.getItem(STORE); kLv = localStorage.getItem(LV_STORE); } catch (e) {}
    var s18 = { write: '―', read: '―', clear: '―', guard: '―', keep: '―', keepLv: '―', badLv: '―', now: '―',
                badDl: '―', keepDl: '―', doneDl: '―', killDl: '―' };
    var kMatch = match;
    try {
      match = C.newMatch(1); match.total = [7, 22, 13, 4]; match.dealNo = 2; match.over = false;
      save();
      var got = load();
      s18.write = (got && got.t.join(',') === '7,22,13,4' && got.d === 2) ? '○ しまえた' : '★★✕ しまえない';
      if (s18.write !== '○ しまえた') ng.push('★★★1回 おわりの 合計を しまえて いない（★続きから が 効きません）');
      s18.read = (got && got.lv === 1) ? '○ つよさも 覚えた' : '★✕ つよさを 覚えて いない';
      if (!got || got.lv !== 1) ng.push('★つよさを 覚えて いない');
      match.over = true; save();
      s18.clear = load() ? '★★✕ 消えない' : '○ 終わったら 消える';
      if (load()) ng.push('★★終わった 勝負の 続きが 残って いる');
      try { localStorage.setItem(STORE, '{"t":[1,2],"d":"x"}'); } catch (e) {}
      s18.guard = load() ? '★★✕ こわれた 中身を 受けて しまう' : '○ こわれた 中身は 受けない';
      if (load()) ng.push('★★こわれた 中身を そのまま 読んで います');
      /* ★★ はじめの 画面で つよさを さわっても 続きが 消えないか（★ハーツ T166 🔴-1 と 同じ 手順）*/
      try { localStorage.setItem(STORE, JSON.stringify({ t: [12, 48, 33, 27], d: 2, lv: 0 })); } catch (e) {}
      match = C.newMatch(0);
      setLevel(1);
      var af = load();
      s18.keep = (af && af.t.join(',') === '12,48,33,27' && af.d === 2) ? '○ 続きが のこる' : '★★✕ 続きが 消えた';
      if (!af || af.t.join(',') !== '12,48,33,27' || af.d !== 2) {
        ng.push('★★★はじめの 画面で つよさを さわったら、しまって ある 続きが 消えました' +
                '（★しまって ある 中身 ' + JSON.stringify(af) + '）―― ★★ハーツ T166 🔴-1 と 同じ こわれ方');
      }
      s18.keepLv = (af && af.lv === 1) ? '○ つよさは 変わる' : '★★✕ つよさが 変わらない';
      if (!af || af.lv !== 1) ng.push('★★つよさを さわっても しまって ある つよさが 変わらない（★試し方が おかしい）');
      /* ★ おかしい つよさ（lv:9）を 受けても 止まらないか */
      try { localStorage.setItem(STORE, JSON.stringify({ t: [99, 1, 1, 1], d: 1, lv: 9 })); } catch (e) {}
      var af3 = load();
      s18.badLv = (af3 && af3.lv >= 0 && af3.lv < C.LEVELS.length) ? '○ まるめる' : '★★✕ そのまま 通す';
      if (!af3 || !(af3.lv >= 0 && af3.lv < C.LEVELS.length)) ng.push('★★★おかしい つよさ（lv:9）を そのまま 受けて います');
      match = C.newMatch(0); match.level = 9;
      s18.now = (levelNow() && levelNow().o) ? '○ 落ちない' : '★★✕ 落ちる';
      if (!levelNow() || !levelNow().o) ng.push('★★★おかしい つよさで levelNow が 使えない');

      /* ============================================================
         ★★★ T201 ―― ★★一覧に 無い 回戦数を 入れたら **4に まるめる** ★★★
         ★ ★★捨てません（★T188 で つよさ（lv）に やったのと 同じ 形）。
         ★ ★見るのは 3つ：
           ★ ★① ★おかしい 回戦数（dl:7）→ ★★4に まるまり、★続きは のこる
           ★ ★② ★正しい 回戦数（dl:16）→ ★★そのまま 16
           ★ ★③ ★★古い しまいもの（★dl が 無い）→ ★★4に まるまる（★読み捨てない）
         ★ ★★そして ―― ★★わざと 決まりを 外して、★この 目が 鳴る ことを その場で 見せます。
         ============================================================ */
      try { localStorage.setItem(STORE, JSON.stringify({ t: [5, 6, 7, 8], d: 2, lv: 0, dl: 7 })); } catch (e) {}
      var afD = load();
      s18.badDl = (afD && afD.dl === 4 && afD.d === 2 && afD.t.join(',') === '5,6,7,8')
        ? '○ 7回 → 4回に まるめる（★続きは のこる）' : '★★✕ まるめない';
      if (!afD || afD.dl !== 4) {
        ng.push('★★★一覧に 無い 回戦数（dl:7）を そのまま 受けて います' +
                '（★★読んだ もの ' + JSON.stringify(afD) + '）―― ★4回に まるめる はず です');
      }
      try { localStorage.setItem(STORE, JSON.stringify({ t: [5, 6, 7, 8], d: 2, lv: 0, dl: 16 })); } catch (e) {}
      var afD2 = load();
      try { localStorage.setItem(STORE, JSON.stringify({ t: [5, 6, 7, 8], d: 2, lv: 0 })); } catch (e) {}
      var afD3 = load();
      s18.keepDl = ((afD2 && afD2.dl === 16) ? '○ 16回は そのまま' : '★★✕ 16回が 通らない') +
                   '／' + ((afD3 && afD3.dl === 4) ? '○ 古い しまいものも 4回で 読める' : '★★✕ 古い しまいものを 捨てて いる');
      if (!afD2 || afD2.dl !== 16) ng.push('★★★16回の 続きが 読めません（★一覧に ある 数 です）');
      if (!afD3 || afD3.dl !== 4) ng.push('★★★★回戦数が しまって いない 古い 続きを 捨てて います（★4回で 読む はず）');
      /* ★★ わざと 外して 鳴る ことを 見せる ―― ★★まるめを 通さずに 読んだら どうなるか ★★ */
      var killRaw = null;
      try { killRaw = JSON.parse(localStorage.getItem(STORE) || 'null'); } catch (e) {}
      try { localStorage.setItem(STORE, JSON.stringify({ t: [5, 6, 7, 8], d: 2, lv: 0, dl: 7 })); } catch (e) {}
      var rawDl = null;
      try { rawDl = (JSON.parse(localStorage.getItem(STORE) || 'null') || {}).dl; } catch (e) {}
      var thruDl = (load() || {}).dl;
      s18.killDl = (rawDl === 7 && thruDl === 4)
        ? '○ しまって あるのは 7回・読むと 4回 ＝ ★まるめが 効いて います（★空うちで は ない）'
        : '★★✕ しまって ある ' + rawDl + '回 → 読むと ' + thruDl + '回（★まるめが 効いて いません）';
      if (!(rawDl === 7 && thruDl === 4)) {
        ng.push('★★★「4に まるめる」の 目が 空うちして います（★しまって ある ' + rawDl +
                ' → 読むと ' + thruDl + '）');
      }
      void killRaw;
      /* ============================================================
         ㉓ ★★4回目が 終わるまで 合計を しまう（★ルル §18 コーダ⑦）★★
         ★ ★★4回 おわった 勝負は しまわない ―― ★次に 開いた とき 0から 始まる のが 正しい。
         ============================================================ */
      try { localStorage.setItem(STORE, JSON.stringify({ t: [12, 48, 33, 27], d: 4, lv: 0, dl: 4 })); } catch (e) {}
      var af4 = load();
      s18.done = af4 ? '★★✕ 4回 終わった 続きを 読む' : '○ 4回 終わったら 読まない';
      if (af4) ng.push('★★★4回 配り終わった 続きを 読んで います（★★勝負は もう ついて います）');
      /* ★★ T201 ―― ★★16回戦なら、★4回 おわりは **まだ 途中** です（★読める のが 正しい）★★
         ★ ★★ここが「4」で 決め打ちに 戻ると、★16回戦の 続きが 4回目で 消えます。 */
      try { localStorage.setItem(STORE, JSON.stringify({ t: [12, 48, 33, 27], d: 4, lv: 0, dl: 16 })); } catch (e) {}
      var af16 = load();
      try { localStorage.setItem(STORE, JSON.stringify({ t: [12, 48, 33, 27], d: 16, lv: 0, dl: 16 })); } catch (e) {}
      var af16e = load();
      s18.doneDl = (af16 && !af16e)
        ? '○ 16回戦：4回目は まだ 途中・16回目で 打ち止め'
        : '★★✕ 16回戦の 打ち止めが ちがう（★4回目 ' + (af16 ? '読める' : '読めない') +
          '／16回目 ' + (af16e ? '読める' : '読めない') + '）';
      if (!af16) ng.push('★★★16回戦なのに 4回 おわりの 続きが 消えて います（★★まだ 途中 です）');
      if (af16e) ng.push('★★★16回 配り終わった 続きを 読んで います（★★勝負は もう ついて います）');
    } catch (e) {
      ng.push('★★しまう 仕組みで つまずいた：' + e.message);
    }
    match = kMatch;
    try {
      if (kSave === null) localStorage.removeItem(STORE); else localStorage.setItem(STORE, kSave);
      if (kLv === null) localStorage.removeItem(LV_STORE); else localStorage.setItem(LV_STORE, kLv);
    } catch (e) {}
    if (match) { $('levelTitle').value = String(match.level); $('levelResult').value = String(match.level); }
    refreshResume();
    note['⑱ しまう／続きから'] = s18.write + '／' + s18.read + '／' + s18.clear + '／' + s18.guard +
                                 '／★つよさを さわっても ' + s18.keep + '（' + s18.keepLv + '）' +
                                 '／★おかしい つよさ ' + s18.badLv + '・' + s18.now;
    note['⑱-2 ★★回戦数（T201）'] = '★おかしい 回戦数 ' + s18.badDl + '／' + s18.keepDl +
                                   '／★★わざと 外して ' + s18.killDl;
    note['㉓ ★★えらんだ 回で 打ち止め'] = s18.done + '／★' + s18.doneDl +
      '（★1試合 ＝ ★★' + (match ? match.deals : C.DEALS_START) + '回 配り。★えらべるのは ' + C.DEALS_LIST.join('・') + '回）';

    /* ⑲ ★つよさの えらび */
    var wpEarly = winProbe();
    var lp = levelProbe();
    if (lp.ng.length) ng.push('★★つよさを えらべない 所が ある：' + lp.ng.join('・'));
    if (lp.small) ng.push('★つよさの えらびが 44px より 低い：' + lp.small + '件');
    if (wpEarly.lvFin !== 1) ng.push('★★★勝ち負けの 画面に つよさが 出て いません（★負けた 人の 逃げ道が ありません）');
    if (wpEarly.lvMid !== 1) {
      ng.push('★★★1回 おわりの 画面に つよさが 出て いません ―― ★★これだと 4分に 1回しか 変えられません');
    }
    if (/levelPickResult\.classList\.add\(/.test(String(showResult))) {
      ng.push('★★★showResult が つよさを 隠す 行を 持って います（★1回 おわりでも 出す はず）');
    }
    note['⑲ つよさの えらび'] = '押せた ' + lp.ok + ' / ' + lp.rows + 'か所／44px 割れ ' + lp.small +
                                '件／★出て いる：勝ち負け ' + (wpEarly.lvFin ? '○' : '★✕') +
                                '・1回 おわり ' + (wpEarly.lvMid ? '○' : '★✕');

    /* ⑳ ★勝ち負けの 画面 */
    for (i = 0; i < wpEarly.why.length; i++) ng.push(wpEarly.why[i]);
    if (SAY_WIN.indexOf('{名前}') < 0 || SAY_LOSE.indexOf('{名前}') < 0) {
      ng.push('★★★勝ち負けの ひとことに「誰が 勝ったか」を 入れる 場所（{名前}）が ありません');
    }
    if (String(showResult).indexOf('winnerText') < 0) ng.push('★★★showResult が 勝った 人の 名前を 入れて いない');
    if (/total|score|点/.test(String(winnerText))) ng.push('★★★勝った 人の 名前に 点数が 混ざって います');
    note['⑳ ★誰が 勝ったか'] = wpEarly.cases.join('　') + '／★くらべ 1回 おわり「' + wpEarly.mid + '」';

    /* ㉑ ★点の 帯 */
    var sb = still(function () {
      var b = scoreBand, cut = [], j;
      var names = b.querySelectorAll('.sb-name');
      for (j = 0; j < names.length; j++) {
        if (names[j].scrollWidth > names[j].clientWidth + 0.5) cut.push(names[j].textContent);
      }
      var q = b.getBoundingClientRect();
      return { h: Math.round(q.height), inner: b.scrollHeight, n: names.length, cut: cut,
               numF: parseFloat(getComputedStyle(b).fontSize) || 0,
               nameF: names.length ? (parseFloat(getComputedStyle(names[0]).fontSize) || 0) : 0 };
    });
    var wantH = Math.max(geo.scoreMin, Math.min(geo.scoreWant, geo.scoreRoom));
    if (geo.scoreH !== wantH) ng.push('★★帯の たけが 決まりと ちがう（' + geo.scoreH + 'px ／ ' + wantH + 'px の はず）');
    if (sb.inner > sb.h + 1) ng.push('★★★点の 帯から 中身が はみ出して います（★中身 ' + sb.inner + 'px ／ 帯 ' + sb.h + 'px）');
    if (sb.cut.length) ng.push('★★★点の 帯の 名前が 切れて います：' + sb.cut.join('・') + '（★字が 大きすぎます）');
    if (sb.n !== 4) ng.push('★点の 帯の 名前が ' + sb.n + '個（★4個 の はず）');
    if (!(sb.numF >= 11)) ng.push('★★点の 帯の 数の 字が ' + sb.numF + 'px（★11px 以上 の はず）');
    if (geo.scoreH >= 44 && sb.numF < 14) {
      ng.push('★★★帯は ' + geo.scoreH + 'px あるのに 数の 字が ' + sb.numF + 'px しか ありません（★トライ T166 §7-2 と 同じ）');
    }
    if (!(sb.nameF < sb.numF)) ng.push('★点の 帯の 名前の 字が 数と 同じか 大きい（★読むのは 数の ほう です）');
    var sbCss = [];
    cssRuleList().forEach(function (r) {
      if (!/\.score-band/.test(r.sel)) return;
      var mm = r.text.match(/font-size:\s*([^;}]+)/);
      if (mm && mm[1].indexOf('var(') < 0) sbCss.push(r.sel + ' → ' + mm[1].trim());
    });
    if (sbCss.length) ng.push('★★★点の 帯の 字が CSS で 決め打ちに なって います：' + sbCss.join('・'));
    note['㉑ 点の 帯'] = '帯 ' + geo.scoreH + 'px（★余り ' + geo.scoreRoom + 'px）／数の 字 ' + sb.numF +
                        'px・名前 ' + sb.nameF + 'px／切れた 名前 ' + sb.cut.length + '件';

    /* ============================================================
       ㉒ ★★★山も すて札も 空に なる 場面（★ルル §18 コーダ⑥ の ご注文）★★★
       ★ ★ルルの【計算】では 1回 配る あたり 0.25回 混ぜ直しが 起き、★流れは 1.19%。
       ★ ★★「起きない はず」を そのまま 出しません ―― ★★本当に 起きる ように 追いこみます。
       ============================================================ */
    var dry = { made: 0, stuck: 0, cards: [], detail: [] };
    (function () {
      var rd = C.rng(777001);
      for (var t = 0; t < 200; t++) {
        var gg = C.makeGame(rd, { rules: rules, startP: t % 4 });
        /* ★ 山を わざと 1枚に して、★誰も 上がれない まま 回します */
        while (gg.stock.length > 1) gg.discard.push(gg.stock.pop());
        var guard = 0;
        while (!gg.over && guard++ < 400) {
          /* ★★ T208 ―― ★追いこみ役を **でたらめ** に かえました ★★
             ★ ★前は つよい ロボットで 追いこんで いました。★★ポンが 入った ので
               ★ ★★みんな 早く 上がって しまい、★山が 尽きる 前に 回が 終わります
               ★ ★（★つよい 0/200・★ためる人 0/200 ―― ★★ポンは ためる人にも 札を 出させます）。
             ★ ★★でたらめ なら 組を 作らない ので 手札が 減らず、★★172/200 で 山が 尽きます【実測】。
             ⚠️★ ★これは「ふだん こう なる」では ありません ―― ★★わざと 追いこむ ための 役 です。 */
          var o = C.P.random();
          /* ★★ T208 ―― ★★ここも ポンの 窓を 通します ★★
             ★ ★通さないと ―― ★★ポンが 開いた とたん doDraw が こけて、
               ★ ★★「山が 尽きる 場面を 1回も 作れない」に なります【★私の 実測・T208】。
             ★ ★★＝ ★追いこみの 道も、★遊びと 同じ 道で なければ なりません。 */
          if (gg.phase === 'pon') {
            var pc2 = gg.ponCands[0];
            if (C.botPon(gg, pc2, gg.ponCard, o)) {
              if (!C.doPon(gg, pc2).ok) { dry.stuck++; break; }
              o = C.P.random();
            } else { C.ponPass(gg); continue; }
          } else {
            var dr = C.doDraw(gg, C.botDraw(gg, o));
            if (!dr.ok) { if (dr.dry) dry.made++; break; }
          }
          C.botPlay(gg, o);
          var rr = C.doDiscard(gg, C.botDiscard(gg, o));
          if (!rr.ok) { dry.stuck++; break; }
        }
        if (guard >= 400) dry.stuck++;
        var n2 = gg.stock.length + gg.discard.length, u;
        for (u = 0; u < 4; u++) n2 += gg.hands[u].length;
        for (u = 0; u < gg.table.length; u++) n2 += C.meldLen(gg.table[u]);
        if (n2 !== 53) dry.cards.push(n2);
      }
    })();
    if (!dry.made) {
      ng.push('★★「山も すて札も 空に なる」場面を 1回も 作れませんでした（★試し方が おかしい ―― ' +
              '★★起きない ことの 証明には なりません）');
    }
    if (dry.stuck) ng.push('★★★山が 尽きた あと 進めなく なった 回が ' + dry.stuck + '件（★★遊びが 止まります）');
    if (dry.cards.length) ng.push('★★★山が 尽きた あと 札の 数が ちがう 回が ' + dry.cards.length + '件：' + dry.cards.slice(0, 5).join('・'));
    note['㉒ ★山が 尽きる'] = '200回 追いこんで ★おわりに なった ' + dry.made + '回／★止まった ' + dry.stuck +
                             '回／★札の 数ちがい ' + dry.cards.length + '回';

    /* ㉔ ★★手札は 8枚から 増えない */
    var hm = C.runMany(Math.max(300, Math.round(n * 0.5)), 8080, [C.P.bot5(), bot, bot, bot], null, 'match');
    if (hm.handMax > 8) ng.push('★★★手札が ' + hm.handMax + '枚に なりました（★8枚 の はず・ルル §8-1）');
    if (C.FIT.HAND_N !== 8) ng.push('★寸法の 手札枚数が ' + C.FIT.HAND_N + '（★8 の はず）');
    note['㉔ 手札の 最大'] = hm.handMax + '枚（★' + hm.games + '試合・★決まりの 上で 増えようが ありません）';

    /* ============================================================
       ★★★★ ㉕ ―― ★★T180 の 5つが **本当に 出て いるか**（★向きは ぜんぶ 逆）★★★★
       ------------------------------------------------------------
       ★ ★→ ★★設計図 §5.5「追記②の 例外」（2026-08-31・社長裁定）。
       ★ ★★アイの ご注文：「★わざと 消して 鳴る ことを 示して ください」。
         ★ ★→ ★下の ㉕-2 は、★★本物の 出せる しるしを **剥がして 鳴らして みせて から** 戻します。
       ★ ★見る 5つ：★①自動で 引く ★②出せる しるし ★③2つの ボタン ★④止まる 2択 ★⑤押せない 形
       ============================================================ */
    var t25 = { auto: '―', mark: '―', btn: '―', offer: '―', gray: '―', kill: '―', why: [] };
    (function () {
      var snap = snapG();
      var kBusy = busy, kOver = over, kPicks = picks, kOffer = offerOn, kNew = newCard;
      var tMark = timers.length;
      var kSay = sayEl.classList.contains('hidden'), kSayTx = sayEl.textContent;
      still(function () {
        /* ── ② 出せる しるし ―― ★そろう 3枚を わざと 入れたら 3枚 以上 しるしが 付くか ── */
        restoreG(snap);
        busy = false; over = false; picks = {}; offerOn = false;
        g.cur = 0; g.phase = 'play'; g.over = false;
        var set3 = [0 * 13 + 4, 1 * 13 + 4, 2 * 13 + 4];      /* ★ 5が 3枚 */
        var other = [3 * 13 + 1, 3 * 13 + 9, 1 * 13 + 11];
        var want = set3.concat(other), rest = [], i;
        for (i = 0; i < 53; i++) if (want.indexOf(i) < 0) rest.push(i);
        g.hands[0] = want.slice(); g.table = [];
        g.hands[1] = rest.splice(0, 7); g.hands[2] = rest.splice(0, 7); g.hands[3] = rest.splice(0, 7);
        g.discard = rest.splice(0, 2); g.stock = rest;
        rebuild(); placeAll(true);
        var markN = cardsEl.querySelectorAll('.card.is-play').length;
        t25.mark = markN + '枚（★3枚 以上 の はず）';
        if (markN < 3) {
          t25.why.push('★★★★そろう 3枚を わざと 入れたのに 出せる しるしが ' + markN + '枚 しか 出ません' +
                       '（★社長指示② ―― ★設計図 §5.5「追記②の 例外」2026-08-31）');
        }
        /* ★★ ㉕-2 ―― ★わざと 剥がして 鳴る ことを 見せる（★★見張りが 空うちして いない 証拠）★★ */
        var kk = cardsEl.querySelectorAll('.card.is-play');
        for (i = 0; i < kk.length; i++) kk[i].classList.remove('is-play');
        var after = cardsEl.querySelectorAll('.card.is-play').length;
        refreshPlay();
        var back = cardsEl.querySelectorAll('.card.is-play').length;
        t25.kill = '剥がすと ' + after + '枚（★見張りは ここで 鳴ります）→ 戻すと ' + back + '枚';
        if (!(after === 0 && back >= 3)) {
          t25.why.push('★★★出せる しるしを 剥がしても／戻しても 数が 変わりません（★試し方が おかしい）');
        }
        /* ── ③⑤ 2つの ボタン ―― ★出て いるか・押せない ときは 灰色か ── */
        picks = {}; refreshPlay(); refreshGo();
        var vis = !btnGo.classList.contains('hidden') && !btnPass.classList.contains('hidden');
        t25.btn = vis ? '○ 2つ とも 出て いる' : '★★✕ 出て いない';
        if (!vis) t25.why.push('★★★出す 番なのに ボタンが 出て いません（★社長指示③）');
        var g0 = btnGo.disabled, p0 = btnPass.disabled;
        picks = {}; picks[set3[0]] = 1; picks[set3[1]] = 1; picks[set3[2]] = 1;
        refreshPlay(); refreshGo();
        var g1 = btnGo.disabled;
        picks = {}; picks[other[0]] = 1;
        refreshPlay(); refreshGo();
        var p1 = btnPass.disabled;
        t25.gray = '何も えらばない：出す ' + (g0 ? '灰色' : '★押せる') + '／すてる ' + (p0 ? '灰色' : '★押せる') +
                   '　組を えらぶ：出す ' + (g1 ? '★灰色' : '押せる') +
                   '　1枚 えらぶ：すてる ' + (p1 ? '★灰色' : '押せる');
        if (!g0 || !p0) t25.why.push('★★★何も えらんで いないのに ボタンが 押せます（★社長指示⑤）');
        if (g1) t25.why.push('★★★組を えらんだのに「場に出す」が 押せません');
        if (p1) t25.why.push('★★★1枚 えらんだのに「すてる」が 押せません');
        if (!btnGo.classList.contains('hidden') && btnGo.disabled === undefined) {
          t25.why.push('★★押せない ボタンが 消えて います（★★灰色で のこす のが 社長指示⑤）');
        }
        /* ── ①④ 自動で 引く／止まる 2択 ── */
        restoreG(snap);
        busy = false; over = false; picks = {}; offerOn = false;
        g.cur = 0; g.phase = 'draw'; g.over = false;
        /* ★★ すて札の 一番上を「ぜったい つかえない 1枚」に する ―― ★★自動で 引く はず ★★
           ⚠️★★ ここは はじめ「山から 手札に 無い 1枚」を 適当に 乗せて いました【★私の 失敗④・T180】
              ―― ★★たまたま つかえる 札が 乗ると 鳴る、★**気まぐれな 見張り** でした。
              ★ ★実際に 812×375 で 1回 鳴り、★私が 気づきました。★★ここは 手で 組みます。
           ★ ★手札 … マークも 数字も ばらばら（★組にも 並びにも ならない 5枚）
           ★ ★すて札の 上 … ★4つ目の マークの 札（★手札に 同じ 数字も 同じ マークも ありません）
           ★ ★場 … 空っぽ（★足せる 先が ありません）

           ⚠️★★★ T198 ―― ★★ここは **7 では いけなく なりました** ★★★
              ★ ★T180 の 私は ここに ★**スペードの 7**（3*13+6）を 置いて いました。
                ★ ★「7は 0点で つかい道が ない」と 思って いた から です。
              ★ ★★7が 1枚でも 出せる ように なった いま、★★7は **いつでも つかえる 札** です
                ―― ★★だから この 見張りが 正しく 鳴りました（★★これが 見張りの 仕事 です）。
              ★ ★★スペードの K に かえました（★手札に K も スペードも ありません）。
                ★ ★★ここを また 7に 戻すと、★同じ ところが また 鳴ります。 */
        g.table = [];
        var noHand = [0 * 13 + 0, 0 * 13 + 4, 0 * 13 + 8, 1 * 13 + 2, 2 * 13 + 10];
        var noTop = 3 * 13 + 12;                  /* ★ スペードの K（★T198：★7では なくなりました）*/
        var noRest = [], nz;
        for (nz = 0; nz < 53; nz++) if (noHand.indexOf(nz) < 0 && nz !== noTop) noRest.push(nz);
        g.hands[0] = noHand.slice();
        g.hands[1] = noRest.splice(0, 7); g.hands[2] = noRest.splice(0, 7); g.hands[3] = noRest.splice(0, 7);
        g.discard = [noTop]; g.stock = noRest;
        var offA = discardOffer();
        /* ★ こんどは「ぜったい つかえる 1枚」―― ★★止まる はず
           ★ ★手札の 3枚組の うち 1枚を すて札の 上に 置くと、★のこり 2枚＋それで 組に なります */
        restoreG(snap);
        busy = false; over = false; picks = {}; offerOn = false;
        g.cur = 0; g.phase = 'draw'; g.over = false;
        g.table = [];
        var w2 = set3.concat(other), rest2 = [], j;
        for (j = 0; j < 53; j++) if (w2.indexOf(j) < 0) rest2.push(j);
        g.hands[0] = [set3[0], set3[1]].concat(other);      /* ★ 5が 2枚 ＋ 3枚 */
        g.hands[1] = rest2.splice(0, 7); g.hands[2] = rest2.splice(0, 7); g.hands[3] = rest2.splice(0, 7);
        g.stock = rest2; g.discard = [set3[2]];             /* ★ すて札の 上 ＝ 3枚目の 5 */
        var offB = discardOffer();
        t25.offer = 'つかえない 1枚 → ' + (offA ? '★★✕ 止まる' : '○ 自動で 引く') +
                    '　／つかえる 1枚 → ' + (offB ? '○ 止まって 2択' : '★★✕ 止まらない');
        if (offA) t25.why.push('★★つかえない すて札でも 止まって います（★毎手番 聞かれます）');
        if (!offB) {
          t25.why.push('★★★★すて札が つかえる のに 止まりません（★社長指示④）―― ' +
                       '★★これだと「すて札を もらう」が 消え、勝率が 68.51% → 46.48% に 落ちます【実測・T180】');
        }
        /* ★ 自動で 引く 道が つながって いるか（★本物の autoDraw を 通す）*/
        restoreG(snap);
        busy = false; over = false; picks = {}; offerOn = false;
        g.cur = 0; g.phase = 'draw'; g.over = false;
        var h0 = g.hands[0].length, s0 = g.stock.length;
        autoDraw();
        t25.auto = (g.hands[0].length === h0 + 1 && g.stock.length === s0 - 1 && g.phase === 'play')
          ? '○ 山から 1枚 入った' : '★★✕ 引けない';
        if (!(g.hands[0].length === h0 + 1 && g.phase === 'play')) {
          t25.why.push('★★★自動で 引く ところが 動いて いません（★社長指示①）');
        }
        /* ★ 引いた 1枚が 見えて いるか（★一瞬で 消さない・アイの ご注文）*/
        var newN = cardsEl.querySelectorAll('.card.is-new').length;
        if (newN !== 1) t25.why.push('★★引いた 1枚の 印（is-new）が ' + newN + '個（★1個 の はず）');
        t25.auto += '／★引いた 1枚の 印 ' + newN + '個';
      });
      for (var t = timers.length - 1; t >= tMark; t--) { clearTimeout(timers[t]); timers.splice(t, 1); }
      picks = kPicks; offerOn = kOffer;
      clearNew(); newCard = kNew;
      restoreG(snap);
      busy = kBusy; over = kOver;
      sayEl.textContent = kSayTx;
      if (kSay) sayEl.classList.add('hidden'); else sayEl.classList.remove('hidden');
      if (g) { rebuild(); placeAll(true); refreshGo(); }
    })();
    for (i = 0; i < t25.why.length; i++) ng.push(t25.why[i]);
    note['㉕ ★★T180 の 5つ'] = '①自動で 引く ' + t25.auto + '／②出せる しるし ' + t25.mark +
                               '／③ボタン ' + t25.btn + '／④' + t25.offer + '／⑤' + t25.gray;
    note['㉕-2 ★★わざと 消して 鳴らす'] = t25.kill + '（★' + lnp.killRings + '）';

    /* ============================================================
       ★★★★ ㉗ ―― ★★T205-3：★2つの しるしの 色が ぶつかって いないか ★★★★
       ------------------------------------------------------------
       ★ ★社長の お決め（2026-09-02）：★出せる しるしを ★★ピンク（#C43A73）に する。
       ★ ★★私（コーダ）は 数える 段で こう 書きました ――
         ★ ★★「えらんだ しるし（.card.is-pick）も ピンク（#E94F8A）です。★ぶつかります」。
       ★ ★★アトの 返事【実測】：★★「ぶつかりません。★★片方が **1本も 描かれて いない** から です」。
         ★ ★★＝ ★★私の 心配は 当たって いて、★★相手が いま たまたま 消えて いる だけ でした。

       ★★ だから ―― ★★これは **未来に しかける わな** です ★★
         ★ ★いまは 鳴りません（★えらんだ しるしが 描かれて いない ので）。
         ★ ★★誰かが .card.is-pick を 直した **その瞬間に** 鳴ります。

       ⚠️★★★ ★★「名前が あるか」は 見ません（★アトの ご指摘）★★★
          ★ ★アト：「見張り④は CSS に 名前が あるかを 見て いるだけ ―― ★中身を 空に しても 通る。
            ★ ★★見張って いる ふり です」。
          ★ ★★だから ここは **見え方の 決まり**を 測ります ―― ★★私が 目で 確かめた もの です【実測】：
            ★ ★★outline-offset が **マイナス** … ★.card-in（★白い 地・inset:0）が 上から ぬる → ★★見えない
            ★ ★★outline-offset が **0 か プラス** … ★★見える
            ★ ★（★3枚に −3px／0px／+3px を 付けて 写真で 見くらべました。★−3px だけ 1本も 出ません）
          ★ ★★もう 1つの 直し方 ―― ★.card-in::after に 引く（★出せる しるしが やって いる 形）も 見ます。

       ★★ 鳴る 線 ―― ★★ΔRGB（★赤緑青の へだたり）★★
         ★ ★同じ ピンク どうし … ★★**48.4**（★#C43A73 と #E94F8A）【アトの 実測】
         ★ ★青だった ころ ……… ★★**217.6**
         ★ ★★線は **100**【★私の 見立て】―― ★48.4 では 鳴り、★217.6 では 通ります。
           ★ ★★色は アトの 持ちもの です。★★数を 動かすなら ここ 1か所（DELTA_MIN）です。
       ============================================================ */
    var t27 = { drawn: '―', delta: '―', arm: '―' };
    (function () {
      var DELTA_MIN = 100;                       /* ★★ 鳴る 線（★アトが 動かす なら ここ）*/
      function rgb(str) {
        /* ⚠️★★ ここの 数の 取り出しで 1度 つまずきました【★私の 失敗・T205-3】――
           ★ ★正規表現の 逆スラッシュが 途中で 消え、★★いつも null を 返して いました。
           ★ ★★見張り自身が「空うちして います」と 鳴って 教えて くれました。
           ★ ★★逆スラッシュを 使わない 形に して あります（★0〜9 を そのまま 拾う）。 */
        var m = String(str).match(/[0-9]+/g);
        return (m && m.length >= 3) ? [+m[0], +m[1], +m[2]] : null;
      }
      function dRGB(a, b) {
        if (!a || !b) return -1;
        var dr = a[0] - b[0], dg = a[1] - b[1], db = a[2] - b[2];
        return Math.sqrt(dr * dr + dg * dg + db * db);
      }
      /* ★ 「えらんだ しるし」が 本当に 見えるか ―― ★★見え方の 決まりで 測ります */
      function pickInk(el) {
        var cs = getComputedStyle(el);
        /* ★ ① 札そのものに 引いた わく（outline）*/
        var w = parseFloat(cs.outlineWidth) || 0;
        var off = parseFloat(cs.outlineOffset) || 0;
        if (w > 0 && cs.outlineStyle !== 'none') {
          if (off >= 0) return { how: 'outline（外がわ）', ink: rgb(cs.outlineColor) };
          /* ★★ 内がわ ―― ★.card-in が 上から ぬって いなければ 見えます */
          var inn = el.querySelector('.card-in');
          var covered = !!inn && getComputedStyle(inn).backgroundColor !== 'rgba(0, 0, 0, 0)';
          if (!covered) return { how: 'outline（内がわ・上に 何も ない）', ink: rgb(cs.outlineColor) };
        }
        /* ★ ② 中の 紙に 引いた わく（★出せる しるしと 同じ 形）*/
        var inn2 = el.querySelector('.card-in');
        if (inn2) {
          var ps = ['::after', '::before'], q;
          for (q = 0; q < ps.length; q++) {
            var pc = getComputedStyle(inn2, ps[q]);
            var bw = parseFloat(pc.borderTopWidth) || 0;
            if (pc.content !== 'none' && bw > 0) return { how: '.card-in' + ps[q], ink: rgb(pc.borderTopColor) };
          }
        }
        return null;
      }
      var host = null, all = cardsEl ? cardsEl.querySelectorAll('.card') : [];
      for (var z = 0; z < all.length; z++) if (all[z].where === 'me') { host = all[z]; break; }
      if (!host) { t27.drawn = '★試し方が おかしい（★手札の 札が ない）'; return; }
      var kCls = host.className, kOff = host.style.outlineOffset;
      /* ⚠️★★★★ ここで 空砲を 撃って いました【★私の 失敗・T205-4・トライが 見つけました】★★★★
         ★ ★★見本の 土台に **その 札の いまの class**（kCls）を 使って いました。
         ★ ★★左はしの 札が たまたま「出せる しるし」付き だと ―― ★"card is-play is-pick" に なり、
           ★ ★★pickInk が **「出せる」の わく自身** を「えらんだ しるし」として 拾い、
           ★ ★★ΔRGB 0.0 → ★★鳴って いました（★★配りの 17.5%・トライの 実測）。
         ★ ★★＝ ★出荷の 関門が うそを ついて いました。★★土台は "card" に 固定します。
         ★ ★（★戻す ときは kCls に 戻します ―― ★見張りは 見るだけ・T144 §7-5）*/
      var BASE = 'card';
      /* ★ くらべる 相手 ―― ★「出せる しるし」の 色 */
      host.className = BASE + ' is-play';
      var playInk = pickInk(host);
      /* ★ いまの「えらんだ しるし」*/
      host.className = BASE + ' is-pick';
      var pickNow = pickInk(host);
      var dNow = pickNow && playInk ? dRGB(pickNow.ink, playInk.ink) : -1;
      t27.drawn = pickNow
        ? '★★えらんだ しるしは **描かれて います**（' + pickNow.how + '）'
        : '○ えらんだ しるしは いま 描かれて いません（★だから 鳴りません）';
      if (pickNow) {
        t27.delta = 'ΔRGB ' + dNow.toFixed(1) + '（★線 ' + DELTA_MIN + '）';
        if (dNow < DELTA_MIN) {
          ng.push('★★★★2つの しるしの 色が 近すぎます ―― ★ΔRGB ' + dNow.toFixed(1) +
                  '（★線 ' + DELTA_MIN + '）。★★「出せる」と「えらんだ」が 見分けられません。' +
                  '★★どちらかの 色を 変えて ください（★色は アトの 持ちもの です）');
        }
      } else {
        t27.delta = '―（★描かれて いない ので くらべられません）';
      }
      /* ★★★ わざと 描かせて、★この 見張りが 本当に 鳴るか その場で 見せる ★★★ */
      host.className = BASE + ' is-pick';
      host.style.outlineOffset = '0px';           /* ★ 内がわ → 外がわ ＝ 見える ように なる */
      var armed = pickInk(host);
      var dArm = armed && playInk ? dRGB(armed.ink, playInk.ink) : -1;
      /* ★ さわった ものを 1つ 残らず 戻す（★T144 §7-5）*/
      host.style.outlineOffset = kOff;
      host.className = kCls;
      if (host.className !== kCls) {
        ng.push('★★★見張り ㉗ が 札の class を 戻せて いません（★見張りが 場面を こわして います）');
      }
      /* ⚠️★★★★ ここも まちがって いました【★私の 失敗・T205-5・アトの ご注意で 気づきました】★★★★
         ★ ★★前は「わざと 描かせたら **ΔRGB が 線を 下回る** こと」を 確かめて いました。
           ★ ★★＝ ★★「2つの 色が 近い」ことを **前提に して しまって いた** のです。
         ★ ★★だから ―― ★★わくを 青に 戻すと（★ΔRGB 217.6 ＝ 正しく 離れて いる）、
           ★ ★★この 目が「空うちして います」と **うその NG** を 出して いました【★実測】。
         ★ ★★アトの ご注意「★青に 戻すと ㉗ が 鳴る」は **当たって いました**
           ―― ★ただし 理由は「色が ぶつかる から」では なく、★★私の 試し方が 悪かった から です。
         ★ ★★直し：★arm が 見るのは **「見つけられるか」だけ** に します。
           ★ ★★色が 離れて いるか どうかは 上の 決まりの 仕事 です（★arm の 仕事では ない）。
           ★ ★★＝ ★★これで ㉗ は **色に よらず** 正しく 働きます（★青でも ピンクでも）。 */
      t27.arm = armed
        ? '○ わざと 描かせたら 見つけられました（★ΔRGB ' + dArm.toFixed(1) + '／線 ' + DELTA_MIN + '）' +
          ' ―― ★★見張りは 生きて います'
        : '★★✕ わざと 描かせても 見つけられません（★空うち）';
      if (!armed) {
        ng.push('★★★「2つの しるしの 色」の 見張りが 空うちして います' +
                '（★わざと 描かせても「描かれた」と 分かりません）');
      }
    })();
    note['㉗ ★★★2つの しるしの 色（T205-3）'] = t27.drawn + '／' + t27.delta + '／★★' + t27.arm;

    /* ============================================================
       ★★★★ ㉛ ―― ★★T208-3：★ハッピーの ことばは 読み切れる 長さ 出て いるか ★★★★
       ------------------------------------------------------------
       ★ ★トライの 実測：★おとなは **100〜150ms/字**。★★この 本は 小学生が 遊びます。
       ★ ★★線は **150ms/字**（★おとなの 上の線）―― ★★どの 文も これを 割っては いけません。
       ★ ★★出す 側は 160ms/字 なので、★ふだんは 10ms/字 の 余りが あります。
       ★ ★★30字を こえる 文は ふた（4500ms）に 当たって 線を 割ります
         ★ ★＝ ★★「文を 短くしろ」の 線 でも あります。
       ⚠️★ ★★数だけ 見て いません ―― ★★どの 文が 何字で 何ms かを **ぜんぶ 書き出します**
          ★ ★（★T205-6 の 学び：★「何通り」だけでは 中身の まちがいが 通る）。
       ============================================================ */
    var t31 = { line: '―', worst: '―', list: '―', kill: '―' };
    (function () {
      var MIN_PER_CHAR = 150;
      var names = [], k2, bad = [], rows = [];
      for (k2 in SAY) if (SAY.hasOwnProperty(k2) && typeof SAY[k2] === 'string') names.push(k2);
      /* ★ 勝ち負けの 文も 見ます（★{名前} は いちばん 長い 名前で 入れかえ）*/
      var longest = seatName(1);
      for (var q = 2; q < 4; q++) if (seatName(q).length > longest.length) longest = seatName(q);
      var extra = [['SAY_WIN', SAY_WIN], ['SAY_LOSE', SAY_LOSE],
                   ['SAY_DEAL_ME', SAY_DEAL_ME], ['SAY_DEAL_OT', SAY_DEAL_OT]];
      var all = names.map(function (nm) { return [nm, SAY[nm]]; }).concat(extra);
      var worstRate = 1e9, worstName = '';
      for (var i2 = 0; i2 < all.length; i2++) {
        var txt = String(all[i2][1]).replace('{名前}', longest);
        var nCh = txt.length;
        var ms = holdFor(txt);
        var rate = ms / nCh;
        rows.push(all[i2][0] + ' ' + nCh + '字→' + ms + 'ms(' + rate.toFixed(0) + ')');
        if (rate < worstRate) { worstRate = rate; worstName = all[i2][0] + '（' + nCh + '字）'; }
        if (rate < MIN_PER_CHAR) bad.push(all[i2][0] + ' ' + nCh + '字 ' + rate.toFixed(0) + 'ms/字');
      }
      t31.line = '線 ' + MIN_PER_CHAR + 'ms/字（★出す 側は ' + T.SAY_MS_PER_CHAR + 'ms/字）';
      t31.worst = 'いちばん きつい ' + worstName + ' ' + worstRate.toFixed(0) + 'ms/字';
      t31.list = rows.join('／');
      if (bad.length) {
        ng.push('★★★★ハッピーの ことばが 読み切れない 速さです：' + bad.join('・') +
                '（★線 ' + MIN_PER_CHAR + 'ms/字。★おとなでも 100〜150ms/字 かかります）' +
                '―― ★★文を 短くするか、★1字あたりの 時間を のばして ください');
      }
      /* ★★ わざと 壊す ―― ★1字あたりを 下げると 鳴る ことを その場で 見せる ★★ */
      var keep = T.SAY_MS_PER_CHAR;
      T.SAY_MS_PER_CHAR = 40;
      var killWorst = 1e9, kt;
      for (var j2 = 0; j2 < all.length; j2++) {
        kt = String(all[j2][1]).replace('{名前}', longest);
        killWorst = Math.min(killWorst, holdFor(kt) / kt.length);
      }
      T.SAY_MS_PER_CHAR = keep;
      var backWorst = 1e9;
      for (var j3 = 0; j3 < all.length; j3++) {
        kt = String(all[j3][1]).replace('{名前}', longest);
        backWorst = Math.min(backWorst, holdFor(kt) / kt.length);
      }
      t31.kill = (killWorst < MIN_PER_CHAR && backWorst >= MIN_PER_CHAR)
        ? '○ 1字あたりを 40ms に 下げると ' + killWorst.toFixed(0) +
          'ms/字 ＝ ★★線を 割り、見張りは 鳴ります（★戻すと ' + backWorst.toFixed(0) + '）'
        : '★★✕ 下げても 変わりません（★空うち。★下げた ' + killWorst.toFixed(0) +
          '／戻した ' + backWorst.toFixed(0) + '）';
      if (!(killWorst < MIN_PER_CHAR && backWorst >= MIN_PER_CHAR)) {
        ng.push('★★★「ことばの 速さ」の 見張りが 空うちして います');
      }
    })();
    note['㉛ ★★★ことばの 速さ（T208-3）'] = t31.line + '／★' + t31.worst + '／★★' + t31.kill;
    note['㉛-2 ★ことばの 1つずつ'] = t31.list;

    /* ============================================================
       ★★★★ ㉚ ―― ★★T208：★ポンの 割り込み（★ルル T207 §5-4 の 6つ）★★★★
       ------------------------------------------------------------
       ★ ★ルルの 番号は ⑳-1〜⑳-6 でしたが、★★この 本の ⑳ は「誰が 勝ったか」です。
         ★ ★★ぶつかる ので ㉚-1〜㉚-6 に しました（★中身は そのまま）。
       ★ ★★数える 側は **出荷する core を そのまま** 通します（★画面と 同じ 打ち手）。
       ============================================================ */
    var t30 = { deck: '―', meld: '―', both: '―', bot: '―', keep: '―', ask: '―', kill: '―', have: '―', kill0: '―' };
    (function () {
      var m = Math.max(300, Math.round(n * 0.6));
      var lv0 = C.LEVELS[C.LEVEL_START].o, hu = C.HUMANS[0].o;
      var off = function (o) { var q = {}, k; for (k in o) if (o.hasOwnProperty(k)) q[k] = o[k]; q.noPon = true; return q; };
      /* ★ ㉚-1／㉚-2：★札は 53枚・★ポンで 出た 組は 3枚以上（★どちらも simDeal の 中で 数えて います）*/
      var st = C.runMany(m, 31337, [lv0, lv0, lv0, lv0], null, 'match');
      t30.deck = (st.illegal === 0) ? '○ 反則・札の 数ちがい 0件' : '★★✕ ' + st.illegal + '件';
      if (st.illegal) {
        ng.push('★★★★ポンを 入れたら 反則・札の 数ちがいが ' + st.illegal + '件（★53枚が 保てて いません）');
      }
      /* ★ ㉚-3／㉚-5／㉚-6：★1回 配る ぶんを 手で 回して 数えます */
      var rand = C.rng(20260903), i, guard;
      var deals = Math.max(200, Math.round(n * 0.4));
      var both = 0, ask = 0, badKeep = 0, ponN = 0, meldBad = 0;
      var os = [hu, lv0, lv0, lv0];
      for (i = 0; i < deals; i++) {
        var gg = C.makeGame(rand, { rules: C.defaultRules(), startP: i % 4 });
        guard = 0;
        while (!gg.over && guard++ < 600) {
          var o2 = os[gg.cur];
          if (gg.phase === 'pon') {
            if (gg.ponCands.length > 1) both++;
            if (gg.ponCands.indexOf(0) >= 0) ask++;
            var pc = gg.ponCands[0];
            var hb = gg.hands[pc].length;
            var r2 = C.doPon(gg, pc);
            if (!r2.ok) break;
            ponN++;
            /* ★ ㉚-2：★出た 組は 3枚以上 */
            if (!C.meldOk(gg.table[gg.table.length - 1])) meldBad++;
            /* ★ ㉚-5：★すてる 1枚が のこって いるか */
            if (gg.hands[pc].length < 1) badKeep++;
            o2 = os[gg.cur];
          } else {
            var dr = C.doDraw(gg, C.botDraw(gg, o2));
            if (!dr.ok) break;
          }
          C.botPlay(gg, o2);
          if (!C.doDiscard(gg, C.botDiscard(gg, o2)).ok) break;
        }
      }
      /* ============================================================
         ⚠️★★★★ ★★下の 線（★トライが 見つけた 穴・T208-2）★★★★
         ★ ★前は「人に 聞く 回数が **1.0を こえたら** 鳴る」しか ありませんでした。
           ★ ★★＝ ★★ポンを 丸ごと 消して **0回**に しても、★「こえて いない」ので ○。
           ★ ★★同時ポン 0件も・組は 3枚以上も、★★ポンが 0回なら ぜんぶ 自動で ○。
         ★ ★★＝ ★★決まりを 丸ごと 消しても 1つも 鳴らない 見張り でした。
         ★ ★★これで **5回目** です（★㉗の 空砲・★㉗の 焼きこみ・★逆スラッシュ・★picks の のこり）。
         ★ ★★学び：★★「無い ことだけ 数える」見張りは、★★**先に 有る ことを 数える**。
         ★ ★線は 実測から ―― ★トライ 0.39〜0.59／私 0.38〜0.61 回・配り。
           ★ ★★下の 線は **0.15**（★いちばん 小さい 実測の 2.5分の1。★0 は 必ず 捕まえます）。
         ============================================================ */
      var askPer = ask / deals;
      t30.have = 'ポン ' + ponN + '回 / ' + deals + '回 配り（★★1回も 起きなければ 鳴ります）';
      if (ponN <= 0) {
        ng.push('★★★★ポンが 1回も 起きて いません（' + deals + '回 配り）―― ' +
                '★★決まりが 消えて いるか、★窓が 開いて いません。' +
                '★★（★この 下の「同時ポン 0件」「組は 3枚以上」は、★ポンが 0回なら 意味が ありません）');
      }
      if (askPer < 0.15) {
        ng.push('★★★★人に「ポンしますか」と 聞く 回数が ' + askPer.toFixed(2) +
                ' 回／配り ―― ★★少なすぎます（★下の 線 0.15。★実測は 0.38〜0.61）。' +
                '★★人に 聞く 道が 消えて いませんか');
      }
      t30.both = (both === 0) ? '○ 同時ポン 0件（★' + deals + '回 配り・ポン ' + ponN + '回）'
                              : '★★✕ 同時ポンが ' + both + '件';
      if (both) {
        ng.push('★★★同時に 2人 ポンできる 場面が ' + both + '件 出ました ―― ' +
                '★★ルルの 算数（★47,109回中 0件）が くずれて います。★優先順位の 決まりが 要ります');
      }
      t30.meld = (meldBad === 0) ? '○ ポンで 出た 組は ぜんぶ 3枚以上' : '★★✕ ' + meldBad + '件';
      if (meldBad) ng.push('★★★★ポンで 2枚以下の 組が 場に 出ました（' + meldBad + '件）―― ★反則です');
      t30.keep = (badKeep === 0) ? '○ ポンの あと すてる 1枚が のこって いる' : '★★✕ ' + badKeep + '件';
      if (badKeep) ng.push('★★★★ポンの あと 手札が 0枚に なりました（' + badKeep + '件）―― ★すてられません');
      t30.ask = '人に 聞く ' + askPer.toFixed(2) + ' 回／配り（★★線 0.15 〜 1.0）';
      if (askPer > 1.0) {
        ng.push('★★★人に「ポンしますか」と 聞く 回数が ' + askPer.toFixed(2) +
                ' 回／配り ―― ★★ルル §1（0.35〜0.58）を 大きく こえて います');
      }
      /* ============================================================
         ★★★★ ㉚-0 ―― ★★下の 線が 本当に 鳴るか、その場で 見せる ★★★★
         ★ ★★外から C.ponCands を 差しかえても **効きません**（★中の doDiscard は
           ★ ★中の ponCands を 見て います ―― ★T205-3 で 同じ 穴を 踏みました）。
         ★ ★★だから core に もとから ある 口（★doDiscard の 第3引数 noPon）を 使います。
         ★ ★★＝ ★★窓を 1度も 開かせずに 回し、★ポン 0回・聞く 0.00 に なる ことを 見せます。
         ============================================================ */
      var rand2 = C.rng(20260903), i2, guard2;
      var deals2 = Math.max(60, Math.round(deals * 0.3));
      var ponOff = 0, askOff = 0;
      for (i2 = 0; i2 < deals2; i2++) {
        var g3 = C.makeGame(rand2, { rules: C.defaultRules(), startP: i2 % 4 });
        guard2 = 0;
        while (!g3.over && guard2++ < 600) {
          if (g3.phase === 'pon') { askOff++; ponOff++; C.ponPass(g3); continue; }
          var o3 = os[g3.cur];
          var dr3 = C.doDraw(g3, C.botDraw(g3, o3));
          if (!dr3.ok) break;
          C.botPlay(g3, o3);
          /* ★★ ここ ―― ★★第3引数 true ＝ ★窓を 開かない */
          if (!C.doDiscard(g3, C.botDiscard(g3, o3), true).ok) break;
        }
      }
      var askOffPer = askOff / deals2;
      t30.kill0 = (ponOff === 0 && askOffPer < 0.15)
        ? '○ 窓を 開けなく すると ポン 0回・聞く ' + askOffPer.toFixed(2) +
          ' ＝ ★★下の 線（0.15）に 引っかかり、見張りは 鳴ります'
        : '★★✕ 窓を 開けなく しても ポン ' + ponOff + '回・聞く ' + askOffPer.toFixed(2) + '（★空うち）';
      if (!(ponOff === 0 && askOffPer < 0.15)) {
        ng.push('★★★「ポンが 起きて いるか」の 下の 線が 空うちして います' +
                '（★窓を 開けなく しても ポン ' + ponOff + '回）');
      }

      /* ★★ ㉚-4：★★ロボットの ポンを 切ったら はじめての人が 40% を こえる（★渡し忘れの 見張り）★★ */
      var onW = C.runMany(m, 777, [hu, lv0, lv0, lv0], null, 'match');
      var offW = C.runMany(m, 777, [hu, off(lv0), off(lv0), off(lv0)], null, 'match');
      var a1 = onW.win / onW.games * 100, a2 = offW.win / offW.games * 100;
      t30.bot = 'ロボットも ポン ' + a1.toFixed(1) + '% → ★★人だけ ' + a2.toFixed(1) + '%';
      t30.kill = (a2 > 40 && a1 < 40)
        ? '○ ロボットの ポンを 切ると 40%を こえます ＝ 見張りは 鳴ります'
        : '★★✕ 切っても 変わりません（★空うち）';
      if (!(a2 > 40 && a1 < 40)) {
        ng.push('★★★「ロボットも ポンする」の 見張りが 空うちして います' +
                '（★切っても ' + a2.toFixed(1) + '%／ふだん ' + a1.toFixed(1) + '%）');
      }
      if (a1 > 40) {
        ng.push('★★★★ロボットが ポンして いません ―― ★はじめての人が ' + a1.toFixed(1) +
                '% 勝って います（★五分 25%）。★★T197 §14 失敗2 と 同じ 形 です');
      }
    })();
    note['㉚ ★★★ポンの 割り込み（T208）'] =
        '★★' + t30.have + '／' + t30.deck + '／' + t30.meld + '／' + t30.both + '／' + t30.keep + '／★' + t30.ask;
    note['㉚-0 ★★★下の 線が 鳴るか（T208-2）'] = t30.kill0;
    note['㉚-4 ★★★ロボットも ポンするか'] = t30.bot + '／★★' + t30.kill;

    /* ============================================================
       ★★★★ ㉙ ―― ★★T205-6：★出せない えらび方を 押したら 理由が 出るか ★★★★
       ------------------------------------------------------------
       ★ ★トライ：「ピンクを 全部 えらぶと 両ボタンが 灰色。★押しても ゆれも ことばも 出ません」
       ★ ★★見るのは 3つ：
         ★ ★① ★出せない 4枚を えらんで 押したら ―― ★★ことばが 出る
         ★ ★② ★★言い分けて いる（★とぎれ／バラバラ／枚数 が 同じ 文に なって いない）
         ★ ★③ ★★えらんだ 札が ゆれる（★押した 手ごたえ）
       ★ ★★そして わざと 壊して、★鳴る ことを その場で 見せます。
       ⚠️★ ★★「どれを えらべば よいか」を 言って いない ことは ⑫ が 見て います（★手を 教える 言葉 0件）。
       ============================================================ */
    var t29 = { said: '―', kinds: '―', shake: '―', kill: '―' };
    (function () {
      var snap = snapG();
      var kBusy = busy, kOver = over, kPicks = picks;
      var kSayTx = sayEl.textContent, kSayHid = sayEl.classList.contains('hidden');
      var tMark = timers.length;
      still(function () {
        busy = false; over = false;
        g.phase = 'play'; g.cur = 0; g.over = false;
        /* ★ 手札を 手で 作る（★53枚は 保った まま）*/
        var mix = [0 * 13 + 2, 1 * 13 + 7, 2 * 13 + 10, 3 * 13 + 4, 0 * 13 + 11];  /* ★ バラバラ 5枚 */
        var run = [3 * 13 + 1, 3 * 13 + 3, 3 * 13 + 5];                            /* ★ 同じ マーク・とぎれ */
        var many = [0 * 13 + 6, 1 * 13 + 6, 2 * 13 + 6, 3 * 13 + 6];               /* ★ 同じ 数字 4枚 */
        var want = mix.concat(run), rest = [], q;
        for (q = 0; q < 53; q++) if (want.indexOf(q) < 0) rest.push(q);
        g.hands[0] = want.slice();
        g.hands[1] = rest.splice(0, 7); g.hands[2] = rest.splice(0, 7); g.hands[3] = rest.splice(0, 7);
        g.discard = rest.splice(0, 2); g.stock = rest; g.table = [];
        rebuild(); placeAll(true);
        function press(cs) {
          picks = {};
          for (var z = 0; z < cs.length; z++) picks[cs[z]] = 1;
          refreshPick(); refreshPlay(); refreshGo();
          sayEl.textContent = '';
          var wasDisabled = btnGo.disabled;
          btnGo.dispatchEvent(new Event('pointerup', { bubbles: true }));
          return { disabled: wasDisabled, msg: sayEl.textContent,
                   shook: cardsEl.querySelectorAll('.card.is-no').length };
        }
        var a = press([mix[0], mix[1], mix[2], mix[3]]);     /* ★ バラバラ 4枚 */
        var b = press(run);                                  /* ★ 同じ マーク・とぎれ 3枚 */
        var c = press([mix[0]]);                             /* ★ 1枚 */
        var d = press([mix[0], mix[1]]);                     /* ★ 2枚 */
        var e2 = press(g.hands[0].slice());                  /* ★ ぜんぶ */
        /* ★ 同じ 数字 5枚（★4まいまで）―― ★手札を 入れかえて 試します */
        var keepH = g.hands[0].slice(), keepRest = g.stock.slice();
        var five = [], q2;
        for (q2 = 0; q2 < 4; q2++) five.push(q2 * 13 + 5);   /* ★ 6が 4枚 */
        five.push(C.JOKER);
        var pool = [], q3;
        for (q3 = 0; q3 < 53; q3++) if (five.indexOf(q3) < 0) pool.push(q3);
        g.hands[0] = five.concat(pool.slice(0, 1));
        rebuild(); placeAll(true);
        var f2 = press(five);
        g.hands[0] = keepH; g.stock = keepRest;
        rebuild(); placeAll(true);
        var all29 = [a, b, c, d, e2, f2];
        var said = all29.filter(function (x) { return x.disabled && x.msg; }).length;
        var dis = all29.filter(function (x) { return x.disabled; }).length;
        t29.said = said + ' / ' + dis + ' の 場面で ことばが 出た';
        if (said < dis) {
          ng.push('★★★★出せない えらび方を 押しても ことばが 出ません（' + said + '/' + dis +
                  '）―― ★★遊ぶ人には 出口が 見えません（★トライ T205 🟡-1）');
        }
        var uniq = {};
        all29.forEach(function (x) { if (x.msg) uniq[x.msg] = 1; });
        var kinds = Object.keys(uniq).length;
        /* ★★ 出た ことばを **そのまま 書き出します** ―― ★★「何通り」だけだと、
           ★ ★★中身が まちがって いても 通って しまいます（★私の T205-4 の 反省）。 */
        t29.kinds = kinds + ' 通り：' + Object.keys(uniq).join(' ／ ');
        if (dis >= 2 && kinds < 2) {
          ng.push('★★★どの 出せない えらび方でも 同じ 文しか 出ません（' + kinds +
                  ' 通り）―― ★★遊ぶ人は 何も 分かりません');
        }
        t29.shake = (a.shook > 0) ? '○ えらんだ 札が ゆれた（' + a.shook + '枚）' : '★★✕ ゆれない';
        if (!(a.shook > 0)) ng.push('★★★押しても えらんだ 札が ゆれません（★押した 手ごたえが ありません）');
        /* ★★ わざと 壊す ―― ★ことばを 出す ところを 黙らせて、鳴る ことを 見せる ★★ */
        var keepSay = say;
        try {
          say = function () {};
          var e = press([mix[0], mix[1], mix[2], mix[3]]);
          say = keepSay;
          t29.kill = (e.disabled && !e.msg)
            ? '○ ことばを 止めると 出なく なる ＝ 見張りは 鳴ります'
            : '★★✕ 止めても 同じ（★空うち）';
          if (!(e.disabled && !e.msg)) {
            ng.push('★★★「出せない 理由を 言う」の 見張りが 空うちして います');
          }
        } catch (err) { say = keepSay; t29.kill = '★★✕ ' + err.message; }
        picks = {};
      });
      for (var t = timers.length - 1; t >= tMark; t--) { clearTimeout(timers[t]); timers.splice(t, 1); }
      picks = kPicks;
      restoreG(snap);
      busy = kBusy; over = kOver;
      sayEl.textContent = kSayTx;
      if (kSayHid) sayEl.classList.add('hidden'); else sayEl.classList.remove('hidden');
      if (g) { rebuild(); placeAll(true); refreshGo(); }
    })();
    note['㉙ ★★★出せない 理由を 言うか（T205-6）'] =
        t29.said + '／★' + t29.kinds + '／' + t29.shake + '／★★' + t29.kill;

    /* ★★★★ ㉘ ―― ★出せる札の わくが 本当に 描かれて いるか（★アトの 下書き）★★★★ */
    var t28 = wakuMihari(cardsEl);
    for (i = 0; i < t28.why.length; i++) ng.push(t28.why[i]);
    note['㉘ ★★★出せる しるしが 本当に 描かれて いるか（アト・T204-4）'] = t28.note + '／★★' + t28.arm;

    /* ============================================================
       ★★★★ ㉖ ―― ★★T205：★7への 付け足し と、★拾える 条件 ★★★★
       ------------------------------------------------------------
       ★ ★どちらも 社長が **実際に 遊んで** 見つけられた 穴 です。
       ★ ★★どちらも「わざと 壊すと 鳴る」ことを その場で 見せます。
       ============================================================ */
    var t26 = { lay: '―', layKill: '―', take: '―', takeKill: '―' };
    (function () {
      var H7 = 2 * 13 + 6, H8 = 2 * 13 + 7, H6 = 2 * 13 + 5, S7 = 3 * 13 + 6,
          H9 = 2 * 13 + 8, S8 = 3 * 13 + 7;
      /* ★ ㉖-1 ★場の 7（1枚）に 何が 乗るか */
      function fits(c) { return C.tableFits(C.makeMeld([H7], 1), c); }
      var okList = [[H8, '♥8'], [H6, '♥6'], [S7, '♠7']];
      var ngList = [[H9, '♥9'], [S8, '♠8'], [C.JOKER, 'JOKER']];
      var bad = [];
      okList.forEach(function (a) { if (!fits(a[0])) bad.push(a[1] + 'が 乗らない'); });
      ngList.forEach(function (a) { if (fits(a[0])) bad.push(a[1] + 'が 乗って しまう'); });
      /* ★ 乗せた あと 本当に 2枚の 並びに なるか */
      var mm = C.makeMeld([H7], 1);
      C.tablePut(mm, H8);
      var became = (mm.t === 'r' && C.meldLen(mm) === 2 && C.meldOk(mm));
      if (!became) bad.push('♥7＋♥8 が 2枚の 並びに ならない');
      t26.lay = bad.length ? '★★✕ ' + bad.join('・') : '○ ♥6・♥8・♠7 は 乗る／♥9・♠8・JOKER は 乗らない／♥7♥8 に なる';
      if (bad.length) {
        ng.push('★★★★場の 7（1枚）への 付け足しが ちがいます：' + bad.join('・') +
                '（★社長ご指摘・T205 ―― ★★場に ♥7 が あれば ♥6・♥8 は 付けられる はず です）');
      }
      /* ★★ わざと 壊す ―― ★★決まりを 外す 口（第3引数）を 使います ★★
         ⚠️★ ★★1度 つまずきました：★はじめ C.pair7 を **外から 差しかえて** いました。
            ★ ★★でも core の 中の tableFits は 元の pair7 を 見て いる ので、★何も 変わらず ――
            ★ ★★見張りが「空うちして います」と 自分で 鳴りました【★私の 失敗・作業メモ §5】。 */
      var killed = C.tableFits(C.makeMeld([H7], 1), H8, true);   /* ★ 外した とき */
      var back = C.tableFits(C.makeMeld([H7], 1), H8);           /* ★ ふだん */
      t26.layKill = (!killed && back)
        ? '○ 決まりを 外すと ♥8 が 乗らなく なる ＝ 見張りは 鳴ります（★戻すと また 乗る）'
        : '★★✕ 外しても 同じ（★空うち）';
      if (killed || !back) ng.push('★★★「場の 7に 6・8 を 付ける」の 目が 空うちして います');

      /* ★ ㉖-2 ★拾える 条件 ―― ★社長が 挙げられた 場面 そのもの */
      function scene(hand, top) {
        var gg = C.makeGame(C.rng(1), { rules: C.defaultRules() });
        gg.hands[0] = hand.slice(); gg.discard = [top]; gg.cur = 0; gg.phase = 'draw';
        return gg;
      }
      var pad = [0 * 13 + 0, 1 * 13 + 3, 3 * 13 + 10, 2 * 13 + 11, 0 * 13 + 8, 1 * 13 + 9];
      var g2A = scene([H8].concat(pad), H7);                    /* ★ ♥8 だけ → 2枚 ＝ だめ */
      var g2B = scene([H8, H9].concat(pad.slice(0, 5)), H7);    /* ★ ♥8♥9 → 3枚の 並び ＝ チー */
      var g2C = scene([S7, 1 * 13 + 6].concat(pad.slice(0, 5)), H7); /* ★ 7が 2枚 → 3枚の 組 ＝ ポン */
      var b2 = [];
      if (C.takeOk(g2A)) b2.push('★2枚の 並びで 拾えて しまう（★社長ご指摘の 場面）');
      if (!C.takeOk(g2B)) b2.push('チー（3枚の 並び）で 拾えない');
      if (!C.takeOk(g2C)) b2.push('ポン（3枚の 組）で 拾えない');
      var drA = C.doDraw(scene([H8].concat(pad), H7), 'discard');
      if (drA.ok) b2.push('★引く 道が 止めて いない');
      t26.take = b2.length ? '★★✕ ' + b2.join('・') : '○ 2枚では 拾えない／チー ○／ポン ○／引く 道も 止まる';
      if (b2.length) {
        ng.push('★★★★すて札を 拾える 条件が ちがいます：' + b2.join('・') +
                '（★社長ご指摘・T205 ―― ★★拾えるのは ポン／チーの ときだけ です）');
      }
      /* ★★ わざと 壊す ―― ★決まりを 外すと 2枚でも 拾えて しまう ことを 見る */
      var killOn = C.takeOk(scene([H8].concat(pad), H7), true);
      t26.takeKill = (killOn && !C.takeOk(scene([H8].concat(pad), H7)))
        ? '○ 決まりを 外すと 2枚でも 拾えて しまう ＝ 見張りは 鳴ります'
        : '★★✕ 外しても 同じ（★空うち）';
      if (!(killOn && !C.takeOk(scene([H8].concat(pad), H7)))) {
        ng.push('★★★「拾えるのは ポン／チーだけ」の 目が 空うちして います');
      }
      /* ★ 画面の 2択も 同じ 決まりを 通って いるか（★写しが 残って いないか）*/
      if (String(discardOffer).indexOf('takeOk') < 0) {
        ng.push('★★★画面の 2択が core の takeOk を 通って いません（★決まりの 写しが 残って います）');
      }
    })();
    note['㉖ ★★★7への 付け足し（T205）'] = t26.lay + '／★★' + t26.layKill;
    note['㉖-2 ★★★拾える 条件（T205）'] = t26.take + '／★★' + t26.takeKill;

    /* ★ さわった ものを 戻す（★ハッピーの ひとこと・★1回だけの 知らせの ふだ）*/
    if (sayTimer) { clearTimeout(sayTimer); sayTimer = 0; }
    sayEl.textContent = kSayTxt;
    if (kSayHid) sayEl.classList.add('hidden'); else sayEl.classList.remove('hidden');
    toldMeld = kToldM; toldLay = kToldL; toldBoth = kToldB; toldPon = kToldP; ponOn = kPonOn;

    var out = {
      '★NG': ng.length, '中身': ng.length ? ng : 'ぜんぶ OK ✅',
      /* ★★ T198-3 ―― ★★NG の すぐ 下。★★「読めるか どうか」を 先に 目に 入れる ため ★★ */
      '★★この 結果は 読めるか': cover.txt,
      '画面': window.innerWidth + '×' + window.innerHeight,
      'かかった 時間': (Date.now() - t0) + 'ms'
    };
    if (!cover.read) {
      console.warn('[セブンブリッジ] ★★' + cover.txt);
    }
    for (var kk in note) if (note.hasOwnProperty(kk)) out[kk] = note[kk];
    console.log('[セブンブリッジ] verify', out);
    return out;
  }

  root.SEVENBRIDGE = {
    now: now, autoPlay: autoPlay, verify: verify, seed: seed, geo: geoInfo,
    fitTest: fitTest, rates: rates,
    /* ★ 中を のぞく ため（★トライ・アト用）*/
    _g: function () { return g; }, _match: function () { return match; }, _core: C,
    /* ★★★ T208-3 ―― ★★ことばが 出て いた 時間を **ページの 中で** 測る ものさし ★★★
       ★ ★★トライが 2回 踏みました ―― ★★外から 測ると 自分の 通信の 遅さが 混ざります。
       ★ ★★だから ここに 置きます。★10ms ごとに 見て、★消えた 瞬間の 時間を 返します。
       ★ ★使い方： await SEVENBRIDGE.sayTime('すきな 文')  → { 字数, 出るはず, 出ていた }
       ★ ★★連打の 試し： SEVENBRIDGE.sayTime(文, 6) ―― ★6回 続けて 言わせて、
         ★ ★★ちらつかない（★★とちゅうで 空に ならない）ことも 数えます。 */
    sayTime: function (text, times) {
      times = times || 1;
      return new Promise(function (resolve) {
        var want = holdFor(text);
        var blank = 0, i = 0;
        /* ⚠️★★★★ ★★ものさし そのものを 先に 疑います（★私が T208-3 で 踏みました）★★★★
           ★ ★★画面が **裏に 回って いる**（visibilityState が hidden）と、
             ★ ★★ブラウザが 時計を しぼります ―― ★★10ms の つもりが **377ms** に なりました【実測】。
           ★ ★★その まま 測ると 1000〜1800ms も 長く 出ます ―― ★★数字は ぜんぶ ゴミ です。
           ★ ★★だから ―― ★★**測る 前に 言います。**★（★トライの 決まり：
             ★ ★「時間を 測る 人は ページの 中に ものさしを 置く」に、★もう 1つ 足します：
             ★ ★★「ものさしを 置く 前に、★その ページが 前に 出て いるか 見る」）*/
        if (document.visibilityState !== 'visible') {
          resolve({ よめません: '★★画面が 裏に あります（visibilityState=' + document.visibilityState +
                    '）。★ブラウザが 時計を しぼる ので 測れません。' +
                    '★★前に 出してから もう 一度 走らせて ください',
                    字数: text.length, 出るはず: want });
          return;
        }
        function once() {
          i++;
          say(text);
          var t0 = (window.performance && performance.now) ? performance.now() : Date.now();
          var iv = setInterval(function () {
            var now = (window.performance && performance.now) ? performance.now() : Date.now();
            if (sayEl.textContent === '' || sayEl.classList.contains('hidden')) blank++;
            if (sayEl.textContent !== text) {
              clearInterval(iv);
              var got = Math.round(now - t0);
              if (i < times) { once(); return; }
              resolve({ 字数: text.length, 出るはず: want, 出ていた: got,
                        ずれ: got - want, 空になった回: blank, 回数: times });
            }
            if (now - t0 > want + 3000) { clearInterval(iv); resolve({ error: 'まちすぎ' }); }
          }, 10);
        }
        once();
      });
    },
    _probe: { line: lineProbe, reach: reachProbe, drag: dragProbe, go: goProbe, pt: ptProbe, spot: spotProbe,
              level: levelProbe, result: resultProbe, win: winProbe,
              handHit: handHit, meldHit: meldHit, scene: makeScene }
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
