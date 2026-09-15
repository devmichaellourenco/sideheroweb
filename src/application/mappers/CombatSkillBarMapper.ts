import { Hero } from '../../domain/entities/Hero';
import { Enemy } from '../../domain/entities/Enemy';
import { CombatSkillBarResolver } from '../../domain/services/combat/CombatSkillBarResolver';
import { StatusEffectMap } from '../../domain/services/combat/CombatStatusEffect';
import { CombatStatusEffectTracker } from '../../domain/services/combat/CombatStatusEffectTracker';
import { SkillCooldownMap, SkillCooldownTracker } from '../../domain/services/combat/SkillCooldownTracker';
import { CombatBattleSkillDto } from '../dto/GameStateDto';
import { mapSkillCooldownPresentation } from './SkillCooldownPresentationMapper';
import { getSkillElementLabel, getSkillPrimaryElement } from '../../domain/progression/combat/SkillElementResolver';

const resolver = new CombatSkillBarResolver();

function mapEntryToDto(entry: ReturnType<CombatSkillBarResolver['resolveForHero']>[number]): CombatBattleSkillDto {
  const cooldown = mapSkillCooldownPresentation(
    entry.secondsRemaining,
    entry.cooldownTotal,
    entry.ready,
  );

  return {
    skillId: entry.skillId,
    skillName: entry.skillName,
    secondsRemaining: entry.secondsRemaining,
    cooldownTotal: entry.cooldownTotal,
    ready: entry.ready,
    highlight: entry.highlight,
    cooldownLabel: cooldown.cooldownLabel,
    cooldownRatio: cooldown.cooldownRatio,
    damageElement: getSkillPrimaryElement(entry.skillId),
    elementLabel: getSkillElementLabel(entry.skillId),
  };
}

export function mapHeroCombatSkills(
  hero: Hero,
  party: Hero[],
  enemies: Enemy[],
  skillCooldowns: SkillCooldownMap | undefined,
  combatStatusEffects: StatusEffectMap | undefined,
  options: { isActiveTurn: boolean },
): CombatBattleSkillDto[] {
  const entries = resolver.resolveForHero(
    hero,
    party,
    enemies,
    SkillCooldownTracker.fromMap(skillCooldowns),
    options,
    CombatStatusEffectTracker.fromMap(combatStatusEffects),
  );

  return entries.map(mapEntryToDto);
}

export function mapEnemyCombatSkills(
  enemy: Enemy,
  party: Hero[],
  enemies: Enemy[],
  skillCooldowns: SkillCooldownMap | undefined,
  options: { isActiveTurn: boolean },
): CombatBattleSkillDto[] {
  const entries = resolver.resolveForEnemy(
    enemy,
    party,
    enemies,
    SkillCooldownTracker.fromMap(skillCooldowns),
    options,
  );

  return entries.map(mapEntryToDto);
}
