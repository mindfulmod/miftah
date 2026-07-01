(function (ns) {
  class Entity {
    constructor(x, y, width, height) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.direction = "down";
      this.moving = false;
      this.animationTime = 0;
      this.hint = "";
    }

    get centerX() {
      return this.x + this.width / 2;
    }

    get centerY() {
      return this.y + this.height / 2;
    }

    get sortY() {
      return this.y + this.height - 6;
    }

    distanceTo(other) {
      const ox = other.centerX ?? other.x + other.width / 2;
      const oy = other.centerY ?? other.y + other.height / 2;
      return Math.hypot(this.centerX - ox, this.centerY - oy);
    }

    frameIndex(frameCount, fps = 7) {
      if (!this.moving || frameCount <= 1) return 0;
      return Math.floor(this.animationTime * fps) % frameCount;
    }
  }

  ns.Entity = Entity;
})(window.MiftahGame || (window.MiftahGame = {}));
