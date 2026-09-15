import { AscensionId } from './SkillId';

export type PriestEvolutionPath = 'sacred' | 'life';

export interface PriestEvolutionTier {
  id: AscensionId;
  path: PriestEvolutionPath;
  tier: number;
  name: string;
  pathLabel: string;
  spriteFile: string;
}

export const PRIEST_SACRED_EVOLUTIONS: PriestEvolutionTier[] = [
  {
    id: 'priest_sacred_cleriga',
    path: 'sacred',
    tier: 1,
    name: 'Clériga Sagrada',
    pathLabel: 'Caminho Sagrado',
    spriteFile: 'elara_cleriga_sagrada.png',
  },
  {
    id: 'priest_sacred_alta_sacerdotisa',
    path: 'sacred',
    tier: 2,
    name: 'Alta Sacerdotisa',
    pathLabel: 'Caminho Sagrado',
    spriteFile: 'elara_alta_sacerdotiza.png',
  },
  {
    id: 'priest_sacred_santa',
    path: 'sacred',
    tier: 3,
    name: 'Santa',
    pathLabel: 'Caminho Sagrado',
    spriteFile: 'elara_santa.png',
  },
];

export const PRIEST_LIFE_EVOLUTIONS: PriestEvolutionTier[] = [
  {
    id: 'priest_life_cleriga',
    path: 'life',
    tier: 1,
    name: 'Clériga da Vida',
    pathLabel: 'Caminho da Vida',
    spriteFile: 'elara_cleriga_da_vida.png',
  },
  {
    id: 'priest_life_guardia',
    path: 'life',
    tier: 2,
    name: 'Guardiã da Vida',
    pathLabel: 'Caminho da Vida',
    spriteFile: 'elara_guardia_da_vida.png',
  },
  {
    id: 'priest_life_filha_aurora',
    path: 'life',
    tier: 3,
    name: 'Filha da Aurora',
    pathLabel: 'Caminho da Vida',
    spriteFile: 'elara_filha_da_aurora.png',
  },
];

const ALL_PRIEST_EVOLUTIONS = [...PRIEST_SACRED_EVOLUTIONS, ...PRIEST_LIFE_EVOLUTIONS];

const evolutionById = new Map<AscensionId, PriestEvolutionTier>(
  ALL_PRIEST_EVOLUTIONS.map((entry) => [entry.id, entry]),
);

const LEGACY_PRIEST_ASCENSION_MAP: Record<string, AscensionId> = {
  priest_oracle: 'priest_life_cleriga',
  priest_inquisitor: 'priest_sacred_cleriga',
};

export function isPriestEvolutionId(ascensionId: AscensionId): boolean {
  return evolutionById.has(ascensionId);
}

export function normalizePriestAscensionId(ascensionId: AscensionId | null): AscensionId | null {
  if (!ascensionId) return null;
  return LEGACY_PRIEST_ASCENSION_MAP[ascensionId] ?? ascensionId;
}

export function getPriestEvolution(ascensionId: AscensionId): PriestEvolutionTier | undefined {
  return evolutionById.get(normalizePriestAscensionId(ascensionId) ?? ascensionId);
}

export function priestEvolutionUnlocksSkill(
  heroAscensionId: AscensionId | null,
  skillAscensionId: AscensionId,
): boolean {
  const current = heroAscensionId ? getPriestEvolution(heroAscensionId) : null;
  const required = getPriestEvolution(skillAscensionId);
  if (!current || !required) return false;
  return current.path === required.path && current.tier >= required.tier;
}

export function hasReachedPriestEvolution(
  heroAscensionId: AscensionId | null,
  requiredAscensionId: AscensionId,
): boolean {
  return priestEvolutionUnlocksSkill(heroAscensionId, requiredAscensionId);
}

export function resolvePriestSpritePath(ascensionId: AscensionId): string | null {
  const evolution = getPriestEvolution(ascensionId);
  if (!evolution) return null;
  return `characters/${evolution.spriteFile}`;
}

export function isPriestEvolutionMaxed(ascensionId: AscensionId | null): boolean {
  const evolution = ascensionId ? getPriestEvolution(ascensionId) : null;
  return evolution?.tier === 3;
}

export function getPriestEvolutionDisplayName(ascensionId: AscensionId): string {
  const evolution = getPriestEvolution(ascensionId);
  if (!evolution) return ascensionId;
  return `${evolution.pathLabel} · ${evolution.name}`;
}
