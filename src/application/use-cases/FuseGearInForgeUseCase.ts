import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { DivineForgeService } from '../../domain/services/DivineForgeService';
import { GameStateDto, GearDto } from '../dto/GameStateDto';
import { mapGearToDto } from '../mappers/GearDtoMapper';
import { GameStatePresenter } from '../presenters/GameStatePresenter';

export interface FuseGearInForgeResult {
  state: GameStateDto;
  forgedGear: GearDto;
}

export class FuseGearInForgeUseCase {
  constructor(
    private readonly repository: IGameStateRepository,
    private readonly presenter: GameStatePresenter,
    private readonly divineForgeService: DivineForgeService,
  ) {}

  async execute(gearIds: string[]): Promise<FuseGearInForgeResult> {
    const state = await this.repository.load();
    const result = this.divineForgeService.fuse(state, gearIds);
    await this.repository.save(result.state);
    return {
      state: this.presenter.present(result.state),
      forgedGear: mapGearToDto(result.created),
    };
  }
}
