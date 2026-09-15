/**
 * Varredor de win rate por mapa — roda o simulador headless em cada fase com a
 * party de referência no nível projetado de chegada e classifica o resultado
 * contra a faixa-alvo de flow (Core: 60–85%).
 *
 * Transforma a auditoria de dificuldade (BAL-019 e mapas futuros) em relatório
 * automático: em vez de simular fase a fase à mão, aponta direto os outliers.
 */
import { Experience } from '../value-objects/Experience';
import { listPhasesForMap } from '../campaign/CampaignCatalog';
import type { MapId } from '../campaign/CampaignIds';
import { simulateEncounterBatch, type SimPartyMember } from './CombatEncounterSimulator';
import { effectivePhaseXpTotal } from './PhaseXpBudget';
import type { SimReferenceProfile } from './SimReferenceProfiles';

export interface WinRateBand {
  /** Piso da faixa-alvo (Core = 0.60). Abaixo disso a fase é muito difícil. */
  min: number;
  /** Teto da faixa-alvo (Core = 0.85). Acima disso a fase é fácil demais. */
  max: number;
}

export const DEFAULT_WIN_RATE_BAND: WinRateBand = { min: 0.6, max: 0.85 };

export type WinRateVerdict = 'too_hard' | 'in_band' | 'too_easy';

export interface PhaseSweepRow {
  phaseId: string;
  displayName: string;
  difficultyTier: number;
  waveCount: number;
  /** Nível projetado de chegada (XP acumulado até a fase anterior). */
  partyLevel: number;
  winRate: number;
  wipeRate: number;
  timeoutRate: number;
  avgCombatTime: number;
  avgHpPercent: number;
  verdict: WinRateVerdict;
}

export interface MapSweepSummary {
  mapId: MapId;
  profile: SimReferenceProfile;
  runsPerPhase: number;
  band: WinRateBand;
  phases: PhaseSweepRow[];
  tooHard: number;
  inBand: number;
  tooEasy: number;
  /** Fases fora da faixa, para ação direta. */
  outliers: PhaseSweepRow[];
}

export interface SweepOptions {
  /** Classes da party de referência (o nível vem da projeção). Default: knight+sorcerer+priest. */
  partyClasses?: string[];
  profile?: SimReferenceProfile;
  runsPerPhase?: number;
  band?: WinRateBand;
  seed?: number;
  /** Nível mínimo de chegada — evita testar 1-1 com herói nível 1 puro. */
  minLevel?: number;
  /**
   * Quantas vezes o jogador luta cada fase antes de avançar. `1` modela quem só
   * faz um passe pela main; valores acima modelam quem farma normais no
   * acampamento (o XP por fase é payout **por batalha**, não por fase única).
   */
  repeatsPerPhase?: number;
}

/** Ritmo pretendido no Stendra: ~107 batalhas para 24 níveis em 50 fases. */
export const INTENDED_REPEATS_PER_PHASE = 2.1;

const DEFAULT_PARTY_CLASSES = ['knight', 'sorcerer', 'priest'];

function classifyWinRate(winRate: number, band: WinRateBand): WinRateVerdict {
  if (winRate < band.min) return 'too_hard';
  if (winRate > band.max) return 'too_easy';
  return 'in_band';
}

function levelFromCumulativeXp(cumulativeXp: number, minLevel: number): number {
  const level = Experience.initial().gain(cumulativeXp).experience.level;
  return Math.max(minLevel, level);
}

/**
 * Varre um mapa e devolve win rate por fase + classificação.
 *
 * O nível testado em cada fase é o que o jogador teria ao **chegar** nela (XP
 * acumulado das fases anteriores), então o veredito reflete a experiência real de
 * quem progride linearmente — não um nível arbitrário.
 */
export function sweepMapWinRate(mapId: MapId, options: SweepOptions = {}): MapSweepSummary {
  const partyClasses = options.partyClasses?.length ? options.partyClasses : DEFAULT_PARTY_CLASSES;
  const profile: SimReferenceProfile = options.profile ?? 'geared';
  // 10 runs oscilam ±20pp em fases de win rate intermediário; 20 é o mínimo estável.
  const runsPerPhase = Math.max(1, Math.floor(options.runsPerPhase ?? 20));
  const band = options.band ?? DEFAULT_WIN_RATE_BAND;
  const minLevel = Math.max(1, Math.floor(options.minLevel ?? 2));
  const repeats = Math.max(1, options.repeatsPerPhase ?? INTENDED_REPEATS_PER_PHASE);

  const phases = listPhasesForMap(mapId);
  const rows: PhaseSweepRow[] = [];
  let cumulativeXp = 0;

  for (const phase of phases) {
    const partyLevel = levelFromCumulativeXp(cumulativeXp, minLevel);
    const party: SimPartyMember[] = partyClasses.map((heroClass) => ({ heroClass, level: partyLevel }));

    const batch = simulateEncounterBatch(
      { party, profile, phaseId: phase.id, seed: options.seed ?? 1 },
      runsPerPhase,
    );

    rows.push({
      phaseId: phase.id,
      displayName: phase.displayName,
      difficultyTier: phase.difficultyTier,
      waveCount: phase.waves.length,
      partyLevel,
      winRate: batch.winRate,
      wipeRate: batch.wipeRate,
      timeoutRate: batch.timeoutRate,
      avgCombatTime: batch.avgCombatTime,
      avgHpPercent: batch.avgHpPercent,
      verdict: classifyWinRate(batch.winRate, band),
    });

    cumulativeXp += effectivePhaseXpTotal(phase.id) * repeats;
  }

  const outliers = rows.filter((row) => row.verdict !== 'in_band');

  return {
    mapId,
    profile,
    runsPerPhase,
    band,
    phases: rows,
    tooHard: rows.filter((row) => row.verdict === 'too_hard').length,
    inBand: rows.filter((row) => row.verdict === 'in_band').length,
    tooEasy: rows.filter((row) => row.verdict === 'too_easy').length,
    outliers,
  };
}
