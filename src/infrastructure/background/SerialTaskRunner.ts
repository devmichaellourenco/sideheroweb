/** Garante execução sequencial de tarefas async (evita lost updates no storage). */
export class SerialTaskRunner {
  private tail: Promise<unknown> = Promise.resolve();

  run<T>(task: () => Promise<T>): Promise<T> {
    const run = this.tail.then(task, task);
    this.tail = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }
}
