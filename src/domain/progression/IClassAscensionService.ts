import { Hero } from '../entities/Hero';
import { AscensionId } from './SkillId';
import type { AscensionOptionView } from './ClassAscensionService';

export interface IClassAscensionService {
  listOptions(hero: Hero): AscensionOptionView[];
  ascend(hero: Hero, ascensionId: AscensionId): Hero;
}
