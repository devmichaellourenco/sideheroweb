import { Enemy, EnemyProps } from './Enemy';
import { Hero } from './Hero';
import { Stats } from '../value-objects/Stats';
import { ActionTimerMap, ActionTimerService } from '../services/combat/ActionTimerService';
import {
  SkillCooldownMap,
  SkillCooldownTracker,
} from '../services/combat/SkillCooldownTracker';
import { CombatantRef } from '../services/combat/TurnOrderService';
import { StatusEffectMap } from '../services/combat/CombatStatusEffect';
import { EncounterMeta } from '../campaign/EncounterResolver';
import { PendingSkillAction } from '../services/combat/PendingSkillAction';
import { UniqueEffectId } from '../unique-effects/UniqueEffectCatalog';

export interface CombatStateProps {
  enemies: EnemyProps[];
  actionTimers: ActionTimerMap;
  combatTime: number;
  skillCooldowns: SkillCooldownMap;
  statusEffects: StatusEffectMap;
  encounterMeta: EncounterMeta | null;
  pendingSkillActions?: PendingSkillAction[];
  rewardedEnemyIds?: string[];
  spentBattleUniqueEffects?: UniqueEffectId[];
  /** Legado — ignorado após migração temporal. */
  turnQueue?: CombatantRef[];
  turnIndex?: number;
  round?: number;
}

export class CombatState {
  readonly enemies: Enemy[];
  readonly actionTimers: ActionTimerMap;
  readonly combatTime: number;
  readonly skillCooldowns: SkillCooldownMap;
  readonly statusEffects: StatusEffectMap;
  readonly encounterMeta: EncounterMeta | null;
  readonly pendingSkillActions: PendingSkillAction[];
  readonly rewardedEnemyIds: string[];
  readonly spentBattleUniqueEffects: UniqueEffectId[];

  private constructor(props: CombatStateProps) {
    this.enemies = props.enemies.map((enemy) => Enemy.restore(enemy));
    this.actionTimers = { ...(props.actionTimers ?? {}) };
    this.combatTime = Math.max(0, props.combatTime ?? 0);
    this.skillCooldowns = props.skillCooldowns ?? {};
    this.statusEffects = props.statusEffects ?? {};
    this.encounterMeta = props.encounterMeta ?? null;
    this.pendingSkillActions = [...(props.pendingSkillActions ?? [])];
    this.rewardedEnemyIds = [...(props.rewardedEnemyIds ?? [])];
    this.spentBattleUniqueEffects = [...(props.spentBattleUniqueEffects ?? [])];
  }

  static restore(props: CombatStateProps): CombatState {
    return new CombatState({
      ...props,
      actionTimers: props.actionTimers ?? {},
      combatTime: props.combatTime ?? 0,
      skillCooldowns: props.skillCooldowns ?? {},
      statusEffects: props.statusEffects ?? {},
      encounterMeta: props.encounterMeta ?? null,
    });
  }

  static start(
    heroes: Hero[],
    enemies: Enemy[],
    actionTimers = new ActionTimerService(),
    encounterMeta: EncounterMeta | null = null,
  ): CombatState {
    return new CombatState({
      enemies: enemies.map((enemy) => enemy.toProps()),
      actionTimers: actionTimers.createInitial(heroes, enemies),
      combatTime: 0,
      skillCooldowns: SkillCooldownTracker.createInitial(heroes, enemies),
      statusEffects: {},
      encounterMeta,
      pendingSkillActions: [],
      rewardedEnemyIds: [],
      spentBattleUniqueEffects: [],
    });
  }

  static fromLegacyEnemy(
    enemy: Enemy,
    heroes: Hero[],
    actionTimers = new ActionTimerService(),
  ): CombatState {
    return CombatState.start(heroes, [enemy], actionTimers);
  }

  /** Combatente pronto para agir (timer ≤ 0), ou null se todos aguardam. */
  peekNextActor(heroes: Hero[], enemies: Enemy[]): CombatantRef | null {
    const service = new ActionTimerService();
    return service.peekNextActor(this.actionTimers, heroes, enemies);
  }

  get round(): number {
    return Math.floor(this.combatTime / 8) + 1;
  }

  findEnemy(enemyId: string): Enemy | undefined {
    return this.enemies.find((enemy) => enemy.id === enemyId);
  }

  livingEnemies(): Enemy[] {
    return this.enemies.filter((enemy) => enemy.isAlive());
  }

  hasRewardedEnemy(enemyId: string): boolean {
    return this.rewardedEnemyIds.includes(enemyId);
  }

  withRewardedEnemy(enemyId: string): CombatState {
    if (this.hasRewardedEnemy(enemyId)) {
      return this;
    }
    return this.clone({ rewardedEnemyIds: [...this.rewardedEnemyIds, enemyId] });
  }

  /** Congela o campo com todos os inimigos derrotados (overlay de vitória). */
  withAllEnemiesDefeated(): CombatState {
    return this.withEnemies(
      this.enemies.map((enemy) =>
        Enemy.restore({
          ...enemy.toProps(),
          stats: Stats.create({
            ...enemy.stats.toProps(),
            currentHealth: 0,
          }),
        }),
      ),
    );
  }

  withEnemies(enemies: Enemy[]): CombatState {
    return this.clone({ enemies: enemies.map((enemy) => enemy.toProps()) });
  }

  withActionTimers(actionTimers: ActionTimerMap): CombatState {
    return this.clone({ actionTimers });
  }

  withCombatTime(combatTime: number): CombatState {
    return this.clone({ combatTime });
  }

  withSkillCooldowns(skillCooldowns: SkillCooldownMap): CombatState {
    return this.clone({ skillCooldowns });
  }

  withStatusEffects(statusEffects: StatusEffectMap): CombatState {
    return this.clone({ statusEffects });
  }

  hasSpentBattleUniqueEffect(effectId: UniqueEffectId): boolean {
    return this.spentBattleUniqueEffects.includes(effectId);
  }

  withSpentBattleUniqueEffect(effectId: UniqueEffectId): CombatState {
    if (this.hasSpentBattleUniqueEffect(effectId)) {
      return this;
    }
    return this.clone({
      spentBattleUniqueEffects: [...this.spentBattleUniqueEffects, effectId],
    });
  }

  withPendingSkillActions(pendingSkillActions: PendingSkillAction[]): CombatState {
    return this.clone({ pendingSkillActions: [...pendingSkillActions] });
  }

  toProps(): CombatStateProps {
    return {
      enemies: this.enemies.map((enemy) => enemy.toProps()),
      actionTimers: structuredClone(this.actionTimers),
      combatTime: this.combatTime,
      skillCooldowns: structuredClone(this.skillCooldowns),
      statusEffects: structuredClone(this.statusEffects),
      encounterMeta: this.encounterMeta ? { ...this.encounterMeta } : null,
      pendingSkillActions: [...this.pendingSkillActions],
      rewardedEnemyIds: [...this.rewardedEnemyIds],
      spentBattleUniqueEffects: [...this.spentBattleUniqueEffects],
    };
  }

  private clone(partial: Partial<CombatStateProps>): CombatState {
    return new CombatState({ ...this.toProps(), ...partial });
  }
}
