import { Attributes } from '../progression/Attributes';

export interface CombatantDerivedStatInput {
  baseAttack?: number;
  baseDefense?: number;
  baseMaxHealth?: number;
  level: number;
  attributes: Attributes;
  attackPerLevel: number;
  defensePerLevel: number;
  healthPerLevel: number;
  /** Flat de gear (herói); inimigos usam 0. */
  gearAttack?: number;
  gearDefense?: number;
  gearHealth?: number;
  /** % de gear + passivas. */
  attackPercent?: number;
  defensePercent?: number;
  healthPercent?: number;
}

/**
 * ATK derivado — mesma regra para herói (com gear) e inimigo (sem gear).
 * `attackPerLevel` vem da identidade do combatente.
 */
export function deriveCombatAttack(input: CombatantDerivedStatInput): number {
  const gearBonus = input.gearAttack ?? 0;
  const levelBonus = (Math.max(1, input.level) - 1) * input.attackPerLevel;
  const attrBonus = Math.floor(input.attributes.str * 0.5 + input.attributes.dex * 0.3);
  const raw = (input.baseAttack ?? 0) + gearBonus + levelBonus + attrBonus;
  const percent = input.attackPercent ?? 0;
  return Math.max(0, Math.floor(raw * (1 + percent / 100)));
}

export function deriveCombatDefense(input: CombatantDerivedStatInput): number {
  const gearBonus = input.gearDefense ?? 0;
  const levelBonus = (Math.max(1, input.level) - 1) * input.defensePerLevel;
  const attrBonus = Math.floor(input.attributes.dex * 0.5 + input.attributes.str * 0.2);
  const raw = (input.baseDefense ?? 0) + gearBonus + levelBonus + attrBonus;
  const percent = input.defensePercent ?? 0;
  return Math.max(0, Math.floor(raw * (1 + percent / 100)));
}

export function deriveCombatMaxHealth(input: CombatantDerivedStatInput): number {
  const gearBonus = input.gearHealth ?? 0;
  const levelBonus = (Math.max(1, input.level) - 1) * input.healthPerLevel;
  const attrBonus = input.attributes.str * 2;
  const raw = (input.baseMaxHealth ?? 0) + gearBonus + levelBonus + attrBonus;
  const percent = input.healthPercent ?? 0;
  return Math.max(1, Math.floor(raw * (1 + percent / 100)));
}
