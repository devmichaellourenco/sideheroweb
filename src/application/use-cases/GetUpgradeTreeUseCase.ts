import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { UpgradeService } from '../../domain/upgrades/UpgradeService';
import { UpgradeNodeDto } from '../dto/UpgradeNodeDto';
import { mapUpgradeTree } from '../mappers/UpgradeTreeMapper';
import { GameStatePresenter } from '../presenters/GameStatePresenter';
import { GameStateDto } from '../dto/GameStateDto';

export interface GetUpgradeTreeResult {
  state: GameStateDto;
  nodes: UpgradeNodeDto[];
  purchasableCount: number;
}

export class GetUpgradeTreeUseCase {
  constructor(
    private readonly repository: IGameStateRepository,
    private readonly upgradeService: UpgradeService,
    private readonly presenter: GameStatePresenter,
  ) {}

  async execute(): Promise<GetUpgradeTreeResult> {
    const state = await this.repository.load();

    return {
      state: this.presenter.present(state),
      nodes: mapUpgradeTree(this.upgradeService.buildTree(state)),
      purchasableCount: this.upgradeService.countAvailable(state),
    };
  }
}
