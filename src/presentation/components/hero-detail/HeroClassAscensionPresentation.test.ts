import { describe, expect, it } from 'vitest';
import { AscensionOptionDto } from '../../../application/dto/AscensionOptionDto';
import { HeroDto } from '../../../application/dto/GameStateDto';
import {
  renderAscensionMomentBanner,
  renderAscensionPathCard,
  resolveAscensionPathTheme,
} from './HeroClassAscensionPresentation';

function minimalHero(overrides: Partial<HeroDto> = {}): HeroDto {
  return {
    id: 'h1',
    name: 'Elara',
    heroClass: 'priest',
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

describe('HeroClassAscensionPresentation', () => {
  it('resolve tema visual por caminho', () => {
    expect(resolveAscensionPathTheme('knight_military_guerreiro', 'Caminho Militar')).toBe('military');
    expect(resolveAscensionPathTheme('priest_sacred_cleriga', 'Caminho Sagrado')).toBe('sacred');
    expect(resolveAscensionPathTheme('sorcerer_innate_adept', 'Caminho Inato')).toBe('innate');
  });

  it('renderiza título compacto com detalhes no tooltip', () => {
    const html = renderAscensionMomentBanner(false, 'Galneon');

    expect(html).toContain('ascension-moment-header--fork');
    expect(html).toContain('Escolha seu destino');
    expect(html).toContain('data-ascension-moment-tooltip');
    expect(html).toContain('ascension-moment-tooltip-content');
    expect(html).toContain('Momento decisivo');
    expect(html).toContain('Pontos de aprimoramento');
    expect(html).not.toContain('ascension-moment__highlights');
    expect(html).not.toContain('ascension-moment__lead');
  });

  it('renderiza card compacto com detalhes no tooltip e seleção por clique', () => {
    const html = renderAscensionPathCard(minimalHero(), ascensionOption({ canAscend: true }), false);

    expect(html).toContain('ascension-path-card--sacred');
    expect(html).toContain('ascension-path-card--ready');
    expect(html).toContain('ascension-path-card--selectable');
    expect(html).toContain('data-ascension-path-tooltip');
    expect(html).toContain('ascension-path-tooltip-content');
    expect(html).toContain('ascension-req--unmet');
    expect(html).toContain('Seguir este caminho');
    expect(html).toContain('+2 Aprim.');
    expect(html).toContain('data-ascension-select="priest_sacred_cleriga"');
    expect(html).not.toContain('ascension-path-card__footer');
    expect(html).not.toContain('ascension-path-card__cta');
    expect(html).not.toContain('ascension-path-card__status');
    expect(html).not.toContain('ascension-path-card__reqs');
  });

  it('mantém requisitos bloqueados apenas no tooltip', () => {
    const html = renderAscensionPathCard(minimalHero(), ascensionOption(), false);

    expect(html).toContain('Complete os requisitos para desbloquear');
    expect(html).not.toContain('data-ascension-select=');
    expect(html).not.toContain('ascension-path-card--selectable');
  });
});
