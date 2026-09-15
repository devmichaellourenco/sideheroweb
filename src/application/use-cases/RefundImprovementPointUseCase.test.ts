import { describe, expect, it } from 'vitest';
import { GameState } from '../../domain/entities/GameState';
import { Hero } from '../../domain/entities/Hero';
import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { GameStatePresenter } from '../presenters/GameStatePresenter';
import { UpgradeService } from '../../domain/upgrades/UpgradeService';
import { RefundImprovementPointUseCase } from './RefundImprovementPointUseCase';
import { MassRefundImprovementPointsUseCase } from './MassRefundImprovementPointsUseCase';

class MemoryRepository implements IGameStateRepository {
  constructor(private state: GameState) {}

  async load(): Promise<GameState> {
    return this.state;
  }

  async save(state: GameState): Promise<void> {
    this.state = state;
  }
}

function withResetLevel(state: GameState, level: number, heroOverrides: Partial<ReturnType<Hero['toProps']>> = {}): GameState {
  const hero = state.heroes[0];
  return GameState.restore({
    ...state.toProps(),
    upgradeLevels: { ...state.upgradeLevels, improvement_reset: level },
    heroes: state.heroes.map((entry) =>
      entry.id === hero.id
        ? Hero.restore({
            ...hero.toProps(),
            allocatedAttributes: { str: 2, dex: 0, int: 0 },
            unspentImprovementPoints: 0,
            ...heroOverrides,
          })
        : entry,
    ),
  });
}

describe('RefundImprovementPointUseCase', () => {
  it('rejeita sem feature level 1', async () => {
    const repository = new MemoryRepository(withResetLevel(GameState.initial(), 0));
    const useCase = new RefundImprovementPointUseCase(
      repository,
      new GameStatePresenter(new UpgradeService()),
    );

    await expect(
      useCase.execute(GameState.initial().heroes[0].id, { type: 'attribute', key: 'str' }),
    ).rejects.toThrow(/bloqueado/i);
  });

  it('devolve ponto e permite gastar de novo', async () => {
    const initial = GameState.initial();
    const heroId = initial.heroes[0].id;
    const repository = new MemoryRepository(withResetLevel(initial, 1));
    const useCase = new RefundImprovementPointUseCase(
      repository,
      new GameStatePresenter(new UpgradeService()),
    );

    const dto = await useCase.execute(heroId, { type: 'attribute', key: 'str' });
    const updated = dto.heroes.find((entry) => entry.id === heroId);
    expect(updated?.allocatedAttributes.str).toBe(1);
    expect(updated?.unspentImprovementPoints).toBe(1);
  });
});

describe('MassRefundImprovementPointsUseCase', () => {
  it('rejeita sem feature level 2', async () => {
    const repository = new MemoryRepository(withResetLevel(GameState.initial(), 1));
    const useCase = new MassRefundImprovementPointsUseCase(
      repository,
      new GameStatePresenter(new UpgradeService()),
    );

    await expect(useCase.execute(GameState.initial().heroes[0].id)).rejects.toThrow(/massa.*bloqueado/i);
  });

  it('executa massa com level 2', async () => {
    const initial = GameState.initial();
    const heroId = initial.heroes[0].id;
    const repository = new MemoryRepository(
      withResetLevel(initial, 2, {
        skillRanks: { basic_attack: 1, thrust: 2 },
        allocatedAttributes: { str: 3, dex: 0, int: 0 },
      }),
    );
    const useCase = new MassRefundImprovementPointsUseCase(
      repository,
      new GameStatePresenter(new UpgradeService()),
    );

    const result = await useCase.execute(heroId);
    const updated = result.state.heroes.find((entry) => entry.id === heroId);
    expect(updated?.skillRanks.thrust).toBeUndefined();
    expect(result.pointsRefunded).toBeGreaterThanOrEqual(5);
    expect(updated?.unspentImprovementPoints).toBe(result.pointsRefunded);
  });
});
