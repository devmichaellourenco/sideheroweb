import { describe, expect, it } from 'vitest';
import { Gear } from '../entities/Gear';
import {
  createGearFromCatalogItem,
  getGearCatalogItem,
  listLootCatalogItems,
  resolveCatalogItemId,
  resyncGearFromCatalog,
  stripGearRaritySuffix,
} from './GearItemCatalog';

describe('GearItemCatalog', () => {
  it('cada entrada tem spriteId único e sprite próprio no catálogo', () => {
    const worn = getGearCatalogItem('worn_sword')!;
    const recruit = getGearCatalogItem('recruit_blade')!;

    expect(worn.spriteId).toBe('worn_sword');
    expect(recruit.spriteId).toBe('recruit_blade');
    expect(worn.spriteId).not.toBe(recruit.spriteId);
    expect(worn.sprite).toBeDefined();
    expect(recruit.sprite).toBeDefined();
    expect(worn.slot).toBe('weapon');
    expect(recruit.slot).toBe('weapon');
    expect(worn.attackBonus).toBeGreaterThan(0);
    expect(worn.defenseBonus).toBe(0);
    expect(worn.healthBonus).toBe(0);
    expect(recruit.attackBonus).toBeGreaterThan(worn.attackBonus!);
    expect(recruit.defenseBonus).toBe(0);
    expect(recruit.healthBonus).toBe(0);
  });

  it('createGearFromCatalogItem usa spriteId como templateId', () => {
    const gear = createGearFromCatalogItem('igneous_sword', 'test-fire');

    expect(gear.id).toBe('test-fire');
    expect(gear.catalogItemId).toBe('igneous_sword');
    expect(gear.templateId).toBe('igneous_sword');
    expect(gear.rarity).toBe('rare');
    expect(gear.fireDamageBonus).toBe(6);
  });

  it('resolveCatalogItemId por nome e slot', () => {
    expect(resolveCatalogItemId('Machado do Carrasco (epic)', 'weapon')).toBe('headsman_axe');
    expect(resolveCatalogItemId('Anel de Cobre', 'accessory')).toBe('copper_ring');
  });

  it('lista loot por slot, raridade e faixa de nível do mapa', () => {
    const stendra = listLootCatalogItems('weapon', 'common', 8);

    expect(stendra.length).toBeGreaterThan(0);
    expect(stendra.every((item) => (item.requirements?.minLevel ?? 1) <= 12)).toBe(true);
  });

  it('remove sufixo de raridade do nome', () => {
    expect(stripGearRaritySuffix('Espada do Patrulheiro (rare)')).toBe('Espada do Patrulheiro');
  });

  it('resyncGearFromCatalog reaplica stats preservando id', () => {
    const stale = createGearFromCatalogItem('arcanist_staff', 'keep-me');
    const mutated = Gear.create({
      ...stale.toProps(),
      attackBonus: 1,
      castSpeedBonus: 0,
    });

    const synced = resyncGearFromCatalog(mutated);
    expect(synced.id).toBe('keep-me');
    expect(synced.attackBonus).toBe(getGearCatalogItem('arcanist_staff')!.attackBonus);
    expect(synced.castSpeedBonus).toBe(0.09);
  });

  it('cada cajado declara identidade própria no catálogo', () => {
    const arcanist = getGearCatalogItem('arcanist_staff')!;
    const oracle = getGearCatalogItem('oracle_staff')!;
    const watchtower = getGearCatalogItem('watchtower_staff')!;
    const wind = getGearCatalogItem('wind_rod')!;
    const thunder = getGearCatalogItem('thunder_rod')!;

    expect(arcanist.slot).toBe('weapon');
    expect(arcanist.attackBonus).toBeGreaterThan(0);
    expect(arcanist.defenseBonus).toBe(0);
    expect(arcanist.healthBonus).toBe(0);
    expect(arcanist.castSpeedBonus).toBe(0.09);
    expect(arcanist.allElementalDamageBonus).toBe(10);
    expect(arcanist.requirements).toEqual({ minLevel: 6, int: 3 });

    expect(oracle.cooldownReductionBonus).toBe(8);
    expect(oracle.healthPercentBonus).toBe(6);
    expect(oracle.requirements?.int).toBe(8);

    expect(watchtower.slot).toBe('weapon');
    expect(watchtower.defenseBonus).toBe(0);
    expect(watchtower.healthBonus).toBe(0);
    expect(watchtower.attackBonus).toBeGreaterThan(0);
    expect(watchtower.allElementalResistBonus).toBe(4);

    expect(wind.castSpeedBonus).toBeGreaterThan(thunder.castSpeedBonus!);
    expect(thunder.lightningDamageBonus).toBeGreaterThan(wind.lightningDamageBonus!);
  });
});
