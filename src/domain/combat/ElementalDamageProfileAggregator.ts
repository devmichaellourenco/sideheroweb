import { Gear } from '../entities/Gear';
import { ElementalDamageProfile, ZERO_ELEMENTAL_DAMAGE } from './ElementalDamageProfile';

export function elementalDamageProfileFromGear(gear: Gear): ElementalDamageProfile {
  return {
    fire: gear.fireDamageBonus,
    cold: gear.coldDamageBonus,
    lightning: gear.lightningDamageBonus,
    air: gear.airDamageBonus,
    allElemental: gear.allElementalDamageBonus,
  };
}

export function aggregateElementalDamageProfile(
  gears: Iterable<Gear | null | undefined>,
): ElementalDamageProfile {
  const total = { ...ZERO_ELEMENTAL_DAMAGE };

  for (const gear of gears) {
    if (!gear) continue;
    const profile = elementalDamageProfileFromGear(gear);
    total.fire += profile.fire;
    total.cold += profile.cold;
    total.lightning += profile.lightning;
    total.air += profile.air;
    total.allElemental += profile.allElemental;
  }

  return total;
}

export function elementalDamageProfileFromHeroEquipment(
  equipment: Partial<Record<string, Gear | null>>,
): ElementalDamageProfile {
  return aggregateElementalDamageProfile(Object.values(equipment ?? {}));
}
