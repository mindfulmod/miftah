// Seeded island shaping — docs/procedural-island-spec.md (Phase 1).
//
// Gameplay geometry is sacred: this never erodes land, never touches tiles
// near bridges/docks/borders, and never moves a prop. It only (1) grows an
// organic, per-player coastline outward into open water, (2) scatters water
// detail, and (3) raises one scenic islet per earned juz badge — the
// archipelago as a picture of Quran progress. Islet decor is draw-only so
// the F2 editor and override saves never see it.
(function (ns) {
  const SEED_KEY = "miftah-oasis:island-seed";
  const BADGES_KEY = "quran-trainer:badges";
  const LAND = new Set(["grass", "sand", "path", "flowers", "courtyard", "courtyardStar"]);
  const KEEP_CLEAR = new Set(["bridgeH", "bridgeV", "dock"]);

  function hashSeed(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function next() {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  class IslandShaper {
    constructor() {
      const fromUrl = new URLSearchParams(location.search).get("seed");
      let seed = fromUrl;
      if (!seed) {
        try {
          seed = localStorage.getItem(SEED_KEY);
        } catch {}
      }
      if (!seed) {
        seed = Math.random().toString(36).slice(2, 10);
        try {
          localStorage.setItem(SEED_KEY, seed);
        } catch {}
      }
      this.seed = String(seed);
      this.tiles = null;
      this.width = 0;
      this.height = 0;
      this.isletAnchors = []; // one candidate spot per juz (index 0 = juz 1)
      this.risen = new Set(); // juz numbers whose islet exists in the tiles
      this.decor = []; // { x, y, kind } draw-only islet dressing
    }

    rng(purpose) {
      return mulberry32(hashSeed(`${this.seed}|${purpose}`));
    }

    // ---------- tile helpers ----------

    at(x, y) {
      if (x < 0 || y < 0 || x >= this.width || y >= this.height) return "water";
      return this.tiles[y][x];
    }

    isWater(x, y) {
      const t = this.at(x, y);
      return t === "water" || t === "waterRipple" || t === "lilyWater";
    }

    nearTile(x, y, radius, predicate) {
      for (let dy = -radius; dy <= radius; dy += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          if (predicate(this.at(x + dx, y + dy))) return true;
        }
      }
      return false;
    }

    landNeighbours(x, y) {
      let n = 0;
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        if (LAND.has(this.at(x + dx, y + dy))) n += 1;
      }
      return n;
    }

    // A tile the coastline pass may claim: open water, ≥2 tiles from any
    // bridge/dock (boat lanes stay clean) and from the map border.
    claimable(x, y) {
      if (x < 2 || y < 2 || x >= this.width - 2 || y >= this.height - 2) return false;
      if (!this.isWater(x, y)) return false;
      return !this.nearTile(x, y, 2, (t) => KEEP_CLEAR.has(t));
    }

    // ---------- boot-time shaping ----------

    apply(mapData) {
      this.tiles = mapData.tiles;
      this.width = mapData.width;
      this.height = mapData.height;
      this.growCoastline();
      this.scatterWaterDetail();
      this.computeIsletAnchors();
      return mapData;
    }

    // Expansion-only organic coastline, bounded to ONE ring around the
    // original land mask: growth can roughen every shore but two facing
    // coasts can each claim at most one tile, so no water channel ever
    // pinches shut — locked-isle gates stay the only way across.
    growCoastline() {
      const rand = this.rng("coast");
      const originalLand = Array.from({ length: this.height }, (_, y) =>
        Array.from({ length: this.width }, (_, x) => LAND.has(this.at(x, y)))
      );
      const originalLandAt = (x, y) =>
        x >= 0 && y >= 0 && x < this.width && y < this.height && originalLand[y][x];

      const grow = [];
      for (let y = 0; y < this.height; y += 1) {
        for (let x = 0; x < this.width; x += 1) {
          if (!this.claimable(x, y)) continue;
          let n = 0;
          for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) {
            if (originalLandAt(x + dx, y + dy)) n += 1;
          }
          if (n >= 2 && rand() < 0.14 * n) grow.push([x, y]);
        }
      }
      for (const [x, y] of grow) this.tiles[y][x] = "sand";

      // Grown tiles that ended up fully embraced by land read as meadow.
      for (const [x, y] of grow) {
        if (this.landNeighbours(x, y) === 8 && rand() < 0.7) this.tiles[y][x] = "grass";
      }
    }

    scatterWaterDetail() {
      const rand = this.rng("waterDetail");
      const place = (type, count) => {
        for (let i = 0; i < count * 8 && count > 0; i += 1) {
          const x = 2 + Math.floor(rand() * (this.width - 4));
          const y = 2 + Math.floor(rand() * (this.height - 4));
          if (this.at(x, y) !== "water") continue;
          if (this.nearTile(x, y, 1, (t) => KEEP_CLEAR.has(t))) continue;
          this.tiles[y][x] = type;
          count -= 1;
        }
      };
      place("waterRipple", 14);
      place("lilyWater", 8);
    }

    // ---------- badge islets ----------

    // 30 candidate anchors (juz 1..30): scan every open-water tile with a
    // clear 5×5 pocket, then greedily pick well-spaced spots in seeded order.
    // Assigned to juz by angle around the island so the archipelago grows
    // clockwise as badges accumulate.
    computeIsletAnchors() {
      const rand = this.rng("islets");
      const open = (t) => ["water", "waterRipple", "lilyWater"].includes(t);
      const pool = [];
      for (let y = 3; y < this.height - 3; y += 1) {
        for (let x = 3; x < this.width - 3; x += 1) {
          if (this.nearTile(x, y, 2, (t) => !open(t))) continue;
          pool.push({ x, y, sort: rand() });
        }
      }
      pool.sort((a, b) => a.sort - b.sort);

      // Two passes: comfortable spacing first, then a tighter fill so every
      // juz is guaranteed an islet (a learner's first badge is often juz 30).
      const picked = [];
      for (const minGap of [4.4, 3.2, 2.6]) {
        for (const spot of pool) {
          if (picked.length >= 30) break;
          if (picked.some((p) => Math.hypot(p.x - spot.x, p.y - spot.y) < minGap)) continue;
          picked.push(spot);
        }
        if (picked.length >= 30) break;
      }

      // Clockwise around the map centre → juz 1 starts "north" and the
      // archipelago sweeps around as the badge count climbs.
      const cx = this.width / 2;
      const cy = this.height / 2;
      picked.sort(
        (a, b) =>
          Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx)
      );
      this.isletAnchors = picked.map((p) => ({
        x: p.x,
        y: p.y,
        palm: rand() < 0.6,
        r: 1.5 + rand() * 0.7,
      }));
      while (this.isletAnchors.length < 30) this.isletAnchors.push(null);
    }

    earnedBadges() {
      try {
        const list = JSON.parse(localStorage.getItem(BADGES_KEY) || "[]");
        return Array.isArray(list) ? list : [];
      } catch {
        return [];
      }
    }

    raiseIslet(juz) {
      const anchor = this.isletAnchors[juz - 1];
      if (!anchor || this.risen.has(juz)) return null;
      const { x: ax, y: ay } = anchor;
      const r = Math.min(anchor.r, 2);
      const partOfIslet = (x, y) => Math.hypot(x - ax, y - ay) <= r;
      for (let dy = -2; dy <= 2; dy += 1) {
        for (let dx = -2; dx <= 2; dx += 1) {
          const d = Math.hypot(dx, dy);
          const x = ax + dx;
          const y = ay + dy;
          if (x < 1 || y < 1 || x >= this.width - 1 || y >= this.height - 1) continue;
          if (!this.isWater(x, y)) continue;
          // Monuments stay offshore: never sit flush against existing land,
          // so there's always at least one water tile between islet and shore.
          const touchesShore = [[-1, 0], [1, 0], [0, -1], [0, 1]].some(([ox, oy]) => {
            const t = this.at(x + ox, y + oy);
            return !["water", "waterRipple", "lilyWater"].includes(t) && !partOfIslet(x + ox, y + oy);
          });
          if (touchesShore) continue;
          if (d <= r - 1) this.tiles[y][x] = "grass";
          else if (d <= r) this.tiles[y][x] = "sand";
        }
      }
      this.decor.push({
        x: ax * 48,
        y: ay * 48,
        kind: anchor.palm ? "palm" : "flowers",
        phase: (juz * 1.7) % (Math.PI * 2),
      });
      this.risen.add(juz);
      return anchor;
    }

    // Raise islets for every earned badge. Boot call is silent; when a badge
    // lands mid-session (Codex close), the newest islet gets its moment:
    // cutaway, splash ripples and a hatch chime.
    syncBadgeIslets(game, { animate = false } = {}) {
      const earned = this.earnedBadges();
      let newest = null;
      for (const juz of earned) {
        const anchor = this.raiseIslet(juz);
        if (anchor) newest = { juz, anchor };
      }
      if (newest && animate && game && !game.trainer?.isOpen) {
        const px = newest.anchor.x * 48;
        const py = newest.anchor.y * 48;
        game.sound.play("hatch");
        for (let i = 0; i < 5; i += 1) {
          game.spawnEffect("heart", px - 20 + Math.random() * 40, py - 10 + Math.random() * 20);
        }
        game.playCutaway(px, py, 3.2, () => {
          game.dialogue.open(`🏝 Juz ${newest.juz} — a new islet rises for your badge.`, 3.4);
        });
      }
    }

    // Draw-only islet dressing (ground pass, beside the word garden).
    draw(renderer, game) {
      if (!game || !this.decor.length) return;
      const t = game.time ? game.time.elapsed : 0;
      const night = game.time ? game.time.isNight() : false;
      for (const d of this.decor) {
        const key = d.kind === "palm" ? "props.palm" : "props.flowers";
        const img = game.assets.get(key);
        const w = d.kind === "palm" ? 56 : 26;
        const h = d.kind === "palm" ? 66 : 26;
        if (img) renderer.ctx.drawImage(img, Math.round(d.x - w / 2), Math.round(d.y - h + 14), w, h);
        const lantern = game.assets.get("props.lantern");
        if (lantern) renderer.ctx.drawImage(lantern, Math.round(d.x + 10), Math.round(d.y - 12), 22, 30);
        if (night) {
          const glow = 0.22 + Math.sin(t * 2 + d.phase) * 0.08;
          const ctx = renderer.ctx;
          ctx.save();
          ctx.globalAlpha = glow;
          ctx.fillStyle = "#ffd98a";
          ctx.beginPath();
          ctx.arc(d.x + 21, d.y + 0, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    }
  }

  ns.IslandShaper = IslandShaper;
})(window.MiftahGame || (window.MiftahGame = {}));
