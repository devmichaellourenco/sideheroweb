export type GearUpgradeStatusDto = 'upgrade' | 'downgrade' | 'equal';

export interface GearUpgradeEquippedHintDto {
  id: string;
  name: string;
  slot: string;
  rarity: string;
  attackBonus: number;
  defenseBonus: number;
  healthBonus: number;
}

export interface GearUpgradeHintDto {
  status: GearUpgradeStatusDto;
  gain: number;
  heroId: string;
  heroName: string;
  equipped: GearUpgradeEquippedHintDto | null;
}
