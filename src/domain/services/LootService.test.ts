import { describe, expect, it, vi } from 'vitest';
import { GearSlot } from '../entities/Gear';
import { ACTIVE_GEAR_SLOTS } from '../gear/GearSlotCatalog';
import { getGearCatalogItem, listLootCatalogItems } from '../gear/GearItemCatalog';
import { GALNEON_STANDARD_SWORD_TEMPLATE_ID } from '../gear/GalneonGearCatalog';
import { LootService } from './LootService';

describe('LootService', () => {
  const lootService = new LootService();

  it('generateDeterministicGearForSlot é reprodutível para mesmos parâmetros', () => {
    const first = lootService.generateDeterministicGearForSlot(5, 'weapon', 'rare', 2);
    const second = lootService.generateDeterministicGearForSlot(5, 'weapon', 'rare', 2);

    expect(second.id).toBe(first.id);
    expect(second.catalogItemId).toBe(first.catalogItemId);
    expect(second.rarity).toBe('rare');
    expect(second.slot).toBe('weapon');
  });

  it('generateDeterministicGearForSlot varia por slot e seed', () => {
    const weapon = lootService.generateDeterministicGearForSlot(5, 'weapon', 'common', 0);
    const armor = lootService.generateDeterministicGearForSlot(5, 'armor', 'common', 0);

    expect(weapon.slot).toBe('weapon');
    expect(armor.slot).toBe('armor');
    expect(weapon.catalogItemId).not.toBe(armor.catalogItemId);
  });

  it('generateGearFromTemplate resolve item do catálogo por templateId e raridade', () => {
    const gear = lootService.generateGearFromTemplate(
      GALNEON_STANDARD_SWORD_TEMPLATE_ID,
      8,
      'epic',
      'loot-test-sword',
    );

    expect(gear.id).toBe('loot-test-sword');
    expect(gear.slot).toBe('weapon');
    expect(gear.rarity).toBe('epic');
    expect(gear.templateId).toBe(gear.catalogItemId);
    expect(gear.catalogItemId).toBeDefined();
    expect(gear.attackBonus).toBeGreaterThan(0);
  });

  it('generateGearFromTemplate aceita catalogItemId direto', () => {
    const gear = lootService.generateGearFromTemplate('ignus_ix', 20, 'legendary', 'ignus-test');

    expect(gear.catalogItemId).toBe('ignus_ix');
    expect(gear.name).toBe('Ignus Ix');
    expect(gear.fireDamageBonus).toBe(30);
    expect(gear.fireResistPenetrationBonus).toBe(30);
    expect(gear.requirements.minLevel).toBe(30);
    expect(gear.requirements.int).toBe(28);
  });

  it('generateGearFromTemplate lança para template inválido', () => {
    expect(() => lootService.generateGearFromTemplate('template_inexistente', 1, 'common')).toThrow(
      'Template de equipamento inválido',
    );
  });

  it('generateGearForSlot usa stats fixos do catálogo', () => {
    const gear = lootService.generateGearForSlot(10, 'armor', 'epic');

    expect(gear.slot).toBe('armor');
    expect(gear.rarity).toBe('epic');
    expect(gear.catalogItemId).toBeDefined();
    expect(getGearCatalogItem(gear.catalogItemId!)?.defenseBonus).toBe(gear.defenseBonus);
  });

  it('generateGearForChest retorna item de slot ativo válido', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const gear = lootService.generateGearForChest('boss', 12);

    expect(ACTIVE_GEAR_SLOTS).toContain(gear.slot);
    expect(gear.rarity).toBeDefined();
    expect(gear.catalogItemId).toBeDefined();

    vi.restoreAllMocks();
  });

  it('raridades mais altas têm stats maiores no mesmo template visual', () => {
    const rare = lootService.generateGearFromCatalogItem('scout_axe');
    const epic = lootService.generateGearFromCatalogItem('headsman_axe');

    expect(epic.attackBonus).toBeGreaterThan(rare.attackBonus);
  });

  it('item temático tem bônus elemental fixo no catálogo', () => {
    const gear = lootService.generateGearFromCatalogItem('igneous_sword');

    expect(gear.templateId).toBe('igneous_sword');
    expect(gear.fireDamageBonus).toBe(6);
  });

  it('loot normal respeita faixa de nível do mapa em Stendra', () => {
    const stendraPool = listLootCatalogItems('weapon', 'common', 8);

    expect(stendraPool.length).toBeGreaterThan(0);
    expect(stendraPool.every((item) => (item.requirements?.minLevel ?? 1) <= 12)).toBe(true);
  });

  it('não rola mythic em baú antes do Ato 3 de Valdris', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    for (const stage of [1, 60, 100, 120]) {
      const gear = lootService.generateGearForChest('act_boss', stage);
      expect(gear.rarity).not.toBe('mythic');
    }

    vi.restoreAllMocks();
  });

  it('pode rolar mythic em baú a partir do Ato 3 de Valdris', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const gear = lootService.generateGearForChest('act_boss', 121);
    expect(gear.rarity).toBe('mythic');

    vi.restoreAllMocks();
  });
});
