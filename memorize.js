(() => {
  "use strict";

  const FIRST_SHORT_SURAH = 78;
  const LAST_SHORT_SURAH = 114;
  const SUPPORTED_SURAHS = Array.from(
    { length: LAST_SHORT_SURAH - FIRST_SHORT_SURAH + 1 },
    (_, index) => FIRST_SHORT_SURAH + index,
  );
  const DEFAULT_SURAH = 114;
  const MEANING_CUE_SURAHS = new Set([105]);
  const REVIEW_INTERVALS = [1, 3, 7, 14, 30, 60];
  const STORAGE_KEY = "miftah:memorize:v1";
  const TIMING_CACHE_PREFIX = "miftah:memorize-timing:v1";
  const RECITER_BASE_URL = "https://verses.quran.com/Alafasy/mp3";
  const CHAPTER_RECITER_ID = 7;
  const CHAPTER_TIMING_API = (surahNumber) =>
    `https://api.quran.com/api/v4/chapter_recitations/${CHAPTER_RECITER_ID}/${surahNumber}?segments=true`;

  const elements = {
    title: document.querySelector("#surah-title"),
    catalogButton: document.querySelector("#surah-catalog-button"),
    catalogDialog: document.querySelector("#surah-catalog-dialog"),
    catalogCurrentName: document.querySelector("#catalog-current-name"),
    catalogCurrentArabic: document.querySelector("#catalog-current-arabic"),
    catalogCurrentProgress: document.querySelector("#catalog-current-progress"),
    catalogTotalProgress: document.querySelector("#catalog-total-progress"),
    catalogSearch: document.querySelector("#surah-search"),
    catalogList: document.querySelector("#surah-catalog-list"),
    catalogEmpty: document.querySelector("#surah-catalog-empty"),
    loading: document.querySelector("#loading"),
    practice: document.querySelector("#practice"),
    pause: document.querySelector("#pause-screen"),
    rest: document.querySelector("#rest-screen"),
    error: document.querySelector("#error-screen"),
    errorCopy: document.querySelector("#error-copy"),
    retryLoad: document.querySelector("#retry-load"),
    taskKind: document.querySelector("#task-kind"),
    ayahReference: document.querySelector("#ayah-reference"),
    steps: [...document.querySelectorAll("#step-list li")],
    practiceLabel: document.querySelector("#practice-label"),
    practiceTitle: document.querySelector("#practice-title"),
    practiceHelp: document.querySelector("#practice-help"),
    scriptureCard: document.querySelector("#scripture-card"),
    basmala: document.querySelector("#basmala"),
    ayahLines: document.querySelector("#ayah-lines"),
    meaningCue: document.querySelector("#meaning-cue"),
    meaningText: document.querySelector("#meaning-text"),
    peekNote: document.querySelector("#peek-note"),
    audioButton: document.querySelector("#audio-button"),
    audioLabel: document.querySelector("#audio-label"),
    audioStatus: document.querySelector("#audio-status"),
    primaryAction: document.querySelector("#primary-action"),
    selfCheck: document.querySelector("#self-check"),
    selfCheckPrompt: document.querySelector("#self-check-prompt"),
    againAction: document.querySelector("#again-action"),
    successAction: document.querySelector("#success-action"),
    drillChoice: document.querySelector("#drill-choice"),
    repairChoice: document.querySelector("#repair-choice"),
    buildChoice: document.querySelector("#build-choice"),
    localNote: document.querySelector("#local-note"),
    pauseKicker: document.querySelector("#pause-kicker"),
    pauseTitle: document.querySelector("#pause-title"),
    pauseCopy: document.querySelector("#pause-copy"),
    continueSession: document.querySelector("#continue-session"),
    restTitle: document.querySelector("#rest-title"),
    restCopy: document.querySelector("#rest-copy"),
    freePractice: document.querySelector("#free-practice"),
    resetProgress: document.querySelector("#reset-progress"),
  };

  const screens = [elements.loading, elements.practice, elements.pause, elements.rest, elements.error];
  const dataCache = new Map();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const audio = new Audio();
  audio.preload = "none";
  const guidedAudio = new Audio();
  guidedAudio.preload = "metadata";

  let currentSurah = getInitialSurah();
  let surahManifest = [];
  let shortSurahs = [];
  let surahData = null;
  let basmalaWords = [];
  let session = null;
  let loadSequence = 0;
  let audioQueue = [];
  let audioQueueIndex = 0;
  let chapterTiming = null;
  let guidedPlayback = null;
  let guidedFrame = 0;
  let storageAvailable = true;
  let progressStore = readProgressStore();

  function getInitialSurah() {
    const requested = Number(new URL(window.location.href).searchParams.get("surah"));
    if (SUPPORTED_SURAHS.includes(requested)) return requested;
    try {
      const remembered = Number(window.localStorage.getItem("miftah:memorize:last-surah"));
      if (SUPPORTED_SURAHS.includes(remembered)) return remembered;
    } catch (error) {
      // A blocked preference should not block practice.
    }
    return DEFAULT_SURAH;
  }

  function emptyProgress() {
    return {
      learned: 0,
      reviewIndex: 0,
      due: null,
      lastPractice: null,
      warmedOn: null,
      completedAt: null,
      signals: {
        weakSpots: {},
        peeks: 0,
        hesitations: 0,
        buildMisses: 0,
        repairs: 0,
      },
    };
  }

  function readProgressStore() {
    const fallback = { version: 1, surahs: {} };
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) return fallback;
      const parsed = JSON.parse(stored);
      if (!parsed || parsed.version !== 1 || typeof parsed.surahs !== "object") return fallback;
      return parsed;
    } catch (error) {
      storageAvailable = false;
      return fallback;
    }
  }

  function catalogEntry(surahNumber) {
    return surahManifest.find((entry) => entry.number === surahNumber) || null;
  }

  function ayahCountFor(surahNumber) {
    const catalog = catalogEntry(surahNumber);
    const cached = dataCache.get(surahNumber);
    const count = catalog?.ayahCount || cached?.surah?.ayahCount;
    if (!Number.isInteger(count) || count < 1) {
      throw new Error(`Missing ayah count for surah ${surahNumber}`);
    }
    return count;
  }

  function getProgress(surahNumber = currentSurah) {
    const total = ayahCountFor(surahNumber);
    const raw = progressStore.surahs[String(surahNumber)] || {};
    const learned = Number.isInteger(raw.learned) ? Math.min(Math.max(raw.learned, 0), total) : 0;
    const reviewIndex = Number.isInteger(raw.reviewIndex)
      ? Math.min(Math.max(raw.reviewIndex, 0), REVIEW_INTERVALS.length - 1)
      : 0;

    return {
      ...emptyProgress(),
      ...raw,
      learned,
      reviewIndex,
      due: isDateKey(raw.due) ? raw.due : null,
      lastPractice: isDateKey(raw.lastPractice) ? raw.lastPractice : null,
      warmedOn: isDateKey(raw.warmedOn) ? raw.warmedOn : null,
      completedAt: isDateKey(raw.completedAt) ? raw.completedAt : null,
      signals: sanitizeSignals(raw.signals),
    };
  }

  function sanitizeSignals(raw) {
    const fallback = emptyProgress().signals;
    if (!raw || typeof raw !== "object") return fallback;
    const weakSpots = {};
    if (raw.weakSpots && typeof raw.weakSpots === "object") {
      for (const [key, value] of Object.entries(raw.weakSpots)) {
        if (!/^\d+:\d+$/.test(key) || !value || typeof value !== "object") continue;
        weakSpots[key] = {
          score: Math.max(0, Number(value.score) || 0),
          peeks: Math.max(0, Number(value.peeks) || 0),
          hesitations: Math.max(0, Number(value.hesitations) || 0),
          buildMisses: Math.max(0, Number(value.buildMisses) || 0),
          lastSeen: isDateKey(value.lastSeen) ? value.lastSeen : null,
        };
      }
    }
    return {
      weakSpots,
      peeks: Math.max(0, Number(raw.peeks) || 0),
      hesitations: Math.max(0, Number(raw.hesitations) || 0),
      buildMisses: Math.max(0, Number(raw.buildMisses) || 0),
      repairs: Math.max(0, Number(raw.repairs) || 0),
    };
  }

  function saveProgress(progress) {
    progressStore.surahs[String(currentSurah)] = progress;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progressStore));
      storageAvailable = true;
    } catch (error) {
      storageAvailable = false;
    }
    updateStorageNote();
    updatePickerProgress();
  }

  function recordSignal(ayahNumber, wordIndex, type) {
    const progress = getProgress();
    const key = `${ayahNumber}:${wordIndex + 1}`;
    const spot = progress.signals.weakSpots[key] || {
      score: 0,
      peeks: 0,
      hesitations: 0,
      buildMisses: 0,
      lastSeen: null,
    };
    const weights = { peek: 1, hesitation: 2, buildMiss: 1 };
    spot.score += weights[type] || 1;
    spot.lastSeen = todayKey();
    if (type === "peek") {
      spot.peeks += 1;
      progress.signals.peeks += 1;
    } else if (type === "hesitation") {
      spot.hesitations += 1;
      progress.signals.hesitations += 1;
    } else if (type === "buildMiss") {
      spot.buildMisses += 1;
      progress.signals.buildMisses += 1;
    }
    progress.signals.weakSpots[key] = spot;
    session?.signalKeys?.add(key);
    saveProgress(progress);
  }

  function softenWeakSpot(ayahNumber, wordIndex, amount = 1) {
    const progress = getProgress();
    const key = `${ayahNumber}:${wordIndex + 1}`;
    const spot = progress.signals.weakSpots[key];
    if (spot) {
      spot.score = Math.max(0, spot.score - amount);
      spot.lastSeen = todayKey();
    }
    progress.signals.repairs += 1;
    saveProgress(progress);
  }

  function softenRangeWeakSpots(progress, rangeEnd) {
    for (const [key, spot] of Object.entries(progress.signals.weakSpots)) {
      const ayahNumber = Number(key.split(":")[0]);
      if (ayahNumber <= rangeEnd && spot.score > 0) spot.score -= 1;
    }
  }

  function unresolvedWeakSpotCount(progress) {
    return Object.values(progress.signals.weakSpots).filter((spot) => spot.score > 0).length;
  }

  function unresolvedWeakScore(progress) {
    return Object.values(progress.signals.weakSpots).reduce((sum, spot) => sum + Math.max(0, spot.score), 0);
  }

  function isDateKey(value) {
    return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
  }

  function todayKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function addDays(dateKey, amount) {
    const date = new Date(`${dateKey}T12:00:00`);
    date.setDate(date.getDate() + amount);
    return todayKey(date);
  }

  function formatDate(dateKey) {
    const date = new Date(`${dateKey}T12:00:00`);
    return new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(date);
  }

  function updateStorageNote() {
    elements.localNote.textContent = storageAvailable
      ? "Progress stays on this device."
      : "Local storage is blocked. Progress lasts until this tab closes.";
  }

  function updatePickerProgress() {
    if (!shortSurahs.length) return;
    const current = catalogEntry(currentSurah);
    const currentProgress = getProgress(currentSurah);
    const currentTotal = ayahCountFor(currentSurah);
    elements.catalogCurrentName.textContent = `${current.englishName} · ${current.number}`;
    elements.catalogCurrentArabic.textContent = current.name;
    elements.catalogCurrentProgress.textContent = progressLabel(currentProgress, currentTotal);

    const linkedSurahs = shortSurahs.filter((entry) => {
      const progress = getProgress(entry.number);
      return progress.learned >= entry.ayahCount;
    }).length;
    elements.catalogTotalProgress.textContent = `${linkedSurahs} of ${shortSurahs.length} surahs linked`;

    for (const button of elements.catalogList.querySelectorAll(".mh-catalog-item")) {
      const surahNumber = Number(button.dataset.surah);
      const entry = catalogEntry(surahNumber);
      const progress = getProgress(surahNumber);
      const status = button.querySelector("[data-catalog-status]");
      button.setAttribute("aria-current", String(surahNumber === currentSurah));
      button.setAttribute(
        "aria-label",
        `${entry.englishName}, surah ${entry.number}, ${progressLabel(progress, entry.ayahCount)}`,
      );
      if (status) status.textContent = `${entry.ayahCount} ayahs · ${progressLabel(progress, entry.ayahCount)}`;
    }
  }

  function progressLabel(progress, total) {
    if (progress.learned === 0) return "Not started";
    if (progress.learned >= total) return "Surah linked";
    return `${progress.learned} of ${total} ayahs linked`;
  }

  function renderSurahCatalog(query = "") {
    const normalized = query.trim().toLocaleLowerCase();
    const visible = shortSurahs.filter((entry) => {
      if (!normalized) return true;
      return [entry.number, entry.englishName, entry.englishTranslation, entry.name]
        .join(" ")
        .toLocaleLowerCase()
        .includes(normalized);
    });
    const fragment = document.createDocumentFragment();

    for (const entry of visible) {
      const progress = getProgress(entry.number);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mh-catalog-item";
      button.dataset.surah = String(entry.number);
      button.setAttribute("aria-current", String(entry.number === currentSurah));
      button.setAttribute("aria-label", `${entry.englishName}, surah ${entry.number}, ${progressLabel(progress, entry.ayahCount)}`);

      const number = document.createElement("span");
      number.className = "mh-catalog-number";
      number.textContent = String(entry.number);

      const names = document.createElement("span");
      names.className = "mh-catalog-names";
      const english = document.createElement("strong");
      english.textContent = entry.englishName;
      const status = document.createElement("small");
      status.dataset.catalogStatus = "true";
      status.textContent = `${entry.ayahCount} ayahs · ${progressLabel(progress, entry.ayahCount)}`;
      names.append(english, status);

      const arabic = document.createElement("span");
      arabic.className = "mh-catalog-item-ar";
      arabic.lang = "ar";
      arabic.dir = "rtl";
      arabic.textContent = entry.name;
      button.append(number, names, arabic);
      fragment.append(button);
    }

    elements.catalogList.replaceChildren(fragment);
    elements.catalogEmpty.hidden = visible.length > 0;
    updatePickerProgress();
  }

  function showScreen(screen) {
    for (const candidate of screens) candidate.hidden = candidate !== screen;
  }

  function dataUrl(surahNumber) {
    return `data/surah-${surahNumber}.json`;
  }

  async function fetchManifest() {
    const response = await fetch("data/surahs.json", { cache: "no-cache" });
    if (!response.ok) throw new Error(`Surah catalog returned ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data?.surahs)) throw new Error("Surah catalog is invalid");
    const entries = data.surahs.filter(
      (entry) =>
        Number.isInteger(entry.number) &&
        Number.isInteger(entry.ayahCount) &&
        typeof entry.name === "string" &&
        typeof entry.englishName === "string" &&
        typeof entry.englishTranslation === "string",
    );
    if (entries.length !== 114) throw new Error("The complete surah catalog is unavailable");
    return entries;
  }

  async function fetchSurah(surahNumber) {
    if (!dataCache.has(surahNumber)) {
      dataCache.set(
        surahNumber,
        fetch(dataUrl(surahNumber), { cache: "no-cache" }).then(async (response) => {
          if (!response.ok) throw new Error(`Quran data returned ${response.status}`);
          const data = await response.json();
          validateSurahData(data, surahNumber);
          return data;
        }),
      );
    }
    return dataCache.get(surahNumber);
  }

  function normalizeChapterTiming(data, targetData) {
    const file = data?.audio_file || data;
    if (!file || typeof file.audio_url !== "string" || !Array.isArray(file.timestamps)) return null;
    const verses = {};

    for (const timestamp of file.timestamps) {
      const [surahNumber, ayahNumber] = String(timestamp.verse_key || "")
        .split(":")
        .map(Number);
      if (surahNumber !== targetData.surah.number) continue;
      const ayah = targetData.ayahs[ayahNumber - 1];
      if (!ayah || !Array.isArray(timestamp.segments)) return null;
      const validSegments = timestamp.segments
        .map((segment) => (Array.isArray(segment) ? segment.map(Number) : []))
        .filter(
          (segment) =>
            segment.length === 3 &&
            Number.isInteger(segment[0]) &&
            segment[0] >= 1 &&
            segment[0] <= ayah.words.length &&
            Number.isFinite(segment[1]) &&
            Number.isFinite(segment[2]) &&
            segment[2] > segment[1],
        )
        .sort((a, b) => a[1] - b[1]);
      const positions = new Set(validSegments.map((segment) => segment[0]));
      if (positions.size !== ayah.words.length) return null;
      if (ayah.words.some((_, index) => !positions.has(index + 1))) return null;
      if (validSegments.some((segment, index) => index > 0 && segment[1] <= validSegments[index - 1][1])) {
        return null;
      }
      verses[String(ayahNumber)] = {
        from: Number(timestamp.timestamp_from),
        to: Number(timestamp.timestamp_to),
        segments: validSegments,
      };
    }

    if (Object.keys(verses).length !== targetData.ayahs.length) return null;
    return { audioUrl: file.audio_url, verses };
  }

  async function fetchChapterTiming(surahNumber, targetData) {
    const cacheKey = `${TIMING_CACHE_PREFIX}:${surahNumber}`;
    try {
      const cached = JSON.parse(window.localStorage.getItem(cacheKey) || "null");
      const normalized = normalizeChapterTiming(cached, targetData);
      if (normalized) return normalized;
    } catch (error) {
      // A stale timing cache should never block Quran practice.
    }

    try {
      const response = await fetch(CHAPTER_TIMING_API(surahNumber), {
        headers: { accept: "application/json" },
      });
      if (!response.ok) return null;
      const data = await response.json();
      const normalized = normalizeChapterTiming(data, targetData);
      if (!normalized) return null;
      try {
        window.localStorage.setItem(cacheKey, JSON.stringify(data.audio_file || data));
      } catch (error) {
        // Timing still works for this session when local storage is unavailable.
      }
      return normalized;
    } catch (error) {
      return null;
    }
  }

  function validateSurahData(data, expectedNumber) {
    const expectedCount = ayahCountFor(expectedNumber);
    const valid =
      data &&
      data.surah?.number === expectedNumber &&
      data.surah?.ayahCount === expectedCount &&
      Array.isArray(data.ayahs) &&
      data.ayahs.length === expectedCount &&
      data.ayahs.every(
        (ayah, index) =>
          ayah.number === index + 1 &&
          Array.isArray(ayah.words) &&
          ayah.words.length > 0 &&
          ayah.words.every(
            (word, wordIndex) =>
              word.position === wordIndex + 1 && typeof word.arabic === "string" && word.arabic.length > 0,
          ),
      );

    if (!valid) throw new Error(`Quran data for surah ${expectedNumber} failed validation`);
  }

  async function loadCurrentSurah() {
    const thisLoad = ++loadSequence;
    stopAudio();
    session = null;
    showScreen(elements.loading);
    updatePickerProgress();
    elements.title.textContent = "Preparing your practice";

    try {
      const [target, fatihah] = await Promise.all([fetchSurah(currentSurah), fetchSurah(1)]);
      if (thisLoad !== loadSequence) return;
      const timing = await fetchChapterTiming(currentSurah, target);
      if (thisLoad !== loadSequence) return;
      surahData = target;
      chapterTiming = timing;
      basmalaWords = fatihah.ayahs[0].words.map((word) => word.arabic);
      try {
        window.localStorage.setItem("miftah:memorize:last-surah", String(currentSurah));
      } catch (error) {
        // Remembering the selection is optional.
      }
      if (chapterTiming?.audioUrl) {
        guidedAudio.src = chapterTiming.audioUrl;
        guidedAudio.load();
      }
      elements.title.textContent = `${target.surah.englishName} · ${target.surah.name}`;
      startRecommendedTask();
    } catch (error) {
      if (thisLoad !== loadSequence) return;
      console.error(error);
      elements.errorCopy.textContent = "The checked Quran data could not be opened. Try again while this page is online.";
      showScreen(elements.error);
    }
  }

  function startRecommendedTask() {
    const progress = getProgress();
    const total = surahData.ayahs.length;
    const today = todayKey();

    if (progress.learned >= total) {
      if (progress.due && progress.due <= today) {
        startReview("scheduled", total);
      } else {
        showRestScreen(progress);
      }
      return;
    }

    if (progress.learned > 0 && progress.lastPractice !== today && progress.warmedOn !== today) {
      startReview("warm", progress.learned);
      return;
    }

    startNewAyah(progress.learned + 1);
  }

  function startNewAyah(ayahNumber) {
    stopAudio();
    session = {
      mode: "new",
      phase: "listen",
      ayahNumber,
      rangeStart: linkStartFor(ayahNumber),
      rangeEnd: ayahNumber,
      hadRetry: false,
      peekKeys: new Set(),
      signalKeys: new Set(),
    };
    showScreen(elements.practice);
    renderSession();
  }

  function startReview(mode, rangeEnd) {
    stopAudio();
    session = {
      mode,
      phase: "reviewAttempt",
      ayahNumber: rangeEnd,
      rangeStart: 1,
      rangeEnd,
      hadRetry: false,
      peekKeys: new Set(),
      signalKeys: new Set(),
    };
    showScreen(elements.practice);
    renderSession();
  }

  function linkStartFor(ayahNumber) {
    const total = surahData.ayahs.length;
    return total <= 10 ? 1 : Math.max(1, ayahNumber - 4);
  }

  function renderSession() {
    if (!session || !surahData) return;
    stopAudio();
    clearControls();
    renderStepState();
    renderSessionMeta();

    const renderers = {
      listen: renderListen,
      echo: renderEcho,
      chase: renderChase,
      recallAttempt: renderRecallAttempt,
      recallReveal: renderRecallReveal,
      drillChoice: renderDrillChoice,
      diagnose: renderDiagnose,
      repairListen: renderRepairListen,
      repairRecall: renderRepairRecall,
      repairReveal: renderRepairReveal,
      build: renderBuild,
      linkStudy: renderLinkStudy,
      linkAttempt: renderLinkAttempt,
      linkReveal: renderLinkReveal,
      reviewStudy: renderReviewStudy,
      reviewAttempt: renderReviewAttempt,
      reviewReveal: renderReviewReveal,
    };

    const renderer = renderers[session.phase];
    if (!renderer) throw new Error(`Unknown memorization phase: ${session.phase}`);
    renderer();
    animateScriptureCard();
  }

  function clearControls() {
    elements.audioButton.hidden = true;
    elements.audioButton.disabled = false;
    elements.audioStatus.textContent = "";
    elements.primaryAction.hidden = false;
    elements.selfCheck.hidden = true;
    elements.drillChoice.hidden = true;
    elements.peekNote.hidden = true;
    elements.meaningCue.hidden = true;
    elements.basmala.hidden = false;
  }

  function renderStepState() {
    const phase = session.phase;
    let activeIndex = 0;
    if (phase === "chase") activeIndex = 1;
    else if (
      phase.startsWith("recall") ||
      phase === "drillChoice" ||
      phase === "diagnose" ||
      phase.startsWith("repair") ||
      phase === "build"
    ) activeIndex = 2;
    else if (phase.startsWith("link")) activeIndex = 3;
    else if (phase.startsWith("review")) activeIndex = 4;

    elements.steps.forEach((step, index) => {
      step.classList.toggle("is-active", index === activeIndex);
      step.classList.toggle("is-complete", index < activeIndex);
    });
  }

  function renderSessionMeta() {
    const total = surahData.ayahs.length;
    const labels = {
      new: "New ayah",
      warm: "Recent review",
      scheduled: "Due review",
      free: "Full practice",
      finish: "Full-surah check",
    };
    elements.taskKind.textContent = labels[session.mode];
    elements.ayahReference.textContent =
      session.mode === "new"
        ? `${surahData.surah.englishName} ${session.ayahNumber} of ${total}`
        : `${surahData.surah.englishName} · Ayahs ${session.rangeStart} to ${session.rangeEnd}`;
  }

  function setInstruction(label, title, help) {
    elements.practiceLabel.textContent = label;
    elements.practiceTitle.textContent = title;
    elements.practiceHelp.textContent = help;
  }

  function setPrimary(label) {
    elements.primaryAction.textContent = label;
    elements.primaryAction.hidden = false;
  }

  function showAudio(label = "Listen") {
    elements.audioButton.hidden = false;
    elements.audioLabel.textContent = label;
  }

  function showSelfCheck({
    prompt = "Compare every word, ending, and order.",
    againLabel = "I hesitated",
    successLabel = "Clean recall",
  } = {}) {
    elements.primaryAction.hidden = true;
    elements.selfCheckPrompt.textContent = prompt;
    elements.againAction.textContent = againLabel;
    elements.successAction.textContent = successLabel;
    elements.selfCheck.hidden = false;
  }

  function renderListen() {
    setInstruction("Follow", "Watch each word meet the recitation.", "The highlight follows verified word timings. Repeat the ayah when it ends.");
    renderSingleAyah({ flow: true });
    showMeaningIfUseful();
    showAudio("Start word flow");
    setPrimary("I followed the flow");
  }

  function renderEcho() {
    setInstruction("Echo", "Read it aloud once more.", "Keep the pace steady. Notice the exact ending of every word.");
    renderSingleAyah({ flow: true });
    showMeaningIfUseful();
    showAudio("Follow again");
    setPrimary("Start word chase");
  }

  function renderChase() {
    setInstruction("Chase", "Keep reciting as the words vanish.", "A blank means the reciter has passed it. Tap only when you are truly stuck.");
    renderSingleAyah({ flow: true, peekable: true });
    elements.peekNote.textContent = "Every peek is remembered as a weak spot.";
    elements.peekNote.hidden = false;
    showAudio("Replay word chase");
    setPrimary("Recite without audio");
  }

  function renderRecallAttempt() {
    setInstruction("Recall", "Recite the ayah without looking.", "The first word is your only cue. Reveal when you finish.");
    renderSingleAyah({ hideAfterFirst: true, deep: true });
    setPrimary("Reveal and check");
  }

  function renderRecallReveal() {
    setInstruction("Check", "Compare what you said with the text.", "Be exact about every word, ending, and order.");
    renderSingleAyah();
    showMeaningIfUseful();
    showAudio("Hear the answer");
    showSelfCheck();
  }

  function renderDrillChoice() {
    setInstruction("Recover", "Choose how to rebuild the ayah.", "Both paths return to a full recitation from memory.");
    renderSingleAyah();
    elements.primaryAction.hidden = true;
    elements.buildChoice.hidden = false;
    elements.drillChoice.hidden = false;
  }

  function renderDiagnose() {
    setInstruction("Diagnose", "Tap the first word you could not reach.", "Miftah will rehearse the word before it, the weak word, and what follows.");
    const rangeStart = session.recoveryRangeStart || session.rangeStart || 1;
    const rangeEnd = session.recoveryRangeEnd || session.rangeEnd;
    if (rangeEnd > rangeStart || rangeStart !== session.ayahNumber) {
      renderRange(rangeStart, rangeEnd, { diagnostic: true });
    }
    else renderSingleAyah({ diagnostic: true });
    elements.primaryAction.hidden = true;
  }

  function renderRepairListen() {
    setInstruction("Repair", "Hear the weak bridge in context.", "Follow the highlight, then say the same short bridge aloud.");
    renderRepairChunk();
    showAudio("Hear this bridge");
    setPrimary("Hide this bridge");
  }

  function renderRepairRecall() {
    setInstruction("Repair", "Cross the bridge without help.", "Use its first word as a cue and retrieve the rest.");
    renderRepairChunk({ hideAfterFirst: true });
    setPrimary("Reveal bridge");
  }

  function renderRepairReveal() {
    setInstruction("Check", "Did the weak bridge arrive cleanly?", "A clear bridge returns you to the complete passage.");
    renderRepairChunk();
    showAudio("Hear this bridge");
    showSelfCheck({
      prompt: "Could you say this bridge without a peek?",
      againLabel: "Still shaky",
      successLabel: "Bridge is clear",
    });
  }

  function renderBuild() {
    setInstruction("Build", "Restore the ayah in its Quran order.", "Tap the next word. This repairs sequence, then you will recite without tiles.");
    renderBuildBoard();
    elements.audioButton.hidden = true;
    elements.primaryAction.hidden = !session.build?.complete;
    if (session.build?.complete) setPrimary("Try the full ayah again");
  }

  function renderLinkStudy() {
    setInstruction("Link", "Read the ayahs as one passage.", "Give extra attention to the joins between ayahs.");
    renderRange(session.rangeStart, session.rangeEnd);
    showAudio("Hear the passage");
    setPrimary("Try the link again");
  }

  function renderLinkAttempt() {
    setInstruction(
      "Link",
      `Start at ayah ${session.rangeStart} and recite through the new ayah.`,
      "Use only the opening word, then continue from memory.",
    );
    renderRange(session.rangeStart, session.rangeEnd, { hideAllButOpening: true, deep: true });
    setPrimary("Reveal and check");
  }

  function renderLinkReveal() {
    setInstruction("Check", "Check the complete chain.", "If one join broke, mark the first word you could not reach.");
    renderRange(session.rangeStart, session.rangeEnd);
    showAudio("Hear the passage");
    showSelfCheck();
  }

  function renderReviewStudy() {
    setInstruction("Return", "Rebuild the passage once.", "Read aloud with the full text, then try it hidden again.");
    renderRange(session.rangeStart, session.rangeEnd);
    showAudio("Hear the passage");
    setPrimary("Try from memory again");
  }

  function renderReviewAttempt() {
    setInstruction("Return", "Recite the passage before you look.", "Use the opening word, then retrieve the rest from memory.");
    renderRange(session.rangeStart, session.rangeEnd, { hideAllButOpening: true, deep: true });
    setPrimary("Reveal and check");
  }

  function renderReviewReveal() {
    setInstruction("Check", "Compare the full passage carefully.", "One honest retry is more useful than a generous score.");
    renderRange(session.rangeStart, session.rangeEnd);
    showAudio("Hear the passage");
    showSelfCheck();
  }

  function getAyah(number) {
    return surahData.ayahs[number - 1];
  }

  function renderSingleAyah(options = {}) {
    const ayah = getAyah(session.ayahNumber);
    renderBasmala();
    elements.ayahLines.className = "mh-ayah-lines";
    elements.ayahLines.replaceChildren(createAyahLine(ayah, options));
  }

  function renderRange(start, end, options = {}) {
    renderBasmala();
    elements.ayahLines.className = "mh-ayah-lines is-range";
    const fragment = document.createDocumentFragment();

    for (let number = start; number <= end; number += 1) {
      const ayah = getAyah(number);
      let hiddenIndices = options.hiddenIndices;
      if (options.hideAllButOpening) {
        hiddenIndices = new Set(ayah.words.map((_, index) => index));
        if (number === start) hiddenIndices.delete(0);
      }
      fragment.append(
        createAyahLine(ayah, {
          hiddenIndices,
          deep: options.deep,
          peekable: options.peekable,
          diagnostic: options.diagnostic,
          flow: options.flow,
        }),
      );
    }

    elements.ayahLines.replaceChildren(fragment);
  }

  function renderBasmala() {
    elements.basmala.hidden = false;
    elements.basmala.textContent = basmalaWords.join(" ");
  }

  function createAyahLine(ayah, options = {}) {
    const line = document.createElement("p");
    line.className = "mh-ayah-line";
    line.dataset.ayah = String(ayah.number);
    const hiddenIndices = options.hideAfterFirst
      ? new Set(ayah.words.map((_, index) => index).filter((index) => index > 0))
      : options.hiddenIndices || new Set();

    ayah.words.forEach((word, index) => {
      const wordElement = document.createElement("span");
      wordElement.className = "mh-word";
      wordElement.textContent = word.arabic;
      wordElement.dataset.ayah = String(ayah.number);
      wordElement.dataset.word = String(index);
      if (options.flow) wordElement.classList.add("is-flow-word");
      if (options.diagnostic) {
        wordElement.classList.add("is-diagnostic-word");
        wordElement.dataset.diagnostic = "true";
        wordElement.tabIndex = 0;
        wordElement.setAttribute("role", "button");
        wordElement.setAttribute("aria-label", `Mark word ${index + 1} of ayah ${ayah.number} as the weak spot`);
      }
      if (options.peekable) {
        wordElement.dataset.peekable = "true";
        wordElement.tabIndex = 0;
        wordElement.setAttribute("role", "button");
        wordElement.setAttribute("aria-label", `Peek at word ${index + 1} of ayah ${ayah.number}`);
      }
      if (hiddenIndices.has(index)) {
        wordElement.classList.add("is-hidden");
        if (options.deep) wordElement.classList.add("is-deep-hidden");
        if (!options.peekable) {
          wordElement.setAttribute("aria-hidden", "true");
        }
      }
      line.append(wordElement, document.createTextNode(" "));
    });

    const marker = document.createElement("span");
    marker.className = "mh-ayah-mark";
    marker.textContent = toArabicDigits(ayah.number);
    marker.setAttribute("aria-label", `Ayah ${ayah.number}`);
    line.append(marker);
    return line;
  }

  function renderRepairChunk({ hideAfterFirst = false } = {}) {
    elements.basmala.hidden = true;
    elements.ayahLines.className = "mh-ayah-lines is-repair";
    const strip = document.createElement("div");
    strip.className = "mh-repair-strip";
    let previousAyah = null;

    session.repair.tokens.forEach((token, index) => {
      if (previousAyah !== null && token.ayahNumber !== previousAyah) {
        const join = document.createElement("span");
        join.className = "mh-repair-join";
        join.textContent = "۝";
        join.setAttribute("aria-label", `Join into ayah ${token.ayahNumber}`);
        strip.append(join);
      }
      const wordElement = document.createElement("span");
      wordElement.className = "mh-repair-word";
      wordElement.textContent = token.word.arabic;
      wordElement.dataset.ayah = String(token.ayahNumber);
      wordElement.dataset.word = String(token.wordIndex);
      if (token.ayahNumber === session.repair.target.ayahNumber && token.wordIndex === session.repair.target.wordIndex) {
        wordElement.classList.add("is-repair-target");
      }
      if (hideAfterFirst && index > 0) {
        wordElement.classList.add("is-hidden");
        wordElement.setAttribute("aria-hidden", "true");
      }
      strip.append(wordElement);
      previousAyah = token.ayahNumber;
    });
    elements.ayahLines.replaceChildren(strip);
  }

  function shuffledWordOrder(wordCount, seed) {
    const order = Array.from({ length: wordCount }, (_, index) => index);
    let state = seed || 1;
    for (let index = order.length - 1; index > 0; index -= 1) {
      state = (state * 1664525 + 1013904223) >>> 0;
      const target = state % (index + 1);
      [order[index], order[target]] = [order[target], order[index]];
    }
    if (order.every((value, index) => value === index) && order.length > 1) order.push(order.shift());
    return order;
  }

  function renderBuildBoard() {
    const ayah = getAyah(session.build.ayahNumber);
    elements.basmala.hidden = true;
    elements.ayahLines.className = "mh-ayah-lines is-build";
    const board = document.createElement("div");
    board.className = "mh-build-board";
    board.dir = "rtl";

    const answer = document.createElement("div");
    answer.className = "mh-build-answer";
    answer.setAttribute("aria-label", "Built ayah");
    ayah.words.forEach((word, index) => {
      const slot = document.createElement("span");
      slot.className = "mh-build-slot";
      if (index < session.build.nextIndex) {
        slot.classList.add("is-filled");
        slot.textContent = word.arabic;
      } else {
        slot.textContent = "· · ·";
        slot.setAttribute("aria-label", `Empty word slot ${index + 1}`);
      }
      answer.append(slot);
    });

    const status = document.createElement("p");
    status.className = "mh-build-status";
    status.dir = "ltr";
    status.setAttribute("aria-live", "polite");
    status.textContent = session.build.complete
      ? "Ayah restored. Now retrieve it without tiles."
      : `${session.build.nextIndex} of ${ayah.words.length} words placed`;

    const bank = document.createElement("div");
    bank.className = "mh-build-bank";
    bank.setAttribute("aria-label", "Available Quran words");
    for (const wordIndex of session.build.order) {
      if (wordIndex < session.build.nextIndex) continue;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mh-build-word";
      button.lang = "ar";
      button.textContent = ayah.words[wordIndex].arabic;
      button.dataset.buildWord = String(wordIndex);
      button.setAttribute("aria-label", `Place ${ayah.words[wordIndex].arabic}`);
      bank.append(button);
    }

    board.append(answer, status, bank);
    elements.ayahLines.replaceChildren(board);
  }

  function toArabicDigits(number) {
    const digits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
    return String(number)
      .split("")
      .map((digit) => digits[Number(digit)])
      .join("");
  }

  function showMeaningIfUseful() {
    if (!MEANING_CUE_SURAHS.has(currentSurah) || session.mode !== "new") return;
    elements.meaningText.textContent = getAyah(session.ayahNumber).translation;
    elements.meaningCue.hidden = false;
  }

  function animateScriptureCard() {
    if (reducedMotion.matches || typeof elements.scriptureCard.animate !== "function") return;
    for (const animation of elements.scriptureCard.getAnimations()) animation.cancel();
    const animation = elements.scriptureCard.animate(
      [
        { opacity: 0.78, transform: "translateY(4px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 180, easing: "cubic-bezier(.2,.8,.2,1)" },
    );
    animation.addEventListener("finish", () => animation.cancel(), { once: true });
  }

  function advancePrimaryAction() {
    if (!session) return;
    const transitions = {
      listen: "echo",
      echo: "chase",
      chase: "recallAttempt",
      recallAttempt: "recallReveal",
      repairListen: "repairRecall",
      repairRecall: "repairReveal",
      linkStudy: "linkAttempt",
      linkAttempt: "linkReveal",
      reviewStudy: "reviewAttempt",
      reviewAttempt: "reviewReveal",
    };

    const enteringChase = session.phase === "echo";
    if (session.phase === "build") {
      if (!session.build?.complete) return;
      session.phase = session.recoveryReturn || "recallAttempt";
    } else {
      session.phase = transitions[session.phase];
    }

    if (!session.phase) throw new Error("This practice step has no next action");
    renderSession();
    if (enteringChase) startGuidedPlayback({ fade: true });
  }

  function handleAgain() {
    if (!session) return;
    session.hadRetry = true;
    if (session.phase === "recallReveal") {
      session.recoveryReturn = "recallAttempt";
      session.recoveryRangeStart = session.ayahNumber;
      session.recoveryRangeEnd = session.ayahNumber;
      session.phase = "drillChoice";
    } else if (session.phase === "linkReveal") {
      session.recoveryReturn = "linkAttempt";
      session.recoveryRangeStart = session.rangeStart;
      session.recoveryRangeEnd = session.rangeEnd;
      session.phase = "diagnose";
    } else if (session.phase === "reviewReveal") {
      session.recoveryReturn = "reviewAttempt";
      session.recoveryRangeStart = session.rangeStart;
      session.recoveryRangeEnd = session.rangeEnd;
      session.phase = "diagnose";
    } else if (session.phase === "repairReveal") {
      session.phase = "repairListen";
    }
    renderSession();
    if (session.phase === "repairListen") startRepairPlayback();
  }

  function handleSuccess() {
    if (!session) return;
    if (session.phase === "repairReveal") {
      softenWeakSpot(session.repair.target.ayahNumber, session.repair.target.wordIndex, 2);
      session.phase = session.recoveryReturn || "recallAttempt";
      renderSession();
      return;
    }

    if (session.phase === "recallReveal") {
      if (session.ayahNumber > 1) {
        session.phase = "linkAttempt";
        renderSession();
      } else {
        completeNewAyah();
      }
      return;
    }

    if (session.phase === "linkReveal") {
      if (session.ayahNumber >= surahData.ayahs.length) startFinalCheck();
      else completeNewAyah();
      return;
    }

    if (session.phase === "reviewReveal") {
      if (session.mode === "finish") completeNewAyah();
      else completeReview();
    }
  }

  function startFinalCheck() {
    session.mode = "finish";
    session.phase = "reviewAttempt";
    session.rangeStart = 1;
    session.rangeEnd = surahData.ayahs.length;
    session.recoveryRangeStart = 1;
    session.recoveryRangeEnd = surahData.ayahs.length;
    renderSession();
  }

  function recoveryTokens() {
    const start = session.recoveryRangeStart || session.rangeStart || session.ayahNumber;
    const end = session.recoveryRangeEnd || session.ayahNumber;
    const tokens = [];
    for (let ayahNumber = start; ayahNumber <= end; ayahNumber += 1) {
      getAyah(ayahNumber).words.forEach((word, wordIndex) => {
        tokens.push({ ayahNumber, wordIndex, word });
      });
    }
    return tokens;
  }

  function chooseBreakdown(ayahNumber, wordIndex) {
    const tokens = recoveryTokens();
    const targetIndex = tokens.findIndex(
      (token) => token.ayahNumber === ayahNumber && token.wordIndex === wordIndex,
    );
    if (targetIndex < 0) return;
    recordSignal(ayahNumber, wordIndex, "hesitation");
    session.repair = {
      target: { ayahNumber, wordIndex },
      tokens: tokens.slice(Math.max(0, targetIndex - 1), Math.min(tokens.length, targetIndex + 2)),
    };
    session.phase = "repairListen";
    renderSession();
    startRepairPlayback();
  }

  function startBuild(ayahNumber) {
    const ayah = getAyah(ayahNumber);
    session.build = {
      ayahNumber,
      nextIndex: 0,
      complete: false,
      misses: new Set(),
      order: shuffledWordOrder(ayah.words.length, currentSurah * 1000 + ayahNumber * 37),
    };
    session.phase = "build";
    renderSession();
  }

  function handleBuildWord(button) {
    if (!session?.build || session.build.complete) return;
    const selected = Number(button.dataset.buildWord);
    const expected = session.build.nextIndex;
    if (selected !== expected) {
      button.classList.add("is-wrong");
      window.setTimeout(() => button.classList.remove("is-wrong"), 420);
      if (!session.build.misses.has(expected)) {
        session.build.misses.add(expected);
        recordSignal(session.build.ayahNumber, expected, "buildMiss");
      }
      const status = elements.ayahLines.querySelector(".mh-build-status");
      if (status) status.textContent = "That word comes later. Find the next word in the ayah.";
      return;
    }

    session.build.nextIndex += 1;
    session.build.complete = session.build.nextIndex >= getAyah(session.build.ayahNumber).words.length;
    renderBuildBoard();
    if (session.build.complete) setPrimary("Try the full ayah again");
  }

  function completeNewAyah() {
    const today = todayKey();
    const total = surahData.ayahs.length;
    const progress = getProgress();
    const peekCount = session.peekKeys?.size || 0;
    progress.learned = Math.max(progress.learned, session.ayahNumber);
    progress.lastPractice = today;
    progress.warmedOn = today;

    if (progress.learned >= total) {
      progress.completedAt = progress.completedAt || today;
      progress.reviewIndex = 0;
      progress.due = addDays(today, REVIEW_INTERVALS[0]);
      saveProgress(progress);
      showRestScreen(progress, {
        title: "The full surah is linked.",
        copy: `You recalled all ${total} ayahs. Let them settle, then return ${formatDate(progress.due)}.`,
      });
      return;
    }

    saveProgress(progress);
    session = null;
    elements.pauseKicker.textContent = `Ayah ${progress.learned} linked`;
    elements.pauseTitle.textContent = "A steady step forward.";
    const linkedCopy =
      progress.learned === 1
        ? "Ayah 1 is ready to retrieve. Continue while it feels light, or return tomorrow."
        : `Ayahs 1 to ${progress.learned} now travel together. Continue while it feels light, or return tomorrow.`;
    elements.pauseCopy.textContent = peekCount
      ? `${linkedCopy} Miftah saved ${peekCount} ${peekCount === 1 ? "peek" : "peeks"} as a weak spot.`
      : linkedCopy;
    elements.continueSession.textContent = `Learn ayah ${progress.learned + 1}`;
    showScreen(elements.pause);
  }

  function completeReview() {
    const progress = getProgress();
    const today = todayKey();
    const completedMode = session.mode;
    progress.lastPractice = today;
    if (!session.hadRetry) softenRangeWeakSpots(progress, session.rangeEnd);

    if (completedMode === "warm") {
      progress.warmedOn = today;
      saveProgress(progress);
      startNewAyah(progress.learned + 1);
      return;
    }

    if (completedMode === "scheduled") {
      const weakScore = unresolvedWeakScore(progress);
      if (session.hadRetry) progress.reviewIndex = Math.max(progress.reviewIndex - 1, 0);
      else if (weakScore < 4) progress.reviewIndex = Math.min(progress.reviewIndex + 1, REVIEW_INTERVALS.length - 1);
      progress.due = addDays(today, REVIEW_INTERVALS[progress.reviewIndex]);
      saveProgress(progress);
      showRestScreen(progress, {
        title: "Review complete.",
        copy: `You retrieved the full surah today. Your next return is ${formatDate(progress.due)}.`,
      });
      return;
    }

    saveProgress(progress);
    showRestScreen(progress, {
      title: "Full practice complete.",
      copy: progress.due
        ? `Your scheduled review remains ${formatDate(progress.due)}.`
        : "Come back tomorrow for another recall.",
    });
  }

  function showRestScreen(progress, override = {}) {
    stopAudio();
    session = null;
    const weakCount = unresolvedWeakSpotCount(progress);
    const weakCopy = weakCount
      ? ` Miftah is holding ${weakCount} weak ${weakCount === 1 ? "spot" : "spots"} for the next repair.`
      : "";
    const defaultCopy = progress.due
      ? `Your next recall is ${formatDate(progress.due)}. You can still practice the full surah now.`
      : "The surah is linked. A short return tomorrow will strengthen it.";
    elements.restTitle.textContent = override.title || "This surah is resting.";
    elements.restCopy.textContent = `${override.copy || defaultCopy}${weakCopy}`;
    showScreen(elements.rest);
  }

  function audioUrl(surahNumber, ayahNumber) {
    const surah = String(surahNumber).padStart(3, "0");
    const ayah = String(ayahNumber).padStart(3, "0");
    return `${RECITER_BASE_URL}/${surah}${ayah}.mp3`;
  }

  function currentAudioRange() {
    if (!session) return [];
    if (session.phase.startsWith("link") || session.phase.startsWith("review")) {
      return Array.from(
        { length: session.rangeEnd - session.rangeStart + 1 },
        (_, index) => session.rangeStart + index,
      );
    }
    return [session.ayahNumber];
  }

  function timedTokensForAyah(ayahNumber) {
    const timing = chapterTiming?.verses[String(ayahNumber)];
    if (!timing) return null;
    const ayah = getAyah(ayahNumber);
    return timing.segments.map(([position, start, end]) => ({
      ayahNumber,
      wordIndex: position - 1,
      word: ayah.words[position - 1],
      start,
      end,
    }));
  }

  function estimatedWordIndex(ayah, currentTime, duration) {
    if (!Number.isFinite(duration) || duration <= 0) return 0;
    const weights = ayah.words.map(
      (word) => word.arabic.normalize("NFD").replace(/\p{M}/gu, "").replace(/ـ/g, "").length + 2,
    );
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    const position = Math.min(currentTime / duration + 0.035, 1);
    let accumulated = 0;
    for (let index = 0; index < weights.length; index += 1) {
      accumulated += weights[index] / total;
      if (position <= accumulated) return index;
    }
    return weights.length - 1;
  }

  function startGuidedPlayback({ fade = false, ayahNumber = session.ayahNumber } = {}) {
    stopAudio();
    const timing = chapterTiming?.verses[String(ayahNumber)];
    const tokens = timedTokensForAyah(ayahNumber);
    if (timing && tokens) {
      if (guidedAudio.src !== chapterTiming.audioUrl) {
        guidedAudio.src = chapterTiming.audioUrl;
        guidedAudio.load();
      }
      beginGuidedPlayback({
        phase: session.phase,
        fade,
        tokens,
        startMs: timing.from,
        endMs: timing.to,
        estimatedAyah: null,
      });
      return;
    }

    guidedAudio.src = audioUrl(currentSurah, ayahNumber);
    beginGuidedPlayback({
      phase: session.phase,
      fade,
      tokens: getAyah(ayahNumber).words.map((word, wordIndex) => ({ ayahNumber, wordIndex, word })),
      startMs: 0,
      endMs: null,
      estimatedAyah: getAyah(ayahNumber),
    });
  }

  function startRepairPlayback() {
    if (!session?.repair) return;
    stopAudio();
    const timedTokens = session.repair.tokens.map((token) => {
      const timing = chapterTiming?.verses[String(token.ayahNumber)];
      const segment = timing?.segments.find(([position]) => position === token.wordIndex + 1);
      return segment ? { ...token, start: segment[1], end: segment[2] } : null;
    });

    if (timedTokens.every(Boolean) && chapterTiming?.audioUrl) {
      if (guidedAudio.src !== chapterTiming.audioUrl) {
        guidedAudio.src = chapterTiming.audioUrl;
        guidedAudio.load();
      }
      beginGuidedPlayback({
        phase: session.phase,
        fade: false,
        tokens: timedTokens,
        startMs: timedTokens[0].start,
        endMs: timedTokens[timedTokens.length - 1].end,
        estimatedAyah: null,
      });
      return;
    }

    elements.audioStatus.textContent = "Precise bridge timing is unavailable. Playing the full ayah instead.";
    startGuidedPlayback({ fade: false, ayahNumber: session.repair.target.ayahNumber });
  }

  function beginGuidedPlayback(playback) {
    guidedPlayback = playback;
    elements.audioButton.classList.add("is-playing");
    elements.audioLabel.textContent = "Pause";
    elements.audioStatus.textContent = playback.fade
      ? "Chase the highlight. Passed words will disappear."
      : playback.phase === "repairListen"
        ? "Playing only the weak bridge."
        : "Following the reciter word by word.";

    const seekToStart = () => {
      if (guidedPlayback !== playback) return;
      try {
        guidedAudio.currentTime = playback.startMs / 1000;
      } catch (error) {
        finishGuidedPlayback("Audio is unavailable. Read the visible words aloud once.");
      }
    };

    if (guidedAudio.readyState >= HTMLMediaElement.HAVE_METADATA) seekToStart();
    else guidedAudio.addEventListener("loadedmetadata", seekToStart, { once: true });
    guidedAudio.play().then(runGuidedFrame).catch(() => {
      finishGuidedPlayback("Audio is unavailable. Read the visible words aloud once.");
    });
  }

  function runGuidedFrame() {
    if (!guidedPlayback || guidedAudio.paused) return;
    const currentMs = guidedAudio.currentTime * 1000;
    if (guidedPlayback.endMs && currentMs >= guidedPlayback.endMs - 20) {
      finishGuidedPlayback();
      return;
    }

    let currentIndex = 0;
    if (guidedPlayback.estimatedAyah) {
      currentIndex = estimatedWordIndex(
        guidedPlayback.estimatedAyah,
        guidedAudio.currentTime,
        guidedAudio.duration,
      );
    } else {
      for (let index = 0; index < guidedPlayback.tokens.length; index += 1) {
        if (currentMs >= guidedPlayback.tokens[index].start) currentIndex = index;
        else break;
      }
    }
    paintGuidedWords(currentIndex);
    guidedFrame = window.requestAnimationFrame(runGuidedFrame);
  }

  function paintGuidedWords(currentIndex) {
    if (!guidedPlayback) return;
    const renderedWords = elements.ayahLines.querySelectorAll("[data-ayah][data-word]");
    renderedWords.forEach((word) => {
      word.classList.remove("is-flow-current", "is-flow-past", "is-flow-vanished");
      word.removeAttribute("aria-current");
    });

    guidedPlayback.tokens.forEach((token, index) => {
      const word = elements.ayahLines.querySelector(
        `[data-ayah="${token.ayahNumber}"][data-word="${token.wordIndex}"]`,
      );
      if (!word) return;
      if (index === currentIndex) {
        word.classList.remove("is-flow-past", "is-flow-vanished");
        word.classList.add("is-flow-current");
        word.setAttribute("aria-current", "true");
      } else if (index < currentIndex && !word.classList.contains("is-flow-current")) {
        word.classList.add(guidedPlayback.fade ? "is-flow-vanished" : "is-flow-past");
      }
    });
  }

  function pauseGuidedPlayback() {
    guidedAudio.pause();
    window.cancelAnimationFrame(guidedFrame);
    elements.audioLabel.textContent = "Resume";
    elements.audioStatus.textContent = "Paused at the current word.";
  }

  function resumeGuidedPlayback() {
    elements.audioLabel.textContent = "Pause";
    elements.audioStatus.textContent = "Continuing from the current word.";
    guidedAudio.play().then(runGuidedFrame).catch(() => {
      finishGuidedPlayback("Audio is unavailable. Continue aloud without it.");
    });
  }

  function finishGuidedPlayback(message = "") {
    guidedAudio.pause();
    window.cancelAnimationFrame(guidedFrame);
    const finished = guidedPlayback;
    if (finished?.fade) {
      elements.ayahLines.querySelectorAll(".is-flow-word").forEach((word) => {
        word.classList.remove("is-flow-current", "is-flow-past");
        word.classList.add("is-flow-vanished");
      });
    } else if (finished) {
      paintGuidedWords(finished.tokens.length);
    }
    guidedPlayback = null;
    elements.audioButton.classList.remove("is-playing");
    if (finished?.phase === "chase") elements.audioLabel.textContent = "Replay word chase";
    else if (finished?.phase === "repairListen") elements.audioLabel.textContent = "Hear this bridge";
    else elements.audioLabel.textContent = "Follow again";
    elements.audioStatus.textContent =
      message ||
      (finished?.fade
        ? "The page is blank. Say the ayah once without the reciter."
        : finished?.phase === "repairListen"
          ? "Now say the same bridge aloud."
          : "Flow complete. Echo the ayah aloud.");
  }

  function toggleAudio() {
    if (guidedPlayback) {
      if (guidedAudio.paused) resumeGuidedPlayback();
      else pauseGuidedPlayback();
      return;
    }
    if (session?.phase === "listen" || session?.phase === "chase") {
      startGuidedPlayback({ fade: session.phase === "chase" });
      return;
    }
    if (session?.phase === "repairListen" || session?.phase === "repairReveal") {
      startRepairPlayback();
      return;
    }
    if (!audio.paused) {
      stopAudio();
      return;
    }

    audioQueue = currentAudioRange();
    audioQueueIndex = 0;
    if (!audioQueue.length) return;
    elements.audioStatus.textContent = audioQueue.length > 1 ? "Playing the linked passage..." : "Playing ayah...";
    playQueuedAyah();
  }

  async function playQueuedAyah() {
    const ayahNumber = audioQueue[audioQueueIndex];
    if (!ayahNumber) {
      finishAudio();
      return;
    }

    audio.src = audioUrl(currentSurah, ayahNumber);
    elements.audioButton.classList.add("is-playing");
    elements.audioLabel.textContent = "Stop";
    try {
      await audio.play();
    } catch (error) {
      finishAudio("Audio is unavailable. Read the passage aloud once.");
    }
  }

  function stopAudio() {
    audio.pause();
    guidedAudio.pause();
    window.cancelAnimationFrame(guidedFrame);
    guidedPlayback = null;
    audioQueue = [];
    audioQueueIndex = 0;
    elements.audioButton.classList.remove("is-playing");
    if (!elements.audioButton.hidden) elements.audioLabel.textContent = "Listen";
    elements.audioStatus.textContent = "";
  }

  function finishAudio(message = "") {
    audio.pause();
    audioQueue = [];
    audioQueueIndex = 0;
    elements.audioButton.classList.remove("is-playing");
    elements.audioLabel.textContent = "Listen";
    elements.audioStatus.textContent = message;
  }

  function peekAtWord(wordElement) {
    if (wordElement.dataset.peekable !== "true") return;
    wordElement.classList.add("is-peeking");
    const ayahNumber = Number(wordElement.dataset.ayah);
    const wordIndex = Number(wordElement.dataset.word);
    const key = `${ayahNumber}:${wordIndex + 1}`;
    if (!session.peekKeys.has(key)) {
      session.peekKeys.add(key);
      recordSignal(ayahNumber, wordIndex, "peek");
      elements.audioStatus.textContent = "Peek saved. This word can return in a repair drill.";
    }
    window.setTimeout(() => wordElement.classList.remove("is-peeking"), 1100);
  }

  function chooseSurah(surahNumber) {
    if (!SUPPORTED_SURAHS.includes(surahNumber)) return;
    if (surahNumber === currentSurah) {
      if (elements.catalogDialog.open) elements.catalogDialog.close();
      return;
    }
    currentSurah = surahNumber;
    try {
      window.localStorage.setItem("miftah:memorize:last-surah", String(surahNumber));
    } catch (error) {
      // The active session still works without the preference.
    }
    const url = new URL(window.location.href);
    url.searchParams.set("surah", String(surahNumber));
    window.history.replaceState({}, "", url);
    if (elements.catalogDialog.open) elements.catalogDialog.close();
    elements.catalogSearch.value = "";
    renderSurahCatalog();
    loadCurrentSurah();
  }

  elements.primaryAction.addEventListener("click", advancePrimaryAction);
  elements.againAction.addEventListener("click", handleAgain);
  elements.successAction.addEventListener("click", handleSuccess);
  elements.audioButton.addEventListener("click", toggleAudio);
  elements.repairChoice.addEventListener("click", () => {
    if (!session) return;
    session.phase = "diagnose";
    renderSession();
  });
  elements.buildChoice.addEventListener("click", () => {
    if (session) startBuild(session.ayahNumber);
  });
  elements.retryLoad.addEventListener("click", () => {
    if (!surahManifest.length) {
      initialize();
      return;
    }
    dataCache.delete(currentSurah);
    dataCache.delete(1);
    loadCurrentSurah();
  });
  elements.continueSession.addEventListener("click", startRecommendedTask);
  elements.freePractice.addEventListener("click", () => startReview("free", surahData.ayahs.length));
  elements.resetProgress.addEventListener("click", () => {
    const confirmed = window.confirm(`Reset all memorization progress for ${surahData.surah.englishName}?`);
    if (!confirmed) return;
    delete progressStore.surahs[String(currentSurah)];
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progressStore));
      storageAvailable = true;
    } catch (error) {
      storageAvailable = false;
    }
    updatePickerProgress();
    updateStorageNote();
    startRecommendedTask();
  });

  elements.catalogButton.addEventListener("click", () => {
    if (typeof elements.catalogDialog.showModal === "function") {
      elements.catalogDialog.showModal();
      window.requestAnimationFrame(() => elements.catalogSearch.focus());
    } else {
      elements.catalogDialog.setAttribute("open", "");
    }
  });
  elements.catalogDialog.addEventListener("click", (event) => {
    if (event.target === elements.catalogDialog) elements.catalogDialog.close();
  });
  elements.catalogDialog.addEventListener("close", () => {
    elements.catalogSearch.value = "";
    renderSurahCatalog();
    elements.catalogButton.focus();
  });
  elements.catalogSearch.addEventListener("input", () => renderSurahCatalog(elements.catalogSearch.value));
  elements.catalogList.addEventListener("click", (event) => {
    const choice = event.target.closest(".mh-catalog-item[data-surah]");
    if (choice) chooseSurah(Number(choice.dataset.surah));
  });

  elements.ayahLines.addEventListener("click", (event) => {
    const buildWord = event.target.closest("[data-build-word]");
    if (buildWord) {
      handleBuildWord(buildWord);
      return;
    }
    const diagnosticWord = event.target.closest(".mh-word[data-diagnostic='true']");
    if (diagnosticWord) {
      chooseBreakdown(Number(diagnosticWord.dataset.ayah), Number(diagnosticWord.dataset.word));
      return;
    }
    const word = event.target.closest(".mh-word[data-peekable='true']");
    if (word) peekAtWord(word);
  });
  elements.ayahLines.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const diagnosticWord = event.target.closest(".mh-word[data-diagnostic='true']");
    if (diagnosticWord) {
      event.preventDefault();
      chooseBreakdown(Number(diagnosticWord.dataset.ayah), Number(diagnosticWord.dataset.word));
      return;
    }
    const word = event.target.closest(".mh-word[data-peekable='true']");
    if (!word) return;
    event.preventDefault();
    peekAtWord(word);
  });

  audio.addEventListener("ended", () => {
    audioQueueIndex += 1;
    if (audioQueueIndex < audioQueue.length) playQueuedAyah();
    else finishAudio();
  });
  audio.addEventListener("error", () => {
    if (audioQueue.length) finishAudio("Audio is unavailable. Read the passage aloud once.");
  });
  guidedAudio.addEventListener("ended", () => {
    if (guidedPlayback) finishGuidedPlayback();
  });
  guidedAudio.addEventListener("error", () => {
    if (guidedPlayback) finishGuidedPlayback("Audio is unavailable. Read the visible words aloud once.");
  });

  async function initialize() {
    try {
      surahManifest = await fetchManifest();
      shortSurahs = surahManifest
        .filter((entry) => SUPPORTED_SURAHS.includes(entry.number))
        .sort((a, b) => b.number - a.number);
      if (shortSurahs.length !== SUPPORTED_SURAHS.length) {
        throw new Error("The complete Juz Amma catalog is unavailable");
      }
      renderSurahCatalog();
      updateStorageNote();
      loadCurrentSurah();
    } catch (error) {
      console.error(error);
      elements.errorCopy.textContent = "The checked short-surah library could not be opened. Try again while this page is online.";
      showScreen(elements.error);
    }
  }

  initialize();
})();
