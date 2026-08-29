import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

export const STUDY_RELEASE_ASSETS = Object.freeze([
  'app.js',
  'game-art.js',
  'quality-core.js',
  'sfx-bank.js',
  'audio-unlock.js',
  'unit1-contexts.js',
  'aaa-polish.js',
  'aaa-collection.js',
  'monster-banter.js',
  'app.css',
  'aaa-polish.css',
  'monster-banter.css',
  'assets/expedition-sprites.webp',
  'assets/forest-clearing.webp',
  'assets/expedition-world.webp',
  'assets/monster-sprites.webp',
  'assets/extra-gear.webp',
  'assets/hero-poses.webp',
]);

export function computeStudyReleaseVersion(unitDirectory) {
  const hash = createHash('sha256');
  for (const asset of STUDY_RELEASE_ASSETS) {
    hash.update(fs.readFileSync(path.join(unitDirectory, asset)));
  }
  return hash.digest('hex').slice(0, 12);
}
