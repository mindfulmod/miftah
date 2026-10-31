// Flat, friendly listening props for Ears First.
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

  function drum() {
    return `<svg viewBox="0 0 120 100" aria-hidden="true" focusable="false">
      <ellipse cx="60" cy="86" rx="49" ry="4" fill="${GREEN_DARK}" opacity=".16"/>
      <rect x="19" y="72" width="20" height="12" rx="6" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="3"/>
      <rect x="81" y="72" width="20" height="12" rx="6" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="3"/>
      <path d="M14 30V69Q60 91 106 69V30Z" fill="${CORAL}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M20 39L38 76M39 37L55 82M60 38L72 80M81 37L96 74" fill="none" stroke="${CORAL_DARK}" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="60" cy="30" rx="47" ry="22" fill="${WOOD}" stroke="${INK}" stroke-width="4"/>
      <ellipse cx="60" cy="28" rx="38" ry="17" fill="${PAPER}" stroke="${INK}" stroke-width="2.4"/>
      <path d="M32 20Q60 10 82 19" fill="none" stroke="${PAPER_LIGHT}" stroke-width="3" stroke-linecap="round"/>
    </svg>`;
  }

  function listeningStand() {
    return `<svg viewBox="0 0 260 170" aria-hidden="true" focusable="false">
      <ellipse cx="130" cy="164" rx="106" ry="3" fill="${GREEN_DARK}" opacity=".15"/>
      <path d="M32 24Q32 14 42 14H218Q228 14 228 24V35H32Z" fill="${WOOD}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M46 20Q130 15 214 20" fill="none" stroke="${WOOD_LIGHT}" stroke-width="3" stroke-linecap="round"/>
      <rect x="38" y="30" width="16" height="108" rx="8" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="4"/>
      <rect x="206" y="30" width="16" height="108" rx="8" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="4"/>
      <path d="M28 135Q130 126 232 135V151Q130 160 28 151Z" fill="${WOOD}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <rect x="20" y="149" width="220" height="14" rx="7" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="4"/>
    </svg>`;
  }

  function soundPod() {
    return `<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <rect x="6" y="6" width="88" height="88" rx="24" fill="${PAPER}" stroke="${INK}" stroke-width="4"/>
      <path d="M22 12Q50 8 76 12" fill="none" stroke="${PAPER_LIGHT}" stroke-width="3" stroke-linecap="round"/>
      <path d="M14 81Q50 88 86 81" fill="none" stroke="${PAPER_SHADE}" stroke-width="2.4" stroke-linecap="round"/>
    </svg>`;
  }

  function speaker() {
    return `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path d="M8 19H16L27 10V38L16 29H8Z" fill="${GREEN}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M32 18Q40 24 32 30M35 12Q48 24 35 36" fill="none" stroke="${WOOD_DARK}" stroke-width="3" stroke-linecap="round"/>
      <path d="M12 21H16L23 16" fill="none" stroke="${LEAF}" stroke-width="2.4" stroke-linecap="round"/>
    </svg>`;
  }

  function replayAll() {
    return `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path d="M10 20A15 15 0 0 1 36 16L40 20M40 20V11M40 20H31" fill="none" stroke="${WOOD_DARK}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M38 28A15 15 0 0 1 12 32L8 28M8 28V37M8 28H17" fill="none" stroke="${WOOD_DARK}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="24" cy="24" r="7" fill="${PAPER}" stroke="${INK}" stroke-width="3"/>
      <path d="M21 21Q24 19 27 21" fill="none" stroke="${WOOD_LIGHT}" stroke-width="2.4" stroke-linecap="round"/>
    </svg>`;
  }

  function beatSeed() {
    return `<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path d="M8 18Q8 8 18 7Q26 7 25 16Q24 25 14 26Q8 25 8 18Z" fill="${WOOD_LIGHT}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M14 21Q17 14 23 11" fill="none" stroke="${WOOD_DARK}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M17 13Q15 7 10 7Q10 13 17 15" fill="${GREEN}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
    </svg>`;
  }

  ns.EarsPlayArt = { drum, listeningStand, soundPod, speaker, replayAll, beatSeed };
})(window.MiftahGame || (window.MiftahGame = {}));
