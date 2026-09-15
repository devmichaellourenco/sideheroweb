export type MetaFeatureKey = 'start_gold' | 'gold_bonus' | 'hero_xp' | 'sigil_hoard';

export interface MetaUpgradeDefinition {
  id: string;
  feature: MetaFeatureKey;
  level: number;
  name: string;
  description: string;
  cost: number;
  startGoldBonus?: number;
  goldBonusPercent?: number;
  xpBonusPercent?: number;
  seasonSigilBonus?: number;
}
