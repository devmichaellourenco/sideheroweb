import { describe, expect, it } from 'vitest';
import { GameState } from '../../domain/entities/GameState';
import { Gear } from '../../domain/entities/Gear';
import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { CombatPipeline } from '../../domain/services/combat/CombatPipeline';
import { SerialTaskRunner } from '../../infrastructure/background/SerialTaskRunner';
import { GameStatePresenter } from '../presenters/GameStatePresenter';
import { UpgradeService } from '../../domain/upgrades/UpgradeService';
import { MetaService } from '../../domain/meta/MetaService';
import { AchievementService } from '../../domain/achievements/AchievementService';
import { MemoryMetaRepository } from '../testing/MemoryMetaRepository';
import { MemoryAchievementRepository } from '../testing/MemoryAchievementRepository';
import { EquipGearUseCase } from './EquipGearUseCase';
import { TickGameUseCase } from './TickGameUseCase';

class SlowMemoryRepository implements IGameStateRepository {
  constructor(
    private state: GameState,
    private readonly saveDelayMs = 20,
  ) {}

  async load(): Promise<GameState> {
    await this.delay(2);
    return this.state;
  }

  async save(state: GameState): Promise<void> {
    await this.delay(this.saveDelayMs);
    this.state = state;
  }

  getState(): GameState {
    return this.state;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

describe('EquipGearUseCase com fila serial', () => {
  it('mantém equipamento quando tick aguarda equip terminar', async () => {
    const initial = GameState.initial();
    const gear = Gear.create({
      id: 'gear-race-1',
      name: 'Espada Rápida',
      slot: 'weapon',
      rarity: 'common',
      attackBonus: 4,
      defenseBonus: 0,
      healthBonus: 0,
      requirements: { minLevel: 1 },
    });

    const state = GameState.restore({
      ...initial.toProps(),
      inventory: [gear],
    });

    const repository = new SlowMemoryRepository(state);
    const presenter = new GameStatePresenter(new UpgradeService());
    const equip = new EquipGearUseCase(repository, presenter);
    const tick = new TickGameUseCase(
      repository,
      new MemoryMetaRepository(),
      new MetaService(),
      new CombatPipeline(),
      presenter,
      new MemoryAchievementRepository(),
      new AchievementService(),
    );
    const runner = new SerialTaskRunner();

    await Promise.all([
      runner.run(() => equip.execute('hero-1', 'gear-race-1')),
      runner.run(() => tick.execute(1)),
    ]);

    const saved = repository.getState();
    const hero = saved.heroes.find((entry) => entry.id === 'hero-1');

    expect(hero?.toProps().equipment?.weapon?.id).toBe('gear-race-1');
    expect(saved.inventory.some((entry) => entry.id === 'gear-race-1')).toBe(false);
  });
});
