import { CombatIntermission } from './CombatIntermission';
import { CombatState } from '../entities/CombatState';
import { Chest } from '../entities/Chest';
import { Enemy } from '../entities/Enemy';
import { GameState } from '../entities/GameState';
import { Hero } from '../entities/Hero';
import { LootService } from '../services/LootService';
import { ActionTimerService } from '../services/combat/ActionTimerService';
import { tryGrantMilestoneUniqueGearOnPhaseClear } from './UniqueGearLootService';
import { EncounterMeta, EncounterResolver } from './EncounterResolver';
import { PhaseRun } from './PhaseRun';
import { resolvePhase } from './CampaignCatalog';
import {
  applyMissionDefeat,
  applyMissionVictory,
  enterCampHub,
} from './missions/ResolveMissionOutcome';

export interface PhaseCombatResult {
  state: GameState;
  events: string[];
}

export class PhaseCombatHandlers {
  constructor(
    private readonly encounterResolver = new EncounterResolver(),
    private readonly actionTimers = new ActionTimerService(),
    private readonly lootService = new LootService(),
  ) {}

  startPhaseRun(state: GameState, phaseRun: PhaseRun): PhaseCombatResult {
    const resolved = this.encounterResolver.resolve(phaseRun.phaseId, phaseRun.waveIndex);
    if (!resolved) {
      return { state, events: [] };
    }

    const combat = CombatState.start(
      state.activeHeroes(),
      resolved.enemies,
      this.actionTimers,
      resolved.meta,
    );
    const phase = resolved.phase;
    const waveLabel = `${phaseRun.waveIndex + 1}/${resolved.meta.waveCount}`;

    return {
      state: state
        .withPhaseRun(phaseRun)
        .withCombat(combat)
        .withBattlePaused(false)
        .clearBattleSessionStats(),
      events: [`Iniciou ${phase.displayName} · Wave ${waveLabel}`],
    };
  }

  onWaveCleared(
    state: GameState,
    defeatedEnemies: Enemy[],
    heroes: Hero[],
    meta: EncounterMeta,
    phaseRun: PhaseRun,
  ): PhaseCombatResult {
    const phaseId = meta.phaseId;
    const enemyNames = defeatedEnemies.map((enemy) => enemy.name).join(', ');
    const nextRun = phaseRun.advanceWave();
    const phase = resolvePhase(phaseId);
    const nextWave = this.encounterResolver.resolve(nextRun.phaseId, nextRun.waveIndex);
    const variant = nextWave?.meta.isBossWave ? 'boss-approach' : 'wave-clear';

    const nextState = state
      .withHeroes(heroes)
      .withPhaseRun(nextRun)
      .withCombat(state.combat?.withAllEnemiesDefeated() ?? null)
      .withCombatIntermission(
        CombatIntermission.create({
          variant,
          clearedPhaseId: phaseId,
          clearedPhaseName: phase?.displayName ?? phaseId,
        }),
      )
      .addLog(`Wave limpa! ${enemyNames}`)
      .touchTick();

    return {
      state: nextState,
      events: ['Wave limpa!'],
    };
  }

  onBossDefeated(
    state: GameState,
    _defeatedEnemies: Enemy[],
    heroes: Hero[],
    meta: EncounterMeta,
  ): PhaseCombatResult {
    const phase = resolvePhase(meta.phaseId);
    if (!phase) {
      return { state, events: [] };
    }

    const outcome = applyMissionVictory({
      state,
      phaseId: meta.phaseId,
      heroes,
      phaseDisplayName: phase.displayName,
      seasonFinale: phase.seasonFinale,
    });

    let nextState = outcome.state;

    const milestoneGear = tryGrantMilestoneUniqueGearOnPhaseClear(
      nextState,
      meta.phaseId,
      this.lootService,
    );
    if (milestoneGear) {
      const milestoneChest = Chest.createWithGuaranteedLoot(
        phase.difficultyTier,
        'act_boss',
        milestoneGear,
      );
      nextState = nextState.withChests([...nextState.chests, milestoneChest]);
    }

    return { state: nextState, events: outcome.events };
  }

  startSelectedPhaseFromPause(state: GameState): PhaseCombatResult {
    const phaseId = state.campaignProgress.selectedPhaseId;
    if (!phaseId) {
      return { state, events: [] };
    }

    const recovered = state.activeHeroes().map((hero) => hero.healFull());
    return this.startPhaseRun(state.withHeroes(recovered), PhaseRun.start(phaseId));
  }

  restartPhaseFromPause(state: GameState, phaseRun: PhaseRun): PhaseCombatResult {
    const recovered = state.activeHeroes().map((hero) => hero.healFull());
    const resetRun = phaseRun.resetWaves();
    const resolved = this.encounterResolver.resolve(resetRun.phaseId, resetRun.waveIndex);
    if (!resolved) {
      return {
        state: state.withHeroes(recovered).withPhaseRun(null).withCombat(null),
        events: [],
      };
    }

    const combat = CombatState.start(recovered, resolved.enemies, this.actionTimers, resolved.meta);
    const phase = resolved.phase;
    const waveLabel = `${resetRun.waveIndex + 1}/${resolved.meta.waveCount}`;

    return {
      state: state
        .withHeroes(recovered)
        .withPhaseRun(resetRun)
        .withCombat(combat)
        .withBattlePaused(false)
        .clearBattleSessionStats()
        .addLog(`⏯ Fase reiniciada em ${phase.displayName} · Wave ${waveLabel}`),
      events: [`Fase reiniciada · Wave ${waveLabel}`],
    };
  }

  onPhaseWipe(state: GameState, phaseRun: PhaseRun): PhaseCombatResult {
    const failedPhase = resolvePhase(phaseRun.phaseId);
    const failedName = failedPhase?.displayName ?? phaseRun.phaseId;
    const outcome = applyMissionDefeat({
      state,
      phaseId: phaseRun.phaseId,
      phaseDisplayName: failedName,
    });
    return { state: outcome.state, events: outcome.events };
  }

  resumeIntermission(state: GameState): PhaseCombatResult {
    if (!state.combatIntermission) {
      return { state, events: [] };
    }

    const intermission = state.combatIntermission;
    const cleared = state.withCombatIntermission(null);

    if (intermission.variant === 'phase-clear' || intermission.variant === 'defeat') {
      return {
        state: enterCampHub(
          cleared,
          intermission.variant === 'defeat'
            ? '🏕 Acampamento — escolha outra missão no mapa'
            : `🏕 Acampamento — ${intermission.clearedPhaseName} resolvida. Abra o mapa para a próxima missão`,
        ),
        events: ['Acampamento'],
      };
    }

    if (cleared.phaseRun) {
      return this.startCombatForPhaseRun(cleared, cleared.phaseRun);
    }

    return { state: cleared, events: [] };
  }

  private startCombatForPhaseRun(state: GameState, phaseRun: PhaseRun): PhaseCombatResult {
    const resolved = this.encounterResolver.resolve(phaseRun.phaseId, phaseRun.waveIndex);
    if (!resolved) {
      return {
        state: state.withPhaseRun(null).withCombat(null),
        events: [],
      };
    }

    const combat = CombatState.start(
      state.activeHeroes(),
      resolved.enemies,
      this.actionTimers,
      resolved.meta,
    );
    const waveLabel = `${phaseRun.waveIndex + 1}/${resolved.meta.waveCount}`;

    return {
      state: state.withPhaseRun(phaseRun).withCombat(combat).withBattlePaused(false).touchTick(),
      events: [`Wave ${waveLabel} iniciada`],
    };
  }
}
