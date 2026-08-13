const SUITS = [
  { id: 'spades', mark: '♠', name: 'スペード', color: 'black' },
  { id: 'hearts', mark: '♥', name: 'ハート', color: 'red' },
  { id: 'diamonds', mark: '♦', name: 'ダイヤ', color: 'red' },
  { id: 'clubs', mark: '♣', name: 'クラブ', color: 'black' },
];
const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const SPEEDS = { slow: { think: 1500, next: 1050 }, normal: { think: 800, next: 650 }, fast: { think: 350, next: 280 } };
const state = { players: [], board: {}, current: 0, rule: 'normal', speed: 'normal', finishOrder: [], busy: false, finished: false };
const $ = (id) => document.getElementById(id);

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
  state.players = [{ name:'あなた', human:true, cards:[], passes:0, eliminated:false, done:false }];
  const count = Number($('cpuCount').value);
  for (let i=1;i<=count;i++) state.players.push({ name:`ロボット${i}`, human:false, cards:[], passes:0, eliminated:false, done:false });
  state.board = {}; state.current = 0; state.rule = $('ruleMode').value; state.speed = $('gameSpeed').value; state.finishOrder = []; state.finished = false; state.busy = false;
  const deck = shuffle(createDeck());
  deck.forEach((c,i) => state.players[i % state.players.length].cards.push(c));
  state.players.forEach(p => { p.cards.sort((a,b) => SUITS.findIndex(s => s.id === a.id) - SUITS.findIndex(s => s.id === b.id) || a.value - b.value); });
  // Seven cards form the cheerful starting cross automatically.
  state.players.forEach(p => { p.cards = p.cards.filter(c => { if (c.value === 7) { state.board[c.key] = c; return false; } return true; }); });
  $('startScreen').classList.add('hidden'); $('gameScreen').classList.remove('hidden');
  render(); beginTurn();
}
function render() { renderBoard(); renderPlayers(); renderHand(); updateTurn(); }
function renderBoard() {
  $('board').innerHTML = SUITS.map(s => `<div class="board-row">${Array.from({length:13},(_,i) => { const key=`${s.id}-${i+1}`, c=state.board[key]; const available=!c && isPlayable({ ...s, value:i+1, rank:RANKS[i], key }); return `<div class="board-cell ${available ? 'playable':''}">${c ? cardHTML(c, false, false, isGhost(c)) : ''}</div>`; }).join('')}</div>`).join('');
}
function renderPlayers() {
  $('cpuArea').innerHTML = state.players.filter(p => !p.human).map(p => `<div class="cpu ${p.eliminated ? 'eliminated':''}"><div class="cpu-name">🤖 ${p.name}<small>${p.done ? 'ゴール！' : `パス ${p.passes}/4 ・ ${p.cards.length}まい`}</small></div><div class="cpu-cards">${Array.from({length:Math.min(p.cards.length,14)},()=>'<span class="cpu-card"></span>').join('')}</div></div>`).join('');
}
function renderHand() {
  const human = state.players[0]; const isTurn = !state.finished && state.current === 0 && !state.busy;
  $('humanHand').innerHTML = human.cards.map(c => cardHTML(c,true,isTurn && isPlayable(c))).join('');
  $('handCount').textContent = `${human.cards.length}まい`;
  $('passBtn').disabled = !isTurn;
  // のこり0かい＝つぎの パスで おしまい。押せるままにして、言葉だけで しらせる。
  const passLeft = Math.max(0, 3 - human.passes);
  $('passText').textContent = passLeft === 0 ? 'つぎ おすと おしまい' : `のこり ${passLeft}かい`;
  $('passBubbles').innerHTML = Array.from({length:4},(_,i)=>`<span class="pass-dot ${i < human.passes ? 'used':''}"></span>`).join('');
}
function updateTurn() { const p=state.players[state.current]; $('turnBadge').textContent = state.finished ? 'ゲーム おわり！' : (p.human ? 'あなたの ばん！' : `${p.name}の ばん`); }
function playCard(player, key) {
  const card = player.cards.find(c => c.key === key); if (!card || !isPlayable(card)) return false;
  state.board[key] = card; player.cards = player.cards.filter(c => c.key !== key);
  if (player.cards.length === 0) { player.done = true; state.finishOrder.push(player); setMessage(`${player.name}が ゴール！ いま ${state.finishOrder.length}い だよ。`); return true; }
  setMessage(`${player.name}は ${card.mark}${card.rank}を だしたよ！`); return true;
}
function forceCardsToBoard(player) {
  player.cards.forEach(card => { state.board[card.key] = { ...card, forced: true }; });
  player.cards = [];
  player.eliminated = true;
}
function pass(player) {
  player.passes++;
  if (player.passes >= 4) {
    forceCardsToBoard(player);
    setMessage(`${player.name}は 4かい パスしたので おしまい。てふだは ばに ならんだよ。`);
  } else {
    setMessage(`${player.name}は パスした（${player.passes}/4）`);
  }
}
function humanPlay(event) { const b=event.target.closest('[data-key]'); if (!b || state.current !== 0 || state.busy || state.finished) return; if (playCard(state.players[0],b.dataset.key)) { render(); window.setTimeout(nextTurn, SPEEDS[state.speed].next); } }
function humanPass() { if (state.current !== 0 || state.busy || state.finished) return; pass(state.players[0]); render(); window.setTimeout(nextTurn, SPEEDS[state.speed].next); }
function beginTurn() {
  if (state.finished) return; const p=state.players[state.current];
  if (p.eliminated || p.done) return nextTurn();
  state.busy = !p.human; render();
  if (p.human) { state.busy=false; render(); setMessage('ひかってる カードを えらんでね。なければ パス！'); return; }
  setMessage(`${p.name}は かんがえちゅう…`);
  window.setTimeout(() => { if (state.finished) return; const choices=p.cards.filter(isPlayable); if (choices.length) { const centerChoices=choices.sort((a,b)=>Math.abs(a.value-7)-Math.abs(b.value-7)); playCard(p, centerChoices[Math.floor(Math.random()*Math.min(2,centerChoices.length))].key); } else pass(p); render(); window.setTimeout(nextTurn, SPEEDS[state.speed].next); }, SPEEDS[state.speed].think);
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
    const note = player.eliminated ? 'パスで おしまい' : (player === lastPlayer ? 'さいごまで のこった' : 'てふだ ぜんぶ ならべた');
    return `<li class="${player.human ? 'is-human' : ''}"><span class="place">${place}い</span><span>${player.human ? '🐱 あなた' : `🤖 ${player.name}`}</span><small>${note}</small></li>`;
  }).join('');
  const humanPlace = ranking.indexOf(state.players[0]) + 1;
  $('resultContent').innerHTML = `<h2>🏆 じゅんい はっぴょう！</h2><p class="winner">あなたは ${humanPlace}い だったよ！</p><ol class="ranking">${rows}</ol>`;
  window.setTimeout(()=>$('resultDialog').showModal(), 300);
}

$('startBtn').addEventListener('click', startGame); $('humanHand').addEventListener('click', humanPlay); $('passBtn').addEventListener('click', humanPass); $('restartBtn').addEventListener('click', () => { $('gameScreen').classList.add('hidden'); $('startScreen').classList.remove('hidden'); }); $('resultRestart').addEventListener('click', () => { $('resultDialog').close(); $('gameScreen').classList.add('hidden'); $('startScreen').classList.remove('hidden'); }); $('howtoBtn').addEventListener('click', ()=>$('helpDialog').showModal()); document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.close).close()));
