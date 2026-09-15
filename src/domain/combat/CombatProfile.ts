export interface CombatProfile {
  attackSpeed: number;
  /** Multiplicador de recuperação pós-skill (recovery global). */
  castSpeed: number;
  /** Fração de redução de recarga das skills (0.30 = 30% menos tempo). */
  cooldownReduction: number;
  critChance: number;
  critDamage: number;
}

export function createCombatProfile(partial: Partial<CombatProfile> & Pick<CombatProfile, 'attackSpeed'>): CombatProfile {
  return {
    attackSpeed: partial.attackSpeed,
    castSpeed: partial.castSpeed ?? 1,
    cooldownReduction: partial.cooldownReduction ?? 0,
    critChance: partial.critChance ?? 0,
    critDamage: partial.critDamage ?? 1.4,
  };
}
