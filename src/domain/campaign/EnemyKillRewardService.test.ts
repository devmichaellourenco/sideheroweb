import { describe, expect, it, vi } from 'vitest';
import { buildPhaseId } from './CampaignIds';
import { EncounterResolver } from './EncounterResolver';
import { EnemyKillRewardService } from './EnemyKillRewardService';
import { CombatState } from '../entities/CombatState';
import { Enemy } from '../entities/Enemy';
import { GameState } from '../entities/GameState';
import { ILootService } from '../services/ILootService';
import { Stats } from '../value-objects/Stats';
import { ActionTimerService } from '../services/combat/ActionTimerService';

describe('EnemyKillRewardService', () => {
  const service = new EnemyKillRewardService();
  const resolver = new EncounterResolver();

  function combatWithEnemies(state: GameState, phaseId: string, waveIndex: number): CombatState {
    const resolved = resolver.resolve(phaseId, waveIndex)!;
    return CombatState.start(
      state.activeHeroes(),
      resolved.enemies,
      new ActionTimerService(),
      resolved.meta,
    );
  }

  function defeatEnemy(enemies: Enemy[], targetId: string): Enemy[] {
    return enemies.map((entry) =>
      entry.id === targetId
        ? Enemy.restore({
            ...entry.toProps(),
            stats: Stats.create({ ...entry.stats.toProps(), currentHealth: 0 }),
          })
        : entry,
    );
  }

  it('concede ouro ao matar inimigo, sem XP (XP só na vitória da fase)', () => {
    const phaseId = buildPhaseId(1, 2);
    const state = GameState.initial().withCampaignProgress(
      GameState.initial().campaignProgress.withSelectedPhase(phaseId),
    );
    const combat = combatWithEnemies(state, phaseId, 0);
    const enemy = combat.enemies[0];
    const defeated = defeatEnemy(combat.enemies, enemy.id);
    const xpBefore = state.activeHeroes()[0].experience.current;

    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    const result = service.applyKillRewards(state, combat, combat.enemies, defeated);

    expect(result.state.gold.amount).toBeGreaterThan(0);
    expect(result.state.activeHeroes()[0].experience.current).toBe(xpBefore);
    expect(result.combat.hasRewardedEnemy(enemy.id)).toBe(true);
    expect(result.levelUpHeroIds).toEqual([]);
    vi.restoreAllMocks();
  });

  it('não concede recompensa duplicada', () => {
    const phaseId = buildPhaseId(1, 2);
    const state = GameState.initial().withCampaignProgress(
      GameState.initial().campaignProgress.withSelectedPhase(phaseId),
    );
    const combat = combatWithEnemies(state, phaseId, 0);
    const enemy = combat.enemies[0];
    const defeated = defeatEnemy(combat.enemies, enemy.id);

    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const first = service.applyKillRewards(state, combat, combat.enemies, defeated);
    const second = service.applyKillRewards(first.state, first.combat, combat.enemies, defeated);

    expect(second.state.gold.amount).toBe(first.state.gold.amount);
    vi.restoreAllMocks();
  });

  it('concede ouro cheio mesmo com template já cleared (normais não são replay)', () => {
    const phaseId = buildPhaseId(1, 2);
    const cleared = GameState.initial()
      .campaignProgress.markCleared(phaseId, [buildPhaseId(1, 3)], 2)
      .withSelectedPhase(phaseId);
    const state = GameState.initial().withCampaignProgress(cleared);
    const combat = combatWithEnemies(state, phaseId, 0);
    const enemy = combat.enemies[0];
    const defeated = defeatEnemy(combat.enemies, enemy.id);

    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const result = service.applyKillRewards(state, combat, combat.enemies, defeated);

    expect(result.state.gold.amount).toBe(enemy.goldReward);
    expect(result.state.activeHeroes()[0].experience.current).toBe(0);
    vi.restoreAllMocks();
  });

  it('concede Ignus Ix ao matar Saci na 1-50 sem role de boss (save migrado)', () => {
    const phaseId = buildPhaseId(1, 50);
    const state = GameState.initial().withCampaignProgress(
      GameState.initial().campaignProgress.withSelectedPhase(phaseId),
    );
    const combat = combatWithEnemies(state, phaseId, 3);
    const boss = combat.enemies.find((enemy) => enemy.enemyType === 'saci');
    expect(boss).toBeDefined();

    const defeated = combat.enemies.map((entry) =>
      entry.id === boss!.id
        ? Enemy.restore({
            ...entry.toProps(),
            role: 'trash',
            stats: Stats.create({ ...entry.stats.toProps(), currentHealth: 0 }),
          })
        : entry,
    );

    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const result = service.applyKillRewards(state, combat, combat.enemies, defeated);

    expect(result.state.inventory.some((gear) => gear.templateId === 'ignus_ix')).toBe(false);
    expect(
      result.state.chests.some(
        (chest) => chest.guaranteedLoot?.templateId === 'ignus_ix' && !chest.opened,
      ),
    ).toBe(true);
    vi.restoreAllMocks();
  });

  it('converte drop de gear em baú comum sem sortear item na hora do kill', () => {
    const loot: ILootService = {
      generateGear: vi.fn(),
      generateGearForChest: vi.fn(),
      generateGearForSlot: vi.fn(),
      generateDeterministicGearForSlot: vi.fn(),
      generateGearFromCatalogItem: vi.fn(),
      generateGearFromTemplate: vi.fn(),
    };
    const rewardService = new EnemyKillRewardService(loot);
    const phaseId = buildPhaseId(1, 2);
    const state = GameState.initial().withCampaignProgress(
      GameState.initial().campaignProgress.withSelectedPhase(phaseId),
    );
    const combat = combatWithEnemies(state, phaseId, 0);
    const enemy = combat.enemies[0];
    const defeated = defeatEnemy(combat.enemies, enemy.id);

    vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0.99);
    const result = rewardService.applyKillRewards(state, combat, combat.enemies, defeated);

    expect(result.state.inventory).toHaveLength(0);
    expect(result.state.chests).toHaveLength(1);
    expect(result.state.chests[0]?.guaranteedLoot).toBeNull();
    expect(loot.generateGear).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });
});
