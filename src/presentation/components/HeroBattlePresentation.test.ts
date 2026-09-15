import { describe, expect, it } from 'vitest';
import { HeroDto } from '../../application/dto/GameStateDto';
import { renderHeroFormationTooltipContent } from './HeroBattlePresentation';

function heroWithActiveSkills(activeSkills: HeroDto['activeSkills']): HeroDto {
  return {
    id: 'h1',
    name: 'Galneon',
    heroClass: 'knight',
    emoji: '⚔',
    level: 1,
    experience: 0,
    experienceToNextLevel: 100,
    attack: 10,
    defense: 5,
    attackSpeed: 1,
    castSpeed: 1,
    critChance: 0.05,
    critDamage: 1.5,
    health: 100,
    maxHealth: 100,
    baseAttributes: { str: 0, dex: 0, int: 0 },
    allocatedAttributes: { str: 0, dex: 0, int: 0 },
    totalAttributes: { str: 0, dex: 0, int: 0 },
    unspentImprovementPoints: 0,
    unspentAscensionPoints: 0,
    skillRanks: {},
    equippedSkillIds: [],
    activeSkills,
    maxActiveSkills: 3,
    unlockedActiveSkillSlots: 3,
    ascensionId: null,
    hasUnspentPoints: false,
    equipment: { weapon: null, armor: null, accessory: null },
    combatIntent: null,
    combatSkills: [],
    combatSkillCooldowns: [],
    statusEffects: [],
    combatResists: { fire: 0, cold: 0, lightning: 0, air: 0 },
  };
}

describe('renderHeroFormationTooltipContent', () => {
  it('ignora slots vazios em activeSkills', () => {
    const html = renderHeroFormationTooltipContent(
      heroWithActiveSkills([
        {
          id: 'basic_attack',
          name: 'Ataque Básico',
          branch: 'offense',
          branchLabel: 'Ofensivo',
          description: 'Golpe físico',
          currentRank: 1,
          maxRank: 1,
          scope: 'universal',
          scopeLabel: 'Universal',
          scalingLabel: 'ATK',
          battleStats: [],
        },
        null,
        {
          id: 'power_attack',
          name: 'Golpe Poderoso',
          branch: 'offense',
          branchLabel: 'Ofensivo',
          description: 'Golpe forte',
          currentRank: 1,
          maxRank: 3,
          scope: 'class',
          scopeLabel: 'Classe',
          scalingLabel: 'STR',
          battleStats: [],
        },
      ]),
    );

    expect(html).toContain('Ataque Básico, Golpe Poderoso');
    expect(html).not.toContain('null');
  });
});
