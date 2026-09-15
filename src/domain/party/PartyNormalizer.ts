import { Hero } from '../entities/Hero';
import { PartyValidator } from './PartyValidator';

export interface NormalizedPartyState {
  roster: Hero[];
  activePartyIds: string[];
}

export function normalizePartyFromProps(
  heroes: Hero[],
  roster?: Hero[] | null,
  activePartyIds?: string[] | null,
): NormalizedPartyState {
  const resolvedRoster =
    heroes.length > 0
      ? heroes
      : roster && roster.length > 0
        ? roster
        : [];
  const fallbackIds = resolvedRoster.map((hero) => hero.id);
  const candidateIds =
    activePartyIds && activePartyIds.length > 0 ? activePartyIds : fallbackIds;

  return {
    roster: resolvedRoster,
    activePartyIds: PartyValidator.normalizeActivePartyIds(resolvedRoster, candidateIds),
  };
}
