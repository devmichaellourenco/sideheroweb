import { describe, expect, it } from 'vitest';
import { Hero } from '../../entities/Hero';
import { Enemy } from '../../entities/Enemy';
import { SkillCooldownTracker } from './SkillCooldownTracker';
import { CombatSkillIntentResolver } from './CombatSkillIntentResolver';

describe('CombatSkillIntentResolver', () => {
  const resolver = new CombatSkillIntentResolver();

  it('expõe próxima skill do goblin e skills em recarga', () => {
    const goblin = Enemy.restore({
      ...Enemy.forStage(2).toProps(),
      id: 'goblin-1',
      enemyType: 'goblin_raider',
      name: 'Goblin Lv.2',
    });
    const hero = Hero.createStarter('h1', 'knight', 'Galneon');
    const cooldowns = SkillCooldownTracker.fromMap({
      'enemy:goblin-1': { goblin_stab: 2 },
    });

    const intent = resolver.resolveForEnemy(goblin, [hero], [goblin], cooldowns);

    expect(intent?.nextSkillName).toBe('Ataque Básico');
    expect(intent?.nextSkillId).toBe('basic_attack');
    expect(intent?.chargingSkills).toEqual([
      { skillId: 'goblin_stab', skillName: 'Facada', secondsRemaining: 2 },
    ]);
  });

  it('telegrafa baforada do dragão quando pronta', () => {
    const dragon = Enemy.restore({
      ...Enemy.forStage(5).toProps(),
      id: 'dragon-1',
      enemyType: 'young_green_dragon',
      name: 'Dragon Lv.5',
    });
    const hero = Hero.createStarter('h1', 'knight', 'Galneon');
    const cooldowns = SkillCooldownTracker.fromMap({});

    const intent = resolver.resolveForEnemy(dragon, [hero], [dragon], cooldowns);

    expect(intent?.nextSkillName).toBe('Baforada');
    expect(intent?.nextSkillId).toBe('dragon_breath');
    expect(intent?.chargingSkills.some((entry) => entry.skillName === 'Baforada')).toBe(false);
  });
});
