// Placeable-item catalog for the standalone map editor (editor.html).
// Footprint sizes mirror the pixel dimensions already used for these same
// assetKeys in src/world/MapData.js, so what you place here lines up with
// how the game already draws them. `collider` mirrors MapData's prop()
// default ([w*0.18, h*0.62, w*0.64, h*0.28]) unless overridden — set
// collider:false for ground decals/motifs that shouldn't block walking.
(function (ns) {
  const DEFAULT_COLLIDER = (w, h) => [w * 0.18, h * 0.62, w * 0.64, h * 0.28];

  ns.EDITOR_CATALOG = [
    // Buildings
    { key: "buildings.pavilion", label: "Pavilion", category: "Buildings", width: 112, height: 96 },
    { key: "buildings.honeycombHub", label: "Honeycomb Hub", category: "Buildings", width: 128, height: 104 },
    { key: "buildings.barn", label: "Barn", category: "Buildings", width: 128, height: 104 },
    { key: "buildings.stable", label: "Stable", category: "Buildings", width: 128, height: 104 },
    { key: "buildings.dogHouse", label: "Dog House", category: "Buildings", width: 72, height: 72 },
    { key: "buildings.catNook", label: "Cat Nook", category: "Buildings", width: 72, height: 72 },

    // Habitat / feature props
    { key: "props.fountain", label: "Fountain", category: "Features", width: 96, height: 96 },
    { key: "props.matBlue", label: "Geometric Mat", category: "Features", width: 72, height: 48, collider: false },
    { key: "props.doveNestingTree", label: "Dove Nesting Tree", category: "Features", width: 112, height: 112 },
    { key: "props.ababeelPerches", label: "Ababeel Perches", category: "Features", width: 96, height: 96 },
    { key: "props.fishMotif", label: "Fish Motif (ground)", category: "Features", width: 112, height: 72, collider: false },
    { key: "props.spiderGrotto", label: "Spider Grotto", category: "Features", width: 112, height: 96 },
    { key: "props.snakeHabitat", label: "Snake Habitat", category: "Features", width: 112, height: 96 },
    { key: "props.camelSpring", label: "Camel Spring", category: "Features", width: 112, height: 96 },
    { key: "props.elephantGrove", label: "Elephant Grove", category: "Features", width: 128, height: 96 },
    { key: "props.crowOrchard", label: "Crow Orchard", category: "Features", width: 112, height: 96 },

    // Trees
    { key: "props.palm", label: "Palm", category: "Trees", width: 80, height: 96 },
    { key: "props.datePalm", label: "Date Palm", category: "Trees", width: 80, height: 96 },
    { key: "props.tree", label: "Tree", category: "Trees", width: 96, height: 96 },
    { key: "props.orangeTree", label: "Orange Tree", category: "Trees", width: 96, height: 96 },

    // Small decor
    { key: "props.lantern", label: "Lantern", category: "Decor", width: 48, height: 64 },
    { key: "props.bush", label: "Bush", category: "Decor", width: 48, height: 48 },
    { key: "props.flowers", label: "Flowers", category: "Decor", width: 48, height: 48, collider: false },
    { key: "props.flowersPink", label: "Flowers (pink)", category: "Decor", width: 48, height: 48, collider: false },
    { key: "props.flowersPurple", label: "Flowers (purple)", category: "Decor", width: 48, height: 48, collider: false },
    { key: "props.reeds", label: "Reeds", category: "Decor", width: 48, height: 48, collider: false },
    { key: "props.rocks", label: "Rocks", category: "Decor", width: 48, height: 48 },
    { key: "props.barrel", label: "Barrel", category: "Decor", width: 48, height: 48 },
    { key: "props.jar", label: "Jar", category: "Decor", width: 48, height: 48 },
    { key: "props.crate", label: "Crate", category: "Decor", width: 48, height: 48 },
    { key: "props.hay", label: "Hay", category: "Decor", width: 48, height: 48, collider: false },
    { key: "props.lilyPads", label: "Lily Pads", category: "Decor", width: 48, height: 48, collider: false },
    { key: "props.fenceH", label: "Fence (horizontal)", category: "Decor", width: 64, height: 64, collider: false },
    { key: "props.fenceV", label: "Fence (vertical)", category: "Decor", width: 64, height: 64, collider: false },
    { key: "props.pastureGate", label: "Pasture Gate", category: "Decor", width: 96, height: 64 },
    { key: "props.signBee", label: "Sign: Bee", category: "Decor", width: 48, height: 48 },
    { key: "props.signCrop", label: "Sign: Crop", category: "Decor", width: 48, height: 48 },
    { key: "props.signSeed", label: "Sign: Seed", category: "Decor", width: 48, height: 48 },
  ];

  ns.editorDefaultCollider = DEFAULT_COLLIDER;
})(window.MiftahGame || (window.MiftahGame = {}));
