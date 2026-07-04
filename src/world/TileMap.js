(function (ns) {
  const TILE_ASSETS = {
    water: "terrain.water",
    waterRipple: "terrain.waterRipple",
    lilyWater: "terrain.lilyWater",
    lagoon: "terrain.lagoon",
    grass: "terrain.grass",
    flowers: "terrain.flowers",
    sand: "terrain.sand",
    path: "terrain.path",
    courtyard: "terrain.courtyard",
    courtyardStar: "terrain.courtyardStar",
    bridgeH: "terrain.bridgeH",
    bridgeV: "terrain.bridgeV",
    dock: "terrain.dock",
    irrigationH: "terrain.irrigationH",
    irrigationV: "terrain.irrigationV",
    irrigationCross: "terrain.irrigationCross",
    sandbar: "terrain.sandbar",
  };

  // Pure-texture tiles that are made seamless and should be flip-varied per
  // cell so their repeated detail doesn't form a visible grid.
  const VARIED_TILES = new Set(["grass", "flowers", "sand", "water", "lagoon"]);

  class TileMap {
    constructor(data) {
      this.tiles = data.tiles;
      this.width = data.width;
      this.height = data.height;
      this.tileSize = data.tileSize;
      this.pixelWidth = this.width * this.tileSize;
      this.pixelHeight = this.height * this.tileSize;
      this.blockedTiles = new Set(["water", "waterRipple", "lilyWater", "lagoon", "sandbar"]);
    }

    tileAt(tx, ty) {
      if (tx < 0 || ty < 0 || tx >= this.width || ty >= this.height) return "water";
      return this.tiles[ty][tx];
    }

    isWalkableTile(tx, ty) {
      return !this.blockedTiles.has(this.tileAt(tx, ty));
    }

    isWalkablePixel(px, py) {
      return this.isWalkableTile(Math.floor(px / this.tileSize), Math.floor(py / this.tileSize));
    }

    render(renderer, camera) {
      const startX = Math.max(0, Math.floor(camera.x / this.tileSize) - 1);
      const startY = Math.max(0, Math.floor(camera.y / this.tileSize) - 1);
      const endX = Math.min(this.width, Math.ceil((camera.x + camera.width) / this.tileSize) + 1);
      const endY = Math.min(this.height, Math.ceil((camera.y + camera.height) / this.tileSize) + 1);
      const ts = this.tileSize;
      const ctx = renderer.ctx;
      for (let y = startY; y < endY; y += 1) {
        for (let x = startX; x < endX; x += 1) {
          const type = this.tileAt(x, y);
          const key = TILE_ASSETS[type] || "terrain.water";
          const px = x * ts;
          const py = y * ts;
          if (VARIED_TILES.has(type)) {
            // Seamless texture tiles get a deterministic flip/rotation per cell
            // so the repeated blade/ripple detail doesn't read as a grid. Drawn
            // 1px oversized to hide any hairline seam between cells.
            const image = renderer.assets.get(key);
            const v = ((x * 73856093) ^ (y * 19349663)) >>> 0;
            ctx.save();
            ctx.translate(px + ts / 2, py + ts / 2);
            if (v & 1) ctx.scale(-1, 1);
            if (v & 2) ctx.scale(1, -1);
            ctx.drawImage(image, -ts / 2 - 1, -ts / 2 - 1, ts + 2, ts + 2);
            ctx.restore();
          } else {
            renderer.drawImage(key, px, py, ts, ts);
          }
        }
      }
    }
  }

  ns.TileMap = TileMap;
})(window.MiftahGame || (window.MiftahGame = {}));
