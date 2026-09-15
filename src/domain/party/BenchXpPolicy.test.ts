import { describe, expect, it } from 'vitest';
import { BenchXpPolicy } from './BenchXpPolicy';

describe('BenchXpPolicy', () => {
  it('aplica 50% do XP da party ativa', () => {
    expect(BenchXpPolicy.benchExperience(100)).toBe(50);
    expect(BenchXpPolicy.benchExperience(99)).toBe(49);
  });

  it('retorna zero para XP não positivo', () => {
    expect(BenchXpPolicy.benchExperience(0)).toBe(0);
    expect(BenchXpPolicy.benchExperience(-10)).toBe(0);
  });
});
