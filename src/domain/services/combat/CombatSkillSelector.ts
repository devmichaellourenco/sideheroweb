import { resolveCombatSkillName } from '../../progression/combat/CombatSkillNaming';
import {
  CombatSkillDefinition,
  toSkillTargeting,
} from '../../progression/combat/CombatSkillDefinition';
import { isStatusCombatKind } from '../../progression/combat/SkillCombatKind';
import { listEnemyCombatSkills } from '../../progression/combat/EnemyCombatSkillCatalog';
import { listHeroCombatSkills } from '../../progression/combat/HeroCombatSkillCatalog';
import { Hero } from '../../entities/Hero';
import { Enemy } from '../../entities/Enemy';
import { CombatAction } from './CombatAction';
import { CombatStatusEffectTracker } from './CombatStatusEffectTracker';
import { SkillCooldownTracker, combatantKey } from './SkillCooldownTracker';
import { SkillPowerCalculator } from '../../progression/combat/SkillPowerCalculator';
import { SkillTargetResolver } from './SkillTargetResolver';

export interface SelectedCombatAction {
  action: CombatAction;
  skillId: string;
}

export class CombatSkillSelector {
  constructor(
    private readonly powerCalculator = new SkillPowerCalculator(),
    private readonly targetResolver = new SkillTargetResolver(),
  ) {}

  selectHeroAction(
    hero: Hero,
    party: Hero[],
    enemies: Enemy[],
    cooldowns: SkillCooldownTracker,
    statusEffects: CombatStatusEffectTracker = CombatStatusEffectTracker.fromMap({}),
  ): SelectedCombatAction | null {
    if (!hero.isAlive()) return null;

    const key = combatantKey('hero', hero.id);
    const skills = listHeroCombatSkills(hero)
      .filter((skill) => cooldowns.isReady(key, skill.skillId))
      .filter((skill) => this.meetsHealCondition(skill, party))
      .sort((left, right) => right.usePriority - left.usePriority);

    for (const skill of skills) {
      const action = this.buildAction(skill, hero, party, enemies, statusEffects);
      if (action) return { action, skillId: skill.skillId };
    }

    return null;
  }

  selectAllReadyHeroActions(
    hero: Hero,
    party: Hero[],
    enemies: Enemy[],
    cooldowns: SkillCooldownTracker,
    statusEffects: CombatStatusEffectTracker = CombatStatusEffectTracker.fromMap({}),
  ): SelectedCombatAction[] {
    if (!hero.isAlive()) return [];

    const key = combatantKey('hero', hero.id);
    const skills = listHeroCombatSkills(hero)
      .filter((skill) => cooldowns.isReady(key, skill.skillId))
      .filter((skill) => this.meetsHealCondition(skill, party))
      .sort((left, right) => right.usePriority - left.usePriority);

    const actions: SelectedCombatAction[] = [];
    for (const skill of skills) {
      const action = this.buildAction(skill, hero, party, enemies, statusEffects);
      if (action) actions.push({ action, skillId: skill.skillId });
    }

    return actions;
  }

  selectEnemyAction(
    enemy: Enemy,
    party: Hero[],
    enemies: Enemy[],
    cooldowns: SkillCooldownTracker,
  ): SelectedCombatAction | null {
    if (!enemy.isAlive()) return null;

    const key = combatantKey('enemy', enemy.id);
    const skills = listEnemyCombatSkills(enemy)
      .filter((skill) => cooldowns.isReady(key, skill.skillId))
      .sort((left, right) => right.usePriority - left.usePriority);

    for (const skill of skills) {
      const action = this.buildAction(skill, enemy, party, enemies);
      if (action) return { action, skillId: skill.skillId };
    }

    return null;
  }

  selectAllReadyEnemyActions(
    enemy: Enemy,
    party: Hero[],
    enemies: Enemy[],
    cooldowns: SkillCooldownTracker,
  ): SelectedCombatAction[] {
    if (!enemy.isAlive()) return [];

    const key = combatantKey('enemy', enemy.id);
    const skills = listEnemyCombatSkills(enemy)
      .filter((skill) => cooldowns.isReady(key, skill.skillId))
      .sort((left, right) => right.usePriority - left.usePriority);

    const actions: SelectedCombatAction[] = [];
    for (const skill of skills) {
      const action = this.buildAction(skill, enemy, party, enemies);
      if (action) actions.push({ action, skillId: skill.skillId });
    }

    return actions;
  }

  private meetsHealCondition(skill: CombatSkillDefinition, party: Hero[]): boolean {
    if (skill.kind !== 'heal_ally' || skill.healConditionThreshold === undefined) {
      return true;
    }

    return party.some((ally) => {
      if (!ally.isAlive()) return false;
      return ally.currentHealth / ally.maxHealth < skill.healConditionThreshold!;
    });
  }

  private buildAction(
    skill: CombatSkillDefinition,
    actor: Hero | Enemy,
    party: Hero[],
    enemies: Enemy[],
    statusEffects: CombatStatusEffectTracker = CombatStatusEffectTracker.fromMap({}),
  ): CombatAction | null {
    const skillName = resolveCombatSkillName(skill);
    const targeting = toSkillTargeting(skill);

    if (skill.kind === 'heal_ally' || skill.targetPool === 'heroes') {
      const targetHeroIds = this.targetResolver.resolveHeroTargets(
        skill,
        party,
        actor.id,
      );
      if (targetHeroIds.length === 0) return null;

      const power =
        actor instanceof Hero
          ? this.powerCalculator.calculateForHero(
              skill,
              actor,
              statusEffects,
              combatantKey('hero', actor.id),
            )
          : this.powerCalculator.calculateForEnemy(skill, actor as Enemy);

      return this.buildHeroPoolAction(skill, skillName, targeting, power, targetHeroIds);
    }

    const targetEnemyIds = this.targetResolver.resolveEnemyTargets(skill, enemies);
    if (targetEnemyIds.length === 0) return null;

    const power =
      actor instanceof Hero
        ? this.powerCalculator.calculateForHero(
            skill,
            actor,
            statusEffects,
            combatantKey('hero', actor.id),
          )
        : this.powerCalculator.calculateForEnemy(skill, actor as Enemy);

    return this.buildEnemyPoolAction(skill, skillName, targeting, power, targetEnemyIds);
  }

  private buildHeroPoolAction(
    skill: CombatSkillDefinition,
    skillName: string,
    targeting: ReturnType<typeof toSkillTargeting>,
    power: number,
    targetHeroIds: string[],
  ): CombatAction {
    const action: CombatAction = {
      skillId: skill.skillId,
      skillName,
      kind: skill.kind,
      targeting,
      power,
      damageComponents: skill.damageComponents,
      onHitDot: skill.onHitDot,
      targetHeroId: targeting === 'single_ally' ? targetHeroIds[0] : undefined,
      targetHeroIds: targeting === 'all_allies' ? targetHeroIds : undefined,
    };

    if (isStatusCombatKind(skill.kind)) {
      action.effectDurationTurns = skill.effectDurationTurns ?? 1;
    }

    return action;
  }

  private buildEnemyPoolAction(
    skill: CombatSkillDefinition,
    skillName: string,
    targeting: ReturnType<typeof toSkillTargeting>,
    power: number,
    targetEnemyIds: string[],
  ): CombatAction {
    const action: CombatAction = {
      skillId: skill.skillId,
      skillName,
      kind: skill.kind,
      targeting,
      power,
      damageComponents: skill.damageComponents,
      onHitDot: skill.onHitDot,
      targetEnemyId: targeting === 'single_enemy' ? targetEnemyIds[0] : undefined,
      targetEnemyIds: targeting === 'all_enemies' ? targetEnemyIds : undefined,
    };

    if (isStatusCombatKind(skill.kind)) {
      action.effectDurationTurns = skill.effectDurationTurns ?? 1;
    }

    return action;
  }
}
