(function (ns) {
  class AssetLoader {
    constructor() {
      this.root = {};
      this.warnings = [];
    }

    async load(manifest) {
      this.root = await this.loadNode(manifest, "");
      return this.root;
    }

    get(key) {
      if (!key) return this.placeholder("missing-key");
      return key.split(".").reduce((node, part) => (node ? node[part] : null), this.root) || this.placeholder(key);
    }

    async loadNode(node, keyPath) {
      if (typeof node === "string") return this.loadImage(node, keyPath);
      if (Array.isArray(node)) {
        const loaded = [];
        for (let i = 0; i < node.length; i += 1) loaded.push(await this.loadNode(node[i], `${keyPath}.${i}`));
        return loaded;
      }
      const out = {};
      for (const [key, value] of Object.entries(node)) {
        out[key] = await this.loadNode(value, keyPath ? `${keyPath}.${key}` : key);
      }
      return out;
    }

    loadImage(src, keyPath) {
      return new Promise((resolve) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => {
          const message = `Missing asset: ${keyPath} -> ${src}`;
          this.warnings.push(message);
          console.warn(message);
          resolve(this.placeholder(keyPath));
        };
        image.src = src;
      });
    }

    placeholder(label) {
      const canvas = document.createElement("canvas");
      canvas.width = 48;
      canvas.height = 48;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#ef4d7a";
      ctx.fillRect(0, 0, 48, 48);
      ctx.fillStyle = "#4a1530";
      ctx.fillRect(4, 4, 40, 40);
      ctx.fillStyle = "#fff";
      ctx.font = "8px monospace";
      ctx.fillText("?", 21, 28);
      canvas.dataset.label = label;
      return canvas;
    }
  }

  ns.AssetLoader = AssetLoader;
})(window.MiftahGame || (window.MiftahGame = {}));
