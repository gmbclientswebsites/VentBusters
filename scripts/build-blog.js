'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content', 'blog');
const BLOG_DIR = path.join(ROOT, 'blog');
const BLOG_INDEX = path.join(ROOT, 'blog.html');
const SITEMAP = path.join(ROOT, 'sitemap.xml');
const ARTICLE_TEMPLATE = path.join(BLOG_DIR, 'dryer-vent-cleaning-boca-raton-homeowners-guide.html');

const SITE_URL = 'https://www.vent-busters.com';
const GENERATED_START = '<!-- BEGIN ENGINE BLOG POSTS -->';
const GENERATED_END = '<!-- END ENGINE BLOG POSTS -->';

function readPosts() {
  if (!fs.existsSync(CONTENT_DIR)) return [];

  return fs.readdirSync(CONTENT_DIR)
    .filter((name) => name.endsWith('.json'))
    .map((name) => {
      try {
        const file = path.join(CONTENT_DIR, name);
        const post = JSON.parse(fs.readFileSync(file, 'utf8'));

        if (!post || typeof post !== 'object') return null;
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug)) return null;
        if (post.slug !== path.basename(name, '.json')) return null;
        if (!post.title || !post.bodyHtml || !post.datePublished) return null;

        return post;
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function existingSlugs() {
  if (!fs.existsSync(BLOG_DIR)) return new Set();

  return new Set(
    fs.readdirSync(BLOG_DIR)
      .filter((name) => name.endsWith('.html'))
      .map((name) => path.basename(name, '.html'))
  );
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function formatDate(date) {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(parsed);
}

function articleMarkup(post) {
  const url = `/blog/${post.slug}.html`;
  const title = escapeHtml(post.title);
  const category = escapeHtml(post.category);
  const published = escapeHtml(post.datePublished);
  const modified = escapeHtml(post.dateModified || post.datePublished);
  const readingTime = escapeHtml(post.readingTime);
  const image = escapeHtml(post.image);
  const imageAlt = escapeHtml(post.imageAlt || post.title);
  const description = escapeHtml(post.description);
  const dateText = escapeHtml(formatDate(post.datePublished));

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    image: `${SITE_URL}${post.image}`,
    datePublished: post.datePublished,
    dateModified: post.dateModified || post.datePublished,
    author: { '@type': 'Organization', name: 'Vent Busters' },
    publisher: { '@id': `${SITE_URL}/#business` },
    mainEntityOfPage: `${SITE_URL}${url}`
  };

  return `
  <section class="section section--tight">
    <div class="container article">
      <div class="breadcrumb" style="color:var(--gray-500);"><a href="/" style="color:var(--gray-500);">Home</a> <span aria-hidden="true">/</span> <a href="/blog.html" style="color:var(--gray-500);">Blog</a> <span aria-hidden="true">/</span> ${title}</div>

      <div class="article__meta">
        <span class="tag">${category}</span>
        <span>·</span>
        <time datetime="${published}">${dateText}</time>
        <span>·</span>
        <span>${readingTime}</span>
      </div>

      <h1>${title}</h1>

      <div class="article__cover">
        <img src="${image}" width="1200" height="675" alt="${imageAlt}">
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
      <div class="related-grid"></div>
    </div>
  </section>

  <section class="section section--tight cta-banner">
    <div class="container">
      <h2>Ready to Bust the Lint in Your Home?</h2>
      <p>Book a free vent evaluation and let's fix the problem, not just read about it.</p>
      <a href="/contact.html" class="btn btn--navy btn--lg">Get My Free Quote</a>
      <p style="margin-top:14px;font-size:0.85rem;color:rgba(255,255,255,0.85);">🔥 Free, fast, and no obligation.</p>
    </div>
  </section>`.trim();
}

function buildArticle(post, template) {
  let html = template;

  const title = escapeHtml(`${post.metaTitle || post.title} | Vent Busters`);
  const description = escapeHtml(post.description);
  const url = `/blog/${post.slug}.html`;
  const image = escapeHtml(post.image);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    image: `${SITE_URL}${post.image}`,
    datePublished: post.datePublished,
    dateModified: post.dateModified || post.datePublished,
    author: { '@type': 'Organization', name: 'Vent Busters' },
    publisher: { '@id': `${SITE_URL}/#business` },
    mainEntityOfPage: `${SITE_URL}${url}`
  };

  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`);
  html = html.replace(
    /<meta name="description" content="[\s\S]*?">/i,
    `<meta name="description" content="${description}">`
  );
  html = html.replace(
    /<link rel="canonical" href="[\s\S]*?">/i,
    `<link rel="canonical" href="${SITE_URL}${url}">`
  );
  html = html.replace(
    /<meta property="og:title" content="[\s\S]*?">/i,
    `<meta property="og:title" content="${escapeHtml(post.title)}">`
  );
  html = html.replace(
    /<meta property="og:description" content="[\s\S]*?">/i,
    `<meta property="og:description" content="${description}">`
  );
  html = html.replace(
    /<meta property="og:image" content="[\s\S]*?">/i,
    `<meta property="og:image" content="${SITE_URL}${image}">`
  );
  html = html.replace(
    /<meta property="og:url" content="[\s\S]*?">/i,
    `<meta property="og:url" content="${SITE_URL}${url}">`
  );

  html = html.replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/i,
    `<script type="application/ld+json">${escapeJson(schema)}</script>`
  );

  const mainStart = html.indexOf('<main id="main">');
  const sectionStart = html.indexOf('<section', mainStart);
  const mainEnd = html.indexOf('</main>', sectionStart);

  if (mainStart !== -1 && sectionStart !== -1 && mainEnd !== -1) {
    html = `${html.slice(0, sectionStart)}${articleMarkup(post)}\n${html.slice(mainEnd)}`;
  }

  return html;
}

function blogCard(post) {
  const url = `/blog/${post.slug}.html`;
  return `
        <article class="blog-card">
          <a class="blog-card__media" href="${url}">
            <img src="${escapeHtml(post.image)}" width="1200" height="675" loading="lazy" alt="${escapeHtml(post.imageAlt || post.title)}">
          </a>
          <div class="blog-card__body">
            <div class="blog-card__meta"><span class="tag">${escapeHtml(post.category)}</span><span>·</span><time datetime="${escapeHtml(post.datePublished)}">${escapeHtml(formatDate(post.datePublished))}</time><span>·</span><span>${escapeHtml(post.readingTime)}</span></div>
            <h3><a href="${url}">${escapeHtml(post.title)}</a></h3>
            <p>${escapeHtml(post.excerpt)}</p>
            <a href="${url}" class="blog-card__link">Read the article →</a>
          </div>
        </article>`;
}

function updateIndex(posts) {
  if (!fs.existsSync(BLOG_INDEX) || !posts.length) return;

  let html = fs.readFileSync(BLOG_INDEX, 'utf8');
  const startMarker = `${GENERATED_START}\n`;
  const endMarker = `\n${GENERATED_END}`;

  const generated = posts.map(blogCard).join('\n');

  if (html.includes(GENERATED_START) && html.includes(GENERATED_END)) {
    const start = html.indexOf(startMarker) + startMarker.length;
    const end = html.indexOf(endMarker, start);
    html = `${html.slice(0, start)}${generated}${html.slice(end)}`;
  } else {
    const loopEnd = html.indexOf('      <!-- END CMS-REPLACEABLE POST LOOP -->');
    if (loopEnd === -1) return;

    html = `${html.slice(0, loopEnd)}      ${GENERATED_START}\n${generated}\n      ${GENERATED_END}\n${html.slice(loopEnd)}`;
  }

  fs.writeFileSync(BLOG_INDEX, html);
}

function updateSitemap(posts) {
  if (!fs.existsSync(SITEMAP) || !posts.length) return;

  let xml = fs.readFileSync(SITEMAP, 'utf8');
  const additions = posts
    .map((post) => `${SITE_URL}/blog/${post.slug}.html`)
    .filter((url) => !xml.includes(`<loc>${url}</loc>`))
    .map((url) => `  <url><loc>${url}</loc></url>`)
    .join('\n');

  if (!additions) return;

  const closing = xml.lastIndexOf('</urlset>');
  if (closing === -1) return;

  xml = `${xml.slice(0, closing)}${additions}\n${xml.slice(closing)}`;
  fs.writeFileSync(SITEMAP, xml);
}

function main() {
  const posts = readPosts();
  const occupied = existingSlugs();
  const available = posts.filter((post) => !occupied.has(post.slug));

  if (available.length && fs.existsSync(ARTICLE_TEMPLATE)) {
    const template = fs.readFileSync(ARTICLE_TEMPLATE, 'utf8');

    for (const post of available) {
      const output = path.join(BLOG_DIR, `${post.slug}.html`);
      fs.writeFileSync(output, buildArticle(post, template));
    }
  }

  updateIndex(available);
  updateSitemap(available);
}

main();