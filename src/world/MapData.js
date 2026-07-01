(function (ns) {
  const TILE_SIZE = 48;
  const MAP_WIDTH = 58;
  const MAP_HEIGHT = 56;

  function createMapData() {
    const tiles = Array.from({ length: MAP_HEIGHT }, () =>
      Array.from({ length: MAP_WIDTH }, () => "water")
    );
    const props = [];
    const farmPlots = [];
    // Player arrives at the south dock and walks north into the hub.
    const spawn = { x: 28 * TILE_SIZE, y: 52 * TILE_SIZE };

    const inBounds = (x, y) => x >= 0 && y >= 0 && x < MAP_WIDTH && y < MAP_HEIGHT;
    const set = (x, y, type) => { if (inBounds(x, y)) tiles[y][x] = type; };
    const get = (x, y) => (inBounds(x, y) ? tiles[y][x] : "water");

    function ellipse(cx, cy, rx, ry, type = "grass") {
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y += 1) {
        for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x += 1) {
          const dx = (x - cx) / rx;
          const dy = (y - cy) / ry;
          if (dx * dx + dy * dy <= 1) set(x, y, type);
        }
      }
    }

    function rect(x, y, w, h, type = "grass") {
      for (let yy = y; yy < y + h; yy += 1)
        for (let xx = x; xx < x + w; xx += 1) set(xx, yy, type);
    }

    // ── ISLANDS ────────────────────────────────────────────────────────────────
    // A central vertical hub island holds every always-available activity.
    // Four equally-sized biome islands flank it (two west, two east), each reached
    // by one short horizontal bridge that stays gated until that biome's first
    // animal hatches. The N/S pairs are pulled in close to the hub so the lagoon
    // between them reads as a tight archipelago rather than open sea.
    ellipse(28, 28, 9, 22);   // HUB — tall central spine (x ~19-37, y ~6-50)
    ellipse(9, 18, 7, 8);     // NW island — honey + dove
    ellipse(9, 38, 7, 8);     // SW island — orchard + spring + grove + lagoon
    ellipse(48, 18, 7, 8);    // NE island — aviary + barn + meadow
    ellipse(48, 38, 7, 8);    // SE island — pets + snake + spider

    // ── SAND SHORELINE ──────────────────────────────────────────────────────────
    const edgeChanges = [];
    for (let y = 0; y < MAP_HEIGHT; y += 1) {
      for (let x = 0; x < MAP_WIDTH; x += 1) {
        if (get(x, y) !== "grass") continue;
        const touchesWater = [
          get(x - 1, y), get(x + 1, y), get(x, y - 1), get(x, y + 1),
          get(x - 1, y - 1), get(x + 1, y - 1), get(x - 1, y + 1), get(x + 1, y + 1),
        ].some((t) => t === "water");
        if (touchesWater) edgeChanges.push([x, y]);
      }
    }
    for (const [x, y] of edgeChanges) set(x, y, "sand");

    // ── LAGOON INLET (SW island, fish habitat) ──────────────────────────────────
    ellipse(5, 42, 3, 2, "lagoon");

    // ── CENTRAL COURTYARD (fountain plaza) ──────────────────────────────────────
    for (let y = 24; y <= 32; y += 1) {
      for (let x = 24; x <= 32; x += 1) {
        const dx = x - 28;
        const dy = y - 28;
        if (dx * dx + dy * dy <= 13) set(x, y, "courtyard");
      }
    }
    set(28, 28, "courtyardStar");

    // ── SOUTH DOCK (arrival platform) ───────────────────────────────────────────
    rect(26, 48, 5, 6, "courtyard");
    set(28, 54, "dock");
    set(28, 55, "dock");

    // ── FARM (north hub, 2 cols × 3 rows = 6 plots) ─────────────────────────────
    rect(30, 14, 5, 9, "grass");      // solid ground east of the central path
    for (let y = 15; y <= 21; y += 1) { set(31, y, "irrigationV"); set(33, y, "irrigationV"); }
    for (let x = 30; x <= 34; x += 1) { set(x, 16, "irrigationH"); set(x, 20, "irrigationH"); }
    for (const [px, py] of [
      [32, 15], [32, 15],
      [32, 18], [32, 18],
      [32, 21], [32, 21],
    ]) {
      // (dedup below) — explicit plot list keeps farming data stable
    }
    for (const [px, py, kind] of [
      [32, 15, "wheat"], [32, 17, "leafy"],
      [32, 19, "berries"], [32, 21, "carrot"],
      [30, 18, "datePalm"], [34, 18, "wheat"],
    ]) {
      farmPlots.push({ x: px * TILE_SIZE, y: py * TILE_SIZE, kind });
    }

    // ── PATHS ───────────────────────────────────────────────────────────────────
    function pathLine(x0, y0, x1, y1) {
      const dx = Math.abs(x1 - x0);
      const dy = Math.abs(y1 - y0);
      const sx = x0 < x1 ? 1 : -1;
      const sy = y0 < y1 ? 1 : -1;
      let err = dx - dy;
      let x = x0;
      let y = y0;
      while (true) {
        const current = get(x, y);
        if (current === "water" || current === "lagoon")
          set(x, y, dx >= dy ? "bridgeH" : "bridgeV");
        else if (current !== "courtyard" && current !== "courtyardStar" && current !== "dock")
          set(x, y, "path");
        if (x === x1 && y === y1) break;
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x += sx; }
        if (e2 < dx)  { err += dx; y += sy; }
      }
    }

    // Central spine, dock → reading arch. E/W stubs feed each bridge mouth.
    pathLine(28, 10, 28, 50);
    pathLine(21, 18, 36, 18);
    pathLine(21, 38, 36, 38);

    // ── BRIDGES (2 tiles tall, only over water) ─────────────────────────────────
    function bridge(x0, x1, yTop) {
      for (let x = x0; x <= x1; x += 1) {
        for (let y = yTop; y <= yTop + 1; y += 1) {
          if (get(x, y) === "water" || get(x, y) === "lagoon") set(x, y, "bridgeH");
        }
      }
    }
    bridge(16, 20, 17);   // NW
    bridge(16, 20, 38);   // SW
    bridge(36, 40, 17);   // NE
    bridge(36, 40, 38);   // SE

    // ── WATER DETAIL ─────────────────────────────────────────────────────────────
    for (const [x, y] of [
      [3, 4], [22, 3], [40, 3], [54, 5], [1, 28], [56, 24], [3, 52], [52, 52],
    ]) if (get(x, y) === "water") set(x, y, "waterRipple");
    for (const [x, y] of [
      [18, 28], [38, 28], [20, 50], [40, 9], [2, 28], [55, 28],
    ]) if (get(x, y) === "water") set(x, y, "lilyWater");

    // ── PROP HELPER ───────────────────────────────────────────────────────────────
    function prop(id, assetKey, tx, ty, width, height, options = {}) {
      const item = {
        id,
        assetKey,
        x: tx * TILE_SIZE + (options.offsetX || 0),
        y: ty * TILE_SIZE + (options.offsetY || 0),
        width,
        height,
        layer: options.layer || "object",
        hint: options.hint || "",
        dialogue: options.dialogue || options.hint || "",
        sortY: ty * TILE_SIZE + (options.sortOffsetY || height),
        lockZone: options.lockZone || "",
        previewZone: options.previewZone || "",
        openZone: options.openZone || "",
        lockIsland: options.lockIsland || "",
        // revealZone: prop stays hidden until that biome zone's animal hatches.
        revealZone: options.revealZone || "",
      };
      if (options.collider !== false) {
        const c = options.collider || [width * 0.18, height * 0.62, width * 0.64, height * 0.28];
        item.collider = { x: item.x + c[0], y: item.y + c[1], w: c[2], h: c[3] };
      }
      props.push(item);
      return item;
    }

    // Gate prop: closed across a bridge mouth, removed once the island unlocks.
    // colliderRect is in tile units [tx, ty, tw(t), th(t)] covering the opening.
    function gate(id, island, tx, ty, colliderTiles) {
      const [cx, cy, cw, ch] = colliderTiles;
      props.push({
        id,
        assetKey: "props.pastureGate",
        x: tx * TILE_SIZE,
        y: ty * TILE_SIZE,
        width: 48,
        height: 64,
        layer: "object",
        hint: "This bridge is closed — hatch an animal here to open it.",
        dialogue: "The gate is shut. Keep studying — when an animal hatches for this isle, the bridge opens.",
        sortY: ty * TILE_SIZE + 64,
        lockIsland: island,
        lockZone: "",
        previewZone: "",
        openZone: "",
        revealZone: "",
        collider: { x: cx * TILE_SIZE, y: cy * TILE_SIZE, w: cw * TILE_SIZE, h: ch * TILE_SIZE },
      });
    }

    // Decorative fence segment (no collider — frames a pen without trapping anyone).
    function fence(id, vertical, tx, ty, revealZone) {
      prop(id, vertical ? "props.fenceV" : "props.fenceH", tx, ty, 48, 48, {
        hint: "A wooden fence",
        collider: false,
        revealZone: revealZone || "",
        layer: "object",
      });
    }

    // ── HUB — core activities (always available) ────────────────────────────────
    prop("reading-arch", "buildings.readingArch", 27, 8, 128, 128, {
      hint: "Study at the Reading Archway",
      dialogue: "The arch glows softly around an open-book symbol. Step through to study.",
      collider: [8, 96, 24, 24],
    });
    prop("central-fountain", "props.fountain", 26, 25, 96, 96, {
      hint: "Cool clear water",
      collider: [22, 52, 52, 25],
    });
    prop("hatchery-mat", "props.matBlue", 27, 28, 72, 48, {
      layer: "ground",
      hint: "The hatchery mat",
      collider: false,
    });
    prop("player-home", "buildings.pavilion", 20, 31, 128, 104, {
      hint: "Your home on the island",
      dialogue: "A quiet place to rest and reflect on what you've learned.",
      collider: [18, 55, 88, 38],
    });

    // ── NW ISLAND — honey (bee, ant) + dove ─────────────────────────────────────
    prop("honeycomb-hub", "buildings.honeycombHub", 3, 14, 128, 104, {
      hint: "Honeycomb learning hub",
      dialogue: "Golden honey jars surround the quiet honeycomb hub.",
      collider: [16, 52, 84, 38],
      revealZone: "honey",
    });
    prop("dove-tree", "props.doveNestingTree", 10, 13, 112, 112, {
      hint: "A nesting tree",
      dialogue: "A peaceful nesting tree stands in the garden corner.",
      collider: [35, 70, 40, 28],
      revealZone: "dove",
    });

    // ── NE ISLAND — aviary (hoopoe, ababeel) + barn (cow) + meadow (horse, sheep)
    // A proper little farmstead: aviary perches up top, a barn-and-pen in the
    // middle, and a fenced stable meadow below. Each piece appears as its animal
    // hatches, so the farm visibly grows.
    prop("ababeel-perches", "props.ababeelPerches", 45, 11, 96, 96, {
      hint: "Bird perches for the aviary flock",
      collider: [18, 70, 60, 16],
      revealZone: "aviary",
    });
    prop("barn", "buildings.barn", 47, 14, 128, 104, {
      hint: "A cosy barn",
      dialogue: "The barn smells like hay and warm wood.",
      collider: [18, 55, 88, 38],
      revealZone: "barn",
    });
    // Barn pen — a corner paddock beside the barn.
    fence("barn-fence-1", false, 43, 15, "barn");
    fence("barn-fence-2", false, 44, 15, "barn");
    fence("barn-fence-3", false, 45, 15, "barn");
    fence("barn-fence-4", true, 43, 16, "barn");
    fence("barn-fence-5", true, 43, 17, "barn");
    prop("hay-barn", "props.hay", 50, 16, 48, 48, { hint: "Fresh hay", collider: false, revealZone: "barn" });
    prop("trough-barn", "props.barrel", 45, 17, 48, 48, { hint: "A water trough", collider: false, revealZone: "barn" });

    prop("stable", "buildings.stable", 44, 20, 128, 104, {
      hint: "A blue-roof stable",
      dialogue: "A looped training path circles the meadow.",
      collider: [18, 58, 88, 34],
      revealZone: "meadow",
    });
    // Meadow paddock — a fenced run for the horse and sheep.
    fence("meadow-fence-1", false, 48, 23, "meadow");
    fence("meadow-fence-2", false, 49, 23, "meadow");
    fence("meadow-fence-3", false, 50, 23, "meadow");
    fence("meadow-fence-4", true, 51, 21, "meadow");
    fence("meadow-fence-5", true, 51, 22, "meadow");
    prop("hay-stable", "props.hay", 48, 21, 48, 48, { hint: "Fresh hay", collider: false, revealZone: "meadow" });

    // ── SW ISLAND — orchard (crow) + spring (camel) + grove (elephant) + lagoon (fish)
    prop("crow-orchard", "props.crowOrchard", 10, 33, 112, 96, {
      hint: "A rocky orchard perch",
      collider: [16, 62, 70, 26],
      revealZone: "orchard",
    });
    prop("spring-nook", "props.camelSpring", 3, 34, 112, 96, {
      hint: "A cool spring sanctuary",
      dialogue: "The little spring is cool and shaded.",
      collider: [28, 57, 56, 25],
      revealZone: "spring",
    });
    prop("elephant-grove", "props.elephantGrove", 9, 40, 128, 96, {
      hint: "A shaded palm grove",
      collider: [30, 60, 68, 26],
      revealZone: "grove",
    });
    prop("fish-motif", "props.fishMotif", 3, 40, 112, 72, {
      layer: "ground",
      hint: "A fish-shaped lagoon",
      collider: false,
      revealZone: "lagoon",
    });

    // ── SE ISLAND — pets (cat, dog) + snake + spider ────────────────────────────
    prop("dog-house", "buildings.dogHouse", 44, 33, 72, 72, {
      hint: "A small pet shelter",
      collider: [16, 42, 40, 20],
      revealZone: "pets",
    });
    prop("cat-nook", "buildings.catNook", 49, 33, 72, 72, {
      hint: "A sunny cat nook",
      collider: [16, 42, 40, 20],
      revealZone: "pets",
    });
    prop("snake-habitat", "props.snakeHabitat", 49, 40, 112, 96, {
      hint: "A warm sandy habitat",
      collider: [18, 60, 70, 24],
      revealZone: "snake",
    });
    prop("spider-grotto", "props.spiderGrotto", 43, 41, 112, 96, {
      hint: "A shaded grotto",
      collider: [20, 62, 72, 22],
      revealZone: "spider",
    });

    // ── BRIDGE GATES (block crossing while the island is locked) ─────────────────
    gate("gate-nw", "nw", 19, 16, [19, 17, 2, 2]);
    gate("gate-sw", "sw", 19, 37, [19, 38, 2, 2]);
    gate("gate-ne", "ne", 37, 16, [37, 17, 2, 2]);
    gate("gate-se", "se", 37, 37, [37, 38, 2, 2]);

    // ── PALMS & TREES ────────────────────────────────────────────────────────────
    for (const [id, key, tx, ty] of [
      ["palm-hub-n", "props.datePalm", 24, 12],
      ["palm-hub-s", "props.palm", 31, 45],
      ["palm-nw", "props.palm", 13, 12],
      ["palm-ne", "props.datePalm", 52, 12],
      ["palm-sw", "props.datePalm", 13, 41],
      ["palm-se", "props.palm", 53, 35],
      ["orange-tree", "props.orangeTree", 13, 35],
    ]) {
      prop(id, key, tx, ty, key.includes("Tree") || key.includes("tree") ? 96 : 80, 96, {
        hint: "Cool shade",
        collider: [24, 58, 30, 28],
      });
    }

    // ── SMALL DECOR PROPS ─────────────────────────────────────────────────────────
    for (const [id, key, tx, ty, hint, reveal] of [
      ["crop-sign", "props.signCrop", 35, 14, "Carrot garden", ""],
      ["seed-sign", "props.signSeed", 30, 28, "Seed packets are ready", ""],
      ["bee-sign", "props.signBee", 5, 16, "Honeycomb sign", "honey"],
      ["crate-farm", "props.crate", 34, 15, "A small crate", ""],
      ["jar-honey", "props.jar", 4, 16, "A honey jar", "honey"],
      ["barrel-nw", "props.barrel", 12, 16, "A wooden barrel", ""],
      ["reeds-lagoon", "props.reeds", 7, 43, "Soft reeds", "lagoon"],
      ["rocks-lagoon", "props.rocks", 8, 41, "Shoreline rocks", ""],
      ["flowers-hub-1", "props.flowers", 25, 22, "Bright flowers", ""],
      ["flowers-hub-2", "props.flowers", 31, 33, "Bright flowers", ""],
      ["bush-court-1", "props.bush", 24, 30, "A tidy bush", ""],
      ["bush-court-2", "props.bush", 32, 26, "A tidy bush", ""],
    ]) {
      prop(id, key, tx, ty, 48, 48, {
        hint,
        revealZone: reveal,
        collider: key.includes("rocks") ? [8, 28, 32, 16] : false,
      });
    }

    // ── LANTERNS framing the courtyard + arch ────────────────────────────────────
    for (const [id, tx, ty] of [
      ["lantern-nw", 24, 24], ["lantern-ne", 32, 24],
      ["lantern-sw", 24, 32], ["lantern-se", 32, 32],
      ["lantern-arch-l", 26, 11], ["lantern-arch-r", 31, 11],
    ]) {
      prop(id, "props.lantern", tx, ty, 48, 64, {
        hint: "A golden lantern",
        collider: [18, 38, 12, 20],
      });
    }

    // ── ISLANDS metadata: gating unit + tint bounds (world px) ───────────────────
    const TS = TILE_SIZE;
    const islands = [
      { id: "nw", label: "Garden Isle", zones: ["honey", "dove"],
        bounds: { x: 2 * TS, y: 10 * TS, w: 15 * TS, h: 17 * TS } },
      { id: "ne", label: "Farmstead Isle", zones: ["aviary", "barn", "meadow"],
        bounds: { x: 40 * TS, y: 10 * TS, w: 16 * TS, h: 17 * TS } },
      { id: "sw", label: "Wildwood Isle", zones: ["orchard", "spring", "grove", "lagoon"],
        bounds: { x: 2 * TS, y: 30 * TS, w: 15 * TS, h: 17 * TS } },
      { id: "se", label: "Wilds Isle", zones: ["pets", "snake", "spider"],
        bounds: { x: 40 * TS, y: 30 * TS, w: 16 * TS, h: 17 * TS } },
    ];

    return {
      tileSize: TILE_SIZE,
      width: MAP_WIDTH,
      height: MAP_HEIGHT,
      backgroundAssetKey: "world.backdrop",
      tiles,
      props,
      farmPlots,
      spawn,
      islands,
      animalSpawns: [],
      npcs: [
        {
          assetIndex: 0,
          x: 28 * TILE_SIZE,
          y: 47 * TILE_SIZE,
          hint: "Welcome to the island",
          dialogue: "Welcome. Follow the path north to the fountain, then study at the arch to open the outer isles.",
        },
        {
          assetIndex: 1,
          x: 31 * TILE_SIZE,
          y: 11 * TILE_SIZE,
          hint: "A scholar",
          dialogue: "Each outer isle stays bridged-shut until one of its animals hatches. Study at the arch to earn eggs.",
        },
        {
          assetIndex: 2,
          x: 33 * TILE_SIZE,
          y: 17 * TILE_SIZE,
          hint: "A farm keeper",
          dialogue: "Water your crops with patience. Seeds come from study, harvest feeds the animals.",
        },
      ],
    };
  }

  // Merges editor-authored placements (from src/world/mapOverrides.json) onto a
  // freshly generated map. Override props are already fully-formed (id,
  // assetKey, x/y in world px, width, height, collider, etc — see
  // editor.js's buildOverrideProp), so this is a plain append, not a
  // re-derivation of the built-in prop()/gate()/fence() helpers above.
  function applyMapOverrides(mapData, overrides) {
    if (!overrides) return mapData;
    if (Array.isArray(overrides.props) && overrides.props.length) {
      // Tag so EditModeSystem (in-game editor) can tell override-authored
      // props apart from the hand-built base map props when deciding what
      // subset to re-save. alwaysDraw is required too: the real game's
      // Renderer.shouldDrawProp() assumes ordinary props are already baked
      // into the painted world.backdrop image and skips drawing them each
      // frame — override props are genuinely new content, not baked into
      // that backdrop, so without this flag they'd be invisible (though
      // still interactive/collidable) after a save + refresh.
      const tagged = overrides.props.map((prop) => ({ ...prop, fromOverride: true, alwaysDraw: true }));
      mapData.props = mapData.props.concat(tagged);
    }
    return mapData;
  }

  ns.TILE_SIZE = TILE_SIZE;
  ns.createMapData = createMapData;
  ns.applyMapOverrides = applyMapOverrides;
})(window.MiftahGame || (window.MiftahGame = {}));
