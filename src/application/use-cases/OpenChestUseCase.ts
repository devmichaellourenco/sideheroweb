import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { ChestService } from '../../domain/services/ChestService';
import { GameStatePresenter } from '../presenters/GameStatePresenter';
import { GameStateDto, GearDto } from '../dto/GameStateDto';

export interface OpenChestResult {
  state: GameStateDto;
  openedGear: GearDto;
}

export class OpenChestUseCase {
  constructor(
    private readonly repository: IGameStateRepository,
    private readonly chestService: ChestService,
    private readonly presenter: GameStatePresenter,
  ) {}

  async execute(chestId: string): Promise<OpenChestResult> {
    const state = await this.repository.load();
    const { state: nextState, loot } = this.chestService.openOne(state, chestId);

    await this.repository.save(nextState);

    const dto = this.presenter.present(nextState);
    const openedGear = dto.inventory.find((gear) => gear.id === loot.id)!;

    return { state: dto, openedGear };
  }
}
