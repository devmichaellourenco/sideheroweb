import { describe, expect, it } from 'vitest';
import { GameState } from '../entities/GameState';
import { Hero } from '../entities/Hero';
import { Experience } from '../value-objects/Experience';
import { UpgradeRequirementEvaluator } from './UpgradeRequirementEvaluator';

describe('UpgradeRequirementEvaluator', () => {
  const evaluator = new UpgradeRequirementEvaluator();

  it('valida requisito de stage mínimo', () => {
    const state = GameState.restore({
      ...GameState.initial().toProps(),
      stage: 5,
    });

    expect(evaluator.allMet(state, [{ type: 'min_stage', value: 3 }])).toBe(true);
    expect(evaluator.allMet(state, [{ type: 'min_stage', value: 10 }])).toBe(false);
  });

  it('valida requisito de nível de herói', () => {
    const lowLevelHero = Hero.createStarter('h1', 'knight', 'A');
    const highLevelHero = Hero.restore({
      ...Hero.createStarter('h2', 'sorcerer', 'B').toProps(),
      experience: Experience.restore(0, 100, 6),
    });
    const state = GameState.restore({
      ...GameState.initial().toProps(),
      heroes: [lowLevelHero, highLevelHero],
    });

    expect(evaluator.allMet(state, [{ type: 'min_hero_level', value: 6 }])).toBe(true);
    expect(evaluator.allMet(state, [{ type: 'min_hero_level', value: 7 }])).toBe(false);
  });

  it('valida requisito de vitórias', () => {
    const state = GameState.restore({
      ...GameState.initial().toProps(),
      totalBattlesWon: 12,
    });

    const results = evaluator.evaluateAll(state, [{ type: 'min_battles_won', value: 10 }]);
    expect(results[0]?.met).toBe(true);
    expect(results[0]?.label).toBe('10 vitórias');
  });

  it('valida requisito de missão principal concluída', () => {
    const base = GameState.initial();
    const withMain = base.withCampaignProgress(
      base.campaignProgress.withMissionProgress(
        base.campaignProgress.missionProgress.markMainCompleted('main:1-1'),
      ),
    );

    expect(
      evaluator.allMet(base, [{ type: 'main_mission_completed', missionId: 'main:1-1' }]),
    ).toBe(false);
    expect(
      evaluator.allMet(withMain, [{ type: 'main_mission_completed', missionId: 'main:1-1' }]),
    ).toBe(true);
  });
});
