import { describe, expect, it } from 'vitest';
import { resolvePhase } from './CampaignCatalog';
import { buildPhaseId } from './CampaignIds';
import { getMilestoneBlueprint, isMajorMilestoneTier } from './MilestonePhaseBlueprints';

describe('MilestonePhaseBlueprints', () => {
  it('define marcos handcrafted para todas as fases X-50', () => {
    for (let mapIndex = 1; mapIndex <= 10; mapIndex++) {
      const phaseId = buildPhaseId(mapIndex, 50);
      expect(getMilestoneBlueprint(phaseId)).not.toBeNull();
    }
  });

  it('aplica nomes únicos nos marcos principais 50/100/250/500', () => {
    expect(resolvePhase(buildPhaseId(1, 50))?.displayName).toBe('Guardião Elemental');
    expect(resolvePhase(buildPhaseId(2, 50))?.displayName).toBe('Centelha de Gonodor');
    expect(resolvePhase(buildPhaseId(5, 50))?.displayName).toBe('Colosso do Céu Quebrado');
    expect(resolvePhase(buildPhaseId(10, 50))?.displayName).toBe('Soberano do Vazio');
  });

  it('aplica Gonodor no marco final de Gruftall', () => {
    const phase = resolvePhase(buildPhaseId(2, 50));
    expect(phase?.displayName).toBe('Centelha de Gonodor');
    const bossWave = phase?.waves.at(-1);
    expect(bossWave?.slots.some((slot) => slot.enemyType === 'gonodor' && slot.role === 'boss')).toBe(true);
  });

  it('marcos principais têm multiplicador maior', () => {
    expect(resolvePhase(buildPhaseId(1, 50))?.statMultiplier).toBeGreaterThanOrEqual(1.5);
    expect(resolvePhase(buildPhaseId(10, 50))?.statMultiplier).toBeGreaterThanOrEqual(1.9);
    expect(isMajorMilestoneTier(250)).toBe(true);
  });
});
