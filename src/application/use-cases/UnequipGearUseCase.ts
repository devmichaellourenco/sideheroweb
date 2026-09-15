import { assertLoadoutEditable } from '../policies/assertLoadoutEditable';
import { Gear, GearSlot } from '../../domain/entities/Gear';
import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { GearStorageService } from '../../domain/services/GearStorageService';
import { GameStatePresenter } from '../presenters/GameStatePresenter';
import { GameStateDto } from '../dto/GameStateDto';

export class UnequipGearUseCase {
  constructor(
    private readonly repository: IGameStateRepository,
    private readonly presenter: GameStatePresenter,
    private readonly gearStorageService: GearStorageService = new GearStorageService(),
  ) {}

  async execute(heroId: string, slot: GearSlot): Promise<GameStateDto> {
    const state = await this.repository.load();
    assertLoadoutEditable(state);
    let removedGear: Gear | null = null;

    const heroes = state.heroes.map((hero) => {
      if (hero.id !== heroId) return hero;
      const result = hero.unequip(slot);
      removedGear = result.removed;
      return result.hero;
    });

    if (!removedGear) {
      throw new Error('Nenhum item equipado neste slot');
    }

    this.gearStorageService.assertCanAddToInventory(state);

    const nextState = state
      .withHeroes(heroes)
      .withInventory([...state.inventory, removedGear])
      .addLog(`${removedGear.name} desequipado e enviado ao inventário!`);

    await this.repository.save(nextState);
    return this.presenter.present(nextState);
  }
}
