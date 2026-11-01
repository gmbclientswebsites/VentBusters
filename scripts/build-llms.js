'use strict';

/*
 * Generates llms.txt from the pages actually on disk.
 *
 * It used to be hand-maintained, and it silently went stale: after the site was
 * repositioned as a dryer vent specialist it still advertised air duct cleaning,
 * UV light systems and HVAC sanitization, pointed at the deleted URLs for all
 * three, and listed every city page under the old /locations/ scheme. Answer
 * engines read this file, so a stale copy actively misinforms them.
 *
 * Generating it means it tracks reality, including blog posts the publishing
 * system adds later. Run it as part of the build.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://www.vent-busters.com';
const OUT = path.join(ROOT, 'llms.txt');

const CR = String.fromCharCode(13), LF = String.fromCharCode(10), CRLF = CR + LF;

// Service pages in the order we want them presented, most-searched first.
const SERVICE_ORDER = [
  'dryer-vent-cleaning.html',
  'clogged-dryer-vent.html',
  'dryer-vent-blockage-removal.html',
  'roof-dryer-vent-cleaning.html',
  'dryer-vent-repair.html',
  'dryer-vent-replacement.html',
  'dryer-vent-reconnection.html',
  'dryer-transition-hose-replacement.html',
  'dryer-booster-fan-service.html',
  'dryer-vent-airflow-testing.html',
];

const CORE_PAGES = [
  ['Home', 'index.html'],
  ['Dryer Vent Services', 'services.html'],
  ['Service Areas', 'service-areas.html'],
  ['Reviews', 'reviews.html'],
  ['About', 'about.html'],
  ['Blog', 'blog.html'],
  ['Contact', 'contact.html'],
  ['Privacy Policy', 'privacy-policy.html'],
  ['Terms of Service', 'terms.html'],
];

const SKIP = new Set(['404.html', 'thank-you.html']);

function read(rel) {
  try { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); } catch (e) { return null; }
}

function exists(rel) { return fs.existsSync(path.join(ROOT, rel)); }

function decode(s) {
  return String(s)
    .replace(/&amp;/g, '&')
    .replace(/&mdash;/g, String.fromCharCode(8212))
    .replace(/&ndash;/g, String.fromCharCode(8211))
    .replace(/&middot;/g, String.fromCharCode(183))
    .replace(/&rsquo;/g, String.fromCharCode(8217))
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function meta(rel) {
  const s = read(rel);
  if (!s) return null;
  if (/name="robots" content="[^"]*noindex/i.test(s)) return null; // never advertise a noindex page
  const title = (s.match(/<title>([\s\S]*?)<\/title>/i) || [])[1];
  const desc = (s.match(/<meta name="description" content="([^"]*)"/i) || [])[1];
  const h1 = (s.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1];
  return {
    title: title ? decode(title).replace(/\s*\|\s*Vent Busters\s*$/, '') : null,
    desc: desc ? decode(desc) : null,
    h1: h1 ? decode(h1) : null,
  };
}

/* First sentence of the description, so each line stays one scannable claim. */
function firstSentence(text) {
  if (!text) return '';
  const m = text.match(/^[\s\S]*?[.!?](?=\s|$)/);
  return (m ? m[0] : text).trim();
}

function cityPages() {
  return fs.readdirSync(ROOT)
    .filter((n) => /^dryer-vent-cleaning-[a-z0-9-]+-fl\.html$/.test(n))
    .sort()
    .map((n) => {
      const m = meta(n);
      const name = m && m.h1 ? m.h1.replace(/^Professional Dryer Vent Cleaning in\s*/i, '') : n;
      return { file: n, name: name };
    });
}

function blogPosts() {
  const dir = path.join(ROOT, 'blog');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((n) => n.endsWith('.html'))
    .sort()
    .map((n) => {
      const m = meta('blog/' + n);
      return m ? { file: 'blog/' + n, title: m.title || n, desc: firstSentence(m.desc) } : null;
    })
    .filter(Boolean);
}

function reviewFacts() {
  try {
    const d = JSON.parse(read('content/reviews.json'));
    const list = Array.isArray(d.reviews) ? d.reviews : [];
    if (!list.length) return null;
    const vals = list.map((r) => parseInt(r.rating, 10)).filter((n) => n >= 1 && n <= 5);
    if (vals.length !== list.length) return null;
    const avg = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
    return { avg: Number.isInteger(avg) ? avg.toFixed(1) : String(avg), count: vals.length, url: d.profileUrl || '' };
  } catch (e) { return null; }
}

const L = [];
const rev = reviewFacts();

L.push('# Vent Busters');
L.push('');
L.push('> Vent Busters is a dryer vent cleaning specialist serving homeowners across Palm Beach County and the Treasure Coast, from Boca Raton to Port St. Lucie. Dryer vents are the only thing the company works on: cleaning, blockage removal, roof vents, repairs, replacement, reconnection, transition hoses, booster fans and airflow testing.');
L.push('');
L.push('## Company Facts');
L.push('- Name: Vent Busters');
L.push('- Phone: (561) 884-4648');
L.push('- Email: Ventsbusters@gmail.com');
L.push('- Website: ' + SITE + '/');
L.push('- Specialty: Dryer vents only. Vent Busters does NOT do air duct cleaning, HVAC duct cleaning, UV light systems, HVAC sanitization, mold assessment or mold remediation. These were previously offered and were discontinued.');
L.push('- Google Business Profile category: Dryer vent cleaning service');
L.push('- Service area: Palm Beach County & the Treasure Coast ' + String.fromCharCode(8212) + ' Boca Raton to Port St. Lucie (20 communities). Service-area business; no separate offices in these cities.');
L.push('- Hours: Monday' + String.fromCharCode(8211) + 'Thursday 7am' + String.fromCharCode(8211) + '6pm, Friday 7am' + String.fromCharCode(8211) + '3pm; closed Saturday and Sunday');
L.push('- Pricing: No published flat rate ' + String.fromCharCode(8212) + ' quoted after an evaluation, explained before work begins');
L.push('- Credentials: Insured. Vent Busters does not claim any contractor license or certification; dryer vent cleaning is not a licensed trade in Florida.');
L.push('- Guarantee: Not satisfied? Tell us within 14 days and we\'ll re-clean the accessible components at no charge, or refund that service.');
if (rev) {
  L.push('- Reviews: ' + rev.avg + ' from ' + rev.count + ' review' + (rev.count === 1 ? '' : 's') + ' on Google' + (rev.url ? ' (' + rev.url + ')' : '') + '. Every review shown on the site is reproduced verbatim from that listing.');
}
L.push('');

L.push('## Services');
SERVICE_ORDER.forEach(function (file) {
  if (!exists(file)) return;
  const m = meta(file);
  if (!m) return;
  const name = (m.h1 || m.title || file).replace(/\s*\|\s*Vent Busters\s*$/, '');
  L.push('- [' + name + '](' + SITE + '/' + file + '): ' + firstSentence(m.desc));
});
L.push('');

L.push('## Common Questions');
L.push('- How much does dryer vent cleaning cost? No published flat rate. It depends on the length of the run, the number of turns, how the termination is accessed and what is found inside. Quoted before work begins.');
L.push('- How often should a dryer vent be cleaned in Florida? Usage matters more than the calendar. Many South Florida homes land near once a year; long roof-vented runs sooner. Humidity makes lint mat together rather than stay loose.');
L.push('- Does Vent Busters clean air ducts or HVAC systems? No. Dryer vents only. Air duct and HVAC work should go to an HVAC contractor.');
L.push('- Does Vent Busters do mold assessment or remediation? No. If material that may require assessment is observed, evaluation by an appropriately licensed professional is recommended.');
L.push('- Is Vent Busters licensed or certified? No such claim is made. Dryer vent cleaning is not a licensed trade in Florida. Vent Busters is insured.');
L.push('- Does cleaning a dryer vent prevent fires? No service can honestly promise that. Cleaning removes the lint fuel and restores airflow. Failure to clean was the leading factor in home clothes-dryer fires analysed by the U.S. Fire Administration.');
L.push('- Do you offer same-day service? Same-day and next-day appointments are often available, depending on technician availability and location.');
L.push('- What proof is given that the work changed anything? Airflow is measured at the termination before and after on every job, with before-and-after photos where conditions allow.');
L.push('- What areas do you serve? The 20 communities listed below, from Boca Raton to Port St. Lucie.');
L.push('');

L.push('## Pages');
CORE_PAGES.forEach(function (p) {
  if (!exists(p[1]) || SKIP.has(p[1])) return;
  if (p[1] !== 'index.html' && !meta(p[1])) return; // skips noindex pages
  L.push('- [' + p[0] + '](' + SITE + '/' + (p[1] === 'index.html' ? '' : p[1]) + ')');
});
L.push('');

const cities = cityPages();
L.push('## City Pages');
cities.forEach(function (c) { L.push('- [' + c.name + '](' + SITE + '/' + c.file + ')'); });
L.push('');

const posts = blogPosts();
if (posts.length) {
  L.push('## Blog');
  posts.forEach(function (p) { L.push('- [' + p.title + '](' + SITE + '/' + p.file + ')' + (p.desc ? ': ' + p.desc : '')); });
  L.push('');
}

const text = L.join(LF).split(LF).join(CRLF);
fs.writeFileSync(OUT, text);
console.log('llms.txt: ' + SERVICE_ORDER.filter(exists).length + ' services, ' + cities.length + ' city pages, ' + posts.length + ' blog posts');
