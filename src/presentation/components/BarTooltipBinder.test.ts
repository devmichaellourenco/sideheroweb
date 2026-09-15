// @vitest-environment happy-dom

import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { bindBarTooltips, hideBarTooltip } from './BarTooltipBinder';

describe('BarTooltipBinder', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    hideBarTooltip();
    document.body.innerHTML = '';
  });

  it('exibe ícone de XP antes do valor no tooltip da barra', () => {
    document.body.innerHTML = `
      <div id="root">
        <div
          class="stat-bar xp-bar"
          data-bar-label="12/100"
          data-bar-icon="./assets/ui/xp.png"
        ></div>
      </div>
    `;

    const root = document.getElementById('root')!;
    bindBarTooltips(root);

    const bar = root.querySelector('.xp-bar') as HTMLElement;
    bar.dispatchEvent(new Event('mouseenter'));

    const portal = document.getElementById('bar-tooltip-portal');
    expect(portal).not.toBeNull();
    expect(portal?.classList.contains('hidden')).toBe(false);
    expect(portal?.querySelector('.bar-tooltip-icon')?.getAttribute('src')).toContain('ui/xp.png');
    expect(portal?.querySelector('.bar-tooltip-text')?.textContent).toBe('12/100');
  });

  it('mantém tooltip só com texto quando não há ícone', () => {
    document.body.innerHTML = `
      <div id="root">
        <div class="stat-bar health-bar" data-bar-label="80/100"></div>
      </div>
    `;

    const root = document.getElementById('root')!;
    bindBarTooltips(root);
    const bar = root.querySelector('.health-bar') as HTMLElement;
    bar.dispatchEvent(new Event('mouseenter'));

    const portal = document.getElementById('bar-tooltip-portal');
    expect(portal?.textContent).toBe('80/100');
    expect(portal?.querySelector('.bar-tooltip-icon')).toBeNull();
  });
});
