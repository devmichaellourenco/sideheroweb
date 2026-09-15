export const CHEST_EVERY_N_WINS = 3;

export function chestProgress(totalBattlesWon: number): { current: number; target: number } {
  const current = totalBattlesWon % CHEST_EVERY_N_WINS;
  return { current, target: CHEST_EVERY_N_WINS };
}
