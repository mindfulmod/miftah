(function (ns) {
  const tile = 48;

  function habitat(tx, ty, tw, th) {
    return { x: tx * tile, y: ty * tile, w: tw * tile, h: th * tile };
  }

  function spawn(tx, ty) {
    return { x: tx * tile, y: ty * tile };
  }

  // Animals live on four biome islands flanking the central hub. Each island is
  // fully land-bounded (the fish is the one aquatic exception), and every set of
  // bounds below sits inside its island's interior so wandering never reaches the
  // shoreline. The Animal walkability clamp is a second line of defence.
  //
  //   NW "Garden Isle"   — honey (bee, ant) + dove
  //   NE "Farmstead Isle"— aviary (hoopoe, ababeel) + barn (cow) + meadow (horse, sheep)
  //   SW "Wildwood Isle" — orchard (crow) + spring (camel) + grove (elephant) + lagoon (fish)
  //   SE "Wilds Isle"    — pets (cat, dog) + snake + spider

  ns.ANIMAL_CATALOG = [
    // ── NW: Garden Isle ───────────────────────────────────────────────────────
    {
      id: "bee", zone: "honey", name: "Bee", habitat: "Honeycomb hub",
      spawn: spawn(7, 12), bounds: habitat(4, 10, 10, 7),
      feedToYoung: 2, feedToAdult: 4,
    },
    {
      id: "ant", zone: "honey", name: "Ant", habitat: "Honeycomb garden",
      spawn: spawn(9, 14), bounds: habitat(4, 10, 10, 7),
      feedToYoung: 2, feedToAdult: 4,
    },
    {
      id: "dove", zone: "dove", name: "Dove", habitat: "Nesting tree",
      spawn: spawn(10, 12), bounds: habitat(6, 10, 8, 7),
      feedToYoung: 2, feedToAdult: 4,
    },
    // ── NE: Farmstead Isle ────────────────────────────────────────────────────
    {
      id: "hoopoe", zone: "aviary", name: "Hoopoe", habitat: "Aviary perches",
      spawn: spawn(44, 11), bounds: habitat(42, 9, 12, 5),
      feedToYoung: 2, feedToAdult: 4,
    },
    {
      id: "ababeel", zone: "aviary", name: "Ababeel", habitat: "Aviary perches",
      spawn: spawn(43, 10), bounds: habitat(42, 9, 12, 5),
      feedToYoung: 2, feedToAdult: 4,
    },
    {
      id: "cow", zone: "barn", name: "Cow", habitat: "Barn pasture",
      spawn: spawn(50, 11), bounds: habitat(46, 9, 8, 5),
      feedToYoung: 2, feedToAdult: 4,
    },
    {
      id: "horse", zone: "meadow", name: "Horse", habitat: "Blue-roof stable meadow",
      spawn: spawn(45, 17), bounds: habitat(42, 15, 12, 4),
      feedToYoung: 2, feedToAdult: 4,
    },
    {
      id: "sheep", zone: "meadow", name: "Sheep", habitat: "Blue-roof stable meadow",
      spawn: spawn(48, 17), bounds: habitat(42, 15, 12, 4),
      feedToYoung: 2, feedToAdult: 4,
    },
    // ── SW: Wildwood Isle ─────────────────────────────────────────────────────
    {
      id: "crow", zone: "orchard", name: "Crow", habitat: "Rocky orchard",
      spawn: spawn(11, 39), bounds: habitat(8, 38, 6, 5),
      feedToYoung: 2, feedToAdult: 4,
    },
    {
      id: "camel", zone: "spring", name: "She-camel", habitat: "Spring sanctuary",
      spawn: spawn(6, 41), bounds: habitat(4, 39, 6, 4),
      feedToYoung: 2, feedToAdult: 4,
    },
    {
      id: "elephant", zone: "grove", name: "Elephant", habitat: "Palm grove",
      spawn: spawn(11, 43), bounds: habitat(8, 42, 6, 4),
      feedToYoung: 2, feedToAdult: 4,
    },
    {
      id: "fish", zone: "lagoon", name: "Fish", habitat: "Deep lagoon",
      spawn: spawn(6, 45), bounds: habitat(3, 43, 6, 4), aquatic: true,
      feedToYoung: 2, feedToAdult: 4,
    },
    // ── SE: Wilds Isle ────────────────────────────────────────────────────────
    {
      id: "cat", zone: "pets", name: "Cat", habitat: "Pet shelter",
      spawn: spawn(47, 40), bounds: habitat(44, 38, 9, 4),
      feedToYoung: 2, feedToAdult: 4,
    },
    {
      id: "dog", zone: "pets", name: "Dog", habitat: "Pet shelter",
      spawn: spawn(45, 41), bounds: habitat(44, 38, 9, 4),
      feedToYoung: 2, feedToAdult: 4,
    },
    {
      id: "snake", zone: "snake", name: "Snake", habitat: "Warm sandy habitat",
      spawn: spawn(50, 44), bounds: habitat(46, 42, 7, 4),
      feedToYoung: 2, feedToAdult: 4,
    },
    {
      id: "spider", zone: "spider", name: "Spider", habitat: "Shaded grotto",
      spawn: spawn(45, 44), bounds: habitat(43, 42, 6, 4),
      feedToYoung: 2, feedToAdult: 4,
    },
  ];
})(window.MiftahGame || (window.MiftahGame = {}));
