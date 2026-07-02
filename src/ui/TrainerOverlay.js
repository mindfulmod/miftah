// Courtyard Codex — the production trainer UI, rendered as a DOM overlay on
// top of the game. All learning logic lives in TrainerEngine (a port of the
// standalone app.js) on the shared quran-trainer:* storage; this class only
// renders view models and forwards choices.
(function (ns) {
  class TrainerOverlay {
    constructor(game) {
      this.game = game;
      this.isOpen = false;
      this.current = null;
      this.message = "";
      this.pendingAction = null; // { type: "switch"|"reset", number, name } awaiting confirm
      this.collectionCollapsed = loadCollectionPreference();
      this.root = document.createElement("section");
      this.root.className = "trainer-overlay";
      this.root.hidden = true;
      this.root.innerHTML = `
        <div class="trainer-card trainer-codex" role="dialog" aria-modal="true" aria-labelledby="trainer-title">
          <button class="trainer-close" type="button" aria-label="Close trainer">×</button>

          <header class="codex-header">
            <div class="codex-title-ribbon">
              <h2 id="trainer-title">Courtyard Codex</h2>
            </div>
          </header>
          <div class="codex-meta">
            <span class="trainer-kicker">Reading Archway</span>
            <p class="trainer-progress"></p>
            <p class="trainer-session"></p>
          </div>

          <div class="codex-board">
            <aside id="surah-collection" class="surah-collection" aria-label="Surah collection">
              <div class="surah-collection-head">
                <h3>Surah Collection</h3>
                <button class="surah-toggle" type="button" aria-controls="surah-collection"></button>
              </div>
              <div class="surah-grid"></div>
              <div class="surah-action-panel" hidden></div>
              <p class="surah-collection-stats"></p>
            </aside>

            <section class="trainer-study-panel" aria-label="Study question">
              <div class="trainer-full-ayah" dir="rtl"></div>
              <div class="trainer-word-card">
                <div class="trainer-arabic" dir="rtl"></div>
                <div class="trainer-translit"></div>
              </div>
              <div class="trainer-test-meta">
                <p class="trainer-prompt"></p>
                <span class="trainer-meter"></span>
                <button class="trainer-meaning-toggle" type="button" hidden>؟ meaning</button>
              </div>
              <p class="trainer-meaning" hidden></p>
              <div class="trainer-options"></div>
              <div class="trainer-reveal-panel" hidden></div>
              <p class="trainer-message" aria-live="polite"></p>
              <div class="trainer-review-bar" hidden>
                <span class="trainer-review-tally"></span>
                <button class="trainer-review-exit" type="button">Leave review</button>
              </div>
            </section>
          </div>

          <p class="trainer-reward-note" aria-live="polite"></p>
          <footer class="codex-bottom" aria-label="Rewards">
            <div class="reward-icon">
              <img src="assets/generated/crops/seed_packet_icon.png" alt="" />
              <span class="metric-seeds"></span>
            </div>
            <div class="reward-icon">
              <img src="assets/generated/ui/ui_crop_icon.png" alt="" />
              <span class="metric-feed"></span>
            </div>
            <div class="reward-icon">
              <img src="assets/generated/props/prop_hatching_egg.png" alt="" />
              <span class="metric-egg"></span>
            </div>
          </footer>
        </div>
      `;
      document.body.appendChild(this.root);

      this.card = this.root.querySelector(".trainer-card");
      this.closeButton = this.root.querySelector(".trainer-close");
      this.surahToggleButton = this.root.querySelector(".surah-toggle");
      this.progressEl = this.root.querySelector(".trainer-progress");
      this.sessionEl = this.root.querySelector(".trainer-session");
      this.metricSeedsEl = this.root.querySelector(".metric-seeds");
      this.metricFeedEl = this.root.querySelector(".metric-feed");
      this.metricEggEl = this.root.querySelector(".metric-egg");
      this.collectionStatsEl = this.root.querySelector(".surah-collection-stats");
      this.surahGridEl = this.root.querySelector(".surah-grid");
      this.actionPanelEl = this.root.querySelector(".surah-action-panel");
      this.fullAyahEl = this.root.querySelector(".trainer-full-ayah");
      this.wordCardEl = this.root.querySelector(".trainer-word-card");
      this.arabicEl = this.root.querySelector(".trainer-arabic");
      this.translitEl = this.root.querySelector(".trainer-translit");
      this.promptEl = this.root.querySelector(".trainer-prompt");
      this.meterEl = this.root.querySelector(".trainer-meter");
      this.meaningToggleEl = this.root.querySelector(".trainer-meaning-toggle");
      this.meaningEl = this.root.querySelector(".trainer-meaning");
      this.optionsEl = this.root.querySelector(".trainer-options");
      this.revealPanelEl = this.root.querySelector(".trainer-reveal-panel");
      this.messageEl = this.root.querySelector(".trainer-message");
      this.reviewBarEl = this.root.querySelector(".trainer-review-bar");
      this.reviewTallyEl = this.root.querySelector(".trainer-review-tally");
      this.reviewExitEl = this.root.querySelector(".trainer-review-exit");
      this.rewardNoteEl = this.root.querySelector(".trainer-reward-note");

      this.closeButton.addEventListener("click", () => this.close());
      this.surahToggleButton.addEventListener("click", () => this.toggleCollection());
      this.meaningToggleEl.addEventListener("click", () => {
        this.engine.showMeaning();
        this.render();
      });
      this.reviewExitEl.addEventListener("click", async () => {
        await this.engine.stopReviewMode();
        this.render();
      });
      this.root.addEventListener("click", (event) => {
        if (event.target === this.root) this.close();
      });
      window.addEventListener("keydown", (event) => {
        if (this.isOpen && event.code === "Escape") this.close();
      });
      this.syncCollectionToggle();
    }

    open() {
      this.isOpen = true;
      this.root.hidden = false;
      this.message = "";
      if (!this.engine) {
        this.engine = new ns.TrainerEngine((game) => {
          const events = game.progress.completeStudyStep();
          game.farming.advanceCropsByStudy();
          return game.handleProgressEvents(events);
        });
        this.engine.ready.then(() => {
          if (this.isOpen) this.render();
        });
      }
      this.render();
    }

    close() {
      this.isOpen = false;
      this.root.hidden = true;
    }

    // ---------- main render ----------

    render() {
      this.renderRewardStrip();
      if (!this.engine) return;
      this.current = this.engine.getView();
      this.renderSurahCollection();

      const view = this.current;
      this.progressEl.textContent = view.progressText || "";
      this.sessionEl.textContent = view.session
        ? `Today ${Math.min(view.session.count, view.session.goal)}/${view.session.goal} ayahs` +
          (view.session.streak > 0 ? ` · 🔥 ${view.session.streak}-day streak` : "") +
          (view.session.rescued > 0 ? ` · 💪 ${view.session.rescued} rescued` : "")
        : "";

      // Reset transient sections; each mode fills what it needs.
      this.optionsEl.innerHTML = "";
      this.revealPanelEl.hidden = true;
      this.reviewBarEl.hidden = true;
      this.meaningToggleEl.hidden = true;
      this.meaningEl.hidden = true;
      this.wordCardEl.hidden = false;
      this.fullAyahEl.innerHTML = "";
      this.meterEl.textContent = "";

      if (view.mode === "loading") {
        this.setStudyText("", "", "");
        this.messageEl.textContent = "Opening the Study Desk…";
        return;
      }
      if (view.mode === "error") {
        this.setStudyText("", "", "");
        this.messageEl.textContent = view.message || "Could not load the trainer data.";
        return;
      }
      if (view.mode === "locked") {
        this.setStudyText("", "", "");
        this.messageEl.textContent = "You've reached the edge of the available surahs. More are on the way.";
        return;
      }
      if (view.mode === "reviewEmpty") {
        this.setStudyText("", "", "");
        this.reviewBarEl.hidden = false;
        this.reviewTallyEl.textContent = "";
        this.messageEl.textContent = view.message || "Nothing to review here yet.";
        return;
      }
      if (view.mode === "reveal") {
        this.renderReveal(view);
        return;
      }

      // word / interleaved review / endless review-mode share the test layout
      this.setStudyText(view.arabic, view.translit || "", view.prompt || "");
      this.messageEl.textContent = this.message || view.message || "";

      if (view.mode === "word") {
        this.renderAyahLine(view);
        this.meterEl.textContent = `Slips ${view.mistakes}/${view.budget} · Word ${Math.min(view.solved + 1, view.total)}/${view.total}`;
        this.meaningToggleEl.hidden = false;
        if (view.meaningShown && view.translation) {
          this.meaningEl.hidden = false;
          this.meaningEl.textContent = `“${view.translation}” — shown early, so this ayah won't count as Perfect.`;
        }
      } else if (view.mode === "reviewMode") {
        this.reviewBarEl.hidden = false;
        this.reviewTallyEl.textContent = `Endless review · ${view.tally.right}/${view.tally.asked} recalled`;
      }

      for (const option of view.options) {
        const button = document.createElement("button");
        button.className = "trainer-option";
        button.type = "button";
        button.textContent = option;
        button.addEventListener("click", () => this.choose(option, button));
        this.optionsEl.appendChild(button);
      }
    }

    setStudyText(arabic, translit, prompt) {
      this.arabicEl.textContent = arabic;
      this.translitEl.textContent = translit;
      this.promptEl.textContent = prompt;
      this.wordCardEl.hidden = !arabic;
    }

    renderAyahLine(view) {
      this.fullAyahEl.innerHTML = "";
      (view.ayahWords || []).forEach((word, index) => {
        const span = document.createElement("span");
        span.textContent = word;
        if (index === view.activeWordIndex) span.className = "is-active-word";
        this.fullAyahEl.appendChild(span);
      });
    }

    // Post-ayah reveal: full Arabic, literal word-by-word line, and the
    // Saheeh International translation — the meaning arrives as the reward
    // for completing the test, exactly like the standalone trainer.
    renderReveal(view) {
      this.wordCardEl.hidden = true;
      this.promptEl.textContent = "";
      this.messageEl.textContent = "";
      this.revealPanelEl.hidden = false;
      this.revealPanelEl.innerHTML = "";

      const badge = document.createElement("p");
      badge.className = "trainer-reveal-badge" + (view.perfect ? " is-perfect" : "");
      badge.textContent = view.perfect ? "★ Perfect — no slips" : "Ayah complete ✓";

      const arabic = document.createElement("div");
      arabic.className = "trainer-reveal-arabic";
      arabic.dir = "rtl";
      arabic.textContent = view.arabicLine;

      const literal = document.createElement("p");
      literal.className = "trainer-reveal-literal";
      literal.textContent = view.literal;

      const translation = document.createElement("p");
      translation.className = "trainer-reveal-translation";
      translation.textContent = view.translation ? `Saheeh International: ${view.translation}` : "";

      this.revealPanelEl.append(badge, arabic, literal, translation);

      if (view.summary) {
        const summary = document.createElement("p");
        summary.className = "trainer-reveal-summary";
        summary.textContent = view.summary;
        this.revealPanelEl.appendChild(summary);
      }
      if (view.justHitGoal) {
        const goal = document.createElement("p");
        goal.className = "trainer-reveal-summary";
        goal.textContent = `🔥 Daily goal met — ${view.session.goal} ayahs today. Resting beats rushing, but the desk stays open.`;
        this.revealPanelEl.appendChild(goal);
      }
      if (view.surahComplete) {
        const done = document.createElement("p");
        done.className = "trainer-reveal-summary";
        done.textContent = view.nextNumber
          ? `🎉 ${view.surahName} is complete — ${view.nextName} is now revealed.`
          : `🎉 ${view.surahName} is complete — every available surah is finished.`;
        this.revealPanelEl.appendChild(done);
      }

      const cont = document.createElement("button");
      cont.type = "button";
      cont.className = "trainer-option trainer-continue";
      cont.textContent = view.surahComplete
        ? (view.nextNumber ? `Begin ${view.nextName} →` : "Continue →")
        : "Continue →";
      cont.addEventListener("click", async () => {
        await this.engine.continueFromReveal(this.game);
        this.message = "";
        this.render();
      });
      this.revealPanelEl.appendChild(cont);
    }

    // ---------- surah collection ----------

    renderSurahCollection() {
      if (!this.engine || this.engine.loading) return;
      const entries = this.engine.collectionEntries();
      if (!entries.length) return;

      const completed = entries.filter((e) => e.status === "complete").length;
      this.collectionStatsEl.textContent = `${completed} complete · ${entries.length} in the codex`;

      this.surahGridEl.innerHTML = "";
      for (const item of entries) {
        const { entry, status, passed } = item;
        const button = document.createElement("button");
        button.type = "button";
        button.className = `surah-tile is-${status === "locked" ? "upcoming" : status === "complete" ? "complete" : "current"}`;
        if (status === "active") button.classList.add("is-selected");
        button.setAttribute("aria-label", `${entry.number}. ${entry.englishName}`);

        const ring = document.createElement("span");
        ring.className = "surah-badge-ring";
        ring.style.setProperty("--pct", String(Math.round((passed / entry.ayahCount) * 100)));
        const badge = document.createElement("span");
        badge.className = "surah-badge";
        badge.textContent = status === "locked" ? "🔒" : String(entry.number);
        ring.appendChild(badge);
        const label = document.createElement("span");
        label.className = "surah-name";
        label.textContent = entry.englishName;
        const frac = document.createElement("span");
        frac.className = "surah-frac";
        frac.textContent =
          status === "locked" ? "locked" : status === "complete" ? "complete ✓" : `${passed}/${entry.ayahCount}`;
        button.append(ring, label, frac);
        button.addEventListener("click", () => this.onSurahTileClick(item));
        this.surahGridEl.appendChild(button);
      }

      this.renderActionPanel();
    }

    onSurahTileClick(item) {
      const { entry, status, unlockAfter } = item;
      if (status === "locked") {
        const prevName = unlockAfter ? unlockAfter.englishName : "the previous surah";
        this.pendingAction = { type: "notice", text: `Finish ${prevName} to reveal ${entry.englishName}.` };
      } else if (status === "complete") {
        this.pendingAction = { type: "completedMenu", number: entry.number, name: entry.englishName };
      } else if (status === "active") {
        this.pendingAction = null; // already studying it
      } else {
        this.pendingAction = {
          type: "switch",
          number: entry.number,
          name: entry.englishName,
          text: `Switch to ${entry.englishName}? Leaving mid-ayah restarts the words you've solved in the current ayah — completed ayahs stay saved.`,
        };
      }
      this.renderActionPanel();
    }

    renderActionPanel() {
      const panel = this.actionPanelEl;
      panel.innerHTML = "";
      const action = this.pendingAction;
      panel.hidden = !action;
      if (!action) return;

      const text = document.createElement("p");
      text.className = "surah-action-text";
      panel.appendChild(text);

      const buttons = document.createElement("div");
      buttons.className = "surah-action-buttons";
      panel.appendChild(buttons);

      const btn = (label, onClick, primary = false) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "surah-action-btn" + (primary ? " is-primary" : "");
        b.textContent = label;
        b.addEventListener("click", onClick);
        buttons.appendChild(b);
      };
      const dismiss = () => {
        this.pendingAction = null;
        this.renderActionPanel();
      };

      if (action.type === "notice") {
        text.textContent = action.text;
        btn("OK", dismiss, true);
        return;
      }

      if (action.type === "switch") {
        text.textContent = action.text;
        btn("Switch", async () => {
          this.pendingAction = null;
          await this.engine.switchSurah(action.number);
          this.message = "";
          this.render();
        }, true);
        btn("Stay", dismiss);
        return;
      }

      if (action.type === "completedMenu") {
        text.textContent = `${action.name} is complete. Review keeps it fresh; restarting clears its ayah progress (word history stays).`;
        btn("Review it", async () => {
          this.pendingAction = null;
          await this.engine.switchSurah(action.number); // lands in endless review
          this.message = "";
          this.render();
        }, true);
        btn("Restart from ayah 1", () => {
          this.pendingAction = {
            type: "resetConfirm",
            number: action.number,
            name: action.name,
          };
          this.renderActionPanel();
        });
        btn("Cancel", dismiss);
        return;
      }

      if (action.type === "resetConfirm") {
        text.textContent = `Really restart ${action.name} from ayah 1? Its passed-ayah progress resets; your word stats and review schedule are kept.`;
        btn("Restart", async () => {
          this.pendingAction = null;
          await this.engine.resetSurah(action.number);
          this.message = "";
          this.render();
        }, true);
        btn("Cancel", dismiss);
      }
    }

    // ---------- reward strip ----------

    renderRewardStrip() {
      const state = this.game.progress.state;
      this.metricSeedsEl.textContent = String(state.seeds);
      this.metricFeedEl.textContent = String(state.feed);
      const egg = state.activeEgg;
      this.metricEggEl.textContent = egg ? `${egg.progress}/${egg.goal}` : "—";
      this.rewardNoteEl.textContent = this.rewardHint(state);
    }

    rewardHint(state) {
      const egg = state.activeEgg;
      if (egg) {
        const animal = this.game.progress.catalogById?.get(egg.animalId);
        const left = Math.max(0, egg.goal - egg.progress);
        return left === 0
          ? "The egg is ready to hatch!"
          : `Egg hatching in ${left} more ayah${left === 1 ? "" : "s"}${animal ? ` — something stirs for the ${animal.habitat.toLowerCase()}` : ""}.`;
      }
      const untilEgg = Math.max(0, (state.nextEggAt || 0) - state.ayahsCompleted);
      if (this.game.progress.lockedAnimals().length === 0) return "Every animal has hatched — the island is full of life.";
      return untilEgg > 0
        ? `Next egg after ${untilEgg} more ayah${untilEgg === 1 ? "" : "s"}. Each ayah also earns 2 seeds.`
        : "A new egg is due — complete an ayah to receive it.";
    }

    toggleCollection() {
      this.collectionCollapsed = !this.collectionCollapsed;
      try {
        localStorage.setItem("miftah-oasis:trainer-collection", this.collectionCollapsed ? "collapsed" : "open");
      } catch {}
      this.syncCollectionToggle();
    }

    syncCollectionToggle() {
      this.card.classList.toggle("is-collection-collapsed", this.collectionCollapsed);
      this.surahToggleButton.textContent = this.collectionCollapsed ? "Show Collection" : "Hide Collection";
      this.surahToggleButton.setAttribute("aria-expanded", String(!this.collectionCollapsed));
    }

    // ---------- answering ----------

    choose(option, button) {
      if (this.isChoosing) return;
      this.isChoosing = true;
      for (const b of this.optionsEl.querySelectorAll("button")) b.disabled = true;
      let result;
      try {
        result = this.engine.choose(option, this.game);
      } catch (err) {
        this.isChoosing = false;
        this.message = "The Study Desk stumbled while checking that answer. Try again.";
        this.messageEl.textContent = this.message;
        for (const b of this.optionsEl.querySelectorAll("button")) b.disabled = false;
        console.error(err);
        return;
      }
      this.isChoosing = false;

      if (!result.correct && !result.advanced && !result.reset) {
        button.classList.add("is-wrong");
        this.message = this.engine.message || "Not quite. Try that one again gently.";
        this.messageEl.textContent = this.message;
        for (const b of this.optionsEl.querySelectorAll("button")) b.disabled = false;
        return;
      }

      button.classList.add(result.correct ? "is-correct" : "is-wrong");
      this.message = this.engine.message;
      // Brief beat so the button state lands before the next card.
      setTimeout(() => {
        if (this.isOpen) this.render();
      }, result.correct ? 260 : 700);
    }
  }

  function loadCollectionPreference() {
    try {
      return localStorage.getItem("miftah-oasis:trainer-collection") === "collapsed";
    } catch {
      return false;
    }
  }

  ns.TrainerOverlay = TrainerOverlay;
})(window.MiftahGame || (window.MiftahGame = {}));
