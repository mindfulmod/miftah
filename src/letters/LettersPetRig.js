// Companion animation for the child's pet: gaze, reach, hop, inspect, ponder
// and wave, layered onto the existing pet art through data-rig wrapper groups.
// Presentation only: it never decides answers, scores, rewards or progress,
// and it only ever looks at things the child touched, never at a correct choice.
(function (ns) {
  // Pivots in each pet's own SVG units. Animals share one 420×470 frame.
  const ANIMAL = {
    unit: 1, eye: [210, 186], gaze: [13, 15], head: [210, 292], tilt: 8, shift: 9,
    ground: [210, 420], lean: 3.5, hop: 40,
    ears: { L: [150, 150], R: [270, 150] },
    arms: { L: { at: [154, 282], rest: [170, 345] }, R: { at: [266, 282], rest: [250, 345] } },
  };
  // `style` gives each species its own celebration, wave and idle fidget:
  // Mina double-bounces and twitches an ear, Rafi stomps and sways, Lumi flaps
  // and bobs, the blob squishes and wobbles.
  const SPECIES = {
    mina: { ...ANIMAL, style: 'bounce' },
    rafi: { ...ANIMAL, style: 'stomp', ears: { L: [130, 140], R: [290, 140] },
      arms: { L: { at: [142, 280], rest: [96, 364] }, R: { at: [278, 280], rest: [324, 364] } } },
    lumi: { ...ANIMAL, style: 'flap', eye: [210, 188], gaze: [14, 17], head: [210, 250], tilt: 5, shift: 6, ears: null,
      arms: { L: { at: [112, 205], rest: [70, 300] }, R: { at: [308, 205], rest: [350, 300] } } },
    // Blob pets: the face slides inside the body; there are no arms to reach with.
    blob: { unit: 1 / 3, style: 'squish', eye: [0, -4], blinkY: 0, cssBlink: true, gaze: [3, 3], head: [0, 40], tilt: 0, shift: 3,
      ground: [0, 66], lean: 3, hop: 13, ears: null, arms: null },
  };
  const CHEER_MS = { bounce: 820, stomp: 740, flap: 820, squish: 720 };
  // Celebration keyframes per style: squash `sq`, `hop` (in units of the
  // species hop height), body `lean`, arm angles and ear flare.
  function cheerPose(style, t, still) {
    const g = {};
    if (style === 'bounce') {
      if (t < 120) g.sq = 0.9;
      else if (t < 360) Object.assign(g, { sq: 1.05, hop: 0.85, arms: 38, ear: 14 });
      else if (t < 470) Object.assign(g, { sq: 0.92, arms: 30 });
      else if (t < 680) Object.assign(g, { sq: 1.03, hop: 0.5, arms: 38, ear: 10 });
      else g.sq = 0.95;
    } else if (style === 'stomp') {
      if (t < 200) Object.assign(g, { sq: 1.03, lean: 4 });
      else if (t < 320) Object.assign(g, { sq: 0.86, lean: -2, arms: 20 });
      else if (t < 580) Object.assign(g, { sq: 1.04, hop: 0.45, arms: still ? 30 : 30 + 14 * Math.sin(t / 50) });
      else g.sq = 0.92;
    } else if (style === 'flap') {
      if (t < 150) g.sq = 0.9;
      else if (t < 650) Object.assign(g, { sq: 1.05, hop: 1.1, arms: still ? 40 : 30 + 28 * Math.sin(t / 45) });
      else g.sq = 0.94;
    } else {
      if (t < 200) g.sq = 0.82;
      else if (t < 420) Object.assign(g, { sq: 1.1, hop: 1 });
      else if (t < 560) g.sq = 0.85;
      else g.sq = 1.04;
    }
    return g;
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const deg = r => r * 180 / Math.PI;
  const wrap = a => ((a + 540) % 360) - 180;

  function attach(host, { reducedMotion = () => false } = {}) {
    if (!host) return null;
    let svg = null, P = {}, cfg = SPECIES.blob, alive = true, frame = null, nap = null, last = 0;
    const sp = (x = 0) => ({ x, v: 0 });
    const S = { lx: sp(), ly: sp(), head: sp(), hx: sp(), hy: sp(), lean: sp(), hop: sp(), sq: sp(1),
      earL: sp(), earR: sp(), armL: sp(), armR: sp(), reachL: sp(), reachR: sp(), brow: sp(), browTilt: sp(), o: sp() };
    let walking = null, look = null, reach = null, act = null, wander = null, wanderAt = 0, blinkAt = 0, fidgetAt = 0, inited = false;

    function bind() {
      const next = host.querySelector('svg');
      if (next === svg) return !!svg;
      svg = next; P = {};
      if (!svg) return false;
      svg.querySelectorAll('[data-rig]').forEach(el => { (P[el.dataset.rig] ||= []).push(el); });
      cfg = SPECIES[svg.dataset.rigSpecies] || SPECIES.blob;
      if (!inited) { S.lx.x = cfg.eye[0]; S.ly.x = cfg.eye[1] + 600 * cfg.unit; inited = true; }
      return true;
    }
    const toSvg = (x, y) => {
      const m = svg?.getScreenCTM?.();
      if (!m) return null;
      const p = new DOMPoint(x, y).matrixTransform(m.inverse());
      return [p.x, p.y];
    };
    function resolve(target) {
      if (!target) return null;
      if (typeof target === 'function') target = target();
      if (!target) return null;
      if (target.getBoundingClientRect) {
        if (!target.isConnected) return null;
        const r = target.getBoundingClientRect();
        if (!r.width && !r.height) return null;
        return toSvg(r.left + r.width / 2, r.top + r.height / 2);
      }
      return Number.isFinite(target.x) ? toSvg(target.x, target.y) : null;
    }
    const step = (s, goal, k, d, dt, snap) => {
      if (snap) { s.x = goal; s.v = 0; return; }
      s.v += (k * (goal - s.x) - d * s.v) * dt; s.x += s.v * dt;
    };
    const set = (name, value) => P[name]?.forEach(el => el.setAttribute('transform', value));

    function tick(now) {
      frame = null;
      if (!alive) return;
      if (!host.isConnected) return destroy();
      if (!bind()) { frame = requestAnimationFrame(tick); return; }
      // A pet that is scrolled away, hidden or zero-sized naps instead of animating.
      if (!onScreen()) { last = 0; nap = setTimeout(() => { nap = null; kick(); }, 400); return; }
      const still = !!reducedMotion();
      const dt = Math.min(0.033, Math.max(0, (now - (last || now)) / 1000)); last = now;
      const u = cfg.unit, [ex, ey] = cfg.eye;
      if (act && act.ms == null) act.ms = CHEER_MS[cfg.style] || 700;
      const t = act ? now - act.t0 : 0;
      if (act && t > act.ms) { const done = act.done; act = null; done?.(); }
      const g = { head: null, hy: 0, lean: null, hop: 0, sq: 1, armL: 0, armR: 0, brow: 0, browTilt: 0, o: 0, ear: 0, reach: null, reachBoth: 0 };

      // Where to look: an action's target, the held object, or a calm glance.
      let tgt = null;
      if (act?.at) tgt = resolve(act.at);
      if (!tgt && look) { tgt = resolve(look); if (tgt) { g.o = 1; g.brow = -6; } }
      if (!tgt) {
        if (!wander || now > wanderAt) {
          const r = Math.random();
          wander = r < 0.7 ? [ex, ey + 600 * u] : [ex + (r < 0.85 ? -1 : 1) * 260 * u, ey - 40 * u];
          wanderAt = now + 2200 + Math.random() * 1800;
        }
        tgt = wander;
      }
      if (reach) { const r = resolve(reach); if (r) g.reach = r; }

      if (act?.kind === 'cheer') {
        const c = cheerPose(cfg.style, t, still);
        g.sq = c.sq ?? 1; g.hop = -(c.hop || 0) * cfg.hop; g.armL = c.arms || 0; g.armR = -(c.arms || 0); g.ear = c.ear || 0;
        if (c.lean != null) g.lean = c.lean;
        g.o = 0;
      } else if (act?.kind === 'wake') {
        // Eyes open slowly, a stretch, then a look at the child.
        g.sq = t < 500 ? 0.94 : t < 800 ? 1.05 : 1; g.armL = t > 450 && t < 900 ? 30 : 0; g.armR = -g.armL;
        tgt = [ex, ey + 600 * u];
      } else if (act?.kind === 'inspect') {
        g.hy = 12 * u; g.reachBoth = 0.6; g.reach = tgt; g.brow = -8;
      } else if (act?.kind === 'ponder') {
        g.head = -cfg.tilt; g.browTilt = 1; g.ear = -10; tgt = [ex - 160 * u, ey - 220 * u];
      } else if (act?.kind === 'wave') {
        const swing = still ? 0 : Math.sin(t / 70);
        if (cfg.style === 'flap') { g.armL = 35 + 25 * swing; g.armR = -g.armL; }
        else if (!cfg.arms) g.lean = cfg.lean * 1.4 * swing;
        else g.armR = -105 + 20 * swing;
        g.hy = -4 * u; tgt = [ex, ey + 600 * u];
      } else if (walking && !act) {
        // Travel gait per species; the pet looks where it is going.
        const ph = now / ({ bounce: 300, stomp: 340, flap: 220, squish: 280 }[cfg.style] || 300), s = Math.abs(Math.sin(ph * Math.PI));
        tgt = [ex + walking.dir * 300 * u, ey + 200 * u];
        if (!still) {
          if (cfg.style === 'stomp') { g.lean = 3 * Math.sin(ph * Math.PI); g.hop = -s * 0.12 * cfg.hop; g.sq = 1 - (1 - s) * 0.05; }
          else if (cfg.style === 'flap') { g.hop = -(0.3 + 0.1 * s) * cfg.hop; g.armL = 30 + 25 * Math.sin(ph * 2 * Math.PI); g.armR = -g.armL; g.lean = walking.dir * 2; }
          else if (cfg.style === 'squish') { g.sq = 0.92 + 0.12 * s; g.hop = -s * 0.2 * cfg.hop; g.lean = walking.dir * 2; }
          else { g.hop = -s * 0.35 * cfg.hop; g.sq = 1 + (s - 0.5) * 0.06; g.lean = walking.dir * 2; }
        }
      } else if (!act && !look && !still) {
        // Idle fidgets every few seconds keep the pet alive between moments.
        if (!fidgetAt) fidgetAt = now + 5000 + Math.random() * 4000;
        const f = now - fidgetAt;
        if (f > 600) fidgetAt = now + 6000 + Math.random() * 4000;
        else if (f > 0) {
          const pulse = Math.sin(f / 600 * Math.PI);
          if (cfg.style === 'bounce') g.ear = 12 * pulse;
          else if (cfg.style === 'flap') g.hy = -6 * u * pulse;
          else if (cfg.style === 'stomp') g.lean = 2.5 * Math.sin(f / 600 * Math.PI * 2);
          else g.sq = 1 - 0.05 * Math.sin(f / 600 * Math.PI * 3);
        }
      }

      const dx = tgt[0] - ex, dy = tgt[1] - ey;
      if (g.head == null) g.head = clamp(dx * 0.025 / u, -cfg.tilt, cfg.tilt);
      if (g.lean == null) g.lean = still ? 0 : clamp(dx * 0.012 / u, -cfg.lean, cfg.lean);
      if (act?.kind === 'inspect') g.lean = still ? 0 : clamp(dx * 0.03 / u, -cfg.lean * 1.6, cfg.lean * 1.6);
      const hx = clamp(dx * 0.035, -cfg.shift, cfg.shift);
      const hy = g.hy + clamp(dy * 0.018, -4 * u, 7 * u);

      // Arms: rotate each limb from its shoulder toward the reach target.
      for (const side of ['L', 'R']) {
        const arm = cfg.arms?.[side];
        let goal = g['arm' + side], push = 0;
        if (arm && g.reach && (g.reachBoth || (side === 'L' ? g.reach[0] < ex : g.reach[0] >= ex))) {
          const rest = Math.atan2(arm.rest[1] - arm.at[1], arm.rest[0] - arm.at[0]);
          const want = Math.atan2(g.reach[1] - arm.at[1], g.reach[0] - arm.at[0]);
          goal = clamp(wrap(deg(want - rest)), -75, 75) * (g.reachBoth || 0.85);
          push = 10;
        }
        step(S['arm' + side], goal, 170, 19, dt, still);
        step(S['reach' + side], push, 170, 19, dt, still);
      }
      step(S.lx, tgt[0], 320, 34, dt, still); step(S.ly, tgt[1], 320, 34, dt, still);
      step(S.head, g.head, 120, 15, dt, still); step(S.hx, hx, 120, 15, dt, still); step(S.hy, hy, 120, 15, dt, still);
      step(S.lean, g.lean, 70, 13, dt, still);
      step(S.hop, still ? 0 : g.hop, 260, 22, dt, still); step(S.sq, still ? 1 : g.sq, 320, 17, dt, still);
      step(S.earL, g.ear - S.head.x * 0.8 + S.hop.v * 0.02, 95, 7, dt, still);
      step(S.earR, -g.ear - S.head.x * 0.8 - S.hop.v * 0.02, 80, 6.5, dt, still);
      step(S.brow, g.brow, 200, 20, dt, still); step(S.browTilt, g.browTilt, 200, 20, dt, still);
      step(S.o, g.o, 260, 24, dt, still);

      // Apply. Every target is a dedicated wrapper, so existing CSS poses still work.
      const [gx, gy] = cfg.ground, sy = S.sq.x, sx = 1 + (1 - sy) * 0.8;
      const breathe = still || cfg === SPECIES.blob ? 1 : 1 + Math.sin(now / 600) * 0.01;
      set('root', `translate(0 ${S.hop.x.toFixed(2)}) rotate(${S.lean.x.toFixed(2)} ${gx} ${gy}) translate(${gx} ${gy}) scale(${(sx * (2 - breathe)).toFixed(4)} ${(sy * breathe).toFixed(4)}) translate(${-gx} ${-gy})`);
      const [px, py] = cfg.head;
      set('head', `translate(${S.hx.x.toFixed(2)} ${S.hy.x.toFixed(2)}) rotate(${S.head.x.toFixed(2)} ${px} ${py})`);
      if (cfg.ears) {
        set('earL', `rotate(${S.earL.x.toFixed(2)} ${cfg.ears.L[0]} ${cfg.ears.L[1]})`);
        set('earR', `rotate(${S.earR.x.toFixed(2)} ${cfg.ears.R[0]} ${cfg.ears.R[1]})`);
      }
      for (const side of ['L', 'R']) {
        const arm = cfg.arms?.[side];
        if (!arm) continue;
        const a = S['arm' + side].x, rad = Math.atan2(arm.rest[1] - arm.at[1], arm.rest[0] - arm.at[0]) + a * Math.PI / 180;
        const push = S['reach' + side].x;
        set('arm' + side, `translate(${(Math.cos(rad) * push).toFixed(2)} ${(Math.sin(rad) * push).toFixed(2)}) rotate(${a.toFixed(2)} ${arm.at[0]} ${arm.at[1]})`);
      }
      const lx = S.lx.x - (ex + S.hx.x), ly = S.ly.x - (ey + S.hy.x), dist = Math.hypot(lx, ly) || 1, k = Math.min(1, dist / (220 * u));
      set('gaze', `translate(${(lx / dist * k * cfg.gaze[0]).toFixed(2)} ${(ly / dist * k * cfg.gaze[1]).toFixed(2)})`);
      let blink = 1;
      if (act?.kind === 'wake') blink = t < 350 ? 0.08 : Math.min(1, 0.08 + (t - 350) / 220 * 0.92);
      else if (!still && !act && !cfg.cssBlink) {
        if (!blinkAt || now > blinkAt + 140) blinkAt = now + 2600 + Math.random() * 2600;
        else if (now > blinkAt) blink = Math.max(0.08, Math.abs(now - blinkAt - 70) / 70);
      }
      const by = cfg.blinkY ?? ey;
      set('blink', `translate(0 ${by}) scale(1 ${blink.toFixed(3)}) translate(0 ${-by})`);
      set('browL', `translate(0 ${(S.brow.x - S.browTilt.x * 8).toFixed(2)}) rotate(${(-S.browTilt.x * 8).toFixed(2)} 162 130)`);
      set('browR', `translate(0 ${(S.brow.x + S.browTilt.x * 3).toFixed(2)})`);
      if (P.mouthO) {
        const o = clamp(S.o.x, 0, 1);
        set('mouth', `translate(210 247) scale(1 ${Math.max(0.05, 1 - o).toFixed(3)}) translate(-210 -247)`);
        P.mouthO.forEach(el => el.setAttribute('opacity', o.toFixed(2)));
      }
      frame = requestAnimationFrame(tick);
    }

    function onScreen() {
      const r = host.getBoundingClientRect?.();
      if (!r) return true;
      const w = globalThis.innerWidth ?? Infinity, h = globalThis.innerHeight ?? Infinity;
      return r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0 && r.top < h && r.left < w;
    }
    function start(kind, ms, at = null, done = null) {
      act = { kind, ms, at, done, t0: performance.now() };
      kick();
    }
    function kick() { if (alive && frame == null && nap == null) frame = requestAnimationFrame(tick); }
    function destroy() {
      alive = false;
      if (frame != null) cancelAnimationFrame(frame);
      clearTimeout(nap);
      frame = nap = null; act = null; look = reach = null;
    }
    kick();
    return {
      // Follow something the child is holding or has just touched.
      watch(target) { look = target || null; if (!target) reach = null; kick(); },
      reach(target) { reach = target || null; kick(); },
      settle() { look = reach = null; },
      // Each action may chain a follow-up once it settles (cheer, then inspect).
      cheer(next) { look = reach = null; start('cheer', null, null, next); },
      wake(next) { look = reach = null; start('wake', 1100, null, next); },
      inspect(target, ms = 1500, next) { look = reach = null; start('inspect', ms, target, next); },
      ponder(next) { look = reach = null; start('ponder', 1100, null, next); },
      wave(next) { start('wave', 900, null, next); },
      // Walking gait toward dir (-1 left, 1 right); walk(0) stops.
      walk(dir) { walking = dir ? { dir: Math.sign(dir) } : null; kick(); },
      get alive() { return alive && host.isConnected; },
      destroy,
    };
  }

  ns.LettersPetRig = { attach, SPECIES };
})(window.MiftahGame || (window.MiftahGame = {}));
