import { HeroClass } from '../../domain/entities/HeroClass';
import { resolveKnightSpritePath } from '../../domain/progression/KnightEvolutionCatalog';
import { resolvePriestSpritePath } from '../../domain/progression/PriestEvolutionCatalog';
import { resolveSorcererSpritePath } from '../../domain/progression/SorcererEvolutionCatalog';
import { normalizeAscensionId } from '../../domain/progression/normalizeAscensionId';

export interface HeroSpriteInput {
  id: string;
  heroClass: string;
  ascensionId?: string | null;
}

const HERO_BASE_SPRITES: Record<string, string> = {
  'hero-1': 'characters/galneon_aprendiz.png',
  'hero-2': 'characters/nix_aprendiz.png',
  'hero-3': 'characters/elara_aprendiz.png',
  'hero-berserker': 'characters/berserker.png',
  'hero-archer': 'characters/rain.png',
  'hero-paladin': 'characters/valerius.png',
};

const CLASS_FALLBACK_SPRITES: Record<HeroClass, string> = {
  knight: 'characters/galneon_aprendiz.png',
  sorcerer: 'characters/nix_aprendiz.png',
  priest: 'characters/elara_aprendiz.png',
  berserker: 'characters/berserker.png',
  archer: 'characters/rain.png',
  paladin: 'characters/valerius.png',
};

export function resolveHeroSpritePath(hero: HeroSpriteInput): string {
  const ascensionId = normalizeAscensionId(hero.ascensionId ?? null);

  if (ascensionId && hero.heroClass === 'knight') {
    const knightSprite = resolveKnightSpritePath(ascensionId);
    if (knightSprite) return knightSprite;
  }

  if (ascensionId && hero.heroClass === 'sorcerer') {
    const sorcererSprite = resolveSorcererSpritePath(ascensionId);
    if (sorcererSprite) return sorcererSprite;
  }

  if (ascensionId && hero.heroClass === 'priest') {
    const priestSprite = resolvePriestSpritePath(ascensionId);
    if (priestSprite) return priestSprite;
  }

  return HERO_BASE_SPRITES[hero.id] ?? CLASS_FALLBACK_SPRITES[hero.heroClass as HeroClass] ?? CLASS_FALLBACK_SPRITES.knight;
}
