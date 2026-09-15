import { dominantDamageElement, normalizeDamageComponents } from '../../combat/DamageComponent';
import { rollCriticalHit } from '../../combat/CriticalHitRoll';
import { DefensiveMitigation, ZERO_DEFENSIVE } from '../../combat/DefensiveMitigation';
import { defensiveMitigationForEnemy, defensiveMitigationForHero } from '../../combat/HeroDefensiveStatsProvider';
import { resistanceProfileFromHeroEquipment } from '../../combat/ResistanceProfileAggregator';
import { ResistanceProfile } from '../../combat/ResistanceProfile';
import { resolveEnemyInnateResists } from '../../enemies/EnemyInnateResists';
import { Hero } from '../../entities/Hero';
import { Enemy } from '../../entities/Enemy';
import { isStatusCombatKind } from '../../progression/combat/SkillCombatKind';
import { CombatAction } from './CombatAction';
import {
  CombatFloatingEvent,
  createDamageEvent,
  createHealEvent,
  createStatusImpactEvent,
} from './CombatFloatingEvent';
import { Stats } from '../../value-objects/Stats';
import { CombatActionContext } from './CombatActionContext';
import {
  buildMitigationTarget,
  ResolvedDamage,
  resolveEffectiveTargetDefense,
  resolveOutgoingDamage,
} from './CombatDamageResolver';
import { CombatStatusEffectTracker } from './CombatStatusEffectTracker';
import { StatusApplication } from './CombatStatusEffect';
import { combatantKey } from './SkillCooldownTracker';
import { resolveUniqueOnHitEnemyEffects } from '../../unique-effects/UniqueEffectOnHitResolver';
import {
  elementsFromAction,
  formatCombatHitNarrative,
  formatCombatStatusNarrative,
  resolveTargetLabel,
} from './CombatLogNarrative';

export interface CombatExecutionResult {
  heroes: Hero[];
  enemies: Enemy[];
  event: string | null;
  floatingEvents: CombatFloatingEvent[];
  statusApplications: StatusApplication[];
  /** Dano mitigado em heróis neste golpe. */
  mitigatedDamage: number;
}

export class CombatActionExecutor {
  execute(
    action: CombatAction,
    actorName: string,
    heroes: Hero[],
    enemies: Enemy[],
    statusEffects: CombatStatusEffectTracker = CombatStatusEffectTracker.fromMap({}),
    context?: CombatActionContext,
  ): CombatExecutionResult {
    if (action.power <= 0 && action.kind !== 'heal_ally' && !isStatusCombatKind(action.kind)) {
      return { heroes, enemies, event: null, floatingEvents: [], statusApplications: [], mitigatedDamage: 0 };
    }

    if (isStatusCombatKind(action.kind)) {
      return this.applyStatusEffect(action, actorName, heroes, enemies, context);
    }

    if (action.kind === 'heal_ally') {
      if (action.targetEnemyId || (action.targetEnemyIds?.length ?? 0) > 0) {
        return this.applyEnemyHeal(action, actorName, heroes, enemies, statusEffects, context);
      }
      return this.applyHeal(action, actorName, heroes, enemies, context);
    }

    if (action.targeting === 'single_ally' || action.targeting === 'all_allies') {
      return this.applyHeroDamage(action, actorName, heroes, enemies, statusEffects, context);
    }

    return this.applyEnemyDamage(action, actorName, heroes, enemies, statusEffects, context);
  }

  private applyStatusEffect(
    action: CombatAction,
    actorName: string,
    heroes: Hero[],
    enemies: Enemy[],
    context?: CombatActionContext,
  ): CombatExecutionResult {
    const targetKeys: Array<{ key: string; label: string }> = [];

    if (action.targeting === 'all_allies' || action.targeting === 'single_ally') {
      const targetIds =
        action.targeting === 'all_allies'
          ? (action.targetHeroIds ?? [])
          : action.targetHeroId
            ? [action.targetHeroId]
            : [];

      for (const heroId of targetIds) {
        const hero = heroes.find((entry) => entry.id === heroId);
        if (!hero?.isAlive()) continue;
        targetKeys.push({ key: combatantKey('hero', heroId), label: hero.name });
      }
    } else {
      const targetIds =
        action.targeting === 'all_enemies'
          ? (action.targetEnemyIds ?? [])
          : action.targetEnemyId
            ? [action.targetEnemyId]
            : [];

      for (const enemyId of targetIds) {
        const enemy = enemies.find((entry) => entry.id === enemyId);
        if (!enemy?.isAlive()) continue;
        targetKeys.push({ key: combatantKey('enemy', enemyId), label: enemy.name });
      }
    }

    if (targetKeys.length === 0) {
      return { heroes, enemies, event: null, floatingEvents: [], statusApplications: [], mitigatedDamage: 0 };
    }

    const duration = action.effectDurationTurns ?? 1;
    const impactKind = action.kind === 'buff_attack' ? 'buff' : 'debuff';
    const floatingEvents: CombatFloatingEvent[] = [];
    const canCrit = action.kind === 'buff_attack';

    const statusApplications: StatusApplication[] = targetKeys.map((target) => {
      const [, combatantId] = target.key.split(':');
      const side = target.key.startsWith('hero:') ? 'hero' : 'enemy';
      const { isCrit, multiplier } = canCrit
        ? this.rollAttackerCritical(context)
        : { isCrit: false, multiplier: 1 };
      const magnitude = Math.floor(action.power * multiplier);

      floatingEvents.push(
        createStatusImpactEvent(side, combatantId, impactKind, magnitude, isCrit),
      );

      return {
        combatantKey: target.key,
        skillId: action.skillId,
        kind: action.kind as StatusApplication['kind'],
        magnitude,
        durationTurns: duration,
        skillName: action.skillName,
      };
    });

    const sampleMagnitude = statusApplications[0]?.magnitude ?? action.power;
    const isCrit = floatingEvents.some((entry) => entry.kind === 'crit-buff');
    const statLabel =
      action.kind === 'buff_attack'
        ? `+${sampleMagnitude} ATK`
        : `-${sampleMagnitude} DEF`;
    const scope =
      targetKeys.length > 1
        ? `${targetKeys.length} alvos (${statLabel}, ${duration}t)`
        : `${targetKeys[0]?.label ?? 'o alvo'} (${statLabel}, ${duration}t)`;
    const event = formatCombatStatusNarrative(actorName, action.skillName, scope, isCrit);

    return { heroes, enemies, event, floatingEvents, statusApplications, mitigatedDamage: 0 };
  }

  private applyHeal(
    action: CombatAction,
    actorName: string,
    heroes: Hero[],
    enemies: Enemy[],
    context?: CombatActionContext,
  ): CombatExecutionResult {
    const targetIds =
      action.targeting === 'all_allies'
        ? (action.targetHeroIds ?? [])
        : action.targetHeroId
          ? [action.targetHeroId]
          : [];

    if (targetIds.length === 0) {
      return { heroes, enemies, event: null, floatingEvents: [], statusApplications: [], mitigatedDamage: 0 };
    }

    const floatingEvents: CombatFloatingEvent[] = [];
    let updatedHeroes = heroes;
    let critAny = false;

    for (const heroId of targetIds) {
      const target = updatedHeroes.find((hero) => hero.id === heroId);
      if (!target || !target.isAlive()) continue;

      const { isCrit, multiplier } = this.rollAttackerCritical(context);
      const healPower = Math.floor(action.power * multiplier);
      if (isCrit) critAny = true;

      const beforeHealth = target.currentHealth;
      updatedHeroes = updatedHeroes.map((hero) =>
        hero.id === heroId ? hero.heal(healPower) : hero,
      );
      const healed = updatedHeroes.find((hero) => hero.id === heroId)!;
      const healEvent = createHealEvent('hero', heroId, beforeHealth, healed.currentHealth, isCrit);
      if (healEvent) floatingEvents.push(healEvent);
    }

    const healedAmount = floatingEvents.reduce((sum, entry) => sum + entry.amount, 0);
    const isCrit = critAny;
    const targetNames = targetIds
      .map((heroId) => heroes.find((hero) => hero.id === heroId)?.name)
      .filter((name): name is string => Boolean(name));
    const targetLabel = resolveTargetLabel(
      targetNames,
      'todos os aliados',
      action.targeting === 'all_allies',
    );
    const event = formatCombatHitNarrative({
      actorName,
      targetLabel,
      skillName: action.skillName,
      kind: 'heal',
      amount: healedAmount,
      isCrit,
    });

    return {
      heroes: updatedHeroes,
      enemies,
      event,
      floatingEvents,
      statusApplications: [],
    };
  }

  private applyEnemyHeal(
    action: CombatAction,
    actorName: string,
    heroes: Hero[],
    enemies: Enemy[],
    statusEffects: CombatStatusEffectTracker,
    context?: CombatActionContext,
  ): CombatExecutionResult {
    const targetIds =
      action.targeting === 'all_enemies'
        ? (action.targetEnemyIds ?? [])
        : action.targetEnemyId
          ? [action.targetEnemyId]
          : [];

    if (targetIds.length === 0) {
      return { heroes, enemies, event: null, floatingEvents: [], statusApplications: [], mitigatedDamage: 0 };
    }

    const floatingEvents: CombatFloatingEvent[] = [];
    let updatedEnemies = enemies;
    let blockedAny = false;
    let critAny = false;

    for (const enemyId of targetIds) {
      const target = updatedEnemies.find((enemy) => enemy.id === enemyId);
      if (!target || !target.isAlive()) continue;

      const enemyKey = combatantKey('enemy', enemyId);
      if (statusEffects.isHealBlocked(enemyKey)) {
        blockedAny = true;
        continue;
      }

      const { isCrit, multiplier } = this.rollAttackerCritical(context);
      const healPower = Math.floor(action.power * multiplier);
      if (isCrit) critAny = true;

      const beforeHealth = target.stats.currentHealth;
      const healed = Enemy.restore({
        ...target.toProps(),
        stats: Stats.create({
          ...target.stats.toProps(),
          currentHealth: Math.min(target.stats.maxHealth, target.stats.currentHealth + healPower),
        }),
      });
      updatedEnemies = updatedEnemies.map((enemy) => (enemy.id === enemyId ? healed : enemy));
      const healEvent = createHealEvent('enemy', enemyId, beforeHealth, healed.stats.currentHealth, isCrit);
      if (healEvent) {
        floatingEvents.push(healEvent);
      }
    }

    const healedAmount = floatingEvents.reduce((sum, entry) => sum + entry.amount, 0);
    const targetNames = targetIds
      .map((enemyId) => enemies.find((enemy) => enemy.id === enemyId)?.name)
      .filter((name): name is string => Boolean(name));
    const targetLabel = resolveTargetLabel(
      targetNames,
      'todos os inimigos',
      action.targeting === 'all_enemies',
    );
    const event = formatCombatHitNarrative({
      actorName,
      targetLabel,
      skillName: action.skillName,
      kind: 'heal',
      amount: healedAmount,
      isCrit: critAny,
      blockedHeal: blockedAny && healedAmount <= 0,
    });

    return {
      heroes,
      enemies: updatedEnemies,
      event,
      floatingEvents,
      statusApplications: [],
    };
  }

  private applyHeroDamage(
    action: CombatAction,
    actorName: string,
    heroes: Hero[],
    enemies: Enemy[],
    statusEffects: CombatStatusEffectTracker,
    context?: CombatActionContext,
  ): CombatExecutionResult {
    const targetIds =
      action.targeting === 'all_allies'
        ? (action.targetHeroIds ?? [])
        : action.targetHeroId
          ? [action.targetHeroId]
          : [];

    if (targetIds.length === 0) {
      return { heroes, enemies, event: null, floatingEvents: [], statusApplications: [], mitigatedDamage: 0 };
    }

    const floatingEvents: CombatFloatingEvent[] = [];
    let updatedHeroes = heroes;
    const statusApplications: StatusApplication[] = [];
    let dodgedAny = false;
    let blockedAny = false;
    let mitigatedDamage = 0;

    for (const heroId of targetIds) {
      const target = updatedHeroes.find((hero) => hero.id === heroId);
      if (!target || !target.isAlive()) continue;

      const beforeHealth = target.currentHealth;
      const heroKey = combatantKey('hero', heroId);
      const effectiveDefense = resolveEffectiveTargetDefense(
        target.defense,
        heroKey,
        statusEffects,
      );
      const resolved = this.resolveDamageAmount(
        action.power,
        effectiveDefense,
        context,
        undefined,
        action.damageComponents,
        resistanceProfileFromHeroEquipment(target.toProps().equipment),
        defensiveMitigationForHero(target),
      );

      if (resolved.dodged) dodgedAny = true;
      if (resolved.blocked) blockedAny = true;
      mitigatedDamage += resolved.mitigated;

      if (!resolved.dodged) {
        updatedHeroes = updatedHeroes.map((hero) =>
          hero.id === heroId
            ? Hero.restore({
                ...hero.toProps(),
                currentHealth: Math.max(0, hero.currentHealth - resolved.amount),
              })
            : hero,
        );
        const damaged = updatedHeroes.find((hero) => hero.id === heroId)!;
        const damageEvent = createDamageEvent(
          'hero',
          heroId,
          beforeHealth,
          damaged.currentHealth,
          resolved.isCrit,
          dominantDamageElement(action.damageComponents),
        );
        if (damageEvent) floatingEvents.push(damageEvent);
      }

      statusApplications.push(
        ...this.collectOnHitDot(action, heroKey, resolved, context),
      );
    }

    const dealt = floatingEvents.reduce((sum, entry) => sum + entry.amount, 0);
    const isCrit = floatingEvents.some((entry) => entry.kind === 'crit');
    const mitigation = dodgedAny ? 'dodge' : blockedAny ? 'block' : null;
    const targetNames = targetIds
      .map((heroId) => heroes.find((hero) => hero.id === heroId)?.name)
      .filter((name): name is string => Boolean(name));
    const targetLabel = resolveTargetLabel(
      targetNames,
      'todos os heróis',
      action.targeting === 'all_allies',
    );
    const event = formatCombatHitNarrative({
      actorName,
      targetLabel,
      skillName: action.skillName,
      kind: 'damage',
      amount: dealt,
      isCrit,
      elements: elementsFromAction(action),
      mitigation,
    });

    return { heroes: updatedHeroes, enemies, event, floatingEvents, statusApplications, mitigatedDamage };
  }

  private applyEnemyDamage(
    action: CombatAction,
    actorName: string,
    heroes: Hero[],
    enemies: Enemy[],
    statusEffects: CombatStatusEffectTracker,
    context?: CombatActionContext,
  ): CombatExecutionResult {
    const targetIds =
      action.targeting === 'all_enemies'
        ? (action.targetEnemyIds ?? [])
        : action.targetEnemyId
          ? [action.targetEnemyId]
          : [];

    if (targetIds.length === 0) {
      return { heroes, enemies, event: null, floatingEvents: [], statusApplications: [], mitigatedDamage: 0 };
    }

    const floatingEvents: CombatFloatingEvent[] = [];
    let updatedEnemies = enemies;
    const statusApplications: StatusApplication[] = [];
    let dodgedAny = false;
    let blockedAny = false;

    for (const enemyId of targetIds) {
      const target = updatedEnemies.find((enemy) => enemy.id === enemyId);
      if (!target || !target.isAlive()) continue;

      const beforeHealth = target.stats.currentHealth;
      const enemyKey = combatantKey('enemy', enemyId);
      const effectiveDefense = resolveEffectiveTargetDefense(
        target.stats.defense,
        enemyKey,
        statusEffects,
      );
      const resolved = this.resolveDamageAmount(
        action.power,
        effectiveDefense,
        context,
        target.stage,
        action.damageComponents,
        resolveEnemyInnateResists(target.enemyType, target.stage, context?.mapId),
        defensiveMitigationForEnemy(target),
      );

      if (resolved.dodged) dodgedAny = true;
      if (resolved.blocked) blockedAny = true;

      if (!resolved.dodged) {
        const damaged = Enemy.restore({
          ...target.toProps(),
          stats: Stats.create({
            ...target.stats.toProps(),
            currentHealth: Math.max(0, target.stats.currentHealth - resolved.amount),
          }),
        });
        const damageEvent = createDamageEvent(
          'enemy',
          enemyId,
          beforeHealth,
          damaged.stats.currentHealth,
          resolved.isCrit,
          dominantDamageElement(action.damageComponents),
        );
        if (damageEvent) floatingEvents.push(damageEvent);
        updatedEnemies = updatedEnemies.map((enemy) => (enemy.id === enemyId ? damaged : enemy));
      }

      statusApplications.push(
        ...this.collectOnHitDot(action, enemyKey, resolved, context),
        ...resolveUniqueOnHitEnemyEffects({
          attackerEquipment: context?.attackerEquipment,
          targetEnemyKey: enemyKey,
          resolved,
        }),
      );
    }

    const dealt = floatingEvents.reduce((sum, entry) => sum + entry.amount, 0);
    const isCrit = floatingEvents.some((entry) => entry.kind === 'crit');
    const mitigation = dodgedAny ? 'dodge' : blockedAny ? 'block' : null;
    const targetNames = targetIds
      .map((enemyId) => enemies.find((enemy) => enemy.id === enemyId)?.name)
      .filter((name): name is string => Boolean(name));
    const targetLabel = resolveTargetLabel(
      targetNames,
      'todos os inimigos',
      action.targeting === 'all_enemies',
    );
    const event = formatCombatHitNarrative({
      actorName,
      targetLabel,
      skillName: action.skillName,
      kind: 'damage',
      amount: dealt,
      isCrit,
      elements: elementsFromAction(action),
      mitigation,
    });

    return { heroes, enemies: updatedEnemies, event, floatingEvents, statusApplications, mitigatedDamage: 0 };
  }

  private resolveDamageAmount(
    rawPower: number,
    targetDefense: number,
    context?: CombatActionContext,
    targetStageLevel?: number,
    damageComponents?: CombatAction['damageComponents'],
    targetResistances?: ResistanceProfile,
    defensive: DefensiveMitigation = ZERO_DEFENSIVE,
  ): ResolvedDamage {
    const stageLevel = targetStageLevel ?? context?.stageLevel ?? 1;
    const profile = context?.attackerProfile ?? {
      attackSpeed: 1,
      castSpeed: 1,
      cooldownReduction: 0,
      critChance: 0,
      critDamage: 1.4,
    };
    const components = normalizeDamageComponents(
      damageComponents ?? [{ element: 'physical', delivery: 'melee', weight: 1 }],
    );

    return resolveOutgoingDamage(
      rawPower,
      components,
      buildMitigationTarget(targetDefense, stageLevel, targetResistances, defensive),
      profile,
      {
        rng: context?.rng,
        attackerElementalBonus: context?.attackerElementalBonus,
        attackerElementalFlat: context?.attackerElementalFlat,
        attackerPhysicalDamagePercent: context?.attackerPhysicalDamagePercent,
        attackerElementalPenetration: context?.attackerElementalPenetration,
      },
    );
  }

  private rollAttackerCritical(context?: CombatActionContext): { isCrit: boolean; multiplier: number } {
    const profile = context?.attackerProfile;
    if (!profile || profile.critChance <= 0) {
      return { isCrit: false, multiplier: 1 };
    }

    return rollCriticalHit(profile.critChance, profile.critDamage, context?.rng);
  }

  private collectOnHitDot(
    action: CombatAction,
    targetKey: string,
    resolved: ResolvedDamage,
    context?: CombatActionContext,
  ): StatusApplication[] {
    if (!action.onHitDot || resolved.dodged || resolved.amount <= 0) {
      return [];
    }

    const chance = action.onHitDot.applyChance ?? 1;
    const rng = context?.rng ?? Math.random;
    if (rng() >= chance) {
      return [];
    }

    return [
      {
        combatantKey: targetKey,
        skillId: action.skillId,
        kind: 'dot',
        magnitude: action.onHitDot.damagePerTurn,
        durationTurns: action.onHitDot.durationTurns,
        skillName: action.skillName,
        dotElement: action.onHitDot.element,
      },
    ];
  }
}
