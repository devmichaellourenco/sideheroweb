import { Hero } from '../../domain/entities/Hero';
import { Enemy } from '../../domain/entities/Enemy';
import { CombatSkillIntentResolver } from '../../domain/services/combat/CombatSkillIntentResolver';
import { StatusEffectMap } from '../../domain/services/combat/CombatStatusEffect';
import { CombatStatusEffectTracker } from '../../domain/services/combat/CombatStatusEffectTracker';
import { SkillCooldownMap, SkillCooldownTracker } from '../../domain/services/combat/SkillCooldownTracker';
import { CombatSkillIntentDto } from '../dto/GameStateDto';

const resolver = new CombatSkillIntentResolver();

export function mapHeroCombatIntent(
  hero: Hero,
  party: Hero[],
  enemies: Enemy[],
  skillCooldowns: SkillCooldownMap | undefined,
  statusEffects: StatusEffectMap | undefined = undefined,
): CombatSkillIntentDto | null {
  const intent = resolver.resolveForHero(
    hero,
    party,
    enemies,
    SkillCooldownTracker.fromMap(skillCooldowns),
    CombatStatusEffectTracker.fromMap(statusEffects),
  );

  return intent ? mapIntentToDto(intent) : null;
}

export function mapEnemyCombatIntent(
  enemy: Enemy,
  party: Hero[],
  enemies: Enemy[],
  skillCooldowns: SkillCooldownMap | undefined,
): CombatSkillIntentDto | null {
  const intent = resolver.resolveForEnemy(
    enemy,
    party,
    enemies,
    SkillCooldownTracker.fromMap(skillCooldowns),
  );

  return intent ? mapIntentToDto(intent) : null;
}

function mapIntentToDto(intent: {
  nextSkillName: string;
  nextSkillId: string;
  status: 'ready' | 'cooldown';
  secondsRemaining: number;
  chargingSkills: Array<{ skillId: string; skillName: string; secondsRemaining: number }>;
}): CombatSkillIntentDto {
  return {
    nextSkillName: intent.nextSkillName,
    nextSkillId: intent.nextSkillId,
    status: intent.status,
    secondsRemaining: intent.secondsRemaining,
    chargingSkills: intent.chargingSkills.map((entry) => ({
      skillId: entry.skillId,
      skillName: entry.skillName,
      secondsRemaining: entry.secondsRemaining,
    })),
  };
}
