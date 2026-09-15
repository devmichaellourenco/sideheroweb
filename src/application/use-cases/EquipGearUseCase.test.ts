import { describe, expect, it } from 'vitest';
import { GameState } from '../../domain/entities/GameState';
import { Gear } from '../../domain/entities/Gear';
import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { GameStatePresenter } from '../presenters/GameStatePresenter';
import { UpgradeService } from '../../domain/upgrades/UpgradeService';
import { EquipGearUseCase } from './EquipGearUseCase';

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

describe('EquipGearUseCase', () => {
  it('equipa item do inventário no herói', async () => {
    const initial = GameState.initial();
    const gear = Gear.create({
      id: 'gear-test-1',
      name: 'Espada de Teste',
      slot: 'weapon',
      rarity: 'common',
      attackBonus: 5,
      defenseBonus: 0,
      healthBonus: 0,
      requirements: { minLevel: 1 },
    });

    const state = GameState.restore({
      ...initial.toProps(),
      inventory: [gear],
    });

    const repository = new MemoryRepository(state);
    const useCase = new EquipGearUseCase(repository, new GameStatePresenter(new UpgradeService()));

    const dto = await useCase.execute('hero-1', 'gear-test-1');
    const saved = repository.getState();

    expect(dto.heroes[0].equipment.weapon?.id).toBe('gear-test-1');
    expect(saved.inventory.find((entry) => entry.id === 'gear-test-1')).toBeUndefined();
  });
});
