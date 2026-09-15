import { describe, expect, it, vi } from 'vitest';
import { buildPhaseId } from './CampaignIds';
import { resolveEnemyLootProfile, rollEnemyLoot } from './EnemyLootTable';

describe('EnemyLootTable', () => {
  it('garante drop na primeira vitória de boss de fase', () => {
    const profile = resolveEnemyLootProfile({
      mapIndex: 1,
      enemyType: 'hill_ogre',
      role: 'boss',
      isPhaseBoss: true,
      firstClearBoss: true,
      seasonFinale: false,
    });

    expect(profile.dropChancePercent).toBe(100);
    expect(profile.options.length).toBeGreaterThan(0);
  });

  it('usa chance de role (não 100%) após a 1ª clear do boss de fase', () => {
    const profile = resolveEnemyLootProfile({
      mapIndex: 1,
      enemyType: 'hill_ogre',
      role: 'boss',
      isPhaseBoss: true,
      firstClearBoss: false,
      seasonFinale: false,
    });

    expect(profile.dropChancePercent).toBe(22);
  });

  it('monstros comuns têm chance baixa de loot', () => {
    const profile = resolveEnemyLootProfile({
      mapIndex: 1,
      enemyType: 'giant_rat',
      role: 'trash',
      isPhaseBoss: false,
      firstClearBoss: false,
      seasonFinale: false,
    });

    expect(profile.dropChancePercent).toBeLessThanOrEqual(6);
  });

  it('rollEnemyLoot respeita tabela quando random falha', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const drop = rollEnemyLoot({
      mapIndex: 1,
      enemyType: 'giant_rat',
      role: 'trash',
      isPhaseBoss: false,
      firstClearBoss: false,
      seasonFinale: false,
    });
    expect(drop).toBeNull();
    vi.restoreAllMocks();
  });

  it('rollEnemyLoot sempre dropa na primeira vitória de boss', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const drop = rollEnemyLoot({
      mapIndex: 1,
      enemyType: 'hill_ogre',
      role: 'boss',
      isPhaseBoss: true,
      firstClearBoss: true,
      seasonFinale: false,
    });
    expect(drop).not.toBeNull();
    vi.restoreAllMocks();
  });
});

describe('WaveEnemyFactory XP', () => {
  it('inimigos não carregam XP por kill (payout é orçamento da fase)', async () => {
    const { EncounterResolver } = await import('./EncounterResolver');
    const resolver = new EncounterResolver();
    const trash = resolver.resolve(buildPhaseId(1, 2), 0);
    const boss = resolver.resolve(buildPhaseId(1, 2), 1);

    expect(trash?.enemies.every((enemy) => enemy.xpReward === 0)).toBe(true);
    expect(boss?.enemies.every((enemy) => enemy.xpReward === 0)).toBe(true);
    expect(trash?.enemies.every((enemy) => enemy.goldReward > 0)).toBe(true);
  });
});
