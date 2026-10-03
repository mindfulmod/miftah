// Letter Garden's small sound adapter. It keeps the shared SoundSystem
// untouched while giving this game a quieter speech-aware mix and a little
// protection from repeated reward callbacks.
(function (ns) {
  const REWARD_CUES = new Set([
    "star1", "star2", "star3", "cheer1", "cheer2", "fanfare",
    "perfect", "worldClear", "record", "sticker",
  ]);

  // Material cues (2026-10-01). Every toy and craft step sounds like what it
  // is made of — water, wood, paper, cloth, glass — built from the shared
  // engine's tone() and noise() so no audio files ship. Each step is
  // [kind, at, ...args]; gains stay under the speech-safe ceiling (0.07).
  const T = (at, freq, o = {}) => ["tone", at, freq, o];
  const N = (at, o) => ["noise", at, o];
  const CUES = {
    // Sand Table (v28): a fingertip of grain, played while the finger moves.
    sand: [N(0, {dur: 0.06, gain: 0.02, filterType: "bandpass", freq: 2600})],
    rake: [N(0, {dur: 0.32, gain: 0.024, filterType: "bandpass", freq: 1800}), N(0.12, {dur: 0.2, gain: 0.018, filterType: "bandpass", freq: 2400})],
    // Letter Friends (v26): each animal friend's own short call, never a word.
    "friend-rabbit": [T(0, 1500, {dur: 0.05, gain: 0.03, glideTo: 1800}), T(0.08, 1650, {dur: 0.05, gain: 0.028, glideTo: 1950})],
    "friend-duck": [T(0, 330, {dur: 0.12, type: "sawtooth", gain: 0.022, glideTo: 270}), T(0.16, 330, {dur: 0.12, type: "sawtooth", gain: 0.02, glideTo: 260})],
    "friend-crocodile": [T(0, 120, {dur: 0.3, type: "triangle", gain: 0.06, glideTo: 90}), N(0.02, {dur: 0.12, gain: 0.02, filterType: "lowpass", freq: 600})],
    "friend-fox": [T(0, 900, {dur: 0.1, type: "triangle", gain: 0.04, glideTo: 1400}), T(0.14, 1100, {dur: 0.08, type: "triangle", gain: 0.03, glideTo: 1500})],
    "friend-camel": [T(0, 180, {dur: 0.45, type: "sawtooth", gain: 0.016, glideTo: 140}), T(0.05, 360, {dur: 0.4, type: "triangle", gain: 0.03, glideTo: 280})],
    "friend-horse": [T(0, 900, {dur: 0.4, type: "triangle", gain: 0.035, glideTo: 600}), T(0.12, 700, {dur: 0.28, type: "triangle", gain: 0.02, glideTo: 850})],
    "friend-sheep": [T(0, 420, {dur: 0.08, type: "sawtooth", gain: 0.018}), T(0.09, 410, {dur: 0.08, type: "sawtooth", gain: 0.017}), T(0.18, 400, {dur: 0.18, type: "sawtooth", gain: 0.016, glideTo: 380})],
    "friend-bear": [T(0, 140, {dur: 0.32, type: "triangle", gain: 0.065, glideTo: 110}), T(0.08, 280, {dur: 0.2, type: "triangle", gain: 0.025, glideTo: 220})],
    "friend-giraffe": [T(0, 520, {dur: 0.3, gain: 0.03, glideTo: 640})],
    "friend-fish": [T(0, 1300, {dur: 0.06, gain: 0.04, glideTo: 650}), T(0.12, 1500, {dur: 0.06, gain: 0.035, glideTo: 760})],
    "friend-frog": [T(0, 240, {dur: 0.07, type: "triangle", gain: 0.06, glideTo: 320}), T(0.12, 240, {dur: 0.09, type: "triangle", gain: 0.06, glideTo: 360})],
    "friend-peacock": [T(0, 1200, {dur: 0.22, type: "triangle", gain: 0.035, glideTo: 900}), T(0.26, 1200, {dur: 0.22, type: "triangle", gain: 0.03, glideTo: 900})],
    "friend-gazelle": [T(0, 1400, {dur: 0.05, gain: 0.03}), T(0.1, 1600, {dur: 0.05, gain: 0.028}), T(0.2, 1800, {dur: 0.05, gain: 0.025})],
    "friend-elephant": [T(0, 300, {dur: 0.42, type: "sawtooth", gain: 0.02, glideTo: 640}), T(0.05, 600, {dur: 0.36, type: "triangle", gain: 0.03, glideTo: 1100})],
    "friend-bee": [T(0, 200, {dur: 0.6, type: "sawtooth", gain: 0.014, glideTo: 230})],
    "friend-hoopoe": [T(0, 600, {dur: 0.12, gain: 0.04}), T(0.2, 600, {dur: 0.1, gain: 0.035}), T(0.36, 600, {dur: 0.1, gain: 0.035})],
    "friend-cat": [T(0, 720, {dur: 0.16, type: "triangle", gain: 0.04, glideTo: 520}), T(0.16, 520, {dur: 0.14, type: "triangle", gain: 0.035, glideTo: 680})],
    "friend-dove": [T(0, 480, {dur: 0.3, gain: 0.035, glideTo: 380}), T(0.36, 440, {dur: 0.36, gain: 0.03, glideTo: 360})],
    splash: [N(0, {dur: 0.28, gain: 0.05, filterType: "lowpass", freq: 900}), T(0, 320, {dur: 0.14, gain: 0.04, glideTo: 170})],
    drip: [T(0, 1500, {dur: 0.07, gain: 0.045, glideTo: 760}), T(0.1, 1100, {dur: 0.06, gain: 0.03, glideTo: 600})],
    pour: [N(0, {dur: 0.7, gain: 0.026, filterType: "bandpass", freq: 1300}), T(0.12, 1400, {dur: 0.06, gain: 0.03, glideTo: 700}), T(0.32, 1250, {dur: 0.06, gain: 0.028, glideTo: 640}), T(0.52, 1500, {dur: 0.06, gain: 0.026, glideTo: 760})],
    ripple: [T(0, 560, {dur: 0.22, gain: 0.03, glideTo: 880}), T(0.11, 700, {dur: 0.2, gain: 0.022, glideTo: 1050})],
    dock: [T(0, 210, {dur: 0.07, type: "triangle", gain: 0.07}), T(0.08, 170, {dur: 0.06, type: "triangle", gain: 0.05}), N(0, {dur: 0.05, gain: 0.02, filterType: "lowpass", freq: 700})],
    creak: [T(0, 150, {dur: 0.32, type: "triangle", gain: 0.03, glideTo: 205}), T(0.34, 200, {dur: 0.22, type: "triangle", gain: 0.022, glideTo: 160})],
    rustle: [N(0, {dur: 0.16, gain: 0.022, freq: 3200}), N(0.12, {dur: 0.12, gain: 0.016, freq: 3800})],
    snip: [N(0, {dur: 0.03, gain: 0.04, freq: 5200}), N(0.07, {dur: 0.03, gain: 0.034, freq: 5600})],
    thread: [T(0, 880, {dur: 0.13, type: "triangle", gain: 0.032, glideTo: 1320})],
    clink: [T(0, 1760, {dur: 0.14, gain: 0.04}), T(0.025, 2640, {dur: 0.1, gain: 0.022})],
    turn: [T(0, 250, {dur: 0.2, type: "triangle", gain: 0.05, glideTo: 340}), T(0.2, 1250, {dur: 0.04, gain: 0.035})],
    pop: [T(0, 380, {dur: 0.07, gain: 0.05, glideTo: 1250})],
    boing: [T(0, 300, {dur: 0.15, type: "triangle", gain: 0.045, glideTo: 620}), T(0.15, 620, {dur: 0.16, type: "triangle", gain: 0.035, glideTo: 310})],
    chime: [T(0, 1046.5, {dur: 0.42, gain: 0.04}), T(0.09, 1568, {dur: 0.36, gain: 0.03}), T(0.18, 2093, {dur: 0.3, gain: 0.018})],
    thud: [T(0, 140, {dur: 0.12, type: "triangle", gain: 0.06, glideTo: 90}), N(0, {dur: 0.06, gain: 0.02, filterType: "lowpass", freq: 500})],
    crack: [N(0, {dur: 0.05, gain: 0.05, freq: 2200}), T(0.01, 950, {dur: 0.04, gain: 0.03, glideTo: 700})],
    tryon: [T(0, 660, {dur: 0.12, type: "triangle", gain: 0.04, glideTo: 990}), T(0.09, 1320, {dur: 0.12, gain: 0.025})],
    drum: [T(0, 110, {dur: 0.22, type: "triangle", gain: 0.07, glideTo: 80}), N(0, {dur: 0.08, gain: 0.03, filterType: "lowpass", freq: 400})],
    glow: [T(0, 523.25, {dur: 0.5, gain: 0.03, glideTo: 784}), T(0.05, 1046.5, {dur: 0.45, gain: 0.018})],
  };
  // Each species has its own short happy call — never a word, never sad.
  const VOICES = {
    blob: [T(0, 520, {dur: 0.1, type: "triangle", gain: 0.045, glideTo: 600}), T(0.12, 660, {dur: 0.12, type: "triangle", gain: 0.045, glideTo: 780})],
    cat: [T(0, 720, {dur: 0.16, type: "triangle", gain: 0.04, glideTo: 520}), T(0.16, 520, {dur: 0.14, type: "triangle", gain: 0.035, glideTo: 680})],
    chick: [T(0, 2000, {dur: 0.06, gain: 0.035, glideTo: 2500}), T(0.1, 2100, {dur: 0.06, gain: 0.032, glideTo: 2600})],
    bunny: [T(0, 1500, {dur: 0.05, gain: 0.03, glideTo: 1800}), T(0.07, 1650, {dur: 0.05, gain: 0.028, glideTo: 1950}), T(0.14, 1800, {dur: 0.05, gain: 0.025, glideTo: 2100})],
    dragon: [T(0, 150, {dur: 0.34, type: "sawtooth", gain: 0.018, glideTo: 190}), T(0.05, 300, {dur: 0.28, type: "triangle", gain: 0.03, glideTo: 420})],
    lumi: [T(0, 1046.5, {dur: 0.16, gain: 0.03}), T(0.1, 1318.5, {dur: 0.16, gain: 0.028}), T(0.2, 1568, {dur: 0.2, gain: 0.025})],
    mina: [T(0, 880, {dur: 0.09, type: "triangle", gain: 0.035, glideTo: 1180}), T(0.11, 1180, {dur: 0.1, type: "triangle", gain: 0.03, glideTo: 990})],
    rafi: [T(0, 440, {dur: 0.12, type: "triangle", gain: 0.045, glideTo: 560}), T(0.13, 560, {dur: 0.08, type: "triangle", gain: 0.04}), T(0.22, 700, {dur: 0.1, type: "triangle", gain: 0.035})],
  };
  // Land beds: a looping filtered-noise floor plus occasional voices. Very
  // quiet, through the same master gain, so mute and speech ducking apply.
  const LANDS = {
    meadow: {filter: "highpass", freq: 2600, gain: 0.004, lfo: 0.05, every: [6000, 11000], voice: "bird"},
    orchard: {filter: "lowpass", freq: 520, gain: 0.005, lfo: 0.06, every: [5000, 9000], voice: "bee"},
    lagoon: {filter: "lowpass", freq: 420, gain: 0.012, lfo: 0.09, every: [7000, 12000], voice: "plip"},
    night: {filter: "lowpass", freq: 360, gain: 0.005, lfo: 0.04, every: [1800, 3200], voice: "cricket"},
    peaks: {filter: "bandpass", freq: 650, gain: 0.011, lfo: 0.12, every: [9000, 15000], voice: "bird"},
    river: {filter: "lowpass", freq: 700, gain: 0.013, lfo: 0.15, every: [6000, 10000], voice: "plip"},
  };
  const LAND_VOICES = {
    bird: [T(0, 2200, {dur: 0.09, gain: 0.014, glideTo: 2800}), T(0.13, 2500, {dur: 0.07, gain: 0.011, glideTo: 2100})],
    bee: [T(0, 180, {dur: 0.6, type: "sawtooth", gain: 0.006, glideTo: 200})],
    plip: [T(0, 1300, {dur: 0.06, gain: 0.014, glideTo: 650})],
    cricket: [T(0, 4200, {dur: 0.03, gain: 0.008}), T(0.06, 4200, {dur: 0.03, gain: 0.008}), T(0.12, 4200, {dur: 0.03, gain: 0.007})],
  };

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
      if (CUES[name]) { this._steps(CUES[name]); return; }
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

    // The pet's own happy call, by species (unknown species fall back to blob).
    voice(species) {
      if (!this.enabled) return;
      this._unlockBeforeCue();
      this._steps(VOICES[species] || VOICES.blob);
    }

    // Start (or switch) the quiet soundscape for a land; null stops it.
    setLand(biome) {
      const land = LANDS[biome] ? biome : null;
      if (land === this.land) return;
      this._stopLand();
      this.land = land;
      if (!land || typeof document !== "undefined" && document.hidden) return;
      const ctx = this.base.ctx, master = this.base.master;
      if (!ctx || !master || typeof ctx.createBuffer !== "function") return;
      const spec = LANDS[land];
      try {
        const frames = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < frames; i += 1) data[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.loop = true;
        const filter = ctx.createBiquadFilter();
        filter.type = spec.filter;
        filter.frequency.value = spec.freq;
        const amp = ctx.createGain();
        amp.gain.setValueAtTime(0, ctx.currentTime);
        amp.gain.linearRampToValueAtTime(spec.gain, ctx.currentTime + 1.2);
        const lfo = ctx.createOscillator();
        lfo.frequency.value = spec.lfo;
        const depth = ctx.createGain();
        depth.gain.value = spec.gain * 0.5;
        lfo.connect(depth).connect(amp.gain);
        src.connect(filter).connect(amp).connect(master);
        src.start();
        lfo.start();
        this._bed = { src, lfo, amp };
      } catch { this._bed = null; }
      const voice = () => {
        if (this.land !== land) return;
        if (this.enabled && !this.speaking) this._steps(LAND_VOICES[spec.voice] || []);
        const [lo, hi] = spec.every;
        this._landTimer = this._setTimeout(voice, lo + Math.random() * (hi - lo));
      };
      this._landTimer = this._setTimeout(voice, spec.every[0]);
    }

    // A soft rain layer for drizzle days, independent of the land bed.
    setRain(on) {
      on = !!on && !(typeof document !== "undefined" && document.hidden);
      if (on === !!this._rain) return;
      if (!on) {
        const r = this._rain; this._rain = null;
        try { r.amp.gain.setTargetAtTime(0, this.base.ctx.currentTime, 0.3); r.src.stop(this.base.ctx.currentTime + 1.2); } catch {}
        return;
      }
      const ctx = this.base.ctx, master = this.base.master;
      if (!ctx || !master || typeof ctx.createBuffer !== "function") return;
      try {
        const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource(); src.buffer = buffer; src.loop = true;
        const filter = ctx.createBiquadFilter(); filter.type = "highpass"; filter.frequency.value = 1800;
        const amp = ctx.createGain(); amp.gain.setValueAtTime(0, ctx.currentTime); amp.gain.linearRampToValueAtTime(0.007, ctx.currentTime + 1.5);
        src.connect(filter).connect(amp).connect(master); src.start();
        this._rain = { src, amp };
      } catch { this._rain = null; }
    }

    _stopLand() {
      if (this._landTimer) this._clearTimeout(this._landTimer);
      this._landTimer = null;
      const bed = this._bed;
      this._bed = null;
      if (!bed) return;
      try {
        const ctx = this.base.ctx;
        bed.amp.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
        bed.src.stop(ctx.currentTime + 0.8);
        bed.lfo.stop(ctx.currentTime + 0.8);
      } catch {}
    }

    _steps(steps) {
      for (const [kind, at, a, b] of steps) {
        if (kind === "tone" && typeof this.base.tone === "function") this.base.tone(a, {...b, at});
        else if (kind === "noise" && typeof this.base.noise === "function") this.base.noise({...a, at});
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

  LettersSound.CUES = CUES;
  LettersSound.VOICES = VOICES;
  LettersSound.LANDS = LANDS;
  ns.LettersSound = LettersSound;
})(window.MiftahGame || (window.MiftahGame = {}));
