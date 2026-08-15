/* ブラックジャック（対ディーラー・ラウンド制） ― ブラゲ工房 1本目
 * 素の JavaScript のみ。ビルド・外部ライブラリなし。
 * このフォルダを丸ごとどこかに置けば、そのまま動きます。
 *
 * ながれ：
 *   【ラウンドえらび】なんラウンド あそぶ？（3 / 5 / 7 / 10 / 15）
 *      ↓
 *   【かける】いくらかける？ → これでスタート！
 *      ↓
 *   【あそぶ】カードをくばる → カードをひく／ここでストップ
 *      ↓
 *   【けっか】かち・まけとコインのふえへり → つぎの ラウンドへ
 *      ↓（ぜんぶ おわる or コインが 0 になる）
 *   【さいごの けっか】さいごの コインの まいすう → もういちど あそぶ
 *
 * コインの きまり（T10で 変更）：
 *   1ゲーム＝100まい スタート。まえの ゲームの コインは 持ちこさない。
 *   「100まい → 130まい」で 勝負を くらべられるようにするため（＝ラウンド制の 目的）。
 */
(function () {
  'use strict';

  /* ───────── 定数 ───────── */
  const SUITS = [
    { mark: '♠', ja: 'スペード',   color: 'black' },
    { mark: '♥', ja: 'ハート',     color: 'red'   },
    { mark: '♦', ja: 'ダイヤ',     color: 'red'   },
    { mark: '♣', ja: 'クローバー', color: 'black' }
  ];
  const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  /* 社長支給のトランプ画像（office/games/cards/）。
     ファイル名が日本語なので、URL にするときは必ず encodeURIComponent を通す。
     55枚で約11MB あるため、先読みはせず「場に出る札だけ」を読み込む。 */
  const CARD_DIR  = '../cards/';
  const BACK_NAME = 'トランプ裏赤';
  const BACK_KEY  = '__back__';
  const cardSrc   = (name) => CARD_DIR + encodeURIComponent(name) + '.png';
  /* めくる直前の1枚だけ先に温める（まとめ買いはしない） */
  const warm      = (name) => { const i = new Image(); i.src = cardSrc(name); };

  const START_CHIPS    = 100;              // 1ゲームの さいしょのコイン（毎回ここから）
  const MIN_BET        = 1;                // さいてい賭け金
  const DEFAULT_BET    = 10;               // ラウンド1回目の 賭け金
  /* ブラックジャックの ごほうび倍率。ふえる コインは 賭け金 × 1.5。
     コインは 1まい きざみ なので、はんぱが 出たら つねに 切り上げる（あそぶ人の とく になるほう）。
     切り捨てると 1まい賭けで +1 ＝ ふつうの かちと 同じに なってしまい、
     画面の せつめい「かけた ぶんの 1.5ばい ふえる」が うそに なる（T13 🔴-1）。 */
  const BJ_BONUS_RATE  = 1.5;              // ブラックジャックで ふえる 倍率（賭け金は べつに もどる）
  const RESHUFFLE_AT   = 15;               // 山札がこの枚数を切ったらシャッフルし直す
  const DEALER_WAIT    = 450;              // ディーラーが1枚引く間隔(ms)
  const ROUND_CHOICES  = [3, 5, 7, 10, 15];// えらべる ラウンド数（社長指示）
  const BIG_WIN_DIFF   = 50;               // これいじょう ふえたら「だいせいこう」あつかい

  /* 前のバージョンで localStorage に のこったコインは もう使わない（あと片づけ） */
  try {
    localStorage.removeItem('bragekobo.blackjack.chips');
    localStorage.removeItem('bragekobo.blackjack.bet');
  } catch (e) { /* 使えない環境でも あそべるように 無視 */ }

  /* ───────── とちゅう中断の「つづき」（T17 🟡-5） ─────────
   * リロード（誤タップ・通知・戻る／進む）で 10ラウンドぶんの あそびが
   * まるごと 消えるのを ふせぐ。
   *
   * 【どこに ほぞんするか】sessionStorage（そのタブの あいだだけ 生きる）。
   *   localStorage だと 「きのうの つづき」まで よみがえって、
   *   1ゲーム＝100まいスタート固定（T10）が くずれて 見える。
   *   ここで やりたいのは「中断した ゲームの つづき」であって、
   *   「まえの ゲームの コインの もちこし」では ない。
   *
   * 【どこまで もどすか】ラウンドの あたま（＝かけるフェーズ）まで。
   *   くばられた カード・山札・ディーラーの とちゅうの 動きまでは 保存しない。
   *   ・保存するのは 賭ける まえの 状態なので、賭け金は まだ 引かれていない。
   *     ＝ リロードで 中断した ラウンドは 「なかったこと」に なり、コインは そのまま。
   *   ・ラウンドの けっかが 出たあと（つぎの ラウンドへ の 画面）で リロードした場合は、
   *     けっかを 反映した うえで 「つぎの ラウンドの あたま」から 再開する。
   *
   * 【消すとき】ぜんぶ おわった／コインぎれ／「もういちど あそぶ」。残骸を のこさない。
   */
  const SAVE_KEY = 'bragekobo.blackjack.resume.v1';

  /* sessionStorage が つかえない ブラウザ設定でも あそべるように、使用可否を先に確かめる */
  let store = null;
  try {
    const t = '__bj_test__';
    window.sessionStorage.setItem(t, '1');
    window.sessionStorage.removeItem(t);
    store = window.sessionStorage;
  } catch (e) { store = null; }

  /* かけるフェーズの 状態を 1件だけ 書きのこす */
  function saveProgress(atRound, atChips) {
    if (!store) return;
    try {
      store.setItem(SAVE_KEY, JSON.stringify({
        v: 1,
        rounds: roundsTotal,
        round:  atRound,
        chips:  atChips,
        bet:    bet,
        wins:   wins,
        losses: losses,
        pushes: pushes
      }));
    } catch (e) { /* 容量オーバー等。あそびは 止めない */ }
  }

  function clearProgress() {
    if (!store) return;
    try { store.removeItem(SAVE_KEY); } catch (e) { /* 無視 */ }
  }

  /* 読みこみ。すこしでも おかしければ 使わずに 消す（こわれた保存で ゲームを 壊さない） */
  function loadProgress() {
    if (!store) return null;
    let raw = null;
    try { raw = store.getItem(SAVE_KEY); } catch (e) { return null; }
    if (!raw) return null;

    let s = null;
    try { s = JSON.parse(raw); } catch (e) { clearProgress(); return null; }

    const nat = (v) => Number.isInteger(v) && v >= 0;
    const ok =
      s && s.v === 1 &&
      ROUND_CHOICES.indexOf(s.rounds) >= 0 &&
      Number.isInteger(s.round)  && s.round >= 1 && s.round <= s.rounds &&
      Number.isInteger(s.chips)  && s.chips >= MIN_BET && s.chips <= 999999 &&
      Number.isInteger(s.bet)    && s.bet   >= MIN_BET &&
      nat(s.wins) && nat(s.losses) && nat(s.pushes) &&
      (s.wins + s.losses + s.pushes) <= s.rounds;

    if (!ok) { clearProgress(); return null; }
    return s;
  }

  /* ───────── 画面要素 ───────── */
  const $  = (id) => document.getElementById(id);
  const $$ = (sel) => Array.prototype.slice.call(document.querySelectorAll(sel));

  const ui = {
    chipNums:    $$('.js-chips'),      // コインの数字（かけるパネル・あそぶ中・さいごのけっか）
    chipBoxes:   $$('.js-chip-box'),   // ぴょこん と はねる わく
    roundBox:    $('roundBox'),
    roundNow:    $('roundNow'),
    roundTotal:  $('roundTotal'),

    setupPhase:  $('setupPhase'),
    roundRow:    $('roundRow'),

    betPhase:    $('betPhase'),
    betInput:    $('betInput'),
    betNote:     $('betNote'),
    betMinus10:  $('betMinus10'),
    betMinus1:   $('betMinus1'),
    betPlus1:    $('betPlus1'),
    betPlus10:   $('betPlus10'),
    startBtn:    $('startBtn'),

    playInfo:    $('playInfo'),
    betValue:    $('betValue'),

    dealerSide:  $('dealerSide'),
    playerSide:  $('playerSide'),
    dealerHand:  $('dealerHand'),
    dealerScore: $('dealerScore'),
    playerHand:  $('playerHand'),
    playerScore: $('playerScore'),

    banner:      $('banner'),
    bannerText:  $('bannerText'),

    playRow:     $('playRow'),
    nextRow:     $('nextRow'),
    hitBtn:      $('hitBtn'),
    standBtn:    $('standBtn'),
    nextBtn:     $('nextBtn'),

    finalPhase:  $('finalPhase'),
    finalTitle:  $('finalTitle'),
    finalFrom:   $('finalFrom'),
    finalTo:     $('finalTo'),
    finalDiff:   $('finalDiff'),
    finalRound:  $('finalRound'),
    finalRecord: $('finalRecord'),
    againBtn:    $('againBtn'),

    rule:        $('ruleNote')
  };

  /* ───────── 状態 ───────── */
  let deck   = [];
  let player = [];
  let dealer = [];
  let chips  = START_CHIPS;
  let bet    = DEFAULT_BET;
  /* 'setup' | 'bet' | 'player' | 'dealer' | 'result' | 'final' | 'gameover' */
  let phase  = 'setup';
  let holeHidden = true; // ディーラーの2枚目を伏せているか
  let busy   = false;    // 連打防止

  /* ラウンドの すすみぐあい */
  let roundsTotal = 0;   // このゲームで あそぶ ラウンド数
  let roundNo     = 0;   // いま なんラウンドめ（1はじまり）
  let wins = 0, losses = 0, pushes = 0;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ───────── コインの ひょうじ ───────── */
  function renderChips(bump) {
    ui.chipNums.forEach((el) => { el.textContent = chips; });
    if (!bump) return;
    ui.chipBoxes.forEach((el) => {
      el.classList.remove('bump');
      void el.offsetWidth;   // アニメを再生させるためのリフロー
      el.classList.add('bump');
    });
  }
  function setChips(v) {
    chips = v;
    renderChips(true);
  }

  /* ───────── 賭け金 ───────── */
  /* 1 〜 いま持っているコイン、の範囲に必ず収める */
  function clampBet(v) {
    const max = Math.max(MIN_BET, chips);   // chips が 0 でも計算が壊れないように
    if (!Number.isFinite(v)) v = bet;
    v = Math.floor(v);
    if (v < MIN_BET) v = MIN_BET;
    if (v > max) v = max;
    return v;
  }

  /* 賭け金を変える。画面（入力欄・注意書き・ボタンの有効／無効）もここで揃える */
  function setBet(v, opts) {
    const keepInput = opts && opts.keepInput;   // 入力中は値を書き戻さない
    bet = clampBet(v);
    if (!keepInput) ui.betInput.value = bet;
    ui.betInput.max = Math.max(MIN_BET, chips);
    ui.betValue.textContent = bet;
    ui.betNote.textContent =
      chips <= 0 ? 'コインがなくなっちゃった…'
                 : '1枚 〜 ' + chips + '枚 までかけられるよ';

    const atMin = bet <= MIN_BET;
    const atMax = bet >= chips;
    ui.betMinus1.disabled  = atMin;
    ui.betMinus10.disabled = atMin;
    ui.betPlus1.disabled   = atMax;
    ui.betPlus10.disabled  = atMax;
    ui.startBtn.disabled   = chips < MIN_BET;
  }
  const addBet = (n) => setBet(bet + n);

  /* ───────── 山札 ───────── */
  function buildDeck() {
    const d = [];
    for (const s of SUITS) {
      for (const r of RANKS) d.push({ rank: r, suit: s.mark, suitJa: s.ja, color: s.color });
    }
    // Fisher-Yates
    for (let i = d.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [d[i], d[j]] = [d[j], d[i]];
    }
    return d;
  }
  function draw() {
    if (deck.length === 0) deck = buildDeck();
    return deck.pop();
  }

  /* ───────── 点数計算（A は 1 か 11 の有利なほう） ───────── */
  function handValue(cards) {
    let total = 0, aces = 0;
    for (const c of cards) {
      if (c.rank === 'A') { aces++; total += 11; }
      else if (c.rank === 'J' || c.rank === 'Q' || c.rank === 'K') total += 10;
      else total += parseInt(c.rank, 10);
    }
    while (total > 21 && aces > 0) { total -= 10; aces--; }
    return { total: total, soft: aces > 0 };
  }
  const isBlackjack = (cards) => cards.length === 2 && handValue(cards).total === 21;

  /* ───────── 描画 ───────── */

  /* テスト用に外から差し込まれた札（suitJa が無い）でも壊れないように補う */
  function normalize(card) {
    if (card.suitJa) return card;
    const s = SUITS.find((x) => x.mark === card.suit);
    return {
      rank: card.rank,
      suit: card.suit,
      suitJa: s ? s.ja : '',
      color: card.color || (s ? s.color : 'black')
    };
  }
  const cardKey = (card) => card.suitJa + card.rank;

  /* 画像レイヤー。読み込めたら下のフォールバックを隠し、失敗したら画像を捨てる。 */
  function faceImg(name, holder) {
    const img = document.createElement('img');
    img.className = 'face';
    img.alt = '';
    img.decoding = 'async';
    img.draggable = false;
    img.addEventListener('load',  () => holder.classList.add('img-ok'), { once: true });
    img.addEventListener('error', () => { holder.classList.add('img-failed'); img.remove(); }, { once: true });
    img.src = cardSrc(name);
    return img;
  }

  /* 画像が来るまで／来なかったときの簡易カード面（記号だけ） */
  function fallbackEl(card) {
    const f = document.createElement('span');
    f.className = 'fallback';
    f.innerHTML =
      '<span class="corner tl">' + card.rank + '<i>' + card.suit + '</i></span>' +
      '<span class="pip">' + card.suit + '</span>' +
      '<span class="corner br">' + card.rank + '<i>' + card.suit + '</i></span>';
    return f;
  }

  function cardEl(raw) {
    const card = normalize(raw);
    const d = document.createElement('div');
    d.className = 'card' + (card.color === 'red' ? ' red' : '');
    d.dataset.key = cardKey(card);
    d.setAttribute('role', 'img');
    d.setAttribute('aria-label', card.suitJa + 'の' + card.rank);
    d.appendChild(fallbackEl(card));
    d.appendChild(faceImg(cardKey(card), d));
    return d;
  }

  function backEl() {
    const d = document.createElement('div');
    d.className = 'card back';
    d.dataset.key = BACK_KEY;
    d.setAttribute('role', 'img');
    d.setAttribute('aria-label', 'ふせてあるカード');
    d.appendChild(faceImg(BACK_NAME, d));
    return d;
  }

  /* 差分描画：すでに出ている札の DOM は作り直さない
     （＝同じ画像を何度も取りに行かない・配るアニメが暴れない） */
  function renderHand(box, cards, hiddenIndex) {
    cards.forEach((c, i) => {
      const key = (i === hiddenIndex) ? BACK_KEY : cardKey(normalize(c));
      const cur = box.children[i];
      if (cur && cur.dataset.key === key) return;
      const fresh = (i === hiddenIndex) ? backEl() : cardEl(c);
      if (cur) {
        if (cur.dataset.key === BACK_KEY) fresh.classList.add('reveal');  // 伏せ札をめくった
        box.replaceChild(fresh, cur);
      } else {
        box.appendChild(fresh);
      }
    });
    while (box.children.length > cards.length) box.removeChild(box.lastChild);
  }

  function renderHands() {
    renderHand(ui.playerHand, player, -1);
    renderHand(ui.dealerHand, dealer, holeHidden ? 1 : -1);
    renderScores();
  }

  function renderScores() {
    // プレイヤー
    const pv = handValue(player);
    ui.playerScore.className = 'score';
    if (player.length === 0) {
      ui.playerScore.textContent = '-';
    } else if (pv.total > 21) {
      ui.playerScore.textContent = pv.total + ' バースト';
      ui.playerScore.classList.add('bust');
    } else if (isBlackjack(player)) {
      ui.playerScore.textContent = 'ブラックジャック！';
      ui.playerScore.classList.add('bj');
    } else {
      ui.playerScore.textContent = (pv.soft ? pv.total - 10 + ' / ' : '') + pv.total;
    }

    // ディーラー
    ui.dealerScore.className = 'score';
    if (dealer.length === 0) {
      ui.dealerScore.textContent = '-';
    } else if (holeHidden) {
      const shown = handValue(dealer.slice(0, 1));
      ui.dealerScore.textContent = shown.total + ' + ?';
    } else {
      const dv = handValue(dealer);
      if (dv.total > 21) {
        ui.dealerScore.textContent = dv.total + ' バースト';
        ui.dealerScore.classList.add('bust');
      } else if (isBlackjack(dealer)) {
        ui.dealerScore.textContent = 'ブラックジャック';
        ui.dealerScore.classList.add('bj');
      } else {
        ui.dealerScore.textContent = dv.total;
      }
    }
  }

  function setBanner(text, kind) {
    ui.bannerText.textContent = text;
    ui.banner.className = 'banner flash' + (kind ? ' ' + kind : '');
    void ui.banner.offsetWidth;
  }

  /* いま なんラウンドめ か（上のバー） */
  function renderRound() {
    ui.roundNow.textContent   = roundNo;
    ui.roundTotal.textContent = roundsTotal;
  }

  /* 画面のどのブロックを見せるか。'setup' | 'bet' | 'play' | 'next' | 'final' */
  function showRow(name) {
    ui.setupPhase.classList.toggle('hidden', name !== 'setup');
    ui.betPhase.classList.toggle('hidden',   name !== 'bet');
    ui.playInfo.classList.toggle('hidden',   name !== 'play' && name !== 'next');
    ui.playRow.classList.toggle('hidden',    name !== 'play');
    ui.nextRow.classList.toggle('hidden',    name !== 'next');
    ui.finalPhase.classList.toggle('hidden', name !== 'final');

    /* カードの ばしょ と ラウンド表示は「あそんでいる あいだ」だけ。
       ラウンドえらび・さいごのけっか では たてを 使わない（375px で 1画面に おさめるため） */
    const onTable = (name === 'bet' || name === 'play' || name === 'next');
    ui.dealerSide.classList.toggle('hidden', !onTable);
    ui.playerSide.classList.toggle('hidden', !onTable);
    ui.roundBox.classList.toggle('hidden',   !onTable);

    /* あそびかたの せつめいは 場所に よゆうの ある ラウンドえらび画面だけ */
    ui.rule.classList.toggle('hidden', name !== 'setup');
  }

  /* ───────── ⓪ ラウンドえらび ───────── */
  function enterSetup() {
    phase = 'setup';
    busy = false;
    roundsTotal = 0;
    roundNo = 0;
    wins = 0; losses = 0; pushes = 0;

    player = []; dealer = [];
    holeHidden = true;
    renderHands();                 // まえの ゲームの 札を のこさない

    chips = START_CHIPS;           // 毎回 まっさらな 100まいから
    bet   = DEFAULT_BET;
    renderChips(false);

    deck = buildDeck();
    ui.finalPhase.classList.remove('is-over');
    clearProgress();               // まっさらに もどる ＝ 「つづき」は 消す
    showRow('setup');
    setBanner('何ラウンド遊ぶか選んでね', '');
  }

  /* リロードで もどってきたとき：ラウンドの あたま（かけるフェーズ）から 再開する。
     enterSetup() の あとに 呼ぶ（まっさらに してから 上書きする） */
  function resumeGame(s) {
    roundsTotal = s.rounds;
    roundNo     = s.round;
    wins = s.wins; losses = s.losses; pushes = s.pushes;
    chips = s.chips;
    bet   = clampBet(s.bet);
    renderChips(false);
    deck = buildDeck();
    enterBetPhase();
    if (phase !== 'bet') return;   // まんいち コインぎれ なら そのまま けっか画面へ
    setBanner('続きから！ ' + roundNo + ' / ' + roundsTotal + ' ラウンド目。いくら かける？', '');
  }

  function startGame(n) {
    if (phase !== 'setup') return;
    if (ROUND_CHOICES.indexOf(n) < 0) return;

    roundsTotal = n;
    roundNo = 1;
    wins = 0; losses = 0; pushes = 0;
    chips = START_CHIPS;
    bet   = DEFAULT_BET;
    renderChips(false);
    deck = buildDeck();
    enterBetPhase();
  }

  /* ───────── ① かけるフェーズ ───────── */
  function enterBetPhase() {
    if (chips < MIN_BET) return showFinal(true);

    phase = 'bet';
    busy = false;
    player = []; dealer = [];
    holeHidden = true;
    renderHands();                  // 場を片づける

    renderRound();
    setBet(bet);                    // 前回の額。足りなければ自動で持ちコインまで下がる
    saveProgress(roundNo, chips);   // ここが「つづき」の しおり（賭け金を 引く まえ）
    showRow('bet');
    setBanner(roundNo + ' / ' + roundsTotal + ' ラウンド目。いくら かける？', '');
  }

  /* ───────── ② あそぶフェーズ ───────── */
  function startRound() {
    if (busy || phase !== 'bet') return;

    setBet(readInput());            // 入力中の値を最終確定（範囲外は自動でおさまる）
    if (chips < MIN_BET) return showFinal(true);

    if (deck.length < RESHUFFLE_AT) deck = buildDeck();

    saveProgress(roundNo, chips);   // しおりを 更新（えらんだ 賭け金も のこす。まだ 引く まえ）
    setChips(chips - bet);       // 賭け金を先に払う
    player = []; dealer = [];
    holeHidden = true;
    phase = 'player';

    player.push(draw());
    dealer.push(draw());
    player.push(draw());
    dealer.push(draw());

    renderHands();
    warm(cardKey(normalize(dealer[1])));   // 伏せ札の絵柄だけ先読み（1枚）
    showRow('play');
    ui.hitBtn.disabled = false;
    ui.standBtn.disabled = false;
    setBanner('カードを引く？ ここでストップ？', '');

    // 最初の2枚での決着（ナチュラル）
    const pBJ = isBlackjack(player);
    const dBJ = isBlackjack(dealer);
    if (pBJ || dBJ) {
      holeHidden = false;
      renderHands();
      if (pBJ && dBJ)      finish('push', 'どっちもブラックジャック。引き分け');
      else if (pBJ)        finish('bj',   'ブラックジャック！ いっぱつで21だよ');
      else                 finish('lose', 'ディーラーがブラックジャック。負けちゃった');
    }
  }

  function hit() {
    if (busy || phase !== 'player') return;
    player.push(draw());
    renderHands();

    const pv = handValue(player);
    if (pv.total > 21) {
      holeHidden = false;
      renderHands();
      finish('lose', 'バースト！ 21をこえちゃった');
    } else if (pv.total === 21) {
      stand();   // 21ちょうどは自動でストップ
    }
  }

  async function stand() {
    if (busy || phase !== 'player') return;
    busy = true;
    phase = 'dealer';
    ui.hitBtn.disabled = true;
    ui.standBtn.disabled = true;

    holeHidden = false;
    renderHands();
    setBanner('ディーラーの番…', '');
    await sleep(DEALER_WAIT);

    // 17未満なら引く / 17以上で止まる
    while (handValue(dealer).total < 17) {
      dealer.push(draw());
      renderHands();
      await sleep(DEALER_WAIT);
    }

    const p = handValue(player).total;
    const d = handValue(dealer).total;

    busy = false;
    if (d > 21)      finish('win',  'ディーラーがバースト！ 君の勝ち');
    else if (p > d)  finish('win',  p + ' たい ' + d + '。君の勝ち！');
    else if (p < d)  finish('lose', p + ' たい ' + d + '。ディーラーの勝ち');
    else             finish('push', p + ' たい ' + d + '。引き分け');
  }

  /* ───────── ③ 1ラウンドの けっか ───────── */
  function finish(kind, message) {
    phase = 'result';
    busy = false;
    ui.hitBtn.disabled = true;
    ui.standBtn.disabled = true;

    let back = 0;
    /* bj は「賭け金が もどる ＋ 賭け金×1.5（切り上げ）が ふえる」。
       切り上げなので、どんな 賭け金でも かならず ふつうの かち（+賭け金）より 多く ふえる。 */
    if (kind === 'bj')        back = bet + Math.ceil(bet * BJ_BONUS_RATE);
    else if (kind === 'win')  back = bet * 2;
    else if (kind === 'push') back = bet;

    if (kind === 'bj' || kind === 'win') wins++;
    else if (kind === 'push')            pushes++;
    else                                 losses++;

    if (back > 0) setChips(chips + back);
    else          renderChips(true);
    renderScores();

    const net = back - bet;
    const suffix = net > 0 ? '（コイン +' + net + '）'
                 : net < 0 ? '（コイン ' + net + '）'
                           : '（コイン ±0）';
    setBanner(message + ' ' + suffix, kind === 'bj' ? 'bj' : kind);

    // つぎに どこへ すすむか を ボタンの 文字で 見せる
    const broke = chips < MIN_BET;
    const last  = roundNo >= roundsTotal;

    /* しおりを「つぎの ラウンドの あたま」に すすめる。
       ＝ ここで リロードしても、いまの ラウンドの けっかは 消えない。
       これで おわり（コインぎれ／さいご）なら しおりは 捨てる。 */
    if (broke || last) clearProgress();
    else               saveProgress(roundNo + 1, chips);

    ui.nextBtn.innerHTML =
      broke ? '結果を見る<small>コインが なくなっちゃった</small>'
    : last  ? '最後の結果を見る<small>全部終わり！</small>'
            : '次のラウンドへ<small>' + (roundNo + 1) + ' / ' + roundsTotal + ' ラウンド目</small>';

    showRow('next');
    ui.nextBtn.focus({ preventScroll: true });
  }

  /* 「つぎの ラウンドへ」を おしたとき */
  function goNext() {
    if (phase !== 'result') return;
    if (chips < MIN_BET)        return showFinal(true);    // とちゅうで コインぎれ
    if (roundNo >= roundsTotal) return showFinal(false);   // ぜんぶ おわった
    roundNo++;
    enterBetPhase();
  }

  /* ───────── ④ さいごの けっか ───────── */
  function showFinal(isGameOver) {
    phase = isGameOver ? 'gameover' : 'final';
    busy = false;
    clearProgress();               // ゲームは おわり。「つづき」は のこさない

    const diff   = chips - START_CHIPS;
    const played = Math.min(roundNo, roundsTotal);

    ui.finalPhase.classList.toggle('is-over', !!isGameOver);
    ui.finalTitle.textContent = isGameOver ? 'ゲームオーバー' : '全部終わり！';
    ui.finalFrom.textContent  = START_CHIPS;
    ui.finalTo.textContent    = chips;

    ui.finalDiff.textContent =
      diff > 0 ? '＋' + diff + '枚増えた！'
    : diff < 0 ? '−' + Math.abs(diff) + '枚減っちゃった'
               : '増えも減りもしなかった';
    ui.finalDiff.className = 'final-diff ' + (diff > 0 ? 'up' : diff < 0 ? 'down' : 'same');

    ui.finalRound.textContent = isGameOver
      ? played + ' / ' + roundsTotal + ' ラウンドで終わっちゃった'
      : played + ' / ' + roundsTotal + ' ラウンド遊んだよ';

    ui.finalRecord.textContent =
      '勝ち' + wins + '回・負け' + losses + '回・引き分け' + pushes + '回';

    /* ふきだしの 色（ハッピーの かおも これで きまる） */
    let kind, msg;
    if (isGameOver) {
      kind = 'lose';
      msg  = 'コインが なくなっちゃった…';
    } else if (diff >= BIG_WIN_DIFF) {
      kind = 'bj';
      msg  = 'コインが ' + chips + '枚！ 大成功！';
    } else if (diff > 0) {
      kind = 'win';
      msg  = 'コインが ' + diff + '枚増えたよ！';
    } else if (diff === 0) {
      kind = 'push';
      msg  = 'コインは ' + chips + '枚の まま！';
    } else {
      kind = 'lose';
      msg  = 'コインは ' + chips + '枚。次は増やそう！';
    }
    setBanner(msg, kind);

    showRow('final');
    ui.againBtn.focus({ preventScroll: true });
  }

  /* ───────── 操作 ───────── */
  /* 入力欄の値を読む。空・へんな文字のときは いまの賭け金あつかい */
  function readInput() {
    const v = parseInt(ui.betInput.value, 10);
    return Number.isFinite(v) ? v : bet;
  }

  ui.roundRow.addEventListener('click', (e) => {
    const btn = e.target.closest('.round-btn');
    if (!btn) return;
    startGame(parseInt(btn.dataset.rounds, 10));
  });

  ui.betMinus10.addEventListener('click', () => addBet(-10));
  ui.betMinus1 .addEventListener('click', () => addBet(-1));
  ui.betPlus1  .addEventListener('click', () => addBet(1));
  ui.betPlus10 .addEventListener('click', () => addBet(10));

  // 打っている最中は書き戻さない（「20」の「2」で確定されないように）。
  // 指を離した／別の場所を触った時点で範囲におさめる。
  ui.betInput.addEventListener('input',  () => setBet(readInput(), { keepInput: true }));
  ui.betInput.addEventListener('change', () => setBet(readInput()));
  ui.betInput.addEventListener('blur',   () => setBet(readInput()));
  ui.betInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); ui.betInput.blur(); startRound(); }
  });

  ui.startBtn.addEventListener('click', startRound);
  ui.hitBtn.addEventListener('click', hit);
  ui.standBtn.addEventListener('click', stand);
  ui.nextBtn.addEventListener('click', goNext);
  ui.againBtn.addEventListener('click', enterSetup);

  document.addEventListener('keydown', (e) => {
    if (e.target === ui.betInput) return;   // 入力欄の中では横取りしない
    const k = e.key.toLowerCase();
    if (phase === 'setup') {
      // 1〜5 の キーでも ラウンド数を えらべる
      const idx = parseInt(k, 10);
      if (idx >= 1 && idx <= ROUND_CHOICES.length) {
        e.preventDefault();
        startGame(ROUND_CHOICES[idx - 1]);
      }
    } else if (phase === 'player') {
      if (k === 'h') { e.preventDefault(); hit(); }
      if (k === 's') { e.preventDefault(); stand(); }
    } else if (phase === 'result') {
      if (k === ' ' || k === 'enter') { e.preventDefault(); goNext(); }
    } else if (phase === 'final' || phase === 'gameover') {
      if (k === ' ' || k === 'enter') { e.preventDefault(); enterSetup(); }
    } else if (phase === 'bet') {
      if (k === ' ' || k === 'enter') { e.preventDefault(); startRound(); }
      if (k === 'arrowup')   { e.preventDefault(); addBet(1); }
      if (k === 'arrowdown') { e.preventDefault(); addBet(-1); }
    }
  });

  /* ───────── 起動 ───────── */
  /* さきに しおりを 読んでから まっさらに する（enterSetup が しおりを 消すため） */
  const resumeData = loadProgress();
  enterSetup();
  if (resumeData) resumeGame(resumeData);

  /* 動作確認・調整用の窓口（トライ／アトが触れるように公開） */
  window.BJ = {
    state: () => ({
      phase: phase,
      chips: chips,
      bet: bet,
      round: roundNo,
      roundsTotal: roundsTotal,
      wins: wins,
      losses: losses,
      pushes: pushes,
      player: player.map((c) => c.rank + c.suit),
      dealer: dealer.map((c) => c.rank + c.suit),
      playerTotal: handValue(player).total,
      dealerTotal: handValue(dealer).total,
      holeHidden: holeHidden,
      banner: ui.bannerText.textContent,
      deckLeft: deck.length
    }),
    setBet: (v) => setBet(v),
    chooseRounds: (n) => startGame(n),
    start: startRound,
    hit: hit,
    stand: stand,
    next: goNext,
    again: enterSetup,
    // テスト用：コインを直接いじる
    setChips: (v) => { setChips(v); if (phase === 'bet') setBet(bet); },
    // テスト用：次に配られる札を仕込む（山札の末尾から引かれる）
    stack: (list) => { list.slice().reverse().forEach((c) => deck.push(c)); },
    // テスト用：いま のこっている「つづき」の しおり（無ければ null）
    saved: () => loadProgress()
  };
})();
