(function (ns) {
  function panel(ctx, x, y, w, h, title = "") {
    ctx.fillStyle = "rgba(42, 25, 13, 0.92)";
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "#f2c66a";
    ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
    ctx.fillStyle = "#865221";
    ctx.fillRect(x + 7, y + 7, w - 14, h - 14);
    ctx.fillStyle = "rgba(28, 85, 82, 0.94)";
    ctx.fillRect(x + 10, y + 10, w - 20, h - 20);
    ctx.fillStyle = "rgba(8, 48, 54, 0.86)";
    ctx.fillRect(x + 14, y + 38, w - 28, h - 52);
    ctx.fillStyle = "rgba(255, 244, 205, 0.12)";
    ctx.fillRect(x + 14, y + 14, w - 28, 20);

    if (title) {
      ctx.fillStyle = "#fff4cd";
      ctx.font = "700 13px monospace";
      ctx.textBaseline = "top";
      ctx.fillText(title, x + 18, y + 17);
    }
  }

  function smallSlot(ctx, x, y, image, label) {
    ctx.fillStyle = "#3a2111";
    ctx.fillRect(x, y, 38, 38);
    ctx.fillStyle = "#f0c15f";
    ctx.fillRect(x + 3, y + 3, 32, 32);
    ctx.fillStyle = "#173f43";
    ctx.fillRect(x + 6, y + 6, 26, 26);
    if (image) ctx.drawImage(image, x + 9, y + 9, 20, 20);
    ctx.fillStyle = "#ffe19a";
    ctx.font = "700 12px monospace";
    ctx.fillText(label, x + 44, y + 10);
  }

  class HUD {
    draw(ctx, game) {
      ctx.save();
      ctx.setTransform(game.renderer.dpr, 0, 0, game.renderer.dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;

      panel(ctx, 16, 16, 382, 128, "Oasis Progress");

      ctx.textBaseline = "top";
      smallSlot(ctx, 34, 48, game.assets.get("ui.seedIcon"), `Seeds ${game.progress.state.seeds}`);

      ctx.font = "700 12px monospace";
      ctx.fillStyle = "#ffe19a";
      ctx.fillText(`Ayahs ${game.progress.state.ayahsCompleted}`, 164, 50);
      ctx.drawImage(game.assets.get("ui.cropIcon"), 164, 70, 20, 20);
      ctx.fillText(`Feed ${game.progress.state.feed}`, 190, 73);
      ctx.fillText(`Animals ${game.animals.length}/16`, 262, 73);

      ctx.fillStyle = "#cfeee9";
      const egg = game.progress.state.activeEgg;
      ctx.fillText(egg ? `Egg ${egg.progress}/${egg.goal}` : "Egg none", 34, 104);
      ctx.fillText(game.interaction.actionHint, 164, 104);

      const controls = ["WASD / Arrows: Move", "E: Interact", "Space: Action", "R: Reset", "F2: Map Editor"];
      const width = 218;
      const x = game.screenWidth - width - 16;
      panel(ctx, x, 16, width, 136, "Controls");
      ctx.fillStyle = "#fff4cd";
      ctx.font = "700 11px monospace";
      controls.forEach((line, i) => ctx.fillText(line, x + 18, 46 + i * 17));

      if (game.assetWarnings.length) {
        ctx.fillStyle = "#ffd0d0";
        ctx.fillText(`${game.assetWarnings.length} missing asset placeholder(s)`, 32, 140);
      }

      ctx.restore();
    }
  }

  ns.HUD = HUD;
})(window.MiftahGame || (window.MiftahGame = {}));
