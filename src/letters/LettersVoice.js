// Optional local recordings for Letter Garden. The game owns the job object;
// this adapter only owns loading, decoding, playback, and cancellation.
(function (ns) {
  class LettersVoice {
    constructor({ clips = {}, getContext, fetch: fetcher, timeoutMs = 3000 } = {}) {
      this.clips = clips || {};
      this.getContext = getContext || (() => null);
      this.fetch = fetcher || ((...args) => fetch(...args));
      this.timeoutMs = timeoutMs;
      this.available = Object.keys(this.clips).length > 0;
      this.buffers = new Map();
      this.pending = new Map();
      this.active = null;
      this.generation = 0;
    }

    key(text) {
      return typeof text === "string" ? text.normalize("NFC").trim() : "";
    }

    has(text) {
      const key = this.key(text);
      return !!key && Object.prototype.hasOwnProperty.call(this.clips, key);
    }

    play(text, job = {}, fallback) {
      const key = this.key(text);
      if (!this.has(key)) return false;
      const generation = this.generation;
      const url = this.clips[key];
      const run = async () => {
        try {
          const buffer = await this.load(url);
          if (generation !== this.generation) return;
          const ctx = this.getContext();
          if (!ctx || typeof ctx.createBufferSource !== "function" || !ctx.destination) throw new Error("audio context unavailable");
          if (ctx.state === "closed") throw new Error("audio context closed");
          if (ctx.state != null && ctx.state !== "running") {
            if (typeof ctx.resume !== "function") throw new Error("audio context suspended");
            await this.withTimeout(ctx.resume(), this.timeoutMs);
            if (ctx.state != null && ctx.state !== "running") throw new Error("audio context did not resume");
          }
          if (generation !== this.generation || ctx.state === "closed") return;

          const source = ctx.createBufferSource();
          const gain = typeof ctx.createGain === "function" ? ctx.createGain() : null;
          source.buffer = buffer;
          if (gain) {
            gain.gain.value = 0.9;
            source.connect(gain);
            gain.connect(ctx.destination);
          } else {
            source.connect(ctx.destination);
          }
          let ended = false;
          source.onended = () => {
            if (ended || generation !== this.generation) return;
            ended = true;
            if (this.active?.source === source) this.active = null;
            try { source.disconnect?.(); gain?.disconnect?.(); } catch {}
            job.onend?.();
          };
          this.active = { source, gain, generation };
          try {
            source.start();
          } catch (error) {
            source.onended = null;
            this.active = null;
            try { source.disconnect?.(); gain?.disconnect?.(); } catch {}
            throw error;
          }
          job.onstart?.();
        } catch (error) {
          if (generation !== this.generation) return;
          let started = false;
          try { started = fallback?.() === true; } catch {}
          if (!started) job.onerror?.(error);
        }
      };
      run();
      return true;
    }

    async load(url) {
      if (this.buffers.has(url)) return this.buffers.get(url);
      if (this.pending.has(url)) return this.pending.get(url);
      const pending = (async () => {
        let timer;
        try {
          const result = await Promise.race([
            (async () => {
              const response = await this.fetch(url);
              if (!response?.ok && response?.ok !== undefined) throw new Error("audio fetch failed");
              const bytes = await response.arrayBuffer();
              const ctx = this.getContext();
              if (!ctx || typeof ctx.decodeAudioData !== "function") throw new Error("audio decoder unavailable");
              return await ctx.decodeAudioData(bytes);
            })(),
            new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("audio timeout")), this.timeoutMs); }),
          ]);
          this.buffers.set(url, result);
          return result;
        } finally {
          clearTimeout(timer);
          this.pending.delete(url);
        }
      })();
      this.pending.set(url, pending);
      return pending;
    }

    async withTimeout(promise, ms) {
      let timer;
      try {
        return await Promise.race([
          Promise.resolve(promise),
          new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("audio resume timeout")), ms); }),
        ]);
      } finally {
        clearTimeout(timer);
      }
    }

    cancel() {
      this.generation += 1;
      const active = this.active;
      this.active = null;
      if (!active) return;
      try { active.source.onended = null; active.source.stop(); } catch {}
      try { active.source.disconnect?.(); active.gain?.disconnect?.(); } catch {}
    }
  }

  ns.LettersVoice = LettersVoice;
})(window.MiftahGame || (window.MiftahGame = {}));
