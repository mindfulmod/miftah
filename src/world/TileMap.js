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
      for (let y = startY; y < endY; y += 1) {
        for (let x = startX; x < endX; x += 1) {
          const type = this.tileAt(x, y);
          renderer.drawImage(TILE_ASSETS[type] || "terrain.water", x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
        }
      }
    }
  }

  ns.TileMap = TileMap;
})(window.MiftahGame || (window.MiftahGame = {}));
