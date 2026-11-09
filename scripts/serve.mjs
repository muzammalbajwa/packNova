#!/usr/bin/env node
// Static server for ./out with Brotli/gzip compression and the same cache rules as public/_headers.
// Usage: node scripts/serve.mjs [port=8080] [host=0.0.0.0]   (npm run serve:out)
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { brotliCompressSync, gzipSync, constants } from "node:zlib";
import { extname, join, normalize, resolve } from "node:path";
import { networkInterfaces } from "node:os";

const ROOT = resolve(process.cwd(), "out");
const PORT = Number(process.argv[2] ?? 8080);
const HOST = process.argv[3] ?? "0.0.0.0";

const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp",
  ".ico": "image/x-icon", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml",
  ".glb": "model/gltf-binary", ".ktx2": "image/ktx2",
};
const COMPRESSIBLE = new Set([".html", ".js", ".css", ".json", ".svg", ".txt", ".xml"]);
const cache = new Map(); // path -> { raw, br, gz }

async function resolveFile(urlPath) {
  let p = normalize(decodeURIComponent(urlPath.split("?")[0])).replace(/^(\.\.[/\\])+/, "");
  let file = join(ROOT, p);
  if (!file.startsWith(ROOT)) return null;
  try {
    const s = await stat(file);
    if (s.isDirectory()) file = join(file, "index.html");
  } catch {
    if (!extname(file)) file += ".html";
  }
  try {
    await stat(file);
    return file;
  } catch {
    return null;
  }
}

const cacheControl = (url) =>
  url.startsWith("/_next/static/") ? "public, max-age=31536000, immutable"
  : /^\/(textures|models)\/|^\/og\.png|^\/favicon/.test(url) ? "public, max-age=604800"
  : "public, max-age=0, must-revalidate";

createServer(async (req, res) => {
  const file = await resolveFile(req.url ?? "/");
  if (!file) {
    res.writeHead(404, { "content-type": "text/plain" }).end("Not found");
    return;
  }
  const ext = extname(file);
  let entry = cache.get(file);
  if (!entry) {
    const raw = await readFile(file);
    const comp = COMPRESSIBLE.has(ext) && raw.length > 512;
    entry = {
      raw,
      br: comp ? brotliCompressSync(raw, { params: { [constants.BROTLI_PARAM_QUALITY]: 5 } }) : null,
      gz: comp ? gzipSync(raw, { level: 6 }) : null,
    };
    cache.set(file, entry);
  }
  const accept = String(req.headers["accept-encoding"] ?? "");
  const [body, enc] = entry.br && /\bbr\b/.test(accept) ? [entry.br, "br"] : entry.gz && /\bgzip\b/.test(accept) ? [entry.gz, "gzip"] : [entry.raw, null];
  const headers = {
    "content-type": TYPES[ext] ?? "application/octet-stream",
    "content-length": body.length,
    "cache-control": cacheControl(req.url ?? "/"),
    vary: "accept-encoding",
  };
  if (enc) headers["content-encoding"] = enc;
  res.writeHead(200, headers).end(req.method === "HEAD" ? undefined : body);
}).listen(PORT, HOST, () => {
  console.log(`Serving ${ROOT}`);
  console.log(`  local:   http://localhost:${PORT}/`);
  for (const list of Object.values(networkInterfaces()))
    for (const i of list ?? []) if (i.family === "IPv4" && !i.internal) console.log(`  network: http://${i.address}:${PORT}/   (open this on your phone, same Wi-Fi)`);
});
