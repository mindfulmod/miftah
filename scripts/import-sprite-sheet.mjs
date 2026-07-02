import fs from "fs";
import os from "os";
import path from "path";
import zlib from "zlib";

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function usage() {
  console.log(`Usage:
  node scripts/import-sprite-sheet.mjs path/to/manifest.json [--preview path/to/preview.png]

Manifest paths resolve from the repo root/current working directory.
See docs/asset-importer.md for examples.`);
}

const args = process.argv.slice(2);
const manifestPathArg = args.find((arg) => !arg.startsWith("--"));
if (!manifestPathArg || args.includes("--help") || args.includes("-h")) {
  usage();
  process.exit(manifestPathArg ? 0 : 1);
}

function optionValue(name) {
  const index = args.indexOf(name);
  if (index === -1) return "";
  return args[index + 1] || "";
}

const rootDir = process.cwd();
const manifestPath = path.resolve(rootDir, manifestPathArg);
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const previewOverride = optionValue("--preview");

function resolveRepoPath(value) {
  if (!value) return "";
  return path.isAbsolute(value) ? value : path.resolve(rootDir, value);
}

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n += 1) {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
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
  for (let y = 0; y < height; y += 1) {
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
    PNG_SIGNATURE,
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}

function decodePng(file) {
  const buf = fs.readFileSync(file);
  if (!buf.subarray(0, 8).equals(PNG_SIGNATURE)) throw new Error(`${file} is not a PNG`);

  let pos = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idats = [];

  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === "IDAT") {
      idats.push(data);
    } else if (type === "IEND") {
      break;
    }
    pos += len + 12;
  }

  if (bitDepth !== 8 || (colorType !== 2 && colorType !== 6)) {
    throw new Error(`${file} must be an 8-bit RGB or RGBA PNG`);
  }

  const sourceBpp = colorType === 6 ? 4 : 3;
  const sourceStride = width * sourceBpp;
  const raw = zlib.inflateSync(Buffer.concat(idats));
  const scanlines = Buffer.alloc(height * sourceStride);
  let rp = 0;

  for (let y = 0; y < height; y += 1) {
    const filter = raw[rp];
    rp += 1;
    const row = raw.subarray(rp, rp + sourceStride);
    rp += sourceStride;
    const dst = scanlines.subarray(y * sourceStride, (y + 1) * sourceStride);
    const prev = y ? scanlines.subarray((y - 1) * sourceStride, y * sourceStride) : null;
    for (let x = 0; x < sourceStride; x += 1) {
      const a = x >= sourceBpp ? dst[x - sourceBpp] : 0;
      const b = prev ? prev[x] : 0;
      const c = prev && x >= sourceBpp ? prev[x - sourceBpp] : 0;
      let pred = 0;
      if (filter === 1) pred = a;
      else if (filter === 2) pred = b;
      else if (filter === 3) pred = Math.floor((a + b) / 2);
      else if (filter === 4) pred = paeth(a, b, c);
      dst[x] = (row[x] + pred) & 255;
    }
  }

  const pixels = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const si = y * sourceStride + x * sourceBpp;
      const di = (y * width + x) * 4;
      pixels[di] = scanlines[si];
      pixels[di + 1] = scanlines[si + 1];
      pixels[di + 2] = scanlines[si + 2];
      pixels[di + 3] = colorType === 6 ? scanlines[si + 3] : 255;
    }
  }

  return { width, height, pixels };
}

function writePng(file, width, height, pixels) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, encodePng(width, height, pixels));
}

function parseColor(value, fallback = [255, 0, 255]) {
  if (Array.isArray(value)) return [value[0] || 0, value[1] || 0, value[2] || 0];
  if (!value) return fallback;
  const clean = value.replace("#", "");
  if (clean.length !== 6) return fallback;
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function colorDistance(a, b) {
  return Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));
}

function getPixel(image, x, y) {
  const sx = Math.max(0, Math.min(image.width - 1, Math.round(x)));
  const sy = Math.max(0, Math.min(image.height - 1, Math.round(y)));
  const i = (sy * image.width + sx) * 4;
  return [image.pixels[i], image.pixels[i + 1], image.pixels[i + 2], image.pixels[i + 3]];
}

function putPixel(image, x, y, rgba) {
  if (x < 0 || y < 0 || x >= image.width || y >= image.height) return;
  const i = (y * image.width + x) * 4;
  image.pixels[i] = rgba[0];
  image.pixels[i + 1] = rgba[1];
  image.pixels[i + 2] = rgba[2];
  image.pixels[i + 3] = rgba[3];
}

function estimateCornerColor(image, cell, size, alphaThreshold) {
  const samples = [];
  const corners = [
    [cell.x, cell.y],
    [cell.x + cell.width - size, cell.y],
    [cell.x, cell.y + cell.height - size],
    [cell.x + cell.width - size, cell.y + cell.height - size],
  ];
  for (const [cx, cy] of corners) {
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const pixel = getPixel(image, cx + x, cy + y);
        if (pixel[3] > alphaThreshold) samples.push(pixel);
      }
    }
  }
  if (!samples.length) return null;
  const avg = samples.reduce((acc, pixel) => {
    acc[0] += pixel[0];
    acc[1] += pixel[1];
    acc[2] += pixel[2];
    return acc;
  }, [0, 0, 0]).map((value) => Math.round(value / samples.length));
  const maxDeviation = Math.max(...samples.map((pixel) => colorDistance(pixel, avg)));
  return maxDeviation <= 42 ? avg : null;
}

function backgroundTester(image, cell, background) {
  const type = background.type || "auto";
  const alphaThreshold = background.alphaThreshold ?? 16;
  const tolerance = background.tolerance ?? (type === "magenta" ? 3 : 12);
  const color = parseColor(background.color, type === "magenta" ? [255, 0, 255] : [255, 255, 255]);
  const cornerColor = estimateCornerColor(image, cell, background.cornerSampleSize ?? 4, alphaThreshold);

  return (rgba) => {
    const rgb = [rgba[0], rgba[1], rgba[2]];
    if (rgba[3] <= alphaThreshold) return true;
    if (type === "transparent") return false;
    if (type === "magenta" || type === "color") return colorDistance(rgb, color) <= tolerance;
    if (type === "corner") return !!cornerColor && colorDistance(rgb, cornerColor) <= tolerance;
    if (colorDistance(rgb, [255, 0, 255]) <= 4) return true;
    return !!cornerColor && colorDistance(rgb, cornerColor) <= tolerance;
  };
}

function componentCleanup(mask, width, height, minPixels) {
  if (minPixels <= 1) return mask;
  const cleaned = new Uint8Array(mask.length);
  const seen = new Uint8Array(mask.length);
  const qx = [];
  const qy = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const start = y * width + x;
      if (!mask[start] || seen[start]) continue;
      qx.length = 0;
      qy.length = 0;
      qx.push(x);
      qy.push(y);
      seen[start] = 1;
      for (let qi = 0; qi < qx.length; qi += 1) {
        const cx = qx[qi];
        const cy = qy[qi];
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            if (!dx && !dy) continue;
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
            const ni = ny * width + nx;
            if (mask[ni] && !seen[ni]) {
              seen[ni] = 1;
              qx.push(nx);
              qy.push(ny);
            }
          }
        }
      }
      if (qx.length >= minPixels) {
        for (let i = 0; i < qx.length; i += 1) cleaned[qy[i] * width + qx[i]] = 1;
      }
    }
  }
  return cleaned;
}

function buildMask(image, cell, background, minComponentPixels) {
  const isBackground = backgroundTester(image, cell, background);
  const mask = new Uint8Array(cell.width * cell.height);
  for (let y = 0; y < cell.height; y += 1) {
    for (let x = 0; x < cell.width; x += 1) {
      const rgba = getPixel(image, cell.x + x, cell.y + y);
      if (!isBackground(rgba)) mask[y * cell.width + x] = 1;
    }
  }
  return componentCleanup(mask, cell.width, cell.height, minComponentPixels);
}

function maskBounds(mask, width, height) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!mask[y * width + x]) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  return maxX >= 0 ? { minX, minY, maxX, maxY } : null;
}

function cellAt(grid, index, asset) {
  const col = asset.col ?? asset.column ?? (index % grid.cols);
  const row = asset.row ?? asset.r ?? Math.floor(index / grid.cols);
  const crop = asset.crop || {};
  const cropX = crop.x ?? crop.offsetX ?? 0;
  const cropY = crop.y ?? crop.offsetY ?? 0;
  const cropWidth = crop.width ?? grid.cellWidth - cropX;
  const cropHeight = crop.height ?? grid.cellHeight - cropY;
  return {
    row,
    col,
    x: grid.offsetX + col * (grid.cellWidth + grid.gapX) + cropX,
    y: grid.offsetY + row * (grid.cellHeight + grid.gapY) + cropY,
    width: cropWidth,
    height: cropHeight,
  };
}

function normalizeGrid(image, grid = {}) {
  const cols = grid.cols ?? grid.columns;
  const rows = grid.rows;
  if (!cols || !rows) throw new Error("manifest.grid must include cols and rows");
  const offsetX = grid.offsetX ?? 0;
  const offsetY = grid.offsetY ?? 0;
  const gapX = grid.gapX ?? grid.gap ?? 0;
  const gapY = grid.gapY ?? grid.gap ?? 0;
  const cellWidth = grid.cellWidth ?? grid.cell ?? Math.floor((image.width - offsetX - gapX * (cols - 1)) / cols);
  const cellHeight = grid.cellHeight ?? grid.cell ?? Math.floor((image.height - offsetY - gapY * (rows - 1)) / rows);
  return { cols, rows, offsetX, offsetY, gapX, gapY, cellWidth, cellHeight };
}

function normalizeAssets(assets, grid) {
  const count = grid.cols * grid.rows;
  const items = assets?.length ? assets : Array.from({ length: count }, (_, index) => ({ name: `sprite_${String(index + 1).padStart(2, "0")}` }));
  return items.map((item) => (typeof item === "string" ? { name: item } : item)).filter((item) => item.skip !== true);
}

function outputFileFor(asset, output, index) {
  if (asset.path) return resolveRepoPath(asset.path);
  const rawName = asset.file || asset.name || `sprite_${String(index + 1).padStart(2, "0")}`;
  const fileName = rawName.endsWith(".png") ? rawName : `${rawName}.png`;
  return path.join(resolveRepoPath(output.dir || "assets/generated/imported"), fileName);
}

function renderAsset(image, cell, mask, asset, output) {
  const targetWidth = asset.width ?? output.width ?? output.size ?? 48;
  const targetHeight = asset.height ?? output.height ?? output.size ?? 48;
  const pixels = Buffer.alloc(targetWidth * targetHeight * 4);
  const trim = asset.trim ?? output.trim ?? true;
  const bounds = trim ? maskBounds(mask, cell.width, cell.height) : { minX: 0, minY: 0, maxX: cell.width - 1, maxY: cell.height - 1 };
  if (!bounds) return { width: targetWidth, height: targetHeight, pixels, empty: true };

  const padding = asset.padding ?? output.padding ?? 0;
  const contentWidth = bounds.maxX - bounds.minX + 1;
  const contentHeight = bounds.maxY - bounds.minY + 1;
  const maxWidth = asset.maxWidth ?? output.maxWidth ?? targetWidth - padding * 2;
  const maxHeight = asset.maxHeight ?? output.maxHeight ?? targetHeight - padding * 2;
  const allowUpscale = asset.allowUpscale ?? output.allowUpscale ?? false;
  const scaleLimit = allowUpscale ? Number.POSITIVE_INFINITY : 1;
  const scale = Math.min(maxWidth / contentWidth, maxHeight / contentHeight, scaleLimit);
  const drawWidth = Math.max(1, Math.round(contentWidth * scale));
  const drawHeight = Math.max(1, Math.round(contentHeight * scale));
  const anchor = asset.anchor || output.anchor || "bottom";
  const bottomPadding = asset.bottomPadding ?? output.bottomPadding ?? padding;
  const offsetX = asset.offsetX ?? 0;
  const offsetY = asset.offsetY ?? 0;
  const dx = Math.round((targetWidth - drawWidth) / 2 + offsetX);
  const dy = anchor === "center"
    ? Math.round((targetHeight - drawHeight) / 2 + offsetY)
    : Math.round(targetHeight - drawHeight - bottomPadding + offsetY);

  for (let ty = 0; ty < drawHeight; ty += 1) {
    for (let tx = 0; tx < drawWidth; tx += 1) {
      const sx = Math.max(0, Math.min(cell.width - 1, Math.round(bounds.minX + (tx + 0.5) / scale)));
      const sy = Math.max(0, Math.min(cell.height - 1, Math.round(bounds.minY + (ty + 0.5) / scale)));
      if (!mask[sy * cell.width + sx]) continue;
      const rgba = getPixel(image, cell.x + sx, cell.y + sy);
      putPixel({ width: targetWidth, height: targetHeight, pixels }, dx + tx, dy + ty, rgba);
    }
  }

  return { width: targetWidth, height: targetHeight, pixels, empty: false };
}

function checkerPixel(x, y) {
  const value = (Math.floor(x / 8) + Math.floor(y / 8)) % 2 ? 190 : 226;
  return [value, value, value, 255];
}

function alphaBlend(bg, fg) {
  const a = fg[3] / 255;
  return [
    Math.round(fg[0] * a + bg[0] * (1 - a)),
    Math.round(fg[1] * a + bg[1] * (1 - a)),
    Math.round(fg[2] * a + bg[2] * (1 - a)),
    255,
  ];
}

function makePreview(rendered, previewPath) {
  if (!rendered.length) return;
  const cols = Math.min(6, rendered.length);
  const rows = Math.ceil(rendered.length / cols);
  const cellWidth = Math.max(...rendered.map((item) => item.image.width)) + 12;
  const cellHeight = Math.max(...rendered.map((item) => item.image.height)) + 12;
  const preview = { width: cols * cellWidth, height: rows * cellHeight, pixels: Buffer.alloc(cols * cellWidth * rows * cellHeight * 4) };

  for (let y = 0; y < preview.height; y += 1) {
    for (let x = 0; x < preview.width; x += 1) putPixel(preview, x, y, checkerPixel(x, y));
  }

  rendered.forEach((item, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const ox = col * cellWidth + Math.floor((cellWidth - item.image.width) / 2);
    const oy = row * cellHeight + Math.floor((cellHeight - item.image.height) / 2);
    for (let y = 0; y < item.image.height; y += 1) {
      for (let x = 0; x < item.image.width; x += 1) {
        const si = (y * item.image.width + x) * 4;
        const fg = [
          item.image.pixels[si],
          item.image.pixels[si + 1],
          item.image.pixels[si + 2],
          item.image.pixels[si + 3],
        ];
        if (!fg[3]) continue;
        const bg = checkerPixel(ox + x, oy + y);
        putPixel(preview, ox + x, oy + y, alphaBlend(bg, fg));
      }
    }
  });

  writePng(previewPath, preview.width, preview.height, preview.pixels);
}

const sourcePath = resolveRepoPath(manifest.source);
const image = decodePng(sourcePath);
const grid = normalizeGrid(image, manifest.grid);
const output = manifest.output || {};
const background = manifest.background || {};
const assets = normalizeAssets(manifest.assets, grid);
const minComponentPixels = manifest.minComponentPixels ?? output.minComponentPixels ?? 1;
const rendered = [];

for (let index = 0; index < assets.length; index += 1) {
  const asset = assets[index];
  const cell = cellAt(grid, index, asset);
  if (cell.x < 0 || cell.y < 0 || cell.x + cell.width > image.width || cell.y + cell.height > image.height) {
    throw new Error(`Cell for ${asset.name || asset.file || index} is outside the source image`);
  }
  const mask = buildMask(image, cell, { ...background, ...(asset.background || {}) }, asset.minComponentPixels ?? minComponentPixels);
  const outputImage = renderAsset(image, cell, mask, asset, output);
  const outputPath = outputFileFor(asset, output, index);
  writePng(outputPath, outputImage.width, outputImage.height, outputImage.pixels);
  rendered.push({ asset, path: outputPath, image: outputImage });
  console.log(`${outputImage.empty ? "blank" : "wrote"} ${path.relative(rootDir, outputPath)} from row ${cell.row}, col ${cell.col}`);
}

const defaultPreview = path.join(os.tmpdir(), `miftah-import-${path.basename(manifestPath, ".json")}.png`);
const previewPath = resolveRepoPath(previewOverride || output.preview || defaultPreview);
makePreview(rendered, previewPath);
console.log(`preview ${previewPath}`);
