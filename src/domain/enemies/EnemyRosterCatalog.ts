import { PartialResistanceProfile } from '../combat/ResistanceProfile';
import type { EnemyThemeTag } from './EnemyThemeTags';

export type EnemyPowerTier = 1 | 2 | 3 | 4 | 5;
export type EnemyRosterRole = 'common' | 'subboss' | 'boss';
export type EnemySpriteVariant = 'common' | 'boss' | 'saci' | 'goblin_archer' | 'goblin_bomber' | 'gonodor' | 'vorax';

export interface EnemyRosterEntry {
  id: string;
  name: string;
  powerTier: EnemyPowerTier;
  rosterRole: EnemyRosterRole;
  /** Placeholder visual até sprite dedicado. */
  spriteVariant: EnemySpriteVariant;
  /** Skills do acervo unificado (CombatSkillRegistry). */
  skillIds: readonly string[];
  /** Resistências inatas explícitas (somadas ao tema inferido por id). */
  innateResists?: PartialResistanceProfile;
  /** Override de tags temáticas; se omitido, inferidas do id. */
  tags?: readonly EnemyThemeTag[];
  /** Passivas sempre ativas (fase D — opcional). */
  passiveIds?: readonly import('../passives/PassiveTypes').PassiveId[];
}

const T1: EnemyPowerTier = 1;
const T2: EnemyPowerTier = 2;
const T3: EnemyPowerTier = 3;
const T4: EnemyPowerTier = 4;
const T5: EnemyPowerTier = 5;

const SK = {
  basic: ['basic_attack'] as const,
  beast1: ['basic_attack', 'wild_bite'] as const,
  goblin1: ['basic_attack', 'goblin_stab'] as const,
  bandit1: ['basic_attack', 'power_attack'] as const,
  orc1: ['basic_attack', 'orc_smash'] as const,
  undead1: ['basic_attack', 'wraith_drain'] as const,
  fire1: ['basic_attack', 'pyro_ember'] as const,
  shaman1: ['basic_attack', 'goblin_stab', 'arcane_touch'] as const,
  captain1: ['basic_attack', 'power_attack', 'goblin_stab'] as const,
  ogre1: ['basic_attack', 'orc_smash', 'ground_slam'] as const,
  necromancer2: ['basic_attack', 'wraith_drain', 'wraith_curse'] as const,
  orcChief2: ['basic_attack', 'orc_smash', 'reaver_cleave'] as const,
  troll2: ['basic_attack', 'orc_smash', 'regenerate'] as const,
  capelobo2: ['basic_attack', 'wild_bite', 'capelobo_brain_drink'] as const,
  hydra3: ['basic_attack', 'poison_spit', 'reaver_cleave'] as const,
  mapinguari3: ['basic_attack', 'wild_bite', 'mapinguari_belly_roar'] as const,
  general3: ['basic_attack', 'wraith_drain', 'wraith_curse'] as const,
  dragon3: ['basic_attack', 'dragon_breath', 'dragon_bite'] as const,
  lich4: ['basic_attack', 'wraith_curse', 'arcane_surge'] as const,
  warlord4: ['basic_attack', 'reaver_cleave', 'pyro_inferno'] as const,
  titan4: ['basic_attack', 'ground_slam', 'orc_smash'] as const,
  archlich5: ['basic_attack', 'wraith_curse', 'arcane_surge'] as const,
  demon5: ['basic_attack', 'pyro_inferno', 'wraith_drain'] as const,
  god5: ['basic_attack', 'arcane_surge', 'dragon_breath', 'saci_wind'] as const,
  saci: ['basic_attack', 'saci_fire', 'saci_wind'] as const,
  gonodor: ['basic_attack', 'pyro_ember', 'power_attack', 'ground_slam'] as const,
  morthavenDuke: ['basic_attack', 'power_attack', 'reaver_cleave', 'wraith_curse'] as const,
};

/** 52 inimigos de campanha + únicos narrativos. */
export const ENEMY_ROSTER: readonly EnemyRosterEntry[] = [
  // Nível 1 — Aprendiz
  { id: 'giant_rat', name: 'Rato Gigante', powerTier: T1, rosterRole: 'common', spriteVariant: 'common', skillIds: SK.beast1 },
  { id: 'cave_bat', name: 'Morcego das Cavernas', powerTier: T1, rosterRole: 'common', spriteVariant: 'common', skillIds: SK.beast1 },
  { id: 'gray_wolf', name: 'Lobo Cinzento', powerTier: T1, rosterRole: 'common', spriteVariant: 'common', skillIds: SK.beast1 },
  { id: 'goblin_raider', name: 'Goblin Saqueador', powerTier: T1, rosterRole: 'common', spriteVariant: 'common', skillIds: SK.goblin1 },
  { id: 'goblin_archer', name: 'Goblin Arqueiro', powerTier: T1, rosterRole: 'common', spriteVariant: 'goblin_archer', skillIds: SK.goblin1 },
  { id: 'kobold_digger', name: 'Kobold Escavador', powerTier: T1, rosterRole: 'common', spriteVariant: 'common', skillIds: SK.goblin1 },
  { id: 'goblin_bomber', name: 'Goblin Bombardeiro', powerTier: T1, rosterRole: 'common', spriteVariant: 'goblin_bomber', skillIds: SK.fire1 },
  { id: 'road_bandit', name: 'Bandido de Estrada', powerTier: T1, rosterRole: 'common', spriteVariant: 'common', skillIds: SK.bandit1 },
  { id: 'goblin_shaman', name: 'Xamã Goblin', powerTier: T1, rosterRole: 'subboss', spriteVariant: 'boss', skillIds: SK.shaman1 },
  { id: 'bandit_captain', name: 'Capitão dos Bandidos', powerTier: T1, rosterRole: 'subboss', spriteVariant: 'boss', skillIds: SK.captain1 },
  { id: 'hill_ogre', name: 'Ogro das Colinas', powerTier: T1, rosterRole: 'boss', spriteVariant: 'boss', skillIds: SK.ogre1, passiveIds: ['titan_health'] },

  // Nível 2 — Efetivado
  { id: 'orc_warrior', name: 'Orc Guerreiro', powerTier: T2, rosterRole: 'common', spriteVariant: 'common', skillIds: SK.orc1 },
  { id: 'orc_berserker', name: 'Orc Berserker', powerTier: T2, rosterRole: 'common', spriteVariant: 'common', skillIds: SK.orc1, passiveIds: ['blood_thirst'] },
  { id: 'gnoll_hunter', name: 'Gnoll Caçador', powerTier: T2, rosterRole: 'common', spriteVariant: 'common', skillIds: SK.beast1 },
  { id: 'giant_spider', name: 'Aranha Gigante', powerTier: T2, rosterRole: 'common', spriteVariant: 'common', skillIds: ['basic_attack', 'poison_spit'] },
  { id: 'lizardman', name: 'Homem-Lagarto', powerTier: T2, rosterRole: 'common', spriteVariant: 'common', skillIds: SK.orc1 },
  { id: 'skeleton_warrior', name: 'Esqueleto Guerreiro', powerTier: T2, rosterRole: 'common', spriteVariant: 'common', skillIds: SK.undead1 },
  { id: 'rot_zombie', name: 'Zumbi Putrefato', powerTier: T2, rosterRole: 'common', spriteVariant: 'common', skillIds: SK.undead1 },
  { id: 'minor_fire_elemental', name: 'Elemental Menor de Fogo', powerTier: T2, rosterRole: 'common', spriteVariant: 'common', skillIds: SK.fire1, innateResists: { fire: 20 } },
  { id: 'renegade_necromancer', name: 'Necromante Renegado', powerTier: T2, rosterRole: 'subboss', spriteVariant: 'boss', skillIds: SK.necromancer2 },
  { id: 'bloody_orc_chief', name: 'Chefe Orc do Clã Sangrento', powerTier: T2, rosterRole: 'subboss', spriteVariant: 'boss', skillIds: SK.orcChief2 },
  {
    id: 'capelobo',
    name: 'Capelobo',
    powerTier: T2,
    rosterRole: 'subboss',
    spriteVariant: 'common',
    skillIds: SK.capelobo2,
    tags: ['beast', 'physical'],
    passiveIds: ['blood_thirst'],
  },
  { id: 'mountain_troll', name: 'Troll das Montanhas', powerTier: T2, rosterRole: 'boss', spriteVariant: 'boss', skillIds: SK.troll2 },

  // Nível 3 — Profissional
  { id: 'gargoyle', name: 'Gárgula', powerTier: T3, rosterRole: 'common', spriteVariant: 'common', skillIds: ['basic_attack', 'arcane_bolt'] },
  { id: 'minotaur', name: 'Minotauro', powerTier: T3, rosterRole: 'common', spriteVariant: 'common', skillIds: SK.orc1 },
  { id: 'war_worg', name: 'Worg de Guerra', powerTier: T3, rosterRole: 'common', spriteVariant: 'common', skillIds: SK.beast1 },
  { id: 'death_knight', name: 'Cavaleiro Morto-Vivo', powerTier: T3, rosterRole: 'common', spriteVariant: 'common', skillIds: SK.undead1 },
  { id: 'shadow_arachnid', name: 'Aracnídeo Sombrio', powerTier: T3, rosterRole: 'common', spriteVariant: 'common', skillIds: ['basic_attack', 'poison_spit', 'wraith_drain'] },
  { id: 'cultist_mage', name: 'Mago Cultista', powerTier: T3, rosterRole: 'common', spriteVariant: 'common', skillIds: ['basic_attack', 'arcane_bolt', 'fireball'] },
  { id: 'lesser_demon', name: 'Demônio Menor', powerTier: T3, rosterRole: 'common', spriteVariant: 'common', skillIds: ['basic_attack', 'pyro_ember', 'wraith_drain'] },
  { id: 'major_elemental', name: 'Elemental Maior', powerTier: T3, rosterRole: 'common', spriteVariant: 'common', skillIds: ['basic_attack', 'fireball', 'arcane_surge'], innateResists: { fire: 15, lightning: 10 } },
  { id: 'three_head_hydra', name: 'Hidra de Três Cabeças', powerTier: T3, rosterRole: 'subboss', spriteVariant: 'boss', skillIds: SK.hydra3 },
  { id: 'dead_general', name: 'General dos Mortos', powerTier: T3, rosterRole: 'subboss', spriteVariant: 'boss', skillIds: SK.general3 },
  {
    id: 'mapinguari',
    name: 'Mapinguari',
    powerTier: T3,
    rosterRole: 'subboss',
    spriteVariant: 'common',
    skillIds: SK.mapinguari3,
    tags: ['beast', 'physical'],
    innateResists: { cold: -20 },
    passiveIds: ['titan_health'],
  },
  { id: 'young_green_dragon', name: 'Dragão Verde Jovem', powerTier: T3, rosterRole: 'boss', spriteVariant: 'boss', skillIds: SK.dragon3, passiveIds: ['magic_affinity'] },

  // Nível 4 — Especialista
  { id: 'stone_giant', name: 'Gigante da Pedra', powerTier: T4, rosterRole: 'common', spriteVariant: 'common', skillIds: ['basic_attack', 'ground_slam'] },
  { id: 'frost_giant', name: 'Gigante do Gelo', powerTier: T4, rosterRole: 'common', spriteVariant: 'common', skillIds: ['basic_attack', 'ground_slam', 'frost_breath'], innateResists: { cold: 25 } },
  { id: 'chimera', name: 'Quimera', powerTier: T4, rosterRole: 'common', spriteVariant: 'common', skillIds: ['basic_attack', 'dragon_breath', 'wild_bite'] },
  { id: 'manticore', name: 'Mantícora', powerTier: T4, rosterRole: 'common', spriteVariant: 'common', skillIds: ['basic_attack', 'poison_spit', 'wild_bite'] },
  { id: 'infernal_devil', name: 'Diabo Infernal', powerTier: T4, rosterRole: 'common', spriteVariant: 'common', skillIds: ['basic_attack', 'pyro_inferno', 'wraith_curse'] },
  { id: 'aberrant_abomination', name: 'Abominação Aberrante', powerTier: T4, rosterRole: 'common', spriteVariant: 'common', skillIds: ['basic_attack', 'wraith_drain', 'arcane_surge'] },
  { id: 'adult_black_dragon', name: 'Dragão Negro Adulto', powerTier: T4, rosterRole: 'common', spriteVariant: 'common', skillIds: SK.dragon3 },
  { id: 'lesser_lich', name: 'Lich Menor', powerTier: T4, rosterRole: 'subboss', spriteVariant: 'boss', skillIds: SK.lich4, passiveIds: ['arcane_focus'] },
  { id: 'demonic_warlord', name: 'Senhor da Guerra Demoníaco', powerTier: T4, rosterRole: 'subboss', spriteVariant: 'boss', skillIds: SK.warlord4 },
  { id: 'awakened_titan', name: 'Titã Desperto', powerTier: T4, rosterRole: 'boss', spriteVariant: 'boss', skillIds: SK.titan4, passiveIds: ['titan_health', 'discipline_steel'] },

  // Nível 5 — Épico
  { id: 'ancient_dragon', name: 'Dragão Ancião', powerTier: T5, rosterRole: 'common', spriteVariant: 'common', skillIds: SK.dragon3 },
  { id: 'primordial_behemoth', name: 'Behemoth Primordial', powerTier: T5, rosterRole: 'common', spriteVariant: 'common', skillIds: ['basic_attack', 'ground_slam', 'reaver_cleave'] },
  { id: 'soul_devourer', name: 'Devorador de Almas', powerTier: T5, rosterRole: 'common', spriteVariant: 'common', skillIds: ['basic_attack', 'wraith_drain', 'arcane_surge'] },
  { id: 'void_herald', name: 'Arauto do Vazio', powerTier: T5, rosterRole: 'common', spriteVariant: 'common', skillIds: ['basic_attack', 'saci_wind', 'arcane_surge'] },
  { id: 'archlich', name: 'Arquilich', powerTier: T5, rosterRole: 'subboss', spriteVariant: 'boss', skillIds: SK.archlich5 },
  { id: 'demon_prince', name: 'Príncipe Demônio', powerTier: T5, rosterRole: 'subboss', spriteVariant: 'boss', skillIds: SK.demon5 },
  { id: 'fallen_magic_god', name: 'Deus Caído da Magia', powerTier: T5, rosterRole: 'boss', spriteVariant: 'boss', skillIds: SK.god5 },

  // Únicos narrativos
  {
    id: 'saci',
    name: 'Saci',
    powerTier: T1,
    rosterRole: 'boss',
    spriteVariant: 'saci',
    skillIds: SK.saci,
    tags: ['fire', 'arcane'],
    innateResists: { fire: 12, cold: -15 },
  },
  {
    id: 'gonodor',
    name: 'Gonodor',
    powerTier: T1,
    rosterRole: 'boss',
    spriteVariant: 'gonodor',
    skillIds: SK.gonodor,
    tags: ['fire', 'physical'],
    innateResists: { fire: 20, cold: -15 },
  },
  {
    id: 'morthaven_duke',
    name: 'Duque de Morthaven',
    powerTier: T2,
    rosterRole: 'boss',
    spriteVariant: 'boss',
    skillIds: SK.morthavenDuke,
    tags: ['shadow', 'physical', 'undead'],
    innateResists: { cold: 15, air: 10, fire: -10, lightning: -10 },
  },
  { id: 'vorax', name: 'Vorax', powerTier: T5, rosterRole: 'boss', spriteVariant: 'vorax', skillIds: SK.god5 },
];

const ROSTER_BY_ID = new Map(ENEMY_ROSTER.map((entry) => [entry.id, entry]));

export type EnemyType = (typeof ENEMY_ROSTER)[number]['id'];

export function getEnemyRosterEntry(id: string): EnemyRosterEntry | undefined {
  return ROSTER_BY_ID.get(id);
}

export function getCommonsForPowerTier(tier: EnemyPowerTier): EnemyRosterEntry[] {
  return ENEMY_ROSTER.filter((e) => e.powerTier === tier && e.rosterRole === 'common');
}

export function getSubbossesForPowerTier(tier: EnemyPowerTier): EnemyRosterEntry[] {
  return ENEMY_ROSTER.filter((e) => e.powerTier === tier && e.rosterRole === 'subboss');
}

const UNIQUE_BOSS_IDS = new Set(['saci', 'gonodor', 'morthaven_duke', 'vorax']);

export function getBossForPowerTier(tier: EnemyPowerTier): EnemyRosterEntry {
  const boss = ENEMY_ROSTER.find(
    (e) => e.powerTier === tier && e.rosterRole === 'boss' && !UNIQUE_BOSS_IDS.has(e.id),
  );
  if (!boss) throw new Error(`Boss não definido para tier ${tier}`);
  return boss;
}

export function isKnownEnemyType(id: string): id is EnemyType {
  return ROSTER_BY_ID.has(id);
}
