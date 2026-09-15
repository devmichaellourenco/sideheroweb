import { CombatSkillDefinition } from './CombatSkillDefinition';

/** Percentual padrão quando a skill não define `targetPriorityPercent`. */
export const DEFAULT_TARGET_PRIORITY_PERCENT = 80;

const SKILL_TARGET_PRIORITY_OVERRIDES: Record<string, number> = {
  basic_attack: 70,
  power_attack: 90,
  thrust: 82,
  mil_cap_lance: 80,
  fireball: 78,
  arcane_bolt: 75,
  frost_shard: 76,
  blizzard: 74,
  minor_heal: 95,
  inquisitor_judgment: 88,
  sag_san_judgment: 88,
  goblin_stab: 75,
  orc_smash: 82,
  wild_bite: 72,
  wraith_drain: 80,
  wraith_curse: 76,
  poison_spit: 78,
  dragon_bite: 85,
  saci_fire: 78,
  slime_acid: 70,
  regenerate: 92,
};

export function getTargetPriorityPercent(skill: CombatSkillDefinition): number {
  if (skill.targetPriorityPercent !== undefined) {
    return clampPercent(skill.targetPriorityPercent);
  }

  const override = SKILL_TARGET_PRIORITY_OVERRIDES[skill.skillId];
  if (override !== undefined) return override;

  if (skill.targetScope === 'all') return 100;
  if (skill.kind === 'heal_ally') return 94;
  if (skill.targetPriority === 'highest_hp_percent') return 85;
  return DEFAULT_TARGET_PRIORITY_PERCENT;
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}
