import { describe, expect, it } from 'vitest';
import { mapCombatStatusEffectIconPath } from './CombatStatusEffectIconMapper';

describe('mapCombatStatusEffectIconPath', () => {
  it('mapeia buff e debuff para paths de assets', () => {
    expect(mapCombatStatusEffectIconPath('buff_attack')).toBe('ui/defense.png');
    expect(mapCombatStatusEffectIconPath('debuff_defense')).toBe('ui/defense.png');
  });

  it('retorna ícone para DOT', () => {
    expect(mapCombatStatusEffectIconPath('dot')).toBe('skills/magic.png');
    expect(mapCombatStatusEffectIconPath('dot', 'fire')).toBe('skills/fireball.png');
  });
});
