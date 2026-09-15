import { CombatAction } from './CombatAction';

export type CombatSkillVfxKind = 'projectile' | 'melee' | 'aoe' | 'self';

export interface CombatSkillVfxEvent {
  skillId: string;
  vfxKind: CombatSkillVfxKind;
  attackerSide: 'hero' | 'enemy';
  attackerId: string;
  targetSide: 'hero' | 'enemy';
  targetId: string;
}

export function createSkillVfxEvent(
  skillId: string,
  attackerSide: 'hero' | 'enemy',
  attackerId: string,
  action: CombatAction,
): CombatSkillVfxEvent | null {
  if (action.targetEnemyId) {
    return {
      skillId,
      vfxKind: resolveVfxKind(action),
      attackerSide,
      attackerId,
      targetSide: 'enemy',
      targetId: action.targetEnemyId,
    };
  }

  if (action.targetEnemyIds?.length) {
    return {
      skillId,
      vfxKind: 'aoe',
      attackerSide,
      attackerId,
      targetSide: 'enemy',
      targetId: action.targetEnemyIds[0],
    };
  }

  if (action.targetHeroId) {
    return {
      skillId,
      vfxKind: resolveVfxKind(action),
      attackerSide,
      attackerId,
      targetSide: 'hero',
      targetId: action.targetHeroId,
    };
  }

  if (action.targetHeroIds?.length) {
    return {
      skillId,
      vfxKind: action.targeting === 'all_allies' ? 'aoe' : 'projectile',
      attackerSide,
      attackerId,
      targetSide: 'hero',
      targetId: action.targetHeroIds[0],
    };
  }

  return null;
}

function resolveVfxKind(action: CombatAction): CombatSkillVfxKind {
  if (action.targeting === 'all_enemies' || action.targeting === 'all_allies') {
    return 'aoe';
  }

  if (
    action.kind === 'heal_ally' ||
    action.kind === 'buff_attack' ||
    action.kind === 'debuff_defense'
  ) {
    return 'self';
  }

  const delivery = action.damageComponents?.[0]?.delivery;
  if (delivery === 'melee') {
    return 'melee';
  }

  return 'projectile';
}
