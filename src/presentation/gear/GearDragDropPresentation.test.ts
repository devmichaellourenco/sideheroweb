import { describe, expect, it } from 'vitest';
import { renderEquipmentSlot } from '../components/GearPresentation';
import { gearDragAttr, gearDropTargetAttr } from './GearDragDropBinder';
import { serializeGearDragSource } from './GearDragDropPolicy';

describe('GearDragDropPresentation', () => {
  it('gera atributos de drag para item do inventário', () => {
    const attrs = gearDragAttr({ kind: 'inventory', gearId: 'g1', slot: 'weapon' });

    expect(attrs).toContain('draggable="true"');
    expect(attrs).toContain('data-drag-gear=');
    expect(attrs).toContain(encodeURIComponent(serializeGearDragSource({
      kind: 'inventory',
      gearId: 'g1',
      slot: 'weapon',
    })));
  });

  it('gera alvo de drop por herói e slot', () => {
    expect(gearDropTargetAttr('hero-1', 'armor')).toBe(
      'data-drop-gear-hero="hero-1" data-drop-gear-slot="armor"',
    );
  });

  it('renderiza slot equipado com drag e drop', () => {
    const html = renderEquipmentSlot('weapon', {
      id: 'g-weapon',
      name: 'Espada',
      slot: 'weapon',
      rarity: 'rare',
      attackBonus: 8,
      defenseBonus: 0,
      healthBonus: 0,
      attackSpeedBonus: 0,
      castSpeedBonus: 0,
      critChanceBonus: 0,
      critDamageBonus: 0,
      requirements: { minLevel: 1 },
    }, {
      heroId: 'hero-1',
      variant: 'loadout',
      dragDrop: true,
    });

    expect(html).toContain('data-drop-gear-hero="hero-1"');
    expect(html).toContain('data-drop-gear-slot="weapon"');
    expect(html).toContain('data-drag-gear=');
    expect(html).toContain('gear-drop-target');
  });

  it('omite drag quando dragDrop está desabilitado', () => {
    const html = renderEquipmentSlot('weapon', null, {
      heroId: 'hero-1',
      dragDrop: false,
    });

    expect(html).not.toContain('data-drag-gear');
    expect(html).not.toContain('data-drop-gear-hero');
  });
});
