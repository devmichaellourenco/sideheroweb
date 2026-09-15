import { assertLoadoutEditable } from '../policies/assertLoadoutEditable';
import { AttributeKey } from '../../domain/progression/Attributes';
import { ImprovementResetMessages } from '../../domain/services/ImprovementResetMessages';
import { ImprovementResetService } from '../../domain/services/ImprovementResetService';
import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { GameStatePresenter } from '../presenters/GameStatePresenter';
import { GameStateDto } from '../dto/GameStateDto';

export type RefundTarget =
  | { type: 'attribute'; key: AttributeKey }
  | { type: 'skill'; skillId: string };

export class RefundImprovementPointUseCase {
  private readonly resetService = new ImprovementResetService();

  constructor(
    private readonly repository: IGameStateRepository,
    private readonly presenter: GameStatePresenter,
  ) {}

  async execute(heroId: string, target: RefundTarget): Promise<GameStateDto> {
    const state = await this.repository.load();
    assertLoadoutEditable(state);
    this.resetService.assertUnitaryUnlocked(state.upgradeLevels);

    const hero = state.heroes.find((entry) => entry.id === heroId);
    if (!hero) {
      throw new Error(ImprovementResetMessages.heroNotFound);
    }

    const updatedHero = this.resetService.refundOne(
      hero,
      target.type === 'attribute'
        ? { type: 'attribute', key: target.key }
        : { type: 'skill', skillId: target.skillId },
    );

    const heroes = state.heroes.map((entry) => (entry.id === heroId ? updatedHero : entry));
    const nextState = state.withHeroes(heroes).addLog(`Ponto de aprimoramento devolvido em ${hero.name}`);

    await this.repository.save(nextState);
    return this.presenter.present(nextState);
  }
}
