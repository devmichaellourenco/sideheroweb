/**
 * Rastreamento de versão do workspace para auto-reload do Balance Lab.
 * Calcula uma fingerprint baseada nos mtimes/tamanho dos arquivos monitorados.
 */
import { stat } from 'node:fs/promises';
import { SCOPE_MAP } from './paths.mjs';

/**
 * Coleta os mtimes de todos os arquivos override monitorados.
 * Retorna um objeto { [scope]: mtimeMs | null }.
 *
 * @returns {Promise<Record<string, number | null>>}
 */
export async function collectFileMtimes() {
  const result = {};
  for (const [scope, info] of Object.entries(SCOPE_MAP)) {
    try {
      const s = await stat(info.override);
      result[scope] = s.mtimeMs;
    } catch {
      result[scope] = null;
    }
  }
  return result;
}

/**
 * Gera uma versão string determinística baseada nos mtimes.
 * Formato: soma dos mtimes em hex truncada.
 *
 * @param {Record<string, number | null>} mtimes
 * @returns {string}
 */
export function computeVersionToken(mtimes) {
  const values = Object.values(mtimes).map((v) => (v ?? 0));
  const sum = values.reduce((acc, v) => acc + v, 0);
  return sum.toString(36);
}

/**
 * Retorna o payload completo da versão workspace para /api/workspace-version.
 *
 * @returns {Promise<{version: string, mtimes: Record<string, number | null>, checkedAt: string}>}
 */
export async function getWorkspaceVersion() {
  const mtimes = await collectFileMtimes();
  const version = computeVersionToken(mtimes);
  return {
    version,
    mtimes,
    checkedAt: new Date().toISOString(),
  };
}
