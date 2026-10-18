// DetailKit (2026-10-18) — constructed, detailed scenery in the pet language.
// Owner: "those trees look really bad, the hut shape looks like it doesn't
// have enough geometry … a house is not just a square." Every object here is
// BUILT FROM ITS ANATOMY, not drawn as one blob:
//   tree  — flared roots, bark, forked branches, a canopy of overlapping
//           clumps (lit top-left, shaded rim lower-right), leaf ticks, fruit;
//   palm  — a curved, ringed, tapering trunk; serrated fronds with midribs;
//           a coconut cluster;
//   house — stone foundation, planked walls with corner trims, an overhanging
//           tiled roof with eaves and a ridge cap, a chimney (with smoke), an
//           arched planked door with frame, knob and step, framed windows
//           with mullions, sills, shutters and a flower box, a lantern;
//   barn  — a gambrel roof, vertical planks, X-braced double doors, a
//           hayloft window, trims;
//   boat  — a planked hull with rim and portholes, a mast, two seamed sails
//           and a pennant.
// Same rules as ART.md "Pet language": warm ink outline, flat fills + one
// shine, colour-matched detail lines, round joins, palette hexes only, stroke
// widths 1.6 / 2.4 / 3 / 4 / 6 / 8. All functions draw around a local origin
// at the object's base centre and return SVG markup.
(function (ns) {
  const INK = "#4a3620";
  let uid = 0;
  const id = (p) => `dk-${p}-${++uid}`;
  const K = (w = 3) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const L = (c, w = 2.4) => `fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
  const shine = (cx, cy, rx, ry, rot = -20) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${cx} ${cy})" fill="#fffdf7" opacity=".6"/>`;
  const shadow = (rx, o = 0.2) => `<ellipse cx="${rx * 0.1}" cy="2" rx="${rx}" ry="${(rx * 0.18).toFixed(1)}" fill="#2f5c46" opacity="${o}"/>`;
  const f = (n) => n.toFixed(1);

  // ---------- tree ----------
  // kind: 'apple' (fruit), 'round' (plain), 'blossom' (pink flowers).
  // seed varies the clump layout so neighbouring trees are never twins.
  function tree({ kind = "apple", seed = 1, leaf = ["#b7e779", "#7fce54", "#4e9677"], hooks = false } = {}) {
    const r = (n) => { const v = Math.sin(seed * 91.7 + n * 47.3) * 43758.5; return v - Math.floor(v); };
    const clumps = [[0, -86, 30], [-26, -70, 23], [26, -68, 23], [-15, -104, 21], [16, -106, 21], [-4, -62, 20], [32, -90, 16], [-33, -92, 16]]
      .map(([x, y, s], i) => [x + (r(i) - 0.5) * 6, y + (r(i + 9) - 0.5) * 6, s * (0.9 + r(i + 4) * 0.2)]);
    const circle = (x, y, s, fill, extra = "") => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(s)}" fill="${fill}"${extra}/>`;
    const ink = clumps.map(([x, y, s]) => circle(x, y, s + 3, INK)).join("");
    const base = clumps.map(([x, y, s]) => circle(x, y, s, leaf[2])).join("");
    const lit = clumps.map(([x, y, s]) => circle(x - s * 0.14, y - s * 0.16, s * 0.84, leaf[1])).join("");
    const top = clumps.filter(([, y]) => y < -80).map(([x, y, s]) => circle(x - s * 0.3, y - s * 0.32, s * 0.4, leaf[0])).join("");
    const ticks = clumps.map(([x, y, s], i) => `<path d="M${f(x + s * 0.2)} ${f(y + s * 0.25)}q3 -4 7 -3" ${L(leaf[2], 2.4)}/>${i % 2 ? `<path d="M${f(x - s * 0.4)} ${f(y + s * 0.1)}q3 -4 7 -3" ${L(leaf[2], 2.4)}/>` : ""}`).join("");
    const fruit = kind === "apple"
      ? [[-14, -78], [18, -88], [4, -66], [-26, -96], [26, -70]].slice(0, hooks ? 3 : 3 + (seed % 3)).map(([x, y]) => `${hooks ? `<g class="lm-fruit" data-y="${138 + y}">` : ""}<path d="M${x} ${y - 7}q1 -4 4 -5" ${L("#70501b", 1.6)}/>${circle(x, y, 6.5, "#ee806f", ` ${K(2.4)}`)}<circle cx="${x - 2}" cy="${y - 2}" r="2" fill="#fffdf7" opacity=".7"/>${hooks ? "</g>" : ""}`).join("")
      : kind === "blossom"
        ? [[-16, -80], [14, -92], [2, -66], [-24, -98], [24, -74], [8, -104]].map(([x, y]) => `${[0, 72, 144, 216, 288].map((a) => `<circle cx="${x}" cy="${y - 3}" r="3" fill="#ffa798" stroke="#ee806f" stroke-width="1.6" transform="rotate(${a} ${x} ${y})"/>`).join("")}<circle cx="${x}" cy="${y}" r="2" fill="#f3c955"/>`).join("")
        : "";
    return `<g>${shadow(40)}
      <path d="M-18 0Q-10 -3 -9 -14L-7 -44Q-14 -52 -22 -60M7 -44Q14 -54 20 -62M-9 -14L-7 -44H7L9 -14Q10 -3 18 0Z" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M-18 0Q-10 -3 -9 -14L-7 -44H7L9 -14Q10 -3 18 0Z" fill="#c69434" ${K(3)}/>
      <path d="M-7 -44Q-14 -52 -22 -60M7 -44Q14 -54 20 -62" fill="none" stroke="#c69434" stroke-width="4" stroke-linecap="round"/>
      <path d="M-2 -38V-20M3 -30V-10M-5 -12Q-3 -6 -8 -2M5 -8Q8 -3 12 -1" ${L("#70501b")}/>
      ${hooks ? `<g class="lm-canopy">${ink}${base}${lit}${top}${ticks}</g>` : `${ink}${base}${lit}${top}${ticks}`}${fruit}</g>`;
  }

  // ---------- palm ----------
  function palm({ lean = 1, height = 120 } = {}) {
    const P = (t) => { const a = 1 - t; return [a * a * 0 + 2 * a * t * (-14 * lean) + t * t * (16 * lean), a * a * 0 + 2 * a * t * (-height * 0.45) + t * t * -height]; };
    const N = 14, left = [], right = [];
    for (let i = 0; i <= N; i += 1) {
      const t = i / N, [x, y] = P(t), [x2, y2] = P(Math.min(1, t + 0.01)), dx = x2 - x, dy = y2 - y, d = Math.hypot(dx, dy) || 1;
      const w = 8 - t * 3, nx = -dy / d * w, ny = dx / d * w;
      left.push([x + nx, y + ny]); right.push([x - nx, y - ny]);
    }
    const trunk = `M${left.map(([x, y]) => `${f(x)} ${f(y)}`).join("L")}L${right.reverse().map(([x, y]) => `${f(x)} ${f(y)}`).join("L")}Z`;
    const rings = Array.from({ length: 9 }, (_, i) => { const t = (i + 1) / 10, [x, y] = P(t), w = 7 - t * 3; return `<path d="M${f(x - w)} ${f(y + 1)}Q${f(x)} ${f(y + 4)} ${f(x + w)} ${f(y - 1)}" ${L("#70501b")}/>`; }).join("");
    const [cx, cy] = P(1);
    const frond = (ang, len) => {
      const pts = [], spine = [];
      for (let i = 0; i <= 8; i += 1) {
        const t = i / 8, a = (ang + t * 34 * Math.sign(Math.cos(ang * Math.PI / 180))) * Math.PI / 180;
        const x = cx + Math.cos(ang * Math.PI / 180) * len * t, y = cy + Math.sin(ang * Math.PI / 180) * len * t + t * t * len * 0.62;
        spine.push([x, y]);
        void a;
      }
      const side = (sgn) => spine.map(([x, y], i) => { const [x2, y2] = spine[Math.min(8, i + 1)], dx = x2 - x, dy = y2 - y, d = Math.hypot(dx, dy) || 1, w = Math.sin((i / 8) * Math.PI) * 12 * (i % 2 ? 1 : 0.8); return [x + (-dy / d) * w * sgn, y + (dx / d) * w * sgn]; });
      const a = side(1), b = side(-1).reverse();
      pts.push(...a, ...b);
      return `<path d="M${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join("L")}Z" fill="#7fce54" ${K(2.4)}/><path d="M${spine.map(([x, y]) => `${f(x)} ${f(y)}`).join("L")}" ${L("#4e9677")}/>`;
    };
    const fronds = [[-200, 62], [15, 64], [-165, 76], [-15, 78], [-128, 66], [-55, 68], [-92, 56]].map(([a, l]) => frond(a, l)).join("");
    return `<g>${shadow(30)}<path d="${trunk}" fill="#c69434" ${K(3)}/>${rings}<path d="M${f(P(0.2)[0] - 3)} ${f(P(0.2)[1])}L${f(P(0.8)[0] - 3)} ${f(P(0.8)[1])}" ${L("#ffe49a", 2.4)}/>
      ${fronds}${[[-6, 4], [5, 6], [0, 10]].map(([x, y]) => `<circle cx="${f(cx + x)}" cy="${f(cy + y)}" r="6" fill="#70501b" ${K(2.4)}/><circle cx="${f(cx + x - 2)}" cy="${f(cy + y - 2)}" r="1.6" fill="#c69434"/>`).join("")}</g>`;
  }

  // ---------- house ----------
  function house({ wall = "#fffaf0", wallLine = "#e5dcc8", roof = "#ee806f", roofDark = "#c25a49", door = "#7fce54", doorDark = "#4e9677", night = false, smoke = true } = {}) {
    const clip = id("roof");
    const winFill = night ? "#ffe49a" : "#96ecff";
    const win = (x, y) => `<g transform="translate(${x} ${y})">
        <rect x="-20" y="-6" width="9" height="30" rx="3" fill="${roof}" ${K(2.4)}/><rect x="11" y="-6" width="9" height="30" rx="3" fill="${roof}" ${K(2.4)}/>
        <path d="M-15.5 2V16M15.5 2V16" ${L(roofDark, 1.6)}/>
        <rect x="-11" y="-8" width="22" height="30" rx="4" fill="${winFill}" ${K(3)}/>
        <path d="M0 -8V22M-11 7H11" stroke="${INK}" stroke-width="2.4"/>
        ${night ? `<rect x="-11" y="-8" width="22" height="30" rx="4" fill="#ffe49a" opacity=".5"/>` : shine(-5, -2, 2.4, 5, 0)}
        <rect x="-15" y="21" width="30" height="7" rx="3.5" fill="${wallLine}" ${K(2.4)}/>
        <rect x="-13" y="28" width="26" height="9" rx="4" fill="#c69434" ${K(2.4)}/>
        ${[-8, 0, 8].map((fx, i) => `<circle cx="${fx}" cy="26" r="3.2" fill="${["#ffa798", "#ffe49a", "#e6d6f0"][i]}" stroke="${["#ee806f", "#c69434", "#b49fcf"][i]}" stroke-width="1.6"/>`).join("")}
      </g>`;
    return `<g>${shadow(66)}
      <defs><clipPath id="${clip}"><path d="M-70 -66Q-70 -60 -62 -60H62Q70 -60 70 -66L10 -122Q0 -130 -10 -122Z"/></clipPath></defs>
      ${smoke && !night ? `<g fill="#fffaf0" opacity=".85"><circle cx="38" cy="-140" r="6"/><circle cx="44" cy="-152" r="8"/><circle cx="52" cy="-166" r="10"/></g>` : ""}
      <rect x="26" y="-128" width="20" height="40" rx="4" fill="#e5dcc8" ${K(3)}/><rect x="23" y="-134" width="26" height="10" rx="4" fill="#c9bda4" ${K(3)}/>
      <path d="M30 -116H42M30 -104H42" ${L("#c9bda4")}/>
      <rect x="-58" y="-64" width="116" height="62" rx="6" fill="${wall}" ${K(3)}/>
      <path d="M-50 -48H50M-50 -32H50M-50 -16H50" ${L(wallLine)}/>
      <rect x="-60" y="-64" width="9" height="62" rx="4" fill="${wallLine}" ${K(2.4)}/><rect x="51" y="-64" width="9" height="62" rx="4" fill="${wallLine}" ${K(2.4)}/>
      <path d="M-70 -66Q-70 -60 -62 -60H62Q70 -60 70 -66L10 -122Q0 -130 -10 -122Z" fill="${roof}" ${K(3)}/>
      <g clip-path="url(#${clip})">${[-114, -102, -90, -78, -66].map((y, row) => Array.from({ length: 12 }, (_, i) => { const x = -72 + i * 13 + (row % 2) * 6.5; return `<path d="M${x} ${y}q6.5 9 13 0" ${L(roofDark)}/>`; }).join("")).join("")}</g>
      <path d="M-62 -60H62" stroke="${roofDark}" stroke-width="4" stroke-linecap="round"/>
      <path d="M-14 -123Q0 -134 14 -123" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><path d="M-14 -123Q0 -134 14 -123" fill="none" stroke="${roofDark}" stroke-width="4" stroke-linecap="round"/>
      ${shine(-30, -86, 12, 4, -42)}
      <rect x="-21" y="-46" width="30" height="46" rx="4" fill="${wallLine}" ${K(2.4)}/>
      <path d="M-17 -2V-30Q-17 -42 -6 -42Q5 -42 5 -30V-2Z" fill="${door}" ${K(3)}/>
      <path d="M-11 -6V-34M-6 -4V-40M-1 -6V-34" ${L(doorDark)}/>
      <circle cx="1" cy="-20" r="2.4" fill="#f3c955" stroke="${INK}" stroke-width="1.6"/>
      <rect x="-26" y="-4" width="40" height="8" rx="4" fill="#c9bda4" ${K(2.4)}/>
      <g transform="translate(15 -40)"><path d="M0 -6V0" ${L(INK, 2.4)}/><rect x="-5" y="0" width="10" height="12" rx="4" fill="#ffe49a" ${K(2.4)}/></g>
      ${win(36, -46)}
      ${Array.from({ length: 7 }, (_, i) => `<ellipse cx="${-54 + i * 18}" cy="0" rx="8" ry="4.5" fill="#c9bda4" ${K(2.4)}/>`).join("")}
    </g>`;
  }

  // ---------- barn ----------
  function barn({ wall = "#ee806f", wallDark = "#c25a49", trim = "#fffaf0", roof = "#70501b" } = {}) {
    return `<g>${shadow(66)}
      <path d="M-60 -2V-62L-42 -96Q0 -120 42 -96L60 -62V-2Z" fill="${wall}" ${K(3)}/>
      ${[-48, -36, -24, 24, 36, 48].map((x) => `<path d="M${x} -6V${x < 0 ? -64 - (x + 60) * 0.6 : -64 - (60 - x) * 0.6}" ${L(wallDark)}/>`).join("")}
      <path d="M-66 -60L-44 -100Q0 -126 44 -100L66 -60Q68 -54 60 -56L42 -88Q0 -110 -42 -88L-60 -56Q-68 -54 -66 -60Z" fill="${roof}" ${K(3)}/>
      <path d="M-52 -66L-40 -90M52 -66L40 -90" ${L("#c69434")}/>
      <path d="M-60 -62L-42 -94Q0 -116 42 -94L60 -62" fill="none" stroke="${trim}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cy="-82" r="12" fill="#ffe49a" ${K(3)}/><path d="M-12 -82H12M0 -94V-70" stroke="${INK}" stroke-width="2.4"/>
      <rect x="-30" y="-58" width="60" height="58" rx="5" fill="${trim}" ${K(3)}/>
      <rect x="-25" y="-53" width="23" height="51" rx="3" fill="${wall}" ${K(2.4)}/><rect x="2" y="-53" width="23" height="51" rx="3" fill="${wall}" ${K(2.4)}/>
      <path d="M-25 -53L-2 -2M-2 -53L-25 -2M2 -53L25 -2M25 -53L2 -2" stroke="${trim}" stroke-width="4" stroke-linecap="round"/>
      <circle cx="-5" cy="-28" r="2.4" fill="#f3c955" stroke="${INK}" stroke-width="1.6"/><circle cx="5" cy="-28" r="2.4" fill="#f3c955" stroke="${INK}" stroke-width="1.6"/>
      <g transform="translate(46 -6)"><path d="M-8 6Q-10 -10 0 -12Q10 -10 8 6Z" fill="#f3c955" ${K(2.4)}/><path d="M-4 -8L-2 4M2 -10L3 4" ${L("#c69434", 1.6)}/></g>
      ${shine(-40, -78, 8, 3, -55)}
    </g>`;
  }

  // ---------- boat ----------
  function boat({ hull = "#c69434", hullDark = "#70501b", sail = "#fffaf0", flag = "#ee806f" } = {}) {
    return `<g>
      <path d="M0 -12V-96" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M0 -12V-96" stroke="#c69434" stroke-width="3" stroke-linecap="round"/>
      <path d="M2 -92Q34 -60 38 -20H2Z" fill="${sail}" ${K(3)}/><path d="M2 -72Q22 -54 26 -30M2 -50Q14 -40 16 -24" ${L("#e5dcc8")}/>
      <path d="M-3 -84Q-24 -56 -26 -22H-3Z" fill="${sail}" ${K(3)}/><path d="M-3 -62Q-16 -46 -17 -28" ${L("#e5dcc8")}/>
      <path d="M0 -96L18 -90L0 -84Z" fill="${flag}" ${K(2.4)}/>
      <path d="M-46 -16H46Q42 8 26 10H-26Q-42 8 -46 -16Z" fill="${hull}" ${K(3)}/>
      <path d="M-44 -6H44M-38 3H38" ${L(hullDark)}/>
      <rect x="-50" y="-20" width="100" height="8" rx="4" fill="#ffe49a" ${K(2.4)}/>
      ${[-24, 0, 24].map((x) => `<circle cx="${x}" cy="-2" r="3.5" fill="#96ecff" stroke="${INK}" stroke-width="1.6"/>`).join("")}
      ${shine(-30, -10, 7, 2.4, 0)}
    </g>`;
  }

  ns.DetailKit = { tree, palm, house, barn, boat, INK };
})(window.MiftahGame || (window.MiftahGame = {}));
