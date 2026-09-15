/**
 * Testes unitários puros para o helper de sparkline SVG.
 * Não requerem DOM — apenas geração de strings.
 */
import { describe, expect, it } from 'vitest';
import {
  renderSparklineSvg,
  renderSparklineFigure,
  renderSparklinePair,
} from './sparkline';

describe('renderSparklineSvg', () => {
  it('retorna string vazia para array vazio', () => {
    expect(renderSparklineSvg([])).toBe('');
  });

  it('gera SVG válido com um valor', () => {
    const svg = renderSparklineSvg([42]);
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('role="img"');
    expect(svg).toContain('aria-label=');
  });

  it('gera <polyline> com pontos para múltiplos valores', () => {
    const svg = renderSparklineSvg([10, 20, 30, 40]);
    expect(svg).toContain('<polyline');
    expect(svg).toContain('points=');
  });

  it('usa aria-label personalizado', () => {
    const svg = renderSparklineSvg([1, 2, 3], { label: 'Minha curva' });
    expect(svg).toContain('aria-label="Minha curva"');
  });

  it('gera linha secundária tracejada quando secondaryValues informado', () => {
    const svg = renderSparklineSvg([1, 2, 3], {
      secondaryValues: [5, 5, 5],
    });
    const polylines = [...svg.matchAll(/<polyline/g)];
    expect(polylines.length).toBe(2);
    expect(svg).toContain('stroke-dasharray');
  });

  it('não gera linha secundária quando secondaryValues está vazio', () => {
    const svg = renderSparklineSvg([1, 2, 3], { secondaryValues: [] });
    const polylines = [...svg.matchAll(/<polyline/g)];
    expect(polylines.length).toBe(1);
  });

  it('gera dots quando showDots=true', () => {
    const svg = renderSparklineSvg([10, 20], { showDots: true });
    expect(svg).toContain('<circle');
  });

  it('não gera dots por padrão', () => {
    const svg = renderSparklineSvg([10, 20]);
    expect(svg).not.toContain('<circle');
  });

  it('viewBox tem dimensões width x height', () => {
    const svg = renderSparklineSvg([1, 2], { width: 300, height: 60 });
    expect(svg).toContain('viewBox="0 0 300 60"');
  });

  it('normaliza os valores corretamente (sem erro para valores iguais)', () => {
    expect(() => renderSparklineSvg([5, 5, 5])).not.toThrow();
  });

  it('preserveAspectRatio="none" para responsividade', () => {
    const svg = renderSparklineSvg([1, 2, 3]);
    expect(svg).toContain('preserveAspectRatio="none"');
  });

  it('width=100% e height fixo no elemento SVG', () => {
    const svg = renderSparklineSvg([1, 2], { height: 48 });
    expect(svg).toContain('width="100%"');
    expect(svg).toContain('height="48"');
  });
});

describe('renderSparklineFigure', () => {
  it('retorna string vazia para valores vazios', () => {
    expect(renderSparklineFigure([], { caption: 'teste' })).toBe('');
  });

  it('envolve SVG em <figure> com <figcaption>', () => {
    const fig = renderSparklineFigure([1, 2, 3], { caption: 'XP por fase' });
    expect(fig).toContain('<figure');
    expect(fig).toContain('<figcaption');
    expect(fig).toContain('XP por fase');
    expect(fig).toContain('</figure>');
  });

  it('aplica role=img ao figure', () => {
    const fig = renderSparklineFigure([1, 2], { caption: 'teste' });
    expect(fig).toContain('role="img"');
  });

  it('usa caption como aria-label quando label não informado', () => {
    const fig = renderSparklineFigure([1, 2], { caption: 'Ouro por fase' });
    expect(fig).toContain('aria-label="Ouro por fase"');
  });

  it('usa label personalizado quando informado', () => {
    const fig = renderSparklineFigure([1, 2], {
      caption: 'Ouro por fase',
      label: 'Label customizado',
    });
    expect(fig).toContain('aria-label="Label customizado"');
  });

  it('aplica classe lab-sparkline ao figure', () => {
    const fig = renderSparklineFigure([1, 2], { caption: 'test' });
    expect(fig).toContain('class="lab-sparkline"');
  });
});

describe('renderSparklinePair', () => {
  it('gera dois figures dentro de um container', () => {
    const pair = renderSparklinePair(
      { values: [1, 2, 3], caption: 'Série A' },
      { values: [4, 5, 6], caption: 'Série B' },
    );
    expect(pair).toContain('lab-sparkline-pair');
    expect(pair).toContain('Série A');
    expect(pair).toContain('Série B');
    const figures = [...pair.matchAll(/<figure/g)];
    expect(figures.length).toBe(2);
  });

  it('retorna HTML com dois sparklines mesmo quando valores são iguais', () => {
    const pair = renderSparklinePair(
      { values: [0, 0, 0], caption: 'Zeros' },
      { values: [1, 1, 1], caption: 'Uns' },
    );
    expect(pair).toContain('Zeros');
    expect(pair).toContain('Uns');
  });
});
