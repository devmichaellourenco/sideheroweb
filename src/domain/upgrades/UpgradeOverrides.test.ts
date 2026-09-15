import { describe, expect, it, afterEach } from 'vitest';
import {
  applyUpgradeOverride,
  getEmbeddedUpgradeOverrides,
  getUpgradeOverride,
  normalizeUpgradeOverride,
  normalizeUpgradeOverridesFile,
  setRuntimeUpgradeOverrides,
} from './UpgradeOverrides';
import { UPGRADE_CATALOG } from './UpgradeCatalog';

describe('UpgradeOverrides', () => {
  afterEach(() => {
    setRuntimeUpgradeOverrides(null);
  });

  it('getEmbeddedUpgradeOverrides retorna estrutura válida', () => {
    const embedded = getEmbeddedUpgradeOverrides();
    expect(embedded).toMatchObject({
      version: expect.any(Number),
      upgrades: expect.any(Object),
    });
  });

  it('normalizeUpgradeOverride retorna null para input inválido', () => {
    expect(normalizeUpgradeOverride(null)).toBeNull();
    expect(normalizeUpgradeOverride(undefined)).toBeNull();
    expect(normalizeUpgradeOverride({})).toBeNull();
  });

  it('normalizeUpgradeOverride normaliza override com nome', () => {
    const result = normalizeUpgradeOverride({ name: 'Novo nome' });
    expect(result).toEqual({ name: 'Novo nome' });
  });

  it('normalizeUpgradeOverride normaliza override com custo', () => {
    const result = normalizeUpgradeOverride({ cost: 1234.9 });
    expect(result?.cost).toBe(1234); // floor
  });

  it('normalizeUpgradeOverride rejeita custo negativo retornando 0', () => {
    const result = normalizeUpgradeOverride({ cost: -100 });
    expect(result?.cost).toBe(0);
  });

  it('normaliza parents e requirements editados no Balance Lab', () => {
    const result = normalizeUpgradeOverride({
      parents: [' battle_skill_slot_2 ', 'auto_battle_2'],
      requirements: [
        { type: 'min_stage', value: 4.8 },
        { type: 'upgrade_level', feature: 'auto_battle', minLevel: 2 },
      ],
    });

    expect(result).toEqual({
      parents: ['battle_skill_slot_2', 'auto_battle_2'],
      requirements: [
        { type: 'min_stage', value: 4 },
        { type: 'upgrade_level', feature: 'auto_battle', minLevel: 2 },
      ],
    });
  });

  it('descarta requisitos com shape ou feature inválidos', () => {
    const result = normalizeUpgradeOverride({
      requirements: [
        { type: 'unknown' } as never,
        { type: 'upgrade_level', feature: 'invalid_feature', minLevel: 2 } as never,
      ],
    });

    expect(result).toEqual({ requirements: [] });
  });

  it('applyUpgradeOverride retorna definição original sem override', () => {
    const baseline = UPGRADE_CATALOG[0]!;
    const result = applyUpgradeOverride(baseline, null);
    expect(result).toEqual(baseline);
  });

  it('applyUpgradeOverride aplica nome e custo', () => {
    const baseline = UPGRADE_CATALOG[0]!;
    const result = applyUpgradeOverride(baseline, { name: 'Editado', cost: 999 });
    expect(result.name).toBe('Editado');
    expect(result.cost).toBe(999);
    expect(result.description).toBe(baseline.description);
  });

  it('getUpgradeOverride retorna null sem override em runtime', () => {
    const baseline = UPGRADE_CATALOG[0]!;
    expect(getUpgradeOverride(baseline.id)).toBeNull();
  });

  it('getUpgradeOverride retorna override quando runtime está configurado', () => {
    const baseline = UPGRADE_CATALOG[0]!;
    setRuntimeUpgradeOverrides({
      version: 1,
      updatedAt: null,
      upgrades: { [baseline.id]: { cost: 777 } },
    });
    const result = getUpgradeOverride(baseline.id);
    expect(result?.cost).toBe(777);
  });

  it('normalizeUpgradeOverridesFile produz estrutura completa', () => {
    const baseline = UPGRADE_CATALOG[0]!;
    const result = normalizeUpgradeOverridesFile({
      version: 2,
      updatedAt: '2026-01-01T00:00:00.000Z',
      upgrades: { [baseline.id]: { cost: 500 } },
    });
    expect(result.version).toBe(2);
    expect(result.upgrades).toHaveProperty(baseline.id);
    expect(result.upgrades[baseline.id]?.cost).toBe(500);
  });

  it('normalizeUpgradeOverridesFile ignora upgrades com override vazio', () => {
    const baseline = UPGRADE_CATALOG[0]!;
    const result = normalizeUpgradeOverridesFile({
      version: 1,
      updatedAt: null,
      upgrades: { [baseline.id]: {} },
    });
    expect(result.upgrades).not.toHaveProperty(baseline.id);
  });
});
