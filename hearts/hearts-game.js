/* ============================================================
   ハーツ ― 画面（T165・コーダ）
   ------------------------------------------------------------
   ★ 決まりと ロボットは hearts-core.js に あります。
     ★ ここには 決まりが 1行も ありません（★勝ち負けの 決め方も core が 返します）。
     ★ ＝ 数える 側（Node）と 遊ぶ 側（画面）が ズレようが ない。

   ★★★ この 1本で いちばん 気を つけた 4つ（★ルル T164 §17「コーダへ」）★★★
     ------------------------------------------------------------
     ① ★★わたす3枚に **おすすめを 1文字も 出さない**（★遊びの 14.7ポイント・設計図 追記②）
        ★ この ファイルには、★**人の 3枚を 選ぶ 行が 1行も ありません。**
        ★ 人が 押した 3枚の id を、そのまま core へ 渡すだけ。★verify ⑲ が 走査します。
     ② ★★「いま 誰が この 4枚を 取る ことに なって いるか」を **言わない**（★遊びの 芯）
        ★ 場に 4枚 出て いて、目で 見れば 分かります。
        ★ ★「あ、取っちゃう」と 気づくのが この 1本の 遊び です。★verify ⑲ が 見張ります。
     ③ ★★強調は その ときどき **1種類だけ**（設計図 §5.5）
        ★ わたす とき … 選んだ 3枚の わく ／ 出す とき … 出せない 札を 暗くする
        ★ ★★2つは 同時に 出ません。★verify ④ が 本物で 数えます。
     ④ ★★「人の 番なのに 押せる ものが 1つも ない」場面を 作れないか（★ルル §17 コーダ⑤）
        ★ ★ハーツは 手札が 必ず 1枚以上 ある ので 起きない **はず** ですが、
          ★★「起きない はず」を そのまま 出しません。★verify ⑭ が 本物の 指で 通します。

   ★★ 測る ときの 決まり（★会社で 4回 かかった わな）★★
     ★ 動いて いる 途中を 測らない。★測る ときは .measuring を 付けて
       ★うつり変わりと 動きを 止めてから 測る。★札の 場所は getBoundingClientRect（＝ 出て いる 姿）で 見る。
   ============================================================ */
(function (root) {
  'use strict';

  var C = root.HEARTS_CORE;
  var T = C.TUNE;

  /* ★ Node（画面が ない ところ）では ここで おしまい。
     ★ ここから 下は 1行も 動かない ―― だから 数える 側と 遊ぶ 側は ズレようが ない。 */
  if (typeof document === 'undefined') return;

  var $ = function (id) { return document.getElementById(id); };

  /* ── カードの 絵（設計図 §9・厳守）──────────────────
     ・画像は office/games/cards/ の 支給画像。★CSSや 絵文字で 自作しない。
     ・ファイル名が 日本語なので encodeURIComponent を 必ず 通す。
     ・★絵そのもの（cards/）は 1バイトも さわらない ―― 12本が 同じ 絵を 使って いる。 */
  var CARD_DIR = '../cards/';
  function cardSrc(name) { return CARD_DIR + encodeURIComponent(name) + '.png'; }

  /* ★★ ハッピーの ひとこと（★ルル §14-3 の 6場面。★見出しは ルル、文は ここ）★★
     ⚠️★ **手を 教えては いけません**（ルル §14-3）。
        ★ 「その 札は やめた ほうが いいよ」「Qを わたそう」の たぐいは ★★1文字も 書きません。
        ★ ここに あるのは「★いま 何を する 番か」と「★何が 起きたか」だけ です。 */
  var SAY = {
    pass:   '3枚 えらんで、{先}に わたそう！',
    noPass: 'この回は わたさないよ。そのまま はじめよう！',
    start:  '同じ マークの 札を 出そう！',
    took:   '{点}点 ついた！',
    tookQ:  'スペードの Q！ 13点…',
    took0:  '4枚 もらったよ。0点！',
    moonMe: 'ぜんぶ取り！ あなたが 0点、ほかの 3人が 26点！',
    moonBot:'{名前} が ぜんぶ取り！ あなたは 26点…'
  };
  /* ★★★ 勝ち負けの 画面に「★誰が 勝ったか」を 出す（★社長裁定 2026-08-28・T165 判断5）★★★
     ------------------------------------------------------------
     ★ 社長の 決め：★**「1行 足す」**。★（★私も アイも「このまま」を 推しましたが、★決まりは 決まり）
     ★★ そのうえで ―― ★アイから 線が 2本 来ました：
        ★ ★① §9.6 の 言葉づかいで。★見出し「勝ち！／負け…」は 17本中 7本と 同じ 形。
        ★ ★★② ★**「誰が 勝ったか」だけ 書く。★「なぜ 勝ったか」は 書かない**（★追記②・§5.5）。
             ★ ★合計の 表に すでに 数字が 出て いる ので、★それを 言葉で 言い直したら
               ★★ただ 説明を 増やしただけ に なります。

     ★★★ だから ―― ★★**足しません。★★入れ替えました。** ★★★
        ★ ★前：「🐱 やったー！　★点が いちばん 少なかったね！」
             ―― ★★後半は **合計の 表の 言い直し**（★＝ アイが 名指しした「なぜ」そのもの）。
        ★ ★前：「🐱 くやしい！　もう1回 やろ？」
             ―― ★★**負けた とき、誰が 勝ったのか どこにも 出て いませんでした**（★これが 穴）。
        ★ ★★後：★「なぜ」を 捨てて、★その 場所に「誰が」を 入れました。
             ★ ★★行数は **増えて いません**（★1行の まま）。★§5.5 と つり合います。
        ★ ★見出し（勝ち！／負け…）は 7本と そろえた まま ―― ★★ハーツの 勝ちは
          ★「点が いちばん 少ない 人の 勝ち」で、★**言葉としては ふつうの「勝ち」**です。変えません。
     ★ ★同じ 点の 人が いる ときは 2人 とも 名前を 出します（★「あなたと ロボット1の 勝ち！」）。
     ★ ★verify ⑳ が 4通り（★人が勝つ／ロボットが勝つ／同点2通り）を 本物の showResult で 通します。 */
  var SAY_WIN  = '🐱 やったー！　{名前}の 勝ち！';
  var SAY_LOSE = '🐱 {名前}の 勝ち！　もう1回 やろ？';
  var SAY_DEAL_ME = '🐱 この回は あなたが いちばん 少なかった！';
  var SAY_DEAL_OT = '🐱 まだ つづくよ。つぎの 回で 取り返そう！';

  /* ============================================================
     ★★ 絵の 先読み（設計図 §9・2026-08-26 の 行）★★
     ------------------------------------------------------------
     ★ この 1本で 使う札 ＝ **53個**（52枚 ＋ トランプ裏赤）。★JOKER は 読みません。
     ★★ 裏面（トランプ裏赤）は ―― ★ロボット3人の 手札 39枚 ぜんぶ。★いちばん 先に 読みます。
        ★ ★39枚 ならびますが **同じ 1枚の 絵の 使い回し** なので、通信量は 増えません（ルル §10）。
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
  var titleScreen, playScreen, stageEl, cardsEl, zoneBots, middleEl, scoreBand;
  var feltTable, happySpot, happyMid, sayEl, passGo, btnPass;
  var resultWrap, resultBox, resultTitle, resultSay, resultScore, levelPickResult, btnNext;
  var botEl = [];

  var g = null, match = null, cardEl = {}, geo = null, built = false;
  var busy = true, over = false, pressId = 0;
  var picks = {};                              /* ★★ わたす3枚（★人が 選んだ id だけ）*/
  var flying = [];                             /* ★ 取られて 消えて いく 4枚 */
  var rules = C.defaultRules();
  var rand = C.rng((Date.now() ^ 0x5bd1) >>> 0);
  var seedFixed = 0;
  var timers = [], sayTimer = 0;
  var STORE = 'brage-hearts-v1';

  function later(ms, fn) { var t = setTimeout(fn, ms); timers.push(t); return t; }
  function clearTimers() { for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]); timers = []; }
  /* ⚠️★★ T168・🟡-4：★★ここでも まるめます（★2枚がさね）★★
     ★ ★load() で まるめて いますが、★もし ほかの 道から おかしい 数が 入っても
       ★★**ここで 止まらない** ように します（★トライが 見つけた doPassGo の 止まり方の 元）。 */
  function levelNow() {
    var i = match ? match.level : C.LEVEL_START;
    if (!(i >= 0 && i < C.LEVELS.length)) i = C.LEVEL_START;
    return C.LEVELS[i];
  }
  function botName(seat) { return 'ロボット' + seat; }
  function seatName(seat) { return seat === 0 ? 'あなた' : botName(seat); }

  /* ============================================================
     ★★ 寸法 ―― core の pickLayout を 呼ぶ（★式は 1か所だけ）★★
     ------------------------------------------------------------
     ★ 上から：ロボット2（むかい）／ 左｜台｜右 ／ 点の 帯 ／ 自分の 手札。
     ★★ T167：★ハッピーは **この 並びから 外れました**（★盤の 外・上の 帯へ）。
        ★ ★余った たては ―― ★①台を 上限まで 太らせる → ★②のこりを **5つの すきまに 均等に**。
     ============================================================ */
  function measure() {
    var r = stageEl.getBoundingClientRect();
    var W = Math.max(60, Math.round(r.width) - 8);
    var H = Math.max(60, Math.round(r.height));
    var F = C.FIT;
    var lay = C.pickLayout(W, H);
    var chh = lay.h;

    var fixed = lay.botH + F.SCORE_H + chh;             /* ★ 動かさない 3つ */
    var feltCap = lay.feltBase + Math.round(lay.trickH * 0.18);
    /* ============================================================
       ★★★ T167 ―― ★ハッピーは **もう 盤の 中に いません**（★社長指示）★★★
       ------------------------------------------------------------
       ★ ★ここには「①ハッピーに 先に 取り分（余りの 28%・天井 200px）→ ②台 → ③すきま」
         ★ という 配り方が ありました。★★その ①が まるごと 要らなく なりました ――
         ★ ★ハッピーは 盤の 外（★上の 帯 `.talk`）へ 引っこしたから です。
       ★ ★★空いた ぶんを 埋める ために **新しい ものは 1つも 足して いません**。
         ★ ★のこりは そのまま ★**5つの すきまに 均等に** 配ります
           （★上／ロボの 下／台の 下／帯の 下／いちばん 下）。
         ★ ★★これは ページワン T163 で 社長に 見て いただいた 直し方 と 同じ 考え方 です
           ―― ★★「穴を 消す」のでは なく「★穴を すきまに 変える」。
       ★ ★台は 前と 同じ 上限（feltCap ＝ 十字 ＋ 18%）まで しか 太らせません
         ―― ★★ここを 動かすと トライ T166 が 測った 台の 数字が 変わります。
       ★ ★★式は もともと あった「ぺったんこ（横向き）」の 3行 そのもの です
         ―― ★新しい 式を 1つも 作って いません。
       ============================================================ */
    var nGap = 5;                                        /* ★ 上・ロボ下・台下・帯下・下 */
    var happyH = 0;

    /* ============================================================
       ★★★ T171 ―― ★点の 帯の 字を 大きく する（★社長の 決め・トライ T166 §7-2）★★★
       ------------------------------------------------------------
       ★ トライの 実測：★★字が **9.5px（320）／10.5px（375〜1512 まで ずっと）**。
         ★ ★1280×900 では 札が 152px なのに 字は 10.5px ―― ★★14.5分の 1。
       ★ ★アイの 心配：★「帯が 太ると **盤が 痩せます**。★どこまで 大きく できるか 線を 見つけて」。

       ★★★ 測りました【計算・measure() と 同じ 式】★★★
         | 画面 | ★台が やせ始める 帯の たけ |
         |---|---|
         | ★320×568   | ★**135px**（★いま 44px。★91px の 余り）|
         | 375×667    | 178px |
         | 375×812    | 201px |
         | ★★横向き 812×375 | ★★**45px**（★★1px しか 余って いない）|
         | ★★1280×900 | ★★**66px**（★22px の 余り）|
         | 1512×945   | 111px |
       ★ ★★なぜ こんなに 余るのか：★T167 で ハッピーが 盤の 外へ 出た ので、
         ★ ★★すきまが **22px × 5つ ＝ 110px** も あります【実測・320×568】。
         ★ ★★そして 台は **天井（feltCap）に はりついて います** ―― ★★これ以上 太りません。
         ★ ★＝ ★帯を 太らせても、★★減るのは **すきま だけ**。★★台も 札も 1pxも やせません。

       ★★ だから ―― ★★**「余って いる ぶんだけ 太らせる」**に しました：
         ★ ★① 目あては 60px（★3行が ゆったり 入る たけ）
         ★ ★② ただし ★★**台を 1pxも やせさせない** ところで 止める（★下の room）
         ★ ★③ ★★横向きは room が 44px なので **1pxも 太りません**（★いまの まま）
       ★★ ＝ ★★**「点の 帯 44px」は 下ばりとして そのまま 生きて います**（★狭い 画面では 44px）。
       ⚠️★ ★`hearts-core.js` は **1行も さわって いません**。★`F.SCORE_H`（44）は 下ばりとして 読むだけ。
          ★ ★★`pickLayout` の たての 見つもりも 44px の まま ―― ★★だから 札は 絶対に 小さく なりません。
       ============================================================ */
    var SCORE_WANT = 60;
    /* ★★★ ここが この 直しの いちばん 大事な 1行です ★★★
       ------------------------------------------------------------
       ⚠️★★ はじめ「★台を 1pxも やせさせない」で 作りました。★★それだと ――
          ★★**1280×900 で 帯 48px・字 11px**（★★トライが 名指しした その 画面 です）。
          ★ ★理由：★T167 で ハッピーの 帯が 盤の 上に できた ぶん、★盤の たてが 減り、
            ★★大きい 画面では 台の 天井（460px）で いっぱいに なって いました。
       ★ ★★＝ ★「台を 1pxも 動かさない」を 守ると、★★社長の ご指示（字を 大きく）が 通りません。

       ★★ そこで 線を 引き直しました ―― ★★**台の「ゆとり」からだけ 借ります。**
         ★ ★台の たけ ＝ ★**十字が 入る 大きさ（feltBase）** ＋ ★**ゆとり（trickH の 18%）**。
         ★ ★★十字は 1pxも 減らしません。★借りるのは ゆとりの 側 だけ で、
           ★ ★★しかも **6% は 必ず 残します**（feltFloor）。
         ★ ★★＝ ★場の 4枚は これまで どおり 同じ 大きさ・同じ 場所（★社長の 指示どおり 十字の まま）。
       ★★ 実際に 借りる 量【実測】：★320×568 **0px**／375×667 **0px**／横向き **6px**／
          ★1280×900 **12px**（★460→448・★2.6%）／1512×945 **0px**。
       ★ ★★台が いちばん 痩せる 1280×900 でも、★十字（368px）の まわりに **80px** 残ります。 */
    var feltFloor = lay.feltBase + Math.round(lay.trickH * 0.06);
    var scoreRoom = H - feltFloor - nGap * F.PADMIN - lay.botH - chh;
    var scoreH = Math.max(F.SCORE_H, Math.min(SCORE_WANT, scoreRoom));

    fixed = lay.botH + scoreH + chh;
    var feltH = Math.min(feltCap, Math.max(lay.feltBase, H - fixed - nGap * F.PADMIN));
    var pad = Math.max(F.PADMIN, Math.floor((H - fixed - feltH) / nGap));

    /* ★ 左右の ロボットの 帯（★名前が 入る はば）*/
    var sideW = Math.max(lay.bw + 6, Math.min(Math.round(W * F.SIDE_RATE), F.SIDE_MAX));
    var feltW = W - sideW * 2;
    if (feltW < lay.feltMin) { feltW = Math.min(W, lay.feltMin); sideW = Math.max(0, Math.floor((W - feltW) / 2)); }

    var y = pad;
    var botTop = y; y += lay.botH + pad;
    var happyTop = y; if (happyH) y += happyH + pad;
    var feltTop = y; y += feltH + pad;
    var scoreTop = y; y += scoreH + pad;
    var meTop = y;

    geo = {
      W: W, H: H, pad: pad, nGap: nGap,
      cw: lay.w, ch: chh, gap: lay.g, pitch: lay.pitch, bw: lay.bw, bh: lay.bh,
      botTop: botTop, botH: lay.botH,
      /* ★ T167：★ハッピーは 盤の 外（上の 帯）へ。★geoInfo が 読む ので 名前は 残します */
      happyShow: false, happyH: 0, happyTop: happyTop,
      feltTop: feltTop, feltH: feltH, feltLeft: 4 + sideW, feltW: feltW, sideW: sideW,
      scoreTop: scoreTop, scoreH: scoreH, scoreRoom: scoreRoom, scoreMin: F.SCORE_H, scoreWant: SCORE_WANT,
      feltBase: lay.feltBase, feltCap: feltCap, feltFloor: feltFloor,
      meTop: meTop, meH: chh,
      tight: !!lay.tight, trickW: lay.trickW, trickH: lay.trickH
    };
    /* ★ まん中の 帯（★T167 から ＝ 台だけ）―― ★`.middle` の 中の 座標で ものを 置く ため */
    geo.midTop = feltTop;
    geo.midH = feltH;

    /* ★★ 台の わく（★大富豪の わりふり：木4／内よはく7／みどり2 ＝ 13px）★★
       ★ ぺったんこな 画面では **そのまま 縮めます**（★消しません ―― ★消すと
         ★「どれが 場か」が 分からなく なる。★ページワン T162② の 決まり）。 */
    var room = Math.floor((feltH - lay.trickH) / 2);
    var edge = C.FIT.EDGE;
    if (room < edge) edge = Math.max(2, room);
    geo.feltBd  = Math.max(1, Math.round(edge * 4 / C.FIT.EDGE));
    geo.feltPad = Math.max(1, Math.round(edge * 7 / C.FIT.EDGE));
    geo.feltIn  = Math.max(1, edge - geo.feltBd - geo.feltPad);

    /* ★ 十字の まん中（★4枚が ここを かこみます）*/
    geo.cx = geo.feltLeft + Math.round(feltW / 2);
    geo.cy = feltTop + Math.round(feltH / 2);

    /* ★ ロボット2（むかい）の よこ ならび */
    geo.b2pitch = Math.min(lay.bw + 2, (W - lay.bw) / (C.FIT.HAND_N - 1));
    /* ★ ロボット1・3（左・右）の たて ならび（★名前の 1行を 下に 残す）*/
    var stackH = Math.max(lay.bh, feltH - C.FIT.NAME_H);
    geo.bvPitch = Math.max(2, Math.min(Math.round(lay.bh * 0.34), (stackH - lay.bh) / (C.FIT.HAND_N - 1)));
    geo.bvTop = feltTop + Math.max(0, Math.floor((stackH - ((C.FIT.HAND_N - 1) * geo.bvPitch + lay.bh)) / 2));
    geo.bnameTop = feltTop + feltH - C.FIT.NAME_H;
    geo.b1x = 4 + Math.round((sideW - lay.bw) / 2);
    geo.b3x = 4 + sideW + feltW + Math.round((sideW - lay.bw) / 2);
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
    /* ★ T167：`--happy` は 消しました（★ネコの 大きさは CSS が 決めます）*/
    /* ★ 結果の 箱の たけの 天井 ―― ★手札に かぶらせない（五目並べ T133 の 教訓）
       ★ ★ハーツは 点の 表が 入る ので ページワンより 高い ですが、★手札の 上で 止めます。 */
    s.setProperty('--result-max', Math.max(90, Math.min(260, geo.midH + geo.pad * 2 + geo.scoreH)) + 'px');

    zoneBots.style.top = '0px';
    middleEl.style.top = geo.midTop + 'px';
    middleEl.style.height = geo.midH + 'px';
    scoreBand.style.top = geo.scoreTop + 'px';
    scoreBand.style.height = geo.scoreH + 'px';
    /* ★★★ T171 ―― ★字の 大きさは 帯の たけから 出します（★CSS の 決め打ちを やめました）★★★
       ★ ★帯の 中身は 3行：★名前 ／ この回 ／ 合計。
         ★ ★たけ ＝ 内よはく 4 ＋ すきま 2 ＋ 名前の 行（字×1.25）＋ 数の 行（字×1.2）× 2
         ★ ★★＝ 字 ＝ (たけ − 6 − 名前の行) ÷ 2.4 ―― ★下の 式は これを といた もの。
       ★ ★名前は 数より 小さく します（★★読むのは 数。★名前は 目じるし）――
         ★ ★★そして「ロボット1」が 切れない ように 天井を 置きます（★verify ㉑ が 毎回 数えます）。 */
    var numF = Math.max(11, Math.min(17, Math.round((geo.scoreH - 20) / 2.45)));
    var nameF = Math.max(9, Math.min(13, Math.round(numF * 0.76)));
    s.setProperty('--sb-num', numF + 'px');
    s.setProperty('--sb-name', nameF + 'px');
    geo.sbNum = numF; geo.sbName = nameF;

    /* ★ ロボット2 は 上・よこ ならび。★1 と 3 は 台の 左右・たて ならび */
    botEl[1].style.left = '4px';
    botEl[1].style.width = geo.W + 'px';
    botEl[1].style.top = geo.botTop + 'px';
    botEl[1].style.height = geo.botH + 'px';
    botEl[1].querySelector('.bot-name').style.top = geo.bh + 'px';
    var sides = [[0, geo.b1x], [2, geo.b3x]];
    for (var k = 0; k < sides.length; k++) {
      var e = botEl[sides[k][0]];
      e.style.left = (4 + (sides[k][0] === 0 ? 0 : geo.sideW + geo.feltW)) + 'px';
      e.style.width = geo.sideW + 'px';
      e.style.top = geo.feltTop + 'px';
      e.style.height = geo.feltH + 'px';
      e.querySelector('.bot-name').style.top = (geo.bnameTop - geo.feltTop) + 'px';
    }

    if (feltTable) {
      s.setProperty('--felt-bd', geo.feltBd + 'px');
      s.setProperty('--felt-pad', geo.feltPad + 'px');
      s.setProperty('--felt-in', geo.feltIn + 'px');
      /* ⚠️★★ ここで 1つ ずれて いました【T165・私の 失敗】★★
         ★ `.cards` も `.middle` も `inset:0 / left:0` ―― ★どちらも **器の わくの 内がわ**（padding box）
           ★から 数えます。★器には 左右 4px の 内よはくが あるので、
           ★★札の 座標は「4 ＋ …」で 書いて います（＝ 内よはくの ぶんを 足して いる）。
         ★ ★私は はじめ 台だけ `geo.feltLeft - 4` と 書きました ―― ★★2回 引いた ことに なります。
         ★ ★★実測：★台 [76〜236] ／ 十字の まん中 160 ―― ★★**4px ずれて いました**。
           ★ ★目では ほとんど 分かりません。★getBoundingClientRect で 数えて 見つけました。 */
      feltTable.style.left = geo.feltLeft + 'px';
      feltTable.style.width = geo.feltW + 'px';
      feltTable.style.top = (geo.feltTop - geo.midTop) + 'px';
      feltTable.style.height = geo.feltH + 'px';
    }
    /* ★★ T167：★ここに あった 3行（★ハッピーを 出す／消す・ハッピーの top・ひとことの top）は
       ★ ★消しました ―― ★★ハッピーも ひとことも、もう **盤の 外（上の 帯）** に いて、
         ★ ★大きさも 置き場所も **CSS が 決めます**（★大富豪と 同じ 作り）。
       ⚠️★ ★JS が top を 入れ つづけると、★CSS の 並び（flex）と けんかします。

       ★★ ただ 1つ だけ JS が いる ところ ―― ★★たての 低い 画面（★横向き）★★
         ★ ★横向きは 盤が 309px しか なく、★帯を 並びに 置くと 札が 33→26px に 縮みます。
         ★ ★→ ★ネコは 出さず、★ひとことだけを **直す前と 同じ 場所**（★台の 上ばし）に
           ★ 浮かべます（★たけ 0 ＝ 盤を 1pxも 減らさない）。
         ★ ★台の 上ばしの y は 札の たけで 決まる ので、★★CSS だけでは 書けません。 */
    var flat = window.matchMedia && window.matchMedia('(max-height:420px)').matches;
    if (sayEl) sayEl.style.top = flat ? geo.feltTop + 'px' : '';
    /* ★★ わたす ボタンは 台の まん中（★わたす 間、台は 空 です）*/
    if (passGo) passGo.style.top = (geo.cy - 24) + 'px';

    resultSpot();
    if (g) placeAll(true);
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
     ★ where … 'me' ／ 'bot1'〜'bot3' ／ 'trick0'〜'trick3' ／ 'take0'〜'take3'
     ★★ 場の 4枚は **十字**に 並べます ―― ★下＝あなた・左＝1・上＝2・右＝3。
        ★ ★誰が 出した 札かが 場所で 分かります（★ルル §17 アト②：出た 順が 分かる ように）。
        ★ ★★でも「★いま 誰が 取る ことに なって いるか」は **1文字も 言いません**（★ルル §14-2）。
     ============================================================ */
  function spotOf(where, i, n) {
    var w = geo.cw, h = geo.ch;
    /* ★★★ 場の 4枚 ―― ★十字（下＝あなた・左＝1・上＝2・右＝3）★★★
       ------------------------------------------------------------
       ★ 数は「札の はば・たけの 何倍 ずらすか」。
       ⚠️★★ はじめ もっと 詰めて いました（左 1.30 / 上 1.12）―― ★★写真で 見て 直しました：
          ★ ★左の 札の 右はしが、★上の 札の **左上（数字と マークが 書いて ある 角）**に かかり、
            ★★あとから 出した 札が 上に 乗ると 数字が 見えなく なります。
          ★ → ★★**左右は 0.45倍ぶん 外へ**（★上の 札の 左右の はしと ちょうど 触れる ところ）。
            ★ ★これで どの 順に 出しても、★4枚 とも 左上の 角が 必ず 見えます。
       ★ ★重なりは 残します ―― ★★あとから 出した 札が 上に なる ＝ **出た 順が 見えます**
         （★ルル §17 アト②）。★でも「誰が 取るか」は 1文字も 言いません（★§14-2）。 */
    if (where.indexOf('trick') === 0) {
      var s = +where.charAt(5);
      if (s === 0) return { x: geo.cx - Math.round(w / 2), y: geo.cy + Math.round(h * 0.20) };
      if (s === 1) return { x: geo.cx - Math.round(w * 1.45), y: geo.cy - Math.round(h * 0.50) };
      if (s === 2) return { x: geo.cx - Math.round(w / 2), y: geo.cy - Math.round(h * 1.20) };
      return { x: geo.cx + Math.round(w * 0.45), y: geo.cy - Math.round(h * 0.50) };
    }
    if (where.indexOf('take') === 0) {
      var t = +where.charAt(4);
      if (t === 0) return { x: geo.cx - Math.round(w / 2), y: geo.meTop };
      if (t === 2) return { x: geo.cx - Math.round(w / 2), y: geo.botTop };
      return { x: (t === 1 ? geo.b1x : geo.b3x) - Math.round((w - geo.bw) / 2), y: geo.cy - Math.round(h / 2) };
    }
    if (where === 'me') {
      var left = 4 + (geo.W - ((n - 1) * geo.pitch + w)) / 2;
      return { x: Math.round(left + i * geo.pitch), y: geo.meTop };
    }
    var k = +where.charAt(3);
    if (k === 2) {                                   /* ★ むかい ―― よこ ならび */
      var l2 = 4 + (geo.W - ((n - 1) * geo.b2pitch + geo.bw)) / 2;
      return { x: Math.round(l2 + i * geo.b2pitch), y: geo.botTop };
    }
    return { x: (k === 1 ? geo.b1x : geo.b3x),       /* ★ 左・右 ―― たて ならび */
             y: Math.round(geo.bvTop + i * geo.bvPitch) };
  }

  function placeAll(instant) {
    if (!g) return;
    if (instant) cardsEl.classList.add('no-move');
    var i, p;
    for (p = 1; p < 4; p++) {
      for (i = 0; i < g.hands[p].length; i++) putAt(g.hands[p][i].id, 'bot' + p, i, g.hands[p].length, i);
    }
    for (i = 0; i < g.hands[0].length; i++) putAt(g.hands[0][i].id, 'me', i, g.hands[0].length, i);
    for (i = 0; i < g.trick.length; i++) putAt(g.trick[i].id, 'trick' + g.trick[i].p, 0, 1, 20 + i);
    if (instant) { void cardsEl.offsetWidth; cardsEl.classList.remove('no-move'); }
    refreshDim();
    refreshPick();
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
    for (var id in cardEl) if (cardEl.hasOwnProperty(id)) {
      if (cardEl[id].parentNode) cardEl[id].parentNode.removeChild(cardEl[id]);
    }
    cardEl = {};
    for (var i = 0; i < flying.length; i++) if (flying[i].parentNode) flying[i].parentNode.removeChild(flying[i]);
    flying = [];
  }
  /* ★ 手札の 数が 変わったら DOM を そろえ直す */
  function rebuild() {
    var p, i;
    for (p = 0; p < 4; p++) {
      for (i = 0; i < g.hands[p].length; i++) {
        var s = g.hands[p][i];
        if (!cardEl[s.id]) makeCard(s, p === 0);
        else faceUp(s.id, p === 0);
      }
    }
    for (i = 0; i < g.trick.length; i++) {
      if (!cardEl[g.trick[i].id]) makeCard(g.trick[i], true);
      else faceUp(g.trick[i].id, true);
    }
    placeAll(false);
  }

  /* ============================================================
     ★★★ 強調 その1 ―― ★出せない 札を 暗くする ★★★
     ------------------------------------------------------------
     ★ ルル §14-1 の 判定：
       ★ ソリティアで 奪われたのは「★どこに 置けるかを **さがす**」―― ★盤 じゅうを 見わたす 仕事。
       ★ ハーツで 見るのは「★場の マーク 1つ と 自分の 札の マーク」―― ★**見くらべる** だけ。
       ★★ そして 遊びの 中身は そこには ありません。
          ★ ★遊びは「★出せる 4枚の うち、どれを 出せば 取らずに 済むか」（★15.0ポイント）。
     ★ だから ―― ★**教えて よい。★ただし「暗くする」形で。**（★光らせない ＝ 引き算）

     ★★ 暗く するのは 4つ とも 当てはまる ときだけ ★★
        ① ★出す とき（★わたす 間は 1枚も 暗く しない）
        ② ★自分の 番（★ロボットの 番には 1枚も 暗く しない）
        ③ ★自分の 手札（★ロボットの 手札・場の 札には 付けない）
        ④ ★その 札が 出せない
     ★ ★verify ⑤ が、この 関数を **本物で 通して** 見張ります。
     ============================================================ */
  function refreshDim() {
    var all = cardsEl.querySelectorAll('.card.is-dim'), i;
    for (i = 0; i < all.length; i++) all[i].classList.remove('is-dim');
    if (!g || g.over || over || busy) return;
    if (g.phase !== 'play' || g.cur !== 0) return;
    var ok = {}, l = C.legalIdx(g, 0);
    for (i = 0; i < l.length; i++) ok[l[i]] = 1;
    for (i = 0; i < g.hands[0].length; i++) {
      if (ok[i]) continue;
      var e = cardEl[g.hands[0][i].id];
      if (e) e.classList.add('is-dim');
    }
  }

  /* ============================================================
     ★★★ 強調 その2 ―― ★わたす とき、★人が 選んだ 3枚に わく ★★★
     ------------------------------------------------------------
     ★ 設計図 追記④：★ピラミッドの「選ぶ → わく → もう1回 押す」と 同じ 形。
     ★★ ここには **おすすめが 1つも ありません** ―― ★`picks` は 人が 押した id だけ。
        ★ ★verify ⑲ が、この 関数と doPassGo を 1行ずつ 走査します。
     ★★ `.is-dim` とは **同時に 出ません**（★わたす 間は 出す 番が ない）。★verify ④ が 数えます。
     ============================================================ */
  function pickCount() { var n = 0; for (var k in picks) if (picks.hasOwnProperty(k)) n++; return n; }
  function refreshPick() {
    var all = cardsEl.querySelectorAll('.card.is-pick'), i;
    for (i = 0; i < all.length; i++) all[i].classList.remove('is-pick');
    var show = false;
    if (g && !over && g.phase === 'pass') {
      for (i = 0; i < g.hands[0].length; i++) {
        var s = g.hands[0][i];
        if (!picks[s.id]) continue;
        var e = cardEl[s.id];
        if (e) e.classList.add('is-pick');
      }
      show = (pickCount() === 3) && !busy;
    }
    passGo.classList.toggle('hidden', !show);
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
     ★★ 点の 帯（★この回 と 合計 ―― ★4人ぶん）★★
     ★ ルル §5-2：★「いま 自分が 何点 取ったか」は **画面が 言って よい 側**。
     ⚠️★ ここは **数だけ** です。★「あぶない」「気をつけて」の たぐいは 1文字も 出しません。
     ============================================================ */
  function scoreRows(now, tot) {
    var h = '<b></b>', i;
    for (i = 0; i < 4; i++) h += '<span class="sb-name' + (i === 0 ? ' sb-me' : '') + '">' + seatName(i) + '</span>';
    h += '<b>この回</b>';
    for (i = 0; i < 4; i++) h += '<i>' + now[i] + '</i>';
    h += '<b>合計</b>';
    for (i = 0; i < 4; i++) h += '<i>' + tot[i] + '</i>';
    return h;
  }
  function renderScore() {
    if (!match) return;
    scoreBand.innerHTML = scoreRows(g ? g.taken : [0, 0, 0, 0], match.total);
  }
  /* ★ 勝った 人の 名前（★同じ 点の 人が いたら 2人 とも 出します）
     ★★ ここは「誰が」だけ。★点数を 1文字も 入れません（★入れたら 表の 言い直し ＝ §5.5 違反）。 */
  function winnerText() {
    if (!match || !match.winners.length) return '';
    var a = [], i;
    for (i = 0; i < match.winners.length; i++) a.push(seatName(match.winners[i]));
    return a.join('と ');
  }

  /* ============================================================
     ★★ しまう ／ 続きから（★アイの 心配ごとへの 答え）★★
     ------------------------------------------------------------
     ★ 1つの 勝負は【見立て】で 13.9分。★★ページワンの 9割（3分16秒）の 4倍 です。
     ★ → ★**1回 配り終わる ごとに 合計を しまいます。**★次に 開いたら 合計から 続けられます。
     ★★ 正直に 書きます（設計図 追記⑤）：★★**しまうのは 1回 配り終わった ところ だけ** です。
        ★ ★配って いる 途中で 閉じると、★★その 回の はじめから やり直しに なります
          （★1回 ＝【見立て】1分16秒。★捨てるのは その ぶん だけ）。
        ★ ★★理由：★途中の 状態（4人の 手札・場の 4枚・出た 順）を しまう ことも できますが、
          ★★開き直した ときに その 場面を 作り直す 道が 1本 増えます ―― ★そこは 見張りが 薄く なる。
          ★ ★「区切りで しまう」なら 合計 4つの 数字 だけ で 済み、★壊れようが ありません。
        ★ ★どちらが よいかは **社長が 決めて ください**（★作れない のでは なく、選び ました）。
     ============================================================ */
  function save() {
    if (!match) return;
    try {
      if (match.over) { localStorage.removeItem(STORE); return; }
      /* ★★★ T168・🔴-1 の 直し（★トライ T166 §4）★★★
         ------------------------------------------------------------
         ★ トライの 実測：★はじめの 画面で「つよさ」を さわると、
           ★★{"t":[12,48,33,27],"d":5} → **{"t":[0,0,0,0],"d":0}** に 上書きされ、
           ★★続きが 消えました（★3回 やって 3回とも）。★★失うのは 最大 14.5分。
         ★ ★私も 同じ 手順で 再現しました【実測・T168】。★アイの 読みも 当たって いました。
         ★ ★正体：★はじめの 画面の `match` は boot() が 作った **まっさらな もの**
           （total 0・dealNo 0）。★★それを そのまま しまって いました。
         ★★ 直しは 2枚がさね に します（★1枚だと また 別の 道から 来ます）：
           ★ ★① ここ ―― ★★**まだ 1回も 配って いない 勝負は しまわない**（★下の 3行）
           ★ ★② setLevel ―― ★★**つよさだけを 書きかえる**（★t と d は さわらない・下の saveLevelOnly）
         ★ ★①の 数について：★1回 配ると 点は 必ず 26点 動きます（★ぜんぶ取りなら 78点）。
           ★ ★★＝ ★「合計が 0」と「1回も 配って いない」は 同じ こと です。
           ★ ★★load() も 同じ 線で 見て います（sum > 0）―― ★★しまう 側と 読む 側が そろいました。 */
      var sum = match.total[0] + match.total[1] + match.total[2] + match.total[3];
      if (!(sum > 0) || !(match.dealNo > 0)) return;
      localStorage.setItem(STORE, JSON.stringify({ t: match.total, d: match.dealNo, lv: match.level }));
    } catch (e) {}
  }
  /* ★★ つよさ だけを 書きかえる（★★合計と 回数は 1文字も さわりません）★★
     ★ ★しまって ある 続きが ある ときだけ 効きます。★無ければ 何も しません。 */
  function saveLevelOnly() {
    try {
      var o = load();
      if (!o) return;
      o.lv = (match ? match.level : C.LEVEL_START);
      localStorage.setItem(STORE, JSON.stringify(o));
    } catch (e) {}
  }
  function load() {
    try {
      var o = JSON.parse(localStorage.getItem(STORE) || 'null');
      if (!o || !o.t || o.t.length !== 4) return null;
      var i, sum = 0, hi = -1;
      for (i = 0; i < 4; i++) {
        if (typeof o.t[i] !== 'number' || !isFinite(o.t[i]) || o.t[i] < 0) return null;
        sum += o.t[i]; if (o.t[i] > hi) hi = o.t[i];
      }
      if (!(sum > 0) || hi >= C.GOAL) return null;
      if (!(o.d > 0)) return null;
      /* ★★★ T168・🟡-4 の 直し（★トライ T166 §5-3）★★★
         ★ トライの 実測：★`{"lv":9}` を 手で 書くと ―― ★★「わたす ▶」で 止まりました
           （★`Cannot read properties of undefined (reading 'o')` at doPassGo）。
         ★ ★前は `t` と `d` しか 見て いなかった ので、★★見張り ⑱ の
           ★「こわれた 中身は 受けない ○」は **lv については うそ** でした。
         ★★ 直し方は「捨てる」では なく「まるめる」に しました ―― ★理由は 2つ：
           ★ ★① ★lv が おかしい だけで、★合計 4つの 数字は 生きて います。★捨てるのは もったいない。
           ★ ★② ★★トライが 書いた 先の 話 ―― ★「つよさを 3段から 2段に 減らしたら、
             ★★いま lv:2 を しまって いる 人 全員が 止まる」。★★まるめれば その 人たちも 続けられます。 */
      if (!(o.lv >= 0 && o.lv < C.LEVELS.length)) o.lv = C.LEVEL_START;
      o.lv = o.lv | 0;
      return o;
    } catch (e) { return null; }
  }
  function clearSave() { try { localStorage.removeItem(STORE); } catch (e) {} }

  /* ============================================================
     ★ 新しい 1回（★配る）
     ============================================================ */
  function newDeal() {
    clearTimers();
    dropCards();
    over = false; busy = true; picks = {};
    passGo.classList.add('hidden');
    resultWrap.classList.add('hidden');
    var r = seedFixed ? C.rng((seedFixed + match.dealNo * 7919) >>> 0) : rand;
    g = C.makeGame(r, { rules: rules, dealNo: match.dealNo });

    /* ★ いま 要る 札を 先読みの 先頭へ（★自分の 手札 13枚）*/
    var need = [], i, p;
    for (i = 0; i < g.hands[0].length; i++) need.push(C.nameOf(g.hands[0][i].c));
    warmFirst(need);

    for (p = 1; p < 4; p++) for (i = 0; i < g.hands[p].length; i++) makeCard(g.hands[p][i], false);
    for (i = 0; i < g.hands[0].length; i++) makeCard(g.hands[0][i], true);
    placeAll(true);
    renderScore();
    busy = false;
    if (g.phase === 'pass') {
      say(SAY.pass.replace('{先}', g.passLabel), 0);
      refreshPick();
    } else {
      say(SAY.noPass);
      turnStart();
    }
  }

  /* ============================================================
     ★★★ わたす3枚 ―― ★人が 3枚 選んで、自分で 押す ★★★
     ------------------------------------------------------------
     ⚠️★★ ここに **おすすめを 出す 行は 1つも ありません**（★ルル §14-2・設計図 追記②）。
        ★ ★`picks` に 入るのは、★人が 押した 札の id **だけ** です。
        ★ ★ロボットの 3枚は core の botPass が 決めます（★人の ぶんは 通りません）。
     ============================================================ */
  function togglePick(id, el) {
    if (!g || g.phase !== 'pass' || busy || over) return;
    if (picks[id]) { delete picks[id]; refreshPick(); return; }
    if (pickCount() >= 3) { nope(el); return; }   /* ★ 4枚目は「ぷるっ」と 返すだけ */
    picks[id] = 1;
    refreshPick();
  }
  function doPassGo() {
    if (!g || g.phase !== 'pass' || busy || over) return;
    if (pickCount() !== 3) return;
    busy = true;
    passGo.classList.add('hidden');
    var give = [[], [], [], []], k, p;
    for (k in picks) if (picks.hasOwnProperty(k)) give[0].push(+k);
    for (p = 1; p < 4; p++) give[p] = C.botPass(g, p, levelNow().o);
    picks = {};
    C.doPass(g, give);
    rebuild();
    say('');
    later(T.PASS_MOVE, function () {
      rebuild();
      later(T.PASS_FLIP, function () {
        busy = false;
        say(SAY.start);
        turnStart();
      });
    });
  }

  /* ============================================================
     ★★ 手番 ★★
     ★ 人（席0）の ときは ―― ★★何も しません。★指を 待つ だけ。
     ============================================================ */
  function turnStart() {
    if (!g) return;
    if (g.over) { finishDeal(); return; }
    if (g.cur === 0) { busy = false; refreshDim(); }
    else { busy = true; refreshDim(); later(T.BOT_THINK, botStep); }
  }

  function botStep() {
    if (!g || g.over) { finishDeal(); return; }
    var seat = g.cur;
    if (seat === 0) { turnStart(); return; }
    var idx = C.botIdx(g, seat, levelNow().o);
    var r = C.playIdx(g, seat, idx);
    if (!r.ok) { finishDeal(); return; }
    faceUp(r.id, true);
    placeAll(false);
    later(T.PLAY_MOVE, function () { afterPlay(r); });
  }

  /* ============================================================
     ⚠️★★★ 次に ここを 測る 人へ（★トライ T166 §9 の 書き置き）★★★
     ------------------------------------------------------------
     ★ トライは 40分の 測りを 1回 まるごと 捨てました。★理由は これ です：
       ★ ★★**場に 4枚 出て いる あいだも `g.cur` は 0 の まま** です。
       ★ ★★それを「人の 番」と 数えて、★「押したのに 出ない」を 13% 見つけた と 思った ――
         ★★実際は **ゲームは 何も 悪く ありませんでした**（★直したら 403回 押して 空うち 0回）。
     ★ ★なぜ 0の まま か：★`playIdx` は 4枚目の とき **わざと 手番を 進めません**
       ―― ★★取る 人は「いちばん 強い 札を 出した 人」で、★4枚 そろって みないと 決まらない から です。
       ★ ★その あと `takeTrick` が `g.cur` を 取った 人に します。
     ★ ★★＝ ★「人の 番か」を `g.cur === 0` だけで 数えては いけません。
       ★ ★★正しい 見かた（★どちらでも 同じ）：
         ★ ★① `busy` が false か（★この ファイルの 中なら これ）
         ★ ★② ★★`window.HEARTS.now()['★いま 押せるか']`（★外から 測る なら これ）
     ============================================================ */
  function afterPlay(r) {
    if (!g) return;
    if (r.full) { later(T.TRICK_HOLD, doTake); return; }
    turnStart();
  }

  /* ★★ 4枚 そろった ―― ★いちばん 強い 人が 取る ★★
     ⚠️★★ ここまで **1文字も**「誰が 取る ことに なって いるか」を 言って いません。
        ★ ★言うのは **取った あと** だけ ―― ★★それは もう 起きた こと（事実）です。 */
  function doTake() {
    if (!g || g.phase !== 'play') return;
    var t = C.takeTrick(g);
    var i;
    for (i = 0; i < t.ids.length; i++) {
      var e = cardEl[t.ids[i]];
      if (!e) continue;
      var p = spotOf('take' + t.winner, 0, 1);
      e.style.left = p.x + 'px';
      e.style.top = p.y + 'px';
      e.style.zIndex = '5';
      e.classList.add('is-gone');
      delete cardEl[t.ids[i]];
      flying.push(e);
    }
    renderScore();
    if (t.winner === 0) {
      var hadQ = false;
      for (i = 0; i < t.ids.length; i++) { /* ★ 札は もう 場から 消えて いるので 点で 見ます */ }
      hadQ = (t.pts >= 13);
      if (t.pts === 0) say(SAY.took0);
      else if (hadQ) say(SAY.tookQ);
      else say(SAY.took.replace('{点}', t.pts));
    }
    later(T.TAKE_MOVE, function () {
      for (var k = 0; k < flying.length; k++) if (flying[k].parentNode) flying[k].parentNode.removeChild(flying[k]);
      flying = [];
      if (!g) return;
      if (g.over) { finishDeal(); return; }
      turnStart();
    });
  }

  /* ============================================================
     ★ 1回 おわり ―― ★合計に 足して、点の 画面を 出す
     ============================================================ */
  function finishDeal() {
    if (over) return;
    if (!g || !g.over) return;
    over = true; busy = true;
    say(''); refreshDim(); refreshPick();
    var deal = g.deal.slice();
    var before = match.total.slice();
    C.addDeal(match, deal);
    save();
    renderScore();
    later(T.RESULT_WAIT, function () { showResult(deal, before); });
  }

  function showResult(deal, before) {
    var fin = match.over;
    var lo = Math.min(deal[0], deal[1], deal[2], deal[3]);
    resultTitle.className = 'result-title';
    /* ★★★ T168・🟡-1 の 直し（★社長裁定 2026-08-28 判断2 ＝ 1）★★★
       ------------------------------------------------------------
       ★ トライ T166：★「つよさは 13.7分に 1回しか 変えられない。
         ★★しかも 1回 おわりの 画面に 無い ので、★下げたい 人は **必ず** はじめの 画面へ 行く」
         ―― ★★そこに 🔴-1 が 待って いました。★★2つは つながって います。
       ★ → ★★**1回 おわりの 画面にも 出します**（★13.7分 → ★★1回ごと ＝【実測】78.8秒 に 1回）。
       ★ ★設計図 §5.5 の 線引き：★「★遊んで いる 最中の 画面には 置かない」――
         ★ ★1回 おわりの 画面は **配り終わって 止まって いる ところ** です。★最中では ありません。
       ★ ★選ばせる ものは 増えて いません（★つよさ 1つの まま・★verify ⑦ が 数えます）。 */
    levelPickResult.classList.remove('hidden');
    if (fin) {
      var iWin = match.winners.indexOf(0) >= 0;
      resultTitle.textContent = iWin ? '勝ち！' : '負け…';
      if (!iWin) resultTitle.className = 'result-title is-quiet';
      /* ★★ 誰が 勝ったか だけ。★なぜ 勝ったかは 言いません（★合計の 表に 数字が 出て います）*/
      resultSay.textContent = (iWin ? SAY_WIN : SAY_LOSE).replace('{名前}', winnerText());
      btnNext.innerHTML = 'もう1回 <b>▶</b>';
      if (iWin) { happyMid.classList.remove('is-jump'); void happyMid.offsetWidth; happyMid.classList.add('is-jump'); }
    } else {
      resultTitle.textContent = match.dealNo + '回目 おわり';
      if (g.moonBy >= 0) {
        resultSay.textContent = (g.moonBy === 0)
          ? SAY.moonMe : SAY.moonBot.replace('{名前}', botName(g.moonBy));
      } else {
        resultSay.textContent = (deal[0] === lo) ? SAY_DEAL_ME : SAY_DEAL_OT;
      }
      btnNext.innerHTML = 'つぎへ <b>▶</b>';
    }
    resultScore.innerHTML = scoreRows(deal, match.total);
    resultWrap.classList.remove('hidden');
    resultBox.classList.add('is-locked');
    later(T.RESULT_LOCK, function () { resultBox.classList.remove('is-locked'); });
  }

  function onNext() {
    resultWrap.classList.add('hidden');
    if (match.over) {
      clearSave();
      match = C.newMatch(match.level);
    }
    newDeal();
  }

  /* ============================================================
     ★★★ 人の 操作 ★★★
     ------------------------------------------------------------
     ★ 追記④：★**探すのは 人、たしかめるのが 機械。**
       ・★わたす 3枚 … ★★人が 決める（★おすすめを 1文字も 出さない）
       ・★どの 札を 出すか … ★★人が 決める（★1回 押すだけ。★行き先は 場 1か所しか ない）
       ・★出せるか どうかの 判定・点を 数える・4枚を 集める … ★機械が やる（★肩代わりして よい 側）
     ★ 指を 置いた だけでは 決まりません。★**はなした ときに** 決まります。

     ⚠️★★★ T157（ページワン）の 直しを そのまま 引きついで います ★★★
        ★ 指（touch）の ポインタは **押した ものに くっつきます**（implicit pointer capture）。
          ★ ★＝ となりの 札の 上で はなしても、★pointerup の e.target は **押した 札の まま**。
        ★ → ★★**はなした 点の 座標から 引き直します**（`hitAt`）。★これで 指も マウスも 同じ 動きに。
        ★ ★`hitAt` は ⑭⑯（見張り）も 同じ ものを 使います ―― ★★目を 1つに して おきます。
     ============================================================ */
  function hitAt(x, y) {
    if (!(x >= 0) || !(y >= 0) || x > window.innerWidth || y > window.innerHeight) return null;
    var t = document.elementFromPoint(Math.round(x), Math.round(y));
    while (t && t !== cardsEl && !(t.classList && t.classList.contains('card'))) t = t.parentNode;
    return (t && t !== cardsEl && t.classList && t.classList.contains('card')) ? t : null;
  }
  function onDown(e) {
    if (busy || over || !g) return;
    var t = e.target;
    while (t && t !== cardsEl && !t.classList.contains('card')) t = t.parentNode;
    if (!t || t === cardsEl) { pressId = 0; return; }
    pressId = t.slotId || 0;
  }
  function onCancel() { pressId = 0; }
  function nope(t) {
    if (!t) return;
    t.classList.remove('is-no'); void t.offsetWidth; t.classList.add('is-no');
  }
  function elOfSlot(id) {
    var e = cardEl[id];
    return (e && e.parentNode) ? e : null;
  }
  function handIndexOf(id) {
    for (var i = 0; i < g.hands[0].length; i++) if (g.hands[0][i].id === id) return i;
    return -1;
  }
  /* ★★ はなした ―― ★ここで はじめて 決まります ★★
     ★ ★すべって 外したら「ぷるっ」と 返す（★ページワン T160 の 決まり。★新しい 見た目は 0種類）。 */
  function onUp(e) {
    var id = pressId; pressId = 0;
    if (!id || busy || over || !g) return;
    var t = hitAt(e.clientX, e.clientY);          /* ★★ e.target では ありません（★上の ⚠️）*/
    if (!t || t.slotId !== id) {
      var slipped = elOfSlot(id);
      if (slipped) nope(slipped);                 /* ★ すべって 外した ―― ★ぷるっと 返す */
      return;
    }
    if (t.where !== 'me') { nope(t); return; }    /* ★ ロボットの 札・場の 札を 押した */
    var idx = handIndexOf(id);
    if (idx < 0) return;
    if (g.phase === 'pass') { togglePick(id, t); return; }
    if (g.phase !== 'play' || g.cur !== 0) { nope(t); return; }
    var l = C.legalIdx(g, 0);
    if (l.indexOf(idx) < 0) { nope(t); return; }  /* ★ 出せない 札（★もう 暗く なって います）*/
    playHuman(idx);
  }

  function playHuman(idx) {
    var r = C.playIdx(g, 0, idx);
    if (!r.ok) { refreshDim(); return; }
    busy = true;
    faceUp(r.id, true);
    placeAll(false);
    later(T.PLAY_MOVE, function () { afterPlay(r); });
  }

  /* ============================================================
     ★ つよさ（★3段・プルダウン 2か所）
     ------------------------------------------------------------
     ★ はじめの 画面 と、★終わった あとの 画面（★四目 T130・6×6リバーシと 同じ 置き方）。
       ★ ★★負けた その場で 下げられる ことが、はじめての 人の 逃げ道です。
     ★ 遊んで いる 最中の 画面には 置きません（設計図 §5.5 の 線引き）。
     ★ 中身（何を 知って いるか）は 1つも 出しません。★言葉だけ。
     ============================================================ */
  var LV_STORE = 'brage-hearts-lv';
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
  /* ★★★ T168・🔴-1 の 直し その2（★トライ T166 §4-2 の 案A ＋ 案C）★★★
     ★ ★前は ここで `save()` を 呼んで いました ―― ★★はじめの 画面の まっさらな match を
       ★そのまま しまい、★続きを 0点で 上書きして いました。
     ★ ★いま ―― ★★**つよさ だけ を 書きかえます**（★saveLevelOnly）。★合計と 回数は さわりません。
     ★ ★そして ★★**refreshResume() を 呼んで ボタンの 文も 描き直します**
       ―― ★★トライの「ボタンは『5回 おわり 12点』と うそを ついた まま」への 答え です。
       ★ ★（★いまは 続きが 消えない ので うそに なりません。★★それでも 呼びます ――
         ★★「消える」と「うそを つく」は **別々に** 直します。★片方が 戻っても もう片方が 残る ように。） */
  function setLevel(i) {
    i = Math.max(0, Math.min(C.LEVELS.length - 1, i | 0));
    if (match) match.level = i;
    try { localStorage.setItem(LV_STORE, String(i)); } catch (e) {}
    $('levelTitle').value = String(i);
    $('levelResult').value = String(i);
    saveLevelOnly();
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
    cardsEl.addEventListener('pointerdown', onDown);
    cardsEl.addEventListener('pointerup', onUp);
    cardsEl.addEventListener('pointercancel', onCancel);
    cardsEl.addEventListener('lostpointercapture', onCancel);
    stageEl.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    stageEl.addEventListener('dragstart', function (e) { e.preventDefault(); });
    btnPass.addEventListener('click', doPassGo);
  }

  function start(resume) {
    var lv = match ? match.level : loadLevel();
    if (resume) {
      var o = load();
      match = C.newMatch(o ? o.lv : lv);
      if (o) { match.total = o.t.slice(); match.dealNo = o.d; }
    } else {
      clearSave();
      match = C.newMatch(lv);
    }
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
      $('resumeAt').textContent = o.d + '回 おわり ／ あなた ' + o.t[0] + '点';
    } else btn.classList.add('hidden');
  }

  function boot() {
    titleScreen = $('titleScreen'); playScreen = $('playScreen');
    stageEl = $('stage'); cardsEl = $('cards');
    zoneBots = $('zoneBots'); middleEl = $('middle'); scoreBand = $('scoreBand');
    feltTable = $('feltTable'); happySpot = $('happySpot'); happyMid = $('happyMid');
    sayEl = $('say'); passGo = $('passGo'); btnPass = $('btnPass');
    resultWrap = $('resultWrap'); resultBox = $('resultBox');
    resultTitle = $('resultTitle'); resultSay = $('resultSay'); resultScore = $('resultScore');
    levelPickResult = $('levelPickResult'); btnNext = $('btnNext');
    botEl = [$('bot1'), $('bot2'), $('bot3')];

    match = C.newMatch(loadLevel());
    fillLevelSelect($('levelTitle'));
    fillLevelSelect($('levelResult'));
    $('levelTitle').addEventListener('change', function () { setLevel(this.value | 0); });
    $('levelResult').addEventListener('change', function () { setLevel(this.value | 0); });

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
    build(); measure();
    stageEl.style.visibility = '';
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* ============================================================
     ★★ たしかめの 窓口（既存17本と 同じ 作法。★画面には 1つも 出ない）★★
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
    for (var i = 0; i < hand.length; i++) a.push(C.nameOf(hand[i].c));
    return a.join(' ');
  }
  function okText() {
    if (!g || g.phase !== 'play') return '―';
    var l = C.legalIdx(g, 0), a = [];
    for (var i = 0; i < l.length; i++) a.push(C.nameOf(g.hands[0][l[i]].c));
    return a.length ? a.join(' ') : '（なし）';
  }
  function trickText() {
    if (!g || !g.trick.length) return '（なし）';
    var a = [];
    for (var i = 0; i < g.trick.length; i++) a.push(seatName(g.trick[i].p) + ':' + C.nameOf(g.trick[i].c));
    return a.join(' → ');
  }

  function now() {
    return {
      '★つよさ': levelNow().label,
      '★いま': g ? (g.phase === 'pass' ? 'わたす（' + g.passLabel + '）' : (g.phase === 'play' ? '出す' : '1回 おわり')) : '―',
      '★何回目': match ? (match.dealNo + 1) + '回目' : '―',
      '★自分の 手札': g ? handText(g.hands[0]) : '―',
      '★出せる 札': okText(),
      '★場の 札（出た 順）': trickText(),
      '★選んで いる 3枚': (function () { var a = []; for (var k in picks) if (picks.hasOwnProperty(k) && cardEl[k]) a.push(cardEl[k].cardName); return a.length ? a.join(' ') : '（なし）'; })(),
      '★手番': g ? (g.over ? '終わり' : seatName(g.cur)) : '―',
      /* ★★★ 測る 人へ（★トライ T166 §9）★★★
         ★ ★★`g.cur === 0` だけを 見ては いけません ―― ★★場に 4枚 出て いる あいだも 0の まま です
           （★取る 人は 4枚 そろわないと 決まらない から。★→ afterPlay の 上の ⚠️）。
         ★ ★★「いま 指が 効くか」を 知りたい ときは、★★この 行を 見て ください。 */
      '★いま 押せるか': (g && !g.over && !over && !busy &&
                         (g.phase === 'pass' || (g.phase === 'play' && g.cur === 0 && g.trick.length < 4)))
                        ? 'はい' : 'いいえ',
      '★場に 出て いる 枚数': g ? (g.trick.length + '枚') : '―',
      '★この回の 点': g ? g.taken.join(' / ') : '―',
      '★合計': match ? match.total.join(' / ') : '―',
      '★ハートが 出た': g ? (g.heartsBroken ? 'はい' : 'いいえ') : '―',
      '★暗い 札': cardsEl ? cardsEl.querySelectorAll('.card.is-dim').length + '枚' : '―',
      '★わくの 札': cardsEl ? cardsEl.querySelectorAll('.card.is-pick').length + '枚' : '―',
      '★札': geo ? (geo.cw + '×' + geo.ch + 'px ／ ロボット ' + geo.bw + '×' + geo.bh + 'px') : '―',
      '★読めた 絵': warmDone + ' / ' + ALL_NAMES.length + (warmErr ? ('（読めず ' + warmErr + '）') : '')
    };
  }

  /* ★ 種を 固定する（★同じ 試合を 何度でも）*/
  function seed(n) {
    seedFixed = (n >>> 0) || 0;
    return { '★種': seedFixed || '（毎回 ちがう）', '★次の 1回から 効きます': true };
  }

  function geoInfo() {
    return still(function () {
      var r = stageEl.getBoundingClientRect();
      return {
        '画面': window.innerWidth + '×' + window.innerHeight,
        '器の中身': geo.W + '×' + geo.H,
        '★自分の 札': geo.cw + '×' + geo.ch + 'px',
        '★★手札の 見えて いる はば': geo.pitch.toFixed(1) + 'px（★札の ' + (geo.pitch / geo.cw * 100).toFixed(0) + '%）',
        '★44pxに 対して': (geo.cw / 44 * 100).toFixed(0) + '%',
        '★ロボットの 札': geo.bw + '×' + geo.bh + 'px',
        'ロボット2の 帯': geo.botH + 'px（上 ' + geo.botTop + 'px）',
        '★台': geo.feltH + 'px（★台÷札のたけ ' + (geo.feltH / geo.ch).toFixed(2) + '）／よこ ' + geo.feltW + 'px',
        '★左右の 帯': geo.sideW + 'px',
        '★ハッピー': geo.happyShow ? geo.happyH + 'px' : '出さない',
        '★点の 帯': geo.scoreH + 'px（上 ' + geo.scoreTop + 'px）',
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
     ★ opt.mode … 'match'（★100点まで・初期値）／ 'deal'（★1回 配る ぶん）*/
  function autoPlay(n, opt) {
    n = n || 2000; opt = opt || {};
    var mode = opt.mode || 'match';
    var lv = C.LEVELS[opt.level == null ? (match ? match.level : C.LEVEL_START) : opt.level];
    var hu = C.HUMANS[opt.human == null ? 3 : opt.human];
    var t0 = Date.now();
    var st = C.runMany(n, opt.seed || 4649, [hu.o, lv.o, lv.o, lv.o], opt.rules || rules, mode);
    var one = C.machineMs() / 1000;
    var out = {
      '数えかた': (mode === 'match' ? '★100点まで（1つの 勝負）' : '1回 配る ぶん'),
      '回数': st.games,
      '★ロボットの つよさ': lv.label, '★人の 打ち手': hu.label,
      '★反則の 手': st.illegal + '件',
      '★点の 合計が 26で ない': st.badTot + '件',
      '★手番が 52で ない': st.badPly + '件',
      '★★終わらない 勝負': st.nofin + '件',
      '★人が 勝つ': (st.win / st.games * 100).toFixed(2) + '%（★五分 25.0%）',
      '★ぜんぶ取りが 出た': (st.moon / st.games * 100).toFixed(2) + '%（★うち 自分 ' + (st.moonMine / st.games * 100).toFixed(2) + '%）',
      'かかった 時間': (Date.now() - t0) + 'ms'
    };
    if (mode === 'match') {
      out['★配った 回数 まん中'] = C.pct(st.dealList, 0.5) + '回';
      out['★配った 回数 9割'] = C.pct(st.dealList, 0.9) + '回';
      out['★★長さ【見立て】'] = '1回 ' + (one + 32.5).toFixed(1) + '秒（★機械 ' + one.toFixed(1) +
        '秒 ＋ 人 13手×2.5秒）／★まん中 ' + ((one + 32.5) * C.pct(st.dealList, 0.5) / 60).toFixed(1) +
        '分・9割 ' + ((one + 32.5) * C.pct(st.dealList, 0.9) / 60).toFixed(1) + '分';
    }
    console.log('[ハーツ] autoPlay', out);
    return out;
  }

  /* ★ つよさ 3段 × 人の 分かり具合（★ルル T164 §13-1 の 表を 本物の core で）*/
  function rates(n, mode) {
    n = n || 1500; mode = mode || 'match';
    var out = { '数えかた': (mode === 'match' ? '★100点まで' : '1回 配る ぶん'), '回数': n + '（各マス）' };
    for (var hi = 0; hi < 4; hi++) {
      var row = [];
      for (var li = 0; li < C.LEVELS.length; li++) {
        var st = C.runMany(n, 246810, [C.HUMANS[hi].o, C.LEVELS[li].o, C.LEVELS[li].o, C.LEVELS[li].o], null, mode);
        row.push(C.LEVELS[li].label + ' ' + (st.win / st.games * 100).toFixed(2) + '%');
      }
      out[C.HUMANS[hi].label] = row.join('　');
    }
    console.log('[ハーツ] rates', out);
    return out;
  }

  /* ============================================================
     ★ はみ出し・画面外を 測る
     ============================================================ */
  /* ⚠️★ `.back` を そのまま 入れては いけません ―― ★札の うら面の 絵も `img.back` です。
     ★ ★.topbar で しぼります（★ページワン T152 の 60件の 誤りの もと）。 */
  var TOUCH_SEL = '.topbar .back,.howto,.start-button,.sub-button,.dialog-ok,.close-dialog,.pass-btn,.level-select';
  function measureOnce() {
    var r = stageEl.getBoundingClientRect();
    var out = { over: 0, off: 0, offName: [], small: 0,
                scrollX: document.documentElement.scrollWidth > window.innerWidth,
                scrollY: document.documentElement.scrollHeight > window.innerHeight };
    /* ⚠️★★ 札の はみ出しは **本当に 描かれた 大きさ** で 測ります（★計算だけ 見て いると
       ★CSS で こわれた ときに 気づけません ―― ★ページワン T152 の 失敗）。 */
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
      var q2 = el.getBoundingClientRect();
      if (q2.width === 0 || q2.height === 0) continue;
      if (q2.left < -0.5 || q2.top < -0.5 || q2.right > window.innerWidth + 0.5 || q2.bottom > window.innerHeight + 0.5) {
        out.off++; out.offName.push(el.className || el.tagName);
      }
      if (q2.width < 43.5 || q2.height < 43.5) out.small++;
    }
    return out;
  }

  /* ★★★ 手札 13枚 ―― ★1枚ずつ **まん中を さして、その 札が 返るか** ★★★
     ------------------------------------------------------------
     ★ トライ T153 🟡-1【実測】：★13枚（見えて いる はば 22px）で 13/13 ○、
       ★★14枚（20px）で **1/14 ✕**。★45%で 一気に 壊れます。
     ★ ★式では なく **本物で** 数えます（★これが この 1本の いちばん 大事な ものさし）。 */
  function handHit() {
    var okN = 0, n = g ? g.hands[0].length : 0, i, bad = [];
    for (i = 0; i < n; i++) {
      var e = cardEl[g.hands[0][i].id];
      if (!e) { bad.push(i); continue; }
      var q = e.getBoundingClientRect();
      var got = hitAt(q.left + q.width / 2, q.top + q.height / 2);
      if (got === e) okN++; else bad.push(i);
    }
    return { n: n, ok: okN, bad: bad };
  }

  /* ★★ はみ出し しらべ（設計図 追記③）★★
     ★ わたす 場面・出す 場面（★場に 0〜4枚）を まぜて 測ります。 */
  function fitTest(n) {
    n = n || 200;
    var rd = C.rng(90909), worst = 0, offTotal = 0, smallTotal = 0, names = {}, sx = 0, sy = 0;
    var hitBad = 0, hitTot = 0;
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
        g = C.makeGame(rd, { rules: rules, dealNo: k % 4 });
        var p, i;
        /* ★ 4回に 1回は わたす 場面、のこりは 出す 場面（★場に 0〜4枚）*/
        if (k % 4 !== 0 && g.phase === 'pass') {
          var give = [[], [], [], []];
          for (p = 0; p < 4; p++) give[p] = C.botPass(g, p, C.LEVELS[2].o);
          C.doPass(g, give);
        }
        for (p = 1; p < 4; p++) for (i = 0; i < g.hands[p].length; i++) makeCard(g.hands[p][i], false);
        for (i = 0; i < g.hands[0].length; i++) makeCard(g.hands[0][i], true);
        if (g.phase === 'play') {
          var put = k % 5;                                 /* ★ 場に 0〜4枚 出した ところ */
          for (i = 0; i < put; i++) {
            var seat = g.cur;
            var idx = C.botIdx(g, seat, C.LEVELS[2].o);
            var rr = C.playIdx(g, seat, idx);
            if (!rr.ok) break;
            if (!cardEl[rr.id]) makeCard({ id: rr.id, c: rr.card }, true);
            faceUp(rr.id, true);
          }
        } else {
          picks[g.hands[0][0].id] = 1; picks[g.hands[0][1].id] = 1; picks[g.hands[0][2].id] = 1;
        }
        placeAll(true);
        var m = measureOnce();
        if (m.over > worst) worst = m.over;
        offTotal += m.off; smallTotal += m.small;
        for (var q = 0; q < m.offName.length; q++) names[m.offName[q]] = 1;
        if (m.scrollX) sx++;
        if (m.scrollY) sy++;
        if (k % 7 === 0) { var hh = handHit(); hitTot += hh.n; hitBad += (hh.n - hh.ok); }
      }
    });
    dropCards();
    picks = keepPicks; g = keepG; busy = keepBusy; over = keepOver;
    if (kTitleHid) titleScreen.classList.add('hidden'); else titleScreen.classList.remove('hidden');
    if (kPlayHid) playScreen.classList.add('hidden'); else playScreen.classList.remove('hidden');
    if (g) { rebuild(); placeAll(true); }
    var out = {
      '画面': window.innerWidth + '×' + window.innerHeight,
      '★札': geo.cw + '×' + geo.ch + 'px（★見えて いる はば ' + geo.pitch.toFixed(1) + 'px）',
      '調べた場面': n + '（★わたす 場面 ／ 場に 0〜4枚 の 場面）',
      '★はみ出し（一番 大きい）': worst + 'px',
      '★押す ところが 画面外': offTotal + '件',
      '★44pxより 小さい ボタン': smallTotal + '件',
      '★★手札の まん中を さして 当たらなかった': hitBad + ' / ' + hitTot + '枚',
      '横スクロールが 出た場面': sx, '縦スクロールが 出た場面': sy
    };
    if (offTotal) out['画面外に 出た もの'] = Object.keys(names);
    console.log('[ハーツ] fitTest', out);
    return out;
  }

  /* ============================================================
     ★★★ 手を 教えて いないか（★T168・🟡-2 の 直し・トライ T166 §5-3）★★★
     ------------------------------------------------------------
     ⚠️★★ 前の 見張りは **文字あわせ** でした ―― ★★トライが 3通り すり抜けました【実測】：
        ★ ★`わたそう[^！]` … ★★「Qは わたそう**！**」―― ★★「！」1文字で 通る
        ★ ★`この 札を 出`   … ★★ルルの 文は「**その** 札を 出すと 取っちゃうよ」―― ★★1文字ちがいで 通る
        ★ ★「わたした ほうが いいよ」に あたる 形が **そもそも ありません** でした
     ★★ ＝ ★★**言い回しを 並べる やり方では、言い回しの 数だけ すきまが できます。**

     ★★★ だから 見かたを 変えました ―― ★**「何を」＋「どう しろ」の 組で 見ます** ★★★
        ★ ★手を 教える 文は かならず ★★**①札を 名ざしして ②どう しろと 言う**。
        ★ ★★どちらか 片方だけ なら 教えて いません：
          ★ ★「同じ マークの 札を 出そう」…… ★★札を 名ざして いない（★決まりの 言い方）→ ○
          ★ ★「3枚 えらんで 左の 人に わたそう」… ★★同じく 名ざして いない → ○
          ★ ★「スペードの Q は 13点」……………… ★★名ざして いるが「どう しろ」が 無い → ○
          ★ ★★「Qは わたした ほうが いいよ」…… ★★★両方 ある → ✕
     ★ ★そして ―― ★★**空白・句読点・「！」を ぜんぶ 取ってから** くらべます。
       ★ ★★これで「！」や 半角空白 1つでは すり抜けられません。
     ★ ★「おすすめ」は 単独で 禁句 です（★ルル §14-2「わたす3枚の おすすめ」）。
     ============================================================ */
  function flatText(s) { return String(s).replace(/[\s　。、,.!?！？…‥・「」『』（）()]/g, ''); }
  /* ★ ①札の 名ざし ―― ★マーク名・絵札の 字・「この札／その札」など */
  var TEACH_CARD = 'スペード|ハート|ダイヤ|クローバー|[♠♥♦♣]|[QKAJ]|クイーン|キング|エース|ジャック' +
                   '|この札|その札|この1枚|その1枚|点の札|高い札|低い札|強い札|弱い札|大きい札|小さい札';
  /* ★ ②どう しろ ―― ★すすめる・止める の 言い方 */
  var TEACH_ADVICE = 'ほうがい|ほうがよ|わたそ|わたした|わたして|だそう|ださない|出そう|出さない' +
                     '|のこそ|のこして|残そ|残して|ためて|とっちゃ|取っちゃ|とられ|取られ' +
                     '|あぶな|危な|きけん|危険|やめ|気をつけ|きをつけ|注意|ちゅうい|しないで|だめ';
  /* ★ 単独で 禁句（★どこに 出ても 教えて います）*/
  var TEACH_ALONE = ['おすすめ', 'オススメ', 'すすめ', 'ヒント', 'コツ'];
  /* ★★ ルル T164 §14-2 の 表の 文 そのもの（★★これが 通ったら 見張りは 死んで います）*/
  var TEACH_RULU = ['その札を出すと取っちゃう', 'Qはわたしたほうがいい', 'わたす3枚のおすすめ'];
  function teachHit(s) {
    var f = flatText(s), out = [], i;
    var re = new RegExp('(' + TEACH_CARD + ')[^]{0,14}?(' + TEACH_ADVICE + ')', 'g');
    var m;
    while ((m = re.exec(f))) { out.push(m[0]); if (re.lastIndex <= m.index) re.lastIndex = m.index + 1; }
    for (i = 0; i < TEACH_ALONE.length; i++) if (f.indexOf(TEACH_ALONE[i]) >= 0) out.push(TEACH_ALONE[i]);
    for (i = 0; i < TEACH_RULU.length; i++) if (f.indexOf(TEACH_RULU[i]) >= 0) out.push('★ルルの 禁句：' + TEACH_RULU[i]);
    return out;
  }

  /* ★ 画面の 文字（★札の 上の 文字は 0文字で なければ ならない）*/
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
     ⚠️★★ **まず 拾い、それから（中身が ある ときだけ）もぐる** こと。
        ★ いまの Chrome は ふつうの 決まり（.card など）にも 空の cssRules を 付けます。
        ★ ★`if (r.cssRules) { walk(...); continue; }` と 書くと **1つも 集まりません**
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
     ★ 場面を 作る どうぐ（★52枚 きっちり 保った まま 動かします）
     ============================================================ */
  function snapG() {
    if (!g) return null;
    var s = { hands: [], trick: g.trick.slice(), taken: g.taken.slice(), tookN: g.tookN.slice() }, p;
    for (p = 0; p < 4; p++) s.hands.push(g.hands[p].slice());
    ['phase', 'leadSuit', 'trickNo', 'heartsBroken', 'qsPlayed', 'lead', 'cur', 'over', 'moonBy']
      .forEach(function (k) { s[k] = g[k]; });
    return s;
  }
  function restoreG(s) {
    if (!g || !s) return;
    for (var p = 0; p < 4; p++) g.hands[p] = s.hands[p].slice();
    g.trick = s.trick.slice(); g.taken = s.taken.slice(); g.tookN = s.tookN.slice();
    ['phase', 'leadSuit', 'trickNo', 'heartsBroken', 'qsPlayed', 'lead', 'cur', 'over', 'moonBy']
      .forEach(function (k) { g[k] = s[k]; });
  }
  /* ============================================================
     ★ 「人の 番・出す ところ」の 場面を 作る（★trickN 枚 すでに 出て いる）
     ------------------------------------------------------------
     ⚠️★★ T168 の 直し（★トライ T166 §7-8）★★
        ★ トライの 実測：★17回 走らせて **1回**、★見張り ⑤ が
          ★★「出す ときに 暗い 札が 1枚も ない」と 誤って 鳴りました。
        ★ ★正体：★前は 先に 出す 席の 手札の **1枚目を そのまま** 場に 出して いました。
          ★ ★その マークを 人が 1枚も 持って いないと ―― ★★**何を 出しても よい ＝ 暗い 0枚**。
          ★ ★機能は 生きて いる のに「機能が 死んで いる」と 鳴って いました。
        ★ → ★★**人が「出せる 札」と「出せない 札」を 両方 持つ マーク**を 先に 選びます。
          ★ ★どの 席も その マークを 持って いない ときは、★★1枚 入れかえて 作ります
            （★★52枚は 1枚も 増やさず・減らさず 保ちます）。
        ★ ★★作れなかった ときは false を 返します ―― ★呼ぶ 側は
          ★★「機能が 死んで いる」では なく「試し方が おかしい」と 書き分けます。
     ============================================================ */
  function suitCountIn(seat, su) {
    var n = 0, k;
    for (k = 0; k < g.hands[seat].length; k++) if (C.suitOf(g.hands[seat][k].c) === su) n++;
    return n;
  }
  function makePlayScene(trickN) {
    if (!g) return false;
    g.phase = 'play'; g.over = false; g.trickNo = 3; g.heartsBroken = true;
    g.trick = []; g.leadSuit = -1; g.cur = 0;
    if (!g.hands[0].length) return false;
    if (trickN <= 0) return true;
    var start = (4 - trickN) % 4;
    if (start === 0) return false;
    var i, s, p, S = -1;
    /* ★ ① 人が 両方（出せる／出せない）を 持つ マークで、★先に 出す 席も 持って いる もの */
    for (s = 0; s < 4; s++) {
      var mine = suitCountIn(0, s);
      if (mine >= 1 && mine < g.hands[0].length && suitCountIn(start, s) >= 1) { S = s; break; }
    }
    /* ★ ② 無ければ 1枚 入れかえて 作る（★52枚は 保った まま）*/
    for (s = 0; s < 4 && S < 0; s++) {
      var mine2 = suitCountIn(0, s);
      if (!(mine2 >= 1 && mine2 < g.hands[0].length)) continue;
      for (p = 1; p < 4 && S < 0; p++) {
        if (p === start) continue;
        for (i = 0; i < g.hands[p].length; i++) {
          if (C.suitOf(g.hands[p][i].c) !== s) continue;
          var give = g.hands[p].splice(i, 1)[0];
          var back = g.hands[start].pop();
          g.hands[start].push(give);
          g.hands[p].push(back);
          S = s; break;
        }
      }
    }
    if (S < 0) return false;
    /* ★ 場に trickN 枚 ―― ★人の 前の 席から 順に（★人が 最後に 出す 形）*/
    for (i = 0; i < trickN; i++) {
      var seat = (start + i) % 4;
      if (seat === 0) return false;
      if (!g.hands[seat].length) return false;
      var at = 0;
      for (var k = 0; k < g.hands[seat].length; k++) {
        if (C.suitOf(g.hands[seat][k].c) === S) { at = k; break; }   /* ★ なるべく 同じ マークで */
      }
      var sl = g.hands[seat].splice(at, 1)[0];
      if (i === 0) g.leadSuit = C.suitOf(sl.c);
      g.trick.push({ p: seat, id: sl.id, c: sl.c });
    }
    g.cur = 0;
    /* ★★ ここが この 直しの ぜんぶ ―― ★★「出せる 札」と「出せない 札」が 両方 ある か */
    var L = C.legalIdx(g, 0);
    if (!L.length || L.length >= g.hands[0].length) return false;
    return true;
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
  function dimMap() {
    var m = '', i, e;
    for (i = 0; i < g.hands[0].length; i++) {
      e = cardEl[g.hands[0][i].id];
      m += e ? (e.classList.contains('is-dim') ? '1' : '0') : '?';
    }
    return m;
  }

  /* ============================================================
     ★★★ ⑤ 暗くする しかけを 本物で 通して 測る ★★★
     ★ 数字を 書き写しません。★★本物の refreshDim を そのまま 通します。
     ★ 測り終わったら 状態を 1つ 残らず 元に 戻します（★T144 §7-5 の 失敗）。
     ============================================================ */
  function dimProbe() {
    var out = { onMe: 0, wrong: 0, botTurn: 0, busyOn: 0, overOn: 0, notMe: 0, passOn: 0, worked: 0, noScene: 0 };
    if (!g || !cardsEl) return out;
    var snap = snapG();
    var kBusy = busy, kOver = over;
    still(function () {
      busy = false; over = false;
      /* ★ 場面を 作れなかった ときは「機能が 死んで いる」では ありません（★T168・上の ⚠️）*/
      if (!makePlayScene(2)) { out.noScene = 1; return; }
      rebuild(); placeAll(true);
      var ok = {}, l = C.legalIdx(g, 0), i;
      for (i = 0; i < l.length; i++) ok[l[i]] = 1;
      for (i = 0; i < g.hands[0].length; i++) {
        var e = cardEl[g.hands[0][i].id];
        if (!e) continue;
        var dim = e.classList.contains('is-dim');
        if (dim) out.onMe++;
        if (dim === !!ok[i]) out.wrong++;              /* ★ 出せる のに 暗い／出せない のに 明るい */
      }
      if (out.onMe > 0) out.worked = 1;
      var all = cardsEl.querySelectorAll('.card.is-dim');
      for (i = 0; i < all.length; i++) if (all[i].where !== 'me') out.notMe++;
      /* ★ ロボットの 番 ―― ★1枚も 暗く しない */
      g.cur = 1; refreshDim();
      out.botTurn = cardsEl.querySelectorAll('.card.is-dim').length;
      /* ★ 動いて いる 途中 */
      g.cur = 0; busy = true; refreshDim();
      out.busyOn = cardsEl.querySelectorAll('.card.is-dim').length;
      /* ★ 終わった あと */
      busy = false; over = true; refreshDim();
      out.overOn = cardsEl.querySelectorAll('.card.is-dim').length;
      /* ★★ わたす とき ―― ★1枚も 暗く しない（★強調は 1種類まで）*/
      over = false; g.phase = 'pass'; refreshDim();
      out.passOn = cardsEl.querySelectorAll('.card.is-dim').length;
    });
    restoreG(snap);
    busy = kBusy; over = kOver;
    if (g) { rebuild(); placeAll(true); }
    return out;
  }

  /* ============================================================
     ★★★ ④ 強調は その ときどき 1種類だけ（★本物で 数える）★★★
     ============================================================ */
  function markProbe() {
    var out = { passDim: -1, passPick: -1, playDim: -1, playPick: -1, ok: 0, why: [] };
    if (!g || !cardsEl) { out.why.push('★場面を 作れない'); return out; }
    var snap = snapG();
    var kBusy = busy, kOver = over, kPicks = picks;
    still(function () {
      /* ★ わたす とき ―― ★わく だけ・暗いのは 0 */
      busy = false; over = false;
      g.phase = 'pass'; g.trick = []; g.trickNo = 0; g.over = false;
      picks = {};
      picks[g.hands[0][0].id] = 1; picks[g.hands[0][1].id] = 1;
      rebuild(); placeAll(true);
      out.passPick = cardsEl.querySelectorAll('.card.is-pick').length;
      out.passDim = cardsEl.querySelectorAll('.card.is-dim').length;
      /* ★ 出す とき ―― ★暗いのだけ・わくは 0 */
      picks = {};
      if (!makePlayScene(2)) { out.why.push('★出す 場面を 作れない'); return; }
      rebuild(); placeAll(true);
      out.playDim = cardsEl.querySelectorAll('.card.is-dim').length;
      out.playPick = cardsEl.querySelectorAll('.card.is-pick').length;
      out.ok = 1;
    });
    picks = kPicks;
    restoreG(snap);
    busy = kBusy; over = kOver;
    if (g) { rebuild(); placeAll(true); }
    return out;
  }

  /* ============================================================
     ★★★ ⑭ 人が さわれるか（★ルル §17 コーダ⑤）★★★
     ------------------------------------------------------------
     ★ ルルの ご指摘：★「★『人の 番なのに、押せる ものが 1つも 無い』場面が 作れないか。
       ★★ハーツでは 手札が 必ず 1枚以上 ある ので 起きない はず ですが、
       ★★『起きない はず』を そのまま 出さないで ください。」
     ★ → ★★**本物の 指の 道**（pointerdown → pointerup）を 通して、
       ★ ★わたす 場面／出す 場面（場に 0〜3枚）を 作り、★1つでも 動かなければ 鳴らします。
     ============================================================ */
  function reachProbe() {
    var out = { cases: 0, dead: 0, why: [], detail: [] };
    if (!g || !cardsEl || !geo || !built) { out.why.push('★立ち上がって いない'); return out; }
    var snap = snapG();
    var kBusy = busy, kOver = over, kPicks = picks;
    var kResult = resultWrap.classList.contains('hidden');
    var tMark = timers.length;

    var CASES = [['★わたす 場面', 'pass', 0], ['★出す（場に 0枚）', 'play', 0],
                 ['★出す（場に 1枚）', 'play', 1], ['★出す（場に 3枚）', 'play', 3]];
    still(function () {
      CASES.forEach(function (cs) {
        restoreG(snap);
        busy = false; over = false; picks = {};
        resultWrap.classList.add('hidden');
        if (cs[1] === 'pass') { g.phase = 'pass'; g.trick = []; g.trickNo = 0; g.over = false; g.cur = 0; }
        else if (!makePlayScene(cs[2])) return;
        rebuild(); placeAll(true);
        out.cases++;
        var was = { h: g.hands[0].length, t: g.trick.length, pk: pickCount() };
        var pts = [], i, q;
        for (i = 0; i < g.hands[0].length; i++) {
          var he = cardEl[g.hands[0][i].id];
          if (!he) continue;
          q = he.getBoundingClientRect();
          pts.push([q.left + q.width / 2, q.top + q.height / 2]);
        }
        var moved = 0;
        for (i = 0; i < pts.length; i++) {
          var el = hitAt(pts[i][0], pts[i][1]);
          if (!el) continue;
          tapDom(el, pts[i][0], pts[i][1]);
          if (g.hands[0].length !== was.h || g.trick.length !== was.t || pickCount() !== was.pk) { moved = 1; break; }
        }
        out.detail.push(cs[0] + '：さわれた 所 ' + pts.length + '／' + (moved ? '★動いた ○' : '★★1ミリも 動かない ✕'));
        if (!pts.length) { out.dead++; out.why.push(cs[0] + ' ―― ★★押す ものが 1つも ない'); }
        else if (!moved) { out.dead++; out.why.push(cs[0] + ' ―― ★★手札を ぜんぶ 押しても 1ミリも 動かない'); }
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
     ★★★ ⑯ 押して・すべらせて・はなす（★ページワン T157／T160 を 引きつぐ）★★★
     ------------------------------------------------------------
     ★ 指の ポインタは 押した ものに くっつく（implicit pointer capture）。
       ★ ★＝ となりへ すべらせて はなしても e.target は「押した 札」の まま。
     ★ ★★ここでは その くっつきを **そのまま 作って 通します**：
       ★ ①A（出せる 札）に pointerdown … 座標は A の まん中
       ★ ②★★A に pointerup … ★★★座標だけ B（となりの 札）の まん中
       ★ ③手札が 減って いたら ―― ★★鳴らす
     ★ ★くらべを 2つ 置きます（★片方だけ だと「いつも 動かない」でも 通る）：
       ★ ★まっすぐ … ★減らなければ 鳴らす（＝ 測り方が おかしい）・★ゆれても 鳴らす
       ★ ★マウス   … ★減ったら 鳴らす
     ============================================================ */
  function slideScene() {
    if (!makePlayScene(0)) return null;
    rebuild(); placeAll(true);
    var L = C.legalIdx(g, 0);
    if (!L.length || g.hands[0].length < 2) return null;
    var A = cardEl[g.hands[0][L[0]].id];
    if (!A) return null;
    for (var i = 0; i < g.hands[0].length; i++) {
      var e2 = cardEl[g.hands[0][i].id];
      if (!e2 || e2 === A) continue;
      var r2 = e2.getBoundingClientRect();
      var bx = r2.left + r2.width / 2, by = r2.top + r2.height / 2;
      var got = hitAt(bx, by);
      if (got && got !== A && got.slotId !== A.slotId) return { A: A, x: bx, y: by, n: g.hands[0].length };
    }
    return null;
  }
  function slideProbe() {
    var out = { ok: 0, straight: '―', stuck: '―', mouse: '―',
                sayStraight: '―', say: '―', sayMouse: '―', why: [] };
    if (!g || !cardsEl || !geo || !built) { out.why.push('★立ち上がって いない'); return out; }
    var snap = snapG();
    var kBusy = busy, kOver = over, kPicks = picks;
    var kResult = resultWrap.classList.contains('hidden');
    var tMark = timers.length;

    function scene() {
      restoreG(snap);
      busy = false; over = false; picks = {};
      resultWrap.classList.add('hidden');
      return slideScene();
    }
    still(function () {
      /* ★ (a) まっすぐ 押して はなす ―― ★これが 通らなければ 測り方が おかしい */
      var s = scene();
      if (!s) { out.why.push('★★試し方が おかしい：★「出せる 札 ＋ となりの 札」の 場面を 作れなかった'); return; }
      var rA = s.A.getBoundingClientRect();
      s.A.classList.remove('is-no');
      pressRelease(s.A, s.A, rA.left + rA.width / 2, rA.top + rA.height / 2);
      out.straight = (g.hands[0].length < s.n) ? '○ 出た' : '★✕ 出ない';
      if (g.hands[0].length >= s.n) out.why.push('★★試し方が おかしい：★まっすぐ 押しても 札が 出ない');
      out.sayStraight = s.A.classList.contains('is-no') ? '★★✕ ゆれて しまう' : '○ ゆれない';
      if (s.A.classList.contains('is-no')) {
        out.why.push('★★まっすぐ 押して 出た のに ゆれた（★★いつも ゆれて いる ＝ 返事に なって いません）');
      }
      /* ★ (b) ★★指の くっつき */
      s = scene();
      if (!s) { out.why.push('★★試し方が おかしい：★2回目の 場面を 作れなかった'); return; }
      s.A.classList.remove('is-no');
      pressRelease(s.A, s.A, s.x, s.y);
      var slid = (g.hands[0].length < s.n);
      out.stuck = slid ? '★★✕ 出て しまう' : '○ 出ない';
      if (slid) out.why.push('★★★指で となりへ すべらせて はなしたのに、★押した 方の 札が 出た');
      out.say = slid ? '―' : (s.A.classList.contains('is-no') ? '○ ぷるっと 返した' : '★★✕ 何も 返さない');
      if (!slid && !s.A.classList.contains('is-no')) {
        out.why.push('★★★すべって 出なかった のに、★押した 札が 1回も ゆれない（★遊ぶ人には 壊れたと 見分けが つきません）');
      }
      /* ★ (c) くらべ：マウス */
      s = scene();
      if (!s) { out.why.push('★★試し方が おかしい：★3回目の 場面を 作れなかった'); return; }
      s.A.classList.remove('is-no');
      var upEl = hitAt(s.x, s.y) || s.A;
      pressRelease(s.A, upEl, s.x, s.y);
      var m = (g.hands[0].length < s.n);
      out.mouse = m ? '★✕ 出て しまう' : '○ 出ない';
      if (m) out.why.push('★★マウスで すべらせても 押した 方の 札が 出た');
      out.sayMouse = m ? '―' : (s.A.classList.contains('is-no') ? '○ ぷるっと 返した' : '★★✕ 何も 返さない');
      if (!m && !s.A.classList.contains('is-no')) {
        out.why.push('★★マウスで すべった ときだけ 返事が ない（★指と そろって いません）');
      }
      out.ok = 1;
    });
    for (var t = timers.length - 1; t >= tMark; t--) { clearTimeout(timers[t]); timers.splice(t, 1); }
    var a2 = cardsEl.querySelectorAll('.card.is-no');
    for (var i2 = 0; i2 < a2.length; i2++) a2[i2].classList.remove('is-no');
    picks = kPicks;
    restoreG(snap);
    busy = kBusy; over = kOver;
    if (kResult) resultWrap.classList.add('hidden'); else resultWrap.classList.remove('hidden');
    if (g) { rebuild(); placeAll(true); }
    return out;
  }

  /* ============================================================
     ★★★ ⑲ 線を こえて いないか（★この 1本の いちばん 大事な 見張り）★★★
     ------------------------------------------------------------
     ★ ルル §14-2 の 表（★ここを こえたら 設計図 追記② 違反）：
       | ★言って よい | ★★言っては いけない |
       | 点が 少ない 人の 勝ち | ★その 札を 出すと 取っちゃうよ |
       | ハート1点・Q13点 | ★★Qは わたした ほうが いいよ |
       | いま 自分が 何点 取ったか | ★★わたす3枚の おすすめ |
       | 出せない 札を 暗くする | ★★★いま 誰が この 4枚を 取る ことに なって いるか |
     ★ ★3つの 目で 見ます ―― ★①わたす 場面を 本物で 通す ★②場に 3枚 出た 画面を 数える ★③行を 走査する。
     ============================================================ */
  function lineProbe() {
    var out = { passMarks: -1, passWords: '―', trickMarks: -1, trickWords: '―',
                trickDim: '―', ok: 0, why: [] };
    if (!g || !cardsEl || !geo || !built) { out.why.push('★立ち上がって いない'); return out; }
    var snap = snapG();
    var kBusy = busy, kOver = over, kPicks = picks;
    var kSay = sayEl.classList.contains('hidden');
    still(function () {
      /* ★ ① わたす 場面 ―― ★何も 押して いない のに 印が 付いて いないか */
      restoreG(snap);
      busy = false; over = false; picks = {};
      g.phase = 'pass'; g.trick = []; g.trickNo = 0; g.over = false; g.cur = 0;
      sayEl.classList.add('hidden');
      rebuild(); placeAll(true);
      out.passMarks = cardsEl.querySelectorAll('.card.is-pick,.card.is-dim,.card.is-no').length;
      out.passWords = readableText(cardsEl);
      if (out.passMarks !== 0) {
        out.why.push('★★★わたす 場面で、★人が 1枚も 押して いない のに 印が ' + out.passMarks + '枚 付いて いる（★おすすめ ＝ 追記② 違反）');
      }
      if (out.passWords) out.why.push('★★札の 上に 文字が ある：' + out.passWords);

      /* ★ ② 場に 3枚 出た 画面 ―― ★「誰が 取る ことに なって いるか」の 印が 0か */
      restoreG(snap);
      busy = false; over = false; picks = {};
      if (!makePlayScene(3)) { out.why.push('★★試し方が おかしい：★場に 3枚 出た 場面を 作れなかった'); return; }
      rebuild(); placeAll(true);
      var marks = cardsEl.querySelectorAll('.is-win,.is-take,.is-lead,.is-hint,.is-glow,.is-here,.is-ok,.is-top');
      out.trickMarks = marks.length;
      if (marks.length) out.why.push('★★★場の 札に「いま 誰が 取るか」の 印が ' + marks.length + '個 付いて いる');
      out.trickWords = readableText(cardsEl);
      if (out.trickWords) out.why.push('★★★場の 上に 文字が ある：' + out.trickWords);
      /* ★ 暗いのは 決まりどおり か（★出せない 札 だけ）*/
      var l = C.legalIdx(g, 0), ok = {}, i, want = '';
      for (i = 0; i < l.length; i++) ok[l[i]] = 1;
      for (i = 0; i < g.hands[0].length; i++) want += (ok[i] ? '0' : '1');
      out.trickDim = (dimMap() === want) ? '○ 決まりどおり' : '★★✕ ちがう';
      if (dimMap() !== want) {
        out.why.push('★★★暗い／明るいが 決まりと ちがう（★出て いる ' + dimMap() + ' ／ 決まり ' + want + '）');
      }
      /* ★ 点の 帯に 出て いるのは 数と 名前だけ か（★「あぶない」などが 無いか）*/
      var band = readableText(scoreBand);
      if (/あぶな|気を|ちゅうい|注意|おすすめ|やめ/.test(band)) {
        out.why.push('★★★点の 帯が 手を 教えて いる：' + band);
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
     ★★★ ⑳ 勝ち負けの 画面が「誰が 勝ったか」を 言って いるか（★社長裁定 T165 判断5）★★★
     ------------------------------------------------------------
     ★ ★数えるのでは なく ―― ★★**本物の showResult を 4通り 通します。**
       ★ ①あなたが 勝つ ②ロボットが 勝つ ③あなたと ロボット1が 同じ 点 ④ロボット2人が 同じ 点
     ★★ そして ―― ★★**「なぜ 勝ったか」を 言って いないかも 同時に 数えます**（★アイの 線②）。
        ★ ★合計の 表に すでに 数字が 出て いる ので、★「点が いちばん 少なかった」「◯点」の たぐいは
          ★★**説明を 増やしただけ**に なります（★§5.5「説明は 足すより 減らす」）。
     ★ ★くらべを 1つ 置きます ―― ★★**1回 おわりの 画面では「勝ち」と 言わない**
       （★まだ 勝負は ついて いません。★これが 無いと「いつも 勝ちと 言う」でも 通って しまいます）。
     ★ ★状態は 1つ 残らず 元に もどします（★T144 §7-5：見張りが 自分で 場面を こわす 事故）。
     ============================================================ */
  function winProbe() {
    var out = { cases: [], mid: '―', why: [] };
    if (!match || !g) { out.why.push('★立ち上がって いない'); return out; }
    var kTotal = match.total.slice(), kDeal = match.dealNo, kOver = match.over, kWin = match.winners.slice();
    var kMoon = g.moonBy;
    var kHidden = resultWrap.classList.contains('hidden');
    var kTitle = resultTitle.textContent, kCls = resultTitle.className, kSay = resultSay.textContent;
    var kScore = resultScore.innerHTML, kNext = btnNext.innerHTML;
    var kLv = levelPickResult.classList.contains('hidden');
    var kLock = resultBox.classList.contains('is-locked');
    var tMark = timers.length;

    /* ★ 「なぜ 勝ったか」＝ ★合計の 表の 言い直し。★ここに 当たったら 鳴らします。 */
    var NOWHY = /少なかった|少ない|多かった|多い|\d+\s*点/;
    var CASES = [
      ['★あなたが 勝つ',                 [0],    '勝ち！', ['あなた']],
      ['★ロボットが 勝つ',               [2],    '負け…', ['ロボット2']],
      ['★あなたと ロボット1が 同じ 点',   [0, 1], '勝ち！', ['あなた', 'ロボット1']],
      ['★ロボット1と ロボット3が 同じ 点', [1, 3], '負け…', ['ロボット1', 'ロボット3']]
    ];
    still(function () {
      g.moonBy = -1;
      CASES.forEach(function (cs) {
        match.over = true; match.winners = cs[1].slice();
        match.total = [30, 40, 50, 101]; match.dealNo = 8;
        showResult([3, 4, 5, 14], [27, 36, 45, 87]);
        if (levelPickResult.classList.contains('hidden')) out.lvFin = 0; else out.lvFin = 1;
        var ti = resultTitle.textContent, sa = resultSay.textContent;
        var miss = [], i;
        for (i = 0; i < cs[3].length; i++) if (sa.indexOf(cs[3][i]) < 0) miss.push(cs[3][i]);
        var why = NOWHY.test(sa);
        out.cases.push(cs[0] + '「' + ti + '／' + sa + '」' +
                       (miss.length ? ' ★✕' : ' ○') + (why ? ' ★★✕なぜ' : ''));
        if (ti !== cs[2]) {
          out.why.push('★' + cs[0] + ' の 見出しが「' + ti + '」（★「' + cs[2] + '」の はず）');
        }
        if (miss.length) {
          out.why.push('★★★' + cs[0] + ' で 勝った 人の 名前が ありません：' + miss.join('・') +
                       '（★出て いる 文「' + sa + '」）');
        }
        if (why) {
          out.why.push('★★★' + cs[0] + ' で「なぜ 勝ったか」を 言って います（★合計の 表に すでに ' +
                       '数字が 出て います ―― ★§5.5「説明は 足すより 減らす」）：「' + sa + '」');
        }
      });
      /* ★ くらべ ―― ★1回 おわりの 画面（★まだ 勝負は ついて いない）*/
      match.over = false; match.winners = [];
      showResult([3, 4, 5, 14], [27, 36, 45, 87]);
      /* ★★★ T171・🟡-1 の 見張り（★トライ T170：「元に 戻しても NG0」）★★★
         ★ ★1回 おわりの 画面にも つよさが 出て いるか ―― ★★ここで 数えます。
         ★ ★★くらべに なる ように、勝ち負けの 画面（上の lvFin）も 同時に 数えて います
           ―― ★★片方だけ だと「いつも 出て いる」でも「いつも 隠れて いる」でも 通ります。 */
      out.lvMid = levelPickResult.classList.contains('hidden') ? 0 : 1;
      out.mid = resultTitle.textContent + '／' + resultSay.textContent;
      if (/勝ち/.test(resultSay.textContent)) {
        out.why.push('★★1回 おわりの 画面で「勝ち」と 言って います（★まだ 勝負は ついて いません）：「' +
                     resultSay.textContent + '」');
      }
    });
    for (var t = timers.length - 1; t >= tMark; t--) { clearTimeout(timers[t]); timers.splice(t, 1); }
    happyMid.classList.remove('is-jump');
    match.total = kTotal; match.dealNo = kDeal; match.over = kOver; match.winners = kWin;
    g.moonBy = kMoon;
    resultTitle.textContent = kTitle; resultTitle.className = kCls; resultSay.textContent = kSay;
    resultScore.innerHTML = kScore; btnNext.innerHTML = kNext;
    if (kLv) levelPickResult.classList.add('hidden'); else levelPickResult.classList.remove('hidden');
    if (kLock) resultBox.classList.add('is-locked'); else resultBox.classList.remove('is-locked');
    if (kHidden) resultWrap.classList.add('hidden'); else resultWrap.classList.remove('hidden');
    return out;
  }

  function resultProbe() {
    return still(function () {
      var keep = resultWrap.classList.contains('hidden');
      var keepScore = resultScore.innerHTML, keepSay = resultSay.textContent;
      /* ★★ いちばん 長く なる 文で 測ります（★同じ 点の ロボットが 2人 いる とき）――
         ★ ★T165 判断5 で ひとことが 長く なった ので、★箱の たけも 長い 側で 測り直します。 */
      resultSay.textContent = SAY_LOSE.replace('{名前}', 'ロボット1と ロボット3');
      resultScore.innerHTML = scoreRows([13, 26, 0, 13], [99, 52, 41, 66]);
      levelPickResult.classList.remove('hidden');
      resultWrap.classList.remove('hidden');
      var box = resultBox.getBoundingClientRect();
      var st = stageEl.getBoundingClientRect();
      var meTop = st.top + geo.meTop;
      var ov = Math.max(0, Math.round(box.bottom - meTop));
      var max = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--result-max'), 10) || 0;
      var m = measureOnce();
      if (keep) resultWrap.classList.add('hidden');
      levelPickResult.classList.add('hidden');
      resultScore.innerHTML = keepScore;
      resultSay.textContent = keepSay;
      return { h: Math.round(box.height), max: max, over: ov, off: m.off, small: m.small,
               offName: m.offName };
    });
  }

  /* ★★ つよさの えらび（★2か所）が ちゃんと 押せるか ★★ */
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
      }], ['終わった あとの 画面', $('levelResult'), function () {
        titleScreen.classList.add('hidden'); playScreen.classList.remove('hidden');
        levelPickResult.classList.remove('hidden'); resultWrap.classList.remove('hidden');
      }]];
      spots.forEach(function (sp) {
        sp[2]();
        void document.body.offsetWidth;
        var el = sp[1];
        out.rows++;
        /* ★ 人が 本当に 動かせる 入れ物だけを 動かして 測る（★ページワン T160 の 決まり）*/
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

  /* ============================================================
     ★★★ verify ―― この 1本ならではの 見張り ★★★
     ------------------------------------------------------------
       ①  決まりの 通り（反則0・点の 合計が いつも 26・手番 いつも 52・13回 ちょうど・終わらない 0）
       ②  ★★ルル失敗1 の 直しが **生きて いる**（★わざと 外したら 出る ことも 見る）
       ③  ★★つよさ 3段が 本当に はしごに なって いる（★わざと 弱い ものが 1つも ない）
       ④  ★★強調は その ときどき 1種類 ―― ★光り 0個／★わくと 暗いのが 同時に 出ない
       ⑤  ★★暗くするのは「出す とき・自分の 番・自分の 手札・出せない 札」だけ（★本物の refreshDim）
       ⑥  ★★勝手に 出さない・勝手に わたさない（★行を 走査）
       ⑦  ★選ばせるのは **つよさ 1つだけ**（★<select> 2か所・中身は 同じ 3段）
       ⑧  ★寸法が 表どおり（★320×568 を 必ず 含む）
       ⑨  ★先読み 53枚・白い 札 0枚・JOKER を 読まない・裏面が 先頭
       ⑩  ★操作は pointer（click では ない）＋ はなすまで 決まらない
       ⑪  ★結果の 箱が 手札に かぶらない・中の ボタンが 画面の 中
       ⑫  ★言っては いけない 言葉が 無い（★「シュートザムーン」「累計」を 含む）
       ⑬  ★★手札 13枚 ―― ★1枚ずつ まん中を さして その 札が 返るか
       ⑭  ★★★人が さわれるか ―― ★★「押せる ものが 1つも ない」場面が 作れないか
       ⑮  ★つよさの えらびが 2か所とも 押せる（★44px・画面の 中）
       ⑯  ★★★押して・すべらせて・はなす ―― ★★指の くっつきを 本物の 道で 通す
       ⑰  ★★出なかった ときの 返事 ―― ★★すべって 外したら「ぷるっ」と 返すか
       ⑱  ★★しまう／続きから が 本当に 効くか（★書いて・読んで・消す）
       ⑲  ★★★線を こえて いないか ―― ★おすすめ 0・「誰が 取るか」0・札の 上の 文字 0
       ⑳  ★★★勝ち負けの 画面が「誰が 勝ったか」を 言う ―― ★でも「なぜ 勝ったか」は 言わない
       ㉑  ★★★点の 帯 ―― ★字が 画面に つれて 大きく なる／名前が 切れない／台から 借りすぎない
     ============================================================ */
  function verify(n) {
    n = n || 2000;
    var ng = [], t0 = Date.now(), note = {};
    var L = C.LEVELS;

    /* ① 決まりの 通り（★3段 ぜんぶ）*/
    var tot = { illegal: 0, badTot: 0, badPly: 0, badTrick: 0, nofin: 0 }, txt = [];
    for (var li = 0; li < L.length; li++) {
      var st = C.runMany(n, 31337, [L[li].o, L[li].o, L[li].o, L[li].o], null, 'deal');
      tot.illegal += st.illegal; tot.badTot += st.badTot; tot.badPly += st.badPly; tot.badTrick += st.badTrick;
      txt.push(L[li].label + ' ぜんぶ取り ' + (st.moon / st.games * 100).toFixed(2) + '%');
    }
    var stm = C.runMany(Math.max(200, Math.round(n / 8)), 4649, [C.HUMANS[3].o, L[2].o, L[2].o, L[2].o], null, 'match');
    tot.nofin += stm.nofin; tot.illegal += stm.illegal; tot.badTot += stm.badTot; tot.badPly += stm.badPly;
    if (tot.illegal) ng.push('★★反則の 手が ' + tot.illegal + '件');
    if (tot.badTot) ng.push('★★点の 合計が 26で ない 回が ' + tot.badTot + '件');
    if (tot.badPly) ng.push('★★手番が 52で ない 回が ' + tot.badPly + '件');
    if (tot.badTrick) ng.push('★13回で ない 回が ' + tot.badTrick + '件');
    if (tot.nofin) ng.push('★★★終わらない 勝負が ' + tot.nofin + '件（★0件で なければ なりません）');
    note['① ' + (n * 3) + '回 ＋ ' + stm.games + '勝負'] = txt.join('／') +
      '／★配った 回数 まん中 ' + C.pct(stm.dealList, 0.5) + '回・9割 ' + C.pct(stm.dealList, 0.9) + '回';

    /* ============================================================
       ② ★★★ルル T164 §15 失敗1 の 直しが 生きて いるか ★★★
       ★ ①だけだと ―― ★直しを まるごと 外しても、たまたま 出なければ 通ります（T144 §7-4）。
       ★ ★だから ★**わざと 外して、ちゃんと 戻る ことも 見ます。**
       ★ ★moonGuard を 外すと ―― ★★「取るほうが 勝ち」と 思って いる 人が 急に 強く なる はず。
       ============================================================ */
    var take = C.HUMANS[4].o, bot = L[2].o;
    var m = Math.max(2000, n);
    var on = C.runMany(m, 135791, [take, bot, bot, bot], null, 'deal');
    C.LIM.GUARD = 0;
    var off = C.runMany(m, 135791, [take, bot, bot, bot], null, 'deal');
    C.LIM.GUARD = 1;
    var onP = on.win / on.games * 100, offP = off.win / off.games * 100;
    if (!(offP > onP + 10)) {
      ng.push('★★★「ひとりに 全部 取らせない」を 外しても 何も 変わらなかった ―― ' +
              '★試し方が おかしい か、★直しが 別の 所に あります（あり ' + onP.toFixed(2) + '% ／ 外し ' + offP.toFixed(2) + '%）');
    }
    if (onP > 25) {
      ng.push('★★★「取るほうが 勝ち」と 思って いる 人が ' + onP.toFixed(2) + '% ―― ' +
              '★★ルル T164 §15 失敗1 と 同じ 表に なって います');
    }
    if (C.LIM.GUARD !== 1) ng.push('★見張りが 直しを 外した まま 戻して いない');
    note['② ルル失敗1'] = '「取るほうが 勝ち」と 思う人 … ★直しあり ' + onP.toFixed(2) +
                          '% → ★外すと ' + offP.toFixed(2) + '%（各' + m + '回・同じ 種）';

    /* ============================================================
       ③ ★★つよさ 3段が 本当に はしごに なって いるか ★★
       ★ ★T149 失敗3・設計図が 5回 落とした 壁：★「わざと 弱くする」は 作らない。
       ★ ★3段 とも「知って いる ことが ちがう」だけ ―― ★だから 順に 強く なる はず。
       ★ ★そして ★**中身に「わざと 外す」行が 無い** ことも 走査します。
       ============================================================ */
    var ladder = [], k;
    for (k = 0; k < L.length; k++) {
      var s3 = C.runMany(Math.max(1500, Math.round(n * 0.75)), 555001,
                         [C.HUMANS[3].o, L[k].o, L[k].o, L[k].o], null, 'deal');
      ladder.push(s3.win / s3.games * 100);
    }
    for (k = 1; k < ladder.length; k++) {
      if (!(ladder[k] < ladder[k - 1] - 1)) {
        ng.push('★★つよさが はしごに なって いない：' + L[k - 1].label + ' ' + ladder[k - 1].toFixed(1) +
                '% → ' + L[k].label + ' ' + ladder[k].toFixed(1) + '%');
      }
    }
    var lvSrc = JSON.stringify(C.LEVELS);
    if (/waste|throw|blunder|worse|handicap|weaken/i.test(lvSrc)) {
      ng.push('★★つよさの 中に「わざと 弱くする」らしい 名前が ある：' + lvSrc);
    }
    var playSrc = String(C.pickPlay);
    if (/Math\.random/.test(playSrc)) ng.push('★core が 種の 無い さいころを 使って いる');
    note['③ つよさ 3段'] = L.map(function (x, i) { return x.label + ' ' + ladder[i].toFixed(1) + '%'; }).join('　') +
                           '（★気づく人から 見た 勝率。★下がって いれば はしご）';

    /* ============================================================
       ④ ★★強調は その ときどき 1種類まで（設計図 §5.5）★★
       ============================================================ */
    var css = cssRulesText();
    var lit = document.querySelectorAll('.is-win,.is-hint,.is-glow,.is-here,.is-ok,.is-edge,.is-take,.is-lead');
    if (lit.length) ng.push('★光って いる ものが ' + lit.length + '個 ある');
    var litSrc = String(placeAll) + '\n' + String(putAt) + '\n' + String(refreshDim) + '\n' +
                 String(refreshPick) + '\n' + String(makeCard) + '\n' + String(faceUp) + '\n' +
                 String(botStep) + '\n' + String(doTake) + '\n' + String(turnStart) + '\n' + String(layout);
    var litAdd = litSrc.match(/is-win|is-hint|is-glow|is-here|is-ok|is-edge|is-take|is-lead/g);
    if (litAdd) ng.push('★★遊びの 情報を 出す 光りを 付ける 行が ある：' + litAdd.join('・'));
    var litCss = css.match(/\.is-(win|hint|glow|here|ok|edge|take|lead)\b/g);
    if (litCss) ng.push('★★遊びの 情報を 出す 光りの 決まりが CSS に ある：' + litCss.join('・'));
    /* ★★ 札に「ぼかしの 影」＝ 光り を 書いて いないか ★★
       ⚠️★ 文字の かたちでは 見ません ―― ★ブラウザは box-shadow を 書きなおして 返す ので
          ★★色が 先頭に 来て、文字あわせでは 当たりません（★ページワン T152 の 失敗）。
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
    if (!/\.card\.is-dim(?![\w-])/.test(css)) ng.push('★★「出せない 札を 暗くする」決まりが CSS に 1行も 無い');
    if (!/\.card\.is-pick(?![\w-])/.test(css)) ng.push('★★「選んだ 3枚に わく」決まりが CSS に 1行も 無い');
    var bad4 = css.match(/\.(card|cards|zone)[^{,]*:hover/g);
    if (bad4) ng.push('★札の 部品に 指を 置くと 変わる 決まりが ある：' + bad4.join('・'));
    /* ★★ わくと 暗いのが **同時に 出ない** ことを 本物で 数える */
    var mp = markProbe();
    for (var i4 = 0; i4 < mp.why.length; i4++) ng.push(mp.why[i4]);
    if (mp.ok) {
      if (mp.passPick !== 2) ng.push('★★わたす とき、選んだ わくが ' + mp.passPick + '枚（★2枚 の はず）');
      if (mp.passDim !== 0) ng.push('★★★わたす ときに 暗い 札が ' + mp.passDim + '枚 ある（★強調が 2種類に なって います）');
      if (mp.playPick !== 0) ng.push('★★★出す ときに わくの 札が ' + mp.playPick + '枚 ある（★強調が 2種類に なって います）');
      if (mp.playDim === 0) ng.push('★★出す ときに 暗い 札が 1枚も ない（★試し方が おかしい／★機能が 死んで いる）');
    }
    note['④ 強調'] = '光り ' + lit.length + '個／★わたす とき わく ' + mp.passPick + '・暗い ' + mp.passDim +
                     '／★出す とき わく ' + mp.playPick + '・暗い ' + mp.playDim;

    /* ⑤ ★★暗くするのは「出す とき・自分の 番・自分の 手札・出せない 札」だけ ★★ */
    var dp = dimProbe();
    /* ⚠️★ T168：★「試し方が おかしい」と「機能が 死んで いる」を **書き分けます**
       ―― ★トライ T166 §7-8 で、★前者を 後者として 鳴らして いました（★17回に 1回）。 */
    if (dp.noScene) ng.push('★★★暗くするを 試す 場面を 作れなかった（★試し方が おかしい ―― ★機能の 話では ありません）');
    else if (!dp.worked) ng.push('★★「暗くする」が 1枚も 効いて いない（★★機能が 死んで います）');
    if (dp.wrong) ng.push('★★暗い／明るいが 逆の 札が ' + dp.wrong + '枚 ある');
    if (dp.notMe) ng.push('★★自分の 手札 いがいが ' + dp.notMe + '枚 暗く なって いる');
    if (dp.botTurn) ng.push('★★ロボットの 番なのに ' + dp.botTurn + '枚 暗い');
    if (dp.busyOn) ng.push('★★動いて いる 途中なのに ' + dp.busyOn + '枚 暗い');
    if (dp.overOn) ng.push('★★終わった あとなのに ' + dp.overOn + '枚 暗い');
    if (dp.passOn) ng.push('★★わたす ときなのに ' + dp.passOn + '枚 暗い');
    note['⑤ 暗くする'] = '暗い ' + dp.onMe + '枚（ロボットの 番 ' + dp.botTurn + '・動作中 ' + dp.busyOn +
                        '・終わった あと ' + dp.overOn + '・わたす とき ' + dp.passOn + '・手札の 外 ' + dp.notMe + '）';

    /* ============================================================
       ⑥ ★★勝手に 出さない・勝手に わたさない（設計図 追記②④）★★
       ★ ★人の 番の 道すじに、★おすすめを 出す 行が 1つも 無いか。
       ============================================================ */
    var humanSrc = String(onUp) + '\n' + String(togglePick) + '\n' + String(doPassGo) + '\n' +
                   String(playHuman) + '\n' + String(refreshPick);
    var peek = humanSrc.match(/pickPass|dangerOf|moonWorth|bestPass/g);
    if (peek) ng.push('★★★人の わたす3枚に おすすめを 出して いる：' + peek.join('・'));
    if (/botPass\s*\(\s*g\s*,\s*0/.test(humanSrc)) ng.push('★★★人の ぶんを botPass で 決めて いる');
    if (/botIdx\s*\(\s*g\s*,\s*0/.test(humanSrc)) ng.push('★★★人の 出す 札を botIdx で 決めて いる');
    var players = [];
    [['botStep', botStep], ['turnStart', turnStart], ['afterPlay', afterPlay], ['doTake', doTake],
     ['newDeal', newDeal], ['placeAll', placeAll]].forEach(function (a) {
      if (/playIdx\s*\(\s*g\s*,\s*0/.test(String(a[1]))) players.push(a[0]);
    });
    if (players.length) ng.push('★★人の 札を 勝手に 出して いる 所が ある：' + players.join('・'));
    if (String(playHuman).indexOf('playIdx') < 0) ng.push('★playHuman が core を 通って いない');
    if (String(doPassGo).indexOf('picks') < 0) ng.push('★★doPassGo が 人の 選んだ 3枚を 使って いない');
    note['⑥ 勝手に しない'] = 'おすすめ ' + ((peek || []).length) + '件／人の 札を 勝手に 出す 所 ' + players.length + '件';

    /* ⑦ ★選ばせるのは つよさ 1つだけ */
    var sel = document.querySelectorAll('select');
    if (sel.length !== 2) ng.push('★<select> が ' + sel.length + '個（★つよさ 2か所 ＝ 2個 の はず）');
    var kinds = {};
    for (var s7 = 0; s7 < sel.length; s7++) kinds[sel[s7].options.length + ':' + (sel[s7].options[0] || {}).text] = 1;
    if (Object.keys(kinds).length !== 1) ng.push('★★2つの プルダウンの 中身が ちがう（★同じ つよさの はず）');
    if (sel.length && sel[0].options.length !== 3) ng.push('★つよさが ' + sel[0].options.length + '段（★3段 の はず）');
    var boxes = document.querySelectorAll('input[type="checkbox"],input[type="radio"],.preset,[data-preset]');
    if (boxes.length) ng.push('★★つよさ いがいの えらびが ' + boxes.length + '個 ある（★1つまで・設計図 追記①）');
    if (C.LEVEL_START < 0 || C.LEVEL_START >= C.LEVELS.length) ng.push('★初期値の つよさが おかしい');
    note['⑦ えらび'] = '<select> ' + sel.length + '個（★同じ 中身）／つよさ ' + C.LEVELS.length +
                       '段／初期値「' + C.LEVELS[C.LEVEL_START].label + '」／ほかの えらび ' + boxes.length + '個';

    /* ⑧ ★寸法 */
    /* ★ 表の 数は【実測】です。★ここを 直さずに 寸法を いじると、★★この 行が すぐ 鳴ります
       ―― ★実際に 1回 鳴らしました（★十字を 広げたら 横向きが 35→33px に なった・T165）。 */
    var want = [[980, 834, 100, '1000×900（★左右に 余白）'], [355, 601, 45, '375×667'],
                [300, 502, 38, '★320×568'], [792, 309, 33, '横向き 812×375']];
    var sizeTxt = [];
    for (var i8 = 0; i8 < want.length; i8++) {
      var fl = C.pickLayout(want[i8][0], want[i8][1]);
      sizeTxt.push(want[i8][3] + ' ' + fl.w + 'px（見え ' + fl.pitch.toFixed(1) + 'px）');
      if (fl.w !== want[i8][2]) ng.push('★寸法が ちがう（' + want[i8][3] + '：' + fl.w + 'px ／ 表 ' + want[i8][2] + 'px）');
      if (fl.pitch < C.FIT.PITCH_MIN - 0.05) ng.push('★★' + want[i8][3] + ' で 見えて いる はばが ' + fl.pitch.toFixed(1) + 'px（★21px 以上 の はず）');
      if (fl.pitch < fl.w * 0.5) ng.push('★★★' + want[i8][3] + ' で 札の まん中が かくれる（見え ' + fl.pitch.toFixed(1) + 'px ／ 札 ' + fl.w + 'px）');
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
    if (ALL_NAMES.length !== 53) ng.push('★読む 絵が ' + ALL_NAMES.length + '個（★53個 の はず）');
    if (ALL_NAMES.join(' ').indexOf('JOKER') >= 0) ng.push('★使わない JOKER を 読んで いる');
    if (ALL_NAMES[0] !== C.BACK_NAME) ng.push('★裏面を いちばん 先に 読んで いない');
    note['⑨ 先読み'] = '読めた ' + warmDone + '/' + ALL_NAMES.length + '／表向き ' + faceShown + '枚 中 白い 札 ' + white + '枚';

    /* ⑩ ★操作は pointer・はなすまで 決まらない */
    if (String(build).indexOf('pointerdown') < 0 || String(build).indexOf('pointerup') < 0) {
      ng.push('★pointer で 受けて いない');
    }
    if (String(onUp).indexOf('pressId') < 0) ng.push('★押した 札と はなした 札を くらべて いない');
    if (String(onUp).indexOf('hitAt(') < 0) ng.push('★★★onUp が はなした 点で 札を 引き直して いない（★hitAt が ない）');
    if (/var\s+t\s*=\s*e\.target/.test(String(onUp))) {
      ng.push('★★★onUp が e.target を 見て いる（★指では 押した 札の まま に なります）');
    }
    if (String(onDown).indexOf('playIdx') >= 0 || String(onDown).indexOf('togglePick') >= 0) {
      ng.push('★★指を 置いた 時点で 決まって いる（★はなすまで 決まらない はず）');
    }

    /* ⑪ ★結果の 箱 */
    var bx = resultProbe();
    if (bx.over) ng.push('★★結果の 箱が 手札に かぶって いる（' + bx.over + 'px）');
    if (bx.h > bx.max + 0.5) ng.push('★結果の 箱が 天井を こえて いる（' + bx.h + 'px ／ 天井 ' + bx.max + 'px）');
    if (bx.off) ng.push('★★結果の 箱の 中の 押す ところが ' + bx.off + '件 画面の 外：' + (bx.offName || []).join('・'));
    /* ★★★ T168・🟡-3 の 直し（★トライ T166 §5-3）★★★
       ⚠️★ ここは **私の 見張りの 穴** でした ―― ★★`resultProbe()` は `small`（44px割れ）を
          ★ずっと 返して いたのに、★★verify が **1行も 見て いません** でした。
       ★ ★トライの 実測：★結果の 箱の ボタンを 30px に しても ★★NG 0（★鳴らない）。
       ★ ★★44px は この会社の 決まりです。★数えた 数字を 捨てて いました。
       ★ ★T155 で「人が さわれるか」の 穴を ふさいだのと 同じ 形 です。 */
    if (bx.small) {
      ng.push('★★★結果の 箱の 中に 44pxより 小さい 押す ところが ' + bx.small + '件 ある（★会社の 決まり）');
    }
    note['⑪ 結果の 箱'] = bx.h + 'px（天井 ' + bx.max + 'px）／手札との かぶり ' + bx.over +
                          'px／画面外 ' + bx.off + '件／★44px割れ ' + bx.small + '件';

    /* ⑫ ★言葉（設計図 §9.6）*/
    var text = readableText(document.querySelector('.app-shell')) + ' ' +
               readableText(resultWrap) + ' ' + readableText($('helpDialog')) + ' ' + document.title;
    var NGW = ['スート', 'シュートザムーン', 'ムーン', 'トリック', 'リード', 'カード', 'ドロー', 'パス',
               'ターン', 'レベル', 'ジョーカー', 'JOKER', 'ms', 'ポイント', '％', '累計', '減点', 'マイナス'];
    var hitW = [];
    for (var i12 = 0; i12 < NGW.length; i12++) if (text.indexOf(NGW[i12]) >= 0) hitW.push(NGW[i12]);
    if (hitW.length) ng.push('★言っては いけない 言葉が ある：' + hitW.join('・'));
    /* ★★ 手を 教えて いないか ―― ★ハッピーが 言う ことば ぜんぶ を 見る（ルル §14-3）★★ */
    var sayAll = [];
    for (var k1 in SAY) if (SAY.hasOwnProperty(k1)) sayAll.push(SAY[k1]);
    sayAll.push(SAY_WIN, SAY_LOSE, SAY_DEAL_ME, SAY_DEAL_OT);
    var teach = teachHit(sayAll.join(' '));
    if (teach.length) ng.push('★★★ハッピーが 手を 教えて いる：' + teach.join('・'));
    var helpTeach = teachHit(readableText($('helpDialog')));
    if (helpTeach.length) ng.push('★★★あそびかたが 手を 教えて いる：' + helpTeach.join('・'));
    if (readableText(cardsEl).length) ng.push('★札の 上に 文字が ある（' + readableText(cardsEl).length + '文字）');
    note['⑫ 言葉'] = text.length + '文字／★手を 教える 言葉 ' + ((teach || []).length + (helpTeach || []).length) + '件';

    /* ⑬ ★★手札 13枚 ―― ★1枚ずつ さして 当たるか */
    var ft = fitTest(60);
    if (ft['★はみ出し（一番 大きい）'] !== '0px') ng.push('★★札が 器から ' + ft['★はみ出し（一番 大きい）'] + ' はみ出した');
    if (ft['★押す ところが 画面外'] !== '0件') ng.push('★★押す ところが 画面の 外に 出た：' + ft['★押す ところが 画面外']);
    if (ft['横スクロールが 出た場面']) ng.push('★横スクロールが ' + ft['横スクロールが 出た場面'] + '場面で 出た');
    if (ft['縦スクロールが 出た場面']) ng.push('★縦スクロールが ' + ft['縦スクロールが 出た場面'] + '場面で 出た');
    /* ★★★ T168・🟡-3 ―― ★fitTest も 44px割れを 数えて いたのに 見て いませんでした ★★★
       ★ ★トライの 実測：★上の 帯の「？ 遊び方」を 30px に すると ―― ★fitTest は **30件** と
         ★ちゃんと 数えて いたのに、★★verify は NG 0 でした。 */
    if (ft['★44pxより 小さい ボタン'] !== '0件') {
      ng.push('★★★44pxより 小さい 押す ところが ある：' + ft['★44pxより 小さい ボタン'] + '（★会社の 決まり）');
    }
    var hitTxt = ft['★★手札の まん中を さして 当たらなかった'];
    if (hitTxt && hitTxt.indexOf('0 /') !== 0) {
      ng.push('★★★手札の まん中を さして その 札が 返らなかった：' + hitTxt +
              '（★トライ T153 🟡-1 と 同じ こわれ方 です）');
    }
    note['⑬ 手札 13枚'] = '★札 ' + geo.cw + '×' + geo.ch + 'px（見え ' + geo.pitch.toFixed(1) + 'px ＝ ' +
                          (geo.pitch / geo.cw * 100).toFixed(0) + '%）／さして 当たらなかった ' + hitTxt +
                          '／はみ出し ' + ft['★はみ出し（一番 大きい）'];

    /* ⑭ ★★★人が さわれるか */
    var rp = reachProbe();
    if (!rp.cases) ng.push('★★「人が さわれるか」を 1場面も 作れなかった（★試し方が おかしい）');
    for (var i14 = 0; i14 < rp.why.length; i14++) ng.push('★★★人の 番なのに 進めない：' + rp.why[i14]);
    note['⑭ ★人が さわれるか'] = rp.cases + '場面 中 ★止まった ' + rp.dead + '場面／' + rp.detail.join('　');

    /* ⑮ ★つよさの えらびが 2か所とも 押せる ＋ ★★T171 🟡-1（1回 おわりにも 出るか）
       ★ ★winProbe は ⑳ でも 使うので、ここで 1回だけ 走らせて 使い回します。 */
    var wpEarly = winProbe();
    var lp = levelProbe();
    if (lp.ng.length) ng.push('★★つよさを えらべない 所が ある：' + lp.ng.join('・'));
    if (lp.small) ng.push('★つよさの えらびが 44px より 低い：' + lp.small + '件');
    /* ============================================================
       ★★★ T171・🟡-1 の 見張り（★トライ T170 の ご指摘）★★★
       ------------------------------------------------------------
       ⚠️★ トライ：★「★1回 おわりの 画面に つよさを 出す 直しは、★★元に 戻しても NG0」。
          ★ ★★＝ ★私が T168 で 入れた 直しが、★消えても 誰も 気づけない 状態 でした。
       ★ ★★これで **3回目** です（★T155 人がさわれるか・★T168 44px・★今回）。
          ★ ★★どれも 同じ 形 ―― ★★**「直した」だけで「見張って いない」。**
       ★ ★下は winProbe が 本物の showResult を 通して 数えた もの です。
          ★ ★★勝ち負けの 画面（lvFin）と 1回 おわりの 画面（lvMid）の **両方** を 見ます
            ―― ★★片方だけ だと「いつも 出す」「いつも 隠す」の どちらでも 通って しまいます。
       ============================================================ */
    if (wpEarly.lvFin !== 1) {
      ng.push('★★★勝ち負けの 画面に つよさが 出て いません（★負けた 人の 逃げ道が ありません）');
    }
    if (wpEarly.lvMid !== 1) {
      ng.push('★★★1回 おわりの 画面に つよさが 出て いません ―― ' +
              '★★これだと 13.7分に 1回しか 変えられず、★下げたい 人は はじめの 画面へ 行く ことに なります' +
              '（★★そこが T166 🔴-1 の 入口 でした）');
    }
    /* ★ 行の 目 ―― ★showResult が 「fin の ときだけ 出す」形に 戻って いないか */
    if (/levelPickResult\.classList\.add\(/.test(String(showResult))) {
      ng.push('★★★showResult が つよさを 隠す 行を 持って います（★1回 おわりでも 出す はず）');
    }
    note['⑮ つよさの えらび'] = '押せた ' + lp.ok + ' / ' + lp.rows + 'か所／44px 割れ ' + lp.small +
                                '件／★★出て いる：勝ち負け ' + (wpEarly.lvFin ? '○' : '★✕') +
                                '・1回 おわり ' + (wpEarly.lvMid ? '○' : '★✕');

    /* ⑯⑰ ★★★押して・すべらせて・はなす ＋ 出なかった ときの 返事 */
    var sp = slideProbe();
    for (var i16 = 0; i16 < sp.why.length; i16++) ng.push(sp.why[i16]);
    var upSrc = String(onUp), upCut = upSrc.indexOf("if (t.where !== 'me')");
    if (upCut < 0 || !/nope\s*\(/.test(upSrc.slice(0, upCut))) {
      ng.push('★★★onUp の「すべって 外した」ところに 返事が ない（★nope を 呼んで いません）');
    }
    if (!/nope\s*\(/.test(String(togglePick))) {
      ng.push('★★4枚目を 押した ときの 返事が ない（★togglePick が nope を 呼んで いません）');
    }
    note['⑯ ★すべらせて はなす'] = 'まっすぐ ' + sp.straight + '／★指で すべらせる ' + sp.stuck +
                                    '／マウスで すべらせる ' + sp.mouse;
    note['⑰ ★出なかった ときの 返事'] = 'まっすぐ 出た とき ' + sp.sayStraight +
                                    '／★★指で すべった とき ' + sp.say + '／マウスで すべった とき ' + sp.sayMouse;

    /* ============================================================
       ⑱ ★★しまう／続きから が 本当に 効くか（★書いて・読んで・消す）★★
       ★ ★アイの 心配ごと：★「12分は 長い。★途中で やめられて、続きから 開けるか」。
       ★ ★★数えるのでは なく **本物の save / load / clearSave を 通します**。
       ============================================================ */
    var kSave = null;
    try { kSave = localStorage.getItem(STORE); } catch (e) {}
    var s18 = { write: '―', read: '―', clear: '―', guard: '―' };
    var kMatch = match;
    try {
      match = C.newMatch(1); match.total = [7, 22, 13, 4]; match.dealNo = 3; match.over = false;
      save();
      var got = load();
      s18.write = (got && got.t.join(',') === '7,22,13,4' && got.d === 3) ? '○ しまえた' : '★★✕ しまえない';
      if (s18.write !== '○ しまえた') ng.push('★★★1回 おわりの 合計を しまえて いない（★続きから が 効きません）');
      s18.read = (got && got.lv === 1) ? '○ つよさも 覚えた' : '★✕ つよさを 覚えて いない';
      if (!got || got.lv !== 1) ng.push('★つよさを 覚えて いない');
      /* ★ 終わった 勝負は しまわない（★次に 開いた とき 続きが 出ない）*/
      match.over = true; save();
      s18.clear = load() ? '★★✕ 消えない' : '○ 終わったら 消える';
      if (load()) ng.push('★★終わった 勝負の 続きが 残って いる');
      /* ★ こわれた 中身を 読んでも 落ちないか */
      try { localStorage.setItem(STORE, '{"t":[1,2],"d":"x"}'); } catch (e) {}
      s18.guard = load() ? '★★✕ こわれた 中身を 受けて しまう' : '○ こわれた 中身は 受けない';
      if (load()) ng.push('★★こわれた 中身を そのまま 読んで います');

      /* ============================================================
         ★★★ T168・🔴-1 の 見張り ―― ★★トライの 再現手順を そのまま 通します ★★★
         ------------------------------------------------------------
         ★ トライ T166 §4-1：
           ★ ①1回以上 配り終える → ②閉じる → ③「つづきから」が 出る
           ★ ★★④**はじめの 画面で つよさを さわる** → ⑤押すと **0点から** 始まる
         ★ ★ここでは ④を **本物の setLevel** で 通します（★はじめの 画面と 同じ 形 ――
           ★★`match` は まっさらな もの）。★★合計が 生き残って いれば ○。
         ★ ★くらべも 置きます ―― ★★遊んで いる 最中（match が 生きて いる）の setLevel は
           ★★ちゃんと つよさを 書きかえる こと。★★これが 無いと「何も しない」でも 通ります。
         ============================================================ */
      try { localStorage.setItem(STORE, JSON.stringify({ t: [12, 48, 33, 27], d: 5, lv: 0 })); } catch (e) {}
      match = C.newMatch(0);                       /* ★ ＝ はじめの 画面の まっさらな match */
      setLevel(1);
      var af = load();
      s18.keep = (af && af.t.join(',') === '12,48,33,27' && af.d === 5)
        ? '○ 続きが のこる' : '★★✕ 続きが 消えた';
      if (!af || af.t.join(',') !== '12,48,33,27' || af.d !== 5) {
        ng.push('★★★はじめの 画面で つよさを さわったら、しまって ある 続きが 消えました' +
                '（★しまって ある 中身 ' + JSON.stringify(af) + ' ／ ★12,48,33,27・5回 の はず）' +
                '―― ★★トライ T166 🔴-1 と 同じ こわれ方 です');
      }
      s18.keepLv = (af && af.lv === 1) ? '○ つよさは 変わる' : '★★✕ つよさが 変わらない';
      if (!af || af.lv !== 1) {
        ng.push('★★つよさを さわっても しまって ある つよさが 変わらない（★試し方が おかしい か、何も して いません）');
      }
      /* ★ くらべ ―― ★遊んで いる 最中（合計が 生きて いる）なら ふつうに しまえる */
      match = C.newMatch(0); match.total = [12, 48, 33, 27]; match.dealNo = 5;
      setLevel(2);
      var af2 = load();
      s18.mid = (af2 && af2.t.join(',') === '12,48,33,27' && af2.lv === 2) ? '○' : '★✕';
      if (!af2 || af2.t.join(',') !== '12,48,33,27' || af2.lv !== 2) {
        ng.push('★★遊んで いる 最中に つよさを さわったら おかしく なった：' + JSON.stringify(af2));
      }
      /* ★★ 🟡-4 ―― ★おかしい つよさ（lv）を 受けても 止まらないか（★トライ T166 §5-3）*/
      try { localStorage.setItem(STORE, JSON.stringify({ t: [99, 1, 1, 1], d: 2, lv: 9 })); } catch (e) {}
      var af3 = load();
      s18.badLv = (af3 && af3.lv >= 0 && af3.lv < C.LEVELS.length) ? '○ まるめる' : '★★✕ そのまま 通す';
      if (!af3 || !(af3.lv >= 0 && af3.lv < C.LEVELS.length)) {
        ng.push('★★★おかしい つよさ（lv:9）を そのまま 受けて います ―― ' +
                '★★トライ T166 🟡-4：★「わたす ▶」で 止まります');
      }
      /* ★ 中を 通しても 落ちないか（★levelNow が 2枚目の 守り）*/
      match = C.newMatch(0); match.level = 9;
      if (!levelNow() || !levelNow().o) {
        ng.push('★★★おかしい つよさで levelNow が 使えない（★doPassGo が 止まります）');
      }
      s18.now = (levelNow() && levelNow().o) ? '○ 落ちない' : '★★✕ 落ちる';
    } catch (e) {
      ng.push('★★しまう 仕組みで つまずいた：' + e.message);
    }
    match = kMatch;
    try { if (kSave === null) localStorage.removeItem(STORE); else localStorage.setItem(STORE, kSave); } catch (e) {}
    if (match) { $('levelTitle').value = String(match.level); $('levelResult').value = String(match.level); }
    refreshResume();
    note['⑱ しまう／続きから'] = s18.write + '／' + s18.read + '／' + s18.clear + '／' + s18.guard +
                                 '／★★つよさを さわっても ' + s18.keep + '（' + s18.keepLv + '）' +
                                 '／★最中 ' + s18.mid + '／★おかしい つよさ ' + s18.badLv + '・' + s18.now;

    /* ⑲ ★★★線を こえて いないか */
    var lnp = lineProbe();
    for (var i19 = 0; i19 < lnp.why.length; i19++) ng.push(lnp.why[i19]);
    /* ★ 行の 目 ―― ★「誰が 取るか」を 出す 名前の 関数・変数が 画面側に 無いか */
    var renderSrc = litSrc + '\n' + String(scoreRows) + '\n' + String(renderScore) + '\n' + String(spotOf);
    var peek19 = renderSrc.match(/takeTrick\s*\(|winnerNow|whoTakes|leaderOf|currentWinner/g);
    if (peek19) {
      var bad19 = peek19.filter(function (x) { return x.indexOf('takeTrick') < 0; });
      if (bad19.length) ng.push('★★★「いま 誰が 取るか」を 出して いる 行が ある：' + bad19.join('・'));
    }
    note['⑲ ★★線'] = '★わたす 場面の 印 ' + lnp.passMarks + '個／★場に 3枚の ときの 印 ' + lnp.trickMarks +
                      '個／★札の 上の 文字「' + (lnp.trickWords || '') + '」／★暗い のは ' + lnp.trickDim;

    /* ============================================================
       ⑳ ★★★勝ち負けの 画面が「誰が 勝ったか」を 言って いるか（★社長裁定 T165 判断5）★★★
       ★ ★動きの 目（本物の showResult を 4通り）＋ ★行の 目（2つ）―― ★T157 §4 と 同じ 作法。
       ============================================================ */
    var wp = wpEarly;                       /* ★ ⑮ で 走らせた もの（★2回 走らせない）*/
    for (var i20 = 0; i20 < wp.why.length; i20++) ng.push(wp.why[i20]);
    /* ★ 行の 目 ① ―― ★ひとことに 名前を 入れる 場所（{名前}）が あるか */
    if (SAY_WIN.indexOf('{名前}') < 0 || SAY_LOSE.indexOf('{名前}') < 0) {
      ng.push('★★★勝ち負けの ひとことに「誰が 勝ったか」を 入れる 場所（{名前}）が ありません');
    }
    /* ★ 行の 目 ② ―― ★showResult が 本当に 名前を 入れて いるか */
    if (String(showResult).indexOf('winnerText') < 0) {
      ng.push('★★★showResult が 勝った 人の 名前を 入れて いない（★winnerText を 呼んで いません）');
    }
    /* ★ 行の 目 ③ ―― ★名前を 作る ところに 点数が 混ざって いないか（★「なぜ」を 言わない）*/
    if (/total|taken|score|点/.test(String(winnerText))) {
      ng.push('★★★勝った 人の 名前に 点数が 混ざって います（★合計の 表の 言い直し ＝ §5.5）');
    }
    note['⑳ ★★誰が 勝ったか'] = wp.cases.join('　') + '／★くらべ 1回 おわり「' + wp.mid + '」';

    /* ============================================================
       ㉑ ★★★点の 帯 ―― ★字が 画面に つれて 大きく なるか（★社長の 決め・T171）★★★
       ------------------------------------------------------------
       ★ トライ T166 §7-2：★★「9.5px／10.5px。★★1280pxでも 大きく なりません」。
         ★ ★正体は CSS の **決め打ち**（`font-size:10.5px`）でした。
       ★ ★★だから 見張りも「字が 何px か」だけ 見ては いけません ――
         ★ ★★**「その 画面で 出せる いちばん 大きい 字に なって いるか」**を 見ます。
       ★ ★4つの 目：
         ★ ★① ★帯の たけが 決まりどおり か（★＝ 余って いる ぶんだけ 太る）
         ★ ★② ★★中身が 帯から はみ出して いないか（★字を 大きく しすぎて いないか）
         ★ ★③ ★★「ロボット1」が 切れて いないか（★★字を 大きく した ときの いちばんの 心配）
         ★ ★④ ★★十字が 台に 入って いるか（★★台から 借りすぎて いないか）
       ★ ★★そして ⑤番目 ―― ★CSS に `font-size` の 決め打ちが 戻って いないか（★元の 原因）。
       ============================================================ */
    var sb21 = still(function () {
      var b = scoreBand, i, cut = [], q;
      var names = b.querySelectorAll('.sb-name');
      for (i = 0; i < names.length; i++) {
        if (names[i].scrollWidth > names[i].clientWidth + 0.5) cut.push(names[i].textContent);
      }
      q = b.getBoundingClientRect();
      var numF = parseFloat(getComputedStyle(b).fontSize) || 0;
      var nameF = names.length ? (parseFloat(getComputedStyle(names[0]).fontSize) || 0) : 0;
      return { h: Math.round(q.height), inner: b.scrollHeight, numF: numF, nameF: nameF,
               cut: cut, n: names.length };
    });
    var wantH21 = Math.max(geo.scoreMin, Math.min(geo.scoreWant, geo.scoreRoom));
    if (geo.scoreH !== wantH21) {
      ng.push('★★帯の たけが 決まりと ちがう（' + geo.scoreH + 'px ／ ' + wantH21 + 'px の はず）');
    }
    if (sb21.inner > sb21.h + 1) {
      ng.push('★★★点の 帯から 中身が はみ出して います（★中身 ' + sb21.inner + 'px ／ 帯 ' + sb21.h + 'px）');
    }
    if (sb21.cut.length) {
      ng.push('★★★点の 帯の 名前が 切れて います：' + sb21.cut.join('・') + '（★字が 大きすぎます）');
    }
    if (sb21.n !== 4) ng.push('★点の 帯の 名前が ' + sb21.n + '個（★4個 の はず）');
    if (!(sb21.numF >= 11)) {
      ng.push('★★点の 帯の 数の 字が ' + sb21.numF + 'px（★11px 以上 の はず）');
    }
    /* ★★ ここが 芯 ―― ★★余って いる のに 字が 小さい ままなら 鳴らす */
    if (geo.scoreH >= 56 && sb21.numF < 15) {
      ng.push('★★★帯は ' + geo.scoreH + 'px あるのに 数の 字が ' + sb21.numF +
              'px しか ありません（★★トライ T166 §7-2「大きい 画面でも 大きく ならない」と 同じ）');
    }
    if (!(sb21.nameF < sb21.numF)) {
      ng.push('★点の 帯の 名前の 字が 数と 同じか 大きい（★読むのは 数の ほう です）');
    }
    /* ★ ④ 十字が 台に 入って いるか（★台から 借りすぎて いないか）*/
    if (geo.feltH < geo.feltBase) {
      ng.push('★★★台が 十字より 小さく なって います（★台 ' + geo.feltH + 'px ／ 十字が 入るには ' +
              geo.feltBase + 'px 要ります）');
    }
    /* ★ ⑤ CSS に font-size の 決め打ちが 戻って いないか（★これが 元の 原因）*/
    var sbCss = [];
    cssRuleList().forEach(function (r) {
      if (!/\.score-band/.test(r.sel)) return;
      var mm = r.text.match(/font-size:\s*([^;}]+)/);
      if (mm && mm[1].indexOf('var(') < 0) sbCss.push(r.sel + ' → ' + mm[1].trim());
    });
    if (sbCss.length) {
      ng.push('★★★点の 帯の 字が CSS で 決め打ちに なって います：' + sbCss.join('・') +
              '（★★これだと 大きい 画面で 育ちません ―― ★トライ T166 §7-2 の 元の 原因）');
    }
    note['㉑ ★★点の 帯'] = '帯 ' + geo.scoreH + 'px（★余り ' + geo.scoreRoom + 'px・下ばり ' + geo.scoreMin +
                          'px）／★数の 字 ' + sb21.numF + 'px・名前 ' + sb21.nameF + 'px／切れた 名前 ' +
                          sb21.cut.length + '件／台 ' + geo.feltH + 'px（★十字に 要る ' + geo.feltBase + 'px）';

    var out = {
      '★NG': ng.length, '中身': ng.length ? ng : 'ぜんぶ OK ✅',
      '画面': window.innerWidth + '×' + window.innerHeight,
      'かかった 時間': (Date.now() - t0) + 'ms'
    };
    for (var kk in note) if (note.hasOwnProperty(kk)) out[kk] = note[kk];
    console.log('[ハーツ] verify', out);
    return out;
  }

  root.HEARTS = {
    now: now, autoPlay: autoPlay, verify: verify, seed: seed, geo: geoInfo,
    fitTest: fitTest, rates: rates,
    /* ★ 中を のぞく ため（★トライ・アト用）*/
    _g: function () { return g; }, _match: function () { return match; }, _core: C,
    _probe: { dim: dimProbe, mark: markProbe, reach: reachProbe, slide: slideProbe,
              line: lineProbe, level: levelProbe, result: resultProbe, win: winProbe, handHit: handHit }
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
