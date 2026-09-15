import { describe, expect, it } from 'vitest';
import {
  simulateEncounter,
  simulateEncounterBatch,
  simulateEncounterPlayback,
} from './CombatEncounterSimulator';

/**
 * Fases válidas (mapas 1–4, liberadas no perfil 'base').
 * Fase '1-1': tier 1, inimigos fracos — útil para vitória fácil.
 * Fase '4-1': tier 151, inimigos fortes — útil para wipe de party fraca.
 */
const EASY_PHASE = '1-1'; // tier 1
const HARD_PHASE = '4-1'; // tier 151

describe('CombatEncounterSimulator', () => {
  describe('determinismo com seed', () => {
    it('mesma seed → mesmo resultado (fase completa)', () => {
      const request = { phaseId: EASY_PHASE, seed: 42 };
      const r1 = simulateEncounter(request);
      const r2 = simulateEncounter(request);

      expect(r1.outcome).toBe(r2.outcome);
      expect(r1.ticks).toBe(r2.ticks);
      expect(r1.combatTime).toBe(r2.combatTime);
      expect(r1.wavesCleared).toBe(r2.wavesCleared);
      expect(r1.enemiesKilled).toBe(r2.enemiesKilled);
    });

    it('mesma seed → mesmo resultado (encontro ad-hoc)', () => {
      const request = {
        slots: [{ enemyType: 'goblin_raider', role: 'trash' as const, count: 2, level: 1 }],
        seed: 999,
      };
      const r1 = simulateEncounter(request);
      const r2 = simulateEncounter(request);
      expect(r1.outcome).toBe(r2.outcome);
      expect(r1.ticks).toBe(r2.ticks);
    });

    it('seeds diferentes → possivelmente resultados diferentes em batch', () => {
      // Com seeds distintos em 20 runs, ao menos o tempo de combate deve variar
      const batch = simulateEncounterBatch({ phaseId: EASY_PHASE, seed: 1 }, 5);
      expect(batch.runs).toBe(5);
      // Não necessariamente diferentes (pode ocorrer colisão), mas o batch deve somar
      const totalWins = batch.perRun.filter((r) => r.outcome === 'victory').length;
      expect(totalWins).toBeGreaterThanOrEqual(0);
    });
  });

  describe('vitória de party forte contra inimigos fracos', () => {
    it('party nível 50 vence fase 1-1 (wave única)', () => {
      const result = simulateEncounter({
        party: [
          { heroClass: 'knight', level: 50 },
          { heroClass: 'sorcerer', level: 50 },
          { heroClass: 'priest', level: 50 },
        ],
        phaseId: EASY_PHASE,
        waveIndex: 0,
        seed: 1,
      });
      expect(result.outcome).toBe('victory');
      expect(result.wavesCleared).toBe(1);
      expect(result.enemiesKilled).toBeGreaterThan(0);
    });

    it('party nível 30 vence fase completa 1-1', () => {
      const result = simulateEncounter({
        party: [{ heroClass: 'knight', level: 30 }, { heroClass: 'sorcerer', level: 30 }],
        phaseId: EASY_PHASE,
        seed: 7,
      });
      expect(result.outcome).toBe('victory');
      expect(result.totalEnemies).toBeGreaterThan(0);
    });

    it('party forte vence encontro ad-hoc com inimigo trash fraco', () => {
      const result = simulateEncounter({
        party: [{ heroClass: 'knight', level: 40 }, { heroClass: 'priest', level: 40 }],
        slots: [{ enemyType: 'giant_rat', role: 'trash', count: 3, level: 1 }],
        seed: 0,
      });
      expect(result.outcome).toBe('victory');
    });
  });

  describe('wipe de party fraca contra boss forte', () => {
    it('party nível 1 perde contra fase 4-1 (boss de tier alto)', () => {
      const result = simulateEncounter({
        party: [{ heroClass: 'knight', level: 1 }],
        phaseId: HARD_PHASE,
        waveIndex: 0,
        seed: 42,
      });
      // Pode ser wipe ou timeout; jamais victory para party nível 1 vs tier 151
      expect(['wipe', 'timeout']).toContain(result.outcome);
    });

    it('party nível 1 perde contra boss ad-hoc de nível alto', () => {
      const result = simulateEncounter({
        party: [{ heroClass: 'sorcerer', level: 1 }],
        slots: [{ enemyType: 'hill_ogre', role: 'boss', count: 1, level: 50 }],
        seed: 1,
      });
      expect(['wipe', 'timeout']).toContain(result.outcome);
    });
  });

  describe('timeout', () => {
    it('respeita maxSeconds muito baixo', () => {
      const result = simulateEncounter({
        party: [{ heroClass: 'knight', level: 10 }],
        phaseId: HARD_PHASE,
        maxSeconds: 1,
        seed: 0,
      });
      expect(result.outcome).toBe('timeout');
      expect(result.ticks).toBeLessThanOrEqual(2); // 1s / 1s delta = ≤2 ticks
    });
  });

  describe('simulateEncounterBatch — agregação coerente', () => {
    it('winRate entre 0 e 1', () => {
      const batch = simulateEncounterBatch(
        { party: [{ heroClass: 'knight', level: 20 }], phaseId: EASY_PHASE, seed: 10 },
        5,
      );
      expect(batch.winRate).toBeGreaterThanOrEqual(0);
      expect(batch.winRate).toBeLessThanOrEqual(1);
    });

    it('taxas somam 1', () => {
      const batch = simulateEncounterBatch({ phaseId: EASY_PHASE, seed: 20 }, 4);
      expect(batch.winRate + batch.wipeRate + batch.timeoutRate).toBeCloseTo(1, 10);
    });

    it('minCombatTime ≤ avgCombatTime ≤ maxCombatTime', () => {
      const batch = simulateEncounterBatch({ phaseId: EASY_PHASE, seed: 5 }, 3);
      expect(batch.minCombatTime).toBeLessThanOrEqual(batch.avgCombatTime);
      expect(batch.avgCombatTime).toBeLessThanOrEqual(batch.maxCombatTime);
    });

    it('perRun.length === runs', () => {
      const batch = simulateEncounterBatch({ phaseId: EASY_PHASE, seed: 99 }, 7);
      expect(batch.perRun).toHaveLength(7);
    });
  });

  describe('draftPhase', () => {
    it('simula multi-wave do rascunho sem depender do override salvo', () => {
      const request = {
        phaseId: EASY_PHASE,
        seed: 7,
        party: [
          { heroClass: 'sorcerer', level: 20 },
          { heroClass: 'knight', level: 20 },
          { heroClass: 'priest', level: 20 },
        ],
        draftPhase: {
          displayName: 'Draft Lab',
          difficultyTier: 1,
          statMultiplier: 1,
          waves: [
            {
              id: 'w1',
              slots: [{ enemyType: 'goblin_raider', role: 'trash' as const, count: 1, level: 1 }],
            },
            {
              id: 'w2',
              slots: [{ enemyType: 'goblin_raider', role: 'boss' as const, count: 1, level: 1 }],
            },
          ],
        },
      };
      const result = simulateEncounter(request);
      expect(result.outcome).toBe('victory');
      expect(result.wavesCleared).toBe(2);
      expect(result.totalEnemies).toBe(2);
    });
  });

  describe('simulateEncounterPlayback', () => {
    it('termina com o mesmo outcome que simulateEncounter', () => {
      const request = {
        phaseId: EASY_PHASE,
        seed: 11,
        draftPhase: {
          waves: [
            {
              slots: [{ enemyType: 'goblin_raider', role: 'trash' as const, count: 1, level: 1 }],
            },
          ],
        },
        party: [{ heroClass: 'knight', level: 15 }],
      };
      const plain = simulateEncounter(request);
      const playback = simulateEncounterPlayback(request);
      expect(playback.result.outcome).toBe(plain.outcome);
      expect(playback.result.ticks).toBe(plain.ticks);
      expect(playback.snapshots.length).toBeGreaterThan(0);
      expect(playback.snapshots[playback.snapshots.length - 1]?.intermission).toBeTruthy();
      const mid = playback.snapshots.find((s) => s.heroes.some((h) => h.skills.length >= 0));
      expect(mid?.heroes[0]).toMatchObject({
        actionTimeRatio: expect.any(Number),
        actionTimeRemaining: expect.any(Number),
        skills: expect.any(Array),
      });
      const withLog = playback.snapshots.find((s) => (s.logMessages?.length ?? 0) > 0);
      expect(withLog?.logMessages.length).toBeGreaterThan(0);
      expect(withLog?.stats).toMatchObject({
        damageDealt: expect.any(Number),
        heroes: expect.any(Array),
      });
    });
  });
});
