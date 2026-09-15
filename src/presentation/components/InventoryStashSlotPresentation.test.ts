import { describe, expect, it } from 'vitest';
import { renderInventoryStashSlot } from './InventoryStashSlotPresentation';

describe('InventoryStashSlotPresentation', () => {
  it('renderiza slot de drop quando o baú aceita itens', () => {
    const html = renderInventoryStashSlot({
      unlocked: true,
      canStash: true,
      used: 2,
      limit: 10,
    });

    expect(html).toContain('data-drop-zone="stash"');
    expect(html).toContain('inventory-stash-slot');
    expect(html).toContain('title="Guardar no baú (2/10)"');
    expect(html).toContain('chest-open');
  });

  it('desabilita o slot quando o baú está cheio', () => {
    const html = renderInventoryStashSlot({
      unlocked: true,
      canStash: false,
      used: 10,
      limit: 10,
    });

    expect(html).not.toContain('data-drop-zone="stash"');
    expect(html).toContain('inventory-dock-slot--disabled');
    expect(html).toContain('Baú cheio');
  });
});
