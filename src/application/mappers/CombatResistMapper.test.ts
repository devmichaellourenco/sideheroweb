import { describe, expect, it } from 'vitest';
import { formatCombatResistTooltipLine, formatCombatWeaknessTooltipLine, mapCombatResistSummary } from './CombatResistMapper';

describe('CombatResistMapper', () => {
  it('agrega all-elemental nas resistências efetivas', () => {
    const summary = mapCombatResistSummary({
      fire: 10,
      cold: 0,
      lightning: 0,
      air: 0,
      allElemental: 5,
    });

    expect(summary.fire).toBe(15);
    expect(summary.cold).toBe(5);
  });

  it('formata linha compacta para tooltip', () => {
    const line = formatCombatResistTooltipLine({
      fire: 12,
      cold: 0,
      lightning: 8,
      air: 0,
    });

    expect(line).toBe('Resiste: Fogo −12% dano · Raio −8% dano');
  });

  it('retorna null quando não há resistências', () => {
    expect(
      formatCombatResistTooltipLine({
        fire: 0,
        cold: 0,
        lightning: 0,
        air: 0,
      }),
    ).toBeNull();
  });

  it('formata fraquezas negativas', () => {
    const line = formatCombatWeaknessTooltipLine({
      fire: 0,
      cold: -20,
      lightning: 0,
      air: 0,
    });

    expect(line).toBe('Vulnerável: Gelo +20% dano');
  });
});
