// @vitest-environment node

import { describe, expect, it } from 'vitest';
import {
  compareGearRarityRank,
  gearRaritySurfaceClass,
  GEAR_RARITY_ORDER,
  normalizeGearRarity,
} from './GearRarityPresentation';

describe('GearRarityPresentation', () => {
  it('normaliza raridades conhecidas e faz fallback para common', () => {
    expect(normalizeGearRarity('mythic')).toBe('mythic');
    expect(normalizeGearRarity('unknown')).toBe('common');
    expect(normalizeGearRarity(null)).toBe('common');
  });

  it('gera classe de superfície coerente', () => {
    expect(gearRaritySurfaceClass('legendary')).toBe('legendary');
    expect(gearRaritySurfaceClass('empty')).toBe('empty');
    expect(gearRaritySurfaceClass(undefined)).toBe('empty');
  });

  it('ordena do mais raro para o mais comum', () => {
    const sorted = [...GEAR_RARITY_ORDER].sort(compareGearRarityRank);
    expect(sorted).toEqual([
      'mythic',
      'legendary',
      'epic',
      'rare',
      'uncommon',
      'common',
    ]);
  });
});
