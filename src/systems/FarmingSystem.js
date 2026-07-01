(function (ns) {
  const STORAGE_KEY = "miftah-oasis:mvp-farm";

  class FarmingSystem {
    constructor(plotConfigs) {
      this.crops = plotConfigs.map((config) => new ns.Crop(config));
      this.harvested = 0;
      this.load();
    }

    update(dt) {
      for (const crop of this.crops) crop.update(dt);
    }

    advanceCropsByStudy() {
      for (const crop of this.crops) crop.advanceByStudy();
      this.save();
    }

    nearestCrop(player, range = 58) {
      let best = null;
      let bestDistance = Infinity;
      for (const crop of this.crops) {
        const dx = crop.centerX - player.centerX;
        const dy = crop.centerY - (player.y + 52);
        const distance = Math.hypot(dx, dy);
        if (distance < range && distance < bestDistance) {
          best = crop;
          bestDistance = distance;
        }
      }
      return best;
    }

    interact(player, progression) {
      const crop = this.nearestCrop(player);
      if (!crop) return null;
      if (crop.stage === 0) {
        if (!progression.spendSeed()) return { text: "Study at the archway to earn seeds.", kind: "crop" };
        crop.plant();
        this.save();
        return { text: "Seed planted. Study to help it grow.", kind: "crop" };
      }
      if (crop.stage < 4) return { text: "This crop grows as you study.", kind: "crop" };
      if (crop.harvest()) {
        this.harvested += 1;
        progression.addFeed(1);
        this.save();
        return { text: "Harvested feed for your animals.", kind: "crop" };
      }
      return null;
    }

    save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.crops.map((crop) => crop.stage)));
      } catch {}
    }

    load() {
      try {
        const stages = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        stages.forEach((stage, index) => {
          if (this.crops[index] && Number.isInteger(stage)) this.crops[index].stage = stage;
        });
      } catch {}
    }
  }

  ns.FarmingSystem = FarmingSystem;
})(window.MiftahGame || (window.MiftahGame = {}));
