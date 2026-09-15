import { RewardMoment } from '../delight/types/RewardMoment';

const NON_CELEBRATION_KINDS = new Set<RewardMoment['kind']>([
  'chest_available',
  'phase_cleared',
  'shop_purchase',
  'tier_up',
]);

const MESO_CELEBRATION_KINDS = new Set<RewardMoment['kind']>([
  'level_up',
  'feature_unlock',
  'upgrade_purchased',
  'forge_created',
  'loot_received',
  'achievement_progress',
]);

export function isCelebrationMoment(moment: RewardMoment): boolean {
  if (NON_CELEBRATION_KINDS.has(moment.kind)) {
    return false;
  }

  if (moment.tier === 'macro') {
    return true;
  }

  return MESO_CELEBRATION_KINDS.has(moment.kind);
}
