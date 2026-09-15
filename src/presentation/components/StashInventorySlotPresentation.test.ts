import { describe, expect, it } from 'vitest';
import { renderStashInventorySlot } from './StashInventorySlotPresentation';

describe('StashInventorySlotPresentation', () => {
  it('renderiza slot de drop quando o inventário tem espaço', () => {
    const html = renderStashInventorySlot({
      canWithdraw: true,
      used: 12,
      limit: 30,
    });

    expect(html).toContain('data-drop-zone="inventory"');
    expect(html).toContain('stash-inventory-slot');
    expect(html).toContain('title="Enviar ao inventário (12/30)"');
  });

  it('desabilita o slot quando o inventário está cheio', () => {
    const html = renderStashInventorySlot({
      canWithdraw: false,
      used: 30,
      limit: 30,
    });

    expect(html).not.toContain('data-drop-zone="inventory"');
    expect(html).toContain('inventory-dock-slot--disabled');
    expect(html).toContain('Inventário cheio');
  });
});
