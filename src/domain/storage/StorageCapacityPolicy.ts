import { UpgradeLevels, getFeatureLevel } from '../upgrades/FeatureKey';

export const INVENTORY_CAPACITY = 30;

const STASH_CAPACITY_BY_LEVEL: Record<number, number> = {
  1: 24,
  2: 36,
  3: 48,
};

export class StorageCapacityPolicy {
  static inventoryLimit(): number {
    return INVENTORY_CAPACITY;
  }

  static stashLimit(levels: UpgradeLevels): number {
    const level = getFeatureLevel(levels, 'item_stash');
    return STASH_CAPACITY_BY_LEVEL[level] ?? 0;
  }

  static isStashUnlocked(levels: UpgradeLevels): boolean {
    return getFeatureLevel(levels, 'item_stash') >= 1;
  }

  static canAddToInventory(currentCount: number): boolean {
    return currentCount < INVENTORY_CAPACITY;
  }

  static canAddToStash(levels: UpgradeLevels, currentCount: number): boolean {
    const limit = this.stashLimit(levels);
    return limit > 0 && currentCount < limit;
  }
}
