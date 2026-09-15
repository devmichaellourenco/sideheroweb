import { MapId, parsePhaseId } from '../CampaignIds';
import { CampaignReleaseProfile, CAMPAIGN_RELEASE_PROFILE } from '../CampaignReleaseScope';
import { getMissionById, listMainMissionsForMap } from './MissionCatalog';
import { MissionDefinition } from './MissionDefinition';
import { MissionId, phaseIdFromMainMissionId } from './MissionId';
import { listEligibleSideMissionIds } from './MissionUnlockGraph';
import {
  filterNormalMissionIdsForMainBand,
  filterNormalMissionsForMainBand,
  filterSideMissionsForMainBand,
} from './NormalMissionMainBand';
import { rollNormalMissionOffer } from './NormalMissionOffer';

export interface CampMissionBoard {
  mapId: MapId;
  main: MissionDefinition | null;
  sides: MissionDefinition[];
  normals: MissionDefinition[];
}

export function nextMainMissionForMap(
  mapId: MapId,
  completedMainIds: ReadonlySet<MissionId> | readonly MissionId[],
  profile: CampaignReleaseProfile = CAMPAIGN_RELEASE_PROFILE,
): MissionDefinition | null {
  const completed =
    completedMainIds instanceof Set ? completedMainIds : new Set(completedMainIds);
  const mains = listMainMissionsForMap(mapId, profile);
  return mains.find((m) => !completed.has(m.id)) ?? null;
}

/** Número da fase da próxima main incompleta (fallback 1). */
export function currentMainPhaseNumberForMap(
  mapId: MapId,
  completedMainIds: ReadonlySet<MissionId> | readonly MissionId[],
  profile: CampaignReleaseProfile = CAMPAIGN_RELEASE_PROFILE,
): number {
  const main = nextMainMissionForMap(mapId, completedMainIds, profile);
  if (!main) return 50;
  return parsePhaseId(main.phaseTemplateId).phaseNumber;
}

/**
 * Snapshot do que deve aparecer no mapa de locais nesta visita.
 * Normais: usa oferta já sorteada (não rerola aqui), filtrada pelo marco da main.
 */
export function buildCampMissionBoard(params: {
  mapId: MapId;
  completedMainIds: ReadonlySet<MissionId> | readonly MissionId[];
  completedSideIds: ReadonlySet<MissionId> | readonly MissionId[];
  /** Todas as missões concluídas (main+side) para avaliar unlock de sides. */
  completedMissionIds: ReadonlySet<MissionId> | readonly MissionId[];
  normalOfferIds: readonly MissionId[];
  profile?: CampaignReleaseProfile;
}): CampMissionBoard {
  const profile = params.profile ?? CAMPAIGN_RELEASE_PROFILE;
  const main = nextMainMissionForMap(params.mapId, params.completedMainIds, profile);
  const currentMainPhaseNumber = currentMainPhaseNumberForMap(
    params.mapId,
    params.completedMainIds,
    profile,
  );

  const sideIds = listEligibleSideMissionIds(
    params.mapId,
    params.completedMissionIds,
    profile,
  ).filter((id) => {
    const completedSides =
      params.completedSideIds instanceof Set
        ? params.completedSideIds
        : new Set(params.completedSideIds);
    return !completedSides.has(id);
  });

  const sides = filterSideMissionsForMainBand(
    sideIds
      .map((id) => getMissionById(id, profile))
      .filter((m): m is MissionDefinition => Boolean(m)),
    currentMainPhaseNumber,
  );

  const normals = filterNormalMissionsForMainBand(
    params.normalOfferIds
      .map((id) => getMissionById(id, profile))
      .filter((m): m is MissionDefinition => Boolean(m))
      .filter((m) => m.mapId === params.mapId),
    currentMainPhaseNumber,
  );

  return { mapId: params.mapId, main, sides, normals };
}

/** Garante oferta inicial se o progresso ainda não tiver normais válidas para o mapa. */
export function ensureNormalOfferForBoard(params: {
  mapId: MapId;
  saveSeed: number;
  offerEpoch: number;
  currentOffer: readonly MissionId[];
  currentMainPhaseNumber: number;
  profile?: CampaignReleaseProfile;
}): { offer: MissionId[]; offerEpoch: number } {
  const epoch = Math.max(0, params.offerEpoch);
  const filtered = filterNormalMissionIdsForMainBand(
    params.currentOffer,
    params.currentMainPhaseNumber,
  );
  if (filtered.length > 0) {
    return { offer: filtered, offerEpoch: epoch };
  }
  const offer = rollNormalMissionOffer({
    mapId: params.mapId,
    saveSeed: params.saveSeed,
    offerEpoch: epoch,
    currentMainPhaseNumber: params.currentMainPhaseNumber,
    profile: params.profile,
  });
  return { offer, offerEpoch: epoch };
}

export function allMissionsOnBoard(board: CampMissionBoard): MissionDefinition[] {
  return [
    ...(board.main ? [board.main] : []),
    ...board.sides,
    ...board.normals,
  ];
}

/** Helpers de teste / migração: id de main a partir do phaseId legado. */
export { phaseIdFromMainMissionId };
