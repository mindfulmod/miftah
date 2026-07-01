(function (ns) {
  class Camera {
    constructor(worldWidth, worldHeight) {
      this.x = 0;
      this.y = 0;
      this.width = 800;
      this.height = 600;
      this.worldWidth = worldWidth;
      this.worldHeight = worldHeight;
    }

    resize(width, height) {
      this.width = width;
      this.height = height;
      this.clamp();
    }

    follow(target, dt) {
      const desiredX = target.x + target.width / 2 - this.width / 2;
      const desiredY = target.y + target.height / 2 - this.height / 2;
      const smoothing = 1 - Math.pow(0.001, dt);
      this.x += (desiredX - this.x) * smoothing;
      this.y += (desiredY - this.y) * smoothing;
      this.clamp();
    }

    clamp() {
      this.x = Math.max(0, Math.min(this.x, Math.max(0, this.worldWidth - this.width)));
      this.y = Math.max(0, Math.min(this.y, Math.max(0, this.worldHeight - this.height)));
    }
  }

  ns.Camera = Camera;
})(window.MiftahGame || (window.MiftahGame = {}));
