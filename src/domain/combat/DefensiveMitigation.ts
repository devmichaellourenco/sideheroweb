export interface DefensiveMitigation {
  dodgeChance: number;
  blockChance: number;
  damageReduction: number;
}

export const ZERO_DEFENSIVE: DefensiveMitigation = {
  dodgeChance: 0,
  blockChance: 0,
  damageReduction: 0,
};

export const MAX_DODGE_CHANCE = 0.5;
export const MAX_BLOCK_CHANCE = 0.5;
export const MAX_DAMAGE_REDUCTION = 0.75;
export const BLOCK_DAMAGE_MULTIPLIER = 0.5;

export function clampDefensiveMitigation(
  values: Partial<DefensiveMitigation>,
): DefensiveMitigation {
  return {
    dodgeChance: Math.min(MAX_DODGE_CHANCE, Math.max(0, values.dodgeChance ?? 0)),
    blockChance: Math.min(MAX_BLOCK_CHANCE, Math.max(0, values.blockChance ?? 0)),
    damageReduction: Math.min(MAX_DAMAGE_REDUCTION, Math.max(0, values.damageReduction ?? 0)),
  };
}

export function applyDefensiveLayers(
  damage: number,
  defensive: DefensiveMitigation,
  rng: () => number = Math.random,
): { amount: number; dodged: boolean; blocked: boolean } {
  if (damage <= 0) {
    return { amount: 0, dodged: false, blocked: false };
  }

  if (rng() < defensive.dodgeChance) {
    return { amount: 0, dodged: true, blocked: false };
  }

  let amount = damage;
  let blocked = false;

  if (rng() < defensive.blockChance) {
    amount = Math.floor(amount * BLOCK_DAMAGE_MULTIPLIER);
    blocked = true;
  }

  if (defensive.damageReduction > 0) {
    amount = Math.floor(amount * (1 - defensive.damageReduction));
  }

  if (amount <= 0) {
    return { amount: 0, dodged: false, blocked };
  }

  return { amount: Math.max(1, amount), dodged: false, blocked };
}
