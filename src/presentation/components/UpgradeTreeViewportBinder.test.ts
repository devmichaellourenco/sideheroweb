// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vitest';
import { bindUpgradeTreeViewport, captureUpgradeTreeViewport, focusUpgradeTreeNode } from './UpgradeTreeViewportBinder';

function buildViewport(): HTMLElement {
  const viewport = document.createElement('div');
  viewport.className = 'upgrade-tree-viewport';
  viewport.style.width = '400px';
  viewport.style.height = '300px';

  const stage = document.createElement('div');
  stage.className = 'upgrade-tree-stage';
  stage.style.width = '1000px';
  stage.style.height = '800px';

  const node = document.createElement('button');
  node.className = 'upgrade-node';
  node.dataset.upgradeNode = 'auto_battle_2';
  node.style.position = 'absolute';
  node.style.left = '50%';
  node.style.top = '50%';
  node.style.width = '52px';
  node.style.height = '52px';

  stage.appendChild(node);
  viewport.appendChild(stage);
  document.body.appendChild(viewport);

  vi.spyOn(viewport, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    width: 400,
    height: 300,
    top: 0,
    left: 0,
    right: 400,
    bottom: 300,
    toJSON: () => ({}),
  });

  vi.spyOn(stage, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    width: 1000,
    height: 800,
    top: 0,
    left: 0,
    right: 1000,
    bottom: 800,
    toJSON: () => ({}),
  });

  vi.spyOn(node, 'getBoundingClientRect').mockReturnValue({
    x: 174,
    y: 124,
    width: 52,
    height: 52,
    top: 124,
    left: 174,
    right: 226,
    bottom: 176,
    toJSON: () => ({}),
  });

  return viewport;
}

describe('UpgradeTreeViewportBinder', () => {
  it('aplica pan ao arrastar o viewport', () => {
    const viewport = buildViewport();
    const stage = viewport.querySelector('.upgrade-tree-stage') as HTMLElement;
    const unbind = bindUpgradeTreeViewport(viewport);

    viewport.dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 40, clientY: 40, pointerId: 1, bubbles: true }),
    );
    viewport.dispatchEvent(
      new PointerEvent('pointermove', { clientX: 90, clientY: 70, pointerId: 1, bubbles: true }),
    );
    viewport.dispatchEvent(
      new PointerEvent('pointerup', { clientX: 90, clientY: 70, pointerId: 1, bubbles: true }),
    );

    expect(stage.style.transform).toContain('translate(50px, 30px)');

    unbind();
    expect(stage.style.transform).toBe('');
    viewport.remove();
  });

  it('aplica zoom com a roda do mouse', () => {
    const viewport = buildViewport();
    const stage = viewport.querySelector('.upgrade-tree-stage') as HTMLElement;
    const unbind = bindUpgradeTreeViewport(viewport);

    viewport.dispatchEvent(
      new WheelEvent('wheel', { deltaY: -100, clientX: 200, clientY: 150, bubbles: true }),
    );

    expect(stage.style.transform).toContain('scale(1.08)');

    unbind();
    viewport.remove();
  });

  it('centraliza nodo ao focar', () => {
    const viewport = buildViewport();
    const stage = viewport.querySelector('.upgrade-tree-stage') as HTMLElement;

    const state = focusUpgradeTreeNode(viewport, 'auto_battle_2');

    expect(state).not.toBeNull();
    expect(stage.style.transform).toContain('translate(');
    expect(stage.style.transform).toContain('scale(');
    viewport.remove();
  });

  it('restaura estado inicial ao re-bind', () => {
    const viewport = buildViewport();
    const stage = viewport.querySelector('.upgrade-tree-stage') as HTMLElement;
    const initialState = { panX: 120, panY: 80, scale: 1.2 };

    const unbind = bindUpgradeTreeViewport(viewport, { initialState });

    expect(stage.style.transform).toBe('translate(120px, 80px) scale(1.2)');

    unbind();
    viewport.remove();
  });

  it('captura pan e zoom do stage', () => {
    const viewport = buildViewport();
    const stage = viewport.querySelector('.upgrade-tree-stage') as HTMLElement;
    stage.style.transform = 'translate(45px, 30px) scale(1.16)';

    expect(captureUpgradeTreeViewport(viewport)).toEqual({
      panX: 45,
      panY: 30,
      scale: 1.16,
    });

    viewport.remove();
  });

  it('ignora pan quando o alvo é um nodo de melhoria', () => {
    const viewport = buildViewport();
    const stage = viewport.querySelector('.upgrade-tree-stage') as HTMLElement;
    const node = viewport.querySelector('[data-upgrade-node]') as HTMLElement;
    const unbind = bindUpgradeTreeViewport(viewport);

    node.dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 200, clientY: 150, pointerId: 2, bubbles: true }),
    );
    viewport.dispatchEvent(
      new PointerEvent('pointermove', { clientX: 260, clientY: 190, pointerId: 2, bubbles: true }),
    );

    expect(stage.style.transform).toBe('translate(0px, 0px) scale(1)');

    unbind();
    viewport.remove();
  });
});
