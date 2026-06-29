"use strict";

/*
 * fsrs.js — a small, dependency-free implementation of FSRS-5
 * (Free Spaced Repetition Scheduler), the algorithm that has largely
 * replaced SuperMemo SM-2 and Leitner boxes in modern review systems.
 *
 * Instead of fixed boxes, FSRS models every card with three quantities:
 *   • Difficulty   (D, 1..10)   — how hard this item is for the learner
 *   • Stability    (S, days)    — days for recall odds to fall to the
 *                                 desired retention (90% by default)
 *   • Retrievability (R, 0..1)  — probability of recall *right now*
 * After each grade it updates D and S, then schedules the next review for
 * the moment R is predicted to decay to the desired retention. On large
 * public datasets this needs ~20–30% fewer reviews than SM-2 for the same
 * retention, and predicts recall far more accurately.
 *
 * The weights below are the published FSRS-5 pretrained defaults, so the
 * scheduler works well with no per-user training data — the same baseline
 * Anki ships. (A future "optimize" pass could refit them from the review
 * log, but nothing here depends on that.)
 *
 * Grades: 1 = Again (forgot), 2 = Hard, 3 = Good, 4 = Easy.
 * Miftah's review screen drives it with a binary mapping (a wrong tap →
 * Again, a correct tap → Good), but the engine supports all four so the
 * UI can grow a Hard/Easy choice later without touching the math.
 */

const FSRS = (() => {
  // Published FSRS-5 default parameters w0..w18.
  const W = [
    0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046,
    1.54575, 0.1192, 1.01925, 1.9395, 0.11, 0.29605, 2.2698, 0.2315,
    2.9898, 0.51655, 0.6621,
  ];

  const DECAY = -0.5;
  // FACTOR is chosen so that R(t = S) === 0.9, i.e. stability is literally
  // "days until recall odds reach 90%". = 0.9^(1/DECAY) - 1 = 19/81.
  const FACTOR = Math.pow(0.9, 1 / DECAY) - 1; // ≈ 0.2345679
  const S_MIN = 0.01; // stability floor (days)
  const DAY = 86400000; // ms
  const DESIRED_RETENTION = 0.9;

  const clampD = (d) => Math.min(Math.max(d, 1), 10);
  const clampS = (s) => Math.max(s, S_MIN);

  // Probability of recall after `elapsedDays` given stability S.
  function retrievability(elapsedDays, stability) {
    if (!stability || stability <= 0) return 0;
    return Math.pow(1 + FACTOR * (elapsedDays / stability), DECAY);
  }

  // Days to wait until R decays to `retention`, given stability S.
  function intervalDays(stability, retention = DESIRED_RETENTION) {
    return (stability / FACTOR) * (Math.pow(retention, 1 / DECAY) - 1);
  }

  // ---- first-time values (the card's very first grade) ----
  const initStability = (g) => clampS(W[g - 1]);
  const initDifficulty = (g) => clampD(W[4] - Math.exp(W[5] * (g - 1)) + 1);

  // ---- difficulty update on any subsequent grade ----
  function nextDifficulty(d, g) {
    const deltaD = -W[6] * (g - 3);
    const damped = d + deltaD * ((10 - d) / 9); // linear damping near the rails
    const d0Easy = W[4] - Math.exp(W[5] * (4 - 1)) + 1; // mean-reversion anchor
    return clampD(W[7] * d0Easy + (1 - W[7]) * damped);
  }

  // ---- stability on a successful recall (g >= 2) ----
  function nextRecallStability(d, s, r, g) {
    const hard = g === 2 ? W[15] : 1;
    const easy = g === 4 ? W[16] : 1;
    const inc =
      Math.exp(W[8]) *
      (11 - d) *
      Math.pow(s, -W[9]) *
      (Math.exp((1 - r) * W[10]) - 1) *
      hard *
      easy;
    return clampS(s * (1 + inc));
  }

  // ---- stability on a lapse (g === 1) ----
  function nextForgetStability(d, s, r) {
    const sf =
      W[11] *
      Math.pow(d, -W[12]) *
      (Math.pow(s + 1, W[13]) - 1) *
      Math.exp((1 - r) * W[14]);
    return clampS(sf);
  }

  // ---- stability for a same-day re-review (elapsed < 1 day) ----
  function shortTermStability(s, g) {
    return clampS(s * Math.exp(W[17] * (g - 3 + W[18])));
  }

  // A blank, never-reviewed card.
  function newCard() {
    return {
      stability: null,
      difficulty: null,
      due: 0,
      lastReview: null,
      reps: 0,
      lapses: 0,
      state: "new",
    };
  }

  // Grade a card and return a NEW card object scheduled forward from `now`
  // (ms epoch). Pure: it never mutates the card passed in.
  function repeat(card, grade, now, retention = DESIRED_RETENTION) {
    const g = Math.min(Math.max(grade | 0, 1), 4);
    const next = Object.assign(newCard(), card);

    if (next.state === "new" || next.stability == null) {
      next.stability = initStability(g);
      next.difficulty = initDifficulty(g);
    } else {
      const elapsed = Math.max(0, (now - (next.lastReview ?? now)) / DAY);
      const r = retrievability(elapsed, next.stability);
      next.difficulty = nextDifficulty(next.difficulty, g);
      if (elapsed < 1) {
        next.stability = shortTermStability(next.stability, g);
      } else if (g === 1) {
        next.stability = nextForgetStability(next.difficulty, next.stability, r);
      } else {
        next.stability = nextRecallStability(next.difficulty, next.stability, r, g);
      }
    }

    if (g === 1) next.lapses += 1;
    next.reps += 1;
    next.state = "review";
    next.lastReview = now;
    next.due = now + intervalDays(next.stability, retention) * DAY;
    return next;
  }

  return {
    newCard,
    repeat,
    intervalDays,
    retrievability,
    DESIRED_RETENTION,
    DAY,
  };
})();

if (typeof window !== "undefined") window.FSRS = FSRS;
