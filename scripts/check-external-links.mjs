import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'site/catalog.json'), 'utf8'));

function routeFile(route) {
  if (route === '/') return 'index.html';
  if (route.endsWith('/')) return `${route.slice(1)}index.html`;
  return route.slice(1);
}

const urls = new Map();
for (const item of catalog.items.filter((x) => x.class === 'PRODUCTION' && x.route)) {
  const file = path.join(root, routeFile(item.route));
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, 'utf8');
  for (const match of html.matchAll(/href=["'](https?:\/\/[^"'#\s]+(?:#[^"']*)?)["']/gi)) {
    const url = match[1];
    if (!urls.has(url)) urls.set(url, []);
    urls.get(url).push(item.route);
  }
}

const queue = [...urls.entries()];
const failures = [];
const workers = Math.min(6, queue.length || 1);

async function check(url, pages) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      headers: { 'user-agent': 'stevetodman.com-link-check/1.0' },
      signal: AbortSignal.timeout(12000),
    });
    // 401/403/405 still demonstrate that a resource exists. Redirects are valid.
    if (response.status === 404 || response.status === 410 || response.status >= 500) {
      failures.push(`${response.status} ${url} <- ${pages.join(', ')}`);
    }
  } catch (error) {
    failures.push(`ERROR ${url} <- ${pages.join(', ')} (${error.message})`);
  }
}

await Promise.all(Array.from({ length: workers }, async () => {
  while (queue.length) {
    const next = queue.shift();
    if (next) await check(...next);
  }
}));

if (failures.length) {
  console.error(`External link check failed (${failures.length}/${urls.size}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`External link check passed (${urls.size} unique links)`);
