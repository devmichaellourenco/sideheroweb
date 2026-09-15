import { describe, expect, it } from 'vitest';
import { HeroDto } from '../../../application/dto/GameStateDto';
import { SkillNodeDto } from '../../../application/dto/SkillNodeDto';
import { renderHeroSkillsTab } from './HeroSkillsTabRenderer';

function minimalHero(): HeroDto {
  return {
    id: 'h1',
    name: 'Galneon',
    heroClass: 'knight',
    activeSkills: [{ id: 'thrust' } as HeroDto['activeSkills'][number], null],
    unlockedActiveSkillSlots: 2,
  } as HeroDto;
}

function skillNode(overrides: Partial<SkillNodeDto> = {}): SkillNodeDto {
  const currentRank = overrides.currentRank ?? 1;
  const maxRank = overrides.maxRank ?? 3;
  return {
    id: 'thrust',
    name: 'Investida',
    description: 'Golpe pesado.',
    branch: 'offense',
    branchLabel: 'Ofensivo',
    scope: 'class',
    scopeLabel: 'Classe',
    maxRank,
    currentRank,
    status: 'owned',
    isEquipped: false,
    canAllocateRank: false,
    canEquip: true,
    scaling: 'str',
    scalingLabel: 'STR',
    battleStats: [],
    requirements: [],
    rankSlots: Array.from({ length: maxRank }, (_, index) => {
      const rank = index + 1;
      return {
        rank,
        filled: currentRank >= rank,
        isNext: currentRank === rank - 1,
        canAllocate: false,
        previewTitle: `Level ${rank}`,
        previewLines: ['Preview'],
      };
    }),
    ...overrides,
  };
}

describe('renderHeroSkillsTab', () => {
  it('não renderiza hints estáticos de equipar ou hover', () => {
    const html = renderHeroSkillsTab(minimalHero(), [skillNode()]);

    expect(html).toContain('hero-skills-tab-scroll');
    expect(html).toContain('skill-list');
    expect(html).toContain('skill-row');
    expect(html).toContain('Investida');
    expect(html).not.toContain('hero-skills-tab-meta');
    expect(html).not.toContain('Skills equipadas');
    expect(html).not.toContain('Passe o mouse sobre');
    expect(html).not.toContain('Toque em uma skill para equipar');
    expect(html).not.toContain('arraste até um slot');
    expect(html).not.toContain('Toque para equipar');
    expect(html).not.toContain('skill-card-equip-hint');
    expect(html).not.toContain('>Ativa<');
    expect(html).not.toContain('>Inativa<');
    expect(html).not.toContain('>Disponível<');
  });

  it('mostra (−) de refund em skills de aprimoramento com feature ativa', () => {
    const html = renderHeroSkillsTab(minimalHero(), [skillNode()], [], { improvementReset: 1 });
    expect(html).toContain('data-skill-refund="thrust"');
    expect(html).toContain('skill-row-rank-down');
  });

  it('mostra (−) em skills de evolução com feature ativa', () => {
    const hero = { ...minimalHero(), ascensionId: 'knight_military_guerreiro' } as HeroDto;
    const evolution = skillNode({
      id: 'mil_guer_rally',
      name: 'Chamado às Armas',
      currentRank: 1,
    });
    const html = renderHeroSkillsTab(hero, [skillNode()], [evolution], { improvementReset: 1 });
    expect(html).toContain('data-ascension-refund="mil_guer_rally"');
    expect(html).toContain('data-ascension-allocate="mil_guer_rally"');
  });

  it('não mostra (−) sem feature de reset', () => {
    const html = renderHeroSkillsTab(minimalHero(), [skillNode()]);
    expect(html).not.toContain('data-skill-refund');
    expect(html).not.toContain('data-ascension-refund');
  });
});
