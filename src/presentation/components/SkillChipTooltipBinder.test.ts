// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  bindSkillChipTooltips,
  hideSkillChipTooltip,
  isSkillChipTooltipPinned,
} from './SkillChipTooltipBinder';

function mountSkill(): HTMLElement {
  const container = document.createElement('div');
  container.innerHTML = `
    <button type="button" data-skill-tooltip class="skill-card skill-card--offense">
      <span class="hero-skill-chip-tooltip hidden">
        <strong class="hero-skill-chip-tooltip-name">Corte</strong>
      </span>
    </button>
  `;
  document.body.append(container);
  bindSkillChipTooltips(container);
  return container.querySelector('[data-skill-tooltip]') as HTMLElement;
}

describe('SkillChipTooltipBinder', () => {
  beforeEach(() => {
    hideSkillChipTooltip();
    document.body.innerHTML = '';
  });

  it('exibe tooltip no hover e esconde ao sair sem clique', () => {
    const anchor = mountSkill();

    anchor.dispatchEvent(new Event('mouseenter'));
    const portal = document.getElementById('skill-chip-tooltip-portal') as HTMLElement;
    expect(portal.classList.contains('hidden')).toBe(false);
    expect(isSkillChipTooltipPinned()).toBe(false);

    anchor.dispatchEvent(new Event('mouseleave'));
    expect(portal.classList.contains('hidden')).toBe(true);
  });

  it('mantém tooltip após clique enquanto o ponteiro está no card ou no portal', () => {
    vi.useFakeTimers();
    const anchor = mountSkill();

    anchor.dispatchEvent(new Event('mouseenter'));
    anchor.dispatchEvent(new Event('click'));
    expect(isSkillChipTooltipPinned()).toBe(true);

    const portal = document.getElementById('skill-chip-tooltip-portal') as HTMLElement;
    expect(portal.dataset.pinned).toBe('true');

    anchor.dispatchEvent(new Event('mouseleave'));
    portal.dispatchEvent(new Event('mouseenter'));
    vi.advanceTimersByTime(100);
    expect(portal.classList.contains('hidden')).toBe(false);

    portal.dispatchEvent(new Event('mouseleave'));
    vi.advanceTimersByTime(100);
    expect(portal.classList.contains('hidden')).toBe(true);
    expect(isSkillChipTooltipPinned()).toBe(false);

    vi.useRealTimers();
  });
});
