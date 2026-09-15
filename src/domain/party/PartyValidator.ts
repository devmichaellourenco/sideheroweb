import { Hero } from '../entities/Hero';
import { MAX_PARTY_SIZE, MIN_PARTY_SIZE } from './PartyConstants';

export class PartyValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PartyValidationError';
  }
}

export class PartyValidator {
  static normalizeActivePartyIds(roster: readonly Hero[], activePartyIds: readonly string[]): string[] {
    const rosterIds = new Set(roster.map((hero) => hero.id));
    const unique: string[] = [];

    for (const id of activePartyIds) {
      if (rosterIds.has(id) && !unique.includes(id)) {
        unique.push(id);
      }
      if (unique.length >= MAX_PARTY_SIZE) {
        break;
      }
    }

    if (unique.length < MIN_PARTY_SIZE) {
      for (const hero of roster) {
        if (!unique.includes(hero.id)) {
          unique.push(hero.id);
        }
        if (unique.length >= MIN_PARTY_SIZE) {
          break;
        }
      }
    }

    return unique.slice(0, MAX_PARTY_SIZE);
  }

  static assertValid(roster: readonly Hero[], activePartyIds: readonly string[]): void {
    if (roster.length === 0) {
      throw new PartyValidationError('Roster não pode estar vazio');
    }

    if (activePartyIds.length < MIN_PARTY_SIZE || activePartyIds.length > MAX_PARTY_SIZE) {
      throw new PartyValidationError(
        `Party deve ter entre ${MIN_PARTY_SIZE} e ${MAX_PARTY_SIZE} heróis`,
      );
    }

    const seen = new Set<string>();
    for (const id of activePartyIds) {
      if (!roster.some((hero) => hero.id === id)) {
        throw new PartyValidationError(`Herói ${id} não está no roster`);
      }
      if (seen.has(id)) {
        throw new PartyValidationError('Party não pode ter heróis duplicados');
      }
      seen.add(id);
    }
  }
}
