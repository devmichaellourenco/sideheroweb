import { describe, expect, it } from 'vitest';
import { GameState } from '../../domain/entities/GameState';
import { Hero } from '../../domain/entities/Hero';
import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { SkillService } from '../../domain/progression/SkillService';
import { GameStatePresenter } from '../presenters/GameStatePresenter';
import { UpgradeService } from '../../domain/upgrades/UpgradeService';
import { Experience } from '../../domain/value-objects/Experience';
import { SpendImprovementPointUseCase } from './SpendImprovementPointUseCase';

class MemoryRepository implements IGameStateRepository {
  constructor(private state: GameState) {}

  async load(): Promise<GameState> {
    return this.state;
  }

  async save(state: GameState): Promise<void> {
    this.state = state;
  }

  getState(): GameState {
    return this.state;
  }
}

describe('SpendImprovementPointUseCase', () => {
  it('aloca ponto em atributo STR', async () => {
    const initial = GameState.initial();
    const hero = initial.heroes[0];
    const state = GameState.restore({
      ...initial.toProps(),
      heroes: initial.heroes.map((entry) =>
        entry.id === hero.id
          ? Hero.restore({
              ...hero.toProps(),
              unspentImprovementPoints: 2,
            })
          : entry,
      ),
    });

    const repository = new MemoryRepository(state);
    const useCase = new SpendImprovementPointUseCase(
      repository,
      new GameStatePresenter(new UpgradeService()),
      new SkillService(),
    );

    const dto = await useCase.execute(hero.id, { type: 'attribute', key: 'str' });
    const updated = dto.heroes.find((entry) => entry.id === hero.id);

    expect(updated?.totalAttributes.str).toBe(hero.totalAttributes.str + 1);
    expect(updated?.unspentImprovementPoints).toBe(1);
  });

  it('não aloca ponto em skill antes de desbloquear um slot extra', async () => {
    const initial = GameState.initial();
    const hero = initial.heroes[0];
    const preparedHero = Hero.restore({
      ...hero.toProps(),
      experience: Experience.restore(0, 0, 5),
      allocatedAttributes: { str: 10, dex: 5, int: 5 },
      unspentImprovementPoints: 2,
    });
    const state = GameState.restore({
      ...initial.toProps(),
      heroes: initial.heroes.map((entry) => (entry.id === hero.id ? preparedHero : entry)),
      upgradeLevels: {},
    });
    const repository = new MemoryRepository(state);
    const useCase = new SpendImprovementPointUseCase(
      repository,
      new GameStatePresenter(new UpgradeService()),
      new SkillService(),
    );

    await expect(
      useCase.execute(hero.id, { type: 'skill', skillId: 'power_attack' }),
    ).rejects.toThrow('Não é possível investir nesta skill');
    expect(repository.getState().heroes[0].toProps().unspentImprovementPoints).toBe(2);
  });
});
