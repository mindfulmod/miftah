(function (ns) {
  class Tooltip {
    draw(ctx, game) {
      const target = game.interaction.current;
      if (!target) return;
      const text = `E: ${game.interaction.labelFor(target)}`;
      const x = target.x + target.width / 2 - game.camera.x;
      const y = target.y - game.camera.y - 10;

      ctx.save();
      ctx.setTransform(game.renderer.dpr, 0, 0, game.renderer.dpr, 0, 0);
      ctx.font = "14px monospace";
      const metrics = ctx.measureText(text);
      const w = Math.min(metrics.width + 28, game.screenWidth - 32);
      const h = 32;
      const bx = Math.max(16, Math.min(game.screenWidth - w - 16, x - w / 2));
      const by = Math.max(150, Math.min(game.screenHeight - 120, y - h));
      ctx.fillStyle = "rgba(31, 23, 17, 0.9)";
      ctx.fillRect(bx, by, w, h);
      ctx.strokeStyle = "#f0c15f";
      ctx.lineWidth = 2;
      ctx.strokeRect(bx + 1, by + 1, w - 2, h - 2);
      ctx.fillStyle = "#fff4cd";
      ctx.textBaseline = "middle";
      ctx.fillText(text, bx + 14, by + h / 2);
      ctx.restore();
    }
  }

  ns.Tooltip = Tooltip;
})(window.MiftahGame || (window.MiftahGame = {}));
