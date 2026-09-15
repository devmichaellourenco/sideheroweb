/**
 * Testes puros do Balance Pack (validação / preview / nonempty).
 */
import { describe, expect, it } from 'vitest';
import {
  BALANCE_PACK_KIND,
  BALANCE_PACK_VERSION,
  buildBalancePack,
  isScopePayloadNonempty,
  previewBalancePack,
  resolveImportScopes,
  validateBalancePack,
} from '../../scripts/balance-lab/balancePack.mjs';

describe('isScopePayloadNonempty', () => {
  it('considera vazio só metadados', () => {
    expect(isScopePayloadNonempty({ version: 1, updatedAt: null, items: {} })).toBe(false);
    expect(isScopePayloadNonempty({ version: 1, updatedAt: null, shops: {}, deletedShopIds: [] })).toBe(
      false,
    );
  });

  it('detecta dados reais', () => {
    expect(isScopePayloadNonempty({ version: 1, items: { a: { basePrice: 1 } } })).toBe(true);
    expect(isScopePayloadNonempty({ version: 1, deletedShopIds: ['x'] })).toBe(true);
  });
});

describe('buildBalancePack / validateBalancePack', () => {
  it('monta pack versionado com meta', () => {
    const pack = buildBalancePack(
      {
        'gear-items': { version: 1, updatedAt: null, items: { sword: { basePrice: 10 } } },
        shops: { version: 1, updatedAt: null, shops: {}, deletedShopIds: [] },
      },
      { label: 'early', exportedAt: '2026-08-14T00:00:00.000Z' },
    );

    expect(pack.kind).toBe(BALANCE_PACK_KIND);
    expect(pack.version).toBe(BALANCE_PACK_VERSION);
    expect(pack.label).toBe('early');
    expect(pack.meta.nonemptyScopes).toEqual(['gear-items']);
    expect(pack.meta.scopeCount).toBe(2);
  });

  it('rejeita kind/version/scopes inválidos', () => {
    expect(validateBalancePack(null).ok).toBe(false);
    expect(validateBalancePack({ kind: 'x', version: 1, scopes: {} }).ok).toBe(false);
    expect(
      validateBalancePack({
        kind: BALANCE_PACK_KIND,
        version: 99,
        scopes: { 'gear-items': { version: 1 } },
      }).ok,
    ).toBe(false);
    expect(
      validateBalancePack({
        kind: BALANCE_PACK_KIND,
        version: BALANCE_PACK_VERSION,
        scopes: { 'not-a-scope': { version: 1 } },
      }).ok,
    ).toBe(false);
  });

  it('aceita pack válido e normaliza', () => {
    const result = validateBalancePack({
      kind: BALANCE_PACK_KIND,
      version: BALANCE_PACK_VERSION,
      label: ' mid ',
      exportedAt: '2026-08-14T12:00:00.000Z',
      scopes: {
        upgrades: { version: 1, updatedAt: null, upgrades: { a: { cost: 5 } } },
      },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.pack.label).toBe('mid');
    expect(result.pack.meta.nonemptyScopes).toEqual(['upgrades']);
  });
});

describe('previewBalancePack / resolveImportScopes', () => {
  it('gera diff por scope e filtra seleção', () => {
    const pack = buildBalancePack({
      'gear-items': { version: 1, updatedAt: null, items: { a: { basePrice: 2 } } },
      shops: { version: 1, updatedAt: null, shops: {}, deletedShopIds: [] },
    });
    const current = {
      'gear-items': { version: 1, updatedAt: null, items: { a: { basePrice: 1 } } },
      shops: { version: 1, updatedAt: null, shops: {}, deletedShopIds: [] },
    };
    const preview = previewBalancePack(pack, current);
    expect(preview.totalChanges).toBeGreaterThan(0);
    const gear = preview.scopes.find((s) => s.scope === 'gear-items');
    expect(gear?.changeCount).toBeGreaterThan(0);
    const shops = preview.scopes.find((s) => s.scope === 'shops');
    expect(shops?.changeCount).toBe(0);

    expect(resolveImportScopes(pack, ['gear-items', 'missing'])).toEqual(['gear-items']);
    expect(resolveImportScopes(pack, undefined).sort()).toEqual(['gear-items', 'shops'].sort());
  });
});
