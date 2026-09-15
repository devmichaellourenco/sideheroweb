import { describe, expect, it } from 'vitest';
import { HANDCRAFTED_PHASES } from './HandcraftedPhaseCatalog';
import {
  MAX_ENEMIES_PER_WAVE,
  capWaveToMaxEnemies,
  countWaveEnemies,
} from './WaveEnemyCap';
import { WaveDefinition } from './WaveDefinition';

describe('WaveEnemyCap', () => {
  it('reduz trash antes de elite/boss até o máximo', () => {
    const wave: WaveDefinition = {
      id: 'w1',
      goldMultiplier: 1,
      slots: [
        { enemyType: 'goblin_raider', role: 'trash', count: 3 },
        { enemyType: 'gray_wolf', role: 'trash', count: 2 },
        { enemyType: 'bandit_captain', role: 'elite', count: 1 },
      ],
    };

    const capped = capWaveToMaxEnemies(wave);
    expect(countWaveEnemies(capped)).toBe(MAX_ENEMIES_PER_WAVE);
    expect(capped.slots.some((slot) => slot.role === 'elite')).toBe(true);
  });

  it('nenhuma wave do catálogo excede o máximo', () => {
    for (const phase of HANDCRAFTED_PHASES) {
      for (const wave of phase.waves) {
        expect(
          countWaveEnemies(wave),
          `${phase.id}/${wave.id}`,
        ).toBeLessThanOrEqual(MAX_ENEMIES_PER_WAVE);
      }
    }
  });
});
