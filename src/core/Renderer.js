(function (ns) {
  // Props that sway in the breeze (base-anchored top lean).
  const SWAYING_PROPS = new Set([
    "props.palm", "props.datePalm", "props.tree", "props.orangeTree",
    "props.doveNestingTree", "props.elephantGrove", "props.camelSpring",
    "props.crowOrchard", "props.reeds", "props.bush",
  ]);

  class Renderer {
    constructor(canvas, assets) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.assets = assets;
      this.dpr = 1;
    }

    resize() {
      this.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      const width = Math.floor(window.innerWidth);
      const height = Math.floor(window.innerHeight);
      this.canvas.width = Math.floor(width * this.dpr);
      this.canvas.height = Math.floor(height * this.dpr);
      this.canvas.style.width = `${width}px`;
      this.canvas.style.height = `${height}px`;
      this.ctx.imageSmoothingEnabled = false;
      return { width, height };
    }

    begin(camera) {
      const ctx = this.ctx;
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, this.canvas.width / this.dpr, this.canvas.height / this.dpr);
      ctx.save();
      ctx.translate(-Math.round(camera.x), -Math.round(camera.y));
    }

    end() {
      this.ctx.restore();
    }

    drawImage(key, x, y, w, h) {
      const image = this.assets.get(key);
      const dw = w || image.width;
      const dh = h || image.height;
      this.ctx.drawImage(image, Math.round(x), Math.round(y), Math.round(dw), Math.round(dh));
    }

    // Draw a sprite with a lift (bob) and squash/stretch anchored at its feet
    // (bottom-centre), plus an optional soft contact shadow that stays on the
    // ground while the sprite lifts — so nothing looks like it's floating and
    // flyers read as hovering above their shadow. opts: { bob, sx, sy, shadow }.
    drawSprite(key, x, y, w, h, opts = {}) {
      const bob = opts.bob || 0;
      const sx = opts.sx || 1;
      const sy = opts.sy || 1;
      const ctx = this.ctx;
      if (opts.shadow) {
        // Feet sit a little above the sprite box's bottom (contain-fit padding);
        // the shadow shrinks and fades as the sprite bobs higher.
        const fx = x + w / 2;
        const fy = y + h - (opts.footInset != null ? opts.footInset : h * 0.08);
        const lift = Math.max(0, bob);
        const rx = w * (opts.shadowScale || 0.3) * (1 - Math.min(0.4, lift / 40));
        ctx.save();
        ctx.fillStyle = `rgba(28, 22, 12, ${0.3 * (1 - Math.min(0.5, lift / 30))})`;
        ctx.beginPath();
        ctx.ellipse(Math.round(fx), Math.round(fy), Math.max(2, rx), Math.max(1, rx * 0.4), 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      if (!bob && sx === 1 && sy === 1) {
        this.drawImage(key, x, y, w, h);
        return;
      }
      const image = this.assets.get(key);
      ctx.save();
      ctx.translate(Math.round(x + w / 2), Math.round(y + h - bob));
      ctx.scale(sx, sy);
      ctx.drawImage(image, Math.round(-w / 2), Math.round(-h), Math.round(w), Math.round(h));
      ctx.restore();
    }

    // Locked isles get a soft dark tint plus a plaque naming the isle. When
    // the active egg belongs to that isle the plaque switches to a "stirring"
    // tease (preview state). The bridge gate (a real collider) is what
    // actually blocks entry.
    drawLockedIslandOverlays(game, camera) {
      const islands = game.world.islands;
      if (!islands || !game.progress) return;
      const ctx = this.ctx;
      ctx.save();
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      const cx = Math.round(camera.x);
      const cy = Math.round(camera.y);
      for (const isle of islands) {
        const state = game.world.islandState(isle.id, game.progress);
        if (state === "open") continue;
        const b = isle.bounds;
        ctx.fillStyle = state === "preview" ? "rgba(40, 26, 60, 0.20)" : "rgba(12, 22, 34, 0.30)";
        ctx.fillRect(b.x - cx, b.y - cy, b.w, b.h);
        this.drawIslePlaque(ctx, isle, state, b, cx, cy);
      }
      ctx.restore();
    }

    drawIslePlaque(ctx, isle, state, bounds, cameraX, cameraY) {
      const w = 168;
      const h = 44;
      const x = Math.round(bounds.x + bounds.w / 2 - w / 2) - cameraX;
      const y = Math.round(bounds.y + bounds.h / 2 - h / 2) - cameraY;
      const visible = x > -w - 20 && y > -h - 20 && x < this.canvas.width / this.dpr + 20 && y < this.canvas.height / this.dpr + 20;
      if (!visible) return;

      ctx.fillStyle = "rgba(49, 30, 18, 0.94)";
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "#efc76f";
      ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
      ctx.fillStyle = state === "preview" ? "#5b3d78" : "#1f777d";
      ctx.fillRect(x + 6, y + 6, w - 12, h - 12);
      ctx.fillStyle = "#fff3c4";
      ctx.font = "700 12px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(isle.label, x + w / 2, y + 10);
      ctx.font = "600 9px monospace";
      ctx.fillText(state === "preview" ? "an egg is stirring…" : "hatch its first keeper", x + w / 2, y + 26);
      ctx.textAlign = "left";
    }

    render(game) {
      const { ctx } = this;
      this.now = game.time ? game.time.elapsed : (this.now || 0) + 0.016;
      this.begin(game.camera);
      game.world.tileMap.render(this, game.camera, this.now);

      const drawableProps = game.world.activeProps(game.progress);
      for (const prop of drawableProps.filter((p) => p.layer === "ground")) this.drawProp(prop);
      if (game.wordGarden) game.wordGarden.draw(this); // gold-word flowers, ground level
      if (game.islandShaper) game.islandShaper.draw(this, game); // badge-islet dressing
      for (const crop of game.farming.crops) crop.draw(this);

      const actors = [
        ...game.animals,
        ...game.npcs,
        game.hatchery,
        game.pet,
        game.player,
        ...drawableProps.filter((p) => p.layer !== "ground" && p.layer !== "foreground"),
      ].filter(Boolean).sort((a, b) => (a.sortY || a.y + a.height) - (b.sortY || b.y + b.height));

      for (const actor of actors) {
        if (typeof actor.draw === "function") actor.draw(this);
        else this.drawProp(actor);
      }

      for (const prop of drawableProps.filter((p) => p.layer === "foreground")) this.drawProp(prop);

      // Small world-space effects (feed hearts and the like).
      for (const effect of game.effects || []) this.drawEffect(effect);
      if (game.gifts) game.gifts.draw(this);

      this.end();

      // "Lit diorama" post-process (opt-in via ?lit=1): a warm directional
      // light, a gentle saturation lift, and a soft vignette — the cheap way
      // to give the flat top-down world an Animal-Crossing-style lit feel.
      if (game.litMode) this.litPass(game);

      // Ambient time-of-day layer (tint, glows, fireflies, birds) sits over
      // the world; locked-isle overlays and the HUD stay readable above it.
      if (game.time) game.time.draw(this, game);
      this.drawLockedIslandOverlays(game, game.camera);

      game.hud.draw(ctx, game);
      game.tooltip.draw(ctx, game);
      game.dialogue.draw(ctx, game);
    }

    // Screen-space cinematic grade — three cheap blended layers over the
    // finished world frame. Purely visual, no per-sprite cost.
    litPass(game) {
      const ctx = this.ctx;
      const w = game.screenWidth;
      const h = game.screenHeight;
      ctx.save();
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

      // 1) Warm sun from the upper-left, cool shade toward the lower-right.
      const sun = ctx.createLinearGradient(0, 0, w, h);
      sun.addColorStop(0, "rgba(255, 226, 165, 0.55)");
      sun.addColorStop(0.5, "rgba(255, 240, 210, 0)");
      sun.addColorStop(1, "rgba(38, 58, 92, 0.32)");
      ctx.globalCompositeOperation = "soft-light";
      ctx.fillStyle = sun;
      ctx.fillRect(0, 0, w, h);

      // 2) Gentle warm saturation lift.
      ctx.globalCompositeOperation = "overlay";
      ctx.fillStyle = "rgba(255, 208, 140, 0.10)";
      ctx.fillRect(0, 0, w, h);

      // 3) Soft vignette to seat the scene like a lit diorama.
      const r = Math.hypot(w, h) / 2;
      const vig = ctx.createRadialGradient(w * 0.5, h * 0.44, r * 0.32, w * 0.5, h * 0.56, r);
      vig.addColorStop(0, "rgba(255, 255, 255, 1)");
      vig.addColorStop(1, "rgba(58, 44, 24, 0.6)");
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);

      ctx.restore();
    }

    drawProp(prop) {
      if (!prop.assetKey) return; // collider-only blocker (e.g. hatchery base)
      // Foliage sways gently in the breeze: a base-anchored shear where the top
      // leans, each prop phase-offset by its position so they don't move as one.
      if (SWAYING_PROPS.has(prop.assetKey)) {
        const ctx = this.ctx;
        const now = this.now || 0;
        const sway = Math.sin(now * 1.1 + (prop.x + prop.y) * 0.012) * 0.028
          + Math.sin(now * 2.3 + prop.x * 0.03) * 0.008;
        const image = this.assets.get(prop.assetKey);
        ctx.save();
        ctx.translate(Math.round(prop.x + prop.width / 2), Math.round(prop.y + prop.height));
        ctx.transform(1, 0, sway, 1, 0, 0); // top leans by sway * height
        ctx.drawImage(image, Math.round(-prop.width / 2), Math.round(-prop.height), Math.round(prop.width), Math.round(prop.height));
        ctx.restore();
        return;
      }
      this.drawImage(prop.assetKey, prop.x, prop.y, prop.width, prop.height);
    }

    drawEffect(effect) {
      const ctx = this.ctx;
      const progress = effect.t / effect.life;
      ctx.save();
      if (effect.type === "heart") {
        ctx.globalAlpha = 1 - progress;
        ctx.font = "700 16px sans-serif";
        ctx.fillStyle = "#ff6d8a";
        ctx.fillText("♥", effect.x + Math.sin(effect.t * 5) * 4, effect.y - progress * 34);
      }
      ctx.restore();
    }
  }

  ns.Renderer = Renderer;
})(window.MiftahGame || (window.MiftahGame = {}));
