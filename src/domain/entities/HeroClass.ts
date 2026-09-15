export type HeroClass = 'knight' | 'sorcerer' | 'priest' | 'berserker' | 'archer' | 'paladin';

export const HERO_CLASSES: readonly HeroClass[] = [
  'knight',
  'sorcerer',
  'priest',
  'berserker',
  'archer',
  'paladin',
];

/** Único herói no new game (camp-missions). */
export const STARTER_HERO_CLASSES: readonly HeroClass[] = ['sorcerer'];

/** Heróis concedidos via árvore de melhorias. */
export const UNLOCKABLE_HERO_CLASSES: readonly HeroClass[] = [
  'knight',
  'priest',
  'berserker',
  'archer',
  'paladin',
];
