import { mitigatePhysicalDamage } from './CombatDamageResolver';
import { CombatStatusEffectTracker } from './CombatStatusEffectTracker';

/** @deprecated Use mitigatePhysicalDamage com stageLevel. Mantido para caminhos legados. */
export function mitigateDamage(rawDamage: number, effectiveDefense: number, stageLevel = 1): number {
  return mitigatePhysicalDamage(rawDamage, effectiveDefense, stageLevel);
}

export function resolveEffectiveDefense(
  baseDefense: number,
  combatantKey: string,
  statusEffects: CombatStatusEffectTracker,
): number {
  return Math.max(0, baseDefense - statusEffects.getDefensePenalty(combatantKey));
}

export function resolveEffectiveAttack(
  baseAttack: number,
  combatantKey: string,
  statusEffects: CombatStatusEffectTracker,
): number {
  return Math.max(1, baseAttack + statusEffects.getAttackBonus(combatantKey));
}
