import { assertLoadoutEditable } from '../policies/assertLoadoutEditable';
import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { ISkillService } from '../../domain/progression/ISkillService';
import { GameStatePresenter } from '../presenters/GameStatePresenter';
import { GameStateDto } from '../dto/GameStateDto';

export class DeactivateSkillUseCase {
  constructor(
    private readonly repository: IGameStateRepository,
    private readonly presenter: GameStatePresenter,
    private readonly skillService: ISkillService,
  ) {}

  async execute(heroId: string, skillId: string): Promise<GameStateDto> {
    const state = await this.repository.load();
    assertLoadoutEditable(state);
    const hero = state.heroes.find((entry) => entry.id === heroId);

    if (!hero) {
      throw new Error('Herói não encontrado');
    }

    const updatedHero = this.skillService.deactivate(hero, skillId);
    const heroes = state.heroes.map((entry) => (entry.id === heroId ? updatedHero : entry));
    const nextState = state.withHeroes(heroes);

    await this.repository.save(nextState);
    return this.presenter.present(nextState);
  }
}
