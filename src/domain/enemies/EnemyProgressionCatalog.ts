import { EnemyRole } from '../campaign/WaveDefinition';
import { getEnemyCombatIdentity } from './EnemyCombatIdentityCatalog';
import { Attributes, createAttributes } from '../progression/Attributes';
import { CombatProfile, createCombatProfile } from '../combat/CombatProfile';
import { PassiveId } from '../passives/PassiveTypes';
import {
  EnemyPowerTier,
  EnemyRosterEntry,
  getEnemyRosterEntry,
} from './EnemyRosterCatalog';
import { EnemyType } from '../entities/EnemyType';
import { BASIC_ATTACK_SKILL_ID } from '../progression/combat/BasicAttackSkill';

/** Escala de attrs/bases por role de wave (não knobs de skill). */
const ROLE_PROGRESSION_SCALE: Record<EnemyRole, number> = {
  trash: 1,
  elite: 1.22,
  boss: 1.48,
};

interface EnemyTierProgression {
  baseAttack: number;
  baseDefense: number;
  baseMaxHealth: number;
  attributes: Attributes;
  combatBaseline: CombatProfile;
  /** Atributo primário que ganha +1 extra por level. */
  primaryAttr: keyof Attributes;
}

const TIER_PROGRESSION: Record<EnemyPowerTier, EnemyTierProgression> = {
  1: {
    baseAttack: 14,
    baseDefense: 4,
    baseMaxHealth: 90,
    attributes: createAttributes(8, 8, 5),
    combatBaseline: createCombatProfile({
      attackSpeed: 0.275,
      castSpeed: 1,
      critChance: 0.02,
      critDamage: 1.35,
    }),
    primaryAttr: 'str',
  },
  2: {
    baseAttack: 18,
    baseDefense: 6,
    baseMaxHealth: 110,
    attributes: createAttributes(11, 9, 6),
    combatBaseline: createCombatProfile({
      attackSpeed: 0.26,
      castSpeed: 1,
      critChance: 0.025,
      critDamage: 1.4,
    }),
    primaryAttr: 'str',
  },
  3: {
    baseAttack: 22,
    baseDefense: 8,
    baseMaxHealth: 130,
    attributes: createAttributes(12, 10, 10),
    combatBaseline: createCombatProfile({
      attackSpeed: 0.24,
      castSpeed: 1,
      critChance: 0.03,
      critDamage: 1.45,
    }),
    primaryAttr: 'int',
  },
  4: {
    baseAttack: 26,
    baseDefense: 10,
    baseMaxHealth: 150,
    attributes: createAttributes(14, 11, 12),
    combatBaseline: createCombatProfile({
      attackSpeed: 0.225,
      castSpeed: 1,
      critChance: 0.035,
      critDamage: 1.5,
    }),
    primaryAttr: 'str',
  },
  5: {
    baseAttack: 30,
    baseDefense: 12,
    baseMaxHealth: 175,
    attributes: createAttributes(16, 12, 14),
    combatBaseline: createCombatProfile({
      attackSpeed: 0.21,
      castSpeed: 1,
      critChance: 0.04,
      critDamage: 1.55,
    }),
    primaryAttr: 'int',
  },
};

/** +1 em cada attr por level; +1 extra no primário do tier. */
const ATTR_PER_LEVEL = 1;

export interface EnemyCombatSheet {
  level: number;
  attributes: Attributes;
  baseAttack: number;
  baseDefense: number;
  baseMaxHealth: number;
  skillRanks: Record<string, number>;
  passiveIds: PassiveId[];
  combatBaseline: CombatProfile;
  /** Preferência de ASPD física (STR contribui) — tiers 1–2 e bosses físicos. */
  physicalMeleeAspd: boolean;
}

function resolveTier(entry: EnemyRosterEntry | null | undefined): EnemyPowerTier {
  return entry?.powerTier ?? 1;
}

function scaleInt(value: number, roleScale: number): number {
  return Math.max(1, Math.floor(value * roleScale));
}

/**
 * Monta o sheet de combate do inimigo como um herói sem gear:
 * bases do tier × role + ganhos de level (espelho do level-up de herói) + attrs.
 */
export function buildEnemyCombatSheet(params: {
  enemyType: EnemyType | string;
  level: number;
  role: EnemyRole;
}): EnemyCombatSheet {
  const level = Math.max(1, Math.floor(params.level));
  const entry = getEnemyRosterEntry(params.enemyType);
  const tier = resolveTier(entry);
  const prog = TIER_PROGRESSION[tier];
  const roleScale = ROLE_PROGRESSION_SCALE[params.role];
  const levelsGained = level - 1;

  const baseAttributes = createAttributes(
    scaleInt(prog.attributes.str, roleScale),
    scaleInt(prog.attributes.dex, roleScale),
    scaleInt(prog.attributes.int, roleScale),
  );

  const attributes = createAttributes(
    baseAttributes.str + levelsGained * ATTR_PER_LEVEL + (prog.primaryAttr === 'str' ? levelsGained : 0),
    baseAttributes.dex + levelsGained * ATTR_PER_LEVEL + (prog.primaryAttr === 'dex' ? levelsGained : 0),
    baseAttributes.int + levelsGained * ATTR_PER_LEVEL + (prog.primaryAttr === 'int' ? levelsGained : 0),
  );

  const skillIds = entry?.skillIds ?? [BASIC_ATTACK_SKILL_ID];
  const skillRank = Math.min(5, 1 + Math.floor(levelsGained / 8));
  const skillRanks: Record<string, number> = {};
  for (const skillId of skillIds) {
    skillRanks[skillId] = skillId === BASIC_ATTACK_SKILL_ID ? 1 : skillRank;
  }
  if (!skillRanks[BASIC_ATTACK_SKILL_ID]) {
    skillRanks[BASIC_ATTACK_SKILL_ID] = 1;
  }

  const physicalMeleeAspd =
    prog.primaryAttr === 'str' || params.role === 'boss' || tier <= 2;
  const identity = getEnemyCombatIdentity(params.enemyType);

  return {
    level,
    attributes,
    baseAttack:
      scaleInt(prog.baseAttack, roleScale) + levelsGained * identity.levelUpAttackGain,
    baseDefense:
      scaleInt(prog.baseDefense, roleScale) + levelsGained * identity.levelUpDefenseGain,
    baseMaxHealth:
      scaleInt(prog.baseMaxHealth, roleScale) + levelsGained * identity.levelUpHealthGain,
    skillRanks,
    passiveIds: [...(entry?.passiveIds ?? [])],
    combatBaseline: { ...prog.combatBaseline },
    physicalMeleeAspd,
  };
}

export function getEnemyTierCombatBaseline(enemyType: EnemyType | string): CombatProfile {
  const entry = getEnemyRosterEntry(enemyType);
  return { ...TIER_PROGRESSION[resolveTier(entry)].combatBaseline };
}
