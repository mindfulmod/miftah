(function (ns) {
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
      this.begin(game.camera);
      game.world.tileMap.render(this, game.camera);

      const drawableProps = game.world.activeProps(game.progress);
      for (const prop of drawableProps.filter((p) => p.layer === "ground")) this.drawProp(prop);
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

      // Ambient time-of-day layer (tint, glows, fireflies, birds) sits over
      // the world; locked-isle overlays and the HUD stay readable above it.
      if (game.time) game.time.draw(this, game);
      this.drawLockedIslandOverlays(game, game.camera);

      game.hud.draw(ctx, game);
      game.tooltip.draw(ctx, game);
      game.dialogue.draw(ctx, game);
    }

    drawProp(prop) {
      if (!prop.assetKey) return; // collider-only blocker (e.g. hatchery base)
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
