import { PhaseDefinition } from './PhaseDefinition';
import { EnemySlot, WaveDefinition } from './WaveDefinition';

/** Máximo de inimigos simultâneos por wave (layout da battle strip). */
export const MAX_ENEMIES_PER_WAVE = 3;

export function countWaveEnemies(wave: Pick<WaveDefinition, 'slots'>): number {
  return wave.slots.reduce((sum, slot) => sum + slot.count, 0);
}

function roleReductionPriority(role: EnemySlot['role']): number {
  if (role === 'trash') return 0;
  if (role === 'elite') return 1;
  return 2;
}

/**
 * Reduz slots até `max` inimigos. Preferência: baixar count de trash, depois elite;
 * boss só como último recurso (mantém ao menos 1 se for o único remanescente).
 */
export function capWaveToMaxEnemies(
  wave: WaveDefinition,
  max = MAX_ENEMIES_PER_WAVE,
): WaveDefinition {
  let total = countWaveEnemies(wave);
  if (total <= max) return wave;

  const slots: EnemySlot[] = wave.slots.map((slot) => ({ ...slot }));

  while (total > max) {
    let bestIndex = -1;
    for (let index = 0; index < slots.length; index++) {
      const slot = slots[index];
      if (slot.count <= 0) continue;

      const alive = slots.filter((entry) => entry.count > 0);
      if (slot.role === 'boss' && slot.count === 1 && alive.length === 1) {
        continue;
      }

      if (bestIndex < 0) {
        bestIndex = index;
        continue;
      }

      const candidate = slot;
      const current = slots[bestIndex];
      const roleDelta =
        roleReductionPriority(candidate.role) - roleReductionPriority(current.role);
      if (roleDelta < 0 || (roleDelta === 0 && candidate.count > current.count)) {
        bestIndex = index;
      }
    }

    if (bestIndex < 0) break;

    slots[bestIndex] = {
      ...slots[bestIndex],
      count: slots[bestIndex].count - 1,
    };
    total -= 1;
  }

  return {
    ...wave,
    slots: slots.filter((slot) => slot.count > 0),
  };
}

export function capPhaseWavesToMaxEnemies(phase: PhaseDefinition): PhaseDefinition {
  return {
    ...phase,
    waves: phase.waves.map((wave) => capWaveToMaxEnemies(wave)),
  };
}
