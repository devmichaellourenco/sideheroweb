import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import {
  GearStorageLocation,
  GearStorageService,
} from '../../domain/services/GearStorageService';
import { GameStatePresenter } from '../presenters/GameStatePresenter';
import { GameStateDto } from '../dto/GameStateDto';

export class DestroyGearUseCase {
  constructor(
    private readonly repository: IGameStateRepository,
    private readonly presenter: GameStatePresenter,
    private readonly gearStorageService: GearStorageService = new GearStorageService(),
  ) {}

  async execute(gearId: string, location: GearStorageLocation): Promise<GameStateDto> {
    const state = await this.repository.load();
    const nextState = this.gearStorageService.destroy(state, gearId, location);
    await this.repository.save(nextState);
    return this.presenter.present(nextState);
  }
}
