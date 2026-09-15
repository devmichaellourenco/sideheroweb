/**
 * Auditoria de economia — ouro por fase + preços de loja + custo de renovação + forja/salvage.
 */
import { buildPhaseId, type MapId } from '../../src/domain/campaign/CampaignIds';
import { CAMPAIGN_MAPS } from '../../src/domain/campaign/CampaignMaps';
import { BASE_GAME_MAX_MAP_INDEX } from '../../src/domain/campaign/CampaignReleaseScope';
import {
  chapterMainPhaseForPhaseNumber,
  listMissionChapterOptions,
} from '../../src/domain/campaign/missions/NormalMissionMainBand';
import { resolvePhase } from '../../src/domain/campaign/CampaignCatalog';
import { spawnEnemiesForWave } from '../../src/domain/campaign/WaveEnemyFactory';
import { milestoneGoldScaleForPhase } from '../../src/domain/balance/MilestoneGoldCap';
import {
  calculateShopItemPrice,
  calculateShopRefreshCost,
  calculateReferenceShopPrice,
} from '../../src/domain/shop/ShopPricing';
import {
  listConfiguredShops,
  shopProgressionTier,
} from '../../src/domain/shop/ConfigurableShopCatalog';
import { getGearCatalogItem } from '../../src/domain/gear/GearItemCatalog';
import { phaseIdFromMainMissionId } from '../../src/domain/campaign/missions/MissionId';
import { GEAR_RARITIES, type GearRarity } from '../../src/domain/entities/Gear';
import { calculateForgeSalvageGold } from '../../src/domain/forge/ForgeSalvageGoldCatalog';
import {
  canForgeFuseRarity,
  FORGE_FUSE_REQUIRED_COUNT,
  getNextGearRarity,
} from '../../src/domain/gear/GearRarityProgression';
import { referenceGoldPerPhaseForTier } from '../../src/domain/balance/EconomyReference';

export interface EconomyPhaseRow {
  phaseId: string;
  phaseNumber: number;
  chapterMainPhase: number;
  displayName: string;
  goldTotal: number;
  waveCount: number;
  enemyCount: number;
}

export interface EconomyShopRow {
  shopId: string;
  shopName: string;
  tier: number;
  refreshCost: number;
  items: Array<{
    id: string;
    name: string;
    rarity: string;
    basePrice: number;
    effectivePrice: number;
  }>;
}

export interface EconomyMapRow {
  mapId: MapId;
  mapName: string;
  mapIndex: number;
  phases: EconomyPhaseRow[];
  goldTotal: number;
  shops: EconomyShopRow[];
}

export interface EconomyAuditPayload {
  maps: EconomyMapRow[];
  chapters: ReturnType<typeof listMissionChapterOptions>;
}

// ── Forja / Salvage ──────────────────────────────────────────────────────────

/** Estágios representativos usados para calcular salvage gold na auditoria. */
export const FORGE_AUDIT_STAGES = [1, 10, 25, 50, 100] as const;

export interface ForgeSalvageRarityRow {
  rarity: GearRarity;
  /** Raridade resultante da fusão (null = não pode fundir). */
  nextRarity: GearRarity | null;
  canFuse: boolean;
  /** Ouro base de salvage (stage 0). */
  baseGold: number;
  /** Ouro de salvage por estágio representativo. */
  goldByStage: Record<number, number>;
  /**
   * Custo implícito de fusão = FORGE_FUSE_REQUIRED_COUNT × salvageGold.
   * Valor de oportunidade perdido ao fundir em vez de salvar.
   */
  fusionOpportunityCostByStage: Record<number, number>;
}

export interface ForgeSalvagePhasesRow {
  rarity: GearRarity;
  /** Preço de referência deste item no tier 10 (early). */
  refPriceTier10: number;
  /** Preço épico de referência no tier 10. */
  epicRefPriceTier10: number;
  /** Salvages (stage 10) para acumular ouro do preço de referência. */
  salvagesToAffordRef: number;
  /** Salvages (stage 10) para acumular ouro do preço épico. */
  salvagesToAffordEpic: number;
}

export interface ForgeSalvagePayload {
  rarityRows: ForgeSalvageRarityRow[];
  phasesRows: ForgeSalvagePhasesRow[];
  /** Número de itens necessários para fusão (canônico). */
  fuseRequiredCount: number;
  /** Ouro de referência por fase no tier 10. */
  refGoldPerPhaseTier10: number;
}

function sumPhaseGold(phaseId: string): { goldTotal: number; enemyCount: number } | null {
  const phase = resolvePhase(phaseId);
  if (!phase) return null;

  const milestoneGoldScale = milestoneGoldScaleForPhase(phase);
  let goldTotal = 0;
  let enemyCount = 0;

  for (let waveIndex = 0; waveIndex < phase.waves.length; waveIndex += 1) {
    const wave = phase.waves[waveIndex];
    const enemies = spawnEnemiesForWave(wave, {
      phaseId,
      waveIndex,
      difficultyTier: phase.difficultyTier,
      isBossWave: waveIndex === phase.waves.length - 1,
      statMultiplier: phase.statMultiplier ?? 1,
      milestoneGoldScale,
      applyPhaseRewardOverrides: true,
    });
    enemyCount += enemies.length;
    for (const enemy of enemies) {
      goldTotal += enemy.goldReward;
    }
  }

  return { goldTotal, enemyCount };
}

function buildShopRows(mapIndex: number): EconomyShopRow[] {
  const shops = listConfiguredShops().filter((shop) => {
    const phaseId = phaseIdFromMainMissionId(shop.unlockAfterMainId);
    const mi = phaseId ? Number(phaseId.split('-')[0]) : 0;
    return mi === mapIndex;
  });

  return shops.map((shop) => {
    const tier = shopProgressionTier(shop.unlockAfterMainId);
    return {
      shopId: shop.id,
      shopName: shop.name,
      tier,
      refreshCost: calculateShopRefreshCost(tier),
      items: shop.catalogItemIds.flatMap((itemId) => {
        const item = getGearCatalogItem(itemId);
        if (!item) return [];
        const effectivePrice = calculateShopItemPrice(item.basePrice, [
          { multiplier: shop.priceMultiplier, flatAdjustment: shop.flatPriceAdjustment },
        ]);
        return [
          {
            id: itemId,
            name: item.name,
            rarity: item.rarity,
            basePrice: item.basePrice,
            effectivePrice,
          },
        ];
      }),
    };
  });
}

export function buildEconomyAuditPayload(filters?: {
  mapIndex?: number;
  chapterMain?: number;
}): EconomyAuditPayload {
  const maps: EconomyMapRow[] = [];

  for (const mapDef of CAMPAIGN_MAPS) {
    const mi = mapDef.mapIndex;
    if (mi > BASE_GAME_MAX_MAP_INDEX) continue;
    if (filters?.mapIndex !== undefined && filters.mapIndex !== mi) continue;

    const phases: EconomyPhaseRow[] = [];
    let goldTotal = 0;

    const maxPhase = 30;
    for (let phaseNumber = 1; phaseNumber <= maxPhase; phaseNumber += 1) {
      const chapterMainPhase = chapterMainPhaseForPhaseNumber(phaseNumber);
      if (filters?.chapterMain !== undefined && filters.chapterMain !== chapterMainPhase) continue;

      const phaseId = buildPhaseId(mi, phaseNumber);
      const phase = resolvePhase(phaseId);
      if (!phase) continue;

      const goldData = sumPhaseGold(phaseId);
      if (!goldData) continue;

      phases.push({
        phaseId,
        phaseNumber,
        chapterMainPhase,
        displayName: phase.displayName,
        goldTotal: goldData.goldTotal,
        waveCount: phase.waves.length,
        enemyCount: goldData.enemyCount,
      });
      goldTotal += goldData.goldTotal;
    }

    maps.push({
      mapId: mapDef.id as MapId,
      mapName: mapDef.name,
      mapIndex: mi,
      phases,
      goldTotal,
      shops: buildShopRows(mi),
    });
  }

  return { maps, chapters: listMissionChapterOptions() };
}

// ── Forja / Salvage ──────────────────────────────────────────────────────────

const FORGE_REFERENCE_TIER = 10;

export function buildForgeSalvagePayload(): ForgeSalvagePayload {
  const refGoldPerPhaseTier10 = referenceGoldPerPhaseForTier(FORGE_REFERENCE_TIER);
  const epicRefPrice = calculateReferenceShopPrice(FORGE_REFERENCE_TIER, 'epic');

  const rarityRows: ForgeSalvageRarityRow[] = GEAR_RARITIES.map((rarity) => {
    const goldByStage: Record<number, number> = {};
    const fusionOpportunityCostByStage: Record<number, number> = {};

    for (const stage of FORGE_AUDIT_STAGES) {
      const gold = calculateForgeSalvageGold(rarity, stage);
      goldByStage[stage] = gold;
      fusionOpportunityCostByStage[stage] = canForgeFuseRarity(rarity)
        ? gold * FORGE_FUSE_REQUIRED_COUNT
        : 0;
    }

    return {
      rarity,
      nextRarity: getNextGearRarity(rarity),
      canFuse: canForgeFuseRarity(rarity),
      baseGold: calculateForgeSalvageGold(rarity, 0),
      goldByStage,
      fusionOpportunityCostByStage,
    };
  });

  const phasesRows: ForgeSalvagePhasesRow[] = GEAR_RARITIES.map((rarity) => {
    const refPrice = calculateReferenceShopPrice(FORGE_REFERENCE_TIER, rarity);
    const salvageAtStage10 = calculateForgeSalvageGold(rarity, 10);
    return {
      rarity,
      refPriceTier10: refPrice,
      epicRefPriceTier10: epicRefPrice,
      salvagesToAffordRef: Math.ceil(refPrice / Math.max(1, salvageAtStage10)),
      salvagesToAffordEpic: Math.ceil(epicRefPrice / Math.max(1, salvageAtStage10)),
    };
  });

  return {
    rarityRows,
    phasesRows,
    fuseRequiredCount: FORGE_FUSE_REQUIRED_COUNT,
    refGoldPerPhaseTier10,
  };
}
