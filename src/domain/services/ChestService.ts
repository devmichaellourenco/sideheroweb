import { GameState } from '../entities/GameState';
import { Gear } from '../entities/Gear';
import { FeatureAccessPolicy } from '../policies/FeatureAccessPolicy';
import { GearStorageService } from './GearStorageService';
import { ILootService } from './ILootService';

export interface OpenChestResult {
  state: GameState;
  loot: Gear;
}

export interface OpenAllChestsResult {
  state: GameState;
  loots: Gear[];
}

export class ChestService {
  constructor(
    private readonly lootService: ILootService,
    private readonly gearStorageService: GearStorageService = new GearStorageService(),
  ) {}

  openOne(state: GameState, chestId: string): OpenChestResult {
    const chest = state.chests.find((entry) => entry.id === chestId);

    if (!chest) {
      throw new Error('Baú não encontrado');
    }

    if (chest.opened) {
      throw new Error('Baú já foi aberto');
    }

    this.gearStorageService.assertCanAddToInventory(state);
    const loot = this.resolveChestLoot(chest);
    const updatedChests = state.chests.map((entry) =>
      entry.id === chestId ? entry.open(loot) : entry,
    );

    const nextState = state
      .withChests(updatedChests)
      .withInventory([...state.inventory, loot])
      .addLog(`Abriu baú: ${loot.name}`)
      .pruneOpenedChests(1);

    return { state: nextState, loot };
  }

  openAll(state: GameState): OpenAllChestsResult {
    if (!FeatureAccessPolicy.canUse(state.upgradeLevels, 'openAllChests')) {
      throw new Error('Abrir todos os baús não desbloqueado');
    }

    const pendingChests = state.chests.filter((chest) => !chest.opened);
    if (pendingChests.length === 0) {
      return { state, loots: [] };
    }

    const loots: Gear[] = [];
    let updatedChests = [...state.chests];
    let inventory = [...state.inventory];
    let stash = [...state.stash];
    const logs: string[] = [];

    for (const chest of pendingChests) {
      const destination = this.gearStorageService.resolveLootDestination(
        state.upgradeLevels,
        inventory.length,
        stash.length,
      );

      if (!destination) {
        break;
      }

      const loot = this.resolveChestLoot(chest);
      updatedChests = updatedChests.map((entry) =>
        entry.id === chest.id ? entry.open(loot) : entry,
      );

      if (destination === 'inventory') {
        inventory = [...inventory, loot];
      } else {
        stash = [...stash, loot];
      }

      loots.push(loot);
      logs.push(loot.name);
    }

    if (loots.length === 0) {
      return { state, loots: [] };
    }

    const remaining = pendingChests.length - loots.length;
    const logMessage =
      remaining > 0
        ? `Abriu ${loots.length} baús (${remaining} pendentes — sem espaço): ${logs.join(', ')}`
        : `Abriu ${loots.length} baús: ${logs.join(', ')}`;

    const nextState = state
      .withChests(updatedChests)
      .withInventory(inventory)
      .withStash(stash)
      .addLog(logMessage)
      .pruneOpenedChests(loots.length);

    return { state: nextState, loots };
  }

  private resolveChestLoot(chest: GameState['chests'][number]): Gear {
    return (
      chest.guaranteedLoot ??
      this.lootService.generateGearForChest(chest.chestType, chest.stageEarned)
    );
  }
}
