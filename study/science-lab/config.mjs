import { SCIENCE_CONFIG as BASE_CONFIG } from './data.mjs';
import { MATTER_REMEDIATION } from './remediation.mjs';
import { M3_ITEM_OVERRIDES } from './representations.mjs';
import { SCIENCE_PHENOMENA } from './phenomena.mjs';
import { M6_MATTER_ITEMS, M6_MATTER_METADATA, M6_MATTER_PHENOMENON_METADATA } from './matter-m6.mjs';
import { M7_EARTH_SKY_ITEMS, M7_EARTH_SKY_OVERRIDES } from './earth-sky-m7.mjs';

const skillSeen = new Map();
const expandedItems = [...BASE_CONFIG.items, ...M6_MATTER_ITEMS, ...M7_EARTH_SKY_ITEMS];
const items = expandedItems.map(item => {
  const count = (skillSeen.get(item.skill) || 0) + 1;
  skillSeen.set(item.skill, count);
  const strictTransfer = item.unit === 'matter' || item.unit === 'earth-sky';
  const legacyTransfer = !strictTransfer && count === 3 ? { transfer: true, transferLevel: 'near-transfer' } : {};
  const earthSkyOverride = M7_EARTH_SKY_OVERRIDES[item.id] || {};
  return {
    ...item,
    ...legacyTransfer,
    ...(M6_MATTER_METADATA[item.id] || {}),
    ...earthSkyOverride,
    ...(item.unit === 'matter' ? { transfer: (M6_MATTER_METADATA[item.id]?.transferLevel || item.transferLevel || 'none') === 'far' } : {}),
    ...(item.unit === 'earth-sky' ? { transfer: (earthSkyOverride.transferLevel || item.transferLevel || 'none') === 'far' } : {}),
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
