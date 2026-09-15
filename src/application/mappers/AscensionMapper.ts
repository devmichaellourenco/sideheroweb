import { AscensionOptionView } from '../../domain/progression/ClassAscensionService';
import { AscensionOptionDto } from '../dto/AscensionOptionDto';

export function mapAscensionOptions(options: AscensionOptionView[]): AscensionOptionDto[] {
  return options.map((option) => ({
    id: option.definition.id,
    name: option.definition.name,
    description: option.definition.description,
    pathLabel: option.definition.pathLabel,
    requirements: option.requirements,
    canAscend: option.canAscend,
    pointsGranted: option.definition.pointsGranted,
  }));
}
