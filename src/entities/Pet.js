(function (ns) {
  class Pet extends ns.Entity {
    constructor(x, y) {
      super(x, y, 48, 48);
      this.speed = 128;
      this.trail = [];
      this.direction = "down";
    }

    update(dt, player) {
      this.trail.push({ x: player.x - 4, y: player.y + 20 });
      if (this.trail.length > 90) this.trail.shift();
      const target = this.trail[Math.max(0, this.trail.length - 26)] || this.trail[0];
      if (!target) return;

      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const dist = Math.hypot(dx, dy);
      this.moving = dist > 18;
      if (this.moving) {
        const step = Math.min(this.speed * dt, dist);
        this.x += (dx / dist) * step;
        this.y += (dy / dist) * step;
        if (Math.abs(dx) > Math.abs(dy)) this.direction = dx > 0 ? "right" : "left";
        else this.direction = dy > 0 ? "down" : "up";
      }
      this.animationTime += dt;
    }

    getAssetKey() {
      if (!this.moving) return `animals.cat.idle.${this.direction}`;
      return `animals.cat.walk.${this.direction}.${this.frameIndex(2)}`;
    }

    draw(renderer) {
      const t = this.animationTime;
      if (this.moving) {
        const phase = Math.sin(t * 10);
        renderer.drawSprite(this.getAssetKey(), this.x, this.y, this.width, this.height, { bob: Math.abs(phase) * 2.2 });
      } else {
        renderer.drawSprite(this.getAssetKey(), this.x, this.y, this.width, this.height, { sy: 1 + Math.sin(t * 2.6) * 0.02 });
      }
    }
  }

  ns.Pet = Pet;
})(window.MiftahGame || (window.MiftahGame = {}));
