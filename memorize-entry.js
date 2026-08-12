(() => {
  "use strict";

  const FIRST_SHORT_SURAH = 78;
  const LAST_SHORT_SURAH = 114;
  const STORAGE_KEY = "miftah:memorize:v1";
  const LAST_SURAH_KEY = "miftah:memorize:last-surah";
  const action = document.querySelector("#memorize-module-action");
  const actionLabel = document.querySelector("#memorize-module-action-label");
  const status = document.querySelector("#memorize-module-status");
  const fill = document.querySelector("#memorize-module-fill");

  if (!action || !actionLabel || !status || !fill) return;

  function readStore() {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
      return parsed?.version === 1 && parsed.surahs ? parsed.surahs : {};
    } catch (error) {
      return {};
    }
  }

  function rememberedSurah() {
    try {
      const number = Number(window.localStorage.getItem(LAST_SURAH_KEY));
      if (number >= FIRST_SHORT_SURAH && number <= LAST_SHORT_SURAH) return number;
    } catch (error) {
      // The module still has a useful default when preferences are blocked.
    }
    return LAST_SHORT_SURAH;
  }

  async function initializeEntry() {
    try {
      const response = await fetch("data/surahs.json", { cache: "no-cache" });
      if (!response.ok) return;
      const manifest = await response.json();
      const shortSurahs = manifest.surahs.filter(
        (surah) => surah.number >= FIRST_SHORT_SURAH && surah.number <= LAST_SHORT_SURAH,
      );
      if (shortSurahs.length !== LAST_SHORT_SURAH - FIRST_SHORT_SURAH + 1) return;

      const store = readStore();
      const completed = shortSurahs.filter((surah) => {
        const learned = Number(store[String(surah.number)]?.learned) || 0;
        return learned >= surah.ayahCount;
      }).length;
      const learnedAyahs = shortSurahs.reduce(
        (sum, surah) => sum + Math.min(Number(store[String(surah.number)]?.learned) || 0, surah.ayahCount),
        0,
      );
      const totalAyahs = shortSurahs.reduce((sum, surah) => sum + surah.ayahCount, 0);
      const selectedNumber = rememberedSurah();
      const selected = shortSurahs.find((surah) => surah.number === selectedNumber) || shortSurahs.at(-1);
      const selectedProgress = Number(store[String(selected.number)]?.learned) || 0;

      action.href = `memorize.html?surah=${selected.number}`;
      actionLabel.textContent = selectedProgress > 0 ? `Continue ${selected.englishName}` : `Begin with ${selected.englishName}`;
      status.textContent = completed > 0
        ? `${completed} of ${shortSurahs.length} surahs linked · ${learnedAyahs} ayahs recalled`
        : `${shortSurahs.length} surahs ready · progress stays on this device`;
      fill.style.width = `${Math.round((learnedAyahs / totalAyahs) * 100)}%`;
    } catch (error) {
      // The static entry remains fully usable if its progress enhancement fails.
    }
  }

  initializeEntry();
})();
