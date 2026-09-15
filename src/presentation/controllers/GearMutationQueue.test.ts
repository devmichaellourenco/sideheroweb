import { describe, expect, it } from 'vitest';
import { GearMutationQueue } from './GearMutationQueue';

describe('GearMutationQueue', () => {
  it('enfileira mutações de equipamento em ordem', async () => {
    const queue = new GearMutationQueue();
    const log: string[] = [];

    await Promise.all([
      queue.run(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        log.push('first');
      }),
      queue.run(async () => {
        log.push('second');
      }),
    ]);

    expect(log).toEqual(['first', 'second']);
  });
});
