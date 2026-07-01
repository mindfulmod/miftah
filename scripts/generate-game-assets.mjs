import fs from "fs";
import path from "path";
import zlib from "zlib";

const outRoot = path.resolve("assets/generated");

const dirs = [
  "terrain",
  "buildings",
  "characters",
  "props",
  "animals",
  "crops",
  "ui",
];

for (const dir of dirs) fs.mkdirSync(path.join(outRoot, dir), { recursive: true });

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(width, height, pixels) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (width * 4 + 1);
    raw[row] = 0;
    pixels.copy(raw, row + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function color(hex, alpha = 255) {
  if (Array.isArray(hex)) return hex;
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
    alpha,
  ];
}

class Pix {
  constructor(width, height, bg = [0, 0, 0, 0]) {
    this.width = width;
    this.height = height;
    this.pixels = Buffer.alloc(width * height * 4);
    this.fillRect(0, 0, width, height, bg);
  }

  set(x, y, col) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const [sr, sg, sb, sa] = color(col);
    const i = (y * this.width + x) * 4;
    const da = this.pixels[i + 3] / 255;
    const a = sa / 255;
    const outA = a + da * (1 - a);
    if (outA <= 0) return;
    this.pixels[i] = Math.round((sr * a + this.pixels[i] * da * (1 - a)) / outA);
    this.pixels[i + 1] = Math.round((sg * a + this.pixels[i + 1] * da * (1 - a)) / outA);
    this.pixels[i + 2] = Math.round((sb * a + this.pixels[i + 2] * da * (1 - a)) / outA);
    this.pixels[i + 3] = Math.round(outA * 255);
  }

  fillRect(x, y, w, h, col) {
    for (let yy = Math.floor(y); yy < Math.ceil(y + h); yy++) {
      for (let xx = Math.floor(x); xx < Math.ceil(x + w); xx++) this.set(xx, yy, col);
    }
  }

  strokeRect(x, y, w, h, col, t = 2) {
    this.fillRect(x, y, w, t, col);
    this.fillRect(x, y + h - t, w, t, col);
    this.fillRect(x, y, t, h, col);
    this.fillRect(x + w - t, y, t, h, col);
  }

  ellipse(cx, cy, rx, ry, col) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, col);
      }
    }
  }

  ellipseStroke(cx, cy, rx, ry, col, t = 2) {
    this.ellipse(cx, cy, rx, ry, col);
    this.ellipse(cx, cy, Math.max(0, rx - t), Math.max(0, ry - t), [0, 0, 0, 0]);
  }

  line(x0, y0, x1, y1, col, t = 2) {
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    while (true) {
      this.fillRect(x0 - Math.floor(t / 2), y0 - Math.floor(t / 2), t, t, col);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  poly(points, col) {
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    const minX = Math.floor(Math.min(...xs));
    const maxX = Math.ceil(Math.max(...xs));
    const minY = Math.floor(Math.min(...ys));
    const maxY = Math.ceil(Math.max(...ys));
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        let inside = false;
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
          const xi = points[i][0];
          const yi = points[i][1];
          const xj = points[j][0];
          const yj = points[j][1];
          if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
        }
        if (inside) this.set(x, y, col);
      }
    }
  }
}

function save(rel, width, height, draw, bg = [0, 0, 0, 0]) {
  const img = new Pix(width, height, bg);
  draw(img);
  const file = path.join(outRoot, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, encodePng(width, height, img.pixels));
}

function shadow(p, cx, cy, rx, ry) {
  p.ellipse(cx, cy, rx, ry, [49, 35, 22, 45]);
}

function sparkle(p, x, y, col = "#ffffff") {
  p.fillRect(x, y + 1, 5, 1, color(col, 190));
  p.fillRect(x + 2, y - 1, 1, 5, color(col, 150));
}

function waterTile(p, base = "#1bbbd1", deep = "#0e8fb8") {
  p.fillRect(0, 0, 48, 48, base);
  p.fillRect(0, 33, 48, 15, color(deep, 70));
  p.line(5, 12, 19, 10, "#7de9f1", 2);
  p.line(29, 22, 42, 20, "#e8ffff", 2);
  p.line(10, 36, 26, 38, "#7de9f1", 2);
  sparkle(p, 35, 8, "#e8ffff");
}

function grassTile(p, flowers = false) {
  p.fillRect(0, 0, 48, 48, "#8ccc36");
  p.fillRect(0, 34, 48, 14, color("#65a92e", 80));
  for (let i = 0; i < 16; i++) {
    const x = (i * 17 + 5) % 46;
    const y = (i * 23 + 7) % 44;
    p.fillRect(x, y, 2, 5, i % 2 ? "#6ebd31" : "#a6dd46");
  }
  if (flowers) {
    for (const [x, y, c] of [
      [11, 14, "#fff2a0"],
      [31, 20, "#ff8ab3"],
      [23, 34, "#fff7f0"],
    ]) {
      p.ellipse(x, y, 3, 3, c);
      p.fillRect(x, y, 1, 1, "#d68b25");
    }
  }
}

function sandTile(p) {
  p.fillRect(0, 0, 48, 48, "#edc474");
  for (let i = 0; i < 18; i++) {
    const x = (i * 13 + 3) % 46;
    const y = (i * 19 + 9) % 44;
    p.fillRect(x, y, 2, 2, i % 2 ? "#d9aa5f" : "#ffe19a");
  }
}

function pathTile(p, variant = "fill") {
  grassTile(p, false);
  const dirt = "#d99c58";
  const outline = "#b98142";
  if (variant === "h") {
    p.fillRect(0, 16, 48, 18, outline);
    p.fillRect(0, 19, 48, 12, dirt);
  } else if (variant === "v") {
    p.fillRect(15, 0, 18, 48, outline);
    p.fillRect(18, 0, 12, 48, dirt);
  } else if (variant === "cross") {
    p.fillRect(0, 16, 48, 18, outline);
    p.fillRect(15, 0, 18, 48, outline);
    p.fillRect(0, 19, 48, 12, dirt);
    p.fillRect(18, 0, 12, 48, dirt);
  } else {
    p.fillRect(0, 0, 48, 48, "#d99c58");
    for (let i = 0; i < 9; i++) p.fillRect((i * 11) % 44, (i * 17) % 44, 3, 2, "#bf7f3b");
  }
}

function bridgeTile(p, dir = "h") {
  waterTile(p);
  const plank = "#bf7b2d";
  const edge = "#75461d";
  if (dir === "h") {
    p.fillRect(0, 15, 48, 21, edge);
    p.fillRect(0, 18, 48, 15, plank);
    for (let x = 5; x < 48; x += 10) p.line(x, 17, x, 34, "#8f5724", 2);
    p.fillRect(0, 13, 48, 3, "#e2a448");
    p.fillRect(0, 35, 48, 3, "#e2a448");
  } else {
    p.fillRect(14, 0, 21, 48, edge);
    p.fillRect(17, 0, 15, 48, plank);
    for (let y = 5; y < 48; y += 10) p.line(16, y, 34, y, "#8f5724", 2);
    p.fillRect(12, 0, 3, 48, "#e2a448");
    p.fillRect(35, 0, 3, 48, "#e2a448");
  }
}

function plazaTile(p, star = false) {
  p.fillRect(0, 0, 48, 48, "#e9c786");
  p.strokeRect(0, 0, 48, 48, "#c99b5a", 2);
  p.line(0, 24, 48, 24, color("#c99b5a", 120), 1);
  p.line(24, 0, 24, 48, color("#c99b5a", 120), 1);
  if (star) {
    p.poly(
      [
        [24, 6],
        [30, 18],
        [43, 24],
        [30, 30],
        [24, 43],
        [18, 30],
        [5, 24],
        [18, 18],
      ],
      "#29a8ba",
    );
    p.poly(
      [
        [24, 12],
        [28, 21],
        [37, 24],
        [28, 27],
        [24, 36],
        [20, 27],
        [11, 24],
        [20, 21],
      ],
      "#f4d984",
    );
  }
}

function shoreTile(p, side) {
  waterTile(p);
  const sand = "#edc474";
  const grass = "#8ccc36";
  const foam = "#f5ffff";
  const land = (x, y, w, h) => {
    p.fillRect(x, y, w, h, sand);
    p.fillRect(x, y, w, Math.max(0, h - 12), grass);
  };
  if (side === "n") land(0, 0, 48, 32);
  if (side === "s") land(0, 16, 48, 32);
  if (side === "w") land(0, 0, 32, 48);
  if (side === "e") land(16, 0, 32, 48);
  if (side === "ne") {
    p.ellipse(8, 8, 44, 30, grass);
    p.ellipse(8, 8, 42, 28, sand);
    p.ellipse(8, 8, 34, 20, grass);
  }
  if (side === "nw") {
    p.ellipse(40, 8, 44, 30, grass);
    p.ellipse(40, 8, 42, 28, sand);
    p.ellipse(40, 8, 34, 20, grass);
  }
  if (side === "se") {
    p.ellipse(8, 40, 44, 30, grass);
    p.ellipse(8, 40, 42, 28, sand);
    p.ellipse(8, 40, 34, 20, grass);
  }
  if (side === "sw") {
    p.ellipse(40, 40, 44, 30, grass);
    p.ellipse(40, 40, 42, 28, sand);
    p.ellipse(40, 40, 34, 20, grass);
  }
  p.line(3, 36, 45, 39, color(foam, 210), 2);
}

function irrigation(p, dir = "h") {
  grassTile(p, false);
  if (dir === "h") {
    p.fillRect(0, 17, 48, 15, "#6fa92d");
    p.fillRect(0, 19, 48, 11, "#1dbbd3");
    p.line(0, 18, 48, 18, "#f5ffff", 1);
  } else {
    p.fillRect(17, 0, 15, 48, "#6fa92d");
    p.fillRect(19, 0, 11, 48, "#1dbbd3");
    p.line(18, 0, 18, 48, "#f5ffff", 1);
  }
}

function drawTree(p, x, y, scale = 1, fruit = false) {
  shadow(p, x, y + 28 * scale, 17 * scale, 7 * scale);
  p.fillRect(x - 5 * scale, y + 14 * scale, 10 * scale, 25 * scale, "#8b542a");
  p.fillRect(x - 3 * scale, y + 14 * scale, 3 * scale, 25 * scale, "#c17737");
  for (const [dx, dy, r] of [
    [-16, 5, 17],
    [0, -3, 20],
    [18, 8, 16],
    [-4, 16, 18],
  ]) {
    p.ellipse(x + dx * scale, y + dy * scale, r * scale, r * scale, "#4d9a39");
    p.ellipse(x + dx * scale - 3, y + dy * scale - 3, (r - 6) * scale, (r - 6) * scale, "#75c84a");
  }
  if (fruit) {
    for (const [dx, dy] of [
      [-12, 5],
      [9, 3],
      [1, 15],
    ]) p.ellipse(x + dx * scale, y + dy * scale, 4 * scale, 4 * scale, "#f28b25");
  }
}

function drawPalm(p, x, y, scale = 1, dates = false) {
  shadow(p, x, y + 32 * scale, 14 * scale, 6 * scale);
  p.line(x, y + 36 * scale, x + 5 * scale, y + 8 * scale, "#8b542a", Math.max(3, 5 * scale));
  p.line(x - 2 * scale, y + 36 * scale, x + 3 * scale, y + 8 * scale, "#c17737", Math.max(1, 2 * scale));
  const leaves = [
    [-28, 6],
    [-20, -8],
    [0, -15],
    [20, -9],
    [28, 6],
    [8, 6],
  ];
  for (const [dx, dy] of leaves) p.line(x + 4 * scale, y + 9 * scale, x + dx * scale, y + dy * scale, "#2f8d36", Math.max(4, 5 * scale));
  if (dates) {
    p.ellipse(x + 2 * scale, y + 14 * scale, 4 * scale, 6 * scale, "#d08a1c");
    p.ellipse(x - 4 * scale, y + 14 * scale, 3 * scale, 5 * scale, "#d08a1c");
  }
}

function hex(p, cx, cy, r, fill, outline = "#9d5a15") {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i + Math.PI / 6;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  p.poly(pts, outline);
  const inner = pts.map(([x, y]) => [cx + (x - cx) * 0.78, cy + (y - cy) * 0.78]);
  p.poly(inner, fill);
}

function arch(p, w, h, gold = true) {
  shadow(p, w / 2, h - 18, w * 0.36, 10);
  const trim = gold ? "#a76618" : "#956639";
  const body = gold ? "#f2b93e" : "#e3be78";
  p.fillRect(w * 0.24, h * 0.36, w * 0.52, h * 0.52, trim);
  p.fillRect(w * 0.3, h * 0.41, w * 0.4, h * 0.46, body);
  p.ellipse(w / 2, h * 0.36, w * 0.27, h * 0.25, trim);
  p.ellipse(w / 2, h * 0.39, w * 0.19, h * 0.18, body);
  p.fillRect(w * 0.38, h * 0.55, w * 0.24, h * 0.34, "#1b8aa0");
  p.ellipse(w * 0.5, h * 0.64, w * 0.09, h * 0.08, "#fff1bd");
  p.line(w * 0.44, h * 0.64, w * 0.56, h * 0.64, "#8a6f36", 2);
  p.fillRect(w * 0.16, h * 0.7, w * 0.12, h * 0.23, trim);
  p.fillRect(w * 0.72, h * 0.7, w * 0.12, h * 0.23, trim);
  p.ellipse(w * 0.22, h * 0.68, 8, 13, "#ffd65a");
  p.ellipse(w * 0.78, h * 0.68, 8, 13, "#ffd65a");
}

function barn(p) {
  shadow(p, 64, 93, 46, 12);
  p.fillRect(24, 37, 82, 55, "#ba4c2d");
  p.strokeRect(24, 37, 82, 55, "#63321e", 3);
  p.poly([[18, 42], [64, 10], [111, 42]], "#6d331f");
  p.poly([[25, 40], [64, 17], [104, 40]], "#e17438");
  p.fillRect(49, 63, 30, 29, "#7f4927");
  p.strokeRect(49, 63, 30, 29, "#f6bf83", 2);
  p.line(49, 63, 79, 92, "#f6bf83", 2);
  p.line(79, 63, 49, 92, "#f6bf83", 2);
  p.fillRect(86, 18, 14, 74, "#b97032");
  p.strokeRect(86, 18, 14, 74, "#613519", 2);
  p.ellipse(93, 16, 9, 8, "#d8903d");
}

function stable(p) {
  shadow(p, 64, 93, 43, 12);
  p.fillRect(24, 44, 82, 47, "#9a6331");
  p.strokeRect(24, 44, 82, 47, "#573316", 3);
  p.poly([[18, 45], [64, 17], [110, 45]], "#184f63");
  p.poly([[26, 43], [64, 22], [102, 43]], "#2e9cb1");
  p.fillRect(49, 60, 30, 31, "#5e3518");
  p.strokeRect(49, 60, 30, 31, "#d8a453", 2);
}

function fountain(p) {
  shadow(p, 48, 75, 34, 10);
  p.ellipse(48, 63, 35, 17, "#9f7c50");
  p.ellipse(48, 60, 31, 14, "#e5bf75");
  p.ellipse(48, 56, 23, 10, "#1ab8d5");
  p.fillRect(42, 31, 12, 24, "#bd8950");
  p.ellipse(48, 32, 15, 8, "#e8c985");
  p.ellipse(48, 28, 9, 5, "#22bad4");
  p.line(48, 12, 48, 28, "#ddffff", 2);
  p.line(40, 20, 31, 36, "#ddffff", 2);
  p.line(56, 20, 65, 36, "#ddffff", 2);
}

function drawFence(p, vertical = false) {
  shadow(p, 32, 50, 24, 5);
  if (vertical) {
    p.fillRect(24, 3, 8, 58, "#7b4a21");
    p.fillRect(33, 3, 8, 58, "#7b4a21");
    p.fillRect(22, 8, 22, 7, "#d2923c");
    p.fillRect(22, 33, 22, 7, "#d2923c");
  } else {
    p.fillRect(5, 26, 54, 8, "#7b4a21");
    p.fillRect(5, 38, 54, 8, "#7b4a21");
    p.fillRect(9, 18, 8, 37, "#d2923c");
    p.fillRect(47, 18, 8, 37, "#d2923c");
  }
}

function smallHouse(p, roof = "#e16631", body = "#f0c47a") {
  shadow(p, 48, 69, 31, 9);
  p.fillRect(18, 34, 59, 36, body);
  p.strokeRect(18, 34, 59, 36, "#80522b", 3);
  p.poly([[12, 36], [48, 12], [84, 36]], "#7a331e");
  p.poly([[18, 34], [48, 17], [78, 34]], roof);
  p.fillRect(39, 49, 18, 21, "#74451f");
}

function propSign(p, icon = "seed") {
  shadow(p, 24, 40, 13, 5);
  p.fillRect(21, 25, 6, 21, "#7f4a1f");
  p.fillRect(8, 9, 32, 24, "#e9c371");
  p.strokeRect(8, 9, 32, 24, "#8b5724", 3);
  if (icon === "bee") {
    p.ellipse(24, 21, 8, 5, "#e3a91e");
    p.line(21, 16, 21, 26, "#4a2d16", 2);
    p.line(27, 16, 27, 26, "#4a2d16", 2);
  } else if (icon === "crop") {
    p.fillRect(23, 23, 3, 7, "#3b8c34");
    p.ellipse(19, 19, 6, 4, "#6ec344");
    p.ellipse(29, 18, 6, 4, "#6ec344");
  } else {
    p.ellipse(24, 20, 7, 9, "#6ec344");
  }
}

function character(p, dir = "down", step = 0, coat = "#15859a", scarf = "#f0a229") {
  const bob = step === 2 ? 1 : step === 1 ? -1 : 0;
  shadow(p, 24, 55, 12, 5);
  const leftLeg = 18 + (step === 1 ? -2 : 0);
  const rightLeg = 28 + (step === 2 ? 2 : 0);
  p.fillRect(leftLeg, 41, 7, 12, "#5d3a21");
  p.fillRect(rightLeg, 41, 7, 12, "#5d3a21");
  p.fillRect(14, 25 + bob, 20, 22, "#0f5261");
  p.fillRect(17, 25 + bob, 14, 21, coat);
  p.fillRect(12, 29 + bob, 5, 16, "#f0bd79");
  p.fillRect(33, 29 + bob, 5, 16, "#f0bd79");
  p.ellipse(24, 19 + bob, 12, 13, "#f2c388");
  p.ellipse(24, 10 + bob, 13, 8, "#733d1d");
  p.fillRect(13, 15 + bob, 22, 7, "#733d1d");
  p.fillRect(15, 24 + bob, 18, 5, scarf);
  if (dir === "down") {
    p.fillRect(19, 19 + bob, 3, 3, "#2a1a12");
    p.fillRect(28, 19 + bob, 3, 3, "#2a1a12");
    p.fillRect(22, 25 + bob, 6, 2, "#b95342");
  } else if (dir === "up") {
    p.fillRect(13, 18 + bob, 22, 8, "#733d1d");
  } else if (dir === "left") {
    p.fillRect(16, 19 + bob, 3, 3, "#2a1a12");
    p.fillRect(14, 22 + bob, 4, 2, "#b95342");
  } else {
    p.fillRect(29, 19 + bob, 3, 3, "#2a1a12");
    p.fillRect(30, 22 + bob, 4, 2, "#b95342");
  }
}

function npc(p, palette) {
  character(p, "down", 0, palette[0], palette[1]);
  p.fillRect(12, 9, 24, 8, palette[2]);
  p.ellipse(24, 10, 10, 6, palette[2]);
}

function cowLike(p, opts = {}) {
  const scale = opts.scale || 1;
  const ox = 32;
  const oy = 34;
  shadow(p, ox, oy + 17 * scale, 22 * scale, 7 * scale);
  p.ellipse(ox, oy, 22 * scale, 15 * scale, opts.body || "#f7efdb");
  p.ellipse(ox + 22 * scale, oy - 4 * scale, 12 * scale, 11 * scale, opts.head || opts.body || "#f7efdb");
  p.ellipse(ox - 6 * scale, oy - 3 * scale, 7 * scale, 5 * scale, opts.spot || "#30302c");
  p.fillRect(ox - 14 * scale, oy + 11 * scale, 6 * scale, 15 * scale, opts.leg || "#4f3425");
  p.fillRect(ox + 8 * scale, oy + 11 * scale, 6 * scale, 15 * scale, opts.leg || "#4f3425");
  p.fillRect(ox + 28 * scale, oy - 5 * scale, 2 * scale, 3 * scale, "#252019");
  p.fillRect(ox + 15 * scale, oy - 16 * scale, 4 * scale, 7 * scale, opts.horn || "#f0cf80");
  p.fillRect(ox + 26 * scale, oy - 15 * scale, 4 * scale, 7 * scale, opts.horn || "#f0cf80");
}

function horseLike(p, opts = {}) {
  const s = opts.scale || 1;
  const ox = 31;
  const oy = 34;
  shadow(p, ox, oy + 17 * s, 22 * s, 7 * s);
  p.ellipse(ox, oy, 22 * s, 13 * s, opts.body || "#b76b25");
  p.ellipse(ox + 22 * s, oy - 9 * s, 10 * s, 15 * s, opts.body || "#b76b25");
  p.fillRect(ox + 20 * s, oy - 24 * s, 5 * s, 11 * s, opts.mane || "#51301a");
  p.line(ox - 21 * s, oy - 4 * s, ox - 32 * s, oy + 6 * s, opts.mane || "#51301a", 4 * s);
  p.fillRect(ox - 13 * s, oy + 10 * s, 5 * s, 16 * s, "#5f351b");
  p.fillRect(ox + 8 * s, oy + 10 * s, 5 * s, 16 * s, "#5f351b");
}

function sheepLike(p, opts = {}) {
  const s = opts.scale || 1;
  const ox = 31;
  const oy = 34;
  shadow(p, ox, oy + 17 * s, 21 * s, 7 * s);
  for (const [dx, dy, r] of [
    [-14, -2, 10],
    [-4, -7, 12],
    [8, -3, 13],
    [16, 5, 10],
    [-3, 7, 13],
  ]) p.ellipse(ox + dx * s, oy + dy * s, r * s, r * s, opts.wool || "#fff3d7");
  p.ellipse(ox + 22 * s, oy, 10 * s, 9 * s, opts.face || "#f2bd8b");
  p.fillRect(ox - 9 * s, oy + 12 * s, 5 * s, 13 * s, "#5f351b");
  p.fillRect(ox + 8 * s, oy + 12 * s, 5 * s, 13 * s, "#5f351b");
}

function catDog(p, opts = {}) {
  const s = opts.scale || 1;
  const ox = 31;
  const oy = 37;
  shadow(p, ox, oy + 13 * s, 17 * s, 6 * s);
  p.ellipse(ox, oy, 17 * s, 11 * s, opts.body || "#d8732c");
  p.ellipse(ox + 17 * s, oy - 7 * s, 11 * s, 10 * s, opts.body || "#d8732c");
  p.poly([[ox + 9 * s, oy - 15 * s], [ox + 13 * s, oy - 25 * s], [ox + 17 * s, oy - 13 * s]], opts.ear || opts.body || "#d8732c");
  p.poly([[ox + 23 * s, oy - 15 * s], [ox + 28 * s, oy - 24 * s], [ox + 29 * s, oy - 11 * s]], opts.ear || opts.body || "#d8732c");
  p.line(ox - 15 * s, oy - 2 * s, ox - 25 * s, oy - 12 * s, opts.tail || opts.body || "#d8732c", Math.max(3, 4 * s));
  p.fillRect(ox + 19 * s, oy - 9 * s, 2 * s, 2 * s, "#2d2119");
}

function snakeLike(p, opts = {}) {
  const s = opts.scale || 1;
  shadow(p, 32, 47, 22 * s, 5 * s);
  p.line(12, 42, 25, 34, opts.body || "#579d31", Math.max(4, 7 * s));
  p.line(25, 34, 39, 42, opts.body || "#579d31", Math.max(4, 7 * s));
  p.line(39, 42, 52, 33, opts.body || "#579d31", Math.max(4, 7 * s));
  p.ellipse(53, 31, 8 * s, 7 * s, opts.body || "#579d31");
  p.fillRect(55, 29, 2, 2, "#14140c");
  p.line(59, 31, 63, 29, "#d44233", 1);
}

function elephantLike(p, opts = {}) {
  const s = opts.scale || 1;
  shadow(p, 31, 42, 24 * s, 8 * s);
  p.ellipse(28, 34, 22 * s, 16 * s, opts.body || "#8f9296");
  p.ellipse(47, 28, 14 * s, 13 * s, opts.body || "#8f9296");
  p.ellipse(40, 28, 13 * s, 15 * s, color("#b4b6b9", 230));
  p.line(55, 33, 60, 48, opts.body || "#8f9296", Math.max(4, 5 * s));
  p.fillRect(18, 46, 7, 12, "#676b70");
  p.fillRect(34, 46, 7, 12, "#676b70");
}

function camelLike(p, opts = {}) {
  const s = opts.scale || 1;
  shadow(p, 30, 45, 24 * s, 7 * s);
  p.ellipse(28, 35, 22 * s, 12 * s, opts.body || "#bf7a33");
  p.ellipse(22, 25, 9 * s, 12 * s, opts.hump || "#d28a3a");
  p.ellipse(47, 23, 8 * s, 13 * s, opts.body || "#bf7a33");
  p.line(42, 25, 47, 12, opts.body || "#bf7a33", Math.max(4, 5 * s));
  p.ellipse(50, 10, 8 * s, 6 * s, opts.body || "#bf7a33");
  p.fillRect(17, 45, 5, 14, "#6b3b1c");
  p.fillRect(35, 45, 5, 14, "#6b3b1c");
}

function birdLike(p, opts = {}) {
  const s = opts.scale || 1;
  shadow(p, 31, 48, 15 * s, 5 * s);
  p.ellipse(30, 35, 14 * s, 11 * s, opts.body || "#28445c");
  p.ellipse(43, 29, 8 * s, 8 * s, opts.head || opts.body || "#28445c");
  p.poly([[49, 29], [61, 25], [51, 34]], opts.beak || "#d88b24");
  p.line(21, 33, 9, 26, opts.wing || "#426d8a", Math.max(3, 5 * s));
  p.line(26, 46, 23, 57, "#5a321c", Math.max(1, 2 * s));
  p.line(35, 45, 37, 57, "#5a321c", Math.max(1, 2 * s));
}

function insectLike(p, opts = {}) {
  const s = opts.scale || 1;
  shadow(p, 31, 46, 14 * s, 5 * s);
  p.ellipse(23, 35, 10 * s, 8 * s, opts.body || "#e0a91f");
  p.ellipse(35, 35, 12 * s, 9 * s, opts.body2 || opts.body || "#e0a91f");
  p.ellipse(44, 33, 7 * s, 7 * s, opts.head || "#4b2915");
  if (opts.wings) {
    p.ellipse(28, 25, 8 * s, 9 * s, color("#d9ffff", 155));
    p.ellipse(37, 24, 8 * s, 9 * s, color("#d9ffff", 155));
  }
  p.line(29, 28, 29, 42, "#3d2713", Math.max(1, 2 * s));
  p.line(36, 28, 36, 42, "#3d2713", Math.max(1, 2 * s));
}

function fishLike(p, opts = {}) {
  const s = opts.scale || 1;
  shadow(p, 31, 42, 21 * s, 5 * s);
  p.ellipse(30, 33, 20 * s, 11 * s, opts.body || "#238fc0");
  p.poly([[12, 33], [0, 22], [0, 44]], opts.tail || "#1b6994");
  p.poly([[31, 25], [39, 12], [42, 29]], opts.fin || "#64cbe4");
  p.fillRect(43, 29, 3, 3, "#14222f");
  p.line(44, 38, 52, 40, "#e6ffff", Math.max(1, 2 * s));
}

function cropStage(p, stage, kind = "wheat") {
  shadow(p, 24, 39, 15, 4);
  p.fillRect(7, 26, 34, 17, "#8f5a2c");
  p.strokeRect(7, 26, 34, 17, "#62381c", 2);
  if (stage === "empty") return;
  if (stage === "seed") {
    p.ellipse(19, 33, 2, 2, "#e6c15d");
    p.ellipse(28, 35, 2, 2, "#e6c15d");
    return;
  }
  const heights = { sprout: 9, medium: 16, mature: 24 };
  const h = heights[stage] || 16;
  const cols = {
    wheat: "#e0b323",
    berries: "#3fa13d",
    leafy: "#58bd3d",
    carrot: "#3fa13d",
    date_palm: "#4a9f38",
  };
  for (const x of [17, 24, 31]) {
    p.line(x, 34, x, 34 - h, cols[kind] || "#55a83c", 3);
    p.ellipse(x - 3, 31 - h / 2, 4, 3, "#6ec344");
    p.ellipse(x + 3, 29 - h / 2, 4, 3, "#6ec344");
  }
  if (stage === "mature") {
    if (kind === "wheat") for (const x of [17, 24, 31]) p.ellipse(x, 10, 3, 6, "#edc238");
    if (kind === "berries") for (const [x, y] of [[18, 17], [29, 20], [25, 13]]) p.ellipse(x, y, 4, 4, "#235fd0");
    if (kind === "leafy") p.ellipse(24, 21, 13, 9, "#6dce45");
    if (kind === "carrot") for (const x of [18, 24, 30]) p.ellipse(x, 36, 4, 6, "#e97324");
    if (kind === "date_palm") drawPalm(p, 24, 23, 0.46, true);
  }
}

function uiPanel(p, w, h) {
  p.fillRect(0, 0, w, h, color("#17120f", 230));
  p.strokeRect(0, 0, w, h, "#7b4a21", 4);
  p.strokeRect(5, 5, w - 10, h - 10, "#f0c15f", 2);
}

// Terrain.
save("terrain/terrain_water_01.png", 48, 48, (p) => waterTile(p));
save("terrain/terrain_water_ripple.png", 48, 48, (p) => {
  waterTile(p);
  p.ellipseStroke(24, 24, 16, 9, color("#e8ffff", 140), 2);
  p.ellipseStroke(24, 24, 8, 4, color("#e8ffff", 160), 2);
});
save("terrain/terrain_lagoon_01.png", 48, 48, (p) => waterTile(p, "#0b76b6", "#064b87"));
save("terrain/terrain_water_lily.png", 48, 48, (p) => {
  waterTile(p);
  for (const [x, y] of [[16, 23], [32, 30]]) {
    p.ellipse(x, y, 7, 4, "#5cbd39");
    p.line(x, y, x + 4, y - 3, "#17842d", 1);
  }
});
save("terrain/terrain_grass_01.png", 48, 48, (p) => grassTile(p));
save("terrain/terrain_grass_flowers.png", 48, 48, (p) => grassTile(p, true));
save("terrain/terrain_sand_01.png", 48, 48, sandTile);
save("terrain/path_horizontal.png", 48, 48, (p) => pathTile(p, "h"));
save("terrain/path_vertical.png", 48, 48, (p) => pathTile(p, "v"));
save("terrain/path_cross.png", 48, 48, (p) => pathTile(p, "cross"));
for (const name of ["ne", "nw", "se", "sw"]) save(`terrain/path_corner_${name}.png`, 48, 48, (p) => pathTile(p, "cross"));
for (const name of ["n", "s", "e", "w"]) save(`terrain/path_t_${name}.png`, 48, 48, (p) => pathTile(p, "cross"));
save("terrain/path_fill.png", 48, 48, (p) => pathTile(p, "fill"));
save("terrain/bridge_horizontal.png", 48, 48, (p) => bridgeTile(p, "h"));
save("terrain/bridge_vertical.png", 48, 48, (p) => bridgeTile(p, "v"));
save("terrain/dock_tile.png", 48, 48, (p) => bridgeTile(p, "h"));
save("terrain/courtyard_plain.png", 48, 48, (p) => plazaTile(p, false));
save("terrain/courtyard_star.png", 48, 48, (p) => plazaTile(p, true));
save("terrain/irrigation_horizontal.png", 48, 48, (p) => irrigation(p, "h"));
save("terrain/irrigation_vertical.png", 48, 48, (p) => irrigation(p, "v"));
save("terrain/irrigation_cross.png", 48, 48, (p) => {
  irrigation(p, "h");
  p.fillRect(19, 0, 11, 48, "#1dbbd3");
});
for (const side of ["n", "s", "e", "w", "ne", "nw", "se", "sw"]) {
  save(`terrain/terrain_shore_${side}.png`, 48, 48, (p) => shoreTile(p, side));
}
save("terrain/waterline_horizontal.png", 48, 16, (p) => p.line(0, 8, 48, 8, "#f7ffff", 3));
save("terrain/waterline_vertical.png", 16, 48, (p) => p.line(8, 0, 8, 48, "#f7ffff", 3));
save("terrain/tiny_sandbar.png", 48, 48, (p) => {
  waterTile(p);
  p.ellipse(24, 27, 15, 8, "#efcf86");
  p.ellipse(24, 25, 10, 5, "#f4dd9b");
});

// Buildings and props.
save("buildings/building_reading_arch.png", 128, 128, (p) => arch(p, 128, 128, true));
save("buildings/building_pavilion.png", 112, 96, (p) => {
  shadow(p, 56, 83, 41, 10);
  p.ellipse(56, 30, 40, 16, "#14596b");
  p.ellipse(56, 26, 34, 13, "#2ba3b8");
  p.fillRect(20, 34, 7, 45, "#7b4a21");
  p.fillRect(85, 34, 7, 45, "#7b4a21");
  p.fillRect(35, 39, 42, 33, "#e4bd79");
  p.strokeRect(35, 39, 42, 33, "#986835", 3);
  p.fillRect(41, 63, 30, 8, "#2296ad");
});
save("buildings/building_honeycomb_hub.png", 128, 104, (p) => {
  shadow(p, 62, 88, 43, 12);
  for (const [x, y] of [[38, 30], [62, 30], [86, 30], [50, 51], [74, 51], [38, 72], [62, 72], [86, 72]]) hex(p, x, y, 18, "#ffc03a");
  p.fillRect(51, 72, 24, 21, "#8b4b17");
  p.strokeRect(51, 72, 24, 21, "#542d0f", 2);
  p.ellipse(102, 75, 10, 13, "#f3bd42");
});
save("buildings/building_barn.png", 128, 104, barn);
save("buildings/building_stable.png", 128, 104, stable);
save("buildings/building_dog_house.png", 72, 72, (p) => smallHouse(p, "#de6c32", "#f1d092"));
save("buildings/building_cat_nook.png", 72, 72, (p) => smallHouse(p, "#1d879c", "#eed091"));
save("props/prop_fountain.png", 96, 96, fountain);
save("props/prop_geometric_mat_blue.png", 72, 48, (p) => {
  shadow(p, 36, 40, 25, 5);
  p.fillRect(7, 8, 58, 30, "#168ca4");
  p.strokeRect(7, 8, 58, 30, "#f1c35e", 3);
  p.poly([[36, 11], [48, 23], [36, 35], [24, 23]], "#f0c15f");
  p.poly([[36, 16], [43, 23], [36, 30], [29, 23]], "#125f70");
});
save("props/prop_lantern.png", 48, 64, (p) => {
  shadow(p, 24, 57, 8, 3);
  p.fillRect(22, 13, 4, 45, "#6f421e");
  p.ellipse(24, 20, 7, 9, "#ffc842");
  p.strokeRect(18, 18, 12, 18, "#8b5724", 2);
  p.fillRect(14, 36, 20, 4, "#8b5724");
});
save("props/prop_palm.png", 80, 96, (p) => drawPalm(p, 40, 36, 1.05, false));
save("props/prop_date_palm.png", 80, 96, (p) => drawPalm(p, 40, 36, 1.05, true));
save("props/prop_tree.png", 96, 96, (p) => drawTree(p, 48, 32, 1, false));
save("props/prop_orange_tree.png", 96, 96, (p) => drawTree(p, 48, 32, 1, true));
save("props/prop_dove_nesting_tree.png", 112, 112, (p) => {
  drawTree(p, 56, 37, 1.1, false);
  p.ellipse(56, 43, 27, 10, "#6f421e");
  p.ellipse(56, 40, 19, 6, "#c0893f");
});
save("props/prop_ababeel_perches.png", 96, 96, (p) => {
  shadow(p, 48, 82, 34, 8);
  for (const x of [24, 48, 72]) p.fillRect(x - 4, 20, 8, 61, "#8b5724");
  p.line(20, 24, 76, 24, "#b9782e", 6);
  p.line(26, 48, 70, 48, "#b9782e", 6);
});
save("props/prop_fish_motif.png", 112, 72, (p) => {
  p.fillRect(0, 0, 112, 72, [0, 0, 0, 0]);
  p.ellipse(55, 35, 34, 16, color("#8be7f6", 120));
  p.poly([[23, 35], [5, 21], [5, 50]], color("#8be7f6", 120));
  p.fillRect(78, 30, 4, 4, color("#eaffff", 190));
  p.line(48, 22, 59, 35, color("#eaffff", 110), 2);
  p.line(48, 48, 59, 35, color("#eaffff", 110), 2);
});
save("props/prop_spider_grotto.png", 112, 96, (p) => {
  shadow(p, 56, 83, 40, 10);
  p.ellipse(56, 60, 42, 28, "#76736d");
  p.ellipse(56, 66, 27, 20, "#2d2c30");
  p.line(76, 48, 92, 75, "#f4ffff", 1);
  p.line(92, 48, 76, 75, "#f4ffff", 1);
  p.line(75, 61, 93, 61, "#f4ffff", 1);
});
save("props/prop_snake_habitat.png", 112, 96, (p) => {
  shadow(p, 56, 83, 40, 10);
  p.ellipse(56, 65, 44, 22, "#e8bd6f");
  p.ellipse(66, 51, 29, 25, "#c98e4f");
  p.ellipse(66, 58, 19, 18, "#e8bd6f");
  p.line(23, 68, 46, 60, "#ad7b4a", 3);
  p.line(46, 60, 70, 69, "#ad7b4a", 3);
});
save("props/prop_camel_spring.png", 112, 96, (p) => {
  shadow(p, 56, 83, 39, 10);
  p.ellipse(56, 59, 35, 17, "#ddba73");
  p.ellipse(56, 55, 24, 10, "#22b9d1");
  arch(p, 112, 96, false);
});
save("props/prop_elephant_grove.png", 128, 96, (p) => {
  drawPalm(p, 27, 30, 0.75, false);
  drawPalm(p, 99, 30, 0.75, false);
  p.ellipse(64, 69, 27, 12, "#22b9d1");
  for (const [x, y] of [[48, 79], [62, 83], [79, 77]]) p.ellipse(x, y, 8, 5, "#bca16d");
});
save("props/prop_crow_rocky_orchard.png", 112, 96, (p) => {
  drawTree(p, 75, 34, 0.75, true);
  for (const [x, y, r] of [[29, 72, 16], [46, 66, 14], [61, 76, 17]]) p.ellipse(x, y, r, r * 0.72, "#77716a");
  p.fillRect(25, 34, 6, 42, "#553314");
  p.line(17, 35, 41, 35, "#7b4a21", 4);
});
for (const name of ["bush", "flowers", "reeds", "rocks", "barrel", "jar", "crate", "hay", "lily_pads"]) {
  save(`props/prop_${name}.png`, 48, 48, (p) => {
    shadow(p, 24, 40, 16, 4);
    if (name === "bush") for (const [x, y] of [[15, 28], [25, 22], [34, 29], [24, 34]]) p.ellipse(x, y, 11, 9, "#4fa33d");
    if (name === "flowers") {
      p.ellipse(14, 31, 7, 5, "#4fa33d");
      p.ellipse(27, 30, 8, 5, "#4fa33d");
      for (const [x, y, c] of [[14, 25, "#f28bb4"], [26, 23, "#fff3a5"], [33, 30, "#a98bff"]]) p.ellipse(x, y, 4, 4, c);
    }
    if (name === "reeds") for (const x of [14, 19, 25, 31, 36]) {
      p.line(x, 39, x + (x % 2 ? -4 : 3), 13, "#4f9a34", 3);
      p.ellipse(x + (x % 2 ? -4 : 3), 12, 3, 8, "#bd8432");
    }
    if (name === "rocks") for (const [x, y, r] of [[16, 33, 9], [27, 28, 11], [36, 34, 8]]) p.ellipse(x, y, r, r * 0.75, "#827d73");
    if (name === "barrel") {
      p.fillRect(14, 16, 21, 25, "#98612c");
      p.strokeRect(14, 16, 21, 25, "#593719", 2);
      p.line(14, 24, 35, 24, "#d19242", 2);
    }
    if (name === "jar") {
      p.ellipse(24, 28, 12, 14, "#d39738");
      p.fillRect(18, 12, 12, 13, "#d39738");
      p.strokeRect(18, 12, 12, 13, "#7b4a21", 2);
    }
    if (name === "crate") {
      p.fillRect(11, 17, 27, 23, "#bd7c34");
      p.strokeRect(11, 17, 27, 23, "#653a18", 2);
      p.line(12, 18, 38, 40, "#653a18", 2);
      p.line(38, 18, 12, 40, "#653a18", 2);
    }
    if (name === "hay") {
      p.ellipse(24, 31, 17, 11, "#e2b03f");
      p.line(9, 31, 39, 27, "#f7d469", 2);
      p.line(13, 37, 38, 36, "#a86f1d", 2);
    }
    if (name === "lily_pads") {
      p.ellipse(18, 28, 10, 6, "#58b33d");
      p.ellipse(32, 23, 8, 5, "#58b33d");
      p.ellipse(30, 30, 3, 3, "#f6a8c6");
    }
  });
}
save("props/prop_fence_horizontal.png", 64, 64, (p) => drawFence(p, false));
save("props/prop_fence_vertical.png", 64, 64, (p) => drawFence(p, true));
save("props/prop_pasture_gate.png", 96, 64, (p) => {
  drawFence(p, false);
  p.fillRect(38, 17, 20, 35, "#b9782e");
  p.strokeRect(38, 17, 20, 35, "#694019", 2);
});
save("props/prop_sign_bee.png", 48, 48, (p) => propSign(p, "bee"));
save("props/prop_sign_crop.png", 48, 48, (p) => propSign(p, "crop"));
save("props/prop_sign_seed.png", 48, 48, (p) => propSign(p, "seed"));

// Characters.
for (const dir of ["down", "up", "left", "right"]) {
  save(`characters/player_idle_${dir}.png`, 48, 64, (p) => character(p, dir, 0));
  for (let i = 1; i <= 3; i++) save(`characters/player_walk_${dir}_${String(i).padStart(2, "0")}.png`, 48, 64, (p) => character(p, dir, i));
}
save("characters/npc_villager_01.png", 48, 64, (p) => npc(p, ["#15859a", "#f0a229", "#ffe0a8"]));
save("characters/npc_villager_02.png", 48, 64, (p) => npc(p, ["#2b8c54", "#e66937", "#2b8c54"]));
save("characters/npc_villager_03.png", 48, 64, (p) => npc(p, ["#315d9b", "#f2c14e", "#ffffff"]));

const mammalDrawers = {
  cow: (p, s) => cowLike(p, { scale: s, body: "#f7efdb", spot: "#30302c" }),
  horse: (p, s) => horseLike(p, { scale: s, body: "#b86f2d" }),
  cat: (p, s) => catDog(p, { scale: s, body: "#dd7b2e", ear: "#f08f40" }),
  dog: (p, s) => catDog(p, { scale: s, body: "#bf7333", ear: "#8b4d23" }),
  sheep: (p, s) => sheepLike(p, { scale: s }),
  snake: (p, s) => snakeLike(p, { scale: s }),
  elephant: (p, s) => elephantLike(p, { scale: s }),
  camel: (p, s) => camelLike(p, { scale: s, body: "#c67032", hump: "#d8863e" }),
};
const mammalStages = [
  ["baby_cow", "cow", 0.58],
  ["teenage_cow", "cow", 0.78],
  ["adult_cow", "cow", 1],
  ["baby_horse", "horse", 0.58],
  ["teenage_horse", "horse", 0.78],
  ["adult_horse", "horse", 1],
  ["kitten", "cat", 0.58],
  ["teenage_cat", "cat", 0.76],
  ["adult_cat", "cat", 0.92],
  ["baby_snake", "snake", 0.62],
  ["teenage_snake", "snake", 0.82],
  ["adult_snake", "snake", 1],
  ["baby_elephant", "elephant", 0.58],
  ["teenage_elephant", "elephant", 0.78],
  ["adult_elephant", "elephant", 1],
  ["baby_red_camel", "camel", 0.58],
  ["teenage_red_camel", "camel", 0.78],
  ["adult_red_camel", "camel", 1],
  ["baby_sheep", "sheep", 0.58],
  ["teenage_sheep", "sheep", 0.78],
  ["adult_sheep", "sheep", 1],
  ["puppy", "dog", 0.58],
  ["teenage_dog", "dog", 0.78],
  ["adult_dog", "dog", 0.95],
];
for (const [name, type, scale] of mammalStages) {
  save(`animals/${name}_idle_down.png`, 64, 64, (p) => mammalDrawers[type](p, scale));
  save(`animals/${name}_walk_down_01.png`, 64, 64, (p) => mammalDrawers[type](p, scale));
  save(`animals/${name}_walk_down_02.png`, 64, 64, (p) => mammalDrawers[type](p, scale));
}
for (const alias of [
  ["cow_idle_down", "cow", 1],
  ["cow_walk_down_01", "cow", 1],
  ["cow_walk_down_02", "cow", 1],
  ["sheep_idle_down", "sheep", 0.9],
  ["sheep_walk_down_01", "sheep", 0.9],
  ["horse_idle_down", "horse", 0.9],
  ["cat_idle_down", "cat", 0.75],
  ["cat_walk_down_01", "cat", 0.75],
  ["cat_walk_down_02", "cat", 0.75],
]) save(`animals/${alias[0]}.png`, 64, 64, (p) => mammalDrawers[alias[1]](p, alias[2]));
for (const dir of ["up", "left", "right"]) {
  save(`animals/cat_idle_${dir}.png`, 64, 64, (p) => mammalDrawers.cat(p, 0.75));
  save(`animals/cat_walk_${dir}_01.png`, 64, 64, (p) => mammalDrawers.cat(p, 0.75));
  save(`animals/cat_walk_${dir}_02.png`, 64, 64, (p) => mammalDrawers.cat(p, 0.75));
}
for (const [name, opts] of [
  ["ant_larva", { body: "#d8c19a", body2: "#e8d5b5" }],
  ["ant_pupa", { body: "#d8b38a", body2: "#e8cfae" }],
  ["ant", { body: "#8a3d1e", body2: "#a54d20" }],
  ["spider_egg", { body: "#e8d5b5", body2: "#fff2d5" }],
  ["baby_spider", { body: "#6a4d3d", body2: "#8a6b58" }],
  ["spider", { body: "#332927", body2: "#4e403b" }],
  ["bee_larva", { body: "#f5d783", body2: "#fff0ae" }],
  ["bee_pupa", { body: "#e4b94a", body2: "#ffd45a" }],
  ["bee", { body: "#e3a91f", body2: "#f0c640", wings: true }],
]) {
  save(`animals/${name}_idle_down.png`, 64, 64, (p) => insectLike(p, opts));
  save(`animals/${name}_walk_down_01.png`, 64, 64, (p) => insectLike(p, opts));
  if (name.includes("bee")) save(`animals/${name}_fly_01.png`, 64, 64, (p) => insectLike(p, { ...opts, wings: true }));
}
for (const [name, opts] of [
  ["baby_hoopoe", { body: "#d98a2c", head: "#efae4c", beak: "#3f2b1c", wing: "#57402b", scale: 0.62 }],
  ["teenage_hoopoe", { body: "#d98a2c", head: "#efae4c", beak: "#3f2b1c", wing: "#57402b", scale: 0.8 }],
  ["adult_hoopoe", { body: "#d98a2c", head: "#efae4c", beak: "#3f2b1c", wing: "#57402b", scale: 1 }],
  ["baby_crow", { body: "#263543", head: "#1d2730", beak: "#242424", wing: "#426071", scale: 0.62 }],
  ["teenage_crow", { body: "#263543", head: "#1d2730", beak: "#242424", wing: "#426071", scale: 0.8 }],
  ["adult_crow", { body: "#263543", head: "#1d2730", beak: "#242424", wing: "#426071", scale: 1 }],
  ["baby_ababeel", { body: "#234b7a", head: "#233b5a", beak: "#d88b24", wing: "#1f5d9b", scale: 0.62 }],
  ["teenage_ababeel", { body: "#234b7a", head: "#233b5a", beak: "#d88b24", wing: "#1f5d9b", scale: 0.8 }],
  ["adult_ababeel", { body: "#234b7a", head: "#233b5a", beak: "#d88b24", wing: "#1f5d9b", scale: 1 }],
  ["baby_dove", { body: "#f0ead9", head: "#ffffff", beak: "#d99a5c", wing: "#d6ceb9", scale: 0.62 }],
  ["teenage_dove", { body: "#f0ead9", head: "#ffffff", beak: "#d99a5c", wing: "#d6ceb9", scale: 0.8 }],
  ["adult_dove", { body: "#f0ead9", head: "#ffffff", beak: "#d99a5c", wing: "#d6ceb9", scale: 1 }],
]) {
  save(`animals/${name}_idle_down.png`, 64, 64, (p) => birdLike(p, opts));
  save(`animals/${name}_fly_01.png`, 64, 64, (p) => birdLike(p, opts));
}
for (const [name, scale] of [["small_fish", 0.62], ["larger_fish", 0.85], ["massive_fish", 1.12]]) {
  save(`animals/${name}_idle.png`, 64, 64, (p) => fishLike(p, { scale }));
  save(`animals/${name}_swim_01.png`, 64, 64, (p) => fishLike(p, { scale }));
}

// Crops and tools.
for (const kind of ["wheat", "berries", "leafy", "carrot", "date_palm"]) {
  for (const stage of ["seed", "sprout", "medium", "mature"]) {
    save(`crops/crop_${stage}_${kind}.png`, 48, 48, (p) => cropStage(p, stage, kind));
  }
}
save("crops/crop_soil_empty.png", 48, 48, (p) => cropStage(p, "empty"));
save("crops/crop_soil_watered.png", 48, 48, (p) => {
  cropStage(p, "empty");
  p.fillRect(10, 28, 28, 12, color("#4b311f", 170));
});
save("crops/crop_seed.png", 48, 48, (p) => cropStage(p, "seed", "wheat"));
save("crops/crop_sprout.png", 48, 48, (p) => cropStage(p, "sprout", "wheat"));
save("crops/crop_medium.png", 48, 48, (p) => cropStage(p, "medium", "wheat"));
save("crops/crop_mature_carrot.png", 48, 48, (p) => cropStage(p, "mature", "carrot"));
save("crops/tool_watering_can.png", 48, 48, (p) => {
  shadow(p, 25, 40, 15, 4);
  p.ellipse(23, 28, 14, 10, "#2c9cb1");
  p.strokeRect(15, 21, 20, 17, "#f4c85b", 2);
  p.line(34, 25, 45, 20, "#2c9cb1", 4);
  p.line(15, 26, 8, 20, "#2c9cb1", 3);
});
save("crops/tool_hoe.png", 48, 48, (p) => {
  shadow(p, 25, 41, 14, 4);
  p.line(15, 38, 35, 12, "#8b5724", 4);
  p.line(31, 13, 42, 18, "#9ea7aa", 4);
});
save("crops/harvest_basket.png", 48, 48, (p) => {
  shadow(p, 24, 41, 16, 4);
  p.ellipse(24, 31, 17, 11, "#b8792e");
  p.ellipse(24, 29, 13, 7, "#6c3c1a");
  p.ellipse(18, 24, 5, 5, "#e85f39");
  p.ellipse(29, 23, 5, 5, "#235fd0");
  p.line(13, 27, 24, 11, "#9b6324", 3);
  p.line(24, 11, 35, 27, "#9b6324", 3);
});
save("crops/seed_packet_icon.png", 48, 48, (p) => {
  p.fillRect(12, 9, 24, 31, "#f3d283");
  p.strokeRect(12, 9, 24, 31, "#8c5b25", 2);
  p.ellipse(24, 25, 6, 8, "#6cbf3d");
});
save("crops/crop_marker_icon.png", 48, 48, (p) => propSign(p, "crop"));

// UI.
save("ui/ui_hud_panel.png", 256, 96, (p) => uiPanel(p, 256, 96));
save("ui/ui_inventory_slot.png", 48, 48, (p) => {
  p.fillRect(0, 0, 48, 48, color("#17120f", 225));
  p.strokeRect(0, 0, 48, 48, "#7b4a21", 4);
  p.strokeRect(6, 6, 36, 36, "#f0c15f", 2);
});
save("ui/ui_seed_icon.png", 32, 32, (p) => {
  p.ellipse(16, 16, 8, 11, "#6fbd3b");
  p.ellipse(19, 14, 5, 8, "#a8dd52");
});
save("ui/ui_crop_icon.png", 32, 32, (p) => {
  p.fillRect(15, 14, 3, 12, "#428e30");
  p.ellipse(11, 15, 7, 4, "#68bf42");
  p.ellipse(21, 13, 7, 4, "#68bf42");
  p.ellipse(17, 8, 4, 6, "#f0bf33");
});
save("ui/ui_interaction_key.png", 48, 48, (p) => {
  p.fillRect(5, 5, 38, 38, color("#fff2bd", 245));
  p.strokeRect(5, 5, 38, 38, "#8c5b25", 3);
  p.fillRect(17, 13, 14, 4, "#8c5b25");
  p.fillRect(17, 22, 12, 4, "#8c5b25");
  p.fillRect(17, 31, 14, 4, "#8c5b25");
});
save("ui/ui_dialogue_box.png", 320, 96, (p) => uiPanel(p, 320, 96));

console.log(`Generated assets in ${outRoot}`);
