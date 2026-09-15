import { GameStateDto } from '../../application/dto/GameStateDto';

export interface HeroNavigationContext {
  heroIds: string[];
  index: number;
  prevId: string | null;
  nextId: string | null;
}

export function listNavigableHeroIds(state: GameStateDto): string[] {
  return [
    ...state.activeParty.map((hero) => hero.id),
    ...state.benchHeroes.map((hero) => hero.id),
  ];
}

export function getHeroNavigation(state: GameStateDto, heroId: string): HeroNavigationContext {
  const heroIds = listNavigableHeroIds(state);
  const index = heroIds.indexOf(heroId);

  if (index < 0) {
    return { heroIds, index: -1, prevId: null, nextId: null };
  }

  return {
    heroIds,
    index,
    prevId: index > 0 ? heroIds[index - 1] : null,
    nextId: index < heroIds.length - 1 ? heroIds[index + 1] : null,
  };
}
