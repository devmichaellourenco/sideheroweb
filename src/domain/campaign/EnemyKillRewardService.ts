import { Chest } from '../entities/Chest';
import { ChestType } from '../combat/ChestType';
import { CombatState } from '../entities/CombatState';
import { Enemy } from '../entities/Enemy';
import { GameState } from '../entities/GameState';
import { MetaBonusScope } from '../meta/MetaBonusScope';
import { LootService } from '../services/LootService';
import { ILootService } from '../services/ILootService';
import { resolvePhase } from './CampaignCatalog';
import { parsePhaseId } from './CampaignIds';
import { EncounterMeta } from './EncounterResolver';
import { LootDropResult, rollEnemyLoot } from './EnemyLootTable';
import { isNamedChapterBossKill, tryCreateUniqueBossGearDrop } from './UniqueGearLootService';
import { grantsPhaseChests, scalePhaseGold } from './PhaseLootPolicy';

export interface KillRewardBatchResult {
  state: GameState;
  combat: CombatState;
  events: string[];
  /** Sempre vazio: XP só na vitória da fase (`grantPhaseVictoryXp`). */
  levelUpHeroIds: string[];
}

export class EnemyKillRewardService {
  constructor(private readonly lootService: ILootService = new LootService()) {}

  applyKillRewards(
    state: GameState,
    combat: CombatState,
    beforeEnemies: Enemy[],
    afterEnemies: Enemy[],
  ): KillRewardBatchResult {
    const meta = combat.encounterMeta;
    if (!meta) {
      return { state, combat, events: [], levelUpHeroIds: [] };
    }

    const newlyDefeated = this.findNewlyDefeated(beforeEnemies, afterEnemies, combat);
    let nextState = state;
    let nextCombat = combat;
    const events: string[] = [];

    for (const enemy of newlyDefeated) {
      const result = this.applySingleKill(nextState, nextCombat, enemy, meta);
      nextState = result.state;
      nextCombat = result.combat;
      events.push(...result.events);
    }

    return { state: nextState, combat: nextCombat, events, levelUpHeroIds: [] };
  }

  private findNewlyDefeated(
    beforeEnemies: Enemy[],
    afterEnemies: Enemy[],
    combat: CombatState,
  ): Enemy[] {
    const afterById = new Map(afterEnemies.map((enemy) => [enemy.id, enemy]));

    return beforeEnemies.filter((before) => {
      if (!before.isAlive()) {
        return false;
      }
      if (combat.hasRewardedEnemy(before.id)) {
        return false;
      }
      const after = afterById.get(before.id);
      return after !== undefined && !after.isAlive();
    });
  }

  private applySingleKill(
    state: GameState,
    combat: CombatState,
    enemy: Enemy,
    meta: EncounterMeta,
  ): KillRewardBatchResult {
    const phaseId = meta.phaseId;
    const phase = resolvePhase(phaseId);
    const { mapIndex } = parsePhaseId(phaseId);
    const legacyBonuses = MetaBonusScope.get();
    const isPhaseBoss = isNamedChapterBossKill({
      phaseId,
      mapIndex,
      enemyType: enemy.enemyType,
      role: enemy.role,
      isPhaseBoss: meta.isBossWave,
    });
    const firstClearBoss = isPhaseBoss && grantsPhaseChests(state.campaignProgress, phaseId);

    const gold = Math.floor(
      scalePhaseGold(enemy.goldReward, state.campaignProgress, phaseId) *
        legacyBonuses.goldMultiplier,
    );

    let nextState = state;
    const rewardParts: string[] = [];

    if (gold > 0) {
      nextState = nextState.withGold(nextState.gold.add(gold));
      rewardParts.push(`+${gold} ouro`);
    }

    const lootDrop = rollEnemyLoot({
      mapIndex,
      enemyType: enemy.enemyType,
      role: enemy.role,
      isPhaseBoss: meta.isBossWave && enemy.role === 'boss',
      firstClearBoss,
      seasonFinale: phase?.seasonFinale ?? false,
    });

    if (lootDrop) {
      const lootApplied = this.applyLootDrop(
        nextState,
        lootDrop,
        phase?.difficultyTier ?? enemy.stage,
        enemy.role === 'boss' ? 'boss' : 'monster',
      );
      nextState = lootApplied.state;
      rewardParts.push(lootApplied.label);
    }

    const uniqueGear = tryCreateUniqueBossGearDrop(
      nextState,
      {
        phaseId,
        mapIndex,
        enemyType: enemy.enemyType,
        role: enemy.role,
        isPhaseBoss,
      },
      this.lootService,
    );
    if (uniqueGear) {
      const uniqueChest = Chest.createWithGuaranteedLoot(
        phase?.difficultyTier ?? enemy.stage,
        'act_boss',
        uniqueGear,
      );
      nextState = nextState.withChests([...nextState.chests, uniqueChest]);
      rewardParts.push('baú de chefe de ato');
    }

    const message =
      rewardParts.length > 0
        ? `O ${enemy.name} foi derrotado!\nRecompensas: ${rewardParts.join(', ')}`
        : `O ${enemy.name} foi derrotado!`;

    nextState = nextState.addLog(message);

    return {
      state: nextState,
      combat: combat.withRewardedEnemy(enemy.id),
      events: rewardParts,
      levelUpHeroIds: [],
    };
  }

  private applyLootDrop(
    state: GameState,
    drop: LootDropResult,
    difficultyTier: number,
    directGearChestType: ChestType,
  ): { state: GameState; label: string } {
    if (drop.kind === 'gear') {
      const chest = Chest.create(difficultyTier, directGearChestType);
      return {
        state: state.withChests([...state.chests, chest]),
        label: directGearChestType === 'boss' ? 'baú de boss' : 'baú',
      };
    }

    if (!drop.chestType) {
      return { state, label: 'baú' };
    }

    const chest = Chest.create(difficultyTier, drop.chestType);
    return {
      state: state.withChests([...state.chests, chest]),
      label: drop.chestType === 'act_boss' ? 'baú de ato' : 'baú',
    };
  }
}
