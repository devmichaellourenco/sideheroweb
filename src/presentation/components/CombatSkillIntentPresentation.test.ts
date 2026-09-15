import { describe, expect, it } from 'vitest';
import { renderCombatSkillBar } from './CombatSkillIntentPresentation';

describe('CombatSkillIntentPresentation', () => {
  it('renderiza todas as skills com slots de cooldown', () => {
    const html = renderCombatSkillBar([
      {
        skillId: 'fireball',
        skillName: 'Bola de Fogo',
        secondsRemaining: 0,
        cooldownTotal: 3,
        ready: true,
        highlight: 'next',
        cooldownLabel: '0',
        cooldownRatio: 0,
      },
      {
        skillId: 'arcane_bolt',
        skillName: 'Raio Arcano',
        secondsRemaining: 1.5,
        cooldownTotal: 3,
        ready: false,
        highlight: 'none',
        cooldownLabel: '2',
        cooldownRatio: 0.5,
      },
    ]);

    expect(html).toContain('data-combat-skill-bar');
    expect(html).toContain('data-skill-id="fireball"');
    expect(html).toContain('data-skill-id="arcane_bolt"');
    expect(html).toContain('combat-skill-slot--next');
    expect(html).toContain('combat-skill-slot--cooldown');
    expect(html).not.toContain('combat-skill-cooldown-label');
  });
});
