import { GameState } from '../entities/GameState';
import { Gear } from '../entities/Gear';
import { StorageCapacityPolicy } from '../storage/StorageCapacityPolicy';

export type GearStorageLocation = 'inventory' | 'stash';

export class GearStorageService {
  moveToStash(state: GameState, gearId: string): GameState {
    if (!StorageCapacityPolicy.isStashUnlocked(state.upgradeLevels)) {
      throw new Error('Baú de itens não desbloqueado');
    }

    const gear = state.inventory.find((entry) => entry.id === gearId);
    if (!gear) {
      throw new Error('Item não encontrado no inventário');
    }

    if (!StorageCapacityPolicy.canAddToStash(state.upgradeLevels, state.stash.length)) {
      throw new Error('Baú cheio');
    }

    return state
      .withInventory(state.inventory.filter((entry) => entry.id !== gearId))
      .withStash([...state.stash, gear])
      .addLog(`${gear.name} guardado no baú.`);
  }

  moveFromStash(state: GameState, gearId: string): GameState {
    if (!StorageCapacityPolicy.isStashUnlocked(state.upgradeLevels)) {
      throw new Error('Baú de itens não desbloqueado');
    }

    const gear = state.stash.find((entry) => entry.id === gearId);
    if (!gear) {
      throw new Error('Item não encontrado no baú');
    }

    if (!StorageCapacityPolicy.canAddToInventory(state.inventory.length)) {
      throw new Error('Inventário cheio');
    }

    return state
      .withStash(state.stash.filter((entry) => entry.id !== gearId))
      .withInventory([...state.inventory, gear])
      .addLog(`${gear.name} retirado do baú.`);
  }

  destroy(state: GameState, gearId: string, location: GearStorageLocation): GameState {
    const gear = this.findGear(state, gearId, location);
    if (!gear) {
      throw new Error('Item não encontrado');
    }

    const nextState =
      location === 'inventory'
        ? state.withInventory(state.inventory.filter((entry) => entry.id !== gearId))
        : state.withStash(state.stash.filter((entry) => entry.id !== gearId));

    return nextState.addLog(`${gear.name} destruído.`);
  }

  assertCanAddToInventory(state: GameState, count = 1): void {
    this.assertInventoryHasRoom(state.inventory.length, count);
  }

  assertInventoryHasRoom(currentCount: number, adding = 1): void {
    if (currentCount + adding > StorageCapacityPolicy.inventoryLimit()) {
      throw new Error('Inventário cheio — mova itens para o baú ou destrua algum item.');
    }
  }

  resolveLootDestination(
    levels: GameState['upgradeLevels'],
    inventoryCount: number,
    stashCount: number,
  ): GearStorageLocation | null {
    if (StorageCapacityPolicy.canAddToInventory(inventoryCount)) {
      return 'inventory';
    }

    if (
      StorageCapacityPolicy.isStashUnlocked(levels) &&
      StorageCapacityPolicy.canAddToStash(levels, stashCount)
    ) {
      return 'stash';
    }

    return null;
  }

  private findGear(
    state: GameState,
    gearId: string,
    location: GearStorageLocation,
  ): Gear | undefined {
    const list = location === 'inventory' ? state.inventory : state.stash;
    return list.find((entry) => entry.id === gearId);
  }
}
