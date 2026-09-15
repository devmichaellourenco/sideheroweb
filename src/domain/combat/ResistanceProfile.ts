import { DamageElement } from './DamageElement';

export interface ResistanceProfile {
  fire: number;
  cold: number;
  lightning: number;
  air: number;
  allElemental: number;
}

export type PartialResistanceProfile = Partial<ResistanceProfile>;

export const ZERO_RESISTANCES: ResistanceProfile = {
  fire: 0,
  cold: 0,
  lightning: 0,
  air: 0,
  allElemental: 0,
};

export function getEffectiveResistance(
  profile: ResistanceProfile,
  element: DamageElement,
): number {
  if (element === 'physical') {
    return 0;
  }

  return profile[element] + profile.allElemental;
}
