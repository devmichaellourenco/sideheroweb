import { HeroClass } from '../entities/HeroClass';
import { FeatureKey } from './FeatureKey';
import { UpgradeRequirement } from './UpgradeRequirement';

export type UpgradeBranch = 'combat' | 'chests' | 'equipment' | 'qol' | 'economy' | 'heroes';

export interface UpgradeDefinition {
  id: string;
  feature: FeatureKey;
  level: number;
  branch: UpgradeBranch;
  name: string;
  description: string;
  cost: number;
  /** Nós pais no grafo — todos precisam estar comprados antes deste. */
  parents: string[];
  requirements: UpgradeRequirement[];
  unlockHeroClass?: HeroClass;
}
