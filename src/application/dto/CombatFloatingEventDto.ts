import { DamageElement } from '../../domain/combat/DamageElement';

export type CombatFloatKind =
  | 'damage'
  | 'heal'
  | 'crit'
  | 'crit-heal'
  | 'crit-buff'
  | 'buff'
  | 'debuff'
  | 'level-up';

export interface CombatFloatingEventDto {
  target: 'hero' | 'enemy';
  targetId: string;
  kind: CombatFloatKind;
  amount: number;
  damageElement?: DamageElement;
}
