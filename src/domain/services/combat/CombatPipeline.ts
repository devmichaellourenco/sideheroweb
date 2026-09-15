import { GameState } from '../../entities/GameState';
import { CombatTickResult, ICombatService } from '../ICombatService';
import { CombatTurnPhase } from './CombatTurnPhase';

export class CombatPipeline implements ICombatService {
  constructor(private readonly turnPhase = new CombatTurnPhase()) {}

  executeTick(state: GameState): CombatTickResult {
    const result = this.turnPhase.execute(state);
    return {
      state: result.state,
      events: result.events,
      floatingEvents: result.floatingEvents,
      skillVfxEvents: result.skillVfxEvents,
    };
  }
}
