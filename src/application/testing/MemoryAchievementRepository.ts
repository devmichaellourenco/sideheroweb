import { AchievementProgress } from '../../domain/achievements/AchievementProgress';
import { IAchievementProgressRepository } from '../../domain/repositories/IAchievementProgressRepository';

export class MemoryAchievementRepository implements IAchievementProgressRepository {
  constructor(private progress = AchievementProgress.initial()) {}

  async load(): Promise<AchievementProgress> {
    return this.progress;
  }

  async save(progress: AchievementProgress): Promise<void> {
    this.progress = progress;
  }
}
