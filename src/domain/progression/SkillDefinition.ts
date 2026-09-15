import { HeroClass } from '../entities/HeroClass';
import { AttributeKey } from './Attributes';
import { ProgressionRequirement } from './ProgressionRequirement';
import { AscensionId, SkillId } from './SkillId';

export type SkillScope = 'universal' | 'class' | 'monster';
export type SkillBranch = 'offense' | 'defense' | 'utility';
export type SkillPointType = 'improvement' | 'ascension';

export interface SkillDefinition {
  id: SkillId;
  scope: SkillScope;
  heroClass?: HeroClass;
  branch: SkillBranch;
  name: string;
  description: string;
  maxRank: number;
  requirements: ProgressionRequirement[];
  scaling: AttributeKey;
  pointType: SkillPointType;
  ascensionId?: AscensionId;
}
