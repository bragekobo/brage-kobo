/* ============================================================
   テキサス・ホールデム ― 第6段「手札の目安 ★」（T44）
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

  /* ───────── かけ方 3つ（T38 §7・二層設計の 軸）───────── */
  var MODES = {
    easy:   { label: 'かんたん', note: '金額は おまかせ' },
    normal: { label: 'ふつう ★', note: '3つから 選ぶ' },
    full:   { label: 'ぜんぶ',   note: '自分で 決める' }
  };
  var POT_STEPS = [
    { f: 0.5, label: '少し'   },
    { f: 1.0, label: 'ふつう' },
    { f: 2.0, label: 'たくさん' }
  ];

  /* ───────── ★ ロボットの 強さ 3つ（T38 §10）─────────
     ⚠️ かけ方（上）とは べつの じく。まぜない。
        かけ方 ＝ 自分の 操作の しやすさ ／ 強さ ＝ 相手の 手ごわさ。 */
  var CPUS = {
    weak:   { label: '弱い',     note: 'よく ついてくる' },
    normal: { label: 'ふつう ★', note: 'それなりに 降りる' },
    strong: { label: 'つよい',   note: 'よい手だけ 勝負' }
  };

  /* ───────── ★ 手札の目安（T38 §6-4・3つめの 設定）─────────
     ⚠️ これだけは 消せる。★の数は「答え」に 近いから（§6-4）。
        名札・光る5枚・進み具合バーは 事実の 表示なので 消せない。 */
  var GUIDES = {
    on:  { label: '出す ★',  note: 'はじめての人へ' },
    off: { label: '出さない', note: '自分で 見る' }
  };

  /* ───────── 今の ばめん ───────── */
  var state = {
    players: [],       // 4人。0番が 自分
    dealer: -1,        // 親マーク🔘の 席（ハンドごとに 1つ ずれる）
    handNo: 0,
    pot: 0,
    toCall: 0,         // この1回転で そろえる 額
    lastRaise: BIG_BET,// 直前に 上げられた ぶん（つぎの 最低 上げ額）
    turn: 0,
    phase: 'bet',      // 'bet' かけの とちゅう / 'end' ハンドが おわった /
                       // 'over' 自分の コインが 0（ゲームオーバー）/ 'demo' 見本
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
    cpu: 'normal',     // ★ ロボットの 強さ（weak / normal / strong）。初期は ふつう
    guide: 'on',       // ★ 手札の目安 ★（on / off）。初期は「出す」（T38 §1-3・§6-4）
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
  function commit(p, amount) {
    amount = Math.max(0, Math.min(Math.round(amount), p.coins));
    p.coins -= amount;
    p.bet   += amount;   // この1回転で 出したぶん
    p.put   += amount;   // このハンドで 出したぶん（合計）
    state.pot += amount;
    if (p.coins <= 0) { p.coins = 0; p.allIn = true; }
    checkCoins('コインを 出したあと');
    return amount;
  }

  /* コインが 勝手に 増えたり 減ったり していないか（けんしょうの かなめ） */
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
      p.sKey = ''; p.sVal = 0;     // 手の よさの おぼえ書き（同じ場面で 何度も 数えない ため）
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

    /* ★ コインが 0に なった人（T38 §4-6）
       ・ロボット … その場で 200枚 もらって 続ける（4人を たもつ ため。3人 → 2人 と
                    へると 1対1に なって、役が できないまま 終わる 別のゲームに なる）
       ・自分     … ここに 来る 前に ゲームオーバーの 画面で 止めている。
                    「コインを もらって もういちど」を 押した ときだけ ここを 通る。 */
    state.players.forEach(function (p) {
      if (p.coins <= 0) {
        p.coins = START_COINS;
        state.injected += START_COINS;        // 世の中に 足した ぶん（けいさんの つじつま用）
        log(p.me ? 'コインを 200まい もらって、もういちど！'
                 : p.name + 'が コインを もらって 戻ってきたよ');
      }
    });

    state.settle = null;
    state.rows = [];
    state.split = false;
    state.endNote = '';
    state.newBest = false;
    $('showdownBox').classList.add('hidden');
    $('overBox').classList.add('hidden');

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
      if (state.foldStats[i]) state.foldStats[i].hands++;
    });

    /* 配る（ジョーカーなし・52枚） */
    var deck = PC.shuffle(PC.createDeck());
    state.players.forEach(function (p) { p.hole = PC.draw(deck, 2); });
    state.board = PC.draw(deck, 5);
    syncStage2();

    log(state.handNo + 'ハンドめ。カードを配るよ');

    /* 小がけ・大がけ（親の 左から 順に）*/
    var sb = state.players[seatAt(state.dealer + 1)];
    var bb = state.players[seatAt(state.dealer + 2)];
    var paidS = commit(sb, SMALL_BET); sb.last = '小がけ ' + paidS;
    var paidB = commit(bb, BIG_BET);   bb.last = '大がけ ' + paidB;
    log(sb.name + 'が 小がけ ' + paidS + ' ／ ' + bb.name + 'が 大がけ ' + paidB);

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
    if (roundComplete()) { schedule(nextStreet, 620); render(); return; }

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
    /* 自分が 降りたあとは 早送り（T38 §4-4） */
    var base = 600 + Math.random() * 600;
    return state.players[0].folded ? base / 2 : base;
  }

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
    state.players.forEach(function (p) { p.put = 0; p.bet = 0; });
    checkCoins('勝負の あと');

    buildShowdownRows(res, entries);
    finishHand();
  }

  /* 画面に ならべる 1行ずつを 作る。
     ★ ならべるのは「つかった5枚」だけ（7枚は 出さない・§6-6）。
     ★ 役が 同じどうしの ときだけ、決め手の カードに ▲ を つける。 */
  function buildShowdownRows(res, entries) {
    /* 👑 と 金色わくは「ポットを 1つでも とった人」に つける。
       ⚠️ いちばん 強い人 とは かぎらない ―― サイドポットが あると、
          弱い役でも 上の ポットを とることが あるため（§5-5）。 */
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
        folded: false, markIdx: -1, markText: ''
      };
    });

    /* ▲「ここで 勝った／負けた」 ―― キッカーという 言葉の かわり（§2-5・§6-6） */
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

    /* 降りた人は 手札を 開かない（§6-6：開くのは 残った人だけ） */
    entries.forEach(function (e) {
      if (!e.folded) return;
      rows.push({
        seat: e.id, name: state.players[e.id].name, me: state.players[e.id].me,
        hand: null, place: 0, win: false, gain: res.payouts[e.id] || 0,
        folded: true, markIdx: -1, markText: ''
      });
    });

    state.rows = rows;

    /* 見出しの 1行 */
    var top = rows.filter(function (r) { return r.top; })[0];
    var me = rows.filter(function (r) { return r.me && !r.folded; })[0];
    var def = top ? PC.HAND_BY_ID[top.hand.id] : null;
    /* 「引き分け」は ポットを 分けあった ときだけ 言う。
       サイドポットで 2人が べつべつの ポットを とったのは 引き分けでは ない。 */
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
      log('最高記録！ コイン ' + state.best);
    }

    /* ★ 自分の コインが 0 ―― ここで 止める（T38 §4-6） */
    if (me.coins <= 0) {
      state.phase = 'over';
      log('ゲームオーバー ―― ' + state.handNo + 'ハンド 遊べたよ。最高は ' + state.best + 'まい');
    }
    render();
  }

  /* 「コインを もらって もういちど」―― 200枚から やり直す */
  function restart() {
    if (state.players[0].coins > 0) { startHand(); return; }
    startHand();     // startHand の 中で 0の人に 200枚 わたす
  }

  /* 1人だけ 残った → その場で 決着（見せずに もらえる・T38 §4-3）
     ⚠️ カードは 見せない。ここが ポーカーで いちばん かっこいい 勝ち方（§4-3）。 */
  function finishByFold() {
    var winner = livePlayers()[0];
    var won = state.pot;
    winner.coins += won;
    winner.gain = won;
    state.pot = 0;
    state.players.forEach(function (p) { p.put = 0; p.bet = 0; if (p !== winner) p.gain = 0; });
    state.phase = 'end';
    state.awaitMe = false;
    state.settle = null;               // 手札は 開かない
    state.rows = [];
    checkCoins('1人だけ残って 決着');
    state.endNote = winner.me
      ? 'みんな降りた！ 見せずに もらえるよ ―― コイン ＋' + won
      : winner.name + 'が ポットを もらった（＋' + won + '）。カードは 見せないよ';
    log(state.endNote);
    finishHand();
  }

  /* ============================================================
     かける（この4つ以外の 出しかたは 無い）
     ============================================================ */
  function needOf(p)     { return Math.max(0, state.toCall - p.bet); }
  function minRaiseTo()  { return Math.max(state.toCall + state.lastRaise, BIG_BET); }
  function maxRaiseTo(p) { return p.bet + p.coins; }
  function canRaise(p)   { return !p.allIn && maxRaiseTo(p) > state.toCall; }

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
    p.last = p.allIn ? ('ぜんぶかけた ' + p.bet) : ('合わせた ' + p.bet);
    log(p.name + (p.allIn ? 'が ぜんぶかけた！ ' + paid + 'まい' : 'が 合わせた（' + paid + 'まい）'));
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
    p.last = p.allIn ? ('ぜんぶかけた ' + p.bet) : ('上げた ' + p.bet);
    log(p.name + (p.allIn ? 'が ぜんぶかけた！ ' + paid + 'まい' : 'が ' + p.bet + 'まで 上げた（' + paid + 'まい）'));
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
     ⚠️ この 関数 1つで、2つの ことを いっぺんに 出します。
        ・画面に 出す 目安 … ★の数／見出し／なぜ そう言えるか の 1行
        ・中で つかう 数（0〜1） … ロボットと、けんしょう用の 打ち手（HUMAN）が 見る
     この2つを べつべつに 書くと、**画面が 言っていることと、中の 考えが ずれます。**
     ぜったいに 分けないこと（同じ ものを 2か所に 書いたら、その時点で 設計が こわれている）。

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

  /* いま 名札に 目安を 出すか（①のかけ ＝ 場が 開く 前の ときだけ・§6-4） */
  function guideNow() {
    if (state.guide !== 'on') return null;          // 設定で「出さない」
    if (state.phase === 'over') return null;
    if (state.result) return null;                  // 役が できたら 名札は 役に ゆずる
    if (!state.hole || state.hole.length < 2) return null;
    if (openCount() >= 3) return null;
    return preflopGuide(state.hole);
  }

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
    if (need >= p.coins && want < B.allInLine * k) return { act: 'fold' };  // 合わせると ぜんぶ 出る
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

  function holeLine() {
    if (state.hole.length < 2) return '';
    var a = state.hole[0], b = state.hole[1];
    return a.ja + 'の' + a.rank + ' と ' + b.ja + 'の' + b.rank;
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

  /* その札が 役に つかわれているか → 光る／うすい の クラス */
  function markOf(card) {
    if (!state.result) return '';
    return state.result.usedKeys.indexOf(card.key) >= 0 ? 'is-used' : 'is-dim';
  }

  function renderSeats() {
    var caps = capsNow();          // サイドポットが 起きている ときだけ 中身が 入る
    var open = !!state.settle;     // 勝負まで 行った ＝ 残った人の 手札を 開く
    var html = state.players.map(function (p, i) {
      if (p.me) return '';
      var cls = 'seat'
        + (p.folded ? ' is-folded' : '')
        + (state.turn === i && state.phase === 'bet' && !p.folded && !p.allIn ? ' is-turn' : '');

      /* ★ 決着したら 残った人の 手札を 開く。降りた人は 開かない（§6-6） */
      var cardsHTML;
      if (p.folded) cardsHTML = '';
      else if (open) cardsHTML = (p.hole || []).map(function (c) { return cardHTML(c, 'is-mini'); }).join('');
      else cardsHTML = (p.hole || []).map(function () { return '<span class="seat-back"></span>'; }).join('');

      /* ★ サイドポットの 1行（§5-5。出すのは この1行だけ） */
      var capLine = '';
      if (caps && p.allIn && !p.folded && caps[i] < state.pot) capLine = caps[i] + 'まで もらえる';

      return '<div class="' + cls + '">'
        + '<p class="seat-name">🤖 ' + p.name
        +   (state.dealer === i ? '<span class="btn-mark" title="親">🔘</span>' : '')
        + '</p>'
        + '<div class="seat-cards">' + cardsHTML + '</div>'
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
    $('meInfo').innerHTML =
        '<span class="me-coin">コイン ' + p.coins + '</span>'
      + (state.dealer === 0 ? '<span class="me-tag btn-mark">🔘 親</span>' : '')
      + (p.bet > 0 ? '<span class="me-tag">出した ' + p.bet + '</span>' : '')
      + (capLine ? '<span class="me-tag">' + capLine + '</span>' : '')
      + (p.folded ? '<span class="me-tag is-out">降りた</span>' : '')
      + (p.last && !p.folded ? '<span class="me-tag">' + p.last + '</span>' : '');
    $('tape').textContent = state.handNo + 'ハンドめ ・ コイン ' + p.coins
      + '　最高 ' + state.best;
  }

  function renderPot() {
    $('pot').textContent = 'ポット ' + state.pot;
  }

  function renderBoard() {
    var open = openCount(), html = '';
    for (var i = 0; i < 5; i++) {
      if (i < open) html += cardHTML(state.board[i], markOf(state.board[i]));
      else html += slotHTML();
    }
    $('board').innerHTML = html;
  }

  function renderHand() {
    $('hand').innerHTML = state.hole.map(function (c) {
      return cardHTML(c, markOf(c));
    }).join('');
  }

  function renderSteps() {
    var showdown = (state.phase === 'end' || state.phase === 'over');
    $('steps').innerHTML = STEPS.map(function (s, i) {
      var cls = 'step' + (!showdown && i === state.step ? ' now' : '') + (showdown || i < state.step ? ' passed' : '');
      return '<span class="' + cls + '">' + s.label + '</span>';
    }).join('<span class="step-line" aria-hidden="true"></span>')
      + '<span class="step-line" aria-hidden="true"></span>'
      + '<span class="step end' + (showdown ? ' now' : '') + '">勝負</span>';
    $('stageChip').textContent = showdown ? '勝負' : STEPS[state.step].label;
  }

  /* ★の数を 3つぶん 出す（ついた ぶんだけ 色が つく） */
  function starHTML(n) {
    var out = '';
    for (var i = 1; i <= 3; i++) out += '<span class="star' + (i <= n ? ' on' : '') + '">★</span>';
    return out;
  }

  /* ★ 今の役の名札 ―― かけの さいちゅうも ずっと 出したまま（第2段の 背骨）
     ⚠️ ①のかけ（場が 開く 前）だけ、中身が「手札の目安」に 変わる（§6-4）。
        名札そのものは 消えない。 */
  function renderHandName() {
    var r = state.result;
    var main = $('handMain'), sub = $('handSub');
    var noteBoard = $('noteBoardOnly'), noteAce = $('noteAceLow');
    var label = $('handNameLabel'), stars = $('guideStars');

    /* ★ 手札2枚の 目安（設定で 出す／出さない） */
    var g = guideNow();
    stars.classList.toggle('hidden', !g);
    label.textContent = g ? '手札の目安' : '今の役';
    if (g) {
      stars.innerHTML = starHTML(g.stars);
      stars.setAttribute('aria-label', '目安 3つのうち ' + g.stars + 'つ');
      main.textContent = g.main;
      main.classList.remove('is-none');
      main.removeAttribute('data-rank');
      main.dataset.stars = g.stars;               // アトが ★の数で 色を 変えられる ように
      sub.textContent = g.why;
      noteBoard.classList.add('hidden');
      noteAce.classList.add('hidden');
      return;
    }
    main.removeAttribute('data-stars');

    if (!r) {
      main.textContent = 'まだ 役は できていないよ';
      sub.textContent = holeLine() + '。場のカードを 待とう';
      main.classList.add('is-none');
      noteBoard.classList.add('hidden');
      noteAce.classList.add('hidden');
      return;
    }

    var def = PC.HAND_BY_ID[r.id];                 // 名前・説明は ここから だけ 引く
    main.textContent = def.name;
    main.classList.remove('is-none');
    sub.textContent = def.desc + '（' + handDetail(r) + '）';
    main.dataset.rank = r.rank;                   // アトが 役ごとに 色を 変えられる ように

    /* ★ 場だけの役 ―― 自分の手札2枚が どちらも つかわれていない とき（§6-2） */
    var usesHole = PC.uses(r, state.hole);
    noteBoard.classList.toggle('hidden', usesHole);

    /* A を 1として つかった ストレート（§3-3） */
    noteAce.classList.toggle('hidden', !r.aceLow);
  }

  /* ★ 勝負の 決着を ならべる（§6-6）
     ・ならべるのは つかった5枚だけ（7枚は 出さない）
     ・勝った行は 金色わく ＋ 👑
     ・役が 同じどうしの ときだけ ▲「ここで 勝った／負けた」 */
  function renderShowdown() {
    var box = $('showdownBox');

    /* 勝負まで 行かなかった（みんな降りた）ときは 出さない */
    if (state.phase === 'bet' || state.phase === 'demo' || !state.rows.length) {
      box.classList.add('hidden');
      return;
    }

    $('sdLead').textContent = state.endNote;

    $('sdRows').innerHTML = state.rows.map(function (r) {
      if (r.folded) {
        return '<div class="sd-row is-out">'
          + '<p class="sd-out">' + (r.me ? 'あなた' : r.name) + '　降りた</p>'
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
        +   '<span class="sd-gain' + (r.gain ? '' : ' is-zero') + '">'
        +     (r.gain ? '＋' + r.gain : '±0') + '</span>'
        + '</p>'
        + '<div class="sd-cards">' + cards + '</div>'
        + (r.markText ? '<p class="sd-mark">▲ ' + r.markText + '</p>' : '')
        + '</div>';
    }).join('');

    /* ポットが 2つ以上に 分かれた ときだけ、下に 1行 */
    var s = state.settle;
    $('sdPots').textContent = (s && s.pots.length > 1)
      ? 'ポットは ' + s.pots.length + 'つに 分かれたよ（コインが 足りない人が いたため）'
      : '';

    box.classList.remove('hidden');
  }

  /* コインが 0（自分だけ・T38 §4-6） */
  function renderOver() {
    var box = $('overBox');
    if (state.phase !== 'over') { box.classList.add('hidden'); return; }
    $('overNote').textContent =
      state.handNo + 'ハンド 遊べたよ。最高は ' + state.best + 'まい';
    box.classList.remove('hidden');
  }

  /* ハッピーの ふきだし（T38 §9-3。今回 出せる ぶんだけ） */
  function renderHappy() {
    var me = state.players[0], r = state.result, msg;
    var myRow = state.rows.filter(function (x) { return x.me; })[0];

    if (state.phase === 'demo')       msg = 'これは 見本だよ';
    else if (state.phase === 'over')  msg = 'また あそぼうね';
    else if (state.phase === 'end') {
      if (!state.settle && me && me.gain > 0)      msg = '見せないで勝った！ かっこいい';
      else if (state.split && myRow && myRow.win)  msg = '引き分け。コインを 分けたよ';
      else if (me && me.gain > 0)                  msg = 'やったー！ コイン ' + me.gain + 'まい！';
      else                                         msg = 'つぎ がんばろ！';
    }
    else if (me && me.folded)         msg = 'つぎ いこう！';
    else if (!r)                      msg = 'どんなカード？';
    else if (!PC.uses(r, state.hole)) msg = 'これ、みんな同じだよ。気をつけて';
    else if (r.rank >= 4)             msg = 'やった！ 強くなったよ';
    else                              msg = '場のカードを 見てみよう';
    $('happyBubble').textContent = msg;
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
  var fullValue = 0;

  function renderActions() {
    var box = $('actButtons'), panel = $('raisePanel'), note = $('turnNote');
    var me = state.players[0];

    /* ハンドが おわった／見本を 出している ときは かけボタンを 消す */
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
      var who = state.players[state.turn];
      note.textContent = me.folded
        ? '見ているところ ―― ' + (who ? who.name + 'の 番' : '')
        : (who ? who.name + 'が 考えているよ…' : '');
      note.classList.remove('hidden');
      return;
    }
    note.classList.add('hidden');

    var need = needOf(me);
    var html = '';

    html += btn('fold', '降りる', 'この回は やめる', 'is-fold');

    if (need === 0) {
      html += btn('check', 'かけない', '0まい 出す・勝負は 続ける', '');
    } else if (need < me.coins) {
      html += btn('call', '合わせる ' + need, 'みんなと 同じ ' + state.toCall + 'まで', 'is-call');
    }

    if (canRaise(me) && maxRaiseTo(me) >= minRaiseTo()) {
      if (state.mode === 'easy') {
        var to = Math.min(minRaiseTo(), maxRaiseTo(me));
        html += btn('easyraise', '上げる ' + to, 'あと ' + (to - me.bet) + 'まい 出す', 'is-raise');
      } else {
        html += btn('raise', '上げる ▾', 'もっと 出す', 'is-raise');
      }
    }

    html += btn('allin', 'ぜんぶかける', 'コイン全部 ' + me.coins + 'まい', 'is-allin');

    box.innerHTML = html;
    renderRaisePanel();
  }

  function btn(act, main, sub, cls) {
    return '<button type="button" class="act-btn ' + cls + '" data-act="' + act + '">'
      + '<b>' + main + '</b><small>' + sub + '</small></button>';
  }

  function renderRaisePanel() {
    var panel = $('raisePanel'), me = state.players[0];
    if (!raiseOpen || state.mode === 'easy' || !state.awaitMe || !canRaise(me)) {
      panel.classList.add('hidden');
      panel.innerHTML = '';
      return;
    }
    var lo = Math.min(minRaiseTo(), maxRaiseTo(me));
    var hi = maxRaiseTo(me);

    if (state.mode === 'normal') {
      /* ふつう：3つから 選ぶ（ポットを もとに 計算して 数字を 出す） */
      var seen = [], rows = '';
      POT_STEPS.forEach(function (s) {
        var to = Math.min(Math.max(Math.round(state.pot * s.f), lo), hi);
        if (seen.indexOf(to) >= 0) return;
        seen.push(to);
        rows += '<button type="button" class="raise-opt" data-to="' + to + '">'
          + '<b>' + s.label + ' ' + to + '</b><small>あと ' + (to - me.bet) + 'まい</small></button>';
      });
      panel.innerHTML = '<p class="raise-title">いくらまで 上げる？</p><div class="raise-opts">' + rows + '</div>';
    } else {
      /* ぜんぶ：1枚きざみ（ブラックジャックの かけるパネルと 同じ かたち） */
      fullValue = Math.min(Math.max(fullValue || lo, lo), hi);
      panel.innerHTML =
          '<p class="raise-title">いくらまで 上げる？</p>'
        + '<div class="raise-stepper">'
        +   '<button type="button" class="step-btn" data-step="-10">−10</button>'
        +   '<button type="button" class="step-btn" data-step="-1">−1</button>'
        +   '<input class="raise-input" id="raiseInput" type="number" inputmode="numeric" '
        +     'min="' + lo + '" max="' + hi + '" step="1" value="' + fullValue + '">'
        +   '<button type="button" class="step-btn" data-step="1">＋1</button>'
        +   '<button type="button" class="step-btn" data-step="10">＋10</button>'
        + '</div>'
        + '<p class="raise-note">' + lo + ' 〜 ' + hi + ' まで ／ あと ' + (fullValue - me.bet) + 'まい 出す</p>'
        + '<button type="button" class="raise-ok" data-to="' + fullValue + '">決定</button>';
    }
    panel.classList.remove('hidden');
  }

  function renderModeRow() {
    Array.prototype.forEach.call($('modeRow').children, function (b) {
      b.classList.toggle('on', b.dataset.mode === state.mode);
      b.setAttribute('aria-pressed', b.dataset.mode === state.mode ? 'true' : 'false');
    });
    /* ★ ロボットの 強さ（かけ方とは べつの じく） */
    Array.prototype.forEach.call($('cpuRow').children, function (b) {
      b.classList.toggle('on', b.dataset.cpu === state.cpu);
      b.setAttribute('aria-pressed', b.dataset.cpu === state.cpu ? 'true' : 'false');
    });
    /* ★ 手札の目安（出す／出さない） */
    Array.prototype.forEach.call($('guideRow').children, function (b) {
      b.classList.toggle('on', b.dataset.guide === state.guide);
      b.setAttribute('aria-pressed', b.dataset.guide === state.guide ? 'true' : 'false');
    });
  }

  function render() {
    recalc();
    /* けんしょう（autoPlay）の あいだは 画面を 描かない。
       絵札を 何百回も 読みに いって おそくなる ため。 */
    if (state.fast) return;
    renderSeats();
    renderMeInfo();
    renderPot();
    renderBoard();
    renderHand();
    renderSteps();
    renderHandName();
    renderShowdown();
    renderOver();
    renderHappy();
    renderActions();
    renderModeRow();
  }

  /* ============================================================
     ボタンを 押したとき
     ============================================================ */
  $('actButtons').addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.act-btn') : null;
    if (!b || !state.awaitMe) return;
    var act = b.dataset.act;
    if (act === 'raise') { raiseOpen = !raiseOpen; renderRaisePanel(); return; }
    raiseOpen = false;
    state.awaitMe = false;
    if (act === 'fold')      doFold(0);
    else if (act === 'check')doCheck(0);
    else if (act === 'call') doCall(0);
    else if (act === 'allin')doAllIn(0);
    else if (act === 'easyraise') doRaise(0, Math.min(minRaiseTo(), maxRaiseTo(state.players[0])));
  });

  $('raisePanel').addEventListener('click', function (e) {
    var me = state.players[0];
    var step = e.target.closest ? e.target.closest('.step-btn') : null;
    if (step) {
      var lo = Math.min(minRaiseTo(), maxRaiseTo(me)), hi = maxRaiseTo(me);
      fullValue = Math.min(Math.max((fullValue || lo) + (+step.dataset.step), lo), hi);
      renderRaisePanel();
      return;
    }
    var ok = e.target.closest ? e.target.closest('[data-to]') : null;
    if (!ok || !state.awaitMe) return;
    var to = +ok.dataset.to;
    if (ok.classList.contains('raise-ok')) {
      var input = $('raiseInput');
      if (input) to = +input.value;
    }
    raiseOpen = false;
    state.awaitMe = false;
    doRaise(0, to);
  });

  $('raisePanel').addEventListener('input', function (e) {
    if (e.target.id !== 'raiseInput') return;
    var me = state.players[0];
    var lo = Math.min(minRaiseTo(), maxRaiseTo(me)), hi = maxRaiseTo(me);
    fullValue = Math.min(Math.max(Math.round(+e.target.value || lo), lo), hi);
    var ok = $('raisePanel').querySelector('.raise-ok');
    if (ok) ok.dataset.to = fullValue;
  });

  $('modeRow').addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-mode]') : null;
    if (!b) return;
    state.mode = b.dataset.mode;
    raiseOpen = false;
    fullValue = 0;
    try { localStorage.setItem('holdem.mode', state.mode); } catch (err) {}
    render();
  });

  /* ★ ロボットの 強さ を えらぶ（つぎの 手番から すぐ 効く） */
  $('cpuRow').addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-cpu]') : null;
    if (!b || !CPUS[b.dataset.cpu]) return;
    if (state.cpu === b.dataset.cpu) return;
    state.cpu = b.dataset.cpu;
    try { localStorage.setItem('holdem.cpu', state.cpu); } catch (err) {}
    log('ロボットの強さを「' + CPUS[state.cpu].label.replace(' ★', '') + '」に したよ');
    render();
  });

  /* ★ 手札の目安を 出す／出さない（その場で 名札に 効く） */
  $('guideRow').addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-guide]') : null;
    if (!b || !GUIDES[b.dataset.guide]) return;
    if (state.guide === b.dataset.guide) return;
    state.guide = b.dataset.guide;
    try { localStorage.setItem('holdem.guide', state.guide); } catch (err) {}
    log('手札の目安を「' + GUIDES[state.guide].label.replace(' ★', '') + '」に したよ');
    render();
  });

  $('btnNextHand').addEventListener('click', function () { startHand(); });
  $('btnRestart').addEventListener('click', function () { restart(); });

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
                      why: '場の5枚だけで ロイヤル。手札2枚は どちらも うすくなる' },
    'Aを1として':   { hole: 'sA h2', board: 'd3 c4 h5 sK d9',
                      why: 'A 2 3 4 5 の 一番弱い ストレート' },
    'ロイヤル':     { hole: 's10 sJ', board: 'sQ sK sA h2 d3',
                      why: '手札を つかった ロイヤル。手札2枚が 光る' },
    'フルハウス':   { hole: 'd7 d9', board: 's7 h7 cK dK c2',
                      why: '7が3枚とKが2枚。手札の9は うすくなる' },
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
        return p.amount + 'まい → ' + p.winners.map(function (i) { return state.players[i].name; }).join('・')
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
    if (need >= me.coins) { doAllIn(0); return; }
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
    var profit = 0, plus = 0, minus = 0, even = 0, tookPot = 0, shows = 0, refills = 0, stuck = 0;

    for (var h = 0; h < n; h++) {
      if (me.coins <= 0) refills++;      // 0まいに なった ＝ 200枚 もらって 続ける
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
      'コインが0に なった回数': refills,
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

  window.HOLDEM = {
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
    /* ★ 手札の目安（§6-4）。出す／出さない ＋ 中身を そのまま 見る */
    guide: function (v) { if (GUIDES[v]) { state.guide = v; render(); } return state.guide; },
    guideOf: function (spec) { return preflopGuide(spec ? PC.cards(spec) : state.hole); },
    state: state,
    /* 今の ようすを 1つの もので 見る（けんしょう用） */
    now: function () {
      var r = state.result;
      var g = guideNow();
      return {
        ハンド: state.handNo,
        手札の目安: g ? ('★' + g.stars + '　' + g.main + '　' + g.why) : '（出していない）',
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
        ゲームオーバー: state.phase === 'over'
      };
    }
  };

  /* ============================================================
     たしかめ用ボタン（作る人むけ）
     ============================================================ */
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
  var saved = null, savedBest = null, savedCpu = null, savedGuide = null;
  try {
    saved = localStorage.getItem('holdem.mode');
    savedBest = localStorage.getItem('holdem.best');
    savedCpu = localStorage.getItem('holdem.cpu');
    savedGuide = localStorage.getItem('holdem.guide');
  } catch (e) {}
  state.mode = MODES[saved] ? saved : 'normal';     // 初期は「ふつう」（T38 §7）
  state.cpu = CPUS[savedCpu] ? savedCpu : 'normal'; // ★ 強さも 初期は「ふつう」（T38 §1-3）
  state.guide = GUIDES[savedGuide] ? savedGuide : 'on'; // ★ 目安は 初期は「出す」（§6-4）
  if (savedBest && +savedBest > START_COINS) state.best = +savedBest;

  makePlayers();
  startHand();
})();
