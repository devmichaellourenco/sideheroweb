import type { CombatantIdentity } from '../combat/CombatantIdentity';
import type { HeroClass } from '../entities/HeroClass';
import type { PassiveDefinition, PassiveEffect, PassiveId } from '../passives/PassiveTypes';
import type { ClassAscension } from './ClassAscension';
import type { CombatSkillDefinition } from './combat/CombatSkillDefinition';
import type { ProgressionRequirement } from './ProgressionRequirement';
import type { AscensionId } from './SkillId';
import staticOverrides from './data/hero-combat-overrides.json';

const SKILL_NUMBER_KEYS = [
  'basePower',
  'powerPerRank',
  'attributeFactor',
  'cooldownTurns',
  'initialCooldown',
  'actionRecoverySeconds',
  'cooldownSecondsPerRank',
  'maxCooldownReduction',
  'minCooldownReduction',
  'usePriority',
  'healConditionThreshold',
  'effectDurationTurns',
  'minAttackRatio',
] as const;

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

const PASSIVE_NUMBER_KEYS = [
  'percentPerPoint',
  'percentPerLevel',
  'percent',
] as const;

export type HeroSkillCombatOverride = Partial<
  Pick<CombatSkillDefinition, (typeof SKILL_NUMBER_KEYS)[number]>
> & {
  onHitDotDamagePerTurn?: number;
  onHitDotDurationTurns?: number;
  onHitDotApplyChance?: number;
};

export type HeroIdentityOverride = Partial<CombatantIdentity>;

export type HeroPassiveEffectOverride = Partial<
  Record<(typeof PASSIVE_NUMBER_KEYS)[number], number>
>;

export interface HeroPassiveOverride {
  effects?: HeroPassiveEffectOverride[];
}

/** Patch numérico de um requisito (índice alinhado ao array do catálogo). */
export interface HeroAscensionReqOverride {
  min?: number;
  minRank?: number;
}

export interface HeroAscensionOverride {
  pointsGranted?: number;
  name?: string;
  description?: string;
  pathLabel?: string;
  requirements?: HeroAscensionReqOverride[];
}

export interface HeroBaseStats {
  attack: number;
  defense: number;
  health: number;
}

export type HeroBaseStatsOverride = Partial<HeroBaseStats>;

const BASE_STATS_KEYS = ['attack', 'defense', 'health'] as const;

export interface HeroCombatOverridesFile {
  version: number;
  updatedAt: string | null;
  skills: Record<string, HeroSkillCombatOverride>;
  identities: Partial<Record<HeroClass, HeroIdentityOverride>>;
  baseStats: Partial<Record<HeroClass, HeroBaseStatsOverride>>;
  passives: Partial<Record<PassiveId, HeroPassiveOverride>>;
  ascensions: Partial<Record<AscensionId, HeroAscensionOverride>>;
}

const embedded = staticOverrides as HeroCombatOverridesFile;

let runtime: HeroCombatOverridesFile | null = null;

function emptyFile(): HeroCombatOverridesFile {
  return {
    version: 1,
    updatedAt: null,
    skills: {},
    identities: {},
    baseStats: {},
    passives: {},
    ascensions: {},
  };
}

export function getEmbeddedHeroCombatOverrides(): HeroCombatOverridesFile {
  return {
    version: embedded.version ?? 1,
    updatedAt: embedded.updatedAt ?? null,
    skills: { ...(embedded.skills ?? {}) },
    identities: { ...(embedded.identities ?? {}) },
    baseStats: { ...(embedded.baseStats ?? {}) },
    passives: { ...(embedded.passives ?? {}) },
    ascensions: { ...(embedded.ascensions ?? {}) },
  };
}

export function setRuntimeHeroCombatOverrides(
  file: HeroCombatOverridesFile | null,
): void {
  runtime = file;
}

function activeFile(): HeroCombatOverridesFile {
  return runtime ?? {
    version: embedded.version ?? 1,
    updatedAt: embedded.updatedAt ?? null,
    skills: embedded.skills ?? {},
    identities: embedded.identities ?? {},
    baseStats: embedded.baseStats ?? {},
    passives: embedded.passives ?? {},
    ascensions: embedded.ascensions ?? {},
  };
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export function normalizeSkillCombatOverride(
  input: HeroSkillCombatOverride | null | undefined,
): HeroSkillCombatOverride | null {
  if (!input || typeof input !== 'object') return null;
  const next: HeroSkillCombatOverride = {};
  for (const key of SKILL_NUMBER_KEYS) {
    const value = finiteNumber(input[key]);
    if (value !== undefined) next[key] = value;
  }
  const dotDamage = finiteNumber(input.onHitDotDamagePerTurn);
  const dotDuration = finiteNumber(input.onHitDotDurationTurns);
  const dotChance = finiteNumber(input.onHitDotApplyChance);
  if (dotDamage !== undefined) next.onHitDotDamagePerTurn = dotDamage;
  if (dotDuration !== undefined) next.onHitDotDurationTurns = Math.max(1, Math.floor(dotDuration));
  if (dotChance !== undefined) next.onHitDotApplyChance = dotChance;
  return Object.keys(next).length > 0 ? next : null;
}

export function normalizeIdentityOverride(
  input: HeroIdentityOverride | null | undefined,
): HeroIdentityOverride | null {
  if (!input || typeof input !== 'object') return null;
  const next: HeroIdentityOverride = {};
  for (const key of IDENTITY_KEYS) {
    const value = finiteNumber(input[key]);
    if (value !== undefined) next[key] = value;
  }
  return Object.keys(next).length > 0 ? next : null;
}

export function normalizeBaseStatsOverride(
  input: HeroBaseStatsOverride | null | undefined,
): HeroBaseStatsOverride | null {
  if (!input || typeof input !== 'object') return null;
  const next: HeroBaseStatsOverride = {};
  for (const key of BASE_STATS_KEYS) {
    const value = finiteNumber(input[key]);
    if (value !== undefined) next[key] = Math.max(0, Math.floor(value));
  }
  return Object.keys(next).length > 0 ? next : null;
}

export function normalizePassiveOverride(
  input: HeroPassiveOverride | null | undefined,
): HeroPassiveOverride | null {
  if (!input || typeof input !== 'object' || !Array.isArray(input.effects)) return null;
  const effects = input.effects.map((effect) => {
    const next: HeroPassiveEffectOverride = {};
    for (const key of PASSIVE_NUMBER_KEYS) {
      const value = finiteNumber(effect?.[key]);
      if (value !== undefined) next[key] = value;
    }
    return next;
  });
  if (effects.every((effect) => Object.keys(effect).length === 0)) return null;
  return { effects };
}

function normalizeReqOverride(
  input: HeroAscensionReqOverride | null | undefined,
): HeroAscensionReqOverride | null {
  if (!input || typeof input !== 'object') return null;
  const next: HeroAscensionReqOverride = {};
  const min = finiteNumber(input.min);
  const minRank = finiteNumber(input.minRank);
  if (min !== undefined) next.min = Math.max(0, Math.floor(min));
  if (minRank !== undefined) next.minRank = Math.max(0, Math.floor(minRank));
  return Object.keys(next).length > 0 ? next : null;
}

export function normalizeAscensionOverride(
  input: HeroAscensionOverride | null | undefined,
): HeroAscensionOverride | null {
  if (!input || typeof input !== 'object') return null;
  const next: HeroAscensionOverride = {};
  const points = finiteNumber(input.pointsGranted);
  if (points !== undefined) next.pointsGranted = Math.max(0, Math.floor(points));
  if (typeof input.name === 'string' && input.name.trim()) next.name = input.name.trim();
  if (typeof input.description === 'string' && input.description.trim()) {
    next.description = input.description.trim();
  }
  if (typeof input.pathLabel === 'string' && input.pathLabel.trim()) {
    next.pathLabel = input.pathLabel.trim();
  }
  if (Array.isArray(input.requirements)) {
    const requirements = input.requirements.map((req) => normalizeReqOverride(req) ?? {});
    if (requirements.some((req) => Object.keys(req).length > 0)) {
      next.requirements = requirements;
    }
  }
  return Object.keys(next).length > 0 ? next : null;
}

export function getSkillCombatOverride(skillId: string): HeroSkillCombatOverride | null {
  return normalizeSkillCombatOverride(activeFile().skills[skillId]);
}

export function getIdentityOverride(heroClass: HeroClass): HeroIdentityOverride | null {
  return normalizeIdentityOverride(activeFile().identities[heroClass]);
}

export function getBaseStatsOverride(heroClass: HeroClass): HeroBaseStatsOverride | null {
  return normalizeBaseStatsOverride(activeFile().baseStats[heroClass]);
}

export function getPassiveOverride(id: PassiveId): HeroPassiveOverride | null {
  return normalizePassiveOverride(activeFile().passives[id]);
}

export function getAscensionOverride(id: AscensionId): HeroAscensionOverride | null {
  return normalizeAscensionOverride(activeFile().ascensions[id]);
}

export function applySkillCombatOverride(
  skill: CombatSkillDefinition,
  override?: HeroSkillCombatOverride | null,
): CombatSkillDefinition {
  const patch =
    arguments.length >= 2
      ? normalizeSkillCombatOverride(override)
      : getSkillCombatOverride(skill.skillId);
  if (!patch) return skill;

  const next: CombatSkillDefinition = { ...skill };
  for (const key of SKILL_NUMBER_KEYS) {
    const value = patch[key];
    if (value !== undefined) {
      (next as Record<string, unknown>)[key] = value;
    }
  }

  if (next.onHitDot) {
    next.onHitDot = {
      ...next.onHitDot,
      damagePerTurn: patch.onHitDotDamagePerTurn ?? next.onHitDot.damagePerTurn,
      durationTurns: patch.onHitDotDurationTurns ?? next.onHitDot.durationTurns,
      applyChance: patch.onHitDotApplyChance ?? next.onHitDot.applyChance,
    };
  }

  return next;
}

export function applyIdentityOverride(
  identity: CombatantIdentity,
  heroClass: HeroClass,
  override?: HeroIdentityOverride | null,
): CombatantIdentity {
  const patch =
    arguments.length >= 3
      ? normalizeIdentityOverride(override)
      : getIdentityOverride(heroClass);
  if (!patch) return identity;
  return { ...identity, ...patch };
}

export function applyBaseStatsOverride(
  stats: HeroBaseStats,
  override?: HeroBaseStatsOverride | null,
): HeroBaseStats {
  const patch = normalizeBaseStatsOverride(override);
  if (!patch) return { ...stats };
  return {
    attack: patch.attack ?? stats.attack,
    defense: patch.defense ?? stats.defense,
    health: patch.health ?? stats.health,
  };
}

export function applyPassiveOverride(
  definition: PassiveDefinition,
  override?: HeroPassiveOverride | null,
): PassiveDefinition {
  const patch =
    arguments.length >= 2
      ? normalizePassiveOverride(override)
      : getPassiveOverride(definition.id);
  if (!patch?.effects) return definition;

  const effects = definition.effects.map((effect, index) => {
    const numbers = patch.effects?.[index];
    if (!numbers || Object.keys(numbers).length === 0) return effect;
    const next = { ...effect } as PassiveEffect & Record<string, number>;
    for (const key of PASSIVE_NUMBER_KEYS) {
      if (numbers[key] !== undefined && key in next) {
        next[key] = numbers[key]!;
      }
    }
    return next;
  });

  return { ...definition, effects };
}

function applyRequirementPatch(
  req: ProgressionRequirement,
  patch: HeroAscensionReqOverride | null | undefined,
): ProgressionRequirement {
  if (!patch || Object.keys(patch).length === 0) return req;
  if (req.type === 'hero_level' && patch.min !== undefined) {
    return { ...req, min: patch.min };
  }
  if (req.type === 'attribute' && patch.min !== undefined) {
    return { ...req, min: patch.min };
  }
  if (req.type === 'skill_rank' && patch.minRank !== undefined) {
    return { ...req, minRank: patch.minRank };
  }
  return req;
}

export function applyAscensionOverride(
  definition: ClassAscension,
  override?: HeroAscensionOverride | null,
): ClassAscension {
  const patch =
    arguments.length >= 2
      ? normalizeAscensionOverride(override)
      : getAscensionOverride(definition.id);
  if (!patch) return definition;

  const requirements = definition.requirements.map((req, index) =>
    applyRequirementPatch(req, patch.requirements?.[index]),
  );

  return {
    ...definition,
    pointsGranted: patch.pointsGranted ?? definition.pointsGranted,
    name: patch.name ?? definition.name,
    description: patch.description ?? definition.description,
    pathLabel: patch.pathLabel ?? definition.pathLabel,
    requirements,
  };
}

export { emptyFile as emptyHeroCombatOverridesFile };
