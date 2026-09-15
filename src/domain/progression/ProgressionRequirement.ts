import { AttributeKey } from './Attributes';
import { HeroClass } from '../entities/HeroClass';
import { AscensionId, SkillId } from './SkillId';

export type ProgressionRequirement =
  | { type: 'hero_level'; min: number }
  | { type: 'attribute'; key: AttributeKey; min: number }
  | { type: 'skill_rank'; skillId: SkillId; minRank: number }
  | { type: 'hero_class'; heroClass: HeroClass }
  | { type: 'ascension'; ascensionId: AscensionId };
