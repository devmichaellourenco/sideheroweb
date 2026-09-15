import { describe, expect, it } from 'vitest';
import { SerialTaskRunner } from './SerialTaskRunner';

describe('SerialTaskRunner', () => {
  it('executa tarefas em série sem sobrescrever estado intermediário', async () => {
    const runner = new SerialTaskRunner();
    const log: string[] = [];
    let value = 0;

    const first = runner.run(async () => {
      const snapshot = value;
      await new Promise((resolve) => setTimeout(resolve, 15));
      value = snapshot + 1;
      log.push('first');
    });

    const second = runner.run(async () => {
      const snapshot = value;
      await new Promise((resolve) => setTimeout(resolve, 5));
      value = snapshot + 10;
      log.push('second');
    });

    await Promise.all([first, second]);

    expect(log).toEqual(['first', 'second']);
    expect(value).toBe(11);
  });
});
