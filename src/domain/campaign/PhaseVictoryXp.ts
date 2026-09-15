import { GameState } from '../entities/GameState';
import { MetaBonusScope } from '../meta/MetaBonusScope';
import { BenchXpPolicy } from '../party/BenchXpPolicy';
import { effectivePhaseXpTotal } from '../balance/PhaseXpBudget';
import { PhaseId } from './CampaignIds';
import { scalePhaseXp } from './PhaseLootPolicy';

export interface PhaseVictoryXpResult {
  state: GameState;
  xpGranted: number;
  levelUpHeroIds: string[];
}

/**
 * Concede o XP da fase (orçamento `targetXp` / efetivo) à party ativa na vitória.
 * Independente da quantidade de inimigos; derrota não chama isto.
 */
export function grantPhaseVictoryXp(state: GameState, phaseId: PhaseId): PhaseVictoryXpResult {
  const legacyBonuses = MetaBonusScope.get();
  const baseXp = effectivePhaseXpTotal(phaseId);
  const xp = Math.floor(
    scalePhaseXp(baseXp, state.campaignProgress, phaseId) * legacyBonuses.xpMultiplier,
  );

  if (xp <= 0) {
    return { state, xpGranted: 0, levelUpHeroIds: [] };
  }

  const activeBefore = state.activeHeroes();
  const activeUpdates = activeBefore.map((hero) => hero.gainExperience(xp));
  const levelUpHeroIds: string[] = [];
  for (let i = 0; i < activeBefore.length; i += 1) {
    if (activeUpdates[i]!.level > activeBefore[i]!.level) {
      levelUpHeroIds.push(activeUpdates[i]!.id);
    }
  }

  const benchXp = BenchXpPolicy.benchExperience(xp);
  const benchUpdates =
    benchXp > 0 ? state.benchHeroes().map((hero) => hero.gainExperience(benchXp)) : [];

  return {
    state: state
      .withRosterHeroes([...activeUpdates, ...benchUpdates])
      .addLog(`Fase concluída! · +${xp} XP`),
    xpGranted: xp,
    levelUpHeroIds,
  };
}
