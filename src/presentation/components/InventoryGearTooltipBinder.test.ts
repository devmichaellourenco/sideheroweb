// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  bindInventoryGearTooltips,
  hideInventoryGearTooltip,
  isInventoryGearTooltipPinned,
  reanchorPinnedInventoryGearTooltip,
} from './InventoryGearTooltipBinder';

function mountGrid(): { container: HTMLElement; slot: HTMLElement } {
  const container = document.createElement('div');
  container.innerHTML = `
    <button type="button" class="inventory-grid-slot rare" data-inventory-gear-id="g1">
      <span class="inventory-gear-tooltip-content hidden">
        <strong class="inventory-gear-tooltip-name">Espada</strong>
        <span class="inventory-gear-tooltip-action gear-equip-btn inventory-gear-action inventory-gear-action--equip" title="Equipar" aria-label="Equipar" data-inventory-equip="g1">
          <svg class="inventory-gear-action-icon" viewBox="0 0 16 16" aria-hidden="true"></svg>
        </span>
      </span>
    </button>
  `;
  document.body.append(container);
  const slot = container.querySelector('.inventory-grid-slot') as HTMLElement;
  bindInventoryGearTooltips(container);
  return { container, slot };
}

describe('InventoryGearTooltipBinder', () => {
  beforeEach(() => {
    hideInventoryGearTooltip();
    document.body.innerHTML = '';
  });

  it('exibe tooltip no hover e esconde ao sair do slot sem clique', () => {
    const { slot } = mountGrid();

    slot.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    const portal = document.getElementById('inventory-gear-tooltip-portal') as HTMLElement;
    expect(portal.classList.contains('hidden')).toBe(false);
    expect(portal.dataset.pinned).toBeUndefined();
    expect(isInventoryGearTooltipPinned()).toBe(false);

    slot.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, relatedTarget: document.body }));
    expect(portal.classList.contains('hidden')).toBe(true);
  });

  it('não mantém tooltip ao passar o mouse no portal sem clicar no slot', () => {
    const { slot } = mountGrid();

    slot.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    const portal = document.getElementById('inventory-gear-tooltip-portal') as HTMLElement;
    expect(portal.classList.contains('hidden')).toBe(false);

    slot.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, relatedTarget: portal }));
    expect(portal.classList.contains('hidden')).toBe(true);
    expect(isInventoryGearTooltipPinned()).toBe(false);

    portal.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    expect(portal.classList.contains('hidden')).toBe(true);
  });

  it('mantém tooltip fixo após clique enquanto o ponteiro está no slot ou no tooltip', () => {
    vi.useFakeTimers();
    const { slot } = mountGrid();

    slot.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    slot.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(isInventoryGearTooltipPinned()).toBe(true);
    expect(slot.classList.contains('inventory-grid-slot--tooltip-pinned')).toBe(true);

    const portal = document.getElementById('inventory-gear-tooltip-portal') as HTMLElement;
    expect(portal.dataset.pinned).toBe('true');
    expect(portal.classList.contains('hidden')).toBe(false);

    slot.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, relatedTarget: portal }));
    portal.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(100);
    expect(portal.classList.contains('hidden')).toBe(false);

    portal.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    vi.advanceTimersByTime(100);
    expect(portal.classList.contains('hidden')).toBe(true);
    expect(isInventoryGearTooltipPinned()).toBe(false);

    vi.useRealTimers();
  });

  it('reancora pin após recriar o slot no DOM', () => {
    const { container, slot } = mountGrid();

    slot.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    slot.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(isInventoryGearTooltipPinned()).toBe(true);

    container.innerHTML = `
      <button type="button" class="inventory-grid-slot rare" data-inventory-gear-id="g1">
        <span class="inventory-gear-tooltip-content hidden">
          <strong class="inventory-gear-tooltip-name">Espada</strong>
        </span>
      </button>
    `;

    reanchorPinnedInventoryGearTooltip(container);

    const nextSlot = container.querySelector('.inventory-grid-slot') as HTMLElement;
    expect(isInventoryGearTooltipPinned()).toBe(true);
    expect(nextSlot.classList.contains('inventory-grid-slot--tooltip-pinned')).toBe(true);
    const portal = document.getElementById('inventory-gear-tooltip-portal') as HTMLElement;
    expect(portal.classList.contains('hidden')).toBe(false);
  });

  it('esconde pin se o gear sumiu no re-render', () => {
    const { container, slot } = mountGrid();

    slot.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    slot.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    container.innerHTML = '<p class="empty-state">vazio</p>';
    reanchorPinnedInventoryGearTooltip(container);

    expect(isInventoryGearTooltipPinned()).toBe(false);
  });
});
