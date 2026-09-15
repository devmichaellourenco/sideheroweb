import { describe, expect, it, vi } from 'vitest';
import { Chest } from '../entities/Chest';
import { GameState } from '../entities/GameState';
import { Gear } from '../entities/Gear';
import { INVENTORY_CAPACITY } from '../storage/StorageCapacityPolicy';
import { ChestService } from './ChestService';
import { ILootService } from './ILootService';

function lootGear(id: string): Gear {
  return Gear.create({
    id,
    name: `Loot ${id}`,
    templateId: 'equip_axe_1',
    slot: 'weapon',
    rarity: 'common',
    attackBonus: 1,
    defenseBonus: 0,
    healthBonus: 0,
  });
}

function fillInventory(count: number): Gear[] {
  return Array.from({ length: count }, (_, index) => lootGear(`inv-${index}`));
}

function pendingChest(id: string): Chest {
  return Chest.restore({
    id,
    stageEarned: 1,
    chestType: 'monster',
    opened: false,
    loot: null,
  });
}

function stateWithOpenAll(options: {
  inventory?: Gear[];
  stash?: Gear[];
  chests?: Chest[];
  upgradeLevels?: GameState['upgradeLevels'];
}): GameState {
  return GameState.initial()
    .withUpgradeLevels({ open_all_chests: 1, ...(options.upgradeLevels ?? {}) })
    .withInventory(options.inventory ?? [])
    .withStash(options.stash ?? [])
    .withChests(options.chests ?? []);
}

function createService(lootIds: string[]): ChestService {
  let index = 0;
  const loot: ILootService = {
    generateGear: vi.fn(),
    generateGearForChest: vi.fn().mockImplementation(() => lootGear(lootIds[index++] ?? `loot-${index}`)),
    generateDeterministicGearForSlot: vi.fn(),
    generateGearFromCatalogItem: vi.fn(),
    generateGearFromTemplate: vi.fn(),
    generateGearForSlot: vi.fn(),
  };

  return new ChestService(loot);
}

describe('ChestService.openAll', () => {
  it('entrega o loot garantido sem sortear outro gear', () => {
    const guaranteed = lootGear('unique-ignus');
    const chest = Chest.createWithGuaranteedLoot(50, 'act_boss', guaranteed);
    const lootService: ILootService = {
      generateGear: vi.fn(),
      generateGearForChest: vi.fn(),
      generateDeterministicGearForSlot: vi.fn(),
      generateGearFromCatalogItem: vi.fn(),
      generateGearFromTemplate: vi.fn(),
      generateGearForSlot: vi.fn(),
    };
    const service = new ChestService(lootService);
    const state = stateWithOpenAll({ chests: [chest] });

    const result = service.openAll(state);

    expect(result.loots).toEqual([guaranteed]);
    expect(result.state.inventory).toEqual([guaranteed]);
    expect(result.state.chests).toHaveLength(0);
    expect(result.state.chestsOpenedCount()).toBe(1);
    expect(lootService.generateGearForChest).not.toHaveBeenCalled();
  });

  it('abre todos os baús quando há espaço no inventário', () => {
    const service = createService(['loot-1', 'loot-2']);
    const chests = [pendingChest('c1'), pendingChest('c2')];
    const state = stateWithOpenAll({ chests });

    const { state: nextState, loots } = service.openAll(state);

    expect(loots).toHaveLength(2);
    expect(nextState.inventory.map((gear) => gear.id)).toEqual(['loot-1', 'loot-2']);
    expect(nextState.chests).toHaveLength(0);
    expect(nextState.chestsOpenedCount()).toBe(2);
  });

  it('abre parcialmente quando o inventário não comporta todos os loots', () => {
    const service = createService(['loot-1', 'loot-2', 'loot-3']);
    const chests = [pendingChest('c1'), pendingChest('c2'), pendingChest('c3')];
    const state = stateWithOpenAll({
      inventory: fillInventory(INVENTORY_CAPACITY - 1),
      chests,
    });

    const { state: nextState, loots } = service.openAll(state);

    expect(loots).toHaveLength(1);
    expect(nextState.inventory).toHaveLength(INVENTORY_CAPACITY);
    expect(nextState.chests.filter((chest) => !chest.opened)).toHaveLength(2);
    expect(nextState.chestsOpenedCount()).toBe(1);
  });

  it('enche o inventário e depois distribui no baú de itens', () => {
    const service = createService(['loot-1', 'loot-2', 'loot-3']);
    const chests = [pendingChest('c1'), pendingChest('c2'), pendingChest('c3')];
    const state = stateWithOpenAll({
      inventory: fillInventory(INVENTORY_CAPACITY),
      chests,
      upgradeLevels: { open_all_chests: 1, item_stash: 1 },
    });

    const { state: nextState, loots } = service.openAll(state);

    expect(loots).toHaveLength(3);
    expect(nextState.inventory).toHaveLength(INVENTORY_CAPACITY);
    expect(nextState.stash.map((gear) => gear.id)).toEqual(['loot-1', 'loot-2', 'loot-3']);
    expect(nextState.chests).toHaveLength(0);
    expect(nextState.chestsOpenedCount()).toBe(3);
  });

  it('usa inventário e baú até esgotar espaço e deixa o restante pendente', () => {
    const service = createService(['loot-1', 'loot-2', 'loot-3', 'loot-4']);
    const chests = [pendingChest('c1'), pendingChest('c2'), pendingChest('c3'), pendingChest('c4')];
    const state = stateWithOpenAll({
      inventory: fillInventory(INVENTORY_CAPACITY - 1),
      stash: fillInventory(22),
      chests,
      upgradeLevels: { open_all_chests: 1, item_stash: 1 },
    });

    const { state: nextState, loots } = service.openAll(state);

    expect(loots).toHaveLength(3);
    expect(nextState.inventory).toHaveLength(INVENTORY_CAPACITY);
    expect(nextState.stash).toHaveLength(24);
    expect(nextState.chests.filter((chest) => !chest.opened)).toHaveLength(1);
    expect(nextState.chestsOpenedCount()).toBe(3);
  });

  it('não abre nenhum baú quando inventário e baú estão cheios', () => {
    const service = createService(['loot-1']);
    const chests = [pendingChest('c1'), pendingChest('c2')];
    const state = stateWithOpenAll({
      inventory: fillInventory(INVENTORY_CAPACITY),
      stash: fillInventory(24),
      chests,
      upgradeLevels: { open_all_chests: 1, item_stash: 1 },
    });

    const { state: nextState, loots } = service.openAll(state);

    expect(loots).toHaveLength(0);
    expect(nextState).toBe(state);
    expect(nextState.chests.filter((chest) => !chest.opened)).toHaveLength(2);
  });
});
