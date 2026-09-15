import { describe, expect, it } from 'vitest';
import { Gear } from '../entities/Gear';
import { elementalPenetrationFromHeroEquipment } from './ElementalPenetrationProfileAggregator';

describe('ElementalPenetrationProfileAggregator', () => {
  it('soma penetração de fogo do equipamento', () => {
    const necklace = Gear.create({
      id: 'ignus',
      name: 'Ignus Ix',
      templateId: 'ignus_ix',
      slot: 'accessory',
      rarity: 'legendary',
      attackBonus: 0,
      defenseBonus: 0,
      healthBonus: 0,
      fireResistPenetrationBonus: 30,
    });

    const profile = elementalPenetrationFromHeroEquipment({
      accessory: necklace,
      weapon: null,
      armor: null,
    });

    expect(profile.fire).toBe(30);
  });
});
