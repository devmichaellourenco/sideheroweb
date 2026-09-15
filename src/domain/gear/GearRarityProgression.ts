import { GEAR_RARITIES, GearRarity } from '../entities/Gear';

export const FORGE_FUSE_REQUIRED_COUNT = 9;

export function getNextGearRarity(rarity: GearRarity): GearRarity | null {
  const index = GEAR_RARITIES.indexOf(rarity);
  if (index < 0 || index >= GEAR_RARITIES.length - 1) {
    return null;
  }
  return GEAR_RARITIES[index + 1];
}

export function canForgeFuseRarity(rarity: GearRarity): boolean {
  return getNextGearRarity(rarity) !== null;
}
