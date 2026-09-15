import { describe, expect, it } from 'vitest';
import { enemyMatchesPreferredTags } from './EnemyThemeTags';
import {
  pickCommonForMapPhase,
  unlockedCommonsForGlobalTier,
} from './EnemyTierProgression';

describe('EnemyTierProgression map bias', () => {
  it('Stendra favorece goblin/beast sem esgotar o pool', () => {
    const picks = Array.from({ length: 24 }, (_, offset) =>
      pickCommonForMapPhase('stendra', 8, offset),
    );
    const themed = picks.filter((id) => enemyMatchesPreferredTags(id, ['goblin', 'beast', 'bandit']));
    expect(themed.length).toBeGreaterThan(picks.length / 3);
    expect(new Set(picks).size).toBeGreaterThan(1);
  });

  it('Gruftall favorece fire/goblin/demon', () => {
    const picks = Array.from({ length: 24 }, (_, offset) =>
      pickCommonForMapPhase('gruftall', 60, offset),
    );
    const themed = picks.filter((id) =>
      enemyMatchesPreferredTags(id, ['fire', 'goblin', 'demon']),
    );
    expect(themed.length).toBeGreaterThan(0);
  });

  it('Valdris favorece undead/poison', () => {
    // Tier 150 = powerTier 2 com pool completo (segunda metade do bloco).
    const picks = Array.from({ length: 30 }, (_, offset) =>
      pickCommonForMapPhase('valdris', 150, offset),
    );
    const themed = picks.filter((id) =>
      enemyMatchesPreferredTags(id, ['undead', 'poison', 'shadow']),
    );
    expect(themed.length).toBeGreaterThan(picks.length / 4);
  });

  it('pick determinístico para mesma fase/offset', () => {
    expect(pickCommonForMapPhase('morthaven', 180, 2)).toBe(
      pickCommonForMapPhase('morthaven', 180, 2),
    );
  });

  it('pool desbloqueado permanece misto', () => {
    const pool = unlockedCommonsForGlobalTier(50);
    expect(pool.length).toBeGreaterThanOrEqual(2);
  });
});
