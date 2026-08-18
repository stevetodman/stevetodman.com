/**
 * Print the live Chief-of-Staff brief.
 *
 *   node steven-os/scripts/brief.mjs
 *   node steven-os/scripts/brief.mjs --json
 */
import { fetchBrief, formatBriefText, readSecret } from '../lib/control-plane.mjs';

const json = process.argv.includes('--json');

const data = await fetchBrief(readSecret());
process.stdout.write(json ? `${JSON.stringify(data, null, 2)}\n` : formatBriefText(data));
