import { CombatPipeline } from './combat/CombatPipeline';
import { CombatTickResult, ICombatService } from './ICombatService';

/** Facade que delega ao pipeline de combate. */
export class CombatService implements ICombatService {
  private readonly pipeline = new CombatPipeline();

  executeTick(state: Parameters<CombatPipeline['executeTick']>[0]): CombatTickResult {
    return this.pipeline.executeTick(state);
  }
}
