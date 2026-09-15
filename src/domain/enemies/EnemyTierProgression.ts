import { difficultyTierForPhase, MapId, mapIdFromIndex } from '../campaign/CampaignIds';
import { resolveMapCombatIdentity } from '../campaign/MapCombatIdentityCatalog';
import {
  EnemyPowerTier,
  EnemyRosterEntry,
  EnemyType,
  getBossForPowerTier,
  getCommonsForPowerTier,
  getSubbossesForPowerTier,
} from './EnemyRosterCatalog';
import { enemyMatchesPreferredTags } from './EnemyThemeTags';

/** Peso relativo para inimigos alinhados ao tema do mapa (soft bias). */
export const MAP_THEME_PICK_WEIGHT = 3;
export const MAP_THEME_PICK_BASE_WEIGHT = 1;

export function getPowerTierForGlobalTier(globalTier: number): EnemyPowerTier {
  return Math.min(5, Math.max(1, Math.ceil(globalTier / 100))) as EnemyPowerTier;
}

/** Índice 0–99 dentro do bloco de 100 tiers do nível atual. */
export function indexWithinPowerTier(globalTier: number): number {
  return (globalTier - 1) % 100;
}

/** Mapa 1 ou 2 dentro do par de mapas do nível. */
export function mapHalfWithinPowerTier(globalTier: number): 1 | 2 {
  return indexWithinPowerTier(globalTier) < 50 ? 1 : 2;
}

export function unlockedCommonsForGlobalTier(globalTier: number): EnemyRosterEntry[] {
  const powerTier = getPowerTierForGlobalTier(globalTier);
  const commons = getCommonsForPowerTier(powerTier);
  const half = mapHalfWithinPowerTier(globalTier);
  const halfCount = Math.ceil(commons.length / 2);

  if (half === 2) {
    return commons;
  }

  const phaseInMap = ((globalTier - 1) % 50) + 1;
  const unlockCount = Math.min(halfCount, Math.max(2, Math.ceil((phaseInMap / 50) * halfCount)));
  return commons.slice(0, unlockCount);
}

function pickWeightedEntry(
  pool: EnemyRosterEntry[],
  preferredTags: readonly import('./EnemyThemeTags').EnemyThemeTag[],
  globalTier: number,
  offset: number,
): EnemyType {
  if (pool.length === 0) {
    return getCommonsForPowerTier(getPowerTierForGlobalTier(globalTier))[0].id;
  }

  if (preferredTags.length === 0) {
    return pool[(globalTier + offset) % pool.length].id;
  }

  const weights = pool.map((entry) =>
    enemyMatchesPreferredTags(entry, preferredTags)
      ? MAP_THEME_PICK_WEIGHT
      : MAP_THEME_PICK_BASE_WEIGHT,
  );
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let cursor = ((globalTier * 31 + offset * 17) % total + total) % total;

  for (let index = 0; index < pool.length; index += 1) {
    cursor -= weights[index];
    if (cursor < 0) {
      return pool[index].id;
    }
  }

  return pool[pool.length - 1].id;
}

export function pickCommonForGlobalTier(globalTier: number, offset: number): EnemyType {
  const pool = unlockedCommonsForGlobalTier(globalTier);
  if (pool.length === 0) return getCommonsForPowerTier(getPowerTierForGlobalTier(globalTier))[0].id;
  return pool[(globalTier + offset) % pool.length].id;
}

/** Soft bias: favorece tags do mapa, mantém pool misto. */
export function pickCommonForMapPhase(
  mapId: MapId | string,
  globalTier: number,
  offset: number,
): EnemyType {
  const pool = unlockedCommonsForGlobalTier(globalTier);
  const preferred = resolveMapCombatIdentity(mapId).enemyTagsPreferred;
  return pickWeightedEntry(pool, preferred, globalTier, offset);
}

export function pickSubbossForGlobalTier(globalTier: number, offset: number): EnemyType {
  const subs = getSubbossesForPowerTier(getPowerTierForGlobalTier(globalTier));
  return subs[(globalTier + offset) % subs.length].id;
}

export function pickSubbossForMapPhase(
  mapId: MapId | string,
  globalTier: number,
  offset: number,
): EnemyType {
  const subs = getSubbossesForPowerTier(getPowerTierForGlobalTier(globalTier));
  const preferred = resolveMapCombatIdentity(mapId).enemyTagsPreferred;
  return pickWeightedEntry(subs, preferred, globalTier, offset);
}

export function pickLevelBossForGlobalTier(globalTier: number): EnemyType {
  return getBossForPowerTier(getPowerTierForGlobalTier(globalTier)).id;
}

export function milestoneBossForMapIndex(mapIndex: number): EnemyType {
  const milestoneByMap: Record<number, EnemyType> = {
    1: 'saci',
    2: 'gonodor',
    3: 'renegade_necromancer',
    4: 'morthaven_duke',
    5: 'three_head_hydra',
    6: 'young_green_dragon',
    7: 'lesser_lich',
    8: 'awakened_titan',
    9: 'demon_prince',
    10: 'vorax',
  };
  return milestoneByMap[mapIndex] ?? pickLevelBossForGlobalTier(difficultyTierForPhase(mapIndex, 50));
}

export function resolveMapIdForGlobalTier(globalTier: number): MapId {
  const mapIndex = Math.min(10, Math.max(1, Math.ceil(globalTier / 50)));
  return mapIdFromIndex(mapIndex);
}
