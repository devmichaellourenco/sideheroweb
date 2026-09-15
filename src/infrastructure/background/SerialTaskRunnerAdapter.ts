import { ITaskRunner } from '../../application/ports/ITaskRunner';
import { SerialTaskRunner } from './SerialTaskRunner';

export class SerialTaskRunnerAdapter implements ITaskRunner {
  private readonly runner = new SerialTaskRunner();

  run<T>(task: () => Promise<T>): Promise<T> {
    return this.runner.run(task);
  }
}
