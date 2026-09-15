import { GameState } from '../entities/GameState';

export class PartyEditPolicy {
  static canEdit(state: GameState): boolean {
    if (state.combat !== null) return false;
    if (state.loadoutEditOpen && state.phaseRestartOnResume) return true;
    return state.phaseRun === null;
  }

  static assertEditable(state: GameState): void {
    if (!this.canEdit(state)) {
      throw new Error('Party só pode ser editada fora de combate');
    }
  }
}
