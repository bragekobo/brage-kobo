/* ============================================================
   ページワン ― ルール・ロボット・寸法（T152・コーダ）
   ------------------------------------------------------------
   ★ このファイルは document を 1度も さわりません。
     ＝ Node でも そのまま 走る ＝ 数える 側と 遊ぶ 側が ズレようが ない
     （ピラミッド T76・リバーシ T89・四目 T127・ババ抜き T144 と 同じ 作法）。

   ★★★ この 1本の 芯 ―― 「8を いつ 使うか」★★★
     ------------------------------------------------------------
     ★ ルル T151 §1-3【計算】：
         ① でたらめ ＋ マークも でたらめ … 21.2%
         ② マークだけ 選ぶ …………………… 22.0%（+0.8）
         ③ 8を ためる ＋ マークは でたらめ … 26.4%（+5.2）
         ④ ★★8を ためる ＋ マークも 選ぶ … 28.8%（★+7.6）
       ★ 0.8 ＋ 5.2 ＝ 6.0 の はずが 7.6。★★2つは かけ算に なって います。
     ★ だから ―― ★★**8を 出した あとの マーク選びは、絶対に 自動化しません**
       （設計図 追記②・ルル §8-b・アイの 指示1）。★core は 選ばれた マークを 受け取るだけ。

   ★★★ 特殊札は 5種類 ぜんぶ 作り、★1つずつ ON/OFF できます ★★★
     ------------------------------------------------------------
     ★ 社長裁定（2026-08-28）：★「特殊札は 全部 実装。★大富豪みたいに ON/OFF を 選べるように」
     ★ ★初期値は「8だけ ON」（設計図 §5.5 の 表）。
     ★ ★まとめ選択（かんたん／ふつう／ぜんぶ）は **作りません**（アイの 指示・大富豪との ちがい）。

   ★★★ 出せない ときは「出せる札が 来るまで 引く」（社長裁定・ルル (c)）★★★
     ------------------------------------------------------------
     ★★ ここに **故障** が ありました。★ルルの 数字：★(c) だけ ★終わらない率 0.15%。
     ★★ 私が 調べた 原因は、社長の 見立て（「山が 尽きる」）とは ちがいました。
        → ★詳しくは 下の 「★★止まらない 試合の 正体」を 読んで ください。
   ============================================================ */
(function (root) {
  'use strict';

  /* ── さいころ（既存16本と 同じ・種を 入れると 同じ 試合が 出る）───── */
  function rng(seed) {
    var s = (seed >>> 0) || 88172645;
    return function () {
      s ^= s << 13; s >>>= 0;
      s ^= s >> 17;
      s ^= s << 5;  s >>>= 0;
      return s / 4294967296;
    };
  }

  /* ============================================================
     ★ 札（設計図 §9・ルル §9）
       ・52枚。★ジョーカーは 使いません（ルル §1-4：手札 27枚に なる）。
       ・0〜51 … スート × 13 ＋ 数字（0=A … 7=8 … 10=J, 11=Q, 12=K）
       ・★読む 画像は 53個（52枚 ＋ トランプ裏赤）。★JOKER1・JOKER2 は 読みません。
     ============================================================ */
  var SUITS = ['スペード', 'ハート', 'ダイヤ', 'クローバー'];
  var MARKS = ['♠', '♥', '♦', '♣'];
  var RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  var DECK_N = 52;
  var BACK_NAME = 'トランプ裏赤';

  var R_A = 0, R_TWO = 1, R_EIGHT = 7, R_J = 10, R_Q = 11;

  function rankOf(c) { return c % 13; }
  function suitOf(c) { return (c / 13) | 0; }
  function nameOf(c) { return SUITS[suitOf(c)] + RANKS[rankOf(c)]; }

  /* ★ 遊ぶ前に まとめて 読む 53個（設計図 §9・2026-08-26 の 行）
     ★ 先頭は 裏面 ―― ★ロボット3人の 手札と 山ふだが ぜんぶ 裏。★いちばん 先に 要ります。 */
  function allNames() {
    var a = [BACK_NAME];
    for (var c = 0; c < DECK_N; c++) a.push(nameOf(c));
    return a;                            /* ★ 1 + 52 ＝ 53個 */
  }

  /* ============================================================
     ★★ 特殊札（★5種類 ぜんぶ 作る。★1つずつ ON/OFF）★★
     ------------------------------------------------------------
     ★ desc は 子どもが 読める 1行（設計図 §5.5-③）。★言葉づかいは §9.6。
     ★ gain は ルルの【計算・各8万試合】＝「気づく人の 得（単独で 入れた とき）」。
       ★ ここには 出しません（★画面に 数字を 出さない）。★覚え書きとして だけ 置きます。
     ============================================================ */
  /* ★★ T211 ―― ★引き方の 名前（★画面の 言葉は ルル §4-2 の とおり）★★ */
  var DRAW_MODES = [
    { id: 'one',   name: '1枚だけ 引く' },
    { id: 'until', name: '出せるまで 引く' }
  ];
  var DRAW_START = 'one';                 /* ★★ 初期値（★2026-09-03・社長の お決め）*/

  var RULES = [
    { id: 'eight', on: true,  name: '8＝マークを 決める',
      desc: '8は いつでも 出せる。次の マークを 自分で 決められる', gain: 6.8 },
    { id: 'jack',  on: false, name: 'J＝1人 飛ばす',
      desc: 'Jを 出すと、次の 人の 番を 飛ばす', gain: 1.0 },
    { id: 'two',   on: false, name: '2＝2枚 引かせる',
      desc: '2を 出すと 次の 人が 2枚 引く。2で 返すと 重なる', gain: 1.5 },
    { id: 'queen', on: false, name: 'Q＝ぎゃく 回り',
      desc: 'Qを 出すと、回る 向きが ぎゃくに なる', gain: 0.2 },
    { id: 'ace',   on: false, name: 'A＝もう1回',
      desc: 'Aを 出すと、もう1回 自分の 番', gain: 1.1 }
  ];
  /* ★★ 初期値は「8だけ ON」★★
     ★ 設計図 §5.5-②：★何も 触らずに 始めた 人が、★いちばん 深くて いちばん 短い 形で 遊べる。
     ★ ルル §1-2【計算】：★8の あとに 何を 足しても まっすぐ 下がる（6.8→6.1→5.0→4.9→4.3）。 */
  /* ============================================================
     ★★★★ T211 ―― ★★引き方（★社長ご指示・ルル T210 の 仕様）★★★★
     ------------------------------------------------------------
     ★ ★社長：「出せる札が でるまで 永遠と 山札を 引く、で やって いるけど、
       ★ ★★『出せる札が 引けるまで 引く』と『出せる札が ない ときは 1枚だけ 引く』を 選べるように」

     ★★ 'one'（1枚だけ）の 中身は **甲** です（★ルル §1）★★
       ★ ★引いた 1枚が 出せたら ―― ★★その場で 出せます（★引いたら 必ず 次の人、では ありません）。
       ★ ★★乙（引いたら 必ず 次の人）を ページワンの 決まりと 書いた 出どころは ★5件中 0件。

     ⚠️★★★ ★★RULES とは **別の 入れもの** です（★ルル §5-1）★★★
        ★ ★ RULES は 特殊札の 数えあげ（ruleCount）に 使われて います。
        ★ ★★ここに 混ぜると 数が 狂います ―― ★だから drawMode は 別に 置きます。

     ★★ 初期値は 'one'（★2026-09-03・社長の お決め）★★
       ★ ★2026-08-25 の お決め（「出せる札が あるまで 引き続ける」）を ★★ひっくり返します。
       ★ ★ルル T210【計算】：★手番の 99.9% が 308 → **92**／★手札の 最大 28枚 → **13枚**／
         ★ ★★1手番に 山を 押す 最大 25回 → **1回**／★24回の 打ち止め 593件 → **0件**。
         ★ ★★深さは −0.4 だけ（+7.7 → +7.3）。
     ============================================================ */
  function defaultRules() {
    var o = {};
    for (var i = 0; i < RULES.length; i++) o[RULES[i].id] = RULES[i].on;
    o.drawMode = DRAW_START;
    return o;
  }
  /* ★ 引き方を 読む ―― ★★'until' と はっきり 書いて ある ときだけ 引き続けます。
     ★ ★★＝ ★書き忘れ・古い 入れものは **1枚だけ**（★新しい 初期値）に なります。 */
  function drawModeOf(R) { return (R && R.drawMode === 'until') ? 'until' : 'one'; }
  function ruleCount(R) {
    var n = 0;
    for (var i = 0; i < RULES.length; i++) if (R[RULES[i].id]) n++;
    return n;
  }

  /* ============================================================
     ★★ 寸法 ―― ★1画面に 4つ 積みます ★★
     ------------------------------------------------------------
        ロボット3人の 手札（小さい 裏）
        ─ すきま ─
        まん中（山ふだ ／ 場ふだ ／ ハッピー）
        ─ すきま ─
        自分の 手札（表・★ふだんは 7枚）

     ★★ 設計図 追記③：★**ふだんの 見え方を 最大に する。**
        ★ 手札の 枠は **7枚ぶん**（★9割の 試合で 手札は 7枚のまま ―― ルル §4-3）。
        ★ 8枚を こえたら **静かに つめます**（重ねる）。★注意書きは 1文字も 出しません。
        ★ ★見切れは させません ―― ★重なっても 札は ぜんぶ 器の 中に 残ります。
     ============================================================ */
  var FIT = {
    RATIO_W: 419, RATIO_H: 635,   /* ★ 札の 比（設計図 §9）*/
    W_MAX: 100,                   /* ★ 札の はばの 上限（ピラミッド T76 から 16本 共通）*/
    W_MIN: 14,
    GAP_RATE: 0.06, GAP_MIN: 3,
    HAND_BASE: 7,                 /* ★★ 手札の 枠 ＝ 7枚（★配りの 枚数・9割は これ）*/
    BOT_RATE: 0.60,               /* ★ ロボットの 札の 大きさ（自分の 札の 60%）*/
    MID_RATE: 1.16,               /* ★ まん中の 帯 ＝ 札の 高さ × 1.16（山札・場札・ハッピー）*/
    NAME_H: 14,                   /* ★ ロボットの 名前の 1行 */
    PAD: 8
  };

  function cardH(w) { return Math.round(w * FIT.RATIO_H / FIT.RATIO_W); }
  function gapFor(w) { return Math.max(FIT.GAP_MIN, Math.round(w * FIT.GAP_RATE)); }

  /* ★ W×H（★上の帯を 引いた のこり）に、ぜんぶ 入る いちばん 大きい 札を さがす */
  function pickLayout(W, H) {
    for (var w = FIT.W_MAX; w >= FIT.W_MIN; w--) {
      var g = gapFor(w);
      if (FIT.HAND_BASE * w + (FIT.HAND_BASE - 1) * g > W) continue;
      var h = cardH(w);
      var bw = Math.max(10, Math.round(w * FIT.BOT_RATE));
      var bh = cardH(bw);
      var mid = Math.round(h * FIT.MID_RATE);
      var botH = bh + FIT.NAME_H;
      if (botH + FIT.PAD + mid + FIT.PAD + h > H) continue;
      return { w: w, h: h, g: g, bw: bw, bh: bh, botH: botH, mid: mid, perRow: FIT.HAND_BASE };
    }
    return fallbackLayout(W, H);
  }
  /* ★ どうしても 入らない ほど 小さい 窓（保険）。★ここに 来ても 壊れない ように だけ する */
  function fallbackLayout(W, H) {
    var w = Math.max(10, Math.min(FIT.W_MIN, Math.floor((W - 6 * FIT.GAP_MIN) / FIT.HAND_BASE)));
    var h = cardH(w), bw = Math.max(8, Math.round(w * FIT.BOT_RATE));
    return { w: w, h: h, g: FIT.GAP_MIN, bw: bw, bh: cardH(bw), botH: cardH(bw) + FIT.NAME_H,
             mid: Math.round(h * FIT.MID_RATE), perRow: FIT.HAND_BASE, tight: true };
  }

  /* ============================================================
     ★ 待ち時間（設計図 2026-08-24 裁定：★待ち時間は 遊びの 中身では ない。
        ★選ばせず、★速い側に 固定する）
     ============================================================ */
  var TUNE = {
    DEAL_STEP:     70,   /* ★ 1枚 配る ごと */
    BOT_THINK:    460,   /* ★ ロボットが 考える（★1手 ―― 七並べに そろえた 速い側）*/
    BOT_DRAW:     260,   /* ★ ロボットが 1枚 引く */
    BOT_SUIT:     420,   /* ★ ロボットが マークを 決めて 見せる */
    PLAY_MOVE:    260,   /* ★ 札が 場へ 飛ぶ */
    DRAW_MOVE:    240,   /* ★ 札が 山から 手札へ 飛ぶ */
    SKIP_SHOW:    520,   /* ★ 「とばす」「ぎゃく」などの しるし */
    SAY_HOLD:    1500,   /* ★ ハッピーの ひとことが 残る 時間 */
    RESULT_WAIT:  420,
    RESULT_LOCK:  550
  };

  /* ============================================================
     ★★★ 止まらない 試合の 正体（★T152 で 私が 突きとめた もの）★★★
     ------------------------------------------------------------
     ★ ルル §1-5【計算】：★(c) 出せるまで 引く だけ ★終わらない率 0.15%。
     ★ アイの 指示：★「原因は『山が尽きる』だと思われますが、確かめてから直してください」。

     ★★ 確かめました。★★**山が 尽きるのでは ありませんでした。**

     ★ 上限 1200手番 を 50万手番 に 上げても、★★同じ 試合が 同じだけ 残りました
       （★3万試合中 76件。★1200／5000／5万／50万 で **ぜんぶ 76件**）。
       ★★＝ 「長い」のでは なく、★★**永久に 終わらない**（★ぐるぐる 回っている）。

     ★★ 中を のぞいた 記録（★1試合の 終わりぎわ・私の しらべ）★★
     ```
       席0 引1 出ダイヤ8 → 場ダイヤ  手 20/13/9/6  山2 捨2
       席1 引1 出クローバー8 → 場スペード 手 20/13/9/6  山1 捨3
       席2 引1 出ハート8 → 場ダイヤ  手 20/13/9/6  山0 捨4
       席3 引1 出ダイヤ8 → 場クローバー 手 20/13/9/6  山2 捨2   ★ここから 同じ くり返し
     ```
     ★★ 起きて いる こと：
       ① ★(c) は 引き続ける ので、★52枚の うち **48枚が 手札に たまる**。
       ② ★残った 4枚は ―― ★★**8が 4枚**。★山と 場を 行ったり 来たり するだけ。
       ③ ★手番が 来た 人は 手札から 出せない → 引く → ★引けるのは 8 → ★8を 出す。
          ★★**手札は 1枚も 増えず、1枚も 減りません。**
       ④ ★8を 出した 人は 自分の いちばん 多い マークを 指定する
          → ★次の 人は その マークを 持って いない → ③へ もどる。
       ⑤ ★★4人の 手札が 1枚も 変わらない ので、★**同じ 場面が 永久に くり返します。**

     ★★ ＝ これは「山が 尽きた（引く 札が 無い）」では ありません。
        ★★ **8が 4枚だけで 回り続ける「止まらない わ（ループ）」** です。
        ★ だから ―― ★**「捨て札を まぜ直す」を 足しても 直りません**（★すでに まぜ直して います。
          ★あの 試合は 1200手番で **359回** まぜ直して いました）。

     ★★★ 直しかた（★これで 0.00% に なりました。★数字は §autoPlay）★★★
     ------------------------------------------------------------
     ★ 直せない 理由が はっきり しました ――
       ★★**札が 1枚も「場に たまらない」かぎり、どんな 決まりを 足しても わ は 切れません。**
       ★ 引く・出す・まぜ直す は ぜんぶ 札を 動かすだけ。★減る ものが 1つも ない。
     ★ だから ★**「減る もの」を 1つ 作りました** ―― ★**まぜ直せる 回数**。

       ```
       ★ 山が 空に なったら、場の 1番上を 残して まぜ直す（★16本と 同じ 作法）。
       ★★ ただし ―― ★まぜ直しは 1試合に MAX_MIX 回まで。
       ★★ そこを こえたら、★その 場で 試合を 終える ―― ★★手札が いちばん 少ない 人の 勝ち。
       ```

     ★ ★★終わることの 証明（★試して 出た 数字では なく、★式で 言えます）：
        ★ まぜ直しの あいだ、山は 1枚も 増えません（★増えるのは まぜ直しの ときだけ）。
        ★ 1手番で かならず「山が 減る」か「手札が 減る」か どちらかが 起きます。
        ★ ＝ ★（山 ＋ 手札の 合計）は 1手番ごとに 必ず 1以上 減る。
        ★ 上限は 51枚。★＝ ★まぜ直し 1回ぶんの あいだに 高々 51手番。
        ★★ まぜ直しが MAX_MIX 回までなら、★★手番は 高々 51×(MAX_MIX+1) で 必ず 終わります。

     ★ ★MAX_MIX を いくつに するか ―― ★**ふつうの 試合が ほとんど 当たらない**ところ。
       ★ 数えました【計算・20万試合・8だけON・上限なし】：
         ★ まぜ直し 1回 以上 … 40.9%／3回 以上 9.2%／8回 以上 0.90%／14回 以上 0.21%
         ★ ★止まらない 試合は 0.14%。★＝ ★14回を こえる 試合の **3分の2 は もう 回って います**。
       ★ ★24回で 数え直しました【計算・各6万試合・3つの 形】：
         ★ ★終わらない 試合 ………………… ★★**0件**（★8だけ／ぜんぶOFF／ぜんぶON の どれでも）
         ★ ★山切れで 終わった 試合 ……… ★8だけ **0.14%**（★700試合に 1回）
         ★ ★手番の 99.9% ………………… 322手番（★上限を 12に しても 301。★ほとんど 変わらない）
       ★ → ★★**MAX_MIX = 24**。

     ★ ★★回り道を 1つ 書いて おきます【T152・私の 回り道】★★
       ★ はじめは もう 1つ 止め方を 入れて いました ――
         ★「★まぜ直しても 山が 4枚（人数）に 満たなければ 山切れ」。
       ★ ★これでも 終わらない 試合は 0件に なりました。★でも 数え直したら ――
         ★★**特別な 札を ぜんぶ OFF に した とき、山切れが 1.63% に はね上がって いました**
         ★（★まぜ直しの 回数だけに したら 0.07%）。★★24試合に 1回 も 出る 終わり方は 多すぎます。
       ★ → ★★**外しました。**★止め方は 少ないほど よい ―― ★同じ 0件なら、★静かな ほうを 取ります。

     ★ ★★これは「まれな 最悪ケースを 静かに 受け流す」（設計図 追記③）そのものです。
        ★ **注意書きは 1文字も 出しません。**★画面には ふつうに 勝ち負けが 出るだけ。
     ============================================================ */
  /* ★ LIM は **数える ときに 差しかえられる** ように 物（object）で 持ちます。
     ★ ★verify は「MAX_MIX を 大きく したら 止まらない 試合が 出る」ことも 見張ります
       ―― ★★見張りが「無い こと」だけ 見て いると、直しごと 消えても 通る（T144 §7-4 の 教訓）。 */
  var LIM = {
    MIX: 24,      /* ★★ 1試合に まぜ直せる 回数 ―― ★これが「減る もの」です（★上の 長い 注）*/
    PLY: 4000     /* ★ 数える ときの 保険 ―― ★遊ぶ 画面は これを 1度も 見ません。
                     ★ ここに 当たったら「詰まり」に 数える（★verify が 見張る）。
                     ★ ★ぜんぶ ON の 試合は 600手番を こえる ことが あります【計算・4万試合に 1件】。
                       ★ 600 に して いた とき、★その 1件を「終わらない」と 誤って 数えました。 */
  };
  var MAX_MIX = LIM.MIX;    /* ★ 覚え書き（★中では 使いません）*/
  var PLY_CAP = LIM.PLY;

  /* ============================================================
     ★★ 試合（core）★★
     ------------------------------------------------------------
     ★ 手札は 入れもの（slot）の ならび：{ id, c }
       ★ id ＝ 通し番号。★画面は これで 1枚を 追いかけます（★ババ抜き T144 と 同じ 作法）。
     ★ 席0 が 人。★★人が いつも 先手（ルル §3-5：先手かどうかで 4.9ポイント 動く）。
     ============================================================ */
  function makeGame(rand, opt) {
    opt = opt || {};
    var R = opt.rules || defaultRules();
    var nP = opt.players || 4;
    var hN = opt.hand || 7;
    var nextId = 1;
    function slot(c) { return { id: nextId++, c: c }; }

    /* ★ 52枚を まぜる */
    var deck = [];
    for (var c = 0; c < DECK_N; c++) deck.push(c);
    for (var i = deck.length - 1; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1));
      var t = deck[i]; deck[i] = deck[j]; deck[j] = t;
    }

    var hands = [], p;
    for (p = 0; p < nP; p++) hands.push([]);
    for (var k = 0; k < hN; k++) for (p = 0; p < nP; p++) hands[p].push(slot(deck.pop()));

    /* ★ 場の 1枚目は ふつうの札に なるまで めくる（★特殊札から 始めない）
       ★ めくった 特殊札は 山の 下へ もどす ―― ★捨てません（52枚 きっちり 合わせる）。 */
    var first = deck.pop();
    while (isSpecial(first, R)) { deck.unshift(first); first = deck.pop(); }

    var g = {
      rules: R, nP: nP, handN: hN,
      hands: hands,
      deck: deck.map(slot),               /* ★ 山ふだ（★うしろが 一番上）*/
      pile: [slot(first)],                /* ★ 場ふだ（★うしろが 一番上）*/
      suit: suitOf(first),                /* ★ いま 出せる マーク（★8で 変わる）*/
      rank: rankOf(first),                /* ★ いま 出せる 数字（★8を 出したら 7＝8 に なる）*/
      cur: 0,                             /* ★ 手番（0 ＝ 人）*/
      dir: 1,                             /* ★ まわる 向き（Q で 反転）*/
      pending: 0,                         /* ★ 2 が かさなって いる 枚数 */
      over: false, winner: -1, byShort: false,
      plays: 0, draws: 0, mixes: 0, stuck: false,
      drew: 0,                                 /* ★★ T211：★この 手番で 引いた 枚数 */
      rand: rand, nextId: function () { return nextId; }
    };
    return g;
  }

  function isSpecial(c, R) {
    var r = rankOf(c);
    return (R.eight && r === R_EIGHT) || (R.jack && r === R_J) ||
           (R.two && r === R_TWO) || (R.queen && r === R_Q) || (R.ace && r === R_A);
  }

  /* ★ 場の 一番上 */
  function topOf(g) { return g.pile[g.pile.length - 1]; }
  function topIsEight(g) { return g.rules.eight && rankOf(topOf(g).c) === R_EIGHT; }

  /* ============================================================
     ★ 出せる札（★これが ぜんぶ。★ルールは ここ 1か所に しか ありません）
     ------------------------------------------------------------
     ★ 引かされて いる とちゅう（2が かさなって いる）は、★2 でしか 返せません。
     ★ ふだんは ―― ★おなじ マーク か ★おなじ 数字。★8は いつでも。
     ============================================================ */
  function legalIdx(g, seat) {
    var hand = g.hands[seat], out = [], i;
    if (g.pending > 0) {
      for (i = 0; i < hand.length; i++) if (rankOf(hand[i].c) === R_TWO) out.push(i);
      return out;
    }
    for (i = 0; i < hand.length; i++) {
      var c = hand[i].c;
      if (g.rules.eight && rankOf(c) === R_EIGHT) { out.push(i); continue; }
      if (suitOf(c) === g.suit) { out.push(i); continue; }
      if (rankOf(c) === g.rank) { out.push(i); continue; }
    }
    return out;
  }
  function canPlay(g, seat) { return legalIdx(g, seat).length > 0; }

  /* ============================================================
     ★★ 1枚 引く ★★
     ------------------------------------------------------------
     ★ 返り … { ok, card, id, mixed, ended }
     ★ ★人が 引くのは「山を 押した とき だけ」（設計図 追記④）。★core は 勝手に 引きません。
     ============================================================ */
  function drawOne(g, seat) {
    var mixed = false;
    g.drew = (g.drew || 0) + 1;               /* ★★ T211：★この 手番で 引いた 枚数 */
    if (g.deck.length === 0) {
      /* ★★ 山切れ ―― ★2つの どちらかで 終わります ★★
         ① ★場に 1枚しか 無い（★山に もどせる 札が 1枚も 無い）
         ② ★★まぜ直しの 回数を 使い切った（LIM.MIX）
            ―― ★★これが「8が 4枚だけで 回り続ける」わ を 切る 所 です。 */
      if (g.pile.length <= 1 || g.mixes >= LIM.MIX) { endByShort(g); return { ok: false, why: 'short' }; }
      /* ★ 場の 1番上を 残して、のこりを まぜて 山に もどす（★16本と 同じ 作法）*/
      var keep = g.pile.pop();
      var rest = g.pile.splice(0, g.pile.length);
      for (var i = rest.length - 1; i > 0; i--) {
        var j = Math.floor(g.rand() * (i + 1));
        var t = rest[i]; rest[i] = rest[j]; rest[j] = t;
      }
      g.deck = rest;
      g.pile = [keep];
      g.mixes++;
      mixed = true;
    }
    var s = g.deck.pop();
    g.hands[seat].push(s);
    g.draws++;
    return { ok: true, card: s.c, id: s.id, mixed: mixed };
  }

  /* ★★ まぜ直しの 上限に 当たった ―― ★手札が いちばん 少ない 人の 勝ち ★★
     ★ 同じ 枚数が いたら、★手番が 先の 人（★人が 先手なので 人が 有利側）。 */
  function endByShort(g) {
    var best = 0;
    for (var p = 1; p < g.nP; p++) if (g.hands[p].length < g.hands[best].length) best = p;
    g.over = true; g.winner = best; g.byShort = true;
  }

  /* ============================================================
     ★★ 1枚 出す ★★
     ------------------------------------------------------------
     ★ suit … ★8を 出した ときに 選んだ マーク（0〜3）。
       ★★ core は **受け取るだけ** です。★★自分では 1度も 決めません
          ―― ★ここが 設計図 追記② の 線（ルル §8-b「絶対に 自動化しない」）。
       ★ 8いがいの 札では 使いません。
     ★ 返り … { ok, card, id, effect, skip, extra, over, winner }
     ============================================================ */
  function playCard(g, seat, idx, suit) {
    var hand = g.hands[seat];
    if (idx < 0 || idx >= hand.length) return { ok: false, why: 'そんな 札は ありません' };
    var ok = legalIdx(g, seat);
    if (ok.indexOf(idx) < 0) return { ok: false, why: 'その 札は 出せません' };

    var s = hand.splice(idx, 1)[0], c = s.c, r = rankOf(c);
    g.pile.push(s);
    g.plays++;

    var out = { ok: true, card: c, id: s.id, effect: '', skip: 0, extra: false };

    g.rank = r;
    if (g.rules.eight && r === R_EIGHT) {
      /* ★★ マークは 外から もらう。★undefined なら 出した札の マークの まま（保険）★★
         ★ 画面は 必ず 選ばせます。★ここに 「よさそうな マーク」を 書いては いけません。 */
      g.suit = (suit === 0 || suit === 1 || suit === 2 || suit === 3) ? suit : suitOf(c);
      out.effect = 'eight';
    } else {
      g.suit = suitOf(c);
      if (g.rules.two && r === R_TWO) { g.pending += 2; out.effect = 'two'; }
      else if (g.rules.jack && r === R_J) { out.skip = 1; out.effect = 'jack'; }
      else if (g.rules.queen && r === R_Q) { g.dir = -g.dir; out.effect = 'queen'; }
      else if (g.rules.ace && r === R_A) { out.extra = true; out.effect = 'ace'; }
    }

    if (hand.length === 0) { g.over = true; g.winner = seat; }
    out.over = g.over; out.winner = g.winner;
    return out;
  }

  /* ★ 2が かさなって いて 返せない ―― ★まとめて 引いて 番は 終わり */
  function takePending(g, seat) {
    var n = g.pending, got = [];
    g.pending = 0;
    for (var i = 0; i < n; i++) {
      var r = drawOne(g, seat);
      if (!r.ok) break;
      got.push(r);
    }
    return got;
  }

  /* ★ 次の 席へ（★skip 枚ぶん とばす。★extra なら 動かない）*/
  function nextTurn(g, skip, extra) {
    if (g.over) return g.cur;
    /* ★★ T211 ―― ★★「この 手番で 何枚 引いたか」は **盤の 側**に 置きます ★★
       ★ ★★はじめ 画面側の 変数に 置いて いました ―― ★★見張りが 6件 鳴りました。
         ★ ★見張りは 盤を 手で 組み立てる ので、★画面側の 数だけ 古いまま 残る から です
         ★ ★【★私の 失敗・T211。★セブンブリッジ T205-4 と 同じ 形 です】。
       ★ ★★手番が 変わる ところは ここ 1つ ―― ★だから ここで 0に 戻します。 */
    g.drew = 0;
    if (extra) return g.cur;
    var n = 1 + (skip || 0);
    for (var i = 0; i < n; i++) g.cur = ((g.cur + g.dir) % g.nP + g.nP) % g.nP;
    return g.cur;
  }

  /* ============================================================
     ★★ ロボット（社長裁定：★選ばせない。★いつも いちばん つよい）★★
     ------------------------------------------------------------
     ★ ルル §3-3：★段は 2つしか 作れない。★弱い方は「考えて いない」だけ。
       ★ ★3段目を 作るには「見えて いるのに わざと 出さない」が 要る
         ―― ★★この会社が 5回 落とした 壁（T60/T78/T88/T126/T133）。★作りません。
     ★ ルル §3-4：★ページワンの 手ごたえは「8を いつ 使うか」から 来る。
       ★ ★つよい ロボット 3体 相手でも、ふつうに 打てば 27.6% 勝てます（五分 25%）。

     ★ 中身（ルル §3-1 の「つよい」を そのまま 写した もの）：
       ① ★8は 最後の 手段（★ためる）
       ② ★1手先の つながり（outs）が いちばん 多い 札を 出す
       ③ ★次の 人が 残り少ないなら J・2 を そこで 撃つ
       ④ ★8の マークは「自分が いちばん 多く 持って いる マーク」
     ★ lv 1 は ★数える とき だけ 使う「気づかない 人」の 模型です（★画面からは 通りません）。
     ============================================================ */
  var P = { thr: 3, hit: 6, hold: 1.2 };

  function suitCount(hand, s) {
    var n = 0;
    for (var i = 0; i < hand.length; i++) if (suitOf(hand[i].c) === s) n++;
    return n;
  }
  function bestSuit(hand) {
    var b = 0, bn = -1;
    for (var s = 0; s < 4; s++) { var n = suitCount(hand, s); if (n > bn) { bn = n; b = s; } }
    return b;
  }
  /* ★ その 札を 出した あと、自分の 手札の うち 次に つながる 枚数（★1手先の 見とおし）*/
  function outsAfter(hand, idx, R) {
    var c = hand[idx].c, n = 0;
    for (var i = 0; i < hand.length; i++) {
      if (i === idx) continue;
      var d = hand[i].c;
      if (R.eight && rankOf(d) === R_EIGHT) { n++; continue; }
      if (suitOf(d) === suitOf(c) || rankOf(d) === rankOf(c)) n++;
    }
    return n;
  }

  /* ★ 出す 札を えらぶ。★返り … { idx, suit }
     ★ suit は ★8の ときだけ 意味を 持ちます（★ロボットは 自分で 決める。★人は 画面が 聞く）。 */
  function botChoose(g, seat, lv) {
    lv = lv || 3;
    var hand = g.hands[seat], R = g.rules;
    var ok = legalIdx(g, seat);
    if (!ok.length) return null;
    if (ok.length === 1) return { idx: ok[0], suit: suitAfter(g, seat, ok[0]) };
    if (lv === 1) {
      var pick = ok[Math.floor(g.rand() * ok.length) % ok.length];
      return { idx: pick, suit: Math.floor(g.rand() * 4) % 4 };
    }
    var rest = hand.length;
    var nxt = ((g.cur + g.dir) % g.nP + g.nP) % g.nP;
    var nxtN = g.hands[nxt].length;
    var best = ok[0], bestSc = -1e9;
    for (var i = 0; i < ok.length; i++) {
      var idx = ok[i], c = hand[idx].c, r = rankOf(c), sc;
      if (R.eight && r === R_EIGHT) {
        sc = suitCount(hand, bestSuit(hand)) - 3;            /* ★ 8は 最後の 手段 */
      } else if (lv >= 3) {
        sc = outsAfter(hand, idx, R) - 1 + (rest <= 3 ? 2 : 0);
      } else {
        sc = suitCount(hand, suitOf(c)) - 1 + (rest <= 3 ? 2 : 0);
      }
      if (lv >= 3) {
        var atk = (R.jack && r === R_J) || (R.two && r === R_TWO) ||
                  (R.queen && r === R_Q && g.nP === 2);
        if (atk) sc += (nxtN <= P.thr) ? P.hit : -P.hold;
      }
      if (sc > bestSc) { bestSc = sc; best = idx; }
    }
    return { idx: best, suit: suitAfter(g, seat, best) };
  }
  /* ★ ロボットが 8を 出す ときの マーク（★自分が いちばん 多く 持って いる マーク）*/
  function suitAfter(g, seat, idx) {
    var hand = g.hands[seat];
    if (!(g.rules.eight && rankOf(hand[idx].c) === R_EIGHT)) return suitOf(hand[idx].c);
    var rest = hand.slice(0, idx).concat(hand.slice(idx + 1));
    return rest.length ? bestSuit(rest) : suitOf(hand[idx].c);
  }

  /* ============================================================
     ★ 試合を 1回 走らせる（★数える とき だけ。★画面は 通りません）
     ------------------------------------------------------------
     ★ levels[i] … 席i の 打ち手（1 ＝ 気づかない 人／3 ＝ いちばん つよい）
     ★ 出せない ときは ★**出せる札が 来るまで 引く**（社長裁定・ルル (c)）
     ============================================================ */
  function simGame(rand, opt) {
    opt = opt || {};
    var g = makeGame(rand, opt);
    var lv = opt.levels || [3, 3, 3, 3];
    g.drewMax = 0; g.drewSum = 0; g.passN = 0;             /* ★ T211：★引いた 枚数・出せず 終わった 数 */
    var ply = 0, myMax = g.handN, anyMax = g.handN, opt2 = 0, optSum = 0, optTurns = 0;
    var reach1 = 0, was1 = false;

    while (!g.over && ply < LIM.PLY) {
      ply++;
      var seat = g.cur, skip = 0, extra = false;

      if (g.pending > 0 && !canPlay(g, seat)) {
        takePending(g, seat);
        if (g.over) break;
        if (g.stuck) break;
      } else {
        /* ★★ T211 ―― ★引き方は 2つ（★ルル T210 §5-2）★★
           ★ ★'until' … ★出せる札が 来るまで 引く（★いままでの 形。★1文字も 変えて いません）
           ★ ★'one' …… ★★出せない ときだけ **1枚**。★出せれば その場で 出せます（★甲）*/
        var mode = drawModeOf(g.rules);
        var guard = 0, drewN = 0;
        if (mode === 'one') {
          if (!canPlay(g, seat)) { var d1 = drawOne(g, seat); if (d1.ok) drewN++; }
        } else {
          while (!canPlay(g, seat) && guard++ < 120) {
            var d = drawOne(g, seat);
            if (!d.ok) break;
            drewN++;
          }
        }
        if (drewN > g.drewMax) g.drewMax = drewN;          /* ★ 見張り用：1手番に 引いた 最大 */
        g.drewSum += drewN;
        if (g.over) break;
        if (g.stuck) break;
        if (seat === 0) {
          var l = legalIdx(g, 0);
          optTurns++; optSum += l.length; if (l.length >= 2) opt2++;
          if (g.hands[0].length === 1) { if (!was1) { reach1++; was1 = true; } } else was1 = false;
        }
        /* ★★ 1枚だけ 引いても 出せなかった ―― ★出さずに 手番を おわります（★ルル §5-2）*/
        if (mode === 'one' && !canPlay(g, seat)) {
          g.passN++;
        } else {
          var ch = botChoose(g, seat, lv[seat]);
          if (!ch) break;                                  /* ★ ここに 来たら 詰まり */
          var r = playCard(g, seat, ch.idx, ch.suit);
          if (!r.ok) break;
          skip = r.skip; extra = r.extra;
        }
      }
      for (var p = 0; p < g.nP; p++) {
        if (g.hands[p].length > anyMax) anyMax = g.hands[p].length;
        if (p === 0 && g.hands[0].length > myMax) myMax = g.hands[0].length;
      }
      if (g.over) break;
      nextTurn(g, skip, extra);
    }
    g.ply = ply;
    g.myMax = myMax; g.anyMax = anyMax;
    g.opt = optTurns ? optSum / optTurns : 0;
    g.opt2 = optTurns ? opt2 / optTurns : 0;
    g.reach1 = reach1;
    g.timeout = (ply >= LIM.PLY);
    return g;
  }

  function newStat() {
    return { games: 0, win: 0, plays: 0, draws: 0, mixes: 0, mixGames: 0, mixCap: 0,
             nofin: 0, stuck: 0, illegal: 0, cardsBad: 0, myMax: 0, anyMax: 0,
             opt: 0, opt2: 0, reach1: 0, plies: [], myMaxes: [], mixList: [] };
  }

  /* ★ 札が 52枚 きっちり 残って いるか（★1枚も 増えず・減らず）*/
  function cardsOK(g) {
    var seen = {}, n = 0, p, i;
    for (p = 0; p < g.nP; p++) for (i = 0; i < g.hands[p].length; i++) { seen[g.hands[p][i].c] = 1; n++; }
    for (i = 0; i < g.deck.length; i++) { seen[g.deck[i].c] = 1; n++; }
    for (i = 0; i < g.pile.length; i++) { seen[g.pile[i].c] = 1; n++; }
    var kinds = 0;
    for (var k in seen) if (seen.hasOwnProperty(k)) kinds++;
    return (n === DECK_N && kinds === DECK_N);
  }

  function runMany(games, seed, opt) {
    opt = opt || {};
    var st = newStat();
    for (var i = 0; i < games; i++) {
      var g = simGame(rng((seed >>> 0) + i * 7919), opt);
      st.games++;
      if (g.winner === 0) st.win++;
      st.plays += g.plays; st.draws += g.draws; st.mixes += g.mixes;
      if (g.mixes) st.mixGames++;
      if (g.byShort) st.mixCap++;
      if (g.winner < 0) st.nofin++;
      if (g.stuck) st.stuck++;
      if (g.timeout) st.nofin += 0;                    /* ★ timeout は winner<0 で すでに 数えて いる */
      if (!cardsOK(g)) st.cardsBad++;
      if (g.myMax > st.myMax) st.myMax = g.myMax;
      if (g.anyMax > st.anyMax) st.anyMax = g.anyMax;
      st.opt += g.opt; st.opt2 += g.opt2; st.reach1 += g.reach1;
      st.plies.push(g.ply); st.myMaxes.push(g.myMax); st.mixList.push(g.mixes);
    }
    return st;
  }

  function pct(a, f) {
    var s = a.slice().sort(function (x, y) { return x - y; });
    return s[Math.min(s.length - 1, Math.floor(s.length * f))];
  }

  root.PAGEONE_CORE = {
    SUITS: SUITS, MARKS: MARKS, RANKS: RANKS, DECK_N: DECK_N, BACK_NAME: BACK_NAME,
    R_A: R_A, R_TWO: R_TWO, R_EIGHT: R_EIGHT, R_J: R_J, R_Q: R_Q,
    rankOf: rankOf, suitOf: suitOf, nameOf: nameOf, allNames: allNames,
    RULES: RULES, defaultRules: defaultRules, ruleCount: ruleCount, isSpecial: isSpecial,
    DRAW_MODES: DRAW_MODES, DRAW_START: DRAW_START, drawModeOf: drawModeOf,
    FIT: FIT, TUNE: TUNE, LIM: LIM, MAX_MIX: MAX_MIX, PLY_CAP: PLY_CAP,
    cardH: cardH, gapFor: gapFor, pickLayout: pickLayout,
    rng: rng, makeGame: makeGame, topOf: topOf, topIsEight: topIsEight,
    legalIdx: legalIdx, canPlay: canPlay, drawOne: drawOne, playCard: playCard,
    takePending: takePending, nextTurn: nextTurn, endByShort: endByShort,
    botChoose: botChoose, suitAfter: suitAfter, bestSuit: bestSuit, suitCount: suitCount,
    outsAfter: outsAfter,
    simGame: simGame, runMany: runMany, newStat: newStat, cardsOK: cardsOK, pct: pct
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.PAGEONE_CORE;

})(typeof globalThis !== 'undefined' ? globalThis : this);
