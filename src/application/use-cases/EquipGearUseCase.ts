import { assertLoadoutEditable } from '../policies/assertLoadoutEditable';
import {
  addReplacedGearToInventory,
  equipHeroWithGear,
} from '../../domain/services/GearEquipService';
import { GameStatePresenter } from '../presenters/GameStatePresenter';
import { GameStateDto } from '../dto/GameStateDto';

export class EquipGearUseCase {
  constructor(
    private readonly repository: IGameStateRepository,
    private readonly presenter: GameStatePresenter,
  ) {}

  async execute(heroId: string, gearId: string): Promise<GameStateDto> {
    const state = await this.repository.load();
    assertLoadoutEditable(state);
    const gear = state.inventory.find((entry) => entry.id === gearId);

    if (!gear) {
      throw new Error('Item não encontrado no inventário');
    }

    const targetHero = state.heroes.find((hero) => hero.id === heroId);
    if (!targetHero) {
      throw new Error('Herói não encontrado');
    }

    const { hero: updatedHero, replaced } = equipHeroWithGear(targetHero, gear);
    const heroes = state.heroes.map((hero) => (hero.id === heroId ? updatedHero : hero));
    const inventory = addReplacedGearToInventory(state.inventory, gearId, replaced);

    const nextState = state
      .withHeroes(heroes)
      .withInventory(inventory)
      .addLog(`${gear.name} equipado!`);

    await this.repository.save(nextState);
    return this.presenter.present(nextState);
  }
}
