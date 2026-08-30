/*
  Build config. Two jobs:

  1. Multi-page build. Every page under games/<subject>/ plus the homepage is
     a Rollup input, discovered by scanning the directory so adding a game
     never means editing this file. `vite build` writes the deployable site to
     dist/ with content-hashed asset filenames -- which is what lets _headers
     cache /assets/* as immutable for a year with no hand-managed ?v= tokens:
     changed bytes mean a changed URL, by construction.

  2. Clean URLs in dev and preview. Production serves /games/math/foo for
     games/math/foo.html (html_handling: "auto-trailing-slash" in
     wrangler.jsonc, which also redirects the .html and trailing-slash forms
     to the clean one). Vite's servers only resolve exact paths, so the
     cleanUrls() plugin below mimics that resolution locally -- the same job
     scripts/dev-server.js did before Vite.
*/
import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';

const ROOT = path.dirname(new URL(import.meta.url).pathname);

// index.html plus every game page, keyed by a name Rollup uses for chunk
// naming. games/math/ledger-files.html -> "math-ledger-files".
function pageInputs() {
  const inputs = { index: path.join(ROOT, 'index.html') };
  const gamesDir = path.join(ROOT, 'games');
  for (const subject of fs.readdirSync(gamesDir)) {
    const subjectDir = path.join(gamesDir, subject);
    if (!fs.statSync(subjectDir).isDirectory()) continue;
    for (const file of fs.readdirSync(subjectDir)) {
      if (!file.endsWith('.html')) continue;
      inputs[`${subject}-${path.basename(file, '.html')}`] = path.join(subjectDir, file);
    }
  }
  return inputs;
}

// Mimics production's clean-URL asset resolution (see header). Serves
// /games/math/foo from games/math/foo.html, and 307-redirects the .html and
// trailing-slash spellings to the clean one, exactly as Cloudflare does.
function cleanUrls() {
  const middleware = (rootDir) => (req, res, next) => {
    const url = new URL(req.url, 'http://localhost');
    // The dev server rewrites a page's inline module script into a request
    // like /index.html?html-proxy&index=0.js — an internal module fetch, not
    // a page navigation. Redirecting it serves HTML where the browser
    // expects JS and the script never runs.
    if (url.searchParams.has('html-proxy')) return next();
    const urlPath = decodeURIComponent(url.pathname);
    const redirect = (to) => {
      res.writeHead(307, { Location: to + url.search });
      res.end();
    };
    const hasPage = (p) => fs.existsSync(path.join(rootDir, p + '.html'));

    if (urlPath.endsWith('.html')) {
      let clean = urlPath.slice(0, -'.html'.length);
      if (clean.endsWith('/index')) clean = clean.slice(0, -'index'.length);
      return redirect(clean);
    }
    if (urlPath !== '/' && urlPath.endsWith('/') && hasPage(urlPath.slice(0, -1))) {
      return redirect(urlPath.slice(0, -1));
    }
    if (!urlPath.endsWith('/') && !path.extname(urlPath) && hasPage(urlPath)) {
      req.url = urlPath + '.html' + url.search;
    }
    next();
  };
  return {
    name: 'clean-urls',
    configureServer(server) {
      // Pages live at their URL paths in the source tree, so dev resolves
      // against the project root.
      server.middlewares.use(middleware(server.config.root));
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware(path.resolve(server.config.root, server.config.build.outDir)));
    },
  };
}

export default defineConfig({
  // Never fall back to index.html on a miss -- this is a set of separate
  // pages, and a 404 should look like one in dev too.
  appType: 'mpa',
  plugins: [cleanUrls()],
  build: {
    rollupOptions: { input: pageInputs() },
  },
});
