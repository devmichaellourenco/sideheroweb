import { assertLoadoutEditable } from '../policies/assertLoadoutEditable';
import { FeatureAccessPolicy } from '../../domain/policies/FeatureAccessPolicy';
import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { LoadoutOptimizer } from '../../domain/services/LoadoutOptimizer';
import { GameStatePresenter } from '../presenters/GameStatePresenter';
import { GameStateDto } from '../dto/GameStateDto';

export interface EquipBestLoadoutResult {
  state: GameStateDto;
  equippedCount: number;
}

export class EquipBestLoadoutUseCase {
  constructor(
    private readonly repository: IGameStateRepository,
    private readonly loadoutOptimizer: LoadoutOptimizer,
    private readonly presenter: GameStatePresenter,
  ) {}

  async execute(gearIds?: string[]): Promise<EquipBestLoadoutResult> {
    const state = await this.repository.load();
    assertLoadoutEditable(state);

    if (!FeatureAccessPolicy.resolve(state.upgradeLevels).optimizeLoadout) {
      throw new Error('Otimizar equipe não desbloqueado');
    }

    const { state: nextState, equippedCount } = this.loadoutOptimizer.optimizeLoadout(
      state,
      gearIds,
    );

    await this.repository.save(nextState);

    return {
      state: this.presenter.present(nextState),
      equippedCount,
    };
  }
}
