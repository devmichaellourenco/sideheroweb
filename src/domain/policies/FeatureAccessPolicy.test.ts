import { describe, expect, it } from 'vitest';
import { FeatureAccessPolicy } from './FeatureAccessPolicy';

describe('FeatureAccessPolicy', () => {
  it('resolve auto-batalha ligada por padrão sem upgrades', () => {
    const flags = FeatureAccessPolicy.resolve({});
    expect(flags.autoBattle).toBe(true);
    expect(flags.autoBattleMaxSpeed).toBe(1);
    expect(flags.battleStats).toBe(true);
    expect(flags.optimizeLoadout).toBe(false);
    expect(flags.backgroundTickMultiplier).toBe(1);
  });

  it('resolve auto-batalha velocidade 3 no nível 3', () => {
    const flags = FeatureAccessPolicy.resolve({ auto_battle: 3 });
    expect(flags.autoBattle).toBe(true);
    expect(flags.autoBattleMaxSpeed).toBe(3);
  });

  it('mantém otimizar equipe desativado mesmo com nível legado', () => {
    const flags = FeatureAccessPolicy.resolve({ optimize_loadout: 2 });
    expect(flags.optimizeLoadout).toBe(false);
    expect(flags.optimizeInLootBatch).toBe(false);
  });

  it('mantém auto-abrir baús desativado mesmo com nível legado', () => {
    const flags = FeatureAccessPolicy.resolve({
      auto_open_chests: 1,
      open_all_chests: 2,
    });
    expect(flags.autoOpenChests).toBe(false);
    expect(flags.autoOpenAllChests).toBe(false);
    expect(flags.openAllChests).toBe(true);
  });

  it('resolve improvement_reset por nível', () => {
    expect(FeatureAccessPolicy.resolve({}).improvementReset).toBe(0);
    expect(FeatureAccessPolicy.resolve({ improvement_reset: 1 }).improvementReset).toBe(1);
    expect(FeatureAccessPolicy.resolve({ improvement_reset: 2 }).improvementReset).toBe(2);
  });
});
