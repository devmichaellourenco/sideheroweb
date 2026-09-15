import { describe, expect, it } from 'vitest';
import { Enemy } from '../../entities/Enemy';
import { Hero } from '../../entities/Hero';
import { Stats } from '../../value-objects/Stats';
import { CombatSkillDefinition } from '../../progression/combat/CombatSkillDefinition';
import { SkillTargetResolver } from './SkillTargetResolver';

function singleEnemySkill(
  overrides: Partial<CombatSkillDefinition> = {},
): CombatSkillDefinition {
  return {
    skillId: 'test_skill',
    kind: 'damage',
    targetPool: 'enemies',
    targetScope: 'single',
    targetPriority: 'lowest_hp_percent',
    usePriority: 50,
    initialCooldown: 0,
    cooldownTurns: 0,
    basePower: 10,
    powerPerRank: 0,
    attributeFactor: 1,
    ...overrides,
  };
}

describe('SkillTargetResolver', () => {
  it('usa alvo prioritário quando o roll está dentro do percentual', () => {
    const resolver = new SkillTargetResolver(() => 0.5);
    const weak = Enemy.restore({
      ...Enemy.forStage(1).toProps(),
      id: 'weak',
      stats: Stats.create({ attack: 10, defense: 4, maxHealth: 60, currentHealth: 10 }),
    });
    const tough = Enemy.restore({
      ...Enemy.forStage(2).toProps(),
      id: 'tough',
    });

    const targets = resolver.resolveEnemyTargets(
      singleEnemySkill({ targetPriorityPercent: 80 }),
      [weak, tough],
    );

    expect(targets).toEqual(['weak']);
  });

  it('escolhe outro alvo quando o roll excede o percentual', () => {
    const resolver = new SkillTargetResolver(() => 0.95);
    const weak = Enemy.restore({
      ...Enemy.forStage(1).toProps(),
      id: 'weak',
      stats: Stats.create({ attack: 10, defense: 4, maxHealth: 60, currentHealth: 10 }),
    });
    const tough = Enemy.restore({
      ...Enemy.forStage(2).toProps(),
      id: 'tough',
    });

    const targets = resolver.resolveEnemyTargets(
      singleEnemySkill({ targetPriorityPercent: 80 }),
      [weak, tough],
    );

    expect(targets).toEqual(['tough']);
  });

  it('cura continua mirando no aliado mais ferido com alta confiança', () => {
    const resolver = new SkillTargetResolver(() => 0.5);
    const priest = Hero.createStarter('p1', 'priest', 'Elara');
    const knight = Hero.restore({
      ...Hero.createStarter('k1', 'knight', 'Galneon').toProps(),
      currentHealth: 12,
    });

    const targets = resolver.resolveHeroTargets(
      {
        skillId: 'minor_heal',
        kind: 'heal_ally',
        targetPool: 'heroes',
        targetScope: 'single',
        targetPriority: 'lowest_hp_percent',
        targetPriorityPercent: 95,
        usePriority: 100,
        initialCooldown: 0,
        cooldownTurns: 0,
        basePower: 12,
        powerPerRank: 0,
        attributeFactor: 1,
      },
      [priest, knight],
      priest.id,
    );

    expect(targets).toEqual(['k1']);
  });
});
