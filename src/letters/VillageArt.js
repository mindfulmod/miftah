// The Garden Village (v64, 2026-10-16) — the art kit.
// Owner-approved art direction: the home screen is a PLACE, and every
// destination is a landmark in it, drawn to the cast's tier.
// System rules for everything here (see docs/letter-garden/reviews/
// art-direction-review-2026-10-16.md):
//   - one light: the sun at top-left; lit edges top-left, shade and contact
//     shadows to the lower right;
//   - touchable landmarks get chunky warm ink (3/4), small parts 1.6/2.4;
//     scenery masses (sky, hills, ground, path) get NO contour;
//   - every filled shape wider than ~24px has a light band and a shade band;
//   - one warm light pool, behind the journey gate (the next adventure).
(function (ns) {
  const INK = "#4a3620";
  const shadow = (cx, cy, rx, ry = rx * 0.2, o = 0.22) => `<ellipse cx="${(cx + rx * 0.12).toFixed(1)}" cy="${cy}" rx="${rx}" ry="${ry.toFixed(1)}" fill="#2f5c46" opacity="${o}"/>`;

  // ---------- scenery (no contour) ----------
  // v88: the village follows the same four phases as the game screens (a
  // child playing after school saw a pink sunset in every game but a noon
  // sky at home). Morning is a pale gold sky; sunset is coral with the sun
  // low and warm over the far hills.
  // v121: a puffy cloud in the pet language (soft lumps, one shine, a light
  // belly shade; no outline — the sky is a mass).
  const puff = (x, y, k, warm = false) => `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) scale(${k})"><path d="M-40 14Q-50 14 -46 2Q-46 -10 -30 -10Q-26 -26 -8 -26Q8 -32 18 -18Q36 -22 40 -6Q52 -4 48 8Q48 16 38 16H-36Q-40 16 -40 14Z" fill="${warm ? "#ffe49a" : "#fffaf0"}"/><path d="M-38 12Q0 20 42 12Q44 16 36 16H-34Q-40 16 -38 12Z" fill="${warm ? "#ffa06e" : "#ccfbef"}"/><ellipse cx="-14" cy="-14" rx="10" ry="4" fill="#fffdf7" opacity=".9"/></g>`;
  function backdrop(W, H, { night = false, horizon = 0.34, phase = night ? "night" : "day" } = {}) {
    const hz = Math.round(H * horizon);
    const sunset = !night && phase === "sunset", morning = !night && phase === "morning";
    const sky = night ? ["#23253f", "#4a4d84"] : sunset ? ["#ffa798", "#ffe49a"] : morning ? ["#ffe49a", "#ccfbef"] : ["#96ecff", "#ccfbef"];
    const far = night ? "#4a4d84" : "#b7e779";
    const ground = night ? "#2f5c46" : "#7fce54";
    const shade = night ? "#23253f" : "#4e9677";
    return `<defs>
        <linearGradient id="vg-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient>
        <linearGradient id="vg-sun" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffdf7" stop-opacity="${night ? 0 : 0.5}"/><stop offset=".55" stop-color="#fffdf7" stop-opacity="0"/></linearGradient>
        <radialGradient id="vg-pool" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffe49a" stop-opacity="${night ? 0.6 : 0.85}"/><stop offset="1" stop-color="#ffe49a" stop-opacity="0"/></radialGradient>
      </defs>
      <rect x="-200" y="-200" width="${W + 400}" height="${H + 400}" fill="url(#vg-sky)"/>
      ${night
        ? `<path d="M${W * 0.14} ${H * 0.06}A26 26 0 1 0 ${W * 0.14 + 8} ${H * 0.06 + 48}A20 20 0 1 1 ${W * 0.14} ${H * 0.06}Z" fill="#ffe49a" stroke="#f3c955" stroke-width="2.4" stroke-linejoin="round"/><ellipse cx="${W * 0.14 - 24}" cy="${H * 0.06 + 24}" rx="3" ry="7" fill="#fffdf7" opacity=".85"/>${[[0.4, 0.05, 1], [0.62, 0.11, 0.7], [0.84, 0.04, 0.6], [0.28, 0.16, 0.8], [0.74, 0.2, 0.55]].map(([x, y, k]) => `<path transform="translate(${(W * x).toFixed(0)} ${(H * y).toFixed(0)}) scale(${k})" d="M0 -8Q1 -1 8 0Q1 1 0 8Q-1 1 -8 0Q-1 -1 0 -8Z" fill="#fffaf0" opacity=".9"/>`).join("")}`
        : sunset ? `<circle cx="${W * 0.2}" cy="${hz - 70}" r="46" fill="#ffa06e" opacity=".35"/><circle cx="${W * 0.2}" cy="${hz - 70}" r="30" fill="#ffa06e"/>
           ${puff(W * 0.58, H * 0.065, 0.9, true)}`
        : `<g transform="translate(${(W * 0.14).toFixed(0)} ${(H * 0.09).toFixed(0)})"><circle r="40" fill="#ffe49a" opacity=".3"/>${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<ellipse cy="-33" rx="5" ry="8" fill="${morning ? "#f3c955" : "#ffe49a"}" transform="rotate(${a})"/>`).join("")}<circle r="25" fill="${morning ? "#f3c955" : "#ffe49a"}"/><circle r="25" fill="none" stroke="#f3c955" stroke-width="2.4" opacity="${morning ? 0 : 0.8}"/><ellipse cx="-9" cy="-10" rx="8" ry="4" fill="#fffdf7" opacity=".6"/></g>
           ${puff(W * 0.6, H * 0.065, 0.9)}${puff(W * 0.3, H * 0.11, 0.6)}`}
      <path d="M-200 ${hz - 30}Q${W * 0.16} ${hz - 74} ${W * 0.37} ${hz - 48}Q${W * 0.56} ${hz - 96} ${W * 0.77} ${hz - 58}Q${W * 0.9} ${hz - 76} ${W + 200} ${hz - 54}V${H + 200}H-200Z" fill="${far}" opacity=".55"/>
      <path d="M-200 ${hz}Q${W * 0.24} ${hz - 38} ${W * 0.5} ${hz - 12}Q${W * 0.75} ${hz - 34} ${W + 200} ${hz - 14}V${H + 200}H-200Z" fill="${far}" opacity=".9"/>
      <path d="M-200 ${hz + 24}Q${W * 0.32} ${hz + 2} ${W * 0.6} ${hz + 20}Q${W * 0.85} ${hz + 10} ${W + 200} ${hz + 22}V${H + 200}H-200Z" fill="${ground}"/>
      <path d="M-200 ${H * 0.7}Q${W * 0.32} ${H * 0.67} ${W * 0.64} ${H * 0.705}Q${W * 0.86} ${H * 0.725} ${W + 200} ${H * 0.695}V${H + 200}H-200Z" fill="${shade}" opacity=".26"/>
      <path d="M-200 ${H * 0.88}Q${W * 0.37} ${H * 0.855} ${W * 0.69} ${H * 0.89}Q${W * 0.88} ${H * 0.905} ${W + 200} ${H * 0.88}V${H + 200}H-200Z" fill="${shade}" opacity=".36"/>
      <rect x="-200" y="-200" width="${W + 400}" height="${H + 400}" fill="url(#vg-sun)"/>`;
  }
  // The trail: a sand mass (no contour) with a lighter crown and pebbles.
  function trail(d, pebbles = []) {
    return `<path d="${d}" fill="none" stroke="#e5dcc8" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${d}" fill="none" stroke="#fffaf0" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" opacity=".7"/>
      ${pebbles.map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="${6 - (i % 2)}" ry="3.6" fill="#c9bda4"/>`).join("")}`;
  }
  // Edge trees and bushes: mid-layer props, thin ink, three sizes by scale.
  // v119: trees and bushes in the pet language — chunky capsule trunk with
  // bark, a lumpy canopy with an ink edge, colour-matched leaf curls, one
  // shine, and a fruit or blossom; bushes get leaf strokes and a flower.
  // v145: the village's trees are the DetailKit's constructed trees (forked
  // trunk, clumped canopy, leaf ticks, fruit); seeded by position so no two
  // match. Falls back to the simpler v119 tree if the kit is absent.
  let treeN = 0;
  const tree = (x, y, s, dark = false) => ns.DetailKit ? `<g class="vg-deco" transform="translate(${x} ${y + 44 * s}) scale(${(s * 0.78).toFixed(2)})">${ns.DetailKit.tree({ kind: dark ? "round" : "apple", seed: Math.round(x + y) + (treeN++), leaf: dark ? ["#7fce54", "#4e9677", "#2f5c46"] : ["#b7e779", "#7fce54", "#4e9677"] })}</g>` : treeV119(x, y, s, dark);
  const treeV119 = (x, y, s, dark = false) => { const c = dark ? ["#4e9677", "#2f5c46", "#7fce54"] : ["#7fce54", "#4e9677", "#b7e779"];
    return `<g class="vg-deco" transform="translate(${x} ${y}) scale(${s})">${shadow(2, 44, 34, 6, 0.18)}
    <rect x="-7" y="0" width="14" height="44" rx="7" fill="#c69434" stroke="${INK}" stroke-width="3"/><path d="M-1 10V36M3 18V30" stroke="#70501b" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M-30 -10Q-38 -30 -20 -38Q-14 -52 4 -48Q22 -54 28 -36Q40 -26 32 -8Q30 8 12 8Q0 14 -12 8Q-30 8 -30 -10Z" fill="${c[0]}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M-18 -30Q-12 -36 -4 -34M12 -38Q20 -36 24 -28M-20 -2Q-14 2 -6 0M14 0Q22 -2 26 -8" fill="none" stroke="${c[1]}" stroke-width="2.4" stroke-linecap="round"/>
    <ellipse cx="-14" cy="-36" rx="8" ry="4" fill="#fffdf7" opacity=".6"/>
    ${dark ? "" : `<circle cx="16" cy="-16" r="5" fill="#ee806f" stroke="${INK}" stroke-width="1.6"/><circle cx="-8" cy="-12" r="4.5" fill="#ee806f" stroke="${INK}" stroke-width="1.6"/>`}</g>`; };
  const bush = (x, y, s) => `<g class="vg-deco" transform="translate(${x} ${y}) scale(${s})">${shadow(2, 13, 26, 5, 0.16)}<path d="M-26 12Q-30-6-14-8Q-10-22 4-18Q20-24 24-6Q34 2 26 12Z" fill="#7fce54" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M-14 6Q-12 0 -8 -2M0 8Q2 2 6 0M12 6Q14 0 18 -2" fill="none" stroke="#4e9677" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="-10" cy="-8" rx="5" ry="2.4" fill="#fffdf7" opacity=".6"/>${[0, 72, 144, 216, 288].map((a) => `<circle cx="14" cy="-14" r="3" fill="#ffa798" stroke="#ee806f" stroke-width="1.6" transform="rotate(${a} 14 -11)"/>`).join("")}<circle cx="14" cy="-11" r="2.4" fill="#f3c955"/></g>`;
  // ---------- landmarks (touchable: chunky ink, ramped, lit from top-left) ----------
  // The journey gate: a wooden arch with a hanging medallion for the next letter.
  function gateClassic(letter, hue = 268, latin = false) {
    const ring = `hsl(${hue} 52% 62%)`;
    return `${shadow(0, 92, 70, 9)}
      <rect x="-64" y="4" width="12" height="90" rx="6" fill="#c69434" stroke="${INK}" stroke-width="3"/><rect x="52" y="4" width="12" height="90" rx="6" fill="#c69434" stroke="${INK}" stroke-width="3"/>
      <path d="M-60 88V12M56 88V12" stroke="#ffe49a" stroke-width="2.4" stroke-linecap="round"/><path d="M-55 88V14M61 88V14" stroke="#70501b" stroke-width="2.4" stroke-linecap="round" opacity=".5"/>
      <path d="M-78 -2Q0 -30 78 -2L74 14Q0 -10 -74 14Z" fill="#c69434" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M-72 2Q0 -22 72 2" fill="none" stroke="#ffe49a" stroke-width="3" stroke-linecap="round"/>
      <rect x="-70" y="17" width="140" height="10" rx="5" fill="#70501b" stroke="${INK}" stroke-width="3"/>
      <path d="M-22 22V34M22 22V34" stroke="${INK}" stroke-width="2.4"/>
      <g class="vg-medal"><circle cy="66" r="34" fill="#70501b"/><circle cy="62" r="34" fill="${ring}" stroke="${INK}" stroke-width="4"/>
      <g fill="none" stroke-width="3" stroke-linecap="round"><path d="M-29.5 56.8A30 30 0 0 1 5.2 32.5" stroke="hsl(${hue} 78% 76%)"/><path d="M29.5 67.2A30 30 0 0 1 -5.2 91.5" stroke="hsl(${hue} 52% 44%)"/></g>
      <circle cy="62" r="25" fill="#fffdf7" stroke="${INK}" stroke-width="3"/>
      <path d="M-21.7 58.2A22 22 0 0 1 3.8 40.3" fill="none" stroke="#e5dcc8" stroke-width="3" stroke-linecap="round"/>
      <text y="${latin ? 70 : 74}" text-anchor="middle" font-family="${latin ? "ui-rounded, system-ui, sans-serif" : "'Amiri Quran', serif"}" font-size="${latin ? 22 : 30}" fill="${INK}" ${latin ? "" : 'direction="rtl"'}>${letter}</text></g>
      <path d="M-80 -6Q-88 -18 -76 -20Q-70 -10 -80 -6ZM80 -6Q88 -18 76 -20Q70 -10 80 -6Z" fill="#7fce54" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>`;
  }
  // The pet's cottage (the wardrobe): a round house with a leafy roof.
  function cottageClassic() {
    return `${shadow(4, 76, 62, 10)}
      <path d="M-52 76V18Q-52 -10 0 -10Q52 -10 52 18V76Z" fill="#fffaf0"/>
      <path d="M24 -6Q52 0 52 18V76H30Q40 40 24 -6Z" fill="#e5dcc8"/>
      <path d="M-52 76V18Q-52 -10 0 -10Q52 -10 52 18V76Z" fill="none" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M-66 16Q-60 -46 0 -48Q60 -46 66 16Q36 6 0 8Q-36 6 -66 16Z" fill="#7fce54"/>
      <path d="M34 -30Q60 -16 66 16Q50 10 40 10Q44 -10 34 -30Z" fill="#4e9677"/>
      <path d="M-66 16Q-60 -46 0 -48Q60 -46 66 16Q36 6 0 8Q-36 6 -66 16Z" fill="none" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M-40 -16Q-30 -36 -10 -40" fill="none" stroke="#b7e779" stroke-width="4" stroke-linecap="round"/>
      <path d="M0 -48Q-2 -62 0 -70" stroke="#4e9677" stroke-width="4" stroke-linecap="round"/><path d="M0 -64Q-14 -70 -16 -82Q-2 -80 0 -64Z" fill="#b7e779" stroke="${INK}" stroke-width="2.4"/><path d="M0 -60Q14 -68 18 -80Q2 -78 0 -60Z" fill="#7fce54" stroke="${INK}" stroke-width="2.4"/>
      <path d="M-16 76V44Q-16 28 0 28Q16 28 16 44V76Z" fill="#ee806f"/>
      <path d="M6 30Q16 34 16 44V76H8Q12 50 6 30Z" fill="#c25a49"/>
      <path d="M-16 76V44Q-16 28 0 28Q16 28 16 44V76Z" fill="none" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="8" cy="54" r="3" fill="#f3c955" stroke="${INK}" stroke-width="1.6"/>
      <circle cx="-34" cy="34" r="11" fill="#96ecff" stroke="${INK}" stroke-width="3"/><path d="M-34 23V45M-45 34H-23" stroke="${INK}" stroke-width="2.4"/>
      <path d="M-38 28Q-36 25 -32 25" fill="none" stroke="#ccfbef" stroke-width="2.4" stroke-linecap="round"/>`;
  }
  // The cottage's front yard (decorate): a little dug bed with a watering can.
  function yardClassic() {
    return `${shadow(2, 22, 44, 7, 0.18)}
      <path d="M-44 20Q-44 4 0 2Q44 4 44 20Q0 30 -44 20Z" fill="#a89478" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M-34 14Q-20 10 -8 13M8 12Q22 9 34 13" fill="none" stroke="#70501b" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M-24 8Q-25 -4 -24 -12" stroke="#4e9677" stroke-width="3" stroke-linecap="round"/><path d="M-24 -6Q-34 -10 -36 -18Q-26 -18 -24 -6Z" fill="#b7e779" stroke="${INK}" stroke-width="1.6"/><circle cx="-24" cy="-16" r="6" fill="#ffa798" stroke="${INK}" stroke-width="1.6"/><circle cx="-24" cy="-16" r="2" fill="#f3c955"/>
      <g transform="translate(20 -6)"><path d="M-12 14V-2Q-12 -8 -6 -8H8Q14 -8 14 -2V14Z" fill="#62cdf4" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M14 0L28 -10" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M14 0L28 -10" stroke="#62cdf4" stroke-width="2.4" stroke-linecap="round"/><path d="M-8 -8Q0 -18 8 -8" fill="none" stroke="${INK}" stroke-width="3"/><path d="M-8 -2H4" stroke="#ccfbef" stroke-width="2.4" stroke-linecap="round"/></g>`;
  }
  // The friends' garden: a picket-fenced bed; friends stand inside it.
  function friendsBedClassic(chars, friendArt) {
    return `${shadow(4, 66, 84, 11)}
      <path d="M-80 66Q-80 34 0 32Q80 34 80 66Z" fill="#a89478"/>
      <path d="M-76 60Q0 52 76 60" fill="none" stroke="#70501b" stroke-width="2.4" stroke-linecap="round"/>
      ${chars.slice(0, 3).map((c, i) => `<svg x="${-74 + i * 50}" y="${-16 + (i % 2) * 4}" width="66" height="66" viewBox="-6 -6 112 112" overflow="visible">${friendArt(c).replace(/^<svg[^>]*>|<\/svg>$/g, "")}</svg>`).join("")}
      ${chars.length ? "" : `<path d="M-30 40Q-31 28 -30 20M30 42Q29 30 30 22" stroke="#4e9677" stroke-width="3" stroke-linecap="round"/><path d="M-30 26Q-40 22 -42 14Q-32 14 -30 26ZM30 28Q40 24 42 16Q32 16 30 28Z" fill="#b7e779" stroke="${INK}" stroke-width="1.6"/>`}
      ${Array.from({ length: 9 }, (_, i) => { const px = -76 + i * 19; return `<path d="M${px} 72V36L${px + 6} 28L${px + 12} 36V72Z" fill="#fffaf0" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M${px + 8} 36V70" stroke="#e5dcc8" stroke-width="3"/>`; }).join("")}
      <path d="M-80 46H82M-80 62H82" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><path d="M-80 46H82M-80 62H82" stroke="#fffaf0" stroke-width="3" stroke-linecap="round"/>`;
  }
  // The toy chest (practice garden), lid tipped back, toys peeking out.
  function toyChestClassic(open = true) {
    return `${shadow(4, 64, 70, 10)}
      <path d="M-58 -8L-50 -40Q0 -52 50 -40L58 -8Z" fill="#70501b" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M-48 -36Q0 -46 48 -36" fill="none" stroke="#c69434" stroke-width="3" stroke-linecap="round"/>
      ${open ? `<circle cx="-30" cy="-14" r="14" fill="#62cdf4" stroke="${INK}" stroke-width="3"/><path d="M-38 -20Q-34 -26 -26 -26" fill="none" stroke="#ccfbef" stroke-width="3" stroke-linecap="round"/>
      <path d="M8 -6L18 -40L32 -6Z" fill="#ee806f" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M42 -26V-62" stroke="#a89478" stroke-width="2.4"/><ellipse cx="42" cy="-74" rx="13" ry="16" fill="#ffa798" stroke="${INK}" stroke-width="3"/><path d="M36 -80Q38 -86 44 -86" fill="none" stroke="#fffaf0" stroke-width="2.4" stroke-linecap="round"/>` : ""}
      <path d="M-58 -6H58V58Q0 66 -58 58Z" fill="#c69434"/>
      <path d="M30 -6H58V58Q46 62 30 62Z" fill="#70501b" opacity=".45"/>
      <path d="M-58 -6H58V58Q0 66 -58 58Z" fill="none" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M-58 14H58" stroke="${INK}" stroke-width="3"/><path d="M-54 10H54" stroke="#ffe49a" stroke-width="2.4" stroke-linecap="round"/>
      <rect x="-10" y="6" width="20" height="18" rx="4" fill="#f3c955" stroke="${INK}" stroke-width="3"/>
      ${open ? "" : `<path d="M-6 -30Q-7 -44 -6 -52" stroke="#4e9677" stroke-width="3" stroke-linecap="round"/><path d="M-6 -46Q-18 -50 -20 -60Q-8 -60 -6 -46Z" fill="#b7e779" stroke="${INK}" stroke-width="1.6"/>`}`;
  }
  // Stepping stones (today's walk): three flat stones with a footprint.
  // v96: small landmarks carry an invisible tap pad (a painted, fully
  // transparent shape) so a small finger that lands near them still counts.
  function stonesClassic(done = 0, total = 3) {
    return `<rect class="vg-hit" x="-56" y="-26" width="112" height="56" rx="20" fill="#fffaf0" fill-opacity="0"/>${[[-34, 10, 15], [0, 0, 17], [34, 12, 15]].map(([x, y, r], i) => `${shadow(x, y + 7, r, r * 0.3, 0.16)}<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.55}" fill="${i < done ? "#ffe49a" : "#e5dcc8"}" stroke="${INK}" stroke-width="3"/><path d="M${x - r * 0.5} ${y - r * 0.18}Q${x - r * 0.2} ${y - r * 0.4} ${x + r * 0.2} ${y - r * 0.36}" fill="none" stroke="#fffaf0" stroke-width="2.4" stroke-linecap="round"/>`).join("")}
      <path d="M-4 -3Q-2 -9 2 -6Q4 -2 0 1Z M5 -1Q7 -5 9 -3" fill="#a89478"/>
      ${done >= total ? `<path d="M36 -10L40 -2L48 -1L42 5L44 13L36 9L28 13L30 5L24 -1L32 -2Z" fill="#f3c955" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round" transform="translate(0 -14) scale(.7)"/>` : ""}`;
  }
  // The sundial (daily practice) and the skill-flower bed (check-up).
  function sundialClassic(stamped = false) {
    return `${shadow(2, 34, 26, 5)}
      <path d="M-10 34V6H10V34Z" fill="#e5dcc8" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M4 8V32" stroke="#c9bda4" stroke-width="3"/>
      <ellipse cy="4" rx="26" ry="9" fill="#fffaf0" stroke="${INK}" stroke-width="3"/>
      <circle cy="-18" r="16" fill="#f3c955" stroke="${INK}" stroke-width="3"/>${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<path d="M0 -38L3 -32H-3Z" fill="#f3c955" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round" transform="rotate(${a} 0 -18)"/>`).join("")}
      <circle cx="-5" cy="-20" r="2" fill="${INK}"/><circle cx="5" cy="-20" r="2" fill="${INK}"/><path d="M-5 -13Q0 -9 5 -13" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>
      ${stamped ? `<circle cx="18" cy="-2" r="9" fill="#7fce54" stroke="${INK}" stroke-width="2.4"/><path d="M14 -2L17 1L22 -5" fill="none" stroke="#fffaf0" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>` : ""}`;
  }
  function flowerBedClassic() {
    return `<rect class="vg-hit" x="-42" y="-44" width="84" height="74" rx="20" fill="#fffaf0" fill-opacity="0"/>${shadow(2, 20, 34, 6)}<path d="M-34 18Q-34 6 0 4Q34 6 34 18Q0 26 -34 18Z" fill="#a89478" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      ${[[-18, "#ffa798"], [0, "#b49fcf"], [18, "#ffe49a"]].map(([x, c], i) => `<path d="M${x} 8Q${x - 1} -4 ${x} -14" stroke="#4e9677" stroke-width="3" stroke-linecap="round"/><g transform="translate(${x} ${-18 - (i % 2) * 4})">${[0, 72, 144, 216, 288].map((a) => `<ellipse cy="-6" rx="4" ry="6.5" fill="${c}" stroke="${INK}" stroke-width="1.6" transform="rotate(${a})"/>`).join("")}<circle r="3.4" fill="#f3c955" stroke="${INK}" stroke-width="1.6"/></g>`).join("")}`;
  }


  // ---------- v103: landmarks in the pet's language (owner-reviewed comp,
  // .qa/pet-language.html). Same colours; four rules: flat colour + one
  // shine, chunky round low-and-wide shapes, one ink weight matching the
  // pet (4, small parts 3), fewer and bigger parts. The *Classic versions
  // above stay for A/B and rollback. ----------
  const ink = (w = 4) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const shine = (cx, cy, rx, ry = rx * 0.5, rot = -20) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${cx} ${cy})" fill="#fffdf7" opacity=".75"/>`;
  // v103b (owner: "increase the level of detail"): round silhouettes, richer
  // insides — thin 2.4 detail strokes in a deeper shade of each object's own
  // colour, plus small charming parts.
  const DL = (c, w = 2.4) => `fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
  const tuft = (x, y, c = "#4e9677") => `<path d="M${x - 6} ${y}Q${x - 6} ${y - 8} ${x - 2} ${y - 10}M${x} ${y}Q${x} ${y - 10} ${x + 3} ${y - 13}M${x + 6} ${y}Q${x + 7} ${y - 7} ${x + 10} ${y - 8}" ${DL(c, 3)}/>`;
  const bloom = (x, y, c, d, r = 4) => `${[0, 72, 144, 216, 288].map((a) => `<circle cx="${x}" cy="${y - r}" r="${r}" fill="${c}" stroke="${d}" stroke-width="1.6" transform="rotate(${a} ${x} ${y})"/>`).join("")}<circle cx="${x}" cy="${y}" r="${r * 0.75}" fill="#f3c955" stroke="#c69434" stroke-width="1.6"/>`;
  function gate(letter, hue = 268, latin = false) {
    return `${shadow(0, 94, 70, 9)}${tuft(-70, 94)}${tuft(64, 94)}
      <path d="M-66 92V30Q-66 -30 0 -30Q66 -30 66 30V92H44V32Q44 -8 0 -8Q-44 -8 -44 32V92Z" fill="#c69434" ${ink()}/>
      <path d="M-60 86V34Q-60 -22 0 -22Q60 -22 60 34V86" ${DL("#ffe49a", 2.4)}/>
      <path d="M-56 50V80M-50 20V40M50 30V54M56 66V84M-24 -18Q-12 -22 0 -22" ${DL("#70501b")}/>
      ${shine(-50, 8, 8, 20, 16)}
      <rect x="-72" y="84" width="28" height="12" rx="6" fill="#a89478" ${ink(3)}/><rect x="44" y="84" width="28" height="12" rx="6" fill="#a89478" ${ink(3)}/>
      <path d="M-66 30Q-80 22 -78 4M66 30Q80 22 78 4" ${DL("#4e9677", 3)}/>
      <path d="M-72 -4Q-90 -14 -80 -26Q-66 -22 -72 -4ZM72 -4Q90 -14 80 -26Q66 -22 72 -4Z" fill="#7fce54" ${ink(3)}/>
      <path d="M-78 10Q-92 6 -90 -4Q-80 -2 -78 10ZM78 14Q92 10 90 0Q80 2 78 14Z" fill="#b7e779" stroke="#4e9677" stroke-width="2.4" stroke-linejoin="round"/>
      ${bloom(-66, -30, "#ffa798", "#ee806f", 4)}${bloom(64, -26, "#e6d6f0", "#b49fcf", 4)}
      <path d="M-10 -8V8M10 -8V8" ${DL("#4a3620", 2.4)}/>
      <g class="vg-medal"><circle cy="42" r="34" fill="hsl(${hue} 52% 62%)" ${ink()}/>
      <circle cy="42" r="29" fill="none" stroke="hsl(${hue} 60% 46%)" stroke-width="2.4" stroke-dasharray="2 6" stroke-linecap="round"/>${shine(-16, 22, 9, 5)}
      <circle cy="42" r="23" fill="#fffdf7" ${ink(3)}/>
      <text y="${latin ? 50 : 54}" text-anchor="middle" font-family="${latin ? "ui-rounded, system-ui, sans-serif" : "'Amiri Quran', serif"}" font-size="${latin ? 22 : 30}" fill="${INK}" ${latin ? "" : 'direction="rtl"'}>${letter}</text></g>`;
  }
  function cottage() {
    return `${shadow(4, 78, 64, 10)}${tuft(-56, 78)}${tuft(52, 78)}
      <g fill="#fffaf0" opacity=".85"><circle cx="40" cy="-70" r="6"/><circle cx="46" cy="-84" r="8"/><circle cx="54" cy="-100" r="10"/></g>
      <rect x="30" y="-62" width="20" height="38" rx="5" fill="#e5dcc8" ${ink(3)}/><rect x="27" y="-68" width="26" height="10" rx="4" fill="#c9bda4" ${ink(3)}/><path d="M34 -50H46M34 -40H46" ${DL("#c9bda4")}/>
      <rect x="-50" y="-4" width="100" height="80" rx="34" fill="#fffaf0" ${ink()}/>
      <path d="M-42 20H42M-46 36H-20M20 36H46M-46 52H-20M20 52H46" ${DL("#e5dcc8")}/>
      <path d="M36 4Q46 16 46 40V62" ${DL("#e5dcc8", 4)}/>
      <path d="M-40 56Q-34 52 -28 56M30 50Q36 46 42 50" ${DL("#c9bda4")}/>
      <path d="M-68 20Q-68 -52 0 -52Q68 -52 68 20Q68 30 56 28Q0 18 -56 28Q-68 30 -68 20Z" fill="#7fce54" ${ink()}/>
      <path d="M-58 16Q-40 6 -22 12Q-4 4 14 12Q32 4 50 12Q58 10 62 16" ${DL("#4e9677")}/><path d="M-60 2Q-44 -8 -28 -2Q-12 -10 4 -2Q20 -10 36 -2Q50 -8 62 0" ${DL("#4e9677")}/>
      <path d="M-46 -16Q-30 -24 -16 -18Q2 -28 20 -18M-20 -38Q0 -44 18 -36" ${DL("#4e9677")}/>
      <circle cx="-30" cy="-6" r="6" fill="#b7e779" stroke="#4e9677" stroke-width="1.6"/><circle cx="28" cy="-28" r="5" fill="#b7e779" stroke="#4e9677" stroke-width="1.6"/><circle cx="44" cy="-2" r="4" fill="#b7e779" stroke="#4e9677" stroke-width="1.6"/>
      ${shine(-34, -26, 14, 6)}
      <path d="M0 -52Q-2 -64 2 -72" fill="none" ${ink()}/><path d="M2 -70Q-12 -86 -18 -78Q-12 -66 2 -70Z" fill="#b7e779" ${ink(3)}/><path d="M2 -70Q-6 -74 -12 -76" ${DL("#4e9677", 1.6)}/>
      <rect x="-19" y="25" width="40" height="52" rx="20" fill="#e5dcc8" ${ink(3)}/>
      <rect x="-14" y="30" width="30" height="46" rx="15" fill="#ee806f" ${ink()}/>
      <path d="M-6 40V70M8 40V70" ${DL("#c25a49")}/><circle cx="10" cy="56" r="3" fill="#f3c955" stroke="#c69434" stroke-width="1.6"/>
      <rect x="-18" y="72" width="38" height="8" rx="4" fill="#c9bda4" ${ink(3)}/>
      <circle cx="-30" cy="42" r="11" fill="#96ecff" ${ink(3)}/><path d="M-30 32V52M-40 42H-20" ${DL("#4a3620", 2.4)}/>${shine(-34, 37, 3, 2)}
      <path d="M-42 56Q-30 50 -18 56" ${DL("#c69434", 6)}/>${bloom(-38, 52, "#ffa798", "#ee806f", 3)}${bloom(-24, 51, "#ffe49a", "#c69434", 3)}
      <circle cx="32" cy="34" r="8" fill="#96ecff" ${ink(3)}/><path d="M24 34H40M32 26V42" ${DL("#4a3620", 1.6)}/>
      <g transform="translate(24 50)"><path d="M0 -6V0" ${DL("#4a3620", 2.4)}/><rect x="-4.5" y="0" width="9" height="11" rx="4" fill="#ffe49a" ${ink(2.4)}/></g>
      ${[-44, -30, -16, 16, 30, 44].map((x) => `<ellipse cx="${x}" cy="77" rx="7" ry="4" fill="#c9bda4" ${ink(2.4)}/>`).join("")}`;
  }
  function toyChestV103(open = true) {
    return `${shadow(4, 64, 66, 10)}${tuft(-66, 62)}${tuft(64, 62)}
      ${open ? `<circle cx="-26" cy="-34" r="16" fill="#62cdf4" ${ink()}/><path d="M-41 -34Q-26 -26 -11 -34M-26 -50Q-18 -34 -26 -18" ${DL("#3a8fc4")}/>${shine(-31, -40, 5, 3)}
      <path d="M0 -22Q8 -54 14 -52Q20 -50 26 -22Z" fill="#ee806f" ${ink(3)}/><path d="M6 -32H22M10 -42H18" ${DL("#fffdf7", 2.4)}/>
      <path d="M36 -24V-58" fill="none" ${ink(3)}/><ellipse cx="36" cy="-70" rx="15" ry="17" fill="#ffa798" ${ink()}/><path d="M33 -53L36 -50L39 -53Z" fill="#ffa798" stroke="${INK}" stroke-width="1.6"/>${shine(30, -76, 5, 3)}` : ""}
      <rect x="-60" y="-8" width="120" height="66" rx="26" fill="#c69434" ${ink()}/>
      <path d="M-50 24H50M-50 42H50" ${DL("#70501b")}/><path d="M-30 12Q-20 10 -10 12M20 50Q30 48 40 50" ${DL("#ffe49a", 2.4)}/>
      ${[[-52, 0], [52, 0], [-52, 50], [52, 50]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#f3c955" stroke="#70501b" stroke-width="2.4"/>`).join("")}
      <rect x="-64" y="-20" width="128" height="30" rx="15" fill="#70501b" ${ink()}/><path d="M-50 -10Q0 -16 50 -10" ${DL("#c69434", 2.4)}/>
      ${shine(-36, 18, 14, 6)}
      <rect x="-13" y="14" width="26" height="24" rx="10" fill="#f3c955" ${ink(3)}/><circle cy="24" r="3.5" fill="#70501b"/><path d="M0 26V32" ${DL("#70501b", 2.4)}/>
      ${open ? "" : `<path d="M0 -20Q-1 -34 0 -44" fill="none" stroke="#4e9677" stroke-width="4" stroke-linecap="round"/><path d="M0 -38Q-14 -42 -16 -54Q-2 -54 0 -38Z" fill="#b7e779" ${ink(3)}/><path d="M0 -40Q10 -46 12 -56Q2 -54 0 -40Z" fill="#7fce54" ${ink(3)}/>`}`;
  }
  // v160 (owner: "a house isn't just a square"): the chest is built like a
  // real one. Bun feet, a planked box with a lip, gold straps with rivets,
  // rope handles, and a hasp. Open, the lid swings back behind the toys, so
  // they sit inside instead of balancing on top. Closed: a domed lid with a sprout.
  function toyChest(open = true) {
    const strap = (x, y0, y1) => `<rect x="${x - 6}" y="${y0}" width="12" height="${y1 - y0}" rx="5" fill="#f3c955" ${ink(3)}/>${[y0 + 7, y1 - 7].map((y) => `<circle cx="${x}" cy="${y}" r="2" fill="#c69434"/>`).join("")}`;
    const toys = `<g transform="translate(0 12)"><circle cx="-26" cy="-34" r="16" fill="#62cdf4" ${ink()}/><path d="M-41 -34Q-26 -26 -11 -34M-26 -50Q-18 -34 -26 -18" ${DL("#3a8fc4")}/>${shine(-31, -40, 5, 3)}
      <path d="M0 -22Q8 -54 14 -52Q20 -50 26 -22Z" fill="#ee806f" ${ink(3)}/><path d="M6 -32H22M10 -42H18" ${DL("#fffdf7", 2.4)}/>
      <path d="M36 -24V-58" fill="none" ${ink(3)}/><ellipse cx="36" cy="-70" rx="15" ry="17" fill="#ffa798" ${ink()}/><path d="M33 -53L36 -50L39 -53Z" fill="#ffa798" stroke="${INK}" stroke-width="1.6"/>${shine(30, -76, 5, 3)}</g>`;
    const lidOpen = `<path d="M-60 -10L-54 -58Q0 -68 54 -58L60 -10Z" fill="#a89478" ${ink()}/><path d="M-50 -48Q0 -56 50 -48M-52 -32Q0 -38 52 -32" ${DL("#70501b")}/>
      <path d="M-36 -12L-33 -61M36 -12L33 -61" stroke="#c69434" stroke-width="8" stroke-linecap="round"/>`;
    const lidShut = `<path d="M-64 -4V-8Q-64 -40 0 -40Q64 -40 64 -8V-4Q64 4 56 4H-56Q-64 4 -64 -4Z" fill="#c69434" ${ink()}/>
      <path d="M-56 -12Q0 -20 56 -12M-46 -26Q0 -34 46 -26" ${DL("#70501b")}/>${shine(-40, -24, 10, 4)}
      ${strap(-36, -36, 2)}${strap(36, -36, 2)}
      <path d="M0 -38Q-1 -50 0 -60" fill="none" stroke="#4e9677" stroke-width="4" stroke-linecap="round"/><path d="M0 -52Q-14 -56 -16 -68Q-2 -68 0 -52Z" fill="#b7e779" ${ink(3)}/><path d="M0 -54Q10 -60 12 -70Q2 -68 0 -54Z" fill="#7fce54" ${ink(3)}/>`;
    return `${shadow(4, 66, 68, 10)}${tuft(-68, 64)}${tuft(66, 64)}
      ${[-46, 46].map((x) => `<ellipse cx="${x}" cy="60" rx="11" ry="7" fill="#70501b" ${ink(3)}/>`).join("")}
      ${open ? `${lidOpen}<rect x="-58" y="-16" width="116" height="20" rx="8" fill="#70501b" ${ink(3)}/>${toys}` : ""}
      ${[-1, 1].map((d) => `<path d="M${d * 58} 16Q${d * 74} 18 ${d * 72} 30Q${d * 70} 40 ${d * 58} 38" fill="none" ${ink(6)}/><path d="M${d * 58} 16Q${d * 74} 18 ${d * 72} 30Q${d * 70} 40 ${d * 58} 38" ${DL("#e5dcc8", 3)}/>`).join("")}
      <rect x="-60" y="-6" width="120" height="62" rx="16" fill="#c69434" ${ink()}/>
      <path d="M-56 14H56M-56 34H56" ${DL("#70501b")}/><path d="M-48 22Q-40 20 -32 22M8 44Q16 42 24 44M44 6Q50 4 54 6" ${DL("#ffe49a")}/>
      <rect x="-64" y="-10" width="128" height="14" rx="7" fill="#70501b" ${ink()}/>
      ${shine(-46, 8, 8, 3, 0)}
      ${strap(-36, -8, 54)}${strap(36, -8, 54)}
      ${open ? "" : lidShut}
      <path d="M-9 ${open ? -4 : -6}V12" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><path d="M9 ${open ? -4 : -6}V12" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><path d="M-9 ${open ? -4 : -6}V12M9 ${open ? -4 : -6}V12" stroke="#f3c955" stroke-width="2.4" stroke-linecap="round"/>
      <rect x="-14" y="10" width="28" height="26" rx="10" fill="#f3c955" ${ink(3)}/><circle cy="20" r="3.5" fill="#70501b"/><path d="M0 22V29" ${DL("#70501b", 2.4)}/>${shine(-7, 15, 3, 1.6, 0)}
      ${[-58, 58].map((x) => `<path d="M${x} 44V52Q${x} 56 ${x + (x < 0 ? 4 : -4)} 56H${x + (x < 0 ? 10 : -10)}" fill="none" stroke="#f3c955" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`).join("")}`;
  }
  function friendsBedV103(chars, friendArt) {
    return `${shadow(4, 72, 84, 11)}
      <rect x="-82" y="30" width="164" height="42" rx="21" fill="#a89478" ${ink()}/>
      <path d="M-66 44Q-58 40 -50 44M-10 42Q0 38 10 42M46 44Q54 40 62 44" ${DL("#70501b")}/>
      ${chars.slice(0, 3).map((c, i) => `<svg x="${-74 + i * 50}" y="${-34 + (i % 2) * 4}" width="66" height="66" viewBox="-6 -6 112 112" overflow="visible">${friendArt(c).replace(/^<svg[^>]*>|<\/svg>$/g, "")}</svg>`).join("")}
      ${chars.length ? "" : [-34, 34].map((x) => `<path d="M${x} 40Q${x - 1} 26 ${x} 16" fill="none" stroke="#4e9677" stroke-width="4" stroke-linecap="round"/><path d="M${x} 22Q${x - 14} 18 ${x - 16} 6Q${x - 2} 6 ${x} 22Z" fill="#b7e779" ${ink(3)}/><path d="M${x} 26Q${x + 12} 22 ${x + 14} 12Q${x + 2} 12 ${x} 26Z" fill="#7fce54" ${ink(3)}/>`).join("")}
      ${[-64, -32, 0, 32, 64].map((x) => `<rect x="${x - 11}" y="46" width="22" height="30" rx="11" fill="#fffaf0" ${ink()}/><path d="M${x + 4} 52V70" ${DL("#e5dcc8", 3)}/>`).join("")}
      <rect x="-84" y="54" width="168" height="14" rx="7" fill="#fffaf0" ${ink()}/><path d="M-76 58H76" ${DL("#e5dcc8", 2.4)}/>
      ${bloom(-48, 76, "#ffa798", "#ee806f", 3.5)}${bloom(16, 78, "#e6d6f0", "#b49fcf", 3.5)}${bloom(80, 74, "#ffe49a", "#c69434", 3.5)}${tuft(-88, 76)}${tuft(-14, 80)}`;
  }
  // v160: the friends' spot is a painted garden bench (backrest slats, seat,
  // armrests, braced legs). The friends sit on it. Before any arrive, two
  // cushions wait on the seat, so the bench says someone is coming.
  function friendsBed(chars, friendArt) {
    const slat = (y) => `<rect x="-78" y="${y}" width="156" height="13" rx="6.5" fill="#fffaf0" ${ink(3)}/><path d="M-66 ${y + 6}Q-50 ${y + 4} -34 ${y + 6}M20 ${y + 7}Q36 ${y + 5} 52 ${y + 7}" ${DL("#e5dcc8")}/>`;
    const cushion = (x, c, d) => `<rect x="${x - 22}" y="14" width="44" height="22" rx="10" fill="${c}" ${ink(3)}/><rect x="${x - 17}" y="18" width="34" height="14" rx="6" fill="none" stroke="${d}" stroke-width="1.6" stroke-dasharray="2 4" stroke-linecap="round"/><circle cx="${x}" cy="25" r="2.4" fill="${d}"/>${shine(x - 12, 18, 5, 2, 0)}`;
    return `${shadow(4, 76, 88, 11)}
      ${[-70, 70].map((x) => `<rect x="${x - 6}" y="-14" width="12" height="54" rx="6" fill="#e5dcc8" ${ink(3)}/>`).join("")}
      ${slat(-10)}${slat(8)}
      ${[-66, 66].map((x) => `<rect x="${x - 6}" y="40" width="12" height="34" rx="5" fill="#c9bda4" ${ink(3)}/>`).join("")}
      <path d="M-60 62H60" fill="none" ${ink(6)}/><path d="M-60 62H60" ${DL("#e5dcc8", 3)}/>
      ${chars.length ? "" : `${cushion(-34, "#ffa798", "#ee806f")}${cushion(34, "#e6d6f0", "#b49fcf")}`}
      ${chars.slice(0, 3).map((c, i) => `<svg x="${-74 + i * 50}" y="${-32 + (i % 2) * 4}" width="66" height="66" viewBox="-6 -6 112 112" overflow="visible">${friendArt(c).replace(/^<svg[^>]*>|<\/svg>$/g, "")}</svg>`).join("")}
      <rect x="-86" y="32" width="172" height="14" rx="7" fill="#fffaf0" ${ink()}/><path d="M-76 37H-20M14 37H76" ${DL("#e5dcc8")}/>${shine(-64, 36, 8, 2.4, 0)}
      ${[-1, 1].map((d) => `<path d="M${d * 90} 32V12Q${d * 90} 6 ${d * 84} 6H${d * 74}" fill="none" ${ink(8)}/><path d="M${d * 90} 32V12Q${d * 90} 6 ${d * 84} 6H${d * 74}" fill="none" stroke="#fffaf0" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${d * 90}" cy="10" r="6" fill="#fffaf0" ${ink(3)}/>`).join("")}
      ${bloom(-48, 80, "#ffa798", "#ee806f", 3.5)}${bloom(16, 82, "#e6d6f0", "#b49fcf", 3.5)}${bloom(84, 78, "#ffe49a", "#c69434", 3.5)}${tuft(-92, 80)}${tuft(-14, 84)}${tuft(54, 82)}`;
  }
  function stall() {
    return `${shadow(2, 70, 66, 10)}${tuft(-70, 70)}${tuft(66, 70)}
      <rect x="-48" y="-30" width="14" height="96" rx="7" fill="#c69434" ${ink(3)}/><rect x="34" y="-30" width="14" height="96" rx="7" fill="#c69434" ${ink(3)}/>
      <path d="M-41 -20V56M41 -20V56" ${DL("#70501b")}/>
      <path d="M-64 -34Q-64 -66 0 -66Q64 -66 64 -34Q56 -18 48 -34Q40 -18 32 -34Q24 -18 16 -34Q8 -18 0 -34Q-8 -18 -16 -34Q-24 -18 -32 -34Q-40 -18 -48 -34Q-56 -18 -64 -34Z" fill="#ee806f" ${ink()}/>
      <path d="M-40 -64Q-46 -50 -48 -34M-16 -66Q-18 -50 -16 -34M16 -66Q18 -50 16 -34M40 -64Q46 -50 48 -34" ${DL("#fffaf0", 6)}/>
      <path d="M-64 -34Q-56 -18 -48 -34Q-40 -18 -32 -34Q-24 -18 -16 -34Q-8 -18 0 -34Q8 -18 16 -34Q24 -18 32 -34Q40 -18 48 -34Q56 -18 64 -34" fill="none" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      ${shine(-30, -56, 10, 4)}
      <circle cy="-70" r="7" fill="#f3c955" ${ink(3)}/>
      <path d="M-34 -24Q-18 -16 0 -24Q18 -16 34 -24" ${DL("#c69434", 2.4)}/>
      <g transform="translate(0 54)">${[[-80, "#ee806f"], [80, "#62cdf4"]].map(([x, c]) => `<rect x="${x - 15}" y="0" width="30" height="20" rx="5" fill="#c69434" ${ink(2.4)}/><path d="M${x - 11} 7H${x + 11}M${x - 11} 13H${x + 11}" ${DL("#70501b", 1.6)}/><circle cx="${x - 5}" cy="-2" r="4" fill="${c}" ${ink(1.6)}/><circle cx="${x + 5}" cy="-3" r="4" fill="#b7e779" ${ink(1.6)}/>`).join("")}</g>
      <rect x="-66" y="16" width="132" height="44" rx="20" fill="#fffaf0" ${ink()}/>
      ${[-44, -22, 22, 44].map((x, i) => `<g transform="translate(${x} 30) rotate(${[-8, 5, -4, 7][i]})"><rect x="-8" y="-9" width="16" height="18" rx="4" fill="#fffdf7" ${ink(1.6)}/><circle cy="-1" r="4" fill="${["#ffa798", "#ffe49a", "#b49fcf", "#96ecff"][i]}"/></g>`).join("")}
      <path d="M-56 40H56" ${DL("#e5dcc8", 3)}/><rect x="-40" y="44" width="80" height="10" rx="5" fill="#ffe49a" stroke="#c69434" stroke-width="2.4"/><path d="M0 43.5L1.8 47.2L5.8 47.6L2.8 50.2L3.6 54L0 52L-3.6 54L-2.8 50.2L-5.8 47.6L-1.8 47.2Z" fill="#f3c955" stroke="#c69434" stroke-width="1.6" stroke-linejoin="round" transform="translate(0 -1)"/>
      <circle cx="-30" cy="2" r="12" fill="#ffa798" ${ink(3)}/><path d="M-36 -2L-24 6M-36 6L-24 -2" ${DL("#ee806f", 2.4)}/>
      <circle cx="0" cy="2" r="12" fill="#b7e779" ${ink(3)}/><path d="M0 -10V14M-12 2H12" ${DL("#7fce54", 2.4)}/>
      <circle cx="30" cy="2" r="12" fill="#96ecff" ${ink(3)}/><path d="M24 2Q30 -4 36 2Q30 8 24 2" ${DL("#62cdf4", 2.4)}/>`;
  }

  // v105: the small landmarks join the same detailed pet language.
  // v160: a raised bed built from parts (soil mound, two planks with nail
  // heads, capped corner posts) in place of a flat grey pill.
  const bedSoil = (w, y) => `<path d="M${-w + 2} ${y + 6}Q${-w + 6} ${y - 4} 0 ${y - 5}Q${w - 6} ${y - 4} ${w - 2} ${y + 6}Z" fill="#70501b" ${ink(3)}/><path d="M${-w * 0.5} ${y - 1}h3M${w * 0.3} ${y}h3" ${DL("#a89478", 2.4)}/>`;
  const bedBox = (w, y, h = 20) => `<rect x="${-w}" y="${y}" width="${w * 2}" height="${h}" rx="6" fill="#c69434" ${ink(3)}/><path d="M${-w + 6} ${y + h / 2}H${w - 6}" ${DL("#70501b")}/><path d="M${-w * 0.4} ${y + 5}Q${-w * 0.25} ${y + 3.5} ${-w * 0.1} ${y + 5}" ${DL("#ffe49a", 1.6)}/>
    ${[-1, 1].map((d) => `<circle cx="${d * (w - 14)}" cy="${y + 5}" r="1.6" fill="#70501b"/><circle cx="${d * (w - 14)}" cy="${y + h - 5}" r="1.6" fill="#70501b"/><rect x="${d * w - 6}" y="${y - 4}" width="12" height="${h + 8}" rx="5" fill="#70501b" ${ink(3)}/><rect x="${d * w - 7}" y="${y - 7}" width="14" height="7" rx="3.5" fill="#c69434" ${ink(2.4)}/>`).join("")}`;
  function yard() {
    return `${shadow(2, 24, 46, 7, 0.18)}${tuft(-48, 24)}
      ${bedSoil(44, 6)}
      <path d="M-26 6Q-27 -6 -26 -14" ${DL("#4e9677", 4)}/><path d="M-26 -6Q-38 -10 -40 -20Q-28 -20 -26 -6Z" fill="#b7e779" ${ink(3)}/>
      ${bloom(-26, -20, "#ffa798", "#ee806f", 4)}
      <path d="M-4 4Q-5 -2 -4 -6" ${DL("#4e9677", 3)}/><path d="M-4 -4Q-14 -6 -14 -13Q-6 -12 -4 -4Z" fill="#b7e779" stroke="#4e9677" stroke-width="1.6" stroke-linejoin="round"/><path d="M-4 -5Q4 -9 6 -15Q-2 -14 -4 -5Z" fill="#7fce54" stroke="#4e9677" stroke-width="1.6" stroke-linejoin="round"/>
      ${bedBox(44, 6)}
      <g transform="translate(20 -4)"><rect x="-14" y="-10" width="28" height="24" rx="10" fill="#62cdf4" ${ink(3)}/><path d="M-8 -2H8" ${DL("#3a8fc4")}/>
        <path d="M14 -2Q26 -6 30 -14" fill="none" ${ink(4)}/><rect x="26" y="-20" width="12" height="8" rx="4" fill="#62cdf4" ${ink(3)}/>
        <path d="M-6 -10Q0 -20 6 -10" fill="none" ${ink(3)}/>${shine(-6, -4, 4, 2)}
        <circle cx="38" cy="-6" r="2.4" fill="#96ecff"/><circle cx="42" cy="0" r="2" fill="#96ecff"/></g>`;
  }
  function stones(done = 0, total = 3) {
    return `<rect class="vg-hit" x="-56" y="-26" width="112" height="56" rx="20" fill="#fffaf0" fill-opacity="0"/>${[[-34, 10, 15], [0, 0, 17], [34, 12, 15]].map(([x, y, r], i) => `${shadow(x, y + 7, r, r * 0.3, 0.16)}<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.62}" fill="${i < done ? "#ffe49a" : "#e5dcc8"}" ${ink(3)}/><path d="M${x - r * 0.5} ${y + r * 0.2}Q${x} ${y + r * 0.4} ${x + r * 0.5} ${y + r * 0.2}" ${DL(i < done ? "#c69434" : "#c9bda4")}/>${shine(x - r * 0.35, y - r * 0.2, r * 0.25, r * 0.12, 0)}`).join("")}
      <g transform="translate(0 -2)"><ellipse cx="-3" cy="0" rx="3" ry="4" fill="#a89478"/><circle cx="-6" cy="-6" r="1.4" fill="#a89478"/><circle cx="-2" cy="-7" r="1.4" fill="#a89478"/><circle cx="2" cy="-6" r="1.4" fill="#a89478"/></g>
      ${done >= total ? `<path d="M36 -10L40 -2L48 -1L42 5L44 13L36 9L28 13L30 5L24 -1L32 -2Z" fill="#f3c955" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round" transform="translate(0 -14) scale(.7)"/>` : ""}`;
  }
  function sundial(stamped = false) {
    return `${shadow(2, 36, 26, 5)}${tuft(-24, 36)}
      <rect x="-22" y="32" width="44" height="8" rx="4" fill="#c9bda4" ${ink(3)}/><rect x="-17" y="26" width="34" height="8" rx="4" fill="#e5dcc8" ${ink(3)}/>
      <path d="M-10 8Q-12 18 -10 28H10Q12 18 10 8Z" fill="#fffaf0" ${ink(3)}/><path d="M-4 11V25M3 11V25" ${DL("#e5dcc8")}/>
      <path d="M-14 26Q-20 20 -14 16" ${DL("#4e9677", 2.4)}/><path d="M-14 18Q-22 16 -22 10Q-15 11 -14 18Z" fill="#b7e779" stroke="#4e9677" stroke-width="1.6" stroke-linejoin="round"/>
      <rect x="-16" y="6" width="32" height="7" rx="3.5" fill="#e5dcc8" ${ink(2.4)}/>
      <path d="M-26 2Q-26 10 0 10Q26 10 26 2Z" fill="#e5dcc8" ${ink(3)}/>
      <ellipse cy="2" rx="26" ry="8" fill="#fffaf0" ${ink(3)}/><ellipse cy="2" rx="18" ry="4.5" fill="#96ecff" stroke="#62cdf4" stroke-width="1.6"/>
      ${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<ellipse cx="0" cy="-37" rx="4" ry="6" fill="#ffe49a" stroke="#c69434" stroke-width="1.6" transform="rotate(${a} 0 -18)"/>`).join("")}
      <circle cy="-18" r="15" fill="#f3c955" ${ink(3)}/>${shine(-6, -26, 4, 2)}
      <circle cx="-5" cy="-19" r="2" fill="${INK}"/><circle cx="5" cy="-19" r="2" fill="${INK}"/><circle cx="-9" cy="-14" r="2.4" fill="#ffa798"/><circle cx="9" cy="-14" r="2.4" fill="#ffa798"/>
      <path d="M-5 -13Q0 -9 5 -13" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>
      ${stamped ? `<circle cx="20" cy="-2" r="9" fill="#7fce54" ${ink(3)}/><path d="M16 -2L19 1L24 -5" fill="none" stroke="#fffaf0" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>` : ""}`;
  }
  function flowerBed() {
    return `<rect class="vg-hit" x="-42" y="-44" width="84" height="74" rx="20" fill="#fffaf0" fill-opacity="0"/>${shadow(2, 22, 36, 6)}
      ${bedSoil(36, 8)}
      ${[[-20, "#ffa798", "#ee806f"], [0, "#b49fcf", "#8c74b0"], [20, "#ffe49a", "#c69434"]].map(([x, c, d], i) => `<path d="M${x} 8Q${x - 1} -4 ${x} ${-12 - (i % 2) * 4}" ${DL("#4e9677", 3)}/><path d="M${x} 0Q${x - 10} -2 ${x - 12} -10Q${x - 2} -10 ${x} 0Z" fill="#7fce54" stroke="#4e9677" stroke-width="1.6"/>${bloom(x, -18 - (i % 2) * 4, c, d, 5)}`).join("")}
      ${bedBox(36, 8, 18)}`;
  }

  ns.VillageArt = { backdrop, trail, tree, bush, gate, cottage, yard, friendsBed, toyChest, stall, stones, sundial, flowerBed, shadow, classic: { gate: gateClassic, cottage: cottageClassic, friendsBed: friendsBedClassic, toyChest: toyChestClassic, yard: yardClassic, stones: stonesClassic, sundial: sundialClassic, flowerBed: flowerBedClassic, friendsBedV103, toyChestV103 } };
})(window.MiftahGame || (window.MiftahGame = {}));
