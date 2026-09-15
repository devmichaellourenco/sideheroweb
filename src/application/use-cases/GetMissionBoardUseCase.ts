import { MapId } from '../../domain/campaign/CampaignIds';
import {
  buildCampMissionBoard,
  currentMainPhaseNumberForMap,
  ensureNormalOfferForBoard,
} from '../../domain/campaign/missions/CampMissionBoard';
import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { MissionBoardDto } from '../dto/MissionBoardDto';
import { GameStateDto } from '../dto/GameStateDto';
import { mapMissionBoard } from '../mappers/MissionBoardMapper';
import { GameStatePresenter } from '../presenters/GameStatePresenter';

export interface GetMissionBoardResult {
  state: GameStateDto;
  board: MissionBoardDto;
}

export class GetMissionBoardUseCase {
  constructor(
    private readonly repository: IGameStateRepository,
    private readonly presenter: GameStatePresenter,
  ) {}

  async execute(mapId: MapId): Promise<GetMissionBoardResult> {
    let state = await this.repository.load();
    let missionProgress = state.campaignProgress.missionProgress;
    const currentMainPhaseNumber = currentMainPhaseNumberForMap(
      mapId,
      missionProgress.completedMainIds,
    );
    const ensured = ensureNormalOfferForBoard({
      mapId,
      saveSeed: missionProgress.offerSeed,
      offerEpoch: missionProgress.offerEpochFor(mapId),
      currentOffer: missionProgress.normalOfferFor(mapId),
      currentMainPhaseNumber,
    });
    missionProgress = missionProgress.withNormalOffer(mapId, ensured.offer, ensured.offerEpoch);

    if (
      missionProgress.normalOfferFor(mapId).join('|') !==
      state.campaignProgress.missionProgress.normalOfferFor(mapId).join('|')
    ) {
      state = state.withCampaignProgress(
        state.campaignProgress.withMissionProgress(missionProgress),
      );
      await this.repository.save(state);
    }

    const board = buildCampMissionBoard({
      mapId,
      completedMainIds: missionProgress.completedMainIds,
      completedSideIds: missionProgress.completedSideIds,
      completedMissionIds: missionProgress.completedMissionIds(),
      normalOfferIds: missionProgress.normalOfferFor(mapId),
    });

    return {
      state: this.presenter.present(state),
      board: mapMissionBoard(board, missionProgress.activeMissionId),
    };
  }
}
