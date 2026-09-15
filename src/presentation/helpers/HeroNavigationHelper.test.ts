import { describe, expect, it } from 'vitest';
import { GameStateDto } from '../../application/dto/GameStateDto';
import { getHeroNavigation, listNavigableHeroIds } from './HeroNavigationHelper';

function state(overrides: Partial<GameStateDto> = {}): GameStateDto {
  return {
    activeParty: [{ id: 'h1' } as GameStateDto['activeParty'][0], { id: 'h2' } as GameStateDto['activeParty'][0]],
    benchHeroes: [{ id: 'h3' } as GameStateDto['benchHeroes'][0]],
    ...overrides,
  } as GameStateDto;
}

describe('HeroNavigationHelper', () => {
  it('lista party ativa antes da reserva', () => {
    expect(listNavigableHeroIds(state())).toEqual(['h1', 'h2', 'h3']);
  });

  it('calcula anterior e próximo herói', () => {
    const nav = getHeroNavigation(state(), 'h2');
    expect(nav.prevId).toBe('h1');
    expect(nav.nextId).toBe('h3');
  });
});
