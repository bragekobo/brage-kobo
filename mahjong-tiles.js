/* =====================================================================
   mahjong_tiles.js ― 麻雀牌 34種類＋裏（🎨 アト・T318・2026-09-27）
   ---------------------------------------------------------------------
   ★ 試し描き（archive）。★ゲームの ファイルでは ない。★外部の 画像・字・通信 0。
   ★ 社長が OK した 形・色・線 の まま（發＝癶を まん中／白＝無地／1索＝ハッピー流の 鳥）。

   ■ 使い方
     MJ.install();                    // ページに 1回：34種類＋裏 を <symbol> で 置く
     el.innerHTML = MJ.tile('2s', 28); // 1まい（<svg><use href="#mj-2s"/></svg>）
     MJ.tile('back', 28);             // 裏
     MJ.CODES                          // ['1m'…'9m','1p'…'9p','1s'…'9s','1z'…'7z']（34）
     MJ.name('6z')                     // 'ハツ'
     MJ.tileSVG('5p', 60)              // <use> を 使わない 1まい だけの SVG（書き出し 用）

   ■ 牌の 名前（麻雀の ふつうの 書き方 mpsz）
     m＝萬子 p＝筒子 s＝索子 z＝字牌（1z東 2z南 3z西 4z北 5z白 6z發 7z中）

   ■ 決まりの 表（★1まいずつ 描かない）
     萬子：NUM（一〜九の 線）＋ KANJI.man
     筒子：PIN（丸の 置き場・色・大きさ）／1筒だけ 大きな 丸
     索子：SOU（竹の 置き場・色・かたむき）／1索だけ 鳥
     字牌：KANJI（東南西北發中の 線）／白は 無地

   ■ 形：viewBox 0 0 64 88。上 80 が 表（アイボリー）、下 8 が 背中の 色（ハッピーの オレンジ）。
     字は ぜんぶ 線（はしを 丸く＝丸ゴシックの 手ざわり）。端末の 字（フォント）に まかせない。
   ■ 影：SVG の filter は 使わない（136まい だと 重い）。CSS の box-shadow（.mj）で 付ける。
   ===================================================================== */
(function (global) {
  'use strict';

  const COL = { ink:'#2B2D4E', red:'#D8343A', grn:'#1F9457', blu:'#2F7FD6',
                face:'#FFFDF6', body:'#FBAE55', edge:'#E8853A', grnDk:'#136B3C', redDk:'#9E1F27' };

  /* ---- 漢数字（100×70 の 箱） ---- */
  const NUM = {
    1:'M12 36 L88 33',
    2:'M24 14 L76 14 M10 57 L90 57',
    3:'M24 7 L76 7 M30 34 L70 34 M10 63 L90 63',
    4:'M14 7 L86 7 L86 64 L14 64 Z M40 9 L38 31 Q35 43 24 49 M60 9 L60 41 Q60 47 67 47 L84 47',
    5:'M16 6 L84 6 M46 6 L40 62 M26 32 L72 32 L69 62 M8 64 L92 64',
    6:'M47 1 L53 11 M10 22 L90 22 M36 36 L16 64 M64 36 L86 62',
    7:'M8 30 L90 20 M40 2 L40 52 Q40 64 54 64 L82 64 Q92 64 92 54',
    8:'M40 8 Q38 44 10 64 M60 6 Q62 40 92 62',
    9:'M8 22 L60 22 Q58 62 76 64 Q90 66 92 52 M40 2 Q38 42 8 66'
  };
  /* ---- 漢字（100×100 の 箱） ---- */
  const KANJI = {
    man:  'M8 14 L92 14 M32 4 L32 26 M68 4 L68 26 '+
          'M24 32 L24 58 M24 32 L76 32 L76 58 M24 58 L76 58 M24 45 L76 45 M50 32 L50 70 '+
          'M12 96 L12 66 L88 66 L88 90 Q88 97 80 96 M50 70 L34 88 L64 86 M58 78 L68 90',
    ton:  'M12 18 L88 18 M50 4 L50 96 M26 30 L26 62 M26 30 L74 30 L74 62 M26 62 L74 62 M26 46 L74 46 M44 66 L14 90 M56 66 L88 90',
    nan:  'M12 14 L88 14 M50 4 L50 26 M16 96 L16 32 L84 32 L84 88 Q84 96 76 95 M38 42 L44 50 M62 42 L56 50 M30 58 L70 58 M28 74 L72 74 M50 58 L50 94',
    sha:  'M10 12 L90 12 M16 34 L16 92 M16 34 L84 34 L84 92 M16 92 L84 92 M40 12 L40 52 Q38 64 26 72 M60 12 L60 64 Q60 72 68 72 L84 72',
    pei:  'M36 6 L36 90 M12 38 L36 38 M10 76 L36 62 M64 6 L64 82 Q64 94 76 94 L90 94 M64 46 L88 32',
    hatsu:'M26 8 L44 8 L34 20 L20 34 M34 22 L42 32 M66 5 L58 18 M58 14 Q72 24 86 34 M74 6 L82 13 '+
          'M10 44 L38 44 L38 56 L14 56 L12 70 L40 70 L40 86 Q40 94 30 92 '+
          'M62 42 L60 56 Q58 64 50 66 M62 42 L80 42 L80 54 Q80 60 90 58 '+
          'M54 70 L86 70 Q76 86 56 96 M62 78 Q74 90 92 96',
    chun: 'M18 30 L18 64 M18 30 L82 30 L82 64 M18 64 L82 64 M50 5 L50 96'
  };
  const B = 'blu', G = 'grn', R = 'red';
  /* ---- 筒子：丸の 置き場（x, y, 色）と 丸の 大きさ r ---- */
  const PIN = {
    2:{r:11, p:[[32,22,G],[32,58,B]]},
    3:{r:9.5,p:[[16,17,B],[32,40,R],[48,63,G]]},
    4:{r:10, p:[[18,21,B],[46,21,G],[18,59,G],[46,59,B]]},
    5:{r:9,  p:[[16,17,B],[48,17,G],[32,40,R],[16,63,G],[48,63,B]]},
    6:{r:8,  p:[[20,15,G],[44,15,G],[20,43,R],[44,43,R],[20,64,R],[44,64,R]]},
    7:{r:7,  p:[[15,12,G],[32,20,G],[49,28,G],[20,48,R],[44,48,R],[20,66,R],[44,66,R]]},
    8:{r:7,  p:[[20,13,B],[44,13,B],[20,30,B],[44,30,B],[20,48,B],[44,48,B],[20,66,B],[44,66,B]]},
    9:{r:7,  p:[[14,16,B],[32,16,B],[50,16,B],[14,40,R],[32,40,R],[50,40,R],[14,64,G],[32,64,G],[50,64,G]]}
  };
  /* ---- 索子：竹の 置き場（x, y, 色, かたむき°）と 竹の 長さ L ----
     ★8索は 上が「∧」・下が「∨」（M と W）。★8索の 斜めだけ 5つ目＝その竹の 長さ（T322：外の縦は 端に・斜めの 先は 1点で 重ねる）。★5索の まん中・7索の 上・9索の まん中の 列は 赤。 */
  const SOU = {
    2:{L:26, p:[[32,23,G],[32,58,G]]},
    3:{L:26, p:[[32,23,G],[20,58,G],[44,58,G]]},
    4:{L:26, p:[[20,23,G],[44,23,G],[20,58,G],[44,58,G]]},
    5:{L:26, p:[[16,23,G],[48,23,G],[32,40.5,R],[16,58,G],[48,58,G]]},
    6:{L:26, p:[[14,23,G],[32,23,G],[50,23,G],[14,58,G],[32,58,G],[50,58,G]]},
    7:{L:20, p:[[32,16,R],[14,41,G],[32,41,G],[50,41,G],[14,64,G],[32,64,G],[50,64,G]]},
    8:{L:31, p:[[23.25,21.5,G,38.5,37.11],[40.75,21.5,G,-38.5,37.11],[8.5,21.5,G],[55.5,21.5,G],[23.25,58.5,G,-38.5,37.11],[40.75,58.5,G,38.5,37.11],[8.5,58.5,G],[55.5,58.5,G]]},
    9:{L:20, p:[[14,16,G],[32,16,R],[50,16,G],[14,40.5,G],[32,40.5,R],[50,40.5,G],[14,65,G],[32,65,R],[50,65,G]]}
  };
  const NAMES = {
    m:['','イーマン','リャンマン','サンマン','スーマン','ウーマン','ローマン','チーマン','パーマン','キューマン'],
    p:['','イーピン','リャンピン','サンピン','スーピン','ウーピン','ローピン','チーピン','パーピン','キューピン'],
    s:['','イーソー','リャンソー','サンソー','スーソー','ウーソー','ローソー','チーソー','パーソー','キューソー'],
    z:['','トン','ナン','シャー','ペー','ハク','ハツ','チュン']
  };
  const CODES = [].concat(
    [1,2,3,4,5,6,7,8,9].map(n => n + 'm'),
    [1,2,3,4,5,6,7,8,9].map(n => n + 'p'),
    [1,2,3,4,5,6,7,8,9].map(n => n + 's'),
    [1,2,3,4,5,6,7].map(n => n + 'z'));

  /* ---- 部品 ---- */
  const line = (d, w, c) => `<path d="${d}" fill="none" stroke="${COL[c]||c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const at = (x, y, s, inner) => `<g transform="translate(${x} ${y}) scale(${s})">${inner}</g>`;

  function pinDot(x, y, r, c) {
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${COL[c]}"/>`+
           `<circle cx="${x}" cy="${y}" r="${(r*.56).toFixed(2)}" fill="none" stroke="#fff" stroke-width="${(r*.22).toFixed(2)}"/>`;
  }
  function pinOne() {
    return `<circle cx="32" cy="40.5" r="23" fill="#E6F4FF" stroke="${COL.blu}" stroke-width="3.6"/>`+
           `<circle cx="32" cy="40.5" r="15.5" fill="none" stroke="${COL.grn}" stroke-width="5.5" stroke-dasharray="4.6 2.9"/>`+
           `<circle cx="32" cy="40.5" r="9" fill="${COL.red}"/>`+
           `<circle cx="32" cy="40.5" r="3.4" fill="#fff"/>`;
  }
  /* 竹 1本：太さ 9（★28px で 約4px）。ふしは まん中に 1本だけ（★小さく しても つぶれない 数） */
  function stick(x, y, L, c, rot) {
    const col = COL[c], dk = c === 'red' ? COL.redDk : COL.grnDk, h = L / 2;
    return `<g transform="translate(${x} ${y})${rot ? ` rotate(${rot})` : ''}">`+
      `<rect x="-4.5" y="${-h}" width="9" height="${L}" rx="4.5" fill="${col}"/>`+
      `<path d="M-4.5 0 H4.5" stroke="${dk}" stroke-width="2"/>`+
      `<path d="M-1.4 ${-h+3.6} V-3 M-1.4 3 V${h-3.6}" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity=".45"/>`+
    `</g>`;
  }
  function birdOne() {
    const g = COL.grn, r = COL.red, b = COL.blu;
    const feather = (x, y, rot) => `<g transform="translate(${x} ${y}) rotate(${rot})"><ellipse cx="0" cy="-9" rx="4.6" ry="10" fill="${g}"/><circle cx="0" cy="-14" r="2.6" fill="${b}"/><circle cx="0" cy="-14" r="1" fill="#fff"/></g>`;
    return feather(24, 50, -62) + feather(22, 46, -38) + feather(24, 43, -14) +
      `<rect x="9" y="64" width="46" height="7" rx="3.5" fill="${g}"/>`+
      `<path d="M22 64.5 V70.5 M40 64.5 V70.5" stroke="#157A45" stroke-width="1.6" stroke-linecap="round"/>`+
      `<path d="M31 56 L29 65 M39 56 L40 65" stroke="#F09A44" stroke-width="2.4" stroke-linecap="round"/>`+
      `<ellipse cx="35" cy="47" rx="13.5" ry="12" fill="${g}"/>`+
      `<ellipse cx="38" cy="51" rx="7.5" ry="6.5" fill="#CFF0D8"/>`+
      `<path d="M25 44 Q31 38 38 46 Q31 51 25 44 Z" fill="${r}"/>`+
      `<circle cx="42" cy="28" r="10.5" fill="${g}"/>`+
      `<path d="M36 19 Q35 11 40 15 Q41 8 45 14 Q49 10 48 19 Z" fill="${r}"/>`+
      `<path d="M51.5 26 L58 29 L51.5 32 Z" fill="#F09A44"/>`+
      `<ellipse cx="45.5" cy="27" rx="2.4" ry="2.9" fill="#4A3A2C"/><circle cx="46.3" cy="25.9" r=".9" fill="#fff"/>`+
      `<circle cx="45" cy="33" r="2.6" fill="#FF9EB5" opacity=".75"/>`;
  }

  /* ---- 牌の 体（表・裏） ---- */
  const BODY =
    `<rect x=".75" y=".75" width="62.5" height="86.5" rx="11" fill="${COL.body}" stroke="${COL.edge}" stroke-width="1.5"/>`+
    `<rect x="1.5" y="1.5" width="61" height="77" rx="10" fill="${COL.face}"/>`+
    `<path d="M4 76.5 H60" stroke="#EADFC8" stroke-width="2" stroke-linecap="round"/>`;
  /* 裏：ハッピーの オレンジ＋おでこの しましま 3本 */
  const BACK =
    `<rect x=".75" y=".75" width="62.5" height="86.5" rx="11" fill="#F09A44" stroke="${COL.edge}" stroke-width="1.5"/>`+
    `<rect x="1.5" y="1.5" width="61" height="77" rx="10" fill="${COL.body}"/>`+
    `<rect x="7" y="7" width="50" height="66" rx="7" fill="none" stroke="#FFDDB0" stroke-width="1.6"/>`+
    `<path d="M23 28 L19.5 48 M32 25 V48 M41 28 L44.5 48" fill="none" stroke="#E07A2E" stroke-width="6" stroke-linecap="round"/>`;

  /* ---- 表の 絵を 決まりから 作る ---- */
  function art(code) {
    const n = +code[0], s = code[1];
    if (s === 'm') return at(11, 7, .42, line(NUM[n], 13, 'ink')) + at(14, 40, .36, line(KANJI.man, 9, 'red'));
    if (s === 'p') return n === 1 ? pinOne() : PIN[n].p.map(([x, y, c]) => pinDot(x, y + .5, PIN[n].r, c)).join('');
    if (s === 's') return n === 1 ? birdOne() : SOU[n].p.map(([x, y, c, rot, len]) => stick(x, y, len || SOU[n].L, c, rot)).join('');
    if (s === 'z') {
      if (n <= 4) return at(7, 16.5, .5, line(KANJI[['', 'ton', 'nan', 'sha', 'pei'][n]], 10, 'ink'));
      if (n === 5) return '';                                     /* 白：無地（社長） */
      if (n === 6) return at(6, 14.5, .52, line(KANJI.hatsu, 9.5, 'grn'));
      if (n === 7) return at(6, 14.5, .52, line(KANJI.chun, 12, 'red'));
    }
    throw new Error('知らない 牌：' + code);
  }
  const inner = code => code === 'back' ? BACK : BODY + art(code);
  const name = code => code === 'back' ? 'うら' : NAMES[code[1]][+code[0]];
  const hOf = w => Math.round(w * 88 / 64 * 10) / 10;

  /* ---- 使い回し（<symbol>＋<use>） ---- */
  function sprite() {
    return `<svg id="mj-sprite" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true" focusable="false">`+
      CODES.concat('back').map(c => `<symbol id="mj-${c}" viewBox="0 0 64 88">${inner(c)}</symbol>`).join('') + `</svg>`;
  }
  function install(doc) {
    doc = doc || global.document;
    if (!doc.getElementById('mj-sprite')) doc.body.insertAdjacentHTML('afterbegin', sprite());
  }
  function tile(code, w) {
    return `<svg class="mj" width="${w}" height="${hOf(w)}" viewBox="0 0 64 88" role="img" aria-label="${name(code)}"><use href="#mj-${code}"/></svg>`;
  }
  /* 書き出し 用（1まいだけで 完結する SVG） */
  function tileSVG(code, w) {
    return `<svg xmlns="http://www.w3.org/2000/svg" class="mj" width="${w}" height="${hOf(w)}" viewBox="0 0 64 88" role="img" aria-label="${name(code)}">${inner(code)}</svg>`;
  }

  global.MJ = { CODES, COL, NUM, KANJI, PIN, SOU, name, sprite, install, tile, tileSVG };
})(typeof window !== 'undefined' ? window : globalThis);
