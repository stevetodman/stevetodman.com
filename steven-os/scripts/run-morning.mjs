/**
 * Steven OS — Morning runner
 *
 * 1. Optionally refresh GitHub state (org ingest)
 * 2. Generate the Chief-of-Staff brief from the live private schema
 * 3. Write state/latest-brief.txt and state/latest-brief.json
 *
 *   node steven-os/scripts/run-morning.mjs
 *   node steven-os/scripts/run-morning.mjs --skip-sync
 */
import { execFile } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { fetchBrief, formatBriefText, readSecret } from '../lib/control-plane.mjs';

const execFileAsync = promisify(execFile);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const stateDir = join(root, 'state');
const SKIP_SYNC = process.argv.includes('--skip-sync');

async function main() {
  console.log(`[${new Date().toISOString()}] Steven OS morning run starting`);

  if (!SKIP_SYNC) {
    console.log('→ Syncing GitHub state…');
    try {
      await execFileAsync(process.execPath, ['scripts/ingest-github-org.mjs'], {
        cwd: root,
        env: process.env,
        maxBuffer: 20 * 1024 * 1024
      }).then(({ stdout, stderr }) => {
        if (stdout) process.stdout.write(stdout);
        if (stderr) process.stderr.write(stderr);
      });
    } catch (error) {
      console.error('Sync failed (continuing with existing state):', error.message);
    }
  } else {
    console.log('→ Skipping sync (--skip-sync)');
  }

  console.log('→ Generating brief…');
  const data = await fetchBrief(readSecret());
  const textBrief = formatBriefText(data);
  const jsonBrief = `${JSON.stringify(data, null, 2)}\n`;

  await mkdir(stateDir, { recursive: true });
  await writeFile(join(stateDir, 'latest-brief.txt'), textBrief, 'utf8');
  await writeFile(join(stateDir, 'latest-brief.json'), jsonBrief, 'utf8');

  console.log('→ Brief written to state/latest-brief.txt and .json');
  console.log(`\n${textBrief}`);
  console.log(`[${new Date().toISOString()}] Morning run complete`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
