'use strict';
/* ============================================================
   大富豪（だいふごう）― ブラゲ工房 3本目 ／ 第2段B
   ------------------------------------------------------------
   ★ 15この ルールが ぜんぶ そろった 回。ready:false は もう ありません。

   ★ 設計の 背骨（第1段から かわっていない）
     ・ルール 1こ ＝ RULES の 1ぎょう。せつめい（desc）は そこに 1回だけ 書く。
     ・ゲームの はんていは かならず ruleLive()（ON かつ ready）で 見る。
     ・はつどうの おしらせは fireRule(id) を よぶだけ（文は RULES から 出る）。

   ★ 第2段Aで 足した しくみ
     ・逆転フラグは 2つ（revolution / jackBack）。**奇数個 ONなら つよさが ぎゃく**。
       かいだんかくめい も おなじ revolution フラグに のる。
     ・「だせる かたち」は meld（＝ set / stairs / spade3）という 1つの かたちに まとめた。
       ハイライト・だす はんてい・ロボットの しこう が、ぜんぶ この 1か所を 見る。

   ★ 第2段Bで 足した しくみ ―― ぜんぶ「できないことが ふえる」ルール。
     ルルの けいこく：**できないことが ふえる ルールを だまって 入れると あそべない。**
     だから この4つは、かならず「いま なにが とめられているか」を 画面に 出す。

     ・しばり     … state.lock（マークの はいれつ）＋ 上の帯に つねに バッジ
     ・あがりきんし … だせる かたちを 3つに 分ける
                    だせる（out）／とまる（banned・りゆうを 出す）／ほかに 手が ない ときだけ 出せる
     ・みやこおち   … state.crown（まえの かいの 1い）＋ アバターに つねに バッジ
     ・カードこうかん … runSwap()。ゲームの はじまりを 止めて、なにが 起きたか 見せてから すすむ

     ★ ルールで「いちばん下」に なる人は player.foul で しるしを つけ、
       じゅんいの けいさんは endGame() の 1か所だけで やる（ばらばらに しない）。
   ============================================================ */

/* ───────── カードの もと ───────── */
const SUITS = [
  { id:'spades',   mark:'♠', ja:'スペード',   name:'スペード', color:'black' },
  { id:'hearts',   mark:'♥', ja:'ハート',     name:'ハート',   color:'red'   },
  { id:'diamonds', mark:'♦', ja:'ダイヤ',     name:'ダイヤ',   color:'red'   },
  { id:'clubs',    mark:'♣', ja:'クローバー', name:'クラブ',   color:'black' },
];
/* よわい → つよい の ならび（大富豪の きほん）。ジョーカーは べつあつかい。 */
const ORDER = ['3','4','5','6','7','8','9','10','J','Q','K','A','2'];
const ORDER_TEXT     = '弱い 3 4 5 6 7 8 9 10 J Q K A 2 🃏 強い';
const ORDER_TEXT_REV = '弱い 2 A K Q J 10 9 8 7 6 5 4 3 🃏 強い';

/* じゅんいの よびかた（社長指示・§14）
   よびなと カッコの じゅんいは かならず セット。かたほうだけに しない。 */
const TITLES = ['大富豪（1位）', '富豪（2位）', '貧民（3位）', '大貧民（4位）'];

/* はやさは えらばせない（社長指示・§14）。あそびやすい はやさを 1つ 決めうち。 */
const SPEED = { think: 720, step: 480, flow: 620 };

/* ============================================================
   ★ ルール定義の はいれつ（§6-5 ＝ この ゲームの 背骨）
   ------------------------------------------------------------
   ルール1こ ＝ この はいれつの 1ぎょう。
   せつめい（desc）は ここに 1回だけ 書き、
     ① 設定がめんの ちいさい字
     ② あそびかたの「いま つかってる ルール」
     ③ はつどうした ときの まんなかの おしらせ
   の 3か所で つかいまわす。
   ⚠️ おなじ 文字れつを 2か所に 書いたら、その時点で 設計が こわれています。

     name    … 表示名
     desc    … 子どもが 読む 1行（★1か所しか 書かない）
     group   … 設定がめん・あそびかたの グループ（RULE_GROUPS の id）
     presets … どの プリセットで ONに なるか
     ready   … 中身が できているか（false ＝ じゅんびちゅう。ゲームには きかない）
     needs   … ほかの ルールが ONでないと なりたたない もの
     flash   … はつどう2回目 いこうの みじかい ひとこと（なければ 名前だけ）
   ============================================================ */
const RULE_GROUPS = [
  { id:'form',  label:'出せる形が ふえる' },
  { id:'move',  label:'場が動く' },
  { id:'power', label:'強さが変わる' },
  { id:'care',  label:'気をつけるルール', warn:true, note:'ONにすると、出せない ときが ふえるよ' },
  { id:'link',  label:'回と回をつなぐ' },
];

const RULES = [
  { id:'eightCut',  name:'8切り',                     desc:'8を出したら場が流れて、もう一度出せる',
    group:'move',  presets:['easy','normal','all'], ready:true,  flash:'場が流れた！ もう一度出せるよ' },

  { id:'revolution', name:'革命',                 desc:'同じ数を4枚出すと、強さが全部 ぎゃくさまに なる',
    group:'power', presets:['normal','all'],        ready:true,  flash:'強さが ひっくり返った！' },

  { id:'stairs',    name:'階段',                  desc:'同じマークで数が続く3枚以上は、まとめて出せる',
    group:'form',  presets:['normal','all'],        ready:true,  flash:'続きの3枚以上！' },

  { id:'spade3',    name:'スペ3返し',               desc:'ジョーカー1枚には、♠の3で勝てる',
    group:'power', presets:['normal','all'],        ready:true,  flash:'♠3で場が流れるよ' },

  { id:'jackBack',  name:'Jバック',                   desc:'Jを出すと、場が流れるまで強さが ぎゃくさま',
    group:'power', presets:['all'],                 ready:true,  flash:'場が流れるまで ぎゃく！' },

  { id:'stairRev',  name:'階段革命',           desc:'階段を4枚以上出しても革命が 起きる',
    group:'power', presets:['all'],                 ready:true,  needs:['stairs','revolution'],
    flash:'階段で強さが ひっくり返った！' },

  { id:'lock',      name:'縛り',                    desc:'前と同じマークが続いたら、そのマークしか出せなくなる',
    group:'care',  presets:['all'],                 ready:true,  flash:'場が流れるまで そのマークだけ' },

  { id:'noFinish',  name:'上がり禁止',             desc:'2・ジョーカー・♠3 では ゴールできない（最後の1枚に使えない）',
    group:'care',  presets:['all'],                 ready:true,  flash:'そのカードでは ゴールできないよ' },

  { id:'fallDown',  name:'都落ち',                desc:'前の回の1位が、今回1位に なれないと一番下',
    group:'care',  presets:['all'],                 ready:true,  flash:'1位だった人が一番下に なったよ' },

  { id:'swap',      name:'カード交換',             desc:'前の回の1位は、最下位の人とカードを とりかえる',
    group:'link',  presets:['all'],                 ready:true,  flash:'強いカードと とりかえたよ' },

  { id:'wildJoker', name:'ジョーカーは何にでもなれる', desc:'ジョーカーを ほかのカードの かわりに使える',
    group:'form',  presets:['all'],                 ready:true,  flash:'ジョーカーが かわりに なったよ' },

  { id:'fiveSkip',  name:'5飛び',                     desc:'5を出したら、出した枚数ぶん 次の人を とばす',
    group:'move',  presets:['all'],                 ready:true,  flash:'次の人を とばすよ' },

  { id:'nineRev',   name:'9リバース',                 desc:'9を出すと、順番が ぎゃくまわりに なる',
    group:'move',  presets:['all'],                 ready:true,  flash:'順番が ひっくり返った！' },

  { id:'sevenGive', name:'7渡し',                   desc:'7を出したら、出した枚数ぶん 手札を次の人に わたす',
    group:'move',  presets:['all'],                 ready:true,  flash:'手札を次の人に わたすよ' },

  { id:'tenDrop',   name:'10捨て',                    desc:'10を出したら、出した枚数ぶん 手札を捨てられる',
    group:'move',  presets:['all'],                 ready:true,  flash:'手札を捨てられるよ' },
];

const PRESETS = [
  { id:'easy',   label:'かんたん', note:'初めての子' },
  { id:'normal', label:'ふつう',   note:'大体の人', recommend:true },
  { id:'all',    label:'ぜんぶ',   note:'ぜんぶ ON'    },
];

const RULE = (id) => RULES.find(r => r.id === id);
/* 画面に 出す ON/OFF（社長が えらんだ もの） */
const ruleOn = (id) => Boolean(state.ruleOn[id]);
/* ほかの ルールが ONで ないと なりたたない もの（かいだんかくめい） */
function needsMet(r) { return !r.needs || r.needs.every(n => ruleOn(n)); }
/* ゲームの 中身に きくか どうか。中身が まだ ない ルールは ぜったいに きかせない。 */
function ruleLive(id) {
  const r = RULE(id);
  if (!r || !r.ready || !ruleOn(id)) return false;
  return !r.needs || r.needs.every(n => ruleLive(n));
}
/* ★ せつめい文の 出しぐち（§7-3）
   スペ3がえしが OFF の ときは「あがり きんし」から ♠3 を 消す。
   もとの 文は RULES に 1回しか 書かない ―― ここは その 1本を けずるだけ。 */
function descOf(r) {
  if (r.id === 'noFinish' && !ruleOn('spade3')) return r.desc.replace('・♠3', '');
  return r.desc;
}

/* ───────── ゲームの じょうたい ───────── */
const state = {
  players: [],
  field: null,          // { cards, meld, by }
  turn: 0,
  lastPlayer: 0,
  finished: [],         // ゴールした じゅんばん（players の さんしょう）
  selected: [],         // えらんでいる カードの key
  altIndex: 0,          // ジョーカーの べつの かたち（何ばんめの かいしゃくか）
  busy: false,
  over: false,

  /* ★ つよさの 逆転フラグは 2つ。奇数個 ONの ときだけ ぎゃくに なる。
     かいだんかくめい も revolution を つかう（フラグを ふやさない）。 */
  revolution: false,    // かくめい／かいだんかくめい（ゲームが おわるまで つづく）
  jackBack: false,      // Jバック（ばが ながれるまで）
  revDir: false,        // 9リバース（ばが ながれたら もどす・社長決定）

  lock: null,           // ★しばり：しばられている マークの はいれつ（['spades'] など）。null＝しばりなし
  warnKey: '',          // あがりきんし の「ほんとうに いい？」を 1回 見せた えらび

  pending: null,        // えらぶモード { type:'give'|'drop'|'swap', n, player, human, to, then }
  after: null,          // だしたあとに しょりする こうかの キュー

  gameNo: 1,
  epoch: 0,             // ★ゲームの 通し番号（下の later() が つかう。ふるい タイマーよけ）
  totals: [],           // [{ stars, firsts }] ブラウザを とじたら きえる（社長決定）
  preset: 'normal',
  ruleOn: {},
  fired: {},            // そのゲームで もう「説明の 全文」を 出しきった ルール
  tried: {},            // ★T99：全文を 出そうとして 切りあげられた 回数（ルールごと）
  longAt: {},           // ★T99：全文を さいごに 出そうとした 時こく（ルールごと）
  nextStarter: null,    // つぎの ゲームの さいしょの人（＝まえの かいの さいかい）
  lastRank: null,       // ★まえの かいの じゅんい（players の ばんごう。0番が 1い）
  crown: null,          // ★まえの かいの 1い（みやこおち の ねらわれる人）
};

const $ = (id) => document.getElementById(id);

/* ============================================================
   ★ later() ― ゲームの ながれを すすめる タイマーは かならず これを つかう
   ------------------------------------------------------------
   もんだい：「次のゲームへ」を おした とき、まえの ゲームの タイマーが
   まだ のこっている。ふつうは state.over で 止まるが、
   新しい ゲームが はじまると over は false に もどる ので、
   **ふるい タイマーが 新しい ゲームの 中で うごき出して しまう。**
   すると 手番が 2本 同時に すすみ、ロボットが 2回 うごいたり、
   だれも 手番を もらえずに ゲームが 止まったり する。

   なおし方：ゲームを はじめる たびに state.epoch を 1 ふやし、
   よやく した ときの epoch と ちがったら **なにも しない**。
   ⚠️ ルールの おしらせ（fireRule）の 見た目タイマーは ここに 通さない。
      あれは ゲームの ながれを うごかさない ので。
   ============================================================ */
function later(fn, ms) {
  const e = state.epoch;
  return window.setTimeout(() => { if (e === state.epoch) fn(); }, ms);
}

/* ───────── カードの 絵札（設計図 §9・厳守） ─────────
   ・かならず office/games/cards/ の 社長の 画像を つかう。CSSや 記号で 自作しない。
   ・ファイル名が 日本語なので URL には encodeURIComponent() を 通す。
   ・全55枚で 約11MB あるので、先読みは しない。てふだ・ばに 出た ぶんだけ 読む。 */
const CARD_DIR = '../cards/';
const cardSrc  = (file) => CARD_DIR + encodeURIComponent(file) + '.png';

function createDeck() {
  const deck = [];
  SUITS.forEach(s => ORDER.forEach((rank, ord) => {
    deck.push({ key:`${s.id}-${rank}`, suit:s.id, mark:s.mark, name:s.name, color:s.color,
                rank, ord, joker:false, file:s.ja + rank });
  }));
  /* ジョーカーは 2まい つかう（社長決定・§14） */
  deck.push({ key:'joker-1', suit:'joker', mark:'🃏', name:'ジョーカー', color:'black',
              rank:'JOKER', ord:13, joker:true, file:'JOKER1' });
  deck.push({ key:'joker-2', suit:'joker', mark:'🃏', name:'ジョーカー', color:'black',
              rank:'JOKER', ord:13, joker:true, file:'JOKER2' });
  return deck;
}
function shuffle(cards) {
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

/* ============================================================
   ★ つよさ ― 逆転フラグ 2つの「奇数個 ONなら ぎゃく」（ルル指示）
   ------------------------------------------------------------
   かくめい と Jバックが かさなったら、逆転が 2つで 元に もどる。
   ここ 1か所だけを 見れば、ハイライトも ロボットも 自動で ついてくる。
   ============================================================ */
function reversed() { return ((state.revolution ? 1 : 0) + (state.jackBack ? 1 : 0)) % 2 === 1; }
function strength(card) { return card.joker ? 100 : (reversed() ? 12 - card.ord : card.ord); }
function rankKey(card)  { return card.joker ? 'JOKER' : card.rank; }
function dir() { return state.revDir ? -1 : 1; }

/* meld（＝だした かたち）の つよさ。フラグを 見て その場で 計算する
   ＝ 逆転が おきても、ばに ある 札の つよさが ちゃんと 入れ替わる。 */
function meldPower(m) {
  if (!m) return -1;
  if (m.kind === 'spade3') return -1;
  if (m.kind === 'stairs') return reversed() ? 12 - m.lo : m.hi;
  if (m.jokerOnly) return 100;
  return reversed() ? 12 - m.ord : m.ord;
}
function sortHand(p) {
  p.cards.sort((a, b) => strength(a) - strength(b) || a.suit.localeCompare(b.suit) || a.ord - b.ord);
}
/* つよさが ひっくり返った ときに よぶ（てふだの ならびも 入れ替える） */
function onStrengthFlip() {
  state.players.forEach(sortHand);
  handSig = '';
}

/* ───────── カードの 見た目 ───────── */
function fallbackHTML(card) {
  if (card.joker) return '<span class="fallback"><span class="pip">🃏</span></span>';
  return `<span class="fallback"><span class="corner tl">${card.rank}<i>${card.mark}</i></span>`
    + `<span class="pip">${card.mark}</span>`
    + `<span class="corner br">${card.rank}<i>${card.mark}</i></span></span>`;
}
function faceImgHTML(card) {
  return `<img class="face-img" src="${cardSrc(card.file)}" alt="" draggable="false" decoding="async"`
    + ` onload="this.parentNode.classList.add('img-ok')"`
    + ` onerror="this.parentNode.classList.add('img-failed');this.remove()">`;
}
function tagHTML(tag) { return tag ? `<i class="wild-tag">→${tag}</i>` : ''; }
function cardHTML(card, mode, tag) {
  /* mode: undefined（ばの札）／'play'（だせる）／'join'（いっしょに だせる）
           'sel'（えらんだ）／'stop'（あがりきんしで とまる）／'no'（だせない） */
  const label = card.joker ? 'ジョーカー' : `${card.name}の${card.rank}`;
  const inner = fallbackHTML(card) + faceImgHTML(card) + tagHTML(tag);
  if (!mode) return `<div class="card ${card.color}" role="img" aria-label="${label}">${inner}</div>`;
  const cls = `card ${card.color} ${mode === 'play' ? 'can-play' : ''} ${mode === 'join' ? 'can-join' : ''}`
            + ` ${mode === 'sel' ? 'selected' : ''} ${mode === 'stop' ? 'cant-finish' : ''}`;
  /* 'stop' は disabled に しない ―― 押して りゆうを 読める ように するため。 */
  const dis = (mode === 'no') ? 'disabled' : '';
  return `<button class="${cls}" type="button" data-key="${card.key}" ${dis}`
       + ` aria-pressed="${mode === 'sel'}" aria-label="${label}">${inner}</button>`;
}

/* ============================================================
   ★ だせる かたち（meld）の はんてい ― ここが 第2段Aの 心臓
   ------------------------------------------------------------
   かたちは 3しゅるい：
     set    … おなじ かずを まとめて（1〜4まい。ジョーカーだけの まとめも ここ）
     stairs … おなじ マークの れんばん 3まい いじょう（かいだん）
     spade3 … ジョーカー1まいに ♠3（スペ3がえし）
   ジョーカーワイルドが ONなら、set・stairs の たりない ぶんを ジョーカーが うめる。
   ============================================================ */
function canSpade3() {
  const f = state.field;
  return ruleLive('spade3') && Boolean(f) && f.meld.count === 1 && Boolean(f.meld.jokerOnly);
}

/* ============================================================
   ★ しばり（§3-5）― できないことが ふえる ルール その1
   ------------------------------------------------------------
   ばに 出た 2回れんぞくが おなじ マークの くみあわせなら、その マークに しばられる。
   ばが ながれるまで つづく。
   ⚠️ ルルの けいこく：**バッジが 無いなら 実装しない。**
      → renderFlags() に「♠ しばり ちゅう」を つねに 出している。あれと セットで 1きのう。
   ジョーカーは どの マークにも なれる あつかい（とめない）。
   ============================================================ */
const SUIT_BY_MARK = {};
SUITS.forEach(s => { SUIT_BY_MARK[s.mark] = s.id; });

/* だした ふだの マークの くみあわせ。かたちの きまらない ジョーカーが いたら null（しばりを 作らない）。 */
function suitsOf(cards, meld) {
  const tags = (meld && meld.assign) || {};
  const set = [];
  for (const c of cards) {
    let id = c.suit;
    if (c.joker) { const t = tags[c.key]; id = t ? SUIT_BY_MARK[String(t).charAt(0)] : null; }
    if (!id) return null;
    if (!set.includes(id)) set.push(id);
  }
  return set.sort();
}
function suitSig(cards, meld) { const s = suitsOf(cards, meld); return s ? s.join(',') : null; }
function lockMarks() { return (state.lock || []).map(markOf).join(''); }

/* しばり中に この ふだを だせるか。ジョーカーと ♠3がえし は とめない（コーダ判断・報告ずみ）。 */
function lockOk(cards, meld) {
  if (!state.lock || !ruleLive('lock')) return true;
  if (meld && meld.kind === 'spade3') return true;
  return cards.every(c => c.joker || state.lock.includes(c.suit));
}

/* ============================================================
   ★ あがり きんし（§3-6）― できないことが ふえる ルール その2
   ------------------------------------------------------------
   2・ジョーカー・♠3（スペ3がえしで だした とき）では ゴールできない。
   3だんがまえ：
     ① ほかに 手が ある      → その ふだは「とまる」しるし。おすと りゆうを 出す
     ② その 手しか ない      → だせる。ただし きいろい けいこく ＋ もう1回 おして かくてい
     ③ それで だしたら       → player.foul。じゅんいは いちばん下に なる
   ⚠️「なぜか だせない」を つくらない。だから ①では かならず りゆうを 見せる。
   ============================================================ */
function banCard(card, meld) {
  if (meld && meld.kind === 'spade3') return true;
  return card.joker || card.rank === '2';
}
function banLabel(card, meld) {
  if (card.joker) return 'ジョーカー';
  if (card.rank === '2') return '2';
  if (meld && meld.kind === 'spade3') return '♠3';
  return card.mark + card.rank;
}
/* この だしかたで てふだが 0まいに なり、なかに きんしの ふだが ある か */
function isBanFinish(cards, meld, player) {
  if (!ruleLive('noFinish')) return false;
  if (cards.length !== player.cards.length) return false;
  return cards.some(c => banCard(c, meld));
}
function playable(m) {
  if (!m) return false;
  if (m.kind === 'spade3') return true;
  const f = state.field;
  if (!f) return true;                              // ばが からっぽ：かたちは なんでも OK
  if (m.count !== f.meld.count) return false;       // まいすうが ちがうと だせない
  if (m.kind !== f.meld.kind) return false;         // かたちが ちがうと だせない
  return meldPower(m) > meldPower(f.meld);          // より つよい ものだけ
}
/* ジョーカーが「なにに なったか」の 見出し（→♠7） */
function setAssign(js, rank, used) {
  const usedMarks = used.map(c => c.mark);
  const free = SUITS.map(s => s.mark).filter(m => !usedMarks.includes(m));
  const a = {};
  js.forEach((j, i) => { a[j.key] = (free[i] || '') + rank; });
  return a;
}
const markOf = (suitId) => (SUITS.find(s => s.id === suitId) || {}).mark || '';

/* arr から k こ えらぶ 組み合わせ を ぜんぶ。
   ⚠️「さいしょの k まい」だけを 見ると、おなじ かずが 2まい ある とき
   「2まいめ だけ えらんで だす」が できなく なる（じっさいに つまずいた ところ）。 */
function combos(arr, k) {
  const res = [], idx = [];
  if (k > arr.length || k < 0) return res;
  (function rec(start) {
    if (idx.length === k) { res.push(idx.map(i => arr[i])); return; }
    for (let i = start; i < arr.length; i++) { idx.push(i); rec(i + 1); idx.pop(); }
  })(0);
  return res;
}

/* その人が いま だせる かたち を ぜんぶ ならべる。
   ハイライト・「だす」ボタン・ロボットの しこう が ぜんぶ これを 見る。

   ★ 第2段Bで、ここが 3つに 分かれた：
     out    … ふつうに だせる
     banned … あがりきんしで とまる（ほかに 手が ない ときだけ だせるように なる）
     しばりで だせない ものは、そもそも どちらにも 入れない（＝バッジが りゆうを 出す）
   withBan=true … ハイライトが「とまる ふだ」を 見つける ための よびかた */
function legalPlays(player, withBan) {
  const hand = player.cards;
  const out = [], banned = [];
  if (!hand.length) return out;
  const jokers = hand.filter(c => c.joker);
  const nj = ruleLive('wildJoker') ? jokers.length : 0;
  const add = (cards, meld) => {
    if (!playable(meld)) return;
    if (!lockOk(cards, meld)) return;
    (isBanFinish(cards, meld, player) ? banned : out).push({ cards, meld });
  };

  /* ① おなじ かず（ジョーカーで まいすうを 足せる）
     ⚠️ おなじ かずが 2まい あるとき、combos() で「どの 1まいでも」えらべる ようにする。
        ここを slice(0,k)（＝さいしょの k まい）に すると、
        4♣ は 光るのに 4♦ は 光らない、という バグに なる。 */
  const byRank = {};
  hand.filter(c => !c.joker).forEach(c => { (byRank[c.rank] = byRank[c.rank] || []).push(c); });
  Object.keys(byRank).forEach(rank => {
    const g = byRank[rank];
    const ord = g[0].ord;
    for (let k = 1; k <= g.length; k++) {
      combos(g, k).forEach(base => {
        for (let j = 0; j <= nj; j++) {
          if (k + j > 4) continue;                  // おなじ かずは 4まいまで
          combos(jokers, j).forEach(js => {
            add(base.concat(js),
                { kind:'set', count:k + j, ord, jokerOnly:false, assign:setAssign(js, rank, base) });
          });
        }
      });
    }
  });

  /* ② ジョーカーだけ（1まい＝さいきょう／2まい＝ペア。どうしでは かてない）
        ジョーカーも 2まい あるので、どちらの 1まいでも えらべる ように combos() */
  for (let j = 1; j <= jokers.length; j++) {
    combos(jokers, j).forEach(js => {
      add(js, { kind:'set', count:j, ord:13, jokerOnly:true, assign:{} });
    });
  }

  /* ③ かいだん（おなじ マークの れんばん 3まい いじょう）
        3が いちばん 下・2が いちばん 上。輪には しない（§3-9）。
        かくめい中でも れんばんの はんていは かずの ならびの まま。 */
  if (ruleLive('stairs')) {
    SUITS.forEach(s => {
      const at = {};
      hand.forEach(c => { if (c.suit === s.id) at[c.ord] = c; });
      if (!Object.keys(at).length && !nj) return;
      for (let L = 3; L <= 13; L++) {
        for (let lo = 0; lo + L <= 13; lo++) {
          const have = [], holes = [];
          for (let o = lo; o < lo + L; o++) (at[o] ? have : holes).push(o);
          if (!have.length) continue;               // ほんものが 0まいの かいだんは 作らない
          if (holes.length > nj) continue;
          /* すきまを うめる ジョーカーも「どちらの 1まいでも」えらべる ように combos() */
          combos(jokers, holes.length).forEach(js => {
            const assign = {};
            js.forEach((j, i) => { assign[j.key] = s.mark + ORDER[holes[i]]; });
            add(have.map(o => at[o]).concat(js),
                { kind:'stairs', count:L, lo, hi:lo + L - 1, suit:s.id, assign });
          });
        }
      }
    });
  }

  /* ④ スペ3がえし（ジョーカー1まいの ばだけ） */
  if (canSpade3()) {
    const c = hand.find(x => x.suit === 'spades' && x.rank === '3');
    if (c) add([c], { kind:'spade3', count:1, assign:{} });
  }

  /* ★ あがりきんしの 2だんがまえ（§3-6）
       ・ばに ふだが ある  → パスできる ＝「ほかに 手が ある」。だから とめる。
                            とまった ふだは 'stop' に なり、押すと りゆうが 出る。
       ・ばが からっぽ     → パスできない ＝「その手しか ない」。だから だせるように する。
                            そのかわり きいろい けいこく ＋ もう1回 おして かくてい。
     ⚠️ ここで ぜんぶ とめると、ぜんいん パス → ばが ながれる → また パス、と
        手番が 一生 すすまなく なる。ばが からっぽの ときの にげ道は ぜったいに 消さない。 */
  if (!out.length && !state.field) return banned;
  return withBan ? out.concat(banned) : out;
}

/* えらんだ カードちょうどで つくれる かたち（つよい じゅん）。
   2つ いじょう あるとき ＝ ジョーカーの かいしゃくが えらべる（§3-8）。 */
function keyOf(cards) { return cards.map(c => c.key).slice().sort().join(','); }
function meldsFor(sel, plays) {
  if (!sel.length) return [];
  const k = keyOf(sel);
  return plays.filter(p => keyOf(p.cards) === k)
              .map(p => p.meld)
              .sort((a, b) => meldPower(b) - meldPower(a));
}

/* てふだ 1まいずつの じょうたい（★ハイライト 3じょうたい） */
function handStates(plays) {
  const me = state.players[0];
  const map = {};
  me.cards.forEach(c => { map[c.key] = 'no'; });

  /* 7わたし／10すて の えらぶモード：すきな カードを n まい えらぶ */
  if (state.pending && state.pending.human) {
    const full = state.selected.length >= state.pending.n;
    me.cards.forEach(c => {
      if (state.selected.includes(c.key)) map[c.key] = 'sel';
      else if (!full) map[c.key] = 'play';
    });
    return map;
  }
  if (!isMyTurn()) return map;

  if (!state.selected.length) {
    plays.forEach(p => p.cards.forEach(c => { map[c.key] = 'play'; }));
    /* ★ あがりきんし 1だんめ：だせるはずなのに とまっている ふだに『とまる』の しるし。
       押せなく しない ―― 押したら りゆうを 出す（§3-6・「なぜか だせない」を つくらない）。 */
    if (ruleLive('noFinish')) {
      legalPlays(me, true).forEach(p => {
        if (!isBanFinish(p.cards, p.meld, me)) return;
        p.cards.forEach(c => { if (map[c.key] === 'no') map[c.key] = 'stop'; });
      });
    }
    return map;
  }
  state.selected.forEach(k => { if (k in map) map[k] = 'sel'; });
  plays.forEach(p => {
    const keys = p.cards.map(c => c.key);
    if (state.selected.every(k => keys.includes(k))) {
      keys.forEach(k => { if (!state.selected.includes(k)) map[k] = 'join'; });
    }
  });
  return map;
}
function isMyTurn() {
  return !state.over && !state.busy && !state.pending && state.turn === 0 && !state.players[0].done;
}

/* ───────── 画面 ───────── */
function setMessage(text) { $('message').textContent = text; }

function render() { renderCpu(); renderField(); renderHand(); renderStatus(); renderFlags(); }

function renderStatus() {
  const p = state.players[state.turn];
  $('turnBadge').textContent = state.over ? 'ゲーム終わり！' : (p.human ? 'あなたの番！' : `${p.name}の番`);
  const mine = state.totals[0] || { stars:0 };
  $('scoreChip').textContent = `${state.gameNo}ゲーム目 ・ ⭐${mine.stars}`;
}

/* ★ いまの つよさ・まわる むきを つねに 見せる 帯。
   ここが 狂うと 子どもは なにも わからなく なるので、いちばん 大事な 表示。 */
function renderFlags() {
  const rev = reversed();
  const causes = [];
  if (state.revolution) causes.push('革命');
  if (state.jackBack)   causes.push('Jバック');
  let html = '';
  if (rev) {
    html += `<span class="flag flag-rev">⚡ 今 強さが ぎゃく！<small>${causes.join('＋')}中</small></span>`;
  } else if (causes.length >= 2) {
    html += `<span class="flag flag-back">${causes.join('＋')}で強さは もとどおり</span>`;
  }
  /* ★ しばり バッジ（§3-5・ルルの じょうけん）
     「いま なにに しばられているか」が 見えない しばりは 入れない やくそく。
     ここを 消したら しばり も 消すこと。 */
  if (ruleLive('lock') && state.lock && state.lock.length) {
    const m = lockMarks();
    html += `<span class="flag flag-lock">🔒 ${m} 縛り中<small>${m}だけ出せるよ</small></span>`;
  }
  html += `<span class="flag flag-order ${rev ? 'rev' : ''}">${rev ? ORDER_TEXT_REV : ORDER_TEXT}</span>`;
  if (ruleLive('nineRev')) {
    html += `<span class="flag flag-dir ${state.revDir ? 'on' : ''}">${state.revDir ? '↺ ぎゃくまわり' : '↻ ふつうまわり'}</span>`;
  }
  /* ★ みやこおち バッジ（§8-2）― 自分が ねらわれている ときは ここに 出す。
     ロボットの ぶんは アバターの 上（renderCpu）。バッジが ないと ただの 事故に なる。 */
  if (ruleLive('fallDown') && state.crown === 0 && !state.players[0].done && !state.over) {
    html += `<span class="flag flag-crown">👑 あなたは ねらわれてる！<small>1位を とらないと一番下</small></span>`;
  }
  $('flagRow').innerHTML = html;
}

function renderCpu() {
  $('cpuArea').innerHTML = state.players.slice(1).map((p, i) => {
    const idx = i + 1;
    const cls = ['cpu'];
    if (p.done) cls.push('is-done');
    if (p.passed) cls.push('is-rest');
    if (state.turn === idx && !state.over) cls.push('is-turn');
    /* ⚠️ ルールで おちた人（みやこおち／あがりきんし）に とちゅうの よびなを 出さない。
       じゅんいが きまるのは endGame() なので、それまでは「いちばん下」とだけ 出す
       （「いちばん下 富豪（2位）」の ような ちぐはぐな 表示に なる ため）。 */
    /* ⚠️ ゲームが 終わる とき、手札が のこったままの人も done に なる。
       その人に「ゴール！」と 出さない（ゴールして いない ので）。よびなだけ 出す。 */
    const title = p.place ? TITLES[p.place - 1] : '';
    const sub = p.done
      ? (p.foul ? 'ルールで下がった' : (p.cards.length ? title : `ゴール！ ${title}`))
      : (p.passed ? 'お休み中' : `${p.cards.length}枚`);
    const backs = Array.from({ length: Math.min(p.cards.length, 14) }, () => '<span class="cpu-card"></span>').join('');
    /* ★ みやこおち：ねらわれている人には つねに バッジ（§8-2）。
       ★T101（社長指示）：文字は消して 王冠👑だけ。「前の回の1位」の 印として 静かに 出しっぱなしに する。
       （判定の 条件は 1文字も 変えて いない。見た目の 中身だけ） */
    const crown = (ruleLive('fallDown') && state.crown === idx && !p.done && !state.over)
      ? '<span class="crown-warn">👑</span>' : '';
    return `<div class="${cls.join(' ')}">${crown}<div class="cpu-name">🤖 ${p.name}<small>${sub}</small></div>`
         + `<div class="cpu-cards">${backs}</div></div>`;
  }).join('');
}
function renderField() {
  const f = state.field;
  if (!f) {
    $('field').innerHTML = '<p class="field-empty">場は からっぽ。好きなカードから出せるよ！</p>';
    $('fieldWho').textContent = '';
    return;
  }
  const tags = f.meld.assign || {};
  $('field').innerHTML = f.cards.map(c => cardHTML(c, undefined, tags[c.key])).join('');
  /* ★T100③（社長指示）：「◯◯が出した 2枚」の 表示は 消した（言わなくても わかる）。
     f.meld.count（数える 処理 そのもの）は ルールの 判定で 使うので、1文字も さわって いない。 */
}

let handSig = '';
function renderHand() {
  const me = state.players[0];
  const plays = isMyTurn() ? legalPlays(me) : [];
  const map = handStates(plays);
  const sel = me.cards.filter(c => state.selected.includes(c.key));
  const cands = state.pending ? [] : meldsFor(sel, plays);
  const meld = cands.length ? cands[state.altIndex % cands.length] : null;
  const tags = (meld && meld.assign) ? meld.assign : {};

  const box = $('hand');
  const sig = me.cards.map(c => c.key).join(',');
  if (sig === handSig) {
    /* カードの ならびが おなじ ときは 中身を 作りなおさない。
       ＝ えらぶ たびに 画像を 読みなおして チラつく のを ふせぐ。 */
    box.querySelectorAll('[data-key]').forEach(el => {
      const k = el.dataset.key;
      const m = map[k];
      /* ★T99②：みどり（いっしょに だせる）に なった しゅんかん、1回だけ ぴょこんと 上げる。
         えらんだ ふだは 14px 上がるのに、みどりは 1pxも うごかなかった（T98 §3-2）。
         ★場が からっぽの ときは「1枚出す」で 押せて しまう ので、
           気づかない 人は みどりを 見ないまま 1枚で 出して しまう（自分の番の 18%）。
         うごく のは 6px・1回きり。★文字は 1文字も ふえない。 */
      const wasJoin = el.classList.contains('can-join');
      el.classList.toggle('can-play', m === 'play');
      el.classList.toggle('can-join', m === 'join');
      if (m === 'join') {
        if (!wasJoin) {
          if (el.classList.contains('join-pop')) { el.classList.remove('join-pop'); void el.offsetWidth; }
          el.classList.add('join-pop');
        }
      } else if (el.classList.contains('join-pop')) {
        el.classList.remove('join-pop');
      }
      el.classList.toggle('selected', m === 'sel');
      el.classList.toggle('cant-finish', m === 'stop');
      el.disabled = (m === 'no');
      el.setAttribute('aria-pressed', String(m === 'sel'));
      const old = el.querySelector('.wild-tag');
      if (old) old.remove();
      if (tags[k]) el.insertAdjacentHTML('beforeend', tagHTML(tags[k]));
    });
  } else {
    handSig = sig;
    box.innerHTML = me.cards.map(c => cardHTML(c, map[c.key], tags[c.key])).join('');
  }
  $('handCount').textContent = `${me.cards.length}枚`;

  /* 7わたし／10すて／カードこうかん の えらぶモード */
  if (state.pending && state.pending.human) {
    const n = state.pending.n;
    const left = n - state.selected.length;
    $('playMain').textContent = state.pending.type === 'drop' ? '捨てる' : 'わたす';
    $('playBtn').disabled = left !== 0;
    $('playBtn').classList.remove('is-warn');
    $('playText').textContent = left > 0 ? `あと ${left}枚選んでね` : 'これで いいよ！';
    $('passBtn').disabled = true;
    $('passText').textContent = '今は使えないよ';
    $('altBtn').classList.add('hidden');
    return;
  }

  $('playMain').textContent = '出す';
  const ok = Boolean(meld);
  /* ★ あがりきんし 2だんめ：ほかに 手が なくて きんしの ふだで あがる ばあい。
     だせる ように したまま、きいろい けいこくを 出す（§3-6）。 */
  const warn = ok && isBanFinish(sel, meld, me);
  $('playBtn').disabled = !ok;
  $('playBtn').classList.toggle('is-warn', Boolean(warn));
  $('playText').textContent = !isMyTurn() ? '待ってね'
    : (!sel.length ? 'カードを選んでね'
    : (warn ? 'これで あがると一番下！'
    : (ok ? (meld.kind === 'spade3' ? '♠3で返す！' : `${sel.length}枚出す`) : 'まだ出せないよ')));

  /* ジョーカーの かいしゃくが 2つ いじょう ある ときだけ 出す（§3-8） */
  $('altBtn').classList.toggle('hidden', cands.length < 2);
  if (cands.length >= 2) {
    const n = cands[(state.altIndex + 1) % cands.length];
    $('altBtn').textContent = `🃏 別の形にする（${cands.length}つ）`;
    $('altBtn').title = String(meldPower(n));
  }

  /* ばが からっぽの ときは パスできない（かならず だす） */
  const canPass = isMyTurn() && Boolean(state.field);
  $('passBtn').disabled = !canPass;
  $('passText').textContent = state.field ? '出せない ときは これ' : '場が からっぽ。出そう！';
}

/* ルールが はつどうした ときの おしらせ（★ desc は RULES から もってくる）
   extra … 「いま なにが 起きたか」の ぐたいてきな 1行（♠しばり！ など）。
           ルールの せつめい文とは べつ ものなので、ここで 足す（RULES は よごさない）。 */
/* けんしょう用の のぞきあな（ふだんは null。window.DF.hook から さす）。
   ゲームの うごきは 1ミリも 変えない。数を かぞえる ためだけ。 */
const HOOK = { play:null, rule:null };

/* ★ おしらせの 順番待ち（T97）
   ------------------------------------------------------------
   もんだい：同じ 一瞬に 2つ以上の ルールが はつどうする 手が 14.5% ある。
     いままでは あとから 来た ほうが まえの おしらせを **上書き** していたので、
     まえの おしらせが 3ミリ秒しか 出ず、1文字も 読めない ことが あった。
     じっさいに ♠9♥9♦9♣9 を 出すと「革命！」が 一度も 画面に 出なかった
     （すぐ あとの「9リバース」に 消されて いた）。

   なおし方：**上書きを やめて、順番待ちに する。**
     ・まえの おしらせが 出ている あいだに 来た ものは、消さずに ならばせる。
     ・まっている ものが ある あいだは、いま 出ている ほうを 早めに 切りあげる
       （はじめて 出す ぶんは 説明の 全文が 入って いるので 1.4秒、
         2回目からは みじかい 1行 なので 0.9秒 まで。だれも まって いなければ 今までどおり）。
     ・**捨てない。** 順番を 変えるだけ。捨てたら それは また
       「出ないまま 消えた おしらせ」に なって、なおした ことに ならない。
     ・ならんだ 中から 出す 順は「つよさが かわる」ほうが さき：

         3 … つよさが かわる（革命・階段革命・Jバック・スペ3返し）
         2 … きをつける／かいを つなぐ（縛り・上がり禁止・都落ち・カード交換）
         1 … それ以外（場が うごく だけ）

     ・同じ ばんごう なら、さきに 起きた ほうから。

   ⚠️ ゲームの はやさ（SPEED）は 1ミリも さわらない。
      おしらせは ゲームの ながれを 止めない ので、試合の 長さは 変わらない。
   ⚠️ 画面に 出す 文字は ふやさない。**出す 順番だけ** の なおし（設計図 §5.5）。 */
const FLASH_PRI = { power:3, care:2, link:2 };
/* first/again … だれも まって いない ときの ふつうの 長さ（ここは 今までどおり）
   holdFirst/hold … うしろが つかえて いる ときの 最短。ここまでは かならず 出しきる */
const FLASH_MS  = { first:2000, again:1100, holdFirst:1400, hold:900 };
/* 順番待ちの 上かぎり（あんぜん弁）。
   あふれた ときだけ、いちばん 下の いちばん 古い ものから 落とす。
   ★T99：8 → 16 に 上げた。
   T97 は「300試合で 一度も 出番なし」と 書いたが、★実は ぎりぎり だった ――
   種を 6つ・打ち方を 3つ で はかると、直す前でも 深さは すでに **8**（＝上かぎり ちょうど）
   まで 来て いた（90210×naive／31337×mirror）。★T99 の 点滅（120ミリ秒）で 9 に なり、
   ★おしらせが 1件 捨てられた（＝T97 の「消えた 0回」が こわれた）。
   実測の いちばん 深い ところ 9 の 倍を とって 16。★あふれる ための 弁では なく、
   万一 かぎりなく たまった ときの 安全弁 なので、大きくても 害は ない。 */
const FLASH_MAX = 16;
/* ★T99①：おしらせが 入れかわる ときは、いったん 箱を 消してから 次を 出す。
   T98（トライ）の 実測 ―― 箱は 濃さ 1.00 の まま 文字だけ 入れかわる ので、
   ★おしらせの 39〜57%（最長 5連続）の「押しのけ」が ぜんぶ 1つに 見えていた。
   ★革命が 2回 起きても 1回に 見える。
   人は「消えて、また 出た」で 数を かぞえる ので、消えない かぎり 数えられない。
   120ミリ秒は「点滅」として 見える いちばん 短い 長さ（T98 §6-3）。
   ⚠️ おしらせは ゲームの ながれを 止めない ので、試合の 長さは 変わらない。 */
const FLASH_GAP = 120;
/* ★T99③：説明の 全文が 1.4秒に 切りあげられた ときは fired を 立てず、
   つぎに 同じ ルールが 起きた とき もう一度 全文の チャンスを 出す（T98 §4-5）。
   ⚠️ ただし「一度は 最後まで 見せる」が ねらい で、「毎回 出す」ではない（社長の 指示）。
      しばりは 60試合で 285回も 起きる ので、上かぎりが ないと 全文が 出つづける。
      ここまで 試して だめなら あきらめて、みじかい 1行に 切りかえる。 */
const FLASH_TRY = 3;
/* ★T99③の 手綱：全文を もう一度 出すのは、まえに 出そうとして から
   これだけ たって から。★「一度は 最後まで 見せる」が ねらい で、「毎回 出す」ではない。
   これが 無いと 9リバース・8切りの 全文が ★1.5秒 おきに 2回 出た（実測）。
   20秒 に すると、1試合（約75秒）の 中で 同じ 説明は 多くて 2〜3回・20秒 いじょう あく。 */
const FLASH_COOL = 20000;
const flashQ = [];        // 順番待ち { id, extra, pri, at }
let flashFrom  = 0;       // いま 出ている おしらせが 出はじめた 時こく
let flashUntil = 0;       // いま 出ている おしらせが 消える 時こく
let flashMin   = 0;       // いま 出ている おしらせを 切りあげて いい 最短の 長さ
let flashTimer = 0;
let flashCur   = null;    // ★いま 出ている おしらせ { id, first, full }

function flashReset() {
  flashQ.length = 0;
  flashFrom = flashUntil = flashMin = 0;
  flashCur = null;
  window.clearTimeout(flashTimer);
  const box = $('ruleFlash');
  if (box) box.classList.remove('show');
}

function fireRule(id, extra) {
  const r = RULE(id);
  if (!r) return;
  if (HOOK.rule) HOOK.rule(id);

  const now = Date.now();
  /* ★T99①：まだ 箱が 出ている（flashCur）なら、たとえ 時間切れ ちょうど でも
     直に 書きかえない。かならず flashNext を 通して 点滅を はさむ。
     （ここを now < flashUntil だけに すると、同じ 1ミリ秒に 重なった とき
       1.2% だけ「文字だけ 入れかわる」が のこった） */
  if (flashCur || now < flashUntil) {
    flashQ.push({ id, extra, pri: FLASH_PRI[r.group] || 1, at: now });
    while (flashQ.length > FLASH_MAX) {
      let w = 0;                        // いちばん 下の いちばん 古い もの
      for (let i = 1; i < flashQ.length; i++) if (flashQ[i].pri < flashQ[w].pri) w = i;
      flashQ.splice(w, 1);
    }
    /* まっている ものが できたので、いま 出ている ほうを 切りあげる
       （ただし flashMin は かならず 出しきる。0ミリ秒で 消える 事故を なくす のが 目的） */
    const cut = Math.max(flashFrom + flashMin, now);
    if (cut < flashUntil) {
      flashUntil = cut;
      window.clearTimeout(flashTimer);
      flashTimer = window.setTimeout(flashNext, cut - now);
    }
    return;
  }
  showFlash(id, extra, true);   /* ★静かな とき ＝ うしろに 何も ならんで いない */
}

function showFlash(id, extra, quiet) {
  const r = RULE(id);
  if (!r) return;
  /* ★T99③：ここでは まだ fired を 立てない。
     「最後まで 出しきれたか」が わかる 消える とき（flashDone）に 立てる。
     ★ただし 直前に 全文を 出そうとした ばかり なら、今回は みじかい 1行に する
       （同じ 説明が 短い あいだに 何度も 出ない ように）。 */
  const now0 = Date.now();
  const cool = state.longAt[id] !== undefined && (now0 - state.longAt[id]) < FLASH_COOL;
  /* ★2回目 いこうの チャンスは「静かな とき」だけ 使う。
     おしらせが 続けざまに 起きて いる さいちゅうに 全文を 出しても、
     また 1.4秒で 切りあげられて 読めない うえ、★うしろの 待ちを のばす だけ
     （ここを 見ないと 順番待ちが あふれて、おしらせが 1件 消えた ―― 実測）。
     ★静かな とき なら 2.0秒 まるごと 読める。
     （はじめての 1回は 今までどおり、つかえて いても 出す） */
  const room = quiet || state.tried[id] === undefined;
  const first = !state.fired[id] && !cool && room;
  if (first) state.longAt[id] = now0;
  const line = first ? descOf(r) : (r.flash || '');
  const box = $('ruleFlash');
  box.innerHTML = `<b>${r.name}！</b>`
    + (extra ? `<span class="flash-extra">${extra}</span>` : '')
    + (line ? `<span>${line}</span>` : '');
  box.classList.add('show');
  /* うしろが つかえて いない ときは ふつうの 長さ。つかえて いる ときだけ 切りあげる。
     はじめて 出す ぶんは 説明の 全文が 入って いるので、切りあげても 長めに のこす。 */
  const full = first ? FLASH_MS.first : FLASH_MS.again;
  const now = Date.now();
  flashMin  = Math.min(full, first ? FLASH_MS.holdFirst : FLASH_MS.hold);
  flashFrom = now;
  flashUntil = now + (flashQ.length ? flashMin : full);
  flashCur = { id, first, full };
  window.clearTimeout(flashTimer);
  flashTimer = window.setTimeout(flashNext, flashUntil - now);
}

/* ★T99③：いま 出ていた おしらせが 消える とき、全文を 出しきれたか を 見る。
   出しきれた       → もう 全文は 出さない（今までどおり）
   切りあげられた   → fired を 立てない ＝ つぎに もう一度 全文の チャンス
   ただし FLASH_TRY 回 だめだったら あきらめる（同じ 全文が 出つづけない ように） */
function flashDone() {
  const cur = flashCur;
  flashCur = null;
  if (!cur) return;
  if (!cur.first) return;                       // みじかい 1行 ＝ もう fired 済み
  if (Date.now() - flashFrom >= cur.full - 20) { state.fired[cur.id] = true; return; }
  const t = (state.tried[cur.id] || 0) + 1;
  state.tried[cur.id] = t;
  if (t >= FLASH_TRY) state.fired[cur.id] = true;
}

function flashNext() {
  flashDone();
  const box = $('ruleFlash');
  if (!flashQ.length) {
    if (box) box.classList.remove('show');
    flashUntil = 0;
    return;
  }
  /* ★T99①：入れかわる ときは いったん 箱を 消す（120ミリ秒）。
     この あいだも「まだ ふさがっている」ことに して おく ＝ あとから 来た ものは
     割りこまずに 順番待ちに 入る（T97 の「捨てない」を こわさない）。 */
  if (box) box.classList.remove('show');
  const now = Date.now();
  flashFrom = now; flashMin = FLASH_GAP; flashUntil = now + FLASH_GAP;
  window.clearTimeout(flashTimer);
  flashTimer = window.setTimeout(flashPick, FLASH_GAP);
}

function flashPick() {
  if (!flashQ.length) { flashUntil = 0; return; }
  /* ★ ならんだ 中から「つよさが かわる」ほうを 先に 出す。
     ⚠️ 古いから といって 捨てない。捨てたら それは また
        「出ないまま 消えた おしらせ」に なって、なおした ことに ならない。 */
  let b = 0;
  for (let i = 1; i < flashQ.length; i++) {
    if (flashQ[i].pri > flashQ[b].pri) b = i;      // 同じなら さきに 来た ほう
  }
  const n = flashQ.splice(b, 1)[0];
  showFlash(n.id, n.extra);
}

/* ───────── ルール設定の 画面（器） ───────── */
function applyPreset(id) {
  state.preset = id;
  RULES.forEach(r => { state.ruleOn[r.id] = r.presets.includes(id); });
  renderRulePanel();
}
function countOn() { return RULES.filter(r => state.ruleOn[r.id]).length; }
function renderRulePanel() {
  $('presetRow').innerHTML = PRESETS.map(p =>
    `<button type="button" class="preset ${state.preset === p.id ? 'on' : ''}" data-preset="${p.id}">`
    + `<b>${p.label}${p.recommend ? ' ★' : ''}</b><small>${p.note}</small></button>`).join('');
  $('ruleCount').textContent = `（今 ${countOn()}/${RULES.length}個 ON）`;

  $('ruleList').innerHTML = RULE_GROUPS.map(g => {
    const rows = RULES.filter(r => r.group === g.id).map(r => {
      const blocked = r.ready && !needsMet(r);        // §7-3 いぞんスイッチの はいいろ化
      const mark = !r.ready ? '<i class="soon">準備中</i>'
                 : (blocked ? '<i class="soon">階段と革命を ONにしてね</i>' : '');
      return `
      <label class="rule-row ${(r.ready && !blocked) ? '' : 'not-ready'}">
        <input type="checkbox" data-rule="${r.id}" ${state.ruleOn[r.id] ? 'checked' : ''} ${(r.ready && !blocked) ? '' : 'disabled'}>
        <span class="rule-name">${r.name}${mark}</span>
        <span class="rule-desc">${descOf(r)}</span>
      </label>`;
    }).join('');
    return `<div class="rule-group ${g.warn ? 'warn' : ''}"><h4>${g.label}</h4>`
         + (g.note ? `<p class="group-note">${g.note}</p>` : '') + rows + '</div>';
  }).join('');
}

/* ============================================================
   ★ あそびかた【そう3】＝「いま つかってる ルール」（§6-1・ルルの 3層せっけい）
   ------------------------------------------------------------
   そう1（かちかた 1行）・そう2（きほん 5行）は index.html の 固定。
   ここは **ONの ルールだけ** を RULES から 作る。
   ⚠️ OFFの ルールは 1文字も 出さない ―― 長さの げんいんは ルールの 数では なく
      「つかっていない ルールの せつめいを 読まされる こと」だった（ルル §6-2）。
   ならびは RULE_GROUPS の じゅん
   （だせる かたちが ふえる → ばが うごく → つよさが かわる → きをつける → つなぐ）。
   ============================================================ */
function renderRuleList(target) {
  const rank = (r) => RULE_GROUPS.findIndex(g => g.id === r.group);
  const on = RULES.filter(r => state.ruleOn[r.id]).sort((a, b) => rank(a) - rank(b));
  target.innerHTML = `<p class="live-head">今使ってるルール（${on.length}個）</p>`
    + (on.length ? on.map(r => {
        const blocked = r.ready && !needsMet(r);
        const mark = !r.ready ? '<i class="soon">準備中</i>'
                   : (blocked ? '<i class="soon">階段と革命が いるよ</i>' : '');
        const care = r.group === 'care' ? ' is-care' : '';
        return `<div class="live-rule${care} ${(r.ready && !blocked) ? '' : 'not-ready'}">`
             + `<b>${r.name}${mark}</b><span>${descOf(r)}</span></div>`;
      }).join('')
      : '<p class="live-rule"><span>追加のルールはなし。基本だけで遊ぶよ。</span></p>');
}

/* ───────── ゲームの すすみ ───────── */
function startGame(keepScore) {
  /* ★ まえの ゲームの タイマーを ぜんぶ 無効に する（later() を 見てね）。
     ここを わすれると、まえの 回の 手番が 新しい 回に 割りこんで、
     ロボットが 2回 うごいたり ゲームが 止まったり する。 */
  state.epoch += 1;
  state.players = [{ name:'あなた', human:true, cards:[], passed:false, done:false, place:0, foul:false }];
  for (let i = 1; i <= 3; i++) {
    state.players.push({ name:`ロボット${i}`, human:false, cards:[], passed:false, done:false, place:0, foul:false });
  }
  if (!keepScore) {
    state.totals = state.players.map(() => ({ stars:0, firsts:0 }));
    state.gameNo = 1;
    state.nextStarter = null;
    state.lastRank = null;
    state.crown = null;
  }
  state.field = null; state.finished = []; state.selected = []; state.altIndex = 0;
  state.busy = false; state.over = false; state.fired = {}; state.tried = {}; state.longAt = {};
  flashReset();          /* ★ まえの ゲームの おしらせが 順番待ちに のこらない ように */
  state.revolution = false; state.jackBack = false; state.revDir = false;
  state.pending = null; state.after = null;
  state.lock = null; state.warnKey = '';
  handSig = '';

  const deck = shuffle(createDeck());
  deck.forEach((c, i) => state.players[i % 4].cards.push(c));
  state.players.forEach(sortHand);

  /* 1ゲームめは ♦3の 人から。2ゲームめ いこうは まえの かいの さいかいから（§5-2）。 */
  if (state.nextStarter != null) state.turn = state.nextStarter;
  else state.turn = state.players.findIndex(p => p.cards.some(c => c.suit === 'diamonds' && c.rank === '3'));
  if (state.turn < 0) state.turn = 0;
  state.lastPlayer = state.turn;

  $('startScreen').classList.add('hidden');
  $('gameScreen').classList.remove('hidden');
  render();
  /* ★ カードこうかんは くばった あと・はじまる まえ（§5-2 の 2ばん） */
  runSwap(() => {
    /* ⚠️ ここで state.busy を false に しては いけない（むしろ true の まま 止める）。
       手番が はじまるのは この 下の beginTurn（SPEED.step びょう後）。
       さきに false に すると、その あいだ **手札が おせる のに 手番は まだ**
       という すきまが できる。そこで「出す」を おすと、
       あとから 来た beginTurn が もう一度 busy を false に して、
       おなじ 手番で 2回 出せて しまい、ゲームが 止まる。
       手番を わたすのは beginTurn の しごと ―― 1か所に まとめる。 */
    state.busy = true;
    setMessage(`${state.players[state.turn].name}から スタート！`);
    render();
    later(beginTurn, SPEED.step);
  });
}

/* ============================================================
   ★ カードこうかん（§8-1）― かいと かいを つなぐ ルール
   ------------------------------------------------------------
   4人なので くみあわせは 2つで 固定：
     大富豪（1位）⇄ 大貧民（4位） … 2まい
     富豪（2位）  ⇄ 貧民（3位）   … 1まい
   ⚠️ わたし方が 上下で ちがう（ここが 子どもへの はいりょ の ぜんぶ）：
     下の人 → いちばん つよい ふだが 自動で 出ていく（つらい えらびを させない）
     上の人 → すきな ふだを えらんで わたす（＝ごほうびの えらび）
   ⚠️ 子どもは「知らないうちに カードが へった」と 感じる ので、
      なにが 起きたかを かならず 画面に 出してから ゲームを はじめる。
   ※ まいすうは 仕様書 §8-1 の とおり（2まい／1まい）。
   ============================================================ */
function handOver(cards, from, to) {
  const keys = cards.map(c => c.key);
  from.cards = from.cards.filter(c => !keys.includes(c.key));
  cards.forEach(c => to.cards.push(c));
  sortHand(from); sortHand(to);
  handSig = '';
}
const cardNames = (cards) => cards.map(c => c.joker ? '🃏' : c.mark + c.rank).join(' と ');

function runSwap(after) {
  if (!(ruleLive('swap') && state.gameNo > 1 && state.lastRank && state.lastRank.length === 4)) return after();
  state.busy = true;

  const jobs = [[0, 3, 2], [1, 2, 1]].map(([hi, lo, n]) => ({
    hi: state.players[state.lastRank[hi]], lo: state.players[state.lastRank[lo]],
    hiTitle: TITLES[hi], loTitle: TITLES[lo], n,
  }));

  /* ① 下の人 → 上の人（いちばん つよい ふだが 自動で 出ていく） */
  jobs.forEach(j => {
    j.got = j.lo.cards.slice().sort((a, b) => strength(b) - strength(a)).slice(0, j.n);
    handOver(j.got, j.lo, j.hi);
  });
  /* ② 上の人 → 下の人。ロボットは いちばん よわい ものを かえす */
  jobs.forEach(j => {
    if (j.hi.human) return;
    j.back = j.hi.cards.slice().sort((a, b) => strength(a) - strength(b)).slice(0, j.n);
    handOver(j.back, j.hi, j.lo);
  });
  render();

  const mine = jobs.find(j => j.hi.human);       // 自分が 上位（えらぶ）
  const meLo = jobs.find(j => j.lo.human);       // 自分が 下位（自動）

  if (mine) {
    fireRule('swap', `${mine.hiTitle}の ごほうび！ ${mine.lo.name}から ${cardNames(mine.got)} を もらったよ`);
    state.pending = { type:'swap', n:mine.n, player:mine.hi, human:true, to:mine.lo, then:after };
    state.selected = [];
    state.busy = false;
    render();
    setMessage(`${mine.lo.name}から ${cardNames(mine.got)} を もらったよ！ いらないカードを ${mine.n}枚選んでね`);
    return;
  }
  const msg = meLo
    ? `強いカード ${meLo.n}枚（${cardNames(meLo.got)}）を ${meLo.hi.name}に わたした。かわりに ${cardNames(meLo.back)} を もらったよ`
    : 'ロボットどうしでカードを とりかえたよ';
  fireRule('swap', msg);
  setMessage(msg);
  render();
  later(after, SPEED.flow * 3);
}

function beginTurn() {
  if (state.over) return;
  /* えらぶモード（7わたし／10すて／カードこうかん）の あいだは 手番を すすめない。
     まえの ゲームの のこり タイマーが われこんで、こうかん中に ロボットが
     うごきだす のを ふせぐ。 */
  if (state.pending) return;
  const p = state.players[state.turn];
  if (p.done || p.passed) return goNext();
  if (p.human) {
    state.busy = false; render();
    if (canSpade3() && p.cards.some(c => c.suit === 'spades' && c.rank === '3')) {
      setMessage('ジョーカーには ♠3！ 光ってるよ');
    } else {
      setMessage(legalPlays(p).length ? '光ってるカードを選んで「出す」！' : '出せるカードが ないね。パス しよう。');
    }
    return;
  }
  state.busy = true; render();
  setMessage(`${p.name}は考え中…`);
  later(cpuTurn, SPEED.think);
}

/* ============================================================
   ★ ロボットの しこう ―― 第4段（T96）「まとめて 出す」
   ------------------------------------------------------------
   ★むかしの ロボット（第2段A）は こう だった：
       いちばん 弱い 手 → おなじ 強さなら **まいすうが 少ないほう**
   ★これだと ばが からっぽの とき、かならず「いちばん 弱い ふだ 1まい」を 出す。
     すると ばが 1まいに なり、次の人も 1まいしか 出せない。それが 最後まで つづく。
   ★トライの しらべ（T94 §12）：**1,921手の うち 1まい出しが 100.0%**。
     その せいで **革命・かいだん・かいだんかくめい・ジョーカーワイルドの 4つが、
     60試合で 1回も 出なかった**。15この ルールの うち 4つが ねむったまま だった。

   ★直したのは 1か所だけ ―― **ばが からっぽの ときの えらび方**。
   「弱い ふだから 出す」は そのまま。**おなじくらい 弱いなら まとめて 出す**に した。

       てん ＝ その かたちの つよさ － dump × (まいすう－1)   ← 小さいほど えらばれる

   ★ばに ふだが ある ときは **1文字も かえていない**（＝いちばん 弱い 手で こたえる）。
     まいすうは ばと 同じに しばられる ので、かえる 必要が ない。

   ------------------------------------------------------------
   ★★ CPU の 2つの 数（ここを さわると ロボットの 強さが 変わる）

   dump    … 「1まい よけいに 出せる ことの ねうち」。大きいほど まとめて 出す。
   minHand … てふだが これより 少なく なったら、まとめ出しを やめて 1まいずつ 出す。
             （＝しょうばんは まとめて、おわりぎわは ていねいに、という 人の くせ）

   ★1.2 と 6 は **12,000試合の 実測で えらんだ**（T96 の 作業メモに 表）。
     人の 1位率（1枚しか出さない人）が いちばん 下がらず、
     それでいて 4つの ルールが ちゃんと 出る 組み合わせ。

   ⚠️ **むかしの ロボットに もどしたい ときは `minHand` を 99 に する**（それだけ）。
   ⚠️ dump を 上げると ロボットが 強くなる。子どもが 勝てなく なるので かるく さわらない。
   ============================================================ */
const CPU = { dump: 1.2, minHand: 6 };

function cpuPick(p, plays) {
  if (!plays.length) return null;
  /* ジョーカーは てふだが へるまで とっておく（第2段Aから かえていない） */
  const noJoker = plays.filter(x => !x.cards.some(c => c.joker));
  if (noJoker.length && p.cards.length > 3) plays = noJoker;

  /* ★ばが からっぽ ＝ かたちを じぶんで 決められる。ここで まとめ出しの 目が うまれる */
  if (!state.field && p.cards.length >= CPU.minHand) {
    const score = (x) => meldPower(x.meld) - CPU.dump * (x.cards.length - 1);
    let best = Infinity;
    plays.forEach(x => { const s = score(x); if (s < best) best = s; });
    const same = plays.filter(x => score(x) === best);
    return same[Math.floor(Math.random() * same.length)];
  }

  /* ばに ふだが ある／のこりが 少ない ときは むかしの まま */
  plays = plays.slice().sort((a, b) => meldPower(a.meld) - meldPower(b.meld) || a.cards.length - b.cards.length);
  const top = plays[0];
  const same = plays.filter(x => meldPower(x.meld) === meldPower(top.meld) && x.cards.length === top.cards.length);
  return same[Math.floor(Math.random() * same.length)];
}

function cpuTurn() {
  if (state.over) return;
  const p = state.players[state.turn];
  const plays = legalPlays(p);
  if (!plays.length) return pass(p);
  const pick = cpuPick(p, plays);
  if (!pick) return pass(p);
  playCards(p, pick.cards, pick.meld);
}

function playCards(player, cards, meld) {
  const prev = state.field;
  /* ★ あがりきんし 3だんめ：きんしの ふだで あがったら「いちばん下」の しるし。
     じゅんいの けいさんは endGame() 1か所だけで やる（ばらばらに しない）。 */
  const foul = (player.cards.length === cards.length) && isBanFinish(cards, meld, player);

  if (HOOK.play) HOOK.play({ count: cards.length, kind: meld.kind,
                             who: player.name, human: !!player.human });

  const keys = cards.map(c => c.key);
  player.cards = player.cards.filter(c => !keys.includes(c.key));
  state.selected = [];
  state.altIndex = 0;
  state.warnKey = '';
  state.lastPlayer = state.players.indexOf(player);
  if (foul) player.foul = true;

  /* ★ しばり：ばに 出た 2回れんぞくが おなじ マークの くみあわせ なら しばり はっせい（§3-5） */
  if (ruleLive('lock') && prev && meld.kind !== 'spade3' && !state.lock) {
    const a = suitSig(prev.cards, prev.meld), b = suitSig(cards, meld);
    if (a && b && a === b) {
      state.lock = suitsOf(cards, meld);
      const m = lockMarks();
      fireRule('lock', `${m}縛り！ 場が流れるまで ${m}しか出せないよ`);
    }
  }

  /* ★ スペ3がえし：ジョーカー1まいを ♠3 で かえして ばを ながす（§3-7） */
  if (meld.kind === 'spade3') {
    state.field = null;
    setMessage(`${player.name}は ♠3でジョーカーを返した！`);
    if (player.cards.length === 0) goal(player);
    render();
    fireRule('spade3');
    return later(() => flowField('♠3で場が流れたよ！ 好きなカードから出せるよ', state.lastPlayer), SPEED.step);
  }

  state.field = { cards, meld, by: player.name };
  const tags = meld.assign || {};
  const what = cards.map(c => c.joker ? (tags[c.key] ? `🃏→${tags[c.key]}` : '🃏') : c.mark + c.rank).join(' ');
  setMessage(`${player.name}は ${what} を出したよ！`);
  if (player.cards.length === 0) goal(player);
  render();
  afterPlay(player, cards, meld);
}

/* ============================================================
   だした あとの こうか ― じゅんばんに しょりする
   ------------------------------------------------------------
   ① かくめい／かいだんかくめい ② Jバック（①②は 逆転フラグ）
   ③ 9リバース ④ 10すて ⑤ 7わたし ⑥ 8きり（ながす）／5とび（とばす）
   ※ 8きりが あるときは 8きり ゆうせん（§3-11）。
   ※ ジョーカーが ワイルドで「7」などに なった ぶんも かずに 入れる
     （＝ジョーカーは その カードに なっている、という 考え方。ルル・社長に かくにん中）。
   ============================================================ */
function afterPlay(player, cards, meld) {
  const tags = meld.assign || {};
  const ranks = [];
  cards.forEach(c => {
    if (!c.joker) ranks.push(c.rank);
    else if (tags[c.key]) ranks.push(String(tags[c.key]).replace(/^[♠♥♦♣]/, ''));
  });
  const cnt = (r) => ranks.filter(x => x === r).length;

  let flips = 0;
  if (ruleLive('revolution') && meld.kind === 'set' && cards.length >= 4) {
    state.revolution = !state.revolution; flips++; fireRule('revolution');
  } else if (ruleLive('stairRev') && meld.kind === 'stairs' && cards.length >= 4) {
    state.revolution = !state.revolution; flips++; fireRule('stairRev');
  }
  if (ruleLive('jackBack') && cnt('J') > 0) {
    state.jackBack = !state.jackBack; flips++; fireRule('jackBack');
  }
  if (flips) onStrengthFlip();

  if (ruleLive('wildJoker') && Object.keys(tags).length) fireRule('wildJoker');
  if (ruleLive('stairs') && meld.kind === 'stairs' && !flips) fireRule('stairs');
  if (ruleLive('nineRev') && cnt('9') > 0) { state.revDir = !state.revDir; fireRule('nineRev'); }

  const steps = [];
  if (ruleLive('tenDrop')   && cnt('10') > 0) steps.push({ type:'drop', n:cnt('10') });
  if (ruleLive('sevenGive') && cnt('7')  > 0) steps.push({ type:'give', n:cnt('7')  });

  state.after = {
    player,
    steps,
    skip: ruleLive('fiveSkip') ? cnt('5') : 0,
    cut:  ruleLive('eightCut') && cnt('8') > 0,
  };
  render();
  later(runAfter, SPEED.step);
}

function runAfter() {
  if (state.over) return;
  const a = state.after;
  if (!a) return;
  if (a.steps.length) {
    const s = a.steps.shift();
    return startPending(a.player, s.type, s.n);
  }
  state.after = null;
  if (a.cut) {
    fireRule('eightCut');
    return later(() => flowField('8切りで場が流れたよ！', state.lastPlayer), SPEED.step);
  }
  if (a.skip) fireRule('fiveSkip');
  goNext(a.skip);
}

/* 7わたし／10すて ― 自分の ときは てふだの ハイライトで えらぶ */
function startPending(player, type, n) {
  n = Math.min(n, player.cards.length);
  if (n <= 0 || player.done) return runAfter();
  fireRule(type === 'give' ? 'sevenGive' : 'tenDrop');
  if (player.human) {
    state.pending = { type, n, player, human:true };
    state.selected = [];
    state.busy = false;
    render();
    setMessage(type === 'give'
      ? `7渡し！ わたすカードを ${n}枚選んでね`
      : `10捨て！ 捨てるカードを ${n}枚選んでね`);
    return;
  }
  /* ロボットは いちばん よわい ものから */
  const picked = player.cards.slice().sort((a, b) => strength(a) - strength(b)).slice(0, n);
  finishPending(player, { type, n }, picked);
}

function finishPending(player, pd, picked) {
  const keys = picked.map(c => c.key);
  state.pending = null;
  state.selected = [];

  /* ★ カードこうかん（上位が えらんで わたす）だけは ゲームの まえの しょり。
     わたし終えたら そのまま ゲームを はじめる。 */
  if (pd.type === 'swap') {
    handOver(picked, player, pd.to);
    setMessage(`${pd.to.name}に ${cardNames(picked)} を わたした！ ゲーム スタート！`);
    render();
    return later(pd.then, SPEED.flow);
  }

  player.cards = player.cards.filter(c => !keys.includes(c.key));
  /* ★ なにが 出ていったかを かならず 名前で 出す（カードこうかん と おなじ 出し方）。
     まいすう だけだと「ほんとうに 捨てられたの？」が 分からない
     ―― 社長報告「捨てるを えらんだのに 捨てられなかった」の 半分は これ。 */
  if (pd.type === 'give') {
    const to = state.players[stepIndex(state.players.indexOf(player), 1, false)];
    picked.forEach(c => to.cards.push(c));
    sortHand(to);
    setMessage(`${player.name}は ${cardNames(picked)} を ${to.name}に わたした！`);
  } else {
    setMessage(`${player.name}は ${cardNames(picked)} を捨てた！`);
  }
  handSig = '';
  /* わたして／すてて 0まいに なったら ゴール（§3-11） */
  if (player.cards.length === 0 && !player.done) goal(player);
  render();
  later(runAfter, SPEED.step);
}

function pass(player) {
  player.passed = true;
  setMessage(`${player.name}は パスした。場が流れるまで お休み。`);
  state.selected = [];
  state.altIndex = 0;
  render();
  later(goNext, SPEED.step);
}

/* ★ 途中で 画面に 出す じゅんい（§14 の よびな を 出す ため）
   ------------------------------------------------------------
   ⚠️ ここを state.finished.length に すると まちがう。
      反則あがり・都落ちの人も finished に 入っている ので、
      あとから ゴールした人の じゅんいが その ぶん 下に ずれる。
      （2位の人に「貧民（3位）」と 出て しまう ―― 社長報告のバグ）
   ルールで 下がった人は endGame() で いちばん下に 回る ので、ここでは 数えない。
   その人 じしんは 0 を かえす（＝よびなを 出さない。「ルールで下がった」だけ 出す）。
   さいしゅうの じゅんいを 決めるのは endGame() の 1か所だけ、は そのまま。 */
function provisionalPlace(player) {
  if (player.foul) return 0;
  return state.finished.filter(p => !p.foul).length;
}

function goal(player) {
  player.done = true;
  player.passed = false;
  state.finished.push(player);
  player.place = provisionalPlace(player);
  setMessage(player.foul
    ? `${player.name}が ゴール！ でも 上がり禁止のカードだったので一番下。`
    : `${player.name}が ゴール！ ${TITLES[player.place - 1]}だよ。`);
  if (player.foul) fireRule('noFinish', `${player.name}は 上がり禁止のカードで あがったので一番下`);
  checkFallDown(player);
}

/* ★ みやこおち（§8-2）― まえの かいの 1いが、こんかい 1いを のがした しゅんかん
   てふだが のこっていても そこで おわり・いちばん下。
   ⚠️ アバターの 👑バッジ（renderCpu / renderFlags）と セットで 1きのう。
      バッジを 消すと、ただの りふじんな 事故に なる。 */
function checkFallDown(justFinished) {
  if (!ruleLive('fallDown') || state.crown == null) return;
  const c = state.players[state.crown];
  if (!c || c === justFinished || c.done) return;
  c.done = true;
  c.passed = false;
  c.foul = true;
  state.finished.push(c);
  /* ⚠️ ここで finished.length を 入れると「一番下だよ」と 言いながら
     じゅんいは 富豪（2位）、という ちぐはぐな 中身に なる。
     ルールで 下がった人の じゅんいは endGame() が 決めるので、ここでは 0。 */
  c.place = provisionalPlace(c);
  fireRule('fallDown', `${c.name}は 都落ち！ 手札が残っていても一番下`);
  setMessage(`${c.name}は 都落ち！ 1位を とれなかったので一番下だよ。`);
}

/* いまの むき（9リバース）で steps 人ぶん すすんだ 席を かえす。
   skipPassed=true … 手番を まわす とき（おやすみ中の人は とばす）
   skipPassed=false … 7わたし の あいて（おやすみ中でも わたす） */
function stepIndex(from, steps, skipPassed) {
  let i = from, moved = 0, guard = 0;
  while (moved < steps && guard++ < 40) {
    i = (i + dir() + 4) % 4;
    const p = state.players[i];
    if (p.done) continue;
    if (skipPassed && p.passed) continue;
    moved++;
  }
  return i;
}

function goNext(skip) {
  if (state.over) return;
  if (state.players.filter(p => !p.done).length <= 1) return endGame();

  if (state.field) {
    const contenders = state.players.filter(p => !p.done && !p.passed);
    const last = state.players[state.lastPlayer];
    if (contenders.length === 0 || (contenders.length === 1 && contenders[0] === last)) {
      return flowField('みんな パスしたので、場が流れたよ！');
    }
  }
  const n = 1 + (skip || 0);
  const first = stepIndex(state.turn, 1, true);
  const target = stepIndex(state.turn, n, true);
  const p = state.players[target];
  if (p.done || p.passed) return flowField('場が流れたよ！');
  if (skip && target !== first) setMessage(`${state.players[first].name}は とばされた！`);
  state.turn = target;
  beginTurn();
}

function flowField(msg, forceIndex) {
  /* ⚠️ ほかの ながれの 出口（runAfter・goNext・beginTurn）は みんな これを 見ている。
     ここだけ 見ていなかった ので、ゲームが 終わった あとに 場を いじって しまっていた。 */
  if (state.over) return;
  state.field = null;
  state.players.forEach(p => { p.passed = false; });
  /* しばりは ばが ながれたら かいじょ（§3-5） */
  state.lock = null;
  state.warnKey = '';
  /* Jバックと 9リバースは、ばが ながれたら もどす（9リバースは 社長決定） */
  const was = reversed();
  state.jackBack = false;
  state.revDir = false;
  if (reversed() !== was) onStrengthFlip();

  if (state.players.filter(p => !p.done).length <= 1) return endGame();
  let start = (forceIndex != null) ? forceIndex : state.lastPlayer;
  if (state.players[start].done) {
    for (let n = 1; n <= 4; n++) { const j = (start + n) % 4; if (!state.players[j].done) { start = j; break; } }
  }
  state.turn = start;
  state.selected = [];
  state.altIndex = 0;
  setMessage(msg);
  render();
  later(beginTurn, SPEED.flow);
}

function endGame() {
  if (state.over) return;
  state.over = true; state.busy = false; state.pending = null; state.after = null;
  state.players.filter(p => !p.done).forEach(p => { p.done = true; state.finished.push(p); });
  state.field = null;
  state.lock = null;

  /* ★ さいしゅうの じゅんい ＝ ゴールした じゅんばん。ただし
       ・あがりきんしの ふだで あがった人
       ・みやこおちした人
     は foul の しるしが ついていて、まとめて うしろへ 回す（＝いちばん下）。
     じゅんいを けいさんする ばしょは、この 1か所だけ。 */
  const order = state.finished.filter(p => !p.foul).concat(state.finished.filter(p => p.foul));

  /* ★ 大富豪（1位）は「手札を いちばん早く なくした人」の よびな（§14）。
     ルールで 下がった人が 3人 そろうと、上の ならびでは
     **手札が のこったままの人が いちばん上**に 来て しまう
     （＝「手札が 残っていたのに 大富豪（1位）」―― 社長報告のバグ）。
     その ときだけ、手札を なくした人を 1位に 上げる。
     ⚠️ ふだんは 1文字も 動かない（ここが 効くのは 上の 形に なった ときだけ）。 */
  if (order.length && order[0].cards.length > 0) {
    const i = order.findIndex(p => p.cards.length === 0);
    if (i > 0) order.unshift(order.splice(i, 1)[0]);
  }

  order.forEach((p, i) => { p.place = i + 1; });
  render();

  /* ⭐ ＝ 人数 − じゅんい ＋ 1。いちばん下でも ⭐1 は もらえる。 */
  order.forEach((p, i) => {
    const idx = state.players.indexOf(p);
    state.totals[idx].stars += (4 - (i + 1) + 1);
    if (i === 0) state.totals[idx].firsts += 1;
  });
  state.lastRank = order.map(p => state.players.indexOf(p));
  state.crown = state.lastRank[0];        // つぎの かいで ねらわれる人（みやこおち）
  state.nextStarter = state.lastRank[3];  // つぎの かいは さいかいの人から（§5-2）
  renderStatus();   /* 上の帯の ⭐を、この ゲームの ぶんまで 入れて 出しなおす */

  const me = state.players[0];
  const rows = order.map((p, i) => `<li class="${p.human ? 'is-human' : ''}">`
    + `<span class="place">${TITLES[i]}</span><span>${p.human ? '🐱 あなた' : `🤖 ${p.name}`}</span>`
    + `<small>⭐${4 - i}${p.foul ? ' ・ルールで下がった' : ''}</small></li>`).join('');
  const totalRows = state.players
    .map((p, i) => ({ p, t: state.totals[i] }))
    .sort((a, b) => b.t.stars - a.t.stars || b.t.firsts - a.t.firsts)
    .map(({ p, t }) => `<li class="${p.human ? 'is-human' : ''}">`
      + `<span>${p.human ? '🐱 あなた' : `🤖 ${p.name}`}</span>`
      + `<small>⭐${t.stars} ・ 1位 ${t.firsts}回</small></li>`).join('');

  $('resultContent').innerHTML = `<h2>🏆 順位発表！</h2>`
    + `<p class="winner">あなたは ${TITLES[me.place - 1]}だったよ！</p>`
    + `<ol class="ranking">${rows}</ol>`
    + `<p class="total-head">これまでの成績（${state.gameNo}ゲーム目）</p>`
    + `<ul class="totals">${totalRows}</ul>`;
  later(() => $('resultDialog').showModal(), 400);
}

/* ───────── そうさ ───────── */
function onHandClick(e) {
  const btn = e.target.closest('[data-key]');
  if (!btn || btn.disabled) return;
  const picking = Boolean(state.pending && state.pending.human);
  if (!picking && !isMyTurn()) return;
  const key = btn.dataset.key;

  /* ★ あがりきんし 1だんめ：とまっている ふだを 押したら、りゆうを 出す（§3-6）。
     「なぜか だせない」を つくらない ための ぶぶん。えらんだ ことには しない。 */
  if (btn.classList.contains('cant-finish')) {
    const me = state.players[0];
    const card = me.cards.find(c => c.key === key);
    const label = card ? banLabel(card, null) : 'このカード';
    setMessage(me.cards.length <= 1
      ? `${label}では ゴールできないよ。今は パスして 待とう。`
      : `${label}で あがるのは ダメ。ほかのカードを出そう。`);
    return;
  }

  const i = state.selected.indexOf(key);
  if (i >= 0) state.selected.splice(i, 1);
  else state.selected.push(key);
  if (!picking) { state.altIndex = 0; state.warnKey = ''; }
  renderHand();
}
function onAlt() {
  if (state.pending) return;
  state.altIndex += 1;
  renderHand();
}
function onPlay() {
  const me = state.players[0];
  /* 7わたし／10すて／カードこうかん の かくてい */
  if (state.pending && state.pending.human) {
    const picked = me.cards.filter(c => state.selected.includes(c.key));
    if (picked.length !== state.pending.n) return;
    const pd = state.pending;
    state.busy = true;
    return finishPending(me, pd, picked);
  }
  if (!isMyTurn()) return;
  const plays = legalPlays(me);
  const sel = me.cards.filter(c => state.selected.includes(c.key));
  const cands = meldsFor(sel, plays);
  if (!cands.length) return;
  const meld = cands[state.altIndex % cands.length];

  /* ★ あがりきんし 2だんめ：ほかに 手が なくて きんしの ふだで あがる とき。
     1回目は とめて けいこく。もう1回 おしたら かくてい（§3-6）。 */
  if (isBanFinish(sel, meld, me)) {
    const k = keyOf(sel);
    if (state.warnKey !== k) {
      state.warnKey = k;
      setMessage('これで あがると一番下に なっちゃうよ。だいじょうぶ？ もう1回「出す」で確定。');
      renderHand();
      return;
    }
  }
  state.busy = true;
  playCards(me, sel, meld);
}
function onPass() {
  const me = state.players[0];
  if (!isMyTurn() || !state.field) return;
  state.busy = true;
  pass(me);
}
function backToStart() {
  state.over = true;
  state.epoch += 1;          /* やめた 回の タイマーも 無効に する */
  state.pending = null;
  state.after = null;
  $('gameScreen').classList.add('hidden');
  $('startScreen').classList.remove('hidden');
}

/* ───────── はじめの ひもづけ ───────── */
applyPreset('normal');

$('presetRow').addEventListener('click', (e) => {
  const b = e.target.closest('[data-preset]');
  if (b) applyPreset(b.dataset.preset);
});
$('ruleList').addEventListener('change', (e) => {
  const box = e.target.closest('[data-rule]');
  if (!box) return;
  state.ruleOn[box.dataset.rule] = box.checked;
  state.preset = 'custom';
  renderRulePanel();
});
$('ruleAllOff').addEventListener('click', () => { RULES.forEach(r => { state.ruleOn[r.id] = false; }); state.preset = 'custom'; renderRulePanel(); });
$('ruleReset').addEventListener('click', () => applyPreset('normal'));

$('startBtn').addEventListener('click', () => startGame(false));
$('hand').addEventListener('click', onHandClick);
$('altBtn').addEventListener('click', onAlt);
$('playBtn').addEventListener('click', onPlay);
$('passBtn').addEventListener('click', onPass);
$('quitBtn').addEventListener('click', backToStart);

$('howtoBtn').addEventListener('click', () => { renderRuleList($('helpLive')); $('helpDialog').showModal(); });
$('rulesBtn').addEventListener('click', () => { renderRuleList($('rulesLive')); $('rulesDialog').showModal(); });
document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => $(b.dataset.close).close()));

$('againBtn').addEventListener('click', () => { $('resultDialog').close(); state.gameNo += 1; startGame(true); });
$('settingBtn').addEventListener('click', () => { $('resultDialog').close(); backToStart(); });

/* ============================================================
   けんしょう用の でぐち（ブラックジャックの window.BJ と おなじ かんがえ方）
   ------------------------------------------------------------
   ふつうに あそぶ ぶんには つかわれない。
   コンソールから てふだ・ばを 仕こんで、10この ルールを 手で 待たずに 出す ため。
   ============================================================ */
window.DF = {
  state, RULES, RULE, ruleLive, reversed, strength, meldPower, legalPlays, meldsFor, render,
  handStates, isMyTurn, preset: applyPreset,
  start(keepScore) { startGame(Boolean(keepScore)); return state.turn; },
  card(k) { const d = createDeck(); return d.find(c => c.key === k) || null; },
  /* てふだを 仕こむ（けんしょう用。デッキの つじつまは 見ない） */
  hand(i, keys) {
    state.players[i].cards = keys.map(k => this.card(k)).filter(Boolean);
    sortHand(state.players[i]); handSig = ''; render(); return state.players[i].cards.map(c => c.key);
  },
  /* ばに 札を おく（by は 見た目だけ） */
  put(keys, by) {
    const cards = keys.map(k => this.card(k)).filter(Boolean);
    const plays = [];
    const fake = { cards };
    const meld = this.meldOf(cards);
    state.field = { cards, meld, by: by || 'ロボット1' };
    void plays; void fake;
    handSig = ''; render(); return meld;
  },
  /* カードの ならびから かたちを 1つ 作る（けんしょう用の かんい版） */
  meldOf(cards) {
    const j = cards.filter(c => c.joker), r = cards.filter(c => !c.joker);
    if (!r.length) return { kind:'set', count:cards.length, ord:13, jokerOnly:true, assign:{} };
    const suits = new Set(r.map(c => c.suit));
    const ords = r.map(c => c.ord).sort((a, b) => a - b);
    const conseq = ords.every((o, i) => i === 0 || o === ords[i - 1] + 1);
    if (cards.length >= 3 && suits.size === 1 && conseq && !j.length) {
      return { kind:'stairs', count:cards.length, lo:ords[0], hi:ords[ords.length - 1], suit:r[0].suit, assign:{} };
    }
    return { kind:'set', count:cards.length, ord:r[0].ord, jokerOnly:false, assign:{} };
  },
  flow(msg) { flowField(msg || '場が流れたよ！'); },
  next(skip){ goNext(skip); },
  turn(i)   { state.turn = i; state.busy = false; state.selected = []; render(); },
  sel(keys) { state.selected = keys.slice(); state.altIndex = 0; renderHand(); return keys; },
  play()    { onPlay(); },
  passNow() { onPass(); },
  go()      { beginTurn(); },
  on(...ids)  { ids.forEach(id => { state.ruleOn[id] = true;  }); renderRulePanel(); render(); return countOn(); },
  off(...ids) { ids.forEach(id => { state.ruleOn[id] = false; }); renderRulePanel(); render(); return countOn(); },
  states()  { return handStates(isMyTurn() ? legalPlays(state.players[0]) : []); },
  peek()    { return state.players.map(p => ({ name:p.name, cards:p.cards.map(c => c.key) })); },
  info()    {
    return { rev:reversed(), revolution:state.revolution, jackBack:state.jackBack, revDir:state.revDir,
             lock:state.lock, crown:state.crown, lastRank:state.lastRank,
             turn:state.turn, field:state.field && { by:state.field.by, kind:state.field.meld.kind,
             count:state.field.meld.count, power:meldPower(state.field.meld) } };
  },
  /* ── 第2段B の けんしょう用 ───────────────── */
  setLock(...suits) { state.lock = suits.length ? suits : null; render(); return state.lock; },
  /* まえの かいの じゅんいを 仕こむ（みやこおち・カードこうかんの たしかめ） */
  setRank(arr)      { state.lastRank = arr.slice(); state.crown = arr[0]; state.nextStarter = arr[3]; return state.lastRank; },
  plays(i, withBan) { return legalPlays(state.players[i || 0], Boolean(withBan)).map(p => ({ k:p.cards.map(c => c.key), kind:p.meld.kind })); },
  /* ★ T96：ロボットの しこうを そのまま よぶ／数を かぞえる のぞきあな */
  hook: HOOK,
  cpu: CPU,
  cpuNow() { cpuTurn(); },
  pickFor(i) { const p = state.players[i || 0]; const c = cpuPick(p, legalPlays(p)); return c && c.cards.map(x => x.key); },
  places()          { return state.players.map(p => ({ name:p.name, place:p.place, foul:!!p.foul })); },
  /* あそびかたの ぎょうすう を かぞえる（そう1 / そう2 / そう3） */
  helpLines() {
    renderRuleList($('helpLive'));
    return { sou1:1, sou2:document.querySelectorAll('#helpDialog ol li').length,
             sou3:document.querySelectorAll('#helpLive .live-rule').length };
  },
};
