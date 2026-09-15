// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest';
import { AchievementsModalRenderer } from './AchievementsModalRenderer';

describe('AchievementsModalRenderer', () => {
  it('renderiza lista com progresso e estado unlocked/locked', () => {
    const container = document.createElement('div');
    const renderer = new AchievementsModalRenderer();

    renderer.render(
      container,
      [
        {
          id: 'hero_out_of_the_side',
          title: 'Hero - Out of the Side',
          description: 'Clear stage 1-1 for the first time.',
          currentProgress: 1,
          target: 1,
          completed: true,
          completedAt: 1_700_000_000_000,
          progressRatio: 1,
        },
        {
          id: 'future',
          title: 'Stub',
          description: 'Not yet.',
          currentProgress: 0,
          target: 3,
          completed: false,
          completedAt: null,
          progressRatio: 0,
        },
      ],
      { completedCount: 1, totalCount: 2 },
    );

    expect(container.querySelector('.achievements-summary-count')?.textContent).toBe(
      '1/2 desbloqueados',
    );
    expect(container.querySelector('[data-achievement-id="hero_out_of_the_side"]')).toBeTruthy();
    expect(
      container.querySelector('.achievement-card--unlocked .achievement-card-title')?.textContent,
    ).toBe('Hero - Out of the Side');
    expect(container.querySelectorAll('.achievement-card--locked')).toHaveLength(1);
    expect(
      container.querySelector('[data-achievement-id="future"] .achievement-card-progress-label')
        ?.textContent,
    ).toBe('0/3');
  });
});
