import { resolveCombatSkillName } from '../../progression/combat/CombatSkillNaming';
import { CombatSkillDefinition } from '../../progression/combat/CombatSkillDefinition';
import { listEnemyCombatSkills } from '../../progression/combat/EnemyCombatSkillCatalog';
import { listHeroCombatSkills } from '../../progression/combat/HeroCombatSkillCatalog';
import { Hero } from '../../entities/Hero';
import { Enemy } from '../../entities/Enemy';
import { CombatSkillIntent } from './CombatSkillIntent';
import { CombatSkillSelector } from './CombatSkillSelector';
import { CombatStatusEffectTracker } from './CombatStatusEffectTracker';
import { SkillCooldownTracker, combatantKey } from './SkillCooldownTracker';

export class CombatSkillIntentResolver {
  constructor(private readonly selector = new CombatSkillSelector()) {}

  resolveForHero(
    hero: Hero,
    party: Hero[],
    enemies: Enemy[],
    cooldowns: SkillCooldownTracker,
    statusEffects: CombatStatusEffectTracker = CombatStatusEffectTracker.fromMap({}),
  ): CombatSkillIntent | null {
    if (!hero.isAlive()) return null;

    const key = combatantKey('hero', hero.id);
    const skills = listHeroCombatSkills(hero);
    const selected = this.selector.selectHeroAction(
      hero,
      party,
      enemies,
      cooldowns,
      statusEffects,
    );
    if (!selected) return null;

    return this.buildIntent(key, skills, selected.skillId, selected.action.skillName, cooldowns);
  }

  resolveForEnemy(
    enemy: Enemy,
    party: Hero[],
    enemies: Enemy[],
    cooldowns: SkillCooldownTracker,
  ): CombatSkillIntent | null {
    if (!enemy.isAlive()) return null;

    const key = combatantKey('enemy', enemy.id);
    const skills = listEnemyCombatSkills(enemy);
    const selected = this.selector.selectEnemyAction(enemy, party, enemies, cooldowns);
    if (!selected) return null;

    return this.buildIntent(key, skills, selected.skillId, selected.action.skillName, cooldowns);
  }

  private buildIntent(
    key: string,
    skills: CombatSkillDefinition[],
    nextSkillId: string,
    nextSkillName: string,
    cooldowns: SkillCooldownTracker,
  ): CombatSkillIntent {
    const chargingSkills = this.listChargingSkills(key, skills, cooldowns, nextSkillId);

    const nextRemaining = cooldowns.getRemaining(key, nextSkillId);

    return {
      nextSkillName,
      nextSkillId,
      status: nextRemaining > 0 ? 'cooldown' : 'ready',
      secondsRemaining: nextRemaining,
      chargingSkills,
    };
  }

  private listChargingSkills(
    key: string,
    skills: CombatSkillDefinition[],
    cooldowns: SkillCooldownTracker,
    nextSkillId: string,
  ): Array<{ skillId: string; skillName: string; secondsRemaining: number }> {
    return skills
      .filter((skill) => skill.skillId !== nextSkillId)
      .map((skill) => ({
        skillId: skill.skillId,
        skillName: resolveCombatSkillName(skill),
        secondsRemaining: cooldowns.getRemaining(key, skill.skillId),
      }))
      .filter((entry) => entry.secondsRemaining > 0)
      .sort((left, right) => left.secondsRemaining - right.secondsRemaining);
  }
}
