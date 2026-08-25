const SUITS = [
  { id: 'spades', mark: '♠', name: 'スペード', color: 'black' },
  { id: 'hearts', mark: '♥', name: 'ハート', color: 'red' },
  { id: 'diamonds', mark: '♦', name: 'ダイヤ', color: 'red' },
  { id: 'clubs', mark: '♣', name: 'クラブ', color: 'black' },
];
const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const SPEEDS = { slow: { think: 1500, next: 1050 }, normal: { think: 800, next: 650 }, fast: { think: 350, next: 280 } };
/* ★えらばせるのは「ロボットの数」だけ（設計図 §5.5）。
   ルールと はやさは 画面から 外して、ここで 固定する。
   ・rule  = 'normal' … AとKは つながらない（ふつうの 七並べ）
   ・speed = 'fast'   … いちばん 速い。待ち時間は 遊びの中身では ないので えらばせない
   しくみ（SPEEDS・rule の 判定）は そのまま のこしてある ので、
   index.html に <select id="ruleMode"> / <select id="gameSpeed"> を 戻せば
   また えらべるように なる（startGame を 見てね）。 */
const FIXED_RULE  = 'normal';
const FIXED_SPEED = 'fast';
const state = { players: [], board: {}, current: 0, rule: FIXED_RULE, speed: FIXED_SPEED, finishOrder: [], busy: false, finished: false, epoch: 0 };
const $ = (id) => document.getElementById(id);

/* ============================================================
   ★ later() ― 手番を すすめる タイマーは かならず これを つかう
   （大富豪から 持ってきた しくみ。T94 §4 の 手番の 横取りを 止める）
   ------------------------------------------------------------
   もんだい：「↻ 最初から」を おした とき、まえの 試合の タイマーが
   まだ のこっている。ふつうは state.finished で 止まるが、
   新しい 試合が はじまると finished は false に もどる ので、
   ★ふるい タイマーが 新しい 試合の 中で うごき出して しまう。
   すると 手番が 2本 同時に すすみ、自分の 番が 静かに 飛ぶ。

   なおし方：試合を はじめる／やめる たびに state.epoch を 1 ふやし、
   よやく した ときの epoch と ちがったら ★なにも しない。
   ============================================================ */
function later(fn, ms) {
  const e = state.epoch;
  return window.setTimeout(() => { if (e === state.epoch) fn(); }, ms);
}

function createDeck() { return SUITS.flatMap(s => RANKS.map((rank, index) => ({ ...s, rank, value:index + 1, key:`${s.id}-${index + 1}` }))); }
function shuffle(cards) { for (let i = cards.length - 1; i; i--) { const j = Math.floor(Math.random() * (i + 1)); [cards[i], cards[j]] = [cards[j], cards[i]]; } return cards; }
/* ───────── カードの絵札（社長支給のトランプ画像） ─────────
   設計図 §9：トランプは かならず office/games/cards/ の画像を使う。
   CSSや記号で カードを 自作しない。

   ・コード内のスートは英語ID（spades/hearts/diamonds/clubs）、
     画像のファイル名は日本語（スペード/ハート/ダイヤ/クローバー）なので、
     下の SUIT_FILE_JA が その対応表。
     ※ clubs は 表示名が「クラブ」だが、画像は「クローバー」。ここを取りちがえると 404 になる。
   ・ファイル名が日本語なので、URL にするときは かならず encodeURIComponent を通す。
   ・全55枚で約11MB あるため 先読みはしない。場に出た札・手札の分だけ読み込む。 */
const CARD_DIR = '../cards/';
const SUIT_FILE_JA = { spades: 'スペード', hearts: 'ハート', diamonds: 'ダイヤ', clubs: 'クローバー' };
const cardSrc = (name) => CARD_DIR + encodeURIComponent(name) + '.png';
const cardImageName = (card) => (SUIT_FILE_JA[card.id] || '') + card.rank;

/* 画像が読めなかったときの保険（画面が真っ白にならないように）。
   画像が届いたら .img-ok が付いて、この下じきは隠れる。 */
function fallbackHTML(card) {
  return `<span class="fallback"><span class="corner tl">${card.rank}<i>${card.mark}</i></span>`
    + `<span class="pip">${card.mark}</span>`
    + `<span class="corner br">${card.rank}<i>${card.mark}</i></span></span>`;
}
function faceImgHTML(card) {
  return `<img class="face-img" src="${cardSrc(cardImageName(card))}" alt="" draggable="false" decoding="async"`
    + ` onload="this.parentNode.classList.add('img-ok')"`
    + ` onerror="this.parentNode.classList.add('img-failed');this.remove()">`;
}
function cardHTML(card, button = false, playable = false, ghost = false) {
  const cls = `card ${card.color}${playable ? ' can-play' : ''}${card.forced ? ' forced' : ''}${ghost ? ' ghost' : ''}`;
  const label = `${card.name}の${card.rank}`;
  const content = fallbackHTML(card) + faceImgHTML(card);
  return button
    ? `<button class="${cls}" type="button" data-key="${card.key}" ${playable ? '' : 'disabled'} aria-label="${label}">${content}</button>`
    : `<div class="${cls}" role="img" aria-label="${label}">${content}</div>`;
}
function isConnectedToSeven(card) {
  if (!state.board[card.key]) return false;
  const visited = new Set([7]);
  const stack = [7];
  while (stack.length) {
    const value = stack.pop();
    const neighbors = [value - 1, value + 1];
    if (state.rule === 'special') {
      if (value === 1) neighbors.push(13);
      if (value === 13) neighbors.push(1);
    }
    neighbors.forEach(next => {
      if (next >= 1 && next <= 13 && !visited.has(next) && state.board[`${card.id}-${next}`]) {
        visited.add(next); stack.push(next);
      }
    });
  }
  return visited.has(card.value);
}
function isGhost(card) { return Boolean(card.forced && !isConnectedToSeven(card)); }
function isPlayable(card) {
  if (state.board[card.key]) return false;
  const has = value => {
    const neighbor = state.board[`${card.id}-${value}`];
    return neighbor && isConnectedToSeven(neighbor);
  };
  if (has(card.value - 1) || has(card.value + 1)) return true;
  if (state.rule === 'special' && ((card.value === 1 && has(13)) || (card.value === 13 && has(1)))) return true;
  return false;
}
function setMessage(text) { $('message').textContent = text; }
function activePlayers() { return state.players.filter(p => !p.eliminated && !p.done); }
function startGame() {
  /* ★ まえの 試合の タイマーを ぜんぶ 無効に する（later() を 見てね）。
     ここを わすれると、まえの 回の 手番が 新しい 回に 割りこんで、
     自分の 番が 1回 まるごと 飛ぶ。 */
  state.epoch += 1;
  state.players = [{ name:'あなた', human:true, cards:[], passes:0, eliminated:false, done:false }];
  const count = Number($('cpuCount').value);
  for (let i=1;i<=count;i++) state.players.push({ name:`ロボット${i}`, human:false, cards:[], passes:0, eliminated:false, done:false });
  /* ★ふだんは 画面に <select> が ないので、固定の 値が そのまま 入る。
     戻したく なったら index.html に <select> を 足すだけで よい。 */
  const ruleEl = $('ruleMode'), speedEl = $('gameSpeed');
  state.board = {}; state.current = 0; state.rule = ruleEl ? ruleEl.value : FIXED_RULE; state.speed = speedEl ? speedEl.value : FIXED_SPEED; state.finishOrder = []; state.finished = false; state.busy = false;
  const deck = shuffle(createDeck());
  deck.forEach((c,i) => state.players[i % state.players.length].cards.push(c));
  state.players.forEach(p => { p.cards.sort((a,b) => SUITS.findIndex(s => s.id === a.id) - SUITS.findIndex(s => s.id === b.id) || a.value - b.value); });
  // Seven cards form the cheerful starting cross automatically.
  state.players.forEach(p => { p.cards = p.cards.filter(c => { if (c.value === 7) { state.board[c.key] = c; return false; } return true; }); });
  $('startScreen').classList.add('hidden'); $('gameScreen').classList.remove('hidden');
  render(); beginTurn();
}
function render() { renderBoard(); renderPlayers(); renderHand(); updateTurn(); }
/* ★盤は「置ける ばしょ」を 先に 光らせない（設計図 §5.5・社長裁定）。
   まえは 空いた ますごとに isPlayable を 計算して .playable を つけていたが、
   その しるしは 遊ぶ人の 判断に 使われて いなかった（73%は 自分の 手札に ない 札の ばしょ）。
   ★出せる 札の しるしは 手札の .can-play だけ。そちらは renderHand に のこして ある。 */
function renderBoard() {
  $('board').innerHTML = SUITS.map(s => `<div class="board-row">${Array.from({length:13},(_,i) => { const c=state.board[`${s.id}-${i+1}`]; return `<div class="board-cell">${c ? cardHTML(c, false, false, isGhost(c)) : ''}</div>`; }).join('')}</div>`).join('');
}
function renderPlayers() {
  $('cpuArea').innerHTML = state.players.filter(p => !p.human).map(p => `<div class="cpu ${p.eliminated ? 'eliminated':''}"><div class="cpu-name">🤖 ${p.name}<small>${p.done ? 'ゴール！' : `パス ${p.passes}/4 ・ ${p.cards.length}枚`}</small></div><div class="cpu-cards">${Array.from({length:Math.min(p.cards.length,14)},()=>'<span class="cpu-card"></span>').join('')}</div></div>`).join('');
}
/* ============================================================
   ★ fitHand() ― 手札を かならず 箱の 中に おさめる（T115）
   ------------------------------------------------------------
   もんだい（実測・320×568）：手札の 箱は 284px、17枚 ならべると 716px。
   **432px が 右に かくれていた**。しかも かくれていることを 知らせる ものが
   何も 無い。出せる札が その中に 全部 いると、画面の 上では
   「光ってる札が 1枚も ない」ように 見えて、出せるのに パスして しまう。
   パスは 4回で 脱落なので、**負けに 直結する 故障**だった。

   なおし方：入りきらない ぶんだけ、札を **かさねて 詰める**。
   トランプを 手に 持ったときと 同じ形。設計図 追記③ の
   「①静かに詰める（気づかれない）→ それでも無理なら見切れる」の ①。

   ★札は 小さく しない。38×57.58px の まま。けずるのは すきまだけ。
   ★入りきる ときは 何も しない（--fan = 0）＝ 大きい画面・終盤は 今までと 同じ。
   ★どの札も 左はしの 角（数字と マークの 所）は かならず 出るので、
     どの札を 持っているかは ぜんぶ 読める。オレンジの 光りも 左べりと
     上べりに 出る ので、出せる札は かさなっていても 分かる。
   ★ここは 見た目だけ。手番・busy・epoch には いっさい さわらない。
   ============================================================ */
function fitHand() {
  const hand = $('humanHand');
  const n = hand.children.length;
  hand.style.setProperty('--fan', '0px');
  if (n < 2) return;
  const cs = getComputedStyle(hand);
  const pad = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
  const gap = parseFloat(cs.columnGap) || 0;
  const cardW = hand.firstElementChild.getBoundingClientRect().width;
  if (!cardW) return;
  /* 2回まで やり直す：1回目で スクロールバーが 消えると 箱の はばが
     広がる ことが ある（パソコン）。その ぶんを 見て 計算し直す。 */
  for (let i = 0; i < 2; i++) {
    const avail = hand.clientWidth - pad;
    const over = (cardW * n + gap * (n - 1)) - avail;
    if (over <= 0.5) { hand.style.setProperty('--fan', '0px'); return; }
    hand.style.setProperty('--fan', (Math.ceil((over / (n - 1)) * 100) / 100) + 'px');
    if (hand.scrollWidth <= hand.clientWidth + 0.5) return;
  }
}
function renderHand() {
  const human = state.players[0]; const isTurn = !state.finished && state.current === 0 && !state.busy;
  $('humanHand').innerHTML = human.cards.map(c => cardHTML(c,true,isTurn && isPlayable(c))).join('');
  fitHand();
  $('handCount').textContent = `${human.cards.length}枚`;
  $('passBtn').disabled = !isTurn;
  // のこり0かい＝つぎの パスで おしまい。押せるままにして、言葉だけで しらせる。
  const passLeft = Math.max(0, 3 - human.passes);
  $('passText').textContent = passLeft === 0 ? '次おすと おしまい' : `残り${passLeft}回`;
  $('passBubbles').innerHTML = Array.from({length:4},(_,i)=>`<span class="pass-dot ${i < human.passes ? 'used':''}"></span>`).join('');
}
function updateTurn() { const p=state.players[state.current]; $('turnBadge').textContent = state.finished ? 'ゲーム終わり！' : (p.human ? 'あなたの番！' : `${p.name}の番`); }
function playCard(player, key) {
  const card = player.cards.find(c => c.key === key); if (!card || !isPlayable(card)) return false;
  state.board[key] = card; player.cards = player.cards.filter(c => c.key !== key);
  if (player.cards.length === 0) { player.done = true; state.finishOrder.push(player); setMessage(`${player.name}が ゴール！ 今 ${state.finishOrder.length}位だよ。`); return true; }
  setMessage(`${player.name}は ${card.mark}${card.rank}を出したよ！`); return true;
}
function forceCardsToBoard(player) {
  player.cards.forEach(card => { state.board[card.key] = { ...card, forced: true }; });
  player.cards = [];
  player.eliminated = true;
}
function pass(player) {
  /* ★ 5回目の パスを 受けつけない（T94 §3）。
     4回で おしまいなので、それ いじょう 数を ふやさない。 */
  if (player.eliminated || player.done || player.passes >= 4) return false;
  player.passes++;
  if (player.passes >= 4) {
    forceCardsToBoard(player);
    setMessage(`${player.name}は 4回パスしたので おしまい。手札は場に並んだよ。`);
  } else {
    setMessage(`${player.name}は パスした（${player.passes}/4）`);
  }
  return true;
}
/* ★ 人の 1手（T94 §2・§3 の 🔴 2件は ここが 原因だった）
   ------------------------------------------------------------
   出す／パスが 通ったら ★その場で state.busy = true。
   すると renderHand の isTurn が false に なって 手札も パスボタンも
   おせなく なり、★1回の 手番で 出せるのは 1枚・パスは 1回 だけに なる。
   ⚠️ busy を false に もどすのは beginTurn の しごと（1か所に まとめる）。
      ここで もどすと、手番が まだなのに おせる すきまが できる。
   ⚠️ ★手が「消える」ことは ない：手番が 来た しゅんかん beginTurn が
      busy を false に するので、★ゆっくり おした ぶんは 今までどおり 全部 通る。
      止めているのは「同じ 手番の 2手目 いこう」だけ。
   ★大富豪の onPlay / onPass と まったく 同じ 形。 */
function humanPlay(event) {
  const b = event.target.closest('[data-key]');
  if (!b || state.current !== 0 || state.busy || state.finished) return;
  if (!playCard(state.players[0], b.dataset.key)) return;
  state.busy = true;
  render();
  later(nextTurn, SPEEDS[state.speed].next);
}
function humanPass() {
  if (state.current !== 0 || state.busy || state.finished) return;
  if (!pass(state.players[0])) return;
  state.busy = true;
  render();
  later(nextTurn, SPEEDS[state.speed].next);
}
function beginTurn() {
  if (state.finished) return; const p=state.players[state.current];
  if (p.eliminated || p.done) return nextTurn();
  state.busy = !p.human; render();
  if (p.human) { state.busy=false; render(); setMessage('光ってるカードを選んでね。なければ パス！'); return; }
  setMessage(`${p.name}は考え中…`);
  later(() => { if (state.finished) return; const choices=p.cards.filter(isPlayable); if (choices.length) { const centerChoices=choices.sort((a,b)=>Math.abs(a.value-7)-Math.abs(b.value-7)); playCard(p, centerChoices[Math.floor(Math.random()*Math.min(2,centerChoices.length))].key); } else pass(p); render(); later(nextTurn, SPEEDS[state.speed].next); }, SPEEDS[state.speed].think);
}
function nextTurn() { if (state.finished) return; if (activePlayers().length <= 1) return finishGame(); let checks=0; do { state.current=(state.current+1)%state.players.length; checks++; } while ((state.players[state.current].eliminated || state.players[state.current].done) && checks <= state.players.length); beginTurn(); }
function finishGame() {
  if (state.finished) return;
  const lastPlayer = activePlayers()[0];
  const eliminated = state.players.filter(p => p.eliminated).reverse();
  const ranking = [...state.finishOrder, ...(lastPlayer ? [lastPlayer] : []), ...eliminated];
  state.finished=true; state.busy=false; render();
  const rows = ranking.map((player, index) => {
    const place = index + 1;
    const note = player.eliminated ? 'パスで おしまい' : (player === lastPlayer ? '最後まで残った' : '手札を全部並べた');
    return `<li class="${player.human ? 'is-human' : ''}"><span class="place">${place}位</span><span>${player.human ? '🐱 あなた' : `🤖 ${player.name}`}</span><small>${note}</small></li>`;
  }).join('');
  const humanPlace = ranking.indexOf(state.players[0]) + 1;
  $('resultContent').innerHTML = `<h2>🏆 順位発表！</h2><p class="winner">あなたは ${humanPlace}位だったよ！</p><ol class="ranking">${rows}</ol>`;
  later(()=>$('resultDialog').showModal(), 300);
}

/* ★ 最初の画面に もどる ―― ここで epoch を ふやして、
   まえの 試合の のこり タイマーを ぜんぶ 無効に する（大富豪の backToStart と 同じ）。 */
function backToStart() {
  state.finished = true;
  state.busy = true;
  state.epoch += 1;
  $('gameScreen').classList.add('hidden'); $('startScreen').classList.remove('hidden');
}

/* 画面を まわしたり 幅が 変わったら、詰め直す（T115）。
   ここは 見た目だけ。手番にも state にも さわらない。 */
window.addEventListener('resize', fitHand);
$('startBtn').addEventListener('click', startGame); $('humanHand').addEventListener('click', humanPlay); $('passBtn').addEventListener('click', humanPass); $('restartBtn').addEventListener('click', backToStart); $('resultRestart').addEventListener('click', () => { $('resultDialog').close(); backToStart(); }); $('howtoBtn').addEventListener('click', ()=>$('helpDialog').showModal()); document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.close).close()));
