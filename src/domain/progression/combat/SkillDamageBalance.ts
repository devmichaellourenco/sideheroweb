import { CombatSkillDefinition } from './CombatSkillDefinition';
import { isDamageCombatKind } from './SkillCombatKind';

/**
 * Ratio legado das skills físicas flat de inimigo (catálogo sem scaling).
 * Heróis usam o piso do ataque básico; ver `resolveDamageSkillAttackFloor`.
 */
export const PHYSICAL_DAMAGE_SKILL_MIN_ATK_RATIO = 1.35;

export function isPhysicalDamageSkill(skill: CombatSkillDefinition): boolean {
  return (
    isDamageCombatKind(skill.kind) &&
    Boolean(skill.damageComponents?.some((entry) => entry.element === 'physical'))
  );
}

/**
 * Piso de poder vs ATK: skills de dano nunca ficam abaixo do ataque básico
 * do combatente, salvo `minAttackRatio` explícito no catálogo.
 */
export function resolveDamageSkillAttackFloor(
  skill: CombatSkillDefinition,
  effectiveAttack: number,
  basicAttackDamageRatio: number,
): number {
  const ratio = skill.minAttackRatio ?? basicAttackDamageRatio;
  return Math.max(1, Math.floor(effectiveAttack * Math.max(0, ratio)));
}

/**
 * Poder da skill (herói): Base × (powerPerRank × nível) × (atributo × fator),
 * com piso ≥ ataque básico (ou minAttackRatio do catálogo).
 */
export function applyHeroDamageSkillPower(
  skill: CombatSkillDefinition,
  rawPower: number,
  effectiveAttack: number,
  basicAttackDamageRatio: number,
): number {
  if (!isDamageCombatKind(skill.kind) || skill.usesAttackStat) {
    return Math.max(1, Math.floor(rawPower));
  }

  const power = Math.max(1, Math.floor(rawPower));
  return Math.max(
    power,
    resolveDamageSkillAttackFloor(skill, effectiveAttack, basicAttackDamageRatio),
  );
}

/** Termo de rank: powerPerRank × nível da skill (nível 1 já conta). */
export function skillRankMultiplier(powerPerRank: number, rank: number): number {
  return Math.max(0, powerPerRank) * Math.max(1, rank);
}

/** Contribuição de atributo na fórmula multiplicativa. */
export function skillAttributeMultiplier(attributeValue: number, attributeFactor: number): number {
  return Math.max(0, attributeValue) * Math.max(0, attributeFactor);
}

/** Poder bruto antes do floor/piso vs ataque básico. */
export function calculateHeroSkillRawPower(
  skill: CombatSkillDefinition,
  rank: number,
  attributeValue: number,
): number {
  return (
    Math.max(0, skill.basePower) *
    skillRankMultiplier(skill.powerPerRank, rank) *
    skillAttributeMultiplier(attributeValue, skill.attributeFactor)
  );
}
