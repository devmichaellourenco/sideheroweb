import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { ChestService } from '../../domain/services/ChestService';
import { GameStatePresenter } from '../presenters/GameStatePresenter';
import { GameStateDto, GearDto } from '../dto/GameStateDto';

export interface OpenAllChestsResult {
  state: GameStateDto;
  openedGears: GearDto[];
}

export class OpenAllChestsUseCase {
  constructor(
    private readonly repository: IGameStateRepository,
    private readonly chestService: ChestService,
    private readonly presenter: GameStatePresenter,
  ) {}

  async execute(): Promise<OpenAllChestsResult> {
    const state = await this.repository.load();
    const { state: nextState, loots } = this.chestService.openAll(state);

    await this.repository.save(nextState);

    const dto = this.presenter.present(nextState);
    const lootIds = new Set(loots.map((loot) => loot.id));
    const openedGears = [...dto.inventory, ...dto.stash].filter((gear) => lootIds.has(gear.id));

    return { state: dto, openedGears };
  }
}
