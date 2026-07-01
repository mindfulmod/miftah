(function (ns) {
  window.addEventListener("DOMContentLoaded", async () => {
    const canvas = document.getElementById("game-canvas");
    const loading = document.getElementById("game-loading");
    const game = new ns.Game(canvas, loading);
    window.miftahIslandGame = game;
    try {
      await game.start();
    } catch (error) {
      console.error(error);
      if (loading) {
        loading.hidden = false;
        loading.textContent = "The island could not start. Check the browser console for details.";
      }
    }
  });
})(window.MiftahGame || (window.MiftahGame = {}));
