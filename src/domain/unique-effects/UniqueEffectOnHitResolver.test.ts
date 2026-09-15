import { describe, expect, it } from 'vitest';
import { Gear } from '../entities/Gear';
import { Hero } from '../entities/Hero';
import { SWORD_VORPAL_LUPNUS_TEMPLATE_ID } from '../gear/UniqueGearCatalog';
import { combatantKey } from '../services/combat/SkillCooldownTracker';
import { resolveUniqueOnHitFromHero } from './UniqueEffectOnHitResolver';

function vorpalWeapon(): Gear {
  return Gear.create({
    id: 'vorpal',
    name: 'Vorpal Lupnus',
    templateId: SWORD_VORPAL_LUPNUS_TEMPLATE_ID,
    slot: 'weapon',
    rarity: 'legendary',
    attackBonus: 30,
    defenseBonus: 0,
    healthBonus: 0,
  });
}

describe('UniqueEffectOnHitResolver', () => {
  it('aplica heal_block ao acertar com Vorpal Lupnus', () => {
    const hero = Hero.createStarter('h1', 'knight', 'Galneon').equip(vorpalWeapon());
    const applications = resolveUniqueOnHitFromHero(
      hero,
      combatantKey('enemy', 'e1'),
      { amount: 12, dodged: false, blocked: false, isCrit: false },
    );

    expect(applications).toHaveLength(1);
    expect(applications[0]).toMatchObject({
      kind: 'heal_block',
      combatantKey: 'enemy:e1',
      skillId: 'vorpal_lupnus_heal_block',
    });
  });

  it('não aplica em esquiva ou sem arma única', () => {
    const hero = Hero.createStarter('h1', 'knight', 'Galneon');
    expect(
      resolveUniqueOnHitFromHero(hero, combatantKey('enemy', 'e1'), {
        amount: 0,
        dodged: true,
        blocked: false,
        isCrit: false,
      }),
    ).toEqual([]);
    expect(
      resolveUniqueOnHitFromHero(hero, combatantKey('enemy', 'e1'), {
        amount: 10,
        dodged: false,
        blocked: false,
        isCrit: false,
      }),
    ).toEqual([]);
  });
});
