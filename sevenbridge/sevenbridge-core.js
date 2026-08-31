/* ============================================================
   セブンブリッジ ― 決まり・ロボット・寸法（T174・コーダ）
   ------------------------------------------------------------
   ★ このファイルは document を 1度も さわりません。
     ＝ Node でも そのまま 走る ＝ 数える 側と 遊ぶ 側が ズレようが ない
     （ピラミッド T76・四目 T127・ババ抜き T144・ページワン T152・ハーツ T165 と 同じ 作法）。

   ★★★ 中身は ルル T173 の `T173_セブンブリッジ_エンジン.cjs` の **移植** です ★★★
     ------------------------------------------------------------
     ★ 打ち手（enumMelds / planPlay / usefulness / 捨て札の えらび）は
       ★★**1行ずつ 写しました**。★書き直して いません。
       ★ ★＝ ★ルルの 数字（+24.4 など）と、この 画面の ロボットは **同じ 打ち手** です。
     ★ ★足したのは 2つ だけ：
       ★ ★① ★★**札の 身もと（cards[]）** ―― ★ルルの 場の 組は「マークの ○×」と「lo〜hi」で
             ★ 持って いました（★数えるには それで 足りる）。★★画面は「どの 1枚が どこに いるか」を
             ★ 追いかける ので、★組に **並び順の 札の ならび** を 足して います。
             ★ ★★決め方は 1つも 変えて いません（★足しただけ）。
       ★ ★② ★★**人が えらんだ 札が 組か どうか たしかめる**（`makeMeld`）――
             ★ ★★ここが 設計図 追記④ の 線 です：★**探すのは 人、たしかめるのが 機械。**
             ★ ★★`enumMelds`（＝ さがす）は **人の 道すじからは 1度も 呼びません**。

   ★★★ この 1本の いちばん 大きい 決め ―― 1試合 ＝ **4回 配って 合計点** ★★★
     ------------------------------------------------------------
     ★ ルル T173 §3【計算・各4万試合】：
       | 配る 回数 | ふつうに 出す人 | ★ためる人（場に 1枚も 出さない）|
       | ★1回だけ | 27.68% | ★★**31.93%** ←★ためる人の 勝ち |
       | ★★4回   | ★24.62% | ★★**5.59%** ←★出す人の 圧勝 |
     ★ ★＝ ★「1回 配って 終わり」に すると ★★**付け札（17.4ポイント）が 丸ごと 死にます**。
     ★ ★★だから `LIM.DEALS = 4`。★★これは 飾りでは なく、★★この 遊びの 骨 です。
       ★ ★verify ② が ★**わざと 1回配りに 戻して**、★ためる人が 最強に なる ことを 毎回 見ます
         （★T144 §7-4：★「無い ことだけ」数える 見張りは、直しごと 消えても 通る）。

   ★★★ ロボットの つよさは 3段（★ルル §12-3・ハーツと 同じ 形）★★★
     ★★ 3段 とも「★知って いる ことが ちがう」だけ です ――
        ★ ★**「見えて いるのに わざと 出さない」は 1つも 入って いません。**
        ★ ★＝ この会社が 5回 落とした 壁（T60/T78/T88/T126/T133）に 1度も さわって いません。
   ============================================================ */
(function (root) {
  'use strict';

  /* ── さいころ ─────────────────────────────
     ⚠️★ ルルの エンジンは `mulberry32` です。★★同じ 種で 同じ 試合に なる ように、
        ★ ★ここも mulberry32 に そろえて います（★ほかの 17本の xorshift では ありません）。 */
  function rng(seed) {
    var a = (seed | 0);
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ============================================================
     ★ 札（設計図 §9・ルル §10【実測】）
       ・0〜51 … ふつうの 札。★suit = c/13（0=クローバー 1=ダイヤ 2=ハート 3=スペード）
                 ★rank = c%13 + 1（1=A, 11=J, 12=Q, 13=K）★★ルルの ならび そのもの
       ・52 …… ★ジョーカー 1枚（JOKER1）
       ・★読む 絵は **54個**（52枚 ＋ JOKER1 ＋ トランプ裏赤）＝ ★足す絵 0枚（ルル §10【実測】）
     ★★ ジョーカーは **1枚** です（ルル §4-4【計算・各20万回 配る】）：
        ★ 0枚 … 手番が 29.1（★長い）／★★1枚 … 25.4／★2枚 … 遊びが 0.5 浅く なる
     ============================================================ */
  var SUITS = ['クローバー', 'ダイヤ', 'ハート', 'スペード'];
  var MARKS = ['♣', '♦', '♥', '♠'];
  var RANKS = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  var JOKER = 52;
  var JOKER_NAME = 'JOKER1';
  var BACK_NAME = 'トランプ裏赤';
  var DECK_N = 53;                 /* ★ 52 ＋ ジョーカー1枚 */

  function suitOf(c) { return c < 52 ? (c / 13) | 0 : -1; }
  function rankOf(c) { return c < 52 ? (c % 13) + 1 : 0; }
  function isJk(c) { return c >= 52; }
  function nameOf(c) { return isJk(c) ? JOKER_NAME : (SUITS[suitOf(c)] + RANKS[rankOf(c)]); }
  function markOf(c) { return isJk(c) ? '★' : MARKS[suitOf(c)]; }
  function isRed(c) { return !isJk(c) && (suitOf(c) === 1 || suitOf(c) === 2); }

  /* ★★ 点 ―― ★7＝0／A＝20／J・Q・K＝10／ジョーカー＝50／ほかは 数字どおり ★★
     ★ ★★これを **札の すみに 書きます**（ルル §2-2）―― ★あそびかたが 4行 減ります。
        ★ ★「7は 0点」は この ゲームの 名前 です（★ルル §4-5：★腕の 差が 4.64 → 6.34 に なる）。 */
  function penOf(c) {
    if (isJk(c)) return 50;
    var r = rankOf(c);
    if (r === 7) return 0;
    if (r === 1) return 20;
    if (r >= 11) return 10;
    return r;
  }
  /* ★「7が 0点」を やめた 世界（★ルル §4-5 の くらべ。★verify が 使います）*/
  function penFlat(c) {
    if (isJk(c)) return 50;
    var r = rankOf(c);
    if (r === 1) return 20;
    if (r >= 11) return 10;
    return r;
  }

  /* ★ 先読みする 絵の 名前（★先頭が 裏面 ―― ★ロボット3人の 手札 ぜんぶ）*/
  function allNames() {
    var a = [BACK_NAME], c;
    for (c = 0; c < 52; c++) a.push(nameOf(c));
    a.push(JOKER_NAME);
    return a;                                   /* ★ 1 ＋ 52 ＋ 1 ＝ 54個 */
  }

  /* ============================================================
     ★★ 場の 組（★ルルの 形 ＋ ★札の ならび `cards`）★★
     ------------------------------------------------------------
     ★ set … { t:'s', rank, suits:[×4], jk, n, owner, cards:[…] }
     ★ run … { t:'r', suit, lo, hi, jk, owner, cards:[…] }
       ★ ★lo/hi は 1〜14（★14 ＝ A を 上に 使った とき）。★cards[i] が 値 lo+i の 札。
       ★ ★ジョーカーは その 場所に 入って います。
     ============================================================ */
  function runFits(m, c) {
    if (isJk(c)) return (m.jk === 0 && (m.lo > 1 || m.hi < 14)) ? (m.lo > 1 ? m.lo - 1 : m.hi + 1) : 0;
    if (suitOf(c) !== m.suit) return 0;
    var r = rankOf(c);
    var cand = (r === 1) ? [1, 14] : [r];
    for (var k = 0; k < cand.length; k++) {
      var v = cand[k];
      if (v === m.lo - 1 && v >= 1) return v;
      if (v === m.hi + 1 && v <= 14) return v;
    }
    return 0;
  }
  function setFits(m, c) {
    if (m.n >= 4) return false;
    if (isJk(c)) return m.jk === 0;
    return rankOf(c) === m.rank && !m.suits[suitOf(c)];
  }
  function tableFits(m, c) { return m.t === 's' ? setFits(m, c) : (runFits(m, c) !== 0); }
  function tablePut(m, c) {
    if (m.t === 's') {
      if (isJk(c)) m.jk = 1; else m.suits[suitOf(c)] = true;
      m.n++;
      m.cards.push(c);
      return;
    }
    var v = runFits(m, c);
    if (isJk(c)) m.jk = 1;
    if (v === m.lo - 1) { m.lo = v; m.cards.unshift(c); }
    else { m.hi = v; m.cards.push(c); }
  }
  function cloneTable(T) {
    var out = [], i;
    for (i = 0; i < T.length; i++) {
      var m = T[i];
      out.push(m.t === 's'
        ? { t: 's', rank: m.rank, suits: m.suits.slice(), jk: m.jk, n: m.n, owner: m.owner, cards: m.cards.slice() }
        : { t: 'r', suit: m.suit, lo: m.lo, hi: m.hi, jk: m.jk, owner: m.owner, cards: m.cards.slice() });
    }
    return out;
  }
  function meldLen(m) { return m.t === 's' ? m.n : (m.hi - m.lo + 1); }

  /* ============================================================
     ★★★ 手札から 出せる 組を ぜんぶ 数えあげる（★ルルの enumMelds そのまま）★★★
     ------------------------------------------------------------
     ⚠️★★★ この 関数は **ロボットだけの もの** です ★★★
        ★ ★★人の 道すじ（画面の 指の 道・光りを 付ける 道）からは **1度も 呼びません**。
        ★ ★呼んだ とたん、★★それは「そろう 3枚を さがして 見せる」に なります
          ―― ★★設計図 追記② 違反・★このゲームで いちばん 重い 部品（21.6ポイント）を 奪います。
        ★ ★★verify ⑬ が、画面側の 関数の 中身を 1行ずつ 走査して 見張ります。
     ============================================================ */
  function enumMelds(hand) {
    var n = hand.length, out = [], i, r, s, k;
    var jkIdx = [];
    for (i = 0; i < n; i++) if (isJk(hand[i])) jkIdx.push(i);

    /* --- 組（同じ 数字）--- */
    for (r = 1; r <= 13; r++) {
      var idx = [];
      for (i = 0; i < n; i++) if (!isJk(hand[i]) && rankOf(hand[i]) === r) idx.push(i);
      k = idx.length;
      if (k < 2) continue;
      for (s = 1; s < (1 << k); s++) {
        var cnt = 0, mask = 0;
        for (i = 0; i < k; i++) if (s & (1 << i)) { cnt++; mask |= 1 << idx[i]; }
        if (cnt >= 3) out.push({ mask: mask, cnt: cnt, kind: 's', rank: r, useJk: 0 });
        if (cnt >= 2 && cnt <= 3 && jkIdx.length >= 1) {
          out.push({ mask: mask | (1 << jkIdx[0]), cnt: cnt + 1, kind: 's', rank: r, useJk: 1 });
        }
      }
    }

    /* --- 並び（同じ マークの つづいた 数字）--- */
    var cntSuit = [0, 0, 0, 0];
    for (i = 0; i < n; i++) if (!isJk(hand[i])) cntSuit[suitOf(hand[i])]++;
    for (var su = 0; su < 4; su++) {
      if (cntSuit[su] < 2) continue;
      var at = new Array(15);
      for (i = 0; i < 15; i++) at[i] = -1;
      var lo0 = 15, hi0 = 0;
      for (i = 0; i < n; i++) {
        if (isJk(hand[i]) || suitOf(hand[i]) !== su) continue;
        r = rankOf(hand[i]);
        at[r] = i;
        if (r === 1) at[14] = i;
        if (r < lo0) lo0 = r;
        if (r > hi0) hi0 = r;
      }
      if (at[1] >= 0) hi0 = 14;
      var w = jkIdx.length ? 1 : 0;
      var loA = Math.max(1, lo0 - w), hiA = Math.min(14, hi0 + w);
      for (var lo = loA; lo <= 12 && lo <= hiA - 2; lo++) {
        for (var hi = lo + 2; hi <= hiA; hi++) {
          if (lo === 1 && hi === 14) continue;
          var miss = 0, mk = 0, real = 0, ok = true;
          for (r = lo; r <= hi; r++) {
            if (at[r] < 0) { miss++; if (miss > 1) { ok = false; break; } }
            else { mk |= 1 << at[r]; real++; }
          }
          if (!ok) break;
          if (real < 2) continue;
          if (miss === 0) out.push({ mask: mk, cnt: real, kind: 'r', suit: su, lo: lo, hi: hi, useJk: 0 });
          else if (jkIdx.length >= 1) {
            out.push({ mask: mk | (1 << jkIdx[0]), cnt: real + 1, kind: 'r', suit: su, lo: lo, hi: hi, useJk: 1 });
          }
        }
      }
    }
    return out;
  }

  /* ★ 数えあげた 組を、★札の ならび付きの「場の 組」に する */
  function meldToTable(hand, m, owner) {
    var i, cards = [], jk = -1;
    if (m.kind === 's') {
      var suits = [false, false, false, false], cnt = 0;
      for (i = 0; i < hand.length; i++) {
        if (!(m.mask & (1 << i))) continue;
        cnt++;
        if (isJk(hand[i])) jk = hand[i];
        else { suits[suitOf(hand[i])] = true; cards.push(hand[i]); }
      }
      if (jk >= 0) cards.push(jk);
      return { t: 's', rank: m.rank, suits: suits, jk: m.useJk, n: cnt, owner: owner, cards: cards };
    }
    /* ★ 並び ―― ★値（lo〜hi）の 順に ならべ直す */
    var at = {};
    for (i = 0; i < hand.length; i++) {
      if (!(m.mask & (1 << i))) continue;
      if (isJk(hand[i])) { jk = hand[i]; continue; }
      var r = rankOf(hand[i]);
      var v = (r === 1) ? (m.lo === 1 ? 1 : 14) : r;
      at[v] = hand[i];
    }
    for (var val = m.lo; val <= m.hi; val++) {
      cards.push(at[val] === undefined ? jk : at[val]);
    }
    return { t: 'r', suit: m.suit, lo: m.lo, hi: m.hi, jk: m.useJk, owner: owner, cards: cards };
  }

  /* ============================================================
     ★★★ 人が えらんだ 札が 組か どうか **たしかめる**（★makeMeld）★★★
     ------------------------------------------------------------
     ★ 設計図 追記④：★★**探すのは 人、たしかめるのが 機械。**
       ★ ★人が **ぜんぶの 札を 自分で えらぶ** → ★機械は 合って いるかを 返すだけ。
       ★ ★★これは 奪って いません（★ピラミッドの「2枚 選ぶ → 合計13なら 消える」と 同じ 形）。
     ★ ★返すのは 組 か null。★★「どこが 惜しい」も「あと 1枚で そろう」も 返しません
       ―― ★★それを 返したら、★さがす 仕事を 半分 肩代わりした ことに なります。
     ============================================================ */
  function makeMeld(cards, owner) {
    var i, jkN = 0, real = [];
    if (!cards || cards.length < 3) return null;
    for (i = 0; i < cards.length; i++) {
      if (isJk(cards[i])) jkN++;
      else real.push(cards[i]);
    }
    if (jkN > 1) return null;                 /* ★ 決まり6：★1組に ジョーカーは 1枚まで */
    if (real.length < 2) return null;         /* ★ 本物が 2枚は 要る */

    /* ── 組（同じ 数字）── */
    var r0 = rankOf(real[0]), sameRank = true, used = [false, false, false, false];
    for (i = 0; i < real.length; i++) {
      if (rankOf(real[i]) !== r0) { sameRank = false; break; }
      if (used[suitOf(real[i])]) { sameRank = false; break; }
      used[suitOf(real[i])] = true;
    }
    if (sameRank) {
      var n = real.length + jkN;
      if (n > 4) return null;
      var sc = real.slice();
      if (jkN) sc.push(JOKER);
      return { t: 's', rank: r0, suits: used, jk: jkN, n: n, owner: owner, cards: sc };
    }

    /* ── 並び（同じ マークの つづいた 数字）── */
    var su = suitOf(real[0]);
    for (i = 0; i < real.length; i++) if (suitOf(real[i]) !== su) return null;
    var aceAt = -1;
    for (i = 0; i < real.length; i++) if (rankOf(real[i]) === 1) aceAt = i;
    var tries = (aceAt >= 0) ? [1, 14] : [0];
    for (var ti = 0; ti < tries.length; ti++) {
      var map = {}, lo = 99, hi = -1, dup = false;
      for (i = 0; i < real.length; i++) {
        var v = rankOf(real[i]);
        if (v === 1) v = tries[ti];
        if (map[v] !== undefined) { dup = true; break; }
        map[v] = real[i];
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
      if (dup) continue;
      var span = hi - lo + 1;
      var miss = span - real.length;
      if (miss > jkN) continue;
      var L = lo, H = hi;
      if (miss === 0 && jkN === 1) {
        /* ★ すきまが 無い ＋ ジョーカー ―― ★端を 1つ 伸ばす（★上を 先に）*/
        if (hi + 1 <= 14 && !(lo === 1 && hi + 1 === 14)) H = hi + 1;
        else if (lo - 1 >= 1) L = lo - 1;
        else continue;
      }
      if (L === 1 && H === 14) continue;
      if (H - L + 1 < 3) continue;
      if (L < 1 || H > 14) continue;
      var out = [];
      for (var val = L; val <= H; val++) out.push(map[val] === undefined ? JOKER : map[val]);
      return { t: 'r', suit: su, lo: L, hi: H, jk: jkN, owner: owner, cards: out };
    }
    return null;
  }

  /* ============================================================
     ★★ 1手番で どこまで 出せるか（★ルルの planPlay そのまま）★★
     ★ mustLeave … ★手に 残す 最低 枚数（★ふつう 1。★捨て札が 要る から）
     ============================================================ */
  function planPlay(hand, table, opts, me, mustLeave) {
    var nH = hand.length;
    var melds = enumMelds(hand), i, k;
    if (!opts.useSet) melds = melds.filter(function (m) { return m.kind !== 's'; });
    if (!opts.useRun) melds = melds.filter(function (m) { return m.kind !== 'r'; });
    if (opts.noJoker) melds = melds.filter(function (m) { return m.useJk === 0; });
    if (melds.length > 26) { melds.sort(function (a, b) { return b.cnt - a.cnt; }); melds = melds.slice(0, 26); }

    var canLayoff = !!opts.layoff;
    var best = null;
    var chosen = [];
    var cap = nH - mustLeave;

    var anyFit = false;
    if (canLayoff) {
      for (i = 0; i < nH && !anyFit; i++) {
        for (k = 0; k < table.length; k++) if (tableFits(table[k], hand[i])) { anyFit = true; break; }
      }
    }

    var bonus = opts.sevenOut
      ? function (rest) { return (rest.length === 1 && !isJk(hand[rest[0]]) && rankOf(hand[rest[0]]) === 7) ? 1 : 0; }
      : function () { return 0; };

    function evaluate() {
      var used = 0, j;
      for (j = 0; j < chosen.length; j++) used |= chosen[j].mask;
      var rest = [], sc, played;
      if (!anyFit) {
        played = 0;
        for (j = 0; j < chosen.length; j++) played += chosen[j].cnt;
        if (nH - played < mustLeave) return;
        for (j = 0; j < nH; j++) if (!(used & (1 << j))) rest.push(j);
        sc = played * 10 + bonus(rest);
        if (!best || sc > best.sc) best = { sc: sc, played: played, melds: chosen.slice(), laid: [], rest: rest };
        return;
      }
      var T = cloneTable(table);
      for (j = 0; j < chosen.length; j++) T.push(meldToTable(hand, chosen[j], me));
      for (j = 0; j < nH; j++) if (!(used & (1 << j))) rest.push(j);
      var laid = [];
      if (canLayoff && (!opts.layoffNeedsOwn || T.some(function (m) { return m.owner === me; }))) {
        var moved = true;
        while (moved) {
          moved = false;
          for (var q = 0; q < rest.length; q++) {
            var idx = rest[q];
            if (rest.length - 1 < mustLeave) break;
            for (var z = 0; z < T.length; z++) {
              if (tableFits(T[z], hand[idx])) {
                tablePut(T[z], hand[idx]); laid.push(idx); rest.splice(q, 1); q--; moved = true; break;
              }
            }
          }
        }
      }
      played = nH - rest.length;
      if (nH - played < mustLeave) return;
      sc = played * 10 + bonus(rest);
      if (!best || sc > best.sc) best = { sc: sc, played: played, melds: chosen.slice(), laid: laid.slice(), rest: rest.slice() };
    }

    var top = cap * 10 + (opts.sevenOut ? 1 : 0);
    function dfs(start, usedMask) {
      evaluate();
      if (best && best.sc >= top) return;
      for (var j = start; j < melds.length; j++) {
        if (melds[j].mask & usedMask) continue;
        chosen.push(melds[j]);
        dfs(j + 1, usedMask | melds[j].mask);
        chosen.pop();
        if (best && best.sc >= top) return;
      }
    }
    dfs(0, 0);
    if (!best) {
      var all = [];
      for (i = 0; i < nH; i++) all.push(i);
      best = { sc: 0, played: 0, melds: [], laid: [], rest: all };
    }
    return best;
  }

  /* ★ 手札の「使いみち」の 点（★捨てる 札を えらぶ ため・★ルルの usefulness そのまま）*/
  function usefulness(hand, i) {
    var c = hand[i];
    if (isJk(c)) return 100;
    var r = rankOf(c), s = suitOf(c), u = 0, j;
    for (j = 0; j < hand.length; j++) {
      if (j === i || isJk(hand[j])) continue;
      if (rankOf(hand[j]) === r) u += 12;
      if (suitOf(hand[j]) === s) {
        var d = Math.abs(rankOf(hand[j]) - r);
        if (d === 1) u += 10; else if (d === 2) u += 5;
      }
    }
    return u;
  }

  /* ============================================================
     ★★ 打ち手の 部品（★ルルの P そのまま）★★
     ★ o = { kind, useSet, useRun, layoff, smartDiscard, smartDraw,
             penaltyAware, jokerHold, safeDiscard, holdAll, holdTurns }
     ★★ どれも「★知って いる ことが ちがう」だけ です。
     ============================================================ */
  var P = {
    random:   function () { return { kind: 'random', useSet: false, useRun: false, layoff: false }; },
    newbie:   function () { return { kind: 'sm', useSet: true, useRun: true, layoff: false, smartDiscard: true }; },
    bot1:     function () { return { kind: 'sm', useSet: true, useRun: false, layoff: false, smartDiscard: true }; },
    bot2:     function () { return { kind: 'sm', useSet: true, useRun: true, layoff: false, smartDiscard: true }; },
    bot3:     function () { return { kind: 'sm', useSet: true, useRun: true, layoff: true, smartDiscard: true }; },
    bot4:     function () { return { kind: 'sm', useSet: true, useRun: true, layoff: true, smartDiscard: true, smartDraw: true }; },
    bot5:     function () { return { kind: 'sm', useSet: true, useRun: true, layoff: true, smartDiscard: true, smartDraw: true,
                                     penaltyAware: true, jokerHold: true, safeDiscard: true }; },
    /* ★★ ためる人（★上がれる ように なるまで 場に 1枚も 出さない）★★
       ★ ★ルル §3-1 の 主役。★verify ② が 使います。 */
    hold:     function () { return { kind: 'sm', useSet: true, useRun: true, layoff: true, smartDiscard: true, smartDraw: true,
                                     penaltyAware: true, jokerHold: true, safeDiscard: true, holdAll: true }; }
  };

  /* ★★ ロボットの つよさ 3段（★ルル §12-3）★★
     ★ ★★5段 作れますが 3段 出します（★「よわい」は はじめての人が 52% 勝って しまう）。
     ★ ★★初期値は 1段目「はじめて」―― ★はじめての 人が **25.06%（★ちょうど 五分）**（ルル §12-3）。
     ⚠️★ ここの 言葉と LEVEL_START の 数が ちがって いると 次に 読む 人が まちがえます
        （★トライ T166 §7-7 で 実際に 起きました）。★★両方 直す こと。 */
  var LEVELS = [
    { id: 'first',  label: 'はじめて', o: P.bot2() },
    { id: 'normal', label: 'ふつう',   o: P.bot3() },
    { id: 'strong', label: 'つよい',   o: P.bot5() }
  ];
  var LEVEL_START = 0;

  /* ★ 人の 模型（★数える ときだけ。★画面からは 1度も 通りません）*/
  var HUMANS = [
    { label: 'はじめての人（組＋並び）', o: P.newbie() },
    { label: '少し 分かった人（＋付け札）', o: P.bot3() },
    { label: '分かった人（＋引き方）',     o: P.bot4() },
    { label: 'ぜんぶ 気づいた人',         o: P.bot5() },
    { label: 'でたらめ',                  o: P.random() },
    { label: '★ためる人（場に 出さない）', o: P.hold() }
  ];

  /* ============================================================
     ★★ 決まり（★13個。★見せる 説明は 6行 ―― ★ルル §9）★★
     ------------------------------------------------------------
       1  7枚ずつ 配る。のこりが 山。1枚 めくって すて札の はじまり  → 画面が やる（0行）
       2  山から 1枚 引く。または すて札の 一番上を もらう          → 1行
       3  同じ 数字 3枚以上 ＝ 組。場に 出せる                      → （4と 同じ行）
       4  同じ マークの つづいた 数字 3枚以上 ＝ 並び               → 1行
       5  場の 組に 自分の 札を 足せる（★だれの ものでも）          → 1行
       6  ジョーカーは どの 札の かわりにも（1組に 1枚まで）        → 0行（★触れば 分かる）
       7  手番の さいごに 1枚 すてる                                → （8と 同じ行）
       8  手札が 0枚に なったら 上がり                              → 1行
       9  上がった 人は 0点                                         → 0行
      10  のこった 札が 点（7＝0／A＝20／絵札＝10／JOKER＝50）       → 1行（★札の すみに 書く）
      11  さいごに すてた 札が 7 なら、ほかの 人の 点が 2倍          → 0行（★ハッピーが 言う）
      12  山が なくなったら すて札を 混ぜ直して 山に する            → 0行
      13  ★4回 くりかえして 合計点が いちばん 少ない 人の 勝ち       → 1行
     ★★ 入口（設定）は **0個** です（★ルル §6-2：★切りかえて 面白くなる 決まりが 1つも 無い）。
     ============================================================ */
  var DEALS = 4;
  var HAND_SIZE = 7;
  var LIM = { DEALS: DEALS, MAXTURN: 600, MAXRESHUFFLE: 6 };

  function defaultRules() {
    return { nP: 4, handSize: HAND_SIZE, jokers: 1, sevenDouble: true, sevenZero: true,
             layoffNeedsOwn: false, reshuffle: true, maxTurns: LIM.MAXTURN };
  }

  /* ============================================================
     ★★ 1回 配る ぶんの 場（★画面も 数える 側も、ここを 通ります）★★
     ------------------------------------------------------------
     ★ phase … 'draw'（引く）→ 'play'（出す・付け札・すてる）→ 'over'
     ★ ★★札の 身もとは **札の 番号 そのもの**（0〜52）です ――
       ★ ★同じ 札が 2枚 ない ので、★ハーツの ような 入れもの（slot）が 要りません。
     ============================================================ */
  function makeGame(rand, opt) {
    opt = opt || {};
    var R = opt.rules || defaultRules();
    var nP = R.nP, i, j, t;
    var N = 52 + R.jokers;
    var deck = [];
    for (i = 0; i < N; i++) deck.push(i);
    for (i = N - 1; i > 0; i--) { j = (rand() * (i + 1)) | 0; t = deck[i]; deck[i] = deck[j]; deck[j] = t; }

    var hands = [];
    for (i = 0; i < nP; i++) hands.push(deck.splice(0, R.handSize));
    var discard = [deck.pop()];

    return {
      rules: R, nP: nP, rand: rand,
      dealNo: opt.dealNo || 0,
      startP: (opt.startP || 0) % nP,
      hands: hands, stock: deck, discard: discard, table: [],
      cur: (opt.startP || 0) % nP,
      phase: 'draw', turn: 0, reshuffles: 0,
      winner: -1, lastDiscard: -1, doubled: false, drawGame: false,
      over: false, pts: null,
      st: { turns: 0, draws: 0, tookDiscard: 0, meldTurns: 0, layoffCards: 0,
            handMax: R.handSize + 1, reshuffles: 0, dryTurns: 0 }
    };
  }

  /* ★ 山が 空なら すて札を 混ぜ直す（★決まり12・★説明 0行）
     ★ ★返り … 'ok' ／ 'dry'（★もう 混ぜる 札が ない ＝ 誰も 上がれずに 終わり）*/
  function refill(g) {
    if (g.stock.length) return 'ok';
    if (!g.rules.reshuffle) return 'dry';
    var top = g.discard.pop();
    if (g.discard.length === 0) { g.discard.push(top); return 'dry'; }
    while (g.discard.length) g.stock.push(g.discard.pop());
    for (var i = g.stock.length - 1; i > 0; i--) {
      var j = (g.rand() * (i + 1)) | 0, t = g.stock[i];
      g.stock[i] = g.stock[j]; g.stock[j] = t;
    }
    g.discard.push(top);
    g.reshuffles++; g.st.reshuffles++;
    if (g.reshuffles > LIM.MAXRESHUFFLE) return 'dry';
    return 'ok';
  }

  /* ★ 引く ―― ★from ＝ 'stock' ／ 'discard' */
  function doDraw(g, from) {
    if (g.over || g.phase !== 'draw') return { ok: false };
    if (from === 'discard') {
      if (!g.discard.length) return { ok: false };
      var c = g.discard.pop();
      g.hands[g.cur].push(c);
      g.st.tookDiscard++; g.st.draws++;
      if (g.hands[g.cur].length > g.st.handMax) g.st.handMax = g.hands[g.cur].length;
      g.phase = 'play';
      return { ok: true, card: c, from: 'discard' };
    }
    var r = refill(g);
    if (r === 'dry') { finishDeal(g, -1); return { ok: false, dry: true }; }
    var c2 = g.stock.pop();
    g.hands[g.cur].push(c2);
    g.st.draws++;
    if (g.hands[g.cur].length > g.st.handMax) g.st.handMax = g.hands[g.cur].length;
    g.phase = 'play';
    return { ok: true, card: c2, from: 'stock' };
  }

  /* ★ 組を 場に 出す（★人は ここへ「えらんだ 札」を そのまま 渡します）*/
  function doMeld(g, cards) {
    if (g.over || g.phase !== 'play') return { ok: false, why: 'いま 出せません' };
    var hand = g.hands[g.cur], i, k;
    if (hand.length - cards.length < 1) return { ok: false, why: 'すてる 1枚が なくなります' };
    for (i = 0; i < cards.length; i++) if (hand.indexOf(cards[i]) < 0) return { ok: false, why: '手札に ありません' };
    var m = makeMeld(cards, g.cur);
    if (!m) return { ok: false, why: '組に なって いません' };
    for (i = 0; i < cards.length; i++) { k = hand.indexOf(cards[i]); if (k >= 0) hand.splice(k, 1); }
    g.table.push(m);
    return { ok: true, meld: m, at: g.table.length - 1 };
  }

  /* ★ 付け札 ―― ★場の 組に 1枚 足す（★mi ＝ 場の 何番目の 組か）*/
  function doLayoff(g, card, mi) {
    if (g.over || g.phase !== 'play') return { ok: false, why: 'いま 足せません' };
    var hand = g.hands[g.cur];
    if (hand.length < 2) return { ok: false, why: 'すてる 1枚が なくなります' };
    if (hand.indexOf(card) < 0) return { ok: false, why: '手札に ありません' };
    var m = g.table[mi];
    if (!m || !tableFits(m, card)) return { ok: false, why: 'そこには 足せません' };
    tablePut(m, card);
    hand.splice(hand.indexOf(card), 1);
    return { ok: true, at: mi, pos: m.cards.indexOf(card) };
  }

  /* ★ すてる ―― ★ここで 手番が おわります。★手札が 0枚に なったら 上がり */
  function doDiscard(g, card) {
    if (g.over || g.phase !== 'play') return { ok: false, why: 'いま すてられません' };
    var hand = g.hands[g.cur];
    var k = hand.indexOf(card);
    if (k < 0) return { ok: false, why: '手札に ありません' };
    hand.splice(k, 1);
    g.discard.push(card);
    g.lastDiscard = card;
    g.turn++;
    g.st.turns = g.turn;
    if (hand.length === 0) { finishDeal(g, g.cur); return { ok: true, out: true }; }
    if (g.turn >= g.rules.maxTurns) { finishDeal(g, -1); return { ok: true, out: false, stop: true }; }
    g.cur = (g.cur + 1) % g.nP;
    g.phase = 'draw';
    return { ok: true, out: false };
  }

  /* ★★ 1回 おわり ―― ★点を つける（★決まり 9・10・11）★★ */
  function finishDeal(g, winner) {
    var PEN = g.rules.sevenZero ? penOf : penFlat;
    var pts = [], p, i;
    for (p = 0; p < g.nP; p++) {
      if (p === winner) { pts.push(0); continue; }
      var s = 0;
      for (i = 0; i < g.hands[p].length; i++) s += PEN(g.hands[p][i]);
      pts.push(s);
    }
    g.doubled = false;
    if (winner >= 0 && g.rules.sevenDouble && g.lastDiscard >= 0 &&
        !isJk(g.lastDiscard) && rankOf(g.lastDiscard) === 7) {
      g.doubled = true;
      for (p = 0; p < g.nP; p++) if (p !== winner) pts[p] *= 2;
    }
    g.winner = winner;
    g.drawGame = (winner < 0);
    g.pts = pts;
    g.phase = 'over';
    g.over = true;
    /* ★ 場の 大きさ（★追記③：★ふだんの 見え方を 決める 数・ルル §8-2）*/
    g.st.melds = g.table.length;
    g.st.tableCards = 0;
    g.st.widest = 0;
    for (i = 0; i < g.table.length; i++) {
      var wdt = meldLen(g.table[i]);
      g.st.tableCards += wdt;
      if (wdt > g.st.widest) g.st.widest = wdt;
    }
    g.st.discardPile = g.discard.length;
    return pts;
  }

  /* ============================================================
     ★★ ロボットの 1手番（★ルルの playDeal の 中身を そのまま 3つに 割った もの）★★
     ★ ★①引く ②出す・付け札 ③すてる ―― ★画面は これを 順に 動かして 見せます。
     ★ ★数える 側（simDeal）も 同じ 3つを 呼びます ＝ ★ズレようが ない。
     ============================================================ */
  function botDraw(g, o) {
    if (o.smartDraw && g.discard.length) {
      /* ★ 見えない 山の 札は のぞきません。★見えて いる すて札 だけで 決めます */
      var h3 = g.hands[g.cur];
      var h2 = h3.concat([g.discard[g.discard.length - 1]]);
      var a = planPlay(h2, g.table, o, g.cur, 1).played;
      var aBase = planPlay(h3, g.table, o, g.cur, 1).played;
      var uBase = 0, uNew = 0, i;
      for (i = 0; i < h3.length; i++) uBase += usefulness(h3, i);
      for (i = 0; i < h2.length; i++) uNew += usefulness(h2, i);
      if (a > aBase || (uNew - uBase) >= 22) return 'discard';
    }
    return 'stock';
  }
  /* ★ 出す ぶんを 決める（★まだ 動かしません）*/
  function botPlan(g, o) {
    var oEff = o;
    if (g.rules.layoffNeedsOwn) {
      var mine = false, i;
      for (i = 0; i < g.table.length; i++) if (g.table[i].owner === g.cur) { mine = true; break; }
      if (!mine) { oEff = {}; for (var k in o) if (o.hasOwnProperty(k)) oEff[k] = o[k]; oEff.layoff = false; }
    }
    var hand = g.hands[g.cur];
    var plan = planPlay(hand, g.table, oEff, g.cur, 1);
    var doPlay = plan.played > 0;
    var goingOut = plan.played >= hand.length - 1;
    if (o.holdAll && !goingOut) doPlay = false;
    if (o.holdTurns && !goingOut && g.st.draws <= o.holdTurns) doPlay = false;
    if (o.jokerHold && doPlay && plan.played < hand.length - 1) {
      var oNo = {}; for (var k2 in o) if (o.hasOwnProperty(k2)) oNo[k2] = o[k2];
      oNo.noJoker = true;
      var noJ = planPlay(hand, g.table, oNo, g.cur, 1);
      if (noJ.played >= plan.played - 1) {
        plan = noJ; doPlay = plan.played > 0;
      }
    }
    return { plan: plan, doPlay: doPlay };
  }
  /* ★ 決めた ぶんを 実際に 動かす。★返り … 動きの ならび（★画面が 1つずつ 見せます）*/
  function botPlay(g, o) {
    var pp = botPlan(g, o), steps = [];
    if (!pp.doPlay) return steps;
    var plan = pp.plan, i, j;
    /* ⚠️★★★ ここで 1回 つまずきました【★私の 失敗①・作業メモ §5】★★★
       ★ ★はじめ `var hand = g.hands[g.cur]` と 書いて、★そのまま splice して いました。
         ★ ★★同じ 配列 です ―― ★★1組 出した とたん、★`plan.laid` の 番号が ぜんぶ ずれます。
       ★ ★見つけ方：★Node で 走らせたら **反則が 8000回中 45518件**。
         ★ ★★勝率は ルルの 表と ぴったり 合って いました（★0.30 / 3.90 / 12.03 / 25.20%）――
           ★★だから「合って いる」と 思いこむ ところ でした。★★見張りが 先に 鳴らして くれました。
       ★ → ★★**配りはじめの 手札を 1枚 写しとって（hand0）、番号は そこへ 当てます。**
         ★ ★ルルの エンジンも 同じ 形（used[] を 立てて 最後に 作り直す）でした。 */
    var hand0 = g.hands[g.cur].slice();
    var used = [];
    for (i = 0; i < hand0.length; i++) used.push(false);
    g.st.meldTurns++;
    g.st.layoffCards += plan.laid.length;
    for (i = 0; i < plan.melds.length; i++) {
      var m = meldToTable(hand0, plan.melds[i], g.cur);
      for (j = 0; j < hand0.length; j++) if (plan.melds[i].mask & (1 << j)) used[j] = true;
      g.table.push(m);
      steps.push({ kind: 'meld', cards: m.cards.slice(), at: g.table.length - 1 });
    }
    for (i = 0; i < plan.laid.length; i++) {
      var c = hand0[plan.laid[i]];
      for (j = 0; j < g.table.length; j++) {
        if (tableFits(g.table[j], c)) {
          tablePut(g.table[j], c);
          used[plan.laid[i]] = true;
          steps.push({ kind: 'lay', card: c, at: j });
          break;
        }
      }
    }
    var nh = [];
    for (i = 0; i < hand0.length; i++) if (!used[i]) nh.push(hand0[i]);
    g.hands[g.cur] = nh;
    return steps;
  }
  /* ★ 捨てる 1枚を 決める（★ルルの 式 そのまま）*/
  function botDiscard(g, o) {
    var h = g.hands[g.cur], PEN = g.rules.sevenZero ? penOf : penFlat;
    var di = 0, i, j;
    if (o.smartDiscard || o.penaltyAware || o.safeDiscard) {
      var bestS = -1e9;
      for (i = 0; i < h.length; i++) {
        var s = 0;
        if (o.smartDiscard) s += -usefulness(h, i);
        if (o.penaltyAware) s += PEN(h[i]) * 0.9;
        if (o.safeDiscard) {
          var risk = 0;
          for (j = 0; j < g.table.length; j++) if (tableFits(g.table[j], h[i])) risk += 6;
          s -= risk;
        }
        if (isJk(h[i])) s -= 500;
        if (s > bestS) { bestS = s; di = i; }
      }
    } else {
      di = (g.rand() * h.length) | 0;
      if (isJk(h[di]) && h.length > 1) di = (di + 1) % h.length;
    }
    return h[di];
  }

  /* ============================================================
     ★★ ひとまとまりの 勝負（★4回 配って 合計点）★★
     ★ ★★4回 ＝ 4人。★「1人 1回ずつ 親を やったら 終わり」（★ルル §3-3）。
     ★ ★親を ずらすと 先手の 得が **5.26 → 0.45** に なります（★ルル §3-2）。
     ============================================================ */
  function newMatch(level) {
    return { total: [0, 0, 0, 0], dealNo: 0, deals: LIM.DEALS,
             level: (level == null ? LEVEL_START : level), over: false, winners: [] };
  }
  function addDeal(m, pts) {
    for (var p = 0; p < 4; p++) m.total[p] += pts[p];
    m.dealNo++;
    if (m.dealNo >= m.deals) {
      m.over = true;
      var lo = Math.min(m.total[0], m.total[1], m.total[2], m.total[3]);
      m.winners = [];
      for (p = 0; p < 4; p++) if (m.total[p] === lo) m.winners.push(p);
    }
    return m;
  }

  /* ============================================================
     ★ 走らせる（★数える とき だけ。★画面は 通りません）
     ★★ ただし ―― ★通る 道は **画面と 同じ** です（doDraw / botPlay / doDiscard）。
     ============================================================ */
  function simDeal(rand, os, R, startP) {
    var g = makeGame(rand, { rules: R || defaultRules(), startP: startP || 0 });
    var bad = 0, guard = 0;
    while (!g.over && guard++ < (R && R.maxTurns ? R.maxTurns : LIM.MAXTURN) + 10) {
      var o = os[g.cur];
      if (g.stock.length === 0 && g.discard.length <= 1) g.st.dryTurns++;
      var from = botDraw(g, o);
      var dr = doDraw(g, from);
      if (!dr.ok) { if (dr.dry) break; bad++; break; }
      var before = g.hands[g.cur].length;
      var steps = botPlay(g, o);
      /* ★ 反則の 見張り ―― ★出した 組は 本当に 組か */
      for (var s = 0; s < steps.length; s++) {
        if (steps[s].kind === 'meld') {
          var mm = g.table[steps[s].at];
          if (meldLen(mm) < 3) bad++;
        }
      }
      if (g.hands[g.cur].length < 1) bad++;
      if (g.hands[g.cur].length > before) bad++;
      var dc = botDiscard(g, o);
      var rr = doDiscard(g, dc);
      if (!rr.ok) { bad++; break; }
    }
    if (!g.over) finishDeal(g, -1);
    /* ★ 札の 数の 見張り ―― ★53枚 きっちり 残って いるか */
    var total = g.stock.length + g.discard.length, p, i;
    for (p = 0; p < g.nP; p++) total += g.hands[p].length;
    for (i = 0; i < g.table.length; i++) total += meldLen(g.table[i]);
    if (total !== 53) bad += 100;
    return { winner: g.winner, pts: g.pts, st: g.st, doubled: g.doubled,
             drawGame: g.drawGame, bad: bad, table: g.table };
  }

  function simMatch(rand, os, R, deals) {
    deals = deals || LIM.DEALS;
    var tot = [0, 0, 0, 0], turns = 0, draws = 0, handMax = 0, bad = 0;
    var melds = 0, tblCards = 0, widest = 0, doubled = 0, d, p;
    for (d = 0; d < deals; d++) {
      var r = simDeal(rand, os, R, d);
      for (p = 0; p < 4; p++) tot[p] += r.pts[p];
      turns += r.st.turns; bad += r.bad;
      if (r.drawGame) draws++;
      if (r.doubled) doubled++;
      if (r.st.handMax > handMax) handMax = r.st.handMax;
      if (r.st.melds > melds) melds = r.st.melds;
      if (r.st.tableCards > tblCards) tblCards = r.st.tableCards;
      if (r.st.widest > widest) widest = r.st.widest;
    }
    var lo = Math.min(tot[0], tot[1], tot[2], tot[3]);
    var nw = 0;
    for (p = 0; p < 4; p++) if (tot[p] === lo) nw++;
    var win = [];
    for (p = 0; p < 4; p++) win.push(tot[p] === lo ? 1 / nw : 0);
    return { tot: tot, win: win, turns: turns, draws: draws, handMax: handMax,
             melds: melds, tblCards: tblCards, widest: widest, doubled: doubled, bad: bad };
  }

  function newStat() {
    return { games: 0, win: 0, illegal: 0, nofin: 0, doubled: 0, pts: 0,
             turns: 0, turnList: [], handMax: 0, melds: 0, tblCards: 0, widest: 0,
             meldList: [], cardList: [], scores: [] };
  }
  /* ★ mode ＝ 'deal'（★1回 配る ぶん）／ 'match'（★4回 配って 合計点・初期値）*/
  function runMany(n, seed, os, R, mode, deals) {
    var st = newStat(), rand = rng((seed | 0) || 4649), i;
    for (i = 0; i < n; i++) {
      if (mode === 'deal') {
        var r = simDeal(rand, os, R, i % 4);
        st.games++;
        var lo = Math.min(r.pts[0], r.pts[1], r.pts[2], r.pts[3]), nw = 0, p;
        for (p = 0; p < 4; p++) if (r.pts[p] === lo) nw++;
        if (r.pts[0] === lo) st.win += 1 / nw;
        st.illegal += r.bad;
        if (r.drawGame) st.nofin++;
        if (r.doubled) st.doubled++;
        st.pts += r.pts[0];
        st.turns += r.st.turns; st.turnList.push(r.st.turns);
        if (r.st.handMax > st.handMax) st.handMax = r.st.handMax;
        if (r.st.melds > st.melds) st.melds = r.st.melds;
        if (r.st.tableCards > st.tblCards) st.tblCards = r.st.tableCards;
        if (r.st.widest > st.widest) st.widest = r.st.widest;
        st.meldList.push(r.st.melds); st.cardList.push(r.st.tableCards);
        st.scores.push(r.pts[0]);
      } else {
        var m = simMatch(rand, os, R, deals);
        st.games++;
        st.win += m.win[0];
        st.illegal += m.bad;
        st.nofin += m.draws;
        st.doubled += m.doubled;
        st.pts += m.tot[0];
        st.turns += m.turns; st.turnList.push(m.turns);
        if (m.handMax > st.handMax) st.handMax = m.handMax;
        if (m.melds > st.melds) st.melds = m.melds;
        if (m.tblCards > st.tblCards) st.tblCards = m.tblCards;
        if (m.widest > st.widest) st.widest = m.widest;
        st.meldList.push(m.melds); st.cardList.push(m.tblCards);
        st.scores.push(m.tot[0]);
      }
    }
    return st;
  }
  function pct(a, f) {
    var s = a.slice().sort(function (x, y) { return x - y; });
    return s[Math.min(s.length - 1, Math.floor(s.length * f))];
  }

  /* ============================================================
     ★★ 寸法 ―― ★手札は **8枚**（★7枚 ＋ 引いた 1枚。★これ以上 増えません）★★
     ------------------------------------------------------------
     ★ ルル §8-1：★★手札 8枚は **青信号**（★大富豪17・ハーツ13 の ずっと 下）。
       ★ ★決まりの 上で 増えようが ありません（★引くのは 1枚・すてるのも 1枚）。

     ★★★ この 1本の 難しい ところは 手札では なく **場** です（★ルル §8-2）★★★
       | ★1回 配り おわった ときの 場 | まん中 | 9割 | 99% | いちばん 大きい |
       | ★組の 数   | ★**5個** | 6 | 7 | 8個 |
       | ★札の 枚数 | ★**19枚** | 23 | 25 | 25枚 |
       | ★いちばん 長い 組 | 5枚 | 8 | 11 | 14枚 |
     ★ ★設計図 追記③ を そのまま 当てます：
       ★ ★★**ふだんの 形（組5個・19枚）を いちばん 見やすく 作る。**
       ★ ★まれな「8組・25枚」は ★**静かに 詰める**（→ `packTable`）。
       ★ ★★触る ところ（★場の 組・手札・山・すて札）は **ぜったいに 画面に 残します**
         ―― ★★端が 切れたら それは 見切れでは なく **故障** です。

     ★ 1画面の 積み方（★上から）：
        ロボット3人（裏の 手札 ＋ 名前）
        ─ すきま ─
        ★点の 帯（★何回目 ／ 合計 ―― ★4人ぶん）
        ─ すきま ─
        ★★場の 台（★組が ならぶ。★ここが いちばん 大きい）
        ─ すきま ─
        ★山 と すて札
        ─ すきま ─
        あなたの 手札（★8枚）
     ============================================================ */
  var FIT = {
    RATIO_W: 419, RATIO_H: 635,
    W_MAX: 100, W_MIN: 12,
    HAND_N: 8,                      /* ★★ 手札は 8枚が ふだんの 形かつ 最大 */
    PITCH_MIN: 21,                  /* ★ 見えて いる はばの 下ばり（★トライ T153【実測】）*/
    PITCH_RATE: 0.56,               /* ★ 見えて いる はば ÷ 札の はば の 下ばり */
    GAP_RATE: 0.06, GAP_MIN: 3,
    BOT_RATE: 0.34,                 /* ★ ロボットの 裏札（自分の 札の 34%）*/
    BOT_STEP: 0.34,                 /* ★ ロボットの 裏札の ずらし */
    NAME_H: 15,
    SCORE_MIN: 30, SCORE_WANT: 46,  /* ★ 点の 帯（★何回目 ／ 合計 の 2行）*/
    PILE_RATE: 0.75,                /* ★ 山・すて札（★指の 的。★44px を 割らせない）*/
    /* ★★★ 場の 札の 大きさ（★設計図 追記③ の 当てはめ）★★★
       ★ ★TBL_RATE は「★★ふだんの 形（★5組・19枚）が **2行で 気持ちよく 入る**」大きさ です
         ―― ★★まれな 8組・25枚に 合わせて いません（★合わせると 320×568 で 35px に なりました）。
       ★ ★8組・25枚に なった ときは `packTable` が **静かに 詰めます**（★35px まで 下がる）。
         ★ ★★＝ ★99%の 画面を 1%の ために 小さく しない、が そのまま 形に なって います。 */
    TBL_RATE: 0.72, TBL_MIN: 20, TBL_MAX: 76,   /* ★ 場の 札 */
    STEP_RATE: 0.44, STEP_MIN: 9,   /* ★ 組の 中の ずらし（★左上の 角が 見える 量）*/
    STEP_READ: 0.30,                /* ★★ ここまで 詰めても 左上の 角（数字と マーク）は 読める */
    ROWGAP: 6, ROWS_BASE: 2, ROWS_CAP: 4,
    MELD_GAP: 8,                    /* ★ 組と 組の あいだ */
    WIDEST: 14,                     /* ★★ いちばん 長い 組（★ルル §8-2【計算】）*/
    EDGE: 13,                       /* ★ 台の わく（★大富豪の【実測】木4＋内よはく7＋みどり2）*/
    PAD: 8, PADMIN: 4, NGAP: 6
  };

  function cardH(w) { return Math.round(w * FIT.RATIO_H / FIT.RATIO_W); }
  function gapFor(w) { return Math.max(FIT.GAP_MIN, Math.round(w * FIT.GAP_RATE)); }
  function handPitch(w, W) {
    var full = w + gapFor(w);
    if (FIT.HAND_N <= 1) return full;
    return Math.min(full, (W - w) / (FIT.HAND_N - 1));
  }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  function pickLayout(W, H) {
    for (var w = FIT.W_MAX; w >= FIT.W_MIN; w--) {
      var p = handPitch(w, W);
      if (p < FIT.PITCH_MIN) continue;                 /* ★ ① 21px */
      if (p < w * FIT.PITCH_RATE) continue;            /* ★ ② まん中が かくれない */
      var h = cardH(w);
      var bw = Math.max(8, Math.round(w * FIT.BOT_RATE)), bh = cardH(bw);
      var bstep = Math.max(3, Math.round(bw * FIT.BOT_STEP));
      var botOne = bw + (FIT.HAND_N - 1) * bstep;
      if (botOne * 3 + 16 > W) continue;               /* ★ ロボット3人が よこに ならぶか */
      var botH = bh + FIT.NAME_H;
      var pw = Math.max(8, Math.round(w * FIT.PILE_RATE)), ph = cardH(pw);
      var tw = clamp(Math.round(w * FIT.TBL_RATE), FIT.TBL_MIN, FIT.TBL_MAX), th = cardH(tw);
      var step = Math.max(FIT.STEP_MIN, Math.round(tw * FIT.STEP_RATE));
      /* ★★ いちばん 長い 組（★14枚・ルル §8-2【計算】）が **1行に 入る** ことを 先に 決めます
         ―― ★★入らないと 端が 切れます（★追記③：★触る ところが 切れたら 見切れでは なく 故障）。
         ★ ★ここでは **詰めた ずらし**（0.30）で 見ます ―― ★★14枚は 99%の 外の 話 なので、
           ★ ★ふだんの ずらし（0.44）を そこに 合わせません（★追記③ そのもの）。 */
      var stepRead = Math.max(8, Math.round(tw * FIT.STEP_READ));
      if (tw + (FIT.WIDEST - 1) * stepRead + FIT.EDGE * 2 > W) continue;
      var tblBase = FIT.ROWS_BASE * th + (FIT.ROWS_BASE - 1) * FIT.ROWGAP + FIT.EDGE * 2;
      var tblCap  = FIT.ROWS_CAP  * th + (FIT.ROWS_CAP  - 1) * FIT.ROWGAP + FIT.EDGE * 2;
      var need = botH + FIT.SCORE_MIN + tblBase + ph + h + FIT.NGAP * FIT.PADMIN;
      if (need > H) continue;
      return { w: w, h: h, g: gapFor(w), pitch: p, bw: bw, bh: bh, bstep: bstep, botOne: botOne,
               botH: botH, pw: pw, ph: ph, tw: tw, th: th, step: step,
               tblBase: tblBase, tblCap: tblCap, need: need };
    }
    return fallbackLayout(W, H);
  }
  /* ★ どうしても 入らない ほど 小さい 窓（保険）。★ここに 来ても 壊れない ように だけ する */
  function fallbackLayout(W, H) {
    var w = Math.max(8, Math.min(FIT.W_MIN, Math.floor(W / 9)));
    var h = cardH(w);
    var bw = Math.max(6, Math.round(w * FIT.BOT_RATE)), bh = cardH(bw);
    var bstep = Math.max(2, Math.round(bw * FIT.BOT_STEP));
    var pw = Math.max(8, Math.round(w * FIT.PILE_RATE)), ph = cardH(pw);
    var tw = Math.max(14, Math.round(w * FIT.TBL_RATE)), th = cardH(tw);
    var step = Math.max(6, Math.round(tw * 0.34));
    return { w: w, h: h, g: FIT.GAP_MIN, pitch: Math.max(6, (W - w) / (FIT.HAND_N - 1)),
             bw: bw, bh: bh, bstep: bstep, botOne: bw + (FIT.HAND_N - 1) * bstep,
             botH: bh + FIT.NAME_H, pw: pw, ph: ph, tw: tw, th: th, step: step,
             tblBase: 2 * th + FIT.ROWGAP + FIT.EDGE * 2,
             tblCap: 3 * th + FIT.ROWGAP * 2 + FIT.EDGE * 2, tight: true };
  }

  /* ============================================================
     ★★★ 場の 組を たたむ（★設計図 追記③ の 心臓）★★★
     ------------------------------------------------------------
     ★ counts … ★組ごとの 札の 枚数の ならび（例 [3,4,3,5,4] ＝ ★ふだんの 形）
     ★ ★ふだんの 形（★5組・19枚）が **いちばん 大きく 見える** ように 上から 試します。
       ★ ★① 札の 大きさは そのまま／ずらしを 詰める（0.44 → 0.38 → 0.32）
       ★ ★② 行の すきまを 詰める（6 → 3 → 0）
       ★ ★③ ★それでも 入らなければ 札を 1pxずつ 小さく する
       ★ ★④ いちばん 小さく しても 入らない ときだけ **行を 重ねる**（★上の 角は 残る）
     ★ ★★どの 段でも「★組の いちばん 左の 札」は 必ず 見えて います ―― ★★指が 届きます。
     ★ ★★戻すのは 座標だけ。★★「どこに 足せるか」は 1文字も 返しません。
     ============================================================ */
  function packRows(counts, innerW, tw, step) {
    var rows = [], row = [], x = 0, i;
    for (i = 0; i < counts.length; i++) {
      var n = Math.max(1, counts[i]);
      var ms = step;
      var wdt = tw + (n - 1) * ms;
      if (wdt > innerW) {                       /* ★ 1つの 組が 行より 長い ―― ★その 組だけ 詰める */
        ms = Math.max(6, Math.floor((innerW - tw) / (n - 1)));
        wdt = tw + (n - 1) * ms;
      }
      if (row.length && x + FIT.MELD_GAP + wdt > innerW) { rows.push(row); row = []; x = 0; }
      row.push({ i: i, n: n, w: wdt, step: ms, x: x });
      x += wdt + FIT.MELD_GAP;
    }
    if (row.length) rows.push(row);
    /* ★ 行ごとに まん中ぞろえ */
    for (i = 0; i < rows.length; i++) {
      var last = rows[i][rows[i].length - 1];
      var used = last.x + last.w;
      var off = Math.max(0, Math.floor((innerW - used) / 2));
      for (var j = 0; j < rows[i].length; j++) rows[i][j].x += off;
    }
    return rows;
  }
  function packTable(counts, innerW, innerH, twMax) {
    var STEPS = [FIT.STEP_RATE, 0.38, 0.32];
    var GAPS = [FIT.ROWGAP, 3, 0];
    var tw, th, si, gi, step, rows, need, last = null;
    for (tw = twMax; tw >= FIT.TBL_MIN; tw--) {
      th = cardH(tw);
      for (si = 0; si < STEPS.length; si++) {
        step = Math.max(FIT.STEP_MIN, Math.round(tw * STEPS[si]));
        rows = packRows(counts, innerW, tw, step);
        for (gi = 0; gi < GAPS.length; gi++) {
          need = rows.length * th + (rows.length - 1) * GAPS[gi];
          if (need <= innerH) {
            return { tw: tw, th: th, step: step, rowGap: GAPS[gi], rows: rows, h: need, tight: 0 };
          }
        }
        last = { tw: tw, th: th, step: step, rows: rows };
      }
    }
    /* ★ ここまで 来たら ―― ★★行を 重ねます（★上の 角は 残る ＝ 指は 届く）*/
    tw = FIT.TBL_MIN; th = cardH(tw);
    step = Math.max(6, Math.round(tw * 0.32));
    rows = packRows(counts, innerW, tw, step);
    var gap = rows.length > 1
      ? Math.floor((innerH - rows.length * th) / (rows.length - 1))
      : 0;
    gap = Math.max(-Math.round(th * 0.62), Math.min(0, gap));
    need = rows.length * th + (rows.length - 1) * gap;
    return { tw: tw, th: th, step: step, rowGap: gap, rows: rows, h: need, tight: 1 };
  }

  /* ============================================================
     ★ 待ち時間（★設計図 2026-08-24 裁定：★待ち時間は 遊びの 中身では ない。
        ★選ばせず、★速い側に 固定する）
     ★ ルル §7-2 の 係数と くらべられる ように、★秒の 中身を ここに 全部 出して います。
     ============================================================ */
  var TUNE = {
    DEAL_STEP:      30,
    BOT_THINK:     360,   /* ★ ロボットが 考える（★七並べ・ページワン・ハーツに そろえた 速い側）*/
    DRAW_MOVE:     220,   /* ★ 引いた 札が 手札へ */
    MELD_MOVE:     280,   /* ★ 組が 場へ */
    LAY_MOVE:      200,   /* ★ 付け札が 場へ */
    DISCARD_MOVE:  220,   /* ★ すて札へ */
    TURN_GAP:      160,   /* ★ 次の 人へ 移る まで */
    SAY_HOLD:     1700,
    RESULT_WAIT:   520,
    RESULT_LOCK:   550,
    DRAG_SLOP:       6    /* ★ ここまでは「押した」。★これを こえたら「運んで いる」*/
  };
  /* ★ 1回 配る あいだに 機械が 使う 時間【計算】（★人が 考える 時間は 0 と した とき）
     ★ ルルの【見立て】は 1回 57.7秒。★くらべる ための 数。 */
  function machineMs(turns) {
    turns = turns || 25.4;                       /* ★ ルル §7-1【計算】1回 25.4手番 */
    var bots = turns * 0.75;
    return bots * (TUNE.BOT_THINK + TUNE.DRAW_MOVE + TUNE.DISCARD_MOVE + TUNE.TURN_GAP) +
           turns * 0.25 * (TUNE.DRAW_MOVE + TUNE.DISCARD_MOVE + TUNE.TURN_GAP) +
           turns * 0.30 * TUNE.MELD_MOVE;
  }

  root.SEVENBRIDGE_CORE = {
    SUITS: SUITS, MARKS: MARKS, RANKS: RANKS, DECK_N: DECK_N,
    JOKER: JOKER, JOKER_NAME: JOKER_NAME, BACK_NAME: BACK_NAME,
    suitOf: suitOf, rankOf: rankOf, isJk: isJk, nameOf: nameOf, markOf: markOf, isRed: isRed,
    penOf: penOf, penFlat: penFlat, allNames: allNames,
    runFits: runFits, setFits: setFits, tableFits: tableFits, tablePut: tablePut,
    cloneTable: cloneTable, meldLen: meldLen,
    enumMelds: enumMelds, meldToTable: meldToTable, makeMeld: makeMeld,
    planPlay: planPlay, usefulness: usefulness,
    P: P, LEVELS: LEVELS, LEVEL_START: LEVEL_START, HUMANS: HUMANS,
    LIM: LIM, HAND_SIZE: HAND_SIZE, defaultRules: defaultRules,
    rng: rng, makeGame: makeGame, refill: refill,
    doDraw: doDraw, doMeld: doMeld, doLayoff: doLayoff, doDiscard: doDiscard, finishDeal: finishDeal,
    botDraw: botDraw, botPlan: botPlan, botPlay: botPlay, botDiscard: botDiscard,
    newMatch: newMatch, addDeal: addDeal,
    simDeal: simDeal, simMatch: simMatch, runMany: runMany, newStat: newStat, pct: pct,
    FIT: FIT, TUNE: TUNE, cardH: cardH, gapFor: gapFor, handPitch: handPitch,
    pickLayout: pickLayout, packRows: packRows, packTable: packTable, machineMs: machineMs
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.SEVENBRIDGE_CORE;

})(typeof globalThis !== 'undefined' ? globalThis : this);
