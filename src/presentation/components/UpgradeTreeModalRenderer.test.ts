// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vitest';
import { UpgradeNodeDto } from '../../application/dto/UpgradeNodeDto';
import { UpgradeTreeModalRenderer } from './UpgradeTreeModalRenderer';
import * as UpgradeTreeViewportBinder from './UpgradeTreeViewportBinder';

function node(partial: Partial<UpgradeNodeDto> & Pick<UpgradeNodeDto, 'id' | 'branch'>): UpgradeNodeDto {
  return {
    feature: 'auto_battle',
    level: 1,
    name: partial.id,
    description: 'desc',
    cost: 100,
    status: 'locked',
    canAfford: false,
    requirements: [],
    ...partial,
  };
}

describe('UpgradeTreeModalRenderer', () => {
  const renderer = new UpgradeTreeModalRenderer();

  it('renderiza canvas único com viewport, legenda e nodos posicionados', () => {
    const container = document.createElement('div');
    const nodes = [
      node({ id: 'auto_battle_2', branch: 'combat', status: 'owned', name: 'Auto-batalha II' }),
      node({ id: 'auto_battle_3', branch: 'combat', status: 'available', name: 'Auto-batalha III' }),
      node({ id: 'log_filter_1', branch: 'qol', status: 'locked', name: 'Log resumido I' }),
    ];

    renderer.render(container, nodes, { onPurchase: vi.fn() });

    expect(container.querySelector('[data-upgrade-tree-viewport]')).not.toBeNull();
    expect(container.querySelector('.upgrade-tree-stage')).not.toBeNull();
    expect(container.querySelector('.upgrade-tree-legend')).not.toBeNull();
    expect(container.querySelector('[data-upgrade-focus-available]')).not.toBeNull();
    expect(container.querySelectorAll('[data-upgrade-node]')).toHaveLength(3);
    expect(container.querySelector('.upgrade-tree-edge')).not.toBeNull();
    expect(container.innerHTML).not.toContain('upgrade-intro');
    expect(container.innerHTML).not.toContain('Arraste para mover');
    expect(container.innerHTML).not.toContain('upgrade-branch-tab');
    expect(container.innerHTML).not.toContain('upgrade-balance');
    expect(container.innerHTML).not.toContain('Seu ouro');
  });

  it('dispara onPurchase ao clicar no nodo disponível', () => {
    const container = document.createElement('div');
    const onPurchase = vi.fn();
    const nodes = [
      node({
        id: 'open_all_chests_1',
        branch: 'chests',
        status: 'available',
        canAfford: true,
        cost: 60,
        name: 'Abrir todos os baús I',
      }),
    ];

    renderer.render(container, nodes, { onPurchase });

    const upgradeNode = container.querySelector(
      '[data-upgrade-node="open_all_chests_1"]',
    ) as HTMLElement;
    upgradeNode.click();

    expect(onPurchase).toHaveBeenCalledWith('open_all_chests_1');
    expect(document.querySelector('[data-upgrade-buy]')).toBeNull();
  });

  it('exibe preço no tooltip sem botão comprar', () => {
    const container = document.createElement('div');
    const nodes = [
      node({
        id: 'open_all_chests_1',
        branch: 'chests',
        status: 'ready',
        canAfford: false,
        cost: 60,
        name: 'Abrir todos os baús I',
      }),
    ];

    renderer.render(container, nodes, { onPurchase: vi.fn() });

    const upgradeNode = container.querySelector(
      '[data-upgrade-node="open_all_chests_1"]',
    ) as HTMLElement;
    upgradeNode.dispatchEvent(new Event('mouseenter'));

    const portal = document.getElementById('upgrade-node-tooltip-portal');
    expect(portal?.querySelector('.upgrade-tooltip-price')?.textContent).toContain('60');
    expect(portal?.querySelector('[data-upgrade-buy]')).toBeNull();
    expect(portal?.textContent).toContain('Ouro insuficiente');
  });

  it('preserva viewport no segundo render após compra simulada', () => {
    const container = document.createElement('div');
    const nodes = [
      node({ id: 'auto_battle_2', branch: 'combat', status: 'owned', name: 'Auto-batalha II' }),
      node({ id: 'auto_battle_3', branch: 'combat', status: 'available', name: 'Auto-batalha III' }),
    ];
    const focusSpy = vi.spyOn(UpgradeTreeViewportBinder, 'focusUpgradeTreeNode');

    renderer.beginSession();
    renderer.render(container, nodes, { onPurchase: vi.fn() });

    const stage = container.querySelector('.upgrade-tree-stage') as HTMLElement;
    stage.style.transform = 'translate(120px, 80px) scale(1.2)';

    const ownedNodes = [
      node({ id: 'auto_battle_2', branch: 'combat', status: 'owned', name: 'Auto-batalha II' }),
      node({ id: 'auto_battle_3', branch: 'combat', status: 'owned', name: 'Auto-batalha III' }),
    ];
    focusSpy.mockClear();
    renderer.render(container, ownedNodes, { onPurchase: vi.fn() });

    const nextStage = container.querySelector('.upgrade-tree-stage') as HTMLElement;
    expect(nextStage.style.transform).toBe('translate(120px, 80px) scale(1.2)');
    expect(focusSpy).not.toHaveBeenCalled();

    focusSpy.mockRestore();
  });
});
