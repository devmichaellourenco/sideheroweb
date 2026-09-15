import { describe, expect, it } from 'vitest';
import { Hero } from '../entities/Hero';
import { Experience } from '../value-objects/Experience';
import { SkillService } from './SkillService';

describe('SkillService — alocação de rank', () => {
  const service = new SkillService();

  it('permite +1 rank quando status é owned e há pontos', () => {
    const hero = Hero.restore({
      ...Hero.createStarter('k1', 'knight', 'Galneon').toProps(),
      experience: Experience.restore(0, 100, 5),
      allocatedAttributes: { str: 10, dex: 5, int: 5 },
      skillRanks: { power_attack: 1 },
      unspentImprovementPoints: 2,
    });

    const tree = service.buildTree(hero, 3);
    const powerAttack = tree.find((node) => node.definition.id === 'power_attack');

    expect(powerAttack?.status).toBe('owned');
    expect(powerAttack?.canAllocateRank).toBe(true);
  });

  it('bloqueia investimento quando só existe o slot fixo de Ataque Básico', () => {
    const hero = Hero.restore({
      ...Hero.createStarter('k1', 'knight', 'Galneon').toProps(),
      experience: Experience.restore(0, 100, 5),
      allocatedAttributes: { str: 10, dex: 5, int: 5 },
      unspentImprovementPoints: 2,
    });

    const tree = service.buildTree(hero, 1);
    const powerAttack = tree.find((node) => node.definition.id === 'power_attack');

    expect(powerAttack?.canAllocateRank).toBe(false);
    expect(() => service.allocate(hero, 'power_attack', 1)).toThrow(
      'Não é possível investir nesta skill',
    );
  });
});
