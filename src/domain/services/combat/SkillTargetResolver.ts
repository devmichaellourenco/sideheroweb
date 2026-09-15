import { Enemy } from '../../entities/Enemy';
import { Hero } from '../../entities/Hero';
import {
  CombatSkillDefinition,
  SkillTargetPriority,
} from '../../progression/combat/CombatSkillDefinition';
import { getTargetPriorityPercent } from '../../progression/combat/CombatSkillTargeting';

export class SkillTargetResolver {
  constructor(private readonly random: () => number = Math.random) {}

  resolveHeroTargets(
    definition: CombatSkillDefinition,
    party: Hero[],
    actorId: string,
  ): string[] {
    const living = party.filter((hero) => hero.isAlive());
    if (living.length === 0) return [];

    if (definition.targetScope === 'all') {
      return living.map((hero) => hero.id);
    }

    const target = this.pickHero(living, definition, actorId);
    return target ? [target.id] : [];
  }

  resolveEnemyTargets(definition: CombatSkillDefinition, enemies: Enemy[]): string[] {
    const living = enemies.filter((enemy) => enemy.isAlive());
    if (living.length === 0) return [];

    if (definition.targetScope === 'all') {
      return living.map((enemy) => enemy.id);
    }

    const target = this.pickEnemy(living, definition);
    return target ? [target.id] : [];
  }

  private pickHero(
    heroes: Hero[],
    definition: CombatSkillDefinition,
    actorId: string,
  ): Hero | null {
    const priorityTarget = this.pickHeroByPriority(heroes, definition.targetPriority, actorId);
    return this.resolveProbabilisticTarget(heroes, priorityTarget, definition);
  }

  private pickEnemy(enemies: Enemy[], definition: CombatSkillDefinition): Enemy | null {
    const priorityTarget = this.pickEnemyByPriority(enemies, definition.targetPriority);
    return this.resolveProbabilisticTarget(enemies, priorityTarget, definition);
  }

  private resolveProbabilisticTarget<T extends { id: string }>(
    candidates: T[],
    priorityTarget: T | null,
    definition: CombatSkillDefinition,
  ): T | null {
    if (!priorityTarget) return null;
    if (candidates.length <= 1) return priorityTarget;

    const percent = getTargetPriorityPercent(definition);
    if (this.random() * 100 < percent) return priorityTarget;

    const alternatives = candidates.filter((entry) => entry.id !== priorityTarget.id);
    if (alternatives.length === 0) return priorityTarget;

    const index = Math.floor(this.random() * alternatives.length);
    return alternatives[index] ?? priorityTarget;
  }

  private pickHeroByPriority(
    heroes: Hero[],
    priority: SkillTargetPriority,
    actorId: string,
  ): Hero | null {
    switch (priority) {
      case 'lowest_hp':
        return this.sortBy(heroes, (hero) => hero.currentHealth)[0] ?? null;
      case 'lowest_hp_percent':
        return this.sortBy(heroes, (hero) => hero.currentHealth / hero.maxHealth)[0] ?? null;
      case 'highest_hp':
        return this.sortBy(heroes, (hero) => -hero.currentHealth)[0] ?? null;
      case 'highest_hp_percent':
        return this.sortBy(heroes, (hero) => -(hero.currentHealth / hero.maxHealth))[0] ?? null;
      default:
        return heroes.find((hero) => hero.id === actorId) ?? heroes[0] ?? null;
    }
  }

  private pickEnemyByPriority(enemies: Enemy[], priority: SkillTargetPriority): Enemy | null {
    switch (priority) {
      case 'lowest_hp':
        return this.sortBy(enemies, (enemy) => enemy.stats.currentHealth)[0] ?? null;
      case 'lowest_hp_percent':
        return this.sortBy(
          enemies,
          (enemy) => enemy.stats.currentHealth / enemy.stats.maxHealth,
        )[0] ?? null;
      case 'highest_hp':
        return this.sortBy(enemies, (enemy) => -enemy.stats.currentHealth)[0] ?? null;
      case 'highest_hp_percent':
        return this.sortBy(
          enemies,
          (enemy) => -(enemy.stats.currentHealth / enemy.stats.maxHealth),
        )[0] ?? null;
      default:
        return enemies[0] ?? null;
    }
  }

  private sortBy<T>(items: T[], score: (item: T) => number): T[] {
    return [...items].sort((left, right) => score(left) - score(right));
  }
}
