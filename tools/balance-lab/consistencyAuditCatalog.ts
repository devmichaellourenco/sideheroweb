/**
 * Auditoria read-only de órfãos e inconsistências do Balance Lab.
 *
 * Detects:
 * - Itens em nenhuma loja
 * - Lojas com pool vazio ou sem itens elegíveis no tier
 * - Lojas sem épico quando o marco já permite épico (map ≥ 2)
 * - Fases com statMultiplier extremo (> EXTREME_STAT_MULTIPLIER_THRESHOLD)
 * - Upgrades com parent inexistente
 * - Upgrades com custo zero inesperado (cost === 0, exceto raiz da árvore)
 * - Irmãos que saem do mesmo pai no mesmo ângulo (arestas sobrepostas na árvore)
 */

import { GEAR_RARITIES } from '../../src/domain/entities/Gear';
import { listCatalogGearItems } from '../../src/domain/gear/GearItemCatalog';
import { listConfiguredShops, shopProgressionTier } from '../../src/domain/shop/ConfigurableShopCatalog';
import { getShopMaxRarityForTier } from '../../src/domain/shop/ShopCatalog';
import { listEffectiveUpgrades } from '../../src/domain/upgrades/UpgradeCatalog';
import { CAMPAIGN_MAPS } from '../../src/domain/campaign/CampaignMaps';
import { buildPhaseId } from '../../src/domain/campaign/CampaignIds';
import { BASE_GAME_MAX_MAP_INDEX } from '../../src/domain/campaign/CampaignReleaseScope';
import { resolvePhase } from '../../src/domain/campaign/CampaignCatalog';
import { phaseIdFromMainMissionId } from '../../src/domain/campaign/missions/MissionId';
import {
  findSiblingBranchConflicts,
  resolveUpgradeParentIds,
} from '../../src/presentation/components/UpgradeTreeGraphPresentation';

// ── Tipos exportados ─────────────────────────────────────────────────────────

export type AuditSeverity = 'error' | 'warning' | 'info';

export type AuditKind =
  | 'item_in_no_shop'
  | 'shop_empty_pool'
  | 'shop_no_eligible_items_in_tier'
  | 'shop_missing_epic_at_milestone'
  | 'phase_extreme_stat_multiplier'
  | 'upgrade_missing_parent'
  | 'upgrade_zero_cost'
  | 'upgrade_overlapping_branch';

export interface AuditIssue {
  severity: AuditSeverity;
  kind: AuditKind;
  /** Identificador legível da entidade afetada (ID do item, da loja, da fase, etc.). */
  entity: string;
  message: string;
  /** Deep-link HTML (formato `#tab?param=value`) para navegar direto à entidade no lab. */
  deepLink?: string;
}

export interface ConsistencyAuditPayload {
  issues: AuditIssue[];
  counts: Record<AuditSeverity, number>;
  /** Limiar de statMultiplier considerado extremo. */
  extremeStatMultiplierThreshold: number;
  generatedAt: string;
}

// ── Limiar público para referência nos testes e na UI ────────────────────────

export const EXTREME_STAT_MULTIPLIER_THRESHOLD = 3.0;

// ── helpers internos ─────────────────────────────────────────────────────────

function rarityIndex(rarity: string): number {
  return GEAR_RARITIES.indexOf(rarity as (typeof GEAR_RARITIES)[number]);
}

const EPIC_INDEX = GEAR_RARITIES.indexOf('epic');

// ── regras de auditoria ──────────────────────────────────────────────────────

function auditItemsInNoShop(): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const allShopItemIds = new Set(
    listConfiguredShops().flatMap((s) => s.catalogItemIds as string[]),
  );

  for (const item of listCatalogGearItems()) {
    // Itens exclusivos de herói (ex.: Galneon) não vão para lojas normais.
    if (item.exclusiveHeroId) continue;
    if (!allShopItemIds.has(item.id)) {
      issues.push({
        severity: 'info',
        kind: 'item_in_no_shop',
        entity: item.id,
        message: `Item "${item.name}" (${item.id}) não está em nenhuma loja configurada.`,
        deepLink: `#gear?id=${encodeURIComponent(item.id)}`,
      });
    }
  }
  return issues;
}

function auditShops(): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const shops = listConfiguredShops();

  for (const shop of shops) {
    const pool = shop.catalogItemIds as string[];

    // 1) Pool vazio
    if (pool.length === 0) {
      issues.push({
        severity: 'error',
        kind: 'shop_empty_pool',
        entity: shop.id,
        message: `Loja "${shop.name}" (${shop.id}) tem pool vazio — não exibirá itens.`,
        deepLink: `#shops?id=${encodeURIComponent(shop.id)}`,
      });
      continue;
    }

    const tier = shopProgressionTier(shop.unlockAfterMainId);
    const maxRarityForTier = getShopMaxRarityForTier(tier);
    const maxRarityIdx = rarityIndex(maxRarityForTier);

    // 2) Sem itens elegíveis no tier
    const eligible = pool.filter((id) => {
      const rarity = listCatalogGearItems().find((it) => it.id === id)?.rarity;
      return rarity !== undefined && rarityIndex(rarity) <= maxRarityIdx;
    });

    if (eligible.length === 0) {
      issues.push({
        severity: 'error',
        kind: 'shop_no_eligible_items_in_tier',
        entity: shop.id,
        message:
          `Loja "${shop.name}" (${shop.id}) não tem itens elegíveis para o tier` +
          ` (max ${maxRarityForTier} / tier=${tier}). Nenhum item será sorteado.`,
        deepLink: `#shops?id=${encodeURIComponent(shop.id)}`,
      });
    }

    // 3) Sem épico quando o marco permite (map ≥ 2, i.e., tier ≥ 2001)
    if (tier >= 2001 && maxRarityIdx >= EPIC_INDEX) {
      const hasEpicOrHigher = pool.some((id) => {
        const rarity = listCatalogGearItems().find((it) => it.id === id)?.rarity;
        return rarity !== undefined && rarityIndex(rarity) >= EPIC_INDEX;
      });
      if (!hasEpicOrHigher) {
        issues.push({
          severity: 'warning',
          kind: 'shop_missing_epic_at_milestone',
          entity: shop.id,
          message:
            `Loja "${shop.name}" (${shop.id}) desbloqueada em marco ${shop.unlockAfterMainId}` +
            ` mas nenhum item épico ou superior no pool.`,
          deepLink: `#shops?id=${encodeURIComponent(shop.id)}`,
        });
      }
    }
  }
  return issues;
}

function auditPhasesStatMultiplier(): AuditIssue[] {
  const issues: AuditIssue[] = [];

  for (const mapDef of CAMPAIGN_MAPS) {
    if (mapDef.mapIndex > BASE_GAME_MAX_MAP_INDEX) continue;
    for (let phaseNumber = 1; phaseNumber <= mapDef.phaseCount; phaseNumber++) {
      const phaseId = buildPhaseId(mapDef.mapIndex, phaseNumber);
      const phase = resolvePhase(phaseId);
      if (!phase) continue;
      const sm = phase.statMultiplier ?? 1;
      if (sm > EXTREME_STAT_MULTIPLIER_THRESHOLD) {
        issues.push({
          severity: 'warning',
          kind: 'phase_extreme_stat_multiplier',
          entity: phaseId,
          message:
            `Fase ${phaseId} ("${phase.displayName}") tem statMultiplier=${sm.toFixed(2)},` +
            ` acima do limiar ${EXTREME_STAT_MULTIPLIER_THRESHOLD}.`,
          deepLink: `#missions?id=${encodeURIComponent(phaseId)}`,
        });
      }
    }
  }
  return issues;
}

function auditUpgrades(): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const effective = listEffectiveUpgrades();
  const upgradeIds = new Set(effective.map((u) => u.id));

  for (const upgrade of effective) {
    // Parent inexistente
    for (const parentId of upgrade.parents ?? []) {
      if (!upgradeIds.has(parentId)) {
        issues.push({
          severity: 'error',
          kind: 'upgrade_missing_parent',
          entity: upgrade.id,
          message: `Upgrade "${upgrade.name}" (${upgrade.id}) tem parent "${parentId}" inexistente no catálogo.`,
          deepLink: `#upgrades?id=${encodeURIComponent(upgrade.id)}`,
        });
      }
    }

    // Custo zero inesperado (raízes da árvore podem ter custo 0 intencionalmente;
    // mas a grande maioria dos upgrades precisa ter custo > 0)
    if (upgrade.cost === 0) {
      issues.push({
        severity: 'warning',
        kind: 'upgrade_zero_cost',
        entity: upgrade.id,
        message: `Upgrade "${upgrade.name}" (${upgrade.id}) tem custo zero — verifique se é intencional.`,
        deepLink: `#upgrades?id=${encodeURIComponent(upgrade.id)}`,
      });
    }
  }
  return issues;
}

/**
 * O layout da árvore é estático, então trocar `parents` no lab pode fazer dois filhos
 * saírem do mesmo pai na mesma direção — as retas se sobrepõem e a mais longa cruza o
 * irmão mais próximo. Só o layout resolve, por isso aqui é aviso e não bloqueio.
 */
function auditUpgradeBranchAngles(): AuditIssue[] {
  const edges = listEffectiveUpgrades().flatMap((upgrade) =>
    resolveUpgradeParentIds(upgrade.id).map((parentId) => ({
      fromId: parentId,
      toId: upgrade.id,
    })),
  );

  return findSiblingBranchConflicts(edges).map((conflict) => ({
    severity: 'warning' as const,
    kind: 'upgrade_overlapping_branch' as const,
    entity: conflict.parentId,
    message:
      `Upgrade "${conflict.parentId}" liga ${conflict.childIds.join(' e ')} na mesma direção` +
      ` (${conflict.direction}°) — as linhas se sobrepõem na árvore.` +
      ` Reposicione um dos filhos em UpgradeTreeLayout.ts.`,
    deepLink: `#upgrades?id=${encodeURIComponent(conflict.parentId)}`,
  }));
}

// ── ponto de entrada público ─────────────────────────────────────────────────

export function buildConsistencyAuditPayload(): ConsistencyAuditPayload {
  const issues: AuditIssue[] = [
    ...auditItemsInNoShop(),
    ...auditShops(),
    ...auditPhasesStatMultiplier(),
    ...auditUpgrades(),
    ...auditUpgradeBranchAngles(),
  ];

  const counts: Record<AuditSeverity, number> = { error: 0, warning: 0, info: 0 };
  for (const issue of issues) counts[issue.severity]++;

  return {
    issues,
    counts,
    extremeStatMultiplierThreshold: EXTREME_STAT_MULTIPLIER_THRESHOLD,
    generatedAt: new Date().toISOString(),
  };
}
