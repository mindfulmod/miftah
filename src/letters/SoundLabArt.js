// The Sound Lab's blend machine, drawn as a small garden workshop toy.
(function (ns) {
  const INK = "#4a3620";
  const WOOD = "#c69434";
  const WOOD_LIGHT = "#f3c955";
  const WOOD_DARK = "#70501b";
  const SKY = "#62cdf4";
  const SKY_LIGHT = "#ccfbef";
  const SKY_DARK = "#3a8fc4";
  const PAPER = "#fffaf0";
  const PAPER_LIGHT = "#fffdf7";
  const PAPER_EDGE = "#c9bda4";
  const CORAL = "#ee806f";
  const CORAL_LIGHT = "#ffa798";
  const LEAF = "#7fce54";

  function machine() {
    return `<svg class="lab-machine" viewBox="0 0 360 280" aria-hidden="true" focusable="false">
      <ellipse cx="180" cy="270" rx="145" ry="6" fill="#70501b" opacity=".17"/>

      <!-- The two ingredient funnels frame open button slots at x72–136 and x224–288. -->
      <path d="M68 76Q70 68 79 68H129Q138 68 140 77L126 94Q120 100 120 107H91Q91 99 84 93Z" fill="${WOOD}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M78 75Q103 70 130 75" fill="none" stroke="${WOOD_LIGHT}" stroke-width="3" stroke-linecap="round"/>
      <path d="M220 77Q222 68 231 68H281Q290 68 292 76L276 93Q269 99 269 107H240Q240 100 234 94Z" fill="${WOOD}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M230 75Q255 70 282 75" fill="none" stroke="${WOOD_LIGHT}" stroke-width="3" stroke-linecap="round"/>

      <!-- Broad rounded shell; the centre is a blank paper window for live output. -->
      <path d="M32 91Q32 72 53 72H307Q328 72 328 93V214Q328 238 304 238H56Q32 238 32 214Z" fill="${SKY}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M46 91Q46 82 58 82H302" fill="none" stroke="${SKY_LIGHT}" stroke-width="3" stroke-linecap="round"/>
      <path d="M40 218Q180 226 320 218V224Q180 233 40 224Z" fill="${SKY_DARK}"/>

      <!-- Funnel throats stop at the window edge, like little poured channels. -->
      <path d="M92 91Q99 99 104 105M268 91Q261 99 256 105" fill="none" stroke="${WOOD_DARK}" stroke-width="6" stroke-linecap="round"/>
      <path d="M93 91Q100 98 105 103M267 91Q260 98 255 103" fill="none" stroke="${WOOD_LIGHT}" stroke-width="2.4" stroke-linecap="round"/>

      <rect x="100" y="100" width="160" height="90" rx="18" fill="${PAPER}" stroke="${INK}" stroke-width="4"/>
      <path d="M111 108Q180 102 249 108" fill="none" stroke="${PAPER_LIGHT}" stroke-width="3" stroke-linecap="round"/>
      <path d="M108 180Q180 185 252 180" fill="none" stroke="${PAPER_EDGE}" stroke-width="2.4" stroke-linecap="round"/>

      <!-- Small quiet speaker grille in its own lower-left cheek. -->
      <path d="M68 199Q68 194 74 194H95Q101 194 101 200V223Q101 229 95 229H74Q68 229 68 223Z" fill="${SKY_DARK}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M76 202V221M83 201V222M90 202V221" fill="none" stroke="${SKY_LIGHT}" stroke-width="2.4" stroke-linecap="round"/>

      <!-- Gear is a decorative toy detail, below the clear output window. -->
      <g class="lab-gear" transform="translate(180 216)">
        <path d="M-5-28H5L8-20L15-17L23-21L29-12L24-5L26 2L34 7L31 17L22 18L17 24L18 33L8 36L3 28H-4L-10 36L-20 32L-18 23L-24 17L-33 16L-35 6L-27 1L-27-6L-34-12L-29-22L-20-19L-14-23L-13-32L-3-35Z" fill="${WOOD}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
        <circle r="13" fill="${WOOD_LIGHT}" stroke="${INK}" stroke-width="2.4"/>
        <circle r="5" fill="${WOOD_DARK}"/>
      </g>

      <!-- Hand-built plank base, broad and low. -->
      <path d="M40 239Q40 233 48 233H312Q320 233 320 241V262Q320 270 312 270H48Q40 270 40 262Z" fill="${WOOD}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M49 240Q180 234 311 240V249Q180 244 49 249Z" fill="${WOOD_LIGHT}"/>
      <path d="M45 258Q180 264 315 258V262Q315 267 310 267H50Q45 267 45 262Z" fill="${WOOD_DARK}"/>
      <path d="M53 258Q94 254 135 258M224 258Q266 254 307 258" fill="none" stroke="${WOOD_DARK}" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="57" cy="253" r="3" fill="${WOOD_LIGHT}" stroke="${INK}" stroke-width="2.4"/>
      <circle cx="303" cy="253" r="3" fill="${WOOD_LIGHT}" stroke="${INK}" stroke-width="2.4"/>

      <!-- Crank, a fixed coral ornament rather than an interaction target. -->
      <path class="lab-crank" d="M304 213H316V193" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M304 213H316V193" fill="none" stroke="${WOOD_LIGHT}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="316" cy="185" r="10" fill="${CORAL}" stroke="${INK}" stroke-width="3"/>
      <path d="M311 182Q315 177 320 181" fill="none" stroke="${CORAL_LIGHT}" stroke-width="2.4" stroke-linecap="round"/>

      <!-- Rounded joinery and small rivets make the shell feel assembled. -->
      <circle cx="68" cy="111" r="3" fill="${WOOD_LIGHT}" stroke="${INK}" stroke-width="2.4"/>
      <circle cx="292" cy="111" r="3" fill="${WOOD_LIGHT}" stroke="${INK}" stroke-width="2.4"/>
      <circle cx="68" cy="226" r="3" fill="${WOOD_LIGHT}" stroke="${INK}" stroke-width="2.4"/>
      <circle cx="292" cy="226" r="3" fill="${WOOD_LIGHT}" stroke="${INK}" stroke-width="2.4"/>
      <path d="M111 89Q180 83 249 89" fill="none" stroke="${SKY_LIGHT}" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>
    </svg>`;
  }

  function classic() {
    return `<svg class="lab-machine" viewBox="0 0 320 210" aria-hidden="true">
      <ellipse cx="160" cy="202" rx="130" ry="7" fill="#2f5c46" opacity=".18"/>
      <path d="M40 70H280V180Q280 196 264 196H56Q40 196 40 180Z" fill="#62cdf4" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M52 82H268V120H52Z" fill="#ccfbef" stroke="${INK}" stroke-width="3"/>
      <path d="M70 70L100 30H140L150 70M250 70L220 30H180L170 70" fill="#f3c955" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <g class="lab-gear" transform="translate(160 158)"><circle r="20" fill="#c69434" stroke="${INK}" stroke-width="3"/>${[0, 45, 90, 135].map((a) => `<path d="M-4-26H4V26H-4Z" fill="#c69434" stroke="${INK}" stroke-width="2.4" transform="rotate(${a})"/>`).join("")}<circle r="8" fill="#ffe49a" stroke="${INK}" stroke-width="2.4"/></g>
      <path d="M100 196V206M220 196V206" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
      <path d="M52 76H268" stroke="#96ecff" stroke-width="3" stroke-linecap="round"/>
      <circle cx="90" cy="158" r="22" fill="#3a8fc4" stroke="${INK}" stroke-width="3"/>${[[-8,-8],[0,-8],[8,-8],[-8,0],[0,0],[8,0],[-8,8],[0,8],[8,8]].map(([x, y]) => `<circle cx="${90 + x}" cy="${158 + y}" r="2.4" fill="#ccfbef"/>`).join("")}
      <circle cx="232" cy="148" r="8" fill="#ffe49a" stroke="${INK}" stroke-width="2.4"/><circle cx="232" cy="172" r="8" fill="#7fce54" stroke="${INK}" stroke-width="2.4"/><circle cx="229" cy="145" r="2.4" fill="#fffdf7"/>
      ${[[50, 132], [270, 132], [50, 186], [270, 186]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#3a8fc4"/>`).join("")}
      <path d="M280 150H296V110" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M280 150H296V110" fill="none" stroke="#c9bda4" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="296" cy="104" r="9" fill="#ee806f" stroke="${INK}" stroke-width="3"/><circle cx="293" cy="101" r="2.4" fill="#fffdf7"/>
    </svg>`;
  }

  ns.SoundLabArt = { machine, classic };
})(window.MiftahGame || (window.MiftahGame = {}));
