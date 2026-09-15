import { describe, expect, it } from 'vitest';
import { resolveGearSpritePath } from './GearSpriteCatalog';

describe('GearSpriteCatalog', () => {
  it('resolve sprite por catalogItemId / templateId único', () => {
    expect(
      resolveGearSpritePath({
        templateId: 'field_axe',
        slot: 'weapon',
      }),
    ).toBe('gear/items/machado_de_campo.png');
  });

  it('resolve sprite do item Galneon pelo id único', () => {
    expect(
      resolveGearSpritePath({
        templateId: 'galneon_commander_blade',
        catalogItemId: 'galneon_commander_blade',
        slot: 'weapon',
        rarity: 'epic',
      }),
    ).toBe('gear/items/galneon_commander_blade.png');
  });

  it('usa fallback de slot quando templateId ausente', () => {
    expect(resolveGearSpritePath({ slot: 'armor' })).toBe('gear/items/wooden_shield.png');
  });
});
