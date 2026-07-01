(function (ns) {
  class NPC extends ns.Entity {
    constructor(config) {
      super(config.x, config.y, 56, 72);
      this.assetIndex = config.assetIndex || 0;
      this.hint = config.hint || "";
      this.dialogue = config.dialogue || this.hint;
    }

    update(dt) {
      this.animationTime += dt;
    }

    draw(renderer) {
      renderer.drawImage(`characters.villagers.${this.assetIndex}`, this.x, this.y, this.width, this.height);
    }
  }

  ns.NPC = NPC;
})(window.MiftahGame || (window.MiftahGame = {}));
