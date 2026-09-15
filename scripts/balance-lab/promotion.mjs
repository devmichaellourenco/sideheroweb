/**
 * Lógica de promoção de overrides para catálogos canônicos no Balance Lab.
 *
 * Catálogos JSON-backed (promovíveis automaticamente):
 *   - gear-items.catalog.json (scope: gear-items)
 *   - shops.catalog.json (scope: shops)
 *
 * Catálogos TS-backed (revisão manual — gera patch JSON):
 *   - hero-combat: HeroCombatSkillCatalog, HeroCombatIdentityCatalog etc.
 *   - hero-level-xp: campaignHeroXpRequired (TS inline)
 *   - enemy-combat: EnemyCombatIdentityCatalog, CombatSkillRegistry
 *   - upgrades: UpgradeCatalog
 *   - phase-battle: CampaignCatalog (gerado via phaseTemplateId)
 *   - phase-reward: PhaseXpBudget / PhaseGoldBudget
 */
import { readFile, writeFile, copyFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { diffJsonSnapshots } from './diff.mjs';
import { backupFile } from './backup.mjs';
import { SCOPE_MAP, GEAR_CATALOG_PATH, SHOP_CATALOG_PATH } from './paths.mjs';

/**
 * Scopes promovíveis automaticamente para JSON canonical.
 * Chave = scope id, value = caminho do catálogo canônico.
 */
const JSON_BACKED_CATALOGS = {
  'gear-items': GEAR_CATALOG_PATH,
  shops: SHOP_CATALOG_PATH,
};

/**
 * Verifica se um scope tem catálogo JSON promovível automaticamente.
 *
 * @param {string} scope
 * @returns {boolean}
 */
export function isScopeJsonBacked(scope) {
  return Object.prototype.hasOwnProperty.call(JSON_BACKED_CATALOGS, scope);
}

/**
 * Lê e faz parse do arquivo JSON de override para um scope.
 *
 * @param {string} scope
 * @returns {Promise<{ok: boolean, data?: unknown, error?: string}>}
 */
async function readScopeOverride(scope) {
  const info = SCOPE_MAP[scope];
  if (!info) return { ok: false, error: `Scope desconhecido: ${scope}` };
  try {
    const raw = await readFile(info.override, 'utf8');
    return { ok: true, data: JSON.parse(raw) };
  } catch {
    return { ok: false, error: 'Override vazio ou não existe' };
  }
}

/**
 * Lê e faz parse do catálogo canônico JSON de um scope.
 *
 * @param {string} scope
 * @returns {Promise<{ok: boolean, data?: unknown, error?: string}>}
 */
async function readScopeCatalog(scope) {
  const catalogPath = JSON_BACKED_CATALOGS[scope];
  if (!catalogPath) return { ok: false, error: `Scope sem catálogo JSON: ${scope}` };
  try {
    const raw = await readFile(catalogPath, 'utf8');
    return { ok: true, data: JSON.parse(raw) };
  } catch {
    return { ok: false, error: 'Catálogo canônico não encontrado' };
  }
}

/**
 * Merge de override sobre catálogo para gear-items:
 * Aplica cada chave de items[] do override sobre o catálogo canônico.
 *
 * @param {unknown} catalog
 * @param {unknown} override
 * @returns {unknown} Novo catálogo com overrides mesclados
 */
export function mergeGearItemsIntoCanonical(catalog, override) {
  if (!Array.isArray(catalog)) return catalog;
  if (!override || typeof override !== 'object') return catalog;

  const ov = /** @type {Record<string, unknown>} */ (override);
  const items = ov['items'];
  if (!items || typeof items !== 'object') return catalog;

  const result = JSON.parse(JSON.stringify(catalog));
  const itemsObj = /** @type {Record<string, unknown>} */ (items);
  const indexById = new Map(result.map((item, index) => [item.id, index]));

  for (const [id, patch] of Object.entries(itemsObj)) {
    const index = indexById.get(id);
    if (index === undefined || !patch || typeof patch !== 'object') continue;
    result[index] = { ...result[index], ...patch };
  }

  return result;
}

/**
 * Merge de override sobre catálogo para shops:
 * Aplica shops[] do override e remove deletedShopIds.
 *
 * @param {unknown} catalog
 * @param {unknown} override
 * @returns {unknown}
 */
export function mergeShopsIntoCanonical(catalog, override) {
  if (!Array.isArray(catalog)) return catalog;
  if (!override || typeof override !== 'object') return catalog;

  const ov = /** @type {Record<string, unknown>} */ (override);
  const shops = ov['shops'];
  const deletedIds = Array.isArray(ov['deletedShopIds']) ? ov['deletedShopIds'] : [];

  const result = JSON.parse(JSON.stringify(catalog));
  const indexById = new Map(result.map((shop, index) => [shop.id, index]));

  if (shops && typeof shops === 'object') {
    const shopsObj = /** @type {Record<string, unknown>} */ (shops);
    for (const [id, shopData] of Object.entries(shopsObj)) {
      if (!shopData || typeof shopData !== 'object') continue;
      const index = indexById.get(id);
      if (index !== undefined) {
        result[index] = { ...result[index], ...shopData };
      } else {
        result.push({ id, ...shopData });
        indexById.set(id, result.length - 1);
      }
    }
  }

  const deleted = new Set(deletedIds.filter((id) => typeof id === 'string'));
  return result.filter((shop) => !deleted.has(shop.id));
}

/**
 * Aplica merge de override sobre o catálogo canonical de acordo com o scope.
 *
 * @param {string} scope
 * @param {unknown} catalog
 * @param {unknown} override
 * @returns {unknown}
 */
function mergeOverrideIntoCanonical(scope, catalog, override) {
  if (scope === 'gear-items') return mergeGearItemsIntoCanonical(catalog, override);
  if (scope === 'shops') return mergeShopsIntoCanonical(catalog, override);
  return catalog;
}

/**
 * Gera preview de promoção: diff entre catálogo atual e catálogo com override aplicado.
 * Não escreve nada em disco.
 *
 * @param {string} scope
 * @returns {Promise<{
 *   ok: boolean,
 *   scope: string,
 *   isJsonBacked: boolean,
 *   tsBackedOnly: boolean,
 *   diff?: import('./diff.mjs').DiffEntry extends never ? object : ReturnType<typeof diffJsonSnapshots>,
 *   patchJson?: unknown,
 *   overrideKeys?: string[],
 *   error?: string
 * }>}
 */
export async function previewPromotion(scope) {
  const info = SCOPE_MAP[scope];
  if (!info) {
    return { ok: false, scope, isJsonBacked: false, tsBackedOnly: false, error: `Scope inválido: ${scope}` };
  }

  const isJsonBacked = isScopeJsonBacked(scope);
  const tsBackedOnly = info.tsBackedOnly;

  if (tsBackedOnly || !isJsonBacked) {
    const ovResult = await readScopeOverride(scope);
    if (!ovResult.ok) {
      return { ok: false, scope, isJsonBacked, tsBackedOnly, error: ovResult.error };
    }
    return {
      ok: true,
      scope,
      isJsonBacked: false,
      tsBackedOnly: true,
      patchJson: ovResult.data,
      overrideKeys: getTopLevelKeys(ovResult.data),
    };
  }

  const [catResult, ovResult] = await Promise.all([
    readScopeCatalog(scope),
    readScopeOverride(scope),
  ]);

  if (!catResult.ok) return { ok: false, scope, isJsonBacked, tsBackedOnly, error: catResult.error };
  if (!ovResult.ok) return { ok: false, scope, isJsonBacked, tsBackedOnly, error: ovResult.error };

  const merged = mergeOverrideIntoCanonical(scope, catResult.data, ovResult.data);
  const diff = diffJsonSnapshots(catResult.data, merged);

  return {
    ok: true,
    scope,
    isJsonBacked,
    tsBackedOnly,
    diff,
    overrideKeys: getTopLevelKeys(ovResult.data),
  };
}

/**
 * Aplica a promoção: mescla override no catálogo JSON, faz backup de ambos
 * e zera apenas as chaves promovidas do override.
 *
 * @param {string} scope
 * @param {Function} backupOverrideFn - Função que faz backup do override atual.
 * @returns {Promise<{ok: boolean, scope: string, backupCatalogPath: string | null, backupOverridePath: string | null, diff?: object, error?: string}>}
 */
export async function applyPromotion(scope, backupOverrideFn) {
  const info = SCOPE_MAP[scope];
  if (!info) return { ok: false, scope, backupCatalogPath: null, backupOverridePath: null, error: `Scope inválido: ${scope}` };

  if (!isScopeJsonBacked(scope)) {
    return {
      ok: false,
      scope,
      backupCatalogPath: null,
      backupOverridePath: null,
      error: 'Scope TS-backed não suporta promoção automática. Use o patch JSON gerado pelo preview.',
    };
  }

  const catalogPath = JSON_BACKED_CATALOGS[scope];
  const [catResult, ovResult] = await Promise.all([
    readScopeCatalog(scope),
    readScopeOverride(scope),
  ]);

  if (!catResult.ok) return { ok: false, scope, backupCatalogPath: null, backupOverridePath: null, error: catResult.error };
  if (!ovResult.ok) return { ok: false, scope, backupCatalogPath: null, backupOverridePath: null, error: ovResult.error };

  const merged = mergeOverrideIntoCanonical(scope, catResult.data, ovResult.data);
  const diff = diffJsonSnapshots(catResult.data, merged);
  const changeCount = diff.added.length + diff.removed.length + diff.changed.length;
  if (changeCount === 0) {
    return {
      ok: false,
      scope,
      backupCatalogPath: null,
      backupOverridePath: null,
      error: 'Nenhuma alteração promovível encontrada; o override foi preservado.',
    };
  }

  // Backup do catálogo antes de sobrescrever
  const backupsCatalogDir = join(dirname(catalogPath), 'backups', `${scope}-catalog-promotions`);
  const backupCatalogPath = await backupFile(catalogPath, backupsCatalogDir, `${scope}-catalog`);

  // Backup do override antes de limpar
  const backupOverridePath = await backupOverrideFn();

  // Escreve catálogo com overrides incorporados
  await mkdir(dirname(catalogPath), { recursive: true });
  await writeFile(catalogPath, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');

  // Zera override (mantém estrutura, limpa apenas chaves de dados)
  const cleared = buildClearedOverride(scope, ovResult.data);
  await writeFile(info.override, `${JSON.stringify(cleared, null, 2)}\n`, 'utf8');

  return {
    ok: true,
    scope,
    backupCatalogPath,
    backupOverridePath,
    diff,
    promotedAt: new Date().toISOString(),
  };
}

/**
 * Gera override limpo para um scope (zera as chaves de dados, mantém metadados).
 *
 * @param {string} scope
 * @param {unknown} override
 * @returns {unknown}
 */
function buildClearedOverride(scope, override) {
  if (!override || typeof override !== 'object') return override;
  const ov = /** @type {Record<string, unknown>} */ (override);

  const base = {
    version: (ov['version'] ?? 1),
    updatedAt: new Date().toISOString(),
  };

  if (scope === 'gear-items') return { ...base, items: {} };
  if (scope === 'shops') return { ...base, shops: {}, deletedShopIds: [] };
  return base;
}

/**
 * Retorna as chaves de nível raiz de um override (excluindo version/updatedAt).
 *
 * @param {unknown} override
 * @returns {string[]}
 */
function getTopLevelKeys(override) {
  if (!override || typeof override !== 'object') return [];
  const skip = new Set(['version', 'updatedAt']);
  return Object.keys(/** @type {object} */ (override)).filter((k) => !skip.has(k));
}
