#!/usr/bin/env node
'use strict';
/*
 * Fails when an asset changed without its ?v= token moving.
 *
 * Assets under /assets/ are served immutable for a year (see _headers), so
 * the only thing that gets a returning visitor the new bytes is a different
 * URL. The token lives in the HTML, which expires in 300s. Forget to bump
 * it and the change silently reaches new visitors only -- for up to a year.
 *
 * test/question-modules.test.js already asserts every script tag carries a
 * token, but a token that is merely *present* is exactly what a stale one
 * looks like. Telling the two apart needs the previous revision, which is
 * why this is a CI step against a range and not a `node --test` case: a
 * shallow clone has no history to compare against and would fail for the
 * wrong reason.
 *
 * Which assets are versioned is read from the pages rather than listed
 * here. An asset no page references with a ?v= is exempt by construction --
 * that is how fonts opt out (they version by filename, because a preload
 * href has to match the url() in base.css byte-for-byte).
 *
 * Usage: node scripts/check-asset-versions.js <base> <head>
 *   e.g. node scripts/check-asset-versions.js main HEAD
 *
 * The range is <base>...<head>: what head has that base does not, from
 * their merge base -- so unrelated commits landing on main meanwhile are
 * not mistaken for part of this branch.
 */
const { execFileSync } = require('node:child_process');

const [base, head] = process.argv.slice(2);
if (!base || !head) {
  console.error('usage: node scripts/check-asset-versions.js <base> <head>');
  process.exit(2);
}

function git(...args) {
  // stderr is piped, not inherited: probing whether a path existed at a
  // revision is a normal question here, and git answers "no" on stderr.
  return execFileSync('git', args, {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function lines(out) {
  return out.split('\n').filter(Boolean);
}

// Every .html file at a revision, with its contents. Cached per revision:
// each asset is checked against the same handful of pages.
const htmlCache = new Map();
function htmlAt(rev) {
  if (!htmlCache.has(rev)) {
    const pages = lines(git('ls-tree', '-r', '--name-only', rev))
      .filter((f) => f.endsWith('.html'))
      .map((f) => [f, git('show', `${rev}:${f}`)]);
    htmlCache.set(rev, pages);
  }
  return htmlCache.get(rev);
}

function existsAt(rev, file) {
  try {
    git('cat-file', '-e', `${rev}:${file}`);
    return true;
  } catch {
    return false;
  }
}

// The token a page uses for an asset, or null if that page does not link it.
// Pages reference assets relatively ("../../assets/js/game-engine.js?v=6"),
// so the repo-relative path is matched as a suffix.
function tokenIn(source, asset) {
  const escaped = asset.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`${escaped}\\?v=([^"'\\s>]+)`).exec(source);
  return match ? match[1] : null;
}

let changed;
try {
  changed = lines(git('diff', '--name-only', `${base}...${head}`));
} catch {
  console.error(`Cannot diff ${base}...${head}. A shallow clone has no merge base --`);
  console.error('CI needs fetch-depth: 0, and locally you may need `git fetch --unshallow`.');
  process.exit(2);
}

const assets = changed.filter((f) => f.startsWith('assets/'));
const stale = [];
const checked = [];

for (const asset of assets) {
  // A newly added asset cannot be cached under an old token yet.
  if (!existsAt(base, asset)) continue;

  for (const [page, source] of htmlAt(head)) {
    const now = tokenIn(source, asset);
    if (now === null) continue; // this page does not link it
    checked.push(`${asset} (${page})`);

    const before = existsAt(base, page)
      ? tokenIn(git('show', `${base}:${page}`), asset)
      : null;
    if (before !== null && before === now) {
      stale.push({ asset, page, token: now });
    }
  }
}

if (stale.length) {
  console.error(`${stale.length} asset(s) changed without a ?v= bump:\n`);
  for (const { asset, page, token } of stale) {
    console.error(`  ${asset} changed, but ${page} still links it as ?v=${token}`);
  }
  console.error('\nAssets are cached immutable for a year, so returning visitors keep');
  console.error('the old file until the token changes. Bump it in this same commit.');
  process.exit(1);
}

console.log(
  checked.length
    ? `?v= tokens OK -- ${checked.length} changed asset reference(s) bumped:\n  ${checked.join('\n  ')}`
    : '?v= tokens OK -- no versioned assets changed in this range.'
);
