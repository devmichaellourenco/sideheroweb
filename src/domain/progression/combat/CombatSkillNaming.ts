import { getSkillById } from '../SkillCatalog';
import { CombatSkillDefinition } from './CombatSkillDefinition';
import { getEnemySkillDisplay } from './EnemySkillDisplayCatalog';

export function resolveCombatSkillName(skill: CombatSkillDefinition): string {
  const enemyDisplay = getEnemySkillDisplay(skill.skillId);
  if (enemyDisplay) return enemyDisplay.name;

  return getSkillById(skill.skillId)?.name ?? skill.skillId;
}
