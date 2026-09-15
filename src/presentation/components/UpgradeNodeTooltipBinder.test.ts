// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UpgradeNodeDto } from '../../application/dto/UpgradeNodeDto';
import {
  bindUpgradeNodeTooltip,
  hideUpgradeNodeTooltip,
  isUpgradeNodeTooltipPinned,
  resetUpgradeNodeTooltipInteraction,
} from './UpgradeNodeTooltipBinder';

function node(partial: Partial<UpgradeNodeDto> & Pick<UpgradeNodeDto, 'id'>): UpgradeNodeDto {
  return {
    feature: 'auto_battle',
    branch: 'combat',
    level: 1,
    name: partial.id,
    description: 'desc',
    cost: 100,
    status: 'available',
    canAfford: true,
    requirements: [],
    ...partial,
  };
}

function mountAnchor(): HTMLElement {
  const anchor = document.createElement('button');
  anchor.type = 'button';
  anchor.dataset.upgradeNode = 'auto_battle_2';
  document.body.append(anchor);
  return anchor;
}

describe('UpgradeNodeTooltipBinder', () => {
  beforeEach(() => {
    hideUpgradeNodeTooltip();
    resetUpgradeNodeTooltipInteraction();
  });

  it('exibe tooltip no hover e esconde ao sair do nodo sem clique', () => {
    const onPurchase = vi.fn();
    const anchor = mountAnchor();
    bindUpgradeNodeTooltip(
      anchor,
      node({ id: 'auto_battle_2', status: 'ready', canAfford: false }),
      () => '<p>Detalhe</p>',
      onPurchase,
    );

    anchor.dispatchEvent(new Event('mouseenter'));
    expect(document.getElementById('upgrade-node-tooltip-portal')?.classList.contains('hidden')).toBe(false);

    anchor.dispatchEvent(new Event('mouseleave'));
    expect(document.getElementById('upgrade-node-tooltip-portal')?.classList.contains('hidden')).toBe(true);
    expect(isUpgradeNodeTooltipPinned()).toBe(false);
    expect(onPurchase).not.toHaveBeenCalled();
  });

  it('compra direto ao clicar em nodo disponível', () => {
    const onPurchase = vi.fn();
    const anchor = mountAnchor();
    bindUpgradeNodeTooltip(anchor, node({ id: 'auto_battle_2' }), () => '<p>Detalhe</p>', onPurchase);

    anchor.dispatchEvent(new Event('mouseenter'));
    anchor.click();

    expect(onPurchase).toHaveBeenCalledWith('auto_battle_2');
    expect(isUpgradeNodeTooltipPinned()).toBe(false);
    expect(document.getElementById('upgrade-node-tooltip-portal')?.classList.contains('hidden')).toBe(true);
  });

  it('mantém tooltip fixo após clique em nodo sem compra enquanto o ponteiro está no nodo ou no tooltip', () => {
    vi.useFakeTimers();
    const onPurchase = vi.fn();
    const anchor = mountAnchor();
    bindUpgradeNodeTooltip(
      anchor,
      node({ id: 'auto_battle_2', status: 'ready', canAfford: false }),
      () => '<p>Detalhe fixo</p>',
      onPurchase,
    );

    anchor.dispatchEvent(new Event('mouseenter'));
    anchor.click();
    expect(isUpgradeNodeTooltipPinned()).toBe(true);
    expect(onPurchase).not.toHaveBeenCalled();
    expect(anchor.classList.contains('upgrade-node--selected')).toBe(true);
    expect(anchor.getAttribute('aria-pressed')).toBe('true');

    anchor.dispatchEvent(new Event('mouseleave'));
    const portal = document.getElementById('upgrade-node-tooltip-portal') as HTMLElement;
    expect(portal.classList.contains('hidden')).toBe(false);

    portal.dispatchEvent(new Event('mouseenter'));
    vi.advanceTimersByTime(100);
    expect(portal.classList.contains('hidden')).toBe(false);

    portal.dispatchEvent(new Event('mouseleave'));
    vi.advanceTimersByTime(100);
    expect(portal.classList.contains('hidden')).toBe(true);
    expect(isUpgradeNodeTooltipPinned()).toBe(false);
    expect(anchor.classList.contains('upgrade-node--selected')).toBe(false);

    vi.useRealTimers();
  });

  it('não mantém tooltip aberto ao passar o mouse no tooltip sem clicar no nodo', () => {
    const anchor = mountAnchor();
    bindUpgradeNodeTooltip(
      anchor,
      node({ id: 'auto_battle_2', status: 'locked', canAfford: false }),
      () => '<p>Detalhe</p>',
      vi.fn(),
    );

    anchor.dispatchEvent(new Event('mouseenter'));
    const portal = document.getElementById('upgrade-node-tooltip-portal') as HTMLElement;

    anchor.dispatchEvent(new Event('mouseleave'));
    expect(portal.classList.contains('hidden')).toBe(true);

    portal.dispatchEvent(new Event('mouseenter'));
    expect(portal.classList.contains('hidden')).toBe(true);
  });
});