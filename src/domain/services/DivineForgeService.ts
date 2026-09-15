import { GameState } from '../entities/GameState';
import { Gear } from '../entities/Gear';
import { DivineForgePolicy } from '../forge/DivineForgePolicy';
import { calculateForgeSalvageGold } from '../forge/ForgeSalvageGoldCatalog';
import {
  FORGE_FUSE_REQUIRED_COUNT,
  canForgeFuseRarity,
  getNextGearRarity,
} from '../gear/GearRarityProgression';
import { ACTIVE_GEAR_SLOTS } from '../gear/GearSlotCatalog';
import {
  isSalvageBlockedGearTemplate,
  resolveForgeNamedLegendaryTemplate,
} from '../gear/UniqueGearCatalog';
import { GearStorageService } from './GearStorageService';
import { ILootService } from './ILootService';

export interface ForgeFuseResult {
  state: GameState;
  created: Gear;
}

export interface ForgeSalvageResult {
  state: GameState;
  goldGained: number;
}

export class DivineForgeService {
  constructor(
    private readonly lootService: ILootService,
    private readonly gearStorage: GearStorageService = new GearStorageService(),
    private readonly random: () => number = Math.random,
  ) {}

  fuse(state: GameState, gearIds: string[]): ForgeFuseResult {
    if (!DivineForgePolicy.isUnlocked(state.upgradeLevels)) {
      throw new Error('Forja Divina não desbloqueada');
    }

    if (gearIds.length !== FORGE_FUSE_REQUIRED_COUNT) {
      throw new Error(`Selecione exatamente ${FORGE_FUSE_REQUIRED_COUNT} itens`);
    }

    const uniqueIds = new Set(gearIds);
    if (uniqueIds.size !== gearIds.length) {
      throw new Error('Itens duplicados na seleção');
    }

    const gears = gearIds.map((id) => {
      const gear = this.findGear(state, id);
      if (!gear) {
        throw new Error('Item não encontrado no inventário ou no baú');
      }
      return gear;
    });

    const rarity = gears[0].rarity;
    if (!gears.every((gear) => gear.rarity === rarity)) {
      throw new Error('Todos os itens devem ter a mesma raridade');
    }

    if (!canForgeFuseRarity(rarity)) {
      throw new Error('Raridade máxima — não é possível fundir');
    }

    const nextRarity = getNextGearRarity(rarity);
    if (!nextRarity) {
      throw new Error('Raridade máxima — não é possível fundir');
    }

    const remainingInventory = state.inventory.filter((gear) => !uniqueIds.has(gear.id));
    const remainingStash = state.stash.filter((gear) => !uniqueIds.has(gear.id));
    this.gearStorage.assertInventoryHasRoom(remainingInventory.length, 1);

    const slot = ACTIVE_GEAR_SLOTS[Math.floor(Math.random() * ACTIVE_GEAR_SLOTS.length)];
    const forgeTemplateId =
      rarity === 'epic' && nextRarity === 'legendary'
        ? resolveForgeNamedLegendaryTemplate(state, this.random)
        : null;
    const created = forgeTemplateId
      ? this.lootService.generateGearFromTemplate(
          forgeTemplateId,
          state.stage,
          'legendary',
          `forge-unique-${forgeTemplateId}`,
        )
      : this.lootService.generateGearForSlot(state.stage, slot, nextRarity);

    const nextState = state
      .withInventory([...remainingInventory, created])
      .withStash(remainingStash)
      .addLog(
        `Forja Divina: ${FORGE_FUSE_REQUIRED_COUNT} itens fundidos em ${created.name} (${nextRarity}).`,
      );

    return { state: nextState, created };
  }

  salvage(state: GameState, gearId: string): ForgeSalvageResult {
    if (!DivineForgePolicy.isUnlocked(state.upgradeLevels)) {
      throw new Error('Forja Divina não desbloqueada');
    }

    const gear = this.findGear(state, gearId);
    if (!gear) {
      throw new Error('Item não encontrado no inventário ou no baú');
    }

    if (isSalvageBlockedGearTemplate(gear.templateId, gear.catalogItemId)) {
      throw new Error('Itens lendários únicos não podem ser destruídos na forja');
    }

    const goldGained = calculateForgeSalvageGold(gear.rarity, state.stage);
    const nextState = state
      .withInventory(state.inventory.filter((entry) => entry.id !== gearId))
      .withStash(state.stash.filter((entry) => entry.id !== gearId))
      .withGold(state.gold.add(goldGained))
      .addLog(`Forja Divina: ${gear.name} destruído por +${goldGained} ouro.`);

    return { state: nextState, goldGained };
  }

  private findGear(state: GameState, gearId: string): Gear | null {
    return state.inventory.find((entry) => entry.id === gearId) ?? state.stash.find((entry) => entry.id === gearId) ?? null;
  }
}
