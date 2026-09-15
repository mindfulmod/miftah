// A small, explicit bridge between mini-game verdicts and durable learning
// evidence. Audio remains presentation: playing "correct" or replaying a prompt
// can never create an outcome by itself.
(function (ns) {
  const TYPES = new Set([
    "supported_visible_matching",
    "independent_listening",
    "assisted_response",
    "motor_assembly_participation",
  ]);

  class LearningSession {
    constructor(strength, clock) {
      this.strength = strength;
      this.clock = clock || (() => performance.now());
      this.round = 0;
      this.current = null;
    }

    beginPrompt(item) {
      if (!item || !item.id) {
        this.current = null;
        return;
      }
      // Replaying or re-presenting an active prompt is not a new round. A
      // completed round can begin again even when two consecutive targets share
      // the same id.
      if (this.current && !this.current.closed && this.current.itemId === item.id) return;
      this.round += 1;
      this.current = { itemId: item.id, startedAt: this.clock(), assisted: false, closed: false, verdicts: 0 };
    }

    report(raw) {
      if (!raw || !raw.itemId) return false;
      const requestedEvidence = raw.evidence || (raw.assisted
        ? "assisted_response"
        : raw.independent ? "independent_listening" : null);
      const requestedCorrect = typeof raw.correct === "boolean"
        ? raw.correct
        : (typeof raw.independent === "boolean" || raw.assisted === true) ? true : undefined;
      if (!TYPES.has(requestedEvidence)) return false;
      if (!this.current || this.current.itemId !== raw.itemId) this.beginPrompt({ id: raw.itemId });
      const state = this.current;
      if (!state || (requestedCorrect === true && state.closed)) return false;

      const assisted = raw.assisted === true || state.assisted;
      const evidence = assisted && typeof requestedCorrect === "boolean"
        ? "assisted_response"
        : requestedEvidence;
      const outcome = {
        itemId: raw.itemId,
        correct: requestedCorrect,
        evidence,
        baseEvidence: requestedEvidence,
        assisted,
        affectsStrength: raw.affectsStrength !== false,
        elapsedMs: Math.max(0, this.clock() - state.startedAt),
        round: this.round,
      };
      state.verdicts += 1;
      if (requestedCorrect === false) state.assisted = true;
      if (requestedCorrect === true || typeof requestedCorrect !== "boolean") state.closed = true;
      return this.strength?.recordOutcome?.(outcome) !== false ? outcome : false;
    }
  }

  ns.LettersLearning = { LearningSession, evidenceTypes: Array.from(TYPES) };
})(window.MiftahGame || (window.MiftahGame = {}));
