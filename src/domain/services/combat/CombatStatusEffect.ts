import { DamageElement, DAMAGE_ELEMENT_LABELS } from '../../combat/DamageElement';

export type CombatStatusEffectKind = 'buff_attack' | 'debuff_defense' | 'dot' | 'heal_block';

export interface CombatStatusEffect {
  skillId: string;
  kind: CombatStatusEffectKind;
  magnitude: number;
  remainingTurns: number;
  dotElement?: DamageElement;
}

export type StatusEffectMap = Record<string, CombatStatusEffect[]>;

export interface StatusApplication {
  combatantKey: string;
  skillId: string;
  kind: CombatStatusEffectKind;
  magnitude: number;
  durationTurns: number;
  skillName: string;
  dotElement?: DamageElement;
}

export function statusEffectLabel(effect: CombatStatusEffect): string {
  if (effect.kind === 'buff_attack') {
    return `ATK+${formatStatusMagnitude(effect.magnitude)}`;
  }
  if (effect.kind === 'debuff_defense') {
    return `DEF-${formatStatusMagnitude(effect.magnitude)}`;
  }
  if (effect.kind === 'heal_block') {
    return 'Cura bloqueada';
  }

  const element = effect.dotElement ? DAMAGE_ELEMENT_LABELS[effect.dotElement] : 'DOT';
  return `${element} ${formatStatusMagnitude(effect.magnitude)}/t`;
}

export function statusEffectTooltip(effect: CombatStatusEffect): string {
  const statLabel = statusEffectLabel(effect);
  if (effect.kind === 'heal_block') {
    return `${statLabel} · dura até o fim da batalha`;
  }
  const turns =
    effect.remainingTurns === 1
      ? '1 turno restante'
      : `${effect.remainingTurns} turnos restantes`;
  return `${statLabel} · ${turns}`;
}

function formatStatusMagnitude(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
