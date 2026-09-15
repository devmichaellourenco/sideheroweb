import { describe, expect, it } from 'vitest';
import { Hero } from '../entities/Hero';
import { getSkillById } from '../progression/SkillCatalog';
import { HeroRequirementEvaluator } from './HeroRequirementEvaluator';

describe('HeroRequirementEvaluator', () => {
  const evaluator = new HeroRequirementEvaluator();

  it('valida requisito de classe', () => {
    const hero = Hero.createStarter('h1', 'priest', 'Elara');
    expect(evaluator.isMet(hero, { type: 'hero_class', heroClass: 'priest' })).toBe(true);
    expect(evaluator.isMet(hero, { type: 'hero_class', heroClass: 'knight' })).toBe(false);
  });

  it('valida requisito de atributo', () => {
    const hero = Hero.createStarter('h1', 'sorcerer', 'Lyra');
    expect(evaluator.isMet(hero, { type: 'attribute', key: 'int', min: 12 })).toBe(true);
    expect(evaluator.isMet(hero, { type: 'attribute', key: 'str', min: 20 })).toBe(false);
  });

  it('descreve requisito de skill com nome do catálogo', () => {
    expect(getSkillById('arcane_bolt')?.name).toBe('Raio Arcano');

    const hero = Hero.createStarter('h1', 'sorcerer', 'Lyra');
    const [req] = evaluator.evaluateAll(hero, [
      { type: 'skill_rank', skillId: 'arcane_bolt', minRank: 1 },
    ]);

    expect(req.label).toBe('Skill Raio Arcano rank 1');
    expect(req.label).not.toContain('arcane_bolt');
  });
});
