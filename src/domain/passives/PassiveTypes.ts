import { AscensionId } from '../progression/SkillId';
import { HeroClass } from '../entities/HeroClass';

export type PassiveId =
  | 'titan_health'
  | 'magic_affinity'
  | 'life_bond'
  | 'blood_thirst'
  | 'kontempler_sight'
  | 'sacred_aegis'
  | 'discipline_steel'
  | 'rally_heart'
  | 'iron_command'
  | 'arena_tempo'
  | 'flow_strike'
  | 'lethal_duel'
  | 'arcane_focus'
  | 'spell_matrix'
  | 'imperial_edict'
  | 'wild_spark'
  | 'astral_veil'
  | 'ether_storm'
  | 'holy_light'
  | 'sanctify'
  | 'divine_grace'
  | 'vital_bloom'
  | 'living_aegis'
  | 'dawn_renewal';

export type PassiveEffect =
  | { kind: 'max_health_percent_per_defense'; percentPerPoint: number }
  | { kind: 'tree_damage_percent_per_level'; percentPerLevel: number }
  | { kind: 'ally_support_percent_per_int'; percentPerPoint: number }
  | { kind: 'max_health_percent_per_level'; percentPerLevel: number }
  | { kind: 'tree_damage_percent_per_str'; percentPerPoint: number }
  | { kind: 'tree_damage_percent_per_int'; percentPerPoint: number }
  | { kind: 'tree_damage_percent_per_dex'; percentPerPoint: number }
  | { kind: 'attack_percent_flat'; percent: number }
  | { kind: 'defense_percent_flat'; percent: number }
  | { kind: 'max_health_percent_flat'; percent: number }
  | { kind: 'ally_support_percent_flat'; percent: number }
  | { kind: 'tree_damage_percent_flat'; percent: number };

export interface PassiveDefinition {
  id: PassiveId;
  name: string;
  description: string;
  stacking: 'additive';
  effects: readonly PassiveEffect[];
}

export type PassiveSource =
  | { type: 'hero_class'; heroClass: HeroClass }
  | { type: 'ascension'; ascensionId: AscensionId }
  | { type: 'gear'; templateId: string }
  | { type: 'enemy'; enemyType: string };

export interface ActivePassive {
  id: PassiveId;
  definition: PassiveDefinition;
  source: PassiveSource;
}
