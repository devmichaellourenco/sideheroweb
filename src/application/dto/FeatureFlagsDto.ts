export interface FeatureFlagsDto {
  autoBattle: boolean;
  autoBattleMaxSpeed: 1 | 2 | 3;
  autoOpenChests: boolean;
  openAllChests: boolean;
  autoOpenAllChests: boolean;
  optimizeLoadout: boolean;
  optimizeInLootBatch: boolean;
  autoEquipLoot: boolean;
  autoEquipSilent: boolean;
  logFilter: boolean;
  battleStats: boolean;
  shopRefresh: boolean;
  backgroundTick: boolean;
  backgroundTickMultiplier: number;
  itemStash: boolean;
  stashCapacity: number;
  inventoryCapacity: number;
  divineForge: boolean;
  /** 0 = off, 1 = unitário (−), 2 = + reset em massa. */
  improvementReset: number;
}
