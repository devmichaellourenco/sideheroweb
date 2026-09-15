import { MapId, parsePhaseId } from '../CampaignIds';
import { CampaignReleaseProfile, CAMPAIGN_RELEASE_PROFILE } from '../CampaignReleaseScope';
import {
  NORMAL_MISSION_OFFER_MAX,
  NORMAL_MISSION_OFFER_MIN,
  NORMAL_MISSION_REFRESH_EVERY_N_CAMP_VISITS,
} from './MissionConstants';
import { listNormalMissionsForMap } from './MissionCatalog';
import { MissionId } from './MissionId';
import {
  filterNormalMissionIdsForMainBand,
  isNormalPhaseInBandForMain,
} from './NormalMissionMainBand';

/** PRNG determinístico (mulberry32). */
export function missionOfferRng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashMissionOfferSeed(
  saveSeed: number,
  mapId: MapId,
  offerEpoch: number,
): number {
  const str = `${saveSeed}|${mapId}|${offerEpoch}`;
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function shouldRefreshNormalOffer(
  campVisitsSinceRefresh: number,
  everyN: number = NORMAL_MISSION_REFRESH_EVERY_N_CAMP_VISITS,
): boolean {
  const n = Math.max(1, Math.floor(everyN));
  return campVisitsSinceRefresh >= n;
}

/**
 * Sorteia entre MIN e MAX missões normais do mapa (sem repetir no mesmo sorteio).
 * Em próximos sorteios o mesmo template pode voltar (normais são repetíveis).
 * Determinístico por seed. Pool = capítulo da main atual (ex.: 1-1 → só 1; 1-10 → fases 2–10).
 */
export function rollNormalMissionOffer(params: {
  mapId: MapId;
  saveSeed: number;
  offerEpoch: number;
  /** Número da fase da main incompleta atual (ex.: 1, 5, 10…). */
  currentMainPhaseNumber: number;
  excludeMissionIds?: ReadonlySet<MissionId> | readonly MissionId[];
  profile?: CampaignReleaseProfile;
  offerMin?: number;
  offerMax?: number;
}): MissionId[] {
  const profile = params.profile ?? CAMPAIGN_RELEASE_PROFILE;
  const offerMin = params.offerMin ?? NORMAL_MISSION_OFFER_MIN;
  const offerMax = params.offerMax ?? NORMAL_MISSION_OFFER_MAX;
  const exclude =
    params.excludeMissionIds instanceof Set
      ? params.excludeMissionIds
      : new Set(params.excludeMissionIds ?? []);

  const pool = listNormalMissionsForMap(params.mapId, undefined, profile)
    .filter((m) => {
      const phaseNumber = parsePhaseId(m.phaseTemplateId).phaseNumber;
      return isNormalPhaseInBandForMain(phaseNumber, params.currentMainPhaseNumber);
    })
    .map((m) => m.id)
    .filter((id) => !exclude.has(id));

  if (pool.length === 0) return [];

  const rng = missionOfferRng(
    hashMissionOfferSeed(params.saveSeed, params.mapId, params.offerEpoch),
  );
  const span = Math.max(0, offerMax - offerMin);
  const targetCount = Math.min(
    pool.length,
    offerMin + (span === 0 ? 0 : Math.floor(rng() * (span + 1))),
  );

  const remaining = [...pool];
  const picked: MissionId[] = [];
  for (let i = 0; i < targetCount; i += 1) {
    const index = Math.floor(rng() * remaining.length);
    picked.push(remaining.splice(index, 1)[0]!);
  }
  return picked;
}

export function nextNormalOfferAfterCampVisit(params: {
  mapId: MapId;
  saveSeed: number;
  offerEpoch: number;
  campVisitsSinceRefresh: number;
  currentOffer: readonly MissionId[];
  currentMainPhaseNumber: number;
  profile?: CampaignReleaseProfile;
}): {
  offer: MissionId[];
  offerEpoch: number;
  campVisitsSinceRefresh: number;
  refreshed: boolean;
} {
  const visits = params.campVisitsSinceRefresh + 1;
  if (!shouldRefreshNormalOffer(visits)) {
    const filtered = filterNormalMissionIdsForMainBand(
      params.currentOffer,
      params.currentMainPhaseNumber,
    );
    if (filtered.length > 0) {
      return {
        offer: filtered,
        offerEpoch: params.offerEpoch,
        campVisitsSinceRefresh: visits,
        refreshed: false,
      };
    }
    // Oferta legada fora da faixa: rerola sem esperar o ciclo completo.
  }

  const nextEpoch = params.offerEpoch + 1;
  const offer = rollNormalMissionOffer({
    mapId: params.mapId,
    saveSeed: params.saveSeed,
    offerEpoch: nextEpoch,
    currentMainPhaseNumber: params.currentMainPhaseNumber,
    profile: params.profile,
  });

  return {
    offer,
    offerEpoch: nextEpoch,
    campVisitsSinceRefresh: 0,
    refreshed: true,
  };
}
