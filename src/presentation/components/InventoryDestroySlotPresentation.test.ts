import { describe, expect, it } from 'vitest';
import { renderInventoryDestroySlot } from './InventoryDestroySlotPresentation';

describe('InventoryDestroySlotPresentation', () => {
  it('renderiza slot de drop para destruir', () => {
    const html = renderInventoryDestroySlot();
    expect(html).toContain('data-drop-zone="destroy"');
    expect(html).toContain('inventory-destroy-slot');
    expect(html).toContain('inventory-dock-slot');
    expect(html).toContain('title="Destruir item"');
    expect(html).toContain('<svg');
  });
});
