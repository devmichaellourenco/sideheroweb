import { GameState } from '../entities/GameState';
import { MAX_PARTY_SIZE, MIN_PARTY_SIZE } from './PartyConstants';
import { PartyEditPolicy } from './PartyEditPolicy';
import { PartyValidator } from './PartyValidator';

export class PartyService {
  addToActiveParty(state: GameState, heroId: string): GameState {
    PartyEditPolicy.assertEditable(state);

    if (!state.roster.some((hero) => hero.id === heroId)) {
      throw new Error('Herói não encontrado no roster');
    }

    if (state.activePartyIds.includes(heroId)) {
      return state;
    }

    if (state.activePartyIds.length >= MAX_PARTY_SIZE) {
      throw new Error('Party ativa cheia (máx. 3 heróis)');
    }

    const nextIds = [...state.activePartyIds, heroId];
    PartyValidator.assertValid(state.roster, nextIds);
    return state.withActivePartyIds(nextIds);
  }

  removeFromActiveParty(state: GameState, heroId: string): GameState {
    PartyEditPolicy.assertEditable(state);

    if (!state.activePartyIds.includes(heroId)) {
      throw new Error('Herói não está na party ativa');
    }

    if (state.activePartyIds.length <= MIN_PARTY_SIZE) {
      throw new Error(`Party precisa de pelo menos ${MIN_PARTY_SIZE} herói`);
    }

    const nextIds = state.activePartyIds.filter((id) => id !== heroId);
    PartyValidator.assertValid(state.roster, nextIds);
    return state.withActivePartyIds(nextIds);
  }

  moveActivePartyMember(state: GameState, fromIndex: number, toIndex: number): GameState {
    PartyEditPolicy.assertEditable(state);

    const ids = [...state.activePartyIds];
    if (fromIndex < 0 || fromIndex >= ids.length || toIndex < 0 || toIndex >= ids.length) {
      throw new Error('Índice de party inválido');
    }

    const [moved] = ids.splice(fromIndex, 1);
    ids.splice(toIndex, 0, moved);
    PartyValidator.assertValid(state.roster, ids);
    return state.withActivePartyIds(ids);
  }

  setActivePartySlot(state: GameState, slotIndex: number, heroId: string): GameState {
    PartyEditPolicy.assertEditable(state);

    if (slotIndex < 0 || slotIndex >= MAX_PARTY_SIZE) {
      throw new Error('Slot de party inválido');
    }

    if (!state.roster.some((hero) => hero.id === heroId)) {
      throw new Error('Herói não encontrado no roster');
    }

    const ids = [...state.activePartyIds];
    const existingIndex = ids.indexOf(heroId);

    if (existingIndex >= 0 && existingIndex !== slotIndex) {
      ids[existingIndex] = ids[slotIndex] ?? ids[existingIndex];
    }

    if (slotIndex >= ids.length) {
      if (ids.length >= MAX_PARTY_SIZE) {
        throw new Error('Party ativa cheia (máx. 3 heróis)');
      }
      ids.push(heroId);
    } else {
      ids[slotIndex] = heroId;
    }

    const normalized = PartyValidator.normalizeActivePartyIds(state.roster, ids);
    PartyValidator.assertValid(state.roster, normalized);
    return state.withActivePartyIds(normalized);
  }
}
