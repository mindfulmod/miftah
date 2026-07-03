// Movement/collision debug overlay (dev-only, toggled with C). Draws the
// player hitbox, the exact sample points CollisionMap tests, nearby prop
// colliders, and a readout of the tile under the player's feet — all live
// while walking around normally.
(function (ns) {
  class DebugOverlay {
    constructor() {
      this.active = false;
    }

    toggle() {
      this.active = !this.active;
    }

    draw(game, renderer) {
      if (!this.active) return;
      const ctx = renderer.ctx;
      const camera = game.camera;
      const ts = game.world.tileSize;
      const player = game.player;
      const rect = player.collisionRect();
      const walkableHere = game.collisionMap.canMoveToRect(rect.x, rect.y, rect.w, rect.h);

      ctx.save();
      ctx.setTransform(renderer.dpr, 0, 0, renderer.dpr, 0, 0);
      ctx.translate(-Math.round(camera.x), -Math.round(camera.y));

      // Nearby static prop colliders (within ~8 tiles of the player).
      const near = 8 * ts;
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(255, 149, 40, 0.9)";
      ctx.fillStyle = "rgba(255, 149, 40, 0.18)";
      for (const c of game.world.activeColliders(game.progress)) {
        if (Math.abs(c.x - player.centerX) > near || Math.abs(c.y - player.centerY) > near) continue;
        ctx.fillRect(c.x, c.y, c.w, c.h);
        ctx.strokeRect(c.x, c.y, c.w, c.h);
      }

      // Dynamic animal colliders.
      ctx.strokeStyle = "rgba(196, 118, 255, 0.9)";
      ctx.fillStyle = "rgba(196, 118, 255, 0.20)";
      for (const c of game.dynamicColliders()) {
        if (Math.abs(c.x - player.centerX) > near || Math.abs(c.y - player.centerY) > near) continue;
        ctx.fillRect(c.x, c.y, c.w, c.h);
        ctx.strokeRect(c.x, c.y, c.w, c.h);
      }

      // Blocked tiles around the player.
      const ptx = Math.floor(player.centerX / ts);
      const pty = Math.floor((player.y + player.height - 4) / ts);
      ctx.fillStyle = "rgba(64, 140, 255, 0.22)";
      for (let y = pty - 4; y <= pty + 4; y += 1) {
        for (let x = ptx - 5; x <= ptx + 5; x += 1) {
          if (!game.world.tileMap.isWalkableTile(x, y)) ctx.fillRect(x * ts, y * ts, ts, ts);
        }
      }

      // Player hitbox: green when the current spot is valid, red when pinched.
      ctx.strokeStyle = walkableHere ? "#3df08a" : "#ff5252";
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);

      // The exact points CollisionMap samples against the tile map.
      ctx.fillStyle = "#ffe95c";
      for (const [sx, sy] of ns.collisionSamplePoints(rect.x, rect.y, rect.w, rect.h)) {
        ctx.fillRect(sx - 2, sy - 2, 4, 4);
      }

      ctx.restore();

      // Screen-space readout.
      const tile = game.world.tileMap.tileAt(ptx, pty);
      const tileWalkable = game.world.tileMap.isWalkableTile(ptx, pty);
      const lines = [
        `tile (${ptx},${pty}) ${tile} — ${tileWalkable ? "walkable" : "BLOCKED"}`,
        `player rect ${walkableHere ? "clear" : "COLLIDING"} @ ${Math.round(player.x)},${Math.round(player.y)}`,
        "orange: props · purple: animals · blue: blocked tiles · C: hide",
      ];
      ctx.save();
      ctx.setTransform(renderer.dpr, 0, 0, renderer.dpr, 0, 0);
      const w = 372;
      const h = 16 + lines.length * 15;
      const x = 16;
      const y = game.screenHeight - h - 16;
      ctx.fillStyle = "rgba(10, 14, 20, 0.82)";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = "#3df08a";
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      ctx.fillStyle = "#d7ffe9";
      ctx.font = "600 11px monospace";
      ctx.textBaseline = "top";
      lines.forEach((line, i) => ctx.fillText(line, x + 10, y + 9 + i * 15));
      ctx.restore();
    }
  }

  ns.DebugOverlay = DebugOverlay;
})(window.MiftahGame || (window.MiftahGame = {}));
