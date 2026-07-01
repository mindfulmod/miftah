(function (ns) {
  class InteractionSystem {
    constructor() {
      this.current = null;
      this.actionHint = "Explore the island";
    }

    update(game) {
      if (game.trainer?.isOpen) {
        this.actionHint = "Study in progress";
        return;
      }
      this.current = this.findNearest(game);
      this.actionHint = this.current ? this.labelFor(this.current) : "Explore the island";
      if (game.input.consume("KeyE", "Space")) {
        this.interact(game);
      }
    }

    labelFor(target) {
      if (!target) return "";
      if (target.type === "crop") return target.hint || target.crop.hint;
      if (target.type === "animal" && target.animal) return target.animal.interactionHint();
      return target.hint || "Interact";
    }

    interact(game) {
      if (!this.current) return;
      if (this.current.type === "crop") {
        const result = game.farming.interact(game.player, game.progress);
        if (result) game.dialogue.open(result.text, 1.9);
        return;
      }
      if (this.current.type === "animal" && this.current.animal) {
        if (this.current.animal.growthStage >= 3) {
          game.dialogue.open(`${this.current.animal.displayName} is already fully grown.`, 2.2);
          return;
        }
        if (!game.progress.spendFeed()) {
          game.dialogue.open("Harvest crops to make feed first.", 2.2);
          return;
        }
        const result = this.current.animal.feed();
        game.dialogue.open(result.text, 2.2);
        return;
      }
      if (this.current.id === "reading-arch" && game.trainer) {
        game.trainer.open();
        return;
      }
      game.dialogue.open(this.current.dialogue || this.current.hint || "Hello.");
    }

    findNearest(game) {
      const crop = game.farming.nearestCrop(game.player);
      if (crop) {
        let hint = crop.hint;
        if (crop.stage === 0 && game.progress.state.seeds <= 0) hint = "Need seeds";
        return { type: "crop", crop, x: crop.x, y: crop.y, width: crop.width, height: crop.height, hint };
      }

      const candidates = [];
      for (const npc of game.npcs) candidates.push({ type: "npc", ...screenTarget(npc), hint: npc.hint, dialogue: npc.dialogue });
      for (const animal of game.animals) candidates.push({ type: "animal", animal, ...screenTarget(animal), hint: animal.interactionHint(), dialogue: animal.hint });
      if (game.hatchery) candidates.push({ type: "hatchery", ...screenTarget(game.hatchery), hint: game.hatchery.hint(), dialogue: game.hatchery.dialogue() });
      for (const prop of game.world.activeInteractables(game.progress)) candidates.push({ type: "prop", id: prop.id, ...screenTarget(prop), hint: prop.hint, dialogue: prop.dialogue });

      let best = null;
      let bestDistance = Infinity;
      for (const candidate of candidates) {
        const distance = distanceToRect(game.player.centerX, game.player.y + 52, candidate);
        const range = candidate.type === "prop" ? 74 : 58;
        if (distance < range && distance < bestDistance) {
          best = candidate;
          bestDistance = distance;
        }
      }
      return best;
    }
  }

  function screenTarget(entity) {
    return {
      x: entity.x,
      y: entity.y,
      width: entity.width,
      height: entity.height,
      hint: entity.hint,
      dialogue: entity.dialogue,
    };
  }

  function distanceToRect(px, py, rect) {
    const cx = Math.max(rect.x, Math.min(px, rect.x + rect.width));
    const cy = Math.max(rect.y, Math.min(py, rect.y + rect.height));
    return Math.hypot(px - cx, py - cy);
  }

  ns.InteractionSystem = InteractionSystem;
})(window.MiftahGame || (window.MiftahGame = {}));
