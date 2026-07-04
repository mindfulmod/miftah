// Courtyard Codex — the production trainer UI, rendered as a DOM overlay on
// top of the game. All learning logic lives in TrainerEngine (a port of the
// standalone app.js) on the shared quran-trainer:* storage; this class only
// renders view models and forwards choices.
//
// Two tabs: Study (the test desk — reading zone + compact play zone) and
// Read (a browsable mushaf of every completed ayah with word popovers).
(function (ns) {
  const FONT_SCALE_KEY = "miftah-oasis:codex-font-scale";
  const FONT_SCALE_MIN = 0.85;
  const FONT_SCALE_MAX = 1.35;
  const FONT_SCALE_STEP = 0.1;

  class TrainerOverlay {
    constructor(game) {
      this.game = game;
      this.isOpen = false;
      this.current = null;
      this.message = "";
      this.activeTab = "study";
      this.pendingAction = null; // collection action awaiting confirm
      this.collectionCollapsed = loadCollectionPreference();
      this.fontScale = loadFontScalePreference();
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

          <nav class="codex-tabs" role="tablist" aria-label="Codex sections">
            <button class="codex-tab is-active" type="button" role="tab" data-tab="study" aria-selected="true">✒ Study</button>
            <button class="codex-tab" type="button" role="tab" data-tab="read" aria-selected="false">📜 Read</button>
            <button class="codex-tab codex-collection-tab" type="button" role="tab" data-tab="collection" aria-selected="false">Collection</button>
            <div class="codex-font-menu">
              <button class="codex-font-toggle" type="button" aria-label="Adjust Codex text size" aria-expanded="false" title="Adjust text size">A</button>
              <div class="codex-font-panel" hidden>
                <button class="codex-font-step" type="button" data-font-step="-1" aria-label="Smaller Codex text" title="Smaller text">A-</button>
                <button class="codex-font-reset" type="button" aria-label="Reset Codex text size" title="Reset text size">A</button>
                <button class="codex-font-step" type="button" data-font-step="1" aria-label="Larger Codex text" title="Larger text">A+</button>
              </div>
            </div>
            <a class="codex-web-link" href="trainer.html" title="Open the web trainer — same progress, no island" aria-label="Open the web trainer">🌐</a>
            <button class="codex-sound" type="button" aria-label="Toggle sound"></button>
          </nav>

          <div class="codex-board">
            <aside id="surah-collection" class="surah-collection" aria-label="Surah collection">
              <div class="surah-collection-head">
                <h3>Surah Collection</h3>
                <button class="surah-toggle" type="button" aria-controls="surah-collection"></button>
              </div>
              <div class="surah-grid"></div>
              <div class="surah-action-panel" hidden></div>
              <div class="badge-shelf" aria-label="Juz badges">
                <h3>Juz Badges</h3>
                <div class="badge-grid"></div>
              </div>
              <p class="surah-collection-stats"></p>
            </aside>

            <section class="trainer-study-panel" aria-label="Study question">
              <div class="trainer-ayah-ref" aria-live="polite"></div>
              <div class="trainer-ayah-wrap">
                <div class="trainer-full-ayah" dir="rtl"></div>
                <span class="trainer-ayah-scroll-cue" aria-hidden="true">↕</span>
              </div>
              <div class="codex-playzone">
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
                <p class="trainer-message" aria-live="polite"></p>
                <div class="trainer-review-bar" hidden>
                  <span class="trainer-review-tally"></span>
                  <button class="trainer-review-exit" type="button">Leave review</button>
                </div>
              </div>
              <div class="trainer-reveal-panel" hidden></div>
            </section>

            <section class="trainer-reader-panel" aria-label="Completed ayahs" hidden>
              <div class="reader-head"></div>
              <div class="reader-scroll"></div>
            </section>
          </div>

          <p class="trainer-reward-note" aria-live="polite"></p>
          <button class="mobile-juz-summary" type="button"></button>
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
      this.collectionEl = this.root.querySelector(".surah-collection");
      this.surahToggleButton = this.root.querySelector(".surah-toggle");
      this.progressEl = this.root.querySelector(".trainer-progress");
      this.sessionEl = this.root.querySelector(".trainer-session");
      this.tabButtons = [...this.root.querySelectorAll(".codex-tab")];
      this.fontMenuEl = this.root.querySelector(".codex-font-menu");
      this.fontToggleButton = this.root.querySelector(".codex-font-toggle");
      this.fontPanelEl = this.root.querySelector(".codex-font-panel");
      this.fontStepButtons = [...this.root.querySelectorAll(".codex-font-step")];
      this.fontResetButton = this.root.querySelector(".codex-font-reset");
      this.soundButton = this.root.querySelector(".codex-sound");
      this.metricSeedsEl = this.root.querySelector(".metric-seeds");
      this.metricFeedEl = this.root.querySelector(".metric-feed");
      this.metricEggEl = this.root.querySelector(".metric-egg");
      this.collectionStatsEl = this.root.querySelector(".surah-collection-stats");
      this.surahGridEl = this.root.querySelector(".surah-grid");
      this.badgeShelfEl = this.root.querySelector(".badge-shelf");
      this.badgeGridEl = this.root.querySelector(".badge-grid");
      this.actionPanelEl = this.root.querySelector(".surah-action-panel");
      this.studyPanelEl = this.root.querySelector(".trainer-study-panel");
      this.readerPanelEl = this.root.querySelector(".trainer-reader-panel");
      this.readerHeadEl = this.root.querySelector(".reader-head");
      this.readerScrollEl = this.root.querySelector(".reader-scroll");
      this.ayahRefEl = this.root.querySelector(".trainer-ayah-ref");
      this.ayahWrapEl = this.root.querySelector(".trainer-ayah-wrap");
      this.fullAyahEl = this.root.querySelector(".trainer-full-ayah");
      this.playzoneEl = this.root.querySelector(".codex-playzone");
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
      this.mobileJuzSummaryEl = this.root.querySelector(".mobile-juz-summary");

      // Real recitation (word clips + full ayahs), sharing the sound toggle.
      // The channel lives on Game so island moments (pet recitals) reuse it.
      this.recite = game.recite || new ns.RecitationAudio(() => this.game.sound.enabled);
      this.currentAudioPath = "";
      this.wordCardEl.addEventListener("click", () => this.playCurrentWord());
      this.wordCardEl.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          this.playCurrentWord();
        }
      });

      this.closeButton.addEventListener("click", () => this.close());
      this.surahToggleButton.addEventListener("click", () => this.toggleCollection());
      for (const tab of this.tabButtons) {
        tab.addEventListener("click", () => this.setTab(tab.dataset.tab));
      }
      this.fontToggleButton.addEventListener("click", () => {
        this.setFontPanel(this.fontPanelEl.hidden);
      });
      for (const button of this.fontStepButtons) {
        button.addEventListener("click", () => this.changeFontScale(Number(button.dataset.fontStep)));
      }
      this.fontResetButton.addEventListener("click", () => this.resetFontScale());
      this.soundButton.addEventListener("click", () => {
        const on = this.game.sound.toggle();
        this.syncSoundButton();
        if (on) this.game.sound.play("click");
        else this.recite.stop();
      });
      this.meaningToggleEl.addEventListener("click", () => {
        const result = this.engine.showMeaning();
        this.game.sound.play(result?.reset ? "wrong" : "page");
        this.render();
      });
      this.reviewExitEl.addEventListener("click", async () => {
        await this.engine.stopReviewMode();
        this.render();
      });
      this.mobileJuzSummaryEl.addEventListener("click", () => this.setTab("collection"));
      this.root.addEventListener("click", (event) => {
        if (event.target === this.root) this.close();
        if (!this.fontMenuEl.contains(event.target)) this.setFontPanel(false);
      });
      window.addEventListener("keydown", (event) => {
        if (!this.isOpen || event.code !== "Escape") return;
        if (!this.fontPanelEl.hidden) {
          this.setFontPanel(false);
          return;
        }
        this.close();
      });
      this.syncCollectionToggle();
      this.syncSoundButton();
      this.applyFontScale();
    }

    open() {
      this.isOpen = true;
      this.root.hidden = false;
      this.message = "";
      if (!this.engine) {
        this.engine = new ns.TrainerEngine((game) => {
          const events = game.progress.completeStudyStep();
          game.farming.advanceCropsByStudy();
          this.queueCutawayFor(events);
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
      this.clearFocusTimer();
      this.closeReaderPopover();
      this.recite.stop();
      // Study may have minted new gold words — let the island's garden grow,
      // and if a juz badge landed this session, its islet rises on camera.
      this.game.wordGarden?.refresh();
      this.game.islandShaper?.syncBadgeIslets(this.game, { animate: true });
    }

    setTab(tab) {
      if (tab === this.activeTab) return;
      this.activeTab = tab;
      for (const button of this.tabButtons) {
        const active = button.dataset.tab === tab;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-selected", String(active));
      }
      this.game.sound.play("page");
      this.closeReaderPopover();
      this.recite.stop();
      this.render();
    }

    syncSoundButton() {
      const on = this.game.sound.enabled;
      this.soundButton.textContent = on ? "🔊" : "🔇";
      this.soundButton.title = on ? "Sound on" : "Sound off";
    }

    setFontPanel(open) {
      this.fontPanelEl.hidden = !open;
      this.fontToggleButton.setAttribute("aria-expanded", String(open));
    }

    changeFontScale(direction) {
      this.fontScale = clampFontScale(this.fontScale + direction * FONT_SCALE_STEP);
      saveFontScalePreference(this.fontScale);
      this.applyFontScale();
      this.game.sound.play("click");
    }

    resetFontScale() {
      this.fontScale = 1;
      saveFontScalePreference(this.fontScale);
      this.applyFontScale();
      this.game.sound.play("click");
    }

    applyFontScale() {
      const value = clampFontScale(this.fontScale);
      this.fontScale = value;
      this.card.style.setProperty("--codex-font-scale", value.toFixed(2));
      this.card.dataset.fontScale = String(Math.round(value * 100));
      this.fontStepButtons.forEach((button) => {
        const direction = Number(button.dataset.fontStep);
        button.disabled = direction > 0 ? value >= FONT_SCALE_MAX : value <= FONT_SCALE_MIN;
      });
      this.fontResetButton.disabled = Math.abs(value - 1) < 0.001;
    }

    // ---------- island cutaways ----------
    // Big study rewards briefly step out of the Codex: the camera glides to
    // where the reward landed (egg in the hatchery, a bridge swinging open),
    // then the Codex returns — the island visibly grows because you studied.

    queueCutawayFor(events) {
      const game = this.game;
      for (const event of events) {
        if (event.type === "animalUnlocked") {
          const isle = (game.world.islands || []).find((i) => i.zones.includes(event.animal.zone));
          const target = isle
            ? { x: isle.bounds.x + isle.bounds.w / 2, y: isle.bounds.y + isle.bounds.h / 2 }
            : { x: game.hatchery.x, y: game.hatchery.y };
          this.pendingCutaway = { ...target, duration: 3.4 };
          return; // a hatch outranks the egg-arrival moment
        }
        if (event.type === "eggAwarded") {
          this.pendingCutaway = { x: game.hatchery.x + 60, y: game.hatchery.y + 40, duration: 2.6 };
        }
      }
    }

    playPendingCutaway(afterwards) {
      const cut = this.pendingCutaway;
      this.pendingCutaway = null;
      if (!cut) {
        afterwards();
        return;
      }
      this.close();
      this.game.playCutaway(cut.x, cut.y, cut.duration, () => {
        this.open();
        afterwards();
      });
    }

    // ---------- main render ----------

    render() {
      if (!this.engine) return;
      this.current = this.engine.getView();
      this.renderRewardStrip();
      this.renderSurahCollection();
      this.card.dataset.activeTab = this.activeTab;

      const view = this.current;
      this.progressEl.textContent = view.progressText || "";
      this.sessionEl.textContent = view.session
        ? `Today ${Math.min(view.session.count, view.session.goal)}/${view.session.goal} ayahs` +
          (view.session.streak > 0 ? ` · 🔥 ${view.session.streak}-day streak` : "") +
          (view.session.rescued > 0 ? ` · 💪 ${view.session.rescued} rescued` : "")
        : "";

      const reading = this.activeTab === "read";
      const collecting = this.activeTab === "collection";
      this.collectionEl.hidden = false;
      this.studyPanelEl.hidden = reading || collecting;
      this.readerPanelEl.hidden = !reading;
      if (collecting) {
        this.closeReaderPopover();
        return;
      }
      if (reading) {
        this.renderReader();
        return;
      }

      // Reset transient sections; each mode fills what it needs.
      this.clearFocusTimer();
      this.optionsEl.innerHTML = "";
      this.revealPanelEl.hidden = true;
      this.playzoneEl.hidden = false;
      this.reviewBarEl.hidden = true;
      this.meaningToggleEl.hidden = true;
      this.meaningEl.hidden = true;
      this.wordCardEl.hidden = false;
      this.ayahRefEl.hidden = true;
      this.ayahRefEl.textContent = "";
      this.fullAyahEl.innerHTML = "";
      this.ayahWrapEl.hidden = false;
      this.ayahWrapEl.classList.remove("is-scrollable");
      this.meterEl.textContent = "";
      this.masteryEl?.remove();
      this.masteryEl = null;
      this.currentAudioPath = "";
      this.setWordAudioTarget(false);

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
        this.ayahRefEl.hidden = false;
        this.ayahRefEl.textContent = view.surahRef ? `Ayah ${view.surahRef}` : "";
        this.renderReveal(view);
        return;
      }
      if (view.mode === "sessionDone") {
        this.renderSessionDone(view);
        return;
      }
      if (view.mode === "focusDone") {
        this.renderFocusDone(view);
        return;
      }

      // word / interleaved review / endless review-mode share the play zone.
      // Review questions may flip direction: the card shows the gloss (pick
      // the Arabic) or just a speaker (pick the word you heard).
      const direction = view.direction || "toEnglish";
      this.arabicEl.classList.toggle("is-gloss-card", direction === "toArabic");
      this.arabicEl.classList.toggle("is-listen-card", direction === "listen");
      if (direction === "toArabic") {
        this.setStudyText(view.gloss, "", view.prompt || "");
      } else if (direction === "listen") {
        this.setStudyText("🔊", "tap to hear it again", view.prompt || "");
        const listenKey = `${view.arabic}|${view.tally ? view.tally.asked : view.surahRef || ""}`;
        if (this.listenPlayedFor !== listenKey) {
          this.listenPlayedFor = listenKey;
          this.recite.playWord(view.audioPath);
        }
      } else {
        this.setStudyText(view.arabic, view.translit || "", view.prompt || "");
      }
      this.messageEl.textContent = this.message || view.message || "";
      this.renderMasteryBadge(view.mastery);
      this.currentAudioPath = view.audioPath || "";
      this.setWordAudioTarget(!!this.currentAudioPath);

      if (view.mode === "word") {
        this.ayahRefEl.hidden = false;
        this.ayahRefEl.textContent = view.surahRef ? `Ayah ${view.surahRef}` : "";
        this.renderAyahLine(view);
        this.meterEl.textContent = `Slips ${view.mistakes}/${view.budget} · Word ${Math.min(view.solved + 1, view.total)}/${view.total}`;
        this.meaningToggleEl.hidden = !!view.meaningShown;
        if (view.meaningShown && view.wordMeaning) {
          this.meaningEl.hidden = false;
          this.meaningEl.textContent = `“${view.wordMeaning}”`;
        }
      } else {
        this.ayahWrapEl.hidden = true;
        if (view.mode === "reviewMode") {
          this.reviewBarEl.hidden = false;
          this.renderReviewBar(view);
        }
      }

      for (const option of view.options) {
        const button = document.createElement("button");
        button.className = "trainer-option";
        button.type = "button";
        button.textContent = option;
        if (view.optionsAreArabic) {
          button.classList.add("is-arabic-option");
          button.dir = "rtl";
          button.lang = "ar";
        }
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

    playCurrentWord() {
      this.recite.playWord(this.currentAudioPath);
    }

    setWordAudioTarget(enabled) {
      this.wordCardEl.classList.toggle("is-hearable", enabled);
      if (enabled) {
        this.wordCardEl.setAttribute("role", "button");
        this.wordCardEl.setAttribute("tabindex", "0");
        this.wordCardEl.setAttribute("aria-label", "Hear this word recited");
      } else {
        this.wordCardEl.removeAttribute("role");
        this.wordCardEl.removeAttribute("tabindex");
        this.wordCardEl.removeAttribute("aria-label");
      }
    }

    renderAyahLine(view) {
      this.fullAyahEl.innerHTML = "";
      const words = view.ayahWords || [];
      const solved = new Set(view.solvedIndexes || []);
      this.ayahWrapEl.classList.toggle("is-scrollable", words.length > 18);
      words.forEach((word, index) => {
        const span = document.createElement("span");
        span.textContent = word;
        if (index === view.activeWordIndex) span.classList.add("is-active-word");
        else if (solved.has(index)) span.classList.add("is-solved-word");
        if ((view.ayahMastery || [])[index] === 3) span.classList.add("is-gold-word");
        this.fullAyahEl.appendChild(span);
      });
    }

    // Small mastery medal on the word card — the word's long-term rank
    // (new → bronze → silver → gold), earned from its whole stats history.
    renderMasteryBadge(tier) {
      if (tier === undefined) return;
      const names = ["new word", "bronze", "silver", "gold"];
      const badge = document.createElement("span");
      badge.className = `trainer-mastery is-tier-${tier}`;
      badge.title = `Word mastery: ${names[tier]}`;
      badge.textContent = tier === 0 ? "✧ new" : tier === 1 ? "★ bronze" : tier === 2 ? "★ silver" : "★ gold";
      this.wordCardEl.appendChild(badge);
      this.masteryEl = badge;
    }

    renderReviewBar(view) {
      this.reviewTallyEl.innerHTML = "";
      const tally = document.createElement("span");
      if (view.focus) {
        tally.textContent = `⏳ ${view.focus.secondsLeft}s · ${view.focus.count} recalled`;
        this.startFocusTimer();
      } else {
        tally.textContent = `Endless review · ${view.tally.right}/${view.tally.asked} recalled`;
        const focusBtn = document.createElement("button");
        focusBtn.type = "button";
        focusBtn.className = "trainer-focus-start";
        focusBtn.textContent = "⏳ Focus round";
        focusBtn.title = "90 seconds — how many words can you recall?";
        focusBtn.addEventListener("click", () => {
          this.engine.startFocusRound();
          this.message = "";
          this.game.sound.play("click");
          this.render();
        });
        this.reviewTallyEl.appendChild(focusBtn);
      }
      this.reviewTallyEl.prepend(tally);
    }

    startFocusTimer() {
      this.clearFocusTimer();
      this.focusTimer = setInterval(() => {
        const engine = this.engine;
        if (!this.isOpen || !engine?.focus) {
          this.clearFocusTimer();
          return;
        }
        const left = engine.focusSecondsLeft();
        const tallySpan = this.reviewTallyEl.querySelector("span");
        if (tallySpan) tallySpan.textContent = `⏳ ${left}s · ${engine.focus.count} recalled`;
        if (left <= 0) {
          this.clearFocusTimer();
          engine.endFocusRound();
          this.render();
        }
      }, 250);
    }

    clearFocusTimer() {
      if (this.focusTimer) {
        clearInterval(this.focusTimer);
        this.focusTimer = null;
      }
    }

    renderFocusDone(view) {
      const r = view.focusResult;
      this.playzoneEl.hidden = true;
      this.fullAyahEl.hidden = true;
      this.revealPanelEl.hidden = false;
      this.revealPanelEl.innerHTML = "";

      const badge = document.createElement("p");
      badge.className = "trainer-reveal-badge" + (r.isRecord ? " is-perfect" : "");
      badge.textContent = r.isRecord ? "🏆 New personal best!" : "⏳ Focus round over";
      const line = document.createElement("p");
      line.className = "trainer-reveal-literal";
      line.textContent = `${r.count} word${r.count === 1 ? "" : "s"} recalled in 90 seconds · best ${r.best}`;
      this.revealPanelEl.append(badge, line);
      if (r.isRecord) {
        this.celebrate(true);
        this.game.sound.play("record");
      }

      const again = document.createElement("button");
      again.type = "button";
      again.className = "trainer-option trainer-continue";
      again.textContent = "Go again ⏳";
      again.addEventListener("click", () => {
        this.engine.dismissFocusResult();
        this.engine.startFocusRound();
        this.render();
      });
      const back = document.createElement("button");
      back.type = "button";
      back.className = "trainer-option trainer-continue";
      back.textContent = "Back to review";
      back.addEventListener("click", () => {
        this.engine.dismissFocusResult();
        this.render();
      });
      this.revealPanelEl.append(again, back);
    }

    // Daily-goal end screen: the bounded-ritual stopping point, Codex-styled.
    renderSessionDone(view) {
      const s = view.sessionDone;
      this.playzoneEl.hidden = true;
      this.fullAyahEl.hidden = true;
      this.revealPanelEl.hidden = false;
      this.revealPanelEl.innerHTML = "";

      const badge = document.createElement("p");
      badge.className = "trainer-reveal-badge is-perfect";
      badge.textContent = "🌙 Session complete";
      const title = document.createElement("p");
      title.className = "trainer-reveal-literal";
      title.textContent = `You finished your ${s.goal} ayahs for today. Resting now beats rushing — let it settle.`;
      const streak = document.createElement("p");
      streak.className = "trainer-reveal-summary";
      streak.textContent = s.streak > 1
        ? `🔥 ${s.streak}-day streak — keep it alive tomorrow.`
        : "🔥 Day 1 — come back tomorrow to start a streak.";
      this.revealPanelEl.append(badge, title, streak);
      if (s.rescued > 0) {
        const rescued = document.createElement("p");
        rescued.className = "trainer-reveal-summary";
        rescued.textContent = `💪 ${s.rescued} word${s.rescued === 1 ? "" : "s"} rescued today — slips you turned into wins.`;
        this.revealPanelEl.appendChild(rescued);
      }
      this.celebrate(true);
      this.game.sound.play("perfect");

      const more = document.createElement("button");
      more.type = "button";
      more.className = "trainer-option trainer-continue";
      more.textContent = "Keep going ›";
      more.addEventListener("click", async () => {
        await this.engine.dismissSessionDone(this.game);
        this.render();
      });
      const leave = document.createElement("button");
      leave.type = "button";
      leave.className = "trainer-option trainer-continue";
      leave.textContent = "Return to the island";
      leave.addEventListener("click", async () => {
        await this.engine.dismissSessionDone(this.game);
        this.close();
      });
      this.revealPanelEl.append(more, leave);
    }

    // Post-ayah reveal: full Arabic, literal word-by-word line, and the
    // Saheeh International translation — the meaning arrives as the reward
    // for completing the test, exactly like the standalone trainer.
    renderReveal(view) {
      this.playzoneEl.hidden = true;
      this.fullAyahEl.hidden = true;
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

      // Pacing: the juz ladder. Badge moment outranks the plain progress bar.
      if (view.badgeEarned) {
        const earned = document.createElement("div");
        earned.className = "reveal-badge-earned";
        earned.innerHTML = `<span class="juz-badge is-earned is-big"><i>★</i></span>
          <p>🏅 Juz ${view.badgeEarned} badge earned — a whole juz, word by word!</p>`;
        this.revealPanelEl.appendChild(earned);
      } else if (view.juz) {
        const juz = document.createElement("div");
        juz.className = "reveal-juz";
        const pct = Math.round((view.juz.done / view.juz.total) * 100);
        const left = view.juz.total - view.juz.done;
        juz.innerHTML = `<span class="reveal-juz-label">Juz ${view.juz.juz} badge · ${view.juz.done}/${view.juz.total}${left <= 10 ? ` — only ${left} to go!` : ""}</span>
          <span class="reveal-juz-track"><span class="reveal-juz-fill" style="width:${pct}%"></span></span>`;
        this.revealPanelEl.appendChild(juz);
      }

      const hear = document.createElement("button");
      hear.type = "button";
      hear.className = "trainer-option trainer-continue trainer-hear-ayah";
      hear.textContent = "🔊 Hear it recited";
      hear.addEventListener("click", () => {
        this.recite.playAyah(view.surahNumber, view.ayahNumber);
      });

      const cont = document.createElement("button");
      cont.type = "button";
      cont.className = "trainer-option trainer-continue";
      cont.textContent = view.surahComplete
        ? (view.nextNumber ? `Begin ${view.nextName} →` : "Continue →")
        : "Continue →";
      cont.addEventListener("click", () => {
        this.recite.stop();
        this.playPendingCutaway(async () => {
          await this.engine.continueFromReveal(this.game);
          this.message = "";
          this.render();
        });
      });
      this.revealPanelEl.append(hear, cont);

      const big = view.perfect || view.surahComplete || !!view.badgeEarned;
      this.celebrate(big);
      this.flySeeds();
      this.game.sound.play(view.badgeEarned ? "record" : big ? "perfect" : "ayahComplete");
      // The reward for finishing the test: hear the whole ayah recited.
      this.recite.playAyah(view.surahNumber, view.ayahNumber);
    }

    // ---------- the Read tab: a browsable mushaf of completed ayahs ----------

    renderReader() {
      const engine = this.engine;
      if (!engine || engine.loading) {
        this.readerHeadEl.textContent = "Opening the reader…";
        this.readerScrollEl.innerHTML = "";
        return;
      }
      const ayahs = engine.readerAyahs();
      const name = engine.surah ? (engine.surah.englishName || engine.surah.name) : "";
      this.readerHeadEl.innerHTML = "";
      const title = document.createElement("span");
      title.className = "reader-title";
      title.textContent = `${name} — ${ayahs.length} completed ayah${ayahs.length === 1 ? "" : "s"}`;
      const tip = document.createElement("span");
      tip.className = "reader-tip";
      tip.textContent = ayahs.length ? "tap a word to hear it and see its meaning" : "";
      this.readerHeadEl.append(title, tip);

      this.readerScrollEl.innerHTML = "";
      if (!ayahs.length) {
        const empty = document.createElement("p");
        empty.className = "reader-empty";
        empty.textContent = "Nothing here yet — every ayah you complete at the desk is added to this scroll.";
        this.readerScrollEl.appendChild(empty);
        return;
      }

      for (const ayah of ayahs) {
        const block = document.createElement("article");
        block.className = "reader-ayah";

        const head = document.createElement("div");
        head.className = "reader-ayah-head";
        const ref = document.createElement("span");
        ref.className = "reader-ref";
        ref.textContent = ayah.ref;
        head.appendChild(ref);
        const hear = document.createElement("button");
        hear.type = "button";
        hear.className = "reader-hear";
        hear.textContent = "🔊";
        hear.title = `Hear ${ayah.ref} recited`;
        hear.setAttribute("aria-label", `Hear ayah ${ayah.ref} recited`);
        hear.addEventListener("click", () => {
          this.recite.playAyah(engine.surah.number, ayah.number);
        });
        head.appendChild(hear);
        if (ayah.perfect) {
          const star = document.createElement("span");
          star.className = "reader-perfect";
          star.textContent = "★ Perfect";
          head.appendChild(star);
        }

        const line = document.createElement("div");
        line.className = "reader-arabic";
        line.dir = "rtl";
        ayah.words.forEach((word) => {
          const span = document.createElement("button");
          span.type = "button";
          span.className = "reader-word";
          if (word.mastery === 3) span.classList.add("is-gold-word");
          span.textContent = word.arabic;
          span.addEventListener("click", (event) => {
            event.stopPropagation();
            this.openReaderPopover(word, span);
          });
          line.appendChild(span);
        });

        const literal = document.createElement("p");
        literal.className = "reader-literal";
        literal.textContent = ayah.literal;

        const translation = document.createElement("p");
        translation.className = "reader-translation";
        translation.textContent = ayah.translation;

        block.append(head, line, literal, translation);
        this.readerScrollEl.appendChild(block);
      }
    }

    openReaderPopover(word, anchor) {
      this.closeReaderPopover();
      const pop = document.createElement("div");
      pop.className = "reader-popover";

      const arabic = document.createElement("div");
      arabic.className = "reader-pop-arabic";
      arabic.dir = "rtl";
      arabic.textContent = word.arabic;
      if (word.audioPath) {
        // Tapping a word both shows and sounds it; the Arabic replays it.
        this.recite.playWord(word.audioPath);
        arabic.classList.add("is-hearable");
        arabic.title = "Hear this word again";
        arabic.addEventListener("click", () => this.recite.playWord(word.audioPath));
      }

      const gloss = document.createElement("p");
      gloss.className = "reader-pop-gloss";
      gloss.textContent = word.gloss;

      const translit = document.createElement("p");
      translit.className = "reader-pop-translit";
      translit.textContent = word.translit;

      const names = ["✧ new", "★ bronze", "★ silver", "★ gold"];
      const mastery = document.createElement("span");
      mastery.className = `trainer-mastery is-tier-${word.mastery} reader-pop-mastery`;
      mastery.textContent = names[word.mastery];

      pop.append(arabic, gloss, translit, mastery);

      if (word.family.length) {
        const fam = document.createElement("div");
        fam.className = "reader-pop-family";
        const label = document.createElement("span");
        label.className = "reader-pop-family-label";
        label.dir = "rtl";
        label.textContent = word.root.split("").join(" ");
        fam.appendChild(label);
        for (const member of word.family) {
          const chip = document.createElement("span");
          chip.className = "reader-pop-chip";
          chip.innerHTML = `<b dir="rtl">${member.arabic}</b> ${member.english}`;
          fam.appendChild(chip);
        }
        pop.appendChild(fam);
      }

      this.readerPanelEl.appendChild(pop);
      // Position near the tapped word, clamped inside the reader panel;
      // flip above the word when there's no room below.
      const panelRect = this.readerPanelEl.getBoundingClientRect();
      const wordRect = anchor.getBoundingClientRect();
      const left = Math.max(8, Math.min(wordRect.left - panelRect.left - 60, panelRect.width - pop.offsetWidth - 8));
      let top = wordRect.bottom - panelRect.top + 6;
      if (top + pop.offsetHeight > panelRect.height - 8) {
        top = Math.max(8, wordRect.top - panelRect.top - pop.offsetHeight - 6);
      }
      pop.style.left = `${left}px`;
      pop.style.top = `${top}px`;
      anchor.classList.add("is-inspected");
      this.readerPopover = pop;
      this.inspectedWordEl = anchor;
      this.game.sound.play("click");

      this.popoverDismiss = (event) => {
        if (!pop.contains(event.target)) this.closeReaderPopover();
      };
      setTimeout(() => document.addEventListener("pointerdown", this.popoverDismiss), 0);
    }

    closeReaderPopover() {
      if (this.readerPopover) {
        this.readerPopover.remove();
        this.readerPopover = null;
      }
      if (this.inspectedWordEl) {
        this.inspectedWordEl.classList.remove("is-inspected");
        this.inspectedWordEl = null;
      }
      if (this.popoverDismiss) {
        document.removeEventListener("pointerdown", this.popoverDismiss);
        this.popoverDismiss = null;
      }
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
      this.renderBadges();
    }

    // The gym-badge shelf: one medallion per juz, earned ones lit gold,
    // in-progress ones filling their ring — the whole Quran as 30 near goals.
    renderBadges() {
      const badges = this.engine.badges();
      this.badgeShelfEl.hidden = !badges.length;
      if (!badges.length) return;
      const earned = badges.filter((b) => b.earned).length;
      this.badgeShelfEl.querySelector("h3").textContent = `Juz Badges · ${earned}/30`;
      this.badgeGridEl.innerHTML = "";
      for (const b of badges) {
        const medal = document.createElement("span");
        medal.className = "juz-badge" + (b.earned ? " is-earned" : "");
        medal.style.setProperty("--pct", String(Math.round((b.done / b.total) * 100)));
        medal.title = b.earned
          ? `Juz ${b.juz} — badge earned!`
          : `Juz ${b.juz} · ${b.done}/${b.total} ayahs`;
        const face = document.createElement("i");
        face.textContent = b.earned ? "★" : String(b.juz);
        medal.appendChild(face);
        this.badgeGridEl.appendChild(medal);
      }
    }

    onSurahTileClick(item) {
      const { entry, status, unlockAfter } = item;
      this.game.sound.play("click");
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
          this.setTabQuiet("study");
          this.render();
        }, true);
        btn("Stay", dismiss);
        return;
      }

      if (action.type === "completedMenu") {
        text.textContent = `${action.name} is complete. Read it back, review it to keep it fresh, or restart it (word history stays).`;
        btn("Read it", async () => {
          this.pendingAction = null;
          await this.engine.switchSurah(action.number);
          this.setTabQuiet("read");
          this.render();
        }, true);
        btn("Review it", async () => {
          this.pendingAction = null;
          await this.engine.switchSurah(action.number); // lands in endless review
          this.message = "";
          this.setTabQuiet("study");
          this.render();
        });
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
          this.setTabQuiet("study");
          this.render();
        }, true);
        btn("Cancel", dismiss);
      }
    }

    // Switch tab state without triggering a render or page sound (used by
    // collection actions that render right after).
    setTabQuiet(tab) {
      this.activeTab = tab;
      this.card.dataset.activeTab = tab;
      for (const button of this.tabButtons) {
        const active = button.dataset.tab === tab;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-selected", String(active));
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
      this.renderMobileJuzSummary();
    }

    renderMobileJuzSummary() {
      if (!this.mobileJuzSummaryEl || !this.engine) {
        if (this.mobileJuzSummaryEl) this.mobileJuzSummaryEl.hidden = true;
        return;
      }
      const badges = this.engine.badges ? this.engine.badges() : [];
      if (!badges.length || this.current?.reviewing) {
        this.mobileJuzSummaryEl.hidden = true;
        return;
      }
      const current = badges.find((b) => !b.earned) || badges[badges.length - 1];
      this.mobileJuzSummaryEl.hidden = false;
      this.mobileJuzSummaryEl.textContent = current.earned
        ? "All Juz badges earned · View Collection"
        : `Juz ${current.juz} · ${current.done}/${current.total} ayahs · View Collection`;
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
        this.game.sound.play("wrong");
        this.message = this.engine.message || "Not quite. Try that one again gently.";
        this.messageEl.textContent = this.message;
        for (const b of this.optionsEl.querySelectorAll("button")) b.disabled = false;
        return;
      }

      button.classList.add(result.correct ? "is-correct" : "is-wrong");
      if (result.correct) {
        button.classList.add("is-pop");
        const active = this.fullAyahEl.querySelector(".is-active-word");
        if (active) active.classList.add("is-pop");
        // Reveal plays its own completion chime; plain correct gets the pluck
        // plus the word's real recitation (the reveal recites the whole ayah).
        if (!result.ayahComplete) {
          this.game.sound.play("correct");
          this.recite.playWord(this.currentAudioPath);
        }
      } else {
        this.game.sound.play("wrong");
      }
      this.message = this.engine.message;
      // Brief beat so the button state lands before the next card.
      setTimeout(() => {
        if (this.isOpen) this.render();
      }, result.correct ? 300 : 700);
    }

    // ---------- juice ----------

    prefersReducedMotion() {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    // Dependency-free confetti burst over the study panel (gold-heavy when
    // the moment is a Perfect/record one) — ported from the standalone app.
    celebrate(golden) {
      if (this.prefersReducedMotion()) return;
      const anchor = this.revealPanelEl.hidden ? this.wordCardEl : this.revealPanelEl;
      const rect = anchor.getBoundingClientRect();
      const layer = document.createElement("div");
      layer.className = "codex-confetti-layer";
      layer.style.left = rect.left + rect.width / 2 + "px";
      layer.style.top = rect.top + 36 + "px";
      const colors = golden
        ? ["#eab654", "#ffedb0", "#d8b25a", "#46b187", "#ffffff"]
        : ["#46b187", "#eab654", "#7fc9a6"];
      const count = golden ? 28 : 16;
      for (let i = 0; i < count; i += 1) {
        const p = document.createElement("i");
        p.className = "codex-confetti";
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
        const dist = 60 + Math.random() * (golden ? 110 : 70);
        p.style.setProperty("--dx", Math.cos(angle) * dist + "px");
        p.style.setProperty("--dy", Math.sin(angle) * dist - 30 + "px");
        p.style.setProperty("--rot", Math.random() * 720 - 360 + "deg");
        p.style.background = colors[i % colors.length];
        p.style.animationDelay = Math.random() * 60 + "ms";
        layer.appendChild(p);
      }
      document.body.appendChild(layer);
      setTimeout(() => layer.remove(), 1200);
    }

    // A couple of seed icons arc from the reveal down to the reward strip —
    // the payout is seen leaving the study desk and landing in the pouch.
    flySeeds() {
      if (this.prefersReducedMotion()) return;
      const from = this.revealPanelEl.getBoundingClientRect();
      const to = this.metricSeedsEl.getBoundingClientRect();
      for (let i = 0; i < 3; i += 1) {
        const img = document.createElement("img");
        img.className = "codex-flying-seed";
        img.src = "assets/generated/crops/seed_packet_icon.png";
        img.style.left = from.left + from.width / 2 - 12 + i * 10 + "px";
        img.style.top = from.top + 30 + "px";
        document.body.appendChild(img);
        const dx = to.left + to.width / 2 - (from.left + from.width / 2);
        const dy = to.top - from.top - 30;
        requestAnimationFrame(() => {
          img.style.transitionDelay = `${i * 90}ms`;
          img.style.transform = `translate(${dx}px, ${dy}px) scale(0.5)`;
          img.style.opacity = "0.15";
        });
        setTimeout(() => img.remove(), 1100 + i * 90);
      }
      this.game.sound.play("seed");
    }
  }

  function loadCollectionPreference() {
    try {
      return localStorage.getItem("miftah-oasis:trainer-collection") === "collapsed";
    } catch {
      return false;
    }
  }

  function clampFontScale(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 1;
    return Math.max(FONT_SCALE_MIN, Math.min(FONT_SCALE_MAX, Math.round(n * 100) / 100));
  }

  function loadFontScalePreference() {
    try {
      return clampFontScale(localStorage.getItem(FONT_SCALE_KEY) || 1);
    } catch {
      return 1;
    }
  }

  function saveFontScalePreference(value) {
    try {
      localStorage.setItem(FONT_SCALE_KEY, String(clampFontScale(value)));
    } catch {}
  }

  ns.TrainerOverlay = TrainerOverlay;
})(window.MiftahGame || (window.MiftahGame = {}));
