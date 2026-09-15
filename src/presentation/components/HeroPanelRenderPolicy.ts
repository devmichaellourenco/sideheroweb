import { GameStateDto } from '../../application/dto/GameStateDto';

const GEAR_SLOTS = ['weapon', 'armor', 'accessory'] as const;

function partyCompositionKey(state: GameStateDto): string {
  const heroIds = state.heroes
    .map((hero) => hero.id)
    .sort()
    .join(',');
  return `${state.activePartyIds.join(',')}|${heroIds}`;
}

function heroLoadoutKey(hero: GameStateDto['heroes'][number]): string {
  const gearIds = GEAR_SLOTS.map((slot) => hero.equipment[slot]?.id ?? '-').join(',');
  return [
    hero.id,
    hero.level,
    hero.attack,
    hero.defense,
    hero.health,
    hero.maxHealth,
    hero.hasUnspentPoints ? '1' : '0',
    gearIds,
  ].join(':');
}

function loadoutDisplayKey(state: GameStateDto): string {
  const heroes = state.heroes
    .map((hero) => heroLoadoutKey(hero))
    .sort()
    .join('|');
  return `${partyCompositionKey(state)}|${heroes}`;
}

export function shouldRenderHeroPanel(
  previous: GameStateDto | null,
  next: GameStateDto,
): boolean {
  if (!previous) return true;

  if (previous.canEditParty !== next.canEditParty) {
    return true;
  }

  if (next.canEditParty) {
    return loadoutDisplayKey(previous) !== loadoutDisplayKey(next);
  }

  return partyCompositionKey(previous) !== partyCompositionKey(next);
}
