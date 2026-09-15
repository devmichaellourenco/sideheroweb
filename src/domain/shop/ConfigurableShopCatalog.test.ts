import { afterEach, describe, expect, it } from 'vitest';
import {
  getConfiguredShop,
  listConfiguredShops,
  resolveActiveShop,
  setRuntimeShopOverrides,
  type ShopOverridesFile,
} from './ConfigurableShopCatalog';

function overrides(
  shops: ShopOverridesFile['shops'],
  deletedShopIds: readonly string[] = [],
): ShopOverridesFile {
  return { version: 1, updatedAt: null, shops, deletedShopIds };
}

describe('ConfigurableShopCatalog', () => {
  afterEach(() => setRuntimeShopOverrides(null));

  it('adiciona uma loja completa pelo arquivo de overrides', () => {
    setRuntimeShopOverrides(
      overrides({
        'mountain-smith': {
          name: 'Ferreiro da Montanha',
          unlockAfterMainId: 'main:2-5',
          catalogItemIds: ['worn_sword', 'chain_mail'],
          priceMultiplier: 1.2,
          flatPriceAdjustment: 15,
        },
      }),
    );

    expect(getConfiguredShop('mountain-smith')).toEqual({
      id: 'mountain-smith',
      name: 'Ferreiro da Montanha',
      unlockAfterMainId: 'main:2-5',
      catalogItemIds: ['worn_sword', 'chain_mail'],
      priceMultiplier: 1.2,
      flatPriceAdjustment: 15,
    });
  });

  it('aplica edição esparsa sobre uma loja canônica', () => {
    setRuntimeShopOverrides(
      overrides({
        'camp-quartermaster': {
          name: 'Intendente Renomeado',
          priceMultiplier: 0.85,
        },
      }),
    );

    const shop = getConfiguredShop('camp-quartermaster');
    expect(shop?.name).toBe('Intendente Renomeado');
    expect(shop?.priceMultiplier).toBe(0.85);
    expect(shop?.catalogItemIds).toContain('worn_sword');
  });

  it('remove loja canônica por tombstone e ignora adição incompleta', () => {
    setRuntimeShopOverrides(
      overrides(
        {
          incomplete: { name: 'Sem campos obrigatórios' },
        },
        ['camp-quartermaster', 'mercado-fronteira', 'arsenal-marco', 'gruftall-bazaar'],
      ),
    );

    expect(listConfiguredShops()).toEqual([]);
  });

  it('resolve a loja do marco mais avançado sem depender da ordem do JSON', () => {
    setRuntimeShopOverrides(
      overrides({
        later: {
          name: 'Mais tarde',
          unlockAfterMainId: 'main:2-10',
          catalogItemIds: ['worn_sword'],
          priceMultiplier: 1,
          flatPriceAdjustment: 0,
        },
        earlier: {
          name: 'Mais cedo',
          unlockAfterMainId: 'main:1-50',
          catalogItemIds: ['chain_mail'],
          priceMultiplier: 1,
          flatPriceAdjustment: 0,
        },
      }),
    );

    expect(
      resolveActiveShop(['main:1-1', 'main:1-50', 'main:2-10'])?.id,
    ).toBe('later');
  });

  it('desempata lojas no mesmo marco por id deterministicamente', () => {
    setRuntimeShopOverrides(
      overrides({
        'shop-a': {
          name: 'A',
          unlockAfterMainId: 'main:2-5',
          catalogItemIds: ['worn_sword'],
          priceMultiplier: 1,
          flatPriceAdjustment: 0,
        },
        'shop-z': {
          name: 'Z',
          unlockAfterMainId: 'main:2-5',
          catalogItemIds: ['chain_mail'],
          priceMultiplier: 1,
          flatPriceAdjustment: 0,
        },
      }),
    );

    expect(resolveActiveShop(['main:1-1', 'main:2-5'])?.id).toBe('shop-z');
  });
});
