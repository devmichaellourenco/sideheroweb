import { describe, expect, it } from 'vitest';
import { HeroDto } from '../../../application/dto/GameStateDto';
import { renderHeroAttributesTab } from './HeroAttributesTabRenderer';

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
    allocatedAttributes: { str: 1, dex: 0, int: 2 },
    totalAttributes: { str: 6, dex: 8, int: 16 },
    unspentImprovementPoints: 1,
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
    combatStatSheet: [
      {
        id: 'offense',
        title: 'Ofensiva',
        lines: [
          {
            id: 'dps',
            label: 'DPS estimado',
            value: '12.4',
            tooltipLines: ['Estimativa com ataque básico contínuo.'],
          },
        ],
      },
    ],
    ...overrides,
  } as HeroDto;
}

describe('renderHeroAttributesTab', () => {
  it('renderiza atributos em linha e ficha de combate com tooltip', () => {
    const html = renderHeroAttributesTab(minimalHero());

    expect(html).toContain('hero-attr-row');
    expect(html).toContain('hero-attr-label');
    expect(html).toContain('hero-attr-value');
    expect(html).toContain('data-attr-spend="str"');
    expect(html).toContain('hero-attr-add');
    expect(html).not.toContain('data-attr-refund');
    expect(html).not.toContain('+1 STR');
    expect(html).toContain('hero-stat-row');
    expect(html).toContain('data-hero-stat-tooltip');
    expect(html).toContain('DPS estimado');
    expect(html).toContain('hero-stat-tooltip-content');
  });

  it('exibe ícones de estatística nos chips de atributo e nas linhas da ficha', () => {
    const html = renderHeroAttributesTab(minimalHero());

    // Um ícone por chip STR/DEX/INT
    expect(html.match(/hero-attr-icon/g)?.length).toBe(3);
    // Linha "DPS estimado" (id: dps) com ícone na linha e no tooltip
    expect(html.match(/hero-stat-icon/g)?.length).toBe(2);
  });

  it('exibe (−) e reset em massa conforme nível da feature', () => {
    const withoutMass = renderHeroAttributesTab(minimalHero(), { improvementReset: 1 });
    expect(withoutMass).toContain('data-attr-refund="str"');
    expect(withoutMass).toContain('data-attr-refund="int"');
    expect(withoutMass).not.toContain('data-mass-refund');

    const withMass = renderHeroAttributesTab(minimalHero(), { improvementReset: 2 });
    expect(withMass).toContain('data-mass-refund');
    expect(withMass).toContain('Reset em massa');
  });

  it('inclui skills de batalha e equipamento na aba Status', () => {
    const html = renderHeroAttributesTab(
      minimalHero({
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
            battleStats: [{ label: 'DPS estimado', value: '~10 (ataque contínuo)' }],
          },
          null,
          null,
        ],
        equipment: {
          weapon: {
            id: 'w1',
            name: 'Espada',
            templateId: 'sword',
            slot: 'weapon',
            rarity: 'common',
            attackBonus: 4,
            defenseBonus: 0,
            healthBonus: 0,
            attackSpeedBonus: 0,
            castSpeedBonus: 0,
            critChanceBonus: 0,
            critDamageBonus: 0,
            fireResistBonus: 0,
            coldResistBonus: 0,
            lightningResistBonus: 0,
            airResistBonus: 0,
            allElementalResistBonus: 0,
            fireDamageBonus: 0,
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
          } as NonNullable<HeroDto['equipment']['weapon']>,
          armor: null,
          accessory: null,
        },
      }),
    );

    expect(html).toContain('Skills de batalha');
    expect(html).toContain('Equipamento e passivas');
    expect(html).toContain('Ataque Básico');
    expect(html).toContain('Espada');
  });
});
