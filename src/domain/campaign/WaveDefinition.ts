import { EnemyType } from '../entities/EnemyType';

export type EnemyRole = 'trash' | 'elite' | 'boss';

export interface EnemySlot {
  enemyType: EnemyType;
  role: EnemyRole;
  count: number;
  /** Nome exibido no combate (ex.: boss único "Saci" sem prefixo "Boss"). */
  displayName?: string;
  /** Level de combate; se omitido, usa difficultyTier da fase. */
  level?: number;
}

export interface WaveDefinition {
  id: string;
  slots: EnemySlot[];
  goldMultiplier?: number;
}
