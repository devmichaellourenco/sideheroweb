import { describe, expect, it } from 'vitest';
import { Gear } from '../entities/Gear';
import { Hero } from '../entities/Hero';
import { Experience } from '../value-objects/Experience';
import { canHeroEquip, equipHeroWithGear } from './GearEquipService';

function heroAtLevel(level: number): Hero {
  const base = Hero.createStarter('hero-1', 'knight', 'Galneon');
  return Hero.restore({
    ...base.toProps(),
    experience: Experience.restore(0, 100, level),
  });
}

describe('GearEquipService', () => {
  it('canHeroEquip retorna false quando requisitos não são atendidos', () => {
    const hero = heroAtLevel(1);
    const gear = Gear.create({
      id: 'gear-1',
      name: 'Espada pesada',
      slot: 'weapon',
      rarity: 'rare',
      attackBonus: 10,
      defenseBonus: 0,
      healthBonus: 0,
      requirements: { minLevel: 5 },
    });

    expect(canHeroEquip(hero, gear)).toBe(false);
  });

  it('equipHeroWithGear lança erro quando herói não pode equipar', () => {
    const hero = heroAtLevel(1);
    const gear = Gear.create({
      id: 'gear-2',
      name: 'Espada épica',
      slot: 'weapon',
      rarity: 'epic',
      attackBonus: 12,
      defenseBonus: 0,
      healthBonus: 0,
      requirements: { minLevel: 10 },
    });

    expect(() => equipHeroWithGear(hero, gear)).toThrow('Requisitos de equipamento não atendidos');
  });

  it('equipHeroWithGear equipa item elegível', () => {
    const hero = heroAtLevel(5);
    const gear = Gear.create({
      id: 'gear-3',
      name: 'Espada comum',
      slot: 'weapon',
      rarity: 'common',
      attackBonus: 4,
      defenseBonus: 0,
      healthBonus: 0,
      requirements: { minLevel: 1 },
    });

    const { hero: updated, replaced } = equipHeroWithGear(hero, gear);
    expect(replaced).toBeNull();
    expect(updated.toProps().equipment.weapon?.id).toBe('gear-3');
  });
});
