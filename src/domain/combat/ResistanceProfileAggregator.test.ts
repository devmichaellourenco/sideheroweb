import { describe, expect, it } from 'vitest';
import { Gear } from '../entities/Gear';
import {
  aggregateResistanceProfile,
  resistanceProfileFromHeroEquipment,
} from './ResistanceProfileAggregator';

describe('ResistanceProfileAggregator', () => {
  it('soma resistências de múltiplas peças', () => {
    const armor = Gear.create({
      id: 'a1',
      name: 'Armadura',
      slot: 'armor',
      rarity: 'rare',
      attackBonus: 0,
      defenseBonus: 5,
      healthBonus: 0,
      fireResistBonus: 8,
    });
    const accessory = Gear.create({
      id: 'r1',
      name: 'Anel',
      slot: 'accessory',
      rarity: 'epic',
      attackBonus: 0,
      defenseBonus: 0,
      healthBonus: 10,
      airResistBonus: 6,
      allElementalResistBonus: 4,
    });

    const profile = aggregateResistanceProfile([armor, accessory]);

    expect(profile.fire).toBe(8);
    expect(profile.air).toBe(6);
    expect(profile.allElemental).toBe(4);
  });

  it('agrega equipamento do herói', () => {
    const profile = resistanceProfileFromHeroEquipment({
      armor: Gear.create({
        id: 'a1',
        name: 'Armadura',
        slot: 'armor',
        rarity: 'rare',
        attackBonus: 0,
        defenseBonus: 5,
        healthBonus: 0,
        coldResistBonus: 10,
      }),
    });

    expect(profile.cold).toBe(10);
  });
});
