import { describe, expect, it } from 'vitest';
import { HeroDto } from '../../../application/dto/GameStateDto';
import {
  formatHeroLevelClassLine,
  getHeroEvolutionLabel,
  HERO_BASE_TIER_LABEL,
} from './HeroClassLinePresentation';

function minimalHero(overrides: Partial<HeroDto> = {}): HeroDto {
  return {
    id: 'h1',
    heroClass: 'priest',
    level: 2,
    ascensionId: null,
    ...overrides,
  } as HeroDto;
}

describe('HeroClassLinePresentation', () => {
  it('formata Aprendiz quando herói ainda não ascendeu', () => {
    expect(formatHeroLevelClassLine(minimalHero())).toBe('Lv.2 Aprendiz');
    expect(getHeroEvolutionLabel(minimalHero())).toBe(HERO_BASE_TIER_LABEL);
  });

  it('formata só o título atual quando herói já ascendeu', () => {
    const hero = minimalHero({
      heroClass: 'knight',
      level: 8,
      ascensionId: 'knight_military_guerreiro',
    });

    expect(formatHeroLevelClassLine(hero)).toBe('Lv.8 Guerreiro');
    expect(getHeroEvolutionLabel(hero)).toBe('Guerreiro');
  });
});
