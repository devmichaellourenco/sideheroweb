import type { ISaveBackupStore, SaveBackupSnapshot } from '../../application/ports/ISaveBackupStore';
import { IKeyValueStore } from './IKeyValueStore';
import { createLocalStorageKeyValueStore } from './LocalStorageKeyValueStore';

export const GAME_STATE_STORAGE_KEY = 'side_hero_game_state';
export const ACHIEVEMENTS_STORAGE_KEY = 'side_hero_achievements';
export const META_STORAGE_KEY = 'side_hero_meta_progress';

export class SaveBackupStore implements ISaveBackupStore {
  constructor(private readonly store: IKeyValueStore = createLocalStorageKeyValueStore()) {}

  async readSnapshot(): Promise<SaveBackupSnapshot> {
    const result = await this.store.get([
      GAME_STATE_STORAGE_KEY,
      ACHIEVEMENTS_STORAGE_KEY,
      META_STORAGE_KEY,
    ]);

    return {
      gameState: result[GAME_STATE_STORAGE_KEY] ?? null,
      achievements: result[ACHIEVEMENTS_STORAGE_KEY] ?? null,
      meta: result[META_STORAGE_KEY] ?? null,
    };
  }

  async writeSnapshot(snapshot: SaveBackupSnapshot): Promise<void> {
    const payload: Record<string, unknown> = {};

    if (snapshot.gameState != null) {
      payload[GAME_STATE_STORAGE_KEY] = snapshot.gameState;
    }
    if (snapshot.achievements != null) {
      payload[ACHIEVEMENTS_STORAGE_KEY] = snapshot.achievements;
    }
    if (snapshot.meta != null) {
      payload[META_STORAGE_KEY] = snapshot.meta;
    }

    if (Object.keys(payload).length === 0) {
      throw new Error('Backup sem dados para importar');
    }

    await this.store.set(payload);
  }
}
