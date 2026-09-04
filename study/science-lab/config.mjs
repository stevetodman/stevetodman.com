import { SCIENCE_CONFIG as BASE_CONFIG } from './data.mjs';

const skillSeen = new Map();
const items = BASE_CONFIG.items.map(item => {
  const count = (skillSeen.get(item.skill) || 0) + 1;
  skillSeen.set(item.skill, count);
  return count === 3 ? { ...item, transfer: true, transferLevel: 'near-transfer' } : item;
});

export const SCIENCE_LAB_CONFIG = {
  ...BASE_CONFIG,
  title: 'Science Lab',
  intro: 'Investigate the full course through evidence, models, explanations, and engineering decisions.',
  storageKey: 'g5-science-lab-v2',
  items
};
