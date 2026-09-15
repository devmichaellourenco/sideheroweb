import { IKeyValueStore } from './IKeyValueStore';

export function createMemoryKeyValueStore(
  initial: Record<string, unknown> = {},
): IKeyValueStore {
  const data: Record<string, unknown> = { ...initial };

  return {
    async get(keys) {
      const keyList = Array.isArray(keys) ? keys : [keys];
      const result: Record<string, unknown> = {};
      for (const key of keyList) {
        if (key in data) {
          result[key] = data[key];
        }
      }
      return result;
    },

    async set(items) {
      Object.assign(data, items);
    },

    async remove(keys) {
      const keyList = Array.isArray(keys) ? keys : [keys];
      for (const key of keyList) {
        delete data[key];
      }
    },
  };
}
