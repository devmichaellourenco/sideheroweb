import { mapDefinitionByIndex } from './CampaignMaps';

export type CampaignId = 'apprentice';
export type MapId =
  | 'stendra'
  | 'gruftall'
  | 'valdris'
  | 'morthaven'
  | 'broken_sky'
  | 'crimson_abyss'
  | 'eternal_forge'
  | 'ancient_grove'
  | 'twilight_tower'
  | 'void_throne';
export type PhaseId = string;

export function formatPhaseLabel(phaseId: PhaseId): string {
  return phaseId.replace('-', '-');
}

export function parsePhaseId(phaseId: PhaseId): { mapIndex: number; phaseNumber: number } {
  const [mapPart, phasePart] = phaseId.split('-');
  return {
    mapIndex: Number.parseInt(mapPart, 10) || 1,
    phaseNumber: Number.parseInt(phasePart, 10) || 1,
  };
}

export function difficultyTierForPhase(mapIndex: number, phaseNumber: number): number {
  return (mapIndex - 1) * 50 + phaseNumber;
}

export function buildPhaseId(mapIndex: number, phaseNumber: number): PhaseId {
  return `${mapIndex}-${phaseNumber}`;
}

/** Fase imediatamente anterior na campanha (1-1 permanece em 1-1). */
export function previousPhaseId(phaseId: PhaseId): PhaseId {
  const { mapIndex, phaseNumber } = parsePhaseId(phaseId);

  if (mapIndex <= 1 && phaseNumber <= 1) {
    return buildPhaseId(1, 1);
  }

  if (phaseNumber <= 1) {
    return buildPhaseId(mapIndex - 1, 50);
  }

  return buildPhaseId(mapIndex, phaseNumber - 1);
}

export function mapIdFromIndex(mapIndex: number): MapId {
  return mapDefinitionByIndex(mapIndex)?.id ?? 'stendra';
}

export function isMilestonePhase(phaseNumber: number): boolean {
  return phaseNumber % 50 === 0;
}
