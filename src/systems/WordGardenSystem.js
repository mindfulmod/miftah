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
    // thresholds as TrainerEngine.masteryTier), and gather the well-known
    // words (silver+) the pet can practice out loud.
    goldWordCount() {
      let gold = 0;
      this.practiceWords = [];
      try {
        for (let i = 0; i < localStorage.length; i += 1) {
          const key = localStorage.key(i);
          if (!key || !key.startsWith("quran-trainer:stats:surah-")) continue;
          const stats = JSON.parse(localStorage.getItem(key) || "{}");
          for (const s of Object.values(stats)) {
            const total = (s.miss || 0) + (s.correct || 0);
            if ((s.correct || 0) >= 6 && total > 0 && s.correct / total >= 0.85) gold += 1;
            if (
              (s.correct || 0) >= 4 &&
              total > 0 &&
              s.correct / total >= 0.7 &&
              s.audioPath &&
              this.practiceWords.length < 300
            ) {
              this.practiceWords.push({
                arabic: s.arabic,
                gloss: s.display || s.english || "",
                audioPath: s.audioPath,
              });
            }
          }
        }
      } catch {}
      return gold;
    }

    // ---------- the streak plant ----------
    // One special plant beside the Reading Archway that grows with the daily
    // study streak and rests (never dies) when the streak breaks.

    streakInfo() {
      try {
        const s = JSON.parse(localStorage.getItem("quran-trainer:streak") || "{}");
        const fmt = (d) =>
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const alive = s.lastDate === fmt(today) || s.lastDate === fmt(yesterday);
        return { count: s.count || 0, alive };
      } catch {
        return { count: 0, alive: false };
      }
    }

    locateStreakSpot() {
      const game = this.game;
      try {
        const arch = (game.world.activeInteractables(game.progress) || []).find(
          (p) => p.id === "reading-arch"
        );
        if (arch) return { x: arch.x - 44, y: arch.y + (arch.height || 48) - 34 };
      } catch {}
      return { x: game.world.spawn.x - 60, y: game.world.spawn.y - 20 };
    }

    // Interactable descriptor consumed by InteractionSystem.findNearest.
    streakTarget() {
      if (!this.streakSpot) return null;
      const s = this.streak || { count: 0, alive: false };
      let dialogue;
      if (s.count <= 0) {
        dialogue = "🌱 A streak sprout. Finish today's ayahs at the Codex and it takes root.";
      } else if (!s.alive) {
        dialogue = "🌙 Your streak plant is resting. Study today and it perks right back up.";
      } else {
        dialogue = `🔥 Your streak plant stands ${s.count} day${s.count === 1 ? "" : "s"} tall. Come back tomorrow to keep it growing!`;
      }
      return {
        x: this.streakSpot.x,
        y: this.streakSpot.y,
        width: 28,
        height: 34,
        hint: s.count > 0 ? `Streak plant · ${s.count} day${s.count === 1 ? "" : "s"}` : "Streak plant",
        dialogue,
      };
    }

    // Every planted flower keeps its spot forever (seeded by its index), so
    // the garden only ever grows — new gold words append, nothing reshuffles.
    refresh() {
      const game = this.game;
      this.streak = this.streakInfo();
      if (!this.streakSpot) this.streakSpot = this.locateStreakSpot();
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

      // The streak plant: sprout → shoot → bush → radiant berries as the
      // streak climbs; drawn drooped (dimmed and squashed) while resting.
      if (this.streakSpot) {
        const s = this.streak || { count: 0, alive: false };
        const key =
          s.count >= 7 ? "crops.berriesMature" : s.count >= 3 ? "crops.medium" : "crops.sprout";
        const img = game.assets.get(key);
        if (img) {
          const ctx = renderer.ctx;
          const resting = s.count > 0 && !s.alive;
          const sway = Math.sin(t * 1.1) * 1.2;
          ctx.save();
          if (resting) ctx.globalAlpha = 0.55;
          const h = resting ? 26 : 32;
          ctx.drawImage(img, Math.round(this.streakSpot.x + sway), Math.round(this.streakSpot.y + (32 - h)), 28, h);
          ctx.restore();
          if (s.alive && s.count >= 7) {
            const glow = 0.35 + Math.sin(t * 2.2) * 0.15;
            ctx.save();
            ctx.globalAlpha = glow;
            ctx.fillStyle = "#ffedb0";
            ctx.beginPath();
            ctx.arc(this.streakSpot.x + 14, this.streakSpot.y + 8, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }
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
