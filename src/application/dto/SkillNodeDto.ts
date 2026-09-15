import { HeroActiveSkillStatDto } from './GameStateDto';

export type SkillBranchDto = 'offense' | 'defense' | 'utility';
export type SkillScopeDto = 'universal' | 'class';
export type SkillNodeStatusDto = 'locked' | 'ready' | 'owned' | 'maxed';

export interface SkillRequirementDto {
  label: string;
  met: boolean;
}

export interface SkillRankSlotDto {
  rank: number;
  filled: boolean;
  isNext: boolean;
  canAllocate: boolean;
  previewTitle: string;
  previewLines: string[];
}

export interface SkillNodeDto {
  id: string;
  name: string;
  description: string;
  branch: SkillBranchDto;
  branchLabel: string;
  scope: SkillScopeDto;
  scopeLabel: string;
  maxRank: number;
  currentRank: number;
  status: SkillNodeStatusDto;
  isEquipped: boolean;
  canAllocateRank: boolean;
  canEquip: boolean;
  scaling: string;
  scalingLabel: string;
  battleStats: HeroActiveSkillStatDto[];
  requirements: SkillRequirementDto[];
  rankSlots: SkillRankSlotDto[];
}

export const SKILL_BRANCH_LABELS: Record<SkillBranchDto, string> = {
  offense: 'Ofensivo',
  defense: 'Defensivo',
  utility: 'Utilidade',
};
