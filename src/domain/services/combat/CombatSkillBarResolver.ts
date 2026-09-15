import { getHeroCombatIdentity } from '../../combat/HeroCombatIdentityCatalog';
import { getEnemyCombatIdentity } from '../../enemies/EnemyCombatIdentityCatalog';
import { getCooldownSeconds } from '../../combat/SkillCooldownTiming';
import { resolveCombatSkillName } from '../../progression/combat/CombatSkillNaming';
import { CombatSkillDefinition } from '../../progression/combat/CombatSkillDefinition';
import { listEnemyCombatSkills } from '../../progression/combat/EnemyCombatSkillCatalog';
import { listHeroCombatSkills } from '../../progression/combat/HeroCombatSkillCatalog';
import { Hero } from '../../entities/Hero';
import { Enemy } from '../../entities/Enemy';
import { CombatSkillBarEntry, CombatSkillHighlight } from './CombatSkillBar';
import { CombatSkillSelector } from './CombatSkillSelector';
import { CombatStatusEffectTracker } from './CombatStatusEffectTracker';
import { SkillCooldownTracker, combatantKey } from './SkillCooldownTracker';

/** Oculto na strip de batalha; o carregamento do ataque usa a barra de time action. */
const STRIP_HIDDEN_SKILL_IDS = new Set(['basic_attack']);

export class CombatSkillBarResolver {
  constructor(private readonly selector = new CombatSkillSelector()) {}

  resolveForHero(
    hero: Hero,
    party: Hero[],
    enemies: Enemy[],
    cooldowns: SkillCooldownTracker,
    options: { isActiveTurn: boolean },
    statusEffects: CombatStatusEffectTracker = CombatStatusEffectTracker.fromMap({}),
  ): CombatSkillBarEntry[] {
    if (!hero.isAlive()) return [];

    const key = combatantKey('hero', hero.id);
    const skills = this.filterSkillsForStrip(listHeroCombatSkills(hero));
    const highlights = this.resolveHighlights(
      hero,
      null,
      party,
      enemies,
      cooldowns,
      options,
      statusEffects,
    );

    return this.mapSkills(key, skills, cooldowns, highlights, {
      ranks: hero.toProps().skillRanks,
      turnSeconds: getHeroCombatIdentity(hero.heroClass).skillCooldownTurnSeconds,
    });
  }

  resolveForEnemy(
    enemy: Enemy,
    party: Hero[],
    enemies: Enemy[],
    cooldowns: SkillCooldownTracker,
    options: { isActiveTurn: boolean },
  ): CombatSkillBarEntry[] {
    if (!enemy.isAlive()) return [];

    const key = combatantKey('enemy', enemy.id);
    const skills = this.filterSkillsForStrip(listEnemyCombatSkills(enemy));
    const highlights = this.resolveHighlights(
      null,
      enemy,
      party,
      enemies,
      cooldowns,
      options,
    );

    return this.mapSkills(key, skills, cooldowns, highlights, {
      ranks: enemy.skillRanks,
      turnSeconds: getEnemyCombatIdentity(enemy.enemyType).skillCooldownTurnSeconds,
    });
  }

  private resolveHighlights(
    hero: Hero | null,
    enemy: Enemy | null,
    party: Hero[],
    enemies: Enemy[],
    cooldowns: SkillCooldownTracker,
    options: { isActiveTurn: boolean },
    statusEffects: CombatStatusEffectTracker = CombatStatusEffectTracker.fromMap({}),
  ): Map<string, CombatSkillHighlight> {
    const highlights = new Map<string, CombatSkillHighlight>();

    if (!options.isActiveTurn) {
      return highlights;
    }

    const nextAction =
      hero !== null
        ? this.selector.selectHeroAction(hero, party, enemies, cooldowns, statusEffects)
        : enemy !== null
          ? this.selector.selectEnemyAction(enemy, party, enemies, cooldowns)
          : null;

    if (nextAction) {
      highlights.set(nextAction.skillId, 'next');
    }

    return highlights;
  }

  private filterSkillsForStrip(skills: CombatSkillDefinition[]): CombatSkillDefinition[] {
    return skills.filter((skill) => !STRIP_HIDDEN_SKILL_IDS.has(skill.skillId));
    // Para exibir o ataque básico de novo na strip:
    // return skills;
  }

  private mapSkills(
    key: string,
    skills: CombatSkillDefinition[],
    cooldowns: SkillCooldownTracker,
    highlights: Map<string, CombatSkillHighlight>,
    options: { ranks?: Record<string, number>; turnSeconds?: number } = {},
  ): CombatSkillBarEntry[] {
    return skills.map((skill) => {
      const secondsRemaining = cooldowns.getRemaining(key, skill.skillId);
      const baseCooldown = getCooldownSeconds(skill, {
        rank: options.ranks?.[skill.skillId] ?? 1,
        turnSeconds: options.turnSeconds,
      });
      const cooldownTotal = Math.max(baseCooldown, secondsRemaining, 0);
      const ready = secondsRemaining <= 0 || baseCooldown <= 0;

      return {
        skillId: skill.skillId,
        skillName: resolveCombatSkillName(skill),
        secondsRemaining,
        cooldownTotal,
        ready,
        highlight: highlights.get(skill.skillId) ?? 'none',
      };
    });
  }
}
