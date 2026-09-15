import { IGameClient } from '../../application/ports/IGameClient';
import { GameStateDto } from '../../application/dto/GameStateDto';

export class PartyFlow {
  constructor(private readonly client: IGameClient) {}

  async addToParty(heroId: string): Promise<GameStateDto | null> {
    const response = await this.client.send({ type: 'ADD_TO_PARTY', heroId });
    if (!response.ok) {
      throw new Error(response.error);
    }
    return response.state;
  }

  async removeFromParty(heroId: string): Promise<GameStateDto | null> {
    const response = await this.client.send({ type: 'REMOVE_FROM_PARTY', heroId });
    if (!response.ok) {
      throw new Error(response.error);
    }
    return response.state;
  }

  async movePartyMember(fromIndex: number, toIndex: number): Promise<GameStateDto | null> {
    const response = await this.client.send({ type: 'MOVE_PARTY_MEMBER', fromIndex, toIndex });
    if (!response.ok) {
      throw new Error(response.error);
    }
    return response.state;
  }

  async setPartySlot(slotIndex: number, heroId: string): Promise<GameStateDto | null> {
    const response = await this.client.send({ type: 'SET_PARTY_SLOT', slotIndex, heroId });
    if (!response.ok) {
      throw new Error(response.error);
    }
    return response.state;
  }
}
