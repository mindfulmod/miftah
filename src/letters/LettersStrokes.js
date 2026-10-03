// Writing Garden (v3, 2026-10-01): a handwriting model for every isolated
// Arabic letter — strokes in writing order and direction, dots as taps — and
// the guided-trace engine that teaches it. Spec 02 promised "stroke-order /
// direction guidance (animated arrow, gentle snap-back)"; this is that.
//
// Geometry lives in a 100×100 box. Letter bodies sit in y 16–86 so harakat
// strokes have room above (y 2–14) and below (y 88–98). Every stroke is drawn
// the way a child is taught: right to left, top to bottom, body before dots,
// the stem of ط/ظ after its loop.
//
// The guide the child sees is drawn FROM this model, so the path they follow
// and the shape they see can never disagree (the old coverage trace drew a
// platform font, which differs between devices). Tracing can never fail: ink
// follows the finger along the stroke; straying far rubber-bands progress back
// to the last quarter-mark, and lifting the finger keeps what was drawn.
(function (ns) {
  const D = (x, y) => ({ dot: [x, y] });
  const BEH = "M84 46Q86 68 66 70L34 70Q14 68 16 46";
  const HAH = "M28 26Q52 18 72 28L38 50Q18 64 32 80Q50 92 80 82";
  const DAL = "M42 28Q62 44 64 62Q50 68 30 64";
  const RA = "M60 38Q62 58 52 70Q40 82 22 84";
  const SEEN = "M90 44Q90 60 82 60Q76 60 76 48Q76 60 68 60Q62 60 62 48L62 62Q60 76 42 76Q18 76 16 54";
  const SAD = "M62 58Q70 36 88 42Q96 54 80 58L62 58L62 62Q60 76 42 76Q18 76 16 54";
  const TAH = "M28 62Q48 40 74 48Q88 58 70 62L28 62";
  const AIN = "M66 30Q50 22 44 34Q42 44 66 48Q36 50 34 66Q36 84 60 86Q72 86 82 80";
  const LETTERS = {
    "ا": ["M50 16L50 82"],
    "ب": [BEH, D(50, 84)],
    "ت": [BEH, D(58, 32), D(42, 32)],
    "ث": [BEH, D(50, 22), D(60, 34), D(40, 34)],
    "ج": [HAH, D(52, 64)],
    "ح": [HAH],
    "خ": [HAH, D(50, 14)],
    "د": [DAL],
    "ذ": [DAL, D(44, 16)],
    "ر": [RA],
    "ز": [RA, D(62, 24)],
    "س": [SEEN],
    "ش": [SEEN, D(76, 20), D(84, 32), D(68, 32)],
    "ص": [SAD],
    "ض": [SAD, D(78, 28)],
    "ط": [TAH, "M40 18L40 62"],
    "ظ": [TAH, "M40 18L40 62", D(60, 36)],
    "ع": [AIN],
    "غ": [AIN, D(54, 16)],
    "ف": ["M74 46Q64 40 70 30Q80 26 82 38Q82 50 70 52L30 52Q16 50 16 40", D(74, 18)],
    "ق": ["M66 40Q58 32 64 24Q74 20 76 32Q76 44 66 46Q74 62 60 74Q40 84 26 70Q22 60 28 54", D(76, 12), D(62, 12)],
    "ك": ["M80 20L80 64L22 64Q16 62 18 52", "M56 34Q46 38 54 42Q46 46 54 50"],
    "ل": ["M64 16L64 62Q62 80 42 80Q24 78 22 60"],
    // Meem: the round head first, then the tail drops from its left side
    // (a tail on the right reads as the numeral ٩).
    "م": ["M46 44Q48 30 60 32Q70 36 66 48Q60 56 48 52Q42 50 44 60L42 84"],
    "ن": ["M82 40Q86 74 52 76Q20 74 22 42", D(52, 30)],
    // Heh: the outer round, then its inner curl (without it, it reads as ٥).
    "ه": ["M46 28Q72 36 72 58Q70 78 50 78Q30 78 30 60Q30 44 44 44Q58 44 58 58Q58 66 50 66"],
    "و": ["M60 44Q46 32 42 46Q42 56 58 56Q64 66 52 76Q40 84 26 80"],
    "ي": ["M70 38Q56 32 54 44Q54 56 70 60Q84 66 66 76Q40 84 24 70Q20 60 30 54", D(58, 88), D(44, 88)],
  };
  // Harakat: their own small strokes, drawn after the letter (shadda first).
  const MARKS = {
    "ّ": ["M64 10Q60 4 56 10Q52 4 48 10Q44 4 40 10"],
    "َ": ["M60 4L42 12"],
    "ِ": ["M60 90L42 98"],
    "ُ": ["M56 10Q50 2 46 8Q46 13 54 13Q56 18 46 22"],
    "ْ": ["M50 3Q58 3 58 9Q58 14 50 14Q42 14 42 9Q42 3 50 3"],
    "ً": ["M62 3L44 9", "M62 10L44 16"],
    "ٍ": ["M62 86L44 92", "M62 93L44 99"],
    "ٌ": ["M58 10Q52 2 48 8Q48 13 56 13Q58 18 48 22", "M44 10Q38 2 34 8Q34 13 42 13"],
  };
  const MARK_ORDER = ["ّ", "َ", "ِ", "ُ", "ْ", "ً", "ٍ", "ٌ"];

  // The strokes for a game item, or null when the model cannot teach it (a
  // joined word, a Latin label) — those keep the coverage trace.
  function forItem(item) {
    const text = String(item?.display || "");
    const base = [...text].filter((c) => !MARKS[c] && !/[ٓ-ٰٟ]/.test(c));
    if (base.length !== 1 || !LETTERS[base[0]]) return null;
    const marks = MARK_ORDER.filter((m) => text.includes(m));
    return [...LETTERS[base[0]], ...marks.flatMap((m) => MARKS[m])].map((s) => (typeof s === "string" ? { d: s } : s));
  }

  const SVGNS = "http://www.w3.org/2000/svg";
  // Wide enough for a two-year-old's finger: a stroke follows within 13% of
  // the box, wandering only counts past 32%, and a dot accepts a tap within 16%.
  const TOL = 13, STRAY = 32, DOT_TOL = 16;

  // The guided trace. `paper` is the drawing surface; the engine lays an SVG
  // over it and reports through callbacks. It owns no scoring: `onDone` fires
  // once every stroke is drawn, and the game decides what that means.
  function guide(paper, strokes, { ink = () => "#e8743c", reduced = false, onStroke, onDone, onMove, onSnap } = {}) {
    const svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("class", "trace-guided");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.setAttribute("aria-hidden", "true");
    const layer = (cls) => { const g = document.createElementNS(SVGNS, "g"); g.setAttribute("class", cls); svg.appendChild(g); return g; };
    const under = layer("tg-guide"), inkLayer = layer("tg-ink"), cue = layer("tg-cue");
    const make = (tag, attrs, parent) => { const n = document.createElementNS(SVGNS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); parent.appendChild(n); return n; };
    paper.appendChild(svg);
    const parts = strokes.map((s) => {
      if (s.dot) {
        const [x, y] = s.dot;
        make("circle", { cx: x, cy: y, r: 5.2, class: "tg-guide-dot" }, under);
        const fill = make("circle", { cx: x, cy: y, r: 4.6, class: "tg-ink-dot", fill: ink() }, inkLayer);
        return { dot: true, x, y, fill, done: false };
      }
      make("path", { d: s.d, class: "tg-guide-edge" }, under);
      make("path", { d: s.d, class: "tg-guide-path" }, under);
      const path = make("path", { d: s.d, class: "tg-ink-path", stroke: ink() }, inkLayer);
      const len = path.getTotalLength?.() || 100;
      const samples = [];
      for (let l = 0; l <= len; l += 2) { const p = path.getPointAtLength(l); samples.push([p.x, p.y]); }
      path.style.strokeDasharray = `${len} ${len}`;
      path.style.strokeDashoffset = String(len);
      return { dot: false, path, len, samples, at: 0, mark: 0, done: false };
    });
    let current = 0, alive = true, pointer = null, timers = [];
    const later = (fn, ms) => { const t = setTimeout(() => alive && fn(), ms); timers.push(t); };
    const showProgress = (part) => { part.path.style.strokeDashoffset = String(part.len * (1 - part.at / (part.samples.length - 1))); };
    // The start dot and a direction chevron for the stroke the child is on.
    const drawCue = () => {
      cue.replaceChildren();
      const part = parts[current];
      if (!part) return;
      if (part.dot) { make("circle", { cx: part.x, cy: part.y, r: 8, class: "tg-start is-dot" }, cue); return; }
      const [sx, sy] = part.samples[0];
      const k = Math.min(part.samples.length - 1, 7), [ax, ay] = part.samples[k];
      const ang = Math.atan2(ay - sy, ax - sx) * 180 / Math.PI;
      make("path", { d: "M-4-4L2 0L-4 4", class: "tg-arrow", transform: `translate(${ax} ${ay}) rotate(${ang})` }, cue);
      make("circle", { cx: sx, cy: sy, r: 5.5, class: "tg-start" }, cue);
    };
    const finishPart = () => {
      const part = parts[current];
      part.done = true;
      onStroke?.(current, parts.length);
      current += 1;
      if (current >= parts.length) { cue.replaceChildren(); svg.classList.add("is-done"); onDone?.(); return; }
      drawCue();
    };
    // Demonstration: a pen writes every stroke in order, then hands over.
    const demo = () => {
      if (reduced) return drawCue();
      svg.classList.add("is-demo");
      const pen = make("circle", { r: 3.6, class: "tg-pen" }, cue);
      let t = 0;
      parts.forEach((part) => {
        if (part.dot) {
          later(() => { pen.setAttribute("cx", part.x); pen.setAttribute("cy", part.y); part.fill.classList.add("is-demo"); }, t);
          later(() => part.fill.classList.remove("is-demo"), t + 420);
          t += 460;
          return;
        }
        const dur = Math.max(420, part.len * 9);
        const start = t;
        for (let f = 0; f <= 12; f += 1) later(() => {
          const p = part.path.getPointAtLength(part.len * f / 12);
          pen.setAttribute("cx", p.x); pen.setAttribute("cy", p.y);
          part.path.style.strokeDashoffset = String(part.len * (1 - f / 12));
        }, start + dur * f / 12);
        t += dur + 160;
      });
      later(() => {
        svg.classList.remove("is-demo");
        parts.forEach((part) => { if (part.dot) return; part.path.style.strokeDashoffset = String(part.len); });
        drawCue();
      }, t + 300);
    };
    const toBox = (e) => {
      const m = svg.getScreenCTM?.();
      if (!m) return null;
      const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
      const q = p.matrixTransform(m.inverse());
      return [q.x, q.y];
    };
    const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    const follow = (pt) => {
      const part = parts[current];
      if (!part || svg.classList.contains("is-demo")) return;
      if (part.dot) {
        if (dist(pt, [part.x, part.y]) < DOT_TOL) { part.fill.setAttribute("fill", ink()); part.fill.classList.add("is-on"); finishPart(); }
        return;
      }
      // Advance along the stroke while the finger is near what comes next.
      let moved = false;
      for (let j = part.at; j < Math.min(part.samples.length, part.at + 8); j += 1) {
        if (dist(pt, part.samples[j]) < TOL && (part.at > 0 || j < 4)) { part.at = j; moved = true; }
      }
      if (moved) {
        part.mark = Math.max(part.mark, Math.floor((part.at / (part.samples.length - 1)) * 4) / 4);
        showProgress(part);
        if (part.at >= part.samples.length - 2) { part.at = part.samples.length - 1; showProgress(part); finishPart(); }
        return;
      }
      // Wandered off: rubber-band back to the last quarter-mark, gently.
      if (part.at > 0 && dist(pt, part.samples[part.at]) > STRAY && !part.samples.some((s) => dist(pt, s) < TOL)) {
        part.at = Math.round(part.mark * (part.samples.length - 1));
        part.path.classList.add("is-snap");
        showProgress(part);
        later(() => part.path.classList.remove("is-snap"), 380);
        onSnap?.();
      }
    };
    svg.addEventListener("pointerdown", (e) => {
      if (!alive || pointer !== null || e.button > 0 || e.isPrimary === false) return;
      pointer = e.pointerId;
      try { svg.setPointerCapture?.(pointer); } catch {}
      const pt = toBox(e); if (pt) { follow(pt); onMove?.(e); }
    });
    svg.addEventListener("pointermove", (e) => { if (e.pointerId !== pointer || !alive) return; const pt = toBox(e); if (pt) { follow(pt); onMove?.(e); } });
    const up = (e) => { if (e.pointerId !== pointer) return; pointer = null; onMove?.(null); };
    svg.addEventListener("pointerup", up);
    svg.addEventListener("pointercancel", up);
    demo();
    return {
      svg,
      setInk(color) { parts.forEach((p) => (p.dot ? p.fill.classList.contains("is-on") && p.fill.setAttribute("fill", color) : p.path.setAttribute("stroke", color))); },
      reset() { parts.forEach((p) => { p.done = false; if (p.dot) p.fill.classList.remove("is-on"); else { p.at = 0; p.mark = 0; showProgress(p); } }); current = 0; svg.classList.remove("is-done"); drawCue(); },
      // Paint the finished letter onto a canvas so drawings can be kept.
      paint(canvas, color) {
        const g = canvas?.getContext?.("2d");
        if (!g || typeof Path2D === "undefined") return;
        const s = Math.min(canvas.width, canvas.height) / 100, ox = (canvas.width - 100 * s) / 2, oy = (canvas.height - 100 * s) / 2;
        g.save(); g.clearRect(0, 0, canvas.width, canvas.height); g.setTransform(s, 0, 0, s, ox, oy);
        g.strokeStyle = g.fillStyle = color; g.lineWidth = 9; g.lineCap = g.lineJoin = "round";
        strokes.forEach((st) => { if (st.dot) { g.beginPath(); g.arc(st.dot[0], st.dot[1], 4.6, 0, Math.PI * 2); g.fill(); } else g.stroke(new Path2D(st.d)); });
        g.restore();
      },
      destroy() { alive = false; timers.forEach(clearTimeout); svg.remove(); },
    };
  }

  ns.LettersStrokes = { LETTERS, MARKS, forItem, guide };
})(window.MiftahGame || (window.MiftahGame = {}));
