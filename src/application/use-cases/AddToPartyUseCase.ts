import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { PartyService } from '../../domain/party/PartyService';
import { GameStatePresenter } from '../presenters/GameStatePresenter';
import { GameStateDto } from '../dto/GameStateDto';

export class AddToPartyUseCase {
  constructor(
    private readonly repository: IGameStateRepository,
    private readonly partyService: PartyService,
    private readonly presenter: GameStatePresenter,
  ) {}

  async execute(heroId: string): Promise<GameStateDto> {
    const state = await this.repository.load();
    const nextState = this.partyService.addToActiveParty(state, heroId).addLog('Herói adicionado à party');
    await this.repository.save(nextState);
    return this.presenter.present(nextState);
  }
}
