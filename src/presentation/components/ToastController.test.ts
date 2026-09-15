// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastController } from './ToastController';

describe('ToastController — posição perto do cursor', () => {
  let root: HTMLElement;

  beforeEach(() => {
    root = document.createElement('div');
    root.className = 'toast-root';
    document.body.appendChild(root);
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
  });

  afterEach(() => {
    root.remove();
    vi.useRealTimers();
  });

  it('centraliza no painel e posiciona um pouco acima do mouse em Y', () => {
    const controller = new ToastController(root);
    window.dispatchEvent(new PointerEvent('pointermove', { clientY: 300 }));

    controller.show('Volte ao acampamento', 'info');

    const toast = root.querySelector<HTMLElement>('.game-toast');
    expect(toast).toBeTruthy();
    expect(toast?.style.top).toBe('260px');
  });

  it('não deixa o toast sair pelo topo da viewport', () => {
    const controller = new ToastController(root);
    window.dispatchEvent(new PointerEvent('pointermove', { clientY: 10 }));

    controller.show('Aviso curto', 'info');

    const toast = root.querySelector<HTMLElement>('.game-toast');
    expect(toast?.style.top).toBe('12px');
  });
});
