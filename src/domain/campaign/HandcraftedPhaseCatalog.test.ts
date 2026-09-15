import { describe, expect, it } from 'vitest';
import { getSeasonFinalePhase, resolvePhase } from './CampaignCatalog';
import { buildPhaseId } from './CampaignIds';
import { HANDCRAFTED_PHASES } from './HandcraftedPhaseCatalog';
import { TOTAL_CAMPAIGN_PHASES } from './CampaignMaps';

describe('HandcraftedPhaseCatalog', () => {
  it('contém 500 fases handcrafted', () => {
    expect(HANDCRAFTED_PHASES.length).toBe(TOTAL_CAMPAIGN_PHASES);
    expect(HANDCRAFTED_PHASES.length).toBe(500);
  });

  it('marca boss de capítulo a cada 50 fases', () => {
    for (let mapIndex = 1; mapIndex <= 10; mapIndex++) {
      const phase = resolvePhase(buildPhaseId(mapIndex, 50));
      expect(phase?.milestoneBoss).toBe(true);
      expect(phase?.waves.at(-1)?.slots.some((slot) => slot.role === 'boss')).toBe(true);
    }
  });

  it('define finale da temporada em 4-50 sem desbloqueios no perfil base', () => {
    const finale = getSeasonFinalePhase();
    expect(finale?.id).toBe('4-50');
    expect(finale?.seasonFinale).toBe(true);
    expect(finale?.unlocks).toEqual([]);
    expect(finale?.difficultyTier).toBe(200);
  });

  it('não desbloqueia mapa DLC ao concluir Morthaven', () => {
    const morthavenFinale = resolvePhase('4-50');
    expect(morthavenFinale?.unlocks).toEqual([]);
    expect(resolvePhase('5-1')).not.toBeNull();
  });

  it('não usa gerador procedural no catálogo', () => {
    expect(resolvePhase('5-25')).not.toBeNull();
    expect(resolvePhase('99-99')).toBeNull();
  });

  it('usa nomes temáticos em vez de "Mapa N"', () => {
    const generic = /^(Stendra|Gruftall|Valdris|Morthaven|Céu Quebrado|Abismo Carmesim|Forja Eterna|Bosque Antigo|Torre do Crepúsculo|Trono do Vazio) \d+$/;
    for (const phase of HANDCRAFTED_PHASES) {
      expect(phase.displayName).not.toMatch(generic);
      expect(phase.displayName.trim().length).toBeGreaterThan(3);
    }
    expect(resolvePhase('1-1')?.displayName).toBe('Aventuras na Estrada');
    expect(resolvePhase('1-14')?.displayName).toBe('Vale das Teias');
    expect(resolvePhase('2-1')?.displayName).toBe('Chegada Calorosa');
    expect(resolvePhase('4-50')?.displayName).toBe('Duque de Morthaven');
  });
});
