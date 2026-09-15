import { ActSceneDefinition, actSceneImageAssetPath } from '../../domain/campaign/ActSceneCatalog';
import { listVisibleActScenes } from '../../domain/campaign/ActScenePolicy';
import { CampaignProgress } from '../../domain/campaign/CampaignProgress';
import { MapId } from '../../domain/campaign/CampaignIds';
import { ActSceneDto } from '../dto/CampaignDto';

export function mapActSceneToDto(
  scene: ActSceneDefinition,
  options: { unlocked: boolean; viewed: boolean },
): ActSceneDto {
  return {
    id: scene.id,
    mapId: scene.mapId,
    actNumber: scene.actNumber,
    title: scene.title,
    recap: scene.recap,
    preview: scene.preview,
    imageAssetPath: actSceneImageAssetPath(scene.mapId, scene.actNumber),
    unlocked: options.unlocked,
    viewed: options.viewed,
  };
}

export function mapActScenesForMap(progress: CampaignProgress, mapId: MapId): ActSceneDto[] {
  return listVisibleActScenes(progress, mapId).map((scene) =>
    mapActSceneToDto(scene, {
      unlocked: scene.unlocked,
      viewed: scene.viewed,
    }),
  );
}
