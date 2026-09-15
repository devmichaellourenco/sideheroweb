import { DamageElement } from '../combat/DamageElement';

/**
 * Arquétipos de micro-desafio (BAL-011). Soft — dor real, sem wall.
 * Cada kind pressiona um slot/build diferente (não só Elara/priest).
 */
export type PhaseChallengeKind = 'race' | 'sustain' | 'spike' | 'warded' | 'armored';

export const PHASE_CHALLENGE_KIND_LABEL: Record<PhaseChallengeKind, string> = {
  race: 'Corrida de dano',
  sustain: 'Atrito',
  spike: 'Pico elemental',
  warded: 'Escudo elemental',
  armored: 'Couraça física',
};

function elementWord(element: DamageElement | null | undefined): string {
  if (element === 'cold') return 'gelo';
  if (element === 'fire') return 'fogo';
  if (element === 'lightning') return 'raio';
  if (element === 'air') return 'ar/veneno';
  if (element === 'physical') return 'físico';
  return 'elemental';
}

export function formatPhaseChallengeHint(
  kind: PhaseChallengeKind,
  options?: {
    spikeElement?: DamageElement | null;
    /** Elemento(s) que os inimigos resistem (anti-mago). */
    wardedElement?: DamageElement | null;
  },
): string {
  if (kind === 'race') {
    return 'Corrida de dano — DPS/AoE brilha; priest na party atrasa o clear.';
  }
  if (kind === 'sustain') {
    return 'Atrito longo — priest/consistência valem o slot; glass puro sangra.';
  }
  if (kind === 'warded') {
    const ward = elementWord(options?.wardedElement ?? null);
    return `Escudo de ${ward} — mago perde eficiência; físico (guerreiro/berserker/arqueira) costuma limpar melhor.`;
  }
  if (kind === 'armored') {
    return 'Couraça física — DEF alta/corpos duros; mago/elemental costuma render mais que DPS físico puro.';
  }
  const elementLabel = elementWord(options?.spikeElement ?? null);
  return `Pico de ${elementLabel} — resist/tank (paladino) importa; glass DPS sofre o estouro.`;
}
