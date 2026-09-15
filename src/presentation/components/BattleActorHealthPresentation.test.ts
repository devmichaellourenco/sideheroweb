// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import {
  clearActionTimeAnimationStamp,
  patchActionTimeBar,
  renderStripActorBars,
} from './BattleActorHealthPresentation';

describe('renderStripActorBars', () => {
  it('renderiza barra de vida e barra de tempo de ação com countdown', () => {
    const html = renderStripActorBars({
      side: 'hero',
      healthLabel: '80/100',
      healthCurrent: '80',
      healthPercent: 80,
      actionTimeRatio: 0.4,
      actionTimeRemaining: 1.2,
      actionTimeTotal: 2,
      attackSpeed: 0.5,
    });

    expect(html).toContain('strip-actor-bars');
    expect(html).toContain('data-action-time-bar');
    expect(html).toContain('strip-health-label');
    expect(html).toContain('strip-action-time-label');
    expect(html).toContain('>80<');
    expect(html).not.toContain('>80/100<');
    expect(html).toContain('data-bar-label="80/100"');
    expect(html).toContain('ASPD 0.50/s');
    expect(html).toContain('TTA = 1 ÷ 0.50 = 2.00s');
    expect(html).toContain('width: 40%');
    expect(html).toContain('data-at-attack-speed="0.5"');
  });
});

describe('patchActionTimeBar', () => {
  it('remove stamps de animação quando congelado sem alterar largura', () => {
    document.body.innerHTML = `
      <div class="battle-actor-card">
        <div data-action-time-bar data-at-remaining="1" data-at-total="2" data-at-captured-at="0" data-at-attack-speed="0.5">
          <div class="action-time-fill" style="width:10%"></div>
          <span class="strip-action-time-label">1</span>
        </div>
      </div>
    `;
    const card = document.body.querySelector('.battle-actor-card') as HTMLElement;
    patchActionTimeBar(card, 0.5, 1, 2, true, false, 0.5);
    const bar = card.querySelector('[data-action-time-bar]') as HTMLElement;
    expect(bar.dataset.atRemaining).toBeUndefined();
    expect((bar.querySelector('.action-time-fill') as HTMLElement).style.width).toBe('10%');
    clearActionTimeAnimationStamp(bar);
  });

  it('aplica largura do DTO quando congelado com applyWidth', () => {
    document.body.innerHTML = `
      <div class="battle-actor-card">
        <div data-action-time-bar data-at-remaining="1" data-at-total="2" data-at-captured-at="0" data-at-attack-speed="1">
          <div class="action-time-fill" style="width:10%"></div>
          <span class="strip-action-time-label">1</span>
        </div>
      </div>
    `;
    const card = document.body.querySelector('.battle-actor-card') as HTMLElement;
    patchActionTimeBar(card, 1, 0, 0, true, true, 1);
    const bar = card.querySelector('[data-action-time-bar]') as HTMLElement;
    expect(bar.dataset.atRemaining).toBeUndefined();
    expect((bar.querySelector('.action-time-fill') as HTMLElement).style.width).toBe('100%');
    expect(bar.querySelector('.strip-action-time-label')?.textContent).toBe('');
  });
});
