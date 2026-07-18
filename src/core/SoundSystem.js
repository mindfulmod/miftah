// Dependency-free WebAudio sound design: soft synthesized chimes for the
// Codex and a gentle ambience layer for the island (water lap + occasional
// birdsong). Everything is quiet, warm and low-stress by design — feedback,
// not fanfare. The AudioContext is created lazily on the first user gesture
// (autoplay policy) and the mute preference persists across sessions.
(function (ns) {
  const PREF_KEY = "miftah-oasis:sound";

  class SoundSystem {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.ambience = null;
      this.birdTimer = null;
      try {
        this.enabled = localStorage.getItem(PREF_KEY) !== "off";
      } catch {
        this.enabled = true;
      }
    }

    // Must be called from a user-gesture handler at least once.
    unlock() {
      if (!this.ctx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return false;
        this.ctx = new Ctx();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.enabled ? 1 : 0;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
      return true;
    }

    toggle() {
      this.enabled = !this.enabled;
      try {
        localStorage.setItem(PREF_KEY, this.enabled ? "on" : "off");
      } catch {}
      if (this.master) {
        this.master.gain.setTargetAtTime(this.enabled ? 1 : 0, this.ctx.currentTime, 0.05);
      }
      return this.enabled;
    }

    // ---------- one-shot chimes ----------

    tone(freq, { at = 0, dur = 0.18, type = "sine", gain = 0.16, glideTo = null } = {}) {
      if (!this.ctx) return;
      const t0 = this.ctx.currentTime + at;
      const osc = this.ctx.createOscillator();
      const amp = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
      amp.gain.setValueAtTime(0, t0);
      amp.gain.linearRampToValueAtTime(gain, t0 + 0.012);
      amp.gain.exponentialRampToValueAtTime(0.0006, t0 + dur);
      osc.connect(amp).connect(this.master);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    }

    noise({ at = 0, dur = 0.2, gain = 0.05, filterType = "highpass", freq = 2400 } = {}) {
      if (!this.ctx) return;
      const t0 = this.ctx.currentTime + at;
      const frames = Math.ceil(this.ctx.sampleRate * dur);
      const buffer = this.ctx.createBuffer(1, frames, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < frames; i += 1) data[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = filterType;
      filter.frequency.value = freq;
      const amp = this.ctx.createGain();
      amp.gain.setValueAtTime(gain, t0);
      amp.gain.exponentialRampToValueAtTime(0.0006, t0 + dur);
      src.connect(filter).connect(amp).connect(this.master);
      src.start(t0);
    }

    // Melody moments (spec: specs/02): consecutive correct answers climb a
    // pentatonic scale, so a good run literally builds a little tune before
    // it settles at the top. `streak` is 1-based (the 1st correct in a row).
    streakMelody(streak) {
      if (!this.enabled || !this.unlock()) return;
      const penta = [523.25, 587.33, 659.25, 783.99, 880, 1046.5]; // C D E G A C
      const i = Math.min(Math.max(streak - 1, 0), penta.length - 1);
      const f = penta[i];
      this.tone(f, { dur: 0.18, type: "triangle", gain: 0.12 });
      this.tone(f * 2, { dur: 0.1, gain: 0.04 });
    }

    play(name) {
      if (!this.enabled || !this.unlock()) return;
      switch (name) {
        case "correct": // soft kalimba pluck
          this.tone(740, { dur: 0.16, gain: 0.12 });
          this.tone(1480, { dur: 0.1, gain: 0.045 });
          break;
        case "biomeArrival": // stepping into a new land — a soft open chord
          [392, 587.33, 783.99].forEach((f, i) =>
            this.tone(f, { at: i * 0.06, dur: 0.5, type: "triangle", gain: 0.09 }),
          );
          this.tone(1174.66, { at: 0.16, dur: 0.5, gain: 0.045 });
          break;
        case "wrong": // gentle low nudge, never harsh
          this.tone(196, { dur: 0.22, type: "triangle", gain: 0.1 });
          break;
        case "ayahComplete": // three-note rise
          [523.25, 659.25, 783.99].forEach((f, i) => this.tone(f, { at: i * 0.11, dur: 0.3, gain: 0.11 }));
          break;
        case "perfect": // the rise plus a high sparkle
          [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, { at: i * 0.1, dur: 0.32, gain: 0.11 }));
          this.noise({ at: 0.42, dur: 0.3, gain: 0.02, freq: 5200 });
          break;
        // ---- reward ladder: one bright bell per star as it lands ----
        // Each is a two-osc bell (fundamental + shimmering octave), rising in
        // pitch so 1→2→3 stars feels like climbing. Timed by the caller to the
        // star-drop animation.
        case "star1":
          this.tone(659.25, { dur: 0.42, type: "triangle", gain: 0.13 });
          this.tone(1318.5, { dur: 0.3, gain: 0.05 });
          break;
        case "star2":
          this.tone(830.61, { dur: 0.42, type: "triangle", gain: 0.13 });
          this.tone(1661.2, { dur: 0.3, gain: 0.05 });
          break;
        case "star3":
          this.tone(987.77, { dur: 0.46, type: "triangle", gain: 0.14 });
          this.tone(1975.5, { dur: 0.34, gain: 0.055 });
          break;
        // ---- the money moment: a full three-star fanfare ----
        // A warm rising arpeggio, a bright topping run, and a soft sparkle
        // tail — the biggest, happiest sound in the game.
        case "fanfare":
          [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
            this.tone(f, { at: i * 0.08, dur: 0.34, type: "triangle", gain: 0.12 }),
          );
          [1318.5, 1567.98, 2093].forEach((f, i) =>
            this.tone(f, { at: 0.34 + i * 0.075, dur: 0.4, gain: 0.075 }),
          );
          this.tone(261.63, { at: 0.34, dur: 0.5, type: "sine", gain: 0.08 }); // warm bass body
          this.noise({ at: 0.58, dur: 0.5, gain: 0.022, freq: 6000 });
          break;
        case "cheer2": // two-star: a happy little run
          [523.25, 659.25, 783.99].forEach((f, i) =>
            this.tone(f, { at: i * 0.09, dur: 0.32, type: "triangle", gain: 0.11 }),
          );
          this.noise({ at: 0.3, dur: 0.24, gain: 0.016, freq: 5400 });
          break;
        case "cheer1": // one-star: gentle, still encouraging
          [523.25, 659.25].forEach((f, i) => this.tone(f, { at: i * 0.1, dur: 0.34, gain: 0.1 }));
          break;
        case "worldClear": // finishing a whole world — grander than a round
          [392, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
            this.tone(f, { at: i * 0.085, dur: 0.38, type: "triangle", gain: 0.115 }),
          );
          [1318.5, 1975.5].forEach((f, i) =>
            this.tone(f, { at: 0.44 + i * 0.1, dur: 0.5, gain: 0.07 }),
          );
          this.noise({ at: 0.5, dur: 0.6, gain: 0.024, freq: 6200 });
          break;
        case "sticker": // peeling a new sticker off the sheet
          this.noise({ dur: 0.16, gain: 0.03, freq: 3400 }); // the peel
          this.tone(880, { at: 0.1, dur: 0.14, gain: 0.09, glideTo: 1318.5 });
          this.tone(1318.5, { at: 0.22, dur: 0.26, gain: 0.07 });
          break;
        case "record": // focus-round personal best
          [392, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, { at: i * 0.09, dur: 0.3, gain: 0.1 }));
          break;
        case "page": // page-turn swish
          this.noise({ dur: 0.22, gain: 0.03, freq: 1800 });
          break;
        case "click": // tiny UI tick
          this.tone(1250, { dur: 0.04, gain: 0.05 });
          break;
        case "seed": // payout blip
          this.tone(880, { dur: 0.1, gain: 0.07, glideTo: 1174 });
          break;
        case "hatch": // cutaway moment
          [659.25, 783.99, 987.77].forEach((f, i) => this.tone(f, { at: i * 0.14, dur: 0.4, gain: 0.1 }));
          break;
        default:
          break;
      }
    }

    // ---------- island ambience ----------
    // A slow-breathing filtered-noise "water" bed plus an occasional two-note
    // bird call. Starts after the first gesture; pauses with the mute toggle
    // via the master gain.

    startAmbience() {
      if (!this.unlock() || this.ambience) return;
      const ctx = this.ctx;

      const frames = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < frames; i += 1) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 420;
      const amp = ctx.createGain();
      amp.gain.value = 0.016;
      // slow swell so the water "breathes"
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.09;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.008;
      lfo.connect(lfoGain).connect(amp.gain);
      src.connect(filter).connect(amp).connect(this.master);
      src.start();
      lfo.start();
      this.ambience = { src, lfo };

      const chirp = () => {
        if (!this.ambience) return;
        if (this.enabled && Math.random() < 0.8) {
          const base = 1900 + Math.random() * 900;
          this.tone(base, { dur: 0.09, gain: 0.02, glideTo: base * 1.3 });
          this.tone(base * 1.12, { at: 0.14, dur: 0.07, gain: 0.016, glideTo: base * 0.9 });
        }
        this.birdTimer = setTimeout(chirp, 7000 + Math.random() * 12000);
      };
      this.birdTimer = setTimeout(chirp, 4000);
    }

    stopAmbience() {
      if (this.birdTimer) clearTimeout(this.birdTimer);
      this.birdTimer = null;
      if (this.ambience) {
        try {
          this.ambience.src.stop();
          this.ambience.lfo.stop();
        } catch {}
        this.ambience = null;
      }
    }
  }

  ns.SoundSystem = SoundSystem;
})(window.MiftahGame || (window.MiftahGame = {}));
