// Sticker Scenes (v59, 2026-10-16): the stickers a child chose stop being a
// grid of collected things and become toys. Four picture scenes — a meadow
// farm, the seaside, a night sky, a desert oasis — where any owned sticker can
// be placed (tap it in the tray, or drag it in), moved, wiggled, and taken off
// again (drag it to the bin, or select it and tap the bin). Each scene
// remembers its own arrangement; removing a placement keeps the owned sticker.
// Wordless; nothing is scored; it never runs out.
(function (ns) {
  const INK = "#4a3620";
  const MAX = 24;
  const BIN_ART = `<svg viewBox="0 0 100 90" aria-hidden="true"><path d="M28 28H72L68 78Q67 84 61 84H39Q33 84 32 78Z" fill="#ee806f" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M24 24H76Q79 24 79 28V32H21V28Q21 24 24 24Z" fill="#ffa798" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M39 19Q40 10 50 10Q60 10 61 19M42 43V68M58 43V68" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><circle cx="44" cy="54" r="2.4" fill="#fffdf7"/><circle cx="56" cy="54" r="2.4" fill="#fffdf7"/><path d="M45 61Q50 66 55 61" fill="none" stroke="#fffdf7" stroke-width="2.4" stroke-linecap="round"/><path d="M12 18L15 12L18 18L24 20L18 22L15 28L12 22L6 20Z" fill="#f3c955" stroke="${INK}" stroke-width="1.6"/><circle cx="83" cy="17" r="5" fill="#7fce54" stroke="${INK}" stroke-width="1.6"/></svg>`;

  // ---------- the four scenes (800×500, flat + ink, palette only) ----------
  // v140: the village sun's soft rounded rays and shine.
  const sun = (x, y, r) => `<g transform="translate(${x} ${y})">${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<ellipse cy="${-r - 12}" rx="${r * 0.16}" ry="${r * 0.26}" fill="#ffe49a" transform="rotate(${a})"/>`).join("")}<circle r="${r}" fill="#ffe49a" stroke="#f3c955" stroke-width="4"/><ellipse cx="${-r * 0.36}" cy="${-r * 0.4}" rx="${r * 0.32}" ry="${r * 0.16}" fill="#fffdf7" opacity=".6"/></g>`;
  const cloud = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-40 14Q-50 14 -46 2Q-46 -10 -30 -10Q-26 -26 -8 -26Q8 -32 18 -18Q36 -22 40 -6Q52 -4 48 8Q48 16 38 16H-36Q-40 16 -40 14Z" fill="#fffaf0"/><path d="M-38 12Q0 20 42 12Q44 16 36 16H-34Q-40 16 -38 12Z" fill="#ccfbef"/><ellipse cx="-14" cy="-14" rx="10" ry="4" fill="#fffdf7" opacity=".9"/></g>`; // v139: puffy, like the village (v121)
  const tuft = (x, y, c = "#4e9677") => `<path d="M${x - 8} ${y}Q${x - 6} ${y - 12} ${x - 2} ${y}M${x} ${y}Q${x + 1} ${y - 16} ${x + 4} ${y}M${x + 4} ${y}Q${x + 8} ${y - 10} ${x + 10} ${y}" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round"/>`;
  const D = ns.DetailKit;
  const SCENES = {
    meadow: {
      sky: "#96ecff",
      art: () => `<rect width="800" height="500" fill="#96ecff"/>
        ${sun(540, 80, 40)}
        ${cloud(290, 80)}${cloud(660, 60, 0.8)}
        <path d="M0 250Q160 190 330 230Q520 270 800 210V500H0Z" fill="#b7e779"/>
        <path d="M0 320Q220 270 430 310Q620 345 800 300V500H0Z" fill="#7fce54"/>
        ${D ? `<g transform="translate(520 286) scale(1.2)">${D.barn()}</g><g transform="translate(690 270) scale(.7)">${D.tree({ kind: "round", seed: 7 })}</g>` : ""}
        <rect x="-10" y="400" width="820" height="12" rx="6" fill="#fffaf0" stroke="${INK}" stroke-width="3"/>${Array.from({ length: 17 }, (_, i) => `<rect x="${i * 50 + 6}" y="380" width="18" height="52" rx="9" fill="#fffaf0" stroke="${INK}" stroke-width="3"/><path d="M${i * 50 + 19} 388V424" stroke="#e5dcc8" stroke-width="2.4" stroke-linecap="round"/>`).join("")}
        ${[60, 220, 330, 470, 700].map((x, i) => tuft(x, 300 + (i % 2) * 40)).join("")}
        ${D ? `<g transform="translate(270 300) scale(1.25)">${D.tree({ seed: 2 })}</g>` : ""}`,
    },
    sea: {
      sky: "#ccfbef",
      art: () => `<rect width="800" height="500" fill="#ccfbef"/>
        ${sun(290, 90, 36)}
        ${cloud(480, 70, 0.9)}${cloud(680, 110, 0.7)}
        <path d="M0 210H800V360H0Z" fill="#62cdf4"/>
        <path d="M0 230Q50 220 100 230T200 230T300 230T400 230T500 230T600 230T700 230T800 230" fill="none" stroke="#96ecff" stroke-width="4"/>
        <path d="M0 290Q60 280 120 290T240 290T360 290T480 290T600 290T720 290T840 290" fill="none" stroke="#96ecff" stroke-width="4"/>
        ${D ? `<g transform="translate(520 250) scale(1.05)">${D.boat()}</g>` : ""}
        <path d="M0 340Q200 320 400 340Q600 360 800 330V500H0Z" fill="#ffe49a"/>
        <path d="M0 360Q220 345 420 362Q620 378 800 350" fill="none" stroke="#fffdf7" stroke-width="6" stroke-linecap="round" opacity=".8"/>
        ${[[120, 430], [300, 460], [520, 420], [700, 450]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#c69434"/><circle cx="${x + 12}" cy="${y + 6}" r="2.4" fill="#c69434"/>`).join("")}
        ${D ? `<g transform="translate(200 460) scale(1.35)">${D.palm({ lean: 1 })}</g><g transform="translate(680 440) scale(.85)">${D.palm({ lean: -1, height: 100 })}</g>` : ""}`,
    },
    night: {
      sky: "#34375f",
      art: () => `<rect width="800" height="500" fill="#34375f"/>
        <rect width="800" height="260" fill="#23253f"/>
        ${[[60, 40], [180, 110], [300, 50], [420, 130], [540, 60], [700, 140], [760, 50], [120, 190], [620, 210], [360, 200]].map(([x, y], i) => `<path d="M${x} ${y - 6}Q${x} ${y} ${x + 6} ${y}Q${x} ${y} ${x} ${y + 6}Q${x} ${y} ${x - 6} ${y}Q${x} ${y} ${x} ${y - 6}Z" fill="#fffaf0" opacity="${0.5 + (i % 3) * 0.2}"/>`).join("")}
        <path d="M520 40A50 50 0 1 0 536 132A38 38 0 1 1 520 40Z" fill="#ffe49a" stroke="#f3c955" stroke-width="4"/><ellipse cx="476" cy="78" rx="4" ry="10" fill="#fffdf7" opacity=".8" transform="rotate(14 476 78)"/>
        <path d="M0 330Q180 280 380 320Q600 360 800 300V500H0Z" fill="#4a4d84"/>
        <path d="M0 400Q240 360 460 392Q640 418 800 380V500H0Z" fill="#2f5c46"/>
        ${D ? `<g transform="translate(300 352) scale(1.15)">${D.house({ wall: "#6064a0", wallLine: "#4a4d84", roof: "#4a4d84", roofDark: "#34375f", door: "#34375f", doorDark: "#23253f", night: true })}</g><g transform="translate(150 360) scale(.85)">${D.tree({ kind: "round", seed: 5, leaf: ["#4e9677", "#2f5c46", "#23253f"] })}</g>` : ""}
        ${[[480, 420], [560, 440], [640, 410]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#ffe49a" opacity=".85"/>`).join("")}`,
    },
    oasis: {
      sky: "#ffe49a",
      art: () => `<rect width="800" height="500" fill="#ffe49a"/>
        <circle cx="400" cy="120" r="56" fill="#ffa06e" stroke="#e8743c" stroke-width="6"/>
        <path d="M0 260Q120 200 260 240Q400 280 540 230Q680 190 800 240V500H0Z" fill="#f3c955"/>
        <path d="M0 330Q200 290 400 320Q620 350 800 310V500H0Z" fill="#c69434"/>
        <ellipse cx="420" cy="390" rx="170" ry="40" fill="#62cdf4" stroke="#3a8fc4" stroke-width="3"/>
        <path d="M300 386Q340 380 380 386M450 398Q490 392 530 398" fill="none" stroke="#96ecff" stroke-width="4" stroke-linecap="round"/>
        ${D ? [[292, 402, 1], [532, 394, -1]].map(([x, y, l]) => `<g transform="translate(${x} ${y}) scale(1.3)">${D.palm({ lean: l, height: 130 })}</g>`).join("") : ""}
        <path d="M60 300Q90 260 130 300Z" fill="#e8743c" opacity=".5"/><path d="M680 290Q720 250 760 290Z" fill="#e8743c" opacity=".5"/>`,
    },
  };
  const SCENE_IDS = Object.keys(SCENES);
  const sceneArt = (id) => `<svg class="ss-scene-art" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${(SCENES[id] || SCENES.meadow).art()}</svg>`;

  // A saved arrangement is a list of {id, x, y} in percent of the picture.
  function clean(list, owned) {
    const ok = new Set(owned);
    return (Array.isArray(list) ? list : []).filter((s) => s && ok.has(s.id) && Number.isFinite(s.x) && Number.isFinite(s.y))
      .map((s) => ({ id: s.id, x: Math.max(4, Math.min(96, s.x)), y: Math.max(6, Math.min(94, s.y)) })).slice(0, MAX);
  }

  class StickerScene {
    constructor(ctx) {
      this.ctx = ctx;
      this.alive = true;
      this.ghosts = new Set();
      this.activeGesture = null;
      this.selectedIndex = null;
      this.removals = {};
      this.scene = SCENE_IDS.includes(ctx.scene) ? ctx.scene : SCENE_IDS[0];
      this.all = ctx.layouts && typeof ctx.layouts === "object" ? ctx.layouts : {};
      this.render();
    }
    get placed() { return (this.all[this.scene] = clean(this.all[this.scene], this.ctx.owned)); }
    save() { this.ctx.save?.(this.all); }
    render() {
      this.cancelGesture();
      this.renderVersion = (this.renderVersion || 0) + 1;
      const stage = this.ctx.stage;
      stage.innerHTML = `<div class="ss-wrap">
        <div class="ss-scenes" role="tablist" aria-label="Pictures">${SCENE_IDS.map((id) => `<button type="button" role="tab" class="ss-scene-tab${id === this.scene ? " is-on" : ""}" data-scene="${id}" aria-selected="${id === this.scene}" aria-label="${id} picture">${sceneArt(id)}</button>`).join("")}</div>
        <div class="ss-board" data-scene="${this.scene}" aria-label="Your sticker picture">${sceneArt(this.scene)}<div class="ss-layer"></div><button type="button" class="ss-undo" aria-label="Put back the last removed sticker" disabled>${ns.LettersArt.icon('undo', 32)}</button><button type="button" class="ss-bin" aria-label="Sticker bin" title="Sticker bin">${BIN_ART}</button></div>
        <div class="ss-tray" role="group" aria-label="Your stickers">${this.ctx.owned.map((id) => `<button type="button" class="ss-pick" data-sticker="${id}" aria-label="Place the ${id} sticker">${this.ctx.stickerArt(id, 64)}</button>`).join("")}</div>
      </div>`;
      this.board = stage.querySelector(".ss-board");
      this.layer = stage.querySelector(".ss-layer");
      this.bin = stage.querySelector(".ss-bin");
      this.undoButton = stage.querySelector(".ss-undo");
      this.tray = stage.querySelector(".ss-tray");
      this.drawPlaced();
      const generation = this.renderVersion;
      this.wireBin(generation);
      this.undoButton.addEventListener("click", (e) => {
        if (!this.alive || generation !== this.renderVersion) return;
        const restored = this.undoRemoval();
        if (restored && e.detail === 0) this.layer.querySelector('.is-new')?.focus();
      });
      stage.querySelectorAll(".ss-scene-tab").forEach((b) => b.addEventListener("click", () => {
        if (!this.alive || generation !== this.renderVersion || b.dataset.scene === this.scene) return;
        this.cancelGesture();
        this.selectedIndex = null;
        this.scene = b.dataset.scene;
        this.ctx.sound?.("page");
        this.render();
      }));
      stage.querySelectorAll(".ss-pick").forEach((b) => this.wirePick(b, generation));
    }
    wireBin(generation = this.renderVersion) {
      const bin = this.bin;
      this.bin?.addEventListener("click", () => {
        if (!this.alive || generation !== this.renderVersion || this.bin !== bin || this.selectedIndex == null) return;
        this.removeAt(this.selectedIndex);
      });
    }
    // v252: a sticker placed in a scene is die-cut: the motif with a white
    // border that follows its shape, not the album's round disc.
    cutArt(id) {
      const M = ns.LettersArt?.stickerMotif;
      if (!M) return this.ctx.stickerArt(id, 96);
      const art = M(id, 96);
      return `<span class="ss-cut" aria-hidden="true">${art}</span>${art}`;
    }
    drawPlaced() {
      this.layer.innerHTML = this.placed.map((s, i) => `<button type="button" class="ss-sticker${i === this.selectedIndex ? " is-selected" : ""}" data-i="${i}" aria-label="${s.id} sticker${i === this.selectedIndex ? ", selected" : ""}" aria-pressed="${i === this.selectedIndex}" style="left:${s.x}%;top:${s.y}%">${this.cutArt(s.id)}</button>`).join("");
      this.layer.querySelectorAll(".ss-sticker").forEach((b) => this.wirePlaced(b));
      this.updateBin();
    }
    updateBin() {
      const selected = this.selectedIndex == null ? null : this.placed[this.selectedIndex];
      this.bin?.classList.toggle("has-selection", !!selected);
      this.bin?.setAttribute("aria-label", selected ? `Remove selected ${selected.id} sticker` : "Sticker bin");
      if (this.undoButton) this.undoButton.disabled = !this.removals?.[this.scene]?.length || this.placed.length >= MAX;
    }
    select(index) {
      if (!this.alive || !this.placed[index]) return;
      this.selectedIndex = this.selectedIndex === index ? null : index;
      this.layer.querySelectorAll(".ss-sticker").forEach((b) => {
        const selected = Number(b.dataset.i) === this.selectedIndex;
        b.classList.toggle("is-selected", selected);
        b.setAttribute("aria-pressed", String(selected));
        const sticker = this.placed[Number(b.dataset.i)];
        b.setAttribute("aria-label", `${sticker?.id || "Sticker"} sticker${selected ? ", selected" : ""}`);
      });
      this.updateBin();
    }
    removeAt(index) {
      if (!this.alive) return false;
      const list = this.placed;
      if (!Number.isInteger(index) || index < 0 || index >= list.length) return false;
      this.cancelGesture();
      const history = (this.removals ||= {})[this.scene] ||= [];
      history.push({ index, sticker: { ...list[index] } });
      if (history.length > MAX) history.shift();
      list.splice(index, 1);
      this.selectedIndex = null;
      this.all[this.scene] = clean(list, this.ctx.owned);
      this.save();
      this.drawPlaced();
      this.ctx.sound?.("pop");
      return true;
    }
    undoRemoval() {
      if (!this.alive) return false;
      const history = this.removals?.[this.scene], list = this.placed;
      if (!history?.length || list.length >= MAX) return false;
      this.cancelGesture();
      const entry = history.pop();
      if (!this.ctx.owned.includes(entry.sticker.id)) { this.updateBin(); return false; }
      const index = Math.min(entry.index, list.length);
      list.splice(index, 0, { ...entry.sticker });
      this.all[this.scene] = clean(list, this.ctx.owned);
      this.selectedIndex = null;
      this.save();
      this.drawPlaced();
      this.layer.querySelector(`[data-i="${index}"]`)?.classList.add("is-new");
      this.ctx.sound?.("sticker");
      return true;
    }
    overBin(e, slack = 24) {
      const r = this.bin?.getBoundingClientRect?.();
      if (!r?.width || !r?.height) return false;
      const right = r.right ?? r.left + r.width, bottom = r.bottom ?? r.top + r.height;
      return e.clientX >= r.left - slack && e.clientX <= right + slack && e.clientY >= r.top - slack && e.clientY <= bottom + slack;
    }
    cancelGesture() {
      const gesture = this.activeGesture;
      this.activeGesture = null;
      if (!gesture) return;
      gesture.cancel?.();
      if (gesture.pointerId != null && gesture.element?.releasePointerCapture) {
        try {
          if (!gesture.element.hasPointerCapture || gesture.element.hasPointerCapture(gesture.pointerId)) gesture.element.releasePointerCapture(gesture.pointerId);
        } catch { /* capture may already have ended */ }
      }
      this.bin?.classList.remove("is-target");
    }
    toBoard(e) {
      const r = this.board.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100, inside: e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom };
    }
    add(id, x, y) {
      if (!this.alive || !this.ctx.owned?.includes(id) || !Number.isFinite(x) || !Number.isFinite(y)) return false;
      const list = this.placed;
      if (list.length >= MAX) list.shift();
      list.push({ id, x, y });
      this.all[this.scene] = clean(list, this.ctx.owned);
      this.save();
      this.drawPlaced();
      const last = this.layer.lastElementChild;
      last?.classList.add("is-new");
      this.ctx.sound?.("sticker");
      return true;
    }
    // A sticker in the tray: tap to place it somewhere free, or drag it in.
    wirePick(btn, generation = this.renderVersion) {
      const id = btn.dataset.sticker;
      const current = () => this.alive && generation === this.renderVersion;
      let drag = null;
      const cancelOwn = (e) => {
        if (drag && this.activeGesture?.element === btn && (e.pointerId === undefined || drag.pointerId === undefined || e.pointerId === drag.pointerId)) this.cancelGesture();
      };
      btn.addEventListener("pointerdown", (e) => {
        if (!current() || this.activeGesture || (e.button != null && e.button !== 0)) return;
        drag = { x0: e.clientX, y0: e.clientY, moved: false, ghost: null, pointerId: e.pointerId };
        this.activeGesture = { element: btn, pointerId: e.pointerId, cancel: () => { drag?.ghost?.remove(); if (drag?.ghost) this.ghosts.delete(drag.ghost); drag = null; } };
        btn.setPointerCapture?.(e.pointerId);
      });
      btn.addEventListener("pointermove", (e) => {
        if (!current()) { cancelOwn(e); return; }
        if (!drag || (drag.pointerId !== undefined && e.pointerId !== drag.pointerId)) return;
        if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 8) {
          drag.moved = true;
          drag.ghost = document.createElement("div");
          drag.ghost.className = "ss-ghost";
          drag.ghost.innerHTML = this.ctx.stickerArt(id, 96);
          document.body.appendChild(drag.ghost);
          this.ghosts.add(drag.ghost);
        }
        if (drag.ghost) Object.assign(drag.ghost.style, { left: `${e.clientX}px`, top: `${e.clientY}px` });
      });
      const end = (e) => {
        if (!current()) { cancelOwn(e); return; }
        if (!drag || (drag.pointerId !== undefined && e.pointerId !== drag.pointerId)) return;
        const d = drag; drag = null;
        d.ghost?.remove();
        if (d.ghost) this.ghosts.delete(d.ghost);
        if (this.activeGesture?.pointerId === d.pointerId) this.activeGesture = null;
        if (!this.alive) return;
        if (!d.moved) {
          // Tap: somewhere in the middle of the picture, a little different each time.
          const n = this.placed.length;
          return this.add(id, 30 + ((n * 37) % 40) + Math.random() * 6, 40 + ((n * 23) % 34) + Math.random() * 6);
        }
        const p = this.toBoard(e);
        if (p.inside && !this.overBin(e)) this.add(id, p.x, p.y);
      };
      btn.addEventListener("pointerup", end);
      const cancel = (e) => { if (drag && (e.pointerId === undefined || drag.pointerId === undefined || e.pointerId === drag.pointerId)) this.cancelGesture(); };
      btn.addEventListener("pointercancel", cancel);
      btn.addEventListener("lostpointercapture", cancel);
      // Keyboard / switch: Enter or Space places it.
      btn.addEventListener("keydown", (e) => { if (current() && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); const n = this.placed.length; this.add(id, 30 + ((n * 37) % 40), 40 + ((n * 23) % 34)); } });
    }
    // A placed sticker: tap to select and wiggle, drag to move, or take it to the bin.
    wirePlaced(btn, generation = this.renderVersion) {
      const sceneId = this.scene, layer = this.layer;
      const current = () => this.alive && generation === this.renderVersion && sceneId === this.scene && layer === this.layer;
      let drag = null;
      const cancelOwn = (e) => {
        if (drag && this.activeGesture?.element === btn && (e.pointerId === undefined || drag.pointerId === undefined || e.pointerId === drag.pointerId)) this.cancelGesture();
      };
      btn.addEventListener("pointerdown", (e) => {
        if (!current() || this.activeGesture || (e.button != null && e.button !== 0)) return;
        drag = { x0: e.clientX, y0: e.clientY, moved: false, pointerId: e.pointerId, originalLeft: btn.style.left, originalTop: btn.style.top };
        this.activeGesture = { element: btn, pointerId: e.pointerId, cancel: () => { drag = null; btn.classList.remove("is-held", "is-leaving", "is-over-bin"); this.bin?.classList.remove("is-target"); if (this.alive) this.drawPlaced(); } };
        btn.setPointerCapture?.(e.pointerId);
        btn.classList.add("is-held");
      });
      btn.addEventListener("pointermove", (e) => {
        if (!current()) { cancelOwn(e); return; }
        if (!drag || (drag.pointerId !== undefined && e.pointerId !== drag.pointerId)) return;
        if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 8) drag.moved = true;
        if (!drag.moved) return;
        const p = this.toBoard(e);
        btn.style.left = `${p.x}%`; btn.style.top = `${p.y}%`;
        btn.classList.toggle("is-leaving", !p.inside);
        btn.classList.toggle("is-over-bin", p.inside && this.overBin(e));
        this.bin?.classList.toggle("is-target", p.inside && this.overBin(e));
      });
      const end = (e) => {
        if (!current()) { cancelOwn(e); return; }
        if (!drag || (drag.pointerId !== undefined && e.pointerId !== drag.pointerId)) return;
        const d = drag; drag = null;
        btn.classList.remove("is-held", "is-leaving", "is-over-bin");
        this.bin?.classList.remove("is-target");
        if (this.activeGesture?.pointerId === d.pointerId) this.activeGesture = null;
        if (!this.alive) return;
        const i = Number(btn.dataset.i), list = this.placed;
        if (!d.moved) {
          this.select(i);
          const art = btn.querySelector("svg");
          if (art && !this.ctx.reducedMotion?.()) art.animate?.([{ transform: "none" }, { transform: "rotate(-12deg) scale(1.12)" }, { transform: "rotate(9deg)" }, { transform: "none" }], { duration: 520, easing: "ease-in-out" });
          this.ctx.sound?.("boing");
          return;
        }
        const p = this.toBoard(e);
        if (p.inside && this.overBin(e)) { this.removeAt(i); return; }
        if (!p.inside) { this.drawPlaced(); return; }
        this.selectedIndex = null;
        list[i] = { ...list[i], x: p.x, y: p.y }; list.push(list.splice(i, 1)[0]);
        this.all[this.scene] = clean(list, this.ctx.owned);
        this.save();
        this.drawPlaced();
      };
      btn.addEventListener("pointerup", end);
      const cancel = (e) => { if (drag && (e.pointerId === undefined || drag.pointerId === undefined || e.pointerId === drag.pointerId)) this.cancelGesture(); };
      btn.addEventListener("pointercancel", cancel);
      btn.addEventListener("lostpointercapture", cancel);
      btn.addEventListener("keydown", (e) => {
        if (!current() || (e.key !== "Enter" && e.key !== " ")) return;
        e.preventDefault(); this.select(Number(btn.dataset.i));
      });
    }
    destroy() {
      this.alive = false;
      this.cancelGesture();
      this.ghosts.forEach((ghost) => ghost.remove()); this.ghosts.clear();
    }
  }

  ns.StickerScenes = { SCENE_IDS, sceneArt, clean, StickerScene, MAX };
})(window.MiftahGame || (window.MiftahGame = {}));
