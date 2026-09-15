import { ChestType } from '../combat/ChestType';
import { Gear, GearRarity, GearSlot } from '../entities/Gear';
import { ACTIVE_GEAR_SLOTS } from '../gear/GearSlotCatalog';
import { GALNEON_STANDARD_SWORD_TEMPLATE_ID } from '../gear/GalneonGearCatalog';
import {
  createGearFromCatalogItem,
  findCatalogItemBySpriteId,
  getGearCatalogItem,
  listLootCatalogItems,
} from '../gear/GearItemCatalog';
import { isMythicGearUnlockedForTier } from '../gear/MythicGearAccessPolicy';
import { ILootService } from './ILootService';

const CHEST_RARITY_WEIGHTS: Record<ChestType, Record<GearRarity, number>> = {
  monster: {
    common: 0.55,
    uncommon: 0.25,
    rare: 0.14,
    epic: 0.05,
    legendary: 0.01,
    mythic: 0,
  },
  boss: {
    common: 0.2,
    uncommon: 0.28,
    rare: 0.3,
    epic: 0.15,
    legendary: 0.06,
    mythic: 0.01,
  },
  act_boss: {
    common: 0.05,
    uncommon: 0.1,
    rare: 0.25,
    epic: 0.35,
    legendary: 0.18,
    mythic: 0.07,
  },
};

const RARITY_ORDER: GearRarity[] = [
  'mythic',
  'legendary',
  'epic',
  'rare',
  'uncommon',
  'common',
];

export class LootService implements ILootService {
  generateGear(stage: number): Gear {
    return this.generateGearForChest('monster', stage);
  }

  generateGearForChest(chestType: ChestType, stage: number): Gear {
    const slot = ACTIVE_GEAR_SLOTS[Math.floor(Math.random() * ACTIVE_GEAR_SLOTS.length)];
    const rarity = this.rollRarityForChest(chestType, stage);
    return this.generateGearForSlot(stage, slot, rarity, chestType);
  }

  generateGearForSlot(
    stage: number,
    slot: GearSlot,
    rarity: GearRarity,
    _chestType: ChestType = 'monster',
  ): Gear {
    const candidates = listLootCatalogItems(slot, rarity, stage);
    const catalogItem = candidates[Math.floor(Math.random() * candidates.length)];
    return createGearFromCatalogItem(catalogItem.id);
  }

  generateDeterministicGearForSlot(
    stage: number,
    slot: GearSlot,
    rarity: GearRarity,
    refreshSeed = 0,
  ): Gear {
    const candidates = listLootCatalogItems(slot, rarity, stage);
    const slotSeed = slot === 'weapon' ? 1 : slot === 'armor' ? 2 : 3;
    const index = (stage * 3 + slotSeed + refreshSeed * 7) % candidates.length;
    const catalogItem = candidates[index];

    return createGearFromCatalogItem(
      catalogItem.id,
      `shop-gear-${stage}-${refreshSeed}-${slot}`,
    );
  }

  generateGearFromCatalogItem(catalogItemId: string, instanceId?: string): Gear {
    return createGearFromCatalogItem(catalogItemId, instanceId);
  }

  generateGearFromTemplate(
    templateId: string,
    stage: number,
    rarity: GearRarity,
    id?: string,
    _statBump = 0,
  ): Gear {
    if (getGearCatalogItem(templateId)) {
      return createGearFromCatalogItem(templateId, id);
    }

    const catalogItem = findCatalogItemBySpriteId(templateId, rarity, stage);
    if (!catalogItem) {
      throw new Error(`Template de equipamento inválido: ${templateId}`);
    }

    return createGearFromCatalogItem(catalogItem.id, id);
  }

  private rollRarityForChest(chestType: ChestType, stage: number): GearRarity {
    const weights = { ...CHEST_RARITY_WEIGHTS[chestType] };
    const stageBonus = Math.min(0.08, stage * 0.0008);
    weights.epic += stageBonus * 0.5;
    weights.legendary += stageBonus * 0.3;
    weights.mythic += stageBonus * 0.2;
    weights.common = Math.max(0.02, weights.common - stageBonus);

    if (!isMythicGearUnlockedForTier(stage)) {
      weights.legendary += weights.mythic;
      weights.mythic = 0;
    }

    const roll = Math.random();
    let cumulative = 0;

    for (const rarity of RARITY_ORDER) {
      if (weights[rarity] <= 0) continue;
      cumulative += weights[rarity];
      if (roll <= cumulative) {
        return rarity;
      }
    }

    return 'common';
  }
}

export function resolveGalneonCatalogItemForRarity(rarity: GearRarity): string {
  const item = findCatalogItemBySpriteId(GALNEON_STANDARD_SWORD_TEMPLATE_ID, rarity);
  if (!item) {
    throw new Error(`Item Galneon não encontrado para raridade ${rarity}`);
  }
  return item.id;
}
