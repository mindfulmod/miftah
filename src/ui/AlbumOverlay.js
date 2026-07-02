// Garden Album — the island's collection book (Animal-Crossing-museum
// energy): a page per animal showing its growth stage, home and hatch day,
// silhouettes for keepers still to come, and a shelf of nature gifts found
// around the island. Opened from the pavilion or with B.
(function (ns) {
  const STAGE_NAMES = ["", "Baby", "Young", "Fully grown"];

  class AlbumOverlay {
    constructor(game) {
      this.game = game;
      this.isOpen = false;
      this.root = document.createElement("section");
      this.root.className = "album-overlay";
      this.root.hidden = true;
      this.root.innerHTML = `
        <div class="album-card" role="dialog" aria-modal="true" aria-labelledby="album-title">
          <button class="album-close" type="button" aria-label="Close album">×</button>
          <header class="album-header">
            <h2 id="album-title">Garden Album</h2>
            <p class="album-sub"></p>
          </header>
          <div class="album-scroll">
            <div class="album-grid"></div>
            <h3 class="album-shelf-title">Shelf of small finds</h3>
            <div class="album-shelf"></div>
          </div>
        </div>
      `;
      document.body.appendChild(this.root);
      this.subEl = this.root.querySelector(".album-sub");
      this.gridEl = this.root.querySelector(".album-grid");
      this.shelfEl = this.root.querySelector(".album-shelf");
      this.root.querySelector(".album-close").addEventListener("click", () => this.close());
      this.root.addEventListener("click", (event) => {
        if (event.target === this.root) this.close();
      });
      window.addEventListener("keydown", (event) => {
        if (this.isOpen && event.code === "Escape") this.close();
      });
    }

    toggle() {
      if (this.isOpen) this.close();
      else this.open();
    }

    open() {
      this.isOpen = true;
      this.root.hidden = false;
      this.game.sound.play("page");
      this.render();
    }

    close() {
      this.isOpen = false;
      this.root.hidden = true;
    }

    stagePathFor(id, stage) {
      const entry = ns.ASSETS.animals.collection[id];
      if (!entry) return "";
      return entry.stages[Math.max(0, Math.min(2, stage - 1))];
    }

    render() {
      const progress = this.game.progress;
      const catalog = ns.ANIMAL_CATALOG;
      const unlockedCount = catalog.filter((a) => progress.animalProgress(a.id)).length;
      this.subEl.textContent = `${unlockedCount}/${catalog.length} keepers home · every ayah studied brings the next one closer`;

      this.gridEl.innerHTML = "";
      for (const animal of catalog) {
        const record = progress.animalProgress(animal.id);
        const isEgg = progress.state.activeEgg?.animalId === animal.id;
        const card = document.createElement("article");
        card.className = "album-animal" + (record ? " is-hatched" : " is-locked");

        const img = document.createElement("img");
        img.alt = "";
        if (record) {
          img.src = this.stagePathFor(animal.id, record.stage);
        } else if (isEgg) {
          img.src = "assets/generated/props/prop_hatching_egg.png";
          img.classList.add("is-egg");
        } else {
          img.src = this.stagePathFor(animal.id, 3);
          img.classList.add("is-silhouette");
        }

        const name = document.createElement("p");
        name.className = "album-animal-name";
        name.textContent = record || isEgg ? animal.name : "???";

        const meta = document.createElement("p");
        meta.className = "album-animal-meta";
        if (record) {
          const hatched = record.hatchedAt
            ? new Date(record.hatchedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })
            : null;
          meta.textContent = `${STAGE_NAMES[record.stage] || "Baby"} · ${animal.habitat}` + (hatched ? ` · hatched ${hatched}` : "");
        } else if (isEgg) {
          meta.textContent = "An egg is stirring in the hatchery…";
        } else {
          meta.textContent = "Still an egg-dream — keep studying.";
        }

        card.append(img, name, meta);
        this.gridEl.appendChild(card);
      }

      this.shelfEl.innerHTML = "";
      const gifts = Object.entries(progress.state.gifts || {});
      const kinds = Object.values(ns.GIFT_KINDS || {});
      if (!gifts.length) {
        const empty = document.createElement("p");
        empty.className = "album-shelf-empty";
        empty.textContent = "Nothing found yet — each open isle leaves one small gift a day. Keep your eyes out for a sparkle.";
        this.shelfEl.appendChild(empty);
        return;
      }
      for (const [giftId, count] of gifts) {
        const kind = kinds.find((k) => k.id === giftId);
        if (!kind) continue;
        const item = document.createElement("div");
        item.className = "album-gift";
        const img = document.createElement("img");
        img.alt = "";
        img.src = this.assetPath(kind.assetKey);
        const label = document.createElement("span");
        label.textContent = `${kind.label} ×${count}`;
        item.append(img, label);
        item.title = kind.blurb;
        this.shelfEl.appendChild(item);
      }
    }

    assetPath(key) {
      return key.split(".").reduce((node, part) => (node ? node[part] : ""), ns.ASSETS) || "";
    }
  }

  ns.AlbumOverlay = AlbumOverlay;
})(window.MiftahGame || (window.MiftahGame = {}));
