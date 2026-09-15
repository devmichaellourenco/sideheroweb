/**
 * Wrapper fino para o simulador de combate headless.
 * Compilado pelo esbuild para Node.js (combatSimCatalog.mjs) e usado pelo servidor.
 */
export {
  simulateEncounter,
  simulateEncounterBatch,
  simulateEncounterPlayback,
} from '../../src/domain/balance/CombatEncounterSimulator';

export type {
  SimRequest,
  SimPartyMember,
  SimAdHocSlot,
  SimDraftPhase,
  SimDraftWave,
  SimOutcome,
  HeroSimResult,
  EncounterSimulationResult,
  BatchSimulationResult,
  SimUnitSnapshot,
  SimSkillSnapshot,
  SimBattleStatsSnapshot,
  CombatSimSnapshot,
  EncounterPlaybackResult,
} from '../../src/domain/balance/CombatEncounterSimulator';

export {
  SIM_REFERENCE_PROFILES,
  isSimReferenceProfile,
  referenceGearRarityForTier,
} from '../../src/domain/balance/SimReferenceProfiles';

export type { SimReferenceProfile } from '../../src/domain/balance/SimReferenceProfiles';
export type { SimHeroLoadoutSpec, SimGearRarity } from '../../src/domain/balance/SimHeroLoadout';

export {
  sweepMapWinRate,
  DEFAULT_WIN_RATE_BAND,
} from '../../src/domain/balance/CampaignWinRateSweep';

export type {
  MapSweepSummary,
  PhaseSweepRow,
  WinRateBand,
  WinRateVerdict,
  SweepOptions,
} from '../../src/domain/balance/CampaignWinRateSweep';
