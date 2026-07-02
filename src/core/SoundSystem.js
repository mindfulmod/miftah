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

    play(name) {
      if (!this.enabled || !this.unlock()) return;
      switch (name) {
        case "correct": // soft kalimba pluck
          this.tone(740, { dur: 0.16, gain: 0.12 });
          this.tone(1480, { dur: 0.1, gain: 0.045 });
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
