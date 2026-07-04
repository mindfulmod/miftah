(function (ns) {
  // Villagers walk gentle waypoint loops and their dialogue keeps up with
  // the island's actual progress — the world notices what you've done.
  class NPC extends ns.Entity {
    constructor(config) {
      super(config.x, config.y, 56, 72);
      this.assetIndex = config.assetIndex || 0;
      this.hint = config.hint || "";
      this.dialogue = config.dialogue || this.hint;
      this.dialogues = config.dialogues || null; // [{ min, text }] by animal count
      this.nightDialogue = config.nightDialogue || "";
      this.waypoints = (config.waypoints || []).map(([tx, ty]) => ({ x: tx * 48, y: ty * 48 }));
      this.waypointIndex = 0;
      this.pause = 1 + Math.random() * 3;
      this.speed = 26;
    }

    update(dt, game) {
      this.animationTime += dt;
      if (game) this.refreshDialogue(game);

      if (!this.waypoints.length) return;
      if (this.pause > 0) {
        this.pause -= dt;
        this.moving = false;
        return;
      }
      const target = this.waypoints[this.waypointIndex];
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 4) {
        this.waypointIndex = (this.waypointIndex + 1) % this.waypoints.length;
        this.pause = 2.5 + Math.random() * 4.5;
        this.moving = false;
        return;
      }
      const step = Math.min(this.speed * dt, dist);
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
      this.moving = true;
    }

    refreshDialogue(game) {
      if (this.nightDialogue && game.time?.isNight()) {
        this.dialogue = this.nightDialogue;
        return;
      }
      if (this.dialogues) {
        const count = game.animals.length;
        let best = this.dialogues[0];
        for (const entry of this.dialogues) {
          if (count >= entry.min) best = entry;
        }
        this.dialogue = best.text;
      }
    }

    draw(renderer) {
      const key = `characters.villagers.${this.assetIndex}`;
      const t = this.animationTime;
      if (this.moving) {
        const phase = Math.sin(t * 10);
        renderer.drawSprite(key, this.x, this.y, this.width, this.height, { bob: Math.abs(phase) * 2.6, sx: 1 + Math.max(0, -phase) * 0.03 });
      } else {
        renderer.drawSprite(key, this.x, this.y, this.width, this.height, { sy: 1 + Math.sin(t * 2.1) * 0.012 });
      }
    }
  }

  ns.NPC = NPC;
})(window.MiftahGame || (window.MiftahGame = {}));
