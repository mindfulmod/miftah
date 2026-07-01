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

    drawLockedIslandOverlays(game, camera) {
      const islands = game.world.islands;
      if (!islands || !game.progress) return;
      const ctx = this.ctx;
      ctx.save();
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      const cx = Math.round(camera.x);
      const cy = Math.round(camera.y);
      for (const isle of islands) {
        if (game.world.islandState(isle.id, game.progress) !== "locked") continue;
        const b = isle.bounds;
        this.drawConstructionSign(ctx, isle, b, cx, cy);
      }
      ctx.restore();
    }

    drawConstructionSign(ctx, isle, bounds, cameraX, cameraY) {
      const isWest = isle.id === "nw" || isle.id === "sw";
      const x = Math.round(isWest ? bounds.x + bounds.w - 112 : bounds.x + 32) - cameraX;
      const y = Math.round(bounds.y + bounds.h / 2 - 24) - cameraY;
      const visible = x > -130 && y > -60 && x < this.canvas.width / this.dpr + 20 && y < this.canvas.height / this.dpr + 20;
      if (!visible) return;

      ctx.fillStyle = "rgba(49, 30, 18, 0.94)";
      ctx.fillRect(x, y, 100, 40);
      ctx.fillStyle = "#efc76f";
      ctx.fillRect(x + 3, y + 3, 94, 34);
      ctx.fillStyle = "#1f777d";
      ctx.fillRect(x + 7, y + 7, 86, 26);
      ctx.fillStyle = "#fff3c4";
      ctx.font = "700 10px monospace";
      ctx.textBaseline = "top";
      ctx.fillText("UNDER", x + 31, y + 10);
      ctx.fillText("CONSTRUCTION", x + 15, y + 23);
    }

    shouldDrawProp(prop, game) {
      if (!game.world.tileMap.backgroundAssetKey) return true;
      if (prop.alwaysDraw) return true;
      if (prop.lockIsland || prop.lockZone || prop.previewZone) return true;
      return false;
    }

    render(game) {
      const { ctx } = this;
      this.begin(game.camera);
      game.world.tileMap.render(this, game.camera);

      const activeProps = game.world.activeProps(game.progress);
      const drawableProps = activeProps.filter((prop) => this.shouldDrawProp(prop, game));
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

      this.end();

      // Tint locked islands so it's clear which biomes haven't opened yet.
      // The bridge gate (a real collider) is what actually blocks entry.
      // Drawn over the world but under the HUD/dialogue UI.
      this.drawLockedIslandOverlays(game, game.camera);

      game.hud.draw(ctx, game);
      game.tooltip.draw(ctx, game);
      game.dialogue.draw(ctx, game);
    }

    drawProp(prop) {
      this.drawImage(prop.assetKey, prop.x, prop.y, prop.width, prop.height);
    }
  }

  ns.Renderer = Renderer;
})(window.MiftahGame || (window.MiftahGame = {}));
