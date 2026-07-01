// In-game map editor: lets the player toggle a build mode (F2) without
// leaving the running game, place props from the same catalog the
// standalone editor.html uses, and save straight to mapOverrides.json via
// the dev server's /api/save-map endpoint. Player movement stays active
// while editing so the map can be walked/tested immediately after placing.
(function (ns) {
  class EditModeSystem {
    constructor(game) {
      this.game = game;
      this.active = false;
      this.selected = null;
      this.moving = null;
      this.mouseWorld = null;
      this.ui = new ns.EditModeUI(this);
      this._bindEvents();
    }

    _bindEvents() {
      const canvas = this.game.canvas;
      canvas.addEventListener("mousemove", (event) => {
        if (!this.active) return;
        const rect = canvas.getBoundingClientRect();
        this.mouseWorld = {
          x: event.clientX - rect.left + this.game.camera.x,
          y: event.clientY - rect.top + this.game.camera.y,
        };
      });
      canvas.addEventListener("mouseleave", () => {
        this.mouseWorld = null;
      });
      canvas.addEventListener("click", () => {
        if (!this.active || !this.mouseWorld) return;
        if (this.moving) {
          this.dropMoving();
        } else if (this.selected) {
          this.placeSelected();
        } else {
          this.tryPickUpAt(this.mouseWorld.x, this.mouseWorld.y);
        }
      });
      window.addEventListener("keydown", (event) => {
        if (event.code === "F2") {
          event.preventDefault();
          this.toggle();
        } else if (event.code === "Escape" && this.active) {
          this.deselect();
        }
      });
    }

    toggle() {
      if (this.active) this.close();
      else this.open();
    }

    open() {
      this.active = true;
      if (this.game.trainer?.isOpen) this.game.trainer.close();
      this.ui.show();
    }

    close() {
      this.active = false;
      this.selected = null;
      this.moving = null;
      this.ui.hide();
    }

    select(item) {
      this.moving = null;
      this.selected = item;
      this.ui.setSelected(item);
      this.ui.setMoving(null);
    }

    deselect() {
      this.selected = null;
      this.moving = null;
      this.ui.setSelected(null);
      this.ui.setMoving(null);
      this.ui.setStatus("");
    }

    // Picks up any visible prop for repositioning if the click landed on one
    // (used when clicking the world with nothing selected in the palette).
    // Save writes the full production prop layer, so MapData-authored props
    // and editor-added props are both movable and persistent.
    tryPickUpAt(worldX, worldY) {
      const candidates = this.editableProps()
        .slice()
        .sort((a, b) => propSortY(a) - propSortY(b));
      for (let i = candidates.length - 1; i >= 0; i--) {
        const prop = candidates[i];
        if (worldX >= prop.x && worldX <= prop.x + prop.width && worldY >= prop.y && worldY <= prop.y + prop.height) {
          this.startMove(prop);
          return;
        }
      }
    }

    startMove(prop) {
      this.selected = null;
      this.moving = prop;
      this.ui.setSelected(null);
      this.ui.setMoving(prop);
      this.ui.setStatus(`Moving ${prop.hint || prop.assetKey} — click the world to drop it, Esc to cancel.`);
    }

    dropMoving() {
      const prop = this.moving;
      const x = this.snap(this.mouseWorld.x);
      const y = this.snap(this.mouseWorld.y);
      const asItem = itemFromProp(prop);
      if (!this.isValidPlacement(asItem, x, y, prop)) {
        this.ui.setStatus("Can't drop there — overlaps or out of bounds.");
        return;
      }
      prop.x = x;
      prop.y = y;
      prop.sortY = y + prop.height;
      if (prop.collider) prop.collider = this.colliderFor(asItem, x, y);
      this.moving = null;
      this.ui.setMoving(null);
      this.ui.refreshPlacedList();
      this.ui.setStatus("Moved.");
    }

    snap(value) {
      return Math.floor(value / this.game.world.tileSize) * this.game.world.tileSize;
    }

    colliderFor(item, x, y) {
      if (item.collider === false) return null;
      const c = Array.isArray(item.collider)
        ? item.collider
        : ns.editorDefaultCollider(item.width, item.height);
      return { x: x + c[0], y: y + c[1], w: c[2], h: c[3] };
    }

    isValidPlacement(item, x, y, ignoreProp = null) {
      const world = this.game.world;
      if (x < 0 || y < 0 || x + item.width > world.pixelWidth || y + item.height > world.pixelHeight) return false;
      const collider = this.colliderFor(item, x, y);
      if (!collider) return true;
      const existing = world.props.filter((p) => p !== ignoreProp).map((p) => p.collider).filter(Boolean);
      return !existing.some((other) => ns.rectsIntersect(collider, other));
    }

    placeSelected() {
      const item = this.selected;
      const x = this.snap(this.mouseWorld.x);
      const y = this.snap(this.mouseWorld.y);
      if (!this.isValidPlacement(item, x, y)) {
        this.ui.setStatus("Can't place there — overlaps or out of bounds.");
        return;
      }
      const prop = {
        id: `editor-${item.key.replace(/\./g, "-")}-${Date.now()}`,
        assetKey: item.key,
        x,
        y,
        width: item.width,
        height: item.height,
        layer: "object",
        hint: item.label,
        dialogue: "",
        sortY: y + item.height,
        collider: this.colliderFor(item, x, y),
      };
      this.game.world.props.push(prop);
      this.ui.refreshPlacedList();
      this.ui.setStatus("");
    }

    removeProp(prop) {
      const world = this.game.world;
      const i = world.props.indexOf(prop);
      if (i >= 0) world.props.splice(i, 1);
      if (this.moving === prop) {
        this.moving = null;
        this.ui.setMoving(null);
      }
      this.ui.refreshPlacedList();
    }

    editableProps() {
      return this.game.world.props.filter((prop) => prop.assetKey);
    }

    savedProps() {
      return this.game.world.props.map(serializeProp);
    }

    // Kept as a UI compatibility alias; this is no longer only overrides.
    overrideProps() {
      return this.editableProps();
    }

    async save() {
      this.ui.setStatus("Saving…");
      try {
        await saveMapOverrides({ version: 2, replaceProps: true, props: this.savedProps() });
        this.ui.setStatus(`Saved ${this.savedProps().length} prop(s).`);
      } catch (err) {
        this.ui.setStatus(`Save failed: ${friendlySaveError(err)}`);
      }
    }

    // Drawn after the main scene render so the grid/ghost sit above the
    // world but the call site (Game.frame) also keeps HUD/dialogue on top.
    drawOverlay(renderer) {
      if (!this.active) return;
      const ctx = renderer.ctx;
      const camera = this.game.camera;
      const ts = this.game.world.tileSize;
      ctx.save();
      ctx.setTransform(renderer.dpr, 0, 0, renderer.dpr, 0, 0);
      ctx.translate(-Math.round(camera.x), -Math.round(camera.y));

      ctx.strokeStyle = "rgba(255,255,255,0.10)";
      ctx.lineWidth = 1;
      const startX = Math.floor(camera.x / ts) * ts;
      const startY = Math.floor(camera.y / ts) * ts;
      for (let x = startX; x < camera.x + camera.width + ts; x += ts) {
        ctx.beginPath();
        ctx.moveTo(x, camera.y);
        ctx.lineTo(x, camera.y + camera.height);
        ctx.stroke();
      }
      for (let y = startY; y < camera.y + camera.height + ts; y += ts) {
        ctx.beginPath();
        ctx.moveTo(camera.x, y);
        ctx.lineTo(camera.x + camera.width, y);
        ctx.stroke();
      }

      if (this.selected && this.mouseWorld) {
        const x = this.snap(this.mouseWorld.x);
        const y = this.snap(this.mouseWorld.y);
        const valid = this.isValidPlacement(this.selected, x, y);
        const image = this.game.assets.get(this.selected.key);
        ctx.globalAlpha = 0.55;
        if (image) ctx.drawImage(image, x, y, this.selected.width, this.selected.height);
        ctx.globalAlpha = 0.32;
        ctx.fillStyle = valid ? "#4fd67a" : "#e0503f";
        ctx.fillRect(x, y, this.selected.width, this.selected.height);
        ctx.strokeStyle = valid ? "#8fffb0" : "#ffb3a0";
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, this.selected.width - 2, this.selected.height - 2);
        ctx.globalAlpha = 1;
      } else if (this.moving && this.mouseWorld) {
        const item = itemFromProp(this.moving);
        const x = this.snap(this.mouseWorld.x);
        const y = this.snap(this.mouseWorld.y);
        const valid = this.isValidPlacement(item, x, y, this.moving);
        const image = this.game.assets.get(this.moving.assetKey);
        ctx.globalAlpha = 0.55;
        if (image) ctx.drawImage(image, x, y, this.moving.width, this.moving.height);
        ctx.globalAlpha = 0.32;
        ctx.fillStyle = valid ? "#4fd67a" : "#e0503f";
        ctx.fillRect(x, y, this.moving.width, this.moving.height);
        ctx.strokeStyle = valid ? "#8fffb0" : "#ffb3a0";
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, this.moving.width - 2, this.moving.height - 2);
        ctx.globalAlpha = 1;
      } else if (!this.selected && !this.moving) {
        // Nothing armed — outline editable props so it's clear which ones can
        // be clicked to pick up.
        ctx.strokeStyle = "rgba(244, 187, 58, 0.55)";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        for (const prop of this.editableProps()) {
          ctx.strokeRect(prop.x + 1, prop.y + 1, prop.width - 2, prop.height - 2);
        }
        ctx.setLineDash([]);
      }
      ctx.restore();
    }
  }

  function propSortY(prop) {
    return prop.sortY || prop.y + prop.height;
  }

  function itemFromProp(prop) {
    return {
      width: prop.width,
      height: prop.height,
      collider: prop.collider
        ? [prop.collider.x - prop.x, prop.collider.y - prop.y, prop.collider.w, prop.collider.h]
        : false,
    };
  }

  function serializeProp(prop) {
    const out = { ...prop };
    delete out.fromOverride;
    return out;
  }

  async function saveMapOverrides(payload) {
    if (location.protocol === "file:") {
      throw new Error("Open the game through the dev server to save map edits.");
    }
    const res = await fetch("/api/save-map", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      throw new Error(`The current server does not support /api/save-map (${res.status}).`);
    }
    if (!res.ok || !data?.ok) {
      throw new Error(data?.error || `The save endpoint returned ${res.status}.`);
    }
    return data;
  }

  function friendlySaveError(err) {
    const message = err?.message || String(err);
    if (message.includes("/api/save-map") || message.includes("Failed to fetch")) {
      return `${message} Run node scripts/dev-server.mjs and open http://127.0.0.1:5173/index.html.`;
    }
    return message;
  }

  ns.EditModeSystem = EditModeSystem;
})(window.MiftahGame || (window.MiftahGame = {}));
