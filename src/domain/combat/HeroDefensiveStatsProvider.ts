import { Enemy } from '../entities/Enemy';
import { Hero } from '../entities/Hero';
import { Gear } from '../entities/Gear';
import {
  clampDefensiveMitigation,
  DefensiveMitigation,
} from './DefensiveMitigation';
import { getEnemyRosterEntry } from '../enemies/EnemyRosterCatalog';

function sumGearDefensive(gears: Iterable<Gear | null | undefined>): DefensiveMitigation {
  let dodgeChance = 0;
  let blockChance = 0;
  let damageReduction = 0;

  for (const gear of gears) {
    if (!gear) continue;
    dodgeChance += gear.dodgeChanceBonus;
    blockChance += gear.blockChanceBonus;
    damageReduction += gear.damageReductionBonus;
  }

  return { dodgeChance, blockChance, damageReduction };
}

function baseHeroDodge(hero: Hero): number {
  return hero.totalAttributes.dex * 0.0015;
}

export function defensiveMitigationForHero(hero: Hero): DefensiveMitigation {
  const fromGear = sumGearDefensive(Object.values(hero.toProps().equipment ?? {}));

  return clampDefensiveMitigation({
    dodgeChance: fromGear.dodgeChance + baseHeroDodge(hero),
    blockChance: fromGear.blockChance,
    damageReduction: fromGear.damageReduction,
  });
}

export function defensiveMitigationForEnemy(enemy: Enemy): DefensiveMitigation {
  // Mesma base de esquiva por DEX que heróis.
  const dodgeChance = enemy.totalAttributes.dex * 0.0015;
  const entry = getEnemyRosterEntry(enemy.enemyType);
  const roleDodge =
    entry?.rosterRole === 'boss' ? 0.04 : entry?.rosterRole === 'subboss' ? 0.02 : 0;

  return clampDefensiveMitigation({
    dodgeChance: dodgeChance + roleDodge,
    blockChance: 0,
    damageReduction: 0,
  });
}
