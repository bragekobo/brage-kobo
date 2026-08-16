/* ============================================================
   poker-core-test.js ― 役の判定エンジンの けんしょう
   ============================================================
   画面を 作る まえに、判定だけを たしかめる ための ファイル。
   ゲーム本体では 読みこまない（開発用）。

   つかい方：
     ・ブラウザ  … poker-core-test.html を ひらく（じどうで 走る）
                   コンソールで  PokerTest.run()  も できる
     ・Node      … node office/games/holdem/poker-core-test.js
   ============================================================ */
(function (global) {
  'use strict';

  var PC = global.PokerCore || (typeof require !== 'undefined' ? require('../poker-core.js') : null);
  if (!PC) throw new Error('poker-core.js が 読みこまれていません');

  /* ───────── ちいさな テストの 道具 ───────── */
  var pass = 0, fail = 0, lines = [], group = '';
  function G(name) { group = name; lines.push('── ' + name); }
  function ok(cond, label, extra) {
    if (cond) { pass++; }
    else { fail++; lines.push('  ✗ [' + group + '] ' + label + (extra ? '  → ' + extra : '')); }
  }
  function eq(actual, expected, label) {
    ok(actual === expected, label, 'expected=' + expected + ' actual=' + actual);
  }

  var C = PC.cards;
  var ev = PC.evaluate;
  function idOf(spec) { var r = ev(spec); return r ? r.id : null; }
  function keys(spec) { return ev(spec).usedKeys.join(' '); }

  /* ============================================================
     1. 役 10種類 すべて（5枚ちょうど）
     ============================================================ */
  function testCategories() {
    G('1. 役10種類の 見わけ（5枚）');
    eq(idOf('sA sK sQ sJ s10'), 'royalFlush', 'ロイヤルストレートフラッシュ');
    eq(idOf('h9 h8 h7 h6 h5'), 'straightFlush', 'ストレートフラッシュ');
    eq(idOf('c5 c4 c3 c2 cA'), 'straightFlush', 'ストレートフラッシュ（A2345）');
    eq(idOf('s7 h7 d7 c7 sK'), 'fourOfAKind', 'フォーカード');
    eq(idOf('s7 h7 d7 cK hK'), 'fullHouse', 'フルハウス');
    eq(idOf('sA sJ s8 s5 s2'), 'flush', 'フラッシュ');
    eq(idOf('s9 h8 d7 c6 s5'), 'straight', 'ストレート');
    eq(idOf('s7 h7 d7 cK h9'), 'threeOfAKind', 'スリーカード');
    eq(idOf('s7 h7 dK cK h9'), 'twoPair', 'ツーペア');
    eq(idOf('s7 h7 dK c9 h4'), 'onePair', 'ワンペア');
    eq(idOf('sA hJ d8 c5 h2'), 'highCard', 'ハイカード');

    /* 役の 定義配列（名前・説明・短い形）が 10個 そろっているか */
    eq(PC.HANDS.length, 10, '役の定義は 10個');
    eq(PC.LADDER_STEPS, 10, 'はしごは 10段');
    var allNamed = PC.HANDS.every(function (h) { return h.name && h.desc && h.short && h.rank >= 1 && h.rank <= 10; });
    ok(allNamed, 'すべての役に 名前・説明・短い形・段数が ある');
    var ranks = PC.HANDS.map(function (h) { return h.rank; }).sort(function (a, b) { return a - b; });
    ok(ranks.join(',') === '1,2,3,4,5,6,7,8,9,10', '段数が 1〜10 で かぶりなし');
    /* 判定が 返す id は かならず 定義に ある */
    ok(!!PC.HAND_BY_ID[idOf('s7 h7 d7 cK hK')], '返ってきた id が 定義表に ある');
  }

  /* ============================================================
     2. 同じ役どうしの 勝ち負け（T38 §3-4）
     ============================================================ */
  function testSameCategory() {
    G('2. 同じ役どうしの くらべ');
    function stronger(a, b, label) {
      ok(PC.compare(a, b) > 0, label + '（前が 強い）');
      ok(PC.compare(b, a) < 0, label + '（うら向きも 正しい）');
    }
    /* ワンペア：ペアが 同じで キッカー勝負 */
    stronger('s7 h7 dA c9 h4', 's7 h7 dK c9 h4', 'ワンペア：キッカー A > K');
    stronger('s7 h7 dA cQ h4', 's7 h7 dA cJ h4', 'ワンペア：2枚めの キッカー Q > J');
    stronger('s7 h7 dA cQ h5', 's7 h7 dA cQ h4', 'ワンペア：3枚めの キッカー 5 > 4');
    stronger('s8 h8 dA cQ h4', 's7 h7 dA cQ h5', 'ワンペア：ペアの数 8 > 7');
    /* ツーペア：上・下・のこり1枚 */
    stronger('sK hK d3 c3 h9', 'sQ hQ dJ cJ h9', 'ツーペア：上の ペア K > Q');
    stronger('sK hK d5 c5 h9', 'sK hK d3 c3 hA', 'ツーペア：下の ペア 5 > 3');
    stronger('sK hK d5 c5 hA', 'sK hK d5 c5 h9', 'ツーペア：のこり1枚 A > 9');
    /* フルハウス：3枚がわ が さき */
    stronger('s9 h9 d9 cA hA', 's8 h8 d8 cA hA', 'フルハウス：3枚がわ 9 > 8');
    stronger('s9 h9 d9 cA hA', 's9 h9 d9 cK hK', 'フルハウス：2枚がわ A > K');
    /* フォーカード */
    stronger('s9 h9 d9 c9 hA', 's8 h8 d8 c8 hA', 'フォーカード：4枚の数 9 > 8');
    stronger('s9 h9 d9 c9 hA', 's9 h9 d9 c9 hK', 'フォーカード：のこり1枚 A > K');
    /* フラッシュ：1枚ずつ 上から */
    stronger('sA sJ s8 s5 s2', 'sK sQ sJ s9 s7', 'フラッシュ：1枚め A > K');
    stronger('sA sQ s8 s5 s2', 'sA sJ s9 s7 s6', 'フラッシュ：2枚め Q > J');
    stronger('sA sQ s9 s5 s2', 'sA sQ s8 s7 s6', 'フラッシュ：3枚め 9 > 8');
    stronger('sA sQ s9 s7 s2', 'sA sQ s9 s6 s5', 'フラッシュ：4枚め 7 > 6');
    stronger('sA sQ s9 s7 s3', 'sA sQ s9 s7 s2', 'フラッシュ：5枚め 3 > 2');
    /* ストレート：てっぺんだけ */
    stronger('sA hK dQ cJ h10', 'sK hQ dJ c10 h9', 'ストレート：てっぺん A > K');
    /* スリーカード */
    stronger('s9 h9 d9 cA h4', 's9 h9 d9 cK h4', 'スリーカード：キッカー A > K');
    /* ハイカード */
    stronger('sA hJ d8 c5 h3', 'sA hJ d8 c5 h2', 'ハイカード：5枚めで 決まる');
    /* 役の 上下（10段の ならび） */
    var order = ['sA sK sQ sJ s10', 'h9 h8 h7 h6 h5', 's7 h7 d7 c7 sK', 's7 h7 d7 cK hK',
                 'sA sJ s8 s5 s2', 's9 h8 d7 c6 s5', 's7 h7 d7 cK h9', 's7 h7 dK cK h9',
                 's7 h7 dK c9 h4', 'sA hJ d8 c5 h2'];
    for (var i = 0; i + 1 < order.length; i++) {
      ok(PC.compare(order[i], order[i + 1]) > 0, '10段の ならび ' + (i + 1) + ' > ' + (i + 2));
    }
  }

  /* ============================================================
     3. A の 両はし（T38 §3-3）
     ============================================================ */
  function testAce() {
    G('3. A は 上にも 下にも なれる');
    var top = ev('sA hK dQ cJ h10');
    eq(top.id, 'straight', 'A K Q J 10 は ストレート');
    eq(top.score[1], 14, 'てっぺんは A（14）');
    eq(top.aceLow, false, 'これは Aを1として つかっていない');

    var wheel = ev('sA h2 d3 c4 h5');
    eq(wheel.id, 'straight', 'A 2 3 4 5 は ストレート');
    eq(wheel.score[1], 5, 'てっぺんは 5');
    eq(wheel.aceLow, true, 'Aを1として つかった しるしが 立つ');
    eq(wheel.best.map(function (c) { return c.rank; }).join(''), '5432A', 'ならびは 5 4 3 2 A');

    ok(PC.compare('sA hK dQ cJ h10', 'sA h2 d3 c4 h5') > 0, 'A K Q J 10 のほうが 強い');
    ok(PC.compare('s6 h5 d4 c3 h2', 'sA h2 d3 c4 h5') > 0, '6 5 4 3 2 のほうが A2345 より 強い');

    /* 輪には しない */
    eq(idOf('sQ hK dA c2 h3'), 'highCard', 'Q K A 2 3 は ストレートでは ない');
    eq(idOf('sJ hQ dK cA h2'), 'highCard', 'J Q K A 2 も ストレートでは ない');

    /* ストレートフラッシュ も 同じ */
    var sfLow = ev('c5 c4 c3 c2 cA');
    eq(sfLow.id, 'straightFlush', 'A2345 の 同じマークは ストレートフラッシュ');
    eq(sfLow.score[1], 5, 'てっぺんは 5');
    ok(PC.compare('sA sK sQ sJ s10', 'c5 c4 c3 c2 cA') > 0, 'ロイヤル > いちばん弱い ストレートフラッシュ');
  }

  /* ============================================================
     4. 引き分け
     ============================================================ */
  function testTies() {
    G('4. 引き分け');
    eq(PC.compare('sA sK sQ sJ s10', 'hA hK hQ hJ h10'), 0, 'ロイヤルどうしは かならず 引き分け');
    eq(PC.compare('s9 h8 d7 c6 s5', 'h9 d8 c7 s6 h5'), 0, 'マークちがいの 同じ ストレート');
    eq(PC.compare('s7 h7 dK cK h9', 'd7 c7 sK hK d9'), 0, '同じ ツーペア');
    eq(PC.compare('sA hJ d8 c5 h2', 'hA dJ c8 s5 d2'), 0, '同じ ハイカード');
    eq(PC.decidingIndex('sA sK sQ sJ s10', 'hA hK hQ hJ h10'), -1, '引き分けに 決め手は ない');

    /* 場の5枚が そのまま 役（§6-2）＝ 手札が ちがっても 引き分け */
    var board = 's10 sJ sQ sK sA';
    var a = ev(board + ' h2 d3');
    var b = ev(board + ' c7 c8');
    eq(PC.compare(a, b), 0, '場だけの役は みんな 同じ（引き分け）');
    eq(PC.uses(a, C('h2 d3')), false, '自分の 手札は 1枚も つかわれていない');

    /* 分けあう 人数の かぞえ方（rankHands） */
    var r = PC.rankHands([
      { id: 'you', cards: C(board + ' h2 d3') },
      { id: 'r1', cards: C(board + ' c7 c8') },
      { id: 'r2', cards: C(board + ' d4 d6') }
    ]);
    eq(r.filter(function (x) { return x.win; }).length, 3, '3人で 分ける');
    eq(r.every(function (x) { return x.place === 1; }), true, 'ぜんいん 1位');
  }

  /* ============================================================
     5. 7枚から いちばん強い 5枚を えらべているか
     ============================================================ */
  function testSevenPick() {
    G('5. 7枚から 5枚（わざと 2通り 以上 できる 手）');

    /* フラッシュ（♠が5枚）も ストレート（5〜9）も できる → フラッシュを とる */
    var r1 = ev('s9 s8 s7 s6 s3 h5 d5');
    eq(r1.id, 'flush', 'ストレートより フラッシュを えらぶ');
    eq(r1.best.map(function (c) { return c.rank; }).join(' '), '9 8 7 6 3', 'えらんだのは ♠の5枚');

    /* フルハウスも フラッシュも できる → フルハウス */
    var r2 = ev('s7 h7 d7 sK sQ s2 hK');
    eq(r2.id, 'fullHouse', 'フラッシュより フルハウスを えらぶ');

    /* 6枚 フラッシュ → 強いほう 5枚だけ つかう（T38 §3-6） */
    var r3 = ev('sA sK s9 s7 s5 s3 h2');
    eq(r3.id, 'flush', '6枚 同じマーク → フラッシュ');
    eq(r3.best.length, 5, 'つかうのは ちょうど 5枚');
    eq(r3.best.map(function (c) { return c.rank; }).join(' '), 'A K 9 7 5', '弱い 3 は はずす');
    eq(r3.unused.length, 2, 'つかわない札は 2枚');

    /* ツーペアが 3組 → 上の 2組＋いちばん強い のこり1枚 */
    var r4 = ev('sA hA dK cK s5 h5 c9');
    eq(r4.id, 'twoPair', '3組 あっても ツーペア');
    eq(r4.score[1], 14, '上の ペアは A');
    eq(r4.score[2], 13, '下の ペアは K');
    eq(r4.score[3], 9, 'のこり1枚は 9（5では ない）');

    /* ストレートフラッシュと フォーカードが 同時 → ストレートフラッシュ */
    var r5 = ev('s5 s6 s7 s8 s9 h9 d9');
    eq(r5.id, 'straightFlush', 'スリーカードより ストレートフラッシュ');

    /* 7枚に ストレートが 2本 → 高いほう */
    var r6 = ev('s5 h6 d7 c8 s9 h10 dJ');
    eq(r6.id, 'straight', 'ストレート');
    eq(r6.score[1], 11, 'てっぺんは J（7〜J）');

    /* 手札を 1枚も つかわない ケース（§6-2） */
    var hole = C('h2 d3');
    var r7 = ev(C('s10 sJ sQ sK sA').concat(hole));
    eq(r7.id, 'royalFlush', '場の5枚だけで ロイヤル');
    eq(PC.uses(r7, hole), false, '手札は つかわれていない');
    eq(r7.unusedKeys.length, 2, 'うすくする札は 2枚');

    /* 手札が 1枚だけ つかわれる */
    var hole2 = C('sA h4');
    var r8 = ev(C('s10 sJ sQ sK h7').concat(hole2));
    eq(r8.id, 'royalFlush', '手札の ♠A で ロイヤル');
    eq(PC.uses(r8, [hole2[0]]), true, '♠A は つかわれている');
    eq(PC.uses(r8, [hole2[1]]), false, '♥4 は つかわれていない');

    /* つかった5枚は 必ず 入力の 中に ある */
    var input = C('s9 s8 s7 s6 s3 h5 d5');
    var r9 = ev(input);
    var inKeys = input.map(function (c) { return c.key; });
    ok(r9.best.every(function (c) { return inKeys.indexOf(c.key) >= 0; }), 'つかった5枚は ぜんぶ 手もとの札');
    eq(r9.best.length + r9.unused.length, 7, '5枚 ＋ のこり2枚 ＝ 7枚');
  }

  /* ============================================================
     6. 5枚だけ（ドローポーカー用）でも 同じ 関数が うごく
     ============================================================ */
  function testFiveCardMode() {
    G('6. 5枚でも 同じ関数');
    var r = ev('s7 h7 d7 cK hK');
    eq(r.id, 'fullHouse', '5枚で フルハウス');
    eq(r.best.length, 5, 'つかうのは 5枚');
    eq(r.unused.length, 0, 'あまりは 0枚');
    eq(ev('s7 h7 d7 cK'), null, '4枚では 役を 出さない（null）');
    eq(ev([]), null, '0枚も null');
    /* 6枚（ドローの とちゅうなど）でも うごく */
    var r6 = ev('s7 h7 d7 cK hK s2');
    eq(r6.id, 'fullHouse', '6枚でも フルハウス');
    eq(r6.unused.length, 1, 'あまりは 1枚');
  }

  /* ============================================================
     7. 決め手の カード（§6-6 の 矢印）
     ============================================================ */
  function testDecider() {
    G('7. 決め手の カード');
    var a = ev('s7 h7 d7 cK hK');            // フルハウス 7-K
    var b = ev('s7 h7 d7 c9 h9');            // フルハウス 7-9
    eq(PC.decidingIndex(a, b), 3, 'フルハウス：2枚がわ（4枚め）で 決まる');
    eq(a.best[3].rank, 'K', '4枚めは K');

    var c1 = ev('s7 h7 dA c9 h4');
    var c2 = ev('s7 h7 dK c9 h4');
    eq(PC.decidingIndex(c1, c2), 2, 'ワンペア：3枚め（1つめの キッカー）');

    var d1 = ev('sK hK d5 c5 hA');
    var d2 = ev('sK hK d5 c5 h9');
    eq(PC.decidingIndex(d1, d2), 4, 'ツーペア：5枚め（のこり1枚）');

    var e1 = ev('sA sQ s9 s7 s3');
    var e2 = ev('sA sQ s9 s7 s2');
    eq(PC.decidingIndex(e1, e2), 4, 'フラッシュ：5枚め');

    eq(PC.decidingIndex(ev('s7 h7 d7 c7 hK'), ev('s7 h7 d7 cK hK')), -1, '役が ちがえば 矢印なし');

    /* 決め手の 番号が さす カードは、ほんとうに ちがう */
    var i1 = PC.decidingIndex(c1, c2);
    ok(c1.best[i1].value !== c2.best[i1].value, 'さした カードは 実さいに ちがう');
  }

  /* ============================================================
     8. くらべ方の つじつま（ランダム）
     ============================================================ */
  function testCompareConsistency(n) {
    G('8. くらべ方の つじつま（' + n + '組）');
    var bad = 0, badTie = 0;
    for (var t = 0; t < n; t++) {
      var deck = PC.shuffle(PC.createDeck());
      var A = ev(deck.slice(0, 7)), B = ev(deck.slice(7, 14));
      var ab = PC.compare(A, B), ba = PC.compare(B, A);
      if (ab !== -ba) bad++;
      if (ab === 0 && A.rank !== B.rank) badTie++;
    }
    eq(bad, 0, 'compare(a,b) と compare(b,a) が 逆に なる');
    eq(badTie, 0, '引き分けなのに 役が ちがう');
  }

  /* ============================================================
     9. 7枚の えらび方を べつの やり方で 検算
        （テストがわで 21通りを 数えなおし、それより 強い ものが 無いか 見る）
     ============================================================ */
  function testSevenBrute(n) {
    G('9. 7枚 → 5枚の 検算（' + n + '手）');
    var mismatch = 0, notSubset = 0, wrongCount = 0;
    var idx = [];
    for (var a = 0; a < 7; a++) for (var b = a + 1; b < 7; b++) for (var c = b + 1; c < 7; c++)
      for (var d = c + 1; d < 7; d++) for (var e = d + 1; e < 7; e++) idx.push([a, b, c, d, e]);

    for (var t = 0; t < n; t++) {
      var deck = PC.shuffle(PC.createDeck());
      var seven = deck.slice(0, 7);
      var got = ev(seven);
      /* テストがわで 21通りを 総なめ */
      var top = null;
      for (var i = 0; i < idx.length; i++) {
        var ix = idx[i];
        var r = PC.evalFive([seven[ix[0]], seven[ix[1]], seven[ix[2]], seven[ix[3]], seven[ix[4]]]);
        if (!top || PC.compareScore(r.score, top.score) > 0) top = r;
      }
      if (PC.compareScore(got.score, top.score) !== 0) mismatch++;
      if (got.best.length !== 5 || got.unused.length !== 2) wrongCount++;
      var ks = seven.map(function (x) { return x.key; });
      if (!got.best.every(function (x) { return ks.indexOf(x.key) >= 0; })) notSubset++;
    }
    eq(mismatch, 0, '21通りの 総なめと 強さが ちがう');
    eq(wrongCount, 0, '5枚＋2枚に なっていない');
    eq(notSubset, 0, 'つかった札が 手もとに ない');
  }

  /* ============================================================
     10. 総当たり：52枚から 5枚の ぜんぶ（2,598,960通り）
         → 役の 出る 回数が 数学の 答えと 1つも ちがわないか
     ============================================================ */
  var EXPECTED_CENSUS = {
    royalFlush: 4, straightFlush: 36, fourOfAKind: 624, fullHouse: 3744, flush: 5108,
    straight: 10200, threeOfAKind: 54912, twoPair: 123552, onePair: 1098240, highCard: 1302540
  };
  function testCensus() {
    G('10. 総当たり C(52,5) ＝ 2,598,960通り');
    var deck = PC.createDeck();
    var count = {}, total = 0, aceLowCount = 0;
    PC.HANDS.forEach(function (h) { count[h.id] = 0; });
    var five = [null, null, null, null, null];
    for (var a = 0; a < 48; a++) {
      five[0] = deck[a];
      for (var b = a + 1; b < 49; b++) {
        five[1] = deck[b];
        for (var c = b + 1; c < 50; c++) {
          five[2] = deck[c];
          for (var d = c + 1; d < 51; d++) {
            five[3] = deck[d];
            for (var e = d + 1; e < 52; e++) {
              five[4] = deck[e];
              var r = PC.evalFive(five);
              count[r.id]++; total++;
              if (r.aceLow) aceLowCount++;
            }
          }
        }
      }
    }
    eq(total, 2598960, '数えた 手の 数');
    Object.keys(EXPECTED_CENSUS).forEach(function (id) {
      eq(count[id], EXPECTED_CENSUS[id], id + ' の 出る 回数');
    });
    /* A を 1として つかう ストレートは 1024通り（うち 4つが ストレートフラッシュ） */
    eq(aceLowCount, 1024, 'A2345 の かたちは 1024通り');
    return count;
  }

  /* ============================================================
     11. 何にでも なれるカード（ドローポーカーの したじ・T38 §12-4）
     ============================================================ */
  function testWild() {
    G('11. 何にでも なれるカード（ホールデムでは つかわない）');
    eq(idOf('sA sK sQ sJ W'), 'royalFlush', 'W が ♠10 に なって ロイヤル');
    eq(idOf('s7 h7 d7 c7 W'), 'fiveOfAKind', 'W で ファイブカード');
    eq(idOf('s7 h7 d7 cK W'), 'fourOfAKind', 'W で フォーカード');
    eq(idOf('s2 h5 d9 cJ W'), 'onePair', 'W は いちばん 得な ペアに なる');
    var r = ev('sA sK sQ sJ W');
    eq(r.best.length, 5, 'つかうのは 5枚');
    ok(r.usedKeys.indexOf('joker-1') >= 0, 'ハイライトは ジョーカーの 場所の まま');
    eq(PC.HAND_FIVE_OF_A_KIND.rank, 11, 'ファイブカードは 11段め（役の配列に 1行 足すだけ）');
    eq(PC.HANDS.length, 10, 'ホールデムの はしごは 10段の まま');
  }

  /* ============================================================
     12. カードの 土台（デッキ・シャッフル・くばる）
     ============================================================ */
  function testDeck() {
    G('12. カードの 土台');
    var deck = PC.createDeck();
    eq(deck.length, 52, '52枚ちょうど');
    eq(deck.filter(function (c) { return c.wild; }).length, 0, 'ジョーカーは 入れない');
    var uniq = {};
    deck.forEach(function (c) { uniq[c.key] = 1; });
    eq(Object.keys(uniq).length, 52, 'かぶりが ない');
    eq(deck.filter(function (c) { return c.suit === 'clubs' && c.rank === 'A'; })[0].file, 'クローバーA',
       '画像の ファイル名は クローバー（設計図 §9）');
    eq(PC.createDeck({ jokers: 2 }).length, 54, 'ジョーカー2枚も 作れる');

    /* まぜても 中身は かわらない */
    var mixed = PC.shuffle(PC.createDeck());
    var mk = {}; mixed.forEach(function (c) { mk[c.key] = 1; });
    eq(Object.keys(mk).length, 52, 'まぜても 52枚');

    /* くばると 山が へる */
    var d2 = PC.createDeck();
    var hand = PC.draw(d2, 2);
    eq(hand.length, 2, '2枚 くばれた');
    eq(d2.length, 50, '山は 50枚に へった');

    /* まぜ方に かたよりが ないか（1枚めに 出た マークの ばらつき） */
    var tally = {};
    for (var i = 0; i < 4000; i++) {
      var top = PC.shuffle(PC.createDeck())[0];
      tally[top.suit] = (tally[top.suit] || 0) + 1;
    }
    var okSpread = PC.SUITS.every(function (s) { return tally[s.id] > 700 && tally[s.id] < 1300; });
    ok(okSpread, 'シャッフルに 大きな かたよりが ない', JSON.stringify(tally));

    /* カードの 書きかた */
    eq(PC.card('s10').key, 'spades-10', "'s10' が 読める");
    eq(PC.card('sT').key, 'spades-10', "'sT' も 10");
    eq(PC.card('♥Q').key, 'hearts-Q', '記号でも 読める');
    eq(PC.cards('sA hK dQ').length, 3, 'まとめて 読める');
    eq(PC.card('zZ'), null, 'まちがった 書き方は null');
    eq(PC.rankLabel(14), 'A', '14 は A');
    eq(PC.rankLabel(10), '10', '10 は 10');
  }

  /* ============================================================
     おまけ：ポットの 分け方（buildPots / settle）
     ------------------------------------------------------------
     ⚠️ これは **いつもの 163項目には 入れていません**。
        163項目は「役の 判定」の けんしょうで、数を 動かさない ため。
        走らせ方： PokerTest.pots()   ／ PokerTest.run({ pots:true })
     ============================================================ */
  function testPots() {
    G('P. ポットの 分け方（サイドポット・引き分け）');

    /* 道具：出した合計と もらった合計が 必ず 同じか（コインの 命） */
    function conserved(res, label) {
      var got = 0, put = 0;
      Object.keys(res.payouts).forEach(function (k) { got += res.payouts[k]; });
      res.entries.forEach(function (e) { put += e.put; });
      res.refunds.forEach(function (r) { put += r.amount; });
      eq(got, put, label + '：出した合計 ＝ もらった合計');
      return got;
    }

    /* ── ふつうに 1人が 勝つ ── */
    var r1 = PC.settle({
      players: [
        { id: 'A', put: 30, hand: ev('s7 h7 d7 cK hK') },   // フルハウス
        { id: 'B', put: 30, hand: ev('sA sJ s8 s5 s2') },   // フラッシュ
        { id: 'C', put: 30, folded: true }
      ],
      order: ['A', 'B', 'C']
    });
    eq(r1.pots.length, 1, 'ポットは 1つ');
    eq(r1.pots[0].amount, 90, 'ポットは 90');
    eq(r1.payouts.A, 90, '強いほうが ぜんぶ もらう');
    eq(r1.payouts.B, 0, '負けたほうは 0');
    conserved(r1, 'ふつうの 決着');

    /* ── 引き分けの 山分け（割り切れる） ── */
    var r2 = PC.settle({
      players: [
        { id: 'A', put: 30, hand: ev('s7 h7 d7 cK hK') },
        { id: 'B', put: 30, hand: ev('c7 d7 h7 dK sK') }    // まったく 同じ強さ
      ],
      order: ['A', 'B']
    });
    eq(r2.pots[0].winners.length, 2, '引き分けは 2人が 勝ち');
    eq(r2.payouts.A, 30, '山分け A');
    eq(r2.payouts.B, 30, '山分け B');
    conserved(r2, '引き分け（割り切れる）');

    /* ── ★ 引き分けの 端数（割り切れない 1枚は order の 順に 1枚ずつ）── */
    var r3 = PC.settle({
      players: [
        { id: 'A', put: 7, hand: ev('s7 h7 d7 cK hK') },
        { id: 'B', put: 7, hand: ev('c7 d7 h7 dK sK') },
        { id: 'C', put: 7, folded: true }
      ],
      order: ['B', 'A']                       // 親の 左どなりが B の つもり
    });
    eq(r3.pots[0].amount, 21, '端数テスト：ポットは 21');
    eq(r3.payouts.B, 11, '端数の 1枚は order の さきの人（B）へ');
    eq(r3.payouts.A, 10, 'もう一方は 10');
    eq(r3.pots[0].odd.length, 1, '端数は 1枚だけ');
    eq(r3.pots[0].odd[0], 'B', '端数の 行き先が order どおり');
    conserved(r3, '引き分け（端数あり）');

    /* 3人 引き分けで 2枚 あまる ときは、order の 先頭2人へ 1枚ずつ
       （ポット 32 ＝ 生きている3人が 10ずつ ＋ 降りた人の 2）*/
    var r4 = PC.settle({
      players: [
        { id: 'A', put: 10, hand: ev('sA sK sQ sJ s10') },
        { id: 'B', put: 10, hand: ev('hA hK hQ hJ h10') },
        { id: 'C', put: 10, hand: ev('dA dK dQ dJ d10') },
        { id: 'D', put:  2, folded: true }
      ],
      order: ['C', 'A', 'B', 'D']
    });
    eq(r4.pots[0].amount, 32, '端数2枚テスト：ポットは 32');
    eq(r4.payouts.C, 11, '端数2枚：order 1番め（C）');
    eq(r4.payouts.A, 11, '端数2枚：order 2番め（A）');
    eq(r4.payouts.B, 10, '端数2枚：3番めは もらえない');
    conserved(r4, '引き分け（端数2枚）');

    /* ── ★ サイドポット：コインが 足りない人が ぜんぶかけた ── */
    /* A は 20しか 出せない。B・C は 100ずつ。A が いちばん強い。
       A がもらえるのは 20×3＝60 まで。のこり 160 は B と C の 勝負。 */
    var r5 = PC.settle({
      players: [
        { id: 'A', put:  20, hand: ev('sA sK sQ sJ s10') }, // ロイヤル（最強）
        { id: 'B', put: 100, hand: ev('hA hJ h8 h5 h2') },  // フラッシュ
        { id: 'C', put: 100, hand: ev('d9 c8 d7 c6 d5') }   // ストレート
      ],
      order: ['A', 'B', 'C']
    });
    eq(r5.pots.length, 2, 'ポットは 2つに 分かれる');
    eq(r5.pots[0].amount, 60, '本ポットは 60（20×3）');
    eq(r5.pots[1].amount, 160, 'サイドポットは 160');
    eq(r5.pots[0].eligible.length, 3, '本ポットは 3人で 争う');
    eq(r5.pots[1].eligible.length, 2, 'サイドポットは 2人で 争う');
    eq(r5.payouts.A, 60, 'A は 60まで しか もらえない（いちばん強くても）');
    eq(r5.payouts.B, 160, 'のこり 160 は B');
    eq(r5.payouts.C, 0, 'C は 0');
    eq(r5.caps.A, 60, 'caps：A は 60まで');
    eq(r5.caps.B, 220, 'caps：B は 220まで');
    conserved(r5, 'サイドポット');

    /* ── サイドポットが 3段に なる（20 / 60 / 100）── */
    var r6 = PC.settle({
      players: [
        { id: 'A', put:  20, hand: ev('s2 h3 d4 c5 h7') },  // ハイカード
        { id: 'B', put:  60, hand: ev('s7 h7 d2 c5 h9') },  // ワンペア
        { id: 'C', put: 100, hand: ev('sK hK dK c5 h9') },  // スリーカード
        { id: 'D', put: 100, hand: ev('s8 h8 d8 c8 h9') }   // フォーカード
      ],
      order: ['A', 'B', 'C', 'D']
    });
    eq(r6.pots.length, 3, 'ポットは 3段');
    eq(r6.pots[0].amount, 80,  '1段め 20×4＝80');
    eq(r6.pots[1].amount, 120, '2段め 40×3＝120');
    eq(r6.pots[2].amount, 80,  '3段め 40×2＝80');
    eq(r6.payouts.D, 280, 'いちばん強い D が 3つとも とる');
    conserved(r6, 'サイドポット3段');

    /* ── 降りた人の コインは 下の ポットから 入る ── */
    var r7 = PC.settle({
      players: [
        { id: 'A', put: 10, folded: true },                 // 降りた
        { id: 'B', put: 50, hand: ev('s7 h7 d2 c5 h9') },
        { id: 'C', put: 50, hand: ev('sK hK d2 c5 h9') }
      ],
      order: ['A', 'B', 'C']
    });
    eq(r7.pots.length, 1, '降りた人の ぶんも 同じ ポットに 入る');
    eq(r7.pots[0].amount, 110, 'ポットは 110');
    eq(r7.payouts.C, 110, '強いほうが ぜんぶ');
    conserved(r7, '降りた人の コイン');

    /* ── ★ 出しすぎた ぶんは 返す（だれも 合わせられなかった）── */
    var r8 = PC.settle({
      players: [
        { id: 'A', put: 100, hand: ev('s2 h3 d4 c5 h7') },  // 弱いが 100 出した
        { id: 'B', put:  20, hand: ev('sK hK d2 c5 h9') },  // 20しか 出せなかった
        { id: 'C', put:  20, folded: true }
      ],
      order: ['A', 'B', 'C']
    });
    eq(r8.refunds.length, 1, '返す ぶんが 1件');
    eq(r8.refunds[0].id, 'A', '返す 先は A');
    eq(r8.refunds[0].amount, 80, '返す 額は 80（100−20）');
    eq(r8.pots[0].amount, 60, 'のこりの ポットは 60');
    eq(r8.payouts.B, 60, 'B が 60 もらう');
    eq(r8.payouts.A, 80, 'A は 出しすぎた 80 が もどるだけ');
    conserved(r8, '出しすぎの 返し');

    /* ── サイドポットで 引き分けが おきる ── */
    var r9 = PC.settle({
      players: [
        { id: 'A', put: 15, hand: ev('s2 h3 d4 c5 h7') },
        { id: 'B', put: 15, hand: ev('sK hK d2 c5 h9') },
        { id: 'C', put: 15, hand: ev('cK dK h2 s5 d9') }    // B と 同じ強さ
      ],
      order: ['C', 'A', 'B']
    });
    eq(r9.pots[0].winners.length, 2, 'サイドポットなしで 引き分け 2人');
    eq(r9.payouts.C, 23, '端数の 1枚は order の さき（C）');
    eq(r9.payouts.B, 22, 'もう一方は 22');
    conserved(r9, 'ポットの 引き分け');

    /* ── buildPots だけを 直に つかう（ドローポーカー用の 入口）── */
    var b = PC.buildPots([
      { id: 'x', put: 5 }, { id: 'y', put: 5 }, { id: 'z', put: 5 }
    ]);
    eq(b.pots.length, 1, 'buildPots：ポット1つ');
    eq(b.pots[0].amount, 15, 'buildPots：15');
    eq(b.refunds.length, 0, 'buildPots：返しなし');

    /* ── でたらめに 1500回 まわして、コインが 1枚も 消えない／増えない ── */
    var bad = 0, sideSeen = 0, splitSeen = 0, oddSeen = 0;
    for (var t = 0; t < 1500; t++) {
      var n = 2 + Math.floor(Math.random() * 3);      // 2〜4人
      var deck = PC.shuffle(PC.createDeck());
      var board = deck.splice(0, 5);
      var ps = [], sumPut = 0;
      for (var i = 0; i < n; i++) {
        var put = Math.floor(Math.random() * 60);
        var folded = Math.random() < 0.3;
        sumPut += put;
        ps.push({ id: 'p' + i, put: put, folded: folded,
                  hand: folded ? null : ev(deck.splice(0, 2).concat(board)) });
      }
      var res = PC.settle({ players: ps, order: ps.map(function (p) { return p.id; }) });
      var got = 0;
      Object.keys(res.payouts).forEach(function (k) { got += res.payouts[k]; });
      if (got !== sumPut) bad++;
      if (res.pots.length > 1) sideSeen++;
      res.pots.forEach(function (p) {
        if (p.winners.length > 1) splitSeen++;
        if (p.odd.length) oddSeen++;
      });
    }
    eq(bad, 0, 'でたらめ 1500回：コインが 1枚も 消えない／増えない');
    ok(sideSeen > 0, 'でたらめ 1500回：サイドポットが 起きている', 'sideSeen=' + sideSeen);
    ok(splitSeen > 0, 'でたらめ 1500回：引き分けが 起きている', 'splitSeen=' + splitSeen);
  }

  /* ============================================================
     まとめて 走らせる
     ============================================================ */
  function run(opts) {
    opts = opts || {};
    var heavy = opts.heavy !== false;      // 総当たりを やるか
    pass = 0; fail = 0; lines = [];
    var t0 = Date.now();

    testDeck();
    testCategories();
    testSameCategory();
    testAce();
    testTies();
    testSevenPick();
    testFiveCardMode();
    testDecider();
    testWild();
    testCompareConsistency(opts.compareRuns || 3000);
    testSevenBrute(opts.bruteRuns || 3000);
    if (heavy) testCensus();
    /* ポットの 分け方は 別あつかい（163項目の 数を 動かさない ため）*/
    if (opts.pots) testPots();

    var ms = Date.now() - t0;
    var head = (fail === 0 ? '✅ ぜんぶ 通りました' : '❌ ' + fail + '件 だめでした')
      + '  ―  ' + pass + '/' + (pass + fail) + ' 件 OK  (' + ms + 'ms)';
    var body = head + '\n' + lines.join('\n');
    if (typeof console !== 'undefined') {
      console.log(body);
      if (fail) console.error('テストに 失敗が あります：' + fail + '件');
    }
    return { pass: pass, fail: fail, ms: ms, text: body };
  }

  var PokerTest = {
    run: run,
    census: testCensus,
    quick: function () { return run({ heavy: false }); },
    /* ポットの 分け方だけを たしかめる（163項目とは 別）*/
    pots: function () {
      pass = 0; fail = 0; lines = [];
      var t0 = Date.now();
      testPots();
      var ms = Date.now() - t0;
      var head = (fail === 0 ? '✅ ポットの 分け方 ぜんぶ 通りました' : '❌ ' + fail + '件 だめでした')
        + '  ―  ' + pass + '/' + (pass + fail) + ' 件 OK  (' + ms + 'ms)';
      var body = head + '\n' + lines.join('\n');
      if (typeof console !== 'undefined') console.log(body);
      return { pass: pass, fail: fail, ms: ms, text: body };
    },
    ev: ev, C: C
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = PokerTest;
  if (global) global.PokerTest = PokerTest;

  /* Node で 直に よばれたら その場で 走らせる */
  if (typeof module !== 'undefined' && require.main === module) {
    var res = run();
    if (typeof process !== 'undefined') process.exit(res.fail ? 1 : 0);
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
