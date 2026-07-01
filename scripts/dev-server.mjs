// Minimal static file server + a single write endpoint for the map editor.
// No dependencies — plain Node http/fs so `node scripts/dev-server.mjs` just works.
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.argv[2]) || 5173;
const host = process.env.HOST || "127.0.0.1";
const overridesFile = path.join(root, "src", "world", "mapOverrides.json");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

function serveStatic(req, res, pathname) {
  let rel = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.join(root, decodeURIComponent(rel));
  if (!filePath.startsWith(root)) return send(res, 403, "Forbidden");
  fs.readFile(filePath, (err, data) => {
    if (err) return send(res, 404, "Not found");
    const ext = path.extname(filePath).toLowerCase();
    send(res, 200, data, { "Content-Type": MIME[ext] || "application/octet-stream" });
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let chunks = "";
    req.on("data", (c) => { chunks += c; });
    req.on("end", () => resolve(chunks));
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/api/save-map" && req.method === "POST") {
    try {
      const body = await readBody(req);
      const parsed = JSON.parse(body || "{}");
      fs.mkdirSync(path.dirname(overridesFile), { recursive: true });
      fs.writeFileSync(overridesFile, JSON.stringify(parsed, null, 2));
      send(res, 200, JSON.stringify({ ok: true }), { "Content-Type": "application/json" });
    } catch (err) {
      send(res, 400, JSON.stringify({ ok: false, error: String(err) }), { "Content-Type": "application/json" });
    }
    return;
  }

  if (url.pathname === "/api/save-map" && req.method === "GET") {
    fs.readFile(overridesFile, (err, data) => {
      if (err) return send(res, 200, "{}", { "Content-Type": "application/json" });
      send(res, 200, data, { "Content-Type": "application/json" });
    });
    return;
  }

  if (req.method !== "GET") return send(res, 405, "Method not allowed");
  serveStatic(req, res, url.pathname);
});

server.listen(port, host, () => {
  console.log(`Miftah dev server (with map-editor save endpoint) at http://${host}:${port}`);
});
