import { HeroClass, HERO_CLASSES } from '../entities/HeroClass';
import { applyIdentityOverride } from '../progression/HeroCombatOverrides';
import { CombatantIdentity } from './CombatantIdentity';

export type HeroCombatIdentity = CombatantIdentity;

const HERO_COMBAT_IDENTITY: Record<HeroClass, HeroCombatIdentity> = {
  sorcerer: {
    basicAttackDamageRatio: 0.5,
    skillCooldownTurnSeconds: 5,
    attackSpeedFactor: 0.29,
    attackPerLevel: 0,
    defensePerLevel: 0,
    healthPerLevel: 0,
    levelUpAttackGain: 3,
    levelUpDefenseGain: 3,
    levelUpHealthGain: 15,
  },
  knight: {
    basicAttackDamageRatio: 0.5,
    skillCooldownTurnSeconds: 5,
    attackSpeedFactor: 0.29,
    attackPerLevel: 0,
    defensePerLevel: 0,
    healthPerLevel: 0,
    levelUpAttackGain: 3,
    levelUpDefenseGain: 3,
    levelUpHealthGain: 15,
  },
  priest: {
    basicAttackDamageRatio: 0.5,
    skillCooldownTurnSeconds: 5,
    attackSpeedFactor: 0.29,
    attackPerLevel: 0,
    defensePerLevel: 0,
    healthPerLevel: 0,
    levelUpAttackGain: 3,
    levelUpDefenseGain: 3,
    levelUpHealthGain: 15,
  },
  berserker: {
    basicAttackDamageRatio: 0.5,
    skillCooldownTurnSeconds: 5,
    attackSpeedFactor: 0.29,
    attackPerLevel: 0,
    defensePerLevel: 0,
    healthPerLevel: 0,
    levelUpAttackGain: 3,
    levelUpDefenseGain: 3,
    levelUpHealthGain: 15,
  },
  archer: {
    basicAttackDamageRatio: 0.5,
    skillCooldownTurnSeconds: 5,
    attackSpeedFactor: 0.29,
    attackPerLevel: 0,
    defensePerLevel: 0,
    healthPerLevel: 0,
    levelUpAttackGain: 3,
    levelUpDefenseGain: 3,
    levelUpHealthGain: 15,
  },
  paladin: {
    basicAttackDamageRatio: 0.5,
    skillCooldownTurnSeconds: 5,
    attackSpeedFactor: 0.29,
    attackPerLevel: 0,
    defensePerLevel: 0,
    healthPerLevel: 0,
    levelUpAttackGain: 3,
    levelUpDefenseGain: 3,
    levelUpHealthGain: 15,
  },
};

export function getHeroCombatIdentity(heroClass: HeroClass): HeroCombatIdentity {
  return applyIdentityOverride(HERO_COMBAT_IDENTITY[heroClass], heroClass);
}

/** Identidade do catálogo, sem override do lab. */
export function getCatalogHeroCombatIdentity(heroClass: HeroClass): HeroCombatIdentity {
  return HERO_COMBAT_IDENTITY[heroClass];
}

export function listHeroCombatIdentities(): ReadonlyArray<{
  heroClass: HeroClass;
  identity: HeroCombatIdentity;
}> {
  return HERO_CLASSES.map((heroClass) => ({
    heroClass,
    identity: getHeroCombatIdentity(heroClass),
  }));
}
