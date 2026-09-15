import { DAMAGE_ELEMENT_LABELS, DamageElement } from '../../combat/DamageElement';
import { CombatAction } from './CombatAction';

export function formatCombatHitNarrative(input: {
  actorName: string;
  targetLabel: string;
  skillName: string;
  kind: 'damage' | 'heal';
  amount: number;
  isCrit?: boolean;
  elements?: readonly DamageElement[];
  mitigation?: 'dodge' | 'block' | null;
  blockedHeal?: boolean;
}): string {
  const { actorName, targetLabel, skillName, kind, amount, isCrit, elements, mitigation, blockedHeal } =
    input;

  const elementSuffix = formatElementSuffix(elements);
  const head = `${actorName} acertou ${targetLabel} com a skill ${skillName}.${elementSuffix}`;

  if (kind === 'heal') {
    if (blockedHeal && amount <= 0) {
      return `${head}\nA cura foi bloqueada.`;
    }
    const crit = isCrit ? ' CRÍTICO!' : '';
    return `${head}\nA cura realizada foi de ${amount}${crit}`;
  }

  if (mitigation === 'dodge') {
    return `${head}\nO alvo esquivou e não recebeu dano.`;
  }

  if (amount <= 0) {
    const block = mitigation === 'block' ? ' (bloqueio)' : '';
    return `${head}\nO ataque não causou dano${block}.`;
  }

  const crit = isCrit ? ' CRÍTICO!' : '';
  const block = mitigation === 'block' ? ' (bloqueio)' : '';
  return `${head}\nO dano causado foi de ${amount}${crit}${block}`;
}

export function formatCombatStatusNarrative(
  actorName: string,
  skillName: string,
  scope: string,
  isCrit: boolean,
): string {
  const crit = isCrit ? '\nFoi um efeito CRÍTICO!' : '';
  return `${actorName} usou a skill ${skillName} em ${scope}.${crit}`;
}

export function formatCombatDotNarrative(
  targetName: string,
  amount: number,
  mitigationTag: string,
): string {
  return `${targetName} sofreu dano contínuo.\nO dano causado foi de ${amount}${mitigationTag}`;
}

export function resolveTargetLabel(
  names: readonly string[],
  allLabel: string,
  isAll: boolean,
): string {
  if (isAll) return allLabel;
  if (names.length === 0) return 'o alvo';
  if (names.length === 1) return names[0]!;
  return names.join(', ');
}

export function elementsFromAction(action: CombatAction): DamageElement[] {
  const components = action.damageComponents;
  if (!components?.length) return [];
  return [...new Set(components.map((entry) => entry.element))];
}

function formatElementSuffix(elements: readonly DamageElement[] | undefined): string {
  if (!elements?.length) return '';
  const nonPhysical = elements.filter((element) => element !== 'physical');
  if (nonPhysical.length === 0) return '';
  const labels = nonPhysical.map((element) => DAMAGE_ELEMENT_LABELS[element]);
  return ` Elemento: ${labels.join(' + ')}.`;
}
