import { describe, expect, it } from 'vitest';
import {
  deterministicGearItemLevel,
  gearLevelRangeForTier,
  isExemptFromMapGearLevelPolicy,
  mapIndexFromDifficultyTier,
  MAP_GEAR_LEVEL_RANGES,
  rollGearItemLevel,
} from './MapGearLevelPolicy';

describe('MapGearLevelPolicy', () => {
  it('mapeia tier global para índice de mapa', () => {
    expect(mapIndexFromDifficultyTier(1)).toBe(1);
    expect(mapIndexFromDifficultyTier(50)).toBe(1);
    expect(mapIndexFromDifficultyTier(51)).toBe(2);
    expect(mapIndexFromDifficultyTier(150)).toBe(3);
    expect(mapIndexFromDifficultyTier(200)).toBe(4);
  });

  it('define faixas de nível por mapa conforme spec', () => {
    expect(gearLevelRangeForTier(10)).toEqual(MAP_GEAR_LEVEL_RANGES[1]);
    expect(gearLevelRangeForTier(60)).toEqual(MAP_GEAR_LEVEL_RANGES[2]);
    expect(gearLevelRangeForTier(120)).toEqual(MAP_GEAR_LEVEL_RANGES[3]);
    expect(gearLevelRangeForTier(180)).toEqual(MAP_GEAR_LEVEL_RANGES[4]);
  });

  it('rola nível dentro da faixa do mapa', () => {
    for (const tier of [5, 55, 125, 195]) {
      const range = gearLevelRangeForTier(tier);
      for (let attempt = 0; attempt < 30; attempt += 1) {
        const level = rollGearItemLevel(tier);
        expect(level).toBeGreaterThanOrEqual(range.min);
        expect(level).toBeLessThanOrEqual(range.max);
      }
    }
  });

  it('nível determinístico respeita faixa e progresso na trilha', () => {
    const early = deterministicGearItemLevel(2, 0);
    const late = deterministicGearItemLevel(49, 0);

    expect(early).toBeGreaterThanOrEqual(1);
    expect(early).toBeLessThanOrEqual(12);
    expect(late).toBeGreaterThanOrEqual(early);
    expect(late).toBeLessThanOrEqual(12);
  });

  it('únicos de boss final ignoram política de faixa por mapa', () => {
    expect(isExemptFromMapGearLevelPolicy('ignus_ix')).toBe(true);
    expect(isExemptFromMapGearLevelPolicy('sword_vorpal_lupnus')).toBe(true);
    expect(isExemptFromMapGearLevelPolicy('galneon_standard_sword')).toBe(false);
  });
});
