// Full-fidelity mirror of wizarts.be -> local static site
import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ROOT, 'site');
const HOST = 'wizarts.be';
const ORIGIN = 'https://wizarts.be';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

// Seed pages from sitemaps
const SEED = `
https://wizarts.be/
https://wizarts.be/cookie-policy/
https://wizarts.be/1447-2/
https://wizarts.be/alle-projecten/copywriting/
https://wizarts.be/privacy-policy/
https://wizarts.be/cookiebeleid/
https://wizarts.be/contact/
https://wizarts.be/jobs/
https://wizarts.be/over-ons/
https://wizarts.be/alle-projecten/webdesign/
https://wizarts.be/alle-projecten/
https://wizarts.be/alle-projecten/marketing/
https://wizarts.be/alle-projecten/print/
https://wizarts.be/alle-projecten/branding/
https://wizarts.be/wizarts-pro/
https://wizarts.be/expertise/
https://wizarts.be/expertise/branding/copywriting/
https://wizarts.be/expertise/marketing/seo-marketing/
https://wizarts.be/expertise/marketing/advertising/
https://wizarts.be/expertise/marketing/marketingadvies/
https://wizarts.be/expertise/marketing/mailing-campagnes/
https://wizarts.be/expertise/branding/illustraties/
https://wizarts.be/expertise/branding/fotografie/
https://wizarts.be/expertise/branding/animatie-video/
https://wizarts.be/expertise/branding/grafische-vormgeving/
https://wizarts.be/expertise/marketing/
https://wizarts.be/expertise/branding/
https://wizarts.be/expertise/print/lichtreclame-zuilen/
https://wizarts.be/expertise/print/belettering-wrapping-auto/
https://wizarts.be/expertise/print/grootformaat/
https://wizarts.be/expertise/print/
https://wizarts.be/expertise/webdesign/e-commerce/
https://wizarts.be/expertise/marketing/social-media-uitbesteden/
https://wizarts.be/expertise/webdesign/wordpress-websites/
https://wizarts.be/expertise/webdesign/
https://wizarts.be/projecten/
https://wizarts.be/case/normocare/
https://wizarts.be/case/de-lekkere-friet/
https://wizarts.be/case/cameramuze/
https://wizarts.be/case/de-witte/
https://wizarts.be/case/juntas/
https://wizarts.be/case/next-ups-systems/
https://wizarts.be/case/certis/
https://wizarts.be/case/renault/
https://wizarts.be/case/pro-honda-oil/
https://wizarts.be/case/luein/
https://wizarts.be/case/hello-airco/
https://wizarts.be/case/groen-inzicht/
https://wizarts.be/case/aqua-power-technics/
https://wizarts.be/case/homea/
https://wizarts.be/case/kj-keukens/
https://wizarts.be/case/spirits-stories/
https://wizarts.be/case/cape-grapes/
https://wizarts.be/case/kokowa-2/
https://wizarts.be/case/baert/
https://wizarts.be/case/de-kimpe/
https://wizarts.be/case/opsomer/
https://wizarts.be/case/mouton/
https://wizarts.be/case/poolinox/
https://wizarts.be/case/weemaes/
https://wizarts.be/case/wijndomein-nobel/
https://wizarts.be/category/uncategorized/
`.trim().split('\n').map(s => s.trim()).filter(Boolean);

const pageQueue = [...new Set(SEED)];
const pageSeen = new Set();
const assetSeen = new Set();
const assetQueue = [];
let downloaded = 0, failed = 0;

async function fetchBuf(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': '*/*' }, redirect: 'follow' });
      if (!res.ok) { if (res.status === 404) return null; throw new Error('HTTP ' + res.status); }
      const buf = Buffer.from(await res.arrayBuffer());
      const ct = res.headers.get('content-type') || '';
      return { buf, ct, finalUrl: res.url };
    } catch (e) {
      if (i === tries - 1) { console.warn('  ! fail', url, e.message); return null; }
      await new Promise(r => setTimeout(r, 500 * (i + 1)));
    }
  }
}

// Map a URL (absolute) to a local file path under OUT. Returns null if not mirrorable.
function urlToLocal(absUrl, isPage = false) {
  let u;
  try { u = new URL(absUrl); } catch { return null; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  let host = u.hostname;
  let pathname = decodeURIComponent(u.pathname);
  let local;
  if (host === HOST || host === 'www.' + HOST) {
    local = pathname;
  } else {
    // cross-origin asset -> _ext/<host>/<path>
    local = '/_ext/' + host + pathname;
  }
  // pages (trailing slash or no extension) -> index.html
  const last = local.split('/').pop();
  const hasExt = last.includes('.') && !last.endsWith('.');
  if (isPage || local.endsWith('/') || !hasExt) {
    if (!local.endsWith('/')) local += '/';
    local += 'index.html';
  }
  // include query string in filename for assets to avoid collisions
  if (u.search && !isPage) {
    const q = u.search.replace(/[^a-z0-9]+/gi, '_').slice(0, 40);
    const dir = path.dirname(local), base = path.basename(local);
    const dot = base.lastIndexOf('.');
    local = dir + '/' + (dot > 0 ? base.slice(0, dot) + q + base.slice(dot) : base + q);
  }
  return path.join(OUT, local.replace(/^\/+/, ''));
}

function relPath(fromFile, toFile) {
  let r = path.relative(path.dirname(fromFile), toFile);
  if (!r.startsWith('.')) r = './' + r;
  return r.split(path.sep).join('/');
}

function isPageUrl(absUrl) {
  let u; try { u = new URL(absUrl); } catch { return false; }
  if (u.hostname !== HOST && u.hostname !== 'www.' + HOST) return false;
  const p = u.pathname;
  if (/\/wp-admin|\/wp-json|\/feed|xmlrpc|\/wp-login/.test(p)) return false;
  if (/\.(xml|php|json|txt|jpg|jpeg|png|gif|svg|webp|css|js|ico|pdf|woff2?|ttf|eot|mp4|webm|zip)$/i.test(p)) return false;
  return true;
}

async function save(file, buf) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, buf);
}

// Extract URLs from CSS text and rewrite them; queue assets.
function processCss(cssText, baseUrl, cssFile) {
  return cssText.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, (m, q, ref) => {
    if (/^data:/i.test(ref) || ref.startsWith('#')) return m;
    let abs; try { abs = new URL(ref, baseUrl).href; } catch { return m; }
    const local = urlToLocal(abs, false);
    if (!local) return m;
    queueAsset(abs);
    return `url(${q}${relPath(cssFile, local)}${q})`;
  }).replace(/@import\s+(['"])([^'"]+)\1/gi, (m, q, ref) => {
    let abs; try { abs = new URL(ref, baseUrl).href; } catch { return m; }
    const local = urlToLocal(abs, false);
    if (!local) return m;
    queueAsset(abs);
    return `@import ${q}${relPath(cssFile, local)}${q}`;
  });
}

function queueAsset(absUrl) {
  let u; try { u = new URL(absUrl); } catch { return; }
  const key = u.href.split('#')[0];
  if (assetSeen.has(key)) return;
  // only mirror same-host or cross-origin static assets (skip analytics js domains we want live)
  assetSeen.add(key);
  assetQueue.push(key);
}

// Rewrite attribute URL to local relative path; queue it. kind: 'asset'|'page'
function rewriteUrl(ref, baseUrl, docFile, kind) {
  if (!ref || /^(data:|mailto:|tel:|javascript:|#)/i.test(ref.trim())) return ref;
  let abs; try { abs = new URL(ref, baseUrl).href; } catch { return ref; }
  const u = new URL(abs);
  const sameHost = (u.hostname === HOST || u.hostname === 'www.' + HOST);
  if (kind === 'page') {
    if (!isPageUrl(abs)) {
      // maybe it's an asset link
      if (sameHost) { const lf = urlToLocal(abs, false); if (lf) { queueAsset(abs); return relPath(docFile, lf) + (u.hash || ''); } }
      return abs;
    }
    const lf = urlToLocal(abs, true);
    if (!pageSeen.has(abs) && !pageQueue.includes(abs)) pageQueue.push(abs);
    return relPath(docFile, lf) + (u.hash || '');
  }
  // asset
  const lf = urlToLocal(abs, false);
  if (!lf) return ref;
  queueAsset(abs);
  return relPath(docFile, lf);
}

function rewriteSrcset(val, baseUrl, docFile) {
  return val.split(',').map(part => {
    const seg = part.trim();
    const sp = seg.split(/\s+/);
    if (!sp[0]) return seg;
    sp[0] = rewriteUrl(sp[0], baseUrl, docFile, 'asset');
    return sp.join(' ');
  }).join(', ');
}

async function processHtml(html, pageUrl, docFile) {
  // inline <style> blocks
  html = html.replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/gi, (m, a, css, b) =>
    a + processCss(css, pageUrl, docFile) + b);

  // style="" / style='' attributes containing url()
  html = html.replace(/style\s*=\s*(["'])([\s\S]*?)\1/gi, (m, q, css) =>
    css.includes('url(') ? `style=${q}${processCss(css, pageUrl, docFile)}${q}` : m);

  // <a>/<area> href -> page (both quote styles)
  html = html.replace(/(<(?:a|area)\b[^>]*?\bhref\s*=\s*)(["'])([\s\S]*?)\2/gi, (m, a, q, href) =>
    a + q + rewriteUrl(href, pageUrl, docFile, 'page') + q);
  // <link> href -> asset
  html = html.replace(/(<link\b[^>]*?\bhref\s*=\s*)(["'])([\s\S]*?)\2/gi, (m, a, q, href) =>
    a + q + rewriteUrl(href, pageUrl, docFile, 'asset') + q);
  // <script> src
  html = html.replace(/(<script\b[^>]*?\bsrc\s*=\s*)(["'])([\s\S]*?)\2/gi, (m, a, q, src) =>
    a + q + rewriteUrl(src, pageUrl, docFile, 'asset') + q);
  // media src
  html = html.replace(/(<(?:img|source|video|audio|track|embed|iframe)\b[^>]*?\bsrc\s*=\s*)(["'])([\s\S]*?)\2/gi, (m, a, q, src) =>
    a + q + rewriteUrl(src, pageUrl, docFile, 'asset') + q);
  // poster
  html = html.replace(/(\bposter\s*=\s*)(["'])([\s\S]*?)\2/gi, (m, a, q, src) =>
    a + q + rewriteUrl(src, pageUrl, docFile, 'asset') + q);
  // srcset / imagesrcset
  html = html.replace(/(\b(?:image)?srcset\s*=\s*)(["'])([\s\S]*?)\2/gi, (m, a, q, val) =>
    a + q + rewriteSrcset(val, pageUrl, docFile) + q);
  // data-* lazy attrs
  html = html.replace(/(\bdata-(?:src|bg|background|lazy-src|large_image|image|thumb)\s*=\s*)(["'])([\s\S]*?)\2/gi, (m, a, q, src) =>
    a + q + rewriteUrl(src, pageUrl, docFile, 'asset') + q);
  html = html.replace(/(\bdata-srcset\s*=\s*)(["'])([\s\S]*?)\2/gi, (m, a, q, val) =>
    a + q + rewriteSrcset(val, pageUrl, docFile) + q);

  return html;
}

async function crawlPages() {
  while (pageQueue.length) {
    const url = pageQueue.shift();
    if (pageSeen.has(url)) continue;
    pageSeen.add(url);
    const docFile = urlToLocal(url, true);
    process.stdout.write(`PAGE [${pageSeen.size}] ${url}\n`);
    const r = await fetchBuf(url);
    if (!r) { failed++; continue; }
    let html = r.buf.toString('utf8');
    html = await processHtml(html, r.finalUrl || url, docFile);
    await save(docFile, Buffer.from(html, 'utf8'));
    downloaded++;
  }
}

async function downloadAssets() {
  let i = 0;
  const CONC = 8;
  async function worker() {
    while (assetQueue.length) {
      const url = assetQueue.shift();
      const file = urlToLocal(url, false);
      if (!file) continue;
      if (existsSync(file)) continue;
      i++;
      const r = await fetchBuf(url);
      if (!r) { failed++; continue; }
      let buf = r.buf;
      // if CSS, process nested urls
      if (/\.css(\?|$)/i.test(url) || /text\/css/.test(r.ct)) {
        const css = processCss(buf.toString('utf8'), r.finalUrl || url, file);
        buf = Buffer.from(css, 'utf8');
      }
      await save(file, buf);
      downloaded++;
      if (i % 25 === 0) process.stdout.write(`  assets: ${i} done, ${assetQueue.length} queued\n`);
    }
  }
  await Promise.all(Array.from({ length: CONC }, worker));
}

(async () => {
  await mkdir(OUT, { recursive: true });
  console.log('=== Crawling pages ===');
  await crawlPages();
  console.log(`\n=== Downloading assets (${assetQueue.length} queued) ===`);
  // assets may queue more CSS-referenced assets; loop until drained
  let pass = 0;
  while (assetQueue.length && pass < 10) {
    pass++;
    console.log(`-- asset pass ${pass}: ${assetQueue.length} queued --`);
    await downloadAssets();
  }
  console.log(`\nDONE. pages=${pageSeen.size} downloaded=${downloaded} failed=${failed} assets_seen=${assetSeen.size}`);
})();
