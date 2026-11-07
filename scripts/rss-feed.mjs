/*
  The site's RSS feed (/feed.xml): one item per game, newest first, built from
  the homepage catalog so there's nothing extra to maintain. Adding a game to
  GAMES_DATA in index.html (with its dateAdded) is what announces it.

  vite.config.mjs calls buildFeed() to emit dist/feed.xml at build time and to
  serve /feed.xml in dev; test/rss-feed.test.js checks the result.

  The catalog lives in index.html's inline <script> (inline on purpose: fewer
  render-blocking requests), so readCatalog() lifts the GAMES_DATA and SUBJECTS
  array literals out of the page and evaluates them. They're plain data, so
  vm with an empty context is enough.
*/
import vm from 'node:vm';

export const SITE = 'https://studydetectiveagency.com';
const FEED_TITLE = 'The Study Detective Agency: new games';
const FEED_DESC = 'New 4th grade study games and study guides from The Study Detective Agency, as they are added.';

/* The array literal assigned to `var <name> = [...]`, found by bracket depth while skipping strings. */
function arrayLiteral(src, name){
  const start = src.indexOf(`var ${name} = [`);
  if (start < 0) throw new Error(`index.html: no "var ${name} = [" found`);
  const open = src.indexOf('[', start);
  let depth = 0, quote = null;
  for (let i = open; i < src.length; i++){
    const c = src[i];
    if (quote){
      if (c === '\\') i++;
      else if (c === quote) quote = null;
    } else if (c === "'" || c === '"' || c === '`') quote = c;
    else if (c === '/' && src[i + 1] === '/') i = src.indexOf('\n', i);
    else if (c === '/' && src[i + 1] === '*') i = src.indexOf('*/', i) + 1;
    else if (c === '[') depth++;
    else if (c === ']' && --depth === 0) return src.slice(open, i + 1);
  }
  throw new Error(`index.html: ${name} array is not closed`);
}

export function readCatalog(indexHtml){
  const evalArray = name => vm.runInNewContext('(' + arrayLiteral(indexHtml, name) + ')', Object.create(null));
  return { games: evalArray('GAMES_DATA'), subjects: evalArray('SUBJECTS') };
}

const xml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

/* RFC 822 date for a 'YYYY-MM-DD' day. Noon UTC keeps the calendar day the same across US time zones. */
export function rfc822(day){
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error(`dateAdded "${day}" is not YYYY-MM-DD`);
  const d = new Date(day + 'T12:00:00Z');
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== day) throw new Error(`dateAdded "${day}" is not a real date`);
  return d.toUTCString();
}

/* Newest first; games added the same day keep their catalog order. */
export function feedItems(games){
  return games.map((g, i) => ({ g, i })).sort((a, b) => b.g.dateAdded.localeCompare(a.g.dateAdded) || a.i - b.i).map(x => x.g);
}

export function buildFeed(indexHtml){
  const { games, subjects } = readCatalog(indexHtml);
  const label = Object.fromEntries(subjects.map(s => [s.id, s.label]));
  const items = feedItems(games);
  // lastBuildDate is the newest game's day, not the build time, so the same
  // catalog always produces the same file (no churn for readers or caches).
  const updated = items.length ? rfc822(items[0].dateAdded) : rfc822('2026-08-24');
  const body = items.map(g => {
    const link = `${SITE}/${g.url}`;
    return `    <item>
      <title>${xml(g.title)}</title>
      <link>${xml(link)}</link>
      <guid isPermaLink="true">${xml(link)}</guid>
      <pubDate>${rfc822(g.dateAdded)}</pubDate>
      <category>${xml(label[g.subject] || g.subject)}</category>
      <description>${xml(g.blurb)}</description>
    </item>`;
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xml(FEED_TITLE)}</title>
    <link>${SITE}/</link>
    <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml"/>
    <description>${xml(FEED_DESC)}</description>
    <language>en-us</language>
    <lastBuildDate>${updated}</lastBuildDate>
    <image>
      <url>${SITE}/assets/img/og-image.jpg</url>
      <title>${xml(FEED_TITLE)}</title>
      <link>${SITE}/</link>
    </image>
${body}
  </channel>
</rss>
`;
}
