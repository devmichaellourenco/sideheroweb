import { describe, expect, it } from 'vitest';
import { MetaProgress } from './MetaProgress';
import { MetaService, baseSeasonSigils } from './MetaService';
import { MetaBonusScope } from './MetaBonusScope';
import { emptyMetaBonuses } from './MetaBonuses';
import { GameState } from '../entities/GameState';
import { EnemyKillRewardService } from '../campaign/EnemyKillRewardService';
import { PhaseCombatHandlers } from '../campaign/PhaseCombatHandlers';
import { PhaseRun } from '../campaign/PhaseRun';
import { buildPhaseId } from '../campaign/CampaignIds';
import { Enemy } from '../entities/Enemy';
import { Stats } from '../value-objects/Stats';

describe('MetaService', () => {
  const service = new MetaService();

  it('concede selos ao concluir temporada', () => {
    const progress = MetaProgress.initial();
    const result = service.awardSeasonCompletion(progress, 6);

    expect(result.sigilsAwarded).toBe(baseSeasonSigils(6));
    expect(result.progress.sigils).toBe(result.sigilsAwarded);
    expect(result.progress.seasonsCompleted).toBe(1);
  });

  it('compra melhorias em cadeia com selos', () => {
    let progress = MetaProgress.initial().withSigils(10);
    progress = service.purchase(progress, 'meta_start_gold_1');
    progress = service.purchase(progress, 'meta_start_gold_2');

    const bonuses = service.resolveBonuses(progress);
    expect(bonuses.startGoldBonus).toBe(50);
    expect(service.getFeatureLevel(progress, 'start_gold')).toBe(2);
  });

  it('aplica bônus de ouro no combate via MetaBonusScope', () => {
    const handlers = new PhaseCombatHandlers();
    const killRewards = new EnemyKillRewardService();
    const phaseId = buildPhaseId(1, 1);
    const phaseRun = PhaseRun.start(phaseId);
    let state = GameState.initial().withPhaseRun(phaseRun);
    state = handlers.startPhaseRun(state, phaseRun).state;

    const combat = state.combat!;
    const enemy = combat.enemies[0];
    const defeated = combat.enemies.map((entry) =>
      entry.id === enemy.id
        ? Enemy.restore({
            ...entry.toProps(),
            stats: Stats.create({ ...entry.stats.toProps(), currentHealth: 0 }),
          })
        : entry,
    );

    MetaBonusScope.set({
      ...emptyMetaBonuses(),
      goldMultiplier: 1.2,
      xpMultiplier: 1,
      startGoldBonus: 0,
      seasonSigilBonus: 0,
    });

    const rewarded = killRewards.applyKillRewards(state, combat, combat.enemies, defeated);

    MetaBonusScope.clear();

    expect(rewarded.state.gold.amount).toBeGreaterThan(0);
  });
});
