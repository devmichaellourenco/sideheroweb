import { describe, expect, it } from 'vitest';
import { applyPhaseBattleOverride } from './PhaseBattleOverrides';
import type { PhaseDefinition } from './PhaseDefinition';

const basePhase: PhaseDefinition = {
  id: '1-1',
  campaignId: 'apprentice',
  mapId: 'stendra',
  displayName: 'Baseline',
  difficultyTier: 1,
  unlocks: [],
  waves: [
    {
      id: 'w1',
      goldMultiplier: 1,
      slots: [{ enemyType: 'goblin_raider', role: 'trash', count: 2 }],
    },
  ],
};

describe('applyPhaseBattleOverride', () => {
  it('retorna a fase original quando override é vazio ou sem waves', () => {
    expect(applyPhaseBattleOverride(basePhase, null)).toBe(basePhase);
    expect(applyPhaseBattleOverride(basePhase, { waves: [] })).toBe(basePhase);
  });

  it('substitui waves e metadados editáveis', () => {
    const next = applyPhaseBattleOverride(basePhase, {
      displayName: 'Override Lab',
      statMultiplier: 1.25,
      waves: [
        {
          id: 'boss',
          goldMultiplier: 1.5,
          slots: [
            { enemyType: 'goblin_raider', role: 'elite', count: 1, displayName: 'Chefe' },
            { enemyType: 'goblin_raider', role: 'trash', count: 3 },
          ],
        },
      ],
    });

    expect(next).not.toBe(basePhase);
    expect(next.displayName).toBe('Override Lab');
    expect(next.statMultiplier).toBe(1.25);
    expect(next.waves).toHaveLength(1);
    expect(next.waves[0].id).toBe('boss');
    expect(next.waves[0].slots).toHaveLength(2);
    expect(next.waves[0].slots[0].displayName).toBe('Chefe');
    expect(next.difficultyTier).toBe(1);
  });
});
