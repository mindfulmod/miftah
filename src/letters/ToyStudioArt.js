// Purposeful paper-and-wood scenery for the small toybox games.
(function (ns) {
  const INK = "#4a3620";
  const WOOD = "#c69434";
  const WOOD_LIGHT = "#f3c955";
  const WOOD_DARK = "#70501b";
  const PAPER_LIGHT = "#fffdf7";
  const LEAF = "#b7e779";
  const LEAF_DARK = "#4e9677";
  const GREEN = "#7fce54";
  const GREEN_DARK = "#2f5c46";
  const CORAL = "#ee806f";

  function pairLeaf() {
    return `<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <ellipse cx="50" cy="88" rx="29" ry="5" fill="${GREEN_DARK}" opacity=".16"/>
      <path d="M24 66Q14 48 27 30Q41 12 65 15Q84 18 84 38Q84 61 62 76Q42 88 28 76Z" fill="${GREEN}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M28 64Q25 45 39 29Q50 18 66 20Q52 27 44 42Q37 55 38 72Q32 72 28 64Z" fill="${LEAF}"/>
      <path d="M29 73Q19 81 23 88Q29 92 39 84" fill="none" stroke="${LEAF_DARK}" stroke-width="4" stroke-linecap="round"/>
      <path d="M28 73Q48 56 74 31" fill="none" stroke="${LEAF_DARK}" stroke-width="3" stroke-linecap="round"/>
      <path d="M43 60Q39 48 34 45M54 50Q53 40 48 35M60 43Q68 43 73 46" fill="none" stroke="${LEAF_DARK}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M52 31Q62 23 73 24Q72 35 62 40Q55 39 52 31Z" fill="${PAPER_LIGHT}" opacity=".8"/>
      <path d="M57 31Q63 28 68 28" fill="none" stroke="${LEAF}" stroke-width="2.4" stroke-linecap="round"/>
    </svg>`;
  }

  function nestParts(n) {
    const count = Math.max(0, Math.min(3, Math.floor(Number(n) || 0)));
    const dots = count === 1 ? [50] : count === 2 ? [40, 60] : count === 3 ? [32, 50, 68] : [];
    return `<ellipse cx="50" cy="76" rx="39" ry="3" fill="${GREEN_DARK}" opacity=".17"/>
      <path d="M18 47Q28 41 37 46Q49 39 60 46Q72 40 82 47L77 57Q68 53 60 58Q49 53 39 59Q29 53 22 58Z" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M16 51Q28 47 39 52Q50 47 62 52Q73 47 84 51" fill="none" stroke="${WOOD_LIGHT}" stroke-width="3" stroke-linecap="round"/>
      <path d="M22 58Q48 68 78 57L72 70Q49 79 28 70Z" fill="${WOOD}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M29 64Q49 71 71 64M34 70Q50 75 67 70" fill="none" stroke="${WOOD_DARK}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M28 50Q35 44 42 49M58 49Q66 44 73 49" fill="none" stroke="${WOOD}" stroke-width="2.4" stroke-linecap="round"/>
      ${dots.map((x, i) => `<g class="ts-nest-dot" style="--dot-step:${i}"><circle cx="${x}" cy="30" r="8" fill="${INK}"/><circle cx="${x}" cy="30" r="5.2" fill="#e8743c"/><circle cx="${x-2}" cy="28" r="1.5" fill="#fffaf0"/></g>`).join("")}`;
  }

  function nest(n) {
    return `<svg viewBox="0 0 100 80" aria-hidden="true" focusable="false">${nestParts(n)}</svg>`;
  }

  function dotTree() {
    return `<svg viewBox="0 0 360 300" aria-hidden="true" focusable="false">
      <path d="M5 281Q36 261 106 269Q145 271 194 263Q277 252 351 277Q345 294 279 295H75Q24 296 5 281Z" fill="#b7e779"/>
      <path d="M14 286Q95 277 178 287Q253 271 340 282Q321 296 256 298H80Q34 297 14 286Z" fill="#7fce54"/>
      <ellipse cx="78" cy="285" rx="51" ry="7" fill="${GREEN_DARK}" opacity=".16"/>
      <path d="M66 274Q78 239 73 205Q68 174 78 144Q84 123 92 109L105 115Q94 145 96 174Q99 211 91 244L100 273Q84 281 66 274Z" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M80 254Q83 217 81 186M87 169Q86 145 96 125" fill="none" stroke="${WOOD}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M85 151Q103 112 138 91Q177 66 235 82" fill="none" stroke="${WOOD_DARK}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M235 84Q244 116 244 157" fill="none" stroke="${WOOD_DARK}" stroke-width="8" stroke-linecap="round"/>
      <path d="M224 162Q283 154 342 162" fill="none" stroke="${WOOD_DARK}" stroke-width="8" stroke-linecap="round"/>
      <path d="M224 158Q283 151 342 158" fill="none" stroke="${WOOD}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M76 238Q53 226 22 230M18 294Q68 287 118 294" fill="none" stroke="${WOOD_DARK}" stroke-width="6" stroke-linecap="round"/>
      <path d="M16 91Q17 63 43 55Q47 29 76 28Q96 5 118 26Q145 10 162 34Q186 28 193 54Q185 77 159 81Q145 103 120 94Q100 115 78 99Q49 112 33 96Z" fill="${LEAF_DARK}"/>
      <path d="M97 68Q94 41 119 30Q138 10 159 35Q184 34 186 58Q180 78 157 82Q140 99 120 87Q105 92 97 68Z" fill="${LEAF}"/>
      <path d="M228 73Q227 46 250 39Q258 15 283 22Q302 5 321 28Q345 31 345 55Q335 77 313 78Q300 101 276 88Q251 101 237 82Z" fill="${GREEN}"/>
      <path d="M245 51Q264 31 282 35M299 40Q316 30 330 45M50 75Q66 55 83 58M127 57Q146 42 163 52" fill="none" stroke="${LEAF}" stroke-width="2.4" stroke-linecap="round"/>
    </svg>`;
  }

  function countPerch() {
    return `<svg viewBox="0 0 360 240" aria-hidden="true" focusable="false">
      <ellipse cx="181" cy="229" rx="150" ry="5" fill="${GREEN_DARK}" opacity=".15"/>
      <path d="M0 125Q7 98 24 91Q29 66 50 65Q65 43 82 55Q93 70 80 86Q73 102 82 122Q68 141 48 134Q28 151 10 140Z" fill="${LEAF_DARK}"/>
      <path d="M0 116Q9 89 27 83Q35 58 52 60Q66 42 80 55Q89 70 76 86Q70 103 78 122Q62 138 44 130Q26 146 9 134Z" fill="${LEAF}"/>
      <path d="M13 104Q27 82 43 80M50 116Q65 91 77 88M37 73Q49 61 60 65" fill="none" stroke="${GREEN}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M42 227Q51 189 43 156Q39 120 50 91L61 94Q52 126 57 156Q63 193 56 230Z" fill="${WOOD}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M45 195Q180 184 315 195" fill="none" stroke="${WOOD_DARK}" stroke-width="8" stroke-linecap="round"/>
      <path d="M56 191Q180 181 304 191" fill="none" stroke="${WOOD_LIGHT}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M105 194L113 215M255 194L247 215" fill="none" stroke="${WOOD_DARK}" stroke-width="6" stroke-linecap="round"/>
      <path d="M109 198L115 213M251 198L245 213" fill="none" stroke="${WOOD}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M85 217Q180 212 275 217" fill="none" stroke="${WOOD_DARK}" stroke-width="4" stroke-linecap="round"/>
    </svg>`;
  }

  function puzzleFrame() {
    return `<svg viewBox="0 0 340 340" aria-hidden="true" focusable="false">
      <ellipse cx="170" cy="334" rx="145" ry="4" fill="${GREEN_DARK}" opacity=".15"/>
      <path d="M28 4H312Q336 4 336 28V312Q336 336 312 336H28Q4 336 4 312V28Q4 4 28 4Z M20 20H320V320H20Z" fill="${WOOD_DARK}" fill-rule="evenodd"/>
      <path d="M28 4H312Q336 4 336 28V312Q336 336 312 336H28Q4 336 4 312V28Q4 4 28 4Z" fill="none" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M10 40V28Q10 10 28 10H40M300 10H312Q330 10 330 28V40M330 300V312Q330 330 312 330H300M40 330H28Q10 330 10 312V300" fill="none" stroke="${WOOD_LIGHT}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="12" cy="12" r="5" fill="${WOOD_LIGHT}" stroke="${INK}" stroke-width="2.4"/>
      <circle cx="328" cy="12" r="5" fill="${WOOD_LIGHT}" stroke="${INK}" stroke-width="2.4"/>
      <circle cx="12" cy="328" r="5" fill="${WOOD_LIGHT}" stroke="${INK}" stroke-width="2.4"/>
      <circle cx="328" cy="328" r="5" fill="${WOOD_LIGHT}" stroke="${INK}" stroke-width="2.4"/>
      <path d="M12 44V296M328 44V296" fill="none" stroke="${WOOD}" stroke-width="2.4" stroke-linecap="round"/>
    </svg>`;
  }

  function drawingEasel() {
    return `<svg viewBox="0 0 360 410" aria-hidden="true" focusable="false">
      <ellipse cx="180" cy="400" rx="133" ry="5" fill="${GREEN_DARK}" opacity=".16"/>
      <path d="M45 353L74 346L92 390L61 395Z" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M315 353L286 346L268 390L299 395Z" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M20 391Q20 384 28 384H332Q340 384 340 391V400H20Z" fill="${WOOD}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M34 388H326" fill="none" stroke="${WOOD_LIGHT}" stroke-width="3" stroke-linecap="round"/>
      <path d="M18 36Q18 30 24 30H27V340H22Q18 340 18 336Z" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M333 30H336Q342 30 342 36V336Q342 340 338 340H333Z" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M22 50V323M338 50V323" fill="none" stroke="${WOOD_LIGHT}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M155 15Q155 10 161 10H199Q205 10 205 15V29H155Z" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M161 15H199V22H161Z" fill="${WOOD_LIGHT}"/>
      <circle cx="180" cy="17" r="2.4" fill="${CORAL}"/>
      <path d="M33 343Q180 335 327 343V363Q180 371 33 363Z" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M40 345Q180 338 320 345V352Q180 359 40 352Z" fill="${WOOD}"/>
      <path d="M51 346Q180 340 309 346" fill="none" stroke="${WOOD_LIGHT}" stroke-width="3" stroke-linecap="round"/>
    </svg>`;
  }

  function crayon(color) {
    return `<svg viewBox="0 0 40 80" aria-hidden="true" focusable="false">
      <path d="M9 24L20 4L31 24V72Q31 77 26 77H14Q9 77 9 72Z" fill="${color}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M14 24L20 12M14 27V69" fill="none" stroke="${PAPER_LIGHT}" opacity=".5" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M9 32Q20 35 31 32V62Q20 65 9 62Z" fill="#fffaf0" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M10 41Q20 44 30 41V52Q20 55 10 52Z" fill="${color}"/>
      <path d="M14 36L15 60" fill="none" stroke="${PAPER_LIGHT}" stroke-width="2.4" stroke-linecap="round"/>
    </svg>`;
  }

  ns.ToyStudioArt = { pairLeaf, nest, dotTree, countPerch, puzzleFrame, drawingEasel, crayon };
})(window.MiftahGame || (window.MiftahGame = {}));
