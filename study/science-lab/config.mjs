import { SCIENCE_CONFIG as BASE_CONFIG } from './data.mjs';
import { MATTER_REMEDIATION } from './remediation.mjs';
import { M3_ITEM_OVERRIDES } from './representations.mjs';
import { SCIENCE_PHENOMENA } from './phenomena.mjs';
import { M6_MATTER_ITEMS, M6_MATTER_METADATA, M6_MATTER_PHENOMENON_METADATA } from './matter-m6.mjs';

const skillSeen = new Map();
const expandedItems = [...BASE_CONFIG.items, ...M6_MATTER_ITEMS];
const items = expandedItems.map(item => {
  const count = (skillSeen.get(item.skill) || 0) + 1;
  skillSeen.set(item.skill, count);
  const isMatter = item.unit === 'matter';
  const legacyTransfer = !isMatter && count === 3 ? { transfer: true, transferLevel: 'near-transfer' } : {};
  return {
    ...item,
    ...legacyTransfer,
    ...(M6_MATTER_METADATA[item.id] || {}),
    ...(isMatter ? { transfer: (M6_MATTER_METADATA[item.id]?.transferLevel || item.transferLevel || 'none') === 'far' } : {}),
    ...(MATTER_REMEDIATION[item.id] ? { remediation: MATTER_REMEDIATION[item.id] } : {}),
    ...(M3_ITEM_OVERRIDES[item.id] || {})
  };
});

const phenomena = SCIENCE_PHENOMENA.map(phenomenon => {
  const metadata = M6_MATTER_PHENOMENON_METADATA[phenomenon.id];
  if (!metadata) return phenomenon;
  const { steps: stepMetadata = {}, ...phenomenonMetadata } = metadata;
  return {
    ...phenomenon,
    ...phenomenonMetadata,
    steps: phenomenon.steps.map(step => ({ ...step, ...(stepMetadata[step.id] || {}) }))
  };
});

export const SCIENCE_LAB_CONFIG = {
  ...BASE_CONFIG,
  title: 'Science Lab',
  intro: 'Investigate the full course through evidence, models, explanations, and engineering decisions.',
  storageKey: 'g5-science-lab-v2',
  items,
  phenomena
};
