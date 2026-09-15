import { describe, expect, it, vi } from 'vitest';
import { GameState } from '../entities/GameState';
import { Gear, GearRarity } from '../entities/Gear';
import { FORGE_FUSE_REQUIRED_COUNT } from '../gear/GearRarityProgression';
import { calculateForgeSalvageGold } from '../forge/ForgeSalvageGoldCatalog';
import { SWORD_VORPAL_LUPNUS_TEMPLATE_ID } from '../gear/UniqueGearCatalog';
import { DivineForgeService } from './DivineForgeService';
import { ILootService } from './ILootService';

function forgeGear(id: string, rarity: GearRarity): Gear {
  return Gear.create({
    id,
    name: `Item ${id}`,
    templateId: 'equip_axe_1',
    slot: 'weapon',
    rarity,
    attackBonus: 5,
    defenseBonus: 0,
    healthBonus: 0,
  });
}

function stateWithForgeUnlocked(inventory: Gear[] = []): GameState {
  return GameState.initial()
    .withUpgradeLevels({ divine_forge: 1 })
    .withInventory(inventory)
    .withStage(10);
}

function createService(created = forgeGear('fused', 'uncommon')): DivineForgeService {
  const loot: ILootService = {
    generateGear: vi.fn(),
    generateGearForChest: vi.fn(),
    generateDeterministicGearForSlot: vi.fn(),
    generateGearFromTemplate: vi.fn(),
    generateGearForSlot: vi.fn().mockReturnValue(created),
  };

  return new DivineForgeService(loot);
}

describe('DivineForgeService', () => {
  it('fuse exige forja desbloqueada', () => {
    const service = createService();
    const ids = Array.from({ length: FORGE_FUSE_REQUIRED_COUNT }, (_, i) => `g${i}`);

    expect(() => service.fuse(GameState.initial().withInventory(ids.map((id) => forgeGear(id, 'common'))), ids)).toThrow(
      'Forja Divina não desbloqueada',
    );
  });

  it('fuse exige exatamente 9 itens', () => {
    const service = createService();
    const state = stateWithForgeUnlocked([forgeGear('g1', 'common')]);

    expect(() => service.fuse(state, ['g1'])).toThrow(`Selecione exatamente ${FORGE_FUSE_REQUIRED_COUNT} itens`);
  });

  it('fuse exige mesma raridade em todos os itens', () => {
    const service = createService();
    const inventory = [
      ...Array.from({ length: 8 }, (_, i) => forgeGear(`c${i}`, 'common')),
      forgeGear('r0', 'rare'),
    ];
    const ids = inventory.map((gear) => gear.id);
    const state = stateWithForgeUnlocked(inventory);

    expect(() => service.fuse(state, ids)).toThrow('Todos os itens devem ter a mesma raridade');
  });

  it('fuse rejeita raridade máxima', () => {
    const service = createService();
    const inventory = Array.from({ length: FORGE_FUSE_REQUIRED_COUNT }, (_, i) =>
      forgeGear(`m${i}`, 'mythic'),
    );
    const ids = inventory.map((gear) => gear.id);
    const state = stateWithForgeUnlocked(inventory);

    expect(() => service.fuse(state, ids)).toThrow('Raridade máxima — não é possível fundir');
  });

  it('fuse consome 9 itens e adiciona item da raridade superior', () => {
    const created = forgeGear('fused-result', 'uncommon');
    const service = createService(created);
    const inventory = Array.from({ length: FORGE_FUSE_REQUIRED_COUNT }, (_, i) =>
      forgeGear(`c${i}`, 'common'),
    );
    const ids = inventory.map((gear) => gear.id);
    const state = stateWithForgeUnlocked(inventory);

    const result = service.fuse(state, ids);

    expect(result.created).toBe(created);
    expect(result.state.inventory).toHaveLength(1);
    expect(result.state.inventory[0].id).toBe('fused-result');
    expect(result.state.battleLog.at(-1)?.message).toContain('fundidos');
  });

  it('fuse aceita itens do inventário e do baú', () => {
    const created = forgeGear('fused-result', 'uncommon');
    const service = createService(created);
    const inventory = Array.from({ length: 4 }, (_, i) => forgeGear(`inv-${i}`, 'common'));
    const stash = Array.from({ length: 5 }, (_, i) => forgeGear(`stash-${i}`, 'common'));
    const ids = [...inventory, ...stash].map((gear) => gear.id);
    const state = stateWithForgeUnlocked(inventory).withStash(stash);

    const result = service.fuse(state, ids);

    expect(result.state.inventory).toHaveLength(1);
    expect(result.state.stash).toHaveLength(0);
    expect(result.state.inventory[0].id).toBe('fused-result');
  });

  it('salvage remove item do baú e concede ouro', () => {
    const service = createService();
    const item = forgeGear('stash-salvage', 'rare');
    const state = stateWithForgeUnlocked([]).withStash([item]);
    const expectedGold = calculateForgeSalvageGold('rare', state.stage);

    const result = service.salvage(state, 'stash-salvage');

    expect(result.goldGained).toBe(expectedGold);
    expect(result.state.stash).toHaveLength(0);
    expect(result.state.gold.amount).toBe(expectedGold);
  });

  it('salvage exige forja desbloqueada', () => {
    const service = createService();

    expect(() => service.salvage(GameState.initial().withInventory([forgeGear('g1', 'common')]), 'g1')).toThrow(
      'Forja Divina não desbloqueada',
    );
  });

  it('salvage remove item e concede ouro por raridade', () => {
    const service = createService();
    const item = forgeGear('salvage-1', 'rare');
    const state = stateWithForgeUnlocked([item]);
    const expectedGold = calculateForgeSalvageGold('rare', state.stage);

    const result = service.salvage(state, 'salvage-1');

    expect(result.goldGained).toBe(expectedGold);
    expect(result.state.inventory).toHaveLength(0);
    expect(result.state.gold.amount).toBe(expectedGold);
    expect(result.state.battleLog.at(-1)?.message).toContain('destruído');
  });

  it('fuse épico pode criar Vorpal Lupnus com chance baixa se ainda não possui', () => {
    const vorpal = Gear.create({
      id: 'vorpal-forge',
      name: 'Vorpal Lupnus',
      templateId: SWORD_VORPAL_LUPNUS_TEMPLATE_ID,
      slot: 'weapon',
      rarity: 'legendary',
      attackBonus: 30,
      defenseBonus: 0,
      healthBonus: 0,
    });
    const loot: ILootService = {
      generateGear: vi.fn(),
      generateGearForChest: vi.fn(),
      generateDeterministicGearForSlot: vi.fn(),
      generateGearFromTemplate: vi.fn().mockReturnValue(vorpal),
      generateGearForSlot: vi.fn(),
    };
    const service = new DivineForgeService(loot, undefined, () => 0);
    const inventory = Array.from({ length: FORGE_FUSE_REQUIRED_COUNT }, (_, i) =>
      forgeGear(`e${i}`, 'epic'),
    );
    const ids = inventory.map((gear) => gear.id);

    const result = service.fuse(stateWithForgeUnlocked(inventory), ids);

    expect(result.created.templateId).toBe(SWORD_VORPAL_LUPNUS_TEMPLATE_ID);
    expect(loot.generateGearFromTemplate).toHaveBeenCalled();
  });

  it('salvage bloqueia itens lendários únicos e nomeados', () => {
    const service = createService();
    const vorpal = Gear.create({
      id: 'vorpal',
      name: 'Vorpal Lupnus',
      templateId: SWORD_VORPAL_LUPNUS_TEMPLATE_ID,
      slot: 'weapon',
      rarity: 'legendary',
      attackBonus: 1,
      defenseBonus: 0,
      healthBonus: 0,
    });
    const ignus = Gear.create({
      id: 'ignus',
      name: 'Ignus Ix',
      templateId: 'ignus_ix',
      slot: 'accessory',
      rarity: 'legendary',
      attackBonus: 0,
      defenseBonus: 0,
      healthBonus: 0,
    });

    expect(() => service.salvage(stateWithForgeUnlocked([vorpal]), 'vorpal')).toThrow(
      'lendários únicos',
    );
    expect(() => service.salvage(stateWithForgeUnlocked([ignus]), 'ignus')).toThrow(
      'lendários únicos',
    );
  });
});
