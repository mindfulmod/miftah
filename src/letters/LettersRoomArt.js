// Shared garden furniture. Learning glyphs, pets and rewards remain separate live elements.
(function(ns){
  const ink='#4a3620';
  const svg=(body,view='0 0 600 430',cls='')=>`<svg class="room-art ${cls}" viewBox="${view}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${body}</svg>`;
  const leaves=(x,y,flip=1)=>`<g transform="translate(${x} ${y}) scale(${flip} 1)"><path d="M0 79Q-30 38-7 6Q23 18 12 55Q43 9 75 23Q80 53 26 68Q71 60 80 91Q38 115 0 79Z" fill="#4e9677"/><path d="M1 67Q-13 40-5 17Q13 34 8 59Q35 27 63 28Q54 47 20 66Z" fill="#7fce54"/><path d="M5 73L-2 33M7 73L50 39M7 73L58 85" fill="none" stroke="#b7e779" stroke-width="3" stroke-linecap="round"/></g>`;
  // The floor extends beyond the fixed furniture frame; only terrain may stretch.
  function floor(){return `<svg class="room-floor" viewBox="0 0 1200 600" preserveAspectRatio="none" aria-hidden="true">
    <path d="M0 46Q188-3 414 33T813 31Q1000 4 1200 43V600H0Z" fill="var(--room-meadow,#b7e779)"/>
    <path d="M0 86Q176 33 428 76T836 65Q1010 33 1200 86V600H0Z" fill="#4e9677" opacity=".3"/>
    <path d="M0 180Q205 121 405 184T805 166Q1030 121 1200 195V600H0Z" fill="#4e9677" opacity=".25"/>
    <path d="M1200 226Q713 164 888 350Q1025 433 706 600H1200Z" fill="#e5dcc8"/>
    <path d="M1200 244Q768 196 924 345Q1100 443 802 600H1200Z" fill="var(--room-water,#96ecff)"/>
    <path d="M1200 328Q985 269 1003 364Q1137 454 936 600H1200Z" fill="var(--room-water-shade,#62cdf4)"/>
    <path d="M0 315Q103 236 326 321Q458 357 496 421Q521 474 815 524L894 600H0Z" fill="#2f5c46"/>
    <path d="M0 314Q120 250 321 323Q435 355 481 415Q237 335 0 390Z" fill="#4e9677"/>
    <path d="M0 316Q90 266 229 300Q88 280 0 349Z" fill="#b7e779"/>
    <path d="M992 286Q1055 268 1122 285M1092 432Q1140 420 1200 431" fill="none" stroke="#ccfbef" stroke-width="4" stroke-linecap="round"/>
  </svg>`;}
  const dais=()=>`<ellipse cx="300" cy="387" rx="226" ry="28" fill="#2f5c46" opacity=".26"/>
    <path d="M68 335Q300 283 532 335V366Q310 425 68 366Z" fill="#4a3620"/>
    <path d="M77 336Q300 296 523 336V357Q300 412 77 357Z" fill="#a89478"/>
    <path d="M77 330Q300 290 523 330Q308 386 77 330Z" fill="#fffaf0"/>
    <path d="M106 334Q300 304 494 334Q300 371 106 334Z" fill="#e5dcc8"/>
    <path d="M111 334Q300 304 488 334" fill="none" stroke="#fffdf7" stroke-width="4"/>
    <path d="M104 359Q300 400 496 359M161 358V370M436 358V370" fill="none" stroke="#c9bda4" stroke-width="3"/>`;
  function alcove(){return svg(`
    <path d="M29 328V175Q31 21 300 17Q569 21 571 175V328Q305 370 29 328Z" fill="#2f5c46"/>
    <path d="M41 318V176Q43 32 300 29Q557 32 559 176V318Z" fill="#4e9677"/>
    <path d="M62 305V177Q65 52 300 48Q535 52 538 177V305Z" fill="#4a3620"/>
    <path d="M76 303V181Q81 68 300 64Q519 68 524 181V303Z" fill="#c9bda4"/>
    <path d="M91 300V185Q96 82 300 78Q504 82 509 185V300Z" fill="#fffaf0"/>
    <path d="M76 303V181Q81 68 300 64Q519 68 524 181" fill="none" stroke="#e5dcc8" stroke-width="4"/>
    <path d="M107 292V187Q110 109 220 97M493 292V187Q490 109 380 97" fill="none" stroke="#e5dcc8" stroke-width="3"/>
    ${leaves(34,153,.65)}${leaves(566,153,-.65)}
    <!-- 2026-10-18 (construction detail): a cosy nook, not a bare arch —
         wallpaper sprigs, two real shelves with folded clothes, a hat, a jar
         of buttons, and a hook with a scarf. The centre stays clear for the pet. -->
    ${[[130,120],[170,150],[120,180],[470,120],[430,150],[480,180],[150,260],[450,262]].map(([x,y])=>`<path d="M${x} ${y}q-6 -8 0 -14q6 6 0 14z" fill="#b7e779" opacity=".55"/><circle cx="${x+10}" cy="${y-6}" r="2.4" fill="#ffa798" opacity=".6"/>`).join('')}
    <rect x="102" y="206" width="78" height="10" rx="5" fill="#c69434" stroke="#4a3620" stroke-width="3"/><path d="M110 216V226M172 216V226" stroke="#70501b" stroke-width="4" stroke-linecap="round"/>
    <rect x="110" y="190" width="30" height="8" rx="3" fill="#62cdf4" stroke="#4a3620" stroke-width="2.4"/><rect x="108" y="198" width="34" height="8" rx="3" fill="#ffe49a" stroke="#4a3620" stroke-width="2.4"/><rect x="112" y="182" width="26" height="8" rx="3" fill="#b49fcf" stroke="#4a3620" stroke-width="2.4"/>
    <path d="M148 206Q148 186 162 186Q176 186 176 206Z" fill="#ee806f" stroke="#4a3620" stroke-width="2.4"/><rect x="144" y="200" width="36" height="7" rx="3.5" fill="#ee806f" stroke="#4a3620" stroke-width="2.4"/><path d="M150 196H174" stroke="#ffe49a" stroke-width="3"/>
    <rect x="420" y="206" width="78" height="10" rx="5" fill="#c69434" stroke="#4a3620" stroke-width="3"/><path d="M428 216V226M490 216V226" stroke="#70501b" stroke-width="4" stroke-linecap="round"/>
    <rect x="428" y="184" width="22" height="22" rx="7" fill="#ccfbef" stroke="#4a3620" stroke-width="2.4"/><rect x="426" y="180" width="26" height="7" rx="3.5" fill="#c69434" stroke="#4a3620" stroke-width="2.4"/>${[[434,196,'#ee806f'],[442,192,'#f3c955'],[440,200,'#62cdf4']].map(([x,y,c])=>`<circle cx="${x}" cy="${y}" r="3" fill="${c}"/>`).join('')}
    <path d="M474 192V178" stroke="#4e9677" stroke-width="3" stroke-linecap="round"/><path d="M474 184Q462 182 462 172Q472 172 474 184ZM474 180Q486 176 488 166Q476 168 474 180Z" fill="#7fce54" stroke="#4a3620" stroke-width="2.4" stroke-linejoin="round"/><path d="M462 192H486Q484 206 478 206H470Q464 206 462 192Z" fill="#ee806f" stroke="#4a3620" stroke-width="2.4" stroke-linejoin="round"/><rect x="460" y="189" width="28" height="6" rx="3" fill="#c25a49" stroke="#4a3620" stroke-width="2.4"/>
    <path d="M300 96V104" stroke="#4a3620" stroke-width="3" stroke-linecap="round"/>
    <path d="M137 212V224Q152 224 152 235Q152 243 141 243L116 263H169L144 243" fill="none" stroke="#a89478" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M120 260H165L170 298Q143 309 115 298Z" fill="#c25a49"/>
    <path d="M122 260H164L164 290Q142 299 121 290Z" fill="#ee806f"/>
    <path d="M126 267H160M125 282H161" stroke="#ffa798" stroke-width="4"/>
    <rect x="439" y="232" width="49" height="71" rx="19" fill="#a89478" stroke="#4a3620" stroke-width="3"/>
    <rect x="445" y="237" width="37" height="59" rx="15" fill="#ccfbef"/>
    <path d="M451 269L474 246M453 280L463 269" stroke="#fffdf7" stroke-width="4" stroke-linecap="round"/>
    ${dais()}${leaves(54,318,.45)}${leaves(546,318,-.45)}
  `);}
  // The hatch island; the woven nest itself is drawn with the egg (LettersArt.egg).
  function nest(){return svg(`<path d="M17 332Q110 254 299 283Q469 263 584 332Q518 405 296 409Q82 405 17 332Z" fill="#b7e779"/><path d="M31 354Q292 415 572 353Q505 417 297 420Q101 416 31 354Z" fill="#4e9677"/>${leaves(100,203,1.2)}${leaves(500,203,-1.2)}`);}
  function lesson(){return svg(`
    <path d="M50 352V180Q49 26 300 22Q551 26 550 180V352Z" fill="#ccfbef" opacity=".52"/>
    <path d="M65 349V182Q65 50 300 46Q535 50 535 182V349" fill="none" stroke="#e5dcc8" stroke-width="8"/>
    <path d="M76 345V181Q80 66 300 61Q520 66 524 181V345" fill="none" stroke="#a89478" stroke-width="3"/>
    <path d="M26 352Q300 300 574 352L563 395Q300 432 37 395Z" fill="#4e9677" opacity=".32"/>
    <path d="M28 343Q300 296 572 343L558 376Q300 417 42 376Z" fill="#b7e779"/>
    <ellipse cx="300" cy="365" rx="182" ry="29" fill="#e5dcc8"/>
    <ellipse cx="300" cy="357" rx="182" ry="25" fill="#fffaf0"/>
    ${leaves(60,145,.72)}${leaves(540,145,-.72)}
    <path d="M66 348L108 306Q114 300 120 306Q126 312 120 318L78 360Q70 364 66 360Q62 354 66 348Z" fill="#f3c955" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/><path d="M78 346L110 314" stroke="#c69434" stroke-width="2.4" stroke-linecap="round"/><path d="M108 306L122 300L126 312L120 318Z" fill="#fffaf0" stroke="${ink}" stroke-width="2.4"/>
    <rect x="490" y="326" width="38" height="28" rx="10" fill="#ee806f" stroke="${ink}" stroke-width="3" transform="rotate(32 509 340)"/><rect x="490" y="326" width="14" height="28" rx="7" fill="#fffaf0" stroke="${ink}" stroke-width="3" transform="rotate(32 509 340)"/><ellipse cx="514" cy="331" rx="6" ry="2.4" fill="#fffdf7" opacity=".6" transform="rotate(32 509 340)"/>
  `);}
  function podium(){return svg(`
    <path d="M21 323Q-1 268 47 246Q29 208 76 193Q112 172 139 212Q172 206 180 245Q435 224 482 249Q482 208 518 216Q563 180 581 229Q618 253 580 329Z" fill="#2f5c46"/>
    <path d="M28 293Q22 258 62 252Q43 221 77 207Q113 191 132 228Q156 219 163 252L177 282Q72 268 28 293M482 274Q495 239 526 239Q556 209 575 237Q594 254 574 279Z" fill="#4e9677"/>
    <path d="M51 239Q70 204 99 216M526 238Q547 220 563 237" fill="none" stroke="#7fce54" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="304" cy="372" rx="278" ry="39" fill="#2f5c46" opacity=".2"/>
    <path d="M30 324Q102 273 268 290Q448 257 574 319Q533 389 326 396Q130 398 30 353Z" fill="#4e9677"/>
    <path d="M42 319Q162 278 285 304Q460 273 558 319Q508 361 315 369Q156 373 42 337Z" fill="#b7e779"/>
    <path d="M73 330Q171 301 279 316Q451 293 535 323Q467 351 314 357Q169 363 73 330Z" fill="#7fce54" opacity=".5"/>
    <path d="M200 328Q292 307 394 328L378 365Q292 390 214 365Z" fill="#4a3620"/>
    <path d="M200 321Q292 300 394 321L387 337Q292 358 207 337Z" fill="#c9bda4"/>
    <path d="M213 324Q295 307 381 324Q300 346 213 324Z" fill="#70501b"/>
    <path d="M216 343L223 359Q295 379 370 359L378 343Q294 364 216 343Z" fill="#70501b"/>
    <path d="M231 349Q294 363 363 349" fill="none" stroke="#c69434" stroke-width="3" stroke-linecap="round"/>
    ${leaves(42,284,.44)}${leaves(558,284,-.44)}
    <path d="M399 374Q414 350 428 372Q453 348 470 375Q488 365 503 388Q449 405 399 374Z" fill="#2f5c46"/>
    <path d="M96 386Q104 356 126 368Q140 340 164 366Q184 352 196 378Q146 404 96 386Z" fill="#2f5c46"/>
    <path d="M118 380Q128 366 140 382M160 376Q170 366 182 382" fill="none" stroke="#4e9677" stroke-width="3" stroke-linecap="round"/>
    <path d="M414 373Q431 363 439 383M461 376Q474 369 485 385" fill="none" stroke="#4e9677" stroke-width="3" stroke-linecap="round"/>
  `);}
  function pack(size=120){return `<svg class="room-pack" width="${size}" height="${size*1.16}" viewBox="0 0 120 140" aria-hidden="true"><ellipse cx="60" cy="130" rx="46" ry="7" fill="#2f5c46" opacity=".17"/><path d="M17 15L60 5L103 15V113Q103 128 87 130H33Q17 128 17 113Z" fill="#c69434" stroke="${ink}" stroke-width="3"/><path d="M17 15L60 5L103 15V104Q60 126 17 104Z" fill="#ffe49a"/><path d="M21 16L60 35L99 16M23 20V102" fill="none" stroke="#fffaf0" stroke-width="4"/><path d="M17 76Q60 63 103 76V102Q60 117 17 102Z" fill="#4e9677"/><path d="M60 45L68 61L86 64L73 77L76 95L60 86L44 95L47 77L34 64L52 61Z" fill="#f3c955" stroke="${ink}" stroke-width="2.4"/><path d="M60 51L55 66L43 68" fill="none" stroke="#fffaf0" stroke-width="3" stroke-linecap="round"/><path d="M25 19H95" stroke="#c69434" stroke-width="1.6" stroke-dasharray="3 5"/></svg>`;}
  function tab(kind){if(kind==='tricks')return `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 4L28 17L42 18L31 27L35 41L24 33L13 41L17 27L6 18L20 17Z" fill="#ffe49a" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/><path d="M38 6Q42 10 40 14M8 34Q4 38 8 42" fill="none" stroke="#ee806f" stroke-width="2.4" stroke-linecap="round"/></svg>`;return kind==='colors'?`<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 5Q43 7 43 24Q43 41 26 43Q18 43 20 34Q21 29 14 31Q3 31 5 20Q7 5 24 5Z" fill="#fffaf0" stroke="${ink}" stroke-width="3"/><circle cx="16" cy="16" r="5" fill="#ee806f"/><circle cx="30" cy="13" r="5" fill="#96ecff"/><circle cx="34" cy="27" r="5" fill="#4e9677"/><circle cx="12" cy="27" r="4" fill="#f3c955"/></svg>`:kind==='friends'?`<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M9 31V24Q9 8 24 8Q39 8 39 24V31Q39 42 24 42Q9 42 9 31Z" fill="#96ecff" stroke="${ink}" stroke-width="3"/><ellipse cx="18" cy="23" rx="5" ry="7" fill="#fffaf0"/><ellipse cx="30" cy="23" rx="5" ry="7" fill="#fffaf0"/><circle cx="19" cy="24" r="2.4" fill="${ink}"/><circle cx="29" cy="24" r="2.4" fill="${ink}"/><path d="M19 33Q24 38 29 33" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/></svg>`:`<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M16 11L8 15L4 25L12 29L15 24V41H33V24L36 29L44 25L40 15L32 11Q24 20 16 11Z" fill="#ee806f" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/><path d="M18 29H30M19 35H29" stroke="#ffa798" stroke-width="3" stroke-linecap="round"/></svg>`;}
  const bud=()=>`<svg viewBox="0 0 140 140" aria-hidden="true"><ellipse cx="70" cy="112" rx="43" ry="9" fill="#c9bda4"/><path d="M70 110V72" stroke="#4e9677" stroke-width="6"/><path d="M67 95Q28 99 30 76Q56 71 67 95M73 90Q110 91 108 69Q84 68 73 90" fill="#4e9677" stroke="#4e9677" stroke-width="3"/><path d="M70 81Q30 79 36 50Q40 34 54 44Q51 16 70 19Q89 16 86 44Q100 34 104 50Q110 79 70 81Z" fill="#ffa798" stroke="#70501b" stroke-width="4"/><path d="M58 54Q70 67 82 54" fill="none" stroke="#fffaf0" stroke-width="4" stroke-linecap="round"/></svg>`;
  // Playroom toys (2026-10-01): flat, ink-contoured, touchable weight (3).
  const toys={
    ball:`<svg viewBox="0 0 60 60" aria-hidden="true"><ellipse cx="30" cy="55" rx="18" ry="4" fill="#2f5c46" opacity=".2"/><g class="toy-ball"><circle cx="30" cy="32" r="21" fill="#ee806f" stroke="${ink}" stroke-width="3"/><path d="M10 28Q30 40 50 28M14 44Q30 52 46 44" fill="none" stroke="#fffaf0" stroke-width="4" stroke-linecap="round"/><path d="M30 11V53" stroke="#f3c955" stroke-width="4"/><circle cx="22" cy="22" r="4" fill="#fffdf7" opacity=".8"/></g></svg>`,
    drum:`<svg viewBox="0 0 64 60" aria-hidden="true"><ellipse cx="32" cy="55" rx="24" ry="4" fill="#2f5c46" opacity=".2"/><g class="toy-drum"><path d="M10 22V44Q32 56 54 44V22Z" fill="#62cdf4" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/><path d="M10 24L22 46M22 28L34 50M34 30L46 48M46 28L54 40" stroke="#fffaf0" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="32" cy="22" rx="22" ry="8" fill="#fffaf0" stroke="${ink}" stroke-width="3"/><path d="M44 6L36 18" stroke="${ink}" stroke-width="4" stroke-linecap="round"/><circle cx="45" cy="5" r="4" fill="#f3c955" stroke="${ink}" stroke-width="2.4"/></g></svg>`,
    wand:`<svg viewBox="0 0 50 70" aria-hidden="true"><path d="M25 66V30" stroke="${ink}" stroke-width="6" stroke-linecap="round"/><path d="M25 66V30" stroke="#b49fcf" stroke-width="3" stroke-linecap="round"/><circle cx="25" cy="18" r="13" fill="#ccfbef" stroke="${ink}" stroke-width="3"/><circle cx="25" cy="18" r="7" fill="#fffdf7" opacity=".7"/></svg>`,
    bubble:`<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="16" fill="#ccfbef" fill-opacity=".45" stroke="#62cdf4" stroke-width="2.4"/><path d="M11 15Q14 9 20 8" fill="none" stroke="#fffdf7" stroke-width="3" stroke-linecap="round"/></svg>`,
  };
  // One picture per trick (v4 Growing Friend). A trick not learned yet is an
  // unopened seed — visible, quiet, never a lock.
  const trickIcons={
    spin:`<path d="M24 8A16 16 0 1 1 9 30" fill="none" stroke="${ink}" stroke-width="4" stroke-linecap="round"/><path d="M4 26L10 34L16 26Z" fill="${ink}"/><circle cx="24" cy="24" r="6" fill="#62cdf4" stroke="${ink}" stroke-width="2.4"/>`,
    hop:`<path d="M8 40Q14 14 20 40Q26 18 32 40Q38 22 42 40" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round" stroke-dasharray="3 5"/><circle cx="40" cy="20" r="7" fill="#7fce54" stroke="${ink}" stroke-width="2.4"/>`,
    sway:`<path d="M10 14Q24 24 10 34M38 14Q24 24 38 34" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round"/><circle cx="24" cy="24" r="7" fill="#ffa798" stroke="${ink}" stroke-width="2.4"/>`,
    sing:`<path d="M18 34V10L36 6V30" fill="none" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/><ellipse cx="14" cy="34" rx="6" ry="5" fill="#b49fcf" stroke="${ink}" stroke-width="2.4"/><ellipse cx="32" cy="30" rx="6" ry="5" fill="#b49fcf" stroke="${ink}" stroke-width="2.4"/>`,
    stretch:`<path d="M24 6V42M16 14L24 6L32 14M16 34L24 42L32 34" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`,
    juggle:`<path d="M10 38Q24 0 38 38" fill="none" stroke="${ink}" stroke-width="2.4" stroke-dasharray="3 5"/><circle cx="12" cy="30" r="5" fill="#ee806f" stroke="${ink}" stroke-width="2.4"/><circle cx="24" cy="12" r="5" fill="#f3c955" stroke="${ink}" stroke-width="2.4"/><circle cx="36" cy="30" r="5" fill="#62cdf4" stroke="${ink}" stroke-width="2.4"/>`,
    roll:`<circle cx="24" cy="24" r="14" fill="none" stroke="${ink}" stroke-width="3" stroke-dasharray="6 5"/><path d="M34 10L38 18L30 18Z" fill="${ink}"/><circle cx="24" cy="24" r="5" fill="#f3c955" stroke="${ink}" stroke-width="2.4"/>`,
    seed:`<ellipse cx="24" cy="28" rx="9" ry="11" fill="#c9bda4" stroke="#a89478" stroke-width="2.4" transform="rotate(-12 24 28)"/><path d="M24 17Q26 11 24 7" fill="none" stroke="#93ab6c" stroke-width="2.4" stroke-linecap="round"/>`,
  };
  // The sticker stand (v5): a little market stall. What it offers is always
  // shown face-up; nothing is blind.
  function stand(size=120){return `<svg class="room-stand" width="${size}" height="${Math.round(size*0.92)}" viewBox="0 0 130 120" aria-hidden="true"><ellipse cx="65" cy="114" rx="52" ry="6" fill="#2f5c46" opacity=".18"/><path d="M20 40V108M110 40V108" stroke="${ink}" stroke-width="6" stroke-linecap="round"/><path d="M20 40V108M110 40V108" stroke="#a89478" stroke-width="3" stroke-linecap="round"/><path d="M10 22H120L112 42H18Z" fill="#fffaf0" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>${[0,1,2,3,4].map(i=>`<path d="M${12+i*22} 23H${22+i*22}L${21+i*19} 41H${19+i*19}Z" fill="#ee806f"/>`).join('')}<path d="M18 42Q26 50 34 42Q42 50 50 42Q58 50 66 42Q74 50 82 42Q90 50 98 42Q106 50 112 42" fill="#fffaf0" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/><path d="M14 80H116V96H14Z" fill="#c69434" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/><path d="M20 86H110" stroke="#ffe49a" stroke-width="2.4" stroke-linecap="round"/>${[38,65,92].map((x,i)=>`<circle cx="${x}" cy="66" r="12" fill="#fffdf7" stroke="#c9bda4" stroke-width="2.4"/><circle cx="${x}" cy="66" r="7" fill="${['#ffa798','#b7e779','#96ecff'][i]}"/>`).join('')}</svg>`;}
  // 2026-10-13: a trick still growing is a seed PLANTED — a soil mound, the
  // seed peeking out in its own colour and a two-leaf sprout — so the tricks
  // tab reads as a seed bed coming up, not a grid of grey blanks.
  const plantedSeed=(fill)=>`<ellipse cx="24" cy="42" rx="17" ry="3" fill="#2f5c46" opacity=".18"/><path d="M7 41Q24 26 41 41Z" fill="#a89478" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/><path d="M13 38Q18 35 22 36M29 37Q33 36 35 38" fill="none" stroke="#70501b" stroke-width="1.6" stroke-linecap="round"/><ellipse cx="25" cy="33" rx="6" ry="4.5" fill="${fill}" stroke="${ink}" stroke-width="2.4" transform="rotate(-14 25 33)"/><path d="M24 29Q24 22 25 16" fill="none" stroke="#4e9677" stroke-width="2.4" stroke-linecap="round"/><path d="M25 19Q16 18 14 11Q22 10 25 19Z" fill="#7fce54" stroke="${ink}" stroke-width="1.6" stroke-linejoin="round"/><path d="M25 17Q31 11 37 10Q35 18 25 17Z" fill="#b7e779" stroke="${ink}" stroke-width="1.6" stroke-linejoin="round"/>`;
  const trick=(id,seedFill)=>`<svg viewBox="0 0 48 48" aria-hidden="true">${id==='seed'&&seedFill?plantedSeed(seedFill):(trickIcons[id]||trickIcons.seed)}</svg>`;

  // 2026-10-13: daily treasures — one small find waits on the map each new day
  // the child comes (no streak: a missed day costs nothing), and lives on the
  // album's nature shelf. Flat + ink, 64-unit boxes, palette only.
  const sh='<ellipse cx="32" cy="58" rx="18" ry="3" fill="#2f5c46" opacity=".18"/>';
  const TREASURES={
    shell:`${sh}<path d="M32 54L10 30Q14 12 32 10Q50 12 54 30Z" fill="#ffa798" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/><path d="M32 54L20 16M32 54V10M32 54L44 16M32 54L13 24M32 54L51 24" fill="none" stroke="#ee806f" stroke-width="2.4" stroke-linecap="round"/><path d="M24 56H40L36 50H28Z" fill="#ee806f" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/><path d="M18 22Q22 15 28 13" fill="none" stroke="#fffaf0" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>`,
    feather:`${sh}<path d="M44 8Q58 26 40 44Q30 52 22 50Q18 36 26 24Q34 12 44 8Z" fill="#96ecff" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/><path d="M44 8Q34 30 16 56" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/><path d="M38 22L48 20M34 30L46 32M30 38L40 42" stroke="#62cdf4" stroke-width="2.4" stroke-linecap="round"/>`,
    acorn:`${sh}<path d="M18 30Q18 52 32 56Q46 52 46 30Z" fill="#c69434" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/><path d="M14 30Q14 18 32 18Q50 18 50 30Z" fill="#70501b" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/><path d="M20 26H44M24 22H40" stroke="#a89478" stroke-width="2.4" stroke-linecap="round"/><path d="M32 18Q32 10 38 8" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round"/><path d="M24 36Q24 46 30 50" fill="none" stroke="#ffe49a" stroke-width="2.4" stroke-linecap="round"/>`,
    leaf:`${sh}<path d="M32 6L38 20L52 16L46 30L58 36L44 40L46 52L32 44L18 52L20 40L6 36L18 30L12 16L26 20Z" fill="#e8743c" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/><path d="M32 58V14M32 34L46 22M32 34L18 22M32 42L44 46M32 42L20 46" fill="none" stroke="#b0501f" stroke-width="2.4" stroke-linecap="round"/>`,
    // v206: the pinecone is built from overlapping rows of scales, with a stem and a leaf.
    pinecone:`${sh}<path d="M32 8Q31 4 34 2" fill="none" stroke="#70501b" stroke-width="2.4" stroke-linecap="round"/><path d="M33 4Q40 0 44 4Q38 8 33 4Z" fill="#7fce54" stroke="#4e9677" stroke-width="1.6" stroke-linejoin="round"/><path d="M32 8Q48 18 46 36Q44 52 32 56Q20 52 18 36Q16 18 32 8Z" fill="#70501b" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>${[[32,16,7],[26,26,8],[38,26,8],[21,37,7],[32,37,8],[43,37,7],[27,47,7.5],[37,47,7.5]].map(([x,y,r])=>`<path d="M${x-r} ${y-3}Q${x} ${y+r+3} ${x+r} ${y-3}Q${x} ${y+1} ${x-r} ${y-3}Z" fill="#c69434" stroke="${ink}" stroke-width="1.6" stroke-linejoin="round"/><path d="M${x-r*.5} ${y+1}Q${x} ${y+r*.7} ${x+r*.5} ${y+1}" fill="none" stroke="#ffe49a" stroke-width="1.6" stroke-linecap="round"/>`).join('')}`,
    ladybug:`${sh}<circle cx="32" cy="18" r="8" fill="${ink}"/><path d="M12 36Q12 18 32 18Q52 18 52 36Q52 54 32 54Q12 54 12 36Z" fill="#ee806f" stroke="${ink}" stroke-width="3"/><path d="M32 18V54" stroke="${ink}" stroke-width="3"/><circle cx="22" cy="30" r="4" fill="${ink}"/><circle cx="42" cy="30" r="4" fill="${ink}"/><circle cx="24" cy="44" r="3.4" fill="${ink}"/><circle cx="40" cy="44" r="3.4" fill="${ink}"/><circle cx="29" cy="15" r="1.6" fill="#fffaf0"/><circle cx="35" cy="15" r="1.6" fill="#fffaf0"/><path d="M18 26Q20 22 24 21" fill="none" stroke="#ffa798" stroke-width="2.4" stroke-linecap="round"/>`,
    snail:`${sh}<path d="M8 54Q8 46 18 46H52Q58 46 58 52Q58 56 52 56H12Q8 56 8 54Z" fill="#c4d39b" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/><circle cx="34" cy="34" r="16" fill="#f3c955" stroke="${ink}" stroke-width="3"/><path d="M34 34m-8 0a8 8 0 1 1 8 8a5 5 0 1 1 -3-8" fill="none" stroke="#c69434" stroke-width="2.4" stroke-linecap="round"/><path d="M52 46L56 34M48 46L50 34" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/><circle cx="56" cy="33" r="2.4" fill="${ink}"/><circle cx="50" cy="33" r="2.4" fill="${ink}"/>`,
    pebble:`${sh}<path d="M32 54Q12 40 12 26Q12 14 22 14Q28 14 32 22Q36 14 42 14Q52 14 52 26Q52 40 32 54Z" fill="#c9bda4" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/><path d="M20 22Q22 18 26 18" fill="none" stroke="#fffaf0" stroke-width="3" stroke-linecap="round"/><circle cx="38" cy="34" r="2" fill="#a89478"/><circle cx="28" cy="40" r="1.6" fill="#a89478"/>`,
    daisy:`${sh}<path d="M32 36Q30 48 32 58" fill="none" stroke="#4e9677" stroke-width="3" stroke-linecap="round"/><g stroke="${ink}" stroke-width="2.4">${[0,45,90,135,180,225,270,315].map(a=>`<ellipse cx="32" cy="14" rx="5" ry="9" fill="#fffaf0" transform="rotate(${a} 32 24)"/>`).join('')}</g><circle cx="32" cy="24" r="6" fill="#f3c955" stroke="${ink}" stroke-width="2.4"/>`,
    egg:`${sh}<path d="M32 8Q48 8 50 34Q50 54 32 56Q14 54 14 34Q16 8 32 8Z" fill="#96ecff" stroke="${ink}" stroke-width="3"/><path d="M15 36L20 31L25 36L30 31L35 36L40 31L45 36L49 32" fill="none" stroke="#3a8fc4" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="26" cy="22" r="2.4" fill="#62cdf4"/><circle cx="38" cy="24" r="1.6" fill="#62cdf4"/><circle cx="24" cy="46" r="2" fill="#62cdf4"/><circle cx="38" cy="45" r="3" fill="#62cdf4"/><circle cx="31" cy="51" r="1.6" fill="#62cdf4"/><path d="M22 20Q24 14 30 13" fill="none" stroke="#fffaf0" stroke-width="3" stroke-linecap="round"/>`,
    starfish:`${sh}<path d="M32 6L39 24L58 24L43 36L49 55L32 44L15 55L21 36L6 24L25 24Z" fill="#ffa06e" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/><circle cx="32" cy="18" r="1.6" fill="#e8743c"/><circle cx="32" cy="32" r="2" fill="#e8743c"/><circle cx="44" cy="28" r="1.6" fill="#e8743c"/><circle cx="20" cy="28" r="1.6" fill="#e8743c"/><circle cx="25" cy="44" r="1.6" fill="#e8743c"/><circle cx="39" cy="44" r="1.6" fill="#e8743c"/>`,
    clover:`${sh}<path d="M32 46Q34 52 40 58" fill="none" stroke="#4e9677" stroke-width="3" stroke-linecap="round"/>${[[32,14],[19,27],[45,27],[32,40]].map(([x,y])=>`<path d="M${x} ${y+8}Q${x-12} ${y} ${x-6} ${y-6}Q${x} ${y-10} ${x} ${y-2}Q${x} ${y-10} ${x+6} ${y-6}Q${x+12} ${y} ${x} ${y+8}Z" fill="#7fce54" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/><path d="M${x} ${y+6}V${y-1}" stroke="#4e9677" stroke-width="1.6" stroke-linecap="round"/>`).join('')}<circle cx="32" cy="27" r="2.4" fill="#4e9677"/><path d="M26 10L27 13L30 14L27 15L26 18L25 15L22 14L25 13Z" fill="#fffdf7"/>`,
    berries:`${sh}<path d="M30 8Q28 22 20 34M30 8Q34 22 44 32" fill="none" stroke="#70501b" stroke-width="2.4" stroke-linecap="round"/><path d="M30 10Q20 6 16 14Q26 18 30 10Z" fill="#7fce54" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/>${[[20,40],[30,46],[44,40],[38,52],[24,52]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="7" fill="#b49fcf" stroke="${ink}" stroke-width="2.4"/><circle cx="${x-2}" cy="${y-2}" r="1.6" fill="#e6d6f0"/>`).join('')}`,
    butterfly:`${sh}<path d="M32 20Q18 4 10 14Q6 26 30 32Q8 36 14 48Q24 56 32 38Q40 56 50 48Q56 36 34 32Q58 26 54 14Q46 4 32 20Z" fill="#ffe49a" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/><path d="M30 24Q20 18 14 16M30 34Q20 40 16 46M34 24Q44 18 50 16M34 34Q44 40 48 46" fill="none" stroke="#c69434" stroke-width="1.6" stroke-linecap="round"/><circle cx="20" cy="18" r="3.4" fill="#ffa06e"/><circle cx="44" cy="18" r="3.4" fill="#ffa06e"/><circle cx="20" cy="44" r="2.4" fill="#ee806f"/><circle cx="44" cy="44" r="2.4" fill="#ee806f"/><rect x="29" y="17" width="6" height="30" rx="3" fill="#70501b" stroke="${ink}" stroke-width="1.6"/><path d="M29.5 26H34.5M29.5 32H34.5M29.5 38H34.5" stroke="#c69434" stroke-width="1.6"/><path d="M32 18Q28 10 24 8M32 18Q36 10 40 8" fill="none" stroke="${ink}" stroke-width="1.6" stroke-linecap="round"/><circle cx="24" cy="8" r="2" fill="${ink}"/><circle cx="40" cy="8" r="2" fill="${ink}"/>`,
    crystal:`${sh}<path d="M32 6L44 22L38 54H26L20 22Z" fill="#e6d6f0" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/><path d="M20 22H44M32 6V54M26 22L32 54L38 22" fill="none" stroke="#b49fcf" stroke-width="2.4" stroke-linejoin="round"/><path d="M26 16L29 12" stroke="#fffdf7" stroke-width="2.4" stroke-linecap="round"/>`,
    // v165: gills under the cap, a skirt ring, moss, and a baby mushroom.
    mushroom:`${sh}<path d="M14 54Q16 47 20 46M44 55Q47 49 51 49" fill="none" stroke="#7fce54" stroke-width="2.4" stroke-linecap="round"/><path d="M25 36Q23 48 22 52Q32 57 42 52Q41 48 39 36Z" fill="#fffaf0" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/><path d="M36 46V51" fill="none" stroke="#e5dcc8" stroke-width="2.4" stroke-linecap="round"/><path d="M23 42Q32 47 41 42Q42 46 32 48Q22 46 23 42Z" fill="#fffdf7" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/><ellipse cx="32" cy="34" rx="22" ry="5" fill="#e5dcc8" stroke="${ink}" stroke-width="2.4"/><path d="M17 34L19 37M25 35V38.5M32 35V39M39 35V38.5M47 34L45 37" fill="none" stroke="#c9bda4" stroke-width="1.6" stroke-linecap="round"/><path d="M8 33Q8 12 32 10Q56 12 56 33Q44 29 32 30Q20 29 8 33Z" fill="#ee806f" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/><circle cx="22" cy="23" r="4" fill="#fffaf0"/><circle cx="38" cy="17" r="3.4" fill="#fffaf0"/><circle cx="45" cy="26" r="2.4" fill="#fffaf0"/><circle cx="30" cy="25" r="1.6" fill="#fffaf0"/><path d="M14 22Q17 15 23 13" fill="none" stroke="#ffa798" stroke-width="2.4" stroke-linecap="round"/><path d="M47 45V53Q50 55 53 53V45Z" fill="#fffaf0" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/><path d="M42 46Q42 38 50 38Q58 38 58 46Q50 44 42 46Z" fill="#ee806f" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/><circle cx="49" cy="41" r="1.6" fill="#fffaf0"/>`,
  };
  // Special-day finds (2026-10-16): a fanous during Ramadan, a crescent and
  // star on Eid. Not in the daily pool — they wait on their own days.
  TREASURES.fanous=`${sh}<path d="M32 4V10" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/><circle cx="32" cy="4" r="2.4" fill="#c69434"/><path d="M22 14H42L38 10H26Z" fill="#c69434" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/><path d="M20 14H44L46 40L32 50L18 40Z" fill="#ffe49a" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/><path d="M26 14L24 40L32 50L40 40L38 14M32 14V50" fill="none" stroke="#c69434" stroke-width="2.4"/><path d="M22 26H42" stroke="#ee806f" stroke-width="2.4"/><path d="M24 50H40L36 56H28Z" fill="#c69434" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/><circle cx="32" cy="32" r="4" fill="#ffa06e"/>`;
  TREASURES.crescent=`${sh}<path d="M36 6A24 24 0 1 0 44 50A18 18 0 1 1 36 6Z" fill="#f3c955" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/><path d="M48 18L50 24L56 24L51 28L53 34L48 30L43 34L45 28L40 24L46 24Z" fill="#ffe49a" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/><path d="M18 22Q20 14 28 10" fill="none" stroke="#ffe49a" stroke-width="3" stroke-linecap="round"/>`;
  const SPECIAL_IDS=['fanous','crescent'];
  const TREASURE_IDS=Object.keys(TREASURES).filter(id=>!SPECIAL_IDS.includes(id));
  // A golden find (after the first set is complete): the same treasure on a
  // gold medallion with a sparkle — a second, rarer-feeling shelf to fill.
  const treasure=(id,size=64)=>{
    const gold=String(id).startsWith('gold:'),base=gold?String(id).slice(5):id;
    const art=TREASURES[base]||TREASURES.shell;
    return `<svg class="treasure-art${gold?' is-gold':''}" viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true">${gold?`<circle cx="32" cy="32" r="30" fill="#ffe49a" stroke="#c69434" stroke-width="3"/><circle cx="32" cy="32" r="24" fill="none" stroke="#f3c955" stroke-width="2.4"/><g transform="translate(9 8) scale(.72)">${art}</g><path d="M52 6Q52 13 59 13Q52 13 52 20Q52 13 45 13Q52 13 52 6Z" fill="#fffaf0" stroke="#c69434" stroke-width="1.6"/>`:art}</svg>`;
  };
  ns.LettersRoomArt={alcove,nest,lesson,podium,pack,stand,tab,bud,floor,toys,trick,treasure,TREASURE_IDS,SPECIAL_IDS};
})(window.MiftahGame||(window.MiftahGame={}));
