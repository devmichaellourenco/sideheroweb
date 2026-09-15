import { rollCriticalHit } from '../../combat/CriticalHitRoll';
import { CombatProfile } from '../../combat/CombatProfile';
import { applyDefensiveLayers, DefensiveMitigation, ZERO_DEFENSIVE } from '../../combat/DefensiveMitigation';
import { DamageComponent, normalizeDamageComponents } from '../../combat/DamageComponent';
import {
  MitigationTarget,
  resolveMultiComponentDamage,
} from '../../combat/MitigationPipeline';
import { ElementalPenetrationProfile, ZERO_ELEMENTAL_PENETRATION } from '../../combat/ElementalPenetrationProfile';
import { ElementalDamageProfile, ZERO_ELEMENTAL_DAMAGE } from '../../combat/ElementalDamageProfile';
import {
  ElementalDamageFlatProfile,
  ZERO_ELEMENTAL_DAMAGE_FLAT,
} from '../../combat/ElementalDamageFlatProfile';
import { ResistanceProfile, ZERO_RESISTANCES } from '../../combat/ResistanceProfile';
import { resolveEffectiveAttack, resolveEffectiveDefense } from './CombatStatResolver';
import { CombatStatusEffectTracker } from './CombatStatusEffectTracker';

export interface ResolvedDamage {
  amount: number;
  /** Quanto do poder bruto foi absorvido (armadura/resist/bloqueio). 0 se esquivou. */
  mitigated: number;
  isCrit: boolean;
  dodged: boolean;
  blocked: boolean;
}

export interface DamageRollOptions {
  rng?: () => number;
  attackerElementalBonus?: ElementalDamageProfile;
  attackerElementalFlat?: ElementalDamageFlatProfile;
  attackerPhysicalDamagePercent?: number;
  attackerElementalPenetration?: ElementalPenetrationProfile;
}

export function mitigatePhysicalDamage(
  rawDamage: number,
  armor: number,
  stageLevel: number,
): number {
  if (rawDamage <= 0) return 0;

  const threshold = 14 * stageLevel + 12;
  const reduction =
    (armor * armor) / (armor * armor + threshold * (armor + 0.4 * rawDamage));
  const capped = Math.min(0.75, reduction);

  return Math.max(1, Math.floor(rawDamage * (1 - capped)));
}

export function rollCriticalMultiplier(
  critChance: number,
  critDamage: number,
  options: DamageRollOptions = {},
): { multiplier: number; isCrit: boolean } {
  const rng = options.rng ?? Math.random;
  return rollCriticalHit(critChance, critDamage, rng);
}

export function buildMitigationTarget(
  armor: number,
  stageLevel: number,
  resistances: ResistanceProfile = ZERO_RESISTANCES,
  defensive: DefensiveMitigation = ZERO_DEFENSIVE,
): MitigationTarget {
  return {
    armor,
    stageLevel,
    resistances,
    defensive,
  };
}

export function resolveOutgoingDamage(
  rawPower: number,
  components: DamageComponent[],
  target: MitigationTarget,
  attackerProfile: CombatProfile,
  options: DamageRollOptions = {},
): ResolvedDamage {
  const rng = options.rng ?? Math.random;
  const normalized = normalizeDamageComponents(components);
  const { multiplier, isCrit } = rollCriticalMultiplier(
    attackerProfile.critChance,
    attackerProfile.critDamage,
    { rng },
  );
  const powered = Math.max(1, Math.floor(rawPower * multiplier));
  const componentDamage = resolveMultiComponentDamage(
    powered,
    normalized,
    target,
    options.attackerElementalBonus ?? ZERO_ELEMENTAL_DAMAGE,
    options.attackerElementalFlat ?? ZERO_ELEMENTAL_DAMAGE_FLAT,
    options.attackerPhysicalDamagePercent ?? 0,
    options.attackerElementalPenetration ?? ZERO_ELEMENTAL_PENETRATION,
  );
  const defensive = applyDefensiveLayers(
    componentDamage,
    target.defensive ?? ZERO_DEFENSIVE,
    rng,
  );

  const mitigated = defensive.dodged
    ? 0
    : Math.max(0, powered - defensive.amount);

  return {
    amount: defensive.amount,
    mitigated,
    isCrit,
    dodged: defensive.dodged,
    blocked: defensive.blocked,
  };
}

/** Compat: dano físico único (testes legados). */
export function resolveOutgoingPhysicalDamage(
  rawPower: number,
  targetDefense: number,
  stageLevel: number,
  attackerProfile: CombatProfile,
  options: DamageRollOptions = {},
): ResolvedDamage {
  return resolveOutgoingDamage(
    rawPower,
    [{ element: 'physical', delivery: 'melee', weight: 1 }],
    buildMitigationTarget(targetDefense, stageLevel),
    attackerProfile,
    options,
  );
}

export function resolveEffectiveAttackPower(
  baseAttack: number,
  combatantKey: string,
  statusEffects: CombatStatusEffectTracker,
): number {
  return resolveEffectiveAttack(baseAttack, combatantKey, statusEffects);
}

export function resolveEffectiveTargetDefense(
  baseDefense: number,
  combatantKey: string,
  statusEffects: CombatStatusEffectTracker,
): number {
  return resolveEffectiveDefense(baseDefense, combatantKey, statusEffects);
}
