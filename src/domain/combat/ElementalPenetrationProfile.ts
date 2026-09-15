import { DamageElement } from './DamageElement';

export interface ElementalPenetrationProfile {
  fire: number;
  cold: number;
  lightning: number;
  air: number;
  allElemental: number;
}

export const ZERO_ELEMENTAL_PENETRATION: ElementalPenetrationProfile = {
  fire: 0,
  cold: 0,
  lightning: 0,
  air: 0,
  allElemental: 0,
};

export function getEffectiveElementalPenetration(
  profile: ElementalPenetrationProfile,
  element: DamageElement,
): number {
  if (element === 'physical') {
    return 0;
  }

  return profile[element] + profile.allElemental;
}

/** Reduz a resistência efetiva do alvo (ex.: 30% penetração → resistência × 0,7). */
export function applyResistancePenetration(resistance: number, penetrationPercent: number): number {
  if (penetrationPercent <= 0) {
    return resistance;
  }

  const capped = Math.min(100, penetrationPercent);
  return resistance * (1 - capped / 100);
}
