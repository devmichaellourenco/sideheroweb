import { GameState } from '../entities/GameState';
import { CombatFloatingEvent } from './combat/CombatFloatingEvent';
import { CombatSkillVfxEvent } from './combat/CombatSkillVfxEvent';

export interface CombatTickResult {
  state: GameState;
  events: string[];
  floatingEvents: CombatFloatingEvent[];
  skillVfxEvents: CombatSkillVfxEvent[];
}

export interface ICombatService {
  executeTick(state: GameState): CombatTickResult;
}
