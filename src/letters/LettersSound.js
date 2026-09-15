// Letter Garden's small sound adapter. It keeps the shared SoundSystem
// untouched while giving this game a quieter speech-aware mix and a little
// protection from repeated reward callbacks.
(function (ns) {
  const REWARD_CUES = new Set([
    "star1", "star2", "star3", "cheer1", "cheer2", "fanfare",
    "perfect", "worldClear", "record", "sticker",
  ]);

  class LettersSound {
    constructor(base, options = {}) {
      this.base = base || new ns.SoundSystem();
      this.duckLevel = options.duckLevel ?? 0.28;
      this.rewardLevel = options.rewardLevel ?? 0.72;
      this.speaking = false;
      this._rewardScale = 1;
      this._speechTurn = 0;
      this._duckTimer = null;
      this._rewardTimer = null;
      this._lastCueAt = new Map();
      this._now = options.now || (() => (typeof performance !== "undefined" ? performance.now() : Date.now()));
      this._setTimeout = options.setTimeout || ((fn, ms) => setTimeout(fn, ms));
      this._clearTimeout = options.clearTimeout || ((id) => clearTimeout(id));
    }

    get enabled() { return this.base.enabled !== false; }
    set enabled(value) { this.base.enabled = !!value; this._syncGain(); }

    unlock() {
      const ok = this.base.unlock?.();
      this._syncGain();
      return ok;
    }

    toggle() {
      const value = this.base.toggle ? this.base.toggle() : (this.base.enabled = !this.base.enabled);
      this._syncGain();
      return value;
    }

    // Speech is intentionally a duck, not a stop: a child still gets a quiet
    // tap/place cue while a letter name is being spoken.
    setSpeaking(isSpeaking, timeoutMs = 15000) {
      this._speechTurn += 1;
      const turn = this._speechTurn;
      this.speaking = !!isSpeaking;
      if (this._duckTimer) this._clearTimeout(this._duckTimer);
      this._duckTimer = null;
      this._syncGain();
      if (this.speaking) {
        this._duckTimer = this._setTimeout(() => {
          if (turn !== this._speechTurn) return;
          this.speaking = false;
          this._duckTimer = null;
          this._syncGain();
        }, timeoutMs);
      }
    }

    play(name) {
      if (!this.enabled) return;
      if (REWARD_CUES.has(name)) {
        const now = this._now();
        const last = this._lastCueAt.get(name);
        if (last != null && now - last < 260) return;
        this._lastCueAt.set(name, now);
        this._unlockBeforeCue();
        this._rewardScale = this.rewardLevel;
        this._syncGain();
        this.base.play?.(name);
        this._holdRewardScale(520);
        return;
      }
      this._unlockBeforeCue();
      const material = {
        click: ["tone", 1250, {dur: 0.04, gain: 0.04}],
        seed: ["tone", 880, {dur: 0.1, gain: 0.055, glideTo: 1174}],
        drop: ["tone", 520, {dur: 0.12, gain: 0.05, glideTo: 390}],
        softwrong: ["tone", 196, {dur: 0.18, type: "triangle", gain: 0.065}],
      }[name === "wrong" ? "softwrong" : name];
      if (material && typeof this.base.tone === "function") {
        this.base.tone(material[1], material[2]);
      } else if (name === "page" && typeof this.base.noise === "function") {
        this.base.noise({dur: 0.16, gain: 0.022, freq: 1800});
      } else {
        this.base.play?.(name);
      }
    }

    streakMelody(streak) {
      if (!this.enabled) return;
      this._unlockBeforeCue();
      this.base.streakMelody?.(streak);
    }

    _unlockBeforeCue() {
      try { this.base.unlock?.(); } catch {}
      this._syncGain();
    }

    _holdRewardScale(duration) {
      if (this._rewardTimer) this._clearTimeout(this._rewardTimer);
      this._rewardTimer = this._setTimeout(() => {
        this._rewardTimer = null;
        this._rewardScale = 1;
        this._syncGain();
      }, duration);
    }

    _syncGain() {
      const master = this.base.master;
      const gain = master?.gain;
      if (!gain) return;
      const target = this.enabled ? this._rewardScale * (this.speaking ? this.duckLevel : 1) : 0;
      try {
        const ctx = this.base.ctx;
        if (ctx && typeof gain.setTargetAtTime === "function") {
          gain.setTargetAtTime(target, ctx.currentTime, 0.035);
        } else if ("value" in gain) {
          gain.value = target;
        }
      } catch {}
    }
  }

  ns.LettersSound = LettersSound;
})(window.MiftahGame || (window.MiftahGame = {}));
