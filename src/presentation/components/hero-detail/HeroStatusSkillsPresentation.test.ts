import { describe, expect, it } from 'vitest';
import { HeroDto } from '../../../application/dto/GameStateDto';
import {
  renderHeroStatusExtras,
  renderStatusBattleSkillsSection,
  renderStatusEquipmentEffectsSection,
  renderStatusPassivesSection,
} from './HeroStatusSkillsPresentation';

function minimalHero(overrides: Partial<HeroDto> = {}): HeroDto {
  return {
    id: 'h1',
    name: 'Nix',
    heroClass: 'sorcerer',
    emoji: '🔮',
    level: 5,
    experience: 0,
    experienceToNextLevel: 100,
    attack: 40,
    defense: 8,
    attackSpeed: 0.5,
    castSpeed: 1,
    critChance: 0.1,
    critDamage: 1.5,
    health: 80,
    maxHealth: 90,
    baseAttributes: { str: 5, dex: 8, int: 14 },
    allocatedAttributes: { str: 0, dex: 0, int: 2 },
    totalAttributes: { str: 5, dex: 8, int: 16 },
    unspentImprovementPoints: 0,
    unspentAscensionPoints: 0,
    skillRanks: { fireball: 2 },
    equippedSkillIds: ['basic_attack', 'fireball'],
    activeSkills: [
      {
        id: 'basic_attack',
        name: 'Ataque Básico',
        branch: 'offense',
        branchLabel: 'Ofensiva',
        description: 'Golpe básico.',
        currentRank: 1,
        maxRank: 1,
        scope: 'universal',
        scopeLabel: 'Universal',
        scalingLabel: 'STR',
        battleStats: [
          {
            label: 'Tipo',
            value: 'Físico',
            tooltipLines: [{ text: 'Dano físico' }],
          },
          {
            label: 'DPS estimado',
            value: '~20 (ataque contínuo)',
            emphasize: true,
            tooltipLines: [
              { icon: 'attack', text: 'Poder × crit × APS' },
              { text: 'DPS = 20' },
            ],
          },
        ],
      },
      {
        id: 'fireball',
        name: 'Bola de Fogo',
        branch: 'offense',
        branchLabel: 'Ofensiva',
        description: 'Projétil de fogo.',
        currentRank: 2,
        maxRank: 5,
        scope: 'class',
        scopeLabel: 'Classe',
        scalingLabel: 'INT',
        battleStats: [
          {
            label: 'Tipo',
            value: 'Fogo',
            tooltipLines: [{ icon: 'rune', text: 'Elemento fogo' }],
          },
          {
            label: 'DPS estimado',
            value: '~12 (cast contínuo da skill)',
            emphasize: true,
            tooltipLines: [{ text: 'DPS = 12' }],
          },
        ],
      },
      null,
    ],
    maxActiveSkills: 3,
    unlockedActiveSkillSlots: 2,
    ascensionId: null,
    hasUnspentPoints: false,
    equipment: {
      weapon: {
        id: 'w1',
        name: 'Cajado',
        templateId: 'staff',
        slot: 'weapon',
        rarity: 'rare',
        attackBonus: 8,
        defenseBonus: 0,
        healthBonus: 0,
        attackSpeedBonus: 0,
        castSpeedBonus: 0.05,
        critChanceBonus: 0,
        critDamageBonus: 0,
        fireResistBonus: 0,
        coldResistBonus: 0,
        lightningResistBonus: 0,
        airResistBonus: 0,
        allElementalResistBonus: 0,
        fireDamageBonus: 10,
        fireResistPenetrationBonus: 0,
        coldDamageBonus: 0,
        lightningDamageBonus: 0,
        airDamageBonus: 0,
        allElementalDamageBonus: 0,
        fireDamageFlat: 0,
        coldDamageFlat: 0,
        lightningDamageFlat: 0,
        airDamageFlat: 0,
        fireResistFlat: 0,
        coldResistFlat: 0,
        lightningResistFlat: 0,
        airResistFlat: 0,
        attackPercentBonus: 0,
        defensePercentBonus: 0,
        healthPercentBonus: 0,
        physicalDamagePercentBonus: 0,
        cooldownReductionBonus: 0,
        requirements: { minLevel: 1 },
      } as HeroDto['equipment']['weapon'],
      armor: null,
      accessory: null,
    },
    combatIntent: null,
    combatSkills: [],
    combatSkillCooldowns: [],
    actionTimeRatio: 0,
    actionTimeRemaining: 0,
    actionTimeTotal: 0,
    statusEffects: [],
    combatResists: { fire: 0, cold: 0, lightning: 0, air: 0 },
    combatStatSheet: [],
    ...overrides,
  } as HeroDto;
}

describe('HeroStatusSkillsPresentation', () => {
  it('lista skills de batalha com DPS e tooltips, sem lore', () => {
    const html = renderStatusBattleSkillsSection(minimalHero());

    expect(html).toContain('Skills de batalha');
    expect(html).toContain('data-status-skill-id="fireball"');
    expect(html).toContain('DPS estimado');
    expect(html).toContain('Bola de Fogo');
    expect(html).toContain('data-hero-stat-tooltip');
    expect(html).toContain('hero-stat-tooltip-content');
    expect(html).toContain('Poder × crit × APS');
    expect(html).not.toContain('Projétil de fogo');
    expect(html).not.toContain('Golpe básico');
  });

  it('lista equipamento com bônus', () => {
    const html = renderStatusEquipmentEffectsSection(minimalHero());

    expect(html).toContain('Equipamento e passivas');
    expect(html).toContain('Cajado');
    expect(html).toContain('hero-status-gear-bonuses');
  });

  it('combina seções extras', () => {
    const html = renderHeroStatusExtras(minimalHero());
    expect(html).toContain('Passivas');
    expect(html).toContain('Skills de batalha');
    expect(html).toContain('Equipamento e passivas');
  });

  it('lista passivas ativas com valor efetivo', () => {
    const html = renderStatusPassivesSection(
      minimalHero({
        activePassives: [
          {
            id: 'titan_health',
            name: 'Saúde de Titã',
            description: '+2% vida por DEF',
            sourceLabel: 'Classe',
            effectiveSummary: '+16% vida (2%×DEF 8)',
          },
        ],
      }),
    );

    expect(html).toContain('data-passive-id="titan_health"');
    expect(html).toContain('Saúde de Titã');
    expect(html).toContain('+16% vida');
    expect(html).toContain('Classe');
  });
});
