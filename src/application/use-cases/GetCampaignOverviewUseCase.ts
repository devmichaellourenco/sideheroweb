import { getCampaignInfo, listPhasesForMap, resolvePhase } from '../../domain/campaign/CampaignCatalog';
import { MapId } from '../../domain/campaign/CampaignIds';
import { PhaseDefinition } from '../../domain/campaign/PhaseDefinition';
import {
  buildCampMissionBoard,
  currentMainPhaseNumberForMap,
  ensureNormalOfferForBoard,
} from '../../domain/campaign/missions/CampMissionBoard';
import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { CampaignOverviewDto } from '../dto/CampaignDto';
import { mapActScenesForMap } from '../mappers/ActSceneDtoMapper';
import { mapCampaignOverview } from '../mappers/CampaignDtoMapper';
import { mapMissionBoard } from '../mappers/MissionBoardMapper';
import { GameStatePresenter } from '../presenters/GameStatePresenter';
import { GameStateDto } from '../dto/GameStateDto';

export interface GetCampaignOverviewResult {
  state: GameStateDto;
  campaign: CampaignOverviewDto;
}

function resolveActNumber(phaseId: string): number {
  const phaseNumber = Number.parseInt(phaseId.split('-')[1] ?? '1', 10);
  return Math.min(5, Math.max(1, Math.ceil(phaseNumber / 10)));
}

function extractFeaturedEnemyTypes(definition: PhaseDefinition): string[] {
  const featured: string[] = [];
  const seen = new Set<string>();

  const pushType = (enemyType: string, role: 'boss' | 'elite' | 'trash') => {
    if (seen.has(enemyType)) return;
    seen.add(enemyType);
    if (role === 'boss' || role === 'elite') {
      featured.unshift(enemyType);
      return;
    }
    featured.push(enemyType);
  };

  for (const wave of definition.waves) {
    for (const slot of wave.slots) {
      pushType(slot.enemyType, slot.role);
    }
  }

  return featured.slice(0, 3);
}

export class GetCampaignOverviewUseCase {
  constructor(
    private readonly repository: IGameStateRepository,
    private readonly presenter: GameStatePresenter,
  ) {}

  async execute(): Promise<GetCampaignOverviewResult> {
    let state = await this.repository.load();
    let missionProgress = state.campaignProgress.missionProgress;
    let offersChanged = false;

    const info = getCampaignInfo();
    const maps = info.maps.map((map) => {
      const mapId = map.id as MapId;
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
      if (
        ensured.offer.join('|') !== missionProgress.normalOfferFor(mapId).join('|') ||
        ensured.offerEpoch !== missionProgress.offerEpochFor(mapId)
      ) {
        missionProgress = missionProgress.withNormalOffer(mapId, ensured.offer, ensured.offerEpoch);
        offersChanged = true;
      }

      const board = buildCampMissionBoard({
        mapId,
        completedMainIds: missionProgress.completedMainIds,
        completedSideIds: missionProgress.completedSideIds,
        completedMissionIds: missionProgress.completedMissionIds(),
        normalOfferIds: missionProgress.normalOfferFor(mapId),
      });

      const phases = listPhasesForMap(map.id).map((phase) => {
        const definition = resolvePhase(phase.id)!;
        return {
          id: phase.id,
          displayName: definition.displayName,
          waveCount: definition.waves.length,
          difficultyTier: definition.difficultyTier,
          unlocked: state.campaignProgress.isUnlocked(phase.id),
          cleared: state.campaignProgress.isCleared(phase.id),
          selected: state.campaignProgress.selectedPhaseId === phase.id,
          playable: state.campaignProgress.canPlayPhase(phase.id),
          milestoneBoss: definition.milestoneBoss ?? false,
          seasonFinale: definition.seasonFinale ?? false,
          actNumber: resolveActNumber(phase.id),
          featuredEnemyTypes: extractFeaturedEnemyTypes(definition),
          challengeKind: definition.challengeKind,
          challengeLabel: definition.challengeLabel,
          challengeHint: definition.challengeHint,
        };
      });

      const unlocked = phases.some((phase) => phase.unlocked || phase.cleared);

      return {
        id: map.id,
        name: map.name,
        unlocked,
        phases,
        actScenes: mapActScenesForMap(state.campaignProgress, mapId),
        missionBoard: mapMissionBoard(board, missionProgress.activeMissionId),
      };
    });

    if (offersChanged) {
      state = state.withCampaignProgress(
        state.campaignProgress.withMissionProgress(missionProgress),
      );
      await this.repository.save(state);
    }

    return {
      state: this.presenter.present(state),
      campaign: mapCampaignOverview(info, maps),
    };
  }
}
