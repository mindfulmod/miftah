# Trainer v2 — locked decisions (discovery interview 2026-07-16)

All decisions below were interviewed and locked on 2026-07-16. Declined options are
recorded at the bottom — do not relitigate without new evidence.

## Who & what for

- **Primary learner:** the owner, an adult self-learner. Family members are
  secondary users who get sensible defaults.
- **#1 outcome:** *understand while reciting* — meaning arriving in real time
  during salah/tilawah. The loop rewards speed of recall on high-frequency words
  and the surahs actually recited.
- **Proof metric:** the recite-along (follow mode) test — recitation audio at
  natural pace, learner flags words where meaning didn't keep up.

## Learning engine

- **Cards stay recognition-only** (tap-the-gloss). No recall-first reveal, no
  type-in. Production/retrieval honesty is carried entirely by follow mode.
- **Audio-paced follow mode** (new): per-surah mode where recitation audio plays
  at natural speed, words highlight in sync, learner taps/holds any word whose
  meaning didn't arrive in time; flagged words feed the review queue. Serves as
  both fluency trainer and the proof test.
  - Placement: unlocks as a **celebratory first follow-through when a surah's
    ayahs are all completed**; afterwards freely replayable from the picker.
- **Morphology:** root-family moments (brief "same family" beat when meeting a
  word whose root is already known) **and** grammar micro-lessons.
  - Lessons v1: **Claude drafts 8 patterns, owner approves** — past/present verb
    forms, attached pronouns, definite ال, common plurals, إنّ family, negations,
    prepositions+pronouns, fa/wa connectors. Examples drawn from surahs the
    learner has already unlocked.
- **Review unification:** ONE FSRS-backed schedule. Daily session = due reviews
  first (warm-up), then new ayahs, one progress bar. The separate review page
  becomes an "extra practice" view over the same queue. Single word-strength
  store; follow mode reads from and writes to it.

## Daily ritual

- **Session bound:** time-budgeted, not ayah-count. Goal is a **floor, not a
  ceiling**: soft "goal met ✓" beat, then keep-going stays open. Always ends on
  an ayah boundary. **No visible countdown timer.**
- **Presets, not a slider:** Gentle (~3 min, DEFAULT) / Steady (~5) / Devoted
  (~10), changeable in settings, picked at first-run.
- **Home:** new **Today screen** — streak, today's session state, continue
  button, one gentle stat (coverage %). Picker/review/glossary one tap away.
- **First run:** 3-step warm setup — (1) language English/اردو with instant full
  UI switch, (2) pace preset, (3) starting surah — then straight into session.

## Urdu layer

- **For:** Urdu-first family member(s) — full first-class experience, not a
  display option.
- **Source:** Quran.com API v4 word-by-word Urdu, riding the existing verified
  build pipeline (same segmentation as English set).
- **Script:** Nastaliq — Noto Nastaliq Urdu webfont, cached by the PWA. Layout
  care needed for tall line-heights next to Arabic.
- **Selection:** per-device language choice at first run, changeable in
  settings. No profiles. Progress stays per-device.
- **Scope (all four locked in):** WBW glosses + distractors + review/trouble
  words in Urdu; flowing ayah tarjuma on the reveal line (AlQuran.cloud Urdu
  edition); full UI label localization (needs a strings layer,
  `strings.{en,ur}`); transliteration line hidden for Urdu users.

## Feel engine (return-tomorrow mechanics)

- **Quran coverage heat-map** — 114-surah grid filling with color as
  word-strength grows; the flagship long-term progress artifact
  (coverage.json is half the work).
- **Anticipation teaser** — session ends previewing ONE beautiful word from
  tomorrow's ayahs.
- **Root-gem collection** — each root family is a collectible gem, forms at 2+
  known words, polishes as the family grows; needs a collection view.
- **Weekly letter** — warm weekly recap over existing stats (peak-end design).
- Streak stays **as-is** (plain flame; grace-day mechanic declined).

## Look & feel

- **Direction: manuscript warmth** — warm paper tones, deep ink, one gold
  accent, subtle geometric borders on milestone moments only, generous
  whitespace. Light theme + true dark (fajr/isha use).
- **Arabic type: KFGQPC Uthmanic Hafs** across the app, bigger default size —
  trainer letterforms visually match the printed mushaf (transfer argument).
- **Celebration: reverent glow** — soft gold blooms, gentle chime,
  calligraphic flourish on surah completion. No confetti.

## Notifications

- **Opt-in gentle reminder**: off by default; settings toggle, user-chosen time,
  copy rotates warm invitations using the anticipation-teaser word.

## Build order

- **Milestone 1:** Urdu layer end-to-end + Today screen + unified time-bounded
  session. (Urdu unblocks a real waiting user; session/Today is the foundation.)
- **Milestone 2:** follow mode + manuscript reskin + Uthmanic font.
- **Milestone 3:** root gems, grammar lessons, teaser, weekly letter, reminder.

### Recommended models per task (standing preference)

| Task | Model |
|---|---|
| Urdu data pipeline extension (build-data.mjs lang param, verification) | Sonnet |
| Strings layer + UI localization + Nastaliq layout | Sonnet |
| Unified FSRS session engine (merge interleave + fsrs.js) | **Fable** (learning-critical logic) |
| Today screen + first-run setup | Sonnet |
| Follow mode (audio sync + flag capture + strength writes) | **Fable** (timing-critical, proof metric) |
| Manuscript reskin + Uthmanic font rollout | Sonnet, with one Fable art-review pass |
| Heat-map, gems view, weekly letter, teaser | Sonnet |
| Grammar lesson content (8 cards) | **Fable** draft → owner approval |
| Copy pools (reminders, celebrations, letter) | Haiku draft → Fable polish |

## Declined (with reasons, 2026-07-16)

- Recall-first self-grade & type-in production — owner wants cards low-friction;
  follow mode is the production layer.
- Timed sprint rounds — arcade pressure clashes with devotional tone.
- Two synced review systems / review-first hard gate — one schedule instead.
- Keep 5-ayah goal — balloons after missed weeks; time floor chosen.
- Free timer setting — presets beat sliders.
- Streak-with-grace — plain streak retained.
- Full-celebration confetti; night-sky or garden-continuity skins.
- Machine-translated Urdu glosses — translation-of-a-translation, vetoed.
- Profiles on one device / shared-progress language toggle — per-device wins.
- Onboarding-time notification ask — permission before value is the classic
  mistake; opt-in via settings instead.

## Open on purpose

- Exact Urdu tarjuma edition for the reveal line (family preference to check:
  Maududi vs Junagarhi vs Kanzul Iman — AlQuran.cloud carries several).
- Whether the old `signaldesk/quran-trainer/` snapshot gets deleted (housekeeping).
- Reminder copy pool contents.
