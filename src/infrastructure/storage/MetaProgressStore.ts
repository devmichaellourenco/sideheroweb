import { MetaProgress } from '../../domain/meta/MetaProgress';
import { IMetaProgressRepository } from '../../domain/repositories/IMetaProgressRepository';
import { IKeyValueStore } from './IKeyValueStore';
import { createLocalStorageKeyValueStore } from './LocalStorageKeyValueStore';

const STORAGE_KEY = 'side_hero_meta_progress';

export class MetaProgressStore implements IMetaProgressRepository {
  constructor(private readonly store: IKeyValueStore = createLocalStorageKeyValueStore()) {}

  async load(): Promise<MetaProgress> {
    const result = await this.store.get(STORAGE_KEY);
    const raw = result[STORAGE_KEY];

    if (!raw || typeof raw !== 'object') {
      return MetaProgress.initial();
    }

    return MetaProgress.restore(raw as Record<string, unknown>);
  }

  async save(progress: MetaProgress): Promise<void> {
    await this.store.set({ [STORAGE_KEY]: progress.toProps() });
  }
}
