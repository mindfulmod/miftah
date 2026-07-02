(function (ns) {
  const TILE_SIZE = 48;
  const MAP_WIDTH = 58;
  const MAP_HEIGHT = 56;

  function fenceCollider(vertical, width, height) {
    return vertical
      ? [width * 0.39, height * 0.08, width * 0.22, height * 0.84]
      : [width * 0.08, height * 0.48, width * 0.84, height * 0.22];
  }

  function colliderFromOffset(prop, offset) {
    return { x: prop.x + offset[0], y: prop.y + offset[1], w: offset[2], h: offset[3] };
  }

  function normalizeProp(prop) {
    const next = { ...prop };
    if (!next.collider && next.assetKey === "props.fenceH") {
      next.collider = colliderFromOffset(next, fenceCollider(false, next.width, next.height));
    }
    if (!next.collider && next.assetKey === "props.fenceV") {
      next.collider = colliderFromOffset(next, fenceCollider(true, next.width, next.height));
    }
    return next;
  }

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
    // Six biome isles flank it, three per side, each reached by one short
    // horizontal bridge that stays gated until the isle's first animal hatches.
    ellipse(28, 28, 9, 22);    // HUB — tall central spine (x 19-37, y 6-50)
    ellipse(8, 12, 6, 6.5);    // NW — Garden Isle (bee, ant, dove)
    ellipse(8, 28, 6, 6.5);    // W  — Aviary Isle (hoopoe, ababeel, crow)
    ellipse(8, 44, 6, 6.5);    // SW — Wildwood Isle (elephant, camel, fish)
    ellipse(48, 12, 6, 6.5);   // NE — Farmstead Isle (cow, sheep, horse)
    ellipse(48, 28, 6, 6.5);   // E  — Grove Isle (cat, dog)
    ellipse(48, 44, 6, 6.5);   // SE — Grotto Isle (snake, spider)

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

    // ── GROTTO SAND PATCH (SE isle reads as desert) ─────────────────────────────
    ellipse(48, 44, 4.5, 3.5, "sand");

    // ── LAGOON INLET (SW isle, fish habitat) ────────────────────────────────────
    ellipse(6, 46, 3, 2, "lagoon");

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

    // ── FARM (north hub, east of the spine) ─────────────────────────────────────
    rect(30, 14, 5, 9, "grass");      // forced-solid ground: one coherent farm zone
    for (let y = 15; y <= 21; y += 1) { set(31, y, "irrigationV"); set(33, y, "irrigationV"); }
    for (let x = 30; x <= 34; x += 1) { set(x, 16, "irrigationH"); set(x, 20, "irrigationH"); }
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

    // Central spine, arch → dock. One E/W stub per isle feeds each bridge mouth.
    pathLine(28, 10, 28, 47);
    pathLine(8, 12, 27, 12);   // NW stub
    pathLine(8, 28, 27, 28);   // W stub
    pathLine(8, 44, 27, 44);   // SW stub
    pathLine(29, 12, 48, 12);  // NE stub
    pathLine(29, 28, 48, 28);  // E stub
    pathLine(29, 44, 48, 44);  // SE stub

    // ── BRIDGES (2 tiles tall, only over water) ─────────────────────────────────
    function bridge(x0, x1, yTop) {
      for (let x = x0; x <= x1; x += 1) {
        for (let y = yTop; y <= yTop + 1; y += 1) {
          if (get(x, y) === "water" || get(x, y) === "lagoon") set(x, y, "bridgeH");
        }
      }
    }
    bridge(13, 23, 11);   // NW
    bridge(13, 20, 27);   // W
    bridge(13, 23, 43);   // SW
    bridge(33, 43, 11);   // NE
    bridge(36, 43, 27);   // E
    bridge(33, 43, 43);   // SE

    // ── WATER DETAIL ─────────────────────────────────────────────────────────────
    for (const [x, y] of [
      [3, 3], [22, 3], [40, 3], [54, 5], [1, 20], [56, 21], [3, 52], [52, 52], [17, 35], [39, 20],
    ]) if (get(x, y) === "water") set(x, y, "waterRipple");
    for (const [x, y] of [
      [17, 22], [39, 35], [20, 50], [40, 8], [2, 35], [55, 36],
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
        // revealZone: prop stays hidden until that zone's animal hatches.
        revealZone: options.revealZone || "",
      };
      if (options.collider !== false) {
        const c = options.collider || [width * 0.18, height * 0.62, width * 0.64, height * 0.28];
        item.collider = { x: item.x + c[0], y: item.y + c[1], w: c[2], h: c[3] };
      }
      props.push(item);
      return item;
    }

    // Gate across a bridge mouth: one sprite per bridge row plus a single
    // collider covering the whole 2×2-tile crossing. Both sprites and the
    // collider vanish the moment the isle unlocks (lockIsland).
    function gate(id, island, gx, cy) {
      const collider = { x: gx * TILE_SIZE, y: cy * TILE_SIZE, w: 2 * TILE_SIZE, h: 2 * TILE_SIZE };
      for (let row = 0; row < 2; row += 1) {
        props.push({
          id: `${id}-${row}`,
          assetKey: "props.pastureGate",
          x: gx * TILE_SIZE,
          y: (cy + row) * TILE_SIZE - 16,
          width: 96,
          height: 64,
          layer: "object",
          hint: "This bridge is closed — hatch an animal for this isle to open it.",
          dialogue: "The gate is shut. Keep studying at the arch — when an animal hatches for this isle, the bridge opens.",
          sortY: (cy + row) * TILE_SIZE + 48,
          lockIsland: island,
          lockZone: "",
          previewZone: "",
          openZone: "",
          revealZone: "",
          collider: row === 0 ? collider : null,
        });
      }
    }

    // Decorative fence segment (no collider, no hint — frames a pen without
    // trapping anyone or stealing the interaction prompt).
    function fence(id, vertical, tx, ty, revealZone) {
      prop(id, vertical ? "props.fenceV" : "props.fenceH", tx, ty, 48, 48, {
        collider: fenceCollider(vertical, 48, 48),
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
    // Collider-only blocker under the hatchery cradle (the cradle itself is
    // drawn by the Hatchery entity, which has no collider of its own).
    prop("hatchery-base", "", 30, 27, 128, 96, {
      hint: "",
      collider: [10, 44, 100, 34],
    });
    prop("hatchery-mat", "props.matBlue", 26, 29, 72, 48, {
      layer: "ground",
      hint: "A geometric prayer mat",
      collider: false,
    });
    prop("player-home", "buildings.pavilion", 20, 31, 128, 104, {
      hint: "Your home on the island",
      dialogue: "A quiet place to rest and reflect on what you've learned.",
      collider: [18, 55, 88, 38],
    });

    // ── FARM DRESSING ───────────────────────────────────────────────────────────
    prop("crop-sign", "props.signCrop", 30, 13, 48, 48, { hint: "The starter farm", collider: false });
    prop("crate-farm", "props.crate", 34, 14, 48, 48, { hint: "A small crate", collider: false });
    prop("barrel-farm", "props.barrel", 30, 22, 48, 48, { hint: "A rain barrel", collider: false });
    for (const [id, tx, ty] of [
      ["farm-fence-w1", 29, 15], ["farm-fence-w2", 29, 17], ["farm-fence-w3", 29, 19], ["farm-fence-w4", 29, 21],
      ["farm-fence-e1", 35, 15], ["farm-fence-e2", 35, 17], ["farm-fence-e3", 35, 19], ["farm-fence-e4", 35, 21],
    ]) fence(id, true, tx, ty, "");

    // ── BRIDGE GATES (block crossing while the isle is locked) ──────────────────
    gate("gate-nw", "nw", 20, 11);
    gate("gate-w", "w", 17, 27);
    gate("gate-sw", "sw", 20, 43);
    gate("gate-ne", "ne", 35, 11);
    gate("gate-e", "e", 38, 27);
    gate("gate-se", "se", 35, 43);

    // ── HUB CLUE MARKERS (Hades-2-style companion teases, one per isle) ─────────
    for (const [id, key, tx, ty, hint, tease] of [
      ["clue-nw", "props.signBee", 23, 10, "A honeycomb crest",
        "A honeycomb crest is carved into the wood. Something hums softly across the water, and a pale feather is tucked into the frame."],
      ["clue-w", "props.signSeed", 21, 26, "A feather-marked waystone",
        "Three feathers are pinned here — one crested, one swift, one black as ink. The perches across the bridge stand empty… for now."],
      ["clue-sw", "props.signSeed", 23, 45, "A wild carving",
        "The carving shows a great tusk, a spring of sweet water, and a fish beneath lily pads. The wild isle waits for its keepers."],
      ["clue-ne", "props.signCrop", 33, 10, "A farmstead notice",
        "\"Pasture ready — awaiting hooves.\" Fresh hay is already stacked in the barn across the bridge."],
      ["clue-e", "props.signSeed", 35, 26, "A small pawprint plaque",
        "Two little bowls sit beside this plaque, still empty. Pawprints in the dust lead toward the bridge."],
      ["clue-se", "props.signSeed", 33, 45, "A sun-warmed stone",
        "The stone is warm to the touch. Something patient coils in the grotto sands beyond, and silk glints between the rocks."],
    ]) {
      prop(id, key, tx, ty, 48, 48, { hint, dialogue: tease, collider: false });
    }

    // ── NW — GARDEN ISLE (honey: bee + ant, dove) ───────────────────────────────
    prop("honeycomb-hub", "buildings.honeycombHub", 5, 8, 128, 104, {
      hint: "Honeycomb learning hub",
      dialogue: "Golden honey jars surround the quiet honeycomb hub.",
      collider: [16, 52, 84, 38],
      revealZone: "honey",
    });
    prop("dove-tree", "props.doveNestingTree", 9, 10, 112, 112, {
      hint: "A nesting tree",
      dialogue: "A peaceful nesting tree stands in the garden corner.",
      collider: [35, 70, 40, 28],
      revealZone: "dove",
    });
    prop("bee-sign", "props.signBee", 7, 13, 48, 48, { hint: "Honeycomb sign", collider: false, revealZone: "honey" });
    prop("jar-honey", "props.jar", 5, 12, 48, 48, { hint: "A honey jar", collider: false, revealZone: "honey" });
    prop("flowers-nw", "props.flowers", 11, 14, 48, 48, { hint: "Bright flowers", collider: false });
    prop("bush-nw", "props.bush", 6, 14, 48, 48, { hint: "A tidy bush", collider: false });

    // ── W — AVIARY ISLE (aviary: hoopoe + ababeel, orchard: crow) ───────────────
    prop("ababeel-perches", "props.ababeelPerches", 4, 24, 96, 96, {
      hint: "Bird perches for the aviary flock",
      collider: [18, 70, 60, 16],
      revealZone: "aviary",
    });
    prop("crow-orchard", "props.crowOrchard", 9, 29, 112, 96, {
      hint: "A rocky orchard perch",
      collider: [16, 62, 70, 26],
      revealZone: "orchard",
    });
    prop("palm-w", "props.palm", 11, 24, 80, 96, { hint: "Cool shade", collider: [24, 58, 30, 28] });
    prop("rocks-w", "props.rocks", 5, 31, 48, 48, { hint: "Weathered rocks", collider: [8, 28, 32, 16] });

    // ── SW — WILDWOOD ISLE (grove: elephant, spring: camel, lagoon: fish) ───────
    prop("elephant-grove", "props.elephantGrove", 8, 39, 128, 96, {
      hint: "A shaded palm grove",
      collider: [30, 60, 68, 26],
      revealZone: "grove",
    });
    prop("spring-nook", "props.camelSpring", 3, 41, 112, 96, {
      hint: "A cool spring sanctuary",
      dialogue: "The little spring is cool and shaded.",
      collider: [28, 57, 56, 25],
      revealZone: "spring",
    });
    prop("fish-motif", "props.fishMotif", 4, 45, 112, 72, {
      layer: "ground",
      hint: "A fish-shaped lagoon",
      collider: false,
      revealZone: "lagoon",
    });
    prop("reeds-lagoon", "props.reeds", 9, 46, 48, 48, { hint: "Soft reeds", collider: false });
    prop("rocks-lagoon", "props.rocks", 10, 44, 48, 48, { hint: "Shoreline rocks", collider: [8, 28, 32, 16] });
    prop("palm-sw", "props.datePalm", 12, 41, 80, 96, { hint: "Cool shade", collider: [24, 58, 30, 28] });

    // ── NE — FARMSTEAD ISLE (barn: cow, meadow: sheep + horse) ──────────────────
    prop("barn", "buildings.barn", 45, 8, 128, 104, {
      hint: "A cosy barn",
      dialogue: "The barn smells like hay and warm wood.",
      collider: [18, 55, 88, 38],
      revealZone: "barn",
    });
    prop("hay-barn", "props.hay", 48, 11, 48, 48, { hint: "Fresh hay", collider: false, revealZone: "barn" });
    prop("trough-barn", "props.barrel", 46, 12, 48, 48, { hint: "A water trough", collider: false, revealZone: "barn" });
    prop("stable", "buildings.stable", 49, 13, 128, 104, {
      hint: "A blue-roof stable",
      dialogue: "A looped training path circles the meadow.",
      collider: [18, 58, 88, 34],
      revealZone: "meadow",
    });
    fence("meadow-fence-1", false, 45, 13, "meadow");
    fence("meadow-fence-2", false, 46, 13, "meadow");
    fence("meadow-fence-3", false, 47, 13, "meadow");
    fence("meadow-fence-4", true, 44, 14, "meadow");
    fence("meadow-fence-5", true, 44, 15, "meadow");
    prop("hay-stable", "props.hay", 47, 15, 48, 48, { hint: "Fresh hay", collider: false, revealZone: "meadow" });

    // ── E — GROVE ISLE (pets: cat + dog) ────────────────────────────────────────
    prop("dog-house", "buildings.dogHouse", 45, 25, 72, 72, {
      hint: "A small pet shelter",
      collider: [16, 42, 40, 20],
      revealZone: "pets",
    });
    prop("cat-nook", "buildings.catNook", 50, 25, 72, 72, {
      hint: "A sunny cat nook",
      collider: [16, 42, 40, 20],
      revealZone: "pets",
    });
    prop("orange-tree", "props.orangeTree", 47, 30, 96, 96, { hint: "Cool shade", collider: [24, 58, 30, 28] });
    prop("flowers-e", "props.flowers", 44, 28, 48, 48, { hint: "Bright flowers", collider: false });
    prop("bush-e", "props.bush", 51, 29, 48, 48, { hint: "A tidy bush", collider: false });

    // ── SE — GROTTO ISLE (snake, spider) ────────────────────────────────────────
    prop("snake-habitat", "props.snakeHabitat", 49, 40, 112, 96, {
      hint: "A warm sandy habitat",
      collider: [18, 60, 70, 24],
      revealZone: "snake",
    });
    prop("spider-grotto", "props.spiderGrotto", 43, 44, 112, 96, {
      hint: "A shaded grotto",
      collider: [20, 62, 72, 22],
      revealZone: "spider",
    });
    prop("rocks-se-1", "props.rocks", 52, 45, 48, 48, { hint: "Sun-baked rocks", collider: [8, 28, 32, 16] });
    prop("rocks-se-2", "props.rocks", 47, 47, 48, 48, { hint: "Sun-baked rocks", collider: [8, 28, 32, 16] });
    prop("jar-se", "props.jar", 46, 42, 48, 48, { hint: "A clay jar", collider: false });

    // ── HUB PALMS & TREES ───────────────────────────────────────────────────────
    for (const [id, key, tx, ty] of [
      ["palm-hub-n", "props.datePalm", 24, 13],
      ["palm-hub-w", "props.datePalm", 23, 21],
      ["palm-hub-e", "props.palm", 32, 34],
      ["palm-hub-s", "props.palm", 31, 45],
    ]) {
      prop(id, key, tx, ty, 80, 96, {
        hint: "Cool shade",
        collider: [24, 58, 30, 28],
      });
    }

    // ── SMALL HUB DECOR ─────────────────────────────────────────────────────────
    prop("seed-sign", "props.signSeed", 24, 28, 48, 48, { hint: "Seed packets are ready", collider: false });
    prop("flowers-hub-1", "props.flowers", 25, 22, 48, 48, { hint: "Bright flowers", collider: false });
    prop("flowers-hub-2", "props.flowers", 31, 33, 48, 48, { hint: "Bright flowers", collider: false });
    prop("bush-court-1", "props.bush", 24, 30, 48, 48, { hint: "A tidy bush", collider: false });
    prop("bush-court-2", "props.bush", 32, 26, 48, 48, { hint: "A tidy bush", collider: false });

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
        bounds: { x: 2 * TS, y: 5 * TS, w: 13 * TS, h: 14 * TS } },
      { id: "w", label: "Aviary Isle", zones: ["aviary", "orchard"],
        bounds: { x: 2 * TS, y: 21 * TS, w: 13 * TS, h: 14 * TS } },
      { id: "sw", label: "Wildwood Isle", zones: ["grove", "spring", "lagoon"],
        bounds: { x: 2 * TS, y: 37 * TS, w: 13 * TS, h: 14 * TS } },
      { id: "ne", label: "Farmstead Isle", zones: ["barn", "meadow"],
        bounds: { x: 41 * TS, y: 5 * TS, w: 14 * TS, h: 14 * TS } },
      { id: "e", label: "Grove Isle", zones: ["pets"],
        bounds: { x: 41 * TS, y: 21 * TS, w: 14 * TS, h: 14 * TS } },
      { id: "se", label: "Grotto Isle", zones: ["snake", "spider"],
        bounds: { x: 41 * TS, y: 37 * TS, w: 14 * TS, h: 14 * TS } },
    ];

    return {
      tileSize: TILE_SIZE,
      width: MAP_WIDTH,
      height: MAP_HEIGHT,
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
          waypoints: [[28, 47], [28, 43], [27, 45]],
          nightDialogue: "The lanterns are lit and the water has gone quiet. A calm night for study.",
          dialogues: [
            { min: 0, text: "Welcome. Follow the path north to the fountain plaza, then study at the arch. Six isles wait beyond the bridges." },
            { min: 1, text: "I heard something hatch by the plaza! The bridges open one by one as the animals arrive." },
            { min: 5, text: "The island hums these days — hooves, wings, little footsteps. Your study did all of this." },
            { min: 16, text: "Every keeper is home. I remember when this was one quiet dock and an empty arch." },
          ],
        },
        {
          assetIndex: 1,
          x: 26 * TILE_SIZE,
          y: 13 * TILE_SIZE,
          hint: "A scholar",
          waypoints: [[26, 13], [29, 13], [28, 15]],
          nightDialogue: "I read best at night, under the arch light. The words settle like the fireflies do.",
          dialogues: [
            { min: 0, text: "Each isle stays bridged-shut until one of its animals hatches. The signs by each bridge hint at who will live there." },
            { min: 3, text: "Three keepers already! Notice how the words that hatch them keep coming back to you — that's no accident." },
            { min: 8, text: "Half the isles wake, and you've barely noticed how much Arabic you can read now. That's how it should feel." },
          ],
        },
        {
          assetIndex: 2,
          x: 35 * TILE_SIZE,
          y: 18 * TILE_SIZE,
          hint: "A farm keeper",
          waypoints: [[35, 18], [35, 22], [33, 23]],
          nightDialogue: "Crops rest at night, and so should you — after one more ayah, maybe.",
          dialogues: [
            { min: 0, text: "Water your crops with patience. Seeds come from study, harvest feeds the animals." },
            { min: 4, text: "More mouths to feed now — keep the harvest coming and they'll grow up strong." },
          ],
        },
      ],
    };
  }

  // Merges editor-authored placements (from src/world/mapOverrides.json) onto a
  // freshly generated map. Older override files append editor props; newer
  // production editor saves replace the whole prop layer so every placed item,
  // including MapData-authored props, can be moved and persisted.
  function applyMapOverrides(mapData, overrides) {
    if (!overrides) return mapData;
    if (overrides.replaceProps && Array.isArray(overrides.props)) {
      mapData.props = overrides.props.map(normalizeProp);
      return mapData;
    }
    if (Array.isArray(overrides.props) && overrides.props.length) {
      const tagged = overrides.props.map((prop) => ({ ...normalizeProp(prop), fromOverride: true }));
      mapData.props = mapData.props.concat(tagged);
    }
    return mapData;
  }

  ns.TILE_SIZE = TILE_SIZE;
  ns.createMapData = createMapData;
  ns.applyMapOverrides = applyMapOverrides;
})(window.MiftahGame || (window.MiftahGame = {}));
