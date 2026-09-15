import { isMilestonePhase, parsePhaseId, PhaseId } from './CampaignIds';
import { EnemyRole } from './WaveDefinition';
import { EnemyType } from '../entities/EnemyType';
import { GameState } from '../entities/GameState';
import { Gear } from '../entities/Gear';
import { milestoneBossForMapIndex } from '../enemies/EnemyTierProgression';
import {
  IGNUS_IX_TEMPLATE_ID,
  MORTHAVEN_SEAL_TEMPLATE_ID,
  playerOwnsGearTemplate,
  SOLER_PLEGIUS_TEMPLATE_ID,
  SWORD_VORPAL_LUPNUS_TEMPLATE_ID,
} from '../gear/UniqueGearCatalog';
import { ILootService } from '../services/ILootService';

export interface UniqueBossDropParams {
  phaseId: PhaseId;
  mapIndex: number;
  enemyType: EnemyType;
  role: EnemyRole;
  isPhaseBoss: boolean;
}

function createNamedLegendaryDrop(
  state: GameState,
  templateId: string,
  lootService: ILootService,
): Gear | null {
  if (playerOwnsGearTemplate(state, templateId)) {
    return null;
  }

  return lootService.generateGearFromTemplate(
    templateId,
    state.stage,
    'legendary',
    `unique-${templateId}`,
  );
}

/** Boss de capítulo X-50 — tolera save sem `role` se o tipo bate com o marco do mapa. */
export function isNamedChapterBossKill(params: UniqueBossDropParams): boolean {
  if (!params.isPhaseBoss) return false;
  if (params.role === 'boss') return true;

  const { phaseNumber } = parsePhaseId(params.phaseId);
  if (!isMilestonePhase(phaseNumber)) return false;

  return params.enemyType === milestoneBossForMapIndex(params.mapIndex);
}

export function tryCreateGonodorVorpalDrop(
  state: GameState,
  params: UniqueBossDropParams,
  lootService: ILootService,
): Gear | null {
  if (
    params.mapIndex !== 2 ||
    params.enemyType !== 'gonodor' ||
    !isNamedChapterBossKill(params)
  ) {
    return null;
  }

  return createNamedLegendaryDrop(state, SWORD_VORPAL_LUPNUS_TEMPLATE_ID, lootService);
}

/** Drop garantido do Saci (boss final 1-50 / Stendra) se o jogador ainda não possui. */
export function tryCreateSaciIgnusDrop(
  state: GameState,
  params: UniqueBossDropParams,
  lootService: ILootService,
): Gear | null {
  if (
    params.mapIndex !== 1 ||
    params.enemyType !== 'saci' ||
    !isNamedChapterBossKill(params)
  ) {
    return null;
  }

  return createNamedLegendaryDrop(state, IGNUS_IX_TEMPLATE_ID, lootService);
}

/** Drop garantido do chefe da fase 3-50 se o jogador ainda não possui. */
export function tryCreatePhase3SolerDrop(
  state: GameState,
  params: UniqueBossDropParams,
  lootService: ILootService,
): Gear | null {
  if (
    params.mapIndex !== 3 ||
    params.enemyType !== 'renegade_necromancer' ||
    !isNamedChapterBossKill(params)
  ) {
    return null;
  }

  return createNamedLegendaryDrop(state, SOLER_PLEGIUS_TEMPLATE_ID, lootService);
}

/** Drop garantido do Duque de Morthaven (4-50) se o jogador ainda não possui. */
export function tryCreateMorthavenSealDrop(
  state: GameState,
  params: UniqueBossDropParams,
  lootService: ILootService,
): Gear | null {
  if (
    params.mapIndex !== 4 ||
    params.enemyType !== 'morthaven_duke' ||
    !isNamedChapterBossKill(params)
  ) {
    return null;
  }

  return createNamedLegendaryDrop(state, MORTHAVEN_SEAL_TEMPLATE_ID, lootService);
}

export function tryCreateUniqueBossGearDrop(
  state: GameState,
  params: UniqueBossDropParams,
  lootService: ILootService,
): Gear | null {
  return (
    tryCreateSaciIgnusDrop(state, params, lootService) ??
    tryCreateGonodorVorpalDrop(state, params, lootService) ??
    tryCreatePhase3SolerDrop(state, params, lootService) ??
    tryCreateMorthavenSealDrop(state, params, lootService)
  );
}

/** Fallback ao concluir fase X-50 — garante o lendário mesmo se o espólio do kill falhar. */
export function tryGrantMilestoneUniqueGearOnPhaseClear(
  state: GameState,
  phaseId: PhaseId,
  lootService: ILootService,
): Gear | null {
  const { mapIndex, phaseNumber } = parsePhaseId(phaseId);
  if (!isMilestonePhase(phaseNumber) || mapIndex > 4) {
    return null;
  }

  return tryCreateUniqueBossGearDrop(
    state,
    {
      phaseId,
      mapIndex,
      enemyType: milestoneBossForMapIndex(mapIndex),
      role: 'boss',
      isPhaseBoss: true,
    },
    lootService,
  );
}
