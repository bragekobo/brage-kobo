/* ============================================================
   ババ抜き ― ルール・ロボット・寸法（T144・コーダ）
   ------------------------------------------------------------
   ★ このファイルは document を 1度も さわりません。
     ＝ Node でも そのまま 走る ＝ 数える 側と 遊ぶ 側が ズレようが ない
     （ピラミッド T76 の CORE・リバーシ T89・四目並べ T127 と 同じ 作法。
      ★ルル §9-3 の「分けると 必ず ずれます」）。

   ★★★ この 1本の 命 ―― 「追える形」（社長裁定 判断2）★★★
     ------------------------------------------------------------
     ★ 引かれた 札を **まぜ直しません**。
     ★ ＝ 遊ぶ人は「さっき 取られた 札が いま どこに あるか」を 目で 追えます。
     ★ ルル §1-3：★これで 負ける割合が **50.4% → 29.8%（20.6ポイント）** 動きます。
     ★ まぜ直したら、この 1本の 遊びは **ゼロ**に なります（ルル §1-6）。

     ★ どう 作ったか ―― ★**手札を「札」では なく「入れもの（slot）」の ならび**に しました。

         g.me  = [{ id, c }, …]      ★ id ＝ 通し番号。一度 振ったら 変わらない
         g.bot = [{ id, c }, …]

       ・★ロボットの 手札に 足すのは **いつも 右はし**（push）。
       ・★組が 消えても、残りの ならびは 1つも 動かない（splice だけ）。
       ・★**並べ直す（sort・reverse・shuffle）行は、この ファイルに 1つも ありません。**
         ★ babanuki-game.js の verify が、文字列でも ならびでも 見張ります。

   ★★★ ロボットが ずるを できない 作り（ルル §3-5）★★★
     ------------------------------------------------------------
     ★ ロボットの pick() に 渡すのは ―― ★★**人の 手札の id の ならび だけ**。
       ★ 中身（c ＝ 札）は **1つも 渡りません**。★＝ のぞこうにも 手が 無い。
     ★ ロボットが 覚えるのは **id が 1つ**（★ばばが 入った 入れもの）。
       ★ それは「引かれた 札が どこに 入ったか を 見た」という こと そのもの
         ―― ★人にも 同じだけ 見えて います（§2-4 の ものさし）。
     ★ 段（つよさ）は ありません（社長裁定 判断4）。★ロボットは いつも 1段 ＝「見ている」。
     ★ 読みは ゼロ・1手 0ms。★安全弁も 要りません（ルル §9-1）。

   ★★ 2人ババ抜きの 式（ルル §1-1・ここが すべてを 決めます）★★
     ------------------------------------------------------------
       ★ はじめに 組を すてると、どちらの 手札にも 同じ 数字は 2枚 残らない。
       ★ 1つの 数字は 4枚 ある ので、両方の 手札に 「1枚ずつ 残る」か「両方 0枚」か の
         どちらか しか ない。
       → ★★ 相手の 手札は「ぜんぶ 当たり」＋「ばば 1枚」だけ で できている。
       → ★★ 引いて 組に ならない 札は、★ばば ただ 1枚 だけ。
       → ★★ だから 引き分けは 0%。★必ず どちらかに ばばが 残る（ルル §7-2）。
     ★ この 式は core の checkPairInvariant() で 毎試合 たしかめて います。
   ============================================================ */
(function (root) {
  'use strict';

  /* ── さいころ（既存15本と 同じ・種を 入れると 同じ 試合が 出る）───── */
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
     ★ 札（設計図 §9・ルル §4-2）
       ・53枚 ＝ 52枚 ＋ ばば（JOKER1）1枚。★動かしません。
       ・0〜51 … スート × 13 ＋ 数字（0=A … 12=K）
       ・52    … ★ばば
       ・★読む 画像は 54個（52枚 ＋ JOKER1 ＋ トランプ裏赤）。JOKER2 は 読みません。
       ★ 「マーク」「スート」「色」は 画面に 1度も 出しません（ルル §8-2）。
         ★ 遊びに 使うのは **数字だけ** です。
     ============================================================ */
  var SUITS = ['スペード', 'ハート', 'ダイヤ', 'クローバー'];
  var RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  var JOKER = 52;                       /* ★ ばば */
  var DECK_N = 53;
  var BACK_NAME = 'トランプ裏赤';
  var JOKER_NAME = 'JOKER1';

  function rankOf(c) { return (c === JOKER) ? -1 : (c % 13); }
  function suitOf(c) { return (c === JOKER) ? -1 : ((c / 13) | 0); }
  function nameOf(c) { return (c === JOKER) ? JOKER_NAME : (SUITS[suitOf(c)] + RANKS[rankOf(c)]); }

  /* ★ 遊ぶ前に まとめて 読む 54個（設計図 §9・2026-08-26 の 行）*/
  function allNames() {
    var a = [BACK_NAME];                /* ★ 裏面が 主役。★いちばん 先（ルル §4-2 の ⚠️）*/
    for (var c = 0; c < DECK_N; c++) a.push(nameOf(c));
    return a;                           /* ★ 1 + 53 ＝ 54個 */
  }

  /* ============================================================
     ★★ 寸法（ルル §5-2 の fit() を そのまま）★★
     ------------------------------------------------------------
     ★ ルルの 式：
         for (w = 100; w >= 14; w--) {
           g = max(3, round(w * 0.06));
           よこ … perRow*w + (perRow-1)*g <= W
           h = round(w * 635 / 419);
           handH = rows*h + (rows-1)*g;
           たて … 24 + 8 + handH + 8 + round(h*1.1) + 8 + handH <= H
         }
     ★ ここでは「帯（24）と そのすぐ下の すきま（8）を 引いた のこり」を H に 渡します
       ―― ★上の帯は 別の 行なので、実寸を 測って 引く 方が 正しい（★帯は 指の 画面で 44px）。
     ★ ＝ ルルの H から 32 を 引いた ものが、ここの H です。
     ★ 札の 比は 419:635（設計図 §9）。★上限 100px（ルル §5-4 の 6番・ピラミッド T76 から）。
     ============================================================ */
  var FIT = {
    RATIO_W: 419, RATIO_H: 635,   /* ★ 札の 比（設計図 §9）*/
    W_MAX: 100,                   /* ★ 札の はばの 上限（ルル §5-4）*/
    W_MIN: 14,
    GAP_RATE: 0.06, GAP_MIN: 3,   /* ★ 間 g ＝ はばの 6%（最小 3px）*/
    HAPPY_RATE: 1.1,              /* ★ ハッピーの 高さ ＝ 札の 高さ × 1.1 */
    PAD: 8,                       /* ★ 帯と 手札の すきま */
    BAR: 24,                      /* ★ ルルの 表を 再現する ときの 帯（★実機では 実寸を 使う）*/
    HAND_MAX: 14,                 /* ★★ 手札の 枠の 数 ＝ 14（式で 決まる・ルル §5-1）
                                        ★ 数字 13しゅるい ＋ ばば 1枚。★見立てでは ない */
    ROW_MAX: 7                    /* ★ 2段に する ときの 1段の 枚数（14 ÷ 2）*/
  };

  function cardH(w) { return Math.round(w * FIT.RATIO_H / FIT.RATIO_W); }
  function gapFor(w) { return Math.max(FIT.GAP_MIN, Math.round(w * FIT.GAP_RATE)); }

  /* ★ W×H（★帯と そのすきまを 引いた のこり）に、perRow×rows の 手札 2つ ＋ ハッピーが 入るか */
  function fitHands(W, H, perRow, rows) {
    for (var w = FIT.W_MAX; w >= FIT.W_MIN; w--) {
      var g = gapFor(w);
      if (perRow * w + (perRow - 1) * g > W) continue;
      var h = cardH(w);
      var handH = rows * h + (rows - 1) * g;
      var happy = Math.round(h * FIT.HAPPY_RATE);
      if (handH + FIT.PAD + happy + FIT.PAD + handH > H) continue;
      return { w: w, h: h, g: g, handH: handH, happy: happy, perRow: perRow, rows: rows };
    }
    return null;
  }

  /* ★★ 切りかえの 決まり（ルル §5-2）★★
     ★ 1段14枚 と 7枚×2段 の 両方を 計算して、★**札が 大きくなる 方**を 使う。
     ★ 同じ 大きさなら 1段（★段が 少ない 方が 目で 追いやすい）。 */
  function pickLayout(W, H) {
    var one = fitHands(W, H, FIT.HAND_MAX, 1);
    var two = fitHands(W, H, FIT.ROW_MAX, 2);
    if (!one && !two) return fallbackLayout(W, H);
    if (!one) return two;
    if (!two) return one;
    return (one.w >= two.w) ? one : two;
  }
  /* ★ どうしても 入らない ほど 小さい 窓（保険）。★ここに 来ても 壊れない ように だけ する */
  function fallbackLayout(W, H) {
    var w = Math.max(10, Math.min(FIT.W_MIN, Math.floor((W - 13 * FIT.GAP_MIN) / FIT.HAND_MAX)));
    var h = cardH(w);
    return { w: w, h: h, g: FIT.GAP_MIN, handH: h, happy: Math.round(h * FIT.HAPPY_RATE),
             perRow: FIT.HAND_MAX, rows: 1, tight: true };
  }

  /* ★ ルルの 表（§5-2）を そのまま 再現する ための 窓口。★H は ルルの「器の中身」の たて */
  function fitRuru(W, H) { return pickLayout(W, H - FIT.BAR - FIT.PAD); }

  /* ============================================================
     ★ 待ち時間（ルル §2-4・§7-1・§5-4）
       ★★ FINGER_HOLD ＝ 600ms は **この1本の 顔**です（ルル §2-4）。
          ★ うっかり 縮めない・飛ばさない こと。★直すのは ここ 1か所 だけ。
     ============================================================ */
  var TUNE = {
    FIRST_DISCARD: 1500,  /* ★ はじめの 組すて（まとめて ぱっと・ルル §7-1）*/
    DEAL_FLIP:      300,  /* ★ 配った 札を 表に する */
    FINGER_SLIDE:   500,  /* ★ ロボットの 指が すべる（ルル §2-4）*/
    FINGER_HOLD:    600,  /* ★★ ロボットの 指が 止まる 0.6秒 ―― ★この1本の 顔 */
    DRAW_FLIP:      200,  /* ★ 引いた 札が 表に なる */
    PAIR_POP:       150,  /* ★ 手札の 中の 相手が ぴょこっと 上がる */
    SHOW:           600,  /* ★ 2枚を 見せる ＝ ばばを 引いた ときも **同じ 0.6秒**
                                 ★ 時間で 中身を 教えない（ルル §7-1）*/
    PAIR_VANISH:    300,  /* ★ 2枚 いっしょに 小さくなって 消える */
    LIFT:           140,  /* ★ 札が 浮く（ルル §5-4：120〜160ms）*/
    LOSE_ZOOM:      500,  /* ★ 負けた とき、ばば 1枚が すこし 大きくなる（ルル §7-2）*/
    RESULT_WAIT:    260,  /* ★ 結果の 箱が 出るまで */
    RESULT_LOCK:    550   /* ★ 箱が 出てから おせるまで（既存15本と 同じ 作法）*/
  };

  /* ============================================================
     ★★ 試合（core）★★
     ------------------------------------------------------------
     ★ 手札は 入れもの（slot）の ならび：{ id, c }
     ★ 人の 手札 … 数字の 順。★ばばだけ でたらめな 場所へ（ルル §5-3）
     ★ ロボットの 手札 … ★★入った 順の まま。★ぜったいに 並べ直さない
     ============================================================ */
  function makeGame(rand, opt) {
    opt = opt || {};
    var nextId = 1;
    function slot(c) { return { id: nextId++, c: c }; }

    /* ★ 53枚を まぜる */
    var deck = [];
    for (var c = 0; c < DECK_N; c++) deck.push(c);
    for (var i = deck.length - 1; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1));
      var t = deck[i]; deck[i] = deck[j]; deck[j] = t;
    }
    /* ★ 27枚・26枚 に 分ける。★どちらが 27枚かは でたらめ（ルル §9-1）*/
    var meFirstBig = rand() < 0.5;
    var meN = meFirstBig ? 27 : 26;
    var meRaw = deck.slice(0, meN), botRaw = deck.slice(meN);

    /* ★★ 先に 引くのは「27枚を 配られた 方」★★
       ------------------------------------------------------------
       ★ 53枚は 奇数なので、どちらかが 27枚・もう一方が 26枚 に なります（ルル §4-2）。
       ★ どちらが 27枚かは でたらめ ―― ★だから 席の ゆがみが 出ません。
       ★★ そして この 決め方に した とき だけ、★ルルの 数字が そのまま 出ます【計算・3万試合】：
          ★ 見ていない 50.2%（ルル 50.4）／★見ている 29.4%（ルル 29.8）＝ ★20.8ポイント
          ★ ロボットが 見ていて 人が 見ていない 70.9%（ルル 71.0）
          ★ 引く回数 8.1回・人 4.0回（ルル §9-3 の 3番と 同じ）
       ⚠️★ 人を いつも 先手に すると 29.4% が **34.9%** に なります【計算】
          ―― ★私の 最初の 作りは そちらでした。★ルルの 表と ずれて 気づきました。 */
    var g = {
      me: [], bot: [],         /* ★ 組を すてた あとの 手札（★遊ぶのは これ）*/
      preMe: [], preBot: [],   /* ★ 配った 直後の 手札（★画面の「はじめの 組すて」を 見せる ため）*/
      goneIds: [],             /* ★ はじめに すてた 札の id */
      turn: meFirstBig ? 0 : 1,  /* ★ 0 ＝ 人の 番、1 ＝ ロボットの 番 */
      over: false, winner: 0,  /* ★ 1 ＝ 人の 勝ち、−1 ＝ 人の 負け。★0 は まだ */
      draws: 0,                /* ★ 引いた 回数（両方 あわせて）*/
      myDraws: 0,              /* ★ 人が 引いた 回数 */
      big: meFirstBig ? 'me' : 'bot',
      rand: rand
    };

    /* ★ 人の 手札 … 数字の 順に そろえる（★読みやすさの ため だけ・ルル §2-5）
       ★ 並べかえの 操作は 作りません ―― ★意味が ありません（★でたらめな 相手に 効かない）。 */
    var mine = meRaw.slice().filter(function (x) { return x !== JOKER; });
    mine.sort(function (x, y) { return rankOf(x) - rankOf(y) || suitOf(x) - suitOf(y); });
    for (var m = 0; m < mine.length; m++) g.preMe.push(slot(mine[m]));
    /* ★★ ばばだけ でたらめな 場所へ（ルル §5-3）
       ★ 数字の 順に そろえると ばばは いつも はし ―― ★毎回 同じ どきどきに なって しまう。
       ★ 情報は 隠して いません（★自分の 手札は ぜんぶ 見えて います）。
         ★★ 変わるのは **どきどきの 場所** だけ です。 */
    if (meRaw.indexOf(JOKER) >= 0) {
      g.preMe.splice(Math.floor(rand() * (g.preMe.length + 1)), 0, slot(JOKER));
    }
    /* ★★ ロボットの 手札 … ★配られた 順の まま。★並べ直さない（判断2）★★ */
    for (var n = 0; n < botRaw.length; n++) g.preBot.push(slot(botRaw[n]));

    /* ── はじめの 組すて（同じ 数字が 2枚 あれば すてる。3枚 あれば 2枚 すてて 1枚 残す）──
       ★ すてる 札の id を 覚えて おく ―― ★画面が「まとめて ぱっと 消す」ため（ルル §7-1）。
       ★★ 残った 札の ならびは 1つも 入れかえません（★ここでも 判断2）。 */
    function strip(pre, keep) {
      var byRank = {}, k;
      for (k = 0; k < pre.length; k++) {
        var s = pre[k], r = rankOf(s.c);
        if (r < 0) continue;                               /* ★ ばばは 組に ならない */
        if (byRank[r] === undefined) byRank[r] = s;
        else { g.goneIds.push(byRank[r].id, s.id); byRank[r] = undefined; }
      }
      var goneSet = {};
      for (k = 0; k < g.goneIds.length; k++) goneSet[g.goneIds[k]] = 1;
      for (k = 0; k < pre.length; k++) if (!goneSet[pre[k].id]) keep.push(pre[k]);
    }
    strip(g.preMe, g.me);
    strip(g.preBot, g.bot);

    /* ★★ 配った 時点で もう 決まっている ことが あります（★めったに ありませんが 0では ない）★★
       ★ 組を すてた 結果、手札が 0枚に なる ことが あります【計算・5万試合で 0.0%台】。
       ★ そこを 見ていないと、★1回も 引いていないのに 引こうと して 反則に なります
         ―― ★★実際に 2万試合に 1回 出ました（T144・私の 失敗）。 */
    if (g.me.length === 0) { g.over = true; g.winner = 1; }
    else if (g.bot.length === 0) { g.over = true; g.winner = -1; }

    /* ★ ロボットを 1つ 付けて おく（★画面は これを 使います。★段は ありません ＝ いつも「見ている」）*/
    g.robot = makeRobot({});
    return g;
  }

  /* ★ 入れものの ならびから id だけを 取り出す（★ロボットに 渡すのは これ だけ）*/
  function idsOf(hand) {
    var a = [];
    for (var i = 0; i < hand.length; i++) a.push(hand[i].id);
    return a;
  }
  function indexOfId(hand, id) {
    for (var i = 0; i < hand.length; i++) if (hand[i].id === id) return i;
    return -1;
  }
  function hasJoker(hand) {
    for (var i = 0; i < hand.length; i++) if (hand[i].c === JOKER) return true;
    return false;
  }

  /* ============================================================
     ★ 1回 引く（★ゲームの 中身は ぜんぶ ここ）★
     ------------------------------------------------------------
     ★ who … 0 ＝ 人が ロボットから 引く、1 ＝ ロボットが 人から 引く
     ★ id  … 引く 入れものの id
     ★ 返り … 何が 起きたかの 記録（画面は これを 見て 動かす。★画面は ルールを 1つも 持たない）

     ★★ 2人ババ抜きでは、引いた 札は ★必ず 組に なります（ルル §1-1）。
        ★ ならないのは ばば ただ 1枚 だけ。
        ★ ＝ 「どの 札を すてるか」を 人が 選ぶ 余地は 1つも ありません
          → ★機械が すてるのは **肩代わり** であって、追記②に 触れません（ルル §6-4）。
     ============================================================ */
  function drawOnce(g, who, id) {
    var from = who ? g.me : g.bot;      /* ★ 引かれる 側 */
    var to   = who ? g.bot : g.me;      /* ★ 引く 側 */
    var at = indexOfId(from, id);
    if (at < 0) return { ok: false, why: '入れものが ありません' };

    var got = from[at];
    from.splice(at, 1);                 /* ★ 引かれた 側から 抜く（★ならびは 動かさない）*/

    g.draws++;
    if (!who) g.myDraws++;

    var r = { ok: true, who: who, card: got.c, id: got.id, fromIndex: at,
              pair: false, pairId: 0, pairIndex: -1, landIndex: -1 };

    /* ★ 引いた 側の 手札に 同じ 数字が あるか（★ばば いがいは 必ず ある）*/
    var mate = -1;
    if (got.c !== JOKER) {
      for (var i = 0; i < to.length; i++) if (rankOf(to[i].c) === rankOf(got.c)) { mate = i; break; }
    }

    if (mate >= 0) {
      r.pair = true; r.pairId = to[mate].id; r.pairIndex = mate; r.pairCard = to[mate].c;
      to.splice(mate, 1);               /* ★ 組に なった 相手だけ 抜ける（★引いた札は 入らない）*/
    } else {
      /* ★ ばば ―― 手札に 入る */
      if (who) {
        /* ★★ ロボットの 手札は「入った 順」。★足すのは いつも 右はし ★★
           ★ ここが 判断2 そのものです。★遊ぶ人は 飛んで いく 先を 目で 追えます。
           ★ でも「ここだよ」とは 教えません（★光らせない・ルル §7-6）。 */
        to.push(got);
        r.landIndex = to.length - 1;
      } else {
        /* ★ 人の 手札 … ばばは でたらめな 場所へ（★どきどきの 場所を 毎回 変える）*/
        var pos = Math.floor(g.rand() * (to.length + 1));
        to.splice(pos, 0, got);
        r.landIndex = pos;
      }
    }

    /* ★ 勝ち負け（★引き分けは 存在しません・ルル §7-2）*/
    if (g.me.length === 0) { g.over = true; g.winner = 1; }
    else if (g.bot.length === 0) { g.over = true; g.winner = -1; }
    else g.turn = who ? 0 : 1;

    r.over = g.over; r.winner = g.winner;
    return r;
  }

  /* ============================================================
     ★★ ロボット（ルル §3-5・★これで 全部です）★★
     ------------------------------------------------------------
       1. 覚えている「ばばの 入れもの」が 人の 手札に あれば → ★そこを さける
       2. 残りから でたらめに 1つ 引く
       ★ 以上。★読みは ありません。★1手 0ms。

     ★★ pick() が 受け取るのは ★**id の ならび だけ** ★★
        ★ 札の 中身は 1つも 渡りません。★のぞく 手が そもそも ありません。
        ★ babanuki-game.js の verify ② が、文字列でも 見張ります。

     ★ blind:true は **数える とき だけ** 使います（ルル §1-3 の 表の 再現）。
       ★★ 遊ぶ 画面では いつも blind:false ＝「見ている」1段 だけ（社長裁定 判断4）。
       ★ 「わざと 見のがす ロボット」は 作りません（★この会社が 5回 落としたもの・ルル §3-2）。
     ============================================================ */
  function makeRobot(opt) {
    opt = opt || {};
    var blind = !!opt.blind;
    var known = 0;              /* ★ 覚えているのは これ 1つ ＝ ばばが 入った 入れものの id */

    function pick(ids, rand) {
      var ok = [];
      for (var i = 0; i < ids.length; i++) if (ids[i] !== known) ok.push(ids[i]);
      if (!ok.length) ok = ids;                       /* ★ ばばしか 無ければ 引くしか ない */
      return ok[Math.floor(rand() * ok.length) % ok.length];
    }
    return {
      /* ★ 人に 引かれた ―― ★何を 引かれ、それが どこに 入ったかを 見た（人にも 見えている）*/
      gave: function (card, landId) { if (!blind && card === JOKER) known = landId; },
      /* ★ ばばを 自分が 引いた ―― もう 覚えて おく 意味が ない */
      took: function (card) { if (card === JOKER) known = 0; },
      pick: pick,
      known: function () { return known; },
      blind: blind,
      src: function () { return String(pick); }
    };
  }

  /* ============================================================
     ★ 人の 打ち方（★数える とき だけ 使う 模型）
       ・watch:false … ★見ていない。でたらめに 引く
       ・watch:true  … ★見ている。★ばばが ロボットの どの 入れものに 入ったかを 覚えている
       ★ ルル §1-4：★覚えるのは 1つで 天井。★2つめから 先は 0.3ポイントしか 動かない
     ============================================================ */
  function makeHuman(opt) {
    opt = opt || {};
    var watch = !!opt.watch;
    var known = 0;
    function pick(ids, rand) {
      var ok = [];
      for (var i = 0; i < ids.length; i++) if (ids[i] !== known) ok.push(ids[i]);
      if (!ok.length) ok = ids;
      return ok[Math.floor(rand() * ok.length) % ok.length];
    }
    return {
      gave: function (card, landId) { if (watch && card === JOKER) known = landId; },
      took: function (card) { if (card === JOKER) known = 0; },
      pick: pick, known: function () { return known; }, watch: watch
    };
  }

  /* ============================================================
     ★★ まぜ直して いないかの 見張り（★この 1本の 命の 検算）★★
     ------------------------------------------------------------
     ★ 引き算では なく、★★ならびを 前後で 並べて 見ます。
       ① 1手ごとに ロボットの 手札の id の ならびを 写しとる（前・後）
       ② 「後」から 新しく 増えた id を 取りのぞく
       ③ ★残った ならびが「前」の **部分列**（順番を 変えない 抜き出し）に なっているか
       ④ ★増えた id が **右はし**に しか 無いか
     ★ この 見張りは 中の 動かし方を 1行も 知りません（★写しとった ならびだけ 見る）。
       ★ ＝ 中身を 入れ替えても 気づけます。
     ============================================================ */
  function orderKept(before, after) {
    /* ④ 増えた id は 右はしだけ か */
    var was = {};
    for (var i = 0; i < before.length; i++) was[before[i]] = 1;
    var firstNew = -1;
    for (var j = 0; j < after.length; j++) {
      if (!was[after[j]]) { if (firstNew < 0) firstNew = j; }
      else if (firstNew >= 0) return false;      /* ★ 新しい id の 後ろに 古い id ＝ 割りこみ */
    }
    /* ③ 古い id の ならびが 前と 同じ 順か（部分列か）*/
    var k = 0;
    for (var m = 0; m < after.length; m++) {
      if (!was[after[m]]) continue;
      while (k < before.length && before[k] !== after[m]) k++;
      if (k >= before.length) return false;      /* ★ 順番が 入れかわった */
      k++;
    }
    return true;
  }

  /* ★ 式（ルル §1-1）が 生きているか ―― ★どちらの 手札にも 同じ 数字は 2枚 無く、
     ★ ばば いがいの 札は かならず 相手に 相方が いる */
  function pairInvariant(g) {
    var mine = {}, theirs = {}, i;
    for (i = 0; i < g.me.length; i++) { var r1 = rankOf(g.me[i].c); if (r1 < 0) continue; if (mine[r1]) return false; mine[r1] = 1; }
    for (i = 0; i < g.bot.length; i++) { var r2 = rankOf(g.bot[i].c); if (r2 < 0) continue; if (theirs[r2]) return false; theirs[r2] = 1; }
    for (var k in mine) if (mine.hasOwnProperty(k) && !theirs[k]) return false;
    for (var k2 in theirs) if (theirs.hasOwnProperty(k2) && !mine[k2]) return false;
    return true;
  }

  /* ============================================================
     ★ 試合を 1回 走らせる（★数える とき だけ。★画面は 通りません）
     ============================================================ */
  var PLY_CAP = 4000;      /* ★ 保険。★ここに 当たったら「詰まり」に 数える */

  function simGame(rand, human, robot, stat, opt) {
    opt = opt || {};
    var g = makeGame(rand);
    var guardBad = 0, invBad = 0, ply = 0;
    if (stat) {
      if (g.me.length > stat.maxHand) stat.maxHand = g.me.length;
      if (g.bot.length > stat.maxHand) stat.maxHand = g.bot.length;
    }
    /* ★ ふだんは 27枚の 方が 先（makeGame が すでに 入れて います）。
       ★ 下は **数える ときだけ** の 上書きです（★遊ぶ 画面からは 1度も 通りません）。 */
    if (opt.first === 'me') g.turn = 0;
    else if (opt.first === 'bot') g.turn = 1;
    else if (opt.first === 'random') g.turn = (rand() < 0.5) ? 0 : 1;

    if (stat && !pairInvariant(g)) invBad++;

    while (!g.over && ply < PLY_CAP) {
      ply++;
      if (g.turn === 0) {
        /* ★ 人が ロボットから 1枚 引く */
        var before = idsOf(g.bot);
        if (stat) { stat.myTurns++; if (human.known() && indexOfId(g.bot, human.known()) >= 0) stat.myKnew++; }
        var id = human.pick(idsOf(g.bot), rand);
        var r = drawOnce(g, 0, id);
        if (!r.ok) { if (stat) stat.illegal++; break; }
        human.took(r.card);                 /* ★ 人が 手に した（ばばなら 覚えは いらなく なる）*/
        robot.gave(r.card, r.id);           /* ★★ ロボットは「何を 引かれ、どこに 入ったか」を 見る */
        if (!orderKept(before, idsOf(g.bot))) guardBad++;
      } else {
        var before2 = idsOf(g.bot);
        if (stat) { stat.botTurns++; if (robot.known() && indexOfId(g.me, robot.known()) >= 0) stat.botKnew++; }
        var id2 = robot.pick(idsOf(g.me), rand);
        var r2 = drawOnce(g, 1, id2);
        if (!r2.ok) { if (stat) stat.illegal++; break; }
        robot.took(r2.card);                /* ★ ロボットが 手に した */
        human.gave(r2.card, r2.id);         /* ★★ 人は 飛んで いく 先を 見る（判断2）*/
        if (!orderKept(before2, idsOf(g.bot))) guardBad++;
      }
      if (stat) {
        if (!pairInvariant(g)) invBad++;
        /* ★ いちばん 多かった 手札（★ルル §5-1 の 14枚の 検算）―― ★遊んで いる 途中も 見る */
        if (g.me.length > stat.maxHand) stat.maxHand = g.me.length;
        if (g.bot.length > stat.maxHand) stat.maxHand = g.bot.length;
      }
    }

    if (stat) {
      stat.games++;
      stat.plies += ply;
      stat.myDraws += g.myDraws;
      stat.draws += g.draws;
      stat.shuffled += guardBad;
      stat.invariant += invBad;
      if (ply >= PLY_CAP) stat.stall++;
      if (g.winner > 0) stat.win++; else if (g.winner < 0) stat.lose++; else stat.tie++;
    }
    return g;
  }

  function newStat() {
    return { games: 0, win: 0, lose: 0, tie: 0, plies: 0, myDraws: 0, draws: 0,
             illegal: 0, stall: 0, shuffled: 0, invariant: 0, maxHand: 0,
             myTurns: 0, myKnew: 0, botTurns: 0, botKnew: 0 };
  }

  function runMany(games, seed, opt) {
    opt = opt || {};
    var st = newStat();
    for (var i = 0; i < games; i++) {
      var rand = rng((seed >>> 0) + i * 7919);
      var human = makeHuman({ watch: !!opt.watch });
      var robot = makeRobot({ blind: !!opt.blind });
      simGame(rand, human, robot, st, opt);
    }
    return {
      games: st.games,
      lose: st.lose / st.games, win: st.win / st.games, tie: st.tie / st.games,
      draws: st.draws / st.games, myDraws: st.myDraws / st.games,
      illegal: st.illegal, stall: st.stall,
      shuffled: st.shuffled, invariant: st.invariant, maxHand: st.maxHand,
      myKnew: st.myTurns ? st.myKnew / st.myTurns : 0,
      botKnew: st.botTurns ? st.botKnew / st.botTurns : 0
    };
  }

  /* ★ 配った 直後（組を すてた あと）の 手札の 枚数を 数える（ルル §9-3 の 2番）*/
  function handStats(games, seed) {
    var sum = 0, max = 0, hist = {};
    for (var i = 0; i < games; i++) {
      var g = makeGame(rng((seed >>> 0) + i * 104729));
      var n = g.me.length;
      sum += n; if (n > max) max = n;
      if (g.bot.length > max) max = g.bot.length;
      hist[n] = (hist[n] || 0) + 1;
    }
    return { games: games, avg: sum / games, max: max, hist: hist };
  }

  root.BABANUKI_CORE = {
    SUITS: SUITS, RANKS: RANKS, JOKER: JOKER, DECK_N: DECK_N,
    BACK_NAME: BACK_NAME, JOKER_NAME: JOKER_NAME,
    rankOf: rankOf, suitOf: suitOf, nameOf: nameOf, allNames: allNames,
    FIT: FIT, TUNE: TUNE,
    cardH: cardH, gapFor: gapFor, fitHands: fitHands, pickLayout: pickLayout, fitRuru: fitRuru,
    rng: rng, makeGame: makeGame, drawOnce: drawOnce,
    idsOf: idsOf, indexOfId: indexOfId, hasJoker: hasJoker,
    makeRobot: makeRobot, makeHuman: makeHuman,
    orderKept: orderKept, pairInvariant: pairInvariant,
    simGame: simGame, runMany: runMany, newStat: newStat, handStats: handStats,
    PLY_CAP: PLY_CAP
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
