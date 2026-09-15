import { CombatSkillDefinition } from './CombatSkillDefinition';

/**
 * Variantes de combate para skills do acervo de heróis quando usadas por inimigos.
 * Mantém o mesmo skillId, mas com cooldown e prioridade de alvo calibrados para monstros.
 */
export const ENEMY_BORROWED_COMBAT_SKILL_CATALOG: Partial<
  Record<string, Pick<CombatSkillDefinition, 'initialCooldown' | 'cooldownTurns' | 'targetPriorityPercent'>>
> = {
  power_attack: { cooldownTurns: 4, targetPriorityPercent: 88 },
  arcane_touch: { cooldownTurns: 2, targetPriorityPercent: 74 },
  arcane_bolt: { cooldownTurns: 4, targetPriorityPercent: 76 },
  fireball: { initialCooldown: 6, cooldownTurns: 6, targetPriorityPercent: 78 },
  pyro_ember: { cooldownTurns: 4, targetPriorityPercent: 75 },
  pyro_inferno: { initialCooldown: 6, cooldownTurns: 8, targetPriorityPercent: 80 },
  arcane_surge: { cooldownTurns: 4, targetPriorityPercent: 82 },
  arcane_focus: { cooldownTurns: 4, targetPriorityPercent: 80 },
  reaver_cleave: { cooldownTurns: 8, targetPriorityPercent: 100 },
  inquisitor_judgment: { cooldownTurns: 6, targetPriorityPercent: 88 },
  inquisitor_flame: { cooldownTurns: 4, targetPriorityPercent: 82 },
};

export function applyEnemyBorrowedCombatSkillOverrides(
  skill: CombatSkillDefinition,
): CombatSkillDefinition {
  const overrides = ENEMY_BORROWED_COMBAT_SKILL_CATALOG[skill.skillId];
  if (!overrides) return skill;
  return { ...skill, ...overrides };
}
