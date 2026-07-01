(function (ns) {
  class Crop {
    constructor(config) {
      this.x = config.x;
      this.y = config.y;
      this.width = ns.TILE_SIZE;
      this.height = ns.TILE_SIZE;
      this.kind = config.kind || ns.CROP_DATA.defaultKind;
      this.stage = 0;
      this.wateredPulse = 0;
    }

    get centerX() {
      return this.x + this.width / 2;
    }

    get centerY() {
      return this.y + this.height / 2;
    }

    update(dt) {
      this.wateredPulse = Math.max(0, this.wateredPulse - dt);
    }

    advanceByStudy() {
      if (this.stage > 0 && this.stage < 4) this.stage += 1;
    }

    get hint() {
      if (this.stage === 0) return "Plant seed";
      if (this.stage < 4) return "Growing...";
      return "Harvest";
    }

    plant() {
      if (this.stage !== 0) return false;
      this.stage = 1;
      this.wateredPulse = 1.5;
      return true;
    }

    harvest() {
      if (this.stage !== 4) return false;
      this.stage = 0;
      return true;
    }

    assetKey() {
      if (this.stage === 0) return "crops.soilEmpty";
      const stageName = ns.CROP_DATA.stages[this.stage];
      const kindAssets = ns.CROP_DATA.kindStageAssets[this.kind] || ns.CROP_DATA.kindStageAssets[ns.CROP_DATA.defaultKind];
      return kindAssets?.[stageName] || ns.CROP_DATA.stageAssets[stageName] || "crops.matureCarrot";
    }

    draw(renderer) {
      renderer.drawImage(this.wateredPulse > 0 ? "crops.soilWatered" : "crops.soilEmpty", this.x, this.y, this.width, this.height);
      if (this.stage > 0) renderer.drawImage(this.assetKey(), this.x, this.y, this.width, this.height);
    }
  }

  ns.Crop = Crop;
})(window.MiftahGame || (window.MiftahGame = {}));
