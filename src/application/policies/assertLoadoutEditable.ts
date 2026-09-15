import { GameState } from '../../domain/entities/GameState';
import { PartyEditPolicy } from '../../domain/party/PartyEditPolicy';

export function assertLoadoutEditable(state: GameState): void {
  PartyEditPolicy.assertEditable(state);
}
