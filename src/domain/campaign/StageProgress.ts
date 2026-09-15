import { PhaseDefinition } from './PhaseDefinition';
import { WaveDefinition } from './WaveDefinition';

export type StageProgressMarkerKind = 'trash' | 'elite' | 'boss' | 'chest' | 'portal';
export type StageProgressMarkerStatus = 'cleared' | 'current' | 'locked';

export interface StageProgressMarker {
  id: string;
  kind: StageProgressMarkerKind;
  label: string;
  status: StageProgressMarkerStatus;
  waveIndex: number;
  /** Posição 0..1 no trilho (já com lead-in; boss = 1). */
  trackRatio: number;
}

export interface StageProgressSnapshot {
  phaseId: string;
  displayName: string;
  fillRatio: number;
  markers: StageProgressMarker[];
}

/**
 * Fração do trilho antes do 1º marcador.
 * Visual: [---(1)---(2)---(boss)] em vez de [(1)---(2)---(boss)].
 */
export const STAGE_PROGRESS_LEAD_IN = 0.14;

/**
 * Posição 0..1 no trilho: lead-in até o 1º ícone; boss ancorado no fim (1).
 */
export function markerTrackRatio(waveIndex: number, markerCount: number): number {
  if (markerCount <= 1) return 1;
  const t = waveIndex / (markerCount - 1);
  return STAGE_PROGRESS_LEAD_IN + (1 - STAGE_PROGRESS_LEAD_IN) * t;
}

/** Role dominante da wave para o marcador da timeline. */
export function resolveWaveMarkerKind(
  wave: WaveDefinition,
  isBossWave: boolean,
): Exclude<StageProgressMarkerKind, 'chest' | 'portal'> {
  if (isBossWave) return 'boss';
  if (wave.slots.some((slot) => slot.role === 'boss')) return 'boss';
  if (wave.slots.some((slot) => slot.role === 'elite')) return 'elite';
  return 'trash';
}

function markerLabel(
  kind: Exclude<StageProgressMarkerKind, 'chest' | 'portal'>,
  waveIndex: number,
  _waveCount: number,
): string {
  if (kind === 'boss') return 'Boss';
  if (kind === 'elite') return 'Elite';
  return `W${waveIndex + 1}`;
}

function markerStatus(
  waveIndex: number,
  currentWaveIndex: number,
): StageProgressMarkerStatus {
  if (waveIndex < currentWaveIndex) return 'cleared';
  if (waveIndex === currentWaveIndex) return 'current';
  return 'locked';
}

/** Snapshot puro da timeline a partir da definição da fase + wave atual. */
export function buildStageProgress(
  phase: PhaseDefinition,
  waveIndex: number,
): StageProgressSnapshot {
  const waveCount = phase.waves.length;
  const safeIndex = Math.max(0, Math.min(waveIndex, Math.max(0, waveCount - 1)));
  const fillRatio = markerTrackRatio(safeIndex, waveCount);

  const markers: StageProgressMarker[] = phase.waves.map((wave, index) => {
    const isBossWave = index === waveCount - 1;
    const kind = resolveWaveMarkerKind(wave, isBossWave);
    return {
      id: `${phase.id}:${wave.id}`,
      kind,
      label: markerLabel(kind, index, waveCount),
      status: markerStatus(index, safeIndex),
      waveIndex: index,
      trackRatio: markerTrackRatio(index, waveCount),
    };
  });

  return {
    phaseId: phase.id,
    displayName: phase.displayName,
    fillRatio,
    markers,
  };
}
