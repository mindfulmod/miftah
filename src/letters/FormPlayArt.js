// Fixed-aspect paper-and-timber props for word, costume and train play.
(function (ns) {
  const INK = "#4a3620";
  const PAPER = "#fffaf0";
  const PAPER_LIGHT = "#fffdf7";
  const PAPER_SHADE = "#e5dcc8";
  const WOOD = "#c69434";
  const WOOD_LIGHT = "#f3c955";
  const WOOD_DARK = "#70501b";
  const GREEN = "#7fce54";
  const LEAF = "#b7e779";
  const LEAF_DARK = "#4e9677";
  const GREEN_DARK = "#2f5c46";
  const CORAL = "#ee806f";
  const CORAL_LIGHT = "#ffa798";
  const CORAL_DARK = "#c25a49";

  function wordStand() {
    return `<svg viewBox="0 0 420 160" aria-hidden="true" focusable="false">
      <ellipse cx="210" cy="155" rx="176" ry="4" fill="${GREEN_DARK}" opacity=".16"/>
      <rect x="12" y="8" width="396" height="122" rx="20" fill="${WOOD}" stroke="${INK}" stroke-width="4"/>
      <rect x="32" y="20" width="356" height="105" rx="16" fill="${PAPER}"/>
      <path d="M42 15Q210 10 378 15" fill="none" stroke="${WOOD_LIGHT}" stroke-width="3" stroke-linecap="round"/>
      <path d="M12 128Q210 134 408 128V141Q210 147 12 141Z" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M20 130Q210 136 400 130" fill="none" stroke="${WOOD_LIGHT}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M52 143L46 155M368 143L374 155" fill="none" stroke="${WOOD_DARK}" stroke-width="6" stroke-linecap="round"/>
      <path d="M39 155H81M339 155H381" fill="none" stroke="${WOOD}" stroke-width="6" stroke-linecap="round"/>
      <circle cx="22" cy="19" r="2.4" fill="${WOOD_LIGHT}"/>
      <circle cx="398" cy="19" r="2.4" fill="${WOOD_LIGHT}"/>
    </svg>`;
  }

  function costumeRail() {
    return `<svg viewBox="0 0 360 150" aria-hidden="true" focusable="false">
      <ellipse cx="180" cy="143" rx="146" ry="4" fill="${GREEN_DARK}" opacity=".14"/>
      <rect x="28" y="20" width="16" height="112" rx="8" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="4"/>
      <rect x="316" y="20" width="16" height="112" rx="8" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="4"/>
      <rect x="25" y="10" width="310" height="20" rx="10" fill="${WOOD}" stroke="${INK}" stroke-width="4"/>
      <path d="M42 17Q180 13 318 17" fill="none" stroke="${WOOD_LIGHT}" stroke-width="3" stroke-linecap="round"/>
      <path d="M20 128Q36 122 52 128L48 138H24Z M308 128Q324 122 340 128L336 138H312Z" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M48 30H312" fill="none" stroke="${WOOD_DARK}" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="36" cy="30" r="5" fill="${WOOD_LIGHT}" stroke="${INK}" stroke-width="2.4"/>
      <circle cx="324" cy="30" r="5" fill="${WOOD_LIGHT}" stroke="${INK}" stroke-width="2.4"/>
      <path d="M66 136Q180 140 294 136" fill="none" stroke="${WOOD}" stroke-width="2.4" stroke-linecap="round"/>
    </svg>`;
  }

  function trainEngine() {
    return `<svg viewBox="0 0 90 100" aria-hidden="true" focusable="false">
      <ellipse cx="45" cy="96" rx="39" ry="3" fill="${GREEN_DARK}" opacity=".16"/>
      <circle cx="24" cy="82" r="12" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="3"/>
      <circle cx="58" cy="82" r="12" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="3"/>
      <circle cx="24" cy="82" r="6" fill="${WOOD_LIGHT}" stroke="${INK}" stroke-width="2.4"/>
      <circle cx="58" cy="82" r="6" fill="${WOOD_LIGHT}" stroke="${INK}" stroke-width="2.4"/>
      <path d="M8 67Q8 61 14 61H75Q82 61 84 68L87 76Q87 81 82 81H11Q6 81 6 76Z" fill="${CORAL}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M9 72H83" fill="none" stroke="${CORAL_DARK}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M12 58V34Q12 27 19 27H34V62H12Z" fill="${CORAL}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M17 34H29V48H17Z" fill="${PAPER_LIGHT}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M9 25Q9 20 15 20H36Q41 20 41 25V30H9Z" fill="${WOOD}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M55 62V49Q55 38 67 38Q78 38 80 51V67Z" fill="${CORAL}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M67 39V23Q67 19 71 19H77Q81 19 81 23V40Z" fill="${WOOD}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M64 20Q64 16 69 16H79Q84 16 84 20V24H64Z" fill="${WOOD_LIGHT}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M49 55Q65 50 80 55" fill="none" stroke="${CORAL_LIGHT}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M76 58Q84 57 87 62V68H78Z" fill="${WOOD_LIGHT}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M9 79H84" fill="none" stroke="${WOOD_DARK}" stroke-width="4" stroke-linecap="round"/>
    </svg>`;
  }

  function trainCar(left = true, right = true) {
    const couplings = `${left ? `<path d="M9 70H2Q0 70 0 73V77Q0 80 3 80H12" fill="none" stroke="${WOOD_DARK}" stroke-width="4" stroke-linecap="round"/><circle cx="4" cy="75" r="3" fill="${WOOD_LIGHT}" stroke="${INK}" stroke-width="1.6"/>` : ""}${right ? `<path d="M108 70H117Q120 70 120 73V77Q120 80 117 80H108" fill="none" stroke="${WOOD_DARK}" stroke-width="4" stroke-linecap="round"/><circle cx="116" cy="75" r="3" fill="${WOOD_LIGHT}" stroke="${INK}" stroke-width="1.6"/>` : ""}`;
    return `<svg viewBox="0 0 120 100" aria-hidden="true" focusable="false">
      <ellipse cx="60" cy="95" rx="49" ry="3" fill="${GREEN_DARK}" opacity=".15"/>
      <circle cx="36" cy="82" r="10" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="3"/>
      <circle cx="84" cy="82" r="10" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="3"/>
      <circle cx="36" cy="82" r="5" fill="${WOOD_LIGHT}"/>
      <circle cx="84" cy="82" r="5" fill="${WOOD_LIGHT}"/>
      <path d="M12 17Q12 8 21 8H99Q108 8 108 17V74Q108 80 101 80H19Q12 80 12 74Z" fill="${WOOD}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <rect x="20" y="15" width="80" height="50" rx="9" fill="${PAPER}"/>
      <path d="M27 11Q60 7 93 11" fill="none" stroke="${WOOD_LIGHT}" stroke-width="3" stroke-linecap="round"/>
      <path d="M18 70Q60 75 102 70" fill="none" stroke="${WOOD_DARK}" stroke-width="2.4" stroke-linecap="round"/>
      ${couplings}
    </svg>`;
  }

  function leaf() {
    return `<svg viewBox="0 0 280 150" aria-hidden="true" focusable="false">
      <ellipse cx="140" cy="141" rx="112" ry="4" fill="${GREEN_DARK}" opacity=".15"/>
      <path d="M12 75Q35 25 113 17Q208 8 268 74Q211 139 116 132Q38 126 12 75Z" fill="${GREEN}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <rect x="37" y="39" width="206" height="72" rx="18" fill="${PAPER}" stroke="${LEAF_DARK}" stroke-width="2.4"/>
      <path d="M22 75Q29 59 40 47" fill="none" stroke="${LEAF}" stroke-width="3" stroke-linecap="round"/>
      <path d="M17 76Q12 81 17 86" fill="none" stroke="${LEAF_DARK}" stroke-width="2.4" stroke-linecap="round"/>
    </svg>`;
  }

  function branch() {
    return `<svg viewBox="0 0 180 140" aria-hidden="true" focusable="false">
      <ellipse cx="90" cy="134" rx="72" ry="3" fill="${GREEN_DARK}" opacity=".14"/>
      <path d="M8 53Q45 31 82 49Q122 69 172 41" fill="none" stroke="${WOOD}" stroke-width="8" stroke-linecap="round"/>
      <path d="M35 43Q31 27 22 18M139 54Q145 34 160 28M73 44Q78 28 73 15" fill="none" stroke="${WOOD_DARK}" stroke-width="4" stroke-linecap="round"/>
      <path d="M15 20Q23 12 31 19Q29 28 19 28Z M66 16Q74 8 82 15Q80 24 70 24Z M154 27Q162 18 170 25Q168 34 158 35Z" fill="${LEAF}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M24 22L29 19M75 18L80 15M162 29L167 26" fill="none" stroke="${LEAF_DARK}" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M44 40V70M136 61V70" fill="none" stroke="${WOOD_DARK}" stroke-width="2.4" stroke-linecap="round"/>
      <rect x="24" y="70" width="132" height="55" rx="14" fill="${PAPER}" stroke="${INK}" stroke-width="4"/>
    </svg>`;
  }

  ns.FormPlayArt = { wordStand, costumeRail, trainEngine, trainCar, leaf, branch };
})(window.MiftahGame || (window.MiftahGame = {}));
