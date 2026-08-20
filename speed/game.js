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
