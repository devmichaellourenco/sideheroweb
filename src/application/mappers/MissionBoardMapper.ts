import { effectivePhaseGoldTotal } from '../../domain/balance/PhaseGoldBudget';
import { effectivePhaseXpTotal } from '../../domain/balance/PhaseXpBudget';
import { resolvePhase } from '../../domain/campaign/CampaignCatalog';
import { MapId, PhaseId } from '../../domain/campaign/CampaignIds';
import { CampMissionBoard } from '../../domain/campaign/missions/CampMissionBoard';
import { MissionDefinition } from '../../domain/campaign/missions/MissionDefinition';
import { MissionId } from '../../domain/campaign/missions/MissionId';
import { resolveMissionScene } from '../../domain/campaign/missions/MissionSceneCatalog';
import { getGearCatalogItem } from '../../domain/gear/GearItemCatalog';
import { MissionBoardDto, MissionPreviewDto } from '../dto/MissionBoardDto';
import { mapFeaturedEnemyPreviews } from './MissionEnemyPreviewMapper';

function resolveRewardLabels(mission: MissionDefinition): {
  rewardItemName: string | null;
  rewardSceneTitle: string | null;
} {
  const itemId = mission.rewards?.itemId;
  const sceneId = mission.rewards?.sceneId;
  return {
    rewardItemName: itemId ? (getGearCatalogItem(itemId)?.name ?? itemId) : null,
    rewardSceneTitle: sceneId ? (resolveMissionScene(sceneId)?.title ?? sceneId) : null,
  };
}

export function mapMissionPreview(
  mission: MissionDefinition,
  selectedMissionId: MissionId | null,
): MissionPreviewDto {
  const phase = resolvePhase(mission.phaseTemplateId);
  const phaseId = mission.phaseTemplateId as PhaseId;
  const featuredEnemies = phase
    ? mapFeaturedEnemyPreviews(phase, { mapId: mission.mapId })
    : [];
  const { rewardItemName, rewardSceneTitle } = resolveRewardLabels(mission);

  return {
    id: mission.id,
    kind: mission.kind,
    name: mission.name,
    mapId: mission.mapId,
    phaseTemplateId: mission.phaseTemplateId,
    stars: mission.stars ?? null,
    waveCount: phase?.waves.length ?? 1,
    difficultyTier: phase?.difficultyTier ?? 1,
    expectedGold: phase ? effectivePhaseGoldTotal(phaseId) : 0,
    victoryXp: phase ? effectivePhaseXpTotal(phaseId) : 0,
    featuredEnemyTypes: featuredEnemies.map((enemy) => enemy.enemyType),
    featuredEnemies,
    challengeLabel: phase?.challengeLabel,
    challengeHint: phase?.challengeHint,
    rewards: mission.rewards
      ? {
          itemId: mission.rewards.itemId,
          sceneId: mission.rewards.sceneId,
        }
      : null,
    rewardItemName,
    rewardSceneTitle,
    selected: selectedMissionId === mission.id,
  };
}

export function mapMissionBoard(
  board: CampMissionBoard,
  selectedMissionId: MissionId | null,
): MissionBoardDto {
  return {
    mapId: board.mapId as MapId,
    main: board.main ? mapMissionPreview(board.main, selectedMissionId) : null,
    sides: board.sides.map((mission) => mapMissionPreview(mission, selectedMissionId)),
    normals: board.normals.map((mission) => mapMissionPreview(mission, selectedMissionId)),
  };
}
