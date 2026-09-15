import { parsePhaseId } from '../campaign/CampaignIds';
import {
  mainMissionId,
  MissionId,
  phaseIdFromMainMissionId,
} from '../campaign/missions/MissionId';
import { GEAR_RARITIES, GearRarity, GearSlot } from '../entities/Gear';
import { isGalneonCatalogItem } from '../gear/GearItemDefinition';
import { listLootCatalogItems } from '../gear/GearItemCatalog';
import { isMythicGearUnlockedForTier } from '../gear/MythicGearAccessPolicy';
import { ACTIVE_GEAR_SLOTS } from '../gear/GearSlotCatalog';

export const SHOP_OFFER_COUNT = 8;

/** Slots por posição — garante variedade (3 armas, 3 armaduras, 2 acessórios). */
export const SHOP_SLOT_BY_INDEX: GearSlot[] = [
  'weapon',
  'armor',
  'accessory',
  'weapon',
  'armor',
  'accessory',
  'weapon',
  'armor',
];

const RARITY_WEIGHT_BASE: Record<GearRarity, number> = {
  common: 42,
  uncommon: 28,
  rare: 16,
  epic: 9,
  legendary: 4,
  mythic: 1,
};

export function shopDeterministicRoll(tier: number, refreshSeed: number, offerIndex: number): number {
  return Math.abs((tier * 997 + refreshSeed * 991 + offerIndex * 983 + 17) | 0);
}

function hasCompletedMain(completed: ReadonlySet<MissionId>, phaseId: string): boolean {
  return completed.has(mainMissionId(phaseId));
}

function highestCompletedMainMapIndex(completedMainIds: readonly MissionId[]): number {
  let highest = 0;
  for (const id of completedMainIds) {
    const phaseId = phaseIdFromMainMissionId(id);
    if (!phaseId) continue;
    highest = Math.max(highest, parsePhaseId(phaseId).mapIndex);
  }
  return highest;
}

/**
 * BAL-015 / BAL-017 — teto de raridade da loja por marcos de main (não por difficulty tier).
 * Stendra: uncommon (main:1-1) → rare (main:1-10) → epic (main:1-20); legendary só a partir do Ato 2.
 * Mythic mantém o gate de Valdris Ato 3 (`main:3-21` ou tier ≥ 121).
 */
export function getShopMaxRarityIndex(
  completedMainIds: readonly MissionId[] = [],
  difficultyTier = 1,
): number {
  const completed = new Set(completedMainIds);
  const mapReach = highestCompletedMainMapIndex(completedMainIds);

  if (
    hasCompletedMain(completed, '3-21') ||
    isMythicGearUnlockedForTier(difficultyTier)
  ) {
    return 5;
  }

  if (
    hasCompletedMain(completed, '3-1') ||
    hasCompletedMain(completed, '2-50') ||
    mapReach >= 3
  ) {
    return 4;
  }

  if (
    hasCompletedMain(completed, '1-20') ||
    hasCompletedMain(completed, '1-50') ||
    hasCompletedMain(completed, '2-1') ||
    mapReach >= 2
  ) {
    return 3;
  }

  if (hasCompletedMain(completed, '1-10')) {
    return 2;
  }

  return 1;
}

export function rollShopRarity(
  tier: number,
  refreshSeed: number,
  offerIndex: number,
  completedMainIds: readonly MissionId[] = [],
): GearRarity {
  const maxIndex = getShopMaxRarityIndex(completedMainIds, tier);
  const allowed = GEAR_RARITIES.slice(0, maxIndex + 1);

  const weights = allowed.map((rarity, index) => {
    let weight = RARITY_WEIGHT_BASE[rarity];
    weight += Math.floor(tier / 15) * index;
    return weight;
  });

  const total = weights.reduce((sum, value) => sum + value, 0);
  let roll = shopDeterministicRoll(tier, refreshSeed, offerIndex) % total;

  for (let i = 0; i < allowed.length; i += 1) {
    roll -= weights[i];
    if (roll < 0) {
      return allowed[i];
    }
  }

  return allowed[allowed.length - 1];
}

export function buildShopOfferId(tier: number, refreshSeed: number, offerIndex: number): string {
  return `shop-${tier}-${refreshSeed}-o${offerIndex}`;
}

export function parseShopOfferIndex(offerId: string): number | null {
  const match = offerId.match(/^shop-\d+-\d+-o(\d+)$/);
  if (!match) return null;
  return Number(match[1]);
}

/** Garante que nenhum par slot+catalogItemId se repita no mesmo estoque. */
export function pickUniqueShopCatalogItemId(
  slot: GearSlot,
  tier: number,
  refreshSeed: number,
  offerIndex: number,
  rarity: GearRarity,
  usedCatalogKeys: Set<string>,
): string {
  const candidates = listLootCatalogItems(slot, rarity, tier);
  const galneonCandidates = candidates.filter((entry) => isGalneonCatalogItem(entry));
  const galneonKey = galneonCandidates[0] ? `${slot}:${galneonCandidates[0].id}` : null;

  if (
    slot === 'weapon' &&
    tier >= 3 &&
    offerIndex % 4 === 0 &&
    galneonKey &&
    !usedCatalogKeys.has(galneonKey)
  ) {
    return galneonCandidates[0].id;
  }

  const start = shopDeterministicRoll(tier, refreshSeed, offerIndex) % Math.max(1, candidates.length);

  for (let offset = 0; offset < candidates.length; offset += 1) {
    const item = candidates[(start + offset) % candidates.length];
    const key = `${slot}:${item.id}`;
    if (!usedCatalogKeys.has(key)) {
      return item.id;
    }
  }

  return candidates[start % candidates.length].id;
}

export function listShopSlots(): GearSlot[] {
  return [...ACTIVE_GEAR_SLOTS];
}

export function getShopMaxRarityForProgress(
  completedMainIds: readonly MissionId[] = [],
  difficultyTier = 1,
): GearRarity {
  return GEAR_RARITIES[getShopMaxRarityIndex(completedMainIds, difficultyTier)];
}

/** @deprecated Preferir getShopMaxRarityForProgress — alias com mains vazias + tier só para mythic. */
export function getShopMaxRarityForTier(tier: number): GearRarity {
  return getShopMaxRarityForProgress([], tier);
}
