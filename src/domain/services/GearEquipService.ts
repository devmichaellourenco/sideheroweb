import { Gear } from '../entities/Gear';
import { Hero } from '../entities/Hero';
import { GearRequirementChecker } from './GearRequirementChecker';

export function canHeroEquip(
  hero: Hero,
  gear: Gear,
  checker: GearRequirementChecker = new GearRequirementChecker(),
): boolean {
  return checker.meets(hero, gear);
}

export function equipHeroWithGear(
  hero: Hero,
  gear: Gear,
  checker: GearRequirementChecker = new GearRequirementChecker(),
): { hero: Hero; replaced: Gear | null } {
  if (!canHeroEquip(hero, gear, checker)) {
    throw new Error('Requisitos de equipamento não atendidos');
  }

  const oldGear = hero.toProps().equipment?.[gear.slot] ?? null;

  return {
    hero: hero.equip(gear),
    replaced: oldGear,
  };
}

export function addReplacedGearToInventory(
  inventory: Gear[],
  removedGearId: string,
  replaced: Gear | null,
): Gear[] {
  const nextInventory = inventory.filter((entry) => entry.id !== removedGearId);
  return replaced ? [...nextInventory, replaced] : nextInventory;
}
