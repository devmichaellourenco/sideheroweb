import { GameStateDto, HeroDto } from '../../application/dto/GameStateDto';
import { PanelSnapshot } from './PanelStateSnapshot';

// OFFLINE PROGRESS DESATIVADO (2026-07)
// const MIN_IDLE_MS = 8000;

export interface IdleProgressSummary {
  idleMs: number;
  detailLines: string[];
  toastLine: string;
  leveledHeroes: HeroDto[];
}

export function formatIdleDuration(idleMs: number): string {
  const totalMinutes = Math.floor(idleMs / 60_000);
  if (totalMinutes < 1) return 'Poucos segundos fora';
  if (totalMinutes < 60) return `${totalMinutes} min fora`;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) return `${hours}h fora`;
  return `${hours}h ${minutes}min fora`;
}

/**
 * Relatório de ganhos enquanto o painel esteve fechado.
 * OFFLINE PROGRESS DESATIVADO (2026-07): sempre null.
 */
export function buildIdleProgress(
  _snapshot: PanelSnapshot,
  _state: GameStateDto,
): IdleProgressSummary | null {
  return null;

  // --- original (reativar offline progress) ---
  // const idleMs = Date.now() - snapshot.at;
  // if (idleMs < MIN_IDLE_MS) return null;
  //
  // const stagesGained = state.stage - snapshot.stage;
  // const goldGained = state.gold - snapshot.gold;
  // const chestsGained = state.pendingChestCount - snapshot.pendingChestCount;
  //
  // const leveledHeroes = state.heroes.filter((hero) => {
  //   const previousLevel = snapshot.heroLevels[hero.id];
  //   return previousLevel !== undefined && hero.level > previousLevel;
  // });
  // const levelUps = leveledHeroes.map((hero) => `${hero.name} → Lv.${hero.level}`);
  //
  // const statLines: string[] = [];
  //
  // if (stagesGained > 0) {
  //   statLines.push(`+${stagesGained} fase${stagesGained > 1 ? 's' : ''}`);
  // }
  // if (goldGained > 0) {
  //   statLines.push(`+${goldGained} ouro`);
  // }
  // if (chestsGained > 0) {
  //   statLines.push(`+${chestsGained} baú${chestsGained > 1 ? 's' : ''}`);
  // }
  //
  // if (statLines.length === 0 && levelUps.length === 0) return null;
  //
  // const detailLines = [formatIdleDuration(idleMs), ...statLines, ...levelUps];
  // const toastParts = [...statLines, ...levelUps];
  //
  // return {
  //   idleMs,
  //   detailLines,
  //   toastLine: `Enquanto você estava fora: ${toastParts.join(' · ')}`,
  //   leveledHeroes,
  // };
}
