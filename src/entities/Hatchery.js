(function (ns) {
  class Hatchery {
    constructor(game, x, y) {
      this.game = game;
      this.x = x;
      this.y = y;
      this.width = 120;
      this.height = 80;
      this.time = 0;
    }

    get sortY() {
      return this.y + this.height - 8;
    }

    update(dt) {
      this.time += dt;
    }

    hint() {
      const egg = this.game.progress.state.activeEgg;
      if (!egg) return "The hatchery is waiting";
      return `Egg wobbling ${egg.progress}/${egg.goal}`;
    }

    dialogue() {
      const egg = this.game.progress.state.activeEgg;
      if (!egg) return "Study at the archway to awaken a new egg here.";
      return "The egg is alive with a gentle wobble. Keep studying to hatch it.";
    }

    draw(renderer) {
      const ctx = renderer.ctx;
      const egg = this.game.progress.state.activeEgg;
      const x = Math.round(this.x);
      const y = Math.round(this.y);

      ctx.save();
      ctx.imageSmoothingEnabled = false;
      renderer.drawImage("props.hatcheryCradle", x - 4, y - 8, 128, 96);

      if (egg) {
        const wobble = Math.sin(this.time * 9) * 5;
        const lift = Math.abs(Math.sin(this.time * 9)) * 2;
        ctx.save();
        ctx.translate(x + 60, y + 30 - lift);
        ctx.rotate((wobble * Math.PI) / 180);
        renderer.drawImage("props.hatchingEgg", -24, -32, 48, 64);
        ctx.restore();
      }

      ctx.restore();
    }
  }

  ns.Hatchery = Hatchery;
})(window.MiftahGame || (window.MiftahGame = {}));
