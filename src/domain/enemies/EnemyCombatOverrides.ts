import type { CombatantIdentity } from '../combat/CombatantIdentity';
import type { CombatSkillDefinition } from '../progression/combat/CombatSkillDefinition';
import {
  applySkillCombatOverride,
  normalizeSkillCombatOverride,
  type HeroSkillCombatOverride,
} from '../progression/HeroCombatOverrides';
import staticOverrides from './data/enemy-combat-overrides.json';
import type { EnemyType } from './EnemyRosterCatalog';

const IDENTITY_KEYS: readonly (keyof CombatantIdentity)[] = [
  'basicAttackDamageRatio',
  'skillCooldownTurnSeconds',
  'attackSpeedFactor',
  'attackPerLevel',
  'defensePerLevel',
  'healthPerLevel',
  'levelUpAttackGain',
  'levelUpDefenseGain',
  'levelUpHealthGain',
];

export type EnemyIdentityOverride = Partial<CombatantIdentity>;
export type EnemyMonsterSkillOverride = HeroSkillCombatOverride;

export interface EnemyCombatOverridesFile {
  version: number;
  updatedAt: string | null;
  identities: Partial<Record<EnemyType, EnemyIdentityOverride>>;
  monsterSkills: Record<string, EnemyMonsterSkillOverride>;
}

const embedded = staticOverrides as EnemyCombatOverridesFile;
let runtime: EnemyCombatOverridesFile | null = null;

function emptyFile(): EnemyCombatOverridesFile {
  return {
    version: 1,
    updatedAt: null,
    identities: {},
    monsterSkills: {},
  };
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export function getEmbeddedEnemyCombatOverrides(): EnemyCombatOverridesFile {
  return {
    version: embedded.version ?? 1,
    updatedAt: embedded.updatedAt ?? null,
    identities: { ...(embedded.identities ?? {}) },
    monsterSkills: { ...(embedded.monsterSkills ?? {}) },
  };
}

export function setRuntimeEnemyCombatOverrides(
  file: EnemyCombatOverridesFile | null,
): void {
  runtime = file;
}

function activeFile(): EnemyCombatOverridesFile {
  return runtime ?? {
    version: embedded.version ?? 1,
    updatedAt: embedded.updatedAt ?? null,
    identities: embedded.identities ?? {},
    monsterSkills: embedded.monsterSkills ?? {},
  };
}

export function normalizeEnemyIdentityOverride(
  input: EnemyIdentityOverride | null | undefined,
): EnemyIdentityOverride | null {
  if (!input || typeof input !== 'object') return null;
  const next: EnemyIdentityOverride = {};
  for (const key of IDENTITY_KEYS) {
    const value = finiteNumber(input[key]);
    if (value !== undefined) next[key] = value;
  }
  return Object.keys(next).length > 0 ? next : null;
}

export function normalizeEnemyMonsterSkillOverride(
  input: EnemyMonsterSkillOverride | null | undefined,
): EnemyMonsterSkillOverride | null {
  return normalizeSkillCombatOverride(input);
}

export function getEnemyIdentityOverride(
  enemyType: string,
): EnemyIdentityOverride | null {
  return normalizeEnemyIdentityOverride(
    activeFile().identities[enemyType as EnemyType],
  );
}

export function getEnemyMonsterSkillOverride(
  skillId: string,
): EnemyMonsterSkillOverride | null {
  return normalizeEnemyMonsterSkillOverride(activeFile().monsterSkills[skillId]);
}

export function applyEnemyIdentityOverride(
  identity: CombatantIdentity,
  override?: EnemyIdentityOverride | null,
): CombatantIdentity {
  const patch =
    arguments.length >= 2
      ? normalizeEnemyIdentityOverride(override)
      : null;
  if (!patch) return identity;
  return { ...identity, ...patch };
}

export function applyEnemyMonsterSkillOverride(
  skill: CombatSkillDefinition,
  override?: EnemyMonsterSkillOverride | null,
): CombatSkillDefinition {
  const patch =
    arguments.length >= 2
      ? normalizeEnemyMonsterSkillOverride(override)
      : getEnemyMonsterSkillOverride(skill.skillId);
  return applySkillCombatOverride(skill, patch);
}

export function normalizeEnemyCombatOverridesFile(
  input: unknown,
): EnemyCombatOverridesFile {
  const empty = emptyFile();
  if (!input || typeof input !== 'object') return empty;
  const raw = input as Record<string, unknown>;
  const identities: EnemyCombatOverridesFile['identities'] = {};
  const monsterSkills: EnemyCombatOverridesFile['monsterSkills'] = {};

  if (raw.identities && typeof raw.identities === 'object') {
    for (const [enemyType, value] of Object.entries(
      raw.identities as Record<string, unknown>,
    )) {
      const normalized = normalizeEnemyIdentityOverride(
        value as EnemyIdentityOverride,
      );
      if (normalized) identities[enemyType as EnemyType] = normalized;
    }
  }

  if (raw.monsterSkills && typeof raw.monsterSkills === 'object') {
    for (const [skillId, value] of Object.entries(
      raw.monsterSkills as Record<string, unknown>,
    )) {
      const normalized = normalizeEnemyMonsterSkillOverride(
        value as EnemyMonsterSkillOverride,
      );
      if (normalized) monsterSkills[skillId] = normalized;
    }
  }

  return {
    version: typeof raw.version === 'number' ? raw.version : 1,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : null,
    identities,
    monsterSkills,
  };
}
