// Real recitation playback — word-by-word clips and whole-ayah recitation
// (Mishary Rashid Alafasy) streamed from Quran.com's public CDNs. Word clips
// live at a deterministic path (wbw/SSS_AAA_WWW.mp3) that the data build
// verifies per word, storing an explicit path only for the exceptions.
// One shared element plays at a time, and every failure (offline, missing
// clip, autoplay policy) stays silent — recitation is a gift, never a blocker.
(function (ns) {
  const WORD_BASE = "https://audio.qurancdn.com/";
  const AYAH_BASE = "https://verses.quran.com/Alafasy/mp3/";
  const pad3 = (n) => String(n).padStart(3, "0");

  class RecitationAudio {
    // isEnabled: callback consulted before every play (the Codex passes the
    // shared sound toggle, so one switch quiets chimes and recitation alike).
    constructor(isEnabled) {
      this.isEnabled = isEnabled || (() => true);
      this.el = null; // lazily created on first play (autoplay policy)
    }

    playWord(path) {
      if (path) this.play(WORD_BASE + path);
    }

    playAyah(surah, ayah) {
      this.play(`${AYAH_BASE}${pad3(surah)}${pad3(ayah)}.mp3`);
    }

    play(src) {
      if (!this.isEnabled()) return;
      if (!this.el) {
        this.el = new Audio();
        this.el.preload = "auto";
      }
      // Reassigning .src while a previous clip is still loading/playing
      // trips "play() request was interrupted by a new load request" —
      // pausing first lets the browser settle before the new load starts,
      // instead of silently dropping the new clip.
      try { this.el.pause(); } catch {}
      this.el.currentTime = 0;
      this.el.src = src;
      const p = this.el.play();
      if (p && p.catch) p.catch(() => {});
    }

    stop() {
      if (this.el) this.el.pause();
    }
  }

  ns.RecitationAudio = RecitationAudio;
})(window.MiftahGame || (window.MiftahGame = {}));
