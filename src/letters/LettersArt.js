// Hand-built SVG art for the standalone Letter Garden kids' game. Everything
// visual lives here as string builders: the golden key mascot (Miftah = key),
// the blob buddies who hold the letters, the journey map scenery, creatures,
// and icon-only controls — no words anywhere, the art IS the interface.
//
// Visual system ("Toca-soft"): saturated toy colors, radial-gradient bodies
// with a light source at the upper-left, soft plum shadows (never black),
// and one quirky detail per drawing. Gradient defs get unique ids because a
// url(#…) reference breaks when its defining screen is display:none.
(function (ns) {
  const INK = "#3a2c48"; // the softest "black" in the whole game
  const SHADOW = "rgba(67, 49, 92, 0.18)";

  let uid = 0;
  const gradId = () => `lgg${(uid += 1)}`;

  // A friendly face used by every character: white eyes that blink via CSS.
  const face = (x, y, s, mood = "happy") => `
    <g class="art-face" transform="translate(${x} ${y}) scale(${s})">
      <g class="art-eyes">
        <ellipse cx="-11" cy="0" rx="6.6" ry="7.2" fill="#fff"/>
        <ellipse cx="11" cy="0" rx="6.6" ry="7.2" fill="#fff"/>
        <circle class="art-pupil" cx="-9.6" cy="1" r="3.1" fill="${INK}"/>
        <circle class="art-pupil" cx="12.4" cy="1" r="3.1" fill="${INK}"/>
        <circle cx="-8.4" cy="-0.4" r="1.2" fill="#fff"/>
        <circle cx="13.6" cy="-0.4" r="1.2" fill="#fff"/>
      </g>
      ${mood === "open"
        ? `<ellipse cx="0" cy="12.5" rx="6" ry="7" fill="#7c2d4a"/><ellipse cx="0" cy="15.4" rx="3.8" ry="3.2" fill="#ff9db1"/>`
        : mood === "sad"
          ? `<path d="M-6 14 Q0 8.5 6 14" fill="none" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/>`
          : `<path d="M-6 10 Q0 16.5 6 10" fill="none" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/>`}
      <ellipse cx="-17" cy="7.5" rx="4.2" ry="3.4" fill="#ff9db1" opacity="0.6"/>
      <ellipse cx="17" cy="7.5" rx="4.2" ry="3.4" fill="#ff9db1" opacity="0.6"/>
    </g>`;

  // Shared body gradient: light from the upper-left, toy-plastic shine.
  const bodyGrad = (id, hue, sat = 78, lum = 62) => `
    <radialGradient id="${id}" cx="0.36" cy="0.28" r="1">
      <stop offset="0" stop-color="hsl(${hue} ${sat + 10}% ${lum + 20}%)"/>
      <stop offset="0.68" stop-color="hsl(${hue} ${sat}% ${lum}%)"/>
      <stop offset="1" stop-color="hsl(${hue} ${sat - 10}% ${lum - 14}%)"/>
    </radialGradient>`;

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

  // A blob buddy holding up a card — the universal "look at this" frame for
  // letters, syllables and words. Hue varies per world. The card is narrower
  // than the body and gripped by two little hands, so the creature reads as
  // a character showing you something, not furniture wearing a sign.
  function blobCard({ hue = 150, label = "", size = 230, latin = false } = {}) {
    const id = gradId();
    const body = `hsl(${hue} 72% 62%)`;
    const rim = `hsl(${hue} 62% 40%)`;
    return `
    <svg class="art-blob" viewBox="0 0 220 260" width="${size}" height="${size * 1.18}" aria-hidden="true">
      <defs>${bodyGrad(id, hue)}</defs>
      <g class="art-blob-body">
        <ellipse cx="110" cy="251" rx="64" ry="9" fill="${SHADOW}"/>
        <path d="M78 28 Q66 4 96 16 Z" fill="${body}" stroke="${rim}" stroke-width="3.4"/>
        <path d="M142 28 Q154 4 124 16 Z" fill="${body}" stroke="${rim}" stroke-width="3.4"/>
        <path d="M110 16 C162 16 188 58 188 120 C188 196 162 242 110 242 C58 242 32 196 32 120 C32 58 58 16 110 16 Z"
          fill="url(#${id})"/>
        <ellipse cx="74" cy="52" rx="16" ry="11" fill="#fff" opacity="0.35"/>
        ${face(110, 72, 1.15)}
        <ellipse cx="80" cy="247" rx="19" ry="8" fill="${rim}"/>
        <ellipse cx="140" cy="247" rx="19" ry="8" fill="${rim}"/>
      </g>
      <g class="art-blob-card">
        <rect x="48" y="128" width="124" height="94" rx="16" fill="hsl(${hue} 45% 42%)"/>
        <rect x="48" y="122" width="124" height="94" rx="16" fill="#fffaf0"/>
        ${cardGlyph(label, 110, 168, latin)}
        <circle cx="48" cy="152" r="10" fill="${body}" stroke="${rim}" stroke-width="3"/>
        <circle cx="172" cy="152" r="10" fill="${body}" stroke="${rim}" stroke-width="3"/>
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

  // The hungry creature for the feeding game — mouth wide open, pure appetite.
  function creature({ hue = 275, size = 210 } = {}) {
    const id = gradId();
    return `
    <svg class="art-creature" viewBox="0 0 220 226" width="${size}" height="${size * 1.03}" aria-hidden="true">
      <defs>${bodyGrad(id, hue, 72, 60)}</defs>
      <g class="art-creature-body">
        <ellipse cx="110" cy="216" rx="72" ry="9" fill="${SHADOW}"/>
        <path d="M110 12 C176 12 206 62 204 118 C202 178 168 208 110 208 C52 208 18 178 16 118 C14 62 44 12 110 12 Z"
          fill="url(#${id})"/>
        <path d="M52 20 L64 46 L40 44 Z" fill="hsl(${hue} 62% 40%)"/>
        <path d="M168 20 L156 46 L180 44 Z" fill="hsl(${hue} 62% 40%)"/>
        <ellipse cx="70" cy="42" rx="14" ry="10" fill="#fff" opacity="0.35"/>
        ${face(110, 74, 1.25, "happy")}
        <g class="art-creature-mouth">
          <ellipse cx="110" cy="152" rx="44" ry="34" fill="#5d1f3d"/>
          <ellipse cx="110" cy="168" rx="26" ry="14" fill="#ff8fa3"/>
          <path d="M74 134 L86 148 L98 132 L110 148 L122 132 L134 148 L146 134" fill="#fff"/>
        </g>
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
    morning: { hi: "#ffe3b0", lo: "#eef9e4", far: "#c9ecb0", mid: "#9adf78", near: "#67c94e" },
    day: { hi: "#8fd6ff", lo: "#e4f9ea", far: "#c4ecab", mid: "#98dc74", near: "#5cc23e" },
    sunset: { hi: "#ffc9a3", lo: "#ffe9d6", far: "#d3e59a", mid: "#a2d36a", near: "#63b544" },
    night: { hi: "#2c2a55", lo: "#4a4a80", far: "#3e6653", mid: "#356b48", near: "#2a5c3c" },
  };

  function dayPhase(hour = new Date().getHours()) {
    if (hour >= 5 && hour < 10) return "morning";
    if (hour >= 10 && hour < 16) return "day";
    if (hour >= 16 && hour < 19) return "sunset";
    return "night";
  }

  // Sky, sun/moon, clouds and rolling hills — the fixed backdrop of every
  // screen, phase-aware.
  function backdrop(phase = dayPhase()) {
    const p = PHASES[phase] || PHASES.day;
    const night = phase === "night";
    const celestial = night
      ? `<g class="art-moon">
           <circle cx="660" cy="90" r="46" fill="#f4ecc8"/>
           <circle cx="644" cy="80" r="9" fill="#ddd3a8"/><circle cx="676" cy="104" r="6" fill="#ddd3a8"/>
           <circle cx="672" cy="72" r="4.4" fill="#ddd3a8"/>
           <circle cx="660" cy="90" r="58" fill="#f4ecc8" opacity="0.16"/>
         </g>
         <g fill="#fff8d8" class="art-stars">
           ${[[90, 60, 3], [220, 120, 2.4], [340, 50, 3.4], [470, 140, 2.2], [560, 40, 2.8], [150, 190, 2], [720, 200, 2.6], [400, 220, 2.2]]
             .map(([x, y, r], i) => `<circle cx="${x}" cy="${y}" r="${r}" style="animation-delay:${i * 0.6}s"/>`)
             .join("")}
         </g>`
      : `<g class="art-sun-glow">
           <circle cx="670" cy="90" r="52" fill="${phase === "sunset" ? "#ffab5e" : "#ffd23e"}"/>
           <circle cx="670" cy="90" r="68" fill="${phase === "sunset" ? "#ffab5e" : "#ffd23e"}" opacity="0.3"/>
           <circle cx="652" cy="74" r="14" fill="#fff" opacity="0.4"/>
         </g>`;
    return `
    <svg class="art-backdrop" viewBox="0 0 800 600" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      ${celestial}
      <g fill="${night ? "#8f8cc0" : "#ffffff"}" opacity="${night ? 0.5 : 0.92}" class="art-clouds">
        <g class="art-cloud-a"><ellipse cx="150" cy="110" rx="58" ry="24"/><ellipse cx="196" cy="98" rx="40" ry="20"/></g>
        <g class="art-cloud-b"><ellipse cx="420" cy="70" rx="46" ry="18"/><ellipse cx="456" cy="60" rx="30" ry="14"/></g>
      </g>
      <path d="M0 440 Q140 380 300 430 Q460 478 620 420 Q720 396 800 428 L800 600 L0 600 Z" fill="${p.far}"/>
      <path d="M0 470 Q200 396 420 460 Q620 522 800 444 L800 600 L0 600 Z" fill="${p.mid}"/>
      <path d="M0 520 Q260 452 520 520 Q680 558 800 520 L800 600 L0 600 Z" fill="${p.near}"/>
      <g fill="${night ? "#1f4a30" : "#3d9c3f"}">
        <circle cx="120" cy="470" r="26"/><rect x="115" y="470" width="10" height="34" rx="4"/>
        <circle cx="700" cy="500" r="30"/><rect x="694" y="500" width="12" height="38" rx="5"/>
      </g>
      <g fill="#ff7d96"><circle cx="250" cy="520" r="7"/><circle cx="560" cy="545" r="7"/><circle cx="380" cy="555" r="7"/></g>
      ${night ? `<g class="art-fireflies" fill="#ffe98a">${[[210, 480], [470, 510], [650, 540]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="4" style="animation-delay:${i * 1.1}s"/>`).join("")}</g>` : ""}
    </svg>`;
  }

  // One map stop: a chunky candy button with a darker press-edge (Duolingo's
  // 3D button, Toca's gloss). Done = gold with stars, current = bright and
  // haloed, locked = a soft pebble.
  function mapStop({ hue, label, status, stars = 0, latin = false }) {
    const id = gradId();
    const grad =
      status === "done"
        ? `<radialGradient id="${id}" cx="0.36" cy="0.3" r="1">
             <stop offset="0" stop-color="#ffe89c"/><stop offset="0.7" stop-color="#ffc22e"/><stop offset="1" stop-color="#e89a1e"/>
           </radialGradient>`
        : status === "current"
          ? bodyGrad(id, hue, 82, 58)
          : `<radialGradient id="${id}" cx="0.36" cy="0.3" r="1">
               <stop offset="0" stop-color="#e6e0f2"/><stop offset="1" stop-color="#c2b8d8"/>
             </radialGradient>`;
    const edge = status === "done" ? "#c47f12" : status === "current" ? `hsl(${hue} 62% 36%)` : "#a191c2";
    const starRow = [0, 1, 2]
      .map(
        (i) =>
          `<g transform="translate(${(i - 1) * 26} 56) scale(0.32)" class="${i < stars ? "map-star-on" : "map-star-off"}"><g transform="translate(-32 -32)">${ICONS.star}</g></g>`,
      )
      .join("");
    return `
    <svg viewBox="-60 -62 120 142" class="map-stop-art" aria-hidden="true">
      <defs>${grad}</defs>
      <ellipse cy="52" rx="42" ry="10" fill="${SHADOW}"/>
      <circle cy="7" r="44" fill="${edge}"/>
      <circle r="44" fill="url(#${id})"/>
      <path d="M-31 -26 A40 40 0 0 1 5 -43" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity="0.5"/>
      ${
        status === "locked"
          ? `<g transform="translate(-22 -24) scale(0.7)" fill="#84739f">${ICONS.lock}</g>`
          : `<text y="${latin ? 8 : 16}" text-anchor="middle" font-family="${latin ? "ui-rounded, system-ui, sans-serif" : "'Amiri Quran', serif"}" font-size="${latin ? 26 : [...label.replace(/[ً-ْٰٓ-ٟؐ-ؚۖ-ۭ]/g, "")].length >= 3 ? 28 : 42}" fill="#fffaf0" style="paint-order:stroke" stroke="rgba(67,49,92,0.3)" stroke-width="2" ${latin ? "" : `direction="rtl"`}>${label}</text>`
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
        <rect x="-1.8" y="0" width="3.6" height="16" rx="1.8" fill="#3d9c3f"/>
        ${[0, 60, 120, 180, 240, 300].map((a) => `<ellipse rx="4.6" ry="7.4" transform="rotate(${a}) translate(0 -7.4)" fill="hsl(${hue} 88% 70%)"/>`).join("")}
        <circle r="4.4" fill="#ffd23e"/>
      </g>`;
    });
    return `
    <svg viewBox="-45 -28 90 52" width="${size}" height="${size * 0.58}" aria-hidden="true" class="art-bloom-cluster">
      <ellipse cy="20" rx="36" ry="6" fill="rgba(67,49,92,0.10)"/>
      ${flowers.join("")}
    </svg>`;
  }

  // ---------- the Letter Pet ----------
  // The creature the child hatches and TEACHES. Species share one core body
  // circle so the face and every accessory fits all of them; each species
  // adds its own ears, tail and quirk. Bodies beyond the blob are unlocked
  // with earned stars — the pet room is the shop.

  ns.LETTERS_BODIES = [
    { id: "blob", cost: 0 },
    { id: "bunny", cost: 20 },
    { id: "chick", cost: 20 },
    { id: "cat", cost: 25 },
    { id: "dragon", cost: 30 },
  ];

  // Species parts drawn around the shared r=46 body circle at cy=4.
  // `back` renders behind the body, `front` on top of it.
  const SPECIES = {
    blob: (body, rim) => ({
      back: `
        <path d="M-18 -38 Q-30 -60 -6 -46 Z" fill="${body}" stroke="${rim}" stroke-width="3.4"/>
        <path d="M18 -38 Q30 -60 6 -46 Z" fill="${body}" stroke="${rim}" stroke-width="3.4"/>
        <path d="M42 30 Q61 34 54 47 Q47 53 41 44 Z" fill="${body}" stroke="${rim}" stroke-width="3.4"/>`,
      front: "",
    }),
    bunny: (body, rim, belly) => ({
      back: `
        <path d="M-24 -38 Q-34 -86 -12 -66 Q-4 -56 -8 -40 Z" fill="${body}" stroke="${rim}" stroke-width="3.4"/>
        <path d="M24 -38 Q34 -86 12 -66 Q4 -56 8 -40 Z" fill="${body}" stroke="${rim}" stroke-width="3.4"/>
        <path d="M-21 -44 Q-26 -74 -13 -60 Q-9 -52 -12 -44 Z" fill="${belly}"/>
        <path d="M21 -44 Q26 -74 13 -60 Q9 -52 12 -44 Z" fill="${belly}"/>
        <circle cx="44" cy="36" r="10" fill="${belly}" stroke="${rim}" stroke-width="3"/>`,
      front: "",
    }),
    chick: (body, rim, belly) => ({
      back: `
        <path d="M-4 -50 Q-10 -66 0 -60 Q6 -68 8 -56 Q16 -60 10 -48 Z" fill="#ffb03a" stroke="#d98a14" stroke-width="3"/>
        <path d="M-44 6 Q-62 14 -50 30 Q-42 38 -34 26 Z" fill="${body}" stroke="${rim}" stroke-width="3.4"/>
        <path d="M44 6 Q62 14 50 30 Q42 38 34 26 Z" fill="${body}" stroke="${rim}" stroke-width="3.4"/>
        <path d="M-6 46 Q-16 62 0 58 Q16 62 6 46 Z" fill="#ffb03a" stroke="#d98a14" stroke-width="3"/>`,
      front: `<path d="M-5 14 L0 21 L5 14 Q0 10 -5 14 Z" fill="#ffb03a" stroke="#d98a14" stroke-width="2.4"/>`,
    }),
    cat: (body, rim, belly) => ({
      back: `
        <path d="M-34 -26 Q-44 -58 -12 -42 Q-20 -34 -22 -26 Z" fill="${body}" stroke="${rim}" stroke-width="3.4"/>
        <path d="M34 -26 Q44 -58 12 -42 Q20 -34 22 -26 Z" fill="${body}" stroke="${rim}" stroke-width="3.4"/>
        <path d="M-30 -34 Q-35 -49 -20 -41 Z" fill="#ff9db1"/>
        <path d="M30 -34 Q35 -49 20 -41 Z" fill="#ff9db1"/>
        <path d="M40 28 Q66 24 60 2 Q57 -8 48 -2 Q54 6 46 12 Q34 18 38 30 Z" fill="${body}" stroke="${rim}" stroke-width="3.4"/>`,
      front: `
        <g stroke="${rim}" stroke-width="2" stroke-linecap="round" opacity="0.8">
          <path d="M-28 4 L-44 0 M-28 9 L-44 10 M28 4 L44 0 M28 9 L44 10"/>
        </g>`,
    }),
    dragon: (body, rim, belly) => ({
      back: `
        <path d="M-16 -42 L-8 -64 L-1 -46 L7 -68 L14 -46 L20 -60 L23 -41 Z" fill="${belly}" stroke="${rim}" stroke-width="3"/>
        <path d="M-44 -8 Q-74 -26 -66 2 Q-60 16 -40 12 Z" fill="${belly}" stroke="${rim}" stroke-width="3.4"/>
        <path d="M44 -8 Q74 -26 66 2 Q60 16 40 12 Z" fill="${belly}" stroke="${rim}" stroke-width="3.4"/>
        <path d="M38 34 Q62 44 58 56 L48 50 Q54 58 44 60 Q32 58 34 42 Z" fill="${body}" stroke="${rim}" stroke-width="3.4"/>
        <path d="M-16 -48 Q-20 -58 -12 -54 Z" fill="${rim}"/>
        <path d="M16 -48 Q20 -58 12 -54 Z" fill="${rim}"/>`,
      front: "",
    }),
  };

  function pet({ hue = 200, species = "blob", stage = 1, worn = [], size = 140, mood = "happy" } = {}) {
    const scale = stage >= 3 ? 1.14 : stage >= 2 ? 1 : 0.86;
    const id = gradId();
    const body = `hsl(${hue} 72% 62%)`;
    const rim = `hsl(${hue} 62% 40%)`;
    const belly = `hsl(${hue} 78% 82%)`;
    const parts = (SPECIES[species] || SPECIES.blob)(body, rim, belly);
    return `
    <svg class="art-pet" viewBox="-70 -74 140 152" width="${size}" height="${size * 1.09}" aria-hidden="true">
      <defs>${bodyGrad(id, hue, 72, 62)}</defs>
      <g class="art-pet-body" transform="scale(${scale})">
        <ellipse cy="66" rx="36" ry="7.5" fill="${SHADOW}"/>
        ${stage >= 3 ? `<g opacity="0.9">${[-46, 46].map((x) => `<circle cx="${x}" cy="-40" r="3.4" fill="#ffd23e"/>`).join("")}<circle cx="0" cy="-58" r="4" fill="#ffd23e"/></g>` : ""}
        ${parts.back}
        ${stage >= 2 ? `<path d="M-40 8 Q-58 2 -50 22 Q-44 30 -36 24 Z" fill="${belly}" stroke="${rim}" stroke-width="3"/><path d="M40 8 Q58 2 50 22 Q44 30 36 24 Z" fill="${belly}" stroke="${rim}" stroke-width="3"/>` : ""}
        <circle cy="4" r="46" fill="url(#${id})"/>
        <ellipse cy="22" rx="26" ry="20" fill="${belly}"/>
        <ellipse cx="-17" cy="-17" rx="10" ry="8" fill="#fff" opacity="0.45"/>
        <ellipse cx="-18" cy="52" rx="11" ry="7" fill="${rim}"/>
        <ellipse cx="18" cy="52" rx="11" ry="7" fill="${rim}"/>
        ${face(0, -4, 1.1, mood)}
        ${parts.front}
        ${worn.map((wid) => ACCESSORY_ART[wid] || "").join("")}
      </g>
    </svg>`;
  }

  const ACCESSORY_ART = {
    cap: `<g transform="translate(0 -46)"><path d="M-24 2 A24 16 0 0 1 24 2 L26 6 L-30 6 Z" fill="#f0503f" stroke="#b32c1d" stroke-width="3"/><circle cy="-12" r="4" fill="#ffd23e"/></g>`,
    crown: `<g transform="translate(0 -48)"><path d="M-20 8 L-20 -8 L-10 0 L0 -12 L10 0 L20 -8 L20 8 Z" fill="#ffc22e" stroke="#c47f12" stroke-width="3"/><circle cy="2" r="3.4" fill="#f0503f"/></g>`,
    bow: `<g transform="translate(26 -34) rotate(20)"><path d="M0 0 L-14 -9 L-14 9 Z M0 0 L14 -9 L14 9 Z" fill="#ff7d96" stroke="#cf3f60" stroke-width="3"/><circle r="4" fill="#cf3f60"/></g>`,
    glasses: `<g transform="translate(0 -6)"><circle cx="-12" cy="0" r="9" fill="none" stroke="${INK}" stroke-width="3.4"/><circle cx="12" cy="0" r="9" fill="none" stroke="${INK}" stroke-width="3.4"/><path d="M-3 0 H3" stroke="${INK}" stroke-width="3.4"/></g>`,
    scarf: `<g transform="translate(0 22)"><path d="M-24 0 Q0 12 24 0 L22 10 Q0 20 -22 10 Z" fill="#2fc487" stroke="#1d8a5c" stroke-width="3"/><path d="M14 8 L20 30 L8 26 Z" fill="#2fc487" stroke="#1d8a5c" stroke-width="3"/></g>`,
    flower: `<g transform="translate(-27 -36)">${[0, 60, 120, 180, 240, 300].map((a) => `<ellipse rx="5" ry="8" transform="rotate(${a}) translate(0 -8)" fill="#ff7d96"/>`).join("")}<circle r="5" fill="#ffd23e"/></g>`,
    balloon: `<g transform="translate(42 -30)"><path d="M0 18 Q-3 34 0 40" fill="none" stroke="#84739f" stroke-width="2.4"/><ellipse rx="13" ry="16" fill="#54c6ff" stroke="#1f87c2" stroke-width="3"/><circle cx="-4" cy="-5" r="3.4" fill="#fff" opacity="0.7"/></g>`,
    wand: `<g transform="translate(-42 6) rotate(-24)"><rect x="-2" y="0" width="4" height="34" rx="2" fill="#c47f12"/><g transform="translate(0 -6) scale(0.32)" fill="#ffd23e"><path d="M0 -26 L7 -6 L27 -5 L11 8 L16 27 L0 16 L-16 27 L-11 8 L-27 -5 L-7 -6 Z" stroke="#c47f12" stroke-width="6"/></g></g>`,
    taqiyah: `<g transform="translate(0 -46)"><path d="M-22 6 A22 14 0 0 1 22 6 L22 10 L-22 10 Z" fill="#fffaf0" stroke="#cbbf9e" stroke-width="3"/><path d="M-14 -2 Q0 -8 14 -2 M-18 4 Q0 -2 18 4" fill="none" stroke="#cbbf9e" stroke-width="2"/></g>`,
    cape: `<g transform="translate(0 4)"><path d="M-34 -22 Q-52 20 -38 44 L-20 34 Q-30 6 -26 -18 Z" fill="#f0503f" stroke="#b32c1d" stroke-width="3"/><path d="M34 -22 Q52 20 38 44 L20 34 Q30 6 26 -18 Z" fill="#f0503f" stroke="#b32c1d" stroke-width="3"/></g>`,
    medal: `<g transform="translate(0 30)"><path d="M-6 -14 L0 -4 L6 -14" stroke="#2f8a1f" stroke-width="4" fill="none"/><circle cy="4" r="9" fill="#ffc22e" stroke="#c47f12" stroke-width="3"/><path d="M0 -1 L2 3 L6 3 L3 6 L4 10 L0 8 L-4 10 L-3 6 L-6 3 L-2 3 Z" fill="#fff6da"/></g>`,
    kite: `<g transform="translate(44 -22) rotate(14)"><path d="M0 -16 L12 0 L0 16 L-12 0 Z" fill="#54c6ff" stroke="#1f87c2" stroke-width="3"/><path d="M0 -16 V16 M-12 0 H12" stroke="#1f87c2" stroke-width="2"/><path d="M0 16 Q-4 26 0 34 Q4 40 0 46" fill="none" stroke="#84739f" stroke-width="2.4"/></g>`,
    sprout: `<g transform="translate(0 -50)"><path d="M0 10 Q0 2 0 -2" stroke="#2f8a1f" stroke-width="3.4" fill="none"/><path d="M0 -2 Q-12 -6 -13 -16 Q-2 -14 0 -2 Z" fill="#5cc23e" stroke="#2f8a1f" stroke-width="2.6"/><path d="M0 -2 Q12 -8 14 -17 Q3 -15 0 -2 Z" fill="#98dc74" stroke="#2f8a1f" stroke-width="2.6"/></g>`,
    moonpin: `<g transform="translate(-26 26)"><path d="M4 -10 A11 11 0 1 0 4 10 A8 8 0 1 1 4 -10" fill="#ffedb0" stroke="#c47f12" stroke-width="2.6"/><circle cx="8" cy="-9" r="2.4" fill="#ffd23e" stroke="#c47f12" stroke-width="1.6"/></g>`,
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
