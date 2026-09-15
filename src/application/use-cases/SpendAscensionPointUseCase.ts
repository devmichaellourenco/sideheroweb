import { assertLoadoutEditable } from '../policies/assertLoadoutEditable';
import { ISkillService } from '../../domain/progression/ISkillService';
import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { GameStatePresenter } from '../presenters/GameStatePresenter';
import { GameStateDto } from '../dto/GameStateDto';
import { getUnlockedBattleSkillSlotCount } from '../../domain/progression/SkillBattleSlots';

export class SpendAscensionPointUseCase {
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

    const updatedHero = this.skillService.allocateAscension(
      hero,
      skillId,
      getUnlockedBattleSkillSlotCount(state.upgradeLevels),
    );
    const heroes = state.heroes.map((entry) => (entry.id === heroId ? updatedHero : entry));
    const nextState = state
      .withHeroes(heroes)
      .addLog(`Ponto de ascensão investido em ${hero.name}`);

    await this.repository.save(nextState);
    return this.presenter.present(nextState);
  }
}
