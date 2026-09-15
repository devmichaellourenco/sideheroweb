/**
 * Snapshot da árvore de melhorias para o Balance Lab.
 */
import { UPGRADE_CATALOG } from '../../src/domain/upgrades/UpgradeCatalog';
import type { UpgradeDefinition } from '../../src/domain/upgrades/UpgradeDefinition';
import {
  applyUpgradeOverride,
  getEmbeddedUpgradeOverrides,
  normalizeUpgradeOverride,
  normalizeUpgradeRequirement,
  normalizeUpgradeOverridesFile,
  setRuntimeUpgradeOverrides,
  type UpgradeDefinitionOverride,
  type UpgradeOverridesFile,
} from '../../src/domain/upgrades/UpgradeOverrides';

export const UPGRADE_EDIT_FIELDS = [
  { key: 'cost', label: 'Custo (ouro)', step: 50 },
] as const;

export const UPGRADE_TEXT_FIELDS = [
  { key: 'name', label: 'Nome' },
  { key: 'description', label: 'Descrição' },
] as const;

export interface UpgradeLabRow {
  id: string;
  branch: string;
  feature: string;
  level: number;
  parents: string[];
  baseline: Pick<UpgradeDefinition, 'name' | 'description' | 'cost' | 'parents' | 'requirements'>;
  effective: Pick<UpgradeDefinition, 'name' | 'description' | 'cost' | 'parents' | 'requirements'>;
  hasOverride: boolean;
}

export interface UpgradeTreeLabPayload {
  upgrades: UpgradeLabRow[];
  editFields: typeof UPGRADE_EDIT_FIELDS;
  textFields: typeof UPGRADE_TEXT_FIELDS;
  updatedAt: string | null;
}

export function buildUpgradeTreeLabPayload(filters?: {
  diskOverrides?: UpgradeOverridesFile | null;
  updatedAt?: string | null;
}): UpgradeTreeLabPayload {
  const disk = filters?.diskOverrides ?? getEmbeddedUpgradeOverrides();

  setRuntimeUpgradeOverrides(null);

  const upgrades: UpgradeLabRow[] = UPGRADE_CATALOG.map((baseline) => {
    const override = disk.upgrades[baseline.id];
    const effective = applyUpgradeOverride(baseline, override ?? null);
    return {
      id: baseline.id,
      branch: baseline.branch,
      feature: String(baseline.feature),
      level: baseline.level,
      parents: effective.parents,
      baseline: {
        name: baseline.name,
        description: baseline.description,
        cost: baseline.cost,
        parents: baseline.parents,
        requirements: baseline.requirements,
      },
      effective: {
        name: effective.name,
        description: effective.description,
        cost: effective.cost,
        parents: effective.parents,
        requirements: effective.requirements,
      },
      hasOverride: Boolean(normalizeUpgradeOverride(override)),
    };
  });

  return {
    upgrades,
    editFields: UPGRADE_EDIT_FIELDS,
    textFields: UPGRADE_TEXT_FIELDS,
    updatedAt: filters?.updatedAt ?? disk.updatedAt ?? null,
  };
}

export function validateUpgradeDependencies(file: UpgradeOverridesFile): string[] {
  const effective = UPGRADE_CATALOG.map((baseline) =>
    applyUpgradeOverride(baseline, file.upgrades[baseline.id] ?? null),
  );
  const ids = new Set(effective.map((upgrade) => upgrade.id));
  const errors: string[] = [];

  for (const overrideId of Object.keys(file.upgrades)) {
    if (!ids.has(overrideId)) errors.push(`Override referencia melhoria inexistente “${overrideId}”`);
  }

  for (const upgrade of effective) {
    const uniqueParents = new Set(upgrade.parents);
    if (uniqueParents.size !== upgrade.parents.length) {
      errors.push(`${upgrade.id}: há pais duplicados`);
    }
    for (const parentId of upgrade.parents) {
      if (parentId === upgrade.id) errors.push(`${upgrade.id}: não pode depender de si mesma`);
      else if (!ids.has(parentId)) errors.push(`${upgrade.id}: pai inexistente “${parentId}”`);
    }
  }

  const roots = effective.filter((upgrade) => upgrade.parents.length === 0).map((upgrade) => upgrade.id);
  if (roots.length !== 1 || roots[0] !== 'battle_skill_slot_2') {
    errors.push('A árvore deve manter battle_skill_slot_2 como única raiz');
  }

  const parentsById = new Map(effective.map((upgrade) => [upgrade.id, upgrade.parents]));
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const walk = (id: string): boolean => {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    const cyclic = (parentsById.get(id) ?? []).some(walk);
    visiting.delete(id);
    visited.add(id);
    return cyclic;
  };
  if (effective.some((upgrade) => walk(upgrade.id))) errors.push('A árvore contém ciclo entre melhorias');

  return [...new Set(errors)];
}

export function validateUpgradeOverrideInput(input: unknown): string[] {
  if (!input || typeof input !== 'object') return ['Override deve ser um objeto'];
  const raw = input as Record<string, unknown>;
  if (raw.parents !== undefined && !Array.isArray(raw.parents)) {
    return ['parents deve ser um array de IDs'];
  }
  if (raw.requirements !== undefined) {
    if (!Array.isArray(raw.requirements)) return ['requirements deve ser um array'];
    const invalidIndex = raw.requirements.findIndex(
      (requirement) => normalizeUpgradeRequirement(requirement) === null,
    );
    if (invalidIndex >= 0) return [`requirements[${invalidIndex}] é inválido`];
  }
  return [];
}

export {
  normalizeUpgradeOverride,
  normalizeUpgradeOverridesFile,
  setRuntimeUpgradeOverrides,
};
export type { UpgradeDefinitionOverride, UpgradeOverridesFile };
