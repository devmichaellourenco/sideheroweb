import { describe, expect, it } from 'vitest';
import { getSkillCooldownRatio, renderSkillCooldownOverlay } from './HeroSkillCooldownPresentation';

const readyCooldown = {
  skillId: 'fireball',
  secondsRemaining: 0,
  cooldownTotal: 2,
  ready: true,
  cooldownLabel: '0',
  cooldownRatio: 0,
};

const chargingCooldown = {
  skillId: 'fireball',
  secondsRemaining: 1,
  cooldownTotal: 2,
  ready: false,
  cooldownLabel: '1',
  cooldownRatio: 0.5,
};

describe('getSkillCooldownRatio', () => {
  it('usa ratio pré-calculado do DTO', () => {
    expect(getSkillCooldownRatio(readyCooldown)).toBe(0);
    expect(getSkillCooldownRatio(chargingCooldown)).toBe(0.5);
  });
});

describe('renderSkillCooldownOverlay', () => {
  it('exibe label pré-calculado do DTO', () => {
    const html = renderSkillCooldownOverlay({
      skillId: 'fireball',
      secondsRemaining: 0.75,
      cooldownTotal: 2,
      ready: false,
      cooldownLabel: '1',
      cooldownRatio: 0.375,
    });

    expect(html).toContain('>1<');
    expect(html).not.toContain('0.7');
  });
});
