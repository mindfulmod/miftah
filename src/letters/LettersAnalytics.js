// Anonymous usage signals for the Letter Garden (Plausible, added 2026-10-03).
//
// What leaves the device, and nothing else:
//   • the page view Plausible counts itself (no cookies, no personal data);
//   • "Visit"     once per load, with coarse buckets for days played and strong letters;
//   • "Activity"  when a mini-game opens, with the game's id;
//   • "Item Strong" the first time an item's mastery crosses 0.7, with the item
//     (a letter, a voweled syllable or a decodable word) and its kind;
//   • "Graduated" when the Bismillah graduation is reached.
// No names, no profiles, no free text, no answers. A grown-up can switch it off
// (the grown-up page), which also sets Plausible's own plausible_ignore flag.
(function (ns) {
  const OFF_KEY = "quran-trainer:analytics-off";
  const STRONG_KEY = "quran-trainer:letters:analytics-strong";
  const STRONG_AT = 0.7;

  function store() {
    try { return window.localStorage; } catch { return null; }
  }

  const LettersAnalytics = {
    enabled() {
      const s = store();
      return !(s && s.getItem(OFF_KEY) === "1");
    },

    setEnabled(on) {
      const s = store();
      if (!s) return;
      try {
        if (on) { s.removeItem(OFF_KEY); s.removeItem("plausible_ignore"); }
        else { s.setItem(OFF_KEY, "1"); s.setItem("plausible_ignore", "true"); }
      } catch {}
    },

    track(name, props) {
      if (!this.enabled() || typeof window.plausible !== "function") return;
      try { window.plausible(name, props ? { props } : undefined); } catch {}
    },

    bucket(n, edges) {
      for (const [max, label] of edges) if (n <= max) return label;
      return edges[edges.length - 1][1];
    },

    visit({ days = 0, strong = 0 } = {}) {
      this.track("Visit", {
        days: this.bucket(days, [[1, "1"], [3, "2-3"], [7, "4-7"], [14, "8-14"], [30, "15-30"], [Infinity, "31+"]]),
        strong: this.bucket(strong, [[0, "0"], [4, "1-4"], [9, "5-9"], [18, "10-18"], [27, "19-27"], [Infinity, "28"]]),
      });
    },

    activity(id) {
      if (typeof id === "string" && id) this.track("Activity", { game: id });
    },

    // Called after a strength record. Sends each letter once per device.
    letterStrength(id, mastery) {
      if (!id || !(mastery >= STRONG_AT)) return;
      const s = store();
      let sent = [];
      try { sent = JSON.parse((s && s.getItem(STRONG_KEY)) || "[]"); } catch {}
      if (!Array.isArray(sent) || sent.includes(id)) return;
      sent.push(id);
      try { s && s.setItem(STRONG_KEY, JSON.stringify(sent)); } catch {}
      const kind = [...id].length === 1 ? "letter" : / /.test(id) || [...id].length > 3 ? "word" : "syllable";
      this.track("Item Strong", { item: id, kind });
    },

    graduated() {
      this.track("Graduated");
    },
  };

  ns.LettersAnalytics = LettersAnalytics;
})(window.MiftahGame || (window.MiftahGame = {}));
