/**
 * Snapshot de skills / identidade / passivas / evoluções dos heróis para o Balance Lab.
 */
import {
  getCatalogHeroCombatIdentity,
} from '../../src/domain/combat/HeroCombatIdentityCatalog';
import {
  getCatalogHeroBaseStats,
} from '../../src/domain/combat/HeroBaseStatsCatalog';
import { HERO_CLASSES, type HeroClass } from '../../src/domain/entities/HeroClass';
import {
  ASCENSION_PASSIVE_IDS,
  BASE_CLASS_PASSIVE_IDS,
  getCatalogPassiveDefinition,
} from '../../src/domain/passives/PassiveCatalog';
import type { PassiveId } from '../../src/domain/passives/PassiveTypes';
import {
  CLASS_ASCENSION_CATALOG,
  getCatalogAscensionById,
} from '../../src/domain/progression/ClassAscensionCatalog';
import {
  applyAscensionOverride,
  applyBaseStatsOverride,
  applyIdentityOverride,
  applyPassiveOverride,
  applySkillCombatOverride,
  normalizeAscensionOverride,
  normalizeBaseStatsOverride,
  normalizeIdentityOverride,
  normalizePassiveOverride,
  normalizeSkillCombatOverride,
  setRuntimeHeroCombatOverrides,
  type HeroAscensionOverride,
  type HeroBaseStatsOverride,
  type HeroCombatOverridesFile,
  type HeroIdentityOverride,
  type HeroPassiveOverride,
  type HeroSkillCombatOverride,
} from '../../src/domain/progression/HeroCombatOverrides';
import type { ProgressionRequirement } from '../../src/domain/progression/ProgressionRequirement';
import {
  getCatalogHeroCombatSkill,
  HERO_COMBAT_SKILL_CATALOG,
} from '../../src/domain/progression/combat/HeroCombatSkillCatalog';
import { getSkillById, SKILL_CATALOG } from '../../src/domain/progression/SkillCatalog';
import type { AscensionId } from '../../src/domain/progression/SkillId';

export const HERO_CLASS_DISPLAY: Record<HeroClass, { name: string; classLabel: string }> = {
  sorcerer: { name: 'Nix', classLabel: 'Maga' },
  knight: { name: 'Galneon', classLabel: 'Cavaleiro' },
  priest: { name: 'Elara', classLabel: 'Sacerdotisa' },
  berserker: { name: 'Torius', classLabel: 'Berserker' },
  archer: { name: 'Rain', classLabel: 'Arqueira' },
  paladin: { name: 'Valerius', classLabel: 'Paladino' },
};

export const SKILL_EDIT_FIELDS = [
  { key: 'powerPerRank', label: 'powerPerRank', step: 1 },
  { key: 'basePower', label: 'basePower', step: 1 },
  { key: 'attributeFactor', label: 'attr ×', step: 0.01 },
  { key: 'cooldownTurns', label: 'CD turns', step: 1 },
  { key: 'initialCooldown', label: 'CD inicial', step: 1 },
  { key: 'actionRecoverySeconds', label: 'recovery s', step: 0.05 },
  { key: 'cooldownSecondsPerRank', label: 'CD −s/rank', step: 0.1 },
  { key: 'maxCooldownReduction', label: 'CDR teto', step: 0.05 },
  { key: 'minCooldownReduction', label: 'CDR piso', step: 0.05 },
  { key: 'usePriority', label: 'prioridade', step: 1 },
] as const;

export const IDENTITY_EDIT_FIELDS = [
  { key: 'basicAttackDamageRatio', label: 'básico ATK ×', step: 0.05 },
  { key: 'skillCooldownTurnSeconds', label: 's/turno CD', step: 0.1 },
  { key: 'attackSpeedFactor', label: 'ASPD fator', step: 0.01 },
  { key: 'attackPerLevel', label: 'ATK/nível', step: 1 },
  { key: 'defensePerLevel', label: 'DEF/nível', step: 1 },
  { key: 'healthPerLevel', label: 'HP/nível', step: 1 },
  { key: 'levelUpAttackGain', label: 'ATK no level-up', step: 1 },
  { key: 'levelUpDefenseGain', label: 'DEF no level-up', step: 1 },
  { key: 'levelUpHealthGain', label: 'HP no level-up', step: 1 },
] as const;

export const BASE_STATS_EDIT_FIELDS = [
  { key: 'attack', label: 'ATK base', step: 1 },
  { key: 'defense', label: 'DEF base', step: 1 },
  { key: 'health', label: 'HP base', step: 1 },
] as const;

export interface HeroSkillLabRow {
  skillId: string;
  name: string;
  kind: string;
  branch: string;
  heroClass: HeroClass | 'universal';
  pointType: string;
  hasDot: boolean;
  /** true = dano vem de ATK × identidade, não de basePower/powerPerRank. */
  usesAttackStat: boolean;
  baseline: Record<string, number>;
  effective: Record<string, number>;
  hasOverride: boolean;
}

export interface HeroIdentityLabRow {
  heroClass: HeroClass;
  baseline: Record<string, number>;
  effective: Record<string, number>;
  hasOverride: boolean;
}

export interface HeroBaseStatsLabRow {
  heroClass: HeroClass;
  baseline: Record<string, number>;
  effective: Record<string, number>;
  hasOverride: boolean;
}

export interface HeroPassiveLabRow {
  id: PassiveId;
  name: string;
  description: string;
  source: string;
  effects: Array<{ kind: string; fields: Record<string, number> }>;
  baselineEffects: Array<{ kind: string; fields: Record<string, number> }>;
  hasOverride: boolean;
}

export interface HeroAscensionReqLabField {
  index: number;
  type: ProgressionRequirement['type'];
  label: string;
  valueKey: 'min' | 'minRank';
  baselineValue: number;
  value: number;
}

export interface HeroAscensionLabRow {
  id: AscensionId;
  heroClass: HeroClass;
  name: string;
  baselineName: string;
  pathLabel: string;
  baselinePathLabel: string;
  description: string;
  baselineDescription: string;
  tier: number;
  prerequisiteAscensionId: AscensionId | null;
  pointsGranted: number;
  baselinePointsGranted: number;
  requirements: HeroAscensionReqLabField[];
  impact: {
    skills: Array<{ id: string; name: string }>;
    passive: { id: string; name: string } | null;
    cumulativePoints: number;
    pathTotalPoints: number;
    pathSkillCount: number;
  };
  hasOverride: boolean;
}

export interface HeroCombatLabHero {
  heroClass: HeroClass;
  name: string;
  classLabel: string;
  identity: HeroIdentityLabRow;
  baseStats: HeroBaseStatsLabRow;
  skills: HeroSkillLabRow[];
  passives: HeroPassiveLabRow[];
  ascensions: HeroAscensionLabRow[];
}

export interface HeroCombatLabPayload {
  heroes: HeroCombatLabHero[];
  universalSkills: HeroSkillLabRow[];
  skillFields: typeof SKILL_EDIT_FIELDS;
  identityFields: typeof IDENTITY_EDIT_FIELDS;
  baseStatsFields: typeof BASE_STATS_EDIT_FIELDS;
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
  healConditionThreshold?: number;
  effectDurationTurns?: number;
  onHitDot?: { damagePerTurn: number; durationTurns: number; applyChance?: number };
}): Record<string, number> {
  const numbers: Record<string, number> = {
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
  if (skill.healConditionThreshold !== undefined) {
    numbers.healConditionThreshold = skill.healConditionThreshold;
  }
  if (skill.effectDurationTurns !== undefined) {
    numbers.effectDurationTurns = skill.effectDurationTurns;
  }
  if (skill.onHitDot) {
    numbers.onHitDotDamagePerTurn = skill.onHitDot.damagePerTurn;
    numbers.onHitDotDurationTurns = skill.onHitDot.durationTurns;
    numbers.onHitDotApplyChance = skill.onHitDot.applyChance ?? 1;
  }
  return numbers;
}

function buildSkillRow(
  skillId: string,
  disk?: HeroSkillCombatOverride | null,
): HeroSkillLabRow | null {
  const catalog = getCatalogHeroCombatSkill(skillId);
  if (!catalog) return null;
  const meta = getSkillById(skillId);
  const effective = applySkillCombatOverride(catalog, disk ?? null);
  const usesAttackStat = Boolean(catalog.usesAttackStat);
  const numbers = skillNumbers(effective);
  const baselineNumbers = skillNumbers(catalog);
  // Ataque básico: power knobs não entram no dano — só timing/prioridade no lab.
  if (usesAttackStat) {
    for (const key of ['basePower', 'powerPerRank', 'attributeFactor'] as const) {
      delete numbers[key];
      delete baselineNumbers[key];
    }
  }
  return {
    skillId,
    name: meta?.name ?? skillId,
    kind: catalog.kind,
    branch: meta?.branch ?? 'offense',
    heroClass: meta?.heroClass ?? 'universal',
    pointType: meta?.pointType ?? 'improvement',
    hasDot: Boolean(catalog.onHitDot),
    usesAttackStat,
    baseline: baselineNumbers,
    effective: numbers,
    hasOverride: Boolean(normalizeSkillCombatOverride(disk)),
  };
}

function effectFields(
  effects: ReadonlyArray<{ kind: string } & Record<string, unknown>>,
): Array<{ kind: string; fields: Record<string, number> }> {
  return effects.map((effect) => {
    const fields: Record<string, number> = {};
    for (const [key, value] of Object.entries(effect)) {
      if (key !== 'kind' && typeof value === 'number') fields[key] = value;
    }
    return { kind: effect.kind, fields };
  });
}

function passivesForHero(
  heroClass: HeroClass,
  diskPassives: HeroCombatOverridesFile['passives'],
): HeroPassiveLabRow[] {
  const ids: Array<{ id: PassiveId; source: string }> = [
    { id: BASE_CLASS_PASSIVE_IDS[heroClass], source: 'classe' },
  ];
  for (const [ascensionId, passiveId] of Object.entries(ASCENSION_PASSIVE_IDS)) {
    if (ascensionId.startsWith(`${heroClass}_`)) {
      ids.push({ id: passiveId, source: ascensionId });
    }
  }

  return ids.map(({ id, source }) => {
    const baseline = getCatalogPassiveDefinition(id);
    const override = diskPassives[id];
    const effective = applyPassiveOverride(baseline, override ?? null);
    return {
      id,
      name: baseline.name,
      description: baseline.description,
      source,
      effects: effectFields(effective.effects),
      baselineEffects: effectFields(baseline.effects),
      hasOverride: Boolean(normalizePassiveOverride(override)),
    };
  });
}

function requirementLabel(req: ProgressionRequirement): string {
  if (req.type === 'hero_level') return `Nível ≥`;
  if (req.type === 'attribute') return `${req.key.toUpperCase()} ≥`;
  if (req.type === 'skill_rank') {
    const skillName = getSkillById(req.skillId)?.name ?? req.skillId;
    return `Rank ${skillName} ≥`;
  }
  if (req.type === 'ascension') {
    const name = getCatalogAscensionById(req.ascensionId)?.name ?? req.ascensionId;
    return `Ascensão: ${name}`;
  }
  if (req.type === 'hero_class') return `Classe: ${req.heroClass}`;
  return req.type;
}

function requirementFields(
  baselineReqs: ProgressionRequirement[],
  effectiveReqs: ProgressionRequirement[],
): HeroAscensionReqLabField[] {
  const fields: HeroAscensionReqLabField[] = [];
  for (let index = 0; index < baselineReqs.length; index += 1) {
    const base = baselineReqs[index]!;
    const eff = effectiveReqs[index] ?? base;
    if (base.type === 'hero_level' || base.type === 'attribute') {
      fields.push({
        index,
        type: base.type,
        label: requirementLabel(base),
        valueKey: 'min',
        baselineValue: base.min,
        value: eff.type === base.type ? eff.min : base.min,
      });
    } else if (base.type === 'skill_rank') {
      fields.push({
        index,
        type: base.type,
        label: requirementLabel(base),
        valueKey: 'minRank',
        baselineValue: base.minRank,
        value: eff.type === 'skill_rank' ? eff.minRank : base.minRank,
      });
    }
  }
  return fields;
}

function pathChainIds(ascensionId: AscensionId): AscensionId[] {
  const chain: AscensionId[] = [];
  let current: AscensionId | null = ascensionId;
  while (current) {
    chain.unshift(current);
    current = getCatalogAscensionById(current)?.prerequisiteAscensionId ?? null;
  }
  return chain;
}

function pathRootLabel(ascensionId: AscensionId): string {
  const rootId = pathChainIds(ascensionId)[0];
  const root = rootId ? getCatalogAscensionById(rootId) : undefined;
  return root?.pathLabel ?? 'Caminho';
}

function skillsForAscension(ascensionId: AscensionId): Array<{ id: string; name: string }> {
  return SKILL_CATALOG.filter((skill) => skill.ascensionId === ascensionId).map((skill) => ({
    id: skill.id,
    name: skill.name,
  }));
}

function ascensionsForHero(
  heroClass: HeroClass,
  diskAscensions: HeroCombatOverridesFile['ascensions'],
): HeroAscensionLabRow[] {
  const classEntries = CLASS_ASCENSION_CATALOG.filter((entry) => entry.heroClass === heroClass);
  const effectiveById = new Map(
    classEntries.map((entry) => {
      const override = diskAscensions[entry.id];
      return [entry.id, applyAscensionOverride(entry, override ?? null)] as const;
    }),
  );

  const pathTotals = new Map<string, number>();
  for (const entry of classEntries) {
    const key = pathRootLabel(entry.id);
    const points = effectiveById.get(entry.id)?.pointsGranted ?? entry.pointsGranted;
    pathTotals.set(key, (pathTotals.get(key) ?? 0) + points);
  }

  const pathSkillTotals = new Map<string, number>();
  for (const entry of classEntries) {
    const key = pathRootLabel(entry.id);
    pathSkillTotals.set(
      key,
      (pathSkillTotals.get(key) ?? 0) + skillsForAscension(entry.id).length,
    );
  }

  return classEntries.map((baseline) => {
    const override = diskAscensions[baseline.id];
    const effective = effectiveById.get(baseline.id)!;
    const chain = pathChainIds(baseline.id);
    const cumulativePoints = chain.reduce(
      (sum, id) => sum + (effectiveById.get(id)?.pointsGranted ?? 0),
      0,
    );
    const pathKey = pathRootLabel(baseline.id);
    const passiveId = ASCENSION_PASSIVE_IDS[baseline.id];
    const passive = passiveId
      ? {
          id: passiveId,
          name: getCatalogPassiveDefinition(passiveId).name,
        }
      : null;

    return {
      id: baseline.id,
      heroClass,
      name: effective.name,
      baselineName: baseline.name,
      pathLabel: effective.pathLabel ?? baseline.pathLabel ?? pathKey,
      baselinePathLabel: baseline.pathLabel ?? pathKey,
      description: effective.description,
      baselineDescription: baseline.description,
      tier: chain.length,
      prerequisiteAscensionId: baseline.prerequisiteAscensionId,
      pointsGranted: effective.pointsGranted,
      baselinePointsGranted: baseline.pointsGranted,
      requirements: requirementFields(baseline.requirements, effective.requirements),
      impact: {
        skills: skillsForAscension(baseline.id),
        passive,
        cumulativePoints,
        pathTotalPoints: pathTotals.get(pathKey) ?? effective.pointsGranted,
        pathSkillCount: pathSkillTotals.get(pathKey) ?? 0,
      },
      hasOverride: Boolean(normalizeAscensionOverride(override)),
    };
  });
}

export function buildHeroCombatLabPayload(filters?: {
  diskOverrides?: HeroCombatOverridesFile | null;
  updatedAt?: string | null;
}): HeroCombatLabPayload {
  const disk = filters?.diskOverrides ?? {
    version: 1,
    updatedAt: null,
    skills: {},
    identities: {},
    baseStats: {},
    passives: {},
    ascensions: {},
  };

  const universalSkills: HeroSkillLabRow[] = [];
  const skillsByClass: Record<HeroClass, HeroSkillLabRow[]> = {
    sorcerer: [],
    knight: [],
    priest: [],
    berserker: [],
    archer: [],
    paladin: [],
  };

  for (const skill of HERO_COMBAT_SKILL_CATALOG) {
    const row = buildSkillRow(skill.skillId, disk.skills[skill.skillId]);
    if (!row) continue;
    if (row.heroClass === 'universal') universalSkills.push(row);
    else skillsByClass[row.heroClass].push(row);
  }

  const heroes = HERO_CLASSES.map((heroClass) => {
    const baseline = getCatalogHeroCombatIdentity(heroClass);
    const override = disk.identities[heroClass];
    const effective = applyIdentityOverride(baseline, heroClass, override ?? null);
    const baseBaseline = getCatalogHeroBaseStats(heroClass);
    const baseOverride = disk.baseStats?.[heroClass];
    const baseEffective = applyBaseStatsOverride(baseBaseline, baseOverride ?? null);
    return {
      heroClass,
      ...HERO_CLASS_DISPLAY[heroClass],
      identity: {
        heroClass,
        baseline: { ...baseline },
        effective: { ...effective },
        hasOverride: Boolean(normalizeIdentityOverride(override)),
      },
      baseStats: {
        heroClass,
        baseline: { ...baseBaseline },
        effective: { ...baseEffective },
        hasOverride: Boolean(normalizeBaseStatsOverride(baseOverride)),
      },
      skills: skillsByClass[heroClass],
      passives: passivesForHero(heroClass, disk.passives),
      ascensions: ascensionsForHero(heroClass, disk.ascensions ?? {}),
    };
  });

  setRuntimeHeroCombatOverrides(null);

  return {
    heroes,
    universalSkills,
    skillFields: SKILL_EDIT_FIELDS,
    identityFields: IDENTITY_EDIT_FIELDS,
    baseStatsFields: BASE_STATS_EDIT_FIELDS,
    updatedAt: filters?.updatedAt ?? disk.updatedAt ?? null,
  };
}

export {
  normalizeAscensionOverride,
  normalizeBaseStatsOverride,
  normalizeIdentityOverride,
  normalizePassiveOverride,
  normalizeSkillCombatOverride,
  setRuntimeHeroCombatOverrides,
};
export type {
  HeroAscensionOverride,
  HeroBaseStatsOverride,
  HeroCombatOverridesFile,
  HeroIdentityOverride,
  HeroPassiveOverride,
  HeroSkillCombatOverride,
};
