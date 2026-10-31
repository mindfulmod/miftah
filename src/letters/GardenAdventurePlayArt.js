// Constructed native garden scenes for Garden Adventure.
(function (ns) {
  const INK = "#4a3620";
  const PAPER = "#fffaf0";
  const PAPER_LIGHT = "#fffdf7";
  const PAPER_SHADE = "#e5dcc8";
  const WOOD = "#c69434";
  const WOOD_LIGHT = "#f3c955";
  const WOOD_DARK = "#70501b";
  const SKY = "#ccfbef";
  const SKY_LIGHT = "#96ecff";
  const FOLIAGE_LIGHT = "#b7e779";
  const FOLIAGE = "#7fce54";
  const FOLIAGE_DARK = "#4e9677";
  const GROUND = "#2f5c46";
  const CORAL = "#ee806f";
  const CORAL_LIGHT = "#ffa798";
  const CORAL_DARK = "#c25a49";
  const GOLD = "#ffe49a";
  const SKY_BLUE = "#62cdf4";
  const SKY_BLUE_DARK = "#3a8fc4";

  const INKS = new Set([
    "#4a3620", "#e8743c", "#ee806f", "#f3c955", "#4e9677", "#3a8fc4",
    "#b49fcf", "#c25a49", "#7fce54", "#62cdf4", "hsl(95 62% 54%)",
    "hsl(200 62% 54%)", "hsl(268 62% 54%)", "hsl(320 62% 54%)",
    "hsl(28 62% 54%)",
  ]);

  function cleanDrawing(value) {
    if (!value || !Array.isArray(value.strokes)) return null;
    let remaining = 1800;
    const strokes = value.strokes.slice(0, 60).filter((stroke) => stroke && typeof stroke === "object").map((stroke) => {
      const points = (Array.isArray(stroke.points) ? stroke.points : [])
        .slice(0, Math.min(200, remaining))
        .filter((point) => Array.isArray(point) && point.length === 2 && point.every(Number.isFinite))
        .map(([x, y]) => [Math.round(Math.max(0, Math.min(800, x))), Math.round(Math.max(0, Math.min(500, y)))]);
      remaining -= points.length;
      return { color: INKS.has(stroke.color) ? stroke.color : SKY_BLUE_DARK, points };
    }).filter((stroke) => stroke.points.length > 1);
    return strokes.length ? { letter: typeof value.letter === "string" && value.letter.length <= 8 ? value.letter : "", strokes } : null;
  }

  function ink(sign) {
    const drawing = cleanDrawing(sign);
    if (!drawing) return "";
    const points = drawing.strokes.flatMap((stroke) => stroke.points);
    const xs = points.map(([x]) => x), ys = points.map(([, y]) => y);
    const x = Math.min(...xs) - 28, y = Math.min(...ys) - 28;
    const width = Math.max(80, Math.max(...xs) - x + 28);
    const height = Math.max(80, Math.max(...ys) - y + 28);
    return `<svg x="-42" y="-29" width="84" height="52" viewBox="${x} ${y} ${width} ${height}" aria-hidden="true">${drawing.strokes.map((stroke) => `<path d="M${stroke.points.map((point) => point.join(",")).join("L")}" fill="none" stroke="${stroke.color}" stroke-width="2.4" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"/>`).join("")}</svg>`;
  }

  function petalFlower(x, y, color, center = GOLD, scale = 1) {
    return `<g transform="translate(${x} ${y}) scale(${scale})">${[0, 60, 120, 180, 240, 300].map((angle) => `<ellipse cx="0" cy="-13" rx="6" ry="12" transform="rotate(${angle})" fill="${color}" stroke="${INK}" stroke-width="2.4"/>`).join("")}<circle r="7" fill="${center}" stroke="${INK}" stroke-width="2.4"/></g>`;
  }

  function seedPacket(x, project, index) {
    const cx = 0;
    const motif = project === "bird"
      ? petalFlower(cx, 0, GOLD, WOOD_DARK, .38)
      : `<g transform="translate(${cx} 0) scale(.42)"><path d="M0 0C-22-27-27 7-4 8C-20 26 2 20 0 0M0 0C22-27 27 7 4 8C20 26-2 20 0 0" fill="${index % 2 ? CORAL : GOLD}" stroke="${INK}" stroke-width="3"/><path d="M0-6L-5-14M1-6L7-15" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/></g>`;
    return `<g transform="translate(${x} 219)">
      <path d="M-17-17H17L15 14Q0 18-15 14Z" fill="${PAPER}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M-17-17L0-9L17-17" fill="none" stroke="${WOOD_DARK}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M-12-12L0-7L12-12" fill="none" stroke="${WOOD_LIGHT}" stroke-width="2.4" stroke-linecap="round"/>
      ${motif}
    </g>`;
  }

  function sprout(x, project, index) {
    const top = project === "bird" ? 149 - (index % 2) * 7 : 166 - (index % 2) * 4;
    return `<g>
      <path d="M${x} 205Q${x - 1} ${top + 29} ${x} ${top}" fill="none" stroke="${FOLIAGE_DARK}" stroke-width="4" stroke-linecap="round"/>
      <path d="M${x} ${top + 25}Q${x - 26} ${top + 24} ${x - 21} ${top + 7}Q${x - 4} ${top + 6} ${x} ${top + 23}Q${x + 20} ${top - 1} ${x + 27} ${top + 14}Q${x + 25} ${top + 28} ${x} ${top + 25}Z" fill="${FOLIAGE_LIGHT}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M${x - 15} ${top + 13}Q${x - 8} ${top + 14} ${x - 2} ${top + 22}M${x + 7} ${top + 21}Q${x + 14} ${top + 17} ${x + 21} ${top + 15}" fill="none" stroke="${FOLIAGE_DARK}" stroke-width="2.4" stroke-linecap="round"/>
    </g>`;
  }

  function maturePlant(x, project, index) {
    if (project === "bird") {
      const headY = index === 1 ? 112 : 121;
      return `<g>
        <path d="M${x} 206Q${x - 4} 176 ${x} ${headY + 21}" fill="none" stroke="${FOLIAGE_DARK}" stroke-width="4" stroke-linecap="round"/>
        <path d="M${x - 2} 183Q${x - 35} 185 ${x - 31} 160Q${x - 10} 158 ${x - 2} 180Q${x + 12} 152 ${x + 32} 162Q${x + 30} 183 ${x + 2} 186Z" fill="${FOLIAGE_LIGHT}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M${x - 24} 164Q${x - 14} 167 ${x - 7} 179M${x + 8} 179Q${x + 18} 169 ${x + 27} 166" fill="none" stroke="${FOLIAGE_DARK}" stroke-width="2.4" stroke-linecap="round"/>
        ${[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => `<ellipse cx="${x}" cy="${headY - 13}" rx="7" ry="17" transform="rotate(${angle} ${x} ${headY})" fill="${GOLD}" stroke="${INK}" stroke-width="2.4"/>`).join("")}
        <circle cx="${x}" cy="${headY}" r="12" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="2.4"/>
        ${[0, 90, 180, 270].map((angle) => `<circle cx="${x}" cy="${headY}" r="2" transform="rotate(${angle} ${x} ${headY}) translate(0 -7)" fill="${WOOD_LIGHT}"/>`).join("")}
      </g>`;
    }
    const bloom = [CORAL, GOLD, "#b49fcf"][index % 3];
    const headY = index === 1 ? 146 : 156;
    return `<g>
      <path d="M${x} 206Q${x - 3} 184 ${x} ${headY + 13}" fill="none" stroke="${FOLIAGE_DARK}" stroke-width="4" stroke-linecap="round"/>
      <path d="M${x - 2} 188Q${x - 25} 188 ${x - 24} 171Q${x - 9} 167 ${x} 184Q${x + 15} 164 ${x + 27} 173Q${x + 26} 190 ${x + 2} 190Z" fill="${FOLIAGE_LIGHT}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M${x - 17} 174Q${x - 8} 178 ${x - 2} 185M${x + 9} 185Q${x + 17} 179 ${x + 23} 176" fill="none" stroke="${FOLIAGE_DARK}" stroke-width="2.4" stroke-linecap="round"/>
      ${petalFlower(x, headY, bloom, index === 1 ? GOLD : CORAL_DARK, 1.15)}
    </g>`;
  }

  function sign(signData) {
    return `<g transform="translate(459 151)">
      <path d="M0 30V73" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
      <path d="M0 30V72" fill="none" stroke="${WOOD}" stroke-width="3" stroke-linecap="round"/>
      <path d="M-49-29Q-49-38-40-38H40Q49-38 49-29V24Q49 32 41 32H-41Q-49 32-49 24Z" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M-43-29Q-43-32-39-32H39Q43-32 43-28V21Q43 26 38 26H-38Q-43 26-43 21Z" fill="${PAPER}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M-36-26Q0-31 36-26" fill="none" stroke="${PAPER_LIGHT}" stroke-width="2.4" stroke-linecap="round"/>
      ${signData ? ink(signData) : `<path d="M-21 11Q-15-10 1-12Q16-12 23 4Q9 11-2 7Q-9 20-21 11Z" fill="${FOLIAGE_LIGHT}"/><path d="M-20 13L12-15" fill="none" stroke="${FOLIAGE_DARK}" stroke-width="2.4" stroke-linecap="round"/>`}
      <circle cx="-36" cy="-25" r="2.4" fill="${WOOD_LIGHT}"/><circle cx="36" cy="-25" r="2.4" fill="${WOOD_LIGHT}"/>
    </g>`;
  }

  function perch() {
    return `<g transform="translate(-76 28)">
      <ellipse cx="176" cy="195" rx="58" ry="5" fill="${GROUND}" opacity=".16"/>
      <path d="M143 190Q150 166 147 138M206 190Q201 166 205 138" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
      <path d="M143 188Q150 165 147 139M206 188Q201 165 205 139" fill="none" stroke="${WOOD}" stroke-width="3" stroke-linecap="round"/>
      <path d="M129 140Q176 132 222 140Q221 151 210 152H140Q130 151 129 140Z" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M137 140Q178 135 214 140" fill="none" stroke="${WOOD_LIGHT}" stroke-width="3" stroke-linecap="round"/>
      <path d="M160 146Q172 141 184 146M191 146Q198 142 205 145" fill="none" stroke="${WOOD}" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="147" cy="139" r="3" fill="${WOOD_LIGHT}" stroke="${INK}" stroke-width="2.4"/>
      <circle cx="205" cy="139" r="3" fill="${WOOD_LIGHT}" stroke="${INK}" stroke-width="2.4"/>
    </g>`;
  }

  function gardenTree(project) {
    if (!ns.DetailKit?.tree) return "";
    const leaf = project === "bird"
      ? [FOLIAGE_LIGHT, FOLIAGE, FOLIAGE_DARK]
      : [FOLIAGE, FOLIAGE_DARK, GROUND];
    return `<g transform="translate(523 188) scale(.42)">${ns.DetailKit.tree({ kind: project === "bird" ? "blossom" : "round", seed: 14, leaf })}</g>`;
  }

  function scene(project, step = 0, signData = null) {
    const bird = project === "bird";
    const phase = Math.max(0, Math.min(3, Number.isInteger(step) ? step : 0));
    const plantXs = [207, 286, 365];
    const grown = plantXs.map((x, i) => phase >= 3 ? maturePlant(x, bird ? "bird" : "butterfly", i) : phase >= 1 ? sprout(x, bird ? "bird" : "butterfly", i) : "").join("");
    const packets = phase === 0 ? plantXs.map((x, i) => seedPacket(x, bird ? "bird" : "butterfly", i)).join("") : "";
    return `<svg class="ga-landscape" viewBox="0 0 560 320" aria-hidden="true" focusable="false">
      <path d="M0 0H560V320H0Z" fill="${SKY}"/>
      <circle cx="500" cy="52" r="25" fill="${GOLD}"/>
      <ellipse cx="500" cy="47" rx="8" ry="4" fill="${PAPER_LIGHT}" opacity=".65"/>
      <path d="M0 138Q69 85 141 123Q218 81 292 119Q382 75 451 115Q515 81 560 107V320H0Z" fill="${FOLIAGE_LIGHT}"/>
      <path d="M0 188Q76 148 150 172Q227 198 304 168Q405 128 468 167Q520 187 560 161V320H0Z" fill="${FOLIAGE}"/>
      <path d="M0 232Q89 205 159 224Q238 247 325 218Q414 190 492 218Q531 231 560 218V320H0Z" fill="${FOLIAGE_DARK}"/>
      <path d="M560 176Q468 165 472 219Q475 259 389 320H560Z" fill="${PAPER_SHADE}"/>
      <path d="M560 188Q488 178 491 219Q496 266 414 320H560Z" fill="${SKY_BLUE}"/>
      <path d="M514 208Q532 201 548 208M475 287Q495 277 517 283" fill="none" stroke="${SKY_LIGHT}" stroke-width="4" stroke-linecap="round"/>
      <path d="M49 62Q40 54 51 47Q54 32 70 36Q82 23 94 36Q111 33 115 48Q134 50 127 61Z" fill="${PAPER_LIGHT}"/>
      <path d="M0 268Q71 251 134 266Q197 280 252 263Q310 244 369 264Q432 284 488 264Q529 250 560 261V320H0Z" fill="${GROUND}" opacity=".16"/>

      <!-- The bird bed has its own weathered branch perch near the left edge. -->
      ${bird ? perch() : `<g fill="${FOLIAGE_DARK}"><path d="M74 215Q77 193 84 185Q93 203 87 218Z"/><path d="M482 220Q476 195 488 183Q499 205 491 220Z"/></g>`}
      ${gardenTree(bird ? "bird" : "butterfly")}

      <!-- Raised bed: legs, end caps, planked face, corner posts and a broad rim. -->
      <ellipse cx="278" cy="285" rx="162" ry="10" fill="${GROUND}" opacity=".2"/>
      <path d="M151 244L170 247L164 281L145 278ZM390 247L409 244L415 278L396 281Z" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M155 250L165 252L161 273L151 271ZM398 252L408 250L412 271L402 273Z" fill="${WOOD}"/>
      <path d="M127 214Q127 206 137 206H417Q427 206 427 216V265Q427 275 417 275H137Q127 275 127 265Z" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M136 244Q277 251 418 244V264Q418 267 414 267H140Q136 267 136 263Z" fill="${WOOD}"/>
      <path d="M143 249Q277 255 411 249M143 261Q277 266 411 261" fill="none" stroke="${WOOD_DARK}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M133 210Q278 199 421 210V225Q278 218 133 225Z" fill="${WOOD_LIGHT}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M139 212Q278 204 415 212V217Q278 211 139 217Z" fill="${WOOD}"/>
      <path d="M149 219Q278 225 405 219V241Q278 249 149 241Z" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M157 223Q278 229 397 223V238Q278 245 157 238Z" fill="${WOOD_DARK}"/>
      <path d="M169 228Q278 233 385 228M168 236Q278 241 386 236" fill="none" stroke="${WOOD}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M132 213V259M422 213V259" fill="none" stroke="${WOOD_LIGHT}" stroke-width="3" stroke-linecap="round"/>
      ${[[145, 215], [408, 215], [145, 258], [408, 258]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="${WOOD_LIGHT}" stroke="${INK}" stroke-width="2.4"/>`).join("")}

      <!-- Three planting pockets are visible in every chapter phase. -->
      ${plantXs.map((x) => `<ellipse cx="${x}" cy="216" rx="24" ry="7" fill="${INK}" opacity=".24"/><ellipse cx="${x}" cy="214" rx="20" ry="4" fill="${WOOD_DARK}"/>`).join("")}
      ${packets}${grown}

      <!-- The sign stands to the right of the bed at (459,151); its child mark is preserved. -->
      ${phase >= 2 ? sign(signData) : `<g transform="translate(459 151)"><path d="M0 30V73" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><path d="M0 30V72" fill="none" stroke="${WOOD}" stroke-width="3" stroke-linecap="round"/><path d="M-49-29Q-49-38-40-38H40Q49-38 49-29V24Q49 32 41 32H-41Q-49 32-49 24Z" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M-43-29Q-43-32-39-32H39Q43-32 43-28V21Q43 26 38 26H-38Q-43 26-43 21Z" fill="${PAPER}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/><path d="M-21 11Q-15-10 1-12Q16-12 23 4Q9 11-2 7Q-9 20-21 11Z" fill="${FOLIAGE_LIGHT}"/><path d="M-20 13L12-15" fill="none" stroke="${FOLIAGE_DARK}" stroke-width="2.4" stroke-linecap="round"/></g>`}

      ${phase >= 3 ? `<g class="ga-scene-visitor" transform="translate(100 ${bird?140:186})">${visitor(bird ? "bird" : "butterfly")}</g>` : ""}
      <path d="M35 300Q54 275 73 300M497 305Q515 278 538 302" fill="none" stroke="${FOLIAGE_LIGHT}" stroke-width="2.4" stroke-linecap="round"/>
    </svg>`;
  }

  function visitor(project) {
    if (project === "bird") {
      return `<g>
        <path d="M-25 5Q-30-24 0-24Q23-22 25 1L39 12L21 10Q3 29-18 16Z" fill="${SKY_BLUE}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
        <path d="M-15 2Q-1-10 13 7Q-3 20-15 2Z" fill="${SKY_LIGHT}"/>
        <path d="M-14 2Q-3-7 7 4" fill="none" stroke="${SKY_BLUE_DARK}" stroke-width="2.4" stroke-linecap="round"/>
        <circle cx="12" cy="-9" r="4" fill="${PAPER_LIGHT}" stroke="${INK}" stroke-width="2.4"/><circle cx="13" cy="-9" r="1.8" fill="${INK}"/>
        <path d="M24-6L39 0L24 5Q20 0 24-6Z" fill="${GOLD}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M-10 20V27M5 20V27" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
      </g>`;
    }
    return `<g>
      <path d="M0-3C-20-39-47-34-39-11Q-34 0-9 7C-33 36-8 39 0 6C8 39 33 36 9 7Q34 0 39-11C47-34 20-39 0-3Z" fill="${CORAL}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M-4-6C-27-32-40-19-31-8Q-22 1-6 4M4-6C27-32 40-19 31-8Q22 1 6 4M-3 9Q-14 26-5 31M3 9Q14 26 5 31" fill="none" stroke="${CORAL_DARK}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M0-12Q-7 1 0 20Q7 1 0-12Z" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="2.4"/>
      <path d="M-2-12L-10-22M2-12L10-22" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="0" cy="-9" r="2.4" fill="${PAPER_LIGHT}"/>
    </g>`;
  }

  ns.GardenAdventurePlayArt = { scene, visitor, visitorPlacement: project => ({ x:100, y:project === "bird" ? 140 : 186 }) };
})(window.MiftahGame || (window.MiftahGame = {}));
