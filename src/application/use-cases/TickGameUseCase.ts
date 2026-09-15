import { PhaseCombatHandlers } from '../../domain/campaign/PhaseCombatHandlers';
import { MetaBonusScope } from '../../domain/meta/MetaBonusScope';
import { MetaService } from '../../domain/meta/MetaService';
import { AchievementService } from '../../domain/achievements/AchievementService';
import { ICombatService } from '../../domain/services/ICombatService';
import { IAchievementProgressRepository } from '../../domain/repositories/IAchievementProgressRepository';
import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { IMetaProgressRepository } from '../../domain/repositories/IMetaProgressRepository';
import { META_LEGACY_ENABLED } from '../ProductGates';
import { GameStatePresenter } from '../presenters/GameStatePresenter';
import { mapAchievementUpdates } from '../mappers/AchievementMapper';
import { mapMetaSummary } from '../mappers/MetaMapper';
import { AchievementUpdateDto } from '../dto/AchievementDto';
import { CombatFloatingEventDto } from '../dto/CombatFloatingEventDto';
import { CombatSkillVfxDto } from '../dto/CombatSkillVfxDto';
import { GameStateDto } from '../dto/GameStateDto';

export interface TickGameResult {
  state: GameStateDto;
  combatFloats: CombatFloatingEventDto[];
  combatSkillVfx: CombatSkillVfxDto[];
  sigilsAwarded: number;
  achievementUpdates: AchievementUpdateDto[];
}

export class TickGameUseCase {
  private readonly phaseHandlers = new PhaseCombatHandlers();

  constructor(
    private readonly repository: IGameStateRepository,
    private readonly metaRepository: IMetaProgressRepository,
    private readonly metaService: MetaService,
    private readonly combatService: ICombatService,
    private readonly presenter: GameStatePresenter,
    private readonly achievementRepository: IAchievementProgressRepository,
    private readonly achievementService: AchievementService,
  ) {}

  async execute(
    ticks = 1,
    options: { restartCurrentPhase?: boolean } = {},
  ): Promise<TickGameResult> {
    let state = await this.repository.load();
    const wasSeasonCompleted = state.campaignProgress.seasonCompleted;
    const clearedBefore = new Set(state.campaignProgress.clearedPhaseIds);
    const combatFloats: CombatFloatingEventDto[] = [];
    const combatSkillVfx: CombatSkillVfxDto[] = [];

    if (options.restartCurrentPhase) {
      if (!state.loadoutEditOpen || !state.phaseRestartOnResume) {
        throw new Error('Não há missão pausada no acampamento');
      }

      const restarted = state.phaseRun
        ? this.phaseHandlers.restartPhaseFromPause(state, state.phaseRun)
        : this.phaseHandlers.startSelectedPhaseFromPause(state);

      if (!restarted.state.phaseRun) {
        throw new Error('Não foi possível iniciar a fase selecionada');
      }

      const nextState = restarted.state
        .withLoadoutEditOpen(false)
        .withPhaseRestartOnResume(false);

      await this.repository.save(nextState);
      const meta = await this.metaRepository.load();

      return {
        state: {
          ...this.presenter.present(nextState),
          meta: mapMetaSummary(meta, this.metaService),
        },
        combatFloats: [],
        combatSkillVfx: [],
        sigilsAwarded: 0,
        achievementUpdates: [],
      };
    }

    const metaBeforeTick = await this.metaRepository.load();
    if (META_LEGACY_ENABLED) {
      MetaBonusScope.set(this.metaService.resolveBonuses(metaBeforeTick));
    }

    try {
      for (let i = 0; i < ticks; i++) {
        const result = this.combatService.executeTick(state);
        state = result.state;
        combatFloats.push(...result.floatingEvents);
        combatSkillVfx.push(...result.skillVfxEvents);
      }
    } finally {
      MetaBonusScope.clear();
    }

    let sigilsAwarded = 0;
    if (
      META_LEGACY_ENABLED &&
      !wasSeasonCompleted &&
      state.campaignProgress.seasonCompleted
    ) {
      const awarded = this.metaService.awardSeasonCompletion(
        metaBeforeTick,
        state.campaignProgress.highestTierReached,
      );
      await this.metaRepository.save(awarded.progress);
      sigilsAwarded = awarded.sigilsAwarded;
    }

    const newlyCleared = state.campaignProgress.clearedPhaseIds.filter(
      (phaseId) => !clearedBefore.has(phaseId),
    );
    let achievementUpdates: AchievementUpdateDto[] = [];
    if (newlyCleared.length > 0) {
      const progress = await this.achievementRepository.load();
      const recorded = this.achievementService.recordPhaseClears(progress, newlyCleared);
      if (recorded.updates.length > 0) {
        await this.achievementRepository.save(recorded.progress);
        achievementUpdates = mapAchievementUpdates(recorded.updates);
      }
    }

    await this.repository.save(state);
    const meta = await this.metaRepository.load();

    return {
      state: {
        ...this.presenter.present(state),
        meta: mapMetaSummary(meta, this.metaService),
      },
      combatFloats,
      combatSkillVfx,
      sigilsAwarded,
      achievementUpdates,
    };
  }
}
