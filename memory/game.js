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

/* ============================================================
   神経衰弱（10本目）― T79・コーダ
   ------------------------------------------------------------
   仕様は logs/T78_神経衰弱_仕様_ルル.md ＋ 社長裁定（T79）が 正。

   ★★ 社長裁定（5つ・厳守）★★
     1. ★枚数は **52枚のまま**（ルルの推し 36枚とは 逆。社長の判断）
     2. もの覚えを **4段階で 選ばせる**
     3. 初期値は **ふつう**
     4. 見せる時間 **そろわなかった 1.2秒 ／ そろった 0.6秒。人も ロボットも 同じ**
     5. ★**青わくは 作らない。強調ゼロ**

   ★ 52枚に なった ことで 変わった ところ（数え直した ＝ logs/T79_神経衰弱_52枚_見積り.cjs）
     ------------------------------------------------------------
     ・並べ方 … ★**7列×8段（56枠）。最後の段だけ 3枚（まん中の 3列）**
                375px で 49×74px（44pxの 111%）。★52枚が 入る 24通りを 全部 数えた 結果、
                375px で 44px を 守れる 形は これと 6列×9段（45px）の 2つだけ で、
                320px まで 見ると これが 一番 良い。
     ・4段階 … ★**2 ／ 4 ／ 6 ／ ぜんぶ のまま**（52枚でも 初期値「ふつう」は
                はじめての人（4枚 覚える）の 勝率 **43.6%**。動かす 理由が 無い）
     ・1試合 … ★**見立て 4〜5分**（36枚の 2分から 伸びた。手数 74.7回・実測）

   ★ ファイルの かたち（ソリティア T66 → ピラミッド T76 と 同じ）
     ------------------------------------------------------------
     「中身（CORE）」と「画面（UI）」を きっぱり 分けてある。
     CORE は document を 1回も さわらない ので、**Node からも そのまま 動く**。
     ★ 勝率を 数える 側と、実際に 遊ぶ 側の ロボットは **同じ 1本の コード**。
       分けると 必ず ずれる（ルル §7-3 の 名指し）。

   ★★ ロボットが ずるを しない ことの 保証（ルル §7-2 の 4番）★★
     ------------------------------------------------------------
     ロボットの 手を 決める 4つの 関数（firstPick / secondPick / knownPair /
     knownMatch / pickUnknown）には、**配り（G.card）を 1度も 渡していない。**
     渡しているのは
       ① 自分の 覚え（mem.seen ＝ 自分が 見た 場所 → 数字）
       ② gone（その 場所の 札が もう 取られたか。★これは 画面を 見れば 誰でも 分かる）
       ③ 直前に めくれた 札の 数字（★人も 同じ 画面で 見ている）
     の 3つだけ。**MEMORY.verify() が、この 5つの 関数の 中に
     「card」という 字が 1つも 無い ことを 毎回 走査して たしかめる。**

   ⚠️ poker-core.js は 使わない（役の判定が 1つも 要らない ゲーム）。
   ⚠️ 外部の ライブラリ・フォント・画像は 0。外への 通信も 0。
   ============================================================ */
(function (root) {
  'use strict';

  /* ============================================================
     ★ 数字（TUNE）― 調整する 数字は ここ 1か所だけ
     ============================================================ */
  var TUNE = {
    /* ★★ 並べ方（社長裁定1 ＝ 52枚 を 受けて 数え直した）★★
       ------------------------------------------------------------
       52枚が のる 四角を 24通り 全部 数えた（logs/T79_神経衰弱_52枚_見積り.cjs の A）。
         7列×8段 … 375px 49×74px（111%）／320px 33×50px／1000×900 57×86px
         6列×9段 … 375px 45×68px（102%）／320px 30×45px
         8列×7段 … 375px 42×64px（ 95%）／320px 36×55px
       ★ 375px で 44px を 守れるのは 上の 2つだけ。その中で 320px が 一番 大きい 7列×8段。
       ★ 56枠に 52枚 ＝ 4枠 あまる → **最後の段だけ 3枚（まん中の 3列）**。
         穴を 4つ 空けない 理由：このゲームでは **空いた 枠 ＝ もう 取られた 場所**。
         はじめから 穴が 4つ あると「4組 もう 取られている」に 見える（うそに なる）。
       ⚠️ 画面に「あまり」の 説明は 1文字も 出さない（社長指示）。 */
    COLS: 7, ROWS: 8,
    ROW_LEN: [7, 7, 7, 7, 7, 7, 7, 3],
    ROW_OFF: [0, 0, 0, 0, 0, 0, 0, 2],   // 最後の段は まん中（3列目〜5列目）

    /* ★ 横向きスマホ だけの 例外（ルル §1-3 と 同じ 考え方）
       たてが 225px しか 無い 画面では 7列×8段 は 16px に なる（＝ 遊べない）。
       13列×4段 なら 32px 出る。★切りかえの 線は 下の GRID_MIN 1つだけ。 */
    LAND_COLS: 13, LAND_ROWS: 4,
    GRID_MIN: 30,       // 7列×8段 の はばが これ未満 なら 13列×4段（320px は 33px なので 切りかわらない）

    /* ★★ 見せる時間（社長裁定4）★★ 人も ロボットも 同じ。試合の 中で 変わらない。 */
    SHOW_MISS: 1200,    // そろわなかった 2枚
    SHOW_HIT:   600,    // そろった 2枚（★場から 消えるので 覚える 必要が 無い）

    /* ★ ロボットの 間（ルル §3-5。手加減では ない ＝ 人が 画面から 読む ぶん）*/
    BOT_FIRST:  600,    // 手番が 移ってから 1枚めを めくるまで
    BOT_GAP:    900,    // ★1枚めと 2枚めの あいだ（どの段階でも 同じ）

    /* 見た目の 時間（★見せる時間には 含めない・ルル ✅表 4/5）*/
    FLIP:       200,    // 裏 → 表 の 動き
    FLY:        300,    // 取った 2枚が 帯へ 飛ぶ

    /* ★★ 絵が 手元に 来るまでは、めくらない（T80 §7 ―― トライが 見つけた 事故）★★
       ------------------------------------------------------------
       札1枚 193KB。★神経衰弱は 10本で ただ1本、52枚 ぜんぶが 必ず めくられる。
       T79 では 見せる時間の 時計が **絵が 届いたかに かかわらず** 走っていた。
       → 電波が 弱いと「白い札を 1.2秒 見せて 裏に 戻す」。
       → ★しかも ロボットは その札を「見た」ことに なっていた（人だけが 見られない）。
       ★ 直した 形：**絵が 手元に 来てから めくる。** めくった 瞬間に 時計が 動き出す ので、
         ★見せる時間は どんな 回線でも きっちり 1.2秒／0.6秒。
       ★ ロボットが 覚えるのも「めくれた 瞬間」に した ので、
         ★人に 見えなかった 札を ロボットだけが 知る、が **起こりようが ない**。 */
    FACE_GRACE:  150,   // これ以上 待たせる ときだけ、その札を ゆらす（★待っていることが 分かる）
    FACE_WAIT_MAX: 6000,// どうしても 来ない ときは 文字の 札で 必ず 見せる（★試合は 止めない）
    WARM_PAR:      4,   // 裏で 先読みする 本数（★6本の 空きを 使い切らない ―― おした札を 待たせない）

    TAP_SLOP:    14,    // おした所から これ以上 ずれたら その1回は 数えない

    /* 結果の 箱の 連打よけ（T62・T63 の 事故を くり返さない）*/
    RESULT_LOCK: 600,
    RESULT_QUIET: 250,

    /* ★ 寸法（ルル §1-0 の 内わけ・9本と 同じ 探し方）*/
    CARD_MAX:   100,
    GAP_RATE:  0.04,    // 列の間 ＝ はばの 4%（最小 2px・たてよこ 同じ）
    BAND_RATE: 0.32,    // 取った札の帯 ＝ 札の 高さの 32%（★下げない）
    BAND_GAP:     8,    // 盤と 帯の すきま
    RATIO: 635 / 419,   // 支給画像 419×635 の ひりつ。★ぜったいに くずさない

    /* ★★ もの覚えの 5段階（T81 で 1つ 足した）★★
       ------------------------------------------------------------
       ★「覚えている枚数（新しい順・古いものから 忘れる）」で 表す（ルル §2-1）。
         ★確率で 忘れさせない ―― さっき 見た札を 外す ロボットは 間ぬけに 見える。

       ★ T79 は 4段（2/4/6/ぜんぶ）だった。トライ（T80 §4）が すきまを 見つけた：
           7枚 覚えられる人 … 63.6% か 9.0%   ★どちらも 遠い
           8枚 　　　〃　　 … 81.2% か 18.8%  ★どちらも 遠い
           9枚 　　　〃　　 … 91.2% か 29.2%  ★どちらも 遠い
       ★ T79 の 私は「3段めを 6→8 に **動かす**」しか 考えず、
         「6枚の人が 43.8%→9.6% に 落ちる」ので 動かせない、と 結論した。
         ★ 動かすのでは なく **足す** ―― これで 今の 段を 使っている人は 1人も 損しない。

       ★ 足したあと（500試合ずつ 実測。→ logs/T81_神経衰弱_5段_勝率.txt）
           6枚 … もの覚えが いい 43.8%（★変わらない）
           7枚 … ★ほとんど おぼえてる 26.6%
           8枚 … ★ほとんど おぼえてる 45.0%  ← すきまの 一番 広い所が ぴったり 埋まる
           9枚 … ★ほとんど おぼえてる 52.8%
          10枚 … ぜんぶ おぼえてる 39.4%（★変わらない）
       ★ 9 では なく 8 に した 理由：9 だと 8枚の人が 30.0% のまま 残る。

       ★ 5段は 設計図ちがい では ない ―― スピード（T64）は 社長ご指名で 5段。
         設計図の「選ばせるのは 1つまで」は **何種類 選ばせるか** の 話で、
         **1種類の 中の 段の数** の 話では ない。
       ★ 初期値は「ふつう」の まま。名前は トライの 案（社長へ 報告ずみ）。
       ★ 画面に 数字（枚数・%・秒）は 1つも 出さない。 */
    LEVELS: [
      { label: 'わすれんぼう',       cap: 2 },
      { label: 'ふつう',             cap: 4 },   // ★ はじめは これ
      { label: 'もの覚えが いい',    cap: 6 },
      { label: 'ほとんど おぼえてる', cap: 8 },  // ★ T81 で 足した 1段
      { label: 'ぜんぶ おぼえてる',   cap: 52 }
    ],
    LEVEL_START: 1
  };

  /* ============================================================
     カード（設計図 §9・厳守）
     ------------------------------------------------------------
     0〜51 の 数字 1つで 1枚を あらわす。
       すーと = (c/13)|0   … 0 スペード / 1 ハート / 2 ダイヤ / 3 クローバー
       数字   = c % 13     … 0 が A、12 が K
     ★ 神経衰弱は ♠♥♦♣ を 1回も 読まない（同じ 数字か どうかを 見るだけ）。
     ============================================================ */
  var SUITS = ['スペード', 'ハート', 'ダイヤ', 'クローバー'];
  var RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  var N = 52;

  function suitOf(c) { return (c / 13) | 0; }
  function rankOf(c) { return c % 13; }
  function isRed(c)  { var s = suitOf(c); return s === 1 || s === 2; }
  function nameOf(c) { return SUITS[suitOf(c)] + RANKS[rankOf(c)]; }

  /* ★ 種から 動く 乱数（mulberry32）― ソリティア T66 から そのまま */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ★ 配る（ルル §7-1）
     ------------------------------------------------------------
     52枚を まぜて、上の段から 左→右 に 置く。全部 裏向き。
     ★ 配りの 保証は 要らない ―― 詰みが 存在しない（場に 札が あれば 必ず めくれる）。
     ★ card[p] … その 場所の 札。gone[p] … もう 取られたか。 */
  function makeDeal(seed) {
    var rnd = mulberry32(seed >>> 0), deck = [], i, j, t;
    for (i = 0; i < N; i++) deck.push(i);
    for (i = N - 1; i > 0; i--) {
      j = Math.floor(rnd() * (i + 1));
      t = deck[i]; deck[i] = deck[j]; deck[j] = t;
    }
    var gone = [];
    for (i = 0; i < N; i++) gone.push(false);
    return { seed: seed >>> 0, card: deck, gone: gone, score: [0, 0], left: N, turn: 0, rnd: rnd };
  }

  /* ============================================================
     ★★ もの覚え（ルル §2-1）★★
     ------------------------------------------------------------
     ・seen … 場所 → そこで 見た 数字
     ・order … 見た 順（★古いものが 先頭。あふれたら 先頭から 忘れる）
     ★ 確率で 忘れない。だから「直前に めくられた 2枚」は どの段階でも 必ず 覚えている。
     ============================================================ */
  function newMem(cap) { return { cap: cap, order: [], seen: {} }; }

  function memSee(m, pos, rank) {
    if (m.seen[pos] !== undefined) m.order.splice(m.order.indexOf(pos), 1);
    m.seen[pos] = rank;
    m.order.push(pos);
    while (m.order.length > m.cap) delete m.seen[m.order.shift()];
  }
  function memDrop(m, pos) {
    if (m.seen[pos] === undefined) return;
    delete m.seen[pos];
    m.order.splice(m.order.indexOf(pos), 1);
  }

  /* ============================================================
     ★★ ロボットの 頭（★配りを 1度も 受け取らない）★★
     ------------------------------------------------------------
     受け取るのは
       m    … 自分の 覚え
       gone … その 場所が もう 空か（画面を 見れば 誰でも 分かる）
       rank … 直前に めくれた 札の 数字（★人も 同じ 画面で 見ている）
     ★ 「card」という 字は この 下の 5つの 関数に 1つも 出てこない。
       MEMORY.verify() が 毎回 走査する。 */
  function knownPair(m, gone) {          // 覚えている 中に そろう 2枚が あるか
    var by = {}, i, p, r;
    for (i = 0; i < m.order.length; i++) {
      p = m.order[i];
      if (gone[p]) continue;
      r = m.seen[p];
      if (by[r] !== undefined) return [by[r], p];
      by[r] = p;
    }
    return null;
  }
  function knownMatch(m, gone, rank, notPos) {   // その数字を、覚えている 中から 探す
    for (var i = 0; i < m.order.length; i++) {
      var p = m.order[i];
      if (p !== notPos && !gone[p] && m.seen[p] === rank) return p;
    }
    return -1;
  }
  function pickUnknown(m, gone, exclude, rnd) {  // まだ 見ていない 札を 1枚（無ければ 何でも）
    var c = [], p;
    for (p = 0; p < N; p++) if (!gone[p] && p !== exclude && m.seen[p] === undefined) c.push(p);
    if (c.length) return c[Math.floor(rnd() * c.length)];
    var c2 = [];
    for (p = 0; p < N; p++) if (!gone[p] && p !== exclude) c2.push(p);
    return c2.length ? c2[Math.floor(rnd() * c2.length)] : -1;
  }
  /* 1枚め。b >= 0 なら「覚えていた 2枚を 取りに行く」*/
  function firstPick(m, gone, rnd) {
    var kp = knownPair(m, gone);
    if (kp) return { a: kp[0], b: kp[1] };
    return { a: pickUnknown(m, gone, -1, rnd), b: -1 };
  }
  /* 2枚め。★1枚めの 数字を 見てから 決める（人と 同じ 順番）*/
  function secondPick(m, gone, a, rank, rnd) {
    var km = knownMatch(m, gone, rank, a);
    if (km >= 0) return km;
    return pickUnknown(m, gone, a, rnd);
  }

  /* ============================================================
     ★ 中身だけで 1試合 走らせる（＝ 勝率を 数える 道具）
     ------------------------------------------------------------
     ★ 上の firstPick / secondPick を そのまま 使う。
       画面の ロボットと **同じ 1本の コード**（ルル §7-3 の 名指し）。
     ★ 人の側も 同じ 打ち方（覚えている枚数だけ 違う）＝ ルルの 見積り道具と 同じ。
     ============================================================ */
  function simGame(seed, humanCap, botCap, stat) {
    var g = makeDeal(seed), rnd = g.rnd;
    var mem = [newMem(humanCap), newMem(botCap)];
    var hit = 0, miss = 0, guard = 0, takeVia = [0, 0], luck = [0, 0];

    function see(p) {
      var r = rankOf(g.card[p]);
      memSee(mem[0], p, r); memSee(mem[1], p, r);
    }
    function take(a, b, who) {
      g.gone[a] = true; g.gone[b] = true; g.left -= 2; g.score[who] += 2;
      memDrop(mem[0], a); memDrop(mem[0], b); memDrop(mem[1], a); memDrop(mem[1], b);
    }

    while (g.left > 0 && guard++ < 8000) {
      var m = mem[g.turn], again = true;
      while (again && g.left > 0) {
        again = false;
        var f = firstPick(m, g.gone, rnd);
        if (f.a < 0) break;
        if (f.b >= 0) {                                   // 覚えていた 2枚
          see(f.a); see(f.b); hit++; takeVia[g.turn]++;
          take(f.a, f.b, g.turn); again = true; continue;
        }
        var wasUnknown = m.seen[f.a] === undefined;
        var r1 = rankOf(g.card[f.a]); see(f.a);
        var p2 = secondPick(m, g.gone, f.a, r1, rnd);
        if (p2 < 0) break;
        /* ★ p2 が 自分の 覚えの 中に あった ＝「覚えていて 取りに行った」
           （＝ 押し間違いが 一番 痛い 場面。ルル §1-1）*/
        var known2 = m.seen[p2] !== undefined;
        var r2 = rankOf(g.card[p2]); see(p2);
        if (r1 === r2) {
          hit++;
          if (known2) takeVia[g.turn]++;
          else if (wasUnknown) luck[g.turn]++;
          take(f.a, p2, g.turn); again = true;
        } else miss++;
      }
      g.turn = 1 - g.turn;
    }
    if (stat) {
      stat.hit += hit; stat.miss += miss;
      stat.takeVia0 += takeVia[0]; stat.luck0 += luck[0];
      stat.score += g.score[0] + g.score[1];
      if (g.score[0] + g.score[1] !== N) stat.badScore++;
      if (guard >= 8000) stat.capped++;
    }
    return { r: g.score[0] > g.score[1] ? 1 : (g.score[0] < g.score[1] ? -1 : 0), me: g.score[0], bot: g.score[1] };
  }

  function runMany(humanCap, botCap, n, seed0) {
    var w = 0, l = 0, d = 0, i;
    var stat = { hit: 0, miss: 0, takeVia0: 0, luck0: 0, score: 0, badScore: 0, capped: 0 };
    for (i = 0; i < n; i++) {
      var r = simGame((seed0 == null ? (i * 2654435761) : (seed0 + i)) >>> 0, humanCap, botCap, stat);
      if (r.r > 0) w++; else if (r.r < 0) l++; else d++;
    }
    return {
      win: w / n, lose: l / n, draw: d / n,
      hit: stat.hit / n, miss: stat.miss / n, turns: (stat.hit + stat.miss) / n,
      takeVia0: stat.takeVia0 / n, luck0: stat.luck0 / n,
      badScore: stat.badScore, capped: stat.capped
    };
  }

  /* 札が いつも 52枚・同じ数字が 4枚ずつ（たしかめ用）*/
  function countAll(g) {
    var seen = {}, byRank = [], i, c;
    for (i = 0; i < 13; i++) byRank.push(0);
    for (i = 0; i < N; i++) {
      c = g.card[i];
      if (c < 0 || c >= N || seen[c]) return -1;
      seen[c] = 1; byRank[rankOf(c)]++;
    }
    for (i = 0; i < 13; i++) if (byRank[i] !== 4) return -1;
    return N;
  }

  /* ============================================================
     CORE を 外に 出す（Node からも ブラウザからも 同じ 中身）
     ============================================================ */
  var CORE = {
    TUNE: TUNE, SUITS: SUITS, RANKS: RANKS, N: N,
    suitOf: suitOf, rankOf: rankOf, isRed: isRed, nameOf: nameOf,
    mulberry32: mulberry32, makeDeal: makeDeal, countAll: countAll,
    newMem: newMem, memSee: memSee, memDrop: memDrop,
    knownPair: knownPair, knownMatch: knownMatch, pickUnknown: pickUnknown,
    firstPick: firstPick, secondPick: secondPick,
    simGame: simGame, runMany: runMany
  };
  root.MEMORY_CORE = CORE;
  if (typeof module === 'object' && module.exports) module.exports = CORE;

  /* ★ Node（画面が ない ところ）では ここで おしまい。
     ここから下は 1行も 動かない ―― だから 数える 側と 遊ぶ 側は ズレようが ない。 */
  if (typeof document === 'undefined') return;

  /* ============================================================
     ★★ ここから 画面（UI）★★
     ============================================================ */
  var $ = function (id) { return document.getElementById(id); };

  /* ── カードの 絵（設計図 §9・厳守）──────────────────
     ・画像は office/games/cards/ の 支給画像。CSSや 絵文字で 自作しない。
     ・ファイル名が 日本語なので encodeURIComponent を 必ず 通す。
     ・★絵そのもの（cards/）は 1バイトも さわらない ―― 9本が 同じ 絵を 使っている。

     ★★ 先読みについて（設計図 §9 の 「全部 先読みしない」との 関係）★★
       ------------------------------------------------------------
       設計図 §9：「全55枚で 約11MB あるため、★必要な札だけ 読み込む」。
       ★ 神経衰弱では **必要な札 ＝ 52枚 ぜんぶ** ―― 10本で ただ1本、
         最後の1枚まで 必ず めくられる ゲーム だから（ソリティアも ピラミッドも
         「最後まで 見ない札」が 残る。だから あちらは 先読みしない のが 正しい）。
       ★ つまり これは §9 の 例外では なく、§9 を この1本に あてはめた 答え。
       ★ JOKER 2枚は 使わない ので 読まない（55枚では なく 53枚）。
       ★ そして **待たせない**：はじめの画面が 出た 時点から **裏で こっそり** 読む。
         ★4本ずつ しか 流さない（TUNE.WARM_PAR）ので、
           人が おした 札は 空いている 線を 使って **先に 追い越せる**。
         ★「読み込み中」の 文字は 1つも 出さない（設計図 §5.5）。 */
  var CARD_DIR = '../cards/';
  function cardSrc(name) { return CARD_DIR + encodeURIComponent(name) + '.png'; }
  var BACK_SRC = cardSrc('トランプ裏赤');

  /* ★ 保存は「覚える枚数」で 持つ（★段を 足しても ずれない）。
     T79 は 段の 番号で 保存していた ―― そのままだと 5段に した 瞬間、
     ★「ぜんぶ おぼえてる」を えらんでいた人が 黙って「ほとんど」に 落ちる。
     だから 1度だけ 古い 保存を 読みかえる。 */
  var STORE_KEY = 'bragekobo.memory.cap';
  var STORE_OLD = 'bragekobo.memory.level';
  var OLD_CAPS  = [2, 4, 6, 52];        // T79 の 4段（番号 → 枚数）

  /* ── 部品 ─────────────────────────────────── */
  var G = null, botMem = null, boardEl = null, boardIn = null, cardEl = [], built = false;
  var busy = false, timers = [], sel1 = -1, streak = 0, over = false;
  var bandIdx = [0, 0];       // 帯に 積んだ 枚数（0＝自分・1＝ロボット）
  var bandOf = [];            // 場所 → {side, i}
  var faceUp = [];            // 場所 → 表向きか
  var geo = { cw: 49, ch: 74, gap: 2, C: 7, R: 8 };

  var state = { level: TUNE.LEVEL_START };
  function levelOfCap(c) {
    for (var i = 0; i < TUNE.LEVELS.length; i++) if (TUNE.LEVELS[i].cap === c) return i;
    return -1;
  }
  try {
    var savedCap = NaN, saved = localStorage.getItem(STORE_KEY);
    if (saved !== null && saved !== '') savedCap = +saved;
    if (!(savedCap > 0)) {                       // ★新しい 保存が 無い → T79 の 保存を 読みかえる
      var old = localStorage.getItem(STORE_OLD);
      if (old !== null && old !== '') {
        var oi = +old;
        if (oi === Math.floor(oi) && oi >= 0 && oi < OLD_CAPS.length) savedCap = OLD_CAPS[oi];
      }
    }
    var li = levelOfCap(savedCap);
    if (li >= 0) state.level = li;
  } catch (e) {}
  function levelCap() { return TUNE.LEVELS[state.level].cap; }

  function later(fn, ms) { var id = setTimeout(fn, ms); timers.push(id); return id; }
  function clearTimers() { for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]); timers = []; }
  function say(t) { $('happyBubble').textContent = t; }

  /* ============================================================
     ★★ 寸法 ★★
     ------------------------------------------------------------
     ★ 出てくる 答え（logs/T79_神経衰弱_52枚_見積り.cjs の A と 合うこと）
       1000×900 → 57×86px ／ 375px → 49×74px ／ 320px → 33×50px
       横向き 812×375 → 13列×4段 で 32×48px
     ★ ここが 違ったら、どこかが 間違っている。
     ============================================================ */
  function fitGrid(W, H, C, R) {
    for (var w = TUNE.CARD_MAX; w >= 8; w--) {
      var g = Math.max(2, Math.round(w * TUNE.GAP_RATE));
      if (C * w + (C - 1) * g > W) continue;
      var h = Math.round(w * TUNE.RATIO);
      var band = Math.round(h * TUNE.BAND_RATE);
      var gridH = R * h + (R - 1) * g;
      if (gridH + TUNE.BAND_GAP + band > H) continue;
      return { cw: w, ch: h, gap: g, band: band, gridW: C * w + (C - 1) * g, gridH: gridH,
               need: gridH + TUNE.BAND_GAP + band };
    }
    return null;
  }

  /* ★ 並べ方は 1つだけ（7列×8段）。
     ★ ただ1つの 例外 ―― 7列×8段が GRID_MIN(30px) を 下回る 画面（＝ 横向きスマホ）。
       そこだけ 13列×4段。★320px は 33px なので 切りかわらない。 */
  function chooseGrid(W, H) {
    var a = fitGrid(W, H, TUNE.COLS, TUNE.ROWS);
    if (a && a.cw >= TUNE.GRID_MIN) {
      a.C = TUNE.COLS; a.R = TUNE.ROWS; a.rowLen = TUNE.ROW_LEN; a.rowOff = TUNE.ROW_OFF;
      return a;
    }
    var b = fitGrid(W, H, TUNE.LAND_COLS, TUNE.LAND_ROWS);
    if (b && (!a || b.cw > a.cw)) {
      b.C = TUNE.LAND_COLS; b.R = TUNE.LAND_ROWS;
      b.rowLen = [13, 13, 13, 13]; b.rowOff = [0, 0, 0, 0];
      return b;
    }
    if (a) { a.C = TUNE.COLS; a.R = TUNE.ROWS; a.rowLen = TUNE.ROW_LEN; a.rowOff = TUNE.ROW_OFF; return a; }
    var h2 = Math.round(8 * TUNE.RATIO);
    return { cw: 8, ch: h2, gap: 2, band: Math.round(h2 * TUNE.BAND_RATE),
             gridW: 8 * 7 + 12, gridH: 8 * h2 + 14, need: 8 * h2 + 14 + 8,
             C: TUNE.COLS, R: TUNE.ROWS, rowLen: TUNE.ROW_LEN, rowOff: TUNE.ROW_OFF };
  }

  /* 場所 → 段・列（★ 場所の 番号は 並べ方が 変わっても 同じ 札を さす）*/
  function cellOf(p) {
    var r = 0, i, n = 0;
    for (i = 0; i < geo.R; i++) {
      if (p < n + geo.rowLen[i]) { r = i; break; }
      n += geo.rowLen[i];
    }
    return { row: r, col: geo.rowOff[r] + (p - n) };
  }
  function slotX(p) { return geo.x0 + cellOf(p).col * (geo.cw + geo.gap); }
  function slotY(p) { return geo.y0 + cellOf(p).row * (geo.ch + geo.gap); }

  function layout() {
    if (!boardIn) return;
    cancelPress();
    var W = boardIn.clientWidth, H = boardIn.clientHeight;
    if (!W || !H) return;
    geo = chooseGrid(W, H);
    geo.W = W; geo.H = H;
    geo.x0 = Math.max(0, Math.round((W - geo.gridW) / 2));
    geo.y0 = Math.max(0, Math.floor((H - geo.need) / 2));   // ★余りは 上下 半分ずつ
    geo.bandY = geo.y0 + geo.gridH + TUNE.BAND_GAP;

    /* ★★ 押し間違いへの 手当て（★ただ1つ・文字は 1つも 足さない）★★
       ------------------------------------------------------------
       押せる 範囲を、**盤の ふちの 余白ぶんだけ 外へ** 広げる。
       ★ となりに 札が ある 側には **1pxも 広げない**。
         理由：このゲームは 押し間違いが 取り消せない。
               札と札の すきま(2px)まで 押せるように すると、そこに 落ちた 指は
               「一番 近い札」を めくって しまう ―― ★ねらった 札の となりの ことも ある。
               今は そこは 死んだ 場所なので **何も 起きない ＝ もう一度 押せる**。
               「何も 起きない」は、このゲームで 一番 安い 失敗。だから 残す。
       ★ 外側（盤の ふち）には となりの 札が いないので、広げても
         別の 札を 取り違える ことが **理屈で ありえない**。だから そこだけ 広げる。
       ★ 広げる 上限は 札の 半分まで（それ以上 離れた 指は、その札を ねらっていない）。 */
    geo.padX = Math.min(Math.floor(geo.cw / 2), geo.x0);
    geo.padT = Math.min(Math.floor(geo.ch / 2), geo.y0);
    geo.padB = Math.min(Math.floor(geo.ch / 2), TUNE.BAND_GAP);

    /* ★ 取った札の 帯（ルル §1-6）。片側 最大 26枚 ＝ 25回 ずらす。 */
    geo.bandScale = TUNE.BAND_RATE;
    geo.bandW = Math.round(geo.cw * TUNE.BAND_RATE);
    geo.bandStep = Math.max(1, Math.floor((W / 2 - geo.bandW) / 25));

    var r = document.documentElement.style;
    r.setProperty('--cw', geo.cw + 'px');
    r.setProperty('--ch', geo.ch + 'px');
    r.setProperty('--radius', Math.max(3, Math.round(geo.cw * 0.075)) + 'px');
    if (G) render(true);
  }

  /* ── 52枚の 札を 1回だけ 作る ───────────────────────
     ★ 取られた 場所に 下じきは 置かない（ルル §4-5）。
       わくが 残ると「まだ 何か ある」と 見える ―― 引き算。
     ★ 札は **場所**で 持つ（cardEl[p] ＝ その 場所の 札）。
       52枠の 場所は 最後まで 動かない ので、これで ぴったり 合う。 */
  function build() {
    if (built) return;
    built = true;
    boardEl = $('board');
    boardIn = document.createElement('div');
    boardIn.className = 'board-in';
    boardEl.appendChild(boardIn);

    for (var p = 0; p < N; p++) {
      var d = document.createElement('div');
      d.className = 'card is-down';
      d.dataset.pos = String(p);
      var inn = document.createElement('div');
      inn.className = 'card-in';
      var f = document.createElement('img'); f.className = 'cf'; f.alt = ''; f.draggable = false;
      var b = document.createElement('img'); b.className = 'cb'; b.alt = ''; b.draggable = false; b.src = BACK_SRC;
      f.onerror = (function (pp, el) { return function () { fallback(pp, el); }; })(p, inn);
      inn.appendChild(f); inn.appendChild(b);
      d.appendChild(inn);
      boardIn.appendChild(d);
      cardEl.push(d);
    }

    /* ★ 操作は Pointer Events だけ（9本で 共通）。
       ⚠️ click は 足さない ―― スマホで 遅れる・取りこぼす。
       ★ ここが「おして えらぶ」の 入口（ピラミッド T77 と 同じ 作法）。 */
    boardIn.addEventListener('pointerdown', onDown);
    boardIn.addEventListener('pointermove', onMove);
    boardIn.addEventListener('pointerup', onUp);
    boardIn.addEventListener('pointercancel', onCancel);
    boardIn.addEventListener('lostpointercapture', onCancel);
    boardIn.addEventListener('animationend', clearShake);
    boardIn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    boardIn.addEventListener('dragstart', function (e) { e.preventDefault(); });
  }

  /* 画像が 届かなかった ときだけ（ふだんは 一度も 通らない）*/
  function fallback(p, inn) {
    if (!G || inn.querySelector('.fallback')) return;
    var c = G.card[p];
    var d = document.createElement('div');
    d.className = 'fallback ' + (isRed(c) ? 'red' : 'black');
    d.textContent = (isRed(c) ? (suitOf(c) === 1 ? '♥' : '♦') : (suitOf(c) === 0 ? '♠' : '♣')) + RANKS[rankOf(c)];
    inn.appendChild(d);
  }

  /* ============================================================
     ★★ 絵の 先読み（裏で こっそり）★★
     ------------------------------------------------------------
     ★ はじめの画面が 出た 時点から 始める。「はじめる」を おすまでの 数秒は
       どうせ 待ち時間 ―― そこで 読んで しまう。
     ★ 一度に 4本まで（TUNE.WARM_PAR）。ブラウザが 同じ 相手に 開ける 線は 6本。
       ★2本 空けて おく ので、人が おした 札は 待たされずに 先へ 行ける。
     ★ 裏面（トランプ裏赤）は 盤に すぐ 要る ので、それが 届いてから 流し始める。
     ★ 「読み込み中」の 文字も、進み具合の 棒も 出さない（設計図 §5.5）。
     ============================================================ */
  var warmImg = {}, warmQueue = [], warmRun = 0, warmDone = 0, warmGo = false;
  var posOfName = {};        // 配りごとの 「名前 → 場所」

  function warmNext() {
    while (warmRun < TUNE.WARM_PAR && warmQueue.length) {
      (function (name) {
        var im = new Image();
        warmImg[name] = im;
        try { im.fetchPriority = 'low'; } catch (e) {}
        warmRun++;
        im.onload = im.onerror = function () {
          warmRun--; warmDone++;
          handFace(name);      // ★読めたら すぐ その場所の 札に わたす
          warmNext();
        };
        im.src = cardSrc(name);
      })(warmQueue.shift());
    }
  }
  /* ★★ 読み終えた 絵を、盤の 札に わたす ★★
     ------------------------------------------------------------
     ★ ここが 大事：裏で 読み終えただけでは **盤の img は まだ 空**。
       その ままでは「めくる 時点で img が 出せる」ことを 言い切れない。
     ★ だから 読めた その 瞬間に 盤の img へ src を 入れる。
       ★裏向きの 札の 中に そっと 入るだけ なので、画面は 1pxも 変わらない。
     ★ こうして おくと、おした ときには img が **もう 出せる**
       ―― めくる 判断は 1msも 待たずに 済む（＝ T79 と 同じ 速さ）。 */
  function handFace(name) {
    var p = posOfName[name];
    if (p === undefined || !G || !cardEl[p]) return;
    var w = warmImg[name];
    if (!w || !w.complete || !w.naturalWidth) return;
    var f = cardEl[p].firstChild.firstChild;
    if (!f.getAttribute('src')) f.src = cardSrc(name);
  }
  function handAllFaces() {
    posOfName = {};
    if (!G) return;
    for (var p = 0; p < N; p++) posOfName[nameOf(G.card[p])] = p;
    for (var c = 0; c < N; c++) handFace(nameOf(c));
  }
  function warmStart() {
    for (var c = 0; c < N; c++) warmQueue.push(nameOf(c));
    var back = new Image();
    function go() { if (warmGo) return; warmGo = true; warmNext(); }
    back.onload = back.onerror = go;
    back.src = BACK_SRC;                 // ★盤の 裏面が 先。同じ URL なので 読み直しには ならない
    setTimeout(go, 1500);                // 念のため（裏面が いつまでも 来なくても 先へ 進む）
  }
  /* ★「もう 出せる」か ―― ここが true なら 待ちは 1msも 挟まない。
     ★★ 見るのは **盤の img そのもの** だけ。★「裏で 読めているはず」で 済ませない。
       （裏で 読めていても 盤の img が 空なら、めくった 瞬間は まだ 白い。
         そこは handFace() が 先に 埋めて ある ―― だから ここは これで 足りる）*/
  function faceHere(p, f) {
    if (f.complete && f.naturalWidth > 0) return true;               // その札の 絵が 出せる
    if (cardEl[p].firstChild.querySelector('.fallback')) return true; // 文字の 札が 出ている
    return false;
  }

  /* ============================================================
     ★★ 絵が 手元に 来てから めくる（T80 §7 の 直し）★★
     ------------------------------------------------------------
     ★ 速い回線 ―― faceHere が true なので **その場で** cb を 呼ぶ（同期）。
       ★setTimeout も Promise も 通さない ＝ T79 と 1msも 変わらない。
     ★ 遅い回線 ―― 絵が 来るまで **めくらない**。
       ★0.15秒 以上 待たせる ときは、その札を 上下に ゆらす
         （★光でも 色でも ない ―― 黙って 止まって 見えない ように する ため）。
       ★6秒 待っても 来なければ 文字の 札で 必ず 見せる。試合は 止めない。
     ============================================================ */
  var gen = 0, waiting = {};

  function clearWaits() {
    gen++;
    for (var k in waiting) if (waiting.hasOwnProperty(k)) waiting[k]();
    waiting = {};
  }

  function faceReady(p, cb) {
    var f = cardEl[p].firstChild.firstChild;
    var name = nameOf(G.card[p]);
    if (!f.getAttribute('src')) {
      try { f.fetchPriority = 'high'; } catch (e) {}   // ★おされた 札が 先読みを 追い越す
      f.src = cardSrc(name);
    }
    if (faceHere(p, f)) { cb(); return; }              // ★ここが ふだんの 道（同期）

    var my = gen, graceId = 0, capId = 0, fin = false;
    function finish() {
      if (fin) return;
      fin = true;
      clearTimeout(graceId); clearTimeout(capId);
      f.removeEventListener('load', finish);
      f.removeEventListener('error', finish);
      delete waiting[p];
      cardEl[p].classList.remove('is-wait');
      if (my !== gen) return;                          // ★配り直された → もう 何も しない
      cb();
    }
    waiting[p] = finish;
    f.addEventListener('load', finish);
    f.addEventListener('error', finish);
    graceId = setTimeout(function () {
      if (fin || my !== gen) return;
      cardEl[p].style.setProperty('--sx', slotX(p) + 'px');
      cardEl[p].style.setProperty('--sy', slotY(p) + 'px');
      cardEl[p].classList.add('is-wait');
    }, TUNE.FACE_GRACE);
    capId = setTimeout(function () {
      if (fin || my !== gen) return;
      fallback(p, cardEl[p].firstChild);               // ★必ず 見せる（白いまま 戻さない）
      finish();
    }, TUNE.FACE_WAIT_MAX);
  }

  /* ── 並べる ───────────────────────────────── */
  var lastTf = [];
  function place(p, x, y, z, up, scale) {
    var el = cardEl[p];
    var tf = 'translate(' + x + 'px,' + y + 'px)' + (scale === 1 ? '' : ' scale(' + scale + ')');
    if (lastTf[p] !== tf) { lastTf[p] = tf; el.style.transform = tf; }
    el.style.zIndex = String(z);
    if (up) {
      var f = el.firstChild.firstChild;
      if (!f.getAttribute('src')) f.src = cardSrc(nameOf(G.card[p]));   // ★今つかう札だけ 読む
      el.classList.remove('is-down');
    } else {
      el.classList.add('is-down');
    }
  }

  function render(instant) {
    if (!G) return;
    if (instant) { boardEl.classList.add('no-anim'); }
    for (var p = 0; p < N; p++) {
      if (G.gone[p]) {
        var b = bandOf[p];
        if (!b) { cardEl[p].style.display = 'none'; continue; }
        cardEl[p].style.display = '';
        var x = (b.side === 0) ? (b.i * geo.bandStep)
                               : (geo.W - geo.bandW - b.i * geo.bandStep);
        /* ★ 自分の 山は 表向き、ロボットの 山は 裏向き（ルル §1-6）。
           名札も 点数の 数字も 要らない ―― 帯の 長さが そのまま 点数。 */
        place(p, x, geo.bandY, 200 + b.i, b.side === 0, geo.bandScale);
      } else {
        cardEl[p].style.display = '';
        place(p, slotX(p), slotY(p), 10, !!faceUp[p], 1);
      }
    }
    if (instant) { void boardEl.offsetWidth; boardEl.classList.remove('no-anim'); }
  }

  /* ★「それは だめ」の ゆれ ―― 画面に ある たった 1種類の 返し（ルル §4-4）。
     ★ 光でも 色でも ない ので、★強調は ゼロの まま（社長裁定5）。 */
  function shakeNo(p) {
    var el = cardEl[p];
    if (!el) return;
    el.style.setProperty('--sx', slotX(p) + 'px');
    el.style.setProperty('--sy', slotY(p) + 'px');
    el.classList.remove('is-no');
    void el.offsetWidth;
    el.classList.add('is-no');
  }
  function clearShake(e) { if (e.animationName === 'shakeNo') e.target.classList.remove('is-no'); }

  /* ============================================================
     ★★ 操作（ピラミッドの「おして えらぶ」を そのまま）★★
     ------------------------------------------------------------
       1枚めを おす → ★その札が めくれる（＝ これが「えらんだ」の 合図。青わくは 無い）
       2枚めを おす → 同じ 数字なら もらえる（帯へ 飛ぶ）→ もう1回 めくれる
                      ちがえば 1.2秒 見せて、2枚とも 裏へ 戻る
       ★「もう一度 おして 取り消す」は 無い ―― もう 見えて しまっている（ルル §4-3）。
     ============================================================ */

  /* ★ どの 場所を おしたか（★座標から 決める）
     ★ 上の layout() の 手当て どおり、ふちの 余白ぶんだけ 押せる 範囲を 外へ 広げる。
       となりに 札が ある 側は 1pxも 広げない。 */
  function hitAt(x, y) {
    var best = -1, bestD = Infinity, p;
    for (p = 0; p < N; p++) {
      if (G.gone[p]) continue;
      var c = cellOf(p);
      var X = slotX(p), Y = slotY(p);
      var l = (c.col === 0) ? geo.padX : 0;
      var r = (c.col === geo.C - 1) ? geo.padX : 0;
      var t = (c.row === 0) ? geo.padT : 0;
      var b = (c.row === geo.R - 1) ? geo.padB : 0;
      if (x < X - l || x > X + geo.cw + r) continue;
      if (y < Y - t || y > Y + geo.ch + b) continue;
      var dx = x - (X + geo.cw / 2), dy = y - (Y + geo.ch / 2), d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = p; }
    }
    return best;
  }

  var press = null;
  function onDown(e) {
    /* ★ 見せている あいだ・ロボットの 手番は 盤ぜんぶが 効かない。
       ★ そして その あいだの おしは **ためない**（ルル §3-6・T62 の 事故）。
         ここで press を 作らない ＝ あとから まとめて 効く ことが 無い。 */
    if (!G || over || busy || G.turn !== 0) return;
    if (press) return;
    if (e.isPrimary === false) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    var r = boardIn.getBoundingClientRect();
    var x = e.clientX - r.left, y = e.clientY - r.top;
    var p = hitAt(x, y);
    if (p < 0) return;
    e.preventDefault();
    press = { id: e.pointerId, pos: p, out: false, sx: x, sy: y, rl: r.left, rt: r.top };
    try { boardIn.setPointerCapture(e.pointerId); } catch (err) {}
  }
  function onMove(e) {
    var d = press;
    if (!d || e.pointerId !== d.id) return;
    var dx = e.clientX - d.rl - d.sx, dy = e.clientY - d.rt - d.sy;
    if (dx * dx + dy * dy > TUNE.TAP_SLOP * TUNE.TAP_SLOP) d.out = true;
  }
  function onUp(e) {
    var d = press;
    if (!d || e.pointerId !== d.id) return;
    press = null;
    try { boardIn.releasePointerCapture(e.pointerId); } catch (err) {}
    if (d.out) return;
    if (!G || over || busy || G.turn !== 0) return;
    tapPos(d.pos);
  }
  function onCancel(e) {
    var d = press;
    if (!d || e.pointerId !== d.id) return;
    press = null;
    try { boardIn.releasePointerCapture(e.pointerId); } catch (err) {}
  }
  function cancelPress() { press = null; }

  /* ── 札を 1回 おした（★順番が そのまま ルール）───────── */
  function tapPos(p) {
    if (G.gone[p]) return;                 // ★取られた 場所には 何も 無い
    if (p === sel1) { shakeNo(p); return; } // ★すでに めくれている 1枚め → ぷるっと ゆれる
    var a = sel1;
    /* ★絵が 手元に 来るまで 盤を 止める。★おしは ためない（onDown で 弾く ＝ T79 の まま）。
       ★ふだんは この busy は 同じ 行の うちに 元へ 戻る（＝ 何も 変わらない）。 */
    busy = true;
    reveal(p, function () {
      if (a < 0) { sel1 = p; busy = false; return; }  // 1枚め ―― めくれる こと自体が「えらんだ」
      sel1 = -1;
      judge(a, p, 0);                                 // 2枚め ―― 判定
    });
  }

  /* ★ めくる（★人が めくっても、ロボットも 同じ 画面を 見ている）
     ★★ memSee は「めくれた 瞬間」に 呼ぶ ―― ★人に 見えなかった 札を
        ロボットだけが 覚えている、が **起こりようが ない**（T80 §7）。 */
  function reveal(p, done) {
    faceReady(p, function () {
      faceUp[p] = true;
      place(p, slotX(p), slotY(p), 20, true, 1);
      memSee(botMem, p, rankOf(G.card[p]));   // ★ロボットが 知るのは「見た札」だけ
      if (done) done();
    });
  }
  function hide(p) {
    faceUp[p] = false;
    place(p, slotX(p), slotY(p), 10, false, 1);
  }

  /* ── 2枚の 判定（★見せる時間は 人も ロボットも 同じ）───── */
  function judge(a, b, who) {
    busy = true;
    var same = rankOf(G.card[a]) === rankOf(G.card[b]);
    var wait = TUNE.FLIP + (same ? TUNE.SHOW_HIT : TUNE.SHOW_MISS);
    later(function () {
      if (!G || over) return;
      if (same) {
        takePair(a, b, who);
        if (G.left === 0) { finish(); return; }
        if (who === 1) { later(botStep, TUNE.FLY); }
        else {
          streak++;
          /* ★ 当たりは 1試合に 26回 起きる。26回 出る 文は 背景に なる ので、
             ★2つ 続けて 取った ときだけ しゃべる（ルル §6-2）。 */
          if (streak >= 2) say('そろった！　もう1回 めくれるよ！');
          busy = false;
        }
      } else {
        hide(a); hide(b);
        if (who === 0) streak = 0;
        G.turn = 1 - G.turn;
        if (G.turn === 1) later(botTurn, TUNE.FLIP);
        else busy = false;
      }
    }, wait);
  }

  function takePair(a, b, who) {
    G.gone[a] = true; G.gone[b] = true; G.left -= 2; G.score[who] += 2;
    memDrop(botMem, a); memDrop(botMem, b);
    faceUp[a] = false; faceUp[b] = false;
    bandOf[a] = { side: who, i: bandIdx[who]++ };
    bandOf[b] = { side: who, i: bandIdx[who]++ };
    render();
  }

  /* ── ロボットの 手番 ─────────────────────────
     ★ 中身は CORE の firstPick / secondPick そのもの。
       ★配り（G.card）は 1度も 渡していない。 */
  function botTurn() {
    if (!G || over) return;
    busy = true;
    later(botStep, TUNE.BOT_FIRST);
  }
  function botStep() {
    if (!G || over) return;
    if (G.left === 0) { finish(); return; }
    busy = true;
    var f = firstPick(botMem, G.gone, G.rnd);
    if (f.a < 0) { G.turn = 0; busy = false; return; }
    /* ★0.9秒の 間は「1枚めが **見えてから**」数える。
       ★人は その1枚を 見て 覚える ので、絵が 出る 前から 数え始めては いけない。 */
    reveal(f.a, function () {
      later(function () {
        if (!G || over) return;
        var p2 = (f.b >= 0) ? f.b
               : secondPick(botMem, G.gone, f.a, rankOf(G.card[f.a]), G.rnd);
        if (p2 < 0) { G.turn = 0; busy = false; return; }
        reveal(p2, function () { judge(f.a, p2, 1); });
      }, TUNE.FLIP + TUNE.BOT_GAP);
    });
  }

  /* ── 決着 ─────────────────────────────────
     ★ 勝ち／負け／★引き分け の 3つ。引き分けは 52枚でも 7〜15% 出る（実測）。 */
  function finish() {
    over = true; busy = true;
    var me = G.score[0], bot = G.score[1];
    var kind = me > bot ? 'win' : (me < bot ? 'lose' : 'draw');
    var title = kind === 'win' ? '勝ち！' : (kind === 'lose' ? '負け…' : '引き分け');
    var line = kind === 'win' ? 'やったー！　おぼえるの じょうずだね！'
             : (kind === 'lose' ? 'おしい！　もう1回 やろ？' : '引き分け！　いい しょうぶ だったね');
    $('resultTitle').textContent = title;
    $('resultTitle').className = 'result-title' + (kind === 'win' ? '' : ' is-quiet');
    $('resultSay').textContent = line;
    say(line);
    if (kind === 'win') $('happyCat').classList.add('is-jump');
    later(function () { lockResult(); $('resultWrap').classList.remove('hidden'); }, 500);
  }

  /* ============================================================
     ★ 結果の 箱 ＋ 連打よけ（T62・T63 の 事故を くり返さない）
     ============================================================ */
  var locked = false, lockTimer = 0, lockAt = 0;
  function armUnlock(ms) { clearTimeout(lockTimer); lockTimer = setTimeout(unlockResult, ms); }
  function lockResult() {
    locked = true; lockAt = performance.now();
    $('resultBox').classList.add('is-locked');
    $('btnAgain').disabled = true;
    $('levelResult').disabled = true;
    $('btnQuit').setAttribute('aria-disabled', 'true'); $('btnQuit').setAttribute('tabindex', '-1');
    armUnlock(TUNE.RESULT_LOCK);
  }
  function bumpLock() {
    if (!locked) return;
    var left = TUNE.RESULT_LOCK - (performance.now() - lockAt);
    armUnlock(Math.max(TUNE.RESULT_QUIET, left));
  }
  function unlockResult() {
    clearTimeout(lockTimer); locked = false;
    $('resultBox').classList.remove('is-locked');
    $('btnAgain').disabled = false;
    $('levelResult').disabled = false;
    $('btnQuit').removeAttribute('aria-disabled'); $('btnQuit').removeAttribute('tabindex');
  }
  function hideResult() { $('resultWrap').classList.add('hidden'); unlockResult(); }

  /* ============================================================
     ★ もの覚えの プルダウン（社長裁定2）
     ------------------------------------------------------------
     ★ 置き場は **2か所だけ**（最初の画面 と 終わりの画面）。スピード T64 の 作法と 同じ。
     ★ 遊んでいる 最中の 画面には 置かない（設計図 §5.5 の 線引き）。
     ★ えらんだ ものは そのまま 続く ―― 勝ち負けで かってに 変わらない。
     ============================================================ */
  var levelSelects = [];
  function buildLevelSelects() {
    var opts = '', i;
    for (i = 0; i < TUNE.LEVELS.length; i++) {
      opts += '<option value="' + i + '">' + TUNE.LEVELS[i].label + '</option>';
    }
    levelSelects = [$('levelTitle'), $('levelResult')];
    for (var k = 0; k < levelSelects.length; k++) {
      var s = levelSelects[k];
      if (!s) continue;
      s.innerHTML = opts;
      s.value = String(state.level);
      s.addEventListener('change', function (e) { setLevel(+e.target.value); });
    }
  }
  function syncLevelSelects() {
    for (var k = 0; k < levelSelects.length; k++) {
      var s = levelSelects[k];
      if (s && s.value !== String(state.level)) s.value = String(state.level);
    }
  }
  function setLevel(i) {
    if (!(i >= 0 && i < TUNE.LEVELS.length)) return state.level;
    state.level = i;
    try { localStorage.setItem(STORE_KEY, String(TUNE.LEVELS[i].cap)); } catch (e) {}
    syncLevelSelects();
    return state.level;
  }

  /* ── 試合の 出し入れ ──────────────────────────── */
  function cancelAll() {
    cancelPress(); clearTimers(); clearWaits();
    $('happyCat').classList.remove('is-jump');
    hideResult();
    busy = false; over = false; sel1 = -1; streak = 0;
  }

  function newGame(again, seed) {
    cancelAll();
    G = makeDeal(seed == null ? ((Math.random() * 2147483000) >>> 0) : (seed >>> 0));
    botMem = newMem(levelCap());
    bandIdx = [0, 0]; bandOf = []; faceUp = []; lastTf = [];
    for (var p = 0; p < N; p++) {
      var f = cardEl[p].firstChild.firstChild;
      f.removeAttribute('src');                      // ★配り直したら 絵を 読み直す
      var fb = cardEl[p].querySelector('.fallback');
      if (fb) fb.parentNode.removeChild(fb);
      cardEl[p].classList.remove('is-no');
      cardEl[p].classList.remove('is-wait');
      cardEl[p].style.display = '';
    }
    handAllFaces();          // ★もう 読めている 絵は、この 場で 札に わたして おく
    $('titleScreen').classList.add('hidden');
    $('playScreen').classList.remove('hidden');
    layout(); render(true);
    say(again ? 'つぎは 何枚 おぼえられるかな？' : '同じ 数字を 2枚。ロボットより たくさん 取ろう！');
  }

  /* ============================================================
     ★★ T274 ―「↻ やめる」（社長のお決め・設計図 追記⑩）★★
     ------------------------------------------------------------
     ★ 遊びを やめて、★はじめの 画面へ 戻る（★もの覚えを 決め直せる）。
     ★ 聞きません（お決め②）―― ★確認の 箱は 作らない。
     ★★ 消えて 困る ものは 1つも ありません【★T274 実測】：
        ★ 神経衰弱は 1試合の 中でしか 数えて いない（★勝ち星も つづきも 持って いない）。
        ★ だから ボタンの 中の 小さい字（★ヨット・ブラックジャックの 決まり）も 要りません。
     ★ かたづけは cancelAll() 1つに 任せる（★新しく 配る ときと 同じ 道）。
     ============================================================ */
  function quitToTitle() {
    cancelAll();
    $('playScreen').classList.add('hidden');
    $('titleScreen').classList.remove('hidden');
    syncLevelSelects();
    say('同じ 数字を 2枚。ロボットより たくさん 取ろう！');
  }

  /* ★ 「↻ やめる」を 出す／消す ―― ★遊ぶ画面が 出ている ときだけ 出す。
     ★★ あちこちに 書くと 1か所 書き忘れて ずれる ので、
        ★「遊ぶ画面が 出ているか」を そのまま 見る 形に した（★1か所だけ）。 */
  function syncQuit() {
    var b = $('btnQuitGame');
    if (!b) return;
    var on = !$('playScreen').classList.contains('hidden');
    b.classList.toggle('hidden', !on);
    var pad = document.querySelector('.topbar-pad');
    if (pad) pad.classList.toggle('hidden', !!on);
  }

  /* ============================================================
     ★★ T274 の 見張り ―「↻ やめる」（→ verify ★⑤ から 呼ばれる）★★
     ★ 中身の 説明は verify の ★⑤ に 書いて あります。
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
  function quitCheck() {
    var bad = [];
    /* ★★★ T281 ―「↻」が 記号に 見えて いるか（★下の t281IconCheck）★★★ */
    t281IconCheck(document, window).forEach(function (s) { bad.push('★T281 しるし：' + s); });
    var q = $('btnQuitGame'), back = document.querySelector('.topbar .back');
    var play = $('playScreen'), title = $('titleScreen');
    if (!q) return ['★ボタンが 無い'];

    var kBusy = busy, kOver = over, kSel = sel1, kStreak = streak;
    var kTitle = title.classList.contains('hidden');

    /* ａ ★はじめの 画面では 消えて いる */
    title.classList.remove('hidden'); play.classList.add('hidden'); syncQuit();
    if (!q.classList.contains('hidden') || q.offsetParent !== null) bad.push('★はじめの 画面なのに 出ている');
    /* ａ ★遊んで いる ときは 出て いる */
    title.classList.add('hidden'); play.classList.remove('hidden'); syncQuit();
    if (q.classList.contains('hidden') || q.offsetParent === null) bad.push('★遊んで いるのに 出ていない');

    /* ｂ ★指の的 44×44 ―― ★1pxずつ 数える（★computed style を 読まない）*/
    var r = q.getBoundingClientRect();
    var cx = Math.round(r.left + r.width / 2), cy = Math.round(r.top + r.height / 2);
    var hit = function (x, y) { var e = document.elementFromPoint(x, y); return !!(e && (e === q || q.contains(e))); };
    if (t295HakoNoSoto(q, document.elementFromPoint(cx, cy))) {
      /* ★★ T295：★箱が 開いて いて この ボタンが その 外なら ―― ★ブラウザの 決まりで 押せません。
       ★ ★★傷では ない ので 見送ります（★箱の 中・★箱 以外の ふたは これまで どおり 鳴きます）。 */
    }
    else if (!hit(cx, cy)) bad.push('★まん中が 押せない');
    else {
      var up = 0, dn = 0, lf = 0, rt = 0, i;
      for (i = 1; i <= 60; i++) { if (hit(cx, cy - i)) up = i; else break; }
      for (i = 1; i <= 60; i++) { if (hit(cx, cy + i)) dn = i; else break; }
      for (i = 1; i <= 90; i++) { if (hit(cx - i, cy)) lf = i; else break; }
      for (i = 1; i <= 90; i++) { if (hit(cx + i, cy)) rt = i; else break; }
      if (lf + rt + 1 < 44 || up + dn + 1 < 44) bad.push('★指の的が 44×44 に 足りない（' + (lf + rt + 1) + '×' + (up + dn + 1) + '）');
    }
    if (r.right > document.documentElement.clientWidth + 0.5) bad.push('★画面の 右に はみ出した');

    /* ★ 上の帯が 伸びて いないか ―― ★ボタンを 消した ときと くらべる
       ★（★T273 §8-3 の 教え：★「空の 比べ」を 取らないと、★ゲーム自身の 伸びを
         ★ボタンの せいに して しまう）*/
    var bar = document.querySelector('.topbar');
    if (bar) {
      var withBtn = bar.getBoundingClientRect().height;
      var keepD = q.style.display; q.style.display = 'none';
      var without = bar.getBoundingClientRect().height;
      q.style.display = keepD;
      if (withBtn > without + 0.5) bad.push('★上の帯が ' + (withBtn - without).toFixed(1) + 'px 伸びた');
    }
    if (r.top < -0.5) bad.push('★画面の 上に はみ出した');

    /* ★ 札に 1pxも かぶって いないか（★52枚 ぜんぶ 見る）*/
    var ovc = 0;
    for (var c = 0; c < cardEl.length; c++) {
      if (!cardEl[c]) continue;
      var cr = cardEl[c].getBoundingClientRect();
      var ow = Math.min(r.right, cr.right) - Math.max(r.left, cr.left);
      var oh = Math.min(r.bottom, cr.bottom) - Math.max(r.top, cr.top);
      if (ow > 0.5 && oh > 0.5) ovc += ow * oh;
    }
    if (ovc > 0.5) bad.push('★札に かぶった（' + ovc.toFixed(1) + 'px²）');

    /* ★★ ｅ ―― ★③の 字の 書きかえ（「やめる」→「◀ ゲームを選ぶ」）の 見張り ★★
       ------------------------------------------------------------
       ★ 字が 3字 → 8字 に 増えた ので、★となりの「もう1回 ▶」が やせます。
       ⚠️★★ 五目並べの はば320px で、★★★「もう／1／回」の 3行に 折れて いました。
          ★ 見つけたのは ★**写真**です。★数字の 見張り（あふれ・画面外）は
            ★★ぜんぶ 0 で **通して しまいました** ―― ★T273 §8-4 と 同じ 落とし穴。
          ★★ だから ここで **行の数**を 数えます（★字が 何行に なったか）。
       ★ あわせて ★行き先（href）と 字が 変わって いない ことも 見ます。 */
    var rw = $('resultWrap'), rAgain = $('btnAgain'), rQuit = $('btnQuit'), rBox = $('resultBox');
    if (rw && rAgain && rQuit && rBox) {
      var wasHid = rw.classList.contains('hidden');
      if (wasHid) rw.classList.remove('hidden');
      var lineCount = function (el) {
        var rg = document.createRange(); rg.selectNodeContents(el);
        var rs = rg.getClientRects(), tops = {}, cnt = 0;
        for (var li = 0; li < rs.length; li++) {
          if (rs[li].width <= 0 && rs[li].height <= 0) continue;
          var key = Math.round(rs[li].top / 3);
          if (!tops[key]) { tops[key] = 1; cnt++; }
        }
        return cnt;
      };
      var la = lineCount(rAgain);
      if (la > 1) bad.push('★結果の 箱の「もう1回」が ' + la + '行に 折れた');
      var ar = rAgain.getBoundingClientRect(), qr2 = rQuit.getBoundingClientRect(), br2 = rBox.getBoundingClientRect();
      if (ar.right > br2.right + 0.5 || ar.left < br2.left - 0.5) bad.push('★結果の 箱から「もう1回」が はみ出した');
      if (qr2.right > br2.right + 0.5 || qr2.left < br2.left - 0.5) bad.push('★結果の 箱から「◀ ゲームを選ぶ」が はみ出した');
      if (rQuit.getAttribute('href') !== '../') bad.push('★「◀ ゲームを選ぶ」の 行き先が 変わって いる（' + rQuit.getAttribute('href') + '）');
      if (rQuit.textContent.replace(/\s+/g, '') !== '◀ゲームを選ぶ') bad.push('★結果の 箱の 字が ちがう：' + rQuit.textContent);
      if (wasHid) rw.classList.add('hidden');
    }

    /* ｄ ★「◀ ゲームを選ぶ」と 色で 見分けが つく */
    if (back) {
      var qb = getComputedStyle(q).backgroundColor, bb = getComputedStyle(back).backgroundColor;
      if (qb === bb) bad.push('★「◀ ゲームを選ぶ」と 同じ 色（' + qb + '）');
    }

    /* ｃ ★押すと はじめの 画面へ 戻る（★本物の click）*/
    q.click();
    if (title.classList.contains('hidden')) bad.push('★押しても はじめの 画面に 戻らない');
    if (!play.classList.contains('hidden')) bad.push('★押しても 遊ぶ画面が 消えない');
    if (!$('resultWrap').classList.contains('hidden')) bad.push('★押しても 結果の 箱が 消えない');
    syncQuit();
    if (!q.classList.contains('hidden')) bad.push('★戻ったのに ボタンが 残っている');

    /* ★ 預かった 中身を もどす */
    busy = kBusy; over = kOver; sel1 = kSel; streak = kStreak;
    title.classList.toggle('hidden', kTitle);
    play.classList.toggle('hidden', !kTitle);
    syncQuit();
    if (built && G && !kTitle) { layout(); render(true); }
    return bad;
  }

  /* ── つなぐ ─────────────────────────────────── */
  function boot() {
    build();
    buildLevelSelects();
    warmStart();          // ★はじめの画面が 出た その 瞬間から、裏で 52枚を 読み始める
    $('btnStart').addEventListener('click', function () { newGame(false); });
    $('btnAgain').addEventListener('click', function () { if (!locked) newGame(true); });
    $('btnQuitGame').addEventListener('click', quitToTitle);   /* ★T274 */
    /* ★T274：遊ぶ画面の 出入りを そのまま 見て、「↻ やめる」を 出し入れする */
    if (window.MutationObserver) {
      new MutationObserver(syncQuit).observe($('playScreen'), { attributes: true, attributeFilter: ['class'] });
    }
    syncQuit();
    $('btnHowto').addEventListener('click', function () { $('helpDialog').showModal(); });
    var closers = document.querySelectorAll('[data-close]');
    for (var i = 0; i < closers.length; i++) {
      closers[i].addEventListener('click', function () { $(this.dataset.close).close(); });
    }
    $('resultWrap').addEventListener('pointerdown', bumpLock, true);
    /* ★ 指を はなした ことを 取りこぼさない ための 保険（★大事）
       ------------------------------------------------------------
       盤の 外で 指を はなす・端末が 指の 追跡を 落とす、といった ときに
       pointerup が 盤に 届かない ことが ある。すると press が 残り、
       ★そこから 先の おしが 全部 効かなくなる（盤が 死ぬ）。
       ★ 神経衰弱は 1試合に 150回 前後 おす ゲーム。ここを 落とすと 試合が 終わる。
       window でも 受けて おけば、必ず どちらかで 拾える。
       （onUp は はじめに press を 空に する ので、2回 呼ばれても 二重に 効かない）*/
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    window.addEventListener('resize', layout);
    window.addEventListener('orientationchange', function () { setTimeout(layout, 120); });
    layout();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* ============================================================
     ★ たしかめ用の 窓口（window.MEMORY）― 既存9本と 同じ 作法
     ------------------------------------------------------------
     画面には 1つも 出さない（お客さんに 見せる 物では ない）。
     ============================================================ */
  function median(a) { if (!a.length) return 0; var b = a.slice().sort(function (x, y) { return x - y; }); return b[b.length >> 1]; }

  /* ★ autoPlay(n, {humanMemory: 8, botMemory: 52})
     ★ 人の もの覚えを 指定できる ―― 勝率の 測定に 要る（社長指示）。 */
  function autoPlay(n, opt) {
    n = n || 100; opt = opt || {};
    var hc = opt.humanMemory == null ? 4 : opt.humanMemory;
    var bc = opt.botMemory == null ? levelCap() : opt.botMemory;
    var t0 = Date.now(), errs = [], w = 0, l = 0, d = 0, mv = [], bad52 = 0, badScore = 0;
    for (var i = 0; i < n; i++) {
      var seed = ((opt.seed == null ? 1 : opt.seed) + i * 2654435761) >>> 0;
      var g = makeDeal(seed);
      if (countAll(g) !== 52) { bad52++; errs.push('seed ' + seed + '：札が52枚でない'); }
      var stat = { hit: 0, miss: 0, takeVia0: 0, luck0: 0, score: 0, badScore: 0, capped: 0 };
      var r;
      try { r = simGame(seed, hc, bc, stat); }
      catch (e) { errs.push('seed ' + seed + '：' + e.message); continue; }
      if (stat.badScore) { badScore++; errs.push('seed ' + seed + '：取った札の合計が52枚でない'); }
      if (stat.capped) errs.push('seed ' + seed + '：手数が 上限に 当たった');
      if (r.r > 0) w++; else if (r.r < 0) l++; else d++;
      mv.push(stat.hit + stat.miss);
    }
    var out = {
      '試合数': n,
      '人の もの覚え': (hc >= 52 ? 'ぜんぶ' : hc + '枚'),
      'ロボットの もの覚え': (bc >= 52 ? 'ぜんぶ' : bc + '枚'),
      '★エラー': errs.length,
      '★札が52枚でなかった試合': bad52,
      '★取った札の合計が52枚でなかった試合': badScore,
      '人の勝ち': w + ' (' + (w / n * 100).toFixed(1) + '%)',
      '引き分け': d + ' (' + (d / n * 100).toFixed(1) + '%)',
      '負け': l + ' (' + (l / n * 100).toFixed(1) + '%)',
      '2枚めくりの回数（中央値／最大）': median(mv) + '回 ／ ' + Math.max.apply(null, mv) + '回',
      'かかった時間': ((Date.now() - t0) / 1000).toFixed(1) + '秒'
    };
    if (errs.length) out['エラーの中身'] = errs.slice(0, 5);
    console.log('[MEMORY] autoPlay', out);
    return out;
  }

  /* ★ 5段階 × 人の もの覚え の 表（勝率の 測定・トライへ）*/
  function rates(n) {
    n = n || 2000;
    var out = {}, i, h;
    var HUM = [2, 4, 6, 7, 8, 9, 10, 11, 12];
    for (i = 0; i < HUM.length; i++) {
      h = HUM[i];
      var row = [];
      for (var k = 0; k < TUNE.LEVELS.length; k++) {
        var r = runMany(h, TUNE.LEVELS[k].cap, n, 12345 + i * 977 + k * 31);
        row.push(TUNE.LEVELS[k].label + ' ' + (r.win * 100).toFixed(1) + '%（分け ' + (r.draw * 100).toFixed(1) + '%・手数 ' + r.turns.toFixed(1) + '）');
      }
      out['人 ' + h + '枚'] = row;
    }
    console.log('[MEMORY] rates', out);
    return out;
  }

  /* ★★ たしかめ ★★
     ① 札は いつも 52枚・同じ数字が 4枚ずつ
     ② 取った札の 合計は いつも 52枚（26組 ちょうど）
     ③ ★ロボットの 頭に「配り」が 1度も 渡っていない（関数の 中身を 走査）
     ④ 並べ方が 52枚 ぴったり（枠の 数と 場所が だぶらない） */

  /* ============================================================
     ★★★ T291 ―「見えない 押し代（44px）」の 見張り ★★★
     ------------------------------------------------------------
     ★ T291 で、★結果の箱（★と あそびかたの箱）の ボタンに
       ★★「**見た目は そのまま・指の的だけ たて44px**」の 押し代（`::after`）を 入れました。
       ★ ★もとは T118（フリーセル）・T289（アト）と 同じ 型です。
     ★ ここは その 押し代が **生きて いるか**を 数えます。★見るのは 5つ：
       ａ ★押し代が **消えて いない**（`::after` の content が none で ない）
       ｂ ★押し代の たてが **44px 以上**
       ｃ ★親に `position:relative` が **残って いる**（★外れると 押し代が 迷子に なる）
       ｄ ★★**見た目が 太って いない**（★下の 数字は T291 で 実測した たて。★これを 超えたら 鳴く）
       ｅ ★★本物の 指（`elementFromPoint`）で たて **44px 届く**・
          ★★★**となりの ボタンの 見た目を 取って いない**
     ⚠️★ computed style だけを 信じては いけません（★T273 §4-1）。
        ★ ★だから ｅ は **1pxずつ つついて** 数えます。
     ⚠️★ 画面の 下で **切れて いる** ときは ｅ を 数えません。
        ★ ★それは「44px 足りない」では なく「すべらせれば 出る」―― ★T289 §4 と 同じ 分けかた。
     ★ 出して 見る もの（結果の箱・あそびかたの箱）は、★**1つ 残らず 元に 戻します**（★T144 §7-5）。
     ============================================================ */
  function oshishiro() {
    /* ★ [えらび方, 見た目の たて(px)【★T291 実測】, となり（取っては いけない）, 出しかた] */
    var LIST = [
      ['#btnQuit', 38, ['#btnAgain'], 'result']
    ];
    var bad = [], mita = 0, i;
    var vw = window.innerWidth, vh = window.innerHeight;

    function atta(el, x, y) { var e = document.elementFromPoint(x, y); return !!e && (e === el || el.contains(e)); }
    function deteru(el) { return !!(el && el.getClientRects().length); }
    function kiru(el) {                       /* ★ 切る ふち（overflow が visible で ない 親）*/
      var p = el.parentElement;
      while (p && p !== document.documentElement) {
        var cs = getComputedStyle(p);
        if (cs.overflowY !== 'visible' || cs.overflowX !== 'visible') {
          var pr = p.getBoundingClientRect();
          return { t: pr.top + (parseFloat(cs.borderTopWidth) || 0), b: pr.bottom - (parseFloat(cs.borderBottomWidth) || 0) };
        }
        p = p.parentElement;
      }
      return null;
    }
    /* ★ 出す → 戻す（★戻す 関数を 返す）*/
    function hiraku(how) {
      var back = [];
      if (how === 'result') {
        var rw = document.getElementById('resultWrap');
        if (rw && rw.classList.contains('hidden')) { rw.classList.remove('hidden'); back.push(function () { rw.classList.add('hidden'); }); }
        var rb = document.getElementById('resultBox');
        if (rb && rb.classList.contains('is-locked')) { rb.classList.remove('is-locked'); back.push(function () { rb.classList.add('is-locked'); }); }
        /* ★★ 箱が 出る ときの「ぽん」（`animation:resultIn` ― 0.22秒）の **途中で 測らない**★★
           ★ ★この 動きは `transform:scale(.8)` から 始まります。★出した すぐ あとに 測ると
             ★★ 箱ごと 0.8倍に 縮んで いて、★★★44px の 押し代が **36px** に 見えました【★実測・T291】。
             ★ ★（★見張りを 先に 走らせて 見つけた しくじり ―― ★ゲームの ほうは 正しい）。
           ★ → ★数える あいだだけ 止めて、★終わったら 元に 戻します。
             ★★JS は 止まらずに 走るので、★**1コマも 絵には 出ません**。 */
        if (rb) { var ani = rb.style.animation; rb.style.animation = 'none'; back.push(function () { rb.style.animation = ani; }); }
        /* ★ かくれて いる 2つめ の ボタンも 出す（★3つ ならんだ いちばん つまった 形で 数える）*/
        ['btnSub', 'btnQuit'].forEach(function (id) {
          var e = document.getElementById(id);
          if (e && e.classList.contains('hidden')) { e.classList.remove('hidden'); back.push(function () { e.classList.add('hidden'); }); }
        });
      } else {
        var d = document.getElementById(how === 'help' ? 'helpDialog' : 'resultDialog');
        if (d && d.showModal && !d.open) {
          try { d.showModal(); back.push(function () { try { d.close(); } catch (e) {} }); } catch (e) {}
        }
      }
      return function () { for (var k = back.length - 1; k >= 0; k--) back[k](); };
    }

    function mitoru(row) {
      var sel = row[0], mitame = row[1], tonari = row[2];
      var el = document.querySelector(sel);
      if (!el) { bad.push('★T291：' + sel + ' が 居ない'); return; }
      if (!deteru(el)) return;                              /* ★ 出て いない ときは 数えない */
      var r = el.getBoundingClientRect();
      var cs = getComputedStyle(el), af = getComputedStyle(el, '::after');
      if (af.content === 'none') bad.push('★T291：押し代が 消えた（' + sel + '）');
      if (parseFloat(af.height) < 44) bad.push('★T291：押し代が ' + af.height + ' しか ない（' + sel + '）');
      if (cs.position === 'static') bad.push('★T291：position:relative が 外れた（' + sel + '）');
      if (r.height > mitame + 0.6) bad.push('★T291：見た目が ' + r.height.toFixed(1) + 'px に 太った（' + sel + '・T291 では ' + mitame + 'px）');

      var k = kiru(el);
      var mieru = (r.top >= 0 && r.bottom <= vh && (!k || (r.top >= k.t - 0.5 && r.bottom <= k.b + 0.5)));
      if (!mieru) return;                                   /* ★ 切れて いる ―― ｅ は 数えない */
      var cx = Math.round((r.left + r.right) / 2), cy = Math.round((r.top + r.bottom) / 2);
      if (cx < 0 || cx >= vw || cy < 0 || cy >= vh || !atta(el, cx, cy)) return;
      var T = cy, B = cy, j;
      for (j = 1; j <= 40; j++) { if (cy - j >= 0 && atta(el, cx, cy - j)) T = cy - j; else break; }
      for (j = 1; j <= 40; j++) { if (cy + j < vh && atta(el, cx, cy + j)) B = cy + j; else break; }
      mita++;
      if (B - T + 1 < 44) bad.push('★T291：指の的が たて ' + (B - T + 1) + 'px しか ない（' + sel + '）');

      for (j = 0; j < tonari.length; j++) {
        var o = document.querySelector(tonari[j]);
        if (!o || !deteru(o)) continue;
        var q = o.getBoundingClientRect();
        var ox = Math.round((q.left + q.right) / 2);
        var ys = [Math.round(q.top) + 1, Math.round(q.bottom) - 2];
        for (var m = 0; m < ys.length; m++) {
          if (ys[m] < 0 || ys[m] >= vh || ox < 0 || ox >= vw) continue;
          if (!atta(o, ox, ys[m])) bad.push('★T291：となりの ' + tonari[j] + ' の 見た目を 取った（y=' + ys[m] + '）');
        }
      }
    }

    var ways = [];
    for (i = 0; i < LIST.length; i++) if (ways.indexOf(LIST[i][3]) < 0) ways.push(LIST[i][3]);
    for (var w = 0; w < ways.length; w++) {
      var shimau = hiraku(ways[w]);
      try { for (i = 0; i < LIST.length; i++) if (LIST[i][3] === ways[w]) mitoru(LIST[i]); }
      finally { shimau(); }
    }
    return { '★NG': bad.length, '中身': bad.length ? bad : 'OK', '数えた ところ': mita };
  }

  function verify(n) {
    n = n || 200;
    var i, ng = [], t0 = Date.now();
    var stat = { hit: 0, miss: 0, takeVia0: 0, luck0: 0, score: 0, badScore: 0, capped: 0 };
    for (i = 0; i < n; i++) {
      var seed = (777 + i * 2654435761) >>> 0;
      var g = makeDeal(seed);
      if (countAll(g) !== 52) ng.push('seed ' + seed + '：札が52枚でない');
      simGame(seed, 8, 8, stat);
    }
    if (stat.badScore) ng.push('取った札の合計が52枚でない試合が ' + stat.badScore + '件');
    if (stat.capped) ng.push('手数が 上限に 当たった試合が ' + stat.capped + '件');

    /* ★③ ロボットの 頭に 配りが 渡っていない ことの 走査。
       ★ 配りは G.card ／ makeDeal の card。下の 5つに「card」の 字が 1つでも
         あれば、その ロボットは 場の 中身を のぞける ことに なる。 */
    var brain = [firstPick, secondPick, knownPair, knownMatch, pickUnknown];
    var brainNames = ['firstPick', 'secondPick', 'knownPair', 'knownMatch', 'pickUnknown'];
    var peek = [];
    for (i = 0; i < brain.length; i++) {
      if (/card|rankOf|nameOf|deal/.test(String(brain[i]))) peek.push(brainNames[i]);
    }
    if (peek.length) ng.push('★ロボットが 場の中身を 見ている おそれ：' + peek.join('・'));

    /* ★④ 並べ方（枠が 52・場所が だぶらない）*/
    var slots = {}, dup = 0, total = 0;
    for (i = 0; i < geo.R; i++) total += geo.rowLen[i];
    for (i = 0; i < N; i++) {
      var c = cellOf(i), key = c.row + ',' + c.col;
      if (slots[key]) dup++;
      slots[key] = 1;
      if (c.col < 0 || c.col >= geo.C || c.row < 0 || c.row >= geo.R) ng.push('場所 ' + i + ' が 枠の 外');
    }
    if (total !== 52) ng.push('枠の 数が 52でない（' + total + '）');
    if (dup) ng.push('同じ 場所に 2枚（' + dup + '件）');

    /* ============================================================
       ★⑤ ★★「↻ やめる」（T274・設計図 追記⑩）★★
       ------------------------------------------------------------
       ★ この 働きは、★T274 まで **どの本にも 見張られて いません でした**。
       ★ 4つを 見ます：
         ａ ★遊んで いる ときは **出ている**／★はじめの 画面では **消えている**
         ｂ ★★指の的が **44×44 ある**（★大富豪が 66×32 で 落ちて いた ところ）
         ｃ ★押すと **はじめの 画面へ 戻る**（★本物の click を 通す）
         ｄ ★「◀ ゲームを選ぶ」と **色で 見分けが つく**（★地の 色が ちがう）
       ⚠️★ ｂ は computed style を 読んでは いけません。
          ★ 44px と 書いて あっても、★ほかの 箱に 上書きされたら 押せません（T273 §4-1）。
          ★★ だから **elementFromPoint で 1pxずつ** 数えます。
       ============================================================ */
    var quitNG = quitCheck();
    if (quitNG.length) ng.push('★「↻ やめる」：' + quitNG.join('／'));

    var out = {
      '調べた試合': n,
      '★だめだったもの': ng.length,
      '札は いつも52枚・同じ数字4枚ずつ': ng.length === 0 ? 'OK' : '―',
      '取った札の合計': (stat.score / n).toFixed(1) + '枚／試合（52なら OK）',
      '★ロボットに 配りを 渡していない': peek.length === 0 ? 'OK（5つの関数すべて）' : 'だめ',
      '並べ方': geo.C + '列×' + geo.R + '段（' + geo.rowLen.join('/') + '）・枠 ' + total + '・重なり ' + dup,
      '札の大きさ': geo.cw + '×' + geo.ch + 'px',
      '★「↻ やめる」（出る・44px・戻る・色で 見分く）': quitNG.length ? 'NG' : 'OK',
      'かかった時間': ((Date.now() - t0) / 1000).toFixed(1) + '秒'
    };
    if (ng.length) out['中身'] = ng.slice(0, 10);
    /* ★ T291 ―「見えない 押し代（44px）」の 見張り */
    var t291 = oshishiro();
    out['★T291 見えない 押し代（44px）'] = t291['★NG'] ? t291['中身'] : ('OK（数えた ' + t291['数えた ところ'] + 'か所）');
    if (t291['★NG']) out['★NG'] = (out['★NG'] || 0) + t291['★NG'];
    console.log('[MEMORY] verify', out);
    return out;
  }

  function screenInfo() {
    var inb = boardIn.getBoundingClientRect(), lowest = 0, rightmost = 0, i, b;
    for (i = 0; i < N; i++) {
      if (cardEl[i].style.display === 'none') continue;
      b = cardEl[i].getBoundingClientRect();
      if (b.bottom > lowest) lowest = b.bottom;
      if (b.right > rightmost) rightmost = b.right;
    }
    var numPx = geo.ch * (64.5 / 635);
    return {
      画面: window.innerWidth + '×' + window.innerHeight,
      器の中身: Math.round(inb.width) + '×' + Math.round(inb.height),
      並べ方: geo.C + '列×' + geo.R + '段（最後の段 ' + geo.rowLen[geo.R - 1] + '枚）',
      札: geo.cw + '×' + geo.ch + 'px',
      '44pxに対して': (geo.cw / 44 * 100).toFixed(0) + '%',
      列の間: geo.gap + 'px',
      盤: geo.gridW + '×' + geo.gridH + 'px',
      帯の高さ: geo.band + 'px（1枚 ' + geo.bandW + 'px・ずらし ' + geo.bandStep + 'px）',
      隅の数字: numPx.toFixed(1) + 'px',
      押し間違いの余裕: '±' + ((geo.cw + geo.gap) / 2).toFixed(1) + 'px',
      '押せる範囲を広げた分（ふちだけ）': '左右 ' + geo.padX + 'px ／ 上 ' + geo.padT + 'px ／ 下 ' + geo.padB + 'px',
      たての余り: (geo.H - geo.need) + 'px',
      はみ出し下: Math.round(lowest - inb.bottom) + 'px（0以下ならOK）',
      はみ出し右: Math.round(rightmost - inb.right) + 'px（0以下ならOK）',
      ページ縦スクロール: document.documentElement.scrollHeight > window.innerHeight,
      ページ横スクロール: document.documentElement.scrollWidth > window.innerWidth
    };
  }

  window.MEMORY = {
    now: function () {
      if (!G) return { 場面: 'まだ 始めていない', もの覚え: TUNE.LEVELS[state.level].label };
      var rows = [], p = 0, r, i, line;
      for (r = 0; r < geo.R; r++) {
        line = [];
        for (i = 0; i < geo.rowLen[r]; i++, p++) {
          line.push(G.gone[p] ? '・' : (faceUp[p] ? RANKS[rankOf(G.card[p])] : '□'));
        }
        rows.push((r + 1) + '段：' + line.join(' '));
      }
      return {
        配りの番号: G.seed,
        盤: rows,
        '（□は 裏・・は 取られた）': G.left + '枚 のこり',
        自分: G.score[0] + '枚', ロボット: G.score[1] + '枚',
        手番: G.turn === 0 ? '自分' : 'ロボット',
        めくっている1枚め: sel1 < 0 ? 'なし' : (sel1 + '（' + RANKS[rankOf(G.card[sel1])] + '）'),
        'ロボットの もの覚え': TUNE.LEVELS[state.level].label + '（' + (levelCap() >= 52 ? 'ぜんぶ' : levelCap() + '枚') + '）',
        'ロボットが いま 覚えている': botMem ? botMem.order.length + '枚' : '―',
        札の合計: countAll(G) + '枚',
        勝敗: over ? (G.score[0] > G.score[1] ? '勝ち' : (G.score[0] < G.score[1] ? '負け' : '引き分け')) : '進行中',
        札の大きさ: geo.cw + '×' + geo.ch + 'px'
      };
    },
    autoPlay: autoPlay,
    rates: rates,
    verify: verify,
    oshishiro: oshishiro,   /* ★T291 ―「見えない 押し代」の 見張り だけ 単体で 走らせる */
    /* ★ 盤が 止まっていないか（★たしかめ 専用・画面には 出さない）*/
    flow: function () {
      var w = 0, k;
      for (k in waiting) if (waiting.hasOwnProperty(k)) w++;
      return { '盤が 止まっている（busy）': busy, '決着ずみ': over,
               'めくっている1枚め': sel1, '手番': G ? (G.turn === 0 ? '自分' : 'ロボット') : '―',
               '★絵を 待っている札': w, '動いている 時計': timers.length };
    },
    /* ★ 絵が どこまで 手元に 来ているか（★たしかめ 専用・画面には 出さない）*/
    images: function () {
      var here = 0, ng = 0, waitN = 0, k;
      for (var c = 0; c < N; c++) {
        var w = warmImg[nameOf(c)];
        if (!w) continue;
        if (w.complete && w.naturalWidth > 0) here++;
        else if (w.complete) ng++;
      }
      for (k in waiting) if (waiting.hasOwnProperty(k)) waitN++;
      return {
        '手元に ある札': here + ' / ' + N,
        'まだ 読んでいない': warmQueue.length,
        'いま 読んでいる': warmRun,
        '読めなかった': ng,
        '★いま 絵を 待っている札': waitN
      };
    },
    screen: screenInfo,
    geo: function () { return geo; },
    seed: function (n) {
      if (n == null) return G ? G.seed : null;
      newGame(false, n >>> 0);
      return G.seed;
    },
    level: function (i) {
      if (i == null) return { 番号: state.level, 名前: TUNE.LEVELS[state.level].label, 覚える枚数: levelCap() };
      setLevel(i);
      return { 番号: state.level, 名前: TUNE.LEVELS[state.level].label, 覚える枚数: levelCap() };
    },
    /* ★ 決着の 直前を 出す ―― たしかめ 専用（引き分けの 画面を 見る ため）*/
    nearEnd: function (leftPairs) {
      leftPairs = leftPairs == null ? 1 : Math.max(1, Math.min(26, leftPairs));
      if (!G) newGame(false);
      cancelAll();
      var guard = 0;
      while (G.left > leftPairs * 2 && guard++ < 200) {
        var a = -1, b = -1, i, j;
        for (i = 0; i < N && a < 0; i++) if (!G.gone[i]) a = i;
        for (j = a + 1; j < N && b < 0; j++) if (!G.gone[j] && rankOf(G.card[j]) === rankOf(G.card[a])) b = j;
        if (b < 0) { for (j = a + 1; j < N && b < 0; j++) if (!G.gone[j]) b = j; }
        if (b < 0) break;
        var who = (G.score[0] <= G.score[1]) ? 0 : 1;
        takePair(a, b, who);
      }
      G.turn = 0; busy = false; over = false;
      render(true);
      say('たしかめ用：あと ' + (G.left / 2) + '組');
      return { 場に残り: G.left + '枚', 自分: G.score[0] + '枚', ロボット: G.score[1] + '枚' };
    },
    core: CORE
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
