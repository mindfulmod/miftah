// Quiet garden scenery for Living Books. Page friends remain the focal point.
(function (ns) {
  const INK = "#4a3620";
  const PAPER_LIGHT = "#fffdf7";
  const SKY_DAY = "#ccfbef";
  const SKY_NIGHT = "#6064a0";
  const LEAF_LIGHT = "#b7e779";
  const LEAF = "#7fce54";
  const LEAF_TEAL = "#4e9677";
  const LEAF_DEEP = "#2f5c46";
  const WOOD_DARK = "#70501b";
  const CORAL = "#ffa798";
  const GOLD = "#ffe49a";

  function scene(night = false) {
    const sky = night ? SKY_NIGHT : SKY_DAY;
    const far = night ? LEAF : LEAF_LIGHT;
    const middle = night ? LEAF_TEAL : LEAF;
    const near = night ? LEAF_DEEP : LEAF_TEAL;
    return `<svg class="lb-scene" viewBox="0 0 300 200" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M0 0H300V200H0Z" fill="${sky}"/>
      <path d="M0 130Q41 111 83 120Q122 131 158 119Q207 102 245 119Q275 130 300 116V200H0Z" fill="${far}"/>
      <path d="M0 151Q39 130 79 142Q120 154 161 139Q209 121 247 140Q276 154 300 139V200H0Z" fill="${middle}"/>
      <path d="M0 173Q52 157 102 168Q155 180 206 165Q256 151 300 166V200H0Z" fill="${near}"/>
    </svg>`;
  }

  function sideTree(x, y, scale, night) {
    const leaves = night
      ? [LEAF, LEAF_TEAL, LEAF_DEEP]
      : [LEAF_LIGHT, LEAF, LEAF_TEAL];
    if (ns.DetailKit?.tree) {
      return `<g transform="translate(${x} ${y}) scale(${scale})">${ns.DetailKit.tree({ kind: "round", seed: x + 11, leaf: leaves })}</g>`;
    }
    // A small self-contained fallback keeps the scene readable if DetailKit
    // hasn't loaded yet: forked trunk, overlapping leaf clumps and veins.
    return `<g transform="translate(${x} ${y}) scale(${scale})">
      <ellipse cx="0" cy="2" rx="37" ry="7" fill="${LEAF_DEEP}" opacity=".18"/>
      <path d="M-6 0Q-3-18-5-35L-15-50M-5-34L8-50M-5-35L-4-58" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M-6 0Q-3-18-5-35L-15-50M-5-34L8-50M-5-35L-4-58" fill="none" stroke="${WOOD_DARK}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="-22" cy="-65" r="23" fill="${LEAF_TEAL}" stroke="${INK}" stroke-width="4"/>
      <circle cx="0" cy="-78" r="28" fill="${LEAF}" stroke="${INK}" stroke-width="4"/>
      <circle cx="23" cy="-63" r="22" fill="${LEAF_TEAL}" stroke="${INK}" stroke-width="4"/>
      <circle cx="-4" cy="-96" r="18" fill="${LEAF_LIGHT}"/>
      <path d="M-31-67q6-8 13-7M-8-85q7-8 14-7M14-61q6-7 12-6" fill="none" stroke="${LEAF_DEEP}" stroke-width="2.4" stroke-linecap="round"/>
    </g>`;
  }

  function cloud(x, y, scale) {
    return `<g transform="translate(${x} ${y}) scale(${scale})">
      <path d="M-32 10Q-44 10-40-2Q-40-14-25-14Q-20-29-4-28Q12-32 20-18Q36-22 41-9Q51-7 47 5Q46 12 36 12H-31Q-34 12-32 10Z" fill="#fffaf0"/>
      <path d="M-34 7Q0 15 42 7Q43 11 36 12H-29Q-34 12-34 7Z" fill="#ccfbef"/>
    </g>`;
  }

  function tuft(x, y, night) {
    const color = night ? LEAF : LEAF_TEAL;
    return `<path d="M${x - 7} ${y}Q${x - 8} ${y - 9} ${x - 3} ${y - 12}M${x} ${y}Q${x} ${y - 12} ${x + 4} ${y - 15}M${x + 7} ${y}Q${x + 7} ${y - 8} ${x + 11} ${y - 10}" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round"/>`;
  }

  function flower(x, y, color) {
    return `${[0, 72, 144, 216, 288].map((angle) => `<circle cx="${x}" cy="${y - 3}" r="3.2" fill="${color}" transform="rotate(${angle} ${x} ${y})"/>`).join("")}<circle cx="${x}" cy="${y}" r="2.2" fill="${GOLD}"/>`;
  }

  function stars() {
    return [[31, 31, 1], [65, 55, .7], [269, 33, .8], [239, 69, .65], [28, 85, .6], [274, 91, .55]].map(([x, y, size]) =>
      `<path transform="translate(${x} ${y}) scale(${size})" d="M0-5Q1-1 5 0Q1 1 0 5Q-1 1-5 0Q-1-1 0-5Z" fill="${PAPER_LIGHT}"/>`
    ).join("");
  }

  function props(night = false) {
    const blooms = [[47, 169, CORAL], [254, 175, GOLD]];
    return `<svg class="lb-props" viewBox="0 0 300 200" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">
      ${night ? stars() : `${cloud(48, 35, .48)}${cloud(260, 49, .34)}`}
      ${sideTree(34, 188, .34, night)}
      ${sideTree(266, 188, .38, night)}
      ${tuft(67, 183, night)}${tuft(231, 187, night)}
      ${blooms.map(([x, y, color]) => flower(x, y, color)).join("")}
    </svg>`;
  }

  function bush() {
    return `<svg class="lb-bush-art" viewBox="0 0 160 130" aria-hidden="true" focusable="false">
      <ellipse cx="80" cy="125" rx="63" ry="4" fill="${LEAF_DEEP}" opacity=".2"/>
      <path d="M16 122Q9 115 12 99Q5 80 19 68Q17 49 35 43Q39 22 57 27Q68 8 84 24Q103 9 114 31Q137 27 139 51Q157 61 147 80Q158 99 145 115Q140 123 130 124Z" fill="${LEAF}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>

      <!-- A little woody fork peeks between the soft leaf clumps. -->
      <path d="M75 111Q79 92 77 75L63 60M78 78L95 60M77 90L61 83" fill="none" stroke="${WOOD_DARK}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M76 108Q80 91 78 77L64 62M79 79L94 62" fill="none" stroke="#c69434" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>

      <!-- Raised leaf pads give the flap a soft, built, touchable silhouette. -->
      <path d="M24 63Q18 48 32 39Q43 31 54 41Q62 50 54 64Q42 73 30 68Z" fill="${LEAF_TEAL}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M47 45Q43 29 59 20Q72 14 82 27Q89 39 77 50Q61 57 47 45Z" fill="${LEAF_LIGHT}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M78 43Q75 26 91 20Q106 16 113 30Q118 43 105 52Q90 57 78 43Z" fill="${LEAF_TEAL}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M106 58Q103 43 118 36Q132 34 138 47Q141 61 128 68Q115 70 106 58Z" fill="${LEAF_LIGHT}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>

      <path d="M26 54Q37 45 49 47M55 39Q65 29 76 31M87 39Q97 30 107 33M115 54Q124 46 133 49" fill="none" stroke="${LEAF_DEEP}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M25 92Q34 82 45 86M108 94Q119 82 132 87" fill="none" stroke="${LEAF_TEAL}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M22 112Q80 118 138 111" fill="none" stroke="${LEAF_LIGHT}" stroke-width="3" stroke-linecap="round"/>
    </svg>`;
  }

  ns.LivingBookArt = { scene, props, bush };
})(window.MiftahGame || (window.MiftahGame = {}));
