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
    <path d="M107 212H174M426 212H493" stroke="#4a3620" stroke-width="6" stroke-linecap="round"/>
    <path d="M137 212V224Q152 224 152 235Q152 243 141 243L116 263H169L144 243" fill="none" stroke="#a89478" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M120 260H165L170 298Q143 309 115 298Z" fill="#c25a49"/>
    <path d="M122 260H164L164 290Q142 299 121 290Z" fill="#ee806f"/>
    <path d="M126 267H160M125 282H161" stroke="#ffa798" stroke-width="4"/>
    <rect x="439" y="232" width="49" height="71" rx="19" fill="#a89478" stroke="#4a3620" stroke-width="3"/>
    <rect x="445" y="237" width="37" height="59" rx="15" fill="#ccfbef"/>
    <path d="M451 269L474 246M453 280L463 269" stroke="#fffdf7" stroke-width="4" stroke-linecap="round"/>
    ${dais()}${leaves(54,318,.45)}${leaves(546,318,-.45)}
  `);}
  function nest(){return svg(`<path d="M17 332Q110 254 299 283Q469 263 584 332Q518 405 296 409Q82 405 17 332Z" fill="#b7e779"/><path d="M31 354Q292 415 572 353Q505 417 297 420Q101 416 31 354Z" fill="#4e9677"/>${leaves(100,203,1.2)}${leaves(500,203,-1.2)}<ellipse cx="300" cy="343" rx="148" ry="41" fill="#2f5c46" opacity=".2"/><path d="M158 308Q294 260 442 308L423 346Q300 387 177 346Z" fill="#a89478" stroke="${ink}" stroke-width="3"/><ellipse cx="300" cy="308" rx="143" ry="36" fill="#c9bda4"/><ellipse cx="300" cy="309" rx="118" ry="23" fill="#e5dcc8"/><path d="M177 324L406 348M205 350L423 319M203 288L386 323M193 334L368 288" fill="none" stroke="#fffaf0" stroke-width="4" stroke-linecap="round"/>`);}
  function lesson(){return svg(`
    <path d="M50 352V180Q49 26 300 22Q551 26 550 180V352Z" fill="#ccfbef" opacity=".52"/>
    <path d="M65 349V182Q65 50 300 46Q535 50 535 182V349" fill="none" stroke="#e5dcc8" stroke-width="8"/>
    <path d="M76 345V181Q80 66 300 61Q520 66 524 181V345" fill="none" stroke="#a89478" stroke-width="3"/>
    <path d="M26 352Q300 300 574 352L563 395Q300 432 37 395Z" fill="#4e9677" opacity=".32"/>
    <path d="M28 343Q300 296 572 343L558 376Q300 417 42 376Z" fill="#b7e779"/>
    <ellipse cx="300" cy="365" rx="182" ry="29" fill="#e5dcc8"/>
    <ellipse cx="300" cy="357" rx="182" ry="25" fill="#fffaf0"/>
    ${leaves(60,145,.72)}${leaves(540,145,-.72)}
    <path d="M63 351L108 306L120 318L77 364Z" fill="#f3c955" stroke="${ink}" stroke-width="2.4"/><path d="M108 306L122 300L126 312L120 318Z" fill="#fffaf0" stroke="${ink}" stroke-width="2.4"/>
    <path d="M482 353L503 322L533 340L512 372Z" fill="#ee806f" stroke="${ink}" stroke-width="2.4"/><path d="M492 340L522 355" stroke="#ffa798" stroke-width="4"/>
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
    <path d="M216 343L223 359Q295 379 370 359L378 343Q294 364 216 343Z" fill="#a89478"/>
    <path d="M231 347Q294 361 363 347" fill="none" stroke="#e5dcc8" stroke-width="3" stroke-linecap="round"/>
    ${leaves(42,284,.44)}${leaves(558,284,-.44)}
    <path d="M399 374Q414 350 428 372Q453 348 470 375Q488 365 503 388Q449 405 399 374Z" fill="#2f5c46"/>
    <path d="M414 373Q431 363 439 383M461 376Q474 369 485 385" fill="none" stroke="#4e9677" stroke-width="3" stroke-linecap="round"/>
  `);}
  function pack(size=120){return `<svg class="room-pack" width="${size}" height="${size*1.16}" viewBox="0 0 120 140" aria-hidden="true"><ellipse cx="60" cy="130" rx="46" ry="7" fill="#2f5c46" opacity=".17"/><path d="M17 15L60 5L103 15V113Q103 128 87 130H33Q17 128 17 113Z" fill="#c69434" stroke="${ink}" stroke-width="3"/><path d="M17 15L60 5L103 15V104Q60 126 17 104Z" fill="#ffe49a"/><path d="M21 16L60 35L99 16M23 20V102" fill="none" stroke="#fffaf0" stroke-width="4"/><path d="M17 76Q60 63 103 76V102Q60 117 17 102Z" fill="#4e9677"/><path d="M60 45L68 61L86 64L73 77L76 95L60 86L44 95L47 77L34 64L52 61Z" fill="#f3c955" stroke="${ink}" stroke-width="2.4"/><path d="M60 51L55 66L43 68" fill="none" stroke="#fffaf0" stroke-width="3" stroke-linecap="round"/><path d="M25 19H95" stroke="#c69434" stroke-width="1.6" stroke-dasharray="3 5"/></svg>`;}
  function tab(kind){return kind==='colors'?`<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 5Q43 7 43 24Q43 41 26 43Q18 43 20 34Q21 29 14 31Q3 31 5 20Q7 5 24 5Z" fill="#fffaf0" stroke="${ink}" stroke-width="3"/><circle cx="16" cy="16" r="5" fill="#ee806f"/><circle cx="30" cy="13" r="5" fill="#96ecff"/><circle cx="34" cy="27" r="5" fill="#4e9677"/><circle cx="12" cy="27" r="4" fill="#f3c955"/></svg>`:kind==='friends'?`<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M9 31V24Q9 8 24 8Q39 8 39 24V31Q39 42 24 42Q9 42 9 31Z" fill="#96ecff" stroke="${ink}" stroke-width="3"/><ellipse cx="18" cy="23" rx="5" ry="7" fill="#fffaf0"/><ellipse cx="30" cy="23" rx="5" ry="7" fill="#fffaf0"/><circle cx="19" cy="24" r="2.4" fill="${ink}"/><circle cx="29" cy="24" r="2.4" fill="${ink}"/><path d="M19 33Q24 38 29 33" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/></svg>`:`<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M16 11L8 15L4 25L12 29L15 24V41H33V24L36 29L44 25L40 15L32 11Q24 20 16 11Z" fill="#ee806f" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/><path d="M18 29H30M19 35H29" stroke="#ffa798" stroke-width="3" stroke-linecap="round"/></svg>`;}
  const bud=()=>`<svg viewBox="0 0 140 140" aria-hidden="true"><ellipse cx="70" cy="112" rx="43" ry="9" fill="#c9b28b"/><path d="M70 110V72" stroke="#617b50" stroke-width="7"/><path d="M67 95Q28 99 30 76Q56 71 67 95M73 90Q110 91 108 69Q84 68 73 90" fill="#83a56c" stroke="#617b50" stroke-width="3"/><path d="M70 81Q30 79 36 50Q40 34 54 44Q51 16 70 19Q89 16 86 44Q100 34 104 50Q110 79 70 81Z" fill="#eead86" stroke="#655239" stroke-width="4"/><path d="M58 54Q70 67 82 54" fill="none" stroke="#fffaf0" stroke-width="4" stroke-linecap="round"/></svg>`;
  ns.LettersRoomArt={alcove,nest,lesson,podium,pack,tab,bud,floor};
})(window.MiftahGame||(window.MiftahGame={}));
