"use strict";

// Home screen: lists the surahs from data/surahs.json. A surah unlocks once the
// one before it (in manifest order) is fully completed in the trainer — and,
// once unlocked, stays unlocked as long as it has any progress of its own. That
// stickiness means resetting an earlier surah can't re-lock later surahs you've
// already worked through (e.g. resetting Al-Fatihah while 30 surahs deep).

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

function renderCard(surah, { passed, completed, unlocked, current, prevName }) {
  const card = els.tpl.content.firstElementChild.cloneNode(true);
  card.querySelector(".surah-card-num").textContent = surah.number;
  card.querySelector(".surah-card-en").textContent = surah.englishName;
  card.querySelector(".surah-card-ar").textContent = surah.name;
  if (current) card.classList.add("current");

  const arch = document.createElement("span");
  arch.className = "surah-card-arch";
  arch.setAttribute("aria-hidden", "true");
  card.appendChild(arch);

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
  const go = () => {
    // Name the tapped card so the cross-document view transition morphs it
    // into the trainer's loading stage (see .skeleton-ayah in styles.css).
    card.style.viewTransitionName = "stage";
    window.location.href = trainerHref;
  };
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
      <div class="hero-ring ${done ? "complete" : session > 0 ? "lit" : ""}" title="Today's session">
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
        <span class="hero-stat-icon lantern-icon lantern-streak" aria-hidden="true"></span>
        <span class="hero-stat-num" data-count="${streak}">0</span>
        <span class="hero-stat-label">day streak</span>
      </div>
      <div class="hero-stat">
        <span class="hero-stat-icon lantern-icon lantern-rescue" aria-hidden="true"></span>
        <span class="hero-stat-num" data-count="${rescued}">0</span>
        <span class="hero-stat-label">rescued today</span>
      </div>
      <div class="hero-stat">
        <span class="hero-stat-icon lantern-icon lantern-rosette" aria-hidden="true"></span>
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

// "You can read N% of Juz ʿAmma" — intersect the word forms of every passed
// ayah (across all surahs, matched by consonant skeleton) with the
// precomputed Juz ʿAmma form set from data/coverage.json.
const DIACRITICS = /[ً-ْٰٓ-ٟؐ-ؚۖ-ۭـ]/g; // keep in sync with app.js
const skeleton = (s) => s.normalize("NFC").replace(DIACRITICS, "");

async function renderCoverage(surahs) {
  const cov = await (await fetch("data/coverage.json")).json();
  const targetKeys = new Set(cov.keys);

  const learned = new Set();
  for (const s of surahs) {
    const { passed } = surahProgress(s.number);
    if (passed <= 0) continue;
    const data = await (await fetch(`data/surah-${s.number}.json`)).json();
    for (const ayah of data.ayahs.slice(0, passed)) {
      for (const w of ayah.words) {
        const key = skeleton(w.arabic);
        if (targetKeys.has(key)) learned.add(key);
      }
    }
  }
  if (!learned.size) return; // nothing yet — no 0% noise for new learners

  const pct = Math.max(1, Math.round((learned.size / cov.total) * 100));
  const box = document.createElement("div");
  box.className = "hero-coverage";
  box.innerHTML = `
    <span class="hc-label">You can read <strong>${pct}%</strong> of ${cov.label}'s words</span>
    <span class="hc-track"><span class="hc-fill"></span></span>`;
  const cta = els.hero.querySelector(".hero-cta");
  if (!cta) return;
  cta.before(box);
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      box.querySelector(".hc-fill").style.width = pct + "%";
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
    // Sticky unlock: the previous surah being completed unlocks this one, but
    // any progress of its own keeps it unlocked even if an earlier surah is
    // later reset. Prevents a single reset from cascading every surah locked.
    const unlocked = i === 0 || prevCompleted || passed > 0;
    const current = !cta && unlocked && !completed;
    mastered += Math.min(passed, surah.ayahCount);

    // First unlocked, unfinished surah is the natural "continue" target.
    if (current) {
      cta = {
        href: `trainer.html?surah=${surah.number}`,
        label:
          passed > 0
            ? `Continue ${surah.englishName} · ayah ${passed + 1}/${surah.ayahCount} →`
            : `Start ${surah.englishName} →`,
      };
    }

    const cardEl = renderCard(surah, {
      passed,
      completed,
      unlocked,
      current,
      prevName: i > 0 ? surahs[i - 1].englishName : null,
    });
    // Index for the CSS deal-out stagger (see .surah-card animation-delay).
    cardEl.style.setProperty("--i", i);
    els.list.appendChild(cardEl);
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

  // Fire-and-forget: the Juz ʿAmma coverage meter slots into the hero once
  // computed. A bonus stat — any failure just means it doesn't appear.
  renderCoverage(surahs).catch(() => {});

  els.sources.textContent =
    "Arabic verified letter-for-letter across Quran.com API v4 and AlQuran.cloud / Tanzil, with Saheeh International translations.";
}

init();
