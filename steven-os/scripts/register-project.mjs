/**
 * Register or list canonical projects through the existing ingest/brief APIs.
 *
 *   node steven-os/scripts/register-project.mjs --list
 *   node steven-os/scripts/register-project.mjs \
 *     --id=peds-ecg-viewer \
 *     --name="Pediatric ECG Viewer" \
 *     --objective="Pixel-perfect GE MUSE clone for pediatric cardiology teaching" \
 *     --repo=stevetodman/peds-ecg-viewer \
 *     --priority=2
 */
import { fetchBrief, postIngest, readSecret } from '../lib/control-plane.mjs';

const args = process.argv.slice(2);

function value(name) {
  const raw = args.find((item) => item.startsWith(`--${name}=`));
  return raw ? raw.slice(name.length + 3) : undefined;
}

function flag(name) {
  return args.includes(`--${name}`);
}

async function listProjects() {
  const data = await fetchBrief(readSecret());
  const projects = data.projects || [];
  if (!projects.length) {
    console.log('No projects registered.');
    return;
  }
  console.log('Registered projects:\n');
  for (const project of projects) {
    console.log(project.id);
    console.log(`  ${project.name}`);
    console.log(`  status=${project.status}  priority=${project.priority}`);
    console.log(`  repo=${project.repository_full_name || '(none)'}`);
    console.log(`  open_work=${project.open_work_items}  decisions=${project.open_decisions}`);
    console.log(`  updated=${project.updated_at}`);
    console.log('');
  }
}

async function register() {
  const id = value('id');
  const name = value('name');
  const objective = value('objective');
  const repo = value('repo');
  const priority = Number(value('priority') || 100);
  const status = value('status') || 'active';
  const risk = value('risk') || 'medium';
  const production = value('production') || null;
  const now = new Date().toISOString();

  if (!id || !name || !objective) {
    console.error('Required: --id= --name= --objective=');
    process.exit(1);
  }

  const result = await postIngest({
    project: {
      id,
      name,
      objective,
      status,
      priority: Number.isInteger(priority) ? priority : 100,
      riskLevel: risk,
      repositoryFullName: repo || null,
      productionUrl: production,
      metadata: { source: 'register-project' }
    },
    source: {
      sourceSystem: 'manual',
      externalId: `register:${id}`,
      sourceUrl: repo ? `https://github.com/${repo}` : null,
      sourceSha: `register:${now}`,
      observedAt: now,
      metadata: { registeredBy: 'register-project.mjs' }
    },
    workItem: {
      externalSystem: 'manual',
      externalId: `register:${id}`,
      kind: 'registration',
      title: `Registered ${name}`,
      state: 'complete',
      ownerClass: 'external',
      acceptanceCriteria: [],
      metadata: { repositoryFullName: repo || null }
    },
    event: {
      eventType: 'project_registered',
      externalEventId: `register:${id}@${now}`,
      occurredAt: now,
      observedAt: now,
      payload: { id, repo: repo || null }
    },
    evidence: []
  }, readSecret());

  console.log('Registered / updated:');
  console.log(`  id:     ${result.projectId || id}`);
  console.log(`  name:   ${name}`);
  console.log(`  status: ${status}`);
  console.log(`  priority: ${priority}`);
  console.log(`  repo:   ${repo || '(none)'}`);
}

if (flag('list') || args.length === 0) {
  await listProjects();
} else {
  await register();
}
