import { UpgradeLevels, getFeatureLevel } from '../upgrades/FeatureKey';

export class DivineForgePolicy {
  static isUnlocked(levels: UpgradeLevels): boolean {
    return getFeatureLevel(levels, 'divine_forge') >= 1;
  }
}
