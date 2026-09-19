// Optional local recordings for Letter Garden. The game owns the job object;
// this adapter only owns loading, decoding, playback, and cancellation.
(function (ns) {
  class LettersVoice {
    constructor({ clips = {}, getContext, fetch: fetcher, timeoutMs = 3000, gapMs = 90, names = ns.LETTERS_DATA?.packs?.flatMap(pack => pack.letters.map(letter => letter.arName)) } = {}) {
      this.clips = clips || {};
      this.getContext = getContext || (() => null);
      this.fetch = fetcher || ((...args) => fetch(...args));
      this.timeoutMs = timeoutMs;
      this.gapMs = gapMs;
      this.names = new Set(Array.from(names || [], name => this.key(name)).filter(Boolean));
      this.available = Object.keys(this.clips).length > 0;
      this.buffers = new Map();
      this.pending = new Map();
      this.active = null;
      this.generation = 0;
    }

    key(text) {
      return typeof text === "string" ? text.normalize("NFC").trim() : "";
    }

    hasClip(text) {
      const key = this.key(text);
      return !!key && Object.prototype.hasOwnProperty.call(this.clips, key);
    }

    has(text) {
      const key = this.key(text);
      return this.hasClip(key) || !!this.sequence(key);
    }

    sequence(text) {
      const key = this.key(text);
      if (!key || !key.includes("،")) return null;
      const keys = key.split("،").map(part => this.key(part));
      return keys.length > 1 && keys.every(part => this.names.has(part) && this.hasClip(part)) ? keys : null;
    }

    play(text, job = {}, fallback) {
      const key = this.key(text);
      // A phrase recording always wins. Only compose an explicitly comma-separated
      // sequence when every exact curriculum name has a local recording.
      const keys = this.hasClip(key) ? [key] : this.sequence(key);
      if (!keys) return false;
      const generation = this.generation;
      let started = false;
      let finished = false;
      const fail = (error) => {
        if (finished || generation !== this.generation) return;
        finished = true;
        this.active = null;
        // Falling back after even one local clip would repeat part of the phrase.
        if (!started) {
          let didFallback = false;
          try { didFallback = fallback?.() === true; } catch {}
          if (didFallback) return;
        }
        job.onerror?.(error);
      };
      const run = async () => {
        try {
          // Decode the whole phrase before starting it, so a bad later clip cannot
          // leave the child hearing a partial local phrase followed by fallback TTS.
          const buffers = await Promise.all(keys.map(clip => this.load(this.clips[clip])));
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
          const startClip = (index) => {
            if (finished || generation !== this.generation) return;
            let source, gain;
            try {
              source = ctx.createBufferSource();
              gain = typeof ctx.createGain === "function" ? ctx.createGain() : null;
              source.buffer = buffers[index];
              if (gain) {
                gain.gain.value = 0.9;
                source.connect(gain);
                gain.connect(ctx.destination);
              } else {
                source.connect(ctx.destination);
              }
              let ended = false;
              source.onended = () => {
                if (ended || generation !== this.generation || finished) return;
                ended = true;
                if (this.active?.source === source) this.active = null;
                try { source.disconnect?.(); gain?.disconnect?.(); } catch {}
                if (index + 1 === buffers.length) {
                  finished = true;
                  job.onend?.();
                  return;
                }
                const timer = setTimeout(() => startClip(index + 1), this.gapMs);
                this.active = { timer, generation };
              };
              this.active = { source, gain, generation };
              source.start();
              if (!started) {
                started = true;
                job.onstart?.();
              }
            } catch (error) {
              source && (source.onended = null);
              if (this.active?.source === source) this.active = null;
              try { source?.disconnect?.(); gain?.disconnect?.(); } catch {}
              fail(error);
            }
          };
          startClip(0);
        } catch (error) {
          fail(error);
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
      try { clearTimeout(active.timer); } catch {}
      try { active.source.onended = null; active.source.stop(); } catch {}
      try { active.source.disconnect?.(); active.gain?.disconnect?.(); } catch {}
    }
  }

  ns.LettersVoice = LettersVoice;
})(window.MiftahGame || (window.MiftahGame = {}));
