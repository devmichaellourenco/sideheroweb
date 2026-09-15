import { GameMessage, GameResponse } from './GameClientTypes';

export interface IGameClient {
  isContextValid(): boolean;
  send(message: GameMessage): Promise<GameResponse>;
}
