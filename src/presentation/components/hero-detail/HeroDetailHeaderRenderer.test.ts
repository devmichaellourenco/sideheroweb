import { describe, expect, it } from 'vitest';
import { HeroDto } from '../../../application/dto/GameStateDto';
import { renderHeroDetailHeader } from './HeroDetailHeaderRenderer';

function minimalHero(overrides: Partial<HeroDto> = {}): HeroDto {
  return {
    id: 'h1',
    name: 'Elara',
    heroClass: 'priest',
    level: 2,
    attack: 10,
    defense: 6,
    health: 70,
    maxHealth: 80,
    ascensionId: null,
    experience: 0,
    experienceToNextLevel: 100,
    unspentImprovementPoints: 0,
    ...overrides,
  } as HeroDto;
}

describe('renderHeroDetailHeader', () => {
  it('mostra level destacado e só o título atual no topo do modal', () => {
    const html = renderHeroDetailHeader(minimalHero());

    expect(html).toMatch(/<span class="hero-level">Lv\.2<\/span>/);
    expect(html).toContain('hero-level-class-line');
    expect(html).toContain('Aprendiz');
    expect(html).not.toContain('Priest -');
  });

  it('mostra só o título atual quando herói já ascendeu', () => {
    const html = renderHeroDetailHeader(
      minimalHero({
        heroClass: 'knight',
        level: 8,
        ascensionId: 'knight_military_guerreiro',
      }),
    );

    expect(html).toMatch(/<span class="hero-level">Lv\.8<\/span>/);
    expect(html).toContain('Guerreiro');
    expect(html).not.toContain('Knight -');
  });

  it('omite barra de vida, mantém barra de XP e exibe chip de Aprimoramento na linha de stats', () => {
    const html = renderHeroDetailHeader(minimalHero({ unspentImprovementPoints: 3 }));

    expect(html).not.toContain('health-bar');
    expect(html).toContain('xp-bar');
    expect(html).toContain('data-bar-icon=');
    expect(html).toContain('ui/xp.png');
    expect(html).toContain('hero-improvement-stat');
    expect(html).toContain('aria-label="Aprimoramento: 3"');
    expect(html).toContain('data-hero-improvement-tooltip');
  });

  it('adiciona tooltips nos ícones de ataque, defesa e vida', () => {
    const html = renderHeroDetailHeader(minimalHero());

    expect(html).toContain('title="Ataque"');
    expect(html).toContain('title="Defesa"');
    expect(html).toContain('title="Vida"');
  });

  it('exibe apenas a vida total na linha de stats', () => {
    const html = renderHeroDetailHeader(minimalHero({ health: 70, maxHealth: 80 }));

    expect(html).toContain('title="Vida"');
    expect(html).toContain('> 80</span>');
    expect(html).not.toContain('70/80');
  });
});
