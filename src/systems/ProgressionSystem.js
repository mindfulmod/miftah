(function (ns) {
  const STORAGE_KEY = "miftah-oasis:mvp-progress";

  const DEFAULT_STATE = {
    ayahsCompleted: 0,
    seeds: 0,
    feed: 0,
    nextEggAt: 1,
    activeEgg: null,
    unlockedAnimals: {},
    gifts: {}, // giftId -> count, found around the island (Garden Album shelf)
    lastQuestionIndex: 0,
  };

  class ProgressionSystem {
    constructor(catalog) {
      this.catalog = catalog;
      this.catalogById = new Map(catalog.map((animal) => [animal.id, animal]));
      this.state = this.load();
    }

    load() {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
        return {
          ...DEFAULT_STATE,
          ...(saved || {}),
          unlockedAnimals: saved?.unlockedAnimals || {},
          gifts: saved?.gifts || {},
        };
      } catch {
        return JSON.parse(JSON.stringify(DEFAULT_STATE));
      }
    }

    save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch {}
    }

    completeStudyStep() {
      const events = [];
      this.state.ayahsCompleted += 1;
      this.state.seeds += 2;
      events.push({ type: "seeds", amount: 2 });

      if (this.state.activeEgg) {
        this.state.activeEgg.progress += 1;
        events.push({ type: "eggProgress", egg: { ...this.state.activeEgg } });
        if (this.state.activeEgg.progress >= this.state.activeEgg.goal) {
          const unlocked = this.unlockAnimal(this.state.activeEgg.animalId);
          this.state.activeEgg = null;
          if (unlocked) events.push({ type: "animalUnlocked", animal: unlocked });
        }
      }

      if (!this.state.activeEgg && this.lockedAnimals().length > 0 && this.state.ayahsCompleted >= this.state.nextEggAt) {
        const target = this.pickLockedAnimal();
        if (target) {
          this.state.activeEgg = { animalId: target.id, progress: 0, goal: 3 };
          this.state.nextEggAt += this.state.ayahsCompleted === 1 ? 6 : 8;
          events.push({ type: "eggAwarded", egg: { ...this.state.activeEgg }, animal: target });
        }
      }

      this.save();
      return events;
    }

    lockedAnimals() {
      return this.catalog.filter((animal) => !this.state.unlockedAnimals[animal.id]);
    }

    unlockedAnimalEntries() {
      return Object.entries(this.state.unlockedAnimals)
        .map(([id, progress]) => ({ animal: this.catalogById.get(id), progress }))
        .filter((entry) => entry.animal);
    }

    pickLockedAnimal() {
      const locked = this.lockedAnimals();
      return locked[Math.floor(Math.random() * locked.length)] || null;
    }

    unlockAnimal(id) {
      const animal = id ? this.catalogById.get(id) : this.pickLockedAnimal();
      if (!animal || this.state.unlockedAnimals[animal.id]) return null;
      this.state.unlockedAnimals[animal.id] = { stage: 1, feedProgress: 0, hatchedAt: Date.now() };
      return animal;
    }

    addGift(giftId) {
      this.state.gifts[giftId] = (this.state.gifts[giftId] || 0) + 1;
      this.save();
      return this.state.gifts[giftId];
    }

    zoneState(zone) {
      if (!zone) return "open";
      const hasUnlocked = this.catalog.some(
        (animal) => animal.zone === zone && this.state.unlockedAnimals[animal.id],
      );
      if (hasUnlocked) return "unlocked";
      const eggAnimal = this.state.activeEgg?.animalId
        ? this.catalogById.get(this.state.activeEgg.animalId)
        : null;
      if (eggAnimal?.zone === zone) return "preview";
      return "locked";
    }

    animalState(id) {
      const animal = this.catalogById.get(id);
      if (!animal) return "locked";
      if (this.state.unlockedAnimals[id]) return "unlocked";
      if (this.state.activeEgg?.animalId === id) return "preview";
      return "locked";
    }

    animalProgress(id) {
      return this.state.unlockedAnimals[id] || null;
    }

    updateAnimal(id, progress) {
      if (!this.state.unlockedAnimals[id]) return;
      this.state.unlockedAnimals[id] = { ...this.state.unlockedAnimals[id], ...progress };
      this.save();
    }

    spendSeed() {
      if (this.state.seeds <= 0) return false;
      this.state.seeds -= 1;
      this.save();
      return true;
    }

    addFeed(amount = 1) {
      this.state.feed += amount;
      this.save();
    }

    spendFeed() {
      if (this.state.feed <= 0) return false;
      this.state.feed -= 1;
      this.save();
      return true;
    }

    nextQuestion() {
      const questions = ns.TRAINER_QUESTIONS;
      const index = this.state.lastQuestionIndex % questions.length;
      this.state.lastQuestionIndex += 1;
      this.save();
      return questions[index];
    }
  }

  ns.ProgressionSystem = ProgressionSystem;
})(window.MiftahGame || (window.MiftahGame = {}));
