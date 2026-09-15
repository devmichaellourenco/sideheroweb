import { Hero } from '../entities/Hero';
import { HeroClass } from '../entities/HeroClass';
import { Attributes } from '../progression/Attributes';
import { getHeroCombatIdentity } from './HeroCombatIdentityCatalog';

/** ASPD adicional por ponto de DEX. */
export const DEX_ATTACK_SPEED_SCALE = 0.008;

/** ASPD adicional por ponto de STR em classes físicas. */
export const STR_ATTACK_SPEED_SCALE = 0.003;

const PHYSICAL_MELEE_CLASSES: ReadonlySet<HeroClass> = new Set([
  'knight',
  'berserker',
  'paladin',
]);

/** ASPD a partir de baseline + fator do combatente + STR/DEX. */
export function resolveAttributeAttackSpeed(
  classBaselineAspd: number,
  attributes: Attributes,
  physicalMelee: boolean,
  attackSpeedFactor: number,
): number {
  const classAspd = classBaselineAspd * attackSpeedFactor;
  const dexBonus = attributes.dex * DEX_ATTACK_SPEED_SCALE;
  const strBonus = physicalMelee ? attributes.str * STR_ATTACK_SPEED_SCALE : 0;
  return classAspd + dexBonus + strBonus;
}

export function resolveHeroAttributeAttackSpeed(classBaselineAspd: number, hero: Hero): number {
  return resolveAttributeAttackSpeed(
    classBaselineAspd,
    hero.totalAttributes,
    PHYSICAL_MELEE_CLASSES.has(hero.heroClass),
    getHeroCombatIdentity(hero.heroClass).attackSpeedFactor,
  );
}

/** TTA em segundos a partir do ASPD do combatente (herói ou inimigo). Sem piso global. */
export function resolveActionIntervalSeconds(attackSpeed: number): number {
  return 1 / Math.max(attackSpeed, 0.01);
}
