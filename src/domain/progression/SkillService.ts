import { Hero } from '../entities/Hero';
import { HeroRequirementEvaluator } from '../requirements/HeroRequirementEvaluator';
import { ISkillService } from './ISkillService';
import { BASIC_ATTACK_SKILL_ID } from './combat/BasicAttackSkill';
import {
  hasUnlockedInvestableSkillSlot,
  MAX_ACTIVE_BATTLE_SKILLS,
  toSkillSlotLayout,
} from './SkillBattleSlots';
import { getSkillById, getSkillsForHero, SKILL_CATALOG } from './SkillCatalog';
import { SkillDefinition } from './SkillDefinition';
import { SkillId } from './SkillId';

export type SkillNodeStatus = 'locked' | 'ready' | 'owned' | 'maxed';

export interface SkillNodeView {
  definition: SkillDefinition;
  currentRank: number;
  status: SkillNodeStatus;
  isEquipped: boolean;
  canAllocateRank: boolean;
  canEquip: boolean;
  requirements: { label: string; met: boolean }[];
}

export class SkillService implements ISkillService {
  private readonly evaluator = new HeroRequirementEvaluator();

  buildTree(hero: Hero, unlockedBattleSkillSlots: number): SkillNodeView[] {
    return this.buildTreeForPointType(hero, 'improvement', unlockedBattleSkillSlots);
  }

  buildAscensionTree(hero: Hero, unlockedBattleSkillSlots: number): SkillNodeView[] {
    const props = hero.toProps();
    if (!props.ascensionId) return [];

    return this.buildTreeForPointType(hero, 'ascension', unlockedBattleSkillSlots);
  }

  private buildTreeForPointType(
    hero: Hero,
    pointType: 'improvement' | 'ascension',
    unlockedBattleSkillSlots: number,
  ): SkillNodeView[] {
    const props = hero.toProps();
    const skills = getSkillsForHero(hero.heroClass, props.ascensionId).filter(
      (skill) => skill.pointType === pointType,
    );
    const equippedLayout = toSkillSlotLayout(props.equippedSkillIds, unlockedBattleSkillSlots);

    return skills.map((definition) => {
      const currentRank = props.skillRanks[definition.id] ?? 0;
      const requirements = this.evaluator.evaluateAll(hero, definition.requirements);
      const reqsMet = requirements.every((req) => req.met);

      let status: SkillNodeStatus = 'locked';
      if (currentRank >= definition.maxRank) {
        status = 'maxed';
      } else if (currentRank > 0) {
        status = 'owned';
      } else if (reqsMet) {
        status = 'ready';
      }

      const isEquipped = equippedLayout.includes(definition.id);

      const canAllocateRank =
        pointType === 'improvement'
          ? this.canAllocate(hero, definition.id, unlockedBattleSkillSlots)
          : this.canAllocateAscension(hero, definition.id, unlockedBattleSkillSlots);

      return {
        definition,
        currentRank,
        status,
        isEquipped,
        canAllocateRank,
        canEquip:
          definition.id !== BASIC_ATTACK_SKILL_ID && currentRank > 0,
        requirements,
      };
    });
  }

  canAllocate(hero: Hero, skillId: SkillId, unlockedBattleSkillSlots: number): boolean {
    return this.canAllocateWithPointType(
      hero,
      skillId,
      'improvement',
      unlockedBattleSkillSlots,
    );
  }

  canAllocateAscension(
    hero: Hero,
    skillId: SkillId,
    unlockedBattleSkillSlots: number,
  ): boolean {
    return this.canAllocateWithPointType(
      hero,
      skillId,
      'ascension',
      unlockedBattleSkillSlots,
    );
  }

  private canAllocateWithPointType(
    hero: Hero,
    skillId: SkillId,
    pointType: 'improvement' | 'ascension',
    unlockedBattleSkillSlots: number,
  ): boolean {
    if (!hasUnlockedInvestableSkillSlot(unlockedBattleSkillSlots)) return false;

    const definition = getSkillById(skillId);
    if (!definition || definition.pointType !== pointType) return false;

    const props = hero.toProps();
    const currentRank = props.skillRanks[skillId] ?? 0;
    if (currentRank >= definition.maxRank) return false;

    // Skills de evolução (pointType ascension) usam o mesmo pool de Aprimoramento.
    if (props.unspentImprovementPoints < 1) return false;

    return this.evaluator.allMet(hero, definition.requirements);
  }

  allocate(hero: Hero, skillId: SkillId, unlockedBattleSkillSlots: number): Hero {
    if (!this.canAllocate(hero, skillId, unlockedBattleSkillSlots)) {
      throw new Error('Não é possível investir nesta skill');
    }
    return hero.spendImprovementPointOnSkill(skillId);
  }

  allocateAscension(
    hero: Hero,
    skillId: SkillId,
    unlockedBattleSkillSlots: number,
  ): Hero {
    if (!this.canAllocateAscension(hero, skillId, unlockedBattleSkillSlots)) {
      throw new Error('Não é possível investir nesta skill de ascensão');
    }
    return hero.spendImprovementPointOnSkill(skillId);
  }

  canAssignSkillToSlot(
    hero: Hero,
    skillId: SkillId,
    slotIndex: number,
    unlockedBattleSkillSlots: number,
  ): boolean {
    if (skillId === BASIC_ATTACK_SKILL_ID) return false;
    if ((hero.toProps().skillRanks[skillId] ?? 0) < 1) return false;

    const layout = toSkillSlotLayout(hero.toProps().equippedSkillIds, unlockedBattleSkillSlots);
    return slotIndex >= 1 && slotIndex < layout.length;
  }

  assignSkillToSlot(
    hero: Hero,
    skillId: SkillId,
    slotIndex: number,
    unlockedBattleSkillSlots: number,
  ): Hero {
    if (!this.canAssignSkillToSlot(hero, skillId, slotIndex, unlockedBattleSkillSlots)) {
      throw new Error('Não é possível alocar esta skill no slot');
    }

    const slotLimit = Math.max(1, Math.min(MAX_ACTIVE_BATTLE_SKILLS, unlockedBattleSkillSlots));
    return hero.assignSkillToSlot(skillId, slotIndex, slotLimit);
  }

  canDeactivate(hero: Hero, skillId: SkillId): boolean {
    if (skillId === BASIC_ATTACK_SKILL_ID) return false;
    return hero.toProps().equippedSkillIds.some((id) => id === skillId);
  }

  deactivate(hero: Hero, skillId: SkillId): Hero {
    if (!this.canDeactivate(hero, skillId)) {
      throw new Error('Esta skill não pode ser desativada');
    }
    return hero.deactivateSkill(skillId);
  }

  listCatalog(): SkillDefinition[] {
    return [...SKILL_CATALOG];
  }
}
