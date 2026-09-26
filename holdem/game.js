/* ============================================================
   テキサス・ホールデム ― 第6段「手札の目安 ★」（T44）
   ------------------------------------------------------------
   ── ★★ T314（2026-09-26・社長のご指示「★全体的に もっと 良く したい」）★★ ──
     ① ★はじめの 画面「何ハンド 遊ぶ？」（3・5・7・10・15／はじめは 5）。★決めた 数で 終わり、
        ★最後の 結果（★コインの 増減・★順位）→「もう一度遊ぶ」「◀ ゲームを選ぶ」。
        ★「↻ さいしょから」は「↻ やめる」（★はじめの 画面へ）に ―― ★追記⑩ ⑤の 書き置き。
        ★ ⚠️ 下の ⑱「回数制なし」は ★これで 変わりました。
     ② ★結果を 卓の 上の 箱で 出す。★「つぎの ハンドへ ▶」は ★箱の 下の 段に いつも 見える。
     ③ ★自分が 降りても ロボット同士で 最後まで（★前から）。★終わったら ★4人 ぜんぶの 札を 開く。
        ★「カードは 見せないよ」は なくした。
     ⚠️ 遊びの 決まり（役の 強さ・かけの 決まり・ポットの 分け方）は 1文字も 変えて いない。
   ------------------------------------------------------------
   ── T54（2026-08-18・社長裁定「ポーカーと 同じく シンプルに」）──
     撤去した 表示（かけ・決着・サイドポットの ロジックは 1文字も 触っていない）：
       ・設定パネル まるごと（かけ方3段階／ロボットの強さ／手札の目安★）
         → ロボットは「つよい」固定・かけ金は 1枚きざみに 一本化
       ・「今の役」の 名札（常設パネル・目安★の 表示も いっしょに）
       ・役に つかう5枚の 光り（is-used／is-dim）
         → 強調は 画面に 1種類まで（設計図 §5.5「二層設計の上限」）
     ボタンは カタカナ主表記に（コール／レイズ／フォールド／チェック／オールイン
     ＋ 下に 小さく 日本語・§9.6の 例外リスト）。コイン枚数を ボタンの すぐ上に 出す。
     役の一覧「役の強さを 見る ▾」を ポーカーから 持ちこんだ（役の 情報源は これ1つ）。
     preflopGuide・場だけの役の 判定（PC.uses）は ロボットが 使うので 温存（表示だけ 消した）。
   ------------------------------------------------------------
   今回 足したもの（T44・T38 §6-4・§11 の 15）：
     ㉒ ★ 手札2枚の 目安 ―― 場のカードが 1枚も 無い ときの 判断材料。
        ①のかけの あいだだけ、名札の 中身が「今の役」→「手札の目安」に 変わる。
        ★の数（3つまで）＋ 見出し ＋ なぜ そう言えるかの 1行。
     ㉓ ★ 設定 3つめ「手札の目安 ★ 出す／出さない」（初期は 出す）。
        ⚠️ 3つめが 増えても 画面が 散らからない ように、この1つだけ
           「名前と ボタンを 横に ならべた 1行」に した（`.set-line`）。
     ㉔ ★★ 目安を **1か所きり**に した（preflopGuide）。
        画面に 出す ★と 言葉、ロボットと けんしょう用の 打ち手（HUMAN）が つかう 数、
        この2つを **同じ 関数から** 出す。前は 数だけ 書いてあり、言葉は まだ 無かった。
        ⚠️ 数の 出し方は 1文字も 変えていない ＝ 第5段の もうけの 数字は そのまま。

   ------------------------------------------------------------
   第5段（T43）で できていたもの ―― ぜんぶ そのまま 残してあります：
     ⑲ ★ ロボットの強さ 3つ（弱い／ふつう★／つよい）― 設定で 選べる・初期は「ふつう」
        ⚠️ かけ方3つ（かんたん／ふつう／ぜんぶ）とは **べつの じく**。
           かけ方 ＝ 自分の 操作の しやすさ ／ 強さ ＝ 相手の 手ごわさ。
     ⑳ ★ 3つの 性格を はっきり 分ける（ただ 数を 上げ下げ するのでは ない）
        ・弱い   … 自分の 役の 強さだけ 見る。よく ついてくる。上げるのは スリーカード以上。うそなし
        ・ふつう … ＋ 場の5枚の あぶなさを 見る（同じマーク3枚・場のペア・数の つながり）
        ・つよい … ＋ よい手だけ 勝負／大きく 上げる／よい手を わざと 小さく 出す／
                    よく 降りる人を おぼえて いて、少人数の ときだけ 仕掛ける
     ㉑ ★ 強さを 数で たしかめる 口（HOLDEM.bench）― 「ふつうの大人」の 打ち手を 相手に
        3つの 強さで まわして、1ハンドあたりの もうけを 出す

   ------------------------------------------------------------
   第4段（T42）までに できていたもの ―― ぜんぶ そのまま 残してあります：
     ⑬ ★ 勝負の 決着 ―― 残った人の 手札を ぜんぶ 開いて 役をくらべ、
        ポットを 勝った人へ わたす（判定も 分け方も PokerCore.settle）
     ⑭ ★ つかった5枚だけを 上下に ならべる ＋ 同じ役どうしの ▲「ここで 勝った／負けた」
     ⑮ ★ サイドポット ―― コインが 足りない人の「◯◯まで もらえる」の 1行
     ⑯ 引き分けの 山分け（割り切れない 1枚は 親の 左どなりから 1枚ずつ）
     ⑰ コインが 0に なったとき（ロボットは 復活／自分は ゲームオーバー）＋ 最高記録
     ⑱ 「つぎの ハンドへ ▶」で いつまでも 続く（回数制なし・社長の裁定）

   ⚠️ 第3段に あった「出したコインを みんなに もどす」仮の 処理は **消しました**。
      いまは かならず 勝ち負けを つけて ポットを 分けます。

   ------------------------------------------------------------
   第2段（T40）までに できていたもの ―― ぜんぶ そのまま 残してあります：
     ① 手札2枚・場のカード（3枚 → 1枚 → 1枚）・ロボット3人の 伏せ札
     ② ★ 今の役の名札（T38 §6-1）… 消えない 常設部品
     ③ ★ 役に つかっている5枚が 光る／つかっていない札は うすい（§6-2）
     ④ ★「場だけの役。みんな同じだよ」の1行（§6-2）
     ⑤ 「Aを1として使ったよ」の1行（§3-3）
     ⑥ 見本を 仕込める 口（window.HOLDEM）

   第3段（T41）で できていたもの ―― ぜんぶ そのまま 残してあります：
     ⑦ 4人の席（自分＋ロボット3人）・コイン200枚ずつ・親マーク🔘が1つずつ回る
     ⑧ 小がけ5／大がけ10 が 親の左から 順に 出る
     ⑨ かけの ボタン：降りる／かけない／合わせる／上げる／ぜんぶかける
     ⑩ ★ かけ方 3つ（かんたん＝おまかせ／ふつう＝3つから選ぶ／ぜんぶ＝1枚きざみ）
     ⑪ ポットの数字と、だれが いくら出したか
     ⑫ ★ かけが1周まわる（そろったら次へ／上げたら もう一度回る／降りた人はとばす／
        1人だけ残ったら その場で決着）

   まだ 作っていない（次の段）：
     強さのはしご 10段（§6-3）／ハンドが 終わった あとに 降りた ロボットの 手札を 見る（§6-6）／
     遊び方の3層・役の一覧（§8）／見た目の 作りこみ（🎨アト）

   ⚠️ 役の 判定は ぜんぶ ../poker-core.js（PokerCore）が やる。
      このファイルは「画面に 出す」だけ。判定の 計算を ここに 書かない。
   ⚠️ 説明文（「同じ数が3枚」など）は PokerCore.HAND_BY_ID から 引く。
      ここに 書きうつさない（T38 §2-4：説明文は 1か所きり）。
   ============================================================ */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var PC = window.PokerCore;

  if (!PC) {
    document.body.insertAdjacentHTML('afterbegin',
      '<p style="padding:16px;color:#a12727;font-weight:900">' +
      'poker-core.js が 読めませんでした。../poker-core.js を たしかめてください。</p>');
    return;
  }

  /* ───────── カードの 絵札（設計図 §9・厳守）─────────
     ・かならず office/games/cards/ の 社長の 画像を つかう。CSSや 記号で 自作しない。
     ・ファイル名が 日本語なので URL には encodeURIComponent() を 通す。
     ・全55枚で 約11MB あるので 先読みは しない。出た ぶんだけ 読む。
     ・ジョーカーは つかわない（52枚ちょうど・T38 §3-1）。 */
  var CARD_DIR = '../cards/';
  function cardSrc(file) { return CARD_DIR + encodeURIComponent(file) + '.png'; }
  /* 伏せ札（トランプ裏赤.png）は style.css の .seat-back が 背景で 出している。 */

  /* ★ T314：★配った しゅんかんに、★この ハンドで 出る 札（4人の 手札8枚＋場の 5枚）だけ 先に 読む。
     ★ わけ：★T314 で ハンドの 終わりに ★ロボットの 札を ぜんぶ 開く ように した。
       ★ ★読んで いない 札を 開くと ★「仮の 字 → 絵」の 2段階（★設計図 §9・大富豪 T120 の 症状）が 出る。
     ★ ★使わない 札は 読まない（★§9 の 本当の 意味）。★けんしょう（fast）の ときは 読まない。 */
  var preloaded = {};
  function preloadHand() {
    if (state.fast) return;
    var list = [];
    state.players.forEach(function (p) { list = list.concat(p.hole || []); });
    list = list.concat(state.board || []);
    list.forEach(function (c) {
      if (!c || preloaded[c.file]) return;
      preloaded[c.file] = true;
      var im = new Image();
      im.decoding = 'async';
      im.src = cardSrc(c.file);
    });
  }

  /* ───────── 進み具合（T38 §4-2）─────────
     0 ＝ 手札2枚だけ ／ 1 ＝ 場に3枚 ／ 2 ＝ 4枚め ／ 3 ＝ 5枚め */
  var STEPS = [
    { label: '手札',   open: 0 },
    { label: '場3枚',  open: 3 },
    { label: '4枚め',  open: 4 },
    { label: '5枚め',  open: 5 }
  ];
  var LAST_STEP = STEPS.length - 1;

  /* ───────── お金の きまり（T38 §5-1・社長の裁定 2026-08-17）───────── */
  var START_COINS = 200;   // 4人とも 200枚から
  var SMALL_BET   = 5;     // 小がけ（親の 左どなり）
  var BIG_BET     = 10;    // 大がけ（そのまた 左どなり）
  var SEATS       = 4;     // 自分＋ロボット3人（T38 §1-5・固定）
  var CPU_MAX_RAISE = 3;   // 1回の かけで ロボットが 上げるのは 3回まで（§5-3）

  /* 上乗せの 最小。1＝いくらでも 上乗せできる（社長指示・T58）
     'rule' に すると 本式（直前の 上げ幅ぶん 以上）に もどる */
  var MIN_RAISE_ADD = 1;   // 1 または 'rule'

  /* ───────── かけ方（T54：画面は 1枚きざみに 一本化）─────────
     MODES と POT_STEPS は autoPlay・matrix の けんしょう道具が 今も 使うので 温存。
     画面の 設定パネルは 撤去した（state.mode は 'full' 固定）。 */
  var MODES = {
    easy:   { label: 'かんたん', note: '金額は おまかせ' },
    normal: { label: 'ふつう',   note: '3つから 選ぶ' },
    full:   { label: 'ぜんぶ',   note: '自分で 決める' }
  };
  var POT_STEPS = [
    { f: 0.5, label: '少し'   },
    { f: 1.0, label: 'ふつう' },
    { f: 2.0, label: 'たくさん' }
  ];

  /* ───────── ロボットの 強さ（T54：画面は「つよい」固定）─────────
     3段階の 頭（BRAINS）は bench・matrix の けんしょうが 使うので 温存。 */
  var CPUS = {
    weak:   { label: '弱い',   note: 'よく ついてくる' },
    normal: { label: 'ふつう', note: 'それなりに 降りる' },
    strong: { label: 'つよい', note: 'よい手だけ 勝負' }
  };

  /* ───────── ★★ T314 ① 何ハンド 遊ぶか（★社長のご指示・2026-09-26）─────────
     ★ 形は ブラックジャックと 同じ ―― 3・5・7・10・15、★はじめは 5（おすすめ）。
     ★ ⚠️ 遊びの 決まり（役の 強さ・かけの 決まり）は 1文字も 変えて いない。
       ★ ★変えたのは「★何ハンドめで 終わりに するか」と「★終わったら 最後の 結果を 出す」だけ。 */
  var HANDS_CHOICES = [3, 5, 7, 10, 15];
  var HANDS_DEFAULT = 5;
  var RESULT_DELAY  = 700;   // ハンドが 終わってから 結果の 箱を 出すまで（★席の 札が 開くのを 先に 見せる）

  /* ───────── 今の ばめん ───────── */
  var state = {
    players: [],       // 4人。0番が 自分
    dealer: -1,        // 親マーク🔘の 席（ハンドごとに 1つ ずれる）
    handNo: 0,
    maxHands: HANDS_DEFAULT, // ★T314 ―― 何ハンド 遊ぶか（はじめの 画面で 決める）
    showResult: false, // ★T314 ―― 結果の 箱を 出して いるか（ハンドが 終わって RESULT_DELAY 後に true）
    pot: 0,
    toCall: 0,         // この1回転で そろえる 額
    lastRaise: BIG_BET,// 直前に 上げられた ぶん（つぎの 最低 上げ額）
    turn: 0,
    phase: 'setup',    // 'setup' はじめの 画面（★T314）/ 'bet' かけの とちゅう / 'end' ハンドが おわった /
                       // ※'over'（ゲームオーバー）は T314-2 で なくした / 'final' 決めた ハンド数が 終わった（★T314）/ 'demo' 見本
    step: 0,
    settle: null,      // 勝負の 決着（PokerCore.settle の こたえ）。見せずに もらった ときは null
    rows: [],          // 決着の 1行ずつ（画面に ならべる ため）
    split: false,      // ポットを 分けあった（引き分けが あった）か
    endNote: '',       // 決着の 見出し（勝った／負けた／引き分け／見せずに もらえた）
    best: START_COINS, // 最高記録（自分の コインの さいこう）
    newBest: false,    // このハンドで 最高記録を こえたか
    fast: false,       // true ＝ 待ち時間なし（けんしょう用）
    awaitMe: false,    // 自分の 番で 待っている
    injected: SEATS * START_COINS, // 世の中に 出したコインの 合計（0枚に なった人に 足したぶんも 入る）
    errors: [],        // コインの けいさんが 合わない ときだけ たまる
    logs: [],
    cpu: 'strong',     // T54：常に「つよい」（設定パネルは 撤去。dev の HOLDEM.cpu では 変えられる）
    foldStats: [],     // 席ごとの「何ハンドで 何回 降りたか」。つよいロボットだけ 見る
    /* 第2段からの もの（名札・光る5枚が これを 見ている） */
    hole: [], board: [], robots: [], result: null
  };

  var timers = [];
  function schedule(fn, ms) {
    if (state.fast) { fn(); return; }
    timers.push(setTimeout(fn, ms));
  }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  /* ============================================================
     コインの 出し入れ（ここ 1か所だけ。ほかで coins を さわらない）
     ============================================================ */
  /* ============================================================
     ★★★ T314-2（社長のお決め 2026-09-26「★途中で コインが 0に なったら マイナスに なって 続行」）★★★
     ------------------------------------------------------------
     ★ コインが 0 を 割っても ★ゲームオーバーに ならない。★「−170」の ように マイナスの まま 続く。
       ★ ★ロボットも 同じ（★前の「200枚 もらって 戻る」は なくした）。★「借金」の 字は 出さない。
     ★ ★そのとき「★いくらまで かけられるか」を 決める 必要が ある ―― ★コーダの 案（★社長に お見せする）：
       ★★【1ハンドで 出せる 上限（cap）】＝ ★ハンドの はじめの コイン ／ ★ただし 200枚より 少ない ときは 200枚
         ★ ・コイン 350 → ★350 まで（★前と 1枚も 同じ）
         ★ ・コイン 30  → ★200 まで（★足りない 170 は マイナスに なる）
         ★ ・コイン −90 → ★200 まで（★−290 まで 下がる ことが ある）
       ★ ★コール・レイズ・オールインは ★この 上限の 中で ★前と 同じ 決まり（★オールイン ＝ 上限まで）。
       ★ ★サイドポットも ★前と 同じ 決まりで 起きる（★上限が ちがう 人が 上限まで 出した とき）。
     ★ ⚠️ 役の 強さ・かけの 順番・上げ方の 決まり・ポットの 分け方は ★1文字も 変えて いない。
       ★ ★変えたのは「★お金が 足りない とき」の 上限 だけ ―― ★コインが 200 以上の 人の かけ方は ★前と 同じ。
     ============================================================ */
  var CAP_FLOOR = START_COINS;   // ★上限の 床（★いまの 最初の コインと 同じ 200）
  function capFor(coins) { return Math.max(coins, CAP_FLOOR); }

  /* ★ コインの 字（★0枚より 少ない ときは「−35」。★1,000 から 上は 3けたごとに「,」）
     ★ オリジナルラビット・ナボコフ（rabbit-game.js の fmt）と 同じ 形。 */
  function fmt(n) {
    var a = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (n < 0 ? '−' : '') + a;
  }

  function commit(p, amount) {
    /* ★T314-2：★しばるのは「持って いる コイン」では なく ★この ハンドの のこりの 上限（room） */
    amount = Math.max(0, Math.min(Math.round(amount), p.room));
    p.coins -= amount;   // ★マイナスに なって よい
    p.room  -= amount;   // この ハンドで あと いくら 出せるか
    p.bet   += amount;   // この1回転で 出したぶん
    p.put   += amount;   // このハンドで 出したぶん（合計）
    state.pot += amount;
    if (p.room <= 0) { p.room = 0; p.allIn = true; }   // ★上限まで 出した ＝ オールイン（★前は「コインが 0」）
    checkCoins('コインを 出したあと');
    return amount;
  }

  /* コインが 勝手に 増えたり 減ったり していないか（けんしょうの かなめ）
     ★T314-2：★コインの マイナスは もう まちがいでは ない。★かわりに「★上限を こえて 出して いないか」を 見る。 */
  function checkCoins(where) {
    var sum = 0, put = 0;
    state.players.forEach(function (p) {
      sum += p.coins; put += p.put;
      if (p.room < 0) state.errors.push(where + '：' + p.name + ' が 上限を こえて 出した');
      if (state.phase === 'bet' && p.cap != null && p.put + p.room !== p.cap) {
        state.errors.push(where + '：' + p.name + ' の 出した ' + p.put + ' ＋ のこり ' + p.room + ' ≠ 上限 ' + p.cap);
      }
    });
    if (sum + state.pot !== state.injected) {
      state.errors.push(where + '：合計が ちがう ' + (sum + state.pot) + ' ≠ ' + state.injected);
    }
    if (put !== state.pot) {
      state.errors.push(where + '：出した合計 ' + put + ' ≠ ポット ' + state.pot);
    }
    return state.errors.length === 0;
  }

  /* ============================================================
     席をつくる
     ============================================================ */
  function makePlayers() {
    state.players = [
      { name: 'あなた', me: true, coins: START_COINS },
      { name: 'ロボット1', me: false, coins: START_COINS },
      { name: 'ロボット2', me: false, coins: START_COINS },
      { name: 'ロボット3', me: false, coins: START_COINS }
    ].map(function (p) {
      p.hole = []; p.bet = 0; p.put = 0; p.gain = 0;
      p.folded = false; p.allIn = false; p.acted = false;
      p.last = ''; p.raises = 0;
      p.sKey = ''; p.sVal = 0;     // 手の よさの おぼえ書き（同じ場面で 何度も 数えない ため）
      p.lastPut = 0;               // ★T314：その ハンドで 出した 合計（結果の 箱の「−◯」。決着で put を 0 に する 前に 写す）
      p.cap = null; p.room = 0;    // ★T314-2：この ハンドで 出せる 上限（cap）と のこり（room）。startHand で 決める
      return p;
    });
    state.foldStats = state.players.map(function () { return { hands: 0, folds: 0 }; });
  }

  /* だれが よく 降りる人か（つよいロボットだけ 見る・§10「降りた回数を おぼえている」） */
  function foldRateOf(i) {
    var st = state.foldStats[i];
    if (!st || st.hands < 8) return 0.25;        // まだ 数が 足りない ときは ふつう あつかい
    return st.folds / st.hands;
  }

  function seatAt(i) { return ((i % SEATS) + SEATS) % SEATS; }
  function livePlayers()  { return state.players.filter(function (p) { return !p.folded; }); }
  function actablePlayers(){ return state.players.filter(function (p) { return !p.folded && !p.allIn; }); }

  /* ============================================================
     ハンドを はじめる
     ============================================================ */
  function startHand() {
    clearTimers();
    if (!state.players.length) makePlayers();

    /* ⚠️ とちゅうで 新しい ハンドに した ときは、ポットに 出ている コインを
       出した人に もどしてから 始める。ここを 忘れると コインが 消える。 */
    if (state.pot > 0) {
      state.players.forEach(function (p) { p.coins += p.put; p.put = 0; });
      state.pot = 0;
      log('とちゅうで やめたので、出したコインを もどしたよ');
    }

    /* ★★ T314-2：コインが 0 を 割っても ★もらわない（★ゲームオーバーも ない）。★マイナスの まま 続く。
       ★ 前は ロボット … 200枚 もらって 戻る／自分 … ゲームオーバーの 画面（T38 §4-6）でした。 */

    state.settle = null;
    state.rows = [];
    state.split = false;
    state.endNote = '';
    state.newBest = false;
    state.showResult = false;          // ★T314：結果の 箱を しまう（render が 見る）

    state.handNo++;
    state.dealer = seatAt(state.dealer + 1);   // ★ 親マークが 1つずつ 回る
    state.pot = 0;
    state.step = 0;
    state.phase = 'bet';
    state.result = null;

    state.players.forEach(function (p, i) {
      p.hole = []; p.bet = 0; p.put = 0; p.gain = 0;
      p.folded = false; p.allIn = false; p.acted = false;
      p.last = ''; p.raises = 0;
      p.sKey = ''; p.sVal = 0;
      p.cap = capFor(p.coins); p.room = p.cap;   // ★T314-2：この ハンドの 上限（★200 より 少ない ときは 200）
      p.handStart = p.coins;                     // ★T316-E：ハンドの はじめの コイン（★差し引きの もと）
      if (state.foldStats[i]) state.foldStats[i].hands++;
    });

    /* 配る（ジョーカーなし・52枚） */
    var deck = PC.shuffle(PC.createDeck());
    state.players.forEach(function (p) { p.hole = PC.draw(deck, 2); });
    state.board = PC.draw(deck, 5);
    syncStage2();
    preloadHand();

    log(state.handNo + 'ハンドめ。カードを配るよ');

    /* 小がけ・大がけ（親の 左から 順に）*/
    var sb = state.players[seatAt(state.dealer + 1)];
    var bb = state.players[seatAt(state.dealer + 2)];
    var paidS = commit(sb, SMALL_BET); sb.last = '小がけ ' + fmt(paidS);
    var paidB = commit(bb, BIG_BET);   bb.last = '大がけ ' + fmt(paidB);
    log(sb.name + 'が 小がけ ' + fmt(paidS) + ' ／ ' + bb.name + 'が 大がけ ' + fmt(paidB));

    state.toCall = Math.max(paidS, paidB, BIG_BET);
    state.lastRaise = BIG_BET;
    state.turn = seatAt(state.dealer + 3);   // 大がけの 左どなりから

    render();
    tick();
  }

  /* 第2段の 部品（名札・光る5枚）が 見ている ものを そろえる */
  function syncStage2() {
    state.hole = state.players[0].hole;
    state.robots = [state.players[1].hole, state.players[2].hole, state.players[3].hole];
  }

  /* ============================================================
     ★ かけが 1回転する ところ
     ============================================================ */
  function roundComplete() {
    var act = actablePlayers();
    if (act.length === 0) return true;
    /* 動ける人が 1人だけ ―― 出す ものが もう 無ければ、そこで 1回転は おしまい。
       （だれも 合わせられない ところに かけても 意味が ないため） */
    if (act.length === 1) return act[0].bet >= state.toCall;
    for (var i = 0; i < act.length; i++) {
      if (!act[i].acted || act[i].bet !== state.toCall) return false;
    }
    return true;
  }

  /* 手番を 進める。降りた人・ぜんぶかけた人は とばす。 */
  function tick() {
    if (state.phase !== 'bet') { render(); return; }

    if (livePlayers().length <= 1) { finishByFold(); return; }
    if (roundComplete()) { schedule(nextStreet, streetDelay()); render(); return; }

    var i = state.turn, guard = 0;
    while (guard++ <= SEATS && (state.players[i].folded || state.players[i].allIn)) i = seatAt(i + 1);
    state.turn = i;

    var p = state.players[i];
    if (p.me) {
      state.awaitMe = true;
      render();
    } else {
      state.awaitMe = false;
      render();
      schedule(function () { cpuAct(i); }, cpuDelay());
    }
  }

  function cpuDelay() {
    /* 自分が 降りたあとは 早送り（T38 §4-4）
       ★T314（社長：「★ロボット同士 だけに なったと しても、最後まで プレイして」）――
         ★降りた あとも ロボット同士で 最後まで 続く（★前から そう）。★待たせすぎない よう ★少し 速めに（1/2 → 0.45）。
       ⚠️ Math.random を 呼ぶ 回数は 前と 同じ 1回（★けんしょうの 種が ずれない）。 */
    var base = 600 + Math.random() * 600;
    return state.players[0].folded ? base * 0.45 : base;
  }
  /* ★T314：場を 開く 間も、自分が 降りた あとは 少し 速めに */
  function streetDelay() { return state.players[0] && state.players[0].folded ? 420 : 620; }

  /* つぎの 場（3枚 → 4枚め → 5枚め → 勝負） */
  function nextStreet() {
    if (state.phase !== 'bet') return;
    state.players.forEach(function (p) { p.bet = 0; p.acted = false; p.raises = 0; if (!p.folded) p.last = ''; });
    state.toCall = 0;
    state.lastRaise = BIG_BET;

    if (state.step < LAST_STEP) {
      state.step++;
      log(state.step === 1 ? '場に3枚 開いたよ' : (state.step === 2 ? '4枚め！' : '5枚め！ これで最後'));
      state.turn = seatAt(state.dealer + 1);   // 親の 左どなりから
      render();
      tick();
    } else {
      showdown();
    }
  }

  /* ============================================================
     ★ ここが 今回の 本体 ―― 勝負の 決着（T38 §6-6・§3-5・§5-5）
     ------------------------------------------------------------
     ⚠️ 役くらべも ポットの 分け方も、ぜんぶ PokerCore.settle が やる。
        このファイルは「だれが いくら もらったか」を コインに 足して、画面に 出すだけ。
     ============================================================ */

  /* 端数（割り切れない 1枚）を 配る 順番 ＝ 親の 左どなりから（T38 §3-5） */
  function oddOrder() {
    var out = [];
    for (var i = 1; i <= SEATS; i++) out.push(seatAt(state.dealer + i));
    return out;
  }

  /* いま だれが 最大 いくらまで もらえるか（§5-5「60まで もらえる」の 1行）。
     かけの さいちゅうにも つかうので、コインには さわらない。 */
  function capsNow() {
    if (!state.pot) return null;
    var anyAllIn = state.players.some(function (p) { return p.allIn && !p.folded; });
    if (!anyAllIn) return null;
    return PC.settle({
      players: state.players.map(function (p, i) {
        return { id: i, put: p.put, folded: p.folded, hand: null };
      }),
      order: oddOrder()
    }).caps;
  }

  function showdown() {
    state.phase = 'end';
    state.awaitMe = false;

    /* 残っている人 ぜんぶの 役を 出す（7枚 → いちばん強い5枚） */
    var entries = state.players.map(function (p, i) {
      return {
        id: i, put: p.put, folded: p.folded,
        hand: p.folded ? null : PC.evaluate(p.hole.concat(state.board))
      };
    });

    var res = PC.settle({ players: entries, order: oddOrder() });
    state.settle = res;

    /* もらった ぶんを コインに 足す（ここ以外で 足さない） */
    var paid = 0;
    state.players.forEach(function (p, i) {
      var got = res.payouts[i] || 0;
      p.coins += got;
      p.gain = got;
      paid += got;
    });
    if (paid !== state.pot) {
      state.errors.push('決着：分けた ' + paid + ' ≠ ポット ' + state.pot);
    }
    state.pot = 0;
    state.players.forEach(function (p) { p.lastPut = p.put; p.put = 0; p.bet = 0; });
    checkCoins('勝負の あと');

    buildShowdownRows(res, entries);
    finishHand();
  }

  /* 画面に ならべる 1行ずつを 作る。
     ★ ならべるのは「つかった5枚」だけ（7枚は 出さない・§6-6）。
     ★ 役が 同じどうしの ときだけ、決め手の カードに ▲ を つける。 */
  function buildShowdownRows(res, entries) {
    /* ★T314：4人 ぜんぶの 行を 作る（★降りた 人も 札を 開く ―― 社長のご指示③）*/
    var rows = buildResultRows(res, -1);
    state.rows = rows;

    /* 見出しの 1行 */
    var top = rows.filter(function (r) { return r.top; })[0];
    var me = rows.filter(function (r) { return r.me && !r.folded; })[0];
    var def = top ? PC.HAND_BY_ID[top.hand.id] : null;
    /* 「引き分け」は ポットを 分けあった ときだけ 言う。
       サイドポットで 2人が べつべつの ポットを とったのは 引き分けでは ない。 */
    var anySplit = res.pots.some(function (p) { return p.winners.length > 1; });

    state.split = anySplit;

    /* ★T316-C：「勝った」と 言うのは ★差し引きで 増えた 人（★いちばん 増えた 人の 名前）*/
    var best = rows.filter(function (r) { return r.net > 0; })[0];
    if (anySplit) {
      state.endNote = '引き分け！ コインを分けたよ';
    } else if (me && me.net > 0) {
      var myDef = PC.HAND_BY_ID[me.hand.id];
      state.endNote = myDef.name + '（' + myDef.short + '）で 勝った！ コイン ＋' + fmt(me.net);
    } else if (best && best.hand) {
      var bDef = PC.HAND_BY_ID[best.hand.id];
      state.endNote = best.name + 'が ' + bDef.name + '（' + bDef.short + '）で 勝った';
    } else if (top) {
      state.endNote = top.name + 'が ' + def.name + '（' + def.short + '）で 勝った';
    } else {
      state.endNote = '';
    }
    log(state.endNote);
  }

  /* ハンドの おしまい（決着の あとに かならず 通る ところ）。
     最高記録・ゲームオーバーの 見はり を ここ 1か所に まとめる。 */
  function finishHand() {
    var me = state.players[0];

    if (me.coins > state.best) {
      state.best = me.coins;
      state.newBest = true;
      /* ⚠️ けんしょう（autoPlay）の あいだは 記録を 残さない。
            何千ハンドも 自動で まわした 数字が、遊ぶ人の 最高記録に なって しまうため。 */
      if (!state.fast) {
        try { localStorage.setItem('holdem.best', String(state.best)); } catch (e) {}
      }
      log('最高記録！ コイン ' + fmt(state.best));
    }

    /* ★T314-2：★自分の コインが 0 を 割っても ★止めない（★前は ここで ゲームオーバー・T38 §4-6）。 */
    render();

    /* ★T314 ②：★席の 札が 開くのを 先に 見せて から、★卓の 上に 結果の 箱を 出す */
    schedule(function () {
      if (state.phase !== 'end' && state.phase !== 'over') return;
      state.showResult = true;
      guardUntil = 0; paintGuard();               // ★T316：箱が 出たら 前の 止めは 消す（★新しい 箱の ボタンは すぐ 押せる。★ふつうの 速さでは 押してから 箱まで 1.9秒 以上 ある）
      render();
      focusResultButton();
    }, RESULT_DELAY);
  }

  /* ※「コインを もらって もういちど」（restart）は T314-2 で なくした（★マイナスの まま 続く）。 */

  /* 1人だけ 残った → その場で 決着（T38 §4-3）
     ★★ T314（社長のご指示③「★何で 勝って どういう 状況か 把握したい ので、全部 見せて」）★★
       ★ ★遊びの 決まりは 前と 同じ ―― ★1人に なった しゅんかんに ポットを もらって 終わる（★かけは もう 無い）。
       ★ ★変えたのは 見せ方だけ：★**4人 ぜんぶの 札を 開き**、★まだ 開いて いなかった 場の 札も
         ★★うすく 見せて、★「★5枚 ぜんぶ 開いたら 何の 役だったか」を 出す。
       ★ ★前の「カードは 見せないよ」の 字は ★なくした。 */
  function finishByFold() {
    var winner = livePlayers()[0];
    var won = state.pot;
    winner.coins += won;
    winner.gain = won;
    state.pot = 0;
    state.players.forEach(function (p) { p.lastPut = p.put; p.put = 0; p.bet = 0; if (p !== winner) p.gain = 0; });
    state.phase = 'end';
    state.awaitMe = false;
    state.settle = null;               // 役くらべは して いない（★1人が のこった）
    state.split = false;
    checkCoins('1人だけ残って 決着');
    state.rows = buildResultRows(null, state.players.indexOf(winner));
    state.endNote = winner.me
      ? 'みんな降りた！ あなたの 勝ち ―― コイン ＋' + fmt(won - winner.lastPut)          // ★T316-E：差し引き
      : winner.name + 'の 勝ち！ ほかの みんなが 降りたよ（＋' + fmt(won - winner.lastPut) + '）';
    log(state.endNote);
    finishHand();
  }

  /* ============================================================
     ★★ T314 ③ 結果の 箱に 出す 行（★4人 ぜんぶ）
     ------------------------------------------------------------
     ★ 1人 1行：★手札2枚・★役（★場の 5枚 ぜんぶ ＋ 手札2枚 から 一番 強い 5枚）・★もらった／出した コイン。
     ★ ★降りた 人も 札を 開く（★役は「★残っていたら」と 書く）。
     ★ ⚠️ 役の 判定・ポットの 分け方は ★PokerCore が 正（★ここは 画面に 出す 形に するだけ）。
       ★ ★勝負まで 行った 人の 役は ★PokerCore.settle が くらべた ものと 同じ（★場は 5枚 ぜんぶ 開いて いる）。
     ★ ▲（★同じ 役どうしの 決め手）は ★前の「ここで 勝った／負けた」と 同じ 決め方（PC.decidingIndex）。
       ★ ★いまは 5枚を ならべない ので、★決め手の 札の 数字を 字で 書く（例「▲ 同じ役。Aで 勝った」）。
     ★ res …… PokerCore.settle の こたえ（★勝負まで 行った とき）／ null（★1人が のこった とき）
     ★ foldWinner …… 1人 のこった 人の 席（★res が null の とき）
     ============================================================ */
  function buildResultRows(res, foldWinner) {
    /* 👑 と 金色わくは「ポットを 1つでも とった人」に つける。
       ⚠️ いちばん 強い人 とは かぎらない ―― サイドポットが あると、
          弱い役でも 上の ポットを とることが あるため（§5-5）。 */
    var tookPot = {}, sdOf = {}, shared = {};
    if (res) {
      res.pots.forEach(function (pot) { pot.winners.forEach(function (id) { tookPot[id] = true; if (pot.winners.length > 1) shared[id] = true; }); });
      res.showdown.forEach(function (r) { sdOf[r.id] = r; });
    } else if (foldWinner >= 0) {
      tookPot[foldWinner] = true;
    }

    var rows = state.players.map(function (p, i) {
      var sd = sdOf[i];
      return {
        seat: i, name: p.name, me: p.me, hole: (p.hole || []).slice(),
        /* ★勝負した 人は settle が くらべた 役を そのまま。★ほかは 7枚から 数える（★見せる ため だけ） */
        hand: sd ? sd.hand : PC.evaluate((p.hole || []).concat(state.board)),
        place: sd ? sd.place : 0, top: !!(sd && sd.win), took: !!tookPot[i], shared: !!shared[i],
        gain: res ? (res.payouts[i] || 0) : (p.gain || 0), put: p.lastPut || 0,
        cap: res ? (res.caps[i] || 0) : 0,
        folded: !!p.folded, markText: ''
      };
    });

    /* ★★ T316-C・E（社長裁定）★★
       ★ 数は ★差し引き（net ＝ もらった − 出した ＝ ★その 人の コインの 動き そのもの）。
       ★ ★「勝ち」（👑・金色・ハッピーの やったー）は ★差し引きで 増えた 人 だけ。
       ★ ★前は「ポットを 1つでも 取った 人」を 勝ちと 数えて いた ので、★相手の 上限より 多く 出した ぶんが
         ★★戻って きた だけの 人（★差し引きは 負け）まで「勝った」と 言って いました【★トライ T316 3-1・7%】。 */
    rows.forEach(function (r) { r.net = r.gain - r.put; r.win = r.net > 0; });

    /* ▲ ―― キッカーという 言葉の かわり（§2-5・§6-6）。★勝負した 人どうしだけ */
    if (res && res.showdown.length >= 2) {
      var sdRows = res.showdown.map(function (r) { return rows[r.id]; });
      var strongest = sdRows[0];
      var i, k;
      for (i = 1; i < sdRows.length; i++) {
        if (sdRows[i].place > 1 && sdRows[i].hand.rank === strongest.hand.rank) {
          k = PC.decidingIndex(sdRows[i].hand, strongest.hand);
          if (k >= 0) sdRows[i].markText = '▲ 同じ役。' + sdRows[i].hand.best[k].rank + 'で 負けた';
        }
      }
      for (i = 1; i < sdRows.length; i++) {
        if (sdRows[i].place > 1 && sdRows[i].hand.rank === strongest.hand.rank) {
          k = PC.decidingIndex(strongest.hand, sdRows[i].hand);
          if (k >= 0) strongest.markText = '▲ 同じ役。' + strongest.hand.best[k].rank + 'で 勝った';
          break;
        }
      }
    }

    /* ならび：★ポットを とった 人 → ★勝負した 人（強い 順）→ ★降りた 人（席の 順） */
    rows.sort(function (a, b) {
      if (a.win !== b.win) return a.win ? -1 : 1;
      if (a.win && b.win) return (b.net - a.net) || (a.seat - b.seat);
      if (a.folded !== b.folded) return a.folded ? 1 : -1;
      if (!a.folded) return ((a.place || 9) - (b.place || 9)) || (a.seat - b.seat);
      return a.seat - b.seat;
    });
    return rows;
  }

  /* ============================================================
     ★★ T314 ① ハンド数で 終わる ―― ★決め手は ここ 1か所きり
     ------------------------------------------------------------
     ★ ハンドが 終わった あと、★結果の 箱の 下の ボタンを どれに するか：
       ★ 'next'    …「つぎの ハンドへ ▶」
       ★ ※ 'restart'（コインを もらって もういちど）は T314-2 で なくした（★コインが 0 を 割っても 続く）
       ★ 'final'   …「最後の 結果を 見る ▶」（★決めた ハンド数が 終わった）
     ★ ★画面（renderResult）も ★見張り（verify）も ★この 関数を 読む（★二重帳簿に しない）。
     ============================================================ */
  function afterHandStep(handNo, maxHands, phase) {
    if (handNo >= maxHands) return 'final';
    return 'next';
  }

  /* ★ 卓を まっさらに する（★はじめの 画面へ 戻る とき・★新しく 遊び始める とき）。
     ★ 中身は T277 の「さいしょから」（★bench() と 同じ 4行）＋ 結果の 箱を しまう だけ。
     ★ ★さいこう記録（state.best）には さわらない ―― ★localStorage に のこる。 */
  function resetTable() {
    clearTimers();
    raiseOpen = false;
    makePlayers();                          // 4人とも 200枚から
    state.injected = SEATS * START_COINS;   // 世の中に 出した コインの 合計を そろえ直す
    state.dealer = -1; state.handNo = 0; state.pot = 0;
    state.showResult = false; state.rows = []; state.settle = null;
    state.endNote = ''; state.split = false; state.newBest = false; state.awaitMe = false;
    state.logs = [];
    $('tableLog').innerHTML = '';
  }

  /* ★ はじめの 画面へ（★「↻ やめる」・★最後の 結果の「もう一度遊ぶ」・★ページを 開いた とき）*/
  function enterSetup() {
    resetTable();
    state.phase = 'setup';
    state.hole = []; state.board = []; state.robots = []; state.step = 0; state.result = null;
    render();
  }

  /* ★ 遊び始める（★はじめの 画面の「ゲームを始める ▶」）*/
  function startSession(n) {
    if (HANDS_CHOICES.indexOf(n) >= 0) state.maxHands = n;
    resetTable();
    startHand();
  }

  /* ============================================================
     ★★★ T316-A・B ―― ★箱が 閉じた（開いた）直後の 2つめの 指を ★下の ボタンに 届かせない ★★★
     ------------------------------------------------------------
     ★ トライ【実測】：①568×272 で「つぎの ハンドへ」2連打 → ★次の ハンドの「オールイン」（9回中 3回）
       ★ ②横向き 5画面で「最後の 結果を 見る」2連打 → ★「◀ ゲームを選ぶ」で 入口へ（400ms あけても）
     ★ 直し：★画面が 切りかわる しゅんかん（★箱が 閉じる／開く・★はじめの 画面へ・★遊び始める）から
       ★★GUARD_MS の 間は、★ボタン・リンクへの「押す」を ★1つも 通さない（★window の 一番 はじめで 止める）。
     ★ ★長さ 1000ms：トライは 150／400／800ms で 当たった（★800ms でも 1回）。★人の 2連打は ふつう 0.5秒 以内。
       ★ ★配った 直後 1秒 かけボタンが 効かない だけ（★札を 見る 時間）―― ★遊びの 決まりは 変わらない。
     ★ ★時計は performance.now（★Date.now は 写真の 道具が 止める ため 使わない）。
     ============================================================ */
  var GUARD_MS = 1000;
  /* ★※ 箱が「出た」ときには 止めない（★試した：出た とたんに「つぎへ」を 押す 人の 押しが 消える。
     ★ ★かけボタンの 2連打は 箱が 出る 0.7秒 前に 終わる ので、★出た ときの 止めは 要らない）*/
  var guardUntil = 0;
  function nowMs() { return (window.performance && performance.now) ? performance.now() : new Date().getTime(); }
  function armGuard(ms) { guardUntil = Math.max(guardUntil, nowMs() + (ms == null ? GUARD_MS : ms)); paintGuard(); }
  function guardOn() { return nowMs() < guardUntil; }

  /* ★★ T316-2 ①（社長のお決め・トライの 申し送り）―― ★止めて いる 間だけ ★ボタンを うすく ★★
     ★ トライ【実測】：すばやく 押す 子は 4ハンドに 1回、★押せる 見た目の まま 押しが 黙って 消えて いた。
     ★ → ★止めて いる 間は body に is-guard を 付け、★止めて いる ボタンを うすく（style.css の T316-2）。
       ★ ★切れたら すぐ 外す。★時計は performance.now を ★毎こま（requestAnimationFrame）見る
         ★（★setTimeout は 写真・けんしょうの 道具が 早回しに する ので 使わない ―― 止めと 見た目が ずれる）。
     ★ ★止める ボタンの 名前は GUARD_SEL の 1か所（★CSS と 同じ 並び。★ずれたら 見張り ⓦ が 鳴く）。 */
  var GUARD_SEL = '.act-btn, .next-hand, .btn-home, .start-button, .hands-btn, .quit-btn, .topbar .back, .ranks-toggle, .raise-ok, .step-btn';
  var guardRaf = 0;
  function paintGuard() {
    var on = guardOn();
    document.body.classList.toggle('is-guard', on);
    if (on && !guardRaf && window.requestAnimationFrame) guardRaf = requestAnimationFrame(guardTick);
  }
  function guardTick() {
    guardRaf = 0;
    paintGuard();
  }
  function guardClick(e) {
    if (!guardOn()) return;
    var t = e.target && e.target.closest ? e.target.closest('button, a, input, select, summary, [role="button"]') : null;
    if (!t) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
  }
  window.addEventListener('click', guardClick, true);

  /* ★ 結果の 箱の 下の ボタン（★どれを 押しても ここを 通る）*/
  function goNext() {
    if (!state.showResult || (state.phase !== 'end' && state.phase !== 'over')) return;
    armGuard();                                   // ★T316-A・B
    var step = afterHandStep(state.handNo, state.maxHands, state.phase);
    if (step === 'final') { clearTimers(); state.phase = 'final'; state.showResult = false; render(); focusResultButton(); }
    else startHand();
  }

  /* ★ 最後の 順位（★コインを もらった ぶんは 引いて 数える ―― ★もらって 1位、を 作らない）*/
  function finalRanks() {
    var list = state.players.map(function (p, i) {
      /* ★T314-2：もらう コインが 無く なった ので ★そのまま 数える（★マイナスも そのまま） */
      return { seat: i, name: p.name, me: p.me, coins: p.coins, net: p.coins - START_COINS };
    });
    list.sort(function (a, b) { return (b.net - a.net) || (a.seat - b.seat); });
    var rank = 0, prev = null;
    list.forEach(function (r, i) { if (prev === null || r.net !== prev) rank = i + 1; r.rank = rank; prev = r.net; });
    return list;
  }

  /* ★ 結果の 箱が 出たら、★下の ボタンに 手ざわりを 移す（★キーボードで すぐ 押せる・★画面は すべらせない）*/
  function focusResultButton() {
    if (state.fast) return;
    var ids = ['btnNextHand', 'btnFinal', 'btnAgain'];
    for (var i = 0; i < ids.length; i++) {
      var b = $(ids[i]);
      if (b && b.getClientRects().length) { try { b.focus({ preventScroll: true }); } catch (e) {} return; }
    }
  }

  /* ============================================================
     かける（この4つ以外の 出しかたは 無い）
     ============================================================ */
  function needOf(p)     { return Math.max(0, state.toCall - p.bet); }
  function minRaiseTo()  { return Math.max(state.toCall + state.lastRaise, BIG_BET); }
  function maxRaiseTo(p) { return p.bet + p.room; }   // ★T314-2：コインでは なく この ハンドの のこりの 上限
  function canRaise(p)   { return !p.allIn && maxRaiseTo(p) > state.toCall; }

  /* T58：自分が レイズするときの「上乗せ」の 下限。MIN_RAISE_ADD で 切りかえる。
     ロボットの 思考は これを 使わない（minRaiseTo のまま ＝ 強さは 変わらない） */
  function myMinAdd() {
    if (MIN_RAISE_ADD === 'rule') return Math.max(1, minRaiseTo() - state.toCall);
    return Math.max(1, MIN_RAISE_ADD | 0);
  }
  function myMinRaiseTo() { return state.toCall + myMinAdd(); }

  function afterAction(idx) {
    state.turn = seatAt(idx + 1);
    render();
    tick();
  }

  function doFold(idx) {
    var p = state.players[idx];
    p.folded = true; p.acted = true; p.last = '降りた';
    if (state.foldStats[idx]) state.foldStats[idx].folds++;
    log(p.name + 'が 降りた');
    afterAction(idx);
  }

  function doCheck(idx) {
    var p = state.players[idx];
    p.acted = true; p.last = 'かけなかった';
    log(p.name + 'は かけなかった');
    afterAction(idx);
  }

  function doCall(idx) {
    var p = state.players[idx];
    if (needOf(p) === 0) { doCheck(idx); return; }   // 出すものが 無ければ「かけない」と 同じ
    var paid = commit(p, needOf(p));
    p.acted = true;
    p.last = p.allIn ? ('ぜんぶかけた ' + fmt(p.bet)) : ('合わせた ' + fmt(p.bet));
    log(p.name + (p.allIn ? 'が ぜんぶかけた！ ' + fmt(paid) + '枚' : 'が 合わせた（' + fmt(paid) + '枚）'));
    afterAction(idx);
  }

  /* 上げる：raiseTo ＝ この1回転で 出す 合計にしたい 額 */
  function doRaise(idx, raiseTo) {
    var p = state.players[idx];
    var top = maxRaiseTo(p);
    raiseTo = Math.min(Math.max(Math.round(raiseTo), state.toCall + 1), top);
    var paid = commit(p, raiseTo - p.bet);
    var up = p.bet - state.toCall;
    if (up > 0) {
      state.lastRaise = Math.max(state.lastRaise, up);
      state.toCall = p.bet;
      /* ★ 上げた人が 出たら、そのあとの人に もう一度 回る */
      state.players.forEach(function (q) { if (q !== p && !q.folded && !q.allIn) q.acted = false; });
    }
    p.acted = true;
    p.raises++;
    p.last = p.allIn ? ('ぜんぶかけた ' + fmt(p.bet)) : ('上げた ' + fmt(p.bet));
    /* T58：「◯まで 上げた」は 分かりにくい（社長指示）。上乗せ と 合計 で 言う */
    log(p.name + (p.allIn ? 'が ぜんぶかけた！ ' + fmt(paid) + '枚' : 'が 上乗せ ' + fmt(up) + ' ／ ぜんぶで ' + fmt(p.bet) + '枚'));
    afterAction(idx);
  }

  function doAllIn(idx) {
    var p = state.players[idx];
    if (maxRaiseTo(p) > state.toCall) doRaise(idx, maxRaiseTo(p));
    else doCall(idx);   // 足りない ときは「合わせる」の かたちで ぜんぶ 出る
  }

  /* ============================================================
     ★★ 手札2枚の 目安 ―― 1か所きり（T38 §6-4・第6段の 本体）
     ------------------------------------------------------------
     ※ T54：★の 画面表示は 撤去した。いまは ロボットと けんしょう用の
        打ち手（HUMAN）、dev の HOLDEM.guideOf だけが この関数を 見る。
        数の 出し方は 1文字も 変えていない（bench の 数字が ずれないため）。

     見かたは §6-4 の 5つ だけ。上から 順に あてはめる：
        ペア ／ 大きい札が2枚 ／ 同じマーク ／ 数が となり同士 ／ どれでもない
     計算は 数くらべ だけ。勝つ見込みの ％は 出さない（§1-4）。
     ============================================================ */
  function preflopGuide(hole) {
    if (!hole || hole.length < 2) {
      return { id: 'none', score: 0.2, stars: 1, main: 'まだ カードが ないよ', why: '' };
    }
    var a = hole[0], b = hole[1];
    var hi = Math.max(a.value, b.value), lo = Math.min(a.value, b.value);
    var pair   = (a.rank === b.rank);          // 同じ数が 2枚
    var suited = (a.suit === b.suit);          // 同じマークが 2枚
    var gap    = hi - lo;
    var next   = (!pair && gap === 1);         // 数が となり同士
    var bigTwo = (!pair && lo >= 10);          // 両方 10以上（10 J Q K A）

    /* ── 中で つかう 数（0〜1）―― ロボットも 打ち手も これを 見る ── */
    var s;
    if (pair) {
      s = 0.50 + (hi - 2) / 12 * 0.42;             // 2のペア→.50 ／ Aのペア→.92
    } else {
      s = 0.10 + (hi - 2) / 12 * 0.26 + (lo - 2) / 12 * 0.14;
      if (suited) s += 0.07;                       // 同じマーク（フラッシュを ねらえる）
      if (gap === 1) s += 0.06;                    // 数が となり同士
      else if (gap === 2) s += 0.03;               // 1つ とんでいる（画面には 出さない）
      if (lo >= 10) s += 0.05;                     // 大きいカードが 2枚
    }
    s = Math.max(0.02, Math.min(0.97, s));

    /* ── 画面に 出す 言葉と ★（§6-4 の 表を 上から）── */
    var g;
    if (pair) {
      g = { id: 'pair', stars: 3, main: 'はじめから ペア！',
            why: '同じ数が 2枚。手札だけで もう そろっているよ' };
    } else if (bigTwo) {
      g = { id: 'big', stars: 3, main: '大きいカードが 2枚',
            why: '10より 大きい数が 2枚。そのままでも 勝ちやすいよ' };
    } else if (suited) {
      g = { id: 'suited', stars: 2, main: '同じマークが 2枚',
            /* 同じマークで なおかつ となり同士の ときは、両方 言う（どちらも ★★） */
            why: next ? '数も となり同士。フラッシュも ストレートも ねらえるよ'
                      : '同じマークだから、フラッシュを ねらえるよ' };
    } else if (next) {
      g = { id: 'next', stars: 2, main: '数が となり同士',
            why: '数が つづいているから、ストレートを ねらえるよ' };
    } else {
      g = { id: 'loose', stars: 1, main: 'ばらばら',
            why: 'つながりが ないよ。むずかしいかも' };
    }
    g.score = s;
    return g;
  }

  /* ※ guideNow（名札に 目安を 出すかの 判定）は T54 で 撤去した（名札ごと 無くなった） */

  /* ============================================================
     ★★ ロボットの 考え ―― 強さ 3段階（T38 §10・第5段の 本体）
     ------------------------------------------------------------
     考え方は 3つとも おなじ 3つの ものさし。
       ① 自分の 手は どれくらい よいか（0〜1）
       ② 場の5枚は どれくらい あぶないか（相手にも 役が できていそうか）
       ③ ポットに 対して いくら 出すのか（出すぶんが 大きいほど よい手が いる）
     ちがうのは「どれを 見るか」と「どこで 降りるか・上げるか」。
       弱い   … ① だけ 見る。②③は ほとんど 見ない → よく ついてくる／あまり 上げない
       ふつう … ①②③ ぜんぶ 見る → それなりに 降りる・それなりに 上げる
       つよい … ①②③ ＋ 相手の くせ（よく 降りる人か）→ よい手だけ 勝負・大きく 上げる
     ============================================================ */

  /* 役の 強さ（はしごの 10段）を 0〜1 の 数に する。
     ⚠️ 段の 番号（rank）は PokerCore が 正。ここでは 「どれくらい 勝てそうか」に 直すだけ。 */
  var RANK_BASE = [0, 0.10, 0.38, 0.58, 0.74, 0.84, 0.89, 0.93, 0.97, 0.99, 1.00];

  /* 場が 開くほど「これから よくなる」見こみが へる → 降りる線を 少し 上げる */
  var STREET_K = [0.72, 1.00, 1.05, 1.10];

  /* ① 手札2枚だけの とき ―― §6-4 の 目安（下の preflopGuide が 1か所きりの 正） */
  function preflopStrength(hole) { return preflopGuide(hole).score; }

  /* ① 場が 開いた あと ―― 今できている 役から */
  function madeStrength(hole, board) {
    var r = PC.evaluate(hole.concat(board));
    if (!r) return preflopStrength(hole);
    var s = RANK_BASE[r.rank] + (r.best[0].value - 2) / 12 * 0.05;
    /* ★ 場だけの役 ＝ みんな 同じ 役を 持っている。強く 見えても 勝てない（§6-2） */
    if (!PC.uses(r, hole)) s = Math.min(s, 0.34);
    return Math.max(0, Math.min(1, s));
  }

  /* いまの 自分の 手の よさ（同じ場面で 何度も 数えない ように おぼえておく） */
  function cpuStrength(p) {
    var board = openBoard();
    var key = state.handNo + ':' + board.length;
    if (p.sKey === key) return p.sVal;
    p.sKey = key;
    p.sVal = (board.length < 3) ? preflopStrength(p.hole) : madeStrength(p.hole, board);
    return p.sVal;
  }

  /* ② 場の5枚の あぶなさ（0〜0.35）。
     ⚠️ ここは「相手にも 役が できていそうか」を 見るところ。弱いロボットは 見ない。 */
  function boardDanger() {
    var b = openBoard();
    if (b.length < 3) return 0;
    var suits = {}, vals = {}, d = 0, maxSuit = 0, paired = false, trips = false, high = 0;
    b.forEach(function (c) {
      suits[c.suit] = (suits[c.suit] || 0) + 1;
      vals[c.value] = (vals[c.value] || 0) + 1;
      if (c.value >= 12) high++;
    });
    Object.keys(suits).forEach(function (k) { if (suits[k] > maxSuit) maxSuit = suits[k]; });
    Object.keys(vals).forEach(function (k) {
      if (vals[k] >= 2) paired = true;
      if (vals[k] >= 3) trips = true;
    });
    if (maxSuit >= 3) d += 0.14;                    // 同じマークが3枚（フラッシュ）
    if (maxSuit >= 4) d += 0.08;
    if (paired) d += 0.10;                          // 場が ペア（フルハウス・フォーカード）
    if (trips)  d += 0.06;
    var uniq = Object.keys(vals).map(Number).sort(function (x, y) { return x - y; });
    for (var i = 0; i + 2 < uniq.length; i++) {
      if (uniq[i + 2] - uniq[i] <= 4) { d += 0.08; break; }   // 数が つながっている
    }
    if (high >= 2) d += 0.05;                       // 大きい札が 2枚
    return Math.min(0.35, d);
  }

  /* まだ 残っている 相手が、どれくらい よく 降りる人か（つよい だけ つかう） */
  function foldyAround(idx) {
    var sum = 0, n = 0;
    state.players.forEach(function (q, i) {
      if (i === idx || q.folded) return;
      sum += foldRateOf(i); n++;
    });
    return n ? sum / n : 0;
  }
  function liveCount(idx) {
    var n = 0;
    state.players.forEach(function (q, i) { if (i !== idx && !q.folded) n++; });
    return n;
  }

  /* ───────── 3つの 性格（ここだけ 見れば ちがいが 分かる）─────────
     foldLine   … 降りる線（これより 手が わるいと 降りる）
     oddsWeight … 出すぶんが 大きいほど、どれだけ よい手を ほしがるか
     raiseLine  … ここより よければ 上げる ／ raiseChance … その うち 何回 上げるか
     allInLine  … ぜんぶ 出す ことに なる ときに ほしい 手の よさ
     betChance  … だれも かけていない ときに 自分から 出す かくりつ
     size       … ポットの 何ばい 出すか ／ jamLine … ここより よければ たまに ぜんぶ
     slowLine   … ここより よければ わざと 上げずに ようすを 見る（つよい だけ）
     bluff      … 手が わるくても 出す かくりつ（つよい だけ） */
  var BRAINS = {
    /* 弱い ―― 自分の 役だけ 見る。降りるのが おそい。上げるのは スリーカード以上（§10） */
    weak: {
      useDanger: false, dangerWeight: 0,
      foldLine: 0.10, oddsWeight: 0.22,
      raiseLine: 0.74, raiseChance: 0.30,
      allInLine: 0.34,
      betChance: function (s) { return s > 0.74 ? 0.30 : 0.05; },
      size: function () { return 0.5; },
      jamLine: 1.1, slowLine: 1.1,
      bluff: function () { return 0; }
    },
    /* ふつう ―― ＋ 場の あぶなさを 見る。たまに 上げる（§10） */
    normal: {
      useDanger: true, dangerWeight: 0.55,
      foldLine: 0.30, oddsWeight: 0.45,
      raiseLine: 0.70, raiseChance: 0.45,
      allInLine: 0.72,
      betChance: function (s) { return s > 0.62 ? 0.50 : (s > 0.45 ? 0.15 : 0.04); },
      size: function (s) { return s > 0.85 ? 0.9 : 0.6; },
      jamLine: 0.95, slowLine: 1.1,
      bluff: function () { return 0; }
    },
    /* つよい ―― よい手だけ 勝負／大きく 上げる／よい手を わざと 小さく／
                  よく 降りる人が 相手で 少人数の ときだけ 仕掛ける（§10） */
    strong: {
      useDanger: true, dangerWeight: 0.80,
      foldLine: 0.42, oddsWeight: 0.55,
      raiseLine: 0.62, raiseChance: 0.60,
      allInLine: 0.80,
      betChance: function (s) { return s > 0.58 ? 0.66 : (s > 0.44 ? 0.20 : 0); },
      size: function (s) { return s > 0.80 ? 0.8 : 0.6; },
      jamLine: 0.93, slowLine: 0.93,
      bluff: function (s, idx) {
        /* うそは「表情や おしゃべり」では やらない（§1-4）。かけた 金額だけで 伝える。
           相手が 1〜2人で、よく 降りる人の ときだけ。 */
        if (s > 0.44 || state.step < 1 || liveCount(idx) > 2) return 0;
        return 0.08 + foldyAround(idx) * 0.30;
      }
    }
  };

  /* いくらまで 上げるか（かけ方3つとは 関係ない。ロボット自身の 出し方） */
  function cpuRaiseTo(p, s, B) {
    var lo = Math.min(minRaiseTo(), maxRaiseTo(p));
    var hi = maxRaiseTo(p);
    var to = state.toCall + Math.round(Math.max(state.pot, BIG_BET) * B.size(s));
    if (s > B.jamLine && Math.random() < 0.25) to = hi;      // たまに ぜんぶかける
    return Math.min(Math.max(to, lo), hi);
  }

  /* ★ 決めるところ ―― ロボットも けんしょう用の 打ち手も、ここを 通る。
     返すのは「何を するか」だけ。コインには さわらない。 */
  function decideAction(p, B, idx) {
    var k = STREET_K[state.step] || 1;
    var need = needOf(p);
    var canR = canRaise(p) && p.raises < CPU_MAX_RAISE && maxRaiseTo(p) >= minRaiseTo();

    var s = cpuStrength(p);
    var want = B.useDanger ? (s - boardDanger() * B.dangerWeight) : s;
    want = Math.max(0, Math.min(1, want + (Math.random() - 0.5) * 0.06));   // すこし ゆらす

    /* だれも かけていない → 出すか、かけないか */
    if (need === 0) {
      var bc = B.betChance(want, idx) + B.bluff(want, idx);
      if (canR && Math.random() < bc) return { act: 'raise', to: cpuRaiseTo(p, want, B) };
      return { act: 'check' };
    }

    /* かけられている → 出すぶんの わりあいと くらべる */
    var odds = need / (state.pot + need);
    var line = (B.foldLine + odds * B.oddsWeight) * k;
    if (want < line) return { act: 'fold' };
    if (need >= p.room && want < B.allInLine * k) return { act: 'fold' };  // 合わせると 上限まで ぜんぶ 出る（★T314-2：coins → room）
    if (canR && want > B.raiseLine * k && Math.random() < B.raiseChance) {
      /* よすぎる 手は わざと 上げずに ようすを 見る（つよい だけ・§10「読ませない」） */
      if (want > B.slowLine && Math.random() < 0.35) return { act: 'call' };
      return { act: 'raise', to: cpuRaiseTo(p, want, B) };
    }
    return { act: 'call' };
  }

  function applyAction(idx, d) {
    if (d.act === 'fold')       doFold(idx);
    else if (d.act === 'check') doCheck(idx);
    else if (d.act === 'raise') doRaise(idx, d.to);
    else                        doCall(idx);
  }

  function cpuAct(idx) {
    if (state.phase !== 'bet') return;
    var p = state.players[idx];
    if (p.folded || p.allIn) { afterAction(idx); return; }
    applyAction(idx, decideAction(p, BRAINS[state.cpu] || BRAINS.normal, idx));
  }

  /* ============================================================
     ★ 役を 出す（判定は ぜんぶ PokerCore にまかせる）― 第2段のまま
     ============================================================ */
  function openCount() { return STEPS[state.step].open; }
  function openBoard() { return state.board.slice(0, openCount()); }
  function myCards()   { return state.hole.concat(openBoard()); }

  function recalc() {
    var list = myCards();
    state.result = (list.length >= 5) ? PC.evaluate(list) : null;
  }

  /* 役の「中身」の1行（例：7が3枚とKが2枚）。
     ⚠️ 役の 名前と 説明は PokerCore から 引く。ここで 作るのは 中身だけ。 */
  function handDetail(r) {
    if (!r) return '';
    var L = PC.rankLabel;
    var v = r.values, b = r.best;
    switch (r.id) {
      case 'royalFlush':    return b[0].ja + 'で そろった';
      case 'straightFlush': return b[0].ja + 'の ' + L(b[4].value) + 'から' + L(b[0].value) + 'まで';
      case 'fourOfAKind':   return L(v[0]) + 'が4枚';
      case 'fullHouse':     return L(v[0]) + 'が3枚と' + L(v[1]) + 'が2枚';
      case 'flush':         return b[0].ja + 'が5枚';
      case 'straight':      return L(b[4].value) + 'から' + L(b[0].value) + 'まで';
      case 'threeOfAKind':  return L(v[0]) + 'が3枚';
      case 'twoPair':       return L(v[0]) + 'が2枚と' + L(v[1]) + 'が2枚';
      case 'onePair':       return L(v[0]) + 'が2枚';
      case 'highCard':      return '一番強いのは ' + L(v[0]);
      default:              return '';
    }
  }

  /* ============================================================
     画面に 出す
     ============================================================ */
  function cardHTML(card, extraClass) {
    var label = card.ja + 'の' + card.rank;
    return '<div class="card ' + card.color + ' ' + (extraClass || '') + '" role="img" aria-label="' + label + '">'
      + '<span class="fallback">'
      +   '<span class="corner tl">' + card.rank + '<i>' + card.mark + '</i></span>'
      +   '<span class="pip">' + card.mark + '</span>'
      + '</span>'
      + '<img class="face-img" src="' + cardSrc(card.file) + '" alt="" draggable="false" decoding="async"'
      + ' onload="this.parentNode.classList.add(\'img-ok\')"'
      + ' onerror="this.parentNode.classList.add(\'img-failed\');this.remove()">'
      + '</div>';
  }

  function slotHTML() {
    return '<div class="card card-slot" aria-hidden="true"><span class="slot-mark">?</span></div>';
  }

  /* ※ 役に つかう5枚の 光り（markOf → is-used／is-dim）は T54 で 撤去した。
     判定そのもの（state.result・PC.uses）は ロボットと ハッピーが 今も 使う。 */

  function renderSeats() {
    var caps = capsNow();          // サイドポットが 起きている ときだけ 中身が 入る
    /* ★T314 ③：ハンドが 終わったら ★4人 ぜんぶの 手札を 開く（★降りた 人も・★1人 のこって 決まった ときも）。
       ★ 前は「勝負まで 行った とき、残った 人だけ」でした（§6-6）。★社長のご指示で 変えました。 */
    var open = (state.phase === 'end' || state.phase === 'over' || state.phase === 'final') && state.rows.length > 0;
    var html = state.players.map(function (p, i) {
      if (p.me) return '';
      var cls = 'seat'
        + (p.folded ? ' is-folded' : '')
        + (state.turn === i && state.phase === 'bet' && !p.folded && !p.allIn ? ' is-turn' : '');

      var cardsHTML;
      if (open) cardsHTML = (p.hole || []).map(function (c) { return cardHTML(c, 'is-mini'); }).join('');
      else if (p.folded) cardsHTML = '';
      else cardsHTML = (p.hole || []).map(function () { return '<span class="seat-back"></span>'; }).join('');

      /* ★ サイドポットの 1行（§5-5。出すのは この1行だけ） */
      var capLine = '';
      if (caps && p.allIn && !p.folded && caps[i] < state.pot) capLine = fmt(caps[i]) + 'まで もらえる';

      return '<div class="' + cls + '">'
        + '<p class="seat-name">🤖 ' + p.name
        +   (state.dealer === i ? '<span class="btn-mark" title="親">🔘</span>' : '')
        + '</p>'
        + '<div class="seat-cards">' + cardsHTML + '</div>'
        + '<p class="seat-coin' + (p.coins < 0 ? ' is-minus' : '') + '">コイン ' + fmt(p.coins) + '</p>'
        + '<p class="seat-bet">' + (p.bet > 0 ? '出した ' + fmt(p.bet) : '&nbsp;') + '</p>'
        + '<p class="seat-last">' + (capLine || p.last || '&nbsp;') + '</p>'
        + '</div>';
    }).join('');
    $('seats').innerHTML = html;
  }

  function renderMeInfo() {
    var p = state.players[0];
    if (!p) return;
    var caps = capsNow();
    var capLine = (caps && p.allIn && !p.folded && caps[0] < state.pot) ? fmt(caps[0]) + 'まで もらえる' : '';
    $('meInfo').innerHTML =
        '<span class="me-coin' + (p.coins < 0 ? ' is-minus' : '') + '">コイン ' + fmt(p.coins) + '</span>'
      + (state.dealer === 0 ? '<span class="me-tag btn-mark">🔘 親</span>' : '')
      + (p.bet > 0 ? '<span class="me-tag">出した ' + fmt(p.bet) + '</span>' : '')
      + (capLine ? '<span class="me-tag">' + capLine + '</span>' : '')
      + (p.folded ? '<span class="me-tag is-out">降りた</span>' : '')
      + (p.last && !p.folded ? '<span class="me-tag">' + p.last + '</span>' : '');
    $('tape').textContent = state.handNo + 'ハンドめ ・ コイン ' + fmt(p.coins)
      + '　最高 ' + fmt(state.best);
  }

  function renderPot() {
    $('pot').textContent = 'ポット ' + fmt(state.pot);
  }

  function renderBoard() {
    var open = openCount(), html = '';
    for (var i = 0; i < 5; i++) {
      if (i < open) html += cardHTML(state.board[i]);
      else html += slotHTML();
    }
    $('board').innerHTML = html;
  }

  function renderHand() {
    $('hand').innerHTML = state.hole.map(function (c) {
      return cardHTML(c);
    }).join('');
  }

  function renderSteps() {
    var showdown = (state.phase === 'end' || state.phase === 'over' || state.phase === 'final');   // ★T314：final も「勝負」
    $('steps').innerHTML = STEPS.map(function (s, i) {
      var cls = 'step' + (!showdown && i === state.step ? ' now' : '') + (showdown || i < state.step ? ' passed' : '');
      return '<span class="' + cls + '">' + s.label + '</span>';
    }).join('<span class="step-line" aria-hidden="true"></span>')
      + '<span class="step-line" aria-hidden="true"></span>'
      + '<span class="step end' + (showdown ? ' now' : '') + '">勝負</span>';
    $('stageChip').textContent = showdown ? '勝負' : STEPS[state.step].label;
  }

  /* ※「今の役」の 名札（renderHandName）と 目安★の 表示は T54 で 撤去した。
     役の 名前は 勝負の わく（renderShowdown）と 役の一覧の 印で 分かる。 */

  /* ============================================================
     ★ 役の強さの一覧（T54で ポーカーから 持ちこみ）
     ------------------------------------------------------------
     ・中身は PokerCore.HANDS から 自動で 作る（手書きの 一覧は 作らない。
       HANDS は 強い順に ならんでいるので、その順の まま 出す）
     ・どの 場面でも ボタンで 開ける（ゲームは 止めない）
     ・今の 自分の役の 行に 印を つける（一覧の 中の「今どこか」）
     ============================================================ */
  var ranksOpen = false;

  function buildRanks() {
    $('ranksList').innerHTML = PC.HANDS.map(function (h, i) {
      return '<li class="ranks-row" data-hand="' + h.id + '">'
        + '<span class="ranks-no">' + (i + 1) + '位</span>'
        + '<span class="ranks-body">'
        +   '<b class="ranks-name">' + h.name + '</b>'
        +   '<small class="ranks-desc">' + h.desc + '</small>'
        + '</span>'
        + '<span class="ranks-now">← 今の役</span>'
        + '</li>';
    }).join('');
  }

  function renderRanks() {
    var btn = $('btnRanks');
    btn.textContent = ranksOpen ? '🃏 役の強さを 閉じる ▲' : '🃏 役の強さを 見る ▾';
    btn.setAttribute('aria-expanded', ranksOpen ? 'true' : 'false');
    $('ranksBox').classList.toggle('hidden', !ranksOpen);
    if (!ranksOpen) return;
    var nowId = state.result ? state.result.id : '';
    Array.prototype.forEach.call($('ranksList').children, function (li) {
      var isMe = li.dataset.hand === nowId;
      li.classList.toggle('is-me', isMe);
      if (isMe) li.setAttribute('aria-current', 'true');
      else li.removeAttribute('aria-current');
    });
  }

  /* ============================================================
     ★★ T314 ② 結果の 箱（★卓の 上に 重ねる）を 描く
     ------------------------------------------------------------
     ★ 前は 決着の わく（.showdown）が ★手札の 下に 流れて いて、
       ★★「つぎの ハンドへ ▶」は その また 下 ―― ★小さい 画面では スクロールが 要りました
       ★【★実測 T314-01：568×272 で ボタンの 上が 663px（★画面は 272px）】。
     ★ いまは ★画面に くっついた 箱（CSS の .result-layer＝position:fixed）の ★下の 段に ボタンを 置く。
       ★★中身が 多い 小さい 画面では ★中身だけ 箱の 中で すべる（★ボタンは いつも 見える）。
     ★ 中身：★場の 5枚／★4人の 行（buildResultRows）／★ポットが 分かれた ときの 1行。
     ============================================================ */
  var shownKey = '';   // ★箱を 出した「その ハンド」を おぼえる（★出た しゅんかんだけ 中の すべりを 上へ 戻す）

  function renderResult() {
    var layer = $('resultLayer'), box = $('showdownBox'), fin = $('finalBox');
    var showBox = !!(state.showResult && (state.phase === 'end' || state.phase === 'over') && state.rows.length);
    var showFin = (state.phase === 'final');
    layer.classList.toggle('hidden', !(showBox || showFin));
    box.classList.toggle('hidden', !showBox);
    fin.classList.toggle('hidden', !showFin);
    document.body.classList.toggle('is-result', showBox || showFin);

    var key = showBox ? ('h' + state.handNo + state.phase) : (showFin ? 'final' : '');
    if (key && key !== shownKey) {
      var scs = layer.querySelectorAll('.rs-scroll');
      for (var s = 0; s < scs.length; s++) scs[s].scrollTop = 0;
    }
    shownKey = key;

    if (showBox) fillResult();
    if (showFin) fillFinal();
  }

  function fillResult() {
    /* ハッピーが 箱の いちばん 上で しゃべる（§9.5）*/
    $('sdTitle').textContent = happyMessage();
    /* ★「（＋｜64）」の ように 数の 前で 折れない よう、★「＋64」「コイン 60」を ひとかたまりに する。
       ★ endNote は この ファイルが 作る 字だけ（★人の 入力は 入らない）。★念のため < & は 消して から 包む。 */
    $('sdLead').innerHTML = String(resultLead()).replace(/[<>&]/g, '')
      .replace(/(（?[＋−]?\s?\d+枚?）?)/g, '<span class="nb">$1</span>');

    /* 場の 5枚。★開く前に 終わった 札は うすく（★「5枚 ぜんぶ 開いたら」の 役を 出して いる ため）*/
    var open = openCount(), bh = '';
    for (var i = 0; i < 5; i++) {
      if (state.board[i]) bh += cardHTML(state.board[i], 'is-mini' + (i >= open ? ' is-unopened' : ''));
    }
    $('sdBoard').innerHTML = bh;
    $('sdBoardNote').classList.toggle('hidden', open >= 5);

    $('sdRows').innerHTML = state.rows.map(function (r) {
      var def = r.hand ? PC.HAND_BY_ID[r.hand.id] : null;
      var gainCls, gainText;
      /* ★T316-E：★差し引き（★その 人の コインの 動き そのもの）*/
      if (r.net > 0)      { gainCls = 'is-plus';  gainText = '＋' + fmt(r.net); }
      else if (r.net < 0) { gainCls = 'is-minus'; gainText = '−' + fmt(-r.net); }
      else                { gainCls = 'is-zero';  gainText = '±0'; }
      var hand = def
        ? '<p class="rs-hand">'
          + (r.folded ? '<small class="rs-if">残っていたら</small>' : '')
          + '<b>' + def.name + '</b><small>' + handDetail(r.hand) + '</small></p>'
        : '';
      return '<div class="rs-row' + (r.win ? ' is-win' : '') + (r.me ? ' is-me' : '') + (r.folded ? ' is-out' : '') + '" data-seat="' + r.seat + '">'
        + '<div class="rs-cards">' + r.hole.map(function (c) { return cardHTML(c, 'is-mini'); }).join('') + '</div>'
        + '<div class="rs-body">'
        +   '<p class="rs-head">'
        +     '<span class="rs-who">' + (r.win ? '👑 ' : '') + (r.me ? 'あなた' : r.name) + '</span>'
        +     (r.folded ? '<span class="rs-out-tag">降りた</span>' : '')
        +     '<span class="rs-gain ' + gainCls + '">' + gainText + '</span>'
        +   '</p>'
        +   hand
        +   (r.markText ? '<p class="rs-mark">' + r.markText + '</p>' : '')
        + '</div>'
        + '</div>';
    }).join('');

    /* ポットが 2つ以上に 分かれた ときだけ、下に 1行 */
    var st = state.settle;
    $('sdPots').textContent = (st && st.pots.length > 1)
      ? 'ポットは ' + st.pots.length + 'つに 分かれたよ（コインが 足りない人が いたため）'
      : '';

    /* 下の 段：★どの ボタンを 出すかは afterHandStep 1か所きり */
    var step = afterHandStep(state.handNo, state.maxHands, state.phase);
    $('btnNextHand').classList.toggle('hidden', step !== 'next');
    $('btnFinal').classList.toggle('hidden', step !== 'final');
    $('nextSmall').textContent = (state.handNo + 1) + ' / ' + state.maxHands + ' ハンドめ';
    $('finalSmall').textContent = state.maxHands + 'ハンド 遊んだよ';
    /* ※ ゲームオーバーの 箱と「コインを もらって もういちど」は T314-2 で なくした（★マイナスの まま 続く） */
  }

  /* ★★ T314 ① 決めた ハンド数が 終わったら ―― ★最後の 結果（★コインの 増減・★順位）*/
  function fillFinal() {
    var list = finalRanks();
    var me = list.filter(function (r) { return r.me; })[0];
    var p0 = state.players[0];
    function signed(n) { return (n > 0 ? '＋' : (n < 0 ? '−' : '±')) + fmt(Math.abs(n)) + '枚'; }

    $('finalSay').textContent = happyMessage();
    $('finalTo').textContent = fmt(p0.coins);
    $('finalTo').parentNode.classList.toggle('is-minus', p0.coins < 0);   // ★T314-2：マイナスは ピンク
    var d = $('finalDiff');
    d.textContent = signed(me.net);
    d.className = 'final-diff ' + (me.net > 0 ? 'is-plus' : (me.net < 0 ? 'is-minus' : 'is-zero'));

    $('finalRank').innerHTML = list.map(function (r) {
      return '<li class="fr-row' + (r.rank === 1 ? ' is-top' : '') + (r.me ? ' is-me' : '') + '">'
        + '<span class="fr-rank">' + r.rank + '位</span>'
        + '<span class="fr-name">' + (r.rank === 1 ? '👑 ' : '') + r.name + '</span>'
        + '<span class="fr-coins' + (r.coins < 0 ? ' is-minus' : '') + '">コイン ' + fmt(r.coins) + '</span>'
        + '<span class="fr-net ' + (r.net > 0 ? 'is-plus' : (r.net < 0 ? 'is-minus' : 'is-zero')) + '">' + signed(r.net) + '</span>'
        + '</li>';
    }).join('');
    $('finalNote').textContent = state.maxHands + 'ハンド 遊んだよ ／ 最高記録 ' + fmt(state.best) + '枚';
  }

  /* ハッピーの ことば（★ふきだしも 結果の 箱も ここ 1か所から 読む）（T38 §9-3） */
  function happyMessage() {
    var me = state.players[0], r = state.result;
    var myRow = state.rows.filter(function (x) { return x.me; })[0];

    if (state.phase === 'setup') return '何ハンド 遊ぶ？';
    if (state.phase === 'final') {
      var list = finalRanks(), mine = list.filter(function (x) { return x.me; })[0];
      var tops = list.filter(function (x) { return x.rank === 1; }).length;
      if (mine.rank === 1 && tops > 1) return '同じ 1位！ すごい！';
      if (mine.rank === 1)             return '1位！ おめでとう！';
      if (mine.net > 0)                return 'コインが 増えたよ！ やったね';
      if (mine.net === 0)              return 'ぴったり 同じ コイン！';
      return 'つぎは 増やそう！';
    }
    if (state.phase === 'demo') return 'これは 見本だよ';
    if (state.phase === 'end') {
      /* ★T316：★ハッピーと 説明の 行は ★同じ「結果の 形」（handOutcome）から 選ぶ（★2つが ずれない）*/
      var oc = handOutcome();
      if (oc.kind === 'minusLast') return '最後の 結果を 見てみよう！';        // ★T316-D：最後の ハンドでは「まだ 続く」と 言わない
      if (oc.kind === 'minus')     return 'マイナスでも まだ 続くよ！';        // ★T314-2
      /* ★T314：前の「見せないで勝った！」は ★札を ぜんぶ 開く ように した ので うそに なる → 言いかえ */
      if (oc.kind === 'foldWin')   return 'みんな 降りた！ あなたの 勝ち！';
      if (oc.kind === 'split')     return '引き分け。コインを 分けたよ';
      if (oc.kind === 'win')       return 'やったー！ コイン ＋' + fmt(oc.net) + '枚！';   // ★T316-E：差し引き
      if (oc.kind === 'folded')    return 'みんなの 札を 見てみよう！';
      return 'つぎ がんばろ！';
    }
    if (me && me.folded) return 'つぎ いこう！';
    if (!r)              return 'どんなカード？';
    /* T54：「これ、みんな同じだよ」は 光る5枚を 指す セリフだったので 撤去
       （場だけの役の 判定 PC.uses は ロボットが 今も 使う） */
    if (r.rank >= 4)     return 'やった！ 強い手だ！';
    return '場のカードを 見てみよう';
  }

  /* ★★ T314-3（🎨アトの 申し送り T315）―― ★結果の 箱の 説明の 行（★ハッピーが 言って いない ことだけ）★★
     ★ 前は 説明の 行に ★endNote（実況に 流す 1行）を そのまま 出して いた ので、
       ★ハッピーの せりふと ★同じ 言葉が 2回 出る 場面が 3つ ありました：
       ★ ①みんな 降りて あなたの 勝ち … 「みんな 降りた！ あなたの 勝ち！」／「みんな降りた！ あなたの 勝ち ―― コイン ＋215」
       ★ ②引き分けで あなたも もらった … 「引き分け。コインを 分けたよ」／「引き分け！ コインを分けたよ」
       ★ ③勝負で あなたの 勝ち … 「やったー！ コイン 60枚！」／「ハイカード（役なし）で 勝った！ コイン 60」
     ★ → ★説明の 行は ★ハッピーが 言わない ことだけ：①コインの 数 ②役（★「どうし」）と あなたの ＋の 数 ③役。
     ★ ★ほかの 場面（★ロボットの 勝ち・★降りた・★マイナス）は ★もともと 重なって いない ので endNote の まま。
     ★ ⚠️ 実況（.table-log）に 流す endNote は ★変えて いない（★実況は 流れの 記録）。
     ★ ★どの 場面を 選ぶかは ★happyMessage と 同じ 順・同じ 条件（★2つが ずれると また 重なる ―― verify ⓜ が 数える）。 */
  /* ★★ T316 ―― ★この ハンドの「あなたの 結果の 形」（★ハッピー・説明の 行・見張りが ★ここ 1か所を 読む）★★
     ★ 勝ち負けは ★差し引き（net）で 決める ―― ★戻って きた だけ（net ≦ 0）は 勝ちでは ない（T316-C）。
     ★ kind：minusLast（最後の ハンドで マイナス）／minus／foldWin／split／win／folded／lose */
  function handOutcome() {
    var me = state.players[0];
    var myRow = state.rows.filter(function (x) { return x.me; })[0];
    var net = myRow ? myRow.net : 0;
    var kind = 'lose';
    if (me && me.coins < 0 && !(net > 0)) kind = (state.handNo >= state.maxHands) ? 'minusLast' : 'minus';
    else if (!state.settle && net > 0) kind = 'foldWin';
    else if (state.split && myRow && myRow.shared && !myRow.folded) kind = 'split';
    else if (net > 0) kind = 'win';
    else if (me && me.folded) kind = 'folded';
    return { kind: kind, net: net, row: myRow };
  }

  function resultLead() {
    var oc = handOutcome(), d;
    if (state.phase !== 'end') return state.endNote;
    if (oc.kind === 'foldWin') return 'コイン ＋' + fmt(oc.net);                                   // ①
    if (oc.kind === 'split' && oc.row && oc.row.hand) {                                           // ②
      d = PC.HAND_BY_ID[oc.row.hand.id];
      return d.name + '（' + d.short + '）どうし ―― あなたは ' + (oc.net > 0 ? '＋' : (oc.net < 0 ? '−' : '±')) + fmt(Math.abs(oc.net)) + '枚';
    }
    if (oc.kind === 'win' && oc.row && oc.row.hand) {                                             // ③
      d = PC.HAND_BY_ID[oc.row.hand.id];
      return d.name + '（' + d.short + '）で 勝った！';
    }
    return state.endNote;
  }

  function renderHappy() {
    $('happyBubble').textContent = happyMessage();
  }

  /* ★★ T314 ① はじめの 画面 ―― ★えらんだ 数に 印（aria-pressed）を つけ、★下の 小さい字に 入れる */
  function renderSetup() {
    var on = (state.phase === 'setup');
    document.body.classList.toggle('is-setup', on);
    $('setupPhase').classList.toggle('hidden', !on);
    $('btnQuitGame').classList.toggle('hidden', on);   // ★「↻ やめる」は 遊んで いる あいだ だけ
    if (!on) return;
    var bs = $('handsRow').querySelectorAll('.hands-btn');
    for (var i = 0; i < bs.length; i++) {
      bs[i].setAttribute('aria-pressed', (+bs[i].dataset.hands === state.maxHands) ? 'true' : 'false');
    }
    $('startSmall').textContent = 'あなた ＋ ロボット3人 ／ ' + state.maxHands + 'ハンド';
    $('setupBubble').textContent = happyMessage();
  }

  /* ★T314：何ハンドめ／何ハンド中（★コインの ふだの 右）*/
  function renderHandCount() {
    $('handCount').textContent = Math.min(state.handNo, state.maxHands) + ' / ' + state.maxHands + ' ハンド';
  }

  function log(text) {
    state.logs.push(text);
    if (state.logs.length > 40) state.logs.shift();
    var last = state.logs.slice(-3);
    $('tableLog').innerHTML = last.map(function (t, i) {
      return '<span class="log-line' + (i === last.length - 1 ? ' now' : '') + '">' + t + '</span>';
    }).join('');
  }

  /* ============================================================
     ★ かけの ボタン（降りる／かけない／合わせる／上げる／ぜんぶかける）
        ―― どのボタンも「いくら 動くか」が 見えるように している
     ============================================================ */
  var raiseOpen = false;
  var addValue = 0;   // T58：入力欄の 数字 ＝ コールの 上に 足す 枚数

  function renderActions() {
    var box = $('actButtons'), panel = $('raisePanel'), note = $('turnNote');
    var me = state.players[0];

    /* ハンドが おわった／見本を 出している ときは かけボタンを 消す */
    if (state.phase !== 'bet' || !me) {
      box.innerHTML = '';
      panel.classList.add('hidden');
      note.classList.add('hidden');
      /* ※「つぎの ハンドへ ▶」は T314 で 結果の 箱へ 引っこした（renderResult が 出し入れ） */
      return;
    }

    if (!state.awaitMe) {
      box.innerHTML = '';
      panel.classList.add('hidden');
      raiseOpen = false;
      var who = state.players[state.turn];
      note.textContent = me.folded
        ? '見ているところ ―― ' + (who ? who.name + 'の 番' : '')
        : (who ? who.name + 'が 考えているよ…' : '');
      note.classList.remove('hidden');
      return;
    }
    note.classList.add('hidden');

    /* T54（社長裁定）：カタカナ主表記 ＋ 下に 小さく 日本語（§9.6の 例外リスト） */
    var need = needOf(me);
    var html = '';

    html += btn('fold', 'フォールド', '降りる', 'is-fold');

    if (need === 0) {
      html += btn('check', 'チェック', 'パスする', '');
    } else if (need < me.room) {
      html += btn('call', 'コール ' + fmt(need), 'みんなと合わせる', 'is-call');
    }

    if (canRaise(me) && maxRaiseTo(me) >= myMinRaiseTo()) {
      html += btn('raise', 'レイズ ▾', 'かけ金を上げる', 'is-raise');
    }

    /* ★T314-2：オールイン ＝ ★この ハンドの 上限まで。★コインより 上限が 大きい（★200枚より 少ない）ときは「上限まで」と 言う */
    /* ★T316 3-4：字の 中身は そのまま。★「（195枚）」を ひとかたまりに して 折れない ように（.nb）*/
    html += btn('allin', 'オールイン', (me.room > me.coins ? '上限まで' : '全部かける') + '<span class="nb">（' + fmt(me.room) + '枚）</span>', 'is-allin');

    box.innerHTML = html;
    renderRaisePanel();
  }

  function btn(act, main, sub, cls) {
    return '<button type="button" class="act-btn ' + cls + '" data-act="' + act + '">'
      + '<b>' + main + '</b><small>' + sub + '</small></button>';
  }

  /* T58：入力欄の 数字は「コールの 上に いくら 足すか」。
     決定を おした ときだけ raiseTo（＝コール ＋ 上乗せ）に もどして doRaise に わたす。 */
  function addRange(me) {
    var hi = Math.max(1, maxRaiseTo(me) - state.toCall);   // 上限＝オールインと 同じ
    return { lo: Math.min(myMinAdd(), hi), hi: hi };
  }
  function clampAdd(me, v) {
    var r = addRange(me);
    v = Math.round(v);
    if (!isFinite(v) || !v) v = r.lo;
    return Math.min(Math.max(v, r.lo), r.hi);
  }
  function raiseNoteText(me, add) {
    var call = state.toCall, total = call + add;
    var line = call > 0
      ? 'コール ' + fmt(call) + ' ＋ 上乗せ ' + fmt(add) + ' ＝ ぜんぶで ' + fmt(total) + '枚'
      : 'ぜんぶで ' + fmt(total) + '枚 かける';
    if (me.bet > 0) line += ' ／ いま出すのは ' + fmt(total - me.bet) + '枚';
    return line;
  }

  function renderRaisePanel() {
    var panel = $('raisePanel'), me = state.players[0];
    if (!raiseOpen || !state.awaitMe || !canRaise(me)) {
      panel.classList.add('hidden');
      panel.innerHTML = '';
      return;
    }
    var r = addRange(me);
    addValue = clampAdd(me, addValue);
    panel.innerHTML =
        '<p class="raise-title">' + (state.toCall > 0 ? 'いくら 上乗せする？' : 'いくら かける？') + '</p>'
      + '<div class="raise-stepper">'
      +   '<button type="button" class="step-btn" data-step="-10">−10</button>'
      +   '<button type="button" class="step-btn" data-step="-1">−1</button>'
      +   '<input class="raise-input" id="raiseInput" type="number" inputmode="numeric" '
      +     'min="' + r.lo + '" max="' + r.hi + '" step="1" value="' + addValue + '">'
      +   '<button type="button" class="step-btn" data-step="1">＋1</button>'
      +   '<button type="button" class="step-btn" data-step="10">＋10</button>'
      + '</div>'
      + '<p class="raise-note">' + raiseNoteText(me, addValue) + '</p>'
      + '<button type="button" class="raise-ok" data-to="' + (state.toCall + addValue) + '">決定</button>';
    panel.classList.remove('hidden');
  }

  /* T54：持っている コインを ボタン群の すぐ上に（社長指示） */
  function renderActCoins() {
    var me = state.players[0];
    if (!me) return;
    $('actCoins').textContent = 'コイン ' + fmt(me.coins) + '枚';
    $('actCoins').classList.toggle('is-minus', me.coins < 0);   // ★T314-2：マイナスは ピンクの 字（★赤は こわい ので 使わない）
  }

  function render() {
    recalc();
    /* けんしょう（autoPlay）の あいだは 画面を 描かない。
       絵札を 何百回も 読みに いって おそくなる ため。 */
    if (state.fast) return;
    renderSetup();                  // ★T314：はじめの 画面の 出し入れ
    renderRanks();
    if (state.phase === 'setup') { renderResult(); return; }   // ★卓は かくれて いる（CSS の body.is-setup）
    renderSeats();
    renderMeInfo();
    renderPot();
    renderBoard();
    renderHand();
    renderSteps();
    renderResult();                 // ★T314：結果の 箱（もと renderShowdown／renderOver）
    renderHappy();
    renderActCoins();
    renderHandCount();
    renderActions();
  }

  /* ============================================================
     ボタンを 押したとき
     ============================================================ */
  $('actButtons').addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.act-btn') : null;
    if (!b || !state.awaitMe) return;
    var act = b.dataset.act;
    if (act === 'raise') {
      raiseOpen = !raiseOpen;
      if (raiseOpen) addValue = 0;   // T58：開いたら 上乗せの 最小に もどす
      renderRaisePanel();
      return;
    }
    raiseOpen = false;
    state.awaitMe = false;
    if (act === 'fold')      doFold(0);
    else if (act === 'check')doCheck(0);
    else if (act === 'call') doCall(0);
    else if (act === 'allin')doAllIn(0);
  });

  $('raisePanel').addEventListener('click', function (e) {
    var me = state.players[0];
    var step = e.target.closest ? e.target.closest('.step-btn') : null;
    if (step) {
      addValue = clampAdd(me, clampAdd(me, addValue) + (+step.dataset.step));
      renderRaisePanel();
      return;
    }
    var ok = e.target.closest ? e.target.closest('[data-to]') : null;
    if (!ok || !state.awaitMe) return;
    var to = +ok.dataset.to;
    if (ok.classList.contains('raise-ok')) {
      var input = $('raiseInput');
      /* T58：入力欄は「上乗せ」なので、コールを 足して 合計に もどす */
      if (input) to = state.toCall + clampAdd(me, +input.value);
    }
    raiseOpen = false;
    state.awaitMe = false;
    doRaise(0, to);
  });

  $('raisePanel').addEventListener('input', function (e) {
    if (e.target.id !== 'raiseInput') return;
    var me = state.players[0];
    addValue = clampAdd(me, +e.target.value);
    var ok = $('raisePanel').querySelector('.raise-ok');
    if (ok) ok.dataset.to = state.toCall + addValue;
    var note = $('raisePanel').querySelector('.raise-note');
    if (note) note.innerHTML = raiseNoteText(me, addValue);
  });

  /* ※ 設定パネル（modeRow／cpuRow／guideRow）の 聞き耳は T54 で 撤去した */

  /* ★T314：結果の 箱の 下の 3つは ★ぜんぶ goNext を 通る（★どれを 出すかは afterHandStep 1か所きり） */
  $('btnNextHand').addEventListener('click', goNext);
  $('btnFinal').addEventListener('click', goNext);
  $('btnAgain').addEventListener('click', function () { armGuard(); enterSetup(); });   // ★T316：はじめの 画面の ボタンに 2つめを 届かせない

  /* ★T314：はじめの 画面 ―― ★数を えらぶ（まだ 始めない）→ ★「ゲームを始める ▶」 */
  $('handsRow').addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.hands-btn') : null;
    if (!b) return;
    var n = +b.dataset.hands;
    if (HANDS_CHOICES.indexOf(n) < 0) return;
    state.maxHands = n;
    render();
  });
  $('btnStart').addEventListener('click', function () { armGuard(); startSession(state.maxHands); });   // ★T316：配った 直後の かけボタンに 届かせない

  /* ★ 役の強さの一覧の 開け閉め（どの 場面でも 押せる。ゲームは 止めない） */
  $('btnRanks').addEventListener('click', function () {
    ranksOpen = !ranksOpen;
    renderRanks();
  });

  /* ============================================================
     ★ 仕込み口（社長・アトが 見本を 出すための 口）― 第2段から そのまま
     ------------------------------------------------------------
       HOLDEM.setup('d7 c2', 's10 sJ sQ sK sA')   ← 手札, 場
       HOLDEM.demo('場だけの役')
       HOLDEM.play()      ← ゲームに もどる（新しい ハンド）
       HOLDEM.autoPlay(300)  ← ★ 自動で 300ハンド まわして コインの けいさんを たしかめる
     カードの 書き方は poker-core.js と おなじ：
       s＝スペード h＝ハート d＝ダイヤ c＝クローバー ／ A 2〜10 J Q K
     ============================================================ */
  var DEMOS = {
    '場だけの役':   { hole: 'd7 c2', board: 's10 sJ sQ sK sA',
                      why: '場の5枚だけで ロイヤル ＝ みんな 同じ役（引き分けに なる）' },
    'Aを1として':   { hole: 'sA h2', board: 'd3 c4 h5 sK d9',
                      why: 'A 2 3 4 5 の 一番弱い ストレート' },
    'ロイヤル':     { hole: 's10 sJ', board: 'sQ sK sA h2 d3',
                      why: '手札を つかった ロイヤル' },
    'フルハウス':   { hole: 'd7 d9', board: 's7 h7 cK dK c2',
                      why: '7が3枚とKが2枚。手札の9は つかわない' },
    'ツーペア':     { hole: 'sQ h4', board: 'dQ c4 s8 h10 d2',
                      why: 'Qが2枚と4が2枚。8・10・2の うち1枚だけ つかう' }
  };
  var DEMO_ALIAS = {
    boardOnly: '場だけの役', aceLow: 'Aを1として',
    royal: 'ロイヤル', fullHouse: 'フルハウス', twoPair: 'ツーペア'
  };

  /* 見本を 出す（かけは 止める。ゲームの コインには さわらない） */
  function dealFixed(holeSpec, boardSpec, robotSpecs) {
    clearTimers();
    var hole  = holeSpec  ? PC.cards(holeSpec)  : [];
    var board = boardSpec ? PC.cards(boardSpec) : [];
    var robots = (robotSpecs || []).map(function (s) { return PC.cards(s); });

    var used = [], dup = [];
    function take(list) {
      list.forEach(function (c) {
        if (used.indexOf(c.key) < 0) used.push(c.key);
        else if (dup.indexOf(c.key) < 0) dup.push(c.key);
      });
    }
    take(hole); take(board); robots.forEach(take);
    if (dup.length) console.warn('[HOLDEM] 同じ札を 2回 書いています：' + dup.join(' / ') + '（そのまま 進めます）');

    var deck = PC.shuffle(PC.createDeck().filter(function (c) { return used.indexOf(c.key) < 0; }));
    while (hole.length < 2) hole.push(deck.shift());
    for (var i = 1; i < SEATS; i++) {
      if (!robots[i - 1]) robots[i - 1] = [];
      while (robots[i - 1].length < 2) robots[i - 1].push(deck.shift());
    }
    var wanted = board.length;
    while (board.length < 5) board.push(deck.shift());

    state.phase = 'demo';
    state.awaitMe = false;
    state.hole = hole.slice(0, 2);
    state.board = board.slice(0, 5);
    state.robots = robots.map(function (r) { return r.slice(0, 2); });
    state.players[0].hole = state.hole;
    for (var j = 1; j < SEATS; j++) state.players[j].hole = state.robots[j - 1];
    state.step = stepForOpen(wanted);
    log('見本を 出しているよ（かけは 止まっています）。「ゲームに もどる」で 続きへ');
    render();
  }

  function stepForOpen(n) {
    for (var i = LAST_STEP; i >= 0; i--) if (n >= STEPS[i].open) return i;
    return 0;
  }

  function demo(name) {
    var key = DEMO_ALIAS[name] || name;
    var d = DEMOS[key];
    if (!d) { console.log('見本の 名前：', Object.keys(DEMOS).join(' / ')); return null; }
    dealFixed(d.hole, d.board);
    return key + '：' + d.why;
  }

  /* ============================================================
     ★ 決着を 仕込む（けんしょう用・T42）
     ------------------------------------------------------------
     めったに 起きない ばめん（引き分けの 端数／サイドポット／同じ役で 決まる）を
     その場で 作って、そのまま 勝負まで 進める。
       HOLDEM.stage('split')   引き分けの 山分け（端数つき）
       HOLDEM.stage('side')    サイドポット（コインが 足りない人が ぜんぶかけた）
       HOLDEM.stage('kicker')  同じ役どうしで 決まる（▲ が 出る）
     ============================================================ */
  var STAGES = {
    /* 場の5枚だけで ロイヤル ＝ 残った3人が 完全に 同じ強さ。
       ポット 32（10＋10＋10＋降りた人の2）→ 10ずつ ＋ あまり2枚 */
    split: {
      why: '場だけの役で 3人 引き分け。ポット32を 10ずつ ＋ あまり2枚',
      board: 's10 sJ sQ sK sA',
      seats: [
        { hole: 'd7 c2', put: 10, folded: false },
        { hole: 'h4 c9', put: 10, folded: false },
        { hole: 'd3 c6', put: 10, folded: false },
        { hole: 'h8 d4', put:  2, folded: true  }
      ]
    },
    /* 自分は 20しか 出せずに ぜんぶかけた。ロボットは 100ずつ。
       自分が いちばん強くても もらえるのは 20×4＝80 まで */
    side: {
      why: 'コインが 足りない自分が ぜんぶかけた。いちばん強くても 80まで',
      board: 'd7 c7 h2 s9 dK',
      seats: [
        { hole: 's7 h7', put:  20, folded: false, allIn: true, coins: 0 },  // フォーカード
        { hole: 'cA dA', put: 100, folded: false },                          // ツーペア
        { hole: 'sK hK', put: 100, folded: false },                          // フルハウス
        { hole: 'c3 d5', put: 100, folded: false }                           // ツーペア
      ]
    },
    /* 同じ フルハウスどうし。5枚めで 勝ち負けが つく → ▲ が 出る */
    kicker: {
      why: '同じ ツーペアどうし。のこり1枚で 決まる（▲ が 出る）',
      board: 'sQ dQ c4 h4 s8',
      seats: [
        { hole: 'hA d2', put: 30, folded: false },   // Q Q 4 4 A
        { hole: 'cK d3', put: 30, folded: false },   // Q Q 4 4 K
        { hole: 'h6 d9', put: 30, folded: false },   // Q Q 4 4 9
        { hole: 'c5 h3', put: 30, folded: true  }
      ]
    }
  };

  function stage(name) {
    var s = STAGES[name];
    if (!s) { console.log('仕込める ばめん：', Object.keys(STAGES).join(' / ')); return null; }
    clearTimers();

    state.phase = 'bet';
    state.handNo++;
    state.dealer = 0;                 // 端数は 親の 左どなり（＝ロボット1）から
    state.step = LAST_STEP;
    state.settle = null; state.rows = []; state.endNote = ''; state.newBest = false;
    state.board = PC.cards(s.board);

    state.pot = 0;
    state.players.forEach(function (p, i) {
      var spec = s.seats[i];
      p.hole = PC.cards(spec.hole);
      p.put = spec.put; p.bet = spec.put; p.gain = 0;
      p.folded = !!spec.folded;
      p.allIn = !!spec.allIn;
      p.acted = true; p.last = ''; p.raises = 0;
      if (spec.coins != null) p.coins = spec.coins;
      p.room = p.allIn ? 0 : capFor(p.coins); p.cap = p.put + p.room;   // ★T314-2
      p.handStart = p.coins + spec.put;                                  // ★T316-E
      state.pot += spec.put;
    });
    /* 仕込んだ ぶんは「世の中に 出した コイン」に 足しておく（けいさんの つじつま） */
    var sum = 0;
    state.players.forEach(function (p) { sum += p.coins; });
    state.injected = sum + state.pot;

    syncStage2();
    log('【仕込み】' + s.why);
    showdown();

    return {
      仕込み: s.why,
      ポット数: state.settle ? state.settle.pots.length : 0,
      分けた中身: state.settle ? state.settle.pots.map(function (p) {
        return p.amount + '枚 → ' + p.winners.map(function (i) { return state.players[i].name; }).join('・')
          + (p.odd.length ? '（あまり ' + p.odd.length + '枚：' + p.odd.map(function (i) { return state.players[i].name; }).join('・') + '）' : '');
      }) : [],
      もらった: state.players.map(function (p) { return p.name + ' ＋' + p.gain + '（コイン ' + p.coins + '）'; }),
      合っているか: state.errors.length ? 'エラーあり' : 'OK'
    };
  }

  /* ★ 自動で まわして コインの けいさんを たしかめる（けんしょう用）
       autoPlay(300)                           … かけ方3つを 順ぐりに
       autoPlay(300, {cpu:'strong', mode:'easy'}) … 組み合わせを 1つに 決めて */
  function autoPlay(n, opts) {
    n = n || 100;
    opts = opts || {};
    var wasFast = state.fast, wasMode = state.mode, wasCpu = state.cpu;
    state.fast = true;
    if (CPUS[opts.cpu]) state.cpu = opts.cpu;
    clearTimers();
    var before = state.errors.length;
    var stuck = 0, folds = 0, shows = 0, splits = 0, sides = 0, odds = 0, overs = 0;
    var modes = ['easy', 'normal', 'full'];

    for (var h = 0; h < n; h++) {
      state.mode = MODES[opts.mode] ? opts.mode : modes[h % 3];   // かけ方
      startHand();
      var guard = 0;
      while (state.phase === 'bet' && guard++ < 600) {
        if (state.awaitMe) randomMyAction(); else break;
      }
      if (state.phase === 'bet') { stuck++; break; }
      if (state.pot !== 0) state.errors.push(h + 'ハンドめ：ポットが 残った ' + state.pot);
      if (state.phase === 'over') overs++;

      if (state.settle) {
        shows++;
        if (state.settle.pots.length > 1) sides++;
        state.settle.pots.forEach(function (p) {
          if (p.winners.length > 1) splits++;
          if (p.odd.length) odds++;
        });
      } else {
        folds++;
      }
    }

    state.fast = wasFast;
    state.mode = wasMode;
    state.cpu = wasCpu;
    var total = 0;
    state.players.forEach(function (p) { total += p.coins; });
    var out = {
      まわしたハンド数: n,
      ロボットの強さ: CPUS[opts.cpu] ? CPUS[opts.cpu].label : '（順ぐり なし）',
      かけ方: MODES[opts.mode] ? MODES[opts.mode].label : '（3つ 順ぐり）',
      とちゅうで止まった: stuck,
      みんな降りて決着: folds,
      勝負まで行った: shows,
      サイドポットが出た: sides,
      引き分けが出た: splits,
      端数が出た: odds,
      自分がゲームオーバー: overs,
      コイン合計: total + state.pot,
      配ったコインの合計: state.injected,
      合っているか: (total + state.pot === state.injected) ? 'OK' : 'ちがう',
      あたらしいエラー: state.errors.slice(before)
    };
    console.log('[HOLDEM] autoPlay', out);
    render();
    return out;
  }

  /* 自分の 番を でたらめに 決める（autoPlay 用。ボタンと 同じ道を 通る） */
  function randomMyAction() {
    var me = state.players[0];
    var need = needOf(me), r = Math.random();
    state.awaitMe = false;
    if (need === 0) {
      if (r < 0.7 || !canRaise(me)) { doCheck(0); return; }
      doRaise(0, pickRaiseTo(me)); return;
    }
    if (r < 0.12) { doFold(0); return; }
    if (r < 0.22) { doAllIn(0); return; }
    if (need >= me.room) { doAllIn(0); return; }
    if (r < 0.85 || !canRaise(me)) { doCall(0); return; }
    doRaise(0, pickRaiseTo(me));
  }

  /* いまの かけ方（かんたん／ふつう／ぜんぶ）で 選べる 額から 1つ 選ぶ */
  function pickRaiseTo(me) {
    var lo = Math.min(minRaiseTo(), maxRaiseTo(me)), hi = maxRaiseTo(me);
    if (state.mode === 'easy') return lo;
    if (state.mode === 'normal') {
      var s = POT_STEPS[Math.floor(Math.random() * POT_STEPS.length)];
      return Math.min(Math.max(Math.round(state.pot * s.f), lo), hi);
    }
    return Math.min(lo + Math.floor(Math.random() * 30), hi);
  }

  /* ============================================================
     ★★ 強さを 数で たしかめる（T43 の 合格ライン）
     ------------------------------------------------------------
       HOLDEM.bench(3000)             3つの 強さで 3000ハンドずつ
       HOLDEM.bench(3000, 'strong')   1つだけ
       HOLDEM.matrix(200)             強さ3 × かけ方3 ＝ 9通りが こわれないか
     ------------------------------------------------------------
     ⚠️ 数える ときの 打ち手（自分の席）を どう 決めたか ―― ここが 大事。
        でたらめに 押す 打ち手だと、どんな ロボットにも 負けるので 何も 分かりません。
        そこで「ふつうの 大人」に 見立てた 決まった 打ち方（HUMAN）を つかいます。
        この 打ち手が 見ているのは、**画面が 出している ことだけ**：
          ・手札2枚の とき … §6-4 の 目安（ペア／大きい札／同じマーク／となり同士）
          ・場が 開いたら  … 今の役の名札が 10段の 何段めか
          ・ポットに 対して いくら 出すのか
        うそ（ブラフ）は しない。場の あぶなさも 読まない。相手の くせも おぼえない。
        ＝ **ふつうロボットから「場を読む力」だけ 引いたもの**。
        だから「ふつう」で もうけが ほぼ 0 に なるのが 正しい すがた。
        そこを 真ん中に して、「弱い」で 勝ち越し・「つよい」で 負けこすかを 見ます。
     ============================================================ */
  var HUMAN = {
    useDanger: false, dangerWeight: 0,
    foldLine: 0.30, oddsWeight: 0.45,
    raiseLine: 0.70, raiseChance: 0.45,
    allInLine: 0.72,
    betChance: function (s) { return s > 0.62 ? 0.50 : (s > 0.45 ? 0.15 : 0.04); },
    size: function (s) { return s > 0.85 ? 0.9 : 0.6; },
    jamLine: 0.95, slowLine: 1.1,
    bluff: function () { return 0; }
  };

  function humanAction() {
    state.awaitMe = false;
    applyAction(0, decideAction(state.players[0], HUMAN, 0));
  }

  function benchOne(n, level) {
    state.cpu = level;
    makePlayers();                       // 4人とも 200枚から やり直す
    state.injected = SEATS * START_COINS;
    state.dealer = -1; state.handNo = 0; state.pot = 0; state.best = START_COINS;
    var me = state.players[0];
    var errBefore = state.errors.length;
    var profit = 0, plus = 0, minus = 0, even = 0, tookPot = 0, shows = 0, minusHands = 0, stuck = 0;

    for (var h = 0; h < n; h++) {
      if (me.coins < 0) minusHands++;    // ★T314-2：マイナスの まま 始めた ハンド（★もらわない）
      startHand();
      var c0 = me.coins + me.put;        // このハンドの はじめの もちコイン
      var guard = 0;
      while (state.phase === 'bet' && guard++ < 800) {
        if (state.awaitMe) humanAction(); else break;
      }
      if (state.phase === 'bet') { stuck++; break; }
      var d = me.coins - c0;
      profit += d;
      if (d > 0) plus++; else if (d < 0) minus++; else even++;
      if (me.gain > 0) tookPot++;
      if (state.settle) shows++;
      if (state.phase === 'over') state.phase = 'end';   // 数える あいだは 止めない
    }

    var total = 0;
    state.players.forEach(function (p) { total += p.coins; });
    var per = profit / n;
    function pct(x) { return Math.round(x / n * 1000) / 10 + '%'; }
    return {
      ロボットの強さ: CPUS[level].label,
      ハンド数: n,
      もうけ合計: profit,
      '1ハンドあたり': Math.round(per * 100) / 100,
      '100ハンドあたり': Math.round(per * 100),
      '大がけ何個ぶん／100ハンド': Math.round(per * 100 / BIG_BET * 10) / 10,
      勝ち越したハンド: pct(plus),
      負けこしたハンド: pct(minus),
      '±0のハンド': pct(even),
      'ポットを とった': pct(tookPot) + '（4人なので 25%が ふつう）',
      勝負まで行った: pct(shows),
      'マイナスで 始めた ハンド': minusHands,
      とちゅうで止まった: stuck,
      コイン合計: total + state.pot,
      配ったコインの合計: state.injected,
      合っているか: (total + state.pot === state.injected && state.errors.length === errBefore) ? 'OK' : 'ちがう',
      あたらしいエラー: state.errors.slice(errBefore)
    };
  }

  /* ★ でたらめの「種」（けんしょう用・T44 で 足した）
     ------------------------------------------------------------
     ⚠️ なぜ 要るか：bench は 毎回 ちがう カードを 配るので、数が 大きく ぶれる。
        10,000ハンド でも「弱い」は ＋17〜＋23 の あいだで ゆれる（T44 で 5回 計った）。
        だから「直したら 数が 変わったか」を 数だけでは 決められない。
        種を きめると、**まったく 同じ 遊びが 何度でも おきる**ので、
        直す 前と 後を そのまま くらべられる。
          HOLDEM.seed(7); HOLDEM.bench(10000);   ← 直す前に 計っておく
          （直したあと 同じ2行で、数が 1つも 変わらなければ 影響なし）
          HOLDEM.seed(null);                     ← もとに もどす（毎回 ちがう）
     ゲームで 遊ぶ ときは つかわない（手で 打ったときだけ 効く）。 */
  var realRandom = Math.random;
  function seed(n) {
    if (n === null || n === undefined) { Math.random = realRandom; return '種なし（毎回 ちがう）'; }
    var x = (n >>> 0) || 1;
    Math.random = function () {          // xorshift32（かるくて 十分 ばらける）
      x ^= x << 13; x >>>= 0;
      x ^= x >>> 17;
      x ^= x << 5;  x >>>= 0;
      return x / 4294967296;
    };
    return '種 ' + n + '（同じ 遊びが 何度でも おきる）';
  }

  function bench(n, level) {
    n = n || 2000;
    var levels = CPUS[level] ? [level] : ['weak', 'normal', 'strong'];
    var wasFast = state.fast, wasCpu = state.cpu, wasMode = state.mode, wasBest = state.best;
    state.fast = true;
    state.mode = 'normal';
    clearTimers();
    var out = levels.map(function (lv) { return benchOne(n, lv); });
    state.fast = wasFast; state.cpu = wasCpu; state.mode = wasMode; state.best = wasBest;
    makePlayers();
    state.injected = SEATS * START_COINS;
    state.dealer = -1; state.handNo = 0;
    startHand();
    console.log('[HOLDEM] bench', out);
    return out;
  }

  /* 強さ3 × かけ方3 ＝ 9通り。こわれない ことだけを 見る（打ち手は でたらめ） */
  function matrix(n) {
    n = n || 200;
    var out = [];
    ['weak', 'normal', 'strong'].forEach(function (c) {
      ['easy', 'normal', 'full'].forEach(function (m) {
        var r = autoPlay(n, { cpu: c, mode: m });
        out.push({
          強さ: CPUS[c].label, かけ方: MODES[m].label,
          とちゅうで止まった: r.とちゅうで止まった,
          合っているか: r.合っているか,
          エラー数: r.あたらしいエラー.length
        });
      });
    });
    console.log('[HOLDEM] matrix', out);
    return out;
  }


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
       ★ ⑤**どの はばでも 出る**（★T284 で 変わりました）　⑥太らせた せいで 44px の 的を 割って いない
     ★ ★★この本の 決まり（★T284・2026-09-13 社長のお決め「1. 直す」）：
       ★ ★★**たての 線は ありません。★どの はばでも 出します。**
       ★ ★まえは「★この本だけ 560px 以下で 落とす」でした（★T273）が、★測ったら ★**その手当ては 要らなかった**
         ★★（★器 142.67px ＞ 中身 129px・★T282／T284 実測）。★★兄弟の ポーカーと 見た目が 割れる もとでした。
     ⚠️★★ ⑤は **せまい 画面（≦560px）で 走らせない と 鳴きません。**
       ★ ★アトは T279 で「★すべらない 画面で すべる 見張りを 試して 鳴らず」を やって います。
       ★ ★★同じ 穴です ―― ★**320px・390px の 画面でも かならず 走らせて ください。**
     ★ ★さわった もの（hidden）は 1つ 残らず 戻します（★T144 §7-5）。
     ★ ★名前の ぶつかり：`t281IconCheck` は この ファイルに 1つも ありません（★先に 数えました）。
     ============================================================ */
  /* ★★★ T284 ― ★CSS の 中の「しるしを 落とす 決まり」を **数える**★★★
     ------------------------------------------------------------
     ★ なぜ 要るか：★追記⑥ 決まり2／T264 ―― ★**たての 線は CSS と JS の 2か所に ある**。
       ★ ★セブンブリッジは CSS だけ 直して JS が 残り、★ふきだしが 札に **1680px²** かぶりました。
       ★ ★→ ★人の目で「そろっているか」を 見るのを やめ、★**JS が CSS を 読んで 数えます**。
     ★ ★見るもの：★`.quit-icon` を `display:none` に する 決まりが 1本でも あるか
       （★@media の 中も たどります）。★いまは **0本**が 正しい 姿です。
     ★ ★名前の ぶつかり：`t284KesuKimari` は この ファイルに 1つも ありません【★先に 数えました・T277 の しくじり】。 */
  function t284KesuKimari(doc) {
    var hits = [];
    function walk(list, media) {
      if (!list) return;
      for (var i = 0; i < list.length; i++) {
        var r = list[i];
        if (r.cssRules && r.media) { walk(r.cssRules, String(r.media.mediaText || '')); continue; }
        if (r.cssRules && !r.selectorText) { walk(r.cssRules, media); continue; }
        if (r.selectorText && r.style && r.selectorText.indexOf('quit-icon') >= 0
            && String(r.style.display).toLowerCase() === 'none') {
          hits.push((media ? '@media ' + media + ' ' : '') + r.selectorText);
        }
      }
    }
    var ss = doc.styleSheets;
    for (var s = 0; s < ss.length; s++) {
      try { walk(ss[s].cssRules, ''); } catch (e) { /* ★よその もとの 紙は 読めません（★この本には ありません）*/ }
    }
    return hits;
  }

  /* ★★★ T284 ― ★題が 切れて いないか・★**折れて いないか**を 数える★★★
     ★ なぜ 要るか：★追記⑩ ①【★実測】―― ★「あふれ0・画面外0」は「折れて いない」の 証しでは ない。
       ★ ★五目並べは 320px で となりの ボタンが **3行**に 折れ、★数字の 見張り 2本が そろって 見のがしました。
     ★ ★しるしを 戻すと ボタンが **＋20px** 太り、★その ぶん 題の 器が 縮みます。
       ★ ★★だから「足した せいで 題が 切れる／折れる」を ★この目で 見ます。 */
  function t284DaiCheck(doc) {
    var bad = [];
    var br = doc.querySelector('.brand');
    var sp = br ? br.querySelector('span') : null;
    if (!sp) return ['★★題（.brand span）が ありません'];
    var utsuwa = br.getBoundingClientRect().width;
    if (sp.scrollWidth > sp.clientWidth + 1) {
      bad.push('★★★題が 点々で 切れて います（★中身 ' + sp.scrollWidth + 'px ＞ 見え ' + sp.clientWidth + 'px・★器 '
        + utsuwa.toFixed(2) + 'px）');
    }
    /* ⚠️★★ 行の 数えかた ―― ★**部品の 四角を 数えては いけません**【★T284・アトの しくじり】
       ★ ★はじめ `sp.getClientRects().length` で 数えました。★★わざと 2行に 折っても ★**鳴きません** でした。
       ★ ★★わけ：★`.brand span` は 中身が 2行に なっても ★**部品の 四角は 1つの まま**（★背の 高い 1個に なるだけ）。
       ★ ★★★＝ ★**「見張っている ふり」**でした（★追記⑩ ②）。
       ★ ★→ ★**字そのもの（Range）の 四角**を 数えます。★★これは 1行に 1つ 出ます。 */
    var gyo = 1;
    try { var rg = doc.createRange(); rg.selectNodeContents(sp); gyo = rg.getClientRects().length || 1; } catch (e) {}
    if (gyo > 1) bad.push('★★★題が ' + gyo + '行に 折れて います（★1行の はず）');
    return bad;
  }

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
    /* ★★★ T284 ― ★この本の 決まりは ★**どの はばでも 出す**（★たての 線は 1本も ありません）★★★
       ★ ★まえは ここに `W >= 561` と 書いて あり、★CSS の @media(max-width:560px) と ★**2か所**に
         ★★同じ 線が ありました。★セブンブリッジは その 2か所が ずれて、★ふきだしが 札に 1680px² かぶりました。
       ★ ★→ ★線そのものを 消しました。★★下の `t284KesuKimari` が ★**CSS を 読んで 数え**、
         ★★★1本でも 残って いたら 鳴きます（★「2か所が そろっているか」を 人の目に 任せない）。 */
    var deru = true;
    var kesu = t284KesuKimari(doc);
    if (kesu.length) {
      bad.push('★★★CSS に しるしを 落とす 決まりが ' + kesu.length + '本 残って います：' + kesu.join(' ／ ')
        + ' ―― ★JS 側は「どの はばでも 出す」です。★★2か所が ずれて います（★T284）');
    }
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

  /* ★★★ T281 ― この本 はじめての 見張り（★正直に：★ホールデムには 見張りが 1つも ありません でした）★★★
     ★ ★いまは「↻ の しるし」1つ ぶんだけ です。★使い方：`HOLDEM.verify()` */

  /* ============================================================
     ★T293 ― 見えない 押し代（44px）の 見張り
     ------------------------------------------------------------
     ★ お手本：T291 の `oshishiro()`（フリーセルほか 8本）。
     ★ ★ちがう ところ：★T293 の `#btnStart` の 押し代は **まん中ぞろえでは ありません**
       ★（★上へ 12px だけ のばす）。★★だから 「`top:50%` か どうか」は 数えません。
       ★★数えるのは いつも 「**本物の 指で 44px 届くか**」です。
     ★ ★★`<select>` は ここに 1つも 入って いません ―― ★`::after` が 効かないからです【T293 実測】。
     ============================================================ */
  function t293oshishiro() {
    /* ★ [えらび方, 見た目の たて(px)【★T293 実測】, となり（取っては いけない）] */
    var LIST = [['.ranks-toggle', 42, ['.act-btn']]];
    var bad = [], mita = 0, i, j;
    var vw = window.innerWidth, vh = window.innerHeight;

    function atta(el, x, y) { var e = document.elementFromPoint(x, y); return !!e && (e === el || el.contains(e)); }
    function deteru(el) { return !!(el && el.getClientRects().length); }
    function kiru(el) {
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

    for (i = 0; i < LIST.length; i++) {
      var sel = LIST[i][0], mitame = LIST[i][1], tonari = LIST[i][2];
      var el = document.querySelector(sel);
      if (!el) { bad.push('★T293：' + sel + ' が 居ない'); continue; }
      if (!deteru(el)) continue;                        /* ★ 出て いない ときは 数えない */
      var r = el.getBoundingClientRect();
      var cs2 = getComputedStyle(el), af = getComputedStyle(el, '::after');
      if (af.content === 'none') bad.push('★T293：押し代が 消えた（' + sel + '）');
      if (parseFloat(af.height) < 44) bad.push('★T293：押し代が ' + af.height + ' しか ない（' + sel + '）');
      if (cs2.position === 'static') bad.push('★T293：位置づけ（position）が 外れた（' + sel + '）');
      if (r.height > mitame + 0.6) bad.push('★T293：見た目が ' + r.height.toFixed(1) + 'px に 太った（' + sel + '・T293 では ' + mitame + 'px）');

      var k = kiru(el);
      var mieru = (r.top >= 0 && r.bottom <= vh && (!k || (r.top >= k.t - 0.5 && r.bottom <= k.b + 0.5)));
      if (!mieru) continue;                             /* ★ 切れて いる ―― ｅ は 数えない */
      var cx = Math.round((r.left + r.right) / 2), cy = Math.round((r.top + r.bottom) / 2);
      if (cx < 0 || cx >= vw || cy < 0 || cy >= vh || !atta(el, cx, cy)) continue;
      var T = cy, B = cy;
      for (j = 1; j <= 60; j++) { if (cy - j >= 0 && atta(el, cx, cy - j)) T = cy - j; else break; }
      for (j = 1; j <= 60; j++) { if (cy + j < vh && atta(el, cx, cy + j)) B = cy + j; else break; }
      mita++;
      if (B - T + 1 < 44) bad.push('★T293：指の的が たて ' + (B - T + 1) + 'px しか ない（' + sel + '）');

      for (j = 0; j < tonari.length; j++) {
        var o = document.querySelector(tonari[j]);
        if (!o || !deteru(o)) continue;
        var q = o.getBoundingClientRect();
        var ox = Math.round((q.left + q.right) / 2);
        var ys = [Math.round(q.top) + 1, Math.round(q.bottom) - 2];
        for (var m = 0; m < ys.length; m++) {
          if (ys[m] < 0 || ys[m] >= vh || ox < 0 || ox >= vw) continue;
          if (!atta(o, ox, ys[m])) bad.push('★T293：となりの ' + tonari[j] + ' の 見た目を 取った（y=' + ys[m] + '）');
        }
      }
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

  /* ============================================================
     ★★★ T314 ―― ★はじめの 画面・★ハンド数で 終わる・★結果の 箱・★降りた あとの 札 の 見張り（💻コーダ）★★★
     ------------------------------------------------------------
     ★ T288 ②：★**見つけた あと 鳴らす まで 作って はじめて 見張り** ―― ★ここの NG は verify() の ★NG に 足す。
     ★ 見る 目（★いま 出て いる 場面で 見る。★場面を 作る ために 遊びを 動かさない ―― T295 の 教え）：
       ⓐ「↻」の 字が「やめる」か（★「さいしょから」に 戻って いたら 鳴く）
       ⓑ はじめの 画面：★3・5・7・10・15 の 5つ／★印（aria-pressed）が 1つだけで いまの 数と 同じ／
          ★どの ボタンも 44×44 以上／★卓が かくれて いる／★「↻ やめる」が かくれて いる
       ⓒ ハンド数：★何ハンドめ が 決めた 数を こえて いない／★最後の 結果は ちょうど 決めた 数で 出る／
          ★決め手の 関数（afterHandStep）の 表を 6通り 引き当てる
       ⓓ 結果の 箱：★出る はずの ときに 出て いる／★箱が 画面に くっついて いる（position:fixed）／
          ★下の 段の ボタンが ★afterHandStep の 言う 1つだけ／★その ボタンが ★画面の 中・まん中が 押せる・44px
          ★（★= スクロール 無しで 押せる）／★上の帯の「◀」「↻ やめる」も 押せる まま
       ⓔ 降りた あとも ぜんぶ 見せる：★場の 札 5枚／★4人 ぜんぶの 行に ★札が 2枚 ずつ 見えて いる／
          ★どの 行にも 役の 名前／★卓の ロボットの 席にも 札が 2枚 ずつ 開いて いる／★「見せない」の 字が 1つも ない
       ⓕ 最後の 結果：★4人の 順位／★「もう一度遊ぶ」「◀ ゲームを選ぶ」が 画面の 中で 押せる
     ★ ★名前の ぶつかり：`t314Check` `t314Oseru` は この ファイルに 1つも ありません【★先に 数えました】。
     ============================================================ */
  function t314Oseru(el, name, bad, win, doc) {
    if (!el || !el.getClientRects().length) { bad.push('★T314：「' + name + '」が 出て いません'); return; }
    var r = el.getBoundingClientRect();
    if (r.top < -0.5 || r.left < -0.5 || r.bottom > win.innerHeight + 0.5 || r.right > win.innerWidth + 0.5) {
      bad.push('★T314：「' + name + '」が 画面の 外に 出て います（上 ' + r.top.toFixed(1) + '／下 ' + r.bottom.toFixed(1)
        + '／画面の たて ' + win.innerHeight + '）―― ★スクロールしないと 押せません');
      return;
    }
    var cx = Math.round(r.left + r.width / 2), cy = Math.round(r.top + r.height / 2);
    function atta(x, y) { var e = doc.elementFromPoint(x, y); return !!e && (e === el || el.contains(e)); }
    if (!atta(cx, cy)) {
      var t = doc.elementFromPoint(cx, cy);
      bad.push('★T314：「' + name + '」の まん中が 押せません（★上に ' + (t ? (t.id || t.className || t.tagName) : 'なし') + '）');
      return;
    }
    /* ★ 44px は ★本物の 指の 的で 数える（★見えない 押し代 ::after も 入れる ―― T293 と 同じ 数え方）。
       ★ ★見た目の 箱（getBoundingClientRect）で 数えると ★「◀」の 38px＋押し代 を 割れと 数える うそ鳴きに なる【★T314 実測】。 */
    var T0 = cy, B0 = cy, L0 = cx, R0 = cx, j;
    for (j = 1; j <= 60; j++) { if (cy - j >= 0 && atta(cx, cy - j)) T0 = cy - j; else break; }
    for (j = 1; j <= 60; j++) { if (cy + j < win.innerHeight && atta(cx, cy + j)) B0 = cy + j; else break; }
    for (j = 1; j <= 200; j++) { if (cx - j >= 0 && atta(cx - j, cy)) L0 = cx - j; else break; }
    for (j = 1; j <= 200; j++) { if (cx + j < win.innerWidth && atta(cx + j, cy)) R0 = cx + j; else break; }
    var th = B0 - T0 + 1, tw = R0 - L0 + 1;
    if (th < 44 || tw < 44) bad.push('★T314：「' + name + '」の 指の 的が ' + tw.toFixed(0) + '×' + th.toFixed(0) + 'px（★44×44 の 床）');
    /* ★ 字が ボタンから はみ出して いないか（★はみ出した 字も 指は 取るので ★上の 的の 数えでは 鳴らない ―― T314 で わざと 壊して 分かった）
       ★ ⚠️ scrollHeight では 数えない ―― ★見えない 押し代（::after 44px）まで「はみ出し」に 数えて ★「◀」で うそ鳴き しました【★T314 実測】。
       ★ ★字そのもの（Range）の 四角が ★ボタンの 四角の 中に あるかで 数える。 */
    try {
      var rg = doc.createRange(); rg.selectNodeContents(el);
      var tr = rg.getBoundingClientRect();
      if (tr.width > 0 && (tr.top < r.top - 1 || tr.bottom > r.bottom + 1 || tr.left < r.left - 1 || tr.right > r.right + 1)) {
        bad.push('★T314：「' + name + '」の 字が ボタンから はみ出して います（★字 上' + tr.top.toFixed(1) + '〜下' + tr.bottom.toFixed(1)
          + ' ／ ボタン 上' + r.top.toFixed(1) + '〜下' + r.bottom.toFixed(1) + '）');
      }
    } catch (e) {}
  }

  function t314Check(doc, win) {
    var bad = [];
    var ph = state.phase;
    function mieru(el) {
      if (!el || !el.getClientRects().length) return false;
      var cs = win.getComputedStyle(el);
      return cs.visibility !== 'hidden' && cs.display !== 'none';
    }

    /* ⓐ 字 */
    var q = doc.getElementById('btnQuitGame');
    var qt = q ? String(q.textContent).replace(/\s/g, '') : '';
    if (qt !== 'やめる') bad.push('★T314：「↻」の 字が「' + qt + '」です（★はじめの 画面が できた ので「やめる」の はず・追記⑩ ⑤）');

    /* ⓑ はじめの 画面 */
    var setup = doc.getElementById('setupPhase');
    if (ph === 'setup') {
      if (!mieru(setup)) bad.push('★T314：はじめの 画面が 出て いません');
      if (mieru(q)) bad.push('★T314：はじめの 画面なのに「↻ やめる」が 出て います（★戻る先に いる）');
      var hb = setup ? setup.querySelectorAll('.hands-btn') : [];
      var nums = Array.prototype.map.call(hb, function (b) { return +b.dataset.hands; }).join(',');
      if (nums !== HANDS_CHOICES.join(',')) bad.push('★T314：えらべる 数が「' + nums + '」です（★' + HANDS_CHOICES.join('・') + ' の はず）');
      var on = Array.prototype.filter.call(hb, function (b) { return b.getAttribute('aria-pressed') === 'true'; });
      if (on.length !== 1) bad.push('★T314：印の ついた 数が ' + on.length + 'つ です（★1つだけ）');
      else if (+on[0].dataset.hands !== state.maxHands) bad.push('★T314：印は ' + on[0].dataset.hands + ' なのに 中身は ' + state.maxHands + ' です');
      Array.prototype.forEach.call(hb, function (b) {
        var r = b.getBoundingClientRect();
        if (r.width < 43.99 || r.height < 43.99) bad.push('★T314：「' + b.dataset.hands + 'ハンド」が ' + r.width.toFixed(1) + '×' + r.height.toFixed(1) + 'px（★44×44）');
      });
      var sb = doc.getElementById('btnStart');
      if (!mieru(sb)) bad.push('★T314：「ゲームを始める」が 出て いません');
      else { var sr = sb.getBoundingClientRect(); if (sr.height < 43.99) bad.push('★T314：「ゲームを始める」の たてが ' + sr.height.toFixed(1) + 'px'); }
      ['.seats', '.board-wrap', '.mine', '.act'].forEach(function (sel) {
        if (mieru(doc.querySelector(sel))) bad.push('★T314：はじめの 画面なのに ' + sel + ' が 出て います');
      });
    } else {
      if (mieru(setup)) bad.push('★T314：遊んで いる のに はじめの 画面が 出て います');
      if (!mieru(q)) bad.push('★T314：遊んで いる のに「↻ やめる」が 出て いません');
    }

    /* ⓒ ハンド数 */
    if (HANDS_CHOICES.indexOf(state.maxHands) < 0) bad.push('★T314：決めた ハンド数が ' + state.maxHands + ' です（★えらべない 数）');
    if (state.handNo > state.maxHands) bad.push('★T314：' + state.handNo + 'ハンドめ ―― 決めた ' + state.maxHands + 'ハンドを こえて います');
    if (ph === 'final' && state.handNo !== state.maxHands) bad.push('★T314：最後の 結果が ' + state.handNo + 'ハンドめで 出て います（★' + state.maxHands + 'ハンドめの はず）');
    var HYOU = [[1, 5, 'end', 'next'], [4, 5, 'end', 'next'], [5, 5, 'end', 'final'],
                [2, 3, 'end', 'next'], [3, 3, 'end', 'final'], [15, 15, 'end', 'final']];
    HYOU.forEach(function (t) {
      var got = afterHandStep(t[0], t[1], t[2]);
      if (got !== t[3]) bad.push('★T314：afterHandStep(' + t[0] + ',' + t[1] + ',' + t[2] + ') が ' + got + '（★' + t[3] + ' の はず）');
    });

    /* ⓓ 結果の 箱 */
    var layer = doc.getElementById('resultLayer'), box = doc.getElementById('showdownBox'), fin = doc.getElementById('finalBox');
    var boxOn = mieru(box), finOn = mieru(fin);
    if ((ph === 'end' || ph === 'over') && state.showResult && !boxOn) bad.push('★T314：ハンドが 終わったのに 結果の 箱が 出て いません');
    if (ph === 'final' && !finOn) bad.push('★T314：最後の 結果が 出て いません');
    if ((ph === 'bet' || ph === 'setup') && (boxOn || finOn)) bad.push('★T314：' + ph + ' の とき なのに 結果の 箱が 出て います');
    if (boxOn || finOn) {
      /* ★ 箱の 中が よこに はみ出して いないか（★T314：最後の 順位の「＋35枚」が 568×272 で 右へ 切れて いた ―― ★写真で 見つけた）*/
      Array.prototype.forEach.call(doc.querySelectorAll('#resultLayer .rs-scroll'), function (sc) {
        if (!sc.getClientRects().length) return;
        if (sc.scrollWidth > sc.clientWidth + 1) bad.push('★T314：結果の 箱の 中身が よこに ' + (sc.scrollWidth - sc.clientWidth) + 'px はみ出して います（★右が 切れます）');
      });
      if (win.getComputedStyle(layer).position !== 'fixed') bad.push('★T314：結果の 箱が 画面に くっついて いません（position:' + win.getComputedStyle(layer).position + '）―― ★スクロールの 場所で 見えたり 見えなかったり します');
      t314Oseru(doc.querySelector('.topbar .back'), '◀ ゲームを選ぶ', bad, win, doc);
      t314Oseru(q, '↻ やめる', bad, win, doc);
    }
    if (boxOn) {
      var want = afterHandStep(state.handNo, state.maxHands, ph);
      var IDS = { next: ['btnNextHand', 'つぎの ハンドへ'], final: ['btnFinal', '最後の 結果を 見る'] };
      Object.keys(IDS).forEach(function (k) {
        var b = doc.getElementById(IDS[k][0]);
        if (k === want) t314Oseru(b, IDS[k][1], bad, win, doc);
        else if (mieru(b)) bad.push('★T314：「' + IDS[k][1] + '」が 出て います（★いまは「' + IDS[want][1] + '」だけの はず）');
      });

      /* ⓔ ぜんぶ 見せる */
      /* ⓜ ★T314-3：ハッピーの せりふと 説明の 行で ★同じ 言葉を 2回 言って いないか（★空白・記号を のぞいて 5字 以上 同じ 並び）*/
      var sayT = String(doc.getElementById('sdTitle').textContent).replace(/[\s！!。、，,・―－\-（）()＋+]/g, '');
      var leadT = String(doc.getElementById('sdLead').textContent).replace(/[\s！!。、，,・―－\-（）()＋+]/g, '');
      for (var ci = 0; ci + 5 <= sayT.length; ci++) {
        if (leadT.indexOf(sayT.substr(ci, 5)) >= 0) { bad.push('★T314-3：ハッピーの せりふと 説明の 行で 同じ 言葉が 2回（「' + sayT.substr(ci, 5) + '」）'); break; }
      }
      var bc = doc.querySelectorAll('#sdBoard .card');
      if (bc.length !== 5) bad.push('★T314：結果の 箱の 場の 札が ' + bc.length + '枚です（★5枚）');
      var rows = doc.querySelectorAll('#sdRows .rs-row');
      if (rows.length !== state.players.length) bad.push('★T314：結果の 箱の 行が ' + rows.length + 'つです（★' + state.players.length + '人 ぜんぶ）');
      Array.prototype.forEach.call(rows, function (row, i) {
        var who = row.querySelector('.rs-who');
        var nm = who ? who.textContent.replace(/\s/g, '') : ('行' + (i + 1));
        var cs = row.querySelectorAll('.rs-cards .card');
        var seen = Array.prototype.filter.call(cs, function (c) { var r = c.getBoundingClientRect(); return mieru(c) && r.width >= 10 && r.height >= 15; });
        if (seen.length !== 2) bad.push('★T314：' + nm + ' の 札が ' + seen.length + '枚しか 見えて いません（★2枚）');
        var hn = row.querySelector('.rs-hand b');
        if (!hn || !hn.textContent.trim() || !mieru(hn)) bad.push('★T314：' + nm + ' に 役の 名前が ありません');
      });
      var seats = doc.querySelectorAll('#seats .seat');
      Array.prototype.forEach.call(seats, function (s, i) {
        var n = s.querySelectorAll('.card').length, back = s.querySelectorAll('.seat-back').length;
        if (n !== 2 || back) bad.push('★T314：卓の ロボット' + (i + 1) + ' の 席で 開いた 札が ' + n + '枚・伏せ札が ' + back + '枚です（★ハンドが 終わったら 2枚 開く）');
      });
    }
    if (boxOn || finOn || ph === 'end' || ph === 'over') {
      var txt = (layer ? layer.textContent : '') + doc.getElementById('tableLog').textContent + doc.getElementById('happyBubble').textContent;
      if (/見せない/.test(txt)) bad.push('★T314：「見せない」の 字が 残って います（★社長のご指示③で なくした）');
    }

    /* ⓕ 最後の 結果 */
    if (finOn) {
      var fr = doc.querySelectorAll('#finalRank .fr-row');
      if (fr.length !== state.players.length) bad.push('★T314：最後の 順位が ' + fr.length + '人ぶん です（★' + state.players.length + '人）');
      if (!doc.querySelector('#finalRank .fr-row.is-me')) bad.push('★T314：最後の 順位に「あなた」の 行の 印が ありません');
      t314Oseru(doc.getElementById('btnAgain'), 'もう一度遊ぶ', bad, win, doc);
      t314Oseru(doc.getElementById('btnResultHome'), '◀ ゲームを選ぶ（最後の 結果）', bad, win, doc);
    }
    return bad.concat(t314MinusCheck(doc, win)).concat(t316Check(doc, win));
  }

  /* ============================================================
     ★★★ T316 ―― ★2連打・★勝ち負けと せりふ・★差し引きの 数 の 見張り（💻コーダ）★★★
     ------------------------------------------------------------
     ⓢ 2連打の 止め：★その場で 小さな ボタンを 作り、★止めて いる 間は 押しても 届かない／★止めが 切れたら 届く
        ★（★本物の ボタンは 押さない ―― T295 の 教え。★作った ものは かならず 消し、止めの 時刻も もとに 戻す）
     ⓣ 差し引きの 数：★結果の 箱の 4人の 行の 数 ＝ ★その 人の コインの 動き（いまの コイン − ハンドの はじめ）
        ★金色（勝ち）は ★増えた 人 だけ
     ⓤ 勝ち負けと せりふ：★あなたが 増えて いない のに「やったー／あなたの 勝ち／で 勝った！」を 言わない／
        ★増えたのに「がんばろ／マイナスでも」を 言わない／★ハッピーの「＋N」と 説明の 行の「＋N」は あなたの 差し引き
     ⓥ 最後の ハンドで「まだ 続く」と 言わない
     ★ 名前の ぶつかり：`t316Check` は この ファイルに 1つも ありません【★先に 数えました】。
     ============================================================ */
  function t316Check(doc, win) {
    var bad = [];
    function signed(n) { return (n > 0 ? '＋' : (n < 0 ? '−' : '±')) + fmt(Math.abs(n)); }

    /* ⓢ */
    var keep = guardUntil, b = doc.createElement('button'), hit = 0;
    b.type = 'button'; b.style.cssText = 'position:fixed;left:-500px;top:0;width:10px;height:10px';
    b.addEventListener('click', function () { hit++; });
    doc.body.appendChild(b);
    try {
      guardUntil = nowMs() + 60000; b.click();
      if (hit !== 0) bad.push('★T316：2連打の 止めが 効いて いません（★止めて いる 間に 押せた）');
      guardUntil = 0; b.click();
      if (hit !== 1) bad.push('★T316：2連打の 止めが 切れません（★止めて いない のに 押せない）');
    } finally { guardUntil = keep; b.remove(); }
    if (!(GUARD_MS >= 900)) bad.push('★T316：2連打の 止めが ' + GUARD_MS + 'ms（★トライは 800ms あけて 当たった）');

    /* ⓦ ★T316-2：止めて いる 間は うすい／★切れたら 戻る
       ★ ①いまの 形：止めの 有無 ＝ is-guard の 有無
       ★ ②その場で 止めを かけて（★見える ボタンが うすく なるか）→ ★外して（★戻るか）→ ★もとの 止めに 戻す */
    var hasG = doc.body.classList.contains('is-guard');
    /* ★切れた 直後の 1こま（★次の requestAnimationFrame まで）は 待つ ―― ★100ms を こえて 残って いたら 鳴く */
    if ((guardOn() && !hasG) || (!guardOn() && hasG && nowMs() - guardUntil > 100)) bad.push('★T316-2：止めて ' + (guardOn() ? 'いる のに うすく なって いません（is-guard 無し）' : 'いない のに うすい まま です（is-guard 有り）'));
    var gs = Array.prototype.filter.call(doc.querySelectorAll(GUARD_SEL), function (e) {
      var c = win.getComputedStyle(e); return e.getClientRects().length && c.display !== 'none' && c.visibility !== 'hidden';
    });
    function kasuka(e) { var c = win.getComputedStyle(e); return parseFloat(c.opacity) < 0.6 && /grayscale/.test(c.filter); }
    var keepG = guardUntil;
    try {
      guardUntil = nowMs() + 60000; doc.body.classList.add('is-guard');
      gs.forEach(function (e) { if (!kasuka(e)) bad.push('★T316-2：止めて いる 間に「' + String(e.textContent).replace(/\s+/g, ' ').trim().slice(0, 12) + '」が うすく なりません'); });
      guardUntil = 0; doc.body.classList.remove('is-guard');
      gs.forEach(function (e) { if (kasuka(e) || parseFloat(win.getComputedStyle(e).opacity) < 0.99) bad.push('★T316-2：止めが 切れても「' + String(e.textContent).replace(/\s+/g, ' ').trim().slice(0, 12) + '」が うすい まま です'); });
    } finally { guardUntil = keepG; doc.body.classList.toggle('is-guard', guardOn()); }

    var box = doc.getElementById('showdownBox');
    var boxOn = !!(box && box.getClientRects().length && state.showResult && state.phase === 'end');
    if (!boxOn) return bad;

    /* ⓣ */
    Array.prototype.forEach.call(doc.querySelectorAll('#sdRows .rs-row'), function (el) {
      var p = state.players[+el.getAttribute('data-seat')];
      if (!p || p.handStart == null) { bad.push('★T316：結果の 行に 席の しるしが ありません'); return; }
      var net = p.coins - p.handStart;
      var g = el.querySelector('.rs-gain');
      if (!g || g.textContent !== signed(net)) bad.push('★T316：' + p.name + ' の 数「' + (g ? g.textContent : '') + '」（★コインの 動きは ' + signed(net) + '）');
      if ((net > 0) !== el.classList.contains('is-win')) bad.push('★T316：' + p.name + ' の 金色が ' + (net > 0 ? '無い（増えたのに）' : 'ある（増えて いない のに）'));
    });

    /* ⓤ ⓥ */
    var me = state.players[0];
    var myNet = me.coins - me.handStart;
    var say = doc.getElementById('sdTitle').textContent, lead = doc.getElementById('sdLead').textContent;
    if (myNet <= 0) {
      if (/やったー|あなたの 勝ち/.test(say)) bad.push('★T316：あなたは ' + signed(myNet) + ' なのに ハッピーが「' + say + '」');
      if (/^コイン ＋|で 勝った！$/.test(lead.trim())) bad.push('★T316：あなたは ' + signed(myNet) + ' なのに 説明の 行が「' + lead + '」');
    } else {
      if (/がんばろ|マイナスでも/.test(say)) bad.push('★T316：あなたは ' + signed(myNet) + ' なのに ハッピーが「' + say + '」');
    }
    [say, lead].forEach(function (t) {
      var m = /コイン ＋([\d,]+)/.exec(t);
      if (m && m[1] !== fmt(myNet)) bad.push('★T316：「' + t + '」の ＋' + m[1] + ' が あなたの 差し引き ' + signed(myNet) + ' と ちがいます');
    });
    if (state.handNo >= state.maxHands && /まだ 続く/.test(say)) bad.push('★T316：最後の ハンドなのに「' + say + '」');
    return bad;
  }

  /* ============================================================
     ★★★ T314-2 ―― ★マイナスの まま 続く の 見張り（💻コーダ）★★★
     ------------------------------------------------------------
     ⓖ ゲームオーバーが 出ない（★'over' の 場面も「もらって もういちど」の ボタンも 無い）
     ⓗ 上限の 決まり：★遊んで いる 間 ★上限 ＝ max(ハンドの はじめの コイン, 200)／★出した ＋ のこり ＝ 上限／★のこり ≧ 0
     ⓘ ボタン：★コール は「足りる」ときだけ／★オールインの 数 ＝ のこりの 上限
     ⓙ コインの 字：★マイナスは「−」で 始まり ★ピンクの しるし（is-minus）／★プラスには しるし 無し／★「借金」の 字が 無い
     ⓚ 字が はみ出さない：★席の コイン・自分の コイン（2か所）・最後の 結果の 大きい 数
     ⓛ 最後の 順位：★増えた・減った ＝ いまの コイン − 200（★もらった ぶんを 引く 決まりは もう 無い）
     ★ 名前の ぶつかり：`t314MinusCheck` は この ファイルに 1つも ありません【★先に 数えました】。
     ============================================================ */
  function t314MinusCheck(doc, win) {
    var bad = [], ph = state.phase;
    function mieru(el) { if (!el || !el.getClientRects().length) return false; var c = win.getComputedStyle(el); return c.display !== 'none' && c.visibility !== 'hidden'; }
    function hamidasu(el, box, name) {
      if (!mieru(el) || !box) return;
      var rg = doc.createRange(); rg.selectNodeContents(el);
      var t = rg.getBoundingClientRect(), b = box.getBoundingClientRect();
      if (t.width > 0 && (t.left < b.left - 0.5 || t.right > b.right + 0.5)) bad.push('★T314-2：' + name + '「' + el.textContent + '」が はみ出して います（★字 ' + t.left.toFixed(1) + '〜' + t.right.toFixed(1) + ' ／ 器 ' + b.left.toFixed(1) + '〜' + b.right.toFixed(1) + '）');
    }
    function coinText(el, n, name) {
      if (!mieru(el)) return;
      var want = fmt(n);
      if (el.textContent.indexOf(want) < 0) bad.push('★T314-2：' + name + ' の 字が「' + el.textContent + '」（★' + want + ' の はず）');
      if ((n < 0) !== el.classList.contains('is-minus')) bad.push('★T314-2：' + name + ' の ピンクの しるしが ' + (n < 0 ? '無い（マイナスなのに）' : 'ある（マイナスで ないのに）'));
    }

    /* ⓖ */
    if (ph === 'over') bad.push('★T314-2：ゲームオーバーの 場面に なって います（★マイナスの まま 続く はず）');
    ['btnRestart', 'overBox'].forEach(function (id) { if (mieru(doc.getElementById(id))) bad.push('★T314-2：' + id + ' が 出て います（★なくした はず）'); });

    /* ⓗ */
    state.players.forEach(function (p) {
      if (p.room < 0) bad.push('★T314-2：' + p.name + ' の のこりの 上限が ' + p.room);
      if (ph === 'bet' && p.cap != null) {
        var start = p.coins + p.put;
        if (p.cap !== capFor(start)) bad.push('★T314-2：' + p.name + ' の 上限 ' + p.cap + '（★はじめ ' + start + ' なら ' + capFor(start) + ' の はず）');
        if (p.put + p.room !== p.cap) bad.push('★T314-2：' + p.name + ' の 出した ' + p.put + ' ＋ のこり ' + p.room + ' ≠ 上限 ' + p.cap);
      }
    });

    /* ⓘ */
    var me = state.players[0];
    if (ph === 'bet' && state.awaitMe && me) {
      var need = needOf(me);
      var call = doc.querySelector('.act-btn[data-act="call"]'), ai = doc.querySelector('.act-btn[data-act="allin"]');
      if (call && !(need < me.room)) bad.push('★T314-2：コールが 出て いるが 足りない（★要る ' + need + '・のこり ' + me.room + '）');
      if (!call && need > 0 && need < me.room) bad.push('★T314-2：足りるのに コールが 出て いません');
      if (ai && ai.textContent.indexOf(fmt(me.room) + '枚') < 0) bad.push('★T314-2：オールインの 数「' + ai.textContent + '」が のこりの 上限 ' + fmt(me.room) + ' と ちがいます');
      /* ★T316 3-4：「（195枚）」が 2行に 折れて いないか（★字そのもの Range の 行の 数）*/
      var nb = ai ? ai.querySelector('small .nb') : null;
      if (ai && !nb) bad.push('★T316：オールインの「（◯枚）」の ひとかたまり（.nb）が ありません');
      if (nb) { var rgn = doc.createRange(); rgn.selectNodeContents(nb); var ln = {}; Array.prototype.forEach.call(rgn.getClientRects(), function (q) { if (q.width > 0.5) ln[Math.round(q.top)] = 1; }); if (Object.keys(ln).length > 1) bad.push('★T316：オールインの「' + nb.textContent + '」が ' + Object.keys(ln).length + '行に 折れて います'); }
    }

    /* ⓙ */
    if (/借金/.test(doc.body.textContent)) bad.push('★T314-2：「借金」の 字が 出て います（★出さない 決まり）');
    if (ph !== 'setup') {
      var seats = doc.querySelectorAll('#seats .seat');
      Array.prototype.forEach.call(seats, function (st, i) {
        var p = state.players[i + 1]; if (!p) return;
        var c = st.querySelector('.seat-coin');
        coinText(c, p.coins, p.name + ' の 席の コイン');
        hamidasu(c, st, p.name + ' の 席の コイン');
      });
      if (me) {
        coinText(doc.getElementById('actCoins'), me.coins, 'ボタンの 上の コイン');
        coinText(doc.querySelector('#meInfo .me-coin'), me.coins, '手札の 横の コイン');
        hamidasu(doc.getElementById('actCoins'), doc.querySelector('.act'), 'ボタンの 上の コイン');
        hamidasu(doc.querySelector('#meInfo .me-coin'), doc.querySelector('.mine'), '手札の 横の コイン');
      }
    }

    /* ⓛ */
    if (ph === 'final' && mieru(doc.getElementById('finalBox'))) {
      var list = finalRanks();
      var rowsF = doc.querySelectorAll('#finalRank .fr-row');
      list.forEach(function (r, i) {
        if (r.net !== r.coins - START_COINS) bad.push('★T314-2：' + r.name + ' の 増えた・減った ' + r.net + '（★' + (r.coins - START_COINS) + ' の はず）');
        var el = rowsF[i]; if (!el) return;
        var nt = el.querySelector('.fr-net'), want = (r.net > 0 ? '＋' : (r.net < 0 ? '−' : '±')) + fmt(Math.abs(r.net)) + '枚';
        if (!nt || nt.textContent !== want) bad.push('★T314-2：順位の 行「' + (nt ? nt.textContent : '') + '」（★' + want + ' の はず）');
        if (r.net < 0 && nt && !nt.classList.contains('is-minus')) bad.push('★T314-2：順位の マイナスに ピンクの しるしが ありません');
        coinText(el.querySelector('.fr-coins'), r.coins, '順位の ' + r.name + ' の コイン');
      });
      if (me) {
        var to = doc.getElementById('finalTo');
        if (to.textContent !== fmt(me.coins)) bad.push('★T314-2：最後の コイン「' + to.textContent + '」（★' + fmt(me.coins) + '）');
        if ((me.coins < 0) !== to.parentNode.classList.contains('is-minus')) bad.push('★T314-2：最後の コインの ピンクの しるしが ちがいます');
        hamidasu(doc.querySelector('.final-coin'), doc.querySelector('#finalBox .rs-scroll'), '最後の コインの 行');
      }
    }
    return bad;
  }
  try { window.__t314Check = function () { return t314Check(document, window); }; } catch (e) {}

  function t281Verify() {
    var bad = t281IconCheck(document, window).map(function (s) { return '★T281 しるし：' + s; });
    /* ★★ T284 ― ★題の 目を 足しました（★しるしを 戻すと ボタンが ＋20px 太る ため）*/
    bad = bad.concat(t284DaiCheck(document).map(function (s) { return '★T284 題：' + s; }));
    var out = {
      はば: window.innerWidth + '×' + window.innerHeight,
      /* ★★ T314：★ここの NG も ★NG に 足す ように しました。
         ★ ★前は「見た目: ★NG n件」と 書く だけで ★★NG の 合計には 入って いません でした
         ★ ★（★NG を 読む 道具からは ★見えない ＝ ★T288 ② の「記録するだけ」）。 */
      '★NG': bad.length,
      見た目: bad.length ? '★NG ' + bad.length + '件' : 'OK',
      NG: bad,
      見た目の目: 'しるしが SVG／弧と やじりの 2パス／16×16px／字と 3px 以上／'
        + '★どの はばでも 出る（★CSS に 落とす 決まりが 0本）／44pxの 的／★題が 切れない・折れない'
    };
    /* ★ T293 ―「見えない 押し代（44px）」の 見張り */
    var t293 = t293oshishiro();
    out['★T293 見えない 押し代（44px）'] = t293['★NG'] ? t293['中身'] : ('OK（数えた ' + t293['数えた ところ'] + 'か所）');
    if (t293['★NG']) out['★NG'] = (out['★NG'] || 0) + t293['★NG'];
    /* ★ T297 ― 上の帯が 画面に くっついて いるか */
    var t297 = t297ObiCheck(document, window);
    out['★T297 帯が くっついて いるか'] = t297.length ? t297 : 'OK';
    if (t297.length) out['★NG'] = (out['★NG'] || 0) + t297.length;
    /* ★ T314 ― はじめの 画面・ハンド数・結果の 箱・降りた あとの 札 */
    var t314 = t314Check(document, window);
    out['★T314 はじめの 画面・結果の 箱'] = t314.length ? t314 : 'OK（場面：' + state.phase + (state.showResult ? '・結果の 箱' : '') + '）';
    if (t314.length) out['★NG'] = (out['★NG'] || 0) + t314.length;
    console.log('[ホールデム] verify', out);
    return out;
  }

  window.HOLDEM = {
    /* ★ T297 ― 上の帯の 目だけを 呼ぶ 口（★verify から 呼ばれる ものと 同じ 関数。★二重帳簿に しない）*/
    t297: function () { return t297ObiCheck(document, window); },
    /* ★ T314 ― はじめの 画面・結果の 箱の 目だけを 呼ぶ 口（★verify から 呼ばれる ものと 同じ 関数）*/
    t314: function () { return t314Check(document, window); },
    afterHandStep: afterHandStep,   // ★ハンド数で 終わる 決め手（★見張りも 画面も これを 読む）
    /* ★T316：2連打の 止めを ★わざと 壊して 見張りを 鳴かせる ための 口（★けんしょう用・遊ぶ 人は 使わない）*/
    __guardMs: function (n) { if (n != null) GUARD_MS = n; return GUARD_MS; },
    __guardLeft: function () { return Math.max(0, guardUntil - nowMs()); },
    __guardSel: GUARD_SEL,
    __guardListener: function (on) { if (on) window.addEventListener('click', guardClick, true); else window.removeEventListener('click', guardClick, true); return !!on; },
    start: function (n) { startSession(n || state.maxHands); return window.HOLDEM.now(); },   // ★はじめの 画面を とばして 始める（けんしょう用）
    toSetup: enterSetup,
    verify: t281Verify,          /* ★T281 ―「↻」が 記号に 見えて いるか */
    setup: function (holeSpec, boardSpec, robotSpecs) { dealFixed(holeSpec, boardSpec, robotSpecs); return window.HOLDEM.now(); },
    demo: demo,
    demos: function () { return Object.keys(DEMOS); },
    play: startHand,          // 見本から ゲームに もどる（新しい ハンド）
    deal: startHand,          // 第2段の 呼び名も 残す
    stage: stage,             // ★ 決着を 仕込む（split / side / kicker）
    stages: function () { return Object.keys(STAGES); },
    autoPlay: autoPlay,       // ★ コインの けいさんを たしかめる
    bench: bench,             // ★ 強さごとの もうけを 数で 出す
    matrix: matrix,           // ★ 強さ3 × かけ方3 ＝ 9通りの たしかめ
    seed: seed,               // ★ でたらめの 種（同じ 遊びを もう一度 おこす）
    checkCoins: function () { checkCoins('手で しらべた'); return { エラー: state.errors.slice(-5), 合計: state.injected }; },
    mode: function (m) { if (MODES[m]) { state.mode = m; raiseOpen = false; render(); } return state.mode; },
    cpu: function (c) { if (CPUS[c]) { state.cpu = c; render(); } return state.cpu; },
    cpus: function () { return Object.keys(CPUS); },
    /* 手札2枚の 手のよさを 数で 見る（T54：★の 画面表示は 撤去。中の 考えの 確認口） */
    guideOf: function (spec) { return preflopGuide(spec ? PC.cards(spec) : state.hole); },
    state: state,
    /* 今の ようすを 1つの もので 見る（けんしょう用） */
    now: function () {
      var r = state.result;
      return {
        ハンド: state.handNo,
        ハンド数: state.maxHands,
        場面: state.phase,
        step: STEPS[state.step].label,
        親: state.players[state.dealer] ? state.players[state.dealer].name : '',
        ポット: state.pot,
        コイン: state.players.map(function (p) { return p.name + ':' + p.coins + (p.folded ? '(降りた)' : ''); }),
        出した: state.players.map(function (p) { return p.name + ':' + p.put; }),
        いまの番: state.players[state.turn] ? state.players[state.turn].name : '',
        hole: state.hole.map(function (c) { return c.ja + c.rank; }),
        board: openBoard().map(function (c) { return c.ja + c.rank; }),
        役: r ? PC.HAND_BY_ID[r.id].name : '（まだ）',
        中身: handDetail(r),
        つかう5枚: r ? r.best.map(function (c) { return c.ja + c.rank; }) : [],
        つかわない: r ? r.unused.map(function (c) { return c.ja + c.rank; }) : [],
        場だけの役: !!(r && !PC.uses(r, state.hole)),
        aceLow: !!(r && r.aceLow),
        決着: state.endNote || '（まだ）',
        最高記録: state.best,
        マイナス: state.players.filter(function (p) { return p.coins < 0; }).map(function (p) { return p.name; })
      };
    }
  };

  /* ============================================================
     たしかめ用ボタン（作る人むけ）
     ============================================================ */
  /* ★★★ T314 ―「↻ さいしょから」→「↻ やめる」（★設計図 追記⑩ ⑤の 書き置き）★★★
     ★ T277 では はじめの 画面が 無かった ので「その場で 配り直す」でした。
     ★ ★T314 で はじめの 画面（何ハンド 遊ぶ？）が できた ので、★ほかの 18本と 同じ
       ★★**はじめの 画面へ 戻る**に しました（`enterSetup`）。
     ★ ★卓を まっさらに する 中身は ★前と 同じ 4行（★resetTable の 中・★bench() と 同じ 並び）。
     ★ ★さいこう記録（state.best）には さわりません ―― ★localStorage に のこります。
     ★ 社長のお決め②「聞かない」―― ★たしかめの 箱は 出しません。 */
  $('btnQuitGame').addEventListener('click', function () { armGuard(); enterSetup(); });   // ★T316：はじめの 画面の ボタンに 2つめを 届かせない

  $('btnPlay').addEventListener('click', startHand);
  document.querySelectorAll('[data-demo]').forEach(function (b) {
    b.addEventListener('click', function () { demo(b.dataset.demo); });
  });
  document.querySelectorAll('[data-stage]').forEach(function (b) {
    b.addEventListener('click', function () { console.log('[HOLDEM] stage', stage(b.dataset.stage)); });
  });

  /* ============================================================
     はじめる
     ============================================================ */
  /* T54：おぼえるのは 最高記録だけ（かけ方・強さ・目安の 設定は 撤去した） */
  var savedBest = null;
  try { savedBest = localStorage.getItem('holdem.best'); } catch (e) {}
  state.mode = 'full';       // かけ金は 1枚きざみに 一本化
  state.cpu = 'strong';      // ロボットは 常に「つよい」
  if (savedBest && +savedBest > START_COINS) state.best = +savedBest;

  buildRanks();     // 役の強さの一覧（HANDS から 1回だけ 作る）
  enterSetup();     // ★T314：はじめの 画面（何ハンド 遊ぶ？）から 始める
})();
