export type AchievementEventType = 'phase_cleared';

export interface AchievementDefinition {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  /** Valor alvo para 100% (ex.: 1 = evento único). */
  readonly target: number;
  readonly event: AchievementEventType;
  /** Quando `event === 'phase_cleared'`, phaseId exigido (ex.: `1-1`). */
  readonly phaseId?: string;
}
