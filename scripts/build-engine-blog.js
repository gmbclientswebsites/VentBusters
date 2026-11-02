'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const contentDir = path.join(root, 'content', 'blog');
const sourcePage = path.join(root, 'blog', 'dryer-vent-cleaning-boca-raton-homeowners-guide.html');
const blogIndex = path.join(root, 'blog.html');
const sitemap = path.join(root, 'sitemap.xml');
const imageSourceDir = path.join(root, 'public', 'images', 'blog');
const imageOutputDir = path.join(root, 'images', 'blog');

function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function dateLabel(value) {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  });
}

function readPosts() {
  if (!fs.existsSync(contentDir)) return [];

  return fs.readdirSync(contentDir)
    .filter(name => name.endsWith('.json'))
    .map(name => {
      try {
        const file = path.join(contentDir, name);
        const post = JSON.parse(fs.readFileSync(file, 'utf8'));
        if (!post || typeof post !== 'object' || !post.slug || !post.title || !post.bodyHtml) return null;
        return post;
      } catch (_) {
        return null;
      }
    })
    .filter(Boolean);
}

/* A slug backed by a content JSON is owned by that JSON, not hand-written, so
 * it must NOT count as occupied. Without this the first build freezes the post
 * and every later edit to the JSON silently does nothing. Posts with no JSON
 * are genuinely hand-written and are still skipped. */
function existingSlugs() {
  const dir = path.join(root, 'blog');
  if (!fs.existsSync(dir)) return new Set();

  const jsonBacked = new Set(
    (fs.existsSync(contentDir) ? fs.readdirSync(contentDir) : [])
      .filter(name => name.endsWith('.json'))
      .map(name => name.slice(0, -5))
  );

  return new Set(
    fs.readdirSync(dir)
      .filter(name => name.endsWith('.html'))
      .map(name => name.slice(0, -5))
      .filter(slug => !jsonBacked.has(slug))
  );
}

function copyImage(post) {
  if (!post.image || !post.image.startsWith('/images/blog/')) return;

  const filename = path.basename(post.image);
  const source = path.join(imageSourceDir, filename);
  const destination = path.join(imageOutputDir, filename);

  if (fs.existsSync(source)) {
    fs.mkdirSync(imageOutputDir, { recursive: true });
    fs.copyFileSync(source, destination);
  }
}

function makePage(template, post) {
  const title = esc(post.title);
  const metaTitle = esc(post.metaTitle || post.title);
  const description = esc(post.description || post.excerpt || '');
  const image = esc(post.image || '');
  const imageAlt = esc(post.imageAlt || post.title);
  const date = esc(post.datePublished || '');
  const modified = esc(post.dateModified || post.datePublished || '');
  const category = esc(post.category || 'Vent Busters');
  const readingTime = esc(post.readingTime || '');
  const slug = esc(post.slug);
  const canonical = `https://www.vent-busters.com/blog/${slug}.html`;

  let page = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${metaTitle} | Vent Busters</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${description}">`)
    .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${canonical}">`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${title}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${description}">`)
    .replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="https://www.vent-busters.com${image}">`)
    .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${canonical}">`)
    .replace(/<main id="main">[\s\S]*?<\/main>/, `
<main id="main">
  <section class="section section--tight">
    <div class="container article">
      <div class="breadcrumb" style="color:var(--gray-500);"><a href="/" style="color:var(--gray-500);">Home</a> <span aria-hidden="true">/</span> <a href="/blog.html" style="color:var(--gray-500);">Blog</a> <span aria-hidden="true">/</span> ${title}</div>
      <div class="article__meta">
        <span class="tag">${category}</span>
        <span>·</span>
        <time datetime="${date}">${dateLabel(post.datePublished || '')}</time>
        <span>·</span>
        <span>${readingTime}</span>
      </div>
      <h1>${title}</h1>
      <div class="article__cover">
        <img src="${image}" width="1200" height="675" alt="${imageAlt}">
      </div>
      <div class="article__body">${post.bodyHtml}</div>
      <div class="author-box">
        <div class="avatar" aria-hidden="true">VB</div>
        <div>
          <strong>Vent Busters Team</strong>
          <span>Insured dryer vent cleaning specialists</span>
        </div>
      </div>
    </div>
  </section>
  <section class="section section--tight cta-banner">
    <div class="container">
      <h2>Ready to Clear Your Dryer Vent?</h2>
      <p>Book a dryer vent cleaning and we will measure the airflow before and after, so you can see what changed.</p>
      <a href="/contact.html" class="btn btn--navy btn--lg">Schedule Dryer Vent Service</a>
      <p style="margin-top:14px;font-size:0.85rem;color:rgba(255,255,255,0.85);">🔥 Free, fast, and no obligation.</p>
    </div>
  </section>
</main>`)
    .replace(/(?:<script type="application\/ld\+json">[\s\S]*?<\/script>\s*)+/, `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": ${JSON.stringify(post.title)},
  "description": ${JSON.stringify(post.description || post.excerpt || '')},
  "image": ${JSON.stringify(`https://www.vent-busters.com${post.image || ''}`)},
  "datePublished": ${JSON.stringify(post.datePublished || '')},
  "dateModified": ${JSON.stringify(post.dateModified || post.datePublished || '')},
  "author": { "@type": "Organization", "name": "Vent Busters" },
  "publisher": { "@id": "https://www.vent-busters.com/#business" },
  "mainEntityOfPage": ${JSON.stringify(canonical)}
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.vent-busters.com/" },
    { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://www.vent-busters.com/blog.html" },
    { "@type": "ListItem", "position": 3, "name": ${JSON.stringify(post.title)}, "item": ${JSON.stringify(canonical)} }
  ]
}
</script>`);

  return page;
}

function card(post) {
  const title = esc(post.title);
  const slug = esc(post.slug);
  return `<article class="blog-card">
  <a class="blog-card__media" href="/blog/${slug}.html">
    <img src="${esc(post.image)}" width="1200" height="675" loading="lazy" alt="${esc(post.imageAlt || post.title)}">
  </a>
  <div class="blog-card__body">
    <div class="blog-card__meta"><span class="tag">${esc(post.category || '')}</span><span>·</span><time datetime="${esc(post.datePublished || '')}">${dateLabel(post.datePublished || '')}</time><span>·</span><span>${esc(post.readingTime || '')}</span></div>
    <h3><a href="/blog/${slug}.html">${title}</a></h3>
    <p>${esc(post.excerpt || post.description || '')}</p>
    <a href="/blog/${slug}.html" class="blog-card__link">Read the article →</a>
  </div>
</article>`;
}

/* This appended cards before the marker with no de-duplication, so every build
 * stacked another copy of each post onto blog.html. It was masked while posts
 * were always skipped. build-blog.js runs first and owns the listing through
 * its BEGIN/END ENGINE BLOG POSTS block, so when that block is present this is
 * a no-op rather than a second writer fighting over the same file. */
function updateIndex(posts) {
  if (!fs.existsSync(blogIndex) || !posts.length) return;
  const rawIndex = fs.readFileSync(blogIndex, 'utf8');
  if (rawIndex.indexOf('<!-- BEGIN ENGINE BLOG POSTS -->') !== -1) return;

  const indexIsCrlf = rawIndex.indexOf('\r\n') !== -1;
  let html = indexIsCrlf ? rawIndex.split('\r\n').join('\n') : rawIndex;
  const marker = '<!-- END CMS-REPLACEABLE POST LOOP -->';
  if (html.indexOf(marker) === -1) return;

  for (const post of posts) {
    const cardRe = new RegExp(
      '\\s*<article class="blog-card">\\n(?:(?!</article>)[\\s\\S])*?/blog/' +
      post.slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\.html(?:(?!</article>)[\\s\\S])*?</article>',
      'g'
    );
    html = html.replace(cardRe, (hit) => {
      if (/<main|<h1|<\/head>|<footer/.test(hit)) {
        console.error('build: refusing to remove a blog-card match that spans page structure (slug ' + post.slug + ')');
        return hit;
      }
      return '';
    });
  }

  const additions = posts.map(card).join('\n');
  html = html.replace(marker, additions + '\n      ' + marker);
  fs.writeFileSync(blogIndex, indexIsCrlf ? html.split('\n').join('\r\n') : html);
}

function updateSitemap(posts) {
  if (!fs.existsSync(sitemap) || !posts.length) return;
  let xml = fs.readFileSync(sitemap, 'utf8');
  const additions = posts
    .map(post => `  <url><loc>https://www.vent-busters.com/blog/${esc(post.slug)}.html</loc><lastmod>${esc(post.dateModified || post.datePublished || '')}</lastmod></url>`)
    .filter(entry => !xml.includes(entry.match(/<loc>(.*?)<\/loc>/)[1]))
    .join('\n');

  if (additions) {
    xml = xml.replace('</urlset>', `${additions}\n</urlset>`);
    fs.writeFileSync(sitemap, xml);
  }
}

function main() {
  const template = fs.existsSync(sourcePage) ? fs.readFileSync(sourcePage, 'utf8') : null;
  if (!template) return;

  const existing = existingSlugs();
  const generated = [];

  for (const post of readPosts()) {
    // Mirror the featured image for every post, not just the ones generated
    // here. build-blog.js runs first and writes the page, so by this point the
    // slug already exists and the skip below would leave the image uncopied —
    // which served /images/blog/<file> as a 404 on an otherwise fine post.
    copyImage(post);
    if (existing.has(post.slug)) continue;
    fs.mkdirSync(path.join(root, 'blog'), { recursive: true });
    fs.writeFileSync(
      path.join(root, 'blog', `${post.slug}.html`),
      makePage(template, post)
    );
    generated.push(post);
  }

  updateIndex(generated);
  updateSitemap(generated);
}

main();
