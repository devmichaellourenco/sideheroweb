import { PhaseId } from './CampaignIds';
import { CampaignProgress } from './CampaignProgress';

/**
 * Sem penalidade de “replay de fase”.
 * Main/side são únicas; normais podem repetir o template com ouro/XP cheios.
 */
export function isPhaseReplay(_progress: CampaignProgress, _phaseId: PhaseId): boolean {
  return false;
}

/**
 * Baú/loot garantido de boss de fase só na 1ª vez que o template é cleared
 * (progresso de campanha). Normais depois disso usam chance normal de drop, sem corte de ouro/XP.
 */
export function grantsPhaseChests(progress: CampaignProgress, phaseId: PhaseId): boolean {
  return !progress.isCleared(phaseId);
}

/** @deprecated Use grantsPhaseChests */
export function grantsPhaseLoot(progress: CampaignProgress, phaseId: PhaseId): boolean {
  return grantsPhaseChests(progress, phaseId);
}

export function phaseGoldMultiplier(
  _progress: CampaignProgress,
  _phaseId: PhaseId,
): number {
  return 1;
}

export function phaseXpMultiplier(_progress: CampaignProgress, _phaseId: PhaseId): number {
  return 1;
}

export function scalePhaseGold(
  baseGold: number,
  progress: CampaignProgress,
  phaseId: PhaseId,
): number {
  return Math.floor(baseGold * phaseGoldMultiplier(progress, phaseId));
}

export function scalePhaseXp(
  baseXp: number,
  progress: CampaignProgress,
  phaseId: PhaseId,
): number {
  return Math.floor(baseXp * phaseXpMultiplier(progress, phaseId));
}
