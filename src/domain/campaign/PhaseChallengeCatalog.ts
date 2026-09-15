import { DamageElement } from '../combat/DamageElement';
import { PhaseId } from './CampaignIds';
import { PhaseChallengeKind } from './PhaseChallengeTypes';
import { WaveDefinition } from './WaveDefinition';
import {
  PhaseChallengeBlueprint,
} from './challenges/challengeBuilders';
import { GRUFTALL_CHALLENGES } from './challenges/gruftallChallenges';
import { MORTHAVEN_CHALLENGES } from './challenges/morthavenChallenges';
import { STENDRA_CHALLENGES } from './challenges/stendraChallenges';
import { VALDRIS_CHALLENGES } from './challenges/valdrisChallenges';

export type { PhaseChallengeBlueprint } from './challenges/challengeBuilders';

/**
 * Micro-desafios handcraft (BAL-011).
 * Pressão rotativa por slot: race→priest, sustain→priest+, warded→mago,
 * armored→físico, spike→tank/resist. Soft band — dor sem wall.
 */
const CHALLENGES: Record<PhaseId, PhaseChallengeBlueprint> = {
  ...STENDRA_CHALLENGES,
  ...GRUFTALL_CHALLENGES,
  ...VALDRIS_CHALLENGES,
  ...MORTHAVEN_CHALLENGES,
};

export function getPhaseChallenge(phaseId: PhaseId): PhaseChallengeBlueprint | null {
  return CHALLENGES[phaseId] ?? null;
}

export function listPhaseChallengeIds(): PhaseId[] {
  return Object.keys(CHALLENGES);
}

export function applyPhaseChallenge(
  phase: {
    id: PhaseId;
    displayName: string;
    waves: WaveDefinition[];
    statMultiplier?: number;
    challengeKind?: PhaseChallengeKind;
    challengeLabel?: string;
    challengeHint?: string;
    spikeElement?: DamageElement;
  },
  challenge: PhaseChallengeBlueprint,
): typeof phase {
  return {
    ...phase,
    displayName: challenge.displayName ?? phase.displayName,
    waves: challenge.waves,
    statMultiplier: challenge.statMultiplier,
    challengeKind: challenge.kind,
    challengeLabel: challenge.label,
    challengeHint: challenge.hint,
    spikeElement: challenge.spikeElement,
  };
}
