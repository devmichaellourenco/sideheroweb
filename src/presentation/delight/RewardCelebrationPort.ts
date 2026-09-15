import { GearDto, HeroDto } from '../../application/dto/GameStateDto';

export interface RewardCelebrationPort {
  celebrateUpgradePurchased(upgradeId: string): void;
  celebrateShopPurchase(gear: GearDto): void;
  celebrateForgeCreated(gear: GearDto): void;
  celebrateAscension(hero: Pick<HeroDto, 'id' | 'name' | 'heroClass' | 'ascensionId'>): void;
}
