export type {
  GameMessage,
  GameResponse,
  SpendTargetMessage,
} from '../../application/ports/GameClientTypes';

import { GameMessage, GameResponse } from '../../application/ports/GameClientTypes';
import { getDefaultGameClient } from './defaultGameClient';

/** @deprecated Use IGameClient via getDefaultGameClient() */
export async function sendGameMessage(message: GameMessage): Promise<GameResponse> {
  return getDefaultGameClient().send(message);
}
