import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { DivineForgeService } from '../../domain/services/DivineForgeService';
import { GameStateDto } from '../dto/GameStateDto';
import { GameStatePresenter } from '../presenters/GameStatePresenter';

export interface SalvageGearInForgeResult {
  state: GameStateDto;
  salvageGold: number;
}

export class SalvageGearInForgeUseCase {
  constructor(
    private readonly repository: IGameStateRepository,
    private readonly presenter: GameStatePresenter,
    private readonly divineForgeService: DivineForgeService,
  ) {}

  async execute(gearId: string): Promise<SalvageGearInForgeResult> {
    const state = await this.repository.load();
    const result = this.divineForgeService.salvage(state, gearId);
    await this.repository.save(result.state);
    return {
      state: this.presenter.present(result.state),
      salvageGold: result.goldGained,
    };
  }
}
