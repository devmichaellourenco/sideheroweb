import { describe, expect, it } from 'vitest';
import { Gear } from '../entities/Gear';
import { aggregateElementalDamageFlat } from './ElementalDamageFlatProfileAggregator';

describe('ElementalDamageFlatProfileAggregator', () => {
  it('soma dano flat por elemento', () => {
    const profile = aggregateElementalDamageFlat([
      Gear.create({
        id: 'w1',
        name: 'Vara',
        templateId: 'storm_rod',
        slot: 'weapon',
        rarity: 'rare',
        attackBonus: 6,
        defenseBonus: 0,
        healthBonus: 0,
        lightningDamageFlat: 5,
      }),
      Gear.create({
        id: 'a1',
        name: 'Anel',
        templateId: 'voltaic_loop',
        slot: 'accessory',
        rarity: 'uncommon',
        attackBonus: 0,
        defenseBonus: 0,
        healthBonus: 10,
        lightningDamageFlat: 3,
      }),
    ]);

    expect(profile.lightning).toBe(8);
  });
});
