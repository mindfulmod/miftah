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
    soft: "#70501b", // pale or delicate pieces that base would overpower
    faint: "#a89478", // recessive by design — locked stops, seeds, "not yet"
    night: "#4a4d84", // scenery only, after dark
  };
  const INK = INKS.base; // warm espresso — shared with the tactile UI system
  // Contour weight scale. Snapped from the 19 ad-hoc widths that were in use;
  // nothing outside this set should appear in new art.
  const STROKE = { hair: 1.6, fine: 2.4, base: 3, bold: 4, hero: 6, mascot: 8 };
  // Gold is a motif, not a contour: coin rims, stars, treasure, the sun.
  const GOLD = { deep: "#c69434", mid: "#c69434", light: "#c69434", glow: "#ffe49a" };
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
      `font-family="${fontFamily}" font-size="${fontSize}" fill="#0a1f1a">${text}</text></svg>`;
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
      inkCtx.textAlign = "left"; inkCtx.textBaseline = "alphabetic";
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

  // Measure the loaded font's ink rather than its em box. SVG getBBox includes
  // Amiri's very tall font box; a raster SVG image may substitute another font.
  function fitStickerArt(root) {
    // Vector motifs have different natural origins; center their painted shape.
    for (const el of root.querySelectorAll('[data-sticker-art]')) {
      const b=el.getBBox();
      if(b.width && b.height) {
        const scale=Math.min(1.15,43/Math.max(b.width,b.height));
        el.setAttribute('transform',`scale(${scale}) translate(${-b.x-b.width/2} ${-b.y-b.height/2})`);
      }
    }
  }
  function fitGlyphs(root) {
    for(const el of root.querySelectorAll('text[data-fit-box]')) {
      if(!el.isConnected)continue;
      const [cx,cy,w,h,maxSize]=el.dataset.fitBox.split(',').map(Number);
      const family=el.getAttribute('font-family');
      const measure=size=>{
        const weight=el.getAttribute('font-weight');
        inkCtx.font=`${weight?weight+' ':''}${size}px ${family}`;inkCtx.textAlign='center';inkCtx.textBaseline='alphabetic';inkCtx.direction=el.getAttribute('direction')||'ltr';
        const m=inkCtx.measureText(el.textContent);
        return {left:m.actualBoundingBoxLeft,right:m.actualBoundingBoxRight,up:m.actualBoundingBoxAscent,down:m.actualBoundingBoxDescent};
      };
      let b=measure(maxSize);const width=b.left+b.right,height=b.up+b.down;
      if(!width||!height)continue;
      const size=maxSize*Math.min(1,w/width,h/height);b=measure(size);
      el.setAttribute('font-size',size);el.setAttribute('x',cx+(b.left-b.right)/2);el.setAttribute('y',cy+(b.up-b.down)/2);
    }
  }
  function fitInlineGlyphs(root) {
    for (const el of root.querySelectorAll('[data-fit-ink]')) {
      if (!el.isConnected || el.hidden || !el.textContent) continue;
      const size = parseFloat(getComputedStyle(el).fontSize);
      if (!(size > 0)) continue;
      const label = el.textContent, latin = el.classList.contains('is-latin');
      const family = latin ? LATIN_FONT : AMIRI, direction = latin ? 'ltr' : 'rtl';
      inkCtx.font = `${latin ? 800 : 400} ${size}px ${family}`;
      inkCtx.textAlign = 'center'; inkCtx.textBaseline = 'alphabetic'; inkCtx.direction = direction;
      const metrics = inkCtx.measureText(label);
      // Give the ink a real frame. An HTML line box's baseline does not agree
      // with Canvas fontBoundingBox metrics for Amiri's stacked vowel marks.
      const width = Math.max(size * 1.15, Math.min(size * 4.4, metrics.width + size * .2));
      const inset = size * .1;
      const height = Math.max(size * 1.15, Math.min(size * 1.75,
        metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent + inset * 2));
      let svg = el.querySelector('svg');
      if (!svg) {
        svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('aria-hidden', 'true');
        svg.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'text'));
        el.replaceChildren(svg);
      }
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      el.style.width = `${width}px`; el.style.height = `${height}px`;
      el.style.transform = 'none';
      const text = svg.querySelector('text');
      if (text.textContent !== label) text.textContent = label;
      for (const [key, value] of Object.entries({
        'text-anchor': 'middle', direction, 'font-family': family,
        'font-weight': latin ? 800 : 400, fill: 'currentColor',
        'data-fit-box': `${width/2},${height/2},${width-inset*2},${height-inset*2},${size}`,
      })) text.setAttribute(key, String(value));
      fitGlyphs(el);
    }
  }
  function watchGlyphs(root) {
    let pending=false;
    const schedule=()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;if(!root.isConnected)return;fitGlyphs(root);fitStickerArt(root);fitInlineGlyphs(root);});};
    const observer=new MutationObserver(schedule);observer.observe(root,{childList:true,subtree:true});
    document.fonts?.ready.then(schedule);document.fonts?.addEventListener('loadingdone',schedule);schedule();
    const resize = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null;
    resize?.observe(root);
    return ()=>{observer.disconnect();resize?.disconnect();document.fonts?.removeEventListener('loadingdone',schedule);};
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
  // This also brings the face onto the palette: the eye white was #fffdf7 (banned
  // pure white) and the mouth and cheeks were off-palette #7c2d4a / #ffa798.
  // They are now paper-light and the accent-coral ramp the bible already defines.
  const EYE = { cx: 12, rx: 11, ry: 13.5 };
  const FACE_STATES = {
    neutral:   { lid: null,    pd: [0, 0],       ps: 1,    mouth: "smile", cheeks: 0.5, tilt: 0,
                 browL: "M-19 -19 Q-12 -22.5 -5 -19",   browR: "M5 -19 Q12 -22.5 19 -19" },
    curious:   { lid: null,    pd: [2.6, -1.6],  ps: 1,    mouth: "oh",    cheeks: 0.5, tilt: 4,
                 browL: "M-19 -24 Q-12 -28 -5 -22.5",   browR: "M5 -18.5 Q12 -20 19 -19" },
    delighted: { lid: null,    pd: [0, -0.6],    ps: 1,    mouth: "grin",  cheeks: 1,   tilt: -2,
                 browL: "M-19 -23 Q-12 -27.5 -5 -22.5", browR: "M5 -22.5 Q12 -27.5 19 -23" },
    sleepy:    { lid: "heavy", pd: [0, 3.2],     ps: 1,    mouth: "tiny",  cheeks: 0.5, tilt: 6,
                 browL: "M-19 -19 Q-12 -20.5 -5 -18.5", browR: "M5 -18.5 Q12 -20.5 19 -19" },
    proud:     { lid: null,    pd: [0, -0.6],    ps: 1,    mouth: "wide",  cheeks: 1,   tilt: 0,
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
          <g data-rig="gaze"><circle class="art-pupil" cx="${px}" cy="${py}" r="${pr.toFixed(2)}" fill="${INK}"/>
          <circle cx="${(px - 1.8).toFixed(2)}" cy="${(py - 2).toFixed(2)}" r="${(1.8 * st.ps).toFixed(2)}" fill="#fffdf7"/>
          <circle cx="${(px + 1.6).toFixed(2)}" cy="${(py + 2.6).toFixed(2)}" r="${(0.9 * st.ps).toFixed(2)}" fill="#fffdf7" opacity="0.85"/></g>
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
      <g data-rig="blink"><g class="art-eyes">${eye(-1)}${eye(1)}</g></g>
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
    muzzle: "#e5dcc8",
    cloth: `hsl(${(hue + 195) % 360} 58% 54%)`,
    clothDark: `hsl(${(hue + 195) % 360} 48% 38%)`,
    leaf: "#7fce54",
    leafDark: "#2f5c46",
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
      gloss: `<path d="M${-R * 0.62} ${-R * 0.5} Q${-R * 0.34} ${-R * 0.82} ${R * 0.1} ${-R * 0.84}" fill="none" stroke="#fffdf7" stroke-width="${R * 0.13}" stroke-linecap="round" opacity="0.5"/>`,
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
  const sproutArt = (scale = 1, leaf = "#7fce54", leafDark = "#4e9677") => `
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
          <stop offset="0" stop-color="#ffe49a"/>
          <stop offset="0.7" stop-color="#f3c955"/>
          <stop offset="1" stop-color="#c69434"/>
        </radialGradient>
      </defs>
      <g class="art-mascot-body">
        <ellipse cx="0" cy="86" rx="32" ry="7" fill="${SHADOW}"/>
        <rect x="-9" y="28" width="18" height="52" rx="9" fill="#c69434"/>
        <rect x="-9" y="62" width="30" height="11" rx="5.5" fill="#c69434"/>
        <rect x="-9" y="78" width="24" height="11" rx="5.5" fill="#c69434"/>
        <circle r="40" fill="url(#${id})"/>
        <path d="M-38 -8 A40 40 0 0 1 4 -40" fill="none" stroke="${GOLD.glow}" stroke-width="6" stroke-linecap="round" opacity="0.55"/>
        <circle cy="-6" r="13" fill="#fffaf0"/>
        <circle cy="-6" r="13" fill="none" stroke="${GOLD.mid}" stroke-width="4"/>
        <circle cx="-13" cy="-24" r="6" fill="#fffdf7" opacity="0.55"/>
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
        <rect x="55" y="157" width="140" height="90" rx="18" fill="#fffaf0" stroke="${INK}" stroke-width="6"/>
        <path d="M70 171 H180" stroke="#fffdf7" stroke-width="6" stroke-linecap="round" opacity="0.7"/>
        ${cardGlyph(label, 125, 202, latin)}
        <circle cx="55" cy="190" r="11" fill="${p.inner}" stroke="${INK}" stroke-width="4"/>
        <circle cx="195" cy="190" r="11" fill="${p.inner}" stroke="${INK}" stroke-width="4"/>
      </g>
    </svg>`;
  }

  // The meet-screen letter sign (2026-10-01): the letter is the hero, on a
  // paper garden sign the size of the old presenter creature (same 250×280
  // box, so every layout that held the creature holds the sign). The ink sits
  // under a clip that the reveal wipes open in writing direction — right to
  // left for Arabic — with a little reed pen travelling the edge.
  function letterSign({ hue = 150, label = "", latin = false, size = 230 } = {}) {
    const id = gradId();
    const p = sprigPalette(hue);
    const len = [...(label || "").replace(/[ً-ْٰٓ-ٟؐ-ؚۖ-ۭ]/g, "")].length;
    const fontSize = latin ? Math.min(70, 400 / Math.max(4, len)) : len <= 1 ? 118 : len <= 3 ? 88 : len <= 5 ? 64 : 42;
    const s = inkShift(label || "", fontSize, latin);
    const cx = 125, cy = 130;
    return `
    <svg class="art-blob art-sign" data-dir="${latin ? "ltr" : "rtl"}" viewBox="0 0 250 280" width="${size}" height="${size * 1.12}" aria-hidden="true">
      <defs><clipPath id="${id}"><rect class="sign-wipe" x="24" y="40" width="202" height="196"/></clipPath></defs>
      <ellipse cx="125" cy="270" rx="86" ry="8" fill="${SHADOW}"/>
      <g fill="#a89478" stroke="${INK}" stroke-width="3" stroke-linejoin="round">
        <path d="M70 226V266H84V226Z"/><path d="M166 226V266H180V226Z"/>
      </g>
      <rect x="12" y="38" width="226" height="196" rx="28" fill="${p.clothDark}"/>
      <rect x="12" y="30" width="226" height="196" rx="28" fill="#fffdf7" stroke="${INK}" stroke-width="6"/>
      <rect x="28" y="46" width="194" height="164" rx="18" fill="#fffaf0"/>
      <path d="M44 196H206" stroke="${p.body}" stroke-width="4" stroke-linecap="round"/>
      <path d="M40 54H150" stroke="#fffdf7" stroke-width="6" stroke-linecap="round" opacity="0.8"/>
      <g transform="translate(125 26)">${sproutArt(1.35, p.leaf, p.leafDark)}</g>
      <g clip-path="url(#${id})">
        <text class="sign-ink" data-fit-box="${cx},${cy},176,128,${fontSize}" x="${(cx + s.dx).toFixed(1)}" y="${(cy + s.dy).toFixed(1)}" text-anchor="middle"
          font-family="${latin ? LATIN_FONT : AMIRI}" font-size="${fontSize}" fill="${INK}" ${latin ? "" : `direction="rtl"`}>${label}</text>
      </g>
      ${(() => {
        // Writing Garden (v3): when the handwriting model knows this letter,
        // the reveal writes it stroke by stroke, in order, before the printed
        // letter settles in. pathLength=100 lets CSS time each stroke.
        const strokes = !latin && ns.LettersStrokes?.forItem?.({ display: label });
        if (!strokes) return "";
        let t = 0;
        const parts = strokes.map((st) => {
          const delay = t;
          t += st.dot ? 0.18 : 0.42;
          return st.dot
            ? `<circle cx="${st.dot[0]}" cy="${st.dot[1]}" r="4.6" fill="${INK}" style="--d:${delay.toFixed(2)}s"/>`
            : `<path d="${st.d}" pathLength="100" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" style="--d:${delay.toFixed(2)}s"/>`;
        }).join("");
        return `<g class="sign-strokes" style="--t:${t.toFixed(2)}s" transform="translate(57 62) scale(1.36)">${parts}</g>`;
      })()}
      <g class="sign-pen" transform="translate(${latin ? 30 : 220} 120)">
        <path d="M0 0L10-34L16-32L6 2Z" fill="#c69434" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M0 0L6 2L2 8Z" fill="${INK}"/>
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
    return `<text data-fit-box="${cx},${cy},108,62,${size}" x="${(cx + s.dx).toFixed(1)}" y="${(cy + s.dy).toFixed(1)}" text-anchor="middle"
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
        <ellipse cx="70" cy="42" rx="14" ry="10" fill="#fffdf7" opacity="0.35"/>
        ${face(110, 74, 1.25, "happy")}
        <g class="art-creature-mouth">
          <ellipse cx="110" cy="152" rx="44" ry="34" fill="#8a3a2d"/>
          <ellipse cx="110" cy="168" rx="26" ry="14" fill="#ffa798"/>
          <path d="M74 134 L86 148 L98 132 L110 148 L122 132 L134 148 L146 134" fill="#fffdf7"/>
        </g>
      </g>
    </svg>`;
  }

  // Icon-only controls. Every icon is drawn, never a glyph from a font, so
  // they look identical on every device a child might hold.
  // Interface icons share one 64-unit grid: live area 8–56, optical centre at
  // 32,32, every join and cap round. Two weights by role — action glyphs a
  // child taps to move on (next, check, arrow) at 8, all other linework at 6 —
  // and every solid carries a 4-unit stroke of its own colour so its corners
  // are as soft as the line icons'.
  const SOLID = `stroke="currentColor" stroke-width="4" stroke-linejoin="round"`;
  const ICONS = {
    speaker: `<path d="M10 24H20L34 12V52L20 40H10Z" fill="currentColor" ${SOLID}/>
      <path class="icon-waves" d="M42 24Q48 32 42 40M48 16Q59 32 48 48" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>
      <path class="icon-muted" display="none" d="M42 24L56 40M56 24L42 40" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>`,
    play: `<path d="M22 14L52 32L22 50Z" fill="currentColor" stroke="currentColor" stroke-width="6" stroke-linejoin="round"/>`,
    next: `<path d="M12 32H50M34 16L50 32L34 48" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`,
    replay: `<path d="M50 32A18 18 0 1 1 41 16.4" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>
      <path d="M48 21L43 9L36 22Z" fill="currentColor" ${SOLID}/>`,
    // Undo is a U-turn back to the left — never the replay circle, which
    // means "hear it again" / "play again".
    undo: `<path d="M22 20H38A13 13 0 0 1 38 46H24" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>
      <path d="M10 20L23 10V30Z" fill="currentColor" ${SOLID}/>`,
    home: `<path d="M10 32L32 12L54 32H48V52H38V39H26V52H16V32Z" fill="currentColor" ${SOLID}/>`,
    star: `<path d="M32 8L39 24L56 25L43 37L47 54L32 45L17 54L21 37L8 25L25 24Z" fill="currentColor" ${SOLID}/>`,
    lock: `<rect x="16" y="28" width="32" height="26" rx="6" fill="currentColor" ${SOLID}/>
      <path d="M22 28V20a10 10 0 0 1 20 0V28" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>`,
    check: `<path d="M12 34L26 48L52 16" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`,
    arrow: `<path d="M32 12V48M16 34L32 50L48 34" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`,
    sun: `<circle cx="32" cy="32" r="13" fill="currentColor"/>
      <g stroke="currentColor" stroke-width="6" stroke-linecap="round">
        <path d="M32 6V14M32 50V58M6 32H14M50 32H58M13 13L19 19M45 45L51 51M51 13L45 19M19 45L13 51"/>
      </g>`,
    flower: `<g>${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-15" rx="9" ry="13" transform="translate(32 33) rotate(${a})" fill="currentColor"/>`).join("")}<circle cx="32" cy="33" r="8" fill="#fffdf7"/></g>`,
    calendar: `<rect x="8" y="14" width="48" height="42" rx="7" fill="none" stroke="currentColor" stroke-width="6"/>
      <path d="M8 26H56" stroke="currentColor" stroke-width="6"/>
      <path d="M20 8V18M44 8V18" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>
      <circle cx="22" cy="38" r="4" fill="currentColor"/><circle cx="34" cy="38" r="4" fill="currentColor"/>
      <circle cx="46" cy="38" r="4" fill="currentColor"/><circle cx="22" cy="48" r="4" fill="currentColor"/>`,
    paw: `<ellipse cx="32" cy="41" rx="13" ry="11" fill="currentColor"/>
      <circle cx="15" cy="28" r="6" fill="currentColor"/><circle cx="26" cy="18" r="6" fill="currentColor"/>
      <circle cx="38" cy="18" r="6" fill="currentColor"/><circle cx="49" cy="28" r="6" fill="currentColor"/>`,
    book: `<path d="M32 14C26 9 16 8 8 10V50C16 48 26 49 32 54C38 49 48 48 56 50V10C48 8 38 9 32 14Z" fill="currentColor" opacity="0.25"/>
      <path d="M32 14C26 9 16 8 8 10V50C16 48 26 49 32 54M32 14C38 9 48 8 56 10V50C48 48 38 49 32 54M32 14V54" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`,
  };

  function icon(name, size = 30) {
    return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true">${ICONS[name] || ""}</svg>`;
  }

  // ---------- day/night ----------
  // The garden lives on the child's clock: golden mornings, blue days, peach
  // sunsets and a starry night. Each phase carries sky CSS variables (set on
  // the app root by the game) plus its own celestial art in the backdrop.

  const PHASES = {
    morning: { hi: "#ffe49a", lo: "#ccfbef", far: "#b7e779", mid: "#7fce54", near: "#7fce54", accent: "#f3c955" },
    day: { hi: "#62cdf4", lo: "#ccfbef", far: "#b7e779", mid: "#7fce54", near: "#7fce54", accent: "#f3c955" },
    sunset: { hi: "#ffa798", lo: "#e5dcc8", far: "#b7e779", mid: "#7fce54", near: "#4e9677", accent: "#ee806f" },
    night: { hi: "#34375f", lo: "#6064a0", far: "#4e9677", mid: "#2f5c46", near: "#2f5c46", accent: "#f3c955" },
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
  // Each chapter's land (LettersWorlds biomeOf) dresses the same three ground
  // bands, so an activity sits in the land the map promised: snowy peaks behind
  // the far hills, a lagoon or river between the bands, fruit trees, reeds or
  // lanterns at the edges. Everything stays in the outer fifth or below the
  // ridge line — the centre belongs to the cards.
  const BIOMES = ["meadow", "orchard", "lagoon", "night", "peaks", "river"];
  function biomeScenery(biome, night, ink) {
    const water = night ? { base: "#4a4d84", light: "#6064a0", deep: "#34375f" } : { base: "#96ecff", light: "#ccfbef", deep: "#62cdf4" };
    const reeds = (x, y, k = 1) => `<g class="art-reeds" transform="translate(${x} ${y}) scale(${k})" stroke-linecap="round">
        <path d="M0 0Q-4-30-12-52M6 0Q8-34 4-62M12 0Q18-26 28-44" fill="none" stroke="${night ? "#2f5c46" : "#4e9677"}" stroke-width="4"/>
        <path d="M4-62Q0-74 4-84Q9-74 4-62Z" fill="#70501b" stroke="${ink}" stroke-width="1.6"/>
        <path d="M-12-52Q-18-62-15-72Q-9-62-12-52Z" fill="#70501b" stroke="${ink}" stroke-width="1.6"/>
      </g>`;
    const ripples = (pts) => `<g fill="none" stroke="${water.light}" stroke-width="3" stroke-linecap="round" opacity="0.9">${pts.map(([x, y, w]) => `<path d="M${x} ${y}q${w / 2}-5 ${w} 0"/>`).join("")}</g>`;
    if (biome === "peaks") {
      const rock = night ? { base: "#4a4d84", light: "#6064a0" } : { base: "#c9bda4", light: "#e5dcc8" };
      return { far: `<g class="art-peaks">
        <path d="M-30 470L92 292L170 392L252 318L350 450Z" fill="${rock.base}"/>
        <path d="M92 292L120 470H-30ZM252 318L268 450H170Z" fill="${rock.light}"/>
        <path d="M480 452L602 306L668 372L744 280L840 452Z" fill="${rock.base}"/>
        <path d="M602 306L628 452H480ZM744 280L760 452H668Z" fill="${rock.light}"/>
        <path d="M92 292L114 324L100 318L88 330L76 322ZM252 318L268 342L254 338L242 346ZM602 306L622 330L608 326L596 336L586 328ZM744 280L764 308L750 302L738 314L728 306Z" fill="#fffdf7"/>
      </g>` };
    }
    if (biome === "lagoon") {
      return {
        water: `<g class="art-lagoon"><path d="M-10 498Q190 466 400 486Q610 506 812 474L812 572L-10 572Z" fill="${water.base}"/>
          <path d="M-10 498Q190 466 400 486Q610 506 812 474L812 486Q610 518 400 498Q190 478-10 510Z" fill="${water.light}" opacity="0.7"/>
          ${ripples([[150, 512, 34], [560, 520, 40], [330, 530, 26]])}
          <g fill="${night ? "#2f5c46" : "#4e9677"}"><path d="M612 538a18 7 0 1 0 6-7l-6 7Z"/><path d="M196 532a14 6 0 1 0 5-6l-5 6Z"/></g>
          <circle cx="618" cy="530" r="4" fill="#ffa798" stroke="${ink}" stroke-width="1.6"/></g>`,
        props: `${reeds(36, 560, 1)}${reeds(92, 574, 0.75)}${reeds(742, 574, 0.9)}`,
        noTrees: "both",
      };
    }
    if (biome === "river") {
      return {
        props: `<g class="art-river">
          <path d="M812 448Q640 468 540 496Q420 530 300 552Q170 576-10 578" fill="none" stroke="${night ? "#2f5c46" : "#e5dcc8"}" stroke-width="54" stroke-linecap="round" data-ribbon/>
          <path d="M812 448Q640 468 540 496Q420 530 300 552Q170 576-10 578" fill="none" stroke="${water.base}" stroke-width="40" stroke-linecap="round" data-ribbon/>
          <path d="M812 440Q640 460 540 488Q420 522 300 544Q170 568-10 570" fill="none" stroke="${water.light}" stroke-width="8" stroke-linecap="round" opacity="0.7" data-ribbon/>
          ${ripples([[600, 476, 30], [380, 530, 28], [120, 572, 30]])}
        </g>${reeds(232, 548, 0.7)}${reeds(700, 540, 0.8)}`,
        noTrees: "right",
      };
    }
    if (biome === "orchard") {
      const fruit = (x, y, k) => `<g transform="translate(${x} ${y}) scale(${k})" class="art-fruit-tree">
          <ellipse cx="0" cy="4" rx="30" ry="6" fill="${night ? "#23253f" : "#4e9677"}" opacity="0.3"/>
          <path d="M0 2V-34" stroke="#70501b" stroke-width="8" stroke-linecap="round"/>
          <circle cx="0" cy="-58" r="36" fill="${night ? "#2f5c46" : "#4e9677"}"/>
          <path d="M-30-66Q-24-90 0-92Q22-90 30-70Q8-82-30-66Z" fill="${night ? "#4e9677" : "#7fce54"}"/>
          ${[[-16, -60, "#ee806f"], [12, -44, "#f3c955"], [18, -70, "#ee806f"], [-6, -38, "#ee806f"]].map(([fx, fy, c]) => `<circle cx="${fx}" cy="${fy}" r="6" fill="${c}" stroke="${ink}" stroke-width="1.6"/>`).join("")}
        </g>`;
      return {
        far: `<g class="art-orchard-row" fill="${night ? "#2f5c46" : "#4e9677"}" opacity="0.7">${[[150, 404], [196, 410], [240, 418], [652, 412], [700, 402]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 2 ? 15 : 19}"/>`).join("")}</g>`,
        props: `${fruit(104, 512, 1)}${fruit(712, 546, 1.08)}`,
        noTrees: "both",
      };
    }
    if (biome === "night") {
      const lantern = (x, y) => `<g class="art-lantern" transform="translate(${x} ${y}) scale(1.35)">
          <path d="M0 0V-58M0-58H16" fill="none" stroke="#70501b" stroke-width="4" stroke-linecap="round"/>
          ${night ? `<circle cx="16" cy="-38" r="22" fill="#ffe49a" opacity="0.32"/>` : ""}
          <path d="M16-58V-52" stroke="#70501b" stroke-width="2.4"/>
          <rect x="7" y="-52" width="18" height="24" rx="5" fill="${night ? "#ffe49a" : "#f3c955"}" stroke="${ink}" stroke-width="1.6"/>
          <path d="M5-52H27M5-28H27" stroke="#70501b" stroke-width="2.4" stroke-linecap="round"/>
        </g>`;
      return { props: `${lantern(160, 522)}${lantern(650, 548)}` };
    }
    return {};
  }

  // Living lands (2026-10-01): a few small creatures that belong to each land
  // move through the scenery — never over the cards (outer fifth, sky corners,
  // or water bands), never interactive, and gone entirely under reduced
  // motion (a frozen fish in mid-air is worse than no fish). Each creature is
  // an outer <g> that travels and an inner group that flaps or bobs.
  function landLife(biome, night, ink) {
    const butterfly = (cls, x, y, wing, delay) => `<g class="life-travel ${cls}" style="animation-delay:${delay}s"><g transform="translate(${x} ${y}) scale(1.5)">
        <g class="life-flap"><path d="M0 0C-9-12-17-4-11 3C-7 7-2 4 0 0ZM0 0C9-12 17-4 11 3C7 7 2 4 0 0Z" fill="${wing}" stroke="${ink}" stroke-width="1.6" stroke-linejoin="round"/></g>
        <path d="M0-5V5" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/></g></g>`;
    const bird = (cls, x, y, delay) => `<g class="life-travel ${cls}" style="animation-delay:${delay}s"><g transform="translate(${x} ${y}) scale(1.4)"><path class="life-glide" d="M-14 0Q-7-8 0 0Q7-8 14 0" fill="none" stroke="${night ? "#6064a0" : "#4a3620"}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></g></g>`;
    if (night) {
      // Night: moths around the warm spots, and in the lagoon a moon-glint fish.
      const moth = (cls, x, y, delay) => `<g class="life-travel ${cls}" style="animation-delay:${delay}s"><g transform="translate(${x} ${y}) scale(1.4)"><g class="life-flap"><path d="M0 0C-6-8-11-2-7 2ZM0 0C6-8 11-2 7 2Z" fill="#e5dcc8" stroke="#6064a0" stroke-width="1.6"/></g></g></g>`;
      if (biome === "night") return `<g class="art-life" data-life="night">${moth("life-orbit-a", 182, 478, 0)}${moth("life-orbit-b", 672, 504, 1.4)}</g>`;
      if (biome !== "lagoon") return `<g class="art-life" data-life="${biome}">${[[96, 470, 0], [730, 492, 1.7], [150, 520, 3.1]].map(([x, y, d]) => `<g class="life-travel life-hover-${d > 1 ? "b" : "a"}" style="animation-delay:${d}s"><circle cx="${x}" cy="${y}" r="9" fill="#ffe49a" opacity="0.3"/><circle cx="${x}" cy="${y}" r="3.6" fill="#ffe49a"/></g>`).join("")}</g>`;
      if (biome === "lagoon") return `<g class="art-life" data-life="lagoon"><g class="life-jump"><g transform="translate(560 520)"><path d="M-10 0Q0-8 10 0Q0 8-10 0ZM10 0L16-5V5Z" fill="#6064a0" stroke="#34375f" stroke-width="1.6"/></g></g></g>`;
      return "";
    }
    if (biome === "orchard") {
      const petal = (x, delay) => `<g class="life-fall" style="animation-delay:${delay}s"><g transform="translate(${x} 380)"><path class="life-spin" d="M0-5C4-5 5 0 0 5C-5 0-4-5 0-5Z" fill="#ffa798" stroke="${ink}" stroke-width="1.6"/></g></g>`;
      return `<g class="art-life" data-life="orchard">${petal(88, 0)}${petal(126, 3.1)}${petal(700, 1.6)}${petal(742, 4.4)}
        <g class="life-travel life-hover-a"><g transform="translate(150 430) scale(1.3)"><g class="life-bob"><ellipse rx="6" ry="4.5" fill="#f3c955" stroke="${INK}" stroke-width="1.6"/><path d="M-1-4V4M2-4V4" stroke="${INK}" stroke-width="1.6"/><ellipse cx="-1" cy="-7" rx="4" ry="3" fill="#fffdf7" stroke="${ink}" stroke-width="1.6"/></g></g></g></g>`;
    }
    if (biome === "lagoon") {
      return `<g class="art-life" data-life="lagoon">
        <g class="life-jump"><g transform="translate(560 520)"><path d="M-10 0Q0-8 10 0Q0 8-10 0ZM10 0L16-5V5Z" fill="#ffa06e" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/><circle cx="-5" cy="-1" r="1.2" fill="${INK}"/></g></g>
        <g class="life-ring"><ellipse cx="610" cy="526" rx="14" ry="4" fill="none" stroke="#ccfbef" stroke-width="2.4"/></g>
        <g class="life-travel life-hover-b"><g transform="translate(120 470) scale(1.3)"><g class="life-flap"><path d="M0 0L-14-4L-14 2ZM0 0L14-4L14 2Z" fill="#ccfbef" stroke="${ink}" stroke-width="1.6" stroke-linejoin="round"/></g><path d="M-1 0H12" stroke="#3a8fc4" stroke-width="2.4" stroke-linecap="round"/></g></g></g>`;
    }
    if (biome === "peaks") return `<g class="art-life" data-life="peaks">${bird("life-glide-a", -40, 210, 0)}${bird("life-glide-b", -40, 250, 6)}</g>`;
    if (biome === "river") {
      return `<g class="art-life" data-life="river"><g class="life-drift"><g transform="translate(812 452) scale(1.3)"><g class="life-bob">
        <path d="M-12 0Q0 6 12 0L8-3H-8Z" fill="#7fce54" stroke="${ink}" stroke-width="1.6" stroke-linejoin="round"/><path d="M0-3V-12" stroke="${INK}" stroke-width="1.6"/></g></g></g>
        ${butterfly("life-hover-a", 120, 470, "#b49fcf", 0)}</g>`;
    }
    return `<g class="art-life" data-life="meadow">${butterfly("life-hover-a", 140, 440, "#ffa798", 0)}${butterfly("life-hover-b", 680, 470, "#b49fcf", 2.2)}</g>`;
  }

  // Daily weather (2026-10-01): one weather per calendar day, from the date
  // alone so it is the same all day and on every screen — clear, breezy,
  // drizzle or (by day) a rainbow. Purely scenery: it never changes play.
  const WEATHERS = ["clear", "clear", "clear", "clear", "breezy", "breezy", "drizzle", "drizzle", "rainbow", "rainbow"];
  function weatherFor(date = new Date(), phase = dayPhase()) {
    const key = typeof date === "string" ? date : `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    let h = 2166136261;
    for (const c of key) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
    const pick = WEATHERS[(h >>> 0) % WEATHERS.length];
    return pick === "rainbow" && phase === "night" ? "clear" : pick;
  }
  function weatherLayer(weather, phase = dayPhase()) {
    if (weather === "breezy") {
      const leaf = (y, d, k, c) => `<svg class="wx-leaf" style="top:${y}%;animation-delay:${d}s;--k:${k}" viewBox="-12 -8 24 16" aria-hidden="true"><path d="M-10 0Q0-9 10 0Q0 9-10 0Z" fill="${c}" stroke="#4a3620" stroke-width="1.6"/><path d="M-8 0H8" stroke="#4e9677" stroke-width="1.6"/></svg>`;
      return `<div class="lg-weather" data-weather="breezy" aria-hidden="true">${leaf(18, 0, 1, "#7fce54")}${leaf(34, 3.4, .8, "#b7e779")}${leaf(52, 6.1, 1.1, "#f3c955")}${leaf(26, 8.8, .9, "#7fce54")}</div>`;
    }
    if (weather === "drizzle") return `<div class="lg-weather" data-weather="drizzle" aria-hidden="true"><i class="wx-rain"></i><i class="wx-rain is-far"></i></div>`;
    if (weather === "rainbow" && phase !== "night") {
      const bands = ["#ee806f", "#f3c955", "#7fce54", "#62cdf4"].map((c, i) => `<path d="M${20 + i * 14} 200A${180 - i * 14} ${180 - i * 14} 0 0 1 ${380 - i * 14} 200" fill="none" stroke="${c}" stroke-width="14" data-ribbon/>`).join("");
      return `<div class="lg-weather" data-weather="rainbow" aria-hidden="true"><svg class="wx-rainbow" viewBox="0 0 400 210">${bands}<path d="M0 200Q20 176 48 186Q66 168 88 184Q100 196 96 206H0Z" fill="#fffdf7"/><path d="M304 206Q300 188 322 184Q338 168 360 184Q388 176 400 200V206Z" fill="#fffdf7"/></svg></div>`;
    }
    return "";
  }

  // Moon Calendar (v10, 2026-10-02): the garden keeps the Islamic calendar
  // (Umm al-Qura, via the browser) — Ramadan lanterns and a crescent moon, Eid
  // bunting. Decoration and gifts only; no counting, no pressure.
  function hijri(date = new Date()) {
    for (const cal of ["islamic-umalqura", "islamic"]) {
      try {
        const parts = new Intl.DateTimeFormat(`en-u-ca-${cal}`, { year: "numeric", month: "numeric", day: "numeric" }).formatToParts(date);
        const get = (t) => Number(parts.find((p) => p.type === t)?.value);
        const out = { year: get("year"), month: get("month"), day: get("day") };
        if (out.month >= 1 && out.month <= 12) return out;
      } catch {}
    }
    return null;
  }
  function season(date = new Date()) {
    const h = hijri(date);
    if (!h) return null;
    if (h.month === 9) return "ramadan";
    if (h.month === 10 && h.day <= 3) return "eid-fitr";
    if (h.month === 12 && h.day >= 10 && h.day <= 13) return "eid-adha";
    return null;
  }
  function seasonLayer(kind, phase = dayPhase()) {
    if (!kind) return "";
    const night = phase === "night";
    if (kind === "ramadan") {
      const lamps = [80, 190, 300, 410, 520, 630, 740].map((x, i) => {
        const y = 40 + Math.sin((x / 800) * Math.PI) * 34;
        const c = ["#f3c955", "#ee806f", "#62cdf4", "#b49fcf"][i % 4];
        return `<g transform="translate(${x} ${y})"><g class="season-lamp"><path d="M0 0V10" stroke="#70501b" stroke-width="2.4"/>${night ? `<circle cy="26" r="20" fill="#ffe49a" opacity=".35"/>` : ""}<path d="M-8 10H8L11 16V34L6 40H-6L-11 34V16Z" fill="${c}" stroke="#4a3620" stroke-width="2.4" stroke-linejoin="round"/><path d="M-4 18V32M4 18V32" stroke="#fffaf0" stroke-width="1.6" opacity=".8"/><path d="M-5 40L0 46L5 40" fill="#c69434" stroke="#4a3620" stroke-width="1.6"/></g></g>`;
      }).join("");
      return `<div class="lg-season" data-season="ramadan" aria-hidden="true"><svg viewBox="0 0 800 120" preserveAspectRatio="xMidYMin slice"><path d="M-10 30Q400 110 810 30" fill="none" stroke="#70501b" stroke-width="3"/>${lamps}</svg></div>`;
    }
    const flags = Array.from({ length: 13 }, (_, i) => {
      const x = 20 + i * 62, y = 28 + Math.sin((x / 800) * Math.PI) * 30;
      const c = ["#ee806f", "#f3c955", "#7fce54", "#62cdf4", "#b49fcf"][i % 5];
      return `<path d="M${x - 20} ${y}L${x + 20} ${y + 2}L${x} ${y + 34}Z" fill="${c}" stroke="#4a3620" stroke-width="1.6" stroke-linejoin="round"/>`;
    }).join("");
    const crescent = `<g transform="translate(700 74)"><path d="M10-20A22 22 0 1 0 14 18A16 16 0 1 1 10-20Z" fill="#ffe49a" stroke="#70501b" stroke-width="2.4"/><path d="M22-14L24-8L30-8L25-4L27 2L22-2L17 2L19-4L14-8L20-8Z" fill="#ffe49a" stroke="#70501b" stroke-width="1.6"/></g>`;
    return `<div class="lg-season" data-season="${kind}" aria-hidden="true"><svg viewBox="0 0 800 120" preserveAspectRatio="xMidYMin slice"><path d="M-10 26Q400 90 810 26" fill="none" stroke="#70501b" stroke-width="2.4"/>${flags}${crescent}</svg></div>`;
  }

  // Seasons of the Year (v21, 2026-10-02): spring blossoms, autumn leaves,
  // winter snow, falling gently over every scene; summer is the garden as it
  // is. Months follow the household's hemisphere (a grown-up setting).
  function yearSeason(date = new Date(), south = false) {
    const m = (date.getMonth() + (south ? 6 : 0)) % 12;
    return m >= 2 && m <= 4 ? "spring" : m >= 5 && m <= 7 ? "summer" : m >= 8 && m <= 10 ? "autumn" : "winter";
  }
  function yearLayer(kind) {
    const fall = (n, art) => Array.from({ length: n }, (_, i) => `<span class="yr-fall" style="left:${(i * 53 + 7) % 100}%;animation-delay:${-(i * 1.7).toFixed(1)}s;animation-duration:${(9 + (i % 4) * 2.2).toFixed(1)}s">${art(i)}</span>`).join("");
    if (kind === "spring") return `<div class="lg-year" data-year="spring" aria-hidden="true">${fall(8, (i) => `<svg viewBox="-8 -8 16 16"><path d="M0-6C4-6 5 0 0 6C-5 0-4-6 0-6Z" fill="${i % 2 ? "#ffa798" : "#fffaf0"}" stroke="#c25a49" stroke-width="1.6"/></svg>`)}</div>`;
    if (kind === "autumn") return `<div class="lg-year" data-year="autumn" aria-hidden="true">${fall(7, (i) => `<svg viewBox="-10 -8 20 16"><path d="M-8 0Q0-8 8 0Q0 8-8 0Z" fill="${["#e8743c", "#f3c955", "#c25a49"][i % 3]}" stroke="#70501b" stroke-width="1.6"/><path d="M-6 0H6" stroke="#70501b" stroke-width="1.6"/></svg>`)}</div>`;
    if (kind === "winter") return `<div class="lg-year" data-year="winter" aria-hidden="true">${fall(12, () => `<svg viewBox="-6 -6 12 12"><circle r="4" fill="#fffdf7" stroke="#ccfbef" stroke-width="1.6"/></svg>`)}</div>`;
    return "";
  }

  function backdrop(phase = dayPhase(), biome = "meadow") {
    const p = PHASES[phase] || PHASES.day;
    const night = phase === "night";
    const sceneryInk = night ? "#4a4d84" : "#a89478";
    const land = biomeScenery(BIOMES.includes(biome) ? biome : "meadow", night, sceneryInk);
    const celestial = night
      ? `<g class="art-moon">
           <circle cx="620" cy="82" r="62" fill="#6064a0" opacity="0.4"/>
           <circle cx="620" cy="82" r="54" fill="#6064a0" opacity="0.55"/>
           ${season() === "ramadan"
             ? `<path d="M632 36A47 47 0 1 0 640 128A36 36 0 1 1 632 36Z" fill="#e5dcc8" stroke="${sceneryInk}" stroke-width="3"/>`
             : `<circle cx="620" cy="82" r="47" fill="#e5dcc8" stroke="${sceneryInk}" stroke-width="3"/>`}
           <circle cx="603" cy="72" r="9" fill="#e5dcc8" stroke="${sceneryInk}" stroke-width="1.6"/>
           <circle cx="636" cy="98" r="6" fill="#e5dcc8" stroke="${sceneryInk}" stroke-width="1.6"/>
           <circle cx="633" cy="65" r="4.4" fill="#e5dcc8"/>
         </g>
         <g fill="#fffaf0" class="art-stars">
           ${[[90, 60, 3], [220, 120, 2.4], [340, 50, 3.4], [470, 140, 2.2], [560, 40, 2.8], [150, 190, 2], [720, 200, 2.6], [400, 220, 2.2]]
             // Night stars are quiet four-point glints and dots — never the
             // five-point gold star, which means "you earned this".
             .map(([x, y, r], i) => i % 3 === 0
               ? `<path d="M${x} ${y - r * 2.4}Q${x} ${y} ${x + r * 2.4} ${y}Q${x} ${y} ${x} ${y + r * 2.4}Q${x} ${y} ${x - r * 2.4} ${y}Q${x} ${y} ${x} ${y - r * 2.4}Z" style="animation-delay:${i * 0.6}s"/>`
               : `<circle cx="${x}" cy="${y}" r="${r}" opacity="0.85" style="animation-delay:${i * 0.6}s"/>`)
             .join("")}
         </g>`
      : `<g class="art-sun-glow">
           <circle cx="620" cy="88" r="76" fill="#ffe49a" opacity="0.28"/>
           <circle cx="620" cy="88" r="63" fill="#ffe49a" opacity="0.45"/>
           <circle cx="620" cy="88" r="51" fill="${p.accent}" stroke="${sceneryInk}" stroke-width="3"/>
           <circle cx="604" cy="72" r="13" fill="#fffaf0" opacity="0.55"/>
         </g>`;
    const skyId = gradId();
    return `
    <svg class="art-backdrop" data-biome="${BIOMES.includes(biome) ? biome : "meadow"}" viewBox="0 0 800 600" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
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
      ${(() => {
        // Clouds are far-layer masses: no contour (§3). A cooler underside
        // shows below a lit top, the same two-tone trick as the hill ridges.
        const top = night ? "#6064a0" : "#fffdf7";
        const under = night ? "#4a4d84" : phase === "sunset" ? "#ffa798" : "#e5dcc8";
        const cloud = d => `<path d="${d}" fill="${under}"/><path d="${d}" fill="${top}" transform="translate(0 -7)"/>`;
        return `<g opacity="${night ? 0.8 : 0.95}" class="art-clouds">
        <g class="art-cloud-a">${cloud("M78 122 Q83 92 112 98 Q124 64 160 84 Q181 70 201 92 Q229 91 236 119 Q205 133 156 130 Q111 134 78 122 Z")}</g>
        <g class="art-cloud-b">${cloud("M362 91 Q368 66 392 70 Q403 44 432 61 Q451 51 466 70 Q489 70 496 91 Q467 102 429 100 Q391 104 362 91 Z")}</g>
      </g>`;
      })()}
      ${land.far || ""}
      ${[
        { d: "M-10 445 Q145 370 305 429 Q462 480 625 417 Q727 380 812 425 L812 615 L-10 615 Z", c: p.far, crest: 13 },
        { d: "M-10 485 Q198 392 420 462 Q622 526 812 440 L812 615 L-10 615 Z", c: p.mid, crest: 15 },
        { d: "M-10 535 Q257 450 521 522 Q682 565 812 516 L812 615 L-10 615 Z", c: p.near, crest: 17 },
      ]
        .map(({ d, c, crest }, band) => {
          // Ramped ground plane (ban 3): the silhouette in the light tone, with
          // the base mass dropped over it so only a sunlit strip along the ridge
          // shows. Two tones per band, no contour — the ridge reads by value,
          // which is how Toca separates ground planes.
          const r = ramp(c);
          const hills = `<path d="${d}" fill="${r.light}"/><path d="${d}" fill="${r.base}" transform="translate(0 ${crest})"/>`;
          // Lagoon water lies between the middle and near bands.
          return band === 2 ? `${land.water || ""}${hills}` : hills;
        })
        .join("")}
      ${(() => {
        // Trees are the darkest scenery in every phase, which is what supplies
        // the dark tier §4 demands. Crown gets a light kiss so it ramps too.
        // The trunks are stroke-drawn, so the group must carry a stroke or they
        // vanish — they read as shade-on-shade here, not as a contour.
        const t = ramp(p.near);
        const left = land.noTrees !== "both", right = !land.noTrees;
        return `<g fill="${t.shadow}" stroke="${t.shadow}" stroke-width="4" stroke-linecap="round">
        ${left ? `<path d="M113 501V457M113 484L101 473M113 478L125 465" fill="none"/>
        <path d="M88 465Q73 449 88 437Q85 416 107 421Q126 410 135 430Q156 436 140 458Q130 477 113 467Q98 477 88 465Z"/>` : ""}
        ${right ? `<path d="M704 535V482M704 514L689 500M704 505L719 491" fill="none"/>
        <path d="M677 490Q659 474 676 457Q674 437 697 441Q717 427 729 451Q751 460 735 481Q727 503 704 493Q690 502 677 490Z"/>` : ""}
      </g>
      <g fill="${t.light}" opacity="0.45">
        ${left ? `<path d="M86 444Q88 425 106 427Q120 416 129 433Q105 427 94 450Z"/>` : ""}
        ${right ? `<path d="M675 464Q678 444 697 448Q713 435 723 454Q695 445 685 472Z"/>` : ""}
      </g>`;
      })()}
      ${land.props || ""}
      <g class="art-ground-flowers">
      ${[[246,526,1,'#ffa798'],[562,548,.9,'#b49fcf'],[386,566,.85,'#62cdf4']].map(([x,y,k,color])=>`<g transform="translate(${x} ${y}) scale(${k})">
        <ellipse cx="0" cy="23" rx="14" ry="3" fill="${night?'#3b2a19':'#4e9677'}" opacity=".22"/>
        <path d="M0 21Q3 10 0 0" fill="none" stroke="${night?'#4e9677':'#4e9677'}" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M1 17Q-10 16-10 8Q-2 8 1 17M2 13Q12 13 13 5Q5 5 2 13" fill="${night?'#4e9677':'#93ab6c'}"/>
        <g fill="${color}" stroke="${sceneryInk}" stroke-width="1.6" opacity="${night?.7:1}">${[0,72,144,216,288].map(angle=>`<ellipse cy="-5" rx="3.8" ry="6" transform="rotate(${angle})"/>`).join('')}
        <circle r="3.5" fill="#ffe49a"/><circle cx="-1" cy="-1.5" r="1" fill="#ffe49a" stroke="none"/></g>
      </g>`).join('')}
      </g>
      <g fill="#fffaf0" stroke="${sceneryInk}" stroke-width="1.6" opacity="0.8">
        <path d="M42 556 q14 -14 28 0 q-14 14 -28 0Z"/><path d="M744 560 q13 -13 26 0 q-13 13 -26 0Z"/>
      </g>
      ${landLife(BIOMES.includes(biome) ? biome : "meadow", night, sceneryInk)}
      ${night ? `<g class="art-fireflies" fill="#ffe49a">${[[210, 480], [470, 510], [650, 540]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="4" style="animation-delay:${i * 1.1}s"/>`).join("")}</g>` : ""}
      </g>
    </svg>`;
  }

  // One map stop: a circular badge with the same navy rim, warm face and
  // shallow physical lift as every interactive card.
  function mapStop({ hue, label, status, stars = 0, latin = false }) {
    const faceColor = status === "done" ? "#f3c955" : status === "current" ? `hsl(${hue} 54% 70%)` : "#e5dcc8";
    const insetColor = status === "done" ? "#fffaf0" : status === "current" ? `hsl(${hue} 55% 88%)` : "#fffaf0";
    // Warm bronze coin-rim gives the whole path a sunlit, treasure-map feel —
    // no more cold navy drop under the stops.
    const rim = status === "done" ? "#c69434" : status === "current" ? "#c69434" : "#c9bda4";
    const starRow = [0, 1, 2]
      .map(
        (i) =>
          `<g transform="translate(${(i - 1) * 24} 43) scale(0.32)" class="${i < stars ? "map-star-on" : "map-star-off"}"><g transform="translate(-32 -32)">${ICONS.star}</g></g>`,
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
    const contour = locked ? "#a89478" : INK;
    return `
    <svg viewBox="-60 -60 120 120" class="map-stop-art" aria-hidden="true">
      <circle cy="6" r="47" fill="${rim}"/>
      <circle r="47" fill="${faceColor}" stroke="${contour}" stroke-width="${locked ? 3 : 6}"/>
      <circle r="36" fill="${insetColor}" stroke="${contour}" stroke-width="${locked ? 1.6 : 3}"/>
      ${
        locked
          ? `<g class="map-stop-seed" transform="translate(0 4)">
               <ellipse cx="0" cy="0" rx="10" ry="12.5" fill="#c9bda4" stroke="${INKS.faint}" stroke-width="2.4" transform="rotate(-14)"/>
               <path d="M0 -12 Q1 -19 0 -24" fill="none" stroke="${INKS.faint}" stroke-width="2.4" stroke-linecap="round"/>
               <path d="M0 -20 Q-7 -23 -9 -29 Q-1 -28 0 -20 Z" fill="#93ab6c" stroke="${INKS.soft}" stroke-width="1.6" stroke-linejoin="round"/>
             </g>`
          : (() => {
              const size = latin ? 24 : [...label.replace(/[ً-ْٰٓ-ٟؐ-ؚۖ-ۭ]/g, "")].length >= 3 ? 27 : 39;
              // Optical centre, nudged 3 up so the star row below reads as a
              // caption rather than crowding the glyph.
              const s = inkShift(label, size, latin);
              return `<text data-fit-box="0,-3,51,44,${size}" x="${s.dx.toFixed(1)}" y="${(s.dy - 3).toFixed(1)}" text-anchor="middle" font-family="${latin ? LATIN_FONT : AMIRI}" font-size="${size}" fill="${INK}" ${latin ? "" : `direction="rtl"`}>${label}</text>`;
            })()
      }
      ${status !== "locked" ? `<rect class="map-star-plaque" x="-39" y="29" width="78" height="29" rx="14" fill="#fffaf0" stroke="#70501b" stroke-width="2.4"/>${starRow}` : ""}
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
    { id: "lumi", name: "Lumi · garden bird", cost: 0 },
    { id: "mina", name: "Mina · meadow rabbit", cost: 0 },
    { id: "rafi", name: "Rafi · bear cub", cost: 0 },
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
        <path d="M42 30 Q61 34 54 47 Q47 53 41 44 Z" fill="${body}" stroke="${INK}" stroke-width="3"/>`,
      front: "",
    }),
    bunny: (body, rim, belly) => ({
      back: `
        <path d="M-24 -38 Q-34 -86 -12 -66 Q-4 -56 -8 -40 Z" fill="${body}" stroke="${INK}" stroke-width="3"/>
        <path d="M24 -38 Q34 -86 12 -66 Q4 -56 8 -40 Z" fill="${body}" stroke="${INK}" stroke-width="3"/>
        <path d="M-21 -44 Q-26 -74 -13 -60 Q-9 -52 -12 -44 Z" fill="${belly}"/>
        <path d="M21 -44 Q26 -74 13 -60 Q9 -52 12 -44 Z" fill="${belly}"/>
        <circle cx="44" cy="36" r="10" fill="${belly}" stroke="${INK}" stroke-width="3"/>`,
      front: "",
    }),
    chick: (body, rim, belly) => ({
      back: `
        <path d="M-4 -50 Q-10 -66 0 -60 Q6 -68 8 -56 Q16 -60 10 -48 Z" fill="#f3c955" stroke="${INK}" stroke-width="3"/>
        <path d="M-44 6 Q-62 14 -50 30 Q-42 38 -34 26 Z" fill="${body}" stroke="${INK}" stroke-width="3"/>
        <path d="M44 6 Q62 14 50 30 Q42 38 34 26 Z" fill="${body}" stroke="${INK}" stroke-width="3"/>
        <path d="M-6 46 Q-16 62 0 58 Q16 62 6 46 Z" fill="#f3c955" stroke="${INK}" stroke-width="3"/>`,
      front: `<path d="M-5 14 L0 21 L5 14 Q0 10 -5 14 Z" fill="#f3c955" stroke="${INK}" stroke-width="2.4"/>`,
    }),
    cat: (body, rim, belly) => ({
      back: `
        <path d="M-34 -26 Q-44 -58 -12 -42 Q-20 -34 -22 -26 Z" fill="${body}" stroke="${INK}" stroke-width="3"/>
        <path d="M34 -26 Q44 -58 12 -42 Q20 -34 22 -26 Z" fill="${body}" stroke="${INK}" stroke-width="3"/>
        <path d="M-30 -34 Q-35 -49 -20 -41 Z" fill="#ffa798"/>
        <path d="M30 -34 Q35 -49 20 -41 Z" fill="#ffa798"/>
        <path d="M40 28 Q66 24 60 2 Q57 -8 48 -2 Q54 6 46 12 Q34 18 38 30 Z" fill="${body}" stroke="${INK}" stroke-width="3"/>`,
      front: `
        <g stroke="${INK}" stroke-width="2.4" stroke-linecap="round" opacity="0.8">
          <path d="M-28 4 L-44 0 M-28 9 L-44 10 M28 4 L44 0 M28 9 L44 10"/>
        </g>`,
    }),
    dragon: (body, rim, belly) => ({
      back: `
        <path d="M-16 -42 L-8 -64 L-1 -46 L7 -68 L14 -46 L20 -60 L23 -41 Z" fill="${belly}" stroke="${INK}" stroke-width="3"/>
        <path d="M-44 -8 Q-74 -26 -66 2 Q-60 16 -40 12 Z" fill="${belly}" stroke="${INK}" stroke-width="3"/>
        <path d="M44 -8 Q74 -26 66 2 Q60 16 40 12 Z" fill="${belly}" stroke="${INK}" stroke-width="3"/>
        <path d="M38 34 Q62 44 58 56 L48 50 Q54 58 44 60 Q32 58 34 42 Z" fill="${body}" stroke="${INK}" stroke-width="3"/>
        <path d="M-16 -48 Q-20 -58 -12 -54 Z" fill="${rim}"/>
        <path d="M16 -48 Q20 -58 12 -54 Z" fill="${rim}"/>`,
      front: "",
    }),
  };

  function pet({ hue = 200, species = "blob", stage = 1, worn = [], size = 140, mood = "happy" } = {}) {
    if (ns.LettersAnimalArt?.characters[species]) return ns.LettersAnimalArt.render(species, {hue, items: worn, size, stage, mood});
    const scale = stage >= 3 ? 1.14 : stage >= 2 ? 1 : 0.86;
    const id = gradId();
    const body = `hsl(${hue} 72% 62%)`;
    const rim = `hsl(${hue} 62% 40%)`;
    const belly = `hsl(${hue} 78% 82%)`;
    const parts = (SPECIES[species] || SPECIES.blob)(body, rim, belly);
    return `
    <svg class="art-pet" viewBox="-70 -74 140 152" width="${size}" height="${size * 1.09}" aria-hidden="true" data-rig-species="blob">
      <defs>${bodyGrad(id, hue, 72, 62)}</defs>
      <ellipse cy="66" rx="36" ry="7.5" fill="${SHADOW}" transform="scale(${scale})"/>
      <g data-rig="root"><g class="art-pet-body" transform="scale(${scale})">
        ${stage >= 3 ? `<g opacity="0.9">${[-46, 46].map((x) => `<circle cx="${x}" cy="-40" r="3.4" fill="#f3c955"/>`).join("")}<circle cx="0" cy="-58" r="4" fill="#f3c955"/></g>` : ""}
        ${parts.back}
        ${stage >= 2 ? `<path d="M-40 8 Q-58 2 -50 22 Q-44 30 -36 24 Z" fill="${belly}" stroke="${INK}" stroke-width="3"/><path d="M40 8 Q58 2 50 22 Q44 30 36 24 Z" fill="${belly}" stroke="${INK}" stroke-width="3"/>` : ""}
        <circle cy="4" r="46" fill="url(#${id})" stroke="${INK}" stroke-width="3"/>
        <ellipse cy="22" rx="26" ry="20" fill="${belly}"/>
        <ellipse cx="-17" cy="-17" rx="10" ry="8" fill="#fffdf7" opacity="0.45"/>
        <ellipse cx="-18" cy="52" rx="11" ry="7" fill="${rim}" stroke="${INK}" stroke-width="2.4"/>
        <ellipse cx="18" cy="52" rx="11" ry="7" fill="${rim}" stroke="${INK}" stroke-width="2.4"/>
        <g data-rig="head">${face(0, -4, 1.1, mood, body)}</g>
        ${parts.front}
        ${worn.map((wid) => ACCESSORY_ART[wid] || "").join("")}
      </g></g>
    </svg>`;
  }

  const ACCESSORY_ART = {
    cap: `<g transform="translate(0 -46)"><path d="M-24 2A24 16 0 0 1 24 2L23 6H-24Z" fill="#ffa06e" stroke="#70501b" stroke-width="2.4"/><path d="M-2-10Q-12-6-13 0" fill="none" stroke="#c9bda4" stroke-width="3" stroke-linecap="round"/><path d="M5-9Q13-5 14 0" fill="none" stroke="#c25a49" stroke-width="1.6"/><circle cy="-12" r="3" fill="#ffe49a" stroke="#a89478" stroke-width="1.6"/><path d="M-27 3Q0-5 27 3L30 9Q0 4-30 9Z" fill="#ee806f" stroke="#70501b" stroke-width="2.4" stroke-linejoin="round"/><path d="M-22 4Q0-1 22 4" fill="none" stroke="#ffa798" stroke-width="1.6"/></g>`,
    crown: `<g transform="translate(0 -48)"><path d="M-20 8V-8L-10 0L0-12L10 0L20-8V8Z" fill="#f3c955" stroke="#a89478" stroke-width="2.4" stroke-linejoin="round"/><path d="M-17 5H17" stroke="#c69434" stroke-width="3"/><path d="M-16 1H16" stroke="#ffe49a" stroke-width="1.6"/><path d="M0-5L4-1L0 3L-4-1Z" fill="#ffa798" stroke="#a89478" stroke-width="1.6"/></g>`,
    bow: `<g transform="translate(26 -34) rotate(20)"><path d="M-2 0Q-10-11-15-9Q-18 0-15 9Q-9 9-2 0M2 0Q10-11 15-9Q18 0 15 9Q9 9 2 0" fill="#ffa798" stroke="#c25a49" stroke-width="2.4"/><path d="M-11-4L-5-1M11-4L5-1M-11 5L-5 2M11 5L5 2" stroke="#c25a49" stroke-width="1.6"/><rect x="-3" y="-4" width="6" height="8" rx="2" fill="#ee806f" stroke="#c25a49" stroke-width="1.6"/></g>`,
    glasses: `<g transform="translate(0 -6)" fill="none" stroke="#70501b" stroke-width="2.4"><circle cx="-12" r="9"/><circle cx="12" r="9"/><path d="M-3 0Q0-3 3 0M-21-2L-25-4M21-2L25-4" stroke-linecap="round"/><path d="M-18-6Q-15-9-11-9M6-6Q9-9 13-9" stroke="#c9bda4" stroke-width="1.6" stroke-linecap="round"/></g>`,
    scarf: `<g transform="translate(0 22)"><path d="M-24 0 Q0 12 24 0 L22 10 Q0 20 -22 10 Z" fill="#4e9677" stroke="${INKS.base}" stroke-width="3"/><path d="M14 8 L20 30 L8 26 Z" fill="#4e9677" stroke="${INKS.base}" stroke-width="3"/><path d="M-17 5Q0 13 17 5M12 21l5 2" fill="none" stroke="#b7e779" stroke-width="1.6" stroke-linecap="round"/></g>`,
    flower: `<g transform="translate(-27 -36)">${[0,72,144,216,288].map(a=>`<ellipse cy="-6" rx="4.5" ry="7" transform="rotate(${a})" fill="#ffa798" stroke="#c25a49" stroke-width="1.6"/>`).join('')}<circle r="4.7" fill="#ffe49a" stroke="#a89478" stroke-width="1.6"/><circle cx="-1.5" cy="-2" r="1.4" fill="#ffe49a"/></g>`,
    balloon: `<g transform="translate(42 -30)"><path d="M0 16 Q-4 31 0 40" fill="none" stroke="${INKS.base}" stroke-width="1.6"/><path d="M0 14l-3 6q3-2 6 0Z" fill="#3a8fc4" stroke="${INKS.base}" stroke-width="1.6"/><ellipse rx="13" ry="16" fill="#62cdf4" stroke="${INKS.base}" stroke-width="3"/><path d="M8-8Q14 7 2 12" fill="none" stroke="#3a8fc4" stroke-width="2.4" stroke-linecap="round"/><path d="M-8-2Q-8-9-3-11" fill="none" stroke="#ccfbef" stroke-width="3" stroke-linecap="round"/></g>`,
    wand: `<g transform="translate(-42 6) rotate(-24)"><rect x="-2" y="0" width="4" height="34" rx="2" fill="#c69434" stroke="${INKS.base}" stroke-width="1.6"/><path d="M0 13v16" stroke="#ffe49a" stroke-width="1.6" stroke-linecap="round"/><g transform="translate(0 -6) scale(0.32)"><path d="M0 -26 L7 -6 L27 -5 L11 8 L16 27 L0 16 L-16 27 L-11 8 L-27 -5 L-7 -6 Z" fill="#f3c955" stroke="${INKS.base}" stroke-width="6"/><path d="M0-16L-3-3-15-2" fill="none" stroke="#ffe49a" stroke-width="4" stroke-linecap="round"/></g></g>`,
    taqiyah: `<g transform="translate(0 -46)"><path d="M-22 6A22 14 0 0 1 22 6L22 10Q0 6-22 10Z" fill="#fffaf0" stroke="#a89478" stroke-width="2.4"/><path d="M-19 5Q0 0 19 5" fill="none" stroke="#c9bda4" stroke-width="4"/><path d="M-18 5Q0 0 18 5" fill="none" stroke="#fffaf0" stroke-width="1.6" stroke-dasharray="1 3"/><path d="M-3-5Q-12-3-14 0M3-5Q12-3 14 0" fill="none" stroke="#c9bda4" stroke-width="1.6"/></g>`,
    cape: `<g transform="translate(0 4)"><path d="M-32 16Q-44 27-38 44L-22 36-24 19ZM32 16Q44 27 38 44L22 36 24 19Z" fill="#ee806f" stroke="${INKS.base}" stroke-width="3"/><path d="M-33 24L-34 36M33 24L34 36" stroke="#ffa798" stroke-width="2.4" stroke-linecap="round"/><path d="M-26 19Q0 31 26 19" fill="none" stroke="#ee806f" stroke-width="4"/><circle cy="25" r="3" fill="#f3c955" stroke="${INKS.base}" stroke-width="1.6"/></g>`,
    medal: `<g transform="translate(0 30)"><path d="M-6 -14 L0 -4 L6 -14" stroke="#4e9677" stroke-width="4" fill="none"/><circle cy="4" r="9" fill="#f3c955" stroke="${GOLD.mid}" stroke-width="3"/><circle cy="4" r="6.5" fill="none" stroke="#c69434" stroke-width="1.6"/><path d="M0 -1 L2 3 L6 3 L3 6 L4 10 L0 8 L-4 10 L-3 6 L-6 3 L-2 3 Z" fill="#fffaf0"/></g>`,
    kite: `<g transform="translate(44 -22) rotate(14)"><path d="M0-16L12 0 0 16-12 0Z" fill="#62cdf4" stroke="${INKS.base}" stroke-width="3"/><path d="M0-16V0H-12Z" fill="#ffe49a"/><path d="M0 0H12L0 16Z" fill="#ee806f"/><path d="M0-16V16M-12 0H12" stroke="${INKS.base}" stroke-width="1.6"/><path d="M0 16Q-4 26 0 34Q4 40 0 46" fill="none" stroke="${INKS.base}" stroke-width="1.6"/><path d="M-1 27l-5-3v6l5-2 5 3v-7ZM1 38l-5-3v6l5-2 5 3v-7Z" fill="#ffa798" stroke="${INKS.base}" stroke-width="1.6" stroke-linejoin="round"/></g>`,
    sprout: `<g transform="translate(0 -50)"><ellipse cy="10" rx="7" ry="3" fill="#a89478" stroke="#a89478" stroke-width="1.6"/><path d="M0 9Q-1 2 0-2" stroke="#4e9677" stroke-width="2.4" fill="none"/><path d="M0-2Q-12-6-13-16Q-2-14 0-2Z" fill="#93ab6c" stroke="#4e9677" stroke-width="1.6"/><path d="M0-2Q12-8 14-17Q3-15 0-2Z" fill="#b7e779" stroke="#4e9677" stroke-width="1.6"/><path d="M-9-11L-2-4M3-5L10-12" stroke="#ffe49a" stroke-width="1.6" stroke-linecap="round"/></g>`,
    moonpin: `<g transform="translate(-26 26)"><path d="M4 -10 A11 11 0 1 0 4 10 A8 8 0 1 1 4 -10" fill="#ffe49a" stroke="${GOLD.mid}" stroke-width="2.4"/><circle cx="8" cy="-9" r="2.4" fill="#f3c955" stroke="${GOLD.mid}" stroke-width="1.6"/><path d="M-2-6Q-8 0-2 6" fill="none" stroke="#fffaf0" stroke-width="1.6" stroke-linecap="round"/></g>`,
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

  // Flat egg with the cast's ink contour, sitting IN a woven nest (update:
  // open art items, 2026-10-01). Each tap escalates: a fissure, then a second
  // fissure and a chip with warm light and the pet's eyes peeking out. The
  // shell wobbles; the nest stays put.
  function egg({ size = 150, cracks = 0 } = {}) {
    const ink = "#4a3620";
    return `
    <svg class="art-egg" viewBox="-62 -60 124 124" width="${size}" height="${size}" aria-hidden="true">
      <ellipse cy="58" rx="54" ry="5" fill="#2f5c46" opacity=".2"/>
      <g class="art-egg-nest-back"><ellipse cy="32" rx="54" ry="13" fill="#a89478" stroke="${ink}" stroke-width="3"/><ellipse cy="33" rx="44" ry="8" fill="#70501b"/></g>
      <g class="art-egg-tap"><g class="art-egg-body">
        <path d="M0 -52 C30 -52 42 -18 42 8 C42 36 24 52 0 52 C-24 52 -42 36 -42 8 C-42 -18 -30 -52 0 -52 Z" fill="#fffdf7"/>
        <path d="M18 -40 C34 -26 40 -4 40 10 C40 34 24 50 2 52 C22 44 32 26 30 6 C29 -12 26 -28 18 -40 Z" fill="#e5dcc8"/>
        <g><circle cx="14" cy="-4" r="6" fill="#ffa798"/><circle cx="-18" cy="12" r="5" fill="#96ecff"/><circle cx="-6" cy="-30" r="4" fill="#f3c955"/><circle cx="22" cy="24" r="4" fill="#b7e779"/></g>
        ${cracks >= 2 ? `<path d="M12 -12 L26 -2 L16 10 L4 2 Z" fill="#3b2a19"/>
          <path d="M12 -12 L26 -2 L16 10 L4 2 Z" fill="none" stroke="#ffe49a" stroke-width="2.4" stroke-linejoin="round"/>
          <g class="art-egg-peek"><circle cx="11" cy="0" r="2.6" fill="#fffdf7"/><circle cx="18" cy="0" r="2.6" fill="#fffdf7"/><circle cx="11.6" cy=".4" r="1.3" fill="${ink}"/><circle cx="18.6" cy=".4" r="1.3" fill="${ink}"/></g>` : ""}
        <path d="M0 -52 C30 -52 42 -18 42 8 C42 36 24 52 0 52 C-24 52 -42 36 -42 8 C-42 -18 -30 -52 0 -52 Z" fill="none" stroke="${ink}" stroke-width="3"/>
        ${cracks >= 1 ? `<path d="M-32 -12 L-19 -3 L-28 8 L-15 15" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M-19 -3 L-8 -10" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>` : ""}
        ${cracks >= 2 ? `<path d="M12 -12 L17 -19 L14 -24 L20 -31 M26 -2 L31 -6 L34 1 L39 -2 M16 10 L14 16 L19 19 L17 26" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>` : ""}
      </g></g>
      <g class="art-egg-nest">
        <path d="M-58 33Q0 50 58 33L51 50Q0 66-51 50Z" fill="#c69434" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M-48 41Q-10 53 30 45M-42 48Q0 58 44 47M-32 38L-22 55M6 44L2 59M34 40L28 55" fill="none" stroke="#70501b" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M-52 37Q-22 46 8 46" fill="none" stroke="#ffe49a" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>
        <path d="M46 36Q61 25 61 41Q53 47 46 36Z" fill="#7fce54" stroke="#4e9677" stroke-width="1.6"/><path d="M-46 38Q-62 30-60 44Q-52 48-46 38Z" fill="#7fce54" stroke="#4e9677" stroke-width="1.6"/>
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
    identify: `<circle r="5.5" fill="none" stroke="#fffdf7" stroke-width="2.4"/><circle r="1.8" fill="#fffdf7"/>`,
    memorize: `<rect x="-7" y="-5" width="8" height="10" rx="2" fill="none" stroke="#fffdf7" stroke-width="2.4"/><rect x="-1" y="-5" width="8" height="10" rx="2" fill="none" stroke="#fffdf7" stroke-width="2.4"/>`,
    visualize: `<text y="5" text-anchor="middle" font-family="'Amiri Quran', serif" font-size="15" fill="#fffdf7">ﺑ</text>`,
    blend: `<circle cx="-4" cy="0" r="4.5" fill="none" stroke="#fffdf7" stroke-width="2.4"/><circle cx="4" cy="0" r="4.5" fill="none" stroke="#fffdf7" stroke-width="2.4"/>`,
    write: `<path d="M-5 6 L3 -6 L6 -3 L-2 8 Z M-5 6 L-6 9 L-3 8 Z" fill="#fffdf7"/>`,
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
      <circle r="17" fill="#f3c955" stroke="${GOLD.mid}" stroke-width="3"/>
      ${face(0, -1, 0.55)}
    </svg>`;
  }

  // ---------- sticker collection ----------
  // Die-cut stickers, like the sheets kids peel: each drawing sits on a white
  // wobbly-round backing with a soft shadow and a peeling shine. Owned ones
  // tilt playfully in the album; unowned slots are grey question blanks.

  const STICKER_ART = {
    sun: `<g fill="none" stroke="#c69434" stroke-width="3" stroke-linecap="round">${[0,45,90,135,180,225,270,315].map(a=>`<path d="M0-22V-27" transform="rotate(${a})"/>`).join('')}</g><circle r="17" fill="#f3c955" stroke="#a89478" stroke-width="2.4"/><path d="M-14 7Q0 20 14 7Q9 20-3 17Z" fill="#c69434"/><path d="M-11-6Q-8-13-1-13" fill="none" stroke="#ffe49a" stroke-width="3"/><g fill="#4a3620"><circle cx="-6" cy="-1" r="2"/><circle cx="6" cy="-1" r="2"/></g><path d="M-4 6Q0 10 4 6" fill="none" stroke="#4a3620" stroke-width="2.4"/>`,
    moon: `<path d="M11-22C-7-27-24-11-21 7C-18 25 6 30 21 12C5 17-6 5-3-8C-1-14 4-19 11-22Z" fill="#ffe49a" stroke="#a89478" stroke-width="2.4"/><path d="M-17 2Q-18 17-4 21" fill="none" stroke="#c9bda4" stroke-width="4"/><path d="M-17-7Q-13-17-5-19" fill="none" stroke="#fffaf0" stroke-width="3"/><circle cx="-12" cy="8" r="3" fill="#c9bda4"/><circle cx="-7" cy="16" r="1.7" fill="#c9bda4"/>`,
    star: `<path d="M0-24Q2-24 4-19L9-8L22-6Q28-5 23 0L13 9L16 22Q17 28 11 24L0 17L-12 24Q-18 27-16 20L-13 9L-23 0Q-28-5-22-6L-9-8L-4-19Q-2-24 0-24Z" fill="#f3c955" stroke="#a89478" stroke-width="2.4" stroke-linejoin="round"/><path d="M-15 1L-8 7L-10 17L0 11L10 17L8 6L16-1L7 0L0 7Z" fill="#c69434" opacity=".55"/><path d="M-15-3L-6-4L0-17" fill="none" stroke="#ffe49a" stroke-width="3" stroke-linecap="round"/>`,
    rainbow: `<g fill="none" stroke-width="6"><path d="M-23 13A23 23 0 0 1 23 13" stroke="#ee806f"/><path d="M-17 13A17 17 0 0 1 17 13" stroke="#f3c955"/><path d="M-11 13A11 11 0 0 1 11 13" stroke="#4e9677"/></g><g fill="#fffaf0" stroke="#c9bda4" stroke-width="1.6"><path d="M-28 14Q-30 7-24 7Q-20 0-15 8Q-7 9-11 16Q-18 20-28 17Z"/><path d="M11 16Q7 9 15 8Q20 0 24 7Q30 7 28 14L28 17Q18 20 11 16Z"/></g>`,
    palm: `<path d="M-6 24Q-1 8-4-8L3-10Q8 8 2 24Z" fill="#a89478" stroke="#70501b" stroke-width="2.4"/><path d="M-3 4L3 7M-3 13L2 16" stroke="#a89478" stroke-width="2.4"/><g stroke="#2f5c46" stroke-width="1.6" stroke-linejoin="round"><path d="M0-10Q-23-19-26 0Q-14-9 0-10Z" fill="#4e9677"/><path d="M0-10Q-14-31-26-17Q-12-19 0-10Z" fill="#7fce54"/><path d="M0-10Q-7-31 5-28Q11-19 0-10Z" fill="#4e9677"/><path d="M0-10Q13-32 26-17Q12-20 0-10Z" fill="#7fce54"/><path d="M0-10Q24-15 27 4Q12-7 0-10Z" fill="#4e9677"/></g><circle cx="-4" cy="-7" r="4" fill="#a89478" stroke="#70501b" stroke-width="1.6"/><circle cx="3" cy="-6" r="4" fill="#c69434" stroke="#70501b" stroke-width="1.6"/>`,
    flower: `<path d="M1 3Q-3 15 0 26" fill="none" stroke="#4e9677" stroke-width="3"/><path d="M0 21Q-17 19-16 9Q-5 7 0 21M0 17Q13 4 18 9Q17 21 0 23" fill="#7fce54" stroke="#4e9677" stroke-width="1.6"/><g transform="translate(0 -8)">${[0,72,144,216,288].map(a=>`<ellipse cy="-8" rx="6" ry="10" transform="rotate(${a})" fill="#ffa798" stroke="#c25a49" stroke-width="1.6"/>`).join('')}<circle r="7" fill="#f3c955" stroke="#c69434" stroke-width="1.6"/><circle cx="-2" cy="-2" r="2" fill="#ffe49a"/></g>`,
    butterfly: `<g stroke="#4a3620" stroke-width="1.6"><path d="M-2-8C-29-37-31-2-9 3C-28 8-13 30-2 11Z" fill="#62cdf4"/><path d="M2-8C29-37 31-2 9 3C28 8 13 30 2 11Z" fill="#62cdf4"/><path d="M-3 2Q-22 3-15 15Q-7 24-2 10M3 2Q22 3 15 15Q7 24 2 10" fill="#ffa798"/></g><g fill="#ccfbef"><ellipse cx="-15" cy="-10" rx="4" ry="6" transform="rotate(-28 -15 -10)"/><ellipse cx="15" cy="-10" rx="4" ry="6" transform="rotate(28 15 -10)"/></g><path d="M-2-13L-7-21M2-13L7-21" fill="none" stroke="#70501b" stroke-width="2.4"/><rect x="-3" y="-14" width="6" height="30" rx="3" fill="#70501b"/>`,
    bee: `<g fill="#ccfbef" stroke="#62cdf4" stroke-width="1.6"><path d="M-3-7C-24-34-27-7-3-3Z"/><path d="M0-7C10-31 23-13 5-2Z"/></g><path d="M-21 2L-27 6L-20 10Z" fill="#70501b"/><ellipse cx="-3" cy="6" rx="19" ry="13" fill="#f3c955" stroke="#70501b" stroke-width="2.4"/><path d="M-11-5Q-16 7-10 18M-1-7Q-6 6-1 19" fill="none" stroke="#70501b" stroke-width="4"/><path d="M-17-1Q-12-6-7-5" fill="none" stroke="#ffe49a" stroke-width="2.4"/><circle cx="15" cy="3" r="9" fill="#ffe49a" stroke="#70501b" stroke-width="2.4"/><circle cx="17" cy="1" r="1.8" fill="#4a3620"/><path d="M14-5L13-13M18 8Q21 9 22 6" fill="none" stroke="#4a3620" stroke-width="1.6"/>`,
    dove: `<path d="M-13 8L-26 4L-22 17L-12 14" fill="#e5dcc8" stroke="#a89478" stroke-width="2.4" stroke-linejoin="round"/><path d="M-17 7Q-12-2 0-2Q2-16 13-14Q23-13 21-2Q22 12 9 17Q-10 23-17 7Z" fill="#fffaf0" stroke="#a89478" stroke-width="2.4"/><path d="M-10 4Q-16-5-13-15Q-2-10 5 4Q-2 15-10 4Z" fill="#e5dcc8" stroke="#a89478" stroke-width="1.6"/><path d="M21-6L28-2L21 1" fill="#f3c955" stroke="#a89478" stroke-width="1.6"/><circle cx="15" cy="-7" r="1.8" fill="#2f5c46"/><path d="M4 17L2 22M10 17L9 22" stroke="#a89478" stroke-width="2.4" stroke-linecap="round"/>`,
    fish: `<path d="M-13 0Q-24-12-27-10L-24 0L-27 11Q-20 12-13 3" fill="#f3c955" stroke="#a89478" stroke-width="2.4" stroke-linejoin="round"/><path d="M-2-10Q1-22 12-16L10-9M0 10L5 19L12 10" fill="#62cdf4" stroke="#3a8fc4" stroke-width="1.6"/><path d="M-17 0Q-8-15 9-12Q25-10 26 0Q25 11 9 13Q-8 15-17 0Z" fill="#96ecff" stroke="#3a8fc4" stroke-width="2.4"/><path d="M-10 5Q5 15 20 5" fill="none" stroke="#4e9677" stroke-width="4" stroke-linecap="round"/><path d="M0-6Q-5 0 0 6L7 0Z" fill="#ffe49a" stroke="#a89478" stroke-width="1.6"/><circle cx="17" cy="-3" r="2.3" fill="#2f5c46"/><circle cx="17.5" cy="-3.8" r=".7" fill="#fffdf7"/><path d="M24 4L26 3M1-9Q6-11 10-9" fill="none" stroke="#ccfbef" stroke-width="2.4" stroke-linecap="round"/>`,
    boat: `<path d="M-26 7L-7 21L16 21L27 7L2 12Z" fill="#e5dcc8" stroke="#a89478" stroke-width="2.4" stroke-linejoin="round"/><path d="M-26 7L4 16L16 21L-7 21Z" fill="#c9bda4"/><path d="M2 10L4-25L-18 6Z" fill="#fffaf0" stroke="#a89478" stroke-width="2.4" stroke-linejoin="round"/><path d="M4-25L-6 7L2 10Z" fill="#e5dcc8"/><path d="M7-16L7 7L24 7Z" fill="#fffaf0" stroke="#a89478" stroke-width="2.4" stroke-linejoin="round"/><path d="M-23 26Q-17 23-11 26M4 27Q13 24 22 26" fill="none" stroke="#62cdf4" stroke-width="2.4" stroke-linecap="round"/>`,
    lantern: `<path d="M-6-18V-23Q0-30 6-23V-18" fill="none" stroke="#a89478" stroke-width="2.4"/><path d="M-12-15L12-15L16-8L13 17L-13 17L-16-8Z" fill="#ffe49a" stroke="#a89478" stroke-width="2.4" stroke-linejoin="round"/><path d="M-6-14L-8 17M6-14L8 17M-15-7H15" fill="none" stroke="#c69434" stroke-width="2.4"/><path d="M0-4Q-8 5-3 10Q5 16 6 7Q5 2 2 0Q3 6 0 5Z" fill="#ffa06e"/><path d="M0 4Q-4 9 0 11Q4 10 0 4Z" fill="#fffaf0"/><path d="M-12-16L-7-20H7L12-16M-14 17H14V22H-14Z" fill="#c9bda4" stroke="#4e9677" stroke-width="2.4" stroke-linejoin="round"/><path d="M-10-11L-11 1" stroke="#ffe49a" stroke-width="2.4" stroke-linecap="round"/>`,
    key: `<g transform="rotate(28)"><path d="M-4-5H4V8H12V14H4V19H10V25H-4Z" fill="#f3c955" stroke="#c69434" stroke-width="2.4" stroke-linejoin="round"/><path d="M-1 0V20" stroke="#ffe49a" stroke-width="2.4" stroke-linecap="round"/><circle cy="-13" r="12" fill="#ffe49a" stroke="#c69434" stroke-width="2.4"/><circle cy="-13" r="6" fill="#e5dcc8" stroke="#c69434" stroke-width="1.6"/><path d="M-8-17Q-6-22-1-22" fill="none" stroke="#ffe49a" stroke-width="2.4" stroke-linecap="round"/></g>`,
    egg: `<path d="M0-26C9-26 21-8 21 7C21 22 12 28 0 28C-12 28-21 22-21 7C-21-8-9-26 0-26Z" fill="#e5dcc8" stroke="#a89478" stroke-width="2.4"/><path d="M15-6C22 17 7 27-7 22Q7 33 18 19Q24 9 15-6Z" fill="#c9bda4"/><path d="M-12-8Q-10-16-4-19" fill="none" stroke="#fffaf0" stroke-width="4" stroke-linecap="round"/><g fill="#c9bda4" opacity=".75"><ellipse cx="-11" cy="7" rx="2" ry="2.7" transform="rotate(24 -11 7)"/><ellipse cx="7" cy="0" rx="1.8" ry="2.4"/><circle cx="2" cy="13" r="2"/><circle cx="-5" cy="-4" r="1.3"/><circle cx="10" cy="17" r="1.2"/></g>`,
    cat: `<path d="M-20-6L-23-25Q-12-24-8-16Q0-20 8-16Q15-26 23-25L20-6Q26 10 16 21Q0 30-16 21Q-26 10-20-6Z" fill="#c9bda4" stroke="#a89478" stroke-width="2.4"/><path d="M-17-10L-19-19L-11-14M17-10L19-19L11-14" fill="#c9bda4" stroke="#a89478" stroke-width="1.6"/><path d="M-10 5Q0 1 10 5Q19 19 0 22Q-19 19-10 5Z" fill="#e5dcc8"/><g fill="#4a3620"><ellipse cx="-9" cy="1" rx="3" ry="4"/><ellipse cx="9" cy="1" rx="3" ry="4"/></g><g fill="#fffaf0"><circle cx="-10" cy="0" r="1"/><circle cx="8" cy="0" r="1"/></g><path d="M-3 8H3L0 11Z" fill="#ee806f"/><path d="M0 11V14Q-4 18-7 14M0 14Q4 18 7 14M-14 10L-24 8M-14 15L-24 17M14 10L24 8M14 15L24 17" fill="none" stroke="#a89478" stroke-width="1.6" stroke-linecap="round"/>`,
    cloud: `<path d="M-20 13Q-31 12-28 1Q-26-7-18-7Q-20-21-5-22Q6-25 12-12Q27-16 29-3Q35 7 25 13Q13 18 2 14Q-11 18-20 13Z" fill="#fffaf0" stroke="#a89478" stroke-width="2.4"/><path d="M-25 6Q-19 11-11 8Q0 15 10 8Q22 12 28 4Q29 14 17 14L-16 15Q-23 14-25 6Z" fill="#e5dcc8"/><path d="M-13-12Q-12-18-5-18Q2-21 6-15" fill="none" stroke="#fffdf7" stroke-width="3" stroke-linecap="round"/>`,
    // The Quranic animals — the island's cast, sticker-sized.
    camel: `<path d="M-21 4Q-26 7-24 14" fill="none" stroke="#70501b" stroke-width="2.4" stroke-linecap="round"/><g fill="#c69434" stroke="#70501b" stroke-width="1.6"><rect x="-17" y="8" width="5" height="17" rx="2"/><rect x="-9" y="9" width="5" height="16" rx="2"/><rect x="2" y="9" width="5" height="16" rx="2"/><rect x="9" y="8" width="5" height="17" rx="2"/></g><path d="M-21 8Q-23-3-14-6Q-8-20 0-8Q5-4 9-5Q11-13 14-17Q17-22 23-20Q27-18 26-14Q25-11 21-12Q18-6 16 4Q15 13 6 13H-15Q-21 13-21 8Z" fill="#f3c955" stroke="#70501b" stroke-width="2.4" stroke-linejoin="round"/><path d="M-17 10Q-4 13 12 9" fill="none" stroke="#c69434" stroke-width="3" stroke-linecap="round" opacity=".7"/><path d="M-11-6Q-7-14-2-8" fill="none" stroke="#ffe49a" stroke-width="3" stroke-linecap="round"/><path d="M18-20L17-25L21-21Z" fill="#c69434" stroke="#70501b" stroke-width="1.6" stroke-linejoin="round"/><circle cx="21" cy="-17" r="2" fill="#4a3620"/><circle cx="21.7" cy="-17.7" r=".7" fill="#fffdf7"/><path d="M23-13Q24.5-12 26-13.5" fill="none" stroke="#70501b" stroke-width="1.6" stroke-linecap="round"/>`,
    elephant: `<path d="M19 1Q26 3 25 10" fill="none" stroke="#70501b" stroke-width="2.4" stroke-linecap="round"/><g fill="#c9bda4" stroke="#70501b" stroke-width="2.4"><rect x="-12" y="7" width="8" height="17" rx="3"/><rect x="8" y="7" width="8" height="17" rx="3"/></g><path d="M-12-10Q4-17 16-8Q22-2 20 8Q18 15 8 14H-10Q-16 14-16 6Z" fill="#c9bda4" stroke="#70501b" stroke-width="2.4" stroke-linejoin="round"/><path d="M-23-2Q-27 8-24 15Q-22 20-17 17" fill="none" stroke="#70501b" stroke-width="8" stroke-linecap="round"/><path d="M-23-2Q-27 8-24 15Q-22 20-17 17" fill="none" stroke="#c9bda4" stroke-width="4" stroke-linecap="round"/><circle cx="-15" cy="-6" r="11" fill="#c9bda4" stroke="#70501b" stroke-width="2.4"/><path d="M-9-13Q4-17 4-2Q4 9-7 7Q-12 2-9-13Z" fill="#e5dcc8" stroke="#70501b" stroke-width="2.4" stroke-linejoin="round"/><path d="M-6-9Q0-11 0-3Q-1 3-5 2Z" fill="#ffa798"/><path d="M2-9Q10-13 15-8" fill="none" stroke="#e5dcc8" stroke-width="3" stroke-linecap="round"/><circle cx="-18" cy="-8" r="2" fill="#4a3620"/><circle cx="-17.3" cy="-8.7" r=".7" fill="#fffdf7"/><circle cx="-21" cy="-2" r="2.4" fill="#ffa798" opacity=".75"/>`,
    ant: `<g fill="none" stroke="#8a3a2d" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M-3 7L-9 14L-14 15M0 8L0 16L-3 21M3 7L9 14L14 16"/><path d="M14-6Q15-15 21-17M10-7Q8-16 2-18"/></g><ellipse cx="-14" cy="3" rx="10" ry="8" fill="#ee806f" stroke="#8a3a2d" stroke-width="2.4"/><ellipse cx="0" cy="4" rx="6" ry="5" fill="#ee806f" stroke="#8a3a2d" stroke-width="2.4"/><circle cx="12" cy="1" r="8" fill="#ee806f" stroke="#8a3a2d" stroke-width="2.4"/><path d="M-19-1Q-15-4-10-3M7-4Q10-6 13-5" fill="none" stroke="#ffa798" stroke-width="2.4" stroke-linecap="round"/><circle cx="14" cy="0" r="2" fill="#4a3620"/><circle cx="14.7" cy="-0.7" r=".7" fill="#fffdf7"/><path d="M13 4.5Q15 6 17 4.5" fill="none" stroke="#8a3a2d" stroke-width="1.6" stroke-linecap="round"/>`,
    spider: `<g fill="none" stroke="#6064a0" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${[-1,1].map(k=>`<g transform="scale(${k} 1)"><path d="M6-3L18-16L19-24M9 0L25-8L29-17M10 4L26 4L31-2M8 7L22 15L26 23"/></g>`).join('')}</g><ellipse cy="9" rx="14" ry="16" fill="#b49fcf" stroke="#6064a0" stroke-width="1.6"/><path d="M-8 4Q-9 15 0 19" fill="none" stroke="#e6d6f0" stroke-width="3" stroke-linecap="round"/><circle cy="-7" r="11" fill="#b49fcf" stroke="#6064a0" stroke-width="1.6"/><g fill="#fffaf0"><ellipse cx="-4" cy="-9" rx="3.5" ry="4.5"/><ellipse cx="4" cy="-9" rx="3.5" ry="4.5"/></g><g fill="#4a4d84"><circle cx="-3" cy="-8" r="2"/><circle cx="5" cy="-8" r="2"/></g><path d="M-3-2Q0 1 3-2" fill="none" stroke="#6064a0" stroke-width="1.6" stroke-linecap="round"/>`,
    crow: `<path d="M-15 9L-28 6L-24 18L-10 16" fill="#a89478" stroke="#4a3620" stroke-width="1.6" stroke-linejoin="round"/><path d="M-18 7Q-16-6-1-7Q0-22 13-21Q27-18 22-6Q22 13 7 18Q-13 22-18 7Z" fill="#a89478" stroke="#4a3620" stroke-width="2.4"/><path d="M-13 2Q-3-5 8 3Q3 15-9 12Z" fill="#c9bda4" stroke="#4a3620" stroke-width="1.6"/><path d="M22-14L32-9L22-6Z" fill="#a89478" stroke="#4a3620" stroke-width="1.6"/><circle cx="15" cy="-13" r="3" fill="#e5dcc8"/><circle cx="16" cy="-13" r="1.6" fill="#2f5c46"/><path d="M0 18L-1 24H-6M10 17L10 23H6" fill="none" stroke="#a89478" stroke-width="2.4" stroke-linecap="round"/>`,
    hoopoe: `<path d="M-12 6L-26 11L-22 18L-10 12Z" fill="#4a3620"/><path d="M-21 11L-19 16" stroke="#fffdf7" stroke-width="2.4" stroke-linecap="round"/><path d="M-2 14V23M4 14V23" stroke="#70501b" stroke-width="2.4" stroke-linecap="round"/><g transform="translate(8 -13) rotate(-62)"><ellipse cy="-7" rx="3" ry="7" fill="#e8743c" stroke="#7a3512" stroke-width="1.6"/><circle cy="-13" r="2.4" fill="#4a3620"/></g><g transform="translate(8 -13) rotate(-36)"><ellipse cy="-7" rx="3" ry="7" fill="#e8743c" stroke="#7a3512" stroke-width="1.6"/><circle cy="-13" r="2.4" fill="#4a3620"/></g><g transform="translate(8 -13) rotate(-10)"><ellipse cy="-7" rx="3" ry="7" fill="#e8743c" stroke="#7a3512" stroke-width="1.6"/><circle cy="-13" r="2.4" fill="#4a3620"/></g><g transform="translate(8 -13) rotate(16)"><ellipse cy="-7" rx="3" ry="7" fill="#e8743c" stroke="#7a3512" stroke-width="1.6"/><circle cy="-13" r="2.4" fill="#4a3620"/></g><path d="M-14 6Q-12-8 2-8Q14-8 14 4Q14 16 0 16Q-12 16-14 6Z" fill="#ffa06e" stroke="#7a3512" stroke-width="2.4"/><path d="M-12 4Q-2-2 8 6Q2 14-8 12Z" fill="#fffdf7" stroke="#4a3620" stroke-width="1.6" stroke-linejoin="round"/><path d="M-8 4L-6 12M-3 2L-1 13M3 3L4 11" stroke="#4a3620" stroke-width="2.4" stroke-linecap="round"/><circle cx="10" cy="-8" r="7" fill="#ffa06e" stroke="#7a3512" stroke-width="2.4"/><path d="M16-8Q22-6 27-1" fill="none" stroke="#4a3620" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="-9" r="2" fill="#4a3620"/><circle cx="12.7" cy="-9.7" r=".7" fill="#fffdf7"/><circle cx="8" cy="-4" r="2" fill="#ffa798" opacity=".8"/>`,
    whale: `<path d="M-14 4Q-22 2-26-8Q-18-10-15-3Q-15-12-8-13Q-8-4-12 4" fill="#62cdf4" stroke="#3a8fc4" stroke-width="2.4" stroke-linejoin="round"/><path d="M-16 4Q-14-12 4-12Q24-12 24 4Q24 18 4 18Q-14 18-16 4Z" fill="#62cdf4" stroke="#3a8fc4" stroke-width="2.4"/><path d="M-11 10Q4 18 21 9Q17 17 4 17Q-6 17-11 10Z" fill="#ccfbef"/><path d="M-6-7Q2-11 10-10" fill="none" stroke="#96ecff" stroke-width="3" stroke-linecap="round"/><path d="M1 7Q5 14 10 8Z" fill="#3a8fc4" opacity=".55"/><circle cx="14" cy="0" r="2" fill="#4a3620"/><circle cx="14.7" cy="-0.7" r=".7" fill="#fffdf7"/><circle cx="18" cy="5" r="2.4" fill="#ffa798" opacity=".75"/><path d="M16 9Q19 10.5 22 8" fill="none" stroke="#3a8fc4" stroke-width="1.6" stroke-linecap="round"/><path d="M6-13Q3-20-1-22M6-13Q9-20 13-22M6-13V-24" fill="none" stroke="#96ecff" stroke-width="3" stroke-linecap="round"/>`,
    fig: `<path d="M-6-12Q-5-20 0-24" fill="none" stroke="#70501b" stroke-width="3" stroke-linecap="round"/><path d="M-5-15Q-23-15-20-25Q-8-28-5-15Z" fill="#4e9677" stroke="#4e9677" stroke-width="1.6"/><path d="M-8-14C-8-3-24 1-21 14Q-19 25-5 24Q9 24 12 12C15-1-2-4-2-14Z" fill="#b49fcf" stroke="#6064a0" stroke-width="2.4"/><path d="M-18 8Q-21 19-8 21" fill="none" stroke="#6064a0" stroke-width="4" stroke-linecap="round"/><path d="M-12 0L-15 5" stroke="#e6d6f0" stroke-width="3" stroke-linecap="round"/><path d="M13-10Q11-5 5 3Q-4 18 13 23Q30 18 22 3Q15-5 16-10Z" fill="#e5dcc8" stroke="#6064a0" stroke-width="2.4"/><path d="M14-2Q12 2 9 7Q3 17 14 18Q24 16 19 7Z" fill="#ffa798"/><g fill="#ffe49a"><ellipse cx="12" cy="7" rx="1" ry="1.5"/><ellipse cx="17" cy="10" rx="1" ry="1.5"/><ellipse cx="10" cy="13" rx="1" ry="1.5"/><ellipse cx="15" cy="15" rx="1" ry="1.5"/></g>`,
    olive: `<path d="M-9 24Q8 5 8-22M7-5L-6-12M3 6L18 0" fill="none" stroke="#a89478" stroke-width="2.4" stroke-linecap="round"/><path d="M7-14Q-7-17-10-26Q5-25 7-14M8-14Q22-21 24-28Q10-26 8-14M2 5Q-12 6-21-1Q-6-3 2 5M0 11Q13 16 25 7Q10 6 0 11" fill="#c9bda4" stroke="#647d4e" stroke-width="1.6"/><ellipse cx="-9" cy="-7" rx="8" ry="10" transform="rotate(-22 -9 -7)" fill="#93ab6c" stroke="#647d4e" stroke-width="1.6"/><ellipse cx="16" cy="-3" rx="7" ry="9" transform="rotate(24 16 -3)" fill="#647d4e" stroke="#647d4e" stroke-width="1.6"/><ellipse cx="-5" cy="17" rx="8" ry="10" transform="rotate(28 -5 17)" fill="#c9bda4" stroke="#647d4e" stroke-width="1.6"/><g fill="none" stroke="#e5dcc8" stroke-width="2.4" stroke-linecap="round"><path d="M-12-12L-13-7M14-8L12-5M-6 11L-9 15"/></g>`,
    dates: `<path d="M1-25Q3-14-2-6M1-18L-16-7M1-14L16-5" fill="none" stroke="#c69434" stroke-width="2.4" stroke-linecap="round"/><path d="M1-21Q13-27 22-23Q13-17 1-21Z" fill="#c9bda4" stroke="#647d4e" stroke-width="1.6"/><g stroke="#70501b" stroke-width="1.6"><rect x="-25" y="-9" width="15" height="29" rx="7.5" transform="rotate(20 -17 5)" fill="#a89478"/><rect x="9" y="-7" width="15" height="29" rx="7.5" transform="rotate(-18 16 7)" fill="#a89478"/><rect x="-8" y="-1" width="17" height="29" rx="8.5" fill="#a89478"/></g><path d="M-18-4Q-22 4-20 12M15-1Q18 7 17 14M-3 5Q-5 14-2 21" fill="none" stroke="#c9bda4" stroke-width="2.4" stroke-linecap="round"/><path d="M3 6Q5 15 2 23" fill="none" stroke="#70501b" stroke-width="1.6" stroke-linecap="round"/>`,
    pomegranate: `<path d="M-7-15L-11-24L-3-20L1-27L5-20L12-24L8-15Z" fill="#ee806f" stroke="#c25a49" stroke-width="1.6" stroke-linejoin="round"/><path d="M0-17C-14-20-25-9-24 6C-23 22-10 28 1 25C17 29 28 16 25 1C23-12 13-18 0-17Z" fill="#ee806f" stroke="#c25a49" stroke-width="2.4"/><path d="M-18-4Q-17-10-10-11" fill="none" stroke="#c9bda4" stroke-width="3" stroke-linecap="round"/><path d="M-6-6Q11-15 19 0Q26 17 7 20Q-11 18-6-6Z" fill="#e5dcc8" stroke="#c25a49" stroke-width="1.6"/><path d="M4-7L6 16M-4 5L18 5" stroke="#c9bda4" stroke-width="1.6"/><g fill="#c25a49"><ellipse cx="0" cy="0" rx="2.7" ry="3.1"/><ellipse cx="9" cy="-1" rx="2.7" ry="3.1"/><ellipse cx="14" cy="0" rx="2.2" ry="2.8"/><ellipse cx="0" cy="9" rx="2.7" ry="3.1"/><ellipse cx="10" cy="10" rx="2.7" ry="3.1"/><ellipse cx="15" cy="9" rx="2.2" ry="2.8"/></g>`,
    grapes: `<path d="M0-10Q-3-21 6-27" fill="none" stroke="#a89478" stroke-width="2.4" stroke-linecap="round"/><path d="M0-17L-6-25L-12-22L-22-25L-20-16L-25-10L-16-7L-13 0L-5-7L1-8Z" fill="#93ab6c" stroke="#4e9677" stroke-width="1.6" stroke-linejoin="round"/><path d="M-2-14L-17-19" stroke="#e5dcc8" stroke-width="1.6"/><path d="M2-18Q21-29 20-15Q17-10 13-14" fill="none" stroke="#93ab6c" stroke-width="1.6" stroke-linecap="round"/><g stroke="#6064a0" stroke-width="1.6"><circle cx="-5" cy="-5" r="7" fill="#b49fcf"/><circle cx="8" cy="-5" r="7" fill="#b49fcf"/><circle cx="-12" cy="6" r="7" fill="#b49fcf"/><circle cx="1" cy="7" r="7" fill="#b49fcf"/><circle cx="14" cy="6" r="7" fill="#b49fcf"/><circle cx="-5" cy="17" r="7" fill="#b49fcf"/><circle cx="8" cy="17" r="7" fill="#b49fcf"/><circle cx="1" cy="27" r="6" fill="#b49fcf"/></g><g fill="none" stroke="#e6d6f0" stroke-width="2.4" stroke-linecap="round"><path d="M-7-8L-8-6M-14 3L-15 5M-1 4L-2 6M6 14L5 16M-1 24L-2 26"/></g>`,
    honeycomb: `<g stroke="#c69434" stroke-width="1.6" stroke-linejoin="round">${[[0,0],[-17.32,0],[17.32,0],[-8.66,-15],[8.66,-15],[-8.66,15],[8.66,15]].map(([x,y],i)=>`<g transform="translate(${x} ${y})"><path d="M0-10L8.66-5V5L0 10L-8.66 5V-5Z" fill="${i%2?'#f3c955':'#ffe49a'}"/><path d="M0-6L5.2-3V3L0 6L-5.2 3V-3Z" fill="#c69434" stroke="#c69434" stroke-width="1.6"/><path d="M-5-3L0-6L5-3" fill="none" stroke="#ffe49a" stroke-width="1.6"/></g>`).join('')}</g>`,
    waterdrop: `<path d="M0-28C-4-17-21-6-21 9C-21 24-9 29 0 29C12 29 21 21 21 9C21-6 5-18 0-28Z" fill="#96ecff" stroke="#3a8fc4" stroke-width="2.4"/><path d="M16 2Q22 20 4 25Q-8 28-16 16Q1 25 11 12Q15 7 16 2Z" fill="#62cdf4"/><path d="M-9-6Q-16 3-15 10" fill="none" stroke="#fffdf7" stroke-width="4" stroke-linecap="round"/><circle cx="-12" cy="16" r="2" fill="#ccfbef"/>`,
    mountain: `<path d="M-29 21L-10-13L9 21Z" fill="#c9bda4" stroke="#a89478" stroke-width="1.6" stroke-linejoin="round"/><path d="M-10-13L-6 21H9Z" fill="#a89478"/><path d="M-8 23L12-27L34 23Z" fill="#e5dcc8" stroke="#a89478" stroke-width="1.6" stroke-linejoin="round"/><path d="M12-27L15 23H34Z" fill="#c9bda4"/><path d="M12-27L22-5L15-10L10-3L3-7Z" fill="#fffaf0" stroke="#c9bda4" stroke-width="1.6"/><path d="M-10-13L-3-1L-10-4L-15 2L-18 1Z" fill="#fffaf0"/><path d="M-30 23Q-19 16-8 22Q9 15 31 23Q10 29-13 27Z" fill="#93ab6c"/>`,
    nest: `<ellipse cy="4" rx="28" ry="10" fill="#a89478" stroke="#a89478" stroke-width="2.4"/><ellipse cy="3" rx="22" ry="7" fill="#a89478"/><g stroke="#a89478" stroke-width="1.6"><path d="M-13-15C-5-15-3-3-6 2Q-14 9-19 1C-22-5-19-15-13-15Z" fill="#e5dcc8"/><path d="M4-20C11-20 16-7 12-1Q6 7-1 0C-5-6-2-20 4-20Z" fill="#e5dcc8"/><path d="M17-11C23-11 27 0 23 5Q18 10 12 4C9-1 12-11 17-11Z" fill="#e5dcc8"/></g><path d="M-28 5Q-20 28 0 27Q21 27 28 5Q3 16-28 5Z" fill="#a89478" stroke="#a89478" stroke-width="2.4"/><path d="M-22 12Q-5 23 21 13M-15 20Q3 26 16 18M-28 5L-6 13M9 10L28 2" fill="none" stroke="#c9bda4" stroke-width="2.4" stroke-linecap="round"/><path d="M-13 10L-2 23M7 13L19 20" stroke="#a89478" stroke-width="1.6" stroke-linecap="round"/>`,
    feather: `<path d="M-17 20C-24-1-2-29 13-27C28-23 22-6 10 7Q-2 19-17 20Z" fill="#c9bda4" stroke="#4e9677" stroke-width="1.6"/><path d="M13-26Q18-9 7 5Q-6 15-16 19Q-15 3-2-10Z" fill="#e5dcc8"/><path d="M13-22Q0-2-21 27" fill="none" stroke="#4e9677" stroke-width="2.4" stroke-linecap="round"/><path d="M7-13L15-14M0-3L13-4M-6 6L5 7M-2-2L-7-11M-10 8L-16 2" fill="none" stroke="#4e9677" stroke-width="1.6" stroke-linecap="round"/>`,
    shell: `<path d="M-9 19Q-31 0-27-13Q-26-20-19-17Q-17-27-9-22Q0-33 9-22Q18-27 20-17Q28-20 29-11Q33 2 10 19L8 25H-8Z" fill="#c9bda4" stroke="#a89478" stroke-width="1.6" stroke-linejoin="round"/><path d="M-18-17Q-16 1-6 18M-8-22Q-8-1-2 18M2-25V18M12-21Q12 2 6 18M21-14Q17 4 10 16" fill="none" stroke="#e5dcc8" stroke-width="3" stroke-linecap="round"/><path d="M-9 19H10L8 25H-8Z" fill="#ffa798" stroke="#a89478" stroke-width="1.6" stroke-linejoin="round"/>`,
    turtle: `<g transform="translate(-2 3)"><path d="M-21 5L-26 9L-20 10Z" fill="#b7e779" stroke="#4e9677" stroke-width="1.6" stroke-linejoin="round"/><g fill="#b7e779" stroke="#4e9677" stroke-width="2.4"><rect x="-17" y="2" width="8" height="13" rx="4"/><rect x="7" y="2" width="8" height="13" rx="4"/></g><circle cx="20" cy="-2" r="7" fill="#b7e779" stroke="#4e9677" stroke-width="2.4"/><circle cx="22" cy="-4" r="2" fill="#4a3620"/><circle cx="22.7" cy="-4.7" r=".7" fill="#fffdf7"/><path d="M21 1Q23 2.5 25 1" fill="none" stroke="#4e9677" stroke-width="1.6" stroke-linecap="round"/><path d="M-22 6Q-22-19 0-19Q20-19 20 6Z" fill="#7fce54" stroke="#4e9677" stroke-width="2.4" stroke-linejoin="round"/><path d="M-8-18Q-12-6-8 5M8-18Q12-6 8 5M-21-4Q0-1 20-4" fill="none" stroke="#4e9677" stroke-width="2.4"/><path d="M-14-11Q-8-16 0-16" fill="none" stroke="#b7e779" stroke-width="3" stroke-linecap="round"/><path d="M-23 6Q-1 11 21 6" fill="none" stroke="#4e9677" stroke-width="4" stroke-linecap="round"/></g>`,
    snake: `<path d="M-25 20Q-14 12-2 19Q21 29 24 13Q26 3 12-1Q0-6 2-17" fill="none" stroke="#93ab6c" stroke-width="12" data-ribbon stroke-linecap="round"/><path d="M-25 20Q-14 12-2 19Q21 29 24 13Q26 3 12-1Q0-6 2-17" fill="none" stroke="#c9bda4" stroke-width="8" stroke-linecap="round"/><path d="M-10 16L-8 22M3 17L3 24M16 13L22 16M10-4L8 2" stroke="#c4d39b" stroke-width="3" stroke-linecap="round"/><ellipse cx="0" cy="-19" rx="11" ry="9" fill="#c9bda4" stroke="#93ab6c" stroke-width="1.6"/><circle cx="-4" cy="-21" r="2" fill="#647d4e"/><circle cx="4" cy="-21" r="2" fill="#647d4e"/><path d="M-4-15Q0-12 4-15" fill="none" stroke="#c4d39b" stroke-width="1.6" stroke-linecap="round"/>`,
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
        <path d="${DIECUT}" fill="${owned ? "#fffdf7" : "#e5dcc8"}" stroke="${owned ? '#c9bda4' : '#c9bda4'}" stroke-width="1.6"/>
        ${owned ? '<circle r="25" fill="#e5dcc8"/>' : ''}
        ${owned
          ? `<g data-sticker-art="${id}" stroke-linecap="round" stroke-linejoin="round">${art}</g>
             <path d="M-24 -14 Q-16 -26 -2 -28" fill="none" stroke="#fffdf7" stroke-width="6" stroke-linecap="round" opacity="0.8"/>`
          // Missing: the motif's own pale silhouette, like a collector's book —
          // a wall of identical "?" told a child nothing about what to find.
          : `<g class="art-sticker-ghost" data-sticker-ghost="${id}" stroke-linecap="round" stroke-linejoin="round" transform="scale(.9)">${art}</g>`}
      </g>
    </svg>`;
  }

  // Just the motif, no die-cut paper — for sticker friends who visit the garden (v12).
  function stickerMotif(id, size = 56) {
    const art = STICKER_ART[id] || "";
    return `<svg class="art-motif" viewBox="-36 -36 72 72" width="${size}" height="${size}" aria-hidden="true"><g stroke-linecap="round" stroke-linejoin="round">${art}</g></svg>`;
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
        <g transform="scale(0.7) translate(0 8)" fill="#f3c955"><path d="M0 -22 L6 -6 L23 -5 L9 6 L14 22 L0 13 L-14 22 L-9 6 L-23 -5 L-6 -6 Z" stroke="${GOLD.mid}" stroke-width="3"/></g>
        <path d="M-24 -29H24M-23 32H23" fill="none" stroke="#fffdf7" stroke-width="2.4" stroke-dasharray="3 5" opacity=".65"/>
        <path d="M-27 -15V23Q-27 31 -21 32" fill="none" stroke="#fffdf7" stroke-width="4" stroke-linecap="round" opacity=".3"/>
        <path d="M21 42L34 29L34 33Q34 42 21 42" fill="#e6d6f0"/>
      </g>
    </svg>`;
  }

  // Confetti burst — appended to body, cleans itself up.
  // Material bursts (2026-10-01): a right answer answers in the activity's own
  // material — pond water, wood chips, seeds, glass glints or garden petals —
  // instead of one generic confetti. Golden (reward) bursts stay the party.
  const BURSTS = {
    petals: { colors: ["#62cdf4", "#b7e779", "#ee806f", "#f3c955"], shape: (i) => (i % 3 === 0 ? "is-round" : ""), count: 14, fall: 0 },
    water: { colors: ["#3a8fc4", "#62cdf4", "#fffdf7", "#3a8fc4"], shape: () => "is-drop", count: 12, fall: 30, ring: true },
    wood: { colors: ["#c69434", "#a89478", "#70501b", "#ffe49a"], shape: () => "is-chip", count: 12, fall: 70 },
    seeds: { colors: ["#c69434", "#70501b", "#7fce54", "#ee806f"], shape: () => "is-seed", count: 12, fall: 60 },
    glints: { colors: ["#ffe49a", "#fffdf7", "#f3c955"], shape: () => "is-glint", count: 12, fall: -10 },
  };
  function confetti(x, y, golden, material = "petals") {
    // Perf: on a fast correct-streak bursts can stack up; two at once is
    // plenty of party, three is a frame drop on tablets.
    if (document.querySelectorAll(".lg-confetti-layer").length >= 2) return;
    const layer = document.createElement("div");
    layer.className = "lg-confetti-layer";
    layer.style.left = `${x}px`;
    layer.style.top = `${y}px`;
    const kind = golden ? null : BURSTS[material] || BURSTS.petals;
    const colors = golden
      ? ["#f3c955", "#ffe49a", "#ee806f", "#62cdf4", "#fffdf7"]
      : kind.colors;
    const count = golden ? 26 : kind.count;
    if (kind?.ring) {
      const ring = document.createElement("b");
      ring.className = "lg-burst-ring";
      layer.appendChild(ring);
    }
    for (let i = 0; i < count; i += 1) {
      const p = document.createElement("i");
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.7;
      const dist = golden ? 70 + Math.random() * 130 : 46 + Math.random() * 64;
      p.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
      p.style.setProperty("--dy", `${Math.sin(angle) * dist * (golden ? 1 : 0.7) - (golden ? 40 : 0) + (golden ? 0 : kind.fall)}px`);
      p.style.setProperty("--rot", `${Math.random() * 720 - 360}deg`);
      p.style.background = colors[i % colors.length];
      const shape = golden ? (i % 3 === 0 ? "is-round" : "") : kind.shape(i);
      if (shape) p.classList.add(shape);
      p.style.animationDelay = `${Math.random() * 80}ms`;
      layer.appendChild(p);
    }
    document.body.appendChild(layer);
    setTimeout(() => layer.remove(), 1300);
  }

  ns.LettersArt = {
    keyMascot, blobCard, letterSign, stickerMotif, yearSeason, yearLayer, creature, icon, backdrop, landLife, weatherFor, weatherLayer, hijri, season, seasonLayer, dayPhase, PHASES, mapStop,
    bloomCluster, confetti, ICONS, pet, egg, sticker, stickerPack, skillFlower,
    inkShift, warmInk, fitGlyphs, fitInlineGlyphs, watchGlyphs,
  };
})(window.MiftahGame || (window.MiftahGame = {}));
