import { getCooldownSeconds } from '../../src/domain/combat/SkillCooldownTiming';
import {
  DAMAGE_ELEMENT_LABELS,
  DamageElement,
} from '../../src/domain/combat/DamageElement';
import {
  ElementalDamageFlatProfile,
  ZERO_ELEMENTAL_DAMAGE_FLAT,
} from '../../src/domain/combat/ElementalDamageFlatProfile';
import {
  ElementalDamageProfile,
  ZERO_ELEMENTAL_DAMAGE,
} from '../../src/domain/combat/ElementalDamageProfile';
import {
  applyResistancePenetration,
  ElementalPenetrationProfile,
  ZERO_ELEMENTAL_PENETRATION,
} from '../../src/domain/combat/ElementalPenetrationProfile';
import { estimateAttackerOutgoingPower } from '../../src/domain/combat/DamageThroughputEstimate';
import { resolveMultiComponentDamage } from '../../src/domain/combat/MitigationPipeline';
import {
  ResistanceProfile,
  ZERO_RESISTANCES,
} from '../../src/domain/combat/ResistanceProfile';
import { resolveEnemyInnateResists } from '../../src/domain/enemies/EnemyInnateResists';
import { EnemyType } from '../../src/domain/entities/EnemyType';
import {
  applyPercentBonus,
  isTreeDamageSkill,
} from '../../src/domain/passives/PassiveModifiers';
import { getSkillById, getSkillsForHero } from '../../src/domain/progression/SkillCatalog';
import { AttributeKey } from '../../src/domain/progression/Attributes';
import { BASIC_ATTACK_SKILL } from '../../src/domain/progression/combat/BasicAttackSkill';
import { CombatSkillDefinition } from '../../src/domain/progression/combat/CombatSkillDefinition';
import { listEnemyCombatSkillsByType } from '../../src/domain/progression/combat/EnemyCombatSkillCatalog';
import { getHeroCombatSkill } from '../../src/domain/progression/combat/HeroCombatSkillCatalog';
import { isDamageCombatKind } from '../../src/domain/progression/combat/SkillCombatKind';
import {
  applyHeroDamageSkillPower,
  calculateHeroSkillRawPower,
  resolveDamageSkillAttackFloor,
} from '../../src/domain/progression/combat/SkillDamageBalance';
import { LabBreakdownSection, LabCombatantInput } from './types';
import { resolveLabIdentity } from './identity';
import { sumPassiveBonuses } from './passives';

export const ELEMENT_KEYS = ['fire', 'cold', 'lightning', 'air'] as const;
export type LabElementKey = (typeof ELEMENT_KEYS)[number];

/** Rank padrão no lab (sem árvore de ranks editável ainda). */
export const LAB_DEFAULT_SKILL_RANK = 1;

export function zeroResists(): ResistanceProfile {
  return { ...ZERO_RESISTANCES };
}

export function zeroElemPercent(): ElementalDamageProfile {
  return { ...ZERO_ELEMENTAL_DAMAGE };
}

export function zeroElemFlat(): ElementalDamageFlatProfile {
  return { ...ZERO_ELEMENTAL_DAMAGE_FLAT };
}

export function zeroPenetration(): ElementalPenetrationProfile {
  return { ...ZERO_ELEMENTAL_PENETRATION };
}

export function defaultEnemyResists(enemyType: string, level: number): ResistanceProfile {
  const tier = Math.max(1, Math.ceil(level / 10));
  return resolveEnemyInnateResists(enemyType, tier, null);
}

export function mergeResists(partial?: Partial<ResistanceProfile> | null): ResistanceProfile {
  return { ...ZERO_RESISTANCES, ...(partial ?? {}) };
}

export function mergeElemPercent(
  partial?: Partial<ElementalDamageProfile> | null,
): ElementalDamageProfile {
  return { ...ZERO_ELEMENTAL_DAMAGE, ...(partial ?? {}) };
}

export function mergeElemFlat(
  partial?: Partial<ElementalDamageFlatProfile> | null,
): ElementalDamageFlatProfile {
  return { ...ZERO_ELEMENTAL_DAMAGE_FLAT, ...(partial ?? {}) };
}

export function mergePenetration(
  partial?: Partial<ElementalPenetrationProfile> | null,
): ElementalPenetrationProfile {
  return { ...ZERO_ELEMENTAL_PENETRATION, ...(partial ?? {}) };
}

function attrValue(input: LabCombatantInput, key: AttributeKey): number {
  return key === 'str' ? input.str : key === 'dex' ? input.dex : input.int;
}

/** Skills de dano disponíveis para o combatente (classe/ascensão ou roster inimigo). */
export function listLabDamageSkills(input: LabCombatantInput): CombatSkillDefinition[] {
  if (input.kind === 'hero') {
    const heroClass = input.heroClass ?? 'knight';
    const catalogSkills = getSkillsForHero(heroClass, input.ascensionId ?? null);
    const fromClass = catalogSkills
      .map((def) => getHeroCombatSkill(def.id))
      .filter((skill): skill is CombatSkillDefinition => Boolean(skill))
      .filter((skill) => isDamageCombatKind(skill.kind));

    const byId = new Map<string, CombatSkillDefinition>();
    byId.set(BASIC_ATTACK_SKILL.skillId, BASIC_ATTACK_SKILL);
    for (const skill of fromClass) {
      byId.set(skill.skillId, skill);
    }
    return Array.from(byId.values());
  }

  return listEnemyCombatSkillsByType((input.enemyType ?? 'goblin_raider') as EnemyType).filter(
    (skill) => isDamageCombatKind(skill.kind) || skill.usesAttackStat,
  );
}

function skillDisplayName(skillId: string): string {
  return getSkillById(skillId)?.name ?? skillId;
}

function dominantElement(skill: CombatSkillDefinition): DamageElement {
  const components = skill.damageComponents ?? [];
  if (!components.length) return 'physical';
  return components.reduce((best, cur) => (cur.weight > best.weight ? cur : best)).element;
}

function labBasicRatio(input: LabCombatantInput): number {
  return resolveLabIdentity(input).basicAttackDamageRatio;
}

function resolveSkillRawPower(
  input: LabCombatantInput,
  skill: CombatSkillDefinition,
  attack: number,
  rank: number,
  treeDamagePercent: number,
): number {
  if (skill.usesAttackStat) {
    return Math.max(1, Math.floor(attack * labBasicRatio(input)));
  }

  const definition = getSkillById(skill.skillId);
  const scalingKey = (definition?.scaling ?? 'int') as AttributeKey;
  const raw = calculateHeroSkillRawPower(skill, rank, attrValue(input, scalingKey));
  let power = applyHeroDamageSkillPower(skill, raw, attack, labBasicRatio(input));
  if (isTreeDamageSkill(skill)) {
    power = applyPercentBonus(power, treeDamagePercent);
  }
  return power;
}

export interface LabSkillSample {
  skillId: string;
  name: string;
  element: DamageElement;
  elementLabel: string;
  rank: number;
  maxRank: number;
  basePower: number;
  powerPerRank: number;
  attributeFactor: number;
  scalingAttr: AttributeKey;
  attrValue: number;
  weight: number;
  elemPercent: number;
  elemFlat: number;
  /** Produto do catálogo após floor (antes do piso vs ataque básico). */
  catalogRaw: number;
  /** floor(ATK × ratio) — piso mínimo (padrão = ataque básico). */
  attackFloor: number;
  attackFloorRatio: number;
  /** true se o piso vs ATK está ditando o poder. */
  cappedByAttackFloor: boolean;
  rawPower: number;
  outgoing: number;
  mitigatedVsSelf: number;
  /** Equação só com números (raw → outgoing → vs si). */
  appliedEquation: string;
  usesAttackStat: boolean;
  actionRecoverySeconds: number;
  cooldownTurns: number;
  skillCooldownTurnSeconds: number;
  cooldownSecondsPerRank: number;
  baseCooldownSeconds: number;
  effectiveCooldownSeconds: number;
  maxCooldownReduction: number;
  minCooldownReduction: number;
}

function fmtLabNum(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return '?';
  if (Number.isInteger(value)) return String(value);
  const fixed = value.toFixed(digits).replace(/\.?0+$/, '');
  return fixed.replace('.', ',');
}

function buildSkillAppliedEquation(args: {
  skill: CombatSkillDefinition;
  input: LabCombatantInput;
  attack: number;
  defense: number;
  rank: number;
  treeDamagePercent: number;
  rawPower: number;
  outgoing: number;
  mitigatedVsSelf: number;
  elemPct: ElementalDamageProfile;
  elemFlat: ElementalDamageFlatProfile;
  pen: ElementalPenetrationProfile;
  physPct: number;
  resists: ResistanceProfile;
}): string {
  const {
    skill,
    input,
    attack,
    defense,
    rank,
    treeDamagePercent,
    rawPower,
    outgoing,
    mitigatedVsSelf,
    elemPct,
    elemFlat,
    pen,
    physPct,
    resists,
  } = args;
  const n = fmtLabNum;
  const components = skill.damageComponents ?? [
    { element: 'physical' as const, delivery: 'melee' as const, weight: 1 },
  ];

  let rawEq: string;
  if (skill.usesAttackStat) {
    rawEq = `floor(${n(attack)}×${n(labBasicRatio(input))}) = ${n(rawPower)}`;
  } else {
    const definition = getSkillById(skill.skillId);
    const scalingKey = (definition?.scaling ?? 'int') as AttributeKey;
    const attr = attrValue(input, scalingKey);
    const product =
      Math.max(0, skill.basePower) *
      Math.max(0, skill.powerPerRank) *
      Math.max(1, rank) *
      Math.max(0, attr) *
      Math.max(0, skill.attributeFactor);
    const afterFloor = Math.max(1, Math.floor(product));
    rawEq = `floor(${n(skill.basePower)}×(${n(skill.powerPerRank)}×${n(rank)})×(${n(attr)}×${n(skill.attributeFactor)})) = ${n(afterFloor)}`;
    if (isTreeDamageSkill(skill) && treeDamagePercent !== 0) {
      rawEq += ` · floor(${n(afterFloor)}×(1+${n(treeDamagePercent)}/100))`;
    }
    const atkFloor = resolveDamageSkillAttackFloor(skill, attack, labBasicRatio(input));
    const floorRatio = skill.minAttackRatio ?? labBasicRatio(input);
    rawEq += ` · max(..., floor(${n(attack)}×${n(floorRatio)}=${n(atkFloor)}))`;
    rawEq += ` = ${n(rawPower)}`;
  }

  const outParts = components.map((component) => {
    const pct =
      component.element === 'physical'
        ? physPct
        : elemPct[component.element] + elemPct.allElemental;
    const flat =
      component.element === 'physical' ? 0 : elemFlat[component.element as LabElementKey] ?? 0;
    return `${n(rawPower)}×${n(component.weight)}×(1+[${n(pct)}]/100)+${n(flat)}`;
  });
  const outEq =
    outParts.length === 1
      ? `floor(${outParts[0]}) = ${n(outgoing)}`
      : `floor(${outParts.join(' + ')}) = ${n(outgoing)}`;

  const primary = components.reduce((best, cur) => (cur.weight > best.weight ? cur : best));
  const pctPrimary =
    primary.element === 'physical'
      ? physPct
      : elemPct[primary.element] + elemPct.allElemental;
  const flatPrimary =
    primary.element === 'physical' ? 0 : elemFlat[primary.element as LabElementKey] ?? 0;
  const portion =
    rawPower * primary.weight * (1 + pctPrimary / 100) + flatPrimary * primary.weight;

  let vsEq: string;
  if (primary.element === 'physical') {
    const stageLevel = Math.max(1, input.level);
    const threshold = 14 * stageLevel + 12;
    vsEq = `floor(${n(portion)} × (1 − armadura(${n(defense)}, lv ${n(stageLevel)}, thr ${n(threshold)}))) = ${n(mitigatedVsSelf)}`;
  } else {
    const baseRes = resists[primary.element] + resists.allElemental;
    const penPct = pen[primary.element] + pen.allElemental;
    const effRes = applyResistancePenetration(baseRes, penPct);
    vsEq =
      effRes >= 0
        ? `floor(${n(portion)}×(1−${n(effRes)}/100)) = ${n(mitigatedVsSelf)}`
        : `floor(${n(portion)}×(1+${n(Math.abs(effRes))}/100)) = ${n(mitigatedVsSelf)}`;
  }

  return `raw ${rawEq} · out ${outEq} · vs si ${vsEq}`;
}

/** Amostra por skill de dano da classe / inimigo (não usa ATK como proxy genérico). */
export function sampleElementalHits(
  input: LabCombatantInput,
  attack: number,
  defense: number,
  skillRank: number = LAB_DEFAULT_SKILL_RANK,
): {
  samples: LabSkillSample[];
  resistBreakdown: LabBreakdownSection;
  attackBreakdown: LabBreakdownSection;
} {
  const resists = mergeResists(input.resists);
  const elemPct = mergeElemPercent(input.elementalDamagePercent);
  const elemFlat = mergeElemFlat(input.elementalDamageFlat);
  const pen = mergePenetration(input.elementalPenetration);
  const physPct = input.physicalDamagePercent ?? 0;
  const rank = Math.max(1, Math.floor(skillRank));
  const passives = sumPassiveBonuses(input.kind === 'hero' ? input.passives : [], {
    level: Math.max(1, input.level),
    str: input.str,
    dex: input.dex,
    int: input.int,
  });

  const targetSelf = {
    armor: defense,
    stageLevel: Math.max(1, input.level),
    resistances: resists,
  };

  const skills = listLabDamageSkills(input);
  const identity = resolveLabIdentity(input);
  const samples: LabSkillSample[] = skills.map((skill) => {
    const definition = getSkillById(skill.skillId);
    const maxRank = definition?.maxRank ?? 3;
    const effectiveRank = Math.min(rank, maxRank);
    const scalingAttr = (definition?.scaling ?? 'int') as AttributeKey;
    const attr = attrValue(input, scalingAttr);
    const catalogProduct = skill.usesAttackStat
      ? Math.max(1, Math.floor(attack * labBasicRatio(input)))
      : Math.max(1, Math.floor(calculateHeroSkillRawPower(skill, effectiveRank, attr)));
    const attackFloor = skill.usesAttackStat
      ? catalogProduct
      : resolveDamageSkillAttackFloor(skill, attack, labBasicRatio(input));
    const attackFloorRatio = skill.usesAttackStat
      ? labBasicRatio(input)
      : (skill.minAttackRatio ?? labBasicRatio(input));
    const rawPower = resolveSkillRawPower(
      input,
      skill,
      attack,
      effectiveRank,
      passives.treeDamagePercent,
    );
    const cappedByAttackFloor = !skill.usesAttackStat && catalogProduct < attackFloor;
    const components = skill.damageComponents ?? [
      { element: 'physical' as const, delivery: 'melee' as const, weight: 1 },
    ];
    const outgoing = Math.max(
      0,
      Math.floor(
        estimateAttackerOutgoingPower(rawPower, components, elemPct, elemFlat, physPct),
      ),
    );
    const mitigatedVsSelf = resolveMultiComponentDamage(
      rawPower,
      components,
      targetSelf,
      elemPct,
      elemFlat,
      physPct,
      pen,
    );
    const turnSeconds = identity.skillCooldownTurnSeconds;
    const baseCooldownSeconds = getCooldownSeconds(skill, { rank: 1, turnSeconds });
    const effectiveCooldownSeconds = getCooldownSeconds(skill, {
      rank: effectiveRank,
      turnSeconds,
    });
    const element = dominantElement(skill);
    const primary = components.reduce((best, cur) => (cur.weight > best.weight ? cur : best));
    const elemPercent =
      primary.element === 'physical'
        ? physPct
        : elemPct[primary.element] + elemPct.allElemental;
    const flat =
      primary.element === 'physical' ? 0 : elemFlat[primary.element as LabElementKey] ?? 0;
    return {
      skillId: skill.skillId,
      name: skillDisplayName(skill.skillId),
      element,
      elementLabel: DAMAGE_ELEMENT_LABELS[element],
      rank: effectiveRank,
      maxRank,
      basePower: skill.basePower,
      powerPerRank: skill.powerPerRank,
      attributeFactor: skill.attributeFactor,
      scalingAttr,
      attrValue: attr,
      weight: primary.weight,
      elemPercent,
      elemFlat: flat,
      catalogRaw: catalogProduct,
      attackFloor,
      attackFloorRatio,
      cappedByAttackFloor,
      rawPower,
      outgoing,
      mitigatedVsSelf,
      usesAttackStat: Boolean(skill.usesAttackStat),
      actionRecoverySeconds: skill.actionRecoverySeconds ?? 0,
      cooldownTurns: skill.cooldownTurns,
      skillCooldownTurnSeconds: turnSeconds,
      cooldownSecondsPerRank: skill.cooldownSecondsPerRank ?? 0,
      baseCooldownSeconds,
      effectiveCooldownSeconds,
      maxCooldownReduction: skill.maxCooldownReduction ?? 0,
      minCooldownReduction: skill.minCooldownReduction ?? 0,
      appliedEquation: buildSkillAppliedEquation({
        skill,
        input,
        attack,
        defense,
        rank: effectiveRank,
        treeDamagePercent: passives.treeDamagePercent,
        rawPower,
        outgoing,
        mitigatedVsSelf,
        elemPct,
        elemFlat,
        pen,
        physPct,
        resists,
      }),
    };
  });

  const resistBreakdown: LabBreakdownSection = {
    finalLabel: 'Resists',
    finalValue: `F${resists.fire}/G${resists.cold}/R${resists.lightning}/A${resists.air}`,
    appliedEquation: `Resist efetiva (Fogo) = (${resists.fire} + ${resists.allElemental}) × (1 − [${pen.fire} + ${pen.allElemental}]/100)`,
    steps: [
      {
        label: 'Fogo',
        detail: `${resists.fire}%`,
        note: 'Resistência a dano de fogo (+ all elemental)',
      },
      {
        label: 'Gelo',
        detail: `${resists.cold}%`,
        note: 'Resistência a cold',
      },
      {
        label: 'Raio',
        detail: `${resists.lightning}%`,
        note: 'Resistência a lightning',
      },
      {
        label: 'Ar',
        detail: `${resists.air}%`,
        note: 'Resistência a air',
      },
      {
        label: 'All elemental',
        detail: `${resists.allElemental}%`,
        note: 'Soma em todos os elementos (não físico)',
      },
      ...samples.map((s) => ({
        label: `${s.name} vs si`,
        detail: String(s.mitigatedVsSelf),
        note: `raw ${s.rawPower} (${s.elementLabel}) após resist/DEF`,
      })),
    ],
  };

  const attackBreakdown: LabBreakdownSection = {
    finalLabel: 'Skills',
    finalValue: `${samples.length} dmg`,
    appliedEquation:
      samples.length > 0
        ? samples
            .slice(0, 3)
            .map((s) => `${s.name}: raw ${s.rawPower} → out ${s.outgoing}`)
            .join(' · ')
        : 'Sem skills de dano nesta classe/inimigo',
    steps: [
      {
        label: 'Fonte',
        detail: input.kind === 'hero' ? `Classe ${input.heroClass}` : `Inimigo ${input.enemyType}`,
        note: `Rank lab = ${rank} (editável no dropdown)`,
      },
      {
        label: 'Dano % físico',
        detail: `+${physPct}%`,
        note: 'Só componente physical',
      },
      ...ELEMENT_KEYS.map((key) => ({
        label: `Dano % ${DAMAGE_ELEMENT_LABELS[key]}`,
        detail: `+${elemPct[key]}%`,
        note: `+ all ${elemPct.allElemental}%`,
      })),
      ...samples.map((s) => ({
        label: s.name,
        detail: `out ${s.outgoing}`,
        note: `raw ${s.rawPower} · ${s.elementLabel} · rank ${s.rank}`,
      })),
    ],
  };

  return { samples, resistBreakdown, attackBreakdown };
}
