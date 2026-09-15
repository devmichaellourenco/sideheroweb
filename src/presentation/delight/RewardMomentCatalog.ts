import { RewardMomentKind } from './types/RewardMoment';
import { RewardTier } from './types/RewardTier';

export const REWARD_KIND_PRIORITY: Record<RewardMomentKind, number> = {
  season_complete: 100,
  milestone_boss_defeated: 99,
  named_legendary_received: 96,
  achievement_unlocked: 90,
  feature_unlock: 85,
  upgrade_purchased: 80,
  achievement_progress: 72,
  tier_up: 70,
  idle_report: 65,
  phase_cleared: 55,
  forge_created: 50,
  shop_purchase: 45,
  loot_received: 40,
  level_up: 35,
  chest_available: 30,
};

export const REWARD_KIND_TIER: Record<RewardMomentKind, RewardTier> = {
  season_complete: 'macro',
  named_legendary_received: 'macro',
  milestone_boss_defeated: 'macro',
  achievement_unlocked: 'macro',
  idle_report: 'macro',
  feature_unlock: 'meso',
  upgrade_purchased: 'meso',
  achievement_progress: 'meso',
  tier_up: 'meso',
  phase_cleared: 'meso',
  forge_created: 'meso',
  shop_purchase: 'meso',
  loot_received: 'meso',
  level_up: 'meso',
  chest_available: 'meso',
};

export const REWARD_AUTO_DISMISS_MS: Partial<Record<RewardMomentKind, number>> = {
  chest_available: 5500,
  level_up: 3200,
  phase_cleared: 3500,
  milestone_boss_defeated: 7200,
  named_legendary_received: 7800,
  achievement_unlocked: 6500,
  achievement_progress: 3800,
  tier_up: 4000,
  loot_received: 2800,
  shop_purchase: 2800,
  forge_created: 3200,
  upgrade_purchased: 3500,
  feature_unlock: 4000,
  season_complete: 8000,
  idle_report: 7000,
};

export const LOOT_CELEBRATION_RARITIES = new Set(['rare', 'epic', 'legendary', 'mythic']);

export const LOOT_RARITY_PRIORITY_BOOST: Record<string, number> = {
  rare: 8,
  epic: 22,
  legendary: 38,
  mythic: 52,
};

export const LOOT_RARITY_DISPLAY_MS: Record<string, number> = {
  rare: 3200,
  epic: 4800,
  legendary: 5800,
  mythic: 6800,
};

const LOOT_RARITY_LABELS: Record<string, string> = {
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Lendário',
  mythic: 'Mítico',
};

export function lootRarityLabel(rarity: string): string {
  return LOOT_RARITY_LABELS[rarity] ?? rarity;
}
