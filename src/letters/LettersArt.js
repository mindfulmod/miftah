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
        <text x="110" y="${latin ? 182 : 192}" text-anchor="middle"
          font-family="${latin ? "ui-rounded, system-ui, sans-serif" : "'Amiri Quran', serif"}"
          font-size="${latin ? 40 : 64}" fill="#2b2233" ${latin ? "" : `direction="rtl"`}>${label}</text>
      </g>
    </svg>`;
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
          : `<text y="${latin ? 8 : 16}" text-anchor="middle" font-family="${latin ? "ui-rounded, system-ui, sans-serif" : "'Amiri Quran', serif"}" font-size="${latin ? 26 : 42}" fill="#fffdf4" ${latin ? "" : `direction="rtl"`}>${label}</text>`
      }
      ${status === "done" ? starRow : status === "current" ? starRow : ""}
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

  ns.LettersArt = { keyMascot, blobCard, creature, icon, backdrop, mapStop, confetti, ICONS };
})(window.MiftahGame || (window.MiftahGame = {}));
