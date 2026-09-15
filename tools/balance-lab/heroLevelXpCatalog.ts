/**
 * Curva editável de XP por nível dos heróis para o Balance Lab.
 */
import {
  CAMPAIGN_HERO_LEVEL_SOFT_CAP,
  campaignHeroXpRequired,
} from '../../src/domain/balance/CampaignXpScaling';
import {
  catalogExpRequiredToAdvanceFromLevel,
  expRequiredToAdvanceFromLevel,
  HERO_MAX_LEVEL,
} from '../../src/domain/progression/HeroLevelXpCatalog';
import {
  getHeroLevelXpOverride,
  normalizeHeroLevelXpOverrides,
  normalizeHeroLevelXpValue,
  setRuntimeHeroLevelXpOverrides,
} from '../../src/domain/progression/HeroLevelXpOverrides';

/** Origem da XP canônica do nível: fórmula da campanha ou tabela legada. */
export type HeroLevelXpSegment = 'campaign' | 'legacy';

export interface HeroLevelXpRow {
  level: number;
  segment: HeroLevelXpSegment;
  /** XP canônica para ir de `level` → `level + 1`. */
  baselineXp: number;
  /** XP efetiva (com override, se houver). */
  xp: number;
  baselineCumulativeXp: number;
  cumulativeXp: number;
  /** Razão da XP efetiva contra o nível anterior (curva de crescimento). */
  growth: number;
  /** Razão da XP efetiva contra a canônica do mesmo nível. */
  vsBaseline: number;
  hasOverride: boolean;
}

export interface HeroLevelXpBandOption {
  min: number;
  max: number;
  label: string;
}

export interface HeroLevelXpLabPayload {
  rows: HeroLevelXpRow[];
  bands: HeroLevelXpBandOption[];
  totals: {
    baselineTotalXp: number;
    totalXp: number;
    overrideCount: number;
  };
  knobs: {
    maxLevel: number;
    softCap: number;
    note: string;
  };
  updatedAt: string | null;
}

const BAND_SIZE = 10;

export function applyLabHeroLevelXpOverrides(
  levels: Record<string, number> | null,
): void {
  setRuntimeHeroLevelXpOverrides(levels ? normalizeHeroLevelXpOverrides(levels) : null);
}

export function listHeroLevelXpBands(): HeroLevelXpBandOption[] {
  const bands: HeroLevelXpBandOption[] = [];
  for (let min = 1; min < HERO_MAX_LEVEL; min += BAND_SIZE) {
    const max = Math.min(min + BAND_SIZE - 1, HERO_MAX_LEVEL - 1);
    bands.push({ min, max, label: `Nível ${min}–${max}` });
  }
  return bands;
}

function segmentForLevel(level: number): HeroLevelXpSegment {
  return level <= CAMPAIGN_HERO_LEVEL_SOFT_CAP ? 'campaign' : 'legacy';
}

/** Linhas de 1 até `HERO_MAX_LEVEL - 1` (no nível máximo não há XP para subir). */
export function buildHeroLevelXpRows(): HeroLevelXpRow[] {
  const rows: HeroLevelXpRow[] = [];
  let baselineCumulativeXp = 0;
  let cumulativeXp = 0;
  let previousXp = 0;

  for (let level = 1; level < HERO_MAX_LEVEL; level += 1) {
    const baselineXp = catalogExpRequiredToAdvanceFromLevel(level);
    const xp = expRequiredToAdvanceFromLevel(level);
    baselineCumulativeXp += baselineXp;
    cumulativeXp += xp;

    rows.push({
      level,
      segment: segmentForLevel(level),
      baselineXp,
      xp,
      baselineCumulativeXp,
      cumulativeXp,
      growth: previousXp > 0 ? xp / previousXp : 1,
      vsBaseline: baselineXp > 0 ? xp / baselineXp : 1,
      hasOverride: getHeroLevelXpOverride(level) !== null,
    });

    previousXp = xp;
  }

  return rows;
}

export function buildHeroLevelXpLabPayload(options?: {
  diskOverrides?: Record<string, number> | null;
  updatedAt?: string | null;
  bandMin?: number;
}): HeroLevelXpLabPayload {
  applyLabHeroLevelXpOverrides(options?.diskOverrides ?? null);

  const allRows = buildHeroLevelXpRows();
  const bands = listHeroLevelXpBands();
  const band =
    options?.bandMin !== undefined && Number.isFinite(options.bandMin)
      ? bands.find((entry) => entry.min === Math.floor(options.bandMin as number))
      : undefined;

  const rows = band
    ? allRows.filter((row) => row.level >= band.min && row.level <= band.max)
    : allRows;

  const last = allRows[allRows.length - 1];
  const overrideCount = allRows.filter((row) => row.hasOverride).length;

  applyLabHeroLevelXpOverrides(null);

  return {
    rows,
    bands,
    totals: {
      baselineTotalXp: last?.baselineCumulativeXp ?? 0,
      totalXp: last?.cumulativeXp ?? 0,
      overrideCount,
    },
    knobs: {
      maxLevel: HERO_MAX_LEVEL,
      softCap: CAMPAIGN_HERO_LEVEL_SOFT_CAP,
      note: `Níveis 1–${CAMPAIGN_HERO_LEVEL_SOFT_CAP} vêm da curva de campanha (campaignHeroXpRequired); acima disso, da tabela legada. Overrides gravam em hero-level-xp-overrides.json e entram no jogo no rebuild da extensão.`,
    },
    updatedAt: options?.updatedAt ?? null,
  };
}

export { campaignHeroXpRequired, normalizeHeroLevelXpOverrides, normalizeHeroLevelXpValue };
