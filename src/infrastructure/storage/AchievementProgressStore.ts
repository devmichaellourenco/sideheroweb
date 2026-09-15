import { AchievementProgress } from '../../domain/achievements/AchievementProgress';
import { IAchievementProgressRepository } from '../../domain/repositories/IAchievementProgressRepository';
import { IKeyValueStore } from './IKeyValueStore';
import { createLocalStorageKeyValueStore } from './LocalStorageKeyValueStore';

const STORAGE_KEY = 'side_hero_achievements';

export class AchievementProgressStore implements IAchievementProgressRepository {
  constructor(private readonly store: IKeyValueStore = createLocalStorageKeyValueStore()) {}

  async load(): Promise<AchievementProgress> {
    const raw = await this.store.get(STORAGE_KEY);
    const payload = raw[STORAGE_KEY];
    if (!payload || typeof payload !== 'object') {
      return AchievementProgress.initial();
    }
    return AchievementProgress.restore(payload as Parameters<typeof AchievementProgress.restore>[0]);
  }

  async save(progress: AchievementProgress): Promise<void> {
    await this.store.set({ [STORAGE_KEY]: progress.toProps() });
  }
}
