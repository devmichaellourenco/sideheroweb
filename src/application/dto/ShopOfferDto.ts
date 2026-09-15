import { GearDto } from './GameStateDto';

export interface ShopOfferDto {
  id: string;
  price: number;
  gear: GearDto;
  canAfford: boolean;
}

export interface ShopDto {
  id: string;
  name: string;
  stockSeed: number;
  difficultyTier: number;
}
