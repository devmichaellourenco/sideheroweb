import { describe, expect, it } from 'vitest';
import { CombatState } from '../entities/CombatState';
import { Gear } from '../entities/Gear';
import { Hero } from '../entities/Hero';
import { CombatStatusEffectTracker } from '../services/combat/CombatStatusEffectTracker';
import { trySolerPlegiusCleanse } from './UniqueBattleEffectResolver';

function solerStaff(): Gear {
  return Gear.create({
    id: 'soler',
    name: 'Soler Plégius',
    templateId: 'soler_plegius',
    slot: 'weapon',
    rarity: 'legendary',
    attackBonus: 10,
    defenseBonus: 0,
    healthBonus: 0,
  });
}

describe('UniqueBattleEffectResolver', () => {
  it('purifica aliado e bloqueia debuff na primeira aplicação por batalha', () => {
    const heroes = [Hero.createStarter('h1', 'sorcerer', 'Nix').equip(solerStaff())];
    let tracker = CombatStatusEffectTracker.fromMap({
      'hero:h1': [
        {
          skillId: 'old_dot',
          kind: 'dot',
          magnitude: 5,
          remainingTurns: 2,
          dotElement: 'fire',
        },
      ],
    });
    const combat = CombatState.start(heroes, []);

    const result = trySolerPlegiusCleanse(
      {
        combatantKey: 'hero:h1',
        skillId: 'enemy_debuff',
        kind: 'debuff_defense',
        magnitude: 10,
        durationTurns: 3,
        skillName: 'Enfraquecer',
      },
      heroes,
      combat,
      tracker,
    );

    expect(result.intercepted).toBe(true);
    expect(result.tracker.listFor('hero:h1')).toHaveLength(0);
    expect(result.combat.hasSpentBattleUniqueEffect('soler_plegius_cleanse')).toBe(true);
    expect(result.event).toContain('Soler Plégius');
  });

  it('não intercepta após uso na batalha', () => {
    const heroes = [Hero.createStarter('h1', 'sorcerer', 'Nix').equip(solerStaff())];
    const tracker = CombatStatusEffectTracker.fromMap({});
    const combat = CombatState.start(heroes, []).withSpentBattleUniqueEffect('soler_plegius_cleanse');

    const result = trySolerPlegiusCleanse(
      {
        combatantKey: 'hero:h1',
        skillId: 'enemy_debuff',
        kind: 'debuff_defense',
        magnitude: 10,
        durationTurns: 3,
        skillName: 'Enfraquecer',
      },
      heroes,
      combat,
      tracker,
    );

    expect(result.intercepted).toBe(false);
  });
});
