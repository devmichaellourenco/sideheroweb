import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { PartyService } from '../../domain/party/PartyService';
import { GameStatePresenter } from '../presenters/GameStatePresenter';
import { GameStateDto } from '../dto/GameStateDto';

export class SetPartySlotUseCase {
  constructor(
    private readonly repository: IGameStateRepository,
    private readonly partyService: PartyService,
    private readonly presenter: GameStatePresenter,
  ) {}

  async execute(slotIndex: number, heroId: string): Promise<GameStateDto> {
    const state = await this.repository.load();
    const nextState = this.partyService
      .setActivePartySlot(state, slotIndex, heroId)
      .addLog('Formação atualizada');
    await this.repository.save(nextState);
    return this.presenter.present(nextState);
  }
}
