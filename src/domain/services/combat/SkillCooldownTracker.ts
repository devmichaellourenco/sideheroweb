import { Enemy } from '../../entities/Enemy';
import { Hero } from '../../entities/Hero';
import { applyCooldownReduction } from '../../combat/CombatProfileProvider';
import { getHeroCombatIdentity } from '../../combat/HeroCombatIdentityCatalog';
import { getEnemyCombatIdentity } from '../../enemies/EnemyCombatIdentityCatalog';
import {
  getCooldownSeconds,
  getInitialCooldownSeconds,
  SkillCooldownTimingOptions,
} from '../../combat/SkillCooldownTiming';
import { CombatSkillDefinition } from '../../progression/combat/CombatSkillDefinition';
import { listEnemyCombatSkills } from '../../progression/combat/EnemyCombatSkillCatalog';
import { listHeroCombatSkills } from '../../progression/combat/HeroCombatSkillCatalog';

export type SkillCooldownMap = Record<string, Record<string, number>>;

export class SkillCooldownTracker {
  constructor(private readonly cooldowns: SkillCooldownMap) {}

  static createInitial(heroes: Hero[], enemies: Enemy[]): SkillCooldownMap {
    const cooldowns: SkillCooldownMap = {};

    for (const hero of heroes) {
      const key = combatantKey('hero', hero.id);
      cooldowns[key] = {};
      const ranks = hero.toProps().skillRanks;
      for (const skill of listHeroCombatSkills(hero)) {
        const initial = getInitialCooldownSeconds(skill, {
          rank: ranks[skill.skillId] ?? 1,
          turnSeconds: getHeroCombatIdentity(hero.heroClass).skillCooldownTurnSeconds,
        });
        if (initial > 0) {
          cooldowns[key][skill.skillId] = initial;
        }
      }
    }

    for (const enemy of enemies) {
      const key = combatantKey('enemy', enemy.id);
      cooldowns[key] = {};
      const ranks = enemy.skillRanks;
      for (const skill of listEnemyCombatSkills(enemy)) {
        const initial = getInitialCooldownSeconds(skill, {
          rank: ranks[skill.skillId] ?? 1,
          turnSeconds: getEnemyCombatIdentity(enemy.enemyType).skillCooldownTurnSeconds,
        });
        if (initial > 0) {
          cooldowns[key][skill.skillId] = initial;
        }
      }
    }

    return cooldowns;
  }

  static fromMap(cooldowns: SkillCooldownMap | undefined): SkillCooldownTracker {
    return new SkillCooldownTracker(cooldowns ?? {});
  }

  isReady(key: string, skillId: string): boolean {
    return this.getRemaining(key, skillId) <= 0;
  }

  getRemaining(key: string, skillId: string): number {
    return Math.max(0, this.cooldowns[key]?.[skillId] ?? 0);
  }

  toMap(): SkillCooldownMap {
    return structuredClone(this.cooldowns);
  }

  advanceTime(deltaSeconds: number): SkillCooldownTracker {
    const next = structuredClone(this.cooldowns);

    for (const key of Object.keys(next)) {
      for (const skillId of Object.keys(next[key])) {
        next[key][skillId] = Math.max(0, next[key][skillId] - deltaSeconds);
      }
    }

    return new SkillCooldownTracker(next);
  }

  advanceKey(key: string, deltaSeconds: number): SkillCooldownTracker {
    const next = structuredClone(this.cooldowns);
    if (!next[key]) return this;

    for (const skillId of Object.keys(next[key])) {
      next[key][skillId] = Math.max(0, next[key][skillId] - deltaSeconds);
    }

    return new SkillCooldownTracker(next);
  }

  onSkillUsed(
    key: string,
    usedSkillId: string | null,
    skills: CombatSkillDefinition[],
    cooldownReduction = 0,
    options: SkillCooldownTimingOptions = {},
  ): SkillCooldownTracker {
    const next = structuredClone(this.cooldowns);
    next[key] ??= {};

    if (!usedSkillId) {
      return new SkillCooldownTracker(next);
    }

    const usedSkill = skills.find((skill) => skill.skillId === usedSkillId);
    if (!usedSkill) {
      return new SkillCooldownTracker(next);
    }

    const cooldownSeconds = getCooldownSeconds(usedSkill, options);
    if (cooldownSeconds > 0) {
      next[key][usedSkillId] = applyCooldownReduction(
        cooldownSeconds,
        cooldownReduction,
        usedSkill,
      );
    }

    return new SkillCooldownTracker(next);
  }

  /** Compat legado — converte 1 turno em 1 segundo. */
  onTurnEnd(
    key: string,
    usedSkillId: string | null,
    skills: CombatSkillDefinition[],
  ): SkillCooldownTracker {
    return this.onSkillUsed(key, usedSkillId, skills, 0);
  }
}

export function combatantKey(side: 'hero' | 'enemy', id: string): string {
  return `${side}:${id}`;
}
