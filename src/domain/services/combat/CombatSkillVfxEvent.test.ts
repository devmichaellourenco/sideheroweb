import { describe, expect, it } from 'vitest';
import { CombatAction } from './CombatAction';
import { createSkillVfxEvent } from './CombatSkillVfxEvent';

describe('createSkillVfxEvent', () => {
  it('cria melee para basic_attack em inimigo', () => {
    const action: CombatAction = {
      skillId: 'basic_attack',
      skillName: 'Ataque',
      kind: 'damage',
      targeting: 'single_enemy',
      power: 5,
      targetEnemyId: 'e1',
      damageComponents: [{ element: 'physical', delivery: 'melee', weight: 1 }],
    };

    expect(createSkillVfxEvent('basic_attack', 'hero', 'h1', action)).toEqual({
      skillId: 'basic_attack',
      vfxKind: 'melee',
      attackerSide: 'hero',
      attackerId: 'h1',
      targetSide: 'enemy',
      targetId: 'e1',
    });
  });

  it('cria projétil para fireball em inimigo', () => {
    const action: CombatAction = {
      skillId: 'fireball',
      skillName: 'Bola de Fogo',
      kind: 'damage',
      targeting: 'single_enemy',
      power: 20,
      targetEnemyId: 'e1',
      damageComponents: [{ element: 'fire', delivery: 'projectile', weight: 1 }],
    };

    expect(createSkillVfxEvent('fireball', 'hero', 'h1', action)).toEqual({
      skillId: 'fireball',
      vfxKind: 'projectile',
      attackerSide: 'hero',
      attackerId: 'h1',
      targetSide: 'enemy',
      targetId: 'e1',
    });
  });

  it('cria aoe para blizzard em inimigos', () => {
    const action: CombatAction = {
      skillId: 'blizzard',
      skillName: 'Nevasca',
      kind: 'damage',
      targeting: 'all_enemies',
      power: 20,
      targetEnemyIds: ['e1', 'e2'],
      damageComponents: [{ element: 'cold', delivery: 'aoe', weight: 1 }],
    };

    expect(createSkillVfxEvent('blizzard', 'hero', 'h1', action)).toEqual({
      skillId: 'blizzard',
      vfxKind: 'aoe',
      attackerSide: 'hero',
      attackerId: 'h1',
      targetSide: 'enemy',
      targetId: 'e1',
    });
  });

  it('cria aura no caster para blessing', () => {
    const action: CombatAction = {
      skillId: 'blessing',
      skillName: 'Bênção',
      kind: 'buff_attack',
      targeting: 'all_allies',
      power: 4,
      targetHeroIds: ['h1', 'h2'],
    };

    expect(createSkillVfxEvent('blessing', 'hero', 'p1', action)).toEqual({
      skillId: 'blessing',
      vfxKind: 'aoe',
      attackerSide: 'hero',
      attackerId: 'p1',
      targetSide: 'hero',
      targetId: 'h1',
    });
  });
});
