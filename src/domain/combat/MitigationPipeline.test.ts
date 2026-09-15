import { describe, expect, it } from 'vitest';
import { resolveMultiComponentDamage } from './MitigationPipeline';
import { ZERO_ELEMENTAL_DAMAGE } from './ElementalDamageProfile';

describe('MitigationPipeline', () => {
  it('reduz dano elemental por resistência linear', () => {
    const amount = resolveMultiComponentDamage(
      100,
      [{ element: 'fire', delivery: 'projectile', weight: 1 }],
      {
        armor: 0,
        stageLevel: 1,
        resistances: { fire: 25, cold: 0, lightning: 0, air: 0, allElemental: 0 },
      },
    );

    expect(amount).toBe(75);
  });

  it('aplica armadura só ao componente físico', () => {
    const amount = resolveMultiComponentDamage(
      100,
      [
        { element: 'fire', delivery: 'aoe', weight: 0.5 },
        { element: 'physical', delivery: 'melee', weight: 0.5 },
      ],
      {
        armor: 40,
        stageLevel: 1,
        resistances: { fire: 0, cold: 0, lightning: 0, air: 0, allElemental: 0 },
      },
    );

    expect(amount).toBeGreaterThan(1);
    expect(amount).toBeLessThan(100);
  });

  it('amplifica dano elemental com bônus do atacante', () => {
    const baseline = resolveMultiComponentDamage(
      100,
      [{ element: 'fire', delivery: 'projectile', weight: 1 }],
      {
        armor: 0,
        stageLevel: 1,
        resistances: { fire: 0, cold: 0, lightning: 0, air: 0, allElemental: 0 },
      },
    );
    const boosted = resolveMultiComponentDamage(
      100,
      [{ element: 'fire', delivery: 'projectile', weight: 1 }],
      {
        armor: 0,
        stageLevel: 1,
        resistances: { fire: 0, cold: 0, lightning: 0, air: 0, allElemental: 0 },
      },
      { fire: 20, cold: 0, lightning: 0, air: 0, allElemental: 0 },
    );

    expect(boosted).toBeGreaterThan(baseline);
    expect(boosted).toBe(120);
  });

  it('adiciona dano elemental flat antes da mitigação', () => {
    const amount = resolveMultiComponentDamage(
      50,
      [{ element: 'fire', delivery: 'projectile', weight: 1 }],
      {
        armor: 0,
        stageLevel: 1,
        resistances: { fire: 0, cold: 0, lightning: 0, air: 0, allElemental: 0 },
      },
      ZERO_ELEMENTAL_DAMAGE,
      { fire: 8, cold: 0, lightning: 0, air: 0 },
    );

    expect(amount).toBe(58);
  });

  it('ignora parte da resistência de fogo com penetração', () => {
    const baseline = resolveMultiComponentDamage(
      100,
      [{ element: 'fire', delivery: 'projectile', weight: 1 }],
      {
        armor: 0,
        stageLevel: 1,
        resistances: { fire: 40, cold: 0, lightning: 0, air: 0, allElemental: 0 },
      },
    );
    const penetrated = resolveMultiComponentDamage(
      100,
      [{ element: 'fire', delivery: 'projectile', weight: 1 }],
      {
        armor: 0,
        stageLevel: 1,
        resistances: { fire: 40, cold: 0, lightning: 0, air: 0, allElemental: 0 },
      },
      ZERO_ELEMENTAL_DAMAGE,
      { fire: 0, cold: 0, lightning: 0, air: 0 },
      0,
      { fire: 30, cold: 0, lightning: 0, air: 0, allElemental: 0 },
    );

    expect(baseline).toBe(60);
    expect(penetrated).toBeGreaterThan(baseline);
    expect(penetrated).toBe(72);
  });
});
