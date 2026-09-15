import { describe, expect, it } from 'vitest';
import {
  applyDefensiveLayers,
  clampDefensiveMitigation,
  MAX_BLOCK_CHANCE,
  MAX_DAMAGE_REDUCTION,
  MAX_DODGE_CHANCE,
} from './DefensiveMitigation';

describe('DefensiveMitigation', () => {
  it('esquiva anula o dano', () => {
    const result = applyDefensiveLayers(50, { dodgeChance: 1, blockChance: 0, damageReduction: 0 });
    expect(result).toEqual({ amount: 0, dodged: true, blocked: false });
  });

  it('bloqueio reduz dano pela metade', () => {
    const result = applyDefensiveLayers(
      40,
      { dodgeChance: 0, blockChance: 1, damageReduction: 0 },
      () => 0.5,
    );
    expect(result).toEqual({ amount: 20, dodged: false, blocked: true });
  });

  it('redução de dano percentual aplica após bloqueio', () => {
    const result = applyDefensiveLayers(
      100,
      { dodgeChance: 0, blockChance: 0, damageReduction: 0.5 },
      () => 0.5,
    );
    expect(result.amount).toBe(50);
    expect(result.dodged).toBe(false);
    expect(result.blocked).toBe(false);
  });

  it('clamp respeita tetos máximos', () => {
    const clamped = clampDefensiveMitigation({
      dodgeChance: 0.9,
      blockChance: 0.9,
      damageReduction: 0.9,
    });
    expect(clamped.dodgeChance).toBe(MAX_DODGE_CHANCE);
    expect(clamped.blockChance).toBe(MAX_BLOCK_CHANCE);
    expect(clamped.damageReduction).toBe(MAX_DAMAGE_REDUCTION);
  });
});
