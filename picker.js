"use strict";

// Home screen: lists the surahs from data/surahs.json. A surah unlocks only
// once the one before it (in manifest order) is fully completed in the trainer.

const MANIFEST_FILE = "data/surahs.json";

const els = {
  loading: document.getElementById("loading"),
  list: document.getElementById("surah-list"),
  tpl: document.getElementById("surah-card-template"),
  sources: document.getElementById("sources"),
};

const progressKey = (n) => `quran-trainer:surah-${n}:progress`;

function surahProgress(number) {
  try {
    const raw = localStorage.getItem(progressKey(number));
    if (!raw) return { passed: 0 };
    const d = JSON.parse(raw);
    return { passed: Number.isInteger(d.passed) ? d.passed : 0 };
  } catch {
    return { passed: 0 };
  }
}

function renderCard(surah, { passed, completed, unlocked, prevName }) {
  const card = els.tpl.content.firstElementChild.cloneNode(true);
  card.querySelector(".surah-card-num").textContent = surah.number;
  card.querySelector(".surah-card-en").textContent = surah.englishName;
  card.querySelector(".surah-card-ar").textContent = surah.name;

  const meta = card.querySelector(".surah-card-meta");
  const fill = card.querySelector(".surah-card-fill");
  const actions = card.querySelector(".surah-card-actions");
  const pct = Math.min(100, Math.round((passed / surah.ayahCount) * 100));
  fill.style.width = pct + "%";

  if (!unlocked) {
    card.classList.add("locked");
    card.setAttribute("aria-disabled", "true");
    meta.textContent = `${surah.englishTranslation} · ${surah.ayahCount} ayahs`;
    const lock = document.createElement("span");
    lock.className = "card-state lock";
    lock.textContent = "🔒 Locked";
    actions.appendChild(lock);
    const why = document.createElement("span");
    why.className = "card-sub";
    why.textContent = prevName ? `Finish ${prevName} to unlock` : "Locked";
    actions.appendChild(why);
    return card;
  }

  const trainerHref = `trainer.html?surah=${surah.number}`;
  card.classList.add("unlocked");
  card.tabIndex = 0;
  const go = () => (window.location.href = trainerHref);
  card.addEventListener("click", go);
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      go();
    }
  });

  if (completed) {
    card.classList.add("completed");
    meta.textContent = `${surah.englishTranslation} · ${surah.ayahCount} ayahs · all matched`;
    const done = document.createElement("span");
    done.className = "card-state done";
    done.textContent = "Completed ✓";
    actions.appendChild(done);
    const review = document.createElement("a");
    review.className = "card-link";
    review.href = `review.html?surah=${surah.number}`;
    review.textContent = "Review missed words →";
    review.addEventListener("click", (e) => e.stopPropagation());
    actions.appendChild(review);
  } else if (passed > 0) {
    meta.textContent = `${surah.englishTranslation} · ${passed}/${surah.ayahCount} ayahs`;
    const state = document.createElement("span");
    state.className = "card-state";
    state.textContent = "Continue →";
    actions.appendChild(state);
  } else {
    meta.textContent = `${surah.englishTranslation} · ${surah.ayahCount} ayahs`;
    const state = document.createElement("span");
    state.className = "card-state";
    state.textContent = "Start →";
    actions.appendChild(state);
  }

  return card;
}

async function init() {
  let manifest;
  try {
    manifest = await (await fetch(MANIFEST_FILE)).json();
  } catch {
    els.loading.textContent =
      "Could not load the surah list. Run `node scripts/build-data.mjs` and serve the folder over http.";
    return;
  }

  const surahs = Array.isArray(manifest.surahs) ? manifest.surahs : [];
  els.loading.remove();

  let prevCompleted = true; // the first surah is always available
  surahs.forEach((surah, i) => {
    const { passed } = surahProgress(surah.number);
    const completed = passed >= surah.ayahCount;
    const unlocked = i === 0 || prevCompleted;
    els.list.appendChild(
      renderCard(surah, {
        passed,
        completed,
        unlocked,
        prevName: i > 0 ? surahs[i - 1].englishName : null,
      })
    );
    prevCompleted = completed;
  });

  els.sources.textContent =
    "Arabic verified letter-for-letter across Quran.com API v4 and AlQuran.cloud / Tanzil, with Saheeh International translations.";
}

init();
