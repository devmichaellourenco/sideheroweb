import { Hero } from '../entities/Hero';
import { SkillId } from './SkillId';
import type { SkillNodeView } from './SkillService';

export interface ISkillService {
  buildTree(hero: Hero, unlockedBattleSkillSlots: number): SkillNodeView[];
  buildAscensionTree(hero: Hero, unlockedBattleSkillSlots: number): SkillNodeView[];
  allocate(hero: Hero, skillId: SkillId, unlockedBattleSkillSlots: number): Hero;
  allocateAscension(hero: Hero, skillId: SkillId, unlockedBattleSkillSlots: number): Hero;
  canAssignSkillToSlot(
    hero: Hero,
    skillId: SkillId,
    slotIndex: number,
    unlockedBattleSkillSlots: number,
  ): boolean;
  assignSkillToSlot(
    hero: Hero,
    skillId: SkillId,
    slotIndex: number,
    unlockedBattleSkillSlots: number,
  ): Hero;
  deactivate(hero: Hero, skillId: SkillId): Hero;
}
