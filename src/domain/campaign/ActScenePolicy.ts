import { buildPhaseId, mapIdFromIndex, parsePhaseId, PhaseId } from './CampaignIds';
import { mapDefinitionById } from './CampaignMaps';
import { CampaignProgress } from './CampaignProgress';
import { ActSceneDefinition, listActScenesForMap, resolveActScene, SEASON_FINALE_EPILOGUE } from './ActSceneCatalog';
import { MapId } from './CampaignIds';

export function firstPhaseIdForAct(mapIndex: number, actNumber: number): PhaseId {
  const phaseNumber = (actNumber - 1) * 10 + 1;
  return buildPhaseId(mapIndex, phaseNumber);
}

export function actNumberForPhase(phaseNumber: number): number {
  return Math.min(5, Math.max(1, Math.ceil(phaseNumber / 10)));
}

export function mapIdForProgress(progress: CampaignProgress): MapId {
  const { mapIndex } = parsePhaseId(progress.selectedPhaseId);
  return mapIdFromIndex(mapIndex);
}

export function isActSceneViewed(progress: CampaignProgress, sceneId: string): boolean {
  return progress.viewedActSceneIds.includes(sceneId);
}

export function isActUnlocked(progress: CampaignProgress, mapId: MapId, actNumber: number): boolean {
  const map = mapDefinitionById(mapId);
  if (!map) return false;

  const firstPhaseId = firstPhaseIdForAct(map.mapIndex, actNumber);
  return progress.isUnlocked(firstPhaseId) || progress.isCleared(firstPhaseId);
}

/**
 * Primeira cena de ato recém-desbloqueada que ainda não foi vista.
 * Usado para overlay automático com pausa.
 */
export function detectNewlyUnlockedActScene(
  previous: CampaignProgress | null,
  next: CampaignProgress,
): ActSceneDefinition | null {
  const mapId = mapIdForProgress(next);

  for (const scene of listActScenesForMap(mapId)) {
    if (isActSceneViewed(next, scene.id)) continue;

    const unlockedNow = isActUnlocked(next, mapId, scene.actNumber);
    if (!unlockedNow) continue;

    const unlockedBefore = previous
      ? isActUnlocked(previous, mapId, scene.actNumber)
      : false;

    if (!previous || !unlockedBefore) {
      return scene;
    }
  }

  return null;
}

/**
 * Epílogo de fim de temporada — só na primeira conclusão do jogo base.
 */
export function detectSeasonFinaleEpilogue(
  previous: CampaignProgress | null,
  next: CampaignProgress,
): ActSceneDefinition | null {
  if ((previous?.seasonCompleted ?? false) || !next.seasonCompleted) {
    return null;
  }

  if (isActSceneViewed(next, SEASON_FINALE_EPILOGUE.id)) {
    return null;
  }

  return SEASON_FINALE_EPILOGUE;
}

export function listVisibleActScenes(
  progress: CampaignProgress,
  mapId: MapId,
): Array<ActSceneDefinition & { unlocked: boolean; viewed: boolean }> {
  return listActScenesForMap(mapId).map((scene) => ({
    ...scene,
    unlocked: isActUnlocked(progress, mapId, scene.actNumber),
    viewed: isActSceneViewed(progress, scene.id),
  }));
}

export function resolveActSceneForPhase(
  progress: CampaignProgress,
  phaseId: PhaseId,
): ActSceneDefinition | null {
  const { mapIndex, phaseNumber } = parsePhaseId(phaseId);
  const mapId = mapIdFromIndex(mapIndex);
  const actNumber = actNumberForPhase(phaseNumber);
  return resolveActScene(mapId, actNumber);
}
