/**
 * Codec de backup ofuscado (AES-GCM).
 * A chave fica no cliente — barreira contra edição casual, não anti-cheat absoluto.
 */

export const SAVE_BACKUP_FILE_PREFIX = 'SHSAVE1.';
export const SAVE_BACKUP_FORMAT_VERSION = 1;
export const SAVE_BACKUP_EXTENSION = 'sidehero';

/** Passphrase embutida: ofuscação, não segredo de servidor. */
const BACKUP_PASSPHRASE = 'side-hero-local-backup-v1';
const BACKUP_SALT = new TextEncoder().encode('side-hero-backup-salt-v1');
const PBKDF2_ITERATIONS = 120_000;
const IV_BYTES = 12;

export interface SaveBackupPayload {
  formatVersion: number;
  exportedAt: number;
  gameState: unknown;
  achievements: unknown;
  meta: unknown;
}

function getCrypto(): Crypto {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.subtle) {
    throw new Error('Web Crypto indisponível para backup');
  }
  return cryptoApi;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function deriveKey(cryptoApi: Crypto): Promise<CryptoKey> {
  const material = await cryptoApi.subtle.importKey(
    'raw',
    new TextEncoder().encode(BACKUP_PASSPHRASE),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return cryptoApi.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: BACKUP_SALT,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export function isSaveBackupPayload(value: unknown): value is SaveBackupPayload {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    record.formatVersion === SAVE_BACKUP_FORMAT_VERSION &&
    typeof record.exportedAt === 'number' &&
    'gameState' in record &&
    'achievements' in record &&
    'meta' in record
  );
}

export function buildSaveBackupPayload(input: {
  gameState: unknown;
  achievements: unknown;
  meta: unknown;
  exportedAt?: number;
}): SaveBackupPayload {
  return {
    formatVersion: SAVE_BACKUP_FORMAT_VERSION,
    exportedAt: input.exportedAt ?? Date.now(),
    gameState: input.gameState,
    achievements: input.achievements,
    meta: input.meta,
  };
}

export async function encryptSaveBackup(payload: SaveBackupPayload): Promise<string> {
  const cryptoApi = getCrypto();
  const key = await deriveKey(cryptoApi);
  const iv = cryptoApi.getRandomValues(new Uint8Array(IV_BYTES));
  const plain = new TextEncoder().encode(JSON.stringify(payload));
  const cipherBuffer = await cryptoApi.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain);
  const cipher = new Uint8Array(cipherBuffer);
  const packed = new Uint8Array(iv.length + cipher.length);
  packed.set(iv, 0);
  packed.set(cipher, iv.length);
  return `${SAVE_BACKUP_FILE_PREFIX}${bytesToBase64(packed)}`;
}

export async function decryptSaveBackup(fileContents: string): Promise<SaveBackupPayload> {
  const trimmed = fileContents.trim();
  if (!trimmed.startsWith(SAVE_BACKUP_FILE_PREFIX)) {
    throw new Error('Arquivo de backup inválido');
  }

  const packed = base64ToBytes(trimmed.slice(SAVE_BACKUP_FILE_PREFIX.length));
  if (packed.length <= IV_BYTES) {
    throw new Error('Arquivo de backup corrompido');
  }

  const cryptoApi = getCrypto();
  const key = await deriveKey(cryptoApi);
  const iv = packed.slice(0, IV_BYTES);
  const cipher = packed.slice(IV_BYTES);

  let plainBuffer: ArrayBuffer;
  try {
    plainBuffer = await cryptoApi.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
  } catch {
    throw new Error('Não foi possível ler o backup (arquivo adulterado ou incompatível)');
  }

  const json = new TextDecoder().decode(plainBuffer);
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('Backup descriptografado está corrompido');
  }

  if (!isSaveBackupPayload(parsed)) {
    throw new Error('Formato de backup não suportado');
  }

  return parsed;
}

export function buildSaveBackupFileName(exportedAt: number = Date.now()): string {
  const stamp = new Date(exportedAt).toISOString().replace(/[:.]/g, '-');
  return `side-hero-save-${stamp}.${SAVE_BACKUP_EXTENSION}`;
}
