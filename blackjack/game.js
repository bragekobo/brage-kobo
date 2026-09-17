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

  /* ============================================================
     ★★★ T275 ―「↻ やめる」（★設計図 追記⑩・社長のお決め①②）★★★
     ------------------------------------------------------------
     ★ ①字は「↻ やめる」／★②**聞かない**（★確認の 箱は 作りません・§5.5）。
     ★ ★戻り先は 第0段「何ラウンド遊ぶ？」＝ `enterSetup()`（★もとから ある 道）。
       ★ ★終わりの 段の「もう一度遊ぶ／ラウンドを選びなおす」と 同じ 行き先 です。
     ★★ この本は ★**積み上げが 本当に 消える 2本の うちの 1本**（★もう1本は ヨット）――
       ★ ★`enterSetup()` は コインを 100枚に 戻し、★勝ち負けの 数を 0に し、
       ★ ★`clearProgress()` で「つづき」も 消します。
       ★★→ ★聞くのでは なく、★**ボタンの 中の 小さい字 1行**で 先に 知らせます。

     ★★ 出す／消すの しかけ ―― ★★1本に **1か所だけ** ★★
       ★ この本は 画面が 5つ（setup / bet / play / next / final）ありますが、
       ★ ★★「ラウンドの ふだ（#roundBox）が 出ているか」＝「遊んで いる あいだ」
       ★ ★  と `showRow()` が すでに 決めて います（★onTable）。
       ★ ★★そこを **そのまま 見ます** ―― ★どの 道を 通っても ずれません。
     ============================================================ */
  function quitToTitle() { enterSetup(); }
  function syncQuit() {
    var q = document.getElementById('btnQuitGame');
    if (!q) return;
    q.classList.toggle('hidden', ui.roundBox.classList.contains('hidden'));
  }

  /* ★ 字が たてに 何行に なったか ―― ★あふれ でも 画面外 でも 引っかからない
     ★（★T274 §7-1：★数字の 見張りが 通し、★★写真だけが 見つけた ところ）*/
  function quitLines(el) {
    const rg = document.createRange(); rg.selectNodeContents(el);
    const rs = rg.getClientRects(); const tops = {}; let cnt = 0;
    for (let i = 0; i < rs.length; i++) {
      if (rs[i].width <= 0 && rs[i].height <= 0) continue;
      const k = Math.round(rs[i].top / 3);
      if (!tops[k]) { tops[k] = 1; cnt++; }
    }
    return cnt;
  }

  /* ============================================================
     ★★★ T275 ―「↻ やめる」の 見張り ★★★
     ------------------------------------------------------------
     ⚠️★★ ★この本には ★**verify（見張り）が 1つも ありません でした**。
        ★ ★★これが 1つ目 です（★T274 で スピードに 作ったのと 同じ 形）。
     ★ 見る のは 8つ：★ａ出る／消える　ｂ★指の的 44×44（★1pxずつ elementFromPoint）
       ★ ｃ押すと 第0段「何ラウンド遊ぶ？」へ（★本物の click）
       ★ ｄうすみどりで「◀」と 見分けが つく
       ★ ｅ上の帯が 伸びて いない（★★ボタンを 消した ときと くらべる ＝ 空の 比べ）
       ★ ｆ★★小さい字（ここまでの点は消えるよ）が 11px ＝ 会社の 床で 出て いる
       ★ ｇ★★44px の 型が 崩れて いない
       ★ ｈ★★となり（◀・ラウンドの ふだ）に 1pxも かぶって いない
     ★★ さわった ものは 1つ 残らず 戻します（★T144 §7-5）。
     ============================================================ */
  function quitCheck() {
    const bad = [];
    const q = document.getElementById('btnQuitGame');
    const back = document.querySelector('.topbar .back');
    if (!q) return ['★ボタンが 無い'];

    /* ★ 預かる（★enterSetup が ぜんぶ 消すので、★中身も 鍵も 預かる）*/
    const k = {
      phase, chips, bet, roundNo, roundsTotal, wins, losses, pushes,
      player: player.slice(), dealer: dealer.slice(), holeHidden, busy,
      deck: deck.slice(), save: loadProgress(),
      round: ui.roundBox.classList.contains('hidden'),
      banner: ui.bannerText.textContent,
      cat: (document.getElementById('catLine') || {}).textContent
    };

    /* ａ ★遊んで いない ときは 消えて いる */
    ui.roundBox.classList.add('hidden'); syncQuit();
    if (!q.classList.contains('hidden') || q.offsetParent !== null) bad.push('★遊んで いないのに 出ている');
    /* ａ ★遊んで いる ときは 出て いる */
    ui.roundBox.classList.remove('hidden'); syncQuit();
    if (q.classList.contains('hidden') || q.offsetParent === null) bad.push('★遊んで いるのに 出ていない');

    /* ｂ ★指の的 44×44 ―― ★1pxずつ 数える（★computed style を 読まない）*/
    const r = q.getBoundingClientRect();
    const cx = Math.round(r.left + r.width / 2), cy = Math.round(r.top + r.height / 2);
    const hit = (x, y) => { const e = document.elementFromPoint(x, y); return !!(e && (e === q || q.contains(e))); };
    if (t295HakoNoSoto(q, document.elementFromPoint(cx, cy))) {
      /* ★★ T295：★箱が 開いて いて この ボタンが その 外なら ―― ★ブラウザの 決まりで 押せません。
       ★ ★★傷では ない ので 見送ります（★箱の 中・★箱 以外の ふたは これまで どおり 鳴きます）。 */
    }
    else if (!hit(cx, cy)) bad.push('★まん中が 押せない');
    else {
      let up = 0, dn = 0, lf = 0, rt = 0, i;
      for (i = 1; i <= 60; i++) { if (hit(cx, cy - i)) up = i; else break; }
      for (i = 1; i <= 60; i++) { if (hit(cx, cy + i)) dn = i; else break; }
      for (i = 1; i <= 140; i++) { if (hit(cx - i, cy)) lf = i; else break; }
      for (i = 1; i <= 140; i++) { if (hit(cx + i, cy)) rt = i; else break; }
      if (lf + rt + 1 < 44 || up + dn + 1 < 44) bad.push('★指の的が 44×44 に 足りない（' + (lf + rt + 1) + '×' + (up + dn + 1) + '）');
    }
    if (r.right > document.documentElement.clientWidth + 0.5) bad.push('★画面の 右に はみ出した');
    if (r.top < -0.5) bad.push('★画面の 上に はみ出した');
    /* ｇ */
    if (r.height < 43.999) bad.push('★★ボタンが ' + r.height + 'px（★44px の 型が 崩れた）');

    /* ｆ ★★小さい字 */
    const note = q.querySelector('.quit-note');
    if (!note) bad.push('★★小さい字（ここまでの点は消えるよ）が ありません');
    else {
      if (note.textContent.replace(/\s+/g, '') !== 'ここまでの点は消えるよ') bad.push('★★小さい字が ちがう：' + note.textContent);
      const fs = parseFloat(getComputedStyle(note).fontSize);
      if (fs < 10.999) bad.push('★★小さい字が ' + fs + 'px ―― ★会社の 床（11px）を 割って います');
      if (note.offsetParent === null) bad.push('★★小さい字が 見えて いません');
      const nr = note.getBoundingClientRect();
      if (nr.right > r.right + 0.5 || nr.left < r.left - 0.5) bad.push('★★小さい字が ボタンから はみ出した');
    }

    /* ｅ ★上の帯が 伸びて いないか（★空の 比べ）*/
    const bar = document.querySelector('.topbar');
    if (bar) {
      const withBtn = bar.getBoundingClientRect().height;
      const keepD = q.style.display; q.style.display = 'none';
      const without = bar.getBoundingClientRect().height;
      q.style.display = keepD;
      if (withBtn > without + 0.5) bad.push('★上の帯が ' + (withBtn - without).toFixed(1) + 'px 伸びた');
    }

    /* ｈ ★となりに かぶって いないか */
    ['.topbar .back', '.round-box', '.title', '.side', '.talk'].forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        const er = el.getBoundingClientRect();
        const ow = Math.min(r.right, er.right) - Math.max(r.left, er.left);
        const oh = Math.min(r.bottom, er.bottom) - Math.max(r.top, er.top);
        if (ow > 0.5 && oh > 0.5) bad.push('★' + sel + ' に かぶった（' + (ow * oh).toFixed(1) + 'px²）');
      });
    });

    /* ｄ ★色で 見分けが つく */
    if (back && getComputedStyle(q).backgroundColor === getComputedStyle(back).backgroundColor) {
      bad.push('★「◀」と 同じ 色（' + getComputedStyle(q).backgroundColor + '）');
    }
    if (getComputedStyle(q).backgroundColor !== 'rgb(183, 237, 201)') {
      bad.push('★うすみどり（#B7EDC9）で ない：' + getComputedStyle(q).backgroundColor);
    }

    /* ★ 終わりの 段の「もう一度遊ぶ」が 折れて いないか（★字を 1文字も 変えて いない ことも 見る）*/
    const again = ui.againBtn;
    if (again) {
      const wasHid = ui.finalPhase.classList.contains('hidden');
      if (wasHid) ui.finalPhase.classList.remove('hidden');
      const ar = again.getBoundingClientRect();
      if (ar.right > document.documentElement.clientWidth + 0.5 || ar.left < -0.5) bad.push('★「もう一度遊ぶ」が 画面の 外');
      /* ★★ 行の数 ―― ★この ボタンは **もとから 2行**（★下の 小さい字が 2行目）。
         ★ ★3行に なったら「折れた」＝ NG（★T274 §7-1：★写真だけが 見つけた ところ）*/
      const al = quitLines(again);
      if (al > 2) bad.push('★「もう一度遊ぶ」が ' + al + '行に 折れた（★もとは 2行）');
      if (again.textContent.replace(/\s+/g, '') !== 'もう一度遊ぶラウンドを選びなおす') bad.push('★「もう一度遊ぶ」の 字が 変わった：' + again.textContent);
      if (wasHid) ui.finalPhase.classList.add('hidden');
    }
    /* ★ 上の帯の「◀」の 行き先は 1文字も 変えて いない */
    if (back && back.getAttribute('href') !== '../') bad.push('★★「◀」の 行き先が 変わって いる（' + back.getAttribute('href') + '）');
    /* ★ ふせた 札に 字が 出て いないか（★T275 で 見つけた 事故の 見張り）*/
    const cb = document.querySelector('.card.back');
    if (cb && getComputedStyle(cb, '::before').content !== 'none' && getComputedStyle(cb, '::before').content !== 'normal') {
      bad.push('★★ふせた 札に 字が 出て いる（' + getComputedStyle(cb, '::before').content + '）');
    }

    /* ｃ ★押すと 第0段へ（★本物の click）*/
    q.click();
    if (phase !== 'setup') bad.push('★押しても ラウンドえらびに 戻らない（いま ' + phase + '）');
    if (ui.setupPhase.classList.contains('hidden')) bad.push('★押しても ラウンドえらびの 段が 出ない');
    if (!ui.roundBox.classList.contains('hidden')) bad.push('★押しても ラウンドの ふだが 残っている');
    syncQuit();
    if (!q.classList.contains('hidden')) bad.push('★戻ったのに ボタンが 残っている');

    /* ★ 預かった ものを もどす（★★見張りは 見るだけ・T144 §7-5）*/
    phase = k.phase; chips = k.chips; bet = k.bet;
    roundNo = k.roundNo; roundsTotal = k.roundsTotal;
    wins = k.wins; losses = k.losses; pushes = k.pushes;
    player = k.player; dealer = k.dealer; holeHidden = k.holeHidden;
    busy = k.busy; deck = k.deck;
    if (k.save) { try { store.setItem(SAVE_KEY, JSON.stringify(k.save)); } catch (e) { /* 無視 */ } }
    renderChips(false); renderRound(); renderHands();
    showRow(k.phase);
    ui.roundBox.classList.toggle('hidden', k.round);
    ui.bannerText.textContent = k.banner;
    var cl275 = document.getElementById('catLine');
    if (cl275 && k.cat != null) cl275.textContent = k.cat;
    syncQuit();
    return bad;
  }

  /* ============================================================
     ★★★ T276 ―「◀ ゲームを選ぶ」（★終わりの 段）の 見張り ★★★
     ------------------------------------------------------------
     ★ ★T275 で 私が お知らせした こと：★★この段の ボタンは「もう一度遊ぶ」1つ だけで、
       ★ ★★家へ 行く道が ありません でした。★社長の お決めで 1つ 足しました。
     ★ ★★見る のは 8つ：
       ★ ★ａ ★★**家へ 帰る道が 出て いる**（★終わりの 段を 出すと 見える）
       ★ ★ｂ ★★**指の的 44×44**（★1pxずつ elementFromPoint。★★先に 画面の 中へ 送ってから 数えます
       ★ ★    ―― ★この段は もともと 画面より 高く、★下に はみ出す 画面が あります【★T276 実測】）
       ★ ★ｃ ★行き先が `../`
       ★ ★ｄ ★字が「◀ ゲームを選ぶ」で **1行**（★★はば320px で 2行に 折れました ―― ★CSS で 直しました）
       ★ ★ｅ ★★**たてに 増えて いない**（★「もう一度遊ぶ」と **同じ 行**に いる ―― ★よこ 2つ ならび）
       ★ ★ｆ ★となりの「もう一度遊ぶ」が 折れて いない（★もとから 2行。★3行に なったら NG）
       ★ ★ｇ ★色で 見分けが つく（★ピンクで うめた「もう一度遊ぶ」と ちがう 地の色）
       ★ ★ｈ ★★**いまの ボタンの 行き先が 変わって いない**
       ★ ★    （★`againBtn` は BUTTON の まま・href を 持たない／★上の帯の `◀` は `../` の まま）
     ★★ さわった ものは 1つ 残らず 戻します（★T144 §7-5）。
     ============================================================ */
  function homeCheck() {
    const bad = [];
    const home = document.getElementById('btnResultHome');
    const again = ui.againBtn;
    const back = document.querySelector('.topbar .back');
    if (!home) return ['★★家へ 帰る ボタン（btnResultHome）が 無い'];
    if (!again) return ['★「もう一度遊ぶ」が 無い'];

    const wasHid = ui.finalPhase.classList.contains('hidden');
    const sx = window.scrollX, sy = window.scrollY;
    if (wasHid) ui.finalPhase.classList.remove('hidden');

    /* ｃ ★行き先 */
    if (home.getAttribute('href') !== '../') bad.push('★★行き先が 変わって いる（' + home.getAttribute('href') + '）');
    if (home.tagName !== 'A') bad.push('★★<a> では ない（' + home.tagName + '）―― ★家へ 行けません');
    /* ｄ ★字 */
    if (home.textContent.replace(/\s+/g, '') !== '◀ゲームを選ぶ') bad.push('★字が ちがう：' + home.textContent);
    /* ａ ★出て いる */
    if (home.offsetParent === null) bad.push('★★終わりの 段が 出て いるのに 見えて いない');

    /* ｅ ★たてに 増えて いない ―― ★「もう一度遊ぶ」と 同じ 行に いる */
    const rA0 = again.getBoundingClientRect(), rH0 = home.getBoundingClientRect();
    if (Math.abs(rA0.top - rH0.top) > 0.5) {
      bad.push('★★よこ 2つ ならびで ない（★上ふちが ' + rA0.top.toFixed(1) + ' と ' + rH0.top.toFixed(1) +
               '）―― ★終わりの 段が たてに 伸びて います');
    }

    /* ｄ・ｆ ★行の数 */
    const lh = quitLines(home), la = quitLines(again);
    if (lh > 1) bad.push('★★「◀ ゲームを選ぶ」が ' + lh + '行に 折れた');
    if (la > 2) bad.push('★★となりの「もう一度遊ぶ」が ' + la + '行に 折れた（★もとは 2行）');

    /* ｂ ★指の的 44×44 ―― ★★先に 画面の 中へ 送る（★この段は 下に はみ出す ことが ある）*/
    home.scrollIntoView({ block: 'center' });
    const r = home.getBoundingClientRect();
    const cx = Math.round(r.left + r.width / 2), cy = Math.round(r.top + r.height / 2);
    const hit = (x, y) => { const e = document.elementFromPoint(x, y); return !!(e && (e === home || home.contains(e))); };
    if (t295HakoNoSoto(home, document.elementFromPoint(cx, cy))) {
      /* ★★ T295：★箱が 開いて いて この ボタンが その 外なら ―― ★ブラウザの 決まりで 押せません。
       ★ ★★傷では ない ので 見送ります（★箱の 中・★箱 以外の ふたは これまで どおり 鳴きます）。 */
    }
    else if (!hit(cx, cy)) bad.push('★★まん中が 押せない（★何かが 上に かぶって います）');
    else {
      let up = 0, dn = 0, lf = 0, rt = 0, i;
      for (i = 1; i <= 80; i++) { if (hit(cx, cy - i)) up = i; else break; }
      for (i = 1; i <= 80; i++) { if (hit(cx, cy + i)) dn = i; else break; }
      for (i = 1; i <= 200; i++) { if (hit(cx - i, cy)) lf = i; else break; }
      for (i = 1; i <= 200; i++) { if (hit(cx + i, cy)) rt = i; else break; }
      if (lf + rt + 1 < 44 || up + dn + 1 < 44) bad.push('★★指の的が 44×44 に 足りない（' + (lf + rt + 1) + '×' + (up + dn + 1) + '）');
    }
    if (r.right > document.documentElement.clientWidth + 0.5 || r.left < -0.5) bad.push('★★画面の 横に はみ出した');

    /* ｇ ★色で 見分けが つく */
    const cH = getComputedStyle(home).backgroundColor, cA = getComputedStyle(again).backgroundColor;
    if (cH === cA) bad.push('★★「もう一度遊ぶ」と 同じ 色（' + cH + '）―― ★見分けが つきません');
    if (getComputedStyle(home).backgroundImage !== 'none') bad.push('★「◀ ゲームを選ぶ」に ピンクの ぬりが かかって います');

    /* ｈ ★いまの ボタンの 行き先が 変わって いない */
    if (again.tagName !== 'BUTTON' || again.getAttribute('href')) bad.push('★★「もう一度遊ぶ」が 家へ 行く ものに すり替わって いる');
    if (again.textContent.replace(/\s+/g, '') !== 'もう一度遊ぶラウンドを選びなおす') bad.push('★「もう一度遊ぶ」の 字が 変わった：' + again.textContent);
    if (back && back.getAttribute('href') !== '../') bad.push('★★上の帯の「◀」の 行き先が 変わって いる（' + back.getAttribute('href') + '）');

    if (wasHid) ui.finalPhase.classList.add('hidden');
    window.scrollTo(sx, sy);
    return bad;
  }

  /* ============================================================
     ★★★ T279 ―「上の帯を 画面に くっつける」の 見張り ★★★
     ------------------------------------------------------------
     ★ ★T278（トライ）の 見つけた こと：★遊んで いる あいだ、★★12画面中 **10画面**で
       ★ ★「やめる」も「◀」も 画面の 上へ 消えて いました（★いちばん ひどいのは −583px）。
     ★ ★見る のは 8つ：
       ★ ★ａ ★`.topbar` が `position:sticky; top:0` に なって いる
       ★ ★ｂ ★★**ページの いちばん 下まで すべらせても** やめる／◀ が 見えて いる・押せる
       ★ ★ｃ ★スクロール0の ときに **1pxも 動いて いない**（★帯の 上ふち ＝ `#app` の 内よはく）
       ★ ★ｄ ★★ふた（`.topbar::before`）が ある（★★無いと 札が 字の 上に 透けます）
       ★ ★ｅ ★★**ふたの 数字（`--bar-h`）が 本当の 帯の たけと ずれて いない**
       ★ ★    （★追記⑥ 決まり2 ―― ★CSS の 中の 数字は 見張りで 数える）
       ★ ★ｆ ★★`--bar-pad-x`／`--bar-pad-top` が `#app` の 内よはく と ずれて いない
       ★ ★ｇ ★★②：はば374px以下で **小さい字 1行・ボタン 2行**
       ★ ★ｈ ★★③：しるしが **SVG**（★字では ない）で 16px 以上、★字と 3px 以上 あいて いる
     ★★ さわった ものは 1つ 残らず 戻します（★T144 §7-5）。
     ★★★ 名前の ぶつかり：★`barCheck` は この ファイルに 1つも ありません（★数えました。
        ★ ★T277 で 私が `st33` を ぶつけて 見張りを 壊したので、★先に 数える ように しました）。
     ============================================================ */
  function barCheck() {
    const bad = [];
    const bar = document.querySelector('.topbar');
    const q = document.getElementById('btnQuitGame');
    const back = document.querySelector('.topbar .back');
    const app = document.getElementById('app');
    if (!bar || !q || !back || !app) return ['★上の帯・やめる・◀・#app の どれかが 無い'];

    const keepScroll = { x: window.scrollX, y: window.scrollY };
    const keepRound = ui.roundBox.classList.contains('hidden');
    const keepPhase = phase;

    /* ★ 遊んで いる すがたに する（★やめるが 出る のは 遊んで いる あいだ だけ）*/
    ui.roundBox.classList.remove('hidden');
    phase = 'play';
    syncQuit();

    const rootCS = getComputedStyle(document.documentElement);
    const appCS = getComputedStyle(app);
    const barCS = getComputedStyle(bar);
    const num = (s) => parseFloat(s) || 0;

    /* ａ */
    if (barCS.position !== 'sticky') bad.push('★上の帯が くっついて いない（position: ' + barCS.position + '）');
    if (num(barCS.top) !== 0) bad.push('★上の帯の top が 0px で ない（' + barCS.top + '）');

    /* ｄ */
    const futa = getComputedStyle(bar, '::before');
    if (futa.backgroundImage === 'none' || futa.content === 'none') {
      bad.push('★★ふた（帯の うしろの 空）が ありません ―― ★札や 字が 帯の 字に 透けます');
    }

    /* ｃ ★ スクロール0で 1pxも 動いて いない */
    window.scrollTo(0, 0);
    const at0 = bar.getBoundingClientRect().top;
    const padTop = num(appCS.paddingTop);
    if (Math.abs(at0 - padTop) > 0.5) {
      bad.push('★スクロール0で 帯が 動いた（上ふち ' + at0.toFixed(1) + 'px ／ #app の 内よはく ' + padTop + 'px）');
    }

    /* ｅ・ｆ ★ 数字の 名前が ずれて いないか */
    const barH = num(rootCS.getPropertyValue('--bar-h'));
    const realH = bar.getBoundingClientRect().height;
    if (Math.abs(barH - realH) > 0.5) {
      bad.push('★★--bar-h が ' + barH + 'px ―― ★本当の 帯は ' + realH.toFixed(1) + 'px（★ずれて います）');
    }
    const padX = num(rootCS.getPropertyValue('--bar-pad-x'));
    if (Math.abs(padX - num(appCS.paddingLeft)) > 0.5) {
      bad.push('★★--bar-pad-x が ' + padX + 'px ―― ★#app は ' + appCS.paddingLeft + '（★ずれて います）');
    }
    const padT = num(rootCS.getPropertyValue('--bar-pad-top'));
    if (Math.abs(padT - padTop) > 0.5) {
      bad.push('★★--bar-pad-top が ' + padT + 'px ―― ★#app は ' + appCS.paddingTop + '（★ずれて います）');
    }

    /* ｂ ★ ページの いちばん 下まで すべらせても 見えて いる・押せる */
    const sh = document.documentElement.scrollHeight;
    const ih = window.innerHeight;
    [Math.floor((sh - ih) / 2), sh].forEach((yy) => {
      window.scrollTo(0, yy);
      [[q, 'やめる'], [back, '◀']].forEach((pair) => {
        const el = pair[0], na = pair[1];
        const r = el.getBoundingClientRect();
        if (r.top < -0.5) bad.push('★' + na + ' が 画面の 上へ 消えた（y＝' + r.top.toFixed(1) + 'px・すべり ' + Math.round(window.scrollY) + 'px）');
        if (r.bottom > ih + 0.5) bad.push('★' + na + ' が 画面の 下へ 出た（' + r.bottom.toFixed(1) + 'px）');
        const cx = Math.round(r.left + r.width / 2), cy = Math.round(r.top + r.height / 2);
        const t = document.elementFromPoint(cx, cy);
        if (!(t && (t === el || el.contains(t))) && !t295HakoNoSoto(el, t)) {   /* ★T295：★箱の 外は ブラウザの 決まりで 押せない */
          bad.push('★' + na + ' の まん中が 押せない（すべり ' + Math.round(window.scrollY) + 'px・上に ' + (t ? t.className || t.tagName : 'なし') + '）');
        }
      });
    });
    window.scrollTo(0, 0);

    /* ｇ ★ ②：せまい 画面で 小さい字 1行・ボタン 2行 */
    const note = q.querySelector('.quit-note');
    if (window.innerWidth <= 374 && note) {
      const nl = quitLines(note), ql = quitLines(q);
      if (nl !== 1) bad.push('★★小さい字が ' + nl + '行（★ねらいは 1行）');
      if (ql !== 2) bad.push('★★ボタンが ' + ql + '行（★ねらいは 2行）');
      if (parseFloat(getComputedStyle(note).fontSize) < 10.999) bad.push('★★小さい字が 11px を 割った');
      /* ★ 帯から あふれて いない（★ちぢめた 代金が 出て いないか）*/
      if (q.getBoundingClientRect().right > bar.getBoundingClientRect().right + 0.5) bad.push('★★やめるが 帯から 右に あふれた');
      if (back.getBoundingClientRect().left < bar.getBoundingClientRect().left - 0.5) bad.push('★★◀ が 帯から 左に あふれた');
    }

    /* ｈ ★ ③：しるしが 絵（SVG）で、大きくて、字と ちゃんと あいて いる */
    const ico = q.querySelector('.quit-icon');
    if (!ico) bad.push('★★しるし（.quit-icon）が ありません');
    else if (window.innerWidth >= 375) {
      if (ico.tagName.toLowerCase() !== 'svg') bad.push('★★しるしが 絵で ない（' + ico.tagName + '）―― ★字だと 端末の フォントに 形を 任せる ことに なります');
      const ir = ico.getBoundingClientRect();
      if (ir.width < 15.5 || ir.height < 15.5) bad.push('★★しるしが ' + ir.width.toFixed(1) + '×' + ir.height.toFixed(1) + 'px（★16px より 小さい）');
      if (ico.offsetParent === null) bad.push('★★しるしが 見えて いません');
      /* ★ となりの 字との あき（★T276 の しくじり ―― ★足して 詰まらせない）*/
      const main = q.querySelector('.quit-main');
      if (main) {
        const rg = document.createRange();
        let last = null;
        main.childNodes.forEach((n) => { if (n.nodeType === 3 && n.textContent.trim()) last = n; });
        if (last) {
          rg.selectNodeContents(last);
          const tr = rg.getBoundingClientRect();
          const aki = tr.left - ir.right;
          if (aki < 3) bad.push('★★しるしと 字の あきが ' + aki.toFixed(1) + 'px しか ない（★3px 以上 ほしい）');
        }
      }
      /* ★ 44px の 型が 崩れて いない */
      const qr = q.getBoundingClientRect();
      if (qr.height < 43.999) bad.push('★★しるしを 大きく した せいで ボタンが ' + qr.height.toFixed(1) + 'px に なった');
    }

    /* ★ もどす */
    phase = keepPhase;
    ui.roundBox.classList.toggle('hidden', keepRound);
    syncQuit();
    window.scrollTo(keepScroll.x, keepScroll.y);
    return bad;
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

  /* ★★ T275 ―「↻ やめる」を つなぐ（★上の §「出す／消すの しかけ」）★★ */
  document.getElementById('btnQuitGame').addEventListener('click', quitToTitle);
  if (window.MutationObserver) {
    new window.MutationObserver(syncQuit).observe(ui.roundBox, { attributes: true, attributeFilter: ['class'] });
  }
  syncQuit();

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
    saved: () => loadProgress(),

    /* ★★★ T275 ―― ★この本 はじめての 見張り（verify）★★★
       ★ ★いまは「↻ やめる」1つ ぶんだけ です。★★ほかの 目は まだ ありません
         ★ ★（★正直に：★この本には 見張りが 1つも ありません でした）。
       ★ ★★使い方：★ブラウザの 開発者ツールで `BJ.verify()`。 */
    verify: () => {
      const t0 = Date.now();
      const q = quitCheck();
      /* ★★ T276 ―― ★2つ目の 目（★結果の 箱の「◀ ゲームを選ぶ」）*/
      const h = homeCheck();
      /* ★★★ T279 ―― ★3つ目の 目（★上の帯を 画面に くっつけた ところ・②③も ここ）*/
      const b = barCheck();
      const bad = q.map((s) => '★「↻ やめる」：' + s)
        .concat(h.map((s) => '★★「◀ ゲームを選ぶ」：' + s))
        .concat(b.map((s) => '★★★「くっつく 上の帯」：' + s));
      const out = {
        '★NG': bad.length,
        '中身': bad.length ? bad : 'ぜんぶ OK ✅',
        '画面': window.innerWidth + '×' + window.innerHeight,
        '★★「↻ やめる」（T275）': q.length ? ('★NG ' + q.length + '件') :
          '出る／指の的44×44／押すと ラウンドえらびへ／うすみどり／帯 のび0／小さい字 11px・44px 保つ／となりに かぶり0',
        '★★「◀ ゲームを選ぶ」（T276）': h.length ? ('★NG ' + h.length + '件') :
          '家へ 帰れる／指の的44×44／行き先 ../ ／字 1行／よこ 2つ ならび（たて のび0）／色で 見分け／いまの ボタンの 行き先 そのまま',
        '★★★「くっつく 上の帯」（T279）': b.length ? ('★NG ' + b.length + '件') :
          'sticky top0／いちばん下まで すべっても やめる・◀ が 見えて 押せる／スクロール0で 動き0／ふた あり／--bar-h・--bar-pad が #app と そろう／せまい画面で 小さい字1行・ボタン2行／しるしは 絵で 16px・字と 3px 以上',
        'かかった 時間': (Date.now() - t0) + 'ms'
      };
      console.log('[ブラックジャック] verify', out);
      return out;
    }
  };
})();
