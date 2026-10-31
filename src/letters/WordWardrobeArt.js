// Small, purposeful paper-world places for the wardrobe and word games.
(function (ns) {
  const INK = "#4a3620";
  const WOOD = "#c69434";
  const WOOD_LIGHT = "#f3c955";
  const WOOD_DARK = "#70501b";
  const PAPER = "#fffaf0";
  const PAPER_LIGHT = "#fffdf7";
  const PAPER_SHADE = "#e5dcc8";
  const PAPER_EDGE = "#c9bda4";
  const CORAL = "#ee806f";
  const CORAL_LIGHT = "#ffa798";
  const CORAL_DARK = "#c25a49";
  const LEAF = "#b7e779";
  const LEAF_DARK = "#4e9677";

  function dressingNook() {
    return `<svg viewBox="0 0 320 280" aria-hidden="true" focusable="false">
      <ellipse cx="160" cy="266" rx="127" ry="7" fill="#2f5c46" opacity=".18"/>
      <path d="M34 257V78Q34 20 91 20H229Q286 20 286 78V257Z M39 252V79Q39 27 92 27H228Q281 27 281 79V252Z" fill="${WOOD_DARK}" fill-rule="evenodd"/>
      <path d="M42 249V79Q42 30 92 30H228Q278 30 278 79V249" fill="none" stroke="${WOOD}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M48 249H272" fill="none" stroke="${WOOD_DARK}" stroke-width="8" stroke-linecap="round"/>
      <path d="M61 250L55 270M259 250L265 270" fill="none" stroke="${WOOD_DARK}" stroke-width="8" stroke-linecap="round"/>
      <path d="M54 247H266" fill="none" stroke="${WOOD_LIGHT}" stroke-width="3" stroke-linecap="round"/>
      <path d="M21 89Q21 80 30 80H42V126H30Q21 126 21 117Z" fill="${CORAL_DARK}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M25 86H38V119H25Z" fill="${CORAL}"/>
      <path d="M26 95H37M26 103H37M26 111H37" fill="none" stroke="${CORAL_LIGHT}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M278 90Q278 81 287 81H299V127H287Q278 127 278 118Z" fill="${PAPER_EDGE}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M282 87H295V120H282Z" fill="${PAPER_SHADE}"/>
      <path d="M283 96H294M283 104H294M283 112H294" fill="none" stroke="${WOOD}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M43 71Q43 65 49 65H55V79H49Q43 79 43 73Z" fill="${WOOD_LIGHT}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M265 71Q265 65 271 65H277V79H271Q265 79 265 73Z" fill="${WOOD_LIGHT}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
      <circle cx="49" cy="69" r="2.4" fill="${CORAL}"/>
      <circle cx="271" cy="69" r="2.4" fill="${LEAF_DARK}"/>
      <path d="M67 257Q160 252 253 257" fill="none" stroke="${WOOD}" stroke-width="2.4" stroke-linecap="round"/>
    </svg>`;
  }

  function crownStage() {
    return `<svg viewBox="0 0 360 170" aria-hidden="true" focusable="false">
      <ellipse cx="180" cy="161" rx="148" ry="6" fill="#2f5c46" opacity=".16"/>
      <path d="M28 15Q28 6 38 6H322Q332 6 332 15V19H28Z" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M34 15Q34 11 40 11H320Q326 11 326 15V15H34Z" fill="${WOOD}"/>
      <path d="M48 15Q180 9 312 15" fill="none" stroke="${WOOD_LIGHT}" stroke-width="3" stroke-linecap="round"/>
      <path d="M154 13L161 2L174 10L180 0L187 10L200 2L206 13Z" fill="${WOOD_LIGHT}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M161 14H199V19H161Z" fill="${WOOD}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
      <circle cx="180" cy="7" r="2.4" fill="${CORAL}"/>
      <path d="M38 25V125M322 25V125" fill="none" stroke="${WOOD_DARK}" stroke-width="8" stroke-linecap="round"/>
      <path d="M43 29V122M317 29V122" fill="none" stroke="${WOOD_LIGHT}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M23 132Q23 125 31 125H329Q337 125 337 133V151Q180 159 23 151Z" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M29 132Q180 124 331 132V143Q180 150 29 143Z" fill="${WOOD}"/>
      <path d="M39 131Q180 125 321 131" fill="none" stroke="${WOOD_LIGHT}" stroke-width="3" stroke-linecap="round"/>
      <path d="M45 153L40 164M315 153L320 164" fill="none" stroke="${WOOD_DARK}" stroke-width="8" stroke-linecap="round"/>
    </svg>`;
  }

  function readingNook() {
    return `<svg viewBox="0 0 320 210" aria-hidden="true" focusable="false">
      <ellipse cx="160" cy="196" rx="132" ry="6" fill="#2f5c46" opacity=".16"/>
      <path d="M31 172V97Q31 43 83 31Q160 13 237 31Q289 43 289 97V172" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M38 168V98Q38 49 86 38Q160 21 234 38Q282 49 282 98V168Z" fill="${WOOD}"/>
      <path d="M49 85Q60 53 91 46Q160 29 229 46Q260 53 271 85" fill="none" stroke="${WOOD_LIGHT}" stroke-width="3" stroke-linecap="round"/>
      <path d="M59 161H261Q267 161 267 167Q267 173 261 173H59Q53 173 53 167Q53 161 59 161Z" fill="${WOOD_DARK}"/>
      <path d="M57 163H263" fill="none" stroke="${WOOD_LIGHT}" stroke-width="3" stroke-linecap="round"/>
      <path d="M76 177L68 190M244 177L252 190" fill="none" stroke="${WOOD_DARK}" stroke-width="8" stroke-linecap="round"/>
      <path d="M32 67Q32 59 40 59H54V75H40Q32 75 32 67Z" fill="${PAPER_EDGE}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M38 63H51V70H38Z" fill="${PAPER_LIGHT}"/>
      <path d="M40 42Q48 29 62 35Q68 49 55 60Q47 55 40 42Z" fill="${LEAF}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M45 43Q53 46 60 55" fill="none" stroke="${LEAF_DARK}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M79 174Q160 168 241 174" fill="none" stroke="${WOOD}" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="47" cy="150" r="4" fill="${CORAL}" stroke="${INK}" stroke-width="2.4"/>
      <path d="M43 145Q47 138 51 145" fill="none" stroke="${CORAL_LIGHT}" stroke-width="2.4" stroke-linecap="round"/>
    </svg>`;
  }

  function bookCradle() {
    return `<svg viewBox="0 0 520 280" aria-hidden="true" focusable="false">
      <ellipse cx="260" cy="265" rx="221" ry="8" fill="#2f5c46" opacity=".16"/>
      <path d="M64 218L55 261H75L88 217M432 217L445 261H465L456 218" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M30 208Q260 221 490 208L476 235Q260 251 44 235Z" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M38 211Q260 226 482 211L471 225Q260 242 49 225Z" fill="${WOOD}"/>
      <path d="M54 216Q260 231 466 216" fill="none" stroke="${WOOD_LIGHT}" stroke-width="4" stroke-linecap="round"/>
      <path d="M27 51Q145 19 260 47Q375 19 493 51V213Q376 225 260 219Q144 225 27 213Z" fill="${PAPER_EDGE}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M32 43Q145 11 260 39Q375 11 488 43V201Q376 210 260 207Q144 210 32 201Z" fill="${PAPER}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M43 49Q149 23 250 47M270 47Q371 23 477 49" fill="none" stroke="${PAPER_LIGHT}" stroke-width="6" stroke-linecap="round"/>
      <path d="M260 40V55M260 188V206M45 207Q142 217 246 212M274 212Q378 217 475 207" fill="none" stroke="${PAPER_EDGE}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M392 29V63L405 55L418 63V32" fill="${CORAL}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M398 34V48" fill="none" stroke="${CORAL_LIGHT}" stroke-width="3" stroke-linecap="round"/>
      <path d="M24 190Q10 173 23 164Q40 174 33 192Z" fill="${LEAF}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M26 174L30 190" fill="none" stroke="${LEAF_DARK}" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="29" cy="201" r="5" fill="${CORAL}" stroke="${INK}" stroke-width="2.4"/>
    </svg>`;
  }

  ns.WordWardrobeArt = { dressingNook, crownStage, readingNook, bookCradle };
})(window.MiftahGame || (window.MiftahGame = {}));
