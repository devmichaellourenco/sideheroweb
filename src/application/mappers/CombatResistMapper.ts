import { DAMAGE_ELEMENT_LABELS } from '../../domain/combat/DamageElement';
import {
  getEffectiveResistance,
  ResistanceProfile,
} from '../../domain/combat/ResistanceProfile';

export interface CombatResistSummaryDto {
  fire: number;
  cold: number;
  lightning: number;
  air: number;
}

const RESIST_KEYS: Array<keyof CombatResistSummaryDto> = [
  'fire',
  'cold',
  'lightning',
  'air',
];

export function mapCombatResistSummary(profile: ResistanceProfile): CombatResistSummaryDto {
  return {
    fire: getEffectiveResistance(profile, 'fire'),
    cold: getEffectiveResistance(profile, 'cold'),
    lightning: getEffectiveResistance(profile, 'lightning'),
    air: getEffectiveResistance(profile, 'air'),
  };
}

export function formatCombatResistTooltipLine(summary: CombatResistSummaryDto): string | null {
  const parts = RESIST_KEYS.flatMap((key) => {
    const value = summary[key];
    if (value <= 0) {
      return [];
    }

    return [`${DAMAGE_ELEMENT_LABELS[key]} −${Math.round(value)}% dano`];
  });

  if (parts.length === 0) {
    return null;
  }

  return `Resiste: ${parts.join(' · ')}`;
}

export function formatCombatWeaknessTooltipLine(summary: CombatResistSummaryDto): string | null {
  const parts = RESIST_KEYS.flatMap((key) => {
    const value = summary[key];
    if (value >= 0) {
      return [];
    }

    return [`${DAMAGE_ELEMENT_LABELS[key]} +${Math.abs(Math.round(value))}% dano`];
  });

  if (parts.length === 0) {
    return null;
  }

  return `Vulnerável: ${parts.join(' · ')}`;
}
