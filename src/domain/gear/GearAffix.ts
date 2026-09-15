import { GearRarity } from '../entities/Gear';

/** Stats modulares para expansão futura (flat, %, velocidade, CD). */
export type GearAffixStat =
  | 'attack_speed'
  | 'cast_speed'
  | 'cooldown_reduction'
  | 'crit_chance'
  | 'crit_damage'
  | 'attack_flat'
  | 'defense_flat'
  | 'health_flat'
  | 'attack_percent'
  | 'defense_percent'
  | 'health_percent'
  | 'fire_resist'
  | 'cold_resist'
  | 'lightning_resist'
  | 'air_resist'
  | 'all_elemental_resist'
  | 'fire_resist_flat'
  | 'cold_resist_flat'
  | 'lightning_resist_flat'
  | 'air_resist_flat'
  | 'fire_damage_percent'
  | 'cold_damage_percent'
  | 'lightning_damage_percent'
  | 'air_damage_percent'
  | 'all_elemental_damage'
  | 'fire_damage_flat'
  | 'cold_damage_flat'
  | 'lightning_damage_flat'
  | 'air_damage_flat'
  | 'physical_damage_percent';

export interface GearAffix {
  stat: GearAffixStat;
  value: number;
  minRarity: GearRarity;
}
