import { CampaignReleaseProfile, CAMPAIGN_RELEASE_PROFILE } from '../CampaignReleaseScope';
import { parsePhaseId } from '../CampaignIds';
import { getMissionById, listMissionCatalog } from './MissionCatalog';
import {
  MissionId,
  phaseIdFromMainMissionId,
  parseMissionIdKind,
} from './MissionId';
import type { MissionDefinition } from './MissionDefinition';

function toCompletedSet(
  completedMissionIds: ReadonlySet<MissionId> | readonly MissionId[],
): Set<MissionId> {
  return completedMissionIds instanceof Set
    ? completedMissionIds
    : new Set(completedMissionIds);
}

function mainPhaseNumber(missionId: MissionId): number | null {
  const phaseId = phaseIdFromMainMissionId(missionId);
  if (!phaseId) return null;
  return parsePhaseId(phaseId).phaseNumber;
}

/**
 * Side expira se alguma main do mesmo mapa com phaseNumber **maior** que o
 * maior pré-requisito main já foi concluída (janela entre mains).
 */
export function isSideMissionExpired(
  mission: MissionDefinition,
  completedMissionIds: ReadonlySet<MissionId> | readonly MissionId[],
): boolean {
  if (mission.kind !== 'side') return false;

  const completed = toCompletedSet(completedMissionIds);
  const unlockMains = (mission.unlockAfterMissionIds ?? [])
    .filter((id) => parseMissionIdKind(id) === 'main')
    .map((id) => ({ id, phaseNumber: mainPhaseNumber(id) }))
    .filter((entry): entry is { id: MissionId; phaseNumber: number } => entry.phaseNumber !== null);

  if (unlockMains.length === 0) return false;

  const windowEnd = Math.max(...unlockMains.map((entry) => entry.phaseNumber));

  for (const completedId of completed) {
    if (parseMissionIdKind(completedId) !== 'main') continue;
    const completedPhase = mainPhaseNumber(completedId);
    if (completedPhase === null) continue;
    const completedMission = getMissionById(completedId);
    if (!completedMission || completedMission.mapId !== mission.mapId) continue;
    if (completedPhase > windowEnd) return true;
  }

  return false;
}

/**
 * Missão side está elegível se todas as `unlockAfterMissionIds` estão concluídas,
 * ela própria ainda não foi concluída e a janela de main não expirou.
 */
export function isSideMissionUnlocked(
  missionId: MissionId,
  completedMissionIds: ReadonlySet<MissionId> | readonly MissionId[],
  profile: CampaignReleaseProfile = CAMPAIGN_RELEASE_PROFILE,
): boolean {
  const completed = toCompletedSet(completedMissionIds);
  if (completed.has(missionId)) return false;

  const mission = getMissionById(missionId, profile);
  if (!mission || mission.kind !== 'side') return false;
  if (isSideMissionExpired(mission, completed)) return false;

  const reqs = mission.unlockAfterMissionIds ?? [];
  return reqs.every((id) => completed.has(id));
}

/** Sides cujo pré-requisito inclui `completedMissionId` (efeito imediato ao concluir). */
export function sideMissionsUnlockedByCompleting(
  completedMissionId: MissionId,
  alreadyCompleted: ReadonlySet<MissionId> | readonly MissionId[],
  profile: CampaignReleaseProfile = CAMPAIGN_RELEASE_PROFILE,
): MissionId[] {
  const completed = new Set(
    alreadyCompleted instanceof Set ? alreadyCompleted : alreadyCompleted,
  );
  completed.add(completedMissionId);

  return listMissionCatalog(profile)
    .filter((m) => m.kind === 'side')
    .filter((m) => (m.unlockAfterMissionIds ?? []).includes(completedMissionId))
    .filter((m) => isSideMissionUnlocked(m.id, completed, profile))
    .map((m) => m.id);
}

export function listEligibleSideMissionIds(
  mapId: string,
  completedMissionIds: ReadonlySet<MissionId> | readonly MissionId[],
  profile: CampaignReleaseProfile = CAMPAIGN_RELEASE_PROFILE,
): MissionId[] {
  return listMissionCatalog(profile)
    .filter((m) => m.kind === 'side' && m.mapId === mapId)
    .filter((m) => isSideMissionUnlocked(m.id, completedMissionIds, profile))
    .map((m) => m.id);
}
