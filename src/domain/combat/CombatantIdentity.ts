/** Identidade de combate/progressão — um registro por herói ou tipo de monstro. */
export interface CombatantIdentity {
  /** Fração do ATK no ataque básico. */
  basicAttackDamageRatio: number;
  /** Conversão de `cooldownTurns` da skill em segundos. */
  skillCooldownTurnSeconds: number;
  /** Fração da ASPD de baseline de classe/tier. */
  attackSpeedFactor: number;
  attackPerLevel: number;
  defensePerLevel: number;
  healthPerLevel: number;
  levelUpAttackGain: number;
  levelUpDefenseGain: number;
  levelUpHealthGain: number;
}

export function combatantStatGrowth(identity: CombatantIdentity): Pick<
  CombatantIdentity,
  'attackPerLevel' | 'defensePerLevel' | 'healthPerLevel'
> {
  return {
    attackPerLevel: identity.attackPerLevel,
    defensePerLevel: identity.defensePerLevel,
    healthPerLevel: identity.healthPerLevel,
  };
}
