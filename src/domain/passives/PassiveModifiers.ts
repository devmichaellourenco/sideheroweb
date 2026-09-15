import { Enemy } from '../entities/Enemy';
import { Hero } from '../entities/Hero';
import { Attributes } from '../progression/Attributes';
import { CombatSkillDefinition } from '../progression/combat/CombatSkillDefinition';
import { isDamageCombatKind } from '../progression/combat/SkillCombatKind';
import { resolveEnemyPassives, resolveHeroPassives } from './PassiveResolver';
import { ActivePassive, PassiveEffect } from './PassiveTypes';

export { resolveEnemyPassives } from './PassiveResolver';

function sumEffects(
  actives: readonly ActivePassive[],
  pick: (effect: PassiveEffect) => number | null,
): number {
  let total = 0;
  for (const active of actives) {
    for (const effect of active.definition.effects) {
      const value = pick(effect);
      if (value != null) total += value;
    }
  }
  return total;
}

export function isTreeDamageSkill(skill: CombatSkillDefinition): boolean {
  return isDamageCombatKind(skill.kind) && skill.skillId !== 'basic_attack';
}

export function isAllySupportSkill(skill: CombatSkillDefinition): boolean {
  return skill.kind === 'heal_ally' || skill.kind === 'buff_attack';
}

export function heroPassiveAttackPercent(hero: Hero): number {
  return sumEffects(resolveHeroPassives(hero), (effect) =>
    effect.kind === 'attack_percent_flat' ? effect.percent : null,
  );
}

export function heroPassiveDefensePercent(hero: Hero): number {
  return sumEffects(resolveHeroPassives(hero), (effect) =>
    effect.kind === 'defense_percent_flat' ? effect.percent : null,
  );
}

export function heroPassiveMaxHealthPercent(hero: Hero): number {
  const actives = resolveHeroPassives(hero);
  const flat = sumEffects(actives, (effect) =>
    effect.kind === 'max_health_percent_flat' ? effect.percent : null,
  );
  const perDefense = sumEffects(actives, (effect) =>
    effect.kind === 'max_health_percent_per_defense' ? effect.percentPerPoint : null,
  );
  const perLevel = sumEffects(actives, (effect) =>
    effect.kind === 'max_health_percent_per_level' ? effect.percentPerLevel : null,
  );

  return flat + perDefense * hero.defense + perLevel * hero.level;
}

export function heroPassiveTreeDamagePercent(hero: Hero, skill: CombatSkillDefinition): number {
  return sumPassiveTreeDamagePercent(
    resolveHeroPassives(hero),
    skill,
    hero.level,
    hero.totalAttributes,
  );
}

export function heroPassiveAllySupportPercent(hero: Hero, skill: CombatSkillDefinition): number {
  return sumPassiveAllySupportPercent(
    resolveHeroPassives(hero),
    skill,
    hero.totalAttributes.int,
  );
}

/** Agrega bônus de dano de árvore a partir de passivas já resolvidas (herói ou inimigo). */
export function sumPassiveTreeDamagePercent(
  actives: readonly ActivePassive[],
  skill: CombatSkillDefinition,
  level: number,
  attrs: Attributes,
): number {
  if (!isTreeDamageSkill(skill)) return 0;

  const flat = sumEffects(actives, (effect) =>
    effect.kind === 'tree_damage_percent_flat' ? effect.percent : null,
  );
  const perLevel = sumEffects(actives, (effect) =>
    effect.kind === 'tree_damage_percent_per_level' ? effect.percentPerLevel : null,
  );
  const perStr = sumEffects(actives, (effect) =>
    effect.kind === 'tree_damage_percent_per_str' ? effect.percentPerPoint : null,
  );
  const perInt = sumEffects(actives, (effect) =>
    effect.kind === 'tree_damage_percent_per_int' ? effect.percentPerPoint : null,
  );
  const perDex = sumEffects(actives, (effect) =>
    effect.kind === 'tree_damage_percent_per_dex' ? effect.percentPerPoint : null,
  );

  return (
    flat +
    perLevel * level +
    perStr * attrs.str +
    perInt * attrs.int +
    perDex * attrs.dex
  );
}

export function sumPassiveAllySupportPercent(
  actives: readonly ActivePassive[],
  skill: CombatSkillDefinition,
  intValue: number,
): number {
  if (!isAllySupportSkill(skill)) return 0;

  const flat = sumEffects(actives, (effect) =>
    effect.kind === 'ally_support_percent_flat' ? effect.percent : null,
  );
  const perInt = sumEffects(actives, (effect) =>
    effect.kind === 'ally_support_percent_per_int' ? effect.percentPerPoint : null,
  );

  return flat + perInt * intValue;
}

export function enemyPassiveAttackPercent(enemy: Enemy): number {
  return sumEffects(resolveEnemyPassives(enemy), (effect) =>
    effect.kind === 'attack_percent_flat' ? effect.percent : null,
  );
}

export function enemyPassiveDefensePercent(enemy: Enemy): number {
  return sumEffects(resolveEnemyPassives(enemy), (effect) =>
    effect.kind === 'defense_percent_flat' ? effect.percent : null,
  );
}

export function enemyPassiveMaxHealthPercent(enemy: Enemy): number {
  const actives = resolveEnemyPassives(enemy);
  const flat = sumEffects(actives, (effect) =>
    effect.kind === 'max_health_percent_flat' ? effect.percent : null,
  );
  const perDefense = sumEffects(actives, (effect) =>
    effect.kind === 'max_health_percent_per_defense' ? effect.percentPerPoint : null,
  );
  const perLevel = sumEffects(actives, (effect) =>
    effect.kind === 'max_health_percent_per_level' ? effect.percentPerLevel : null,
  );

  return flat + perDefense * enemy.defense + perLevel * enemy.level;
}

export function applyPercentBonus(base: number, percentBonus: number): number {
  if (percentBonus === 0) return Math.max(1, Math.floor(base));
  return Math.max(1, Math.floor(base * (1 + percentBonus / 100)));
}

function formatPassiveTooltipLine(name: string, detail: string): string {
  return `Passiva ${name}: ${detail}`;
}

function effectSummaryParts(hero: Hero, effect: PassiveEffect): string[] {
  switch (effect.kind) {
    case 'max_health_percent_per_defense':
      return [
        `+${(effect.percentPerPoint * hero.defense).toFixed(0)}% vida (${effect.percentPerPoint}%×DEF ${hero.defense})`,
      ];
    case 'tree_damage_percent_per_level':
      return [
        `+${(effect.percentPerLevel * hero.level).toFixed(1)}% dano skills (${effect.percentPerLevel}%×Nv ${hero.level})`,
      ];
    case 'ally_support_percent_per_int':
      return [
        `+${(effect.percentPerPoint * hero.totalAttributes.int).toFixed(0)}% suporte (${effect.percentPerPoint}%×INT ${hero.totalAttributes.int})`,
      ];
    case 'max_health_percent_per_level':
      return [
        `+${(effect.percentPerLevel * hero.level).toFixed(1)}% vida (${effect.percentPerLevel}%×Nv ${hero.level})`,
      ];
    case 'tree_damage_percent_per_str':
      return [
        `+${(effect.percentPerPoint * hero.totalAttributes.str).toFixed(0)}% dano skills (${effect.percentPerPoint}%×FOR ${hero.totalAttributes.str})`,
      ];
    case 'tree_damage_percent_per_int':
      return [
        `+${(effect.percentPerPoint * hero.totalAttributes.int).toFixed(0)}% dano skills (${effect.percentPerPoint}%×INT ${hero.totalAttributes.int})`,
      ];
    case 'tree_damage_percent_per_dex':
      return [
        `+${(effect.percentPerPoint * hero.totalAttributes.dex).toFixed(0)}% dano skills (${effect.percentPerPoint}%×DES ${hero.totalAttributes.dex})`,
      ];
    case 'attack_percent_flat':
      return [`+${effect.percent}% ataque`];
    case 'defense_percent_flat':
      return [`+${effect.percent}% defesa`];
    case 'max_health_percent_flat':
      return [`+${effect.percent}% vida`];
    case 'ally_support_percent_flat':
      return [`+${effect.percent}% suporte`];
    case 'tree_damage_percent_flat':
      return [`+${effect.percent}% dano skills`];
  }
}

function isMaxHealthEffect(effect: PassiveEffect): boolean {
  return (
    effect.kind === 'max_health_percent_per_defense' ||
    effect.kind === 'max_health_percent_per_level' ||
    effect.kind === 'max_health_percent_flat'
  );
}

function isAttackEffect(effect: PassiveEffect): boolean {
  return effect.kind === 'attack_percent_flat';
}

function isDefenseEffect(effect: PassiveEffect): boolean {
  return effect.kind === 'defense_percent_flat';
}

function isTreeDamageEffect(effect: PassiveEffect): boolean {
  return (
    effect.kind === 'tree_damage_percent_flat' ||
    effect.kind === 'tree_damage_percent_per_level' ||
    effect.kind === 'tree_damage_percent_per_str' ||
    effect.kind === 'tree_damage_percent_per_int' ||
    effect.kind === 'tree_damage_percent_per_dex'
  );
}

function isAllySupportEffect(effect: PassiveEffect): boolean {
  return (
    effect.kind === 'ally_support_percent_flat' ||
    effect.kind === 'ally_support_percent_per_int'
  );
}

function contributionLinesFor(
  hero: Hero,
  matches: (effect: PassiveEffect) => boolean,
): string[] {
  const lines: string[] = [];
  for (const active of resolveHeroPassives(hero)) {
    const parts: string[] = [];
    for (const effect of active.definition.effects) {
      if (!matches(effect)) continue;
      parts.push(...effectSummaryParts(hero, effect));
    }
    if (parts.length === 0) continue;
    lines.push(formatPassiveTooltipLine(active.definition.name, parts.join(' · ')));
  }
  return lines;
}

/** Linhas de tooltip para passivas que afetam vida máxima (% sobre o subtotal). */
export function heroPassiveMaxHealthContributionLines(hero: Hero): string[] {
  return contributionLinesFor(hero, isMaxHealthEffect);
}

/** Linhas de tooltip para passivas que afetam ataque (%). */
export function heroPassiveAttackContributionLines(hero: Hero): string[] {
  return contributionLinesFor(hero, isAttackEffect);
}

/** Linhas de tooltip para passivas que afetam defesa (%). */
export function heroPassiveDefenseContributionLines(hero: Hero): string[] {
  return contributionLinesFor(hero, isDefenseEffect);
}

/**
 * Linhas de tooltip para passivas que afetam o poder da skill atual
 * (dano de árvore e/ou suporte a aliados).
 */
export function heroPassiveSkillPowerContributionLines(
  hero: Hero,
  skill: CombatSkillDefinition,
): string[] {
  const lines: string[] = [];
  if (isTreeDamageSkill(skill)) {
    lines.push(...contributionLinesFor(hero, isTreeDamageEffect));
  }
  if (isAllySupportSkill(skill)) {
    lines.push(...contributionLinesFor(hero, isAllySupportEffect));
  }
  return lines;
}

/** Resumo numérico curto para UI (uma linha). */
export function summarizeActivePassive(hero: Hero, active: ActivePassive): string {
  const parts: string[] = [];
  for (const effect of active.definition.effects) {
    parts.push(...effectSummaryParts(hero, effect));
  }
  return parts.join(' · ');
}
