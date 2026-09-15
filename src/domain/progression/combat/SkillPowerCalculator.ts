import { Hero } from '../../entities/Hero';
import { Enemy } from '../../entities/Enemy';
import { getHeroCombatIdentity } from '../../combat/HeroCombatIdentityCatalog';
import { getEnemyCombatIdentity } from '../../enemies/EnemyCombatIdentityCatalog';
import { getSkillById } from '../SkillCatalog';
import { CombatSkillDefinition } from './CombatSkillDefinition';
import {
  applyHeroDamageSkillPower,
  calculateHeroSkillRawPower,
} from './SkillDamageBalance';
import { resolveEffectiveAttack } from '../../services/combat/CombatStatResolver';
import { CombatStatusEffectTracker } from '../../services/combat/CombatStatusEffectTracker';
import {
  applyPercentBonus,
  heroPassiveAllySupportPercent,
  heroPassiveTreeDamagePercent,
  resolveEnemyPassives,
  sumPassiveAllySupportPercent,
  sumPassiveTreeDamagePercent,
} from '../../passives/PassiveModifiers';

export class SkillPowerCalculator {
  calculateForHero(
    skill: CombatSkillDefinition,
    hero: Hero,
    statusEffects: CombatStatusEffectTracker = CombatStatusEffectTracker.fromMap({}),
    combatantKey?: string,
  ): number {
    const key = combatantKey ?? `hero:${hero.id}`;
    const effectiveAttack = resolveEffectiveAttack(hero.attack, key, statusEffects);
    const basicRatio = getHeroCombatIdentity(hero.heroClass).basicAttackDamageRatio;

    if (skill.usesAttackStat) {
      return Math.max(1, Math.floor(effectiveAttack * basicRatio));
    }

    const rank = hero.toProps().skillRanks[skill.skillId] ?? 1;
    const definition = getSkillById(skill.skillId);
    const scalingKey = definition?.scaling ?? 'int';
    const attributeValue = hero.totalAttributes[scalingKey];

    const raw = calculateHeroSkillRawPower(skill, rank, attributeValue);
    let power = applyHeroDamageSkillPower(skill, raw, effectiveAttack, basicRatio);
    power = applyPercentBonus(power, heroPassiveTreeDamagePercent(hero, skill));
    power = applyPercentBonus(power, heroPassiveAllySupportPercent(hero, skill));
    return power;
  }

  calculateForEnemy(
    skill: CombatSkillDefinition,
    enemy: Enemy,
    statusEffects: CombatStatusEffectTracker = CombatStatusEffectTracker.fromMap({}),
    combatantKey?: string,
  ): number {
    const key = combatantKey ?? `enemy:${enemy.id}`;
    const effectiveAttack = resolveEffectiveAttack(enemy.attack, key, statusEffects);
    const basicRatio = getEnemyCombatIdentity(enemy.enemyType).basicAttackDamageRatio;

    if (skill.usesAttackStat) {
      return Math.max(1, Math.floor(effectiveAttack * basicRatio));
    }

    const rank = enemy.skillRanks[skill.skillId] ?? 1;
    const definition = getSkillById(skill.skillId);
    const scalingKey = definition?.scaling ?? 'int';
    const attributeValue = enemy.totalAttributes[scalingKey];

    const raw = calculateHeroSkillRawPower(skill, rank, attributeValue);
    let power = applyHeroDamageSkillPower(skill, raw, effectiveAttack, basicRatio);
    const actives = resolveEnemyPassives(enemy);
    power = applyPercentBonus(
      power,
      sumPassiveTreeDamagePercent(actives, skill, enemy.level, enemy.totalAttributes),
    );
    power = applyPercentBonus(
      power,
      sumPassiveAllySupportPercent(actives, skill, enemy.totalAttributes.int),
    );
    return power;
  }
}
