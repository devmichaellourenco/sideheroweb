import { describe, expect, it } from 'vitest';
import {
  DEFAULT_WIN_RATE_BAND,
  sweepMapWinRate,
} from './CampaignWinRateSweep';
import { listPhasesForMap } from '../campaign/CampaignCatalog';

describe('CampaignWinRateSweep', () => {
  it('cobre todas as fases do mapa', () => {
    const expected = listPhasesForMap('stendra').length;
    const summary = sweepMapWinRate('stendra', { runsPerPhase: 1, seed: 1 });

    expect(expected).toBeGreaterThan(0);
    expect(summary.phases).toHaveLength(expected);
  });

  it('classifica cada fase e mantém a contagem coerente', () => {
    const summary = sweepMapWinRate('stendra', { runsPerPhase: 2, seed: 1 });

    for (const row of summary.phases) {
      expect(row.winRate).toBeGreaterThanOrEqual(0);
      expect(row.winRate).toBeLessThanOrEqual(1);
      const expectedVerdict =
        row.winRate < DEFAULT_WIN_RATE_BAND.min
          ? 'too_hard'
          : row.winRate > DEFAULT_WIN_RATE_BAND.max
            ? 'too_easy'
            : 'in_band';
      expect(row.verdict).toBe(expectedVerdict);
    }

    expect(summary.tooHard + summary.inBand + summary.tooEasy).toBe(summary.phases.length);
    expect(summary.outliers).toHaveLength(summary.tooHard + summary.tooEasy);
  });

  it('projeta nível de chegada crescente ao longo do mapa', () => {
    const summary = sweepMapWinRate('stendra', { runsPerPhase: 1, seed: 1 });
    const levels = summary.phases.map((row) => row.partyLevel);

    for (let i = 1; i < levels.length; i += 1) {
      expect(levels[i]).toBeGreaterThanOrEqual(levels[i - 1]);
    }
    expect(levels[0]).toBeGreaterThanOrEqual(2);
  });

  it('respeita banda e nível mínimo customizados', () => {
    const summary = sweepMapWinRate('stendra', {
      runsPerPhase: 1,
      seed: 1,
      band: { min: 0.9, max: 1 },
      minLevel: 5,
    });

    expect(summary.band).toEqual({ min: 0.9, max: 1 });
    expect(summary.phases[0].partyLevel).toBeGreaterThanOrEqual(5);
  });

  it('farming eleva o nível projetado de chegada', () => {
    const rush = sweepMapWinRate('stendra', { runsPerPhase: 1, seed: 1, repeatsPerPhase: 1 });
    const farmed = sweepMapWinRate('stendra', { runsPerPhase: 1, seed: 1, repeatsPerPhase: 3 });

    const lastRush = rush.phases[rush.phases.length - 1].partyLevel;
    const lastFarmed = farmed.phases[farmed.phases.length - 1].partyLevel;

    expect(lastFarmed).toBeGreaterThan(lastRush);
  });

  it('mapa inexistente devolve varredura vazia', () => {
    const summary = sweepMapWinRate('void_throne', { runsPerPhase: 1 });
    expect(summary.phases).toHaveLength(0);
    expect(summary.outliers).toHaveLength(0);
  });
});
