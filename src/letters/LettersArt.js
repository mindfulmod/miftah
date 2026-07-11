// Hand-built SVG art for the standalone Letter Garden kids' game. Everything
// visual lives here as string builders: the golden key mascot (Miftah = key),
// the Sprig Cub buddies who hold the letters, the journey map scenery, creatures,
// and icon-only controls — no words anywhere, the art IS the interface.
//
// Visual system ("garden toy"): warm paper surfaces, flat mid-saturation
// colors, chunky navy contours, shallow physical shadows, and one quirky
// detail per drawing. Gradient defs get unique ids because a
// url(#…) reference breaks when its defining screen is display:none.
(function (ns) {
  const INK = "#243653"; // shared with the tactile UI system
  const SHADOW = "rgba(36, 54, 83, 0.2)";

  let uid = 0;
  const gradId = () => `lgg${(uid += 1)}`;

  // A friendly face used by tiny characters. Dark oval eyes stay readable at
  // HUD scale and avoid the outlined-white "glasses" effect of the old cast.
  const face = (x, y, s, mood = "happy") => `
    <g class="art-face" transform="translate(${x} ${y}) scale(${s})">
      <g class="art-eyes">
        <ellipse class="art-pupil" cx="-10.5" cy="1" rx="4.8" ry="6.3" fill="${INK}"/>
        <ellipse class="art-pupil" cx="10.5" cy="1" rx="4.8" ry="6.3" fill="${INK}"/>
        <circle cx="-9" cy="-1" r="1.5" fill="#fffaf0"/>
        <circle cx="12" cy="-1" r="1.5" fill="#fffaf0"/>
      </g>
      ${mood === "open"
        ? `<ellipse cx="0" cy="12.5" rx="6" ry="7" fill="#7c2d4a"/><ellipse cx="0" cy="15.4" rx="3.8" ry="3.2" fill="#ff9db1"/>`
        : mood === "sad"
          ? `<path d="M-6 14 Q0 8.5 6 14" fill="none" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/>`
          : `<path d="M-6 10 Q0 16.5 6 10" fill="none" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/>`}
      <ellipse cx="-17" cy="7.5" rx="4.2" ry="3.4" fill="#ff9db1" opacity="0.6"/>
      <ellipse cx="17" cy="7.5" rx="4.2" ry="3.4" fill="#ff9db1" opacity="0.6"/>
    </g>`;

  // Shared body lighting: a restrained two-tone wash rather than a glossy
  // candy gradient, matching the flatter card and scenery system.
  const bodyGrad = (id, hue, sat = 78, lum = 62) => `
    <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${hue} ${sat}% ${lum + 8}%)"/>
      <stop offset="1" stop-color="hsl(${hue} ${sat - 8}% ${lum - 6}%)"/>
    </linearGradient>`;

  // Sprig Cub palette: still cheerful, but deliberately calmer than the old
  // candy-neon blobs. The dark ink is shared across hues so accessories can
  // move between bodies without looking like they came from another game.
  const sprigPalette = (hue) => ({
    body: `hsl(${hue} 62% 58%)`,
    shade: `hsl(${hue} 48% 43%)`,
    inner: `hsl(${(hue + 42) % 360} 48% 74%)`,
    muzzle: "#f2dfb9",
    cloth: `hsl(${(hue + 195) % 360} 52% 52%)`,
    clothDark: `hsl(${(hue + 195) % 360} 43% 37%)`,
    leaf: "#79a84b",
    leafDark: "#4d7434",
  });

  // Larger toy eyes and a soft muzzle distinguish the companions. The muzzle
  // deliberately has no outline, so the face reads as one animal head instead
  // of eyes and cheeks stapled onto a mask.
  const sprigFace = (x, y, s = 1, mood = "happy", muzzle = "#f1d7a5") => `
    <g class="art-face art-sprig-face" transform="translate(${x} ${y}) scale(${s})">
      <path d="M-29 10 Q-25 -2 -12 1 Q0 4 0 13 Q0 4 12 1 Q25 -2 29 10 Q31 28 15 34 Q0 39 -15 34 Q-31 28 -29 10 Z" fill="${muzzle}"/>
      <g class="art-eyes">
        <ellipse class="art-pupil" cx="-17" cy="-5" rx="7" ry="9.5" fill="${INK}"/>
        <ellipse class="art-pupil" cx="17" cy="-5" rx="7" ry="9.5" fill="${INK}"/>
        <circle cx="-14.5" cy="-8" r="2.3" fill="#fffaf0"/>
        <circle cx="19.5" cy="-8" r="2.3" fill="#fffaf0"/>
      </g>
      <path d="M-6 9 Q0 5 6 9 Q4 15 0 15 Q-4 15 -6 9 Z" fill="${INK}"/>
      <path d="M0 14 V18" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/>
      ${mood === "open"
        ? `<path d="M-9 19 Q0 31 9 19 Q8 36 0 36 Q-8 36 -9 19 Z" fill="#7c3f52" stroke="${INK}" stroke-width="2.6"/><path d="M-5 29 Q0 25 5 29" stroke="#d97786" stroke-width="3" stroke-linecap="round"/>`
        : mood === "sad"
          ? `<path d="M-8 27 Q0 20 8 27" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`
          : `<path d="M-9 19 Q0 29 9 19" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`}
      <circle cx="-32" cy="14" r="4.5" fill="#d9818e" opacity="0.46"/>
      <circle cx="32" cy="14" r="4.5" fill="#d9818e" opacity="0.46"/>
    </g>`;

  // The mascot: a round-headed golden key with a face. He hops on the map,
  // asks the questions from his speech bubble, and dances at every party.
  function keyMascot({ size = 120, mood = "happy" } = {}) {
    const id = gradId();
    return `
    <svg class="art-mascot" viewBox="-60 -60 120 150" width="${size}" height="${size * 1.25}" aria-hidden="true">
      <defs>
        <radialGradient id="${id}" cx="0.38" cy="0.3" r="0.95">
          <stop offset="0" stop-color="#ffe27a"/>
          <stop offset="0.7" stop-color="#ffc22e"/>
          <stop offset="1" stop-color="#e89a1e"/>
        </radialGradient>
      </defs>
      <g class="art-mascot-body">
        <ellipse cx="0" cy="86" rx="32" ry="7" fill="${SHADOW}"/>
        <rect x="-9" y="28" width="18" height="52" rx="9" fill="#dc9c28"/>
        <rect x="-9" y="62" width="30" height="11" rx="5.5" fill="#dc9c28"/>
        <rect x="-9" y="78" width="24" height="11" rx="5.5" fill="#dc9c28"/>
        <circle r="40" fill="url(#${id})"/>
        <path d="M-38 -8 A40 40 0 0 1 4 -40" fill="none" stroke="#fff3c2" stroke-width="6" stroke-linecap="round" opacity="0.55"/>
        <circle cy="-6" r="13" fill="#fff8e2"/>
        <circle cy="-6" r="13" fill="none" stroke="#e89a1e" stroke-width="4"/>
        <circle cx="-13" cy="-24" r="6" fill="#fff" opacity="0.55"/>
        ${face(0, 16, 1.05, mood)}
      </g>
    </svg>`;
  }

  // A Sprig Cub holding up a card — the universal "look at this" frame for
  // letters, syllables and words. `blobCard` remains the public name so older
  // callers keep working, but the silhouette is now a teddy pet with a distinct
  // head, torso, arms and paws.
  function blobCard({ hue = 150, label = "", size = 230, latin = false } = {}) {
    const id = gradId();
    const p = sprigPalette(hue);
    return `
    <svg class="art-blob art-sprig" viewBox="0 0 250 280" width="${size}" height="${size * 1.12}" aria-hidden="true">
      <defs>${bodyGrad(id, hue, 58, 57)}</defs>
      <g class="art-blob-body art-sprig-body">
        <ellipse cx="125" cy="267" rx="76" ry="10" fill="${SHADOW}"/>
        <path d="M150 49 Q151 23 171 18 Q169 41 150 49 Z" fill="${p.leaf}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
        <path d="M154 44 Q161 33 170 25" fill="none" stroke="${p.leafDark}" stroke-width="3" stroke-linecap="round"/>
        <circle cx="65" cy="69" r="34" fill="${p.body}" stroke="${INK}" stroke-width="7"/>
        <circle cx="185" cy="69" r="34" fill="${p.body}" stroke="${INK}" stroke-width="7"/>
        <circle cx="65" cy="69" r="17" fill="${p.inner}" stroke="${INK}" stroke-width="4"/>
        <circle cx="185" cy="69" r="17" fill="${p.inner}" stroke="${INK}" stroke-width="4"/>
        <path d="M53 65 Q58 52 70 50" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="0.35"/>
        <path d="M41 82 Q45 40 125 38 Q205 40 209 82 L204 117 Q197 149 164 155 L86 155 Q53 149 46 117 Z"
          fill="url(#${id})" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>
        <path d="M66 65 Q82 49 107 48" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity="0.28"/>
        ${sprigFace(125, 93, 1.05, "happy", p.muzzle)}
        <path d="M78 144 Q125 132 172 144 Q190 176 183 235 Q165 260 125 260 Q85 260 67 235 Q60 176 78 144 Z"
          fill="${p.body}" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>
        <ellipse cx="125" cy="198" rx="42" ry="48" fill="${p.muzzle}" opacity="0.88"/>
        <path d="M80 224 Q55 245 73 262 Q92 269 105 247" fill="${p.body}" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>
        <path d="M170 224 Q195 245 177 262 Q158 269 145 247" fill="${p.body}" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>
        <ellipse cx="84" cy="253" rx="18" ry="10" fill="${p.inner}" stroke="${INK}" stroke-width="4"/>
        <ellipse cx="166" cy="253" rx="18" ry="10" fill="${p.inner}" stroke="${INK}" stroke-width="4"/>
      </g>
      <g class="art-blob-card">
        <path d="M65 169 Q39 174 42 199 Q44 216 64 216" fill="${p.body}" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
        <path d="M185 169 Q211 174 208 199 Q206 216 186 216" fill="${p.body}" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
        <rect x="55" y="164" width="140" height="90" rx="18" fill="${p.clothDark}"/>
        <rect x="55" y="157" width="140" height="90" rx="18" fill="#fff8e9" stroke="${INK}" stroke-width="6"/>
        <path d="M70 171 H180" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity="0.7"/>
        ${cardGlyph(label, 125, 187, latin)}
        <circle cx="55" cy="190" r="11" fill="${p.inner}" stroke="${INK}" stroke-width="4"/>
        <circle cx="195" cy="190" r="11" fill="${p.inner}" stroke="${INK}" stroke-width="4"/>
      </g>
    </svg>`;
  }

  // Optically centered card text: dominant-baseline central + a small lift
  // (Amiri Quran's em box towers above its ink), sized by skeleton length so
  // long form-strings and words never spill off the card.
  function cardGlyph(label, cx, cy, latin) {
    const len = [...(label || "").replace(/[ً-ْٰٓ-ٟؐ-ؚۖ-ۭ]/g, "")].length;
    const size = latin
      ? Math.min(40, 240 / Math.max(4, len))
      : len <= 1 ? 64 : len <= 3 ? 52 : len <= 5 ? 40 : 26;
    return `<text x="${cx}" y="${cy}" dy="${latin ? "0.06em" : "0.12em"}" text-anchor="middle"
      dominant-baseline="central"
      font-family="${latin ? "ui-rounded, system-ui, sans-serif" : "'Amiri Quran', serif"}"
      font-size="${size}" fill="${INK}" ${latin ? "" : `direction="rtl"`}>${label}</text>`;
  }

  // The hungry Sprig Cub for the feeding game — same toy construction, with a
  // wide animated mouth and a leaf-shaped bib so it reads as one cast member.
  function creature({ hue = 275, size = 210 } = {}) {
    const id = gradId();
    const p = sprigPalette(hue);
    return `
    <svg class="art-creature art-sprig" viewBox="0 0 250 244" width="${size}" height="${size * 0.98}" aria-hidden="true">
      <defs>${bodyGrad(id, hue, 58, 57)}</defs>
      <g class="art-creature-body">
        <ellipse cx="125" cy="232" rx="78" ry="9" fill="${SHADOW}"/>
        <path d="M148 37 Q148 13 168 9 Q166 30 148 37 Z" fill="${p.leaf}" stroke="${INK}" stroke-width="5"/>
        <circle cx="62" cy="65" r="32" fill="${p.body}" stroke="${INK}" stroke-width="7"/>
        <circle cx="188" cy="65" r="32" fill="${p.body}" stroke="${INK}" stroke-width="7"/>
        <circle cx="62" cy="65" r="15" fill="${p.inner}" stroke="${INK}" stroke-width="4"/>
        <circle cx="188" cy="65" r="15" fill="${p.inner}" stroke="${INK}" stroke-width="4"/>
        <path d="M42 74 Q45 31 125 30 Q205 31 208 74 L202 123 Q194 151 165 158 L85 158 Q56 151 48 123 Z"
          fill="url(#${id})" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>
        <g class="art-eyes">
          <ellipse cx="96" cy="89" rx="8" ry="11" fill="${INK}"/>
          <ellipse cx="154" cy="89" rx="8" ry="11" fill="${INK}"/>
          <circle cx="99" cy="86" r="2.5" fill="#fffaf0"/><circle cx="157" cy="86" r="2.5" fill="#fffaf0"/>
        </g>
        <g class="art-creature-mouth">
          <ellipse cx="125" cy="127" rx="48" ry="39" fill="#6f384c" stroke="${INK}" stroke-width="6"/>
          <ellipse cx="125" cy="146" rx="26" ry="13" fill="#d97786"/>
          <path d="M85 112 Q125 102 165 112 L157 124 Q125 116 93 124 Z" fill="#fffaf0"/>
        </g>
        <ellipse cx="125" cy="185" rx="41" ry="45" fill="${p.muzzle}" opacity="0.88"/>
        <path d="M83 172 Q50 178 56 207 Q64 225 88 209" fill="${p.body}" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
        <path d="M167 172 Q200 178 194 207 Q186 225 162 209" fill="${p.body}" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
        <ellipse cx="96" cy="221" rx="28" ry="14" fill="${p.body}" stroke="${INK}" stroke-width="7"/>
        <ellipse cx="154" cy="221" rx="28" ry="14" fill="${p.body}" stroke="${INK}" stroke-width="7"/>
      </g>
    </svg>`;
  }

  // Icon-only controls. Every icon is drawn, never a glyph from a font, so
  // they look identical on every device a child might hold.
  const ICONS = {
    speaker: `<path d="M14 20 L24 20 L38 9 L38 55 L24 44 L14 44 Z" fill="currentColor"/>
      <path d="M45 22 Q52 32 45 42 M50 15 Q61 32 50 49" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>`,
    play: `<path d="M20 12 L52 32 L20 52 Z" fill="currentColor"/>`,
    next: `<path d="M14 12 L40 32 L14 52 Z" fill="currentColor"/><rect x="44" y="12" width="8" height="40" rx="3" fill="currentColor"/>`,
    replay: `<path d="M32 12 A20 20 0 1 1 13 26" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>
      <path d="M8 10 L15 28 L30 18 Z" fill="currentColor"/>`,
    home: `<path d="M10 32 L32 12 L54 32 L48 32 L48 52 L38 52 L38 38 L26 38 L26 52 L16 52 L16 32 Z" fill="currentColor"/>`,
    star: `<path d="M32 6 L39 24 L58 25 L43 37 L48 56 L32 45 L16 56 L21 37 L6 25 L25 24 Z" fill="currentColor"/>`,
    lock: `<rect x="16" y="28" width="32" height="26" rx="6" fill="currentColor"/>
      <path d="M22 28 V20 a10 10 0 0 1 20 0 V28" fill="none" stroke="currentColor" stroke-width="6"/>`,
    check: `<path d="M12 34 L26 48 L52 16" fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`,
    arrow: `<path d="M32 8 V44 M16 30 L32 48 L48 30" fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`,
    sun: `<circle cx="32" cy="32" r="13" fill="currentColor"/>
      <g stroke="currentColor" stroke-width="5" stroke-linecap="round">
        <path d="M32 6 V14 M32 50 V58 M6 32 H14 M50 32 H58 M13 13 L19 19 M45 45 L51 51 M51 13 L45 19 M19 45 L13 51"/>
      </g>`,
    flower: `<g>${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-17" rx="9" ry="14" transform="translate(32 32) rotate(${a})" fill="currentColor"/>`).join("")}<circle cx="32" cy="32" r="9" fill="#fff"/></g>`,
    calendar: `<rect x="8" y="14" width="48" height="42" rx="7" fill="none" stroke="currentColor" stroke-width="6"/>
      <path d="M8 26 H56" stroke="currentColor" stroke-width="6"/>
      <path d="M20 8 V18 M44 8 V18" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>
      <circle cx="22" cy="38" r="4" fill="currentColor"/><circle cx="34" cy="38" r="4" fill="currentColor"/>
      <circle cx="46" cy="38" r="4" fill="currentColor"/><circle cx="22" cy="48" r="4" fill="currentColor"/>`,
    paw: `<ellipse cx="32" cy="40" rx="13" ry="11" fill="currentColor"/>
      <circle cx="16" cy="28" r="6" fill="currentColor"/><circle cx="27" cy="20" r="6" fill="currentColor"/>
      <circle cx="38" cy="20" r="6" fill="currentColor"/><circle cx="48" cy="28" r="6" fill="currentColor"/>`,
  };

  function icon(name, size = 30) {
    return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true">${ICONS[name] || ""}</svg>`;
  }

  // ---------- day/night ----------
  // The garden lives on the child's clock: golden mornings, blue days, peach
  // sunsets and a starry night. Each phase carries sky CSS variables (set on
  // the app root by the game) plus its own celestial art in the backdrop.

  const PHASES = {
    morning: { hi: "#f7dca8", lo: "#edf5df", far: "#c9ddb2", mid: "#a7c889", near: "#78a968", accent: "#efb65a" },
    day: { hi: "#9cd9ed", lo: "#dff5ef", far: "#c5ddbc", mid: "#9bc67f", near: "#6f9f60", accent: "#f3c955" },
    sunset: { hi: "#eeb7aa", lo: "#f5dfc8", far: "#d7d6a8", mid: "#a9bd78", near: "#718f59", accent: "#ee806f" },
    night: { hi: "#34375f", lo: "#555a87", far: "#516f63", mid: "#416755", near: "#315342", accent: "#f0d77a" },
  };

  function dayPhase(hour = new Date().getHours()) {
    if (hour >= 5 && hour < 10) return "morning";
    if (hour >= 10 && hour < 16) return "day";
    if (hour >= 16 && hour < 19) return "sunset";
    return "night";
  }

  // Phase-aware storybook backdrop. Every layer uses the same navy contour
  // and flat paper-like color construction as the UI, so scenery and controls
  // feel like pieces from one physical playset.
  function backdrop(phase = dayPhase()) {
    const p = PHASES[phase] || PHASES.day;
    const night = phase === "night";
    const sceneryInk = night ? "#46516f" : "#65738a";
    const celestial = night
      ? `<g class="art-moon">
           <circle cx="620" cy="92" r="54" fill="${INK}" opacity="0.18"/>
           <circle cx="620" cy="82" r="47" fill="#f4ecc8" stroke="${sceneryInk}" stroke-width="3"/>
           <circle cx="603" cy="72" r="9" fill="#ddd3a8" stroke="${sceneryInk}" stroke-width="1.5"/>
           <circle cx="636" cy="98" r="6" fill="#ddd3a8" stroke="${sceneryInk}" stroke-width="1.5"/>
           <circle cx="633" cy="65" r="4.4" fill="#ddd3a8"/>
         </g>
         <g fill="#fff8d8" class="art-stars">
           ${[[90, 60, 3], [220, 120, 2.4], [340, 50, 3.4], [470, 140, 2.2], [560, 40, 2.8], [150, 190, 2], [720, 200, 2.6], [400, 220, 2.2]]
             .map(([x, y, r], i) => `<circle cx="${x}" cy="${y}" r="${r}" style="animation-delay:${i * 0.6}s"/>`)
             .join("")}
         </g>`
      : `<g class="art-sun-glow">
           <circle cx="620" cy="98" r="58" fill="${INK}" opacity="0.16"/>
           <circle cx="620" cy="88" r="51" fill="${p.accent}" stroke="${sceneryInk}" stroke-width="3"/>
           <circle cx="604" cy="72" r="13" fill="#fffaf0" opacity="0.55"/>
         </g>`;
    return `
    <svg class="art-backdrop" viewBox="0 0 800 600" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      ${celestial}
      <g fill="${night ? "#777ca7" : "#fffaf0"}" opacity="${night ? 0.72 : 0.9}" stroke="${sceneryInk}" stroke-width="2" class="art-clouds">
        <g class="art-cloud-a"><path d="M78 122 Q83 92 112 98 Q124 64 160 84 Q181 70 201 92 Q229 91 236 119 Q205 133 156 130 Q111 134 78 122 Z"/></g>
        <g class="art-cloud-b"><path d="M362 91 Q368 66 392 70 Q403 44 432 61 Q451 51 466 70 Q489 70 496 91 Q467 102 429 100 Q391 104 362 91 Z"/></g>
      </g>
      <path d="M-10 445 Q145 370 305 429 Q462 480 625 417 Q727 380 812 425 L812 615 L-10 615 Z" fill="${p.far}" stroke="${sceneryInk}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M-10 485 Q198 392 420 462 Q622 526 812 440 L812 615 L-10 615 Z" fill="${p.mid}" stroke="${sceneryInk}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M-10 535 Q257 450 521 522 Q682 565 812 516 L812 615 L-10 615 Z" fill="${p.near}" stroke="${sceneryInk}" stroke-width="2.4" stroke-linejoin="round"/>
      <g fill="${night ? "#294638" : "#5f8d55"}" stroke="${sceneryInk}" stroke-width="2.2">
        <path d="M113 501 V468" fill="none" stroke-linecap="round"/><circle cx="113" cy="452" r="27"/>
        <path d="M704 535 V495" fill="none" stroke-linecap="round"/><circle cx="704" cy="476" r="31"/>
      </g>
      <g stroke="${sceneryInk}" stroke-width="1.6" stroke-linecap="round">
        <g transform="translate(246 526)"><path d="M0 22 V2"/><circle cy="0" r="8" fill="#ee806f"/><circle r="3" fill="#f3c955" stroke-width="1.5"/></g>
        <g transform="translate(562 548)"><path d="M0 20 V1"/><circle r="7" fill="#9c8bd8"/><circle r="2.7" fill="#f3c955" stroke-width="1.5"/></g>
        <g transform="translate(386 566)"><path d="M0 18 V0"/><circle r="7" fill="#73b9dc"/><circle r="2.7" fill="#f3c955" stroke-width="1.5"/></g>
      </g>
      <g fill="#fffaf0" stroke="${sceneryInk}" stroke-width="1.5" opacity="0.8">
        <path d="M42 556 q14 -14 28 0 q-14 14 -28 0Z"/><path d="M744 560 q13 -13 26 0 q-13 13 -26 0Z"/>
      </g>
      ${night ? `<g class="art-fireflies" fill="#ffe98a">${[[210, 480], [470, 510], [650, 540]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="4" style="animation-delay:${i * 1.1}s"/>`).join("")}</g>` : ""}
    </svg>`;
  }

  // One map stop: a collectible rounded-square badge with the same navy rim,
  // warm face and shallow physical lift as every interactive card.
  function mapStop({ hue, label, status, stars = 0, latin = false }) {
    const faceColor = status === "done" ? "#f3c955" : status === "current" ? `hsl(${hue} 54% 70%)` : "#e5e0d5";
    const insetColor = status === "done" ? "#fff1c9" : status === "current" ? `hsl(${hue} 55% 88%)` : "#f4f0e4";
    const starRow = [0, 1, 2]
      .map(
        (i) =>
          `<g transform="translate(${(i - 1) * 25} 59) scale(0.3)" class="${i < stars ? "map-star-on" : "map-star-off"}"><g transform="translate(-32 -32)">${ICONS.star}</g></g>`,
      )
      .join("");
    return `
    <svg viewBox="-64 -64 128 148" class="map-stop-art" aria-hidden="true">
      <rect x="-49" y="-43" width="98" height="103" rx="28" fill="${INK}"/>
      <rect x="-49" y="-52" width="98" height="103" rx="28" fill="${faceColor}" stroke="${INK}" stroke-width="5"/>
      <rect x="-39" y="-42" width="78" height="73" rx="20" fill="${insetColor}" stroke="${INK}" stroke-width="3"/>
      <path d="M-26 -32 Q-12 -40 4 -39" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="0.65"/>
      ${
        status === "locked"
          ? `<g transform="translate(-21 -24) scale(0.66)" fill="#87909e">${ICONS.lock}</g>`
          : `<text y="${latin ? 2 : 10}" text-anchor="middle" font-family="${latin ? "ui-rounded, system-ui, sans-serif" : "'Amiri Quran', serif"}" font-size="${latin ? 24 : [...label.replace(/[ً-ْٰٓ-ٟؐ-ؚۖ-ۭ]/g, "")].length >= 3 ? 27 : 39}" fill="${INK}" ${latin ? "" : `direction="rtl"`}>${label}</text>`
      }
      ${status !== "locked" ? starRow : ""}
    </svg>`;
  }

  // A little flower-and-sprout cluster that blooms beside finished map stops:
  // the garden literally grows with the child's learning. Deterministic per
  // seed so a stop's garden doesn't reshuffle between visits.
  function bloomCluster({ seed = 0, size = 90 } = {}) {
    const rand = (n) => {
      const v = Math.sin(seed * 127.1 + n * 311.7) * 43758.5453;
      return v - Math.floor(v);
    };
    const flowers = [0, 1, 2].map((n) => {
      const x = -30 + rand(n) * 60;
      const hue = [335, 45, 205, 280][Math.floor(rand(n + 9) * 4)];
      const s = 0.7 + rand(n + 5) * 0.5;
      return `
      <g class="art-bloom" style="animation-delay:${(n * 0.35).toFixed(2)}s" transform="translate(${x.toFixed(1)} ${(6 - n * 3).toFixed(1)}) scale(${s.toFixed(2)})">
        <path d="M0 17 V1" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
        ${[0, 60, 120, 180, 240, 300].map((a) => `<ellipse rx="4.8" ry="7.6" transform="rotate(${a}) translate(0 -7.4)" fill="hsl(${hue} 64% 70%)" stroke="${INK}" stroke-width="2"/>`).join("")}
        <circle r="4.6" fill="#f3c955" stroke="${INK}" stroke-width="2"/>
      </g>`;
    });
    return `
    <svg viewBox="-45 -28 90 52" width="${size}" height="${size * 0.58}" aria-hidden="true" class="art-bloom-cluster">
      <ellipse cy="20" rx="36" ry="6" fill="${SHADOW}"/>
      ${flowers.join("")}
    </svg>`;
  }

  // ---------- the Letter Pet ----------
  // The creature the child hatches and TEACHES. Species share one core body
  // rig so the face and every accessory fits all of them; each species adds
  // its own ears, tail and quirk. The legacy `blob` id now means Sprig Cub,
  // preserving every existing save while removing the blob silhouette.

  ns.LETTERS_BODIES = [
    { id: "blob", cost: 0 },
    { id: "bunny", cost: 20 },
    { id: "chick", cost: 20 },
    { id: "cat", cost: 25 },
    { id: "dragon", cost: 30 },
  ];

  // Species parts drawn around the shared cub head and torso. `back` renders
  // before the shared body, `front` adds the identifying detail afterward.
  const SPECIES = {
    blob: (p) => ({
      back: `
        <circle cx="-39" cy="-48" r="21" fill="${p.body}" stroke="${INK}" stroke-width="6"/>
        <circle cx="39" cy="-48" r="21" fill="${p.body}" stroke="${INK}" stroke-width="6"/>
        <circle cx="-39" cy="-48" r="10" fill="${p.inner}" stroke="${INK}" stroke-width="3.2"/>
        <circle cx="39" cy="-48" r="10" fill="${p.inner}" stroke="${INK}" stroke-width="3.2"/>
        <path d="M42 42 Q66 48 57 62 Q50 69 40 57 Z" fill="${p.body}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`,
      front: `<path d="M18 -72 Q20 -93 39 -96 Q35 -77 18 -72 Z" fill="${p.leaf}" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/><path d="M22 -77 Q29 -84 36 -90" fill="none" stroke="${p.leafDark}" stroke-width="2.5" stroke-linecap="round"/>`,
    }),
    bunny: (p) => ({
      back: `
        <path d="M-34 -55 Q-49 -110 -20 -104 Q-2 -94 -15 -50 Z" fill="${p.body}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
        <path d="M34 -55 Q49 -110 20 -104 Q2 -94 15 -50 Z" fill="${p.body}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
        <path d="M-30 -64 Q-38 -96 -23 -95 Q-12 -86 -20 -58 Z" fill="${p.inner}"/>
        <path d="M30 -64 Q38 -96 23 -95 Q12 -86 20 -58 Z" fill="${p.inner}"/>
        <circle cx="49" cy="48" r="13" fill="${p.inner}" stroke="${INK}" stroke-width="4"/>`,
      front: "",
    }),
    chick: (p) => ({
      back: `
        <path d="M-15 -70 Q-21 -91 -3 -82 Q3 -101 12 -81 Q29 -91 20 -68 Z" fill="#d8a951" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
        <path d="M-49 15 Q-72 24 -60 47 Q-50 58 -37 40 Z" fill="${p.body}" stroke="${INK}" stroke-width="5"/>
        <path d="M49 15 Q72 24 60 47 Q50 58 37 40 Z" fill="${p.body}" stroke="${INK}" stroke-width="5"/>
        <path d="M39 47 Q61 53 56 65 Q48 72 37 58 Z" fill="#d8a951" stroke="${INK}" stroke-width="4"/>`,
      front: `<path d="M-7 -18 L0 -9 L7 -18 Q0 -24 -7 -18 Z" fill="#d8a951" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`,
    }),
    cat: (p) => ({
      back: `
        <path d="M-45 -44 Q-55 -82 -18 -66 L-23 -47 Z" fill="${p.body}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
        <path d="M45 -44 Q55 -82 18 -66 L23 -47 Z" fill="${p.body}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
        <path d="M-43 -57 Q-47 -72 -28 -64 Z" fill="${p.inner}"/>
        <path d="M43 -57 Q47 -72 28 -64 Z" fill="${p.inner}"/>
        <path d="M43 44 Q72 41 68 15 Q66 1 54 7 Q61 19 52 28 Q43 35 39 45 Z" fill="${p.body}" stroke="${INK}" stroke-width="5"/>`,
      front: `
        <g stroke="${INK}" stroke-width="2.4" stroke-linecap="round" opacity="0.78">
          <path d="M-25 -4 L-43 -8 M-25 2 L-44 4 M25 -4 L43 -8 M25 2 L44 4"/>
        </g>`,
    }),
    dragon: (p) => ({
      back: `
        <path d="M-24 -60 L-15 -86 L-3 -64 L8 -91 L18 -64 L30 -82 L33 -54 Z" fill="${p.inner}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
        <path d="M-47 -9 Q-76 -28 -69 5 Q-62 23 -39 17 Z" fill="${p.inner}" stroke="${INK}" stroke-width="5"/>
        <path d="M47 -9 Q76 -28 69 5 Q62 23 39 17 Z" fill="${p.inner}" stroke="${INK}" stroke-width="5"/>
        <path d="M39 42 Q72 50 72 67 L58 61 Q65 73 51 75 Q37 71 35 54 Z" fill="${p.body}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`,
      front: "",
    }),
  };

  function pet({ hue = 200, species = "blob", stage = 1, worn = [], size = 140, mood = "happy" } = {}) {
    const scale = stage >= 3 ? 1.05 : stage >= 2 ? 0.96 : 0.9;
    const id = gradId();
    const p = sprigPalette(hue);
    const parts = (SPECIES[species] || SPECIES.blob)(p);
    return `
    <svg class="art-pet art-sprig" viewBox="-84 -120 168 220" width="${size}" height="${size * 1.12}" aria-hidden="true">
      <defs>${bodyGrad(id, hue, 58, 57)}</defs>
      <g class="art-pet-body" transform="scale(${scale})">
        <ellipse cy="92" rx="51" ry="8" fill="${SHADOW}"/>
        ${stage >= 3 ? `<g opacity="0.9">${[-62, 62].map((x) => `<circle cx="${x}" cy="-56" r="3.4" fill="#d8b957"/>`).join("")}<circle cx="0" cy="-92" r="4" fill="#d8b957"/></g>` : ""}
        ${parts.back}
        <path d="M-37 20 Q0 8 37 20 Q50 45 43 76 Q28 92 0 92 Q-28 92 -43 76 Q-50 45 -37 20 Z"
          fill="${p.body}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
        <ellipse cx="0" cy="51" rx="29" ry="36" fill="${p.muzzle}" opacity="0.88"/>
        ${stage >= 2 ? `<path d="M-38 34 Q-60 40 -53 63 Q-45 75 -31 62 Z" fill="${p.body}" stroke="${INK}" stroke-width="5"/><path d="M38 34 Q60 40 53 63 Q45 75 31 62 Z" fill="${p.body}" stroke="${INK}" stroke-width="5"/>` : `<path d="M-37 40 Q-52 44 -47 59 Q-41 67 -32 58 Z" fill="${p.body}" stroke="${INK}" stroke-width="4"/><path d="M37 40 Q52 44 47 59 Q41 67 32 58 Z" fill="${p.body}" stroke="${INK}" stroke-width="4"/>`}
        <ellipse cx="-25" cy="82" rx="24" ry="13" fill="${p.body}" stroke="${INK}" stroke-width="5"/>
        <ellipse cx="25" cy="82" rx="24" ry="13" fill="${p.body}" stroke="${INK}" stroke-width="5"/>
        <ellipse cx="-25" cy="84" rx="12" ry="6" fill="${p.inner}"/>
        <ellipse cx="25" cy="84" rx="12" ry="6" fill="${p.inner}"/>
        <path d="M-52 -50 Q-48 -78 0 -80 Q48 -78 52 -50 L49 -13 Q43 15 0 18 Q-43 15 -49 -13 Z"
          fill="url(#${id})" stroke="${INK}" stroke-width="6.5" stroke-linejoin="round"/>
        <path d="M-32 -58 Q-21 -70 -4 -71" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity="0.3"/>
        ${sprigFace(0, -28, 0.88, mood, p.muzzle)}
        ${parts.front}
        ${worn.map((wid) => ACCESSORY_ART[wid] || "").join("")}
      </g>
    </svg>`;
  }

  const ACCESSORY_ART = {
    cap: `<g transform="translate(0 -76) rotate(-5)"><path d="M-31 8 Q-25 -18 7 -18 Q30 -17 34 8 Z" fill="#c8665a" stroke="${INK}" stroke-width="4.5"/><path d="M-34 7 H43 Q40 18 -30 15 Z" fill="#5c79a2" stroke="${INK}" stroke-width="4.5"/><path d="M2 -20 Q8 -25 12 -18" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/></g>`,
    crown: `<g transform="translate(0 -78)"><path d="M-26 12 L-25 -10 L-12 0 L0 -17 L13 0 L27 -10 L25 12 Z" fill="#d8b957" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/><circle cy="4" r="4" fill="#b86572"/></g>`,
    bow: `<g transform="translate(36 -56) rotate(18)"><path d="M0 0 L-17 -11 L-17 11 Z M0 0 L17 -11 L17 11 Z" fill="#c96f86" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><circle r="5" fill="#9e5268" stroke="${INK}" stroke-width="2.5"/></g>`,
    glasses: `<g transform="translate(0 -31)"><circle cx="-18" cy="0" r="13" fill="none" stroke="${INK}" stroke-width="4.5"/><circle cx="18" cy="0" r="13" fill="none" stroke="${INK}" stroke-width="4.5"/><path d="M-5 0 H5 M-31 -1 L-45 -5 M31 -1 L45 -5" stroke="${INK}" stroke-width="4" stroke-linecap="round"/></g>`,
    scarf: `<g transform="translate(0 12)"><path d="M-35 -3 Q0 13 35 -3 L31 11 Q0 25 -31 11 Z" fill="#6f9a69" stroke="${INK}" stroke-width="4.5"/><path d="M19 9 L29 36 L11 31 Z" fill="#6f9a69" stroke="${INK}" stroke-width="4"/></g>`,
    flower: `<g transform="translate(-38 -58)">${[0, 60, 120, 180, 240, 300].map((a) => `<ellipse rx="6" ry="10" transform="rotate(${a}) translate(0 -10)" fill="#c96f86" stroke="${INK}" stroke-width="1.8"/>`).join("")}<circle r="6" fill="#d8b957" stroke="${INK}" stroke-width="2"/></g>`,
    balloon: `<g transform="translate(60 -32)"><path d="M0 20 Q-5 43 0 58" fill="none" stroke="#756b82" stroke-width="2.8"/><ellipse rx="16" ry="20" fill="#6fa4b8" stroke="${INK}" stroke-width="4"/><circle cx="-5" cy="-6" r="4" fill="#fff" opacity="0.5"/></g>`,
    wand: `<g transform="translate(-57 18) rotate(-24)"><rect x="-2.5" y="0" width="5" height="40" rx="2.5" fill="#9f7840"/><g transform="translate(0 -7) scale(0.38)" fill="#d8b957"><path d="M0 -26 L7 -6 L27 -5 L11 8 L16 27 L0 16 L-16 27 L-11 8 L-27 -5 L-7 -6 Z" stroke="${INK}" stroke-width="8"/></g></g>`,
    taqiyah: `<g transform="translate(0 -77)"><path d="M-29 10 Q-25 -15 0 -17 Q25 -15 29 10 L27 15 H-27 Z" fill="#f5edda" stroke="${INK}" stroke-width="4.5"/><path d="M-18 -1 Q0 -10 18 -1 M-23 7 Q0 0 23 7" fill="none" stroke="#b9aa8d" stroke-width="2.5"/></g>`,
    cape: `<g transform="translate(0 20)"><path d="M-42 -16 Q-62 24 -49 67 L-25 56 Q-37 19 -31 -13 Z" fill="#b9665f" stroke="${INK}" stroke-width="4.5"/><path d="M42 -16 Q62 24 49 67 L25 56 Q37 19 31 -13 Z" fill="#b9665f" stroke="${INK}" stroke-width="4.5"/></g>`,
    medal: `<g transform="translate(0 42)"><path d="M-8 -18 L0 -5 L8 -18" stroke="#557b4a" stroke-width="5" fill="none"/><circle cy="6" r="11" fill="#d8b957" stroke="${INK}" stroke-width="4"/><path d="M0 0 L3 5 L8 5 L4 9 L5 14 L0 11 L-5 14 L-4 9 L-8 5 L-3 5 Z" fill="#fff5d9"/></g>`,
    kite: `<g transform="translate(61 -18) rotate(14)"><path d="M0 -19 L15 0 L0 19 L-15 0 Z" fill="#6fa4b8" stroke="${INK}" stroke-width="4"/><path d="M0 -19 V19 M-15 0 H15" stroke="${INK}" stroke-width="2.5"/><path d="M0 19 Q-5 31 0 41 Q5 49 0 58" fill="none" stroke="#756b82" stroke-width="2.8"/></g>`,
    sprout: `<g transform="translate(0 -85)"><path d="M0 12 V-3" stroke="#4d7434" stroke-width="4" fill="none"/><path d="M0 -3 Q-15 -7 -17 -21 Q-3 -18 0 -3 Z" fill="#6f9a54" stroke="${INK}" stroke-width="3.2"/><path d="M0 -3 Q15 -9 18 -22 Q4 -19 0 -3 Z" fill="#8caf62" stroke="${INK}" stroke-width="3.2"/></g>`,
    moonpin: `<g transform="translate(-29 48)"><path d="M4 -11 A12 12 0 1 0 4 11 A9 9 0 1 1 4 -11" fill="#e1ce8a" stroke="${INK}" stroke-width="3"/><circle cx="9" cy="-10" r="2.8" fill="#d8b957" stroke="${INK}" stroke-width="1.8"/></g>`,
  };

  ns.LETTERS_ACCESSORIES = [
    { id: "cap", cost: 8 },
    { id: "taqiyah", cost: 8 },
    { id: "bow", cost: 8 },
    { id: "glasses", cost: 8 },
    { id: "scarf", cost: 8 },
    { id: "flower", cost: 8 },
    { id: "balloon", cost: 8 },
    { id: "crown", cost: 8 },
    { id: "wand", cost: 8 },
    { id: "cape", cost: 10 },
    { id: "medal", cost: 10 },
    { id: "kite", cost: 10 },
    { id: "sprout", cost: 10 },
    { id: "moonpin", cost: 10 },
  ];

  function egg({ size = 150, cracks = 0 } = {}) {
    const id = gradId();
    return `
    <svg class="art-egg" viewBox="-50 -60 100 120" width="${size}" height="${size * 1.2}" aria-hidden="true">
      <defs>
        <radialGradient id="${id}" cx="0.36" cy="0.3" r="1">
          <stop offset="0" stop-color="#fffdf6"/><stop offset="0.7" stop-color="#fdf0d2"/><stop offset="1" stop-color="#ecd39a"/>
        </radialGradient>
      </defs>
      <g class="art-egg-body">
        <ellipse cy="56" rx="34" ry="7" fill="${SHADOW}"/>
        <path d="M0 -52 C30 -52 42 -18 42 8 C42 36 24 52 0 52 C-24 52 -42 36 -42 8 C-42 -18 -30 -52 0 -52 Z"
          fill="url(#${id})" stroke="#d8ab4e" stroke-width="4"/>
        <circle cx="-12" cy="-22" r="8" fill="#fff" opacity="0.7"/>
        <g fill="#ffc22e" opacity="0.8"><circle cx="14" cy="6" r="5"/><circle cx="-16" cy="18" r="4"/><circle cx="4" cy="32" r="3.4"/></g>
        ${cracks >= 1 ? `<path d="M-20 -10 L-10 -2 L-16 8" fill="none" stroke="#b0812a" stroke-width="3" stroke-linecap="round"/>` : ""}
        ${cracks >= 2 ? `<path d="M18 -18 L10 -8 L20 0 L12 10" fill="none" stroke="#b0812a" stroke-width="3" stroke-linecap="round"/>` : ""}
      </g>
    </svg>`;
  }

  // ---------- the skill flower ----------
  // The check-up's wordless report card: five petals, one per skill
  // (identify / memorize / visualize / blend / write), each growing with the
  // child's latest check-up score. Buds mean "not tested yet".

  ns.LETTERS_SKILLS = [
    { id: "identify", hue: 205 },
    { id: "memorize", hue: 338 },
    { id: "visualize", hue: 272 },
    { id: "blend", hue: 158 },
    { id: "write", hue: 38 },
  ];

  const PETAL_ICONS = {
    identify: `<circle r="5.5" fill="none" stroke="#fff" stroke-width="2.4"/><circle r="1.8" fill="#fff"/>`,
    memorize: `<rect x="-7" y="-5" width="8" height="10" rx="2" fill="none" stroke="#fff" stroke-width="2.2"/><rect x="-1" y="-5" width="8" height="10" rx="2" fill="none" stroke="#fff" stroke-width="2.2"/>`,
    visualize: `<text y="5" text-anchor="middle" font-family="'Amiri Quran', serif" font-size="15" fill="#fff">ﺑ</text>`,
    blend: `<circle cx="-4" cy="0" r="4.5" fill="none" stroke="#fff" stroke-width="2.2"/><circle cx="4" cy="0" r="4.5" fill="none" stroke="#fff" stroke-width="2.2"/>`,
    write: `<path d="M-5 6 L3 -6 L6 -3 L-2 8 Z M-5 6 L-6 9 L-3 8 Z" fill="#fff"/>`,
  };

  function skillFlower({ scores = {}, size = 170 } = {}) {
    const petals = ns.LETTERS_SKILLS.map((skill, i) => {
      const angle = i * 72 - 90;
      const score = scores[skill.id] ? scores[skill.id].score || 0 : 0;
      const len = [13, 22, 30, 38][Math.max(0, Math.min(3, score))];
      const fill = score > 0 ? `hsl(${skill.hue} 76% 62%)` : "rgba(186, 176, 202, 0.5)";
      const rim = score > 0 ? `hsl(${skill.hue} 66% 42%)` : "rgba(130, 118, 148, 0.5)";
      return `
        <g transform="rotate(${angle})">
          <ellipse cx="${16 + len / 2}" cy="0" rx="${len / 2 + 8}" ry="${Math.max(9, len * 0.42)}"
            fill="${fill}" stroke="${rim}" stroke-width="3"/>
          ${score > 0 ? `<g transform="translate(${16 + len / 2} 0) rotate(${-angle})">${PETAL_ICONS[skill.id] || ""}</g>` : ""}
        </g>`;
    }).join("");
    return `
    <svg class="art-flower" viewBox="-70 -70 140 140" width="${size}" height="${size}" aria-hidden="true">
      ${petals}
      <circle r="17" fill="#ffd23e" stroke="#c47f12" stroke-width="3.4"/>
      ${face(0, -1, 0.55)}
    </svg>`;
  }

  // ---------- sticker collection ----------
  // Die-cut stickers, like the sheets kids peel: each drawing sits on a white
  // wobbly-round backing with a soft shadow and a peeling shine. Owned ones
  // tilt playfully in the album; unowned slots are grey question blanks.

  const STICKER_ART = {
    sun: `<circle r="16" fill="#ffd23e"/><circle cx="-5" cy="-5" r="5" fill="#fff" opacity="0.5"/><g stroke="#f59a1d" stroke-width="4" stroke-linecap="round">${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<path d="M0 -22 L0 -28" transform="rotate(${a})"/>`).join("")}</g>`,
    moon: `<path d="M8 -20 A22 22 0 1 0 8 20 A17 17 0 1 1 8 -20" fill="#ffe9a8" stroke="#d8ab4e" stroke-width="3"/>`,
    star: `<path d="M0 -22 L6 -6 L23 -5 L9 6 L14 22 L0 13 L-14 22 L-9 6 L-23 -5 L-6 -6 Z" fill="#ffc22e" stroke="#c47f12" stroke-width="3"/>`,
    rainbow: `<g fill="none" stroke-width="5"><path d="M-22 14 A22 22 0 0 1 22 14" stroke="#f0503f"/><path d="M-16 14 A16 16 0 0 1 16 14" stroke="#ffc22e"/><path d="M-10 14 A10 10 0 0 1 10 14" stroke="#2fc487"/></g><circle cx="-22" cy="16" r="5" fill="#fff"/><circle cx="22" cy="16" r="5" fill="#fff"/>`,
    palm: `<rect x="-3" y="-2" width="7" height="26" rx="3" fill="#b06322"/><g fill="#2fc487">${[-150, -110, -70, -30].map((a) => `<ellipse rx="16" ry="6" transform="translate(0 -6) rotate(${a}) translate(12 0)"/>`).join("")}</g>`,
    flower: `${[0, 60, 120, 180, 240, 300].map((a) => `<ellipse rx="7" ry="12" transform="rotate(${a}) translate(0 -12)" fill="#ff7d96"/>`).join("")}<circle r="7" fill="#ffd23e"/>`,
    butterfly: `<g><ellipse cx="-11" cy="-8" rx="10" ry="12" fill="#54c6ff" transform="rotate(-20 -11 -8)"/><ellipse cx="11" cy="-8" rx="10" ry="12" fill="#54c6ff" transform="rotate(20 11 -8)"/><ellipse cx="-9" cy="9" rx="8" ry="9" fill="#ff7d96" transform="rotate(20 -9 9)"/><ellipse cx="9" cy="9" rx="8" ry="9" fill="#ff7d96" transform="rotate(-20 9 9)"/><rect x="-2.4" y="-14" width="5" height="28" rx="2.5" fill="${INK}"/></g>`,
    bee: `<ellipse rx="15" ry="11" fill="#ffd23e" stroke="${INK}" stroke-width="3"/><path d="M-5 -11 V11 M5 -11 V11" stroke="${INK}" stroke-width="4"/><ellipse cx="-8" cy="-14" rx="7" ry="5" fill="#d0f2ff" opacity="0.9"/><ellipse cx="8" cy="-14" rx="7" ry="5" fill="#d0f2ff" opacity="0.9"/><circle cx="17" cy="-2" r="2.4" fill="${INK}"/>`,
    dove: `<path d="M-18 4 Q-8 -14 8 -8 Q22 -4 20 8 Q10 18 -6 14 Z" fill="#fffaf0" stroke="#b8aecc" stroke-width="3"/><path d="M-2 -6 Q-12 -18 2 -16 Z" fill="#fffaf0" stroke="#b8aecc" stroke-width="3"/><circle cx="12" cy="-2" r="1.8" fill="${INK}"/><path d="M20 2 L27 4 L20 7 Z" fill="#f59a1d"/>`,
    fish: `<path d="M-20 0 Q-4 -14 10 -8 Q20 -4 20 0 Q20 4 10 8 Q-4 14 -20 0 Z" fill="#54c6ff" stroke="#1f87c2" stroke-width="3"/><path d="M-20 0 L-28 -8 L-28 8 Z" fill="#1f87c2"/><circle cx="10" cy="-2" r="2" fill="${INK}"/>`,
    boat: `<path d="M-22 6 L22 6 L14 18 L-14 18 Z" fill="#b06322" stroke="#7c4210" stroke-width="3"/><path d="M2 6 L2 -20 L18 -2 Z" fill="#fffaf0" stroke="#b8aecc" stroke-width="3"/>`,
    lantern: `<rect x="-4" y="-24" width="8" height="5" rx="2" fill="#c47f12"/><path d="M-12 -18 L12 -18 L16 8 Q0 16 -16 8 Z" fill="#ffd23e" stroke="#c47f12" stroke-width="3"/><circle cy="-2" r="6" fill="#fff" opacity="0.75"/>`,
    key: `<circle cx="0" cy="-12" r="10" fill="none" stroke="#ffc22e" stroke-width="6"/><rect x="-3" y="-4" width="6" height="26" rx="3" fill="#ffc22e"/><rect x="-3" y="12" width="12" height="5" rx="2" fill="#ffc22e"/><rect x="-3" y="20" width="9" height="5" rx="2" fill="#ffc22e"/>`,
    egg: `<path d="M0 -20 C12 -20 17 -7 17 3 C17 14 10 20 0 20 C-10 20 -17 14 -17 3 C-17 -7 -12 -20 0 -20 Z" fill="#fdf0d2" stroke="#d8ab4e" stroke-width="3"/><circle cx="-5" cy="-8" r="3.4" fill="#fff"/>`,
    cat: `<circle cy="2" r="16" fill="#f59a1d" stroke="#b06322" stroke-width="3"/><path d="M-12 -10 L-16 -22 L-5 -14 Z M12 -10 L16 -22 L5 -14 Z" fill="#f59a1d" stroke="#b06322" stroke-width="3"/><circle cx="-6" cy="0" r="2" fill="${INK}"/><circle cx="6" cy="0" r="2" fill="${INK}"/><path d="M-3 7 Q0 10 3 7" fill="none" stroke="${INK}" stroke-width="2"/>`,
    cloud: `<ellipse cx="-8" cy="2" rx="14" ry="10" fill="#fffaf0"/><ellipse cx="8" cy="-2" rx="13" ry="11" fill="#fffaf0"/><ellipse cx="0" cy="6" rx="20" ry="9" fill="#fffaf0"/><ellipse cx="0" cy="2" rx="19" ry="10" fill="none" stroke="#a8d4ec" stroke-width="3"/>`,
    // The Quranic animals — the island's cast, sticker-sized.
    camel: `<path d="M-18 12 Q-20 -2 -10 -4 Q-6 -12 2 -8 Q6 -14 12 -10 L14 -18 L18 -16 L16 -6 Q20 0 18 12 Z" fill="#e8a936" stroke="#b06322" stroke-width="3"/><rect x="-14" y="12" width="5" height="9" rx="2" fill="#b06322"/><rect x="8" y="12" width="5" height="9" rx="2" fill="#b06322"/><circle cx="14" cy="-13" r="1.6" fill="${INK}"/>`,
    elephant: `<circle cx="-2" cy="0" r="15" fill="#b8aecc" stroke="#84739f" stroke-width="3"/><circle cx="-12" cy="-4" r="8" fill="#d2c9e2" stroke="#84739f" stroke-width="3"/><path d="M12 -4 Q22 0 18 12 Q16 16 12 14" fill="none" stroke="#84739f" stroke-width="5" stroke-linecap="round"/><circle cx="4" cy="-4" r="2" fill="${INK}"/>`,
    ant: `<circle cx="-11" cy="4" r="7" fill="#7c4e22"/><circle cx="0" cy="0" r="6" fill="#7c4e22"/><circle cx="10" cy="-4" r="7" fill="#7c4e22"/><path d="M8 -10 L4 -18 M14 -10 L18 -18" stroke="#7c4e22" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="-6" r="1.6" fill="#fff"/><path d="M-14 10 L-18 16 M-8 11 L-9 18 M0 6 L-2 14 M4 5 L8 13" stroke="#7c4e22" stroke-width="2.4" stroke-linecap="round"/>`,
    spider: `<circle cy="2" r="11" fill="#4a3b5c"/><circle cy="-10" r="6" fill="#4a3b5c"/><g stroke="#4a3b5c" stroke-width="2.6" stroke-linecap="round" fill="none"><path d="M-9 -2 Q-20 -8 -22 -16 M9 -2 Q20 -8 22 -16 M-11 4 Q-22 4 -25 -2 M11 4 Q22 4 25 -2 M-10 9 Q-18 16 -22 15 M10 9 Q18 16 22 15"/></g><circle cx="-2" cy="-11" r="1.5" fill="#fff"/><circle cx="2" cy="-11" r="1.5" fill="#fff"/>`,
    crow: `<path d="M-16 6 Q-12 -10 4 -10 Q16 -10 16 0 Q16 10 2 12 L-8 12 Z" fill="#413a52" stroke="#28223a" stroke-width="3"/><path d="M14 -2 L23 0 L14 4 Z" fill="#f59a1d"/><circle cx="8" cy="-3" r="1.8" fill="#fff"/><path d="M-14 8 L-22 2" stroke="#28223a" stroke-width="3" stroke-linecap="round"/>`,
    hoopoe: `<path d="M-14 6 Q-10 -8 4 -8 Q14 -8 14 0 Q14 9 2 10 L-7 10 Z" fill="#f0a660" stroke="#b06322" stroke-width="3"/><path d="M12 -4 L21 -2 L12 1 Z" fill="#4a3b5c"/><g stroke="#b06322" stroke-width="2.6" stroke-linecap="round"><path d="M2 -8 L-1 -18 M5 -8 L5 -19 M8 -8 L11 -17"/></g><circle cx="3" cy="-15" r="2" fill="${INK}"/><circle cx="7" cy="-2" r="1.7" fill="${INK}"/>`,
    whale: `<path d="M-20 2 Q-12 -12 4 -10 Q20 -8 20 2 Q20 10 4 10 Q-12 12 -20 2 Z" fill="#4f92e8" stroke="#2b5cad" stroke-width="3"/><path d="M-18 0 L-27 -6 L-24 2 L-27 8 Z" fill="#2b5cad"/><path d="M4 -10 Q4 -18 -1 -20 M4 -10 Q9 -17 7 -21" stroke="#2b5cad" stroke-width="2.6" fill="none" stroke-linecap="round"/><circle cx="11" cy="-2" r="2" fill="#fff"/>`,
    snake: `<path d="M-18 12 Q-8 4 0 10 Q10 16 16 6 Q20 -2 12 -8 Q6 -12 2 -8" fill="none" stroke="#2fc487" stroke-width="7" stroke-linecap="round"/><circle cx="0" cy="-9" r="6" fill="#2fc487" stroke="#1d8a5c" stroke-width="2.6"/><circle cx="-2" cy="-10" r="1.5" fill="${INK}"/><path d="M-6 -9 L-12 -11" stroke="#cf3f60" stroke-width="2" stroke-linecap="round"/>`,
  };

  ns.LETTERS_STICKERS = Object.keys(STICKER_ART).map((id) => ({ id }));

  // The die-cut backing: a wobbly circle (hand-cut, not perfect — Toca's
  // "dirt in the corners") with the classic white sticker rim.
  const DIECUT = "M0 -30 Q14 -31 22 -21 Q31 -13 30 1 Q30 15 20 22 Q11 30 -2 30 Q-15 30 -23 21 Q-31 12 -30 -2 Q-30 -15 -21 -22 Q-13 -30 0 -30 Z";

  function sticker({ id, size = 84, owned = true } = {}) {
    const art = STICKER_ART[id] || "";
    // Deterministic playful tilt per sticker id.
    const tilt = ((id || "").split("").reduce((n, c) => n + c.charCodeAt(0), 0) % 13) - 6;
    return `
    <svg class="art-sticker" viewBox="-38 -38 76 76" width="${size}" height="${size}" aria-hidden="true">
      <g transform="rotate(${owned ? tilt : 0})">
        <path d="${DIECUT}" transform="translate(1.5 3)" fill="${SHADOW}"/>
        <path d="${DIECUT}" fill="${owned ? "#fff" : "rgba(255,255,255,0.45)"}"/>
        ${owned
          ? `<g transform="scale(0.78)">${art}</g>
             <path d="M-24 -14 Q-16 -26 -2 -28" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="0.8"/>`
          : `<text y="9" text-anchor="middle" font-size="26" fill="rgba(130,118,148,0.55)" font-weight="900" font-family="ui-rounded, system-ui, sans-serif">?</text>`}
      </g>
    </svg>`;
  }

  function stickerPack({ size = 120 } = {}) {
    const id = gradId();
    return `
    <svg viewBox="-44 -52 88 104" width="${size}" height="${size * 1.18}" aria-hidden="true">
      <defs>${bodyGrad(id, 272, 68, 60)}</defs>
      <g class="art-pack">
        <rect x="-34" y="-38" width="68" height="84" rx="14" fill="hsl(272 55% 40%)"/>
        <rect x="-34" y="-42" width="68" height="84" rx="14" fill="url(#${id})"/>
        <path d="M-34 -18 Q0 -4 34 -18 L34 -42 Q34 -42 22 -42 L-22 -42 Q-34 -42 -34 -42 Z" fill="hsl(272 72% 74%)"/>
        <g transform="scale(0.7) translate(0 8)" fill="#ffd23e"><path d="M0 -22 L6 -6 L23 -5 L9 6 L14 22 L0 13 L-14 22 L-9 6 L-23 -5 L-6 -6 Z" stroke="#c47f12" stroke-width="3"/></g>
        <circle cx="-20" cy="-30" r="4" fill="#fff" opacity="0.5"/>
      </g>
    </svg>`;
  }

  // Confetti burst — appended to body, cleans itself up.
  function confetti(x, y, golden) {
    const layer = document.createElement("div");
    layer.className = "lg-confetti-layer";
    layer.style.left = `${x}px`;
    layer.style.top = `${y}px`;
    const colors = golden
      ? ["#ffc22e", "#ffe9a8", "#ff7d96", "#54c6ff", "#ffffff"]
      : ["#54c6ff", "#98dc74", "#ff7d96", "#ffc22e"];
    const count = golden ? 26 : 14;
    for (let i = 0; i < count; i += 1) {
      const p = document.createElement("i");
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.7;
      const dist = 70 + Math.random() * (golden ? 130 : 80);
      p.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
      p.style.setProperty("--dy", `${Math.sin(angle) * dist - 40}px`);
      p.style.setProperty("--rot", `${Math.random() * 720 - 360}deg`);
      p.style.background = colors[i % colors.length];
      if (i % 3) p.classList.add("is-round");
      p.style.animationDelay = `${Math.random() * 80}ms`;
      layer.appendChild(p);
    }
    document.body.appendChild(layer);
    setTimeout(() => layer.remove(), 1300);
  }

  ns.LettersArt = {
    keyMascot, blobCard, creature, icon, backdrop, dayPhase, PHASES, mapStop,
    bloomCluster, confetti, ICONS, pet, egg, sticker, stickerPack, skillFlower,
  };
})(window.MiftahGame || (window.MiftahGame = {}));
