import { listAchievements, listAchievementsForPhaseCleared } from './AchievementCatalog';
import { AchievementDefinition } from './AchievementDefinition';
import { AchievementEntry, AchievementProgress } from './AchievementProgress';

export interface AchievementUpdate {
  definition: AchievementDefinition;
  previousProgress: number;
  currentProgress: number;
  justCompleted: boolean;
}

export interface AchievementRecordResult {
  progress: AchievementProgress;
  updates: AchievementUpdate[];
}

export interface AchievementListEntry {
  definition: AchievementDefinition;
  currentProgress: number;
  completed: boolean;
  completedAt: number | null;
}

export class AchievementService {
  listEntries(progress: AchievementProgress): AchievementListEntry[] {
    return listAchievements().map((definition) => {
      const entry = progress.getEntry(definition.id);
      return {
        definition,
        currentProgress: Math.min(definition.target, entry.current),
        completed: entry.completed || entry.current >= definition.target,
        completedAt: entry.completedAt,
      };
    });
  }

  recordPhaseCleared(
    progress: AchievementProgress,
    phaseId: string,
    now = Date.now(),
  ): AchievementRecordResult {
    const definitions = listAchievementsForPhaseCleared(phaseId);
    let next = progress;
    const updates: AchievementUpdate[] = [];

    for (const definition of definitions) {
      const result = this.advance(next, definition, 1, now);
      next = result.progress;
      if (result.update) {
        updates.push(result.update);
      }
    }

    return { progress: next, updates };
  }

  recordPhaseClears(
    progress: AchievementProgress,
    phaseIds: readonly string[],
    now = Date.now(),
  ): AchievementRecordResult {
    let next = progress;
    const updates: AchievementUpdate[] = [];

    for (const phaseId of phaseIds) {
      const batch = this.recordPhaseCleared(next, phaseId, now);
      next = batch.progress;
      updates.push(...batch.updates);
    }

    return { progress: next, updates };
  }

  private advance(
    progress: AchievementProgress,
    definition: AchievementDefinition,
    amount: number,
    now: number,
  ): { progress: AchievementProgress; update: AchievementUpdate | null } {
    const previous = progress.getEntry(definition.id);
    if (previous.completed || amount <= 0) {
      return { progress, update: null };
    }

    const currentProgress = Math.min(definition.target, previous.current + amount);
    if (currentProgress === previous.current) {
      return { progress, update: null };
    }

    const justCompleted = currentProgress >= definition.target;
    const entry = AchievementEntry.restore({
      current: currentProgress,
      completed: justCompleted,
      completedAt: justCompleted ? now : null,
    });

    return {
      progress: progress.withEntry(definition.id, entry),
      update: {
        definition,
        previousProgress: previous.current,
        currentProgress,
        justCompleted,
      },
    };
  }
}
