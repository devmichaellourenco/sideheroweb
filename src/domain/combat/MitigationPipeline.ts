import { DamageComponent } from './DamageComponent';
import { DamageElement } from './DamageElement';
import { DefensiveMitigation, ZERO_DEFENSIVE } from './DefensiveMitigation';
import {
  ElementalDamageFlatProfile,
  getEffectiveElementalDamageFlat,
  ZERO_ELEMENTAL_DAMAGE_FLAT,
} from './ElementalDamageFlatProfile';
import {
  ElementalDamageProfile,
  getEffectiveElementalDamageBonus,
  ZERO_ELEMENTAL_DAMAGE,
} from './ElementalDamageProfile';
import {
  applyResistancePenetration,
  ElementalPenetrationProfile,
  getEffectiveElementalPenetration,
  ZERO_ELEMENTAL_PENETRATION,
} from './ElementalPenetrationProfile';
import { getEffectiveResistance, ResistanceProfile } from './ResistanceProfile';
import { mitigatePhysicalDamage } from '../services/combat/CombatDamageResolver';

export interface MitigationTarget {
  armor: number;
  stageLevel: number;
  resistances: ResistanceProfile;
  defensive?: DefensiveMitigation;
}

export function mitigateElementalDamage(
  rawDamage: number,
  element: DamageElement,
  target: MitigationTarget,
  attackerPenetration: ElementalPenetrationProfile = ZERO_ELEMENTAL_PENETRATION,
): number {
  if (rawDamage <= 0) {
    return 0;
  }

  if (element === 'physical') {
    return mitigatePhysicalDamage(rawDamage, target.armor, target.stageLevel);
  }

  const baseResistance = getEffectiveResistance(target.resistances, element);
  const penetration = getEffectiveElementalPenetration(attackerPenetration, element);
  const effectiveResistance = applyResistancePenetration(baseResistance, penetration);
  const scaled =
    effectiveResistance >= 0
      ? rawDamage * (1 - effectiveResistance / 100)
      : rawDamage * (1 + Math.abs(effectiveResistance) / 100);

  return Math.max(0, Math.floor(scaled));
}

export function resolveComponentDamage(
  rawPower: number,
  component: DamageComponent,
  target: MitigationTarget,
  attackerElementalBonus: ElementalDamageProfile = ZERO_ELEMENTAL_DAMAGE,
  attackerElementalFlat: ElementalDamageFlatProfile = ZERO_ELEMENTAL_DAMAGE_FLAT,
  attackerPhysicalDamagePercent = 0,
  attackerPenetration: ElementalPenetrationProfile = ZERO_ELEMENTAL_PENETRATION,
): number {
  const bonusPercent =
    component.element === 'physical'
      ? attackerPhysicalDamagePercent
      : getEffectiveElementalDamageBonus(attackerElementalBonus, component.element);
  const bonusFlat =
    component.element === 'physical' ? 0 : getEffectiveElementalDamageFlat(attackerElementalFlat, component.element);
  const portion =
    rawPower * component.weight * (1 + bonusPercent / 100) + bonusFlat * component.weight;
  return mitigateElementalDamage(portion, component.element, target, attackerPenetration);
}

export function resolveMultiComponentDamage(
  rawPower: number,
  components: DamageComponent[],
  target: MitigationTarget,
  attackerElementalBonus: ElementalDamageProfile = ZERO_ELEMENTAL_DAMAGE,
  attackerElementalFlat: ElementalDamageFlatProfile = ZERO_ELEMENTAL_DAMAGE_FLAT,
  attackerPhysicalDamagePercent = 0,
  attackerPenetration: ElementalPenetrationProfile = ZERO_ELEMENTAL_PENETRATION,
): number {
  const total = components.reduce(
    (sum, component) =>
      sum +
      resolveComponentDamage(
        rawPower,
        component,
        target,
        attackerElementalBonus,
        attackerElementalFlat,
        attackerPhysicalDamagePercent,
        attackerPenetration,
      ),
    0,
  );

  if (total <= 0) {
    return 0;
  }

  return Math.max(1, total);
}
