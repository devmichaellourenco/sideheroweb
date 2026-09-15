import { HeroDto } from '../../application/dto/GameStateDto';
import { HeroClass, UNLOCKABLE_HERO_CLASSES } from '../../domain/entities/HeroClass';
import { UNLOCK_HERO_NAMES } from '../../domain/party/HeroUnlockService';

export interface RewardHeroPortrait {
  id: string;
  heroClass: string;
  name: string;
  ascensionId?: string | null;
}

const UNLOCKABLE_CLASS_SET = new Set<string>(UNLOCKABLE_HERO_CLASSES);

const UNLOCK_HERO_IDS: Record<(typeof UNLOCKABLE_HERO_CLASSES)[number], string> = {
  berserker: 'hero-berserker',
  archer: 'hero-archer',
  paladin: 'hero-paladin',
};

export function rewardHeroPortraitFromDto(
  hero: Pick<HeroDto, 'id' | 'heroClass' | 'name' | 'ascensionId'>,
): RewardHeroPortrait {
  return {
    id: hero.id,
    heroClass: hero.heroClass,
    name: hero.name,
    ascensionId: hero.ascensionId ?? null,
  };
}

export function rewardHeroPortraitFromClass(heroClass: HeroClass): RewardHeroPortrait | null {
  if (!UNLOCKABLE_CLASS_SET.has(heroClass)) return null;

  const unlockableClass = heroClass as (typeof UNLOCKABLE_HERO_CLASSES)[number];
  return {
    id: UNLOCK_HERO_IDS[unlockableClass],
    heroClass,
    name: UNLOCK_HERO_NAMES[unlockableClass],
  };
}

export function isUnlockableHeroClass(heroClass: string): heroClass is HeroClass {
  return UNLOCKABLE_CLASS_SET.has(heroClass);
}
