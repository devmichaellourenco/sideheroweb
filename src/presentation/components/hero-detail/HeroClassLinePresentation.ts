import { HeroDto } from '../../../application/dto/GameStateDto';
import { HeroClass } from '../../../domain/entities/HeroClass';
import { getHeroEvolutionTierName } from '../../../domain/progression/getHeroEvolutionDisplayName';
import { AscensionId } from '../../../domain/progression/SkillId';

export const HERO_BASE_TIER_LABEL = 'Aprendiz';

const EVOLUTION_CLASS_SET = new Set<HeroClass>(['knight', 'sorcerer', 'priest']);

export function getHeroEvolutionLabel(hero: HeroDto, ascensionName: string | null = null): string {
  if (!hero.ascensionId) return HERO_BASE_TIER_LABEL;

  if (EVOLUTION_CLASS_SET.has(hero.heroClass as HeroClass)) {
    return getHeroEvolutionTierName(hero.heroClass as HeroClass, hero.ascensionId as AscensionId);
  }

  return ascensionName ?? hero.ascensionId;
}

export function formatHeroLevelClassLine(hero: HeroDto, ascensionName: string | null = null): string {
  return `Lv.${hero.level} ${getHeroEvolutionLabel(hero, ascensionName)}`;
}
