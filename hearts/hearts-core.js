/* ============================================================
   ハーツ ― 決まり・ロボット・寸法（T165・コーダ）
   ------------------------------------------------------------
   ★ このファイルは document を 1度も さわりません。
     ＝ Node でも そのまま 走る ＝ 数える 側と 遊ぶ 側が ズレようが ない
     （ピラミッド T76・四目 T127・ババ抜き T144・ページワン T152 と 同じ 作法）。

   ★★★ 2026-08-28・社長の 指示で 作り直した ところ ★★★
     ------------------------------------------------------------
     ★ 社長の 言葉：「★ごめん 1試合じゃなくて、★★ルールに 忠実に 作って ほしい。
       ★ハートが 1点、Qが 13点、★★先に 100点に 達した 人が いたら そこで 終了。
       ★点が 少ない 人が 勝ち。」
     ★ ＝ ★ルル §16 判断1 の **2（本物の ハーツ）**。★「1回 配って 終わり」は 捨てました。
     ★★ これに つれて 変わった もの（★どれも「削らない」側に そろいます・設計図 §5.5-①）：
        ★ ① わたす 向きが **回ります** ―― ★左 → 右 → むかい → わたさない → 左 …
        ★ ② 点が **2つ** 要ります ―― ★この回の 点 と ★★合計
           ★ ★§9.6：★「累計」は 中学（累）なので 使いません。★★**「合計」**（合＝小2・計＝小2）。
        ★ ③ ★1回 配り終わる ごとに 区切りが できます ―― ★そこで やめられて、続きから 開けます。

   ★★★ この 1本の 芯 ―― 「取らない」と「わたす」の かけ算 ★★★
     ------------------------------------------------------------
     ★ ルル T164 §4-1【計算・各20万試合】：
         取らない だけ +6.37 ／ わたす だけ +2.94 ／ Qさばき だけ +0.79
         ★ 足し算なら +10.10 の はずが ―― ★★3つ 入れると **+21.81**
     ★ ★1つ 抜いた ときの 重さ：★取らない **−15.0** ／ ★わたす **−14.7** ／ ★Q **−4.8**
     ★ だから ―― ★★**わたす3枚は 絶対に 自動で 選びません**（ルル §14-2・設計図 追記②）。
       ★ core は 選ばれた 3枚を 受け取るだけ。★おすすめを 出す 行が 1行も ありません。

   ★★★ ロボットの つよさは 3段（★社長裁定 2026-08-28・ルル §16 判断3 ＝ 1）★★★
     ------------------------------------------------------------
     ★★ 3段 とも「★知って いる ことが ちがう」だけ です ――
        ★ ★**「見えて いるのに わざと 出さない」は 1つも 入って いません。**
        ★ ★＝ この会社が 5回 落とした 壁（T60/T78/T88/T126/T133）に 1度も さわって いません。

   ★★★ ルル T164 §15 失敗1 を、私も 最初に 確かめました ★★★
     ------------------------------------------------------------
     ★ ルルの 1回目の ロボットは「ひとりに 全部 取らせない」を 知らず、
       ★★「取るほうが 勝ち」と 思って いる 人が **40.2%で 最強**、という 表を 出しました。
     ★ ★直しは `moonGuard`（★下の pickPlay）。★★これを 外すと 40%に 戻ります。
     ★ ★★だから ―― ★`LIM.GUARD` で **わざと 外せる** ように して あります。
       ★ ★verify ② が「外したら ちゃんと 戻るか」を 毎回 確かめます
         （★T144 §7-4：★「無い こと」だけ 数える 見張りは、直しごと 消えても 通る）。
   ============================================================ */
(function (root) {
  'use strict';

  /* ── さいころ（既存17本と 同じ・種を 入れると 同じ 試合が 出る）───── */
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
     ★ 札（設計図 §9・ルル §10【実測】）
       ・52枚 ちょうど。★JOKER は 使いません。
       ・0〜51 … マーク × 13 ＋ 数字（0=A, 1=2 … 9=10, 10=J, 11=Q, 12=K）
       ・★読む 絵は 53個（52枚 ＋ トランプ裏赤）＝ ★ページワンと 1枚も ちがいません。
     ============================================================ */
  var SUITS = ['スペード', 'ハート', 'ダイヤ', 'クローバー'];
  var MARKS = ['♠', '♥', '♦', '♣'];
  var RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  var DECK_N = 52;
  var BACK_NAME = 'トランプ裏赤';

  var SPADE = 0, HEART = 1, DIAM = 2, CLUB = 3;
  var QS = SPADE * 13 + 11;      /* ★ スペードの Q ＝ 11（★13点。★26点の ちょうど 半分）*/
  var C2 = CLUB * 13 + 1;        /* ★ クローバーの 2 ＝ 40（★ここから 始まる）*/

  function suitOf(c) { return (c / 13) | 0; }
  function rankOf(c) { return c % 13; }
  /* ★ 強さ ―― ★A が いちばん 強い（★2=2 … 10=10, J=11, Q=12, K=13, A=14）*/
  function rk(c) { var r = c % 13; return r === 0 ? 14 : r + 1; }
  function nameOf(c) { return SUITS[suitOf(c)] + RANKS[rankOf(c)]; }
  /* ★ 点 ―― ★ハートは 1枚 1点。★スペードの Q は 13点。★ほかは 0点 */
  function ptOf(c) { return suitOf(c) === HEART ? 1 : (c === QS ? 13 : 0); }

  function allNames() {
    var a = [BACK_NAME];
    for (var c = 0; c < DECK_N; c++) a.push(nameOf(c));
    return a;                                   /* ★ 1 ＋ 52 ＝ 53個 */
  }

  function maxBy(arr, f) { var b = arr[0], bv = f(arr[0]); for (var i = 1; i < arr.length; i++) { var v = f(arr[i]); if (v > bv) { bv = v; b = arr[i]; } } return b; }
  function minBy(arr, f) { var b = arr[0], bv = f(arr[0]); for (var i = 1; i < arr.length; i++) { var v = f(arr[i]); if (v < bv) { bv = v; b = arr[i]; } } return b; }

  /* ============================================================
     ★★ 決まり（★10個。★見せる 説明は 6行）★★
     ------------------------------------------------------------
       1  はじめに 手札から 3枚 えらんで わたす。★わたす 先は 1回ごとに 変わる → 1行
       2  クローバーの 2を 持って いる 人から 出す              → ★画面が やる（説明 0行）
       3  場と 同じ マークの 札を 出す。無ければ 何でも よい    → 1行
       4  いちばん 強い 札を 出した 人が 4枚 取る。次も その人から → 1行
       5  ハートは 1枚 1点。スペードの Q は 13点               → 1行
       6  点が いちばん 少ない 人の 勝ち                        → （6行目に まとめる）
       7  1回目は 点の 札を 出せない                            → ★画面が 暗くする（説明 0行）
       8  ハートが 出るまで、ハートから 先に 出せない            → ★画面が 暗くする（説明 0行）
       9  26点 ぜんぶ 取った 人は、ぎゃくに 自分が 0点          → 1行「ぜんぶ取り」
       10 ★★合計が 100点に なった 人が 出たら おわり           → 1行
     ★★ 10個。★ルル §9 の「10を こえたら 相談の 合図」に **ちょうど 届いて いません**。
     ★ 7・8 は 深さを 1ミリも 変えません（ルル §9-1：誤差 ±0.06）。
       ★ ★それでも 残します ―― ★★見せる 説明が 0行 だから（＝ 重さが ゼロ）。
     ============================================================ */
  var GOAL = 100;                              /* ★★ 合計が ここに 届いたら おわり（社長の 指示）*/

  /* ★★ わたす 向き ―― ★1回ごとに 回る（★本物の ハーツ・社長の「ルールに 忠実に」）★★
     ★★ 言葉づかい（設計図 §9.6）：★左（小1）・右（小1）・人（小1）・★★向（小3）―― ★ぜんぶ 漢字。
     ★ ★「むかいの 人」→「向かいの 人」に 直しました（★トライ T166 §7-6 の ご指摘）。
     ★ 数は「席の いくつ 先へ わたすか」。★0 ＝ わたさない。 */
  var PASS_DIRS = [
    { d: 1,  label: '左の 人' },
    { d: 3,  label: '右の 人' },
    { d: 2,  label: '向かいの 人' },
    { d: 0,  label: 'わたさない' }
  ];
  function passOf(dealNo) { return PASS_DIRS[dealNo % PASS_DIRS.length]; }

  var RULES = { pass: true, firstNoPoint: true, heartsBreak: true, moon: true, goal: GOAL };
  function defaultRules() {
    return { pass: true, firstNoPoint: true, heartsBreak: true, moon: true, goal: GOAL };
  }

  /* ★★ わざと 外せる ように して ある もの（★verify ② が 使います）★★
     ★ GUARD を 0 に すると ―― ★★ロボットが「ひとりに 全部 取らせない」を しなく なります。
       ★ ★ルル §15 失敗1 の 1回目の 道具 そのもの。 */
  var LIM = { GUARD: 1 };

  /* ============================================================
     ★★ 出せる 札 ―― ★決まりは ここ 1か所に しか ありません ★★
     ============================================================ */
  function legalCards(cards, ctx, R) {
    var i, out;
    if (ctx.pos === 0) {
      if (ctx.trickNo === 0) return [C2];                 /* ★ 決まり2：クローバーの 2から */
      if (R.heartsBreak && !ctx.heartsBroken) {           /* ★ 決まり8：ハートから 先に 出せない */
        out = [];
        for (i = 0; i < cards.length; i++) if (suitOf(cards[i]) !== HEART) out.push(cards[i]);
        if (out.length) return out;
      }
      return cards.slice();
    }
    out = [];
    for (i = 0; i < cards.length; i++) if (suitOf(cards[i]) === ctx.leadSuit) out.push(cards[i]);
    if (out.length) return out;                            /* ★ 決まり3：同じ マークが あれば それだけ */
    if (R.firstNoPoint && ctx.trickNo === 0) {             /* ★ 決まり7：1回目は 点の 札を 出せない */
      out = [];
      for (i = 0; i < cards.length; i++) if (ptOf(cards[i]) === 0) out.push(cards[i]);
      if (out.length) return out;
    }
    return cards.slice();
  }

  /* ============================================================
     ★★ 打ち手の 部品（★ルル T164 の エンジンを そのまま 写した もの）★★
     ★ o = { kind, avoid, qs, qsLead, qsSafeLead, smartPass, passQs, passLow, moon, moonGuard }
     ★★ どれも「★知って いる ことが ちがう」だけ です。
     ============================================================ */
  function dangerOf(c, hand, o) {
    var s = suitOf(c), r = rk(c), i, len = 0;
    for (i = 0; i < hand.length; i++) if (suitOf(hand[i]) === s) len++;
    if (s === SPADE) {
      if (o.passQs) {
        if (c === QS) return len <= 3 ? 100 : 45;
        if (r > 12) return 88 - (14 - r) * 3;              /* ★ A=88 K=85 */
        return r;                                          /* ★ 低い スペードは 守り札。残す */
      }
      return r * 2;
    }
    if (s === HEART) return r * 3;
    var d = r * 2;
    if (len <= 2) d += 25;                                 /* ★ 短い マークは 空に すると 強い */
    return d;
  }
  function pickPass(cards, o, rand) {
    var h = cards.slice(), out = [], i;
    if (!o.smartPass) {                                    /* ★ でたらめに 3枚 */
      for (i = 0; i < 3 && h.length; i++) out.push(h.splice((rand() * h.length) | 0, 1)[0]);
      return out;
    }
    if (o.passLow) {                                       /* ★「取るほうが 勝ち」と 思う人：低い 3枚を 手放す */
      return h.sort(function (a, b) { return rk(a) - rk(b); }).slice(0, 3);
    }
    return h.sort(function (a, b) { return dangerOf(b, cards, o) - dangerOf(a, cards, o); }).slice(0, 3);
  }

  /* ── ★ひとりが 点を ぜんぶ 取って いるか（★ぜんぶ取りを ねらわれて いるか）── */
  function moonRunner(taken, me) {
    var tot = 0, who = -1, cnt = 0, i;
    for (i = 0; i < 4; i++) { tot += taken[i]; if (taken[i] > 0) { who = i; cnt++; } }
    if (tot === 0 || cnt !== 1 || who === me) return -1;
    return who;
  }

  /* ── ★1枚 出す ── */
  function pickPlay(cards, ctx, R, o, rand) {
    var L = legalCards(cards, ctx, R);
    var n = L.length, i;
    if (n === 1) return L[0];

    if (o.kind === 'random') return L[(rand() * n) | 0];
    if (o.kind === 'take') return maxBy(L, rk);            /* ★「取るほうが 勝ち」と 思って いる人 */

    var trick = ctx.trick, leadSuit = ctx.leadSuit, pos = ctx.pos;
    var canFollow = false;
    for (i = 0; i < cards.length; i++) if (suitOf(cards[i]) === leadSuit) { canFollow = true; break; }

    /* ★★★ ひとりに 全部 取らせない（★ルル §15 失敗1 の 直し）★★★
       ★ ★LIM.GUARD を 0 に すると ここが 消えます ―― ★verify ② が それを 使います。 */
    if (o.moonGuard && LIM.GUARD && !ctx.moonActive) {
      var run = moonRunner(ctx.taken, ctx.me);
      if (run >= 0) {
        if (pos === 0) return maxBy(L, rk);                /* ★ 高い 札で 先に 取りに 行く */
        var played = false, cur = trick[0];
        for (i = 0; i < trick.length; i++) {
          if (trick[i].p === run) played = true;
          if (suitOf(trick[i].c) === leadSuit && rk(trick[i].c) > rk(cur.c)) cur = trick[i];
        }
        if (!played || cur.p === run) {
          if (canFollow) {
            var over = [];
            for (i = 0; i < L.length; i++) if (rk(L[i]) > rk(cur.c)) over.push(L[i]);
            if (over.length) return minBy(over, rk);       /* ★ いちばん 小さい 勝てる札で 止める */
          } else {
            var np0 = [];
            for (i = 0; i < L.length; i++) if (ptOf(L[i]) === 0) np0.push(L[i]);
            if (np0.length) return maxBy(np0, rk);         /* ★ 取れない ときは 点を わたさない */
          }
        }
      }
    }

    /* ★ ぜんぶ取りを ねらって いる とちゅう（★人が 自分で ねらう ぶんには 使いません）*/
    if (o.moon && ctx.moonActive) {
      if (pos === 0 || canFollow) return maxBy(L, rk);
      var keep = [];
      for (i = 0; i < L.length; i++) if (ptOf(L[i]) === 0) keep.push(L[i]);
      return keep.length ? minBy(keep, rk) : minBy(L, rk);
    }

    /* ── 先に 出す ── */
    if (pos === 0) {
      if (o.qs) {
        var hasQs = false;
        for (i = 0; i < cards.length; i++) if (cards[i] === QS) { hasQs = true; break; }
        if (o.qsLead && !ctx.qsPlayed && !hasQs) {
          var low = [];
          for (i = 0; i < L.length; i++) if (suitOf(L[i]) === SPADE && rk(L[i]) < 12) low.push(L[i]);
          if (low.length) return maxBy(low, rk);           /* ★ 低い スペードで Q を あぶり出す */
        }
        if (o.qsSafeLead) {
          var safe = [];
          for (i = 0; i < L.length; i++) {
            if (suitOf(L[i]) === SPADE && rk(L[i]) > 12 && !ctx.qsPlayed) continue;
            safe.push(L[i]);
          }
          if (safe.length) return minBy(safe, rk);
        }
      }
      return minBy(L, rk);
    }

    if (canFollow) {
      var high = 0;
      for (i = 0; i < trick.length; i++) {
        if (suitOf(trick[i].c) === leadSuit && rk(trick[i].c) > high) high = rk(trick[i].c);
      }
      var under = [];
      for (i = 0; i < L.length; i++) if (rk(L[i]) < high) under.push(L[i]);
      if (o.avoid) {
        if (under.length) {
          if (o.qs && leadSuit === SPADE) {
            for (i = 0; i < under.length; i++) if (under[i] === QS) return QS;
          }
          return maxBy(under, rk);                          /* ★ 取らずに いちばん 高いのを 手放す */
        }
        if (pos === 3) return maxBy(L, rk);                 /* ★ 最後なら 必ず 取る → 大きいのを 手放す */
        return minBy(L, rk);                                /* ★ 後の 人に 抜かれるのを ねらう */
      }
      return L[(rand() * n) | 0];
    }

    /* ── マークが 無い（好きな 札を 手放せる）── */
    if (o.qs) {
      for (i = 0; i < L.length; i++) if (L[i] === QS) return QS;
      if (!ctx.qsPlayed) {
        var ak = [];
        for (i = 0; i < L.length; i++) if (suitOf(L[i]) === SPADE && rk(L[i]) > 12) ak.push(L[i]);
        if (ak.length) return maxBy(ak, rk);
      }
    }
    if (o.avoid) {
      var hh = [];
      for (i = 0; i < L.length; i++) if (suitOf(L[i]) === HEART) hh.push(L[i]);
      if (hh.length) return maxBy(hh, rk);
      return maxBy(L, rk);
    }
    return L[(rand() * n) | 0];
  }

  /* ★ 配られた 手札を 見て「ぜんぶ取りを ねらうか」を 1回だけ 決める（★数える とき だけ）*/
  function moonWorth(cards) {
    var h = 0, hiH = 0, hi = 0, i;
    for (i = 0; i < cards.length; i++) {
      if (suitOf(cards[i]) === HEART) { h++; if (rk(cards[i]) >= 12) hiH++; }
      if (rk(cards[i]) >= 13) hi++;
    }
    return h >= 5 && hiH >= 2 && hi >= 3;
  }

  /* ============================================================
     ★★ ロボットの つよさ 3段（★社長裁定・ルル §16 判断3 ＝ 1）★★
     ★ 言葉づかいは §9.6（★「はじめて」「ふつう」「つよい」）。
     ★★ 中身（何を 知って いるか）は 1つも 画面に 出しません。★言葉だけ。
     ★★ 初期値は **1段目「はじめて」**（★下の LEVEL_START ＝ 0）。
        ★ ★★T165 で 私が 決めました ―― ★100点まで の 形だと、★はじめての 人が
          ★★「ふつう」相手では **1.71%（★58勝負 ＝ 12時間に 1勝）**【計算】。
          ★★設計図 §5.5-②「何も 触らずに 始めた 人が やさしい 組み合わせで 遊べる」を
          ★★満たす 段は **「はじめて」だけ** でした（★25.75%）。
        ★ ★社長裁定（2026-08-28）で **そのまま** に なりました。
        ⚠️★ ★ここの 言葉と LEVEL_START の 数が ちがって いると 次に 読む 人が まちがえます
          ―― ★★実際に 1度 ちがって いました（★トライ T166 §7-7）。★★両方 直す こと。
        ★ ★ここは 社長が 1行で 変えられる 所です（→ 作業メモ）。
     ============================================================ */
  var LEVELS = [
    { id: 'first',  label: 'はじめて',
      o: { kind: 'random', smartPass: false } },
    { id: 'normal', label: 'ふつう',
      o: { kind: 'smart', avoid: true, smartPass: false, moonGuard: true } },
    { id: 'strong', label: 'つよい',
      o: { kind: 'smart', avoid: true, qs: true, qsLead: true, qsSafeLead: true,
           smartPass: true, passQs: true, moonGuard: true } }
  ];
  var LEVEL_START = 0;

  /* ★ 人の 模型（★数える ときだけ 使います。★画面からは 1度も 通りません）*/
  var HUMANS = [
    { label: 'はじめての人（でたらめ）',   o: { kind: 'random', smartPass: false } },
    { label: '少し 分かった人（取らない）', o: { kind: 'smart', avoid: true, smartPass: false, moonGuard: true } },
    { label: '分かった人（＋わたす）',     o: { kind: 'smart', avoid: true, smartPass: true, moonGuard: true } },
    { label: 'ぜんぶ 気づいた人',         o: { kind: 'smart', avoid: true, qs: true, qsLead: true,
                                               qsSafeLead: true, smartPass: true, passQs: true, moonGuard: true } },
    { label: '「取るほうが 勝ち」と 思う人', o: { kind: 'take', smartPass: true, passLow: true } }
  ];

  /* ============================================================
     ★★ 寸法 ―― ★手札は いつも 13枚（★増える 決まりが 1つも ありません）★★
     ------------------------------------------------------------
     ★ ルル §8：★13枚が **ふだんの 形かつ 最大**。★設計図 追記③（まれな 最悪ケース）が
       ★★そもそも 起きません。★「13枚を いちばん 見やすく」だけを 考えれば よい。

     ★★★ 13枚を 押せる ように する 決まり（★トライ T153 🟡-1 の【実測】から）★★★
       | 手札 | 見えて いる はば | まん中を 押して その札に 当たるか |
       | 11枚 | 26px | 11 / 11枚 ○ |
       | 13枚 | 22px（札の 50%）| 13 / 13枚 ○ |
       | 14枚 | 20px（45%）| ★★1 / 14枚 ✕ |
     ★★ 正体は「44px」では ありません ―― ★★**見えて いる はばが 札の 半分を 切ると、
        ★★その 札の まん中が となりの 札に かくれる** から です（★45% で 一気に 壊れる 理由）。
     ★ → ★決まりを 2つ 置きます：
        ★ ★① 見えて いる はば ≧ **21px**
        ★ ★② 見えて いる はば ≧ **札の はばの 56%**（★まん中が かくれない・6%の 余裕）
     ★ ★★式では なく **本物で 数えます** ―― ★fitTest が 13枚 1枚ずつ さして 確かめます。

     ★ 1画面の 積み方（★上から）：
        ロボット2（むかい）の 手札（裏・よこ ならび）＋ 名前
        ─ すきま ─
        ハッピー（★入る ときだけ）
        ─ すきま ─
        ロボット1（左）｜ 場の 台（★4枚が 十字に 出る）｜ ロボット3（右）
        ─ すきま ─
        ★★点の 帯（★この回 と 合計 ―― ★4人ぶん）
        ─ すきま ─
        あなたの 手札（表・13枚）
     ============================================================ */
  var FIT = {
    RATIO_W: 419, RATIO_H: 635,     /* ★ 札の 比（設計図 §9）*/
    W_MAX: 100, W_MIN: 12,
    HAND_N: 13,                     /* ★★ 手札は いつも 13枚（★増えません）*/
    PITCH_MIN: 21,                  /* ★ 見えて いる はばの 下ばり（★トライ T153【実測】）*/
    PITCH_RATE: 0.56,               /* ★ 見えて いる はば ÷ 札の はば の 下ばり */
    GAP_RATE: 0.06, GAP_MIN: 3,
    BOT_RATE: 0.46,                 /* ★ ロボットの 札の 大きさ（自分の 札の 46%）*/
    NAME_H: 15,                     /* ★ ロボットの 名前の 1行 */
    SCORE_H: 44,                    /* ★★ 点の 帯（★見出し ／ この回 ／ 合計 の 3行）*/
    SIDE_RATE: 0.18, SIDE_MAX: 96,  /* ★ 左右の ロボットの 帯（★名前「ロボット1」が 入る はば）*/
    TRICK_W: 2.92, TRICK_H: 2.42,   /* ★ 場の 4枚（十字）の 外わく ÷ 札（★spotOf の 数と 合わせる）*/
    EDGE: 13,                       /* ★ 台の わく（★大富豪の【実測】木4＋内よはく7＋みどり2）*/
    PAD: 8, PADMIN: 4,
    HAPPY_MIN: 40
  };

  function cardH(w) { return Math.round(w * FIT.RATIO_H / FIT.RATIO_W); }
  function gapFor(w) { return Math.max(FIT.GAP_MIN, Math.round(w * FIT.GAP_RATE)); }
  /* ★ 手札 13枚の「見えて いる はば」（★いちばん 右の 1枚だけは まるごと 見えます）*/
  function handPitch(w, W) {
    var full = w + gapFor(w);
    if (FIT.HAND_N <= 1) return full;
    return Math.min(full, (W - w) / (FIT.HAND_N - 1));
  }

  function pickLayout(W, H) {
    for (var w = FIT.W_MAX; w >= FIT.W_MIN; w--) {
      var p = handPitch(w, W);
      if (p < FIT.PITCH_MIN) continue;                 /* ★ ① 21px */
      if (p < w * FIT.PITCH_RATE) continue;            /* ★ ② まん中が かくれない */
      var h = cardH(w);
      var bw = Math.max(8, Math.round(w * FIT.BOT_RATE)), bh = cardH(bw);
      var trickW = Math.round(w * FIT.TRICK_W), trickH = Math.round(h * FIT.TRICK_H);
      var feltMin = trickW + FIT.EDGE * 2;
      if (feltMin + (bw + 6) * 2 > W) continue;        /* ★ 台 ＋ 左右の ロボットが 入るか */
      var botH = bh + FIT.NAME_H;
      var feltBase = trickH + FIT.EDGE * 2;
      var need = botH + FIT.PAD + feltBase + FIT.PAD + FIT.SCORE_H + FIT.PAD + h;
      if (need > H) continue;
      return { w: w, h: h, g: gapFor(w), pitch: p, bw: bw, bh: bh, botH: botH,
               trickW: trickW, trickH: trickH, feltMin: feltMin, feltBase: feltBase, need: need };
    }
    return fallbackLayout(W, H);
  }
  /* ★ どうしても 入らない ほど 小さい 窓（保険）。★ここに 来ても 壊れない ように だけ する */
  function fallbackLayout(W, H) {
    var w = Math.max(8, Math.min(FIT.W_MIN, Math.floor(W / 8)));
    var h = cardH(w), bw = Math.max(6, Math.round(w * FIT.BOT_RATE)), bh = cardH(bw);
    return { w: w, h: h, g: FIT.GAP_MIN, pitch: Math.max(6, (W - w) / (FIT.HAND_N - 1)),
             bw: bw, bh: bh, botH: bh + FIT.NAME_H,
             trickW: Math.round(w * FIT.TRICK_W), trickH: Math.round(h * FIT.TRICK_H),
             feltMin: Math.round(w * FIT.TRICK_W) + FIT.EDGE * 2,
             feltBase: Math.round(h * FIT.TRICK_H) + FIT.EDGE * 2, tight: true };
  }

  /* ============================================================
     ★ 待ち時間（設計図 2026-08-24 裁定：★待ち時間は 遊びの 中身では ない。
        ★選ばせず、★速い側に 固定する）
     ★ ★ルル §7-2 の 係数と くらべられる ように、★★秒の 中身を ここに 全部 出して います。
     ============================================================ */
  var TUNE = {
    DEAL_STEP:      30,   /* ★ 1枚 配る ごと */
    PASS_MOVE:     340,   /* ★ わたした 3枚が 動く */
    PASS_FLIP:     240,   /* ★ もらった 3枚が おもてに なる */
    BOT_THINK:     380,   /* ★ ロボットが 考える（★七並べ・ページワンに そろえた 速い側）*/
    PLAY_MOVE:     220,   /* ★ 札が 場へ 飛ぶ */
    TRICK_HOLD:    640,   /* ★★ 4枚 出そろってから 取るまで（★「あ、取っちゃう」を 見る 時間）*/
    TAKE_MOVE:     300,   /* ★ 4枚が 取った 人の ところへ 飛ぶ */
    SAY_HOLD:     1600,   /* ★ ハッピーの ひとことが 残る 時間 */
    RESULT_WAIT:   480,
    RESULT_LOCK:   550
  };
  /* ★ 1回 配る あいだに 機械が 使う 時間【計算】（★人が 考える 時間は 0 と した とき）
     ★ ルルの【見立て】は 1回 1分33秒（★人 2.5秒／手・ロボット 1.1秒／手）。★くらべる ための 数。 */
  function machineMs() {
    return TUNE.PASS_MOVE + TUNE.PASS_FLIP +
           13 * (3 * (TUNE.BOT_THINK + TUNE.PLAY_MOVE) + TUNE.PLAY_MOVE + TUNE.TRICK_HOLD + TUNE.TAKE_MOVE);
  }

  /* ============================================================
     ★★ 試合（★1回 配る ぶん）★★
     ------------------------------------------------------------
     ★ 手札は 入れもの（slot）の ならび：{ id, c }
       ★ id ＝ 通し番号。★画面は これで 1枚を 追いかけます（★ババ抜き T144 と 同じ 作法）。
     ★ 席0 が 人。★席1 が 左・席2 が むかい・席3 が 右。
       ★★ わたす 先は `PASS_DIRS[dealNo % 4]`（★左 → 右 → むかい → わたさない）。
     ============================================================ */
  function makeGame(rand, opt) {
    opt = opt || {};
    var R = opt.rules || defaultRules();
    var dealNo = opt.dealNo || 0;
    var nextId = (opt.idFrom || 1);
    function slot(c) { return { id: nextId++, c: c }; }

    var deck = [], i, j, t;
    for (i = 0; i < DECK_N; i++) deck.push(i);
    for (i = deck.length - 1; i > 0; i--) {
      j = Math.floor(rand() * (i + 1));
      t = deck[i]; deck[i] = deck[j]; deck[j] = t;
    }
    var hands = [[], [], [], []];
    for (i = 0; i < DECK_N; i++) hands[i % 4].push(slot(deck[i]));

    var pd = passOf(dealNo);
    var g = {
      rules: R, nP: 4, dealNo: dealNo,
      passDir: (R.pass ? pd.d : 0), passLabel: (R.pass ? pd.label : 'わたさない'),
      hands: hands,
      taken: [0, 0, 0, 0],           /* ★ この回に 取った 点 */
      tookN: [0, 0, 0, 0],           /* ★ この回に 取った 枚数 */
      phase: 'pass',                 /* ★ 'pass' → 'play' → 'over' */
      trick: [],                     /* ★ 場に 出て いる 札 [{ p, id, c }]（★出た 順）*/
      leadSuit: -1, trickNo: 0, heartsBroken: false, qsPlayed: false,
      lead: -1, cur: -1,
      over: false, deal: null, moonBy: -1,
      passed: null,
      rand: rand, nextId: function () { return nextId; }
    };
    if (!g.passDir) startPlay(g);     /* ★ わたさない 回は そのまま 始まります */
    return g;
  }

  function startPlay(g) {
    g.phase = 'play';
    g.trickNo = 0; g.trick = []; g.leadSuit = -1;
    g.lead = 0;
    for (var p = 0; p < 4; p++) for (var i = 0; i < g.hands[p].length; i++) if (g.hands[p][i].c === C2) g.lead = p;
    g.cur = g.lead;
  }

  /* ★ 手札（数字だけ）を 取り出す */
  function cardsOf(g, seat) {
    var a = [], h = g.hands[seat], i;
    for (i = 0; i < h.length; i++) a.push(h[i].c);
    return a;
  }
  function ctxOf(g, seat) {
    return { pos: g.trick.length, trickNo: g.trickNo, leadSuit: g.leadSuit,
             heartsBroken: g.heartsBroken, qsPlayed: g.qsPlayed,
             trick: g.trick, taken: g.taken, me: seat, moonActive: false };
  }
  /* ★ 出せる 札 ―― ★手札の 何番目か で 返します */
  function legalIdx(g, seat) {
    if (g.phase !== 'play' || g.over) return [];
    var L = legalCards(cardsOf(g, seat), ctxOf(g, seat), g.rules);
    var ok = {}, out = [], i;
    for (i = 0; i < L.length; i++) ok[L[i]] = 1;
    for (i = 0; i < g.hands[seat].length; i++) if (ok[g.hands[seat][i].c]) out.push(i);
    return out;
  }

  /* ============================================================
     ★★★ わたす3枚 ★★★
     ★★ core は **受け取るだけ** です。★★人の ぶんを 自分で 選ぶ 行が 1行も ありません
        ―― ★ここが ルル §14-2 の 線（★遊びの 14.7ポイント・設計図 追記②）。
     ============================================================ */
  function botPass(g, seat, o) {
    var got = pickPass(cardsOf(g, seat), o, g.rand), out = [], i, j;
    var used = {};
    for (i = 0; i < got.length; i++) {
      for (j = 0; j < g.hands[seat].length; j++) {
        if (used[g.hands[seat][j].id]) continue;
        if (g.hands[seat][j].c === got[i]) { out.push(g.hands[seat][j].id); used[g.hands[seat][j].id] = 1; break; }
      }
    }
    return out;
  }
  function doPass(g, give) {
    var out = [], p, i, k;
    for (p = 0; p < 4; p++) {
      out[p] = [];
      for (i = 0; i < give[p].length; i++) {
        for (k = 0; k < g.hands[p].length; k++) {
          if (g.hands[p][k].id === give[p][i]) { out[p].push(g.hands[p].splice(k, 1)[0]); break; }
        }
      }
    }
    for (p = 0; p < 4; p++) {
      var to = (p + g.passDir + 4) % 4;
      for (i = 0; i < out[p].length; i++) g.hands[to].push(out[p][i]);
    }
    g.passed = out;
    startPlay(g);
    return out;
  }

  /* ============================================================
     ★★ 1枚 出す ★★
     ★ 返り … { ok, id, card, pos, full }（★full ＝ 4枚 そろった）
     ============================================================ */
  function playIdx(g, seat, idx) {
    if (g.phase !== 'play' || g.over) return { ok: false, why: 'いま 出せません' };
    if (seat !== g.cur) return { ok: false, why: 'その 人の 番では ありません' };
    var hand = g.hands[seat];
    if (idx < 0 || idx >= hand.length) return { ok: false, why: 'そんな 札は ありません' };
    var ok = legalIdx(g, seat);
    if (ok.indexOf(idx) < 0) return { ok: false, why: 'その 札は 出せません' };

    var s = hand.splice(idx, 1)[0];
    if (g.trick.length === 0) g.leadSuit = suitOf(s.c);
    g.trick.push({ p: seat, id: s.id, c: s.c });
    if (suitOf(s.c) === HEART) g.heartsBroken = true;
    if (s.c === QS) g.qsPlayed = true;
    var full = (g.trick.length === 4);
    if (!full) g.cur = (g.cur + 1) % 4;
    return { ok: true, id: s.id, card: s.c, pos: g.trick.length - 1, full: full };
  }
  function botIdx(g, seat, o) {
    var c = pickPlay(cardsOf(g, seat), ctxOf(g, seat), g.rules, o, g.rand), i;
    for (i = 0; i < g.hands[seat].length; i++) if (g.hands[seat][i].c === c) return i;
    var L = legalIdx(g, seat);
    return L.length ? L[0] : 0;
  }

  /* ★★ 4枚 そろった ―― ★いちばん 強い 札を 出した 人が 取る ★★
     ★★ ここは 画面から 呼ばれる まで 動きません ―― ★「あ、取っちゃう」を 見る 間を 作る ため。 */
  function takeTrick(g) {
    var w = g.trick[0], pts = 0, i, ids = [];
    for (i = 0; i < g.trick.length; i++) {
      pts += ptOf(g.trick[i].c);
      ids.push(g.trick[i].id);
      if (suitOf(g.trick[i].c) === g.leadSuit && rk(g.trick[i].c) > rk(w.c)) w = g.trick[i];
    }
    g.taken[w.p] += pts;
    g.tookN[w.p] += 4;
    g.lead = w.p; g.cur = w.p;
    g.trick = []; g.leadSuit = -1;
    g.trickNo++;
    if (g.trickNo >= 13) endDeal(g);
    return { winner: w.p, pts: pts, ids: ids };
  }

  /* ★★ 決まり9 ―― ★26点 ぜんぶ 取った 人は、ぎゃくに 自分が 0点。ほかが 26点 ★★ */
  function endDeal(g) {
    var s = g.taken.slice(), p;
    g.moonBy = -1;
    if (g.rules.moon) {
      for (p = 0; p < 4; p++) if (g.taken[p] === 26) { g.moonBy = p; for (var q = 0; q < 4; q++) s[q] = (q === p ? 0 : 26); }
    }
    g.deal = s;
    g.phase = 'over'; g.over = true;
    return s;
  }

  /* ============================================================
     ★★★ ひとまとまりの 勝負（★合計が 100点に なるまで）★★★
     ------------------------------------------------------------
     ★ 社長の 指示：「★先に 100点に 達した 人が いたら そこで 終了。★点が 少ない 人が 勝ち。」
     ★ ★★1回 配り終わる ごとに 区切りが できます ―― ★ここが「やめられる 所」です。
     ============================================================ */
  function newMatch(level) {
    return { total: [0, 0, 0, 0], dealNo: 0, level: (level == null ? LEVEL_START : level),
             over: false, winners: [], goal: GOAL };
  }
  function addDeal(m, deal) {
    for (var p = 0; p < 4; p++) m.total[p] += deal[p];
    m.dealNo++;
    var hi = Math.max(m.total[0], m.total[1], m.total[2], m.total[3]);
    if (hi >= m.goal) {
      m.over = true;
      var lo = Math.min(m.total[0], m.total[1], m.total[2], m.total[3]);
      m.winners = [];
      for (p = 0; p < 4; p++) if (m.total[p] === lo) m.winners.push(p);
    }
    return m;
  }

  /* ============================================================
     ★ 走らせる（★数える とき だけ。★画面は 通りません）
     ============================================================ */
  function simDeal(rand, os, R, dealNo) {
    var g = makeGame(rand, { rules: R || defaultRules(), dealNo: dealNo || 0 });
    var give = [], p, i, bad = 0, plies = 0;
    if (g.phase === 'pass') {
      for (p = 0; p < 4; p++) give.push(botPass(g, p, os[p]));
      doPass(g, give);
    }
    var moonOn = [false, false, false, false];
    for (p = 0; p < 4; p++) if (os[p].moon) moonOn[p] = moonWorth(cardsOf(g, p));

    var t;
    for (t = 0; t < 13; t++) {
      for (i = 0; i < 4; i++) {
        var seat = g.cur;
        var ctx = ctxOf(g, seat);
        ctx.moonActive = moonOn[seat] && g.taken.every(function (v, k) { return k === seat || v === 0; });
        var c = pickPlay(cardsOf(g, seat), ctx, g.rules, os[seat], rand);
        var L = legalCards(cardsOf(g, seat), ctx, g.rules);
        if (L.indexOf(c) < 0) bad++;
        var at = -1, k2;
        for (k2 = 0; k2 < g.hands[seat].length; k2++) if (g.hands[seat][k2].c === c) { at = k2; break; }
        var r = playIdx(g, seat, at);
        if (!r.ok) return { deal: [0, 0, 0, 0], taken: [0, 0, 0, 0], bad: bad + 100, plies: plies, tot: -1, tricks: t };
        plies++;
      }
      takeTrick(g);
    }
    var tot = g.taken[0] + g.taken[1] + g.taken[2] + g.taken[3];
    return { deal: g.deal, taken: g.taken, moonBy: g.moonBy,
             bad: bad, plies: plies, tot: tot, tricks: g.trickNo };
  }

  function simMatch(rand, os, R) {
    var m = newMatch(0), bad = 0, deals = 0, moons = 0, moonMine = 0, plies = 0, badTot = 0;
    var guard = 0;
    while (!m.over && guard++ < 200) {
      var r = simDeal(rand, os, R, m.dealNo);
      bad += r.bad; plies += r.plies; deals++;
      if (r.tot !== 26) badTot++;
      if (r.moonBy >= 0) { moons++; if (r.moonBy === 0) moonMine++; }
      addDeal(m, r.deal);
    }
    var win = [0, 0, 0, 0], nW = m.winners.length, p;
    for (p = 0; p < 4; p++) if (m.winners.indexOf(p) >= 0) win[p] = 1 / nW;
    return { total: m.total, win: win, deals: deals, moons: moons, moonMine: moonMine,
             bad: bad, badTot: badTot, plies: plies, nofin: (guard >= 200 ? 1 : 0) };
  }

  function newStat() {
    return { games: 0, win: 0, illegal: 0, badTot: 0, badPly: 0, badTrick: 0, nofin: 0,
             pts: 0, zero: 0, moon: 0, moonMine: 0, deals: 0, dealList: [], scores: [] };
  }
  /* ★ mode ＝ 'deal'（1回 配る ぶん）／ 'match'（★100点まで） */
  function runMany(n, seed, os, R, mode) {
    var st = newStat(), rand = rng((seed >>> 0) || 4649), i;
    for (i = 0; i < n; i++) {
      if (mode === 'match') {
        var m = simMatch(rand, os, R);
        st.games++;
        st.win += m.win[0];
        st.illegal += m.bad; st.badTot += m.badTot; st.nofin += m.nofin;
        st.moon += m.moons; st.moonMine += m.moonMine;
        st.deals += m.deals; st.dealList.push(m.deals);
        st.scores.push(m.total[0]);
        if (m.plies !== m.deals * 52) st.badPly++;
      } else {
        var r = simDeal(rand, os, R, i % 4);
        st.games++;
        var lo = Math.min(r.deal[0], r.deal[1], r.deal[2], r.deal[3]);
        var nW = 0, p;
        for (p = 0; p < 4; p++) if (r.deal[p] === lo) nW++;
        if (r.deal[0] === lo) st.win += 1 / nW;
        st.illegal += r.bad;
        if (r.tot !== 26) st.badTot++;
        if (r.plies !== 52) st.badPly++;
        if (r.tricks !== 13) st.badTrick++;
        st.pts += r.taken[0];
        if (r.taken[0] === 0) st.zero++;
        if (r.moonBy >= 0) { st.moon++; if (r.moonBy === 0) st.moonMine++; }
        st.scores.push(r.deal[0]);
      }
    }
    return st;
  }
  function pct(a, f) {
    var s = a.slice().sort(function (x, y) { return x - y; });
    return s[Math.min(s.length - 1, Math.floor(s.length * f))];
  }

  root.HEARTS_CORE = {
    SUITS: SUITS, MARKS: MARKS, RANKS: RANKS, DECK_N: DECK_N, BACK_NAME: BACK_NAME,
    SPADE: SPADE, HEART: HEART, DIAM: DIAM, CLUB: CLUB, QS: QS, C2: C2,
    suitOf: suitOf, rankOf: rankOf, rk: rk, nameOf: nameOf, ptOf: ptOf, allNames: allNames,
    GOAL: GOAL, PASS_DIRS: PASS_DIRS, passOf: passOf,
    RULES: RULES, defaultRules: defaultRules, LIM: LIM,
    LEVELS: LEVELS, LEVEL_START: LEVEL_START, HUMANS: HUMANS,
    FIT: FIT, TUNE: TUNE, machineMs: machineMs,
    cardH: cardH, gapFor: gapFor, handPitch: handPitch, pickLayout: pickLayout,
    rng: rng, makeGame: makeGame, startPlay: startPlay, cardsOf: cardsOf, ctxOf: ctxOf,
    legalCards: legalCards, legalIdx: legalIdx,
    pickPass: pickPass, dangerOf: dangerOf, botPass: botPass, doPass: doPass,
    pickPlay: pickPlay, playIdx: playIdx, botIdx: botIdx,
    takeTrick: takeTrick, endDeal: endDeal, moonWorth: moonWorth,
    newMatch: newMatch, addDeal: addDeal,
    simDeal: simDeal, simMatch: simMatch, runMany: runMany, newStat: newStat, pct: pct
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.HEARTS_CORE;

})(typeof globalThis !== 'undefined' ? globalThis : this);
