import { IGameClient } from '../../application/ports/IGameClient';
import { GameMessage, GameResponse } from '../../application/ports/GameClientTypes';
import { GameApplication } from '../../application/GameApplication';
import { SerialTaskRunner } from '../background/SerialTaskRunner';
import { handleGameMessage } from './handleGameMessage';

export class InProcessGameClient implements IGameClient {
  constructor(
    private readonly app: GameApplication,
    private readonly runner: SerialTaskRunner = new SerialTaskRunner(),
  ) {}

  isContextValid(): boolean {
    return true;
  }

  async send(message: GameMessage): Promise<GameResponse> {
    try {
      return await this.runner.run(() => handleGameMessage(this.app, message));
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      };
    }
  }
}
