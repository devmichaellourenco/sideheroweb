import { Enemy } from '../entities/Enemy';
import { getEnemyRosterEntry } from '../enemies/EnemyRosterCatalog';
import { phaseGoldScaleForPhase } from '../balance/PhaseGoldBudget';
import {
  deriveCombatMaxHealth,
} from '../combat/CombatantDerivedStats';
import { resolveEnemySpawnMaxHealth } from '../combat/EnemyCombatBalance';
import { combatantStatGrowth } from '../combat/CombatantIdentity';
import { getEnemyCombatIdentity } from '../enemies/EnemyCombatIdentityCatalog';
import { buildEnemyCombatSheet } from '../enemies/EnemyProgressionCatalog';
import { Stats } from '../value-objects/Stats';
import { PhaseId } from './CampaignIds';
import { EnemyRole, EnemySlot, WaveDefinition } from './WaveDefinition';

export interface WaveSpawnContext {
  phaseId: PhaseId;
  waveIndex: number;
  difficultyTier: number;
  isBossWave: boolean;
  statMultiplier?: number;
  milestoneGoldScale?: number;
  /** Quando false, ignora o teto de ouro por fase (cálculo interno do orçamento). */
  applyPhaseGoldBudget?: boolean;
  /**
   * Quando false, ignora overrides de XP/ouro do lab e o orçamento derivado
   * (cálculo interno de escala).
   */
  applyPhaseRewardOverrides?: boolean;
}

const ROLE_REWARD_SCALE: Record<EnemyRole, number> = {
  trash: 1,
  elite: 1.25,
  boss: 1.6,
};

export function spawnEnemiesForWave(
  wave: WaveDefinition,
  context: WaveSpawnContext,
): Enemy[] {
  const enemies: Enemy[] = [];
  let slotIndex = 0;

  for (const slot of wave.slots) {
    for (let copy = 0; copy < slot.count; copy++) {
      enemies.push(
        createEnemyFromSlot(slot, {
          ...context,
          slotIndex,
          goldMultiplier: wave.goldMultiplier ?? 1,
        }),
      );
      slotIndex += 1;
    }
  }

  return enemies;
}

/**
 * Level de combate do inimigo: override do slot ou difficultyTier da fase.
 * O mesmo template pode reaparecer em fases diferentes com levels distintos.
 */
export function resolveEnemySpawnLevel(
  slot: EnemySlot,
  difficultyTier: number,
): number {
  if (typeof slot.level === 'number' && slot.level > 0) {
    return Math.floor(slot.level);
  }
  return Math.max(1, Math.floor(difficultyTier));
}

/** Spawna um inimigo a partir do slot (também usado no preview de missão). */
export function createEnemyFromSlot(
  slot: EnemySlot,
  context: WaveSpawnContext & { slotIndex: number; goldMultiplier: number },
): Enemy {
  const level = resolveEnemySpawnLevel(slot, context.difficultyTier);
  const roleScale = ROLE_REWARD_SCALE[slot.role];
  const sheet = buildEnemyCombatSheet({
    enemyType: slot.enemyType,
    level,
    role: slot.role,
  });

  const statMultiplier = context.statMultiplier ?? 1;
  const baseAttack = Math.max(1, Math.floor(sheet.baseAttack * statMultiplier));
  const baseDefense = Math.max(1, Math.floor(sheet.baseDefense * statMultiplier));
  const baseMaxHealth = Math.max(1, Math.floor(sheet.baseMaxHealth * statMultiplier));

  const maxHealth = resolveEnemySpawnMaxHealth(
    deriveCombatMaxHealth({
      baseMaxHealth,
      level: sheet.level,
      attributes: sheet.attributes,
      ...combatantStatGrowth(getEnemyCombatIdentity(slot.enemyType)),
    }),
  );

  const applyGoldBudget = context.applyPhaseGoldBudget !== false;
  const applyRewardOverrides = context.applyPhaseRewardOverrides !== false;
  const phaseGoldScale = applyGoldBudget
    ? phaseGoldScaleForPhase(context.phaseId, {
        ignoreLabOverride: !applyRewardOverrides,
      })
    : 1;
  const goldReward = Math.floor(
    8 *
      (1 + (level - 1) * 0.12) *
      roleScale *
      context.goldMultiplier *
      (context.milestoneGoldScale ?? 1) *
      phaseGoldScale,
  );
  // XP vem só do orçamento da fase na vitória (`grantPhaseVictoryXp`), não por kill.
  const xpReward = 0;

  const rosterEntry = getEnemyRosterEntry(slot.enemyType);
  const baseName = rosterEntry?.name ?? slot.enemyType;
  const prefix = slot.role === 'boss' ? 'Boss ' : slot.role === 'elite' ? 'Elite ' : '';
  const suffix = slot.count > 1 ? ` ${context.slotIndex + 1}` : '';
  const defaultName = `${prefix}${baseName} Lv.${level}${suffix}`;
  const name = slot.displayName
    ? slot.count > 1
      ? `${slot.displayName} ${context.slotIndex + 1}`
      : slot.displayName
    : defaultName;

  return Enemy.restore({
    id: `${context.phaseId}-w${context.waveIndex}-s${context.slotIndex}`,
    name,
    enemyType: slot.enemyType,
    stage: context.difficultyTier,
    level: sheet.level,
    attributes: sheet.attributes,
    baseAttack,
    baseDefense,
    baseMaxHealth,
    skillRanks: sheet.skillRanks,
    passiveIds: sheet.passiveIds,
    physicalMeleeAspd: sheet.physicalMeleeAspd,
    stats: Stats.fromBase(baseAttack, baseDefense, maxHealth),
    goldReward,
    xpReward,
    role: slot.role,
  });
}
