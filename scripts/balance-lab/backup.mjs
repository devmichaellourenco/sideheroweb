/**
 * Utilitários de backup para o Balance Lab server.
 * Extrai a lógica repetida de backup/list de balance-lab.mjs.
 */
import { copyFile, mkdir, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Cria um backup timestampado de um arquivo de override.
 * Retorna o caminho do backup criado, ou null se o arquivo não existia.
 *
 * @param {string} sourcePath - Caminho do arquivo a ser copiado.
 * @param {string} backupsDir - Diretório de backups.
 * @param {string} prefix - Prefixo do nome do arquivo de backup (sem extensão).
 * @returns {Promise<string | null>}
 */
export async function backupFile(sourcePath, backupsDir, prefix) {
  await mkdir(backupsDir, { recursive: true });
  try {
    await readFile(sourcePath);
  } catch {
    return null;
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dest = join(backupsDir, `${prefix}-${stamp}.json`);
  await copyFile(sourcePath, dest);
  return dest;
}

/**
 * Lista backups JSON em um diretório, ordenados do mais recente ao mais antigo.
 *
 * @param {string} backupsDir
 * @returns {Promise<Array<{id: string, path: string}>>}
 */
export async function listBackupFiles(backupsDir) {
  await mkdir(backupsDir, { recursive: true });
  const names = await readdir(backupsDir);
  return names
    .filter((name) => name.endsWith('.json'))
    .sort()
    .reverse()
    .map((name) => ({ id: name, path: `backups/${name}` }));
}

/**
 * Verifica segurança de path: retorna true se o caminho resolvido
 * começar com o diretório esperado (prevenção de path traversal).
 *
 * @param {string} resolvedPath - Caminho absoluto resolvido.
 * @param {string} allowedDir - Diretório permitido (prefixo).
 * @returns {boolean}
 */
export function isPathSafe(resolvedPath, allowedDir) {
  const normalized = resolvedPath.replace(/\\/g, '/');
  const allowed = allowedDir.replace(/\\/g, '/');
  return normalized.startsWith(allowed.endsWith('/') ? allowed : `${allowed}/`)
    || normalized === allowed;
}
