import { MapId, PhaseId, mapIdFromIndex, parsePhaseId } from '../CampaignIds';

export type MissionId = string;

/** Marcos da quest principal por mapa (não confundir com milestoneBoss X-50 de loot). */
export const MAIN_QUEST_PHASE_NUMBERS = [1, 10, 20, 30, 40, 50] as const;

export type MainQuestPhaseNumber = (typeof MAIN_QUEST_PHASE_NUMBERS)[number];

export function isMainQuestPhaseNumber(phaseNumber: number): boolean {
  return (MAIN_QUEST_PHASE_NUMBERS as readonly number[]).includes(phaseNumber);
}

/** Remove mains de marcos legados (ex.: main:1-5) que não existem mais no catálogo. */
export function sanitizeCompletedMainIds(ids: readonly MissionId[]): MissionId[] {
  const seen = new Set<MissionId>();
  const out: MissionId[] = [];
  for (const id of ids) {
    const phaseId = phaseIdFromMainMissionId(id);
    if (!phaseId) continue;
    try {
      const { phaseNumber } = parsePhaseId(phaseId);
      if (!isMainQuestPhaseNumber(phaseNumber)) continue;
    } catch {
      continue;
    }
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export function mainMissionId(phaseId: PhaseId): MissionId {
  return `main:${phaseId}`;
}

export function sideMissionId(slug: string): MissionId {
  return `side:${slug}`;
}

export function normalMissionId(phaseId: PhaseId): MissionId {
  return `normal:${phaseId}`;
}

const CUSTOM_NORMAL_PREFIX = 'normal:custom:';

export function isCustomNormalMissionId(missionId: MissionId): boolean {
  return missionId.startsWith(CUSTOM_NORMAL_PREFIX);
}

export function customNormalMissionId(slug: string): MissionId {
  return `${CUSTOM_NORMAL_PREFIX}${slug}`;
}

export function slugFromCustomNormalMissionId(missionId: MissionId): string | null {
  if (!isCustomNormalMissionId(missionId)) return null;
  return missionId.slice(CUSTOM_NORMAL_PREFIX.length);
}

export function parseMissionIdKind(missionId: MissionId): 'main' | 'side' | 'normal' | null {
  if (missionId.startsWith('main:')) return 'main';
  if (missionId.startsWith('side:')) return 'side';
  if (missionId.startsWith('normal:')) return 'normal';
  return null;
}

export function phaseIdFromMainMissionId(missionId: MissionId): PhaseId | null {
  if (!missionId.startsWith('main:')) return null;
  return missionId.slice('main:'.length);
}

export function phaseIdFromNormalMissionId(missionId: MissionId): PhaseId | null {
  if (!missionId.startsWith('normal:')) return null;
  if (isCustomNormalMissionId(missionId)) return null;
  return missionId.slice('normal:'.length);
}

export function mapIdFromMissionPhaseRef(phaseId: PhaseId): MapId {
  return mapIdFromIndex(parsePhaseId(phaseId).mapIndex);
}
