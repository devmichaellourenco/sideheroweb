import { Gear } from '../entities/Gear';
import { Hero } from '../entities/Hero';
import { getGearTemplate } from '../gear/GearTemplateCatalog';
import { ResolvedDamage } from '../services/combat/CombatDamageResolver';
import { StatusApplication } from '../services/combat/CombatStatusEffect';
import { HEAL_BLOCK_BATTLE_TURNS, UniqueEffectId } from './UniqueEffectCatalog';

export interface UniqueOnHitEnemyContext {
  attackerEquipment?: Partial<Record<string, Gear | null>>;
  targetEnemyKey: string;
  resolved: ResolvedDamage;
}

function uniqueEffectsFromWeapon(equipment?: Partial<Record<string, Gear | null>>): UniqueEffectId[] {
  const weapon = equipment?.weapon;
  if (!weapon) return [];

  const template = getGearTemplate(weapon.templateId);
  if (!template?.uniqueEffectId) return [];

  return [template.uniqueEffectId];
}

export function resolveUniqueOnHitEnemyEffects(context: UniqueOnHitEnemyContext): StatusApplication[] {
  if (context.resolved.dodged || context.resolved.amount <= 0) {
    return [];
  }

  const effectIds = uniqueEffectsFromWeapon(context.attackerEquipment);
  const applications: StatusApplication[] = [];

  for (const effectId of effectIds) {
    if (effectId === 'vorpal_lupnus_heal_block') {
      applications.push({
        combatantKey: context.targetEnemyKey,
        skillId: 'vorpal_lupnus_heal_block',
        kind: 'heal_block',
        magnitude: 0,
        durationTurns: HEAL_BLOCK_BATTLE_TURNS,
        skillName: 'Vorpal Lupnus',
      });
    }
  }

  return applications;
}

export function resolveUniqueOnHitFromHero(
  hero: Hero,
  targetEnemyKey: string,
  resolved: ResolvedDamage,
): StatusApplication[] {
  return resolveUniqueOnHitEnemyEffects({
    attackerEquipment: hero.toProps().equipment,
    targetEnemyKey,
    resolved,
  });
}
