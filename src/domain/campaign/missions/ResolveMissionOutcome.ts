import { GameState } from '../../entities/GameState';
import { Hero } from '../../entities/Hero';
import { createGearFromCatalogItem, getGearCatalogItem } from '../../gear/GearItemCatalog';
import { playerOwnsGearTemplate } from '../../gear/UniqueGearCatalog';
import { GearStorageService } from '../../services/GearStorageService';
import { CombatIntermission } from '../CombatIntermission';
import { resolvePhase } from '../CampaignCatalog';
import { MapId, PhaseId, mapIdFromIndex, parsePhaseId } from '../CampaignIds';
import {
  allMissionsOnBoard,
  buildCampMissionBoard,
  currentMainPhaseNumberForMap,
  ensureNormalOfferForBoard,
} from './CampMissionBoard';
import { getMissionById } from './MissionCatalog';
import {
  MissionId,
  mainMissionId,
  normalMissionId,
  parseMissionIdKind,
} from './MissionId';
import { MissionProgress } from './MissionProgress';
import { resolveMissionScene } from './MissionSceneCatalog';
import { nextNormalOfferAfterCampVisit } from './NormalMissionOffer';
import { grantPhaseVictoryXp } from '../PhaseVictoryXp';

export interface MissionOutcomeResult {
  state: GameState;
  events: string[];
  missionId: MissionId | null;
}

function inferMissionIdFromPhase(phaseId: PhaseId, progress: MissionProgress): MissionId | null {
  if (progress.activeMissionId) return progress.activeMissionId;
  const mainId = mainMissionId(phaseId);
  if (getMissionById(mainId)) return mainId;
  const normalId = normalMissionId(phaseId);
  if (getMissionById(normalId)) return normalId;
  return null;
}

/**
 * Recompensa de conclusão de missão: apenas item exclusivo e cena narrativa.
 * Ouro vem dos kills; XP vem do orçamento da fase na vitória (`grantPhaseVictoryXp`).
 * Chamada só na vitória; na derrota nada é concedido aqui.
 */
function applyMissionRewards(
  state: GameState,
  missionId: MissionId,
): { state: GameState; events: string[] } {
  const rewards = getMissionById(missionId)?.rewards;
  if (!rewards) return { state, events: [] };

  let next = state;
  const events: string[] = [];
  let missionProgress = next.campaignProgress.missionProgress;

  if (rewards.itemId) {
    const itemId = rewards.itemId;
    const alreadyAwarded =
      missionProgress.hasAwardedExclusiveItem(itemId) ||
      playerOwnsGearTemplate(next, itemId);
    if (!alreadyAwarded && getGearCatalogItem(itemId)) {
      const gear = createGearFromCatalogItem(itemId, `mission-${missionId}-${itemId}`);
      const destination = new GearStorageService().resolveLootDestination(
        next.upgradeLevels,
        next.inventory.length,
        next.stash.length,
      );
      if (destination === 'inventory') {
        next = next.withInventory([...next.inventory, gear]);
        events.push(`Item exclusivo: ${gear.name}`);
        missionProgress = missionProgress.markExclusiveItemAwarded(itemId);
      } else if (destination === 'stash') {
        next = next.withStash([...next.stash, gear]);
        events.push(`Item exclusivo (baú): ${gear.name}`);
        missionProgress = missionProgress.markExclusiveItemAwarded(itemId);
      } else {
        events.push(`Inventário cheio — item exclusivo não entregue: ${itemId}`);
      }
    }
  }

  if (rewards.sceneId && resolveMissionScene(rewards.sceneId)) {
    missionProgress = missionProgress.unlockNarrativeScene(rewards.sceneId);
    events.push('Cena narrativa desbloqueada');
  }

  if (missionProgress !== next.campaignProgress.missionProgress) {
    next = next.withCampaignProgress(
      next.campaignProgress.withMissionProgress(missionProgress),
    );
  }

  return { state: next, events };
}

function resolveMapIdForMission(missionId: MissionId, fallbackPhaseId: PhaseId): MapId {
  const mission = getMissionById(missionId);
  if (mission) return mission.mapId;
  return mapIdFromIndex(parsePhaseId(fallbackPhaseId).mapIndex);
}

/**
 * Vitória de missão: marca progresso por tipo, limpa combate, intermissão phase-clear → camp.
 * Não auto-seleciona próxima fase linear.
 */
export function applyMissionVictory(params: {
  state: GameState;
  phaseId: PhaseId;
  heroes: Hero[];
  phaseDisplayName: string;
  seasonFinale?: boolean;
}): MissionOutcomeResult {
  const { state, phaseId, heroes, phaseDisplayName } = params;
  const recovered = heroes.map((hero) => hero.healFull());
  let progress = state.campaignProgress;
  let missionProgress = progress.missionProgress;
  const missionId = inferMissionIdFromPhase(phaseId, missionProgress);
  const events: string[] = [];
  const kind = missionId ? parseMissionIdKind(missionId) : null;

  if (missionId && kind === 'main') {
    missionProgress = missionProgress.markMainCompleted(missionId);
    events.push(`${phaseDisplayName} (principal) concluída!`);
  } else if (missionId && kind === 'side') {
    missionProgress = missionProgress.markSideCompleted(missionId);
    events.push(`${phaseDisplayName} (secundária) concluída!`);
  } else if (missionId && kind === 'normal') {
    const mapId = resolveMapIdForMission(missionId, phaseId);
    missionProgress = missionProgress.removeNormalFromOffer(mapId, missionId);
    events.push(`${phaseDisplayName} (missão) concluída!`);
  } else {
    events.push(`${phaseDisplayName} concluída!`);
  }

  const phase = resolvePhase(phaseId);
  if (phase) {
    progress = progress.markCleared(phaseId, [], phase.difficultyTier);
    if (params.seasonFinale || phase.seasonFinale) {
      progress = progress.markSeasonCompleted();
      events.unshift('🏆 Jornada concluída!');
    }
  }

  progress = progress.withMissionProgress(missionProgress.clearActiveMission());

  let nextState = state
    .withCampaignProgress(progress)
    .withRosterHeroes(recovered)
    .withStage(progress.highestTierReached)
    .withPhaseRun(null)
    .withCombat(null)
    .withCombatIntermission(
      CombatIntermission.create({
        variant: 'phase-clear',
        clearedPhaseId: phaseId,
        clearedPhaseName: phaseDisplayName,
        nextPhaseId: null,
        nextPhaseName: null,
      }),
    )
    .incrementBattlesWon();

  if (missionId) {
    const rewarded = applyMissionRewards(nextState, missionId);
    nextState = rewarded.state;
    events.push(...rewarded.events);
  }

  const xpResult = grantPhaseVictoryXp(nextState, phaseId);
  nextState = xpResult.state;
  if (xpResult.xpGranted > 0) {
    events.push(`+${xpResult.xpGranted} XP`);
  }

  nextState = nextState.addLog(
    `Boss derrotado em ${phaseDisplayName}! · Party recuperada · Retorno ao acampamento`,
  );

  return { state: nextState.touchTick(), events, missionId };
}

/**
 * Derrota: normal some da oferta; sem XP (só ouro já pago nos kills).
 * Nenhuma recompensa de conclusão em qualquer tipo.
 */
export function applyMissionDefeat(params: {
  state: GameState;
  phaseId: PhaseId;
  phaseDisplayName: string;
}): MissionOutcomeResult {
  const { state, phaseId, phaseDisplayName } = params;
  const recovered = state.activeHeroes().map((hero) => hero.healFull());
  let missionProgress = state.campaignProgress.missionProgress;
  const missionId = inferMissionIdFromPhase(phaseId, missionProgress);
  const kind = missionId ? parseMissionIdKind(missionId) : null;
  const events = ['Party derrotada! Retorno ao acampamento...'];

  if (missionId && kind === 'normal') {
    const mapId = resolveMapIdForMission(missionId, phaseId);
    missionProgress = missionProgress.removeNormalFromOffer(mapId, missionId);
  }

  missionProgress = missionProgress.clearActiveMission();
  const progress = state.campaignProgress.withMissionProgress(missionProgress);

  let nextState = state
    .withHeroes(recovered)
    .withCampaignProgress(progress)
    .withPhaseRun(null)
    .withCombat(null)
    .withCombatIntermission(
      CombatIntermission.create({
        variant: 'defeat',
        clearedPhaseId: phaseId,
        clearedPhaseName: phaseDisplayName,
        nextPhaseId: null,
        nextPhaseName: null,
      }),
    )
    .addLog(`Party derrotada em ${phaseDisplayName}! Retorno ao acampamento.`);

  return { state: nextState.touchTick(), events, missionId };
}

/**
 * Hub do acampamento após resultado (sem auto-start de fase).
 * Mantém loadoutEditOpen para UI de camp; sem phaseRestartOnResume — batalha só via mapa.
 */
export function enterCampHub(state: GameState, logMessage?: string): GameState {
  const mapId = mapIdFromIndex(
    parsePhaseId(state.campaignProgress.selectedPhaseId).mapIndex,
  );
  let missionProgress = state.campaignProgress.missionProgress;
  const currentMainPhaseNumber = currentMainPhaseNumberForMap(
    mapId,
    state.campaignProgress.missionProgress.completedMainIds,
  );
  const visit = nextNormalOfferAfterCampVisit({
    mapId,
    saveSeed: missionProgress.offerSeed,
    offerEpoch: missionProgress.offerEpochFor(mapId),
    campVisitsSinceRefresh: missionProgress.campVisitsSinceNormalRefresh,
    currentOffer: missionProgress.normalOfferFor(mapId),
    currentMainPhaseNumber,
  });
  missionProgress = missionProgress
    .withNormalOffer(mapId, visit.offer, visit.offerEpoch)
    .withCampVisitsSinceNormalRefresh(visit.campVisitsSinceRefresh);

  let next = state
    .withCampaignProgress(state.campaignProgress.withMissionProgress(missionProgress))
    .withPhaseRun(null)
    .withCombat(null)
    .withBattlePaused(false)
    .clearBattleSessionStats()
    .withLoadoutEditOpen(true)
    .withPhaseRestartOnResume(false)
    .withCombatIntermission(null);

  if (logMessage) {
    next = next.addLog(logMessage);
  }
  return next;
}

function ensureOfferOnProgress(
  missionProgress: MissionProgress,
  mapId: MapId,
): MissionProgress {
  const currentMainPhaseNumber = currentMainPhaseNumberForMap(
    mapId,
    missionProgress.completedMainIds,
  );
  const ensured = ensureNormalOfferForBoard({
    mapId,
    saveSeed: missionProgress.offerSeed,
    offerEpoch: missionProgress.offerEpochFor(mapId),
    currentOffer: missionProgress.normalOfferFor(mapId),
    currentMainPhaseNumber,
  });
  return missionProgress.withNormalOffer(mapId, ensured.offer, ensured.offerEpoch);
}

function isMissionOnBoard(missionProgress: MissionProgress, missionId: MissionId): boolean {
  const mission = getMissionById(missionId);
  if (!mission) return false;

  const progress = ensureOfferOnProgress(missionProgress, mission.mapId);
  const board = buildCampMissionBoard({
    mapId: mission.mapId,
    completedMainIds: progress.completedMainIds,
    completedSideIds: progress.completedSideIds,
    completedMissionIds: progress.completedMissionIds(),
    normalOfferIds: progress.normalOfferFor(mission.mapId),
  });

  return allMissionsOnBoard(board).some((entry) => entry.id === missionId);
}

export function startMissionOnState(params: {
  state: GameState;
  missionId: MissionId;
}): { state: GameState; phaseTemplateId: PhaseId; error?: string } {
  const mission = getMissionById(params.missionId);
  if (!mission) {
    return { state: params.state, phaseTemplateId: '1-1', error: 'Missão não encontrada' };
  }

  let missionProgress = ensureOfferOnProgress(
    params.state.campaignProgress.missionProgress,
    mission.mapId,
  );

  if (!isMissionOnBoard(missionProgress, params.missionId)) {
    return {
      state: params.state.withCampaignProgress(
        params.state.campaignProgress.withMissionProgress(missionProgress),
      ),
      phaseTemplateId: mission.phaseTemplateId,
      error: 'Missão indisponível no mapa nesta visita',
    };
  }

  missionProgress = missionProgress.withActiveMission(params.missionId);
  const progress = params.state.campaignProgress
    .withMissionProgress(missionProgress)
    .withSelectedPhase(mission.phaseTemplateId);

  return {
    state: params.state
      .withCampaignProgress(progress)
      .withLoadoutEditOpen(true)
      .withPhaseRestartOnResume(true)
      .withPhaseRun(null)
      .withCombat(null)
      .addLog(`Missão selecionada: ${mission.name}`),
    phaseTemplateId: mission.phaseTemplateId,
  };
}
