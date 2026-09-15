import { GearRarity } from '../entities/Gear';

/** ID estável do Galneon no roster inicial. */
export const GALNEON_HERO_ID = 'hero-1';

export const GALNEON_STANDARD_SWORD_TEMPLATE_ID = 'galneon_standard_sword';

export const GALNEON_STANDARD_SWORD_BASE_NAME = 'Espada de Ferro do Recruta';

export const GALNEON_STANDARD_SWORD_SPRITES: Partial<Record<GearRarity, string>> = {
  common: 'gear/items/standard_common_sword.png',
  uncommon: 'gear/items/standard_uncommon_sword.png',
  rare: 'gear/items/standard_rare_sword.png',
  epic: 'gear/items/standard_epic_sword.png',
  legendary: 'gear/items/standard_legendary_sword.png',
};
