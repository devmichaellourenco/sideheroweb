import { describe, expect, it } from 'vitest';
import { HeroDto } from '../../application/dto/GameStateDto';
import {
  improvementSpendLabel,
  renderHeroImprovementStat,
} from './HeroImprovementPointsPresentation';

function minimalHero(overrides: Partial<HeroDto> = {}): HeroDto {
  return {
    id: 'h1',
    name: 'Nix',
    heroClass: 'sorcerer',
    emoji: '🔮',
    level: 3,
    experience: 0,
    experienceToNextLevel: 100,
    attack: 24,
    defense: 8,
    attackSpeed: 0.4,
    castSpeed: 1,
    critChance: 0.05,
    critDamage: 1.65,
    health: 80,
    maxHealth: 90,
    baseAttributes: { str: 5, dex: 8, int: 14 },
    allocatedAttributes: { str: 0, dex: 0, int: 0 },
    totalAttributes: { str: 5, dex: 8, int: 14 },
    unspentImprovementPoints: 2,
    unspentAscensionPoints: 0,
    skillRanks: { basic_attack: 1 },
    equippedSkillIds: ['basic_attack'],
    activeSkills: [null, null, null],
    maxActiveSkills: 3,
    unlockedActiveSkillSlots: 1,
    ascensionId: null,
    hasUnspentPoints: true,
    equipment: { weapon: null, armor: null, accessory: null },
    combatIntent: null,
    combatSkills: [],
    combatSkillCooldowns: [],
    statusEffects: [],
    combatResists: { fire: 0, cold: 0, lightning: 0, air: 0 },
    combatStatSheet: [],
    ...overrides,
  } as HeroDto;
}

describe('renderHeroImprovementStat', () => {
  it('renderiza chip compacto Aprimoramento com tooltip rico', () => {
    const html = renderHeroImprovementStat(minimalHero());

    expect(html).toContain('hero-improvement-stat');
    expect(html).toContain('hero-improvement-stat--available');
    expect(html).toContain('aria-label="Aprimoramento: 2"');
    expect(html).toContain('>2<');
    expect(html).toContain('data-hero-improvement-tooltip');
    expect(html).toContain('hero-improvement-tooltip-content');
    expect(html).toContain('Status');
    expect(html).toContain('Skills');
    expect(html).toContain('Um único saldo');
    expect(html).toContain('evolução');
  });

  it('não mostra chip separado de Evolução após ascensão', () => {
    const html = renderHeroImprovementStat(
      minimalHero({
        ascensionId: 'knight_military_guerreiro',
        unspentImprovementPoints: 4,
        unspentAscensionPoints: 2,
      }),
    );
    expect(html).not.toContain('hero-improvement-stat--ascension');
    expect(html).not.toContain('>Evolução<');
    expect(html).toContain('aria-label="Aprimoramento: 4"');
    expect(html).toContain('>4<');
  });

  it('omite destaque quando não há saldo', () => {
    const html = renderHeroImprovementStat(
      minimalHero({ unspentImprovementPoints: 0, hasUnspentPoints: false }),
    );

    expect(html).not.toContain('hero-improvement-stat--available');
    expect(html).toContain('>0<');
  });

  it('rotula gasto de atributo como Aprimoramento', () => {
    expect(improvementSpendLabel('STR')).toBe('Gastar 1 Aprimoramento em STR');
  });
});
