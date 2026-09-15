import {
  ASCENSION_PASSIVE_IDS,
  BASE_CLASS_PASSIVE_IDS,
  getPassiveDefinition,
} from '../../src/domain/passives/PassiveCatalog';
import { PassiveEffect, PassiveId } from '../../src/domain/passives/PassiveTypes';
import { getAscensionById, getAscensionsForClass } from '../../src/domain/progression/ClassAscensionCatalog';
import { AscensionId } from '../../src/domain/progression/SkillId';
import { listAscensionChainIds } from '../../src/domain/passives/PassiveResolver';
import { LabHeroClass, LabPassiveEffectEdit, LabPassiveSlot } from './types';

function effectValue(effect: PassiveEffect): number {
  switch (effect.kind) {
    case 'max_health_percent_per_defense':
    case 'ally_support_percent_per_int':
    case 'tree_damage_percent_per_str':
    case 'tree_damage_percent_per_int':
    case 'tree_damage_percent_per_dex':
      return effect.percentPerPoint;
    case 'tree_damage_percent_per_level':
    case 'max_health_percent_per_level':
      return effect.percentPerLevel;
    case 'attack_percent_flat':
    case 'defense_percent_flat':
    case 'max_health_percent_flat':
    case 'ally_support_percent_flat':
    case 'tree_damage_percent_flat':
      return effect.percent;
  }
}

function toEdit(effect: PassiveEffect): LabPassiveEffectEdit {
  return { kind: effect.kind, value: effectValue(effect) };
}

export function effectValueLabel(kind: string): string {
  switch (kind) {
    case 'max_health_percent_per_defense':
      return '% HP / ponto DEF';
    case 'tree_damage_percent_per_level':
      return '% dano skills / nível';
    case 'ally_support_percent_per_int':
      return '% suporte / INT';
    case 'max_health_percent_per_level':
      return '% HP / nível';
    case 'tree_damage_percent_per_str':
      return '% dano skills / STR';
    case 'tree_damage_percent_per_int':
      return '% dano skills / INT';
    case 'tree_damage_percent_per_dex':
      return '% dano skills / DEX';
    case 'attack_percent_flat':
      return '% ATK flat';
    case 'defense_percent_flat':
      return '% DEF flat';
    case 'max_health_percent_flat':
      return '% HP flat';
    case 'ally_support_percent_flat':
      return '% suporte flat';
    case 'tree_damage_percent_flat':
      return '% dano skills flat';
    default:
      return kind;
  }
}

function rebuildEffect(edit: LabPassiveEffectEdit): PassiveEffect | null {
  const v = edit.value;
  switch (edit.kind) {
    case 'max_health_percent_per_defense':
      return { kind: 'max_health_percent_per_defense', percentPerPoint: v };
    case 'tree_damage_percent_per_level':
      return { kind: 'tree_damage_percent_per_level', percentPerLevel: v };
    case 'ally_support_percent_per_int':
      return { kind: 'ally_support_percent_per_int', percentPerPoint: v };
    case 'max_health_percent_per_level':
      return { kind: 'max_health_percent_per_level', percentPerLevel: v };
    case 'tree_damage_percent_per_str':
      return { kind: 'tree_damage_percent_per_str', percentPerPoint: v };
    case 'tree_damage_percent_per_int':
      return { kind: 'tree_damage_percent_per_int', percentPerPoint: v };
    case 'tree_damage_percent_per_dex':
      return { kind: 'tree_damage_percent_per_dex', percentPerPoint: v };
    case 'attack_percent_flat':
      return { kind: 'attack_percent_flat', percent: v };
    case 'defense_percent_flat':
      return { kind: 'defense_percent_flat', percent: v };
    case 'max_health_percent_flat':
      return { kind: 'max_health_percent_flat', percent: v };
    case 'ally_support_percent_flat':
      return { kind: 'ally_support_percent_flat', percent: v };
    case 'tree_damage_percent_flat':
      return { kind: 'tree_damage_percent_flat', percent: v };
    default:
      return null;
  }
}

export function listAscensionOptions(heroClass: LabHeroClass): Array<{
  id: string;
  name: string;
  depth: number;
}> {
  return getAscensionsForClass(heroClass).map((entry) => {
    const chain = listAscensionChainIds(entry.id);
    return { id: entry.id, name: entry.name, depth: chain.length };
  });
}

function pushSlot(
  slots: LabPassiveSlot[],
  id: PassiveId,
  sourceLabel: string,
  previous?: LabPassiveSlot[],
): void {
  const prev = previous?.find((s) => s.id === id);
  const def = getPassiveDefinition(id);
  slots.push({
    id,
    name: def.name,
    sourceLabel,
    enabled: prev?.enabled ?? true,
    effects: def.effects.map((effect, index) => {
      const kept = prev?.effects[index];
      if (kept && kept.kind === effect.kind) return { ...kept };
      return toEdit(effect);
    }),
  });
}

/** Monta passivas de classe + cadeia de ascensão (preserva edições quando possível). */
export function buildHeroPassiveSlots(
  heroClass: LabHeroClass,
  ascensionId: string | null | undefined,
  previous?: LabPassiveSlot[],
): LabPassiveSlot[] {
  const slots: LabPassiveSlot[] = [];
  const classPassive = BASE_CLASS_PASSIVE_IDS[heroClass];
  pushSlot(slots, classPassive, 'Classe', previous);

  if (ascensionId) {
    for (const step of listAscensionChainIds(ascensionId as AscensionId)) {
      const passiveId = ASCENSION_PASSIVE_IDS[step];
      if (!passiveId) continue;
      const name = getAscensionById(step)?.name ?? step;
      pushSlot(slots, passiveId, `Ascensão · ${name}`, previous);
    }
  }

  return slots;
}

export function resetPassiveSlotsToCatalog(slots: LabPassiveSlot[]): LabPassiveSlot[] {
  return slots.map((slot) => {
    const def = getPassiveDefinition(slot.id as PassiveId);
    return {
      ...slot,
      name: def.name,
      effects: def.effects.map(toEdit),
      enabled: true,
    };
  });
}

export interface LabPassiveBonuses {
  attackPercent: number;
  defensePercent: number;
  /** Precisa de DEF já calculada (com % defesa). */
  healthPercentFromFlatAndLevel: number;
  healthPercentPerDefense: number;
  treeDamagePercent: number;
  allySupportPercent: number;
  lines: string[];
}

export function sumPassiveBonuses(
  slots: LabPassiveSlot[] | undefined,
  ctx: { level: number; str: number; dex: number; int: number },
): LabPassiveBonuses {
  let attackPercent = 0;
  let defensePercent = 0;
  let healthPercentFromFlatAndLevel = 0;
  let healthPercentPerDefense = 0;
  let treeDamagePercent = 0;
  let allySupportPercent = 0;
  const lines: string[] = [];

  for (const slot of slots ?? []) {
    if (!slot.enabled) continue;
    const parts: string[] = [];
    for (const edit of slot.effects) {
      const effect = rebuildEffect(edit);
      if (!effect) continue;
      switch (effect.kind) {
        case 'attack_percent_flat':
          attackPercent += effect.percent;
          parts.push(`+${effect.percent}% ATK`);
          break;
        case 'defense_percent_flat':
          defensePercent += effect.percent;
          parts.push(`+${effect.percent}% DEF`);
          break;
        case 'max_health_percent_flat':
          healthPercentFromFlatAndLevel += effect.percent;
          parts.push(`+${effect.percent}% HP`);
          break;
        case 'max_health_percent_per_level':
          healthPercentFromFlatAndLevel += effect.percentPerLevel * ctx.level;
          parts.push(
            `+${(effect.percentPerLevel * ctx.level).toFixed(1)}% HP (${effect.percentPerLevel}%×Nv)`,
          );
          break;
        case 'max_health_percent_per_defense':
          healthPercentPerDefense += effect.percentPerPoint;
          parts.push(`+${effect.percentPerPoint}% HP / DEF`);
          break;
        case 'tree_damage_percent_flat':
          treeDamagePercent += effect.percent;
          parts.push(`+${effect.percent}% skills`);
          break;
        case 'tree_damage_percent_per_level':
          treeDamagePercent += effect.percentPerLevel * ctx.level;
          parts.push(
            `+${(effect.percentPerLevel * ctx.level).toFixed(1)}% skills (${effect.percentPerLevel}%×Nv)`,
          );
          break;
        case 'tree_damage_percent_per_str':
          treeDamagePercent += effect.percentPerPoint * ctx.str;
          parts.push(`+${effect.percentPerPoint * ctx.str}% skills (${effect.percentPerPoint}%×STR)`);
          break;
        case 'tree_damage_percent_per_int':
          treeDamagePercent += effect.percentPerPoint * ctx.int;
          parts.push(`+${effect.percentPerPoint * ctx.int}% skills (${effect.percentPerPoint}%×INT)`);
          break;
        case 'tree_damage_percent_per_dex':
          treeDamagePercent += effect.percentPerPoint * ctx.dex;
          parts.push(`+${effect.percentPerPoint * ctx.dex}% skills (${effect.percentPerPoint}%×DEX)`);
          break;
        case 'ally_support_percent_flat':
          allySupportPercent += effect.percent;
          parts.push(`+${effect.percent}% suporte`);
          break;
        case 'ally_support_percent_per_int':
          allySupportPercent += effect.percentPerPoint * ctx.int;
          parts.push(
            `+${effect.percentPerPoint * ctx.int}% suporte (${effect.percentPerPoint}%×INT)`,
          );
          break;
      }
    }
    if (parts.length) {
      lines.push(`${slot.name} (${slot.sourceLabel}): ${parts.join(' · ')}`);
    }
  }

  return {
    attackPercent,
    defensePercent,
    healthPercentFromFlatAndLevel,
    healthPercentPerDefense,
    treeDamagePercent,
    allySupportPercent,
    lines,
  };
}
