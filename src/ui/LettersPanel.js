// The Letter Garden panel — renders LetterEngine view models inside the
// Courtyard Codex. Pure presentation: the curriculum lives in the engine,
// this class draws learn cards, quizzes and the unit ladder, and forwards
// answers. Letter sounds use the browser's Arabic voice when one exists;
// real recitation clips (example words, the decode unit) go through the
// shared RecitationAudio channel.
(function (ns) {
  class LettersPanel {
    constructor(overlay) {
      this.overlay = overlay;
      this.game = overlay.game;
      this.isChoosing = false;
      this.root = document.createElement("section");
      this.root.className = "trainer-study-panel letters-panel";
      this.root.hidden = true;
      this.root.setAttribute("aria-label", "Letter Garden");
      this.root.innerHTML = `
        <div class="letters-ladder" aria-label="Letter Garden path"></div>
        <p class="letters-unit-title"></p>
        <div class="codex-playzone letters-zone">
          <div class="trainer-word-card letters-card">
            <div class="trainer-arabic letters-big" dir="rtl" lang="ar"></div>
            <div class="trainer-translit letters-sub"></div>
          </div>
          <p class="trainer-prompt letters-prompt"></p>
          <span class="trainer-meter letters-meter"></span>
          <div class="letters-example" hidden></div>
          <div class="trainer-options letters-options"></div>
          <p class="trainer-message letters-message" aria-live="polite"></p>
          <div class="letters-nav" hidden></div>
        </div>
        <div class="trainer-reveal-panel letters-reveal" hidden></div>
      `;
      this.ladderEl = this.root.querySelector(".letters-ladder");
      this.unitTitleEl = this.root.querySelector(".letters-unit-title");
      this.zoneEl = this.root.querySelector(".letters-zone");
      this.cardEl = this.root.querySelector(".letters-card");
      this.bigEl = this.root.querySelector(".letters-big");
      this.subEl = this.root.querySelector(".letters-sub");
      this.promptEl = this.root.querySelector(".letters-prompt");
      this.meterEl = this.root.querySelector(".letters-meter");
      this.exampleEl = this.root.querySelector(".letters-example");
      this.optionsEl = this.root.querySelector(".letters-options");
      this.messageEl = this.root.querySelector(".letters-message");
      this.navEl = this.root.querySelector(".letters-nav");
      this.revealEl = this.root.querySelector(".letters-reveal");

      this.currentSpeak = "";
      this.currentAudioPath = "";
      this.cardEl.addEventListener("click", () => this.hearCurrent());
      this.cardEl.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          this.hearCurrent();
        }
      });
    }

    get engine() {
      return this.overlay.letterEngine;
    }

    // ---------- audio ----------

    hearCurrent() {
      if (this.currentAudioPath) {
        this.overlay.recite.playWord(this.currentAudioPath);
        return;
      }
      if (this.currentSpeak) this.speak(this.currentSpeak);
    }

    // Speech synthesis with an Arabic voice when the device has one; harmless
    // no-op otherwise. Letter names and syllables have no Quran clips, so the
    // browser voice is the honest fallback.
    speak(text) {
      if (!this.game.sound.enabled || !("speechSynthesis" in window)) return;
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "ar-SA";
        u.rate = 0.72;
        const voice = speechSynthesis.getVoices().find((v) => (v.lang || "").startsWith("ar"));
        if (voice) u.voice = voice;
        speechSynthesis.speak(u);
      } catch {}
    }

    // ---------- render ----------

    render() {
      const engine = this.engine;
      if (!engine) return;
      const view = engine.getView();
      this.view = view;

      this.optionsEl.innerHTML = "";
      this.navEl.innerHTML = "";
      this.navEl.hidden = true;
      this.exampleEl.hidden = true;
      this.exampleEl.innerHTML = "";
      this.revealEl.hidden = true;
      this.zoneEl.hidden = false;
      this.meterEl.textContent = "";
      this.currentSpeak = "";
      this.currentAudioPath = "";
      this.setHearable(false);

      this.renderLadder(view.ladder || []);

      if (view.mode === "loading") {
        this.unitTitleEl.textContent = "";
        this.setCard("", "", "");
        this.messageEl.textContent = "Opening the Letter Garden…";
        return;
      }

      if (view.mode === "trackDone") {
        this.renderTrackDone();
        return;
      }

      this.unitTitleEl.textContent = view.unitTitle ? `${view.unitTitle} — ${view.unitBlurb || ""}` : "";

      if (view.mode === "unitDone") {
        this.renderUnitDone(view.unitDone);
        return;
      }
      if (view.mode === "quiz") {
        this.renderQuiz(view);
        return;
      }
      this.renderLearn(view);
    }

    renderLadder(ladder) {
      this.ladderEl.innerHTML = "";
      for (const step of ladder) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = `letters-step is-${step.status}` + (step.active ? " is-active" : "");
        b.title = step.title;
        b.setAttribute("aria-label", `${step.title} — ${step.status}`);
        b.textContent = step.status === "done" ? "★" : step.icon;
        b.disabled = step.status === "locked";
        b.addEventListener("click", () => {
          if (this.engine.selectUnit(step.id)) {
            this.game.sound.play("page");
            this.render();
          }
        });
        this.ladderEl.appendChild(b);
      }
    }

    setCard(big, sub, prompt, { arabic = true, latin = false } = {}) {
      this.bigEl.textContent = big;
      this.bigEl.classList.toggle("is-latin", latin);
      this.bigEl.dir = arabic && !latin ? "rtl" : "ltr";
      this.subEl.textContent = sub;
      this.promptEl.textContent = prompt;
      this.cardEl.hidden = !big;
    }

    setHearable(enabled) {
      this.cardEl.classList.toggle("is-hearable", enabled);
      if (enabled) {
        this.cardEl.setAttribute("role", "button");
        this.cardEl.setAttribute("tabindex", "0");
        this.cardEl.setAttribute("aria-label", "Hear it");
      } else {
        this.cardEl.removeAttribute("role");
        this.cardEl.removeAttribute("tabindex");
        this.cardEl.removeAttribute("aria-label");
      }
    }

    renderLearn(view) {
      const card = view.card;
      const latin = card.kind === "note" ? false : false;
      this.setCard(card.big, card.title, card.sub, { latin });
      this.messageEl.textContent = view.message || "";
      this.meterEl.textContent = `Card ${view.cardIndex + 1}/${view.cardTotal}`;

      this.currentSpeak = card.speak || "";
      if (this.currentSpeak) this.setHearable(true);

      // Example word chip: a real Quran word carrying this letter, with the
      // reciter's clip — the letter is real from day one.
      if (card.example) {
        this.exampleEl.hidden = false;
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "letters-example-chip";
        chip.innerHTML = `<b dir="rtl" lang="ar">${card.example.arabic}</b><span>${card.example.english} · 🔊</span>`;
        chip.title = "Hear this word in the Quran";
        chip.addEventListener("click", () => this.overlay.recite.playWord(card.example.audioPath));
        const label = document.createElement("span");
        label.className = "letters-example-label";
        label.textContent = `Spot ${card.title} in a real Quran word:`;
        this.exampleEl.append(label, chip);
      }

      this.navEl.hidden = false;
      if (view.cardIndex > 0) {
        const back = document.createElement("button");
        back.type = "button";
        back.className = "trainer-option letters-nav-btn";
        back.textContent = "‹ Back";
        back.addEventListener("click", () => {
          this.engine.prevCard();
          this.game.sound.play("page");
          this.render();
        });
        this.navEl.appendChild(back);
      }
      const next = document.createElement("button");
      next.type = "button";
      next.className = "trainer-option letters-nav-btn is-primary";
      next.textContent = view.isLast ? "Start the quiz ➜" : "Next ›";
      next.addEventListener("click", () => {
        this.engine.nextCard();
        this.game.sound.play(view.isLast ? "click" : "page");
        this.render();
      });
      this.navEl.appendChild(next);

      // Hearing it without asking teaches the sound alongside the shape.
      if (this.currentSpeak && card.kind === "letter") this.speak(this.currentSpeak);
    }

    renderQuiz(view) {
      this.setCard(view.big, "", view.prompt, { latin: !view.bigIsArabic });
      this.messageEl.textContent = view.message || "";
      this.meterEl.textContent = view.meter || "";

      if (view.listen && view.audioPath) {
        this.currentAudioPath = view.audioPath;
        this.setHearable(true);
        this.subEl.textContent = "tap to hear it again";
        const key = view.audioPath + ":" + (view.meter || "");
        if (this.listenPlayedFor !== key) {
          this.listenPlayedFor = key;
          this.overlay.recite.playWord(view.audioPath);
        }
      } else if (view.speak && !view.bigIsArabic) {
        // "Find the letter X" — hearing the name is part of the question.
        this.currentSpeak = view.speak;
        this.setHearable(true);
      }

      for (const option of view.options) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "trainer-option letters-option";
        button.textContent = option;
        if (view.optionsAreArabic) {
          button.classList.add("is-arabic-option", "letters-arabic-option");
          button.dir = "rtl";
          button.lang = "ar";
        }
        button.addEventListener("click", () => this.choose(option, button, view));
        this.optionsEl.appendChild(button);
      }
    }

    choose(option, button, view) {
      if (this.isChoosing) return;
      this.isChoosing = true;
      for (const b of this.optionsEl.querySelectorAll("button")) b.disabled = true;
      let result;
      try {
        result = this.engine.choose(option, this.game);
      } catch (err) {
        this.isChoosing = false;
        for (const b of this.optionsEl.querySelectorAll("button")) b.disabled = false;
        console.error(err);
        return;
      }
      this.isChoosing = false;

      button.classList.add(result.correct ? "is-correct" : "is-wrong");
      if (result.correct) {
        button.classList.add("is-pop");
        this.game.sound.play("correct");
        // Speak/play what was just read — the sound seals the shape.
        if (view.reward && view.reward.audioPath) this.overlay.recite.playWord(view.reward.audioPath);
        else if (view.speak) this.speak(view.speak);
      } else {
        this.game.sound.play("wrong");
      }
      this.messageEl.textContent = this.engine.message || "";
      setTimeout(() => {
        if (!this.overlay.isOpen) return;
        this.overlay.renderRewardStrip();
        this.render();
      }, result.correct ? (result.unitComplete ? 500 : 350) : 900);
    }

    renderUnitDone(done) {
      this.zoneEl.hidden = true;
      this.revealEl.hidden = false;
      this.revealEl.innerHTML = "";

      const badge = document.createElement("p");
      badge.className = "trainer-reveal-badge" + (done.perfect ? " is-perfect" : "");
      badge.textContent = done.perfect ? "★ Perfect — not a single slip!" : `${done.title} complete ✓`;
      const line = document.createElement("p");
      line.className = "trainer-reveal-literal";
      line.textContent = done.trackComplete
        ? "You know your letters, your sounds — and you just read real Quran words. Mashallah!"
        : done.newlyDone
          ? `${done.title} is yours. Next up: ${done.nextTitle}.`
          : `Nice review — ${done.title} stays fresh.`;
      this.revealEl.append(badge, line);

      if (done.summary) {
        const summary = document.createElement("p");
        summary.className = "trainer-reveal-summary";
        summary.textContent = done.summary;
        this.revealEl.appendChild(summary);
      }
      if (done.trackComplete) {
        const open = document.createElement("p");
        open.className = "trainer-reveal-summary";
        open.textContent = "🎉 The Word Desk is now open — real ayahs, word by word, starting with Al-Fatihah.";
        this.revealEl.appendChild(open);
      }

      const cont = document.createElement("button");
      cont.type = "button";
      cont.className = "trainer-option trainer-continue";
      cont.textContent = done.trackComplete ? "Open the Word Desk →" : "Continue →";
      cont.addEventListener("click", () => {
        this.game.sound.play("click");
        // An egg or hatch earned by this unit plays its island cutaway first.
        this.overlay.playPendingCutaway(() => {
          this.engine.continueFromUnitDone();
          if (this.engine.isComplete()) {
            this.overlay.setTabQuiet("study");
          }
          this.overlay.render();
        });
      });
      this.revealEl.appendChild(cont);

      this.overlay.celebrate(done.perfect || done.trackComplete);
      this.game.sound.play(done.trackComplete ? "record" : done.perfect ? "perfect" : "ayahComplete");
      this.overlay.renderRewardStrip();
    }

    renderTrackDone() {
      this.unitTitleEl.textContent = "";
      this.zoneEl.hidden = true;
      this.revealEl.hidden = false;
      this.revealEl.innerHTML = "";
      const badge = document.createElement("p");
      badge.className = "trainer-reveal-badge is-perfect";
      badge.textContent = "🔤 Letter Garden complete";
      const line = document.createElement("p");
      line.className = "trainer-reveal-literal";
      line.textContent = "Every letter, every sound, real words read. Tap any star above to practice again — the Word Desk is waiting.";
      const go = document.createElement("button");
      go.type = "button";
      go.className = "trainer-option trainer-continue";
      go.textContent = "Go to the Word Desk →";
      go.addEventListener("click", () => {
        this.overlay.setTabQuiet("study");
        this.overlay.render();
      });
      this.revealEl.append(badge, line, go);
    }
  }

  ns.LettersPanel = LettersPanel;
})(window.MiftahGame || (window.MiftahGame = {}));
