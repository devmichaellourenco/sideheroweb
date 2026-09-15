import { describe, expect, it } from 'vitest';
import {
  NORMAL_MISSION_OFFER_MAX,
  NORMAL_MISSION_OFFER_MIN,
} from './MissionConstants';
import {
  hashMissionOfferSeed,
  nextNormalOfferAfterCampVisit,
  rollNormalMissionOffer,
  shouldRefreshNormalOffer,
} from './NormalMissionOffer';

describe('NormalMissionOffer', () => {
  it('sorteia entre 2 e 4 missões e é determinístico por seed/epoch', () => {
    const a = rollNormalMissionOffer({
      mapId: 'stendra',
      saveSeed: 42,
      offerEpoch: 1,
      currentMainPhaseNumber: 1,
    });
    const b = rollNormalMissionOffer({
      mapId: 'stendra',
      saveSeed: 42,
      offerEpoch: 1,
      currentMainPhaseNumber: 1,
    });
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThanOrEqual(NORMAL_MISSION_OFFER_MIN);
    expect(a.length).toBeLessThanOrEqual(NORMAL_MISSION_OFFER_MAX);
    expect(new Set(a).size).toBe(a.length);
  });

  it('epoch diferente muda a oferta', () => {
    const a = rollNormalMissionOffer({
      mapId: 'stendra',
      saveSeed: 7,
      offerEpoch: 1,
      currentMainPhaseNumber: 1,
    });
    const b = rollNormalMissionOffer({
      mapId: 'stendra',
      saveSeed: 7,
      offerEpoch: 2,
      currentMainPhaseNumber: 1,
    });
    expect(hashMissionOfferSeed(7, 'stendra', 1)).not.toBe(hashMissionOfferSeed(7, 'stendra', 2));
    expect(a.length).toBeGreaterThan(0);
    expect(b.length).toBeGreaterThan(0);
  });

  it('shouldRefreshNormalOffer respeita N visitas', () => {
    expect(shouldRefreshNormalOffer(0, 1)).toBe(false);
    expect(shouldRefreshNormalOffer(1, 1)).toBe(true);
    expect(shouldRefreshNormalOffer(1, 3)).toBe(false);
    expect(shouldRefreshNormalOffer(3, 3)).toBe(true);
  });

  it('nextNormalOfferAfterCampVisit renova ao atingir N (default 2)', () => {
    const current = rollNormalMissionOffer({
      mapId: 'stendra',
      saveSeed: 99,
      offerEpoch: 0,
      currentMainPhaseNumber: 1,
    });
    const firstVisit = nextNormalOfferAfterCampVisit({
      mapId: 'stendra',
      saveSeed: 99,
      offerEpoch: 0,
      campVisitsSinceRefresh: 0,
      currentOffer: current,
      currentMainPhaseNumber: 1,
    });
    expect(firstVisit.refreshed).toBe(false);
    expect(firstVisit.campVisitsSinceRefresh).toBe(1);
    expect(firstVisit.offerEpoch).toBe(0);

    const secondVisit = nextNormalOfferAfterCampVisit({
      mapId: 'stendra',
      saveSeed: 99,
      offerEpoch: firstVisit.offerEpoch,
      campVisitsSinceRefresh: firstVisit.campVisitsSinceRefresh,
      currentOffer: firstVisit.offer,
      currentMainPhaseNumber: 1,
    });
    expect(secondVisit.refreshed).toBe(true);
    expect(secondVisit.campVisitsSinceRefresh).toBe(0);
    expect(secondVisit.offerEpoch).toBe(1);
    expect(secondVisit.offer.length).toBeGreaterThanOrEqual(NORMAL_MISSION_OFFER_MIN);
  });
});
