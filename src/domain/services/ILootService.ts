import { ChestType } from '../combat/ChestType';
import { Gear, GearRarity, GearSlot } from '../entities/Gear';

export interface ILootService {
  generateGear(stage: number): Gear;
  generateGearForChest(chestType: ChestType, stage: number): Gear;
  generateGearForSlot(stage: number, slot: GearSlot, rarity: GearRarity, chestType?: ChestType): Gear;
  generateDeterministicGearForSlot(
    stage: number,
    slot: GearSlot,
    rarity: GearRarity,
    refreshSeed?: number,
  ): Gear;
  generateGearFromCatalogItem(catalogItemId: string, instanceId?: string): Gear;
  generateGearFromTemplate(
    templateId: string,
    stage: number,
    rarity: GearRarity,
    id?: string,
    statBump?: number,
  ): Gear;
}
