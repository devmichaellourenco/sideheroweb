/**
 * Distribuição de XP/ouro por fase para o Balance Lab.
 */
import { Experience } from '../../src/domain/value-objects/Experience';
import { CAMPAIGN_MAPS } from '../../src/domain/campaign/CampaignMaps';
import { buildPhaseId, type MapId } from '../../src/domain/campaign/CampaignIds';
import {
  CAMPAIGN_XP_KILL_MULTIPLIER,
  campaignKillXpScale,
  earlyMapKillXpBoost,
} from '../../src/domain/balance/CampaignXpScaling';
import {
  chapterMainPhaseForPhaseNumber,
  listMissionChapterOptions,
  normalPhaseNumberBandForCurrentMain,
} from '../../src/domain/campaign/missions/NormalMissionMainBand';
import { BASE_GAME_MAX_MAP_INDEX } from '../../src/domain/campaign/CampaignReleaseScope';
import {
  getPhaseRewardOverride,
  normalizePhaseRewardOverride,
  setRuntimePhaseRewardOverrides,
  type PhaseRewardOverride,
} from '../../src/domain/campaign/PhaseRewardOverrides';
import { clearPhaseGoldScaleCache } from '../../src/domain/balance/PhaseGoldBudget';
import {
  catalogPhaseXpTotal,
  clearPhaseXpScaleCache,
  effectivePhaseXpTotal,
} from '../../src/domain/balance/PhaseXpBudget';
import { resolvePhase, resolvePhaseBattle } from '../../src/domain/campaign/CampaignCatalog';
import { spawnEnemiesForWave } from '../../src/domain/campaign/WaveEnemyFactory';
import { milestoneGoldScaleForPhase } from '../../src/domain/balance/MilestoneGoldCap';

export interface PhaseRewardRow {
  phaseId: string;
  phaseNumber: number;
  chapterMainPhase: number;
  displayName: string;
  difficultyTier: number;
  waveCount: number;
  enemyCount: number;
  /** Nome sem rename do override de recompensa (handcrafted + batalha). */
  baselineDisplayName: string;
  /** Totais sem override do lab (ouro ainda usa teto de economia). */
  baselineXp: number;
  baselineGold: number;
  /** Totais efetivos (com override se houver). */
  xpTotal: number;
  goldTotal: number;
  xpScale: number;
  earlyBoost: number;
  xpCumulative: number;
  goldCumulative: number;
  heroLevelAfter: number;
  hasOverride: boolean;
  override: PhaseRewardOverride | null;
}

export interface PhaseRewardsMapSummary {
  mapId: MapId;
  mapName: string;
  mapIndex: number;
  phases: PhaseRewardRow[];
  xpTotal: number;
  goldTotal: number;
  heroLevelAtEnd: number;
}

export interface PhaseRewardsLabPayload {
  maps: PhaseRewardsMapSummary[];
  chapters: ReturnType<typeof listMissionChapterOptions>;
  knobs: {
    campaignXpKillMultiplier: number;
    note: string;
  };
  updatedAt: string | null;
}

export function applyLabPhaseRewardOverrides(
  overrides: Record<string, PhaseRewardOverride> | null,
): void {
  setRuntimePhaseRewardOverrides(overrides);
  clearPhaseXpScaleCache();
  clearPhaseGoldScaleCache();
}

function sumPhaseSpawn(
  phaseId: string,
  options: { applyPhaseRewardOverrides: boolean },
): {
  displayName: string;
  difficultyTier: number;
  waveCount: number;
  enemyCount: number;
  goldTotal: number;
} | null {
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
      applyPhaseRewardOverrides: options.applyPhaseRewardOverrides,
    });
    enemyCount += enemies.length;
    for (const enemy of enemies) {
      goldTotal += enemy.goldReward;
    }
  }

  if (phase.waves.length === 0) return null;

  return {
    displayName: phase.displayName,
    difficultyTier: phase.difficultyTier,
    waveCount: phase.waves.length,
    enemyCount,
    goldTotal,
  };
}

function buildPhaseRow(mapIndex: number, phaseNumber: number): Omit<
  PhaseRewardRow,
  'xpCumulative' | 'goldCumulative' | 'heroLevelAfter'
> | null {
  const phaseId = buildPhaseId(mapIndex, phaseNumber);
  const baseline = sumPhaseSpawn(phaseId, { applyPhaseRewardOverrides: false });
  if (!baseline) return null;

  const effective = sumPhaseSpawn(phaseId, { applyPhaseRewardOverrides: true }) ?? baseline;
  const override = getPhaseRewardOverride(phaseId);
  const battlePhase = resolvePhaseBattle(phaseId);
  const baselineDisplayName = battlePhase?.displayName ?? baseline.displayName;
  const xpTotal = effectivePhaseXpTotal(phaseId);
  const baselineXp = catalogPhaseXpTotal(phaseId);

  return {
    phaseId,
    phaseNumber,
    chapterMainPhase: chapterMainPhaseForPhaseNumber(phaseNumber),
    displayName: effective.displayName,
    baselineDisplayName,
    difficultyTier: effective.difficultyTier,
    waveCount: effective.waveCount,
    enemyCount: effective.enemyCount,
    baselineXp,
    baselineGold: baseline.goldTotal,
    xpTotal,
    goldTotal: effective.goldTotal,
    xpScale: campaignKillXpScale(effective.difficultyTier),
    earlyBoost: earlyMapKillXpBoost(effective.difficultyTier),
    hasOverride: Boolean(normalizePhaseRewardOverride(override)),
    override: normalizePhaseRewardOverride(override),
  };
}

export function buildPhaseRewardsForMap(mapIndex: number): PhaseRewardsMapSummary | null {
  const map = CAMPAIGN_MAPS.find((entry) => entry.mapIndex === mapIndex);
  if (!map) return null;

  const phases: PhaseRewardRow[] = [];
  let xpCumulative = 0;
  let goldCumulative = 0;

  for (let phaseNumber = 1; phaseNumber <= map.phaseCount; phaseNumber += 1) {
    const row = buildPhaseRow(mapIndex, phaseNumber);
    if (!row) continue;
    xpCumulative += row.xpTotal;
    goldCumulative += row.goldTotal;
    const heroLevelAfter = Experience.initial().gain(xpCumulative).experience.level;
    phases.push({
      ...row,
      xpCumulative,
      goldCumulative,
      heroLevelAfter,
    });
  }

  return {
    mapId: map.id,
    mapName: map.name,
    mapIndex: map.mapIndex,
    phases,
    xpTotal: xpCumulative,
    goldTotal: goldCumulative,
    heroLevelAtEnd: Experience.initial().gain(xpCumulative).experience.level,
  };
}

export function buildPhaseRewardsLabPayload(filters?: {
  mapId?: string;
  chapterMain?: number;
  maxMapIndex?: number;
  diskOverrides?: Record<string, PhaseRewardOverride> | null;
  updatedAt?: string | null;
}): PhaseRewardsLabPayload {
  applyLabPhaseRewardOverrides(filters?.diskOverrides ?? null);

  const maxMap = filters?.maxMapIndex ?? BASE_GAME_MAX_MAP_INDEX;
  const maps: PhaseRewardsMapSummary[] = [];

  for (const map of CAMPAIGN_MAPS) {
    if (map.mapIndex > maxMap) continue;
    if (filters?.mapId && map.id !== filters.mapId) continue;
    const summary = buildPhaseRewardsForMap(map.mapIndex);
    if (!summary) continue;

    if (filters?.chapterMain !== undefined && Number.isFinite(filters.chapterMain)) {
      const band = normalPhaseNumberBandForCurrentMain(filters.chapterMain);
      let xpCumulative = 0;
      let goldCumulative = 0;
      const phases = summary.phases
        .filter((phase) => phase.phaseNumber >= band.min && phase.phaseNumber <= band.max)
        .map((phase) => {
          xpCumulative += phase.xpTotal;
          goldCumulative += phase.goldTotal;
          return {
            ...phase,
            xpCumulative,
            goldCumulative,
            heroLevelAfter: Experience.initial().gain(xpCumulative).experience.level,
          };
        });
      maps.push({
        ...summary,
        phases,
        xpTotal: xpCumulative,
        goldTotal: goldCumulative,
        heroLevelAtEnd: Experience.initial().gain(xpCumulative).experience.level,
      });
    } else {
      maps.push(summary);
    }
  }

  // Evita vazar runtime do lab para outras requests se o módulo persistir.
  applyLabPhaseRewardOverrides(null);

  return {
    maps,
    chapters: listMissionChapterOptions(),
    knobs: {
      campaignXpKillMultiplier: CAMPAIGN_XP_KILL_MULTIPLIER,
      note:
        'Edite nome, XP/ouro alvo por fase e salve em phase-reward-overrides.json. XP alvo é pago na vitória (lump sum); ouro continua via kills. Rebuild da extensão para embutir no jogo.',
    },
    updatedAt: filters?.updatedAt ?? null,
  };
}

export { normalizePhaseRewardOverride };
