import { describe, expect, it } from 'vitest';
import { renderCombatResistPips, renderElementPip } from './ElementPipPresentation';

describe('ElementPipPresentation', () => {
  it('renderiza pip colorido sem texto visível na skill', () => {
    const html = renderElementPip('fire', { variant: 'skill', title: 'Fogo' });

    expect(html).toContain('element-pip--fire');
    expect(html).toContain('title="Fogo"');
    expect(html).not.toContain('>Fogo<');
  });

  it('renderiza chip de resistência com porcentagem à frente', () => {
    const html = renderCombatResistPips({
      fire: 12,
      cold: 0,
      lightning: 0,
      air: 0,
    });

    expect(html).toContain('element-stat--resist');
    expect(html).toContain('element-stat__pct">−12%<');
    expect(html).toContain('element-pip--fire');
    expect(html).not.toContain('Resiste:');
  });

  it('renderiza chip de fraqueza com porcentagem positiva', () => {
    const html = renderCombatResistPips({
      fire: 0,
      cold: -20,
      lightning: 0,
      air: 0,
    });

    expect(html).toContain('element-stat--weakness');
    expect(html).toContain('element-stat__pct">+20%<');
    expect(html).toContain('element-pip--cold');
    expect(html).not.toContain('Vulnerável:');
  });
});
