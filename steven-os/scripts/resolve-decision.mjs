/**
 * Resolve a Needs You decision through the existing secret resolve API.
 *
 *   node steven-os/scripts/resolve-decision.mjs --list
 *   node steven-os/scripts/resolve-decision.mjs <id> --approve
 *   node steven-os/scripts/resolve-decision.mjs <id> --reject
 *   node steven-os/scripts/resolve-decision.mjs <id> --supersede --notes="..."
 *   node steven-os/scripts/resolve-decision.mjs <id> --choice="Option B" --notes="..."
 */
import { fetchBrief, postResolve, readSecret } from '../lib/control-plane.mjs';

const args = process.argv.slice(2);

function flag(name) {
  return args.includes(`--${name}`);
}

function value(name) {
  const raw = args.find((item) => item.startsWith(`--${name}=`));
  return raw ? raw.slice(name.length + 3) : undefined;
}

async function listOpen() {
  const data = await fetchBrief(readSecret());
  const decisions = data.decisions || [];
  if (!decisions.length) {
    console.log('No open decisions.');
    return;
  }
  console.log('Open decisions:\n');
  for (const item of decisions) {
    console.log(item.id);
    console.log(`  ${item.project_name} · priority ${item.priority}`);
    console.log(`  ${item.title}`);
    if (item.question) console.log(`  ${item.question}`);
    if (item.consequence) console.log(`  Consequence: ${item.consequence}`);
    console.log('');
  }
}

async function resolve(id) {
  const action = (flag('reject') || flag('supersede')) ? 'reject' : 'approve';
  const choice = value('choice');
  const notes = value('notes')
    || (choice ? `Choice: ${choice}` : undefined)
    || (flag('approve') ? 'Approved by Steven' : 'Rejected by Steven');

  const result = await postResolve({
    id,
    action,
    notes,
    force: flag('force')
  }, readSecret());

  const decision = result.decision || result;
  console.log('Resolved:');
  console.log(`  id:     ${decision.id}`);
  console.log(`  title:  ${decision.title}`);
  console.log(`  state:  ${decision.state}`);
  console.log(`  at:     ${decision.decided_at}`);
}

if (flag('list') || args.length === 0) {
  await listOpen();
} else {
  const id = args.find((item) => !item.startsWith('--'));
  if (!id) {
    console.error('Provide a decision id or use --list');
    process.exit(1);
  }
  if (!flag('approve') && !flag('reject') && !flag('supersede') && !value('choice')) {
    console.error('Specify one of: --approve | --reject | --supersede | --choice="..."');
    process.exit(1);
  }
  await resolve(id);
}
