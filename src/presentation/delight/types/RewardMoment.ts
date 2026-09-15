import { GearDto } from '../../../application/dto/GameStateDto';
import { RewardHeroPortrait } from '../RewardHeroPortrait';
import { RewardTier } from './RewardTier';

export type RewardTone =
  | 'chest'
  | 'level'
  | 'victory'
  | 'loot'
  | 'unlock'
  | 'idle'
  | 'gold'
  | 'forge';

export type RewardMomentKind =
  | 'chest_available'
  | 'level_up'
  | 'phase_cleared'
  | 'milestone_boss_defeated'
  | 'named_legendary_received'
  | 'tier_up'
  | 'season_complete'
  | 'feature_unlock'
  | 'upgrade_purchased'
  | 'loot_received'
  | 'shop_purchase'
  | 'forge_created'
  | 'achievement_progress'
  | 'achievement_unlocked'
  | 'idle_report';

export interface RewardMomentCta {
  label: string;
  onClick: () => void;
}

export interface RewardMoment {
  id: string;
  kind: RewardMomentKind;
  tier: RewardTier;
  priority: number;
  title: string;
  subtitle?: string;
  detailLines?: string[];
  iconUrl?: string;
  gear?: GearDto;
  heroPortrait?: RewardHeroPortrait;
  /** Vários heróis (level-up em grupo / idle); tem precedência visual sobre heroPortrait. */
  heroPortraits?: RewardHeroPortrait[];
  heroEmoji?: string;
  tone: RewardTone;
  cta?: RewardMomentCta;
  autoDismissMs?: number;
}
