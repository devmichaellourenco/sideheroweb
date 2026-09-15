export type CombatSkillVfxKindDto = 'projectile' | 'melee' | 'aoe' | 'self';

export interface CombatSkillVfxDto {
  skillId: string;
  vfxKind: CombatSkillVfxKindDto;
  attackerSide: 'hero' | 'enemy';
  attackerId: string;
  targetSide: 'hero' | 'enemy';
  targetId: string;
}
