import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultSourceRoot = path.join(root, 'dist');
const sourceRoot = path.resolve(process.env.SEARCH_INDEX_SOURCE_ROOT || defaultSourceRoot);
const target = path.resolve(process.env.SEARCH_INDEX_OUTPUT || path.join(defaultSourceRoot, 'site', 'search-index.json'));
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'site/catalog.json'), 'utf8'));

if (!fs.existsSync(sourceRoot)) {
  throw new Error(`search-index source root missing: ${sourceRoot}`);
}

function routeFile(route) {
  if (route === '/') return 'index.html';
  if (route.endsWith('/')) return `${route.slice(1)}index.html`;
  return route.slice(1);
}

function decodeEntities(text) {
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(Number.parseInt(n, 16)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, ' and ')
    .replace(/&lt;/gi, ' ')
    .replace(/&gt;/gi, ' ')
    .replace(/&quot;/gi, ' ')
    .replace(/&#39;/gi, ' ')
    .replace(/&mdash;|&ndash;/gi, ' ');
}

function metaDescription(html) {
  const tag = html.match(/<meta\b(?=[^>]*\bname=["']description["'])[^>]*>/i)?.[0];
  if (!tag) return '';
  const content = tag.match(/\bcontent=(["'])(.*?)\1/i)?.[2] || '';
  return decodeEntities(content).replace(/\s+/g, ' ').trim();
}

function searchableTerms(html) {
  const text = decodeEntities(
    html
      .replace(/<!--[^]*?-->/g, ' ')
      .replace(/<style\b[^>]*>[^]*?<\/style>/gi, ' ')
      .replace(/<svg\b[^>]*>[^]*?<\/svg>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  )
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

  const tokens = text.match(/[a-z0-9]+(?:-[a-z0-9]+)*/g) || [];
  const useful = tokens.filter(token => /[a-z]/.test(token) || /^\d{4}$/.test(token));
  return [...new Set(useful)].sort();
}

const items = [];
for (const item of catalog.items) {
  if (item.class !== 'PRODUCTION' || !item.route || item.id === 'search') continue;
  const relative = routeFile(item.route);
  const file = path.join(sourceRoot, relative);
  if (!fs.existsSync(file)) throw new Error(`search-index production route missing from source root: ${item.route}`);
  const html = fs.readFileSync(file, 'utf8');
  items.push({
    id: item.id,
    title: item.title,
    route: item.route,
    category: item.category,
    audience: item.audience,
    description: metaDescription(html),
    terms: searchableTerms(html),
  });
}

items.sort((a, b) => a.title.localeCompare(b.title));
const output = {
  schemaVersion: 2,
  generatedFrom: sourceRoot === defaultSourceRoot ? 'classified-production-html' : 'test-source-html',
  searchPolicy: 'noindex',
  items,
};

fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, `${JSON.stringify(output)}\n`);
console.log(`Indexed ${items.length} production pages into ${path.relative(root, target)}`);
