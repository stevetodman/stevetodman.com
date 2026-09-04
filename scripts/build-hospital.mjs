import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const app = path.join(root, 'cardio-hospital-3d');
const out = path.join(app, 'out');
const dist = path.join(root, 'dist');
const target = path.join(dist, 'hospital');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

if (!fs.existsSync(path.join(app, 'package.json'))) {
  throw new Error('Unified hospital package.json is missing.');
}

// Cloudflare installs the root package only; until the repository has a simpler
// nested-dependency install stage, provision the hospital deterministically here.
// Validation belongs in focused CI, not in the production build path.
execFileSync(npm, ['ci', '--no-audit', '--no-fund'], {
  cwd: app,
  stdio: 'inherit',
});
execFileSync(npm, ['run', 'build'], {
  cwd: app,
  stdio: 'inherit',
});

if (!fs.existsSync(path.join(out, 'index.html'))) {
  throw new Error('Unified hospital static export did not produce out/index.html.');
}

fs.rmSync(target, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
fs.cpSync(out, target, { recursive: true });

const hospitalHtml = path.join(target, 'index.html');
let html = fs.readFileSync(hospitalHtml, 'utf8');
const noindexMeta = '<meta name="robots" content="noindex, nofollow, noarchive">';
const robotsMeta = /<meta\b(?=[^>]*\bname=["']robots["'])[^>]*>/i;
if (robotsMeta.test(html)) html = html.replace(robotsMeta, noindexMeta);
else html = html.replace(/<head(?:\s[^>]*)?>/i, (head) => `${head}\n${noindexMeta}`);
fs.writeFileSync(hospitalHtml, html);

console.log('Built unified Pediatric Hospital into dist/hospital/.');
