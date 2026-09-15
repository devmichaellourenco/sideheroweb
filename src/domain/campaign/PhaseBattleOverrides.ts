import type { PhaseDefinition } from '../PhaseDefinition';
import type { WaveDefinition } from '../WaveDefinition';
import staticOverrides from './data/phase-battle-overrides.json';

/** Override parcial de batalha (waves) por phaseId — editável pelo Balance Lab. */
export interface PhaseBattleOverride {
  displayName?: string;
  statMultiplier?: number;
  waves: WaveDefinition[];
}

export interface PhaseBattleOverridesFile {
  version: number;
  updatedAt: string | null;
  overrides: Record<string, PhaseBattleOverride>;
}

const embedded = staticOverrides as PhaseBattleOverridesFile;

export function getEmbeddedPhaseBattleOverrides(): PhaseBattleOverridesFile {
  return {
    version: embedded.version ?? 1,
    updatedAt: embedded.updatedAt ?? null,
    overrides: { ...(embedded.overrides ?? {}) },
  };
}

export function getEmbeddedPhaseBattleOverride(
  phaseId: string,
): PhaseBattleOverride | null {
  return embedded.overrides?.[phaseId] ?? null;
}

export function applyPhaseBattleOverride(
  phase: PhaseDefinition,
  override: PhaseBattleOverride | null | undefined,
): PhaseDefinition {
  if (!override || !Array.isArray(override.waves) || override.waves.length === 0) {
    return phase;
  }

  return {
    ...phase,
    displayName: override.displayName?.trim() || phase.displayName,
    statMultiplier:
      typeof override.statMultiplier === 'number' && Number.isFinite(override.statMultiplier)
        ? override.statMultiplier
        : phase.statMultiplier,
    waves: override.waves.map((wave, index) => ({
      id: wave.id?.trim() || `w${index + 1}`,
      goldMultiplier: wave.goldMultiplier,
      slots: (wave.slots ?? []).map((slot) => ({
        enemyType: slot.enemyType,
        role: slot.role,
        count: Math.max(1, Math.floor(slot.count || 1)),
        displayName: slot.displayName,
        level: slot.level,
      })),
    })),
  };
}

export function mergePhaseWithEmbeddedOverride(phase: PhaseDefinition): PhaseDefinition {
  return applyPhaseBattleOverride(phase, getEmbeddedPhaseBattleOverride(phase.id));
}
