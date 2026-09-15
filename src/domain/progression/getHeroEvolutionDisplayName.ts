import { HeroClass } from '../entities/HeroClass';
import { getKnightEvolution, getKnightEvolutionDisplayName } from './KnightEvolutionCatalog';
import { getPriestEvolution, getPriestEvolutionDisplayName } from './PriestEvolutionCatalog';
import { getSorcererEvolution, getSorcererEvolutionDisplayName } from './SorcererEvolutionCatalog';
import { AscensionId } from './SkillId';

export function getHeroEvolutionDisplayName(
  heroClass: HeroClass,
  ascensionId: AscensionId,
): string {
  if (heroClass === 'knight') return getKnightEvolutionDisplayName(ascensionId);
  if (heroClass === 'sorcerer') return getSorcererEvolutionDisplayName(ascensionId);
  if (heroClass === 'priest') return getPriestEvolutionDisplayName(ascensionId);
  return ascensionId;
}

export function getHeroEvolutionTierName(heroClass: HeroClass, ascensionId: AscensionId): string {
  if (heroClass === 'knight') return getKnightEvolution(ascensionId)?.name ?? ascensionId;
  if (heroClass === 'sorcerer') return getSorcererEvolution(ascensionId)?.name ?? ascensionId;
  if (heroClass === 'priest') return getPriestEvolution(ascensionId)?.name ?? ascensionId;
  return ascensionId;
}
