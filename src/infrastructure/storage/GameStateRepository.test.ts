import { beforeEach, describe, expect, it } from 'vitest';
import { PhaseRun } from '../../domain/campaign/PhaseRun';
import { GameState } from '../../domain/entities/GameState';
import { Gear } from '../../domain/entities/Gear';
import { INVENTORY_CAPACITY } from '../../domain/storage/StorageCapacityPolicy';
import { GameStateRepository } from './GameStateRepository';
import { createMemoryKeyValueStore } from './MemoryKeyValueStore';
import { createLocalStorageKeyValueStore } from './LocalStorageKeyValueStore';
import { IKeyValueStore } from './IKeyValueStore';

const STORAGE_KEY = 'side_hero_game_state';
const LEGACY_STORAGE_KEY = 'taskbar_hero_game_state';

describe('GameStateRepository', () => {
  let store: IKeyValueStore;

  beforeEach(() => {
    store = createMemoryKeyValueStore();
  });

  it('persiste loadoutEditOpen e phaseRestartOnResume no roundtrip', async () => {
    const repository = new GameStateRepository(store);
    const paused = GameState.initial()
      .withPhaseRun(PhaseRun.start('1-1'))
      .withCombat(null)
      .withLoadoutEditOpen(true)
      .withPhaseRestartOnResume(true);

    await repository.save(paused);
    const saved = (await store.get(STORAGE_KEY))[STORAGE_KEY] as Record<string, unknown>;
    expect(saved).toMatchObject({
      roster: expect.any(Array),
      loadoutEditOpen: true,
      phaseRestartOnResume: true,
    });
    expect(saved).not.toHaveProperty('heroes');

    const loaded = await repository.load();
    expect(loaded.loadoutEditOpen).toBe(true);
    expect(loaded.phaseRestartOnResume).toBe(true);
    expect(loaded.phaseRun?.phaseId).toBe('1-1');
  });

  it('persiste hub do acampamento (loadoutEditOpen sem phaseRestartOnResume)', async () => {
    const repository = new GameStateRepository(store);
    const camp = GameState.initial()
      .withPhaseRun(null)
      .withCombat(null)
      .withLoadoutEditOpen(true)
      .withPhaseRestartOnResume(false);

    await repository.save(camp);
    const saved = (await store.get(STORAGE_KEY))[STORAGE_KEY] as Record<string, unknown>;
    expect(saved).toMatchObject({
      loadoutEditOpen: true,
      phaseRestartOnResume: false,
    });

    const loaded = await repository.load();
    expect(loaded.loadoutEditOpen).toBe(true);
    expect(loaded.phaseRestartOnResume).toBe(false);
    expect(loaded.phaseRun).toBeNull();
  });

  it('new game / save sem missão abre no acampamento mesmo sem flag legado', async () => {
    const repository = new GameStateRepository(store);
    await repository.save(GameState.initial().withLoadoutEditOpen(false));
    const saved = (await store.get(STORAGE_KEY))[STORAGE_KEY] as Record<string, unknown>;
    await store.set({
      [STORAGE_KEY]: {
        ...saved,
        loadoutEditOpen: false,
        phaseRestartOnResume: false,
        phaseRun: null,
        combat: null,
      },
    });

    const loaded = await repository.load();
    expect(loaded.loadoutEditOpen).toBe(true);
  });

  it('migra save legado taskbar_hero_game_state para side_hero_game_state', async () => {
    const repository = new GameStateRepository(store);
    const paused = GameState.initial().withPhaseRun(PhaseRun.start('2-3'));

    await repository.save(paused);
    const current = (await store.get(STORAGE_KEY))[STORAGE_KEY];
    await store.set({ [LEGACY_STORAGE_KEY]: current });
    await store.remove(STORAGE_KEY);

    const loaded = await repository.load();
    expect(loaded.phaseRun?.phaseId).toBe('2-3');
    expect((await store.get(STORAGE_KEY))[STORAGE_KEY]).toBeDefined();
    expect((await store.get(LEGACY_STORAGE_KEY))[LEGACY_STORAGE_KEY]).toBeUndefined();
  });

  it('carrega saves antigos que só tinham heroes', async () => {
    const repository = new GameStateRepository(store);
    const paused = GameState.initial().withPhaseRun(PhaseRun.start('3-4'));

    await repository.save(paused);
    const saved = (await store.get(STORAGE_KEY))[STORAGE_KEY] as Record<string, unknown>;
    await store.set({
      [STORAGE_KEY]: {
        ...saved,
        heroes: saved.roster,
        roster: undefined,
      },
    });

    const loaded = await repository.load();
    expect(loaded.phaseRun?.phaseId).toBe('3-4');
    expect(loaded.roster.length).toBeGreaterThan(0);
  });

  it('converte excesso de inventário legado em baús com loot garantido', async () => {
    const repository = new GameStateRepository(store);
    const inventory = Array.from({ length: INVENTORY_CAPACITY + 2 }, (_, index) =>
      Gear.create({
        id: `legacy-${index}`,
        name: `Item ${index}`,
        templateId: 'equip_axe_1',
        slot: 'weapon',
        rarity: 'common',
        attackBonus: 1,
        defenseBonus: 0,
        healthBonus: 0,
      }),
    );

    await repository.save(GameState.initial().withInventory(inventory));
    const loaded = await repository.load();

    expect(loaded.inventory).toHaveLength(INVENTORY_CAPACITY);
    expect(loaded.chests).toHaveLength(2);
    expect(loaded.chests.map((chest) => chest.guaranteedLoot?.id)).toEqual([
      'legacy-30',
      'legacy-31',
    ]);
  });

  it('migra save legado via JSON de localStorage', async () => {
    const memory = new Map<string, string>();
    const kv = createLocalStorageKeyValueStore({
      getItem: (key) => memory.get(key) ?? null,
      setItem: (key, value) => {
        memory.set(key, value);
      },
      removeItem: (key) => {
        memory.delete(key);
      },
    });
    const repository = new GameStateRepository(kv);
    await repository.save(GameState.initial().withPhaseRun(PhaseRun.start('2-3')));

    const current = memory.get(STORAGE_KEY);
    expect(current).toBeDefined();
    memory.set(LEGACY_STORAGE_KEY, current as string);
    memory.delete(STORAGE_KEY);

    const loaded = await repository.load();
    expect(loaded.phaseRun?.phaseId).toBe('2-3');
    expect(memory.has(STORAGE_KEY)).toBe(true);
    expect(memory.has(LEGACY_STORAGE_KEY)).toBe(false);
  });
});
