(function (ns) {
  class Player extends ns.Entity {
    constructor(x, y) {
      super(x, y, 56, 72);
      this.speed = 168;
      this.spawn = { x, y };
      this.direction = "down";
    }

    collisionRect(x = this.x, y = this.y) {
      return {
        x: x + 12,
        y: y + 46,
        w: 32,
        h: 20,
      };
    }

    reset() {
      this.x = this.spawn.x;
      this.y = this.spawn.y;
      this.direction = "down";
      this.moving = false;
    }

    update(dt, input, collisionMap) {
      if (input.consume("KeyR")) this.reset();
      const vector = input.vector();
      this.moving = vector.x !== 0 || vector.y !== 0;
      if (this.moving) {
        if (Math.abs(vector.x) > Math.abs(vector.y)) this.direction = vector.x > 0 ? "right" : "left";
        else this.direction = vector.y > 0 ? "down" : "up";
      }

      const amount = this.speed * dt;
      this.tryMove(vector.x * amount, 0, collisionMap);
      this.tryMove(0, vector.y * amount, collisionMap);
      this.animationTime += dt;
    }

    tryMove(dx, dy, collisionMap) {
      if (dx === 0 && dy === 0) return;
      const rect = this.collisionRect(this.x + dx, this.y + dy);
      if (collisionMap.canMoveToRect(rect.x, rect.y, rect.w, rect.h)) {
        this.x += dx;
        this.y += dy;
      }
    }

    getAssetKey() {
      if (!this.moving) return `characters.player.idle.${this.direction}`;
      const index = this.frameIndex(3) + 1;
      return `characters.player.walk.${this.direction}.${index - 1}`;
    }

    draw(renderer) {
      const key = this.getAssetKey();
      const t = this.animationTime;
      if (this.moving) {
        // Springy walk: a hop with a squash on each footfall.
        const phase = Math.sin(t * 11);
        const down = Math.max(0, -phase);
        renderer.drawSprite(key, this.x, this.y, this.width, this.height, {
          bob: Math.abs(phase) * 3,
          sx: 1 + down * 0.04,
          sy: 1 - down * 0.05,
        });
      } else {
        const br = Math.sin(t * 2.3) * 0.012;
        renderer.drawSprite(key, this.x, this.y, this.width, this.height, { sy: 1 + br, sx: 1 - br * 0.5 });
      }
    }
  }

  ns.Player = Player;
})(window.MiftahGame || (window.MiftahGame = {}));
