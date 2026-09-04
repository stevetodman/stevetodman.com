import { SCIENCE_CONFIG as BASE_CONFIG } from './data.mjs';
import { MATTER_REMEDIATION } from './remediation.mjs';
import { M3_ITEM_OVERRIDES } from './representations.mjs';
import { SCIENCE_PHENOMENA } from './phenomena.mjs';
import { M6_MATTER_ITEMS, M6_MATTER_METADATA, M6_MATTER_PHENOMENON_METADATA } from './matter-m6.mjs';
import { M7_EARTH_SKY_ITEMS, M7_EARTH_SKY_OVERRIDES } from './earth-sky-m7.mjs';
import { M7_LIVING_SYSTEMS_ITEMS, M7_LIVING_SYSTEMS_OVERRIDES } from './living-systems-m7.mjs';

const strictTransferUnits = new Set(['matter', 'earth-sky', 'ecosystems']);
const itemOverrides = { ...M7_EARTH_SKY_OVERRIDES, ...M7_LIVING_SYSTEMS_OVERRIDES };
const skillSeen = new Map();
const expandedItems = [...BASE_CONFIG.items, ...M6_MATTER_ITEMS, ...M7_EARTH_SKY_ITEMS, ...M7_LIVING_SYSTEMS_ITEMS];
const items = expandedItems.map(item => {
  const count = (skillSeen.get(item.skill) || 0) + 1;
  skillSeen.set(item.skill, count);
  const legacyTransfer = !strictTransferUnits.has(item.unit) && count === 3 ? { transfer: true, transferLevel: 'near-transfer' } : {};
  const configured = {
    ...item,
    ...legacyTransfer,
    ...(M6_MATTER_METADATA[item.id] || {}),
    ...(itemOverrides[item.id] || {}),
    ...(MATTER_REMEDIATION[item.id] ? { remediation: MATTER_REMEDIATION[item.id] } : {}),
    ...(M3_ITEM_OVERRIDES[item.id] || {})
  };
  if (strictTransferUnits.has(configured.unit)) configured.transfer = configured.transferLevel === 'far';
  return configured;
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
