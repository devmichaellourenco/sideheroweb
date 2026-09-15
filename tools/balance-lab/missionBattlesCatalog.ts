/**
 * Snapshot de missões + fases para o Balance Lab (Node / browser).
 */
import { resolvePhase } from '../../src/domain/campaign/CampaignCatalog';
import { parsePhaseId } from '../../src/domain/campaign/CampaignIds';
import {
  applyPhaseBattleOverride,
  getEmbeddedPhaseBattleOverride,
  type PhaseBattleOverride,
} from '../../src/domain/campaign/PhaseBattleOverrides';
import { listMissionCatalog, isSeedMissionId } from '../../src/domain/campaign/missions/MissionCatalog';
import type { MissionDefinition } from '../../src/domain/campaign/missions/MissionDefinition';
import { isCustomNormalMissionId } from '../../src/domain/campaign/missions/MissionId';
import {
  getActiveMissionOverrides,
  isMissionFromOverride,
  missionHasChapterChildren,
} from '../../src/domain/campaign/missions/MissionOverrides';
import {
  chapterMainPhaseForPhaseNumber,
  isNormalPhaseInBandForMain,
  listMissionChapterOptions,
  normalPhaseNumberBandForCurrentMain,
} from '../../src/domain/campaign/missions/NormalMissionMainBand';
import { CAMPAIGN_MAPS } from '../../src/domain/campaign/CampaignMaps';
import { ENEMY_ROSTER } from '../../src/domain/enemies/EnemyRosterCatalog';
import { enemySpriteUrlForLab } from './enemySprites';
import type { PhaseDefinition } from '../../src/domain/campaign/PhaseDefinition';
import { HANDCRAFTED_PHASES } from '../../src/domain/campaign/HandcraftedPhaseCatalog';

export interface MissionBattleListEntry {
  missionId: string;
  kind: MissionDefinition['kind'];
  mapId: string;
  name: string;
  phaseTemplateId: string;
  phaseNumber: number;
  /** Marco da main dono do capítulo (1, 10, 20…). */
  chapterMainPhase: number;
  chapterMin: number;
  chapterMax: number;
  stars: number | null;
  hasOverride: boolean;
  waveCount: number;
  /** Outras missões que usam o mesmo phaseTemplateId (batalha compartilhada). */
  sharedMissionIds: string[];
  isSeed: boolean;
  isCustom: boolean;
  fromOverride: boolean;
  hasChildren: boolean;
  canDelete: boolean;
  canChangeKind: boolean;
}

export interface MissionBattleDetail {
  mission: MissionBattleListEntry;
  /** Fase efetiva (base + override embutido). */
  phase: PhaseDefinition;
  /** Override puro, se existir. */
  override: PhaseBattleOverride | null;
  /** Fase gerada sem override (baseline do catálogo). */
  baselinePhase: PhaseDefinition;
}

export function listEnemyOptionsForLab(): Array<{
  id: string;
  name: string;
  powerTier: number;
  rosterRole: string;
  spriteUrl: string;
}> {
  return ENEMY_ROSTER.map((entry) => ({
    id: entry.id,
    name: entry.name,
    powerTier: entry.powerTier,
    rosterRole: entry.rosterRole,
    spriteUrl: enemySpriteUrlForLab(entry.id),
  }));
}

/** Quando `diskOverrides` é passado, não cai no JSON embutido (evita stale após DELETE no lab). */
function resolveOverrideForLab(
  phaseTemplateId: string,
  diskOverrides?: Record<string, PhaseBattleOverride>,
): PhaseBattleOverride | null {
  if (diskOverrides !== undefined) {
    return diskOverrides[phaseTemplateId] ?? null;
  }
  return getEmbeddedPhaseBattleOverride(phaseTemplateId);
}

function kindOrder(kind: MissionDefinition['kind']): number {
  if (kind === 'main') return 0;
  if (kind === 'side') return 1;
  return 2;
}

function buildSharedIndex(
  catalog: readonly MissionDefinition[],
): Map<string, string[]> {
  const byPhase = new Map<string, string[]>();
  for (const mission of catalog) {
    const list = byPhase.get(mission.phaseTemplateId) ?? [];
    list.push(mission.id);
    byPhase.set(mission.phaseTemplateId, list);
  }
  return byPhase;
}

function toListEntry(
  mission: MissionDefinition,
  override: PhaseBattleOverride | null,
  waveCount: number,
  sharedMissionIds: string[],
  catalog: readonly MissionDefinition[],
): MissionBattleListEntry {
  const phaseNumber = parsePhaseId(mission.phaseTemplateId).phaseNumber;
  const chapterMainPhase = chapterMainPhaseForPhaseNumber(phaseNumber);
  const band = normalPhaseNumberBandForCurrentMain(chapterMainPhase);
  const file = getActiveMissionOverrides();
  const isSeed = isSeedMissionId(mission.id);
  const hasChildren = missionHasChapterChildren(mission, catalog);
  return {
    missionId: mission.id,
    kind: mission.kind,
    mapId: mission.mapId,
    name: mission.name,
    phaseTemplateId: mission.phaseTemplateId,
    phaseNumber,
    chapterMainPhase,
    chapterMin: band.min,
    chapterMax: band.max,
    stars: mission.stars ?? null,
    hasOverride: Boolean(override),
    waveCount,
    sharedMissionIds: sharedMissionIds.filter((id) => id !== mission.id),
    isSeed,
    isCustom: isCustomNormalMissionId(mission.id) || (mission.kind !== 'main' && !isSeed),
    fromOverride: isMissionFromOverride(mission.id, file),
    hasChildren,
    canDelete: mission.kind !== 'main' || !hasChildren,
    canChangeKind: mission.kind !== 'main' || !hasChildren,
  };
}

function compareEntries(a: MissionBattleListEntry, b: MissionBattleListEntry): number {
  if (a.mapId !== b.mapId) return a.mapId.localeCompare(b.mapId);
  if (a.phaseNumber !== b.phaseNumber) return a.phaseNumber - b.phaseNumber;
  const ko = kindOrder(a.kind) - kindOrder(b.kind);
  if (ko !== 0) return ko;
  return a.missionId.localeCompare(b.missionId);
}

export function listMissionBattleEntries(
  overrides?: Record<string, PhaseBattleOverride>,
): MissionBattleListEntry[] {
  const catalog = listMissionCatalog();
  const shared = buildSharedIndex(catalog);

  const entries = catalog.map((mission) => {
    const baseline =
      HANDCRAFTED_PHASES.find((phase) => phase.id === mission.phaseTemplateId) ?? null;
    const override = resolveOverrideForLab(mission.phaseTemplateId, overrides);
    const phase = baseline
      ? applyPhaseBattleOverride(baseline, override)
      : resolvePhase(mission.phaseTemplateId);
    return toListEntry(
      mission,
      override,
      phase?.waves.length ?? 0,
      shared.get(mission.phaseTemplateId) ?? [mission.id],
      catalog,
    );
  });

  return entries.sort(compareEntries);
}

export function filterMissionBattleEntries(
  entries: readonly MissionBattleListEntry[],
  filters: {
    kind?: string;
    mapId?: string;
    chapterMain?: number;
    q?: string;
  },
): MissionBattleListEntry[] {
  const query = filters.q?.trim().toLowerCase() ?? '';
  return entries.filter((mission) => {
    if (filters.kind && mission.kind !== filters.kind) return false;
    if (filters.mapId && mission.mapId !== filters.mapId) return false;
    if (
      filters.chapterMain !== undefined &&
      Number.isFinite(filters.chapterMain) &&
      !isNormalPhaseInBandForMain(mission.phaseNumber, filters.chapterMain)
    ) {
      return false;
    }
    if (!query) return true;
    return (
      mission.missionId.toLowerCase().includes(query) ||
      mission.name.toLowerCase().includes(query) ||
      mission.phaseTemplateId.toLowerCase().includes(query)
    );
  });
}

export function getMissionBattleDetail(
  missionId: string,
  diskOverrides?: Record<string, PhaseBattleOverride>,
): MissionBattleDetail | null {
  const mission = listMissionCatalog().find((entry) => entry.id === missionId);
  if (!mission) return null;

  const baselinePhase =
    HANDCRAFTED_PHASES.find((phase) => phase.id === mission.phaseTemplateId) ?? null;
  if (!baselinePhase) return null;

  const override = resolveOverrideForLab(mission.phaseTemplateId, diskOverrides);
  const phase = applyPhaseBattleOverride(baselinePhase, override);
  const shared = buildSharedIndex(listMissionCatalog());

  return {
    mission: toListEntry(
      mission,
      override,
      phase.waves.length,
      shared.get(mission.phaseTemplateId) ?? [mission.id],
      listMissionCatalog(),
    ),
    phase,
    override,
    baselinePhase,
  };
}

export function buildMissionBattleLabPayload(
  diskOverrides?: Record<string, PhaseBattleOverride>,
  filters?: {
    kind?: string;
    mapId?: string;
    chapterMain?: number;
    q?: string;
  },
): {
  missions: MissionBattleListEntry[];
  enemies: ReturnType<typeof listEnemyOptionsForLab>;
  chapters: ReturnType<typeof listMissionChapterOptions>;
  maps: string[];
  phasesByMap: Record<string, string[]>;
} {
  const all = listMissionBattleEntries(diskOverrides);
  const maps = [...new Set(all.map((entry) => entry.mapId))].sort();
  const phasesByMap: Record<string, string[]> = {};
  for (const phase of HANDCRAFTED_PHASES) {
    const mapId = CAMPAIGN_MAPS.find((map) => map.mapIndex === parsePhaseId(phase.id).mapIndex)?.id;
    if (!mapId) continue;
    (phasesByMap[mapId] ??= []).push(phase.id);
  }
  return {
    missions: filters ? filterMissionBattleEntries(all, filters) : all,
    enemies: listEnemyOptionsForLab(),
    chapters: listMissionChapterOptions(),
    maps,
    phasesByMap,
  };
}

export { listMissionChapterOptions, normalPhaseNumberBandForCurrentMain };
export {
  buildPhaseRewardsLabPayload,
  buildPhaseRewardsForMap,
  applyLabPhaseRewardOverrides,
  normalizePhaseRewardOverride,
} from './phaseRewardsCatalog';
export {
  buildGearItemsLabPayload,
  getGearItemLabDetail,
  buildGearItemOverrideFromDraft,
  applyLabGearItemOverrides,
  normalizeGearItemOverride,
} from './gearItemsCatalog';
export {
  applyLabShopOverrides,
  buildShopLabPayload,
  buildShopOverrideFromDraft,
  getShopLabDetail,
} from './shopCatalog';
export {
  isCanonicalShopId,
  normalizeShopOverridesFile,
} from '../../src/domain/shop/ConfigurableShopCatalog';
export {
  applyLabMissionOverrides,
  applyCreateMission,
  applyDeleteMission,
  applyPatchMission,
  applyPutMissionsFile,
  buildMissionsLabPayload,
  emptyMissionOverridesFile,
  getMissionLabDetail,
  normalizeMissionOverridesFile,
} from './missionsCatalog';
export type { MissionLabEntry, MissionOverridesFile } from './missionsCatalog';
export {
  buildHeroLevelXpLabPayload,
  applyLabHeroLevelXpOverrides,
  normalizeHeroLevelXpOverrides,
  normalizeHeroLevelXpValue,
} from './heroLevelXpCatalog';
export {
  buildHeroCombatLabPayload,
  normalizeSkillCombatOverride,
  normalizeIdentityOverride,
  normalizeBaseStatsOverride,
  normalizePassiveOverride,
  normalizeAscensionOverride,
} from './heroCombatCatalog';
export {
  buildEnemyCombatLabPayload,
  normalizeEnemyCombatOverridesFile,
  normalizeEnemyIdentityOverride,
  normalizeEnemyMonsterSkillOverride,
} from './enemyCombatCatalog';
export {
  buildUpgradeTreeLabPayload,
  normalizeUpgradeOverride,
  normalizeUpgradeOverridesFile,
  validateUpgradeDependencies,
  validateUpgradeOverrideInput,
} from './upgradeTreeCatalog';
export {
  buildEconomyAuditPayload,
  buildForgeSalvagePayload,
} from './economyAuditCatalog';
export {
  buildConsistencyAuditPayload,
  EXTREME_STAT_MULTIPLIER_THRESHOLD,
} from './consistencyAuditCatalog';
export {
  previewShopStock,
} from './shopCatalog';
export {
  estimatePhasePower,
  DEFAULT_REFERENCE_PARTY,
} from '../../src/domain/balance/WavePartyPowerEstimate';
