import { SCIENCE_CONFIG as BASE_CONFIG } from './data.mjs';
import { MATTER_REMEDIATION } from './remediation.mjs';
import { M3_ITEM_OVERRIDES } from './representations.mjs';
import { SCIENCE_PHENOMENA } from './phenomena.mjs';

const skillSeen = new Map();
const items = BASE_CONFIG.items.map(item => {
  const count = (skillSeen.get(item.skill) || 0) + 1;
  skillSeen.set(item.skill, count);
  return {
    ...item,
    ...(count === 3 ? { transfer: true, transferLevel: 'near-transfer' } : {}),
    ...(MATTER_REMEDIATION[item.id] ? { remediation: MATTER_REMEDIATION[item.id] } : {}),
    ...(M3_ITEM_OVERRIDES[item.id] || {})
  };
});

export const SCIENCE_LAB_CONFIG = {
  ...BASE_CONFIG,
  title: 'Science Lab',
  intro: 'Investigate the full course through evidence, models, explanations, and engineering decisions.',
  storageKey: 'g5-science-lab-v2',
  items,
  phenomena: SCIENCE_PHENOMENA
};
