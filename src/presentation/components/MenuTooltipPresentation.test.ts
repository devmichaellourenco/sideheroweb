// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest';
import {
  renderMenuTooltipHtml,
  resolveMenuTooltipContent,
} from './MenuTooltipPresentation';

describe('MenuTooltipPresentation', () => {
  it('monta card RPG com categoria, titulo e flavor', () => {
    const anchor = document.createElement('button');
    anchor.dataset.menuTooltip = 'shop';

    const content = resolveMenuTooltipContent(anchor);
    expect(content?.title).toBe('Loja');
    expect(content?.kindLabel).toBe('Sistema');

    const html = renderMenuTooltipHtml(content!);
    expect(html).toContain('menu-tooltip-kind');
    expect(html).toContain('Sistema');
    expect(html).toContain('Loja');
    expect(html).toContain('Ofertas do acampamento');
  });

  it('usa titulo e detalhe dinamicos quando informados', () => {
    const anchor = document.createElement('button');
    anchor.dataset.menuTooltip = 'heroes';
    anchor.dataset.menuTooltipDetail = '2 herói(s) com pontos';

    const content = resolveMenuTooltipContent(anchor);
    expect(content?.detail).toBe('2 herói(s) com pontos');

    const html = renderMenuTooltipHtml(content!);
    expect(html).toContain('menu-tooltip-detail');
    expect(html).toContain('2 herói(s) com pontos');
  });
});
