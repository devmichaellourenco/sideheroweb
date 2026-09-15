import { DamageElement } from './DamageElement';

export interface ElementalDamageFlatProfile {
  fire: number;
  cold: number;
  lightning: number;
  air: number;
}

export const ZERO_ELEMENTAL_DAMAGE_FLAT: ElementalDamageFlatProfile = {
  fire: 0,
  cold: 0,
  lightning: 0,
  air: 0,
};

export function getEffectiveElementalDamageFlat(
  profile: ElementalDamageFlatProfile,
  element: DamageElement,
): number {
  if (element === 'physical') {
    return 0;
  }

  return profile[element];
}
