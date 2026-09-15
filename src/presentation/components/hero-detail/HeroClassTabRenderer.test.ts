import { describe, expect, it } from 'vitest';
import { AscensionOptionDto } from '../../../application/dto/AscensionOptionDto';
import { HeroDto } from '../../../application/dto/GameStateDto';
import { renderHeroClassTab } from './HeroClassTabRenderer';

function minimalHero(overrides: Partial<HeroDto> = {}): HeroDto {
  return {
    id: 'h1',
    name: 'Elara',
    heroClass: 'priest',
    level: 2,
    ascensionId: null,
    unspentAscensionPoints: 0,
    activeSkills: [null, null, null],
    maxActiveSkills: 3,
    ...overrides,
  } as HeroDto;
}

function ascensionOption(overrides: Partial<AscensionOptionDto> = {}): AscensionOptionDto {
  return {
    id: 'priest_sacred_cleriga',
    name: 'Clériga Sagrada',
    description: 'Caminho da luz.',
    pathLabel: 'Caminho Sagrado',
    pointsGranted: 2,
    canAscend: false,
    requirements: [{ label: 'Lv.5', met: false }],
    ...overrides,
  };
}

describe('renderHeroClassTab', () => {
  it('não repete classe atual nem retrato do herói', () => {
    const html = renderHeroClassTab({
      hero: minimalHero(),
      options: [ascensionOption()],
      ascensionName: null,
    });

    expect(html).toContain('ascension-moment-header');
    expect(html).toContain('Escolha seu destino');
    expect(html).toContain('data-ascension-moment-tooltip');
    expect(html).toContain('ascension-path-card');
    expect(html).toContain('Clériga Sagrada');
    expect(html).not.toContain('hero-class-status');
    expect(html).not.toContain('hero-class-portrait');
    expect(html).not.toContain('Classe base');
    expect(html).not.toContain('hero-class-sprite');
    expect(html).not.toContain('Escolha um caminho permanente');
  });

  it('mostra próxima evolução quando herói já ascendeu', () => {
    const html = renderHeroClassTab({
      hero: minimalHero({
        ascensionId: 'priest_sacred_cleriga',
        level: 12,
      }),
      options: [
        ascensionOption({
          id: 'priest_sacred_alta_sacerdotisa',
          name: 'Alta Sacerdotisa',
          canAscend: true,
        }),
      ],
      ascensionName: 'Clériga Sagrada',
    });

    expect(html).toContain('ascension-moment-header--upgrade');
    expect(html).toContain('Próxima Classe');
    expect(html).toContain('Alta Sacerdotisa');
    expect(html).toContain('data-ascension-select=');
    expect(html).not.toContain('Evoluir agora');
    expect(html).not.toContain('Evolução:');
    expect(html).not.toContain('hero-class-portrait');
    expect(html).not.toContain('Skills de evolução');
    expect(html).not.toContain('data-ascension-allocate');
  });
});
