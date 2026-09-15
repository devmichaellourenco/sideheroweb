import { describe, expect, it } from 'vitest';
import { renderInventoryGearAction } from './InventoryGearActionPresentation';

describe('InventoryGearActionPresentation', () => {
  it('renderiza ícone de baú com tooltip textual', () => {
    const html = renderInventoryGearAction('stash', 'Guardar no baú', 'data-move-to-stash="g1"');

    expect(html).toContain('inventory-gear-action--stash');
    expect(html).toContain('title="Guardar no baú"');
    expect(html).toContain('aria-label="Guardar no baú"');
    expect(html).toContain('data-move-to-stash="g1"');
    expect(html).toContain('<svg');
  });

  it('renderiza ícone de destruição para o baú', () => {
    const destroy = renderInventoryGearAction(
      'destroy',
      'Destruir',
      'data-destroy-gear="g1" data-gear-location="stash"',
    );

    expect(destroy).toContain('inventory-gear-action--destroy');
    expect(destroy).toContain('gear-destroy-btn');
    expect(destroy).toContain('title="Destruir"');
  });
});
