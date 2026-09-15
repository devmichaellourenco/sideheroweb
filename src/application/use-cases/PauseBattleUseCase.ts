import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { GameStatePresenter } from '../presenters/GameStatePresenter';
import { GameStateDto } from '../dto/GameStateDto';

export class PauseBattleUseCase {
  constructor(
    private readonly repository: IGameStateRepository,
    private readonly presenter: GameStatePresenter,
  ) {}

  async execute(): Promise<GameStateDto> {
    const state = await this.repository.load();

    if (state.battlePaused) {
      return this.presenter.present(state);
    }

    if (state.loadoutEditOpen && state.phaseRestartOnResume) {
      throw new Error('Não é possível pausar a batalha no acampamento');
    }

    if (!state.phaseRun || !state.combat) {
      throw new Error('Não há batalha ativa para pausar');
    }

    if (state.combatIntermission) {
      throw new Error('Aguarde o resultado da wave para pausar');
    }

    const nextState = state.withBattlePaused(true).addLog('⏸ Batalha pausada');

    await this.repository.save(nextState);
    return this.presenter.present(nextState);
  }
}
