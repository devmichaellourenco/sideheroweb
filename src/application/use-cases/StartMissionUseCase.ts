import { MissionId } from '../../domain/campaign/missions/MissionId';
import { startMissionOnState } from '../../domain/campaign/missions/ResolveMissionOutcome';
import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { GameStateDto } from '../dto/GameStateDto';
import { GameStatePresenter } from '../presenters/GameStatePresenter';

export class StartMissionUseCase {
  constructor(
    private readonly repository: IGameStateRepository,
    private readonly presenter: GameStatePresenter,
  ) {}

  async execute(missionId: MissionId): Promise<GameStateDto> {
    const state = await this.repository.load();
    const result = startMissionOnState({ state, missionId });

    if (result.error) {
      throw new Error(result.error);
    }

    await this.repository.save(result.state);
    return this.presenter.present(result.state);
  }
}
