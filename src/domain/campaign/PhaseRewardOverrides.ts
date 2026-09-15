import staticOverrides from './data/phase-reward-overrides.json';
import type { PhaseDefinition } from './PhaseDefinition';

/** Metadados de recompensa/nome por fase — editáveis pelo Balance Lab. */
export interface PhaseRewardOverride {
  /** Nome exibido da fase (mesmo papel do displayName nas batalhas). */
  displayName?: string;
  /** Soma alvo de XP de todos os kills da fase. */
  targetXp?: number;
  /** Soma alvo de ouro de todos os kills da fase. */
  targetGold?: number;
}

export interface PhaseRewardOverridesFile {
  version: number;
  updatedAt: string | null;
  overrides: Record<string, PhaseRewardOverride>;
}

const embedded = staticOverrides as PhaseRewardOverridesFile;

/** Overrides em memória (Balance Lab / testes) — têm prioridade sobre o JSON embutido. */
let runtimeOverrides: Record<string, PhaseRewardOverride> | null = null;

export function getEmbeddedPhaseRewardOverrides(): PhaseRewardOverridesFile {
  return {
    version: embedded.version ?? 1,
    updatedAt: embedded.updatedAt ?? null,
    overrides: { ...(embedded.overrides ?? {}) },
  };
}

export function setRuntimePhaseRewardOverrides(
  overrides: Record<string, PhaseRewardOverride> | null,
): void {
  runtimeOverrides = overrides;
}

export function getPhaseRewardOverride(phaseId: string): PhaseRewardOverride | null {
  if (runtimeOverrides !== null) {
    return runtimeOverrides[phaseId] ?? null;
  }
  return embedded.overrides?.[phaseId] ?? null;
}

export function normalizePhaseRewardOverride(
  input: PhaseRewardOverride | null | undefined,
): PhaseRewardOverride | null {
  if (!input || typeof input !== 'object') return null;
  const displayName =
    typeof input.displayName === 'string' && input.displayName.trim()
      ? input.displayName.trim()
      : undefined;
  const targetXp =
    typeof input.targetXp === 'number' && Number.isFinite(input.targetXp) && input.targetXp > 0
      ? Math.floor(input.targetXp)
      : undefined;
  const targetGold =
    typeof input.targetGold === 'number' &&
    Number.isFinite(input.targetGold) &&
    input.targetGold > 0
      ? Math.floor(input.targetGold)
      : undefined;
  if (displayName === undefined && targetXp === undefined && targetGold === undefined) {
    return null;
  }
  return { displayName, targetXp, targetGold };
}

/** Aplica só o nome do override de recompensa (após merge de batalha). */
export function applyPhaseRewardDisplayName(
  phase: PhaseDefinition,
  override: PhaseRewardOverride | null | undefined,
): PhaseDefinition {
  const name = override?.displayName?.trim();
  if (!name) return phase;
  return { ...phase, displayName: name };
}

export function mergePhaseWithEmbeddedRewardDisplayName(
  phase: PhaseDefinition,
): PhaseDefinition {
  return applyPhaseRewardDisplayName(phase, getPhaseRewardOverride(phase.id));
}
