import { FeatureKey } from './FeatureKey';

export type UpgradeRequirement =
  | { type: 'upgrade_level'; feature: FeatureKey; minLevel: number }
  | { type: 'min_stage'; value: number }
  | { type: 'min_battles_won'; value: number }
  | { type: 'min_chests_opened'; value: number }
  | { type: 'min_hero_level'; value: number }
  | { type: 'main_mission_completed'; missionId: string };
