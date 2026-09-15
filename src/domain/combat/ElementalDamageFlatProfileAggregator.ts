import { Gear } from '../entities/Gear';
import {
  ElementalDamageFlatProfile,
  ZERO_ELEMENTAL_DAMAGE_FLAT,
} from './ElementalDamageFlatProfile';

export function elementalDamageFlatFromGear(gear: Gear): ElementalDamageFlatProfile {
  return {
    fire: gear.fireDamageFlat,
    cold: gear.coldDamageFlat,
    lightning: gear.lightningDamageFlat,
    air: gear.airDamageFlat,
  };
}

export function aggregateElementalDamageFlat(
  gears: Iterable<Gear | null | undefined>,
): ElementalDamageFlatProfile {
  const total = { ...ZERO_ELEMENTAL_DAMAGE_FLAT };

  for (const gear of gears) {
    if (!gear) continue;
    const profile = elementalDamageFlatFromGear(gear);
    total.fire += profile.fire;
    total.cold += profile.cold;
    total.lightning += profile.lightning;
    total.air += profile.air;
  }

  return total;
}

export function elementalDamageFlatFromHeroEquipment(
  equipment: Partial<Record<string, Gear | null>>,
): ElementalDamageFlatProfile {
  return aggregateElementalDamageFlat(Object.values(equipment ?? {}));
}
