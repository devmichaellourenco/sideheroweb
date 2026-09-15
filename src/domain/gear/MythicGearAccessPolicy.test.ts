import { describe, expect, it } from 'vitest';
import {
  isMythicGearUnlockedForPhase,
  isMythicGearUnlockedForTier,
  MYTHIC_UNLOCK_DIFFICULTY_TIER,
} from './MythicGearAccessPolicy';

describe('MythicGearAccessPolicy', () => {
  it('desbloqueia no Ato 3 de Valdris (3-21 / tier 121)', () => {
    expect(MYTHIC_UNLOCK_DIFFICULTY_TIER).toBe(121);
    expect(isMythicGearUnlockedForPhase('3-20')).toBe(false);
    expect(isMythicGearUnlockedForPhase('3-21')).toBe(true);
    expect(isMythicGearUnlockedForTier(120)).toBe(false);
    expect(isMythicGearUnlockedForTier(121)).toBe(true);
  });

  it('bloqueia mapas anteriores a Valdris Ato 3', () => {
    expect(isMythicGearUnlockedForPhase('1-50')).toBe(false);
    expect(isMythicGearUnlockedForPhase('2-50')).toBe(false);
    expect(isMythicGearUnlockedForPhase('3-1')).toBe(false);
    expect(isMythicGearUnlockedForPhase('4-1')).toBe(true);
  });
});
