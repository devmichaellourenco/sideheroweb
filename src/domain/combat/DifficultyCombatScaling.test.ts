import { describe, expect, it } from 'vitest';
import {
  lootPrimaryStatScale,
  rolledGearPrimaryStat,
  scaledDotDamage,
  tierInnateResistBonus,
} from './DifficultyCombatScaling';

describe('DifficultyCombatScaling', () => {
  it('não adiciona resist em tiers baixos', () => {
    expect(tierInnateResistBonus(10)).toBe(0);
    expect(tierInnateResistBonus(1)).toBe(0);
  });

  it('cresce resist de inimigos em tiers altos com teto', () => {
    expect(tierInnateResistBonus(40)).toBe(2);
    expect(tierInnateResistBonus(500)).toBe(12);
  });

  it('escala dano de DOT com tier', () => {
    expect(scaledDotDamage(5, 1)).toBe(5);
    expect(scaledDotDamage(5, 100)).toBeGreaterThan(5);
  });

  it('escala loot primário com tier (legado)', () => {
    expect(lootPrimaryStatScale(1)).toBe(1);
    expect(lootPrimaryStatScale(200)).toBeGreaterThan(1);
    expect(lootPrimaryStatScale(200)).toBeLessThanOrEqual(1.35);
  });

  it('escala loot primário por nível de item', () => {
    expect(rolledGearPrimaryStat(1)).toBeGreaterThan(0);
    expect(rolledGearPrimaryStat(42)).toBeGreaterThan(rolledGearPrimaryStat(12));
    expect(rolledGearPrimaryStat(42)).toBeGreaterThan(1000);
  });
});
