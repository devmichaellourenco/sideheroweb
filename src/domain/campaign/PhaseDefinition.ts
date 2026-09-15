import { CampaignId, MapId, PhaseId } from './CampaignIds';
import { DamageElement } from '../combat/DamageElement';
import { PhaseChallengeKind } from './PhaseChallengeTypes';
import { WaveDefinition } from './WaveDefinition';

export interface PhaseDefinition {
  id: PhaseId;
  campaignId: CampaignId;
  mapId: MapId;
  displayName: string;
  difficultyTier: number;
  waves: WaveDefinition[];
  /** Fases desbloqueadas ao derrotar o boss. Suporta múltiplos IDs para bifurcações futuras. */
  unlocks: PhaseId[];
  /** Boss de capítulo a cada 50 fases — inimigos mais fortes. */
  milestoneBoss?: boolean;
  /** Última fase da temporada no perfil de release ativo (v1: 4-50). */
  seasonFinale?: boolean;
  /** Multiplicador extra de stats dos inimigos desta fase. */
  statMultiplier?: number;
  /** Micro-desafio BAL-011 (race / sustain / spike). */
  challengeKind?: PhaseChallengeKind;
  challengeLabel?: string;
  challengeHint?: string;
  spikeElement?: DamageElement;
}
