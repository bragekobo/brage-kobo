/* ============================================================
   ソリティア（7本目・クロンダイク）― T66・コーダ
   ------------------------------------------------------------
   仕様は logs/T65_ソリティア_仕様_ルル.md ＋ 社長裁定（2026-08-20）が 正。

   社長裁定（4つ・厳守）：
     1. 勝てない配り … ★ 必ず クリアできる 配りだけを 配る（§2-2）
     2. 難しさ3段階 … ★ 選ばせない（★ルルの推しと 逆・社長の判断）
        → プルダウン・localStorage の level・段階ごとの 分岐は まるごと 作らない。
        → そのぶん 中身を 固定する ―― 山札は「1枚ずつ めくる」（TUNE.DRAW = 1）。
          社長は 判断1で いちばん やさしい方（必ず クリアできる 配り）を えらばれた。
          そこで 3枚めくり（1周で 8枚しか 手が とどかない）に すると、
          同じ 問題を 別の 入口から 作り直す ことに なる。
        → おかげで ハッピーの「この配り、ちゃんと クリアできるよ！」が
          いつでも 本当の ことに なる。
     3. 札が 降ってくる 演出 … ★ 作る（§6-1）
     4. クロンダイク先・スパイダー後 … そのとおり

   ★ この ファイルの かたち（★ここが 今回いちばん 大事）
     ------------------------------------------------------------
     「中身（CORE）」と「画面（UI）」を きっぱり 分けてある。
     CORE は document を 1回も さわらない ので、**Node からも そのまま 動く**。
       node -e "const C=require('./game.js'); ..."
     クリアできる 配りの 一覧（DEALS）は、この CORE を Node で まわして 作った。
     ★ つまり「解く道具の側」と「ゲームの側」は **同じ 1本の コード**。
       仕様 §2-2 の いちばんの 落とし穴（両者が ズレると 一覧が 全部ゴミ）を、
       ズレようが ない 作りに して つぶしてある。

   ★ 札を 動かす 入口は applyMove() ただ1つ（仕様 §9-4④）
     めくる・場札へ・組札へ・組札から もどす ―― 全部 ここを 通る。
     だから「もどす」は 1つの 逆手順だけで 効く。入口を 増やさない こと。

   ⚠️ poker-core.js は 使わない（役の判定が 1つも 要らない ゲーム）。
   ⚠️ 外部の ライブラリ・フォント・画像は 0。外への 通信も 0。
   ============================================================ */
(function (root) {
  'use strict';

  /* ============================================================
     ★ 数字（TUNE）― 調整する 数字は ここ 1か所だけ
     ============================================================ */
  var TUNE = {
    /* ★★ 山札を 1回で めくる 枚数 ★★
       社長裁定2（選ばせない）を 受けて 1枚で 固定。
       ★ 3枚に する ときは、ここを 3 に する だけ ―― ただし
         クリアできる 配りの 一覧（DEALS）を 作り直す こと
         （1枚めくり用の 一覧なので、3枚では 保証が うそに なる）。 */
    DRAW: 1,

    /* 見た目の 時間 */
    MOVE:        180,   // 札が すべって 動く 時間

    /* ★★ つまんで 運ぶ（T67・社長指示）★★
       DRAG_SLOP … これだけ 動いたら「運んでいる」。ここまでは タップ 扱い。
                   ★ ここが 2回おし と 運ぶ の 境目。小さすぎると 2回おしが
                     指の ブレで 運びに 化ける。大きすぎると 運び出しが 重い。
       DOUBLE_MS … 2回 続けて おした と みなす 間（1回目から 2回目の 指まで）
       DOUBLE_SLOP … 2回目の 指が 1回目から どれだけ 離れても いいか */
    DRAG_SLOP:     7,
    DOUBLE_MS:   340,
    DOUBLE_SLOP:  26,

    /* ★★ つかんだ 札を 指より 上へ ずらす 量（T69・トライ 宿題2の 答え）★★
       ------------------------------------------------------------
       重なった 列で つかめる 帯は 375px で たった 18px。指（44px）で
       おすと、その 札の 左上の 数字と マークが **まるごと 指の 下**に 入る
       （トライの 計算：札の 上 31px ＝ 42% が かくれる）。
       → 運びはじめたら 札を 30px 持ち上げる。
         ・いま 何を つかんだかが 見える → 外したら すぐ 気づいて 戻せる
         ・**置ける場所は 1つも 光らない**（設計図 追記② は 守ったまま）
         ・おまけに「おした のに 何も 起きない」も 消える
       ⚠️ ずらすのは 見た目 だけでは なく **判定の 場所も 一緒に** ずらす。
          見えている 札の 四角が そのまま 落とし先の 判定に なる ―― でないと
          「見えている 場所」と「入る 場所」が ずれて うそに なる。 */
    LIFT:         30,   // px。せまい 画面では 札の 45% まで（下の layout()）

    /* 裏向き0枚 → 自動で 全部 上げる（仕様 §5-2）*/
    AUTO_WAIT:   400,   // 「あ」と 気づく 間
    AUTO_STEP:    60,   // 1枚ごと

    /* 札が 降る 演出（仕様 §6-1）*/
    FALL_WAIT:   300,   // 上げ終わって から だまる 時間
    FALL_STEP:    40,   // 1枚ずつ こぼれ落ちる 間かく
    FALL_MAX:   6000,   // ★ 6秒で かってに 止まる（誰も 閉じこめない）

    /* ★ 結果の 箱の 連打よけ（T62の 事故を くり返さない・仕様 §6-1）
       演出を タップで 飛ばした その 指が、次の タップで
       「新しく 配る」を おして しまう のを 止める。
         ① 箱が 出てから RESULT_LOCK ミリ秒 たっている
         ② かつ 最後に さわってから RESULT_QUIET ミリ秒 さわっていない */
    RESULT_LOCK: 600,
    RESULT_QUIET: 250,

    /* 寸法（仕様 §1-3。★1か所に まとめる ―― ばらまかない こと）*/
    CARD_MAX:     85,   // 札の はばの 上限（1000×900の とき）
    OVER_UP:    0.25,   // 表向きの 重なり（隅の 数字と マークが 見える 最小）
    OVER_DOWN:  0.12,   // 裏向きの 重なり（「ある」ことだけ 分かれば いい）
    RATIO: 635 / 419    // 支給画像 419×635 の ひりつ。★ぜったいに くずさない
  };

  /* ============================================================
     カード（設計図 §9・厳守）
     ------------------------------------------------------------
     0〜51 の 数字 1つで 1枚を あらわす。
       すーと = (c/13)|0   … 0 スペード / 1 ハート / 2 ダイヤ / 3 クローバー
       数字   = c % 13     … 0 が A、12 が K
     赤は ハートと ダイヤ（1・2）。黒は スペードと クローバー（0・3）。
     ============================================================ */
  var SUITS = ['スペード', 'ハート', 'ダイヤ', 'クローバー'];
  var RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  function suitOf(c) { return (c / 13) | 0; }
  function rankOf(c) { return c % 13; }
  function isRed(c)  { var s = suitOf(c); return s === 1 || s === 2; }
  function nameOf(c) { return SUITS[suitOf(c)] + RANKS[rankOf(c)]; }

  /* ============================================================
     ★ 種から 動く 乱数（仕様 §9-4②・mulberry32）
     ------------------------------------------------------------
     Math.random() では 番号から 同じ 配りを 作れない。
     ここが 1ミリでも ズレると、クリアできる 配りの 一覧が 全部 ゴミに なる。
     ============================================================ */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ★ 配る（仕様 §3-1）
     場札 7列に 左から 1,2,3,4,5,6,7枚。各列の 一番上だけ 表向き。
     残り 24枚が 山札（配列の 末尾が いちばん上）。 */
  function makeDeal(seed) {
    var rnd = mulberry32(seed >>> 0);
    var deck = [], i, j, t;
    for (i = 0; i < 52; i++) deck.push(i);
    for (i = 51; i > 0; i--) {                 // Fisher–Yates（向き・回数を 変えない）
      j = Math.floor(rnd() * (i + 1));
      t = deck[i]; deck[i] = deck[j]; deck[j] = t;
    }
    var g = {
      seed: seed >>> 0,
      tab: [], stock: [], waste: [], found: [0, 0, 0, 0],
      hist: [], moves: 0, redeals: 0, over: false, won: false
    };
    for (i = 0; i < 7; i++) g.tab.push({ down: [], up: [] });
    var p = 0;
    for (i = 0; i < 7; i++) for (j = i; j < 7; j++) g.tab[j].down.push(deck[p++]);
    for (i = 0; i < 7; i++) g.tab[i].up.push(g.tab[i].down.pop());
    g.stock = deck.slice(28);
    return g;
  }

  /* ============================================================
     ★ ルール（仕様 §3-4 の 8個。1つも 削らない）
     ------------------------------------------------------------
       1 場札は 色が 交互・数字が 1つ小さい 順          → canStack
       2 並びに なっている札は まとめて 動かせる        → legalMoves の n
       3 空いた列に 置けるのは K だけ                   → legalMoves
       4 組札は マークごと・A から順                    → canToFound
       5 ★組札から 場札へ 戻せる                       → legalMoves の 'FT'
       6 山札の 周回は 無制限                           → applyMove の 'D'
       7 めくった札から 取れるのは 一番手前の 1枚だけ   → waste の 末尾だけ
       8 裏向きの札は 上が 空いたら 自動で 表に なる    → flipUp
     ============================================================ */
  function canStack(card, onto) {
    return rankOf(card) === rankOf(onto) - 1 && isRed(card) !== isRed(onto);
  }
  function canToFound(g, card) {
    return g.found[suitOf(card)] === rankOf(card);
  }
  function flipUp(col) {
    if (col.up.length === 0 && col.down.length) { col.up.push(col.down.pop()); return true; }
    return false;
  }
  function downCount(g) {
    var n = 0; for (var i = 0; i < 7; i++) n += g.tab[i].down.length; return n;
  }
  function isWin(g) {
    return g.found[0] + g.found[1] + g.found[2] + g.found[3] === 52;
  }
  /* ★ 札は いつでも 52枚（たしかめ用）*/
  function countAll(g) {
    var n = g.stock.length + g.waste.length + g.found[0] + g.found[1] + g.found[2] + g.found[3];
    for (var i = 0; i < 7; i++) n += g.tab[i].down.length + g.tab[i].up.length;
    return n;
  }

  /* ============================================================
     ★ 手（move）― 札を 動かす 入口は applyMove ただ1つ
     ------------------------------------------------------------
       {k:'D'}                        山札を めくる（空なら まぜ直し）
       {k:'WF'}                       めくった札 → 組札
       {k:'WT', to}                   めくった札 → 場札
       {k:'TF', from}                 場札 → 組札
       {k:'TT', from, n, to}          場札 → 場札（n枚 まとめて）
       {k:'FT', s, to}                組札 → 場札（ルール5）
     ============================================================ */
  function applyMove(g, mv, opt) {
    var rec = { k: mv.k, mv: mv, flip: false, n: 0, recycled: false };
    var col, to, c, i;
    switch (mv.k) {
      case 'D':
        if (g.stock.length === 0) {                 // ルール6：周回は 無制限
          g.stock = g.waste.reverse(); g.waste = [];
          rec.recycled = true; g.redeals++;
        } else {
          for (i = 0; i < TUNE.DRAW && g.stock.length; i++) g.waste.push(g.stock.pop());
          rec.n = i;
        }
        break;
      case 'WF':
        c = g.waste.pop(); g.found[suitOf(c)]++; break;
      case 'WT':
        c = g.waste.pop(); g.tab[mv.to].up.push(c); break;
      case 'TF':
        col = g.tab[mv.from]; c = col.up.pop(); g.found[suitOf(c)]++;
        rec.flip = flipUp(col); break;
      case 'TT':
        col = g.tab[mv.from]; to = g.tab[mv.to];
        var moved = col.up.splice(col.up.length - mv.n, mv.n);
        for (i = 0; i < moved.length; i++) to.up.push(moved[i]);
        rec.flip = flipUp(col); break;
      case 'FT':
        c = mv.s * 13 + (g.found[mv.s] - 1); g.found[mv.s]--;
        g.tab[mv.to].up.push(c); break;
    }
    g.moves++;
    if (!opt || opt.hist !== false) g.hist.push(rec);
    return rec;
  }

  /* ★ もどす（無制限・仕様 §2-3）。逆の 手順を 1つだけ 書く。 */
  function undoMove(g) {
    var rec = g.hist.pop();
    if (!rec) return false;
    var mv = rec.mv, col, to, c, i;
    switch (rec.k) {
      case 'D':
        if (rec.recycled) { g.waste = g.stock.reverse(); g.stock = []; g.redeals--; }
        else { for (i = 0; i < rec.n; i++) g.stock.push(g.waste.pop()); }
        break;
      case 'WF':
        /* どの札を 上げたかは tagMove が 手の 中に 入れてある（mv._c）*/
        c = mv._c; g.found[suitOf(c)]--; g.waste.push(c); break;
      case 'WT':
        c = g.tab[mv.to].up.pop(); g.waste.push(c); break;
      case 'TF':
        col = g.tab[mv.from];
        if (rec.flip) col.down.push(col.up.pop());
        c = mv._c; g.found[suitOf(c)]--; col.up.push(c); break;
      case 'TT':
        col = g.tab[mv.from]; to = g.tab[mv.to];
        if (rec.flip) col.down.push(col.up.pop());
        var back = to.up.splice(to.up.length - mv.n, mv.n);
        for (i = 0; i < back.length; i++) col.up.push(back[i]);
        break;
      case 'FT':
        c = g.tab[mv.to].up.pop(); g.found[suitOf(c)]++; break;
    }
    g.moves--;
    return true;
  }

  /* ★ 手が どの札を 動かすのか（もどす ときに 要る）を 手の 中に 入れておく。
     applyMove の 前に 必ず 通す ―― 入口を 1つに するための 下ごしらえ。 */
  function tagMove(g, mv) {
    if (mv.k === 'WF') mv._c = g.waste[g.waste.length - 1];
    else if (mv.k === 'TF') mv._c = g.tab[mv.from].up[g.tab[mv.from].up.length - 1];
    return mv;
  }
  function doMove(g, mv, opt) { return applyMove(g, tagMove(g, mv), opt); }

  /* ============================================================
     ★ 出せる手を 全部 数える
       o.found === false … 組札→場札 を 入れない（詰み判定・解く道具で 使う）
       o.draw  === false … 山札めくり を 入れない
     ============================================================ */
  function legalMoves(g, o) {
    o = o || {};
    var out = [], i, j, k, col, t, c, n;

    for (i = 0; i < 7; i++) {
      col = g.tab[i];
      if (col.up.length && canToFound(g, col.up[col.up.length - 1])) out.push({ k: 'TF', from: i });
    }
    if (g.waste.length && canToFound(g, g.waste[g.waste.length - 1])) out.push({ k: 'WF' });

    for (i = 0; i < 7; i++) {
      col = g.tab[i];
      for (k = 0; k < col.up.length; k++) {
        c = col.up[k]; n = col.up.length - k;
        for (j = 0; j < 7; j++) {
          if (j === i) continue;
          t = g.tab[j];
          if (t.up.length) {
            if (canStack(c, t.up[t.up.length - 1])) out.push({ k: 'TT', from: i, n: n, to: j });
          } else if (t.down.length === 0 && rankOf(c) === 12) {
            /* 空の列 → 空の列 は 何も 変わらない ので 手に 数えない */
            if (!(k === 0 && col.down.length === 0)) out.push({ k: 'TT', from: i, n: n, to: j });
          }
        }
      }
    }

    if (g.waste.length) {
      c = g.waste[g.waste.length - 1];
      for (j = 0; j < 7; j++) {
        t = g.tab[j];
        if (t.up.length) { if (canStack(c, t.up[t.up.length - 1])) out.push({ k: 'WT', to: j }); }
        else if (t.down.length === 0 && rankOf(c) === 12) out.push({ k: 'WT', to: j });
      }
    }

    if (o.found !== false) {                     // ルール5：組札から 場札へ 戻せる
      for (var s = 0; s < 4; s++) {
        if (!g.found[s]) continue;
        c = s * 13 + (g.found[s] - 1);
        for (j = 0; j < 7; j++) {
          t = g.tab[j];
          if (t.up.length) { if (canStack(c, t.up[t.up.length - 1])) out.push({ k: 'FT', s: s, to: j }); }
          else if (t.down.length === 0 && rankOf(c) === 12) out.push({ k: 'FT', s: s, to: j });
        }
      }
    }

    if (o.draw !== false && (g.stock.length || g.waste.length)) out.push({ k: 'D' });
    return out;
  }

  /* ============================================================
     ★ 詰みの 判定（仕様 §3-5・ここは 厳しく）
     ------------------------------------------------------------
       ① 場札どうしで 動かせる手が 1つもない
       ② 場札・めくった札から 組札へ 上げられる札が 1つもない
       ③ ★山札を 1周 まるごと めくっても ①②が 1度も 成り立たない
     ③を 入れないと「まだ 山札に あるのに 詰みと 言う」最悪の 事故が 起きる。
     ⚠️ 組札→場札（ルール5）は この 数えに 入れない。
        入れると 組札に 1枚でも あれば ほぼ 必ず 手が あることに なり、
        詰みが 一生 出ない ―― 立て直しの 手であって 遊びの 手ではない から。
     ⚠️ ゲームは「もう 勝てない」とは ぜったいに 言わない。
        言うのは「1手も ない」ときだけ。見こみの 判断は 人に まかせる。
     ============================================================ */
  function hasPlay(g) { return legalMoves(g, { found: false, draw: false }).length > 0; }

  function isStuck(g) {
    if (isWin(g)) return false;
    if (hasPlay(g)) return false;
    var t = cloneState(g);
    var steps = t.stock.length + t.waste.length + 2;      // ★ ちょうど 1周ぶん
    for (var i = 0; i < steps; i++) {
      if (t.stock.length === 0 && t.waste.length === 0) break;
      applyMove(t, { k: 'D' }, { hist: false });
      if (hasPlay(t)) return false;
    }
    return true;
  }

  function cloneState(g) {
    var t = {
      seed: g.seed, tab: [], stock: g.stock.slice(), waste: g.waste.slice(),
      found: g.found.slice(), hist: [], moves: g.moves, redeals: g.redeals,
      over: false, won: false
    };
    for (var i = 0; i < 7; i++) t.tab.push({ down: g.tab[i].down.slice(), up: g.tab[i].up.slice() });
    return t;
  }

  /* ============================================================
     ★★ 解く道具（solver）― 仕様 §9-4① / §2-2
     ------------------------------------------------------------
     この 配りが クリアできるか を 調べて、できるなら **本当の 手順**を 返す。
     ・見つけた手順は 全部 ゲームの 合法手（applyMove を 通る 手）なので、
       そのまま 流しこめば 本当に 勝てる。★これが 保証の 中身。
     ・組札→場札（ルール5）は 使わない ―― 使わなくても 勝てる 手順だけを 探す。
       ゲームの 手は これより 広い ので、見つかった 手順は 必ず 通る（安全側）。
     ・「上げても 損しない 札」は だまって 上げる（safeUp）。
       これは クロンダイクで 昔から 知られている 手 ―― 損を しない ことが
       言い切れる ので、探す 木が ぐっと 小さく なる。
     ・時間切れ・数え切れは「不明」＝ 捨てる。失敗しても 誰も 困らない。
     ============================================================ */
  function safeUp(g) {
    /* 上げても 損しない ＝ その札の 上に 置きたい 札（1つ小さい 反対の色）が
       もう 2枚とも 組札に 上がっている。A と 2 は いつでも 安全。 */
    function ok(c) {
      var r = rankOf(c);
      if (r <= 1) return true;
      var opp = isRed(c) ? [0, 3] : [1, 2];
      return g.found[opp[0]] >= r && g.found[opp[1]] >= r;
    }
    for (var i = 0; i < 7; i++) {
      var u = g.tab[i].up;
      if (u.length) { var c = u[u.length - 1]; if (canToFound(g, c) && ok(c)) return { k: 'TF', from: i }; }
    }
    if (g.waste.length) {
      var w = g.waste[g.waste.length - 1];
      if (canToFound(g, w) && ok(w)) return { k: 'WF' };
    }
    return null;
  }

  /* ★ 山札の 中の 札を「そこまで めくって から 出す」1かたまりの 手に する。
     1枚めくり・周回無制限 なので、山札と めくった札の どの札にも 必ず 手が とどく
     （仕様 §2-4）。だから 「めくるだけ」の 手を 木に 入れずに すむ。 */
  function stockSeqs(g) {
    var out = [];
    var total = g.stock.length + g.waste.length;
    if (total === 0) return out;
    var t = cloneState(g), pre = [], seen = 0, guard = total * 2 + 6;
    var startTop = g.waste.length ? g.waste[g.waste.length - 1] : -1;
    while (guard-- > 0 && seen < total) {
      applyMove(t, { k: 'D' }, { hist: false });
      pre.push({ k: 'D' });
      if (!t.waste.length) continue;
      var c = t.waste[t.waste.length - 1];
      if (c === startTop) break;
      seen++;
      if (canToFound(t, c)) out.push({ seq: pre.slice().concat([{ k: 'WF' }]), score: 30 });
      for (var j = 0; j < 7; j++) {
        var col = t.tab[j];
        if (col.up.length) {
          if (canStack(c, col.up[col.up.length - 1])) out.push({ seq: pre.slice().concat([{ k: 'WT', to: j }]), score: 28 });
        } else if (col.down.length === 0 && rankOf(c) === 12) {
          out.push({ seq: pre.slice().concat([{ k: 'WT', to: j }]), score: 28 });
        }
      }
    }
    return out;
  }

  function stateKey(g) {
    /* ★ 裏向きの札は 一度も 並べかえられない ので、枚数だけで 中身が 決まる。
       列の 並びかえは 同じ 場面 なので、そろえて から つなぐ。 */
    var a = [];
    for (var i = 0; i < 7; i++) a.push(g.tab[i].down.length + '.' + g.tab[i].up.join(','));
    a.sort();
    return a.join('|') + '#' + g.found.join(',') + '#' + g.stock.join(',') + '/' + g.waste.join(',');
  }

  function solve(g, opts) {
    opts = opts || {};
    var limitMs = opts.ms == null ? 2000 : opts.ms;
    /* ★ 一覧（DEALS）を 作った ときと 同じ 上限に して おく こと。
       ここを 下げると、作った ときは 解けた 配りが 解けなく なり、
       たしかめ直した ときに「解けなかった」が 出て 混乱する（実際に 出た）。 */
    var maxNodes = opts.nodes == null ? 400000 : opts.nodes;
    var t0 = Date.now(), nodes = 0, cut = false;
    var seen = new Set();
    var st = cloneState(g), path = [];

    function children() {
      var out = [], mvs = legalMoves(st, { found: false, draw: false }), i, m;
      for (i = 0; i < mvs.length; i++) {
        m = mvs[i];
        var sc = 10;
        if (m.k === 'TT') {
          var from = st.tab[m.from];
          if (m.n === from.up.length) sc = from.down.length ? 100 : 90;  // 裏をめくる／列を空ける
          else sc = 40;
        } else if (m.k === 'WT') sc = 60;
        else sc = 50;                                                     // 組札へ（安全ではない札）
        out.push({ seq: [m], score: sc });
      }
      var ss = stockSeqs(st);
      for (i = 0; i < ss.length; i++) out.push(ss[i]);
      out.sort(function (a, b) { return b.score - a.score; });
      return out;
    }

    function dfs() {
      if (nodes >= maxNodes || Date.now() - t0 > limitMs) { cut = true; return false; }
      nodes++;
      var autos = 0, m;
      while ((m = safeUp(st))) { doMove(st, m); path.push(m); autos++; }
      if (isWin(st)) return true;
      var key = stateKey(st);
      if (!seen.has(key)) {
        seen.add(key);
        var kids = children();
        for (var i = 0; i < kids.length; i++) {
          var seq = kids[i].seq, j;
          for (j = 0; j < seq.length; j++) { doMove(st, seq[j]); path.push(seq[j]); }
          if (dfs()) return true;
          for (j = 0; j < seq.length; j++) { undoMove(st); path.pop(); }
          if (cut) break;
        }
      }
      for (var a = 0; a < autos; a++) { undoMove(st); path.pop(); }
      return false;
    }

    var won = dfs();
    return {
      ok: won, unknown: !won && cut,
      moves: won ? path.slice() : null,
      nodes: nodes, ms: Date.now() - t0
    };
  }

  /* ★ 見つけた 手順を 本当に ゲームに 流しこんで 勝てるか たしかめる
     （仕様 §2-2 の「最初に これを やってください」）*/
  function replay(seed, moves) {
    var g = makeDeal(seed);
    for (var i = 0; i < moves.length; i++) {
      var legal = legalMoves(g), ok = false, m = moves[i];
      for (var j = 0; j < legal.length; j++) {
        var L = legal[j];
        if (L.k !== m.k) continue;
        if (m.k === 'TT' && (L.from !== m.from || L.n !== m.n || L.to !== m.to)) continue;
        if (m.k === 'WT' && L.to !== m.to) continue;
        if (m.k === 'TF' && L.from !== m.from) continue;
        if (m.k === 'FT' && (L.s !== m.s || L.to !== m.to)) continue;
        ok = true; break;
      }
      if (!ok) return { ok: false, at: i, why: '合法でない手' };
      doMove(g, m);
      if (countAll(g) !== 52) return { ok: false, at: i, why: '札が52枚でない' };
    }
    return { ok: isWin(g), at: moves.length, why: isWin(g) ? '' : '勝てていない' };
  }

  /* ============================================================
     ★ 自動プレイ（仕様 §8-3・数える 道具）
     ------------------------------------------------------------
     人らしい 打ち方（先を 読まない・目の前の 得だけ 取る）で 1試合を まわす。
     ここで 出た 数字だけを 報告に 書く ―― 形容詞で 片づけない。
     ============================================================ */
  /* 打ちたい 順に ならべる（先を 読まない・目の前の 得だけ 取る 打ち方）*/
  function scoredMoves(g) {
    var mvs = legalMoves(g, { found: false, draw: false }), out = [], i;
    for (i = 0; i < mvs.length; i++) {
      var m = mvs[i], sc = 0, c;
      if (m.k === 'TF' || m.k === 'WF') {
        c = m.k === 'WF' ? g.waste[g.waste.length - 1] : g.tab[m.from].up[g.tab[m.from].up.length - 1];
        sc = rankOf(c) <= 1 ? 95 : (safeCard(g, c) ? 80 : 45);
      } else if (m.k === 'TT') {
        var from = g.tab[m.from], whole = (m.n === from.up.length);
        if (whole && from.down.length) sc = 100;                 // 裏を めくれる ―― いちばん 得
        else if (whole && !from.down.length) sc = g.tab[m.to].up.length ? 25 : 15;  // 列を 移すだけ
        else sc = 35;                                            // 並びを 分けて 動かす
      } else if (m.k === 'WT') sc = 65;
      if (sc > 0) out.push({ m: m, sc: sc });
    }
    out.sort(function (a, b) { return b.sc - a.sc; });
    return out;
  }
  function safeCard(g, c) {
    var r = rankOf(c);
    if (r <= 1) return true;
    var opp = isRed(c) ? [0, 3] : [1, 2];
    return g.found[opp[0]] >= r && g.found[opp[1]] >= r;
  }

  /* ★ 1試合 まわして 数える。
     ⚠️ 同じ 場面に 戻る 手は 打たない（seen）。これが 無いと
        「A列を B列へ、B列を A列へ」を 一生 くり返して 数が 取れない
        ―― 最初に 作った ときに 実際に そう なった。 */
  function playOne(seed, cap) {
    cap = cap || 600;
    var g = makeDeal(seed), i, err = null, maxCol = 0, waste = 0;
    var start = legalMoves(g, { found: false, draw: false }).length === 0;
    var seen = new Set(); seen.add(stateKey(g));

    for (i = 0; i < cap; i++) {
      if (isWin(g)) break;
      if (downCount(g) === 0) {                      // ★ 裏0枚 → 勝ち確定（仕様 §5-3）
        var guard = 0;
        while (!isWin(g) && guard++ < 400) {
          var f = null, k;
          for (k = 0; k < 7; k++) { var u = g.tab[k].up; if (u.length && canToFound(g, u[u.length - 1])) { f = { k: 'TF', from: k }; break; } }
          if (!f && g.waste.length && canToFound(g, g.waste[g.waste.length - 1])) f = { k: 'WF' };
          if (!f) f = { k: 'D' };
          doMove(g, f);
        }
        break;
      }

      var cand = scoredMoves(g), acted = false;
      for (var ci = 0; ci < cand.length; ci++) {
        var m = cand[ci].m, cc = null;
        /* ★ 数える⑦「組札へ 上げすぎて 損した」：
           ⚠️ T67で 意味が 変わった。ここは **ゲームが 勝手に 上げた 回数では ない。**
              人の 操作で 札が 組札へ 上がる 道は「2回おし」と「引っぱる」の
              2つ だけ ―― どちらも 人が 決める。プログラムが 遊んでいる 最中に
              勝手に 上げる 道は 1本も ない（T68 §2-1 で トライが 確認）。
           この 数字が 数えて いるのは、**この ロボットが 自分で 上げると 決めて、
           あとで 損した 回数**。ロボットは「上げられるなら 上げる」ので、
           上げた 札の 上に 置きたい 札（1つ小さい 反対の色）が 場に 出ていて、
           ほかに 行き場が ない と 損に なる。ふつうの クロンダイクで
           誰でも やる 失敗 ―― 作りの 欠点では ない。 */
        if (m.k === 'TF' || m.k === 'WF') {
          cc = m.k === 'WF' ? g.waste[g.waste.length - 1] : g.tab[m.from].up[g.tab[m.from].up.length - 1];
        }
        doMove(g, m);
        var key = stateKey(g);
        if (seen.has(key)) { undoMove(g); continue; }   // 同じ 場面に 戻る 手は 打たない
        seen.add(key); acted = true;
        if (cc !== null && wouldWaste(g, cc)) waste++;
        break;
      }

      if (!acted) {
        if (!g.stock.length && !g.waste.length) break;               // もう めくれない
        doMove(g, { k: 'D' });
        var k2 = stateKey(g);
        if (seen.has(k2)) break;                                     // 1周 して 何も 変わらなかった
        seen.add(k2);
      }

      if (countAll(g) !== 52) { err = '札が52枚でない（' + countAll(g) + '枚）'; break; }
      for (var q = 0; q < 7; q++) {
        var len = g.tab[q].down.length + g.tab[q].up.length;
        if (len > maxCol) maxCol = len;
      }
    }
    /* ⚠️ 手数の 上限に あたった のは「エラー」では ない ―― 先を 読まない 打ち方が
       あてもなく さまよった だけ。中身が こわれた ときだけ err に する。 */
    return {
      seed: seed, won: isWin(g), stuck: !isWin(g) && isStuck(g),
      moves: g.moves, redeals: g.redeals, maxCol: maxCol, err: err,
      capped: i >= cap, wasteUp: waste, deadStart: start
    };
  }

  function wouldWaste(g, c) {
    var r = rankOf(c);
    if (r === 0) return false;
    var want = [], s;
    for (s = 0; s < 4; s++) {
      if (isRed(s * 13) === isRed(c)) continue;
      want.push(s * 13 + (r - 1));
    }
    for (var w = 0; w < want.length; w++) {
      var target = want[w], here = false, other = false;
      if (g.waste.length && g.waste[g.waste.length - 1] === target) here = true;
      for (var i = 0; i < 7; i++) {
        var u = g.tab[i].up;
        if (u.length && u[u.length - 1] === target) here = true;
        if (u.length && u[u.length - 1] !== target && canStack(target, u[u.length - 1])) other = true;
      }
      if (here && !other) return true;
    }
    return false;
  }

  /* ============================================================
     CORE を 外に 出す（Node からも ブラウザからも 同じ 中身）
     ============================================================ */
  var CORE = {
    TUNE: TUNE, SUITS: SUITS, RANKS: RANKS,
    suitOf: suitOf, rankOf: rankOf, isRed: isRed, nameOf: nameOf,
    mulberry32: mulberry32, makeDeal: makeDeal,
    canStack: canStack, canToFound: canToFound,
    legalMoves: legalMoves, applyMove: applyMove, doMove: doMove, undoMove: undoMove,
    isWin: isWin, isStuck: isStuck, hasPlay: hasPlay, downCount: downCount,
    countAll: countAll, cloneState: cloneState,
    solve: solve, replay: replay, playOne: playOne, safeUp: safeUp
  };
  root.SOLITAIRE_CORE = CORE;
  if (typeof module === 'object' && module.exports) module.exports = CORE;

  /* ★ Node（画面が ない ところ）では ここで おしまい。
     ここから下は 1行も 動かない ―― だから 解く道具と ゲームは ズレようが ない。 */
  if (typeof document === 'undefined') return;

  /* ============================================================
     ★★ ここから 画面（UI）★★
     ============================================================ */
  var $ = function (id) { return document.getElementById(id); };

  /* ── カードの 絵（設計図 §9・厳守）──────────────────
     ・画像は office/games/cards/ の 支給画像。CSSや 絵文字で 自作しない。
     ・ファイル名が 日本語なので encodeURIComponent を 必ず 通す。
     ・全55枚で 約11MB なので 先読みしない ―― 表に なった 札だけ 読む
       （裏面は 1枚だけ。ブラウザが 使い回す）。 */
  var CARD_DIR = '../cards/';
  function cardSrc(name) { return CARD_DIR + encodeURIComponent(name) + '.png'; }
  var BACK_SRC = cardSrc('トランプ裏赤');

  /* ============================================================
     ★★ クリアできる 配りの 一覧（社長裁定1・仕様 §2-2）★★
     ------------------------------------------------------------
     36進数 6文字ずつ で 種（配りの 番号）が ならんでいる。
     作りかた ―― logs/T66_ソリティア_配り作り.cjs を Node で 走らせた。
       ① 種から 配る（makeDeal）
       ② 上の CORE の solve() に かける
       ③ ★見つけた 手順を replay() で **本当に ゲームに 流しこんで 勝てるか**
          たしかめる（1つでも 通らなければ その場で 中止する 作り）
       ④ 通った 種だけ ここに 足す
     ★ ①〜③は 全部 この ファイルの CORE を 使っている ＝ ズレようが ない。
     ★ 遊ぶ ときは この 中から 1つ えらぶ だけ。ブラウザは 1回も 解かない。
     ============================================================ */
  var DEALS =
    '00000100000200000400000500000600000800000b00000d00000e00000f00000g00000i00000j00000k00000l' +
    '00000m00000o00000s00000u00000w00000x00000z00001100001400001700001800001a00001d00001f00001h' +
    '00001i00001j00001k00001m00001n00001p00001q00001s00001w00001x00001z000020000021000023000024' +
    '00002500002700002800002900002a00002b00002c00002d00002f00002h00002i00002k00002l00002p00002q' +
    '00002s00002t00002y00002z00003100003200003600003700003800003900003a00003b00003c00003d00003e' +
    '00003f00003h00003j00003l00003m00003o00003q00003s00003t00003u00003v00003w00003y00003z000046' +
    '00004800004900004c00004g00004h00004i00004j00004n00004o00004p00004r00004s00004t00004u00004w' +
    '00004x00004y00004z00005100005200005300005400005600005900005b00005c00005e00005j00005k00005m' +
    '00005n00005p00005r00005w00005z00006000006100006200006300006400006500006700006800006900006c' +
    '00006d00006f00006g00006h00006i00006j00006l00006m00006n00006p00006s00006u00006y000073000074' +
    '00007500007600007700007800007900007a00007b00007c00007d00007f00007g00007i00007l00007m00007n' +
    '00007o00007p00007s00007t00007v00007w00007x00008000008100008300008500008700008a00008b00008c' +
    '00008d00008e00008f00008g00008i00008j00008k00008l00008m00008n00008p00008q00008r00008s00008u' +
    '00008w00008x00008y00009100009300009400009600009900009a00009c00009e00009f00009h00009i00009k' +
    '00009m00009p00009q00009r00009t00009x00009z0000a00000a20000a50000a70000a80000a90000ac0000ad' +
    '0000af0000aj0000ak0000al0000am0000an0000ao0000ap0000aq0000ar0000at0000aw0000b00000b30000b4' +
    '0000b70000b80000b90000bb0000bc0000bd0000bf0000bg0000bi0000bl0000bm0000bp0000bq0000br0000bs' +
    '0000bt0000bu0000bv0000bw0000bz0000c00000c20000c50000c70000c80000c90000cb0000cd0000ce0000cf' +
    '0000cg0000ci0000ck0000cl0000cm0000co0000cp0000cr0000cs0000ct0000cx0000cy0000d20000d30000d5' +
    '0000d60000da0000dc0000de0000dh0000dj0000dl0000dn0000dp0000dq0000dr0000ds0000du0000dv0000dx' +
    '0000dy0000dz0000e10000e30000e40000e50000e60000e80000e90000ea0000eb0000ee0000ef0000eh0000ei' +
    '0000el0000eo0000ep0000er0000et0000eu0000ev0000ey0000ez0000f00000f20000f30000f80000f90000fa' +
    '0000fe0000fg0000fi0000fj0000fk0000fm0000fn0000fo0000fp0000fq0000fs0000ft0000fv0000fy0000g0' +
    '0000g10000g40000g50000g60000g80000g90000gd0000ge0000gg0000gh0000gk0000gm0000gn0000go0000gq' +
    '0000gr0000gu0000gv0000gw0000gx0000gy0000gz0000h40000h50000h60000h80000h90000ha0000hc0000hf' +
    '0000hh0000hj0000hk0000hm0000hn0000hp0000hq0000hr0000hu0000hv0000hy0000hz0000i00000i50000i7' +
    '0000ic0000if0000ig0000ih0000ik0000il0000im0000in0000ip0000ir0000is0000it0000iu0000iw0000iz' +
    '0000j00000j20000j30000j40000j50000j60000j70000j80000jc0000jd0000je0000jf0000jg0000ji0000jl' +
    '0000jn0000jo0000jp0000jq0000jr0000js0000ju0000jw0000k00000k20000k30000k40000k60000k70000k8' +
    '0000kc0000kd0000ki0000km0000ko0000kp0000kq0000ku0000kv0000kw0000kx0000ky0000l10000l30000l4' +
    '0000l50000l60000l70000la0000lb0000lh0000li0000lj0000lk0000lo0000lp0000lq0000ls0000lw0000m1' +
    '0000m40000m90000ma0000md0000mf0000mg0000mh0000mi0000mj0000ml0000mn0000mo0000mr0000mt0000mu' +
    '0000mv0000mw0000mx0000mz0000n00000n10000n20000n30000n40000n70000n80000n90000nd0000ne0000nf' +
    '0000nh0000nj0000nl0000nn0000ns0000nv0000nw0000nx0000ny0000nz0000o10000o20000o30000o50000o7' +
    '0000o80000o90000oa0000ob0000oc0000of0000og0000oi0000ok0000om0000op0000os0000ov0000oz0000p1' +
    '0000p30000p50000p60000p70000p80000p90000pa0000pd0000pe0000pg0000ph0000pi0000pk0000pl0000pm' +
    '0000pn0000po0000pp0000pq0000pr0000ps0000pt0000pw0000px0000py0000q20000q30000q40000q50000q7' +
    '0000q80000qa0000qb0000qc0000qd0000qe0000qf0000qg0000qj0000ql0000qm0000qn0000qo0000qq0000qr' +
    '0000qt0000qu0000qv0000qy0000qz0000r10000r20000r30000r40000r50000r70000r80000r90000ra0000rc' +
    '0000rd0000rg0000ri0000rl0000rn0000rr0000rs0000rw0000ry0000rz0000s00000s10000s30000s40000s5' +
    '0000s60000s70000s90000sb0000sc0000se0000sf0000sg0000sj0000sl0000sp0000sq0000ss0000st0000sw' +
    '0000sx0000t10000t20000t40000t50000t80000t90000ta0000tb0000tc0000td0000te0000tg0000th0000ti' +
    '0000tj0000tk0000tl0000tn0000to0000tp0000tq0000tr0000tx0000u00000u30000u40000u50000u60000u9' +
    '0000ua0000ud0000ue0000uf0000ui0000uj0000uk0000ul0000um0000un0000uo0000uq0000ut0000uw0000ux' +
    '0000v00000v20000v30000v40000v50000v90000va0000vb0000vd0000ve0000vf0000vj0000vp0000vr0000vw' +
    '0000vy0000w00000w30000w60000w70000wa0000wc0000wd0000we0000wf0000wg0000wk0000wl0000wm0000wp' +
    '0000wr0000ws0000wu0000wx0000wz0000x30000x40000x50000x70000xa0000xb0000xf0000xh0000xi0000xj' +
    '0000xk0000xl0000xn0000xp0000xr0000xt0000xu0000xv0000xz0000y20000y40000y50000y60000y80000y9' +
    '0000ya0000yc0000yd0000ye0000yf0000yh0000yl0000yn0000yq0000yr0000yu0000yx0000yz0000z00000z3' +
    '0000z40000z60000z80000z90000za0000zb0000zc0000zd0000ze0000zf0000zl0000zm0000zn0000zo0000zs' +
    '0000zt0000zw00010100010200010500010600010900010c00010d00010f00010h00010i00010j00010n00010o' +
    '00010q00010s00010w00010z00011000011100011400011700011800011c00011e00011h00011i00011j00011k' +
    '00011l00011n00011p00011t00011u00011v00011w00011x000120000121000122000123000126000127000128' +
    '00012900012a00012c00012d00012g00012j00012k00012l00012m00012p00012q00012r00012s00012t00012v' +
    '00012w00012x00012y00012z00013100013200013300013400013600013700013800013a00013c00013f00013h' +
    '00013l00013m00013n00013o00013q00013r00013s00013t00013w00013z000141000142000143000144000146' +
    '00014700014800014900014b00014e00014h00014l00014m00014n00014o00014p00014s00014t00014v00014w' +
    '00014y00014z00015000015100015300015500015800015900015a00015b00015c00015g00015i00015j00015k' +
    '00015l00015m00015n00015o00015s00015t00015u00015v00015x000160000163000165000166000168000169' +
    '00016b00016c00016d00016f00016g00016h00016i00016k00016l00016m00016n00016p00016q00016s00016v' +
    '00017000017100017300017500017600017800017900017b00017c00017d00017e00017f00017h00017i00017j' +
    '00017k00017m00017o00017p00017q00017r00017s00017u00017w00017y000180000182000183000184000187' +
    '00018800018900018c00018e00018f00018g00018h00018m00018n00018o00018r00018s00018w00018x00018y' +
    '00019000019500019800019d00019e00019g00019i00019j00019m00019n00019o00019q00019r00019s00019t' +
    '00019v00019w00019y00019z0001a10001a20001a30001a60001a70001aa0001ac0001ad0001ae0001ak0001al' +
    '0001am0001ao0001ap0001aq0001as0001av0001aw0001ax0001ay0001az0001b00001b10001b30001b40001b6' +
    '0001b70001b80001ba0001bc0001bd0001be0001bf0001bk0001bm0001bo';
  var DEAL_LIST = [];
  (function () {
    for (var i = 0; i + 6 <= DEALS.length; i += 6) DEAL_LIST.push(parseInt(DEALS.substr(i, 6), 36));
  })();

  var bag = [];
  function pickSeed() {
    if (!DEAL_LIST.length) return (Math.random() * 2147483000) >>> 0;   // 保険（ふつう 通らない）
    if (!bag.length) {
      bag = DEAL_LIST.slice();
      for (var i = bag.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1)), t = bag[i]; bag[i] = bag[j]; bag[j] = t;
      }
    }
    return bag.pop();
  }

  /* ── 部品 ─────────────────────────────────── */
  var G = null, boardEl = null, boardIn = null, cardEl = [], spotEl = {}, built = false;
  var busy = false, autoTimer = 0, fallStop = null;
  var geo = { cw: 48, ch: 73, gap: 4, ovUp: 18, ovDn: 9, rowGap: 12, x0: 0, lift: 30 };

  function say(t) { $('happyBubble').textContent = t; }

  /* ============================================================
     ★★ 寸法（仕様 §1-3）★★
     ------------------------------------------------------------
     ここが この ゲームの 心臓。**札の 大きさを 決めているのは 横では なく たて。**
     19枚（裏6＋表13・仕様 §1-2 で 証明ずみの 上限）が 入る はばを、
     大きい方から 1pxずつ 下げて さがす。
     → 見つかった 大きさなら、どんな 場面でも スクロールは ぜったいに 出ない。
       確率を 1回も 数えずに 言い切れる（仕様 §8-1②）。
     ============================================================ */
  function fit(W, H, gap) {
    for (var w = TUNE.CARD_MAX; w >= 24; w--) {
      var h = Math.round(w * TUNE.RATIO);
      var ovUp = Math.round(h * TUNE.OVER_UP);      // 表向きの 重なり（25%）
      var ovDn = Math.round(h * TUNE.OVER_DOWN);    // 裏向きの 重なり（12%）
      var rowGap = Math.max(8, Math.round(h * 0.11));
      var colH = 6 * ovDn + 12 * ovUp + h;          // ★ 1列の 最大（19枚）
      if (w * 7 + gap * 6 <= W && h + rowGap + colH <= H) {
        return { cw: w, ch: h, ovUp: ovUp, ovDn: ovDn, rowGap: rowGap, gap: gap, colH: colH };
      }
    }
    var h2 = Math.round(24 * TUNE.RATIO);
    return { cw: 24, ch: h2, ovUp: Math.round(h2 * .25), ovDn: Math.round(h2 * .12), rowGap: 8, gap: gap, colH: 0 };
  }

  function layout() {
    if (!boardIn) return;
    cancelDrag();                       // ★ 大きさが 変わる 前に 手を はなす（T67）
    var W = boardIn.clientWidth, H = boardIn.clientHeight;
    if (!W || !H) return;
    var gp = W >= 620 ? 16 : (W >= 360 ? 4 : 3);
    var got = fit(W, H, gp);
    /* 指で おす 目安 44px を 下回る ときだけ、列の 間を つめて 取り返す
       （320px の ような せまい 画面 むけ。ふだんは 通らない）*/
    if (got.cw < 44 && gp > 2) { var alt = fit(W, H, 2); if (alt.cw > got.cw) got = alt; }
    geo = got;
    geo.x0 = Math.max(0, Math.round((W - (geo.cw * 7 + geo.gap * 6)) / 2));
    /* つかんだ 札を 持ち上げる 量。札の 45%を こえない ように だけ しばる
       （320px の 62px札 でも 札の 半分より 下に 指が 残る）*/
    geo.lift = Math.round(Math.min(TUNE.LIFT, geo.ch * 0.45));
    var r = document.documentElement.style;
    r.setProperty('--cw', geo.cw + 'px');
    r.setProperty('--ch', geo.ch + 'px');
    r.setProperty('--radius', Math.max(4, Math.round(geo.cw * 0.075)) + 'px');
    placeSpots();
    if (G) render(true);
  }

  function colX(i) { return geo.x0 + i * (geo.cw + geo.gap); }
  function tabY() { return geo.ch + geo.rowGap; }

  /* ── 置き場（13か所）と 52枚の 札を 1回だけ 作る ───────── */
  function build() {
    if (built) return;
    built = true;
    boardEl = $('board');
    boardIn = document.createElement('div');
    boardIn.className = 'board-in';
    boardEl.appendChild(boardIn);

    function spot(key, label) {
      var d = document.createElement('div');
      d.className = 'spot';
      d.dataset.spot = key;
      if (label) d.textContent = label;
      boardIn.appendChild(d);
      spotEl[key] = d;
      return d;
    }
    spot('stock').classList.add('is-stock');
    spot('waste');
    var MARK = ['♠', '♥', '♦', '♣'];
    for (var s = 0; s < 4; s++) spot('f' + s, MARK[s]);
    for (var i = 0; i < 7; i++) spot('c' + i);

    for (var c = 0; c < 52; c++) {
      var d = document.createElement('div');
      d.className = 'card is-down';
      d.dataset.id = String(c);
      var inn = document.createElement('div');
      inn.className = 'card-in';
      var f = document.createElement('img'); f.className = 'cf'; f.alt = ''; f.draggable = false;
      var b = document.createElement('img'); b.className = 'cb'; b.alt = ''; b.draggable = false; b.src = BACK_SRC;
      f.onerror = (function (cc, el) { return function () { fallback(cc, el); }; })(c, inn);
      inn.appendChild(f); inn.appendChild(b);
      d.appendChild(inn);
      boardIn.appendChild(d);
      cardEl.push(d);
    }

    /* ★ 操作は Pointer Events だけ（T67・社長指示）
       ------------------------------------------------------------
       HTML5 の draggable / dragstart / drop は 1つも 使わない ―― スマホで 動かない。
       pointer* なら マウスも 指も 同じ 1本の コードで 動く。
       ⚠️ ここに click は 足さない こと。足した 瞬間に
          「おしたら 勝手に 動く」が 生き返る。 */
    boardIn.addEventListener('pointerdown', onDown);
    boardIn.addEventListener('pointermove', onMove);
    boardIn.addEventListener('pointerup', onUp);
    boardIn.addEventListener('pointercancel', onCancel);      // 電話が 来た とき など
    boardIn.addEventListener('lostpointercapture', onCancel); // 指を 見失った とき
    /* 長おし の メニュー・画像の 引きずり（パソコン）を 止める */
    boardIn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    boardIn.addEventListener('dragstart', function (e) { e.preventDefault(); });
  }

  /* 画像が 届かなかった ときだけ（ふだんは 一度も 通らない）*/
  function fallback(c, inn) {
    if (inn.querySelector('.fallback')) return;
    var d = document.createElement('div');
    d.className = 'fallback ' + (isRed(c) ? 'red' : 'black');
    d.textContent = (isRed(c) ? (suitOf(c) === 1 ? '♥' : '♦') : (suitOf(c) === 0 ? '♠' : '♣')) + RANKS[rankOf(c)];
    inn.appendChild(d);
  }

  function placeSpots() {
    function put(el, x, y) { el.style.transform = 'translate(' + x + 'px,' + y + 'px)'; el.style.width = geo.cw + 'px'; el.style.height = geo.ch + 'px'; }
    put(spotEl.stock, colX(0), 0);
    put(spotEl.waste, colX(1), 0);
    for (var s = 0; s < 4; s++) { put(spotEl['f' + s], colX(3 + s), 0); spotEl['f' + s].style.fontSize = Math.round(geo.cw * 0.55) + 'px'; }
    for (var i = 0; i < 7; i++) put(spotEl['c' + i], colX(i), tabY());
  }

  /* ============================================================
     ★★ すべっている 札は おせない（T69・🔴1）★★
     ------------------------------------------------------------
     めくった 札は TUNE.MOVE ミリ秒 かけて 山札 → めくり場 へ すべる。
     その あいだ、その 札は まだ **山札の 上に かぶさった まま** なので、
     2発目の クリックが 山札では なく「飛んでいる 札」に 当たっていた。
       ・2発目 ＝ その札への 1回目の おし → **山札が めくれない**（クリックが 消える）
       ・3発目 ＝ 2回おし 成立     → **札が 勝手に 組札へ 上がる**
     トライの 実測で 20クリック→16手（20%が 消える）／♦A が 勝手に 上がる。
     設計図の 追記②（気づかない うちに 札が 動く）に まっすぐ 反する ので、
     ここは 手ざわりの 話では なく **こわれている** 側。

     → 動き出した 札に is-fly（pointer-events:none）を 付け、
       動き終わったら 外す。クリックは 下の 山札に そのまま 通る。
     ★ transitionend では なく 時間で 外すのは、動きが 途中で 取り消された
       とき（連続で 動く・no-anim に なる）に 札が 永久に おせなく なるのを
       ふせぐ ため。時間なら 何が あっても 必ず もどる。
     ============================================================ */
  var flyTimer = [], lastTf = [];
  function flyMark(c, el) {
    el.classList.add('is-fly');
    clearTimeout(flyTimer[c]);
    flyTimer[c] = setTimeout(function () { el.classList.remove('is-fly'); }, TUNE.MOVE + 40);
  }
  function flyClear() {
    for (var i = 0; i < cardEl.length; i++) {
      clearTimeout(flyTimer[i]);
      if (cardEl[i]) cardEl[i].classList.remove('is-fly');
    }
  }

  /* ── 並べる ─────────────────────────────────
     置き場所は transform だけで 決める ので、変わった ぶんが
     そのまま すべる 動きに なる（別に 飛ばす 仕組みを 作らない）。 */
  function place(c, x, y, z, up) {
    var el = cardEl[c];
    var tf = 'translate(' + x + 'px,' + y + 'px)';
    /* ⚠️ 「動いたか」を el.style.transform と くらべて 見ては いけない。
       ブラウザは 入れた 文字を 書き直す（'translate(0px,0px)' →
       'translate(0px, 0px)'）ので、いつでも 「ちがう」に なり、
       **52枚 全部が すべっている 扱い ＝ 盤面が 0.22秒 おせなく なる**。
       ここで 入れた 文字を 自分で 覚えて おいて くらべる。 */
    if (lastTf[c] !== tf) {
      lastTf[c] = tf;
      el.style.transform = tf;
      /* ★ 本当に 動いた 札だけ おせなく する。
         no-anim（配り直し）と 運んでいる 札は すべらない ので 対象外。 */
      if (!boardEl.classList.contains('no-anim') && !el.classList.contains('is-drag')) flyMark(c, el);
    }
    el.style.zIndex = String(z);
    el.classList.remove('as-stock');     // 山札の 札だけ 後から 付け直す（見た目の 指の形）
    if (up) {
      var f = el.firstChild.firstChild;
      if (!f.getAttribute('src')) f.src = cardSrc(nameOf(c));   // ★ 今つかう札だけ 読む
      el.classList.remove('is-down');
    } else {
      el.classList.add('is-down');
    }
  }

  function render(instant) {
    if (!G) return;
    if (instant) { boardEl.classList.add('no-anim'); flyClear(); }   // 配り直しは 全部 おせる 状態に 戻す
    var z = 1, i, k, s, r, y, col;

    for (i = 0; i < G.stock.length; i++) {
      place(G.stock[i], colX(0), 0, z++, false);
      cardEl[G.stock[i]].classList.add('as-stock');
    }
    for (i = 0; i < G.waste.length; i++) place(G.waste[i], colX(1), 0, z++, true);
    for (s = 0; s < 4; s++) for (r = 0; r < G.found[s]; r++) place(s * 13 + r, colX(3 + s), 0, z++, true);
    for (i = 0; i < 7; i++) {
      col = G.tab[i]; y = tabY();
      for (k = 0; k < col.down.length; k++) { place(col.down[k], colX(i), y, z++, false); y += geo.ovDn; }
      for (k = 0; k < col.up.length; k++) { place(col.up[k], colX(i), y, z++, true); y += geo.ovUp; }
    }
    /* 山札が 空の ときだけ「まぜ直せる」目じるし（文字は 1つも 足さない）*/
    spotEl.stock.classList.toggle('no-recycle', G.stock.length > 0 || G.waste.length === 0);

    if (instant) { void boardEl.offsetWidth; boardEl.classList.remove('no-anim'); }
  }

  /* ============================================================
     ★★ 操作（T67・社長指示 2026-08-20）★★
     ------------------------------------------------------------
       つまんで 運ぶ … **札の 移動は 全部 これ。** 列→列・列→右上・
                       めくった札→列・右上→列（ルール5）―― 例外なし。
       2回 続けて おす … 右上（組札）へ 上げる。
                       ★ 上げられない ときは **何も 起きない**（音も 動きも 無し）
       山札を おす     … めくる（前と 同じ）

     ★★ なぜ 作り直したか（社長の 言葉・消さずに 残す）★★
       「今クリックをすると自動でトランプが動いてしまい、それが例え正しい行動だったとして、
         プレイヤーが気づいていない予期せぬ行動のため、ひらめき感が全くなくなっちゃってる。」

       これは「操作が 不便」では なく「**遊びが こわれている**」という 指摘。
       ソリティアの 面白さは「あ、そこに 置ける！」と **人が 気づく** 瞬間。
       T66 の 1回タップ移動は、置き場所を **プログラムが 探して** 動かしていた
       ―― たとえ その手が 正しくても、気づいたのは 人では ない。
       → だから「置ける場所を 探して 動かす」処理は、**2回おし（右上へ）の
         ためだけ**に 残し、それ以外は 1つも 使わない。firstCol（左から 順に
         置ける列を 探す）は まるごと 消した。**どこに 置くかは 必ず 人が 決める。**

     ★★ 見せ方は 1つだけ（設計図 §5.5：強調は 1画面に 1種類まで）★★
       「置ける ところを 光らせる」は **やらない。**
       それを やると 置ける場所を プログラムが 教える ことに なり、
       社長が 消せと 言った「ひらめきを 奪う」に 逆もどり する
       ―― 自動で 動かすのを やめても、答えを 先に 見せたら 同じ こと。
       → 見せ方は「**置けなければ 元の 場所に すっと 戻る**」の 1つだけ。
         運んでいる 札が 指に ついてくる ことが 主役の 手ざわり。

     ★★ スマホで 必ず 動かす ための 決めごと ★★
       ① HTML5 の draggable / dragstart / drop は 使わない（スマホで 動かない）
       ② touch-action:none（CSS）＋ preventDefault で ページを 動かさない
       ③ setPointerCapture ―― 指が 札の 外に 出ても 追いかける
       ④ pointercancel（電話が 来た 等）で 札を 宙に 浮かせたまま 消さない
       ⑤ 見るのは **1本目の 指だけ**（2本目は 無視。指2本の 拡大と けんかしない）
     ============================================================ */

  function findCard(c) {
    if (G.stock.indexOf(c) >= 0) return { z: 'stock' };
    var wi = G.waste.indexOf(c);
    if (wi >= 0) return { z: 'waste', top: wi === G.waste.length - 1 };
    var s = suitOf(c);
    if (rankOf(c) < G.found[s]) return { z: 'found', s: s, top: rankOf(c) === G.found[s] - 1 };
    for (var i = 0; i < 7; i++) {
      var k = G.tab[i].up.indexOf(c);
      if (k >= 0) return { z: 'up', i: i, k: k };
      if (G.tab[i].down.indexOf(c) >= 0) return { z: 'down', i: i };
    }
    return { z: '?' };
  }

  /* ── ① どの札を つかんだか ──────────────────────
     札は 375px の とき 18px しか 見えていない。
     重なった 列の 中から「おした ところの 札」を 正しく 取る 必要が ある。
     ★ ここは ブラウザに 任せるのが 正解：
       札は 1枚ずつ 別の 部品で、上に ある札ほど z-index が 大きい。
       だから e.target から いちばん 近い .card を たどれば、
       **画面で いちばん 手前に 見えている 札**が そのまま 取れる。
       （下の札の 見えていない 部分は、上の札に おおわれて いる ので 当たらない）
     ★ 裏向きの札・下に うまっている 札は つかめない → null を 返す。 */
  function grabAt(c) {
    var p = findCard(c);
    if (p.z === 'stock') return { kind: 'stock' };
    if (p.z === 'waste') return p.top ? { kind: 'waste', card: c, cards: [c] } : null;
    if (p.z === 'found') return p.top ? { kind: 'found', s: p.s, card: c, cards: [c] } : null;
    if (p.z === 'up') {
      /* ★ 連なった札は まとめて 運ぶ（クロンダイクの ルール2）
         つかんだ札から **下に ある札は 全部 ついてくる**。1枚だけ 抜き取れない。
         ★ 表向きの 列は 作りじょう いつも「色 交互・1つずつ 小さい」並び に なる
           （場札に 置くには canStack を 通る しか ない ため）。
           だから どこを つかんでも、ついてくる かたまりは 必ず 正しい 並び。 */
      return { kind: 'up', i: p.i, k: p.k, card: c, cards: G.tab[p.i].up.slice(p.k) };
    }
    return null;
  }

  /* ── ② 落とした 先を さがす ────────────────────
     指の 位置では なく **運んでいる 札の 四角**で 見る（本物の ソリティアと 同じ）。
     いちばん 大きく 重なった 置き場を 選ぶ。どこにも かからなければ null。 */
  function dropZone(x, y) {
    var best = null, bestA = 0, s, j, a;
    var cw = geo.cw, ch = geo.ch;
    function over(zx, zy, zw, zh) {
      var w = Math.min(x + cw, zx + zw) - Math.max(x, zx);
      var h = Math.min(y + ch, zy + zh) - Math.max(y, zy);
      return (w > 0 && h > 0) ? w * h : 0;
    }
    for (s = 0; s < 4; s++) {
      a = over(colX(3 + s), 0, cw, ch);
      if (a > bestA) { bestA = a; best = { t: 'f', s: s }; }
    }
    /* 場札の 列は **下まで まるごと** 受ける ―― 長い列の どこに 落としても 入る */
    var top = tabY(), colH = Math.max(ch, boardIn.clientHeight - top);
    for (j = 0; j < 7; j++) {
      a = over(colX(j), top, cw, colH);
      if (a > bestA) { bestA = a; best = { t: 'c', j: j }; }
    }
    return best;
  }

  /* ── ③ その 置きかたは ルール上 通るか（通らなければ null）────
     ⚠️ ここは「置けるか どうか」を 見るだけ。行き先を **探さない**。
        探した 瞬間に、社長が 消せと 言った 仕組みが 戻ってくる。 */
  function moveFor(g0, z) {
    if (!g0 || !z) return null;
    var c = g0.card;
    if (z.t === 'f') {                                  // 右上（組札）へ
      if (g0.kind === 'found') return null;             // 組札 → 組札 は ない
      if (g0.cards.length !== 1) return null;           // まとめては 上げられない
      if (suitOf(c) !== z.s || !canToFound(G, c)) return null;
      return g0.kind === 'waste' ? { k: 'WF' } : { k: 'TF', from: g0.i };
    }
    var j = z.j, t = G.tab[j];                          // 下の 7列へ
    if (g0.kind === 'up' && j === g0.i) return null;    // 同じ列に 戻すのは 手では ない
    if (t.up.length) { if (!canStack(c, t.up[t.up.length - 1])) return null; }
    else if (t.down.length || rankOf(c) !== 12) return null;   // 空の列に 置けるのは K だけ
    if (g0.kind === 'up') {
      /* 列まるごと（裏0枚）→ **空の列** は 何も 変わらない ので 手に しない。
         ⚠️ 「行き先が 空の列の とき だけ」―― legalMoves と 同じ 条件に そろえる。
            !t.up.length を 落とすと、裏0枚の 列の 札が 1枚も 運べなく なる
            （最初の 配りの 1列目が まさに これ。実際に つまずいた）。 */
      if (g0.k === 0 && G.tab[g0.i].down.length === 0 && !t.up.length) return null;
      return { k: 'TT', from: g0.i, n: g0.cards.length, to: j };
    }
    if (g0.kind === 'waste') return { k: 'WT', to: j };
    return { k: 'FT', s: g0.s, to: j };
  }

  /* ── ④ 2回 続けて おした ときだけ 使う「右上へ」───────────
     ★ 社長指示で 残す ただ 1つの「探して 動かす」処理。
       探すのは **マークが 決まっている 1か所だけ** なので、
       人が 選ぶ 余地を 奪わない（A は ♠A なら ♠の 山にしか 行けない）。 */
  function toFoundation(g0) {
    if (!g0 || g0.kind === 'stock' || g0.kind === 'found') return null;
    if (g0.cards.length !== 1) return null;             // 下に 札が あるなら 上げられない
    if (!canToFound(G, g0.card)) return null;
    return g0.kind === 'waste' ? { k: 'WF' } : { k: 'TF', from: g0.i };
  }

  /* ============================================================
     ★ 運ぶ 本体（1本の 指だけ・setPointerCapture つき）
     ============================================================ */
  var drag = null;                                   // 運んでいる 途中。null なら 何もしていない
  var lastTap = { c: -1, t: 0, x: 0, y: 0 };         // 2回おし の 判定用

  function lift(d) {                                  // 札を 持ち上げる
    d.live = true;
    /* ★ 指より geo.lift px 上へ ずらす（T69・TUNE.LIFT の 説明を 読むこと）。
       ここで ずらすのは 「指と 札の ずれ」そのもの なので、
       このあとの d.y も dropZone() の 判定も 全部 一緒に 上がる
       ＝ **見えている 札の 場所が そのまま 判定の 場所**。 */
    d.oy -= geo.lift;
    for (var i = 0; i < d.src.cards.length; i++) {
      var el = cardEl[d.src.cards[i]];
      el.classList.add('is-drag');                    // すべる 動きを 切る（指に ぴったり つける）
      el.style.zIndex = String(900 + i);              // どの札より 手前に
    }
  }
  function follow(d) {                                // 指に ついてくる
    for (var i = 0; i < d.src.cards.length; i++) {
      var c = d.src.cards[i];
      var tf = 'translate(' + d.x + 'px,' + (d.y + i * geo.ovUp) + 'px)';
      /* ★ place() が 見る「今どこに いるか」の 控えも 一緒に 書きかえる。
         これを 忘れると、元の 場所に 戻す とき「動いていない」と
         見なされて **札が 指の 所に 貼りついた まま** に なる。 */
      lastTf[c] = tf;
      cardEl[c].style.transform = tf;
    }
  }
  function unlift(d) {                                // 手を はなす
    for (var i = 0; i < d.src.cards.length; i++) cardEl[d.src.cards[i]].classList.remove('is-drag');
    /* ★ ここで 1回 描き直させる。これが 無いと 「すべる 動き」が 戻る 前に
       置き場所を 書きかえて しまい、札が 瞬間移動 する。 */
    void boardIn.offsetWidth;
  }

  function onDown(e) {
    if (!G || G.over || busy) return;
    if (drag) return;                                 // ★ 2本目の 指は 見ない
    if (e.isPrimary === false) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    var t = e.target;
    var cEl = t.closest ? t.closest('.card') : null;
    var sp = t.closest ? t.closest('.spot') : null;
    var g0 = null, stock = false;

    if (cEl) {
      g0 = grabAt(parseInt(cEl.dataset.id, 10));
      if (!g0) return;                                // 裏向き ／ 下の札 → 何も しない
      if (g0.kind === 'stock') { stock = true; g0 = null; }
    } else if (sp && sp.dataset.spot === 'stock') {
      stock = true;                                   // 山札が 空の とき（まぜ直し）
    } else return;

    e.preventDefault();                               // ★ ページを 動かさない
    var r = boardIn.getBoundingClientRect();
    var d = {
      id: e.pointerId, src: g0, stock: stock, live: false, moved: false,
      sx: e.clientX - r.left, sy: e.clientY - r.top,
      rl: r.left, rt: r.top, ox: 0, oy: 0, x: 0, y: 0,
      card: g0 ? g0.card : -1
    };
    if (g0) {                                         // つかんだ 場所と 札の ずれを 覚える
      var er = cardEl[g0.card].getBoundingClientRect();
      d.x = er.left - r.left; d.y = er.top - r.top;
      d.ox = d.x - d.sx; d.oy = d.y - d.sy;
    }
    drag = d;
    try { boardIn.setPointerCapture(e.pointerId); } catch (err) {}
  }

  function onMove(e) {
    var d = drag;
    if (!d || e.pointerId !== d.id) return;
    var x = e.clientX - d.rl, y = e.clientY - d.rt;
    if (!d.live) {
      var dx = x - d.sx, dy = y - d.sy;
      if (dx * dx + dy * dy < TUNE.DRAG_SLOP * TUNE.DRAG_SLOP) return;   // まだ タップ 扱い
      d.moved = true;                                 // ★ ここから 先は タップでは ない
      if (!d.src) return;                             // 山札は 運べない
      lift(d);
    }
    e.preventDefault();
    d.x = x + d.ox; d.y = y + d.oy;
    follow(d);
  }

  function onUp(e) {
    var d = drag;
    if (!d || e.pointerId !== d.id) return;
    drag = null;
    try { boardIn.releasePointerCapture(e.pointerId); } catch (err) {}

    if (d.live) {                                     // 運んで いた → 落とす
      var mv = moveFor(d.src, dropZone(d.x, d.y));
      unlift(d);
      if (mv) { play(mv); return; }
      /* ★ 置けない → 元の 場所へ すっと 戻る。それだけ。
         音は 鳴らさない ―― 社長は 2回おしが 効かない ときを
         「音も 動きも 無し」と 決めた。同じ 手ざわりに そろえる。
         それに、ためしに 置いてみる のは この ゲームの 遊び方 そのもの。
         ためす たびに 音で とがめては 「どんどん ためして いい」に 反する。 */
      render();
      return;
    }
    if (d.moved) return;                              // 動かした けれど 運んでは いない
    if (d.stock) { play({ k: 'D' }); return; }        // 山札は おすだけで めくれる

    /* ここから 2回おし の 判定（1回だけ おしても 何も 起きない）*/
    if (d.card < 0) return;
    var now = e.timeStamp || Date.now();
    var near = Math.abs(d.sx - lastTap.x) <= TUNE.DOUBLE_SLOP &&
               Math.abs(d.sy - lastTap.y) <= TUNE.DOUBLE_SLOP;
    if (lastTap.c === d.card && near && now - lastTap.t <= TUNE.DOUBLE_MS) {
      lastTap.c = -1;
      var up = toFoundation(d.src);
      if (up) play(up);                               // ★ 上げられない ときは 何も 起きない
      return;
    }
    lastTap = { c: d.card, t: now, x: d.sx, y: d.sy };
  }

  /* ★ 電話が 来た・指を 見失った ―― 札を 宙に 浮かせたまま に しない */
  function onCancel(e) {
    var d = drag;
    if (!d || e.pointerId !== d.id) return;
    drag = null;
    try { boardIn.releasePointerCapture(e.pointerId); } catch (err) {}
    if (d.live) { unlift(d); render(); }
  }
  /* 画面の 大きさが 変わった ときも 同じ（置き場所を 計算し直す 前に 手を はなす）*/
  function cancelDrag() {
    var d = drag;
    if (!d) return;
    drag = null;
    if (d.live) unlift(d);
  }

  /* ⚠️ T66に あった「置けない札を おした ときの ゆれ ＋ 小さい音」は
     T67で まるごと 消した。置けない ことは **札が 元へ 戻る** ことで 伝わる
     ―― 返事を 2つに すると、社長が 決めた「見せ方は 1つだけ」に 反する。 */

  /* ── 1手 打つ（★人の 手は かならず ここを 通る）───────── */
  function play(mv) {
    doMove(G, mv);
    render();
    updateTools();
    if (isWin(G)) { finish(); return; }
    if (downCount(G) === 0) { startAuto(); return; }      // ★ 裏0枚 ＝ 勝ち確定（仕様 §5-3）
    if (isStuck(G)) showResult('stop');                    // ★ 3つの 条件が そろった ときだけ
  }

  function updateTools() {
    $('btnUndo').disabled = !G || !G.hist.length || busy;
  }

  /* ============================================================
     ★ 裏向きが 0枚に なった 瞬間、残り 全部が 勝手に 飛んでいく（仕様 §5-2）
     ------------------------------------------------------------
     ボタンは 作らない。文字も 出さない。人が 何かを おす 必要も ない。
     「裏向き0枚 ＝ 勝ち確定」は 確率では なく 理屈（仕様 §5-3）。
     ============================================================ */
  function startAuto() {
    busy = true; updateTools();
    say('ぜんぶ 見えた！　あとは まかせて！');
    autoTimer = setTimeout(autoStep, TUNE.AUTO_WAIT);
  }
  function foundMove() {
    for (var i = 0; i < 7; i++) {
      var u = G.tab[i].up;
      if (u.length && canToFound(G, u[u.length - 1])) return { k: 'TF', from: i };
    }
    if (G.waste.length && canToFound(G, G.waste[G.waste.length - 1])) return { k: 'WF' };
    return null;
  }
  function autoStep() {
    if (isWin(G)) { busy = false; finish(); return; }
    var guard = 0, moved = false;
    while (guard++ < 80) {
      var f = foundMove();
      if (f) { doMove(G, f, { hist: false }); moved = true; break; }
      if (!G.stock.length && !G.waste.length) break;
      doMove(G, { k: 'D' }, { hist: false });               // 山札は 数えずに めくる
    }
    render();
    if (!moved) { busy = false; return; }                   // 念のための 出口（理屈では 通らない）
    autoTimer = setTimeout(autoStep, TUNE.AUTO_STEP);
  }

  /* ── 勝ち ────────────────────────────────── */
  function finish() {
    busy = true; G.over = true; G.won = true;
    updateTools(); render();
    say('やったー！　きれいに そろったね！');
    $('happyCat').classList.add('is-jump');
    autoTimer = setTimeout(startFall, TUNE.FALL_WAIT);
  }

  /* ============================================================
     ★ 札が 降る 演出（仕様 §6-1・社長裁定3）
     ------------------------------------------------------------
     canvas を 消さずに 描きつづける ので、あの おなじみの 帯が のこる。
     ・タップで 飛ばせる
     ・TUNE.FALL_MAX（6秒）で かってに 止まる ―― 誰も 閉じこめない
     ============================================================ */
  function startFall() {
    var cv = $('fallCanvas');
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var Wp = window.innerWidth, Hp = window.innerHeight;
    cv.width = Math.round(Wp * dpr); cv.height = Math.round(Hp * dpr);
    cv.classList.remove('hidden');
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var src = [];
    for (var s = 0; s < 4; s++) src.push(spotEl['f' + s].getBoundingClientRect());
    var order = [], r, s2;
    for (r = 12; r >= 0; r--) for (s2 = 0; s2 < 4; s2++) order.push(s2 * 13 + r);

    var live = [], next = 0, t0 = performance.now(), raf = 0, done = false;
    var cw = src[0].width, ch = src[0].height;

    function stop() {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf);
      cv.removeEventListener('pointerdown', stop);
      ctx.clearRect(0, 0, Wp, Hp);
      cv.classList.add('hidden');
      fallStop = null;
      showResult('win');
    }
    fallStop = stop;
    cv.addEventListener('pointerdown', stop);

    function tick(now) {
      var el = now - t0;
      if (el > TUNE.FALL_MAX) { stop(); return; }
      while (next < order.length && el > next * TUNE.FALL_STEP) {
        var c = order[next], b = src[suitOf(c)];
        var img = cardEl[c].firstChild.firstChild;      // すでに 読みこんである 表の 絵
        var dir = Math.random() < .5 ? -1 : 1;
        live.push({
          img: img, x: b.left, y: b.top, w: cw, h: ch,
          vx: dir * (1.6 + Math.random() * 4.2), vy: -(1 + Math.random() * 5)
        });
        next++;
      }
      for (var i = live.length - 1; i >= 0; i--) {
        var p = live[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.62;
        if (p.y + p.h > Hp) {
          p.y = Hp - p.h;
          p.vy = -p.vy * 0.80;
          if (p.vy > -3) p.vy = -(3 + Math.random() * 3);
        }
        if (p.img.complete && p.img.naturalWidth) {
          try { ctx.drawImage(p.img, p.x, p.y, p.w, p.h); } catch (e) {}
        }
        if (p.x + p.w < -20 || p.x > Wp + 20) live.splice(i, 1);
      }
      if (next >= order.length && live.length === 0) { stop(); return; }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
  }

  /* ============================================================
     ★ 結果の 箱 ＋ 連打よけ（仕様 §6-1・T62の 事故を くり返さない）
     ------------------------------------------------------------
       ① 箱が 出てから RESULT_LOCK ミリ秒 たっている
       ② かつ 最後に さわってから RESULT_QUIET ミリ秒 さわっていない
     ＝「指が 止まってから」おせるように なる。時間だけの 待ちでは
       連打する 指は 必ず すりぬける（スピード T63 の 実測）。
     ============================================================ */
  var locked = false, lockTimer = 0, lockAt = 0;
  function armUnlock(ms) { clearTimeout(lockTimer); lockTimer = setTimeout(unlockResult, ms); }
  function lockResult() {
    locked = true; lockAt = performance.now();
    $('resultBox').classList.add('is-locked');
    $('btnMain').disabled = true; $('btnSub').disabled = true;
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
    $('btnMain').disabled = false; $('btnSub').disabled = false;
    $('btnQuit').removeAttribute('aria-disabled'); $('btnQuit').removeAttribute('tabindex');
  }

  function showResult(kind) {
    G.over = true; busy = true; updateTools();
    var win = kind === 'win';
    $('resultTitle').textContent = win ? 'ぜんぶ そろった！' : 'うーん、止まった';
    $('resultTitle').classList.toggle('is-stop', !win);
    /* ★ 保証が ある からこそ 言える ひとこと（仕様 §2-2）。
       配りは 必ず クリアできる ので、これは うそに ならない。 */
    var line = win ? 'やったー！　きれいに そろったね！' : 'まだ クリアできるよ！　もどってみる？';
    $('resultSay').textContent = line;
    say(line);
    if (win) {
      $('btnMain').innerHTML = '新しく 配る <b>▶</b>';
      $('btnMain').dataset.act = 'new';
      $('btnSub').classList.add('hidden');
      $('btnQuit').classList.remove('hidden');
    } else {
      $('btnMain').textContent = 'もどす';
      $('btnMain').dataset.act = 'undo';
      $('btnSub').classList.remove('hidden');
      $('btnQuit').classList.add('hidden');
    }
    lockResult();
    $('resultWrap').classList.remove('hidden');
  }
  function hideResult() { $('resultWrap').classList.add('hidden'); unlockResult(); }

  /* ── 試合の 出し入れ ──────────────────────────── */
  function cancelAll() {
    cancelDrag();                 // ★ 運んでいる 途中なら 手を はなす（T67）
    lastTap.c = -1;               // ★ 前の 試合の 1回目の おしが 次に 残らない ように
    clearTimeout(autoTimer);
    if (fallStop) fallStop();
    $('fallCanvas').classList.add('hidden');
    $('happyCat').classList.remove('is-jump');
    hideResult();
    busy = false;
  }

  function newDeal() {
    cancelAll();
    G = makeDeal(pickSeed());
    $('titleScreen').classList.add('hidden');
    $('playScreen').classList.remove('hidden');
    $('tools').classList.remove('hidden');
    layout();
    render(true);
    updateTools();
    say('この配り、ちゃんと クリアできるよ！');
  }

  /* ★ T69・🟡6：もどす と 箱の 閉じかたの 順番を 入れかえた。
     ------------------------------------------------------------
     前は 詰みの 箱の「もどす」が hideResult() を 先に 呼び、そのあと
     この 関数が「もどせる 手が 無い」で 頭の if を 抜けて いた。
     → 箱だけ 消えて G.over が true の まま 残り、**盤面が 固まる**。
     いまは 箱を 閉じるのも 止まったを 解くのも 必ず ここを 通る。
     もどせる 手が 無く ても 盤面には 必ず 戻れる（袋小路を 作らない）。
     ⚠️ 本当の 詰みは 必ず 1手 以上 打った あとに しか 出ない ので、
        「もどせる 手が 0」は たしかめ用の stuckDemo() でしか 起きない。 */
  function undoOne() {
    if (!G) return;
    cancelAll();                       // ← 箱を 閉じる・止まったを 解く のは ここ
    G.over = false; G.won = false;
    if (G.hist.length) undoMove(G);
    render();
    updateTools();
  }

  /* ── つなぐ ─────────────────────────────────── */
  function boot() {
    build();
    $('btnStart').addEventListener('click', newDeal);
    $('btnNew').addEventListener('click', newDeal);
    $('btnUndo').addEventListener('click', undoOne);
    $('btnHowto').addEventListener('click', function () { $('helpDialog').showModal(); });
    var closers = document.querySelectorAll('[data-close]');
    for (var i = 0; i < closers.length; i++) {
      closers[i].addEventListener('click', function () { $(this.dataset.close).close(); });
    }
    $('btnMain').addEventListener('click', function () {
      if (locked) return;
      /* ★ 箱を 先に 閉じない（T69・🟡6）。
         先に hideResult() を 呼ぶと、もどせる 手が 無い とき
         undoOne() が 頭の if で 抜けて G.over が true の まま 残り、
         箱だけ 消えて 盤面が 固まって いた。
         → 閉じるのは undoOne() の 中（cancelAll → hideResult）に まかせる。
           もどせない ときは 箱が 開いたまま ＝ 「新しく 配る」で 出られる。 */
      if (this.dataset.act === 'undo') undoOne();
      else newDeal();
    });
    $('btnSub').addEventListener('click', function () { if (!locked) newDeal(); });
    /* ★ 箱を さわった ら かぎを かけ直す（指が 止まるまで おせない）*/
    $('resultWrap').addEventListener('pointerdown', bumpLock, true);
    window.addEventListener('resize', layout);
    window.addEventListener('orientationchange', function () { setTimeout(layout, 120); });
    layout();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* ============================================================
     ★ たしかめ用の 窓口（window.SOLITAIRE）
     ------------------------------------------------------------
     画面には 1つも 出さない（お客さんに 見せる 物では ない）。
     ⚠️ ポーカーで「たしかめ用の 箱」を 消しわすれた 事故が あったので、
        このゲームでは 最初から 箱を 作っていない。
     ============================================================ */
  function median(a) { if (!a.length) return 0; var b = a.slice().sort(function (x, y) { return x - y; }); return b[b.length >> 1]; }

  function autoPlay(n) {
    n = n || 100;
    var t0 = Date.now(), moves = [], reds = [], cols = [], errs = [], w = 0, st = 0, over15 = 0, wasteUp = 0, dead = 0, bad52 = 0, capped = 0;
    for (var i = 0; i < n; i++) {
      var seed = DEAL_LIST.length ? DEAL_LIST[i % DEAL_LIST.length] : (i + 1);
      var r = playOne(seed, 1200);
      if (r.capped) capped++;
      if (r.err) { errs.push('seed ' + seed + '：' + r.err); if (r.err.indexOf('52枚') >= 0) bad52++; }
      if (r.won) w++;
      if (r.stuck) st++;
      if (r.maxCol > 15) over15++;
      if (r.deadStart) dead++;
      wasteUp += r.wasteUp;
      moves.push(r.moves); reds.push(r.redeals); cols.push(r.maxCol);
    }
    var out = {
      '試合数': n,
      '★エラー': errs.length,
      '★札が52枚でなかった試合': bad52,
      '④手数（中央値／最大）': median(moves) + '手 ／ ' + Math.max.apply(null, moves) + '手',
      '⑤山札の周回（中央値／最大）': median(reds) + '周 ／ ' + Math.max.apply(null, reds) + '周',
      '⑥1列が15枚を超えた試合': over15 + ' (' + (over15 / n * 100).toFixed(1) + '%)',
      '　1列の最大': Math.max.apply(null, cols) + '枚（作りの上限 19枚）',
      '⑦上げすぎて損：1試合あたり': (wasteUp / n).toFixed(2) + '回',
      '⑧最初に手が1つもない': dead + ' (' + (dead / n * 100).toFixed(1) + '%)',
      '（参考）先を読まない打ち方での勝ち': w + ' (' + (w / n * 100).toFixed(1) + '%)',
      '（参考）③詰み': st + ' (' + (st / n * 100).toFixed(1) + '%)',
      '（参考）手数の上限で打ち切り': capped,
      'かかった時間': ((Date.now() - t0) / 1000).toFixed(1) + '秒'
    };
    if (errs.length) out['エラーの中身'] = errs.slice(0, 5);
    console.log('[SOLITAIRE] autoPlay', out);
    return out;
  }

  /* 一覧の 配りが 本当に クリアできるか、その場で 解いて 流しこんで たしかめる */
  function verify(n) {
    n = n || 20;
    var ok = 0, ng = [], t0 = Date.now();
    for (var i = 0; i < n && i < DEAL_LIST.length; i++) {
      var seed = DEAL_LIST[i], r = solve(makeDeal(seed), { ms: 4000 });
      if (!r.ok) { ng.push(seed + '（解けなかった）'); continue; }
      var v = replay(seed, r.moves);
      if (v.ok) ok++; else ng.push(seed + '（' + v.why + '）');
    }
    var out = { '調べた': Math.min(n, DEAL_LIST.length), '★クリアできた': ok, '★できなかった': ng.length, 'かかった時間': ((Date.now() - t0) / 1000).toFixed(1) + '秒' };
    if (ng.length) out['中身'] = ng;
    console.log('[SOLITAIRE] verify', out);
    return out;
  }

  window.SOLITAIRE = {
    now: function () {
      if (!G) return { 場面: 'まだ 始めていない', クリアできる配りの数: DEAL_LIST.length };
      var cols = [];
      for (var i = 0; i < 7; i++) {
        cols.push('列' + (i + 1) + '：裏' + G.tab[i].down.length + '／表[' +
          G.tab[i].up.map(nameOf).join(' ') + ']');
      }
      return {
        配りの番号: G.seed,
        場札: cols,
        組札: ['♠' + G.found[0], '♥' + G.found[1], '♦' + G.found[2], '♣' + G.found[3]].join(' ') +
              '（合計 ' + (G.found[0] + G.found[1] + G.found[2] + G.found[3]) + '枚）',
        山札: G.stock.length + '枚',
        めくった札: G.waste.length + '枚' + (G.waste.length ? '（一番手前 ' + nameOf(G.waste[G.waste.length - 1]) + '）' : ''),
        裏向きの札: downCount(G) + '枚',
        手数: G.hist.length + '手',
        もどせる回数: G.hist.length + '回',
        山札の周回: G.redeals + '周',
        札の合計: countAll(G) + '枚',
        勝敗: isWin(G) ? '勝ち' : (isStuck(G) ? '止まった' : '進行中'),
        札の大きさ: geo.cw + '×' + geo.ch + 'px（1列19枚のとき ' + geo.colH + 'px）'
      };
    },
    autoPlay: autoPlay,
    verify: verify,
    seed: function (n) {
      if (n == null) return G ? G.seed : null;
      cancelAll();
      G = makeDeal(n >>> 0);
      $('titleScreen').classList.add('hidden');
      $('playScreen').classList.remove('hidden');
      $('tools').classList.remove('hidden');
      layout(); render(true); updateTools();
      say('この配り、ちゃんと クリアできるよ！');
      return G.seed;
    },
    solve: function (ms) {
      if (!G) return null;
      var r = solve(makeDeal(G.seed), { ms: ms || 4000 });
      var out = { 配りの番号: G.seed, クリアできる: r.ok, 不明: r.unknown, 手数: r.ok ? r.moves.length : null, 調べた数: r.nodes, 時間: r.ms + 'ms' };
      if (r.ok) out['流しこんで勝てるか'] = replay(G.seed, r.moves).ok;
      console.log('[SOLITAIRE] solve', out);
      return out;
    },
    deals: function () { return { 数: DEAL_LIST.length, 先頭10: DEAL_LIST.slice(0, 10) }; },
    geo: function () { return geo; },

    /* ★ 本当に 1手も ない 場面を 出す ―― たしかめ 専用（仕様 §3-5）。
       K が 4枚（空の列が 無いので 動けない）＋ J が 3枚（Q が 1枚も 無いので 置けない）。
       山札の 3枚も どこにも 置けず、A も 無い。→ ①②③ が そろう。
       トライへ：ここで「うーん、止まった」の 箱と、大きい「もどす」を 見てください。 */
    stuckDemo: function () {
      cancelAll();
      G = makeDeal(pickSeed());
      var i;
      for (i = 0; i < 7; i++) { G.tab[i].down = []; G.tab[i].up = []; }
      G.stock = []; G.waste = []; G.found = [0, 0, 0, 0]; G.hist = []; G.moves = 0;
      var tops = [12, 13 + 12, 26 + 12, 39 + 12, 10, 13 + 10, 26 + 10];   // ♠K ♥K ♦K ♣K ♠J ♥J ♦J
      for (i = 0; i < 7; i++) G.tab[i].up.push(tops[i]);
      G.stock = [39 + 10, 8, 13 + 8];                                     // ♣J ♠9 ♥9 …置き場なし
      $('titleScreen').classList.add('hidden');
      $('playScreen').classList.remove('hidden');
      $('tools').classList.remove('hidden');
      layout(); render(true); updateTools();
      var stuck = isStuck(G);
      if (stuck) showResult('stop');
      return { 詰みと判定した: stuck, 場に手がある: hasPlay(G) };
    },

    /* ★ 勝つ 直前（裏0枚・あと left枚）を そのまま 出す ―― たしかめ 専用。
       ここから「自動で 全部 上げ →札が 降る →結果の 箱」まで 一気に 見られる。
       トライへ：仕様 §8-4 の 5番（自動で 上がり始める 瞬間、
       「え、なにが 起きた？」に ならないか）を ここで 見てください。
       ⚠️ 並びは 本当の 遊びでは 出ない 形（たしかめ用に 作った 場面）です。 */
    nearWin: function (left) {
      left = left == null ? 12 : Math.max(1, Math.min(52, left));
      cancelAll();
      G = makeDeal(pickSeed());
      var i, s, c, k = 0, back = [];
      for (i = 0; i < 7; i++) { G.tab[i].down = []; G.tab[i].up = []; }
      G.stock = []; G.waste = []; G.found = [13, 13, 13, 13]; G.hist = []; G.moves = 0;
      while (back.length < left) {                   // 大きい 数から 順に 場札へ 下ろす
        s = k % 4; k++;
        if (G.found[s] > 0) { G.found[s]--; back.push(s * 13 + G.found[s]); }
      }
      for (i = 0; i < back.length; i++) G.tab[i % 7].up.push(back[i]);
      $('titleScreen').classList.add('hidden');
      $('playScreen').classList.remove('hidden');
      $('tools').classList.remove('hidden');
      layout(); render(true); updateTools();
      startAuto();
      return { 残り: left + '枚', 裏向き: downCount(G) + '枚' };
    },

    /* ★ いちばん のびた 場面（1列19枚 ＝ 裏6＋K→Aの13枚）を そのまま 出す。
       仕様 §1-2 で「絶対に これ以上 ない」と 証明ずみの 上限。
       トライへ：1000×900 で スクロールが 出ない ことを ここで 見てください
       （仕様 §8-4 の 2番）。遊びでは 出ない 形なので、たしかめ 専用。 */
    worst: function () {
      cancelAll();
      G = makeDeal(pickSeed());
      var used = {}, i, r, s, c;
      for (i = 0; i < 7; i++) { G.tab[i].down = []; G.tab[i].up = []; }
      G.stock = []; G.waste = []; G.found = [0, 0, 0, 0]; G.hist = []; G.moves = 0;
      /* 7列目に 裏6枚 ＋ K から A まで 色ちがいで 13枚 */
      for (i = 0; i < 6; i++) { c = 39 + i; G.tab[6].down.push(c); used[c] = 1; }
      for (r = 12; r >= 0; r--) { s = (r % 2 === 0) ? 0 : 1; c = s * 13 + r; G.tab[6].up.push(c); used[c] = 1; }
      var rest = [];
      for (c = 0; c < 52; c++) if (!used[c]) rest.push(c);
      for (i = 0; i < 6; i++) G.tab[i].up.push(rest.pop());
      G.stock = rest;
      $('titleScreen').classList.add('hidden');
      $('playScreen').classList.remove('hidden');
      $('tools').classList.remove('hidden');
      layout(); render(true); updateTools();
      say('たしかめ用：1列19枚（いちばん のびた 形）');
      var inb = boardIn.getBoundingClientRect(), last = cardEl[0].getBoundingClientRect();
      var lowest = 0;
      for (i = 0; i < 52; i++) { var b = cardEl[i].getBoundingClientRect(); if (b.bottom > lowest) lowest = b.bottom; }
      return {
        札: geo.cw + '×' + geo.ch + 'px',
        場札エリアの下端: Math.round(inb.bottom) + 'px',
        いちばん下の札の下端: Math.round(lowest) + 'px',
        はみ出し: Math.round(lowest - inb.bottom) + 'px（0以下なら OK）',
        ページ縦スクロール: document.documentElement.scrollHeight > window.innerHeight,
        ページ横スクロール: document.documentElement.scrollWidth > window.innerWidth
      };
    },
    core: CORE
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
