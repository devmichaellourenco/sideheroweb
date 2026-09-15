import { resolveActSceneById } from '../../domain/campaign/ActSceneCatalog';
import { detectNewlyUnlockedActScene, detectSeasonFinaleEpilogue } from '../../domain/campaign/ActScenePolicy';
import { CampaignProgress } from '../../domain/campaign/CampaignProgress';
import { resolveMissionScene } from '../../domain/campaign/missions/MissionSceneCatalog';
import { ActSceneDto } from '../dto/CampaignDto';
import { CampaignProgressDto } from '../dto/GameStateDto';
import { mapActSceneToDto } from './ActSceneDtoMapper';

function toProgress(dto: CampaignProgressDto): CampaignProgress {
  return CampaignProgress.restore({
    unlockedPhaseIds: dto.unlockedPhaseIds,
    clearedPhaseIds: dto.clearedPhaseIds,
    selectedPhaseId: dto.selectedPhaseId,
    highestTierReached: dto.highestTierReached,
    seasonCompleted: dto.seasonCompleted,
    viewedActSceneIds: dto.viewedActSceneIds ?? [],
  });
}

export function detectPendingActSceneDto(
  previous: CampaignProgressDto | null | undefined,
  next: CampaignProgressDto,
): ActSceneDto | null {
  const scene = detectNewlyUnlockedActScene(
    previous ? toProgress(previous) : null,
    toProgress(next),
  );
  if (!scene) return null;

  return mapActSceneToDto(scene, { unlocked: true, viewed: false });
}

export function detectSeasonFinaleEpilogueDto(
  previous: CampaignProgressDto | null | undefined,
  next: CampaignProgressDto,
): ActSceneDto | null {
  const scene = detectSeasonFinaleEpilogue(
    previous ? toProgress(previous) : null,
    toProgress(next),
  );
  if (!scene) return null;

  return mapActSceneToDto(scene, { unlocked: true, viewed: false });
}

export function mapMissionSceneToActSceneDto(sceneId: string): ActSceneDto | null {
  const scene = resolveMissionScene(sceneId);
  if (!scene) return null;
  return {
    id: scene.id,
    mapId: scene.mapId,
    actNumber: 0,
    title: scene.title,
    recap: scene.recap,
    preview: scene.preview,
    imageAssetPath: null,
    unlocked: true,
    viewed: false,
  };
}

export function detectPendingMissionSceneDto(
  progress: CampaignProgressDto | null | undefined,
): ActSceneDto | null {
  const pendingId = progress?.pendingMissionSceneIds?.[0];
  if (!pendingId) return null;
  return mapMissionSceneToActSceneDto(pendingId);
}

export function actSceneDtoFromId(sceneId: string, progress: CampaignProgressDto): ActSceneDto | null {
  const mission = mapMissionSceneToActSceneDto(sceneId);
  if (mission) {
    return {
      ...mission,
      viewed: !(progress.pendingMissionSceneIds ?? []).includes(sceneId),
    };
  }

  const scene = resolveActSceneById(sceneId);
  if (!scene) return null;

  const viewed = (progress.viewedActSceneIds ?? []).includes(sceneId);
  return mapActSceneToDto(scene, { unlocked: true, viewed });
}

export function findActSceneDto(
  actScenes: ActSceneDto[] | undefined,
  sceneId: string,
): ActSceneDto | null {
  return actScenes?.find((scene) => scene.id === sceneId) ?? null;
}
