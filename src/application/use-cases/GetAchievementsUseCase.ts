import { AchievementService } from '../../domain/achievements/AchievementService';
import { IAchievementProgressRepository } from '../../domain/repositories/IAchievementProgressRepository';
import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { GameStatePresenter } from '../presenters/GameStatePresenter';
import { mapAchievementList } from '../mappers/AchievementMapper';
import { AchievementListEntryDto } from '../dto/AchievementDto';
import { GameStateDto } from '../dto/GameStateDto';

export interface GetAchievementsResult {
  state: GameStateDto;
  achievements: AchievementListEntryDto[];
  completedCount: number;
  totalCount: number;
}

export class GetAchievementsUseCase {
  constructor(
    private readonly gameRepository: IGameStateRepository,
    private readonly achievementRepository: IAchievementProgressRepository,
    private readonly achievementService: AchievementService,
    private readonly presenter: GameStatePresenter,
  ) {}

  async execute(): Promise<GetAchievementsResult> {
    const [state, progress] = await Promise.all([
      this.gameRepository.load(),
      this.achievementRepository.load(),
    ]);

    const achievements = mapAchievementList(this.achievementService.listEntries(progress));
    const completedCount = achievements.filter((entry) => entry.completed).length;

    return {
      state: this.presenter.present(state),
      achievements,
      completedCount,
      totalCount: achievements.length,
    };
  }
}
