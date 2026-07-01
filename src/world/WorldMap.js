(function (ns) {
  class WorldMap {
    constructor(data) {
      this.data = data;
      this.tileSize = data.tileSize;
      this.width = data.width;
      this.height = data.height;
      this.pixelWidth = data.width * data.tileSize;
      this.pixelHeight = data.height * data.tileSize;
      this.tileMap = new ns.TileMap(data);
      this.props = data.props;
      this.spawn = data.spawn;
      this.farmPlots = data.farmPlots;
      this.animalSpawns = data.animalSpawns;
      this.npcSpawns = data.npcs;
      this.islands = data.islands || [];
      this.islandById = new Map(this.islands.map((isle) => [isle.id, isle]));
    }

    // A biome isle is "open" once any of its zones has hatched an animal
    // (zoneState becomes "unlocked"). While the active egg belongs to one of
    // its zones it is "preview" (still gated, but teased). Otherwise it is
    // "locked". Returns "open" for unknown islands so nothing breaks.
    islandState(islandId, progress) {
      const island = this.islandById.get(islandId);
      if (!island || !progress) return "open";
      const states = island.zones.map((zone) => progress.zoneState(zone));
      if (states.includes("unlocked")) return "open";
      if (states.includes("preview")) return "preview";
      return "locked";
    }

    activeProps(progress) {
      return this.props.filter((prop) => this.isPropActive(prop, progress));
    }

    activeColliders(progress) {
      return this.activeProps(progress)
        .filter((prop) => prop.collider)
        .map((prop) => prop.collider);
    }

    activeInteractables(progress) {
      return this.activeProps(progress).filter((prop) => prop.hint || prop.dialogue);
    }

    isPropActive(prop, progress) {
      if (!progress) return true;
      if (prop.lockIsland) return this.islandState(prop.lockIsland, progress) !== "open";
      if (prop.lockZone) return progress.zoneState(prop.lockZone) === "locked";
      if (prop.previewZone) return progress.zoneState(prop.previewZone) === "preview";
      if (prop.openZone) return progress.zoneState(prop.openZone) !== "locked";
      if (prop.revealZone) return progress.zoneState(prop.revealZone) !== "locked";
      return true;
    }
  }

  ns.WorldMap = WorldMap;
})(window.MiftahGame || (window.MiftahGame = {}));
