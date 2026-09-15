import { DamageElement } from './DamageElement';

export interface ElementalDamageProfile {
  fire: number;
  cold: number;
  lightning: number;
  air: number;
  allElemental: number;
}

export const ZERO_ELEMENTAL_DAMAGE: ElementalDamageProfile = {
  fire: 0,
  cold: 0,
  lightning: 0,
  air: 0,
  allElemental: 0,
};

export function getEffectiveElementalDamageBonus(
  profile: ElementalDamageProfile,
  element: DamageElement,
): number {
  if (element === 'physical') {
    return 0;
  }

  return profile[element] + profile.allElemental;
}
