import { DamageElement } from '../../combat/DamageElement';

export type CombatFloatTarget = 'hero' | 'enemy';
export type CombatFloatKind =
  | 'damage'
  | 'heal'
  | 'crit'
  | 'crit-heal'
  | 'crit-buff'
  | 'buff'
  | 'debuff'
  | 'level-up';

export interface CombatFloatingEvent {
  target: CombatFloatTarget;
  targetId: string;
  kind: CombatFloatKind;
  amount: number;
  damageElement?: DamageElement;
}

export function createDamageEvent(
  target: CombatFloatTarget,
  targetId: string,
  beforeHealth: number,
  afterHealth: number,
  isCrit = false,
  damageElement?: DamageElement,
): CombatFloatingEvent | null {
  const amount = Math.max(0, beforeHealth - afterHealth);
  if (amount <= 0) return null;

  return {
    target,
    targetId,
    kind: isCrit ? 'crit' : 'damage',
    amount,
    damageElement,
  };
}

export function createHealEvent(
  target: CombatFloatTarget,
  targetId: string,
  beforeHealth: number,
  afterHealth: number,
  isCrit = false,
): CombatFloatingEvent | null {
  const amount = Math.max(0, afterHealth - beforeHealth);
  if (amount <= 0) return null;

  return { target, targetId, kind: isCrit ? 'crit-heal' : 'heal', amount };
}

export function createStatusImpactEvent(
  target: CombatFloatTarget,
  targetId: string,
  kind: 'buff' | 'debuff',
  amount = 0,
  isCrit = false,
): CombatFloatingEvent {
  const resolvedKind =
    kind === 'buff' && isCrit ? 'crit-buff' : kind;

  return { target, targetId, kind: resolvedKind, amount };
}

export function createLevelUpEvent(heroId: string, newLevel: number): CombatFloatingEvent {
  return {
    target: 'hero',
    targetId: heroId,
    kind: 'level-up',
    amount: newLevel,
  };
}
