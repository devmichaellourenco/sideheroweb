import { AchievementProgress } from '../achievements/AchievementProgress';

export interface IAchievementProgressRepository {
  load(): Promise<AchievementProgress>;
  save(progress: AchievementProgress): Promise<void>;
}
