// The Codex Letters tab — now just a big friendly door into the standalone
// Letter Garden game (letters.html), plus a read-only ladder of the child's
// progress. The old text-heavy quiz UI is retired; LetterEngine remains the
// shared progress backend that gates the Word Desk.
(function (ns) {
  class LettersPanel {
    constructor(overlay) {
      this.overlay = overlay;
      this.game = overlay.game;
      this.root = document.createElement("section");
      this.root.className = "trainer-study-panel letters-panel";
      this.root.hidden = true;
      this.root.setAttribute("aria-label", "Letter Garden");
      this.root.innerHTML = `
        <a class="letters-door" href="letters.html" aria-label="Play the Letter Garden game">
          <span class="letters-door-key" aria-hidden="true">🗝️</span>
          <span class="letters-door-text">Letter Garden<br /><small>the kids' game — no reading needed</small></span>
          <span class="letters-door-go" aria-hidden="true">▶</span>
        </a>
        <div class="letters-ladder" aria-label="Letter Garden progress"></div>
        <p class="letters-door-note"></p>
      `;
      this.ladderEl = this.root.querySelector(".letters-ladder");
      this.noteEl = this.root.querySelector(".letters-door-note");
    }

    get engine() {
      return this.overlay.letterEngine;
    }

    render() {
      const engine = this.engine;
      if (!engine || engine.loading) {
        this.noteEl.textContent = "";
        return;
      }
      this.ladderEl.innerHTML = "";
      for (const step of engine.ladder()) {
        const a = document.createElement("a");
        a.href = "letters.html";
        a.className = `letters-step is-${step.status}`;
        a.title = step.title;
        a.setAttribute("aria-label", `${step.title} — ${step.status}`);
        a.textContent = step.status === "done" ? "★" : step.icon;
        this.ladderEl.appendChild(a);
      }
      const track = engine.trackProgress();
      this.noteEl.textContent =
        track.done >= track.total
          ? "Every step complete — the Word Desk is open. The garden stays open for practice."
          : `${track.done}/${track.total} steps done — finishing the garden opens the Word Desk.`;
    }
  }

  ns.LettersPanel = LettersPanel;
})(window.MiftahGame || (window.MiftahGame = {}));
