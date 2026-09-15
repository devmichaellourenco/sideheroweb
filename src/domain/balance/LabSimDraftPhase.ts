import type { PhaseDefinition } from '../campaign/PhaseDefinition';

/**
 * Override temporário de fase só para o processo do Balance Lab / simulador headless.
 * `resolvePhase` consulta isto antes do catálogo + JSON embutido.
 */
let active: PhaseDefinition | null = null;

export function getLabSimDraftPhase(phaseId: string): PhaseDefinition | null {
  return active && active.id === phaseId ? active : null;
}

export function withLabSimDraftPhase<T>(phase: PhaseDefinition | null, fn: () => T): T {
  const previous = active;
  active = phase;
  try {
    return fn();
  } finally {
    active = previous;
  }
}
