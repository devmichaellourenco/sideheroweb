import { GameState } from '../entities/GameState';

export interface IGameStateRepository {
  load(): Promise<GameState>;
  save(state: GameState): Promise<void>;
}
