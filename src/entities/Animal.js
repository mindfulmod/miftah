(function (ns) {
  const ANIMAL_SIZE = {
    cow: [64, 64],
    sheep: [64, 64],
    bee: [40, 40],
    dove: [48, 48],
    fish: [72, 72],
  };

  const PASS_THROUGH_TYPES = new Set(["bee", "dove", "hoopoe", "ababeel", "crow", "fish"]);

  class Animal extends ns.Entity {
    constructor(config) {
      const size = config.assetStageKey ? [64, 64] : ANIMAL_SIZE[config.type] || [64, 64];
      super(config.x, config.y, size[0], size[1]);
      this.type = config.type;
      this.id = config.id || config.type;
      this.displayName = config.name || config.type;
      this.assetStageKey = config.assetStageKey || null;
      this.feedToYoung = config.feedToYoung || 2;
      this.feedToAdult = config.feedToAdult || 4;
      this.growthStage = config.growthStage || 1;
      this.feedProgress = config.feedProgress || 0;
      this.onProgressChange = config.onProgressChange || null;
      this.bounds = config.bounds;
      this.hint = config.hint || "";
      this.speed = config.type === "bee" || config.type === "dove" ? 60 : 42;
      this.blocksPlayer = config.blocksPlayer ?? !PASS_THROUGH_TYPES.has(config.type);
      this.wait = Math.random() * 1.5;
      this.target = { x: this.x, y: this.y };
      // Predicate (px, py) => bool deciding whether this animal may stand on a
      // world pixel. Keeps land animals off the water and the fish in it.
      this.canStand = config.canStand || null;
    }

    collisionRect(x = this.x, y = this.y) {
      if (!this.blocksPlayer) return null;
      return {
        x: x + this.width * 0.25,
        y: y + this.height * 0.62,
        w: this.width * 0.5,
        h: this.height * 0.24,
      };
    }

    wouldOverlapPlayer(x, y, player) {
      if (!player || !this.blocksPlayer) return false;
      return ns.rectsIntersect(this.collisionRect(x, y), player.collisionRect());
    }

    // Sample the animal's "feet" for a candidate top-left position.
    standableAt(x, y) {
      if (!this.canStand) return true;
      return this.canStand(x + this.width / 2, y + this.height - 4);
    }

    pickTarget() {
      const pad = 20;
      for (let attempt = 0; attempt < 12; attempt += 1) {
        const tx = this.bounds.x + pad + Math.random() * Math.max(1, this.bounds.w - this.width - pad * 2);
        const ty = this.bounds.y + pad + Math.random() * Math.max(1, this.bounds.h - this.height - pad * 2);
        if (this.standableAt(tx, ty)) return { x: tx, y: ty };
      }
      return { x: this.x, y: this.y }; // give up this cycle; stay put
    }

    update(dt, player = null, night = false) {
      // Land animals bed down for the night (the fish keeps drifting).
      this.sleeping = night && this.type !== "fish";
      if (this.sleeping) {
        this.moving = false;
        this.target = { x: this.x, y: this.y };
        this.animationTime += dt;
        return;
      }
      this.wait -= dt;
      if (this.wait <= 0 && Math.hypot(this.target.x - this.x, this.target.y - this.y) < 6) {
        this.wait = 1 + Math.random() * 2.8;
        this.target = this.pickTarget();
      }

      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      const dist = Math.hypot(dx, dy);
      this.moving = dist > 4 && this.wait < 1;
      if (this.moving) {
        const step = Math.min(this.speed * dt, dist);
        const nx = this.x + (dx / dist) * step;
        const ny = this.y + (dy / dist) * step;
        if (this.standableAt(nx, ny) && !this.wouldOverlapPlayer(nx, ny, player)) {
          this.x = nx;
          this.y = ny;
        } else {
          // Would step off allowed terrain — abandon this target, re-pick soon.
          this.target = { x: this.x, y: this.y };
          this.wait = 0.4 + Math.random();
          this.moving = false;
        }
      }
      this.animationTime += dt;
    }

    feed() {
      if (this.growthStage >= 3) return { grown: false, text: `${this.displayName} is fully grown.` };
      this.feedProgress += 1;
      const needed = this.growthStage === 1 ? this.feedToYoung : this.feedToAdult;
      let grew = false;
      if (this.feedProgress >= needed) {
        this.growthStage += 1;
        this.feedProgress = 0;
        grew = true;
      }
      this.syncProgress();
      return {
        grown: grew,
        text: grew ? `${this.displayName} grew to stage ${this.growthStage}.` : `${this.displayName} enjoyed the feed.`,
      };
    }

    syncProgress() {
      if (this.onProgressChange) {
        this.onProgressChange(this.id, {
          stage: this.growthStage,
          feedProgress: this.feedProgress,
        });
      }
    }

    feedNeeded() {
      if (this.growthStage >= 3) return 0;
      return this.growthStage === 1 ? this.feedToYoung : this.feedToAdult;
    }

    interactionHint() {
      if (this.growthStage >= 3) return `${this.displayName} is fully grown`;
      return `Feed ${this.displayName} (${this.feedProgress}/${this.feedNeeded()})`;
    }

    getAssetKey() {
      if (this.assetStageKey) return `${this.assetStageKey}.${this.growthStage - 1}`;
      if (this.type === "cow") return this.moving ? `animals.cow.walk.${this.frameIndex(2)}` : "animals.cow.idle.0";
      if (this.type === "sheep") return this.moving ? "animals.sheep.walk.0" : "animals.sheep.idle.0";
      if (this.type === "bee") return `animals.bee.fly.${this.frameIndex(2, 10)}`;
      if (this.type === "dove") return `animals.dove.fly.${this.frameIndex(2, 5)}`;
      if (this.type === "fish") return `animals.fish.swim.${this.frameIndex(2, 4)}`;
      return "animals.cow.idle.0";
    }

    draw(renderer) {
      const key = this.getAssetKey();
      const t = this.animationTime;
      // Flyers (bee/dove/fish) hover; walkers hop; everyone breathes at rest.
      const flyer = this.type === "bee" || this.type === "dove" || this.type === "fish";
      if (this.sleeping) {
        renderer.drawSprite(key, this.x, this.y, this.width, this.height, { sy: 1 + Math.sin(t * 1.6) * 0.02 });
      } else if (flyer) {
        renderer.drawSprite(key, this.x, this.y, this.width, this.height, { bob: Math.sin(t * 6) * 3 });
      } else if (this.moving) {
        const phase = Math.sin(t * 9);
        const down = Math.max(0, -phase);
        renderer.drawSprite(key, this.x, this.y, this.width, this.height, {
          bob: Math.abs(phase) * 2.4,
          sx: 1 + down * 0.05,
          sy: 1 - down * 0.06,
        });
      } else {
        const br = Math.sin(t * 2.6) * 0.016;
        renderer.drawSprite(key, this.x, this.y, this.width, this.height, { sy: 1 + br, sx: 1 - br * 0.5 });
      }
      if (this.sleeping) {
        // A little drift of Zs above a sleeping animal.
        const ctx = renderer.ctx;
        ctx.save();
        ctx.font = "700 11px monospace";
        for (let i = 0; i < 2; i += 1) {
          const t = (this.animationTime * 0.5 + i * 0.5) % 1;
          ctx.globalAlpha = (1 - t) * 0.7;
          ctx.fillStyle = "#eaf2ff";
          ctx.fillText("z", this.x + this.width - 6 + i * 7, this.y + 2 - t * 14 - i * 5);
        }
        ctx.restore();
      }
    }
  }

  ns.Animal = Animal;
})(window.MiftahGame || (window.MiftahGame = {}));
