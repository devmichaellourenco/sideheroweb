import { describe, expect, it } from 'vitest';
import { resolvePhase } from './CampaignCatalog';
import { buildPhaseId } from './CampaignIds';
import {
  getPhaseChallenge,
  listPhaseChallengeIds,
} from './PhaseChallengeCatalog';

describe('PhaseChallengeCatalog — BAL-011 multi-slot', () => {
  it('Stendra rota pressão: race / sustain / spike / warded / armored', () => {
    expect(getPhaseChallenge(buildPhaseId(1, 10))?.kind).toBe('race');
    expect(getPhaseChallenge(buildPhaseId(1, 18))?.kind).toBe('sustain');
    expect(getPhaseChallenge(buildPhaseId(1, 25))?.kind).toBe('spike');
    expect(getPhaseChallenge(buildPhaseId(1, 32))?.kind).toBe('warded');
    expect(getPhaseChallenge(buildPhaseId(1, 32))?.wardedElement).toBe('fire');
    expect(getPhaseChallenge(buildPhaseId(1, 40))?.kind).toBe('armored');
    expect(getPhaseChallenge(buildPhaseId(1, 50))?.kind).toBe('sustain');
  });

  it('anti-mago (warded) e anti-físico (armored) com hints explícitos', () => {
    const warded = resolvePhase(buildPhaseId(1, 32));
    expect(warded?.challengeKind).toBe('warded');
    expect(warded?.challengeHint).toMatch(/mago/i);
    expect(warded?.challengeHint).toMatch(/físico/i);
    expect(
      warded?.waves.some((wave) =>
        wave.slots.some(
          (slot) =>
            slot.enemyType === 'minor_fire_elemental' || slot.enemyType === 'major_elemental',
        ),
      ),
    ).toBe(true);

    const armored = resolvePhase(buildPhaseId(1, 40));
    expect(armored?.challengeKind).toBe('armored');
    expect(armored?.challengeHint).toMatch(/mago|elemental/i);
    expect(armored?.displayName).toBe('Muralha de Ogro');
  });

  it('cobre os 4 mapas base com kinds mistos (não só atrito/priest)', () => {
    const ids = listPhaseChallengeIds();
    expect(ids.filter((id) => id.startsWith('1-')).length).toBe(6);
    expect(ids.filter((id) => id.startsWith('2-')).length).toBe(5);
    expect(ids.filter((id) => id.startsWith('3-')).length).toBe(5);
    expect(ids.filter((id) => id.startsWith('4-')).length).toBe(5);

    const kinds = new Set(ids.map((id) => getPhaseChallenge(id)!.kind));
    expect(kinds.has('race')).toBe(true);
    expect(kinds.has('sustain')).toBe(true);
    expect(kinds.has('spike')).toBe(true);
    expect(kinds.has('warded')).toBe(true);
    expect(kinds.has('armored')).toBe(true);
  });

  it('Gruftall/Valdris/Morthaven aplicam desafios temáticos', () => {
    expect(resolvePhase(buildPhaseId(2, 18))?.challengeKind).toBe('warded');
    expect(resolvePhase(buildPhaseId(2, 50))?.displayName).toBe('Centelha de Gonodor');
    expect(resolvePhase(buildPhaseId(3, 40))?.challengeHint).toMatch(/mago/i);
    expect(resolvePhase(buildPhaseId(3, 50))?.challengeKind).toBe('armored');
    expect(
      resolvePhase(buildPhaseId(3, 50))?.waves.at(-1)?.slots.some(
        (slot) => slot.enemyType === 'renegade_necromancer' && slot.role === 'boss',
      ),
    ).toBe(true);
    expect(resolvePhase(buildPhaseId(4, 25))?.challengeKind).toBe('warded');
    expect(resolvePhase(buildPhaseId(4, 50))?.waves.at(-1)?.slots.some(
      (slot) => slot.enemyType === 'morthaven_duke',
    )).toBe(true);
  });

  it('race continua soft (mult < 1) e no máximo 3 inimigos por wave', () => {
    const race = resolvePhase(buildPhaseId(1, 10));
    expect(race?.statMultiplier).toBeLessThan(1);
    for (const wave of race?.waves ?? []) {
      const total = wave.slots.reduce((sum, slot) => sum + slot.count, 0);
      expect(total).toBeLessThanOrEqual(3);
    }
    expect(race?.waves[0]?.slots.reduce((sum, slot) => sum + slot.count, 0)).toBe(3);
  });
});
