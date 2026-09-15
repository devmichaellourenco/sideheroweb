import { describe, expect, it } from 'vitest';
import {
  buildCampMissionBoard,
  ensureNormalOfferForBoard,
  nextMainMissionForMap,
} from './CampMissionBoard';
import { mainMissionId, sideMissionId } from './MissionId';
import { rollNormalMissionOffer } from './NormalMissionOffer';
import { parsePhaseId } from '../CampaignIds';
import { getMissionById } from './MissionCatalog';

describe('CampMissionBoard', () => {
  it('próxima main é 1-1 no início e 1-10 após concluir 1-1', () => {
    expect(nextMainMissionForMap('stendra', [])?.id).toBe(mainMissionId('1-1'));
    expect(nextMainMissionForMap('stendra', [mainMissionId('1-1')])?.id).toBe(
      mainMissionId('1-10'),
    );
  });

  it('com main 1-1: só tutorial — sem sides de farm e normal só 1-1', () => {
    const offer = rollNormalMissionOffer({
      mapId: 'stendra',
      saveSeed: 1,
      offerEpoch: 0,
      currentMainPhaseNumber: 1,
    });
    const board = buildCampMissionBoard({
      mapId: 'stendra',
      completedMainIds: [],
      completedSideIds: [],
      completedMissionIds: [],
      normalOfferIds: offer,
    });

    expect(board.main?.id).toBe(mainMissionId('1-1'));
    expect(board.sides).toHaveLength(0);
    for (const normal of board.normals) {
      expect(parsePhaseId(normal.phaseTemplateId).phaseNumber).toBe(1);
    }
  });

  it('com main 1-10: sides iniciais + cinzas + normais 2–10', () => {
    const offer = rollNormalMissionOffer({
      mapId: 'stendra',
      saveSeed: 1,
      offerEpoch: 0,
      currentMainPhaseNumber: 10,
    });
    const board = buildCampMissionBoard({
      mapId: 'stendra',
      completedMainIds: [mainMissionId('1-1')],
      completedSideIds: [],
      completedMissionIds: [mainMissionId('1-1')],
      normalOfferIds: offer,
    });

    expect(board.main?.id).toBe(mainMissionId('1-10'));
    expect(board.sides.map((s) => s.id)).toEqual(
      expect.arrayContaining([
        sideMissionId('stendra_village_watch'),
        sideMissionId('stendra_wayward_patrol'),
        sideMissionId('stendra_border_skirmish'),
        sideMissionId('stendra_ash_trail'),
      ]),
    );
    for (const normal of board.normals) {
      const phaseNumber = parsePhaseId(normal.phaseTemplateId).phaseNumber;
      expect(phaseNumber).toBeGreaterThanOrEqual(2);
      expect(phaseNumber).toBeLessThanOrEqual(10);
    }
  });

  it('board na main 1-20 usa faixa 11–20 e não traz sides do capítulo anterior', () => {
    const offer = rollNormalMissionOffer({
      mapId: 'stendra',
      saveSeed: 1,
      offerEpoch: 0,
      currentMainPhaseNumber: 20,
    });
    const board = buildCampMissionBoard({
      mapId: 'stendra',
      completedMainIds: [mainMissionId('1-1'), mainMissionId('1-10')],
      completedSideIds: [],
      completedMissionIds: [mainMissionId('1-1'), mainMissionId('1-10')],
      normalOfferIds: offer,
    });

    expect(board.main?.id).toBe(mainMissionId('1-20'));
    expect(board.sides.map((s) => s.id)).not.toContain(sideMissionId('stendra_ash_trail'));
    expect(board.sides.map((s) => s.id)).not.toContain(sideMissionId('stendra_village_watch'));
    expect(board.normals.length).toBe(offer.length);
    for (const normal of board.normals) {
      const phaseNumber = parsePhaseId(normal.phaseTemplateId).phaseNumber;
      expect(phaseNumber).toBeGreaterThanOrEqual(11);
      expect(phaseNumber).toBeLessThanOrEqual(20);
    }
  });

  it('ensureNormalOfferForBoard cria oferta se vazia e descarta legado fora da faixa', () => {
    const ensured = ensureNormalOfferForBoard({
      mapId: 'stendra',
      saveSeed: 3,
      offerEpoch: 0,
      currentOffer: [],
      currentMainPhaseNumber: 1,
    });
    expect(ensured.offer.length).toBeGreaterThanOrEqual(1);
    for (const id of ensured.offer) {
      const mission = getMissionById(id)!;
      expect(parsePhaseId(mission.phaseTemplateId).phaseNumber).toBe(1);
    }

    const kept = ensureNormalOfferForBoard({
      mapId: 'stendra',
      saveSeed: 3,
      offerEpoch: 0,
      currentOffer: ensured.offer,
      currentMainPhaseNumber: 1,
    });
    expect(kept.offer).toEqual(ensured.offer);

    const scrubbed = ensureNormalOfferForBoard({
      mapId: 'stendra',
      saveSeed: 3,
      offerEpoch: 0,
      currentOffer: ['normal:1-20', 'normal:1-30'],
      currentMainPhaseNumber: 1,
    });
    expect(scrubbed.offer.every((id) => id !== 'normal:1-20')).toBe(true);
    expect(scrubbed.offer.length).toBeGreaterThan(0);
  });
});
