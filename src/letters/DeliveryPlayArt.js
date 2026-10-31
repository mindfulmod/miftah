// Flat paper packets and a small constructed seed garden for Letter Delivery.
(function (ns) {
  const INK = "#4a3620";
  const PAPER = "#fffaf0";
  const PAPER_LIGHT = "#fffdf7";
  const PAPER_SHADE = "#e5dcc8";
  const PAPER_EDGE = "#c9bda4";
  const WOOD = "#c69434";
  const WOOD_LIGHT = "#f3c955";
  const WOOD_DARK = "#70501b";
  const SOIL = "#70501b";
  const SOIL_DARK = "#2b1e12";
  const GROUND = "#2f5c46";
  const LEAF_LIGHT = "#b7e779";
  const LEAF = "#7fce54";
  const LEAF_DARK = "#4e9677";
  const CORAL = "#ee806f";
  const CORAL_DARK = "#c25a49";
  const GOLD = "#ffe49a";

  function packet(item, glyphMarkup = "") {
    return `<svg class="delivery-packet-art" viewBox="0 0 120 126" aria-hidden="true" focusable="false">
      <ellipse cx="60" cy="117" rx="42" ry="5" fill="${WOOD_DARK}" opacity=".18"/>
      <path d="M18 24Q18 16 27 14H93Q102 16 102 24V103Q102 112 93 114Q60 120 27 114Q18 112 18 103Z" fill="${PAPER}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M23 24Q60 39 97 24V43Q60 57 23 43Z" fill="${PAPER_SHADE}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M25 25Q60 39 95 25" fill="none" stroke="${PAPER_EDGE}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M29 20Q60 11 90 19" fill="none" stroke="${PAPER_LIGHT}" stroke-width="3" stroke-linecap="round"/>
      <path d="M25 103Q60 111 95 103" fill="none" stroke="${PAPER_EDGE}" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="25" cy="51" r="2.4" fill="${WOOD_LIGHT}"/>
      <circle cx="95" cy="51" r="2.4" fill="${WOOD_LIGHT}"/>
      <g transform="translate(60 76) scale(.76)">${glyphMarkup}</g>
    </svg>`;
  }

  function sprout(x, newest = false) {
    const top = x % 2 ? 104 : 111;
    return `<g class="${newest ? "delivery-new-plant" : "delivery-grown-plant"}" transform="translate(${x} 0)">
      <path d="M0 139Q-2 122 0 ${top}" fill="none" stroke="${LEAF_DARK}" stroke-width="4" stroke-linecap="round"/>
      <path d="M-1 ${top + 22}Q-25 ${top + 22}-22 ${top + 3}Q-8 ${top + 1} 0 ${top + 18}Q13 ${top - 4} 27 ${top + 4}Q28 ${top + 22} 2 ${top + 24}Z" fill="${LEAF_LIGHT}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M-16 ${top + 6}Q-8 ${top + 10}-2 ${top + 19}M8 ${top + 18}Q17 ${top + 9}24 ${top + 8}" fill="none" stroke="${LEAF_DARK}" stroke-width="2.4" stroke-linecap="round"/>
    </g>`;
  }

  function bloom(x, index, newest = false) {
    const color = [CORAL, GOLD, LEAF_LIGHT, CORAL][index];
    const center = [CORAL_DARK, WOOD_DARK, GOLD, CORAL_DARK][index];
    const y = index % 2 ? 102 : 109;
    return `<g class="${newest ? "delivery-new-plant" : "delivery-grown-plant"}" transform="translate(${x} 0)">
      <path d="M0 139Q-2 118 0 ${y + 13}" fill="none" stroke="${LEAF_DARK}" stroke-width="4" stroke-linecap="round"/>
      <path d="M-1 130Q-24 130-22 112Q-8 110 0 126Q14 105 27 113Q27 129 2 132Z" fill="${LEAF_LIGHT}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M-16 114Q-8 118-2 127M8 125Q17 116 24 115" fill="none" stroke="${LEAF_DARK}" stroke-width="2.4" stroke-linecap="round"/>
      ${[0, 60, 120, 180, 240, 300].map((angle) => `<ellipse cx="0" cy="${y - 12}" rx="6" ry="11" transform="rotate(${angle} 0 ${y})" fill="${color}" stroke="${INK}" stroke-width="2.4"/>`).join("")}
      <circle cx="0" cy="${y}" r="7" fill="${center}" stroke="${INK}" stroke-width="2.4"/>
      <path d="M-2 ${y - 4}Q0 ${y - 6} 2 ${y - 4}" fill="none" stroke="${PAPER_LIGHT}" stroke-width="2.4" stroke-linecap="round"/>
    </g>`;
  }

  function plant(x, index, newest, count) {
    return newest && count === 1 ? sprout(x, true) : bloom(x, index, newest);
  }

  function garden(item, revealed, growth = 0, glyphMarkup = "") {
    const count = Math.max(0, Math.min(4, Math.floor(Number(growth) || 0)));
    const xs = [49, 98, 147, 196];
    return `<svg class="delivery-garden-art" viewBox="0 0 310 250" aria-hidden="true" focusable="false">
      <ellipse cx="155" cy="230" rx="133" ry="9" fill="${GROUND}" opacity=".2"/>
      <path d="M8 222Q39 204 78 216Q122 227 162 213Q202 198 244 211Q276 215 302 224Q309 238 280 242Q199 250 155 244Q80 250 28 239Q2 237 8 222Z" fill="${LEAF_LIGHT}"/>
      <path d="M21 232Q49 220 88 231Q131 243 171 229Q218 213 259 229Q277 236 292 232Q289 240 268 241Q205 247 155 242Q77 248 29 238Z" fill="${LEAF}"/>

      <!-- Raised bed anatomy: feet, end grain, planked sides, corner posts and rim. -->
      <path d="M34 176L51 179L47 220L29 218ZM254 179L272 176L277 218L259 220Z" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M38 184L48 186L45 213L35 211ZM258 186L268 184L272 211L262 213Z" fill="${WOOD}"/>
      <path d="M20 126Q20 118 30 118H280Q290 118 290 128V200Q290 209 280 209H30Q20 209 20 200Z" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M28 168Q155 176 282 168V198Q282 202 277 202H33Q28 202 28 198Z" fill="${WOOD}"/>
      <path d="M39 178Q155 184 271 178M39 192Q155 198 271 192" fill="none" stroke="${WOOD_DARK}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M24 124Q155 114 286 124V143Q155 136 24 143Z" fill="${WOOD_LIGHT}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M31 127Q155 120 279 127V134Q155 129 31 134Z" fill="${WOOD}"/>
      <path d="M38 143Q155 149 272 143V170Q155 178 38 170Z" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M46 148Q155 154 264 148V166Q155 172 46 166Z" fill="${WOOD_DARK}"/>
      <path d="M55 153Q155 159 255 153M54 163Q155 169 256 163" fill="none" stroke="${WOOD}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M27 130V197M283 130V197" fill="none" stroke="${WOOD_LIGHT}" stroke-width="3" stroke-linecap="round"/>
      ${[[39, 130], [271, 130], [39, 193], [271, 193]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="${WOOD_LIGHT}" stroke="${INK}" stroke-width="2.4"/>`).join("")}

      <!-- Four distinct soil pockets stay visible as the planting grows. -->
      ${xs.map((x, index) => `<g class="delivery-soil-pocket"><ellipse cx="${x}" cy="139" rx="22" ry="8" fill="${INK}" opacity=".2"/><ellipse cx="${x}" cy="137" rx="18" ry="5" fill="${SOIL_DARK}"/><path d="M${x - 11} 136Q${x} 132 ${x + 11} 136" fill="none" stroke="${SOIL}" stroke-width="2.4" stroke-linecap="round"/>${index >= count ? `<path d="M${x - 4} 135Q${x} 130 ${x + 4} 135Q${x} 139 ${x - 4} 135Z" fill="${WOOD_LIGHT}"/>` : plant(x, index, index === count - 1, count)}</g>`).join("")}

      <!-- Small sign mounted to the bed's right side. The mark stays wordless. -->
      <g class="delivery-destination-mark" transform="translate(252 43) scale(1.3)">
        <path d="M0 36V81" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
        <path d="M0 36V80" fill="none" stroke="${WOOD}" stroke-width="3" stroke-linecap="round"/>
        <path d="M-33-21Q-33-28-26-28H26Q33-28 33-21V29Q33 36 26 36H-26Q-33 36-33 29Z" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
        <path d="M-28-21Q-28-24-24-24H24Q28-24 28-20V26Q28 31 24 31H-24Q-28 31-28 26Z" fill="${PAPER}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M-22-19Q0-23 22-19" fill="none" stroke="${PAPER_LIGHT}" stroke-width="2.4" stroke-linecap="round"/>
        ${revealed ? `<g transform="translate(0 3) scale(.65)">${glyphMarkup}</g>` : `<g fill="${WOOD_DARK}"><path d="M-16-7H-8L2-16V16L-8 8H-16Z"/><path d="M8-10Q18 0 8 10M16-17Q31 0 16 17" fill="none" stroke="${WOOD_DARK}" stroke-width="3" stroke-linecap="round"/></g>`}
        <circle cx="-22" cy="-19" r="2.4" fill="${WOOD_LIGHT}"/>
        <circle cx="22" cy="-19" r="2.4" fill="${WOOD_LIGHT}"/>
      </g>
      <path d="M6 224Q21 214 33 223M278 224Q291 215 304 222" fill="none" stroke="${LEAF_DARK}" stroke-width="2.4" stroke-linecap="round"/>
    </svg>`;
  }

  function icon(size = 86) {
    const dimension = Number.isFinite(Number(size)) ? Math.max(24, Math.min(240, Math.round(Number(size)))) : 86;
    const height = Math.round(dimension * .7);
    return `<svg class="letter-delivery-icon" width="${dimension}" height="${height}" viewBox="0 0 200 140" aria-hidden="true" focusable="false">
      <ellipse cx="110" cy="124" rx="80" ry="7" fill="${GROUND}" opacity=".18"/>
      <!-- A folded seed envelope sets off toward the planted bed. -->
      <g transform="translate(31 42) rotate(-8)">
        <path d="M0 8Q0 3 6 3H56Q62 3 62 9V48Q62 53 56 53H6Q0 53 0 48Z" fill="${PAPER}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
        <path d="M3 9L31 29L59 9V20L31 39L3 20Z" fill="${PAPER_SHADE}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M7 7Q31 2 54 7" fill="none" stroke="${PAPER_LIGHT}" stroke-width="2.4" stroke-linecap="round"/>
      </g>
      <path d="M91 67Q112 49 127 62" fill="none" stroke="${WOOD_DARK}" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 8"/>
      <path d="M79 82Q79 77 85 77H186Q192 77 192 83V111Q192 117 186 117H85Q79 117 79 111Z" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M85 98Q135 102 186 98V110Q186 112 183 112H88Q85 112 85 109Z" fill="${WOOD}"/>
      <path d="M83 81Q135 75 188 81V89Q135 85 83 89Z" fill="${WOOD_LIGHT}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M88 83Q135 79 183 83" fill="none" stroke="${WOOD}" stroke-width="2.4" stroke-linecap="round"/>
      ${[98, 123, 148, 173].map((x, i) => `<ellipse cx="${x}" cy="94" rx="8" ry="3" fill="${SOIL}"/><path d="M${x} 94V${i === 1 ? 65 : 71}" fill="none" stroke="${LEAF_DARK}" stroke-width="2.4" stroke-linecap="round"/><path d="M${x} 84Q${x - 8} 84 ${x - 7} 77Q${x - 1} 77 ${x} 83Q${x + 6} 74 ${x + 10} 78Q${x + 9} 85 ${x} 84Z" fill="${LEAF_LIGHT}"/>`).join("")}
      <path d="M89 117V126M181 117V126" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
      <path d="M95 122H175" stroke="${WOOD_LIGHT}" stroke-width="2.4" stroke-linecap="round"/>
    </svg>`;
  }

  ns.DeliveryPlayArt = { packet, garden, icon };
})(window.MiftahGame || (window.MiftahGame = {}));
