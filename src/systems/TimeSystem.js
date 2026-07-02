// Real-time day/night: the island matches the player's actual clock, Animal
// Crossing style — studying at night means lanterns and fireflies. The
// system computes a smooth ambient tint from keyframed times of day and
// draws the ambience layers (tint, lantern glow, fireflies, passing birds)
// over the world but under the HUD.
//
// Dev override: append ?hour=21.5 to the URL, or set game.time.overrideHour
// from the console, to preview any time of day.
(function (ns) {
  // [hour, r, g, b, alpha] — linearly interpolated around the 24h wheel.
  const KEYFRAMES = [
    [0.0, 12, 22, 58, 0.42],   // deep night
    [4.5, 12, 22, 58, 0.42],
    [6.0, 236, 140, 70, 0.16], // dawn glow
    [7.5, 255, 220, 160, 0.0], // clear morning
    [16.5, 255, 220, 160, 0.0],
    [18.0, 244, 130, 60, 0.2], // dusk gold
    [19.5, 40, 34, 80, 0.34],  // twilight
    [21.0, 12, 22, 58, 0.42],  // night
    [24.0, 12, 22, 58, 0.42],
  ];

  class TimeSystem {
    constructor() {
      const param = new URLSearchParams(location.search).get("hour");
      this.overrideHour = param !== null && param !== "" ? Number(param) : null;
      this.fireflies = [];
      this.birds = [];
      this.birdCooldown = 6 + Math.random() * 14;
      this.elapsed = 0;
    }

    hourNow() {
      if (this.overrideHour !== null && !Number.isNaN(this.overrideHour)) {
        return ((this.overrideHour % 24) + 24) % 24;
      }
      const now = new Date();
      return now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
    }

    tint() {
      const h = this.hourNow();
      let a = KEYFRAMES[0];
      let b = KEYFRAMES[KEYFRAMES.length - 1];
      for (let i = 0; i < KEYFRAMES.length - 1; i += 1) {
        if (h >= KEYFRAMES[i][0] && h <= KEYFRAMES[i + 1][0]) {
          a = KEYFRAMES[i];
          b = KEYFRAMES[i + 1];
          break;
        }
      }
      const span = b[0] - a[0] || 1;
      const t = (h - a[0]) / span;
      const mix = (i) => a[i] + (b[i] - a[i]) * t;
      return { r: Math.round(mix(1)), g: Math.round(mix(2)), b: Math.round(mix(3)), a: mix(4) };
    }

    // How "night" it is right now, 0..1 — drives glows, fireflies and sleep.
    nightness() {
      const { a } = this.tint();
      return Math.max(0, Math.min(1, (a - 0.1) / 0.32));
    }

    isNight() {
      return this.nightness() > 0.5;
    }

    update(dt, game) {
      this.elapsed += dt;

      // Fireflies drift near the plaza and lanterns once night settles in.
      const night = this.nightness();
      if (night > 0.25 && this.fireflies.length === 0) {
        const anchors = game.world.props
          .filter((p) => p.assetKey === "props.lantern")
          .map((p) => ({ x: p.x + 24, y: p.y + 20 }));
        anchors.push({ x: 28 * 48, y: 28 * 48 }); // plaza heart
        for (let i = 0; i < 16; i += 1) {
          const anchor = anchors[i % anchors.length];
          this.fireflies.push({
            ax: anchor.x,
            ay: anchor.y,
            r1: 26 + Math.random() * 54,
            r2: 14 + Math.random() * 30,
            s1: 0.3 + Math.random() * 0.5,
            s2: 0.2 + Math.random() * 0.4,
            phase: Math.random() * Math.PI * 2,
            blink: 1.4 + Math.random() * 2.2,
          });
        }
      } else if (night <= 0.25 && this.fireflies.length) {
        this.fireflies = [];
      }

      // A bird crosses the sky now and then during the day.
      this.birdCooldown -= dt;
      if (this.birdCooldown <= 0 && night < 0.4 && this.birds.length < 2) {
        const leftToRight = Math.random() < 0.5;
        this.birds.push({
          x: leftToRight ? game.camera.x - 80 : game.camera.x + game.camera.width + 80,
          y: game.camera.y + 40 + Math.random() * (game.camera.height * 0.45),
          vx: (leftToRight ? 1 : -1) * (90 + Math.random() * 60),
          bob: Math.random() * Math.PI * 2,
          t: 0,
        });
        this.birdCooldown = 14 + Math.random() * 22;
      }
      for (const bird of this.birds) {
        bird.x += bird.vx * dt;
        bird.t += dt;
      }
      this.birds = this.birds.filter(
        (b) => b.x > game.camera.x - 160 && b.x < game.camera.x + game.camera.width + 160,
      );
    }

    // Drawn from Renderer.render after the world pass (screen space),
    // before locked-isle overlays and the HUD so UI stays readable.
    draw(renderer, game) {
      const ctx = renderer.ctx;
      const cam = game.camera;
      const tint = this.tint();
      const night = this.nightness();

      ctx.save();
      ctx.setTransform(renderer.dpr, 0, 0, renderer.dpr, 0, 0);

      // Passing birds (world objects, drawn pre-tint so they dim naturally).
      for (const bird of this.birds) {
        const sx = bird.x - cam.x;
        const sy = bird.y - cam.y + Math.sin(bird.t * 6 + bird.bob) * 6;
        const frame = Math.floor(bird.t * 8) % 2;
        const key = frame === 0 ? "animals.dove.fly.0" : "animals.dove.fly.1";
        const img = game.assets.get(key);
        ctx.save();
        if (bird.vx < 0) {
          ctx.translate(sx + 36, sy);
          ctx.scale(-1, 1);
          ctx.drawImage(img, 0, 0, 36, 36);
        } else {
          ctx.drawImage(img, sx, sy, 36, 36);
        }
        ctx.restore();
      }

      // Ambient tint wash: a multiply pass pulled toward the hour's color
      // gives real depth (dusk goes golden, night goes dark blue) and a thin
      // overlay pass on top adds the atmosphere's cast.
      if (tint.a > 0.004) {
        const strength = Math.min(1, tint.a * 1.5);
        const toward = (c) => Math.round(255 - (255 - c) * strength);
        ctx.globalCompositeOperation = "multiply";
        ctx.fillStyle = `rgb(${toward(tint.r)}, ${toward(tint.g)}, ${toward(tint.b)})`;
        ctx.fillRect(0, 0, cam.width, cam.height);
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = `rgba(${tint.r}, ${tint.g}, ${tint.b}, ${tint.a * 0.3})`;
        ctx.fillRect(0, 0, cam.width, cam.height);
      }

      // Lantern glow + arch glow once dusk falls.
      if (night > 0.05) {
        ctx.globalCompositeOperation = "lighter";
        const glowAt = (wx, wy, radius, strength) => {
          const sx = wx - cam.x;
          const sy = wy - cam.y;
          if (sx < -radius || sy < -radius || sx > cam.width + radius || sy > cam.height + radius) return;
          const grad = ctx.createRadialGradient(sx, sy, 4, sx, sy, radius);
          grad.addColorStop(0, `rgba(255, 196, 96, ${0.34 * strength * night})`);
          grad.addColorStop(0.5, `rgba(255, 160, 60, ${0.14 * strength * night})`);
          grad.addColorStop(1, "rgba(255, 140, 40, 0)");
          ctx.fillStyle = grad;
          ctx.fillRect(sx - radius, sy - radius, radius * 2, radius * 2);
        };
        for (const prop of game.world.activeProps(game.progress)) {
          if (prop.assetKey === "props.lantern") glowAt(prop.x + 24, prop.y + 22, 84, 1);
          if (prop.assetKey === "buildings.readingArch") glowAt(prop.x + 64, prop.y + 64, 120, 0.7);
        }

        // Fireflies: tiny pulsing gold motes drifting around their anchors.
        for (const fly of this.fireflies) {
          const t = this.elapsed;
          const wx = fly.ax + Math.cos(t * fly.s1 + fly.phase) * fly.r1;
          const wy = fly.ay + Math.sin(t * fly.s2 + fly.phase * 1.7) * fly.r2;
          const sx = wx - cam.x;
          const sy = wy - cam.y;
          if (sx < -8 || sy < -8 || sx > cam.width + 8 || sy > cam.height + 8) continue;
          const pulse = 0.35 + 0.65 * Math.abs(Math.sin(t / fly.blink + fly.phase));
          ctx.fillStyle = `rgba(255, 232, 130, ${0.75 * pulse * night})`;
          ctx.beginPath();
          ctx.arc(sx, sy, 1.6 + pulse, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalCompositeOperation = "source-over";
      }

      ctx.restore();
    }
  }

  ns.TimeSystem = TimeSystem;
})(window.MiftahGame || (window.MiftahGame = {}));
