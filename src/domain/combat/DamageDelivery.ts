export const DAMAGE_DELIVERIES = ['melee', 'projectile', 'aoe', 'dot'] as const;

export type DamageDelivery = (typeof DAMAGE_DELIVERIES)[number];
