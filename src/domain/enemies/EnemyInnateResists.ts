import { PartialResistanceProfile, ResistanceProfile, ZERO_RESISTANCES } from '../combat/ResistanceProfile';
import { tierInnateResistBonus } from '../combat/DifficultyCombatScaling';
import { applyMapResistBias } from '../campaign/MapCombatIdentityCatalog';
import { MapId } from '../campaign/CampaignIds';
import { getEnemyRosterEntry } from './EnemyRosterCatalog';

function inferThemeWeaknesses(enemyType: string): PartialResistanceProfile {
  const id = enemyType.toLowerCase();

  if (id.includes('fire') || id.includes('infernal') || id.includes('pyro')) {
    return { cold: -20 };
  }
  if (id.includes('frost') || id.includes('ice')) {
    return { fire: -20 };
  }
  if (id.includes('lightning') || id.includes('void') || id.includes('arcane')) {
    return { air: -15 };
  }
  if (
    id.includes('undead') ||
    id.includes('wraith') ||
    id.includes('necromancer') ||
    id.includes('lich') ||
    id.includes('zombie') ||
    id.includes('skeleton')
  ) {
    return { fire: -15 };
  }
  if (
    id.includes('poison') ||
    id.includes('spider') ||
    id.includes('hydra') ||
    id.includes('slime') ||
    id.includes('manticore') ||
    id.includes('aberrant')
  ) {
    return { fire: -10 };
  }

  return {};
}

function inferThemeResists(enemyType: string): PartialResistanceProfile {
  const id = enemyType.toLowerCase();

  if (id.includes('fire') || id.includes('infernal') || id.includes('pyro') || id.includes('dragon')) {
    return { fire: 12 };
  }
  if (id.includes('frost') || id.includes('ice')) {
    return { cold: 15 };
  }
  if (id.includes('lightning') || id.includes('void') || id.includes('arcane')) {
    return { lightning: 10 };
  }
  if (
    id.includes('undead') ||
    id.includes('wraith') ||
    id.includes('necromancer') ||
    id.includes('lich') ||
    id.includes('zombie') ||
    id.includes('skeleton') ||
    id.includes('poison') ||
    id.includes('spider') ||
    id.includes('hydra') ||
    id.includes('slime') ||
    id.includes('manticore') ||
    id.includes('aberrant')
  ) {
    return { air: 10 };
  }
  if (id.includes('demon') || id.includes('cultist')) {
    return { fire: 8, air: 6 };
  }

  return {};
}

export function resolveEnemyInnateResists(
  enemyType: string,
  difficultyTier = 1,
  mapId?: MapId | string | null,
): ResistanceProfile {
  const entry = getEnemyRosterEntry(enemyType);
  if (!entry) {
    return ZERO_RESISTANCES;
  }

  const theme = inferThemeResists(enemyType);
  const weakness = inferThemeWeaknesses(enemyType);
  const explicit = entry.innateResists ?? {};
  const roleBonus = entry.rosterRole === 'boss' ? 6 : entry.rosterRole === 'subboss' ? 3 : 0;
  const tierBonus = (entry.powerTier - 1) * 2;
  const globalTierBonus = tierInnateResistBonus(difficultyTier);

  const base: ResistanceProfile = {
    fire: (explicit.fire ?? theme.fire ?? weakness.fire ?? 0) + roleBonus + globalTierBonus,
    cold: (explicit.cold ?? theme.cold ?? weakness.cold ?? 0) + roleBonus + globalTierBonus,
    lightning:
      (explicit.lightning ?? theme.lightning ?? weakness.lightning ?? 0) + roleBonus + globalTierBonus,
    air: (explicit.air ?? theme.air ?? weakness.air ?? 0) + roleBonus + globalTierBonus,
    allElemental: (explicit.allElemental ?? 0) + tierBonus,
  };

  return applyMapResistBias(base, mapId);
}
