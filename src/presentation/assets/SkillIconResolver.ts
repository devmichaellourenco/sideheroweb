import { ASSETS } from './AssetCatalog';
import { getBaseCombatSkill } from '../../domain/progression/combat/CombatSkillRegistry';
import { CombatSkillDefinition } from '../../domain/progression/combat/CombatSkillDefinition';
import { getSkillPrimaryElement } from '../../domain/progression/combat/SkillElementResolver';

export type SkillIconKey = keyof typeof ASSETS.skills;

const EXPLICIT_ICON_BY_ID: Record<string, SkillIconKey> = {
  basic_attack: 'attack',
  power_attack: 'power_attack',
  shield_bash: 'attack',
  thrust: 'thrust',
  precise_shot: 'power_attack',
  piercing_arrow: 'thrust',
  arrow_rain: 'power_attack',
  marked_prey: 'debuff',
  reaver_cleave: 'power_attack',
  reaver_fury: 'power_attack',
  guardian_strike: 'power_attack',
  goblin_stab: 'thrust',
  orc_smash: 'power_attack',
  dragon_bite: 'attack',
  fireball: 'fireball',
  frost_shard: 'frost_shard',
  blizzard: 'blizzard',
  arcane_bolt: 'arcane_bolt',
  smite: 'smite',
  sag_clr_smite: 'smite',
  arcane_touch: 'arcane_bolt',
  pyro_inferno: 'fireball',
  pyro_ember: 'fireball',
  arcane_surge: 'arcane_bolt',
  arcane_focus: 'arcane_bolt',
  inquisitor_judgment: 'blessing',
  inquisitor_flame: 'fireball',
  slime_acid: 'debuff',
  wraith_drain: 'debuff',
  dragon_breath: 'fireball',
  wild_bite: 'attack',
  poison_spit: 'debuff',
  ground_slam: 'power_attack',
  regenerate: 'heal',
  saci_fire: 'fireball',
  saci_wind: 'arcane_bolt',
  minor_heal: 'heal',
  oracle_mend: 'heal',
  oracle_sanctuary: 'mana_shield',
  guardian_resolve: 'blessing',
  blessing: 'blessing',
  wraith_curse: 'debuff',
};

const ELEMENT_ICON: Partial<Record<string, SkillIconKey>> = {
  fire: 'fireball',
  cold: 'frost_shard',
  lightning: 'arcane_bolt',
  air: 'debuff',
  physical: 'power_attack',
};

const ID_PATTERN_RULES: Array<{ pattern: RegExp; icon: SkillIconKey }> = [
  { pattern: /heal|mend|clr_|sanctuary|resolve/i, icon: 'heal' },
  { pattern: /shield|ward|skin|phalanx|aegis/i, icon: 'mana_shield' },
  { pattern: /bless|judgment|banner|rally|glory|crown|decree/i, icon: 'blessing' },
  { pattern: /fire|pyro|flame|inferno|ember|burn/i, icon: 'fireball' },
  { pattern: /frost|ice|gelo|cold/i, icon: 'frost_shard' },
  { pattern: /blizz/i, icon: 'blizzard' },
  { pattern: /bolt|arc|mag_|surge|nova|rift|storm|ether|comet/i, icon: 'arcane_bolt' },
  { pattern: /evasion|feint|zen|whisper|veil|ghost_step/i, icon: 'evasion' },
  { pattern: /vitality|mend/i, icon: 'vitality' },
  { pattern: /cleave|slash|strike|smash|lance|hold|guer_|gen_|cam_|slash|shot|arrow|bolt_shot/i, icon: 'power_attack' },
  { pattern: /thrust|stab/i, icon: 'thrust' },
  { pattern: /curse|drain|acid|poison|bleed|debuff|marked/i, icon: 'debuff' },
];

function inferFromCombat(combat: CombatSkillDefinition): SkillIconKey {
  switch (combat.kind) {
    case 'heal_ally':
      return 'heal';
    case 'buff_attack':
      return 'blessing';
    case 'debuff_defense':
      return 'debuff';
    case 'damage': {
      const element = getSkillPrimaryElement(combat.skillId);
      if (element && ELEMENT_ICON[element]) {
        return ELEMENT_ICON[element]!;
      }
      return combat.usesAttackStat ? 'power_attack' : 'attack';
    }
    default:
      return 'attack';
  }
}

function inferFromSkillId(skillId: string): SkillIconKey {
  for (const rule of ID_PATTERN_RULES) {
    if (rule.pattern.test(skillId)) {
      return rule.icon;
    }
  }

  return 'magic';
}

export function resolveSkillIconKey(skillId: string): SkillIconKey {
  const explicit = EXPLICIT_ICON_BY_ID[skillId];
  if (explicit) return explicit;

  const combat = getBaseCombatSkill(skillId);
  if (combat) {
    return inferFromCombat(combat);
  }

  return inferFromSkillId(skillId);
}
