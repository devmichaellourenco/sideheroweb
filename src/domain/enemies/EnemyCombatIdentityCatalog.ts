import { CombatantIdentity } from '../combat/CombatantIdentity';
import {
  applyEnemyIdentityOverride,
  getEnemyIdentityOverride,
} from './EnemyCombatOverrides';
import { EnemyType, isKnownEnemyType } from './EnemyRosterCatalog';

export type EnemyCombatIdentity = CombatantIdentity;

function row(identity: CombatantIdentity): EnemyCombatIdentity {
  return { ...identity };
}

/** Semente numérica legado — cada tipo abaixo pode divergir. */
const SEED: CombatantIdentity = {
  basicAttackDamageRatio: 0.5,
  skillCooldownTurnSeconds: 5,
  attackSpeedFactor: 0.29,
  attackPerLevel: 4,
  defensePerLevel: 3,
  healthPerLevel: 15,
  levelUpAttackGain: 3,
  levelUpDefenseGain: 3,
  levelUpHealthGain: 15,
};

/** Tabela individual por tipo de monstro. */
export const ENEMY_COMBAT_IDENTITY: Record<EnemyType, EnemyCombatIdentity> = {
  giant_rat: row(SEED),
  cave_bat: row(SEED),
  gray_wolf: row(SEED),
  goblin_raider: row(SEED),
  goblin_archer: row(SEED),
  kobold_digger: row(SEED),
  goblin_bomber: row(SEED),
  road_bandit: row(SEED),
  goblin_shaman: row(SEED),
  bandit_captain: row(SEED),
  hill_ogre: row(SEED),
  orc_warrior: row(SEED),
  orc_berserker: row(SEED),
  gnoll_hunter: row(SEED),
  giant_spider: row(SEED),
  lizardman: row(SEED),
  skeleton_warrior: row(SEED),
  rot_zombie: row(SEED),
  minor_fire_elemental: row(SEED),
  renegade_necromancer: row(SEED),
  bloody_orc_chief: row(SEED),
  mountain_troll: row(SEED),
  capelobo: row({ ...SEED, basicAttackDamageRatio: 0.55, attackSpeedFactor: 0.32 }),
  gargoyle: row(SEED),
  minotaur: row(SEED),
  war_worg: row(SEED),
  death_knight: row(SEED),
  shadow_arachnid: row(SEED),
  cultist_mage: row(SEED),
  lesser_demon: row(SEED),
  major_elemental: row(SEED),
  three_head_hydra: row(SEED),
  dead_general: row(SEED),
  mapinguari: row({ ...SEED, healthPerLevel: 20, levelUpHealthGain: 20, basicAttackDamageRatio: 0.58 }),
  young_green_dragon: row(SEED),
  stone_giant: row(SEED),
  frost_giant: row(SEED),
  chimera: row(SEED),
  manticore: row(SEED),
  infernal_devil: row(SEED),
  aberrant_abomination: row(SEED),
  adult_black_dragon: row(SEED),
  lesser_lich: row(SEED),
  demonic_warlord: row(SEED),
  awakened_titan: row(SEED),
  ancient_dragon: row(SEED),
  primordial_behemoth: row(SEED),
  soul_devourer: row(SEED),
  void_herald: row(SEED),
  archlich: row(SEED),
  demon_prince: row(SEED),
  fallen_magic_god: row(SEED),
  saci: row(SEED),
  gonodor: row(SEED),
  morthaven_duke: row(SEED),
  vorax: row(SEED),
};

export function getCatalogEnemyCombatIdentity(enemyType: string): EnemyCombatIdentity {
  if (isKnownEnemyType(enemyType)) {
    return row(ENEMY_COMBAT_IDENTITY[enemyType]);
  }
  return row(SEED);
}

/** Identidade efetiva (catálogo + override do Balance Lab). */
export function getEnemyCombatIdentity(enemyType: string): EnemyCombatIdentity {
  return applyEnemyIdentityOverride(
    getCatalogEnemyCombatIdentity(enemyType),
    getEnemyIdentityOverride(enemyType),
  );
}

export function listEnemyCombatIdentities(): ReadonlyArray<{
  enemyType: EnemyType;
  identity: EnemyCombatIdentity;
}> {
  return (Object.keys(ENEMY_COMBAT_IDENTITY) as EnemyType[]).map((enemyType) => ({
    enemyType,
    identity: ENEMY_COMBAT_IDENTITY[enemyType],
  }));
}
