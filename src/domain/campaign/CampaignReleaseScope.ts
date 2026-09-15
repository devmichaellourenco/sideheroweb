import {
  buildPhaseId,
  difficultyTierForPhase,
  parsePhaseId,
  PhaseId,
} from './CampaignIds';
import { CAMPAIGN_MAPS, CampaignMapDefinition } from './CampaignMaps';

export type CampaignReleaseProfile = 'base' | 'full';

/** Perfil ativo da build — jogo base até Morthaven. */
export const CAMPAIGN_RELEASE_PROFILE: CampaignReleaseProfile = 'base';

export const BASE_GAME_MAX_MAP_INDEX = 4;
export const FULL_CAMPAIGN_MAX_MAP_INDEX = 10;
export const FULL_SEASON_FINALE_PHASE_ID: PhaseId = '10-50';

export function seasonFinalePhaseId(
  profile: CampaignReleaseProfile = CAMPAIGN_RELEASE_PROFILE,
): PhaseId {
  return profile === 'full'
    ? FULL_SEASON_FINALE_PHASE_ID
    : buildPhaseId(BASE_GAME_MAX_MAP_INDEX, 50);
}

export function isSeasonFinalePhase(
  phaseId: PhaseId,
  profile: CampaignReleaseProfile = CAMPAIGN_RELEASE_PROFILE,
): boolean {
  return phaseId === seasonFinalePhaseId(profile);
}

export function isMapReleased(
  mapIndex: number,
  profile: CampaignReleaseProfile = CAMPAIGN_RELEASE_PROFILE,
): boolean {
  if (mapIndex < 1 || mapIndex > FULL_CAMPAIGN_MAX_MAP_INDEX) return false;
  if (profile === 'full') return true;
  return mapIndex <= BASE_GAME_MAX_MAP_INDEX;
}

export function isPhaseReleased(
  phaseId: PhaseId,
  profile: CampaignReleaseProfile = CAMPAIGN_RELEASE_PROFILE,
): boolean {
  const { mapIndex } = parsePhaseId(phaseId);
  return isMapReleased(mapIndex, profile);
}

export function releasedCampaignMaps(
  profile: CampaignReleaseProfile = CAMPAIGN_RELEASE_PROFILE,
): CampaignMapDefinition[] {
  return CAMPAIGN_MAPS.filter((map) => isMapReleased(map.mapIndex, profile));
}

export function releasedCampaignPhaseCount(
  profile: CampaignReleaseProfile = CAMPAIGN_RELEASE_PROFILE,
): number {
  return releasedCampaignMaps(profile).reduce((sum, map) => sum + map.phaseCount, 0);
}

export function maxReleasedTier(
  profile: CampaignReleaseProfile = CAMPAIGN_RELEASE_PROFILE,
): number {
  const finale = seasonFinalePhaseId(profile);
  const { mapIndex, phaseNumber } = parsePhaseId(finale);
  return difficultyTierForPhase(mapIndex, phaseNumber);
}

function tierForPhaseId(phaseId: PhaseId): number {
  const { mapIndex, phaseNumber } = parsePhaseId(phaseId);
  return difficultyTierForPhase(mapIndex, phaseNumber);
}

function highestReleasedPhaseId(
  phaseIds: readonly PhaseId[],
  profile: CampaignReleaseProfile = CAMPAIGN_RELEASE_PROFILE,
): PhaseId | null {
  let best: PhaseId | null = null;
  let bestTier = 0;

  for (const phaseId of phaseIds) {
    if (!isPhaseReleased(phaseId, profile)) continue;
    const tier = tierForPhaseId(phaseId);
    if (tier > bestTier) {
      bestTier = tier;
      best = phaseId;
    }
  }

  return best;
}

export function clampSelectedPhaseId(
  selectedPhaseId: PhaseId,
  clearedPhaseIds: readonly PhaseId[],
  unlockedPhaseIds: readonly PhaseId[],
  profile: CampaignReleaseProfile = CAMPAIGN_RELEASE_PROFILE,
): PhaseId {
  if (isPhaseReleased(selectedPhaseId, profile)) return selectedPhaseId;

  return (
    highestReleasedPhaseId([...clearedPhaseIds, ...unlockedPhaseIds], profile) ??
    buildPhaseId(1, 1)
  );
}
