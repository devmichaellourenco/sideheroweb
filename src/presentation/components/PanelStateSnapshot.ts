import { GameStateDto } from '../../application/dto/GameStateDto';
import { buildIdleProgress } from './IdleProgressSummary';

// Snapshot / diff de progresso offline — feature DESATIVADA (2026-07); helpers preservados.

const SNAPSHOT_KEY = 'sidehero_panel_snapshot';

export interface PanelSnapshot {
  at: number;
  stage: number;
  gold: number;
  pendingChestCount: number;
  heroLevels: Record<string, number>;
}

export function loadPanelSnapshot(): PanelSnapshot | null {
  try {
    const raw = sessionStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PanelSnapshot;
  } catch {
    return null;
  }
}

function buildSnapshot(state: GameStateDto, at = Date.now()): PanelSnapshot {
  return {
    at,
    stage: state.stage,
    gold: state.gold,
    pendingChestCount: state.pendingChestCount,
    heroLevels: Object.fromEntries(state.heroes.map((hero) => [hero.id, hero.level])),
  };
}

export function touchPanelSnapshot(state: GameStateDto): void {
  try {
    sessionStorage.setItem(SNAPSHOT_KEY, JSON.stringify(buildSnapshot(state)));
  } catch {
    // sessionStorage indisponível
  }
}

export function seedPanelSnapshotIfMissing(state: GameStateDto): void {
  if (loadPanelSnapshot()) return;
  touchPanelSnapshot(state);
}

export function buildIdleSummary(snapshot: PanelSnapshot, state: GameStateDto): string | null {
  const progress = buildIdleProgress(snapshot, state);
  return progress?.toastLine ?? null;
}
