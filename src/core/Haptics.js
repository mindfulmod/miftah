// Touch feedback for the kids' games. Deliberately keyed to the SAME event
// vocabulary SoundSystem already uses ("correct", "click", "hatch", …), so the
// games get a matching buzz wherever they already play a cue — no new call
// sites to keep in sync.
//
// Independent of the sound mute on purpose: a muted tablet is exactly when
// touch feedback matters most (bedtime, a waiting room), so silencing audio
// must never silence the buzz. Own preference key, own toggle.
//
// PLATFORM REALITY: the Vibration API is Android/Chromium only. iOS and
// iPadOS Safari do not implement navigator.vibrate at all — on an iPad this
// module detects that and becomes a no-op rather than pretending. Everything
// still works; it just doesn't buzz. `Haptics.supported` reports the truth so
// UI can hide a toggle that would do nothing, and the visual "impact" recoil
// below is what carries the tactile feeling on those devices.
(function (ns) {
  const PREF_KEY = "quran-trainer:haptics";

  // Durations in ms; arrays alternate buzz/gap/buzz. Kept short and soft —
  // this is a 5-year-old's hand, so feedback should read as "that landed",
  // never as an alarm. Note "wrong" is a single gentle tap, NOT a double
  // buzz: errors are information here, never a scolding (locked 2026-07-16).
  const PATTERNS = {
    click: 8,
    page: 6,
    select: 10,
    pop: 12,
    seed: 12,
    correct: [12, 40, 20],
    wrong: 24,
    hatch: [10, 60, 16, 60, 30],
    sticker: [12, 40, 12, 40, 26],
    biomeArrival: [16, 70, 26],
    worldClear: [18, 60, 18, 60, 40],
    star1: 14,
    star2: 18,
    star3: 24,
    ayahComplete: [12, 50, 18, 50, 24],
    perfect: [12, 40, 16, 40, 20, 40, 32],
  };

  const supported =
    typeof navigator !== "undefined" && typeof navigator.vibrate === "function";

  let enabled = true;
  try {
    enabled = localStorage.getItem(PREF_KEY) !== "off";
  } catch {}

  function pulse(name) {
    if (!supported || !enabled) return false;
    const pattern = PATTERNS[name];
    if (pattern === undefined) return false;
    try {
      return navigator.vibrate(pattern);
    } catch {
      return false;
    }
  }

  function toggle() {
    enabled = !enabled;
    try {
      localStorage.setItem(PREF_KEY, enabled ? "on" : "off");
    } catch {}
    if (!enabled && supported) {
      try {
        navigator.vibrate(0); // cancel anything mid-pattern
      } catch {}
    }
    return enabled;
  }

  // The part that works everywhere, iPad included: a one-frame recoil on the
  // element the finger actually hit. Physical-feeling touch UI is mostly this
  // — the thing you pressed must visibly give way — and it's the only tactile
  // channel iOS Safari leaves open to a web app.
  function impact(el, kind = "tap") {
    if (!el || !el.classList) return;
    const cls = kind === "soft" ? "is-impact-soft" : "is-impact";
    el.classList.remove("is-impact", "is-impact-soft");
    void el.offsetWidth; // restart the animation even on a rapid re-tap
    el.classList.add(cls);
    const clear = () => el.classList.remove(cls);
    el.addEventListener("animationend", clear, { once: true });
    setTimeout(clear, 400); // animationend never fires under reduced-motion
  }

  ns.Haptics = {
    pulse,
    impact,
    toggle,
    supported,
    get enabled() {
      return enabled;
    },
    PATTERNS,
  };
})(window.MiftahGame || (window.MiftahGame = {}));
