import { standardDamage } from '../../combat/DamageComponentPresets';
import { CatalogCombatSkillDefinition } from './CombatSkillDefinition';

export const BASIC_ATTACK_SKILL_ID = 'basic_attack';

export const BASIC_ATTACK_SKILL: CatalogCombatSkillDefinition = {
  skillId: BASIC_ATTACK_SKILL_ID,
  kind: 'damage',
  damageComponents: standardDamage('physical', 'single', { delivery: 'melee' }),
  targetPool: 'enemies',
  targetScope: 'single',
  targetPriority: 'lowest_hp_percent',
  targetPriorityPercent: 70,
  usePriority: 0,
  initialCooldown: 0,
  cooldownTurns: 0,
  actionRecoverySeconds: 0,
  cooldownSecondsPerRank: 0,
  maxCooldownReduction: 0,
  minCooldownReduction: 0,
  basePower: 0,
  powerPerRank: 0,
  attributeFactor: 0,
  usesAttackStat: true,
};

export const ENEMY_BASIC_ATTACK_SKILL: CatalogCombatSkillDefinition = {
  ...BASIC_ATTACK_SKILL,
  targetPool: 'heroes',
  targetPriorityPercent: 70,
};
