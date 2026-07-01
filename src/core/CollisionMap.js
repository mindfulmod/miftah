(function (ns) {
  function intersects(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // The foot-area points tested against tile walkability. Shared with the
  // debug overlay (C) so what it draws is exactly what gets sampled.
  function samplePoints(x, y, w, h) {
    return [
      [x + 3, y + h - 3],
      [x + w - 3, y + h - 3],
      [x + w / 2, y + h - 3],
      [x + 4, y + h / 2],
      [x + w - 4, y + h / 2],
    ];
  }

  class CollisionMap {
    constructor(world, progressProvider = null) {
      this.world = world;
      this.progressProvider = progressProvider;
    }

    canMoveToRect(x, y, w, h) {
      const rect = { x, y, w, h };
      if (x < 0 || y < 0 || x + w > this.world.pixelWidth || y + h > this.world.pixelHeight) return false;

      for (const [px, py] of samplePoints(x, y, w, h)) {
        if (!this.world.tileMap.isWalkablePixel(px, py)) return false;
      }
      const progress = this.progressProvider ? this.progressProvider() : null;
      return !this.world.activeColliders(progress).some((collider) => intersects(rect, collider));
    }
  }

  ns.CollisionMap = CollisionMap;
  ns.rectsIntersect = intersects;
  ns.collisionSamplePoints = samplePoints;
})(window.MiftahGame || (window.MiftahGame = {}));
