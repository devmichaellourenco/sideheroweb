import { normalizeKnightAscensionId } from './KnightEvolutionCatalog';
import { normalizePriestAscensionId } from './PriestEvolutionCatalog';
import { normalizeSorcererAscensionId } from './SorcererEvolutionCatalog';
import { AscensionId } from './SkillId';

export function normalizeAscensionId(ascensionId: AscensionId | null): AscensionId | null {
  if (!ascensionId) return null;
  const knightNormalized = normalizeKnightAscensionId(ascensionId) ?? ascensionId;
  const sorcererNormalized = normalizeSorcererAscensionId(knightNormalized) ?? knightNormalized;
  return normalizePriestAscensionId(sorcererNormalized) ?? sorcererNormalized;
}
