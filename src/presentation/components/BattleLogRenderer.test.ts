// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest';
import { BattleLogRenderer } from './BattleLogRenderer';

describe('BattleLogRenderer', () => {
  it('não reescreve o DOM quando as mensagens não mudam', () => {
    const container = document.createElement('ul');
    const renderer = new BattleLogRenderer();

    renderer.render(container, ['Primeira']);
    const firstChild = container.firstElementChild;

    renderer.render(container, ['Primeira']);
    expect(container.childElementCount).toBe(1);
    expect(container.firstElementChild).toBe(firstChild);
  });

  it('faz prepend incremental quando só há novas mensagens', () => {
    const container = document.createElement('ul');
    const renderer = new BattleLogRenderer();

    renderer.render(container, ['A']);
    renderer.render(container, ['A', 'B']);

    expect(container.children[0]?.textContent).toContain('B');
    expect(container.children[1]?.textContent).toContain('A');
    expect(container.children[0]?.classList.contains('battle-log-entry')).toBe(true);
  });

  it('reconstrói quando o filtro remove entradas antigas', () => {
    const container = document.createElement('ul');
    const renderer = new BattleLogRenderer();

    renderer.render(container, ['A', 'B', 'C']);
    renderer.render(container, ['B']);

    expect(container.childElementCount).toBe(1);
    expect(container.textContent).toBe('B');
  });

  it('limpa a lista quando não há mensagens', () => {
    const container = document.createElement('ul');
    const renderer = new BattleLogRenderer();

    renderer.render(container, ['A']);
    renderer.render(container, []);

    expect(container.childElementCount).toBe(0);
  });
});
