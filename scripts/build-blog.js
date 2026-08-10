'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const contentDir = path.join(root, 'content', 'blog');
const blogDir = path.join(root, 'blog');
const indexPath = path.join(root, 'blog.html');
const sitemapPath = path.join(root, 'sitemap.xml');
const templatePath = path.join(blogDir, 'florida-humidity-duct-cleaning.html');

function readJsonPosts() {
  if (!fs.existsSync(contentDir)) return [];

  return fs.readdirSync(contentDir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => {
      try {
        const post = JSON.parse(fs.readFileSync(path.join(contentDir, file), 'utf8'));
        if (!post || typeof post.slug !== 'string' || !post.title ||
            !post.datePublished || !post.bodyHtml || !post.image) {
          return null;
        }
        return post;
      } catch (_) {
        return null;
      }
    })
    .filter(Boolean);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(date) {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  });
}

function existingSlugs() {
  if (!fs.existsSync(blogDir)) return new Set();

  return new Set(
    fs.readdirSync(blogDir)
      .filter((file) => file.endsWith('.html'))
      .map((file) => file.slice(0, -5))
  );
}

function card(post) {
  const slug = escapeHtml(post.slug);
  const title = escapeHtml(post.title);
  const category = escapeHtml(post.category);
  const date = escapeHtml(post.datePublished);
  const image = escapeHtml(post.image);
  const alt = escapeHtml(post.imageAlt || post.title);
  const excerpt = escapeHtml(post.excerpt || post.description || '');
  const readingTime = escapeHtml(post.readingTime || '');

  return `
        <article class="blog-card">
          <a class="blog-card__media" href="/blog/${slug}.html">
            <img src="${image}" width="1200" height="675" loading="lazy" alt="${alt}">
          </a>
          <div class="blog-card__body">
            <div class="blog-card__meta"><span class="tag">${category}</span><span>·</span><time datetime="${date}">${formatDate(post.datePublished)}</time><span>·</span><span>${readingTime}</span></div>
            <h3><a href="/blog/${slug}.html">${title}</a></h3>
            <p>${excerpt}</p>
            <a href="/blog/${slug}.html" class="blog-card__link">Read the article →</a>
          </div>
        </article>`;
}

function articleMain(post) {
  const title = escapeHtml(post.title);
  const slug = escapeHtml(post.slug);
  const category = escapeHtml(post.category);
  const date = escapeHtml(post.datePublished);
  const modified = escapeHtml(post.dateModified || post.datePublished);
  const image = escapeHtml(post.image);
  const alt = escapeHtml(post.imageAlt || post.title);
  const readingTime = escapeHtml(post.readingTime || '');
  const related = Array.isArray(post.related) ? post.related : [];

  const relatedCards = related
    .filter((relatedSlug) => typeof relatedSlug === 'string')
    .slice(0, 3)
    .map((relatedSlug) => `
        <article class="blog-card">
          <div class="blog-card__body">
            <h3><a href="/blog/${escapeHtml(relatedSlug)}.html">${escapeHtml(relatedSlug.replace(/-/g, ' '))}</a></h3>
            <a href="/blog/${escapeHtml(relatedSlug)}.html" class="blog-card__link">Read the article →</a>
          </div>
        </article>`)
    .join('');

  return `
  <section class="section section--tight">
    <div class="container article">
      <div class="breadcrumb" style="color:var(--gray-500);"><a href="/" style="color:var(--gray-500);">Home</a> <span aria-hidden="true">/</span> <a href="/blog.html" style="color:var(--gray-500);">Blog</a> <span aria-hidden="true">/</span> ${title}</div>

      <div class="article__meta">
        <span class="tag">${category}</span>
        <span>·</span>
        <time datetime="${date}">${formatDate(post.datePublished)}</time>
        <span>·</span>
        <span>${readingTime}</span>
      </div>

      <h1>${title}</h1>

      <div class="article__cover">
        <img src="${image}" width="1200" height="675" alt="${alt}">
      </div>

      <div class="article__body">
        ${post.bodyHtml}
      </div>

      <div class="author-box">
        <div class="avatar" aria-hidden="true">VB</div>
        <div>
          <strong>Vent Busters Team</strong>
          <span>Insured dryer vent cleaning specialists</span>
        </div>
      </div>
    </div>
  </section>

  <section class="section section--alt" aria-labelledby="related-heading">
    <div class="container">
      <div class="section-head">
        <div class="eyebrow">Keep Reading</div>
        <h2 id="related-heading">Related Articles</h2>
      </div>
      <div class="related-grid">${relatedCards}</div>
    </div>
  </section>

  <section class="section section--tight cta-banner">
    <div class="container">
      <h2>Ready to Bust the Lint in Your Home?</h2>
      <p>Book a free vent evaluation and let's fix the problem, not just read about it.</p>
      <a href="/contact.html" class="btn btn--navy btn--lg">Get My Free Quote</a>
      <p style="margin-top:14px;font-size:0.85rem;color:rgba(255,255,255,0.85);">🔥 Free, fast, and no obligation.</p>
    </div>
  </section>`;
}

function generatePage(post, template) {
  const title = escapeHtml(post.title);
  const description = escapeHtml(post.description || post.excerpt || '');
  const image = escapeHtml(post.image);
  const url = `https://www.vent-busters.com/blog/${encodeURIComponent(post.slug)}.html`;
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description || post.excerpt || '',
    image: `https://www.vent-busters.com${post.image}`,
    datePublished: post.datePublished,
    dateModified: post.dateModified || post.datePublished,
    author: { '@type': 'Organization', name: 'Vent Busters' },
    publisher: { '@id': 'https://www.vent-busters.com/#business' },
    mainEntityOfPage: url
  }, null, 2);

  return template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(post.metaTitle || post.title)} | Vent Busters</title>`)
    .replace(/<meta name="description" content="[\s\S]*?">/, `<meta name="description" content="${description}">`)
    .replace(/<link rel="canonical" href="[\s\S]*?">/, `<link rel="canonical" href="${url}">`)
    .replace(/<meta property="og:title" content="[\s\S]*?">/, `<meta property="og:title" content="${title}">`)
    .replace(/<meta property="og:description" content="[\s\S]*?">/, `<meta property="og:description" content="${description}">`)
    .replace(/<meta property="og:image" content="[\s\S]*?">/, `<meta property="og:image" content="https://www.vent-busters.com${image}">`)
    .replace(/<meta property="og:url" content="[\s\S]*?">/, `<meta property="og:url" content="${url}">`)
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">\n${jsonLd}\n</script>`)
    .replace(/<main id="main">[\s\S]*?<\/main>/, `<main id="main">${articleMain(post)}\n</main>`);
}

function updateIndex(posts, slugs) {
  if (!fs.existsSync(indexPath)) return;

  const original = fs.readFileSync(indexPath, 'utf8');
  const generated = posts
    .filter((post) => !slugs.has(post.slug))
    .sort((a, b) => String(b.datePublished).localeCompare(String(a.datePublished)))
    .map(card)
    .join('\n');

  const updated = original.replace(
    /<!-- BEGIN CMS-REPLACEABLE POST LOOP -->[\s\S]*?<!-- END CMS-REPLACEABLE POST LOOP -->/,
    `<!-- BEGIN CMS-REPLACEABLE POST LOOP -->\n      <div class="blog-grid">${generated}\n      </div>\n      <!-- END CMS-REPLACEABLE POST LOOP -->`
  );

  fs.writeFileSync(indexPath, updated);
}

function updateSitemap(posts, slugs) {
  if (!fs.existsSync(sitemapPath)) return;

  let sitemap = fs.readFileSync(sitemapPath, 'utf8');
  const additions = posts
    .filter((post) => !slugs.has(post.slug))
    .map((post) => `  <url>
    <loc>https://www.vent-busters.com/blog/${escapeHtml(post.slug)}.html</loc>
    <lastmod>${escapeHtml(post.dateModified || post.datePublished)}</lastmod>
    <priority>0.6</priority>
  </url>`)
    .join('\n');

  if (additions) sitemap = sitemap.replace('</urlset>', `${additions}\n</urlset>`);
  fs.writeFileSync(sitemapPath, sitemap);
}

const posts = readJsonPosts();
const handwrittenSlugs = existingSlugs();
const template = fs.existsSync(templatePath)
  ? fs.readFileSync(templatePath, 'utf8')
  : '<!DOCTYPE html><html><head></head><body><main id="main"></main></body></html>';

for (const post of posts) {
  if (handwrittenSlugs.has(post.slug)) continue;

  const outputPath = path.join(blogDir, `${post.slug}.html`);
  fs.writeFileSync(outputPath, generatePage(post, template));
}

updateIndex(posts, handwrittenSlugs);
updateSitemap(posts, handwrittenSlugs);
===END FILE