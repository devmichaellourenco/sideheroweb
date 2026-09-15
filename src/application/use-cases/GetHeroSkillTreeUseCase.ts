import { getUnlockedBattleSkillSlotCount } from '../../domain/progression/SkillBattleSlots';
import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { ISkillService } from '../../domain/progression/ISkillService';
import { mapSkillTree } from '../mappers/HeroProgressionMapper';
import { GameStatePresenter } from '../presenters/GameStatePresenter';
import { GameStateDto } from '../dto/GameStateDto';
import { SkillNodeDto } from '../dto/SkillNodeDto';

export interface GetHeroSkillTreeResult {
  state: GameStateDto;
  nodes: SkillNodeDto[];
}

export class GetHeroSkillTreeUseCase {
  constructor(
    private readonly repository: IGameStateRepository,
    private readonly presenter: GameStatePresenter,
    private readonly skillService: ISkillService,
  ) {}

  async execute(heroId: string): Promise<GetHeroSkillTreeResult> {
    const state = await this.repository.load();
    const hero = state.heroes.find((entry) => entry.id === heroId);

    if (!hero) {
      throw new Error('Herói não encontrado');
    }

    return {
      state: this.presenter.present(state),
      nodes: mapSkillTree(
        hero,
        this.skillService.buildTree(hero, getUnlockedBattleSkillSlotCount(state.upgradeLevels)),
      ),
    };
  }
}
