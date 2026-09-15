import { Enemy } from '../../entities/Enemy';
import { EnemyType } from '../../entities/EnemyType';
import { getEnemyRosterEntry } from '../../enemies/EnemyRosterCatalog';
import { CombatSkillDefinition } from './CombatSkillDefinition';
import { ENEMY_BASIC_ATTACK_SKILL } from './BasicAttackSkill';
import { listCombatSkillsForEnemy } from './CombatSkillRegistry';

export function listEnemyCombatSkillsByType(enemyType: EnemyType): CombatSkillDefinition[] {
  const entry = getEnemyRosterEntry(enemyType);
  if (!entry) return [ENEMY_BASIC_ATTACK_SKILL];
  return listCombatSkillsForEnemy(entry.skillIds);
}

export function listEnemyCombatSkills(enemy: Enemy): CombatSkillDefinition[] {
  return listEnemyCombatSkillsByType(enemy.enemyType);
}
