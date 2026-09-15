import { GameStateDto } from '../../application/dto/GameStateDto';

export function resolveBattleStripPhaseId(state: GameStateDto): string | null {
  return state.phaseRun?.phaseId ?? state.campaignProgress.selectedPhaseId ?? null;
}

export function hasBattleStripPhaseChanged(
  previousPhaseId: string | null,
  nextPhaseId: string | null,
): boolean {
  if (!previousPhaseId || !nextPhaseId) return false;
  return previousPhaseId !== nextPhaseId;
}

export function buildBattleStripStructureKey(state: GameStateDto): string {
  return [
    state.activeParty.map((hero) => hero.id).join(','),
    state.enemies.map((enemy) => enemy.id).join(','),
    state.phaseRun?.isBossWave ? '1' : '0',
  ].join('|');
}

export function battleStripDomMatchesStructure(
  state: GameStateDto,
  heroesContainer: HTMLElement,
  enemyContainer: HTMLElement,
): boolean {
  const heroIds = state.activeParty.map((hero) => hero.id);
  if (heroesContainer.querySelectorAll('[data-hero-id]').length !== heroIds.length) {
    return false;
  }

  for (const id of heroIds) {
    if (!heroesContainer.querySelector(`[data-hero-id="${id}"]`)) {
      return false;
    }
  }

  if (state.enemies.length === 0) {
    return enemyContainer.querySelector('.empty-state') !== null;
  }

  if (!enemyContainer.querySelector('.enemies-row')) {
    return false;
  }

  if (enemyContainer.querySelectorAll('[data-enemy-id]').length !== state.enemies.length) {
    return false;
  }

  for (const enemy of state.enemies) {
    if (!enemyContainer.querySelector(`[data-enemy-id="${enemy.id}"]`)) {
      return false;
    }
  }

  return true;
}
