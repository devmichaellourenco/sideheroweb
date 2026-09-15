import { describe, expect, it } from 'vitest';
import { ENEMY_ROSTER, getBossForPowerTier, getCommonsForPowerTier } from './EnemyRosterCatalog';
import { pickCommonForGlobalTier, getPowerTierForGlobalTier, unlockedCommonsForGlobalTier } from './EnemyTierProgression';

describe('EnemyRosterCatalog', () => {
  it('contém 52 inimigos de campanha + Saci, Gonodor, Duque de Morthaven e Vorax únicos', () => {
    const uniques = new Set(['saci', 'gonodor', 'morthaven_duke', 'vorax']);
    const campaign = ENEMY_ROSTER.filter((e) => !uniques.has(e.id));
    expect(campaign).toHaveLength(52);
    expect(ENEMY_ROSTER.some((e) => e.id === 'saci')).toBe(true);
    expect(ENEMY_ROSTER.some((e) => e.id === 'gonodor')).toBe(true);
    expect(ENEMY_ROSTER.some((e) => e.id === 'morthaven_duke')).toBe(true);
    expect(ENEMY_ROSTER.some((e) => e.id === 'vorax')).toBe(true);
    expect(ENEMY_ROSTER.some((e) => e.id === 'capelobo')).toBe(true);
    expect(ENEMY_ROSTER.some((e) => e.id === 'mapinguari')).toBe(true);
  });

  it('nível 1 tem 8 comuns e Ogro como chefe', () => {
    expect(getCommonsForPowerTier(1)).toHaveLength(8);
    expect(getBossForPowerTier(1).id).toBe('hill_ogre');
  });
});

describe('EnemyTierProgression', () => {
  it('mapeia tiers 1–100 para nível 1', () => {
    expect(getPowerTierForGlobalTier(1)).toBe(1);
    expect(getPowerTierForGlobalTier(100)).toBe(1);
    expect(getPowerTierForGlobalTier(101)).toBe(2);
  });

  it('desbloqueia comuns gradualmente no mapa 1', () => {
    const tier1 = unlockedCommonsForGlobalTier(1);
    const tier40 = unlockedCommonsForGlobalTier(40);
    const tier51 = unlockedCommonsForGlobalTier(51);

    expect(tier1.map((e) => e.id)).toEqual(['giant_rat', 'cave_bat']);
    expect(tier40.length).toBeGreaterThan(tier1.length);
    expect(tier51).toHaveLength(8);

    const pool = tier1.map((e) => e.id);
    expect(pool).toContain(pickCommonForGlobalTier(1, 0));
    expect(pool).toContain(pickCommonForGlobalTier(1, 1));
  });
});
