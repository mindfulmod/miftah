// Quiet workshop props for the letter-garden shadow play.
(function (ns) {
  const INK = "#4a3620";
  const WOOD = "#c69434";
  const WOOD_LIGHT = "#f3c955";
  const WOOD_DARK = "#70501b";
  const PAPER = "#fffaf0";
  const PAPER_LIGHT = "#fffdf7";
  const PAPER_SHADE = "#e5dcc8";
  const PAPER_EDGE = "#c9bda4";
  const GREEN = "#7fce54";
  const LEAF = "#b7e779";
  const LEAF_DARK = "#4e9677";
  const GREEN_DARK = "#2f5c46";
  const CORAL = "#ee806f";
  const CORAL_LIGHT = "#ffa798";
  const CORAL_DARK = "#c25a49";
  const SKY = "#96ecff";
  const SKY_LIGHT = "#ccfbef";
  const SKY_DARK = "#62cdf4";
  const WARM = "#ffe49a";

  function assemblyBoard() {
    return `<svg viewBox="0 0 280 250" aria-hidden="true">
      <ellipse cx="140" cy="239" rx="119" ry="7" fill="${GREEN_DARK}" opacity=".16"/>
      <path d="M13 21Q13 12 23 12H257Q267 12 267 22V220Q267 230 257 230H23Q13 230 13 220Z" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M18 22Q18 17 24 17H256Q262 17 262 23V216Q262 222 256 222H24Q18 222 18 216Z" fill="${WOOD}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M25 23Q140 15 255 23V34Q140 27 25 34Z" fill="${WOOD_LIGHT}"/>
      <path d="M28 36V215M252 36V215" fill="none" stroke="${WOOD_DARK}" stroke-width="2.4" stroke-linecap="round"/>
      <rect x="50" y="28" width="180" height="180" rx="8" fill="${PAPER_EDGE}" stroke="${INK}" stroke-width="3"/>
      <rect x="54" y="32" width="172" height="172" rx="6" fill="${PAPER}"/>
      <path d="M61 38H219" stroke="${PAPER_LIGHT}" stroke-width="3" stroke-linecap="round"/>
      <path d="M31 48H45V82H31Q25 82 25 76V54Q25 48 31 48Z" fill="${CORAL_DARK}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M31 52H41V77H31Z" fill="${CORAL}"/>
      <path d="M30 57H40M30 64H40M30 71H40" stroke="${CORAL_DARK}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M235 50Q235 45 241 45H249Q255 45 255 51V78Q255 84 249 84H241Q235 84 235 78Z" fill="${PAPER_SHADE}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M239 52Q245 49 251 52V75Q245 78 239 75Z" fill="${WOOD_LIGHT}"/>
      <path d="M38 218H242" stroke="${WOOD_DARK}" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="31" cy="28" r="2.4" fill="${WOOD_LIGHT}"/>
      <circle cx="249" cy="28" r="2.4" fill="${WOOD_LIGHT}"/>
    </svg>`;
  }

  function pictureFrame() {
    return `<svg viewBox="0 0 240 210" aria-hidden="true">
      <ellipse cx="120" cy="201" rx="77" ry="5" fill="${GREEN_DARK}" opacity=".16"/>
      <path d="M45 167L38 198M195 167L202 198" stroke="${WOOD_DARK}" stroke-width="6" stroke-linecap="round"/>
      <path d="M120 164L105 198M120 164L136 198" stroke="${WOOD}" stroke-width="4" stroke-linecap="round"/>
      <path d="M27 15Q27 9 34 9H206Q213 9 213 16V171Q213 178 206 178H34Q27 178 27 171Z" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M32 17Q32 13 37 13H203Q208 13 208 18V166Q208 171 203 171H37Q32 171 32 166Z" fill="${WOOD}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M38 18Q120 12 202 18V28Q120 23 38 28Z" fill="${WOOD_LIGHT}"/>
      <rect x="42" y="24" width="156" height="147" rx="7" fill="${PAPER_EDGE}" stroke="${INK}" stroke-width="2.4"/>
      <rect x="46" y="28" width="148" height="139" rx="5" fill="${PAPER}"/>
      <path d="M52 34H187" stroke="${PAPER_LIGHT}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M32 177Q120 172 208 177V187Q120 182 32 187Z" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M37 176Q120 171 203 176V181Q120 177 37 181Z" fill="${WOOD_LIGHT}"/>
      <path d="M46 198H194" stroke="${WOOD_DARK}" stroke-width="4" stroke-linecap="round"/>
      <circle cx="34" cy="19" r="2.4" fill="${WOOD_LIGHT}"/>
      <circle cx="206" cy="19" r="2.4" fill="${WOOD_LIGHT}"/>
    </svg>`;
  }

  function theatreFrame() {
    return `<svg viewBox="0 0 640 360" aria-hidden="true">
      <ellipse cx="320" cy="344" rx="282" ry="10" fill="${GREEN_DARK}" opacity=".2"/>
      <path d="M18 49Q18 24 43 24H597Q622 24 622 49V304Q622 322 603 322H37Q18 322 18 304Z" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
      <path d="M27 51Q27 34 45 34H595Q613 34 613 52V296Q613 309 599 309H41Q27 309 27 296Z" fill="${WOOD}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M43 37Q320 25 597 37V55Q320 45 43 55Z" fill="${WOOD_LIGHT}"/>
      <path d="M44 53Q55 71 66 53Q78 72 90 53V286H44Z" fill="${CORAL_DARK}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M53 59Q64 75 75 59Q84 72 85 61V280H53Z" fill="${CORAL}"/>
      <path d="M56 70V270M81 68V280" stroke="${CORAL_LIGHT}" stroke-width="6" stroke-linecap="round" opacity=".75"/>
      <path d="M596 53Q585 71 574 53Q562 72 550 53V286H596Z" fill="${CORAL_DARK}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M587 59Q576 75 565 59Q556 72 555 61V280H587Z" fill="${CORAL}"/>
      <path d="M584 70V270M559 68V280" stroke="${CORAL_LIGHT}" stroke-width="6" stroke-linecap="round" opacity=".75"/>
      <path d="M90 70Q320 59 550 70V286Q320 279 90 286Z" fill="${PAPER_SHADE}"/>
      <path d="M90 70Q320 59 550 70V282Q320 275 90 282Z" fill="${PAPER}"/>
      <path d="M102 79Q320 68 538 79" fill="none" stroke="${PAPER_LIGHT}" stroke-width="4" stroke-linecap="round"/>
      <path d="M67 294Q320 282 573 294V318Q320 308 67 318Z" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M73 292Q320 282 567 292V304Q320 296 73 304Z" fill="${WOOD_LIGHT}"/>
      <path d="M113 322L102 343M527 322L538 343" stroke="${WOOD_DARK}" stroke-width="8" stroke-linecap="round"/>
      <path d="M60 31Q75 9 90 31Q105 9 120 31Q135 9 150 31Q165 9 180 31Q195 9 210 31Q225 9 240 31Q255 9 270 31Q285 9 300 31Q315 9 330 31Q345 9 360 31Q375 9 390 31Q405 9 420 31Q435 9 450 31Q465 9 480 31Q495 9 510 31Q525 9 540 31Q555 9 570 31" fill="none" stroke="${LEAF_DARK}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M72 26Q85 10 98 26M162 26Q175 10 188 26M252 26Q265 10 278 26M342 26Q355 10 368 26M432 26Q445 10 458 26M522 26Q535 10 548 26" fill="none" stroke="${LEAF}" stroke-width="4" stroke-linecap="round"/>
      <circle cx="45" cy="45" r="4" fill="${WOOD_LIGHT}"/>
      <circle cx="595" cy="45" r="4" fill="${WOOD_LIGHT}"/>
    </svg>`;
  }

  function nightGarden() {
    return `<svg viewBox="0 0 680 440" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 0H680V194Q583 160 504 195T340 193T169 197T0 186Z" fill="#6064a0"/>
      <path d="M0 122Q93 98 188 125T376 122T566 117T680 125V440H0Z" fill="#4a4d84"/>
      <path d="M0 248Q95 211 190 242T374 247T555 229T680 242V440H0Z" fill="#34375f"/>
      <path d="M0 328Q110 303 221 329T444 325T680 308V440H0Z" fill="#4e9677"/>
      <path d="M0 378Q112 353 226 378T454 374T680 360V440H0Z" fill="#2f5c46"/>
      <path d="M0 414Q111 390 224 412T451 411T680 392V440H0Z" fill="#7fce54"/>
      <path d="M274 440Q290 406 326 376Q364 345 356 309Q350 278 386 253Q418 231 448 238Q416 260 398 286Q377 315 391 345Q407 378 370 405L342 440Z" fill="#c9bda4"/>
    </svg>`;
  }

  function nightTree() {
    return `<svg viewBox="0 0 140 210" aria-hidden="true">
      <ellipse cx="70" cy="203" rx="51" ry="6" fill="${GREEN_DARK}" opacity=".28"/>
      <path d="M51 188Q57 160 59 133L54 103Q49 90 57 79L63 91L67 117L70 128L76 106L83 89L88 83Q91 94 86 109L80 139Q81 166 91 188Q72 196 51 188Z" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M62 178Q67 147 67 126M78 142L82 113" fill="none" stroke="${WOOD}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M50 185Q57 177 63 186Q70 178 76 186Q84 177 91 187L98 196Q70 202 42 196Z" fill="${WOOD}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M18 84Q16 69 28 62Q24 47 39 41Q39 25 54 24Q62 9 75 20Q91 9 99 26Q116 26 117 43Q132 51 123 67Q129 80 115 91Q108 105 93 98Q82 109 70 98Q55 107 46 95Q29 102 24 89Z" fill="${LEAF_DARK}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M23 72Q20 57 34 52Q30 38 45 33Q48 19 60 27Q71 13 81 28Q96 17 103 36Q119 35 117 50Q129 57 117 70Q122 83 108 88Q98 101 86 91Q75 102 65 90Q51 101 44 86Q29 92 23 80Z" fill="${LEAF}"/>
      <path d="M35 51Q42 34 57 36M77 33Q92 29 99 45M46 75Q57 58 69 62M88 71Q98 54 111 59" fill="none" stroke="${GREEN}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M40 61Q46 54 51 61M69 46Q75 39 80 46M96 82Q102 76 107 82" fill="none" stroke="${LEAF_DARK}" stroke-width="2.4" stroke-linecap="round"/>
    </svg>`;
  }

  function lantern() {
    return `<svg viewBox="0 0 72 96" aria-hidden="true">
      <ellipse cx="36" cy="91" rx="22" ry="3" fill="${GREEN_DARK}" opacity=".2"/>
      <path d="M22 24Q22 7 36 7Q50 7 50 24" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
      <path d="M25 24Q25 11 36 11Q47 11 47 24" fill="none" stroke="${WOOD_LIGHT}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M15 27Q15 23 20 23H52Q57 23 57 28V70Q57 75 52 75H20Q15 75 15 70Z" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M20 29Q20 27 23 27H49Q52 27 52 30V67Q52 71 48 71H24Q20 71 20 67Z" fill="${WOOD}"/>
      <path d="M25 32H47V65H25Z" fill="${WARM}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M29 59Q25 51 32 47Q33 40 36 37Q40 43 40 47Q47 52 42 59Z" fill="${CORAL}"/>
      <path d="M35 57Q32 52 36 47Q40 53 38 57Z" fill="${CORAL_LIGHT}"/>
      <path d="M18 30V66M54 30V66" stroke="${WOOD_LIGHT}" stroke-width="3" stroke-linecap="round"/>
      <path d="M18 73Q36 77 54 73V81Q36 86 18 81Z" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M22 74Q36 77 50 74V78Q36 81 22 78Z" fill="${WOOD_LIGHT}"/>
      <circle cx="22" cy="26" r="2.4" fill="${WOOD_LIGHT}"/>
      <circle cx="50" cy="26" r="2.4" fill="${WOOD_LIGHT}"/>
    </svg>`;
  }

  function jar() {
    return `<svg viewBox="0 0 100 110" aria-hidden="true">
      <ellipse cx="50" cy="103" rx="33" ry="5" fill="${GREEN_DARK}" opacity=".18"/>
      <path d="M31 16Q31 10 37 10H63Q69 10 69 16V24Q82 30 83 44V86Q83 99 70 99H30Q17 99 17 86V44Q18 30 31 24Z" fill="${SKY}" fill-opacity=".16" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M27 58V80Q27 86 33 87M73 50V78" fill="none" stroke="${PAPER_LIGHT}" stroke-width="3" stroke-linecap="round"/>
      <path d="M28 20Q50 25 72 20V30Q50 35 28 30Z" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M30 21Q50 25 70 21V25Q50 29 30 25Z" fill="${WOOD_LIGHT}"/>
      <path d="M23 87Q50 92 77 87V95Q50 101 23 95Z" fill="${SKY_DARK}" fill-opacity=".7" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M27 89Q50 94 73 89" fill="none" stroke="${SKY_LIGHT}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M35 36Q50 39 65 36" fill="none" stroke="${SKY_LIGHT}" stroke-width="2.4" stroke-linecap="round"/>
    </svg>`;
  }

  ns.WorkshopShadowArt = {
    assemblyBoard,
    pictureFrame,
    theatreFrame,
    nightGarden,
    nightTree,
    lantern,
    jar,
  };
})(window.MiftahGame || (window.MiftahGame = {}));
