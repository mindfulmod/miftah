(function (ns) {
  // Loads editor-authored placements saved by the standalone map editor
  // (editor.html -> POST /api/save-map -> src/world/mapOverrides.json).
  // Best-effort: no file yet, or the static file server can't reach the
  // save endpoint, both just mean "no overrides" rather than a hard error.
  async function loadMapOverrides() {
    try {
      const res = await fetch("src/world/mapOverrides.json", { cache: "no-store" });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }


  class Game {
    constructor(canvas, loadingEl) {
      this.canvas = canvas;
      this.loadingEl = loadingEl;
      this.input = new ns.InputManager();
      this.assets = new ns.AssetLoader();
      this.sound = new ns.SoundSystem();
      this.renderer = new ns.Renderer(canvas, this.assets);
      this.screenWidth = 800;
      this.screenHeight = 600;
      this.assetWarnings = [];
      this.running = false;
      // Opt-in cinematic "lit diorama" post-process (?lit=1).
      this.litMode = new URLSearchParams(location.search).get("lit") === "1";
    }

    async start() {
      const size = this.renderer.resize();
      this.screenWidth = size.width;
      this.screenHeight = size.height;

      if (this.loadingEl) this.loadingEl.textContent = "Generating the island...";
      await this.assets.load(ns.ASSETS);
      this.assetWarnings = this.assets.warnings;

      const mapData = ns.createMapData();
      const overrides = await loadMapOverrides();
      ns.applyMapOverrides(mapData, overrides);
      // Seeded shaping: organic per-player coastline, water detail, and the
      // badge-islet anchors (docs/procedural-island-spec.md).
      this.islandShaper = new ns.IslandShaper();
      this.islandShaper.apply(mapData);
      this.world = new ns.WorldMap(mapData);
      this.camera = new ns.Camera(this.world.pixelWidth, this.world.pixelHeight);
      this.camera.resize(this.screenWidth, this.screenHeight);
      this.collisionMap = new ns.CollisionMap(
        this.world,
        () => this.progress,
        () => this.dynamicColliders(),
      );

      this.player = new ns.Player(this.world.spawn.x, this.world.spawn.y);
      this.pet = new ns.Pet(this.player.x - 58, this.player.y + 8);
      this.camera.x = this.player.centerX - this.screenWidth / 2;
      this.camera.y = this.player.centerY - this.screenHeight / 2;
      this.camera.clamp();
      this.progress = new ns.ProgressionSystem(ns.ANIMAL_CATALOG);
      // Islets for badges earned in past sessions rise silently at boot.
      this.islandShaper.syncBadgeIslets(this);
      this.time = new ns.TimeSystem();
      this.effects = [];
      this.hatchery = new ns.Hatchery(this, 30 * ns.TILE_SIZE, 27 * ns.TILE_SIZE);
      this.animals = [];
      this.spawnSavedAnimals();
      this.npcs = this.world.npcSpawns.map((spawn) => new ns.NPC(spawn));
      this.farming = new ns.FarmingSystem(this.world.farmPlots);
      this.interaction = new ns.InteractionSystem();
      this.dialogue = new ns.DialogueSystem();
      this.hud = new ns.HUD();
      this.tooltip = new ns.Tooltip();
      // One shared recitation channel for the whole game (Codex + island).
      this.recite = new ns.RecitationAudio(() => this.sound.enabled);
      this.petReciteTimer = 30 + Math.random() * 30;
      this.trainer = new ns.TrainerOverlay(this);
      this.album = new ns.AlbumOverlay(this);
      this.gifts = new ns.GiftSystem(this);
      this.wordGarden = new ns.WordGardenSystem(this);
      this.editMode = new ns.EditModeSystem(this);
      this.debug = new ns.DebugOverlay();
      this.touch = new ns.TouchControls(this);
      this.input.attachTouch(this.touch);
      this.onboarding = new ns.OnboardingOverlay(this);
      if (new URLSearchParams(location.search).get("trainer") === "1") {
        setTimeout(() => this.trainer.open(), 0);
      } else if (this.onboarding.shouldShow()) {
        this.onboarding.open();
      }

      window.addEventListener("resize", () => this.handleResize());
      // Audio can only start after a user gesture — unlock once, then let the
      // island ambience run for the rest of the session.
      const unlockAudio = () => {
        this.sound.unlock();
        this.sound.startAmbience();
        window.removeEventListener("pointerdown", unlockAudio);
        window.removeEventListener("keydown", unlockAudio);
      };
      window.addEventListener("pointerdown", unlockAudio);
      window.addEventListener("keydown", unlockAudio);
      if (this.loadingEl) this.loadingEl.hidden = true;
      document.body.dataset.gameReady = "true";

      this.running = true;
      this.lastTime = performance.now();
      requestAnimationFrame((time) => this.frame(time));
    }

    handleResize() {
      const size = this.renderer.resize();
      this.screenWidth = size.width;
      this.screenHeight = size.height;
      if (this.camera) this.camera.resize(this.screenWidth, this.screenHeight);
    }

    frame(time) {
      if (!this.running) return;
      const dt = Math.min(0.05, (time - this.lastTime) / 1000 || 0);
      this.lastTime = time;
      this.update(dt);
      this.canvas.dataset.player = `${Math.round(this.player.x)},${Math.round(this.player.y)},${this.player.direction}`;
      this.canvas.dataset.crops = String(this.progress.state.feed);
      this.canvas.dataset.action = this.interaction.actionHint;
      this.canvas.dataset.animals = String(this.animals.length);
      this.canvas.dataset.ayahs = String(this.progress.state.ayahsCompleted);
      this.canvas.dataset.seeds = String(this.progress.state.seeds);
      this.canvas.dataset.egg = this.progress.state.activeEgg
        ? `${this.progress.state.activeEgg.progress}/${this.progress.state.activeEgg.goal}`
        : "none";
      this.renderer.render(this);
      this.editMode.drawOverlay(this.renderer);
      this.debug.draw(this, this.renderer);
      this.input.endFrame();
      requestAnimationFrame((next) => this.frame(next));
    }

    update(dt) {
      // Dev shortcuts: T toggles the Courtyard Codex, C the collision overlay.
      if (this.input.consume("KeyT") && !this.editMode.active) {
        if (this.trainer.isOpen) this.trainer.close();
        else this.trainer.open();
      }
      if (this.input.consume("KeyC") && !this.trainer?.isOpen) this.debug.toggle();
      if (this.input.consume("KeyB") && !this.editMode.active && !this.trainer?.isOpen) this.album.toggle();
      const uiOpen = this.trainer?.isOpen || this.album?.isOpen || this.onboarding?.isOpen;
      // Hide the touch layer under DOM overlays and the editor so its buttons
      // can't be pressed through them; keep it up during cutaways (input is
      // read but unused, and hiding would flicker).
      this.touch.setVisible(!uiOpen && !this.editMode.active);
      this.touch.update(this);
      if (!uiOpen && !this.cutaway) this.player.update(dt, this.input, this.collisionMap);
      this.pet.update(dt, this.player);
      this.hatchery.update(dt);
      const night = this.time.isNight();
      for (const animal of this.animals) animal.update(dt, this.player, night);
      for (const npc of this.npcs) npc.update(dt, this);
      for (const effect of this.effects) effect.t += dt;
      this.effects = this.effects.filter((effect) => effect.t < effect.life);
      this.farming.update(dt);
      this.dialogue.update(dt);
      this.interaction.update(this);

      // Every minute or so the pet "practices" one of the player's mastered
      // words out loud — passive spaced exposure, and the island feels like
      // it's learning with you.
      if (!uiOpen && !this.cutaway) {
        this.petReciteTimer -= dt;
        if (this.petReciteTimer <= 0) {
          this.petReciteTimer = 45 + Math.random() * 45;
          const words = this.wordGarden?.practiceWords || [];
          if (words.length && this.sound.enabled && this.dialogue.timer <= 0) {
            const word = words[Math.floor(Math.random() * words.length)];
            this.recite.playWord(word.audioPath);
            this.dialogue.open(`🐾 ${word.arabic} — “${word.gloss}” … your pet practices with you.`, 3.2);
          }
        }
      }
      this.time.update(dt, this);

      // Cutaway: study rewards briefly play out in the island — the camera
      // glides to the hatchery or a newly opened isle, then hands back.
      if (this.cutaway) {
        this.cutaway.timeLeft -= dt;
        this.camera.follow(this.cutaway.target, dt);
        if (this.cutaway.timeLeft <= 0) {
          const done = this.cutaway.onDone;
          this.cutaway = null;
          if (done) done();
        }
      } else {
        this.camera.follow(this.player, dt);
      }
    }

    playCutaway(x, y, duration = 2.8, onDone = null) {
      this.cutaway = { target: { x, y, width: 0, height: 0 }, timeLeft: duration, onDone };
    }

    spawnEffect(type, x, y) {
      this.effects.push({ type, x, y, t: 0, life: 1.15 });
    }

    spawnSavedAnimals() {
      for (const entry of this.progress.unlockedAnimalEntries()) {
        this.spawnAnimal(entry.animal, entry.progress);
      }
    }

    dynamicColliders() {
      return this.animals
        .map((animal) => animal.collisionRect?.())
        .filter(Boolean);
    }

    spawnAnimal(animal, progress = { stage: 1, feedProgress: 0 }) {
      if (this.animals.some((item) => item.id === animal.id)) return null;
      const spawned = new ns.Animal({
        id: animal.id,
        type: animal.id,
        name: animal.name,
        x: animal.spawn.x,
        y: animal.spawn.y,
        bounds: animal.bounds,
        hint: `${animal.name} lives in the ${animal.habitat}.`,
        assetStageKey: `animals.collection.${animal.id}.stages`,
        growthStage: progress.stage,
        feedProgress: progress.feedProgress,
        feedToYoung: animal.feedToYoung,
        feedToAdult: animal.feedToAdult,
        canStand: this.makeStandPredicate(animal.aquatic),
        onProgressChange: (id, nextProgress) => this.progress.updateAnimal(id, nextProgress),
      });
      this.animals.push(spawned);
      return spawned;
    }

    // Builds a (px, py) => bool predicate for animal wandering. Land animals may
    // only stand on solid ground (no water, no bridges); aquatic ones only on water.
    makeStandPredicate(aquatic) {
      const tileMap = this.world.tileMap;
      const ts = tileMap.tileSize;
      const water = new Set(["water", "waterRipple", "lilyWater", "lagoon", "sandbar"]);
      const offLimits = new Set(["bridgeH", "bridgeV", "dock"]);
      return (px, py) => {
        const type = tileMap.tileAt(Math.floor(px / ts), Math.floor(py / ts));
        if (aquatic) return type === "lagoon" || type === "water" || type === "waterRipple" || type === "lilyWater";
        return !water.has(type) && !offLimits.has(type);
      };
    }

    handleProgressEvents(events) {
      const messages = [];
      for (const event of events) {
        if (event.type === "seeds") messages.push(`+${event.amount} seeds`);
        if (event.type === "eggAwarded") messages.push("A mysterious egg appeared in the hatchery");
        if (event.type === "eggProgress") messages.push(`Egg ${event.egg.progress}/${event.egg.goal}`);
        if (event.type === "animalUnlocked") {
          this.sound.play("hatch");
          this.spawnAnimal(event.animal, { stage: 1, feedProgress: 0 });
          this.gifts?.refresh(); // a newly opened isle can host today's gift
          messages.push(`${event.animal.name} hatched`);
          this.dialogue.open(`${event.animal.name} hatched and moved into the ${event.animal.habitat}.`, 3);
        }
      }
      return messages.join(" · ");
    }
  }

  ns.Game = Game;
})(window.MiftahGame || (window.MiftahGame = {}));
