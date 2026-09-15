import { HeroClass } from '../entities/HeroClass';
import { AscensionId } from '../progression/SkillId';
import { applyPassiveOverride } from '../progression/HeroCombatOverrides';
import { PassiveDefinition, PassiveId } from './PassiveTypes';

const PASSIVES: Record<PassiveId, PassiveDefinition> = {
  titan_health: {
    id: 'titan_health',
    name: 'Saúde de Titã',
    description: '+1% de vida máxima por ponto de armadura (defesa total, incluindo equipamento).',
    stacking: 'additive',
    effects: [{ kind: 'max_health_percent_per_defense', percentPerPoint: 1 }],
  },
  magic_affinity: {
    id: 'magic_affinity',
    name: 'Afinidade Mágica',
    description: '+1% de dano em skills da árvore por nível do herói (exceto ataque básico).',
    stacking: 'additive',
    effects: [{ kind: 'tree_damage_percent_per_level', percentPerLevel: 1 }],
  },
  life_bond: {
    id: 'life_bond',
    name: 'Elo com a Vida',
    description: '+1% no poder de curas e buffs de aliado por ponto de inteligência.',
    stacking: 'additive',
    effects: [{ kind: 'ally_support_percent_per_int', percentPerPoint: 1 }],
  },
  blood_thirst: {
    id: 'blood_thirst',
    name: 'Sede de Sangue',
    description: '+1% de dano em skills da árvore por ponto de força.',
    stacking: 'additive',
    effects: [{ kind: 'tree_damage_percent_per_str', percentPerPoint: 1 }],
  },
  kontempler_sight: {
    id: 'kontempler_sight',
    name: 'Olhar de Kontempler',
    description:
      '+1% de dano em skills da árvore por ponto de destreza. A arqueira quase nunca vista lê o campo antes do disparo.',
    stacking: 'additive',
    effects: [{ kind: 'tree_damage_percent_per_dex', percentPerPoint: 1 }],
  },
  sacred_aegis: {
    id: 'sacred_aegis',
    name: 'Égide Sagrada',
    description: '+1,5% de vida máxima por nível do herói.',
    stacking: 'additive',
    effects: [{ kind: 'max_health_percent_per_level', percentPerLevel: 1.5 }],
  },

  discipline_steel: {
    id: 'discipline_steel',
    name: 'Disciplina de Aço',
    description: '+5% de defesa.',
    stacking: 'additive',
    effects: [{ kind: 'defense_percent_flat', percent: 5 }],
  },
  rally_heart: {
    id: 'rally_heart',
    name: 'Coração da Tropa',
    description: '+8% de vida máxima.',
    stacking: 'additive',
    effects: [{ kind: 'max_health_percent_flat', percent: 8 }],
  },
  iron_command: {
    id: 'iron_command',
    name: 'Comando de Ferro',
    description: '+5% de defesa e +4% de dano em skills da árvore.',
    stacking: 'additive',
    effects: [
      { kind: 'defense_percent_flat', percent: 5 },
      { kind: 'tree_damage_percent_flat', percent: 4 },
    ],
  },
  arena_tempo: {
    id: 'arena_tempo',
    name: 'Ritmo da Arena',
    description: '+6% de ataque.',
    stacking: 'additive',
    effects: [{ kind: 'attack_percent_flat', percent: 6 }],
  },
  flow_strike: {
    id: 'flow_strike',
    name: 'Golpe Fluido',
    description: '+1% de dano em skills da árvore por ponto de destreza.',
    stacking: 'additive',
    effects: [{ kind: 'tree_damage_percent_per_dex', percentPerPoint: 1 }],
  },
  lethal_duel: {
    id: 'lethal_duel',
    name: 'Duelo Letal',
    description: '+12% de dano em skills da árvore.',
    stacking: 'additive',
    effects: [{ kind: 'tree_damage_percent_flat', percent: 12 }],
  },

  arcane_focus: {
    id: 'arcane_focus',
    name: 'Foco Arcano',
    description: '+6% de dano em skills da árvore.',
    stacking: 'additive',
    effects: [{ kind: 'tree_damage_percent_flat', percent: 6 }],
  },
  spell_matrix: {
    id: 'spell_matrix',
    name: 'Matriz de Feitiços',
    description: '+1% de dano em skills da árvore por ponto de inteligência.',
    stacking: 'additive',
    effects: [{ kind: 'tree_damage_percent_per_int', percentPerPoint: 1 }],
  },
  imperial_edict: {
    id: 'imperial_edict',
    name: 'Édito Imperial',
    description: '+15% de dano em skills da árvore.',
    stacking: 'additive',
    effects: [{ kind: 'tree_damage_percent_flat', percent: 15 }],
  },
  wild_spark: {
    id: 'wild_spark',
    name: 'Centelha Selvagem',
    description: '+5% de ataque e +4% de dano em skills da árvore.',
    stacking: 'additive',
    effects: [
      { kind: 'attack_percent_flat', percent: 5 },
      { kind: 'tree_damage_percent_flat', percent: 4 },
    ],
  },
  astral_veil: {
    id: 'astral_veil',
    name: 'Véu Astral',
    description: '+8% de vida máxima.',
    stacking: 'additive',
    effects: [{ kind: 'max_health_percent_flat', percent: 8 }],
  },
  ether_storm: {
    id: 'ether_storm',
    name: 'Tormenta do Éter',
    description: '+1,5% de dano em skills da árvore por nível do herói.',
    stacking: 'additive',
    effects: [{ kind: 'tree_damage_percent_per_level', percentPerLevel: 1.5 }],
  },

  holy_light: {
    id: 'holy_light',
    name: 'Luz Sagrada',
    description: '+8% no poder de curas e buffs de aliado.',
    stacking: 'additive',
    effects: [{ kind: 'ally_support_percent_flat', percent: 8 }],
  },
  sanctify: {
    id: 'sanctify',
    name: 'Santificar',
    description: '+1% no poder de suporte aliado por ponto de inteligência.',
    stacking: 'additive',
    effects: [{ kind: 'ally_support_percent_per_int', percentPerPoint: 1 }],
  },
  divine_grace: {
    id: 'divine_grace',
    name: 'Graça Divina',
    description: '+15% no poder de curas e buffs de aliado.',
    stacking: 'additive',
    effects: [{ kind: 'ally_support_percent_flat', percent: 15 }],
  },
  vital_bloom: {
    id: 'vital_bloom',
    name: 'Florescer Vital',
    description: '+6% de vida máxima e +5% de suporte aliado.',
    stacking: 'additive',
    effects: [
      { kind: 'max_health_percent_flat', percent: 6 },
      { kind: 'ally_support_percent_flat', percent: 5 },
    ],
  },
  living_aegis: {
    id: 'living_aegis',
    name: 'Égide Viva',
    description: '+8% de defesa.',
    stacking: 'additive',
    effects: [{ kind: 'defense_percent_flat', percent: 8 }],
  },
  dawn_renewal: {
    id: 'dawn_renewal',
    name: 'Renovação da Aurora',
    description: '+12% de suporte aliado e +5% de vida máxima.',
    stacking: 'additive',
    effects: [
      { kind: 'ally_support_percent_flat', percent: 12 },
      { kind: 'max_health_percent_flat', percent: 5 },
    ],
  },
};

export const BASE_CLASS_PASSIVE_IDS: Record<HeroClass, PassiveId> = {
  knight: 'titan_health',
  sorcerer: 'magic_affinity',
  priest: 'life_bond',
  berserker: 'blood_thirst',
  archer: 'kontempler_sight',
  paladin: 'sacred_aegis',
};

export const ASCENSION_PASSIVE_IDS: Record<AscensionId, PassiveId> = {
  knight_military_guerreiro: 'discipline_steel',
  knight_military_capitao: 'rally_heart',
  knight_military_general: 'iron_command',
  knight_martial_gladiador: 'arena_tempo',
  knight_martial_mestre: 'flow_strike',
  knight_martial_campeao: 'lethal_duel',
  sorcerer_arcane_maga: 'arcane_focus',
  sorcerer_arcane_arquimaga: 'spell_matrix',
  sorcerer_arcane_imperatriz: 'imperial_edict',
  sorcerer_innate_feiticeira: 'wild_spark',
  sorcerer_innate_soberana: 'astral_veil',
  sorcerer_innate_filha_eter: 'ether_storm',
  priest_sacred_cleriga: 'holy_light',
  priest_sacred_alta_sacerdotisa: 'sanctify',
  priest_sacred_santa: 'divine_grace',
  priest_life_cleriga: 'vital_bloom',
  priest_life_guardia: 'living_aegis',
  priest_life_filha_aurora: 'dawn_renewal',
};

export function getPassiveDefinition(id: PassiveId): PassiveDefinition {
  return applyPassiveOverride(PASSIVES[id]);
}

/** Passiva do catálogo, sem override do lab. */
export function getCatalogPassiveDefinition(id: PassiveId): PassiveDefinition {
  return PASSIVES[id];
}

export function listPassiveDefinitions(): PassiveDefinition[] {
  return Object.values(PASSIVES).map((definition) => applyPassiveOverride(definition));
}

export function isPassiveId(value: string): value is PassiveId {
  return value in PASSIVES;
}
