import {
  MilestoneVictoryPresentation,
  resolveMilestoneVictoryPresentation,
} from '../../application/mappers/MilestoneRewardPresentation';
import { GameStateDto, CombatIntermissionDto } from '../../application/dto/GameStateDto';
import { resolvePhase } from '../../domain/campaign/CampaignCatalog';
import { resolveDefeatHint } from './DefeatHintPolicy';

export type BattleVictoryVariant = 'wave-clear' | 'boss-approach' | 'phase-clear' | 'defeat';

export interface HeroVictoryReward {
  heroId: string;
  name: string;
  leveledUp: boolean;
  newLevel?: number;
}

export interface BattleVictoryPayload {
  variant: BattleVictoryVariant;
  clearedPhaseId: string;
  clearedPhaseName: string;
  nextPhaseId: string | null;
  nextPhaseName: string | null;
  goldGained: number;
  xpGained: number;
  heroRewards: HeroVictoryReward[];
  chestDropped: boolean;
  chestCount: number;
  tierReached: number | null;
  seasonCompleted: boolean;
  milestoneVictory: MilestoneVictoryPresentation | null;
  defeatHint: string | null;
}

export function detectBattleVictory(
  previous: GameStateDto,
  next: GameStateDto,
): BattleVictoryPayload | null {
  return detectPhaseVictory(previous, next) ?? detectWaveClearVictory(previous, next);
}

export function buildBattleIntermissionPayload(
  intermission: CombatIntermissionDto,
  state: GameStateDto,
  previous: GameStateDto | null,
  attemptBaseline: GameStateDto | null = null,
): BattleVictoryPayload {
  const fromDiff = previous ? detectBattleVictory(previous, state) : null;
  const isTerminal =
    intermission.variant === 'phase-clear' || intermission.variant === 'defeat';
  const rewardSource = isTerminal ? attemptBaseline ?? previous : previous;

  if (fromDiff && !attemptBaseline) {
    return fromDiff;
  }

  const rewards = rewardSource
    ? computeRewardDelta(rewardSource, state, { preferXpSource: 'hero' })
    : {
        goldGained: fromDiff?.goldGained ?? 0,
        xpGained: fromDiff?.xpGained ?? 0,
        heroRewards: fromDiff?.heroRewards ?? [],
        chestDropped: fromDiff?.chestDropped ?? false,
        chestCount: fromDiff?.chestCount ?? 0,
        tierReached: fromDiff?.tierReached ?? null,
      };

  if (fromDiff) {
    return {
      ...fromDiff,
      goldGained: rewards.goldGained,
      xpGained: rewards.xpGained,
      heroRewards: rewards.heroRewards,
      chestDropped: rewards.chestDropped,
      chestCount: rewards.chestCount,
      tierReached: rewards.tierReached,
    };
  }

  return {
    variant: intermission.variant,
    clearedPhaseId: intermission.clearedPhaseId,
    clearedPhaseName: intermission.clearedPhaseName,
    nextPhaseId: intermission.nextPhaseId,
    nextPhaseName: intermission.nextPhaseName,
    goldGained: rewards.goldGained,
    xpGained: rewards.xpGained,
    heroRewards: rewards.heroRewards,
    chestDropped: rewards.chestDropped,
    chestCount: rewards.chestCount,
    tierReached: rewards.tierReached,
    seasonCompleted: state.seasonCompleted,
    milestoneVictory: null,
    defeatHint:
      intermission.variant === 'defeat'
        ? resolveDefeatHint(previous?.enemies ?? state.enemies ?? [])
        : null,
  };
}

function detectWaveClearVictory(
  previous: GameStateDto,
  next: GameStateDto,
): BattleVictoryPayload | null {
  const previousRun = previous.phaseRun;
  const nextRun = next.phaseRun;

  if (!previousRun || !nextRun) return null;
  if (previousRun.phaseId !== nextRun.phaseId) return null;
  if (nextRun.waveIndex <= previousRun.waveIndex) return null;
  if (previousRun.isBossWave) return null;

  return buildVictoryPayload(previous, next, {
    variant: nextRun.isBossWave ? 'boss-approach' : 'wave-clear',
    clearedPhaseId: previousRun.phaseId,
    clearedPhaseName: previousRun.displayName,
    nextPhaseId: null,
    nextPhaseName: null,
    seasonCompleted: false,
  });
}

function detectPhaseVictory(
  previous: GameStateDto,
  next: GameStateDto,
): BattleVictoryPayload | null {
  const wasBossWave = previous.phaseRun?.isBossWave === true;
  const clearedNow = next.campaignProgress.clearedPhaseIds.filter(
    (phaseId) => !previous.campaignProgress.clearedPhaseIds.includes(phaseId),
  );
  const seasonJustCompleted = !previous.seasonCompleted && next.seasonCompleted;

  if (!wasBossWave || (clearedNow.length === 0 && !seasonJustCompleted)) {
    return null;
  }

  const clearedPhaseId =
    clearedNow[clearedNow.length - 1] ?? previous.phaseRun?.phaseId ?? next.phaseLabel;
  const clearedPhase = resolvePhase(clearedPhaseId);
  const clearedPhaseName =
    previous.phaseRun?.displayName ?? clearedPhase?.displayName ?? clearedPhaseId;

  const nextPhaseId = seasonJustCompleted ? null : next.campaignProgress.selectedPhaseId;
  const nextPhase = nextPhaseId ? resolvePhase(nextPhaseId) : null;
  const nextPhaseName =
    nextPhaseId && nextPhaseId !== clearedPhaseId
      ? (nextPhase?.displayName ?? nextPhaseId)
      : null;

  return buildVictoryPayload(previous, next, {
    variant: 'phase-clear',
    clearedPhaseId,
    clearedPhaseName,
    nextPhaseId: nextPhaseName ? nextPhaseId : null,
    nextPhaseName,
    seasonCompleted: seasonJustCompleted,
  });
}

function computeHeroXpGained(previous: GameStateDto, next: GameStateDto): number {
  return next.heroes.reduce((sum, hero) => {
    const oldHero = previous.heroes.find((entry) => entry.id === hero.id);
    if (!oldHero) return sum;

    if (hero.level === oldHero.level) {
      return sum + Math.max(0, hero.experience - oldHero.experience);
    }

    if (hero.level > oldHero.level) {
      const toLevelUp = Math.max(0, oldHero.experienceToNextLevel - oldHero.experience);
      const afterLevels = Math.max(0, hero.experience);
      // Níveis intermediários: usa o toNext do herói antigo como aproximação por nível.
      const midLevels = Math.max(0, hero.level - oldHero.level - 1) * oldHero.experienceToNextLevel;
      return sum + toLevelUp + midLevels + afterLevels;
    }

    return sum;
  }, 0);
}

function computeRewardDelta(
  previous: GameStateDto,
  next: GameStateDto,
  _options: { preferXpSource: 'hero' | 'enemy' } = { preferXpSource: 'hero' },
): {
  goldGained: number;
  xpGained: number;
  heroRewards: HeroVictoryReward[];
  chestDropped: boolean;
  chestCount: number;
  tierReached: number | null;
} {
  const goldGained = Math.max(0, next.gold - previous.gold);
  // XP da fase é concedido na vitória nos heróis; inimigos não carregam XP por kill.
  const xpGained = computeHeroXpGained(previous, next);
  const chestCount = Math.max(0, next.pendingChestCount - previous.pendingChestCount);
  const tierReached = next.stage > previous.stage ? next.stage : null;

  const heroRewards = next.heroes
    .map((hero) => {
      const oldHero = previous.heroes.find((entry) => entry.id === hero.id);
      if (!oldHero || hero.level <= oldHero.level) {
        return null;
      }

      return {
        heroId: hero.id,
        name: hero.name,
        leveledUp: true,
        newLevel: hero.level,
      };
    })
    .filter((entry): entry is HeroVictoryReward => entry !== null);

  return {
    goldGained,
    xpGained,
    heroRewards,
    chestDropped: chestCount > 0,
    chestCount,
    tierReached,
  };
}

function buildVictoryPayload(
  previous: GameStateDto,
  next: GameStateDto,
  context: {
    variant: BattleVictoryVariant;
    clearedPhaseId: string;
    clearedPhaseName: string;
    nextPhaseId: string | null;
    nextPhaseName: string | null;
    seasonCompleted: boolean;
  },
): BattleVictoryPayload {
  const rewards = computeRewardDelta(previous, next);

  return {
    variant: context.variant,
    clearedPhaseId: context.clearedPhaseId,
    clearedPhaseName: context.clearedPhaseName,
    nextPhaseId: context.nextPhaseId,
    nextPhaseName: context.nextPhaseName,
    goldGained: rewards.goldGained,
    xpGained: rewards.xpGained,
    heroRewards: rewards.heroRewards,
    chestDropped: rewards.chestDropped,
    chestCount: rewards.chestCount,
    tierReached: rewards.tierReached,
    seasonCompleted: context.seasonCompleted,
    milestoneVictory:
      context.variant === 'phase-clear'
        ? resolveMilestoneVictoryPresentation(
            context.clearedPhaseId,
            context.clearedPhaseName,
          )
        : null,
    defeatHint: null,
  };
}

