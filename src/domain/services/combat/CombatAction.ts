import { DamageComponent } from '../../combat/DamageComponent';
import { OnHitDotEffect } from '../../progression/combat/CombatSkillDefinition';
import { SkillTargeting } from '../../progression/combat/SkillTargeting';
import { SkillCombatKind } from '../../progression/combat/SkillCombatKind';

export interface CombatAction {
  skillId: string;
  skillName: string;
  kind: SkillCombatKind;
  targeting: SkillTargeting;
  power: number;
  damageComponents?: DamageComponent[];
  onHitDot?: OnHitDotEffect;
  targetHeroId?: string;
  targetHeroIds?: string[];
  targetEnemyId?: string;
  targetEnemyIds?: string[];
  effectDurationTurns?: number;
}
