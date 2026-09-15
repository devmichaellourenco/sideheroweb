import { AscensionId } from './SkillId';

export type KnightEvolutionPath = 'military' | 'martial';

export interface KnightEvolutionTier {
  id: AscensionId;
  path: KnightEvolutionPath;
  tier: number;
  name: string;
  pathLabel: string;
  spriteFile: string;
}

export const KNIGHT_MILITARY_EVOLUTIONS: KnightEvolutionTier[] = [
  {
    id: 'knight_military_guerreiro',
    path: 'military',
    tier: 1,
    name: 'Guerreiro',
    pathLabel: 'Caminho Militar',
    spriteFile: 'galneon_guerreiro.png',
  },
  {
    id: 'knight_military_capitao',
    path: 'military',
    tier: 2,
    name: 'Capitão',
    pathLabel: 'Caminho Militar',
    spriteFile: 'galneon_capitao.png',
  },
  {
    id: 'knight_military_general',
    path: 'military',
    tier: 3,
    name: 'General',
    pathLabel: 'Caminho Militar',
    spriteFile: 'galneon_general.png',
  },
];

export const KNIGHT_MARTIAL_EVOLUTIONS: KnightEvolutionTier[] = [
  {
    id: 'knight_martial_gladiador',
    path: 'martial',
    tier: 1,
    name: 'Gladiador',
    pathLabel: 'Caminho Marcial',
    spriteFile: 'galneon_gladiador.png',
  },
  {
    id: 'knight_martial_mestre',
    path: 'martial',
    tier: 2,
    name: 'Mestre Marcial',
    pathLabel: 'Caminho Marcial',
    spriteFile: 'galneon_mestre_marcial.png',
  },
  {
    id: 'knight_martial_campeao',
    path: 'martial',
    tier: 3,
    name: 'Campeão',
    pathLabel: 'Caminho Marcial',
    spriteFile: 'galneon_campeao.png',
  },
];

const ALL_KNIGHT_EVOLUTIONS = [...KNIGHT_MILITARY_EVOLUTIONS, ...KNIGHT_MARTIAL_EVOLUTIONS];

const evolutionById = new Map<AscensionId, KnightEvolutionTier>(
  ALL_KNIGHT_EVOLUTIONS.map((entry) => [entry.id, entry]),
);

const LEGACY_KNIGHT_ASCENSION_MAP: Record<string, AscensionId> = {
  knight_guardian: 'knight_military_general',
  knight_reaver: 'knight_martial_gladiador',
};

export function isKnightEvolutionId(ascensionId: AscensionId): boolean {
  return evolutionById.has(ascensionId);
}

export function normalizeKnightAscensionId(ascensionId: AscensionId | null): AscensionId | null {
  if (!ascensionId) return null;
  return LEGACY_KNIGHT_ASCENSION_MAP[ascensionId] ?? ascensionId;
}

export function getKnightEvolution(ascensionId: AscensionId): KnightEvolutionTier | undefined {
  return evolutionById.get(normalizeKnightAscensionId(ascensionId) ?? ascensionId);
}

export function knightEvolutionUnlocksSkill(
  heroAscensionId: AscensionId | null,
  skillAscensionId: AscensionId,
): boolean {
  const current = heroAscensionId ? getKnightEvolution(heroAscensionId) : null;
  const required = getKnightEvolution(skillAscensionId);
  if (!current || !required) return false;
  return current.path === required.path && current.tier >= required.tier;
}

export function hasReachedKnightEvolution(
  heroAscensionId: AscensionId | null,
  requiredAscensionId: AscensionId,
): boolean {
  return knightEvolutionUnlocksSkill(heroAscensionId, requiredAscensionId);
}

export function resolveKnightSpritePath(ascensionId: AscensionId): string | null {
  const evolution = getKnightEvolution(ascensionId);
  if (!evolution) return null;
  return `characters/${evolution.spriteFile}`;
}

export function isKnightEvolutionMaxed(ascensionId: AscensionId | null): boolean {
  const evolution = ascensionId ? getKnightEvolution(ascensionId) : null;
  return evolution?.tier === 3;
}

export function getKnightEvolutionDisplayName(ascensionId: AscensionId): string {
  const evolution = getKnightEvolution(ascensionId);
  if (!evolution) return ascensionId;
  return `${evolution.pathLabel} · ${evolution.name}`;
}
