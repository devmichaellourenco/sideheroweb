import { Gear } from '../entities/Gear';
import { ResistanceProfile, ZERO_RESISTANCES } from './ResistanceProfile';

export function resistanceProfileFromGear(gear: Gear): ResistanceProfile {
  return {
    fire: gear.fireResistBonus + gear.fireResistFlat,
    cold: gear.coldResistBonus + gear.coldResistFlat,
    lightning: gear.lightningResistBonus + gear.lightningResistFlat,
    air: gear.airResistBonus + gear.airResistFlat,
    allElemental: gear.allElementalResistBonus,
  };
}

export function aggregateResistanceProfile(gears: Iterable<Gear | null | undefined>): ResistanceProfile {
  const total = { ...ZERO_RESISTANCES };

  for (const gear of gears) {
    if (!gear) continue;
    const profile = resistanceProfileFromGear(gear);
    total.fire += profile.fire;
    total.cold += profile.cold;
    total.lightning += profile.lightning;
    total.air += profile.air;
    total.allElemental += profile.allElemental;
  }

  return total;
}

export function resistanceProfileFromHeroEquipment(
  equipment: Partial<Record<string, Gear | null>>,
): ResistanceProfile {
  return aggregateResistanceProfile(Object.values(equipment ?? {}));
}
