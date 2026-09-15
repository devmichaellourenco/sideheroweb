import { MetaProgress } from '../../domain/meta/MetaProgress';
import { IMetaProgressRepository } from '../../domain/repositories/IMetaProgressRepository';

export class MemoryMetaRepository implements IMetaProgressRepository {
  constructor(private progress = MetaProgress.initial()) {}

  async load(): Promise<MetaProgress> {
    return this.progress;
  }

  async save(progress: MetaProgress): Promise<void> {
    this.progress = progress;
  }
}
