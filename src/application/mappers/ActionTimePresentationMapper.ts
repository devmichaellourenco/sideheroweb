import { ActionTimerMap, resolveActionTimeRatio } from '../../domain/services/combat/ActionTimerTypes';
import { combatantKey } from '../../domain/services/combat/SkillCooldownTracker';

export function mapCombatantActionTime(
  side: 'hero' | 'enemy',
  id: string,
  actionTimers: ActionTimerMap | undefined,
): { actionTimeRatio: number; actionTimeRemaining: number; actionTimeTotal: number } {
  const entry = actionTimers?.[combatantKey(side, id)];
  return {
    actionTimeRatio: resolveActionTimeRatio(entry),
    actionTimeRemaining: Math.max(0, entry?.remaining ?? 0),
    actionTimeTotal: Math.max(0, entry?.total ?? 0),
  };
}
