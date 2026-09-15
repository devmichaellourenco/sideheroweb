import { EnemyType } from '../entities/EnemyType';
import { getEnemyRosterEntry } from '../enemies/EnemyRosterCatalog';
import { EnemyPowerTier } from '../enemies/EnemyRosterCatalog';
import { CombatProfile, createCombatProfile } from './CombatProfile';

const TIER_BASELINES: Record<EnemyPowerTier, CombatProfile> = {
  1: createCombatProfile({ attackSpeed: 0.6, critChance: 0.005, critDamage: 1.25 }),
  2: createCombatProfile({ attackSpeed: 0.57, critChance: 0.01, critDamage: 1.3 }),
  3: createCombatProfile({ attackSpeed: 0.54, critChance: 0.02, critDamage: 1.4 }),
  4: createCombatProfile({ attackSpeed: 0.48, critChance: 0.025, critDamage: 1.45 }),
  5: createCombatProfile({ attackSpeed: 0.42, critChance: 0.03, critDamage: 1.55 }),
};

export function getEnemyCombatBaseline(enemyType: EnemyType, isBoss = false): CombatProfile {
  const entry = getEnemyRosterEntry(enemyType);
  const tier = entry?.powerTier ?? 1;
  const base = { ...TIER_BASELINES[tier] };

  if (entry?.rosterRole === 'subboss') {
    base.attackSpeed *= 0.92;
    base.critChance = Math.min(0.08, base.critChance + 0.015);
  }

  if (!isBoss && entry?.rosterRole !== 'boss') return base;

  return {
    ...base,
    attackSpeed: base.attackSpeed * 0.85,
    critChance: Math.min(0.1, base.critChance + 0.02),
    critDamage: base.critDamage + 0.1,
  };
}
