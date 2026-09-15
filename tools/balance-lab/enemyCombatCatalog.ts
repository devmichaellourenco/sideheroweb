/**
 * Snapshot de identidade e skills de monstros para o Balance Lab.
 */
import {
  ENEMY_ROSTER,
  type EnemyRosterEntry,
  type EnemyType,
} from '../../src/domain/enemies/EnemyRosterCatalog';
import {
  getCatalogEnemyCombatIdentity,
} from '../../src/domain/enemies/EnemyCombatIdentityCatalog';
import {
  applyEnemyIdentityOverride,
  applyEnemyMonsterSkillOverride,
  getEmbeddedEnemyCombatOverrides,
  normalizeEnemyCombatOverridesFile,
  normalizeEnemyIdentityOverride,
  normalizeEnemyMonsterSkillOverride,
  setRuntimeEnemyCombatOverrides,
  type EnemyCombatOverridesFile,
  type EnemyIdentityOverride,
  type EnemyMonsterSkillOverride,
} from '../../src/domain/enemies/EnemyCombatOverrides';
import { ENEMY_MONSTER_COMBAT_SKILL_CATALOG } from '../../src/domain/progression/combat/EnemyMonsterCombatSkillCatalog';
import { enemySpriteUrlForLab } from './enemySprites';
import { IDENTITY_EDIT_FIELDS } from './heroCombatCatalog';

export const ENEMY_SKILL_EDIT_FIELDS = [
  { key: 'basePower', label: 'basePower', step: 1 },
  { key: 'powerPerRank', label: 'powerPerRank', step: 1 },
  { key: 'attributeFactor', label: 'attr ×', step: 0.01 },
  { key: 'cooldownTurns', label: 'CD turns', step: 1 },
  { key: 'initialCooldown', label: 'CD inicial', step: 1 },
  { key: 'actionRecoverySeconds', label: 'recovery s', step: 0.05 },
  { key: 'cooldownSecondsPerRank', label: 'CD −s/rank', step: 0.1 },
  { key: 'maxCooldownReduction', label: 'CDR teto', step: 0.05 },
  { key: 'minCooldownReduction', label: 'CDR piso', step: 0.05 },
  { key: 'usePriority', label: 'prioridade', step: 1 },
] as const;

export interface EnemyIdentityLabRow {
  enemyType: EnemyType;
  baseline: Record<string, number>;
  effective: Record<string, number>;
  hasOverride: boolean;
}

export interface EnemyMonsterSkillLabRow {
  skillId: string;
  kind: string;
  baseline: Record<string, number>;
  effective: Record<string, number>;
  hasOverride: boolean;
}

export interface EnemyLabEntry {
  enemyType: EnemyType;
  name: string;
  powerTier: number;
  rosterRole: string;
  spriteUrl: string;
  skillIds: readonly string[];
  identity: EnemyIdentityLabRow;
  monsterSkills: EnemyMonsterSkillLabRow[];
}

export interface EnemyCombatLabPayload {
  enemies: EnemyLabEntry[];
  identityFields: typeof IDENTITY_EDIT_FIELDS;
  skillFields: typeof ENEMY_SKILL_EDIT_FIELDS;
  updatedAt: string | null;
}

function skillNumbers(skill: {
  basePower: number;
  powerPerRank: number;
  attributeFactor: number;
  cooldownTurns: number;
  initialCooldown: number;
  actionRecoverySeconds?: number;
  cooldownSecondsPerRank?: number;
  maxCooldownReduction?: number;
  minCooldownReduction?: number;
  usePriority: number;
}): Record<string, number> {
  return {
    basePower: skill.basePower,
    powerPerRank: skill.powerPerRank,
    attributeFactor: skill.attributeFactor,
    cooldownTurns: skill.cooldownTurns,
    initialCooldown: skill.initialCooldown,
    actionRecoverySeconds: skill.actionRecoverySeconds ?? 0,
    cooldownSecondsPerRank: skill.cooldownSecondsPerRank ?? 0,
    maxCooldownReduction: skill.maxCooldownReduction ?? 0,
    minCooldownReduction: skill.minCooldownReduction ?? 0,
    usePriority: skill.usePriority,
  };
}

function buildMonsterSkillRows(
  roster: EnemyRosterEntry,
  diskMonsterSkills: EnemyCombatOverridesFile['monsterSkills'],
): EnemyMonsterSkillLabRow[] {
  const rows: EnemyMonsterSkillLabRow[] = [];
  for (const skillId of roster.skillIds) {
    const catalog = ENEMY_MONSTER_COMBAT_SKILL_CATALOG.find((s) => s.skillId === skillId);
    if (!catalog) continue;
    const override = diskMonsterSkills[skillId] ?? null;
    const effective = applyEnemyMonsterSkillOverride(catalog, override);
    rows.push({
      skillId,
      kind: catalog.kind,
      baseline: skillNumbers(catalog),
      effective: skillNumbers(effective),
      hasOverride: Boolean(normalizeEnemyMonsterSkillOverride(override)),
    });
  }
  return rows;
}

export function buildEnemyCombatLabPayload(filters?: {
  diskOverrides?: EnemyCombatOverridesFile | null;
  updatedAt?: string | null;
}): EnemyCombatLabPayload {
  const disk = filters?.diskOverrides ?? getEmbeddedEnemyCombatOverrides();

  setRuntimeEnemyCombatOverrides(null);

  const enemies: EnemyLabEntry[] = ENEMY_ROSTER.map((entry) => {
    const enemyType = entry.id as EnemyType;
    const catalogIdentity = getCatalogEnemyCombatIdentity(enemyType);
    const override = disk.identities[enemyType];
    const effectiveIdentity = applyEnemyIdentityOverride(catalogIdentity, override ?? null);

    return {
      enemyType,
      name: entry.name,
      powerTier: entry.powerTier,
      rosterRole: entry.rosterRole,
      spriteUrl: enemySpriteUrlForLab(entry.id),
      skillIds: entry.skillIds,
      identity: {
        enemyType,
        baseline: { ...catalogIdentity },
        effective: { ...effectiveIdentity },
        hasOverride: Boolean(normalizeEnemyIdentityOverride(override)),
      },
      monsterSkills: buildMonsterSkillRows(entry, disk.monsterSkills),
    };
  });

  return {
    enemies,
    identityFields: IDENTITY_EDIT_FIELDS,
    skillFields: ENEMY_SKILL_EDIT_FIELDS,
    updatedAt: filters?.updatedAt ?? disk.updatedAt ?? null,
  };
}

export {
  normalizeEnemyCombatOverridesFile,
  normalizeEnemyIdentityOverride,
  normalizeEnemyMonsterSkillOverride,
  setRuntimeEnemyCombatOverrides,
};
export type { EnemyCombatOverridesFile, EnemyIdentityOverride, EnemyMonsterSkillOverride };
