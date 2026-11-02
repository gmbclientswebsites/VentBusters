'use strict';

/*
 * Regenerates sitemap.xml from the pages actually on disk, skipping anything
 * marked noindex so the sitemap never advertises a page we told Google to
 * skip. Runs last in the build chain, after every generated page exists.
 */
/* Rebuilds sitemap.xml from the files actually on disk, skipping anything
   marked noindex so the sitemap never advertises a page we told Google to skip. */
const fs = require('fs');
const path = require('path');
const ROOT = require("path").resolve(__dirname, "..");
const LF = String.fromCharCode(10), CRLF = String.fromCharCode(13) + LF;
const BASE = 'https://www.vent-busters.com';
/* No <lastmod>. A build-time date stamps today on all ~48 URLs on every deploy
   even when nothing changed, and Google discounts lastmod it cannot trust.
   Omitting it beats publishing a value that is wrong every day. */
const SKIP = new Set(['404.html', 'thank-you.html']);

function walk(dir, rel, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules', 'content', 'public', 'scripts'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    const r = rel ? rel + '/' + e.name : e.name;
    if (e.isDirectory()) walk(p, r, out);
    else if (e.name.endsWith('.html')) out.push({ file: p, rel: r });
  }
  return out;
}

function priority(rel) {
  if (rel === 'index.html') return '1.0';
  if (rel === 'dryer-vent-cleaning.html') return '0.95';
  if (rel === 'service-areas.html' || rel === 'services.html') return '0.9';
  if (rel.startsWith('dryer-vent-cleaning-') && rel.endsWith('-fl.html')) return '0.8';
  if (rel.startsWith('blog/')) return '0.6';
  if (rel === 'blog.html') return '0.7';
  if (rel === 'about.html' || rel === 'contact.html' || rel === 'reviews.html' || rel === 'projects.html') return '0.7';
  if (rel === 'privacy-policy.html' || rel === 'terms.html') return '0.3';
  return '0.9'; // the remaining service pages
}

const pages = walk(ROOT, '', []);
const rows = [];
const skipped = [];
for (const p of pages.sort(function (a, b) { return a.rel.localeCompare(b.rel); })) {
  if (SKIP.has(p.rel)) { skipped.push(p.rel + ' (utility page)'); continue; }
  const s = fs.readFileSync(p.file, 'utf8');
  if (/name="robots" content="[^"]*noindex/.test(s)) { skipped.push(p.rel + ' (noindex)'); continue; }
  const loc = p.rel === 'index.html' ? BASE + '/' : BASE + '/' + p.rel;
  rows.push({ loc: loc, pr: priority(p.rel) });
}

rows.sort(function (a, b) {
  const d = parseFloat(b.pr) - parseFloat(a.pr);
  return d !== 0 ? d : a.loc.localeCompare(b.loc);
});

const o = [];
o.push('<?xml version="1.0" encoding="UTF-8"?>');
o.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
for (const r of rows) {
  o.push('  <url>');
  o.push('    <loc>' + r.loc + '</loc>');
  o.push('    <priority>' + r.pr + '</priority>');
  o.push('  </url>');
}
o.push('</urlset>');
o.push('');

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), o.join(LF).split(LF).join(CRLF));
console.log('sitemap.xml: ' + rows.length + ' urls');
skipped.forEach(function (s) { console.log('  skipped: ' + s); });
