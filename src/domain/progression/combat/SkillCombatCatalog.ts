import { CombatSkillDefinition } from './CombatSkillDefinition';
import {
  HERO_COMBAT_SKILL_CATALOG,
  getHeroCombatSkill,
  listHeroCombatSkills,
} from './HeroCombatSkillCatalog';

/** @deprecated Use HeroCombatSkillCatalog */
export type SkillCombatProfile = CombatSkillDefinition;

/** @deprecated Use HERO_COMBAT_SKILL_CATALOG */
export const SKILL_COMBAT_CATALOG = HERO_COMBAT_SKILL_CATALOG;

/** @deprecated Use getHeroCombatSkill */
export function getSkillCombatProfile(skillId: string): CombatSkillDefinition | undefined {
  return getHeroCombatSkill(skillId);
}

/** @deprecated Use listHeroCombatSkills via hero instance */
export function listCombatProfilesForEquipped(equippedSkillIds: string[]): CombatSkillDefinition[] {
  return equippedSkillIds
    .map((id) => getHeroCombatSkill(id))
    .filter((profile): profile is CombatSkillDefinition => profile !== undefined)
    .sort((a, b) => b.usePriority - a.usePriority);
}

export { listHeroCombatSkills };
