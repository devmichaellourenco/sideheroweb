export const DAMAGE_ELEMENTS = ['physical', 'fire', 'cold', 'lightning', 'air'] as const;

export type DamageElement = (typeof DAMAGE_ELEMENTS)[number];

export const DAMAGE_ELEMENT_LABELS: Record<DamageElement, string> = {
  physical: 'Físico',
  fire: 'Fogo',
  cold: 'Gelo',
  lightning: 'Raio',
  air: 'Ar',
};
