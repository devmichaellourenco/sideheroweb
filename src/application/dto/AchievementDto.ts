export interface AchievementUpdateDto {
  id: string;
  title: string;
  description: string;
  previousProgress: number;
  currentProgress: number;
  target: number;
  completed: boolean;
  justCompleted: boolean;
}

export interface AchievementListEntryDto {
  id: string;
  title: string;
  description: string;
  currentProgress: number;
  target: number;
  completed: boolean;
  completedAt: number | null;
  /** 0–1 para barra de progresso. */
  progressRatio: number;
}
