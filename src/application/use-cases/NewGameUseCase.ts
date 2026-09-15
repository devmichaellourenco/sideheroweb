import { GameState } from '../../domain/entities/GameState';
import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { IMetaProgressRepository } from '../../domain/repositories/IMetaProgressRepository';
import { MetaService } from '../../domain/meta/MetaService';
import { META_LEGACY_ENABLED } from '../ProductGates';
import { GameStatePresenter } from '../presenters/GameStatePresenter';
import { mapMetaSummary } from '../mappers/MetaMapper';
import { GameStateDto } from '../dto/GameStateDto';

export class NewGameUseCase {
  constructor(
    private readonly repository: IGameStateRepository,
    private readonly metaRepository: IMetaProgressRepository,
    private readonly metaService: MetaService,
    private readonly presenter: GameStatePresenter,
  ) {}

  async execute(): Promise<GameStateDto> {
    const meta = await this.metaRepository.load();

    let initial = GameState.initial();
    if (META_LEGACY_ENABLED) {
      const bonuses = this.metaService.resolveBonuses(meta);
      if (bonuses.startGoldBonus > 0) {
        initial = initial.withGold(initial.gold.add(bonuses.startGoldBonus));
        initial = initial.addLog(`Legado: +${bonuses.startGoldBonus} ouro inicial`);
      }
    }

    await this.repository.save(initial);

    return {
      ...this.presenter.present(initial),
      meta: mapMetaSummary(meta, this.metaService),
    };
  }
}
