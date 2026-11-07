// The RSS feed (/feed.xml), built from the homepage catalog by
// scripts/rss-feed.mjs. A broken feed fails silently for subscribers (a
// reader just stops updating, or an email service skips an item), so these
// pin down the parts a reader or an RSS-to-email service depends on.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE, buildFeed, readCatalog, feedItems, rfc822 } from '../scripts/rss-feed.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const { games, subjects } = readCatalog(INDEX);
const FEED = buildFeed(INDEX);

// jsdom is a dev dependency; like test/dom.test.js, skip the XML-parsing
// checks rather than fail when it isn't installed.
let JSDOM = null;
try { ({ JSDOM } = await import('jsdom')); } catch {}
const parse = (src) => {
  const doc = new new JSDOM('').window.DOMParser().parseFromString(src, 'application/xml');
  assert.equal(doc.getElementsByTagName('parsererror').length, 0, 'feed is not well-formed XML');
  return doc;
};
const text = (el, tag) => el.getElementsByTagName(tag)[0]?.textContent;

test('the catalog is read from index.html', () => {
  assert.ok(games.length >= 11, `only ${games.length} games read from GAMES_DATA`);
  assert.ok(subjects.length >= 4, `only ${subjects.length} subjects read from SUBJECTS`);
  for (const g of games) for (const k of ['id', 'title', 'subject', 'blurb', 'url', 'dateAdded']) {
    assert.ok(typeof g[k] === 'string' && g[k].trim(), `${g.id || '?'}: missing ${k}`);
  }
});

test('every game has a real YYYY-MM-DD dateAdded', () => {
  for (const g of games) assert.doesNotThrow(() => rfc822(g.dateAdded), `${g.id}: bad dateAdded ${g.dateAdded}`);
  assert.throws(() => rfc822('2026-02-30'));
  assert.throws(() => rfc822('11/07/2026'));
});

test('every game links to a page that exists, under the production origin', () => {
  for (const g of games) {
    assert.ok(fs.existsSync(path.join(ROOT, g.url + '.html')), `${g.id}: ${g.url}.html does not exist`);
  }
  assert.match(SITE, /^https:\/\/[^/]+$/);
});

test('every subject in the catalog has a label for the feed category', () => {
  const ids = new Set(subjects.map((s) => s.id));
  for (const g of games) assert.ok(ids.has(g.subject), `${g.id}: unknown subject ${g.subject}`);
});

test('items are newest first, and same-day games keep catalog order', () => {
  const order = feedItems([
    { id: 'a', dateAdded: '2026-01-01' }, { id: 'b', dateAdded: '2026-03-01' },
    { id: 'c', dateAdded: '2026-03-01' }, { id: 'd', dateAdded: '2026-02-01' },
  ]).map((g) => g.id);
  assert.deepEqual(order, ['b', 'c', 'd', 'a']);
});

test('the feed is valid RSS 2.0 with one item per game', { skip: !JSDOM && 'jsdom not installed' }, () => {
  const doc = parse(FEED);
  const rss = doc.documentElement;
  assert.equal(rss.nodeName, 'rss');
  assert.equal(rss.getAttribute('version'), '2.0');
  const channel = rss.getElementsByTagName('channel')[0];
  assert.ok(text(channel, 'title'));
  assert.equal(text(channel, 'link'), SITE + '/');
  const self = channel.getElementsByTagName('atom:link')[0];
  assert.equal(self.getAttribute('href'), SITE + '/feed.xml');
  assert.equal(self.getAttribute('rel'), 'self');

  const items = [...channel.getElementsByTagName('item')];
  assert.equal(items.length, games.length);
  const expected = feedItems(games);
  items.forEach((item, i) => {
    const g = expected[i];
    assert.equal(text(item, 'title'), g.title);
    assert.equal(text(item, 'link'), `${SITE}/${g.url}`);
    assert.equal(text(item, 'guid'), `${SITE}/${g.url}`);
    assert.equal(text(item, 'pubDate'), rfc822(g.dateAdded));
    assert.equal(text(item, 'description'), g.blurb);
  });
  const guids = items.map((it) => text(it, 'guid'));
  assert.equal(new Set(guids).size, guids.length, 'two items share a guid, so a reader would drop one');
  assert.equal(text(channel, 'lastBuildDate'), rfc822(expected[0].dateAdded));
});

test('titles and blurbs with XML special characters stay well-formed', { skip: !JSDOM && 'jsdom not installed' }, () => {
  const tricky = INDEX.replace("var GAMES_DATA = [", `var GAMES_DATA = [
    { id: 'tricky', title: 'Tom & Jerry <Math> "Quotes" \\'and\\' more', subject: 'math', icon: 'x',
      blurb: 'Fish & chips < 5 > 3', url: 'games/math/ledger-files', dateAdded: '2030-01-01', cta: 'Go', grade: 4 },`);
  const item = parse(buildFeed(tricky)).getElementsByTagName('item')[0];
  assert.equal(text(item, 'title'), `Tom & Jerry <Math> "Quotes" 'and' more`);
  assert.equal(text(item, 'description'), 'Fish & chips < 5 > 3');
});

test('the same catalog always builds the same feed', () => {
  assert.equal(buildFeed(INDEX), FEED);
});

test('the homepage advertises the feed', () => {
  assert.match(INDEX, /<link rel="alternate" type="application\/rss\+xml"[^>]*href="\/feed\.xml">/, 'no autodiscovery <link> in <head>');
  assert.match(INDEX, /<footer>[^]*href="\/feed\.xml"[^]*<\/footer>/, 'no visible feed link in the footer');
});
