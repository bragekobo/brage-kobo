/* ============================================================
   poker-core.js ― ポーカー2本の 共通部品（役の判定エンジン）
   ============================================================
   ⚠️ このファイルは **画面のことを 1つも 知りません。**
      ・DOM を さわらない
      ・言葉（画面に出す文）を 組み立てない
      ・ホールデム／ドローポーカー どちらの 前提も 入れない
      → だから テキサス・ホールデム と ドローポーカー の 2本で
        まるごと 同じものを つかえます（T38 §12）。

   このファイルが 持っているのは 3つだけ：
     ① 役の 定義 10個（名前・説明・短い形）… HANDS
        ⚠️ 説明文は ここ 1か所にしか 書かない（T38 §2-4）。
           画面がわは かならず HANDS から 引くこと。
     ② カードの もと（52枚を 作る・まぜる・くばる）
     ③ 役の 判定（n枚 → いちばん強い 5枚）と くらべ方

   ★ 5枚でも 7枚でも 同じ関数を よびます（T38 §12-1）。
     ドローポーカーは 5枚、ホールデムは 7枚。引数の 枚数を 決めうちしない。

   ★ ジョーカー（何にでも なれるカード）は 後から 足せる形にしてあります
     （T38 §12-4）。ホールデムでは つかいません。

   けんしょう用の でぐち：window.PokerCore
     （ブラックジャックの window.BJ・大富豪の window.DF と 同じ かんがえ方）
   ============================================================ */
(function (global) {
  'use strict';

  /* ───────── ① 役の 定義 10個（T38 §3-2）─────────
     rank ＝ 強さの 番号。大きいほど 強い。
     ⚠️ この rank が そのまま「強さのはしご 10段」（T38 §6-3）の 段数になる。
        ハイカード＝1段め … ロイヤルストレートフラッシュ＝10段め。 */
  var HANDS = [
    { id: 'royalFlush',    rank: 10, name: 'ロイヤルストレートフラッシュ', desc: '同じマークの 10 J Q K A',        short: '最強の5枚' },
    { id: 'straightFlush', rank:  9, name: 'ストレートフラッシュ',         desc: '同じマークで、数が5つ続く',       short: '同じマークで5つ続く' },
    { id: 'fourOfAKind',   rank:  8, name: 'フォーカード',                 desc: '同じ数が4枚',                     short: '同じ数が4枚' },
    { id: 'fullHouse',     rank:  7, name: 'フルハウス',                   desc: '同じ数が3枚と、べつの2枚',        short: '3枚と2枚' },
    { id: 'flush',         rank:  6, name: 'フラッシュ',                   desc: '同じマークが5枚',                 short: '同じマークが5枚' },
    { id: 'straight',      rank:  5, name: 'ストレート',                   desc: '数が5つ続く（マークはばらばらでいい）', short: '数が5つ続く' },
    { id: 'threeOfAKind',  rank:  4, name: 'スリーカード',                 desc: '同じ数が3枚',                     short: '同じ数が3枚' },
    { id: 'twoPair',       rank:  3, name: 'ツーペア',                     desc: '同じ数が2枚と、べつの2枚',        short: '2枚と2枚' },
    { id: 'onePair',       rank:  2, name: 'ワンペア',                     desc: '同じ数が2枚',                     short: '同じ数が2枚' },
    { id: 'highCard',      rank:  1, name: 'ハイカード',                   desc: '役なし。一番強い1枚でくらべる',   short: '役なし' }
  ];

  /* ドローポーカーで ジョーカーを 入れる ときだけ 足す 11個め（T38 §12-4）。
     ⚠️ ホールデムの はしごを 11段に しないため、HANDS には 入れていない。
        つかう がわで  HANDS.concat([PokerCore.HAND_FIVE_OF_A_KIND])  と すれば 1行で 足せる。 */
  var HAND_FIVE_OF_A_KIND =
    { id: 'fiveOfAKind',   rank: 11, name: 'ファイブカード',               desc: '同じ数が5枚',                     short: '同じ数が5枚' };

  var HAND_BY_ID = {};
  HANDS.forEach(function (h) { HAND_BY_ID[h.id] = h; });
  HAND_BY_ID[HAND_FIVE_OF_A_KIND.id] = HAND_FIVE_OF_A_KIND;

  /* ───────── ② カードの もと ─────────
     マークの ならびは 既存3本（七並べ・大富豪）と そろえてある。
     ⚠️ 画像の ファイル名は clubs だけ「クローバー」（設計図 §9）。 */
  var SUITS = [
    { id: 'spades',   mark: '♠', ja: 'スペード',   name: 'スペード', color: 'black' },
    { id: 'hearts',   mark: '♥', ja: 'ハート',     name: 'ハート',   color: 'red'   },
    { id: 'diamonds', mark: '♦', ja: 'ダイヤ',     name: 'ダイヤ',   color: 'red'   },
    { id: 'clubs',    mark: '♣', ja: 'クローバー', name: 'クラブ',   color: 'black' }
  ];
  var SUIT_BY_ID = {};
  SUITS.forEach(function (s) { SUIT_BY_ID[s.id] = s; });

  /* ポーカーの 数の 強さ（T38 §3-1）：2 が いちばん 弱く、A が いちばん 強い。
     ⚠️ A だけ ストレートのとき「1」にも なれる（T38 §3-3）。そこは 判定の中で あつかう。 */
  var RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  var RANK_VALUE = {}, VALUE_RANK = {};
  RANKS.forEach(function (r, i) { RANK_VALUE[r] = i + 2; VALUE_RANK[i + 2] = r; });

  /* 数字の 見出し（画面に 出すのは 呼ぶ がわの 仕事。ここは 記号を 返すだけ） */
  function rankLabel(value) { return VALUE_RANK[value] || ''; }

  function makeCard(suitId, rank) {
    var s = SUIT_BY_ID[suitId];
    return {
      _pc: true,                       // poker-core が 作った しるし（正規化を とばす ため）
      key: s.id + '-' + rank,          // 大富豪・七並べと 同じ かたち
      suit: s.id, mark: s.mark, ja: s.ja, name: s.name, color: s.color,
      rank: rank, value: RANK_VALUE[rank],
      file: s.ja + rank,               // 画像の ファイル名（.png は つけない）
      wild: false
    };
  }

  /* 何にでも なれるカード。ホールデムでは つかわない（T38 §3-1・§12-4）。 */
  function makeWild(n) {
    return {
      _pc: true, key: 'joker-' + n, suit: 'joker', mark: '🃏', ja: 'JOKER',
      name: 'ジョーカー', color: 'black', rank: 'JOKER', value: 0,
      file: 'JOKER' + n, wild: true
    };
  }

  /* 52枚。ジョーカーは 既定で 0枚（ホールデムは 52枚ちょうど）。 */
  function createDeck(opts) {
    var jokers = (opts && opts.jokers) || 0;
    var deck = [];
    SUITS.forEach(function (s) {
      RANKS.forEach(function (r) { deck.push(makeCard(s.id, r)); });
    });
    for (var i = 1; i <= jokers; i++) deck.push(makeWild(i));
    return deck;
  }

  /* まぜる（フィッシャー・イェーツ）。rnd を わたせば テストで 同じ ならびに できる。 */
  function shuffle(cards, rnd) {
    var r = rnd || Math.random;
    for (var i = cards.length - 1; i > 0; i--) {
      var j = Math.floor(r() * (i + 1));
      var t = cards[i]; cards[i] = cards[j]; cards[j] = t;
    }
    return cards;
  }

  /* 山から n枚 くばる（山からは へる） */
  function draw(deck, n) { return deck.splice(0, n); }

  /* ───────── カードの 書きかた（テスト・仕込み用）─────────
     'sA'  = スペードのA      's10' / 'sT' = スペードの10
     'h7 d7 c7'  のように スペース区切りで まとめて 書ける
     'W' / '*'   = 何にでも なれるカード
     すでに カードの もの（{suit, rank} を もつ もの）も そのまま わたせる。 */
  var SUIT_ALIAS = {
    s: 'spades', h: 'hearts', d: 'diamonds', c: 'clubs',
    '♠': 'spades', '♥': 'hearts', '♦': 'diamonds', '♣': 'clubs',
    spades: 'spades', hearts: 'hearts', diamonds: 'diamonds', clubs: 'clubs'
  };
  var RANK_ALIAS = { t: '10', T: '10', '1': 'A', a: 'A', j: 'J', q: 'Q', k: 'K' };

  function card(spec) {
    if (spec == null) return null;
    if (typeof spec === 'object') {
      if (spec._pc) return spec;                                  // すでに 正規のカード
      if (spec.wild || spec.suit === 'joker') return makeWild(spec.jokerNo || 1);
      var sid = SUIT_ALIAS[spec.suit] || spec.suit;
      var rk = String(spec.rank == null ? VALUE_RANK[spec.value] : spec.rank);
      rk = RANK_ALIAS[rk] || rk.toUpperCase();
      if (!SUIT_BY_ID[sid] || RANK_VALUE[rk] == null) return null;
      return makeCard(sid, rk);
    }
    var t = String(spec).trim();
    if (!t) return null;
    if (t === 'W' || t === 'w' || t === '*') return makeWild(1);
    var head = t.charAt(0);
    var sid2 = SUIT_ALIAS[head];
    if (!sid2) return null;
    var rk2 = t.slice(1);
    rk2 = RANK_ALIAS[rk2] || rk2.toUpperCase();
    if (RANK_VALUE[rk2] == null) return null;
    return makeCard(sid2, rk2);
  }

  function cards(spec) {
    var list = Array.isArray(spec) ? spec : String(spec).split(/[\s,]+/);
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var c = card(list[i]);
      if (c) out.push(c);
    }
    return out;
  }

  /* ───────── ③ 役の 判定 ─────────
     ★ まず「5枚ちょうど」で 役を きめる（T38 §3-6 の 念おし）。
       6枚の フラッシュでも つかうのは 強いほう 5枚だけ。 */

  /* n枚から 5枚を えらぶ 番号の 組み合わせ（作りなおさないよう 覚えておく） */
  var COMBO_CACHE = {};
  function comboIndices(n, k) {
    var key = n + ':' + k;
    if (COMBO_CACHE[key]) return COMBO_CACHE[key];
    var res = [], idx = [];
    (function rec(start) {
      if (idx.length === k) { res.push(idx.slice()); return; }
      for (var i = start; i < n; i++) { idx.push(i); rec(i + 1); idx.pop(); }
    })(0);
    COMBO_CACHE[key] = res;
    return res;
  }

  /* 5枚ちょうどの 役を 出す（このエンジンの 心臓）。
     返すもの：
       id / rank        … 役（HANDS の id と 強さの 番号）
       best[5]          … 役を 作っている 5枚（ならびは 下の コメントの とおり）
       score[]          … [rank, つぎに くらべる数, …] ← これだけで 勝ち負けが つく（T38 §3-4）
       scoreCardIndex[] … score の 2つめ以降が best の 何枚めに あたるか
                          （§6-6「ここで 勝った ↑」の 矢印の 位置に つかう）
       values[]         … 役の 中心の 数（フルハウスなら [3枚の数, 2枚の数]）
       aceLow           … A を 1として つかった ストレートか（T38 §3-3 の おしらせ用） */
  function evalFive(five) {
    var i, v;
    var cnt = [];                       // 数ごとの 枚数（2〜14）
    for (i = 0; i <= 14; i++) cnt[i] = 0;
    var bucket = {};                    // 数ごとの カード
    var isFlush = true;
    var s0 = five[0].suit;
    for (i = 0; i < 5; i++) {
      v = five[i].value;
      cnt[v]++;
      (bucket[v] || (bucket[v] = [])).push(five[i]);
      if (five[i].suit !== s0) isFlush = false;
    }

    /* 数の グループを「枚数が多い順 → 数が大きい順」に ならべる */
    var groups = [];
    for (v = 14; v >= 2; v--) if (cnt[v]) groups.push({ value: v, count: cnt[v], cards: bucket[v] });
    groups.sort(function (a, b) { return (b.count - a.count) || (b.value - a.value); });

    /* ストレートか（5つの 数が つづくか）。
       ⚠️ A は 上（10 J Q K A）と 下（A 2 3 4 5）の 両方に なれる。
          ただし 輪には しない（Q K A 2 3 は ストレートでは ない）。 */
    var straightHigh = 0, aceLow = false;
    if (groups.length === 5) {
      var vals = [groups[0].value, groups[1].value, groups[2].value, groups[3].value, groups[4].value];
      vals.sort(function (a, b) { return b - a; });
      if (vals[0] - vals[4] === 4) straightHigh = vals[0];
      else if (vals[0] === 14 && vals[1] === 5 && vals[4] === 2) { straightHigh = 5; aceLow = true; }
    }

    var flat = [];                      // best の 中身を ここに 組み立てる
    var id, rank, score, idxMap, values;

    if (straightHigh && isFlush) {
      flat = straightOrder(bucket, straightHigh, aceLow);
      id = (straightHigh === 14) ? 'royalFlush' : 'straightFlush';
      rank = HAND_BY_ID[id].rank;
      score = [rank, straightHigh]; idxMap = [0]; values = [straightHigh];
    } else if (groups[0].count === 5) {           /* ジョーカーを 入れた ときだけ 起きる */
      flat = groups[0].cards.slice(0, 5);
      id = 'fiveOfAKind'; rank = HAND_FIVE_OF_A_KIND.rank;
      score = [rank, groups[0].value]; idxMap = [0]; values = [groups[0].value];
    } else if (groups[0].count === 4) {
      flat = groups[0].cards.concat(groups[1].cards);
      id = 'fourOfAKind'; rank = 8;
      score = [rank, groups[0].value, groups[1].value]; idxMap = [0, 4];
      values = [groups[0].value, groups[1].value];
    } else if (groups[0].count === 3 && groups[1] && groups[1].count === 2) {
      flat = groups[0].cards.concat(groups[1].cards);
      id = 'fullHouse'; rank = 7;
      score = [rank, groups[0].value, groups[1].value]; idxMap = [0, 3];
      values = [groups[0].value, groups[1].value];
    } else if (isFlush) {
      flat = five.slice().sort(byValueDesc);
      id = 'flush'; rank = 6;
      score = [rank, flat[0].value, flat[1].value, flat[2].value, flat[3].value, flat[4].value];
      idxMap = [0, 1, 2, 3, 4];
      values = [flat[0].value];
    } else if (straightHigh) {
      flat = straightOrder(bucket, straightHigh, aceLow);
      id = 'straight'; rank = 5;
      score = [rank, straightHigh]; idxMap = [0]; values = [straightHigh];
    } else if (groups[0].count === 3) {
      flat = groups[0].cards.concat(groups[1].cards, groups[2].cards);
      id = 'threeOfAKind'; rank = 4;
      score = [rank, groups[0].value, groups[1].value, groups[2].value]; idxMap = [0, 3, 4];
      values = [groups[0].value];
    } else if (groups[0].count === 2 && groups[1] && groups[1].count === 2) {
      flat = groups[0].cards.concat(groups[1].cards, groups[2].cards);
      id = 'twoPair'; rank = 3;
      score = [rank, groups[0].value, groups[1].value, groups[2].value]; idxMap = [0, 2, 4];
      values = [groups[0].value, groups[1].value];
    } else if (groups[0].count === 2) {
      flat = groups[0].cards.concat(groups[1].cards, groups[2].cards, groups[3].cards);
      id = 'onePair'; rank = 2;
      score = [rank, groups[0].value, groups[1].value, groups[2].value, groups[3].value];
      idxMap = [0, 2, 3, 4];
      values = [groups[0].value];
    } else {
      flat = five.slice().sort(byValueDesc);
      id = 'highCard'; rank = 1;
      score = [rank, flat[0].value, flat[1].value, flat[2].value, flat[3].value, flat[4].value];
      idxMap = [0, 1, 2, 3, 4];
      values = [flat[0].value];
    }

    return {
      id: id, rank: rank, best: flat, score: score, scoreCardIndex: idxMap,
      values: values, aceLow: aceLow
    };
  }

  function byValueDesc(a, b) { return b.value - a.value; }

  /* ストレートの 5枚を「てっぺんから 下へ」ならべる。
     A 2 3 4 5 のときは 5 4 3 2 A（A が いちばん 下）。 */
  function straightOrder(bucket, high, aceLow) {
    var out = [];
    if (aceLow) {
      for (var v = 5; v >= 2; v--) out.push(bucket[v][0]);
      out.push(bucket[14][0]);
    } else {
      for (var w = high; w > high - 5; w--) out.push(bucket[w][0]);
    }
    return out;
  }

  /* score どうしを くらべる。a が 強ければ +、b が 強ければ −、同じなら 0（＝引き分け）。 */
  function compareScore(a, b) {
    var n = Math.max(a.length, b.length);
    for (var i = 0; i < n; i++) {
      var x = a[i] || 0, y = b[i] || 0;
      if (x !== y) return x > y ? 1 : -1;
    }
    return 0;
  }

  /* ───────── n枚 → いちばん強い 5枚（このファイルの 入口）─────────
     ★ 5枚でも 7枚でも 同じ。ドローポーカーは 5枚で よぶ（組み合わせが 1通りになるだけ）。 */
  function evaluate(input) {
    var list = normalizeList(input);
    if (!list || list.length < 5) return null;

    /* 何にでも なれるカードが あれば、ぜんぶの 札に 置きかえて 試す（T38 §12-4）。
       ホールデムでは ここを 通らない。 */
    var wildAt = [];
    for (var i = 0; i < list.length; i++) if (list[i].wild) wildAt.push(i);
    if (wildAt.length) return evaluateWithWilds(list, wildAt);

    return pickBest(list);
  }

  /* 組み合わせを ぜんぶ 試して、いちばん強い 5枚に きめる。 */
  function pickBest(list) {
    var n = list.length, best = null;
    if (n === 5) {
      best = evalFive(list);
    } else {
      var combos = comboIndices(n, 5);
      for (var i = 0; i < combos.length; i++) {
        var ix = combos[i];
        var r = evalFive([list[ix[0]], list[ix[1]], list[ix[2]], list[ix[3]], list[ix[4]]]);
        if (!best || compareScore(r.score, best.score) > 0) best = r;
      }
    }
    return finish(best, list);
  }

  /* 何にでも なれるカードを 1枚ずつ 置きかえる（52通り × 枚数）。
     置きかえても key は もとの ジョーカーの まま にする
     → 画面の ハイライト（どの札が 光るか）が そのまま 動く。 */
  function evaluateWithWilds(list, wildAt) {
    if (wildAt.length > 2) return pickBest(list);   // 3枚以上は 重すぎるので そのまま
    var deck = createDeck();
    var best = null;
    var idx0 = wildAt[0], idx1 = wildAt.length > 1 ? wildAt[1] : -1;
    for (var a = 0; a < deck.length; a++) {
      var work = list.slice();
      work[idx0] = asWild(deck[a], list[idx0]);
      if (idx1 < 0) {
        var r = pickBest(work);
        if (!best || compareScore(r.score, best.score) > 0) best = r;
      } else {
        for (var b = 0; b < deck.length; b++) {
          work[idx1] = asWild(deck[b], list[idx1]);
          var r2 = pickBest(work);
          if (!best || compareScore(r2.score, best.score) > 0) best = r2;
        }
      }
    }
    /* つかった／つかわなかった は「もとの 7枚（ジョーカーのまま）」で 数えなおす */
    return finish(best, list);
  }

  function asWild(concrete, original) {
    return {
      _pc: true, key: original.key, suit: concrete.suit, mark: concrete.mark, ja: concrete.ja,
      name: concrete.name, color: concrete.color, rank: concrete.rank, value: concrete.value,
      file: original.file, wild: false,
      wildOrigin: original, asRank: concrete.rank, asSuit: concrete.suit
    };
  }

  /* 「つかった 5枚」と「つかわなかった 札」を そろえて 返す。
     ⚠️ ここが §6-2（つかう5枚を 光らせる／のこりを うすくする）の もとになる。 */
  function finish(result, list) {
    if (!result) return null;
    var usedKeys = result.best.map(function (c) { return c.key; });
    var unused = [], unusedKeys = [];
    for (var i = 0; i < list.length; i++) {
      if (usedKeys.indexOf(list[i].key) < 0) { unused.push(list[i]); unusedKeys.push(list[i].key); }
    }
    result.usedKeys = usedKeys;
    result.unused = unused;
    result.unusedKeys = unusedKeys;
    result.input = list;
    return result;
  }

  function normalizeList(input) {
    if (typeof input === 'string') return cards(input);
    if (!Array.isArray(input)) return null;
    var out = [];
    for (var i = 0; i < input.length; i++) {
      var c = card(input[i]);
      if (c) out.push(c);
    }
    return out;
  }

  /* ───────── くらべる（T38 §3-4）─────────
     カードの ならびでも、evaluate の こたえでも どちらでも わたせる。 */
  function asResult(x) {
    if (!x) return null;
    if (x.score && x.best) return x;
    return evaluate(x);
  }
  function compare(a, b) {
    var ra = asResult(a), rb = asResult(b);
    if (!ra && !rb) return 0;
    if (!ra) return -1;
    if (!rb) return 1;
    return compareScore(ra.score, rb.score);
  }

  /* 同じ役どうしの ときだけ「どの札で 決まったか」を 返す（§6-6 の 矢印）。
     返り値：best の 何枚め（0〜4）／決め手が ないときは −1。 */
  function decidingIndex(a, b) {
    var ra = asResult(a), rb = asResult(b);
    if (!ra || !rb) return -1;
    if (ra.rank !== rb.rank) return -1;      // 役が ちがうなら 矢印は 出さない
    for (var i = 1; i < Math.max(ra.score.length, rb.score.length); i++) {
      if ((ra.score[i] || 0) !== (rb.score[i] || 0)) return ra.scoreCardIndex[i - 1];
    }
    return -1;                                // 完全に 同じ ＝ 引き分け
  }

  /* 勝負（ショーダウン）の ならべかえ。
     entries: [{ id:'you', cards:[...] }, ...]  ／ cards の かわりに hand（evaluate の こたえ）でも よい
     返り値： [{ id, hand, place, win }] を 強い順に。同じ強さは 同じ place（＝引き分け）。 */
  function rankHands(entries) {
    var list = entries.map(function (e) {
      return { id: e.id, hand: e.hand || evaluate(e.cards), place: 0, win: false };
    });
    list.sort(function (x, y) { return compareScore(y.hand.score, x.hand.score); });
    var place = 0, prev = null;
    for (var i = 0; i < list.length; i++) {
      if (prev === null || compareScore(list[i].hand.score, prev) !== 0) { place = i + 1; prev = list[i].hand.score; }
      list[i].place = place;
      list[i].win = (place === 1);
    }
    return list;
  }

  /* ============================================================
     ④ ポットの 分け方（T38 §3-5・§5-5）― T41+ で 足した ところ
     ------------------------------------------------------------
     ⚠️ ここも 画面の ことは 1つも 知りません。言葉も 作りません。
        ドローポーカーでも そのまま つかえます（かけが 2回 あるだけ）。

     入れるもの（players）：
       [{ id, put, folded, hand }]  … put ＝ このハンドで 出した コインの 合計
                                      hand の かわりに cards（札のならび）でも よい
     決めごと（この2つが この会社の 正）：
       ・引き分けは 山分け。**割り切れない 1枚は order の 順に 1枚ずつ**（T38 §3-5）
         order ＝ 端数を 配る 順番（ホールデムでは 親の 左どなりから）
       ・だれも 合わせられなかった 出しすぎの ぶんは、出した人に **返す**
         （これが 無いと コインが 消えます）
     ============================================================ */

  function potEntry(p) {
    return {
      id: p.id,
      put: Math.max(0, Math.round(p.put || 0)),
      folded: !!p.folded,
      hand: p.hand || (p.cards ? evaluate(p.cards) : null)
    };
  }

  /* 出した額から ポット（本ポット＋サイドポット）を 積む。
     返すもの：
       pots    … [{ amount, cap, eligible:[id] }] 少ない額の ポットから 順に
                 cap ＝ その ポットの 区切りに なった「1人あたりの 出した額」
       refunds … [{ id, amount }] 出しすぎて 返す ぶん
       entries … 手を入れた あとの [{id, put, folded, hand}]（put は 返した ぶんを ひいてある）
     ⚠️ ここは「だれが 勝ったか」を 見ません。分け先の 器を 作るだけ。 */
  function buildPots(players) {
    var entries = (players || []).map(potEntry);
    var refunds = [];

    /* ① だれにも 合わせて もらえなかった ぶんは 返す。
          いちばん 多く 出した人が 1人だけ 飛びぬけて いるとき、その差が それ。 */
    var byPut = entries.slice().sort(function (a, b) { return b.put - a.put; });
    if (byPut.length === 1) {
      if (byPut[0].put > 0) { refunds.push({ id: byPut[0].id, amount: byPut[0].put }); byPut[0].put = 0; }
    } else if (byPut.length >= 2 && byPut[0].put > byPut[1].put) {
      var back = byPut[0].put - byPut[1].put;
      byPut[0].put -= back;
      refunds.push({ id: byPut[0].id, amount: back });
    }

    /* ② 生きている人の 出した額を 区切りにして、下から 順に ポットを 積む。
          降りた人の コインは いちばん 下の ポットから 順に 入っていく。 */
    var levels = [];
    entries.forEach(function (e) {
      if (!e.folded && e.put > 0 && levels.indexOf(e.put) < 0) levels.push(e.put);
    });
    levels.sort(function (a, b) { return a - b; });

    var pots = [], prev = 0, packed = 0;
    levels.forEach(function (L) {
      var amount = 0;
      entries.forEach(function (e) {
        amount += Math.max(0, Math.min(e.put, L) - Math.min(e.put, prev));
      });
      if (amount > 0) {
        pots.push({
          amount: amount, cap: L,
          eligible: entries.filter(function (e) { return !e.folded && e.put >= L; })
                           .map(function (e) { return e.id; })
        });
        packed += amount;
      }
      prev = L;
    });

    /* ③ どの ポットにも 入らなかった ぶん（降りた人が いちばん上の 区切りより
          多く 出していた とき）。いちばん 上の ポットに 足す。
          生きている人が 1人も いない ときだけ、出した人に 返す。 */
    var totalPut = 0;
    entries.forEach(function (e) { totalPut += e.put; });
    var left = totalPut - packed;
    if (left > 0) {
      if (pots.length) pots[pots.length - 1].amount += left;
      else entries.forEach(function (e) { if (e.put > 0) refunds.push({ id: e.id, amount: e.put }); });
    }

    return { pots: pots, refunds: refunds, entries: entries };
  }

  /* ★ 決着（このファイルの 2つめの 入口）。
       settle({ players:[{id, put, folded, hand|cards}], order:[id...] })
       order ＝ 端数（割り切れない 1枚）を 配る 順番。ホールデムでは 親の 左どなりから。
              わたさなければ players の ならび順。

     返すもの：
       pots      … [{ index, amount, cap, eligible, winners, each, odd:[id...], ranked }]
       refunds   … [{ id, amount }]
       payouts   … { id: もらう コインの 合計 }（返した ぶんも 入っている）
       caps      … { id: その人が 最大 いくらまで もらえるか }（§5-5「60まで もらえる」の 1行用）
       showdown  … rankHands の こたえ（生きている人だけ・強い順。同じ強さは 同じ place）
       total     … 分けた コインの 合計（＝ みんなの put の 合計。かならず 合う）
     ⚠️ payouts の 合計は かならず total と 同じに なります。ここが コインの 命です。 */
  function settle(opts) {
    opts = opts || {};
    var built = buildPots(opts.players || []);
    var entries = built.entries, pots = built.pots, refunds = built.refunds;

    var handById = {};
    entries.forEach(function (e) { handById[e.id] = e.hand; });

    var order = (opts.order && opts.order.length) ? opts.order.slice() : entries.map(function (e) { return e.id; });

    var payouts = {}, total = 0;
    entries.forEach(function (e) { payouts[e.id] = 0; total += e.put; });
    refunds.forEach(function (r) {
      payouts[r.id] = (payouts[r.id] || 0) + r.amount;
      total += r.amount;
    });

    pots.forEach(function (pot, i) {
      pot.index = i;
      var contenders = pot.eligible
        .filter(function (id) { return handById[id]; })
        .map(function (id) { return { id: id, hand: handById[id] }; });

      var ranked = contenders.length ? rankHands(contenders) : [];
      var winners = ranked.filter(function (r) { return r.win; }).map(function (r) { return r.id; });
      if (!winners.length) winners = pot.eligible.slice();     // 役が 分からない ときの 保険

      /* 山分け。割り切れない 1枚は order の 順に 1枚ずつ（T38 §3-5） */
      var each = Math.floor(pot.amount / winners.length);
      var oddCount = pot.amount - each * winners.length;
      var seq = order.filter(function (id) { return winners.indexOf(id) >= 0; });
      winners.forEach(function (id) { if (seq.indexOf(id) < 0) seq.push(id); });
      var odd = [];
      for (var k = 0; k < oddCount; k++) odd.push(seq[k % seq.length]);

      winners.forEach(function (id) { payouts[id] = (payouts[id] || 0) + each; });
      odd.forEach(function (id) { payouts[id] = (payouts[id] || 0) + 1; });

      pot.winners = winners; pot.each = each; pot.odd = odd; pot.ranked = ranked;
    });

    /* その人が 最大 いくらまで もらえるか（§5-5 の 1行） */
    var caps = {};
    entries.forEach(function (e) { caps[e.id] = 0; });
    pots.forEach(function (pot) {
      pot.eligible.forEach(function (id) { caps[id] += pot.amount; });
    });
    refunds.forEach(function (r) { caps[r.id] = (caps[r.id] || 0) + r.amount; });

    var live = entries.filter(function (e) { return !e.folded && e.hand; })
                      .map(function (e) { return { id: e.id, hand: e.hand }; });

    return {
      pots: pots, refunds: refunds, payouts: payouts, caps: caps,
      showdown: live.length ? rankHands(live) : [],
      entries: entries, order: order, total: total
    };
  }

  /* おまけ：その札が 役に つかわれているか（§6-2「場だけの役」の 見わけ用）。 */
  function uses(result, someCards) {
    if (!result) return false;
    var arr = Array.isArray(someCards) ? someCards : [someCards];
    for (var i = 0; i < arr.length; i++) {
      var k = arr[i] && arr[i].key ? arr[i].key : String(arr[i]);
      if (result.usedKeys.indexOf(k) >= 0) return true;
    }
    return false;
  }

  var PokerCore = {
    VERSION: '1.1.0',   // 1.1.0 ＝ ポットの 分け方（buildPots / settle）を 足した
    /* 役の 定義（説明文は ここが 1か所きり・T38 §2-4） */
    HANDS: HANDS,
    HAND_BY_ID: HAND_BY_ID,
    HAND_FIVE_OF_A_KIND: HAND_FIVE_OF_A_KIND,
    LADDER_STEPS: HANDS.length,          // はしごの 段数（10）
    /* カードの もと */
    SUITS: SUITS, RANKS: RANKS, RANK_VALUE: RANK_VALUE,
    rankLabel: rankLabel,
    createDeck: createDeck, shuffle: shuffle, draw: draw,
    card: card, cards: cards,
    /* 判定と くらべ */
    evaluate: evaluate,
    evalFive: function (five) {
      var list = normalizeList(five);
      if (!list || list.length !== 5) return null;
      return finish(evalFive(list), list);
    },
    compare: compare, compareScore: compareScore,
    decidingIndex: decidingIndex, rankHands: rankHands, uses: uses,
    /* ポットの 分け方（サイドポット・引き分けの 端数）*/
    buildPots: buildPots, settle: settle
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = PokerCore;
  if (global) global.PokerCore = PokerCore;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
