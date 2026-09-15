import { CampaignProgressProps } from '../../domain/campaign/CampaignProgress';
import { CombatIntermissionProps } from '../../domain/campaign/CombatIntermission';
import { Hero } from '../../domain/entities/Hero';
import { GameState } from '../../domain/entities/GameState';
import { Chest } from '../../domain/entities/Chest';
import { Gear } from '../../domain/entities/Gear';
import {
  getUnlockedBattleSkillSlotCount,
  trimEquippedSkillIds,
} from '../../domain/progression/SkillBattleSlots';
import type { ShopStockProps } from '../../domain/shop/ShopStock';
import { UpgradeLevels } from '../../domain/upgrades/FeatureKey';
import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { StorageCapacityPolicy } from '../../domain/storage/StorageCapacityPolicy';
import { IKeyValueStore } from './IKeyValueStore';
import { createLocalStorageKeyValueStore } from './LocalStorageKeyValueStore';
import {
  migrateChest,
  migrateCombat,
  migrateEnemy,
  migrateGear,
  migrateHero,
} from './GameStateMigration';

const STORAGE_KEY = 'side_hero_game_state';
const LEGACY_STORAGE_KEY = 'taskbar_hero_game_state';

/**
 * Hub do acampamento: `loadoutEditOpen` sem exigir `phaseRestartOnResume`.
 * Saves antigos (AND com restart) ou hub sem flag: se não há missão/combate, abre o acampamento.
 */
function resolveLoadoutEditOpenOnLoad(raw: Record<string, unknown>): boolean {
  if (raw.loadoutEditOpen === true) return true;
  const hasPhaseRun = Boolean(raw.phaseRun && typeof raw.phaseRun === 'object');
  const hasCombat = Boolean(raw.combat && typeof raw.combat === 'object');
  if (!hasPhaseRun && !hasCombat) return true;
  return false;
}

function serializeHero(hero: Hero): Record<string, unknown> {
  const heroProps = hero.toProps();
  const equipment = heroProps.equipment ?? {};
  return {
    id: heroProps.id,
    name: heroProps.name,
    heroClass: heroProps.heroClass,
    baseAttack: heroProps.baseAttack,
    baseDefense: heroProps.baseDefense,
    baseMaxHealth: heroProps.baseMaxHealth,
    currentHealth: heroProps.currentHealth,
    experience: {
      current: heroProps.experience.current,
      toNextLevel: heroProps.experience.toNextLevel,
      level: heroProps.experience.level,
    },
    equipment: Object.fromEntries(
      Object.entries(equipment).map(([slot, gear]) => [slot, gear ? gear.toProps() : null]),
    ),
    allocatedAttributes: heroProps.allocatedAttributes,
    unspentImprovementPoints: heroProps.unspentImprovementPoints,
    unspentAscensionPoints: heroProps.unspentAscensionPoints,
    skillRanks: heroProps.skillRanks,
    equippedSkillIds: heroProps.equippedSkillIds,
    ascensionId: heroProps.ascensionId,
  };
}

function normalizeLegacyInventory(
  chests: Chest[],
  inventory: Gear[],
  stage: number,
): { chests: Chest[]; inventory: Gear[] } {
  const limit = StorageCapacityPolicy.inventoryLimit();
  if (inventory.length <= limit) {
    return { chests, inventory };
  }

  const overflowChests = inventory
    .slice(limit)
    .map((gear) => Chest.createWithGuaranteedLoot(stage, 'monster', gear));

  return {
    chests: [...chests, ...overflowChests],
    inventory: inventory.slice(0, limit),
  };
}

export class GameStateRepository implements IGameStateRepository {
  constructor(private readonly store: IKeyValueStore = createLocalStorageKeyValueStore()) {}

  async load(): Promise<GameState> {
    const result = await this.store.get([STORAGE_KEY, LEGACY_STORAGE_KEY]);
    const raw = result[STORAGE_KEY] ?? result[LEGACY_STORAGE_KEY];

    if (!raw || typeof raw !== 'object') {
      const initial = GameState.initial();
      await this.save(initial);
      return initial;
    }

    try {
      const state = this.deserialize(raw);
      if (!result[STORAGE_KEY] && result[LEGACY_STORAGE_KEY]) {
        await this.save(state);
        await this.store.remove(LEGACY_STORAGE_KEY);
      }
      return state;
    } catch {
      const initial = GameState.initial();
      await this.save(initial);
      return initial;
    }
  }

  async save(state: GameState): Promise<void> {
    await this.store.set({ [STORAGE_KEY]: this.serialize(state) });
  }

  private serialize(state: GameState): Record<string, unknown> {
    const props = state.toProps();
    const roster = props.roster ?? props.heroes ?? [];
    const serializedHeroes = roster.map((hero) => serializeHero(hero));

    return {
      roster: serializedHeroes,
      activePartyIds: [...props.activePartyIds ?? []],
      combat: props.combat?.toProps() ?? null,
      campaignProgress: props.campaignProgress,
      phaseRun: props.phaseRun,
      stage: props.stage,
      gold: props.gold,
      chests: props.chests.map((c) => c.toProps()),
      inventory: props.inventory.map((g) => g.toProps()),
      stash: props.stash.map((g) => g.toProps()),
      battleLog: props.battleLog,
      totalBattlesWon: props.totalBattlesWon,
      lastTickAt: props.lastTickAt,
      shopRefreshSeed: props.shopRefreshSeed,
      shopStocks: props.shopStocks,
      upgradeLevels: props.upgradeLevels,
      shopRefreshUses: props.shopRefreshUses,
      loadoutEditOpen: props.loadoutEditOpen === true,
      phaseRestartOnResume: props.phaseRestartOnResume === true,
      combatIntermission: props.combatIntermission,
      battlePaused: props.battlePaused === true,
      battleSessionStats: props.battleSessionStats ?? { damageDealt: 0, healingDone: 0, damageTaken: 0 },
      totalChestsOpened: props.totalChestsOpened ?? 0,
    };
  }

  private deserialize(raw: Record<string, unknown>): GameState {
    const rosterRaw = Array.isArray(raw.roster)
      ? raw.roster
      : Array.isArray(raw.heroes)
        ? raw.heroes
        : [];

    if (rosterRaw.length === 0) {
      throw new Error('Estado sem heróis');
    }

    const roster = rosterRaw.map((hero) => migrateHero(hero));
    const activePartyIds = Array.isArray(raw.activePartyIds)
      ? raw.activePartyIds.filter((id): id is string => typeof id === 'string')
      : undefined;
    const legacyEnemy = migrateEnemy(raw.currentEnemy);

    const upgradeLevels =
      raw.upgradeLevels && typeof raw.upgradeLevels === 'object'
        ? (raw.upgradeLevels as UpgradeLevels)
        : {};

    const normalizedRoster = normalizeHeroEquippedSkills(roster, upgradeLevels);

    const stage = typeof raw.stage === 'number' ? raw.stage : 1;
    const migratedStorage = normalizeLegacyInventory(
      Array.isArray(raw.chests) ? raw.chests.map((c) => migrateChest(c)) : [],
      Array.isArray(raw.inventory) ? raw.inventory.map((g) => migrateGear(g)) : [],
      stage,
    );

    const openedLegacy = migratedStorage.chests.filter((chest) => chest.opened).length;
    const storedOpened =
      typeof raw.totalChestsOpened === 'number' ? Math.max(0, Math.floor(raw.totalChestsOpened)) : 0;
    const totalChestsOpened = Math.max(storedOpened, openedLegacy);
    const pendingChests = migratedStorage.chests.filter((chest) => !chest.opened);

    return GameState.restore({
      roster: normalizedRoster,
      heroes: normalizedRoster,
      activePartyIds,
      combat: migrateCombat(raw.combat, normalizedRoster, legacyEnemy),
      campaignProgress:
        raw.campaignProgress && typeof raw.campaignProgress === 'object'
          ? (raw.campaignProgress as CampaignProgressProps)
          : undefined,
      phaseRun:
        raw.phaseRun && typeof raw.phaseRun === 'object'
          ? (raw.phaseRun as { phaseId: string; waveIndex: number })
          : null,
      stage,
      gold: typeof raw.gold === 'number' ? raw.gold : 0,
      chests: pendingChests,
      inventory: migratedStorage.inventory,
      stash: Array.isArray(raw.stash) ? raw.stash.map((g) => migrateGear(g)) : [],
      battleLog: Array.isArray(raw.battleLog)
        ? (raw.battleLog as { message: string; timestamp: number }[])
        : [],
      totalBattlesWon: typeof raw.totalBattlesWon === 'number' ? raw.totalBattlesWon : 0,
      totalChestsOpened,
      lastTickAt: typeof raw.lastTickAt === 'number' ? raw.lastTickAt : Date.now(),
      shopRefreshSeed: typeof raw.shopRefreshSeed === 'number' ? raw.shopRefreshSeed : 0,
      shopStocks:
        raw.shopStocks && typeof raw.shopStocks === 'object'
          ? (raw.shopStocks as Record<string, ShopStockProps>)
          : {},
      upgradeLevels,
      shopRefreshUses: typeof raw.shopRefreshUses === 'number' ? raw.shopRefreshUses : 0,
      phaseRestartOnResume: raw.phaseRestartOnResume === true,
      loadoutEditOpen: resolveLoadoutEditOpenOnLoad(raw),
      combatIntermission:
        raw.combatIntermission && typeof raw.combatIntermission === 'object'
          ? (raw.combatIntermission as CombatIntermissionProps)
          : null,
      battlePaused: raw.battlePaused === true,
      battleSessionStats:
        raw.battleSessionStats && typeof raw.battleSessionStats === 'object'
          ? (raw.battleSessionStats as {
              damageDealt?: number;
              healingDone?: number;
              damageTaken?: number;
            })
          : undefined,
    });
  }
}

function normalizeHeroEquippedSkills(heroes: Hero[], upgradeLevels: UpgradeLevels): Hero[] {
  const unlockedSlots = getUnlockedBattleSkillSlotCount(upgradeLevels);

  return heroes.map((hero) => {
    const props = hero.toProps();
    const trimmed = trimEquippedSkillIds(props.equippedSkillIds, unlockedSlots);
    const unchanged =
      trimmed.length === props.equippedSkillIds.length &&
      trimmed.every((id, index) => id === props.equippedSkillIds[index]);

    if (unchanged) return hero;

    return Hero.restore({
      ...props,
      equippedSkillIds: trimmed,
    });
  });
}
