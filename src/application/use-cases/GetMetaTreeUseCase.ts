import { MetaService } from '../../domain/meta/MetaService';
import { IMetaProgressRepository } from '../../domain/repositories/IMetaProgressRepository';
import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { GameStatePresenter } from '../presenters/GameStatePresenter';
import { mapMetaSummary, mapMetaTree } from '../mappers/MetaMapper';
import { MetaNodeDto } from '../dto/MetaDto';
import { GameStateDto } from '../dto/GameStateDto';

export interface GetMetaTreeResult {
  state: GameStateDto;
  nodes: MetaNodeDto[];
  purchasableMetaCount: number;
}

export class GetMetaTreeUseCase {
  constructor(
    private readonly gameRepository: IGameStateRepository,
    private readonly metaRepository: IMetaProgressRepository,
    private readonly metaService: MetaService,
    private readonly presenter: GameStatePresenter,
  ) {}

  async execute(): Promise<GetMetaTreeResult> {
    const [state, meta] = await Promise.all([
      this.gameRepository.load(),
      this.metaRepository.load(),
    ]);

    const nodes = mapMetaTree(this.metaService.buildTree(meta));

    return {
      state: {
        ...this.presenter.present(state),
        meta: mapMetaSummary(meta, this.metaService),
      },
      nodes,
      purchasableMetaCount: this.metaService.countAvailable(meta),
    };
  }
}
