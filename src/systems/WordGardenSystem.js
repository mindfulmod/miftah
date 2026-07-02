// The word garden — the strong cross-link between the two games: every
// gold-mastered word (from the shared quran-trainer stats) plants one
// flower somewhere on the island, and an isle whose animals are all fully
// grown "blooms" with a ring of flowers around its heart. The island is a
// picture of your learning.
(function (ns) {
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

  class WordGardenSystem {
    constructor(game) {
      this.game = game;
      this.flowers = []; // { x, y, size, sway }
      this.bloomIsles = new Set();
      this.refresh();
    }

    // Count gold-mastery words across every surah's shared stats (same
    // thresholds as TrainerEngine.masteryTier).
    goldWordCount() {
      let gold = 0;
      try {
        for (let i = 0; i < localStorage.length; i += 1) {
          const key = localStorage.key(i);
          if (!key || !key.startsWith("quran-trainer:stats:surah-")) continue;
          const stats = JSON.parse(localStorage.getItem(key) || "{}");
          for (const s of Object.values(stats)) {
            const total = (s.miss || 0) + (s.correct || 0);
            if ((s.correct || 0) >= 6 && total > 0 && s.correct / total >= 0.85) gold += 1;
          }
        }
      } catch {}
      return gold;
    }

    // Every planted flower keeps its spot forever (seeded by its index), so
    // the garden only ever grows — new gold words append, nothing reshuffles.
    refresh() {
      const game = this.game;
      const count = Math.min(this.goldWordCount(), 160);
      const ts = 48;
      this.flowers = [];
      for (let i = 0; i < count; i += 1) {
        const rng = mulberry32(hashSeed(`word-flower|${i}`));
        for (let attempt = 0; attempt < 30; attempt += 1) {
          // Bias toward the hub; later flowers spread wherever land allows.
          const tx = Math.floor(rng() * game.world.width);
          const ty = Math.floor(rng() * game.world.height);
          if (game.world.tileMap.tileAt(tx, ty) !== "grass") continue;
          this.flowers.push({
            x: tx * ts + 6 + rng() * (ts - 24),
            y: ty * ts + 6 + rng() * (ts - 24),
            size: 14 + rng() * 8,
            sway: rng() * Math.PI * 2,
          });
          break;
        }
      }

      // An isle blooms when every one of its animals is fully grown.
      this.bloomIsles.clear();
      const byZone = new Map();
      for (const animal of ns.ANIMAL_CATALOG) {
        if (!byZone.has(animal.zone)) byZone.set(animal.zone, []);
        byZone.get(animal.zone).push(animal.id);
      }
      for (const isle of game.world.islands || []) {
        const ids = isle.zones.flatMap((zone) => byZone.get(zone) || []);
        if (!ids.length) continue;
        const allGrown = ids.every((id) => game.progress.animalProgress(id)?.stage >= 3);
        if (allGrown) this.bloomIsles.add(isle.id);
      }
    }

    // Drawn inside the world pass (ground level, before actors).
    draw(renderer) {
      const game = this.game;
      const cam = game.camera;
      const t = game.time ? game.time.elapsed : 0;
      const image = game.assets.get("props.flowers");
      const margin = 32;

      for (const flower of this.flowers) {
        if (
          flower.x < cam.x - margin || flower.x > cam.x + cam.width + margin ||
          flower.y < cam.y - margin || flower.y > cam.y + cam.height + margin
        ) continue;
        const sway = Math.sin(t * 1.3 + flower.sway) * 1.5;
        renderer.ctx.drawImage(image, Math.round(flower.x + sway), Math.round(flower.y), flower.size, flower.size);
      }

      // Bloom rings: a wreath of flowers around a fully-grown isle's heart.
      for (const isle of game.world.islands || []) {
        if (!this.bloomIsles.has(isle.id)) continue;
        const cx = isle.bounds.x + isle.bounds.w / 2;
        const cy = isle.bounds.y + isle.bounds.h / 2;
        if (cx < cam.x - 400 || cx > cam.x + cam.width + 400) continue;
        for (let i = 0; i < 10; i += 1) {
          const angle = (Math.PI * 2 * i) / 10 + t * 0.05;
          const fx = cx + Math.cos(angle) * 100 - 10;
          const fy = cy + Math.sin(angle) * 64 - 10;
          if (game.world.tileMap.isWalkablePixel(fx + 10, fy + 16)) {
            renderer.ctx.drawImage(image, Math.round(fx), Math.round(fy), 20, 20);
          }
        }
      }
    }
  }

  ns.WordGardenSystem = WordGardenSystem;
})(window.MiftahGame || (window.MiftahGame = {}));
