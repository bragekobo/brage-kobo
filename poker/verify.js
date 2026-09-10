'use strict';
/* ============================================================
   ポーカー ―― ★★見張り（verify）★★   T247 ／ 💻 コーダ
   ------------------------------------------------------------
   ★★ このファイルは 遊びの 中身を 1行も 持ちません。
   ★★ `game.js`・`index.html`・`style.css` は 1文字も 触って いません（★md5 で 確かめて あります）。
      ―― ★★アトが 同時に 並べ方（style.css・index.html）を 作りかえて いる 最中 なので、
        ★★★ぶつからない ように **新しい ファイル 1つ** だけで 目を 足しました。
      ―― ★中を のぞく 口は、game.js が 前から 持って いる `window.POKER` と `window.PokerCore` です。

   ============================================================
   ★★★ この 見張りの いちばん 大きな 決め ―― ★★「写し」で 数える ★★★
   ============================================================
     ★ ★ヨット・大富豪の 見張りは、★★遊んで いる その 画面で 時計を 借りて 走らせました。
       ★ ★★その やり方は「見張りが 遊びを 止める」事故を ハーツで 7度、ヨットで 2度 起こして います
         ★ ★（★戻し忘れ・★時計の 返し忘れ・★見本の 消し忘れ）。
     ★ ★★ポーカーでは、★★★同じ index.html を **見えない iframe（写し）** に もう 1つ 開き、
       ★ ★★その 中の `POKER`・`PokerCore` を 見張ります。
       ★ ★① ★本物の 画面・時計・乱数・しまう もの には **1度も 触りません**（★構造で 保証）。
       ★ ★② ★★わざと 壊す ときも **写しを 壊します**（★★社長の 決まり「写しを 作って 壊す」）。
       ★ ★③ ★★写しは おわりに 消します。★消し忘れ・置き忘れは ㉜（見張り自身の 見張り）が 鳴らします。
     ★ ★代金：★★写しを 開く ぶん 0.3〜1秒 かかる。★file:// では 写しが 作れない（★http で 開く）。

   ============================================================
   ★★★ 型の 9行（★この会社が 見張りで 学んだ こと・★大富豪 T184 → ヨット T193 から 写しました）★★★
   ============================================================
     ★① computed style を 信じない ―― ★★本物の 当たり（elementFromPoint）で 数える【T180】
     ★② ★★鳴らない ときに 黙って いる 方が 難しい ―― ★線が 引けない ものは
         ★ ★「鳴らす」のを やめて「読むための 数字」に 格下げする【T182 アト】
     ★③ ★★その 画面を 回さないと 鳴らない 見張りを 作らない【T181 トライ・T182 アト】
     ★④ ★★`★NG` は「数」であること・★わざと 壊して 鳴る ことを 見せる【T162・T163】
     ★⑤ ★★見張りは 見るだけ ―― ★さわった ものは 1つ 残らず 戻す【T144 §7-5】
     ★⑥ ★★数える 前に 後片づけを しない【T184 失敗⑥】
     ★⑦ ★★入れ子に なるなら 積み木に する【T188 失敗⑬】
     ★⑧ ★★借りた ものは 必ず 綱に つなぐ【T188 失敗⑪】
     ★⑨ ★★人に 見えるかを 数える 目は、必ず **画面が 描かれて いる とき** に 数える【T184 失敗⑨】

   ============================================================
   ★★★ この 1本に 要る 目（★秘書アイの お願い・★ルル T245 §D の 線）★★★
   ============================================================
     ★① ★コインが 消えない・増えない（★checkCoins を 組みこむ ＋ 自分でも 数える）
     ★② ★配り・取りかえ・決着の 決まり（★52枚・★取りかえは 最大 5枚・1回・★役の 強さ順・★小がけ 5／大がけ 10・★親が 1つ ずれる）
     ★③ ★外への 通信 0件／★エラー 0件
     ★④ ★見張り自身が 画面を 汚さない（★ハーツ ㉜ と 同じ 形）
     ★⑤ ★44px の 指の 的（★「44以上か」だけ。★★いま 何px かは 見ない ―― 並びに よらない）
     ★⑥ ★山札と 捨て札の 数が 合う（★52 ＝ 手札 ＋ 山札 ＋ 捨て札）
     ★⑦ ★ルルの 線：★山札の 残り枚数を 画面に 出さない／★捨て札は 裏向き
     ★⑨ ★★★T248 で 足した 目：★ハッピーの ことばが、いまの 場面と 合って いるか
         ★ ―― ★★かけの 番に「いらない札は どれかな？」（★取りかえの ことば）を 96.8% 言って いたのに、
         ★ ★★見張り 31個は 1つも 鳴らず、★★★社長の 目（写真）だけが 見つけました（★3度目）。
         ★ ★見る のは 1つ だけ：**ハッピーが 求めて いる 行いが、いま その 画面で できるか**。
         ★ ★見ない こと（正直に）：ことばの 上手・下手、★言いすぎ（同じ ことを 2度 言う）。
     ★⑨-b ★★★T250 で 足した 裏返しの 線：★★**かけの 番なら、かけの ことばを 1つ 言って いること**。
         ★ ―― ★T248 の ⑨ は「できない ことを 求めて いないか」しか 見て いませんでした。
         ★ ★★だから かけ②で「ワンペアに なった！」が 出ていても 鳴らず（★何も 求めて いない ので）、
         ★ ★★★見つけたのは トライが 指で 数えた 18回（かけの ことば 0回）でした【T249 §A-2】。
         ★ ★逃げ道は 1つ だけ：社長の お決めの「やった！ 強い手だ！」（★BET_OK）。
     ★⑨-c ★★★T250：★★この 目が「人が 遊ぶ 速さの 道」を 歩いた ことを、毎回 その場で 証す。
         ★ ―― ★`state.fast` が 立って いたら NG。★めくりの 一言（flashHappy）を 1度も 見なければ NG。
         ★ ★★T248 の 私の 数「かけ② 94.0%」は、★★★早送りでしか 通らない 道の 数でした（★道具の うそ・5度目）。
   ★★ 作って いない もの（★今回）：★はみ出し・切れ・場の 大きさ・線の 位置 ―― ★★アトが 終わって から。

   ★★ 使い方（★作る人むけ・console）：
       await POKER.verify()        ← ★150ハンド ＋ 場面 ＋ わざと壊す。★★戻り値は Promise
       await POKER.verify(400)     ← ★ハンド数を 変える
       POKER.verifyLast            ← ★最後の 結果
   ============================================================ */

(function (root) {

  /* ★ 写しの 中では 何も しない（★写しが また 写しを 作る 輪を 切る）*/
  if (root.name === 'poker-verify-copy') return;
  if (!root.POKER || !root.POKER.state || !root.PokerCore) return;      /* ★ 遊びを 止めない */

  var P0 = root.POKER;
  var $ = function (id) { return document.getElementById(id); };

  /* ============================================================
     ★ 0. 決め打ちの 見本（★会社の 決まり「見張りの 見本は 決め打ちに する」）
     ------------------------------------------------------------
     ★ ★★game.js や CSS から 読みません。★読んだら「見張って いる ふり」に なります。
     ============================================================ */
  var K = {
    CARDS: 52,            /* ★ ジョーカー なし（★社長裁定 2026-08-18）*/
    SUITS: 4, RANKS: 13,
    SEATS: 4,             /* ★ 自分 ＋ ロボット 3人 */
    HAND: 5,
    DECK_AFTER_DEAL: 32,  /* ★ 52 − 4×5 */
    DECK_MIN: 12,         /* ★ 32 − 最大 20枚 引く */
    SB: 5, BB: 10,        /* ★ 小がけ・大がけ */
    START: 200,
    SWAP_MAX: 5,          /* ★ 取りかえは 0〜5枚・1回 */
    TAP: 44,              /* ★ T122 の 会社の 線 */
    /* ★ 本物の 役の 強さ順（★強い 順・上から）*/
    LADDER: ['royalFlush', 'straightFlush', 'fourOfAKind', 'fullHouse', 'flush',
             'straight', 'threeOfAKind', 'twoPair', 'onePair', 'highCard'],
    SEED_RULE: 20260907,  /* ★ 決まりを 数える ときの 種 */
    SEED_SCENE: 7,        /* ★ 場面を 作る ときの 種（★下で 確かめて 決めました）*/
    RANDOM_HANDS: 3000,   /* ★ 役の 突き合わせの 手の 数 */
    HANDS: 150            /* ★ verify() の 既定の ハンド数 */
  };

  /* ============================================================
     ★ 1. 独立した 役の 判定器 ―― ★★PokerCore を 1行も 見ずに 書いた もの
     ------------------------------------------------------------
     ★ ★★写しの `PokerCore.evaluate` と 突き合わせる ための「もう 1つの 答え」。
     ★ ★同じ 人が 同じ 本を 見て 書くと 同じ まちがいを しますが、
       ★ ★★本物の 決まり（Wikipedia「List of poker hands」）から 書き起こして います。
     ============================================================ */
  function myEval(cards) {
    var vals = cards.map(function (c) { return c.value; }).sort(function (a, b) { return b - a; });
    var cnt = {}, i;
    for (i = 0; i < vals.length; i++) cnt[vals[i]] = (cnt[vals[i]] || 0) + 1;
    var groups = Object.keys(cnt).map(function (v) { return { v: +v, n: cnt[v] }; })
      .sort(function (a, b) { return b.n - a.n || b.v - a.v; });
    var flush = cards.every(function (c) { return c.suit === cards[0].suit; });
    var uniq = groups.length === 5;
    var high = 0;
    if (uniq) {
      if (vals[0] - vals[4] === 4) high = vals[0];
      else if (vals[0] === 14 && vals[1] === 5 && vals[4] === 2) high = 5;   /* ★ A-2-3-4-5（★A は 下にも 使える）*/
    }
    var cat, tb;
    if (high && flush)                          { cat = high === 14 ? 10 : 9; tb = [high]; }
    else if (groups[0].n === 4)                 { cat = 8; tb = [groups[0].v, groups[1].v]; }
    else if (groups[0].n === 3 && groups[1].n === 2) { cat = 7; tb = [groups[0].v, groups[1].v]; }
    else if (flush)                             { cat = 6; tb = vals; }
    else if (high)                              { cat = 5; tb = [high]; }
    else if (groups[0].n === 3)                 { cat = 4; tb = [groups[0].v, groups[1].v, groups[2].v]; }
    else if (groups[0].n === 2 && groups[1].n === 2) { cat = 3; tb = [groups[0].v, groups[1].v, groups[2].v]; }
    else if (groups[0].n === 2)                 { cat = 2; tb = [groups[0].v, groups[1].v, groups[2].v, groups[3].v]; }
    else                                        { cat = 1; tb = vals; }
    return { cat: cat, tb: tb, id: K.LADDER[10 - cat] };
  }
  function myCompare(a, b) {
    if (a.cat !== b.cat) return a.cat > b.cat ? 1 : -1;
    for (var i = 0; i < Math.max(a.tb.length, b.tb.length); i++) {
      var x = a.tb[i] || 0, y = b.tb[i] || 0;
      if (x !== y) return x > y ? 1 : -1;
    }
    return 0;
  }
  function sgn(x) { return x > 0 ? 1 : (x < 0 ? -1 : 0); }

  /* ★ 決め打ちの 見本（★役 13手 ＋ くらべ 12組）*/
  var FIX_HANDS = [
    ['s10 sJ sQ sK sA', 'royalFlush'],
    ['s9 s10 sJ sQ sK', 'straightFlush'],
    ['sA s2 s3 s4 s5',  'straightFlush'],      /* ★ A を 下に 使った 同じマークの 5つ続き */
    ['s7 h7 d7 c7 sK',  'fourOfAKind'],
    ['s8 h8 d8 sK hK',  'fullHouse'],
    ['s2 s7 s9 sJ sK',  'flush'],
    ['h10 sJ dQ cK sA', 'straight'],
    ['sA h2 d3 c4 s5',  'straight'],           /* ★ A-2-3-4-5 は ストレート */
    ['sK hA d2 c3 s4',  'highCard'],           /* ★ K-A-2-3-4 は つながらない */
    ['s5 h5 d5 c9 s2',  'threeOfAKind'],
    ['sQ hQ d4 c4 h9',  'twoPair'],
    ['s7 h7 cK d4 c2',  'onePair'],
    ['sA h9 d7 c4 s2',  'highCard']
  ];
  var FIX_PAIRS = [   /* [強い, 弱い, 期待（1 ＝ 左が 強い・0 ＝ 引き分け）] */
    ['s10 sJ sQ sK sA', 's9 s10 sJ sQ sK', 1],
    ['s9 s10 sJ sQ sK', 's7 h7 d7 c7 sK', 1],
    ['s7 h7 d7 c7 sK',  's8 h8 d8 sK hK', 1],
    ['s8 h8 d8 sK hK',  's2 s7 s9 sJ sK', 1],
    ['sA s2 s3 s4 s7',  'h10 sJ dQ cK sA', 1],   /* ★ フラッシュ ＞ ストレート */
    ['h10 sJ dQ cK sA', 's5 h5 d5 c9 s2', 1],
    ['h6 s7 d8 c9 s10', 'sA h2 d3 c4 s5', 1],    /* ★ 6〜10 ＞ A〜5 */
    ['s2 s3 s4 s5 s6',  'sA s2 s3 s4 s5', 1],
    ['sQ hQ d4 c4 h9',  'sJ hJ d10 c10 hA', 1],  /* ★ 上の ペアで 決まる */
    ['s7 h7 cK d4 c2',  's7 d7 cQ dJ c10', 1],   /* ★ 同じ ペア → 一番 大きい 残りで */
    ['sA h9 d7 c4 s2',  'sK hQ dJ c9 s7', 1],
    ['sA h9 d7 c4 s2',  'hA s9 c7 d4 h2', 0]     /* ★ 引き分け */
  ];

  /* ============================================================
     ★ 2. どうぐ箱
     ============================================================ */
  function rng(s) {
    var x = (s | 0) || 20260907;
    return function () { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; x |= 0; return (x >>> 0) / 4294967296; };
  }
  function visible(el) {
    if (!el || !el.getBoundingClientRect) return false;
    var q = el.getBoundingClientRect();
    if (!(q.width > 0.5 && q.height > 0.5)) return false;
    var d = el.ownerDocument, w = d.defaultView;
    /* ★ opacity は 見ない ―― ★絵の フェードの 途中を「見えない」と 読むと、捨て札の 表を 見逃します（★たまに 黙る）*/
    for (var n = el; n && n.nodeType === 1; n = n.parentElement) {
      var cs = w.getComputedStyle(n);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    }
    return true;
  }
  function nameOf(el) {
    var id = el.id ? '#' + el.id : '';
    var cls = (typeof el.className === 'string' && el.className.trim()) ? '.' + el.className.trim().split(/\s+/)[0] : '';
    var act = el.dataset && el.dataset.act ? '[' + el.dataset.act + ']' : '';
    var key = el.dataset && el.dataset.key ? '[' + el.dataset.key + ']' : '';
    return el.tagName.toLowerCase() + id + cls + act + key;
  }
  function sameOrigin(url, base) {
    try {
      var u = new URL(url, base.href);
      if (/^(data|blob|about|javascript):$/.test(u.protocol)) return true;
      return u.origin === base.origin || (u.protocol === 'file:' && base.protocol === 'file:');
    } catch (e) { return false; }
  }
  /* ★ 外への 通信（★DOM に 置かれた 外の 住所 ＋ すでに 読んだ もの）*/
  function foreignInDom(doc) {
    var out = [], base = doc.location;
    var sel = 'script[src],link[href],img[src],iframe[src],video[src],audio[src],source[src],object[data],embed[src]';
    var list = doc.querySelectorAll(sel);
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (el.tagName === 'LINK') {
        var rel = (el.getAttribute('rel') || '').toLowerCase();
        if (!/stylesheet|preload|prefetch|modulepreload|icon|manifest|import/.test(rel)) continue;
      }
      var u = el.getAttribute('src') || el.getAttribute('href') || el.getAttribute('data') || '';
      if (u && !sameOrigin(u, base)) out.push(nameOf(el) + ' → ' + u.slice(0, 60));
    }
    return out;
  }
  function foreignLoaded(win) {
    var out = [];
    try {
      var es = win.performance.getEntriesByType('resource');
      for (var i = 0; i < es.length; i++) if (!sameOrigin(es[i].name, win.location)) out.push(es[i].name.slice(0, 80));
    } catch (e) {}
    return out;
  }
  /* ★ 通信の 口を 数える（★借りて、返す）*/
  function watchNet(win) {
    var c = { fetch: 0, xhr: 0, beacon: 0, ws: 0 };
    var impl = { fetch: win.fetch, open: win.XMLHttpRequest && win.XMLHttpRequest.prototype.open,
                 beacon: win.navigator && win.navigator.sendBeacon, ws: win.WebSocket };
    if (impl.fetch) win.fetch = function () { c.fetch++; return impl.fetch.apply(win, arguments); };
    if (impl.open) win.XMLHttpRequest.prototype.open = function () { c.xhr++; return impl.open.apply(this, arguments); };
    if (impl.beacon) win.navigator.sendBeacon = function () { c.beacon++; return impl.beacon.apply(win.navigator, arguments); };
    if (impl.ws) {
      var WS = function (a, b) { c.ws++; return b === undefined ? new impl.ws(a) : new impl.ws(a, b); };
      WS.prototype = impl.ws.prototype;
      win.WebSocket = WS;
    }
    return {
      counts: c, impl: impl,
      total: function () { return c.fetch + c.xhr + c.beacon + c.ws; },
      restore: function () {
        if (impl.fetch) win.fetch = impl.fetch;
        if (impl.open) win.XMLHttpRequest.prototype.open = impl.open;
        if (impl.beacon) win.navigator.sendBeacon = impl.beacon;
        if (impl.ws) win.WebSocket = impl.ws;
      }
    };
  }
  /* ★ エラーを 数える（★借りて、返す）*/
  function watchErr(win) {
    var list = [];
    var onE = function (e) { list.push('error: ' + String((e && (e.message || (e.error && e.error.message))) || e)); };
    var onR = function (e) { list.push('promise: ' + String((e && e.reason && (e.reason.message || e.reason)) || e)); };
    win.addEventListener('error', onE);
    win.addEventListener('unhandledrejection', onR);
    return { list: list, restore: function () { win.removeEventListener('error', onE); win.removeEventListener('unhandledrejection', onR); } };
  }

  /* ============================================================
     ★ 3. ㉜ ★★見張り自身が 画面を 汚して いないか（★ハーツ ㉜ の 形）
     ------------------------------------------------------------
     ★ ★★写し方式 なので 本物には 触らない はず。★★これは「はず」を 数に する 目。
     ★ ★★遊びが 自分で 変える もの（ポット・手番・コイン）は 写しません ――
       ★ ★★verify の あいだも 本物の ロボットは 時計で 動き つづける ので、
         ★ ★★それを くらべると「たまに 鳴る」見張りに なります（★壊れて いるのと 同じ）。
       ★ ★★写すのは、★遊びが ぜったいに 自分で 変えない もの だけ。
     ============================================================ */
  function topSnap() {
    var PC = root.PokerCore;
    return {
      'bodyの 子の 数': document.body.children.length,
      'iframe の 数': document.querySelectorAll('iframe').length,
      'style の 数': document.querySelectorAll('style').length,
      'script の 数': document.querySelectorAll('script').length,
      'link の 数': document.querySelectorAll('link').length,
      'html の class': document.documentElement.className,
      'body の class': document.body.className,
      'title': document.title,
      'Math.random': Math.random,
      'setTimeout': root.setTimeout,
      'clearTimeout': root.clearTimeout,
      'fetch': root.fetch,
      'XHR.open': root.XMLHttpRequest ? root.XMLHttpRequest.prototype.open : null,
      'sendBeacon': root.navigator.sendBeacon,
      'WebSocket': root.WebSocket,
      'Storage.setItem': root.Storage ? root.Storage.prototype.setItem : null,
      'console.log': root.console.log,
      'PokerCore.draw': PC.draw, 'PokerCore.settle': PC.settle, 'PokerCore.evaluate': PC.evaluate,
      'PokerCore.shuffle': PC.shuffle, 'PokerCore.createDeck': PC.createDeck,
      'POKER.state': P0.state,
      'POKER.autoPlay': P0.autoPlay,
      'state.fast': P0.state.fast,
      'state.cpu': P0.state.cpu,
      'state.mode': P0.state.mode
    };
  }
  function snapDiff(a, b) {
    var d = [], k;
    for (k in a) if (a.hasOwnProperty(k) && a[k] !== b[k]) {
      d.push(k + '：' + String(typeof a[k] === 'function' ? '（もとの もの）' : a[k]).slice(0, 30) + ' → ' +
             String(typeof b[k] === 'function' ? '（別の もの）' : b[k]).slice(0, 30));
    }
    return d;
  }

  /* ============================================================
     ★ 4. 写しを 作る／消す
     ============================================================ */
  function makeCopy() {
    return new Promise(function (res, rej) {
      var f = document.createElement('iframe');
      var w = document.documentElement.clientWidth || root.innerWidth, h = root.innerHeight;
      f.name = 'poker-verify-copy';
      f.setAttribute('aria-hidden', 'true');
      f.tabIndex = -1;
      f.style.cssText = 'position:fixed;left:0;top:0;width:' + w + 'px;height:' + h +
        'px;border:0;margin:0;padding:0;opacity:0;pointer-events:none;z-index:2147483647;';
      var done = false, timer = 0;
      var fail = function (why) {
        if (done) return; done = true;
        if (timer) clearTimeout(timer);
        try { if (f.parentNode) f.parentNode.removeChild(f); } catch (e) {}
        rej(new Error(why));
      };
      f.onload = function () {
        if (done) return;
        var W, D;
        try { W = f.contentWindow; D = f.contentDocument; if (!W || !D || !W.document) throw new Error('x'); }
        catch (e) { return fail('写しの 中が 読めません（★file:// では 見張れません。★http で 開いて ください）'); }
        if (!W.POKER || !W.POKER.state || !W.PokerCore) return fail('写しの 中に POKER が ありません');
        done = true;
        if (timer) clearTimeout(timer);
        res({
          win: W, doc: D, frame: f, POKER: W.POKER, PC: W.PokerCore, state: W.POKER.state,
          destroy: function () { try { if (f.parentNode) f.parentNode.removeChild(f); } catch (e) {} }
        });
      };
      timer = setTimeout(function () { fail('写しが 15秒 たっても 読めません'); }, 15000);
      f.src = location.href.split('#')[0];
      document.body.appendChild(f);
    });
  }

  /* ============================================================
     ★ 5. 写しの PokerCore に 目を つける（★借りて、返す）
     ------------------------------------------------------------
     ★ ★game.js は `PC.draw(...)` の ように **呼ぶ たびに** PokerCore の 中を 引きます。
       ★ ★だから 写しの PokerCore の 5つを 包めば、★配り・取りかえ・決着の 途中が 全部 見えます。
     ★ ★`cp.impl` が 本体。★★わざと 壊す ときは impl だけを すり替えます（★目は そのまま）。
     ============================================================ */
  function installHooks(cp) {
    var PC = cp.PC, S = cp.state;
    var orig = { createDeck: PC.createDeck, shuffle: PC.shuffle, draw: PC.draw, evaluate: PC.evaluate, settle: PC.settle };
    var impl = { createDeck: orig.createDeck, shuffle: orig.shuffle, draw: orig.draw, evaluate: orig.evaluate, settle: orig.settle };
    cp.impl = impl;
    cp.orig = orig;
    var T = null;                     /* ★ いま 数えて いる 帳面（★null なら 数えない）*/
    var hand = null;
    var prevDealer = -1, prevOrder = '';

    function newHand() {
      return { no: S.handNo, drawn: {}, nDrawn: 0, dealDraws: 0, blinds: false, lastPot: 0, ended: false,
               coins0: S.players.map(function (p) { return p.coins; }), dealer: S.dealer, order: '' };
    }
    function ng(msg) { if (T && T.ng.indexOf(msg) < 0) T.ng.push(msg); }
    function sumCoins() { var s = 0; S.players.forEach(function (p) { s += p.coins; }); return s; }
    function sumPut() { var s = 0; S.players.forEach(function (p) { s += p.put; }); return s; }

    /* ★ 52 ＝ 手札 ＋ 山札 ＋ 捨て札（★ダブり なし）*/
    function count52(where) {
      var seen = {}, n = 0, dup = 0;
      function add(k) { if (seen[k]) dup++; seen[k] = 1; n++; }
      S.players.forEach(function (p) { (p.hole || []).forEach(function (c) { add(c.key); }); });
      (S.deck || []).forEach(function (c) { add(c.key); });
      (S.discardKeys || []).forEach(add);
      if (n !== K.CARDS || dup) ng('★★★52枚に なりません（' + where + '：手札＋山札＋捨て札 ＝ ' + n + '枚・ダブり ' + dup + '）');
    }

    PC.createDeck = function () {
      var d = impl.createDeck.apply(this, arguments);
      if (!T) return d;
      T.decks++;
      var keys = {}, dup = 0, joker = 0, bySuit = {};
      d.forEach(function (c) {
        if (!c || !c.key) { dup++; return; }
        if (c.wild || /joker/i.test(c.key)) joker++;
        if (keys[c.key]) dup++;
        keys[c.key] = 1;
        bySuit[c.suit] = (bySuit[c.suit] || 0) + 1;
      });
      var suits = Object.keys(bySuit);
      if (d.length !== K.CARDS || dup || joker) ng('★★★山札が 52枚 ではありません（' + d.length + '枚・ダブり ' + dup + '・ジョーカー ' + joker + '）');
      if (suits.length !== K.SUITS || suits.some(function (s) { return bySuit[s] !== K.RANKS; }))
        ng('★★山札が 4マーク × 13 に なって いません（' + suits.map(function (s) { return s + ':' + bySuit[s]; }).join(' ') + '）');
      /* ★ ここが ハンドの はじめ（★親は もう 1つ ずれて いる・ポットは 0）*/
      if (hand && !hand.ended) ng('★★前の ハンドが 終わらない まま 次を 配りました（' + hand.no + 'ハンドめ）');
      hand = newHand();
      hand.order0 = d.map(function (c) { return c.key; }).join(' ');
      if (prevDealer >= 0 && S.dealer !== (prevDealer + 1) % K.SEATS)
        ng('★★親が 1つ ずれて いません（' + prevDealer + ' → ' + S.dealer + '）');
      prevDealer = S.dealer;
      if (S.pot !== 0) ng('★★ハンドの はじめに ポットが 残って います（' + S.pot + '）');
      if (sumCoins() !== S.injected) ng('★★★ハンドの はじめに コインの 合計が ちがいます（' + sumCoins() + ' ≠ ' + S.injected + '）');
      return d;
    };

    PC.shuffle = function (arr, r) {
      var before = arr.map(function (c) { return c.key; });
      var out = impl.shuffle.apply(this, arguments);
      if (!T) return out;
      var after = out.map(function (c) { return c.key; });
      if (after.length !== before.length || before.slice().sort().join(' ') !== after.slice().sort().join(' '))
        ng('★★★切った あとの 山札が 前と ちがう 札に なって います');
      if (hand) {
        hand.order = after.join(' ');
        if (hand.order === hand.order0) T.noShuffle++;
        if (prevOrder && hand.order === prevOrder) T.sameDeal++;
        prevOrder = hand.order;
      }
      return out;
    };

    PC.draw = function (deck, n) {
      var len0 = deck ? deck.length : -1;
      var out = impl.draw.apply(this, arguments);
      if (!T || !hand) return out;
      T.draws++;
      if (out.length !== n) ng('★★引いた 枚数が ちがいます（' + n + '枚 頼んで ' + out.length + '枚）');
      if (len0 < n) ng('★★★山札が 足りません（のこり ' + len0 + '枚 で ' + n + '枚）');
      out.forEach(function (c) {
        if (hand.drawn[c.key]) ng('★★★同じ 札を 2回 引きました（' + c.key + '）');
        hand.drawn[c.key] = 1; hand.nDrawn++;
        if (S.discardKeys.indexOf(c.key) >= 0) ng('★★★捨てた 札が 山から もどって きました（' + c.key + '）');
      });
      if (deck.length + hand.nDrawn !== K.CARDS) ng('★★★山札 ＋ 引いた 札 が 52枚に なりません（' + deck.length + ' + ' + hand.nDrawn + '）');
      if (S.phase === 'swap') {
        T.swapDraws++;
        if (n > K.SWAP_MAX) ng('★★★取りかえで 5枚より 多く 引きました（' + n + '枚）');
        if (n >= 0 && n <= K.SWAP_MAX) T.swapN[n]++;
        var p = S.players[S.turn];
        if (!p) ng('★★取りかえの 番の 人が いません');
        else {
          if (p.swapped) ng('★★★同じ 人が 2回 取りかえました（' + p.name + '）');
          if (p.folded) ng('★★降りた 人が 取りかえました（' + p.name + '）');
        }
        if (deck !== S.deck) ng('★★取りかえで 山札で ない ところから 引きました');
      } else {
        hand.dealDraws++;
        if (n !== K.HAND) ng('★★配る 枚数が 5枚 ではありません（' + n + '枚）');
        if (hand.dealDraws > K.SEATS) ng('★★' + hand.dealDraws + '人目に 配りました（4人の はず）');
        if (hand.dealDraws === K.SEATS && deck.length !== K.DECK_AFTER_DEAL)
          ng('★★配った あとの 山札が 32枚 ではありません（' + deck.length + '枚）');
      }
      return out;
    };

    PC.evaluate = function () {
      var r = impl.evaluate.apply(this, arguments);
      if (!T || !hand || S.phase === 'demo') return r;
      T.evals++;
      if (S.handNo !== hand.no) return r;
      var i, p;
      /* ★ いつでも 守る こと */
      if (sumCoins() + S.pot !== S.injected) ng('★★★コインが 消えた／増えた（' + sumCoins() + ' + ポット ' + S.pot + ' ≠ ' + S.injected + '）');
      if (sumPut() !== S.pot) ng('★★★出した 合計 ' + sumPut() + ' ≠ ポット ' + S.pot);
      for (i = 0; i < S.players.length; i++) {
        p = S.players[i];
        if (p.coins < 0) ng('★★★' + p.name + ' の コインが マイナス（' + p.coins + '）');
        if (p.hole.length !== K.HAND) ng('★★★' + p.name + ' の 手札が 5枚 ではありません（' + p.hole.length + '枚）');
        /* ★ ぜんぶ かけた 印は 次の ハンドまで 残る（★勝って コインが 戻っても）。★★だから かけ・取りかえの 最中だけ 見る
           ★ ★（★最初 ここで 12画面 × 4人 が うそを 鳴らしました ―― ★私の 目の 穴）*/
        if ((S.phase === 'bet' || S.phase === 'swap') && p.allIn && p.coins !== 0) ng('★★ぜんぶ かけた 人に コインが 残って います（' + p.name + '）');
        if (p.swapCount != null && (p.swapCount < 0 || p.swapCount > K.SWAP_MAX)) ng('★★取りかえ 枚数が 0〜5 の 外（' + p.swapCount + '）');
      }
      count52(S.phase);
      if (S.phase === 'bet') {
        if (S.toCall < 0) ng('★★合わせる 額が マイナス');
        for (i = 0; i < S.players.length; i++) {
          p = S.players[i];
          if (!p.folded && p.bet > S.toCall) ng('★★出して いる 額が 合わせる 額を こえて います（' + p.name + '：' + p.bet + ' > ' + S.toCall + '）');
        }
        /* ★ 小がけ 5・大がけ 10（★親の 左どなり・そのまた 左どなり）―― ★★ハンドの 最初の 1回だけ */
        if (!hand.blinds && S.street === 0) {
          hand.blinds = true;
          var sbI = (hand.dealer + 1) % K.SEATS, bbI = (hand.dealer + 2) % K.SEATS;
          var sbPay = Math.min(K.SB, hand.coins0[sbI]), bbPay = Math.min(K.BB, hand.coins0[bbI]);
          if (S.players[sbI].put !== sbPay) ng('★★★小がけが ' + sbPay + ' ではありません（' + S.players[sbI].name + '：' + S.players[sbI].put + '）');
          if (S.players[bbI].put !== bbPay) ng('★★★大がけが ' + bbPay + ' ではありません（' + S.players[bbI].name + '：' + S.players[bbI].put + '）');
          for (i = 0; i < S.players.length; i++) if (i !== sbI && i !== bbI && S.players[i].put !== 0) ng('★★かけの 前に 出して いる 人が います（' + S.players[i].name + '）');
          if (S.pot !== sbPay + bbPay) ng('★★最初の ポットが 小がけ＋大がけ ではありません（' + S.pot + '）');
          if (S.turn !== (hand.dealer + 3) % K.SEATS) ng('★★かけ①の 最初の 番が 大がけの 左どなり ではありません');
          T.blinds++;
        }
      }
      if (S.phase === 'bet' || S.phase === 'swap') hand.lastPot = S.pot;
      /* ★ ハンドの おわり（★1回だけ 数える）
         ⚠️★ `showdown()` は 決着の 前にも evaluate を 呼びます（★手を 数える とき・★ポットは まだ 残って いる）。
            ★ ★そこで 数えると「ポットが 残って いる」と うそを 言う ので、
              ★ ★★決着の 表（settle）が 入った あと か、★1人だけ 残った あと に しか 数えません。 */
      var live = S.players.filter(function (q) { return !q.folded; });
      if ((S.phase === 'end' || S.phase === 'over') && !hand.ended && (S.settle || live.length <= 1)) {
        hand.ended = true;
        T.hands++;
        if (S.pot !== 0) ng('★★決着の あとに ポットが 残って います（' + S.pot + '）');
        for (i = 0; i < S.players.length; i++) {
          p = S.players[i];
          if (p.put !== 0 || p.bet !== 0) ng('★★決着の あとに 出した 額が 残って います（' + p.name + '）');
        }
        if (sumCoins() !== S.injected) ng('★★★決着の あとに コインの 合計が ちがいます（' + sumCoins() + ' ≠ ' + S.injected + '）');
        if (S.settle) {
          T.shows++;
          if (live.length < 2) ng('★★1人しか 残って いないのに 勝負に なりました');
          for (i = 0; i < S.players.length; i++) {
            p = S.players[i];
            if (p.gain !== (S.settle.payouts[i] || 0)) ng('★★もらった 額が 決着の 表と ちがいます（' + p.name + '：' + p.gain + ' ≠ ' + (S.settle.payouts[i] || 0) + '）');
            if (!p.folded && p.swapCount == null) ng('★★★取りかえないまま 勝負に なりました（' + p.name + '）');
          }
          if (S.deck.length < K.DECK_MIN) ng('★★勝負の とき 山札が 12枚を 割って います（' + S.deck.length + '枚）');
        } else {
          T.folds++;
          if (live.length !== 1) ng('★★★' + live.length + '人 残って いるのに 見せずに 決着しました');
          else {
            if (live[0].gain !== hand.lastPot) ng('★★★見せずに もらった 額が ポットと ちがいます（' + live[0].gain + ' ≠ ' + hand.lastPot + '）');
            for (i = 0; i < S.players.length; i++) if (S.players[i] !== live[0] && S.players[i].gain !== 0) ng('★★降りた 人が コインを もらいました（' + S.players[i].name + '）');
          }
          if (S.rows.length) ng('★★見せずに 決着した のに 手を 見せて います');
        }
      }
      return r;
    };

    PC.settle = function (opts) {
      var res = impl.settle.apply(this, arguments);
      if (!T || !hand) return res;
      var pl = (opts && opts.players) || [];
      if (!pl.some(function (e) { return e.hand; })) return res;       /* ★ capsNow（★「◯まで もらえる」の 計算）は 見ない */
      T.settles++;
      var i, total = 0, paid = 0, id;
      pl.forEach(function (e) { total += e.put; });
      for (id in res.payouts) if (res.payouts.hasOwnProperty(id)) paid += res.payouts[id];
      if (paid !== total) ng('★★★決着で コインが 消えた／増えた（分けた ' + paid + ' ≠ 出した ' + total + '）');
      if (res.total !== total) ng('★★決着の 合計が 出した 合計と ちがいます');
      /* ★ かけが 閉じて いるか：★降りて いない・ぜんぶ かけて いない 人は 同じ 額を 出して いる */
      var alive = S.players.filter(function (q) { return !q.folded; });
      var active = alive.filter(function (q) { return !q.allIn; });
      var maxPut = 0;
      alive.forEach(function (q) { if (q.put > maxPut) maxPut = q.put; });
      if (active.length >= 2) {
        for (i = 1; i < active.length; i++) if (active[i].put !== active[0].put) { ng('★★★かけが 合って いないのに 勝負に なりました'); break; }
      }
      if (maxPut <= 0) ng('★★だれも 出して いないのに 勝負に なりました');
      /* ★ 役の 強さ順：★自分の 判定器で もう一度 ならべる */
      var mine = {};
      alive.forEach(function (q) { mine[S.players.indexOf(q)] = myEval(q.hole); });
      var sd = res.showdown || [];
      for (i = 0; i < sd.length; i++) {
        for (var j = i + 1; j < sd.length; j++) {
          var a = sd[i], b = sd[j];
          if (!mine[a.id] || !mine[b.id]) continue;
          var want = myCompare(mine[a.id], mine[b.id]);            /* ★ 1 ＝ a が 強い */
          var got = a.place < b.place ? 1 : (a.place === b.place ? 0 : -1);
          if (want !== got) ng('★★★決着の 順位が 本物の 役の 強さ順と ちがいます（' + S.players[a.id].name + ' と ' + S.players[b.id].name + '）');
        }
      }
      /* ★ ポットは いちばん 強い 人（たち）へ */
      (res.pots || []).forEach(function (pot, k) {
        var best = null, winners = [];
        pot.eligible.forEach(function (e) {
          if (!mine[e]) return;
          var c = best ? myCompare(mine[e], best) : 1;
          if (c > 0) { best = mine[e]; winners = [e]; } else if (c === 0) winners.push(e);
        });
        var w1 = winners.slice().sort().join(','), w2 = (pot.winners || []).slice().sort().join(',');
        if (w1 !== w2) ng('★★★ポット' + (k + 1) + 'が いちばん 強い 人に 行って いません（本物 ' + w1 + '／画面 ' + w2 + '）');
      });
      /* ★ 降りた 人には 返す ぶん しか 行かない */
      var refund = {};
      (res.refunds || []).forEach(function (r) { refund[r.id] = (refund[r.id] || 0) + r.amount; });
      pl.forEach(function (e) {
        if (e.folded && (res.payouts[e.id] || 0) !== (refund[e.id] || 0)) ng('★★★降りた 人に ポットが 行きました（' + S.players[e.id].name + '）');
      });
      return res;
    };

    return {
      begin: function (tally) { T = tally; hand = null; prevDealer = -1; prevOrder = ''; },
      end: function () { T = null; },
      restore: function () {
        PC.createDeck = orig.createDeck; PC.shuffle = orig.shuffle; PC.draw = orig.draw;
        PC.evaluate = orig.evaluate; PC.settle = orig.settle;
      }
    };
  }

  function newTally() {
    return { ng: [], decks: 0, draws: 0, swapDraws: 0, swapN: [0, 0, 0, 0, 0, 0], evals: 0, settles: 0,
             hands: 0, shows: 0, folds: 0, blinds: 0, noShuffle: 0, sameDeal: 0 };
  }

  /* ============================================================
     ★ 6. ① ② ⑥ 決まりを 数える（★写しの 中で 早送り）
     ============================================================ */
  function runRules(cp, hooks, n, seed) {
    var S = cp.state, PK = cp.POKER, T = newTally();
    var err0 = S.errors.length;
    var quiet = cp.win.console.log;
    cp.win.console.log = function () {};
    hooks.begin(T);
    var out = null;
    try {
      PK.seed(seed || K.SEED_RULE);
      out = PK.autoPlay(n, { mode: 'full', cpu: 'strong' });    /* ★ 画面と 同じ 決め（★1枚きざみ・つよい）*/
    } catch (e) {
      T.ng.push('★★★早送りが 途中で 止まりました：' + String(e && e.message || e));
    } finally {
      hooks.end();
      PK.seed(null);
      cp.win.console.log = quiet;
    }
    T.out = out;
    if (out) {
      if (out['合っているか'] !== 'OK') T.ng.push('★★★checkCoins：コインの 合計が ちがいます（' + out['コイン合計'] + ' ≠ ' + out['配ったコインの合計'] + '）');
      if (out['とちゅうで止まった']) T.ng.push('★★★途中で 止まった ハンドが ' + out['とちゅうで止まった'] + '件');
      if (out['あたらしいエラー'] && out['あたらしいエラー'].length) T.ng.push('★★★game.js の 中の 見張りが 鳴りました：' + out['あたらしいエラー'].slice(0, 3).join('／'));
    }
    var newErr = S.errors.slice(err0);
    if (newErr.length) T.ng.push('★★★state.errors が ' + newErr.length + '件 増えました：' + newErr.slice(0, 2).join('／'));
    /* ★★ 下の 線 ―― ★数えて いない のに「OK」を 出さない */
    if (T.hands !== n) T.ng.push('★★★見張りが 死んで います：' + n + 'ハンド 頼んで ' + T.hands + 'ハンド しか 数えて いません');
    if (T.shows < 1) T.ng.push('★★★見張りが 死んで います：勝負まで 行った ハンドが 0');
    if (T.folds < 1) T.ng.push('★★★見張りが 死んで います：みんな 降りて 決着した ハンドが 0');
    if (T.settles !== T.shows) T.ng.push('★★★見張りが 死んで います：決着の 目が ' + T.settles + '回、勝負が ' + T.shows + '回');
    if (T.blinds !== n) T.ng.push('★★★見張りが 死んで います：小がけ・大がけを ' + T.blinds + '回 しか 見て いません');
    if (T.draws < n * K.SEATS) T.ng.push('★★★見張りが 死んで います：引く 目が ' + T.draws + '回');
    for (var k = 0; k <= K.SWAP_MAX; k++) if (!T.swapN[k]) T.ng.push('★★' + k + '枚の 取りかえが 1回も 起きて いません（★0〜5枚 自由の はず）');
    if (T.noShuffle) T.ng.push('★★★山札を 切って いません（' + T.noShuffle + '回）');
    if (T.sameDeal) T.ng.push('★★★前の ハンドと 同じ ならびの 山札（' + T.sameDeal + '回）');
    return T;
  }

  /* ============================================================
     ★ 7. ② 役の 強さ順 ―― ★★自分の 判定器と 突き合わせ
     ============================================================ */
  function runLadder(cp) {
    var PC = cp.PC, ng = [], i, j;
    var ids = (PC.HANDS || []).map(function (h) { return h.id; });
    if (ids.join(',') !== K.LADDER.join(',')) ng.push('★★★役の 強さ順が 本物と ちがいます：' + ids.join(' > '));
    for (i = 0; i < K.LADDER.length; i++) {
      var h = PC.HAND_BY_ID && PC.HAND_BY_ID[K.LADDER[i]];
      if (!h || h.rank !== 10 - i) ng.push('★★' + K.LADDER[i] + ' の 強さの 番号が ' + (10 - i) + ' ではありません');
    }
    /* ★ 画面の 一覧（★game.js が HANDS から 作る・並びに よらない）*/
    var rows = cp.doc.querySelectorAll('#ranksList [data-hand]');
    var shown = []; for (i = 0; i < rows.length; i++) shown.push(rows[i].getAttribute('data-hand'));
    if (shown.join(',') !== K.LADDER.join(',')) ng.push('★★画面の 役の 一覧が 本物の 順と ちがいます（' + shown.length + '行）');
    /* ★ 決め打ちの 見本 */
    var fixBad = 0, pairBad = 0;
    for (i = 0; i < FIX_HANDS.length; i++) {
      var r = PC.evaluate(PC.cards(FIX_HANDS[i][0]));
      var m = myEval(PC.cards(FIX_HANDS[i][0]));
      if (!r || r.id !== FIX_HANDS[i][1] || m.id !== FIX_HANDS[i][1]) { fixBad++; ng.push('★★★役の 見本が 合いません：' + FIX_HANDS[i][0] + ' → 画面 ' + (r && r.id) + '／自分 ' + m.id + '／正 ' + FIX_HANDS[i][1]); }
    }
    for (i = 0; i < FIX_PAIRS.length; i++) {
      var a = PC.cards(FIX_PAIRS[i][0]), b = PC.cards(FIX_PAIRS[i][1]);
      var g = sgn(PC.compare(a, b)), w = sgn(myCompare(myEval(a), myEval(b)));
      if (g !== FIX_PAIRS[i][2] || w !== FIX_PAIRS[i][2]) { pairBad++; ng.push('★★★くらべの 見本が 合いません：' + FIX_PAIRS[i][0] + ' vs ' + FIX_PAIRS[i][1] + ' → 画面 ' + g + '／自分 ' + w + '／正 ' + FIX_PAIRS[i][2]); }
    }
    /* ★ でたらめな 手を 3000 ―― ★役と くらべ の 両方 */
    var r1 = rng(K.SEED_RULE), deck = PC.createDeck(), catBad = 0, cmpBad = 0, cats = {};
    function five() {
      var d = deck.slice(), out = [];
      for (var k = 0; k < 5; k++) out.push(d.splice(Math.floor(r1() * d.length), 1)[0]);
      return out;
    }
    for (i = 0; i < K.RANDOM_HANDS; i++) {
      var h1 = five(), h2 = five();
      var e1 = PC.evaluate(h1), e2 = PC.evaluate(h2), m1 = myEval(h1), m2 = myEval(h2);
      cats[m1.id] = (cats[m1.id] || 0) + 1;
      if (!e1 || e1.id !== m1.id) catBad++;
      if (!e2 || e2.id !== m2.id) catBad++;
      if (sgn(PC.compare(e1, e2)) !== sgn(myCompare(m1, m2))) cmpBad++;
    }
    if (catBad) ng.push('★★★役の 判定が 自分の 判定器と ちがう 手が ' + catBad + ' / ' + (K.RANDOM_HANDS * 2));
    if (cmpBad) ng.push('★★★強さの くらべが 自分の 判定器と ちがう 組が ' + cmpBad + ' / ' + K.RANDOM_HANDS);
    /* ★★ 下の 線：★★でたらめの 中に 役が 7種類 以上 出て いる（★出て いない 役は 見て いない）*/
    var kinds = Object.keys(cats).length;
    if (kinds < 7) ng.push('★★★見張りが 死んで います：でたらめの 手に 役が ' + kinds + '種類 しか 出て いません');
    return { ng: ng, fix: FIX_HANDS.length - fixBad, fixN: FIX_HANDS.length, pair: FIX_PAIRS.length - pairBad, pairN: FIX_PAIRS.length,
             rand: K.RANDOM_HANDS, catBad: catBad, cmpBad: cmpBad, kinds: kinds };
  }

  /* ============================================================
     ★ 8. ⑤ ⑦ 場面を 作って 数える（★写しの 時計を 借りて 早送り・★画面は 描く）
     ------------------------------------------------------------
     ★ ★44px … 「44以上か」だけ。★★本物の 指（elementFromPoint）で まん中を さす。
     ★ ★ルルの 線 … ★山札の 数字を 出して いない／★捨て札が 表で 見えて いない。
     ============================================================ */
  function measureTap(doc, sel, label, out) {
    var list = doc.querySelectorAll(sel), i;
    out.seen = out.seen || {};
    for (i = 0; i < list.length; i++) {
      var el = list[i];
      if (!visible(el)) continue;
      try { el.scrollIntoView({ block: 'center', inline: 'nearest' }); } catch (e) {}
      var q = el.getBoundingClientRect();
      var w = Math.round(q.width * 10) / 10, h = Math.round(q.height * 10) / 10;
      out.n++;
      out.min = Math.min(out.min, w, h);
      /* ★ 同じ もの（同じ 名前・同じ 大きさ）は 場面が 変わっても 1度だけ 数える（★数を 水増し しない）*/
      var key = nameOf(el) + ' ' + w + '×' + h;
      if (Math.min(w, h) < K.TAP - 0.5 && !out.seen['s' + key]) { out.seen['s' + key] = 1; out.small.push(label + ' ' + key); }
      var hit = doc.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2);
      if (!hit || !(hit === el || el.contains(hit))) {
        var who = hit ? '（当たったのは ' + nameOf(hit) + '）' : '（何にも 当たらない）';
        if (!out.seen['m' + key]) { out.seen['m' + key] = 1; out.miss.push(label + ' ' + nameOf(el) + ' ' + w + '×' + h + who); }
      }
    }
  }
  function leakCheck(cp, out) {
    var doc = cp.doc, S = cp.state, i;
    /* ★ 山札の 数字 */
    var walker = doc.createTreeWalker(doc.body, 4 /* TEXT */);
    var re = /山札[^\d\n]{0,8}\d+|のこり\s*\d+\s*枚|\d+\s*枚[^\n]{0,4}(のこ|残)/;
    var n;
    while ((n = walker.nextNode())) {
      var t = n.nodeValue.replace(/\s+/g, ' ');
      if (!re.test(t)) continue;
      var el = n.parentElement;
      if (el && el.closest && el.closest('#tableLog')) continue;     /* ★ 実況の 文は 見ない（★数字は 出して いない）*/
      if (visible(el)) out.deckNum.push(t.trim().slice(0, 30));
    }
    /* ★ 捨て札が 表 */
    if (S.discardKeys.length) {
      out.sawDiscards++;
      var file = {};
      cp.PC.createDeck().forEach(function (c) { file[c.key] = c.file; });
      for (i = 0; i < S.discardKeys.length; i++) {
        var key = S.discardKeys[i], f = file[key];
        var els = doc.querySelectorAll('.card[data-key="' + key + '"]');
        var j;
        for (j = 0; j < els.length; j++) if (visible(els[j])) { out.faceUp.push(key); break; }
        var imgs = doc.querySelectorAll('img[src]');
        for (j = 0; j < imgs.length; j++) {
          var src = '';
          try { src = decodeURIComponent(imgs[j].getAttribute('src')); } catch (e) { src = imgs[j].getAttribute('src'); }
          if (f && src.indexOf(f + '.png') >= 0 && visible(imgs[j])) { out.faceUp.push(key); break; }
        }
      }
    }
  }
  /* ============================================================
     ★★★ ⑨ ハッピーの ことばが、いまの 場面と 合っているか（★T248・新しい 目）
     ------------------------------------------------------------
     ★★ なぜ 足したか：かけの 番なのに ハッピーが「いらない札は どれかな？」＝
        ★ 取りかえの ことばを 言って いた（★かけ①の 96.8%・871回中「かける」ことば 0回）。
        ★★ 見張り 31個は 1つも 鳴らず、★★★社長の 目（写真）だけが 見つけました（3度目）。
     ★★ 何を 見るか（★ことばの 好みでは ない・★機械で 決まる こと 1つだけ）：
        ★★★「ハッピーが 遊ぶ人に 求めて いる 行いが、★いま その 画面で できるか」。
        ★ ・札を えらぶ／すてる／のこす を 求めて いる → ★取りかえの 番（手札が 押せる）でなければ NG
        ★ ・いくら かけるかを 聞いて いる         → ★かけの 番（かけの ボタンが ある）でなければ NG
     ★★ 見る 場面は 5つ：かけ①・★★ロボットの かけ・取りかえ・かけ②・決着。
        ★ ★「ロボットの かけ」を 足したのは T248 の 2度目の 直しです ―― ★★はじめは 見て おらず、
        ★ ★★「コインを いくら かける？」が ロボットの 番にも 出て いた のを 見のがして いました
        ★ （★25ハンドで 58回【実測】）。★★★見張りの 穴は、見張りを 作った 私が 作りました。
     ★★ 見ない こと（★正直に）：ことばの 上手・下手、言いすぎ（同じ ことを 2度 言う）は 見ません。
        ★ 「相手の 取りかえ枚数も 見てみよう」は "見る" 行いなので、この 目では 鳴りません
        ★ （★あれは §5.5「説明を 足すな」の 話で、★場面ちがいでは ない）。
     ★★ ヨット ⑲「ロボットの 手番なのに 人への 指図を していないか」の 兄弟です。
     ============================================================ */
  /* ★ 札を どうこうする ことを 遊ぶ人に 求める ことば（★「だれが 何枚 かえるかな」＝
       ロボットの 話は 入れない。★「どんなカード？」＝ 行いを 求めて いないので 入れない）*/
  var ASK_CARD = /いらない札|どれをのこす|のこす|のこそう|すてたら|すてよう|すてる|すててね|えらんで|取りかえよう/;
  /* ★ 遊ぶ人に「いくら かける？」と 聞く ことば。
     ★ ★聞く 形（？で 終わる・〜てね・〜よう）だけを 見る ―― ★★「だれが いくら かけるかな」＝
     ★ ロボットの 話は 入れない（★「だれが 何枚 かえるかな」を ASK_CARD に 入れないのと 同じ 線）。
     ★ 「やったー！ コイン 15枚！」＝ 結果の 報告も 入らない。 */
  var ASK_BET  = /かける[？?]|かけよう|かけてね|かけますか/;
  /* ★★★ T250 ⑨-b の 逃げ道（★ただ 1つ）：★かけ①の「やった！ 強い手だ！」。
     ★ ★社長の お決めで **そのまま 残す** と 決まって いる 1行（★かけ① 32回中 4回【T250 実測】）。
     ★ ★★ここに 書いて いない ことばが かけの 番に 出たら、★★★それは 鳴らせる。 */
  var BET_OK   = /^やった！強い手だ！$/;

  /* ★ ふきだしが 画面に 出て いなければ ならない 場面（★遊ぶ人が 押す 番）。
     ★ 決着・ロボットの 取りかえ は「出て いなくても よい」 ―― ★実際、決着では ハッピーの 行ごと
     ★ しまわれる（style.css `body:has(.showdown:not(.hidden)) .log-row{display:none}`）。
     ★★ そこを 見張りの 死と 数えると「たまに 鳴る 見張り」に なる（★ハーツ ㉜ の 教え）。 */
  var HAPPY_MUST = ['かけ①', '取りかえ', 'かけ②', 'ロボットの かけ'];

  function happyCheck(cp, tag, out) {
    var doc = cp.doc, S = cp.state;
    var el = doc.querySelector('#happyBubble');
    var t = (el && visible(el)) ? (el.textContent || '').replace(/\s+/g, '') : '';
    if (!t) {
      var why = tag + (el ? '（ふきだしが 見えません）' : '（ふきだしが ありません）');
      if (HAPPY_MUST.indexOf(tag) >= 0) out.happyDead.push(why);
      else out.happyHidden.push(why);
      return;
    }
    if (out.happySeen.indexOf(tag) < 0) out.happySeen.push(tag);
    out.happyWords.push(tag + '「' + t + '」');
    /* ★★★ T250：★★この 目が「人が 遊ぶ 速さ」を 歩いて いる ことを、★毎回 その場で 証す。
       ★ ・S.fast が 立って いたら → ★★早送りの 道。★人が 1度も 通らない 道で 見て いる。
       ★ ・めくりの 一言（flashHappy）を 1度も 見なかったら → ★★★同じく 早送りの 道
       ★   （`game.js` 475行 `if (state.fast) { advanceAfterMySwap(); return; }` が
       ★    ★★引いた札の めくりを 飛ばす ＝ flashHappy が 1度も 立たない）。
       ★ ★★これを 書かなかった せいで、★T248 の 私の 数「かけ② 94.0%」は
       ★  ★★★人が 1度も 通らない 道の 数に なって いました（トライ T249 §E-2・★道具の うそ 5度目）。*/
    if (S.fast) out.happyFast.push(tag);
    if (S.flashHappy) out.happyFlash.push(tag);
    /* ★ いま できる ことを、★画面から 読む（★state の 旗と、★本当に 押す ものが ある か の 両方）*/
    var canSwap = !!(S.awaitSwap && visible(doc.querySelector('#swapPanel #btnSwap')));
    var canBet  = !!(S.awaitMe && (function () {
      var b = doc.querySelectorAll('#actButtons .act-btn'), i;
      for (i = 0; i < b.length; i++) if (visible(b[i])) return true;
      return false;
    })());
    if (ASK_CARD.test(t) && !canSwap) {
      out.happyBad.push('（' + tag + '）「' + t + '」…… ★札を えらぶ ことを 言って いますが、いま 手札は えらべません');
    }
    if (ASK_BET.test(t) && !canBet) {
      out.happyBad.push('（' + tag + '）「' + t + '」…… ★いくら かけるかを 聞いて いますが、いま かけの ボタンが ありません');
    }
    /* ★★★ T250 ⑨-b（★新しい 線・★裏返しの 目）
       ------------------------------------------------------------
       ★★ なぜ 足したか：★T248 の ⑨ は「★できない ことを 求めて いないか」だけを 見て いました。
       ★  ★★だから かけ②で「ワンペアに なった！」が 出ていても 鳴りませんでした
       ★  ―― ★★★何も 求めて いない ので、目の 範囲の 外だったからです（トライ T249 §A-2）。
       ★  ★★★見つけたのは 見張りでは なく、★トライが 指で 18回 遊んだ 数（かけ②の かけの ことば 0回）でした。
       ★★ 足す 線：★★「かけの 番（★人が 押す かけの ボタンが 本当に 見えて いる）なら、
       ★  ★★★ふきだしは かけの ことばを 1つ 言って いなければ ならない」。
       ★★ 逃げ道は 1つだけ（BET_OK）―― ★社長の お決めの「やった！ 強い手だ！」。
       ★★ これは 好みの 話では ありません：★★押す ボタンが 目の前に あるのに、
       ★  ★★★ふきだしが その ボタンの 話を して いない、という 機械で 分かる ずれ です。 */
    if (canBet && !ASK_BET.test(t) && !BET_OK.test(t)) {
      out.happyBad.push('（' + tag + '）「' + t + '」…… ★かけの 番で かけの ボタンが 出て いるのに、かけの ことばを 1つも 言って いません（★T250）');
    }
  }

  function badgeCheck(cp, out) {
    var S = cp.state, doc = cp.doc;
    var want = S.players.filter(function (p) { return p.swapCount != null; }).length;
    var re = /(\d\s*枚\s*取りかえた|取りかえなかった|取りかえ\s*\d\s*枚)/;
    var all = doc.querySelectorAll('body *'), got = 0, i;
    for (i = 0; i < all.length; i++) {
      var own = '';
      for (var c = all[i].firstChild; c; c = c.nextSibling) if (c.nodeType === 3) own += c.nodeValue;
      if (!re.test(own)) continue;
      if (all[i].closest && (all[i].closest('#tableLog') || all[i].closest('#showdownBox'))) continue;
      if (visible(all[i])) got++;
    }
    out.badgeWant = want; out.badgeGot = got;
  }

  function runScene(cp, seed) {
    var W = cp.win, D = cp.doc, S = cp.state, PK = cp.POKER;
    var out = { ng: [], tap: { n: 0, min: 999, small: [], miss: [] }, leak: { deckNum: [], faceUp: [], sawDiscards: 0 },
                scenes: [], picks: 0, steps: 0, badgeWant: 0, badgeGot: 0,
                /* ★ T248 ⑨ ハッピーの ことば */
                happySeen: [], happyWords: [], happyBad: [], happyDead: [], happyHidden: [],
                /* ★ T250：★この 目が 早送りの 道を 歩いて いないかの 証し */
                happyFast: [], happyFlash: [] };
    /* ★ 写しの 時計を 借りる（★写しは おわりに 消える ので、本物には 触らない）*/
    var realST = W.setTimeout, realCT = W.clearTimeout, q = [], seq = 0, now = 0;
    W.setTimeout = function (f, ms) { var id = ++seq; q.push({ id: id, f: f, t: now + (ms || 0), s: id }); return id; };
    W.clearTimeout = function (id) { for (var i = 0; i < q.length; i++) if (q[i].id === id) { q.splice(i, 1); return; } };
    function pumpOne() {
      if (!q.length) return false;
      var b = 0;
      for (var i = 1; i < q.length; i++) if (q[i].t < q[b].t || (q[i].t === q[b].t && q[i].s < q[b].s)) b = i;
      var job = q.splice(b, 1)[0];
      now = job.t;
      try { job.f(); } catch (e) { out.ng.push('★★★場面の 中で こけました：' + String(e && e.message || e)); }
      return true;
    }
    function tapAct(act) {
      var b = D.querySelector('#actButtons .act-btn[data-act="' + act + '"]');
      if (!b) return false;
      b.click(); return true;
    }
    var err0 = S.errors.length, had = {};
    try {
      /* ★ 同じ 種で 同じ 場面が 出る ように、★親・コイン・降り率の 覚え書きを そろえる（★写しの 中だけ）*/
      S.dealer = K.SEATS - 1;
      S.pot = 0;
      S.players.forEach(function (p) { p.coins = K.START; p.put = 0; p.bet = 0; });
      S.injected = K.SEATS * K.START;
      S.foldStats = S.players.map(function () { return { hands: 0, folds: 0 }; });
      PK.seed(seed || K.SEED_SCENE);
      S.fast = false;
      PK.play();
      var guard = 0;
      while (guard++ < 600) {
        out.steps++;
        if (S.phase === 'bet' && S.awaitMe) {
          var tag = S.street === 0 ? 'かけ①' : 'かけ②';
          if (!had[tag]) {
            had[tag] = 1; out.scenes.push(tag);
            measureTap(D, '#actButtons .act-btn', tag, out.tap);
            measureTap(D, '#btnRanks', tag, out.tap);
            measureTap(D, '.topbar .back', tag, out.tap);
            if (tag === 'かけ①' && tapAct('raise')) {           /* ★ レイズの 小さい 窓も 押す もの */
              measureTap(D, '#raisePanel .step-btn, #raisePanel .raise-ok, #raiseInput', 'レイズ窓', out.tap);
              tapAct('raise');                                    /* ★ もう一度 押して 閉じる */
            }
            leakCheck(cp, out.leak);
            happyCheck(cp, tag, out);                             /* ★ T248 ⑨ */
            if (tag === 'かけ②') badgeCheck(cp, out);
          }
          if (!tapAct('call') && !tapAct('check') && !tapAct('allin')) { out.ng.push('★★★かけの ボタンが 押せません（' + tag + '）'); break; }
          continue;
        }
        if (S.phase === 'swap' && S.awaitSwap) {
          if (!had.swap) {
            had.swap = 1; out.scenes.push('取りかえ');
            measureTap(D, '#hand .card[data-key]', '取りかえ', out.tap);
            measureTap(D, '#swapPanel .swap-btn', '取りかえ', out.tap);
            leakCheck(cp, out.leak);
            happyCheck(cp, '取りかえ', out);                       /* ★ T248 ⑨（★えらぶ 前）*/
            /* ★ 札を 2枚 えらぶ → 青（is-pick）が 2枚
               ⚠️★ 1枚 押す たびに `render()` が 手札を 作り直す ので、★★2枚目は 押す 直前に 取り直す
                  ★ ★（★ルル T245 §G-1 が 踏んだ 穴。★私も 最初 同じ 所で 落ちました）*/
            var c1 = D.querySelector('#hand .card[data-key]');
            if (c1) c1.click();
            var c2 = D.querySelectorAll('#hand .card[data-key]:not(.is-pick)')[0];
            if (c2) c2.click();
            out.picks = D.querySelectorAll('#hand .card.is-pick').length;
            if (out.picks !== 2 || S.selected.length !== 2) out.ng.push('★★★札を 2枚 えらんだ のに えらばれて いません（画面 ' + out.picks + '枚・中 ' + S.selected.length + '枚）');
          }
          var sb = D.querySelector('#swapPanel #btnSwap');
          if (!sb) { out.ng.push('★★★取りかえの ボタンが ありません'); break; }
          sb.click();
          continue;
        }
        if (S.phase === 'end' || S.phase === 'over') {
          out.scenes.push('決着');
          measureTap(D, '#btnNextHand, #btnRestart', '決着', out.tap);
          leakCheck(cp, out.leak);
          happyCheck(cp, '決着', out);                             /* ★ T248 ⑨ */
          break;
        }
        /* ★ T248 ⑨：ロボットが かけて いる あいだ ―― ★人が 押す ものは 1つも ない 場面
           （game.js `renderActions`：`if (!state.awaitMe) box.innerHTML = ''`）。
           ★★ ここを 見て いなかった ので、★「かけの ことば」が ロボットの 番にも 出て いる のを
           ★ 見のがして いました（★25ハンドで 58回・T248 で 実測して 直した）。 */
        if (S.phase === 'bet' && !S.awaitMe && !had.botBet) {
          had.botBet = 1; out.scenes.push('ロボットの かけ');
          happyCheck(cp, 'ロボットの かけ', out);
        }
        if (S.phase === 'swap' && S.discardKeys.length && !had.leakMid) {
          had.leakMid = 1; leakCheck(cp, out.leak);
          /* ★ T248 ⑨：ロボットが 取りかえて いる あいだ ―― ★人は 何も できない 場面。
             ★ ここで 人に 指図して いたら、それは 場面ちがい（★ヨット ⑲ と 同じ 目）*/
          happyCheck(cp, 'ロボットの 取りかえ', out);
        }
        if (!pumpOne()) { out.ng.push('★★★場面が 進まなく なりました（' + S.phase + '）'); break; }
      }
    } catch (e) {
      out.ng.push('★★★場面を 作る 途中で こけました：' + String(e && e.message || e));
    } finally {
      W.setTimeout = realST; W.clearTimeout = realCT; q.length = 0;
      PK.seed(null);
    }
    /* ★★ 下の 線 ―― ★場面が 作れて いなければ、この 目は 何も 見て いません */
    ['かけ①', '取りかえ', 'かけ②', '決着'].forEach(function (s) {
      if (out.scenes.indexOf(s) < 0) out.ng.push('★★★見張りが 死んで います：「' + s + '」の 場面が 作れません でした（種 ' + (seed || K.SEED_SCENE) + '）');
    });
    if (out.tap.n < 6) out.ng.push('★★★見張りが 死んで います：押す ものを ' + out.tap.n + '個 しか 測れて いません');
    if (out.leak.sawDiscards < 1) out.ng.push('★★★見張りが 死んで います：捨て札の ある 場面を 1度も 見て いません');
    /* ★ T248 ⑨ の 下の 線 ―― ★ふきだしを 読めて いなければ、この 目は 何も 見て いません */
    if (out.happyDead.length) out.ng.push('★★★見張りが 死んで います：ハッピーの ふきだしを 読めません（' + out.happyDead.join('／') + '）');
    /* ★★★ T250 の 下の 線 ―― ★★「人が 遊ぶ 速さの 道を 歩いた か」*/
    if (out.happyFast.length) {
      out.ng.push('★★★★見張りが 死んで います：★早送り（state.fast）の 道で ハッピーを 見て います（' + out.happyFast.join('／') + '）―― ★人が 1度も 通らない 道です（T250）');
    }
    if (out.scenes.indexOf('かけ②') >= 0 && !out.happyFlash.length) {
      out.ng.push('★★★★見張りが 死んで います：★引いた札の めくりを 1度も 通って いません（★めくりの 一言が 1度も 立ちません）―― ★★早送りの 道を 歩いて います（T250）');
    }
    HAPPY_MUST.forEach(function (s) {
      if (out.scenes.indexOf(s) >= 0 && out.happySeen.indexOf(s) < 0) {
        out.ng.push('★★★見張りが 死んで います：「' + s + '」で ハッピーの ことばを 1度も 読んで いません');
      }
    });
    /* ★★ 上の 線 */
    out.happyBad.forEach(function (s) {
      out.ng.push('★★★ハッピーの ことばが 場面と 合って いません：' + s + '（★T248・社長のご指摘 T246-4 §9-7）');
    });
    out.tap.small.forEach(function (s) { out.ng.push('★★押す ものが 44px を 割って います：' + s + '（★T122 の 会社の 線）'); });
    out.tap.miss.forEach(function (s) { out.ng.push('★★★まん中を さしても 当たりません：' + s); });
    if (out.leak.deckNum.length) out.ng.push('★★★山札の 残り枚数が 画面に 出て います：「' + out.leak.deckNum.join('」「') + '」（★ルル T245 §D-1）');
    if (out.leak.faceUp.length) out.ng.push('★★★捨て札が 表で 見えて います：' + out.leak.faceUp.join('・') + '（★ルル T245 §D-2）');
    if (out.badgeWant && out.badgeGot < out.badgeWant) out.ng.push('★★取りかえ 枚数の 印が 足りません（' + out.badgeGot + ' / ' + out.badgeWant + '人）―― ★ドローの ただ 1つの 公開情報（T47 §6-5）');
    var newErr = S.errors.slice(err0);
    if (newErr.length) out.ng.push('★★★場面の 中で state.errors が 増えました：' + newErr.slice(0, 2).join('／'));
    return out;
  }

  /* ============================================================
     ★ 9. わざと 壊して、鳴る ことを 見せる（★型の ④）―― ★★壊すのは 写し
     ============================================================ */
  function runBreaks(cp, hooks) {
    var S = cp.state, PC = cp.PC, impl = cp.impl, orig = cp.orig, W = cp.win, D = cp.doc;
    var kill = [], killOk = 0, killN = 0;
    function one(name, re, doIt, undoIt, how) {
      killN++;
      var rang = false, got = [];
      try {
        doIt();
        got = how();
        rang = got.some(function (m) { return re.test(m); });
      } catch (e) { got = ['こけた：' + String(e && e.message || e)]; rang = false; }
      try { undoIt(); } catch (e2) {}
      if (rang) killOk++;
      kill.push(name + ' … ' + (rang ? '○ 鳴った' : '★★鳴らない（' + got.slice(0, 2).join('／').slice(0, 120) + '）'));
    }
    function rules(n, seed) { return runRules(cp, hooks, n || 8, seed || 4242).ng; }
    function withDraw(fn) { return function () { impl.draw = fn; }; }
    var resetDraw = function () { impl.draw = orig.draw; };

    /* ★ 山札 */
    one('(1)山札を 53枚に する（同じ 札を 1枚 足す）', /52枚|4マーク/,
        function () { impl.createDeck = function () { var d = orig.createDeck(); d.push(d[0]); return d; }; },
        function () { impl.createDeck = orig.createDeck; }, rules);
    one('(2)ジョーカーを 混ぜる', /ジョーカー|52枚/,
        function () { impl.createDeck = function () { return orig.createDeck({ jokers: 1 }); }; },
        function () { impl.createDeck = orig.createDeck; }, rules);
    one('(3)1枚 抜いて 51枚に する', /52枚|4マーク/,
        function () { impl.createDeck = function () { var d = orig.createDeck(); d.pop(); return d; }; },
        function () { impl.createDeck = orig.createDeck; }, rules);
    one('(4)山札を 切らない', /切って いません|同じ ならび/,
        function () { impl.shuffle = function (a) { return a; }; },
        function () { impl.shuffle = orig.shuffle; }, rules);
    one('(5)切る ときに 1枚 すり替える', /前と ちがう 札|52枚/,
        function () { impl.shuffle = function (a, r) { var o = orig.shuffle(a, r); o[0] = o[1]; return o; }; },
        function () { impl.shuffle = orig.shuffle; }, rules);
    /* ★ 配り・取りかえ */
    one('(6)取りかえで 1枚 多く 引く', /5枚 ではありません|52枚に なりません|多く 引き/,
        withDraw(function (deck, n) { return orig.draw(deck, S.phase === 'swap' && n > 0 && n < 5 ? n + 1 : n); }),
        resetDraw, rules);
    one('(7)捨てた 札を 山に もどす', /もどって きました|同じ 札を 2回|52枚/,
        withDraw(function (deck, n) {
          var o = orig.draw(deck, n);
          if (S.phase === 'swap' && n > 0 && S.discardKeys.length) {
            var k = S.discardKeys[0];
            var d = orig.createDeck().filter(function (c) { return c.key === k; })[0];
            if (d) o[0] = d;
          }
          return o;
        }), resetDraw, rules);
    one('(8)配る ときに 6枚 わたす', /5枚 ではありません|32枚/,
        withDraw(function (deck, n) { return orig.draw(deck, S.phase === 'swap' ? n : 6); }),
        resetDraw, rules);
    one('(9)山札から こっそり 1枚 抜く', /52枚に なりません|32枚/,
        withDraw(function (deck, n) { var o = orig.draw(deck, n); if (S.phase !== 'swap' && deck.length === 37) deck.pop(); return o; }),
        resetDraw, rules);
    one('(10)取りかえを 1人 飛ばす', /取りかえないまま|印が 足りません/,
        withDraw(function (deck, n) {
          if (S.phase === 'swap') { var p = S.players[(S.turn + 1) % K.SEATS]; if (!p.folded && !p.swapped) p.swapped = true; }
          return orig.draw(deck, n);
        }), resetDraw, rules);
    /* ★ かけ */
    one('(11)親を 動かさない', /親が 1つ ずれて/,
        function () { impl.createDeck = function () { if (S.handNo > 1) S.dealer = (S.dealer + K.SEATS - 1) % K.SEATS; return orig.createDeck(); }; },
        function () { impl.createDeck = orig.createDeck; }, rules);
    one('(12)大がけを 5に する', /大がけが 10|最初の ポット/,
        function () {
          var seen = -1;
          impl.evaluate = function (x) {
            if (S.phase === 'bet' && S.street === 0 && S.handNo !== seen) {
              seen = S.handNo;
              var bb = S.players[(S.dealer + 2) % K.SEATS];
              if (bb.put === 10) { bb.put -= 5; bb.bet -= 5; bb.coins += 5; S.pot -= 5; S.toCall = 5; }
            }
            return orig.evaluate(x);
          };
        },
        function () { impl.evaluate = orig.evaluate; }, rules);
    one('(13)かけ②で 1人だけ 1枚 多く 出す', /かけが 合って いない|コインが 消えた|出した 合計/,
        function () {
          var seen = -1;
          impl.evaluate = function (x) {
            if (S.phase === 'bet' && S.street === 1 && S.handNo !== seen) {
              seen = S.handNo;
              var p = S.players.filter(function (q) { return !q.folded && !q.allIn && q.coins > 0; })[0];
              if (p) { p.put += 1; p.coins -= 1; S.pot += 1; }
            }
            return orig.evaluate(x);
          };
        },
        function () { impl.evaluate = orig.evaluate; }, rules);
    /* ★ 決着 */
    one('(14)勝った 人の 取り分を 1枚 減らす', /消えた|ちがいます/,
        function () { impl.settle = function (o) { var r = orig.settle(o); if (r.showdown && r.showdown.length) { var w = r.showdown[0].id; if (r.payouts[w] > 0) { r.payouts[w] -= 1; } } return r; }; },
        function () { impl.settle = orig.settle; }, rules);
    one('(15)ポットを いちばん 弱い 人に わたす', /いちばん 強い 人|順位|降りた 人に/,
        function () {
          impl.settle = function (o) {
            var r = orig.settle(o);
            if (r.showdown && r.showdown.length >= 2) {
              var top = r.showdown[0].id, low = r.showdown[r.showdown.length - 1].id;
              var t = r.payouts[top] || 0; r.payouts[top] = r.payouts[low] || 0; r.payouts[low] = t;
              r.pots.forEach(function (p) { p.winners = p.winners.map(function (w) { return w === top ? low : (w === low ? top : w); }); });
              r.showdown.forEach(function (s, i) { s.place = r.showdown.length - i; });
            }
            return r;
          };
        },
        function () { impl.settle = orig.settle; }, rules);
    one('(16)降りた 人にも 1枚 わたす', /降りた 人に|消えた|ちがいます/,
        function () {
          impl.settle = function (o) {
            var r = orig.settle(o);
            var f = o.players.filter(function (e) { return e.folded; })[0];
            if (f && r.showdown && r.showdown.length) { r.payouts[f.id] = (r.payouts[f.id] || 0) + 1; r.payouts[r.showdown[0].id] -= 1; }
            return r;
          };
        },
        function () { impl.settle = orig.settle; }, rules);
    /* ★ 役の 強さ順 */
    one('(17)フラッシュと ストレートの 役を 入れかえる', /判定が|くらべが|見本が/,
        function () {
          impl.evaluate = function (x) {
            var r = orig.evaluate(x);
            if (r && (r.id === 'flush' || r.id === 'straight')) {
              var c = {}; for (var k in r) c[k] = r[k];
              c.score = r.score.slice(); c.score[0] = r.id === 'flush' ? 5 : 6;
              c.id = r.id === 'flush' ? 'straight' : 'flush'; c.rank = c.score[0];
              return c;
            }
            return r;
          };
        },
        function () { impl.evaluate = orig.evaluate; },
        function () { return runLadder(cp).ng; });
    var HANDS0 = PC.HANDS.slice();
    one('(18)役の 一覧の 順を 入れかえる', /強さ順が 本物と|強さの 番号/,
        function () { var t = PC.HANDS[4]; PC.HANDS[4] = PC.HANDS[5]; PC.HANDS[5] = t; },
        function () { for (var i = 0; i < HANDS0.length; i++) PC.HANDS[i] = HANDS0[i]; },
        function () { return runLadder(cp).ng; });
    /* ★ 場面（★44px・ルルの 線）*/
    var st19 = D.createElement('style');
    one('(19)かけの ボタンを 44px より 低く する', /44px を 割って/,
        function () { st19.textContent = 'html body #actButtons .act-btn{height:30px !important;min-height:0 !important;padding:0 !important;}'; D.head.appendChild(st19); },
        function () { if (st19.parentNode) st19.parentNode.removeChild(st19); },
        function () { return runScene(cp).ng; });
    var st20 = D.createElement('style');
    one('(20)取りかえの ボタンの 上に ふたを 置く', /当たりません/,
        function () { st20.textContent = 'html body #swapPanel::after{content:"";position:absolute;inset:0;z-index:99;background:transparent;} html body #swapPanel{position:relative;}'; D.head.appendChild(st20); },
        function () { if (st20.parentNode) st20.parentNode.removeChild(st20); },
        function () { return runScene(cp).ng; });
    var sp21 = D.createElement('p');
    one('(21)山札の 残り枚数を 画面に 出す', /残り枚数が 画面に/,
        function () { sp21.textContent = '山札 のこり 32枚'; D.body.appendChild(sp21); },
        function () { if (sp21.parentNode) sp21.parentNode.removeChild(sp21); },
        function () { return runScene(cp).ng; });
    var im22 = D.createElement('img'), old22 = null;
    one('(22)捨て札を 表で 見せる', /捨て札が 表/,
        function () {
          /* ★ 捨てた 札の 絵を 1枚、写しの 画面に 置く（★どの 札かは 場面が 決める）*/
          old22 = impl.draw;
          impl.draw = function (deck, n) {
            var o = orig.draw(deck, n);
            if (S.phase === 'swap' && S.discardKeys.length && !im22.parentNode) {
              var f = orig.createDeck().filter(function (c) { return c.key === S.discardKeys[0]; })[0];
              if (f) { im22.src = '../cards/' + encodeURIComponent(f.file) + '.png'; im22.style.cssText = 'width:40px;height:60px;'; D.body.appendChild(im22); }
            }
            return o;
          };
        },
        function () { impl.draw = old22 || orig.draw; if (im22.parentNode) im22.parentNode.removeChild(im22); },
        function () { return runScene(cp).ng; });
    var st23 = D.createElement('style');
    one('(23)取りかえ 枚数の 印を 消す', /印が 足りません/,
        function () { st23.textContent = 'html body .seat-swap, html body .me-tag{display:none !important;}'; D.head.appendChild(st23); },
        function () { if (st23.parentNode) st23.parentNode.removeChild(st23); },
        function () { return runScene(cp).ng; });
    /* ★★★ T248：ハッピーの ことば（⑨）
       ★ 壊し方 ―― ★写しの `document.getElementById` を すり替えて、game.js の 書きこみ先だけを
         ★★ 画面に 出ない 影の ふだに 向ける。★★★画面の ふきだしは 私が 入れた ことばのまま 残る。
       ★ ＝ ★★遊ぶ人が 本当に 見る 絵が「場面ちがいの ことば」に なる（★見張りの 入り口を だます のでは ない）。 */
    var gei0 = null, deco = null;
    function sayWrong(words) {
      return function () {
        var bub = D.querySelector('#happyBubble');
        deco = D.createElement('p');                 /* ★ game.js は こちらに 書く（★画面には 出ない）*/
        gei0 = D.getElementById;
        D.getElementById = function (id) { return id === 'happyBubble' ? deco : gei0.call(D, id); };
        if (bub) bub.textContent = words;
      };
    }
    function sayBack() { if (gei0) { D.getElementById = gei0; gei0 = null; } deco = null; }
    /* ★ 見分けが つく ように、★3つとも「どの 場面で 鳴ったか」まで 見る（★ただ 鳴れば よい では ない）*/
    one('(31)★かけ①に「いらない札は どれかな？」と 言わせる（★★社長が 写真で 見つけた 形）', /（かけ①）[^]*手札は えらべません/,
        sayWrong('いらない札は どれかな？'), sayBack,
        function () { return runScene(cp).ng; });
    one('(32)★取りかえの 番に「コインを いくら かける？」と 言わせる', /（取りかえ）[^]*かけの ボタンが ありません/,
        sayWrong('コインを いくら かける？'), sayBack,
        function () { return runScene(cp).ng; });
    one('(34)★ロボットが かけて いる あいだ に「コインを いくら かける？」と 言わせる', /ロボットの かけ[^]*かけの ボタンが ありません/,
        sayWrong('コインを いくら かける？'), sayBack,
        function () { return runScene(cp).ng; });
    /* ★★★ T250：★★トライが 指で 見つけた 形 そのものを、★見張りが 鳴らせるか
       ★ （★かけ②の 番なのに、ふきだしが 取りかえの 結果しか 言って いない）*/
    one('(35)★★かけ②に「ワンペアに なった！」だけ 言わせる（★★★トライが 指で 見つけた 形）', /（かけ②）[^]*かけの ことばを 1つも 言って いません/,
        sayWrong('ワンペアに なった！'), sayBack,
        function () { return runScene(cp).ng; });
    one('(36)★かけ①に「うーん、こなかったか…」だけ 言わせる', /（かけ①）[^]*かけの ことばを 1つも 言って いません/,
        sayWrong('うーん、こなかったか…'), sayBack,
        function () { return runScene(cp).ng; });
    /* ★★★ T250：★★★見張り 自身が「人が 遊ぶ 速さの 道」を 歩いて いるかの 下の 線。
       ★ ★写しの 中だけで 早送りの 旗を 立てて、★★見張りが「私は 早送りの 道に いる」と 気づくか。 */
    var fast37 = null;
    one('(37)★★見張りを 早送り（state.fast）の 道に 落とす（★★★T248 の 私の まちがい そのもの）', /早送り[^]*道で ハッピーを 見て います|めくりを 1度も 通って いません/,
        function () { fast37 = impl.draw; impl.draw = function (deck, n) { S.fast = true; return orig.draw(deck, n); }; },
        function () { impl.draw = fast37 || orig.draw; S.fast = false; },
        function () { return runScene(cp).ng; });
    var st33 = D.createElement('style');
    one('(33)★ハッピーの ふきだしを 隠す（★⑨ の 目が 死んだ ことに 気づくか）', /ふきだしを 読めません/,
        function () { st33.textContent = 'html body #happyBubble{display:none !important;}'; D.head.appendChild(st33); },
        function () { if (st33.parentNode) st33.parentNode.removeChild(st33); },
        function () { return runScene(cp).ng; });
    /* ★ 通信・エラー */
    var sc24 = D.createElement('script');
    one('(24)外の 住所を 置く（★読みには 行かない 形）', /外の 住所/,
        function () { sc24.type = 'text/plain'; sc24.src = 'https://example.invalid/x.js'; D.body.appendChild(sc24); },
        function () { if (sc24.parentNode) sc24.parentNode.removeChild(sc24); },
        function () { var f = foreignInDom(D); return f.length ? ['★★★外の 住所が 置いて あります：' + f.join('・')] : []; });
    one('(25)fetch を 1回 呼ぶ（★下は 何も 送らない 形）', /通信の 口/,
        function () { cp.net.impl.fetch = function () { return Promise.resolve({ ok: true }); }; W.fetch('https://example.invalid/'); },
        function () { cp.net.impl.fetch = cp.netFetch0; cp.net.counts.fetch = 0; },
        function () { return cp.net.total() ? ['★★★通信の 口を ' + cp.net.total() + '回 呼びました'] : []; });
    one('(26)走って いる 最中に エラーを 1つ 置く', /state\.errors|game\.js の 中の 見張り/,
        function () { impl.createDeck = function () { S.errors.push('わざと'); return orig.createDeck(); }; },
        function () { impl.createDeck = orig.createDeck; for (var i = S.errors.length - 1; i >= 0; i--) if (S.errors[i] === 'わざと') S.errors.splice(i, 1); },
        function () { return rules(2); });
    one('(27)写しの 中で 例外を 投げる', /error: わざと/,
        function () { W.dispatchEvent(new W.ErrorEvent('error', { message: 'わざと' })); },
        function () { cp.err.list.length = 0; },
        function () { return cp.err.list.slice(); });
    /* ★ ㉜（★見張り自身）*/
    var st28 = document.createElement('style');
    one('(28)本物に <style> を 置き忘れる', /style の 数/,
        function () { document.head.appendChild(st28); },
        function () { if (st28.parentNode) st28.parentNode.removeChild(st28); },
        function () { return snapDiff(cp.snap0, topSnap()); });
    var if29 = document.createElement('iframe');
    one('(29)本物に 写しを 消し忘れる', /iframe の 数|bodyの 子/,
        function () { if29.style.cssText = 'display:none'; document.body.appendChild(if29); },
        function () { if (if29.parentNode) if29.parentNode.removeChild(if29); },
        function () { return snapDiff(cp.snap0, topSnap()); });
    var rnd30 = Math.random;
    one('(30)本物の 乱数を 借りたまま 返さない', /Math\.random/,
        function () { Math.random = rng(1); },
        function () { Math.random = rnd30; },
        function () { return snapDiff(cp.snap0, topSnap()); });
    return { kill: kill, ok: killOk, n: killN };
  }

  /* ============================================================
     ★★★ 10. verify 本体 ★★★
     ============================================================ */
  var running = null;
  function verify(n) {
    if (running) return running;
    running = runVerify(n).then(function (o) { running = null; return o; }, function (e) { running = null; throw e; });
    return running;
  }

  function runVerify(n) {
    n = Math.max(30, (n | 0) || K.HANDS);     /* ★ 30 より 少ないと 下の 線（0〜5枚 全部 起きる）が 引けない */
    var t0 = Date.now(), ng = [], note = {};
    var snap0 = topSnap();
    var errTop = watchErr(root);
    var errTop0 = P0.state.errors.length;
    var loaded0 = foreignLoaded(root).length;
    var cp = null, hooks = null, net = null, errCp = null;
    var setItem0 = null, writes = 0;

    return makeCopy().then(function (c) {
      cp = c;
      cp.snap0 = snap0;
      /* ★ 写しの 中で しまう ものを 止める（★本物の 最高記録を 汚さない）*/
      setItem0 = cp.win.Storage.prototype.setItem;
      cp.win.Storage.prototype.setItem = function () { writes++; };
      net = watchNet(cp.win); cp.net = net; cp.netFetch0 = net.impl.fetch;
      errCp = watchErr(cp.win); cp.err = errCp;
      hooks = installHooks(cp);

      /* ① ② ⑥ 決まり */
      var T = runRules(cp, hooks, n);
      T.ng.forEach(function (m) { ng.push(m); });
      note['① ★コイン'] = T.out ? ('checkCoins ' + T.out['合っているか'] + '／合計 ' + T.out['コイン合計'] + ' ＝ 配った ' + T.out['配ったコインの合計'] +
        '／★自分でも ' + T.evals + '回 数えて ちがい ' + T.ng.filter(function (m) { return /コイン|合計/.test(m); }).length + '件') : '（早送りが 動きません）';
      note['② ★配り・取りかえ'] = n + 'ハンド／引く 目 ' + T.draws + '回／取りかえ ' + T.swapDraws + '回（0〜5枚：' + T.swapN.join('・') + '）／小がけ・大がけ ' + T.blinds + '回 合う／親 1つずれ ○';
      note['② ★決着'] = '勝負まで ' + T.shows + '／みんな降りて ' + T.folds + '／決着の 目 ' + T.settles + '回（★自分の 判定器で 順位・ポットの 行き先を 数えた）';
      note['⑥ ★52枚'] = '手札＋山札＋捨て札 ＝ 52 を ' + T.evals + '回 数えて ちがい ' + T.ng.filter(function (m) { return /52枚/.test(m); }).length + '件／山札を 切って いない 0回';

      /* ② 役の 強さ順 */
      var L = runLadder(cp);
      L.ng.forEach(function (m) { ng.push(m); });
      note['② ★役の 強さ順'] = '本物の 順 ○／見本 ' + L.fix + '/' + L.fixN + '・くらべ ' + L.pair + '/' + L.pairN + '／でたらめ ' + L.rand + '手（役 ' + L.kinds + '種類）：役の ちがい ' + L.catBad + '・くらべの ちがい ' + L.cmpBad;

      /* ⑤ ⑦ 場面 */
      var SC = runScene(cp);
      SC.ng.forEach(function (m) { ng.push(m); });
      note['⑤ ★44px の 指の 的'] = SC.tap.n + '個 測って いちばん 小さい ' + (SC.tap.min === 999 ? '―' : SC.tap.min + 'px') + '／44 を 割る ' + SC.tap.small.length + '個／まん中で 当たらない ' + SC.tap.miss.length + '個（場面：' + SC.scenes.join('・') + '）';
      note['⑦ ★ルルの 線'] = '山札の 数字 ' + SC.leak.deckNum.length + '件／捨て札が 表 ' + SC.leak.faceUp.length + '枚（捨て札の ある 場面 ' + SC.leak.sawDiscards + '回）／取りかえの 印 ' + SC.badgeGot + '/' + SC.badgeWant + '人／2枚 えらぶ → ' + SC.picks + '枚';
      note['⑨ ★ハッピーの ことばが 場面と 合っているか'] = SC.happyWords.length + '場面 読んで 合って いない ' + SC.happyBad.length
        + '件／読めなかった ' + SC.happyDead.length + '件／画面に 出ない 場面 ' + SC.happyHidden.length + '件'
        + (SC.happyHidden.length ? '（' + SC.happyHidden.join('・') + '）' : '')
        /* ★ T250：★この 目が どの 道を 歩いたかを、★毎回 数で 残す */
        + '／★早送りの 道 ' + SC.happyFast.length + '件・★めくりの 一言を 見た ' + SC.happyFlash.length + '場面'
        + '　★' + SC.happyWords.join('　★');

      /* ③ 通信・エラー */
      var fdTop = foreignInDom(document), fdCp = foreignInDom(cp.doc), flTop = foreignLoaded(root), flCp = foreignLoaded(cp.win);
      if (fdTop.length || fdCp.length) ng.push('★★★外の 住所が 置いて あります：' + fdTop.concat(fdCp).join('・'));
      if (flTop.length || flCp.length) ng.push('★★★外へ 読みに 行って います：' + flTop.concat(flCp).join('・'));
      if (net.total()) ng.push('★★★通信の 口を ' + net.total() + '回 呼びました（fetch ' + net.counts.fetch + '・XHR ' + net.counts.xhr + '・beacon ' + net.counts.beacon + '・WS ' + net.counts.ws + '）');
      note['③ ★外への 通信'] = '外の 住所 ' + (fdTop.length + fdCp.length) + '件／外へ 読んだ ' + (flTop.length + flCp.length) + '件／口を 呼んだ ' + net.total() + '回（★本物と 写しの 両方）';
      if (errCp.list.length) ng.push('★★★写しの 中で エラー ' + errCp.list.length + '件：' + errCp.list.slice(0, 2).join('／'));
      if (writes) ng.push('★★写しが しまおうと しました（' + writes + '回）―― ★止めて あります');
      note['③ ★エラー'] = '写し ' + errCp.list.length + '件／本物 （下で）／しまおうと した ' + writes + '回（★写しでは 止めて いる）';

      /* ⑧ わざと 壊す（★写しを）*/
      var B = runBreaks(cp, hooks);
      if (B.ok !== B.n) ng.push('★★★★見張りが 死んで います：★わざと 壊しても ' + (B.n - B.ok) + ' / ' + B.n + ' 通りが 鳴りません');
      note['⑧ ★★わざと 壊して 鳴らす'] = B.ok + ' / ' + B.n + ' 通り 鳴りました　★' + B.kill.join('　★');
      note['★場面の 種'] = 'きまり ' + K.SEED_RULE + '／場面 ' + K.SEED_SCENE;
    }).catch(function (e) {
      ng.push('★★★写しが 作れません：' + String(e && e.message || e));
    }).then(function () {
      /* ★ 後片づけ（★⑥：数え おわって から。★⑤：さわった ものは 戻す）*/
      try { if (hooks) hooks.restore(); } catch (e) {}
      try { if (net) net.restore(); } catch (e) {}
      try { if (errCp) errCp.restore(); } catch (e) {}
      try { if (cp && setItem0) cp.win.Storage.prototype.setItem = setItem0; } catch (e) {}
      try { if (cp) cp.destroy(); } catch (e) {}
      errTop.restore();
      /* ④ ㉜ 本物は 元どおりか */
      var d = snapDiff(snap0, topSnap());
      d.forEach(function (m) { ng.push('★★★★見張りが 本物を 汚しました：' + m); });
      if (errTop.list.length) ng.push('★★★本物で エラー ' + errTop.list.length + '件：' + errTop.list.slice(0, 2).join('／'));
      var newTop = P0.state.errors.slice(errTop0);
      if (newTop.length) ng.push('★★★本物の state.errors が 増えました：' + newTop.slice(0, 2).join('／'));
      var loaded1 = foreignLoaded(root).length;
      if (loaded1 !== loaded0) ng.push('★★★見張りの あいだに 外へ 読みに 行きました（' + (loaded1 - loaded0) + '件）');
      note['④ ★見張り自身'] = '本物の 写し ' + Object.keys(snap0).length + '項目 くらべて ちがい ' + d.length + '／本物の エラー ' + errTop.list.length + '件／iframe いま ' + document.querySelectorAll('iframe').length + '個';

      var out = {
        '★NG': ng.length,
        '中身': ng.length ? ng : 'ぜんぶ OK ✅',
        '画面': root.innerWidth + '×' + root.innerHeight,
        'ハンド数': n,
        'かかった 時間': (Date.now() - t0) + 'ms'
      };
      for (var k in note) if (note.hasOwnProperty(k)) out[k] = note[k];
      P0.verifyLast = out;
      console.log('[ポーカー] verify', out);
      return out;
    });
  }

  P0.verify = verify;
  P0._verifyReady = true;
  /* ★ 道具が 種を 選ぶ ときの 口（★遊びには 使わない）*/
  P0._verifyProbe = { K: K, makeCopy: makeCopy, installHooks: installHooks, runRules: runRules, runScene: runScene, runLadder: runLadder, myEval: myEval };

})(typeof globalThis !== 'undefined' ? globalThis : this);
