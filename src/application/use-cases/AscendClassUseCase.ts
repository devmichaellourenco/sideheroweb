import { assertLoadoutEditable } from '../policies/assertLoadoutEditable';
import { getAscensionById } from '../../domain/progression/ClassAscensionCatalog';
import { IClassAscensionService } from '../../domain/progression/IClassAscensionService';
import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { GameStatePresenter } from '../presenters/GameStatePresenter';
import { GameStateDto } from '../dto/GameStateDto';

export class AscendClassUseCase {
  constructor(
    private readonly repository: IGameStateRepository,
    private readonly presenter: GameStatePresenter,
    private readonly ascensionService: IClassAscensionService,
  ) {}

  async execute(heroId: string, ascensionId: string): Promise<GameStateDto> {
    const state = await this.repository.load();
    assertLoadoutEditable(state);
    const hero = state.heroes.find((entry) => entry.id === heroId);

    if (!hero) {
      throw new Error('Herói não encontrado');
    }

    const updatedHero = this.ascensionService.ascend(hero, ascensionId);
    const ascensionName = getAscensionById(ascensionId)?.name ?? ascensionId;
    const heroes = state.heroes.map((entry) => (entry.id === heroId ? updatedHero : entry));
    const nextState = state
      .withHeroes(heroes)
      .addLog(`${hero.name} ascendeu para ${ascensionName}!`);

    await this.repository.save(nextState);
    return this.presenter.present(nextState);
  }
}
