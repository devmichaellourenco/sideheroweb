// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  SkillCooldownDisplayAnimator,
  shouldAnimateBattleStripTimers,
  stampSkillCooldownOverlay,
} from './SkillCooldownDisplayAnimator';
import { stampActionTimeBar } from './BattleActorHealthPresentation';

describe('shouldAnimateBattleStripTimers', () => {
  const base = {
    phaseRun: { phaseId: '1-1' },
    canEditParty: false,
    battlePaused: false,
    combatIntermission: null,
  };

  it('ativa com fase em combate', () => {
    expect(shouldAnimateBattleStripTimers(base)).toBe(true);
  });

  it('desativa com battlePaused', () => {
    expect(shouldAnimateBattleStripTimers({ ...base, battlePaused: true })).toBe(false);
  });

  it('desativa no acampamento', () => {
    expect(shouldAnimateBattleStripTimers({ ...base, canEditParty: true })).toBe(false);
  });

  it('desativa na intermissão', () => {
    expect(
      shouldAnimateBattleStripTimers({ ...base, combatIntermission: { variant: 'wave-clear' } }),
    ).toBe(false);
  });
});

describe('SkillCooldownDisplayAnimator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('congela action time e cooldown quando combate fica inativo', () => {
    document.body.innerHTML = `
      <div data-action-time-bar>
        <div class="action-time-fill" style="width:50%"></div>
      </div>
      <span class="combat-skill-cooldown">
        <span class="combat-skill-cooldown-shade"></span>
      </span>
    `;

    const bar = document.querySelector('[data-action-time-bar]') as HTMLElement;
    const overlay = document.querySelector('.combat-skill-cooldown') as HTMLElement;
    stampActionTimeBar(bar, 2, 4);
    stampSkillCooldownOverlay(overlay, 3, 6);

    const animator = new SkillCooldownDisplayAnimator();
    animator.setCombatActive(true);
    vi.advanceTimersByTime(500);

    const fillWidthWhileActive = (bar.querySelector('.action-time-fill') as HTMLElement).style.width;
    const shadeRatioWhileActive = overlay
      .querySelector('.combat-skill-cooldown-shade')!
      .getAttribute('style');

    animator.setCombatActive(false);
    vi.advanceTimersByTime(2000);

    const fillWidthWhilePaused = (bar.querySelector('.action-time-fill') as HTMLElement).style.width;
    const shadeRatioWhilePaused = overlay
      .querySelector('.combat-skill-cooldown-shade')!
      .getAttribute('style');

    expect(fillWidthWhileActive).not.toBe('50%');
    expect(fillWidthWhilePaused).toBe(fillWidthWhileActive);
    expect(shadeRatioWhilePaused).toBe(shadeRatioWhileActive);
  });
});
