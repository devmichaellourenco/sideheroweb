import { PhaseCombatHandlers } from '../../domain/campaign/PhaseCombatHandlers';
import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { GameStatePresenter } from '../presenters/GameStatePresenter';
import { CombatFloatingEventDto } from '../dto/CombatFloatingEventDto';
import { CombatSkillVfxDto } from '../dto/CombatSkillVfxDto';
import { GameStateDto } from '../dto/GameStateDto';

export interface ResumeCombatIntermissionResult {
  state: GameStateDto;
  combatFloats: CombatFloatingEventDto[];
  combatSkillVfx: CombatSkillVfxDto[];
}

export class ResumeCombatIntermissionUseCase {
  private readonly phaseHandlers = new PhaseCombatHandlers();

  constructor(
    private readonly repository: IGameStateRepository,
    private readonly presenter: GameStatePresenter,
  ) {}

  async execute(): Promise<ResumeCombatIntermissionResult> {
    const state = await this.repository.load();

    if (!state.combatIntermission) {
      return {
        state: this.presenter.present(state),
        combatFloats: [],
        combatSkillVfx: [],
      };
    }

    const resumed = this.phaseHandlers.resumeIntermission(state);
    await this.repository.save(resumed.state);

    return {
      state: this.presenter.present(resumed.state),
      combatFloats: [],
      combatSkillVfx: [],
    };
  }
}
