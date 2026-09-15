import { describe, expect, it } from 'vitest';
import { emptyBattleSessionStats } from '../../domain/combat/BattleSessionStats';
import { Hero } from '../../domain/entities/Hero';
import { mapBattleSessionStats } from './BattleSessionStatsMapper';

describe('mapBattleSessionStats', () => {
  it('anexa recarga e tooltip de cálculo em cada skill', () => {
    const hero = Hero.restore({
      ...Hero.createStarter('h1', 'sorcerer', 'Nix').toProps(),
      skillRanks: { fireball: 1 },
      equippedSkillIds: ['basic_attack', 'fireball'],
    });

    const stats = emptyBattleSessionStats();
    stats.skills['h1:fireball'] = {
      heroId: 'h1',
      skillId: 'fireball',
      uses: 2,
      damageDealt: 40,
      healingDone: 0,
    };

    const dto = mapBattleSessionStats(stats, [hero]);
    const fireball = dto.skills.find((entry) => entry.skillId === 'fireball');

    expect(fireball?.cooldownLabel).toMatch(/\d/);
    expect(fireball?.cooldownTooltip).toContain('turns ×');
    expect(fireball?.cooldownTooltip).toContain('Recarga efetiva');
  });
});
