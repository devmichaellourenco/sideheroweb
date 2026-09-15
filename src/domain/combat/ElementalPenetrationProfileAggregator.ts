import { Gear } from '../entities/Gear';
import {
  ElementalPenetrationProfile,
  ZERO_ELEMENTAL_PENETRATION,
} from './ElementalPenetrationProfile';

export function elementalPenetrationProfileFromGear(gear: Gear): ElementalPenetrationProfile {
  return {
    fire: gear.fireResistPenetrationBonus,
    cold: 0,
    lightning: 0,
    air: 0,
    allElemental: 0,
  };
}

export function aggregateElementalPenetrationProfile(
  gears: Iterable<Gear | null | undefined>,
): ElementalPenetrationProfile {
  const total = { ...ZERO_ELEMENTAL_PENETRATION };

  for (const gear of gears) {
    if (!gear) continue;
    const profile = elementalPenetrationProfileFromGear(gear);
    total.fire += profile.fire;
    total.cold += profile.cold;
    total.lightning += profile.lightning;
    total.air += profile.air;
    total.allElemental += profile.allElemental;
  }

  return total;
}

export function elementalPenetrationFromHeroEquipment(
  equipment: Partial<Record<string, Gear | null>>,
): ElementalPenetrationProfile {
  return aggregateElementalPenetrationProfile(Object.values(equipment ?? {}));
}
