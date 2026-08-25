#!/usr/bin/env node
'use strict';
/*
 * Local dev server that mimics Cloudflare's clean-URL asset resolution
 * (html_handling: "auto-trailing-slash" in wrangler.jsonc), since a
 * plain static file server only serves exact file paths and 404s on
 * the extension-less URLs this site actually links (e.g. /games/math/foo).
 *
 *   /                       -> index.html
 *   /games/math/foo         -> serves games/math/foo.html directly (200)
 *   /games/math/foo.html    -> 307 redirect to /games/math/foo, matching
 *                              production's own canonicalization
 *   /index.html             -> 307 redirect to /
 *
 * Responses are sent with no-cache headers — unlike production's
 * _headers file, local dev should always show your latest edit, not
 * whatever cache duration Cloudflare would apply.
 *
 * Usage: node scripts/dev-server.js [port]   (default port 8000)
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.dirname(__dirname);
const PORT = Number(process.argv[2]) || 8000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

function loadAssetsignore() {
  const file = path.join(ROOT, '.assetsignore');
  if (!fs.existsSync(file)) return [];
  return fs
    .readFileSync(file, 'utf8')
    .split('\n')
    .map((line) => line.trim().replace(/^\/+|\/+$/g, ''))
    .filter((line) => line && !line.startsWith('#'));
}

const IGNORED = loadAssetsignore();

function isIgnored(urlPath) {
  const parts = urlPath.replace(/^\/+/, '').split('/');
  return parts.some((_part, i) => IGNORED.includes(parts.slice(0, i + 1).join('/')));
}

// Resolve a URL path to a file under ROOT, refusing to escape it via `..`.
function resolveSafe(urlPath) {
  const resolved = path.normalize(path.join(ROOT, decodeURIComponent(urlPath)));
  if (resolved !== ROOT && !resolved.startsWith(ROOT + path.sep)) return null;
  return resolved;
}

function isFile(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function serveFile(res, filePath) {
  const type = MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
  res.writeHead(200, {
    'Content-Type': type,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  });
  fs.createReadStream(filePath).on('error', () => res.destroy()).pipe(res);
}

function notFound(res) {
  res.writeHead(404, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  });
  res.end('404 Not Found');
}

const server = http.createServer((req, res) => {
  // A browser cancels some requests (aborted navigations, favicons);
  // that's not a real server error, just the client hanging up early.
  req.on('error', () => {});
  res.on('error', (err) => {
    if (err.code !== 'EPIPE' && err.code !== 'ECONNRESET') console.error(err);
  });

  const url = new URL(req.url, `http://${req.headers.host}`);
  const urlPath = decodeURIComponent(url.pathname);

  if (isIgnored(urlPath)) return notFound(res);

  // Literal .html request -> redirect to the clean URL, same as
  // production. /index.html is a special case: it collapses to /
  // rather than /index.
  if (urlPath.endsWith('.html')) {
    let clean = urlPath.slice(0, -'.html'.length);
    if (clean.endsWith('/index')) clean = clean.slice(0, -'index'.length);
    res.writeHead(307, { Location: clean + url.search });
    return res.end();
  }

  if (urlPath === '/' || urlPath.endsWith('/')) {
    const indexPath = resolveSafe(urlPath + 'index.html');
    if (indexPath && isFile(indexPath)) return serveFile(res, indexPath);
    return notFound(res);
  }

  // Exact match (css/js/images/etc) -> serve as-is.
  const literal = resolveSafe(urlPath);
  if (literal && isFile(literal)) return serveFile(res, literal);

  // Clean URL -> serve the matching .html file directly (no redirect).
  const htmlCandidate = resolveSafe(urlPath + '.html');
  if (htmlCandidate && isFile(htmlCandidate)) return serveFile(res, htmlCandidate);

  return notFound(res);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use — pass a different port: node scripts/dev-server.js <port>`);
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, () => {
  console.log(`Serving ${ROOT}`);
  console.log(`http://localhost:${PORT}/  (clean URLs, no caching)`);
});
