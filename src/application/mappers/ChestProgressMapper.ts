import { chestProgress } from '../../domain/constants/CombatRules';

export interface ChestProgressDto {
  current: number;
  target: number;
}

export function mapChestProgress(totalBattlesWon: number): ChestProgressDto {
  return chestProgress(totalBattlesWon);
}
