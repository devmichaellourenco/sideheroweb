import { getHeroCombatIdentity } from '../../domain/combat/HeroCombatIdentityCatalog';
import { getCooldownSeconds } from '../../domain/combat/SkillCooldownTiming';
import { Hero } from '../../domain/entities/Hero';
import { getHeroCombatSkill } from '../../domain/progression/combat/HeroCombatSkillCatalog';
import { SkillCooldownMap, SkillCooldownTracker, combatantKey } from '../../domain/services/combat/SkillCooldownTracker';
import { HeroSkillCooldownDto } from '../dto/GameStateDto';
import { mapSkillCooldownPresentation } from './SkillCooldownPresentationMapper';

export function mapHeroSkillCooldowns(
  hero: Hero,
  skillCooldowns: SkillCooldownMap | undefined,
): HeroSkillCooldownDto[] {
  if (!skillCooldowns) return [];

  const key = combatantKey('hero', hero.id);
  const tracker = SkillCooldownTracker.fromMap(skillCooldowns);

  return hero
    .toProps()
    .equippedSkillIds.filter((skillId): skillId is string => Boolean(skillId))
    .map((skillId) => {
    const definition = getHeroCombatSkill(skillId);
    const secondsRemaining = tracker.getRemaining(key, skillId);
    const rank = hero.toProps().skillRanks[skillId] ?? 1;
    const baseCooldown = definition
      ? getCooldownSeconds(definition, {
          rank,
          turnSeconds: getHeroCombatIdentity(hero.heroClass).skillCooldownTurnSeconds,
        })
      : 0;
    const cooldownTotal = Math.max(baseCooldown, secondsRemaining, 0);

    const ready = secondsRemaining <= 0 || baseCooldown <= 0;
    const cooldown = mapSkillCooldownPresentation(secondsRemaining, cooldownTotal, ready);

    return {
      skillId,
      secondsRemaining,
      cooldownTotal,
      ready,
      cooldownLabel: cooldown.cooldownLabel,
      cooldownRatio: cooldown.cooldownRatio,
    };
  });
}
