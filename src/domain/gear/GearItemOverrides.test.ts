import { afterEach, describe, expect, it } from 'vitest';
import {
  getCatalogGearItem,
  getGearCatalogItem,
} from './GearItemCatalog';
import {
  applyGearItemOverride,
  normalizeGearItemOverride,
  setRuntimeGearItemOverrides,
} from './GearItemOverrides';

describe('GearItemOverrides', () => {
  afterEach(() => {
    setRuntimeGearItemOverrides(null);
  });

  it('aplica nome e stats sem alterar o catálogo canônico', () => {
    const baseline = getCatalogGearItem('worn_sword')!;
    setRuntimeGearItemOverrides({
      version: 1,
      updatedAt: null,
      items: {
        worn_sword: {
          name: 'Espada de Teste',
          basePrice: 321,
          stats: { attackBonus: 99 },
        },
      },
    });

    const live = getGearCatalogItem('worn_sword')!;
    expect(live.name).toBe('Espada de Teste');
    expect(live.basePrice).toBe(321);
    expect(live.attackBonus).toBe(99);
    expect(getCatalogGearItem('worn_sword')!.attackBonus).toBe(baseline.attackBonus);
    expect(getCatalogGearItem('worn_sword')!.name).toBe(baseline.name);
  });

  it('descarta patch vazio e raridade inválida', () => {
    expect(normalizeGearItemOverride({})).toBeNull();
    expect(normalizeGearItemOverride({ rarity: 'ultra' as never })).toBeNull();
    expect(
      normalizeGearItemOverride({
        name: '  Anel  ',
        rarity: 'rare',
        stats: { attackBonus: 3 },
      }),
    ).toEqual({
      name: 'Anel',
      rarity: 'rare',
      stats: { attackBonus: 3 },
    });
  });

  it('merge de requisitos e exclusiveHeroId null limpa o campo', () => {
    const baseline = getCatalogGearItem('worn_sword')!;
    const patched = applyGearItemOverride(baseline, {
      exclusiveHeroId: 'galneon',
      requirements: { minLevel: 12, str: 5, heroId: 'galneon' },
    });
    expect(patched.exclusiveHeroId).toBe('galneon');
    expect(patched.requirements).toEqual({
      ...(baseline.requirements ?? { minLevel: 1 }),
      minLevel: 12,
      str: 5,
      heroId: 'galneon',
    });

    const cleared = applyGearItemOverride(patched, {
      exclusiveHeroId: null,
      requirements: { heroId: null },
    });
    expect(cleared.exclusiveHeroId).toBeUndefined();
    expect(cleared.requirements?.heroId).toBeUndefined();
  });
});
