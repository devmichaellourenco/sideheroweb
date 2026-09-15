import { Enemy } from '../entities/Enemy';
import { Gear } from '../entities/Gear';
import { Hero } from '../entities/Hero';
import { getEnemyCombatIdentity } from '../enemies/EnemyCombatIdentityCatalog';
import { CombatSkillDefinition } from '../progression/combat/CombatSkillDefinition';
import { resolveAttributeAttackSpeed, resolveHeroAttributeAttackSpeed } from './CombatSpeedScaling';
import { getClassCombatBaseline } from './ClassCombatBaselines';
import { CombatProfile, createCombatProfile } from './CombatProfile';
import { getEnemyTierCombatBaseline } from '../enemies/EnemyProgressionCatalog';

const MIN_COMBAT_SPEED = 0.175;

function sumGearBonus(gear: Partial<Record<string, Gear | null>>, selector: (g: Gear) => number): number {
  return Object.values(gear ?? {}).reduce((sum, item) => {
    if (!item) return sum;
    return sum + selector(item);
  }, 0);
}

export function resolveCastSpeed(baseCastSpeed: number, castSpeedBonus: number): number {
  return Math.max(MIN_COMBAT_SPEED, baseCastSpeed + castSpeedBonus);
}

/** Converte % de CDR do gear em fração — o teto/piso fica na skill. */
export function resolveCooldownReduction(cooldownReductionPercent: number): number {
  return cooldownReductionPercent / 100;
}

export function applyCooldownReduction(
  baseCooldownSeconds: number,
  cooldownReduction: number,
  skill?: Pick<CombatSkillDefinition, 'maxCooldownReduction' | 'minCooldownReduction'>,
): number {
  if (baseCooldownSeconds <= 0) {
    return 0;
  }

  let cdr = cooldownReduction;
  if (skill?.maxCooldownReduction !== undefined) {
    cdr = Math.min(skill.maxCooldownReduction, cdr);
  }
  if (skill?.minCooldownReduction !== undefined) {
    cdr = Math.max(skill.minCooldownReduction, cdr);
  }

  return Math.max(0, baseCooldownSeconds * (1 - cdr));
}

function resolveAttackSpeed(baseAttackSpeed: number, attackSpeedBonus: number): number {
  return Math.max(MIN_COMBAT_SPEED, baseAttackSpeed + attackSpeedBonus);
}

export class CombatProfileProvider {
  forHero(hero: Hero): CombatProfile {
    const baseline = getClassCombatBaseline(hero.heroClass);
    const equipment = hero.toProps().equipment;
    const attributeAspd = resolveHeroAttributeAttackSpeed(baseline.attackSpeed, hero);
    const attackSpeedBonus = sumGearBonus(equipment, (g) => g.attackSpeedBonus);
    const castSpeedBonus = sumGearBonus(equipment, (g) => g.castSpeedBonus);
    const cooldownReduction = sumGearBonus(equipment, (g) => g.cooldownReductionBonus);

    return createCombatProfile({
      attackSpeed: resolveAttackSpeed(attributeAspd, attackSpeedBonus),
      castSpeed: resolveCastSpeed(baseline.castSpeed, castSpeedBonus),
      cooldownReduction: resolveCooldownReduction(cooldownReduction),
      critChance: Math.min(0.75, baseline.critChance + sumGearBonus(equipment, (g) => g.critChanceBonus)),
      critDamage: baseline.critDamage + sumGearBonus(equipment, (g) => g.critDamageBonus),
    });
  }

  forEnemy(enemy: Enemy, _isBoss = false): CombatProfile {
    const baseline = getEnemyTierCombatBaseline(enemy.enemyType);
    const identity = getEnemyCombatIdentity(enemy.enemyType);
    const attributeAspd = resolveAttributeAttackSpeed(
      baseline.attackSpeed,
      enemy.totalAttributes,
      enemy.physicalMeleeAspd,
      identity.attackSpeedFactor,
    );

    return createCombatProfile({
      attackSpeed: resolveAttackSpeed(attributeAspd, 0),
      castSpeed: baseline.castSpeed,
      cooldownReduction: 0,
      critChance: baseline.critChance,
      critDamage: baseline.critDamage,
    });
  }
}
