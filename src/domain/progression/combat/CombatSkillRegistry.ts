import { CombatSkillDefinition } from './CombatSkillDefinition';
import { applyEnemyBorrowedCombatSkillOverrides } from './EnemyBorrowedCombatSkillCatalog';
import { ENEMY_MONSTER_COMBAT_SKILL_CATALOG } from './EnemyMonsterCombatSkillCatalog';
import { BASIC_ATTACK_SKILL, ENEMY_BASIC_ATTACK_SKILL } from './BasicAttackSkill';
import { HERO_COMBAT_SKILL_CATALOG } from './HeroCombatSkillCatalog';
import { applySkillCombatOverride } from '../HeroCombatOverrides';
import { applyEnemyMonsterSkillOverride } from '../../enemies/EnemyCombatOverrides';

const REGISTRY = new Map<string, CombatSkillDefinition>();

for (const skill of HERO_COMBAT_SKILL_CATALOG) {
  REGISTRY.set(skill.skillId, skill);
}

for (const skill of ENEMY_MONSTER_COMBAT_SKILL_CATALOG) {
  REGISTRY.set(skill.skillId, skill);
}

export const ALL_COMBAT_SKILL_IDS = [...REGISTRY.keys()];

export function getBaseCombatSkill(skillId: string): CombatSkillDefinition | undefined {
  const base = REGISTRY.get(skillId);
  return base ? applySkillCombatOverride(base) : undefined;
}

function flipTargetPool(pool: CombatSkillDefinition['targetPool']): CombatSkillDefinition['targetPool'] {
  if (pool === 'enemies') return 'heroes';
  if (pool === 'heroes') return 'enemies';
  return pool;
}

/** Resolve skill para o lado que a utiliza (herói vs monstro). */
export function resolveCombatSkill(
  skillId: string,
  side: 'hero' | 'enemy',
): CombatSkillDefinition {
  if (skillId === 'basic_attack') {
    return side === 'hero'
      ? applySkillCombatOverride(BASIC_ATTACK_SKILL)
      : ENEMY_BASIC_ATTACK_SKILL;
  }

  const raw = REGISTRY.get(skillId);
  if (!raw) {
    return side === 'hero'
      ? applySkillCombatOverride(BASIC_ATTACK_SKILL)
      : ENEMY_BASIC_ATTACK_SKILL;
  }

  const base = applySkillCombatOverride(raw);
  if (side === 'hero') {
    return base;
  }

  const borrowed = applyEnemyBorrowedCombatSkillOverrides(base);
  const enemySkill = applyEnemyMonsterSkillOverride(borrowed);

  if (enemySkill.targetPool === 'enemies') {
    return { ...enemySkill, targetPool: 'heroes' };
  }

  if (enemySkill.targetPool === 'heroes' && enemySkill.kind === 'damage') {
    return enemySkill;
  }

  if (enemySkill.targetPool === 'heroes') {
    return { ...enemySkill, targetPool: flipTargetPool(enemySkill.targetPool) };
  }

  return enemySkill;
}

export function listCombatSkillsForEnemy(skillIds: readonly string[]): CombatSkillDefinition[] {
  return skillIds.map((id) => resolveCombatSkill(id, 'enemy'));
}
