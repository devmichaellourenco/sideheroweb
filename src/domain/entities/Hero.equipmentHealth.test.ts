import { describe, expect, it } from 'vitest';
import { Gear } from './Gear';
import { Hero } from './Hero';

function lifeRing(): Gear {
  return Gear.create({
    id: 'ring-life',
    name: 'Anel de Vida',
    slot: 'accessory',
    rarity: 'common',
    attackBonus: 0,
    defenseBonus: 0,
    healthBonus: 20,
    requirements: { minLevel: 1 },
  });
}

describe('Hero equip/unequip health', () => {
  it('equipar item com +HP não cura o herói', () => {
    const priest = Hero.createStarter('p1', 'priest', 'Elara');
    const maxWithoutRing = priest.maxHealth;
    const damaged = Hero.restore({
      ...priest.toProps(),
      currentHealth: maxWithoutRing - 10,
    });

    const equipped = damaged.equip(lifeRing());

    expect(equipped.maxHealth).toBe(maxWithoutRing + 20);
    expect(equipped.currentHealth).toBe(maxWithoutRing - 10);
  });

  it('re-equipar após perder HP máximo mantém vida atual', () => {
    const base = Hero.createStarter('p1', 'priest', 'Elara');
    const ring = lifeRing();
    const withRing = Hero.restore({
      ...base.equip(ring).toProps(),
      currentHealth: base.equip(ring).maxHealth,
    });

    expect(withRing.currentHealth).toBe(withRing.maxHealth);

    const { hero: withoutRing } = withRing.unequip('accessory');
    expect(withoutRing.currentHealth).toBe(withoutRing.maxHealth);

    const reEquipped = withoutRing.equip(ring);

    expect(reEquipped.maxHealth).toBe(withRing.maxHealth);
    expect(reEquipped.currentHealth).toBe(withoutRing.currentHealth);
    expect(reEquipped.currentHealth).toBeLessThan(reEquipped.maxHealth);
  });

  it('desequipar reduz vida atual ao novo máximo quando necessário', () => {
    const base = Hero.createStarter('p1', 'priest', 'Elara');
    const priest = Hero.restore({ ...base.toProps(), currentHealth: base.maxHealth });
    const ring = lifeRing();
    const withRing = priest.equip(ring);

    const { hero: withoutRing } = withRing.unequip('accessory');

    expect(withoutRing.maxHealth).toBe(priest.maxHealth);
    expect(withoutRing.currentHealth).toBe(withoutRing.maxHealth);
  });
});
