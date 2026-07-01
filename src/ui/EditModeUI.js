// DOM palette/panel for the in-game map editor (EditModeSystem). Kept as
// a thin HTML overlay alongside the canvas so the player can see the live
// world underneath while picking what to place — same catalog and save
// endpoint as the standalone editor.html, just reachable without leaving
// the game (press F2).
(function (ns) {
  class EditModeUI {
    constructor(editMode) {
      this.editMode = editMode;
      this.root = null;
      this.paletteEl = null;
      this.placedListEl = null;
      this.statusEl = null;
      this._build();
    }

    _build() {
      const root = document.createElement("div");
      root.className = "editmode-panel";
      root.hidden = true;
      root.innerHTML = `
        <div class="editmode-header">
          <h2>Map Editor</h2>
          <div class="editmode-actions">
            <button type="button" class="editmode-save">Save</button>
            <button type="button" class="editmode-close">Close (F2)</button>
          </div>
        </div>
        <div class="editmode-status"></div>
        <div class="editmode-hint">Click a prop, then click the world to place it. With nothing selected, click any dashed prop to pick it up and click again to drop it — or use Move below. Esc cancels. Walk around with WASD to test — placements block movement live.</div>
        <div class="editmode-palette"></div>
        <div class="editmode-placed">
          <h3>Map props <span class="editmode-count">0</span></h3>
          <div class="editmode-placed-list"><p class="editmode-empty">No editable props.</p></div>
        </div>
      `;
      document.querySelector(".game-shell")?.appendChild(root) || document.body.appendChild(root);

      this.root = root;
      this.paletteEl = root.querySelector(".editmode-palette");
      this.placedListEl = root.querySelector(".editmode-placed-list");
      this.statusEl = root.querySelector(".editmode-status");
      this.countEl = root.querySelector(".editmode-count");

      root.querySelector(".editmode-close").addEventListener("click", () => this.editMode.close());
      root.querySelector(".editmode-save").addEventListener("click", () => this.editMode.save());

      this._buildPalette();
    }

    _buildPalette() {
      const catalog = ns.EDITOR_CATALOG || [];
      const categories = [...new Set(catalog.map((item) => item.category))];
      for (const category of categories) {
        const heading = document.createElement("h3");
        heading.textContent = category;
        this.paletteEl.appendChild(heading);
        for (const item of catalog.filter((i) => i.category === category)) {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "editmode-item";
          const [group, key] = item.key.split(".");
          const img = document.createElement("img");
          img.src = ns.ASSETS[group][key];
          const label = document.createElement("span");
          label.textContent = item.label;
          button.append(img, label);
          button.addEventListener("click", () => {
            for (const el of this.paletteEl.querySelectorAll(".editmode-item")) el.classList.remove("is-selected");
            button.classList.add("is-selected");
            this.editMode.select(item);
          });
          this.paletteEl.appendChild(button);
        }
      }
    }

    setSelected(item) {
      if (!item) {
        for (const el of this.paletteEl.querySelectorAll(".editmode-item")) el.classList.remove("is-selected");
      }
    }

    setMoving(prop) {
      this._movingProp = prop;
      for (const el of this.placedListEl.querySelectorAll(".editmode-placed-row")) {
        el.classList.toggle("is-moving", el._prop === prop);
      }
    }

    setStatus(message) {
      this.statusEl.textContent = message;
    }

    refreshPlacedList() {
      const placed = this.editMode.overrideProps();
      this.countEl.textContent = String(placed.length);
      this.placedListEl.innerHTML = "";
      if (!placed.length) {
        const note = document.createElement("p");
        note.className = "editmode-empty";
        note.textContent = "No editable props.";
        this.placedListEl.appendChild(note);
        return;
      }
      const ts = this.editMode.game.world.tileSize;
      for (const prop of placed) {
        const row = document.createElement("div");
        row.className = "editmode-placed-row";
        row._prop = prop;
        if (this._movingProp === prop) row.classList.add("is-moving");
        const label = document.createElement("span");
        label.textContent = `${prop.assetKey} @ (${Math.round(prop.x / ts)},${Math.round(prop.y / ts)})`;
        const moveBtn = document.createElement("button");
        moveBtn.type = "button";
        moveBtn.className = "editmode-move-btn";
        moveBtn.textContent = "Move";
        moveBtn.addEventListener("click", () => this.editMode.startMove(prop));
        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.textContent = "Remove";
        removeBtn.addEventListener("click", () => this.editMode.removeProp(prop));
        row.append(label, moveBtn, removeBtn);
        this.placedListEl.appendChild(row);
      }
    }

    show() {
      this.root.hidden = false;
      this.refreshPlacedList();
      this.setStatus("");
    }

    hide() {
      this.root.hidden = true;
    }
  }

  ns.EditModeUI = EditModeUI;
})(window.MiftahGame || (window.MiftahGame = {}));
