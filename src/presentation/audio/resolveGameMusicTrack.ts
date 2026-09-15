import { GameMusicTrackId } from './GameMusicCatalog';

/** Estado mínimo para escolher a trilha de fundo. */
export type GameMusicStateSlice = {
  phaseRun: unknown;
};

/**
 * Acampamento quando não há missão ativa; batalha enquanto `phaseRun` existir
 * (inclui intermissão, pausa e overlay de resultado dentro da tentativa).
 */
export function resolveGameMusicTrack(state: GameMusicStateSlice | null): GameMusicTrackId | null {
  if (!state) return null;
  return state.phaseRun ? 'battle' : 'camp';
}
