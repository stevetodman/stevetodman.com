const STEVEN_ONLY_GATE_TYPES = new Set([
  'human_judgment',
  'clinical_judgment',
  'money',
  'irreversible',
  'public_high_consequence'
]);

export function classifyGate(gate) {
  if (!gate || typeof gate !== 'object') return 'invalid';
  if (gate.state === 'complete' || gate.state === 'pass') return 'resolved';
  if (gate.owner === 'steven' || STEVEN_ONLY_GATE_TYPES.has(gate.type)) return 'needs_steven';
  if (gate.state === 'blocked') return 'blocked_execution';
  return 'execution';
}

export function buildDecisionQueue(projects = []) {
  return projects.flatMap((project) =>
    (project.gates || [])
      .filter((gate) => classifyGate(gate) === 'needs_steven')
      .map((gate) => ({
        projectId: project.id,
        projectName: project.name,
        gateId: gate.id,
        reason: gate.reason,
        type: gate.type,
        priority: project.priority ?? 999
      }))
  ).sort((a, b) => a.priority - b.priority || a.projectName.localeCompare(b.projectName));
}

export function buildExecutionQueue(projects = []) {
  return projects.flatMap((project) => {
    const gateItems = (project.gates || [])
      .filter((gate) => ['execution', 'blocked_execution'].includes(classifyGate(gate)))
      .map((gate) => ({
        projectId: project.id,
        projectName: project.name,
        gateId: gate.id,
        state: classifyGate(gate),
        reason: gate.reason,
        priority: project.priority ?? 999
      }));

    if (project.nextAction?.owner === 'execution') {
      gateItems.unshift({
        projectId: project.id,
        projectName: project.name,
        gateId: 'next-action',
        state: 'execution',
        reason: project.nextAction.action,
        command: project.nextAction.command,
        priority: project.priority ?? 999
      });
    }

    return gateItems;
  }).sort((a, b) => a.priority - b.priority || a.projectName.localeCompare(b.projectName));
}
