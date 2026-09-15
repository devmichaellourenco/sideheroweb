import { statusEffectTooltip, StatusEffectMap } from '../../domain/services/combat/CombatStatusEffect';
import { CombatStatusEffectTracker } from '../../domain/services/combat/CombatStatusEffectTracker';
import { combatantKey } from '../../domain/services/combat/SkillCooldownTracker';
import { CombatStatusEffectDto } from '../dto/GameStateDto';
import { mapCombatStatusEffectIconPath } from './CombatStatusEffectIconMapper';

export function mapCombatantStatusEffects(
  side: 'hero' | 'enemy',
  id: string,
  statusEffects: StatusEffectMap | undefined,
): CombatStatusEffectDto[] {
  const tracker = CombatStatusEffectTracker.fromMap(statusEffects);
  const key = combatantKey(side, id);

  return tracker.listFor(key).map((effect) => ({
    kind: effect.kind,
    tooltip: statusEffectTooltip(effect),
    turnsRemaining: effect.remainingTurns,
    polarity:
      effect.kind === 'buff_attack'
        ? 'buff'
        : effect.kind === 'heal_block'
          ? 'debuff'
          : 'debuff',
    iconPath: mapCombatStatusEffectIconPath(effect.kind, effect.dotElement),
  }));
}
