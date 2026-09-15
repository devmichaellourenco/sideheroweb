import { DamageElement, DAMAGE_ELEMENT_LABELS } from '../../combat/DamageElement';
import { getBaseCombatSkill } from './CombatSkillRegistry';

export function getSkillPrimaryElement(skillId: string): DamageElement | null {
  const combat = getBaseCombatSkill(skillId);
  if (!combat || combat.kind !== 'damage' || !combat.damageComponents?.length) {
    return null;
  }

  const primary = combat.damageComponents.reduce((best, component) =>
    component.weight > best.weight ? component : best,
  );

  return primary.element;
}

export function getSkillElementLabel(skillId: string): string | null {
  const element = getSkillPrimaryElement(skillId);
  if (!element) return null;
  return DAMAGE_ELEMENT_LABELS[element];
}
