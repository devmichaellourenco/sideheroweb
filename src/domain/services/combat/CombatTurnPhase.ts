import { parsePhaseId, mapIdFromIndex } from '../../campaign/CampaignIds';
import { GameState } from '../../entities/GameState';
import { CombatState } from '../../entities/CombatState';
import { Hero } from '../../entities/Hero';
import { Enemy } from '../../entities/Enemy';
import { Stats } from '../../value-objects/Stats';
import { PhaseRun } from '../../campaign/PhaseRun';
import { PhaseCombatHandlers } from '../../campaign/PhaseCombatHandlers';
import { EnemyKillRewardService } from '../../campaign/EnemyKillRewardService';
import { CombatProfileProvider } from '../../combat/CombatProfileProvider';
import { getHeroCombatIdentity } from '../../combat/HeroCombatIdentityCatalog';
import { getEnemyCombatIdentity } from '../../enemies/EnemyCombatIdentityCatalog';
import { elementalDamageProfileFromHeroEquipment } from '../../combat/ElementalDamageProfileAggregator';
import { elementalDamageFlatFromHeroEquipment } from '../../combat/ElementalDamageFlatProfileAggregator';
import { elementalPenetrationFromHeroEquipment } from '../../combat/ElementalPenetrationProfileAggregator';
import { physicalDamagePercentFromHeroEquipment } from '../../combat/GearStatAggregator';
import {
  COMBAT_DELTA_SECONDS,
  MAX_ACTIONS_PER_TICK,
} from '../../combat/CombatTimingConstants';
import { listEnemyCombatSkills } from '../../progression/combat/EnemyCombatSkillCatalog';
import { listHeroCombatSkills } from '../../progression/combat/HeroCombatSkillCatalog';
import { BASIC_ATTACK_SKILL_ID } from '../../progression/combat/BasicAttackSkill';
import { ActionTimerService } from './ActionTimerService';
import { CombatActionExecutor } from './CombatActionExecutor';
import { formatCombatDotNarrative } from './CombatLogNarrative';
import { CombatFloatingEvent, createDamageEvent, createLevelUpEvent } from './CombatFloatingEvent';
import { CombatSkillVfxEvent, createSkillVfxEvent } from './CombatSkillVfxEvent';
import { dominantDamageElement } from '../../combat/DamageComponent';
import {
  accumulateBattleStatsStrikes,
  BattleStatsStrike,
} from '../../combat/BattleSessionStats';
import { CombatSkillSelector } from './CombatSkillSelector';
import { SkillCooldownTracker, combatantKey } from './SkillCooldownTracker';
import { CombatStatusEffectTracker } from './CombatStatusEffectTracker';
import { trySolerPlegiusCleanse } from '../../unique-effects/UniqueBattleEffectResolver';
import {
  applyMitigatedDotTicks,
  buildDotMitigationTargetForEnemy,
  buildDotMitigationTargetForHero,
} from './DotTickResolver';
import { CombatantRef } from './TurnOrderService';

function resolveCombatMapId(state: GameState): string {
  const phaseId =
    state.phaseRun?.phaseId ?? state.campaignProgress.selectedPhaseId ?? state.combat?.encounterMeta?.phaseId;
  if (!phaseId) return 'stendra';
  return mapIdFromIndex(parsePhaseId(phaseId).mapIndex);
}
export interface CombatTurnPhaseResult {
  state: GameState;
  events: string[];
  floatingEvents: CombatFloatingEvent[];
  skillVfxEvents: CombatSkillVfxEvent[];
}

export class CombatTurnPhase {
  constructor(
    private readonly skillSelector = new CombatSkillSelector(),
    private readonly actionExecutor = new CombatActionExecutor(),
    private readonly actionTimers = new ActionTimerService(),
    private readonly profiles = new CombatProfileProvider(),
    private readonly phaseHandlers = new PhaseCombatHandlers(),
    private readonly killRewards = new EnemyKillRewardService(),
  ) {}

  execute(state: GameState): CombatTurnPhaseResult {
    let workingState = state;

    if (workingState.loadoutEditOpen && workingState.phaseRestartOnResume) {
      return { state: workingState.touchTick(), events: [], floatingEvents: [], skillVfxEvents: [] };
    }

    if (workingState.battlePaused) {
      return { state: workingState.touchTick(), events: [], floatingEvents: [], skillVfxEvents: [] };
    }

    if (workingState.combatIntermission) {
      return { state: workingState.touchTick(), events: [], floatingEvents: [], skillVfxEvents: [] };
    }

    // Hub do acampamento: sem missão ativa não inicia combate (só via START_MISSION + restart).
    if (!workingState.phaseRun) {
      return { state: workingState.touchTick(), events: [], floatingEvents: [], skillVfxEvents: [] };
    }

    let combat = workingState.combat;
    if (!combat || combat.livingEnemies().length === 0) {
      const started = this.phaseHandlers.startPhaseRun(workingState, workingState.phaseRun);
      return this.finish(started.state, started.events, []);
    }

    const events: string[] = [];
    const floatingEvents: CombatFloatingEvent[] = [];
    const skillVfxEvents: CombatSkillVfxEvent[] = [];

    let cooldowns = SkillCooldownTracker.fromMap(combat.skillCooldowns);
    cooldowns = cooldowns.advanceTime(COMBAT_DELTA_SECONDS);

    combat = combat
      .withActionTimers(this.actionTimers.advanceAll(combat.actionTimers, COMBAT_DELTA_SECONDS))
      .withCombatTime(combat.combatTime + COMBAT_DELTA_SECONDS)
      .withSkillCooldowns(cooldowns.toMap())
      .withPendingSkillActions([]);

    let actionsResolved = 0;
    const actedThisTick = new Set<string>();

    while (actionsResolved < MAX_ACTIONS_PER_TICK) {
      const heroes = workingState.activeHeroes();
      const livingHeroes = heroes.filter((hero) => hero.isAlive());
      const livingEnemies = combat.livingEnemies();
      const phaseRun = workingState.phaseRun;
      const encounterMeta = combat.encounterMeta;

      const outcome = this.tryResolveCombatOutcome(
        workingState,
        combat,
        livingHeroes,
        livingEnemies,
        phaseRun,
        encounterMeta,
        events,
        floatingEvents,
      );
      if (outcome) {
        return outcome;
      }

      const readyActors = this.actionTimers
        .listReadyActors(combat.actionTimers, heroes, combat.enemies)
        .filter((actor) => !actedThisTick.has(combatantKey(actor.side, actor.id)));

      if (readyActors.length === 0) {
        break;
      }

      const actor = readyActors[0];
      const strike = this.executeSkillStrike(workingState, combat, actor);
      workingState = strike.state;
      combat = strike.combat;
      events.push(...strike.events);
      floatingEvents.push(...strike.floatingEvents);
      skillVfxEvents.push(...strike.skillVfxEvents);

      if (strike.statsStrike) {
        workingState = workingState.withBattleSessionStats(
          accumulateBattleStatsStrikes(workingState.battleSessionStats, [strike.statsStrike]),
        );
      }

      if (strike.usedSkillId === null) {
        break;
      }

      actedThisTick.add(combatantKey(actor.side, actor.id));
      actionsResolved += 1;
    }

    combat = combat.withActionTimers(
      this.actionTimers.removeDead(combat.actionTimers, workingState.activeHeroes(), combat.enemies),
    );

    let loggedState = workingState;
    for (const event of events) {
      if (event.trim()) {
        loggedState = loggedState.addLog(event);
      }
    }

    return this.finish(
      loggedState.withCombat(combat).touchTick(),
      events,
      floatingEvents,
      skillVfxEvents,
    );
  }

  private finish(
    state: GameState,
    events: string[],
    floatingEvents: CombatFloatingEvent[],
    skillVfxEvents: CombatSkillVfxEvent[] = [],
  ): CombatTurnPhaseResult {
    return { state, events, floatingEvents, skillVfxEvents };
  }

  private tryResolveCombatOutcome(
    state: GameState,
    combat: CombatState,
    livingHeroes: Hero[],
    livingEnemies: Enemy[],
    phaseRun: PhaseRun | null,
    encounterMeta: CombatState['encounterMeta'],
    events: string[],
    floatingEvents: CombatFloatingEvent[],
  ): CombatTurnPhaseResult | null {
    if (livingHeroes.length === 0 && phaseRun) {
      const wiped = this.phaseHandlers.onPhaseWipe(state.withCombat(combat), phaseRun);
      return this.finish(wiped.state, [...events, ...wiped.events], floatingEvents);
    }

    if (livingEnemies.length === 0 && phaseRun && encounterMeta) {
      if (encounterMeta.isBossWave) {
        const victory = this.phaseHandlers.onBossDefeated(
          state,
          combat.enemies,
          state.activeHeroes(),
          encounterMeta,
        );
        return this.finish(victory.state, [...events, ...victory.events], floatingEvents);
      }

      const waveCleared = this.phaseHandlers.onWaveCleared(
        state,
        combat.enemies,
        state.activeHeroes(),
        encounterMeta,
        phaseRun,
      );
      return this.finish(waveCleared.state, [...events, ...waveCleared.events], floatingEvents);
    }

    return null;
  }

  private executeSkillStrike(
    state: GameState,
    combat: CombatState,
    actor: CombatantRef,
  ): {
    state: GameState;
    combat: CombatState;
    events: string[];
    floatingEvents: CombatFloatingEvent[];
    skillVfxEvents: CombatSkillVfxEvent[];
    usedSkillId: string | null;
    statsStrike: BattleStatsStrike | null;
  } {
    const enemiesBeforeStrike = combat.enemies;
    let heroes = state.activeHeroes();
    let enemies = combat.enemies;
    const events: string[] = [];
    const floatingEvents: CombatFloatingEvent[] = [];
    const skillVfxEvents: CombatSkillVfxEvent[] = [];
    let cooldowns = SkillCooldownTracker.fromMap(combat.skillCooldowns);
    let statusEffects = CombatStatusEffectTracker.fromMap(combat.statusEffects);
    const actorKey = combatantKey(actor.side, actor.id);
    let usedSkillId: string | null = null;
    let skillList = [] as ReturnType<typeof listHeroCombatSkills>;
    let statusApplications: ReturnType<typeof this.actionExecutor.execute>['statusApplications'] = [];
    let mitigatedDamage = 0;
    let primaryDamageElement: ReturnType<typeof dominantDamageElement> | undefined;
    const stageLevel = state.difficultyTier;
    const mapId = resolveCombatMapId(state);
    let attackerProfile = this.profiles.forHero(heroes[0]);

    if (actor.side === 'hero') {
      const hero = heroes.find((entry) => entry.id === actor.id);
      if (!hero?.isAlive()) {
        return { state, combat, events, floatingEvents, skillVfxEvents, usedSkillId: null, statsStrike: null };
      }

      attackerProfile = this.profiles.forHero(hero);
      skillList = listHeroCombatSkills(hero);
      const selected = this.skillSelector.selectHeroAction(
        hero,
        heroes,
        enemies,
        cooldowns,
        statusEffects,
      );

      if (!selected) {
        return this.scheduleIdleRecovery(state, combat, actor, attackerProfile);
      }

      usedSkillId = selected.skillId;
      primaryDamageElement = dominantDamageElement(selected.action.damageComponents);
      const heroVfx = createSkillVfxEvent(usedSkillId, 'hero', actor.id, selected.action);
      if (heroVfx) skillVfxEvents.push(heroVfx);
      const result = this.actionExecutor.execute(
        selected.action,
        hero.name,
        heroes,
        enemies,
        statusEffects,
        {
          attackerProfile,
          stageLevel,
          mapId,
          attackerElementalBonus: elementalDamageProfileFromHeroEquipment(hero.toProps().equipment),
          attackerElementalFlat: elementalDamageFlatFromHeroEquipment(hero.toProps().equipment),
          attackerPhysicalDamagePercent: physicalDamagePercentFromHeroEquipment(hero.toProps().equipment),
          attackerElementalPenetration: elementalPenetrationFromHeroEquipment(hero.toProps().equipment),
          attackerEquipment: hero.toProps().equipment,
        },
      );
      heroes = result.heroes;
      enemies = result.enemies;
      statusApplications = result.statusApplications;
      mitigatedDamage = result.mitigatedDamage;
      if (result.event) events.push(result.event);
      floatingEvents.push(...result.floatingEvents);
    } else {
      const enemy = enemies.find((entry) => entry.id === actor.id);
      if (!enemy?.isAlive()) {
        return { state, combat, events, floatingEvents, skillVfxEvents, usedSkillId: null, statsStrike: null };
      }

      attackerProfile = this.profiles.forEnemy(enemy, combat.encounterMeta?.isBossWave);
      skillList = listEnemyCombatSkills(enemy);
      const selected = this.skillSelector.selectEnemyAction(enemy, heroes, enemies, cooldowns);

      if (!selected) {
        return this.scheduleIdleRecovery(state, combat, actor, attackerProfile);
      }

      usedSkillId = selected.skillId;
      primaryDamageElement = dominantDamageElement(selected.action.damageComponents);
      const enemyVfx = createSkillVfxEvent(usedSkillId, 'enemy', actor.id, selected.action);
      if (enemyVfx) skillVfxEvents.push(enemyVfx);
      const result = this.actionExecutor.execute(
        selected.action,
        enemy.name,
        heroes,
        enemies,
        statusEffects,
        { attackerProfile, stageLevel, mapId },
      );
      heroes = result.heroes;
      enemies = result.enemies;
      statusApplications = result.statusApplications;
      mitigatedDamage = result.mitigatedDamage;
      if (result.event) events.push(result.event);
      floatingEvents.push(...result.floatingEvents);
    }

    let workingCombat = combat;
    for (const application of statusApplications) {
      const cleanse = trySolerPlegiusCleanse(application, heroes, workingCombat, statusEffects);
      if (cleanse.intercepted) {
        statusEffects = cleanse.tracker;
        workingCombat = cleanse.combat;
        if (cleanse.event) events.push(cleanse.event);
        continue;
      }

      statusEffects = statusEffects.apply({
        combatantKey: application.combatantKey,
        skillId: application.skillId,
        kind: application.kind,
        magnitude: application.magnitude,
        durationTurns: application.durationTurns,
        dotElement: application.dotElement,
      });
    }
    combat = workingCombat;

    const dotEntries = statusEffects.listDotTicks(actorKey);
    if (dotEntries.length > 0) {
      if (actor.side === 'hero') {
        const hero = heroes.find((entry) => entry.id === actor.id);
        if (hero?.isAlive()) {
          const beforeHealth = hero.currentHealth;
          const dotBatch = applyMitigatedDotTicks(
            dotEntries,
            buildDotMitigationTargetForHero(hero, actorKey, statusEffects, stageLevel),
            stageLevel,
          );
          if (dotBatch.totalDamage > 0 || dotBatch.dodgedAny) {
            heroes = heroes.map((entry) =>
              entry.id === actor.id
                ? Hero.restore({
                    ...entry.toProps(),
                    currentHealth: Math.max(0, entry.currentHealth - dotBatch.totalDamage),
                  })
                : entry,
            );
            const after = heroes.find((entry) => entry.id === actor.id)!;
            if (dotBatch.totalDamage > 0) {
              const damageEvent = createDamageEvent(
                'hero',
                actor.id,
                beforeHealth,
                after.currentHealth,
                false,
                dotBatch.primaryElement,
              );
              if (damageEvent) floatingEvents.push(damageEvent);
            }
            const mitigationTag =
              dotBatch.dodgedAny && dotBatch.totalDamage === 0
                ? ' (esquivou)'
                : dotBatch.blockedAny
                  ? ' (bloqueio parcial)'
                  : '';
            events.push(
              formatCombatDotNarrative(hero.name, dotBatch.totalDamage, mitigationTag),
            );
          }
        }
      } else {
        const enemy = enemies.find((entry) => entry.id === actor.id);
        if (enemy?.isAlive()) {
          const beforeHealth = enemy.stats.currentHealth;
          const dotBatch = applyMitigatedDotTicks(
            dotEntries,
            buildDotMitigationTargetForEnemy(enemy, actorKey, statusEffects, mapId),
            stageLevel,
          );
          if (dotBatch.totalDamage > 0 || dotBatch.dodgedAny) {
            const updated = Enemy.restore({
              ...enemy.toProps(),
              stats: Stats.create({
                ...enemy.stats.toProps(),
                currentHealth: Math.max(0, enemy.stats.currentHealth - dotBatch.totalDamage),
              }),
            });
            enemies = enemies.map((entry) => (entry.id === actor.id ? updated : entry));
            if (dotBatch.totalDamage > 0) {
              const damageEvent = createDamageEvent(
                'enemy',
                actor.id,
                beforeHealth,
                updated.stats.currentHealth,
                false,
                dotBatch.primaryElement,
              );
              if (damageEvent) floatingEvents.push(damageEvent);
            }
            const mitigationTag =
              dotBatch.dodgedAny && dotBatch.totalDamage === 0
                ? ' (esquivou)'
                : dotBatch.blockedAny
                  ? ' (bloqueio parcial)'
                  : '';
            events.push(
              formatCombatDotNarrative(enemy.name, dotBatch.totalDamage, mitigationTag),
            );
          }
        }
      }
    }

    statusEffects = statusEffects.tickOnTurnEnd(actorKey);

    const castSpeed = attackerProfile.castSpeed;
    const cooldownReduction = attackerProfile.cooldownReduction;
    const skillRank =
      usedSkillId == null
        ? 1
        : actor.side === 'hero'
          ? (heroes.find((entry) => entry.id === actor.id)?.toProps().skillRanks[usedSkillId] ?? 1)
          : (enemies.find((entry) => entry.id === actor.id)?.skillRanks[usedSkillId] ?? 1);
    const turnSeconds =
      actor.side === 'hero'
        ? getHeroCombatIdentity(
            heroes.find((entry) => entry.id === actor.id)?.heroClass ?? 'sorcerer',
          ).skillCooldownTurnSeconds
        : getEnemyCombatIdentity(
            enemies.find((entry) => entry.id === actor.id)?.enemyType ?? 'giant_rat',
          ).skillCooldownTurnSeconds;
    const usedCombatSkill = usedSkillId
      ? skillList.find((skill) => skill.skillId === usedSkillId)
      : undefined;
    const updatedCooldowns = cooldowns
      .onSkillUsed(actorKey, usedSkillId, skillList, cooldownReduction, {
        rank: skillRank,
        turnSeconds,
      })
      .toMap();

    const skillRecoverySeconds =
      usedSkillId !== null && usedSkillId !== BASIC_ATTACK_SKILL_ID
        ? (usedCombatSkill?.actionRecoverySeconds ?? 0)
        : null;
    const updatedTimers = this.actionTimers.scheduleAfterAction(
      combat.actionTimers,
      actor,
      attackerProfile.attackSpeed,
      castSpeed,
      skillRecoverySeconds,
    );

    let nextState = state.withHeroes(heroes);
    let nextCombat = combat
      .withEnemies(enemies)
      .withSkillCooldowns(updatedCooldowns)
      .withStatusEffects(statusEffects.toMap())
      .withActionTimers(updatedTimers);

    const killBatch = this.killRewards.applyKillRewards(
      nextState,
      nextCombat,
      enemiesBeforeStrike,
      enemies,
    );
    nextState = killBatch.state;
    nextCombat = killBatch.combat;
    events.push(...killBatch.events);

    for (const heroId of killBatch.levelUpHeroIds) {
      const leveled = nextState.activeHeroes().find((hero) => hero.id === heroId);
      if (leveled) {
        floatingEvents.push(createLevelUpEvent(heroId, leveled.level));
      }
    }

    const statsStrike: BattleStatsStrike | null =
      usedSkillId || floatingEvents.length > 0 || mitigatedDamage > 0
        ? {
            actorSide: actor.side,
            actorId: actor.id,
            skillId: usedSkillId,
            isBasicAttack: usedSkillId === BASIC_ATTACK_SKILL_ID,
            events: [...floatingEvents],
            mitigatedDamage,
            primaryDamageElement,
          }
        : null;

    return {
      state: nextState,
      combat: nextCombat,
      events,
      floatingEvents,
      skillVfxEvents,
      usedSkillId,
      statsStrike,
    };
  }

  private scheduleIdleRecovery(
    state: GameState,
    combat: CombatState,
    actor: CombatantRef,
    profile: ReturnType<CombatProfileProvider['forHero']>,
  ): {
    state: GameState;
    combat: CombatState;
    events: string[];
    floatingEvents: CombatFloatingEvent[];
    skillVfxEvents: CombatSkillVfxEvent[];
    usedSkillId: string | null;
    statsStrike: BattleStatsStrike | null;
  } {
    const updatedTimers = this.actionTimers.scheduleAfterAction(
      combat.actionTimers,
      actor,
      profile.attackSpeed,
      profile.castSpeed,
      null,
    );

    return {
      state,
      combat: combat.withActionTimers(updatedTimers),
      events: [],
      floatingEvents: [],
      skillVfxEvents: [],
      usedSkillId: null,
      statsStrike: null,
    };
  }
}
