import { describe, expect, it } from 'vitest';
import { HeroDto } from '../../application/dto/GameStateDto';
import { renderFormationPanel } from './FormationPanelPresentation';
import { renderHeroesPanel } from './HeroesPanelPresentation';

function hero(id: string, name: string): HeroDto {
  return {
    id,
    name,
    heroClass: 'knight',
    level: 1,
    health: 100,
    maxHealth: 100,
    attack: 10,
    defense: 5,
    attackSpeed: 1,
    castSpeed: 1,
    critChance: 0,
    critDamage: 1.5,
    experience: 0,
    experienceToNextLevel: 100,
    hasUnspentPoints: false,
    equipment: { weapon: null, armor: null, accessory: null },
    activeSkills: [],
    totalAttributes: { str: 1, dex: 1, int: 1 },
    baseAttributes: { str: 1, dex: 1, int: 1 },
    combatResists: { fire: 0, cold: 0, lightning: 0, air: 0 },
  } as HeroDto;
}

describe('HeroesPanelPresentation', () => {
  it('mostra lista de heróis e botão de formação', () => {
    const html = renderHeroesPanel({
      activeParty: [hero('h1', 'Aria'), hero('h2', 'Brock')],
      activePartyIds: ['h1', 'h2'],
      benchHeroes: [hero('h3', 'Cira')],
      heroes: [hero('h1', 'Aria'), hero('h2', 'Brock'), hero('h3', 'Cira')],
      canEditParty: true,
    } as Parameters<typeof renderHeroesPanel>[0]);

    expect(html).toContain('data-hero-open="h1"');
    expect(html).toContain('data-hero-open="h3"');
    expect(html).not.toContain('data-open-formation');
    expect(html).not.toContain('Batalhando');
    expect(html).not.toContain('data-heroes-tab');
  });
});

describe('FormationPanelPresentation', () => {
  it('expõe alvos de drop na formação quando edição está liberada', () => {
    const html = renderFormationPanel({
      activeParty: [hero('h1', 'Aria'), hero('h2', 'Brock')],
      benchHeroes: [hero('h3', 'Cira')],
      canEditParty: true,
    });

    expect(html).toContain('data-drop-party-slot="0"');
    expect(html).toContain('data-drop-party-bench');
    expect(html).toContain('data-drag-party-hero="h3"');
    expect(html).not.toContain('Formação bloqueada');
  });

  it('remove drag-and-drop quando a formação está bloqueada', () => {
    const html = renderFormationPanel({
      activeParty: [hero('h1', 'Aria')],
      benchHeroes: [hero('h2', 'Brock')],
      canEditParty: false,
    });

    expect(html).not.toContain('data-drag-party-hero');
    expect(html).not.toContain('data-drop-party-slot');
    expect(html).toContain('Formação bloqueada durante a missão');
  });
});
