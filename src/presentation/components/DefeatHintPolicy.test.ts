import { describe, expect, it } from 'vitest';
import { EnemyDto } from '../../application/dto/GameStateDto';
import { resolveDefeatHint } from './DefeatHintPolicy';

function enemyWithElements(...elements: Array<string | null>): EnemyDto {
  return {
    combatSkills: elements.map((damageElement, index) => ({
      skillId: `s${index}`,
      skillName: `Skill ${index}`,
      secondsRemaining: 0,
      cooldownTotal: 1,
      ready: true,
      highlight: 'none' as const,
      cooldownLabel: '',
      cooldownRatio: 0,
      damageElement,
      elementLabel: damageElement,
    })),
  } as EnemyDto;
}

describe('resolveDefeatHint', () => {
  it('usa dica genérica sem elementos ofensivos', () => {
    expect(resolveDefeatHint([enemyWithElements('physical', null)])).toMatch(/formação/);
  });

  it('prioriza o elemento mais frequente', () => {
    const hint = resolveDefeatHint([
      enemyWithElements('fire', 'fire'),
      enemyWithElements('cold'),
    ]);
    expect(hint).toContain('Fogo');
  });
});
