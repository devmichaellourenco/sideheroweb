import { Hero } from '../entities/Hero';
import { getSkillById } from '../progression/SkillCatalog';
import { ProgressionRequirement } from '../progression/ProgressionRequirement';
import {
  getKnightEvolution,
  hasReachedKnightEvolution,
  isKnightEvolutionId,
} from '../progression/KnightEvolutionCatalog';
import {
  getPriestEvolution,
  hasReachedPriestEvolution,
  isPriestEvolutionId,
} from '../progression/PriestEvolutionCatalog';
import {
  getSorcererEvolution,
  hasReachedSorcererEvolution,
  isSorcererEvolutionId,
} from '../progression/SorcererEvolutionCatalog';
import { EvaluatedRequirement } from './EvaluatedRequirement';

export class HeroRequirementEvaluator {
  evaluateAll(hero: Hero, requirements: ProgressionRequirement[]): EvaluatedRequirement[] {
    return requirements.map((req) => ({
      label: this.describe(req),
      met: this.isMet(hero, req),
    }));
  }

  allMet(hero: Hero, requirements: ProgressionRequirement[]): boolean {
    return requirements.every((req) => this.isMet(hero, req));
  }

  isMet(hero: Hero, requirement: ProgressionRequirement): boolean {
    switch (requirement.type) {
      case 'hero_level':
        return hero.level >= requirement.min;
      case 'attribute':
        return hero.totalAttributes[requirement.key] >= requirement.min;
      case 'skill_rank':
        return (hero.toProps().skillRanks[requirement.skillId] ?? 0) >= requirement.minRank;
      case 'hero_class':
        return hero.heroClass === requirement.heroClass;
      case 'ascension':
        if (isKnightEvolutionId(requirement.ascensionId)) {
          return hasReachedKnightEvolution(hero.toProps().ascensionId, requirement.ascensionId);
        }
        if (isSorcererEvolutionId(requirement.ascensionId)) {
          return hasReachedSorcererEvolution(hero.toProps().ascensionId, requirement.ascensionId);
        }
        if (isPriestEvolutionId(requirement.ascensionId)) {
          return hasReachedPriestEvolution(hero.toProps().ascensionId, requirement.ascensionId);
        }
        return hero.toProps().ascensionId === requirement.ascensionId;
      default:
        return false;
    }
  }

  private describe(requirement: ProgressionRequirement): string {
    switch (requirement.type) {
      case 'hero_level':
        return `Level ${requirement.min}`;
      case 'attribute':
        return `${requirement.key.toUpperCase()} ${requirement.min}`;
      case 'skill_rank': {
        const skillName = getSkillById(requirement.skillId)?.name ?? requirement.skillId;
        return `Skill ${skillName} rank ${requirement.minRank}`;
      }
      case 'hero_class':
        return `Classe ${requirement.heroClass}`;
      case 'ascension': {
        const knightEvolution = getKnightEvolution(requirement.ascensionId);
        if (knightEvolution) {
          return `${knightEvolution.pathLabel} · ${knightEvolution.name}`;
        }
        const sorcererEvolution = getSorcererEvolution(requirement.ascensionId);
        if (sorcererEvolution) {
          return `${sorcererEvolution.pathLabel} · ${sorcererEvolution.name}`;
        }
        const priestEvolution = getPriestEvolution(requirement.ascensionId);
        if (priestEvolution) {
          return `${priestEvolution.pathLabel} · ${priestEvolution.name}`;
        }
        return `Ascensão ${requirement.ascensionId}`;
      }
      default:
        return 'Requisito';
    }
  }
}
