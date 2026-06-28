"use strict";

// Home screen: lists the surahs from data/surahs.json. A surah unlocks only
// once the one before it (in manifest order) is fully completed in the trainer.

const MANIFEST_FILE = "data/surahs.json";

const els = {
  loading: document.getElementById("loading"),
  hero: document.getElementById("home-hero"),
  listHeading: document.getElementById("surah-list-heading"),
  list: document.getElementById("surah-list"),
  tpl: document.getElementById("surah-card-template"),
  sources: document.getElementById("sources"),
};

const progressKey = (n) => `quran-trainer:surah-${n}:progress`;

// Daily-ritual keys, shared with the trainer (app.js).
const SESSION_GOAL_AYAHS = 5;
const SESSION_KEY = "quran-trainer:session";
const STREAK_KEY = "quran-trainer:streak";
const RESCUE_KEY = "quran-trainer:rescued";

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

function readDaily(key) {
  try {
    const s = JSON.parse(localStorage.getItem(key) || "{}");
    return s.date === todayStr() ? s.count || 0 : 0;
  } catch {
    return 0;
  }
}

function readStreak() {
  try {
    const s = JSON.parse(localStorage.getItem(STREAK_KEY) || "{}");
    // A streak only still counts if it was touched today or yesterday.
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const y = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
    if (s.lastDate === todayStr() || s.lastDate === y) return s.count || 0;
  } catch {}
  return 0;
}

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

// Count a number up from 0 → target for a small reward-y flourish.
function countUp(el, target, ms = 700) {
  if (target <= 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    el.textContent = String(target);
    return;
  }
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - start) / ms);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = String(Math.round(eased * target));
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

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

// The home "ritual" hero: greets the learner and reflects their journey back at
// them (today's session ring, streak, rescued words, ayahs mastered) so opening
// the app feels rewarding before a single tap — and points straight at what to
// do next.
function renderHero({ session, goal, streak, rescued, mastered, cta }) {
  const done = session >= goal;
  const pct = Math.min(1, session / goal);
  const circ = 2 * Math.PI * 26;

  const tagline = done
    ? "Today's practice is done — your streak is safe. ✓"
    : session > 0
    ? `You're ${session} of ${goal} ayahs into today's session.`
    : `Ready for today's ${goal}-ayah session?`;

  els.hero.innerHTML = `
    <div class="hero-top">
      <div class="hero-greeting">
        <p class="hero-hello">${greeting()}</p>
        <p class="hero-tagline">${tagline}</p>
      </div>
      <div class="hero-ring ${done ? "complete" : ""}" title="Today's session">
        <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">
          <circle class="hr-bg" cx="32" cy="32" r="26"></circle>
          <circle class="hr-fill" cx="32" cy="32" r="26"
            style="stroke-dasharray:${circ};stroke-dashoffset:${circ}"></circle>
        </svg>
        <span class="hero-ring-label">${done ? "✓" : session + "/" + goal}</span>
      </div>
    </div>
    <div class="hero-stats">
      <div class="hero-stat">
        <span class="hero-stat-icon">🔥</span>
        <span class="hero-stat-num" data-count="${streak}">0</span>
        <span class="hero-stat-label">day streak</span>
      </div>
      <div class="hero-stat">
        <span class="hero-stat-icon">💪</span>
        <span class="hero-stat-num" data-count="${rescued}">0</span>
        <span class="hero-stat-label">rescued today</span>
      </div>
      <div class="hero-stat">
        <span class="hero-stat-icon">★</span>
        <span class="hero-stat-num" data-count="${mastered}">0</span>
        <span class="hero-stat-label">ayahs learned</span>
      </div>
    </div>
    <a class="hero-cta" href="${cta.href}">${cta.label}</a>`;

  els.hero.hidden = false;

  // Animate the ring fill and count up the stats after paint.
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const fill = els.hero.querySelector(".hr-fill");
      if (fill) fill.style.strokeDashoffset = String(circ * (1 - pct));
      els.hero
        .querySelectorAll(".hero-stat-num")
        .forEach((el) => countUp(el, Number(el.dataset.count)));
    })
  );
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
  let mastered = 0;
  let cta = null;
  surahs.forEach((surah, i) => {
    const { passed } = surahProgress(surah.number);
    const completed = passed >= surah.ayahCount;
    const unlocked = i === 0 || prevCompleted;
    mastered += Math.min(passed, surah.ayahCount);

    // First unlocked, unfinished surah is the natural "continue" target.
    if (!cta && unlocked && !completed) {
      cta = {
        href: `trainer.html?surah=${surah.number}`,
        label:
          passed > 0
            ? `Continue ${surah.englishName} · ayah ${passed + 1}/${surah.ayahCount} →`
            : `Start ${surah.englishName} →`,
      };
    }

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

  // Everything available is finished — send them to review the most recent one.
  if (!cta && surahs.length) {
    cta = { href: `trainer.html?surah=${surahs[0].number}`, label: "Practice again →" };
  }

  renderHero({
    session: readDaily(SESSION_KEY),
    goal: SESSION_GOAL_AYAHS,
    streak: readStreak(),
    rescued: readDaily(RESCUE_KEY),
    mastered,
    cta,
  });
  els.listHeading.hidden = false;

  els.sources.textContent =
    "Arabic verified letter-for-letter across Quran.com API v4 and AlQuran.cloud / Tanzil, with Saheeh International translations.";
}

init();
