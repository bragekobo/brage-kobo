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
  syncQuit();                /* ★T277：上の帯の「↻ やめる」を 出す */
  render(); beginTurn();
}

/* ★★ T277 ―「↻ やめる」を 出す／消す（★設計図 追記⑩）★★
   ★ 上の帯は はじめの 画面でも 出て いるので、★ボタンだけを 出し入れ します。
   ★ あちこちに 書くと 1か所 書き忘れて ずれる ので、
     ★「遊ぶ 画面が 出て いるか」を そのまま 見る 形に しました（★1か所だけ）。 */
function syncQuit() {
  const b = $('restartBtn');
  if (!b) return;
  b.classList.toggle('hidden', $('gameScreen').classList.contains('hidden'));
}
function render() { renderBoard(); renderPlayers(); renderHand(); updateTurn(); }
/* ★盤は「置ける ばしょ」を 先に 光らせない（設計図 §5.5・社長裁定）。
   まえは 空いた ますごとに isPlayable を 計算して .playable を つけていたが、
   その しるしは 遊ぶ人の 判断に 使われて いなかった（73%は 自分の 手札に ない 札の ばしょ）。
   ★出せる 札の しるしは 手札の .can-play だけ。そちらは renderHand に のこして ある。 */
function renderBoard() {
  const el = $('board');
  /* ★T290：★盤を すべらせた 場所を 覚えておく（★0円の 保険）。
     ★ ★⚠️ ★はじめ 私は ここに「innerHTML を 入れ直すと すべりは 0 に 戻ります【実測】」と
     ★ ★★書きました。★★**それは うそでした**（★測って いない 数字を 書いて いました）。
     ★ ★★★測り直した 本当の ところ【★実測・T290-15・667×375】：
     ★ ★ ・★いまの 書き方（★同じ 中身を そのまま 入れ直す）… ★すべり **120 → 120**（★保たれる）
     ★ ★ ・★一度 からっぽに して から 入れ直す 書き方 …… ★すべり **120 → 0**（★消える）
     ★ ★ ・★入れものごと 作り直す 書き方 ……………………… ★すべり **120 → 0**（★消える）
     ★ ★→ ★いまは 無くても 困りません。★★それでも 置くのは、★あとで ここを 2段に 書き直した
     ★ ★★とたん、★★★「右を 見に 行ったのに ロボットが 1枚 出すと 左へ 飛ばされる」が
     ★ ★★だまって 生える から です。★3行・0円。 */
  const keep = el.scrollLeft;
  el.innerHTML = SUITS.map(s => `<div class="board-row">${Array.from({length:13},(_,i) => { const c=state.board[`${s.id}-${i+1}`]; return `<div class="board-cell">${c ? cardHTML(c, false, false, isGhost(c)) : ''}</div>`; }).join('')}</div>`).join('');
  el.scrollLeft = keep;
  boardHint();
}
/* ============================================================
   ★★ boardHint() ― ★T290：★「まだ こっちに つづくよ」の しるしを 出し引きする
   ------------------------------------------------------------
   ★ ★もんだい（★T287 実測）：★はば 651〜806px では 盤が 最大 156px 切れて いて、
     ★ ★★しかも **すべれません** でした（★667×375 で 20試合中 19試合、★最大6枚の 札が
     ★ ★★★「置かれたのに 1回も 見えない まま」終わって いました）。
   ★ ★CSS の ほう（★style.css T290-①）で すべれる ように しました。★ここは その **しるし**。
   ★ ★★T115 の 教え ―― ★**見切れて いる ことを 知らせる ものが 無いと、遊ぶ人は 気づかない**。

   ★ ★見た目だけ です。★手番・busy・epoch・state には **いっさい さわりません**。
   ★ ★出すか 消すかは **本当の すべり**（scrollLeft と scrollWidth）で 決めます
     ★ ★ ―― ★画面の はばで 決めると、★決まりを 1か所 直し忘れた ときに 鳴きません。
   ============================================================ */
function boardHint() {
  const el = $('board');
  const wrap = el && el.closest ? el.closest('.table-wrap') : null;
  if (!el || !wrap) return;
  /* ★ ⚠️ ★scrollWidth が clientWidth より 大きい ＝ すべれる、では ありません。
     ★ ★`overflow-x:visible` の ときも scrollWidth は ふくらみます【★実測・T290-03：
     ★ ★★812×375 で 36px・844×390 で 4px】。★そこで しるしを 出すと
     ★ ★★★「すべれるよ」と うそを つきます（★指で なぞっても 1pxも 動かない）。
     ★ ★→ ★**すべる 入れものに なって いる か**を 先に 見ます。 */
  const ox = getComputedStyle(el).overflowX;
  const nokori = el.scrollWidth - el.clientWidth;   /* ★ すべれる はば */
  const suberu = (ox === 'auto' || ox === 'scroll') && nokori > 1;
  const ima = el.scrollLeft;
  wrap.classList.toggle('more-right', suberu && ima < nokori - 1);
  wrap.classList.toggle('more-left',  suberu && ima > 1);
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
  syncQuit();                /* ★T277：上の帯の「↻ やめる」を 消す */
}

/* 画面を まわしたり 幅が 変わったら、詰め直す（T115）。
   ここは 見た目だけ。手番にも state にも さわらない。 */
window.addEventListener('resize', fitHand);
/* ★T290：★盤を 指で すべらせたら、★しるしを 出し引きする。
   ★ ★#board は 中身が 入れ替わるだけで **入れものは 同じ**なので、★聞くのは 1回きりで 足ります。
   ★ ★passive:true ＝ ★指の すべりを 1msも 遅く しない。 */
$('board').addEventListener('scroll', boardHint, { passive:true });
window.addEventListener('resize', boardHint);
$('startBtn').addEventListener('click', startGame); $('humanHand').addEventListener('click', humanPlay); $('passBtn').addEventListener('click', humanPass); $('restartBtn').addEventListener('click', backToStart); $('resultRestart').addEventListener('click', () => { $('resultDialog').close(); backToStart(); }); $('howtoBtn').addEventListener('click', ()=>$('helpDialog').showModal()); document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.close).close()));

/* ============================================================
   ★★★ T281 ― この本 はじめての 見張り（★正直に：★七並べには 見張りが 1つも ありません でした）★★★
   ★ ★いまは「↻ の しるし」1つ ぶんだけ です。★ほかの 目は まだ ありません。
   ★ ★使い方：★ブラウザの 開発者ツールで `SEVEN.verify()`。
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

/* ============================================================
   ★★★ T285 ―「上の帯が 画面に くっついて いるか」の 見張り（★💻コーダ・2026-09-13）★★★
   ------------------------------------------------------------
   ★ ★なぜ 要るか【★実測・T285・★トライ T283 と 同じ 数字】：
     ★ ★遊んで いる あいだ、★**12画面中 9画面**で「↻ やめる」も「◀」も 画面の 外に 出て いました。
     ★ ★★七並べの 見張りは この日まで「しるし1つ」だけ で、★**この 穴を 1つも 見て いません でした**。
   ★ ★見る 目は 7つ：
     ★ ①帯が `position:sticky` である
     ★ ②帯と 画面の あいだに「すべる 入れ物」が **1つも いない**
        ★ ★（★これが この本の 本当の 犯人。★`.app-shell{overflow:hidden}` が いると
        ★ ★★sticky は 1pxも 効きません ―― ★★実測で 帯の 上 **−498px**）
     ★ ③**本当に すべらせて** 帯が 画面の 中に 残る（★数字だけでは なく 動かして 見る）
     ★ ④「やめる」と「◀」が 画面の 中に いて、★**まん中が 押せる**
     ★ ⑤指の 的 44×44
     ★ ⑥ふたが 指を 取って いない（`pointer-events:none`）・★帯の 中身より うしろ
     ★ ⑦CSS の 写し（`--bar-h`・`--bar-over`・`--bar-sky`）が **本当の 数と 合って いる**
        ★ ★（★追記⑥ 決まり2 の 形。★帯の 高さを 変えたのに 写しを 直し忘れたら 鳴る）
   ⚠️★ ③は **ページが すべる 画面でしか 鳴きません**。★すべらない 画面（★320×568 等）では
     ★ ★「すべれないので 見なかった」と 正直に 返します（★アト T279 の しくじりと 同じ 穴を 開けない）。
   ⚠️★ さわった もの（scrollY）は 1つ 残らず 戻します（★T144 §7-5）。
   ★ ★名前の ぶつかり：`t285BarCheck` は この ファイルに 1つも ありません（★先に 数えました）。
   ============================================================ */

/* ============================================================
   ★★★ T295 ―― ★「箱が 開いて いる」ことを 見張りに 教える 1つの 関数（★💻コーダ・2026-09-14）
   ------------------------------------------------------------
   ★ ★なぜ 要るか【★実測・T295-01・★12画面 × 4場面】：
   ★ ★★`showModal()` で 箱（`<dialog>`）が 開いて いる あいだ、
   ★ ★★★**箱の 外の ボタンは ブラウザの 決まりで 押せません**（★上に 幕 `::backdrop` が かかる）。
   ★ ★★そこを 指で つつくと 返って くるのは ★**その `dialog` 自身**です。
   ★ ★★→ ★T285 の 見張りは それを「ボタンが 押せない」と 読んで、
   ★ ★★★**12画面 × 2場面 × 3すべり × 2ボタン ＝ 120件**の うそ鳴きを していました
   ★ ★★★（★控えの 版でも まったく 同じ 120件【★実測・T295-01・MAE=1】）。
   ★ ★★＝ ★「★傷の ない ところで 鳴る 赤ランプ」（★アト T277）。
   ★
   ⚠️★★ ここで ★**鳴らなく する のでは ありません**。★★見送るのは 次の ときだけ です：
   ★ ★① ★箱（`:modal`）が 開いて いる　★かつ
   ★ ★② ★そのボタンが ★**箱の 外**に いる　★かつ
   ★ ★③ ★指が さした 先が ★**その 箱 そのもの**（＝ 幕）である
   ★ ★→ ★①〜③が ぜんぶ そろった ときだけ「ブラウザの 決まり」と 見て 見送ります。
   ★ ★★★箱の **中**の ボタンは これまで どおり 見ます。
   ★ ★★★箱の 外でも、さした 先が ★**箱 以外の 何か**なら ★**これまで どおり 鳴きます**
   ★ ★★★（★＝ 本当に 何かが かぶさって いる ときは 見のがしません）。
   ★
   ★ ★先に 同じ ことを した 人：★💻コーダ T184（大富豪 `verify.js` の「私の 失敗②」）――
   ★ ★★「★ふたの 外の ボタンを いっしょに 測って **62件 空うち**した」。★同じ 穴です。
   ============================================================ */
function t295HakoNoSoto(el, atatta, doc) {
  doc = doc || document;
  var ds = doc.querySelectorAll('dialog[open]'), hako = [], i;
  for (i = 0; i < ds.length; i++) {
    try { if (ds[i].matches(':modal')) hako.push(ds[i]); } catch (e) { hako.push(ds[i]); }  /* ★ 古い ブラウザは open だけで 見る */
  }
  if (!hako.length) return false;                                        /* ★① 箱が 1つも 開いて いない → ふつうに 見る */
  for (i = 0; i < hako.length; i++) if (el && hako[i].contains(el)) return false;  /* ★② ボタンが 箱の 中 → ふつうに 見る */
  for (i = 0; i < hako.length; i++) {                                    /* ★③ さした 先が 箱 → ブラウザの 決まり */
    if (atatta && (atatta === hako[i] || hako[i].contains(atatta))) return true;
  }
  return false;                                                          /* ★ 箱 以外の ものが かぶって いる → ★鳴かせる */
}
try { window.__t295HakoNoSoto = t295HakoNoSoto; } catch (e) {}

function t285BarCheck(doc, win) {
  var bad = [];
  var bar = doc.querySelector('.topbar');
  if (!bar) return ['★★★上の帯（.topbar）が ありません'];

  var cs = win.getComputedStyle(bar);

  /* ① くっつく 指定が あるか（★`static` に 戻したら ここで 鳴る）*/
  if (cs.position !== 'sticky') {
    bad.push('★★★帯が position:' + cs.position + ' です（★sticky の はず）'
      + ' ―― ★これだと 遊んで いる あいだ「やめる」も「◀」も 画面の 外に 出ます【★実測 9/12画面】');
  }

  /* ② 帯と 画面の あいだに「すべる 入れ物」が いないか
     ★ ★overflow が visible / clip 以外の 親が 1つでも いると sticky は 効かない。
     ⚠️★ ただし **body と html は 数えない**。★この 2つの overflow は
       ★ ★**画面（ビューポート）に 移される**ので、★body 自身は 入れ物に なりません。
       ★ ★★私は ここで 1回 うそ鳴きさせました ―― ★`body{overflow-x:hidden}` を
       ★ ★★★「じゃま者」と 数えて、★★傷の ない 5画面で 5回 鳴きました【★T285-11】。 */
  var oya = bar.parentElement, jama = [];
  while (oya && oya !== doc.documentElement && oya !== doc.body) {
    var o = win.getComputedStyle(oya);
    var warui = function (v) { return v && v !== 'visible' && v !== 'clip'; };
    if (warui(o.overflowX) || warui(o.overflowY)) {
      jama.push((oya.className || oya.tagName) + '{overflow:' + o.overflowX + ' ' + o.overflowY + '}');
    }
    oya = oya.parentElement;
  }
  if (jama.length) {
    bad.push('★★★帯の 親に「すべる 入れ物」が ' + jama.length + 'つ います：' + jama.join(' / ')
      + ' ―― ★この 中の sticky は **1pxも 効きません**（★実測・帯の 上 −498px）');
  }

  /* ⑦ CSS の 写しが 本当の 数と 合って いるか */
  var rs = win.getComputedStyle(doc.documentElement);
  var v = function (n) { return parseFloat(rs.getPropertyValue(n)); };
  var barH = v('--bar-h'), over = v('--bar-over');
  var honto = bar.getBoundingClientRect().height;
  if (isNaN(barH)) bad.push('★★--bar-h が ありません');
  else if (Math.abs(barH - honto) > 0.6) {
    bad.push('★★--bar-h が ' + barH + 'px なのに 帯は 本当は ' + honto.toFixed(1) + 'px です'
      + '（★帯の 高さを 変えたら 写しも 直す ―― ★追記⑥ 決まり2）');
  }
  if (isNaN(over)) bad.push('★★--bar-over が ありません');

  /* ⑥ ふた（.topbar::before）の 決まり */
  var futa = win.getComputedStyle(bar, '::before');
  if (futa.content === 'none' || futa.content === '') {
    bad.push('★★★ふた（.topbar::before）が ありません ―― ★すべると 札や 字が 帯の 中を すりぬけて 見えます');
  } else {
    if (futa.pointerEvents !== 'none') bad.push('★★ふたが 指を 取って います（pointer-events:' + futa.pointerEvents + '）');
    if (parseFloat(futa.zIndex) >= 0) bad.push('★★ふたが 帯の 中身より 前に います（z-index:' + futa.zIndex + '）');
    /* ⑧ ふたの 色が **body の 空と 同じ** か（★空の 色を 変えて ふたを 直し忘れたら 鳴る）*/
    var iro = function (s) { var m = String(s).match(/rgba?\([^)]+\)/g); return m ? m.join('|') : ''; };
    var sora = iro(win.getComputedStyle(doc.body).backgroundImage);
    var futaIro = iro(futa.backgroundImage);
    if (sora && futaIro && sora !== futaIro) {
      bad.push('★★★ふたの 色が 空と ちがいます ―― ★空 [' + sora + ']／ふた [' + futaIro + ']'
        + '（★すべって いない ときに 画素が ちがって しまいます）');
    }
  }
  /* ★ 帯が 手札より 前に いるか（★この本の 手札は 指を のせると z-index:10 に なる）*/
  if (!(parseFloat(cs.zIndex) > 10)) {
    bad.push('★★帯の z-index が ' + cs.zIndex + ' です（★手札は 指を のせると 10 に なるので、それより 大きく）');
  }

  /* ★ ふた（::before）には DOM が ないので 箱を 直に 測れません。
     ★ ★帯の 箱＋4つの ずれ（top/bottom/left/right）から 組み立てます。
     ★ ★★帯には わく も 内よはく も ないので、帯の 箱＝内がわの 箱 です。 */
  function futaRect() {
    var f = win.getComputedStyle(bar, '::before');
    if (f.content === 'none' || f.content === '') return null;
    var r = bar.getBoundingClientRect();
    var n = function (s) { var x = parseFloat(s); return isNaN(x) ? null : x; };
    var t = n(f.top), b = n(f.bottom), l = n(f.left), rr = n(f.right);
    if (t === null || b === null || l === null || rr === null) return null;
    return { top: r.top + t, bottom: r.bottom - b, left: r.left + l, right: r.right - rr };
  }

  /* ③④⑤ 本当に すべらせて 見る */
  var moto = win.scrollY;
  var subru = doc.documentElement.scrollHeight - win.innerHeight;
  var mita = false;
  /* ★ すべりを **その場で** 終わらせる（★なめらか送りだと 測る 前に 止まって いない）*/
  var tobu = function (y) { try { win.scrollTo({ top: y, behavior: 'instant' }); } catch (e) { win.scrollTo(0, y); } };
  try {
    var wasHidden = null;
    var q = doc.getElementById('restartBtn') || doc.querySelector('.quit-btn');
    if (q && q.classList.contains('hidden')) { wasHidden = q; q.classList.remove('hidden'); }

    var miru = function (doko, sutta) {
      var r = bar.getBoundingClientRect();
      if (r.top < -0.5) bad.push('★★★' + doko + '、帯が 画面の 上 ' + r.top.toFixed(1) + 'px に 出ました（★くっついて いない）');
      /* ⑨ ふたが 中身を 隠して いないか（★はじめ すそを 付けたら 8px 隠して いました・T285-06）
         ⑩ すべった とき、★ふたに すきまが ないか（★上・左・右） */
      var fr = futaRect();
      if (fr) {
        if (fr.bottom > r.bottom + 0.5) {
          bad.push('★★★' + doko + '、ふたが 帯より ' + (fr.bottom - r.bottom).toFixed(1) + 'px 下まで のびて います'
            + '（★すべって いない ときに 中身を そのぶん 隠します）');
        }
        if (sutta) {
          if (fr.top > 0.5) bad.push('★★★' + doko + '、ふたの 上に ' + fr.top.toFixed(1) + 'px の すきまが あります（★中身が すりぬけます）');
          if (fr.left > 0.5 || fr.right < win.innerWidth - 0.5) {
            /* ★★ T287 で 直した ところ（★2026-09-14・★💻コーダ）★★
               ★ ★T285 の この 目は ★**本物の 傷を 見つけて いました** ―― ★はば1180px を こえた 画面で
                 ★ ★器の 外が ふさがって おらず、★すべると そこだけ クリーム色に なる
                 ★ ★★（★1440×700 で 左130／右1310・★器の外 255,247,232／帯 188,235,240【★実測 T287-01】）。
               ★ ★T287 で ★**器の 外の ふた（body::before）**を 足して ふさぎました。
                 ★ ★→ ★その ふたが 効いて いる ときは 鳴らさない。★無い／効いて いない ときだけ 鳴らす。
                 ★ ★★（★でないと 傷の ない ところで 鳴る ただの 赤ランプに なります ―― ★アト T277）
               ★ ★★ふたの くわしい 決まり（★sticky・うしろ・たかさ・ページを のばさない・色）は
                 ★ ★★t287Check が 見て います。★★ここでは「ふさげて いるか」だけ。 */
            var soto = win.getComputedStyle(doc.body, '::before');
            var sotoOK = soto.content !== 'none' && soto.content !== ''
              && soto.position === 'sticky' && Math.abs(parseFloat(soto.top) || 0) < 0.6
              && parseFloat(soto.height) >= r.bottom - 0.6
              && win.getComputedStyle(doc.body).backgroundImage === soto.backgroundImage;
            if (!sotoOK) {
              bad.push('★★' + doko + '、ふたが 画面の よこ いっぱいに ありません（左' + fr.left.toFixed(1) + '／右' + fr.right.toFixed(1)
                + '／画面の はば' + win.innerWidth + '）―― ★器の 外の ふた（body::before）も ありません／効いて いません');
            }
          }
        }
      }
      /* ⚠️★ 44×44 の 床を 見るのは **「↻ やめる」だけ**です。
         ★ ★「◀」は 足す前から **44.0×36.0px／121.9×42.0px** で、★44px に 届いて いません
           ★ ★【★実測・T285・12画面とも】。★★これは T285 で 作った 傷では ないので、
           ★ ★★ここで 鳴らすと ★**傷の ない ところで 鳴る 赤ランプ**に なります（★アト T277）。
         ★ ★→ ★◀ は「画面の 中に いて まん中が 押せる」だけ 見ます。
           ★ ★★大きさの 件は 社長に お伝えして あります（★別の 仕事）。 */
      [['↻ やめる', q, true], ['◀ もどる', doc.querySelector('.topbar a[href="../"]'), false]].forEach(function (p) {
        var name = p[0], e = p[1], yuka44 = p[2];
        if (!e) { bad.push('★★' + name + ' が ありません'); return; }
        var b = e.getBoundingClientRect();
        if (b.width < 0.5 || b.height < 0.5) { bad.push('★★' + doko + '、' + name + ' の 大きさが 0 です'); return; }
        if (b.top < -0.5 || b.bottom > win.innerHeight + 0.5 || b.left < -0.5 || b.right > win.innerWidth + 0.5) {
          bad.push('★★★' + doko + '、' + name + ' が 画面の 外です（上' + b.top.toFixed(1) + ' 下' + b.bottom.toFixed(1)
            + ' 画面の たて' + win.innerHeight + '）');
        }
        var cx = Math.round(b.left + b.width / 2), cy = Math.round(b.top + b.height / 2);
        var t = doc.elementFromPoint(cx, cy);
        /* ★★ T295：★箱（`showModal()`）が 開いて いて、★この ボタンが その 外に いて、
           ★ ★★指の 先が その 箱（幕）なら ―― ★**ブラウザの 決まり**です。★傷では ありません。
           ★ ★★（★ここを 見なかった ため、★12画面×2場面 で **120件** うそ鳴きして いました）
           ★ ★★★箱の 中の ボタン・★箱 以外の ものが かぶって いる ときは ★**そのまま 鳴きます**。 */
        if (!(t && (t === e || e.contains(t))) && !t295HakoNoSoto(e, t, doc)) {
          bad.push('★★★' + doko + '、' + name + ' の まん中（' + cx + ',' + cy + '）が 押せません'
            + '（★そこに いるのは ' + (t ? (t.className || t.tagName) : 'なし') + '）');
        }
        if (yuka44 && (b.width < 43.99 || b.height < 43.99)) {
          bad.push('★★' + doko + '、' + name + ' が ' + b.width.toFixed(1) + '×' + b.height.toFixed(1) + 'px です（★44×44 の 床）');
        }
      });
    };

    miru('すべって いない とき', false);
    if (subru > 1) {
      mita = true;
      tobu(Math.round(subru / 2)); miru('まん中まで すべった とき', true);
      tobu(subru);                      miru('いちばん 下まで すべった とき', true);
    }
    if (wasHidden) wasHidden.classList.add('hidden');
  } finally {
    tobu(moto);
  }
  if (!mita) bad.push('（お知らせ）★この 画面は ページが すべらないので、★すべった ときは 見て いません');
  return bad;
}
try { window.__t285BarCheck = function () { return t285BarCheck(document, window); }; } catch (e) {}

window.SEVEN = window.SEVEN || {};
window.SEVEN.iconCheck = function () { return t281IconCheck(document, window); };
window.SEVEN.barCheck = function () { return t285BarCheck(document, window); };
/* ★ T287 ―― ★◀ の 44px と 器の 外の ふた */
window.SEVEN.backCheck = function () { return t287Check(document, window); };
/* ============================================================
   ★★★ T287 ―― ★見張り：★①「◀ ゲームを選ぶ」の 44px ／ ★③器の 外の ふた
   ★★★（★💻コーダ・2026-09-14・★社長のお決め「★3つとも 1（いま）」）★★★
   ------------------------------------------------------------
   ★★ なぜ 足すか ―― ★T285 の 見張りには、★**わざと 開けた 穴**が 2つ ありました。
     ★ ①「◀」の 44px を **見なかった**（★足す前からの 傷だったので、鳴らすと 赤ランプに なる）。
       ★ ★→ ★社長の お決めで 直したので、★★**ここから は 必ず 鳴る 側**に 上げます。
       ★ ★★これは 追記⑩ で 大富豪が やった のと 同じ 直し ―― ★★★「★測って 記録するが 鳴らさない」を やめる。
     ★ ②器の 外の ふたが **無かった**（★はば1180px 超で クリーム色）。★→ ★足したので 見張る。
   ------------------------------------------------------------
   ★★ 見る 目（★7つ）
     ★ ①「◀ ゲームを選ぶ」が **44×44 以上**（★追記⑩ の 床）
     ★ ②「◀」が **帯を のばして いない**（★帯の 高さ ＝ --bar-h。★のびると 盤が 下がる）
     ★ ③「◀」が **上に はみ出しすぎて いない**（★器の 内よはく を こえると 文書の 0px より 上＝切れる）
     ★ ④「◀」が **下に はみ出しすぎて いない**（★4px まで。★こえると 下の 中身を そのぶん 隠す）
     ★ ⑤外の ふた（body::before）が **ある**・sticky・top:0・うしろ・指を 取らない
     ★ ⑥外の ふたの **たかさ ＝ 帯が 止まる 所 ＋ 帯の たかさ**（★すきまも 出すぎも だめ）
     ★ ⑦外の ふたが **ページを 1pxも のばして いない**（★height と 同じだけ margin-bottom で 返す）
     ★ ＋★外の ふたの 色が **空と 1文字も 同じ**（★--bar-sky の 直し忘れも 鳴る）
   ⚠️★ `.howto`（？ 遊び方）と `.restart-mini` は **見ません**。★この2つは まだ 42/36px で、
     ★ ★社長の お指しは「◀ ゲームを選ぶ」1つ だけ です。★**傷の ない ところで 鳴らさない**（★アト T277）。
   ============================================================ */
function t287Check(doc, win) {
  var bad = [];
  var bar = doc.querySelector('.topbar');
  if (!bar) return ['★★★上の帯（.topbar）が ありません'];
  var back = doc.querySelector('.topbar a.back');
  if (!back) return ['★★★「◀ ゲームを選ぶ」（.topbar a.back）が ありません'];

  var rs = win.getComputedStyle(doc.documentElement);
  var v = function (n) { var x = parseFloat(rs.getPropertyValue(n)); return isNaN(x) ? null : x; };
  var barH = v('--bar-h'), over = v('--bar-over') || 0, padTop = v('--bar-pad-top');
  var br = bar.getBoundingClientRect();
  var b = back.getBoundingClientRect();

  /* ① 44×44 の 床 */
  if (b.width < 43.99 || b.height < 43.99) {
    bad.push('★★★「◀ ゲームを選ぶ」が ' + b.width.toFixed(1) + '×' + b.height.toFixed(1)
      + 'px です（★44×44 の 床・追記⑩）―― ★足す前は 44.0×36.0／121.9×42.0px で、★12画面とも 割って いました');
  }

  /* ② 帯を のばして いないか（★のびると 盤が そのぶん 下がる ＝ 追記③に 反する）*/
  if (barH !== null && Math.abs(br.height - barH) > 0.6) {
    bad.push('★★★帯が ' + br.height.toFixed(1) + 'px に なって います（★--bar-h は ' + barH + 'px）'
      + ' ―― ★「◀」を 太らせた ぶん 帯が のびると、★盤が そのぶん 下がります');
  }

  /* ③④ はみ出しの ゆくえ（★上は 器の 内よはく まで・★下は 4px まで）*/
  var ue = br.top - b.top;      /* ★ 帯の 上から どれだけ 上に 出て いるか */
  var shita = b.bottom - br.bottom;
  if (padTop !== null && ue > padTop + 0.6) {
    bad.push('★★★「◀」が 帯の 上に ' + ue.toFixed(1) + 'px 出て います（★器の 内よはくは ' + padTop + 'px）'
      + ' ―― ★すべって いない とき、★そのぶん 文書の 0px より 上に 出て **切れます**');
  }
  if (shita > 4.6) {
    bad.push('★★★「◀」が 帯の 下に ' + shita.toFixed(1) + 'px 出て います（★4px まで）'
      + ' ―― ★そのぶん 下の 中身を 隠します');
  }
  /* ★ 上に 出た ぶんは、★すべった とき 帯が 止まる 位置（--bar-over）で 受け止める 決まり */
  if (ue > over + 0.6) {
    bad.push('★★★「◀」が 帯の 上に ' + ue.toFixed(1) + 'px 出て いるのに、★--bar-over は ' + over + 'px です'
      + ' ―― ★すべった とき、★その さの ぶんだけ ボタンの 上が 画面の 外に 出ます');
  }

  /* ⑤⑥⑦ 器の 外の ふた（body::before）*/
  var soto = win.getComputedStyle(doc.body, '::before');
  if (soto.content === 'none' || soto.content === '') {
    bad.push('★★★器の 外の ふた（body::before）が ありません'
      + ' ―― ★はば1180px を こえた パソコンで、★すべると **器の 外だけ クリーム色**に なります'
      + '【★実測・1440×700／1280×620／1200×700・器の外 255,247,232／帯 188,235,240】');
  } else {
    if (soto.position !== 'sticky') {
      bad.push('★★★器の 外の ふたが position:' + soto.position + ' です（★sticky の はず）'
        + ' ―― ★`fixed` に すると **ページ中の 字が ぜんぶ 書き直されます**【★実測・T285・5685画素・さ84】');
    }
    if (Math.abs(parseFloat(soto.top) || 0) > 0.6) bad.push('★★器の 外の ふたの top が ' + soto.top + ' です（★0 の はず）');
    if (!(parseFloat(soto.zIndex) < 0)) bad.push('★★★器の 外の ふたが 中身より 前に います（z-index:' + soto.zIndex + '）―― ★盤を 隠します');
    if (soto.pointerEvents !== 'none') bad.push('★★器の 外の ふたが 指を 取って います（pointer-events:' + soto.pointerEvents + '）');
    var h = parseFloat(soto.height), mb = parseFloat(soto.marginBottom);
    var beki = over + br.height;
    if (isNaN(h) || Math.abs(h - beki) > 0.6) {
      bad.push('★★★器の 外の ふたの たかさが ' + soto.height + ' です（★帯の 下は ' + beki.toFixed(1) + 'px）'
        + ' ―― ★足りないと 帯の よこに すきまが 出、★出すぎると 器の 外だけ 空が のびます');
    }
    if (isNaN(mb) || Math.abs(h + mb) > 0.6) {
      bad.push('★★★器の 外の ふたが ページを ' + (h + mb).toFixed(1) + 'px のばして います'
        + ' ―― ★たかさと 同じだけ margin-bottom で マイナスに 返して ください（★盤が 下がります）');
    }
    /* ★ 色は **まるごと** くらべる。★rgb だけ くらべると --bar-sky の 直し忘れを 見のがす。 */
    var sora = win.getComputedStyle(doc.body).backgroundImage;
    if (sora && soto.backgroundImage && sora !== soto.backgroundImage) {
      bad.push('★★★器の 外の ふたの 色が 空と ちがいます ―― ★空 [' + sora + ']／ふた [' + soto.backgroundImage + ']'
        + '（★べた塗りに すると Chrome の 色の ゆらしが 消え、★5481〜9767画素 ちがいます【★T285-05】）');
    }
  }
  return bad;
}
try { window.__t287Check = function () { return t287Check(document, window); }; } catch (e) {}

/* ============================================================
   ★★★ T290 ―― ★見張り：★**盤が 切れて いない、★または すべれば 見える**
   ★★★（★💻コーダ・2026-09-14・★社長のお決め「★1. A案で 直す」）★★★
   ------------------------------------------------------------
   ★★ なぜ 足すか ―― ★T287 で 正直に 書いた とおり、
     ★ ★**いままでの 見張りは 帯と ◀ しか 見て おらず、★★盤を 1つも 見て いません でした。**
     ★ ★だから 1本目（2026-08-07）から **38日間**、★はば 651〜806px の 窓で
     ★ ★★盤が 切れて いる ことに 誰も 気づけませんでした。
   ------------------------------------------------------------
   ★★ 見る 目（★8つ）
     ★ ①★**盤が 切れて いるのに すべれない**なら 鳴る（★★これが 本丸。
        ★ ★`overflow-x` を `hidden` に 戻すと 必ず 鳴きます）
     ★ ②★すべれる はばが **足りない**なら 鳴る（★はしまで すべっても K に 届かない）
     ★ ③★**しるしが CSS に ある**（★.table-wrap::after / ::before の content）
     ★ ④★**いま しるしが 出て いる べき ときに 出て いる**（★右に 続きが あるのに 出ない → 鳴る）
     ★ ⑤★**はしまで すべったら 消えて いる**（★うそを つかない）
     ★ ⑥★しるしが **指を 取らない**（pointer-events:none）
     ★ ⑦★しるしが **画面の 外に 出て いない**
     ★ ⑧★**札が 1pxも 小さく なって いない**（★追記③。★--card-w は 58px／≤650pxで 38px）
   ⚠️★ 「盤が 木のわくから 出る」（★はば 807〜839px・★最大 20px）は ★**鳴らしません**。
     ★ ★画面には ぜんぶ 出て いて **見えない px は 0** だからです（★傷の ない ところで 鳴らさない）。
   ============================================================ */
function t290Check(doc, win) {
  var bad = [];
  var el = doc.getElementById('board');
  var wrap = doc.querySelector('.table-wrap');
  var shell = doc.querySelector('.app-shell');
  if (!el || !wrap || !shell) return ['★★★盤（#board）／木のわく（.table-wrap）／器（.app-shell）が ありません'];

  /* ⑧ ★札の 大きさの 床（★いちばん 先に 見る。★ここが 割れたら 直しの 意味が ない） */
  var rs = win.getComputedStyle(doc.documentElement);
  var cw = parseFloat(rs.getPropertyValue('--card-w'));
  var yuka = win.innerWidth <= 650 ? 38 : 58;
  if (isNaN(cw) || cw < yuka - 0.1) {
    bad.push('★★★札が ' + cw + 'px です（★はば' + win.innerWidth + 'px の 床は ' + yuka + 'px）'
      + ' ―― ★★追記③「★まれな 最悪ケースの ために いつもの 画面を 小さく しない」。'
      + '★★★B案（★58→43px・26%小さく）は 社長が 取りませんでした');
  }

  var cells = doc.querySelectorAll('.board-row:first-child .board-cell');
  /* ★ まだ 始めて いない（★開始の 画面）なら 盤は からっぽ。★そこでは 鳴らさない。 */
  var gs = doc.getElementById('gameScreen');
  if (!cells.length && gs && gs.classList.contains('hidden')) return bad;
  if (cells.length !== 13) bad.push('★★★盤の 1行が ' + cells.length + 'ます です（★13ます の はず）');
  var last = cells.length ? cells[cells.length - 1] : null;
  if (!last) return bad.concat(['★★★盤の ますが ありません']);

  /* ★ すべって いない ときの 盤の 右はし（★動かさずに 計算する ―― 遊びの じゃまを しない） */
  var zeroMigi = last.getBoundingClientRect().right + el.scrollLeft;
  var scs = win.getComputedStyle(shell);
  var sr = shell.getBoundingClientRect();
  var kiru = (scs.overflowX === 'clip' || scs.overflowX === 'hidden');
  var kabe = Math.min(kiru ? sr.right - (parseFloat(scs.borderRightWidth) || 0) : Infinity, win.innerWidth);
  var mienai = Math.max(0, zeroMigi - kabe);

  var ecs = win.getComputedStyle(el);
  var nokori = el.scrollWidth - el.clientWidth;      /* ★ すべれる はば */
  /* ★ ★`overflow-x:visible` でも scrollWidth は ふくらみます【★実測・812×375 で 36px】。
     ★ ★**指で 動かせる か**で 数える（★そうしないと「切れて いるのに すべれない」を 見のがす）。 */
  var suberu = (ecs.overflowX === 'auto' || ecs.overflowX === 'scroll') && nokori > 1;

  /* ① ★切れて いるのに すべれない ―― ★★これが 38日間 誰も 見て いなかった 目 */
  if (mienai > 0.6 && !suberu) {
    bad.push('★★★盤が 右で ' + mienai.toFixed(1) + 'px 切れて いるのに、★すべれません'
      + '（★.table の overflow-x は ' + ecs.overflowX + '／★すべれる はば ' + nokori.toFixed(1) + 'px）'
      + ' ―― ★★遊ぶ人は その 札を **1回も 見られません**'
      + '【★T287 実測・667×375 で 20試合中 19試合・最大6枚】');
  }
  /* ② ★すべれても 足りない（★はしまで 行っても K に 届かない） */
  var iru = zeroMigi - el.getBoundingClientRect().right;   /* ★ K を 器の 中に 入れる のに 要る すべり */
  if (suberu && iru > nokori + 0.6) {
    bad.push('★★★いちばん 右まで すべっても K に 届きません（★要る ' + iru.toFixed(1)
      + 'px ／ すべれる ' + nokori.toFixed(1) + 'px）'
      + ' ―― ★.board-row の min-width が 足りて いない かも しれません');
  }

  /* ③〜⑦ ★しるし */
  var migi = win.getComputedStyle(wrap, '::after');
  var hidari = win.getComputedStyle(wrap, '::before');
  var naiyo = function (s) { return !(s.content === 'none' || s.content === '' || s.display === 'none'); };
  if (!naiyo(migi) || !naiyo(hidari)) {
    bad.push('★★★「まだ こっちに つづくよ」の しるしが ありません'
      + '（★.table-wrap::after ' + migi.content + '／::before ' + hidari.content + '）'
      + ' ―― ★★T115 の 教え：★**知らせる ものが 無いと、遊ぶ人は 気づきません**');
  } else if (suberu) {
    var deteru = function (s) { return parseFloat(s.opacity) > 0.05 && parseFloat(s.width) > 8 && s.visibility !== 'hidden'; };
    var hate = el.scrollLeft >= nokori - 1;
    var atama = el.scrollLeft <= 1;
    if (!hate && !(wrap.classList.contains('more-right') && deteru(migi))) {
      bad.push('★★★右に まだ ' + (nokori - el.scrollLeft).toFixed(1) + 'px 続くのに、★右の しるしが 出て いません'
        + '（★class ' + (wrap.classList.contains('more-right') ? 'あり' : 'なし')
        + '／opacity ' + migi.opacity + '）');
    }
    if (hate && wrap.classList.contains('more-right') && deteru(migi)) {
      bad.push('★★★いちばん 右まで 来て いるのに、★右の しるしが 出た ままです ―― ★うそを つきます');
    }
    if (!atama && !(wrap.classList.contains('more-left') && deteru(hidari))) {
      bad.push('★★★左に ' + el.scrollLeft.toFixed(1) + 'px 戻れるのに、★左の しるしが 出て いません');
    }
    if (atama && wrap.classList.contains('more-left') && deteru(hidari)) {
      bad.push('★★★いちばん 左に いるのに、★左の しるしが 出た ままです ―― ★うそを つきます');
    }
  } else {
    if (wrap.classList.contains('more-right') || wrap.classList.contains('more-left')) {
      bad.push('★★★すべれないのに しるしが 出て います（★class ' + wrap.className + '）―― ★うそを つきます');
    }
  }
  if (naiyo(migi)) {
    if (migi.pointerEvents !== 'none' || hidari.pointerEvents !== 'none') {
      bad.push('★★しるしが 指を 取って います（★右 ' + migi.pointerEvents + '／左 ' + hidari.pointerEvents + '）');
    }
    /* ⑦ ★画面の 外に 出て いないか（★右の しるしの 右はし）
       ★★ T292（🎨アト）で **数えまちがいを 1つ 直しました** ―― ★★目は 消して いません。
         ★ ★`right` は ★**わくの "内がわの 箱"（padding box）から 数えます**
           ★ ★（★T290 の 7-3 で コーダ自身が 写真の 画素から 見つけた 決まり）。
           ★ ★★なのに ここでは ★**わくの 外の 箱（border box）**から 数えて いました。
         ★ ★→ ★ふとさ 4px（≤650px）／5px（>650px）ぶん、★**いつも 大きく 出て いました**。
         ★ ★★T290 で「★-11px に したら 3px 出た」のは ★**この ずれ**で、★本当は
         ★ ★★★画面の 内がわに 1px 入って いました【★T292-01・写真の 画素で 裏取り】。
         ★ ★→ ★ふとさを 引きます。★★これで「本当に 出た とき だけ」鳴きます（★わざと 壊して 確かめました）。 */
    var wr = wrap.getBoundingClientRect();
    var wcs = win.getComputedStyle(wrap);
    var wakuPadMigi = wr.right - (parseFloat(wcs.borderRightWidth) || 0);   /* ★ 内がわの 箱の 右 */
    var deru = parseFloat(migi.right);                 /* ★ 負の 値 ＝ わくの 外へ 出る ぶん */
    var shirushiMigi = wakuPadMigi - (isNaN(deru) ? 0 : deru);
    if (shirushiMigi > win.innerWidth + 0.6) {
      bad.push('★★★右の しるしが 画面の 外に ' + (shirushiMigi - win.innerWidth).toFixed(1) + 'px 出て います');
    }
  }
  return bad;
}
try { window.__t290Check = function () { return t290Check(document, window); }; } catch (e) {}
window.SEVEN.boardCheck = function () { return t290Check(document, window); };

/* ============================================================
   ★★★ T292 ―― ★見張り：★**しるしが 札を かくさない**／★**盤が わくの 中に いる**
   ★★★（★🎨アト・2026-09-14・★社長のお決め ★①「1. アトに渡す」★②「1. いま直す」）★★★
   ------------------------------------------------------------
   ★★ なぜ 足すか ―― ★T290 の 見張り（8つの 目）は ★**しるしが どこに いるか**を
     ★ ★「★画面の 外に 出て いないか」の 1つしか 見て いません でした。
     ★ ★★だから ★**札の 上に 8px かぶって いても、★12画面 ぜんぶ OK**でした。
     ★ ★そして ★**「盤が 木のわくから 出る」は わざと 鳴らさない**と 書かれて いました
     ★ ★★（★T290 の 時点では 直して いなかった ので、★正しい 判断です）。★→ ★直したので、足します。

   ★★ 見る 目（★2つ）
     ★ ⑨★**しるしが「札の 面」に かぶって いない**（★みどりの 盤の 内がわに 入って いない）
        ★ ★＋ ★**画面の 外に 出て いない**（★ゆれる ぶんも 数える）
     ★ ⑩★**すべらない はばでは、★盤が みどりの 盤と 木のわくの 中に 入って いる**
        ★ ★（★すべる はばでは ★わざと 切って いるので 見ません）

   ⚠️★ ここは ページの 中なので ★**写真は 撮れません。★computed style で 数えます。**
     ★ ★だから ★**`box-sizing` を かならず 見ます** ―― ★T290 で 2回 まちがえたのは
     ★ ★★`* { box-sizing:border-box }` が ★**擬似要素には かからない**（★`*` は 当たらない）
     ★ ★★★ため、★`width:18px` の しるしが 本当は **22px** だった から です。
     ★ ★★写真の 画素での 裏取りは `T292_写真_アト` に あります。
   ============================================================ */
function t292Check(doc, win) {
  var bad = [];
  var el = doc.getElementById('board');
  var wrap = doc.querySelector('.table-wrap');
  if (!el || !wrap) return ['★★★盤（#board）／木のわく（.table-wrap）が ありません'];
  var gs = doc.getElementById('gameScreen');
  var cells = doc.querySelectorAll('.board-row:first-child .board-cell');
  if (!cells.length && gs && gs.classList.contains('hidden')) return bad;   /* ★ 開始の 画面では 見ない */
  if (!cells.length) return bad;

  var wr = wrap.getBoundingClientRect();
  var wcs = win.getComputedStyle(wrap);
  var ecs = win.getComputedStyle(el);
  var er = el.getBoundingClientRect();
  /* ★ 「札の 面」＝ みどりの 盤の **わくの 内がわ**（★overflow が 切るのも ここ） */
  var menMigi = er.right - (parseFloat(ecs.borderRightWidth) || 0);
  var menHidari = er.left + (parseFloat(ecs.borderLeftWidth) || 0);
  var wakuPadMigi = wr.right - (parseFloat(wcs.borderRightWidth) || 0);
  var wakuPadHidari = wr.left + (parseFloat(wcs.borderLeftWidth) || 0);

  /* ⑨ ★しるしの 本当の 箱（★box-sizing を 見て 組み立てる） */
  var hako = function (s, migika) {
    if (s.content === 'none' || s.content === '') return null;
    var w = parseFloat(s.width);
    var bw = (parseFloat(s.borderRightWidth) || 0) + (parseFloat(s.borderLeftWidth) || 0);
    if (isNaN(w)) return null;
    var futo = (s.boxSizing === 'border-box') ? w : w + bw;   /* ★ ここが T290 の つまずき */
    var zure = parseFloat(migika ? s.right : s.left);
    if (isNaN(zure)) return null;
    var migi, hidari;
    if (migika) { migi = wakuPadMigi - zure; hidari = migi - futo; }
    else { hidari = wakuPadHidari + zure; migi = hidari + futo; }
    return { 左: hidari, 右: migi, 幅: futo, boxSizing: s.boxSizing };
  };
  var migiS = win.getComputedStyle(wrap, '::after');
  var hidariS = win.getComputedStyle(wrap, '::before');
  var mh = hako(migiS, true), hh = hako(hidariS, false);
  /* ★ ゆれる ぶん（★@keyframes の translateX）も 数える ―― ★止まって いる ときだけ 見ると 見のがす。
     ★ ★⚠️ ★数は **CSS の `--sign-yure` を 読みます**。★★ここに 3 と 書いて いた とき、
     ★ ★★CSS は 2 で、★★★12画面中 10画面で うそ鳴きしました（★私の しくじり・T292）。 */
  var yure = parseFloat(win.getComputedStyle(doc.documentElement).getPropertyValue('--sign-yure'));
  if (isNaN(yure)) { bad.push('★★--sign-yure が ありません（★ゆれの 数が 2か所に 分かれます）'); yure = 3; }
  /* ★ ⑨は **しるしが 出る はば**（＝ すべる 入れものの とき）だけ 見ます。
     ★ ★すべらない はばでは しるしは 1回も 出ないので、★そこで 鳴らすと
     ★ ★★「傷の ない ところで 鳴る 赤ランプ」に なります（★アト T277）。
     ★ ★★★そこは かわりに ⑩（★盤が わくの 中に いるか）が 見て います。 */
  var deruHaba = (ecs.overflowX === 'auto' || ecs.overflowX === 'scroll');
  if (!deruHaba) { mh = null; hh = null; }
  if (mh) {
    var kabusaru = menMigi - mh.左;                       /* ★ 札の 面に かぶる px */
    if (kabusaru > 0.6) {
      bad.push('★★★右の しるしが 札の 面に ' + kabusaru.toFixed(1) + 'px かぶって います'
        + '（★しるしの 左はし ' + mh.左.toFixed(1) + '／札の 面の 右はし ' + menMigi.toFixed(1)
        + '／しるしの はば ' + mh.幅.toFixed(1) + 'px・box-sizing:' + mh.boxSizing + '）'
        + ' ―― ★★T292：★しるしは **札を 1pxも かくしません**');
    }
    if (mh.右 + yure > win.innerWidth + 0.6) {
      bad.push('★★★右の しるしが（★ゆれた とき）画面の 外に '
        + (mh.右 + yure - win.innerWidth).toFixed(1) + 'px 出ます');
    }
  }
  if (hh) {
    var kabusaruH = hh.右 - menHidari;
    if (kabusaruH > 0.6) {
      bad.push('★★★左の しるしが 札の 面に ' + kabusaruH.toFixed(1) + 'px かぶって います'
        + '（★しるしの 右はし ' + hh.右.toFixed(1) + '／札の 面の 左はし ' + menHidari.toFixed(1) + '）');
    }
    if (hh.左 - yure < -0.6) {
      bad.push('★★★左の しるしが（★ゆれた とき）画面の 外に ' + (yure - hh.左).toFixed(1) + 'px 出ます');
    }
  }

  /* ⑩ ★すべらない はばでは、★盤は みどりと 木のわくの 中に いる こと
     ★ ★（★すべる はば＝ 651〜806px と ≤650px では、★★わざと 切って 見に 行かせる 作り）*/
  if (!deruHaba) {
    var first = cells[0], last = cells[cells.length - 1];
    var fr = first.getBoundingClientRect(), lr = last.getBoundingClientRect();
    var midoriDeru = Math.max(lr.right - menMigi, menHidari - fr.left);
    var wakuDeru = Math.max(lr.right - wakuPadMigi, wakuPadHidari - fr.left);
    if (midoriDeru > 0.6) {
      bad.push('★★★盤が みどりの 盤から ' + midoriDeru.toFixed(1) + 'px 出て、★木のわくの 上に 札が 乗って います'
        + '（★盤 ' + fr.left.toFixed(1) + '〜' + lr.right.toFixed(1)
        + '／みどりの 内がわ ' + menHidari.toFixed(1) + '〜' + menMigi.toFixed(1) + '）'
        + ' ―― ★★T292②：★はば 807〜860px で 器の あきを けずって 収めました'
        + '【★実測・T292-03・はば 807px で 41px・812px で 36px 出て いました】');
    }
    if (wakuDeru > 0.6) {
      bad.push('★★★盤が 木のわくの 外に ' + wakuDeru.toFixed(1) + 'px 出て います'
        + '【★実測・T292-03・はば 807px で 20px・812px で 15px】');
    }
  }
  return bad;
}
try { window.__t292Check = function () { return t292Check(document, window); }; } catch (e) {}
window.SEVEN.signCheck = function () { return t292Check(document, window); };

window.SEVEN.verify = function () {
  var bad = t281IconCheck(document, window).map(function (s) { return '★T281 しるし：' + s; });
  /* ★ お知らせ（かっこ で はじまる もの）は NG に 数えない */
  var bar = t285BarCheck(document, window);
  var shirase = bar.filter(function (s) { return s.charAt(0) === '（'; });
  bad = bad.concat(bar.filter(function (s) { return s.charAt(0) !== '（'; }).map(function (s) { return '★T285 帯：' + s; }));
  /* ★ T287 ―― ★◀ の 44px（★ここから は 必ず 鳴る）と 器の 外の ふた */
  bad = bad.concat(t287Check(document, window).map(function (s) { return '★T287 ◀と外ぶた：' + s; }));
  /* ★ T290 ―― ★盤が 切れて いない、★または すべれば 見える */
  bad = bad.concat(t290Check(document, window).map(function (s) { return '★T290 盤とすべり：' + s; }));
  /* ★ T292 ―― ★しるしが 札を かくさない／★盤が わくの 中に いる */
  bad = bad.concat(t292Check(document, window).map(function (s) { return '★T292 しるしと わく：' + s; }));
  /* ★ T294 ―― ★見えない 押し代（44px）。★お知らせ（かっこ で はじまる もの）は NG に 数えない
     ★ ★（★「箱の はしで 切られて いる」は 44px 足りないのとは 別もの。★T291 §3 と 同じ 分けかた） */
  var osi = t294Check(document, window);
  var osiShirase = osi.filter(function (s) { return s.charAt(0) === '（'; });
  bad = bad.concat(osi.filter(function (s) { return s.charAt(0) !== '（'; }).map(function (s) { return '★T294 押し代：' + s; }));
  shirase = shirase.concat(osiShirase);
  var out = {
    はば: window.innerWidth + '×' + window.innerHeight,
    見た目: bad.length ? '★NG ' + bad.length + '件' : 'OK',
    NG: bad,
    お知らせ: shirase,
    見た目の目: 'しるしが SVG／弧と やじりの 2パス／16×16px／字と 3px 以上／出ない はばでは 出ない／44pxの 的',
    帯の目: 'sticky／親に すべる入れ物が いない／本当に すべらせて 帯が 残る／やめると◀が 画面の中で まん中が 押せる／44pxの 的／ふたが 指を 取らない・うしろに いる／--bar-h が 本当の 高さと 合う',
    '◀と外ぶたの目': '◀ が 44×44／帯を のばして いない／上に 出すぎない（切れる）／下に 出すぎない（隠す）／器の 外の ふたが ある・sticky・うしろ・指を 取らない・たかさが 帯の 下と ぴったり・ページを のばさない・色が 空と 同じ',
    '盤とすべりの目': '切れて いるのに すべれない と 鳴る／すべっても K に 届かない と 鳴る／しるしが CSS に ある／出る べき ときに 出て いる／はしまで 行ったら 消える／指を 取らない／画面の 外に 出ない／札が 1pxも 小さく なって いない',
    'しるしと わくの目': 'しるしが 札の 面に 1pxも かぶらない（box-sizing を 見て 数える）／ゆれた ときも 画面の 外に 出ない／すべらない はばでは 盤が みどりの 盤と 木のわくの 中に いる',
    '押し代の目': '押し代が 消えて いない／押し代が 44px ある／親の position が static に 戻って いない／★見た目が 太って いない（帯の あきが 変わり 題が 折れる）／本物の 指で たて 44px 届く（箱の はしで 切られた ぶんは お知らせ）／題が 帯から はみ出して いない'
  };
  console.log('[七並べ] verify', out);
  return out;
};


/* ============================================================
   ★★★ T294 ―― ★見えない 押し代（44px）の 見張り（★🎨アト・2026-09-14）★★★
   ------------------------------------------------------------
   ★ ★何を 見るか（★6つ）：
     ★ ★ａ ★押し代が **消えて いない**（★`::after` の content が none で ない）
     ★ ★ｂ ★押し代の たてが **44px 以上**
     ★ ★ｃ ★親の `position` が **static に 戻って いない**（★戻ると 押し代は 別の 場所へ 飛びます）
     ★ ★ｄ ★★**見た目が 太って いない** ―― ★T294 で 実測した たかさを 超えたら 鳴く
     ★ ★  ★★ ＝ ★★★コーダの 心配（★T287：「3つ まとめて 太らせると 帯の あきが 変わり、題が 折れる」）は
     ★ ★  ★★   ★ここで 数字に なって います。★**太らなければ 帯は 動きません。**
     ★ ★ｅ ★★**本物の 指**（`elementFromPoint` を 1pxずつ）で たて **44px 届く**
     ★ ★  ★★ ・★届かない とき、★**箱や 画面が 切って いる だけ**なら お知らせ（★NG に しない）。
     ★ ★  ★★  ★これは T288 の「すべらせれば 戻る 23個」・★T291 §3 の 8件と 同じ たぐい。
     ★ ★  ★★  ★★**傷の ない ところで 赤ランプを 出さない**（★アト T277）。
     ★ ★ｆ ★**題（.brand）が 帯の 中に 収まって いる** ―― ★折れれば たかさが 増えて はみ出します。

   ★ ⚠️★ここは ページの 中なので **写真は 撮れません**。★写真の 裏取りは `T294_写真_アト`
     ★ ★（★控えの ファイルと 今の ファイルを 別々に 出して くらべ、★12画面×4場面で **0画素**）。
   ============================================================ */
function t294Check(doc, win) {
  var bad = [], shirase = [];
  var semai = win.innerWidth <= 650;
  var SHIGOTO = [
    { sel: '.topbar .howto',            na: '？ 遊び方',   mitame: semai ? 36 : 42, oya: 'relative' },
    { sel: '#helpDialog .close-dialog', na: '× 遊び方を閉じる', mitame: 29,          oya: 'absolute' },
    { sel: '#helpDialog .dialog-ok',    na: '分かった！',  mitame: 38,              oya: 'relative' },
    { sel: '#resultRestart',            na: 'もう一度遊ぶ', mitame: 38,             oya: 'relative' }
  ];

  /* ★★ 開いて いる モーダルの 箱（`showModal()`）を 先に さがす。
     ★ ★★**箱が 開いて いる あいだ、★箱の 外の ボタンは 押せません**（★ブラウザの 決まり）。
     ★ ★★【★実測・T294-11】★箱を 開けた まま 帯の `？ 遊び方` の まん中を つつくと、
     ★ ★★ ★返って くるのは `dialog#helpDialog` ―― ★`？` では ありません。
     ★ ★★★ここを 見なかった ため、★私の 見張りは ★**壊して いない ときに 2件 うそ鳴き**しました。
     ★ ★★ ＝ ★「★出ない ところで 鳴る 赤ランプ」（★アト T277・★T292 でも 踏みました）。
     ★ ★→ ★箱が 開いて いる あいだは ★**箱の 中の もの だけ**を 見ます。 */
  var modal = null;
  var dlgs = doc.querySelectorAll('dialog[open]');
  for (var d0 = 0; d0 < dlgs.length; d0++) {
    try { if (dlgs[d0].matches(':modal')) modal = dlgs[d0]; } catch (e) { modal = dlgs[d0]; }
  }
  function mieru(el) {
    if (!el) return false;
    if (modal && !modal.contains(el)) return false;
    if (el.checkVisibility) { try { if (!el.checkVisibility({ checkVisibilityCSS: true, opacityProperty: true })) return false; } catch (e) {} }
    return !!el.getClientRects().length;
  }
  /* ★ いちばん 近い「切る 親」と 画面で、上下 どこまで 見えるか */
  function kiru(el) {
    var ue = -Infinity, shita = Infinity;
    var p = el.parentElement;
    while (p) {
      var s = win.getComputedStyle(p);
      if (s.overflowY !== 'visible' || s.overflowX !== 'visible') {
        var r = p.getBoundingClientRect();
        ue = Math.max(ue, r.top + (parseFloat(s.borderTopWidth) || 0));
        shita = Math.min(shita, r.bottom - (parseFloat(s.borderBottomWidth) || 0));
      }
      p = p.parentElement;
    }
    return { 上: Math.max(ue, 0), 下: Math.min(shita, win.innerHeight) };
  }
  function yubi(el) {
    var r = el.getBoundingClientRect();
    var cx = Math.round((r.left + r.right) / 2), cy = Math.round((r.top + r.bottom) / 2);
    function hit(x, y) {
      if (x < 0 || y < 0 || x >= win.innerWidth || y >= win.innerHeight) return false;
      var e = doc.elementFromPoint(x, y);
      return !!(e && (e === el || el.contains(e)));
    }
    if (!hit(cx, cy)) return null;
    var T = cy, B = cy, k;
    for (k = 1; k <= 60; k++) { if (hit(cx, cy - k)) T = cy - k; else break; }
    for (k = 1; k <= 60; k++) { if (hit(cx, cy + k)) B = cy + k; else break; }
    return { 高: B - T + 1, 上: T, 下: B, 四角: r };
  }

  var mita = 0;
  for (var i = 0; i < SHIGOTO.length; i++) {
    var s = SHIGOTO[i];
    var el = doc.querySelector(s.sel);
    if (!mieru(el)) continue;          /* ★ 箱が 閉じて いる ときは 見ない（★赤ランプに しない） */
    mita++;
    var af = win.getComputedStyle(el, '::after');
    var cs = win.getComputedStyle(el);
    var r = el.getBoundingClientRect();

    if (af.content === 'none' || af.content === '') {
      bad.push('★★★' + s.na + ' の 押し代が 消えて います（★`' + s.sel + '::after` の content が ' + af.content + '）'
        + ' ―― ★T294：★見た目を 太らせずに 的を 44px に する ための もの です');
    } else {
      var h = parseFloat(af.height);
      if (!(h >= 43.99)) bad.push('★★★' + s.na + ' の 押し代が ' + (isNaN(h) ? af.height : h.toFixed(1)) + ' しか ありません（★44px 要ります）');
    }
    if (cs.position === 'static') {
      bad.push('★★★' + s.na + ' の position が static に 戻って います（★' + s.oya + ' が 要ります。'
        + '★static だと 押し代が この ボタンでは ない ところに 飛びます）');
    }
    if (r.height > s.mitame + 0.6) {
      bad.push('★★★' + s.na + ' の **見た目**が ' + r.height.toFixed(1) + 'px に 太って います'
        + '（★T294 の 実測は ' + s.mitame + 'px）―― ★★太らせると 帯の 中の あきが 変わり、'
        + '★★★題が 折れます（★コーダ T287／T274 の しくじり）。★押し代（`::after`）で 直して ください');
    }
    var y = yubi(el);
    if (!y) {
      bad.push('★★★' + s.na + ' の まん中が 押せません（★何かが 上に 乗って います）');
    } else if (y.高 < 44) {
      var k = kiru(el);
      /* ★ ★1.6px の ゆとり（★0.6 では 足りません ―― ★私は ここで 1回 うそ鳴きさせました）
         ★ ★★指は **1px きざみ**で 止まるので、★切る はしの 内がわ **1px 手前**で 止まります。
         ★ ★★【★実測・844×390】★的の 下 370／箱が 切る 下 371.0 ―― ★0.6 の ゆとりでは 届きません。 */
      var kirareta = (y.上 <= k.上 + 1.6) || (y.下 >= k.下 - 1.6);
      if (kirareta) {
        shirase.push('（' + s.na + ' の 的は たて ' + y.高 + 'px ―― ★44px 足りないのでは なく、'
          + '★**箱（or 画面）の はしで 切られて います**（★的 ' + y.上 + '〜' + y.下
          + '／切られる ところ ' + k.上.toFixed(1) + '〜' + k.下.toFixed(1) + '）。'
          + '★すべらせて 出せば 44px 以上に なります'
          + '【★実測・T294：★844×390 と 736×414 で 42→45px・568×272 で 27→45px】）');
      } else {
        bad.push('★★★' + s.na + ' の 指の的が たて ' + y.高 + 'px しか ありません（★44px 要ります）');
      }
    }
  }

  /* ★ ｆ 題（.brand）が **折れて いない**・★帯の 中に 収まって いるか
     ★ ★1行の たかさは 実測：★**23px**（≤650px）／★**30px**（≥651px・`<small>` こみ）【★T294-01・12画面】。
     ★ ★折れれば たかさが 倍に なるので、★ここで 鳴きます（★帯が 高い 画面では はみ出さない ことが ある ―― ★だから 2つ 見ます）。 */
  var bar = doc.querySelector('.topbar'), brand = doc.querySelector('.brand');
  if (bar && brand && mieru(brand)) {
    var br2 = bar.getBoundingClientRect(), kr = brand.getBoundingClientRect();
    var hitogyo = semai ? 23 : 30;
    if (kr.height > hitogyo + 0.6) {
      bad.push('★★★題（.brand）が ' + kr.height.toFixed(1) + 'px に なって います（★1行は ' + hitogyo + 'px）'
        + ' ―― ★★**題が 折れました**。★帯の ボタンが よこに 太って 題の 場所を 取った 見こみ'
        + '（★T274 の しくじり・★コーダ T287 が 心配した ところ）');
    }
    if (kr.bottom > br2.bottom + 0.6 || kr.top < br2.top - 0.6) {
      bad.push('★★★題（.brand）が 帯から はみ出して います（★題 ' + kr.top.toFixed(1) + '〜' + kr.bottom.toFixed(1)
        + '／帯 ' + br2.top.toFixed(1) + '〜' + br2.bottom.toFixed(1) + '）'
        + ' ―― ★★帯の ボタンが 太って 題が 折れた 見こみ（★T274／T287 の しくじり）');
    }
  }
  if (!mita) return bad;   /* ★ 1つも 出て いない ときは 何も 言わない */
  return bad.concat(shirase);
}
try { window.__t294Check = function () { return t294Check(document, window); }; } catch (e) {}
window.SEVEN.oshishiroCheck = function () { return t294Check(document, window); };
