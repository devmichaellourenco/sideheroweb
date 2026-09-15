/**
 * Balance Pack — export/import de todos os overrides do workspace.
 * Formato versionado, validável sem I/O. Aplicação fica no servidor.
 */
import { diffJsonSnapshots } from './diff.mjs';
import { SCOPE_MAP } from './paths.mjs';

export const BALANCE_PACK_KIND = 'side-hero-balance-pack';
export const BALANCE_PACK_VERSION = 1;

/**
 * @returns {string[]}
 */
export function listBalancePackScopes() {
  return Object.keys(SCOPE_MAP);
}

/**
 * Heurística: scope “não-vazio” se houver alguma chave de dados além de
 * version/updatedAt (ex.: items, shops, overrides, levels…).
 *
 * @param {unknown} data
 * @returns {boolean}
 */
export function isScopePayloadNonempty(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const skip = new Set(['version', 'updatedAt']);
  for (const [key, value] of Object.entries(/** @type {Record<string, unknown>} */ (data))) {
    if (skip.has(key)) continue;
    if (Array.isArray(value) && value.length > 0) return true;
    if (value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0) {
      return true;
    }
    if (typeof value === 'string' && value.trim() !== '') return true;
    if (typeof value === 'number' || typeof value === 'boolean') return true;
  }
  return false;
}

/**
 * @param {Record<string, unknown>} scopes
 * @param {{ label?: string, exportedAt?: string }} [meta]
 */
export function buildBalancePack(scopes, meta = {}) {
  const scopeIds = listBalancePackScopes();
  /** @type {Record<string, unknown>} */
  const normalized = {};
  const nonemptyScopes = [];

  for (const id of scopeIds) {
    if (!(id in scopes)) continue;
    const payload = scopes[id];
    normalized[id] = payload;
    if (isScopePayloadNonempty(payload)) nonemptyScopes.push(id);
  }

  return {
    kind: BALANCE_PACK_KIND,
    version: BALANCE_PACK_VERSION,
    exportedAt: meta.exportedAt ?? new Date().toISOString(),
    label: typeof meta.label === 'string' && meta.label.trim() ? meta.label.trim() : null,
    scopes: normalized,
    meta: {
      scopeCount: Object.keys(normalized).length,
      nonemptyScopes,
    },
  };
}

/**
 * @param {unknown} raw
 * @returns {{ ok: true, pack: ReturnType<typeof buildBalancePack> } | { ok: false, error: string }}
 */
export function validateBalancePack(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'Pack inválido: raiz deve ser objeto' };
  }
  const pack = /** @type {Record<string, unknown>} */ (raw);
  if (pack.kind !== BALANCE_PACK_KIND) {
    return {
      ok: false,
      error: `Pack inválido: kind esperado "${BALANCE_PACK_KIND}", recebido "${String(pack.kind)}"`,
    };
  }
  if (pack.version !== BALANCE_PACK_VERSION) {
    return {
      ok: false,
      error: `Pack inválido: version esperada ${BALANCE_PACK_VERSION}, recebida ${String(pack.version)}`,
    };
  }
  if (!pack.scopes || typeof pack.scopes !== 'object' || Array.isArray(pack.scopes)) {
    return { ok: false, error: 'Pack inválido: scopes ausente ou inválido' };
  }

  const scopesObj = /** @type {Record<string, unknown>} */ (pack.scopes);
  const known = new Set(listBalancePackScopes());
  const unknown = Object.keys(scopesObj).filter((id) => !known.has(id));
  if (unknown.length > 0) {
    return { ok: false, error: `Scopes desconhecidos: ${unknown.join(', ')}` };
  }
  if (Object.keys(scopesObj).length === 0) {
    return { ok: false, error: 'Pack sem scopes' };
  }

  for (const [id, payload] of Object.entries(scopesObj)) {
    if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
      return { ok: false, error: `Scope "${id}" deve ser um objeto JSON de override` };
    }
  }

  const rebuilt = buildBalancePack(scopesObj, {
    label: typeof pack.label === 'string' ? pack.label : undefined,
    exportedAt: typeof pack.exportedAt === 'string' ? pack.exportedAt : undefined,
  });
  return { ok: true, pack: rebuilt };
}

/**
 * @param {ReturnType<typeof buildBalancePack>} pack
 * @param {Record<string, unknown>} currentByScope
 * @param {string[]} [onlyScopes]
 */
export function previewBalancePack(pack, currentByScope, onlyScopes) {
  const wanted = onlyScopes?.length
    ? onlyScopes.filter((id) => id in pack.scopes)
    : Object.keys(pack.scopes);

  const scopes = wanted.map((scope) => {
    const before = currentByScope[scope] ?? { version: 1, updatedAt: null };
    const after = pack.scopes[scope];
    const diff = diffJsonSnapshots(before, after);
    const changeCount = diff.added.length + diff.removed.length + diff.changed.length;
    return {
      scope,
      changeCount,
      nonempty: isScopePayloadNonempty(after),
      diff,
    };
  });

  const totalChanges = scopes.reduce((sum, row) => sum + row.changeCount, 0);
  return {
    ok: true,
    label: pack.label,
    exportedAt: pack.exportedAt,
    totalChanges,
    scopes,
  };
}

/**
 * Seleciona quais scopes aplicar a partir do pack + lista opcional.
 *
 * @param {ReturnType<typeof buildBalancePack>} pack
 * @param {string[] | undefined} onlyScopes
 * @returns {string[]}
 */
export function resolveImportScopes(pack, onlyScopes) {
  const available = Object.keys(pack.scopes);
  if (!onlyScopes || onlyScopes.length === 0) return available;
  return onlyScopes.filter((id) => available.includes(id));
}
