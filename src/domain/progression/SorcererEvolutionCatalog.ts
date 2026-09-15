import { AscensionId } from './SkillId';

export type SorcererEvolutionPath = 'arcane' | 'innate';

export interface SorcererEvolutionTier {
  id: AscensionId;
  path: SorcererEvolutionPath;
  tier: number;
  name: string;
  pathLabel: string;
  spriteFile: string;
}

export const SORCERER_ARCANE_EVOLUTIONS: SorcererEvolutionTier[] = [
  {
    id: 'sorcerer_arcane_maga',
    path: 'arcane',
    tier: 1,
    name: 'Maga',
    pathLabel: 'Caminho Arcano',
    spriteFile: 'nix_maga.png',
  },
  {
    id: 'sorcerer_arcane_arquimaga',
    path: 'arcane',
    tier: 2,
    name: 'Arquimaga',
    pathLabel: 'Caminho Arcano',
    spriteFile: 'nix_arquimaga.png',
  },
  {
    id: 'sorcerer_arcane_imperatriz',
    path: 'arcane',
    tier: 3,
    name: 'Imperatriz Arcana',
    pathLabel: 'Caminho Arcano',
    spriteFile: 'nix_imperatriz_arcana.png',
  },
];

export const SORCERER_INNATE_EVOLUTIONS: SorcererEvolutionTier[] = [
  {
    id: 'sorcerer_innate_feiticeira',
    path: 'innate',
    tier: 1,
    name: 'Feiticeira',
    pathLabel: 'Caminho Inato',
    spriteFile: 'nix_feiticeira.png',
  },
  {
    id: 'sorcerer_innate_soberana',
    path: 'innate',
    tier: 2,
    name: 'Soberana Astral',
    pathLabel: 'Caminho Inato',
    spriteFile: 'nix_soberana_astral.png',
  },
  {
    id: 'sorcerer_innate_filha_eter',
    path: 'innate',
    tier: 3,
    name: 'Filha do Éter',
    pathLabel: 'Caminho Inato',
    spriteFile: 'nix_filha_do_eter.png',
  },
];

const ALL_SORCERER_EVOLUTIONS = [...SORCERER_ARCANE_EVOLUTIONS, ...SORCERER_INNATE_EVOLUTIONS];

const evolutionById = new Map<AscensionId, SorcererEvolutionTier>(
  ALL_SORCERER_EVOLUTIONS.map((entry) => [entry.id, entry]),
);

const LEGACY_SORCERER_ASCENSION_MAP: Record<string, AscensionId> = {
  sorcerer_pyromancer: 'sorcerer_innate_feiticeira',
  sorcerer_arcanist: 'sorcerer_arcane_maga',
};

export function isSorcererEvolutionId(ascensionId: AscensionId): boolean {
  return evolutionById.has(ascensionId);
}

export function normalizeSorcererAscensionId(ascensionId: AscensionId | null): AscensionId | null {
  if (!ascensionId) return null;
  return LEGACY_SORCERER_ASCENSION_MAP[ascensionId] ?? ascensionId;
}

export function getSorcererEvolution(ascensionId: AscensionId): SorcererEvolutionTier | undefined {
  return evolutionById.get(normalizeSorcererAscensionId(ascensionId) ?? ascensionId);
}

export function sorcererEvolutionUnlocksSkill(
  heroAscensionId: AscensionId | null,
  skillAscensionId: AscensionId,
): boolean {
  const current = heroAscensionId ? getSorcererEvolution(heroAscensionId) : null;
  const required = getSorcererEvolution(skillAscensionId);
  if (!current || !required) return false;
  return current.path === required.path && current.tier >= required.tier;
}

export function hasReachedSorcererEvolution(
  heroAscensionId: AscensionId | null,
  requiredAscensionId: AscensionId,
): boolean {
  return sorcererEvolutionUnlocksSkill(heroAscensionId, requiredAscensionId);
}

export function resolveSorcererSpritePath(ascensionId: AscensionId): string | null {
  const evolution = getSorcererEvolution(ascensionId);
  if (!evolution) return null;
  return `characters/${evolution.spriteFile}`;
}

export function isSorcererEvolutionMaxed(ascensionId: AscensionId | null): boolean {
  const evolution = ascensionId ? getSorcererEvolution(ascensionId) : null;
  return evolution?.tier === 3;
}

export function getSorcererEvolutionDisplayName(ascensionId: AscensionId): string {
  const evolution = getSorcererEvolution(ascensionId);
  if (!evolution) return ascensionId;
  return `${evolution.pathLabel} · ${evolution.name}`;
}
