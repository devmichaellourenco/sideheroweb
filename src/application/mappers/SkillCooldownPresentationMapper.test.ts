import { describe, expect, it } from 'vitest';
import { mapSkillCooldownPresentation } from './SkillCooldownPresentationMapper';

describe('mapSkillCooldownPresentation', () => {
  it('zera ratio e label quando pronta', () => {
    expect(mapSkillCooldownPresentation(0, 3, true)).toEqual({
      cooldownLabel: '0',
      cooldownRatio: 0,
    });
  });

  it('calcula ratio e exibe décimos abaixo de 10 s', () => {
    expect(mapSkillCooldownPresentation(1.5, 3, false)).toEqual({
      cooldownLabel: '1.5',
      cooldownRatio: 0.5,
    });
  });

  it('trata cooldown total zero como pronta visualmente', () => {
    expect(mapSkillCooldownPresentation(0, 0, false)).toEqual({
      cooldownLabel: '0',
      cooldownRatio: 0,
    });
  });
});
