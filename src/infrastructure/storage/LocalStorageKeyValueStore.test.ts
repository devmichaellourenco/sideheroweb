import { describe, expect, it } from 'vitest';
import { createLocalStorageKeyValueStore } from './LocalStorageKeyValueStore';

function createFakeStorage(options?: { throwOnSet?: Error }): {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  snapshot: () => Record<string, string>;
} {
  const map = new Map<string, string>();
  return {
    getItem(key) {
      return map.get(key) ?? null;
    },
    setItem(key, value) {
      if (options?.throwOnSet) throw options.throwOnSet;
      map.set(key, value);
    },
    removeItem(key) {
      map.delete(key);
    },
    snapshot() {
      return Object.fromEntries(map);
    },
  };
}

describe('LocalStorageKeyValueStore', () => {
  it('faz roundtrip JSON de objetos', async () => {
    const storage = createFakeStorage();
    const store = createLocalStorageKeyValueStore(storage);

    await store.set({ side_hero_game_state: { gold: 42, roster: ['a'] } });
    const result = await store.get(['side_hero_game_state', 'missing']);

    expect(result.side_hero_game_state).toEqual({ gold: 42, roster: ['a'] });
    expect(result).not.toHaveProperty('missing');
    expect(JSON.parse(storage.snapshot().side_hero_game_state)).toEqual({
      gold: 42,
      roster: ['a'],
    });
  });

  it('remove chaves', async () => {
    const storage = createFakeStorage();
    const store = createLocalStorageKeyValueStore(storage);
    await store.set({ a: 1, b: 2 });
    await store.remove('a');

    const result = await store.get(['a', 'b']);
    expect(result).not.toHaveProperty('a');
    expect(result.b).toBe(2);
  });

  it('traduz erro de quota', async () => {
    const quota = new Error('QuotaExceededError: quota_exceeded');
    const store = createLocalStorageKeyValueStore(createFakeStorage({ throwOnSet: quota }));

    await expect(store.set({ k: { big: true } })).rejects.toThrow('Sem espaço para salvar');
  });
});
