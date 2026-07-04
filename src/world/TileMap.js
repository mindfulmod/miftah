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
  const WATER_TILES = new Set(["water", "waterRipple", "lilyWater", "lagoon"]);

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

    render(renderer, camera, now = 0) {
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
      this.drawWaterLife(ctx, startX, startY, endX, endY, ts, now);
    }

    // Living water: a drifting shimmer glint on open water, and a soft animated
    // foam fringe wherever water meets land — which also rounds off the blocky
    // tile cut-offs at the island's edges.
    drawWaterLife(ctx, startX, startY, endX, endY, ts, now) {
      ctx.save();
      for (let y = startY; y < endY; y += 1) {
        for (let x = startX; x < endX; x += 1) {
          if (!WATER_TILES.has(this.tileAt(x, y))) continue;
          const px = x * ts;
          const py = y * ts;

          // Foam fringe on each edge that borders land.
          const wob = Math.sin(now * 2 + (x + y) * 0.9);
          const foamA = 0.5 + 0.28 * Math.sin(now * 1.6 + x * 0.7 + y * 0.5);
          ctx.strokeStyle = `rgba(255,255,255,${Math.max(0.18, foamA)})`;
          ctx.lineWidth = 3;
          ctx.lineCap = "round";
          const edges = [
            [!this.isWaterTile(x, y - 1), px + 3, py + 2, px + ts - 3, py + 2],
            [!this.isWaterTile(x, y + 1), px + 3, py + ts - 2, px + ts - 3, py + ts - 2],
            [!this.isWaterTile(x - 1, y), px + 2, py + 3, px + 2, py + ts - 3],
            [!this.isWaterTile(x + 1, y), px + ts - 2, py + 3, px + ts - 2, py + ts - 3],
          ];
          for (const [isShore, x0, y0, x1, y1] of edges) {
            if (!isShore) continue;
            ctx.beginPath();
            const midx = (x0 + x1) / 2 + (x0 === x1 ? wob * 1.5 : 0);
            const midy = (y0 + y1) / 2 + (y0 === y1 ? wob * 1.5 : 0);
            ctx.moveTo(x0, y0);
            ctx.quadraticCurveTo(midx, midy, x1, y1);
            ctx.stroke();
          }

          // Open-water shimmer glint (only away from shore).
          if (this.isWaterTile(x, y - 1) && this.isWaterTile(x, y + 1) &&
              this.isWaterTile(x - 1, y) && this.isWaterTile(x + 1, y)) {
            const g = 0.5 + 0.5 * Math.sin(now * 1.5 + x * 1.3 + y * 2.1);
            if (g > 0.75) {
              ctx.fillStyle = `rgba(233,252,255,${(g - 0.75) * 1.6})`;
              const gx = px + ts * (0.3 + 0.4 * ((x * 7 + y * 3) % 5) / 5);
              const gy = py + ts * (0.35 + 0.3 * ((x * 3 + y * 5) % 4) / 4);
              ctx.fillRect(Math.round(gx), Math.round(gy), 4, 2);
            }
          }
        }
      }
      ctx.restore();
    }

    isWaterTile(x, y) {
      return WATER_TILES.has(this.tileAt(x, y));
    }
  }

  ns.TileMap = TileMap;
})(window.MiftahGame || (window.MiftahGame = {}));
