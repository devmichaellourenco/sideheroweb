import { describe, expect, it } from 'vitest';
import {
  applyMitigatedDotTicks,
  resolveDotTickDamage,
} from './DotTickResolver';
import { buildMitigationTarget } from './CombatDamageResolver';
import { ZERO_RESISTANCES } from '../../combat/ResistanceProfile';

describe('DotTickResolver', () => {
  it('mitiga DOT de fogo com resistência do alvo', () => {
    const target = buildMitigationTarget(0, 1, {
      fire: 50,
      cold: 0,
      lightning: 0,
      air: 0,
      allElemental: 0,
    });

    const resolved = resolveDotTickDamage(10, 'fire', target, 1);

    expect(resolved.dodged).toBe(false);
    expect(resolved.amount).toBeLessThan(10);
    expect(resolved.amount).toBeGreaterThan(0);
  });

  it('DOT de gelo usa resistência de gelo', () => {
    const lowResist = resolveDotTickDamage(
      8,
      'cold',
      buildMitigationTarget(0, 1, {
        fire: 0,
        cold: 0,
        lightning: 0,
        air: 0,
        allElemental: 0,
      }),
      1,
    );
    const highResist = resolveDotTickDamage(
      8,
      'cold',
      buildMitigationTarget(0, 1, {
        fire: 0,
        cold: 40,
        lightning: 0,
        air: 0,
        allElemental: 0,
      }),
      1,
    );

    expect(highResist.amount).toBeLessThan(lowResist.amount);
  });

  it('esquiva anula tick de DOT', () => {
    const target = buildMitigationTarget(0, 1, ZERO_RESISTANCES, {
      dodgeChance: 1,
      blockChance: 0,
      damageReduction: 0,
    });

    const resolved = resolveDotTickDamage(12, 'fire', target, 1);

    expect(resolved.dodged).toBe(true);
    expect(resolved.amount).toBe(0);
  });

  it('batch soma ticks mitigados por elemento', () => {
    const target = buildMitigationTarget(0, 1, {
      fire: 0,
      cold: 25,
      lightning: 0,
      air: 0,
      allElemental: 0,
    });

    const batch = applyMitigatedDotTicks(
      [
        { magnitude: 6, dotElement: 'fire' },
        { magnitude: 6, dotElement: 'cold' },
      ],
      target,
      1,
    );

    expect(batch.totalDamage).toBeGreaterThan(0);
    expect(batch.primaryElement).toBe('fire');
  });

  it('DOT sem elemento explícito usa air', () => {
    const resolved = resolveDotTickDamage(10, undefined, buildMitigationTarget(0, 1, ZERO_RESISTANCES), 1);
    expect(resolved.amount).toBeGreaterThan(0);

    const batch = applyMitigatedDotTicks([{ magnitude: 5 }], buildMitigationTarget(0, 1, ZERO_RESISTANCES), 1);
    expect(batch.primaryElement).toBe('air');
  });
});
