'use strict';
/* ============================================================
   大富豪 ―― ★★見張り（verify）★★   T184 ／ 💻 コーダ
   ------------------------------------------------------------
   ★★このファイルは 遊びの 中身を 1行も 持ちません。
   ★★`game.js` は 1文字も 触って いません（md5 で 確かめて あります）。
      ―― ★大富豪は 公開ずみ・社長が いちばん 気に入って いる 本 なので、
        ★★「見るだけの 目」を **別の ファイル** に して、本体に 傷を つけない 形に しました。
      ―― ★中を のぞく 口は、game.js が 前から 持って いる `window.DF` を 通します。

   ★★8本（★見張りの 無い 本）に 写す ときの ため、★目は 2つに 分けて 書いて あります：
       ★【共】…… ★★8本 ぜんぶに 要る 目（★そのまま 写せる）
       ★【富】…… ★★大富豪に しか ない 目（★書きかえが 要る）

   ★★この会社が 学んだ こと（★必ず 守る）
     ★① computed style を 信じない ―― ★★本物の 当たり（elementFromPoint）と
          ★★本物の 絵の じょうたい（img.complete）で 数える【T180 私の 失敗①】
     ★② ★★鳴らない ときに 黙って いる 方が 難しい ―― ★線が 引けない ものは
          ★★「鳴らす」のを やめて「読むための 数字」に 格下げする【T182 アト】
     ★③ ★★その 画面を 回さないと 鳴らない 見張りを 作らない ―― ★壊し方は
          ★★どの 大きさでも 鳴る 形に する【T181 トライ・T182 アト】
     ★④ ★★`★NG` は「数」であること・★わざと 壊して 鳴る ことを 見せる【T162・T163】
     ★⑤ ★★見張りは 見るだけ ―― ★さわった ものは 1つ 残らず 戻す【T144 §7-5】
   ============================================================ */

(function (root) {

  /* ★ game.js が 読み込まれて いない ときは 何も しない（★遊びを 止めない）*/
  if (!root.DF || !root.DF.state) return;
  var DF = root.DF;
  var S  = DF.state;
  var $  = function (id) { return document.getElementById(id); };

  /* ============================================================
     ★ 0. どうぐ箱
     ============================================================ */

  /* ★ 動きを 止める（★測る あいだ だけ）。★CSS は この ファイルが 自分で 差します。 */
  var styleEl = null;
  function ensureStyle() {
    if (styleEl) return;
    styleEl = document.createElement('style');
    styleEl.textContent =
      '.dfv-still *,.dfv-still *::before,.dfv-still *::after{' +
        'transition:none !important;animation:none !important;}' +
      '.dfv-fast #gameScreen,.dfv-fast #startScreen{display:none !important;}';
    document.head.appendChild(styleEl);
  }
  function still(fn) {
    ensureStyle();
    var h = document.documentElement, had = h.classList.contains('dfv-still');
    h.classList.add('dfv-still');
    try { return fn(); } finally { if (!had) h.classList.remove('dfv-still'); }
  }

  /* ★ 種（★同じ 試合を 何度でも）―― ★`Math.random` を 借りるだけ。★終わったら 返します。 */
  var seedFixed = 0;
  function rng(s) {
    var x = (s | 0) || 20260831;
    return function () { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; x |= 0; return (x >>> 0) / 4294967296; };
  }
  function withRandom(s, fn) {
    var keep = Math.random, r = rng(s);
    Math.random = r;
    try { return fn(); } finally { Math.random = keep; }
  }

  /* ★★ 時計を 借りる ―― ★★ゲームの ながれは ぜんぶ `later()`＝`window.setTimeout` を 通ります。
     ★ ここを「順番待ちの 箱」に すげかえると、★★本物の 決まりの まま 早送りで 走らせられます。
     ★ ★★これが 大事な ところ：★決まりを 2か所に 書かない（★写しの エンジンを 作らない）。
       ★ ★写しを 作ると、★写しの 中の 決まりしか 見張れません。 */
  var vq = null, vseq = 0, vnow = 0, vErr = [];
  function clockOn() {
    var realS = root.setTimeout, realC = root.clearTimeout;
    vq = []; vseq = 0; vnow = 0;
    root.setTimeout = function (f, ms) {
      var id = ++vseq;
      vq.push({ id: id, f: f, t: vnow + (ms || 0), s: vseq });
      return id;
    };
    root.clearTimeout = function (id) {
      if (!vq) return realC.call(root, id);
      for (var i = 0; i < vq.length; i++) if (vq[i].id === id) { vq.splice(i, 1); return; }
    };
    return function off() { root.setTimeout = realS; root.clearTimeout = realC; vq = null; };
  }
  /* ★ たまって いる ものを 早い順に 全部 走らせる。★1件ずつ 例外を 拾う。 */
  function pump(limit) {
    var n = 0;
    while (vq && vq.length && n++ < (limit || 4000)) {
      var b = 0;
      for (var i = 1; i < vq.length; i++) {
        if (vq[i].t < vq[b].t || (vq[i].t === vq[b].t && vq[i].s < vq[b].s)) b = i;
      }
      var job = vq.splice(b, 1)[0];
      vnow = job.t;
      try { job.f(); } catch (e) { vErr.push(String(e && e.message || e)); }
    }
    return n;
  }

  /* ★ 当たり（★本物の 指の 位置から 引く）
     ⚠️★ `document.elementFromPoint` を そのまま 見ては いけません ――
        ★返って くるのは 札の **中身**（.fallback や img）です。★押せる ものまで 上へ たどります。 */
  var TAP_UP = '[data-key],button,input,summary,a[href],label.rule-row,[data-close]';
  function hitAt(x, y) {
    if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) return null;
    var e = document.elementFromPoint(x, y);
    if (!e) return null;
    var t = e.closest ? e.closest(TAP_UP) : null;
    return t || e;
  }
  /* ⚠️★★ とじて いる `<details>` の 中は **display:none では ありません**【私の 失敗⑧】。
     ★ ★いまの Chrome は `content-visibility` で かくすので、★★大きさも 親も ちゃんと 返って きます。
       ★ ★それを「見えて いる」と 数えて、★★とじた ルールの 15行を
         ★ ★★「押す ところに 届きません」と **11件 うそを 言いました**。
     ★ ★★computed style でも 箱の 大きさでも なく、★`checkVisibility()`（＝ブラウザ自身の 答え）を 聞きます。 */
  /* ★★T187（🎨アト）― ⑯（バッジ）が「字が あるか」だけを 見て いた すきまの 直し。
     ★ ★#flagRow の 子（バッジ 1つ1つ）を 見て、★★その しるしを 持つ バッジが
       ★ ★★「字も あって、かつ 目にも 見える」ときだけ ○ に します。
     ★ ★`visible()` の 下に 置いて いる 理由：★visible を 使う ので 定義の あとに 要ります。 */
  function badgeShown(mark) {
    var row = $('flagRow');
    if (!row) return false;
    var kids = row.children;
    for (var i = 0; i < kids.length; i++) {
      if ((kids[i].textContent || '').indexOf(mark) >= 0 && visible(kids[i])) return true;
    }
    return false;
  }

  function visible(el) {
    if (!el) return false;
    if (el.checkVisibility) {
      try {
        if (!el.checkVisibility({ contentVisibilityAuto: true, opacityProperty: true, visibilityProperty: true })) return false;
      } catch (e) {}
    }
    var d = el.closest ? el.closest('details') : null;
    if (d && !d.open && !(el.tagName === 'SUMMARY' || (el.closest && el.closest('summary')))) return false;
    if (!el.offsetParent && el.tagName !== 'BODY' && getComputedStyle(el).position !== 'fixed') return false;
    var q = el.getBoundingClientRect();
    return q.width > 0.5 && q.height > 0.5;
  }
  /* ★ その ものが「いま 本当に 押せるか」―― ★まん中を さして 自分（か 中身）が 返るか。 */
  function reallyTappable(el) {
    if (!visible(el)) return false;
    if (el.disabled) return false;
    var q = el.getBoundingClientRect();
    var got = hitAt(q.left + q.width / 2, q.top + q.height / 2);
    return !!(got && (got === el || el.contains(got) || (got.contains && got.contains(el))));
  }
  /* ★ まん中から 外へ、★何px まで 自分に 当たるか（★見た目の 大きさでは なく 本物の 的）*/
  function reach(el) {
    var q = el.getBoundingClientRect();
    var cx = q.left + q.width / 2, cy = q.top + q.height / 2;
    function go(dx, dy) {
      var d = 0;
      for (var s = 1; s <= 60; s++) {
        var t = hitAt(cx + dx * s, cy + dy * s);
        if (!(t && (t === el || el.contains(t)))) break;
        d = s;
      }
      return d;
    }
    return { w: go(-1, 0) + go(1, 0) + 1, h: go(0, -1) + go(0, 1) + 1 };
  }

  /* ★ 押す ところ 一覧（★大富豪の 画面に ある もの ぜんぶ）
     ⚠️★ ルールの チェックは 箱が 小さくても、★★押す ところは まわりの `label` です。
        ★ ここを `input` で 測ると **本当は 押せる のに 鳴る**（★空うち・★私の 失敗①）。
     ⚠️★★ ふたが 開いて いる（`<dialog open>`）ときは、★★ふたの 中の ものしか 押せません。
        ★ ★外の ボタンを いっしょに 測ると **ぜんぶ 1×1px** に 見えて、★62件も 空うちしました
          ★（★私の 失敗②。★ふたの うしろの 幕に 当たって いた だけ）。 */
  var TAP_SEL = '.howto,.start-button,#presetRow .preset,#ruleList label.rule-row,' +
                '#ruleAllOff,#ruleReset,.rule-fold summary,.mini-btn,' +
                '#hand [data-key],.alt-button,.play-button,.pass-button,' +
                '.dialog-ok,.dialog-sub,.close-dialog';
  function openDialog() {
    var d = document.querySelectorAll('dialog[open]');
    return d.length ? d[d.length - 1] : null;
  }
  function tapList() {
    var out = [], l = document.querySelectorAll(TAP_SEL), top = openDialog();
    for (var i = 0; i < l.length; i++) {
      if (!visible(l[i])) continue;
      if (top && !top.contains(l[i])) continue;      /* ★ふたの 外は いま 押せない */
      out.push(l[i]);
    }
    return out;
  }

  /* ★★ 画面の 外に 出て いる とき、★★スクロールして 届くか（★本物で 動かして 見る）
     ★ ★はじめの画面は ルールが 15個 あるので **縦に 長いのが 正しい 姿**です。
       ★ ★だから「画面の 外に ある」だけでは 故障では ありません。
       ★ ★★故障は「★スクロールしても 届かない」――★追記③「触る所が 画面の外に 出たら 故障」。 */
  function outOfView(el) {
    var q = el.getBoundingClientRect();
    return q.left < -0.5 || q.top < -0.5 || q.right > innerWidth + 0.5 || q.bottom > innerHeight + 0.5;
  }
  function unreachable(el) {
    if (!outOfView(el)) return false;
    var keeps = [], n = el;
    while (n && n !== document.documentElement) {
      if (n.scrollHeight > n.clientHeight + 1 || n.scrollWidth > n.clientWidth + 1) keeps.push([n, n.scrollTop, n.scrollLeft]);
      n = n.parentElement;
    }
    var wx = root.scrollX, wy = root.scrollY;
    var bad = true;
    try {
      el.scrollIntoView({ block: 'center', inline: 'center' });
      bad = outOfView(el);
    } catch (e) { bad = true; }
    keeps.forEach(function (k) { k[0].scrollTop = k[1]; k[0].scrollLeft = k[2]; });
    root.scrollTo(wx, wy);
    return bad;
  }

  /* ★★ 44px ―― ★2つに 分ける（★T177 の C：「割るなら 例外として 記録」）
     ★ MUST …… ★遊んで いる 最中に 何度も 押す ところ。★ここが 44pxを 割ったら **鳴らす**。
     ★ REC  …… ★もとから 44pxを 割って いる ところ。★★社長が 通した 形（公開ずみ）なので
                ★ ★★鳴らさず、★数字だけ 残す。★★黙って 縮んだら 数字で 気づける。 */
  /* ★★ MUST の 中身は 【実測】で 決めました（★T184・375×812）――
     ★ ★「44px を すでに 割って いる ところ」を MUST に 入れると、★★きれいな 画面で 鳴ります。
       ★ ★★それは 見張りでは なく ただの 赤ランプ です（★アト T182 の 教え）。
     ★ ★★いま 44pxを 割って いる もの（★鳴らさず 記録するだけ・★社長へ 数字で 報告）：
       ★ ★遊び方 94×41／やめる 66×32／× 34×28／分かった！・閉じる 121×38／設定を変える 120×36
       ★ ★手札の札（320幅）41px はば ―― ★T119・T120 で 社長が 通した 形 */
  var MUST44 = ['.play-button', '.pass-button', '.alt-button', '.start-button', '#presetRow .preset', '#againBtn'];
  function isMust44(el) {
    for (var i = 0; i < MUST44.length; i++) if (el.matches && el.matches(MUST44[i])) return true;
    return false;
  }
  function tapName(el) {
    if (el.dataset && el.dataset.key) return '手札の札';
    return (el.id ? '#' + el.id : '') + '.' + (String(el.className || el.tagName).split(' ')[0]);
  }

  /* ============================================================
     ★ 1.【共】絵の じょうたい ―― ★★「2段階で 出ない」の 本物の ものさし
     ------------------------------------------------------------
     ★ T120【実測】：★ロボットの 札は うら向きの あいだ 絵を 1枚も 読んで いなかった。
       ★ だから 出した しゅんかんに ★★文字の 仮の札 → PNG → 絵 の **2段階**に なった
       ★（★4Mbps で 55/55・★localhost でも 25/39 で 1コマ 見えて いた）。
     ★ ★★ここで 見るのは computed style では なく、★★`img.complete && naturalWidth>0`。
       ★ ＝ ★★「その 札が 画面に 現れた しゅんかん、絵は もう 手元に あったか」。
     ★ ★★白い札（絵も 文字の 仮の札も 見えない）も 同時に 数えます。
     ============================================================ */
  function scanImgs(root2) {
    var out = { n: 0, notReady: 0, white: 0, who: [] };
    var cards = root2.querySelectorAll('.card');
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i], img = c.querySelector('img.face-img'), fb = c.querySelector('.fallback');
      out.n++;
      var ready = !!(img && img.complete && img.naturalWidth > 0);
      if (!ready) {
        out.notReady++;
        if (out.who.length < 6) out.who.push((c.getAttribute('aria-label') || '?') + (img ? '' : '（絵の札 なし）'));
      }
      var fbSeen = !!(fb && getComputedStyle(fb).display !== 'none' && fb.getBoundingClientRect().width > 0.5);
      if (!ready && !fbSeen) out.white++;
    }
    return out;
  }

  /* ============================================================
     ★ 2.【富】走らせる（autoPlay）
     ------------------------------------------------------------
     ★★本物の `game.js` を、★時計だけ 早送りして 走らせます。
     ★ ★人の 手は 4つの 打ち方から えらべます（★ロボットと 同じ 打ち方が 初期値）。
     ============================================================ */
  var HUMANS = [
    { id: 'weak',   label: '弱いから出す（ロボットと同じ）' },
    { id: 'strong', label: '強いから出す' },
    { id: 'many',   label: 'まとめて出す' },
    { id: 'one',    label: '1枚ずつ出す' }
  ];
  function pickPlay(policy) {
    var me = S.players[0];
    var ps = DF.legalPlays(me, false);
    if (!ps.length) return null;
    if (policy === 'weak')   return pickBy(ps, function (p) { return DF.meldPower(p.meld) + p.cards.length * 0.001; });
    if (policy === 'strong') return pickBy(ps, function (p) { return -DF.meldPower(p.meld); });
    if (policy === 'many')   return pickBy(ps, function (p) { return -p.cards.length * 100 + DF.meldPower(p.meld); });
    return pickBy(ps, function (p) { return p.cards.length * 100 + DF.meldPower(p.meld); });
  }
  function pickBy(ps, score) {
    var best = ps[0], bs = score(ps[0]);
    for (var i = 1; i < ps.length; i++) { var s = score(ps[i]); if (s < bs) { bs = s; best = ps[i]; } }
    return best;
  }

  /* ============================================================
     ★★ 札の 数が 合うか（★T177 の D）
     ------------------------------------------------------------
     ⚠️★★ 私は ここで 1回 まちがえました【私の 失敗③】。
        ★ はじめ「★手札＋場 が いつも 54枚」で 鳴らして いました。
        ★ ★★大富豪では 出した 札は 場が 流れると **捨てられて 消えます**。
          ★ ★だから きれいな 試合でも 44枚・36枚…と どんどん 減る ―― ★★空うちでした
            ★（★20試合で 69件。★★「鳴る 見張り」を 作るのは かんたんで、
              ★ ★★「鳴らない ときに 黙って いる」ほうが 難しい ―― ★アトの 言うとおりでした）。
     ★ ★★正しい 決まりは この 3つ：
        ★ ① ★配った 直後は ちょうど 54枚
        ★ ② ★★札は **増えない**（★手札＋場 の 数は 下がる 一方）
        ★ ③ ★★一度 消えた 札は **生き返らない**・★同じ 札が 2か所に ない
     ============================================================ */
  function aliveSet() {
    var m = {}, dup = 0, n = 0, i, j;
    for (i = 0; i < S.players.length; i++) {
      for (j = 0; j < S.players[i].cards.length; j++) {
        var k = S.players[i].cards[j].key;
        if (m[k]) dup++; m[k] = 1; n++;
      }
    }
    if (S.field) for (j = 0; j < S.field.cards.length; j++) {
      var k2 = S.field.cards[j].key;
      if (m[k2]) dup++; m[k2] = 1; n++;
    }
    return { map: m, n: n, dup: dup };
  }

  /* ★ 1手ぶん 人が 動く。★戻り値は 何を したか。 */
  function humanStep(policy) {
    /* 7渡し・10捨て・カード交換で えらんで いる さいちゅう */
    if (S.pending && S.pending.human) {
      var need = S.pending.n, keys = [];
      for (var i = 0; i < S.players[0].cards.length && keys.length < need; i++) keys.push(S.players[0].cards[i].key);
      if (keys.length < need) return 'pending-short';
      DF.sel(keys); DF.play();
      return 'pending';
    }
    if (!DF.isMyTurn()) return 'wait';
    var p = pickPlay(policy);
    if (!p) {
      if (S.field) { DF.passNow(); return 'pass'; }
      return 'stuck';                 /* ★★場が 空なのに 何も できない ＝ 詰み（⑦が 拾う）*/
    }
    var before = S.players[0].cards.length;
    DF.sel(p.cards.map(function (c) { return c.key; }));
    DF.play();
    if (S.players[0].cards.length === before && !S.busy && DF.isMyTurn()) DF.play();  /* 上がり禁止の 2回押し */
    return (S.players[0].cards.length === before) ? 'nomove' : 'play';
  }

  /* ★★ 画面つきで 走る ときの 1手ごとの 見張り（★autoPlay({ui:true}) が 自分で 呼ぶ）
     ⚠️★★ はじめ これを **呼ぶ 側（verify）の watch の 中**に 書いて いました【私の 失敗⑩】。
        ★ ★すると `autoPlay(10,{ui:true})` を 別の どうぐから 呼んだ とき、
          ★ ★★何も 数えずに「0 / 0回」と 返します ―― ★★きれいに 見える だけの 数字。
        ★ ★★数える ところは、★数える 道具の 中に 置く。 */
  var uiOn = false;
  function uiWatch(st) {
    var mine = (!S.over && !S.busy && S.turn === 0 && !S.players[0].done) || (S.pending && S.pending.human);
    if (mine) {
      var k = tapList().filter(reallyTappable).length;
      if (k === 0) {
        st.tapZero++;
        if (st.tapWhy.length < 3) st.tapWhy.push('手札' + S.players[0].cards.length + '枚・場' + (S.field ? S.field.cards.length : 0) + '枚');
      }
      var mp = measurePlay();
      st.moments++;
      if (mp.cardOut) { st.cardOut++; if (st.cutWhy.length < 3) st.cutWhy.push(mp.who); }
      if (mp.btnOut)  { st.btnOut++;  if (st.cutWhy.length < 3) st.cutWhy.push(mp.who); }
    }
    var s1 = scanImgs($('field')), s2 = scanImgs($('hand'));
    st.imgN += s1.n + s2.n; st.notReady += s1.notReady + s2.notReady; st.white += s1.white + s2.white;
    if ($('hand').querySelector('.can-play') && $('hand').querySelector('.can-join')) st.mix++;
  }

  /* ★ 1試合。★opt.watch を 渡すと 1手ごとに 見張りが 呼ばれます。 */
  function playOne(policy, watch, st) {
    try { $('resultDialog').close(); } catch (e) {}
    S.gameNo += 1;                    /* ★★これを 忘れると カード交換が **一度も 出ません**（gameNo>1 が 条件）*/
    DF.start(true);
    /* ⚠️★★ ここで 数える【私の 失敗⑥】。★はじめ `pump()` の **後**で 数えて いました ――
       ★ ★pump が 走ると ロボットが もう 何手も 打って いる ので、★★48枚・44枚…と 出て
         ★ ★「配った直後が 54枚では ありません」と **6件 うそを 言いました**。 */
    var a0 = aliveSet();
    if (a0.n !== 54) { st.badStart++; if (st.badWhy.length < 4) st.badWhy.push('配った直後 ' + a0.n + '枚'); }
    pump();
    var prevN = a0.n, prevMap = a0.map, gone = {};
    var guard = 0, last = -1;
    while (!S.over && guard++ < 1200) {
      var cc = aliveSet(), gk, kk;
      if (cc.n > prevN) { st.grew++; if (st.badWhy.length < 4) st.badWhy.push('増えた ' + prevN + '→' + cc.n + '枚'); }
      for (gk in gone) if (cc.map[gk]) { st.revive++; if (st.badWhy.length < 4) st.badWhy.push('生き返った ' + gk); break; }
      for (kk in prevMap) if (!cc.map[kk]) gone[kk] = 1;   /* ★ 消えた ものを おぼえる */
      prevMap = cc.map; prevN = cc.n;
      if (cc.dup) { st.dup++; }
      if (S.players[0].cards.length > st.handMax) st.handMax = S.players[0].cards.length;
      for (var q = 1; q < 4; q++) if (S.players[q].cards.length > st.handMax) st.handMax = S.players[q].cards.length;
      if (uiOn) uiWatch(st);
      if (watch) watch(st);
      var r = humanStep(policy);
      if (r === 'stuck') { st.stuck++; break; }
      if (r === 'wait' && vq && !vq.length) { st.frozen++; break; }   /* ★★誰の 番でも なくなった */
      pump();
      if (S.players[0].cards.length === last && r === 'nomove') { st.nomove++; break; }
      last = S.players[0].cards.length;
    }
    if (guard >= 1200) st.nofin++;
    pump();
    if (S.over) {
      /* ★ 順位が 4人ぶん 1〜4 で 一意か */
      var pl = S.players.map(function (p2) { return p2.place; }).slice().sort();
      if (pl.join(',') !== '1,2,3,4') { st.badRank++; if (st.rankWhy.length < 3) st.rankWhy.push(pl.join(',')); }
      var me = S.players[0].place;
      if (me === 1) st.win++;
      st.pts += (4 - me + 1);
      st.games++;
    }
    try { $('resultDialog').close(); } catch (e) {}
    return st;
  }

  function newSt() {
    return { games: 0, win: 0, pts: 0, handMax: 0, badStart: 0, grew: 0, revive: 0, badWhy: [], dup: 0,
             stuck: 0, frozen: 0, nomove: 0, nofin: 0, badRank: 0, rankWhy: [],
             tapZero: 0, tapWhy: [], notReady: 0, white: 0, imgN: 0, mix: 0, fired: {},
             moments: 0, cardOut: 0, btnOut: 0, cutWhy: [] };
  }

  function autoPlay(n, opt) {
    n = n || 60; opt = opt || {};
    var policy = opt.human || 'weak';
    var preset = opt.preset || 'all';
    var t0 = Date.now();
    var st = newSt();
    var keepPre = S.preset, keepOn = {}, k;
    for (k in S.ruleOn) keepOn[k] = S.ruleOn[k];
    var h = document.documentElement;
    var fast = !opt.ui;
    var keepUi = uiOn; uiOn = !!opt.ui;
    ensureStyle();
    if (fast) h.classList.add('dfv-fast');
    var off = clockOn();
    vErr = [];
    /* ★★ どの ルールが 何回 出たか（★T94：4つの ルールが 60試合 ねむって いた）
       ★ ★のぞきあな（DF.hook）は game.js が 前から 持って いる ―― ★私は 何も 足しません。 */
    var keepHook = DF.hook.rule;
    DF.hook.rule = function (id) { st.fired[id] = (st.fired[id] || 0) + 1; };
    try {
      withRandom(opt.seed || seedFixed || 20260831, function () {
        DF.preset(preset);
        DF.start(false);
        pump();
        for (var i = 0; i < n; i++) playOne(policy, opt.watch, st);
      });
    } finally {
      DF.hook.rule = keepHook;
      uiOn = keepUi;
      off();
      if (fast) h.classList.remove('dfv-fast');
      DF.preset(keepPre === 'custom' ? 'normal' : keepPre);
      if (keepPre === 'custom') { for (k in keepOn) S.ruleOn[k] = keepOn[k]; S.preset = 'custom'; }
    }
    var out = {
      '★ルール': preset + '（' + DF.RULES.filter(function (r) { return S.ruleOn[r.id]; }).length + '個 ON）',
      '★人の打ち手': (HUMANS.filter(function (x) { return x.id === policy; })[0] || {}).label || policy,
      '回数': st.games,
      '★★配った直後が54枚でない': st.badStart + '件' + (st.badWhy.length ? '（' + st.badWhy.join('・') + '）' : ''),
      '★★札が増えた': st.grew + '件',
      '★★消えた札が生き返った': st.revive + '件',
      '★★同じ札が2枚': st.dup + '件',
      '★★詰み（押せる手が1つも無い）': st.stuck + '件',
      '★★止まった試合（誰の番でもない）': st.frozen + '件',
      '★★出したのに減らない': st.nomove + '件',
      '★終わらない試合': st.nofin + '件',
      '★★順位が1〜4で一意でない': st.badRank + '件' + (st.rankWhy.length ? '（' + st.rankWhy.join('／') + '）' : ''),
      '★★手札の最大': st.handMax + '枚',
      '★人が1位': (st.games ? (st.win / st.games * 100).toFixed(2) : '―') + '%（★五分 25.00%）',
      '★人の⭐平均': (st.games ? (st.pts / st.games).toFixed(2) : '―'),
      '★例外（画面の中で投げられたもの）': vErr.length + '件' + (vErr.length ? '（' + vErr.slice(0, 3).join('／') + '）' : ''),
      '★★出たルール': DF.RULES.map(function (r) { return r.name + ' ' + (st.fired[r.id] || 0); }).join('／'),
      '★★一度も出なかったルール': DF.RULES.filter(function (r) { return S.ruleOn[r.id] && !st.fired[r.id]; }).map(function (r) { return r.name; }),
      'かかった時間': (Date.now() - t0) + 'ms（★1試合 ' + (st.games ? Math.round((Date.now() - t0) / st.games) : '―') + 'ms）'
    };
    if (opt.ui) {
      out['★★押せるものが1つも無い場面'] = st.tapZero + '件' + (st.tapWhy.length ? '（' + st.tapWhy.slice(0, 3).join('／') + '）' : '');
      out['★★自分の番の場面'] = st.moments + '回';
      out['★★手札の札が画面の外'] = st.cardOut + ' / ' + st.moments + '回';
      out['★★「出す」「パス」が画面の外'] = st.btnOut + ' / ' + st.moments + '回' +
        (st.cutWhy.length ? '（' + st.cutWhy.join('／') + '）' : '');
      out['★★札が出た時に絵が無かった'] = st.notReady + ' / ' + st.imgN + '枚';
      out['★★白い札'] = st.white + '件';
      out['★★光りとみどりが混ざった'] = st.mix + '件';
    }
    if (root.console) console.log('[大富豪] autoPlay', out);
    return out;
  }

  /* ★ 打ち手 4つ × ルール 3段（★かんたん／ふつう／ぜんぶ）*/
  function rates(n) {
    n = n || 40;
    var out = { '数えかた': '★1位に なった 割合（★五分 25.00%）', '回数': n + '（各マス）' };
    ['easy', 'normal', 'all'].forEach(function (pre) {
      var row = [];
      HUMANS.forEach(function (hu) {
        var r = autoPlay(n, { human: hu.id, preset: pre, seed: 424242 });
        row.push(hu.label.split('（')[0] + ' ' + r['★人が1位']);
      });
      out['★' + pre] = row.join('　');
    });
    if (root.console) console.log('[大富豪] rates', out);
    return out;
  }

  /* ============================================================
     ★ 3.【共】はみ出し・画面外・44pxの 指の的（fitTest）
     ------------------------------------------------------------
     ★ 追記③：★まれな 形の ために ふだんの 画面を 小さく しない。
       ★ ★だから「ふだんの 形」も「まれな 形」も **両方** 測って、
         ★ ★★どっちで はみ出したかを 分けて 出します。
     ★ ★★見切れて よいのは「使わない 側」だけ。★★触る ところが 画面の 外に 出たら 故障。
     ============================================================ */
  function deckKeys() {
    var out = [], su = ['spades', 'hearts', 'diamonds', 'clubs'],
        rk = ['3','4','5','6','7','8','9','10','J','Q','K','A','2'];
    su.forEach(function (s) { rk.forEach(function (r) { out.push(s + '-' + r); }); });
    out.push('joker-1'); out.push('joker-2');
    return out;
  }
  var SCENES = [
    { n: '★はじめの画面', f: function () { DF.preset('normal'); back(); } },
    { n: '★はじめの画面・ルール15個を開く', f: function () { DF.preset('all'); back(); openFold(true); } },
    { n: '★ふだんの形（手札11枚・場1枚）', f: function () { play(11, 1); } },
    { n: '★配った直後（手札14枚・場0枚）', f: function () { play(14, 0); } },
    /* ★★ rare:true ＝「99%の 外」。★追記③：★まれな 形の ために ふだんの 画面を 小さく しない。
       ★ ★だから ここは **はみ出しでは 鳴らさず**、★★押す ところが 届くかだけ 鳴らします。 */
    { n: '★★手札17枚・場4枚（7渡しで増えた形）', rare: true, f: function () { play(17, 4); } },
    { n: '★★手札18枚・場に13枚の階段（99%の外）', rare: true, f: function () { play(18, 13); } },
    { n: '★★バッジ全部（革命＋縛り＋逆まわり＋都落ち）', f: function () { play(14, 2); flags(true); } },
    { n: '★バッジ全部・強さは元どおり', f: function () { play(14, 2); flags(false); } },
    { n: '★7渡しで えらんでいる最中', f: function () { play(14, 1); pending(); } },
    { n: '★順位発表', f: function () { play(3, 1); result(); } },
    { n: '★あそびかた', f: function () { play(11, 1); dlg('helpDialog'); } },
    { n: '★ルール一覧', f: function () { DF.preset('all'); play(11, 1); dlg('rulesDialog'); } }
  ];
  function back() {
    closeAll();
    $('gameScreen').classList.add('hidden');
    $('startScreen').classList.remove('hidden');
  }
  function openFold(on) {
    var d = document.querySelector('.rule-fold');
    if (d) d.open = !!on;
  }
  function play(handN, fieldN) {
    closeAll(); openFold(false);
    /* ⚠️★★ おしらせの 箱を 消してから 場面を 作る【私の 失敗④】。
       ★ ★ここを 忘れると、★★前の 走りで 出た おしらせの 文字（＝古い ルール名）が
         ★ ★★画面に 残った まま で、★⑭（名前の 出どころ）が **空うち**します。
       ★ ★私は これで「9リバースが 直書きされて います」と 1回 うそを 言いました。 */
    var fb = $('ruleFlash');
    if (fb) { fb.classList.remove('show'); fb.textContent = ''; }
    if (!S.players.length) DF.start(false);
    S.over = false; S.busy = false; S.pending = null; S.after = null;
    S.turn = 0; S.players[0].done = false; S.players[0].passed = false;
    $('startScreen').classList.add('hidden');
    $('gameScreen').classList.remove('hidden');
    var d = deckKeys(), i;
    DF.hand(0, d.slice(0, handN));
    for (i = 1; i < 4; i++) DF.hand(i, d.slice(20 + i * 5, 20 + i * 5 + 9));
    if (fieldN <= 0) { S.field = null; }
    else if (fieldN <= 4) {
      DF.put(['spades-5', 'hearts-5', 'diamonds-5', 'clubs-5'].slice(0, fieldN), 'ロボット1');
    } else {
      var run = [];
      for (i = 0; i < Math.min(fieldN, 13); i++) run.push('hearts-' + ['3','4','5','6','7','8','9','10','J','Q','K','A','2'][i]);
      DF.put(run, 'ロボット2');
    }
    DF.render();
  }
  function flags(odd) {
    S.revolution = true; S.jackBack = !odd; S.revDir = true;
    S.lock = ['spades', 'hearts']; S.crown = 0;
    DF.render();
  }
  function pending() {
    S.pending = { type: 'give', n: 2, player: S.players[0], human: true };
    S.busy = false; S.selected = [];
    DF.render();
  }
  function result() {
    S.players.forEach(function (p, i) { p.place = i + 1; p.done = true; });
    S.totals = S.players.map(function (_, i) { return { stars: 4 - i, firsts: i === 0 ? 1 : 0 }; });
    $('resultContent').innerHTML =
      '<h2>🏆 順位発表！</h2><p class="winner">あなたは 大富豪（1位）だったよ！</p>' +
      '<ol class="ranking">' + S.players.map(function (p, i) {
        return '<li class="' + (p.human ? 'is-human' : '') + '"><span class="place">' +
          ['大富豪（1位）','富豪（2位）','貧民（3位）','大貧民（4位）'][i] + '</span><span>' +
          (p.human ? '🐱 あなた' : '🤖 ' + p.name) + '</span><small>⭐' + (4 - i) + '</small></li>';
      }).join('') + '</ol>' +
      '<p class="total-head">これまでの成績（3ゲーム目）</p><ul class="totals">' +
      S.players.map(function (p, i) {
        return '<li><span>' + (p.human ? '🐱 あなた' : '🤖 ' + p.name) + '</span><small>⭐' + (10 - i) + ' ・ 1位 ' + (i === 0 ? 2 : 0) + '回</small></li>';
      }).join('') + '</ul>';
    dlg('resultDialog');
  }
  function dlg(id) { closeAll(); try { $(id).showModal(); } catch (e) {} }
  function closeAll() {
    ['helpDialog', 'rulesDialog', 'resultDialog'].forEach(function (id) {
      var d = $(id); if (d && d.open) { try { d.close(); } catch (e) {} }
    });
  }

  /* ============================================================
     ★★★ 自分の 番に、★手札と ボタンが 画面の 中に あるか（★本物の 試合の 1手ごと）
     ------------------------------------------------------------
     ★ ★★ここが この 見張りの 心臓です。★私は はじめ、★自分で 作った「まれな 場面」で
       ★ ★はみ出しを 鳴らして いました ―― ★★あれは 私が 決めた 場面 なので、
         ★ ★★私が きびしく すれば 鳴るし、★ゆるく すれば 鳴りません（＝ものさしに ならない）。
     ★ ★★だから ★**本物の 試合の 1手ごと** に 測ります。
       ★ ★見るのは 2つだけ：★①手札の 札の まん中が 画面の 中に あるか
         ★ ★★②「出す」「パス」が 画面の 中に あるか。
     ★ ★★七並べの「手札が 見切れる」（T177 #7）は これで 拾えます。
     ============================================================ */
  function measurePlay() {
    var out = { cardOut: 0, btnOut: 0, who: '' };
    var cs = $('hand').querySelectorAll('[data-key]');
    for (var i = 0; i < cs.length; i++) {
      var q = cs[i].getBoundingClientRect();
      var cx = q.left + q.width / 2, cy = q.top + q.height / 2;
      if (cx < 0 || cy < 0 || cx > innerWidth || cy > innerHeight) {
        out.cardOut++;
        if (!out.who) out.who = '手札の札 まん中 y=' + Math.round(cy) + '（画面 ' + innerHeight + '）';
      }
    }
    ['playBtn', 'passBtn'].forEach(function (id) {
      var b = $(id);
      if (!b || !visible(b)) return;
      var q2 = b.getBoundingClientRect();
      if (q2.bottom > innerHeight + 0.5 || q2.top < -0.5 || q2.right > innerWidth + 0.5 || q2.left < -0.5) {
        out.btnOut++;
        if (!out.who) out.who = '#' + id + ' 下端 y=' + Math.round(q2.bottom) + '（画面 ' + innerHeight + '）';
      }
    });
    return out;
  }

  function measureOnce() {
    var out = { over: 0, overWho: '', off: 0, offWho: [], small: 0, smallWho: [], rec: {},
                gameScrollY: false,
                scrollX: document.documentElement.scrollWidth > innerWidth + 0.5,
                scrollY: document.documentElement.scrollHeight > innerHeight + 0.5 };
    /* ★ はみ出し ―― ★★画面（viewport）から どれだけ 外へ 出たか */
    var cards = document.querySelectorAll('#hand .card,#field .card,#cpuArea .cpu-card,.flag,#ruleFlash');
    for (var i = 0; i < cards.length; i++) {
      var q = cards[i].getBoundingClientRect();
      if (q.width < 0.5) continue;
      var d = Math.max(Math.round(-q.left), Math.round(-q.top),
                       Math.round(q.right - innerWidth), Math.round(q.bottom - innerHeight));
      if (d > out.over) { out.over = d; out.overWho = cards[i].className; }
    }
    out.over = Math.max(0, out.over);
    /* ★★ 遊んで いる 最中の 画面が 縦に のびて いないか（★七並べ T109・大富豪 T114 の 形）*/
    var gs = $('gameScreen');
    if (gs && !gs.classList.contains('hidden') && !openDialog()) {
      out.gameScrollY = gs.scrollHeight > gs.clientHeight + 1 ||
                        document.documentElement.scrollHeight > innerHeight + 1;
    }
    /* ★ 押す ところ：★★届くか／44pxの 的 */
    var l = tapList();
    for (var j = 0; j < l.length; j++) {
      var el = l[j];
      if (unreachable(el)) { out.off++; if (out.offWho.length < 4) out.offWho.push(tapName(el)); }
      /* ⚠️★★ 画面の 外に ある ものの「指の的」を 測っては いけません【私の 失敗⑦】。
         ★ ★まん中が 画面の 外なので 当たりは かならず 1×1px に なり、
           ★ ★★「はじめるボタンが 1×1px」と 4件 うそを 言いました。
         ★ ★★画面の 中に 入って いる ものだけ 測ります（★外なら 上の「届くか」が 見ます）。 */
      if (outOfView(el)) continue;
      var r = reach(el), nm = tapName(el);
      if (!out.rec[nm] || r.w * r.h < out.rec[nm][0] * out.rec[nm][1]) out.rec[nm] = [r.w, r.h];
      if (isMust44(el) && (r.w < 44 || r.h < 44)) {
        out.small++; if (out.smallWho.length < 4) out.smallWho.push(nm + ' ' + r.w + '×' + r.h + 'px');
      }
    }
    return out;
  }

  function fitTest() {
    var rows = [], worst = 0, worstAt = '', rareWorst = 0, rareAt = '';
    var offN = 0, offWho = {}, smallN = 0, smallWho = {}, sx = 0, gsy = 0, rec = {};
    var keep = snapshot();
    still(function () {
      withRandom(seedFixed || 20260831, function () {
        for (var i = 0; i < SCENES.length; i++) {
          try { SCENES[i].f(); } catch (e) { rows.push(SCENES[i].n + '：★作れず（' + e.message + '）'); continue; }
          var m = measureOnce();
          if (SCENES[i].rare) {
            if (m.over > rareWorst) { rareWorst = m.over; rareAt = SCENES[i].n + '：' + m.overWho; }
          } else if (m.over > worst) { worst = m.over; worstAt = SCENES[i].n + '：' + m.overWho; }
          offN += m.off; smallN += m.small;
          m.offWho.forEach(function (x) { offWho[x] = 1; });
          m.smallWho.forEach(function (x) { smallWho[x] = 1; });
          for (var k in m.rec) if (!rec[k] || m.rec[k][0] * m.rec[k][1] < rec[k][0] * rec[k][1]) rec[k] = m.rec[k];
          if (m.scrollX) sx++;
          if (m.gameScrollY) gsy++;
          rows.push(SCENES[i].n + '：はみ出し ' + m.over + 'px／届かない ' + m.off + '／44px割れ ' + m.small);
        }
      });
    });
    restore(keep);
    var recRows = [];
    for (var k2 in rec) recRows.push(k2 + ' ' + rec[k2][0] + '×' + rec[k2][1] + 'px');
    recRows.sort();
    var out = {
      '画面': innerWidth + '×' + innerHeight,
      '調べた場面': SCENES.length + '（★ふだんの形 ' + SCENES.filter(function (s) { return !s.rare; }).length +
                    '・★まれな形 ' + SCENES.filter(function (s) { return s.rare; }).length + '）',
      '★はみ出し・ふだんの形（一番大きい）': worst + 'px' + (worst ? '（' + worstAt + '）' : ''),
      '★はみ出し・まれな形（★鳴らない・記録だけ）': rareWorst + 'px' + (rareWorst ? '（' + rareAt + '）' : ''),
      '★★押すところが届かない': offN + '件',
      '★44pxを割った（いつも押すボタン）': smallN + '件',
      '★遊んでいる画面が縦にのびた場面': gsy,
      '横スクロールが出た場面': sx,
      '★指の的（★一番小さい時・例外は記録だけ）': recRows,
      '中身': rows
    };
    if (offN) out['届かなかったもの'] = Object.keys(offWho);
    if (smallN) out['44pxを割ったもの'] = Object.keys(smallWho);
    if (root.console) console.log('[大富豪] fitTest', out);
    return out;
  }

  /* ============================================================
     ★ 4. いまの ようす／寸法
     ============================================================ */
  function now() {
    var p = S.players[0];
    return {
      '★いま': S.players.length ? (S.over ? 'ゲーム終わり' : (S.pending ? 'えらんでいる最中' : (S.busy ? 'ロボットの番' : 'あなたの番'))) : 'はじめの画面',
      '★何ゲーム目': S.gameNo,
      '★ONのルール': DF.RULES.filter(function (r) { return S.ruleOn[r.id]; }).map(function (r) { return r.name; }).join('・') || '（なし）',
      '★手番': S.players.length ? S.players[S.turn].name : '―',
      '★自分の手札': p ? p.cards.map(function (c) { return c.joker ? '🃏' : c.mark + c.rank; }).join(' ') : '―',
      '★みんなの手札': S.players.length ? S.players.map(function (x) { return x.cards.length; }).join(' / ') : '―',
      '★場': S.field ? S.field.cards.map(function (c) { return c.joker ? '🃏' : c.mark + c.rank; }).join(' ') + '（' + S.field.by + '）' : 'からっぽ',
      '★強さ': DF.reversed() ? '★ぎゃく' : 'ふつう',
      '★縛り': S.lock ? S.lock.join('・') : 'なし',
      '★「出す」が押せるか': $('playBtn') && !$('playBtn').disabled ? 'はい' : 'いいえ',
      '★「パス」が押せるか': $('passBtn') && !$('passBtn').disabled ? 'はい' : 'いいえ',
      '★★いま押せるもの': tapList().filter(reallyTappable).length + '個',
      '★読めた絵': DF.warm ? (DF.warm()['読み終えた'] + ' / ' + DF.warm()['ぜんぶ']) : '―'
    };
  }

  function geoInfo() {
    return still(function () {
      function box(sel) {
        var e = document.querySelector(sel);
        if (!e || !visible(e)) return '（出ていない）';
        var q = e.getBoundingClientRect(), r = reach(e);
        return Math.round(q.width * 100) / 100 + '×' + Math.round(q.height * 100) / 100 +
               'px（★当たり ' + r.w + '×' + r.h + 'px／44pxに対して ' + Math.round(r.w / 44 * 100) + '%）';
      }
      return {
        '画面': innerWidth + '×' + innerHeight,
        '★自分の札': box('#hand .card'),
        '★場の札': box('#field .card'),
        'ロボットの札（うら）': box('#cpuArea .cpu-card'),
        '★「出す」': box('.play-button'),
        '★「パス」': box('.pass-button'),
        '★「別の形にする」': box('.alt-button'),
        '★「遊び方」': box('.howto'),
        '★「はじめる」': box('.start-button'),
        '★ルールの1行': box('#ruleList label.rule-row'),
        '手札の帯': box('.hand-zone') === '（出ていない）' ? box('#hand') : box('.hand-zone'),
        'ページ横スクロール': document.documentElement.scrollWidth > innerWidth + 0.5,
        'ページ縦スクロール': document.documentElement.scrollHeight > innerHeight + 0.5
      };
    });
  }

  function seed(n) {
    seedFixed = (n | 0) || 0;
    return { '★種': seedFixed || '（毎回ちがう）', '★次の1回から効きます': true };
  }

  /* ============================================================
     ★ 5. さわった ものを 戻す（★T144 §7-5・★見張りは 見るだけ）
     ============================================================ */
  function snapshot() {
    return {
      preset: S.preset,
      ruleOn: JSON.parse(JSON.stringify(S.ruleOn)),
      hands: S.players.map(function (p) { return p.cards.map(function (c) { return c.key; }); }),
      who: S.players.map(function (p) { return [p.done, p.passed, p.place, p.foul]; }),
      fieldKeys: S.field ? S.field.cards.map(function (c) { return c.key; }) : null,
      fieldBy: S.field ? S.field.by : '',
      over: S.over, busy: S.busy, epoch: S.epoch,
      rev: S.revolution, jb: S.jackBack, rd: S.revDir, lk: S.lock ? S.lock.slice() : null,
      flags: [S.revolution, S.jackBack, S.revDir, S.lock ? S.lock.join(',') : '', S.crown, S.turn, S.over, S.busy].join('|'),
      crown: S.crown, lastRank: S.lastRank ? S.lastRank.slice() : null, nextStarter: S.nextStarter, turn: S.turn,
      field: S.field ? S.field.cards.map(function (c) { return c.key; }).join(',') : '',
      pending: S.pending ? S.pending.type : '',
      msg: $('message') ? $('message').textContent : '',
      startHid: $('startScreen').classList.contains('hidden'),
      gameHid: $('gameScreen').classList.contains('hidden'),
      dlg: ['helpDialog', 'rulesDialog', 'resultDialog'].map(function (id) { return $(id).open ? 1 : 0; }).join(''),
      totals: JSON.stringify(S.totals),
      gameNo: S.gameNo
    };
  }
  /* ★★ 見張りは 見るだけ ―― ★さわった ものは 1つ 残らず 戻す（★T144 §7-5）。
     ★ ★★遊んで いる 最中に 呼ばれても、★★試合が こわれない ように 手札・場・番まで 戻します。
       ★ ★（★止まった タイマーは 戻せません ―― ★S.epoch を 1つ 進めて、
         ★ ★★見張りが 走らせた 古い タイマーが 生き返らない ように します）。 */
  function restore(k) {
    closeAll(); openFold(false);
    S.epoch += 1;
    S.pending = null; S.after = null;
    S.selected = []; S.altIndex = 0; S.warnKey = '';
    var fb0 = $('ruleFlash');
    if (fb0) { fb0.classList.remove('show'); fb0.textContent = ''; }

    S.preset = k.preset === 'custom' ? 'normal' : k.preset;
    DF.preset(S.preset);
    if (k.preset === 'custom') { S.preset = 'custom'; for (var id in k.ruleOn) S.ruleOn[id] = k.ruleOn[id]; }

    if (!k.hands.length) {
      S.players = []; S.field = null;
      $('field').innerHTML = ''; $('hand').innerHTML = ''; $('cpuArea').innerHTML = ''; $('flagRow').innerHTML = '';
    } else {
      if (!S.players.length) DF.start(false);
      for (var i = 0; i < k.hands.length && i < S.players.length; i++) {
        DF.hand(i, k.hands[i]);
        S.players[i].done = k.who[i][0]; S.players[i].passed = k.who[i][1];
        S.players[i].place = k.who[i][2]; S.players[i].foul = k.who[i][3];
      }
      if (k.fieldKeys) DF.put(k.fieldKeys, k.fieldBy); else S.field = null;
    }
    S.revolution = k.rev; S.jackBack = k.jb; S.revDir = k.rd; S.lock = k.lk;
    S.crown = k.crown; S.lastRank = k.lastRank; S.nextStarter = k.nextStarter; S.turn = k.turn;
    S.totals = JSON.parse(k.totals); S.gameNo = k.gameNo;
    S.over = k.over; S.busy = k.busy;

    if (k.startHid) $('startScreen').classList.add('hidden'); else $('startScreen').classList.remove('hidden');
    if (k.gameHid) $('gameScreen').classList.add('hidden'); else $('gameScreen').classList.remove('hidden');
    if (S.players.length) DF.render();
    if ($('message')) $('message').textContent = k.msg;
  }

  /* ============================================================
     ★★★ 6. verify ―― 見張り 本体
     ------------------------------------------------------------
     ★【共】＝ 8本ぜんぶに要る目（そのまま写せる）
     ★【富】＝ 大富豪にしかない目（書きかえが要る）

      ①【共】決まりの通り（★配り54枚・増えない・生き返らない・詰み0・終わらない0・例外0）
      ②【共】★★押せるものが 1つ以上ある（★自分の番の 1手ごと）
      ②-2【共】★★★本物の試合の 1手ごとに、手札と「出す」「パス」が 画面の中に あるか
             ★（★これが この 見張りの 心臓。★七並べ T177 #7「手札が見切れる」と 同じ 形）
      ③【共】★★2段階で出ない（★札が現れた時に絵が手元にあるか）
      ③-2【共】★★わざと 絵を 剥がして 鳴らす
      ④【共】白い札 0（★絵が無い時は 文字の仮の札が 必ず見える）
      ⑤【共】強調が 混ざらない（★光り と みどり が 同時に出ない）
      ⑥【共】★★押すところに スクロールしても 届かない 0件・横スクロール 0（★12場面）
             ★（★はみ出しの px は **鳴らしません** ―― ★場面を 作って いるのは 私 なので）
      ⑦【共】44pxの指の的（★いつも押すボタンだけ 鳴る。★ほかは 例外として 数字で記録）
      ⑧【共】★本物の pointerdown/up/click で 札がえらべて「出す」が効く
      ⑨【共】しまったものが消えない（★大富豪は 保存を持たない ＝ 書き込み0）
      ⑨-2【共】★★わざと 書き込んで 鳴らす
      ⑩【共】★★見張りが生きているか（★NGが「数」・わざと1件足すと1増える）
      ⑪【共】★★さわったものを ぜんぶ戻したか（★遊んでいる最中に呼んでも 試合がこわれない）
      ⑫【富】ルール15個が ぜんぶ ready・3段が はしご・needs が効く
      ⑬【富】★★わざと 8切りを 殺して 鳴らす
      ⑭【富】ルール名が RULES 1か所から出ている（DF.renameAll・T140）
      ⑮【富】強さの帯が 逆転と 一致する（★4通り）
      ⑯【富】縛り・都落ち・逆まわりに 必ずバッジが出る（★ルルの条件）
      ⑰【富】上がり禁止の 3段がまえ（とまる→警告→反則）
      ⑱【富】順位が 1〜4 で 一意
      ⑲【富】★★15個の ルールが ほんとうに 出るか（★T94：4つが 60試合 ねむって いた）
      ★★まとめ … わざと 壊して 鳴らす 6通り（①②⑤⑥⑦⑯）＋ その場の 4通り（③⑨⑬⑩）

     ★★数字を出すだけ・鳴らないもの（★T182 アトの 格下げ）
      Ⓐ 画面に出る漢字の一覧（★学年の表を 私が 完全に 持って いないので 鳴らさない）
      Ⓑ 強調の種類の数
      ⑥・⑦-2 の はみ出しpx と 指の的（★もとから 44pxを 割って いる ところ）
     ============================================================ */
  function verify(n) {
    /* ★ 150 は「★階段革命（★いちばん まれな ルール・100試合で 2回）が 出きる」ところで 決めました。
       ★ ★これより 少ないと ⑲は 鳴らしません（★空うちを させない ため）。 */
    n = n || 150;
    var ng = [], note = {}, t0 = Date.now(), i;
    var keep = snapshot();
    var ver = { ring: 0, tried: 0, why: [] };   /* ★わざと壊した 回数／鳴った 回数 */

    /* ── ①【共】決まりの通り ───────────────────────── */
    var a1 = autoPlay(n, { preset: 'all', human: 'weak', seed: 31337 });
    var a2 = autoPlay(Math.max(8, Math.round(n / 3)), { preset: 'normal', human: 'strong', seed: 90210 });
    var a3 = autoPlay(Math.max(8, Math.round(n / 3)), { preset: 'easy', human: 'many', seed: 246810 });
    [['ぜんぶON', a1], ['ふつう', a2], ['かんたん', a3]].forEach(function (p) {
      var r = p[1];
      if (parseInt(r['★★配った直後が54枚でない'], 10)) ng.push('★★★' + p[0] + '：配った直後が 54枚では ありません（' + r['★★配った直後が54枚でない'] + '）');
      if (parseInt(r['★★札が増えた'], 10)) ng.push('★★★' + p[0] + '：札が 増えました（' + r['★★札が増えた'] + '）');
      if (parseInt(r['★★消えた札が生き返った'], 10)) ng.push('★★★' + p[0] + '：消えた札が 生き返りました（' + r['★★消えた札が生き返った'] + '）');
      if (parseInt(r['★★同じ札が2枚'], 10)) ng.push('★★★' + p[0] + '：同じ札が2枚になりました（' + r['★★同じ札が2枚'] + '）');
      if (parseInt(r['★★詰み（押せる手が1つも無い）'], 10)) ng.push('★★★' + p[0] + '：詰み（場が空なのに出せない）が ' + r['★★詰み（押せる手が1つも無い）']);
      if (parseInt(r['★★止まった試合（誰の番でもない）'], 10)) ng.push('★★★' + p[0] + '：手番が だれにも 回らない試合が ' + r['★★止まった試合（誰の番でもない）']);
      if (parseInt(r['★終わらない試合'], 10)) ng.push('★★★' + p[0] + '：終わらない試合が ' + r['★終わらない試合']);
      if (parseInt(r['★★順位が1〜4で一意でない'], 10)) ng.push('★★★' + p[0] + '：順位が 1〜4 で一意でない（' + r['★★順位が1〜4で一意でない'] + '）');
      if (parseInt(r['★例外（画面の中で投げられたもの）'], 10)) ng.push('★★★' + p[0] + '：例外が ' + r['★例外（画面の中で投げられたもの）']);
    });
    note['① 【共】' + (n + Math.max(8, Math.round(n / 3)) * 2) + '試合'] =
      'ぜんぶON：配り54枚 ' + a1['★★配った直後が54枚でない'] + '／増えた ' + a1['★★札が増えた'] +
      '／生き返り ' + a1['★★消えた札が生き返った'] + '／詰み ' + a1['★★詰み（押せる手が1つも無い）'] +
      '／終わらない ' + a1['★終わらない試合'] + '／例外 ' + a1['★例外（画面の中で投げられたもの）'] +
      '／★手札の最大 ' + a1['★★手札の最大'] + '／人が1位 ' + a1['★人が1位'];

    /* ── ⑲【富】★★ルール15個が ほんとうに 出るか ─────────────────
       ★ ★T94【実測】：★ロボットが 1枚出ししか しなかった せいで、
         ★ ★★革命・階段・階段革命・ジョーカーワイルドの 4つが **60試合で 1回も 出ません でした**。
         ★ ★★ONに なって いる ことと、★出る ことは 別 です。 */
    var sleepy = a1['★★一度も出なかったルール'];
    var enough = a1['回数'] >= 100;
    if (enough && sleepy.length) ng.push('★★★ぜんぶONの ' + a1['回数'] + '試合で 一度も 出なかった ルールが ' +
      sleepy.length + '個：' + sleepy.join('・'));
    note['⑲ 【富】出たルール（ぜんぶON・' + a1['回数'] + '試合）'] = a1['★★出たルール'] +
      (enough ? '' : '　★★試合数が 100に とどかないので 鳴らしません（★階段革命は 100試合で 2回。' +
                     '★少ない 回数で 鳴らすと きれいな 版でも 鳴ります ―― ★T182 の 教え）');

    /* ── ②③④⑤【共】画面つきで 1手ずつ 見る ─────────────── */
    var ui = autoPlay(Math.max(4, Math.round(n / 8)), { preset: 'all', human: 'weak', seed: 555, ui: true });
    if (parseInt(ui['★★押せるものが1つも無い場面'], 10)) ng.push('★★★押せるものが 1つも無い場面が ' + ui['★★押せるものが1つも無い場面']);
    if (parseInt(ui['★★札が出た時に絵が無かった'], 10)) ng.push('★★★2段階：札が出た時に 絵が 手元に ありませんでした（' + ui['★★札が出た時に絵が無かった'] + '）');
    if (parseInt(ui['★★白い札'], 10)) ng.push('★★★白い札（絵も 文字の札も 見えない）が ' + ui['★★白い札']);
    if (parseInt(ui['★★光りとみどりが混ざった'], 10)) ng.push('★★★光り（出せる）と みどり（いっしょに出せる）が 同時に 出ました（' + ui['★★光りとみどりが混ざった'] + '）');
    /* ★★ 本物の 試合の 1手ごとに 測った「見切れ」（★七並べ T177 #7 と 同じ 形）*/
    if (parseInt(ui['★★手札の札が画面の外'], 10)) ng.push('★★★自分の番なのに 手札の札の まん中が 画面の 外に 出ました（' +
      ui['★★手札の札が画面の外'] + '）―― ★★指で さわれません');
    if (parseInt(ui['★★「出す」「パス」が画面の外'], 10)) ng.push('★★★自分の番なのに「出す」か「パス」が 画面の 外に 出ました（' +
      ui['★★「出す」「パス」が画面の外'] + '）');
    note['② 【共】押せるもの'] = ui['★★押せるものが1つも無い場面'];
    note['②-2 【共】★★本物の試合での見切れ'] = '自分の番 ' + ui['★★自分の番の場面'] +
      '／★手札が 画面の外 ' + ui['★★手札の札が画面の外'] + '／★ボタンが 画面の外 ' + ui['★★「出す」「パス」が画面の外'];
    note['③ 【共】★★2段階'] = '札が出た時に 絵が 無かった ' + ui['★★札が出た時に絵が無かった'] +
                              '／★読み終えた絵 ' + (DF.warm ? DF.warm()['読み終えた'] + '/' + DF.warm()['ぜんぶ'] : '―');
    note['④ 【共】白い札'] = ui['★★白い札'];
    note['⑤ 【共】強調が混ざらない'] = ui['★★光りとみどりが混ざった'];

    /* ── ③-2【共】★★わざと 絵を 剥がして 鳴らす ─────────────
       ★ ★★どの 大きさでも 鳴ります（★回線も 画面の 向きも 関係ない）――
         ★ ★T181 の「その画面を回さないと鳴らない」を 避ける ため。 */
    ver.tried++;
    var kill3 = (function () {
      var box = $('field'), keepHtml = box.innerHTML;
      var bust = Date.now() + '-' + Math.random();
      box.innerHTML =
        '<div class="card black" role="img" aria-label="わざと壊した札">' +
        '<span class="fallback"><span class="pip">♠</span></span>' +
        '<img class="face-img" src="../cards/' + encodeURIComponent('スペードA') + '.png?dfv=' + bust + '" alt="">' +
        '</div>';
      var s = scanImgs(box);
      box.innerHTML = keepHtml;
      return s.notReady;
    })();
    if (kill3 >= 1) ver.ring++;
    else { ng.push('★★★見張りが 死んでいます：★絵を わざと 剥がしても ③が 鳴りません'); ver.why.push('③'); }
    note['③-2 【共】★★わざと剥がす'] = kill3 >= 1 ? '★鳴った（' + kill3 + '件）' : '★★鳴らない';

    /* ── ⑥⑦【共】はみ出し・44px ─────────────────────── */
    var ft = fitTest();
    if (parseInt(ft['★★押すところが届かない'], 10)) ng.push('★★★押すところに スクロールしても 届きません：' +
      ft['★★押すところが届かない'] + '（' + (ft['届かなかったもの'] || []).join('・') + '）');
    if (parseInt(ft['★44pxを割った（いつも押すボタン）'], 10)) ng.push('★★★いつも押すボタンが 44pxを 割りました：' +
      ft['★44pxを割った（いつも押すボタン）'] + '（' + (ft['44pxを割ったもの'] || []).join('・') + '）');
    if (ft['横スクロールが出た場面']) ng.push('★★★横スクロールが ' + ft['横スクロールが出た場面'] + '場面で 出ました');
    /* ★★ はみ出しの px は **鳴らしません**【★私の 失敗⑨】。
       ★ ★★場面を 作って いるのは 私 なので、★私が きびしく すれば 鳴り、ゆるく すれば 鳴りません
         ★ ―― ★★それは ものさしでは ありません。★★鳴らすのは ②-2（本物の 試合の 1手ごと）です。
       ★ ★ここは「黙って 縮んだら 気づく」ための 数字として 残します。 */
    note['⑥ 【共】はみ出し（★鳴らない・読むための数字）'] = 'ふだんの形 ' + ft['★はみ出し・ふだんの形（一番大きい）'] +
                              '／★まれな形 ' + ft['★はみ出し・まれな形（★鳴らない・記録だけ）'] +
                              '／届かない ' + ft['★★押すところが届かない'] +
                              '／横スクロール ' + ft['横スクロールが出た場面'] +
                              '／遊ぶ画面の縦のび ' + ft['★遊んでいる画面が縦にのびた場面'] +
                              '／' + ft['調べた場面'];
    note['⑦ 【共】44px（いつも押すボタン）'] = ft['★44pxを割った（いつも押すボタン）'] +
      '（★見た ボタン：' + MUST44.join('・') + '）';
    /* ★★ もとから 44pxを 割って いる ところは「例外として 記録」（★T177 C）。
       ★ ★大富豪は 公開ずみで、★これは 社長が 通した 形 なので **鳴らしません**。
       ★ ★★でも 数字は 必ず 残します ―― ★★黙って 縮んだら、この 数字で 気づけます。 */
    note['⑦-2 【共】★指の的（★鳴らない・例外として記録）'] = ft['★指の的（★一番小さい時・例外は記録だけ）'];

    /* ── ⑧【共】本物の pointerdown/up/click で 通るか ───────────
       ★ ★★`.click()` は 使いません ―― ★それだと 当たり判定を 飛ばして しまうので、
         ★ ★★「押せるように 見えるのに 押せない」を 1件も 見つけられません。 */
    var t8 = still(function () {
      play(14, 0);                                  /* ★場が 空 ＝ 何でも 出せる */
      S.selected = []; DF.render();
      var card = $('hand').querySelector('[data-key]:not([disabled])');
      if (!card) return { ok: false, why: '押せる札が 1枚も ありません' };
      var q = card.getBoundingClientRect();
      var x = q.left + q.width / 2, y = q.top + q.height / 2;
      var hit = hitAt(x, y);
      if (!(hit === card || card.contains(hit))) return { ok: false, why: 'まん中を さしても その札が 返りません' };
      firePointer(hit, x, y);
      if (!S.selected.length) return { ok: false, why: '本物の指で 押しても えらばれません' };
      var btn = $('playBtn');
      if (btn.disabled) return { ok: false, why: '1枚えらんだのに「出す」が 押せません' };
      var before = S.players[0].cards.length;
      var bq = btn.getBoundingClientRect();
      firePointer(hitAt(bq.left + bq.width / 2, bq.top + bq.height / 2) || btn, bq.left + bq.width / 2, bq.top + bq.height / 2);
      return { ok: S.players[0].cards.length < before, why: '「出す」を 押しても 手札が 減りません', n: before - S.players[0].cards.length };
    });
    if (!t8.ok) ng.push('★★★本物の 指で 通りません：' + t8.why);
    note['⑧ 【共】本物の指'] = t8.ok ? '★1枚 えらんで 出せた（手札 −' + t8.n + '枚）' : '★★' + t8.why;

    /* ── ⑨【共】しまったものが 消えないか ──────────────────
       ★ ★★大富豪は「ブラウザを 閉じたら 消える」が **社長の 決め**です（game.js §state.totals）。
         ★ ★だから この 本の 目は「★保存を 持って いない ことを 確かめる」に なります。
         ★ ★★ハーツ・フリーセルなど 保存を 持つ 本では、ここが「続きが 0点に 上書きされない」に 変わります。 */
    var t9 = countStorage(function () {
      autoPlay(2, { preset: 'all', human: 'weak', seed: 777 });
    });
    if (t9.writes) ng.push('★★★保存を 持たない はずなのに ' + t9.writes + '回 書き込みました（' + t9.keys.join('・') + '）');
    note['⑨ 【共】保存'] = '書き込み ' + t9.writes + '回（★大富豪は 0回が 正）／いま入っている鍵 ' + t9.have + '件';

    ver.tried++;
    var t92 = countStorage(function () {
      try { localStorage.setItem('dfv-ためし', '1'); localStorage.removeItem('dfv-ためし'); } catch (e) {}
    });
    if (t92.writes >= 1) ver.ring++;
    else { ng.push('★★★見張りが 死んでいます：★わざと 書き込んでも ⑨が 鳴りません'); ver.why.push('⑨'); }
    note['⑨-2 【共】★★わざと書き込む'] = t92.writes >= 1 ? '★鳴った（' + t92.writes + '回）' : '★★鳴らない';

    /* ── ⑫【富】ルール15個 ─────────────────────────── */
    var R = DF.RULES;
    var notReady = R.filter(function (r) { return !r.ready; });
    if (R.length !== 15) ng.push('★★★ルールが ' + R.length + '個です（★15個の はず）');
    if (notReady.length) ng.push('★★★準備中の ルールが ' + notReady.length + '個（' + notReady.map(function (r) { return r.name; }).join('・') + '）');
    var cnt = {};
    ['easy', 'normal', 'all'].forEach(function (p) { cnt[p] = R.filter(function (r) { return r.presets.indexOf(p) >= 0; }).length; });
    if (!(cnt.easy < cnt.normal && cnt.normal < cnt.all)) {
      ng.push('★★★3段が はしごに なって いません（かんたん ' + cnt.easy + '／ふつう ' + cnt.normal + '／ぜんぶ ' + cnt.all + '）');
    }
    if (cnt.all !== R.length) ng.push('★★★「ぜんぶ」なのに ' + cnt.all + '/' + R.length + '個 しか ONに なりません');
    /* ★ needs が 効くか：階段革命は 階段と革命が ONで ないと 効かない */
    DF.preset('all'); S.ruleOn.stairs = false;
    var needOk = (DF.ruleLive('stairRev') === false);
    DF.preset('all');
    if (!needOk) ng.push('★★★階段を OFFに しても 階段革命が 生きて います（needs が 効いて いません）');
    note['⑫ 【富】ルール15個'] = R.length + '個・準備中 ' + notReady.length + '／かんたん ' + cnt.easy +
                                '→ふつう ' + cnt.normal + '→ぜんぶ ' + cnt.all + '／needs ' + (needOk ? '効く' : '★効かない');

    /* ── ⑬【富】★★わざと 1つ 殺して 鳴らす ────────────────
       ★ ★①だけだと ―― ★ルールを まるごと 外しても、たまたま 出なければ 通ります。
         ★ ★★だから 8切りを OFFに して「8を出しても 場が 流れない」ことを その場で 見せます。 */
    ver.tried++;
    var t13 = still(function () {
      var out = { on: null, off: null };
      var kp = snapshot();
      /* ★ 8切りON：♠8 を 出したら 場が 流れる（field が null に なる） */
      out.on  = eightCutRuns(true);
      out.off = eightCutRuns(false);
      restore(kp);
      return out;
    });
    if (t13.on === true && t13.off === false) ver.ring++;
    else {
      ng.push('★★★くらべが 効いて いません：★8切りON で 流れる=' + t13.on + '／OFF で 流れる=' + t13.off +
              '（★ON で 流れ、OFF で 流れない、が 正）');
      ver.why.push('⑬');
    }
    note['⑬ 【富】★★8切りを殺す'] = '★ON：場が流れた=' + t13.on + '　★★OFFに戻すと：場が流れた=' + t13.off;

    /* ── ⑭【富】ルール名が RULES 1か所から 出ているか（T140）────── */
    var t14 = still(function () {
      var orig = R.map(function (r) { return r.name; });
      DF.preset('all');
      play(11, 1);
      DF.renameAll();
      var txt = document.body.innerText || '';
      var left = orig.filter(function (nm) { return nm && txt.indexOf(nm) >= 0; });
      DF.renameAll('もどす');
      DF.render();
      return left;
    });
    if (t14.length) ng.push('★★★ルール名が 直書きされて います：' + t14.join('・') + '（★RULES を 直しても 画面が ついてきません）');
    note['⑭ 【富】名前の出どころ'] = t14.length ? '★★直書き ' + t14.length + '件' : '★RULES 1か所（直書き 0件）';

    /* ── ⑮【富】強さの帯が 逆転と 一致するか ───────────────── */
    var t15 = still(function () {
      play(11, 1);
      var out = [];
      [[false, false], [true, false], [false, true], [true, true]].forEach(function (f) {
        S.revolution = f[0]; S.jackBack = f[1];
        DF.render();
        var band = ($('flagRow').textContent || '');
        var rev = DF.reversed();
        var says = band.indexOf('弱い 2 A K') >= 0;
        out.push({ rev: rev, says: says, ok: rev === says });
      });
      return out;
    });
    var bad15 = t15.filter(function (x) { return !x.ok; }).length;
    if (bad15) ng.push('★★★強さの帯が 中身と ちがいます（4通りのうち ' + bad15 + '通り）');
    note['⑮ 【富】強さの帯'] = t15.map(function (x, k) {
      return ['ふつう', '革命', 'Jバック', '革命＋Jバック'][k] + '＝' + (x.rev ? 'ぎゃく' : 'ふつう') + (x.ok ? '○' : '★✕');
    }).join('／');

    /* ── ⑯【富】縛り・都落ちに かならず バッジ ─────────────── */
    var t16 = still(function () {
      DF.preset('all');
      play(11, 1);
      S.lock = ['spades']; S.crown = 0; S.revDir = true;
      DF.render();
      /* ★★T187（🎨アト）― ★トライ T186 §5-2 の すきまを ふさぎました。
         ★ ★まえは `$('flagRow').textContent` ＝ **字が あるか** だけを 見て いました。
           ★ ★★だから CSS で `opacity:0; visibility:hidden` に された バッジは
             ★ ★★字が のこる ので ⑯が **鳴りません** でした（★トライの 実測）。
         ★ ★★これは 私（アト）が style.css を 直す 仕事で ★まさに 起きる 形の 穴です。
         ★ ★直し方：★verify が すでに 持って いる `visible()` を 通すだけ。
           ★ `visible()` は ブラウザ自身の `checkVisibility()` を 聞く ので、
           ★ ★★②（押せるもの）⑥（届くか）⑦（指の的）と **同じ ものさし** ＝ 二重帳簿に なりません。 */
      return { lock: badgeShown('🔒'), crown: badgeShown('👑'), dir: badgeShown('ぎゃくまわり') };
    });
    if (!t16.lock)  ng.push('★★★縛り中なのに 🔒バッジが 出ません（★ルルの条件：バッジが 無いなら 縛りを 入れない）');
    if (!t16.crown) ng.push('★★★都落ちで ねらわれて いるのに 👑バッジが 出ません');
    if (!t16.dir)   ng.push('★★★9リバースで 逆まわりなのに 帯に 出ません');
    note['⑯ 【富】バッジ'] = '🔒' + (t16.lock ? '○' : '★✕') + '／👑' + (t16.crown ? '○' : '★✕') + '／↺' + (t16.dir ? '○' : '★✕');

    /* ── ⑰【富】上がり禁止の 3段がまえ ───────────────────── */
    var t17 = still(function () {
      DF.preset('all');
      play(11, 1);
      /* ①「ほかに 手が ある（＝パスできる）」→ 2 は とまる（cant-finish）
         ⚠️★ はじめ 手札を 2枚（♠2・♥5）に して いました【私の 失敗⑤】。
            ★ ★「上がり禁止」は **その手で 手札が 0枚に なる** ときの 決まりなので、
              ★ ★2枚 持って いたら そもそも 当てはまりません ―― ★★空うちでした。
            ★ ★★正しい 場面は「★手札が ♠2 の 1枚だけ・場に 弱い 札」。 */
      DF.hand(0, ['spades-2']);
      DF.put(['clubs-3'], 'ロボット1');
      S.turn = 0; S.busy = false; S.over = false; S.selected = [];
      S.players[0].done = false; S.players[0].passed = false; S.players[0].foul = false;
      DF.render();
      var stop = !!$('hand').querySelector('.cant-finish');
      /* ②「その手しか ない」→ 場が 空なら 出せる ＋ 黄色い 警告 */
      DF.hand(0, ['spades-2']);
      S.field = null; S.selected = ['spades-2'];
      DF.render();
      var can = !$('playBtn').disabled;
      var warn = $('playBtn').classList.contains('is-warn');
      /* ③ 1回目の「出す」は 止まる（もう1回で 確定）*/
      var before = S.players[0].cards.length;
      DF.play();
      var held = (S.players[0].cards.length === before);
      DF.play();
      var went = (S.players[0].cards.length < before);
      var foul = !!S.players[0].foul;
      return { stop: stop, can: can, warn: warn, held: held, went: went, foul: foul };
    });
    if (!t17.stop) ng.push('★★★上がり禁止①：ほかに 手が あるのに「とまる」の しるしが 出ません');
    if (!t17.can)  ng.push('★★★上がり禁止②：その手しか ないのに 出せません（★手番が 一生 進まなく なります）');
    if (!t17.warn) ng.push('★★★上がり禁止②：出せるのに 黄色い 警告が 出ません');
    if (!t17.held) ng.push('★★★上がり禁止③：1回目の「出す」で そのまま 出て しまいます');
    if (!t17.went) ng.push('★★★上がり禁止③：2回目の「出す」でも 出ません');
    if (!t17.foul) ng.push('★★★上がり禁止③：禁止の札で あがったのに 反則の しるしが つきません');
    note['⑰ 【富】上がり禁止3段'] = '①とまる' + (t17.stop ? '○' : '★✕') + '／②出せる' + (t17.can ? '○' : '★✕') +
      '＋警告' + (t17.warn ? '○' : '★✕') + '／③1回目は止まる' + (t17.held ? '○' : '★✕') +
      '・2回目で出る' + (t17.went ? '○' : '★✕') + '・反則' + (t17.foul ? '○' : '★✕');

    /* ── ⑱【富】順位・⭐（★①の 中で 数えた ものを ここに 出す）────── */
    note['⑱ 【富】順位'] = 'ぜんぶON ' + a1['★★順位が1〜4で一意でない'] + '／ふつう ' + a2['★★順位が1〜4で一意でない'] +
                          '／かんたん ' + a3['★★順位が1〜4で一意でない'];

    /* ── ⑩【共】★★見張りが 生きているか（★NGが「数」）───────── */
    ver.tried++;
    var before10 = ng.length;
    ng.push('（★ためし）わざと 足した 1件');
    var grew = (ng.length === before10 + 1) && (typeof ng.length === 'number');
    ng.pop();
    var backTo = (ng.length === before10);
    if (grew && backTo) ver.ring++;
    else { ng.push('★★★見張りが 死んでいます：★NG の 数が 数えられません'); ver.why.push('⑩'); }
    note['⑩ 【共】★NGは数か'] = (grew && backTo)
      ? '★はい（' + before10 + ' → ' + (before10 + 1) + ' → ' + before10 + '・typeof ' + (typeof ng.length) + '）'
      : '★★いいえ';

    /* ── Ⓐ 画面に出る漢字（★数字を出すだけ・鳴らない）─────────────
       ★ ★★アト（T182）の 教え：★線が 引けない ものは 鳴らさない。
         ★ ★「小6までの 漢字か」を 機械が 判じると、★★きれいな 画面でも 鳴ります
           ★（★学年の 表を 私が 完全に 持って いない ため）。
         ★ ★★だから ここは「画面に 出る 漢字を ぜんぶ ならべる」だけに します。
           ★ ★人が 見て 直せば よい ―― ★★黙って 増えたら 気づけます。 */
    var kanji = still(function () {
      var seen = {}, txt = '';
      DF.preset('all');
      back(); txt += ($('startScreen').innerText || '');
      openFold(true); txt += ($('ruleList').innerText || '');
      play(11, 1); txt += (document.body.innerText || '');
      dlg('helpDialog'); txt += ($('helpDialog').innerText || '');
      dlg('rulesDialog'); txt += ($('rulesDialog').innerText || '');
      closeAll();
      DF.RULES.forEach(function (r) { txt += r.name + r.desc + (r.flash || ''); });
      for (var j = 0; j < txt.length; j++) {
        var ch = txt.charAt(j);
        if (/[一-鿿]/.test(ch)) seen[ch] = 1;
      }
      return Object.keys(seen).sort();
    });
    /* ★ 設計図§9.6 の 例外（★社長裁定）＋ 固有の 呼び名 */
    var OK_OVER = '枚縛換渡豪';
    var over = kanji.filter(function (c) { return OUT_OF_6.indexOf(c) >= 0 && OK_OVER.indexOf(c) < 0; });
    note['Ⓐ 【共】画面に出る漢字（★鳴らない・読むための数字）'] =
      kanji.length + '字：' + kanji.join('') +
      '／★小6の外と 私が 見た もの ' + over.length + '字' + (over.length ? '：' + over.join('') : '') +
      '（★例外に した もの：' + OK_OVER + '）';

    /* ── Ⓑ 強調の 種類（★数字を出すだけ）───────────────── */
    var hl = still(function () {
      play(11, 1); S.selected = []; DF.render();
      var a = ['can-play', 'can-join', 'selected', 'cant-finish'].filter(function (c) { return !!$('hand').querySelector('.' + c); });
      var mine = S.players[0].cards[0];
      S.selected = mine ? [mine.key] : []; DF.render();
      var b = ['can-play', 'can-join', 'selected', 'cant-finish'].filter(function (c) { return !!$('hand').querySelector('.' + c); });
      S.selected = [];
      return { none: a, sel: b };
    });
    note['Ⓑ 【富】強調の種類（★鳴らない・読むための数字）'] =
      'えらぶ前 ' + hl.none.length + '種（' + (hl.none.join('・') || 'なし') + '）／えらんだ後 ' + hl.sel.length +
      '種（' + (hl.sel.join('・') || 'なし') + '）　★★「光り」と「みどり」が 同時に 出ないことは ⑤が 鳴らします';

    /* ── ★★ わざと 壊して 鳴らす（まとめて 6通り）───────────── */
    var kill = killTest();
    if (kill.rang < kill.tried) {
      ng.push('★★★見張りが 死んでいます：★わざと 壊しても 鳴らない ものが ' +
              (kill.tried - kill.rang) + '通り（' + kill.rows.filter(function (r) { return r.indexOf('鳴らない') >= 0 || r.indexOf('こけた') >= 0; }).join('／') + '）');
    }

    /* ── ⑪【共】さわったものを 戻す ───────────────────── */
    restore(keep);
    var after = snapshot();
    var diff = [];
    ['preset', 'flags', 'startHid', 'gameHid', 'dlg', 'gameNo', 'field', 'msg'].forEach(function (k) {
      if (String(keep[k]) !== String(after[k])) diff.push(k + '：' + keep[k] + '→' + after[k]);
    });
    if (JSON.stringify(keep.ruleOn) !== JSON.stringify(after.ruleOn)) diff.push('ruleOn');
    if (JSON.stringify(keep.hands) !== JSON.stringify(after.hands)) diff.push('手札：' +
      keep.hands.map(function (h) { return h.length; }).join('/') + '→' + after.hands.map(function (h) { return h.length; }).join('/'));
    if (JSON.stringify(keep.who) !== JSON.stringify(after.who)) diff.push('done/passed/place/foul');
    if (diff.length) ng.push('★★★見張りが 場面を こわしました：' + diff.join('／'));
    note['⑪ 【共】戻したか'] = diff.length ? '★★' + diff.join('／') : '★ぜんぶ 戻った';

    note['★★わざと壊して鳴らした（その場で）'] = ver.ring + ' / ' + ver.tried + '通り' +
      (ver.why.length ? '（★鳴らなかった：' + ver.why.join('・') + '）' : '') +
      '　★中身：③絵を剥がす・⑨保存に書き込む・⑬8切りを殺す・⑩NGを1件足す';
    note['★★わざと壊して鳴らした（まとめ）'] = kill.rang + ' / ' + kill.tried + '通り　' + kill.rows.join('／');

    var out = {
      '★NG': ng.length,
      '中身': ng.length ? ng : 'ぜんぶ OK ✅',
      '画面': innerWidth + '×' + innerHeight,
      'かかった時間': (Date.now() - t0) + 'ms'
    };
    for (var kk in note) if (note.hasOwnProperty(kk)) out[kk] = note[kk];
    if (root.console) console.log('[大富豪] verify', out);
    return out;
  }

  /* ============================================================
     ★★★ わざと 壊して、★見張りが 鳴るか その場で 見せる（★T162・T163）
     ------------------------------------------------------------
     ★ ★★きまり：★★壊し方は **どの 大きさでも 鳴る** 形に する。
       ★ ★トライ（T181）：「★横向き 2サイズでしか 鳴らない 見張りは、
         ★ ★★375×812 だけで 回した 人が そのまま 出荷する」。
     ★ ★★もう1つ：★★壊した ことを 見るのは **本番と 同じ ものさし** で なければ 意味が ない。
       ★ ★（★別の 数え方で 見たら、★見張りでは なく 二重帳簿 です）
     ============================================================ */
  function killTest() {
    var rows = [], tried = 0, rang = 0;
    function one(id, name, fn) {
      tried++;
      var got = 0;
      try { got = still(fn) ? 1 : 0; } catch (e) { got = 0; rows.push(id + ' ' + name + '：★★こけた（' + e.message + '）'); return; }
      if (got) rang++;
      rows.push(id + ' ' + name + '：' + (got ? '★鳴った' : '★★鳴らない'));
    }

    /* ★① 同じ札を 2枚に する → ★aliveSet の dup が 見つける */
    one('①', '同じ札を2枚にする', function () {
      play(11, 1);
      var c = S.players[0].cards[0];
      S.players[1].cards.push(c);
      var bad = aliveSet().dup > 0;
      S.players[1].cards.pop();
      return bad;
    });

    /* ★② 画面ぜんたいに 見えない ふたを かぶせる → ★「押せるものが 0個」に なる */
    one('②', '押せるものを ぜんぶ ふさぐ', function () {
      play(11, 1);
      S.turn = 0; S.busy = false; S.over = false; DF.render();
      var before = tapList().filter(reallyTappable).length;
      var lid = document.createElement('div');
      lid.style.cssText = 'position:fixed;inset:0;z-index:99999;background:transparent';
      document.body.appendChild(lid);
      var after = tapList().filter(reallyTappable).length;
      lid.remove();
      return before > 0 && after === 0;
    });

    /* ★⑤ 光り（can-play）と みどり（can-join）を 同時に 出す */
    one('⑤', '光りと みどりを 同時に 出す', function () {
      play(11, 1); DF.render();
      var cs = $('hand').querySelectorAll('[data-key]');
      if (cs.length < 2) return false;
      cs[0].classList.add('can-play'); cs[1].classList.add('can-join');
      var bad = !!($('hand').querySelector('.can-play') && $('hand').querySelector('.can-join'));
      cs[0].classList.remove('can-play'); cs[1].classList.remove('can-join');
      return bad;
    });

    /* ★⑥「出す」を 画面の 外へ 追い出す → ★「届かない」が 鳴る */
    one('⑥', '「出す」を 画面の外へ 追い出す', function () {
      play(11, 1); DF.render();
      var b = $('playBtn'), kp = b.getAttribute('style') || '';
      b.style.cssText = kp + ';position:fixed;left:-600px;top:-600px;width:120px;height:56px;';
      var bad = unreachable(b);
      b.setAttribute('style', kp);
      return bad;
    });

    /* ★⑦「出す」を 44pxより 小さく する */
    one('⑦', '「出す」を 44pxより 小さく する', function () {
      play(11, 1); DF.render();
      var b = $('playBtn'), kp = b.getAttribute('style') || '';
      b.style.cssText = kp + ';height:20px;min-height:20px;padding:0;';
      var r = reach(b);
      b.setAttribute('style', kp);
      return isMust44(b) && r.h < 44;
    });

    /* ★⑯ 縛り・都落ちの バッジを 消す（★DOMから 消す） */
    one('⑯', 'バッジを 消す', function () {
      DF.preset('all'); play(11, 1);
      S.lock = ['spades']; S.crown = 0; DF.render();
      var before = badgeShown('🔒');
      $('flagRow').innerHTML = '';
      var after = badgeShown('🔒');
      DF.render();
      return before && !after;
    });

    /* ★★⑯-2（T187・🎨アト）★★バッジを **CSSで 見えなく する**
       ------------------------------------------------------------
       ★ ★トライ T186 §5-2 が 見つけた すきま。★字は のこる ので、
         ★ ★★まえの ⑯（textContent だけ）は **鳴りません** でした。
       ★ ★★これは 私が style.css を さわる たびに 起こしうる 形なので、
         ★ ★★「1回 直した」で 終わらせず ★見張りに 置いて おきます。
       ★ ★どの 大きさでも 鳴ります（★画面の 向きも 回線も 使わない ―― トライ T181 の 注意）。 */
    one('⑯-2', 'バッジを CSSで 見えなくする', function () {
      DF.preset('all'); play(11, 1);
      S.lock = ['spades']; S.crown = 0; DF.render();
      var before = badgeShown('🔒');
      var st = document.createElement('style');
      st.textContent = '#flagRow .flag-lock{opacity:0;visibility:hidden}';
      document.head.appendChild(st);
      var after = badgeShown('🔒');
      st.parentNode.removeChild(st);
      DF.render();
      return before && !after;
    });

    return { tried: tried, rang: rang, rows: rows };
  }

  /* ★ 8切りが 生きているか だけを 見る 小さな 走り（⑬で 2回 使う）*/
  function eightCutRuns(on) {
    DF.preset('all');
    S.ruleOn.eightCut = !!on;
    $('startScreen').classList.add('hidden');
    $('gameScreen').classList.remove('hidden');
    if (!S.players.length) DF.start(false);
    S.over = false; S.busy = false; S.pending = null; S.after = null;
    S.revolution = false; S.jackBack = false; S.revDir = false; S.lock = null;
    S.players.forEach(function (p) { p.done = false; p.passed = false; p.foul = false; });
    DF.hand(0, ['spades-8', 'hearts-5', 'clubs-6']);
    for (var i = 1; i < 4; i++) DF.hand(i, ['hearts-9', 'clubs-9', 'diamonds-10']);
    DF.put(['diamonds-4'], 'ロボット1');
    S.turn = 0; S.selected = [];
    DF.render();
    var off = clockOn();
    var flowed = false;
    try {
      DF.sel(['spades-8']);
      DF.play();
      pump(300);
      flowed = (S.field === null);
    } finally { off(); }
    return flowed;
  }

  /* ★ 保存への 書き込みを 数える（★window.localStorage を 借りて 返す）*/
  function countStorage(fn) {
    var st = { writes: 0, keys: [], have: 0 };
    try { st.have = localStorage.length; } catch (e) { st.have = -1; }
    var proto = Object.getPrototypeOf(localStorage) || Storage.prototype;
    var realSet = proto.setItem;
    proto.setItem = function (k, v) { st.writes++; if (st.keys.indexOf(k) < 0) st.keys.push(k); return realSet.call(this, k, v); };
    try { fn(); } finally { proto.setItem = realSet; }
    return st;
  }

  /* ★ 本物の 指の ながれ（pointerdown → pointerup → click）
     ★ ★大富豪は `click` で 受けて います（★published の 形。★1文字も 変えません）。
       ★ ★★だから 本物の 順番を そのまま 流して、★受け手が どれでも 通る ように します。 */
  function firePointer(el, x, y) {
    if (!el) return;
    var o = { bubbles: true, cancelable: true, clientX: x, clientY: y, view: root };
    try {
      el.dispatchEvent(new PointerEvent('pointerdown', Object.assign({ pointerId: 1, pointerType: 'touch', isPrimary: true }, o)));
    } catch (e) { el.dispatchEvent(new MouseEvent('mousedown', o)); }
    try {
      el.dispatchEvent(new PointerEvent('pointerup', Object.assign({ pointerId: 1, pointerType: 'touch', isPrimary: true }, o)));
    } catch (e) { el.dispatchEvent(new MouseEvent('mouseup', o)); }
    el.dispatchEvent(new MouseEvent('click', o));
  }

  /* ★★ 私が 目で 見て「小6の 外だろう」と 判じた 字（★Ⓐ が 使う・★鳴らない）
     ★ ★★これは **鳴らす ための 線では ありません**。★人が 読んで 直す ための ならび です。
       ★ ★学年の 表を 私は 完全には 持って いません ―― ★★だから 鳴らしません（T182 の 教え）。 */
  var OUT_OF_6 = '枚縛換渡豪罰駄袋僕俺喋噂';

  /* ============================================================
     ★ 7. 出口
     ============================================================ */
  root.DAIFUGO = {
    now: now, autoPlay: autoPlay, verify: verify, seed: seed, geo: geoInfo,
    fitTest: fitTest, rates: rates,
    /* ★ 中を のぞく ため（★トライ・アト用）*/
    _probe: {
      tap: function () { return tapList().map(function (e) { return tapName(e) + (reallyTappable(e) ? ' ○' : ' ✕'); }); },
      reach: function (sel) { var e = document.querySelector(sel); return e ? reach(e) : null; },
      hit: hitAt, img: function () { return { 場: scanImgs($('field')), 手札: scanImgs($('hand')) }; },
      unreach: function () {
        return tapList().map(function (e) {
          var q = e.getBoundingClientRect();
          return tapName(e) + ' top' + Math.round(q.top) + ' 外' + (outOfView(e) ? 1 : 0) + ' 届かない' + (unreachable(e) ? 1 : 0);
        });
      },
      scene: function (i) { return still(function () { SCENES[i].f(); return SCENES[i].n; }); },
      scenes: SCENES.map(function (s) { return s.n; }),
      snapshot: snapshot, restore: restore, fire: firePointer, humans: HUMANS
    }
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
