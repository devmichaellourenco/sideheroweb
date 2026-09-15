import { DamageElement } from '../combat/DamageElement';
import { EnemyType } from '../entities/EnemyType';
import { PhaseChallengeKind } from './PhaseChallengeTypes';
import { EnemySlot, WaveDefinition } from './WaveDefinition';

export function wave(id: string, slots: EnemySlot[], goldMultiplier = 1): WaveDefinition {
  return { id, slots, goldMultiplier };
}

export function trash(type: EnemyType, count = 1): EnemySlot {
  return { enemyType: type, role: 'trash', count };
}

export function elite(type: EnemyType, count = 1, displayName?: string): EnemySlot {
  return { enemyType: type, role: 'elite', count, displayName };
}

export function boss(type: EnemyType, count = 1, displayName?: string): EnemySlot {
  return { enemyType: type, role: 'boss', count, displayName };
}

export interface PhaseChallengeBlueprint {
  kind: PhaseChallengeKind;
  spikeElement?: DamageElement;
  /** Resistência ofensiva dos inimigos (kind warded). */
  wardedElement?: DamageElement;
  label: string;
  hint: string;
  displayName?: string;
  waves: WaveDefinition[];
  /** Soft: race < 1; sustain/spike/warded/armored levemente acima do baseline. */
  statMultiplier: number;
}
