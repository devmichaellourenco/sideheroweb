export type RewardTier = 'micro' | 'meso' | 'macro';

export const REWARD_TIER_PRIORITY: Record<RewardTier, number> = {
  macro: 100,
  meso: 40,
  micro: 10,
};
