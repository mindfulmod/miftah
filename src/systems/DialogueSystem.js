(function (ns) {
  class DialogueSystem {
    constructor() {
      this.text = "";
      this.timer = 0;
    }

    open(text, seconds = 3.2) {
      this.text = text || "";
      this.timer = seconds;
    }

    update(dt) {
      if (this.timer > 0) this.timer = Math.max(0, this.timer - dt);
    }

    draw(ctx, game) {
      if (!this.text || this.timer <= 0) return;
      const width = Math.min(520, game.screenWidth - 32);
      const height = 84;
      const x = (game.screenWidth - width) / 2;
      const y = game.screenHeight - height - 24;
      const panel = game.assets.get("ui.dialogueBox");
      ctx.drawImage(panel, x, y, width, height);
      ctx.fillStyle = "#fff6d7";
      ctx.font = "16px monospace";
      ctx.textBaseline = "top";
      wrapText(ctx, this.text, x + 24, y + 22, width - 48, 21);
    }
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(/\s+/);
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, x, y);
        line = word;
        y += lineHeight;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, x, y);
  }

  ns.DialogueSystem = DialogueSystem;
})(window.MiftahGame || (window.MiftahGame = {}));
