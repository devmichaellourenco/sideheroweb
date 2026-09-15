// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { GameStateDto } from '../../application/dto/GameStateDto';
import { patchBattleStripInPlace, shouldUseCrowdedBattleStrip } from './BattleStripPatcher';

describe('shouldUseCrowdedBattleStrip', () => {
  it('mantém layout grande independente da quantidade de combatentes', () => {
    expect(shouldUseCrowdedBattleStrip(3, 2)).toBe(false);
    expect(shouldUseCrowdedBattleStrip(2, 3)).toBe(false);
    expect(shouldUseCrowdedBattleStrip(3, 1)).toBe(false);
    expect(shouldUseCrowdedBattleStrip(2, 1)).toBe(false);
  });
});

describe('patchBattleStripInPlace', () => {
  it('reseta action time ao trocar de fase mesmo com timers congelados', () => {
    document.body.innerHTML = `
      <div id="heroes">
        <div class="battle-actor-card hero-battle-card" data-hero-id="h1">
          <div class="health-bar"><div class="health-fill" style="width:50%"></div></div>
          <div data-action-time-bar data-at-remaining="0.5" data-at-total="2">
            <div class="action-time-fill" style="width:75%"></div>
          </div>
        </div>
      </div>
      <div id="enemies"></div>
    `;

    const heroes = document.getElementById('heroes') as HTMLElement;
    const enemies = document.getElementById('enemies') as HTMLElement;

    const state = {
      activeParty: [
        {
          id: 'h1',
          health: 100,
          maxHealth: 100,
          actionTimeRatio: 1,
          actionTimeRemaining: 0,
          actionTimeTotal: 0,
          statusEffects: [],
          combatSkills: [],
        },
      ],
      enemies: [],
      phaseRun: null,
      canEditParty: false,
      battlePaused: false,
      combatIntermission: { variant: 'phase-clear' },
      activeTurn: null,
      campaignProgress: { selectedPhaseId: '1-3' },
    } as unknown as GameStateDto;

    patchBattleStripInPlace(state, heroes, enemies, { forceResetActionTime: true });

    const fill = heroes.querySelector('.action-time-fill') as HTMLElement;
    expect(fill.style.width).toBe('100%');
    expect(heroes.querySelector('[data-action-time-bar]')?.getAttribute('data-at-remaining')).toBeNull();
  });

  it('mantém action time congelado entre waves da mesma fase', () => {
    document.body.innerHTML = `
      <div id="heroes">
        <div class="battle-actor-card hero-battle-card" data-hero-id="h1">
          <div class="health-bar"><div class="health-fill" style="width:50%"></div></div>
          <div data-action-time-bar data-at-remaining="0.5" data-at-total="2">
            <div class="action-time-fill" style="width:75%"></div>
          </div>
        </div>
      </div>
      <div id="enemies"></div>
    `;

    const heroes = document.getElementById('heroes') as HTMLElement;
    const enemies = document.getElementById('enemies') as HTMLElement;

    const state = {
      activeParty: [
        {
          id: 'h1',
          health: 100,
          maxHealth: 100,
          actionTimeRatio: 1,
          actionTimeRemaining: 0,
          actionTimeTotal: 0,
          statusEffects: [],
          combatSkills: [],
        },
      ],
      enemies: [],
      phaseRun: { phaseId: '1-2', waveIndex: 1 },
      canEditParty: false,
      battlePaused: false,
      combatIntermission: { variant: 'wave-clear' },
      activeTurn: null,
      campaignProgress: { selectedPhaseId: '1-2' },
    } as unknown as GameStateDto;

    patchBattleStripInPlace(state, heroes, enemies, { forceResetActionTime: false });

    const fill = heroes.querySelector('.action-time-fill') as HTMLElement;
    expect(fill.style.width).toBe('75%');
  });
});
