// Generates a tapered limb outline (variable-width stroke around a cubic Bézier
// centerline, with a bulbous round paw cap) as an SVG path. This replaces
// hand-guessed control points with computed offset curves.

function cubic(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return [
    u*u*u*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t*t*t*p3[0],
    u*u*u*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t*t*t*p3[1],
  ];
}
function cubicD(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return [
    3*u*u*(p1[0]-p0[0]) + 6*u*t*(p2[0]-p1[0]) + 3*t*t*(p3[0]-p2[0]),
    3*u*u*(p1[1]-p0[1]) + 6*u*t*(p2[1]-p1[1]) + 3*t*t*(p3[1]-p2[1]),
  ];
}

function limbPath({ p0, p1, p2, p3, width, steps = 48, capR = null }) {
  const left = [], right = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const c = cubic(p0, p1, p2, p3, t);
    const d = cubicD(p0, p1, p2, p3, t);
    const len = Math.hypot(d[0], d[1]) || 1;
    const n = [-d[1]/len, d[0]/len];
    const w = width(t) / 2;
    left.push([c[0] + n[0]*w, c[1] + n[1]*w]);
    right.push([c[0] - n[0]*w, c[1] - n[1]*w]);
  }
  // round paw cap: arc around the endpoint from left edge to right edge,
  // sweeping through the tangent direction
  const cEnd = cubic(p0, p1, p2, p3, 1);
  const dEnd = cubicD(p0, p1, p2, p3, 1);
  const lenE = Math.hypot(dEnd[0], dEnd[1]) || 1;
  const tanA = Math.atan2(dEnd[1]/lenE, dEnd[0]/lenE);
  const r = capR ?? width(1) / 2;
  const cap = [];
  for (let i = 1; i < 14; i++) {
    const a = tanA + Math.PI/2 - (Math.PI * i / 14);
    cap.push([cEnd[0] + r*Math.cos(a), cEnd[1] + r*Math.sin(a)]);
  }
  const pts = [...left, ...cap, ...right.reverse()];
  const f = n => (Math.round(n * 10) / 10).toString();
  return 'M' + pts.map(p => `${f(p[0])} ${f(p[1])}`).join(' L ') + ' Z';
}

// Left arm: shoulder rooted inside the body, curving out and down,
// ending in a slightly bigger paw. Widths: 36 shoulder -> ~29 wrist -> 36 paw.
const width = t => 46 - 14*t + 6*t*t;
const leftArm = limbPath({
  p0: [-84, 104], p1: [-114, 98], p2: [-136, 92], p3: [-152, 84],
  width, capR: 20, steps: 36,
});
console.log('LEFT ARM:\n' + leftArm + '\n');

// Right arm = mirror (negate x). Regenerate rather than transform so the
// path can be pasted standalone.
function mirror(d) {
  return d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (m, x, y) => `${-parseFloat(x)} ${y}`);
}
console.log('RIGHT ARM:\n' + mirror(leftArm));
