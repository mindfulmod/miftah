// Nature gifts: once per real day, each open isle (and the hub shore) leaves
// a small signature find — a blossom, a hay tuft, a smooth pebble — at a
// deterministic spot. Collecting it fills the Garden Album's shelf. Gentle
// Animal-Crossing-style beachcombing: a reason to walk the island daily.
(function (ns) {
  const COLLECTED_KEY = "miftah-oasis:gifts-collected"; // { areaId: dateStr }

  // One gift kind per area, reusing existing prop art.
  const GIFTS = {
    hub: { id: "shore-pebble", label: "Shore pebble", assetKey: "props.rocks", blurb: "Smoothed by the tide below the dock." },
    nw: { id: "garden-blossom", label: "Garden blossom", assetKey: "props.flowers", blurb: "Dropped where the bees have been busy." },
    w: { id: "fallen-plume", label: "Fallen plume", assetKey: "props.reeds", blurb: "Drifted down from the aviary perches." },
    sw: { id: "lagoon-lily", label: "Lagoon lily", assetKey: "props.lilyPads", blurb: "Washed up at the edge of the deep lagoon." },
    ne: { id: "hay-tuft", label: "Hay tuft", assetKey: "props.hay", blurb: "Carried off from the barn, one mouthful at a time." },
    e: { id: "orange-blossom", label: "Orange blossom", assetKey: "props.flowers", blurb: "Shaken loose from the grove's orange tree." },
    se: { id: "clay-shard", label: "Clay shard", assetKey: "props.jar", blurb: "Sun-warmed pottery from the grotto sands." },
  };

  const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

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

  class GiftSystem {
    constructor(game) {
      this.game = game;
      this.refresh();
    }

    loadCollected() {
      try {
        const data = JSON.parse(localStorage.getItem(COLLECTED_KEY) || "{}");
        return data && typeof data === "object" ? data : {};
      } catch {
        return {};
      }
    }

    saveCollected(map) {
      try {
        localStorage.setItem(COLLECTED_KEY, JSON.stringify(map));
      } catch {}
    }

    // Areas that can host today's gift: the hub shore plus every open isle.
    areas() {
      const world = this.game.world;
      const list = [{ id: "hub", bounds: { x: 23 * 48, y: 34 * 48, w: 11 * 48, h: 12 * 48 } }];
      for (const isle of world.islands || []) {
        if (world.islandState(isle.id, this.game.progress) === "open") {
          list.push({ id: isle.id, bounds: isle.bounds });
        }
      }
      return list;
    }

    // Deterministic daily spot: seeded by date + area so refreshes are stable.
    spotFor(area) {
      const rng = mulberry32(hashSeed(`${todayStr()}|${area.id}`));
      const ts = 48;
      for (let attempt = 0; attempt < 40; attempt += 1) {
        const tx = Math.floor((area.bounds.x + rng() * area.bounds.w) / ts);
        const ty = Math.floor((area.bounds.y + rng() * area.bounds.h) / ts);
        const type = this.game.world.tileMap.tileAt(tx, ty);
        if (type !== "grass" && type !== "sand") continue;
        if (!this.game.collisionMap.canMoveToRect(tx * ts + 8, ty * ts + 14, 32, 20)) continue;
        return { x: tx * ts, y: ty * ts };
      }
      return null;
    }

    // Rebuild today's gift props (removing yesterday's leftovers first).
    refresh() {
      const world = this.game.world;
      world.props = world.props.filter((prop) => !prop.isGift);
      const collected = this.loadCollected();
      const today = todayStr();
      for (const area of this.areas()) {
        if (collected[area.id] === today) continue;
        const gift = GIFTS[area.id];
        if (!gift) continue;
        const spot = this.spotFor(area);
        if (!spot) continue;
        world.props.push({
          id: `gift-${area.id}`,
          areaId: area.id,
          gift,
          isGift: true,
          assetKey: gift.assetKey,
          x: spot.x,
          y: spot.y,
          width: 40,
          height: 40,
          layer: "object",
          hint: `Pick up: ${gift.label}`,
          dialogue: "",
          sortY: spot.y + 40,
          lockZone: "",
          previewZone: "",
          openZone: "",
          lockIsland: "",
          revealZone: "",
          collider: null,
        });
      }
    }

    collect(prop) {
      const game = this.game;
      const collected = this.loadCollected();
      collected[prop.areaId] = todayStr();
      this.saveCollected(collected);
      const count = game.progress.addGift(prop.gift.id);
      const index = game.world.props.indexOf(prop);
      if (index >= 0) game.world.props.splice(index, 1);
      game.spawnEffect("heart", prop.x + 14, prop.y);
      game.sound.play("seed");
      game.dialogue.open(`You found a ${prop.gift.label.toLowerCase()} (×${count}). ${prop.gift.blurb} It's on the album shelf now.`, 3);
    }

    // Pulsing sparkle over uncollected gifts so they read as findable.
    draw(renderer) {
      const ctx = renderer.ctx;
      const t = this.game.time ? this.game.time.elapsed : 0;
      ctx.save();
      ctx.font = "14px sans-serif";
      for (const prop of this.game.world.props) {
        if (!prop.isGift) continue;
        const pulse = 0.5 + 0.5 * Math.sin(t * 3.4 + prop.x);
        ctx.globalAlpha = 0.55 + 0.45 * pulse;
        ctx.fillStyle = "#fff3b0";
        ctx.fillText("✦", prop.x + prop.width - 6, prop.y - 2 - pulse * 4);
      }
      ctx.restore();
    }
  }

  ns.GIFT_KINDS = GIFTS;
  ns.GiftSystem = GiftSystem;
})(window.MiftahGame || (window.MiftahGame = {}));
