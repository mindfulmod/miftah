(function (ns) {
  class TrainerOverlay {
    constructor(game) {
      this.game = game;
      this.isOpen = false;
      this.current = null;
      this.message = "";
      this.selectedSurahNumber = 1;
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
          </div>

          <div class="codex-board">
            <aside id="surah-collection" class="surah-collection" aria-label="Surah Garden collection">
              <div class="surah-collection-head">
                <h3>Surah Collection</h3>
                <button class="surah-toggle" type="button" aria-controls="surah-collection"></button>
              </div>
              <div class="surah-grid"></div>
              <p class="surah-collection-stats"></p>
            </aside>

            <section class="trainer-study-panel" aria-label="Study question">
              <div class="trainer-full-ayah" dir="rtl"></div>
              <div class="trainer-word-card">
                <div class="trainer-arabic" dir="rtl"></div>
                <div class="trainer-translit"></div>
              </div>
              <p class="trainer-prompt"></p>
              <div class="trainer-options"></div>
              <p class="trainer-message" aria-live="polite"></p>
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
              <img src="assets/generated/props/prop_geometric_mat_blue.png" alt="" />
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
      this.metricSeedsEl = this.root.querySelector(".metric-seeds");
      this.metricFeedEl = this.root.querySelector(".metric-feed");
      this.metricEggEl = this.root.querySelector(".metric-egg");
      this.collectionStatsEl = this.root.querySelector(".surah-collection-stats");
      this.surahGridEl = this.root.querySelector(".surah-grid");
      this.fullAyahEl = this.root.querySelector(".trainer-full-ayah");
      this.arabicEl = this.root.querySelector(".trainer-arabic");
      this.translitEl = this.root.querySelector(".trainer-translit");
      this.promptEl = this.root.querySelector(".trainer-prompt");
      this.optionsEl = this.root.querySelector(".trainer-options");
      this.messageEl = this.root.querySelector(".trainer-message");
      this.rewardNoteEl = this.root.querySelector(".trainer-reward-note");

      this.closeButton.addEventListener("click", () => this.close());
      this.surahToggleButton.addEventListener("click", () => this.toggleCollection());
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

    render() {
      const state = this.game.progress.state;
      this.renderMetrics(state);
      this.renderSurahCollection(state);

      if (!this.engine) return;
      this.current = this.engine.getView(this.game);

      if (this.current.mode === "loading") {
        this.fullAyahEl.innerHTML = "";
        this.arabicEl.textContent = "";
        this.translitEl.textContent = "";
        this.promptEl.textContent = "";
        this.optionsEl.innerHTML = "";
        this.messageEl.textContent = "Opening the Study Desk…";
        return;
      }
      if (this.current.mode === "error" || this.current.mode === "locked") {
        this.fullAyahEl.innerHTML = "";
        this.arabicEl.textContent = "";
        this.translitEl.textContent = "";
        this.promptEl.textContent = "";
        this.optionsEl.innerHTML = "";
        this.messageEl.textContent =
          this.current.mode === "error"
            ? this.current.message
            : "You've reached the edge of the available surahs. More are on the way.";
        return;
      }

      this.progressEl.textContent = this.current.progressText;
      this.renderAyah();
      this.arabicEl.textContent = this.current.arabic;
      this.translitEl.textContent = this.current.translit || "";
      this.promptEl.textContent = this.current.prompt;
      // Answer feedback stays on the study card; reward/egg progression
      // messaging lives outside it, above the rewards footer.
      this.messageEl.textContent = this.message || this.current.message || "";
      this.rewardNoteEl.textContent = this.eggText();
      this.optionsEl.innerHTML = "";

      shuffle(this.current.options).forEach((option) => {
        const button = document.createElement("button");
        button.className = "trainer-option";
        button.type = "button";
        button.textContent = option;
        button.addEventListener("click", () => this.choose(option, button));
        this.optionsEl.appendChild(button);
      });
    }

    renderMetrics(state) {
      const egg = state.activeEgg;
      const surah = currentSurahFor(state.ayahsCompleted);
      const progress = surah ? surahProgress(surah, state.ayahsCompleted) : null;
      this.progressEl.textContent = surah
        ? `${surah.number}. ${surah.name} · ${progress.studied}/${surah.ayahCount} ayahs`
        : "Study at the archway";
      this.metricSeedsEl.textContent = String(state.seeds);
      this.metricFeedEl.textContent = String(state.feed);
      this.metricEggEl.textContent = egg ? `${egg.progress}/${egg.goal}` : "none";
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

    renderSurahCollection(state) {
      const surahs = ns.SURAHS || [];
      if (!surahs.length) return;
      const totalAyahs = ns.TOTAL_QURAN_AYAHS || surahs.reduce((sum, surah) => sum + surah.ayahCount, 0);
      const ayahsCompleted = Math.max(0, state.ayahsCompleted);
      const completedCount = surahs.filter((surah) => ayahsCompleted >= surah.endAyah).length;
      const currentSurah = currentSurahFor(ayahsCompleted);
      if (!this.selectedSurahNumber && currentSurah) this.selectedSurahNumber = currentSurah.number;
      const selected = surahs.find((surah) => surah.number === this.selectedSurahNumber) || currentSurah || surahs[0];

      this.collectionStatsEl.textContent = `${ayahsCompleted}/${totalAyahs} ayahs · ${completedCount}/${surahs.length} surahs`;
      this.surahGridEl.innerHTML = "";
      for (const surah of surahs) {
        const progress = surahProgress(surah, ayahsCompleted);
        const button = document.createElement("button");
        button.type = "button";
        button.className = `surah-tile is-${progress.status}`;
        if (surah.number === selected.number) button.classList.add("is-selected");
        button.setAttribute("aria-label", `${surah.number}. ${surah.name}, ${progress.studied} of ${surah.ayahCount} ayahs`);

        const ring = document.createElement("span");
        ring.className = "surah-badge-ring";
        ring.style.setProperty("--pct", String(Math.round(progress.ratio * 100)));
        const badge = document.createElement("span");
        badge.className = "surah-badge";
        badge.textContent = String(surah.number);
        ring.appendChild(badge);
        const label = document.createElement("span");
        label.className = "surah-name";
        label.textContent = surah.name;
        const frac = document.createElement("span");
        frac.className = "surah-frac";
        frac.textContent =
          progress.status === "upcoming" ? "locked" : `${progress.studied}/${surah.ayahCount}`;
        button.append(ring, label, frac);
        button.addEventListener("click", () => {
          this.selectedSurahNumber = surah.number;
          this.renderSurahCollection(this.game.progress.state);
        });
        this.surahGridEl.appendChild(button);
      }
    }

    renderAyah() {
      this.fullAyahEl.innerHTML = "";
      this.current.ayahWords.forEach((word, index) => {
        const span = document.createElement("span");
        span.textContent = word;
        if (index === this.current.activeWordIndex) span.className = "is-active-word";
        this.fullAyahEl.appendChild(span);
      });
    }

    eggText() {
      const egg = this.game.progress.state.activeEgg;
      if (!egg) return "Study to earn seeds and discover the next egg.";
      return `Egg hatching: ${egg.progress}/${egg.goal} ayahs`;
    }

    async choose(option, button) {
      if (this.isChoosing) return;
      this.isChoosing = true;
      for (const optionButton of this.optionsEl.querySelectorAll("button")) optionButton.disabled = true;
      this.messageEl.textContent = "Checking…";
      let result;
      try {
        result = await this.engine.choose(option, this.game);
      } catch (err) {
        this.isChoosing = false;
        this.message = "The Study Desk stumbled while checking that answer. Try again.";
        this.messageEl.textContent = this.message;
        for (const optionButton of this.optionsEl.querySelectorAll("button")) optionButton.disabled = false;
        console.error(err);
        return;
      }
      this.isChoosing = false;
      if (!result.correct) {
        button.classList.add("is-wrong");
        this.message = this.engine.message || "Not quite. Try that one again gently.";
        this.messageEl.textContent = this.message;
        for (const optionButton of this.optionsEl.querySelectorAll("button")) optionButton.disabled = false;
        return;
      }

      button.classList.add("is-correct");
      this.message = this.engine.message;
      this.render();
    }
  }

  function shuffle(items) {
    const out = items.slice();
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  function surahProgress(surah, ayahsCompleted) {
    const studied = Math.max(0, Math.min(surah.ayahCount, ayahsCompleted - surah.startAyah + 1));
    const ratio = studied / surah.ayahCount;
    let status = "upcoming";
    if (studied >= surah.ayahCount) status = "complete";
    else if (studied > 0 || ayahsCompleted + 1 === surah.startAyah) status = "current";
    return { studied, ratio, status };
  }

  function currentSurahFor(ayahsCompleted) {
    const surahs = ns.SURAHS || [];
    return surahs.find((surah) => ayahsCompleted < surah.endAyah) || surahs[surahs.length - 1] || null;
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
