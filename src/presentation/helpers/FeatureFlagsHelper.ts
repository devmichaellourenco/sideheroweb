import { FeatureFlagsDto } from '../../application/dto/FeatureFlagsDto';
import { GameStateDto } from '../../application/dto/GameStateDto';

const DEFAULT_FLAGS: FeatureFlagsDto = {
  autoBattle: true,
  autoBattleMaxSpeed: 1,
  autoOpenChests: false,
  openAllChests: false,
  autoOpenAllChests: false,
  optimizeLoadout: false,
  optimizeInLootBatch: false,
  autoEquipLoot: false,
  autoEquipSilent: false,
  logFilter: false,
  battleStats: true,
  shopRefresh: false,
  backgroundTick: false,
  backgroundTickMultiplier: 1,
  itemStash: false,
  stashCapacity: 0,
  inventoryCapacity: 30,
  divineForge: false,
  improvementReset: 0,
};

export function getFeatureFlags(state: GameStateDto | null): FeatureFlagsDto {
  return state?.featureFlags ?? DEFAULT_FLAGS;
}
