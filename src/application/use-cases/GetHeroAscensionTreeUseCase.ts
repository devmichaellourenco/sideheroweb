import { getAscensionById } from '../../domain/progression/ClassAscensionCatalog';
import { getHeroEvolutionDisplayName } from '../../domain/progression/getHeroEvolutionDisplayName';
import { normalizeAscensionId } from '../../domain/progression/normalizeAscensionId';
import { getUnlockedBattleSkillSlotCount } from '../../domain/progression/SkillBattleSlots';
import { IClassAscensionService } from '../../domain/progression/IClassAscensionService';
import { ISkillService } from '../../domain/progression/ISkillService';
import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { mapAscensionOptions } from '../mappers/AscensionMapper';
import { mapSkillTree } from '../mappers/HeroProgressionMapper';
import { GameStatePresenter } from '../presenters/GameStatePresenter';
import { AscensionOptionDto } from '../dto/AscensionOptionDto';
import { GameStateDto } from '../dto/GameStateDto';
import { SkillNodeDto } from '../dto/SkillNodeDto';

export interface GetHeroAscensionTreeResult {
  state: GameStateDto;
  options: AscensionOptionDto[];
  ascensionName: string | null;
  ascensionSkillNodes: SkillNodeDto[];
}

export class GetHeroAscensionTreeUseCase {
  constructor(
    private readonly repository: IGameStateRepository,
    private readonly presenter: GameStatePresenter,
    private readonly ascensionService: IClassAscensionService,
    private readonly skillService: ISkillService,
  ) {}

  async execute(heroId: string): Promise<GetHeroAscensionTreeResult> {
    const state = await this.repository.load();
    const hero = state.heroes.find((entry) => entry.id === heroId);

    if (!hero) {
      throw new Error('Herói não encontrado');
    }

    const props = hero.toProps();
    const ascensionId = normalizeAscensionId(props.ascensionId);
    const ascension = ascensionId ? getAscensionById(ascensionId) : null;
    const ascensionName =
      ascensionId && (hero.heroClass === 'knight' || hero.heroClass === 'sorcerer' || hero.heroClass === 'priest')
        ? getHeroEvolutionDisplayName(hero.heroClass, ascensionId)
        : ascension?.name ?? null;

    return {
      state: this.presenter.present(state),
      options: mapAscensionOptions(this.ascensionService.listOptions(hero)),
      ascensionName: ascensionName,
      ascensionSkillNodes: mapSkillTree(
        hero,
        this.skillService.buildAscensionTree(
          hero,
          getUnlockedBattleSkillSlotCount(state.upgradeLevels),
        ),
      ),
    };
  }
}
