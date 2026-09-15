import { MetaService } from '../../domain/meta/MetaService';
import { IMetaProgressRepository } from '../../domain/repositories/IMetaProgressRepository';
import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { GameStatePresenter } from '../presenters/GameStatePresenter';
import { mapMetaSummary, mapMetaTree } from '../mappers/MetaMapper';
import { MetaNodeDto } from '../dto/MetaDto';
import { GameStateDto } from '../dto/GameStateDto';

export interface PurchaseMetaUpgradeResult {
  state: GameStateDto;
  nodes: MetaNodeDto[];
  purchasableMetaCount: number;
  purchasedMetaUpgradeId: string;
}

export class PurchaseMetaUpgradeUseCase {
  constructor(
    private readonly gameRepository: IGameStateRepository,
    private readonly metaRepository: IMetaProgressRepository,
    private readonly metaService: MetaService,
    private readonly presenter: GameStatePresenter,
  ) {}

  async execute(upgradeId: string): Promise<PurchaseMetaUpgradeResult> {
    const [state, meta] = await Promise.all([
      this.gameRepository.load(),
      this.metaRepository.load(),
    ]);

    const nextMeta = this.metaService.purchase(meta, upgradeId);
    await this.metaRepository.save(nextMeta);

    const nodes = mapMetaTree(this.metaService.buildTree(nextMeta));

    return {
      state: {
        ...this.presenter.present(state),
        meta: mapMetaSummary(nextMeta, this.metaService),
      },
      nodes,
      purchasableMetaCount: this.metaService.countAvailable(nextMeta),
      purchasedMetaUpgradeId: upgradeId,
    };
  }
}
