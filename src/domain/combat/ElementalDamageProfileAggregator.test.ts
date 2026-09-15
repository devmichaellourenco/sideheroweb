import { describe, expect, it } from 'vitest';
import { Gear } from '../entities/Gear';
import {
  aggregateElementalDamageProfile,
  elementalDamageProfileFromHeroEquipment,
} from './ElementalDamageProfileAggregator';

describe('ElementalDamageProfileAggregator', () => {
  it('cajado do catálogo entra no perfil elemental do herói', async () => {
    const { createGearFromCatalogItem } = await import('../gear/GearItemCatalog');
    const staff = createGearFromCatalogItem('arcanist_staff', 'el-staff');
    const profile = elementalDamageProfileFromHeroEquipment({ weapon: staff });

    expect(profile.allElemental).toBe(10);
  });

  it('soma bônus de dano elemental do equipamento', () => {
    const weapon = Gear.create({
      id: 'w1',
      name: 'Espada Ígnea',
      templateId: 'flame_brand',
      slot: 'weapon',
      rarity: 'rare',
      attackBonus: 10,
      defenseBonus: 0,
      healthBonus: 0,
      fireDamageBonus: 12,
    });
    const ring = Gear.create({
      id: 'a1',
      name: 'Anel Rubi',
      templateId: 'ruby_signet',
      slot: 'accessory',
      rarity: 'uncommon',
      attackBonus: 0,
      defenseBonus: 0,
      healthBonus: 20,
      fireDamageBonus: 5,
      allElementalDamageBonus: 3,
    });

    const profile = aggregateElementalDamageProfile([weapon, ring]);
    expect(profile.fire).toBe(17);
    expect(profile.allElemental).toBe(3);
  });

  it('agrega perfil a partir do equipment do herói', () => {
    const profile = elementalDamageProfileFromHeroEquipment({
      weapon: Gear.create({
        id: 'w2',
        name: 'Lâmina Gelada',
        templateId: 'frostbite_blade',
        slot: 'weapon',
        rarity: 'epic',
        attackBonus: 14,
        defenseBonus: 0,
        healthBonus: 0,
        coldDamageBonus: 16,
      }),
      armor: null,
      accessory: null,
    });

    expect(profile.cold).toBe(16);
  });
});
