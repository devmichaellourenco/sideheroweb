export type MetaNodeStatusDto = 'locked' | 'ready' | 'available' | 'owned';

export interface MetaNodeDto {
  id: string;
  feature: string;
  level: number;
  name: string;
  description: string;
  cost: number;
  status: MetaNodeStatusDto;
  canAfford: boolean;
}

export interface MetaSummaryDto {
  sigils: number;
  seasonsCompleted: number;
  totalSigilsEarned: number;
  goldBonusPercent: number;
  xpBonusPercent: number;
  startGoldBonus: number;
  purchasableMetaCount: number;
}
