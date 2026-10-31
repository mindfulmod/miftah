/* Render recipes for the Letter Garden game-art review contact sheet.
   Load after letters.html's script chain. Each draw returns a standalone SVG string. */
(() => {
  const ns = window.MiftahGame;
  const recipes = [];
  const add = (id, family, draw) => recipes.push({ id, family, draw });
  const friend = () => {
    const c = ns.LetterFriends?.CHARS?.[0] || Object.keys(ns.LetterFriends?.FRIENDS || {})[0] || "ب";
    return ns.LetterFriends?.art?.(c, { size: 100 }) || `<text x="50" y="65" text-anchor="middle" font-size="48">ب</text>`;
  };
  const item = { id: "بَ", display: "بَ", glyph: "بَ", letter: "بَ", marks: "َ" };
  const svg = (vb, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" aria-hidden="true">${body}</svg>`;
  const wrap = (vb, value) => {
    const s = String(value ?? "");
    if (/^\s*<svg\b/i.test(s)) return s;
    return svg(vb, `<g>${s}</g>`);
  };
  const innerSvg = value => {
    const match = String(value ?? "").match(/<svg\b[^>]*>([\s\S]*?)<\/svg>/i);
    return match ? match[1] : "";
  };
  const firstSvg = value => {
    const match = String(value ?? "").match(/<svg\b[^>]*>[\s\S]*?<\/svg>/i);
    return match ? match[0] : "";
  };
  const A = name => ns[name];

  // Balloon play: live letter fit, air-growth stages, shared clearing, pump modes.
  add("balloon-coral-ba", "BalloonPlayArt", () => A("BalloonPlayArt").balloon("#ffa798", "بَ"));
  add("balloon-sky-ba", "BalloonPlayArt", () => A("BalloonPlayArt").balloon("#96ecff", "بَ"));
  add("balloon-pump-full", "BalloonPlayArt", () => A("BalloonPlayArt").pump("#b7e779", "بَ", 3));
  add("balloon-mode-pump", "BalloonPlayArt", () => wrap("0 0 72 64", A("BalloonPlayArt").modeIcon("pump")));
  add("balloon-mode-pop", "BalloonPlayArt", () => wrap("0 0 72 64", A("BalloonPlayArt").modeIcon("pop")));

  // Picture-book games and their travel/market scenes.
  add("book-door-leaf-a", "BookPlayArt", () => A("BookPlayArt").door(0));
  add("book-door-leaf-b", "BookPlayArt", () => A("BookPlayArt").door(1));
  add("book-close-doors", "BookPlayArt", () => A("BookPlayArt").closeDoors());
  add("book-basket", "BookPlayArt", () => A("BookPlayArt").basket());
  add("book-trip-backdrop", "BookPlayArt", () => A("BookPlayArt").tripBackdrop());
  add("book-sign", "BookPlayArt", () => A("BookPlayArt").sign());
  add("book-home", "BookPlayArt", () => A("BookPlayArt").home());
  add("book-market-stall-a", "BookPlayArt", () => A("BookPlayArt").marketStall(0));
  add("book-market-stall-b", "BookPlayArt", () => A("BookPlayArt").marketStall(1));

  // Delivery game packet, staged garden, and launcher icon.
  add("delivery-packet-letter", "DeliveryPlayArt", () => A("DeliveryPlayArt").packet(item, `<text x="0" y="12" text-anchor="middle" font-size="36" fill="#4a3620">بَ</text>`));
  add("delivery-garden-seed", "DeliveryPlayArt", () => A("DeliveryPlayArt").garden(item, false, 0));
  add("delivery-garden-growing", "DeliveryPlayArt", () => A("DeliveryPlayArt").garden(item, true, 2, `<text x="0" y="12" text-anchor="middle" font-size="30" fill="#4a3620">بَ</text>`));
  add("delivery-garden-grown", "DeliveryPlayArt", () => A("DeliveryPlayArt").garden(item, true, 4, `<text x="0" y="12" text-anchor="middle" font-size="30" fill="#4a3620">بَ</text>`));
  add("delivery-icon", "DeliveryPlayArt", () => A("DeliveryPlayArt").icon(120));

  // Sound games: drum, listening stand, replay/speaker, beat seed.
  add("ears-drum", "EarsPlayArt", () => A("EarsPlayArt").drum());
  add("ears-listening-stand", "EarsPlayArt", () => A("EarsPlayArt").listeningStand());
  add("ears-sound-pod", "EarsPlayArt", () => A("EarsPlayArt").soundPod());
  add("ears-speaker", "EarsPlayArt", () => A("EarsPlayArt").speaker());
  add("ears-replay-all", "EarsPlayArt", () => A("EarsPlayArt").replayAll());
  add("ears-beat-seed", "EarsPlayArt", () => A("EarsPlayArt").beatSeed());

  // Form construction and Costume House.
  add("form-word-stand", "FormPlayArt", () => A("FormPlayArt").wordStand());
  add("form-costume-rail", "FormPlayArt", () => A("FormPlayArt").costumeRail());
  add("form-train-engine", "FormPlayArt", () => A("FormPlayArt").trainEngine());
  add("form-train-car", "FormPlayArt", () => A("FormPlayArt").trainCar(true, true));
  add("form-train-end-car", "FormPlayArt", () => A("FormPlayArt").trainCar(false, true));
  add("form-leaf", "FormPlayArt", () => A("FormPlayArt").leaf());
  add("form-branch", "FormPlayArt", () => A("FormPlayArt").branch());

  // Friend finder and friend-book page/habitat art.
  add("friend-book-page", "FriendBookArt", () => A("FriendBookArt").page());
  add("friend-book-habitat", "FriendBookArt", () => A("FriendBookArt").habitat());
  add("friend-finder-booth", "FriendPlayArt", () => A("FriendPlayArt").booth());
  add("friend-finder-perch", "FriendPlayArt", () => A("FriendPlayArt").perch());
  add("friend-finder-eye", "FriendPlayArt", () => A("FriendPlayArt").eye());

  // Garden Adventure: representative butterfly/bird projects and growth stages.
  for (const project of ["butterfly", "bird"]) for (const [step, label] of [[0,"seed"],[1,"sprout"],[3,"grown"]]) {
    add(`garden-adventure-${project}-${label}`, "GardenAdventurePlayArt", () => A("GardenAdventurePlayArt").scene(project, step, null));
  }
  add("garden-adventure-bird-visitor", "GardenAdventurePlayArt", () => wrap("-50 -50 100 100", A("GardenAdventurePlayArt").visitor("bird")));
  add("garden-adventure-butterfly-visitor", "GardenAdventurePlayArt", () => wrap("-50 -50 100 100", A("GardenAdventurePlayArt").visitor("butterfly")));

  // Letter Hunt pictured props, landscapes, baskets, and result reactions.
  for (const land of ["meadow", "orchard", "lagoon", "peaks", "night"]) {
    add(`hunt-background-${land}`, "HuntPlayArt", () => A("HuntPlayArt").background(land, false));
  }
  add("hunt-background-portrait", "HuntPlayArt", () => A("HuntPlayArt").background("meadow", true));
  add("hunt-basket", "HuntPlayArt", () => A("HuntPlayArt").basket());
  for (const [key, thing] of Object.entries(A("HuntPlayArt").THINGS || {})) {
    if (thing?.art) {
      add(`hunt-thing-${key}`, "HuntPlayArt", () => svg("-100 -140 200 300", `<g transform="translate(0 30)">${thing.art}</g>`));
      add(`hunt-reaction-${key}`, "HuntPlayArt", () => svg("-100 -140 200 300", `<g transform="translate(0 30)">${thing.art}${A("HuntPlayArt").reaction(key)}</g>`));
    }
  }

  // Letter Studio's backdrop and small tool icons.
  for (const land of ["meadow", "orchard", "lagoon", "river", "peaks", "night"]) add(`studio-scene-${land}`, "LetterStudioArt", () => A("LetterStudioArt").scene(land));
  add("studio-stamp", "LetterStudioArt", () => wrap("0 0 64 64", A("LetterStudioArt").stamp(64)));
  add("studio-hanger", "LetterStudioArt", () => wrap("0 0 64 64", A("LetterStudioArt").hanger(64)));

  // Activity scenery is returned as an HTML shell around its primary SVG plane.
  // Extract the actual first plane; the live game lays any loose props on top.
  const activityIds = ["pairs","burst","DotGarden","feed","catch","build","blend","fuse","unfuse","chain","parade",
    "FriendPairs","FriendJigsaw","ColourFriend","BuildLetter","FillGap","DotsLast","SameLetter","PeekFlaps","SoundSort",
    "HoopoeTrip","FriendShapes","BusyMarket","TwinCrown","ListenFind","WordGap","EchoParade","DotNests","BathTime",
    "LetterFishing","LetterTrain","SpotChange","FamilyBuses","LanternHunt","LetterShadows","HatShop"];
  for (const activity of activityIds) add(`activity-plane-${activity}`, "LettersActivityArt", () => firstSvg(A("LettersActivityArt").scene(activity)));

  add("living-book-day", "LivingBookArt", () => A("LivingBookArt").scene(false));
  add("living-book-night", "LivingBookArt", () => A("LivingBookArt").scene(true));
  add("living-book-props-day", "LivingBookArt", () => A("LivingBookArt").props(false));
  add("living-book-props-night", "LivingBookArt", () => A("LivingBookArt").props(true));
  add("living-book-bush", "LivingBookArt", () => A("LivingBookArt").bush());

  // Look-and-notice games.
  add("look-bus-coral", "LookPlayArt", () => A("LookPlayArt").bus());
  add("look-bus-sky", "LookPlayArt", () => A("LookPlayArt").bus("#96ecff"));
  add("look-bus-stop", "LookPlayArt", () => A("LookPlayArt").busStop());
  add("look-stone", "LookPlayArt", () => A("LookPlayArt").stone());
  add("look-observe-find", "LookPlayArt", () => A("LookPlayArt").observe("find"));
  add("look-observe-compare", "LookPlayArt", () => A("LookPlayArt").observe("compare"));

  // Completion/reward garden, paper puzzle, sand table, and blend machine.
  const practiceFinish = paid => {
    const garden = innerSvg(A("PracticeFinishArt").scene({ petArt: friend(), paid }));
    const pet = innerSvg(friend());
    return svg("0 0 360 240", `${garden}<svg x="-14" y="2" width="202" height="226" viewBox="-6 -6 112 112" preserveAspectRatio="xMidYMax meet">${pet}</svg>`);
  };
  add("practice-finish-free", "PracticeFinishArt", () => practiceFinish(false));
  add("practice-finish-paid", "PracticeFinishArt", () => practiceFinish(true));
  for (const name of ["echoStage","dotBench","dotStamp","turntable","turnHandle","matchFrame","station","stationShelter","engine","carriage"]) {
    add(`puzzle-${name}`, "PuzzlePlayArt", () => A("PuzzlePlayArt")[name]());
  }
  for (const color of ["#ffa798", "#96ecff", "#b7e779", "#ffe49a", "#b49fcf"]) add(`puzzle-balloon-${color.slice(1)}`, "PuzzlePlayArt", () => A("PuzzlePlayArt").balloon(color));
  add("sand-rake", "SandPlayArt", () => wrap("0 0 64 64", A("SandPlayArt").rake(64)));
  add("sand-setting", "SandPlayArt", () => A("SandPlayArt").setting());
  add("sound-lab-machine", "SoundLabArt", () => A("SoundLabArt").machine());

  // Together play and toy chest illustrations.
  add("together-basket", "TogetherPlayArt", () => A("TogetherPlayArt").basket());
  add("together-mat", "TogetherPlayArt", () => A("TogetherPlayArt").mat());
  add("together-card-back", "TogetherPlayArt", () => A("TogetherPlayArt").cardBack());
  for (const kind of ["play","listen","read","think","write","explore"]) add(`toy-chest-${kind}`, "ToyChestArt", () => A("ToyChestArt").family(kind));
  add("toy-studio-pair-leaf", "ToyStudioArt", () => A("ToyStudioArt").pairLeaf());
  for (const n of [0,1,2,3]) add(`toy-studio-nest-${n}`, "ToyStudioArt", () => A("ToyStudioArt").nest(n));
  add("toy-studio-dot-tree", "ToyStudioArt", () => A("ToyStudioArt").dotTree());
  add("toy-studio-count-perch", "ToyStudioArt", () => A("ToyStudioArt").countPerch());
  add("toy-studio-puzzle-frame", "ToyStudioArt", () => A("ToyStudioArt").puzzleFrame());
  add("toy-studio-drawing-easel", "ToyStudioArt", () => A("ToyStudioArt").drawingEasel());
  for (const color of ["#ee806f", "#f3c955", "#7fce54"]) add(`toy-studio-crayon-${color.slice(1)}`, "ToyStudioArt", () => A("ToyStudioArt").crayon(color));

  // Water and bath games, plus word/vowel learning stations.
  add("water-garden-scene", "WaterPlayArt", () => A("WaterPlayArt").scene());
  add("waterside-fish-a", "WatersideArt", () => A("WatersideArt").fish(0));
  add("waterside-fish-b", "WatersideArt", () => A("WatersideArt").fish(1));
  for (const name of ["pond","reeds","stones","dock","bathBackdrop","bathPlant","bathTowels","sponge","shower"]) add(`waterside-${name}`, "WatersideArt", () => A("WatersideArt")[name]());
  for (const name of ["dressingNook","crownStage","readingNook","bookCradle"]) add(`word-wardrobe-${name}`, "WordWardrobeArt", () => A("WordWardrobeArt")[name]());
  for (const name of ["assemblyBoard","pictureFrame","theatreFrame","nightGarden","nightTree","lantern","jar"]) add(`workshop-shadow-${name}`, "WorkshopShadowArt", () => A("WorkshopShadowArt")[name]());

  // Shared hero and learning icons from the current LettersArt export.
  add("shared-key-mascot", "LettersArt", () => A("LettersArt").keyMascot({ size: 140, mood: "happy" }));
  add("shared-blob-card-ba", "LettersArt", () => A("LettersArt").blobCard({ hue: 150, label: "بَ", size: 250 }));
  add("shared-letter-sign-ba", "LettersArt", () => A("LettersArt").letterSign({ hue: 150, label: "بَ", size: 250 }));
  add("shared-sticker-pack", "LettersArt", () => A("LettersArt").stickerPack({ size: 140 }));
  add("shared-egg-closed", "LettersArt", () => A("LettersArt").egg({ size: 160, cracks: 0 }));
  add("shared-egg-cracked", "LettersArt", () => A("LettersArt").egg({ size: 160, cracks: 2 }));
  add("shared-egg-shells", "LettersArt", () => wrap("-80 -80 160 160", A("LettersArt").eggShells({}).cup.replace(/^<svg[^>]*>|<\/svg>$/g,"")));
  add("shared-skill-flower", "LettersArt", () => A("LettersArt").skillFlower({ scores: {}, size: 180 }));
  add("shared-art-icon-sprout", "LettersArt", () => A("LettersArt").artIcon("sprout", 64));
  add("shared-art-icon-flower", "LettersArt", () => A("LettersArt").artIcon("flower", 64));

  // Sample a live Letter Friend plus selected single-colour shared controls.
  add("letter-friends-example", "shared-friend-art", () => friend());
  for (const name of ["speaker", "play", "next", "replay", "undo", "check", "book"]) {
    add(`shared-icon-${name}`, "LettersArt", () => A("LettersArt").icon(name, 64));
  }

  window.artGameRecipes = recipes;
})();
