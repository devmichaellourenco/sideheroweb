import { describe, expect, it } from 'vitest';
import { CombatStatusEffectTracker } from './CombatStatusEffectTracker';

describe('CombatStatusEffectTracker', () => {
  it('aplica buff e expira após ticks no combatente', () => {
    let tracker = CombatStatusEffectTracker.fromMap({});
    tracker = tracker.apply({
      combatantKey: 'hero:h1',
      skillId: 'blessing',
      kind: 'buff_attack',
      magnitude: 4,
      durationTurns: 2,
    });

    expect(tracker.getAttackBonus('hero:h1')).toBe(4);
    tracker = tracker.tickOnTurnEnd('hero:h1');
    expect(tracker.getAttackBonus('hero:h1')).toBe(4);
    tracker = tracker.tickOnTurnEnd('hero:h1');
    expect(tracker.getAttackBonus('hero:h1')).toBe(0);
  });

  it('renova efeito quando mesma skill é reaplicada', () => {
    let tracker = CombatStatusEffectTracker.fromMap({});
    tracker = tracker.apply({
      combatantKey: 'hero:h1',
      skillId: 'blessing',
      kind: 'buff_attack',
      magnitude: 4,
      durationTurns: 1,
    });
    tracker = tracker.tickOnTurnEnd('hero:h1');
    tracker = tracker.apply({
      combatantKey: 'hero:h1',
      skillId: 'blessing',
      kind: 'buff_attack',
      magnitude: 5,
      durationTurns: 3,
    });

    expect(tracker.listFor('hero:h1')).toEqual([
      expect.objectContaining({ magnitude: 5, remainingTurns: 3 }),
    ]);
  });

  it('remove debuffs e dots preservando buffs', () => {
    let tracker = CombatStatusEffectTracker.fromMap({
      'hero:h1': [
        {
          skillId: 'blessing',
          kind: 'buff_attack',
          magnitude: 4,
          remainingTurns: 2,
        },
        {
          skillId: 'dot',
          kind: 'dot',
          magnitude: 3,
          remainingTurns: 2,
          dotElement: 'fire',
        },
        {
          skillId: 'debuff',
          kind: 'debuff_defense',
          magnitude: 5,
          remainingTurns: 2,
        },
      ],
    });

    tracker = tracker.clearNegativeEffects('hero:h1');

    expect(tracker.listFor('hero:h1')).toEqual([
      expect.objectContaining({ kind: 'buff_attack', magnitude: 4 }),
    ]);
  });
});
