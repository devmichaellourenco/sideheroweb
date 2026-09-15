import { beforeEach, describe, expect, it } from 'vitest';
import { InProcessGameClient } from './InProcessGameClient';
import {
  createGameApplication,
  resetGameApplicationForTests,
  createStoragePorts,
} from '../di/createGameApplication';
import { createMemoryKeyValueStore } from '../storage/MemoryKeyValueStore';

describe('InProcessGameClient', () => {
  beforeEach(() => {
    resetGameApplicationForTests();
  });

  it('responde GET_STATE no mesmo processo', async () => {
    const app = createGameApplication(createStoragePorts(createMemoryKeyValueStore()));
    const client = new InProcessGameClient(app);

    const response = await client.send({ type: 'GET_STATE' });

    expect(response.ok).toBe(true);
    if (!response.ok) return;
    expect(response.state.heroes.length).toBeGreaterThan(0);
    expect(response.state.gold).toBeGreaterThanOrEqual(0);
    expect(client.isContextValid()).toBe(true);
  });

  it('serializa mensagens via SerialTaskRunner', async () => {
    const app = createGameApplication(createStoragePorts(createMemoryKeyValueStore()));
    const client = new InProcessGameClient(app);

    const [first, second] = await Promise.all([
      client.send({ type: 'GET_STATE' }),
      client.send({ type: 'GET_ACHIEVEMENTS' }),
    ]);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.totalAchievementCount).toBeGreaterThan(0);
  });
});
