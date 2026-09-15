import { GameStateDto } from '../../application/dto/GameStateDto';

/**
 * Snapshot do estado no início da tentativa (hub / START), para o overlay
 * de CLEAR/DEFEAT somar ouro/XP de todos os kills — não só o último tick.
 */
export function updateBattleAttemptBaseline(
  current: GameStateDto | null,
  previous: GameStateDto | null,
  next: GameStateDto,
): GameStateDto | null {
  if (next.phaseRun && !previous?.phaseRun) {
    return previous ?? next;
  }

  if (!next.phaseRun && !next.combatIntermission) {
    return null;
  }

  return current;
}
