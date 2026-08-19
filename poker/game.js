/* ============================================================
   ポーカー（5枚くばって 取りかえる かたち）― 第1段「遊べるところまで」（T48）
   ------------------------------------------------------------
   ホールデム（../holdem/game.js）を 土台に コピーして 作った。
   仕様は logs/T47_ドローポーカー_企画.md（ルル）＋ 末尾の 社長裁定が 正。

   社長裁定（2026-08-18・厳守）：
     ・ジョーカーは 入れない（52枚ちょうど・役は10種類・はしご10段のまま）
     ・名前は「ポーカー」（「ドロー」という言葉は 画面に 出さない）
     ・取りかえは 0〜5枚 自由・1回だけ
     ・設定は ホールデムと 同じ3つ（かけ方／ロボットの強さ／手札の目安）

   ホールデムから そのまま 使ったもの（かけ回り一式）：
     コインの出し入れ（commit / checkCoins）／かけの1回転（tick / roundComplete）／
     降りる・かけない・合わせる・上げる・ぜんぶかける／かけ方3つ（かんたん・ふつう・ぜんぶ）／
     小がけ5・大がけ10・親マーク🔘／サイドポット・端数（PokerCore.settle）／
     1人だけ残ったら 見せずに もらえる／コイン0の あつかい／ロボットの強さ3段階の 骨組み／
     autoPlay・bench・matrix・seed の けんしょう道具

   新しく 書いたもの（ドローの 差分）：
     ① 取りかえフェーズ（0〜5枚 えらんで ボタン1つ・親の左どなりから 順に・T47 §5）
     ② ★ 役の中心（coreKeys）の 表引き ―― ロボットの 取りかえと 警告1行の もと
        ⚠️ poker-core.js は 触らない 約束なので、coreKeys は このファイルの 表引きで 出す
           （evaluate の best は「役の札が 先頭」の ならびに 組んである。その先頭 N枚が 中心）
        ※ 画面の 光りとしては 使わない（T53で 撤去。中の 考えとしてだけ 生きている）
     ③ ★ 取りかえ枚数バッジ ―― ドローの ただ1つの 公開情報。ハンドが 終わるまで 消えない（§6-5）
     ④ 引いた札の 1枚ずつ めくり（§6-7・このゲームの 心臓）
     ⑤ すてまちがいの 警告1行（ハッピーが 言う。止めない・§6-4）
     ⑥ ロボットの 取りかえ 3段階（弱い＝役の中心を 残す／ふつう＝あと1枚の フラッシュ・
        ストレートも ねらう／つよい＝＋たまに 取りかえないで 強いふり・§8）
     ⑦ 手札の目安 ★ ―― 取りかえの 前の 5枚を ★で 出す（設定で 消せる・社長裁定で 3つめの席）

   まだ 作っていない（次の段）：
     強さのはしご 10段／遊び方の3層・役の一覧（§8の器）／決着の 仕込み口（stage）／
     見た目の 作りこみ（🎨アト）／テストの 総ざらい（🧪トライ）

   ── T53（2026-08-18・社長指示「もっと 説明を 減らして シンプルに」）──
     撤去した 表示（ロジックは 触っていない）：
       ・設定パネル まるごと（かけ方3段階／ロボットの強さ／手札の目安★）
         → ロボットは「つよい」固定・かけ金は 1枚きざみに 一本化
       ・「今の役」の 名札（常設パネル）
       ・役の中心の 光り（is-used／is-dim）
         → 強調は 画面に 1種類だけ ＝「すてる」の 選択（設計図 §5.5「二層設計の上限」）
     ボタンは カタカナ主表記に（コール／レイズ／フォールド／チェック／オールイン
     ＋ 下に 小さく 日本語・§9.6の 例外リスト）。コイン枚数を ボタンの すぐ上に 出す。
     drawGuide・coreKeysOf などの 中の 考えは ロボットが 使うので 温存（表示だけ 消した）。

   ⚠️ 役の 判定・くらべ・ポットの 分け方は ぜんぶ ../poker-core.js（PokerCore）。
      このファイルは 判定の 計算を 書かない。説明文も PokerCore.HAND_BY_ID から 引く。
   ⚠️ 山札は くばった あとも とっておき、取りかえで そこから 引く。
      すてた札は discardKeys に 入れて、山に ぜったいに もどさない（T47 §1-2）。
      4人×5枚＝20枚 くばって 山は 32枚。取りかえの 最大は 20枚 なので 足りる。
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

  /* ───────── カードの 絵札（設計図 §9・厳守）───────── */
  var CARD_DIR = '../cards/';
  function cardSrc(file) { return CARD_DIR + encodeURIComponent(file) + '.png'; }

  /* ───────── 進み具合（T47 §1-1）─────────
     くばる → かけ① → 取りかえ → かけ② → 勝負 */
  var STAGE_LABELS = ['くばる', 'かけ①', '取りかえ', 'かけ②', '勝負'];

  /* ───────── お金の きまり（ホールデムと 同じ・社長裁定を 引き継ぎ）───────── */
  var START_COINS = 200;   // 4人とも 200枚から
  var SMALL_BET   = 5;     // 小がけ（親の 左どなり）
  var BIG_BET     = 10;    // 大がけ（そのまた 左どなり）
  var SEATS       = 4;     // 自分＋ロボット3人（固定・T47 §4）
  var CPU_MAX_RAISE = 3;   // 1回の かけで ロボットが 上げるのは 3回まで

  /* 上乗せの 最小。1＝いくらでも 上乗せできる（社長指示・T58）
     'rule' に すると 本式（直前の 上げ幅ぶん 以上）に もどる */
  var MIN_RAISE_ADD = 1;   // 1 または 'rule'

  /* ───────── かけ方（T53：画面は 1枚きざみに 一本化）─────────
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

  /* ───────── ロボットの 強さ（T53：画面は「つよい」固定）─────────
     3段階の 頭（BRAINS）は bench・matrix の けんしょうが 使うので 温存。 */
  var CPUS = {
    weak:   { label: '弱い',   note: 'よく ついてくる' },
    normal: { label: 'ふつう', note: 'それなりに 降りる' },
    strong: { label: 'つよい', note: 'よい手だけ 勝負' }
  };

  /* ============================================================
     ★★ 役の中心（coreKeys）―― ロボットと 警告1行が 見る「役の札」の こたえ（T47 §6-1）
     ------------------------------------------------------------
     ⚠️ poker-core.js は 触らない 約束（T48 の 指示が ルルの 提案より 優先）。
        そのかわり、evaluate の best が「役を 作っている 札が 先頭」の ならびで
        返ってくる こと（poker-core の 組み立てかた）を つかい、
        先頭 N枚を 表引きで 取る。N は ルルの 表（§6-1）が 正：
          ハイカード＝1 ／ ワンペア＝2 ／ スリーカード＝3 ／
          ツーペア・フォーカード＝4 ／ それ以外の 役＝5枚 全部
     ============================================================ */
  var CORE_N = {
    highCard: 1, onePair: 2, threeOfAKind: 3, twoPair: 4, fourOfAKind: 4,
    straight: 5, flush: 5, fullHouse: 5, straightFlush: 5, royalFlush: 5, fiveOfAKind: 5
  };
  function coreKeysOf(result) {
    if (!result) return [];
    var n = CORE_N[result.id] || 5;
    return result.best.slice(0, n).map(function (c) { return c.key; });
  }

  /* ───────── 今の ばめん ───────── */
  var state = {
    players: [],       // 4人。0番が 自分
    dealer: -1,        // 親マーク🔘の 席（ハンドごとに 1つ ずれる）
    handNo: 0,
    pot: 0,
    toCall: 0,
    lastRaise: BIG_BET,
    turn: 0,
    phase: 'bet',      // 'bet' かけ / 'swap' 取りかえ / 'end' おわり / 'over' / 'demo'
    street: 0,         // 0 ＝ かけ①（取りかえの 前）／ 1 ＝ かけ②（取りかえの あと）
    deck: [],          // ★ くばった あとの 山札（取りかえで ここから 引く）
    discardKeys: [],   // ★ すてた札。山に ぜったいに もどさない（けんしょうも ここを 見る）
    selected: [],      // 自分が「すてる」に えらんだ 札の key（大富豪の 型・T47 §5-1）
    awaitSwap: false,  // 自分の 取りかえの 番で 待っている
    reveal: null,      // 引いた札の 1枚ずつ めくり（{ keys:[], shown:n }・T47 §6-7）
    settle: null,
    rows: [],
    split: false,
    endNote: '',
    best: START_COINS,
    newBest: false,
    fast: false,
    awaitMe: false,
    injected: SEATS * START_COINS,
    errors: [],
    logs: [],
    cpu: 'strong',     // T53：常に「つよい」（設定パネルは 撤去。dev の POKER.cpu では 変えられる）
    foldStats: [],
    flashHappy: '',    // ハッピーに 一言だけ 言わせたい とき（めくりの 結果・0枚の 相手）
    statSwap: [0, 0, 0, 0, 0, 0],   // 取りかえ枚数の 回数（けんしょう用・0〜5枚）
    result: null
  };

  var timers = [];
  function schedule(fn, ms) {
    if (state.fast) { fn(); return; }
    timers.push(setTimeout(fn, ms));
  }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  /* ============================================================
     コインの 出し入れ（ここ 1か所だけ・ホールデムから そのまま）
     ============================================================ */
  function commit(p, amount) {
    amount = Math.max(0, Math.min(Math.round(amount), p.coins));
    p.coins -= amount;
    p.bet   += amount;
    p.put   += amount;
    state.pot += amount;
    if (p.coins <= 0) { p.coins = 0; p.allIn = true; }
    checkCoins('コインを 出したあと');
    return amount;
  }

  function checkCoins(where) {
    var sum = 0, put = 0;
    state.players.forEach(function (p) {
      sum += p.coins; put += p.put;
      if (p.coins < 0) state.errors.push(where + '：' + p.name + ' の コインが マイナス');
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
      p.swapped = false; p.swapCount = null;   // ★ 取りかえ（バッジの もと・T47 §6-5）
      p.sKey = ''; p.sVal = 0;
      return p;
    });
    state.foldStats = state.players.map(function () { return { hands: 0, folds: 0 }; });
  }

  function foldRateOf(i) {
    var st = state.foldStats[i];
    if (!st || st.hands < 8) return 0.25;
    return st.folds / st.hands;
  }

  function seatAt(i) { return ((i % SEATS) + SEATS) % SEATS; }
  function livePlayers()   { return state.players.filter(function (p) { return !p.folded; }); }
  function actablePlayers() { return state.players.filter(function (p) { return !p.folded && !p.allIn; }); }
  function myHand() { return state.players[0] ? state.players[0].hole : []; }

  /* ============================================================
     ハンドを はじめる
     ============================================================ */
  function startHand() {
    clearTimers();
    if (!state.players.length) makePlayers();

    /* とちゅうで 新しい ハンドに した ときは、出ている コインを もどす */
    if (state.pot > 0) {
      state.players.forEach(function (p) { p.coins += p.put; p.put = 0; });
      state.pot = 0;
      log('とちゅうで やめたので、出したコインを もどしたよ');
    }

    /* コインが 0に なった人（ロボットは 復活／自分は ゲームオーバー画面 経由） */
    state.players.forEach(function (p) {
      if (p.coins <= 0) {
        p.coins = START_COINS;
        state.injected += START_COINS;
        log(p.me ? 'コインを 200枚 もらって、もういちど！'
                 : p.name + 'が コインを もらって もどってきたよ');
      }
    });

    state.settle = null;
    state.rows = [];
    state.split = false;
    state.endNote = '';
    state.newBest = false;
    state.flashHappy = '';
    $('showdownBox').classList.add('hidden');
    $('overBox').classList.add('hidden');

    state.handNo++;
    state.dealer = seatAt(state.dealer + 1);
    state.pot = 0;
    state.street = 0;
    state.phase = 'bet';
    state.result = null;
    state.selected = [];
    state.awaitSwap = false;
    state.reveal = null;
    state.discardKeys = [];

    state.players.forEach(function (p, i) {
      p.hole = []; p.bet = 0; p.put = 0; p.gain = 0;
      p.folded = false; p.allIn = false; p.acted = false;
      p.last = ''; p.raises = 0;
      p.swapped = false; p.swapCount = null;
      p.sKey = ''; p.sVal = 0;
      if (state.foldStats[i]) state.foldStats[i].hands++;
    });

    /* 配る（ジョーカーなし・52枚・社長裁定）。のこりは 山札として とっておく */
    var deck = PC.shuffle(PC.createDeck());
    state.players.forEach(function (p) { p.hole = PC.draw(deck, 5); });
    state.deck = deck;                       // 52 − 20 ＝ 32枚

    log(state.handNo + 'ハンドめ。5枚ずつ くばるよ');

    /* 小がけ・大がけ（親の 左から 順に） */
    var sb = state.players[seatAt(state.dealer + 1)];
    var bb = state.players[seatAt(state.dealer + 2)];
    var paidS = commit(sb, SMALL_BET); sb.last = '小がけ ' + paidS;
    var paidB = commit(bb, BIG_BET);   bb.last = '大がけ ' + paidB;
    log(sb.name + 'が 小がけ ' + paidS + ' ／ ' + bb.name + 'が 大がけ ' + paidB);

    state.toCall = Math.max(paidS, paidB, BIG_BET);
    state.lastRaise = BIG_BET;
    state.turn = seatAt(state.dealer + 3);   // 大がけの 左どなりから（かけ①）

    render();
    tick();
  }

  /* ============================================================
     ★ かけが 1回転する ところ（ホールデムから そのまま）
     ============================================================ */
  function roundComplete() {
    var act = actablePlayers();
    if (act.length === 0) return true;
    if (act.length === 1) return act[0].bet >= state.toCall;
    for (var i = 0; i < act.length; i++) {
      if (!act[i].acted || act[i].bet !== state.toCall) return false;
    }
    return true;
  }

  function tick() {
    if (state.phase !== 'bet') { render(); return; }

    if (livePlayers().length <= 1) { finishByFold(); return; }
    if (roundComplete()) { schedule(afterBetRound, 620); render(); return; }

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
    var base = 600 + Math.random() * 600;
    return state.players[0].folded ? base / 2 : base;
  }

  /* かけの 1回転が おわった → かけ①なら 取りかえへ／かけ②なら 勝負へ */
  function afterBetRound() {
    if (state.phase !== 'bet') return;
    state.players.forEach(function (p) { p.bet = 0; p.acted = false; p.raises = 0; if (!p.folded) p.last = ''; });
    state.toCall = 0;
    state.lastRaise = BIG_BET;

    if (state.street === 0) beginSwap();
    else showdown();
  }

  /* ============================================================
     ★★ 取りかえフェーズ（今回の 新規部分・T47 §2・§5）
     ------------------------------------------------------------
     ・親の 左どなりから 順に（かけと 同じ 回り方・§5-3）
     ・0〜5枚 自由・1回だけ（社長裁定）
     ・ぜんぶかけた人（allIn）も、降りていなければ 取りかえる
     ・すてた札は discardKeys へ。山に もどさない
     ============================================================ */
  function beginSwap() {
    state.phase = 'swap';
    state.awaitMe = false;
    state.turn = seatAt(state.dealer + 1);
    log('取りかえの 時間だよ（0〜5枚・1回だけ）');
    render();
    swapTick();
  }

  function swapTick() {
    if (state.phase !== 'swap') return;

    var pending = state.players.some(function (p) { return !p.folded && !p.swapped; });
    if (!pending) { startBet2(); return; }

    var i = state.turn, guard = 0;
    while (guard++ <= SEATS && (state.players[i].folded || state.players[i].swapped)) i = seatAt(i + 1);
    state.turn = i;

    var p = state.players[i];
    if (p.me) {
      state.awaitSwap = true;
      state.selected = [];
      render();
    } else {
      state.awaitSwap = false;
      render();
      schedule(function () { cpuSwap(i); }, cpuDelay());
    }
  }

  /* ★ 札を 取りかえる（ここ 1か所だけ。ほかで hole を さわらない）
     もどり値 ＝ 引いた札。けんしょうも ここで やる：
       ・同じ札を 2回 えらんでいないか ・山札が 足りるか
       ・すてた札が 山から もどって こないか ・手札が 5枚の ままか */
  function doSwap(idx, keys) {
    var p = state.players[idx];
    var keep = p.hole.filter(function (c) { return keys.indexOf(c.key) < 0; });
    var out  = p.hole.filter(function (c) { return keys.indexOf(c.key) >= 0; });

    if (keep.length + out.length !== 5) {
      state.errors.push('取りかえ：' + p.name + ' の 手札が 5枚では ない');
    }
    if (out.length !== keys.length) {
      state.errors.push('取りかえ：' + p.name + ' が 手札に ない札／同じ札を えらんだ');
    }
    if (state.deck.length < out.length) {
      state.errors.push('取りかえ：山札が 足りない（のこり ' + state.deck.length + '枚）');
    }

    out.forEach(function (c) {
      if (state.discardKeys.indexOf(c.key) >= 0) {
        state.errors.push('取りかえ：' + c.key + ' を 2回 すてた');
      }
      state.discardKeys.push(c.key);
    });

    var drawn = PC.draw(state.deck, out.length);
    drawn.forEach(function (c) {
      if (state.discardKeys.indexOf(c.key) >= 0) {
        state.errors.push('取りかえ：すてた札 ' + c.key + ' が 山から もどってきた');
      }
    });

    p.hole = keep.concat(drawn);          // 引いた札は うしろに つく（めくりも この順・§6-7）
    if (p.hole.length !== 5) state.errors.push('取りかえ：' + p.name + ' の 手札が ' + p.hole.length + '枚に なった');
    p.swapped = true;
    p.swapCount = out.length;
    p.sKey = '';                          // 手が 変わったので おぼえ書きを 消す
    state.statSwap[out.length]++;
    return drawn;
  }

  /* ロボットの 取りかえ（考えは cpuSwapKeys・§8） */
  function cpuSwap(idx) {
    if (state.phase !== 'swap') return;
    var p = state.players[idx];
    if (p.folded || p.swapped) { state.turn = seatAt(idx + 1); swapTick(); return; }

    var keys = cpuSwapKeys(p, idx);
    doSwap(idx, keys);

    if (keys.length === 0) {
      log(p.name + 'は 取りかえなかった！');
      state.flashHappy = '取りかえないんだ…強いのかな？';
    } else {
      log(p.name + 'が ' + keys.length + '枚 取りかえた');
    }

    state.turn = seatAt(idx + 1);
    render();
    schedule(swapTick, state.fast ? 0 : 260);
  }

  /* 自分の 取りかえ（ボタンから／けんしょうの 自動から） */
  function submitSwap(keys) {
    if (state.phase !== 'swap' || !state.awaitSwap) return;
    state.awaitSwap = false;
    state.selected = [];

    var before = state.result;
    var beforeRank = before ? before.rank : 0;

    var drawn = doSwap(0, keys);

    if (keys.length === 0) {
      log('あなたは 取りかえなかった！');
      state.flashHappy = 'そのままで 勝負だ！';
      advanceAfterMySwap();
      return;
    }

    log(keys.length + '枚 すてて、' + keys.length + '枚 引くよ…');

    if (state.fast) { advanceAfterMySwap(); return; }

    /* ★ 引いた札は かならず 1枚ずつ めくる（T47 §6-7・まとめて 出したら 心臓が 止まる） */
    state.reveal = { keys: drawn.map(function (c) { return c.key; }), shown: 0 };
    render();
    var step = function () {
      if (!state.reveal) return;
      state.reveal.shown++;
      var done = state.reveal.shown >= state.reveal.keys.length;
      if (done) {
        state.reveal = null;
        recalc();
        var after = state.result;
        if (after && after.rank > beforeRank) {
          var def = PC.HAND_BY_ID[after.id];
          state.flashHappy = def.name + 'に なった！';
          log(def.name + 'に なった！');
        } else if (after && after.rank < beforeRank) {
          /* わざと 崩した とき など、役が 下がった 瞬間の 一言（T49 🔵2） */
          state.flashHappy = 'あれ、下がっちゃった…';
        } else {
          state.flashHappy = 'うーん、こなかったか…';
        }
        render();
        schedule(advanceAfterMySwap, 600);
      } else {
        render();
        schedule(step, 340);
      }
    };
    schedule(step, 340);
  }

  function advanceAfterMySwap() {
    state.turn = seatAt(0 + 1);
    swapTick();
  }

  /* かけ②（親の 左どなりから・T47 §1-1） */
  function startBet2() {
    state.phase = 'bet';
    state.street = 1;
    state.turn = seatAt(state.dealer + 1);
    state.toCall = 0;
    state.lastRaise = BIG_BET;
    log('2回めの かけだよ');
    render();
    tick();
  }

  /* ============================================================
     勝負の 決着（ホールデムから そのまま。手は 5枚ちょうど）
     ============================================================ */
  function oddOrder() {
    var out = [];
    for (var i = 1; i <= SEATS; i++) out.push(seatAt(state.dealer + i));
    return out;
  }

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

    /* 勝負まで 来たのに 取りかえて いない人が いたら、進行の バグ（けんしょう） */
    state.players.forEach(function (p) {
      if (!p.folded && !p.swapped) state.errors.push('決着：' + p.name + ' が 取りかえないまま 勝負に なった');
    });

    var entries = state.players.map(function (p, i) {
      return {
        id: i, put: p.put, folded: p.folded,
        hand: p.folded ? null : PC.evaluate(p.hole)     // ★ 5枚で そのまま よぶ（T47 §10-1）
      };
    });

    var res = PC.settle({ players: entries, order: oddOrder() });
    state.settle = res;

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
    state.players.forEach(function (p) { p.put = 0; p.bet = 0; });
    checkCoins('勝負の あと');

    buildShowdownRows(res, entries);
    finishHand();
  }

  function buildShowdownRows(res, entries) {
    var tookPot = {};
    res.pots.forEach(function (pot) {
      pot.winners.forEach(function (id) { tookPot[id] = true; });
    });

    var rows = res.showdown.map(function (r) {
      var i = r.id;
      return {
        seat: i, name: state.players[i].name, me: state.players[i].me,
        hand: r.hand, place: r.place, top: r.win, win: !!tookPot[i],
        gain: res.payouts[i] || 0, cap: res.caps[i] || 0,
        swapCount: state.players[i].swapCount,
        folded: false, markIdx: -1, markText: ''
      };
    });

    /* ▲「ここで 勝った／負けた」（同じ役どうし・キッカーの 説明の 全部） */
    if (rows.length >= 2) {
      var strongest = rows[0];
      for (var i = 1; i < rows.length; i++) {
        if (rows[i].place > 1 && rows[i].hand.rank === strongest.hand.rank) {
          var k = PC.decidingIndex(rows[i].hand, strongest.hand);
          if (k >= 0) { rows[i].markIdx = k; rows[i].markText = 'ここで 負けた'; }
        }
      }
      for (var j = 1; j < rows.length; j++) {
        if (rows[j].place > 1 && rows[j].hand.rank === strongest.hand.rank) {
          var k2 = PC.decidingIndex(strongest.hand, rows[j].hand);
          if (k2 >= 0) { strongest.markIdx = k2; strongest.markText = 'ここで 勝った'; }
          break;
        }
      }
    }

    entries.forEach(function (e) {
      if (!e.folded) return;
      rows.push({
        seat: e.id, name: state.players[e.id].name, me: state.players[e.id].me,
        hand: null, place: 0, win: false, gain: res.payouts[e.id] || 0,
        swapCount: state.players[e.id].swapCount,
        folded: true, markIdx: -1, markText: ''
      });
    });

    state.rows = rows;

    var top = rows.filter(function (r) { return r.top; })[0];
    var me = rows.filter(function (r) { return r.me && !r.folded; })[0];
    var def = top ? PC.HAND_BY_ID[top.hand.id] : null;
    var anySplit = res.pots.some(function (p) { return p.winners.length > 1; });

    state.split = anySplit;

    if (anySplit) {
      state.endNote = '引き分け！ コインを分けたよ';
    } else if (me && me.gain > 0) {
      var myDef = PC.HAND_BY_ID[me.hand.id];
      state.endNote = myDef.name + '（' + myDef.short + '）で 勝った！ コイン ' + me.gain;
    } else if (top) {
      state.endNote = top.name + 'が ' + def.name + '（' + def.short + '）で 勝った';
    } else {
      state.endNote = '';
    }
    log(state.endNote);
  }

  function finishHand() {
    var me = state.players[0];

    if (me.coins > state.best) {
      state.best = me.coins;
      state.newBest = true;
      if (!state.fast) {
        try { localStorage.setItem('poker.best', String(state.best)); } catch (e) {}
      }
      log('最高記録！ コイン ' + state.best);
    }

    if (me.coins <= 0) {
      state.phase = 'over';
      log('ゲームオーバー ―― ' + state.handNo + 'ハンド 遊べたよ。最高は ' + state.best + '枚');
    }
    render();
  }

  function restart() {
    startHand();     // startHand の 中で 0の人に 200枚 わたす
  }

  /* 1人だけ 残った → その場で 決着（見せずに もらえる） */
  function finishByFold() {
    var winner = livePlayers()[0];
    var won = state.pot;
    winner.coins += won;
    winner.gain = won;
    state.pot = 0;
    state.players.forEach(function (p) { p.put = 0; p.bet = 0; if (p !== winner) p.gain = 0; });
    state.phase = 'end';
    state.awaitMe = false;
    state.awaitSwap = false;
    state.reveal = null;
    state.settle = null;
    state.rows = [];
    checkCoins('1人だけ残って 決着');
    state.endNote = winner.me
      ? 'みんな降りた！ 見せずに もらえるよ ―― コイン ＋' + won
      : winner.name + 'が ポットを もらった（＋' + won + '）。カードは 見せないよ';
    log(state.endNote);
    finishHand();
  }

  /* ============================================================
     かける（ホールデムから そのまま）
     ============================================================ */
  function needOf(p)     { return Math.max(0, state.toCall - p.bet); }
  function minRaiseTo()  { return Math.max(state.toCall + state.lastRaise, BIG_BET); }
  function maxRaiseTo(p) { return p.bet + p.coins; }
  function canRaise(p)   { return !p.allIn && maxRaiseTo(p) > state.toCall; }

  /* T58：自分が レイズするときの「上乗せ」の 下限。MIN_RAISE_ADD で 切りかえる。
     ロボットの 思考は これを 使わない（minRaiseTo のまま ＝ 強さは 変わらない） */
  function myMinAdd() {
    if (MIN_RAISE_ADD === 'rule') return Math.max(1, minRaiseTo() - state.toCall);
    return Math.max(1, MIN_RAISE_ADD | 0);
  }
  function myMinRaiseTo() { return state.toCall + myMinAdd(); }

  function afterAction(idx) {
    if (idx === 0) state.flashHappy = '';   // 自分が 動いたら めくりの 一言は 消す
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
    if (needOf(p) === 0) { doCheck(idx); return; }
    var paid = commit(p, needOf(p));
    p.acted = true;
    p.last = p.allIn ? ('ぜんぶかけた ' + p.bet) : ('合わせた ' + p.bet);
    log(p.name + (p.allIn ? 'が ぜんぶかけた！ ' + paid + '枚' : 'が 合わせた（' + paid + '枚）'));
    afterAction(idx);
  }

  function doRaise(idx, raiseTo) {
    var p = state.players[idx];
    var top = maxRaiseTo(p);
    raiseTo = Math.min(Math.max(Math.round(raiseTo), state.toCall + 1), top);
    var paid = commit(p, raiseTo - p.bet);
    var up = p.bet - state.toCall;
    if (up > 0) {
      state.lastRaise = Math.max(state.lastRaise, up);
      state.toCall = p.bet;
      state.players.forEach(function (q) { if (q !== p && !q.folded && !q.allIn) q.acted = false; });
    }
    p.acted = true;
    p.raises++;
    p.last = p.allIn ? ('ぜんぶかけた ' + p.bet) : ('上げた ' + p.bet);
    /* T58：「◯まで 上げた」は 分かりにくい（社長指示）。上乗せ と 合計 で 言う */
    log(p.name + (p.allIn ? 'が ぜんぶかけた！ ' + paid + '枚' : 'が 上乗せ ' + up + ' ／ ぜんぶで ' + p.bet + '枚'));
    afterAction(idx);
  }

  function doAllIn(idx) {
    var p = state.players[idx];
    if (maxRaiseTo(p) > state.toCall) doRaise(idx, maxRaiseTo(p));
    else doCall(idx);
  }

  /* ============================================================
     ★★ 手札の目安 ―― 1か所きり（ホールデムの preflopGuide の ドロー版）
     ------------------------------------------------------------
     この 関数 1つで、2つを いっぺんに 出す：
       ・画面に 出す ★（3つまで）＋ 一言 … 取りかえの 前だけ・設定で 消せる
       ・中で つかう 数（0〜1）… ロボットと けんしょう用の 打ち手（HUMAN）が 見る
       ・4枚そろいの 見つけもの（draw）… ロボットの 取りかえも これを 見る
     べつべつに 書くと 画面と 中の 考えが ずれる。ぜったいに 分けない。
     ============================================================ */
  function fourFlush(hand) {
    var bySuit = {};
    hand.forEach(function (c) { (bySuit[c.suit] || (bySuit[c.suit] = [])).push(c); });
    var out = null;
    Object.keys(bySuit).forEach(function (s) {
      if (bySuit[s].length === 4) out = bySuit[s].map(function (c) { return c.key; });
    });
    return out;
  }

  function fourStraight(hand) {
    /* 数の ちがう 4枚が、はば4の 中に おさまっていれば「あと1枚」。
       A は 上（14）と 下（1）の 両方で 見る。すでに ストレートなら 見ない。 */
    function probe(vals) {
      var uniq = [];
      vals.forEach(function (v) { if (uniq.indexOf(v.v) < 0) uniq.push(v.v); });
      uniq.sort(function (a, b) { return a - b; });
      if (uniq.length < 4) return null;
      for (var i = 0; i + 3 < uniq.length; i++) {
        if (uniq[i + 3] - uniq[i] <= 4) {
          var pick = uniq.slice(i, i + 4);
          var keys = [], usedV = [];
          vals.forEach(function (v) {
            if (pick.indexOf(v.v) >= 0 && usedV.indexOf(v.v) < 0) { keys.push(v.key); usedV.push(v.v); }
          });
          return keys;
        }
      }
      return null;
    }
    var hi = hand.map(function (c) { return { v: c.value, key: c.key }; });
    var lo = hand.map(function (c) { return { v: c.value === 14 ? 1 : c.value, key: c.key }; });
    return probe(hi) || probe(lo);
  }

  function drawGuide(hand) {
    if (!hand || hand.length < 5) {
      return { stars: 1, main: 'まだ カードが ないよ', word: '', score: 0.2, draw: null, result: null };
    }
    var r = PC.evaluate(hand);
    var g = { result: r, draw: null };
    var f4 = null, s4 = null;
    if (r.rank <= 2) {                 // ハイカード・ワンペアの ときだけ「あと1枚」を さがす
      f4 = fourFlush(hand);
      s4 = fourStraight(hand);
      if (f4) g.draw = { type: 'flush', keep: f4 };
      else if (s4) g.draw = { type: 'straight', keep: s4 };
    }

    if (r.rank >= 5) {                 // ストレート以上 ＝ 5枚 そろった 役
      g.stars = 3; g.main = 'すごい手だ！'; g.word = '役が もう そろっているよ';
      g.score = 0.84 + (r.rank - 5) * 0.03;
    } else if (r.rank === 4) {         // スリーカード
      g.stars = 3; g.main = '強い形！'; g.word = '同じ数が 3枚 あるよ';
      g.score = 0.72;
    } else if (r.rank === 3) {         // ツーペア
      g.stars = 3; g.main = '2組 そろっているよ'; g.word = 'あと1枚 変われば フルハウス';
      g.score = 0.58;
    } else if (r.rank === 2) {         // ワンペア
      g.stars = 2; g.main = 'ペアが あるよ';
      g.word = f4 ? '同じマークも 4枚 あるよ' : '同じ数が 2枚。ここから 強く できるよ';
      g.score = 0.36 + (r.values[0] - 2) / 12 * 0.12;
    } else if (f4) {
      g.stars = 2; g.main = '同じマークが 4枚'; g.word = 'あと1枚で フラッシュだよ';
      g.score = 0.30;
    } else if (s4) {
      g.stars = 2; g.main = '数が 4つ ならんでいるよ'; g.word = 'あと1枚で ストレートだよ';
      g.score = 0.26;
    } else {
      g.stars = 1; g.main = 'ばらばら'; g.word = 'まだ そろっていないよ';
      g.score = 0.06 + (r.best[0].value - 2) / 12 * 0.12;
    }
    g.score = Math.max(0.02, Math.min(0.97, g.score));
    return g;
  }

  /* ※ 手札の目安 ★ の 画面表示（guideNow）は T53 で 撤去した。
     drawGuide 自体は ロボットと けんしょうの 打ち手が 使うので 残っている。 */

  /* ============================================================
     ★★ ロボットの 考え ―― 強さ 3段階（骨組みは ホールデムの T43）
     ------------------------------------------------------------
     ちがいは 2つ（T47 §8）：
       ・「場の あぶなさ」の かわりに「相手の 取りかえ枚数」を 読む
       ・新しい 判断「何を すてるか」（cpuSwapKeys）
     ============================================================ */
  var RANK_BASE = [0, 0.10, 0.38, 0.58, 0.74, 0.84, 0.89, 0.93, 0.97, 0.99, 1.00];
  var STREET_K = [0.95, 1.08];    // かけ①／かけ②（あとの ほうが 手が きまっている）

  function madeStrength(hand) {
    var r = PC.evaluate(hand);
    if (!r) return 0.1;
    var s = RANK_BASE[r.rank] + (r.best[0].value - 2) / 12 * 0.05;
    return Math.max(0, Math.min(1, s));
  }

  function cpuStrength(p) {
    var key = state.handNo + ':' + state.street + ':' + (p.swapped ? 1 : 0);
    if (p.sKey === key) return p.sVal;
    p.sKey = key;
    p.sVal = (state.street === 0 && !p.swapped) ? drawGuide(p.hole).score : madeStrength(p.hole);
    return p.sVal;
  }

  /* ★「場の あぶなさ」の ドロー版 ＝ 相手の 取りかえ枚数（0〜0.35・T47 §8）
     0枚 ＝ いちばん こわい／1枚 ＝ こわい／2枚 ＝ すこし。かけ②でしか 分からない。 */
  function swapDanger(idx) {
    if (state.street < 1) return 0;
    var d = 0;
    state.players.forEach(function (q, i) {
      if (i === idx || q.folded || q.swapCount == null) return;
      if (q.swapCount === 0) d += 0.16;
      else if (q.swapCount === 1) d += 0.09;
      else if (q.swapCount === 2) d += 0.04;
    });
    return Math.min(0.35, d);
  }

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

  /* 3つの 性格（数字は ホールデム T43 の まま。じくの 意味だけ 差しかえ） */
  var BRAINS = {
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
    strong: {
      useDanger: true, dangerWeight: 0.80,
      foldLine: 0.42, oddsWeight: 0.55,
      raiseLine: 0.62, raiseChance: 0.60,
      allInLine: 0.80,
      betChance: function (s) { return s > 0.58 ? 0.66 : (s > 0.44 ? 0.20 : 0); },
      size: function (s) { return s > 0.80 ? 0.8 : 0.6; },
      jamLine: 0.93, slowLine: 0.93,
      bluff: function (s, idx) {
        /* うそは かけ②だけ・相手が 1〜2人で よく 降りる人の とき（T47 §8） */
        if (s > 0.44 || state.street < 1 || liveCount(idx) > 2) return 0;
        return 0.08 + foldyAround(idx) * 0.30;
      }
    }
  };

  function cpuRaiseTo(p, s, B) {
    var lo = Math.min(minRaiseTo(), maxRaiseTo(p));
    var hi = maxRaiseTo(p);
    var to = state.toCall + Math.round(Math.max(state.pot, BIG_BET) * B.size(s));
    if (s > B.jamLine && Math.random() < 0.25) to = hi;
    return Math.min(Math.max(to, lo), hi);
  }

  function decideAction(p, B, idx) {
    var k = STREET_K[state.street] || 1;
    var need = needOf(p);
    var canR = canRaise(p) && p.raises < CPU_MAX_RAISE && maxRaiseTo(p) >= minRaiseTo();

    var s = cpuStrength(p);
    var want = B.useDanger ? (s - swapDanger(idx) * B.dangerWeight) : s;
    want = Math.max(0, Math.min(1, want + (Math.random() - 0.5) * 0.06));

    if (need === 0) {
      var bc = B.betChance(want, idx) + B.bluff(want, idx);
      if (canR && Math.random() < bc) return { act: 'raise', to: cpuRaiseTo(p, want, B) };
      return { act: 'check' };
    }

    var odds = need / (state.pot + need);
    var line = (B.foldLine + odds * B.oddsWeight) * k;
    if (want < line) return { act: 'fold' };
    if (need >= p.coins && want < B.allInLine * k) return { act: 'fold' };
    if (canR && want > B.raiseLine * k && Math.random() < B.raiseChance) {
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

  /* ★ ロボットの「何を すてるか」（T47 §8・強さで 分ける）
       弱い   … 役の中心の 札を 残して、あとは 全部 すてる（いちばん 素直な 打ち方）
       ふつう … ＋ あと1枚の フラッシュ・ストレートが あれば、そちらを ねらう ことがある
       つよい … ＋ たまに 取りかえないで 強いふり（0枚の ブラフ）／
                ペアと 大きい1枚を 残して 2枚だけ かえる（枚数で 手を 読ませない） */
  function cpuSwapKeys(p, idx) {
    var g = drawGuide(p.hole);
    var r = g.result;
    var core = coreKeysOf(r);
    var lvl = CPUS[state.cpu] ? state.cpu : 'normal';
    var dropRest = p.hole.filter(function (c) { return core.indexOf(c.key) < 0; })
                         .map(function (c) { return c.key; });

    if (lvl === 'weak') return dropRest;

    /* あと1枚の フラッシュ・ストレート（ふつう・つよい） */
    if (r.rank <= 2 && g.draw) {
      var chance = (lvl === 'strong') ? 0.7 : (g.draw.type === 'flush' ? 0.6 : 0.45);
      if (Math.random() < chance) {
        return p.hole.filter(function (c) { return g.draw.keep.indexOf(c.key) < 0; })
                     .map(function (c) { return c.key; });
      }
    }

    if (lvl === 'strong') {
      /* 0枚の ブラフ ―― 相手が 少なく、よく 降りる人の ときだけ（T47 §2-3・§8） */
      if (r.rank <= 2 && liveCount(idx) <= 2 && Math.random() < 0.06 + foldyAround(idx) * 0.15) {
        return [];
      }
      /* ペア＋大きい1枚を 残して 2枚 ―― 3枚がえ＝ワンペアと 読まれるのを ずらす */
      if (r.id === 'onePair') {
        var others = p.hole.filter(function (c) { return core.indexOf(c.key) < 0; })
                           .sort(function (a, b) { return b.value - a.value; });
        if (others.length === 3 && others[0].value >= 13 && Math.random() < 0.3) {
          return [others[1].key, others[2].key];
        }
      }
    }

    return dropRest;
  }

  /* ============================================================
     役を 出す（判定は ぜんぶ PokerCore）
     ============================================================ */
  function recalc() {
    var list = myHand();
    state.result = (list.length === 5) ? PC.evaluate(list) : null;
  }

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
  function cardHTML(card, extraClass, withKey) {
    var label = card.ja + 'の' + card.rank;
    return '<div class="card ' + card.color + ' ' + (extraClass || '') + '"'
      + (withKey ? ' data-key="' + card.key + '"' : '')
      + ' role="img" aria-label="' + label + '">'
      + '<span class="fallback">'
      +   '<span class="corner tl">' + card.rank + '<i>' + card.mark + '</i></span>'
      +   '<span class="pip">' + card.mark + '</span>'
      + '</span>'
      + '<img class="face-img" src="' + cardSrc(card.file) + '" alt="" draggable="false" decoding="async"'
      + ' onload="this.parentNode.classList.add(\'img-ok\')"'
      + ' onerror="this.parentNode.classList.add(\'img-failed\');this.remove()">'
      + '</div>';
  }

  /* ※ 役の中心の 光り（is-used／is-dim）は T53 で 撤去した。
     すてる札の 選択（is-pick）と 見た目が 混ざる、が 社長の 指摘。
     強調は 画面に 1種類だけ（設計図 §5.5「二層設計の上限」）。
     役の中心の 計算（coreKeysOf）は ロボットと 警告1行が 今も 使う。 */

  /* ★ 取りかえ枚数バッジ（T47 §6-5）―― ハンドが 終わるまで 消えない */
  function swapBadgeHTML(p) {
    if (p.swapCount == null) return '<p class="seat-swap">&nbsp;</p>';
    if (p.swapCount === 0) return '<p class="seat-swap is-zero">取りかえなかった！</p>';
    return '<p class="seat-swap">' + p.swapCount + '枚 取りかえた</p>';
  }

  function renderSeats() {
    var caps = capsNow();
    var html = state.players.map(function (p, i) {
      if (p.me) return '';
      var active = (state.turn === i && !p.folded)
        && ((state.phase === 'bet' && !p.allIn) || (state.phase === 'swap' && !p.swapped));
      var cls = 'seat'
        + (p.folded ? ' is-folded' : '')
        + (active ? ' is-turn' : '');

      /* 手札は ずっと 伏せたまま（開くのは 下の 勝負の わく・席では 5枚 入らない） */
      var cardsHTML = p.folded ? ''
        : (p.hole || []).map(function () { return '<span class="seat-back"></span>'; }).join('');

      var capLine = '';
      if (caps && p.allIn && !p.folded && caps[i] < state.pot) capLine = caps[i] + 'まで もらえる';

      return '<div class="' + cls + '">'
        + '<p class="seat-name">🤖 ' + p.name
        +   (state.dealer === i ? '<span class="btn-mark" title="親">🔘</span>' : '')
        + '</p>'
        + '<div class="seat-cards">' + cardsHTML + '</div>'
        + swapBadgeHTML(p)
        + '<p class="seat-coin">コイン ' + p.coins + '</p>'
        + '<p class="seat-bet">' + (p.bet > 0 ? '出した ' + p.bet : '&nbsp;') + '</p>'
        + '<p class="seat-last">' + (capLine || p.last || '&nbsp;') + '</p>'
        + '</div>';
    }).join('');
    $('seats').innerHTML = html;
  }

  function renderMeInfo() {
    var p = state.players[0];
    if (!p) return;
    var caps = capsNow();
    var capLine = (caps && p.allIn && !p.folded && caps[0] < state.pot) ? caps[0] + 'まで もらえる' : '';
    var swapTag = '';
    if (p.swapCount != null) {
      swapTag = p.swapCount === 0
        ? '<span class="me-tag is-swap-zero">取りかえなかった！</span>'
        : '<span class="me-tag">取りかえ ' + p.swapCount + '枚</span>';
    }
    $('meInfo').innerHTML =
        '<span class="me-coin">コイン ' + p.coins + '</span>'
      + (state.dealer === 0 ? '<span class="me-tag btn-mark">🔘 親</span>' : '')
      + (p.bet > 0 ? '<span class="me-tag">出した ' + p.bet + '</span>' : '')
      + swapTag
      + (capLine ? '<span class="me-tag">' + capLine + '</span>' : '')
      + (p.folded ? '<span class="me-tag is-out">降りた</span>' : '')
      + (p.last && !p.folded ? '<span class="me-tag">' + p.last + '</span>' : '');
    $('tape').textContent = state.handNo + 'ハンドめ ・ コイン ' + p.coins
      + '　最高 ' + state.best;
  }

  function renderPot() {
    $('pot').textContent = 'ポット ' + state.pot;
  }

  /* テーブルの まん中（山札の のこり・すてた札の 数）。
     すてた札の 数字が へらない ＝ 山に もどっていない、が 目でも 分かる。 */
  function renderDeck() {
    $('deckRow').innerHTML =
        '<span class="deck-back" aria-hidden="true"></span>'
      + '<span class="deck-note">山札 のこり ' + state.deck.length + '枚'
      + (state.discardKeys.length ? '　・　すてた札 ' + state.discardKeys.length + '枚' : '')
      + '</span>';
  }

  function stageIndex() {
    if (state.phase === 'end' || state.phase === 'over') return 4;
    if (state.phase === 'swap') return 2;
    if (state.phase === 'demo') return 1;
    return state.street === 0 ? 1 : 3;
  }

  function renderSteps() {
    var idx = stageIndex();
    $('steps').innerHTML = STAGE_LABELS.map(function (l, i) {
      var cls = 'step' + (i === idx ? ' now' : '') + (i < idx ? ' passed' : '') + (i === 4 ? ' end' : '');
      return '<span class="' + cls + '">' + l + '</span>';
    }).join('<span class="step-line" aria-hidden="true"></span>');
    $('stageChip').textContent = STAGE_LABELS[idx];
  }

  /* ※「今の役」の 名札（renderHandName）と 目安★の 表示は T53 で 撤去した。
     役の 名前は 勝負の わく（renderShowdown）と 役の一覧の 印で 分かる。 */

  /* ============================================================
     ★ 役の強さの一覧（T49 🟡2・公開前の 宿題）
     ------------------------------------------------------------
     ・中身は PokerCore.HANDS から 自動で 作る（手書きの 一覧は 作らない。
       HANDS は 強い順に ならんでいるので、その順の まま 出す）
     ・どの 場面でも ボタンで 開ける（名札の すぐ下・ゲームは 止めない）
     ・今の 自分の役の 行に 印を つける（一覧の 中の「今どこか」）
     ・めくりの さいちゅうは 印を つけない（答えが 先に 見えて しまう ため）
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
    var nowId = (state.result && !state.reveal) ? state.result.id : '';
    Array.prototype.forEach.call($('ranksList').children, function (li) {
      var isMe = li.dataset.hand === nowId;
      li.classList.toggle('is-me', isMe);
      if (isMe) li.setAttribute('aria-current', 'true');
      else li.removeAttribute('aria-current');
    });
  }

  /* ★ 勝負の 決着 ―― 5枚くらべ ＋ ▲ ＋ 取りかえ枚数（T47 §6-6） */
  function renderShowdown() {
    var box = $('showdownBox');

    if (state.phase === 'bet' || state.phase === 'swap' || state.phase === 'demo' || !state.rows.length) {
      box.classList.add('hidden');
      return;
    }

    $('sdLead').textContent = state.endNote;

    $('sdRows').innerHTML = state.rows.map(function (r) {
      var swapNote = (r.swapCount == null) ? ''
        : (r.swapCount === 0 ? '取りかえ 0枚' : '取りかえ ' + r.swapCount + '枚');
      if (r.folded) {
        return '<div class="sd-row is-out">'
          + '<p class="sd-out">' + (r.me ? 'あなた' : r.name) + '　降りた'
          + (swapNote ? '<small class="sd-swap">' + swapNote + '</small>' : '') + '</p>'
          + '</div>';
      }
      var def = PC.HAND_BY_ID[r.hand.id];
      var cards = r.hand.best.map(function (c, i) {
        var mark = (i === r.markIdx) ? '▲' : '';
        return '<span class="sd-slot">'
          + cardHTML(c, 'is-mini' + (i === r.markIdx ? ' is-deciding' : ''))
          + '<span class="sd-arrow">' + mark + '</span>'
          + '</span>';
      }).join('');

      return '<div class="sd-row' + (r.win ? ' is-win' : '') + '">'
        + '<p class="sd-head">'
        +   '<span class="sd-who">' + (r.win ? '👑 ' : '') + (r.me ? 'あなた' : r.name) + '</span>'
        +   '<span class="sd-hand">' + def.name + '<small>' + def.short + '</small></span>'
        +   (swapNote ? '<span class="sd-swap">' + swapNote + '</span>' : '')
        +   '<span class="sd-gain' + (r.gain ? '' : ' is-zero') + '">'
        +     (r.gain ? '＋' + r.gain : '±0') + '</span>'
        + '</p>'
        + '<div class="sd-cards">' + cards + '</div>'
        + (r.markText ? '<p class="sd-mark">▲ ' + r.markText + '</p>' : '')
        + '</div>';
    }).join('');

    var s = state.settle;
    $('sdPots').textContent = (s && s.pots.length > 1)
      ? 'ポットは ' + s.pots.length + 'つに 分かれたよ（コインが 足りない人が いたため）'
      : '';

    box.classList.remove('hidden');
  }

  function renderOver() {
    var box = $('overBox');
    if (state.phase !== 'over') { box.classList.add('hidden'); return; }
    $('overNote').textContent =
      state.handNo + 'ハンド 遊べたよ。最高は ' + state.best + '枚';
    box.classList.remove('hidden');
  }

  /* えらんだ 中に 役の中心が 入っているか（警告1行の もと・T47 §6-4） */
  function coreSelected() {
    if (!state.result || !state.selected.length) return false;
    var core = coreKeysOf(state.result);
    return state.selected.some(function (k) { return core.indexOf(k) >= 0; });
  }

  function renderHappy() {
    var me = state.players[0], r = state.result, msg;
    var myRow = state.rows.filter(function (x) { return x.me; })[0];

    if (state.phase === 'demo')       msg = 'これは 見本だよ';
    else if (state.phase === 'over')  msg = 'また あそぼうね';
    else if (state.phase === 'end') {
      if (!state.settle && me && me.gain > 0)      msg = '見せないで勝った！ かっこいい';
      else if (state.split && myRow && myRow.win)  msg = '引き分け。コインを 分けたよ';
      else if (me && me.gain > 0)                  msg = 'やったー！ コイン ' + me.gain + '枚！';
      else                                         msg = 'つぎ がんばろ！';
    }
    else if (state.reveal)            msg = 'どうなるかな…';
    else if (state.awaitSwap) {
      if (coreSelected()) {
        /* ★ すてまちがいの 警告 ―― 止めない・事実だけ（わざと 崩す 道も あるため）。
           ハイカードは「役なし」なので「役の札」とは 言わない（T49 🔵1）。 */
        if (r && r.id === 'highCard')                              msg = '一番強い札を すてようとしてるよ。いいの？';
        else if (r && (r.id === 'onePair' || r.id === 'twoPair')) msg = 'ペアの札を すてようとしてるよ。いいの？';
        else                                                       msg = '役の札を すてようとしてるよ。いいの？';
      }
      else if (!state.selected.length) msg = 'どれを のこす？ そのままでも いいよ';
      else msg = 'すてたら 同じ枚数 引くよ';
    }
    else if (state.flashHappy)        msg = state.flashHappy;
    else if (state.phase === 'swap')  msg = 'だれが 何枚 かえるかな';
    else if (me && me.folded)         msg = 'つぎ いこう！';
    else if (!r)                      msg = 'どんなカード？';
    else if (state.street === 1)      msg = '相手の 取りかえ枚数も 見てみよう';
    else if (r.rank >= 4)             msg = 'やった！ 強い手だ！';
    else                              msg = 'いらない札は どれかな？';
    $('happyBubble').textContent = msg;
  }

  function log(text) {
    state.logs.push(text);
    if (state.logs.length > 40) state.logs.shift();
    if (state.fast) return;
    var last = state.logs.slice(-3);
    $('tableLog').innerHTML = last.map(function (t, i) {
      return '<span class="log-line' + (i === last.length - 1 ? ' now' : '') + '">' + t + '</span>';
    }).join('');
  }

  /* ============================================================
     自分の手札（タップで えらべる・大富豪の 型・T47 §5-1）
     ============================================================ */
  function renderHand() {
    var reveal = state.reveal;
    $('hand').innerHTML = myHand().map(function (c) {
      if (reveal) {
        var ri = reveal.keys.indexOf(c.key);
        if (ri >= 0 && ri >= reveal.shown) {
          return '<div class="card is-back-me" aria-label="うら向きの札"></div>';
        }
      }
      /* T53：光り（is-used／is-dim）は 付けない。強調は「すてる」の 選択だけ */
      var cls = (state.awaitSwap && state.selected.indexOf(c.key) >= 0) ? 'is-pick' : '';
      return cardHTML(c, cls, true);
    }).join('');
  }

  /* ============================================================
     ★ かけの ボタン ＋ 取りかえの パネル
     ============================================================ */
  var raiseOpen = false;
  var addValue = 0;   // T58：入力欄の 数字 ＝ コールの 上に 足す 枚数

  function renderActions() {
    var box = $('actButtons'), panel = $('raisePanel'), swapPanel = $('swapPanel'), note = $('turnNote');
    var me = state.players[0];

    /* ── 取りかえフェーズ ── */
    if (state.phase === 'swap') {
      box.innerHTML = '';
      panel.classList.add('hidden');
      raiseOpen = false;
      $('btnNextHand').classList.add('hidden');
      if (state.awaitSwap) {
        var n = state.selected.length;
        swapPanel.innerHTML =
            '<p class="swap-title">いらない札を えらんでね（0〜5枚・1回だけ）</p>'
          + '<button type="button" class="swap-btn" id="btnSwap">'
          +   (n ? n + '枚 取りかえる ▶' : '取りかえない（そのまま）▶')
          + '</button>';
        swapPanel.classList.remove('hidden');
        note.classList.add('hidden');
      } else {
        swapPanel.classList.add('hidden');
        var who = state.players[state.turn];
        note.textContent = state.reveal ? '引いた札を めくっているよ…'
          : (who && !who.me ? who.name + 'が 取りかえ中…' : '取りかえ中…');
        note.classList.remove('hidden');
      }
      return;
    }
    swapPanel.classList.add('hidden');

    if (state.phase !== 'bet' || !me) {
      box.innerHTML = '';
      panel.classList.add('hidden');
      note.classList.add('hidden');
      $('btnNextHand').classList.toggle('hidden', state.phase !== 'end');
      return;
    }
    $('btnNextHand').classList.add('hidden');

    if (!state.awaitMe) {
      box.innerHTML = '';
      panel.classList.add('hidden');
      raiseOpen = false;
      var who2 = state.players[state.turn];
      note.textContent = me.folded
        ? '見ているところ ―― ' + (who2 ? who2.name + 'の 番' : '')
        : (who2 ? who2.name + 'が 考えているよ…' : '');
      note.classList.remove('hidden');
      return;
    }
    note.classList.add('hidden');

    /* T53（社長裁定）：カタカナ主表記 ＋ 下に 小さく 日本語（§9.6の 例外リスト） */
    var need = needOf(me);
    var html = '';

    html += btn('fold', 'フォールド', '降りる', 'is-fold');

    if (need === 0) {
      html += btn('check', 'チェック', 'パスする', '');
    } else if (need < me.coins) {
      html += btn('call', 'コール ' + need, 'みんなと合わせる', 'is-call');
    }

    if (canRaise(me) && maxRaiseTo(me) >= myMinRaiseTo()) {
      html += btn('raise', 'レイズ ▾', 'かけ金を上げる', 'is-raise');
    }

    html += btn('allin', 'オールイン', '全部かける（' + me.coins + '枚）', 'is-allin');

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
      ? 'コール ' + call + ' ＋ 上乗せ ' + add + ' ＝ ぜんぶで ' + total + '枚'
      : 'ぜんぶで ' + total + '枚 かける';
    if (me.bet > 0) line += ' ／ いま出すのは ' + (total - me.bet) + '枚';
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

  /* T53：持っている コインを ボタン群の すぐ上に（社長指示） */
  function renderActCoins() {
    var me = state.players[0];
    if (me) $('actCoins').textContent = 'コイン ' + me.coins + '枚';
  }

  function render() {
    recalc();
    if (state.fast) return;
    renderSeats();
    renderMeInfo();
    renderPot();
    renderDeck();
    renderHand();
    renderSteps();
    renderRanks();
    renderShowdown();
    renderOver();
    renderHappy();
    renderActCoins();
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

  /* ★ 手札を タップして「すてる」を えらぶ（取りかえの 番だけ） */
  $('hand').addEventListener('click', function (e) {
    if (!state.awaitSwap) return;
    var el = e.target.closest ? e.target.closest('.card[data-key]') : null;
    if (!el) return;
    var key = el.dataset.key;
    var at = state.selected.indexOf(key);
    if (at >= 0) state.selected.splice(at, 1);
    else state.selected.push(key);
    render();
  });

  /* ★ 取りかえの 決定ボタン（0枚も 正しい 選択・T47 §5-2） */
  $('swapPanel').addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('#btnSwap') : null;
    if (!b) return;
    submitSwap(state.selected.slice());
  });

  /* ※ 設定パネル（modeRow／cpuRow／guideRow）の 聞き耳は T53 で 撤去した */

  $('btnNextHand').addEventListener('click', function () { startHand(); });
  $('btnRestart').addEventListener('click', function () { restart(); });

  /* ★ 役の強さの一覧の 開け閉め（どの 場面でも 押せる。ゲームは 止めない） */
  $('btnRanks').addEventListener('click', function () {
    ranksOpen = !ranksOpen;
    renderRanks();
  });

  /* ============================================================
     ★ 仕込み口（社長・アトが 見本を 出すための 口）
     ------------------------------------------------------------
       POKER.setup('s7 h7 sK s4 s2')   ← 自分の 5枚を 仕込む（役の たしかめ）
       POKER.demo('まよう手')
       POKER.play()                    ← ゲームに もどる（新しい ハンド）
     カードの 書き方は poker-core.js と おなじ：
       s＝スペード h＝ハート d＝ダイヤ c＝クローバー ／ A 2〜10 J Q K
     ============================================================ */
  var DEMOS = {
    'ワンペア':   { hand: 's7 h7 cK d4 c2',
                    why: '役の中心は ペアの 7（coreOf で たしかめられる）' },
    'まよう手':   { hand: 's7 h7 sK s4 s2',
                    why: 'ペアが あるが ♠が4枚 ―― フラッシュを ねらう 道もある（§6-3の 例）' },
    'ツーペア':   { hand: 'sQ hQ d4 c4 h9',
                    why: '役の中心は 2組の 4枚。9だけ すてる候補' },
    'フルハウス': { hand: 's8 h8 d8 sK hK',
                    why: '5枚 全部が 役 ＝ 取りかえないのが 基本' },
    'ハイカード': { hand: 'sA h9 d7 c4 s2',
                    why: '役の中心は 一番強い A だけ' }
  };

  function dealFixed(spec) {
    clearTimers();
    var mine = spec ? PC.cards(spec) : [];
    var used = mine.map(function (c) { return c.key; });
    var deck = PC.shuffle(PC.createDeck().filter(function (c) { return used.indexOf(c.key) < 0; }));
    while (mine.length < 5) mine.push(deck.shift());

    state.phase = 'demo';
    state.awaitMe = false;
    state.awaitSwap = false;
    state.reveal = null;
    state.selected = [];
    state.players[0].hole = mine.slice(0, 5);
    for (var i = 1; i < SEATS; i++) state.players[i].hole = PC.draw(deck, 5);
    state.deck = deck;
    state.discardKeys = [];
    log('見本を 出しているよ（かけは 止まっています）。「新しい ハンド」で 続きへ');
    render();
  }

  function demo(name) {
    var d = DEMOS[name];
    if (!d) { console.log('見本の 名前：', Object.keys(DEMOS).join(' / ')); return null; }
    dealFixed(d.hand);
    return name + '：' + d.why;
  }

  /* ============================================================
     ★ 自動で まわして たしかめる（けんしょう用・ホールデムの autoPlay の ドロー版）
     ------------------------------------------------------------
     見るもの：
       ・コインの 合計が いつも 一定（checkCoins が 全部の 節目で 見ている）
       ・とちゅうで 止まらない
       ・すてた札が 山に もどらない（doSwap の 中の けんしょう）
       ・取りかえ 0枚／5枚 も ちゃんと 起きる
     ============================================================ */
  function autoPlay(n, opts) {
    n = n || 100;
    opts = opts || {};
    var wasFast = state.fast, wasMode = state.mode, wasCpu = state.cpu;
    state.fast = true;
    if (CPUS[opts.cpu]) state.cpu = opts.cpu;
    clearTimers();
    var before = state.errors.length;
    var swapBefore = state.statSwap.slice();
    var stuck = 0, folds = 0, shows = 0, splits = 0, sides = 0, odds = 0, overs = 0;
    var modes = ['easy', 'normal', 'full'];

    for (var h = 0; h < n; h++) {
      state.mode = MODES[opts.mode] ? opts.mode : modes[h % 3];
      startHand();
      var guard = 0;
      while ((state.phase === 'bet' || state.phase === 'swap') && guard++ < 800) {
        if (state.awaitMe) randomMyAction();
        else if (state.awaitSwap) randomMySwap();
        else break;
      }
      if (state.phase === 'bet' || state.phase === 'swap') { stuck++; break; }
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
    var swapNow = state.statSwap.map(function (v, i) { return v - swapBefore[i]; });
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
      取りかえ枚数の内わけ: '0枚:' + swapNow[0] + ' 1枚:' + swapNow[1] + ' 2枚:' + swapNow[2]
        + ' 3枚:' + swapNow[3] + ' 4枚:' + swapNow[4] + ' 5枚:' + swapNow[5],
      コイン合計: total + state.pot,
      配ったコインの合計: state.injected,
      合っているか: (total + state.pot === state.injected) ? 'OK' : 'ちがう',
      あたらしいエラー: state.errors.slice(before)
    };
    console.log('[POKER] autoPlay', out);
    render();
    return out;
  }

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
    if (need >= me.coins) { doAllIn(0); return; }
    if (r < 0.85 || !canRaise(me)) { doCall(0); return; }
    doRaise(0, pickRaiseTo(me));
  }

  /* 取りかえも でたらめに（0〜5枚。0枚と 5枚の 道も かならず 通る） */
  function randomMySwap() {
    var me = state.players[0];
    var n = Math.floor(Math.random() * 6);
    var keys = PC.shuffle(me.hole.slice()).slice(0, n).map(function (c) { return c.key; });
    submitSwap(keys);
  }

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
     ★★ 強さを 数で たしかめる（ホールデム T43 の 道具立てを 引き継ぎ）
     ------------------------------------------------------------
     計る ときの 打ち手（HUMAN）は ドロー用に 作り直した（T47 §8）：
       ・見るのは 画面が 出している ことだけ ―― 手札の目安の 数（drawGuide）と
         役の 段、ポットに 対して いくら 出すか
       ・取りかえは「役の中心の 札を 残して あとは すてる」（いちばん 素直な 打ち方）
       ・うそなし。相手の 取りかえ枚数も 読まない
       ＝ ふつうロボットから「枚数を 読む力」だけ 引いたもの。
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

  /* HUMAN の 取りかえ ＝ 役の中心を 残す（あと1枚の フラッシュは ねらう） */
  function humanSwap() {
    var me = state.players[0];
    var g = drawGuide(me.hole);
    var keys;
    if (g.result.rank <= 2 && g.draw && g.draw.type === 'flush') {
      keys = me.hole.filter(function (c) { return g.draw.keep.indexOf(c.key) < 0; })
                    .map(function (c) { return c.key; });
    } else {
      var core = coreKeysOf(g.result);
      keys = me.hole.filter(function (c) { return core.indexOf(c.key) < 0; })
                    .map(function (c) { return c.key; });
    }
    submitSwap(keys);
  }

  function benchOne(n, level) {
    state.cpu = level;
    makePlayers();
    state.injected = SEATS * START_COINS;
    state.dealer = -1; state.handNo = 0; state.pot = 0; state.best = START_COINS;
    var me = state.players[0];
    var errBefore = state.errors.length;
    var profit = 0, plus = 0, minus = 0, even = 0, tookPot = 0, shows = 0, refills = 0, stuck = 0;

    for (var h = 0; h < n; h++) {
      if (me.coins <= 0) refills++;
      startHand();
      var c0 = me.coins + me.put;
      var guard = 0;
      while ((state.phase === 'bet' || state.phase === 'swap') && guard++ < 800) {
        if (state.awaitMe) humanAction();
        else if (state.awaitSwap) humanSwap();
        else break;
      }
      if (state.phase === 'bet' || state.phase === 'swap') { stuck++; break; }
      var d = me.coins - c0;
      profit += d;
      if (d > 0) plus++; else if (d < 0) minus++; else even++;
      if (me.gain > 0) tookPot++;
      if (state.settle) shows++;
      if (state.phase === 'over') state.phase = 'end';
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
      'コインが0に なった回数': refills,
      とちゅうで止まった: stuck,
      コイン合計: total + state.pot,
      配ったコインの合計: state.injected,
      合っているか: (total + state.pot === state.injected && state.errors.length === errBefore) ? 'OK' : 'ちがう',
      あたらしいエラー: state.errors.slice(errBefore)
    };
  }

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
    console.log('[POKER] bench', out);
    return out;
  }

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
    console.log('[POKER] matrix', out);
    return out;
  }

  window.POKER = {
    setup: function (spec) { dealFixed(spec); return window.POKER.now(); },
    demo: demo,
    demos: function () { return Object.keys(DEMOS); },
    play: startHand,
    deal: startHand,
    autoPlay: autoPlay,
    bench: bench,
    matrix: matrix,
    seed: seed,
    checkCoins: function () { checkCoins('手で しらべた'); return { エラー: state.errors.slice(-5), 合計: state.injected }; },
    mode: function (m) { if (MODES[m]) { state.mode = m; raiseOpen = false; render(); } return state.mode; },
    cpu: function (c) { if (CPUS[c]) { state.cpu = c; render(); } return state.cpu; },
    cpus: function () { return Object.keys(CPUS); },
    guideOf: function (spec) { var g = drawGuide(spec ? PC.cards(spec) : myHand()); return '★' + g.stars + '　' + g.main + '　' + g.word; },
    /* ★ 役の中心の こたえ合わせ（ロボットの 取りかえと 警告1行が 見ている もと） */
    coreOf: function (spec) {
      var r = PC.evaluate(spec ? PC.cards(spec) : myHand());
      if (!r) return null;
      return { 役: PC.HAND_BY_ID[r.id].name, 役の中心: coreKeysOf(r), それ以外: r.input
        .map(function (c) { return c.key; })
        .filter(function (k) { return coreKeysOf(r).indexOf(k) < 0; }) };
    },
    state: state,
    now: function () {
      var r = state.result;
      return {
        ハンド: state.handNo,
        場面: STAGE_LABELS[stageIndex()],
        親: state.players[state.dealer] ? state.players[state.dealer].name : '',
        ポット: state.pot,
        山札: state.deck.length + '枚',
        すてた札: state.discardKeys.length + '枚',
        コイン: state.players.map(function (p) { return p.name + ':' + p.coins + (p.folded ? '(降りた)' : ''); }),
        取りかえ: state.players.map(function (p) { return p.name + ':' + (p.swapCount == null ? 'まだ' : p.swapCount + '枚'); }),
        いまの番: state.players[state.turn] ? state.players[state.turn].name : '',
        手札: myHand().map(function (c) { return c.ja + c.rank; }),
        役: r ? PC.HAND_BY_ID[r.id].name : '（まだ）',
        中身: handDetail(r),
        役の中心: r ? coreKeysOf(r) : [],
        決着: state.endNote || '（まだ）',
        最高記録: state.best,
        ゲームオーバー: state.phase === 'over'
      };
    }
  };

  /* ============================================================
     たしかめ用ボタン（作る人むけ）
     ============================================================ */
  $('btnPlay').addEventListener('click', startHand);
  document.querySelectorAll('[data-demo]').forEach(function (b) {
    b.addEventListener('click', function () { console.log('[POKER] demo', demo(b.dataset.demo)); });
  });

  /* ============================================================
     はじめる
     ============================================================ */
  /* T53：おぼえるのは 最高記録だけ（かけ方・強さ・目安の 設定は 撤去した） */
  var savedBest = null;
  try { savedBest = localStorage.getItem('poker.best'); } catch (e) {}
  state.mode = 'full';       // かけ金は 1枚きざみに 一本化
  state.cpu = 'strong';      // ロボットは 常に「つよい」
  if (savedBest && +savedBest > START_COINS) state.best = +savedBest;

  buildRanks();     // 役の強さの一覧（HANDS から 1回だけ 作る）
  makePlayers();
  startHand();
})();
