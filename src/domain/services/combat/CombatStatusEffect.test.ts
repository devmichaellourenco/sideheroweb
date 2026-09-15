import { describe, expect, it } from 'vitest';
import { statusEffectLabel, statusEffectTooltip } from './CombatStatusEffect';

describe('CombatStatusEffect labels', () => {
  it('formata magnitude decimal no tooltip de buff', () => {
    const effect = {
      skillId: 'blessing',
      kind: 'buff_attack' as const,
      magnitude: 11.3,
      remainingTurns: 3,
    };

    expect(statusEffectLabel(effect)).toBe('ATK+11.3');
    expect(statusEffectTooltip(effect)).toBe('ATK+11.3 · 3 turnos restantes');
  });

  it('formata debuff com turno singular', () => {
    const effect = {
      skillId: 'wraith_curse',
      kind: 'debuff_defense' as const,
      magnitude: 8,
      remainingTurns: 1,
    };

    expect(statusEffectLabel(effect)).toBe('DEF-8');
    expect(statusEffectTooltip(effect)).toBe('DEF-8 · 1 turno restante');
  });

  it('formata heal_block como debuff persistente', () => {
    const effect = {
      skillId: 'vorpal_lupnus_heal_block',
      kind: 'heal_block' as const,
      magnitude: 0,
      remainingTurns: 999,
    };

    expect(statusEffectLabel(effect)).toBe('Cura bloqueada');
    expect(statusEffectTooltip(effect)).toBe('Cura bloqueada · dura até o fim da batalha');
  });
});
