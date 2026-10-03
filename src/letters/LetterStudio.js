// Letter Studio (v13, 2026-10-02): a creative corner. The child stamps the
// letters they know (each one says its name as it lands) and their sticker
// friends onto a picture of their land, in a few garden inks, then hangs the
// picture as a sign in their own garden. Nothing is judged or reported.
(function (ns) {
  const SVGNS = "http://www.w3.org/2000/svg";
  const INKS = ["#4a3620", "#c25a49", "#2f5c46", "#3a8fc4", "#70501b"];
  const LANDS = {
    meadow: ["#96ecff", "#b7e779", "#7fce54"], orchard: ["#ccfbef", "#b7e779", "#7fce54"], lagoon: ["#96ecff", "#b7e779", "#62cdf4"],
    night: ["#4a4d84", "#4e9677", "#2f5c46"], peaks: ["#ccfbef", "#e5dcc8", "#b7e779"], river: ["#96ecff", "#b7e779", "#7fce54"],
  };
  const FONT = "'Amiri Quran', serif";

  class LetterStudio {
    constructor(ctx) {
      this.ctx = ctx;
      this.alive = true;
      this.letters = (ctx.items || []).filter((i) => i?.display && [...i.display].length === 1).slice(0, 28);
      this.stickers = (ctx.stickers || []).slice(0, 12);
      this.colors = LANDS[ctx.land] || LANDS.meadow;
      this.ink = INKS[0];
      this.pick = this.letters[0] ? { kind: "letter", item: this.letters[0] } : null;
      this.stamps = [];
      const [sky, far, ground] = this.colors;
      ctx.stage.innerHTML = `<div class="studio">
        <svg class="studio-canvas" viewBox="0 0 400 300" aria-label="Your picture">
          <rect width="400" height="300" fill="${sky}"/>
          <path d="M0 170Q100 140 200 160Q300 180 400 150V300H0Z" fill="${far}"/>
          <path d="M0 210Q130 180 260 205Q340 220 400 200V300H0Z" fill="${ground}"/>
          <g class="studio-stamps"></g>
        </svg>
        <div class="studio-inks" role="group" aria-label="Ink">${INKS.map((c, i) => `<button type="button" class="studio-ink${i === 0 ? " is-on" : ""}" data-ink="${c}" style="--ink:${c}" aria-label="Ink ${i + 1}"></button>`).join("")}</div>
        <div class="studio-tray" role="group" aria-label="Stamps">
          ${this.letters.map((l, i) => `<button type="button" class="studio-stamp${i === 0 ? " is-on" : ""}" data-letter="${i}" aria-label="${l.display} stamp">${l.display}</button>`).join("")}
          ${this.stickers.map((id) => `<button type="button" class="studio-stamp is-sticker" data-sticker="${id}" aria-label="${id} stamp">${ns.LettersArt.stickerMotif(id, 40)}</button>`).join("")}
        </div>
        <div class="studio-tools">
          <button type="button" class="lg-round-btn studio-undo" aria-label="Take back the last stamp" disabled>${ns.LettersArt.icon("undo", 28)}</button>
          <button type="button" class="lg-big-btn studio-hang" aria-label="Hang the picture in your garden" disabled>${ns.LettersArt.icon("check", 34)}</button>
        </div>
      </div>`;
      const $ = (s) => ctx.stage.querySelector(s);
      this.svg = $(".studio-canvas");
      this.layer = $(".studio-stamps");
      this.undoBtn = $(".studio-undo");
      this.hangBtn = $(".studio-hang");
      ctx.stage.querySelectorAll(".studio-stamp").forEach((b) => b.addEventListener("click", () => {
        ctx.stage.querySelectorAll(".studio-stamp").forEach((o) => o.classList.toggle("is-on", o === b));
        this.pick = b.dataset.sticker ? { kind: "sticker", id: b.dataset.sticker } : { kind: "letter", item: this.letters[Number(b.dataset.letter)] };
        if (this.pick.kind === "letter") ctx.say?.(this.pick.item);
        ctx.sfx?.("click");
      }));
      ctx.stage.querySelectorAll(".studio-ink").forEach((b) => b.addEventListener("click", () => {
        ctx.stage.querySelectorAll(".studio-ink").forEach((o) => o.classList.toggle("is-on", o === b));
        this.ink = b.dataset.ink;
        ctx.sfx?.("click");
      }));
      this.svg.addEventListener("click", (e) => this.place(e));
      this.undoBtn.addEventListener("click", () => this.undo());
      this.hangBtn.addEventListener("click", () => this.hang());
      ctx.prompt?.(null);
    }

    place(e) {
      if (!this.alive || !this.pick || this.stamps.length >= 24) return;
      const m = this.svg.getScreenCTM?.();
      if (!m) return;
      const p = this.svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
      const q = p.matrixTransform(m.inverse());
      const stamp = this.pick.kind === "letter"
        ? { kind: "letter", text: this.pick.item.display, x: q.x, y: q.y, ink: this.ink }
        : { kind: "sticker", id: this.pick.id, x: q.x, y: q.y };
      this.stamps.push(stamp);
      const g = document.createElementNS(SVGNS, "g");
      g.setAttribute("class", "studio-placed");
      g.setAttribute("transform", `translate(${q.x.toFixed(1)} ${q.y.toFixed(1)})`);
      g.innerHTML = stamp.kind === "letter"
        ? `<text text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-size="62" fill="${stamp.ink}" direction="rtl">${stamp.text}</text>`
        : `<g transform="translate(-40 -40) scale(${80 / 72}) translate(36 36)">${(ns.LettersArt.stickerMotif(stamp.id, 80).match(/<g[\s\S]*<\/g>/) || [""])[0]}</g>`;
      this.layer.appendChild(g);
      if (stamp.kind === "letter") this.ctx.say?.(this.pick.item); else this.ctx.sfx?.("pop");
      this.undoBtn.disabled = false;
      this.hangBtn.disabled = false;
    }

    undo() {
      if (!this.stamps.length) return;
      this.stamps.pop();
      this.layer.lastElementChild?.remove();
      this.ctx.sfx?.("rustle");
      this.undoBtn.disabled = this.hangBtn.disabled = !this.stamps.length;
    }

    // Paint the picture to a 160×160 thumbnail (the garden-sign format) and
    // hand it to the game to keep. Letters use the loaded Quran font; sticker
    // friends are drawn from their own SVG.
    async hang() {
      if (!this.alive || !this.stamps.length || this.hanging) return;
      this.hanging = true;
      this.hangBtn.disabled = true;
      let url = null;
      try {
        const c = document.createElement("canvas"); c.width = c.height = 160;
        const g = c.getContext("2d");
        const [sky, far, ground] = this.colors;
        const s = 160 / 400, oy = (160 - 300 * s) / 2;
        g.fillStyle = sky; g.fillRect(0, 0, 160, 160);
        g.save(); g.translate(0, oy); g.scale(s, s);
        g.fillStyle = far; g.fill(new Path2D("M0 170Q100 140 200 160Q300 180 400 150V300H0Z"));
        g.fillStyle = ground; g.fill(new Path2D("M0 210Q130 180 260 205Q340 220 400 200V300H0Z"));
        for (const st of this.stamps) {
          if (st.kind === "letter") {
            g.font = `62px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.direction = "rtl"; g.fillStyle = st.ink;
            g.fillText(st.text, st.x, st.y);
          } else {
            const svg = ns.LettersArt.stickerMotif(st.id, 80).replace("<svg ", `<svg xmlns="${SVGNS}" `);
            const img = new Image();
            await new Promise((ok) => { img.onload = ok; img.onerror = ok; img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`; });
            if (img.width) g.drawImage(img, st.x - 40, st.y - 40, 80, 80);
          }
        }
        g.restore();
        g.fillStyle = sky; g.fillRect(0, 0, 160, oy); g.fillStyle = ground; g.fillRect(0, 160 - oy, 160, oy);
        url = c.toDataURL("image/png");
      } catch { url = null; }
      if (!this.alive) return;
      if (url) this.ctx.saveDrawing?.(url);
      this.ctx.correct?.();
      this.ctx.confettiAt?.(this.svg);
      this.ctx.pet?.cheer?.();
      setTimeout(() => this.alive && this.ctx.done?.(), 900);
    }

    replayPrompt() {}
    destroy() { this.alive = false; }
  }

  LetterStudio.INKS = INKS;
  ns.GardenPractice = ns.GardenPractice || {};
  ns.GardenPractice.LetterStudio = LetterStudio;
})(window.MiftahGame || (window.MiftahGame = {}));
