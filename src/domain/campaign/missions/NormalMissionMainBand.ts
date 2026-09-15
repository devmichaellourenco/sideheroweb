import { parsePhaseId } from '../CampaignIds';
import { MAIN_QUEST_PHASE_NUMBERS } from './MissionId';
import { MissionDefinition } from './MissionDefinition';
import { MissionId } from './MissionId';
import { getMissionById } from './MissionCatalog';

/**
 * Capítulo da main incompleta atual.
 * - `1` (tutorial): só a fase 1.
 * - Demais marcos: do marco anterior+1 até o marco atual (ex.: main 10 → 2–10; main 20 → 11–20).
 * Normais e secundárias do board usam esta faixa.
 */
export function normalPhaseNumberBandForCurrentMain(currentMainPhaseNumber: number): {
  min: number;
  max: number;
} {
  const mains = MAIN_QUEST_PHASE_NUMBERS as readonly number[];
  const current = Math.max(1, Math.min(50, Math.floor(currentMainPhaseNumber)));
  const chapterEnd = [...mains].filter((n) => n <= current).pop() ?? 1;

  if (chapterEnd <= 1) {
    return { min: 1, max: 1 };
  }

  const prevMain = [...mains].filter((n) => n < chapterEnd).pop() ?? 1;
  return {
    min: prevMain + 1,
    max: chapterEnd,
  };
}

/**
 * Marco dono do capítulo que contém a fase.
 * Fase 1 → main 1; 2–10 → main 10; 11–20 → main 20; …
 */
export function chapterMainPhaseForPhaseNumber(phaseNumber: number): number {
  const mains = MAIN_QUEST_PHASE_NUMBERS as readonly number[];
  const n = Math.max(1, Math.min(50, Math.floor(phaseNumber)));
  if (n <= 1) return 1;
  return mains.find((main) => main >= n) ?? 50;
}

export function listMissionChapterOptions(): Array<{
  mainPhase: number;
  min: number;
  max: number;
  label: string;
}> {
  return (MAIN_QUEST_PHASE_NUMBERS as readonly number[]).map((mainPhase) => {
    const { min, max } = normalPhaseNumberBandForCurrentMain(mainPhase);
    return {
      mainPhase,
      min,
      max,
      label: `Cap. ${mainPhase} · fases ${min}–${max}`,
    };
  });
}

export function isNormalPhaseInBandForMain(
  phaseNumber: number,
  currentMainPhaseNumber: number,
): boolean {
  const { min, max } = normalPhaseNumberBandForCurrentMain(currentMainPhaseNumber);
  return phaseNumber >= min && phaseNumber <= max;
}

export function isMissionPhaseInMainChapterBand(
  phaseTemplateId: string,
  currentMainPhaseNumber: number,
): boolean {
  const phaseNumber = parsePhaseId(phaseTemplateId).phaseNumber;
  return isNormalPhaseInBandForMain(phaseNumber, currentMainPhaseNumber);
}

export function filterNormalMissionIdsForMainBand(
  missionIds: readonly MissionId[],
  currentMainPhaseNumber: number,
): MissionId[] {
  return missionIds.filter((id) => {
    const mission = getMissionById(id);
    if (!mission || mission.kind !== 'normal') return false;
    return isMissionPhaseInMainChapterBand(mission.phaseTemplateId, currentMainPhaseNumber);
  });
}

export function filterNormalMissionsForMainBand(
  missions: readonly MissionDefinition[],
  currentMainPhaseNumber: number,
): MissionDefinition[] {
  return missions.filter((mission) => {
    if (mission.kind !== 'normal') return false;
    return isMissionPhaseInMainChapterBand(mission.phaseTemplateId, currentMainPhaseNumber);
  });
}

/** Secundárias do capítulo da main atual (template na faixa; unlock/expiração à parte). */
export function filterSideMissionsForMainBand(
  missions: readonly MissionDefinition[],
  currentMainPhaseNumber: number,
): MissionDefinition[] {
  return missions.filter((mission) => {
    if (mission.kind !== 'side') return false;
    return isMissionPhaseInMainChapterBand(mission.phaseTemplateId, currentMainPhaseNumber);
  });
}
