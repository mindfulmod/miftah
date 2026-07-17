"use strict";

(() => {
const THREE = window.THREE;

/* GPU point-cloud prototype for the Miftah encounter ship. */

let active = null;

const VERTEX_SHADER = `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uImpact;
  uniform float uGather;
  uniform float uMotion;
  attribute float aSize;
  attribute float aSeed;
  attribute float aKind;
  attribute vec3 aScatter;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec3 p = position;
    float wave = sin(uTime * 1.45 + aSeed * 9.0 + p.x * 2.1);
    float wake = step(0.5, aKind);
    p.y += wave * mix(0.018, 0.055, wake) * uMotion;
    p.x -= wake * fract(uTime * 0.045 + aSeed) * 0.62 * uMotion;
    float scatterEnvelope = uImpact * (0.35 + 0.65 * sin(aSeed * 12.0 + uTime * 4.0));
    p += aScatter * scatterEnvelope * 1.8;
    p.xy *= 1.0 + uGather * (0.035 + 0.025 * sin(uTime * 3.0 + aSeed * 8.0));
    p.x += uGather * 0.16;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio * (1.0 + 0.12 * wave * uMotion + uGather * 0.46);
    vColor = color;
    vAlpha = min(1.0, mix(0.48, 0.96, fract(aSeed * 17.31)) * mix(1.0, 0.68, wake) + uGather * 0.28);
  }
`;

const FRAGMENT_SHADER = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 q = gl_PointCoord - vec2(0.5);
    float d = length(q);
    if (d > 0.5) discard;
    float core = smoothstep(0.5, 0.05, d);
    float halo = smoothstep(0.5, 0.22, d) * 0.42;
    gl_FragColor = vec4(vColor * (1.0 + core * 0.7), (core + halo) * vAlpha);
  }
`;

function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = seed + 0x6d2b79f5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function mixColor(a, b, t) {
  return new THREE.Color(a).lerp(new THREE.Color(b), t);
}

function cylinderBetween(a, b, radius, material, radialSegments = 7) {
  const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
  const direction = new THREE.Vector3().subVectors(end, start);
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, direction.length(), radialSegments),
    material
  );
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return mesh;
}

// The particles now wrap a restrained architectural core. This makes the
// silhouette read as a complete lateen vessel before the viewer notices the
// star-field treatment.
function buildMiftahCore() {
  const group = new THREE.Group();
  const hullMaterial = new THREE.MeshStandardMaterial({ color: 0x28234f, emissive: 0x100d25, roughness: 0.64, metalness: 0.08 });
  const insetMaterial = new THREE.MeshStandardMaterial({ color: 0x4b427f, emissive: 0x181335, roughness: 0.58 });
  const timberMaterial = new THREE.MeshStandardMaterial({ color: 0x9a7540, emissive: 0x2b1c0a, roughness: 0.7 });
  const goldMaterial = new THREE.MeshStandardMaterial({ color: 0xe3b75f, emissive: 0x5a3510, roughness: 0.42, metalness: 0.22 });
  const sailMaterial = new THREE.MeshStandardMaterial({
    color: 0xead9ae, emissive: 0x302510, roughness: 0.9,
    transparent: true, opacity: 0.74, side: THREE.DoubleSide, depthWrite: false,
  });

  const hullShape = new THREE.Shape();
  hullShape.moveTo(-1.48, -0.13);
  hullShape.lineTo(-1.2, -0.59);
  hullShape.quadraticCurveTo(0.05, -0.86, 1.35, -0.47);
  hullShape.quadraticCurveTo(1.57, -0.3, 1.53, 0.02);
  hullShape.quadraticCurveTo(0.15, -0.19, -1.48, -0.13);
  const hull = new THREE.Mesh(new THREE.ExtrudeGeometry(hullShape, {
    depth: 0.34, bevelEnabled: true, bevelSegments: 2, steps: 1,
    bevelSize: 0.035, bevelThickness: 0.035,
  }), hullMaterial);
  hull.position.z = -0.17;
  group.add(hull);

  const sheer = new THREE.Mesh(new THREE.BoxGeometry(2.63, 0.075, 0.43), goldMaterial);
  sheer.position.set(0.05, -0.13, 0.01);
  sheer.rotation.z = 0.025;
  group.add(sheer);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(2.32, 0.085, 0.34), insetMaterial);
  deck.position.set(-0.05, -0.05, 0);
  group.add(deck);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.24, 0.34), insetMaterial);
  cabin.position.set(-0.93, 0.08, -0.01);
  group.add(cabin);
  const cabinRoof = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.055, 0.42), goldMaterial);
  cabinRoof.position.set(-0.93, 0.23, -0.01);
  group.add(cabinRoof);

  group.add(cylinderBetween([-0.18, -0.2, 0.02], [-0.18, 1.53, 0.02], 0.027, timberMaterial));
  group.add(cylinderBetween([-0.22, 1.43, 0.03], [1.27, 0.34, 0.03], 0.021, timberMaterial));

  const makeSail = (points) => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(points.flat(), 3));
    geometry.computeVertexNormals();
    return new THREE.Mesh(geometry, sailMaterial);
  };
  group.add(makeSail([[-0.12, 0.08, 0.015], [-0.12, 1.4, 0.015], [1.18, 0.31, 0.015]]));
  group.add(makeSail([[-0.23, 0.12, -0.015], [-0.2, 1.17, -0.015], [-0.78, 0.34, -0.015]]));

  const rigMaterial = new THREE.LineBasicMaterial({ color: 0xd8c99d, transparent: true, opacity: 0.56 });
  const rig = (a, b) => {
    const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a), new THREE.Vector3(...b)]);
    group.add(new THREE.Line(geometry, rigMaterial));
  };
  rig([-1.36, -0.02, 0.04], [-0.18, 1.49, 0.04]);
  rig([1.43, 0.0, 0.04], [-0.18, 1.49, 0.04]);
  rig([-0.14, 0.15, 0.045], [1.16, 0.31, 0.045]);

  for (const x of [-1.18, -0.82, 0.58, 0.95, 1.28]) {
    group.add(cylinderBetween([x, -0.1, 0.12], [x, 0.08 + (x > 1 ? 0.08 : 0), 0.12], 0.012, goldMaterial, 5));
  }
  group.add(cylinderBetween([-1.2, 0.07, 0.12], [1.32, 0.16, 0.12], 0.012, goldMaterial, 5));

  const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.075, 9, 7), new THREE.MeshBasicMaterial({ color: 0xffd56e }));
  lantern.position.set(-1.18, 0.02, 0.19);
  group.add(lantern);
  const lanternGlow = new THREE.PointLight(0xffc65a, 0.8, 1.2);
  lanternGlow.position.copy(lantern.position);
  group.add(lanternGlow);
  return group;
}

function buildMiftahGeometry(count) {
  const rand = mulberry32(0x4d494654);
  const positions = [], colors = [], sizes = [], seeds = [], kinds = [], scatters = [];
  const add = (x, y, z, colorA, colorB = colorA, size = 2.1, kind = 0) => {
    const c = mixColor(colorA, colorB, rand());
    positions.push(x, y, z);
    colors.push(c.r, c.g, c.b);
    sizes.push(size * (0.72 + rand() * 0.7));
    const seed = rand();
    seeds.push(seed);
    kinds.push(kind);
    const angle = rand() * Math.PI * 2;
    const force = 0.08 + rand() * 0.22;
    scatters.push(Math.cos(angle) * force, (rand() - 0.25) * force, (rand() - 0.5) * force);
  };
  const line = (a, b, n, ca, cb, size, spread = 0.012) => {
    for (let i = 0; i < n; i++) {
      const t = n <= 1 ? 0 : i / (n - 1);
      add(a[0] + (b[0] - a[0]) * t + (rand() - 0.5) * spread,
        a[1] + (b[1] - a[1]) * t + (rand() - 0.5) * spread,
        a[2] + (b[2] - a[2]) * t + (rand() - 0.5) * spread, ca, cb, size);
    }
  };
  const triangle = (a, b, c, n, ca, cb, size) => {
    for (let i = 0; i < n; i++) {
      let u = rand(), v = rand();
      if (u + v > 1) { u = 1 - u; v = 1 - v; }
      const w = 1 - u - v;
      add(a[0] * w + b[0] * u + c[0] * v,
        a[1] * w + b[1] * u + c[1] * v,
        a[2] * w + b[2] * u + c[2] * v + (rand() - 0.5) * 0.055,
        ca, cb, size);
    }
  };

  for (let i = 0; i < Math.round(count * 0.33); i++) {
    const x = -1.42 + rand() * 2.84;
    const edge = Math.pow(Math.abs(x) / 1.42, 1.55);
    const bow = Math.pow(Math.max(0, x / 1.42), 5);
    const top = -0.14 + edge * 0.05 + bow * 0.18;
    const bottom = -0.72 + edge * 0.36 + bow * 0.06;
    const y = bottom + rand() * Math.max(0.04, top - bottom);
    const rim = rand() < 0.22;
    add(x, rim ? top + (rand() - 0.5) * 0.025 : y, (rand() - 0.5) * 0.22,
      rim ? 0xe3b75f : 0x4f4a91, rim ? 0xffe6a3 : 0x8f7bd8, rim ? 2.45 : 2.0);
  }

  triangle([-0.16, 0.02, 0], [-0.12, 1.42, 0], [1.18, 0.32, 0],
    Math.round(count * 0.31), 0xfff2cd, 0xe3b75f, 2.15);
  triangle([-0.22, 0.12, -0.02], [-0.18, 1.18, -0.02], [-0.78, 0.36, -0.02],
    Math.round(count * 0.08), 0xd8c494, 0x9f7d4c, 1.9);
  line([-0.18, -0.27, 0.04], [-0.18, 1.52, 0.04], Math.round(count * 0.055), 0xe3b75f, 0xffe6a3, 2.35, 0.02);
  line([-0.2, 1.43, 0.05], [1.25, 0.36, 0.05], Math.round(count * 0.045), 0xe3b75f, 0xfff1c7, 2.05, 0.018);
  line([-1.46, -0.18, 0.02], [1.43, -0.11, 0.02], Math.round(count * 0.04), 0xe3b75f, 0x5fd6c0, 1.75, 0.016);
  line([-1.36, -0.03, 0.08], [-0.18, 1.49, 0.08], Math.round(count * 0.022), 0xd8c99d, 0xfff1c7, 1.45, 0.008);
  line([1.43, 0.01, 0.08], [-0.18, 1.49, 0.08], Math.round(count * 0.022), 0xd8c99d, 0xfff1c7, 1.45, 0.008);

  for (let i = 0; i < Math.round(count * 0.055); i++) {
    const x = -1.18 + rand() * 0.52;
    const y = -0.01 + rand() * 0.27;
    add(x, y, (rand() - 0.5) * 0.3, 0x4f4a91, 0xe3b75f, 1.75);
  }

  for (let i = 0; i < Math.round(count * 0.11); i++) {
    const x = -1.75 + rand() * 3.35;
    const band = i % 3;
    const y = -0.78 - band * 0.105 + Math.sin(x * 3.1 + band) * 0.035 + (rand() - 0.5) * 0.035;
    add(x, y, -0.12 + rand() * 0.08, 0x3fd6c0, 0x9ff2e4, 1.75, 1);
  }

  for (let i = 0; i < Math.max(34, Math.round(count * 0.025)); i++) {
    const a = rand() * Math.PI * 2, r = Math.sqrt(rand()) * 0.12;
    add(-1.08 + Math.cos(a) * r, -0.14 + Math.sin(a) * r, 0.12 + (rand() - 0.5) * 0.08,
      0xffd56e, 0xffffff, 2.7);
  }
  for (let i = 0; i < Math.max(18, Math.round(count * 0.015)); i++) {
    const a = rand() * Math.PI * 2, r = Math.sqrt(rand()) * 0.075;
    add(-0.18 + Math.cos(a) * r, 1.52 + Math.sin(a) * r, 0.04, 0xffe6a3, 0xffffff, 2.35);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute("aSize", new THREE.Float32BufferAttribute(sizes, 1));
  geometry.setAttribute("aSeed", new THREE.Float32BufferAttribute(seeds, 1));
  geometry.setAttribute("aKind", new THREE.Float32BufferAttribute(kinds, 1));
  geometry.setAttribute("aScatter", new THREE.Float32BufferAttribute(scatters, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

class ParticleShip {
  constructor(host) {
    this.host = host;
    this.reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = innerWidth < 560 || (navigator.deviceMemory && navigator.deviceMemory <= 4);
    this.count = this.reducedMotion ? 760 : mobile ? 1350 : 2300;
    this.scene = new THREE.Scene();
    this.scene.add(new THREE.AmbientLight(0x8da7d8, 1.25));
    const keyLight = new THREE.DirectionalLight(0xffe3a3, 1.55);
    keyLight.position.set(-2, 3, 5);
    this.scene.add(keyLight);
    this.camera = new THREE.OrthographicCamera(-2.05, 2.05, 1.45, -1.45, 0.1, 20);
    this.camera.position.set(0, 0.12, 5);
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "high-performance" });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.45 : 1.8));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.className = "particle-ship-canvas";
    this.renderer.domElement.setAttribute("aria-hidden", "true");
    host.appendChild(this.renderer.domElement);
    this.uniforms = {
      uTime: { value: 0 },
      uPixelRatio: { value: this.renderer.getPixelRatio() },
      uImpact: { value: 0 },
      uGather: { value: 0 },
      uMotion: { value: this.reducedMotion ? 0 : 1 },
    };
    this.geometry = buildMiftahGeometry(this.count);
    host.dataset.particleRenderer = "webgl";
    host.dataset.particleCount = String(this.geometry.getAttribute("position").count);
    host.dataset.reducedMotion = String(this.reducedMotion);
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms, vertexShader: VERTEX_SHADER, fragmentShader: FRAGMENT_SHADER,
      vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(this.geometry, this.material);
    this.ship = buildMiftahCore();
    this.ship.add(this.points);
    this.ship.rotation.set(-0.045, -0.13, -0.025);
    this.scene.add(this.ship);
    this.clock = new THREE.Clock();
    this.running = true;
    this.impactUntil = 0;
    this.gatherUntil = 0;
    this.resize = this.resize.bind(this);
    this.frame = this.frame.bind(this);
    this.visibility = () => { this.running = !document.hidden; if (this.running) this.frame(); };
    this.observer = new ResizeObserver(this.resize);
    this.observer.observe(host);
    document.addEventListener("visibilitychange", this.visibility);
    this.resize();
    host.closest(".enemy-stage")?.classList.add("particle-ship-ready");
    this.frame();
  }

  resize() {
    const width = Math.max(1, this.host.clientWidth), height = Math.max(1, this.host.clientHeight);
    this.renderer.setSize(width, height, false);
    const aspect = width / height;
    this.camera.left = -1.7 * aspect;
    this.camera.right = 1.7 * aspect;
    this.camera.top = 1.7;
    this.camera.bottom = -1.7;
    this.camera.updateProjectionMatrix();
  }

  frame() {
    if (!this.running || this.disposed) return;
    const elapsed = this.clock.getElapsedTime(), now = performance.now();
    this.uniforms.uTime.value = elapsed;
    const impactLeft = Math.max(0, this.impactUntil - now);
    this.uniforms.uImpact.value = impactLeft ? Math.sin((1 - impactLeft / 900) * Math.PI) : 0;
    const gatherLeft = Math.max(0, this.gatherUntil - now);
    this.uniforms.uGather.value = gatherLeft ? Math.sin((1 - gatherLeft / 1050) * Math.PI) : 0;
    if (!this.reducedMotion) {
      this.ship.rotation.z = -0.025 + Math.sin(elapsed * 0.75) * 0.009;
      this.ship.position.y = Math.sin(elapsed * 1.05) * 0.018;
    }
    this.renderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame(this.frame);
  }

  strike() { this.gatherUntil = performance.now() + 1050; }
  damage() { if (!this.reducedMotion) this.impactUntil = performance.now() + 900; }
  victory() { this.gatherUntil = performance.now() + 1050; }
  dispose() {
    this.disposed = true;
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.observer?.disconnect();
    document.removeEventListener("visibilitychange", this.visibility);
    this.geometry?.dispose();
    this.material?.dispose();
    this.ship?.traverse((object) => {
      if (object === this.points) return;
      object.geometry?.dispose?.();
      if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose?.());
      else object.material?.dispose?.();
    });
    this.renderer?.dispose();
    this.renderer?.domElement.remove();
    this.host?.closest(".enemy-stage")?.classList.remove("particle-ship-ready");
  }
}

function mountShip(host, options = {}) {
  destroy();
  if (!host || options.vessel !== "miftah") return false;
  try {
    active = new ParticleShip(host);
    return true;
  } catch (error) {
    console.warn("Particle ship unavailable; using SVG fallback.", error);
    active?.dispose();
    active = null;
    return false;
  }
}

function strike() { active?.strike(); }
function damage() { active?.damage(); }
function victory() { active?.victory(); }
function destroy() { active?.dispose(); active = null; }
function debugInfo() {
  return active ? {
    mounted: true,
    particles: active.geometry.getAttribute("position").count,
    reducedMotion: active.reducedMotion,
    renderer: active.renderer.info.render,
  } : { mounted: false };
}

window.SN = window.SN || {};
window.SN.particles = { mountShip, strike, damage, victory, destroy, debugInfo };
window.SN.particlesReady = Promise.resolve(window.SN.particles);
})();
