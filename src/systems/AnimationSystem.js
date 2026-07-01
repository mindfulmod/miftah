(function (ns) {
  ns.AnimationSystem = {
    bob(time, amount = 2, speed = 4) {
      return Math.sin(time * speed) * amount;
    },
    frame(time, count, fps) {
      return Math.floor(time * fps) % count;
    },
  };
})(window.MiftahGame || (window.MiftahGame = {}));
