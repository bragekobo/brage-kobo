/* =====================================================================
   hanafuda-core.js ― 花札（こいこい）の 判定部品 ／ T351・コーダ
   ---------------------------------------------------------------------
   仕様の 正：設計図 追記⑮「こいこい の 形」「仕様書と 画面案の 決め」
             ＋ logs/T349_花札こいこい仕様書_ルル.md（§2 役と 点・§3 危ない所）

   ★ このファイルは 画面を 1つも 知らない。
       ・DOM に さわらない
       ・画面の 文は 組み立てない（役の 名前・点は データとして 返すだけ）
   ★ Node からも ブラウザからも 同じ 1本を 読む（遊ぶ 側と 数える 道具が 同じ コード）。
     外部ライブラリ 0・通信 0。

   ■ 札（48枚）の 番号：id ＝（月−1）×4 ＋ その月の 何枚目（0〜3）
       並びは 絵の ファイル（Alt版）と 1対1。光5・タネ9・短冊10・カス24。

   ■ この ファイルが 守っている 決まり（社長の お決め・追記⑮②）
     ・光の 役は 1つだけ：五光10／四光8（雨なし）／雨四光7（雨を ふくむ 4枚）／三光5（雨なし 3枚。雨＋2枚は 役なし）
     ・花見で一杯5（桜に幕＋菊に盃）・月見で一杯5（芒に月＋菊に盃）。雨で 流れない
     ・猪鹿蝶5・赤短5・青短5 ―― ★加点 なし（札が ふえても 5点の まま）
     ・タネ5枚で1点（1枚ごとに＋1）・タン5枚で1点・カス10枚で1点
     ・★菊に盃は タネにも カスにも 数える（任天堂どおり）
     ・ほかの 役は 重ねて 足す（赤短＋青短＝10点。別の 役は 作らない）
     ・もらう 点：役の 点を 足す → 7点 以上なら ×2 → 相手が こいこい中なら ×2（最大 ×4）
     ・こいこいの 後に 勝負できるのは「最後に こいこいと 言った ときの 役の 点」より 点が ふえた とき（倍の 前の 点で くらべる）
     ・手札が 0枚で 役が できたら 自動で 勝負（こいこいは 言えない）
     ・手役：配られた 手札に 同じ月 4枚（手四）／同じ月 2枚×4組（くっつき）＝ 6点
     ・場の 取り方：同じ月が 0枚 → 置く／1枚 → 2枚とも 取る／2枚 → どちらか 選ぶ／3枚 → 4枚 ぜんぶ 取る

   ■ 使い方（抜粋）
     HanaCore.judge([8, 32])              // { total:5, yaku:[{ key:'hanami', name:'花見で一杯', pts:5, cards:[8,32] }] }
     HanaCore.pay(10, true)                // { raw:10, x7:true, xKoi:true, mult:4, pts:40 }
     HanaCore.improved(5, 6)               // true（こいこいの 後、また 勝負できる）
     HanaCore.captureOptions(card, field)  // { kind:'take'|'choose'|'all'|'place', cands:[…] }
   ===================================================================== */
(function (global) {
  'use strict';

  /* ── 札の 表（★ここ 1か所だけ ―― 判定も 絵も 月の 数字も ここから 読む）── */
  var EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var FLOWER = ['松', '梅', '桜', '藤', '菖蒲', '牡丹', '萩', '芒', '菊', '紅葉', '柳', '桐'];
  /* [ファイルの 後ろ, 種類, 名前] ×4（★月ごと）*/
  var LAYOUT = [
    [['Hikari', 'hikari', '松に鶴'], ['Tanzaku', 'tan', '松に赤短'], ['Kasu_1', 'kasu', '松のカス'], ['Kasu_2', 'kasu', '松のカス']],
    [['Tane', 'tane', '梅にうぐいす'], ['Tanzaku', 'tan', '梅に赤短'], ['Kasu_1', 'kasu', '梅のカス'], ['Kasu_2', 'kasu', '梅のカス']],
    [['Hikari', 'hikari', '桜に幕'], ['Tanzaku', 'tan', '桜に赤短'], ['Kasu_1', 'kasu', '桜のカス'], ['Kasu_2', 'kasu', '桜のカス']],
    [['Tane', 'tane', '藤にほととぎす'], ['Tanzaku', 'tan', '藤に短冊'], ['Kasu_1', 'kasu', '藤のカス'], ['Kasu_2', 'kasu', '藤のカス']],
    [['Tane', 'tane', '菖蒲に八橋'], ['Tanzaku', 'tan', '菖蒲に短冊'], ['Kasu_1', 'kasu', '菖蒲のカス'], ['Kasu_2', 'kasu', '菖蒲のカス']],
    [['Tane', 'tane', '牡丹に蝶'], ['Tanzaku', 'tan', '牡丹に青短'], ['Kasu_1', 'kasu', '牡丹のカス'], ['Kasu_2', 'kasu', '牡丹のカス']],
    [['Tane', 'tane', '萩に猪'], ['Tanzaku', 'tan', '萩に短冊'], ['Kasu_1', 'kasu', '萩のカス'], ['Kasu_2', 'kasu', '萩のカス']],
    [['Hikari', 'hikari', '芒に月'], ['Tane', 'tane', '芒に雁'], ['Kasu_1', 'kasu', '芒のカス'], ['Kasu_2', 'kasu', '芒のカス']],
    [['Tane', 'tane', '菊に盃'], ['Tanzaku', 'tan', '菊に青短'], ['Kasu_1', 'kasu', '菊のカス'], ['Kasu_2', 'kasu', '菊のカス']],
    [['Tane', 'tane', '紅葉に鹿'], ['Tanzaku', 'tan', '紅葉に青短'], ['Kasu_1', 'kasu', '紅葉のカス'], ['Kasu_2', 'kasu', '紅葉のカス']],
    [['Hikari', 'hikari', '柳に小野道風'], ['Tane', 'tane', '柳に燕'], ['Tanzaku', 'tan', '柳に短冊'], ['Kasu', 'kasu', '柳のカス']],
    [['Hikari', 'hikari', '桐に鳳凰'], ['Kasu_1', 'kasu', '桐のカス'], ['Kasu_2', 'kasu', '桐のカス'], ['Kasu_3', 'kasu', '桐のカス']]
  ];
  var CARDS = [];
  for (var m = 1; m <= 12; m++) {
    for (var k = 0; k < 4; k++) {
      var L = LAYOUT[m - 1][k], c = { id: CARDS.length, month: m, type: L[1], name: L[2], file: 'Hanafuda_' + EN[m - 1] + '_' + L[0] + '_Alt.svg' };
      if (m === 11 && c.type === 'hikari') c.rain = true;               // 柳に小野道風（雨）
      if (m === 3 && c.type === 'hikari') c.sakura = true;              // 桜に幕
      if (m === 8 && c.type === 'hikari') c.moon = true;                // 芒に月
      if (m === 9 && c.type === 'tane') c.sake = true;                  // 菊に盃
      if (c.type === 'tane' && (m === 7 || m === 10 || m === 6)) c.isc = true;   // 猪（7）・鹿（10）・蝶（6）
      if (c.type === 'tan' && (m === 1 || m === 2 || m === 3)) c.aka = true;     // 赤短（字入り）
      if (c.type === 'tan' && (m === 6 || m === 9 || m === 10)) c.ao = true;     // 青短
      CARDS.push(c);
    }
  }
  function idOf(pred) { for (var i = 0; i < 48; i++) if (pred(CARDS[i])) return i; return -1; }
  var ID = {
    RAIN: idOf(function (c) { return c.rain; }), SAKURA: idOf(function (c) { return c.sakura; }),
    MOON: idOf(function (c) { return c.moon; }), SAKE: idOf(function (c) { return c.sake; })
  };
  var LIGHTS = [], ISC = [], AKA = [], AO = [];
  CARDS.forEach(function (c) {
    if (c.type === 'hikari') LIGHTS.push(c.id);
    if (c.isc) ISC.push(c.id);
    if (c.aka) AKA.push(c.id);
    if (c.ao) AO.push(c.id);
  });

  var RULES = {
    handSize: 8, fieldSize: 8, deckLeft: 8,       // 1人8枚・場8枚・山は 最後まで 8枚 のこる
    doubleAt: 7,                                  // 7点 以上で ×2
    teyakuPts: 6,                                 // 手四・くっつき
    redealMax: 100,                               // 場に 同じ月 4枚の 配り直しは 100回まで
    months: [3, 6, 12]                            // 最初の 画面で 選べる 月数
  };

  /* 役の 名前（★漢字の まま ―― お決め⑤）と 並び */
  var YAKU = {
    goko: '五光', shiko: '四光', ameshiko: '雨四光', sanko: '三光',
    hanami: '花見で一杯', tsukimi: '月見で一杯', inoshikacho: '猪鹿蝶', akatan: '赤短', aotan: '青短',
    tane: 'タネ', tan: 'タン', kasu: 'カス', teshi: '手四', kuttsuki: 'くっつき'
  };

  function month(id) { return CARDS[id].month; }
  function type(id) { return CARDS[id].type; }

  /* ============================================================
     ★ 役の 判定（★点は 必ず ここから 出す ―― 表示も 合計も）
     ============================================================ */
  function judge(ids) {
    var n = { hikari: 0, tane: 0, tan: 0, kasu: 0 }, has = {}, i;
    for (i = 0; i < ids.length; i++) { has[ids[i]] = 1; n[CARDS[ids[i]].type]++; }
    var Y = [];
    function add(key, pts, cards) { Y.push({ key: key, name: YAKU[key], pts: pts, cards: cards }); }
    function own(list) { return list.filter(function (x) { return has[x]; }); }
    var rain = !!has[ID.RAIN], sake = !!has[ID.SAKE];
    /* 光（★どれか 1つだけ）*/
    var lights = own(LIGHTS);
    if (n.hikari === 5) add('goko', 10, lights);
    else if (n.hikari === 4) add(rain ? 'ameshiko' : 'shiko', rain ? 7 : 8, lights);
    else if (n.hikari === 3 && !rain) add('sanko', 5, lights);           // ★雨を ふくむ 3枚は 役なし
    /* 盃（★雨で 流れない）*/
    if (sake && has[ID.SAKURA]) add('hanami', 5, [ID.SAKURA, ID.SAKE]);
    if (sake && has[ID.MOON]) add('tsukimi', 5, [ID.MOON, ID.SAKE]);
    /* ★加点 なし（5点の まま）*/
    if (own(ISC).length === 3) add('inoshikacho', 5, ISC.slice());
    if (own(AKA).length === 3) add('akatan', 5, AKA.slice());
    if (own(AO).length === 3) add('aotan', 5, AO.slice());
    /* 枚数の 役（★盃は タネにも カスにも）*/
    var ids2 = ids.slice();
    if (n.tane >= 5) add('tane', n.tane - 4, ids2.filter(function (x) { return CARDS[x].type === 'tane'; }));
    if (n.tan >= 5) add('tan', n.tan - 4, ids2.filter(function (x) { return CARDS[x].type === 'tan'; }));
    var kasuN = n.kasu + (sake ? 1 : 0);
    if (kasuN >= 10) add('kasu', kasuN - 9, ids2.filter(function (x) { return CARDS[x].type === 'kasu' || CARDS[x].sake; }));
    var total = 0;
    for (i = 0; i < Y.length; i++) total += Y[i].pts;
    return { total: total, yaku: Y, count: { hikari: n.hikari, tane: n.tane, tan: n.tan, kasu: n.kasu, kasuWithSake: kasuN } };
  }
  function total(ids) { return judge(ids).total; }

  /* ★ もらう 点（★順番：足す → 7点 以上 ×2 → 相手が こいこい中 ×2）*/
  function pay(raw, oppKoi) {
    var r = typeof raw === 'object' ? raw.total : raw;
    var x7 = r >= RULES.doubleAt, xKoi = !!oppKoi && r > 0;
    var mult = (x7 ? 2 : 1) * (xKoi ? 2 : 1);
    return { raw: r, x7: x7, xKoi: xKoi, mult: mult, pts: r * mult };
  }
  /* ★ こいこいの 後、また「勝負／こいこい」を 選べるか（★名前では なく 点で。★倍の 前の 点）*/
  function improved(before, after) {
    var b = typeof before === 'object' ? before.total : before, a = typeof after === 'object' ? after.total : after;
    return a > b;
  }
  /* ★ 手札が 0枚なら 自動で 勝負 */
  function mustShobu(handLeft) { return handLeft === 0; }

  /* ★ 手役（★配られた 8枚）*/
  function teyaku(hand) {
    if (!hand || hand.length !== RULES.handSize) return null;
    var cnt = {}, i;
    for (i = 0; i < hand.length; i++) cnt[month(hand[i])] = (cnt[month(hand[i])] || 0) + 1;
    var v = Object.keys(cnt).map(function (x) { return cnt[x]; });
    if (v.some(function (x) { return x === 4; })) return { key: 'teshi', name: YAKU.teshi, pts: RULES.teyakuPts };
    if (v.length === 4 && v.every(function (x) { return x === 2; })) return { key: 'kuttsuki', name: YAKU.kuttsuki, pts: RULES.teyakuPts };
    return null;
  }
  /* ★ 場に 同じ月 4枚（★配り直し）*/
  function fieldFour(field) {
    var cnt = {};
    for (var i = 0; i < field.length; i++) { var mm = month(field[i]); cnt[mm] = (cnt[mm] || 0) + 1; if (cnt[mm] === 4) return mm; }
    return 0;
  }

  /* ★ 場の 取り方（★field は 場の 札の id の 配列）
       place  … 同じ月 0枚：置く
       take   … 1枚：2枚とも 取る（cands＝その 1枚）
       choose … 2枚：どちらか 1枚（cands＝2枚）。same＝2枚が 同じ 種類（★山から なら 機械が 取る）
       all    … 3枚：4枚 ぜんぶ 取る（cands＝3枚）*/
  function captureOptions(card, field) {
    var mm = month(card), same = field.filter(function (f) { return month(f) === mm; });
    if (!same.length) return { kind: 'place', cands: [] };
    if (same.length === 1) return { kind: 'take', cands: same };
    if (same.length === 2) return { kind: 'choose', cands: same, same: type(same[0]) === type(same[1]) && !CARDS[same[0]].sake === !CARDS[same[1]].sake };
    return { kind: 'all', cands: same };
  }

  /* 種つきの でたらめ（★同じ 種なら 同じ 並び）*/
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function mix(a, b) {
    var h = (a ^ Math.imul(b + 0x9E3779B9, 0x85EBCA6B)) >>> 0;
    h = Math.imul(h ^ (h >>> 16), 0x7FEB352D) >>> 0;
    h = Math.imul(h ^ (h >>> 15), 0x846CA68B) >>> 0;
    return (h ^ (h >>> 16)) >>> 0;
  }
  function shuffled(seed) {
    var a = [], r = rng(seed), i;
    for (i = 0; i < 48; i++) a.push(i);
    for (i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  var HanaCore = {
    CARDS: CARDS, ID: ID, RULES: RULES, YAKU: YAKU, FLOWER: FLOWER, LIGHTS: LIGHTS, ISC: ISC, AKA: AKA, AO: AO,
    month: month, type: type,
    judge: judge, total: total, pay: pay, improved: improved, mustShobu: mustShobu,
    teyaku: teyaku, fieldFour: fieldFour, captureOptions: captureOptions,
    rng: rng, mix: mix, shuffled: shuffled
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = HanaCore;
  if (global) global.HanaCore = HanaCore;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
