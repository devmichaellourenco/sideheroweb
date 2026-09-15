import { mapIndexFromDifficultyTier } from '../gear/MapGearLevelPolicy';

/** Multiplicador global sobre a escala de XP por kill (independente do combate). */
export const CAMPAIGN_XP_KILL_MULTIPLIER = 1.75;

/** @deprecated Sem replay de fase — normais dão XP cheio. Mantido só por imports legados. */
export const CAMPAIGN_REPLAY_XP_MULTIPLIER = 1;

/** Níveis 1–50 usam curva de campanha; acima disso mantém tabela legada. */
export const CAMPAIGN_HERO_LEVEL_SOFT_CAP = 50;

/** Escala base de XP por kill conforme o mapa (Stendra → Morthaven). */
const MAP_KILL_XP_BASE_BY_INDEX = [0.2, 2.2, 16, 95] as const;

/** Crescimento de XP do início ao fim de cada mapa. */
const MAP_KILL_XP_WITHIN_MAP_GROWTH = 1.55;

/** Tier até o qual um boost tutorial acelera levemente as primeiras fases. */
const EARLY_MAP_XP_BOOST_MAX_TIER = 14;

const EARLY_LEVEL_XP_CAP = 12;
const EARLY_LEVEL_XP_BASE = 52;
const EARLY_LEVEL_XP_GROWTH = 1.17;
const LATE_LEVEL_XP_BASE = 115;
const LATE_LEVEL_XP_GROWTH = 1.27;

/**
 * Boost nas primeiras fases de Stendra para não estagnar no nível 1–2,
 * sem inflar o ganho nas fases 17–50 na primeira run.
 */
export function earlyMapKillXpBoost(tier: number): number {
  const safeTier = Math.max(1, Math.floor(tier));

  if (safeTier > EARLY_MAP_XP_BOOST_MAX_TIER) {
    return 1;
  }

  if (safeTier <= 10) {
    return 5.5 - (safeTier - 1) * 0.35;
  }

  return 1.8 - (safeTier - 10) * 0.2;
}

/** Escala de XP por kill — desacoplada de `StageScalingCatalog.exp`. */
export function campaignKillXpScale(tier: number): number {
  const safeTier = Math.max(1, Math.floor(tier));
  const mapIndex = mapIndexFromDifficultyTier(safeTier);
  const progressInMap = ((safeTier - 1) % 50) / 49;
  const mapBase = MAP_KILL_XP_BASE_BY_INDEX[mapIndex - 1];
  const withinMap = 1 + progressInMap * MAP_KILL_XP_WITHIN_MAP_GROWTH;

  return mapBase * withinMap * earlyMapKillXpBoost(safeTier);
}

export function resolveCampaignKillXp(
  xpBase: number,
  tier: number,
  roleReward: number,
): number {
  return Math.floor(
    xpBase * roleReward * campaignKillXpScale(tier) * CAMPAIGN_XP_KILL_MULTIPLIER,
  );
}

/**
 * XP para avançar do nível N para N+1 na curva v1.
 * Early suave (nível ~8 na 1ª clear de Stendra); late íngreme (nível ~40 no finale).
 */
export function campaignHeroXpRequired(level: number): number {
  const safeLevel = Math.max(1, Math.floor(level));

  if (safeLevel <= EARLY_LEVEL_XP_CAP) {
    return Math.floor(EARLY_LEVEL_XP_BASE * Math.pow(EARLY_LEVEL_XP_GROWTH, safeLevel - 1));
  }

  return Math.floor(LATE_LEVEL_XP_BASE * Math.pow(LATE_LEVEL_XP_GROWTH, safeLevel - EARLY_LEVEL_XP_CAP));
}
