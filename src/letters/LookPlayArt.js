// Fixed-proportion garden props for Look and Find games.
(function (ns) {
  const INK = "#4a3620";
  const PAPER = "#fffaf0";
  const PAPER_LIGHT = "#fffdf7";
  const PAPER_EDGE = "#c9bda4";
  const WOOD = "#c69434";
  const WOOD_LIGHT = "#f3c955";
  const WOOD_DARK = "#70501b";
  const SKY = "#ccfbef";
  const GREEN = "#7fce54";
  const GREEN_DARK = "#2f5c46";
  const CORAL = "#ee806f";

  function bus(color = CORAL) {
    return `<svg viewBox="0 0 160 110" aria-hidden="true" focusable="false">
      <ellipse cx="80" cy="105" rx="70" ry="4" fill="${GREEN_DARK}" opacity=".16"/>
      <path d="M36 13V8M121 13V8" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
      <path d="M28 8Q28 4 33 4H124Q129 4 129 8V12H28Z" fill="${WOOD}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M7 28Q7 13 22 13H132Q151 13 153 30L156 75Q156 85 146 85H17Q7 85 7 75Z" fill="${color}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <rect x="20" y="18" width="52" height="45" rx="8" fill="${SKY}" stroke="${INK}" stroke-width="4"/>
      <rect x="100" y="18" width="46" height="45" rx="8" fill="${SKY}" stroke="${INK}" stroke-width="4"/>
      <path d="M12 69H154" fill="none" stroke="${PAPER}" stroke-width="6" stroke-linecap="round"/>
      <path d="M14 77Q80 82 150 77V82Q80 87 14 82Z" fill="${WOOD_DARK}" opacity=".2"/>
      <path d="M16 77H147" fill="none" stroke="${WOOD_DARK}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M21 88Q21 72 39 72Q57 72 57 88M103 88Q103 72 121 72Q139 72 139 88" fill="none" stroke="${WOOD_DARK}" stroke-width="4" stroke-linecap="round"/>
      <circle cx="39" cy="91" r="12" fill="${INK}"/>
      <circle cx="39" cy="91" r="6" fill="${WOOD_LIGHT}"/>
      <circle cx="121" cy="91" r="12" fill="${INK}"/>
      <circle cx="121" cy="91" r="6" fill="${WOOD_LIGHT}"/>
      <path d="M8 67H16M148 67H156" fill="none" stroke="${PAPER_EDGE}" stroke-width="6" stroke-linecap="round"/>
      <circle cx="151" cy="57" r="4" fill="${WOOD_LIGHT}" stroke="${INK}" stroke-width="2.4"/>
      <rect x="7" y="56" width="7" height="9" rx="3" fill="${CORAL}" stroke="${INK}" stroke-width="2.4"/>
    </svg>`;
  }

  function busStop() {
    return `<svg viewBox="0 0 240 160" aria-hidden="true" focusable="false">
      <ellipse cx="133" cy="155" rx="99" ry="3" fill="${GREEN_DARK}" opacity=".14"/>
      <path d="M35 77V139" fill="none" stroke="${WOOD_DARK}" stroke-width="8" stroke-linecap="round"/>
      <path d="M16 17Q16 11 23 11H55Q62 11 62 18V75H16Z" fill="${WOOD}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M22 20H56V68H22Z" fill="${PAPER}"/>
      <path d="M26 35Q26 29 32 29H48Q54 29 54 35V49H26Z" fill="${SKY}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M28 42H52V49H28Z" fill="${CORAL}"/>
      <circle cx="33" cy="51" r="3" fill="${INK}"/>
      <circle cx="47" cy="51" r="3" fill="${INK}"/>
      <path d="M31 23H47" fill="none" stroke="${WOOD_LIGHT}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M24 139H48" fill="none" stroke="${WOOD_DARK}" stroke-width="6" stroke-linecap="round"/>
      <path d="M18 146Q18 141 24 141H216Q222 141 222 147V154H18Z" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M25 144H215" fill="none" stroke="${WOOD_LIGHT}" stroke-width="3" stroke-linecap="round"/>
      <path d="M42 154L38 159M198 154L202 159" fill="none" stroke="${WOOD_DARK}" stroke-width="4" stroke-linecap="round"/>
    </svg>`;
  }

  function stone() {
    return `<svg class="lk-stone-art" viewBox="0 0 160 150" aria-hidden="true" focusable="false">
      <ellipse cx="80" cy="144" rx="60" ry="4" fill="${GREEN_DARK}" opacity=".14"/>
      <path d="M24 8Q80 2 135 9Q153 11 153 29V119Q151 141 132 142H28Q7 140 7 121V29Q8 12 24 8Z" fill="${PAPER_EDGE}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M25 16Q80 10 134 17Q146 19 146 32V117Q145 128 132 129H28Q15 128 15 116V32Q15 21 25 16Z" fill="${PAPER}"/>
      <path d="M25 14Q80 8 134 15" fill="none" stroke="${PAPER_LIGHT}" stroke-width="3" stroke-linecap="round"/>
      <path d="M19 128Q80 136 141 128" fill="none" stroke="${WOOD_DARK}" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>
    </svg>`;
  }

  function observe(mode) {
    const find = mode === "find";
    const arrow = find
      ? `<path d="M91 39Q94 18 77 16Q66 15 64 27" fill="none" stroke="${WOOD_DARK}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M65 19L63 28L72 26" fill="none" stroke="${WOOD_DARK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`
      : `<path d="M68 35H91M83 27L92 35L83 43" fill="none" stroke="${WOOD_DARK}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
    return `<svg viewBox="0 0 100 70" aria-hidden="true" focusable="false">
      <path d="M5 35Q31 5 55 35Q31 65 5 35Z" fill="${PAPER_LIGHT}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="31" cy="35" r="13" fill="${GREEN}" stroke="${GREEN_DARK}" stroke-width="3"/>
      <circle cx="31" cy="35" r="6" fill="${INK}"/>
      <circle cx="27" cy="30" r="2.4" fill="${PAPER_LIGHT}"/>
      ${arrow}
    </svg>`;
  }

  ns.LookPlayArt = { bus, busStop, stone, observe };
})(window.MiftahGame || (window.MiftahGame = {}));
