import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { UpgradeService } from '../../domain/upgrades/UpgradeService';
import { UpgradeNodeDto } from '../dto/UpgradeNodeDto';
import { mapUpgradeTree } from '../mappers/UpgradeTreeMapper';
import { GameStatePresenter } from '../presenters/GameStatePresenter';
import { GameStateDto } from '../dto/GameStateDto';

export interface PurchaseUpgradeResult {
  state: GameStateDto;
  nodes: UpgradeNodeDto[];
  purchasableCount: number;
  purchasedUpgradeId: string;
}

export class PurchaseUpgradeUseCase {
  constructor(
    private readonly repository: IGameStateRepository,
    private readonly upgradeService: UpgradeService,
    private readonly presenter: GameStatePresenter,
  ) {}

  async execute(upgradeId: string): Promise<PurchaseUpgradeResult> {
    const state = await this.repository.load();
    const nextState = this.upgradeService.purchase(state, upgradeId);

    await this.repository.save(nextState);

    return {
      state: this.presenter.present(nextState),
      nodes: mapUpgradeTree(this.upgradeService.buildTree(nextState)),
      purchasableCount: this.upgradeService.countAvailable(nextState),
      purchasedUpgradeId: upgradeId,
    };
  }
}
