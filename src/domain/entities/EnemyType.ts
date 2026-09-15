export type { EnemyType } from '../enemies/EnemyRosterCatalog';
export {
  ENEMY_ROSTER,
  getEnemyRosterEntry,
  getCommonsForPowerTier,
  getSubbossesForPowerTier,
  getBossForPowerTier,
  isKnownEnemyType,
} from '../enemies/EnemyRosterCatalog';

import {
  ENEMY_ROSTER,
  getEnemyRosterEntry,
  isKnownEnemyType,
  type EnemyType,
} from '../enemies/EnemyRosterCatalog';
import { pickCommonForGlobalTier } from '../enemies/EnemyTierProgression';

const LEGACY_TYPE_MAP: Record<string, EnemyType> = {
  slime: 'giant_rat',
  goblin: 'goblin_raider',
  orc: 'orc_warrior',
  wraith: 'skeleton_warrior',
  dragon: 'young_green_dragon',
  saci: 'saci',
  gonodor: 'gonodor',
  vorax: 'vorax',
};

export function enemyTypeForStage(stage: number): EnemyType {
  return pickCommonForGlobalTier(stage, 0);
}

export function enemyNameForStage(stage: number): string {
  const entry = getEnemyRosterEntry(enemyTypeForStage(stage));
  return `${entry?.name ?? 'Inimigo'} Lv.${stage}`;
}

export function inferEnemyType(name: string, stage: number): EnemyType {
  const lower = name.toLowerCase();
  if (lower.startsWith('gonodor')) return 'gonodor';
  if (lower.startsWith('vorax')) return 'vorax';
  if (lower.startsWith('saci')) return 'saci';

  for (const entry of ENEMY_ROSTER) {
    if (lower.includes(entry.name.toLowerCase())) return entry.id;
  }

  for (const [legacy, mapped] of Object.entries(LEGACY_TYPE_MAP)) {
    if (lower.startsWith(legacy)) return mapped;
  }

  return enemyTypeForStage(stage);
}

export function migrateLegacyEnemyType(type: string): EnemyType {
  if (isKnownEnemyType(type)) return type;
  return LEGACY_TYPE_MAP[type] ?? 'goblin_raider';
}
