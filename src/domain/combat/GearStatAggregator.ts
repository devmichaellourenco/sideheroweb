import { Gear } from '../entities/Gear';

export function sumGearStat(
  gears: Iterable<Gear | null | undefined>,
  selector: (gear: Gear) => number,
): number {
  return [...gears].reduce((sum, gear) => {
    if (!gear) return sum;
    return sum + selector(gear);
  }, 0);
}

export function physicalDamagePercentFromHeroEquipment(
  equipment: Partial<Record<string, Gear | null>>,
): number {
  return sumGearStat(Object.values(equipment ?? {}), (gear) => gear.physicalDamagePercentBonus);
}
