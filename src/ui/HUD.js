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

      // Phones (or any touch session) get one compact strip: the two big
      // desktop panels overflow a 375 px screen, and keyboard help is dead
      // weight when the touch buttons themselves are the affordance.
      if (game.touch?.active || game.screenWidth < 560) {
        this.drawCompact(ctx, game);
        ctx.restore();
        return;
      }

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

      const controls = [
        "WASD / Arrows: Move",
        "E: Interact",
        "Space: Action",
        "T: Study Codex",
        "B: Garden Album",
        "R: Reset",
        "F2: Map Editor",
        "C: Collision Debug",
      ];
      const width = 218;
      const x = game.screenWidth - width - 16;
      panel(ctx, x, 16, width, 188, "Controls");
      ctx.fillStyle = "#fff4cd";
      ctx.font = "700 11px monospace";
      controls.forEach((line, i) => ctx.fillText(line, x + 18, 46 + i * 17));

      if (game.assetWarnings.length) {
        ctx.fillStyle = "#ffd0d0";
        ctx.fillText(`${game.assetWarnings.length} missing asset placeholder(s)`, 32, 140);
      }

      ctx.restore();
    }

    drawCompact(ctx, game) {
      const w = game.screenWidth - 24;
      panel(ctx, 12, 12, w, 72, "");
      ctx.textBaseline = "top";
      ctx.font = "700 11px monospace";

      // Row 1 sits on the panel's highlight strip, row 2 in its dark inset.
      const egg = game.progress.state.activeEgg;
      ctx.drawImage(game.assets.get("ui.seedIcon"), 28, 27, 16, 16);
      ctx.fillStyle = "#ffe19a";
      ctx.fillText(`${game.progress.state.seeds}`, 48, 30);
      ctx.drawImage(game.assets.get("ui.cropIcon"), 74, 27, 16, 16);
      ctx.fillText(`${game.progress.state.feed}`, 94, 30);
      ctx.fillText(
        `Ayahs ${game.progress.state.ayahsCompleted} · ${egg ? `Egg ${egg.progress}/${egg.goal}` : "Egg none"}`,
        124,
        30
      );

      ctx.fillStyle = "#cfeee9";
      let hint = game.interaction.actionHint;
      const maxWidth = w - 32;
      while (hint.length > 4 && ctx.measureText(hint).width > maxWidth) {
        hint = hint.slice(0, -2);
      }
      ctx.fillText(hint, 28, 55, maxWidth);
    }
  }

  ns.HUD = HUD;
})(window.MiftahGame || (window.MiftahGame = {}));
