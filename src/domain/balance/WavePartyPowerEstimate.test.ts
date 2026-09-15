import { describe, expect, it } from 'vitest';
import {
  DEFAULT_REFERENCE_PARTY,
  estimatePhasePower,
  estimateReferencePartyDps,
  estimateWavePower,
} from './WavePartyPowerEstimate';
import { HeroClass } from '../entities/HeroClass';

describe('WavePartyPowerEstimate', () => {
  it('DEFAULT_REFERENCE_PARTY tem 3 membros com classes e níveis válidos', () => {
    expect(DEFAULT_REFERENCE_PARTY).toHaveLength(3);
    for (const member of DEFAULT_REFERENCE_PARTY) {
      expect(member.level).toBeGreaterThan(0);
      expect(['sorcerer', 'knight', 'priest', 'berserker', 'archer', 'paladin']).toContain(
        member.heroClass,
      );
    }
  });

  it('estimateReferencePartyDps retorna ao menos 1 para party vazia', () => {
    expect(estimateReferencePartyDps([])).toBeGreaterThanOrEqual(1);
  });

  it('estimateReferencePartyDps cresce com mais membros', () => {
    const single = estimateReferencePartyDps([{ heroClass: 'knight', level: 10 }]);
    const triple = estimateReferencePartyDps([
      { heroClass: 'knight', level: 10 },
      { heroClass: 'sorcerer', level: 10 },
      { heroClass: 'priest', level: 10 },
    ]);
    expect(triple).toBeGreaterThan(single);
  });

  it('estimateReferencePartyDps cresce com nível mais alto', () => {
    const low = estimateReferencePartyDps([{ heroClass: 'knight', level: 1 }]);
    const high = estimateReferencePartyDps([{ heroClass: 'knight', level: 20 }]);
    expect(high).toBeGreaterThan(low);
  });

  it('estimateWavePower retorna null para phaseId inexistente', () => {
    const result = estimateWavePower('99-99', 0, DEFAULT_REFERENCE_PARTY);
    expect(result).toBeNull();
  });

  it('estimateWavePower retorna snapshot com campos corretos para fase existente', () => {
    // Tenta a primeira fase de qualquer mapa (1-1, 2-1 etc)
    let snapshot = null;
    for (let map = 0; map <= 5 && !snapshot; map += 1) {
      snapshot = estimateWavePower(`${map}-1`, 0, DEFAULT_REFERENCE_PARTY);
    }
    if (!snapshot) return; // sem fase disponível no bundle de teste
    expect(snapshot.enemyCount).toBeGreaterThan(0);
    expect(snapshot.totalHp).toBeGreaterThan(0);
    expect(snapshot.totalAttack).toBeGreaterThanOrEqual(0);
    expect(snapshot.estimatedEnemyBasicDps).toBeGreaterThan(0);
    expect(snapshot.referencePartyDps).toBeGreaterThan(0);
    expect(snapshot.estimatedClearSeconds).toBeGreaterThan(0);
    expect(snapshot.pressureRatio).toBeGreaterThan(0);
  });

  it('estimatePhasePower retorna snapshot de fase com waves', () => {
    let snapshot = null;
    for (let map = 0; map <= 5 && !snapshot; map += 1) {
      const candidate = estimatePhasePower(`${map}-1`, DEFAULT_REFERENCE_PARTY);
      if (candidate.waves.length > 0) snapshot = candidate;
    }
    if (!snapshot) return;
    expect(snapshot.waves.length).toBeGreaterThan(0);
    expect(snapshot.totalHp).toBeGreaterThan(0);
    expect(snapshot.phaseClearSeconds).toBeGreaterThan(0);
    expect(snapshot.referencePartyDps).toBeGreaterThan(0);
  });

  it('estimatePhasePower para fase sem waves retorna waves vazio', () => {
    const snapshot = estimatePhasePower('99-99', DEFAULT_REFERENCE_PARTY);
    expect(snapshot.waves).toHaveLength(0);
    expect(snapshot.totalHp).toBe(0);
  });

  it('pressureRatio é proporcional ao DPS de inimigos vs party', () => {
    let snapshot = null;
    for (let map = 0; map <= 5 && !snapshot; map += 1) {
      snapshot = estimateWavePower(`${map}-1`, 0, DEFAULT_REFERENCE_PARTY);
    }
    if (!snapshot) return;
    const expected = snapshot.estimatedEnemyBasicDps / snapshot.referencePartyDps;
    expect(snapshot.pressureRatio).toBeCloseTo(expected, 5);
  });

  it('party com herói de nível mais alto tem DPS maior', () => {
    const partyLow: Array<{ heroClass: HeroClass; level: number }> = [
      { heroClass: 'knight', level: 1 },
    ];
    const partyHigh: Array<{ heroClass: HeroClass; level: number }> = [
      { heroClass: 'knight', level: 30 },
    ];
    const dpsLow = estimateReferencePartyDps(partyLow);
    const dpsHigh = estimateReferencePartyDps(partyHigh);
    expect(dpsHigh).toBeGreaterThan(dpsLow);
  });
});
