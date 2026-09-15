import { assertLoadoutEditable } from '../policies/assertLoadoutEditable';
import { ImprovementResetService } from '../../domain/services/ImprovementResetService';
import { ImprovementResetMessages } from '../../domain/services/ImprovementResetMessages';
import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { GameStatePresenter } from '../presenters/GameStatePresenter';
import { GameStateDto } from '../dto/GameStateDto';
import { MassRefundPreviewDto } from '../dto/MassRefundPreviewDto';

export interface MassRefundImprovementPointsResult {
  state: GameStateDto;
  pointsRefunded: number;
  ascensionPointsRefunded: number;
  warnings: string[];
}

function toPreviewDto(
  preview: ReturnType<ImprovementResetService['previewMassRefund']>,
): MassRefundPreviewDto {
  return {
    skillPoints: preview.skillPoints,
    ascensionSkillPoints: preview.ascensionSkillPoints,
    attributePoints: preview.attributePoints,
    pointsRefunded: preview.pointsRefunded,
    skillsCleared: preview.skillsCleared,
    ascensionSkillsCleared: preview.ascensionSkillsCleared,
    attributeChanges: preview.attributeChanges,
    warnings: preview.warnings,
  };
}

export class PreviewMassRefundImprovementPointsUseCase {
  private readonly resetService = new ImprovementResetService();

  constructor(private readonly repository: IGameStateRepository) {}

  async execute(heroId: string): Promise<MassRefundPreviewDto> {
    const state = await this.repository.load();
    assertLoadoutEditable(state);
    this.resetService.assertMassUnlocked(state.upgradeLevels);

    const hero = state.heroes.find((entry) => entry.id === heroId);
    if (!hero) {
      throw new Error(ImprovementResetMessages.heroNotFound);
    }

    return toPreviewDto(this.resetService.previewMassRefund(hero));
  }
}

export class MassRefundImprovementPointsUseCase {
  private readonly resetService = new ImprovementResetService();

  constructor(
    private readonly repository: IGameStateRepository,
    private readonly presenter: GameStatePresenter,
  ) {}

  async execute(heroId: string): Promise<MassRefundImprovementPointsResult> {
    const state = await this.repository.load();
    assertLoadoutEditable(state);
    this.resetService.assertMassUnlocked(state.upgradeLevels);

    const hero = state.heroes.find((entry) => entry.id === heroId);
    if (!hero) {
      throw new Error(ImprovementResetMessages.heroNotFound);
    }

    const result = this.resetService.massRefund(hero);
    const heroes = state.heroes.map((entry) => (entry.id === heroId ? result.hero : entry));
    const log =
      result.pointsRefunded > 0
        ? `Reset em massa: ${result.pointsRefunded} ponto(s) devolvidos em ${hero.name}`
        : `Reset em massa sem pontos a devolver em ${hero.name}`;
    const nextState = state.withHeroes(heroes).addLog(log);

    await this.repository.save(nextState);
    return {
      state: this.presenter.present(nextState),
      pointsRefunded: result.pointsRefunded,
      ascensionPointsRefunded: result.ascensionPointsRefunded,
      warnings: result.warnings,
    };
  }
}
