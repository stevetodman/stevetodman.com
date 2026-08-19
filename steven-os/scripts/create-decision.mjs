/**
 * Open a formal decision in the Needs You queue.
 *
 *   node steven-os/scripts/create-decision.mjs \
 *     --project=cardio-hospital \
 *     --title="Approve institutional branding" \
 *     --question="May named institutional branding ship in the packaged build?" \
 *     --consequence="Blocks a walkthrough pass claim that includes branding"
 */
import { postResolve, readSecret } from '../lib/control-plane.mjs';

const args = process.argv.slice(2);

function value(name) {
  const raw = args.find((item) => item.startsWith(`--${name}=`));
  return raw ? raw.slice(name.length + 3) : undefined;
}

const projectId = value('project');
const title = value('title');
const question = value('question');
const consequence = value('consequence') || null;
const recommendationRaw = value('recommendation');
const alternativesRaw = value('alternatives');

if (!projectId || !title || !question) {
  console.error('Required: --project= --title= --question=');
  process.exit(1);
}

let recommendation = null;
if (recommendationRaw) {
  try {
    recommendation = JSON.parse(recommendationRaw);
  } catch {
    recommendation = { action: recommendationRaw };
  }
}

let alternatives = [];
if (alternativesRaw) {
  try {
    alternatives = JSON.parse(alternativesRaw);
  } catch {
    alternatives = alternativesRaw.split('|').map((item) => item.trim()).filter(Boolean);
  }
}

const result = await postResolve({
  action: 'create',
  project_id: projectId,
  title,
  question,
  consequence,
  recommendation,
  alternatives
}, readSecret());

const decision = result.decision || result;
console.log('Opened decision:');
console.log(`  id:      ${decision.id}`);
console.log(`  project: ${projectId}`);
console.log(`  title:   ${decision.title}`);
console.log(`  state:   ${decision.state || 'open'}`);
