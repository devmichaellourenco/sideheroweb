import { PhaseId } from '../../domain/campaign/CampaignIds';
import {
  applyMissionDefeat,
  applyMissionVictory,
  enterCampHub,
} from '../../domain/campaign/missions/ResolveMissionOutcome';
import { resolvePhase } from '../../domain/campaign/CampaignCatalog';
import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { GameStateDto } from '../dto/GameStateDto';
import { GameStatePresenter } from '../presenters/GameStatePresenter';

export type ResolveMissionOutcomeMode = 'victory' | 'defeat' | 'enter_camp';

export class ResolveMissionOutcomeUseCase {
  constructor(
    private readonly repository: IGameStateRepository,
    private readonly presenter: GameStatePresenter,
  ) {}

  async execute(
    mode: ResolveMissionOutcomeMode,
    phaseId?: PhaseId,
  ): Promise<GameStateDto> {
    const state = await this.repository.load();
    const resolvedPhaseId = phaseId ?? state.campaignProgress.selectedPhaseId;
    const phase = resolvePhase(resolvedPhaseId);
    const displayName = phase?.displayName ?? resolvedPhaseId;

    let next = state;
    if (mode === 'victory') {
      next = applyMissionVictory({
        state,
        phaseId: resolvedPhaseId,
        heroes: state.heroes,
        phaseDisplayName: displayName,
        seasonFinale: phase?.seasonFinale,
      }).state;
    } else if (mode === 'defeat') {
      next = applyMissionDefeat({
        state,
        phaseId: resolvedPhaseId,
        phaseDisplayName: displayName,
      }).state;
    } else {
      next = enterCampHub(state);
    }

    await this.repository.save(next);
    return this.presenter.present(next);
  }
}
