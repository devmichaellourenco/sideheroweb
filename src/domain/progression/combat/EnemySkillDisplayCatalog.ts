import { getSkillById } from '../SkillCatalog';

export interface EnemySkillDisplay {
  skillId: string;
  name: string;
  description: string;
}

export function getEnemySkillDisplay(skillId: string): EnemySkillDisplay | null {
  const skill = getSkillById(skillId);
  if (!skill) return null;
  return { skillId: skill.id, name: skill.name, description: skill.description };
}

export function listEnemySkillDisplays(skillIds: string[]): EnemySkillDisplay[] {
  return skillIds
    .map((skillId) => getEnemySkillDisplay(skillId))
    .filter((entry): entry is EnemySkillDisplay => entry !== null);
}
