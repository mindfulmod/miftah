(function (ns) {
  class InputManager {
    constructor() {
      this.down = new Set();
      this.pressed = new Set();
      this.prevented = new Set([
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        " ",
        "Space",
      ]);

      window.addEventListener("keydown", (event) => {
        if (this.prevented.has(event.key) || this.prevented.has(event.code)) event.preventDefault();
        if (!this.down.has(event.code)) this.pressed.add(event.code);
        this.down.add(event.code);
      });

      window.addEventListener("keyup", (event) => {
        this.down.delete(event.code);
      });

      window.addEventListener("blur", () => {
        this.down.clear();
        this.pressed.clear();
      });
    }

    isDown(...codes) {
      return codes.some((code) => this.down.has(code));
    }

    wasPressed(...codes) {
      return codes.some((code) => this.pressed.has(code));
    }

    consume(...codes) {
      const matched = this.wasPressed(...codes);
      for (const code of codes) this.pressed.delete(code);
      return matched;
    }

    vector() {
      let x = 0;
      let y = 0;
      if (this.isDown("KeyA", "ArrowLeft")) x -= 1;
      if (this.isDown("KeyD", "ArrowRight")) x += 1;
      if (this.isDown("KeyW", "ArrowUp")) y -= 1;
      if (this.isDown("KeyS", "ArrowDown")) y += 1;
      if (x !== 0 && y !== 0) {
        x *= Math.SQRT1_2;
        y *= Math.SQRT1_2;
      }
      return { x, y };
    }

    endFrame() {
      this.pressed.clear();
    }
  }

  ns.InputManager = InputManager;
})(window.MiftahGame || (window.MiftahGame = {}));
