// Hand-built SVG art for the standalone Letter Garden kids' game. Everything
// visual lives here as string builders: the golden key mascot (Miftah = key),
// the blob buddies who hold the letters, the journey map scenery, creatures,
// and icon-only controls — no words anywhere, the art IS the interface.
(function (ns) {
  // A friendly face used by every character: white eyes that blink via CSS.
  const face = (x, y, s, mood = "happy") => `
    <g class="art-face" transform="translate(${x} ${y}) scale(${s})">
      <g class="art-eyes">
        <circle cx="-11" cy="0" r="6.4" fill="#fff"/>
        <circle cx="11" cy="0" r="6.4" fill="#fff"/>
        <circle class="art-pupil" cx="-10" cy="1" r="3" fill="#2b2233"/>
        <circle class="art-pupil" cx="12" cy="1" r="3" fill="#2b2233"/>
        <circle cx="-9" cy="-1" r="1.1" fill="#fff"/>
        <circle cx="13" cy="-1" r="1.1" fill="#fff"/>
      </g>
      ${mood === "open"
        ? `<ellipse cx="0" cy="12" rx="5.5" ry="6.5" fill="#7c2d4a"/><ellipse cx="0" cy="14.6" rx="3.4" ry="3" fill="#ff8fa3"/>`
        : `<path d="M-6 10 Q0 16 6 10" fill="none" stroke="#2b2233" stroke-width="2.6" stroke-linecap="round"/>`}
      <circle cx="-17" cy="8" r="3.4" fill="#ff9db1" opacity="0.55"/>
      <circle cx="17" cy="8" r="3.4" fill="#ff9db1" opacity="0.55"/>
    </g>`;

  // The mascot: a round-headed golden key with a face. He hops on the map,
  // asks the questions from his speech bubble, and dances at every party.
  function keyMascot({ size = 120, mood = "happy" } = {}) {
    return `
    <svg class="art-mascot" viewBox="-60 -60 120 150" width="${size}" height="${size * 1.25}" aria-hidden="true">
      <g class="art-mascot-body">
        <rect x="-9" y="28" width="18" height="52" rx="8" fill="#d8a03c"/>
        <rect x="-9" y="62" width="30" height="11" rx="5" fill="#d8a03c"/>
        <rect x="-9" y="78" width="24" height="11" rx="5" fill="#d8a03c"/>
        <circle r="40" fill="#f3c24f"/>
        <circle r="40" fill="none" stroke="#c98f2e" stroke-width="5"/>
        <circle cy="-6" r="13" fill="#fdf6df"/>
        <circle cy="-6" r="13" fill="none" stroke="#c98f2e" stroke-width="4"/>
        <circle cx="-13" cy="-24" r="6" fill="#fff" opacity="0.5"/>
        ${face(0, 16, 1.05, mood)}
      </g>
    </svg>`;
  }

  // A blob buddy holding up a big card — the universal "look at this" frame
  // for letters, syllables and words. Hue varies per world.
  function blobCard({ hue = 150, label = "", size = 230, latin = false } = {}) {
    return `
    <svg class="art-blob" viewBox="0 0 220 250" width="${size}" height="${size * 1.13}" aria-hidden="true">
      <g class="art-blob-body">
        <path d="M40 210 Q30 130 62 108 Q40 92 52 72 Q78 40 110 44 Q142 40 168 72 Q180 92 158 108 Q190 130 180 210 Q176 236 110 238 Q44 236 40 210 Z"
          fill="hsl(${hue} 62% 62%)" stroke="hsl(${hue} 55% 40%)" stroke-width="6"/>
        <ellipse cx="78" cy="242" rx="20" ry="8" fill="hsl(${hue} 55% 40%)"/>
        <ellipse cx="142" cy="242" rx="20" ry="8" fill="hsl(${hue} 55% 40%)"/>
        ${face(110, 88, 1.15)}
      </g>
      <g class="art-blob-card">
        <rect x="38" y="118" width="144" height="104" rx="14" fill="#fffdf4" stroke="hsl(${hue} 45% 38%)" stroke-width="6"/>
        ${cardGlyph(label, 110, 170, latin)}
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
      font-size="${size}" fill="#2b2233" ${latin ? "" : `direction="rtl"`}>${label}</text>`;
  }

  // The hungry creature for the feeding game — mouth wide open, pure appetite.
  function creature({ hue = 275, size = 210 } = {}) {
    return `
    <svg class="art-creature" viewBox="0 0 220 220" width="${size}" height="${size}" aria-hidden="true">
      <g class="art-creature-body">
        <path d="M110 12 C176 12 206 62 204 118 C202 178 168 208 110 208 C52 208 18 178 16 118 C14 62 44 12 110 12 Z"
          fill="hsl(${hue} 55% 62%)" stroke="hsl(${hue} 50% 42%)" stroke-width="7"/>
        <path d="M52 20 L64 46 L40 44 Z" fill="hsl(${hue} 50% 42%)"/>
        <path d="M168 20 L156 46 L180 44 Z" fill="hsl(${hue} 50% 42%)"/>
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
  };

  function icon(name, size = 30) {
    return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true">${ICONS[name] || ""}</svg>`;
  }

  // Sky, sun, clouds and rolling hills — the fixed backdrop of every screen.
  function backdrop() {
    return `
    <svg class="art-backdrop" viewBox="0 0 800 600" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <circle cx="670" cy="90" r="52" fill="#ffd95e"/>
      <circle cx="670" cy="90" r="66" fill="#ffd95e" opacity="0.35"/>
      <g fill="#ffffff" opacity="0.9">
        <ellipse cx="150" cy="110" rx="58" ry="24"/><ellipse cx="196" cy="98" rx="40" ry="20"/>
        <ellipse cx="420" cy="70" rx="46" ry="18"/><ellipse cx="456" cy="60" rx="30" ry="14"/>
      </g>
      <path d="M0 470 Q200 380 420 460 Q620 530 800 440 L800 600 L0 600 Z" fill="#8fd483"/>
      <path d="M0 520 Q260 450 520 520 Q680 560 800 520 L800 600 L0 600 Z" fill="#6fbf67"/>
      <g fill="#4d9e52">
        <circle cx="120" cy="470" r="26"/><rect x="115" y="470" width="10" height="34" rx="4"/>
        <circle cx="700" cy="500" r="30"/><rect x="694" y="500" width="12" height="38" rx="5"/>
      </g>
      <g fill="#ff8fa3"><circle cx="250" cy="520" r="7"/><circle cx="560" cy="545" r="7"/><circle cx="380" cy="555" r="7"/></g>
    </svg>`;
  }

  // One map stop: a big round button. Done = gold with a star, current =
  // glowing and bouncing, locked = grey with a lock.
  function mapStop({ hue, label, status, stars = 0, latin = false }) {
    const fill =
      status === "done" ? "#f3c24f" : status === "current" ? `hsl(${hue} 62% 60%)` : "#b9b3c4";
    const ring =
      status === "done" ? "#c98f2e" : status === "current" ? `hsl(${hue} 55% 40%)` : "#8f8a9c";
    const starRow = [0, 1, 2]
      .map(
        (i) =>
          `<g transform="translate(${(i - 1) * 26} 58) scale(0.32)" class="${i < stars ? "map-star-on" : "map-star-off"}">${ICONS.star}</g>`,
      )
      .join("");
    return `
    <svg viewBox="-60 -60 120 140" class="map-stop-art" aria-hidden="true">
      <circle r="44" fill="${fill}" stroke="${ring}" stroke-width="7"/>
      <circle cx="-14" cy="-18" r="9" fill="#fff" opacity="0.4"/>
      ${
        status === "locked"
          ? `<g transform="translate(-22 -24) scale(0.7)" fill="#6f6a7d">${ICONS.lock}</g>`
          : `<text y="${latin ? 8 : 16}" text-anchor="middle" font-family="${latin ? "ui-rounded, system-ui, sans-serif" : "'Amiri Quran', serif"}" font-size="${latin ? 26 : [...label.replace(/[ً-ْٰٓ-ٟؐ-ؚۖ-ۭ]/g, "")].length >= 3 ? 28 : 42}" fill="#fffdf4" ${latin ? "" : `direction="rtl"`}>${label}</text>`
      }
      ${status === "done" ? starRow : status === "current" ? starRow : ""}
    </svg>`;
  }

  // ---------- the Letter Pet ----------
  // The creature the child hatches and TEACHES. It grows with the child
  // (baby → kid → reader) and wears accessories bought with earned stars.

  const ACCESSORY_ART = {
    cap: `<g transform="translate(0 -46)"><path d="M-24 2 A24 16 0 0 1 24 2 L26 6 L-30 6 Z" fill="#e2574c" stroke="#a33127" stroke-width="3"/><circle cy="-12" r="4" fill="#ffd95e"/></g>`,
    crown: `<g transform="translate(0 -48)"><path d="M-20 8 L-20 -8 L-10 0 L0 -12 L10 0 L20 -8 L20 8 Z" fill="#f3c24f" stroke="#c98f2e" stroke-width="3"/><circle cy="2" r="3.4" fill="#e2574c"/></g>`,
    bow: `<g transform="translate(26 -34) rotate(20)"><path d="M0 0 L-14 -9 L-14 9 Z M0 0 L14 -9 L14 9 Z" fill="#ff8fa3" stroke="#c2536b" stroke-width="3"/><circle r="4" fill="#c2536b"/></g>`,
    glasses: `<g transform="translate(0 -6)"><circle cx="-12" cy="0" r="9" fill="none" stroke="#4d3f2a" stroke-width="3.4"/><circle cx="12" cy="0" r="9" fill="none" stroke="#4d3f2a" stroke-width="3.4"/><path d="M-3 0 H3" stroke="#4d3f2a" stroke-width="3.4"/></g>`,
    scarf: `<g transform="translate(0 22)"><path d="M-24 0 Q0 12 24 0 L22 10 Q0 20 -22 10 Z" fill="#46b187" stroke="#2c7a5b" stroke-width="3"/><path d="M14 8 L20 30 L8 26 Z" fill="#46b187" stroke="#2c7a5b" stroke-width="3"/></g>`,
    flower: `<g transform="translate(-27 -36)">${[0, 60, 120, 180, 240, 300].map((a) => `<ellipse rx="5" ry="8" transform="rotate(${a}) translate(0 -8)" fill="#ff8fa3"/>`).join("")}<circle r="5" fill="#ffd95e"/></g>`,
    balloon: `<g transform="translate(42 -30)"><path d="M0 18 Q-3 34 0 40" fill="none" stroke="#8f8a9c" stroke-width="2.4"/><ellipse rx="13" ry="16" fill="#7cd4ff" stroke="#3b8fbe" stroke-width="3"/><circle cx="-4" cy="-5" r="3.4" fill="#fff" opacity="0.7"/></g>`,
    wand: `<g transform="translate(-42 6) rotate(-24)"><rect x="-2" y="0" width="4" height="34" rx="2" fill="#c98f2e"/><g transform="translate(0 -6) scale(0.32)" fill="#ffd95e">${"" /* star */}<path d="M0 -26 L7 -6 L27 -5 L11 8 L16 27 L0 16 L-16 27 L-11 8 L-27 -5 L-7 -6 Z" stroke="#c98f2e" stroke-width="6"/></g></g>`,
    taqiyah: `<g transform="translate(0 -46)"><path d="M-22 6 A22 14 0 0 1 22 6 L22 10 L-22 10 Z" fill="#fffdf4" stroke="#c9c2b0" stroke-width="3"/><path d="M-14 -2 Q0 -8 14 -2 M-18 4 Q0 -2 18 4" fill="none" stroke="#c9c2b0" stroke-width="2"/></g>`,
    cape: `<g transform="translate(0 4)"><path d="M-34 -22 Q-52 20 -38 44 L-20 34 Q-30 6 -26 -18 Z" fill="#e2574c" stroke="#a33127" stroke-width="3"/><path d="M34 -22 Q52 20 38 44 L20 34 Q30 6 26 -18 Z" fill="#e2574c" stroke="#a33127" stroke-width="3"/></g>`,
    medal: `<g transform="translate(0 30)"><path d="M-6 -14 L0 -4 L6 -14" stroke="#3f7a1f" stroke-width="4" fill="none"/><circle cy="4" r="9" fill="#f3c24f" stroke="#c98f2e" stroke-width="3"/><path d="M0 -1 L2 3 L6 3 L3 6 L4 10 L0 8 L-4 10 L-3 6 L-6 3 L-2 3 Z" fill="#fff6da"/></g>`,
    kite: `<g transform="translate(44 -22) rotate(14)"><path d="M0 -16 L12 0 L0 16 L-12 0 Z" fill="#7cd4ff" stroke="#3b8fbe" stroke-width="3"/><path d="M0 -16 V16 M-12 0 H12" stroke="#3b8fbe" stroke-width="2"/><path d="M0 16 Q-4 26 0 34 Q4 40 0 46" fill="none" stroke="#8f8a9c" stroke-width="2.4"/></g>`,
    sprout: `<g transform="translate(0 -50)"><path d="M0 10 Q0 2 0 -2" stroke="#3f7a1f" stroke-width="3.4" fill="none"/><path d="M0 -2 Q-12 -6 -13 -16 Q-2 -14 0 -2 Z" fill="#6fbf67" stroke="#3f7a1f" stroke-width="2.6"/><path d="M0 -2 Q12 -8 14 -17 Q3 -15 0 -2 Z" fill="#8fd483" stroke="#3f7a1f" stroke-width="2.6"/></g>`,
    moonpin: `<g transform="translate(-26 26)"><path d="M4 -10 A11 11 0 1 0 4 10 A8 8 0 1 1 4 -10" fill="#ffedb0" stroke="#c98f2e" stroke-width="2.6"/><circle cx="8" cy="-9" r="2.4" fill="#ffd95e" stroke="#c98f2e" stroke-width="1.6"/></g>`,
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

  function pet({ hue = 200, stage = 1, worn = [], size = 140, mood = "happy" } = {}) {
    const scale = stage >= 3 ? 1.14 : stage >= 2 ? 1 : 0.86;
    const body = `hsl(${hue} 58% 64%)`;
    const rim = `hsl(${hue} 52% 42%)`;
    const belly = `hsl(${hue} 65% 80%)`;
    return `
    <svg class="art-pet" viewBox="-62 -66 124 140" width="${size}" height="${size * 1.13}" aria-hidden="true">
      <g class="art-pet-body" transform="scale(${scale})">
        ${stage >= 3 ? `<g opacity="0.85">${[-46, 46].map((x) => `<circle cx="${x}" cy="-40" r="3.4" fill="#ffd95e"/>`).join("")}<circle cx="0" cy="-58" r="4" fill="#ffd95e"/></g>` : ""}
        <path d="M-16 -48 Q-24 -66 -6 -58 Z" fill="${body}" stroke="${rim}" stroke-width="3.4"/>
        <path d="M16 -48 Q24 -66 6 -58 Z" fill="${body}" stroke="${rim}" stroke-width="3.4"/>
        ${stage >= 2 ? `<path d="M-40 8 Q-58 2 -50 22 Q-44 30 -36 24 Z" fill="${belly}" stroke="${rim}" stroke-width="3"/><path d="M40 8 Q58 2 50 22 Q44 30 36 24 Z" fill="${belly}" stroke="${rim}" stroke-width="3"/>` : ""}
        <circle cy="4" r="46" fill="${body}" stroke="${rim}" stroke-width="4.5"/>
        <ellipse cy="22" rx="26" ry="20" fill="${belly}"/>
        <circle cx="-16" cy="-16" r="9" fill="#fff" opacity="0.4"/>
        <ellipse cx="-18" cy="52" rx="11" ry="7" fill="${rim}"/>
        <ellipse cx="18" cy="52" rx="11" ry="7" fill="${rim}"/>
        <path d="M42 30 Q60 34 54 46 Q48 52 42 44" fill="${body}" stroke="${rim}" stroke-width="3.4"/>
        ${face(0, -4, 1.1, mood)}
        ${worn.map((id) => ACCESSORY_ART[id] || "").join("")}
      </g>
    </svg>`;
  }

  function egg({ size = 150, cracks = 0 } = {}) {
    return `
    <svg class="art-egg" viewBox="-50 -60 100 120" width="${size}" height="${size * 1.2}" aria-hidden="true">
      <g class="art-egg-body">
        <path d="M0 -52 C30 -52 42 -18 42 8 C42 36 24 52 0 52 C-24 52 -42 36 -42 8 C-42 -18 -30 -52 0 -52 Z"
          fill="#fdf3dd" stroke="#d8b25a" stroke-width="4"/>
        <circle cx="-12" cy="-22" r="8" fill="#fff" opacity="0.7"/>
        <g fill="#f3c24f" opacity="0.8"><circle cx="14" cy="6" r="5"/><circle cx="-16" cy="18" r="4"/><circle cx="4" cy="32" r="3.4"/></g>
        ${cracks >= 1 ? `<path d="M-20 -10 L-10 -2 L-16 8" fill="none" stroke="#b58a2e" stroke-width="3" stroke-linecap="round"/>` : ""}
        ${cracks >= 2 ? `<path d="M18 -18 L10 -8 L20 0 L12 10" fill="none" stroke="#b58a2e" stroke-width="3" stroke-linecap="round"/>` : ""}
      </g>
    </svg>`;
  }

  // ---------- the skill flower ----------
  // The check-up's wordless report card: five petals, one per skill
  // (identify / memorize / visualize / blend / write), each growing with the
  // child's latest check-up score. Buds mean "not tested yet".

  ns.LETTERS_SKILLS = [
    { id: "identify", hue: 200 },
    { id: "memorize", hue: 340 },
    { id: "visualize", hue: 268 },
    { id: "blend", hue: 160 },
    { id: "write", hue: 40 },
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
      const fill = score > 0 ? `hsl(${skill.hue} 62% 62%)` : "rgba(180, 172, 190, 0.5)";
      const rim = score > 0 ? `hsl(${skill.hue} 55% 42%)` : "rgba(120, 112, 130, 0.5)";
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
      <circle r="17" fill="#ffd95e" stroke="#c98f2e" stroke-width="3.4"/>
      ${face(0, -1, 0.55)}
    </svg>`;
  }

  // ---------- sticker collection ----------
  // Little wordless treasures bought with earned stars. Each is a compact
  // standalone drawing on a rounded card.

  const STICKER_ART = {
    sun: `<circle r="16" fill="#ffd95e"/><g stroke="#f3a53c" stroke-width="4" stroke-linecap="round">${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<path d="M0 -22 L0 -28" transform="rotate(${a})"/>`).join("")}</g>`,
    moon: `<path d="M8 -20 A22 22 0 1 0 8 20 A17 17 0 1 1 8 -20" fill="#ffedb0" stroke="#d8b25a" stroke-width="3"/>`,
    star: `<path d="M0 -22 L6 -6 L23 -5 L9 6 L14 22 L0 13 L-14 22 L-9 6 L-23 -5 L-6 -6 Z" fill="#f3c24f" stroke="#c98f2e" stroke-width="3"/>`,
    rainbow: `<g fill="none" stroke-width="5"><path d="M-22 14 A22 22 0 0 1 22 14" stroke="#e2574c"/><path d="M-16 14 A16 16 0 0 1 16 14" stroke="#f3c24f"/><path d="M-10 14 A10 10 0 0 1 10 14" stroke="#46b187"/></g><circle cx="-22" cy="16" r="5" fill="#fff"/><circle cx="22" cy="16" r="5" fill="#fff"/>`,
    palm: `<rect x="-3" y="-2" width="7" height="26" rx="3" fill="#a2591f"/><g fill="#46b187">${[-150, -110, -70, -30].map((a) => `<ellipse rx="16" ry="6" transform="translate(0 -6) rotate(${a}) translate(12 0)"/>`).join("")}</g>`,
    flower: `${[0, 60, 120, 180, 240, 300].map((a) => `<ellipse rx="7" ry="12" transform="rotate(${a}) translate(0 -12)" fill="#ff8fa3"/>`).join("")}<circle r="7" fill="#ffd95e"/>`,
    butterfly: `<g><ellipse cx="-11" cy="-8" rx="10" ry="12" fill="#7cd4ff" transform="rotate(-20 -11 -8)"/><ellipse cx="11" cy="-8" rx="10" ry="12" fill="#7cd4ff" transform="rotate(20 11 -8)"/><ellipse cx="-9" cy="9" rx="8" ry="9" fill="#ff8fa3" transform="rotate(20 -9 9)"/><ellipse cx="9" cy="9" rx="8" ry="9" fill="#ff8fa3" transform="rotate(-20 9 9)"/><rect x="-2.4" y="-14" width="5" height="28" rx="2.5" fill="#4d3f2a"/></g>`,
    bee: `<ellipse rx="15" ry="11" fill="#ffd95e" stroke="#4d3f2a" stroke-width="3"/><path d="M-5 -11 V11 M5 -11 V11" stroke="#4d3f2a" stroke-width="4"/><ellipse cx="-8" cy="-14" rx="7" ry="5" fill="#d8f6ff" opacity="0.9"/><ellipse cx="8" cy="-14" rx="7" ry="5" fill="#d8f6ff" opacity="0.9"/><circle cx="17" cy="-2" r="2.4" fill="#4d3f2a"/>`,
    dove: `<path d="M-18 4 Q-8 -14 8 -8 Q22 -4 20 8 Q10 18 -6 14 Z" fill="#fffdf4" stroke="#b9b3c4" stroke-width="3"/><path d="M-2 -6 Q-12 -18 2 -16 Z" fill="#fffdf4" stroke="#b9b3c4" stroke-width="3"/><circle cx="12" cy="-2" r="1.8" fill="#4d3f2a"/><path d="M20 2 L27 4 L20 7 Z" fill="#f3a53c"/>`,
    fish: `<path d="M-20 0 Q-4 -14 10 -8 Q20 -4 20 0 Q20 4 10 8 Q-4 14 -20 0 Z" fill="#7cd4ff" stroke="#3b8fbe" stroke-width="3"/><path d="M-20 0 L-28 -8 L-28 8 Z" fill="#3b8fbe"/><circle cx="10" cy="-2" r="2" fill="#2b2233"/>`,
    boat: `<path d="M-22 6 L22 6 L14 18 L-14 18 Z" fill="#a2591f" stroke="#6f3a12" stroke-width="3"/><path d="M2 6 L2 -20 L18 -2 Z" fill="#fffdf4" stroke="#b9b3c4" stroke-width="3"/>`,
    lantern: `<rect x="-4" y="-24" width="8" height="5" rx="2" fill="#c98f2e"/><path d="M-12 -18 L12 -18 L16 8 Q0 16 -16 8 Z" fill="#ffd95e" stroke="#c98f2e" stroke-width="3"/><circle cy="-2" r="6" fill="#fff" opacity="0.75"/>`,
    key: `<circle cx="0" cy="-12" r="10" fill="none" stroke="#f3c24f" stroke-width="6"/><rect x="-3" y="-4" width="6" height="26" rx="3" fill="#f3c24f"/><rect x="-3" y="12" width="12" height="5" rx="2" fill="#f3c24f"/><rect x="-3" y="20" width="9" height="5" rx="2" fill="#f3c24f"/>`,
    egg: `<path d="M0 -20 C12 -20 17 -7 17 3 C17 14 10 20 0 20 C-10 20 -17 14 -17 3 C-17 -7 -12 -20 0 -20 Z" fill="#fdf3dd" stroke="#d8b25a" stroke-width="3"/><circle cx="-5" cy="-8" r="3.4" fill="#fff"/>`,
    cat: `<circle cy="2" r="16" fill="#f3a53c" stroke="#a2591f" stroke-width="3"/><path d="M-12 -10 L-16 -22 L-5 -14 Z M12 -10 L16 -22 L5 -14 Z" fill="#f3a53c" stroke="#a2591f" stroke-width="3"/><circle cx="-6" cy="0" r="2" fill="#2b2233"/><circle cx="6" cy="0" r="2" fill="#2b2233"/><path d="M-3 7 Q0 10 3 7" fill="none" stroke="#2b2233" stroke-width="2"/>`,
    cloud: `<ellipse cx="-8" cy="2" rx="14" ry="10" fill="#fffdf4"/><ellipse cx="8" cy="-2" rx="13" ry="11" fill="#fffdf4"/><ellipse cx="0" cy="6" rx="20" ry="9" fill="#fffdf4"/><ellipse cx="0" cy="2" rx="19" ry="10" fill="none" stroke="#b9d8e8" stroke-width="3"/>`,
    // The Quranic animals — the island's cast, sticker-sized.
    camel: `<path d="M-18 12 Q-20 -2 -10 -4 Q-6 -12 2 -8 Q6 -14 12 -10 L14 -18 L18 -16 L16 -6 Q20 0 18 12 Z" fill="#d8a03c" stroke="#a2591f" stroke-width="3"/><rect x="-14" y="12" width="5" height="9" rx="2" fill="#a2591f"/><rect x="8" y="12" width="5" height="9" rx="2" fill="#a2591f"/><circle cx="14" cy="-13" r="1.6" fill="#2b2233"/>`,
    elephant: `<circle cx="-2" cy="0" r="15" fill="#b9b3c4" stroke="#8f8a9c" stroke-width="3"/><circle cx="-12" cy="-4" r="8" fill="#cfc9da" stroke="#8f8a9c" stroke-width="3"/><path d="M12 -4 Q22 0 18 12 Q16 16 12 14" fill="none" stroke="#8f8a9c" stroke-width="5" stroke-linecap="round"/><circle cx="4" cy="-4" r="2" fill="#2b2233"/>`,
    ant: `<circle cx="-11" cy="4" r="7" fill="#6b4a26"/><circle cx="0" cy="0" r="6" fill="#6b4a26"/><circle cx="10" cy="-4" r="7" fill="#6b4a26"/><path d="M8 -10 L4 -18 M14 -10 L18 -18" stroke="#6b4a26" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="-6" r="1.6" fill="#fff"/><path d="M-14 10 L-18 16 M-8 11 L-9 18 M0 6 L-2 14 M4 5 L8 13" stroke="#6b4a26" stroke-width="2.4" stroke-linecap="round"/>`,
    spider: `<circle cy="2" r="11" fill="#4d3f2a"/><circle cy="-10" r="6" fill="#4d3f2a"/><g stroke="#4d3f2a" stroke-width="2.6" stroke-linecap="round" fill="none"><path d="M-9 -2 Q-20 -8 -22 -16 M9 -2 Q20 -8 22 -16 M-11 4 Q-22 4 -25 -2 M11 4 Q22 4 25 -2 M-10 9 Q-18 16 -22 15 M10 9 Q18 16 22 15"/></g><circle cx="-2" cy="-11" r="1.5" fill="#fff"/><circle cx="2" cy="-11" r="1.5" fill="#fff"/>`,
    crow: `<path d="M-16 6 Q-12 -10 4 -10 Q16 -10 16 0 Q16 10 2 12 L-8 12 Z" fill="#3a3542" stroke="#211d29" stroke-width="3"/><path d="M14 -2 L23 0 L14 4 Z" fill="#f3a53c"/><circle cx="8" cy="-3" r="1.8" fill="#fff"/><path d="M-14 8 L-22 2" stroke="#211d29" stroke-width="3" stroke-linecap="round"/>`,
    hoopoe: `<path d="M-14 6 Q-10 -8 4 -8 Q14 -8 14 0 Q14 9 2 10 L-7 10 Z" fill="#e8a25c" stroke="#a2591f" stroke-width="3"/><path d="M12 -4 L21 -2 L12 1 Z" fill="#4d3f2a"/><g stroke="#a2591f" stroke-width="2.6" stroke-linecap="round"><path d="M2 -8 L-1 -18 M5 -8 L5 -19 M8 -8 L11 -17"/></g><circle cx="3" cy="-15" r="2" fill="#2b2233"/><circle cx="7" cy="-2" r="1.7" fill="#2b2233"/>`,
    whale: `<path d="M-20 2 Q-12 -12 4 -10 Q20 -8 20 2 Q20 10 4 10 Q-12 12 -20 2 Z" fill="#5b8fd4" stroke="#33619c" stroke-width="3"/><path d="M-18 0 L-27 -6 L-24 2 L-27 8 Z" fill="#33619c"/><path d="M4 -10 Q4 -18 -1 -20 M4 -10 Q9 -17 7 -21" stroke="#33619c" stroke-width="2.6" fill="none" stroke-linecap="round"/><circle cx="11" cy="-2" r="2" fill="#fff"/>`,
    snake: `<path d="M-18 12 Q-8 4 0 10 Q10 16 16 6 Q20 -2 12 -8 Q6 -12 2 -8" fill="none" stroke="#46b187" stroke-width="7" stroke-linecap="round"/><circle cx="0" cy="-9" r="6" fill="#46b187" stroke="#2c7a5b" stroke-width="2.6"/><circle cx="-2" cy="-10" r="1.5" fill="#2b2233"/><path d="M-6 -9 L-12 -11" stroke="#c2536b" stroke-width="2" stroke-linecap="round"/>`,
  };

  ns.LETTERS_STICKERS = Object.keys(STICKER_ART).map((id) => ({ id }));

  function sticker({ id, size = 84, owned = true } = {}) {
    const art = STICKER_ART[id] || "";
    return `
    <svg class="art-sticker" viewBox="-34 -34 68 68" width="${size}" height="${size}" aria-hidden="true">
      <rect x="-31" y="-31" width="62" height="62" rx="14" fill="${owned ? "#fffdf4" : "rgba(255,253,244,0.4)"}" stroke="${owned ? "#d8b25a" : "rgba(120,110,90,0.35)"}" stroke-width="3.4"/>
      <g transform="translate(0 2) scale(0.92)" ${owned ? "" : `opacity="0.18" filter="grayscale(1)"`}>${art}</g>
      ${owned ? "" : `<text y="9" text-anchor="middle" font-size="26" fill="rgba(120,110,90,0.5)" font-weight="900">?</text>`}
    </svg>`;
  }

  function stickerPack({ size = 120 } = {}) {
    return `
    <svg viewBox="-44 -52 88 104" width="${size}" height="${size * 1.18}" aria-hidden="true">
      <g class="art-pack">
        <rect x="-34" y="-42" width="68" height="84" rx="12" fill="hsl(268 55% 62%)" stroke="hsl(268 50% 42%)" stroke-width="4"/>
        <path d="M-34 -18 Q0 -4 34 -18 L34 -42 Q34 -42 22 -42 L-22 -42 Q-34 -42 -34 -42 Z" fill="hsl(268 60% 72%)"/>
        <g transform="scale(0.7) translate(0 8)" fill="#ffd95e"><path d="M0 -22 L6 -6 L23 -5 L9 6 L14 22 L0 13 L-14 22 L-9 6 L-23 -5 L-6 -6 Z" stroke="#c98f2e" stroke-width="3"/></g>
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
      ? ["#f3c24f", "#ffedb0", "#ff8fa3", "#7cd4ff", "#ffffff"]
      : ["#7cd4ff", "#8fd483", "#ff8fa3", "#f3c24f"];
    const count = golden ? 26 : 14;
    for (let i = 0; i < count; i += 1) {
      const p = document.createElement("i");
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.7;
      const dist = 70 + Math.random() * (golden ? 130 : 80);
      p.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
      p.style.setProperty("--dy", `${Math.sin(angle) * dist - 40}px`);
      p.style.setProperty("--rot", `${Math.random() * 720 - 360}deg`);
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = `${Math.random() * 80}ms`;
      layer.appendChild(p);
    }
    document.body.appendChild(layer);
    setTimeout(() => layer.remove(), 1300);
  }

  ns.LettersArt = {
    keyMascot, blobCard, creature, icon, backdrop, mapStop, confetti, ICONS,
    pet, egg, sticker, stickerPack, skillFlower,
  };
})(window.MiftahGame || (window.MiftahGame = {}));
