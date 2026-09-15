import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { GameStatePresenter } from '../presenters/GameStatePresenter';
import { GameStateDto } from '../dto/GameStateDto';

export class ResumeBattleUseCase {
  constructor(
    private readonly repository: IGameStateRepository,
    private readonly presenter: GameStatePresenter,
  ) {}

  async execute(): Promise<GameStateDto> {
    const state = await this.repository.load();

    if (!state.battlePaused) {
      return this.presenter.present(state);
    }

    const nextState = state.withBattlePaused(false).addLog('▶ Batalha retomada');

    await this.repository.save(nextState);
    return this.presenter.present(nextState);
  }
}
