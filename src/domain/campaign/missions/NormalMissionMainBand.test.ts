import { describe, expect, it } from 'vitest';
import {
  isNormalPhaseInBandForMain,
  chapterMainPhaseForPhaseNumber,
  listMissionChapterOptions,
  normalPhaseNumberBandForCurrentMain,
} from './NormalMissionMainBand';
import { normalMissionId } from './MissionId';
import { rollNormalMissionOffer } from './NormalMissionOffer';
import { parsePhaseId } from '../CampaignIds';
import { getMissionById } from './MissionCatalog';

describe('NormalMissionMainBand', () => {
  it('na main 1-1 o capítulo é só a fase 1 (tutorial)', () => {
    expect(normalPhaseNumberBandForCurrentMain(1)).toEqual({ min: 1, max: 1 });
  });

  it('na main 1-10 o capítulo é 2–10 (meio + marco)', () => {
    expect(normalPhaseNumberBandForCurrentMain(10)).toEqual({ min: 2, max: 10 });
  });

  it('na main 1-20 o capítulo é 11–20', () => {
    expect(normalPhaseNumberBandForCurrentMain(20)).toEqual({ min: 11, max: 20 });
  });

  it('no marco final o capítulo é 41–50', () => {
    expect(normalPhaseNumberBandForCurrentMain(50)).toEqual({ min: 41, max: 50 });
  });

  it('chapterMainPhaseForPhaseNumber aponta o marco dono', () => {
    expect(chapterMainPhaseForPhaseNumber(1)).toBe(1);
    expect(chapterMainPhaseForPhaseNumber(2)).toBe(10);
    expect(chapterMainPhaseForPhaseNumber(5)).toBe(10);
    expect(chapterMainPhaseForPhaseNumber(10)).toBe(10);
    expect(chapterMainPhaseForPhaseNumber(11)).toBe(20);
    expect(chapterMainPhaseForPhaseNumber(22)).toBe(30);
  });

  it('listMissionChapterOptions cobre todos os marcos', () => {
    const options = listMissionChapterOptions();
    expect(options[0]).toMatchObject({
      mainPhase: 1,
      min: 1,
      max: 1,
    });
    expect(options[1]).toMatchObject({
      mainPhase: 10,
      min: 2,
      max: 10,
    });
    expect(options).toHaveLength(6);
    expect(options.some((entry) => entry.mainPhase === 50)).toBe(true);
  });

  it('isNormalPhaseInBandForMain rejeita fases de outro capítulo', () => {
    expect(isNormalPhaseInBandForMain(1, 1)).toBe(true);
    expect(isNormalPhaseInBandForMain(2, 1)).toBe(false);
    expect(isNormalPhaseInBandForMain(2, 10)).toBe(true);
    expect(isNormalPhaseInBandForMain(5, 10)).toBe(true);
    expect(isNormalPhaseInBandForMain(10, 10)).toBe(true);
    expect(isNormalPhaseInBandForMain(11, 10)).toBe(false);
  });
});

describe('rollNormalMissionOffer com marco da main', () => {
  it('na main 1-1 só sorteia template 1-1', () => {
    const offer = rollNormalMissionOffer({
      mapId: 'stendra',
      saveSeed: 42,
      offerEpoch: 0,
      currentMainPhaseNumber: 1,
    });

    expect(offer.length).toBeGreaterThan(0);
    for (const id of offer) {
      const mission = getMissionById(id);
      expect(mission?.kind).toBe('normal');
      const phaseNumber = parsePhaseId(mission!.phaseTemplateId).phaseNumber;
      expect(phaseNumber).toBe(1);
      expect(id).not.toBe(normalMissionId('1-2'));
    }
  });

  it('na main 1-10 sorteia templates 2–10', () => {
    const offer = rollNormalMissionOffer({
      mapId: 'stendra',
      saveSeed: 7,
      offerEpoch: 0,
      currentMainPhaseNumber: 10,
    });
    expect(offer.length).toBeGreaterThan(0);
    for (const id of offer) {
      const phaseNumber = parsePhaseId(getMissionById(id)!.phaseTemplateId).phaseNumber;
      expect(phaseNumber).toBeGreaterThanOrEqual(2);
      expect(phaseNumber).toBeLessThanOrEqual(10);
    }
  });
});
