import { ITaskRunner } from '../../application/ports/ITaskRunner';
import { SerialTaskRunnerAdapter } from '../../infrastructure/background/SerialTaskRunnerAdapter';

/** Serializa equipar/desequipar/otimizar na UI — evita cliques perdidos e corridas locais. */
export class GearMutationQueue {
  constructor(private readonly runner: ITaskRunner = new SerialTaskRunnerAdapter()) {}

  run<T>(task: () => Promise<T>): Promise<T> {
    return this.runner.run(task);
  }
}
