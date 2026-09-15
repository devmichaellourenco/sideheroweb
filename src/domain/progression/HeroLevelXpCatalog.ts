import {
  CAMPAIGN_HERO_LEVEL_SOFT_CAP,
  campaignHeroXpRequired,
} from '../balance/CampaignXpScaling';
import { applyHeroLevelXpOverride } from './HeroLevelXpOverrides';

/**
 * XP necessária para avançar do nível N para N+1 (níveis 1–100).
 */
export interface HeroLevelXpEntry {
  readonly level: number;
  readonly expForLevelUp: number;
}

export const HERO_MAX_LEVEL = 100;

export const HERO_LEVEL_XP_TABLE: readonly HeroLevelXpEntry[] = [
  { level: 1, expForLevelUp: 30 },
  { level: 2, expForLevelUp: 150 },
  { level: 3, expForLevelUp: 500 },
  { level: 4, expForLevelUp: 1_000 },
  { level: 5, expForLevelUp: 2_600 },
  { level: 6, expForLevelUp: 6_500 },
  { level: 7, expForLevelUp: 13_000 },
  { level: 8, expForLevelUp: 23_400 },
  { level: 9, expForLevelUp: 37_440 },
  { level: 10, expForLevelUp: 52_416 },
  { level: 11, expForLevelUp: 94_348 },
  { level: 12, expForLevelUp: 160_393 },
  { level: 13, expForLevelUp: 256_629 },
  { level: 14, expForLevelUp: 359_280 },
  { level: 15, expForLevelUp: 502_992 },
  { level: 16, expForLevelUp: 679_039 },
  { level: 17, expForLevelUp: 916_703 },
  { level: 18, expForLevelUp: 1_191_715 },
  { level: 19, expForLevelUp: 1_430_058 },
  { level: 20, expForLevelUp: 2_145_087 },
  { level: 21, expForLevelUp: 2_530_871 },
  { level: 22, expForLevelUp: 2_910_502 },
  { level: 23, expForLevelUp: 3_317_973 },
  { level: 24, expForLevelUp: 3_749_309 },
  { level: 25, expForLevelUp: 4_386_692 },
  { level: 26, expForLevelUp: 5_395_632 },
  { level: 27, expForLevelUp: 6_906_409 },
  { level: 28, expForLevelUp: 8_494_883 },
  { level: 29, expForLevelUp: 9_939_013 },
  { level: 30, expForLevelUp: 10_932_915 },
  { level: 31, expForLevelUp: 12_026_206 },
  { level: 32, expForLevelUp: 13_096_538 },
  { level: 33, expForLevelUp: 14_119_509 },
  { level: 34, expForLevelUp: 15_070_160 },
  { level: 35, expForLevelUp: 15_923_969 },
  { level: 36, expForLevelUp: 16_657_890 },
  { level: 37, expForLevelUp: 17_251_380 },
  { level: 38, expForLevelUp: 17_687_355 },
  { level: 39, expForLevelUp: 17_953_004 },
  { level: 40, expForLevelUp: 18_040_416 },
  { level: 41, expForLevelUp: 17_946_972 },
  { level: 42, expForLevelUp: 17_675_471 },
  { level: 43, expForLevelUp: 17_233_997 },
  { level: 44, expForLevelUp: 19_943_061 },
  { level: 45, expForLevelUp: 23_077_971 },
  { level: 46, expForLevelUp: 26_705_666 },
  { level: 47, expForLevelUp: 30_903_609 },
  { level: 48, expForLevelUp: 36_157_223 },
  { level: 49, expForLevelUp: 44_473_384 },
  { level: 50, expForLevelUp: 56_925_932 },
  { level: 51, expForLevelUp: 70_018_896 },
  { level: 52, expForLevelUp: 81_922_108 },
  { level: 53, expForLevelUp: 87_656_656 },
  { level: 54, expForLevelUp: 93_792_622 },
  { level: 55, expForLevelUp: 100_358_106 },
  { level: 56, expForLevelUp: 107_383_173 },
  { level: 57, expForLevelUp: 114_899_995 },
  { level: 58, expForLevelUp: 122_942_995 },
  { level: 59, expForLevelUp: 131_549_005 },
  { level: 60, expForLevelUp: 140_757_436 },
  { level: 61, expForLevelUp: 150_610_457 },
  { level: 62, expForLevelUp: 161_153_189 },
  { level: 63, expForLevelUp: 169_210_848 },
  { level: 64, expForLevelUp: 177_671_391 },
  { level: 65, expForLevelUp: 186_554_960 },
  { level: 66, expForLevelUp: 195_882_708 },
  { level: 67, expForLevelUp: 205_676_844 },
  { level: 68, expForLevelUp: 215_960_686 },
  { level: 69, expForLevelUp: 226_758_720 },
  { level: 70, expForLevelUp: 238_096_655 },
  { level: 71, expForLevelUp: 250_001_488 },
  { level: 72, expForLevelUp: 262_501_563 },
  { level: 73, expForLevelUp: 275_626_641 },
  { level: 74, expForLevelUp: 289_407_973 },
  { level: 75, expForLevelUp: 303_878_372 },
  { level: 76, expForLevelUp: 319_072_290 },
  { level: 77, expForLevelUp: 335_025_905 },
  { level: 78, expForLevelUp: 391_980_309 },
  { level: 79, expForLevelUp: 482_135_779 },
  { level: 80, expForLevelUp: 617_133_798 },
  { level: 81, expForLevelUp: 759_074_572 },
  { level: 82, expForLevelUp: 888_117_249 },
  { level: 83, expForLevelUp: 914_760_767 },
  { level: 84, expForLevelUp: 942_203_590 },
  { level: 85, expForLevelUp: 970_469_698 },
  { level: 86, expForLevelUp: 999_583_788 },
  { level: 87, expForLevelUp: 1_029_571_302 },
  { level: 88, expForLevelUp: 1_060_458_440 },
  { level: 89, expForLevelUp: 1_092_272_194 },
  { level: 90, expForLevelUp: 1_125_040_359 },
  { level: 91, expForLevelUp: 1_158_791_570 },
  { level: 92, expForLevelUp: 1_193_555_317 },
  { level: 93, expForLevelUp: 1_217_426_424 },
  { level: 94, expForLevelUp: 1_241_774_952 },
  { level: 95, expForLevelUp: 1_266_610_451 },
  { level: 96, expForLevelUp: 1_291_942_660 },
  { level: 97, expForLevelUp: 1_317_781_513 },
  { level: 98, expForLevelUp: 1_344_137_143 },
  { level: 99, expForLevelUp: 1_371_019_885 },
  { level: 100, expForLevelUp: 1_398_440_283 },
] as const;

/** XP canônica para sair do nível (curva/tabela, sem override do Balance Lab). */
export function catalogExpRequiredToAdvanceFromLevel(level: number): number {
  if (level >= HERO_MAX_LEVEL) {
    return 0;
  }

  const safeLevel = Math.max(1, Math.floor(level));

  if (safeLevel <= CAMPAIGN_HERO_LEVEL_SOFT_CAP) {
    return campaignHeroXpRequired(safeLevel);
  }

  const entry = HERO_LEVEL_XP_TABLE.find((row) => row.level === safeLevel);
  return entry?.expForLevelUp ?? HERO_LEVEL_XP_TABLE[0].expForLevelUp;
}

/** XP para sair do nível informado. Retorna 0 no nível máximo. */
export function expRequiredToAdvanceFromLevel(level: number): number {
  if (level >= HERO_MAX_LEVEL) {
    return 0;
  }

  const safeLevel = Math.max(1, Math.floor(level));

  return applyHeroLevelXpOverride(
    safeLevel,
    catalogExpRequiredToAdvanceFromLevel(safeLevel),
  );
}

export function clampHeroLevel(level: number): number {
  return Math.min(HERO_MAX_LEVEL, Math.max(1, Math.floor(level)));
}
