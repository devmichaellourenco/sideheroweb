import { AchievementListEntry, AchievementUpdate } from '../../domain/achievements/AchievementService';
import { AchievementListEntryDto, AchievementUpdateDto } from '../dto/AchievementDto';

export function mapAchievementUpdates(updates: readonly AchievementUpdate[]): AchievementUpdateDto[] {
  return updates.map((update) => ({
    id: update.definition.id,
    title: update.definition.title,
    description: update.definition.description,
    previousProgress: update.previousProgress,
    currentProgress: update.currentProgress,
    target: update.definition.target,
    completed: update.currentProgress >= update.definition.target,
    justCompleted: update.justCompleted,
  }));
}

export function mapAchievementList(
  entries: readonly AchievementListEntry[],
): AchievementListEntryDto[] {
  return entries.map((entry) => {
    const target = Math.max(1, entry.definition.target);
    const currentProgress = Math.min(target, entry.currentProgress);
    return {
      id: entry.definition.id,
      title: entry.definition.title,
      description: entry.definition.description,
      currentProgress,
      target,
      completed: entry.completed,
      completedAt: entry.completedAt,
      progressRatio: Math.min(1, currentProgress / target),
    };
  });
}
