import { HeroClass } from '../entities/HeroClass';
import { AscensionId } from './SkillId';
import { ProgressionRequirement } from './ProgressionRequirement';

export interface ClassAscension {
  id: AscensionId;
  heroClass: HeroClass;
  name: string;
  description: string;
  requirements: ProgressionRequirement[];
  pointsGranted: number;
  /** Ascensão necessária antes desta. `null` = disponível para Aprendiz. */
  prerequisiteAscensionId: AscensionId | null;
  /** Rótulo do caminho (ex.: Caminho Militar). */
  pathLabel?: string;
}
