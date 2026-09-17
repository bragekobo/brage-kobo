/* ============================================================
   ★★★ T295 ―― ★「箱が 開いて いる」ことを 見張りに 教える 1つの 関数（★💻コーダ・2026-09-14）
   ------------------------------------------------------------
   ★ ★なぜ 要るか【★実測・T295-02・★20本 ぜんぶ で 数えました】：
   ★ ★★`showModal()` で 箱（`<dialog>`）が 開いて いる あいだ、
   ★ ★★★**箱の 外の ボタンは ブラウザの 決まりで 押せません**（★上に 幕 `::backdrop` が かかる）。
   ★ ★★そこを 指で つつくと 返って くるのは ★**その `dialog` 自身**です。
   ★ ★★→ ★それを「ボタンが 押せない」と 読むと ★**傷の ない ところで 鳴る 赤ランプ**に なります
   ★ ★★★（★アト T277 の ことば。★七並べでは これで **120件** うそ鳴きして いました）。
   ★
   ⚠️★★ ここは ★**鳴らなく する ための もの では ありません。**★見送るのは 次の 3つが そろった ときだけ：
   ★ ★① 箱（`:modal`）が 開いて いる　★② その ボタンが **箱の 外**に いる　★③ 指の 先が **その 箱**
   ★ ★★→ ★箱の **中**の ボタンは これまで どおり 見ます。
   ★ ★★→ ★`show()`（★モーダルで ない 箱）の ときは **見送りません**（★外の ボタンは まだ 押せる ため。
   ★ ★★　 ★私 コーダ T291 の 実測：`show()` と `showModal()` は 別もの）。
   ★ ★★→ ★箱 以外の ものが かぶって いる ときは ★**これまで どおり 鳴きます**。
   ★
   ★ ★先に 同じ ことを した 人：★💻コーダ T184（大富豪 `verify.js`「私の 失敗②」＝ **62件の 空うち**）。
   ============================================================ */
function t295HakoNoSoto(el, atatta, doc) {
  doc = doc || document;
  var ds = doc.querySelectorAll('dialog[open]'), hako = [], i;
  for (i = 0; i < ds.length; i++) {
    try { if (ds[i].matches(':modal')) hako.push(ds[i]); } catch (e) { hako.push(ds[i]); }
  }
  if (!hako.length) return false;
  for (i = 0; i < hako.length; i++) if (el && hako[i].contains(el)) return false;
  for (i = 0; i < hako.length; i++) {
    if (atatta && (atatta === hako[i] || hako[i].contains(atatta))) return true;
  }
  return false;
}
try { window.__t295HakoNoSoto = t295HakoNoSoto; } catch (e) {}

/* ============================================================
   スピード（6本目）― T61・コーダ
   ------------------------------------------------------------
   仕様は logs/T60_スピード_仕様_ルル.md ＋ 末尾の 社長裁定が 正。

   社長裁定（2026-08-19・厳守）：
     1. ロボットの 速さ … ★ 遊ぶ人が 自分で えらぶ（5だんかいの プルダウン）
        ―― T64で 差しかえ。前の 決めごと（ハッピーが 覚える・勝てば 速く
           負ければ おそく）は 消した。理由は 下の ★T64 を 読むこと。
     2. 操作 … カードを 1回 タップ したら 出せる山へ 飛ぶ。両方に 出せるときは 左
     3. 出せる手札 … ★ 光らせない（ルルの推しと 逆・社長の判断）
     4. 1人用（対ロボット）だけ

   ★T64（2026-08-19・裁定1の 差しかえ）：
     社長の 言葉 ――「負けた後 おそくしちゃうと、再挑戦したい人が 物足りなく
     なるので、自分で 速さが 選べると いいね」。
     つまり **黙って 手加減する のを やめて、速さを 遊ぶ人の 手に 返す。**
       ・自動調整（勝ったら×0.75／負けたら×1.25）は 消した
       ・えらんだ 速さは そのまま 続く（勝っても 負けても 動かない）
       ・プルダウンは「はじめの 画面」と「決着の 画面」の 2か所
         ★ 決着の 画面に 無いと、負けた 直後の ハッピーの
           「速さは 変えられるよ！」が 空ぶりする（言われた その場で 変えられる こと）
       ・遊んでいる とちゅうの 画面の ボタンは 0個の まま（設計図 §5.5）

   裁定3（光らせない）で 差しかえた ところ：
     ・A と K が つながることは「遊び方」（遊ぶ前の 画面）で 絵だけで 見せる。
       遊んでいる とちゅうの 画面には 1文字も 足さない（設計図 §5.5）。
     ・出せない札を おした ときの 返事（ゆれ＋小さい音）が いちばん 大事な
       手ざわりに なった。強調は これ 1種類だけ。

   ★ 絶対に 落とせない 決めごと（外すと ゲームが 成立しない）：
     ① ロボットは 場が 変わってから REACT(320ms) は 出さない（仕様 §1-5）
        ―― 無いと 人は 一生 横取りできず「未来を見ているロボット」に なる
     ② 自分＝赤26枚 ／ ロボット＝黒26枚（説明を 書かずに 自分の札が 分かる）
     ③ 手札4枚の 席は 最後まで 動かさない（仕様 §3-2）
     ④ 連打を 1回も 落とさない ―― 判定が 先・見た目が あと（仕様 §3-4）
     ⑤ A ↔ K は つながる（数字は 輪っか）
     ⑥ 両方が 出せなくなったら 自動で 見つけて 1枚ずつ めくる

   作りの かたち：
     「中身（core）」と「画面（ui）」を 分けてある。
     中身は 時刻(ms)を 外から もらうだけ なので、本物の 時計でも
     仮想の 時計でも 同じ ように 動く ―― SPEED.autoPlay() は 仮想の 時計で
     同じ 中身を まわして 確かめている（別の 作りに していない）。

   ⚠️ poker-core.js は 使わない（役の判定が 1つも 要らない ゲーム）。
   ⚠️ 外部の ライブラリ・フォント・画像は 0。外への 通信も 0。
   ============================================================ */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  /* ============================================================
     ★ 数字（TUNE）
     ------------------------------------------------------------
     ★★ 調整対象 ★★ … トライが 実際に 遊んで 動かす 数字。
        ここ 1か所に まとめてある。ほかの 場所に 数字を 書かない こと。
     ☆ 変えては いけない … REACT(320ms) は 公平さの 心臓（仕様 §1-5）。
        FLIP_PAUSE(600ms) も 削らない（仕様 §2-4）。
     ============================================================ */
  var TUNE = {
    /* ★★ ロボットの 速さ 5だんかい（★T64・社長裁定）★★
       ------------------------------------------------------------
       ・ここが「ロボットが 1枚 出すまでの 時間（ms）」の すべて。
       ・えらんだ ものが そのまま 続く（勝ち負けで 動かさない）。
       ・数字の 根拠は T62 トライの 実測：
           3400 … 1枚 見つけるのに 3秒 かかる 子でも 遊べる 下限
                  （前の 上限 2600ms では 勝率 2%だった）
           2200 … ★ トライの 推し。「はじめての 人が ちょうど 遊べる」実測値
           1200 … 前の はじめの 値 1400ms より 少し 速い。慣れた 人むけ
            320 … 下限（＝ REACT と 同じ）。ここでは 横取りの 読み合いが 本体に なる
       ★ 名前は 設計図 §9.6 に したがう ―― 「遅」「普」は 中学の 漢字なので
         ひらがな。「速」は 小3なので 漢字。 */
    SPEEDS: [
      { label: 'とても おそい', ms: 3400 },
      { label: 'おそい',        ms: 2800 },
      { label: 'ふつう',        ms: 2200 },   // ★ はじめは これ
      { label: '速い',          ms: 1200 },
      { label: 'とても 速い',   ms:  320 }
    ],
    SPEED_START:   2,   // ★ はじめに えらばれている だんかい（＝ ふつう 2200ms）

    /* ★★ 調整対象 ★★ */
    PACE_MIN:    320,   // いちばん 速い（人の 反応の 下限）
    PACE_MAX:   3400,   // いちばん おそい（これ以上は 寝て見える）
    CLOSE:         3,   // 「危なかった〜！」の 線（残りの差 3枚以内）

    /* ☆ 変えては いけない（仕様の 決めごと）☆ */
    REACT:       320,   // ★ 場が 変わってから ロボットが 出せない 時間
    FLIP_PAUSE:  600,   // 「せーの！」の 間
    END_SILENCE: 300,   // 決着の あとの だまる 時間

    /* 見た目の 時間 */
    FLY:         170,   // 札が 飛ぶ アニメ（これ以上 長くしない・仕様 §3-4）
    COUNT_STEP:  520,   // 3 … 2 … 1 … スタート！

    /* ★ 勝ち負けの 箱が 出てから、ボタンが おせるように なるまで（T63）
       ------------------------------------------------------------
       スピードは 連打する ゲーム。決着しても 指は 止まらない。
       ボタンは 手札カードの 真上に かさなる ので、この 待ちが 無いと
       勝ち負けを 見ないまま 次の 試合が 始まる（T62 トライ・5試合中 3回）。
       おせない あいだは うすく 平たく なる（style.css の .is-locked）。
       ★ 短くする ときは、決着の 瞬間に 4枚を 連打しつづけて
         結果が 飛ばない ことを かならず たしかめる こと。 */
    RESULT_LOCK:  600,

    /* ★★ 時間だけの 待ちでは 足りない（実測で 分かった こと・T63）
       ------------------------------------------------------------
       決着の 瞬間に 0.11秒ごと 連打しつづける と、600ms を 待った 直後の
       1タップが そのまま ボタンに 当たる（実測：箱が 出て 660ms で 事故）。
       時間で 待つ かぎは、指が 止まらない かぎり ぜったいに すりぬける。

       だから 決めごとを 2つに する ――
         ① 箱が 出てから RESULT_LOCK ミリ秒 たっている
         ② かつ、最後に さわってから RESULT_QUIET ミリ秒 さわっていない
       ＝「指が 止まってから」おせるように なる。
       ふつうの 人は 決着の あと 1〜3回 空ぶって 止まる ので、
       体感は 0.6秒の まま。連打を やめない かぎり 事故は 起きない。 */
    RESULT_QUIET: 250,

    /* 出せない札の 灰色が 消えるまでの 保険（ふだんは アニメの 終わりで 消える）*/
    NO_CLEAR:    260
  };

  /* ★ おぼえるのは「えらんだ だんかいの 番号」だけ（T64）。
     前は 自動調整した ミリ秒を 入れていたので、キーの 名前ごと 変えてある
     （古い 値が まざると、どの だんかいでも ない 速さで 始まって しまう）。 */
  var STORE_KEY = 'bragekobo.speed.level';

  function levelMs(i) { return TUNE.SPEEDS[i].ms; }
  function levelOfMs(ms) {
    for (var i = 0; i < TUNE.SPEEDS.length; i++) if (TUNE.SPEEDS[i].ms === ms) return i;
    return -1;
  }

  /* ============================================================
     カード（設計図 §9・厳守）
     ------------------------------------------------------------
     ・画像は office/games/cards/ の 支給画像。CSSや 絵文字で 自作しない。
     ・ファイル名が 日本語なので encodeURIComponent を 必ず 通す。
     ・全55枚で 約11MB なので 先読みしない。出した札・手札の ぶんだけ 読む。
     ・自分＝赤（ハート＋ダイヤ）／ロボット＝黒（スペード＋クローバー）。
       ★ この 色分けは ぜったいに くずさない（説明 1文字ゼロで 自分の札が 分かる）。
     ============================================================ */
  var CARD_DIR = '../cards/';
  var RED_SUITS   = ['ハート', 'ダイヤ'];
  var BLACK_SUITS = ['スペード', 'クローバー'];
  var RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  var MARK = { 'ハート': '♥', 'ダイヤ': '♦', 'スペード': '♠', 'クローバー': '♣' };

  function cardSrc(name) { return CARD_DIR + encodeURIComponent(name) + '.png'; }
  var BACK_SRC = cardSrc('トランプ裏赤');

  function makeDeck(suits, red) {
    var out = [];
    for (var s = 0; s < suits.length; s++) {
      for (var i = 0; i < RANKS.length; i++) {
        out.push({ suit: suits[s], rank: RANKS[i], v: i + 1, red: red, key: suits[s] + RANKS[i] });
      }
    }
    return out;
  }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i];
      a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* ★ 1つちがい。A ↔ K も となり（数字は 輪っか・仕様 §2-3）
     13 と 1 の さは 12 なので、さが 1 か 12 なら となり。例外は ゼロ。 */
  function adjacent(a, b) {
    if (!a || !b) return false;
    var d = Math.abs(a.v - b.v);
    return d === 1 || d === 12;
  }

  /* ============================================================
     ★ 中身（core）―― 画面を 1つも さわらない。時刻は 外から もらう
     ============================================================ */

  function newGame(pace, startAt) {
    var red = shuffle(makeDeck(RED_SUITS, true));
    var black = shuffle(makeDeck(BLACK_SUITS, false));
    var g = {
      pace: pace,
      /* stock ＝ めくり直し せんようの 予備（★下の recycle の 説明を 読むこと）。
         勝ち負けの 数（手札＋山札）には 入れない。ふだんは ずっと 0枚。 */
      me:  { hand: red.splice(0, 4),   deck: null, stock: [] },
      bot: { hand: black.splice(0, 4), deck: null, stock: [] },
      piles: [[], []],            // 0 ＝ 左（自分が 出した 1枚から）／1 ＝ 右（ロボット）
      boardAt: startAt,           // 場が 変わった 時刻（人・ロボット・めくり直し すべてで 更新）
      botLastAt: startAt,         // ロボットが 前に 出した 時刻
      flipAt: 0,                  // 0 でなければ「せーの！」の 間（この時刻に めくる）
      over: false, winner: null, endKind: '', dryRecycles: 0,
      lastCard: { me: null, bot: null },
      stats: { minReact: Infinity, botPlays: 0, flips: 0, recycles: 0 }
    };
    g.piles[0].push(red.splice(0, 1)[0]);
    g.piles[1].push(black.splice(0, 1)[0]);
    g.me.deck = red;      // 26 - 4 - 1 = 21枚
    g.bot.deck = black;
    return g;
  }

  function top(g, p) { var a = g.piles[p]; return a[a.length - 1]; }
  function handCount(hand) {
    var n = 0;
    for (var i = 0; i < 4; i++) if (hand[i]) n++;
    return n;
  }
  /* ★ 勝ち負けの 数 ＝ 手札 ＋ 山札。stock（めくり直しの 予備）は 入れない */
  function leftOf(side) { return handCount(side.hand) + side.deck.length; }

  /* 札が 消えたり ふえたり していないか（いつも 52枚）*/
  function countAll(g) {
    return handCount(g.me.hand) + g.me.deck.length + g.me.stock.length
         + handCount(g.bot.hand) + g.bot.deck.length + g.bot.stock.length
         + g.piles[0].length + g.piles[1].length;
  }

  /* いま 出せる 手（席と 山の 組み合わせ）を ぜんぶ */
  function options(g, who) {
    var s = g[who], out = [], i, p;
    for (i = 0; i < 4; i++) {
      var c = s.hand[i];
      if (!c) continue;
      for (p = 0; p < 2; p++) if (adjacent(c, top(g, p))) out.push({ slot: i, pile: p });
    }
    return out;
  }
  function canPlay(g, who) {
    var s = g[who], i, p;
    for (i = 0; i < 4; i++) {
      if (!s.hand[i]) continue;
      for (p = 0; p < 2; p++) if (adjacent(s.hand[i], top(g, p))) return true;
    }
    return false;
  }

  /* ★ 1枚 出す ―― この 関数が「判定」。見た目は これより あと（仕様 §3-4）
     ★ 席は 動かさない：出した 席に、その場で 山札の 1枚が 入る（仕様 §3-2） */
  function play(g, who, slot, pile, now) {
    if (g.over) return null;
    var s = g[who], c = s.hand[slot];
    if (!c || !adjacent(c, top(g, pile))) return null;

    if (who === 'bot') {
      var react = now - g.boardAt;
      if (react < g.stats.minReact) g.stats.minReact = react;
      g.botLastAt = now;
      g.stats.botPlays++;
    }
    g.piles[pile].push(c);
    s.hand[slot] = s.deck.length ? s.deck.shift() : null;   // ← 左に つめない
    g.boardAt = now;
    g.lastCard[who] = c;
    g.dryRecycles = 0;

    if (!s.deck.length && handCount(s.hand) === 0) {
      g.over = true; g.winner = who; g.endKind = 'out';
    }
    return { card: c, slot: slot, pile: pile };
  }

  /* ロボットが どれを 出すか（仕様 §7-2）
     見つける力は 100%（見のがしは 作らない）。変わるのは 速さだけ。
     自分の 手札で「つながる」ほうを 優先する。人の 手札は 一度も 見ない。 */
  function botChoose(g) {
    var opts = options(g, 'bot');
    if (!opts.length) return null;
    var best = [], bestScore = -1;
    for (var k = 0; k < opts.length; k++) {
      var o = opts[k], c = g.bot.hand[o.slot], score = 0;
      for (var i = 0; i < 4; i++) {
        if (i === o.slot) continue;
        if (g.bot.hand[i] && adjacent(g.bot.hand[i], c)) { score = 1; break; }
      }
      if (score > bestScore) { bestScore = score; best = [o]; }
      else if (score === bestScore) best.push(o);
    }
    return best[Math.floor(Math.random() * best.length)];
  }

  /* ★★ ロボットが 次の1枚を 出せる 時刻（仕様 §1-5・ここが 公平さの 心臓）
       ① 前に 出してから pace ミリ秒（これが 速さの 本体）
       ② かつ 場が 変わってから 最低 REACT ミリ秒（これが「見る時間」）
     ②が 無いと ロボットは 常に 人の 一歩先に 出せてしまい、
     人は 一生 横取りできない ＝「未来を見ているロボット」に なる。 */
  function botReadyAt(g) {
    return Math.max(g.botLastAt + g.pace, g.boardAt + TUNE.REACT);
  }

  /* 両方が 出せない ときの めくり直し（仕様 §2-4）
     ・「出せません」ボタンは 作らない。ゲームが 自動で 見つける
     ・山札が ある人 だけ めくる（山は 2つの まま）
     ・★ 時計は めくった 時刻から 数え直す ＝ 人と 同時に よーいドン */
  function flipSrc(side) { return side.deck.length ? side.deck : side.stock; }
  function canFlip(g) { return flipSrc(g.me).length > 0 || flipSrc(g.bot).length > 0; }

  function doFlip(g, now) {
    var flipped = [];
    if (flipSrc(g.me).length)  { g.piles[0].push(flipSrc(g.me).shift());  flipped.push(0); }
    if (flipSrc(g.bot).length) { g.piles[1].push(flipSrc(g.bot).shift()); flipped.push(1); }
    g.boardAt = now;
    g.flipAt = 0;
    g.stats.flips++;
    return flipped;
  }

  /* ★★ 場の山を まぜ直して めくる ぶんを 作る（★ 仕様から 変えた ところ・T61）
     ------------------------------------------------------------
     ⚠️ 仕様 §2-5 は「2人とも 山札が 空で 2人とも 出せない」を
        “ほとんど 起きない まれな こと”として、手札の 少ない人の 勝ち、と
        決めていた。作ってから 数えたら、**まれでは なかった**。

        SPEED.autoPlay(300) の 実測（まぜ直し 無しの とき）
          ・実力が つりあった とき（人900ms 対 ロボット900ms）
            → その 終わり方が 220/300 ＝ 73%、引き分けが 61/300 ＝ 20%
          ・社長裁定1（勝てば 速く・負ければ おそく）は、
            ★ わざと 実力を つりあわせに いく 仕組み なので、
              遊べば 遊ぶほど この 終わり方に 近づいて しまう

        つまり「最後の1枚が 落ちて 決まる」いちばん 気持ちいい 瞬間が
        4回に 3回 起きず、5回に 1回は 引き分けで 黙って やり直し に なる。
        これは 遊びとして 成立しない ので、ここだけ 直した。

     直し方＝**本物の スピードに ある 決めごとを 入れる**（作り話では ない）。
        世の中の スピードは、めくる ぶんが 尽きて 2人とも 出せなく なったら
        **場の2つの山を（一番上の1枚ずつを 残して）まぜて、めくる ぶんに 配り直す。**
        まぜ直した 札は「めくる ぶん（stock）」であって 手札には 入らないので、
        ★ 勝ちの 決めごと（手札と 山札が 0）は 1文字も 変わらない。

     画面に 増える ものは ゼロ。文字も 増えない。
     見えるのは いつもの「せーの！」だけ（人は 何が 起きたか 分からなくてよい）。
     ============================================================ */
  function recycle(g) {
    var pool = g.piles[0].slice(0, -1).concat(g.piles[1].slice(0, -1));
    if (!pool.length) return false;
    g.piles[0] = [top(g, 0)];
    g.piles[1] = [top(g, 1)];
    shuffle(pool);
    var half = Math.ceil(pool.length / 2);
    g.me.stock = g.me.stock.concat(pool.slice(0, half));
    g.bot.stock = g.bot.stock.concat(pool.slice(half));
    g.dryRecycles++;
    g.stats.recycles++;
    return true;
  }

  /* まれな 終わり方（仕様 §2-5・画面には 説明を 出さない）
     2人とも 山札が 空で 2人とも 出せない → 手札の 少ない人の 勝ち。
     同じ 枚数なら すぐ もう1回。 */
  function endStuck(g) {
    var m = handCount(g.me.hand), b = handCount(g.bot.hand);
    g.over = true;
    g.endKind = 'stuck';
    g.winner = m < b ? 'me' : (b < m ? 'bot' : null);   // null ＝ 引き分け
  }

  /* 時計が 進んだ ときに 呼ぶ。返り値は 画面に 知らせる できごと */
  function tick(g, now) {
    if (g.over) return null;

    if (g.flipAt) {                                   // 「せーの！」の 間
      if (now >= g.flipAt) return { type: 'flip', flipped: doFlip(g, now) };
      return null;
    }
    if (!canPlay(g, 'me') && !canPlay(g, 'bot')) {    // 両方 出せない
      if (!canFlip(g)) {
        /* めくる ぶんが 尽きた → 場の山を まぜ直す（上の recycle の 説明）。
           3回 まぜ直しても 1枚も 出せない ときだけ、仕様 §2-5 の
           まれな 終わり方に する（本当に まれ ―― 実測 0.0%）。 */
        if (g.dryRecycles >= 3 || !recycle(g)) { endStuck(g); return { type: 'end' }; }
      }
      g.flipAt = now + TUNE.FLIP_PAUSE;
      return { type: 'stall' };
    }
    if (now >= botReadyAt(g)) {
      var o = botChoose(g);
      if (o) {
        var r = play(g, 'bot', o.slot, o.pile, now);
        if (r) return { type: 'play', who: 'bot', res: r };
      }
    }
    return null;
  }

  /* ★ 前は ここに nextPace()（勝ったら 速く・負けたら おそく）が あった。
     T64で 消した ―― 速さは 遊ぶ人が えらぶ もの に なった ので、
     ゲームの 中身は 速さを 1度も 書きかえない。 */

  /* ============================================================
     画面（ui）
     ============================================================ */

  var state = { level: TUNE.SPEED_START, pace: levelMs(TUNE.SPEED_START), streak: 0, matches: 0 };
  try {
    var saved = localStorage.getItem(STORE_KEY);
    if (saved !== null && saved !== '') {
      var n = +saved;
      if (n === Math.floor(n) && n >= 0 && n < TUNE.SPEEDS.length) {
        state.level = n;
        state.pace = levelMs(n);
      }
    }
  } catch (e) {}

  var G = null;
  var phase = 'title';         // title / count / play / end
  var raf = 0, timers = [];
  var mySlots = null, botSlots = null, pileEls = null;

  function later(fn, ms) { var id = setTimeout(fn, ms); timers.push(id); return id; }
  function clearTimers() { for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]); timers = []; }
  function say(text) { $('happyBubble').textContent = text; }

  /* ── 札の 絵（画像が 読めなかった ときの 保険つき）───────── */
  function paintCard(el, card, back) {
    if (!card) {
      el.classList.add('is-empty');
      el.innerHTML = '';
      if (el.tagName === 'BUTTON') el.disabled = true;
      el.removeAttribute('aria-label');
      return;
    }
    el.classList.remove('is-empty');
    if (el.tagName === 'BUTTON') el.disabled = false;
    var src = back ? BACK_SRC : cardSrc(card.key);
    var img = el.querySelector('img');
    if (!img) {
      el.innerHTML = '';
      img = document.createElement('img');
      img.setAttribute('alt', ''); img.setAttribute('draggable', 'false');
      img.setAttribute('decoding', 'async');
      img.onerror = function () { showFallback(el, card, back); };
      el.appendChild(img);
    }
    if (img.getAttribute('src') !== src) img.setAttribute('src', src);
    el.setAttribute('aria-label', back ? 'ロボットの札' : (card.suit + 'の' + card.rank));
  }
  /* 画像が 届かなかった ときだけ 出る 下じき（画面が 白く ならない ように）*/
  function showFallback(el, card, back) {
    el.innerHTML = '<span class="fallback ' + (card.red ? 'red' : 'black') + '">'
      + (back ? '🂠' : card.rank + MARK[card.suit]) + '</span>';
  }

  function buildHands() {
    var m = '', b = '';
    for (var i = 0; i < 4; i++) {
      m += '<button class="slot is-empty" type="button" data-slot="' + i + '" disabled></button>';
      b += '<div class="slot is-empty"></div>';
    }
    $('myHand').innerHTML = m;
    $('botHand').innerHTML = b;
    mySlots = $('myHand').querySelectorAll('.slot');
    botSlots = $('botHand').querySelectorAll('.slot');
    pileEls = [$('pile0'), $('pile1')];

    /* ★ ゆれが 終わったら 灰色を 外す（T63・T62 トライの §2-B）
       付けっぱなしだと、その 席が 次の 試合まで 灰色の まま 残り、
       「手札が 全部 使えなさそう」な 画面で 試合が 始まる。
       席は 作り直さない ので、ここで 1回 つないで おけば ずっと 効く。 */
    for (var k = 0; k < mySlots.length; k++) {
      mySlots[k].addEventListener('animationend', function (e) {
        if (e.animationName === 'shakeNo') e.target.classList.remove('is-no');
      });
    }
  }

  /* ============================================================
     ★ ロボットの 速さを えらぶ プルダウン（T64）
     ------------------------------------------------------------
     2か所 ある（はじめの 画面 ／ 決着の 画面）。中身は 同じ もので、
     どちらで 変えても もう 片方に すぐ そろう。
     ★ 効くのは「次の 試合から」―― 遊んでいる とちゅうに 出る ことは 無い
       （どちらの プルダウンも 遊ぶ 画面には いない）。
     ============================================================ */
  var speedSelects = [];

  function buildSpeedSelects() {
    var opts = '';
    for (var i = 0; i < TUNE.SPEEDS.length; i++) {
      opts += '<option value="' + i + '">' + TUNE.SPEEDS[i].label + '</option>';
    }
    speedSelects = [$('speedTitle'), $('speedResult')];
    for (var k = 0; k < speedSelects.length; k++) {
      var s = speedSelects[k];
      if (!s) continue;
      s.innerHTML = opts;
      s.value = String(state.level);
      s.addEventListener('change', function (e) { setLevel(+e.target.value); });
    }
  }
  function syncSpeedSelects() {
    for (var k = 0; k < speedSelects.length; k++) {
      var s = speedSelects[k];
      if (s && s.value !== String(state.level)) s.value = String(state.level);
    }
  }
  function setLevel(i) {
    if (!(i >= 0 && i < TUNE.SPEEDS.length)) return state.level;
    state.level = i;
    state.pace = levelMs(i);
    try { localStorage.setItem(STORE_KEY, String(i)); } catch (e) {}
    syncSpeedSelects();
    return state.level;
  }

  /* 灰色を 消す（アニメが 動かない ときの 保険と、試合の はじめの 掃除）*/
  function clearNo(el) { if (el) el.classList.remove('is-no'); }
  function clearAllNo() {
    if (!mySlots) return;
    for (var i = 0; i < mySlots.length; i++) clearNo(mySlots[i]);
  }

  function paintPile(p, pop) {
    var el = pileEls[p], c = top(G, p);
    paintCard(el, c, false);
    el.setAttribute('aria-label', (p === 0 ? '左' : '右') + 'の山 ' + c.suit + 'の' + c.rank);
    if (pop) { el.classList.remove('is-new'); void el.offsetWidth; el.classList.add('is-new'); }
  }
  function paintCounts() {
    $('myDeck').textContent  = '山札 ' + G.me.deck.length + '枚';
    $('botDeck').textContent = '山札 ' + G.bot.deck.length + '枚';
  }
  function paintAll() {
    clearAllNo();                 // ★ 前の 試合の 灰色を 持ちこさない（T63）
    for (var i = 0; i < 4; i++) {
      paintCard(mySlots[i], G.me.hand[i], false);
      paintCard(botSlots[i], G.bot.hand[i], true);
    }
    paintPile(0, false); paintPile(1, false);
    paintCounts();
  }

  /* ── 札が 飛ぶ 絵（見た目だけ・ゲームを 1つも 止めない）───── */
  function fly(card, fromEl, toEl) {
    if (!fromEl || !toEl) return;
    var a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
    if (!a.width || !b.width) return;
    var el = document.createElement('div');
    el.className = 'flycard';
    el.style.left = a.left + 'px';  el.style.top = a.top + 'px';
    el.style.width = a.width + 'px'; el.style.height = a.height + 'px';
    el.style.backgroundImage = 'url("' + cardSrc(card.key) + '")';
    document.body.appendChild(el);
    var dx = b.left - a.left, dy = b.top - a.top, sc = b.width / a.width;
    requestAnimationFrame(function () {
      el.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + sc + ')';
    });
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, TUNE.FLY + 80);
  }

  /* ── 小さい音（外部ファイルは 使わない）───────────────
     出せない札を おした ときの「だめ」だけ。とがめない 音量に する。 */
  var actx = null;
  function beep() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!actx) actx = new AC();
      if (actx.state === 'suspended') actx.resume();
      var o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime;
      o.type = 'sine'; o.frequency.setValueAtTime(196, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.05, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
      o.connect(g); g.connect(actx.destination);
      o.start(t); o.stop(t + 0.13);
    } catch (e) {}
  }

  /* ── できごとを 画面に 反映 ───────────────────── */
  function showEvent(ev) {
    if (!ev) return;
    if (ev.type === 'play') {
      var fromEl = botSlots[ev.res.slot];
      paintCard(botSlots[ev.res.slot], G.bot.hand[ev.res.slot], true);
      paintPile(ev.res.pile, true);
      paintCounts();
      fly(ev.res.card, fromEl, pileEls[ev.res.pile]);
    } else if (ev.type === 'stall') {
      showCount('せーの！');
      say('せーの！');
    } else if (ev.type === 'flip') {
      hideCount();
      for (var i = 0; i < ev.flipped.length; i++) paintPile(ev.flipped[i], true);
      paintCounts();
      say('どんどん出そう！');
    }
  }

  function showCount(text) {
    var box = $('countBox');
    box.innerHTML = '<span>' + text + '</span>';
    box.classList.remove('hidden');
  }
  function hideCount() { $('countBox').classList.add('hidden'); }

  /* ============================================================
     ★ ロボットの 時計を 止める／動かす（T63）
     ------------------------------------------------------------
     もともと「ほかの タブに 行っている あいだ」の ために 書いた 仕組み。
     T62 トライの §2-C（遊び方を 開いても ゲームが 止まらない）も
     まったく 同じ ことなので、名前を つけて 2か所から 呼ぶ形に した。

     止める … tick を 呼ばない（＝ ロボットは 1枚も 出さない）
     もどす … 止まっていた 時間だけ ロボットの 時計を うしろへ ずらす
              ＝ 帰ってきた 瞬間に「たまった ぶん」を 出す 事故を 消す

     深さ（depth）を 数えるのは、遊び方を 開いた まま ほかの タブに
     行かれても 二重に ずれない ように する ため。
     ============================================================ */
  var pauseDepth = 0, pausedAt = 0;

  function pauseClock() {
    pauseDepth++;
    if (pauseDepth === 1) pausedAt = performance.now();
  }
  function resumeClock() {
    if (pauseDepth <= 0) return;
    pauseDepth--;
    if (pauseDepth > 0) return;
    var gap = performance.now() - pausedAt;
    pausedAt = 0;
    if (!G || phase !== 'play' || gap <= 0) return;
    G.boardAt += gap;
    G.botLastAt += gap;
    if (G.flipAt) G.flipAt += gap;
  }

  /* ── 本物の 時計（1コマごとに 中身へ 今の時刻を わたす）───── */
  function loop() {
    raf = requestAnimationFrame(loop);
    if (phase !== 'play' || !G || pauseDepth > 0) return;   // ★ 止まっている あいだは 進めない
    var now = performance.now();
    var ev = tick(G, now);
    if (ev) showEvent(ev);
    if (G.over) endMatch();
  }

  /* ── タップ（★ 判定が 先・見た目が あと。連打を 1回も 落とさない）──
     入力に かぎを かけない。飛ぶ アニメの とちゅうでも 次が 押せる。 */
  function onTap(e) {
    var btn = e.target && e.target.closest ? e.target.closest('[data-slot]') : null;
    if (!btn) return;
    if (phase !== 'play' || !G || G.over) return;
    e.preventDefault();
    if (G.flipAt) return;                  // 「せーの！」の 間は 何も しない

    var slot = +btn.dataset.slot;
    var c = G.me.hand[slot];
    if (!c) return;

    var pile = -1;
    for (var p = 0; p < 2; p++) if (adjacent(c, top(G, p))) { pile = p; break; }  // 両方なら 左
    if (pile < 0) { noPlay(slot); return; }

    var res = play(G, 'me', slot, pile, performance.now());
    if (!res) { noPlay(slot); return; }

    paintCard(mySlots[slot], G.me.hand[slot], false);
    paintPile(pile, true);
    paintCounts();
    fly(res.card, btn, pileEls[pile]);
    if (G.over) endMatch();
  }

  /* 出せない札を おした ときの 返事（仕様 §3-3・社長裁定3で 大事さが 上がった）
     短く ゆれる ＋ 小さい音。それだけ。止めない・ばつを 与えない・とがめない。 */
  var noTimer = [0, 0, 0, 0];
  function noPlay(slot) {
    var el = mySlots[slot];
    el.classList.remove('is-no');
    void el.offsetWidth;
    el.classList.add('is-no');
    /* ★ 灰色は かならず 外す（T63）。ふだんは animationend が 先に 外す。
       これは アニメが 動かない 環境（動きを 減らす 設定など）の 保険。
       ⚠️ later() では なく 素の setTimeout ―― clearTimers() に 巻きこまれると
          灰色が 残った まま 試合が 終わって しまう。 */
    clearTimeout(noTimer[slot]);
    noTimer[slot] = setTimeout(function () { clearNo(el); }, TUNE.NO_CLEAR);
    beep();
  }

  /* ── 試合の 流れ ──────────────────────────── */
  function startMatch() {
    clearTimers();
    unlockResult();                       // ★ かぎを 持ちこさない（T63）
    $('resultWrap').classList.add('hidden');
    $('titleScreen').classList.add('hidden');
    $('playScreen').classList.remove('hidden');

    /* ★ えらばれた 速さ で 始める（T64）。
       ここが「決着の 画面で えらび直して もう1回」を 効かせている 1行。 */
    G = newGame(state.pace, performance.now());
    phase = 'count';
    paintAll();
    say('よーい……');

    var seq = ['3', '2', '1', 'スタート！'];
    seq.forEach(function (t, i) {
      later(function () { showCount(t); }, i * TUNE.COUNT_STEP);
    });
    later(function () {
      hideCount();
      var now = performance.now();
      G.boardAt = now;                     // ★ 人も ロボットも ここから よーいドン
      G.botLastAt = now;
      /* 数えている あいだに 遊び方を 開かれて いたら、止まっていた 時間を
         ここから 数え直す（数える 前の ぶんまで うしろへ ずらさない ため）*/
      if (pauseDepth > 0) pausedAt = now;
      phase = 'play';
      say('どんどん出そう！');
    }, seq.length * TUNE.COUNT_STEP);
  }

  /* ============================================================
     ★★ T274 ―「↻ やめる」（社長のお決め・設計図 追記⑩）★★
     ------------------------------------------------------------
     ★ 遊びを やめて、★はじめの 画面へ 戻る（★ロボットの 速さを 決め直せる）。
     ★ 聞きません（お決め②）―― ★確認の 箱は 作らない。
     ★★ 消えて 困る ものは 1つも ありません【★T274 実測】：
        ★ スピードは 点も 勝ち星も つづきも 持って いない。★1試合が 短い。
        ★ だから ボタンの 中の 小さい字（★ヨット・ブラックジャックの 決まり）も 要りません。
     ⚠️★ phase を 'title' に 戻す のが 大事 ―― ★これで 本物の 時計（loop）が
        ★ロボットを 1枚も 出さなく なる。★ここを 忘れると 見えない 所で 試合が 続く。
     ============================================================ */
  function quitToTitle() {
    clearTimers();
    unlockResult();
    phase = 'title';
    hideCount();
    clearAllNo();
    for (var i = 0; i < noTimer.length; i++) clearTimeout(noTimer[i]);
    $('resultWrap').classList.add('hidden');
    $('playScreen').classList.add('hidden');
    $('titleScreen').classList.remove('hidden');
    syncSpeedSelects();
    say('赤いカードが 自分の。1つちがいの 数字を どんどん出そう！');
  }

  /* ★ 「↻ やめる」を 出す／消す ―― ★遊ぶ画面が 出ている ときだけ 出す。
     ★★ あちこちに 書くと 1か所 書き忘れて ずれる ので、
        ★「遊ぶ画面が 出ているか」を そのまま 見る 形に した（★1か所だけ）。 */
  function syncQuit() {
    var q = $('btnQuitGame');
    if (!q) return;
    var on = !$('playScreen').classList.contains('hidden');
    q.classList.toggle('hidden', !on);
    var pad = document.querySelector('.topbar-pad');
    if (pad) pad.classList.toggle('hidden', !!on);
  }

  /* ============================================================
     ★★ T274 の 見張り ―「↻ やめる」（→ window.SPEED.verify）★★
     ------------------------------------------------------------
     ★ この 働きは、★T274 まで **どの本にも 見張られて いません でした**。
     ★ スピードには もともと verify が ありません でした（★autoPlay の check だけ）。
       ★★ だから ★**この1本だけ verify を 新しく 作りました**（★中身は この4つ）。
     ★ 4つを 見ます：
       ａ ★遊んで いる ときは **出ている**／★はじめの 画面では **消えている**
       ｂ ★★指の的が **44×44 ある**（★大富豪が 66×32 で 落ちて いた ところ）
       ｃ ★押すと **はじめの 画面へ 戻る**（★本物の click を 通す）
       ｄ ★「◀ ゲームを選ぶ」と **色で 見分けが つく**（★地の 色が ちがう）
     ⚠️★ ｂ は computed style を 読んでは いけません。
        ★ 44px と 書いて あっても、★ほかの 箱に 上書きされたら 押せません（T273 §4-1）。
        ★★ だから **elementFromPoint で 1pxずつ** 数えます。
     ⚠️★ ｃ は 本当に 押すので、★試合は はじめの 画面に 戻ります
        ★（★スピードは 時計で 動く ゲーム。★止めたものを 途中から 戻すと うそに なる ので、
          ★★戻さず「戻った ところ」で 終わります。★verify は たしかめ 専用の 窓口）。
     ============================================================ */

  /* ============================================================
     ★★★ T281 ―「↻」が **記号に 見えて いるか** の 見張り（★アトの 型・T279）★★★
     ------------------------------------------------------------
     ★ なぜ 要るか【実測】：★まえは `↻` を **字**で 出して いた ので、
       ★ ★Windows の Chrome で **9.77 × 11.5px**・★★やじりが **1画素も 出ず**、
       ★ ★★小さい「ʊ」に しか 見えません でした（★トライ T278／アト T279・16倍の 写真）。
       ★ ★形を 決めて いるのは **その端末の フォント**で、★私たちには 直せません。
       ★ ★→ ★**絵（インラインSVG）**に して、★端末に 任せない ことに しました。
     ★ ★見る 目は 6つ：
       ★ ①しるしが **SVG**（★字では ない）　②弧(.qi-arc)と やじり(.qi-tip)の **2パス**が ある
       ★ ③出る 画面では **16×16px**　　　　 ④字との あきが **3px 以上**
       ★ ⑤**出ない はばでは 本当に 出ない**　⑥太らせた せいで 44px の 的を 割って いない
     ★ ★★この本の 決まり：★はば **374px 以下**では しるしを 落とす（★CSS の @media そのもの）
     ⚠️★★ ⑤は **出ない はば（せまい 画面）で 走らせない と 鳴きません。**
       ★ ★アトは T279 で「★すべらない 画面で すべる 見張りを 試して 鳴らず」を やって います。
       ★ ★★同じ 穴です ―― ★**320px の 画面でも かならず 走らせて ください。**
     ★ ★さわった もの（hidden）は 1つ 残らず 戻します（★T144 §7-5）。
     ★ ★名前の ぶつかり：`t281IconCheck` は この ファイルに 1つも ありません（★先に 数えました）。
     ============================================================ */
  function t281IconCheck(doc, win) {
    var bad = [];
    var q = doc.querySelector('.quit-btn');
    if (!q) return ['★★★「↻」の ボタン（.quit-btn）が ありません'];
    var ico = q.querySelector('.quit-icon');
    if (!ico) return ['★★★しるし（.quit-icon）が ありません'];

    /* ① 字では なく 絵か（★はばに かかわらず 見る）*/
    if (String(ico.tagName).toLowerCase() !== 'svg') {
      bad.push('★★★しるしが 絵（SVG）では なく <' + ico.tagName + '> です'
        + ' ―― ★字だと 形を 端末の フォントに 任せる ことに なります（★実測 9.77×11.5px・やじり 0画素）');
    }
    /* ② 弧と やじりの 2パス */
    var arc = ico.querySelector ? ico.querySelector('.qi-arc') : null;
    var tip = ico.querySelector ? ico.querySelector('.qi-tip') : null;
    if (!arc) bad.push('★★弧（.qi-arc）が ありません');
    if (!tip) bad.push('★★やじり（.qi-tip）が ありません ―― ★やじりが 無いと「○」に しか 見えません');

    /* ★ いま かくれて いても 測れる ように、いちど 出して すぐ 戻す */
    var wasHidden = q.classList.contains('hidden');
    if (wasHidden) q.classList.remove('hidden');

    var W = win.innerWidth, H = win.innerHeight;
    var deru = W >= 375;                         /* ★ この本の 決まり */
    var cs = win.getComputedStyle(ico);
    var r = ico.getBoundingClientRect();
    var mieru = (cs.display !== 'none' && r.width > 0 && r.height > 0);

    if (deru && !mieru) {
      bad.push('★★★はば ' + W + 'px では しるしが 出る はずなのに 出て いません（display:' + cs.display + '）');
    } else if (!deru && mieru) {
      bad.push('★★★はば ' + W + 'px では しるしを 落とす 決まりなのに '
        + r.width.toFixed(1) + '×' + r.height.toFixed(1) + 'px で 出て います');
    }

    if (deru && mieru) {
      /* ③ 16×16px */
      if (r.width < 15.5 || r.width > 16.5 || r.height < 15.5 || r.height > 16.5) {
        bad.push('★★しるしが ' + r.width.toFixed(2) + '×' + r.height.toFixed(2) + 'px です（★16×16px の はず）');
      }
      /* ④ 字との あき 3px 以上（★T276 の しくじり ―― ★足して となりを 詰まらせない）*/
      var host = q.querySelector('.quit-main') || q;
      var tn = null, i;
      for (i = 0; i < host.childNodes.length; i++) {
        var nd = host.childNodes[i];
        if (nd.nodeType === 3 && nd.nodeValue.replace(/\s/g, '').length) { tn = nd; break; }
      }
      if (tn) {
        var rg = doc.createRange(); rg.selectNodeContents(tn);
        var aki = rg.getBoundingClientRect().left - r.right;
        if (aki < 3) bad.push('★★しるしと 字の あきが ' + aki.toFixed(2) + 'px しか ありません（★3px 以上 ほしい）');
      }
      /* ⑥ 44px の 的 と 帯からの あふれ */
      var qr = q.getBoundingClientRect();
      if (qr.height < 43.99 || qr.width < 43.99) {
        bad.push('★★しるしを 絵に した せいで ボタンが ' + qr.width.toFixed(1) + '×' + qr.height.toFixed(1)
          + 'px に なりました（★44×44 の 床）');
      }
      var bar = q.parentElement;
      if (bar) {
        var pr = bar.getBoundingClientRect();
        if (pr.width > 0 && qr.right > pr.right + 0.5) {
          bad.push('★★しるしを 足した せいで ボタンが 帯から ' + (qr.right - pr.right).toFixed(1) + 'px あふれました');
        }
      }
    }
    if (wasHidden) q.classList.add('hidden');
    return bad;
  }

  /* ★ 見張りの「この目 1つだけ」を 安く 呼べる 窓口（★ヨットの `_quitCheck` と 同じ 作法）。
     ★ ★verify() ぜんぶを 回さなくても `__t281IconCheck()` で この目 だけ 試せます。
     ★ ★中身は verify から 呼ばれる ものと **同じ 関数**です（★二重帳簿に しない）。 */
  try { window.__t281IconCheck = function () { return t281IconCheck(document, window); }; } catch (e) {}
  function quitCheck() {
    var bad = [];
    /* ★★★ T281 ―「↻」が 記号に 見えて いるか（★下の t281IconCheck）★★★ */
    t281IconCheck(document, window).forEach(function (s) { bad.push('★T281 しるし：' + s); });
    var q = $('btnQuitGame'), back = document.querySelector('.topbar .back');
    var play = $('playScreen'), title = $('titleScreen');
    if (!q) return ['★ボタンが 無い'];

    /* ★ 遊んで いない なら、まず 1試合 始める（★見張りの 空回りよけ）*/
    if (play.classList.contains('hidden')) { startMatch(); }

    /* ａ ★はじめの 画面では 消えて いる */
    title.classList.remove('hidden'); play.classList.add('hidden'); syncQuit();
    if (!q.classList.contains('hidden') || q.offsetParent !== null) bad.push('★はじめの 画面なのに 出ている');
    /* ａ ★遊んで いる ときは 出て いる */
    title.classList.add('hidden'); play.classList.remove('hidden'); syncQuit();
    if (q.classList.contains('hidden') || q.offsetParent === null) bad.push('★遊んで いるのに 出ていない');

    /* ｂ ★指の的 44×44 ―― ★1pxずつ 数える（★computed style を 読まない）*/
    var r = q.getBoundingClientRect();
    var cx = Math.round(r.left + r.width / 2), cy = Math.round(r.top + r.height / 2);
    var hit = function (x, y) { var e = document.elementFromPoint(x, y); return !!(e && (e === q || q.contains(e))); };
    if (t295HakoNoSoto(q, document.elementFromPoint(cx, cy))) {
      /* ★★ T295：★箱が 開いて いて この ボタンが その 外なら ―― ★ブラウザの 決まりで 押せません。
       ★ ★★傷では ない ので 見送ります（★箱の 中・★箱 以外の ふたは これまで どおり 鳴きます）。 */
    }
    else if (!hit(cx, cy)) bad.push('★まん中が 押せない');
    else {
      var up = 0, dn = 0, lf = 0, rt = 0, i;
      for (i = 1; i <= 60; i++) { if (hit(cx, cy - i)) up = i; else break; }
      for (i = 1; i <= 60; i++) { if (hit(cx, cy + i)) dn = i; else break; }
      for (i = 1; i <= 90; i++) { if (hit(cx - i, cy)) lf = i; else break; }
      for (i = 1; i <= 90; i++) { if (hit(cx + i, cy)) rt = i; else break; }
      if (lf + rt + 1 < 44 || up + dn + 1 < 44) bad.push('★指の的が 44×44 に 足りない（' + (lf + rt + 1) + '×' + (up + dn + 1) + '）');
    }
    if (r.right > document.documentElement.clientWidth + 0.5) bad.push('★画面の 右に はみ出した');

    /* ★ 上の帯が 伸びて いないか ―― ★ボタンを 消した ときと くらべる
       ★（★T273 §8-3 の 教え：★「空の 比べ」を 取らないと、★ゲーム自身の 伸びを
         ★ボタンの せいに して しまう）*/
    var bar = document.querySelector('.topbar');
    if (bar) {
      var withBtn = bar.getBoundingClientRect().height;
      var keepD = q.style.display; q.style.display = 'none';
      var without = bar.getBoundingClientRect().height;
      q.style.display = keepD;
      if (withBtn > without + 0.5) bad.push('★上の帯が ' + (withBtn - without).toFixed(1) + 'px 伸びた');
    }
    if (r.top < -0.5) bad.push('★画面の 上に はみ出した');

    /* ★ 手札・場の 山に 1pxも かぶって いないか */
    var ovc = 0, els = document.querySelectorAll('.hand-card,[data-slot],.pile,.pile-card,.side-row');
    for (var k = 0; k < els.length; k++) {
      var cr = els[k].getBoundingClientRect();
      var ow = Math.min(r.right, cr.right) - Math.max(r.left, cr.left);
      var oh = Math.min(r.bottom, cr.bottom) - Math.max(r.top, cr.top);
      if (ow > 0.5 && oh > 0.5) ovc += ow * oh;
    }
    if (ovc > 0.5) bad.push('★札に かぶった（' + ovc.toFixed(1) + 'px²）');

    /* ★★ ｅ ―― ★③の 字の 書きかえ（「やめる」→「◀ ゲームを選ぶ」）の 見張り ★★
       ------------------------------------------------------------
       ★ 字が 3字 → 8字 に 増えた ので、★となりの「もう1回 ▶」が やせます。
       ⚠️★★ 五目並べの はば320px で、★★★「もう／1／回」の 3行に 折れて いました。
          ★ 見つけたのは ★**写真**です。★数字の 見張り（あふれ・画面外）は
            ★★ぜんぶ 0 で **通して しまいました** ―― ★T273 §8-4 と 同じ 落とし穴。
          ★★ だから ここで **行の数**を 数えます（★字が 何行に なったか）。
       ★ あわせて ★行き先（href）と 字が 変わって いない ことも 見ます。 */
    var rw = $('resultWrap'), rAgain = $('btnAgain'), rQuit = $('btnQuit'), rBox = $('resultBox');
    if (rw && rAgain && rQuit && rBox) {
      var wasHid = rw.classList.contains('hidden');
      if (wasHid) rw.classList.remove('hidden');
      var lineCount = function (el) {
        var rg = document.createRange(); rg.selectNodeContents(el);
        var rs = rg.getClientRects(), tops = {}, cnt = 0;
        for (var li = 0; li < rs.length; li++) {
          if (rs[li].width <= 0 && rs[li].height <= 0) continue;
          var key = Math.round(rs[li].top / 3);
          if (!tops[key]) { tops[key] = 1; cnt++; }
        }
        return cnt;
      };
      var la = lineCount(rAgain);
      if (la > 1) bad.push('★結果の 箱の「もう1回」が ' + la + '行に 折れた');
      var ar = rAgain.getBoundingClientRect(), qr2 = rQuit.getBoundingClientRect(), br2 = rBox.getBoundingClientRect();
      if (ar.right > br2.right + 0.5 || ar.left < br2.left - 0.5) bad.push('★結果の 箱から「もう1回」が はみ出した');
      if (qr2.right > br2.right + 0.5 || qr2.left < br2.left - 0.5) bad.push('★結果の 箱から「◀ ゲームを選ぶ」が はみ出した');
      if (rQuit.getAttribute('href') !== '../') bad.push('★「◀ ゲームを選ぶ」の 行き先が 変わって いる（' + rQuit.getAttribute('href') + '）');
      if (rQuit.textContent.replace(/\s+/g, '') !== '◀ゲームを選ぶ') bad.push('★結果の 箱の 字が ちがう：' + rQuit.textContent);
      if (wasHid) rw.classList.add('hidden');
    }

    /* ｄ ★「◀ ゲームを選ぶ」と 色で 見分けが つく */
    if (back) {
      var qb = getComputedStyle(q).backgroundColor, bb = getComputedStyle(back).backgroundColor;
      if (qb === bb) bad.push('★「◀ ゲームを選ぶ」と 同じ 色（' + qb + '）');
    }

    /* ｃ ★押すと はじめの 画面へ 戻る（★本物の click）*/
    q.click();
    if (title.classList.contains('hidden')) bad.push('★押しても はじめの 画面に 戻らない');
    if (!play.classList.contains('hidden')) bad.push('★押しても 遊ぶ画面が 消えない');
    if (!$('resultWrap').classList.contains('hidden')) bad.push('★押しても 結果の 箱が 消えない');
    /* ★★ ここが スピードだけの 大事な 1行 ―― ★時計が 止まって いるか。
       ★ phase が 'play' の まま だと、★見えない ところで ロボットが 出し続けます。 */
    if (phase !== 'title') bad.push('★押しても 時計が 止まって いない（phase＝' + phase + '）');
    syncQuit();
    if (!q.classList.contains('hidden')) bad.push('★戻ったのに ボタンが 残っている');

    return bad;
  }


  /* ============================================================
     ★★★ T291 ―「見えない 押し代（44px）」の 見張り ★★★
     ------------------------------------------------------------
     ★ T291 で、★結果の箱（★と あそびかたの箱）の ボタンに
       ★★「**見た目は そのまま・指の的だけ たて44px**」の 押し代（`::after`）を 入れました。
       ★ ★もとは T118（フリーセル）・T289（アト）と 同じ 型です。
     ★ ここは その 押し代が **生きて いるか**を 数えます。★見るのは 5つ：
       ａ ★押し代が **消えて いない**（`::after` の content が none で ない）
       ｂ ★押し代の たてが **44px 以上**
       ｃ ★親に `position:relative` が **残って いる**（★外れると 押し代が 迷子に なる）
       ｄ ★★**見た目が 太って いない**（★下の 数字は T291 で 実測した たて。★これを 超えたら 鳴く）
       ｅ ★★本物の 指（`elementFromPoint`）で たて **44px 届く**・
          ★★★**となりの ボタンの 見た目を 取って いない**
     ⚠️★ computed style だけを 信じては いけません（★T273 §4-1）。
        ★ ★だから ｅ は **1pxずつ つついて** 数えます。
     ⚠️★ 画面の 下で **切れて いる** ときは ｅ を 数えません。
        ★ ★それは「44px 足りない」では なく「すべらせれば 出る」―― ★T289 §4 と 同じ 分けかた。
     ★ 出して 見る もの（結果の箱・あそびかたの箱）は、★**1つ 残らず 元に 戻します**（★T144 §7-5）。
     ============================================================ */
  function oshishiro() {
    /* ★ [えらび方, 見た目の たて(px)【★T291 実測】, となり（取っては いけない）, 出しかた] */
    var LIST = [
      ['#btnAgain', 43, ['#btnQuit'], 'result'],
      ['#helpDialog .dialog-ok', 43, [], 'help']
    ];
    var bad = [], mita = 0, i;
    var vw = window.innerWidth, vh = window.innerHeight;

    function atta(el, x, y) { var e = document.elementFromPoint(x, y); return !!e && (e === el || el.contains(e)); }
    function deteru(el) { return !!(el && el.getClientRects().length); }
    function kiru(el) {                       /* ★ 切る ふち（overflow が visible で ない 親）*/
      var p = el.parentElement;
      while (p && p !== document.documentElement) {
        var cs = getComputedStyle(p);
        if (cs.overflowY !== 'visible' || cs.overflowX !== 'visible') {
          var pr = p.getBoundingClientRect();
          return { t: pr.top + (parseFloat(cs.borderTopWidth) || 0), b: pr.bottom - (parseFloat(cs.borderBottomWidth) || 0) };
        }
        p = p.parentElement;
      }
      return null;
    }
    /* ★ 出す → 戻す（★戻す 関数を 返す）*/
    function hiraku(how) {
      var back = [];
      if (how === 'result') {
        var rw = document.getElementById('resultWrap');
        if (rw && rw.classList.contains('hidden')) { rw.classList.remove('hidden'); back.push(function () { rw.classList.add('hidden'); }); }
        var rb = document.getElementById('resultBox');
        if (rb && rb.classList.contains('is-locked')) { rb.classList.remove('is-locked'); back.push(function () { rb.classList.add('is-locked'); }); }
        /* ★★ 箱が 出る ときの「ぽん」（`animation:resultIn` ― 0.22秒）の **途中で 測らない**★★
           ★ ★この 動きは `transform:scale(.8)` から 始まります。★出した すぐ あとに 測ると
             ★★ 箱ごと 0.8倍に 縮んで いて、★★★44px の 押し代が **36px** に 見えました【★実測・T291】。
             ★ ★（★見張りを 先に 走らせて 見つけた しくじり ―― ★ゲームの ほうは 正しい）。
           ★ → ★数える あいだだけ 止めて、★終わったら 元に 戻します。
             ★★JS は 止まらずに 走るので、★**1コマも 絵には 出ません**。 */
        if (rb) { var ani = rb.style.animation; rb.style.animation = 'none'; back.push(function () { rb.style.animation = ani; }); }
        /* ★ かくれて いる 2つめ の ボタンも 出す（★3つ ならんだ いちばん つまった 形で 数える）*/
        ['btnSub', 'btnQuit'].forEach(function (id) {
          var e = document.getElementById(id);
          if (e && e.classList.contains('hidden')) { e.classList.remove('hidden'); back.push(function () { e.classList.add('hidden'); }); }
        });
      } else {
        var d = document.getElementById(how === 'help' ? 'helpDialog' : 'resultDialog');
        if (d && d.showModal && !d.open) {
          try { d.showModal(); back.push(function () { try { d.close(); } catch (e) {} }); } catch (e) {}
        }
      }
      return function () { for (var k = back.length - 1; k >= 0; k--) back[k](); };
    }

    function mitoru(row) {
      var sel = row[0], mitame = row[1], tonari = row[2];
      var el = document.querySelector(sel);
      if (!el) { bad.push('★T291：' + sel + ' が 居ない'); return; }
      if (!deteru(el)) return;                              /* ★ 出て いない ときは 数えない */
      var r = el.getBoundingClientRect();
      var cs = getComputedStyle(el), af = getComputedStyle(el, '::after');
      if (af.content === 'none') bad.push('★T291：押し代が 消えた（' + sel + '）');
      if (parseFloat(af.height) < 44) bad.push('★T291：押し代が ' + af.height + ' しか ない（' + sel + '）');
      if (cs.position === 'static') bad.push('★T291：position:relative が 外れた（' + sel + '）');
      if (r.height > mitame + 0.6) bad.push('★T291：見た目が ' + r.height.toFixed(1) + 'px に 太った（' + sel + '・T291 では ' + mitame + 'px）');

      var k = kiru(el);
      var mieru = (r.top >= 0 && r.bottom <= vh && (!k || (r.top >= k.t - 0.5 && r.bottom <= k.b + 0.5)));
      if (!mieru) return;                                   /* ★ 切れて いる ―― ｅ は 数えない */
      var cx = Math.round((r.left + r.right) / 2), cy = Math.round((r.top + r.bottom) / 2);
      if (cx < 0 || cx >= vw || cy < 0 || cy >= vh || !atta(el, cx, cy)) return;
      var T = cy, B = cy, j;
      for (j = 1; j <= 40; j++) { if (cy - j >= 0 && atta(el, cx, cy - j)) T = cy - j; else break; }
      for (j = 1; j <= 40; j++) { if (cy + j < vh && atta(el, cx, cy + j)) B = cy + j; else break; }
      mita++;
      if (B - T + 1 < 44) bad.push('★T291：指の的が たて ' + (B - T + 1) + 'px しか ない（' + sel + '）');

      for (j = 0; j < tonari.length; j++) {
        var o = document.querySelector(tonari[j]);
        if (!o || !deteru(o)) continue;
        var q = o.getBoundingClientRect();
        var ox = Math.round((q.left + q.right) / 2);
        var ys = [Math.round(q.top) + 1, Math.round(q.bottom) - 2];
        for (var m = 0; m < ys.length; m++) {
          if (ys[m] < 0 || ys[m] >= vh || ox < 0 || ox >= vw) continue;
          if (!atta(o, ox, ys[m])) bad.push('★T291：となりの ' + tonari[j] + ' の 見た目を 取った（y=' + ys[m] + '）');
        }
      }
    }

    var ways = [];
    for (i = 0; i < LIST.length; i++) if (ways.indexOf(LIST[i][3]) < 0) ways.push(LIST[i][3]);
    for (var w = 0; w < ways.length; w++) {
      var shimau = hiraku(ways[w]);
      try { for (i = 0; i < LIST.length; i++) if (LIST[i][3] === ways[w]) mitoru(LIST[i]); }
      finally { shimau(); }
    }
    return { '★NG': bad.length, '中身': bad.length ? bad : 'OK', '数えた ところ': mita };
  }

  /* ============================================================
     ★★★ T297 ―― ★上の帯が 画面に くっついて いるかの 見張り（🎨アト・2026-09-15）★★★
     ------------------------------------------------------------
     ★ ★T288 ②の 決まり：★**見つけた あと 鳴らす まで 作って はじめて 見張り**。
       ★ ★この 目は `verify()` の ★NG に 足されます（★記録するだけに しません）。
     ★ ★見るもの 4つ：
       ★ ①帯が `position:sticky` か
       ★ ②`--bar-pad-top` が ★**器（.app-shell）の 本当の padding-top と そろって いるか**
         ★ ★（★T279 `--bar-h`・★T264 `FLAT_H` と 同じ 形。★★数字を 2か所に 書いた ので、
         ★ ★★ずれたら ここが 鳴きます ―― ★★★ふたが 中身を 隠すか、すきまが 空く）
       ★ ③ふた(`.topbar::before`)が いて、★**空（body）と まったく 同じ 色**か
       ★ ④★**くっついた とき、帯の ボタンが 画面の 外へ 出ないか**（★押し代 ::after も 入れて 数える）
     ★ ★★すべらせずに 数だけで 出します（★T295 の「見張りが 遊びを 試す」を ふやさない ため）。
     ★ ⚠️★ポーカーの よこ向きは `.topbar{display:contents}` ＝ ★**帯の 箱が ありません**。
       ★ ★その ときは ①〜④を 見ず、★★かわりに「★ほどけて いるのに すべれたら 鳴く」に します
       ★ ★（★★出ない画面で 鳴る 赤ランプを 作らない ―― ★T292）。
     ============================================================ */
  function t297ObiCheck(doc, win) {
    var bad = [];
    var sh = doc.querySelector('.app-shell'), tb = doc.querySelector('.topbar');
    if (!sh || !tb) { bad.push('★T297：器（.app-shell）か 帯（.topbar）が ありません'); return bad; }
    var ts = win.getComputedStyle(tb);
    var d = doc.documentElement;
    var suberu = Math.max(0, d.scrollHeight - win.innerHeight);
    if (ts.display === 'contents') {
      if (suberu > 0) bad.push('★T297：帯が ほどけて いる（display:contents）のに ページが ' + suberu + 'px すべれます');
      return bad;
    }
    if (ts.position !== 'sticky') bad.push('★T297：帯が くっついて いません（position:' + ts.position + '）');
    var pad = parseFloat(win.getComputedStyle(sh).paddingTop) || 0;
    var v = parseFloat(ts.getPropertyValue('--bar-pad-top'));
    if (isNaN(v)) bad.push('★T297：--bar-pad-top が ありません');
    else if (Math.abs(v - pad) > 0.51) bad.push('★T297：--bar-pad-top ' + v + 'px と 器の 上の よはく ' + pad + 'px が ちがいます（ふたが ずれます）');
    var b = win.getComputedStyle(tb, '::before'), bo = win.getComputedStyle(doc.body);
    if (!b.content || b.content === 'none') bad.push('★T297：ふた（.topbar::before）が ありません');
    else {
      if (b.position !== 'absolute') bad.push('★T297：ふたが absolute で ありません（' + b.position + '）');
      if (b.pointerEvents !== 'none') bad.push('★T297：ふたが 指を 取ります（pointer-events:' + b.pointerEvents + '）');
      if (b.zIndex !== '-1') bad.push('★T297：ふたが 帯の 中身より 前に います（z-index:' + b.zIndex + '）');
      if (b.backgroundImage !== bo.backgroundImage) bad.push('★T297：ふたの 空が body と ちがいます');
      if (b.backgroundSize !== bo.backgroundSize) bad.push('★T297：ふたの 空の 大きさが body と ちがいます（' + b.backgroundSize + ' ／ body ' + bo.backgroundSize + '）');
    }
    var over = parseFloat(ts.top) || 0, tr = tb.getBoundingClientRect();
    var es = tb.querySelectorAll('a,button'), i;
    for (i = 0; i < es.length; i++) {
      var e = es[i], s2 = win.getComputedStyle(e), r = e.getBoundingClientRect();
      if (r.width < 0.5 || r.height < 0.5 || s2.display === 'none' || s2.visibility === 'hidden') continue;
      var top = r.top, a = win.getComputedStyle(e, '::after');
      if (a.content && a.content !== 'none' && a.position === 'absolute') {
        var ah = parseFloat(a.height) || 0;
        if (ah > r.height) top -= (ah - r.height) / 2;
      }
      var ue = (top - tr.top) + over;
      if (ue < -0.51) bad.push('★T297：くっつくと「' + String(e.innerText || e.id || '').replace(/\s+/g, ' ').slice(0, 12) + '」の 上が ' + ue.toFixed(1) + 'px ―― 画面の 外です');
    }
    return bad;
  }

  /* ★ スピードだけ：★ふたを 画面はばに した ので body{overflow-x:clip} が 要ります。
     ★ ★外すと **本物の よこの すべりバーが 15px 出ます**【★T297-16 実測・5画面で 鳴いた】。 */
  function t297SpeedClip(doc, win) {
    var ox = win.getComputedStyle(doc.body).overflowX;
    return (ox === 'clip' || ox === 'hidden') ? [] : ['★T297：body の overflow-x が ' + ox + ' です（よこの すべりバーが 出ます）'];
  }

  function verify() {
    var ng = quitCheck();
    var out = {
      '★NG': ng.length,
      '★「↻ やめる」（出る・44px・戻る・色で 見分く・時計が 止まる）': ng.length ? 'NG' : 'OK'
    };
    if (ng.length) out['NGの中身'] = ng;
    /* ★ T291 ―「見えない 押し代（44px）」の 見張り */
    var t291 = oshishiro();
    out['★T291 見えない 押し代（44px）'] = t291['★NG'] ? t291['中身'] : ('OK（数えた ' + t291['数えた ところ'] + 'か所）');
    if (t291['★NG']) out['★NG'] = (out['★NG'] || 0) + t291['★NG'];
    /* ★ T297 ― 上の帯が 画面に くっついて いるか ＋ よこの すべりバーの 止め */
    var t297 = t297ObiCheck(document, window).concat(t297SpeedClip(document, window));
    out['★T297 帯が くっついて いるか'] = t297.length ? t297 : 'OK';
    if (t297.length) out['★NG'] = (out['★NG'] || 0) + t297.length;
    console.log('[スピード] verify', out);
    return out;
  }

  function endMatch() {
    if (phase === 'end') return;
    phase = 'end';
    clearTimers();
    hideCount();
    later(showResult, TUNE.END_SILENCE);   // ★ 0.3秒 だまる（仕様 §5-1）
  }

  /* ============================================================
     ★ 決着の 瞬間、指が まだ 動いている あいだの かぎ（T63・T62 §2-A）
     ------------------------------------------------------------
     ボタンは 手札カードの 真上に かさなる（パソコンでは「やめる」も）。
     連打の 勢いで そのまま おすと、勝ち負けも 相手の 最後の1枚も 見ないまま
     次の 試合が 始まる ／ ゲーム一覧に 飛び出す。
     → 箱が 出てから TUNE.RESULT_LOCK ミリ秒 ＋ 指が 止まってから
       TUNE.RESULT_QUIET ミリ秒、おせなく する（上の TUNE の 説明を 読むこと）。
       ★ 見た目でも「まだ おせない」が 分かるように する（style.css）。
         おせそうな 見た目の まま おせない のは、もっと 悪い。

     ★T64：速さの プルダウンも 同じ かぎの 中に 入れる。
        ボタンと 同じ 箱の 中に あるので、連打の 勢いで 速さが かってに
        変わったら 台なし に なる。
        ・見た目／指 … style.css の .is-locked が .speed-pick も うすく し、
                       pointer-events:none で 触れなく する
                       （wrapper 側で 止める ので、その タップは 箱に 届いて
                         bumpLock が 走る ＝「指が 止まるまで」が そのまま 効く）
        ・キーボード … ここで select.disabled も 立てる（Tab＋矢印の すりぬけ 止め）
     ============================================================ */
  var resultLocked = false, resultLockTimer = 0, resultLockAt = 0;

  function armUnlock(ms) {
    clearTimeout(resultLockTimer);          // ★ 素の setTimeout（clearTimers に 巻きこませない）
    resultLockTimer = setTimeout(unlockResult, ms);
  }
  function lockResult() {
    resultLocked = true;
    resultLockAt = performance.now();
    $('resultBox').classList.add('is-locked');
    $('btnAgain').disabled = true;
    $('btnQuit').setAttribute('aria-disabled', 'true');
    $('btnQuit').setAttribute('tabindex', '-1');
    if ($('speedResult')) $('speedResult').disabled = true;   // ★T64
    armUnlock(TUNE.RESULT_LOCK);
  }
  /* まだ 指が 動いている ―― かぎを かけ直す。
     のこりの 待ち時間と「さわって いない 時間」の、長い ほうを 待つ。 */
  function bumpLock() {
    if (!resultLocked) return;
    var left = TUNE.RESULT_LOCK - (performance.now() - resultLockAt);
    armUnlock(Math.max(TUNE.RESULT_QUIET, left));
  }
  function unlockResult() {
    clearTimeout(resultLockTimer);
    resultLocked = false;
    $('resultBox').classList.remove('is-locked');
    $('btnAgain').disabled = false;
    $('btnQuit').removeAttribute('aria-disabled');
    $('btnQuit').removeAttribute('tabindex');
    if ($('speedResult')) $('speedResult').disabled = false;  // ★T64
  }

  function showResult() {
    var myLeft = leftOf(G.me), botLeft = leftOf(G.bot);

    if (G.winner === null) { startMatch(); return; }   // 引き分け（まれ）→ すぐ もう1回

    var won = G.winner === 'me';
    state.matches++;
    state.streak = won ? state.streak + 1 : 0;

    /* ★ ハッピーの ひとこと（★T64・社長裁定）
       ------------------------------------------------------------
       速さは もう かってに 変わらない。だから ハッピーは
       「速さは 自分で 変えられる」ことを 教える 役に なる。
         ・負け … 変えられる と 伝える（下の プルダウンに 目を 向けさせる）
         ・勝ち … 上へ さそう（速くしてみる？）
       ★ どちらも 1行だけ。説明を 足さない（設計図 §5.5）。 */
    var line;
    if (won) {
      if (state.streak >= 2) line = state.streak + '連勝！　もっと 速くしてみる？';
      else if (Math.abs(myLeft - botLeft) <= TUNE.CLOSE) line = '危なかった〜！　もっと 速くしてみる？';
      else line = 'やったー！　もっと 速くしてみる？';
    } else {
      line = 'おしい！　ロボットの速さ、変えられるよ！';
    }

    var title = $('resultTitle');
    title.textContent = won ? '勝ち！' : '負け…';
    title.classList.toggle('is-lose', !won);
    $('resultSay').textContent = line;

    var c = G.lastCard[G.winner] || top(G, won ? 0 : 1);
    $('resultCard').innerHTML = '<img src="' + cardSrc(c.key) + '" alt="" draggable="false">';
    lockResult();                          // ★ 出す 前に かける（T63）
    $('resultWrap').classList.remove('hidden');
    say(line);
  }

  /* ============================================================
     ★ たしかめ用の 窓口（window.SPEED）
     ------------------------------------------------------------
     画面には 1つも 出さない（お客さんに 見せる 物では ない）。
     ⚠️ ポーカーで「たしかめ用の 箱」を 消しわすれた 事故が あったので、
        このゲームでは 最初から 箱を 作っていない。
     ============================================================ */

  /* 同じ 配りを もう一度（既存の ポーカーと 同じ 作法）*/
  var realRandom = Math.random;
  function seed(n) {
    if (n === null || n === undefined) { Math.random = realRandom; return '種なし（毎回 ちがう）'; }
    var x = (n >>> 0) || 1;
    Math.random = function () {
      x ^= x << 13; x >>>= 0;
      x ^= x >>> 17;
      x ^= x << 5;  x >>>= 0;
      return x / 4294967296;
    };
    return '種 ' + n + '（同じ 配りが 何度でも おきる）';
  }

  /* ★ 自動で まわして たしかめる
     ------------------------------------------------------------
     画面を 使わず、仮想の 時計で 上の core を そのまま まわす
     （別の 作りに していない ＝ 本番と 同じ コードを 確かめている）。
     人は「見てから humanReact ミリ秒 ＋ 前の1手から humanPace ミリ秒」で 出す。 */
  function simMatch(pace, opt) {
    var g = newGame(pace, 0), t = 0, humanLastAt = 0, guard = 0;
    var bad = null;
    var minTotal = 52, maxTotal = 52;

    function check(where) {
      var n = countAll(g);
      if (n < minTotal) minTotal = n;
      if (n > maxTotal) maxTotal = n;
      if (n !== 52 && !bad) bad = where + ' で 札が ' + n + '枚';
    }

    while (!g.over && guard++ < 4000) {
      var meOpts = options(g, 'me'), botOpts = options(g, 'bot');

      if (!meOpts.length && !botOpts.length) {
        if (!canFlip(g)) {
          if (g.dryRecycles >= 3 || !recycle(g)) { endStuck(g); break; }
          check('まぜ直し');
        }
        t += TUNE.FLIP_PAUSE;
        doFlip(g, t);
        check('めくり直し');
        continue;
      }
      var tMe  = meOpts.length
        ? Math.max(t, humanLastAt + opt.humanPace, g.boardAt + opt.humanReact) : Infinity;
      var tBot = botOpts.length ? Math.max(t, botReadyAt(g)) : Infinity;

      if (tMe <= tBot) {
        t = tMe;
        var o = meOpts[Math.floor(Math.random() * meOpts.length)];
        play(g, 'me', o.slot, o.pile, t);
        humanLastAt = t;
      } else {
        t = tBot;
        var b = botChoose(g);
        if (!b) { bad = bad || 'ロボットの 手が 消えた'; break; }
        play(g, 'bot', b.slot, b.pile, t);
      }
      check('1枚 出したあと');
    }
    return {
      over: g.over, winner: g.winner, kind: g.endKind, guard: guard,
      minReact: g.stats.minReact, botPlays: g.stats.botPlays, flips: g.stats.flips,
      recycles: g.stats.recycles,
      total: countAll(g), bad: bad, minTotal: minTotal, maxTotal: maxTotal, ms: t
    };
  }

  function autoPlay(n, opts) {
    n = n || 100;
    opts = opts || {};
    var o = {
      humanPace:  opts.humanPace  == null ? 700 : opts.humanPace,   // 人が 1枚 出す 間かく
      humanReact: opts.humanReact == null ? 380 : opts.humanReact,  // 人が 場を 見てから
      pace:       opts.pace       == null ? state.pace : opts.pace
    };
    var errors = [], meWin = 0, botWin = 0, draw = 0, stuck = 0, unfinished = 0;
    var minReact = Infinity, flips = 0, totalMs = 0, badTotal = 0, recycles = 0;

    for (var i = 0; i < n; i++) {
      var r = simMatch(o.pace, o);
      if (r.bad) errors.push('#' + (i + 1) + ' ' + r.bad);
      if (r.total !== 52) badTotal++;
      if (r.minTotal !== 52 || r.maxTotal !== 52) badTotal++;
      if (!r.over) { unfinished++; errors.push('#' + (i + 1) + ' 決着しなかった'); }
      if (r.kind === 'stuck') stuck++;
      if (r.winner === 'me') meWin++; else if (r.winner === 'bot') botWin++; else draw++;
      if (r.minReact < minReact) minReact = r.minReact;
      flips += r.flips;
      recycles += r.recycles;
      totalMs += r.ms;
    }
    var out = {
      試合数: n,
      ロボットの速さ: o.pace + 'ms',
      エラー: errors.length ? errors.slice(0, 10) : 0,
      札がいつも52枚: (badTotal === 0 ? 'OK' : 'ちがう（' + badTotal + '件）'),
      決着しなかった: unfinished,
      ロボットの最短反応: (minReact === Infinity ? '―' : Math.round(minReact) + 'ms'),
      '320msより速く出したか': (minReact >= TUNE.REACT ? 'いいえ（守れている）' : '★はい（バグ）'),
      自分の勝ち: meWin, ロボットの勝ち: botWin, 引き分け: draw,
      まれな終わり方: stuck,
      めくり直しの平均: Math.round(flips / n * 10) / 10 + '回',
      まぜ直しの平均: Math.round(recycles / n * 100) / 100 + '回',
      '1試合の平均': Math.round(totalMs / n / 100) / 10 + '秒'
    };
    console.log('[SPEED] autoPlay', out);
    return out;
  }

  /* ★ paceCurve() は 消した（T64）。
     自動調整の 動きを 見る ためだけの もの で、その 仕組み ごと 無くなった。 */

  function speedLabel() {
    var i = levelOfMs(state.pace);
    return i < 0 ? '（手で 決めた 値）' : TUNE.SPEEDS[i].label;
  }

  window.SPEED = {
    /* ★ T297 ― 上の帯の 目だけを 呼ぶ 口（★verify から 呼ばれる ものと 同じ 関数。★二重帳簿に しない）*/
    t297: function () { return t297ObiCheck(document, window).concat(t297SpeedClip(document, window)); },
    now: function () {
      if (!G) return {
        場面: 'まだ 始めていない',
        えらんだ速さ: speedLabel(),
        ロボットの速さ: state.pace + 'ms'
      };
      return {
        場面: phase,
        自分の残り: leftOf(G.me) + '枚（手札 ' + handCount(G.me.hand) + '・山札 ' + G.me.deck.length + '）',
        ロボットの残り: leftOf(G.bot) + '枚（手札 ' + handCount(G.bot.hand) + '・山札 ' + G.bot.deck.length + '）',
        手札: [0, 1, 2, 3].map(function (i) { return G.me.hand[i] ? G.me.hand[i].suit + G.me.hand[i].rank : '―'; }),
        左の山: top(G, 0).suit + top(G, 0).rank + '（' + G.piles[0].length + '枚）',
        右の山: top(G, 1).suit + top(G, 1).rank + '（' + G.piles[1].length + '枚）',
        えらんだ速さ: speedLabel(),
        ロボットの速さ: G.pace + 'ms',
        次の試合の速さ: state.pace + 'ms',
        札の合計: countAll(G) + '枚',
        ロボットの最短反応: (G.stats.minReact === Infinity ? '―' : Math.round(G.stats.minReact) + 'ms'),
        めくり直し: G.stats.flips + '回',
        ロボットの時計: (pauseDepth > 0 ? '止まっている（遊び方 or ほかのタブ）' : '動いている'),
        結果のボタン: (resultLocked ? 'まだ おせない' : 'おせる'),
        勝敗: G.over ? (G.winner === 'me' ? '自分の勝ち' : G.winner === 'bot' ? 'ロボットの勝ち' : '引き分け') : '（まだ）',
        連勝: state.streak,
        試合数: state.matches
      };
    },
    autoPlay: autoPlay,
    /* ロボットの 速さを 直に 決める（トライの 調整用）。数字なしで 今の 値。
       ★T64：5だんかいの どれかに ぴったり 合えば プルダウンも そろえて おぼえる。
         合わない 数字（例 1750）は「その場かぎりの ためし」―― おぼえない。 */
    pace: function (ms) {
      if (ms == null) return state.pace;
      var v = Math.max(TUNE.PACE_MIN, Math.min(TUNE.PACE_MAX, Math.round(ms)));
      var i = levelOfMs(v);
      if (i >= 0) { setLevel(i); } else { state.pace = v; }
      if (G) G.pace = state.pace;
      return state.pace;
    },
    /* だんかいで えらぶ（0＝とても おそい … 4＝とても 速い）。数字なしで 今の 番号 */
    level: function (i) {
      if (i == null) return { 番号: state.level, 名前: speedLabel(), ミリ秒: state.pace };
      setLevel(i);
      return { 番号: state.level, 名前: speedLabel(), ミリ秒: state.pace };
    },
    seed: seed,
    tune: TUNE,
    verify: verify,        /* ★T274（★スピード初の verify。★中身は「↻ やめる」の 4つ）*/
    oshishiro: oshishiro,   /* ★T291 ―「見えない 押し代」の 見張り だけ 単体で 走らせる */
    play: startMatch,
    state: state,
    game: function () { return G; }
  };

  /* ============================================================
     はじめる
     ============================================================ */
  buildHands();
  buildSpeedSelects();                 // ★T64（2か所の プルダウンを 作って そろえる）
  $('btnStart').addEventListener('click', startMatch);
  $('btnAgain').addEventListener('click', startMatch);
  $('btnQuitGame').addEventListener('click', quitToTitle);   /* ★T274 */
  /* ★T274：遊ぶ画面の 出入りを そのまま 見て、「↻ やめる」を 出し入れする */
  if (window.MutationObserver) {
    new MutationObserver(syncQuit).observe($('playScreen'), { attributes: true, attributeFilter: ['class'] });
  }
  syncQuit();

  /* ★ 遊び方を 開いている あいだは ロボットの 時計を 止める（T63・T62 §2-C）
     初めての 人ほど とちゅうで「あれ、ルール なんだっけ」と 開く。
     読んでいる あいだに 出されたら 遊びに ならない。
     閉じ方は 3つ（×／分かった！／Esc）ある ので、close の 1か所で 受ける。 */
  var helpPaused = false;
  $('btnHowto').addEventListener('click', function () {
    if (!helpPaused) { helpPaused = true; pauseClock(); }
    $('helpDialog').showModal();
  });
  $('helpDialog').addEventListener('close', function () {
    if (helpPaused) { helpPaused = false; resumeClock(); }
  });
  document.querySelectorAll('[data-close]').forEach(function (b) {
    b.addEventListener('click', function () { $(b.dataset.close).close(); });
  });

  /* ★ 決着した 瞬間の 連打を 受け止める（T63）
     ・さわる たびに かぎを かけ直す ＝ 指が 止まるまで おせない
     ・見た目（pointer-events）だけだと キーボードの Enter が すりぬける ので、
       いちばん 外がわで もう一度 止める。 */
  var resultWrapEl = $('resultWrap');
  resultWrapEl.addEventListener('pointerdown', bumpLock, true);
  resultWrapEl.addEventListener('touchstart', bumpLock, { capture: true, passive: true });
  resultWrapEl.addEventListener('click', function (e) {
    if (resultLocked) { e.preventDefault(); e.stopPropagation(); bumpLock(); }
  }, true);

  /* ほかの タブに 行っている あいだは 時計を 止める。
     ブラウザは 見えない タブの requestAnimationFrame を 止めるので、
     何も しないと 帰ってきた 瞬間に ロボットが「たまった ぶん」を 出してしまう。
     いなかった 時間だけ ロボットの 時計を うしろへ ずらして、なかった ことに する。
     （T63：中身は pauseClock / resumeClock に 出して、遊び方と 共通に した）*/
  var hiddenPaused = false;
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible') {
      if (!hiddenPaused) { hiddenPaused = true; pauseClock(); }
    } else if (hiddenPaused) {
      hiddenPaused = false; resumeClock();
    }
  });

  /* タップは pointerdown で 受ける（click より 早い ＝ 速さの ゲームでは 効く）。
     入力に かぎは かけない ―― 連打を 1回も 落とさない ため。 */
  var hand = $('myHand');
  hand.addEventListener('pointerdown', onTap);
  hand.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') onTap(e);
  });

  loop();
})();
