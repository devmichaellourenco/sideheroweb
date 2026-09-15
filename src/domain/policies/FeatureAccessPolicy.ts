import { UpgradeLevels, getFeatureLevel } from '../upgrades/FeatureKey';
import { StorageCapacityPolicy } from '../storage/StorageCapacityPolicy';

export interface FeatureAccessSnapshot {
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
  /** Nível da feature: 0 = off, 1 = reset unitário, 2 = + massa. */
  improvementReset: number;
}

export class FeatureAccessPolicy {
  static resolve(levels: UpgradeLevels): FeatureAccessSnapshot {
    const autoBattleLevel = getFeatureLevel(levels, 'auto_battle');
    const openAllLevel = getFeatureLevel(levels, 'open_all_chests');
    const autoEquipLevel = getFeatureLevel(levels, 'auto_equip_loot');
    // OFFLINE PROGRESS DESATIVADO (2026-07): flags sempre off.
    // const backgroundTickLevel = getFeatureLevel(levels, 'background_tick');
    // OTIMIZAR EQUIPE DESATIVADO (2026-08):
    // const optimizeLevel = getFeatureLevel(levels, 'optimize_loadout');
    // AUTO-ABRIR BAÚS DESATIVADO (2026-08):
    // const autoOpenChestsLevel = getFeatureLevel(levels, 'auto_open_chests');

    return {
      autoBattle: true,
      autoBattleMaxSpeed: autoBattleLevel >= 3 ? 3 : autoBattleLevel >= 2 ? 2 : 1,
      // AUTO-ABRIR BAÚS DESATIVADO (2026-08): flags sempre off (saves legados ignorados).
      autoOpenChests: false,
      openAllChests: openAllLevel >= 1,
      autoOpenAllChests: false,
      // --- original (reativar auto-abrir baús) ---
      // autoOpenChests: autoOpenChestsLevel >= 1,
      // autoOpenAllChests: openAllLevel >= 2,
      // OTIMIZAR EQUIPE DESATIVADO (2026-08): flags sempre off (saves legados ignorados).
      optimizeLoadout: false,
      optimizeInLootBatch: false,
      // --- original (reativar otimizar equipe) ---
      // optimizeLoadout: optimizeLevel >= 1,
      // optimizeInLootBatch: optimizeLevel >= 2,
      autoEquipLoot: autoEquipLevel >= 1,
      autoEquipSilent: autoEquipLevel >= 2,
      logFilter: getFeatureLevel(levels, 'log_filter') >= 1,
      battleStats: true,
      shopRefresh: getFeatureLevel(levels, 'shop_refresh') >= 1,
      backgroundTick: false,
      backgroundTickMultiplier: 1,
      // --- original (reativar offline progress) ---
      // backgroundTick: backgroundTickLevel >= 1,
      // backgroundTickMultiplier: backgroundTickLevel >= 2 ? 2 : 1,
      itemStash: StorageCapacityPolicy.isStashUnlocked(levels),
      stashCapacity: StorageCapacityPolicy.stashLimit(levels),
      inventoryCapacity: StorageCapacityPolicy.inventoryLimit(),
      divineForge: getFeatureLevel(levels, 'divine_forge') >= 1,
      improvementReset: getFeatureLevel(levels, 'improvement_reset'),
    };
  }

  static canUse(levels: UpgradeLevels, feature: keyof FeatureAccessSnapshot): boolean {
    const flags = this.resolve(levels);
    const value = flags[feature];
    return typeof value === 'boolean' ? value : value > 0;
  }
}
