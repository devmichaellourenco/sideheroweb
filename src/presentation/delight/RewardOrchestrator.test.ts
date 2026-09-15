import { describe, expect, it, vi } from 'vitest';
import { RewardMoment } from './types/RewardMoment';
import { RewardOrchestrator } from './RewardOrchestrator';

function moment(id: string, priority: number): RewardMoment {
  return {
    id,
    kind: 'level_up',
    tier: 'meso',
    priority,
    title: id,
    tone: 'level',
  };
}

describe('RewardOrchestrator', () => {
  it('processa momentos em ordem de prioridade', async () => {
    const order: string[] = [];
    const orchestrator = new RewardOrchestrator(async (entry) => {
      order.push(entry.id);
    });

    orchestrator.enqueue(moment('low', 10));
    orchestrator.enqueue(moment('high', 90));

    await vi.waitFor(() => {
      expect(order).toEqual(['high', 'low']);
    });
  });

  it('deduplica momentos com o mesmo id', async () => {
    let count = 0;
    const orchestrator = new RewardOrchestrator(async () => {
      count += 1;
    });

    orchestrator.enqueue(moment('same-id', 50));
    orchestrator.enqueue(moment('same-id', 50));

    await vi.waitFor(() => {
      expect(count).toBe(1);
    });
  });
});
