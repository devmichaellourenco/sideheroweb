import { IGameClient } from '../../application/ports/IGameClient';
import { GameStateDto } from '../../application/dto/GameStateDto';
import { AchievementListEntryDto } from '../../application/dto/AchievementDto';
import { ToastController } from '../components/ToastController';

export class AchievementsFlow {
  entries: AchievementListEntryDto[] = [];
  completedCount = 0;
  totalCount = 0;

  constructor(
    private readonly client: IGameClient,
    private readonly toasts: ToastController,
    private readonly onStateUpdated: (state: GameStateDto) => void,
  ) {}

  async loadList(): Promise<GameStateDto | null> {
    const response = await this.client.send({ type: 'GET_ACHIEVEMENTS' });
    if (!response.ok) {
      this.toasts.show(response.error ?? 'Falha ao carregar achievements', 'idle');
      return null;
    }

    this.entries = response.achievements ?? [];
    this.completedCount = response.completedAchievementCount ?? this.entries.filter((e) => e.completed).length;
    this.totalCount = response.totalAchievementCount ?? this.entries.length;
    this.onStateUpdated(response.state);
    return response.state;
  }
}
