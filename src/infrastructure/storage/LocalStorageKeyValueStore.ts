import { IKeyValueStore } from './IKeyValueStore';

function keyList(keys: string | string[]): string[] {
  return Array.isArray(keys) ? keys : [keys];
}

export function formatStorageQuotaError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (
    normalized.includes('no_space') ||
    normalized.includes('quota_bytes') ||
    normalized.includes('quota_exceeded')
  ) {
    return 'Sem espaço para salvar o progresso. Libere espaço no disco e tente novamente.';
  }

  return message;
}

export function createLocalStorageKeyValueStore(
  storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> = globalThis.localStorage,
): IKeyValueStore {
  return {
    async get(keys) {
      const result: Record<string, unknown> = {};
      for (const key of keyList(keys)) {
        const raw = storage.getItem(key);
        if (raw == null) continue;
        try {
          result[key] = JSON.parse(raw) as unknown;
        } catch {
          result[key] = raw;
        }
      }
      return result;
    },

    async set(items) {
      try {
        for (const [key, value] of Object.entries(items)) {
          storage.setItem(key, JSON.stringify(value));
        }
      } catch (error) {
        throw new Error(formatStorageQuotaError(error));
      }
    },

    async remove(keys) {
      for (const key of keyList(keys)) {
        storage.removeItem(key);
      }
    },
  };
}
