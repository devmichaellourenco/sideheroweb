import { resolveActSceneById } from '../../domain/campaign/ActSceneCatalog';
import { resolveMissionScene } from '../../domain/campaign/missions/MissionSceneCatalog';
import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { GameStatePresenter } from '../presenters/GameStatePresenter';
import { GameStateDto } from '../dto/GameStateDto';

export class MarkActSceneViewedUseCase {
  constructor(
    private readonly repository: IGameStateRepository,
    private readonly presenter: GameStatePresenter,
  ) {}

  async execute(sceneId: string): Promise<GameStateDto> {
    const state = await this.repository.load();
    const actScene = resolveActSceneById(sceneId);
    const missionScene = resolveMissionScene(sceneId);

    if (!actScene && !missionScene) {
      throw new Error('Cena não encontrada');
    }

    let progress = state.campaignProgress;
    if (actScene) {
      progress = progress.markActSceneViewed(sceneId);
    }
    if (missionScene) {
      progress = progress.withMissionProgress(
        progress.missionProgress.markNarrativeSceneViewed(sceneId),
      );
    }

    const nextState = state.withCampaignProgress(progress);
    await this.repository.save(nextState);
    return this.presenter.present(nextState);
  }
}
