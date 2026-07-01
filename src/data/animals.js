(function (ns) {
  const tile = 48;

  function habitat(tx, ty, tw, th) {
    return { x: tx * tile, y: ty * tile, w: tw * tile, h: th * tile };
  }

  function spawn(tx, ty) {
    return { x: tx * tile, y: ty * tile };
  }

  // Animals live on six biome isles flanking the central hub (see
  // docs/map-spec.md). Every set of bounds sits inside its isle's interior so
  // wandering never reaches the shoreline; the Animal walkability clamp is a
  // second line of defence. The fish is the one aquatic exception, bound to
  // the SW lagoon.
  //
  //   NW "Garden Isle"    — honey (bee, ant) + dove
  //   W  "Aviary Isle"    — aviary (hoopoe, ababeel) + orchard (crow)
  //   SW "Wildwood Isle"  — grove (elephant) + spring (camel) + lagoon (fish)
  //   NE "Farmstead Isle" — barn (cow) + meadow (sheep, horse)
  //   E  "Grove Isle"     — pets (cat, dog)
  //   SE "Grotto Isle"    — snake + spider

  ns.ANIMAL_CATALOG = [
    // ── NW: Garden Isle ───────────────────────────────────────────────────────
    {
      id: "bee", zone: "honey", name: "Bee", habitat: "Honeycomb garden",
      spawn: spawn(7, 12), bounds: habitat(4, 10, 8, 5),
      feedToYoung: 2, feedToAdult: 4,
    },
    {
      id: "ant", zone: "honey", name: "Ant", habitat: "Honeycomb garden",
      spawn: spawn(9, 13), bounds: habitat(4, 10, 8, 5),
      feedToYoung: 2, feedToAdult: 4,
    },
    {
      id: "dove", zone: "dove", name: "Dove", habitat: "Nesting tree",
      spawn: spawn(10, 12), bounds: habitat(6, 10, 7, 5),
      feedToYoung: 2, feedToAdult: 4,
    },
    // ── W: Aviary Isle ────────────────────────────────────────────────────────
    {
      id: "hoopoe", zone: "aviary", name: "Hoopoe", habitat: "Aviary perches",
      spawn: spawn(6, 26), bounds: habitat(4, 24, 8, 4),
      feedToYoung: 2, feedToAdult: 4,
    },
    {
      id: "ababeel", zone: "aviary", name: "Ababeel", habitat: "Aviary perches",
      spawn: spawn(8, 25), bounds: habitat(4, 24, 8, 4),
      feedToYoung: 2, feedToAdult: 4,
    },
    {
      id: "crow", zone: "orchard", name: "Crow", habitat: "Rocky orchard",
      spawn: spawn(10, 30), bounds: habitat(6, 29, 7, 4),
      feedToYoung: 2, feedToAdult: 4,
    },
    // ── SW: Wildwood Isle ─────────────────────────────────────────────────────
    {
      id: "elephant", zone: "grove", name: "Elephant", habitat: "Palm grove",
      spawn: spawn(9, 42), bounds: habitat(6, 41, 6, 3),
      feedToYoung: 2, feedToAdult: 4,
    },
    {
      id: "camel", zone: "spring", name: "She-camel", habitat: "Spring sanctuary",
      spawn: spawn(5, 44), bounds: habitat(3, 42, 5, 3),
      feedToYoung: 2, feedToAdult: 4,
    },
    {
      id: "fish", zone: "lagoon", name: "Fish", habitat: "Deep lagoon",
      spawn: spawn(6, 46), bounds: habitat(4, 44, 5, 3), aquatic: true,
      feedToYoung: 2, feedToAdult: 4,
    },
    // ── NE: Farmstead Isle ────────────────────────────────────────────────────
    {
      id: "cow", zone: "barn", name: "Cow", habitat: "Barn pasture",
      spawn: spawn(46, 11), bounds: habitat(44, 10, 8, 4),
      feedToYoung: 2, feedToAdult: 4,
    },
    {
      id: "horse", zone: "meadow", name: "Horse", habitat: "Stable meadow",
      spawn: spawn(46, 15), bounds: habitat(45, 13, 7, 4),
      feedToYoung: 2, feedToAdult: 4,
    },
    {
      id: "sheep", zone: "meadow", name: "Sheep", habitat: "Stable meadow",
      spawn: spawn(48, 14), bounds: habitat(45, 13, 7, 4),
      feedToYoung: 2, feedToAdult: 4,
    },
    // ── E: Grove Isle ─────────────────────────────────────────────────────────
    {
      id: "cat", zone: "pets", name: "Cat", habitat: "Sunny cat nook",
      spawn: spawn(50, 28), bounds: habitat(44, 26, 9, 4),
      feedToYoung: 2, feedToAdult: 4,
    },
    {
      id: "dog", zone: "pets", name: "Dog", habitat: "Pet shelter",
      spawn: spawn(46, 28), bounds: habitat(44, 26, 9, 4),
      feedToYoung: 2, feedToAdult: 4,
    },
    // ── SE: Grotto Isle ───────────────────────────────────────────────────────
    {
      id: "snake", zone: "snake", name: "Snake", habitat: "Warm sandy habitat",
      spawn: spawn(49, 44), bounds: habitat(46, 43, 6, 3),
      feedToYoung: 2, feedToAdult: 4,
    },
    {
      id: "spider", zone: "spider", name: "Spider", habitat: "Shaded grotto",
      spawn: spawn(46, 47), bounds: habitat(44, 46, 7, 2),
      feedToYoung: 2, feedToAdult: 4,
    },
  ];
})(window.MiftahGame || (window.MiftahGame = {}));
