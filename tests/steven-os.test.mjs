import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { buildDecisionQueue, buildExecutionQueue, classifyGate } from '../steven-os/lib/policy-engine.mjs';
import { createProviderRegistry, routeModel } from '../steven-os/lib/model-router.mjs';

const statePath = new URL('../steven-os/state/projects.json', import.meta.url);

async function loadState() {
  return JSON.parse(await fs.readFile(statePath, 'utf8'));
}

test('shadow state preserves the PR 19 evidence boundary', async () => {
  const data = await loadState();
  const project = data.projects.find((p) => p.id === 'cardio-hospital');
  assert.ok(project);
  assert.equal(project.currentWork.number, 19);
  assert.equal(project.currentWork.headSha, '67ded600a65c6d29f24dabb0cdef045feb95e9de');
  assert.equal(project.currentWork.draft, true);
  assert.equal(project.production.verifiedAgainstHead, false);
  assert.ok(project.evidence.some((e) => e.id === 'ue-native-gates' && e.status === 'blocked'));
});

test('policy engine interrupts Steven only for human gates', async () => {
  const { projects } = await loadState();
  const decisions = buildDecisionQueue(projects);
  const execution = buildExecutionQueue(projects);
  assert.deepEqual(decisions.map((d) => d.gateId), ['clinical-review', 'institutional-branding']);
  assert.ok(execution.some((item) => item.gateId === 'native-unreal-validation'));
  assert.ok(execution.some((item) => item.gateId === 'next-action'));
  assert.equal(classifyGate({ type: 'money', state: 'open', owner: 'execution' }), 'needs_steven');
});

test('model router chooses by capability and policy, not provider name', () => {
  const models = [
    { id: 'vendor-a/fast', providerId: 'vendor-a', capabilities: { coding: 0.8, tool_use: 1 }, quality: 0.7, costIndex: 0.2 },
    { id: 'vendor-b/deep', providerId: 'vendor-b', capabilities: { coding: 1, tool_use: 1 }, quality: 0.95, costIndex: 0.8 },
    { id: 'local/tiny', providerId: 'local', capabilities: { coding: 0.4, tool_use: 0 }, quality: 0.3, costIndex: 0.01 }
  ];
  const task = { id: 'hard-code-review', required: { coding: 0.9, tool_use: 1 }, preferred: { coding: 2 }, qualityWeight: 2, costWeight: 0.1 };
  const routed = routeModel(models, task);
  assert.equal(routed.selected.id, 'vendor-b/deep');
});

test('provider registry accepts arbitrary provider IDs', () => {
  const registry = createProviderRegistry([{ id: 'openai' }, { id: 'anthropic' }, { id: 'google' }, { id: 'future-model-company' }]);
  assert.equal(registry.list().length, 4);
  assert.equal(registry.get('future-model-company').id, 'future-model-company');
});
