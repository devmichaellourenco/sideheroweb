// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest';
import { GameStateDto, HeroDto } from '../../application/dto/GameStateDto';
import { HeroDetailModalHandlers, HeroDetailModalRenderer } from './HeroDetailModalRenderer';

function minimalHero(overrides: Partial<HeroDto> = {}): HeroDto {
  return {
    id: 'h1',
    name: 'Galneon',
    heroClass: 'knight',
    emoji: '⚔️',
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
    baseAttributes: { str: 10, dex: 5, int: 5 },
    allocatedAttributes: { str: 0, dex: 0, int: 0 },
    totalAttributes: { str: 10, dex: 5, int: 5 },
    unspentImprovementPoints: 0,
    unspentAscensionPoints: 0,
    skillRanks: { basic_attack: 1 },
    equippedSkillIds: ['basic_attack'],
    activeSkills: [null, null, null],
    maxActiveSkills: 3,
    unlockedActiveSkillSlots: 1,
    ascensionId: null,
    hasUnspentPoints: false,
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

function noopHandlers(): HeroDetailModalHandlers {
  return {
    onSlotClick: () => undefined,
    onSpendAttribute: () => undefined,
    onRefundAttribute: () => undefined,
    onAllocateSkill: () => undefined,
    onRefundSkill: () => undefined,
    onMassRefund: () => undefined,
    onAssignSkillSlot: () => undefined,
    onClearSkillSlot: () => undefined,
    onEquipSkillFirstAvailable: () => undefined,
    onAscendClass: () => undefined,
    onAllocateAscensionSkill: () => undefined,
    onTabChange: () => undefined,
  };
}

describe('HeroDetailModalRenderer', () => {
  it('aba Inventário não renderiza hint estático de equipamento', () => {
    const container = document.createElement('div');
    const renderer = new HeroDetailModalRenderer();
    renderer.setActiveTab('sheet');

    renderer.render(
      container,
      { heroes: [minimalHero()] } as GameStateDto,
      'h1',
      noopHandlers(),
    );

    expect(container.innerHTML).toContain('hero-detail-loadout');
    expect(container.innerHTML).toContain('hero-loadout-gear');
    expect(container.innerHTML).toContain('data-inline-equip-host');
    expect(container.innerHTML).not.toContain('hero-detail-loadout-hint');
    expect(container.innerHTML).not.toContain('Toque em um slot de equipamento');
  });

  it('mostra badge de aprimoramento em Status e Skills quando há pontos', () => {
    const container = document.createElement('div');
    const renderer = new HeroDetailModalRenderer();

    renderer.render(
      container,
      { heroes: [minimalHero({ hasUnspentPoints: true, unspentImprovementPoints: 2 })] } as GameStateDto,
      'h1',
      noopHandlers(),
    );

    const badges = container.querySelectorAll('.inventory-upgrade-badge');
    expect(badges.length).toBe(2);
    expect(container.innerHTML).toMatch(/data-hero-tab="attributes"[^>]*>Status<span class="inventory-upgrade-badge">!<\/span>/);
    expect(container.innerHTML).toMatch(/data-hero-tab="skills"[^>]*>Skills<span class="inventory-upgrade-badge">!<\/span>/);
  });

  it('não mostra badge de aprimoramento sem pontos disponíveis', () => {
    const container = document.createElement('div');
    const renderer = new HeroDetailModalRenderer();

    renderer.render(
      container,
      { heroes: [minimalHero({ hasUnspentPoints: false, unspentImprovementPoints: 0 })] } as GameStateDto,
      'h1',
      noopHandlers(),
    );

    expect(container.querySelectorAll('.inventory-upgrade-badge').length).toBe(0);
  });

  it('destaca slot ativo no loadout quando em modo equipar', () => {
    const container = document.createElement('div');
    const renderer = new HeroDetailModalRenderer();
    renderer.setActiveTab('sheet');
    renderer.setInlineActiveSlot({ heroId: 'h1', slot: 'weapon' });

    renderer.render(
      container,
      { heroes: [minimalHero()] } as GameStateDto,
      'h1',
      noopHandlers(),
    );

    expect(container.innerHTML).toContain('loadout-slot--active');
    expect(container.innerHTML).toContain('data-slot="weapon"');
  });
});
