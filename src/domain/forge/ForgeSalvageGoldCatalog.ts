import { GearRarity } from '../entities/Gear';

const BASE_SALVAGE_GOLD: Record<GearRarity, number> = {
  common: 10,
  uncommon: 25,
  rare: 60,
  epic: 150,
  legendary: 400,
  mythic: 1000,
};

export function calculateForgeSalvageGold(rarity: GearRarity, stage: number): number {
  const stageBonus = 1 + Math.floor(stage / 10) * 0.15;
  return Math.floor(BASE_SALVAGE_GOLD[rarity] * stageBonus);
}
