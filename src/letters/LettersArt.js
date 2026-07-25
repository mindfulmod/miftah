// Hand-built SVG art for the standalone Letter Garden kids' game. Everything
// visual lives here as string builders: the golden key mascot (Miftah = key),
// the Sprig Cub buddies who hold the letters, the journey map scenery, creatures,
// and icon-only controls — no words anywhere, the art IS the interface.
//
// Visual system ("garden toy"): warm paper surfaces, flat mid-saturation
// colors, chunky warm-espresso contours (storybook ink, never cold navy),
// shallow physical shadows, and one quirky detail per drawing. Gradient
// defs get unique ids because a url(#…) reference breaks when its
// defining screen is display:none.
(function (ns) {
  // ---------- design tokens (2026-07-24) ----------
  // Everything drawn in this file picks from these. Before this existed the art
  // layer carried 109 loose hex values and 19 different stroke widths, and each
  // creature outlined itself in a darker shade of its OWN fill — blue fish with
  // blue contours, a grey-purple elephant, a cold-navy crow. That's the thing
  // that made a carefully built game read as a prototype: in flat vector art the
  // contour is what tells the eye "one set, one hand". So there is exactly ONE
  // ink family, and a fill never picks its own outline.
  //
  // See docs/letter-garden-tokens.md for the rules these encode.
  const INKS = {
    hero: "#3b2a19", // mascot + hero silhouettes, the darkest thing on screen
    base: "#4a3620", // THE contour: creatures, cards, props, UI
    soft: "#7c5c3a", // pale or delicate pieces that base would overpower
    faint: "#a89478", // recessive by design — locked stops, seeds, "not yet"
    night: "#524f66", // scenery only, after dark
  };
  const INK = INKS.base; // warm espresso — shared with the tactile UI system
  // Contour weight scale. Snapped from the 19 ad-hoc widths that were in use;
  // nothing outside this set should appear in new art.
  const STROKE = { hair: 1.6, fine: 2.4, base: 3, bold: 4, hero: 6, mascot: 8 };
  // Gold is a motif, not a contour: coin rims, stars, treasure, the sun.
  const GOLD = { deep: "#b8781a", mid: "#c47f12", light: "#d8ab4e", glow: "#fff3c2" };
  const SHADOW = "rgba(74, 54, 32, 0.2)";

  let uid = 0;
  const gradId = () => `lgg${(uid += 1)}`;

  // Optical centering (2026-07-19): Amiri Quran's ink lands all over its huge
  // em box — ط rides high above the baseline, م hangs deep below — so no
  // fixed baseline trick (dominant-baseline, a constant dy) can centre every
  // glyph. Canvas TextMetrics' actualBoundingBox* can't be trusted either:
  // for some letters (confirmed on ع, ي, ن) Canvas2D and the SVG renderer
  // paint the SAME text/font/size measurably differently in this browser —
  // a real engine divergence, not just an API quirk — so a correction
  // measured via canvas fillText doesn't transfer to the <text> we actually
  // ship. The only source of truth both agree on is the SVG's own rendered
  // pixels, so we rasterize a throwaway <svg> to a canvas via an Image and
  // read back which pixels got ink.
  //
  // That rasterization is unavoidably async (Image decode), so results are
  // cached as a dx/dy-per-em RATIO (ink scales ~linearly with font-size) and
  // warmed up front for the fixed alphabet via warmInk() — see LettersGame's
  // boot sequence. inkShift() itself stays synchronous: a cache hit returns
  // the true ratio-based shift, a miss (an un-warmed multi-letter string)
  // falls back to the old canvas-metrics estimate, which is fine for
  // multi-glyph runs since no single letter's stray ink dominates the box.
  //   dx     — add to the text x (with text-anchor:middle)
  //   dy     — the text y offset (baseline placement below the anchor)
  //   htmlDy — translateY for an inline-centred HTML span of the same string
  const inkCtx = document.createElement("canvas").getContext("2d");
  const inkCache = new Map();
  const inkRatioCache = new Map();
  const AMIRI = "'Amiri Quran', serif";
  const LATIN_FONT = "ui-rounded, system-ui, sans-serif";
  const INK_REF_SIZE = 200;

  function rasterInkCenter(text, fontFamily, fontSize, direction) {
    const pad = fontSize * 1.5;
    const w = pad * 2;
    const svgMarkup =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${w}" width="${w}" height="${w}">` +
      `<text x="${pad}" y="${pad}" text-anchor="middle" direction="${direction}" ` +
      `font-family="${fontFamily}" font-size="${fontSize}" fill="#000">${text}</text></svg>`;
    const svg64 = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgMarkup)));
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = w;
        c.height = w;
        const ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0, w, w);
        const { data } = ctx.getImageData(0, 0, w, w);
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (let y = 0; y < w; y++) {
          const row = y * w;
          for (let x = 0; x < w; x++) {
            if (data[(row + x) * 4 + 3] > 10) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        if (minX > maxX) return resolve(null); // nothing painted (blank string)
        resolve({ dx: pad - (minX + maxX) / 2, dy: pad - (minY + maxY) / 2 });
      };
      img.onerror = reject;
      img.src = svg64;
    });
  }

  // Measures `text` once at a large reference size and caches the shift as a
  // fraction of em, so inkShift() can scale it to whatever size a given
  // card/tile/coin actually renders at without re-measuring per size.
  async function warmInk(texts, latin = false) {
    const fontFamily = latin ? LATIN_FONT : AMIRI;
    const direction = latin ? "ltr" : "rtl";
    await Promise.all(
      Array.from(new Set(texts)).map(async (text) => {
        const key = `${latin}|${text}`;
        if (inkRatioCache.has(key)) return;
        try {
          const ink = await rasterInkCenter(text, fontFamily, INK_REF_SIZE, direction);
          inkRatioCache.set(
            key,
            ink ? { dxR: ink.dx / INK_REF_SIZE, dyR: ink.dy / INK_REF_SIZE } : { dxR: 0, dyR: 0 },
          );
        } catch {
          inkRatioCache.set(key, { dxR: 0, dyR: 0 });
        }
      }),
    );
  }

  function inkShift(text, size, latin = false) {
    const font = `${size}px ${latin ? LATIN_FONT : AMIRI}`;
    const cacheKey = `${font}|${text}`;
    const hit = inkCache.get(cacheKey);
    if (hit) return hit;
    const out = { dx: 0, dy: 0, htmlDy: 0 };
    try {
      inkCtx.font = font;
      const m = inkCtx.measureText(text);
      const ratio = inkRatioCache.get(`${latin}|${text}`);
      if (ratio) {
        out.dx = ratio.dxR * size;
        out.dy = ratio.dyR * size;
      } else {
        // Fallback for strings not warmed (usually multi-letter runs): the
        // old canvas-metrics estimate. Imperfect, but no single glyph's
        // stray ink dominates a multi-letter box the way it does alone.
        out.dx = m.width / 2 - (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2;
        out.dy = (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
      }
      out.htmlDy =
        out.dy - (m.fontBoundingBoxAscent - m.fontBoundingBoxDescent) / 2;
      const ready =
        latin || !document.fonts || document.fonts.check(`${size}px "Amiri Quran"`);
      if (ready) inkCache.set(cacheKey, out);
    } catch {}
    return out;
  }

  // A friendly face used by every character. Mascot-grade eyes (the Duolingo/
  // Lingokids lesson): big white sclera with a slight outward tilt, large dark
  // pupils angled toward the viewer, and a double highlight — that's what makes
  // a character hold eye contact instead of reading as a toy on a shelf.
  //
  // EXPRESSION SYSTEM (2026-07-25). ART.md §6 requires at least six face states;
  // the game shipped with three, and one of them was "sad" — which contradicts
  // the locked rule that an error is information, never disapproval. There is no
  // sad state now: a wrong answer makes the pet CURIOUS and lean in.
  //
  // Ported from the Claude Design visual kit as DECISIONS rather than
  // coordinates (its blob is a different, wider body, so its absolute paths
  // would not fit): brow shape, eyelid depth, pupil offset and dilation, mouth,
  // cheeks and head tilt per state. Parts carry class names so each can be
  // animated on its own — art-brow-l/r, art-lid-l/r, art-pupil, art-mouth,
  // art-cheeks.
  //
  // This also brings the face onto the palette: the eye white was #fff (banned
  // pure white) and the mouth and cheeks were off-palette #7c2d4a / #ff9db1.
  // They are now paper-light and the accent-coral ramp the bible already defines.
  const EYE = { cx: 12, rx: 11, ry: 13.5 };
  const FACE_STATES = {
    neutral:   { lid: null,    pd: [0, 0],       ps: 1,    mouth: "smile", cheeks: 0.5, tilt: 0,
                 browL: "M-19 -19 Q-12 -22.5 -5 -19",   browR: "M5 -19 Q12 -22.5 19 -19" },
    curious:   { lid: null,    pd: [2.6, -1.6],  ps: 1,    mouth: "oh",    cheeks: 0.5, tilt: 4,
                 browL: "M-19 -24 Q-12 -28 -5 -22.5",   browR: "M5 -18.5 Q12 -20 19 -19" },
    delighted: { lid: "squint",pd: [0, -0.6],    ps: 1,    mouth: "grin",  cheeks: 1,   tilt: -2,
                 browL: "M-19 -23 Q-12 -27.5 -5 -22.5", browR: "M5 -22.5 Q12 -27.5 19 -23" },
    sleepy:    { lid: "heavy", pd: [0, 3.2],     ps: 1,    mouth: "tiny",  cheeks: 0.5, tilt: 6,
                 browL: "M-19 -19 Q-12 -20.5 -5 -18.5", browR: "M5 -18.5 Q12 -20.5 19 -19" },
    proud:     { lid: "low",   pd: [0, -0.6],    ps: 1,    mouth: "wide",  cheeks: 1,   tilt: 0,
                 browL: "M-19 -20 L-5 -20.8",           browR: "M5 -20.8 L19 -20" },
    thinking:  { lid: "halfL", pd: [-3.2, -2.4], ps: 1,    mouth: "purse", cheeks: 0.5, tilt: -3,
                 browL: "M-19 -18.5 Q-12 -20 -5 -19.5", browR: "M5 -24.5 Q12 -29 19 -24" },
    listening: { lid: null,    pd: [0, 0],       ps: 1.12, mouth: "small", cheeks: 0.5, tilt: -6,
                 browL: "M-19 -22 Q-12 -26 -5 -22",     browR: "M5 -22 Q12 -26 19 -22" },
  };
  // Legacy mood names still used by callers. "sad" deliberately resolves to
  // curious — the de-sad decision, enforced at the art layer so no screen can
  // reintroduce a disappointed pet.
  const FACE_ALIAS = { happy: "neutral", open: "delighted", sad: "curious" };

  // Eyelids are filled with the body colour so they read as skin closing over
  // the eye rather than as a separate object.
  // Returns the lid as a FILL plus a separate crease stroke. Stroking the whole
  // closed shape outlines the chord too, which on a round eye reads as goggles
  // rather than an eyelid — so only the crease carries ink.
  const lidParts = (cx, kind) => {
    const { rx, ry } = EYE;
    const build = (y, bulge, sweep) => ({
      fill: `M${cx - rx} ${y} A${rx} ${ry} 0 0 ${sweep} ${cx + rx} ${y} Q${cx} ${y + bulge} ${cx - rx} ${y} Z`,
      crease: `M${cx + rx} ${y} Q${cx} ${y + bulge} ${cx - rx} ${y}`,
    });
    if (kind === "squint") return build(1, -8, 0);
    if (kind === "heavy") return build(-2, 8.5, 1);
    if (kind === "half") return build(-4.5, 1.5, 1);
    return build(-6.5, -3, 1); // "low"
  };

  const MOUTHS = {
    smile: `<path d="M-6.5 13.5 A 6.5 5.5 0 0 0 6.5 13.5 Z" fill="#8a3a2d"/><ellipse cx="0" cy="16.8" rx="3.4" ry="2" fill="#ffa798"/>`,
    grin: `<path d="M-9 12.8 A 9 8 0 0 0 9 12.8 Z" fill="#8a3a2d"/><ellipse cx="0" cy="17.6" rx="4.4" ry="2.6" fill="#ffa798"/>`,
    oh: `<ellipse cx="2.4" cy="15" rx="3" ry="3.4" fill="#8a3a2d" stroke="${INK}" stroke-width="1.6"/>`,
    tiny: `<path d="M-3.4 14.4 Q0 17.2 3.4 14.4" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`,
    wide: `<path d="M-8.5 12.6 Q0 19.6 8.5 12.6" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
    purse: `<ellipse cx="4.2" cy="15" rx="2.8" ry="2.2" fill="#8a3a2d"/><path d="M-5 13.6 Q-1.4 15.8 1.6 14.2" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`,
    small: `<ellipse cx="0" cy="15" rx="2.6" ry="2.6" fill="#8a3a2d" stroke="${INK}" stroke-width="1.6"/>`,
  };

  const face = (x, y, s, mood = "happy", bodyFill = "#b7e779") => {
    const st = FACE_STATES[FACE_ALIAS[mood] || mood] || FACE_STATES.neutral;
    const E = EYE;
    const eye = (sign) => {
      const cx = sign * E.cx;
      const tilt = sign * 3; // outward tilt, ART.md §6
      const px = cx - sign * 4.4 + st.pd[0]; // -sign = inward: eye contact
      const py = 2.6 + st.pd[1];
      const pr = 4.9 * st.ps;
      return `
        <g transform="rotate(${tilt} ${cx} 0)">
          <ellipse cx="${cx}" cy="0" rx="${E.rx}" ry="${E.ry}" fill="#fffdf7" stroke="${INK}" stroke-width="2.4"/>
          <circle class="art-pupil" cx="${px}" cy="${py}" r="${pr.toFixed(2)}" fill="${INK}"/>
          <circle cx="${(px - 1.8).toFixed(2)}" cy="${(py - 2).toFixed(2)}" r="${(1.8 * st.ps).toFixed(2)}" fill="#fffdf7"/>
          <circle cx="${(px + 1.6).toFixed(2)}" cy="${(py + 2.6).toFixed(2)}" r="${(0.9 * st.ps).toFixed(2)}" fill="#fffdf7" opacity="0.85"/>
          ${st.lid && (st.lid !== "halfL" || sign < 0)
            ? (() => {
                const L = lidParts(cx, st.lid === "halfL" ? "half" : st.lid);
                return `<g class="art-lid art-lid-${sign < 0 ? "l" : "r"}">
            <path d="${L.fill}" fill="${bodyFill}"/>
            <path d="${L.crease}" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
          </g>`;
              })()
            : ""}
        </g>`;
    };
    return `
    <g class="art-face" data-mood="${FACE_ALIAS[mood] || mood}" transform="translate(${x} ${y}) scale(${s}) rotate(${st.tilt})">
      <g class="art-cheeks" opacity="${st.cheeks}">
        <ellipse cx="-22" cy="9" rx="${st.cheeks > 0.6 ? 6 : 5}" ry="${st.cheeks > 0.6 ? 4.2 : 3.6}" fill="#ffa798"/>
        <ellipse cx="22" cy="9" rx="${st.cheeks > 0.6 ? 6 : 5}" ry="${st.cheeks > 0.6 ? 4.2 : 3.6}" fill="#ffa798"/>
      </g>
      <g class="art-eyes">${eye(-1)}${eye(1)}</g>
      <path class="art-brow art-brow-l" d="${st.browL}" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
      <path class="art-brow art-brow-r" d="${st.browR}" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
      <g class="art-mouth">${MOUTHS[st.mouth] || MOUTHS.smile}</g>
    </g>`;
  };

  // Shared body lighting: a restrained two-tone wash rather than a glossy
  // candy gradient, matching the flatter card and scenery system.
  const bodyGrad = (id, hue, sat = 78, lum = 62) => `
    <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${hue} ${sat}% ${lum + 8}%)"/>
      <stop offset="1" stop-color="hsl(${hue} ${sat - 8}% ${lum - 6}%)"/>
    </linearGradient>`;

  // Blob palette: the hero family. Saturation pushed up (kids voted) while
  // the dark ink stays shared across hues so accessories can move between
  // bodies without looking like they came from another game.
  const sprigPalette = (hue) => ({
    body: `hsl(${hue} 76% 60%)`,
    shade: `hsl(${hue} 58% 42%)`,
    inner: `hsl(${(hue + 42) % 360} 58% 76%)`,
    muzzle: "#f6e6c4",
    cloth: `hsl(${(hue + 195) % 360} 58% 54%)`,
    clothDark: `hsl(${(hue + 195) % 360} 48% 38%)`,
    leaf: "#79a84b",
    leafDark: "#4d7434",
  });

  // The squishy blob silhouette every hero character shares: a droplet-round
  // body that flattens where it meets the ground, two dome feet with toe
  // lines (weight-bearing, never floating), and a sprout curl on top —
  // the Letter Garden signature. Local coordinate space: roughly ±R wide,
  // -R…+R tall around (0,0).
  const blobBody = (R, fill, rim, { feet = true, sw = 3.4 } = {}) => {
    const r = (n) => (n * R / 46).toFixed(1);
    return {
      body: `<path d="M0 ${-R} C ${-R * 0.62} ${-R} ${-R * 1.02} ${-R * 0.56} ${-R * 1.04} ${-R * 0.04}
        C ${-R * 1.06} ${R * 0.5} ${-R * 0.82} ${R * 0.94} ${-R * 0.42} ${R * 1.02}
        Q 0 ${R * 1.1} ${R * 0.42} ${R * 1.02}
        C ${R * 0.82} ${R * 0.94} ${R * 1.06} ${R * 0.5} ${R * 1.04} ${-R * 0.04}
        C ${R * 1.02} ${-R * 0.56} ${R * 0.62} ${-R} 0 ${-R} Z" fill="${fill}" stroke="${rim}" stroke-width="${sw}"/>`,
      gloss: `<path d="M${-R * 0.62} ${-R * 0.5} Q${-R * 0.34} ${-R * 0.82} ${R * 0.1} ${-R * 0.84}" fill="none" stroke="#fff" stroke-width="${R * 0.13}" stroke-linecap="round" opacity="0.5"/>`,
      feet: feet
        ? [-1, 1].map((d) => `
          <g class="art-blob-foot" transform="translate(${d * R * 0.42} ${R * 1.02})">
            <path d="M${r(-12)} ${r(5)} C ${r(-13.5)} ${r(-2.5)} ${r(-9)} ${r(-8)} 0 ${r(-8)} C ${r(9)} ${r(-8)} ${r(13.5)} ${r(-2.5)} ${r(12)} ${r(5)} C ${r(5.5)} ${r(7.6)} ${r(-5.5)} ${r(7.6)} ${r(-12)} ${r(5)} Z"
              fill="${fill}" stroke="${rim}" stroke-width="${sw * 0.82}"/>
            <path d="M${r(-5)} ${r(0.5)} Q 0 ${r(4)} ${r(5)} ${r(0.5)}" fill="none" stroke="${rim}" stroke-width="${sw * 0.6}" stroke-linecap="round"/>
          </g>`).join("")
        : "",
    };
  };

  // The sprout: stem plus two leaves, drawn at the blob's crown. Hats render
  // after accessories, so a worn cap simply covers it — same rule as ears.
  const sproutArt = (scale = 1, leaf = "#5cc23e", leafDark = "#2f8a1f") => `
    <g class="art-blob-sprout" transform="scale(${scale})">
      <path d="M0 4 Q-1 -3 1 -8" fill="none" stroke="${leafDark}" stroke-width="3" stroke-linecap="round"/>
      <path d="M1 -8 Q-9 -11 -11 -20 Q-1 -18 1 -8 Z" fill="${leaf}" stroke="${leafDark}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M1 -8 Q10 -14 13 -22 Q3 -20 1 -8 Z" fill="${leafDark}" stroke="${leafDark}" stroke-width="2.4" stroke-linejoin="round" opacity="0.85"/>
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
        <path d="M-38 -8 A40 40 0 0 1 4 -40" fill="none" stroke="${GOLD.glow}" stroke-width="6" stroke-linecap="round" opacity="0.55"/>
        <circle cy="-6" r="13" fill="#fff8e2"/>
        <circle cy="-6" r="13" fill="none" stroke="${GOLD.mid}" stroke-width="4"/>
        <circle cx="-13" cy="-24" r="6" fill="#fff" opacity="0.55"/>
        ${face(0, 16, 1.05, mood)}
      </g>
    </svg>`;
  }

  // The hero blob holding up a card — the universal "look at this" frame for
  // letters, syllables and words. Kids voted the blob back over the teddy:
  // one squishy silhouette, mascot eyes, sprout on top, feet peeking out
  // under the card so it stands instead of floats.
  function blobCard({ hue = 150, label = "", size = 230, latin = false } = {}) {
    const id = gradId();
    const p = sprigPalette(hue);
    const b = blobBody(84, `url(#${id})`, INK, { feet: false, sw: 7 });
    return `
    <svg class="art-blob" viewBox="0 0 250 280" width="${size}" height="${size * 1.12}" aria-hidden="true">
      <defs>${bodyGrad(id, hue, 74, 60)}</defs>
      <g class="art-blob-body">
        <ellipse cx="125" cy="267" rx="76" ry="10" fill="${SHADOW}"/>
        <g transform="translate(125 128)">
          ${b.body}
          ${b.gloss}
          <g transform="translate(2 -82)">${sproutArt(1.5, p.leaf, p.leafDark)}</g>
          ${[-1, 1].map((d) => `
            <g transform="translate(${d * 44} 122)">
              <path d="M-19 8 C -21.5 -4 -14.5 -13 0 -13 C 14.5 -13 21.5 -4 19 8 C 9 12.5 -9 12.5 -19 8 Z" fill="${p.body}" stroke="${INK}" stroke-width="6"/>
              <path d="M-8 1 Q0 6.5 8 1" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
            </g>`).join("")}
        </g>
        ${face(125, 92, 1.75, "happy")}
      </g>
      <g class="art-blob-card">
        <path d="M65 169 Q39 174 42 199 Q44 216 64 216" fill="${p.body}" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
        <path d="M185 169 Q211 174 208 199 Q206 216 186 216" fill="${p.body}" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
        <rect x="55" y="164" width="140" height="90" rx="18" fill="${p.clothDark}"/>
        <rect x="55" y="157" width="140" height="90" rx="18" fill="#fff8e9" stroke="${INK}" stroke-width="6"/>
        <path d="M70 171 H180" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity="0.7"/>
        ${cardGlyph(label, 125, 202, latin)}
        <circle cx="55" cy="190" r="11" fill="${p.inner}" stroke="${INK}" stroke-width="4"/>
        <circle cx="195" cy="190" r="11" fill="${p.inner}" stroke="${INK}" stroke-width="4"/>
      </g>
    </svg>`;
  }

  // Optically centered card text: the ink is measured (inkShift) and the
  // baseline placed so the visible glyph — not the em box — sits dead centre,
  // sized by skeleton length so long form-strings never spill off the card.
  function cardGlyph(label, cx, cy, latin) {
    const len = [...(label || "").replace(/[ً-ْٰٓ-ٟؐ-ؚۖ-ۭ]/g, "")].length;
    const size = latin
      ? Math.min(40, 240 / Math.max(4, len))
      : len <= 1 ? 64 : len <= 3 ? 52 : len <= 5 ? 40 : 26;
    const s = inkShift(label || "", size, latin);
    return `<text x="${(cx + s.dx).toFixed(1)}" y="${(cy + s.dy).toFixed(1)}" text-anchor="middle"
      font-family="${latin ? LATIN_FONT : AMIRI}"
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
      <path d="M45 22 Q52 32 45 42 M50 15 Q61 32 50 49" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>`,
    play: `<path d="M20 12 L52 32 L20 52 Z" fill="currentColor"/>`,
    next: `<path d="M14 12 L40 32 L14 52 Z" fill="currentColor"/><rect x="44" y="12" width="8" height="40" rx="3" fill="currentColor"/>`,
    replay: `<path d="M32 12 A20 20 0 1 1 13 26" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>
      <path d="M8 10 L15 28 L30 18 Z" fill="currentColor"/>`,
    home: `<path d="M10 32 L32 12 L54 32 L48 32 L48 52 L38 52 L38 38 L26 38 L26 52 L16 52 L16 32 Z" fill="currentColor"/>`,
    star: `<path d="M32 6 L39 24 L58 25 L43 37 L48 56 L32 45 L16 56 L21 37 L6 25 L25 24 Z" fill="currentColor"/>`,
    lock: `<rect x="16" y="28" width="32" height="26" rx="6" fill="currentColor"/>
      <path d="M22 28 V20 a10 10 0 0 1 20 0 V28" fill="none" stroke="currentColor" stroke-width="6"/>`,
    check: `<path d="M12 34 L26 48 L52 16" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`,
    arrow: `<path d="M32 8 V44 M16 30 L32 48 L48 30" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`,
    sun: `<circle cx="32" cy="32" r="13" fill="currentColor"/>
      <g stroke="currentColor" stroke-width="6" stroke-linecap="round">
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
    book: `<path d="M32 14 C26 9 16 8 8 10 V50 C16 48 26 49 32 54 C38 49 48 48 56 50 V10 C48 8 38 9 32 14 Z" fill="currentColor" opacity="0.25"/>
      <path d="M32 14 C26 9 16 8 8 10 V50 C16 48 26 49 32 54 M32 14 C38 9 48 8 56 10 V50 C48 48 38 49 32 54 M32 14 V54" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
  };

  function icon(name, size = 30) {
    return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true">${ICONS[name] || ""}</svg>`;
  }

  // ---------- day/night ----------
  // The garden lives on the child's clock: golden mornings, blue days, peach
  // sunsets and a starry night. Each phase carries sky CSS variables (set on
  // the app root by the game) plus its own celestial art in the backdrop.

  const PHASES = {
    morning: { hi: "#ffd181", lo: "#e4f9d8", far: "#bee07f", mid: "#8dd35f", near: "#55b84c", accent: "#ffb33f" },
    day: { hi: "#62cdf4", lo: "#ccfbef", far: "#b7e779", mid: "#7fce54", near: "#42b947", accent: "#f3c955" },
    sunset: { hi: "#ff9d83", lo: "#ffe3c4", far: "#d8df82", mid: "#9fc861", near: "#5fa04e", accent: "#ff6f70" },
    night: { hi: "#34375f", lo: "#6064a0", far: "#4d806a", mid: "#36725c", near: "#245c49", accent: "#f6d85b" },
  };

  function dayPhase(hour = new Date().getHours()) {
    if (hour >= 5 && hour < 10) return "morning";
    if (hour >= 10 && hour < 16) return "day";
    if (hour >= 16 && hour < 19) return "sunset";
    return "night";
  }

  // ---------- ramps (ART.md §2, ban 3) ----------
  // Any mass wider than ~24px must be a ramp, not one flat colour. Derives the
  // light and shadow bands from a base so scenery gets depth without anybody
  // hand-picking new hexes.
  //
  // "Light shifts warmer, shadow shifts cooler" has to be done by ANCHOR, not by
  // a fixed hue offset: for a green (H≈140) a naive +4 goes toward cyan, i.e.
  // colder — the opposite of the rule. So light rotates toward the warm anchor
  // (45°, sunlight) and shadow toward the cool anchor (250°, skylight), each
  // along the shorter arc, and shadow is clamped so it can never arrive at the
  // cold navy this project bans.
  const WARM_ANCHOR = 45;
  const COOL_ANCHOR = 250;

  function hexToHsl(hex) {
    const n = parseInt(hex.slice(1), 16);
    const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    const l = (max + min) / 2;
    if (!d) return { h: 0, s: 0, l: l * 100 };
    const s = d / (1 - Math.abs(2 * l - 1));
    let h;
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
    return { h: (h + 360) % 360, s: s * 100, l: l * 100 };
  }

  function hslToHex(h, s, l) {
    h = ((h % 360) + 360) % 360; s = Math.max(0, Math.min(100, s)) / 100; l = Math.max(0, Math.min(100, l)) / 100;
    const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
    const seg = Math.floor(h / 60) % 6;
    const rgb = [[c,x,0],[x,c,0],[0,c,x],[0,x,c],[x,0,c],[c,0,x]][seg];
    return "#" + rgb.map((v) => Math.round((v + m) * 255).toString(16).padStart(2, "0")).join("");
  }

  // Rotate `h` toward `anchor` by `deg`, along the shorter arc.
  function towardHue(h, anchor, deg) {
    let diff = ((anchor - h + 540) % 360) - 180;
    return h + Math.sign(diff) * Math.min(deg, Math.abs(diff));
  }

  function ramp(hex) {
    const { h, s, l } = hexToHsl(hex);
    return {
      base: hex,
      light: hslToHex(towardHue(h, WARM_ANCHOR, 8), s - 8, Math.min(94, l + 14)),
      // A flat −18 collapses already-dark bases to near-black: night's ground
      // (L≈31) became #0a1f1a, which read as a hole and made the trees vanish
      // against the hills. Floor it proportionally so dark phases stay legible.
      shadow: hslToHex(towardHue(h, COOL_ANCHOR, 6), s + 6, Math.max(l * 0.55, l - 18)),
    };
  }

  // Phase-aware storybook backdrop. Every layer uses the same navy contour
  // and flat paper-like color construction as the UI, so scenery and controls
  // feel like pieces from one physical playset.
  function backdrop(phase = dayPhase()) {
    const p = PHASES[phase] || PHASES.day;
    const night = phase === "night";
    const sceneryInk = night ? "#524f66" : "#a48d63";
    const celestial = night
      ? `<g class="art-moon">
           <circle cx="620" cy="92" r="54" fill="${INK}" opacity="0.18"/>
           <circle cx="620" cy="82" r="47" fill="#f4ecc8" stroke="${sceneryInk}" stroke-width="3"/>
           <circle cx="603" cy="72" r="9" fill="#ddd3a8" stroke="${sceneryInk}" stroke-width="1.6"/>
           <circle cx="636" cy="98" r="6" fill="#ddd3a8" stroke="${sceneryInk}" stroke-width="1.6"/>
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
    const skyId = gradId();
    return `
    <svg class="art-backdrop" viewBox="0 0 800 600" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="${skyId}" x1="0" y1="0" x2="0" y2="1">
          <!-- Held FLAT through the top quarter on purpose. A seam kept showing
               where the promoted .map-scroll layer begins (~66px down) — chased
               it through the backdrop, the filter, the body gradient and layer
               promotion without pinning the compositor's reason. Holding both
               sides of that region at the same colour as the flat <body> makes
               the seam invisible regardless of the cause, which beats a fix that
               depends on knowing it. -->
          <stop offset="0" stop-color="${p.hi}"/>
          <stop offset="0.26" stop-color="${p.hi}"/>
          <stop offset="0.72" stop-color="${p.lo}"/>
          <stop offset="1" stop-color="${p.lo}"/>
        </linearGradient>
      </defs>
      <!-- The sky belongs to the scenery, not to <body>. It used to be a body
           gradient showing through this SVG; the SVG is anchored yMax with slice
           while the body gradient is sized to the viewport, so the two never
           agreed and left a flat band across the top of the map.
           Sized to the viewBox exactly, NOT over-sized: the gradient then starts
           at the top of the visible area, so it matches the flat body colour
           (also --lg-sky-hi) and any strip the compositor doesn't cover is
           indistinguishable instead of a visible bar. Widened horizontally only,
           since slice crops left/right on tall screens. -->
      <rect x="-400" y="0" width="1600" height="600" fill="url(#${skyId})"/>
      <g class="art-scenery-tint">
      ${celestial}
      <g fill="${night ? "#777ca7" : "#fffaf0"}" opacity="${night ? 0.72 : 0.9}" stroke="${sceneryInk}" stroke-width="2.4" class="art-clouds">
        <g class="art-cloud-a"><path d="M78 122 Q83 92 112 98 Q124 64 160 84 Q181 70 201 92 Q229 91 236 119 Q205 133 156 130 Q111 134 78 122 Z"/></g>
        <g class="art-cloud-b"><path d="M362 91 Q368 66 392 70 Q403 44 432 61 Q451 51 466 70 Q489 70 496 91 Q467 102 429 100 Q391 104 362 91 Z"/></g>
      </g>
      ${[
        { d: "M-10 445 Q145 370 305 429 Q462 480 625 417 Q727 380 812 425 L812 615 L-10 615 Z", c: p.far, crest: 13 },
        { d: "M-10 485 Q198 392 420 462 Q622 526 812 440 L812 615 L-10 615 Z", c: p.mid, crest: 15 },
        { d: "M-10 535 Q257 450 521 522 Q682 565 812 516 L812 615 L-10 615 Z", c: p.near, crest: 17 },
      ]
        .map(({ d, c, crest }) => {
          // Ramped ground plane (ban 3): the silhouette in the light tone, with
          // the base mass dropped over it so only a sunlit strip along the ridge
          // shows. Two tones per band, no contour — the ridge reads by value,
          // which is how Toca separates ground planes.
          const r = ramp(c);
          return `<path d="${d}" fill="${r.light}"/><path d="${d}" fill="${r.base}" transform="translate(0 ${crest})"/>`;
        })
        .join("")}
      ${(() => {
        // Trees are the darkest scenery in every phase, which is what supplies
        // the dark tier §4 demands. Crown gets a light kiss so it ramps too.
        // The trunks are stroke-drawn, so the group must carry a stroke or they
        // vanish — they read as shade-on-shade here, not as a contour.
        const t = ramp(p.near);
        return `<g fill="${t.shadow}" stroke="${t.shadow}" stroke-width="4" stroke-linecap="round">
        <path d="M113 501 V468" fill="none"/><circle cx="113" cy="452" r="27"/>
        <path d="M704 535 V495" fill="none"/><circle cx="704" cy="476" r="31"/>
      </g>
      <g fill="${t.light}" opacity="0.45">
        <circle cx="105" cy="443" r="12"/><circle cx="695" cy="466" r="14"/>
      </g>`;
      })()}
      <g stroke="${sceneryInk}" stroke-width="1.6" stroke-linecap="round">
        <g transform="translate(246 526)"><path d="M0 22 V2"/><circle cy="0" r="8" fill="#ee806f"/><circle r="3" fill="#f3c955" stroke-width="1.6"/></g>
        <g transform="translate(562 548)"><path d="M0 20 V1"/><circle r="7" fill="#9c8bd8"/><circle r="2.7" fill="#f3c955" stroke-width="1.6"/></g>
        <g transform="translate(386 566)"><path d="M0 18 V0"/><circle r="7" fill="#73b9dc"/><circle r="2.7" fill="#f3c955" stroke-width="1.6"/></g>
      </g>
      <g fill="#fffaf0" stroke="${sceneryInk}" stroke-width="1.6" opacity="0.8">
        <path d="M42 556 q14 -14 28 0 q-14 14 -28 0Z"/><path d="M744 560 q13 -13 26 0 q-13 13 -26 0Z"/>
      </g>
      ${night ? `<g class="art-fireflies" fill="#ffe98a">${[[210, 480], [470, 510], [650, 540]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="4" style="animation-delay:${i * 1.1}s"/>`).join("")}</g>` : ""}
      </g>
    </svg>`;
  }

  // One map stop: a circular badge with the same navy rim, warm face and
  // shallow physical lift as every interactive card.
  function mapStop({ hue, label, status, stars = 0, latin = false }) {
    const faceColor = status === "done" ? "#f3c955" : status === "current" ? `hsl(${hue} 54% 70%)` : "#e8dcc2";
    const insetColor = status === "done" ? "#fff1c9" : status === "current" ? `hsl(${hue} 55% 88%)` : "#f2e9d6";
    // Warm bronze coin-rim gives the whole path a sunlit, treasure-map feel —
    // no more cold navy drop under the stops.
    const rim = status === "done" ? "#c08a1e" : status === "current" ? "#a9782e" : "#bfae90";
    const starRow = [0, 1, 2]
      .map(
        (i) =>
          `<g transform="translate(${(i - 1) * 19} 34) scale(0.21)" class="${i < stars ? "map-star-on" : "map-star-off"}"><g transform="translate(-32 -32)">${ICONS.star}</g></g>`,
      )
      .join("");
    // Locked stops are drawn RECESSIVE on purpose (2026-07-24). They used to
    // carry a cool-grey padlock at full contrast and full size, which made a
    // screen of not-yet-earned stops the loudest thing in the garden — a wall
    // of "you can't" for a child who can't read a tooltip explaining why. Now
    // they're soft warm outlines holding a seed: same information, but the
    // reading is "not grown yet", and the live stop is unambiguously the hero.
    // Recession comes from SIZE and muted warm colour, never from opacity: a
    // translucent cream disc over the night sky desaturates straight to grey,
    // which is how these ended up looking like dead slate coins.
    const locked = status === "locked";
    const contour = locked ? "#b9a68a" : INK;
    return `
    <svg viewBox="-60 -60 120 120" class="map-stop-art" aria-hidden="true">
      <circle cy="6" r="47" fill="${rim}"/>
      <circle r="47" fill="${faceColor}" stroke="${contour}" stroke-width="${locked ? 3.5 : 5}"/>
      <circle r="36" fill="${insetColor}" stroke="${contour}" stroke-width="${locked ? 2 : 3}"/>
      ${
        locked
          ? `<g class="map-stop-seed" transform="translate(0 4)">
               <ellipse cx="0" cy="0" rx="10" ry="12.5" fill="#c0ac85" stroke="${INKS.faint}" stroke-width="2.4" transform="rotate(-14)"/>
               <path d="M0 -12 Q1 -19 0 -24" fill="none" stroke="${INKS.faint}" stroke-width="2.4" stroke-linecap="round"/>
               <path d="M0 -20 Q-7 -23 -9 -29 Q-1 -28 0 -20 Z" fill="#a8bd8b" stroke="${INKS.soft}" stroke-width="1.6" stroke-linejoin="round"/>
             </g>`
          : (() => {
              const size = latin ? 24 : [...label.replace(/[ً-ْٰٓ-ٟؐ-ؚۖ-ۭ]/g, "")].length >= 3 ? 27 : 39;
              // Optical centre, nudged 3 up so the star row below reads as a
              // caption rather than crowding the glyph.
              const s = inkShift(label, size, latin);
              return `<text x="${s.dx.toFixed(1)}" y="${(s.dy - 3).toFixed(1)}" text-anchor="middle" font-family="${latin ? LATIN_FONT : AMIRI}" font-size="${size}" fill="${INK}" ${latin ? "" : `direction="rtl"`}>${label}</text>`;
            })()
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
        ${[0, 60, 120, 180, 240, 300].map((a) => `<ellipse rx="4.8" ry="7.6" transform="rotate(${a}) translate(0 -7.4)" fill="hsl(${hue} 64% 70%)" stroke="${INK}" stroke-width="2.4"/>`).join("")}
        <circle r="4.6" fill="#f3c955" stroke="${INK}" stroke-width="2.4"/>
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
        <g transform="translate(0 -43)">${sproutArt(0.9)}</g>
        <path d="M42 30 Q61 34 54 47 Q47 53 41 44 Z" fill="${body}" stroke="${rim}" stroke-width="3"/>`,
      front: "",
    }),
    bunny: (body, rim, belly) => ({
      back: `
        <path d="M-24 -38 Q-34 -86 -12 -66 Q-4 -56 -8 -40 Z" fill="${body}" stroke="${rim}" stroke-width="3"/>
        <path d="M24 -38 Q34 -86 12 -66 Q4 -56 8 -40 Z" fill="${body}" stroke="${rim}" stroke-width="3"/>
        <path d="M-21 -44 Q-26 -74 -13 -60 Q-9 -52 -12 -44 Z" fill="${belly}"/>
        <path d="M21 -44 Q26 -74 13 -60 Q9 -52 12 -44 Z" fill="${belly}"/>
        <circle cx="44" cy="36" r="10" fill="${belly}" stroke="${rim}" stroke-width="3"/>`,
      front: "",
    }),
    chick: (body, rim, belly) => ({
      back: `
        <path d="M-4 -50 Q-10 -66 0 -60 Q6 -68 8 -56 Q16 -60 10 -48 Z" fill="#ffb03a" stroke="${GOLD.mid}" stroke-width="3"/>
        <path d="M-44 6 Q-62 14 -50 30 Q-42 38 -34 26 Z" fill="${body}" stroke="${rim}" stroke-width="3"/>
        <path d="M44 6 Q62 14 50 30 Q42 38 34 26 Z" fill="${body}" stroke="${rim}" stroke-width="3"/>
        <path d="M-6 46 Q-16 62 0 58 Q16 62 6 46 Z" fill="#ffb03a" stroke="${GOLD.mid}" stroke-width="3"/>`,
      front: `<path d="M-5 14 L0 21 L5 14 Q0 10 -5 14 Z" fill="#ffb03a" stroke="${GOLD.mid}" stroke-width="2.4"/>`,
    }),
    cat: (body, rim, belly) => ({
      back: `
        <path d="M-34 -26 Q-44 -58 -12 -42 Q-20 -34 -22 -26 Z" fill="${body}" stroke="${rim}" stroke-width="3"/>
        <path d="M34 -26 Q44 -58 12 -42 Q20 -34 22 -26 Z" fill="${body}" stroke="${rim}" stroke-width="3"/>
        <path d="M-30 -34 Q-35 -49 -20 -41 Z" fill="#ffa798"/>
        <path d="M30 -34 Q35 -49 20 -41 Z" fill="#ffa798"/>
        <path d="M40 28 Q66 24 60 2 Q57 -8 48 -2 Q54 6 46 12 Q34 18 38 30 Z" fill="${body}" stroke="${rim}" stroke-width="3"/>`,
      front: `
        <g stroke="${rim}" stroke-width="2.4" stroke-linecap="round" opacity="0.8">
          <path d="M-28 4 L-44 0 M-28 9 L-44 10 M28 4 L44 0 M28 9 L44 10"/>
        </g>`,
    }),
    dragon: (body, rim, belly) => ({
      back: `
        <path d="M-16 -42 L-8 -64 L-1 -46 L7 -68 L14 -46 L20 -60 L23 -41 Z" fill="${belly}" stroke="${rim}" stroke-width="3"/>
        <path d="M-44 -8 Q-74 -26 -66 2 Q-60 16 -40 12 Z" fill="${belly}" stroke="${rim}" stroke-width="3"/>
        <path d="M44 -8 Q74 -26 66 2 Q60 16 40 12 Z" fill="${belly}" stroke="${rim}" stroke-width="3"/>
        <path d="M38 34 Q62 44 58 56 L48 50 Q54 58 44 60 Q32 58 34 42 Z" fill="${body}" stroke="${rim}" stroke-width="3"/>
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
        ${face(0, -4, 1.1, mood, body)}
        ${parts.front}
        ${worn.map((wid) => ACCESSORY_ART[wid] || "").join("")}
      </g>
    </svg>`;
  }

  const ACCESSORY_ART = {
    cap: `<g transform="translate(0 -46)"><path d="M-24 2 A24 16 0 0 1 24 2 L26 6 L-30 6 Z" fill="#f0503f" stroke="${INKS.base}" stroke-width="3"/><circle cy="-12" r="4" fill="#ffd23e"/></g>`,
    crown: `<g transform="translate(0 -48)"><path d="M-20 8 L-20 -8 L-10 0 L0 -12 L10 0 L20 -8 L20 8 Z" fill="#ffc22e" stroke="${GOLD.mid}" stroke-width="3"/><circle cy="2" r="3.4" fill="#f0503f"/></g>`,
    bow: `<g transform="translate(26 -34) rotate(20)"><path d="M0 0 L-14 -9 L-14 9 Z M0 0 L14 -9 L14 9 Z" fill="#ff7d96" stroke="${INKS.base}" stroke-width="3"/><circle r="4" fill="#cf3f60"/></g>`,
    glasses: `<g transform="translate(0 -6)"><circle cx="-12" cy="0" r="9" fill="none" stroke="${INK}" stroke-width="3"/><circle cx="12" cy="0" r="9" fill="none" stroke="${INK}" stroke-width="3"/><path d="M-3 0 H3" stroke="${INK}" stroke-width="3"/></g>`,
    scarf: `<g transform="translate(0 22)"><path d="M-24 0 Q0 12 24 0 L22 10 Q0 20 -22 10 Z" fill="#2fc487" stroke="${INKS.base}" stroke-width="3"/><path d="M14 8 L20 30 L8 26 Z" fill="#2fc487" stroke="${INKS.base}" stroke-width="3"/></g>`,
    flower: `<g transform="translate(-27 -36)">${[0, 60, 120, 180, 240, 300].map((a) => `<ellipse rx="5" ry="8" transform="rotate(${a}) translate(0 -8)" fill="#ff7d96"/>`).join("")}<circle r="5" fill="#ffd23e"/></g>`,
    balloon: `<g transform="translate(42 -30)"><path d="M0 18 Q-3 34 0 40" fill="none" stroke="${INKS.base}" stroke-width="2.4"/><ellipse rx="13" ry="16" fill="#54c6ff" stroke="${INKS.base}" stroke-width="3"/><circle cx="-4" cy="-5" r="3.4" fill="#fff" opacity="0.7"/></g>`,
    wand: `<g transform="translate(-42 6) rotate(-24)"><rect x="-2" y="0" width="4" height="34" rx="2" fill="#c47f12"/><g transform="translate(0 -6) scale(0.32)" fill="#ffd23e"><path d="M0 -26 L7 -6 L27 -5 L11 8 L16 27 L0 16 L-16 27 L-11 8 L-27 -5 L-7 -6 Z" stroke="${GOLD.mid}" stroke-width="6"/></g></g>`,
    taqiyah: `<g transform="translate(0 -46)"><path d="M-22 6 A22 14 0 0 1 22 6 L22 10 L-22 10 Z" fill="#fffaf0" stroke="${INKS.faint}" stroke-width="3"/><path d="M-14 -2 Q0 -8 14 -2 M-18 4 Q0 -2 18 4" fill="none" stroke="${INKS.faint}" stroke-width="2.4"/></g>`,
    cape: `<g transform="translate(0 4)"><path d="M-34 -22 Q-52 20 -38 44 L-20 34 Q-30 6 -26 -18 Z" fill="#f0503f" stroke="${INKS.base}" stroke-width="3"/><path d="M34 -22 Q52 20 38 44 L20 34 Q30 6 26 -18 Z" fill="#f0503f" stroke="${INKS.base}" stroke-width="3"/></g>`,
    medal: `<g transform="translate(0 30)"><path d="M-6 -14 L0 -4 L6 -14" stroke="${INKS.base}" stroke-width="4" fill="none"/><circle cy="4" r="9" fill="#ffc22e" stroke="${GOLD.mid}" stroke-width="3"/><path d="M0 -1 L2 3 L6 3 L3 6 L4 10 L0 8 L-4 10 L-3 6 L-6 3 L-2 3 Z" fill="#fff6da"/></g>`,
    kite: `<g transform="translate(44 -22) rotate(14)"><path d="M0 -16 L12 0 L0 16 L-12 0 Z" fill="#54c6ff" stroke="${INKS.base}" stroke-width="3"/><path d="M0 -16 V16 M-12 0 H12" stroke="${INKS.base}" stroke-width="2.4"/><path d="M0 16 Q-4 26 0 34 Q4 40 0 46" fill="none" stroke="${INKS.base}" stroke-width="2.4"/></g>`,
    sprout: `<g transform="translate(0 -50)"><path d="M0 10 Q0 2 0 -2" stroke="${INKS.base}" stroke-width="3" fill="none"/><path d="M0 -2 Q-12 -6 -13 -16 Q-2 -14 0 -2 Z" fill="#5cc23e" stroke="${INKS.base}" stroke-width="2.4"/><path d="M0 -2 Q12 -8 14 -17 Q3 -15 0 -2 Z" fill="#98dc74" stroke="${INKS.base}" stroke-width="2.4"/></g>`,
    moonpin: `<g transform="translate(-26 26)"><path d="M4 -10 A11 11 0 1 0 4 10 A8 8 0 1 1 4 -10" fill="#ffedb0" stroke="${GOLD.mid}" stroke-width="2.4"/><circle cx="8" cy="-9" r="2.4" fill="#ffd23e" stroke="${GOLD.mid}" stroke-width="1.6"/></g>`,
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
          fill="url(#${id})" stroke="${GOLD.light}" stroke-width="4"/>
        <circle cx="-12" cy="-22" r="8" fill="#fff" opacity="0.7"/>
        <g fill="#ffc22e" opacity="0.8"><circle cx="14" cy="6" r="5"/><circle cx="-16" cy="18" r="4"/><circle cx="4" cy="32" r="3.4"/></g>
        ${
          // Each tap has to be unmistakable, so the stages escalate hard: a
          // real fissure, then a second one plus a chip knocked loose and warm
          // light leaking from inside. The old version drew two thin hairlines
          // that a child couldn't tell apart from the shell speckles.
          cracks >= 1
            ? `<path d="M-26 -14 L-14 -6 L-22 4 L-10 12" fill="none" stroke="${INKS.soft}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
               <path d="M-14 -6 L-4 -12" fill="none" stroke="${INKS.soft}" stroke-width="3" stroke-linecap="round"/>`
            : ""
        }
        ${
          cracks >= 2
            ? `<path d="M22 -22 L12 -10 L24 -2 L14 10 L22 20" fill="none" stroke="${INKS.soft}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
               <path d="M-10 12 L2 16 L14 10" fill="none" stroke="${INKS.soft}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
               <path d="M2 16 L0 30" fill="none" stroke="${INKS.soft}" stroke-width="3" stroke-linecap="round"/>
               <path d="M12 -10 L24 -2 L14 10 Z" fill="#3a2c1a" opacity="0.5"/>
               <circle cx="18" cy="-1" r="9" fill="#fff6c9" opacity="0.75"/>
               <circle cx="18" cy="-1" r="4.5" fill="#fffdf0"/>`
            : ""
        }
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
    memorize: `<rect x="-7" y="-5" width="8" height="10" rx="2" fill="none" stroke="#fff" stroke-width="2.4"/><rect x="-1" y="-5" width="8" height="10" rx="2" fill="none" stroke="#fff" stroke-width="2.4"/>`,
    visualize: `<text y="5" text-anchor="middle" font-family="'Amiri Quran', serif" font-size="15" fill="#fff">ﺑ</text>`,
    blend: `<circle cx="-4" cy="0" r="4.5" fill="none" stroke="#fff" stroke-width="2.4"/><circle cx="4" cy="0" r="4.5" fill="none" stroke="#fff" stroke-width="2.4"/>`,
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
      <circle r="17" fill="#ffd23e" stroke="${GOLD.mid}" stroke-width="3"/>
      ${face(0, -1, 0.55)}
    </svg>`;
  }

  // ---------- sticker collection ----------
  // Die-cut stickers, like the sheets kids peel: each drawing sits on a white
  // wobbly-round backing with a soft shadow and a peeling shine. Owned ones
  // tilt playfully in the album; unowned slots are grey question blanks.

  const STICKER_ART = {
    sun: `<circle r="16" fill="#ffd23e"/><circle cx="-5" cy="-5" r="5" fill="#fff" opacity="0.5"/><g stroke="${GOLD.mid}" stroke-width="4" stroke-linecap="round">${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<path d="M0 -22 L0 -28" transform="rotate(${a})"/>`).join("")}</g>`,
    moon: `<path d="M8 -20 A22 22 0 1 0 8 20 A17 17 0 1 1 8 -20" fill="#ffe9a8" stroke="${GOLD.light}" stroke-width="3"/>`,
    star: `<path d="M0 -22 L6 -6 L23 -5 L9 6 L14 22 L0 13 L-14 22 L-9 6 L-23 -5 L-6 -6 Z" fill="#ffc22e" stroke="${GOLD.mid}" stroke-width="3"/>`,
    rainbow: `<g fill="none" stroke-width="6"><path d="M-22 14 A22 22 0 0 1 22 14" stroke="${INKS.base}"/><path d="M-16 14 A16 16 0 0 1 16 14" stroke="${GOLD.light}"/><path d="M-10 14 A10 10 0 0 1 10 14" stroke="${INKS.base}"/></g><circle cx="-22" cy="16" r="5" fill="#fff"/><circle cx="22" cy="16" r="5" fill="#fff"/>`,
    palm: `<rect x="-3" y="-2" width="7" height="26" rx="3" fill="#b06322"/><g fill="#2fc487">${[-150, -110, -70, -30].map((a) => `<ellipse rx="16" ry="6" transform="translate(0 -6) rotate(${a}) translate(12 0)"/>`).join("")}</g>`,
    flower: `${[0, 60, 120, 180, 240, 300].map((a) => `<ellipse rx="7" ry="12" transform="rotate(${a}) translate(0 -12)" fill="#ff7d96"/>`).join("")}<circle r="7" fill="#ffd23e"/>`,
    butterfly: `<g><ellipse cx="-11" cy="-8" rx="10" ry="12" fill="#54c6ff" stroke="${INKS.base}" stroke-width="2.4" transform="rotate(-20 -11 -8)"/><ellipse cx="11" cy="-8" rx="10" ry="12" fill="#54c6ff" stroke="${INKS.base}" stroke-width="2.4" transform="rotate(20 11 -8)"/><ellipse cx="-9" cy="9" rx="8" ry="9" fill="#ff7d96" stroke="${INKS.base}" stroke-width="2.4" transform="rotate(20 -9 9)"/><ellipse cx="9" cy="9" rx="8" ry="9" fill="#ff7d96" stroke="${INKS.base}" stroke-width="2.4" transform="rotate(-20 9 9)"/><rect x="-2.4" y="-14" width="5" height="28" rx="2.5" fill="${INK}"/></g>`,
    bee: `<ellipse rx="15" ry="11" fill="#ffd23e" stroke="${INK}" stroke-width="3"/><path d="M-5 -11 V11 M5 -11 V11" stroke="${INK}" stroke-width="4"/><ellipse cx="-8" cy="-14" rx="7" ry="5" fill="#d0f2ff" opacity="0.9"/><ellipse cx="8" cy="-14" rx="7" ry="5" fill="#d0f2ff" opacity="0.9"/><circle cx="17" cy="-2" r="2.4" fill="${INK}"/>`,
    dove: `<path d="M-18 4 Q-8 -14 8 -8 Q22 -4 20 8 Q10 18 -6 14 Z" fill="#fffaf0" stroke="${INKS.base}" stroke-width="3"/><path d="M-2 -6 Q-12 -18 2 -16 Z" fill="#fffaf0" stroke="${INKS.base}" stroke-width="3"/><circle cx="12" cy="-2" r="1.8" fill="${INK}"/><path d="M20 2 L27 4 L20 7 Z" fill="#f59a1d"/>`,
    fish: `<path d="M-20 0 Q-4 -14 10 -8 Q20 -4 20 0 Q20 4 10 8 Q-4 14 -20 0 Z" fill="#54c6ff" stroke="${INKS.base}" stroke-width="3"/><path d="M-20 0 L-28 -8 L-28 8 Z" fill="#1f87c2"/><circle cx="10" cy="-2" r="2" fill="${INK}"/>`,
    boat: `<path d="M-22 6 L22 6 L14 18 L-14 18 Z" fill="#b06322" stroke="${INKS.base}" stroke-width="3"/><path d="M2 6 L2 -20 L18 -2 Z" fill="#fffaf0" stroke="${INKS.soft}" stroke-width="3"/>`,
    lantern: `<rect x="-4" y="-24" width="8" height="5" rx="2" fill="#c47f12"/><path d="M-12 -18 L12 -18 L16 8 Q0 16 -16 8 Z" fill="#ffd23e" stroke="${GOLD.mid}" stroke-width="3"/><circle cy="-2" r="6" fill="#fff" opacity="0.75"/>`,
    key: `<circle cx="0" cy="-12" r="10" fill="none" stroke="${GOLD.light}" stroke-width="6"/><rect x="-3" y="-4" width="6" height="26" rx="3" fill="#ffc22e"/><rect x="-3" y="12" width="12" height="5" rx="2" fill="#ffc22e"/><rect x="-3" y="20" width="9" height="5" rx="2" fill="#ffc22e"/>`,
    egg: `<path d="M0 -20 C12 -20 17 -7 17 3 C17 14 10 20 0 20 C-10 20 -17 14 -17 3 C-17 -7 -12 -20 0 -20 Z" fill="#fdf0d2" stroke="${GOLD.light}" stroke-width="3"/><circle cx="-5" cy="-8" r="3.4" fill="#fff"/>`,
    cat: `<circle cy="2" r="16" fill="#f59a1d" stroke="${INKS.base}" stroke-width="3"/><path d="M-12 -10 L-16 -22 L-5 -14 Z M12 -10 L16 -22 L5 -14 Z" fill="#f59a1d" stroke="${INKS.base}" stroke-width="3"/><circle cx="-6" cy="0" r="2" fill="${INK}"/><circle cx="6" cy="0" r="2" fill="${INK}"/><path d="M-3 7 Q0 10 3 7" fill="none" stroke="${INK}" stroke-width="2.4"/>`,
    cloud: `<path d="M-14 11 Q-22 11 -22 4 Q-22 -2 -15 -3 Q-14 -12 -4 -12 Q3 -16 9 -10 Q17 -10 18 -2 Q23 -1 23 4 Q23 11 16 11 Z" fill="#fffaf0" stroke="${INKS.base}" stroke-width="3" stroke-linejoin="round"/>`,
    // The Quranic animals — the island's cast, sticker-sized.
    camel: `<path d="M-18 12 Q-20 -2 -10 -4 Q-6 -12 2 -8 Q6 -14 12 -10 L14 -18 L18 -16 L16 -6 Q20 0 18 12 Z" fill="#e8a936" stroke="${INKS.base}" stroke-width="3"/><rect x="-14" y="12" width="5" height="9" rx="2" fill="#b06322"/><rect x="8" y="12" width="5" height="9" rx="2" fill="#b06322"/><circle cx="14" cy="-13" r="1.6" fill="${INK}"/>`,
    elephant: `<circle cx="-2" cy="0" r="15" fill="#bdb2ae" stroke="${INKS.base}" stroke-width="3"/><circle cx="-12" cy="-4" r="8" fill="#d6cbc5" stroke="${INKS.base}" stroke-width="3"/><path d="M12 -4 Q22 0 18 12 Q16 16 12 14" fill="none" stroke="${INKS.base}" stroke-width="6" stroke-linecap="round"/><circle cx="4" cy="-4" r="2" fill="${INK}"/>`,
    ant: `<circle cx="-11" cy="4" r="7" fill="#7c4e22"/><circle cx="0" cy="0" r="6" fill="#7c4e22"/><circle cx="10" cy="-4" r="7" fill="#7c4e22"/><path d="M8 -10 L4 -18 M14 -10 L18 -18" stroke="${INKS.base}" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="-6" r="1.6" fill="#fff"/><path d="M-14 10 L-18 16 M-8 11 L-9 18 M0 6 L-2 14 M4 5 L8 13" stroke="${INKS.base}" stroke-width="2.4" stroke-linecap="round"/>`,
    spider: `<circle cy="2" r="11" fill="#4a3b5c"/><circle cy="-10" r="6" fill="#4a3b5c"/><g stroke="${INKS.base}" stroke-width="2.4" stroke-linecap="round" fill="none"><path d="M-9 -2 Q-20 -8 -22 -16 M9 -2 Q20 -8 22 -16 M-11 4 Q-22 4 -25 -2 M11 4 Q22 4 25 -2 M-10 9 Q-18 16 -22 15 M10 9 Q18 16 22 15"/></g><circle cx="-2" cy="-11" r="1.5" fill="#fff"/><circle cx="2" cy="-11" r="1.5" fill="#fff"/>`,
    crow: `<path d="M-16 6 Q-12 -10 4 -10 Q16 -10 16 0 Q16 10 2 12 L-8 12 Z" fill="#413a52" stroke="${INKS.base}" stroke-width="3"/><path d="M14 -2 L23 0 L14 4 Z" fill="#f59a1d"/><circle cx="8" cy="-3" r="1.8" fill="#fff"/><path d="M-14 8 L-22 2" stroke="${INKS.base}" stroke-width="3" stroke-linecap="round"/>`,
    hoopoe: `<path d="M-14 6 Q-10 -8 4 -8 Q14 -8 14 0 Q14 9 2 10 L-7 10 Z" fill="#f0a660" stroke="${INKS.base}" stroke-width="3"/><path d="M12 -4 L21 -2 L12 1 Z" fill="#4a3b5c"/><g stroke="${INKS.base}" stroke-width="2.4" stroke-linecap="round"><path d="M2 -8 L-1 -18 M5 -8 L5 -19 M8 -8 L11 -17"/></g><circle cx="3" cy="-15" r="2" fill="${INK}"/><circle cx="7" cy="-2" r="1.7" fill="${INK}"/>`,
    whale: `<path d="M-20 2 Q-12 -12 4 -10 Q20 -8 20 2 Q20 10 4 10 Q-12 12 -20 2 Z" fill="#4f92e8" stroke="${INKS.base}" stroke-width="3"/><path d="M-18 0 L-27 -6 L-24 2 L-27 8 Z" fill="#2b5cad"/><path d="M4 -10 Q4 -18 -1 -20 M4 -10 Q9 -17 7 -21" stroke="${INKS.base}" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="11" cy="-2" r="2" fill="#fff"/>`,
    fig: `<path d="M0 -14 Q14 -12 16 2 Q17 14 0 16 Q-17 14 -16 2 Q-14 -12 0 -14 Z" fill="#8e6fae" stroke="${INKS.base}" stroke-width="3"/><path d="M0 -13 Q1 -19 6 -21" fill="none" stroke="${INKS.base}" stroke-width="3" stroke-linecap="round"/><path d="M0 -16 Q-8 -20 -12 -25 Q-3 -25 0 -16 Z" fill="#79a84b" stroke="${INKS.base}" stroke-width="2.4" stroke-linejoin="round"/>`,
    olive: `<ellipse rx="11" ry="14" fill="#7d9b3f" stroke="${INKS.base}" stroke-width="3"/><ellipse cx="-3" cy="-4" rx="3" ry="4" fill="#a8bd6b" opacity="0.8"/><path d="M0 -14 Q2 -20 8 -22" fill="none" stroke="${INKS.base}" stroke-width="2.4" stroke-linecap="round"/>`,
    dates: `<g stroke="${INKS.base}" stroke-width="2.4"><ellipse cx="-6" cy="2" rx="6" ry="9" fill="#a9662e" transform="rotate(-12 -6 2)"/><ellipse cx="6" cy="4" rx="6" ry="9" fill="#93551f" transform="rotate(10 6 4)"/></g><path d="M-4 -8 Q0 -18 6 -20" fill="none" stroke="${INKS.base}" stroke-width="2.4" stroke-linecap="round"/>`,
    pomegranate: `<circle cy="2" r="14" fill="#cf4a4a" stroke="${INKS.base}" stroke-width="3"/><path d="M-4 -12 L0 -20 L4 -12" fill="none" stroke="${INKS.base}" stroke-width="3" stroke-linejoin="round"/><g fill="#8a2b32"><circle cx="-4" cy="2" r="2.4"/><circle cx="4" cy="1" r="2.4"/><circle cx="0" cy="8" r="2.4"/></g>`,
    grapes: `<g fill="#8e6fae" stroke="${INKS.base}" stroke-width="2.4"><circle cx="-6" cy="4" r="5"/><circle cx="6" cy="4" r="5"/><circle cx="0" cy="12" r="5"/><circle cx="0" cy="-4" r="5"/></g><path d="M0 -9 Q2 -17 9 -19" fill="none" stroke="${INKS.base}" stroke-width="2.4" stroke-linecap="round"/>`,
    honeycomb: `<g fill="${GOLD.light}" stroke="${INKS.base}" stroke-width="2.4"><path d="M-12 -6 L-6 -14 L6 -14 L12 -6 L6 2 L-6 2 Z"/><path d="M-6 4 L0 -4 L12 -4 L18 4 L12 12 L0 12 Z" transform="translate(-6 4)"/></g><circle cx="9" cy="-9" r="3.4" fill="#fff6da"/>`,
    waterdrop: `<path d="M0 -16 Q11 -2 11 6 Q11 16 0 16 Q-11 16 -11 6 Q-11 -2 0 -16 Z" fill="#7cc9f2" stroke="${INKS.base}" stroke-width="3"/><ellipse cx="-4" cy="4" rx="3" ry="5" fill="#dff2fd" opacity="0.85"/>`,
    mountain: `<path d="M-20 12 L-4 -14 L6 2 L12 -6 L20 12 Z" fill="#9fb7d9" stroke="${INKS.base}" stroke-width="3" stroke-linejoin="round"/><path d="M-4 -14 L-10 -2 L2 -2 Z" fill="#e8eef7"/>`,
    nest: `<path d="M-16 2 Q-14 12 0 12 Q14 12 16 2 Q10 -2 0 -2 Q-10 -2 -16 2 Z" fill="#b07a4a" stroke="${INKS.base}" stroke-width="3"/><g fill="#f2e6cd" stroke="${INKS.soft}" stroke-width="2.4"><ellipse cx="-5" cy="-2" rx="4.5" ry="3.6"/><ellipse cx="5" cy="-3" rx="4.5" ry="3.6"/></g>`,
    feather: `<path d="M8 -16 Q-10 -4 -12 14 Q4 8 12 -6 Q14 -12 8 -16 Z" fill="#c9dcea" stroke="${INKS.base}" stroke-width="3" stroke-linejoin="round"/><path d="M9 -14 Q-2 0 -11 13" fill="none" stroke="${INKS.base}" stroke-width="2.4" stroke-linecap="round"/>`,
    shell: `<path d="M-14 10 Q-14 -12 0 -12 Q14 -12 14 10 Z" fill="#f4c9b0" stroke="${INKS.base}" stroke-width="3" stroke-linejoin="round"/><g fill="none" stroke="${INKS.soft}" stroke-width="2.4"><path d="M0 -11 V10"/><path d="M-7 -8 Q-8 2 -9 10"/><path d="M7 -8 Q8 2 9 10"/></g>`,
    turtle: `<path d="M-15 4 Q-15 -10 0 -10 Q15 -10 15 4 Z" fill="#5fa04e" stroke="${INKS.base}" stroke-width="3" stroke-linejoin="round"/><g fill="#79a84b" stroke="${INKS.soft}" stroke-width="2.4"><path d="M-7 -1 L0 -7 L7 -1 L0 3 Z"/></g><circle cx="17" cy="2" r="4.5" fill="#79a84b" stroke="${INKS.base}" stroke-width="2.4"/><g stroke="${INKS.base}" stroke-width="4" stroke-linecap="round"><path d="M-10 6 V10"/><path d="M10 6 V10"/></g>`,
    snake: `<path d="M-18 12 Q-8 4 0 10 Q10 16 16 6 Q20 -2 12 -8 Q6 -12 2 -8" fill="none" stroke="${INKS.base}" stroke-width="6" stroke-linecap="round"/><circle cx="0" cy="-9" r="6" fill="#2fc487" stroke="${INKS.base}" stroke-width="2.4"/><circle cx="-2" cy="-10" r="1.5" fill="${INK}"/><path d="M-6 -9 L-12 -11" stroke="${INKS.base}" stroke-width="2.4" stroke-linecap="round"/>`,
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
        <path d="${DIECUT}" fill="${owned ? "#fffdf7" : "#e5dcc8"}"/>
        ${owned
          ? `<g transform="scale(0.78)">${art}</g>
             <path d="M-24 -14 Q-16 -26 -2 -28" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity="0.8"/>`
          : `<text y="9" text-anchor="middle" font-size="26" fill="${INKS.faint}" font-weight="900" font-family="ui-rounded, system-ui, sans-serif">?</text>`}
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
        <g transform="scale(0.7) translate(0 8)" fill="#ffd23e"><path d="M0 -22 L6 -6 L23 -5 L9 6 L14 22 L0 13 L-14 22 L-9 6 L-23 -5 L-6 -6 Z" stroke="${GOLD.mid}" stroke-width="3"/></g>
        <circle cx="-20" cy="-30" r="4" fill="#fff" opacity="0.5"/>
      </g>
    </svg>`;
  }

  // Confetti burst — appended to body, cleans itself up.
  function confetti(x, y, golden) {
    // Perf: on a fast correct-streak bursts can stack up; two at once is
    // plenty of party, three is a frame drop on tablets.
    if (document.querySelectorAll(".lg-confetti-layer").length >= 2) return;
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
    inkShift, warmInk,
  };
})(window.MiftahGame || (window.MiftahGame = {}));
