import { describe, expect, it } from 'vitest';
import {
  mitigatePhysicalDamage,
  resolveOutgoingDamage,
  resolveOutgoingPhysicalDamage,
  rollCriticalMultiplier,
} from './CombatDamageResolver';

describe('CombatDamageResolver', () => {
  it('aplica redução de armadura com diminishing returns', () => {
    const mitigated = mitigatePhysicalDamage(20, 45, 1);
    expect(mitigated).toBeGreaterThan(1);
    expect(mitigated).toBeLessThan(20);
  });

  it('garante dano mínimo de 1', () => {
    const mitigated = mitigatePhysicalDamage(5, 500, 50);
    expect(mitigated).toBeGreaterThanOrEqual(1);
    expect(mitigated).toBeLessThan(5);
  });

  it('aplica crítico quando rng está abaixo da chance (escala 0–100)', () => {
    const result = rollCriticalMultiplier(0.5, 1.8, { rng: () => 0.49 });
    expect(result.isCrit).toBe(true);
    expect(result.multiplier).toBe(1.8);
  });

  it('não aplica crítico quando rng está na ou acima da chance', () => {
    const result = rollCriticalMultiplier(0.5, 1.8, { rng: () => 0.5 });
    expect(result.isCrit).toBe(false);
    expect(result.multiplier).toBe(1);
  });

  it('resolve dano final com perfil de atacante', () => {
    const result = resolveOutgoingPhysicalDamage(
      20,
      8,
      5,
      { attackSpeed: 1, castSpeed: 1, cooldownReduction: 0, critChance: 1, critDamage: 1.5 },
      { rng: () => 0 },
    );

    expect(result.isCrit).toBe(true);
    expect(result.amount).toBeGreaterThan(1);
  });

  it('resolve dano multi-elemento somando componentes', () => {
    const result = resolveOutgoingDamage(
      100,
      [
        { element: 'fire', delivery: 'aoe', weight: 0.85 },
        { element: 'physical', delivery: 'aoe', weight: 0.15 },
      ],
      { armor: 10, stageLevel: 1, resistances: { fire: 50, cold: 0, lightning: 0, air: 0, allElemental: 0 } },
      { attackSpeed: 1, castSpeed: 1, cooldownReduction: 0, critChance: 0, critDamage: 1.4 },
    );

    expect(result.amount).toBeGreaterThan(1);
    expect(result.amount).toBeLessThan(100);
    expect(result.dodged).toBe(false);
    expect(result.blocked).toBe(false);
  });

  it('dodge anula dano final após mitigação por componente', () => {
    const result = resolveOutgoingDamage(
      30,
      [{ element: 'physical', delivery: 'melee', weight: 1 }],
      {
        armor: 5,
        stageLevel: 1,
        resistances: { fire: 0, cold: 0, lightning: 0, air: 0, allElemental: 0 },
        defensive: { dodgeChance: 1, blockChance: 0, damageReduction: 0 },
      },
      { attackSpeed: 1, castSpeed: 1, cooldownReduction: 0, critChance: 0, critDamage: 1.4 },
    );

    expect(result.amount).toBe(0);
    expect(result.dodged).toBe(true);
  });
});
