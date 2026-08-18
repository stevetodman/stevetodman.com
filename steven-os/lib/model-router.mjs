export const CAPABILITIES = Object.freeze([
  'reasoning',
  'coding',
  'vision',
  'long_context',
  'structured_output',
  'tool_use',
  'web_search'
]);

function normalizeWeight(value) {
  if (value === true) return 1;
  if (value === false || value == null) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

export function scoreModel(model, task) {
  const required = task.required || {};
  const preferred = task.preferred || {};

  for (const [capability, minimum] of Object.entries(required)) {
    if ((model.capabilities?.[capability] ?? 0) < normalizeWeight(minimum)) {
      return Number.NEGATIVE_INFINITY;
    }
  }

  let score = 0;
  for (const [capability, weight] of Object.entries(preferred)) {
    score += (model.capabilities?.[capability] ?? 0) * normalizeWeight(weight);
  }

  if (typeof model.quality === 'number') score += model.quality * (task.qualityWeight ?? 1);
  if (typeof model.costIndex === 'number') score -= model.costIndex * (task.costWeight ?? 0);
  if (typeof model.latencyIndex === 'number') score -= model.latencyIndex * (task.latencyWeight ?? 0);
  if (model.disabled) return Number.NEGATIVE_INFINITY;

  return score;
}

export function routeModel(models, task) {
  const ranked = models
    .map((model) => ({ model, score: scoreModel(model, task) }))
    .filter((entry) => Number.isFinite(entry.score))
    .sort((a, b) => b.score - a.score || a.model.id.localeCompare(b.model.id));

  if (!ranked.length) {
    throw new Error(`No registered model satisfies task capability requirements for ${task.id || 'unnamed-task'}`);
  }

  return {
    selected: ranked[0].model,
    ranked
  };
}

export function createProviderRegistry(providers = []) {
  const byId = new Map();
  for (const provider of providers) {
    if (!provider?.id) throw new Error('Provider requires an id');
    if (byId.has(provider.id)) throw new Error(`Duplicate provider id: ${provider.id}`);
    byId.set(provider.id, Object.freeze({ ...provider }));
  }
  return Object.freeze({
    get(id) { return byId.get(id); },
    list() { return [...byId.values()]; }
  });
}
