import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { IMetaProgressRepository } from '../../domain/repositories/IMetaProgressRepository';
import { MetaService } from '../../domain/meta/MetaService';
import { GameStatePresenter } from '../presenters/GameStatePresenter';
import { mapMetaSummary } from '../mappers/MetaMapper';
import { GameStateDto } from '../dto/GameStateDto';
import { GameState } from '../../domain/entities/GameState';

export class GetGameStateUseCase {
  constructor(
    private readonly repository: IGameStateRepository,
    private readonly metaRepository: IMetaProgressRepository,
    private readonly metaService: MetaService,
    private readonly presenter: GameStatePresenter,
  ) {}

  async execute(): Promise<GameStateDto> {
    const [state, meta] = await Promise.all([
      this.repository.load(),
      this.metaRepository.load(),
    ]);

    return this.present(state, meta);
  }

  present(state: GameState, meta = this.metaRepository.load()): Promise<GameStateDto> | GameStateDto {
    if (meta instanceof Promise) {
      return meta.then((resolved) => this.present(state, resolved));
    }

    return {
      ...this.presenter.present(state),
      meta: mapMetaSummary(meta, this.metaService),
    };
  }
}
