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
  /* ★★★ T217 ―― ★ハートブレイクの 知らせ（★社長ご指示 2026-09-04）★★★
     ★ 社長：「★ハートブレイクしたら 盤面上部に 書いてほしい。
       ★『ハートブレイク：ハートが出せるようになった』みたいなのを」
     ★ ★言葉は §9.6 で 選び直しました（★「解禁」「以降」は 使えません）：
       ★ ★「ハートブレイク」＝ カタカナ（★社長が 名ざされた 言葉。★そのまま）
       ★ ★「出す」小1・「なった」かな ―― ★中学の 漢字は 1つも 入って いません。
     ⚠️★★ 追記② の 線：★これは **決まりの お知らせ** です。
        ★ ★「ハートを **出そう**」と 書いたら ―― ★★手の 教えに なり、線を 越えます。
        ★ ★「出せるように なった」＝ ★★何が できる ように なったかを 言うだけ。★どれを 出すかは 言いません。

     ★★★ T217-2 ―― ★★「が」→「から」に 直しました（★社長の お決め「A」・2026-09-04）★★★
        ★ ★★前：「ハートブレイク！ ハート**が** 出せるよ」
        ★ ★★後：「ハートブレイク！ ハート**から** 出せるよ」
        ★ ★なぜ ―― ★★決まり8 は `hearts-core.js` の `legalCards()` に 1か所だけ あり、
          ★ ★★`ctx.pos === 0`（★＝ その 回の **先に 出す 人**）の ときにしか 効きません。
          ★ ★★つまり ★ハートは ずっと 出せて いました。★出せなかったのは
            ★ ★★「★自分が **先に** ハートを 出す」ことだけ です。
          ★ ★★→ ★「ハートが 出せる」は ずれて いました。★「ハート**から** 出せる」＝
            ★ ★★先に 出す 側の 話だと 分かる 言い方 です。
        ★ ★★この 1行は、★★決まり8 を **ことばで 説明する この 1本で 唯一の 場所** です
          ★ ★（★いままでは 画面が 暗く なるだけ・説明 0行）。★★軽く 触らない こと。
        ★ ★★追記② の 線は 変わりません ―― ★「どれを 出すか」は 1文字も 言って いません。 */
  var SAY_BREAK = 'ハートブレイク！ ハートから 出せるよ';
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
  var passGuide, guideArrow, guideText;        /* ★ T214 ―― ★場に 出す わたす 案内 */
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

    /* ============================================================
       ★★★ T214 ―― ★「わたす ▶」ボタンを 台の 下ばしへ 下ろしました ★★★
       ------------------------------------------------------------
       ★ ★これまでは 台の **まん中**（cy − 24）に いました。★★そこに 案内を 出すと
         ★ 上に 残る すきまが ―― ★★320×480 で **43px**【計算】。★字は 12px までしか 上がらず、
         ★ ★★社長の ご指示「★場に **大きく**」を 通せません でした。
       ★ ★→ ★ボタンを 台の 下ばしへ。★★案内に 使える たけが 【計算】
         ★ ★320×568 **43 → 111px** ／ 320×480 **43 → 97px** ／ 横向き 812×375 **30 → 66px**。
       ★ ★★台の 中から 1pxも 出ません（★どちらも みどりの 上です）。
       ★ ★おまけ：★ボタンが 手札に 近づく ので、★スマホでは 親指が 届きやすく なります。
       ⚠️★ ★台が うんと 低い ときは、★案内に 22px だけ 残して 止めます（★下の Math.max）。
       ============================================================ */
    var feltInset = geo.feltBd + geo.feltPad + geo.feltIn + 4;
    geo.feltInset = feltInset;
    geo.passTop = Math.max(feltTop + feltInset + 22, feltTop + feltH - feltInset - 48);

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
         ★ ★台の 上ばしの y は 札の たけで 決まる ので、★★CSS だけでは 書けません。

       ✅★★★ T221（2026-09-04・💻コーダ）―― ★★下の 1行は **3か所の うちの ②** です ★★★
         ★ ★★同じ 文が 3か所に あります（★★どれか 1つでも ちがうと 事故に なります）：
           ★ ★① `hearts.css` 336行 `.talk` の @media（★帯を 浮かせる）
           ★ ★★② ここ（★浮いた ふきだしの 置き場所）
           ★ ★③ 下の 見張り ㉕ の `r25.flat`（★「横向きか」の 判じ）
         ★ ★★★①だけ 直すと ③が「ふきだしが 戻って いません」と **うそを 鳴らします**
           ★ ★（★アト T220-2 実測・6画面で 2件ずつ）。★→ ★**3か所 いっしょに 直す**。
         ★ ★★見張り ㉟ が この 文を **まるごと 鍵**に して います ―― ★1文字でも ずらすと 鳴ります。 */
    var flat = window.matchMedia && window.matchMedia('(max-height:420px), (max-height:479px) and (min-width:568px)').matches;
    if (sayEl) sayEl.style.top = flat ? geo.feltTop + 'px' : '';
    /* ★★ わたす ボタンは 台の 下ばし（★上は 案内に あけます・T214。★measure の geo.passTop）*/
    if (passGo) passGo.style.top = geo.passTop + 'px';
    refreshGuide();                                  /* ★ T214 ―― ★大きさも 場所も 測り直す */
    if (breakOn()) paintBreak();                     /* ★ T217 ―― ★出て いる 間は 場所も 測り直す */

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

  /* ============================================================
     ★★★ T214-① ―― ★手札を いつも「マーク → 数字」に そろえる（★社長ご指示）★★★
     ------------------------------------------------------------
     ★ ★社長：「★ハーツは 手持ちの札が バラバラなので、わかりやすく 並び替えてください。
       ★★一番左が2。一番右がA。★マークの並びは 任せます。」

     ★★ 数字の 並び ―― ★★社長の 名ざしの とおり **2 が いちばん 左・A が いちばん 右**。
       ★ ★core の `rk()`（★2=2 … 10=10, J=11, Q=12, K=13, A=14）を そのまま 使います。
       ★ ★★＝ ★★★「強い ほど 右」でも あります（★ハーツは A が いちばん 強い）。
       ⚠️★ ★セブンブリッジ（T203）は **A→K**（★A が 左）です。★ここだけ ちがいます ――
          ★ ★社長が この 1本で 名ざされた から です。★合わせに 行きません。

     ★★ マークの 並び ―― ★★**クローバー → ダイヤ → スペード → ハート**（♣ ♦ ♠ ♥）★★
       ★ ★理由は 1つ だけ です ―― ★★**色が 交ごに なる（黒 赤 黒 赤）**。
         ★ ★手札 13枚は 重ねて 並ぶ ので、★1枚あたり **22.3px しか 見えません**
           【実測・320×568・札 39px の 57%】。★見えて いるのは 左はしの 角 ―― ★数字と マーク だけ。
         ★ ★★そこで 赤と 赤（ダイヤ と ハート）が となり合うと、★★どこで マークが 変わったかが
           ★ 見た目で 分かりません。★色が 交ごなら、★★**色が 変わる ところ＝マークの 切れ目**。
       ★ ★セブンブリッジは ♣♦♥♠ で、★★ダイヤと ハートが となり合って います。
         ★ ★★合わせませんでした。★★「そろえる」より「読める」を 取りました。
       ★ ★もう1つ おまけ：★点に なる ハートが いちばん 右に 固まります ―― ★ハートしばりで
         ★ 暗く なるのも 右の かたまり。★★とびとびに 暗く なりません。

     ★★★ 設計図 追記②（★「気づく」を 先に 奪わない）に 当たるか ―― ★★当たりません ★★★
       ★ ★設計図 追記② の 表：★「肩代わりして よい ＝ ★**札を きれいに 並べる**・数える・裏返す」。
         ★ ★★名ざしで 入って います。★ルル T173 §2-3 も 同じ 判定（★セブンブリッジ T203）。
       ★ ★★決め手は これ です ―― ★★**どの 札が どこに 来るかが、中身に よらず 決まって います。**
         ★ ★「そこに 遊びが ある」ことを 1文字も 教えて いません。
         ★ ★★★もし「わたすと よい 3枚を 左に 寄せる」なら ―― ★★それは わたす3枚の
           ★おすすめ（★ルル §14-2・14.7ポイント）で、★★はっきり 違反です。★やって いません。
       ★ ★★スペードの Q が 見つけやすく なるのは その とおり です。★でも 見つけた あとに
         ★ **「いつ 手放すか」**が この 1本の 遊び で、★そこは 1ミリも 変えて いません。

     ⚠️★★ ここは `placeAll` の 1行目 から 呼びます ―― ★★**画面を 描く たび** です。
        ★ ★「配った 直後だけ そろえる」だと、★★もらった 直後・出した あとで 崩れます
          （★社長の ご心配 その1）。★★描く たびに そろえれば 崩れようが ありません。
        ★ ★verify ㉒ が 5つの 場面（配った直後／3枚えらんだ後／もらった直後／出した後／取った後）で
          ★ ★★**並びと、画面の 左右の 位置の 両方**を 数えます。
     ============================================================ */
  var HAND_SUIT_ORDER = [C.CLUB, C.DIAM, C.SPADE, C.HEART];      /* ★ ♣ → ♦ → ♠ → ♥ */
  var SUIT_AT = (function () {
    var m = [], i;
    for (i = 0; i < HAND_SUIT_ORDER.length; i++) m[HAND_SUIT_ORDER[i]] = i;
    return m;
  })();
  function handKey(c) { return SUIT_AT[C.suitOf(c)] * 100 + C.rk(c); }   /* ★ rk … 2〜14（A=14）*/
  function sortMine() {
    if (!g || !g.hands || !g.hands[0]) return;
    g.hands[0].sort(function (a, b) { return handKey(a.c) - handKey(b.c); });
  }

  function placeAll(instant) {
    if (!g) return;
    sortMine();                                     /* ★★ T214-① ―― ★描く たびに そろえる */
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
    refreshGuide();                                 /* ★ T214-② ―― ★描く たびに 出す／消す */
    if (breakOn()) paintBreak();                    /* ★ T217 */
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

  /* ============================================================
     ★★★ T214-② ―― ★場に 出す「わたす 案内」（★社長ご指示）★★★
     ------------------------------------------------------------
     ★ ★社長：「★最初の 画面、★ハッピーが『3枚選んで 左の人に 渡そう！』と 言って くれて
       ★いるけど、★★一瞬 わからなかったので、★★場に 大きく 同じ文章を 書いて、
       ★★さらに 渡す相手を 矢印で わかりやすく してください。
       ★★添付画像の 場合だと『←トランプを3枚選んで渡す』。★ロボット2に 渡す場合は
       ★『↑トランプを3枚選んで渡す』みたいなのを 場に 大きく 表示してほしい。」

     ★★★ まず 数えました ―― ★★わたす 向きは **4通り** です ★★★
       ★ ★`hearts-core.js` の `PASS_DIRS`（★1回ごとに 回ります・本物の ハーツ）：
         | ★何回目 | ★core の d | ★わたす 先 | ★その 席は 画面の どこ | ★矢印 |
         |---|---|---|---|---|
         | 1回目 | 1 | 左の 人   | ★ロボット1（★台の 左）  | ★**←** |
         | 2回目 | 3 | 右の 人   | ★ロボット3（★台の 右）  | ★**→** |
         | 3回目 | 2 | 向かいの 人 | ★ロボット2（★台の 上） | ★**↑** |
         | 4回目 | 0 | ★★わたさない | ―                    | ★★（出しません）|
       ★ ★★4通り目は「わたさない」です ―― ★`makeGame` が `passDir` 0 の ときは
         ★ ★★**わたす 場面を 作らず、そのまま 出す 場面**に します（core の 497行目）。
         ★ ★★＝ ★えらぶ ことが 無いので、★案内も 出しません。★★出したら 逆に うそ です。
       ★ ★★5回目は また 1回目に 戻ります（`dealNo % 4`）。

     ★★★ 文は **1か所から** 出します（★社長の ご心配 その2）★★★
       ★ ★ハッピーの ひとことも、★場の 案内も ―― ★★どちらも 下の `passSay()` を 呼びます。
         ★ ★★文字列を 2つ 持ちません。★★だから ずれようが ありません。
       ★ ★verify ㉓ が「★本物の newDeal を 通して、★2か所の 字が 1文字ちがわず 同じか」を 数えます。

     ⚠️★★★ 見た目は **仮** です（★社長の ご指示・境目）★★★
        ★ ★`hearts.css` は アトの もちものなので **1行も さわって いません**。
        ★ ★下の `GUIDE_LOOK` は「とりあえず 読める 形」―― ★★大きさ・色・かげは アトが 決めます。
        ★ ★★アトへ：★`GUIDE_LOOK` の 1かたまりを CSS へ 移して、★ここを 空に すれば 済みます
          （★場所と 字の 大きさだけは JS が 決めます ―― ★台の 大きさが 札の たけで 決まる ため）。
     ============================================================ */
  var PASS_ARROW = { 1: '←', 2: '↑', 3: '→' };     /* ★ core の d（席の いくつ 先か）で 引く */
  /* ★★ T215（アト）：★見た目は hearts.css の `.pass-guide` へ 移しました。★ここは 空です。
     ★ ★場所（left/width/top）と 字の 大きさだけ、下の paintGuide が 入れます。 */
  var GUIDE_LOOK = { box: {}, arrow: {}, text: {} };
  var guideLookDone = false, guideKey = '';
  function passOn() { return !!(g && !over && g.phase === 'pass' && g.passDir); }
  /* ★★ ここが「1か所」です ―― ★ハッピーも 場も この 1行から 字を もらいます */
  function passSay() { return (g && g.passDir) ? SAY.pass.replace('{先}', g.passLabel) : ''; }
  function passArrow() { return (g && PASS_ARROW[g.passDir]) || ''; }

  /* ============================================================
     ★★★ T217 ―― ★ハートブレイクの 知らせ（★仕組みだけ。★見た目は 🎨アトへ）★★★
     ------------------------------------------------------------
     ★★ ①どこに 出すか ―― ★★**わたす 案内と 同じ 帯**（★台の いちばん 上）。
        ★ ★社長の 写真も そこ でした（★ロボット2の 札の すぐ下）。
        ★ ★★ぶつかりません ―― ★わたす 案内は `phase === 'pass'`、★ハートブレイクは `play` の 中。
          ★ ★★**同時に 出る 場面は ありません**（★見張り ㉖ が 毎回 数えます）。
     ★★ ②いつ 出して、いつ 消すか ―― ★★出す ＝ ハートが 初めて 出た しゅんかん。
        ★ ★★消す ＝ **その 回の 4枚が 場から 消えた とき**。★ただし **1600ms は 必ず 出す**。
        ★ ★理由の 数字【実測・T217／各 8000回】：
          | ★ハートが 何枚目で 出たか | 1枚目 108 | 2枚目 2213 | 3枚目 2831 | 4枚目 2848 |（★1回も 出ない 0 / 8000）
          | ★場が 空に なるまで | 2740ms | 2140ms | 1540ms | 940ms |
          ★ ★→ ★画面に 出て いる 時間は **1600 〜 2740ms**。
          ★ ★下の 1600ms は ★★この 1本が すでに 決めて いる `SAY_HOLD`（★ひとことが 残る 時間）。
            ★ ★★私が 思いついた 数では ありません ―― ★同じ ゲームの 中に あった 数を 使いました。
          ★ ★上は「★その 回の 終わり」―― ★1回ぶんは 2960ms なので、★★**次の 回の 札の 上には 残りません**。
     ★★ ③見た目は 作りません（★`hearts.css` は アトの もの）。
        ★ ★下の `BREAK_LOOK` は **読める だけの 仮の 形** です。
        ★ ★★アトが `.break-note` を CSS に 書いたら、★ここを `{}` に して ください。
     ============================================================ */
  var BREAK_HOLD_MIN = 1600;                 /* ★ ＝ T.SAY_HOLD（★下で つき合わせます）*/
  /* ★★ T218（アト）：★見た目は hearts.css の `.break-note` へ 移しました。★ここは 空です。
     ★ ★場所（left/width/top/maxHeight）と 字の 大きさだけ、下の paintBreak が 入れます。 */
  var BREAK_LOOK = {};
  var breakNote = null, breakTimer = 0, breakAt = 0, breakLookDone = false;
  /* ★ T217 ―― ★順位の 表（★index.html は 触らず JS で 作る。★見た目は 仮。★アトが CSS に したら 空に する）*/
  var rankList = null, rankLookDone = false;
  /* ★★ T218（アト）：★見た目は hearts.css の `.rank-list` へ 移しました。★ここは 空です。 */
  var RANK_LOOK = {};
  function rankSnap() { return rankList ? { h: rankList.innerHTML, hid: rankList.classList.contains('hidden') } : null; }
  function rankPut(k) {
    if (!k || !rankList) return;
    rankList.innerHTML = k.h;
    if (k.hid) rankList.classList.add('hidden'); else rankList.classList.remove('hidden');
  }
  function makeRankList() {
    if (rankList || !resultScore || !resultScore.parentNode) return;
    rankList = document.createElement('div');
    rankList.className = 'rank-list hidden';
    rankList.id = 'rankList';
    resultScore.parentNode.insertBefore(rankList, resultScore.nextSibling);
  }
  function makeBreakNote() {
    if (breakNote || !passGuide || !passGuide.parentNode) return;
    breakNote = document.createElement('div');
    breakNote.className = 'break-note hidden';
    breakNote.id = 'breakNote';
    breakNote.textContent = SAY_BREAK;
    passGuide.parentNode.insertBefore(breakNote, passGuide.nextSibling);
  }
  /* ============================================================
     ★★★ T217 ―― ★知らせの 大きさ（★★被りを 測って から 決めました）★★★
     ------------------------------------------------------------
     ★★ わたす 案内と 同じ 帯に 置きます。★★でも わたす 案内と ちがって、
        ★ ★ハートブレイクの ときは **場に 札が 出て います**。★そこが ちがう ところ です。
     ★★ 測って 分かった こと【実測・T217・4枚 出そろった 場面】：
        ★ ★★**札の 上に すきまは ほとんど ありません**（★札の 上までの すきま **−1 〜 10px**）。
          ★ ★＝ ★★「札に かからない 場所」は 台の 中に ありません。★★被りを 0 には できません。
        ★ ★社長は「★なるべく 被らないように（★少し 被るのは OK）」と 言われました。
          ★ ★→ ★★**できる かぎり 小さく して、★数字で 出す** ―― ★それが 私に できる こと です。
     ★★ 2つ しました：
        ★ ★①文を 短く（★24字 → 17字）。★★320×568 の 被りが 30.5% → **25.2%**【実測】
        ★ ★★②たけを **台の 3分の1まで** に して、★入らなければ 字を 小さく する（★下ばり 11px）。
          ★ ★★736×414 で 札の 側の 被りが **68.9%** ありました ―― ★★知らせが 札を 食って いました。
     ★★ ③たけの 線を「台の 3分の1」に した 理由：
        ★ ★★場の 札は 十字に 並び、★台の たての **ほぼ ぜんぶ**を 使います（★実測：台 195px に 札 142px）。
        ★ ★★知らせが 3分の1を 超えると、★★十字の 上の 札が ほぼ 隠れます。
        ★ ★3分の1なら、★上の 札の 上半分に かかる ところで 止まります。
     ============================================================ */
  var BREAK_TALL_DIV = 3;                    /* ★ 知らせの たけは 台の 1/3 まで（★決め打ち）*/
  var BREAK_FONT_MIN = 11;                   /* ★ 字の 下ばり */
  var breakKey = '';
  function paintBreak() {
    if (!breakNote || !geo) return;
    if (!breakLookDone) { applyLook(breakNote, BREAK_LOOK); breakLookDone = true; }
    /* ★ わたす 案内と **同じ 帯**（★同じ 式。★ずれたら ㉖ が 鳴ります）*/
    var top = geo.feltTop + geo.feltInset;
    var room = Math.max(22, geo.passTop - top - 6);
    var cap = Math.max(22, Math.min(room, Math.round(geo.feltH / BREAK_TALL_DIV)));
    breakNote.style.left = geo.feltLeft + 'px';
    breakNote.style.width = geo.feltW + 'px';
    breakNote.style.top = top + 'px';
    breakNote.style.maxHeight = cap + 'px';
    breakNote.style.overflow = 'hidden';
    /* ★ 字は 本物で 測って いちばん 大きい ものを 取る（★paintGuide と 同じ やり方）*/
    var key = geo.feltW + 'x' + cap + '|' + breakNote.textContent;
    if (key === breakKey) return;
    breakKey = key;
    var base = parseFloat(getComputedStyle(passGuide).fontSize) || 16;
    var px = Math.max(BREAK_FONT_MIN, Math.round(base));
    for (; px > BREAK_FONT_MIN; px--) {
      breakNote.style.fontSize = px + 'px';
      if (breakNote.scrollHeight <= cap) break;
    }
    breakNote.style.fontSize = px + 'px';
  }
  function breakOn() { return !!(breakNote && !breakNote.classList.contains('hidden')); }
  function showBreak() {
    makeBreakNote();
    if (!breakNote) return;
    if (breakTimer) { clearTimeout(breakTimer); breakTimer = 0; }
    breakNote.textContent = SAY_BREAK;
    breakNote.classList.remove('hidden');
    paintBreak();
    breakAt = Date.now();
  }
  function hideBreak() {
    if (breakTimer) { clearTimeout(breakTimer); breakTimer = 0; }
    if (breakNote) breakNote.classList.add('hidden');
    breakAt = 0;
  }
  /* ★ 場が 空に なった ―― ★1600ms 経って いれば 今 消す。★足りなければ 足りない ぶんだけ 待つ */
  function breakDue() {
    if (!breakOn()) return;
    var left = BREAK_HOLD_MIN - (Date.now() - breakAt);
    if (left <= 0) { hideBreak(); return; }
    if (breakTimer) clearTimeout(breakTimer);
    breakTimer = setTimeout(hideBreak, left);
    timers.push(breakTimer);
  }
  /* ★ 1枚 出した あと 呼ぶ ―― ★ハートが **いま** 割れたら 知らせる */
  function breakWatch(was) { if (g && !was && g.heartsBroken) showBreak(); }

  function refreshGuide() {
    if (!passGuide) return;
    var on = passOn();
    passGuide.classList.toggle('hidden', !on);
    guideArrow.textContent = on ? passArrow() : '';
    guideText.textContent = on ? passSay() : '';
    if (on) paintGuide();
  }
  function applyLook(el, o) { for (var k in o) if (o.hasOwnProperty(k)) el.style[k] = o[k]; }
  function paintGuide() {
    if (!passGuide || !geo) return;
    if (!guideLookDone) {
      applyLook(passGuide, GUIDE_LOOK.box);
      applyLook(guideArrow, GUIDE_LOOK.arrow);
      applyLook(guideText, GUIDE_LOOK.text);
      guideLookDone = true;
    }
    /* ★ 台の みどりの 中に 収める（★木わく ＋ 内よはく ＋ みどりの わく の ぶんを よける）*/
    var top = geo.feltTop + geo.feltInset;
    var room = Math.max(22, geo.passTop - top - 6);      /* ★ わたす ボタンの 上まで */
    passGuide.style.left = geo.feltLeft + 'px';
    passGuide.style.width = geo.feltW + 'px';
    passGuide.style.top = top + 'px';
    /* ============================================================
       ★★ 字の 大きさ ―― ★★式で 決めず、★**本物で 測って いちばん 大きい ものを 取ります** ★★
       ★ ★上から 順に 当てて いって、★2つ とも 通った いちばん 大きい 字を 使います：
         ★ ★① 台の 空いて いる たけ（room）に 入る
         ★ ★② ★★2行までに 収まる（★3行4行に 割れると、大きくても かえって 読みにくい）
       ★ ★②が どうしても 通らない ときは ①だけで 決めます（★設計図 追記③「静かに 詰める」）。
       ⚠️★ ★ここは 測る たびに 画面の 計算が 走る ので、★★台の 大きさか 文が 変わった ときだけ
          ★ 測り直します（★placeAll から 毎回 呼ばれる ため）。
       ============================================================ */
    var key = geo.feltW + 'x' + room + '|' + guideText.textContent;
    if (key !== guideKey) {
      var FMAX = 40, FMIN = 11, f, fitH = 0, fit2 = 0;
      for (f = FMAX; f >= FMIN; f--) {
        passGuide.style.fontSize = f + 'px';
        if (passGuide.scrollHeight > room) continue;
        if (!fitH) fitH = f;
        if (guideText.getBoundingClientRect().height <= f * 1.35 * 2 + 2) { fit2 = f; break; }
      }
      var use = fit2 || fitH || FMIN;
      passGuide.style.fontSize = use + 'px';
      guideKey = key;
      geo.guideFont = use; geo.guideRoom = room; geo.guideLines = fit2 ? 2 : 3;
    } else {
      geo.guideFont = parseFloat(passGuide.style.fontSize) || 0; geo.guideRoom = room;
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
     ★★ 点の 帯（★この回 と 合計 ―― ★4人ぶん）★★
     ★ ルル §5-2：★「いま 自分が 何点 取ったか」は **画面が 言って よい 側**。
     ⚠️★ ここは **数だけ** です。★「あぶない」「気をつけて」の たぐいは 1文字も 出しません。
     ============================================================ */
  /* ============================================================
     ★★★ T217 ―― ★★100点で 終わった とき、★1位〜4位を ぜんぶ 出す（★社長ご指示 2026-09-04）★★★
     ------------------------------------------------------------
     ★ 社長：「★100に 達成したプレイヤーが いたら ゲームを 終了し、★点数が 一番低い人を 1位とし、
       ★点数の高いプレイヤーを 最下位として、★最後に 順位が 表示されるようにしてください」
     ★★ ①「100点で 終わる」は **もう 入って いました**（★core の `addDeal`：★`hi >= GOAL(100)`）。
        ★ ★★実測（各 20000試合）：★★20000 / 20000 が 100点に 届いて 終わる。★平均 11.5回 配る。
        ★ ★★足りなかったのは **順位の 表** だけ です。★作り直して いません。
     ★★ ②同じ 点の 人 ―― ★★**同じ 位に します**（★1位が 2人なら 次は 3位）。
        ★ ★実測：★1位が 同点 **2.1〜2.2%**／★どこかに 同点が ある **4.9〜5.1%**（★20000試合）。
        ★ ★★＝ ★★20回に 1回 起きます。★決まりが 要ります。
        ★ ★★これは **私が 選んだ 形** です（★元から あった `match.winners` が
          ★ ★★「いちばん 低い 人 **ぜんぶ**」を 1位に して いた ので、★その まっすぐな 続き）。
          ★ ★★★社長の お決めが 出たら ここを 直します。
     ============================================================ */
  function rankRows(tot) {
    var i, order = [0, 1, 2, 3].sort(function (a, b) { return tot[a] - tot[b] || a - b; });
    var h = '', place = 0, shown = 0, prev = null;
    for (i = 0; i < 4; i++) {
      var p = order[i];
      if (prev === null || tot[p] !== prev) { place = i + 1; prev = tot[p]; }   /* ★ 同じ 点 ＝ 同じ 位 */
      shown++;
      /* ★★★ T217-3（★2026-09-04・🎨アトからの 名指し）★★★
         ★ ★★1位の 人 **ぜんぶ**に `rk-top` を 付けます（★1人でも 2人でも 3人でも）。
         ★ ★なぜ ここで やるか：★★CSS は 文字の 中身（「1位」）を 読めません。
           ★ ★いまの 金の 帯は `.rank-list > :nth-child(-n+3)`（★＝ **上から 1行目**）なので、
           ★ ★★同点1位が 2人いても 1人ぶん しか 金に なりません【★アト実測】。
           ★ ★★誰が 1位かを 知って いるのは、★位を 数えて いる **この for の 中 だけ** です。
         ★ ★同点1位は **2.2%**（★20000試合・★T217 実測）。★★20回に 1回よりは まれ、
           ★ ★でも 50回 遊べば 1回は 見る 形 です。
         ★ ★★1行に 3マス（位・名前・点）なので、★★1位が 2人なら rk-top は **6マス** 付きます。
         ★ ★→ ★★見た目（帯の 色・角の 丸み）は アトが CSS で 決めます。★ここは 印を 置くだけ。 */
      var top = (place === 1) ? ' rk-top' : '';
      h += '<span class="rk-place' + top + '">' + place + '位</span>' +
           '<span class="rk-name' + (p === 0 ? ' rk-me' : '') + top + '">' + seatName(p) + '</span>' +
           '<i class="rk-pt' + top + '">' + tot[p] + '</i>';
    }
    return { html: h, n: shown };
  }
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
    hideBreak();                                        /* ★ T217 */
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
      say(passSay(), 0);                      /* ★★ T214 ―― ★場の 案内と **同じ 1か所** から */
      refreshPick();
      refreshGuide();
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
    var wasBroken = g.heartsBroken;                     /* ★ T217 */
    var r = C.playIdx(g, seat, idx);
    if (!r.ok) { finishDeal(); return; }
    breakWatch(wasBroken);                              /* ★ T217 ―― ★ハートが 割れた しゅんかん */
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
      breakDue();                                       /* ★ T217 ―― ★場が 空に なった */
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
    say(''); refreshDim(); refreshPick(); refreshGuide();
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
    /* ★ T217 ―― ★100点で 終わった ときだけ 1位〜4位を 出す */
    makeRankList();
    if (rankList) {
      if (fin) {
        if (!rankLookDone) { applyLook(rankList, RANK_LOOK); rankLookDone = true; }
        rankList.innerHTML = rankRows(match.total).html;
        rankList.classList.remove('hidden');
      } else { rankList.innerHTML = ''; rankList.classList.add('hidden'); }
    }
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
    var wasBroken = g.heartsBroken;                     /* ★ T217 */
    var r = C.playIdx(g, 0, idx);
    if (!r.ok) { refreshDim(); return; }
    breakWatch(wasBroken);                              /* ★ T217 ―― ★ハートが 割れた しゅんかん */
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
    hideBreak();                                        /* ★ T217 */
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
    passGuide = $('passGuide'); guideArrow = $('passGuideArrow'); guideText = $('passGuideText');
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
    /* ★ T217 ―― ★入れ物は **はじめに** 作る。★遊ぶ ときに 作ると、★★verify が 先に 作った ぶんだけ
       ★ ★『verify の 前と 後で 画面が ちがう』に なります【実測：rank null → false】。 */
    makeRankList(); makeBreakNote();
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
    var out = { over: 0, off: 0, offName: [], small: 0, reach: 0,   /* ★ reach ＝ T217：★指で 動かせば 届く もの */
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
        if (scrollReach(el, q2)) out.reach++;                 /* ★ T217 ―― ★指で 動かせば 届く */
        else { out.off++; out.offName.push(el.className || el.tagName); }
      }
      if (q2.width < 43.5 || q2.height < 43.5) out.small++;
    }
    return out;
  }

  /* ============================================================
     ★★★ T217 ―― ★「★★指で 動かせば 届く」を どこまで 許すか（★社長裁定「1」・2026-09-04）★★★
     ------------------------------------------------------------
     ★ トライの 🔴：★続きが ある 人が たての 低い 画面で 開くと、★「つづきから」が 画面の 外。
       ★ ★★でも **見えて いて、指で はらえば 押せます**。★社長は「★見張りに 教える」を 選ばれました。
     ★ ★★ページワンでは 社長は「詰める」を 選ばれました ―― ★あちらは「はじめる」が **動かさずに 見えない**。
       ★ ★こちらは **見えて いて 押せる**。★★分けて お決めに なって います。

     ⚠️★★★ ゆるめる ときこそ、下の 線が 要ります ★★★
        ★ ★「どこまでも 動かせば 届く」に したら ―― ★★見張りは 死にます。
        ★ ★★だから 5つ ぜんぶ 通った ものだけ 許します（★1つでも 欠けたら **鳴らす**）：

     | ★① | ★入れ物が **本当に** 動かせる（★computed の overflow-y が auto/scroll ＋ 中身が はみ出て いる）|
     | ★② | ★★動かせる のこりが **入れ物の たけ 1つぶん 以内**（★＝ 指で 1回 はらえば 底に 着く 量）|
     | ★③ | ★はみ出して いる ぶんが、★動かせる のこりの 中に おさまる（★動かしても 届かない なら 鳴らす）|
     | ★④ | ★★よこには はみ出して いない（★よこスクロールは この 会社では 出さない）|
     | ★⑤ | ★★★本物の 指 ―― ★動かした あと まん中を さして、★**その もの が 返る**（★「あるはず」で 通さない）|

     ★★ ②の 線を「入れ物の たけ 1つぶん」に した 理由【実測・T217】★★
       | 画面 | ★はみ出し | ★動かせる のこり | ★入れ物の たけ | ★のこり ÷ たけ |
       |---|---|---|---|---|
       | 812×375 ／ 667×375 | 45px | 235px | 309px | ★**0.76** |
       | 844×390 | 30px | 220px | 324px | 0.68 |
       | 736×414 | 6px | 196px | 348px | 0.56 |
       | 320×480 | 0px | 65px | 419px | 0.16 |
       ★ ★いちばん 深い ところで **0.76倍**。★1.0倍を 線に すると、★実測の **1.3倍の 余り**が あります。
       ★ ★★1.0倍を 超える ＝「1回 はらっても 底に 着かない」―― ★そこからは「届く」と 言えません。
     ============================================================ */
  var REACH_MAX = 1.0;                       /* ★ 動かせる のこり ÷ 入れ物の たけ の 上限（★決め打ち）*/
  function scrollBox(el) {
    var p = el.parentNode;
    while (p && p.nodeType === 1 && p !== document.documentElement) {
      var oy = getComputedStyle(p).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && p.scrollHeight > p.clientHeight + 1) return p;
      p = p.parentNode;
    }
    return null;
  }
  function scrollReach(el, q) {
    /* ★ ④ よこに 出て いる ものは 許さない */
    if (q.left < -0.5 || q.right > window.innerWidth + 0.5) return false;
    var box = scrollBox(el);                                   /* ★ ① */
    if (!box) return false;
    var room = box.scrollHeight - box.clientHeight;
    if (!(room > 0) || room > box.clientHeight * REACH_MAX) return false;   /* ★ ② */
    var bb = box.getBoundingClientRect();
    var mid = (q.top - bb.top) + box.scrollTop + q.height / 2;
    var want = Math.max(0, Math.min(room, mid - box.clientHeight / 2));
    var keep = box.scrollTop;
    box.scrollTop = want;
    void box.offsetHeight;
    var q3 = el.getBoundingClientRect();
    var ok = (q3.top >= -0.5 && q3.bottom <= window.innerHeight + 0.5 &&
              q3.left >= -0.5 && q3.right <= window.innerWidth + 0.5);      /* ★ ③ */
    if (ok) {                                                               /* ★ ⑤ 本物の 指 */
      var cx = Math.round(q3.left + q3.width / 2), cy = Math.round(q3.top + q3.height / 2);
      var hit = document.elementFromPoint(cx, cy);
      ok = !!(hit && (hit === el || (hit.closest && hit.closest(TOUCH_SEL) === el)));
    }
    box.scrollTop = keep;
    void box.offsetHeight;
    return ok;
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
    var reachTotal = 0;                                   /* ★ T217 ―― ★指で 動かせば 届いた もの */
    var hitBad = 0, hitTot = 0;
    var keepG = g, keepBusy = busy, keepOver = over, keepPicks = picks;
    var kTitleHid = titleScreen.classList.contains('hidden');
    var kPlayHid = playScreen.classList.contains('hidden');
    /* ⚠️★★ T214-3 ―― ★★結果の 箱を **どかして から** 測る（★私が 走らせて 見つけた 抜け）★★
       ★ 「1回 おわり」の 画面で verify() を 呼ぶと、★結果の 箱は 画面 いっぱい（0〜568）に かぶさります。
       ★ → ★手札の まん中を さすと **箱が 返る** ―― ★★実測 113 / 113枚 が うその NG に なって いました。
       ★ ★この 見張りは「札に 指が 届くか」を 測る もの。★上に 出て いる 箱は 測る 相手では ありません。
       ★ ★終わったら **元の 見え方に 戻します**（★出て いたら 出したまま）。 */
    var kResultHid = resultWrap.classList.contains('hidden');
    titleScreen.classList.add('hidden');
    playScreen.classList.remove('hidden');
    resultWrap.classList.add('hidden');
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
        offTotal += m.off; smallTotal += m.small; reachTotal += m.reach;
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
    if (kResultHid) resultWrap.classList.add('hidden'); else resultWrap.classList.remove('hidden');   /* ★ T214-3 */
    if (g) { rebuild(); placeAll(true); }
    var out = {
      '画面': window.innerWidth + '×' + window.innerHeight,
      '★札': geo.cw + '×' + geo.ch + 'px（★見えて いる はば ' + geo.pitch.toFixed(1) + 'px）',
      '調べた場面': n + '（★わたす 場面 ／ 場に 0〜4枚 の 場面）',
      '★はみ出し（一番 大きい）': worst + 'px',
      '★押す ところが 画面外': offTotal + '件',
      '★T217 指で 動かせば 届いた': reachTotal + '件',
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
  /* ============================================================
     ★★★ 見張りの 場面は、見張りが 自分で 作る（★T214-3・トライ T216 🟡-2）★★★
     ------------------------------------------------------------
     ★ 前は dimProbe・markProbe・reachProbe・slideProbe・lineProbe・winProbe が
       ★ **呼んだ ときの g** を 写して 場面を 作って いました（snapG）。
       ★ → ★手札 2〜3枚で うその NG 3・★1枚で こけて その 回が 進まない・★0枚で 箱の 後ろを 汚す
         （★verify は「はじめる 直後（13枚）」でしか 正しく 動いて いませんでした）。
     ★ ここでは ㉒㉓ と 同じく ★★**自分で 13枚 配り**（★種は 決め打ち）、★終わったら 1つ 残らず 元へ 戻します。
       ★ 戻す もの：g・match・busy・over・picks・画面（はじめ／遊ぶ／結果の 箱）・ふきだし・timers・札の DOM。
       ★ ★★こけても 戻します（finally）―― ★そのうえで 投げ直す（★静かに 通さない）。
     ★ 中の snapG／restoreG は そのまま ―― ★写す 相手が「呼んだ ときの g」から「ここで 配った g」に 変わる だけ。
     ============================================================ */
  var SCENE_SEED = 20260904;                     /* ★ 決め打ち（★毎回 同じ 13枚）*/
  function ownScene(fn) {
    var keep = { g: g, match: match, busy: busy, over: over, picks: picks,
                 titleHid: titleScreen.classList.contains('hidden'),
                 playHid: playScreen.classList.contains('hidden'),
                 resultHid: resultWrap.classList.contains('hidden'),
                 say: sayEl.textContent, sayHid: sayEl.classList.contains('hidden'),
                 tMark: timers.length };
    try {
      titleScreen.classList.add('hidden'); playScreen.classList.remove('hidden'); resultWrap.classList.add('hidden');
      if (!match) match = C.newMatch(C.LEVEL_START);
      build(); layout();
      dropCards();
      picks = {}; busy = false; over = false;
      g = C.makeGame(C.rng(SCENE_SEED), { rules: rules, dealNo: 0 });
      rebuild(); placeAll(true);
      return fn();
    } finally {
      for (var t = timers.length - 1; t >= keep.tMark; t--) { clearTimeout(timers[t]); timers.splice(t, 1); }
      dropCards();
      g = keep.g; match = keep.match; busy = keep.busy; over = keep.over; picks = keep.picks;
      if (keep.titleHid) titleScreen.classList.add('hidden'); else titleScreen.classList.remove('hidden');
      if (keep.playHid) playScreen.classList.add('hidden'); else playScreen.classList.remove('hidden');
      if (keep.resultHid) resultWrap.classList.add('hidden'); else resultWrap.classList.remove('hidden');
      sayEl.textContent = keep.say;
      if (keep.sayHid) sayEl.classList.add('hidden'); else sayEl.classList.remove('hidden');
      layout();
      if (g) { rebuild(); placeAll(true); }
    }
  }
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
  function dimProbe() { return ownScene(dimProbeIn); }   /* ★ T214-3 ―― ★自分で 配った 場面で */
  function dimProbeIn() {
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
  function markProbe() { return ownScene(markProbeIn); }   /* ★ T214-3 ―― ★自分で 配った 場面で */
  function markProbeIn() {
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
  function reachProbe() { return ownScene(reachProbeIn); }   /* ★ T214-3 ―― ★自分で 配った 場面で */
  function reachProbeIn() {
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
  function slideProbe() { return ownScene(slideProbeIn); }   /* ★ T214-3 ―― ★自分で 配った 場面で */
  function slideProbeIn() {
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
  function lineProbe() { return ownScene(lineProbeIn); }   /* ★ T214-3 ―― ★自分で 配った 場面で */
  function lineProbeIn() {
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
  function winProbe() { return ownScene(winProbeIn); }   /* ★ T214-3 ―― ★自分で 配った 場面で */
  function winProbeIn() {
    var out = { cases: [], mid: '―', why: [] };
    if (!match || !g) { out.why.push('★立ち上がって いない'); return out; }
    var kTotal = match.total.slice(), kDeal = match.dealNo, kOver = match.over, kWin = match.winners.slice();
    var kMoon = g.moonBy;
    var kHidden = resultWrap.classList.contains('hidden');
    var kTitle = resultTitle.textContent, kCls = resultTitle.className, kSay = resultSay.textContent;
    var kScore = resultScore.innerHTML, kNext = btnNext.innerHTML;
    var kRankW = rankSnap();                                      /* ★ T217 */
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
    rankPut(kRankW);                                              /* ★ T217 */
    if (kLv) levelPickResult.classList.add('hidden'); else levelPickResult.classList.remove('hidden');
    if (kLock) resultBox.classList.add('is-locked'); else resultBox.classList.remove('is-locked');
    if (kHidden) resultWrap.classList.add('hidden'); else resultWrap.classList.remove('hidden');
    return out;
  }

  function resultProbe() {
    return still(function () {
      var keep = resultWrap.classList.contains('hidden');
      var keepScore = resultScore.innerHTML, keepSay = resultSay.textContent;
      /* ⚠️★★ T217 ―― ★★ここも 場面を 自分で 作る（★私が 4度目に 踏んだ 同じ 穴）★★
         ★ ★この 見張りは 結果の 箱を 出して 測ります。★でも **はじめの 画面を 消して いません**でした。
         ★ ★→ ★続きが ある 人の はじめの 画面で verify を 呼ぶと ―― ★★結果の 箱が
           ★ ★「つづきから」の 上に かぶさり、★★T217 で 足した「指で 届く か」の 目が
           ★ ★★「箱が 返る ＝ 届かない」と 読んで、★★★うその NG「押す ところが 画面の 外」が 出ました【実測】。
         ★ ★結果の 箱が 出て いる とき、★本物の 画面では はじめの 画面は 消えて います。★そこに そろえます。 */
      var kT27 = titleScreen.classList.contains('hidden');
      var kP27 = playScreen.classList.contains('hidden');
      /* ⚠️★★★ T217-3（★2026-09-04）―― ★★★これで **5度目** の 同じ 事故 です ★★★
         ★ ★下の 行は もともと `levelPickResult.classList.add('hidden')` ―― ★★**決め打ちで 消して**
           ★ ★いました（★覚えて いない ので 戻せない）。★ふだんは 消えて いるので 気づきません。
         ★ ★★でも ★★100点で 終わった 画面では、★つよさの えらびは **出て います**（★showResult が 出す）。
           ★ ★→ ★★verify を 呼ぶと 消えた まま に なり、★★結果の 箱が 246 → 162px に 縮み、
           ★ ★★★「つぎへ」「やめる」が 44 → **37.8px**（★指の 下ばり 割れ）に なって いました【実測・320×568】。
         ★ ★★私の 手で 見つけました（★★「100点で 終わった 画面」を mid に 足した から 見えた）。
           ★ ★★㉛ は 場面を 自分で 作る ので、★★この 壊れ方は 映りません ―― ★見張りの 外側の 穴 でした。
         ★ ★→ ★★覚えて から 戻します（★kT27・kP27 と 同じ 形に そろえる）。 */
      var kLv27 = levelPickResult.classList.contains('hidden');
      titleScreen.classList.add('hidden'); playScreen.classList.remove('hidden');
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
      if (kT27) titleScreen.classList.add('hidden'); else titleScreen.classList.remove('hidden');   /* ★ T217 */
      if (kP27) playScreen.classList.add('hidden'); else playScreen.classList.remove('hidden');
      if (kLv27) levelPickResult.classList.add('hidden'); else levelPickResult.classList.remove('hidden');
      resultScore.innerHTML = keepScore;
      resultSay.textContent = keepSay;
      return { h: Math.round(box.height), max: max, over: ov, off: m.off, small: m.small,
               offName: m.offName };
    });
  }

  /* ============================================================
     ★★★ T221（2026-09-04・💻コーダ）―― ★★568×320 で「つよさの えらび」を 消す 線 ★★★
     ------------------------------------------------------------
     ★ ★社長の お決め（2026-09-04・「1」）で、★★`hearts.css` が **たて 320px 以下**の 画面では
       ★ ★結果の 画面の つよさの えらびを `display:none` に します（★アト T220 §6-2）。
     ★ ★★下の 1行は、その CSS と **1文字ちがわず 同じ 文**です。★★ずれたら 見張りが うそを 鳴らします。
     ⚠️★ ★★これは 見張りを **ゆるめる** 直しです ―― ★だから 下の線を いっしょに 引きます（§⑮）。
     ============================================================ */
  var LV_KESU = '(max-height:320px)';

  /* ★★ つよさの えらび（★2か所）が ちゃんと 押せるか ★★ */
  function levelProbe() {
    var out = { rows: 0, ok: 0, ng: [], small: 0, kesu: 0, kesarete: 0, mihon: null };
    var kTitleHid = titleScreen.classList.contains('hidden');
    var kPlayHid = playScreen.classList.contains('hidden');
    var kResult = resultWrap.classList.contains('hidden');
    var kLv = levelPickResult.classList.contains('hidden');
    /* ⚠️★★ T214-3 ―― ★★その場の 状態を 土台に しない（★私が 走らせて 見つけた 3つ目の 抜け）★★
       ★ ★結果の 箱が 出た 直後の 550ms だけ、★箱に `is-locked` が 付きます
         （★出た しゅんかん 押して しまわない ための もの。★★わざと 押せなく して います）。
       ★ ★その あいだに verify() を 呼ぶと ―― ★CSS の `pointer-events:none` が 効いて
         ★ ★「★★つよさを えらべない 所が ある：終わった あとの 画面」と **うそを 鳴らして いました**【実測】。
       ★ ★★見張りが 測るのは「★指が 届く 大きさ・場所か」。★わざとの 鍵は 測る 相手では ありません。
       ★ ★→ ★測る あいだ だけ 鍵を 外し、★終わったら 元どおりに 戻します（★winProbe と 同じ やり方）。 */
    var kLock = resultBox.classList.contains('is-locked');
    var kTop = titleScreen.scrollTop;
    still(function () {
      var spots = [['はじめの 画面', $('levelTitle'), function () {
        titleScreen.classList.remove('hidden'); playScreen.classList.add('hidden');
        resultWrap.classList.add('hidden');
      }], ['終わった あとの 画面', $('levelResult'), function () {
        titleScreen.classList.add('hidden'); playScreen.classList.remove('hidden');
        resultBox.classList.remove('is-locked');                       /* ★ T214-3 */
        levelPickResult.classList.remove('hidden'); resultWrap.classList.remove('hidden');
      }]];
      /* ============================================================
         ★★★ T221 ―― ★★消えて いてよいのは「線が 当たって いる とき」だけ（★下の線 2本）★★★
         ★ ★㋐ ★線が 当たって いない のに 消えて いたら → ★★鳴る
         ★ ★㋑ ★★線が 当たって いる のに 消えて いなかったら → ★★鳴る
         ★ ★★＝ ★CSS を 消しても・広げても、★どちらでも 気づきます。
         ★ ★★はじめの 画面の えらびは この 線の 外 ―― ★★どの 画面でも 44px・押せる を 見ます。
         ============================================================ */
      var kesuNow = !!(window.matchMedia && window.matchMedia(LV_KESU).matches);
      out.kesu = kesuNow ? 1 : 0;
      /* ★ 判じる ところは **1か所**に します ―― ★★下の 見本も この 同じ 関数を 通します
         ★ ★（★見本が 通る 道と 本番が 通る 道が ちがうと、★見本は 何も 保証しません）*/
      function judgeLv(hit, kesarete) {
        if (hit && !kesarete) {
          return '★★終わった あとの 画面：★★消す 線（' + LV_KESU + '）が 当たって いるのに、' +
                 '★つよさの えらびが **出た まま**です ―― ★★hearts.css の 消す かたまりが 消えて います';
        }
        if (!hit && kesarete) {
          return '★★終わった あとの 画面：★★消す 線（' + LV_KESU + '）が 当たって いないのに、' +
                 '★つよさの えらびが **消えて います** ―― ★★線が 広がりすぎて います';
        }
        return '';
      }

      spots.forEach(function (sp) {
        sp[2]();
        void document.body.offsetWidth;
        var el = sp[1];
        var owaC = sp[0].indexOf('終わった') === 0;
        if (owaC) {
          var pickEl = el.closest ? el.closest('.level-pick') : null;
          var kesarete = !!(pickEl && getComputedStyle(pickEl).display === 'none');
          out.kesarete = kesarete ? 1 : 0;
          var m = judgeLv(kesuNow, kesarete);
          if (m) out.ng.push(m);

          /* ============================================================
             ★★★ 見本の線（★決め打ち・★毎回 2通り）★★★
             ★ ★イ）★★わざと `display:none` を **全画面に** かける → ★★消す 線が 当たって いない
               ★ ★ときは 鳴らねば ならない（★★「線が 広がりすぎ」の 側）
             ★ ★ロ）★★わざと `display:flex !important` を かける → ★★消す 線が 当たって いる
               ★ ★ときは 鳴らねば ならない（★★「消す かたまりが 消えた」の 側）
             ★ ★★どちらの 見本も、★**いま どちらの 側に いるか**で 効く ほうが 変わります。
               ★ ★→ ★★だから 2つ とも 毎回 走らせ、★**当たる はずの ほうが 鳴ったか**を 見ます。
             ★ ★★終わりに かならず もどし、★もどったかも 数えます。
             ============================================================ */
          if (pickEl) {
            var motoD = getComputedStyle(pickEl).display;
            var mk = function (css) {
              var s = document.createElement('style'); s.textContent = css;
              document.head.appendChild(s); void document.body.offsetWidth; return s;
            };
            var s1 = mk('.result-box .level-pick{display:none !important;}');
            var saw1 = !!judgeLv(kesuNow, getComputedStyle(pickEl).display === 'none');
            s1.parentNode.removeChild(s1); void document.body.offsetWidth;
            var s2 = mk('.result-box .level-pick{display:flex !important;}');
            var saw2 = !!judgeLv(kesuNow, getComputedStyle(pickEl).display === 'none');
            s2.parentNode.removeChild(s2); void document.body.offsetWidth;
            out.mihon = {
              /* ★ いま 消さない 画面 → イが 鳴る はず ／ いま 消す 画面 → ロが 鳴る はず */
              atari: kesuNow ? saw2 : saw1,
              hazure: kesuNow ? !saw1 : !saw2,
              back: getComputedStyle(pickEl).display === motoD
            };
          }

          /* ★ わざと 消して ある 画面では、★「押せるか」は 測りません（★★測れません）。
             ★ ★ただし はじめの 画面の ぶんは 上で ちゃんと 測って います。 */
          if (kesarete) return;
        }
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
    if (kLock) resultBox.classList.add('is-locked'); else resultBox.classList.remove('is-locked');   /* ★ T214-3 */
    return out;
  }

  /* ============================================================
     ★★★ ㉒ 手札が **いつでも** 2 → A の 順に 並んで いるか（★T214-①）★★★
     ------------------------------------------------------------
     ★★ ①見本は 決め打ち ―― ★下の 2つの ならびは **手で 書いた もの** です。
        ★ ★`sortMine` の 中の 式（HAND_SUIT_ORDER・handKey・rk）は **1度も 見ません**。
        ★ ★★＝ ★sortMine を 書きかえて 壊すと、★ここが 必ず 鳴ります。
     ★★ ②数える 場面は 5つ ―― ★★「配った 直後だけ 見て OK」に しません（★社長の ご心配 その1）：
        ★ ①配った 直後 ／ ②3枚 えらんだ あと ／ ★★③わたして もらった 直後 ／
        ★ ④1枚 出した あと ／ ⑤4枚 取られた あと
     ★★ ③並び（配列）だけで なく ―― ★★**画面の 左右の 位置**も 数えます。
     ★★ ④★★重なりも ―― ★右の 札が 上（z-index）＋ ★本物の 指で 左上の 角を さして その 札が 返るか（★T214-3）。
        ★ ★そろえた のに 描く 側が 逆、では 意味が ありません（★配列だけ 見る 見張りは うそに なる）。
     ============================================================ */
  var SORT_SUIT_WANT = ['クローバー', 'ダイヤ', 'スペード', 'ハート'];        /* ★ 決め打ち */
  var SORT_RANK_WANT = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  function sortPos(c) {
    var s = SORT_SUIT_WANT.indexOf(C.SUITS[C.suitOf(c)]);
    var r = SORT_RANK_WANT.indexOf(C.RANKS[C.rankOf(c)]);
    return (s < 0 || r < 0) ? -1 : s * 13 + r;
  }
  function sortProbe(n) {
    n = n || 4;
    var out = { cases: 0, badOrder: 0, badX: 0, badZ: 0, badHide: 0, why: [], where: {} };
    var keepG = g, keepBusy = busy, keepOver = over, keepPicks = picks;
    var kTitleHid = titleScreen.classList.contains('hidden');
    var kPlayHid = playScreen.classList.contains('hidden');
    /* ⚠️★★ T214-3 ―― ★★結果の 箱を どかして から 測る（★fitTest と 同じ 抜け）★★
       ★ ★上の (b) は「★本物の 指で 左上の 角を さす」目です。★結果の 箱が 画面に かぶさって いると
         ★ ★どの 札も「何も が 返る」＝ ★★角が かくれた 106 / 114件 の **うその NG** に なりました【実測】。 */
    var kResultHid = resultWrap.classList.contains('hidden');
    var tMark = timers.length;
    titleScreen.classList.add('hidden');
    playScreen.classList.remove('hidden');
    resultWrap.classList.add('hidden');
    if (!match) match = C.newMatch(C.LEVEL_START);
    build(); layout();
    var rd = C.rng(20260903);
    function chk(where) {
      out.cases++;
      out.where[where] = (out.where[where] || 0) + 1;
      var h = g.hands[0], i, a, b, why = '';
      for (i = 1; i < h.length; i++) {
        a = sortPos(h[i - 1].c); b = sortPos(h[i].c);
        if (a < 0 || b < 0 || !(a < b)) { why = C.nameOf(h[i - 1].c) + ' → ' + C.nameOf(h[i].c); break; }
      }
      if (why && out.badOrder < 4) {
        out.why.push(where + '：★★2 → A の 順に なって いません（' + why + '）');
      }
      if (why) out.badOrder++;
      var lastX = -1e9, xwhy = '';
      for (i = 0; i < h.length; i++) {
        var e = cardEl[h[i].id];
        if (!e || !e.parentNode) continue;
        var q = e.getBoundingClientRect();
        if (!(q.left > lastX)) { xwhy = C.nameOf(h[i].c) + ' が 左へ 戻った'; break; }
        lastX = q.left;
      }
      if (xwhy && out.badX < 4) {
        out.why.push(where + '：★★画面の ならびが 順に なって いません（' + xwhy + '）');
      }
      if (xwhy) out.badX++;
      /* ★★ ④ 重なり ―― ★右の 札が 上（★T214-3・トライ T216 🟡-1）★★
         ★ 並んで いても、左の 札が 上に 乗ると 数字の 角が かくれて 1枚も 読めません。
         ★ 2つの 目：★(a) z-index が 左→右で 増えて いる（★computed で 読む ＝ CSS の !important も 見える）
         ★           ★(b) ★★本物の 指 ―― ★各 札の 左上の 角（数字の 所）を さして、その 札が 返る
         ⚠️★★ **2つの 目は 別々に 通す**（★T214-3・★私が 走らせて 見つけた 抜け）★★
            ★ ★前は z が 1枚 だめだった 時点で **for を break** して いました。
              ★ → ★★z を 逆に して 壊すと ―― ★(a) は 鳴るのに ★(b) が **1枚も 見ないまま 終わる**。
              ★ ★＝ ★「上の 線を 引いたら、下の 線も 引く」に 反して いました
                （★実測：★z を 逆に した とき ★★角が かくれた 0件 ―― ★★かくれて いるのに）。
            ★ ★いまは どちらも **最後の 1枚まで 見て**、★理由は それぞれ 最初の 1件を 覚えます。 */
      var lastZ = -1e9, zwhy = '', hwhy = '';
      for (i = 0; i < h.length; i++) {
        var ez = cardEl[h[i].id];
        if (!ez || !ez.parentNode) continue;
        var z = parseInt(getComputedStyle(ez).zIndex, 10);
        if (!zwhy && (isNaN(z) || !(z > lastZ))) {
          zwhy = C.nameOf(h[i].c) + ' の z ' + (isNaN(z) ? 'auto' : z) + '（左の 札 ' + lastZ + ' より 上で ない）';
        }
        if (!isNaN(z)) lastZ = z;
        if (!hwhy) {
          var qz = ez.getBoundingClientRect();
          var got = hitAt(qz.left + 5, qz.top + 5);
          if (got !== ez) hwhy = C.nameOf(h[i].c) + ' の 左上の 角を さすと ' + (got ? got.cardName : '何も') + ' が 返る';
        }
      }
      if (zwhy && out.badZ < 4) out.why.push(where + '：★★重なりが 逆です（' + zwhy + '）');
      if (zwhy) out.badZ++;
      if (hwhy && out.badHide < 4) out.why.push(where + '：★★★数字の 角が かくれて います（' + hwhy + '）');
      if (hwhy) out.badHide++;
    }
    still(function () {
      for (var k = 0; k < n; k++) {
        dropCards(); picks = {}; busy = false; over = false;
        g = C.makeGame(rd, { rules: rules, dealNo: k % 4 });
        var p, i;
        for (p = 1; p < 4; p++) for (i = 0; i < g.hands[p].length; i++) makeCard(g.hands[p][i], false);
        for (i = 0; i < g.hands[0].length; i++) makeCard(g.hands[0][i], true);
        placeAll(true);
        chk('①配った 直後');
        if (g.phase === 'pass') {
          picks = {};
          picks[g.hands[0][0].id] = 1; picks[g.hands[0][5].id] = 1; picks[g.hands[0][10].id] = 1;
          placeAll(true);
          chk('②3枚 えらんだ あと');
          var give = [[], [], [], []], kk;
          for (kk in picks) if (picks.hasOwnProperty(kk)) give[0].push(+kk);
          for (p = 1; p < 4; p++) give[p] = C.botPass(g, p, C.LEVELS[2].o);
          picks = {};
          C.doPass(g, give);
          rebuild(); placeAll(true);
          chk('★★③もらった 直後');
        }
        for (var t = 0; t < 60 && !g.over; t++) {
          var seat = g.cur, L = C.legalIdx(g, seat);
          if (!L.length) break;
          var idx = (seat === 0) ? L[0] : C.botIdx(g, seat, C.LEVELS[2].o);
          var r = C.playIdx(g, seat, idx);
          if (!r.ok) break;
          if (!cardEl[r.id]) makeCard({ id: r.id, c: r.card }, true);
          faceUp(r.id, true);
          placeAll(true);
          if (seat === 0) chk('④1枚 出した あと');
          if (r.full) {
            var tk = C.takeTrick(g);
            for (i = 0; i < tk.ids.length; i++) {
              var ee = cardEl[tk.ids[i]];
              if (ee && ee.parentNode) ee.parentNode.removeChild(ee);
              delete cardEl[tk.ids[i]];
            }
            placeAll(true);
            chk('⑤4枚 取られた あと');
          }
        }
      }
    });
    for (var tt = timers.length - 1; tt >= tMark; tt--) { clearTimeout(timers[tt]); timers.splice(tt, 1); }
    dropCards();
    picks = keepPicks; g = keepG; busy = keepBusy; over = keepOver;
    if (kTitleHid) titleScreen.classList.add('hidden'); else titleScreen.classList.remove('hidden');
    if (kPlayHid) playScreen.classList.add('hidden'); else playScreen.classList.remove('hidden');
    if (kResultHid) resultWrap.classList.add('hidden'); else resultWrap.classList.remove('hidden');   /* ★ T214-3 */
    layout();
    if (g) { rebuild(); placeAll(true); }
    return out;
  }

  /* ============================================================
     ★★★ ㉓ 場の「わたす 案内」―― ★出る／向きが 合う／★★出っぱなしに ならない（★T214-②）★★★
     ------------------------------------------------------------
     ★★ ①見本は 決め打ち ―― ★下の 表は **手で 書いた もの** です。
        ★ ★`PASS_ARROW` も `C.PASS_DIRS` も 見ません。★★どちらを 書きかえても 鳴ります。
     ★★ ②上の 線を 引いたら 下の 線も ―― ★★「出て いない」だけで なく「★出っぱなし」も 見ます：
        ★ ★わたし終わった あと（★本物の doPassGo を 通す）／★1回 おわり（over）／
        ★ ★★わたさない 回（★4回目）―― ★どれも **消えて いる** こと。
     ★★ ③矢印は 決め打ちの 表と くらべた うえで、★★**本物の 画面の 位置**とも くらべます。
        ★ ★＝ ★ロボット1が 画面の 左に いる ことを、★getBoundingClientRect で 数えて から
          ★ ★「←」と 合って いるかを 見ます。★★片方だけ だと 席の 並べ替えに 気づけません。
     ★★ ④文が 2か所（ハッピー／場）で **1文字ちがわず 同じ** か ―― ★★本物の newDeal を 通します。
     ★★ ⑤台（みどりの 盤）から はみ出して いないか ―― ★これも 本物の 座標で。
     ============================================================ */
  var GUIDE_WANT = [
    /* ★何回目（0起点）, ★矢印, ★わたす 先の 席, ★その 席は 画面の どこ */
    [0, '←', 1, 'left'],
    [1, '→', 3, 'right'],
    [2, '↑', 2, 'up'],
    [3, '',  -1, '']                         /* ★★ 4回目 ＝ わたさない → ★案内は 出しません */
  ];
  var ARROW_DIR = { '←': 'left', '→': 'right', '↑': 'up', '↓': 'down' };
  function guideProbe() {
    /* ★ wantN … ★決め打ちの 表が「出す」と 言って いる 回数
       ★ shownN … ★★本当に 出て いた 回数（★★2つを 分けて 数えます ―― ★同じに しては いけません）*/
    var out = { rows: [], why: [], wantN: 0, shownN: 0, hiddenN: 0, stale: [] };
    if (!passGuide || !feltTable || !built) { out.why.push('★立ち上がって いない'); return out; }
    var keepG = g, keepBusy = busy, keepOver = over, keepPicks = picks, keepMatch = match;
    var kTitleHid = titleScreen.classList.contains('hidden');
    var kPlayHid = playScreen.classList.contains('hidden');
    var kSay = sayEl.textContent, kSayHid = sayEl.classList.contains('hidden');
    /* ⚠️★★ T214-3 ―― ★★ここは **本物の newDeal を 通す** 見張りです。★newDeal は
       ★ ★結果の 箱（resultWrap）と つよさの えらび（levelPickResult）を **消します**。
       ★ → ★「1回 おわり」の 画面で verify() を 呼ぶと、★★見張りが 結果の 箱を 消した まま 帰り、
         ★ ★★遊ぶ人は「つぎへ」が 押せなく なって いました【実測：result true → false・進めない】。
       ★ ★見張りが 見張る 相手を 壊す ―― ★★ここが その 出どころ でした。★覚えて 戻します。 */
    var kResultHid = resultWrap.classList.contains('hidden');
    var kLvHid = levelPickResult.classList.contains('hidden');
    var kLock = resultBox.classList.contains('is-locked');
    var kScore = resultScore.innerHTML, kRSay = resultSay.textContent;
    var kRank23 = rankSnap();                                     /* ★ T217 */
    var kRTitle = resultTitle.textContent, kRCls = resultTitle.className, kNext = btnNext.innerHTML;
    var tMark = timers.length;
    titleScreen.classList.add('hidden');
    playScreen.classList.remove('hidden');
    match = C.newMatch(C.LEVEL_START);
    build(); layout();
    function dirOf(el) {
      var f = feltTable.getBoundingClientRect(), b = el.getBoundingClientRect();
      var dx = (b.left + b.width / 2) - (f.left + f.width / 2);
      var dy = (b.top + b.height / 2) - (f.top + f.height / 2);
      if (Math.abs(dx) >= Math.abs(dy)) return dx < 0 ? 'left' : 'right';
      return dy < 0 ? 'up' : 'down';
    }
    function shown() { return !passGuide.classList.contains('hidden'); }
    still(function () {
      GUIDE_WANT.forEach(function (w) {
        match.dealNo = w[0];
        newDeal();                                    /* ★★ 本物の 道 */
        var row = { '★何回目': (w[0] + 1) + '回目', '★出て いる': shown() ? '○' : '―',
                    '★矢印': guideArrow.textContent, '★文': guideText.textContent };
        if (!w[1]) {                                  /* ★ わたさない 回 */
          out.hiddenN++;
          if (shown()) out.why.push((w[0] + 1) + '回目（★わたさない 回）なのに 案内が 出て います');
          if (g.phase !== 'play') out.why.push((w[0] + 1) + '回目が「わたさない」に なって いません');
          out.rows.push(row); return;
        }
        out.wantN++;
        if (!shown()) {
          out.why.push((w[0] + 1) + '回目（' + w[1] + '）で 場に 案内が 出て いません');
          out.rows.push(row); return;
        }
        out.shownN++;
        /* ★ ③-a 決め打ちの 表と くらべる */
        if (guideArrow.textContent !== w[1]) {
          out.why.push((w[0] + 1) + '回目の 矢印が「' + guideArrow.textContent + '」（★「' + w[1] + '」の はず）');
        }
        /* ★ ③-b ★★本物の 画面の 位置と くらべる（★わたす 先の ロボットが 本当に その 向きに いるか）*/
        var seat = (0 + g.passDir + 4) % 4;
        if (seat !== w[2]) {
          out.why.push((w[0] + 1) + '回目の わたす 先が ' + seatName(seat) + '（★' + botName(w[2]) + ' の はず）');
        }
        var el = botEl[seat === 1 ? 0 : (seat === 2 ? 1 : 2)];
        var real = dirOf(el);
        if (real !== w[3] || ARROW_DIR[guideArrow.textContent] !== real) {
          out.why.push((w[0] + 1) + '回目：★★矢印「' + guideArrow.textContent + '」と ' + botName(seat) +
                       ' の 居場所（' + real + '）が 合って いません');
        }
        row['★相手の 居場所'] = real;
        /* ★ ④ 2か所の 文が 1文字ちがわず 同じか */
        if (guideText.textContent !== sayEl.textContent) {
          out.why.push((w[0] + 1) + '回目：★★ハッピーの 文と 場の 文が ちがいます（ハッピー「' +
                       sayEl.textContent + '」／場「' + guideText.textContent + '」）');
        }
        if (!guideText.textContent) out.why.push((w[0] + 1) + '回目：★場の 文が 空です');
        /* ★ ⑤ 台から はみ出して いないか */
        var fq = feltTable.getBoundingClientRect(), gq = passGuide.getBoundingClientRect();
        var over4 = Math.max(0, Math.round(fq.left - gq.left), Math.round(fq.top - gq.top),
                                Math.round(gq.right - fq.right), Math.round(gq.bottom - fq.bottom));
        row['★台から はみ出し'] = over4 + 'px';
        if (over4 > 0) out.why.push((w[0] + 1) + '回目：★★案内が 台から ' + over4 + 'px はみ出して います');
        /* ★ ②-a ★★わたし終わったら 消えるか（★本物の doPassGo を 通す）*/
        if (w[0] === 0) {
          busy = false; picks = {};
          picks[g.hands[0][0].id] = 1; picks[g.hands[0][1].id] = 1; picks[g.hands[0][2].id] = 1;
          refreshPick();
          doPassGo();
          if (shown()) { out.stale.push('わたし終わった あと'); out.why.push('★★★わたし終わった のに 案内が 出っぱなし です'); }
          /* ★ ②-b ★1回 おわり（over）でも 消えるか */
          g.phase = 'pass'; over = true; placeAll(true);
          if (shown()) { out.stale.push('1回 おわり'); out.why.push('★★1回 おわりなのに 案内が 出っぱなし です'); }
          over = false;
        }
        out.rows.push(row);
      });
    });
    for (var tt = timers.length - 1; tt >= tMark; tt--) { clearTimeout(timers[tt]); timers.splice(tt, 1); }
    dropCards();
    picks = keepPicks; g = keepG; busy = keepBusy; over = keepOver; match = keepMatch;
    if (kTitleHid) titleScreen.classList.add('hidden'); else titleScreen.classList.remove('hidden');
    if (kPlayHid) playScreen.classList.add('hidden'); else playScreen.classList.remove('hidden');
    /* ★ T214-3 ―― ★newDeal が 消した ものを 1つ 残らず 戻す */
    resultTitle.textContent = kRTitle; resultTitle.className = kRCls;
    resultSay.textContent = kRSay; resultScore.innerHTML = kScore; btnNext.innerHTML = kNext;
    rankPut(kRank23);                                             /* ★ T217 */
    if (kLock) resultBox.classList.add('is-locked'); else resultBox.classList.remove('is-locked');
    if (kLvHid) levelPickResult.classList.add('hidden'); else levelPickResult.classList.remove('hidden');
    if (kResultHid) resultWrap.classList.add('hidden'); else resultWrap.classList.remove('hidden');
    sayEl.textContent = kSay;
    if (kSayHid) sayEl.classList.add('hidden'); else sayEl.classList.remove('hidden');
    layout();
    if (g) { rebuild(); placeAll(true); }
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
       ㉒  ★★★手札が **いつでも** 2 → A の 順（★5つの 場面・★並び・画面の 位置・★★重なり＝角が 見える）
       ㉓  ★★★場の わたす 案内 ―― ★出る／矢印が 相手と 合う／★★出っぱなしに ならない
       ㉔  ★★★場の わたす 案内が **読める 大きさ・濃さ** で 出て いる（★T215 アト・T214-2 で 入れた。★上／下／見本の 3本の 線）
       ㉕  ★★★横向きで 案内の 間は ふきだしが 消え、★★消えたら **戻る**（★たては 1pxも 変えない）（★T215-2 アト・T214-4 で 入れた）
       ㉖  ★★★ハートブレイクの 知らせが 出る／消える／わたす 案内と 同時に 出ない（★T217・社長ご指示）
       ㉗  ★★★その 知らせが 場の 札と どれだけ 被るか（★面積で 測る・12%まで）
       ㉘  ★★★100点で 終わり、★1位〜4位が ぜんぶ 出る（★点の 低い 人が 1位・同じ 点は 同じ 位）
       ㉙  ★★★はじめの 画面の 押す ところが 画面の 中か、★★指で 動かせば 届くか（★T217・社長裁定「1」）
       ㊱  ★★★ハッピーが 画面に 居るか（★設計図 §9.5・★T223・★🧪トライ T222 §4-3 の 名ざし）
           ★ ★★番号は ㊱ですが、★置き場は ㉟ の あと・★★㉜ の **前** です（★㉜ は いつも いちばん おしり）。
     ------------------------------------------------------------
     ⚠️★★★ 見張りを 足す 人へ ―― ★★終わった あと 画面が 元どおりか、★自分で 確かめて ください ★★★
        ★ ★★★T217-3（2026-09-04）で ★★㉜ を 足しました ―― ★verify の 頭と お尻で 画面を 写して くらべます。
          ★ ★★これで「戻し忘れ」は **その場で** 鳴ります（★★上の 宿題の 答え）。★★ただし ㉜ は
          ★ ★**verify を 呼ぶ 前後**の 話だけ。★★遊びが そのあと 続く かは やはり 外の 道具で 見て ください。
        ★ ★外の 道具：★`logs/T214_計測どうぐ/t214_3_narasu.cjs`／★★`logs/T217-3_計測どうぐ/t217_3_narasu.cjs mid`
          ★ ★（`mid new` … ★手札 4/3/2/1/0枚 ＋ はじめの 画面で 呼び、★★呼ぶ 前と 後の 画面を くらべる）。
        ★ ★★実際に 起きた こと（★T214-3 で 直した）：★㉓ と ㉔ が 本物の `newDeal()` を 通す のに、
          ★ ★★それが 消す 結果の 箱を 戻して いませんでした ―― ★★「1回 おわり」で verify を 1回 呼ぶと
          ★ ★★★「つぎへ」が 画面から 消えて、★★遊びが そこで 止まって いました。
        ★ ★★見張りが 見張る 相手を 殺します。★本物の 道（newDeal・doPassGo・say）を 通す 見張りは とくに。
        ★ ★→ ★★覚える もの：★g・match・busy・over・picks ／ ★titleScreen・playScreen・**resultWrap**・
          ★ ★**levelPickResult**・**resultBox の is-locked**・**結果の 箱の 中身** ／ ★sayEl ／ ★timers ／ ★札の DOM。
        ★ ★★★足したら 必ず `node t214_3_narasu.cjs mid new` を 走らせ、★「前後の 画面 ★同じ」を 見る こと。
     ============================================================ */
  function verify(n) {
    n = n || 2000;
    /* ============================================================
       ★★★ 見張り ㉟【1】―― ★★JS が 聞いた「線」を 1本 残らず 覚える（★T220-2・🎨アト作／T221 で 貼りました）★★★
       ★ ★元に もどすのは ㉟ の 中（★【2】）です。★★もどし忘れないよう、★下の線で「0本」も 鳴らします。
       ⚠️★ ★★覚えるのは 200本まで（★もし ㉟ に たどり着かず 例外で 抜けても、
         ★ ★この 包みは 中身を 素通しする だけ・★★際限なく 太りません）。
       ============================================================ */
    var mm35 = { seen: [], orig: null };
    try {
      mm35.orig = window.matchMedia;
      window.matchMedia = function (q35) {
        if (mm35.seen.length < 200) mm35.seen.push(String(q35));
        return mm35.orig.call(window, q35);
      };
    } catch (e35) { mm35.orig = null; }

    var ng = [], t0 = Date.now(), note = {};
    var L = C.LEVELS;

    /* ============================================================
       ㉜ ★★★見張りが 画面を 汚して いないか ―― ★★verify 自身を 見張る（★T217-3・2026-09-04）★★★
       ------------------------------------------------------------
       ⚠️★★★ これは この 上の 書き置きに ある「★T214-3 の 宿題・まだ 手が ありません」の 答え です ★★★
          ★ ★★同じ 形の 事故は この 1本で **5度** 起きました：
            ★ ★㉓㉔（T214-3）／★㉕（貼った 当日）／★⑪（T217・はじめの 画面）／
            ★ ★★⑪（★T217-3・★★つよさの えらびを 決め打ちで 消して いた ―― ★私が 今日 見つけた）。
          ★ ★★どれも「★★見張りが 場面を 作り、★戻し忘れる」でした。★★外の 道具でしか 見えて いません。
          ★ ★→ ★★★verify の **頭**と **お尻**で 画面の 形を 写し取り、★ちがったら 鳴らします。
       ★★ これは **下の 線 だけ** の 見張りです ★★
          ★ ★何かを 良くは しません。★★「見張りが 遊びを 止めた」ことに **その場で** 気づく ためだけ。
          ★ ★★新しく 見張りを 足す 人は、★これが 鳴ったら **自分の 戻し忘れ**を 疑って ください。
       ★★ 写し取る もの ★★
          ★ ★どの 画面が 出て いるか／★結果の 箱の 中身／★知らせ・順位・ふきだし／
          ★ ★g・match の 中身／★busy・over・えらんだ 札／★待ち時間の 数／★札の 数。
       ============================================================ */
    function screenSnap() {
      function hid(e) { return !e ? '―' : (e.classList.contains('hidden') ? '消' : '出'); }
      var s = {
        画面: hid(titleScreen) + hid(playScreen) + hid(resultWrap) + hid(levelPickResult) +
              hid(rankList) + hid(breakNote) + hid(passGuide) + hid(sayEl),
        鍵: resultBox ? resultBox.classList.contains('is-locked') : '―',
        見出し: (resultTitle ? resultTitle.textContent + '|' + resultTitle.className : '―'),
        ひとこと: (resultSay ? resultSay.textContent : '―'),
        点の表: (resultScore ? resultScore.innerHTML.length : -1),
        ボタン: (btnNext ? btnNext.innerHTML : '―'),
        順位: (rankList ? rankList.innerHTML : '―'),
        ふきだし: (sayEl ? sayEl.textContent : '―'),
        知らせ時刻: breakAt,
        遊び: (g ? g.phase + '/' + g.hands[0].length + '/' + g.trick.length + '/' + g.heartsBroken + '/' + g.moonBy : 'なし'),
        勝負: (match ? match.total.join(',') + '/' + match.dealNo + '/' + match.over + '/' + match.winners.join(',') : 'なし'),
        手: busy + '/' + over + '/' + Object.keys(picks || {}).length,
        待ち: timers.length,                        /* ★ くらべません（★下の SNAP_SKIP）*/
        札: document.querySelectorAll('#cards .card').length,
        /* ★★★ T223 ―― ★★見張りの `<style>` の 置き忘れ（★🧪トライ T222 §6・🟢-3）★★★
           ★ ★見張りは 見本を 走らせる ため `<style>` を 足して、★終わったら 外します
             ★ （★㉕・㉞・㉜・★㊱ が やって います）。★★外し忘れると **その あとの 画面が ずっと 汚れます**。
           ★ ★★これまでは 人が 数えて いました ―― ★T221 §3-5 で 私が **20往復 手で** 数えた もの。
           ★ ★★★いま 遊びの 中に `<style>` は **1つも ありません**（★9画面 とも 0個・★T222 実測）。
             ★ ★だから ここに 1行 足すだけで、★★置き忘れが **ぜんぶ 自動で 鳴ります**。 */
        スタイル: document.querySelectorAll('style').length,
        /* ============================================================
           ★★★ T217-5 ―― ★★★ものさし そのものが 汚されて いないか（★🧪トライの 名ざし）★★★
           ------------------------------------------------------------
           ★ ★トライ：「★㉜の穴で 効くのは ★★`--result-max` を 見て いない こと。
             ★ ★★㉛も ㉝も ㉞も『その ときの 天井』を ものさしに して いるので、
             ★ ★★★ものさしを 汚されると 3つ とも 同時に 黙ります」
           ★ ★★そのとおり でした【★下の 見本 ⑦⑧ で 鳴らして 見せます】。
             ★ ★㉛ … `box.height ≦ --result-max`／★㉝ … 同じ／★㉞ … `素のたけ ≦ --result-max`。
             ★ ★★天井を うんと 高く されると、★★3つ とも「入って います」と 静かに 言います。
           ★★ 足したのは 2つ ★★
             ★ ★**天井** … `--result-max` の **出来上がりの 値**（★getComputedStyle）。
               ★ ★★`:root{--result-max:… !important}` の <style> を 置き忘れた 場合も 捕まえます
                 ★ ★（★元の 場所（documentElement.style）だけ 見て いると、★★!important は 映りません）。
             ★ ★**箱の ふた** … `resultBox.style.maxHeight` の **直の 値**。
               ★ ★★㉞ は 素のたけを 測る ため ふたを 一瞬 `none` に して 戻します。
                 ★ ★★戻し忘れると 天井が 効かなく なる ので、★ここで 捕まえます。
           ⚠️★★★ ★私が 自分で 踏んだ 穴（★正直に・★`narasu mid` が 教えて くれました）★★★
             ★ ★はじめ、★天井を **値そのもの**（260px など）で 写して いました。★★すると ――
               ★ ★★★はじめの 画面から verify を 呼ぶと「★天井 200px → 107px」と **毎回 鳴りました**。
             ★ ★★でも これは 戻し忘れでは ありません：★`--result-max` は `layout()` が 決める もので、
               ★ ★はじめの 画面では **まだ 1回も 走って いない**（★CSS の はじめの 値 200px の まま）。
               ★ ★verify の 中で ㉔ も ㉛ も `build(); layout();` を 通る ので、★お尻では 本物の 値に なる。
             ★ ★★＝ ★★★たまに 鳴る 見張りは 壊れて いるのと 同じ（★T217-3 の「待ち」と まったく 同じ わな）。
             ★ ★→ ★★★**値**では なく「★★よそから 上書きされて いないか」を 写します。
               ★ ★`layout()` は `--result-max` を **元の 場所**（documentElement の style）に 書きます。
                 ★ ★★`:root{… !important}` の <style> を 置き忘れた 見張りが いると、
                 ★ ★★★**出来上がりの 値**（computed）が **元の 場所の 値** と ちがいます ―― ★そこを 見ます。
               ★ ★★元の 場所が まだ 空（＝ layout 前）なら、★上書きも 何も ない ので「素どおり」。
                 ★ ★→ ★★はじめの 画面でも 遊んで いる 最中でも、★★**同じ 言葉**に なります。
             ★ ★★★これで ㉜ は「値が 変わった」では なく「★ものさしが 曲げられた」を 見ます（★本題）。 */
        天井: (function () {
          var cp = getComputedStyle(document.documentElement).getPropertyValue('--result-max').trim();
          var iv = document.documentElement.style.getPropertyValue('--result-max').trim();
          return (!iv || iv === cp) ? '素どおり' : '★★よそから 上書き ' + cp + '（元 ' + iv + '）';
        })(),
        箱のふた: (resultBox ? (resultBox.style.maxHeight || '―') : '―')
      };
      return s;
    }
    /* ⚠️★★★ 私が 自分の 見張りを 壊して 見つけた こと（★T217-3・★正直に 残します）★★★
       ★ ★はじめ `待ち`（timers の 数）も くらべて いました。★→ ★★手札 3/2/1/0枚 の 場面で
         ★ ★★「待ち 94 → 0」と **毎回 鳴りました**。★でも これは 戻し忘れでは ありません ――
         ★ ★★verify は 数秒 かかり、★その あいだに 待って いた 時間が **自然に 来て 消える** から です。
       ★ ★★＝ ★★たまに 鳴る 見張りは 壊れて いるのと 同じ。★★数だけ 覚えて、くらべません。
       ★ ★（★時間の もれは ㉓㉔㉕㉚㉛ が 自分の ぶんを splice で 数えて います。★ここの 仕事では ない）*/
    var SNAP_SKIP = { 待ち: 1 };
    function snapDiff(a, b) {
      var d = [], k;
      for (k in a) if (a.hasOwnProperty(k) && !SNAP_SKIP[k] && String(a[k]) !== String(b[k])) {
        d.push(k + ' ' + String(a[k]).slice(0, 40) + ' → ' + String(b[k]).slice(0, 40));
      }
      return d;
    }
    var SNAP0 = screenSnap();

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
    /* ============================================================
       ★★★ T221 ―― ★★568×320 で 消す 直しの「下の線」（★見張りを ゆるめた ぶんの 対）★★★
       ★ ★上で `levelProbe` が 2本 引いて います（★消す 線と 見え方が 合って いるか）。
       ★ ★★ここでは その **見張り 自身**が 生きて いるかを 見ます ―― ★毎回 2通り わざと 壊して。
       ============================================================ */
    if (!lp.mihon) {
      ng.push('★★★つよさの えらび：★見本を 1度も 走らせて いません ―― ★★見張りが 生きて いる 証拠が ありません');
    } else {
      if (!lp.mihon.atari) ng.push('★★★つよさの えらび：★わざと 見え方を 逆に しても 気づきません ―― ★★**見張りの ほうが 壊れて います**');
      if (!lp.mihon.hazure) ng.push('★★★つよさの えらび：★正しい 見え方でも 鳴って しまいます ―― ★★見張りが うるさすぎます');
      if (!lp.mihon.back) ng.push('★★★つよさの えらび：★見本を 元に もどせて いません（★あとの 数字が 信じられません）');
    }
    note['⑮ つよさの えらび'] = '押せた ' + lp.ok + ' / ' + lp.rows + 'か所／44px 割れ ' + lp.small +
                                '件／★★出て いる：勝ち負け ' + (wpEarly.lvFin ? '○' : '★✕') +
                                '・1回 おわり ' + (wpEarly.lvMid ? '○' : '★✕') +
                                '／★終わった あとの 画面 ' + (lp.kesarete ? '★消して います' : '出して います') +
                                '（★消す 線 ' + LV_KESU + ' ' + (lp.kesu ? '当たり' : 'はずれ') + '）' +
                                '／★見本 ' + (lp.mihon ?
                                  (lp.mihon.atari ? '気づく' : '★×') + '・' +
                                  (lp.mihon.hazure ? 'うるさくない' : '★×') + '・' +
                                  (lp.mihon.back ? 'もどった' : '★×') : '★走って いません');

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
    /* ⚠️★★ T214-3 ―― ★★ここも 見本を 決め打ちに する（★私が 走らせて 見つけた 4つ目の 抜け）★★
       ★ ★点の 帯の 中身は renderScore が 入れます ―― ★★はじめの 画面では まだ 空です。
       ★ ★その ところで verify() を 呼ぶと ★「★点の 帯の 名前が 0個（★4個 の はず）」と
         ★ ★**うそを 鳴らして いました**【実測：はじめの 画面 NG 1】。
       ★ ★この 見張りが 測るのは「★名前が 切れないか・字の 大きさ」。★★中身が 空かどうかでは ありません。
       ★ ★→ ★★いちばん 長く なる 中身（★resultProbe と 同じ 数）を 自分で 入れて 測り、★終わったら 戻します。 */
    var kBand21 = scoreBand.innerHTML;
    var sb21 = still(function () {
      var b = scoreBand, i, cut = [], q;
      b.innerHTML = scoreRows([13, 26, 0, 13], [99, 52, 41, 66]);
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
    scoreBand.innerHTML = kBand21;                                  /* ★ T214-3 ―― ★元の 中身へ 戻す */
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

    /* ============================================================
       ㉒ ★★★手札が いつでも 2 → A の 順に 並んで いるか（★T214-①・社長ご指示）★★★
       ★ ★見本は 決め打ち（SORT_SUIT_WANT / SORT_RANK_WANT）。★sortMine の 式は 見ません。
       ★ ★5つの 場面 ×【並び・画面の 位置】の 2つの 目。★どちらか 1つでも 崩れたら 鳴らします。
       ============================================================ */
    var so = sortProbe(4);
    for (var i22 = 0; i22 < so.why.length; i22++) ng.push('★★手札の 並び：' + so.why[i22]);
    if (!so.cases) ng.push('★★★手札の 並びを 1場面も 数えられなかった（★試し方が おかしい）');
    if (so.badOrder) ng.push('★★★手札が 2 → A の 順に なって いない 場面が ' + so.badOrder +
                             ' / ' + so.cases + ' あります（★社長ご指示・T214-①）');
    if (so.badX) ng.push('★★★画面の 手札が 左から 右へ 順に 並んで いない 場面が ' + so.badX +
                         ' / ' + so.cases + ' あります（★★並べても 描き方が 逆では 意味が ありません）');
    /* ★ T214-3 ―― ★重なり（トライ T216 🟡-1：★並んで いても 角が かくれたら 読めない）*/
    if (so.badZ) ng.push('★★★手札の 重なりが 逆（左の 札が 上）の 場面が ' + so.badZ + ' / ' + so.cases + ' あります');
    if (so.badHide) ng.push('★★★手札の 数字の 角が かくれて いる 場面が ' + so.badHide + ' / ' + so.cases +
                            ' あります（★★2→A に 並んで いても 読めません）');
    /* ★ 場面を ちゃんと 全部 通ったか（★③もらった 直後 が 0回だと 見張りは うそに なります）*/
    if (!so.where['★★③もらった 直後']) {
      ng.push('★★★「もらった 直後」を 1回も 数えて いません（★社長が 名ざされた 場面 です）');
    }
    if (!so.where['④1枚 出した あと']) ng.push('★★「1枚 出した あと」を 1回も 数えて いません');
    note['㉒ ★★手札の 並び'] = '★数えた ' + so.cases + '場面（' +
      Object.keys(so.where).map(function (k) { return k + ' ' + so.where[k]; }).join('／') +
      '）／★★2→A で ない ' + so.badOrder + '件・画面の ならびが 逆 ' + so.badX + '件・重なりが 逆 ' + so.badZ + '件・角が かくれた ' + so.badHide + '件' +
      '／★ならび ' + SORT_SUIT_WANT.join('→') + '・' + SORT_RANK_WANT[0] + '→' +
      SORT_RANK_WANT[SORT_RANK_WANT.length - 1];

    /* ============================================================
       ㉓ ★★★場の わたす 案内（★T214-②・社長ご指示）★★★
       ★ ★出る／矢印が 相手と 合う／文が ハッピーと 同じ／台から 出ない／★★出っぱなしに ならない。
       ★ ★見本は 決め打ち（GUIDE_WANT）＋ ★本物の 画面の 位置との くらべ の 2つの 目。
       ============================================================ */
    var gp = guideProbe();
    for (var i23 = 0; i23 < gp.why.length; i23++) ng.push('★★わたす 案内：' + gp.why[i23]);
    if (gp.wantN !== 3 || gp.shownN !== 3) {
      ng.push('★★★わたす 案内が 出た 回が ' + gp.shownN + ' / ' + gp.wantN +
              '通り（★4通りの うち 3通り 出る はず ―― ★左・右・向かい。★4通り目は わたさない 回）');
    }
    if (gp.hiddenN !== 1) ng.push('★★「わたさない 回」を 数えて いません（' + gp.hiddenN + '通り）');
    if (gp.stale.length) ng.push('★★★案内が 出っぱなしの 場面が ある：' + gp.stale.join('・'));
    /* ★ 行の 目 ―― ★文が 本当に 1か所（passSay）から 出て いるか */
    if (String(newDeal).indexOf('passSay') < 0 || String(refreshGuide).indexOf('passSay') < 0) {
      ng.push('★★★ハッピーの 文と 場の 文が 1か所（passSay）から 出て いません（★ずれます）');
    }
    if (SAY.pass.indexOf('{先}') < 0) ng.push('★わたす 文に 相手を 入れる ところ（{先}）が ありません');
    if (String(refreshGuide).indexOf('hidden') < 0) ng.push('★★案内を 消す 行が ありません');
    note['㉓ ★★わたす 案内'] = '★向きは 4通り（★出す 3 ／ わたさない 1）／' +
      gp.rows.map(function (r) {
        return r['★何回目'] + ' ' + (r['★矢印'] || '―') + (r['★相手の 居場所'] ? ('=' + r['★相手の 居場所']) : '') +
               (r['★台から はみ出し'] ? ('・はみ出し ' + r['★台から はみ出し']) : '');
      }).join('／') + '／★字 ' + (geo.guideFont || '―') + 'px（★入る たけ ' + (geo.guideRoom || '―') + 'px）';

    /* ============================================================
       ㉔ ★★★場の「わたす 案内」が **読める 大きさ** で 出て いるか（T215・🎨アト）★★★
       ------------------------------------------------------------
       ★ この かたまりを `verify()` の 中（★㉓ の note の 後ろ・`var out = {` の 前）に
         ★ そのまま 貼れば 動きます。★使う ものは verify が 前から 持って いる もの だけ：
           ★ `ng` ／ `note` ／ `g` `busy` `over` `picks` `match` ／ `titleScreen` `playScreen`
           ★ `passGuide` `guideArrow` `guideText` `feltTable` `sayEl` ／ `build` `layout` `newDeal`
           ★ `still` `timers` `dropCards` `rebuild` `placeAll` `C`。★新しい 部品は 0個。

       ★★ ㉓ との 分け目 ★★
         ★ ㉓（コーダ）… 出て いるか／向きが 合うか／消えるか／台から 出ないか
         ★ ㉔（ここ）  … ★★**読めるか**。★出て いても、字が 小さい・字が うすい・切れて いる なら 鳴らします。
         ★ ★T123 の 教訓：★「字を 大きく する」は 半分。★のこり 半分は「その 字が 読める 濃さか」。

       ★★ 読める の 線（★数字で 決め打ち・T215 §2）★★
         ★ ①字 … **16px 以上**、かつ ★ハッピーの ふきだしの 字の **1.3倍 以上**
              （★社長：「ふきだしの 文が 一瞬 わからなかった → 場に 大きく」。★同じ 大きさでは 意味が ない）
         ★ ②矢印 … 字の **1.5倍 以上** の たけ（★字と 同じ 大きさでは「文の 1文字目」に 見える）
         ★ ③へだたり … 字も 矢印も **4.5:1 以上**（★T123・T139 と 同じ ものさし。★仮の 見た目は 4.3 でした）
         ★ ④2行まで・切れて いない（★scrollWidth が はばを 超えて いない）
         ★ ⑤消されて いない（display / visibility / すきとおり .95 未満）

       ★★ 3本の 線（★「上の線を 引いたら、下の線も 引く」）★★
         ★ ★上の線 … ①〜⑤の どれかが 外れたら 鳴る
         ★ ★下の線 … ★★**測れて いない ときも 鳴る**（★部品が 無い・大きさ 0・字が NaN・
           ★ ★★ページが 前に 出て いない）。★これが 無いと、案内を 消した ときに「小さい 字 0件」で 静かに 通ります。
         ★ ★見本の 線 … ★★毎回 **わざと 壊して**（★字を 9px に／字の 色を 地と 同じに）測り直し、
           ★ ★ちゃんと「読めない」と 出る ことを 確かめて から 元に もどす。★出なかったら 見張りの ほうが 壊れて います。
           ★ ★（★壊し方は **決め打ち**です。★画面の 値から 作って いません）

       ⚠️★★ この 見張りは **いま 見て いる 画面の 大きさ**を 測ります。
          ★ ★★320×568 ／ 320×480 ／ 812×375（横向き）／ 1280×900 で 走らせて ください。
       ============================================================ */
    var READ24 = { FONT_MIN: 16, VS_BUBBLE: 1.3, ARROW_X: 1.5, CONTRAST: 4.5, LINES: 2, OPACITY: 0.95 };
    var r24 = { win: window.innerWidth + '×' + window.innerHeight, rows: [], why: [], mihon: null, measured: 0 };
    (function () {
      if (document.visibilityState !== 'visible') {
        r24.why.push('★★ページが 前に 出て いません（' + document.visibilityState + '）―― ★大きさは 測れません');
        return;
      }
      if (!passGuide || !guideArrow || !guideText || !feltTable || !sayEl) { r24.why.push('★部品が ありません（passGuide／arrow／text／felt／say）'); return; }
      var keepG = g, keepBusy = busy, keepOver = over, keepPicks = picks, keepMatch = match;
      var kTitleHid = titleScreen.classList.contains('hidden'), kPlayHid = playScreen.classList.contains('hidden');
      var kSay24 = sayEl.textContent, kSayHid24 = sayEl.classList.contains('hidden');   /* ★ T214-2 ―― ★㉓ と 同じく ふきだしも 元に もどす */
      /* ★ T214-3 ―― ★ここも 本物の newDeal を 通す ＝ ★結果の 箱を 消して しまいます（★㉓ と 同じ 直し）*/
      var kResultHid24 = resultWrap.classList.contains('hidden');
      var kLvHid24 = levelPickResult.classList.contains('hidden');
      var kLock24 = resultBox.classList.contains('is-locked');
      var kScore24 = resultScore.innerHTML, kRSay24 = resultSay.textContent;
      var kRank24 = rankSnap();                                   /* ★ T217 */
      var kRTitle24 = resultTitle.textContent, kRCls24 = resultTitle.className, kNext24 = btnNext.innerHTML;
      var tMark = timers.length;
      titleScreen.classList.add('hidden'); playScreen.classList.remove('hidden');
      match = C.newMatch(C.LEVEL_START);
      build(); layout();

      function lum(c) { c = c.map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
      function rgba(s) { var m = (s || '').match(/[\d.]+/g) || []; return { r: +m[0] || 0, g: +m[1] || 0, b: +m[2] || 0, a: (m.length > 3 ? +m[3] : 1) }; }
      function over_(fg, bg) { var a = fg.a; return { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a), a: 1 }; }
      function ratio(c1, c2) { var l1 = lum([c1.r, c1.g, c1.b]), l2 = lum([c2.r, c2.g, c2.b]); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); }
      /* ★ 台の みどり（★器が すきとおって いる ときの 下地）*/
      var feltIn = feltTable.firstElementChild;
      var green = rgba(feltIn ? getComputedStyle(feltIn).backgroundColor : 'rgb(130,206,132)');
      if (!green.a) green = { r: 130, g: 206, b: 132, a: 1 };

      function hakaru() {
        if (passGuide.classList.contains('hidden')) return { shown: false };
        var cs = getComputedStyle(passGuide), ct = getComputedStyle(guideText), ca = getComputedStyle(guideArrow), cb = getComputedStyle(sayEl);
        var pr = passGuide.getBoundingClientRect(), tr = guideText.getBoundingClientRect(), ar = guideArrow.getBoundingClientRect();
        var bg = over_(rgba(cs.backgroundColor), green);
        var tcol = over_(rgba(ct.color), bg), acol = over_(rgba(ca.color), bg);
        var f = parseFloat(ct.fontSize), lh = parseFloat(ct.lineHeight);
        if (isNaN(lh)) lh = f * 1.35;
        var m = {
          shown: true, font: f, bubble: parseFloat(cb.fontSize), arrowH: Math.round(ar.height * 10) / 10,
          lines: Math.round(tr.height / lh * 10) / 10,
          cText: Math.round(ratio(tcol, bg) * 100) / 100, cArrow: Math.round(ratio(acol, bg) * 100) / 100,
          clipped: guideText.scrollWidth > guideText.clientWidth + 1,
          gone: cs.display === 'none' || cs.visibility !== 'visible' || parseFloat(cs.opacity) < READ24.OPACITY ||
                ct.visibility !== 'visible' || parseFloat(ct.opacity) < READ24.OPACITY,
          w: Math.round(pr.width), h: Math.round(pr.height), text: guideText.textContent, arrow: guideArrow.textContent
        };
        m.ok = !isNaN(m.font) && m.w > 0 && m.h > 0 && m.arrowH > 0 && !isNaN(m.bubble);
        return m;
      }
      function yomeru(m) {
        /* ★ 読めない 理由を ぜんぶ 返す（★1つでも あれば 読めない）*/
        var bad = [];
        if (m.font < READ24.FONT_MIN) bad.push('字 ' + m.font + 'px（' + READ24.FONT_MIN + 'px 未満）');
        if (m.font < m.bubble * READ24.VS_BUBBLE) bad.push('字 ' + m.font + 'px は ふきだし ' + m.bubble + 'px の ' + READ24.VS_BUBBLE + '倍 未満');
        if (m.arrowH < m.font * READ24.ARROW_X) bad.push('矢印 たけ ' + m.arrowH + 'px（字の ' + READ24.ARROW_X + '倍 未満）');
        if (m.cText < READ24.CONTRAST) bad.push('字の へだたり ' + m.cText + ':1（' + READ24.CONTRAST + ' 未満）');
        if (m.cArrow < READ24.CONTRAST) bad.push('矢印の へだたり ' + m.cArrow + ':1');
        if (m.lines > READ24.LINES + 0.2) bad.push('文が ' + m.lines + '行');
        if (m.clipped) bad.push('文が 切れて いる');
        if (m.gone) bad.push('消されて いる（display／visibility／すきとおり）');
        return bad;
      }

      still(function () {
        [0, 1, 2].forEach(function (dn) {
          match.dealNo = dn;
          newDeal();                                  /* ★ 本物の 道（★㉓ と 同じ）*/
          var m = hakaru();
          var row = { '★何回目': (dn + 1) + '回目', '★出て いる': m.shown ? '○' : '―' };
          if (!m.shown) { r24.rows.push(row); return; }          /* ★ 出て いない のは ㉓ が 鳴らします */
          /* ★ 下の線 ―― 測れて いない */
          if (!m.ok) { r24.why.push((dn + 1) + '回目：★★測れて いません（' + m.w + '×' + m.h + 'px・字 ' + m.font + '・矢印 ' + m.arrowH + '）'); r24.rows.push(row); return; }
          r24.measured++;
          row['★字'] = m.font + 'px'; row['★ふきだし'] = m.bubble + 'px'; row['★矢印'] = m.arrowH + 'px';
          row['★へだたり'] = m.cText + ' / ' + m.cArrow; row['★行'] = m.lines;
          /* ★ 上の線 */
          var bad = yomeru(m);
          if (bad.length) r24.why.push((dn + 1) + '回目（' + m.arrow + '）：★★読めません ―― ' + bad.join('・'));
          r24.rows.push(row);

          /* ★★ 見本の 線（★1回だけ・いちばん 長い 文の 回＝3回目 で）★★
             ★ ★決め打ちで 壊す → 「読めない」と 出る はず → 元に もどす */
          if (dn === 2) {
            var kFont = guideText.style.fontSize, kColor = guideText.style.color;
            guideText.style.fontSize = '9px';
            var small = hakaru(), badSmall = small.shown && small.ok ? yomeru(small) : ['測れず'];
            guideText.style.fontSize = kFont;
            guideText.style.color = getComputedStyle(passGuide).backgroundColor;   /* ★ 字を 地と 同じ 色に */
            var pale = hakaru(), badPale = pale.shown && pale.ok ? yomeru(pale) : ['測れず'];
            guideText.style.color = kColor;
            r24.mihon = { small: badSmall.some(function (s) { return /字 9px/.test(s); }),
                          pale:  badPale.some(function (s) { return /字の へだたり/.test(s); }),
                          smallSaw: small.font, paleSaw: pale.cText };
            var back = hakaru();
            if (back.shown && back.ok && (back.font !== m.font || back.cText !== m.cText)) {
              r24.why.push('★★見本を 元に もどせて いません（字 ' + back.font + '／へだたり ' + back.cText + '）');
            }
          }
        });
      });

      for (var tt = timers.length - 1; tt >= tMark; tt--) { clearTimeout(timers[tt]); timers.splice(tt, 1); }
      dropCards();
      picks = keepPicks; g = keepG; busy = keepBusy; over = keepOver; match = keepMatch;
      if (kTitleHid) titleScreen.classList.add('hidden'); else titleScreen.classList.remove('hidden');
      if (kPlayHid) playScreen.classList.add('hidden'); else playScreen.classList.remove('hidden');
      /* ★ T214-3 ―― ★newDeal が 消した ものを 1つ 残らず 戻す */
      resultTitle.textContent = kRTitle24; resultTitle.className = kRCls24;
      resultSay.textContent = kRSay24; resultScore.innerHTML = kScore24; btnNext.innerHTML = kNext24;
      rankPut(kRank24);                                           /* ★ T217 */
      if (kLock24) resultBox.classList.add('is-locked'); else resultBox.classList.remove('is-locked');
      if (kLvHid24) levelPickResult.classList.add('hidden'); else levelPickResult.classList.remove('hidden');
      if (kResultHid24) resultWrap.classList.add('hidden'); else resultWrap.classList.remove('hidden');
      sayEl.textContent = kSay24;
      if (kSayHid24) sayEl.classList.add('hidden'); else sayEl.classList.remove('hidden');
      layout();
      if (g) { rebuild(); placeAll(true); }
    })();

    for (var i24 = 0; i24 < r24.why.length; i24++) ng.push('★★㉔ わたす 案内が 読めるか：' + r24.why[i24]);
    /* ★ 下の線 ―― ★1回も 測れて いないのに 通さない（★案内が 出なかった ときは ㉓ が 鳴って いる はず。★それでも ここでも 言う）*/
    if (!r24.measured && !r24.why.length) ng.push('★★★㉔ 読める 大きさを 1回も 測れて いません（★案内が 1度も 出ませんでした）');
    /* ★ 見本の 線 ―― ★見張り 自身が 生きて いるか */
    if (r24.measured && (!r24.mihon || !r24.mihon.small || !r24.mihon.pale)) {
      ng.push('★★★㉔ わざと 壊しても「読めない」と 出ません（字 9px→' + (r24.mihon ? r24.mihon.smallSaw : '―') +
              'px・うすい 字→へだたり ' + (r24.mihon ? r24.mihon.paleSaw : '―') + '）―― ★★画面では なく **見張りの ほうが 壊れて います**');
    }
    note['㉔ ★★わたす 案内が 読めるか'] = r24.win + ' … ' + r24.rows.map(function (r) {
      return r['★何回目'] + ' ' + (r['★字'] ? ('字 ' + r['★字'] + '（ふきだし ' + r['★ふきだし'] + '）・矢印 ' + r['★矢印'] + '・へだたり ' + r['★へだたり'] + '・' + r['★行'] + '行') : '―');
    }).join('／') + '／★線：字 ' + READ24.FONT_MIN + 'px・ふきだしの ' + READ24.VS_BUBBLE + '倍・矢印 ' + READ24.ARROW_X + '倍・へだたり ' + READ24.CONTRAST +
      '／★見本 ' + (r24.mihon && r24.mihon.small && r24.mihon.pale ? '鳴る（★見張りは 生きて います）' : '★鳴らない') +
      /* ⚠️★★★ T223 で 書き直しました（★🧪トライ T222 §7 の 名ざし）★★★
         ★ ★前の 文：「⚠️4画面（320×568・320×480・812×375・**1280×900**）で 走らせて ください」
         ★ ★★ずれて いた ところは 2つ ―― ★①**設計図 追記⑥（2026-09-04）で 9画面に なりました**。
           ★ ★★②**1280×900 は どこにも 実在しません**（★㉟ の 一覧に あるのは 1280×**800**）。
         ★ ★★★この 2行は、★次の 人に「4画面で いい」と 教えて しまいます。 */
      '／⚠️★★9画面 ぜんぶで 走らせて ください（★設計図 追記⑥ ―― ★320×568・320×480・812×375・667×375・844×390・736×414・926×428・320×454・568×320）';

    /* ============================================================
       ㉕ ★★★横向きで、★案内が 出て いる 間は ふきだしが 消え、★★案内が 消えたら **戻る** か（T215-2・🎨アト）★★★
       ------------------------------------------------------------
       ★ この かたまりを `verify()` の 中（★㉔ の note の 後ろ・`var out = {` の 前）に
         ★ そのまま 貼れば 動きます。★使う ものは verify が 前から 持って いる もの だけ：
           ★ `ng` ／ `note` ／ `g` `busy` `over` `picks` `match` ／ `titleScreen` `playScreen`
           ★ `passGuide` `sayEl` ／ `build` `layout` `newDeal` `doPassGo` `say` `passSay` `refreshPick`
           ★ `still` `timers` `dropCards` `rebuild` `placeAll` `C`。★新しい 部品は 0個。

       ★★ 何を 見張るか（★社長裁定 2026-09-03「1 ＝ 消す」）★★
         ★ ★横向き（max-height:420px）で、★★案内が 出て いる 間だけ ふきだしを 消しました。
         ★ ★★消しっぱなしに したら 大事故 です ―― ★ハッピーは その あとも しゃべります
           （「同じ マークの 札を 出そう！」「13点…」）。★★横向きは かおも 名前も 出ない ので、
           ★ ★★ふきだしが 死ぬと **ハッピーが 画面から 消えます**（★設計図 §9.5 違反）。
         ★ ★たて（320×568・320×480）は **1pxも 変えて いません** ―― ★それも ここで 見張ります。

       ⚠️★★ 「hidden が 付いて いるか」では 見ません ★★
          ★ ★`say('')` は わたし終わった しゅんかんに **わざと** `hidden` を 付けます（★正しい 動き）。
          ★ ★★見たいのは「**CSS が 殺して いないか**」です。★→ ★どの 場面でも
            ★ ★★**わざと ふきだしに 文を 入れて hidden を 外して から**、`display` を 見ます。

       ★★ 3つの 場面 ★★
         ★ ①案内が 出て いる（1回目・←）  … ★横向き＝消える ／ ★★たて＝見える
         ★ ②わたし終わって 案内が 消えた … ★★どちらも **見える**（★ここが「戻る」の 線）
         ★ ③わたさない 回（4回目）        … ★★どちらも **見える**（★案内が 1度も 出ない 回）

       ★★ 3本の 線 ★★
         | ★上の線 | ①②③が 上の とおりで ない → 鳴る |
         | ★下の線 | ★★測れて いない ときも 鳴る（部品が 無い・大きさ 0・ページが 前に 出て いない）／
         |         | ★★**②③で 戻って いない ＝「消えっぱなし」** も ここで 鳴る |
         | ★見本の線 | ★毎回 決め打ちで 2通り 壊して、鳴る ことを 確かめて から 元に もどす |
       ============================================================ */
    var r25 = { win: window.innerWidth + '×' + window.innerHeight, flat: false, rows: [], why: [], mihon: null, cases: 0 };
    (function () {
      if (document.visibilityState !== 'visible') {
        r25.why.push('★★ページが 前に 出て いません（' + document.visibilityState + '）―― ★見え方は 測れません');
        return;
      }
      if (!passGuide || !sayEl) { r25.why.push('★部品が ありません（passGuide ／ say）'); return; }
      /* ✅★★ T221 ―― ★★3か所の うちの ③（★上の ② と 1文字ちがわず 同じ 文に そろえる）*/
      r25.flat = !!(window.matchMedia && window.matchMedia('(max-height:420px), (max-height:479px) and (min-width:568px)').matches);

      var keepG = g, keepBusy = busy, keepOver = over, keepPicks = picks, keepMatch = match;
      var kTitleHid = titleScreen.classList.contains('hidden'), kPlayHid = playScreen.classList.contains('hidden');
      var kSay = sayEl.textContent, kSayHid = sayEl.classList.contains('hidden');
      /* ⚠️★★★ T214-4（💻コーダ）―― ★★上の 書き置きが、★貼った その日に 当たりました ★★★
         ★ ★この かたまりは 本物の `newDeal()` を 2回・`doPassGo()` を 1回 通します。
         ★ ★`newDeal()` は **結果の 箱（resultWrap）と つよさの えらび（levelPickResult）を 消します**。
         ★ → ★★「1回 おわり」の 画面で verify() を 呼ぶと ―― ★★result true → false。
           ★ ★★★「つぎへ」が 画面から 消えて、★★遊びが そこで 止まって いました【実測・T214-4】。
         ★ ★★T214-3 で ㉓㉔ を 直した のと **1文字ちがわず 同じ 穴** です。★見張りが 見張る 相手を 殺します。
         ★ ★★★本物の 道を 通す 見張りを 足す 人は、★かならず 下の 6つを 覚えて 戻して ください。 */
      var kResultHid25 = resultWrap.classList.contains('hidden');
      var kLvHid25 = levelPickResult.classList.contains('hidden');
      var kLock25 = resultBox.classList.contains('is-locked');
      var kScore25 = resultScore.innerHTML, kRSay25 = resultSay.textContent;
      var kRank25 = rankSnap();                                   /* ★ T217 */
      var kRTitle25 = resultTitle.textContent, kRCls25 = resultTitle.className, kNext25 = btnNext.innerHTML;
      var tMark = timers.length;
      titleScreen.classList.add('hidden'); playScreen.classList.remove('hidden');
      match = C.newMatch(C.LEVEL_START);
      build(); layout();

      /* ★★ ふきだしに わざと 文を 入れて hidden を 外し、★CSS が 殺して いないかを 見る ★★
         ★ ★（★hold 0 ＝ ひとりでに 消えない。★あとで 元に もどします）*/
      function mieru(name) {
        say('たしかめの ひとこと', 0);                 /* ★ 決め打ちの 文（★画面の 値から 作って いません）*/
        var c = getComputedStyle(sayEl), b = sayEl.getBoundingClientRect();
        var m = {
          場面: name,
          案内: !passGuide.classList.contains('hidden'),
          display: c.display, visibility: c.visibility, opacity: +c.opacity,
          w: Math.round(b.width * 10) / 10, h: Math.round(b.height * 10) / 10,
          font: parseFloat(c.fontSize) || 0
        };
        m.見える = c.display !== 'none' && c.visibility === 'visible' && +c.opacity > 0.05 && b.width > 0 && b.height > 0;
        m.測れた = !isNaN(m.font) && m.font > 0 && !!c.display;
        return m;
      }
      function shirabe(m, wantMieru, naze) {
        r25.rows.push(m);
        if (!m.測れた) { r25.why.push(m.場面 + '：★★測れて いません（字 ' + m.font + '・' + m.w + '×' + m.h + 'px）'); return; }
        r25.cases++;
        if (m.見える !== wantMieru) {
          r25.why.push(m.場面 + '：★★ふきだしが ' + (m.見える ? '**消えて いません**' : '**戻って いません**') +
                       '（display ' + m.display + '・' + m.w + '×' + m.h + 'px）―― ' + naze);
        }
      }

      still(function () {
        /* ★ ① 案内が 出て いる（1回目・←）*/
        match.dealNo = 0;
        newDeal();
        var m1 = mieru('①案内が 出て いる');
        if (!m1.案内) r25.why.push('①：★案内が 出て いません（★㉓ が 鳴って いる はず）');
        shirabe(m1, !r25.flat, r25.flat ? '★横向きは 出て いる 間だけ 消す（★同じ 文が 2.7倍で 2px 下に ある）'
                                        : '★たては 1pxも 変えて いません（★消えたら たてに 手が 入って います）');

        /* ★ ② わたし終わって 案内が 消えた（★本物の doPassGo を 通す）*/
        busy = false; picks = {};
        picks[g.hands[0][0].id] = 1; picks[g.hands[0][1].id] = 1; picks[g.hands[0][2].id] = 1;
        refreshPick();
        doPassGo();
        var m2 = mieru('②わたし終わった');
        if (m2.案内) r25.why.push('②：★案内が 出っぱなし です（★㉓ が 鳴って いる はず）');
        shirabe(m2, true, '★★ハッピーは この あとも しゃべります（「同じ マークの 札を 出そう！」）');

        /* ★ ③ わたさない 回（4回目）―― ★案内が 1度も 出ない 回 */
        match.dealNo = 3;
        newDeal();
        var m3 = mieru('③わたさない 回');
        if (m3.案内) r25.why.push('③：★わたさない 回なのに 案内が 出て います（★㉓ が 鳴って いる はず）');
        shirabe(m3, true, '★案内が 1度も 出ない 回 です');

        /* ============================================================
           ★★ 見本の 線 ―― ★毎回 わざと 壊して、鳴る ことを 確かめる ★★
             ★ ★見本A：★ふきだしを **いつでも** 消す → ★②が「戻って いない」と 出る はず（★たて・横 とも）
             ★ ★見本B：★案内が 出て いる 間も **むりやり 出す** → ★①が「消えて いません」と 出る はず
               ★ ★（★★これは 横向きでしか 変わりません ―― ★たてでは もともと 出て いる ため）
             ★ ★どちらも **決め打ちの CSS**。★画面の 値から 作って いません。
           ============================================================ */
        var stA = document.createElement('style');
        stA.textContent = '#say{display:none!important}';
        document.head.appendChild(stA);
        var a2 = mieru('見本A');
        document.head.removeChild(stA);

        var stB = document.createElement('style');
        stB.textContent = '.play-screen:has(#passGuide:not(.hidden)) .talk .banner{display:block!important}';
        document.head.appendChild(stB);
        match.dealNo = 0; newDeal();
        var b1 = mieru('見本B');
        document.head.removeChild(stB);

        /* ★ 元に もどせた かも 見る（★見本を 外した あと、①が また 正しい 形に なるか）*/
        match.dealNo = 0; newDeal();
        var back = mieru('見本の あと');
        r25.mihon = {
          A: a2.測れた && a2.見える === false,                       /* ★ 消える はず */
          B: !r25.flat ? null : (b1.測れた && b1.見える === true),    /* ★ 横向きだけ 見える はず */
          もどった: back.測れた && back.見える === !r25.flat
        };
      });

      for (var tt = timers.length - 1; tt >= tMark; tt--) { clearTimeout(timers[tt]); timers.splice(tt, 1); }
      dropCards();
      picks = keepPicks; g = keepG; busy = keepBusy; over = keepOver; match = keepMatch;
      sayEl.textContent = kSay;
      if (kSayHid) sayEl.classList.add('hidden'); else sayEl.classList.remove('hidden');
      if (kTitleHid) titleScreen.classList.add('hidden'); else titleScreen.classList.remove('hidden');
      if (kPlayHid) playScreen.classList.add('hidden'); else playScreen.classList.remove('hidden');
      /* ★ T214-4 ―― ★newDeal が 消した ものを 1つ 残らず 戻す（★㉓㉔ と 同じ 6つ）*/
      resultTitle.textContent = kRTitle25; resultTitle.className = kRCls25;
      resultSay.textContent = kRSay25; resultScore.innerHTML = kScore25; btnNext.innerHTML = kNext25;
      rankPut(kRank25);                                           /* ★ T217 */
      if (kLock25) resultBox.classList.add('is-locked'); else resultBox.classList.remove('is-locked');
      if (kLvHid25) levelPickResult.classList.add('hidden'); else levelPickResult.classList.remove('hidden');
      if (kResultHid25) resultWrap.classList.add('hidden'); else resultWrap.classList.remove('hidden');
      layout();
      if (g) { rebuild(); placeAll(true); }
    })();

    for (var i25 = 0; i25 < r25.why.length; i25++) ng.push('★★㉕ 横向きの ふきだし：' + r25.why[i25]);
    /* ★ 下の線 ―― ★1場面も 測れて いないのに 通さない */
    if (!r25.cases && !r25.why.length) ng.push('★★★㉕ ふきだしの 見え方を 1場面も 測れて いません（★試し方が おかしい）');
    if (r25.cases && r25.cases < 3) ng.push('★★㉕ 3場面の うち ' + r25.cases + '場面 しか 測れて いません');
    /* ★ 見本の 線 ―― ★見張り 自身が 生きて いるか */
    if (r25.cases && r25.mihon) {
      if (!r25.mihon.A) ng.push('★★★㉕ ふきだしを わざと 消しても 気づきません ―― ★★画面では なく **見張りの ほうが 壊れて います**');
      if (r25.mihon.B === false) ng.push('★★★㉕ 案内の 間に わざと ふきだしを 出しても 気づきません ―― ★★**見張りの ほうが 壊れて います**');
      if (!r25.mihon.もどった) ng.push('★★★㉕ 見本を 元に もどせて いません（★あとの 数字が 信じられません）');
    }
    note['㉕ ★★横向きの ふきだし'] = r25.win + (r25.flat ? '（★横向き）' : '（★たて）') + ' … ' +
      r25.rows.filter(function (r) { return r.場面.indexOf('見本') < 0; }).map(function (r) {
        return r.場面 + ' ' + (r.測れた ? (r.見える ? '見える ' + r.font + 'px' : '★消えて いる') : '★測れず');
      }).join('／') + '／★決まり：' + (r25.flat ? '案内の 間は 消す・消えたら 戻る' : '★たては いつも 見える（1pxも 変えて いない）') +
      '／★見本 A ' + (r25.mihon && r25.mihon.A ? '鳴る' : '★鳴らない') +
      '・B ' + (!r25.mihon ? '―' : (r25.mihon.B === null ? '―（たてでは 効かない 見本）' : (r25.mihon.B ? '鳴る' : '★鳴らない'))) +
      /* ⚠️★ T223 で 書き直しました（★同上・★前は「3画面（320×568・320×480・812×375）」）*/
      '／⚠️★★9画面 ぜんぶで 走らせて ください（★設計図 追記⑥）';

    /* ============================================================
       ㉖㉗ ★★★ハートブレイクの 知らせ（★T217・社長ご指示 2026-09-04）★★★
       ------------------------------------------------------------
       ★★ ㉖ ―― ★出る／消える／わたす 案内と ぶつからない（★上の線・下の線・見本の線）
       ★★ ㉗ ―― ★★場の 札と どれだけ 被るか（★4人ぶんが 出そろった 場面で 面積を 測る）

       ⚠️★★ ここは **本物の 道** を 通します（★`C.playIdx` が heartsBroken を 立てる → `breakWatch`）。
          ★ ★★＝ ★`showBreak()` を 直に 呼んで「出た」と 言っては いけません。
            ★ ★それだと **配線が 外れて いても 通ります**（★見張って いる ふり・2つ目の 形）。
       ⚠️★★ 終わったら 画面を 元どおりに 戻します（★★私が 今日 3度 踏んだ 穴。★verify の 頭の 書き置き）。
       ============================================================ */
    /* ★★ 線は 測って から 引きました【実測・T217・4枚 出そろった 場面・6画面】★★
       | 画面 | ★知らせの うち 札に かぶられた | ★札の うち 知らせが かぶった |
       |---|---|---|
       | 320×568 | 25.2% | 34.7% |
       | 320×480 | ★★27.8%（いちばん 深い）| 33.6% |
       | 812×375 | 8.8% | 40.3% |
       | 667×375 | 9.4% | 26.8% |
       | 844×390 | 9.1% | ★★40.3% |
       | 736×414 | 10.0% | 27.8% |
       ★ ★★被りを 0 には できません ―― ★札は 台の たてを ほぼ ぜんぶ 使い、★★上の すきまは −1〜10px。
       ★ ★線：★知らせの 側 35%（★実測の いちばん 深い 27.8% の 1.26倍）
       ★ ★　　★札の 側 50%（★実測の いちばん 深い 40.3% の 1.24倍）
       ★ ★★どちらも「★これ以上 深く なったら 知らせる」ための 線 です。★★いまの 数字を 通す ためだけの
         ★ ★★線には して いません（★1.2倍 以上 の 余りを 取って います）。 */
    var BREAK_OVER_MAX = 35;      /* ★ 知らせの 面積の うち 札に かぶられて よい 割合（%）*/
    var BREAK_ONCARD_MAX = 50;    /* ★ 札の 面積の うち 知らせが かぶって よい 割合（%）*/
    var r26 = { on0: null, onBreak: null, offAfter: null, both: 0, plies: 0, why: [],
                mihon: null, box: '―', font: 0, over: [], worst: -1, cases: 0 };
    (function () {
      if (document.visibilityState !== 'visible') {
        r26.why.push('★★ページが 前に 出て いません（' + document.visibilityState + '）―― ★見え方は 測れません');
        return;
      }
      var keepG = g, keepBusy = busy, keepOver = over, keepPicks = picks, keepMatch = match;
      var kTitleHid = titleScreen.classList.contains('hidden'), kPlayHid = playScreen.classList.contains('hidden');
      var kResultHid26 = resultWrap.classList.contains('hidden');
      var kLvHid26 = levelPickResult.classList.contains('hidden');
      var kLock26 = resultBox.classList.contains('is-locked');
      var kScore26 = resultScore.innerHTML, kRSay26 = resultSay.textContent;
      var kRTitle26 = resultTitle.textContent, kRCls26 = resultTitle.className, kNext26 = btnNext.innerHTML;
      var kRank26 = rankSnap();
      var kSay26 = sayEl.textContent, kSayHid26 = sayEl.classList.contains('hidden');
      var kBreakHid = !breakNote || breakNote.classList.contains('hidden');
      var kBreakAt = breakAt;
      var tMark = timers.length;
      titleScreen.classList.add('hidden'); playScreen.classList.remove('hidden');
      resultWrap.classList.add('hidden');
      if (!match) match = C.newMatch(C.LEVEL_START);
      build(); layout();
      function shown() { return !!(breakNote && !breakNote.classList.contains('hidden')); }

      still(function () {
        /* ============================================================
           ★ ㉖-① ★★本物の 道で 割る ―― ★ハートを 出すまでは 出ない／出したら 出る
           ★ ★種は 決め打ち。★手札を 作って、★ハートしか 出せない 形に して から 出します。
           ============================================================ */
        dropCards(); picks = {}; busy = false; over = false; hideBreak();
        g = C.makeGame(C.rng(20260905), { rules: rules, dealNo: 0 });
        g.phase = 'play'; g.over = false; g.trickNo = 3; g.trick = []; g.leadSuit = -1; g.cur = 0;
        g.heartsBroken = false;
        rebuild(); placeAll(true);
        r26.on0 = shown();
        if (r26.on0) r26.why.push('★★ハートが 割れる 前なのに 知らせが 出て います');

        /* ⚠️★★ ここで 1度 つまずきました（★私の 手落ち・★書いて 残します）★★
           ★ ★はじめ「人が 先に ハートを 出す」場面を 作りました ―― ★★1枚も 出ませんでした。
           ★ ★正体：★★決まり8「ハートが 割れる 前は ハートから 先に 出せない」。
             ★ ★★＝ ★先に 出す 人は ハートを 出せません。★★試し方の ほうが 決まりに 反して いました。
           ★ ★→ ★★正しい 形：★★ほかの 席が **ハート以外**で 先に 出し、★人は その マークを 持って いない。
             ★ ★そこで ハートを 捨てる ―― ★★これが 本物の 「ハートブレイク」です。 */
        var i, p, k, hi = -1, S = -1;
        /* ★ ① 人が 1枚も 持って いない マーク（★ハート以外）を さがす */
        for (k = 0; k < 4 && S < 0; k++) {
          if (k === C.HEART) continue;
          if (suitCountIn(0, k) === 0) S = k;
        }
        /* ★ ② 無ければ 作る ―― ★人の その マークを ぜんぶ ほかの 席へ（★52枚は 保つ）*/
        if (S < 0) {
          var best = -1, bestN = 99;
          for (k = 0; k < 4; k++) {
            if (k === C.HEART) continue;
            var cN = suitCountIn(0, k);
            if (cN > 0 && cN < bestN) { bestN = cN; best = k; }
          }
          if (best >= 0) {
            for (i = g.hands[0].length - 1; i >= 0; i--) {
              if (C.suitOf(g.hands[0][i].c) !== best) continue;
              for (p = 1; p < 4; p++) {
                var swapAt = -1;
                for (var q2 = 0; q2 < g.hands[p].length; q2++) {
                  if (C.suitOf(g.hands[p][q2].c) !== best && C.suitOf(g.hands[p][q2].c) !== C.HEART) { swapAt = q2; break; }
                }
                if (swapAt < 0) continue;
                var mine = g.hands[0].splice(i, 1)[0], theirs = g.hands[p].splice(swapAt, 1)[0];
                g.hands[0].push(theirs); g.hands[p].push(mine);
                break;
              }
            }
            if (suitCountIn(0, best) === 0) S = best;
          }
        }
        /* ★ ③ 人に ハートを 1枚（★無ければ 入れかえる）*/
        for (i = 0; i < g.hands[0].length; i++) if (C.suitOf(g.hands[0][i].c) === C.HEART) { hi = i; break; }
        if (hi < 0) {
          for (p = 1; p < 4 && hi < 0; p++) {
            for (i = 0; i < g.hands[p].length; i++) {
              if (C.suitOf(g.hands[p][i].c) !== C.HEART) continue;
              var give = g.hands[p].splice(i, 1)[0], back = g.hands[0].pop();
              g.hands[0].push(give); g.hands[p].push(back);
              hi = g.hands[0].length - 1; break;
            }
          }
        }
        /* ★ ④ 先に 出す 席（3）に S の 札を 1枚（★無ければ 入れかえる）*/
        var LEAD = 3, li = -1;
        if (S >= 0) {
          for (i = 0; i < g.hands[LEAD].length; i++) if (C.suitOf(g.hands[LEAD][i].c) === S) { li = i; break; }
          if (li < 0) {
            for (p = 1; p < 4 && li < 0; p++) {
              if (p === LEAD) continue;
              for (i = 0; i < g.hands[p].length; i++) {
                if (C.suitOf(g.hands[p][i].c) !== S) continue;
                var g2 = g.hands[p].splice(i, 1)[0], b2 = g.hands[LEAD].pop();
                g.hands[LEAD].push(g2); g.hands[p].push(b2);
                li = g.hands[LEAD].length - 1; break;
              }
            }
          }
        }
        rebuild(); placeAll(true);
        if (S < 0 || hi < 0 || li < 0) {
          r26.why.push('★★試し方が おかしい ―― ★ハートを 捨てられる 場面を 作れませんでした（マーク ' + S + '・ハート ' + hi + '・先に 出す ' + li + '）');
          return;
        }
        /* ★ ⑤ 席3 が S で 先に 出す（★本物の 道）*/
        g.cur = LEAD; g.lead = LEAD; g.trick = []; g.leadSuit = -1;
        var rl = C.playIdx(g, LEAD, li);
        if (!rl.ok) { r26.why.push('★★試し方が おかしい ―― ★先に 出す 札が 出ませんでした'); return; }
        if (!cardEl[rl.id]) makeCard({ id: rl.id, c: rl.card }, true);
        faceUp(rl.id, true); placeAll(true);
        /* ★ ⑥ 人の 番に して、★ハートを 捨てる ―― ★★本物の playHuman を 通す */
        g.cur = 0;
        var hi2 = -1;
        for (i = 0; i < g.hands[0].length; i++) if (C.suitOf(g.hands[0][i].c) === C.HEART) { hi2 = i; break; }
        var legal = C.legalIdx(g, 0);
        if (hi2 < 0 || legal.indexOf(hi2) < 0) {
          r26.why.push('★★試し方が おかしい ―― ★ハートが 出せる 形に なりませんでした');
          return;
        }
        var wasN = g.hands[0].length;
        playHuman(hi2);
        r26.onBreak = shown();
        r26.plies = wasN - g.hands[0].length;
        if (r26.plies !== 1) r26.why.push('★★試し方が おかしい ―― ★1枚も 出て いません');
        else if (!g.heartsBroken) r26.why.push('★★試し方が おかしい ―― ★ハートが 割れて いません');
        else if (!r26.onBreak) {
          r26.why.push('★★★ハートを 出したのに 知らせが 出ません（★配線が つながって いません）');
        }
        if (shown()) {
          var b = breakNote.getBoundingClientRect();
          var f = feltTable.getBoundingClientRect();
          r26.box = Math.round(b.left) + ',' + Math.round(b.top) + ' ' + Math.round(b.width) + '×' + Math.round(b.height);
          r26.font = Math.round((parseFloat(getComputedStyle(breakNote).fontSize) || 0) * 10) / 10;
          if (!(r26.font >= 11)) r26.why.push('★★知らせの 字が ' + r26.font + 'px（★11px 以上 の はず）');
          if (b.width <= 0 || b.height <= 0) r26.why.push('★★知らせの 大きさが 0 です');
          if (b.top < f.top - 0.5 || b.bottom > f.bottom + 0.5 ||
              b.left < f.left - 0.5 || b.right > f.right + 0.5) {
            r26.why.push('★★知らせが 台から はみ出して います（★台 ' + Math.round(f.top) + '〜' + Math.round(f.bottom) +
                         '／知らせ ' + Math.round(b.top) + '〜' + Math.round(b.bottom) + '）');
          }
          if (breakNote.textContent.indexOf('ハートブレイク') < 0) {
            r26.why.push('★知らせに「ハートブレイク」の 字が ありません');
          }
          /* ⚠️★ 追記② の 線 ―― ★★手の 教えに なって いないか */
          if (/出そう|出して|出すと よい|おすすめ/.test(breakNote.textContent)) {
            r26.why.push('★★★知らせが 手を 教えて います（★設計図 追記②）：「' + breakNote.textContent + '」');
          }
        }

        /* ============================================================
           ★ ㉖-② ★★消える ―― ★場が 空に なって 1600ms 経ったら 消える
           ★ ★時間は 待ちません（★待つと 測りが ぶれます）。★★「もう 1600ms 経った」形に して から
             ★ ★本物の `breakDue()` を 呼び、★その場で 消える ことを 見ます。
           ============================================================ */
        if (shown()) {
          breakAt = Date.now() - BREAK_HOLD_MIN - 1;
          breakDue();
          r26.offAfter = !shown();
          if (!r26.offAfter) r26.why.push('★★★場が 空に なっても 知らせが 消えません（★出しっぱなし）');
        }

        /* ============================================================
           ★ ㉗ ★★被り ―― ★4人ぶんの 札が 出そろった 場面で 面積を 測る
           ============================================================ */
        dropCards(); picks = {}; busy = false; over = false; hideBreak();
        g = C.makeGame(C.rng(20260906), { rules: rules, dealNo: 0 });
        rebuild();
        if (makePlayScene(3)) {
          var L = C.legalIdx(g, 0);
          if (L.length) {
            var rr = C.playIdx(g, 0, L[0]);
            if (rr.ok) {
              if (!cardEl[rr.id]) makeCard({ id: rr.id, c: rr.card }, true);
              faceUp(rr.id, true);
            }
          }
          placeAll(true);
          showBreak();                         /* ★ ここは 場面づくり（★出す 配線は ㉖-① で 見ました）*/
          if (shown() && g.trick.length) {
            var nb = breakNote.getBoundingClientRect();
            var area = nb.width * nb.height, cover = 0, each = [];
            for (i = 0; i < g.trick.length; i++) {
              var ce = cardEl[g.trick[i].id];
              if (!ce || !ce.parentNode) continue;
              var cq = ce.getBoundingClientRect();
              var w = Math.max(0, Math.min(nb.right, cq.right) - Math.max(nb.left, cq.left));
              var h = Math.max(0, Math.min(nb.bottom, cq.bottom) - Math.max(nb.top, cq.top));
              cover += w * h;
              each.push(Math.round(w * h));
            }
            r26.cases = g.trick.length;
            r26.worst = area > 0 ? Math.round(cover / area * 1000) / 10 : -1;
            r26.over = each;
            var f3b = feltTable.getBoundingClientRect();
            var ct = 1e9, cb = -1e9;
            for (i = 0; i < g.trick.length; i++) {
              var c3 = cardEl[g.trick[i].id]; if (!c3 || !c3.parentNode) continue;
              var q3 = c3.getBoundingClientRect(); ct = Math.min(ct, q3.top); cb = Math.max(cb, q3.bottom);
            }
            var cardArea = 0;
            for (i = 0; i < g.trick.length; i++) {
              var c4 = cardEl[g.trick[i].id]; if (!c4 || !c4.parentNode) continue;
              var q4 = c4.getBoundingClientRect(); cardArea += q4.width * q4.height;
            }
            r26.onCards = cardArea > 0 ? Math.round(cover / cardArea * 1000) / 10 : -1;
            var f3 = f3b;
            r26.geo = '台 ' + Math.round(f3.top) + '〜' + Math.round(f3.bottom) +
                      '／知らせ ' + Math.round(nb.top) + '〜' + Math.round(nb.bottom) + '（たけ ' + Math.round(nb.height) + '）' +
                      '／場の 札 ' + Math.round(ct) + '〜' + Math.round(cb) +
                      '／★札の 上までの すきま ' + Math.round(ct - nb.top) + 'px';
            /* ★★ 見本B ―― ★★この 場面が 生きて いる うちに やる（★私が 1度 しくじった 所：
               ★ ★あとで やろうと したら 場面が もう 変わって いて、★★見本が 鳴りませんでした）
               ⚠️★★ 2度目の しくじり：★はじめ「まん中へ 20px ずらす」で 試しました ―― ★★線を
                  ★ ★35% / 50% に 上げたら **鳴らなく なりました**（★ずらしただけでは そこまで 深く ならない）。
                  ★ ★→ ★★壊し方は「★★知らせが 台を 丸ごと 食う」に しました。★★これは 必ず 線を 越えます。 */
            var kTopB = breakNote.style.top, kMaxB = breakNote.style.maxHeight, kHB = breakNote.style.height;
            var kLeftB = breakNote.style.left, kWB = breakNote.style.width;
            /* ★★ 3度目の 直し ―― ★台いっぱいでも 320px では 鳴りませんでした
               ★ ★（★札は 台より よこに はみ出て いる ので、★台ぶんでは 札を 全部 食えない）。
               ★ ★→ ★★**画面 まるごと** に します。★★これで 鳴らない なら 見張りが 死んで います。 */
            breakNote.style.left = '0px'; breakNote.style.width = window.innerWidth + 'px';
            breakNote.style.top = '0px';
            breakNote.style.maxHeight = window.innerHeight + 'px';
            breakNote.style.height = window.innerHeight + 'px';
            var nb2 = breakNote.getBoundingClientRect(), a2 = nb2.width * nb2.height, cv2 = 0;
            for (i = 0; i < g.trick.length; i++) {
              var ce2 = cardEl[g.trick[i].id];
              if (!ce2 || !ce2.parentNode) continue;
              var cq2 = ce2.getBoundingClientRect();
              cv2 += Math.max(0, Math.min(nb2.right, cq2.right) - Math.max(nb2.left, cq2.left)) *
                     Math.max(0, Math.min(nb2.bottom, cq2.bottom) - Math.max(nb2.top, cq2.top));
            }
            var cA2 = 0;
            for (i = 0; i < g.trick.length; i++) {
              var c5 = cardEl[g.trick[i].id]; if (!c5 || !c5.parentNode) continue;
              var q5 = c5.getBoundingClientRect(); cA2 += q5.width * q5.height;
            }
            r26.mihonB = (a2 > 0 && (cv2 / a2 * 100) > BREAK_OVER_MAX) ||
                         (cA2 > 0 && (cv2 / cA2 * 100) > BREAK_ONCARD_MAX);
            r26.mihonBsaw = (a2 > 0 ? Math.round(cv2 / a2 * 1000) / 10 : -1) + '% / 札 ' +
                            (cA2 > 0 ? Math.round(cv2 / cA2 * 1000) / 10 : -1) + '%';
            breakNote.style.top = kTopB; breakNote.style.maxHeight = kMaxB; breakNote.style.height = kHB;
            breakNote.style.left = kLeftB; breakNote.style.width = kWB;
            breakKey = '';
            if (r26.worst > BREAK_OVER_MAX) {
              r26.why.push('★★★知らせの ' + r26.worst + '% が 場の 札に かぶられて います（★' +
                           BREAK_OVER_MAX + '% までの はず ―― ★社長「なるべく 被らないように」）');
            }
            if (r26.onCards > BREAK_ONCARD_MAX) {
              r26.why.push('★★★知らせが 場の 札の ' + r26.onCards + '% を かくして います（★' +
                           BREAK_ONCARD_MAX + '% までの はず ―― ★★札は 遊びの 中身 です）');
            }
          } else r26.why.push('★★試し方が おかしい ―― ★4枚の 場面を 作れませんでした');
        } else r26.why.push('★★試し方が おかしい ―― ★場に 3枚 出た 場面を 作れませんでした');

        /* ============================================================
           ★ ㉖-③ ★★わたす 案内と 同時に 出ない ―― ★1回ぶん 通して 数える
           ★ ★わたす 案内は phase 'pass'、★ハートブレイクは 'play'。★★重ならない はず。
           ★ ★「はず」で 通さず、★本物の 手を 52回 進めて **毎回** 両方を 見ます。
           ============================================================ */
        dropCards(); picks = {}; busy = false; over = false; hideBreak();
        g = C.makeGame(C.rng(20260907), { rules: rules, dealNo: 0 });
        rebuild(); placeAll(true);
        var seen = 0;
        if (g.phase === 'pass') {
          refreshGuide();
          if (passOn() && shown()) r26.both++;
          seen++;
          var give = [[], [], [], []];
          for (p = 0; p < 4; p++) give[p] = C.botPass(g, p, C.LEVELS[2].o);
          C.doPass(g, give);
          rebuild(); placeAll(true); refreshGuide();
        }
        for (var t = 0; t < 60 && !g.over; t++) {
          var seat = g.cur, LL = C.legalIdx(g, seat);
          if (!LL.length) break;
          var was = g.heartsBroken;
          var r2 = C.playIdx(g, seat, (seat === 0) ? LL[0] : C.botIdx(g, seat, C.LEVELS[2].o));
          if (!r2.ok) break;
          breakWatch(was);
          if (!cardEl[r2.id]) makeCard({ id: r2.id, c: r2.card }, true);
          faceUp(r2.id, true);
          placeAll(true); refreshGuide();
          seen++;
          if (passOn() && shown()) r26.both++;
          if (r2.full) {
            var tk = C.takeTrick(g);
            for (i = 0; i < tk.ids.length; i++) {
              var ee = cardEl[tk.ids[i]];
              if (ee && ee.parentNode) ee.parentNode.removeChild(ee);
              delete cardEl[tk.ids[i]];
            }
            placeAll(true);
          }
        }
        r26.plies2 = seen;
        if (seen < 40) r26.why.push('★★試し方が おかしい ―― ★' + seen + '手しか 進みませんでした');
        if (r26.both) r26.why.push('★★★わたす 案内と ハートブレイクが 同時に 出た 場面が ' + r26.both + '件 あります');

        /* ============================================================
           ★ ★★見本の 線 ―― ★毎回 わざと 壊して、鳴る ことを 確かめて から 元に もどす
           ★ ★見本A：★知らせを 消えない ように する → ★★「消えません」と 出る はず
           ★ ★見本B：★知らせを 場の まん中へ ずらす → ★★「被って います」と 出る はず
           ============================================================ */
        var mA = false;
        hideBreak(); showBreak();
        if (shown()) {
          var kAt = breakAt, kHid2 = breakNote.classList.contains('hidden');
          /* ★ A：★1600ms 経った 形に して 消し方を 呼ぶ ―― ★消えなければ おかしい（★逆向きの 見本）*/
          breakAt = Date.now() - BREAK_HOLD_MIN - 1;
          var stA26 = document.createElement('style');
          stA26.textContent = '#breakNote.hidden{display:flex!important}';   /* ★ 消しても 消えない 形 */
          document.head.appendChild(stA26);
          breakDue();
          mA = (getComputedStyle(breakNote).display !== 'none');             /* ★ 見張りが 気づける か */
          document.head.removeChild(stA26);
          breakAt = kAt;
          if (kHid2) breakNote.classList.add('hidden'); else breakNote.classList.remove('hidden');
        }
        r26.mihon = { A: mA, B: !!r26.mihonB, Bsaw: r26.mihonBsaw };
        hideBreak();
      });

      for (var tt = timers.length - 1; tt >= tMark; tt--) { clearTimeout(timers[tt]); timers.splice(tt, 1); }
      dropCards();
      picks = keepPicks; g = keepG; busy = keepBusy; over = keepOver; match = keepMatch;
      /* ★ 知らせを 元どおりに */
      if (breakNote) { if (kBreakHid) breakNote.classList.add('hidden'); else breakNote.classList.remove('hidden'); }
      breakAt = kBreakAt;
      /* ★ 結果の 箱まわりを 元どおりに（★verify の 頭の 書き置きの とおり）*/
      resultTitle.textContent = kRTitle26; resultTitle.className = kRCls26;
      resultSay.textContent = kRSay26; resultScore.innerHTML = kScore26; btnNext.innerHTML = kNext26;
      rankPut(kRank26);
      if (kLock26) resultBox.classList.add('is-locked'); else resultBox.classList.remove('is-locked');
      if (kLvHid26) levelPickResult.classList.add('hidden'); else levelPickResult.classList.remove('hidden');
      if (kResultHid26) resultWrap.classList.add('hidden'); else resultWrap.classList.remove('hidden');
      sayEl.textContent = kSay26;
      if (kSayHid26) sayEl.classList.add('hidden'); else sayEl.classList.remove('hidden');
      if (kTitleHid) titleScreen.classList.add('hidden'); else titleScreen.classList.remove('hidden');
      if (kPlayHid) playScreen.classList.add('hidden'); else playScreen.classList.remove('hidden');
      layout();
      if (g) { rebuild(); placeAll(true); }
    })();

    for (var i26 = 0; i26 < r26.why.length; i26++) ng.push('★★㉖㉗ ハートブレイクの 知らせ：' + r26.why[i26]);
    /* ★ 下の線 ―― ★1つも 測れて いないのに 通さない */
    if (r26.onBreak === null && !r26.why.length) ng.push('★★★㉖ 知らせを 1度も 測れて いません（★試し方が おかしい）');
    if (r26.worst < 0 && !r26.why.length) ng.push('★★★㉗ 被りを 1度も 測れて いません（★試し方が おかしい）');
    /* ★ 見本の 線 ―― ★見張り 自身が 生きて いるか */
    if (r26.mihon) {
      if (!r26.mihon.A) ng.push('★★★㉖ 消えない ように しても 気づきません ―― ★★画面では なく **見張りの ほうが 壊れて います**');
      if (!r26.mihon.B) ng.push('★★★㉗ まん中へ ずらしても「被って いる」と 出ません ―― ★★**見張りの ほうが 壊れて います**');
    }
    /* ★ 時間の 決まりが この 1本の 中の 数と そろって いるか */
    if (BREAK_HOLD_MIN !== T.SAY_HOLD) {
      ng.push('★★知らせの 下ばりが ' + BREAK_HOLD_MIN + 'ms（★この 1本の SAY_HOLD ' + T.SAY_HOLD + 'ms と ちがいます）');
    }
    note['㉖㉗ ★★ハートブレイクの 知らせ'] =
      '★割れる 前 ' + (r26.on0 === null ? '―' : (r26.on0 ? '★出て いる' : '出て いない')) +
      '／★割ったら ' + (r26.onBreak === null ? '―' : (r26.onBreak ? '出た' : '★出ない')) +
      '／★場が 空で ' + (r26.offAfter === null ? '―' : (r26.offAfter ? '消えた' : '★消えない')) +
      '／★わたす 案内と 同時 ' + r26.both + '件（' + (r26.plies2 || 0) + '手 数えた）' +
      '／★★被り 知らせの ' + (r26.worst < 0 ? '―' : r26.worst + '%（★' + BREAK_OVER_MAX + '%まで）') + '・札の ' + (r26.onCards == null ? '―' : r26.onCards + '%') + '（札 ' + r26.cases + '枚）' +
      '／★字 ' + r26.font + 'px・器 ' + r26.box + '／' + (r26.geo || '―') +
      '／★出す 時間 ' + BREAK_HOLD_MIN + '〜2740ms' +
      '／★見本 A ' + (r26.mihon && r26.mihon.A ? '鳴る' : '★鳴らない') +
      '・B ' + (r26.mihon && r26.mihon.B ? '鳴る' : '★鳴らない') + '（見本Bで 測った ' + (r26.mihon ? r26.mihon.Bsaw : '―') + '）';

    /* ============================================================
       ㉘ ★★★100点で 終わり、★1位〜4位が ぜんぶ 出る（★T217・社長ご指示 2026-09-04）★★★
       ------------------------------------------------------------
       ★★ ①「100点で 終わる」は **もう 入って いました**（★core の addDeal）。★★ここは その 見張りです。
       ★★ ②見本は 決め打ち ―― ★下の 表は **手で 書いた もの**。★`rankRows` の 式は 見ません。
       ★★ ③上の 線を 引いたら 下の 線も ―― ★★「99点では 終わらない」も 数えます。
       ============================================================ */
    var RANK_WANT = [
      /* ★合計（★4人ぶん）, ★終わる か, ★出す 位（★席0〜3 の 順）, ★★1位の 人数（★T217-3・金の しるし）*/
      [[10, 20, 30, 100], true,  [1, 2, 3, 4], 1],
      [[100, 20, 30, 10], true,  [4, 2, 3, 1], 1],
      [[10, 10, 30, 100], true,  [1, 1, 3, 4], 2],   /* ★★同じ 点 ＝ 同じ 位（★次は 3位）★★1位が 2人 */
      [[10, 10, 10, 100], true,  [1, 1, 1, 4], 3],   /* ★★T217-3 ―― ★1位が 3人（★上ばり がわ）*/
      [[26, 26, 26, 26],  true,  [1, 1, 1, 1], 4],   /* ★ 4人 同じ … ★★でも 100点に 届かない → 終わらない はず */
      [[10, 20, 30, 99],  false, null,         0]    /* ★★下の 線 ―― ★99点では 終わらない */
    ];
    var r28 = { rows: [], why: [], cases: 0, mihon: null, mihonTop: null, tops: [] };
    (function () {
      /* ★ ①-a ★★core の 決まりを 直に 見る（★画面を 通さない）*/
      RANK_WANT.forEach(function (w) {
        var m = C.newMatch(0);
        m.total = [0, 0, 0, 0];
        var mm = C.addDeal(m, w[0].slice());
        var hi = Math.max(w[0][0], w[0][1], w[0][2], w[0][3]);
        var wantOver = (hi >= 100);
        r28.cases++;
        if (mm.over !== wantOver) {
          r28.why.push('合計 ' + w[0].join('/') + ' で ' + (mm.over ? '終わりました' : '終わりません') +
                       '（★' + (wantOver ? '100点に 届いて いるので 終わる' : '100点に 届いて いないので 続く') + ' はず）');
        }
        r28.rows.push(w[0].join('/') + ' → ' + (mm.over ? 'おわり' : 'つづく'));
      });
      if (C.GOAL !== 100) r28.why.push('★★おわりの 点が ' + C.GOAL + '点（★100点の はず ―― ★社長ご指示）');

      /* ★ ①-b ★★画面を 通す ―― ★本物の showResult で 1位〜4位が 出る か */
      if (!resultScore) { r28.why.push('★立ち上がって いない'); return; }
      /* ⚠️★★ T217 ―― ★★はじめの 画面では g も match も ありません（★私は ここで 1度 こけました：
         ★ ★showResult が g.moonBy を 読む ―― ★★続きが ある 人の はじめの 画面で verify が 落ちました）。
         ★ ★★見張りは 場面を **自分で 作る**（★T214-3 の 決まり）。★終わったら null に 戻します。 */
      var madeG = false, madeM = false;
      if (!match) { match = C.newMatch(C.LEVEL_START); madeM = true; }
      if (!g) { g = C.makeGame(C.rng(20260908), { rules: rules, dealNo: 0 }); madeG = true; }
      var kTotal = match.total.slice(), kDeal = match.dealNo, kOver = match.over, kWin = match.winners.slice();
      var kMoon = g ? g.moonBy : -1;
      var kHidden = resultWrap.classList.contains('hidden');
      var kTitle = resultTitle.textContent, kCls = resultTitle.className, kSay = resultSay.textContent;
      var kScore = resultScore.innerHTML, kNext = btnNext.innerHTML;
      var kLv = levelPickResult.classList.contains('hidden');
      var kLock = resultBox.classList.contains('is-locked');
      var kRank = rankSnap();
      var tMark = timers.length;
      still(function () {
        if (g) g.moonBy = -1;
        RANK_WANT.forEach(function (w) {
          if (!w[1]) return;                                  /* ★ 終わらない 形は 画面を 通しません */
          var lo = Math.min(w[0][0], w[0][1], w[0][2], w[0][3]);
          match.over = true; match.winners = [];
          for (var q = 0; q < 4; q++) if (w[0][q] === lo) match.winners.push(q);
          match.total = w[0].slice(); match.dealNo = 9;
          showResult([3, 4, 5, 14], [0, 0, 0, 0]);
          var hid = !rankList || rankList.classList.contains('hidden');
          if (Math.max(w[0][0], w[0][1], w[0][2], w[0][3]) < 100) return;   /* ★ 4人 同じ 26点は 終わらない 形 */
          if (hid) { r28.why.push('★★★合計 ' + w[0].join('/') + ' で 順位が 出て いません'); return; }
          var pl = rankList.querySelectorAll('.rk-place'), nm = rankList.querySelectorAll('.rk-name');
          if (pl.length !== 4 || nm.length !== 4) {
            r28.why.push('★★★順位が ' + pl.length + '人ぶん しか 出て いません（★4人ぶん の はず）');
            return;
          }
          /* ★ 決め打ちの 表と くらべる（★席の 順に 直して から）*/
          var got = {}, i;
          for (i = 0; i < 4; i++) got[nm[i].textContent] = parseInt(pl[i].textContent, 10);
          var bad = [];
          for (i = 0; i < 4; i++) {
            var nmi = seatName(i);
            if (got[nmi] !== w[2][i]) bad.push(nmi + ' が ' + got[nmi] + '位（★' + w[2][i] + '位 の はず）');
          }
          /* ★ いちばん 上の 行が いちばん 点の 低い 人か（★社長ご指示の 芯）*/
          if (parseInt(pl[0].textContent, 10) !== 1) bad.push('いちばん 上が ' + pl[0].textContent);
          /* ============================================================
             ★★★ T217-3 ―― ★★金の しるし（`rk-top`）が **1位 ぜんぶ**に 付いて いるか ★★★
             ★ ★上の線 … ★1位が 2人なら 6マス（★2行 × 3マス）付いて いない と 鳴る
             ★ ★★下の線 … ★★1位では ない 行に 付いて いても 鳴る（★★ゆるめる ときこそ こちらが 要る）
             ★ ★見本は 決め打ち（★RANK_WANT の 4つ目の 数）。★`rankRows` の 式は 見ません。 */
          var wantTop = w[3] * 3, gotTop = rankList.querySelectorAll('.rk-top').length, mis = [], ti;
          if (gotTop !== wantTop) {
            bad.push('★★金の しるしが ' + gotTop + 'マス（★1位 ' + w[3] + '人 × 3マス ＝ ' + wantTop + 'マス の はず）');
          }
          for (ti = 0; ti < rankList.children.length; ti++) {
            var cell = rankList.children[ti];
            var isTop = cell.classList.contains('rk-top');
            var want1 = (rankList.children[Math.floor(ti / 3) * 3].textContent === '1位');
            if (isTop !== want1) mis.push((want1 ? '1位' : 'その他') + 'の「' + cell.textContent + '」が ' + (isTop ? '金に なって います' : '金に なって いません'));
          }
          if (mis.length) bad.push('★★金の しるしが 位と 合いません ―― ' + mis.join('・'));
          r28.tops.push(w[0].join('/') + ' → ' + gotTop + 'マス');
          if (bad.length) r28.why.push('★★★合計 ' + w[0].join('/') + '：' + bad.join('・'));
          r28.rows.push('画面 ' + w[0].join('/') + ' → ' +
            Array.prototype.map.call(pl, function (e, k) { return e.textContent + nm[k].textContent; }).join(' '));
        });
        /* ★ 下の線 ―― ★★勝負が ついて いない ときは 出さない */
        match.over = false; match.winners = [];
        match.total = [10, 20, 30, 40]; match.dealNo = 3;
        showResult([3, 4, 5, 14], [0, 0, 0, 0]);
        var midHid = !rankList || rankList.classList.contains('hidden');
        if (!midHid) r28.why.push('★★★まだ 終わって いないのに 順位が 出て います（★1回 おわりの 画面）');
        /* ★ 見本の 線 ―― ★わざと 逆に 並べたら 気づく か */
        match.over = true; match.winners = [0];
        match.total = [10, 20, 30, 100]; match.dealNo = 9;
        showResult([3, 4, 5, 14], [0, 0, 0, 0]);
        var okBefore = rankList && rankList.querySelectorAll('.rk-place').length === 4 &&
                       rankList.querySelector('.rk-place').textContent === '1位';
        var kHtml = rankList ? rankList.innerHTML : '';
        if (rankList) rankList.innerHTML = '<span class="rk-place">4位</span><span class="rk-name">あなた</span><i class="rk-pt">10</i>';
        var sawBad = rankList && (rankList.querySelectorAll('.rk-place').length !== 4 ||
                                  rankList.querySelector('.rk-place').textContent !== '1位');
        if (rankList) rankList.innerHTML = kHtml;
        r28.mihon = { ok: !!okBefore, saw: !!sawBad };
        /* ============================================================
           ★★ 見本の 線 その2（★T217-3）―― ★★同点1位の **2人目**から 金の しるしを はがして、
              ★ ★★上の目（数）と 下の目（位と 合うか）が **どちらも** 気づく ことを 見ます。
           ★ ★決め打ち：★[10,10,30,100] ＝ ★1位が 2人 ＝ ★6マス。★はがすと 3マス。
           ★ ★★終わったら 元に もどし、★もどせた かも 数えます（★もどせて いないと あとの 数字が 死ぬ）。
           ============================================================ */
        match.over = true; match.winners = [0, 1];
        match.total = [10, 10, 30, 100]; match.dealNo = 9;
        showResult([3, 4, 5, 14], [0, 0, 0, 0]);
        var topB = rankList ? rankList.querySelectorAll('.rk-top').length : -1;
        var kHtml2 = rankList ? rankList.innerHTML : '';
        var strip = rankList ? rankList.querySelectorAll('.rk-top') : [];
        for (var sz = 3; sz < strip.length; sz++) strip[sz].classList.remove('rk-top');   /* ★ 2行目だけ はがす */
        var topA = rankList ? rankList.querySelectorAll('.rk-top').length : -1;
        /* ★ 下の目 ―― ★「1位の 行 なのに 金では ない」を 数える（★上の目とは 別の 道）*/
        var sawMis = 0, mz;
        if (rankList) {
          for (mz = 0; mz < rankList.children.length; mz++) {
            var c2 = rankList.children[mz];
            var w1 = (rankList.children[Math.floor(mz / 3) * 3].textContent === '1位');
            if (c2.classList.contains('rk-top') !== w1) sawMis++;
          }
        }
        if (rankList) rankList.innerHTML = kHtml2;
        var topBack = rankList ? rankList.querySelectorAll('.rk-top').length : -1;
        r28.mihonTop = { 出た: topB, はがした: topA, ずれ: sawMis, もどった: topBack === topB };
      });
      for (var tt = timers.length - 1; tt >= tMark; tt--) { clearTimeout(timers[tt]); timers.splice(tt, 1); }
      match.total = kTotal; match.dealNo = kDeal; match.over = kOver; match.winners = kWin;
      if (g) g.moonBy = kMoon;
      resultTitle.textContent = kTitle; resultTitle.className = kCls; resultSay.textContent = kSay;
      resultScore.innerHTML = kScore; btnNext.innerHTML = kNext;
      rankPut(kRank);
      if (kLv) levelPickResult.classList.add('hidden'); else levelPickResult.classList.remove('hidden');
      if (kLock) resultBox.classList.add('is-locked'); else resultBox.classList.remove('is-locked');
      if (kHidden) resultWrap.classList.add('hidden'); else resultWrap.classList.remove('hidden');
      if (madeG) g = null;                                          /* ★ T217 ―― ★借りた ものは 返す */
      if (madeM) match = null;
    })();

    for (var i28 = 0; i28 < r28.why.length; i28++) ng.push('★★㉘ 100点と 順位：' + r28.why[i28]);
    if (r28.cases !== RANK_WANT.length) ng.push('★★★㉘ ' + r28.cases + '通り しか 数えて いません（★' + RANK_WANT.length + '通り の はず）');
    if (r28.mihon && (!r28.mihon.ok || !r28.mihon.saw)) {
      ng.push('★★★㉘ 順位を わざと 逆に しても 気づきません ―― ★★**見張りの ほうが 壊れて います**');
    }
    /* ★★ T217-3 ―― ★金の しるしの 見本（★上の目・下の目・もどし の 3つ とも 見ます）*/
    if (!r28.mihonTop) {
      if (!r28.why.length) ng.push('★★★㉘ 金の しるしの 見本を 1度も 試せて いません（★試し方が おかしい）');
    } else {
      if (r28.mihonTop.出た !== 6) ng.push('★★★㉘ 同点1位が 2人 なのに 金の しるしが ' + r28.mihonTop.出た + 'マス（★6マス の はず）');
      if (r28.mihonTop.はがした !== 3) ng.push('★★★㉘ 金の しるしを わざと はがせて いません（' + r28.mihonTop.はがした + 'マス 残り ―― ★試し方が おかしい）');
      else if (r28.mihonTop.出た === r28.mihonTop.はがした) ng.push('★★★㉘ 金の しるしを はがしても 数が 変わりません ―― ★★**見張りの ほうが 壊れて います**');
      if (!r28.mihonTop.ずれ) ng.push('★★★㉘ 1位の 行から 金を はがしても「位と 合わない」と 出ません ―― ★★**下の 目が 効いて いません**');
      if (!r28.mihonTop.もどった) ng.push('★★★㉘ 金の しるしを 元に もどせて いません（★あとの 数字が 信じられません）');
    }
    note['㉘ ★★100点と 順位'] = 'おわりの 点 ' + C.GOAL + '点／★数えた ' + r28.cases + '通り／' +
      r28.rows.join('／') + '／★同じ 点は 同じ 位（★1位が 2人なら 次は 3位）' +
      '／★★金の しるし(rk-top) ' + (r28.tops.length ? r28.tops.join('・') : '―') +
      '（★1位 1人＝3マス・2人＝6マス・3人＝9マス）' +
      '／★見本 ' + (r28.mihon && r28.mihon.ok && r28.mihon.saw ? '鳴る' : '★鳴らない') +
      '・金 ' + (r28.mihonTop ? (r28.mihonTop.出た + '→' + r28.mihonTop.はがした + 'マス・ずれ ' + r28.mihonTop.ずれ +
        '・もどり ' + (r28.mihonTop.もどった ? '○' : '★×')) : '―');


    /* ============================================================
       ㉙ ★★★はじめの 画面の 押す ところ ―― ★画面の 中か、★★指で 動かせば 届くか（★T217・社長裁定「1」）★★★
       ------------------------------------------------------------
       ⚠️★★★ この 見張りは、★★私が 見張りを ゆるめた ときに **できた 穴**を ふさぐ ものです ★★★
          ★ ★社長の お決め「1」＝「★スクロールで 届けば よい を 見張りに 教える」を 入れました。
          ★ ★そのとき ⑪（結果の 箱）が **はじめの 画面を 消して いなかった** ので、
            ★ ★★うその NG が 出ました。★★そこで ⑪に「はじめの 画面を 消す」を 足した ところ ――
          ★ ★★★どの 見張りも はじめの 画面の ボタンを 1つも 測らなく なりました。
            ★ ★（⑬ fitTest も はじめの 画面を 消して 測ります）
          ★ ★★＝ ★★★ゆるめた のでは なく、★**目が 丸ごと 無く なって いました**。
          ★ ★元の 🔴 は、★⑪が たまたま はじめの 画面を 消し忘れて いた から 見つかった もの でした。
            ★ ★★「たまたま 見えて いた」に 頼るのを やめ、★★ここで **わざと 測ります**。
       ★★ 3本の 線 ★★
         | ★上の線 | ★画面の 外に 出て いて、★★指で 動かしても 届かない ものが あったら 鳴る |
         | ★下の線 | ★★1つも 測れて いない ときも 鳴る（★＝ 目が また 死んだら 気づく）|
         | ★見本の線 | ★毎回 わざと 動かせなく して、★鳴る ことを 確かめて から 元に もどす |
       ★★ 「続きあり」の 形で 測ります ―― ★★そこが いちばん たてに 長い（★ボタンが 1つ 増える）。
       ============================================================ */
    var r29 = { n: 0, inside: 0, reach: 0, ng: [], why: [], mihon: null, worst: '―' };
    (function () {
      if (document.visibilityState !== 'visible') {
        r29.why.push('★★ページが 前に 出て いません（' + document.visibilityState + '）―― ★見え方は 測れません');
        return;
      }
      var btnR = $('btnResume');
      if (!btnR) { r29.why.push('★「つづきから」の 部品が ありません'); return; }
      var kT = titleScreen.classList.contains('hidden');
      var kP = playScreen.classList.contains('hidden');
      var kR = resultWrap.classList.contains('hidden');
      var kBtn = btnR.classList.contains('hidden');
      var kTop = titleScreen.scrollTop;
      function scan() {
        var out = { n: 0, inside: 0, reach: 0, ng: [], deep: 0, outside: 0 };
        var list = titleScreen.querySelectorAll(TOUCH_SEL);
        for (var i = 0; i < list.length; i++) {
          var el = list[i];
          if (!el.offsetParent) continue;
          var q = el.getBoundingClientRect();
          if (q.width === 0 || q.height === 0) continue;
          out.n++;
          var inV = (q.left >= -0.5 && q.top >= -0.5 &&
                     q.right <= window.innerWidth + 0.5 && q.bottom <= window.innerHeight + 0.5);
          if (inV) { out.inside++; continue; }
          out.outside++;
          out.deep = Math.max(out.deep, Math.round(q.bottom - window.innerHeight), Math.round(-q.top));
          if (scrollReach(el, q)) out.reach++;
          else out.ng.push((el.id || el.className || el.tagName) + '（下に ' +
                           Math.round(Math.max(0, q.bottom - window.innerHeight)) + 'px はみ出し）');
        }
        return out;
      }
      still(function () {
        titleScreen.classList.remove('hidden');
        playScreen.classList.add('hidden');
        resultWrap.classList.add('hidden');
        btnR.classList.remove('hidden');            /* ★★ 続きあり ＝ いちばん 長い 形 */
        titleScreen.scrollTop = 0;
        var a = scan();
        r29.n = a.n; r29.inside = a.inside; r29.reach = a.reach; r29.ng = a.ng;
        var box = scrollBox(btnR);
        r29.worst = a.deep + 'px はみ出し／動かせる のこり ' +
                    (box ? (box.scrollHeight - box.clientHeight) : '―') + 'px（入れ物 ' +
                    (box ? box.clientHeight : '―') + 'px・上ばり ' + REACH_MAX + '倍）';
        if (a.ng.length) {
          r29.why.push('★★★画面の 外に 出て いて 指で 動かしても 届かない：' + a.ng.join('・'));
        }
        if (!a.n) r29.why.push('★★押す ところを 1つも 測れて いません（★試し方が おかしい）');
        /* ★★ 見本の 線 ―― ★3通り わざと 壊す
           ⚠️★★ ★★「効く 壊し」だけを 見る（★私が 1度 しくじった 所）：
              ★ ★320×568 では **そもそも 画面から 出て いる ものが 0個** です（★入れ物の のこり 0px）。
              ★ ★★出て いない ものは「届く か」を 見る 相手では ない ので、★見本も 効きません。
              ★ ★はじめ そこを 見ずに「鳴らない ＝ 見張りが 壊れて いる」と 書いて、★★うその NG を 3件 出しました。
              ★ ★→ ★★壊した あと **本当に 画面から 出た か**（outside）を 見て、
                ★ ★★出た のに 鳴らない ときだけ「見張りが 壊れて いる」と 言います。 */
        function mihon(make, undo) {
          make();
          var b = scan();
          undo();
          titleScreen.scrollTop = 0;
          return { 効いた: b.outside > 0, 鳴った: b.ng.length > 0 };
        }
        var st1, pad, st3;
        r29.mihon = {
          hidden: mihon(function () {
            st1 = document.createElement('style');
            st1.textContent = '#titleScreen{overflow:hidden!important}';
            document.head.appendChild(st1);
          }, function () { document.head.removeChild(st1); }),
          板: mihon(function () {
            pad = document.createElement('div');
            pad.style.cssText = 'position:fixed;inset:0;z-index:99999;background:transparent';
            document.body.appendChild(pad);
          }, function () { document.body.removeChild(pad); }),
          長い: mihon(function () {
            st3 = document.createElement('style');
            /* ★ 下へ 足しても ボタンは 動きません（★私の しくじり）。★★上に 足して 押し下げます */
            st3.textContent = '#titleScreen>*{padding-top:2000px!important}';
            document.head.appendChild(st3);
          }, function () { document.head.removeChild(st3); })
        };
      });
      titleScreen.scrollTop = kTop;
      if (kBtn) btnR.classList.add('hidden'); else btnR.classList.remove('hidden');
      if (kT) titleScreen.classList.add('hidden'); else titleScreen.classList.remove('hidden');
      if (kP) playScreen.classList.add('hidden'); else playScreen.classList.remove('hidden');
      if (kR) resultWrap.classList.add('hidden'); else resultWrap.classList.remove('hidden');
    })();

    for (var i29 = 0; i29 < r29.why.length; i29++) ng.push('★★㉙ はじめの 画面の 押す ところ：' + r29.why[i29]);
    if (!r29.n && !r29.why.length) ng.push('★★★㉙ 押す ところを 1つも 測れて いません（★★目が 死んで います）');
    if (r29.mihon) {
      if (r29.mihon.hidden.効いた && !r29.mihon.hidden.鳴った) ng.push('★★★㉙ 入れ物を 動かせなく しても 気づきません ―― ★★**見張りの ほうが 壊れて います**');
      if (r29.mihon.板.効いた && !r29.mihon.板.鳴った) ng.push('★★★㉙ 上に 板を かぶせても 気づきません ―― ★★**指の 目が 効いて いません**');
      if (r29.mihon.長い.効いた && !r29.mihon.長い.鳴った) ng.push('★★★㉙ 1回 はらっても 届かない ほど 長く しても 気づきません ―― ★★**上ばりが 効いて いません**');
      /* ★ 下の線 ―― ★★3通り とも 効かない ＝ 見本が 1つも 試せて いない */
      if (!r29.mihon.hidden.効いた && !r29.mihon.板.効いた && !r29.mihon.長い.効いた) {
        ng.push('★★★㉙ 見本を 3通り とも 試せて いません（★どれも 画面の 外に 出せませんでした ―― ★試し方が おかしい）');
      }
    }
    note['㉙ ★★はじめの 画面の 押す ところ'] = '★数えた ' + r29.n + '個（★画面の 中 ' + r29.inside +
      '・★指で 動かせば 届く ' + r29.reach + '・★★届かない ' + r29.ng.length + '）／' + r29.worst +
      '／★見本 ' + ['hidden', '板', '長い'].map(function (k) {
        var m = r29.mihon && r29.mihon[k];
        return k + ' ' + (!m ? '―' : (!m.効いた ? '（この 画面では 効かない）' : (m.鳴った ? '鳴る' : '★鳴らない')));
      }).join('・');

    /* ============================================================
       ㉚ ★★★ハートブレイクの 知らせが **読める 形** で 出て、★★消えるか（★T218・🎨アト）★★★
       ------------------------------------------------------------
       ★ この かたまりを `verify()` の 中（★㉙ の note の 後ろ・`var out = {` の 前）に
         ★ そのまま 貼って ください。★新しい 部品は 0個 です。

       ★★ ㉖㉗（コーダ）との 分け目 ★★
         ★ ㉖㉗ … ★出るか／消えるか／台から 出ないか／★被りの 面積／★手を 教えて いないか
         ★ ★★㉚（ここ）… ★★**読める 形か**。★出て いても、★字が うすい・★言葉の まん中で 折れて いる・
           ★ ★★字が 器から あふれて いる・★★消されて いる（display／visibility／すきとおり）なら 鳴らします。

       ⚠️★★★ 私が いちばん 気を つけた こと（★この 1本で 4度 起きた 事故）★★★
          ★ ★★この 見張りは 場面を **自分で 作り**、★★終わったら **1つ 残らず 元へ 戻します**。
          ★ ★戻す もの：★g・busy・over・picks・match ／ ★titleScreen・playScreen・resultWrap・
            ★ ★levelPickResult・resultBox の is-locked・結果の 箱の 中身・rankList ／ ★sayEl ／
            ★ ★timers ／ ★breakNote の hidden と breakAt ／ ★札の DOM（dropCards → rebuild → placeAll）。
          ★ ★★足したら 必ず `node t214_3_narasu.cjs mid new` で「前後の 画面 ★同じ」を 見る こと。
       ============================================================ */
    /* ★ 線は 私が T123・T139・T215 で 使って きた ものと 同じ ものさし です
       ★ ★① 字 … ★11px 以上（★JS の BREAK_FONT_MIN と 同じ 下ばり）
       ★ ★② へだたり … ★★4.5:1 以上（★いまの 形は --ink × --gold-soft で **8.36**【実測】）
       ★ ★③ 折れ … ★★言葉の まん中で 切らない（★直す前は「ハートブレイク！ ハ ／ ートから」でした）
       ★ ★④ あふれ … ★器の 中に 収まって いる（scrollHeight／scrollWidth）
       ★ ★⑤ 消されて いない … ★display／visibility／すきとおり .95 以上
       ★ ★⑥ 被り … ★★30%（★★社長の「少し 被るのは OK」の 線。★★㉗ の 35% より 5ポイント きつい） */
    var BRK_FONT_MIN30 = 11, BRK_RATIO_MIN30 = 4.5, BRK_OVER_MAX30 = 30;
    var r30 = { seen: 0, font: 0, ratio: 0, lines: [], cut: [], over: -1, why: [], mihon: null, box: '―' };
    (function () {
      /* ★ 下の線 その1 ―― ★★ページが 前に 出て いない なら 測らない（★測れて いない のに 通さない）*/
      if (document.visibilityState !== 'visible') {
        r30.why.push('★★ページが 前に 出て いません（' + document.visibilityState + '）―― ★見え方は 測れません');
        return;
      }
      /* ★ へだたり（★色の ある いちばん 近い 親を 地に する）*/
      function lum30(c) {
        var m = String(c).match(/[\d.]+/g) || [0, 0, 0, 1];
        var a = m.length > 3 ? parseFloat(m[3]) : 1, v = [], i;
        for (i = 0; i < 3; i++) {
          var x = parseFloat(m[i]) / 255;
          x = a >= 1 ? x : x * a + (1 - a);
          v.push(x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4));
        }
        return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
      }
      function bg30(el) {
        for (var e = el; e && e !== document.documentElement; e = e.parentElement) {
          var m = String(getComputedStyle(e).backgroundColor).match(/[\d.]+/g);
          if (m && (m.length < 4 || parseFloat(m[3]) > 0.5)) return getComputedStyle(e).backgroundColor;
        }
        return 'rgb(255,255,255)';
      }
      function ratio30(el) {
        var a = lum30(getComputedStyle(el).color), b = lum30(bg30(el));
        var hi = Math.max(a, b), lo = Math.min(a, b);
        return Math.round((hi + 0.05) / (lo + 0.05) * 100) / 100;
      }
      /* ★ 行を 読む ―― ★1文字ずつ 位置を 取り、★同じ たかさの ものを 1行に */
      function lines30(el) {
        var tn = null;
        (function walk(x) {
          for (var i = 0; i < x.childNodes.length; i++) {
            var c = x.childNodes[i];
            if (c.nodeType === 3 && c.textContent.replace(/\s/g, '') && !tn) tn = c;
            else if (c.nodeType === 1) walk(c);
          }
        })(el);
        if (!tn) return [];
        var out = [], cur = null, r = document.createRange(), i;
        for (i = 0; i < tn.textContent.length; i++) {
          r.setStart(tn, i); r.setEnd(tn, i + 1);
          var b = r.getBoundingClientRect(), ch = tn.textContent[i];
          if (b.width === 0 && b.height === 0) { if (cur) cur.t += ch; continue; }
          if (!cur || Math.abs(b.top - cur.top) > 2) { cur = { top: b.top, t: ch }; out.push(cur); }
          else cur.t += ch;
        }
        var res = [], k;
        for (k = 0; k < out.length; k++) res.push(out[k].t);
        return res;
      }
      /* ★ この 1回ぶんを 見る（★呼ばれた ときには 知らせが 出て いる こと）*/
      function look30(tag) {
        if (!breakNote || breakNote.classList.contains('hidden')) {
          r30.why.push(tag + '：★知らせが 出て いません（★㉖ が 鳴って いる はず）');
          return null;
        }
        var cs = getComputedStyle(breakNote), q = breakNote.getBoundingClientRect();
        var o = {
          font: Math.round(parseFloat(cs.fontSize) * 10) / 10,
          ratio: ratio30(breakNote),
          lines: lines30(breakNote),
          w: Math.round(q.width), h: Math.round(q.height),
          dead: (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.95),
          spill: (breakNote.scrollHeight > breakNote.clientHeight + 1 ||
                  breakNote.scrollWidth > breakNote.clientWidth + 1)
        };
        /* ★ 下の線 その2 ―― ★★測れて いない ときも 鳴る */
        if (!(o.w > 0 && o.h > 0) || !(o.font > 0) || !o.lines.length) {
          r30.why.push(tag + '：★★測れて いません（' + o.w + '×' + o.h + 'px・字 ' + o.font + '・' + o.lines.length + '行）');
          return o;
        }
        o.cut = [];
        for (var i = 0; i < o.lines.length - 1; i++) {
          var a = o.lines[i], b = o.lines[i + 1];
          if (!/[\s　]$/.test(a) && !/^[\s　]/.test(b) && b.length) o.cut.push(a + '／' + b);
        }
        return o;
      }
      function judge30(tag, o, quiet) {
        if (!o) return [];
        var w = [];
        if (o.font < BRK_FONT_MIN30) w.push(tag + '：★字が ' + o.font + 'px（★' + BRK_FONT_MIN30 + 'px 以上 の はず）');
        if (o.ratio < BRK_RATIO_MIN30) w.push(tag + '：★★字の へだたり ' + o.ratio + ':1（★' + BRK_RATIO_MIN30 + ' 未満 ―― ★うすくて 読めません）');
        if (o.cut && o.cut.length) w.push(tag + '：★★言葉の まん中で 折れて います「' + o.cut.join('／') + '」');
        if (o.spill) w.push(tag + '：★★字が 器から あふれて います');
        if (o.dead) w.push(tag + '：★★消されて います（display／visibility／すきとおり）');
        if (!quiet) { for (var i = 0; i < w.length; i++) r30.why.push(w[i]); }
        return w;
      }

      /* ★ 覚える（★戻す ため）*/
      var keepG = g, keepBusy = busy, keepOver = over, keepPicks = picks, keepMatch = match;
      var kT30 = titleScreen.classList.contains('hidden'), kP30 = playScreen.classList.contains('hidden');
      var kR30 = resultWrap.classList.contains('hidden');
      var kLv30 = levelPickResult.classList.contains('hidden');
      var kLock30 = resultBox.classList.contains('is-locked');
      var kScore30 = resultScore.innerHTML, kSay30r = resultSay.textContent;
      var kTitle30 = resultTitle.textContent, kCls30 = resultTitle.className, kNext30 = btnNext.innerHTML;
      var kRank30 = rankSnap();
      var kSay30 = sayEl.textContent, kSayHid30 = sayEl.classList.contains('hidden');
      var kBrkHid30 = !breakNote || breakNote.classList.contains('hidden'), kBrkAt30 = breakAt;
      var t30 = timers.length;
      titleScreen.classList.add('hidden'); playScreen.classList.remove('hidden');
      resultWrap.classList.add('hidden');
      if (!match) match = C.newMatch(C.LEVEL_START);
      build(); layout();

      still(function () {
        /* ★ ①4人ぶんの 札が 出そろった 場面（★★被りが いちばん 深く なる ところ）*/
        dropCards(); picks = {}; busy = false; over = false; hideBreak();
        g = C.makeGame(C.rng(20260910), { rules: rules, dealNo: 0 });
        rebuild();
        if (!makePlayScene(3)) { r30.why.push('★★試し方が おかしい ―― ★場面が 作れません'); return; }
        var LG = C.legalIdx(g, 0);
        if (LG.length) {
          var rr = C.playIdx(g, 0, LG[0]);
          if (rr.ok) { if (!cardEl[rr.id]) makeCard({ id: rr.id, c: rr.card }, true); faceUp(rr.id, true); }
        }
        placeAll(true);
        showBreak();
        var o = look30('4枚 出そろった とき');
        judge30('4枚 出そろった とき', o);
        if (o) {
          r30.seen++; r30.font = o.font; r30.ratio = o.ratio; r30.lines = o.lines; r30.cut = o.cut || [];
          r30.box = o.w + '×' + o.h;
          /* ★ ⑥被り ―― ★★私の 線（30%）で 見る（★面積の 出し方は ㉗ と 同じ 式）*/
          var nb = breakNote.getBoundingClientRect(), area = nb.width * nb.height, cover = 0, i;
          for (i = 0; i < g.trick.length; i++) {
            var ce = cardEl[g.trick[i].id]; if (!ce || !ce.parentNode) continue;
            var cq = ce.getBoundingClientRect();
            cover += Math.max(0, Math.min(nb.right, cq.right) - Math.max(nb.left, cq.left)) *
                     Math.max(0, Math.min(nb.bottom, cq.bottom) - Math.max(nb.top, cq.top));
          }
          r30.over = area > 0 ? Math.round(cover / area * 1000) / 10 : -1;
          if (r30.over > BRK_OVER_MAX30) {
            r30.why.push('★★知らせの ' + r30.over + '% が 場の 札に かぶられて います（★' + BRK_OVER_MAX30 + '% まで）');
          }

          /* ============================================================
             ★★ 見本の 線 ―― ★★毎回 わざと 壊して、★「読めない」と 出る ことを 見る
             ★ ★決め打ちです（★画面の 値からは 作りません）。★終わったら 元に もどせた かも 見ます。
             ============================================================ */
          var mi = { 小さい: false, うすい: false, もどった: false };
          var st30 = document.createElement('style');
          document.head.appendChild(st30);
          st30.textContent = '#breakNote{font-size:9px !important;}';
          void breakNote.offsetWidth;
          mi.小さい = judge30('見本', look30('見本'), true).length > 0;
          st30.textContent = '#breakNote{color:' + getComputedStyle(breakNote).backgroundColor + ' !important;}';
          void breakNote.offsetWidth;
          mi.うすい = judge30('見本', look30('見本'), true).length > 0;
          st30.parentNode.removeChild(st30);
          void breakNote.offsetWidth;
          var back = look30('もどし');
          mi.もどった = !!(back && Math.abs(back.font - o.font) < 0.6 && Math.abs(back.ratio - o.ratio) < 0.2);
          r30.mihon = mi;
        }

        /* ★ ②消える ―― ★★時間は 待たず、★「もう 1600ms 経った」形に して 本物の breakDue を 呼ぶ */
        if (breakNote && !breakNote.classList.contains('hidden')) {
          breakAt = Date.now() - BREAK_HOLD_MIN - 1;
          breakDue();
          if (!breakNote.classList.contains('hidden')) r30.why.push('★★知らせが 消えません（★出しっぱなし）');
        }
      });

      /* ★ 戻す（★1つ 残らず）*/
      for (var tt30 = timers.length - 1; tt30 >= t30; tt30--) { clearTimeout(timers[tt30]); timers.splice(tt30, 1); }
      hideBreak(); breakAt = kBrkAt30;
      if (breakNote && !kBrkHid30) breakNote.classList.remove('hidden');
      dropCards();
      g = keepG; busy = keepBusy; over = keepOver; picks = keepPicks; match = keepMatch;
      if (g) { rebuild(); placeAll(true); }
      resultTitle.textContent = kTitle30; resultTitle.className = kCls30; resultSay.textContent = kSay30r;
      resultScore.innerHTML = kScore30; btnNext.innerHTML = kNext30;
      rankPut(kRank30);
      sayEl.textContent = kSay30;
      if (kSayHid30) sayEl.classList.add('hidden'); else sayEl.classList.remove('hidden');
      if (kLv30) levelPickResult.classList.add('hidden'); else levelPickResult.classList.remove('hidden');
      if (kLock30) resultBox.classList.add('is-locked'); else resultBox.classList.remove('is-locked');
      if (kR30) resultWrap.classList.add('hidden'); else resultWrap.classList.remove('hidden');
      if (kT30) titleScreen.classList.add('hidden'); else titleScreen.classList.remove('hidden');
      if (kP30) playScreen.classList.add('hidden'); else playScreen.classList.remove('hidden');
      layout();
    })();

    for (var i30 = 0; i30 < r30.why.length; i30++) ng.push('★★㉚ 知らせが 読めるか：' + r30.why[i30]);
    if (!r30.seen && !r30.why.length) ng.push('★★★㉚ 知らせの 見え方を 1回も 測れて いません（★試し方が おかしい）');
    if (r30.mihon) {
      if (!r30.mihon.小さい) ng.push('★★★㉚ 字を わざと 9px に しても 気づきません ―― ★★**見張りの ほうが 壊れて います**');
      if (!r30.mihon.うすい) ng.push('★★★㉚ 字を わざと 器と 同じ 色に しても 気づきません ―― ★★**見張りの ほうが 壊れて います**');
      if (!r30.mihon.もどった) ng.push('★★★㉚ 見本を 元に もどせて いません（★あとの 数字が 信じられません）');
    }
    note['㉚ ★★知らせが 読めるか'] = '字 ' + r30.font + 'px・へだたり ' + r30.ratio + ':1・器 ' + r30.box +
      '／' + r30.lines.length + '行「' + r30.lines.join('｜') + '」' +
      '／★折れ ' + (r30.cut.length ? '★★' + r30.cut.join('／') : 'なし') +
      '／★被り ' + r30.over + '%（★' + BRK_OVER_MAX30 + '% まで）' +
      '／★見本 ' + (r30.mihon ? ['小さい', 'うすい', 'もどった'].map(function (k) {
        return k + ' ' + (r30.mihon[k] ? '○' : '★×');
      }).join('・') : '―');


    /* ============================================================
       ㉛ ★★★順位の 表が 4人ぶん 出て、★★「つぎへ」「やめる」を 押し出して いないか（★T218・🎨アト）★★★
       ------------------------------------------------------------
       ★ この かたまりを `verify()` の 中（★㉚ の note の 後ろ・`var out = {` の 前）に 貼って ください。

       ⚠️★★★ なぜ これが 要るか ―― ★★実際に 起きて いた こと です ★★★
          ★ ★T218 で 私が 測ったら、★★★100点で 終わった とき **6画面 ぜんぶで**
            ★ ★「つぎへ」「やめる」が 結果の 箱から 27〜82px はみ出し、★★指で 押せませんでした【実測】。
          ★ ★★＝ ★★勝負が ついた しゅんかんに、★★先へ 進めなく なって いました。
          ★ ★なぜ ⑪（resultProbe）が 気づかなかったか：★★`match.over` を 立てないので、
            ★ ★★順位の 表が **出て いない 箱** しか 測って いなかった から です。
          ★ ★★この 1本で **4度目**の 同じ 形の 事故 です（★㉓㉔ → T214-3 ／ ㉕ ／ ⑪ ／ ここ）。

       ★★ ㉘（コーダ）との 分け目 ★★
         ★ ㉘ … ★100点で 終わるか／★位が 正しいか（★同じ 点は 同じ 位）／★終わって いない ときは 出さない
         ★ ★★㉛（ここ）… ★★**見えるか・押せるか**。★4人ぶん 画面に 出て いるか／★字が 読めるか／
           ★ ★★★押す ところが 箱の 中に あって、★★本当に 指で 押せるか（★まん中を さして 自分が 返るか）。
       ============================================================ */
    /* ★ 線：★①4人ぶん ②表が 箱から 切れて いない ③字 11px 以上 ④へだたり 4.5 以上（★12マス ぜんぶ）
       ★ ★⑤「つぎへ」「やめる」が **44px 以上**・**箱の 中**・**指で 押せる** */
    var RK_FONT_MIN31 = 11, RK_RATIO_MIN31 = 4.5, RK_TAP_MIN31 = 44;
    /* ★ T217-4：★結果の 箱が 天井を 越えて いい ゆとり（★⑪ と 同じ 0.5px）*/
    var RK_CEIL_SLACK31 = 0.5;
    var RANK_CASE31 = [
      ['ふつう', [24, 106, 25, 79]],
      ['同点1位', [10, 10, 30, 100]],
['同点1位3人', [10, 10, 10, 100]],
      ['あなたが 最下位', [100, 20, 30, 10]]
    ];
    var r31 = { cases: 0, rows: [], why: [], worstRatio: 99, worstAt: '―', minFont: 99, mihon: null, box: '―' };
    /* ★ T217-4（★社長の 名指し）：★㉝ ―― ★順位の 表が 出て いる 場面で、★結果の 箱が 天井を 越えて いないか。
       ★ ★場面は ㉛ が 作った ものに 相乗りします（★★見張りを 重ねて 走らせない ため）。 */
    var r33 = { n: 0, why: [], amari: 9999, amariAt: '―' };
    var r34 = { n: 0, why: [], amari: 9999, amariAt: '―', kasa: 0, mihon: null };

    (function () {
      if (document.visibilityState !== 'visible') {
        r31.why.push('★★ページが 前に 出て いません（' + document.visibilityState + '）―― ★見え方は 測れません');
        return;
      }
      if (!resultScore) { r31.why.push('★立ち上がって いない'); return; }
      function lum31(c) {
        var m = String(c).match(/[\d.]+/g) || [0, 0, 0, 1];
        var a = m.length > 3 ? parseFloat(m[3]) : 1, v = [], i;
        for (i = 0; i < 3; i++) {
          var x = parseFloat(m[i]) / 255;
          x = a >= 1 ? x : x * a + (1 - a);
          v.push(x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4));
        }
        return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
      }
      function bg31(el) {
        for (var e = el; e && e !== document.documentElement; e = e.parentElement) {
          var m = String(getComputedStyle(e).backgroundColor).match(/[\d.]+/g);
          if (m && (m.length < 4 || parseFloat(m[3]) > 0.5)) return getComputedStyle(e).backgroundColor;
        }
        return 'rgb(255,255,255)';
      }
      function ratio31(el) {
        var a = lum31(getComputedStyle(el).color), b = lum31(bg31(el));
        var hi = Math.max(a, b), lo = Math.min(a, b);
        return Math.round((hi + 0.05) / (lo + 0.05) * 100) / 100;
      }
      /* ★★ 押す ところ ―― ★★まん中を さして、★その ボタン（か その 中身）が 返るか */
      function tap31(el, box, tag, quiet) {
        var w = [], b = el.getBoundingClientRect();
        if (b.height < RK_TAP_MIN31 - 0.5) w.push(tag + ' が ' + Math.round(b.height) + 'px（★' + RK_TAP_MIN31 + 'px 以上 の はず）');
        var cutBottom = Math.round(Math.max(0, b.bottom - box.bottom));
        var cutTop = Math.round(Math.max(0, box.top - b.top));
        if (cutBottom || cutTop) w.push('★★' + tag + ' が 結果の 箱から ' + (cutBottom || cutTop) + 'px はみ出して います');
        var cx = Math.round(b.left + b.width / 2), cy = Math.round(b.top + b.height / 2);
        var inV = (cy >= 0 && cy <= window.innerHeight && cx >= 0 && cx <= window.innerWidth);
        var hit = inV ? document.elementFromPoint(cx, cy) : null;
        if (!inV || !(hit && (hit === el || el.contains(hit)))) {
          w.push('★★★' + tag + ' が 指で 押せません（' + (inV ? 'さした 先は ' + (hit ? hit.className || hit.tagName : 'なし') : '画面の 外') + '）');
        }
        if (!quiet) { for (var i = 0; i < w.length; i++) r31.why.push(w[i]); }
        return w;
      }
      function look31(tag, quiet) {
        var w = [], wc = [];      /* ★ wc … ★T217-4 の ㉝（天井）の 声。★★㉛ の 声と 混ぜない */
        if (!rankList || rankList.classList.contains('hidden')) {
          w.push(tag + '：★順位の 表が 出て いません（★㉘ が 鳴って いる はず）');
          if (!quiet) { for (var q = 0; q < w.length; q++) r31.why.push(w[q]); }
          return w;
        }
        var box = resultBox.getBoundingClientRect(), rq = rankList.getBoundingClientRect();
        var pl = rankList.querySelectorAll('.rk-place'), nm = rankList.querySelectorAll('.rk-name');
        if (pl.length !== 4 || nm.length !== 4) w.push(tag + '：★★' + pl.length + '人ぶん しか 出て いません（★4人ぶん の はず）');
        if (rq.width <= 0 || rq.height <= 0) w.push(tag + '：★★表の 大きさが 0 です（' + Math.round(rq.width) + '×' + Math.round(rq.height) + '）');
        var cutR = Math.round(Math.max(0, rq.bottom - box.bottom) + Math.max(0, box.top - rq.top));
        if (cutR) w.push(tag + '：★★表が 結果の 箱から ' + cutR + 'px はみ出して います');
        /* ⚠️★★★ ここは **私が わざと 壊して 見つけた 穴** です（★T218・壊し⑤）★★★
           ★ ★はじめ「表が 箱から はみ出して いるか」だけ 見て いました。★★ところが
             ★ ★保険の 3行（`flex:0 1 auto; min-height:0; overflow:hidden`）が 効くと ――
             ★ ★★表**そのもの**が 縮み、★中の 4行が 表の 中で 切れます。★箱からは 1pxも 出ません。
           ★ ★★＝ ★「4人ぶん 出て いる」を **DOM の 数**で 数えて いたので、★静かに 通りました。
           ★ ★→ ★★**1マスずつ 位置を 見ます**（★表の 中に 収まって いるか）。
           ★ ★★★★2度目の 直し ―― ★★1度目は `.rk-place` だけ 見て いました。★横向きは 4列 なので
             ★ ★★位の 4つは 同じ 行に あり、★★切れるのは 下の「名前」と「点」でした【実測・812×375：
             ★ ★★表が 46 → 25px に 縮み、★位は 見えた まま】。★→ ★★**12マス ぜんぶ**を 見ます。 */
        var hid31 = 0, hidName = [];
        for (var hz = 0; hz < rankList.children.length; hz++) {
          var kid31 = rankList.children[hz];
          if (!kid31.textContent) continue;
          var pb = kid31.getBoundingClientRect();
          if (pb.height <= 0 || pb.bottom > rq.bottom + 0.5 || pb.top < rq.top - 0.5 ||
              pb.bottom > box.bottom + 0.5) { hid31++; if (hidName.length < 3) hidName.push(kid31.textContent); }
        }
        if (hid31) w.push(tag + '：★★★表の 12マスの うち ' + hid31 + 'マスが 切れて 見えません（' + hidName.join('・') + ' …）');
        /* ★ 12マス ぜんぶの 字と へだたり */
        var i, kid;
        for (i = 0; i < rankList.children.length; i++) {
          kid = rankList.children[i];
          if (!kid.textContent) continue;
          var f = Math.round(parseFloat(getComputedStyle(kid).fontSize) * 10) / 10;
          var rt = ratio31(kid);
          if (!quiet) {
            r31.minFont = Math.min(r31.minFont, f);
            if (rt < r31.worstRatio) { r31.worstRatio = rt; r31.worstAt = (kid.className.split(' ')[0]) + '「' + kid.textContent + '」'; }
          }
          if (f < RK_FONT_MIN31) w.push(tag + '：★字が ' + f + 'px「' + kid.textContent + '」（★' + RK_FONT_MIN31 + 'px 以上 の はず）');
          if (rt < RK_RATIO_MIN31) w.push(tag + '：★★へだたり ' + rt + ':1「' + kid.textContent + '」（★' + RK_RATIO_MIN31 + ' 未満 ―― ★うすくて 読めません）');
        }
        /* ============================================================
           ★★★ T218-2（アト）―― ★★金の 帯が「1位の 人 ぜんぶ」に **出て いるか** ★★★
           ------------------------------------------------------------
           ⚠️★★ ㉘ が 数えて いるのは `.rk-top` という **JS の 印** です。
              ★ ★★印が 6マス 付いて いても、★CSS が 1行目 しか 塗って いなければ
                ★ ★★★遊ぶ 人には「1位が 1人」に 見えます ―― ★★34個 どれも 鳴りませんでした【★実測】。
              ★ ★→ ★★ここでは **本当に 塗られた 色**（getComputedStyle）を 数えます。
           ⚠️★ 金の 色は **--gold-soft を いちど 塗って 読み直した もの**を 使います。
              ★ ★行の 色から 取ると、★★ぜんぶ 白に なった とき 見張りも 一緒に 白を 正しいと 言います。
           ★ ★上の線 … ★金の マスの 数 ＝ 1位の マスの 数（★1人＝3・2人＝6・3人＝9・4人＝12）
           ★ ★★下の線 … ★1マスずつ「金か」と「1位か」が 合うか（★★ゆるめる ときこそ こちら）
           ★ ★角の線 … ★1位の 行の 頭(.rk-place)と おしり(.rk-pt)が 丸いか／★1位でない 行が 丸く ないか
           ★ ★★わざと 壊して 5 / 5 鳴る ことを 確かめて あります
             ★ ★（logs/T218_計測どうぐ/t218_2_kin.cjs kowasu）
           ============================================================ */
        (function () {
          function norm31(c) {
            var d = document.createElement('span');
            d.style.cssText = 'position:absolute;left:-9999px;top:-9999px;background:' + c;
            document.body.appendChild(d);
            var v = getComputedStyle(d).backgroundColor;
            d.parentNode.removeChild(d);
            return v;
          }
          var GOLD31 = norm31((getComputedStyle(document.documentElement).getPropertyValue('--gold-soft') || '').trim());
          if (!GOLD31 || GOLD31 === 'rgba(0, 0, 0, 0)') { w.push(tag + '：★★金の 色（--gold-soft）が 読めません'); return; }
          var kd = rankList.children, want31 = 0, got31 = 0, kmis = [], kz;
          for (kz = 0; kz < kd.length; kz++) {
            var kc = kd[kz], khead = kd[Math.floor(kz / 3) * 3];
            var is1 = !!khead && khead.textContent === '1位';
            var kcs = getComputedStyle(kc), isGold = (kcs.backgroundColor === GOLD31);
            if (is1) want31++;
            if (isGold) got31++;
            if (isGold !== is1 && kmis.length < 6) {
              kmis.push((is1 ? '1位' : 'その他') + 'の「' + kc.textContent + '」が ' +
                        (isGold ? '金に なって います' : '★金に なって いません'));
            }
            var kround = (kcs.borderRadius !== '0px' && kcs.borderRadius !== '');
            var kedge = /rk-place/.test(kc.className) || /rk-pt/.test(kc.className);
            if (is1 && kedge && !kround && kmis.length < 6) kmis.push('1位の「' + kc.textContent + '」の 角が 丸く ありません');
            if (!is1 && kround && kmis.length < 6) kmis.push('1位では ない「' + kc.textContent + '」の 角が 丸く なって います');
          }
          if (got31 !== want31) {
            w.push(tag + '：★★★金の 帯が ' + got31 + 'マス（★1位は ' + want31 +
                   'マス ―― ★1人＝3・2人＝6・3人＝9）');
          }
          if (kmis.length) w.push(tag + '：★★金の 帯が 位と 合いません ―― ' + kmis.join('・'));
        })();

        /* ============================================================
           ★★★ T217-4（★★社長の 名指し）―― ★★順位の 表が **天井を 越えて いないか** ★★★
           ------------------------------------------------------------
           ⚠️★★ なぜ これが 要るか ―― ★★アトが 正直に 出した 数字 が 元です（★T218 §15）。
              ★ ★金の 帯は `font-size:1.08em` を 持つ ので、★帯が 増えると 表が 伸びます。
              ★ ★★**320×480 × 4人同点で、★天井まで あまり 0.0px**（★1人 4.7／2人 1.4／3人 0.1）。
              ★ ★★社長の お決め：★★**直しません**（★設計図 追記③ ―― ★まれな 最悪の ために
                ★ ★いつもの 画面を 小さく しない。★4人同点は **0 / 20000試合**）。
              ★ ★→ ★★★「越えて いない」は 越えて いない。★★でも ★**次に 誰かが 1px 足したら 越えます**。
                ★ ★★その ときに 鳴る ように、★ここに 線を 引きます。
           ★ ★★上の線 … ★結果の 箱の たけ ≦ `--result-max`（★0.5px までは 目こぼし）
           ★ ★★下の線 … ★★見本E（★★天井の ふたを 外して 高く する）で、★毎回 鳴る ことを 見る
             ★ ★★（★私の 決まり：★上の線を 引いたら、下の線も 引く。★★ゆるめる ときこそ 下の線）
           ★ ★★表が 箱から はみ出す ほうは、★上の `cutR` と `hid31` が すでに 見て います。
             ★ ★ここは その 外側 ―― ★★**箱 そのものが ふたを 破って いないか** です。
           ★ ★★⑪ とは 別物 です：★⑪ は「つよさの えらび ＋ 点の 表」の 場面。
             ★ ★★ここは **順位の 表が 出て いる 場面**（★100点で 終わった とき）で 測ります。
           ============================================================ */
        (function () {
          var maxR31 = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--result-max'), 10) || 0;
          if (!maxR31) { wc.push(tag + '：★★結果の 箱の 天井（--result-max）が 読めません'); return; }
          var over31 = Math.round((box.height - maxR31) * 10) / 10;
          if (over31 > RK_CEIL_SLACK31) {
            wc.push(tag + '：★★★結果の 箱が 天井を ' + over31 + 'px 越えて います（' +
                    (Math.round(box.height * 10) / 10) + 'px ／ 天井 ' + maxR31 + 'px）');
          }
          if (!quiet) {
            r33.n++;
            if (-over31 < r33.amari) { r33.amari = -over31; r33.amariAt = tag + '（' + maxR31 + 'px）'; }
          }
        })();

        /* ★★ 押す ところ（★これが この 見張りの 芯）*/
        w = w.concat(tap31(btnNext, box, '「つぎへ／もう1回」', true));
        w = w.concat(tap31(btnQuit, box, '「やめる」', true));
        if (!quiet) {
          for (var k = 0; k < w.length; k++) r31.why.push(w[k]);
          for (var kc = 0; kc < wc.length; kc++) r33.why.push(wc[kc]);
          r31.box = Math.round(box.height) + 'px（天井 ' +
            (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--result-max'), 10) || 0) + 'px）';
        }
        /* ★ 返すのは 2つ合わせ ―― ★見本（★わざと 壊して 鳴るか）は これを 数えます */
        return w.concat(wc);
      }

      function look34(tag, quiet) {
        var w = [];
        if (!rankList || rankList.classList.contains('hidden')) {
          w.push(tag + '：★順位の 表が 出て いません');
          if (!quiet) { for (var q0 = 0; q0 < w.length; q0++) r34.why.push(w[q0]); }
          return w;
        }
        if (document.visibilityState !== 'visible') {
          w.push(tag + '：★★ページが 前に 出て いません（' + document.visibilityState + '）―― 測りません');
          if (!quiet) { for (var q1 = 0; q1 < w.length; q1++) r34.why.push(w[q1]); }
          return w;
        }
        var rq34 = rankList.getBoundingClientRect();
        if (rq34.width <= 0 || rq34.height <= 0) {
          w.push(tag + '：★★表の 大きさが 0 です（' + Math.round(rq34.width) + '×' + Math.round(rq34.height) + '）');
          if (!quiet) { for (var q2 = 0; q2 < w.length; q2++) r34.why.push(w[q2]); }
          return w;
        }
        /* ★★ A ―― ★同じ 列の 上下の マスが 重なって いないか（★★私が 見落として いた 目）*/
        var cl34 = [], z34, e34, r0;
        for (z34 = 0; z34 < rankList.children.length; z34++) {
          e34 = rankList.children[z34];
          if (!e34.textContent) continue;
          r0 = e34.getBoundingClientRect();
          cl34.push({ t: r0.top, b: r0.bottom, l: r0.left, r: r0.right, s: e34.textContent });
        }
        if (cl34.length !== 12) w.push(tag + '：★★マスが ' + cl34.length + '個 しか ありません（★12個の はず）');
        var kas34 = 0, kn34 = [], zi, zj, A34, B34, xo34, yo34;
        for (zi = 0; zi < cl34.length; zi++) {
          for (zj = zi + 1; zj < cl34.length; zj++) {
            A34 = cl34[zi]; B34 = cl34[zj];
            xo34 = Math.min(A34.r, B34.r) - Math.max(A34.l, B34.l);   /* ★ よこに 重なる はば */
            yo34 = Math.min(A34.b, B34.b) - Math.max(A34.t, B34.t);   /* ★ たてに 重なる たけ */
            if (xo34 > 1 && yo34 > 0.5) {
              kas34++;
              if (kn34.length < 3) kn34.push('「' + A34.s + '」と「' + B34.s + '」');
            }
          }
        }
        if (kas34) {
          w.push(tag + '：★★★順位の 字が 重ね書きに なって います（' + kas34 + '組 ―― ' + kn34.join('・') + '）');
        }
        /* ★★ B ―― ★箱の「素のたけ」が この 画面の 天井に もともと 入るか
           ★ ★★ふたを いちど 外して 測り、★すぐ 戻します（★測る ための 一瞬・still の 中）。 */
        var mx34 = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--result-max'), 10) || 0;
        if (!mx34) {
          w.push(tag + '：★★結果の 箱の 天井（--result-max）が 読めません');
          if (!quiet) { for (var q3 = 0; q3 < w.length; q3++) r34.why.push(w[q3]); if (kas34) r34.kasa += kas34; }
          return w;
        }
        var keep34 = resultBox.style.maxHeight;
        resultBox.style.maxHeight = 'none';
        void resultBox.offsetWidth;
        var nat34 = Math.round(resultBox.getBoundingClientRect().height * 10) / 10;
        resultBox.style.maxHeight = keep34;
        void resultBox.offsetWidth;
        if (nat34 - mx34 > 0.5) {
          w.push(tag + '：★★★この 画面の 形は 天井に もともと 入りません（★素のたけ ' + nat34 +
                 'px ／ 天井 ' + mx34 + 'px ―― ★' + (Math.round((nat34 - mx34) * 10) / 10) + 'px 足りず、' +
                 '★★足りない ぶんは 順位の 表が だまって かぶります）');
        }
        if (!quiet) {
          r34.n++; r34.kasa += kas34;
          if (mx34 - nat34 < r34.amari) {
            r34.amari = Math.round((mx34 - nat34) * 10) / 10;
            r34.amariAt = tag + '（素 ' + nat34 + ' ／ 天井 ' + mx34 + 'px）';
          }
          for (var q4 = 0; q4 < w.length; q4++) r34.why.push(w[q4]);
        }
        return w;
      }

      /* ★ 覚える（★㉘ と 同じ 6つ ＋ rankList）*/
      var madeG31 = false, madeM31 = false;
      if (!match) { match = C.newMatch(C.LEVEL_START); madeM31 = true; }
      if (!g) { g = C.makeGame(C.rng(20260911), { rules: rules, dealNo: 0 }); madeG31 = true; }
      var kTotal31 = match.total.slice(), kDeal31 = match.dealNo, kOver31 = match.over, kWin31 = match.winners.slice();
      var kMoon31 = g ? g.moonBy : -1;
      var kT31 = titleScreen.classList.contains('hidden'), kP31 = playScreen.classList.contains('hidden');
      var kHid31 = resultWrap.classList.contains('hidden');
      var kTitle31 = resultTitle.textContent, kCls31 = resultTitle.className, kSay31 = resultSay.textContent;
      var kScore31 = resultScore.innerHTML, kNext31 = btnNext.innerHTML;
      var kLv31 = levelPickResult.classList.contains('hidden');
      var kLock31 = resultBox.classList.contains('is-locked');
      var kRank31 = rankSnap();
      var t31 = timers.length;
      /* ⚠️★ 結果の 箱が 出て いる とき、★本物の 画面では はじめの 画面は 消えて います（★⑪ の 直しと 同じ）*/
      titleScreen.classList.add('hidden'); playScreen.classList.remove('hidden');
      /* ⚠️★★★ ここも **私が わざと 走らせて 見つけた うその NG** です（★T218・`narasu mid`）★★★
         ★ ★はじめの 画面で verify を 呼ぶと ―― ★★`layout()` が まだ 走って いない ので
           ★ ★`--result-max` が **CSS の はじめの 値 200px の まま**でした。
           ★ ★★すると 私の ㉛ が「★ボタンが 47px はみ出して 押せません」と **うそを 鳴らしました**【実測】。
         ★ ★★本物の 画面では、★結果の 箱が 出る ときには 必ず `layout()` が 走って います。
         ★ ★→ ★★**測る 前に 場面を そこまで 作ります**（★T214-3 の 決まり：★見張りは 場面を 自分で 作る）。
         ★ ★★終わったら 下の 戻しで もう 1回 `layout()` を 呼びます。 */
      build(); layout();

      still(function () {
        if (g) g.moonBy = -1;
        for (var ci = 0; ci < RANK_CASE31.length; ci++) {
          var nm31 = RANK_CASE31[ci][0], tot31 = RANK_CASE31[ci][1];
          var lo31 = Math.min(tot31[0], tot31[1], tot31[2], tot31[3]);
          match.over = true; match.winners = [];
          for (var q = 0; q < 4; q++) if (tot31[q] === lo31) match.winners.push(q);
          match.total = tot31.slice(); match.dealNo = 9;
          showResult([3, 4, 5, 14], [0, 0, 0, 0]);
          resultBox.classList.remove('is-locked');       /* ★ 出た 直後の 550ms の 鍵は 測る 相手では ない（★T214-3）*/
          r31.cases++;
          look31(nm31);
          look34(nm31);

          if (rankList && !rankList.classList.contains('hidden')) {
            var pl31 = rankList.querySelectorAll('.rk-place'), nn31 = rankList.querySelectorAll('.rk-name');
            var line = [];
            for (var z = 0; z < pl31.length; z++) line.push(pl31[z].textContent + nn31[z].textContent);
            r31.rows.push(nm31 + ' → ' + line.join(' '));
          }
        }
        /* ============================================================
           ★★ 見本の 線 ―― ★★毎回 わざと 3通り 壊して、★鳴る ことを 見る（★決め打ち）
           ★ ★A 表を うんと 高く する ＝ ★★ボタンが 押し出される（★★今日 本当に 起きて いた 形）
           ★ ★B 字を 8px に する
           ★ ★C 字を 器と 同じ 色に する
           ★ ★★E（T217-4）★★天井（--result-max）の ふたを 外して 箱を 高く する
             ★ ★★A では 鳴りません ―― ★★箱に `max-height:var(--result-max)` の ふたが 効いて いて、
               ★ ★中身が いくら 伸びても **箱の たけは 天井で 止まる** から です【★実測】。
               ★ ★★＝ ★天井の 線を 鳴らすには、★★ふたそのものを 外す しか ありません。
           ============================================================ */
        var mi31 = { 押し出し: false, 小さい: false, うすい: false, 天井: false, もどった: false };
        var st31 = document.createElement('style');
        document.head.appendChild(st31);
        st31.textContent = '#rankList{min-height:400px !important;}';
        void resultBox.offsetWidth;
        mi31.押し出し = look31('見本A', true).length > 0;
        st31.textContent = '#rankList *{font-size:8px !important;}';
        void resultBox.offsetWidth;
        mi31.小さい = look31('見本B', true).length > 0;
        st31.textContent = '#rankList *{color:' + getComputedStyle(rankList || resultBox).backgroundColor + ' !important;}';
        void resultBox.offsetWidth;
        mi31.うすい = look31('見本C', true).length > 0;
        /* ★★ 見本E（T217-4）―― ★天井の ふたを 外して、★★天井の 線が 本当に 鳴るか */
        st31.textContent = '#resultBox{max-height:none !important; min-height:520px !important;}';
        void resultBox.offsetWidth;
        mi31.天井 = look31('見本E', true).some(function (x) { return x.indexOf('天井を') >= 0; });
        st31.parentNode.removeChild(st31);
        void resultBox.offsetWidth;
        mi31.もどった = look31('もどし', true).length === 0;
        /* ============================================================
           ★★ 見本の 線 その2（T218-2）―― ★★上の「金の 帯」の 目が 本当に 鳴るか
           ------------------------------------------------------------
           ⚠️★★★ ここは **自分で 場面を 作ります**。★★上の for は
              ★ ★「あなたが 最下位」（★★1位が 1人）で 終わって います。★★そのまま 壊すと
              ★ ★★`:not(:nth-child(-n+3))` が **何にも 当たらず**、
              ★ ★★★「鳴らない のが 正しい」に なって しまいます【★私が 実際に 踏みました】。
              ★ ★＝ ★★「見張って いる ふり」の 5つ目（★その場面を そもそも 作って いない）。
           ★ ★壊し方は「前の CSS に 戻す」―― ★★T218-2 で 直した その 形 そのもの です。
           ============================================================ */
        var miK31 = { ふだん: -1, 壊した: -1, もどった: false };
        match.over = true; match.winners = [0, 1];
        match.total = [10, 10, 30, 100]; match.dealNo = 9;      /* ★ 1位が 2人 の 場面を 作る */
        showResult([3, 4, 5, 14], [0, 0, 0, 0]);
        resultBox.classList.remove('is-locked');
        miK31.ふだん = look31('見本D', true).length;             /* ★ ふだんは 0 の はず */
        var stK31 = document.createElement('style');
        stK31.textContent = '#rankList > .rk-top:not(:nth-child(-n+3))' +
                            '{background:var(--cream)!important;border-radius:0!important;}';
        document.head.appendChild(stK31);
        void resultBox.offsetWidth;
        miK31.壊した = look31('見本D', true).length;
        stK31.parentNode.removeChild(stK31);
        void resultBox.offsetWidth;
        miK31.もどった = look31('もどしD', true).length === 0;
        r31.mihonKin = miK31;

        /* ============================================================
           ★★ 見本の 線（T220）―― ★★毎回 わざと 3通り 壊して、★3通り 鳴る ことを 見る
           ★ ★① 天井を 120px に 下げる                     → ★B が 鳴る
           ★ ★② マスを 14px 上に 引き上げる                    → ★★A が 鳴る
           ★ ★★③ ★★T220 で 直した 事故 そのもの ―― ★4列を **4行に 戻し**、
             ★ ★天井を 225px（★★iPhone SE 初代 320×454 の 実際の 天井）に する → ★B が 鳴る

           ⚠️★★★ ② は はじめ「箱の ふたを 150px に つぶす」に して いました ―― ★★鳴りませんでした。
              ★ ★★たてが 480px 以上は **4行**・479px 以下は **4列** ―― ★★行と 列が 入れかわって います。
                ★ ★★4行では つぶしても 切れる だけ で 重なりません。★★名前を ずらすと、★4行では
                ★ ★★★名前が **1列ぶん ぜんぶ 同じだけ** 動く ので、★これも 重なりません【★実測 ★×】。
              ★ ★＝ ★★「見張って いる ふり」の 5つ目 ―― ★★その 場面を そもそも 作って いない。
              ★ ★→ ★★どちらの 形でも かならず 重なる 壊しかた（★マスに margin-top:-14px）に 変えました。

           ⚠️★★★ ★「もどった」は **0件に 戻ったか** では なく **元の 件数に 戻ったか** で 見ます。
              ★ ★★天井が 183px より 低い 画面（568×320 など）では、★ふだんから ㉞ が 鳴って います。
              ★ ★★そこを 0 と くらべると ★★「見本を もどせて いません」と **うそを 鳴らします**
                ★ ★【★私が 実際に 踏みました】。★★T218-2 の 見本D と 同じ わな です。
           ============================================================ */
        var mi34 = { ふだん: -1, 天井: false, つぶし: false, T220: false, もどった: false };
        mi34.ふだん = look34('見本もと', true).length;      /* ★★ 壊す 前の 件数を 覚える */
        var st34 = document.createElement('style');
        document.head.appendChild(st34);
        st34.textContent = ':root{--result-max:120px !important;}';
        void resultBox.offsetWidth;
        mi34.天井 = look34('見本ア', true).some(function (x) { return x.indexOf('もともと 入りません') >= 0; });
        st34.textContent = '#rankList > *{margin-top:-14px !important;}';
        void resultBox.offsetWidth;
        mi34.つぶし = look34('見本イ', true).some(function (x) { return x.indexOf('重ね書き') >= 0; });
        /* ⚠️★★★ T221（💻コーダ）―― ★★この 見本が **1画面で 死んで いました**（★私が 作った 穴）★★★
           ★ ★T221 で「★たて 320px 以下では つよさの えらび（48px）を 出さない」と しました。
           ★ ★★すると 568×320 では、★4行に 戻しても 箱の 素のたけが 244.3 → **196.3px** に なり、
             ★ ★★決め打ちの 天井 **225px** を 越えず ―― ★★★見本ウ が 鳴らなく なりました【実測】。
           ★ ★★＝ ★★「見張って いる ふり」の 5つ目：★★その 場面を そもそも 作って いない。
           ★ ★→ ★★見本の 中では **つよさの えらびを 出した まま**に します（★T220 の 事故が
             ★ ★起きた ときの 形 そのもの）。★★225px は 320×454 の 実際の 天井なので 動かしません。 */
        st34.textContent = ':root{--result-max:225px !important;}' +
                           '.result-box .level-pick{display:flex !important;}' +
                           '#rankList{grid-template-columns:auto 1fr auto !important;' +
                           'grid-template-rows:none !important;grid-auto-flow:row !important;' +
                           'font-size:12.5px !important;line-height:1.3 !important;' +
                           'gap:2px 0 !important;padding:4px 6px !important;}' +
                           '#rankList > *{padding:1px 5px !important;}';
        void resultBox.offsetWidth;
        mi34.T220 = look34('見本ウ', true).some(function (x) { return x.indexOf('もともと 入りません') >= 0; });
        st34.parentNode.removeChild(st34);
        void resultBox.offsetWidth;
        mi34.もどった = (look34('もどしT220', true).length === mi34.ふだん);
        r34.mihon = mi34;

        r31.mihon = mi31;
      });

      /* ★ 戻す（★㉘ と 同じ 順で・1つ 残らず）*/
      for (var tt31 = timers.length - 1; tt31 >= t31; tt31--) { clearTimeout(timers[tt31]); timers.splice(tt31, 1); }
      match.total = kTotal31; match.dealNo = kDeal31; match.over = kOver31; match.winners = kWin31;
      if (g) g.moonBy = kMoon31;
      resultTitle.textContent = kTitle31; resultTitle.className = kCls31; resultSay.textContent = kSay31;
      resultScore.innerHTML = kScore31; btnNext.innerHTML = kNext31;
      rankPut(kRank31);
      if (kLv31) levelPickResult.classList.add('hidden'); else levelPickResult.classList.remove('hidden');
      if (kLock31) resultBox.classList.add('is-locked'); else resultBox.classList.remove('is-locked');
      if (kHid31) resultWrap.classList.add('hidden'); else resultWrap.classList.remove('hidden');
      if (kT31) titleScreen.classList.add('hidden'); else titleScreen.classList.remove('hidden');
      if (kP31) playScreen.classList.add('hidden'); else playScreen.classList.remove('hidden');
      if (madeG31) g = null;
      if (madeM31) match = null;
      layout();                                   /* ★ 上の 書き置きの 対（★寸法を 元の 場面に 戻す）*/
    })();

    for (var i31 = 0; i31 < r31.why.length; i31++) ng.push('★★㉛ 順位の 表が 見えるか：' + r31.why[i31]);
    if (!r31.cases && !r31.why.length) ng.push('★★★㉛ 順位の 表を 1場面も 測れて いません（★試し方が おかしい）');
    if (!r31.mihonKin) {
      ng.push('★★★㉛ 金の 帯の 見本を 1度も 試せて いません（★試し方が おかしい）');
    } else {
      if (r31.mihonKin.ふだん !== 0) ng.push('★★★㉛ 同点1位の 場面で いきなり ' + r31.mihonKin.ふだん + '件 鳴って います');
      if (!r31.mihonKin.壊した) ng.push('★★★㉛ 金の 帯を わざと 1行目だけに しても 気づきません ―― ★★**見張りの ほうが 壊れて います**');
      if (!r31.mihonKin.もどった) ng.push('★★★㉛ 金の 帯の 見本を 元に もどせて いません（★あとの 数字が 信じられません）');
    }

    if (r31.cases && r31.cases < RANK_CASE31.length) {
      ng.push('★★㉛ ' + RANK_CASE31.length + '場面の うち ' + r31.cases + '場面 しか 測れて いません');
    }
    if (r31.mihon) {
      if (!r31.mihon.押し出し) ng.push('★★★㉛ 表を わざと 高く して ボタンを 押し出しても 気づきません ―― ★★**見張りの ほうが 壊れて います**');
      if (!r31.mihon.小さい) ng.push('★★★㉛ 字を わざと 8px に しても 気づきません ―― ★★**見張りの ほうが 壊れて います**');
      if (!r31.mihon.うすい) ng.push('★★★㉛ 字を わざと 器と 同じ 色に しても 気づきません ―― ★★**見張りの ほうが 壊れて います**');
      if (!r31.mihon.もどった) ng.push('★★★㉛ 見本を 元に もどせて いません（★あとの 数字が 信じられません）');
    }
    note['㉛ ★★順位の 表が 見えるか'] = '★数えた ' + r31.cases + '場面／' + r31.rows.join('／') +
      '／★箱 ' + r31.box + '／★字 いちばん 小さい ' + r31.minFont + 'px（★' + RK_FONT_MIN31 + 'px まで）' +
      '／★へだたり いちばん 低い ' + r31.worstRatio + ':1 ' + r31.worstAt + '（★' + RK_RATIO_MIN31 + ' まで）' +
      '／★★押す ところ ' + (r31.why.length ? '★★NG' : '「つぎへ」「やめる」とも 箱の 中・44px・指で 押せる') +
      '／★見本 ' + (r31.mihon ? ['押し出し', '小さい', 'うすい', 'もどった'].map(function (k) {
        return k + ' ' + (r31.mihon[k] ? '○' : '★×');
      }).join('・') : '―') +
      '／★★金の 帯の 見本 ' + (r31.mihonKin ?
        (r31.mihonKin.ふだん + '→' + r31.mihonKin.壊した + '件・もどり ' +
         (r31.mihonKin.もどった ? '○' : '★×')) : '―');

    /* ============================================================
       ㉝ ★★★順位の 表が 天井を 越えて いないか（★T217-4・★★社長の 名指し）★★★
       ------------------------------------------------------------
       ⚠️★★ 番号は ㉝ですが、★★置き場所は ㉜ の **前** です。
          ★ ★㉜ は「★頭で 写した 画面と くらべる」ので、★★いつも いちばん おしり に 居ます
          ★ ★（★㉜ の 書き置き：「★1つでも 後に 増やしたら、その 下へ」）。★番号は ただの 名前 です。
       ⚠️★★ 場面は ㉛ が 作った ものに **相乗り**して います（★4場面 ぜんぶ）。
          ★ ★★同じ 場面を もう1度 作り直すと、★★見張りを 重ねて 走らせる ことに なる ため。
          ★ ★→ ★★だから 下の 1本目「★1度も 測れて いない」が いちばん 大事な 線 です。
            ★ ★★㉛ が こけたら、★ここも 黙る ―― ★その 黙りを、★この 線が 鳴らします。
       ★ ★★上の線 … ★結果の 箱の たけ ≦ `--result-max`（★ゆとり 0.5px）
       ★ ★★下の線 … ★見本E（★天井の ふたを 外す）で、★毎回 鳴る ことを 見る
       ★ ★★★数字も 残します（★天井まで の あまり）―― ★★アトの 0.0px は ここに 出ます。
         ★ ★社長の お決めで **直しません**。★★でも 次に 誰かが 1px 足したら、★上の線が 鳴ります。
       ============================================================ */
    for (var i33 = 0; i33 < r33.why.length; i33++) ng.push('★★㉝ 順位の 表が 天井を 越えて いないか：' + r33.why[i33]);
    if (!r33.n) ng.push('★★★㉝ 天井を 1場面も 測れて いません（★★㉛ の 場面に 相乗りして います ―― ★そちらが こけて います）');
    if (!r31.mihon) {
      ng.push('★★★㉝ 天井の 見本を 1度も 試せて いません（★試し方が おかしい）');
    } else if (!r31.mihon.天井) {
      ng.push('★★★㉝ 結果の 箱を わざと 天井より 高く しても 気づきません ―― ★★**見張りの ほうが 壊れて います**');
    }
    note['㉝ ★★順位の 表が 天井を 越えて いないか'] = '★数えた ' + r33.n + '場面／' +
      '★★天井まで あまり いちばん 少ない ' + (r33.amari === 9999 ? '―' : r33.amari + 'px ' + r33.amariAt) +
      '（★ゆとり ' + RK_CEIL_SLACK31 + 'px まで）' +
      '／★越えた 場面 ' + (r33.why.length ? '★★' + r33.why.length + '件' : 'なし') +
      '／★見本E（★ふたを 外す）' + (r31.mihon ? (r31.mihon.天井 ? '鳴る ○' : '★★鳴らない ×') : '―');
    /* ============================================================
       ㉞ ★★★順位の 表が だまって つぶれて いないか（★T220・🎨アト）★★★
       ------------------------------------------------------------
       ★ ★㉛ … ★「いま 切れて いるか」（★結果）
       ★ ★㉝ … ★「箱が 天井を 越えて いないか」（★★越えては いない ―― ★つぶして 入れて いても 静か）
       ★ ★★㉞ … ★★「★そもそも 入る 形か」＋「★★字が 重なって いないか」（★原因）
       ★ ★★★㉝ と ㉞ は **正反対の 目** です：
         ★ ★㉝ は「箱が ふたを 破って いないか」、★★㉞ は「★ふたに 収めるために 中身を つぶして いないか」。
         ★ ★★T219 🟡-1 は ★㉝ が 静かな まま 起きました ―― ★箱は 天井を 越えて いなかった から です。
       ============================================================ */
    for (var i34 = 0; i34 < r34.why.length; i34++) ng.push('★★㉞ 順位の 表が つぶれて いないか：' + r34.why[i34]);
    if (!r34.n && !r34.why.length) ng.push('★★★㉞ 1場面も 測れて いません（★試し方が おかしい）');
    if (!r34.mihon) {
      ng.push('★★★㉞ 見本を 1つも 走らせて いません');
    } else {
      if (!r34.mihon.天井) ng.push('★★★㉞ 天井を わざと 120px に しても「入りません」と 出ません ―― ★★画面では なく **見張りの ほうが 壊れて います**');
      if (!r34.mihon.つぶし) ng.push('★★★㉞ マスを わざと 14px 上に 引き上げても「重ね書き」と 出ません ―― ★★**見張りの ほうが 壊れて います**');
      if (!r34.mihon.T220) ng.push('★★★㉞ 4列を わざと 4行に 戻しても 気づきません ―― ★★T219 🟡-1 が また 通り抜けます');
      if (!r34.mihon.もどった) ng.push('★★★㉞ 見本を 元に もどせて いません（★あとの 数字が 信じられません）');
    }
    note['㉞ ★★順位の 表が つぶれて いないか'] =
      '★数えた ' + r34.n + '場面／★字の 重なり ' + r34.kasa + '組／' +
      '★★素のたけの あまり いちばん 少ない ' + (r34.amari === 9999 ? '―' : r34.amari + 'px') +
      '（' + r34.amariAt + '）' +
      '／★見本 ' + (r34.mihon ?
        ['ふだん', '天井', 'つぶし', 'T220', 'もどった'].map(function (k) {
          return k + ' ' + (k === 'ふだん' ? r34.mihon[k] + '件' : (r34.mihon[k] ? '○' : '★×'));
        }).join('・') : '―');

    /* ============================================================
       ★★★ 見張り ㉟【2】―― ★★🎨アト作（T220-2 `t2202_mihari.js`）を そのまま 貼りました（T221・💻コーダ）★★★
       ★ ★1文字も 変えて いません。★★入れ先だけが 私の 持ちもの だった ので、貼るのが 私の 仕事 でした。
       ============================================================ */
    /* ============================================================
       ㉟ ★★★決め打ちの 線が、実在の 画面を またいで いないか（T220-2・🎨アト）★★★
       ------------------------------------------------------------
       ★ ㉛㉝㉞ … ★★「いま 開いて いる 画面」を 測る（★1画面ぶん）
       ★ ★★㉟   … ★★★「★線の 引き方」を 見る（★★全画面ぶん・★1回で 済む）
       ★ ★★★＝ ★㉟ だけは、★どの 画面で 走らせても 同じ 答えを 出します。
       ============================================================ */
    var r35 = { lines: [], mata: [], why: [], mihon: null, css: 0, js: 0, yurushi: 0 };
    /* ⚠️★★★ 【1】が 貼られて いなくても **verify を 落とさない** ★★★
       ★ ★私の しくじり②（T220-2 §5-2）：★はじめ ここを 素の `mm35` で 書いて いて、
         ★ ★★【1】を 貼り忘れた ときに ★★`mm35 is not defined` で **verify が まるごと 死にました**。
       ★ ★★＝ ★「見張りが 見張る 相手を 殺す」―― ★★この 1本で 5度目の 同じ 形の 事故 です。 */
    var MM35 = (typeof mm35 === 'undefined') ? { seen: [], orig: null, nashi: true } : mm35;
    (function () {
      /* ★★ ①実在の 画面（★会社の 一覧。★★増やしたら 見本の 数も 変える こと）★★ */
      var GAMEN35 = [
        [320, 568, '★決まった6'], [320, 480, '★決まった6'], [812, 375, '★決まった6'],
        [667, 375, '★決まった6'], [844, 390, '★決まった6'], [736, 414, '★決まった6'],
        [926, 428, '★Pro Max よこ'], [320, 454, '★SE初代 たて'], [568, 320, '★SE初代 よこ'],
        [932, 430, '14/15 Pro Max よこ'], [883, 430, '同たけ'], [896, 414, '12/13 Pro よこ'],
        [852, 393, '14/15 よこ'], [640, 360, '古い PC'], [480, 320, '古い Android よこ'],
        [568, 272, 'SE初代よこ＋帯'], [360, 640, 'Android たて'], [375, 667, '8 たて'],
        [375, 812, 'X たて'], [390, 844, '14/15 たて'], [414, 896, '12/13 Pro たて'],
        [428, 926, 'Pro Max たて'], [430, 932, '14/15 Pro Max たて'],
        [768, 1024, 'iPad たて'], [1024, 768, 'iPad よこ'], [1280, 800, 'PC'],
        [1512, 982, 'PC'], [1920, 1080, 'PC']
      ];
      var GAMEN_N = 28;                                   /* ★ 一覧の 数（★増やしたら ここも 変える）*/

      /* ★★ ②ゆるし表 ―― ★★「両側を 測って、どちらも OK だった」線 だけ ★★
         ★ ★★ここに 足すには **両側の 画面で 実際に 測る** こと。★思いこみで 足さない。 */
      var YURUSHI35 = {
        '(max-width:520px)': '★ふきだしの 字を 1段 下げる だけ。★480×320（14px）と 568×320（16px）の 両側で 測り、★NG は どちらも 前と 同じ【T220-2 実測・33画面】',
        '(max-width:650px)': '★囲いの 内よはくだけ。★640×360 と 667×375 の 両側で 測り、★NG は どちらも 0【T220-2 実測】',
        '(max-width:340px)': '★外がわの 内よはくだけ（6px→3px）。★320×568 と 360×640 の 両側で 測り、★NG は どちらも 0【T220-2 実測】',
        '(min-width:1180px)and(min-height:850px)': '★大きい PC で ふきだしを 17px に する だけ。★1024×768・1280×800（下）と 1512×982・1920×1080（上）の 両側で 測り、★NG は どれも 0【T220-2 実測】',
        /* ★★ T220-2 で 直した 2本（★★1文字でも 書きかえたら 鍵が 変わり、また 鳴ります）*/
        '(max-height:420px),(max-height:479px)and(min-width:568px)':
          '★★T220-2（🎨アト）―― ★`.pass-guide` を よこ並びに する 線。★★33画面で 前後を 測り、★悪く なった 0・良く なった 3（926×428・932×430・883×430 とも ㉔ 3件→0件）。★★420 の 下がわ（375・390・414）は もとから よこ並び・★上がわ（428〜479 かつ はば568以上）が 今回 入った 側。★★はば 568 未満の たて置き（320×454）は わざと 外して います（★入れると 17→15px に 落ちて ㉔ が 3件 鳴る【実測】）',
        '(max-height:479px)':
          '★★T220（🎨アト）―― ★`.rank-list` を 4列に する 線。★479 は 320×480（★決まった6画面）の 1px 下 ＝ ★実在の 画面の 上に 立って います。★1400通りで 前後を 測り、悪く なった 0【T220 実測】'
      };

      r35.yurushi = 0; for (var y35 in YURUSHI35) if (Object.prototype.hasOwnProperty.call(YURUSHI35, y35)) r35.yurushi++;

      var Ws = [], Hs = [], i35, j35;
      for (i35 = 0; i35 < GAMEN35.length; i35++) {
        if (Ws.indexOf(GAMEN35[i35][0]) < 0) Ws.push(GAMEN35[i35][0]);
        if (Hs.indexOf(GAMEN35[i35][1]) < 0) Hs.push(GAMEN35[i35][1]);
      }
      Ws.sort(function (a, b) { return a - b; }); Hs.sort(function (a, b) { return a - b; });

      /* ★★ ③引かれて いる 線を あつめる ★★
         ⚠️★★★ 数えるのは「★数字1つ」では なく「★★**条件まるごと**」です ★★★
            ★ ★★私の しくじり①（T220-2 §5-1）：★はじめ **数字だけ**を 見て いました。
              ★ ★すると ―― ★★直した あとの `(max-height:420px), (max-height:479px) and (min-width:568px)` も
                ★ ★★「420 が すきまに ある」で **鳴りっぱなし**に なりました（★★直したのに）。
            ★ ★→ ★★条件の 文まるごとを 鍵に します。★★これには もう 1つ よい ことが あります：
              ★ ★★★**ゆるした 条件を 1文字でも 書きかえると 鍵が 変わり、また 鳴ります**
                ―― ★★＝ ★直したら 必ず 測り直す ことに なります。 */
      function nums(txt) {
        var out = [], re = /(max|min)-(width|height)\s*:\s*(\d+(?:\.\d+)?)px/g, m;
        while ((m = re.exec(String(txt)))) out.push({ kind: m[1], axis: m[2], v: parseFloat(m[3]) });
        return out;
      }
      function norm(txt) { return String(txt).replace(/\s+/g, '').toLowerCase(); }
      function add(txt, moto) {
        var n = nums(txt); if (!n.length) return;
        r35.lines.push({ cond: norm(txt), raw: String(txt), moto: moto, nums: n });
      }
      function walk(rules, moto) {
        for (var k = 0; k < rules.length; k++) {
          var r = rules[k];
          if (r.media && r.media.mediaText) add(r.media.mediaText, moto);
          if (r.cssRules) { try { walk(r.cssRules, moto); } catch (e2) {} }
        }
      }
      try {
        for (i35 = 0; i35 < document.styleSheets.length; i35++) {
          var ss = document.styleSheets[i35], nm = (ss.href || 'ページの 中').replace(/^.*\//, '');
          try { walk(ss.cssRules, '★CSS ' + nm); } catch (e3) { r35.why.push('★★CSS が 読めません（' + nm + '）―― ★線を 数えられません'); }
        }
      } catch (e4) { r35.why.push('★★styleSheets が 読めません ―― ★線を 数えられません'); }
      r35.css = r35.lines.length;

      /* ★ JS の 線（★verify の あいだに 呼ばれた matchMedia）*/
      if (MM35.orig) {
        /* ★ ここまでに 1本も 拾えて いなければ、★自分で layout() を 1回 通す（★434行 を 鳴らす）*/
        if (!MM35.seen.length) { try { layout(); } catch (e5) {} }
        for (i35 = 0; i35 < MM35.seen.length; i35++) add(MM35.seen[i35], '★JS matchMedia');
        window.matchMedia = MM35.orig;                     /* ★ かならず もどす */
      } else {
        r35.why.push('★★matchMedia を 覚える 仕かけが 入って いません（★【1】が 貼られて いません）');
      }
      r35.js = r35.lines.length - r35.css;

      /* ★★ ④またいで いるか（★条件 1本ずつ）★★ */
      function shiraberu(extra) {
        var mata = [], all = r35.lines.concat(extra || []), done = {}, k35;
        for (k35 = 0; k35 < all.length; k35++) {
          var L = all[k35], key = L.cond + '｜' + L.moto;
          if (done[key]) continue; done[key] = 1;
          if (YURUSHI35[L.cond]) continue;                 /* ★ 両側を 測った と 書いて ある 条件 */
          var bad = [];
          for (var p35 = 0; p35 < L.nums.length; p35++) {
            var N = L.nums[p35], vals = (N.axis === 'width') ? Ws : Hs, v = N.v;
            if (vals.indexOf(v) >= 0 || vals.indexOf(v + 1) >= 0 || vals.indexOf(v - 1) >= 0) continue;  /* ★ 実在の 画面の 上に 立って いる */
            var shita = null, ue = null;
            for (var t35 = 0; t35 < vals.length; t35++) { if (vals[t35] <= v) shita = vals[t35]; else if (ue === null) ue = vals[t35]; }
            if (shita === null || ue === null) continue;   /* ★ 端の 外 ＝ どの 画面も またいで いない */
            bad.push(N.kind + '-' + N.axis + ':' + v + 'px（★下に ' + shita + 'px・★上に ' + ue + 'px の 画面）');
          }
          if (bad.length) mata.push({ raw: L.raw, moto: L.moto, bad: bad });
        }
        return mata;
      }
      r35.mata = shiraberu(null);

      /* ★★ ⑤見本の線 ―― ★毎回 わざと 2本 足して 測り直す ★★
         ★ イ）437px … ★430 と 454 の すきま（★実在の 画面が 1つも 無い 値）→ ★鳴る はず
         ★ ロ）427px … ★★428 の 1px 下（★＝ 実在の 画面の 上に 立って いる）→ ★鳴らない はず
         ★ ★どちらも **決め打ち**です。★画面の 値から 作って いません。 */
      var mIn  = [{ cond: '(max-height:437px)', raw: '(max-height:437px)', moto: '★見本イ', nums: nums('(max-height:437px)') }];
      var mOut = [{ cond: '(max-height:427px)', raw: '(max-height:427px)', moto: '★見本ロ', nums: nums('(max-height:427px)') }];
      var sawIn = shiraberu(mIn), sawOut = shiraberu(mOut);
      r35.mihon = {
        naru: sawIn.length === r35.mata.length + 1,
        naranai: sawOut.length === r35.mata.length,
        kazu: GAMEN35.length === GAMEN_N
      };
    })();

    /* ============================================================
       ★★★ ㉟-2 ―― ★★JS の はさみ（Math.max / Math.min）も 数えます（★T223・💻コーダ）★★★
       ------------------------------------------------------------
       ★★ なぜ 足したか ―― ★🧪トライ T222 §5-2 の 名ざし ★★
         ★ ★トライ：「★★㉟ は『★決め打ちの 線』と 名のって いるのに、★★★JS の はさみを
           ★ ★★1つも 数えて いません ―― ★★`hearts-game.js` **373行**の
             ★ ★★`Math.max(90, Math.min(260, …))`、★★★つまり 私が T219 🟡-1 で 名ざした 線 そのものが、
             ★ ★★★その 事故の ために 生まれた ㉟ から 見えて いません」
         ★ ★★＝ ★★★事故を 捕まえる ために 作った 見張りが、★その 事故の 当の 線を 見て いない。

       ⚠️★★★ 上の 「またぎ」の 目では 判じられません ―― ★★正直に 書きます ★★★
          ★ ★またぎ は「★この 数は、★実在する 2つの 画面の **すきま** に 落ちて いないか」を 見ます。
            ★ ★★だから 数の 単位が **画面の たけ・はば** で ないと 意味を なしません。
          ★ ★はさみの 6つの 数（★90／260・11／17・9／13）は ★★**画面の 大きさでは ありません**：
            ★ ★90・260 … ★**結果の 箱の たけ**（px）／★11〜17・9〜13 … ★**字の 大きさ**（px）。
          ★ ★★もし 260 を またぎに かけると ―― ★★★「★下に 230px・上に 272px の 画面」と
            ★ ★★**元気な ときも 毎回 鳴ります**。★★たまに では なく、いつも。
            ★ ★★★＝ ★それは 見張りでは なく ただの さわぎ です。★だから **かけません**。

       ★★ そのかわり、★★はさみには はさみの 見方が あります ―― ★★★「★★はさみの 数が 変わって いないか」★★
         ★ ★はさみは **数が 決めごと** です。★★260 を 300 に すれば、★★★320×568 で 291px が
           ★ ★通って しまい、★手札に かぶる かも しれません（★★それを 測るのは ㉛㉝㉞ の 仕事）。
         ★ ★→ ★★下の 表（HASAMI35）に **6つの 数を 書き写して** おき、
           ★ ★★★出来上がった CSS の 変数が その 中に 収まって いるかを 見ます。
           ★ ★★はさみの 数を 1つでも 書きかえたら **鳴ります** ―― ★★★＝ ★直したら 必ず 測り直す。
           ★ ★（★ゆるし表 YURUSHI35 と まったく 同じ 考え方 です）

       ★★ あわせて「★★いま はさみに 当たって いるか」を note に 出します（★鳴らしません）★★
         ★ ★★当たって いる ＝ ★★★画面の たけでは なく **決め打ちの 数**が 形を 決めて いる、という 合図。
         ★ ★T223 の 実測（★9画面・わたす 場面）：
           ★ ★★天井260 … ★**1/9**（320×568 が 291 → 260。★★31px 詰めて います ＝ T219 の 現場）
           ★ ★★数11   … ★4/9 ／ ★★名前9 … ★**7/9**
         ★ ★→ ★★**9画面の うち 8画面で、★どれかの はさみが 当たって います。**★これは 事故では
           ★ ★ありません（★はさみは 仕事を して います）が、★★次に 直す 人が 知って いるべき 数 です。
       ============================================================ */
    var HASAMI35 = [
      { 名: '結果の 箱の 天井', 変: '--result-max', 行: 373, 下: 90, 上: 260,
        もと: 'Math.max(90, Math.min(260, geo.midH + geo.pad*2 + geo.scoreH))',
        なぜ: '★★T219 🟡-1 を 起こした 線 そのもの（★🧪トライ T222 §5-2 の 名ざし）' },
      { 名: '点の 帯の 数の 字', 変: '--sb-num', 行: 386, 下: 11, 上: 17,
        もと: 'Math.max(11, Math.min(17, Math.round((geo.scoreH - 20) / 2.45)))',
        なぜ: '★「ロボット1」が 切れない ための 上下（★㉑ が 切れを 数えます）' },
      { 名: '点の 帯の 名前の 字', 変: '--sb-name', 行: 387, 下: 9, 上: 13,
        もと: 'Math.max(9, Math.min(13, Math.round(numF * 0.76)))', なぜ: '★同上' }
    ];
    /* ★ 判じる ところ（★ここ 1つ）―― ★見本も 本番も 同じ 道を 通ります */
    function hantei35(v, shita, ue) {
      if (v === null || isNaN(v)) return 'まだ';
      if (v < shita - 0.5 || v > ue + 0.5) return '★★★はさみの 外';
      if (v >= ue - 0.5) return '★上に 当たり';
      if (v <= shita + 0.5) return '★下に 当たり';
      return '素どおり';
    }
    r35.hasami = [];
    (function () {
      var cs35 = getComputedStyle(document.documentElement);
      for (var h35 = 0; h35 < HASAMI35.length; h35++) {
        var H35 = HASAMI35[h35];
        var raw35 = String(cs35.getPropertyValue(H35.変) || '').trim();
        var v35 = raw35 ? parseFloat(raw35) : null;
        var st35 = hantei35(v35, H35.下, H35.上);
        r35.hasami.push({ 名: H35.名, 変: H35.変, 行: H35.行, 下: H35.下, 上: H35.上, 値: v35, 状態: st35 });
        if (st35 === '★★★はさみの 外') {
          r35.why.push('★★JS の はさみの 数が 変わって います ―― ★' + H35.名 + '（' + H35.変 +
                       '・hearts-game.js ' + H35.行 + '行）が ★★いま ' + v35 + 'px。' +
                       '★★書いて ある はさみは ' + H35.下 + '〜' + H35.上 + '（' + H35.もと + '）。' +
                       '★★★両側の 画面で 測って から、★HASAMI35 の 数を 直して ください');
        }
      }
      /* ★ 見本の線 ―― ★決め打ちの 3通りを 同じ hantei35 に 通す（★画面に 触りません）*/
      r35.mihonH = {
        外: hantei35(999, 90, 260) === '★★★はさみの 外',
        素: hantei35(200, 90, 260) === '素どおり',
        当: hantei35(260, 90, 260) === '★上に 当たり'
      };
    })();

    /* ★ 上の線 */
    for (var i35b = 0; i35b < r35.mata.length; i35b++) {
      var M = r35.mata[i35b];
      ng.push('★★㉟ 決め打ちの 線が 実在の 画面を またいで います：' + M.raw + '（' + M.moto + '）―― ' + M.bad.join('・') +
              '。★★どちらの 側も 測りましたか。★測ったなら YURUSHI35 に「' + (r35.lines.filter(function(x){return x.raw===M.raw;})[0]||{}).cond + '」を 理由と 一緒に 足して ください');
    }
    /* ★ 下の線 ―― ★線を 1本も 拾えて いない／画面の 一覧が 空 */
    for (var i35c = 0; i35c < r35.why.length; i35c++) ng.push('★★★㉟ ' + r35.why[i35c]);
    if (!r35.css) ng.push('★★★㉟ CSS の 線を 1本も 拾えて いません ―― ★★数えて いない のと 同じです');
    if (!r35.js)  ng.push('★★★㉟ JS の 線を 1本も 拾えて いません（★matchMedia が 1回も 呼ばれて いません）');
    /* ★ 見本の線 */
    if (!r35.mihon || !r35.mihon.naru) ng.push('★★★㉟ わざと またぐ 線（437px）を 足しても 鳴りません ―― ★★画面では なく **見張りの ほうが 壊れて います**');
    if (!r35.mihon || !r35.mihon.naranai) ng.push('★★★㉟ 実在の 画面の 上に 立つ 線（427px）で 鳴って しまいます ―― ★★見張りが うるさすぎます');
    if (!r35.mihon || !r35.mihon.kazu) ng.push('★★★㉟ 画面の 一覧の 数が 変わりました ―― ★★ゆるし表（YURUSHI35）を **測り直して** ください');
    /* ★ ㉟-2 の 見本の線 */
    if (!r35.mihonH || !r35.mihonH.外) ng.push('★★★㉟ はさみの 外の 値（999px）を 入れても「外」と 出ません ―― ★★**見張りの ほうが 壊れて います**');
    if (!r35.mihonH || !r35.mihonH.素) ng.push('★★★㉟ はさみの 中の 値（200px）で「外」と 出て しまいます ―― ★★見張りが うるさすぎます');
    if (!r35.mihonH || !r35.mihonH.当) ng.push('★★★㉟ はさみの 縁の 値（260px）を「上に 当たり」と 読めて いません');

    var uniq35 = {}, un35 = 0;
    for (var i35d = 0; i35d < r35.lines.length; i35d++) {
      var k35d = r35.lines[i35d].cond + "｜" + r35.lines[i35d].moto;
      if (!uniq35[k35d]) { uniq35[k35d] = 1; un35++; }
    }
    /* ⚠️★★★ 見出しを 変えました（★🧪トライ T222 §5-3 の 名ざし）★★★
       ★ ★トライ：「★★見出しが『決め打ちの 線』なので、★★★次の 人は
         ★ ★『決め打ちは ぜんぶ ここで 数えて いる』と 読みます」
       ★ ★→ ★★何を 数えて いて、★★★**何を 数えて いないか**を、★logs では なく
         ★ ★★**この 出力の 中**に 書きます（★半年後に 見張りを 足す 人は logs を 読みません）。 */
    note['㉟ ★★決め打ちの 線（★CSS と matchMedia の px ＋ ★JS の はさみ）'] =
      '★引かれて いる 線 ' + un35 + '本（★のべ ' + r35.lines.length + '回・CSS ' + r35.css + '・JS ' + r35.js + '）' +
      '／★またぎ ' + r35.mata.length + '件' + (r35.mata.length ? '（' + r35.mata.map(function (x) { return x.raw + '＠' + x.moto; }).join('／') + '）' : '') +
      '／★ゆるし表 ' + r35.yurushi + '本（★両側を 測って あります）' +
      '／★見本 ' + (r35.mihon && r35.mihon.naru && r35.mihon.naranai ? '鳴る／鳴らない とも ○（★見張りは 生きて います）' : '★★おかしい') +
      '／★★はさみ ' + r35.hasami.length + '組6つ：' +
        r35.hasami.map(function (x) { return x.名 + ' ' + (x.値 === null ? '―' : x.値) + '（' + x.下 + '〜' + x.上 + '・' + x.状態 + '・' + x.行 + '行）'; }).join('・') +
      '／★はさみの 見本 ' + (r35.mihonH && r35.mihonH.外 && r35.mihonH.素 && r35.mihonH.当 ? '3つとも ○' : '★★おかしい') +
      /* ⚠️★★★ はさみの 見張りの 限界 ―― ★★これも 書いて おきます（★logs では なく ここに）★★★
         ★ ★はさみの 数を 書きかえても、★★**その 数に 届く 画面が 1つも 無ければ 気づけません**。
         ★ ★★T223 の 実測（★9画面・4通り わざと 書きかえ）：★①天井 260→300 は 320×568 で **鳴った**／
           ★ ★④名前 9→6 は 7画面で **鳴った**／★②天井 260→200 は ★★㉛㉝㉞ が 11件 鳴った（★別の 見張りが 拾った）／
           ★ ★★③数の 字 17→24 は ★★★**9画面 とも 鳴りません**（★どの 画面でも 17 に 届かない ため）。
         ★ ★→ ★★6つの うち **届く のは 3つ**（★天井260・数11・名前9）。★★残り 3つ（★天井90・数17・名前13）は
           ★ ★★いまの 9画面では **見張れて いません**。★★★正直に 書いて おきます。 */
      '（⚠️★★6つの うち いまの 9画面で 見張れる のは 3つ：★天井260・数11・名前9。' +
        '★★天井90・数17・名前13 は **届く 画面が 無いので 気づけません**【★T223 実測】）' +
      '／⚠️★★★ここが **数えて いない** もの（★名ざしで）：★em・rem の 線／' +
        '★新しい 書き方（`(400px >= height)`）／★aspect-ratio・orientation だけの 線／' +
        '★★JS の 生の 数くらべ（`innerHeight < 470` など）／★@container の 線。' +
        '★★→ ★これらは **1つも 捕まりません**【★🧪トライ T222 §5-1 実測・8通り 中 5通り すり抜け】' +
      '／⚠️★またぎの ぶんは **どの 画面で 走らせても 同じ 答え**／★★はさみの ぶんは **画面ごとに ちがいます**';


    /* ============================================================
       ㊱ ★★★ハッピーが 画面に 居るか（★設計図 §9.5）★★★
       ------------------------------------------------------------
       ★★ なぜ 足したか ―― ★🧪トライ T222 §4-3 の 名ざし ★★
         ★ ★トライ：「★ハッピーが 画面から まるごと 消えても、★★37本の 見張りは 誰も 鳴りません」
           ★ ★★実際に 3画面で `.talk .cat-wrap{display:none}` を かぶせて 確かめた ――
             ★ ★★★**効いた 3/3・鳴った 0/9**（★48×51px → 0×0px に なった のに NG は 0 → 0）。
         ★ ★★＝ ★設計図 §9.5「★全ゲーム・全ページに 必ず 登場させる」は、
           ★ ★★★この 1本で **見張られて いない 唯一の 決まり** でした。
         ★ ★★★T221 で「たけ 421〜479・はば568以上 では かおと 名前を 出さない」と 決めた ばかりの
           ★ ★所です ―― ★★ふきだしまで 消えても、★★★誰も 気づきません でした。

       ⚠️★★★ トライの 案（「★①〜④の うち 1つでも 見えれば ○・0個なら 鳴る」）は **そのまま 使いません** ★★★
          ★ ★★理由は 2つ。★どちらも 数えて から 決めました【★T223 実測・9画面 × 3場面 ＝ 27通り】。
          ★ ★**①うその NG が 3件 出ます。**★トライの 4つ（`.talk .cat-wrap`／`.brand-cat`／
            ★ `#say`／`#resultSay`）には ★★**はじめの 画面の かお**（`.title-screen .mascot .happy-cat`）が
            ★ 入って いません。★→ ★★320×568・320×480・320×454 の **はじめの 画面**は
            ★ ★★★4つ とも ✕（★`.brand-cat` は はば360以下で 消える・★ほかは 遊ぶ 画面の 部品）。
            ★ ★★＝ ★**元気な 画面で 鳴る 見張り**に なります。
          ★ ★**②「いつ 呼んだか」で 答えが 変わります。**★`#say` は 時間で 出たり 消えたり します ――
            ★ ★★同じ わたす 場面で、★320×568 は 41回 中 **41回 見えて いる**のに、
            ★ ★★★926×428 と 568×320 は 41回 中 **0回**【★100ms きざみ・4秒】。
            ★ ★★これを OR に 入れると、★★★「★たまに 鳴る 見張り」に なります
              ★ ―― ★★この 1本が ㉜ の 書き置きで **2度** 戒めて いる わなです。
          ★ ★★★そして いちばん 大事な こと：★**OR は ゆるく 見えて、じつは 1本足です。**
            ★ ★★★**かおの 絵（A/B/C）は、★27通り とも「ちょうど 1つ」**でした【★実測】
              ★ ―― ★2つ 立って いる 場面が **1つも ありません**。
            ★ ★（★トライの 4つ で 数えると：★0個 3通り・1個 12通り・2個 9通り・3個 3通り。
              ★ ★★2個・3個の ぶんは ★ふきだしと 結果の 文 ―― ★★かおでは ありません）
            ★ ★★とくに ―― ★★★**よこ 6画面の 遊ぶ 画面は `.brand-cat`（30×23px）1つだけ**。
            ★ ★★OR の 数を 増やしても、★その 1本が 折れたら 同じ です。

       ★★ だから ―― ★★★「1つでも 見えれば ○」では なく「★★場面ごとに、そこに 出て いる はずの ものを 見る」★★
         ★ ★①はじめの 画面 … ★かおの 絵が **1つ以上** 画面の 中に 見える
         ★ ★②遊ぶ 画面     … ★かおの 絵が **1つ以上** 画面の 中に 見える
           ★ ★★＋ ㋐ **たて置き**なのに 帯の かおが 出て いない → 鳴る
           ★ ★★＋ ㋑ **よこ置き**なのに 帯の かおが 出て いる  → 鳴る（★社長の お決め 2026-09-04）
         ★ ★③結果の 画面   … ★ハッピーの ひとこと 4つ とも 頭が 🐱（★★場面は 作りません ―― 下）

       ★★ かおの 絵 ＝ この 3つ だけ（★`#happy-head` を 使う SVG）★★
         ★ ★A `.topbar .brand-cat`（30×23px・★はば361px以上）
         ★ ★B `.title-screen .mascot .happy-cat`（64〜76×49〜58px）
         ★ ★C `.talk .cat-wrap`（48×51px・★たて置きだけ）
         ⚠️★ **「見える」は 画面の 中に あることまで 見ます**（★まん中の 点が viewport の 中）。
            ★ ★★よこ置きの はじめの 画面では B が **下に はみ出して います**（76×58px・画面の外）――
              ★ ★rect だけ 見て いると「見えて いる」と 数えて しまいます【★T223 実測】。

       ⚠️★★ ③だけ 場面を 作らない わけ（★正直に）★★
          ★ ★結果の 画面を 作るには `showResult` を 通す ことに なります。★★この 1本は
            ★ ★★「見張りが 場面を 作り、戻し忘れて 遊びを 止める」事故を **5度** 起こして います
              ★ （★㉓㉔／㉕／⑪ ×2／㉞）。★★6度目を 私が 作る 気は ありません。
          ★ ★→ ★★★見るのは **文 そのもの**（`SAY_WIN`／`SAY_LOSE`／`SAY_DEAL_ME`／`SAY_DEAL_OT`）。
            ★ ★4つ とも 頭が 🐱 です。★★1つでも 抜けたら 鳴ります。
            ★ ★★いま 結果が 出て いる ときは、★生の `resultSay` も ついでに 見ます（★ただ 乗り）。
          ★ ★★これで 捕まえられない もの（★正直に）：★★結果の 箱の **中で** 🐱 が
            ★ ★CSS で 見えなく された 場合。★★→ ★そこは ㉛㉝㉞ が 箱の 形を 見て います。

       ★★ 見張りを ゆるめた ので、★下の線を 引き直しました（★⑮ ㋐㋑ と 同じ 作り）★★
          ★ ★判じる ところは **`judge36` 1つだけ**。★★見本も 本番も 同じ 道を 通ります
            ★ ―― ★★見本が 別の 道を 通ったら、★★★見本は 何も 保証しません。
       ============================================================ */
    var r36 = { win: window.innerWidth + '×' + window.innerHeight, flat: false, rows: [], why: [], mihon: null, cases: 0, koe: null };

    /* ★★ 判じる ところ（★ここ 1つ）―― ★s は 測った 形 か、★見本の 決め打ちの 形 */
    function judge36(s) {
      var w = [];
      if (!s.測れた) { w.push(s.場面 + '：★★測れて いません'); return w; }
      /* ⚠️★★★ 鳴らすのは「★★どこにも 居ない」ときだけ です（★㉙ と 同じ 線）★★★
         ★ ★「★画面の 中には 居ないが、★★指で 動かせば 届く」は **鳴らしません**（★note に 書きます）。
           ★ ★★T160 の 決まりで、★はじめの 画面は はみ出しても スクロールで 届く ―― ★設計どおり です。
           ★ ★★★ここを 鳴らすと、★1回 遊び終わった あとの 320×480・320×454 で 鳴りました
             ★ ★（★「つづきから ▶」が 出て 囲いが 高く なる ため。★★★元気な 画面 です）。
         ★ ★★遊ぶ 画面は どこも スクロールしません ―― ★★だから 盤から 追い出されたら「届かない」＝ 鳴ります。 */
      if (!s.届く) {
        w.push(s.場面 + '：★★★ハッピーが 画面に 1人も 居ません' +
               '（★設計図 §9.5「★全ゲーム・全ページに 必ず 登場させる」）');
      }
      if (s.遊ぶ && s.線を見る !== false) {
        if (!s.flat && !s.帯のかお) w.push('②遊ぶ 画面：★★たて置きなのに ハッピーの かおと 名前が 出て いません');
        if (s.flat && s.帯のかお)   w.push('②遊ぶ 画面：★★よこ置きなのに ハッピーの かおと 名前が 出て います' +
                                          '（★社長の お決め 2026-09-04 ―― ★盤の たけを 1pxも 減らさない ため）');
      }
      return w;
    }

    (function () {
      if (document.visibilityState !== 'visible') {
        r36.why.push('★★ページが 前に 出て いません（' + document.visibilityState + '）―― ★見え方は 測れません');
        return;
      }
      var A36 = '.topbar .brand-cat', B36 = '.title-screen .mascot .happy-cat', C36 = '.talk .cat-wrap';
      if (!document.querySelector(A36) || !document.querySelector(B36) || !document.querySelector(C36)) {
        r36.why.push('★★ハッピーの 置き場が ありません（★題のとなり ' + (document.querySelector(A36) ? '○' : '✕') +
                     '・はじめの画面 ' + (document.querySelector(B36) ? '○' : '✕') +
                     '・遊ぶ画面の帯 ' + (document.querySelector(C36) ? '○' : '✕') + '）');
        return;
      }
      /* ⚠️★★★ ここに 4か所目を 作りません（★私が 一度 作って、★★道具に 止められました）★★★
         ★ ★はじめ、ここに `matchMedia(…)` を もう 1回 書いて、★★3か所と 同じ 文を **写して** いました。
           ★ ★→ ★★T221 の 道具（`t221_narasu.cjs` の `need(JS_NOW, Q_NEW, 2)`）が
             ★ ★★**「この 文は 2件の はず なのに 3件 あります」**と 言って 止まりました。
           ★ ★★★道具に 止められました ―― ★私が 気づいたのでは ありません。
         ★ ★★T221 で「★3か所が 1組」と 決めた ばかり です（★css 1・js 2）。
           ★ ★★★4か所目を 増やしたら、★次に 直す 人は 4つ そろえる ことに なります。
         ★ ★→ ★★**㉕ が すでに 判じた 答え（`r25.flat`）を 借ります。**★★写しを 作りません。
         ★ ★★（★㉕ は ㊱ より 先に 走ります。★測れて いない ときは 下の線が 鳴ります）*/
      if (!r25.cases) {
        r36.why.push('★★たて／よこ の 判じを 借りられません（★㉕ が 1場面も 測れて いません）―― ★★㋐㋑ の 2本は 見て いません');
        r36.karizu = true;
      }
      r36.flat = !!r25.flat;

      /* ============================================================
         ⚠️★★★ 「届く」の 見かたを 直しました（★正直に・★作業メモ T223 §6-5）★★★
         ★ ★はじめ「描かれて いれば 届く」と して いました。★→ ★★**元気な 画面で 鳴りました**：
           ★ ★★320×480 と 320×454 で、★★★**1回 遊び終わった あと**の はじめの 画面。
             ★ ★1回 おわると「つづきから ▶」が 出て 囲いが 高く なり、
               ★ ★★ハッピーが 下へ 押し出されます（★まん中 437px → 画面の たけ 454px を 越える）。
             ★ ★★★でも `.title-screen` は `overflow:auto` ―― ★**指で 動かせば 届きます**
               ★ ★（★T160 の 決まり そのもの。★★㉙ も 同じ 形を **わざと 通して います**）。
           ★ ★★★＝ ★★**設計どおりの 画面で 鳴る 見張り**でした。★これは 直さないと いけません。
         ★ ★→ ★★「届く」＝ ★描かれて いる ＋ ★★**スクロールできる 親が いる**（★または ページ自体が 動く）。
           ★ ★★`position:fixed` は 動かないので、そこで 打ち切ります。
           ★ ★★★遊ぶ 画面は どこも スクロールしません ―― ★だから 盤から 追い出されたら「届かない」。
         ★ ★★そして ―― ★★★**「届く」は 鳴らしません。★note に 書くだけ**に しました（★㉙ と 同じ 扱い）。
       ============================================================ */
      function ugoku36(e) {
        for (var q = e; q && q !== document.body && q !== document.documentElement; q = q.parentElement) {
          var cq = getComputedStyle(q);
          if (cq.position === 'fixed') return false;          /* ★ 動かない ＝ 届かない */
          if ((cq.overflowY === 'auto' || cq.overflowY === 'scroll') &&
              q.scrollHeight > q.clientHeight + 1) return true;
        }
        var de = document.documentElement;
        return de.scrollHeight > de.clientHeight + 1;
      }
      function mieru36(sel) {
        var e = document.querySelector(sel);
        if (!e) return { 見える: false, 届く: false, w: 0, h: 0 };
        var b = e.getBoundingClientRect(), c = getComputedStyle(e);
        var cx = b.left + b.width / 2, cy = b.top + b.height / 2;
        var naka = cx >= 0 && cx <= window.innerWidth && cy >= 0 && cy <= window.innerHeight;
        var ikite = b.width > 0 && b.height > 0 &&
                    c.display !== 'none' && c.visibility !== 'hidden' && +c.opacity > 0.05;
        return {
          見える: ikite && naka,
          届く: ikite && (naka || ugoku36(e)),           /* ★ 画面の 中／★指で 動かせば 届く */
          w: Math.round(b.width), h: Math.round(b.height)
        };
      }

      /* ★ 場面は **class の 出し入れ だけ**で 作ります（★newDeal も showResult も 通しません）*/
      var kTitle36 = titleScreen.classList.contains('hidden');
      var kPlay36 = playScreen.classList.contains('hidden');

      function hakaru36(name, asobu) {
        if (asobu) { titleScreen.classList.add('hidden'); playScreen.classList.remove('hidden'); }
        else { titleScreen.classList.remove('hidden'); playScreen.classList.add('hidden'); }
        void document.body.offsetWidth;
        var a = mieru36(A36), b = mieru36(B36), c = mieru36(C36);
        return {
          場面: name, 遊ぶ: !!asobu, flat: r36.flat, 測れた: true, 線を見る: !r36.karizu,
          題のとなり: a.見える, はじめの画面: b.見える, 帯のかお: c.見える,
          かお: (a.見える ? 1 : 0) + (b.見える ? 1 : 0) + (c.見える ? 1 : 0),
          届く: (a.届く ? 1 : 0) + (b.届く ? 1 : 0) + (c.届く ? 1 : 0),
          大きさ: ([a.見える ? '題' + a.w + '×' + a.h : '', b.見える ? '初' + b.w + '×' + b.h : '',
                    c.見える ? '帯' + c.w + '×' + c.h : ''].filter(Boolean).join('・') || '★★画面の 中に 0個') +
                  /* ★ 画面の 中には 無いが 指で 動かせば 届く ぶん（★鳴らしません・★㉙ と 同じ 扱い）*/
                  (((a.届く ? 1 : 0) + (b.届く ? 1 : 0) + (c.届く ? 1 : 0)) >
                   ((a.見える ? 1 : 0) + (b.見える ? 1 : 0) + (c.見える ? 1 : 0))
                   ? '＋★指で 動かせば 届く ' +
                     (((a.届く ? 1 : 0) + (b.届く ? 1 : 0) + (c.届く ? 1 : 0)) -
                      ((a.見える ? 1 : 0) + (b.見える ? 1 : 0) + (c.見える ? 1 : 0))) + '個' : '')
        };
      }

      still(function () {
        var s1 = hakaru36('①はじめの 画面', false);
        var s2 = hakaru36('②遊ぶ 画面', true);
        r36.rows.push(s1, s2); r36.cases = 2;
        r36.why = r36.why.concat(judge36(s1), judge36(s2));

        /* ============================================================
           ★★ 見本の 線 ―― ★毎回 わざと 壊して、鳴る ことを 確かめる ★★
             ★ ★見本ア … ★かおの 絵を **3つ とも** 消す → ★どの 画面でも「1人も 居ません」が 2場面 とも 出る はず
               ★ ★（★★トライが 3画面で やった 手 そのもの。★★★これを 毎回 自分で やります）
             ★ ★見本イ … ★結果の ひとことから 🐱 を 抜く → ★「🐱 が ありません」が 出る はず
             ★ ★見本ウ … ★たて置きなのに 帯の かおが 無い 形を judge36 に 食わせる → ★㋐ が 鳴る はず
             ★ ★見本エ … ★よこ置きなのに 帯の かおが ある 形を 食わせる      → ★㋑ が 鳴る はず
             ★ ★見本オ … ★正しい 形（たて・かお 1つ・帯 出て いる）        → ★★鳴らない はず
               ★ ★★（★ウエだけだと「いつも 鳴る 見張り」でも 通って しまいます）
             ★ ★★ウエオは **画面を 変えずに** 両側 とも 試せます ―― ★judge36 に 決め打ちの 形を
               ★ ★渡す だけ。★★本番と 同じ 関数を 通るので、★見本が 保証に なります。 */
        var st36 = document.createElement('style');
        st36.textContent = '.topbar .brand-cat,.title-screen .mascot .happy-cat,.talk .cat-wrap{display:none!important}';
        document.head.appendChild(st36);
        var a1 = hakaru36('見本ア・はじめの 画面', false), a2 = hakaru36('見本ア・遊ぶ 画面', true);
        document.head.removeChild(st36);

        /* ★ もどった か（★見本を 外した あと、★2場面 とも 元の 数に 戻るか）*/
        var b1 = hakaru36('①はじめの 画面（見本の あと）', false);
        var b2 = hakaru36('②遊ぶ 画面（見本の あと）', true);

        /* ⚠️★★★ 見本の 判じかたを **3度** 書き直しました（★正直に・★作業メモ T223 §4）★★★
           ★ ★①はじめ `消す: judge36(a1).length > 0`。★→ ★★画面が すでに 壊れて いる ときも 素通し。
           ★ ★②つぎに「★**増えたか**」（★社長の お言葉）。★→ ★★これも 外れました ――
             ★ ★★わざと「よこ置きで かおを 出す」汚しを 当てた ときに、
               ★ ★苦情が **1件 → 1件**（★中身は 別物）に なり、★★数だけ 見て いると 気づけません。
             ★ ★★数は 中身を 表しません。
           ★ ★★③いま：★★★**「かおを 3つ とも 消したら『1人も 居ません』が 2場面 とも 出るか」**。
             ★ ★かおを 3つ 消せば かおは 0個 ―― ★★これは **画面が どう 汚れて いても 同じ**です。
             ★ ★★＝ ★どんな ときも 同じ 答えを 出す 見本。★★★たまに 鳴る 見張りに なりません。
           ★ ★もどった も はじめ「苦情が 0に 戻ったか」で 見て いました。★→ ★★これだと
             ★ ★★外から わざと 汚した ときに「★見本を もどせて いません」と **うそを 言います**
               ★ （★実際に 出ました ―― ★もどして いない のは 私では なく 汚した 側）。
             ★ ★→ ★★★「★★測る 前の 数と 同じに 戻ったか」で 見ます。 */
        function nashi36(list) {
          for (var q36 = 0; q36 < list.length; q36++) if (list[q36].indexOf('1人も 居ません') >= 0) return true;
          return false;
        }
        r36.mihon = {
          消す: nashi36(judge36(a1)) && nashi36(judge36(a2)),
          もどった: b1.かお === s1.かお && b2.かお === s2.かお &&
                   b1.帯のかお === s1.帯のかお && b2.帯のかお === s2.帯のかお,
          たて: judge36({ 場面: '見本ウ', 遊ぶ: true, 測れた: true, flat: false, かお: 1, 届く: 1, 帯のかお: false }).length > 0,
          よこ: judge36({ 場面: '見本エ', 遊ぶ: true, 測れた: true, flat: true, かお: 1, 届く: 1, 帯のかお: true }).length > 0,
          しずか: judge36({ 場面: '見本オ', 遊ぶ: true, 測れた: true, flat: false, かお: 1, 届く: 1, 帯のかお: true }).length === 0,
          /* ★★ 見本カキ ―― ★★★「届く」の 線 そのものを 両側 とも 試します（★T223 §6-5 で 直した ところ）
             ★ ★カ：★画面の 中に 0個 でも **指で 動かせば 届く** → ★★鳴らない はず（★T160 の 決まり）
             ★ ★キ：★★どこにも 居ない（届かない）        → ★★★鳴る はず */
          届く: judge36({ 場面: '見本カ', 遊ぶ: false, 測れた: true, flat: false, かお: 0, 届く: 1 }).length === 0,
          届かない: judge36({ 場面: '見本キ', 遊ぶ: false, 測れた: true, flat: false, かお: 0, 届く: 0 }).length > 0
        };
      });

      /* ★ 場面を 元に もどす（★★ここを 忘れると ㉜ が 鳴ります ―― ★それで よい）*/
      if (kTitle36) titleScreen.classList.add('hidden'); else titleScreen.classList.remove('hidden');
      if (kPlay36) playScreen.classList.add('hidden'); else playScreen.classList.remove('hidden');

      /* ★★ ③結果の 画面 ―― ★★場面を 作らず、★文 そのものを 見ます（★上の 書き置き）*/
      var koe36 = [SAY_WIN, SAY_LOSE, SAY_DEAL_ME, SAY_DEAL_OT];
      /* ★ 数える ところ（★ここ 1つ）―― ★見本イ も この 関数を 通ります */
      function neko36(list) {
        var n = 0;
        for (var k36 = 0; k36 < list.length; k36++) if (String(list[k36]).indexOf('🐱') < 0) n++;
        return n;
      }
      var nasi36 = neko36(koe36);
      var nama36 = null;
      if (resultWrap && !resultWrap.classList.contains('hidden') && resultSay) {
        nama36 = String(resultSay.textContent).indexOf('🐱') >= 0;
      }
      r36.koe = { 文: koe36.length, ねこなし: nasi36, いま: nama36 };
      if (nasi36) r36.why.push('③結果の 画面：★★★4つの ひとことの うち ' + nasi36 + 'つに 🐱 が ありません' +
                               '（★ハッピーが しゃべって いません ―― 設計図 §9.5）');
      if (nama36 === false) r36.why.push('③結果の 画面：★★いま 出て いる ひとことに 🐱 が ありません');
      /* ★★ 見本イ ―― ★★1つの 文から わざと 🐱 を 抜いて、★★★同じ `neko36` が 気づくか
         ★ ★（★本物の 4つは そのまま。★写しの 配列を 1つ 作って 通すだけ です）*/
      r36.mihon = r36.mihon || {};
      r36.mihon.ねこ = (neko36([String(SAY_WIN).replace('🐱', ''), SAY_LOSE, SAY_DEAL_ME, SAY_DEAL_OT]) === 1);
    })();

    /* ★ 上の線 */
    for (var i36 = 0; i36 < r36.why.length; i36++) ng.push('★★㊱ ハッピーが 画面に 居るか：' + r36.why[i36]);
    /* ★ 下の線 ―― ★1場面も 測れて いないのに 通さない */
    if (!r36.cases && !r36.why.length) ng.push('★★★㊱ 1場面も 測れて いません（★試し方が おかしい）');
    if (r36.cases && r36.cases < 2) ng.push('★★㊱ 2場面の うち ' + r36.cases + '場面 しか 測れて いません');
    /* ★ 見本の線 ―― ★見張り 自身が 生きて いるか */
    if (r36.cases && r36.mihon) {
      if (!r36.mihon.消す) ng.push('★★★㊱ かおを 3つ とも わざと 消しても「1人も 居ません」と 出ません ―― ★★画面では なく **見張りの ほうが 壊れて います**');
      if (!r36.mihon.たて) ng.push('★★★㊱ たて置きで 帯の かおを わざと 消した 形にしても 鳴りません ―― ★★**見張りの ほうが 壊れて います**');
      if (!r36.mihon.よこ) ng.push('★★★㊱ よこ置きで 帯の かおを わざと 出した 形にしても 鳴りません ―― ★★**見張りの ほうが 壊れて います**');
      if (!r36.mihon.しずか) ng.push('★★★㊱ 正しい 形でも 鳴って しまいます ―― ★★見張りが うるさすぎます（★★いつも 鳴る 見張りは 何も 見張って いません）');
      if (!r36.mihon.届く) ng.push('★★★㊱ 「指で 動かせば 届く」形でも 鳴って しまいます ―― ★★★T160 の 決まり（★はみ出したら スクロールで 届く）で 鳴らしては いけません');
      if (!r36.mihon.届かない) ng.push('★★★㊱ 「どこにも 居ない」形で 鳴りません ―― ★★**見張りの ほうが 壊れて います**');
      if (!r36.mihon.ねこ) ng.push('★★★㊱ 🐱 の 数え方が 壊れて います（★🐱 の 無い 文を「ある」と 言って います）');
      if (!r36.mihon.もどった) ng.push('★★★㊱ 見本を 元に もどせて いません（★あとの 数字が 信じられません）');
    }
    note['㊱ ★★ハッピーが 画面に 居るか'] = r36.win + (r36.flat ? '（★よこ置き）' : '（★たて置き）') + ' … ' +
      r36.rows.filter(function (r) { return r.場面.indexOf('見本') < 0 && r.場面.indexOf('あと') < 0; })
        .map(function (r) { return r.場面 + ' かお ' + r.かお + '個（' + r.大きさ + '）'; }).join('／') +
      '／③結果の ひとこと ' + (r36.koe ? (r36.koe.文 - r36.koe.ねこなし) + '/' + r36.koe.文 + ' に 🐱' : '―') +
      (r36.koe && r36.koe.いま !== null ? '（★いま 出て いる 文 ' + (r36.koe.いま ? '○' : '★✕') + '）' : '') +
      '／★決まり：' + (r36.flat ? '★よこ置きは 帯の かおを 出さない（★題の となりの 30×23px が 受け持ちます）'
                                : '★たて置きは 帯に かおと 名前を 出す') +
      '／★見本 ' + (r36.mihon && r36.mihon.消す && r36.mihon.たて && r36.mihon.よこ && r36.mihon.しずか &&
                    r36.mihon.ねこ && r36.mihon.届く && r36.mihon.届かない && r36.mihon.もどった
                    ? '8つとも ○（★見張りは 生きて います）' : '★★おかしい') +
      '／⚠️★★9画面 ぜんぶで 走らせて ください（★設計図 追記⑥）';


    /* ============================================================
       ㉜ ★★お尻 ―― ★★頭で 写した 形と くらべる（★verify の 頭に ある 書き置きの 対）
       ★ ★見本の 線：★★わざと 1つ 汚して、★くらべる 目が 気づく ことを 見て から もどす。
       ★ ★★ここは ぜんぶの 見張りの **あと** に 置きます（★1つでも 後に 増やしたら、その 下へ）。
       ============================================================ */
    var SNAP1 = screenSnap();
    var d32 = snapDiff(SNAP0, SNAP1);
    for (var i32 = 0; i32 < d32.length; i32++) {
      ng.push('★★★㉜ 見張りが 画面を もどして いません：' + d32[i32]);
    }
    /* ============================================================
       ⚠️★★★ ㉜-2 ―― ★★★時間で 消える もの は「戻す」だけでは 戻りません（★T217-3・★私が 見つけました）★★★
       ------------------------------------------------------------
       ★ ★結果の 箱が 出た 直後の **550ms** だけ `is-locked` が 付きます（★出た しゅんかん 押さない ため）。
         ★ ★消すのは **時間**（`later(T.RESULT_LOCK, …)`）です。★★クラスでは ありません。
       ★ ★★そこへ その 550ms の あいだに verify を 呼ぶと ――
         ★ ★①見張りが 頭で「鍵 あり」と 覚える → ②verify の 数秒の あいだに 本物の 時間が 来て 鍵が 外れる
         ★ ★→ ★③見張りが お尻で 覚えた とおり **鍵を 掛け直す** → ★★★もう 外す 時間は 残って いない。
       ★ ★★＝ ★★結果の 箱が **ずっと 押せなく なります**【実測：★つぎへ・やめる とも
         ★ ★「resultBox が 返る」＝ ★`is-locked *{pointer-events:none}`】。
       ★ ★★これは 遊ぶ 人には 起きません（★verify を 呼ぶのは 私たち だけ）。★★でも
         ★ ★★見張りが 見張る 相手を 殺す 6度目 の 形 です。★→ ★★時間の ほうも 掛け直します。
       ★ ★★「戻す」の 決まりに 1行 足します：★★**時間で 消える ものは、時間ごと 戻す。**
       ============================================================ */
    var lock32 = false;
    if (resultBox && resultBox.classList.contains('is-locked')) {
      lock32 = true;
      later(T.RESULT_LOCK, function () { resultBox.classList.remove('is-locked'); });
    }
    var m32 = '―';
    (function () {
      if (!levelPickResult) return;
      var k32 = levelPickResult.classList.contains('hidden');
      levelPickResult.classList.toggle('hidden');                    /* ★ わざと 1つ 汚す */
      var saw = snapDiff(SNAP1, screenSnap()).length > 0;
      if (k32) levelPickResult.classList.add('hidden'); else levelPickResult.classList.remove('hidden');
      var back = snapDiff(SNAP1, screenSnap()).length === 0;
      m32 = (saw ? '気づく' : '★気づかない') + '・' + (back ? 'もどった' : '★もどせて いない');
      if (!saw) ng.push('★★★㉜ わざと 1つ 汚しても 気づきません ―― ★★**見張りの ほうが 壊れて います**');
      if (!back) ng.push('★★★㉜ 見本を 元に もどせて いません（★あとの 数字が 信じられません）');
    })();
    /* ============================================================
       ★★★ T217-5 ―― ★★ものさしを 汚す 見本（★🧪トライの 名ざし・★上の 2行の 対）★★★
       ------------------------------------------------------------
       ★ ★私の 決まり：★**上の線を 引いたら、下の線も 引く**。★★天井と 箱の ふたを 写すように した
         ★ ★以上、★★「本当に 気づくか」を **毎回** わざと 汚して 確かめます。
       ★ ★★上の 見本（つよさの えらびを 消す）は 通っても、★★天井の 目が 死んで いたら
         ★ ★★★㉛・㉝・㉞ の 3つが 同時に 黙ります ―― ★そこは 別に 鳴らす 必要が あります。
       ★ ★★① 天井 … `:root{--result-max:999px !important}` を 足す（★出来上がりの 値が 変わる）
       ★ ★★② 箱の ふた … `resultBox.style.maxHeight = 'none'`（★㉞ が 一瞬 やる のと 同じ 形）
       ⚠️★ ★どちらも **決め打ち**です（★画面の 値から 作って いません）。★終わりに 必ず もどします。
       ============================================================ */
    var m32b = '―';
    (function () {
      if (!resultBox) return;
      var st32 = document.createElement('style');
      st32.textContent = ':root{--result-max:999px !important;}';
      document.head.appendChild(st32);
      void resultBox.offsetWidth;
      var sawTen = snapDiff(SNAP1, screenSnap()).some(function (x) { return x.indexOf('天井') === 0; });
      st32.parentNode.removeChild(st32);
      void resultBox.offsetWidth;
      var keep32 = resultBox.style.maxHeight;
      resultBox.style.maxHeight = 'none';
      var sawFuta = snapDiff(SNAP1, screenSnap()).some(function (x) { return x.indexOf('箱のふた') === 0; });
      resultBox.style.maxHeight = keep32;
      void resultBox.offsetWidth;
      var back32 = snapDiff(SNAP1, screenSnap()).length === 0;
      m32b = (sawTen ? '天井 気づく' : '★★天井 気づかない') + '・' +
             (sawFuta ? 'ふた 気づく' : '★★ふた 気づかない') + '・' +
             (back32 ? 'もどった' : '★もどせて いない');
      if (!sawTen) ng.push('★★★㉜ ものさし（--result-max）を わざと 999px に しても 気づきません ―― ★★★これが 死ぬと ㉛・㉝・㉞ が **3つ とも 同時に 黙ります**');
      if (!sawFuta) ng.push('★★★㉜ 箱の ふた（maxHeight）を わざと 外しても 気づきません ―― ★★㉞ の 戻し忘れを 誰も 見つけられません');
      if (!back32) ng.push('★★★㉜ ものさしの 見本を 元に もどせて いません（★あとの 数字が 信じられません）');
    })();
    note['㉜ ★★verify が 画面を 汚して いないか'] =
      (d32.length ? '★★★' + d32.length + 'か所 ちがう：' + d32.join('／') : '★頭と お尻で ぜんぶ 同じ') +
      '／★画面 ' + SNAP1.画面 + '（題・遊・結・強・順・知・案・ふ）／★札 ' + SNAP1.札 + '枚・待ち ' + SNAP1.待ち +
      '／★鍵 ' + (lock32 ? '★掛かって いた ので 外す 時間を 掛け直した' : 'なし') +
      '／★ものさし ' + SNAP1.天井 + '（' +
        getComputedStyle(document.documentElement).getPropertyValue('--result-max').trim() +
        '）・箱の ふた ' + SNAP1.箱のふた +
      '／★見本 ' + m32 + '・' + m32b;

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
              line: lineProbe, level: levelProbe, result: resultProbe, win: winProbe, handHit: handHit,
              sort: sortProbe, guide: guideProbe }
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
