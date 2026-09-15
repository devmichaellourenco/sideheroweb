/**
 * Diff recursivo de dois objetos JSON para o Balance Lab.
 * Produz entradas { path, before, after } classificadas em added/removed/changed.
 */

/**
 * @typedef {Object} DiffEntry
 * @property {string} path - Caminho JSON com separador '.', ex: "items.iron_sword.basePrice"
 * @property {unknown} before - Valor no snapshot A (undefined = chave não existia)
 * @property {unknown} after  - Valor no snapshot B (undefined = chave não existe mais)
 * @property {'added'|'removed'|'changed'} kind
 */

/**
 * Compara dois valores JSON recursivamente e acumula as diferenças.
 *
 * @param {unknown} a - Objeto/valor A (antes)
 * @param {unknown} b - Objeto/valor B (depois)
 * @param {string} prefix - Prefixo de caminho atual
 * @param {DiffEntry[]} out - Array de saída mutável
 */
function diffRecursive(a, b, prefix, out) {
  const isObjA = a !== null && typeof a === 'object' && !Array.isArray(a);
  const isObjB = b !== null && typeof b === 'object' && !Array.isArray(b);

  if (isObjA && isObjB) {
    const keysA = Object.keys(/** @type {object} */ (a));
    const keysB = Object.keys(/** @type {object} */ (b));
    const allKeys = new Set([...keysA, ...keysB]);

    for (const key of allKeys) {
      const safeKey = key.includes('.') ? `["${key}"]` : `.${key}`;
      const nextPrefix = prefix ? `${prefix}${safeKey}` : key;
      const valA = /** @type {Record<string,unknown>} */ (a)[key];
      const valB = /** @type {Record<string,unknown>} */ (b)[key];

      if (!(key in /** @type {object} */ (a))) {
        out.push({ path: nextPrefix, before: undefined, after: valB, kind: 'added' });
      } else if (!(key in /** @type {object} */ (b))) {
        out.push({ path: nextPrefix, before: valA, after: undefined, kind: 'removed' });
      } else {
        diffRecursive(valA, valB, nextPrefix, out);
      }
    }
    return;
  }

  if (JSON.stringify(a) !== JSON.stringify(b)) {
    const kind = a === undefined ? 'added' : b === undefined ? 'removed' : 'changed';
    out.push({ path: prefix || '(root)', before: a, after: b, kind });
  }
}

/**
 * Gera diff completo entre dois snapshots JSON.
 *
 * @param {unknown} snapA - Objeto/valor A (antes)
 * @param {unknown} snapB - Objeto/valor B (depois)
 * @returns {{ added: DiffEntry[], removed: DiffEntry[], changed: DiffEntry[] }}
 */
export function diffJsonSnapshots(snapA, snapB) {
  /** @type {DiffEntry[]} */
  const entries = [];
  diffRecursive(snapA, snapB, '', entries);

  return {
    added: entries.filter((e) => e.kind === 'added'),
    removed: entries.filter((e) => e.kind === 'removed'),
    changed: entries.filter((e) => e.kind === 'changed'),
  };
}
