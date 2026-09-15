import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { PartyService } from '../../domain/party/PartyService';
import { GameStatePresenter } from '../presenters/GameStatePresenter';
import { GameStateDto } from '../dto/GameStateDto';

export class MovePartyMemberUseCase {
  constructor(
    private readonly repository: IGameStateRepository,
    private readonly partyService: PartyService,
    private readonly presenter: GameStatePresenter,
  ) {}

  async execute(fromIndex: number, toIndex: number): Promise<GameStateDto> {
    const state = await this.repository.load();
    const nextState = this.partyService.moveActivePartyMember(state, fromIndex, toIndex);
    await this.repository.save(nextState);
    return this.presenter.present(nextState);
  }
}
