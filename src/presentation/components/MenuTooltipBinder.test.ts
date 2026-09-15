// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  bindMenuTooltips,
  hideMenuTooltip,
  resetMenuTooltipBinderForTests,
} from './MenuTooltipBinder';

describe('MenuTooltipBinder', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    resetMenuTooltipBinderForTests();
    document.body.innerHTML = '';
  });

  it('exibe portal estilo jogo no hover do menu', () => {
    document.body.innerHTML = `
      <button type="button" data-menu-tooltip="log">Log</button>
    `;

    bindMenuTooltips();
    const button = document.querySelector('[data-menu-tooltip="log"]') as HTMLElement;
    button.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));

    const portal = document.getElementById('menu-tooltip-portal');
    expect(portal).not.toBeNull();
    expect(portal?.classList.contains('hidden')).toBe(false);
    expect(portal?.querySelector('.menu-tooltip-title')?.textContent).toBe('Crônica de batalha');
    expect(portal?.querySelector('.menu-tooltip-flavor')?.textContent).toContain('pergaminho');
  });

  it('esconde ao sair do botao', () => {
    document.body.innerHTML = `
      <button type="button" data-menu-tooltip="shop">Loja</button>
    `;

    bindMenuTooltips();
    const button = document.querySelector('[data-menu-tooltip="shop"]') as HTMLElement;
    button.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    button.dispatchEvent(
      new MouseEvent('mouseout', { bubbles: true, relatedTarget: document.body }),
    );

    const portal = document.getElementById('menu-tooltip-portal');
    expect(portal?.classList.contains('hidden')).toBe(true);
  });

  it('hideMenuTooltip limpa portal ativo', () => {
    document.body.innerHTML = `
      <button type="button" data-menu-tooltip="settings">Config</button>
    `;

    bindMenuTooltips();
    const button = document.querySelector('[data-menu-tooltip="settings"]') as HTMLElement;
    button.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));

    hideMenuTooltip();
    expect(document.getElementById('menu-tooltip-portal')?.classList.contains('hidden')).toBe(true);
  });
});
