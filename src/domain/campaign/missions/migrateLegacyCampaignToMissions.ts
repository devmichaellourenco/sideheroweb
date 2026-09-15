import { buildPhaseId, parsePhaseId, PhaseId } from '../CampaignIds';
import { CampaignProgress, CampaignProgressProps } from '../CampaignProgress';
import {
  MAIN_QUEST_PHASE_NUMBERS,
  isMainQuestPhaseNumber,
  mainMissionId,
  MissionId,
} from './MissionId';
import { MissionProgress, MissionProgressProps } from './MissionProgress';

/**
 * Deriva mains concluídas a partir de `clearedPhaseIds` legados:
 * marco `x-N` conta se a fase foi cleared ou se o jogador já passou daquele número no mapa.
 */
export function completedMainIdsFromClearedPhases(
  clearedPhaseIds: readonly PhaseId[],
): MissionId[] {
  if (clearedPhaseIds.length === 0) return [];

  const cleared = new Set(clearedPhaseIds);
  const completed: MissionId[] = [];
  const byMap = new Map<number, number[]>();

  for (const phaseId of clearedPhaseIds) {
    const { mapIndex, phaseNumber } = parsePhaseId(phaseId);
    const list = byMap.get(mapIndex) ?? [];
    list.push(phaseNumber);
    byMap.set(mapIndex, list);
  }

  for (const [mapIndex, numbers] of byMap) {
    const maxCleared = Math.max(...numbers);
    for (const milestone of MAIN_QUEST_PHASE_NUMBERS) {
      if (!isMainQuestPhaseNumber(milestone)) continue;
      const phaseId = buildPhaseId(mapIndex, milestone);
      if (cleared.has(phaseId) || maxCleared >= milestone) {
        completed.push(mainMissionId(phaseId));
      }
    }
  }

  return completed;
}

export type CampaignProgressWithMissions = CampaignProgressProps & {
  missionProgress?: MissionProgressProps;
};

/**
 * Se o save ainda não tem `missionProgress` útil, deriva mains dos cleared legados.
 * Idempotente se missionProgress já estiver populado.
 */
export function migrateLegacyCampaignToMissionProgress(
  campaign: CampaignProgress | CampaignProgressWithMissions,
  offerSeed = 1,
): MissionProgressProps {
  const props: CampaignProgressWithMissions =
    campaign instanceof CampaignProgress
      ? { ...campaign.toProps(), missionProgress: undefined }
      : campaign;

  // Prefer explicit field when present on props bag
  const existingRaw =
    'missionProgress' in props ? props.missionProgress : undefined;
  const existing = MissionProgress.restore(existingRaw);

  const hasData =
    existing.completedMainIds.length > 0 ||
    existing.completedSideIds.length > 0 ||
    Object.keys(existing.normalOffersByMapId).length > 0 ||
    existing.activeMissionId !== null;

  if (hasData) {
    return existing.toProps();
  }

  const completedMainIds = completedMainIdsFromClearedPhases(props.clearedPhaseIds ?? []);
  return MissionProgress.initial(offerSeed).withCompletedMains(completedMainIds).toProps();
}
