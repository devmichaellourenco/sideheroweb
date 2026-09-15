import { describe, expect, it } from 'vitest';
import { GameState } from '../../domain/entities/GameState';
import { mainMissionId, sideMissionId } from '../../domain/campaign/missions/MissionId';
import { MissionProgress } from '../../domain/campaign/missions/MissionProgress';
import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { UpgradeService } from '../../domain/upgrades/UpgradeService';
import { GameStatePresenter } from '../presenters/GameStatePresenter';
import { GetMissionBoardUseCase } from './GetMissionBoardUseCase';
import { StartMissionUseCase } from './StartMissionUseCase';
import { ResolveMissionOutcomeUseCase } from './ResolveMissionOutcomeUseCase';

class MemoryRepository implements IGameStateRepository {
  constructor(private state: GameState) {}

  async load(): Promise<GameState> {
    return this.state;
  }

  async save(state: GameState): Promise<void> {
    this.state = state;
  }
}

describe('GetMissionBoardUseCase', () => {
  const presenter = new GameStatePresenter(new UpgradeService());

  it('retorna board com próxima main e oferta normal no escopo base', async () => {
    const repository = new MemoryRepository(GameState.initial());
    const useCase = new GetMissionBoardUseCase(repository, presenter);
    const result = await useCase.execute('stendra');

    expect(result.board.mapId).toBe('stendra');
    expect(result.board.main?.id).toBe(mainMissionId('1-1'));
    expect(result.board.main?.expectedGold).toBeGreaterThan(0);
    expect(result.board.main?.victoryXp).toBeGreaterThan(0);
    expect(result.board.normals.length).toBeGreaterThanOrEqual(2);
    expect(result.board.normals.length).toBeLessThanOrEqual(4);
  });
});

describe('StartMissionUseCase', () => {
  const presenter = new GameStatePresenter(new UpgradeService());

  it('inicia missão principal disponível', async () => {
    const repository = new MemoryRepository(GameState.initial());
    const useCase = new StartMissionUseCase(repository, presenter);
    const dto = await useCase.execute(mainMissionId('1-1'));

    expect(dto.campaignProgress.selectedPhaseId).toBe('1-1');
  });

  it('rejeita missão fora do board', async () => {
    const repository = new MemoryRepository(GameState.initial());
    const useCase = new StartMissionUseCase(repository, presenter);

    await expect(useCase.execute(sideMissionId('stendra_ash_trail'))).rejects.toThrow(
      /indisponível/i,
    );
  });
});

describe('ResolveMissionOutcomeUseCase', () => {
  const presenter = new GameStatePresenter(new UpgradeService());

  it('vitória → intermissão de camp; enter_camp abre hub', async () => {
    const progress = MissionProgress.initial().withActiveMission(mainMissionId('1-1'));
    const repository = new MemoryRepository(
      GameState.initial().withCampaignProgress(
        GameState.initial().campaignProgress.withMissionProgress(progress),
      ),
    );
    const useCase = new ResolveMissionOutcomeUseCase(repository, presenter);

    const afterVictory = await useCase.execute('victory', '1-1');
    expect(afterVictory.combatIntermission?.variant).toBe('phase-clear');

    const camp = await useCase.execute('enter_camp');
    expect(camp.loadoutEditOpen).toBe(true);
    expect(camp.phaseRestartOnResume).toBe(false);
  });
});
